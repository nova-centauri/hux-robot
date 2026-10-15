// Hux V1-PROOF bench firmware.
//
// One Pico 2, one LSM6DSO IMU on SPI1, one Pololu 4752 gearmotor with its
// encoder and one DRV8874 driver, on a fixture with the wheel lifted.
// Modes: DISARMED, BENCH_ARMED, FAULT. Commands arrive as ASCII lines over
// USB serial. One telemetry line goes out at 50 Hz.
//
// The command contract is in docs/electronics-bench-guide.md.

#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "hardware/gpio.h"
#include "hardware/watchdog.h"
#include "pico/stdlib.h"
#include "pico/time.h"

#include "drv8874.h"
#include "encoder.h"
#include "lsm6dso.h"
#include "pins.h"

#ifndef HUX_BUILD_ID
#define HUX_BUILD_ID "dev"
#endif
#define HUX_FW_VERSION "bench-0.1.0"

typedef enum { MODE_DISARMED = 0, MODE_BENCH_ARMED, MODE_FAULT } mode_t_;
typedef enum { MOTION_NONE = 0, MOTION_JOG, MOTION_SPEED, MOTION_FOLLOW } motion_t;

static const char *MODE_NAMES[] = { "DISARMED", "BENCH_ARMED", "FAULT" };

static struct {
    mode_t_ mode;
    motion_t motion;
    char fault_reason[32];

    // commands and permission
    uint32_t last_cmd_ms;
    bool tele_on;
    bool imu_stream_on;
    bool rail_check_on;

    // IMU
    bool imu_ok;
    lsm6dso_sample imu;
    float pitch_deg;
    bool pitch_init;
    volatile uint32_t int1_edges;
    uint32_t int1_rate_hz;
    uint32_t int1_last_ms;
    uint32_t int1_last_edges;

    // wheel
    int32_t enc_raw;
    int32_t enc_zero;
    float speed_rpm;
    float current_a;
    float rail_v;
    bool drv_fault;

    // motion
    float jog_duty_target;
    uint32_t jog_end_ms;
    float speed_target;      // requested
    float speed_ramped;      // after the ramp
    float follow_gain;
    float duty_cmd;          // what is applied
    float pi_integ;
    float kp, ki;

    // timing
    uint32_t loop_us;
    uint32_t period_us;
} S;

static inline uint32_t now_ms(void) { return to_ms_since_boot(get_absolute_time()); }

static void int1_irq(uint gpio, uint32_t events) {
    (void)gpio; (void)events;
    S.int1_edges++;
}

// ---------------------------------------------------------------------------
// mode transitions
// ---------------------------------------------------------------------------
static void apply_outputs_off(void) {
    drv8874_set_duty(0.0f);
    drv8874_set_sleep(false);
    S.duty_cmd = 0.0f;
    S.pi_integ = 0.0f;
    S.speed_ramped = 0.0f;
    S.speed_target = 0.0f;
    S.motion = MOTION_NONE;
}

static void enter_fault(const char *reason) {
    apply_outputs_off();
    S.mode = MODE_FAULT;
    strncpy(S.fault_reason, reason, sizeof S.fault_reason - 1);
    S.fault_reason[sizeof S.fault_reason - 1] = 0;
    printf("F,%lu,%s\n", (unsigned long)now_ms(), S.fault_reason);
}

static void disarm(void) {
    apply_outputs_off();
    S.mode = MODE_DISARMED;
    S.fault_reason[0] = 0;
}

static bool arm(void) {
    if (S.mode == MODE_BENCH_ARMED) return true;
    if (S.rail_check_on && S.rail_v < RAIL_PRESENT_V) {
        printf("ERR rail %.1f V below %.1f V. Press ARM on the kill chain first.\n",
               S.rail_v, (double)RAIL_PRESENT_V);
        return false;
    }
    if (drv8874_fault_active()) {
        printf("ERR nFAULT is low\n");
        return false;
    }
    apply_outputs_off();
    S.fault_reason[0] = 0;
    S.last_cmd_ms = now_ms();
    drv8874_set_sleep(true);
    S.mode = MODE_BENCH_ARMED;
    return true;
}

// ---------------------------------------------------------------------------
// command handling
// ---------------------------------------------------------------------------
static float clampf(float v, float lo, float hi) { return v < lo ? lo : (v > hi ? hi : v); }

static void print_id(void) {
    printf("ID,%s,%s,who_am_i=0x%02X,imu=%s,control_hz=%d,deadman_ms=%d,watchdog_ms=%d\n",
           HUX_FW_VERSION, HUX_BUILD_ID, lsm6dso_read_reg(LSM6DSO_REG_WHO_AM_I),
           S.imu_ok ? "ok" : "absent", CONTROL_HZ, DEADMAN_MS, WATCHDOG_MS);
    printf("H,T,ms,mode,fault,ax_g,ay_g,az_g,gx_dps,gy_dps,gz_dps,pitch_deg,enc_counts,"
           "speed_rpm,duty_pct,current_A,nfault,loop_us,rail_V\n");
}

static void print_help(void) {
    printf("# id | imu on|off | imu rate | imu regs | enc | zero | arm | jog <duty%%> <ms> | "
           "speed <rpm> | follow <gain> | stop | disarm | k | tele on|off | rail on|off | "
           "kp <v> | ki <v> | hang | help\n");
}

static bool require_armed(const char *cmd) {
    if (S.mode != MODE_BENCH_ARMED) {
        printf("ERR %s needs BENCH_ARMED (mode %s)\n", cmd, MODE_NAMES[S.mode]);
        return false;
    }
    return true;
}

static void handle_line(char *line) {
    // tokenize
    char *argv[4] = { 0 };
    int argc = 0;
    for (char *tok = strtok(line, " \t\r\n"); tok && argc < 4; tok = strtok(NULL, " \t\r\n")) {
        argv[argc++] = tok;
    }
    if (argc == 0) return;
    const char *cmd = argv[0];

    if (!strcmp(cmd, "id")) { print_id(); return; }
    if (!strcmp(cmd, "help") || !strcmp(cmd, "?")) { print_help(); return; }
    if (!strcmp(cmd, "k")) { S.last_cmd_ms = now_ms(); return; }

    if (!strcmp(cmd, "imu")) {
        if (argc > 1 && !strcmp(argv[1], "on")) { S.imu_stream_on = true; printf("OK imu on\n"); }
        else if (argc > 1 && !strcmp(argv[1], "off")) { S.imu_stream_on = false; printf("OK imu off\n"); }
        else if (argc > 1 && !strcmp(argv[1], "rate")) {
            printf("R,int1_edges_per_s=%lu\n", (unsigned long)S.int1_rate_hz);
        } else if (argc > 1 && !strcmp(argv[1], "regs")) {
            printf("REG,WHO_AM_I=0x%02X,CTRL1_XL=0x%02X,CTRL2_G=0x%02X,CTRL3_C=0x%02X,"
                   "CTRL9_XL=0x%02X,INT1_CTRL=0x%02X,STATUS=0x%02X\n",
                   lsm6dso_read_reg(LSM6DSO_REG_WHO_AM_I), lsm6dso_read_reg(LSM6DSO_REG_CTRL1_XL),
                   lsm6dso_read_reg(LSM6DSO_REG_CTRL2_G), lsm6dso_read_reg(LSM6DSO_REG_CTRL3_C),
                   lsm6dso_read_reg(LSM6DSO_REG_CTRL9_XL), lsm6dso_read_reg(LSM6DSO_REG_INT1_CTRL),
                   lsm6dso_read_reg(LSM6DSO_REG_STATUS));
        } else if (argc > 1 && !strcmp(argv[1], "init")) {
            S.imu_ok = lsm6dso_init();
            printf("%s imu init\n", S.imu_ok ? "OK" : "ERR");
        } else printf("ERR imu on|off|rate|regs|init\n");
        return;
    }
    if (!strcmp(cmd, "enc")) {
        printf("E,%ld,%.2f\n", (long)(S.enc_raw - S.enc_zero), S.speed_rpm);
        return;
    }
    if (!strcmp(cmd, "zero")) { S.enc_zero = S.enc_raw; printf("OK zero\n"); return; }
    if (!strcmp(cmd, "tele")) {
        S.tele_on = !(argc > 1 && !strcmp(argv[1], "off"));
        printf("OK tele %s\n", S.tele_on ? "on" : "off");
        return;
    }
    if (!strcmp(cmd, "rail")) {
        S.rail_check_on = (argc > 1 && !strcmp(argv[1], "on"));
        printf("OK rail check %s (now %.1f V)\n", S.rail_check_on ? "on" : "off", S.rail_v);
        return;
    }
    if (!strcmp(cmd, "kp") && argc > 1) { S.kp = clampf(strtof(argv[1], NULL), 0.0f, 10.0f); printf("OK kp %.3f\n", S.kp); return; }
    if (!strcmp(cmd, "ki") && argc > 1) { S.ki = clampf(strtof(argv[1], NULL), 0.0f, 50.0f); printf("OK ki %.3f\n", S.ki); return; }

    if (!strcmp(cmd, "arm")) {
        if (S.mode == MODE_FAULT) printf("# clearing fault: %s\n", S.fault_reason);
        if (arm()) printf("OK arm\n");
        return;
    }
    if (!strcmp(cmd, "disarm")) { disarm(); printf("OK disarm\n"); return; }
    if (!strcmp(cmd, "stop")) {
        if (S.mode == MODE_BENCH_ARMED) {
            S.motion = MOTION_SPEED;      // ramp to zero through the speed loop
            S.speed_target = 0.0f;
            S.last_cmd_ms = now_ms();
        }
        printf("OK stop\n");
        return;
    }
    if (!strcmp(cmd, "jog")) {
        if (!require_armed(cmd)) return;
        if (argc < 3) { printf("ERR jog <duty%%> <ms>\n"); return; }
        float d = strtof(argv[1], NULL);
        long ms = strtol(argv[2], NULL, 10);
        if (fabsf(d) > LIMIT_DUTY_PCT || ms <= 0 || ms > LIMIT_JOG_MS) {
            printf("ERR jog limits: |duty| <= %.0f%%, 1..%d ms\n", (double)LIMIT_DUTY_PCT, LIMIT_JOG_MS);
            return;
        }
        S.motion = MOTION_JOG;
        S.jog_duty_target = d;
        S.jog_end_ms = now_ms() + (uint32_t)ms;
        S.last_cmd_ms = now_ms();
        printf("OK jog %.1f%% %ld ms\n", d, ms);
        return;
    }
    if (!strcmp(cmd, "speed")) {
        if (!require_armed(cmd)) return;
        if (argc < 2) { printf("ERR speed <rpm>\n"); return; }
        float r = strtof(argv[1], NULL);
        if (fabsf(r) > LIMIT_SPEED_RPM) { printf("ERR |rpm| <= %.0f\n", (double)LIMIT_SPEED_RPM); return; }
        if (S.motion != MOTION_SPEED) { S.pi_integ = 0.0f; S.speed_ramped = S.speed_rpm; }
        S.motion = MOTION_SPEED;
        S.speed_target = r;
        S.last_cmd_ms = now_ms();
        printf("OK speed %.1f rpm\n", r);
        return;
    }
    if (!strcmp(cmd, "follow")) {
        if (!require_armed(cmd)) return;
        if (!S.imu_ok) { printf("ERR follow needs the IMU\n"); return; }
        if (argc < 2) { printf("ERR follow <rpm_per_deg>\n"); return; }
        float g = strtof(argv[1], NULL);
        if (fabsf(g) > LIMIT_FOLLOW_GAIN) { printf("ERR |gain| <= %.1f\n", (double)LIMIT_FOLLOW_GAIN); return; }
        if (S.motion != MOTION_FOLLOW) { S.pi_integ = 0.0f; S.speed_ramped = S.speed_rpm; }
        S.motion = MOTION_FOLLOW;
        S.follow_gain = g;
        S.last_cmd_ms = now_ms();
        printf("OK follow %.2f rpm/deg\n", g);
        return;
    }
    if (!strcmp(cmd, "hang")) {
        if (S.mode != MODE_DISARMED) { printf("ERR hang only in DISARMED\n"); return; }
        printf("OK hang: main loop stops, the watchdog resets the board in %d ms\n", WATCHDOG_MS);
        sleep_ms(20);
        while (true) tight_loop_contents();
    }
    printf("ERR unknown command '%s'\n", cmd);
}

static void poll_serial(void) {
    static char buf[96];
    static size_t n;
    for (;;) {
        int c = getchar_timeout_us(0);
        if (c == PICO_ERROR_TIMEOUT) break;
        if (c == '\n' || c == '\r') {
            if (n) { buf[n] = 0; handle_line(buf); n = 0; }
        } else if (n < sizeof buf - 1) {
            buf[n++] = (char)c;
        } else {
            n = 0;   // discard an overlong line
        }
    }
}

// ---------------------------------------------------------------------------
// control
// ---------------------------------------------------------------------------
static void supervise(uint32_t t_ms) {
    if (S.mode != MODE_BENCH_ARMED) return;
    if (S.drv_fault)                                   { enter_fault("nFAULT"); return; }
    if (S.current_a > LIMIT_CURRENT_A)                 { enter_fault("overcurrent"); return; }
    if (fabsf(S.speed_rpm) > LIMIT_OVERSPEED_RPM)      { enter_fault("overspeed"); return; }
    if (S.period_us > LOOP_OVERRUN_US)                 { enter_fault("loop_overrun"); return; }
    if (S.rail_check_on && S.rail_v < RAIL_PRESENT_V)  { enter_fault("rail_lost"); return; }
    if (S.motion != MOTION_NONE && (t_ms - S.last_cmd_ms) > DEADMAN_MS) {
        enter_fault("stale_command");
        return;
    }
}

static void control(uint32_t t_ms, float dt) {
    if (S.mode != MODE_BENCH_ARMED) return;
    float duty = 0.0f;

    switch (S.motion) {
    case MOTION_NONE:
        duty = 0.0f;
        break;
    case MOTION_JOG: {
        float target = (t_ms < S.jog_end_ms) ? S.jog_duty_target : 0.0f;
        float step = RAMP_DUTY_PCT_PER_S * dt;
        duty = S.duty_cmd + clampf(target - S.duty_cmd, -step, step);
        if (t_ms >= S.jog_end_ms && fabsf(duty) < 0.5f) { duty = 0.0f; S.motion = MOTION_NONE; }
        break;
    }
    case MOTION_SPEED:
    case MOTION_FOLLOW: {
        float target = S.speed_target;
        if (S.motion == MOTION_FOLLOW) {
            target = clampf(S.follow_gain * S.pitch_deg, -LIMIT_SPEED_RPM, LIMIT_SPEED_RPM);
        }
        float step = RAMP_RPM_PER_S * dt;
        S.speed_ramped += clampf(target - S.speed_ramped, -step, step);
        float err = S.speed_ramped - S.speed_rpm;
        S.pi_integ += err * dt;
        if (S.ki > 0.0f) {
            float lim = LIMIT_DUTY_PCT / S.ki;
            S.pi_integ = clampf(S.pi_integ, -lim, lim);
        }
        duty = S.kp * err + S.ki * S.pi_integ;
        // A finished stop: zero target, zero ramp, slow wheel -> release.
        if (S.motion == MOTION_SPEED && S.speed_target == 0.0f && S.speed_ramped == 0.0f &&
            fabsf(S.speed_rpm) < 0.5f) {
            duty = 0.0f; S.pi_integ = 0.0f; S.motion = MOTION_NONE;
        }
        break;
    }
    }
    duty = clampf(duty, -LIMIT_DUTY_PCT, LIMIT_DUTY_PCT);
    S.duty_cmd = duty;
    drv8874_set_duty(duty);
}

static void update_pitch(float dt) {
    float acc_angle = PITCH_ACC_ANGLE(S.imu.acc_g) * 57.29578f;
    float rate = PITCH_RATE_FROM(S.imu.gyro_dps);
    if (!S.pitch_init) { S.pitch_deg = acc_angle; S.pitch_init = true; return; }
    S.pitch_deg = 0.98f * (S.pitch_deg + rate * dt) + 0.02f * acc_angle;
}

static void led_update(uint32_t t_ms) {
    bool on;
    switch (S.mode) {
    case MODE_DISARMED:    on = (t_ms % 1000) < 100; break;
    case MODE_BENCH_ARMED: on = (t_ms % 250) < 125; break;
    default:               on = true; break;
    }
    gpio_put(PIN_LED, on);
}

// ---------------------------------------------------------------------------
int main(void) {
    // First instruction: both drivers asleep.
    drv8874_outputs_off_early();

    gpio_init(PIN_HEARTBEAT);
    gpio_set_dir(PIN_HEARTBEAT, GPIO_OUT);
    gpio_init(PIN_LED);
    gpio_set_dir(PIN_LED, GPIO_OUT);

    stdio_init_all();

    bool wd_reboot = watchdog_caused_reboot();

    drv8874_init();
    encoder_init();
    lsm6dso_bus_init();
    sleep_ms(50);
    S.imu_ok = lsm6dso_init();
    gpio_set_irq_enabled_with_callback(PIN_IMU_INT1, GPIO_IRQ_EDGE_RISE, true, &int1_irq);

    S.mode = MODE_DISARMED;
    S.tele_on = true;
    S.kp = 0.8f;
    S.ki = 3.0f;
    S.rail_check_on = false;   // enable with "rail on" after the kill chain is built

    // Give the host a moment to open the port, then announce.
    sleep_ms(500);
    printf("\n# Hux bench firmware %s (%s)\n", HUX_FW_VERSION, HUX_BUILD_ID);
    if (wd_reboot) printf("# NOTICE: the hardware watchdog reset the board. Mode is DISARMED.\n");
    if (!S.imu_ok) printf("# WARNING: IMU not found or readback mismatch (WHO_AM_I 0x%02X)\n",
                          lsm6dso_read_reg(LSM6DSO_REG_WHO_AM_I));
    print_id();
    print_help();

    watchdog_enable(WATCHDOG_MS, true);

    absolute_time_t next = get_absolute_time();
    absolute_time_t last_loop = next;
    uint32_t loop_i = 0;
    uint32_t last_speed_ms = now_ms();
    S.int1_last_ms = now_ms();

    for (;;) {
        next = delayed_by_us(next, CONTROL_PERIOD_US);
        sleep_until(next);
        absolute_time_t t0 = get_absolute_time();
        S.period_us = (uint32_t)absolute_time_diff_us(last_loop, t0);
        last_loop = t0;
        float dt = S.period_us * 1e-6f;
        uint32_t t_ms = now_ms();

        watchdog_update();
        gpio_xor_mask(1u << PIN_HEARTBEAT);

        // sensors
        if (S.imu_ok) {
            lsm6dso_read(&S.imu);
            update_pitch(dt);
        }
        S.enc_raw = encoder_count();
        if (t_ms - last_speed_ms >= SPEED_EST_PERIOD_MS) {
            S.speed_rpm = encoder_update_speed(S.enc_raw, t_ms);
            S.rail_v = drv8874_read_rail_v();
            last_speed_ms = t_ms;
        }
        S.current_a = drv8874_read_current_a();
        S.drv_fault = drv8874_fault_active();
        if (t_ms - S.int1_last_ms >= 1000) {
            uint32_t e = S.int1_edges;
            S.int1_rate_hz = e - S.int1_last_edges;
            S.int1_last_edges = e;
            S.int1_last_ms = t_ms;
        }

        supervise(t_ms);
        control(t_ms, dt);
        // Second toggle: one full heartbeat cycle per control period (500 Hz
        // square wave) for the charge-pump detector of the kill chain.
        gpio_xor_mask(1u << PIN_HEARTBEAT);

        // host
        poll_serial();

        // output
        if (S.imu_stream_on && (loop_i % (CONTROL_HZ / 100)) == 0) {
            printf("I,%lu,%.4f,%.4f,%.4f,%.2f,%.2f,%.2f\n", (unsigned long)t_ms,
                   S.imu.acc_g.x, S.imu.acc_g.y, S.imu.acc_g.z,
                   S.imu.gyro_dps.x, S.imu.gyro_dps.y, S.imu.gyro_dps.z);
        }
        if (S.tele_on && (loop_i % (CONTROL_HZ / TELEMETRY_HZ)) == 0) {
            printf("T,%lu,%s,%s,%.3f,%.3f,%.3f,%.1f,%.1f,%.1f,%.2f,%ld,%.2f,%.1f,%.2f,%d,%lu,%.1f\n",
                   (unsigned long)t_ms, MODE_NAMES[S.mode], S.fault_reason[0] ? S.fault_reason : "-",
                   S.imu.acc_g.x, S.imu.acc_g.y, S.imu.acc_g.z,
                   S.imu.gyro_dps.x, S.imu.gyro_dps.y, S.imu.gyro_dps.z,
                   S.pitch_deg, (long)(S.enc_raw - S.enc_zero), S.speed_rpm, S.duty_cmd,
                   S.current_a, S.drv_fault ? 0 : 1, (unsigned long)S.loop_us, S.rail_v);
        }
        led_update(t_ms);

        S.loop_us = (uint32_t)absolute_time_diff_us(t0, get_absolute_time());
        loop_i++;
    }
}

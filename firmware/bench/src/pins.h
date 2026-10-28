// Hux V1-PROOF bench firmware: pin allocation and commissioning limits.
//
// The GPIO numbers follow docs/v1-proof-hardware.md ("Interfaces that must be
// built correctly") and the EL-02 / EL-03 wiring sheets. Change a pin here and
// in the wiring sheet in the same commit.
#ifndef HUX_PINS_H
#define HUX_PINS_H

// ---- Left wheel channel (the only channel on the first bench) -------------
#define PIN_ENC_A        2   // encoder A through 5 V -> 3.3 V divider (B = GP3)
#define PIN_DRV_EN       6   // DRV8874 EN/IN1, PWM. Low = brake.
#define PIN_DRV_PH       7   // DRV8874 PH/IN2, direction
#define PIN_DRV_SLEEP   10   // both drivers nSLEEP. Low = outputs off.
#define PIN_DRV_FAULT   11   // DRV8874 nFAULT, open drain, 10 k pull-up to 3V3
#define PIN_CS_ADC      26   // DRV8874 CS through 1 k series, ADC0

// ---- IMU, SPI1 ------------------------------------------------------------
#define PIN_IMU_MISO    12   // SDO
#define PIN_IMU_CS      13   // CS, software controlled
#define PIN_IMU_SCK     14   // SCL
#define PIN_IMU_MOSI    15   // SDA / SDI
#define PIN_IMU_INT1    16   // data-ready

// ---- Supervision ----------------------------------------------------------
#define PIN_HEARTBEAT   22   // 500 Hz square wave while the control loop runs (docs/kill-chain.md)
#define PIN_RAIL_ADC    28   // switched actuator rail through 100 k / 22 k divider, ADC2
#define PIN_LED         25   // onboard LED (Pico 2)

// ---- Scale factors --------------------------------------------------------
#define ENC_COUNTS_PER_REV   1920.0f   // Pololu 4752, both edges of both channels
#define CS_VOLTS_PER_AMP     1.12f     // DRV8874 IPROPI 450 uA/A x 2.49 k on the carrier
#define RAIL_DIVIDER_RATIO   5.545f    // (100 k + 22 k) / 22 k
#define ADC_VOLTS_PER_COUNT  (3.3f / 4096.0f)

// ---- Control timing -------------------------------------------------------
#define CONTROL_HZ           500
#define CONTROL_PERIOD_US    (1000000 / CONTROL_HZ)
#define TELEMETRY_HZ         50
#define SPEED_EST_PERIOD_MS  10
#define SPEED_EST_WINDOW     5          // 5 x 10 ms = 50 ms window

// ---- Commissioning limits (docs/electronics-bench-guide.md) ----------------
#define LIMIT_DUTY_PCT       30.0f     // open-loop and closed-loop duty clamp
#define LIMIT_SPEED_RPM      30.0f     // closed-loop target clamp
#define LIMIT_FOLLOW_GAIN    2.0f      // rpm per degree
#define LIMIT_JOG_MS         2000
#define LIMIT_CURRENT_A      2.0f      // fault above this CS current
#define LIMIT_OVERSPEED_RPM  60.0f     // fault above this measured speed
#define DEADMAN_MS           250       // motion permission expires after this
#define WATCHDOG_MS          100       // RP2350 hardware watchdog timeout
#define LOOP_OVERRUN_US      20000     // fault if one control period exceeds this while armed
#define RAMP_RPM_PER_S       10.0f
#define RAMP_DUTY_PCT_PER_S  60.0f
#define PWM_FREQ_HZ          20000
#define RAIL_PRESENT_V       8.0f      // rail check threshold when enabled

// ---- IMU axis mapping (record the real mapping in stage E1) ---------------
// pitch = rotation about the wheel axle. With the SparkFun board flat, X
// forward and Z up, the right-handed sensor frame puts Y to the left. A forward
// tilt (nose down) is a positive rotation about +Y: the gyro Y rate is positive
// and the accelerometer X reading goes negative. Both terms below give a
// positive pitch for a forward tilt. (Fix 2026-10-28: bench-0.1.0 used
// atan2f(x, z), which has the opposite sign to the gyro term, so the
// complementary filter moved the wrong way for about 0.1 s and then lagged.)
#define PITCH_RATE_FROM(g)   ((g).y)                  // deg/s, + = forward tilt
#define PITCH_ACC_ANGLE(a)   (atan2f(-(a).x, (a).z))  // rad, 0 when level, + = forward tilt

#endif

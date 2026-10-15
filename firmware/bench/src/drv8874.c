#include "drv8874.h"

#include "hardware/adc.h"
#include "hardware/clocks.h"
#include "hardware/gpio.h"
#include "hardware/pwm.h"
#include "pico/stdlib.h"
#include "pins.h"

static uint pwm_slice;
static uint16_t pwm_wrap;
static float current_duty;
static bool awake;

void drv8874_outputs_off_early(void) {
    gpio_init(PIN_DRV_SLEEP);
    gpio_put(PIN_DRV_SLEEP, 0);
    gpio_set_dir(PIN_DRV_SLEEP, GPIO_OUT);
    gpio_put(PIN_DRV_SLEEP, 0);
    awake = false;
}

void drv8874_init(void) {
    // Direction pin.
    gpio_init(PIN_DRV_PH);
    gpio_set_dir(PIN_DRV_PH, GPIO_OUT);
    gpio_put(PIN_DRV_PH, 0);

    // PWM on EN. 20 kHz: sys clock / (wrap + 1).
    gpio_set_function(PIN_DRV_EN, GPIO_FUNC_PWM);
    pwm_slice = pwm_gpio_to_slice_num(PIN_DRV_EN);
    uint32_t sys_hz = clock_get_hz(clk_sys);
    pwm_wrap = (uint16_t)(sys_hz / PWM_FREQ_HZ - 1);
    pwm_config cfg = pwm_get_default_config();
    pwm_config_set_clkdiv(&cfg, 1.0f);
    pwm_config_set_wrap(&cfg, pwm_wrap);
    pwm_init(pwm_slice, &cfg, true);
    pwm_set_gpio_level(PIN_DRV_EN, 0);
    current_duty = 0.0f;

    // Fault input. The carrier needs its own 10 k pull-up; the internal
    // pull-up is a second safety only.
    gpio_init(PIN_DRV_FAULT);
    gpio_set_dir(PIN_DRV_FAULT, GPIO_IN);
    gpio_pull_up(PIN_DRV_FAULT);

    adc_init();
    adc_gpio_init(PIN_CS_ADC);
    adc_gpio_init(PIN_RAIL_ADC);
}

void drv8874_set_sleep(bool on) {
    if (!on) {
        drv8874_set_duty(0.0f);
    }
    gpio_put(PIN_DRV_SLEEP, on ? 1 : 0);
    awake = on;
}

bool drv8874_is_awake(void) { return awake; }

void drv8874_set_duty(float duty_pct) {
    if (duty_pct > 100.0f) duty_pct = 100.0f;
    if (duty_pct < -100.0f) duty_pct = -100.0f;
    current_duty = duty_pct;
    float mag = duty_pct < 0 ? -duty_pct : duty_pct;
    // Set the direction before the level, so a sign change never drives the
    // old direction at the new magnitude.
    gpio_put(PIN_DRV_PH, duty_pct >= 0 ? 1 : 0);
    uint16_t level = (uint16_t)(mag * 0.01f * (float)(pwm_wrap + 1));
    if (level > pwm_wrap) level = pwm_wrap;
    pwm_set_gpio_level(PIN_DRV_EN, level);
}

float drv8874_get_duty(void) { return current_duty; }

bool drv8874_fault_active(void) { return gpio_get(PIN_DRV_FAULT) == 0; }

static float adc_average_v(uint input, int n) {
    adc_select_input(input);
    uint32_t sum = 0;
    for (int i = 0; i < n; i++) sum += adc_read();
    return (float)sum / (float)n * ADC_VOLTS_PER_COUNT;
}

float drv8874_read_current_a(void) {
    return adc_average_v(0, 8) / CS_VOLTS_PER_AMP;   // GP26 = ADC0
}

float drv8874_read_rail_v(void) {
    return adc_average_v(2, 4) * RAIL_DIVIDER_RATIO;  // GP28 = ADC2
}

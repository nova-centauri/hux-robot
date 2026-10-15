#include "encoder.h"

#include "hardware/gpio.h"
#include "hardware/pio.h"
#include "pins.h"
#include "quadrature_encoder.pio.h"

static PIO enc_pio = pio0;
static uint enc_sm;

static int32_t hist_count[SPEED_EST_WINDOW + 1];
static uint32_t hist_ms[SPEED_EST_WINDOW + 1];
static int hist_n;
static float speed_rpm;

void encoder_init(void) {
    uint offset = pio_add_program(enc_pio, &quadrature_encoder_program);
    (void)offset;  // the program must load at address 0 (.origin 0)
    enc_sm = pio_claim_unused_sm(enc_pio, true);
    // 0 = full speed sampling.
    quadrature_encoder_program_init(enc_pio, enc_sm, PIN_ENC_A, 0);
    // The divider defines the levels. Remove the pull-ups that the example
    // program enables.
    gpio_disable_pulls(PIN_ENC_A);
    gpio_disable_pulls(PIN_ENC_A + 1);
    hist_n = 0;
    speed_rpm = 0.0f;
}

int32_t encoder_count(void) {
    return quadrature_encoder_get_count(enc_pio, enc_sm);
}

float encoder_update_speed(int32_t count, uint32_t now_ms) {
    // Shift the window.
    if (hist_n < SPEED_EST_WINDOW + 1) {
        hist_count[hist_n] = count;
        hist_ms[hist_n] = now_ms;
        hist_n++;
    } else {
        for (int i = 0; i < SPEED_EST_WINDOW; i++) {
            hist_count[i] = hist_count[i + 1];
            hist_ms[i] = hist_ms[i + 1];
        }
        hist_count[SPEED_EST_WINDOW] = count;
        hist_ms[SPEED_EST_WINDOW] = now_ms;
    }
    if (hist_n < 2) return 0.0f;
    int32_t dc = hist_count[hist_n - 1] - hist_count[0];
    uint32_t dt_ms = hist_ms[hist_n - 1] - hist_ms[0];
    if (dt_ms == 0) return speed_rpm;
    speed_rpm = (float)dc / ENC_COUNTS_PER_REV * 60000.0f / (float)dt_ms;
    return speed_rpm;
}

float encoder_speed_rpm(void) { return speed_rpm; }

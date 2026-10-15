// Quadrature encoder on PIO (pico-examples quadrature_encoder program).
#ifndef HUX_ENCODER_H
#define HUX_ENCODER_H

#include <stdint.h>

void encoder_init(void);
int32_t encoder_count(void);     // signed, both edges of both channels

// Call every SPEED_EST_PERIOD_MS. Returns the windowed speed in rpm.
float encoder_update_speed(int32_t count, uint32_t now_ms);
float encoder_speed_rpm(void);

#endif

// One DRV8874 (Pololu 4035 carrier) in PH/EN mode.
//   EN  = PWM. High drives, low brakes (both low-side FETs on).
//   PH  = direction.
//   nSLEEP low = outputs off (coast). Shared by both drivers on the robot.
//   nFAULT open drain, active low.
#ifndef HUX_DRV8874_H
#define HUX_DRV8874_H

#include <stdbool.h>

// Drives nSLEEP low before anything else. Call first in main().
void drv8874_outputs_off_early(void);

// PWM, direction, fault input and the two ADC channels.
void drv8874_init(void);

void drv8874_set_sleep(bool awake);     // true = nSLEEP high
bool drv8874_is_awake(void);

// duty in percent, signed: positive = PH high. Clamped to +/-100.
void drv8874_set_duty(float duty_pct);
float drv8874_get_duty(void);

bool drv8874_fault_active(void);       // true when nFAULT is low

float drv8874_read_current_a(void);    // CS pin, averaged over 8 samples
float drv8874_read_rail_v(void);       // switched rail through the divider

#endif

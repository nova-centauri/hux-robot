// LSM6DSO IMU over 4-wire SPI (SparkFun SEN-18020 breakout).
#ifndef HUX_LSM6DSO_H
#define HUX_LSM6DSO_H

#include <stdbool.h>
#include <stdint.h>

#define LSM6DSO_WHO_AM_I_VALUE  0x6C

// Register map (ST LSM6DSO datasheet, section 9).
#define LSM6DSO_REG_INT1_CTRL   0x0D
#define LSM6DSO_REG_WHO_AM_I    0x0F
#define LSM6DSO_REG_CTRL1_XL    0x10
#define LSM6DSO_REG_CTRL2_G     0x11
#define LSM6DSO_REG_CTRL3_C     0x12
#define LSM6DSO_REG_CTRL4_C     0x13
#define LSM6DSO_REG_CTRL9_XL    0x18
#define LSM6DSO_REG_STATUS      0x1E
#define LSM6DSO_REG_OUTX_L_G    0x22
#define LSM6DSO_REG_OUTX_L_A    0x28

// Configuration written by lsm6dso_init(). Documented in
// docs/electronics-bench-guide.md, stage E1.
#define LSM6DSO_CFG_CTRL3_C     0x44   // BDU, IF_INC, 4-wire SPI
#define LSM6DSO_CFG_CTRL9_XL    0xE2   // I3C disable, default DEN bits
#define LSM6DSO_CFG_CTRL1_XL    0x78   // 833 Hz, +/-4 g
#define LSM6DSO_CFG_CTRL2_G     0x74   // 833 Hz, +/-500 dps
#define LSM6DSO_CFG_INT1_CTRL   0x02   // gyroscope data-ready on INT1

#define LSM6DSO_ACC_G_PER_LSB   0.000122f  // +/-4 g
#define LSM6DSO_GYRO_DPS_PER_LSB 0.0175f   // +/-500 dps

typedef struct { float x, y, z; } vec3f;

typedef struct {
    vec3f acc_g;      // accelerometer, g
    vec3f gyro_dps;   // gyroscope, deg/s
    int16_t raw[6];   // gx gy gz ax ay az
} lsm6dso_sample;

// Set up SPI1 and the chip-select pin. Does not talk to the sensor.
void lsm6dso_bus_init(void);

uint8_t lsm6dso_read_reg(uint8_t reg);
void lsm6dso_write_reg(uint8_t reg, uint8_t value);

// Reset, write the configuration above and read it back.
// Returns true when WHO_AM_I and every readback match.
bool lsm6dso_init(void);

// Read all twelve output bytes in one burst starting at OUTX_L_G.
void lsm6dso_read(lsm6dso_sample *out);

// Bit 0 = accelerometer data ready, bit 1 = gyroscope data ready.
uint8_t lsm6dso_status(void);

#endif

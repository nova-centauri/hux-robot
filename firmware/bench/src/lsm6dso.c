#include "lsm6dso.h"

#include "hardware/gpio.h"
#include "hardware/spi.h"
#include "pico/stdlib.h"
#include "pins.h"

#define IMU_SPI spi1
#define IMU_SPI_HZ (1 * 1000 * 1000)

static inline void cs_low(void)  { gpio_put(PIN_IMU_CS, 0); }
static inline void cs_high(void) { gpio_put(PIN_IMU_CS, 1); }

void lsm6dso_bus_init(void) {
    spi_init(IMU_SPI, IMU_SPI_HZ);
    // LSM6DSO: clock idle high, data sampled on the rising edge (SPI mode 3).
    spi_set_format(IMU_SPI, 8, SPI_CPOL_1, SPI_CPHA_1, SPI_MSB_FIRST);
    gpio_set_function(PIN_IMU_MISO, GPIO_FUNC_SPI);
    gpio_set_function(PIN_IMU_SCK, GPIO_FUNC_SPI);
    gpio_set_function(PIN_IMU_MOSI, GPIO_FUNC_SPI);
    gpio_init(PIN_IMU_CS);
    gpio_set_dir(PIN_IMU_CS, GPIO_OUT);
    cs_high();
    gpio_init(PIN_IMU_INT1);
    gpio_set_dir(PIN_IMU_INT1, GPIO_IN);
    gpio_disable_pulls(PIN_IMU_INT1);
}

uint8_t lsm6dso_read_reg(uint8_t reg) {
    uint8_t tx = reg | 0x80;
    uint8_t rx = 0;
    cs_low();
    spi_write_blocking(IMU_SPI, &tx, 1);
    spi_read_blocking(IMU_SPI, 0x00, &rx, 1);
    cs_high();
    return rx;
}

void lsm6dso_write_reg(uint8_t reg, uint8_t value) {
    uint8_t tx[2] = { (uint8_t)(reg & 0x7F), value };
    cs_low();
    spi_write_blocking(IMU_SPI, tx, 2);
    cs_high();
}

static void read_burst(uint8_t start_reg, uint8_t *buf, size_t n) {
    uint8_t tx = start_reg | 0x80;
    cs_low();
    spi_write_blocking(IMU_SPI, &tx, 1);
    spi_read_blocking(IMU_SPI, 0x00, buf, n);
    cs_high();
}

bool lsm6dso_init(void) {
    if (lsm6dso_read_reg(LSM6DSO_REG_WHO_AM_I) != LSM6DSO_WHO_AM_I_VALUE) {
        return false;
    }
    // Software reset, then wait for the boot time.
    lsm6dso_write_reg(LSM6DSO_REG_CTRL3_C, 0x01);
    sleep_ms(20);

    const struct { uint8_t reg, val; } cfg[] = {
        { LSM6DSO_REG_CTRL3_C,   LSM6DSO_CFG_CTRL3_C },
        { LSM6DSO_REG_CTRL9_XL,  LSM6DSO_CFG_CTRL9_XL },
        { LSM6DSO_REG_CTRL1_XL,  LSM6DSO_CFG_CTRL1_XL },
        { LSM6DSO_REG_CTRL2_G,   LSM6DSO_CFG_CTRL2_G },
        { LSM6DSO_REG_INT1_CTRL, LSM6DSO_CFG_INT1_CTRL },
    };
    bool ok = true;
    for (size_t i = 0; i < sizeof cfg / sizeof cfg[0]; i++) {
        lsm6dso_write_reg(cfg[i].reg, cfg[i].val);
        if (lsm6dso_read_reg(cfg[i].reg) != cfg[i].val) ok = false;
    }
    return ok;
}

uint8_t lsm6dso_status(void) {
    return lsm6dso_read_reg(LSM6DSO_REG_STATUS);
}

void lsm6dso_read(lsm6dso_sample *out) {
    uint8_t b[12];
    read_burst(LSM6DSO_REG_OUTX_L_G, b, sizeof b);
    for (int i = 0; i < 6; i++) {
        out->raw[i] = (int16_t)((uint16_t)b[2 * i] | ((uint16_t)b[2 * i + 1] << 8));
    }
    out->gyro_dps.x = out->raw[0] * LSM6DSO_GYRO_DPS_PER_LSB;
    out->gyro_dps.y = out->raw[1] * LSM6DSO_GYRO_DPS_PER_LSB;
    out->gyro_dps.z = out->raw[2] * LSM6DSO_GYRO_DPS_PER_LSB;
    out->acc_g.x = out->raw[3] * LSM6DSO_ACC_G_PER_LSB;
    out->acc_g.y = out->raw[4] * LSM6DSO_ACC_G_PER_LSB;
    out->acc_g.z = out->raw[5] * LSM6DSO_ACC_G_PER_LSB;
}

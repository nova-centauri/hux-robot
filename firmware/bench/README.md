# Bench firmware — Pico 2, IMU and one wheel channel

This program is the first Hux firmware. It runs the stages of the [electronics bench guide](../../docs/electronics-bench-guide.md) on one Pico 2. It is bench code for a lifted wheel on a fixture. It does not balance the robot.

**Status, 2026-10-15:** the code compiles for `PICO_BOARD=pico2` with Pico SDK 2.2.0 and Arm GCC 15.2.1. No board test is recorded. The first flash is stage E0 of the guide.

## What it does

- Holds the driver nSLEEP line (GP10) low as its first instruction after boot.
- Reads the LSM6DSO IMU over SPI1 at the 500 Hz control rate and estimates the pitch angle.
- Counts the wheel encoder on PIO and estimates the speed over a 50 ms window.
- Drives one DRV8874 driver in PH/EN mode with 20 kHz PWM.
- Keeps the modes `DISARMED`, `BENCH_ARMED` and `FAULT`, with the limits of the guide.
- Toggles the heartbeat pin (GP22) each control cycle for the [kill chain](../../docs/kill-chain.md).
- Resets through the RP2350 hardware watchdog after 100 ms without a loop.
- Sends one telemetry line at 50 Hz and accepts ASCII commands over USB serial.

The pins and the limits are in [`src/pins.h`](src/pins.h). The command list is in the guide, section "Bench firmware contract".

## Flash the prebuilt file

The file [`release/hux_bench.uf2`](release/hux_bench.uf2) is the build from the cloud toolchain. Its build ID is in the first line that the board prints.

1. Hold **BOOTSEL** on the Pico 2. Connect the USB cable. Release **BOOTSEL**.
2. Copy `hux_bench.uf2` to the drive **RP2350**.
3. The drive disappears and the LED gives one short blink each second. This is `DISARMED`.
4. Start the host console: `python3 tools/bench/hux_bench.py`. It needs `pyserial`.

The console sends the 20 Hz keepalive and saves a log in `logs/`. Type `id`, then `help`.

## Build on the Mac mini

Install the tools one time:

```sh
brew install cmake ninja
brew install --cask gcc-arm-embedded
git clone -b 2.2.0 https://github.com/raspberrypi/pico-sdk.git ~/pico-sdk
cd ~/pico-sdk && git submodule update --init
```

Then build from this directory:

```sh
export PICO_SDK_PATH=~/pico-sdk
cmake -S . -B build -G Ninja -DPICO_BOARD=pico2
cmake --build build
```

The output is `build/hux_bench.uf2`. The build downloads `picotool` from GitHub one time. Copy the new UF2 to `release/` when you commit a firmware change.

## Source files

| File | Content |
| --- | --- |
| `src/main.c` | Modes, commands, supervision, control loop, telemetry |
| `src/lsm6dso.c` | SPI register access, sensor configuration, burst read |
| `src/drv8874.c` | PWM, direction, nSLEEP, nFAULT, current and rail ADC |
| `src/encoder.c` | PIO quadrature count and speed estimate |
| `src/quadrature_encoder.pio` | PIO program from `pico-examples`, BSD-3-Clause, Raspberry Pi (Trading) Ltd |
| `src/pins.h` | Pin allocation, scale factors and commissioning limits |

## Limits in the code

| Limit | Value |
| --- | --- |
| Duty | ±30 % |
| Speed target | ±30 rpm |
| Follow gain | 2 rpm per degree |
| Jog duration | 2000 ms |
| Fault current | 2.0 A at the CS pin |
| Fault speed | 60 rpm |
| Deadman | 250 ms without a command or a keepalive |
| Hardware watchdog | 100 ms |

Change a limit in `pins.h` only with a dated record of the reason. The rail check (`rail on`) is off at boot until the kill chain exists.

cmake_minimum_required(VERSION 3.13)

# Hux V1-PROOF bench firmware. Target: Raspberry Pi Pico 2 (RP2350).
# Build:  cmake -S . -B build -DPICO_BOARD=pico2 && cmake --build build
# Output: build/hux_bench.uf2  (copy to the RP2350 drive)
set(PICO_BOARD pico2 CACHE STRING "Board type")

include(pico_sdk_import.cmake)

project(hux_bench C CXX ASM)
set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 17)

pico_sdk_init()

# Build identifier from git, if available.
execute_process(
    COMMAND git describe --always --dirty --tags
    WORKING_DIRECTORY ${CMAKE_CURRENT_LIST_DIR}
    OUTPUT_VARIABLE HUX_GIT_ID
    OUTPUT_STRIP_TRAILING_WHITESPACE
    ERROR_QUIET)
if(NOT HUX_GIT_ID)
    set(HUX_GIT_ID "unknown")
endif()

add_executable(hux_bench
    src/main.c
    src/lsm6dso.c
    src/drv8874.c
    src/encoder.c
)

pico_generate_pio_header(hux_bench ${CMAKE_CURRENT_LIST_DIR}/src/quadrature_encoder.pio)

target_include_directories(hux_bench PRIVATE src)
target_compile_definitions(hux_bench PRIVATE
    HUX_BUILD_ID="${HUX_GIT_ID}"
    PICO_STDIO_USB_CONNECT_WAIT_TIMEOUT_MS=0
    # A host that stops reading must not stall the control loop. Drop output
    # after 2 ms instead of the 500 ms default, which would trip the watchdog.
    PICO_STDIO_USB_STDOUT_TIMEOUT_US=2000
)
target_compile_options(hux_bench PRIVATE -Wall -Wextra)

target_link_libraries(hux_bench
    pico_stdlib
    hardware_spi
    hardware_pwm
    hardware_adc
    hardware_pio
    hardware_watchdog
)

# USB serial for commands and telemetry. No UART stdio: GP0/GP1 stay free.
pico_enable_stdio_usb(hux_bench 1)
pico_enable_stdio_uart(hux_bench 0)

pico_add_extra_outputs(hux_bench)

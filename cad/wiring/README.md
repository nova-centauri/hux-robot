# V1-PROOF electrical atlas

Rev B, dated 2026-10-04. [Verification record and sources](../../docs/wiring-atlas.md) / [site integration](../../tools/living-drawings/electrical.html).

Five coordinated SVG sheets are the editable, resolution-independent deliverables. The matching PNGs provide raster previews, up to 4800 pixels wide. The [five-page PDF](v1-proof-wiring-atlas.pdf) keeps vector text and paths. Each page follows the aspect ratio of its sheet. Print with fit-to-page for the paper size you use.

| Sheet | Drawing |
| --- | --- |
| EL-01 | [Complete system wiring](v1-proof-el-01-overview.svg) — every proposed external conductor and both motor channels |
| EL-02 | [Pico 2 and SPI IMU](v1-proof-el-02-pico-imu.svg) — physical pins and the seven-wire sensor harness |
| EL-03 | [Wheel motor and encoder harness](v1-proof-el-03-wheel-harness.svg) — carrier pads and motor cable details |
| EL-04 | [Power distribution and servo bus](v1-proof-el-04-power-servo.svg) — isolation, actuator cut and unresolved interfaces |
| EL-05 | [Both wheel motors — every wire](v1-proof-el-05-both-wheels.svg) — separate left and right paths |

The [searchable wire register](v1-proof-wire-register.html) maps EL-01 conductor IDs to named endpoints. EL-05 uses terminal names, which you can search in the same register. The [JSON register](v1-proof-netlist.json) is the machine-readable review aid. IDs identify proposed external connections. They do not release a connector pinout, wire gauge or internal circuit.

Drawing logic lives in [build.py](build.py) and [complete.py](complete.py). Run these commands from the repository root. The Python command rebuilds all five SVGs and both registers:

```sh
python3 cad/wiring/build.py
```

For PNG/PDF export, `render.mjs` uses Sharp and Playwright. Set `NODE_PATH` to the installed packages. When the bundled browser of Playwright is not available, you can set `CHROME_PATH` to a local Chromium-compatible executable. The Codex bundled workspace runtime provides the packages. The export needs no network call.

```sh
node cad/wiring/render.mjs
```

The figures describe source-checked pinouts and proposed interfaces. Dashed blocks remain unselected circuits. None of these outputs closes a physical harness, electrical protection or powered-motion gate.

# Mass budget — bottom-up, part by part

**2026-09-27.** Steve: "calculate weight better." Until today every model ran on a *lump picture*: the 6 kg picture of 2026-09-22 with the RobStride masses swapped in, 7.75 kg, of which a 4.35 kg "body" was a guess. This replaces it with every part on the parts list and the sheets, each with a best figure, a low–high range and a source. The table lives in code (`tools/living-drawings/actuators.js → massParts`) and every model reads the lumps derived from it; `node tools/living-drawings/studies/mass-budget.js` prints it. **Nothing is weighed yet** — weigh each part as it arrives and replace its row.

## Result

| | Lump picture (retired) | Mass budget |
| --- | ---: | ---: |
| Whole robot | 7.75 kg | **5.67 kg** (4.73–6.94 at every part's low / high) |
| Body (head, band, pack, electronics, roll RS02s) | 4.35 | **2.42** |
| Hips, both (yoke + RS00 + F1 + F2, half the spring and upper tube) | 1.50 | 0.96 |
| Knee, each (RS02 + F3 + F4 + pulley, halves of spring and tubes) | 0.46 | 0.60 |
| Wheel, each (RS05 + F5 + F6 rim + tire + tube, half the lower tube) | 0.49 | 0.54 |
| Legs as a share of the robot | 44 % | **57 %** |

Two things moved that matter more than the total:

- **The body is light and its CoM sits behind the hip-swing axis.** The two roll RS02s (0.8 kg) and the band (0.3 kg) are 2.4" aft of the swing axis (Sheet 1 puts the roll housings there so they clear the RS00s). With the pack at the top of the head, 2.2" forward, the body CoM is **0.55" behind** the swing axis and 1.97" above it. The lump picture had assumed +1.0" ahead.
- **The legs carry most of the mass**, so moving the body moves the whole-robot CoM less than it used to.

## What changed downstream (all computed; the pages follow)

- **Knee:** standing up over the front wheel **8.2 N·m** at Sheet 1's pose (was 12.4 with the lump picture and the full weight at the axle); **4.7 N·m at the motor with the spring**. One leg at 92 % 3.8, two legs 1.7. The joint torques now take the wheel's own weight off the ground force (`kin.js standHold`) — it hangs below the knee.
- **Knee spring (refit):** 1.81 N·m/rad + 0.23 N·m preload on the Ø2.5" pulley → **~1.8 kN/m (10 lbf/in)**, 7 N preload, ~160 N at the stop. Was 3.05 N·m/rad / 3.0 kN/m. A lighter spring.
- **Hip roll hold** with one wheel up at the 3.0" axes: **5.2 N·m** (was 6.3), at a **25.6°** shift (was 24.2°). RS02 rated 7: margin 26 % instead of 10 %.
- **Levelling in the shift:** 2 × 3.375" × tan 25.6° = **3.2"** of leg-length difference (axles 2.9" apart).
- **Wheel:** traction limit fully loaded at μ 0.7 is **3.0 N·m**; lean equilibrium 0.7 / 1.5 / 2.1 N·m at 10° / 20° / 30°. The 2.0 N·m kept at 1.5 m/s is now a ~28°-lean catch (it was ~20° at 7.75 kg).
- **Stair (planar solver, comparative only):** with the body CoM behind the hips the throw **does not crest at all** until the body CoM is ≥ 2.5" ahead of the swing axis. The stair's reference candidate was already rejected on reach; this is a second, mass-driven reason. Moving the whole head forward buys ~0.5" of body CoM per inch; +2.5" would need the head ~6" forward of the hips, so it cannot do it alone. The step trajectory (NOTES open call 16) has to be designed on this mass, and the hip axis position along the body is a live Sheet 1 question again.

## CoM uncertainty before weighing

Monte Carlo over the budget (each part uniform in its range, left and right independently; body parts ±their position doubt): **lateral CoM σ ≈ 2 mm, height σ ≈ 4 mm.** The one-leg study had carried "±20 mm of real-world doubt" for the lump model; on a parts budget the doubt is an order of magnitude smaller. Real builds add what a budget does not list (wire routing, glue, a pack that sits 3 mm off centre), so the plan stays: weigh every part on arrival, then find the assembled CoM on a bench tilt test (a knife edge or two scales; 1–2 mm is routine) and trim it online in the poise.

## The table

Grams each. Sources are the retailer / maker pages found on 2026-09-27; "est" rows are sized from Sheets 1–2 (volume × density: 6061 2.70 g/cc; printed shells ~1.2, printed fittings ~0.75 effective at 30–40 % infill).

| Part | Lump | Qty | g | Range | Source |
| --- | --- | ---: | ---: | --- | --- |
| 8S 3300 mAh 50–60C LiPo, XT90 | body | 1 | 620 | 550–700 | GNB 8S 3300 549 g; Ovonic 8S 3500 688 g; 2× Zeee 4S 3300 696 g |
| RobStride 02, hip roll (stator in the band) | body | 2 | 400 | 380–410 | retailers 405 ± 5 g; spec table 380 g |
| F7 hip-band shell, printed, 3 mm walls + roll-flange bosses | body | 1 | 300 | 200–420 | est: 9.1 × 3.1 × 3.0" shell, ~215 cm³ × 1.2 + bosses |
| Head shell, printed, 2 mm walls, open bottom, ribs | body | 1 | 350 | 250–500 | est: 8 × 7 × 4.45" box, ~245 cm³ × 1.2 + 20 % ribs |
| Head inserts, fasteners, mounts, lid | body | 1 | 60 | 35–100 | est |
| Teensy 4.1 + ICM-42688-P + 3× CAN transceiver + carrier | body | 1 | 35 | 25–50 | Teensy 6–9 g, IMU ~2 g, SN65HVD230 3 g each; carrier est |
| 5 V buck (≥36 V in), distribution + torque-cut board, fuse, XT90-S | body | 1 | 50 | 35–80 | Pololu D36V50F5 7 g; XT90-S pair 15 g; board est |
| Body harness: 12 AWG pack leads, CAN + signal, connectors | body | 1 | 45 | 30–80 | 12 AWG silicone 47 g/m × 0.6 m + signal + connectors |
| Raspberry Pi 5 + Active Cooler + standoffs | body | 1 | 81 | 70–95 | Pi 5 ~46 g, Active Cooler 25–29 g |
| TBS Crossfire Nano RX + antenna | body | 1 | 2 | 1–3 | 0.5 g board, ~2 g with antenna |
| Front display, ~2" IPS | body | 1 | 13.5 | 9–15 | Adafruit 2.0" 320×240 IPS 13.5 g |
| Front stereo pair (USB board) + lead | body | 1 | 25 | 15–45 | ELP 960P2CAM class, est |
| Cameras back / left / right / top / bottom (5, BOM later list) | body | 1 | 40 | 25–65 | Pi Camera Module 3 class, 5 g + ribbon each |
| RGB eyes (2) | body | 1 | 2 | 1–5 | WS2812 small boards |
| RobStride 00, hip swing, outboard of the leg plane | hip | 2 | 310 | 300–320 | 310 ± 10 g (manual table) |
| F1 hip yoke, milled 6061 | hip | 2 | 70 | 45–110 | est: ~30 cm³ pocketed 6061 |
| F2 upper-tube hip fitting, printed + inserts | hip | 2 | 26 | 18–40 | est: ~30 cm³ × 0.75 + inserts |
| Hip fasteners, pins | hip | 2 | 15 | 8–25 | est |
| RobStride 02, knee | knee | 2 | 400 | 380–410 | retailers 405 ± 5 g; spec table 380 g |
| F3 upper-tube knee fitting + RS02 stator mount, printed | knee | 2 | 43 | 30–60 | est: ~50 cm³ × 0.75 + inserts |
| F4 knee output arm, printed (machine if it flexes) | knee | 2 | 45 | 30–70 | est: ~50 cm³ × 0.8 + inserts |
| Ø2.5" knee pulley (printed) + cable + crimps | knee | 2 | 20 | 13–33 | est |
| Knee extension spring ~1.8 kN/m (mass kept at the 3.0 kN/m estimate), 3.4" travel (half at each end) | hip / knee | 2 | 90 | 60–130 | est from spring design: music wire 2.5–3.0 mm, 16–20 mm coil |
| Upper carbon tube 16 × 14, ~191 mm + leg wires inside | hip / knee | 2 | 32 | 26–40 | Easy Composites 16/14 74.2 g/m; wires est 18 g |
| Lower carbon tube 16 × 14, ~196 mm + RS05 lead inside | knee / wheel | 2 | 26.5 | 21–33 | 74.2 g/m; wire est 12 g |
| Leg fasteners, cross pins, inserts | knee | 2 | 20 | 10–35 | est |
| RobStride 05, wheel | wheel | 2 | 191 | 181–201 | 191 ± 10 g |
| F5 axle fitting, milled 6061 | wheel | 2 | 39 | 28–55 | est: ~18 cm³ pocketed 6061 |
| F6 rim + disc web, turned 6061 | wheel | 2 | 89 | 65–120 | est: rim ~24 cm³ + lightened web ~9 cm³ |
| 6×1.25 ribbed pneumatic tire | tread | 2 | 160 | 110–230 | est: listings give shipping weights (113–227 g) |
| 6×1.25 inner tube, bent Schrader | tread | 2 | 48 | 35–70 | est: ~34 cm³ butyl + stem |

**Weakest numbers:** tire and tube (listings give shipping weights), the spring (depends on the part picked, open call 15), cameras and harness, printed-part density, Pi 5 + cooler (cited, not from the maker), RS02 380 vs 405 g. The pack: real 8S 3300 packs run 550–700 g and ~139–143 × 43–44 × 42–56 mm; the envelope drawn is 150 × 45 × 56 mm.

Sources: [GNB 8S 3300](https://phaserfpv.com.au/products/gaoneng-gnb-8s-296v-3300mah-100c-lipo-battery-xt90-dg) · [Ovonic 8S 3500](https://us.ovonicshop.com/products/ovonic-roam-series-8s-lipo-battery-3500mah-8s1p-150c-29-6v-long-range-lipo-battery-with-xt90-plug-for-8s-cinelifter-multirotor-x-class-airplane) · [Zeee 4S 3300](https://zeeebattery.com/products/zeee-4s-lipo-battery-3300mah-14-8v-50c-xt60) · [RobStride 02 (retailer)](https://rcdrone.top/products/robstride-02-qdd-17n-m-integrated-actuator-module-7-75-1-ratio-dual-14-bit-magnetic-encoders-48v-405g-foc-drive-for-robotics) · [RobStride 00](https://www.zennixtek.com/products/robstride-dynamics-00-motor) · [RobStride 05](https://www.zennixtek.com/products/robstride-dynamics-05-motor) · [16/14 carbon tube, 74.2 g/m](https://www.easycomposites.us/16mm-woven-finish-carbon-fiber-tube) · [Teensy 4.1](https://thepihut.com/products/teensy-4-1) · [SN65HVD230 board](https://www.waveshare.com/sn65hvd230-can-board.htm) · [XT90-S](https://www.kopterworx.com/xt90-s-anti-spark-connector.html) · [Pololu D36V50F5](https://www.pololu.com/product/4091/specs) · [Pi 5 Active Cooler](https://www.waveshare.com/raspberry-pi-5-official-active-cooler.htm) · [Adafruit 2.0" IPS](https://www.adafruit.com/product/4311) · [Scooterworks 6×1.25](https://www.scooterworks.com/products/universal-parts-6x1-25-tire-154-18) · [DIY Mobility 6×1¼](https://diymobilityparts.com/products/6-x-1-1-4-in-multi-rib-wheelchair-tire) · [silicone wire](https://www.rjxhobby.com/rjxhobby-100meters-6-8-10-12awg-extra-soft-silicone-wire-cable)

#!/usr/bin/env python3
"""V1-PROOF harness model: mount locations, connectors, wires and run lengths.

One data set feeds EL-01 (the drawing), EL-06/EL-07 (the harness sheets), the
JSON and HTML harness registers and the consistency check in complete.py.

Coordinates follow the R05 body: X rearward, Y into the body from the near
wall (inner face Y = 0, far wall inner face Y = -135), Z up. The origin is the
R04 body origin. Positions come from cad/prints/two-leg-body-r05/build.py and
parameters.json (R05, 2026-10-16). Robot LEFT is the near wall (2026-10-17).

Lengths are estimates from a route model, not measurements. Cut each run
long, route it on the frame, then trim. Standard: JST XH 2.50 mm for every
low-voltage harness connector; XT30 for the 12 V power path; the Pololu
motor pigtail keeps its 1x6 0.1 in housing.
"""
import json
import math
from pathlib import Path
from html import escape

HERE = Path(__file__).resolve().parent
REVISION = 'C'
DATE = '2026-10-17'

# Deck top faces and the front cable notches (deck function in R05 build.py:
# notch at local x = -58, y = +/-27 about the deck centre y = -67.5).
DECK_Z = {'PWR': 60, 'BUS': 120, 'CTRL': 170}
NOTCH_X = -58
LANE_Y = {'near': -40.5, 'far': -94.5}

# Mount locations in mm. 'deck' selects the front notch for the route model.
LOCATIONS = {
    'P1': dict(name='Pico 2', place='CTRL deck, far half', deck='CTRL', lane='far', xyz=(0, -97.5, 193),
               source='R05 build.py: 11_pico_plate at (0, -97.5, 178), PCB at Z 191'),
    'U1': dict(name='LSM6DSO IMU', place='CTRL deck, near half', deck='CTRL', lane='near', xyz=(0, -41.5, 190),
               source='R05 build.py: 12_imu_plate at (0, -41.5, 178), PCB at Z 189.6'),
    'PDB': dict(name='Power distribution board (5 V regulator, D5)', place='BUS deck, near half', deck='BUS', lane='near', xyz=(0, -38.5, 145),
                source='R05 build.py: regulator_clamp cassette at (0, -38.5, 128), board at Z 139'),
    'SPARE': dict(name='Spare cassette position', place='BUS deck, far half', deck='BUS', lane='far', xyz=(0, -96.5, 145),
                  source='R05 build.py: servo_bus_encoder cassette at (0, -96.5, 128). No board in V1-PROOF.'),
    'KC': dict(name='Kill-chain board (fuse, Pololu 2813, 74HC14, 3.3 V LDO, rail divider)', place='PWR deck, near half', deck='PWR', lane='near', xyz=(0, -38.5, 85),
               source='R05 build.py: power_cut_fuse cassette at (0, -38.5, 68), board at Z 79'),
    'DB': dict(name='Driver board (2 x DRV8874 carriers, pull-ups, VREF, CS series)', place='PWR deck, far half', deck='PWR', lane='far', xyz=(0, -96.5, 85),
               source='R05 build.py: DRV8874 cassette at (0, -96.5, 68), board at Z 79'),
    'JLEG': dict(name='Leg junction board (2 x 1x6 header, encoder dividers)', place='under the PWR deck, centre', deck='PWR', lane='centre', xyz=(0, -67.5, 52),
                 source='Accepted by the user 2026-10-17 as the unified junction for both pigtails. Deck underside at Z 60. Board layout and mount detail open.'),
    'BAT': dict(name='3S pack lead exit', place='battery tray, rear end', deck=None, lane='near', xyz=(48, -50, -10),
                source='R05 parameters.json battery centre (-5, -67.5, -17.5), 106 x 35 x 25. Lead exit assumed at the rear end toward the near wall. Measure the pack.'),
    'ML': dict(name='Left (near) gearmotor pigtail exit', place='under the body, near side', deck=None, lane='near', xyz=(7, -42.6, -95.3),
               source='R05 build.py moving(30): encoder end at Y -42.6, axis X 7, Z -95.3'),
    'MR': dict(name='Right (far) gearmotor pigtail exit', place='under the body, far side', deck=None, lane='far', xyz=(7, -92.4, -95.3),
               source='R05 build.py moving(30), mirrored about Y -67.5'),
    'SWK': dict(name='KILL button', place='bench fixture (robot panel position open)', deck=None, lane='near', xyz=None,
                source='docs/kill-chain.md: mount both buttons on the fixture for the bench'),
    'SWA': dict(name='ARM button', place='bench fixture (robot panel position open)', deck=None, lane='near', xyz=None,
                source='docs/kill-chain.md'),
    'JUSB': dict(name='Laptop USB cable', place='external, front of the body', deck=None, lane='far', xyz=None,
                 source='R05 build.py: pico_USB_access at X -40'),
}

# Connector standard. XH = JST XH 2.50 mm: header B#B-XH-A, housing XHP-#,
# contact SXH-001T-P0.6. XT30 = Amass XT30. P6 = the Pololu 1x6 0.1 in housing.
CONNECTORS = {
    # Pico 2 headers soldered into contiguous physical pins.
    'P1.PH-A': dict(board='P1', family='XH', positions=4, pins='p4-p7', title='Encoder inputs',
                    load={1: ('GP2', 'L_ENC_A'), 2: ('GP3', 'L_ENC_B'), 3: ('GP4', 'R_ENC_A'), 4: ('GP5', 'R_ENC_B')}),
    'P1.PH-A2': dict(board='P1', family='XH', positions=3, pins='p8-p10', title='Encoder ground, left EN / PH',
                     load={1: ('GND', 'GND'), 2: ('GP6', 'L_EN'), 3: ('GP7', 'L_PH')}),
    'P1.PH-B': dict(board='P1', family='XH', positions=5, pins='p11-p15', title='Right EN / PH, nSLEEP, left FAULT',
                    load={1: ('GP8', 'R_EN'), 2: ('GP9', 'R_PH'), 3: ('GND', 'GND'), 4: ('GP10', 'nSLEEP'), 5: ('GP11', 'L_FAULT')}),
    'P1.PH-C': dict(board='P1', family='XH', positions=6, pins='p16-p21', title='SPI1 sensor',
                    load={1: ('GP12', 'SPI_SDO'), 2: ('GP13', 'SPI_CS'), 3: ('GND', 'GND'), 4: ('GP14', 'SPI_SCL'), 5: ('GP15', 'SPI_SDI'), 6: ('GP16', 'IMU_INT1')}),
    'P1.PH-D': dict(board='P1', family='XH', positions=6, pins='p24-p29', title='Right FAULT, heartbeat',
                    load={1: ('GP18', 'R_FAULT'), 2: ('GP19', None), 3: ('GP20', None), 4: ('GP21', None), 5: ('GND', 'GND'), 6: ('GP22', 'HB')}),
    'P1.PH-E': dict(board='P1', family='XH', positions=4, pins='p31-p34', title='Current sense, rail sense',
                    load={1: ('GP26', 'L_CS'), 2: ('GP27', 'R_CS'), 3: ('AGND', 'AGND'), 4: ('GP28', 'RAIL_ADC')}),
    'P1.PH-F': dict(board='P1', family='XH', positions=4, pins='p36-p39', title='Logic power',
                    load={1: ('3V3(OUT)', '3V3'), 2: ('3V3_EN', None), 3: ('GND', 'GND'), 4: ('VSYS', 'VSYS')}),
    'P1.PH-G': dict(board='P1', family='XH', positions=3, pins='p1-p3', title='Optional UART0 link (no cable in V1-PROOF)',
                    load={1: ('GP0', None), 2: ('GP1', None), 3: ('GND', None)}),
    'P1.USB': dict(board='P1', family='Micro-USB', positions=4, pins='onboard', title='Onboard Micro-USB',
                   load={1: ('VBUS', 'USB_VBUS'), 2: ('D+', 'USB_D+'), 3: ('D-', 'USB_D-'), 4: ('GND', 'GND')}),
    'U1.JMAIN': dict(board='U1', family='XH', positions=6, pins='main pads', title='LSM6DSO main SPI pads',
                     load={1: ('GND', 'GND'), 2: ('3V3', '3V3'), 3: ('SDA / SDI', 'SPI_SDI'), 4: ('SCL', 'SPI_SCL'), 5: ('SDO', 'SPI_SDO'), 6: ('CS', 'SPI_CS')}),
    'U1.JINT': dict(board='U1', family='XH', positions=2, pins='INT2, INT1 pads', title='LSM6DSO interrupt pads',
                    load={1: ('INT2', None), 2: ('INT1', 'IMU_INT1')}),
    'DB.JSIG-L': dict(board='DB', family='XH', positions=5, pins='protoboard', title='Left driver signals',
                      load={1: ('EN', 'L_EN'), 2: ('PH', 'L_PH'), 3: ('nFAULT', 'L_FAULT'), 4: ('CS out', 'L_CS'), 5: ('GND', 'GND')}),
    'DB.JSIG-R': dict(board='DB', family='XH', positions=5, pins='protoboard', title='Right driver signals',
                      load={1: ('EN', 'R_EN'), 2: ('PH', 'R_PH'), 3: ('nFAULT', 'R_FAULT'), 4: ('CS out', 'R_CS'), 5: ('GND', 'GND')}),
    'DB.JCTL': dict(board='DB', family='XH', positions=2, pins='protoboard', title='Shared nSLEEP',
                    load={1: ('nSLEEP', 'nSLEEP'), 2: ('spare', None)}),
    'DB.J3V3': dict(board='DB', family='XH', positions=2, pins='protoboard', title='Pull-up supply from the Pico 3V3',
                    load={1: ('3V3', '3V3'), 2: ('spare', None)}),
    'DB.JML': dict(board='DB', family='XH', positions=2, pins='protoboard', title='Left motor OUT1 / OUT2',
                   load={1: ('OUT1', 'L_MOTOR_OUT1'), 2: ('OUT2', 'L_MOTOR_OUT2')}),
    'DB.JMR': dict(board='DB', family='XH', positions=2, pins='protoboard', title='Right motor OUT1 / OUT2',
                   load={1: ('OUT1', 'R_MOTOR_OUT1'), 2: ('OUT2', 'R_MOTOR_OUT2')}),
    'DB.XRAIL': dict(board='DB', family='XT30', positions=2, pins='pigtail', title='Switched rail in',
                     load={1: ('+', 'RAIL'), 2: ('-', 'GND')}),
    'JLEG.JML_IN': dict(board='JLEG', family='P6', positions=6, pins='1x6 male header', title='Left Pololu pigtail',
                        load={1: ('RED', 'L_MOTOR_OUT1'), 2: ('BLACK', 'L_MOTOR_OUT2'), 3: ('GREEN', 'GND'), 4: ('BLUE', '5V'), 5: ('YELLOW', 'L_ENC_A5'), 6: ('WHITE', 'L_ENC_B5')}),
    'JLEG.JMR_IN': dict(board='JLEG', family='P6', positions=6, pins='1x6 male header', title='Right Pololu pigtail',
                        load={1: ('RED', 'R_MOTOR_OUT1'), 2: ('BLACK', 'R_MOTOR_OUT2'), 3: ('GREEN', 'GND'), 4: ('BLUE', '5V'), 5: ('YELLOW', 'R_ENC_A5'), 6: ('WHITE', 'R_ENC_B5')}),
    'JLEG.JPL': dict(board='JLEG', family='XH', positions=2, pins='protoboard', title='Left motor power to driver',
                     load={1: ('OUT1', 'L_MOTOR_OUT1'), 2: ('OUT2', 'L_MOTOR_OUT2')}),
    'JLEG.JPR': dict(board='JLEG', family='XH', positions=2, pins='protoboard', title='Right motor power to driver',
                     load={1: ('OUT1', 'R_MOTOR_OUT1'), 2: ('OUT2', 'R_MOTOR_OUT2')}),
    'JLEG.JENC': dict(board='JLEG', family='XH', positions=5, pins='protoboard', title='Encoder outputs, 3.3 V level',
                      load={1: ('L_A', 'L_ENC_A'), 2: ('L_B', 'L_ENC_B'), 3: ('R_A', 'R_ENC_A'), 4: ('R_B', 'R_ENC_B'), 5: ('GND', 'GND')}),
    'JLEG.J5V': dict(board='JLEG', family='XH', positions=2, pins='protoboard', title='Encoder supply',
                     load={1: ('5V', '5V'), 2: ('GND', 'GND')}),
    'KC.XPACK': dict(board='KC', family='XT30', positions=2, pins='pigtail', title='Fused pack in',
                     load={1: ('+', 'PACK_FUSED'), 2: ('-', 'GND')}),
    'KC.XRAIL': dict(board='KC', family='XT30', positions=2, pins='pigtail', title='Switched rail out (Pololu 2813 VOUT)',
                     load={1: ('+', 'RAIL'), 2: ('-', 'GND')}),
    'KC.JBUS': dict(board='KC', family='XH', positions=2, pins='protoboard', title='Unswitched fused bus to the 5 V regulator',
                    load={1: ('BUS', 'BUS'), 2: ('GND', 'GND')}),
    'KC.JHB': dict(board='KC', family='XH', positions=3, pins='protoboard', title='Heartbeat in, rail sense out',
                   load={1: ('HB', 'HB'), 2: ('RAIL_ADC', 'RAIL_ADC'), 3: ('AGND', 'AGND')}),
    'KC.JKILL': dict(board='KC', family='XH', positions=2, pins='protoboard', title='KILL button',
                     load={1: ('3V3K', 'KILL_A'), 2: ('OFF node', 'KILL_B')}),
    'KC.JARM': dict(board='KC', family='XH', positions=2, pins='protoboard', title='ARM button',
                    load={1: ('3V3K', 'ARM_A'), 2: ('ON node', 'ARM_B')}),
    'PDB.JIN': dict(board='PDB', family='XH', positions=2, pins='protoboard', title='Fused bus in',
                    load={1: ('BUS', 'BUS'), 2: ('GND', 'GND')}),
    'PDB.JPICO': dict(board='PDB', family='XH', positions=2, pins='protoboard', title='5 V through D5 to VSYS',
                      load={1: ('VSYS', 'VSYS'), 2: ('GND', 'GND')}),
    'PDB.J5V': dict(board='PDB', family='XH', positions=2, pins='protoboard', title='5 V to the encoder junction',
                    load={1: ('5V', '5V'), 2: ('GND', 'GND')}),
    'BAT.LEADS': dict(board='BAT', family='pack leads', positions=2, pins='pack', title='Pack leads',
                      load={1: ('+', 'PACK'), 2: ('-', 'GND')}),
    'F1.INLINE': dict(board='F1', family='inline fuse holder', positions=2, pins='holder', title='Main fuse, value open',
                      load={1: ('IN', 'PACK'), 2: ('OUT', 'PACK_FUSED')}),
    'SWK.LEADS': dict(board='SWK', family='XH', positions=2, pins='button', title='KILL button leads',
                      load={1: ('NO', 'KILL_A'), 2: ('COM', 'KILL_B')}),
    'SWA.LEADS': dict(board='SWA', family='XH', positions=2, pins='button', title='ARM button leads',
                      load={1: ('NO', 'ARM_A'), 2: ('COM', 'ARM_B')}),
    'JUSB.CABLE': dict(board='JUSB', family='Micro-USB', positions=4, pins='cable', title='Laptop USB cable',
                       load={1: ('VBUS', 'USB_VBUS'), 2: ('D+', 'USB_D+'), 3: ('D-', 'USB_D-'), 4: ('GND', 'GND')}),
    'ML.PIGTAIL': dict(board='ML', family='P6', positions=6, pins='vendor housing', title='Pololu 4752 leads, 200 mm',
                       load={1: ('RED', 'L_MOTOR_OUT1'), 2: ('BLACK', 'L_MOTOR_OUT2'), 3: ('GREEN', 'GND'), 4: ('BLUE', '5V'), 5: ('YELLOW', 'L_ENC_A5'), 6: ('WHITE', 'L_ENC_B5')}),
    'MR.PIGTAIL': dict(board='MR', family='P6', positions=6, pins='vendor housing', title='Pololu 4752 leads, 200 mm',
                       load={1: ('RED', 'R_MOTOR_OUT1'), 2: ('BLACK', 'R_MOTOR_OUT2'), 3: ('GREEN', 'GND'), 4: ('BLUE', '5V'), 5: ('YELLOW', 'R_ENC_A5'), 6: ('WHITE', 'R_ENC_B5')}),
}

# Splices are soldered joints inside the harness, covered with heat shrink.
SPLICES = {'SP1': dict(net='3V3', near='P1', note='3V3 from P1.PH-F.1 to the IMU and the driver pull-ups. About 30 mm from the Pico header.')}

# Bundles: wires that run together and get one cut length. 'route' names the
# two ends for the route model. Vendor and fixture leads carry a fixed length.
BUNDLES = [
    dict(id='B1', name='Sensor', ends=('P1', 'U1'), awg=24, wires=[
        ('P1.PH-C.1', 'U1.JMAIN.5', 'SPI_SDO'), ('P1.PH-C.2', 'U1.JMAIN.6', 'SPI_CS'), ('P1.PH-C.3', 'U1.JMAIN.1', 'GND'),
        ('P1.PH-C.4', 'U1.JMAIN.4', 'SPI_SCL'), ('P1.PH-C.5', 'U1.JMAIN.3', 'SPI_SDI'), ('P1.PH-C.6', 'U1.JINT.2', 'IMU_INT1'),
        ('SP1', 'U1.JMAIN.2', '3V3')]),
    dict(id='B2', name='3V3 feed', ends=('P1', 'DB'), awg=22, wires=[
        ('P1.PH-F.1', 'SP1', '3V3'), ('SP1', 'DB.J3V3.1', '3V3')]),
    dict(id='B3', name='Left driver signals', ends=('P1', 'DB'), awg=24, wires=[
        ('P1.PH-A2.2', 'DB.JSIG-L.1', 'L_EN'), ('P1.PH-A2.3', 'DB.JSIG-L.2', 'L_PH'), ('P1.PH-B.5', 'DB.JSIG-L.3', 'L_FAULT'),
        ('P1.PH-E.1', 'DB.JSIG-L.4', 'L_CS'), ('P1.PH-B.3', 'DB.JSIG-L.5', 'GND')]),
    dict(id='B4', name='Right driver signals', ends=('P1', 'DB'), awg=24, wires=[
        ('P1.PH-B.1', 'DB.JSIG-R.1', 'R_EN'), ('P1.PH-B.2', 'DB.JSIG-R.2', 'R_PH'), ('P1.PH-D.1', 'DB.JSIG-R.3', 'R_FAULT'),
        ('P1.PH-E.2', 'DB.JSIG-R.4', 'R_CS'), ('P1.PH-D.5', 'DB.JSIG-R.5', 'GND')]),
    dict(id='B5', name='Driver sleep', ends=('P1', 'DB'), awg=24, wires=[('P1.PH-B.4', 'DB.JCTL.1', 'nSLEEP')]),
    dict(id='B6', name='Encoder signals', ends=('P1', 'JLEG'), awg=24, wires=[
        ('P1.PH-A.1', 'JLEG.JENC.1', 'L_ENC_A'), ('P1.PH-A.2', 'JLEG.JENC.2', 'L_ENC_B'), ('P1.PH-A.3', 'JLEG.JENC.3', 'R_ENC_A'),
        ('P1.PH-A.4', 'JLEG.JENC.4', 'R_ENC_B'), ('P1.PH-A2.1', 'JLEG.JENC.5', 'GND')]),
    dict(id='B7', name='Kill-chain sense', ends=('P1', 'KC'), awg=24, wires=[
        ('P1.PH-D.6', 'KC.JHB.1', 'HB'), ('P1.PH-E.4', 'KC.JHB.2', 'RAIL_ADC'), ('P1.PH-E.3', 'KC.JHB.3', 'AGND')]),
    dict(id='B8', name='Pico power', ends=('PDB', 'P1'), awg=22, wires=[
        ('PDB.JPICO.1', 'P1.PH-F.4', 'VSYS'), ('PDB.JPICO.2', 'P1.PH-F.3', 'GND')]),
    dict(id='B9', name='Logic bus', ends=('KC', 'PDB'), awg=22, wires=[
        ('KC.JBUS.1', 'PDB.JIN.1', 'BUS'), ('KC.JBUS.2', 'PDB.JIN.2', 'GND')]),
    dict(id='B10', name='Switched rail', ends=('KC', 'DB'), awg=20, wires=[
        ('KC.XRAIL.1', 'DB.XRAIL.1', 'RAIL'), ('KC.XRAIL.2', 'DB.XRAIL.2', 'GND')]),
    dict(id='B11', name='Encoder supply', ends=('PDB', 'JLEG'), awg=22, wires=[
        ('PDB.J5V.1', 'JLEG.J5V.1', '5V'), ('PDB.J5V.2', 'JLEG.J5V.2', 'GND')]),
    dict(id='B12', name='Left motor power', ends=('DB', 'JLEG'), awg=22, wires=[
        ('DB.JML.1', 'JLEG.JPL.1', 'L_MOTOR_OUT1'), ('DB.JML.2', 'JLEG.JPL.2', 'L_MOTOR_OUT2')]),
    dict(id='B13', name='Right motor power', ends=('DB', 'JLEG'), awg=22, wires=[
        ('DB.JMR.1', 'JLEG.JPR.1', 'R_MOTOR_OUT1'), ('DB.JMR.2', 'JLEG.JPR.2', 'R_MOTOR_OUT2')]),
    dict(id='B14', name='Left motor pigtail (vendor)', ends=('ML', 'JLEG'), awg='vendor', fixed_mm=200, wires=[
        (f'ML.PIGTAIL.{i}', f'JLEG.JML_IN.{i}', net) for i, net in enumerate(['L_MOTOR_OUT1', 'L_MOTOR_OUT2', 'GND', '5V', 'L_ENC_A5', 'L_ENC_B5'], 1)]),
    dict(id='B15', name='Right motor pigtail (vendor)', ends=('MR', 'JLEG'), awg='vendor', fixed_mm=200, wires=[
        (f'MR.PIGTAIL.{i}', f'JLEG.JMR_IN.{i}', net) for i, net in enumerate(['R_MOTOR_OUT1', 'R_MOTOR_OUT2', 'GND', '5V', 'R_ENC_A5', 'R_ENC_B5'], 1)]),
    dict(id='B16', name='Pack', ends=('BAT', 'KC'), awg=20, wires=[
        ('BAT.LEADS.1', 'F1.INLINE.1', 'PACK'), ('F1.INLINE.2', 'KC.XPACK.1', 'PACK_FUSED'), ('BAT.LEADS.2', 'KC.XPACK.2', 'GND')]),
    dict(id='B17', name='KILL button (fixture)', ends=('SWK', 'KC'), awg=24, fixed_mm=600, wires=[
        ('SWK.LEADS.1', 'KC.JKILL.1', 'KILL_A'), ('SWK.LEADS.2', 'KC.JKILL.2', 'KILL_B')]),
    dict(id='B18', name='ARM button (fixture)', ends=('SWA', 'KC'), awg=24, fixed_mm=600, wires=[
        ('SWA.LEADS.1', 'KC.JARM.1', 'ARM_A'), ('SWA.LEADS.2', 'KC.JARM.2', 'ARM_B')]),
    dict(id='B19', name='Laptop USB cable (external)', ends=('JUSB', 'P1'), awg='cable', fixed_mm=None, wires=[
        ('JUSB.CABLE.1', 'P1.USB.1', 'USB_VBUS'), ('JUSB.CABLE.2', 'P1.USB.2', 'USB_D+'), ('JUSB.CABLE.3', 'P1.USB.3', 'USB_D-'), ('JUSB.CABLE.4', 'P1.USB.4', 'GND')]),
]

# Purchase candidates, checked on 2026-10-17. Prices change; record the paid
# order in docs/purchases.md. One 460-piece kit covers the housing, header and
# contact counts below with spares.
PURCHASE = [
    dict(item='JST-XH connector kit, 460 pcs: 2/3/4/5/6-position housings, PCB headers, female crimp contacts',
         vendor='Amazon (IZOKEE, sold by KeeYees-US)', price_usd=9.99, asin='B0791DJMW9',
         url='https://www.amazon.com/IZOKEE-460pcs-Connector-Housing-Terminal/dp/B0791DJMW9',
         note='Covers every XH connector in this harness. Only 2 to 6 positions, so no header has more than 6.'),
    dict(item='Ratcheting crimp tool for open-barrel JST / Molex contacts, 32-20 AWG (iCrimp IWS-3220M or IWISS SN-01BM)',
         vendor='Amazon', price_usd=25.99, asin=None,
         url='https://www.amazon.com/jst-xh-connector-kit/s?k=jst+xh+connector+kit',
         note='Listed with the kit as frequently bought together. Any 0.1 in open-barrel ratcheting crimper works.'),
    dict(item='Pre-crimped XH leads with housings, 2 to 7 positions (alternative to crimping)',
         vendor='Amazon', price_usd=16.99, asin=None,
         url='https://www.amazon.com/jst-xh-connector-kit/s?k=jst+xh+connector+kit',
         note='Shortcut for the first build: cut the leads to the EL-06 lengths and solder the joins. Search the kit results for a pre-crimped set.'),
    dict(item='XT30 connector pairs with pigtails (pack, fuse, rail)', vendor='hobby supplier', price_usd=None, asin=None, url=None,
         note='Two pairs. Match the pack connector when the pack is chosen.'),
]

# Physical harnesses: the bundles that are built as one assembly. Every
# connector housing belongs to exactly one harness.
HARNESSES = [
    dict(id='H1', name='CTRL deck harness', bundles=['B1', 'B2', 'B8'],
         pico=['P1.PH-C', 'P1.PH-F'], ends=['U1.JMAIN', 'U1.JINT', 'PDB.JPICO', 'DB.J3V3'],
         note='Sensor wires to the IMU, logic power from the PDB, one 3V3 tail down the far side to the driver board. Splice SP1 near the Pico.'),
    dict(id='H2', name='Right trunk harness', bundles=['B3', 'B4', 'B5', 'B6', 'B7'],
         pico=['P1.PH-A', 'P1.PH-A2', 'P1.PH-B', 'P1.PH-D', 'P1.PH-E'], ends=['DB.JSIG-L', 'DB.JSIG-R', 'DB.JCTL', 'JLEG.JENC', 'KC.JHB'],
         note='All Pico I/O down the front face of the far half. Three branches: driver board, leg junction encoders, kill-chain sense.'),
    dict(id='H3', name='Logic bus', bundles=['B9'], pico=[], ends=['KC.JBUS', 'PDB.JIN'], note='Unswitched fused bus up to the 5 V regulator. 22 AWG.'),
    dict(id='H4', name='Switched rail', bundles=['B10'], pico=[], ends=['KC.XRAIL', 'DB.XRAIL'], note='Pololu 2813 VOUT across the PWR deck to both drivers. XT30, 20 AWG.'),
    dict(id='H5', name='Encoder supply', bundles=['B11'], pico=[], ends=['PDB.J5V', 'JLEG.J5V'], note='5 V and GND down the mid gap to the leg junction board. 22 AWG.'),
    dict(id='H6', name='Left motor power', bundles=['B12'], pico=[], ends=['DB.JML', 'JLEG.JPL'], note='OUT1 / OUT2, straight down. 22 AWG.'),
    dict(id='H7', name='Right motor power', bundles=['B13'], pico=[], ends=['DB.JMR', 'JLEG.JPR'], note='OUT1 / OUT2, straight down. 22 AWG.'),
    dict(id='H8', name='Left motor pigtail', bundles=['B14'], pico=[], ends=['ML.PIGTAIL', 'JLEG.JML_IN'], note='Vendor cable, 200 mm, 1x6 0.1 in housing. No work.'),
    dict(id='H9', name='Right motor pigtail', bundles=['B15'], pico=[], ends=['MR.PIGTAIL', 'JLEG.JMR_IN'], note='Vendor cable, 200 mm, 1x6 0.1 in housing. No work.'),
    dict(id='H10', name='Pack lead', bundles=['B16'], pico=[], ends=['BAT.LEADS', 'F1.INLINE', 'KC.XPACK'], note='Pack to the inline fuse to the kill-chain board. XT30 at the board. 20 AWG.'),
    dict(id='H11', name='KILL button lead', bundles=['B17'], pico=[], ends=['SWK.LEADS', 'KC.JKILL'], note='Fixture lead, 600 mm.'),
    dict(id='H12', name='ARM button lead', bundles=['B18'], pico=[], ends=['SWA.LEADS', 'KC.JARM'], note='Fixture lead, 600 mm.'),
]

TERMINATION_MM = 15      # strip, crimp and housing entry, each end
SLACK = 0.10             # route tolerance; the model is Manhattan, the cable is not
ROUND_MM = 5


def manhattan(a, b):
    return sum(abs(p - q) for p, q in zip(a, b))


def notch(ref, lane=None):
    loc = LOCATIONS[ref]
    lane = lane or loc['lane']
    if lane == 'centre':
        lane = 'near'
    return (NOTCH_X, LANE_Y[lane], DECK_Z[loc['deck']] + 2)


def route(a, b):
    """Return the modelled path from component a to component b."""
    A, B = LOCATIONS[a], LOCATIONS[b]
    pa, pb = A['xyz'], B['xyz']
    if A['deck'] and B['deck']:
        # Same board stack: board -> front notch of its lane -> along the front
        # face (vertical, then lane change) -> notch of the other lane -> board.
        lane_a = A['lane'] if A['lane'] != 'centre' else B['lane']
        lane_b = B['lane'] if B['lane'] != 'centre' else A['lane']
        na = notch(a, lane_a)
        nb = notch(b, lane_b)
        if A['deck'] == B['deck'] and lane_a == lane_b:
            return [pa, pb]
        if A['deck'] == B['deck']:
            # Same deck, other half: straight across the deck.
            return [pa, pb]
        return [pa, na, nb, pb]
    return [pa, pb]


def run_length(bundle):
    if bundle.get('fixed_mm') is not None:
        return dict(path_mm=None, cut_mm=bundle['fixed_mm'], fixed=True)
    if 'fixed_mm' in bundle:
        return dict(path_mm=None, cut_mm=None, fixed=True)
    path = route(*bundle['ends'])
    length = sum(manhattan(p, q) for p, q in zip(path, path[1:]))
    cut = length * (1 + SLACK) + 2 * TERMINATION_MM
    cut = math.ceil(cut / ROUND_MM) * ROUND_MM
    return dict(path_mm=round(length), cut_mm=int(cut), fixed=False, path=path)


def wires():
    """Flat wire list with ids. Order follows the bundle order."""
    out = []
    for b in BUNDLES:
        for src, dst, net in b['wires']:
            out.append(dict(id=f'H{len(out)+1:03d}', bundle=b['id'], source=src, destination=dst, net=net, awg=b['awg']))
    return out


def endpoint_label(key):
    if key in SPLICES:
        return f'{key} splice ({SPLICES[key]["net"]})'
    conn, pos = key.rsplit('.', 1)
    pin, net = CONNECTORS[conn]['load'][int(pos)]
    return f'{key} / {pin}'


def validate():
    seen = {}
    for w in wires():
        for end in (w['source'], w['destination']):
            if end in SPLICES:
                continue
            conn, pos = end.rsplit('.', 1)
            pin, net = CONNECTORS[conn]['load'][int(pos)]
            assert net == w['net'], (end, net, w['net'])
            assert end not in seen, ('endpoint used twice', end)
            seen[end] = w['id']
    for key, c in CONNECTORS.items():
        assert len(c['load']) == c['positions'], key
        for pos, (pin, net) in c['load'].items():
            full = f'{key}.{pos}'
            assert (net is None) == (full not in seen), ('loaded position without a wire or wire into an empty position', full, net)
        # XH headers on a 0.1 in grid, and the kit covers 2 to 6 positions.
        if c['family'] == 'XH':
            assert 2 <= c['positions'] <= 6, key
    return True


def bom():
    """Connector hardware counts for the V1-PROOF harness."""
    housings, headers, contacts = {}, {}, 0
    for key, c in CONNECTORS.items():
        if c['family'] != 'XH':
            continue
        n = c['positions']
        housings[n] = housings.get(n, 0) + 1
        if c['board'] not in ('SWK', 'SWA'):
            headers[n] = headers.get(n, 0) + 1
        contacts += sum(1 for pin, net in c['load'].values() if net)
    wire_by_awg = {}
    for b in BUNDLES:
        L = run_length(b)
        if L['cut_mm'] is None or b['awg'] in ('vendor', 'cable'):
            continue
        wire_by_awg[b['awg']] = wire_by_awg.get(b['awg'], 0) + L['cut_mm'] * len(b['wires'])
    return dict(purchase=PURCHASE, xh_housings={f'XHP-{n}': q for n, q in sorted(housings.items())},
                xh_headers={f'B{n}B-XH-A': q for n, q in sorted(headers.items())},
                xh_contacts=contacts, xh_contacts_with_spares=math.ceil(contacts * 1.3),
                xt30_pairs=2, pololu_1x6_male_headers=2,
                wire_mm_by_awg={f'AWG {k}': v for k, v in sorted(wire_by_awg.items())})


def data():
    validate()
    runs = []
    for b in BUNDLES:
        L = run_length(b)
        runs.append(dict(id=b['id'], name=b['name'], ends=list(b['ends']), awg=b['awg'], conductors=len(b['wires']),
                         path_mm=L['path_mm'], cut_mm=L['cut_mm'], fixed=L['fixed'],
                         path=[list(p) for p in L.get('path', [])] if L.get('path') else None))
    return dict(revision=REVISION, date=DATE, standard=dict(
                    low_voltage='JST XH 2.50 mm: header B#B-XH-A, housing XHP-#, contact SXH-001T-P0.6 (22-28 AWG)',
                    power='XT30 for the pack, the fuse and the switched rail',
                    motor='Pololu 4752 pigtail keeps its 1x6 0.1 in housing; mates with a 1x6 male header on JLEG',
                    pico_end='Decided 2026-10-17: the user desolders the pre-soldered pins of the Pico 2 and solders the XH headers to the board. The harness plugs into the Pico directly.',
                    wire='24 AWG signals, 22 AWG for 5 V / 3V3 / motor OUT1-OUT2, 20 AWG for the pack and the rail'),
                length_model=dict(rule='Manhattan path: board -> front deck notch -> front face -> notch -> board. Cut = path x 1.10 + 2 x 15 mm, rounded up to 5 mm.',
                                  status='Estimate. Cut long, route on the frame, trim, record the measured length.'),
                locations={k: {kk: vv for kk, vv in v.items()} for k, v in LOCATIONS.items()},
                connectors=CONNECTORS, splices=SPLICES, bundles=runs, wires=wires(), harnesses=harnesses(runs), bom=bom())


def harnesses(runs):
    """Physical harness cards: ends, housings, branch lengths."""
    by_id = {r['id']: r for r in runs}
    out = []
    owner = {}
    for h in HARNESSES:
        conns = set(h['pico']) | set(h['ends'])
        for b in h['bundles']:
            for src, dst, net in next(x for x in BUNDLES if x['id'] == b)['wires']:
                for e in (src, dst):
                    if e not in SPLICES:
                        conns.add(e.rsplit('.', 1)[0])
        for c in conns:
            assert c not in owner, ('connector in two harnesses', c, owner.get(c), h['id'])
            owner[c] = h['id']
        branches = [dict(bundle=b, name=by_id[b]['name'], ends=by_id[b]['ends'], wires=by_id[b]['conductors'], awg=by_id[b]['awg'], cut_mm=by_id[b]['cut_mm'], fixed=by_id[b]['fixed']) for b in h['bundles']]
        wires_total = sum(x['wires'] for x in branches)
        out.append(dict(id=h['id'], name=h['name'], note=h['note'], pico=h['pico'], ends=h['ends'], branches=branches, wires=wires_total,
                        connectors=sorted(conns), longest_mm=max((x['cut_mm'] or 0) for x in branches)))
    unowned = {k for k in CONNECTORS if k not in owner and k != 'JUSB.CABLE' and k != 'P1.USB' and k != 'P1.PH-G'}
    assert not unowned, ('connector without a harness', unowned)
    return out


def write_outputs():
    d = data()
    (HERE / 'v1-proof-harness.json').write_text(json.dumps(d, indent=2) + '\n')
    rows = []
    for r in d['bundles']:
        cut = '—' if r['cut_mm'] is None else f"{r['cut_mm']} mm" + (' (fixed)' if r['fixed'] else '')
        path = '—' if r['path_mm'] is None else f"{r['path_mm']} mm"
        rows.append('<tr>' + ''.join(f'<td>{escape(str(t))}</td>' for t in [r['id'], r['name'], ' → '.join(r['ends']), r['conductors'], r['awg'], path, cut]) + '</tr>')
    wrows = []
    for w in d['wires']:
        wrows.append('<tr>' + ''.join(f'<td>{escape(str(t))}</td>' for t in [w['id'], w['bundle'], endpoint_label(w['source']), endpoint_label(w['destination']), w['net'], w['awg']]) + '</tr>')
    crows = []
    for key, c in d['connectors'].items():
        loads = '<br>'.join(f"{pos}: {pin}" + (f" — {net}" if net else ' — empty') for pos, (pin, net) in sorted(c['load'].items()))
        crows.append('<tr>' + ''.join(f'<td>{t}</td>' for t in [escape(key), escape(c['family']), c['positions'], escape(c['pins']), escape(c['title']), loads]) + '</tr>')
    hrows = ''.join('<tr>' + ''.join(f'<td>{escape(str(t))}</td>' for t in [h['id'], h['name'], ', '.join(h['pico'] or [h['ends'][0]]), ', '.join(e for e in h['ends'] if e not in (h['pico'] or [h['ends'][0]])), h['wires'], '; '.join(f"{x['bundle']} {x['cut_mm']} mm" + (' fixed' if x['fixed'] else '') for x in h['branches'])]) + '</tr>' for h in d['harnesses'])
    brows = ''.join(f'<tr><td>{escape(k)}</td><td>{escape(str(v))}</td></tr>' for group in ['xh_housings', 'xh_headers', 'wire_mm_by_awg'] for k, v in d['bom'][group].items())
    brows += f"<tr><td>SXH-001T-P0.6 contacts</td><td>{d['bom']['xh_contacts']} used, buy {d['bom']['xh_contacts_with_spares']}</td></tr>"
    brows += f"<tr><td>XT30 pairs</td><td>{d['bom']['xt30_pairs']}</td></tr><tr><td>1x6 0.1 in male headers</td><td>{d['bom']['pololu_1x6_male_headers']}</td></tr>"
    prows = ''.join('<tr><td>' + (f'<a href="{escape(x["url"])}">{escape(x["item"])}</a>' if x['url'] else escape(x['item'])) + f"</td><td>{escape(x['vendor'])}</td><td>{'$%.2f' % x['price_usd'] if x['price_usd'] else 'open'}</td><td>{escape(x['note'])}</td></tr>" for x in d['bom']['purchase'])
    html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hux Rev C harness register</title><style>body{{margin:0;background:#f7f5ee;color:#20343e;font:16px/1.6 system-ui,sans-serif}}main{{max-width:1200px;margin:auto;padding:32px}}h1{{font-size:36px;line-height:1.15}}h2{{font-size:24px;margin-top:40px}}a{{color:#387b65}}input{{font:inherit;width:100%;padding:12px;box-sizing:border-box;border:1px solid #647780;background:#fffef9}}table{{width:100%;border-collapse:collapse;margin-top:16px;font-size:14px}}th,td{{text-align:left;padding:10px 12px;border-bottom:1px solid #ced8d7;vertical-align:top}}th{{background:#e8eeea}}.scroll{{overflow:auto}}small{{color:#647780}}input:focus-visible,a:focus-visible{{outline:3px solid #218ca0;outline-offset:3px}}</style></head><body><main>
<p>HUX / V1-PROOF / HARNESS / REV {REVISION}</p><h1>Harnesses, cut lengths and connector loading</h1>
<p>{DATE}. The run lengths come from a route model, not from a measurement. Cut each run long, route it on the frame, then trim it and record the length. The robot LEFT is the near wall.</p>
<p><a href="../../tools/living-drawings/electrical.html">Electrical page</a> · <a href="v1-proof-el-01-overview.svg">EL-01 by location</a> · <a href="v1-proof-el-06-harness-runs.svg">EL-06 runs</a> · <a href="v1-proof-el-07-connectors.svg">EL-07 connectors</a> · <a href="v1-proof-harness.json">JSON</a> · <a href="v1-proof-wire-register.html">EL-01 conductor register</a></p>
<h2>Twelve harnesses</h2><div class="scroll"><table><thead><tr><th>Harness</th><th>Name</th><th>From</th><th>To</th><th>Wires</th><th>Branch cut lengths</th></tr></thead><tbody>{hrows}</tbody></table></div>
<p><small>Each housing belongs to one harness. EL-06 draws one card for each harness. The bundle table below is the detail behind the cards.</small></p>
<h2>Connector standard</h2><table><tbody>{''.join(f'<tr><td>{escape(k)}</td><td>{escape(v)}</td></tr>' for k, v in d['standard'].items())}</tbody></table>
<h2>Bundles and cut lengths</h2><div class="scroll"><table><thead><tr><th>Bundle</th><th>Name</th><th>Ends</th><th>Wires</th><th>AWG</th><th>Model path</th><th>Cut length</th></tr></thead><tbody>{''.join(rows)}</tbody></table></div>
<p><small>{escape(d['length_model']['rule'])} B14 and B15 are the vendor pigtails. B17 and B18 are fixture leads for the bench. The USB cable is external.</small></p>
<h2>Wires</h2><label for="search">Find a wire, connector, position or net</label><input id="search" type="search" placeholder="For example: PH-A, JLEG, nSLEEP or H012"><p id="count" aria-live="polite"></p>
<div class="scroll"><table id="wires"><thead><tr><th>Wire</th><th>Bundle</th><th>From</th><th>To</th><th>Net</th><th>AWG</th></tr></thead><tbody>{''.join(wrows)}</tbody></table></div>
<h2>Connector loading</h2><div class="scroll"><table><thead><tr><th>Connector</th><th>Family</th><th>Positions</th><th>Pins</th><th>Function</th><th>Loading</th></tr></thead><tbody>{''.join(crows)}</tbody></table></div>
<h2>Connector hardware</h2><table><tbody>{brows}</tbody></table>
<h2>Purchase candidates ({DATE})</h2><div class="scroll"><table><thead><tr><th>Item</th><th>Vendor</th><th>Price seen</th><th>Note</th></tr></thead><tbody>{prows}</tbody></table></div>
<p><small>Counts cover the V1-PROOF harness only. Wire lengths are the cut lengths multiplied by the conductor count. Buy contacts with spares for crimp practice.</small></p>
</main><script>const q=document.getElementById('search'),rows=[...document.querySelectorAll('#wires tbody tr')],count=document.getElementById('count');function filter(){{const term=q.value.toLowerCase().trim();let n=0;for(const row of rows){{row.hidden=!row.textContent.toLowerCase().includes(term);if(!row.hidden)n++;}}count.textContent=n+' of '+rows.length+' wires';}}q.addEventListener('input',filter);filter();</script></body></html>'''
    (HERE / 'v1-proof-harness.html').write_text(html)
    return d


if __name__ == '__main__':
    d = write_outputs()
    for r in d['bundles']:
        print(f"{r['id']:4} {r['name']:32} {str(r['path_mm']):>6} {str(r['cut_mm']):>6}")
    print(json.dumps(d['bom'], indent=1))

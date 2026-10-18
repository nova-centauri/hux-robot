#!/usr/bin/env python3
"""Check build-guide information against the electrical model."""
from html.parser import HTMLParser
from pathlib import Path
import re
import unittest
import xml.etree.ElementTree as ET

import assembly
import harness


class WireRows(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows = {}
        self.current = None

    def handle_starttag(self, tag, attrs):
        wire_id = dict(attrs).get('data-wire')
        if tag == 'tr' and wire_id:
            if wire_id in self.rows:
                raise AssertionError(f'Duplicate wire {wire_id}')
            self.current = wire_id
            self.rows[wire_id] = ''

    def handle_endtag(self, tag):
        if tag == 'tr':
            self.current = None

    def handle_data(self, text):
        if self.current:
            self.rows[self.current] += text + ' '


class AssemblyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = harness.data()
        cls.cards = ''.join(assembly.harness_card(h, cls.data) for h in cls.data['harnesses'])
        cls.parser = WireRows()
        cls.parser.feed(cls.cards)

    def test_every_harness_wire_appears_once_with_both_endpoints(self):
        expected = {w['id']: w for w in self.data['wires'] if w['bundle'] != 'B19'}
        self.assertEqual(set(self.parser.rows), set(expected))
        for wire_id, wire in expected.items():
            for key in ('source', 'destination'):
                endpoint = wire[key]
                if endpoint != 'SP1':
                    conn, pos = endpoint.rsplit('.', 1)
                    self.assertIn(conn + '  ' + pos, self.parser.rows[wire_id])
                else:
                    self.assertIn('SP1', self.parser.rows[wire_id])

    def test_vendor_motor_black_is_not_ground(self):
        for bundle in ('B14', 'B15'):
            wires = [w for w in self.data['wires'] if w['bundle'] == bundle]
            self.assertEqual([assembly.wire_color(w) for w in wires],
                             ['Red', 'Black', 'Green', 'Blue', 'Yellow', 'White'])
            ground = next(w for w in wires if w['net'] == 'GND')
            self.assertEqual(assembly.wire_color(ground), 'Green')
        self.assertIn('Black', self.parser.rows['H038'])
        self.assertIn('L_MOTOR_OUT2', self.parser.rows['H038'])

    def test_no_fabricated_splice_or_fuse_cuts(self):
        for wire_id in ('H007', 'H008', 'H009'):
            self.assertIn('Fit at SP1', self.parser.rows[wire_id])
            self.assertNotIn('335 mm', self.parser.rows[wire_id])
        for wire_id in ('H053', 'H054', 'H055'):
            self.assertIn('Measure first', self.parser.rows[wire_id])
            self.assertNotIn('200 mm', self.parser.rows[wire_id])

    def test_partial_housings_need_contacts_only_for_loaded_positions(self):
        h1 = self.data['harnesses'][0]
        wires = [w for w in self.data['wires'] if w['bundle'] in ('B1', 'B2', 'B8')]
        card = assembly.connector_card('P1.PH-F', self.data, wires)
        self.assertIn('XHP-4', card)
        self.assertIn('3 × SXH-001T-P0.6 contacts', card)
        self.assertIn('Position 2, EMPTY, 3V3_EN, No wire. No contact.', card)
        self.assertIn('19 × SXH-001T-P0.6', assembly.parts_list(h1, self.data, wires))

    def test_views_mirror_positions_without_swapping_wire_colors(self):
        wires = [w for w in self.data['wires'] if w['bundle'] in ('B1', 'B2', 'B8')]
        card = assembly.connector_card('P1.PH-F', self.data, wires)
        diagrams = [ET.fromstring(svg) for svg in re.findall(r'<svg\b.*?</svg>', card, re.S)]
        expected = {'1': 'Violet', '2': 'EMPTY', '3': 'Black', '4': 'Blue'}
        for svg in diagrams:
            # Read the rendered circle coordinates, not a view metadata label.
            labels = [(float(g.find('circle').get('cx')), g.get('data-position'))
                      for g in svg.findall('.//g[@data-position]')]
            # The angled plug shows one row at each end. Check its socket row.
            if svg.get('data-view') == '3d':
                labels = labels[4:]
            order = [pos for x, pos in sorted(labels)]
            self.assertEqual(order, list(expected) if svg.get('data-view') in ('3d', 'face') else list(reversed(expected)))
            for pin in svg.findall('.//g[@data-position]'):
                self.assertEqual(pin.get('data-color'), expected[pin.get('data-position')])

    def test_empty_cavity_has_no_wire_or_metal_socket(self):
        wires = [w for w in self.data['wires'] if w['bundle'] in ('B1', 'B2', 'B8')]
        card = assembly.connector_card('P1.PH-F', self.data, wires)
        svg = ET.fromstring(re.findall(r'<svg\b.*?</svg>', card, re.S)[0])
        empty = svg.findall('.//g[@data-position="2"]')
        self.assertEqual(len(empty), 2)
        self.assertFalse(empty[0].findall('path'))  # No wire tail.
        self.assertEqual(len(empty[1].findall('rect')), 1)  # Open cavity only.

    def test_motor_plug_and_header_show_functions_and_all_six_positions(self):
        h9 = next(h for h in self.data['harnesses'] if h['id'] == 'H9')
        card = assembly.harness_card(h9, self.data)
        self.assertEqual(assembly.connector_keys(h9, self.data)[0], 'MR.PIGTAIL')
        self.assertIn('Position 2, Black, Motor OUT2, To JLEG.JMR_IN.2', card)
        self.assertIn('Position 3, Green, Encoder GND, To JLEG.JMR_IN.3', card)
        self.assertIn('Unkeyed plug.', card)
        self.assertIn('Verify their physical order', card)
        self.assertIn('data-order="6 5 4 3 2 1"', card)

    def test_view_controls_have_unique_targets(self):
        ids = re.findall(r'\bid="([^"]+)"', self.cards)
        self.assertEqual(len(ids), len(set(ids)))
        for target in re.findall(r'aria-controls="([^"]+)"', self.cards):
            self.assertIn(target, ids)
        for h in self.data['harnesses']:
            if h['id'] in ('H4', 'H10'):
                card = assembly.harness_card(h, self.data)
                self.assertNotIn('class="connector-render"', card)
                self.assertIn('Part selection open', card)

    def test_unresolved_interface_is_not_presented_as_a_direct_fit(self):
        h1 = assembly.harness_card(self.data['harnesses'][0], self.data)
        self.assertIn('Do not fit a straight six-position header', h1)
        self.assertIn('Pico pin 21', self.parser.rows['H006'])
        for h in ('H4', 'H10', 'H11', 'H12'):
            self.assertIn(h, assembly.STATUS)
        self.assertNotIn('Desolder the pre-soldered pins', self.cards)

    def test_simple_harness_has_a_complete_cable_parts_list(self):
        h6 = next(h for h in self.data['harnesses'] if h['id'] == 'H6')
        wires = [w for w in self.data['wires'] if w['bundle'] == 'B12']
        parts = assembly.parts_list(h6, self.data, wires)
        self.assertIn('2 × XHP-2 housing', parts)
        self.assertIn('4 × SXH-001T-P0.6', parts)
        self.assertIn('22 AWG stranded wire: Black, Red', parts)
        self.assertIn('100 mm', self.parser.rows['H037'])

    def test_generated_page_is_current(self):
        page = (Path(__file__).parent / 'v1-proof-harness.html').read_text()
        for h in self.data['harnesses']:
            self.assertIn(assembly.harness_card(h, self.data), page)
        self.assertIn(assembly.INTRO, page)


if __name__ == '__main__':
    unittest.main()

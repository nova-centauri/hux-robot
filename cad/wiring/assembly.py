"""Readable assembly views of the harness model. No circuit is defined here.

Colors below are a proposed insulation schedule, except for the supplied
Pololu cables. Connector positions remain logical until the hardware is checked.
"""
from collections import Counter
from html import escape as esc
from connector_views import viewer


COLORS = {
    'Black': '#29333b', 'Red': '#c74339', 'Blue': '#246db6',
    'Green': '#378363', 'Yellow': '#d2a700', 'White': '#ffffff',
    'Orange': '#db782e', 'Violet': '#8662b2', 'Gray': '#7d8791',
}
NET_COLORS = {
    'GND': 'Black', 'AGND': 'Black', 'PACK': 'Red', 'PACK_FUSED': 'Red',
    'BUS': 'Red', 'RAIL': 'Red', 'VSYS': 'Blue', '5V': 'Blue', '3V3': 'Violet',
    'SPI_SDO': 'Green', 'SPI_CS': 'Gray', 'SPI_SCL': 'Yellow',
    'SPI_SDI': 'Orange', 'IMU_INT1': 'White', 'nSLEEP': 'Violet',
    'HB': 'Green', 'RAIL_ADC': 'Orange',
    'KILL_A': 'Violet', 'KILL_B': 'Orange', 'ARM_A': 'Violet', 'ARM_B': 'Green',
    **{f'{s}_{n}': c for s in ('L', 'R') for n, c in {
        'MOTOR_OUT1': 'Red', 'MOTOR_OUT2': 'Black', 'EN': 'Blue', 'PH': 'Green',
        'FAULT': 'Gray', 'CS': 'Orange', 'ENC_A': 'Yellow', 'ENC_B': 'White',
        'ENC_A5': 'Yellow', 'ENC_B5': 'White',
    }.items()},
}
BOARD_NAMES = {
    'P1': 'Pico 2', 'U1': 'LSM6DSO IMU', 'DB': 'Driver board',
    'JLEG': 'Leg junction board', 'KC': 'Kill-chain board',
    'PDB': 'Power distribution board', 'ML': 'Left gearmotor',
    'MR': 'Right gearmotor', 'BAT': 'Battery lead', 'F1': 'Inline fuse',
    'SWK': 'KILL button', 'SWA': 'ARM button',
}
STATUS = {
    'H1': ('Layout unresolved', 'PH-C crosses the two Pico rows. Do not fit a straight six-position header across pins 16–21. Resolve the Pico interface first.'),
    'H2': ('Check header fit', 'Confirm the Pico header layout before assembly. XH has 2.50 mm pitch. The Pico has 2.54 mm pitch.'),
    'H3': ('Check board layout', 'This cable carries the fused battery voltage into the regulator. It does not carry regulated 5 V.'),
    'H4': ('Select mating parts', 'Confirm the XT30 contact sex at both board leads. The wire size and current rating still need a check.'),
    'H5': ('Check board layout', 'This cable supplies regulated 5 V to the encoder circuit. Confirm the regulator output before connection.'),
    'H6': ('Check board layout', 'Black is motor OUT2. Do not connect it to ground. The leg junction board still needs a physical layout.'),
    'H7': ('Check board layout', 'Black is motor OUT2. Do not connect it to ground. Label this cable RIGHT to distinguish it from H6.'),
    'H8': ('Supplied cable', 'Keep the supplied housing. Verify the actual color order and header orientation before connection. Black is motor OUT2. Green is encoder ground.'),
    'H9': ('Supplied cable', 'Keep the supplied housing. Verify the actual color order and header orientation before connection. Black is motor OUT2. Green is encoder ground.'),
    'H10': ('Parts unresolved', 'The pack connector, fuse rating, holder and XT30 contact sex remain open. Do not assemble this lead from the route estimate.'),
    'H11': ('Select button terminals', 'Confirm the button COM and NO terminals. The button-side XH mating part and its attachment remain unspecified.'),
    'H12': ('Select button terminals', 'Confirm the button COM and NO terminals. The button-side XH mating part and its attachment remain unspecified.'),
}


def wire_color(wire):
    if wire['bundle'] in ('B14', 'B15'):
        return ('Red', 'Black', 'Green', 'Blue', 'Yellow', 'White')[int(wire['source'].rsplit('.', 1)[1]) - 1]
    return NET_COLORS[wire['net']]


def wire_length(wire, runs):
    if 'SP1' in (wire['source'], wire['destination']):
        return 'Fit at SP1', 'Measure each splice leg'
    if wire['bundle'] == 'B16':
        return 'Measure first', 'Pack and fuse positions open'
    run = runs[wire['bundle']]
    label = 'Supplied length' if wire['awg'] == 'vendor' else ('Fixture allowance' if run['fixed'] else 'Route estimate')
    return f"{run['cut_mm']} mm", label


def swatch(color):
    return f'<span class="swatch" style="--wire:{COLORS[color]}" aria-hidden="true"></span>{color}'


def endpoint(key, data):
    if key == 'SP1':
        return '<strong>SP1 · 3V3 splice</strong><span>One insulated joint, three wires</span>'
    conn, pos = key.rsplit('.', 1)
    c = data['connectors'][conn]
    pin = c['load'][int(pos)][0]
    physical = ''
    if c['board'] == 'P1':
        first = int(c['pins'].split('-')[0][1:])
        physical = f' · Pico pin {first + int(pos) - 1}'
    return (f'<strong>{esc(conn)} <span class="position">{pos}</span></strong>'
            f'<span>{esc(BOARD_NAMES[c["board"]])}</span>'
            f'<small>{esc(pin + physical)}</small>')


def connector_card(key, data, wires, harness_id='guide'):
    c = data['connectors'][key]
    family, n = c['family'], c['positions']
    if family == 'XH':
        part = f'XHP-{n} · {n}-position housing'
        contact_count = sum(bool(net) for pin, net in c['load'].values())
        mate = (f'Board mate: B{n}B-XH-A header' if c['board'] not in ('SWK', 'SWA')
                else 'Button-side mate: unresolved')
        detail = f'{contact_count} × SXH-001T-P0.6 contacts'
    elif family == 'P6':
        part = '1×6 · 2.54 mm / 0.1 in'
        mate = 'Supplied female housing' if c['board'] in ('ML', 'MR') else 'Male header on the leg junction board'
        detail = 'Keep the vendor cable'
    elif family == 'XT30':
        part, mate, detail = 'XT30 · 2 contacts', 'Mating contact sex: unresolved', 'Use molded + and − marks'
    else:
        part, mate, detail = family, 'Exact part: unresolved', 'Confirm before assembly'
    pins, rows = [], []
    uid = harness_id + '-' + key.replace('.', '-')
    for pos, (pin, net) in sorted(c['load'].items()):
        wire = next((w for w in wires if f'{key}.{pos}' in (w['source'], w['destination'])), None)
        color = wire_color(wire) if wire else None
        if family == 'P6':
            pin = {1: 'Motor OUT1', 2: 'Motor OUT2', 3: 'Encoder GND',
                   4: 'Encoder 5 V', 5: 'Encoder A · 5 V', 6: 'Encoder B · 5 V'}[pos]
        other = next((end for end in (wire['source'], wire['destination']) if end != f'{key}.{pos}'), '') if wire else ''
        pins.append(dict(position=pos, name=pin, color=color, hex=COLORS.get(color, '#87928a')))
        route = f'To {other}' if other else 'No wire. No contact.'
        rows.append(f'<li><button type="button" disabled class="pin-assignment {"loaded" if wire else "empty"}" '
                    f'data-pin-button="{pos}" style="--wire:{COLORS.get(color, "#87928a")}" '
                    f'aria-label="Position {pos}, {color or "EMPTY"}, {esc(pin)}, {esc(route)}">'
                    f'<b class="pin-number">{pos}</b><span class="pin-info"><strong>{color or "EMPTY"}</strong>'
                    f'<span>{esc(pin)}</span><small>{esc(route)}</small></span>'
                    f'<span class="pin-wire-id">{wire["id"] if wire else "—"}</span></button></li>')
    visual = ''
    if family in ('XH', 'P6'):
        header = family == 'P6' and c['board'] == 'JLEG'
        visual = viewer(family, pins, uid, header, include_mate=c['board'] not in ('SWK', 'SWA'))
        role = 'Board header' if header else ('Supplied cable housing' if family == 'P6' else 'Cable housing')
        reference = ('Unkeyed plug. The colors identify functions. Verify their physical order on the supplied cable.' if family == 'P6'
                     else 'Illustrated XH shape. The numbers show the proposed Hux positions. Verify position 1 against the actual header.')
    else:
        role = 'Connection schedule'
        reference = 'The exact mating parts are unresolved. Use the terminal labels. This schedule does not define a physical face view.'
        visual = '<div class="unresolved-plug"><span aria-hidden="true">+ / −</span><strong>Part selection open</strong><p>A physical plug view needs the exact mating parts.</p></div>'
    return f'''<section class="plug-card" id="{uid}" data-connector="{esc(key)}" aria-label="{esc(key)} connector">
<div class="plug-heading"><div><p class="eyebrow">{role} · {esc(BOARD_NAMES[c['board']])}</p><h4>{esc(key)}</h4></div><strong>{esc(part)}</strong></div>
<div class="plug-inspector">{visual}<div class="pin-schedule"><p class="pin-schedule-label">Position → wire → other end</p>
<p class="pin-instruction" hidden>Select a wire to highlight its position.</p><ol class="pin-assignments">{''.join(rows)}</ol>
<button type="button" class="show-all-pins" hidden>Show all positions</button></div></div>
<p class="orientation-note"><strong>Orientation check.</strong> {reference}</p>
<p class="part-note">{esc(detail)}<br>{esc(mate)}</p></section>'''


def connector_keys(h, data):
    # Start the motor-cable guide with the supplied plug, then show its board mate.
    return sorted(h['connectors'], key=lambda key: data['connectors'][key]['board'] not in ('ML', 'MR'))


def connector_picker(h, data):
    buttons = []
    for key in connector_keys(h, data):
        uid = h['id'] + '-' + key.replace('.', '-')
        buttons.append(f'<button type="button" data-connector-button="{esc(key)}" aria-controls="{uid}">'
                       f'<strong>{esc(key)}</strong><span>{esc(BOARD_NAMES[data["connectors"][key]["board"]])}</span></button>')
    return '<div class="connector-picker" aria-label="Connector to inspect" hidden>' + ''.join(buttons) + '</div>'


def parts_list(h, data, wires):
    housings = Counter()
    contacts = 0
    for key in h['connectors']:
        c = data['connectors'][key]
        if c['family'] == 'XH':
            housings[f'XHP-{c["positions"]} housing'] += 1
            contacts += sum(bool(net) for pin, net in c['load'].values())
    parts = [f'{count} × {name}' for name, count in sorted(housings.items())]
    if contacts:
        parts.append(f'{contacts} × SXH-001T-P0.6 female contacts, plus practice spares')
    if h['id'] in ('H8', 'H9'):
        parts += ['1 × supplied six-wire motor cable, 200 mm', '1 × mating 1×6 male header, 2.54 mm pitch']
    if h['id'] in ('H4', 'H10'):
        parts += ['XT30 mating parts: confirm contact sex and board leads first', 'Heat-shrink tubing for each solder joint']
    if h['id'] == 'H10':
        parts += ['Inline fuse holder and fuse: selection open', 'Pack-side mating connector: selection open']
    if h['id'] == 'H1':
        parts += ['Heat-shrink tubing for SP1', 'Pico interface: resolve PH-C before assembly']
    if h['id'] in ('H11', 'H12'):
        parts += ['Button terminals and button-side XH mate: selection open']
    if h['id'] not in ('H8', 'H9'):
        groups = sorted({(str(w['awg']), wire_color(w)) for w in wires})
        parts += [f'{awg} AWG stranded wire: ' + ', '.join(c for a, c in groups if a == awg)
                  for awg in sorted({a for a, c in groups})]
    return '<ul class="parts-list">' + ''.join(f'<li>{esc(p)}</li>' for p in parts) + '</ul>'


def harness_card(h, data):
    wires = [w for w in data['wires'] if w['bundle'] in {b['bundle'] for b in h['branches']}]
    runs = {r['id']: r for r in data['bundles']}
    status, caution = STATUS[h['id']]
    branches = []
    for branch in h['branches']:
        rows = []
        for w in wires:
            if w['bundle'] != branch['bundle']:
                continue
            color = wire_color(w)
            length, length_note = wire_length(w, runs)
            gauge = 'Vendor wire' if w['awg'] == 'vendor' else f"{w['awg']} AWG"
            rows.append(f'''<tr data-wire="{w['id']}"><td class="wire-end">{endpoint(w['source'], data)}</td>
<td class="wire-middle"><strong class="wire-color">{swatch(color)}</strong>
<span class="wire-line" style="--wire:{COLORS[color]}" aria-hidden="true"></span>
<span>{gauge} · <b>{length}</b></span><small>{length_note}</small>
<code>{w['id']} · {esc(w['net'])}</code></td><td class="wire-end">{endpoint(w['destination'], data)}</td></tr>''')
        branches.append(f'''<section class="wire-branch"><h4><span>{branch['bundle']}</span> {esc(branch['name'])}</h4>
<table class="wire-map"><caption class="sr-only">{esc(branch['name'])}: wire colors and endpoints</caption>
<thead><tr><th scope="col">End A · connector / position</th><th scope="col">Wire · size · length</th><th scope="col">End B · connector / position</th></tr></thead>
<tbody>{''.join(rows)}</tbody></table></section>''')
    notes = ''
    if h['id'] == 'H1':
        notes = '''<aside class="splice-note"><h4>SP1 · one joint with three violet wires</h4>
<p>P1.PH-F.1 → SP1 → U1.JMAIN.2 and DB.J3V3.1.</p>
<p>Place SP1 about 30 mm from the Pico housing. Measure each leg before the cut. Insulate the complete joint.</p>
<p>The 95 mm sensor route and 335 mm driver route are allowances. They are not three separate splice cuts.</p>
<p>Use one wire in each XH contact. Make the branch at SP1, outside the housing.</p></aside>'''
    elif h['id'] in ('H8', 'H9'):
        notes = '''<p class="build-note">Positions below are the design schedule. Verify them against the supplied cable before you mark the unkeyed header.</p>'''
    elif h['id'] == 'H10':
        notes = '''<p class="build-note">The positive lead goes through the fuse. The negative lead bypasses it. The 200 mm route estimate does not specify each fuse segment.</p>'''
    checks = ['Disconnect this harness from the boards and all power sources.',
              'Check continuity between each pair of endpoints in the wire map.',
              'Check for shorts between different nets.' + (' SP1 intentionally joins its three 3V3 wires.' if h['id'] == 'H1' else ''),
              'Check that each contact stays in its housing with a light pull.',
              'Label each connector with its full ID. Record the final wire lengths.']
    if h['id'] in ('H8', 'H9'):
        checks = ['Disconnect the motor from the driver and all power sources.',
                  'Compare each wire color with the vendor function table.',
                  'Verify the housing orientation against the marked junction header.',
                  'Route the supplied cable without tension. Keep it clear of moving parts.']
    return f'''<article class="harness-card" id="{h['id']}" tabindex="-1" aria-labelledby="title-{h['id']}">
<div class="card-heading"><div><p class="eyebrow">Harness {h['id']} / {h['wires']} wires</p>
<h2 id="title-{h['id']}">{esc(h['name'])}</h2></div><span class="state-tag">{status}</span></div>
<p class="card-description">{esc(h['note'])}</p><p class="build-note"><strong>Before assembly.</strong> {caution}</p>
<h3><span class="step">1</span> Gather the parts</h3>{parts_list(h, data, wires)}
<p class="small-note">Board headers are separate parts. Match each housing to the header below. Confirm the board footprint before solder work.</p>
<h3><span class="step">2</span> Identify each connector</h3>
<p class="small-note">Choose a connector. Compare its plug, socket face and wire-entry views. EMPTY means no wire and no contact.</p>
{connector_picker(h, data)}
<div class="plug-grid">{''.join(connector_card(c, data, wires, h['id']) for c in connector_keys(h, data))}</div>
<h3><span class="step">3</span> {'Check the supplied wires' if h['id'] in ('H8', 'H9') else 'Make each wire'}</h3>
<p class="small-note">Follow the position number at each end. Equal positions do not always connect. Lengths are estimates unless marked as supplied.</p>
{notes}{''.join(branches)}
<h3><span class="step">4</span> Check before connection</h3>
<ol class="check-list">{''.join(f'<li>{esc(x)}</li>' for x in checks)}</ol>
<p class="small-note">This check covers the cable only. Complete the <a href="../../docs/electronics-bench-guide.md">electronics bench stages</a> before power or motion.</p>
<a class="back-to-picker" href="#choose-harness">Choose another harness ↑</a></article>'''


INTRO = '''<div class="guide-heading"><p class="eyebrow">HUX / V1-PROOF / HARNESS WORKBENCH</p>
<h1>Make one harness<br>at a time.</h1><p class="guide-lede">Choose a cable. Gather its plugs. Follow each colored wire from one numbered position to the other.</p>
<div class="guide-meta"><span>12 harnesses</span><span>Rev C circuit / assembly guide</span><span>17 October 2026</span></div></div>
<aside class="guide-status"><strong>Proposed assembly · physical checks open</strong>
<p>Wire colors are proposed for new cables. Motor cable colors come from Pololu. Lengths are estimates. Connector orientation needs a hardware check.</p>
<p>H1 needs a corrected Pico interface. Power and button leads need the exact mating parts. Each card identifies its open work.</p></aside>
<nav class="guide-links" aria-label="Guide sections"><a href="#choose-harness">Choose a harness ↓</a><a href="#connector-basics">Know the connectors</a><a href="#bench-method">Assembly method</a><a href="#engineering-register">Engineering register</a><a href="../../tools/living-drawings/electrical.html">System drawings ↗</a></nav>
<details class="basics" id="connector-basics"><summary>First build? Know the three connector parts <span>Housing · contact · header</span></summary>
<div class="basics-content"><div class="connector-basics-grid">
<section><svg viewBox="0 0 240 120" role="img" aria-label="Illustration of a white two-position cable housing with two contact cavities"><path d="M58 34h124v65H58z" fill="#f2eee4" stroke="#52656b" stroke-width="2"/><path d="M84 34v-9h72v9" fill="none" stroke="#52656b" stroke-width="2"/><path d="M78 55h28v24H78zm56 0h28v24h-28z" fill="#32454e"/><path d="M58 34l15-12h124v65l-15 12M182 34l15-12" fill="none" stroke="#52656b" stroke-width="2"/></svg>
<h3>1. Housing · cable end</h3><p>The plastic shell holds the contacts. XHP-2 has two positions. XHP-6 has six.</p><code>XHP-2 … XHP-6</code></section>
<section><svg viewBox="0 0 240 120" role="img" aria-label="Illustration of a metal female crimp contact between a wire and a housing"><path d="M22 65h72" stroke="#246db6" stroke-width="12"/><path d="M94 65h24" stroke="#b98b45" stroke-width="5"/><path d="M116 52h86v26h-86z" fill="#ddd7bd" stroke="#737767" stroke-width="2"/><path d="M122 52l-7-16m20 16l7-16m14 16l-6-13m18 13l6-13M180 52v26" stroke="#737767" stroke-width="3"/></svg>
<h3>2. Contact · metal socket</h3><p>Crimp one contact onto each wire end. Insert it into the housing until it locks.</p><code>SXH-001T-P0.6</code></section>
<section><svg viewBox="0 0 240 120" role="img" aria-label="Illustration of a two-pin shrouded board header soldered to a green board"><path d="M30 86h180v15H30z" fill="#387c66"/><path d="M62 31h116v55H62z" fill="#eee9db" stroke="#52656b" stroke-width="2"/><path d="M72 41h96v34H72z" fill="#bdb8aa"/><path d="M96 49v22m46-22v22" stroke="#d6b568" stroke-width="6"/><path d="M96 86v26m46-26v26" stroke="#6c7471" stroke-width="4"/></svg>
<h3>3. Header · board end</h3><p>The fixed pins mate with the cable housing. The header needs the correct board footprint.</p><code>B2B-XH-A … B6B-XH-A</code></section></div>
<p>Use JST XH 2.50 mm parts for the XH cables. SXH-001T-P0.6 accepts 22–28 AWG with 0.9–1.9 mm insulation diameter.</p>
<p><a href="https://www.jst-mfg.com/product/pdf/eng/eXH.pdf">JST XH dimensions and contact specification ↗</a></p>
<div class="other-connectors"><p><strong>XT30:</strong> power connector with solder terminals. Confirm contact sex and the molded polarity marks. The design has no released mating-part schedule.</p>
<p><strong>Motor plug:</strong> supplied six-position female housing, 2.54 mm pitch. It mates with a male header. Keep its original wires and housing.</p></div>
<h3>Check the view before you insert a contact</h3>
<p>The mating face is the side that accepts the board pins. Wires enter from the opposite side.</p>
<p>The position order reverses when you turn the housing around. Identify position 1 on the real parts before assembly.</p>
<div class="view-example"><div><b>Example · mating face</b><span class="example-pins"><i>1</i><i>2</i><i>3</i><i>4</i></span></div><span aria-hidden="true">↔</span><div><b>Same housing · wire entry</b><span class="example-pins"><i>4</i><i>3</i><i>2</i><i>1</i></span></div></div>
<p class="small-note">This example explains the mirror effect. It does not set the latch orientation or physical pin order of a Hux connector.</p>
<p>Match the manufacturer drawing to the actual part. Mark position 1 on the housing and board. Check the marked pair with a meter.</p>
</div></details>
<details class="basics" id="bench-method"><summary>Assembly method <span>Prepare · crimp · insert · check</span></summary><div class="basics-content">
<p><strong>Tools:</strong> wire cutter, wire stripper, contact-compatible crimp tool, multimeter, labels, heat-shrink tubing and a ruler.</p>
<ol class="check-list"><li>Disconnect the battery, USB cable and bench supply. Disconnect the cable from the boards.</li>
<li>Confirm the connector parts, position 1 and each open item on the selected card.</li>
<li>Route a loose wire on the frame. Allow room at each connector for strain relief.</li>
<li>Record the required length. Cut the wire after this check.</li>
<li>Strip the wire to the contact specification. Do not cut the copper strands.</li>
<li>Crimp a practice contact with the correct die. Check the conductor grip and insulation support.</li>
<li>Crimp one contact onto each specified wire end. Inspect each crimp.</li>
<li>Insert each contact from the wire-entry side into its assigned position. Check retention with a light pull.</li>
<li>Leave each EMPTY position without a contact. Label both ends with their full connector IDs.</li>
<li>Complete the continuity and short checks on the selected card.</li></ol>
<p>Pre-crimped XH leads are an alternative. Verify their contact, wire size, insulation and length before use.</p>
<p>The number in AWG identifies wire size. Smaller AWG numbers mean thicker wire. Check both conductor size and insulation diameter.</p>
<p>H6 is an assembly ID. H037 is a wire ID. B12 is a bundle ID. EL-01 uses separate W-series drawing IDs.</p>
<p>Full endpoint labels remove ambiguity: DB.JML.1 means driver board, connector JML, position 1.</p>
</div></details>'''


def render(data, legacy_html):
    # Keep the detailed register available, without placing it before the build cards.
    register = legacy_html.split('<h2>Twelve harnesses</h2>', 1)[1].split('</main>', 1)[0]
    register = '<h2>Engineering register</h2><h3>Harness overview</h3>' + register
    search_script = legacy_html.split('<script>', 1)[1].split('</script>', 1)[0]
    nav = []
    for h in data['harnesses']:
        related = [w for w in data['wires'] if w['bundle'] in {b['bundle'] for b in h['branches']}]
        search = ' '.join([h['id'], h['name'], *h['connectors'],
                           *(w['net'] + ' ' + wire_color(w) + ' ' + w['id'] for w in related),
                           *(BOARD_NAMES[data['connectors'][c]['board']] for c in h['connectors'])])
        nav.append(f'<a href="#{h["id"]}" data-harness="{h["id"]}" data-search="{esc(search, quote=True)}">'
                   f'<span class="harness-number">{h["id"]}</span><span><strong>{esc(h["name"])}</strong>'
                   f'<small>{h["wires"]} wires · {STATUS[h["id"]][0]}</small></span><span aria-hidden="true">↗</span></a>')
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Harness assembly guide · Hux V1-PROOF</title>
<meta name="description" content="Choose a Hux harness and see its connector parts, proposed wire colors, numbered endpoints, length estimates and assembly checks.">
<link rel="stylesheet" href="../../tools/living-drawings/workshop.css"><link rel="stylesheet" href="harness-guide.css">
<script src="harness-guide.js" defer></script></head><body>
<a class="skip-link" href="#guide-main">Skip to harness guide</a><main class="harness-guide" id="guide-main">
{INTRO}<section class="harness-workbench" id="choose-harness" aria-label="Harness selector and instructions">
<aside class="harness-picker"><p class="eyebrow">Choose your harness</p><h2>Twelve cables.<br> One clear task.</h2>
<label for="harness-filter">Find a harness or connector</label><input id="harness-filter" type="search" placeholder="Try H6, Pico, JLEG, yellow…">
<p id="harness-count" class="small-note" aria-live="polite">12 harnesses</p>
<nav aria-label="Harnesses">{''.join(nav)}</nav><p id="no-harnesses" hidden>No matching harness. Clear the search to see all twelve.</p>
<p class="small-note">Start with H6 for a simple two-wire example. Robot LEFT is the near wall.</p></aside>
<div class="harness-instructions"><div class="guide-actions"><p id="selected-harness" aria-live="polite">All assembly cards</p><button type="button" id="print-harness" hidden>Print this harness</button></div>
{''.join(harness_card(h, data) for h in data['harnesses'])}</div></section>
<details class="basics" id="engineering-register"><summary>Full engineering register <span>Bundles · connectors · hardware counts</span></summary>
<div class="basics-content register-content"><p>These tables preserve the Rev C model. Hardware counts include the optional PH-G header and housing.</p>
<p>The new cards show the parts for each harness. Read their open items before use.</p>{register}</div></details>
<p class="guide-source">Source: <a href="v1-proof-harness.json">shared harness model</a> · <a href="../../docs/wiring-atlas.md">design audit and open items</a> · <a href="v1-proof-wire-register.html">EL-01 wire register</a></p>
</main><script>{search_script}</script></body></html>'''

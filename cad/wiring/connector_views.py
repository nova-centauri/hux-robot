"""Illustrative connector geometry, with positions from the harness model.

The shapes explain the connector family. They are not manufacturing drawings.
The numbered positions are the proposed Hux schedule, not a hardware release.
"""
from html import escape as esc


def text(x, y, value, size=14, fill='#20343e', anchor='middle', **attrs):
    extra = ' '.join(f'{k.replace("_", "-")}="{v}"' for k, v in attrs.items())
    return (f'<text x="{x:g}" y="{y:g}" font-size="{size}" fill="{fill}" '
            f'text-anchor="{anchor}" {extra}>{esc(str(value))}</text>')


def rect(x, y, w, h, fill, stroke='#7f8b86', radius=0):
    return (f'<rect x="{x:g}" y="{y:g}" width="{w:g}" height="{h:g}" '
            f'rx="{radius}" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>')


def poly(points, fill, stroke='#7f8b86'):
    coords = ' '.join(f'{x:g},{y:g}' for x, y in points)
    return f'<polygon points="{coords}" fill="{fill}" stroke="{stroke}" stroke-width="1.5" stroke-linejoin="round"/>'


def line(x1, y1, x2, y2, color, width=1.5):
    return f'<path d="M{x1:g} {y1:g}L{x2:g} {y2:g}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round"/>'


def position_label(x, y, pin, color):
    return (f'<circle class="pin-halo" cx="{x:g}" cy="{y:g}" r="21" fill="none"/>'
            f'<circle cx="{x:g}" cy="{y:g}" r="18" fill="#9aa79b"/>'
            f'<circle cx="{x:g}" cy="{y:g}" r="16" fill="#fffdf7" stroke="{color}" stroke-width="2"/>'
            + text(x, y + 5, pin['position'], 19, font_weight='700'))


def pin_group(pin, content):
    return (f'<g class="render-pin" data-position="{pin["position"]}" '
            f'data-color="{pin["color"] or "EMPTY"}"><title>'
            f'Position {pin["position"]}: {esc(pin["name"])} · {pin["color"] or "EMPTY"}'
            f'</title>{content}</g>')


def diagram(family, pins, mode, uid, header=False):
    """Render a cable or header. Opposite viewing directions mirror the order."""
    dark = family == 'P6'
    board = header or mode == 'mate'
    rear = mode == 'rear'
    angled = mode in ('3d', 'mate')
    ordered = list(reversed(pins)) if rear or board else pins
    n = len(pins)
    pitch = 48
    width = (n - 1) * pitch + 72
    left = (600 - width) / 2 - (18 if angled else 0)
    front, top, side = ('#303c42', '#546169', '#17252c') if dark else ('#eeece3', '#fffdf5', '#cbcbbf')
    ink = '#fafaf0' if dark else '#54635b'
    contents = []
    if angled:
        # The x-axis follows the cavities. Depth goes away from the viewer.
        def p(x, depth, z):
            return (left + x + depth * .35, 282 - depth * .7 - z)

        depth, height = (52, 24) if board and dark else (94, 76)
        if board:
            contents.append(poly([p(-24, -15, -8), p(width + 24, -15, -8),
                                  p(width + 24, depth + 20, -8), p(-24, depth + 20, -8)], '#507c66'))
        else:
            # Wire tails leave the rear. Draw them before the opaque housing.
            for i, pin in enumerate(ordered):
                x = 36 + pitch * i
                sx, sy = p(x, depth, 36)
                ex, ey = p(x, depth + 110, 36)
                color = pin['hex']
                if pin['color']:
                    wire = line(sx, sy, ex, ey, '#697a73', 12) + line(sx, sy, ex, ey, color, 9)
                    wire += line(sx - 2, sy, ex - 2, ey, '#ffffff55', 2)
                else:
                    wire = ''
                wire += position_label(ex, ey - 22, pin, color)
                contents.append(pin_group(pin, wire))
        contents += [poly([p(0, 0, height), p(width, 0, height), p(width, depth, height), p(0, depth, height)], top),
                     poly([p(width, 0, 0), p(width, depth, 0), p(width, depth, height), p(width, 0, height)], side),
                     poly([p(0, 0, 0), p(width, 0, 0), p(width, 0, height), p(0, 0, height)], front)]
        if not dark:
            # Friction-lock feature. Simplified, not a tooling or fit model.
            a, b = width * .25, width * .75
            contents += [poly([p(a, 8, height), p(b, 8, height), p(b, 20, height + 9), p(a, 20, height + 9)], side),
                         poly([p(a, 20, height + 9), p(b, 20, height + 9), p(b, 60, height + 9), p(a, 60, height + 9)], top)]
        if board and not dark:
            contents.append(poly([p(14, 12, height - 4), p(width - 14, 12, height - 4),
                                  p(width - 14, depth - 12, height - 4), p(14, depth - 12, height - 4)], '#8e978d'))
        for i, pin in enumerate(ordered):
            x = 36 + pitch * i
            if board:
                base = p(x, depth / 2, height - 12)
                tip = p(x, depth / 2, height + 42)
                metal = '#d5bd7c' if dark else '#d8dfdb'
                item = line(*base, *tip, '#6a746e', 9) + line(*base, *tip, metal, 6)
                item += position_label(tip[0], tip[1] - 26, pin, pin['hex'])
            else:
                cx, cy = p(x, 0, 38)
                item = rect(cx - 14, cy - 16, 28, 32, '#25383c', '#7e8b84', 2)
                if pin['color']:
                    item += rect(cx - 9, cy - 10, 18, 20, '#adb6b1', '#d8ded6', 1)
                    item += rect(cx - 5, cy - 7, 10, 14, '#273a40', '#73837e')
                item += position_label(cx, 313, pin, pin['hex'])
            contents.append(pin_group(pin, item))
        if n < 4:
            contents = ['<g transform="translate(300 200) scale(1.25) translate(-300 -200)">' + ''.join(contents) + '</g>']
        contents.append(text(300, 370, 'BOARD PINS · cable removed' if board else 'SOCKETS FACE YOU · wires leave the rear', 13))
    else:
        scale = {2: 1.6, 3: 1.35, 4: 1.15}.get(n, 1)
        width, pitch = width * scale, pitch * scale
        left = (600 - width) / 2
        y, h = 140 - (scale - 1) * 40, 106 * scale
        if board:
            contents.append(rect(left - 22, y - 18, width + 44, h + 36, '#507c66', '#38664e', 4))
        contents.append(rect(left, y, width, h, front, '#84928a', 5))
        if not dark:
            contents.append(rect(left + width * .25, y - 13, width * .5, 18, top, '#84928a', 2))
        contents.append(text(300, 85, 'REFERENCE EDGE UP' if dark else 'FRICTION-LOCK RIDGE UP', 15))
        for i, pin in enumerate(ordered):
            cx, cy = left + 36 * scale + pitch * i, y + h / 2
            item = rect(cx - 16 * scale, cy - 20 * scale, 32 * scale, 40 * scale, '#24363b', '#84938a', 2)
            if board:
                item += rect(cx - 6 * scale, cy - 6 * scale, 12 * scale, 12 * scale, '#d6c48a' if dark else '#d8dfdb', '#7b8375')
            elif rear and pin['color']:
                item += f'<circle cx="{cx:g}" cy="{cy:g}" r="{12 * scale:g}" fill="{pin["hex"]}" stroke="#98a49a" stroke-width="2"/>'
                item += f'<circle cx="{cx:g}" cy="{cy:g}" r="4" fill="#cfa56b"/>'
            elif pin['color']:
                item += rect(cx - 10 * scale, cy - 13 * scale, 20 * scale, 26 * scale, '#adb6b1', '#d8ded6', 1)
                item += rect(cx - 6 * scale, cy - 9 * scale, 12 * scale, 18 * scale, '#273a40', '#73837e')
            item += position_label(cx, y + h + 31, pin, pin['hex'])
            if not pin['color']:
                item += text(cx, y + h + 65, 'EMPTY', 12)
            contents.append(pin_group(pin, item))
        caption = 'LOOK INTO THE WIRE ENTRIES · order is reversed' if rear else ('LOOK AT THE BOARD PINS · opposite the socket face' if board else 'LOOK INTO THE SOCKETS · wires point away from you')
        contents.append(text(300, 370, caption, 13))
    label = {'3d': 'Angled view', 'face': 'Mating face', 'rear': 'Wire entry', 'mate': 'Board header'}[mode]
    desc = f'{label}. ' + ', '.join(f'Position {p["position"]}: {p["color"] or "empty"}, {p["name"]}' for p in ordered)
    return (f'<svg class="connector-render" viewBox="0 0 600 380" role="img" aria-labelledby="{uid}-{mode}-title" '
            f'data-view="{mode}" data-order="{" ".join(str(p["position"]) for p in ordered)}" '
            f'font-family="ui-monospace, monospace"><title id="{uid}-{mode}-title">{esc(desc)}</title>'
            + ''.join(contents) + '</svg>')


def viewer(family, pins, uid, header=False, include_mate=True):
    modes = [('3d', '3D plug'), ('face', 'Socket face'), ('rear', 'Wire entry'), ('mate', 'Board mate')]
    if header:
        modes = [('3d', '3D header'), ('face', 'Pin face')]
    elif not include_mate:
        modes = [view for view in modes if view[0] != 'mate']
    captions = {
        '3d': 'Match the numbered wire to its socket below. The housing hides part of each wire.',
        'face': 'The metal sockets accept the board pins. The color rings identify the wires behind them.',
        'rear': 'Insert the crimped contacts from this side. Keep the reference edge up. The position order reverses.',
        'mate': 'This is the separate board header. Its pins face the cable sockets. Match the same position numbers.',
    }
    if header:
        captions['3d'] = 'These exposed pins accept the supplied motor plug. Mark the verified position 1 before connection.'
        captions['face'] = 'The pin face points toward the cable sockets. The position order is opposite the socket-face view.'
    controls = ''.join(f'<button type="button" data-view-button="{mode}" aria-controls="{uid}-{mode}">{label}</button>' for mode, label in modes)
    figures = ''.join(f'<figure class="connector-view" id="{uid}-{mode}" data-view-panel="{mode}">'
                      f'<h5>{label}</h5>{diagram(family, pins, mode, uid, header)}'
                      f'<figcaption>{captions[mode]}</figcaption></figure>' for mode, label in modes)
    return f'<div class="connector-viewer"><div class="view-controls" aria-label="Connector view" hidden>{controls}</div>{figures}</div>'

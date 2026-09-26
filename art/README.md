# Art

Exploratory visuals for Hux, made to look at before any accurate model work. These are concept renders and image-to-mesh studies. They are not measured geometry, they do not meet the 2D-layout gate, and they stay out of `cad/`.

Proportions, joint axes, and part envelopes still live in `docs/mechanical.md` and the living drawings. The same files are on the [media page](../tools/living-drawings/media.html).

## Concepts

| File | What it shows |
| --- | --- |
| `concepts/hux-standing.jpg` | Studio three-quarter. Style anchor: carbon-tube legs, aluminum knee linkages, black cubes at the hips, spokeless disc hubs, battery box, camera on top. |
| `concepts/hux-knee-actuators.jpg` | Same machine with black cubic actuators at the knees in place of the linkage plates. |
| `concepts/hux-straight-leg.jpg` | Earlier packaging sketch: one spar per leg, finned hip motors, no knee. |
| `concepts/hux-side.jpg` | Side view. The camera sits slightly off a true elevation, so both wheels still show. |
| `concepts/hux-workshop.jpg` | The standing robot in a shop, with stairs behind it. |
| `concepts/hux-stairs.jpg` | Climb, one wheel on a higher tread. |
| `concepts/wheel.jpg` | Wheel study. The motor sits beside the hub in this sketch. |
| `concepts/leg.jpg` | One leg: paired carbon tubes, linkage knee, cube at the hip, disc wheel. |
| `concepts/torso.jpg` | Hip beam, two side cubes, battery, camera. Legs removed. |

## Models

Rough textured meshes generated from the isolated shots. Each file is a single mesh, on the order of a million triangles, 45–74 MB. Fasteners melt together, edges go soft, and a little floor tone can bake into the texture. Any glTF viewer will open them.

| File | Source image |
| --- | --- |
| `models/hux.glb` | `hux-standing.jpg` |
| `models/leg.glb` | `leg.jpg` |
| `models/wheel.glb` | `wheel.jpg` |
| `models/torso.glb` | `torso.jpg` |

## Where the pictures drift from the mechanical notes

- Nothing here is to scale. The paper envelope is about 24 in tall and 14 in wide, with 6 in wheels.
- The battery is drawn high on the torso. The mass sketch wants it low and central.
- Several shots put the wheel motor beside the tire. The intent is a motor in the hub.
- Hip roll and hip swing are not drawn as two separate joints.
- Small print on the battery, tire sidewalls, and plates is gibberish. Ignore it.

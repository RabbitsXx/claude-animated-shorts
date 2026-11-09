# Pendulum Tower - shot and event map (story v1)

`STORY.json` passes `node studio2/story-audit.mjs` (incl. FUN GATE). Times are estimates (words x 0.26 s) and are replaced by `T('phrase')` anchors after the voiced take. Shape: `reference/REF-FORMULA.md`.

## Flavour (this topic's own look)
- World: a bright seaside hill town. Pete's skinny tower stands at the left of a wide building site (crane, scaffold, hoarding with the banner OPENING TOMORROW); Rex's sleek glass tower with a rooftop pool on the plot to its right; a playground with one swing between them; a fair-style street with lamps and bunting for opening day. Five locations: site (day/morning), top-floor interior (night, cutaway), night yard with the winch, queue street (morning), rooftop pool / glass elevator POV.
- Hero Pete: red cap (`hair-capped`), blue overalls, round expressive face. Rival Rex: dark smooth hair, plum waistcoat by day and a pale suit and red tie on opening day. The dummy is a yellow-black crash dummy. Crowd from `studio2/library/crowd.mjs`.
- Carrier: the golden ball and its rope (about 5 m ball, golden, rope bundle, four side dampers). It changes in every use: crane-hauled and bonking (1), hung short on the top floors (2-3, 5), let down three floors (6-7), moonlit and long (8), seen from the elevator (11), swinging against the tower (12-14).
- Light (Ref colour script): bright day 0-13.2 s, night 13.2-29 s (moon, string lights on Rex's tower, lamp pools, torch, mean luminance about 0.25-0.30), bright morning 29-63.5 s. Luminance swing between 5 s windows above 0.2; sky about half the frame in wide shots.
- Palette: saturated blue sky with puffy clouds, grass green, warm gold ball, plum and glass for Rex, hot red for Pete's cap.
- In-world text only: banner OPENING TOMORROW (flat on the hoarding), TOP FLOOR FOR SALE sign crossed out, hand sign I THINK, GRAND OPENING banner, the playground sign. Captions only at 0.69 of frame height, 1-3 words per pop.
- Sound: voice first, a low corporate-style bed with one style change at the night, a riser at the 13.2 s cut to night, a whip-pan whoosh at the cut to the pool wave and a ding on the last beat; wooden and metal contact sounds (bonk, plaster, winch ratchet, pool slosh); not 100 cues. Nothing is made or spent without the owner's OK.
- Motion: cuts inside a section, dissolves between sections (day -> night at beat 5, night -> morning at beat 9); 13 shots, about 4.9 s per shot; the camera travels in every shot.

## Shot list (camera = the Ref grammar: push, pull-back, orbit, POV)
| Beat | s | Camera | Picture and acting |
|---|---|---|---|
| 1 | 0-3.2 | low at the crane hook, tilt up with the ball | Pete hauls with a lever, anticipation -> pull -> follow-through; ball bonks the wall, pigeon faints |
| 2 | 3.2-6.4 | continuous pull-back and rise | tower tall and skinny, Pete tiny, banner flaps, Rex's crew and Rex's violin mime |
| 3 | 6.4-9.4 | slow push-in on Pete and wallet | empty wallet, a fly; ball shadow crosses the crossed-out sign |
| 4 | 9.4-13.2 | slow orbit round Rex's tower, then follow the dive | Rex on the diving board dives into his pool |
| 5 | 13.2-17 | dissolve to night; side-on push inside the top floor, then wide exterior lean | dummy flung, ball banging out of step |
| 6 | 17-21 | camera under the hole looking up, orbit | plaster rains, ball sinks floor by floor |
| 7 | 21-23.5 | same shot pushes in on his sign | I THINK sign flips upside down |
| 8 | 23.5-29 | low follow of Rex with a torch, then moonlit wide of the long ball | winch cranks, ratchet clicks, Rex tiptoes out |
| 9 | 29-32 | dissolve to morning; high crane shot down the queue | crowd at the pool tower, one sad balloon at Pete's |
| 10 | 32-36.4 | side track up the glass elevators | tie in the door, flag stands out |
| 11 | 36.4-40.6 | POV from inside the elevator, push to the ball | tower leans, coffee slides, dread |
| 12 | 40.6-46.4 | orbit the swing, whip-pan up to the tower | dad pushes in time, then against; swing freezes |
| 13 | 46.4-52 | parallel to the rope, pull back (ghost replay, blue glow) | short rope flings the dummy, long rope lands it |
| 14 | 52-56 | push on the coffee on the desk, then wide | no spill, Pete sips, crowd gasps |
| 15 | 56-60 | wide from the crowd, shake with the sway | pool sloshes, wave dumps on Rex |
| 16 | 60-63.5 | push in on Rex, Pete winks behind | soaked, seasick, noodle, duck |

## Reuse / new
- Reuse (do not rewrite; `studio2/library/INDEX.json`): runtime and actor rig, faces, hair-capped and character parts, crowd rig and cheer poses, sky clouds, foliage, realism texturize, cover depth of field, gates, mix, assemble.
- New Blender models (each its own `blender/<id>.py`): `tower-pete` and `golden-ball-rig` (carrier), `tower-rex`, `rooftop-pool`, `crane-winch`, `test-dummy`, `top-floor-set` (desk, cup, chair, cutaway floors), `town-dressing` (banners, signs, lamps, windsock, barriers, balloons), `playground-swing`, and the costumes `hero-pete`, `rival-rex` on the existing rig.
- Scaffold note: `scene2/` was copied from `double-weight-hourly` by the scaffold; `main.mjs` and `models/` there are old and are replaced when the scene is assembled (old files are archived, not deleted).

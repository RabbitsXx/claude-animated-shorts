# Authoring a scene (studio2 runtime)

A scene is a module `scene2/main.mjs` that exports `authored=true` and `async build(ctx,{T,words,duration})` returning `{update(t)}`. `update(t)` is a **pure function of absolute time**: the same `t` must always give the same picture, so seeking and re-rendering work. Never keep state between frames (no "if the previous frame..."). Return `{camera, blur?, flash?, reach, note, beforeRender}`.

## Runtime parts (`studio2/runtime/`)
- `engine2.js` - Three.js scene, sky, shadows, outlines, depth-of-field, sun rays. Camera fields: `position, target, fov, shadow, solar, aperture, maxblur, night, studio`. `night:1` = star dome with dim blue light. `studio:1` = deep-blue star-dome background with day lighting (used for explainer cutaways, see rule 5).
- `tracks.js` - `key(keys,t)`, `ramp(t,a,b,ease)`, `bell`, `noise`, eases (`out, in, io, back, in3`), `anchors(words)` which gives `T('phrase', n)`.
- `face.js` - `faceTrack([[t,'preset'],...],t)`; presets include `neutral, proud, tired, shock, think, smug, laugh, strain, determined, joy, scared, smirk, grin, deadpan`; continuous brows/lids/mouth, automatic blink.
- `actor.js` - `createActor(spec)`; `actor.pose({pos,yaw,crouch,lean,twist,headYaw,headPitch,face,hands,feet,...})` returns `{reach}` (metres a limb was clamped short; it must be about 0). Hand/foot targets can be a world `Vector3`/array, `{torso:[x,y,z]}`, `{root:[..]}`, `{head:[..]}`; `null` = free. `actor.hide()` hides the actor.
- `kit.js` - prop helpers (`rbox, cyl, sph, torus, cone, tube, sign, finish`). `fx.js` - deterministic particles (spark, dust, star, confetti) via `fx.burst({t0,...})` and `beforeRender`.
- `bootstrap.js` - captions overlay, flash/fade, 6-sample motion blur when the scene returns `blur` (shutter seconds).

## Rules
1. **Limbs are never stretched.** Arm 0.285/0.255 m, leg 0.37/0.37 m. If `reach` is above about 0.03, move the actor, the prop or the camera.
2. **Feet on a surface.** The machine deck top is y = 0.30; ground is y = 0. A character standing on the deck uses `pos` y = 0.30 and feet y = 0.30 and must be inside the deck footprint (x within 2.7, z within 1.55). Standing at y 0 inside the deck buries the legs; standing at y 0.30 outside it floats. Check every platform the same way (rival deck, stage).
3. **Nothing passes through anything.** Keep a body at least 0.25 m from solid props (stanchions, poles, gimbal rings, console) and keep heads clear of anything at head height. When in doubt, look at the frame from a second camera angle.
4. **One floor per shot.** Overlapping flat planes at similar height flicker (z-fighting). Give coplanar patches different heights and `polygonOffset` (see the dirt patches in `set.mjs`). Never put an explainer table or board on top of the field so that grass, table top and backdrop read as three floors.
5. **Explainers are cutaways.** For a fact (model, orbit, train) return `camera.studio = 1` and `keep: [propRoot]`; `main.mjs` then hides the whole field and shows only the named prop floating in the star dome. Use big in-world tags (`tags.*`, billboarded with `putTag` in `beats.mjs`) that never overlap the caption area (lower middle) or each other. One metaphor per fact, scaled so everything stays in frame.
6. **Every spoken action has setup, contact and consequence on screen**, with the camera on it. No offscreen consequences. No held poses: blink, sway and breath are added by the `track()` wrapper in `main.mjs`.
7. Shots change: wide, close, POV, orbit, cutaway, a night or lamp-lit shot, a crowd. Not one street.
8. A prop that must be touched is placed so the hand can reach it: the shoulder is about 0.42 m above the hip pivot and 0.16 m to the side; keep the hand target within about 0.5 m of it. A small Node search over stance parameters is cheap.

## Defect checklist for every contact sheet (each of these happened once)
- Feet below or above the surface; legs vanishing into a deck.
- A hand target clamped short (a `reach` line) so the hand is not touching the prop.
- A prop or head intersecting another solid (tracker ring through the torso, head through a pole).
- Flat patches flickering or overlapping; a second floor behind or under an explainer.
- Labels cut by the frame edge, hidden behind objects, or sitting on the captions.
- Figures with detached hands (mitts must sit at the arm ends).
- A moving object leaving the frame while the narration is about it.
- Camera inside a solid; an empty wide shot with no secondary motion.
- A rival or crowd member standing on nothing at the edge of a platform.

## Single-instant tests while authoring
`node studio2/render.mjs ... --times 12.4,12.8 --out studio2/.tmp/t --captions --quality 0.9` renders only those instants; `studio2/sheet.py` makes the sheet. `studio2/.tmp/` and `studio2/.runs/` are scratch (git-ignored); delete freely.

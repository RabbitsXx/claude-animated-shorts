---
name: blender-models
description: How every prop, set, vehicle, plant and character part of a film is sculpted in Blender and loaded as GLB (the recipe, the kit, the checks and every trap already paid for). Use whenever a model is built, changed or reviewed in this repository.
---

# Blender models (the only way models are made here)

Never build a model from three.js primitives. Blender 4.5 at `F:/Blender/blender.exe`.

## Recipe for one model
1. Write the real sizes first (`reference`, `realDetails`, `interaction` in MODELS.json).
2. `episodes/<id>/blender/<modelId>.py`: `import bl_kit as k`, `k.reset('<modelId>')`, create materials AFTER the reset (a reset clears them), build with scene-coordinate helpers, `k.export(...scene2/models/glb/<modelId>.glb)`.
3. Build headless: `node studio2/blender-build.mjs --episode episodes/<id> --model <modelId>` (seconds for props, minutes for a city). The live MCP (`execute_blender_code`) is for small models and looking; wrap exec in `contextlib.redirect_stdout` and keep `look` images small; a big script times out and hangs Blender.
4. The model module: `export const load=()=>preloadGLB([URL])`, `glbInstance(THREE,URL)`, find named nodes with `find(g,'Name')`, `kit.finish(g,'prop')`, return the same API the scene used. The scene `await`s every `load()` at the top of `build`.
5. Sheet (`models.mjs --sheet`, textured like the film), look at the small copy, then `--pass` with three written checks.

## bl_kit helpers (studio2/blender/bl_kit.py)
Scene coordinates (x right, y up, z toward the camera; Blender is x, -z, y): `sbox, scyl, ssphere, storus, stext (stands up, faces +z), sgroup`; lettering lying on a horizontal surface uses `k.text(...rot (0,0,0))` with `k.S(loc)`. `stube(a,b,r)` tube between two points, `sbar`, `curve_tube(pts,radii)` tapered tube, `shell(center,radii,keep,thickness,...)` ellipsoid piece (hair caps, hats), `array(o,n,offset)` offsets are BLENDER axes (vertical is z, scene z is -y), `displace_noise` real relief, `orient(o,X,Z)`, `merge()` joins same-name same-material meshes for city-size models. Parts that move are separate nodes (groups with the pivot at the joint: `Lid`, `WheelFront`, `Crank`, `Tread03`, `LiftDoorL`, `HourHand1`); the scene finds them by name.

## Traps
- Materials: create after `k.reset()`. Names matter: `realism.mjs` picks surface rules by material then mesh name; floors, banks and steps a shoe may rest on are named `ground ...`.
- GLTFLoader turns spaces in names into underscores: match `[ _]`.
- Effects (halos, point lights, glass transparency, tints) are added or set AFTER `kit.finish`; finish restyles everything under the group.
- Live displays (numbers that change) are a runtime canvas plane lying on a modelled frame; everything else is geometry with real lettering.
- Thin decoration (lettering, seams, grooves, brackets) is marked `noCollide` by name in glb.mjs; do not rename parts to dodge a gate, move or shrink the part.
- Merged meshes: keep animated parts parented (merge skips them); landscape meshes over 60 m count as the far band in the dressing meter.
- Detail gate counts meshes and names after export: merging lowers both; keep 30+ meshes and 10+ names or write a waiver.
- Surface layer: `texturize` re-projects Blender UVs in metres and skips the bump map on Blender meshes. A speckled wall means look at the textured sheet, not the untextured one.

## Characters
`studio2/blender/character-parts.py` -> `studio2/library/characters/*.glb`: hair-tuft, hair-slick, hair-fringe, hair-bob, hair-curly, hair-bun, hair-capped (under a cap), cap, sneaker. Hair = a solid cap with a rolled edge plus flat clumps no longer than 11.5 cm lying along the head, plain and natural, never spiky or spaghetti curls. The black line is a separate `Hair ink` back-face shell, drawn only outside the head's screen footprint (stencil in `actor.js`). Run `check-hair.py` after any change. Milo's hair is #7a4a2a (dark brown disappears into the ink).

## Sky and plants
Clouds: `studio2/blender/clouds.py`; trees, bush, tuft: `studio2/blender/foliage.py`; both feed shared libraries. Haze is fog, not sky colour.

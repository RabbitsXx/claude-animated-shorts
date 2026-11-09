---
paths:
  - "episodes/*/blender/**"
  - "episodes/*/scene2/models/**"
  - "episodes/*/MODELS.json"
  - "studio2/blender/**"
  - "studio2/library/**"
---
# Models and characters (loads only when you touch model files)

- Every prop, set, vehicle, plant and character part is a Blender script `episodes/<id>/blender/<modelId>.py` (shared parts: `studio2/blender/*.py`) using `studio2/blender/bl_kit.py`, exported to GLB and loaded with `studio2/library/glb.mjs` (`preloadGLB` in the model's `load()`, `glbInstance`, then `kit.finish(g,'prop')`). Never build a model from three.js primitives. Skill `blender-models` has the recipe and every trap.
- Build headless: `node studio2/blender-build.mjs --episode episodes/<id> --model <id>` (Blender path in the script header). GLB files are not in git: rebuild them from the `.py` scripts.
- A model passes only after its sheet (`models.mjs --sheet`, textured like the film, with the 1.8 m figure) was looked at: three written checks, real sizes (`reference`, `realDetails`, `interaction` in MODELS.json), detail gate (30+ meshes, 10+ names, or a written waiver).
- **Name the grips.** Anything a character holds needs a named node in the Blender script (`lever grip handle`, `crank handle grip`, `drill handle grip`, `mug handle`): the scene drives the hand to that node and the collision gate fails when the hand is more than 6 cm off.
- Characters: rig is `studio2/runtime/actor.js`; hair (six natural everyday styles plus `hair-capped`), cap and sneaker are Blender GLBs in `studio2/library/characters/`. Hair is plain and natural, never spiky; the black line is on the outer contour only. After any hair change run `blender -b --python studio2/blender/check-hair.py`.
- Traps already paid for (read `studio2/library/INDEX.json` = proven parts to import, not rewrite, and `docs/DEFECTS.json` first): materials are created after every `k.reset()`; effects (halos, lights) are added after `kit.finish`; GLTFLoader turns spaces in names into underscores (match `[ _]`); lettering on horizontal surfaces must lie flat; thin decoration is `noCollide` (glb.mjs does it by name); floors and banks are named `ground ...`; merged landscape meshes count as the far band; character parts are `noCollide`; arrays in `bl_kit` take Blender offsets; a speckled wall means the surface layer, check the textured sheet.

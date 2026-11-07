# Agent entry point

This project makes original English 55-70 second vertical (1080x1920, 30 fps) animated explainer shorts: real 3D head and torso, 2D face ink, 2D stick limbs, in a small 3D world. **Reply to the user in Thai.** Code, file names and commit messages stay English.

One film is finished and is the working proof of the method: `episodes/time-machine-success/` (take 5, 64.6 s). Any new film is made the same way. Read in this order, then start:

1. `docs/WORKFLOW.md` - the whole path from topic to delivered package, with every command.
2. `docs/AUTHORING.md` - how a scene is written (runtime API, rules, checklist of defects that already happened once).
3. `reference/study/ANALYSIS-TH.md` and `reference/TARGET.md` - the quality target and story skeleton.
4. The active `episodes/<id>/HANDOFF.md`.

## What is where
- `studio2/` - the whole toolchain: `runtime/` (engine, actors, faces, tracks, fx), `render.mjs`, `review.mjs`, `eleven.mjs`, `mix.mjs`, `assemble.mjs`, `new-episode.mjs`, `sheet.py`, `tests/`.
- `episodes/<id>/` - one film: `SCRIPT.md`, `film.json`, `topic.json`, `approvals.json`, `scene2/` (the scene code), `voice/`, `audio/`, `renders/`, `out/`, `HANDOFF.md`.
- `assets/sfx/` - shared sound effects used by `mix.mjs`.
- `reference/` - the user's reference clip analysis (the quality target).
- `archive/` - retired material (old gated pipeline, old episodes, old skills). **Do not read it for instructions.** It is only history; `archive/README.md` says how it was moved.

## Rules that do not bend
- Never publish, upload or post anything. Local files only.
- Paid generation (ElevenLabs voice/music/effects) needs explicit user authorization in chat. Everything is cached by content hash in `voice/cache` and `audio/cache`; never regenerate just to re-render. Never print or commit the API key (it lives in `F:\Create Cartoon\.env`).
- No third-party models, textures or images. No image generation. The cover is staged from our own scene and has no text.
- Never write an approval, review or "I watched/listened" claim that did not happen. Say plainly what was measured (decode, loudness, reach) versus what a person must judge. The user decides whether quality matches the reference.
- Do not delete user work. Move retired things into `archive/` and note it.
- Standing model policy (user, all projects): real work on the main model; easy/mechanical tasks (inventories, log checks, listings) go to Haiku subagents.

## Checks
```
node --test studio2/tests/tracks.test.mjs studio2/tests/face.test.mjs studio2/tests/scaffold.test.mjs
node studio2/review.mjs --episode episodes/<id>     # fast frames + reach errors + contact sheets
```
Machine needs: Node 24, FFmpeg/FFprobe, Python with Pillow, Edge or Chrome with a hardware GPU, Three.js 0.187 at `F:\Create Cartoon\bridge-test\node_modules\three` (or set `STAGE_THREE`).

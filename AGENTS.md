# Agent entry point

Original English 55-70 s vertical (1080x1920, 30 fps) animated explainer shorts in the look and story shape of the reference clip (the "Ref", `reference/REF-FORMULA.md`): a realistic game-like 3D world with flat thick-outline characters. **Reply to the user in Thai.** Code, file names and commit messages stay English. Second reset 2026-11-09; older guidance is in `archive/` and never read for instructions.

## Hard rules (the owner's)
- Never publish, upload or post anything. Local files only.
- No paid generation (ElevenLabs voice, effects, music) without the owner's explicit OK in chat for that spend. Run `node studio2/eleven.mjs dry` first, record quote and scope in `episodes/<id>/approvals.json`. Never print or commit the API key (`F:\Create Cartoon\.env`). Paid output is cached by content hash; never regenerate just to re-render.
- Only our own geometry: no third-party models, textures or images, no image generation (the Blender MCP's `search_assets`, `import_asset`, `generate_3d` stay off). The cover is staged from our own scene, no text.
- The owner approves frames and spending, never Claude. Never claim anyone watched or listened; say what was measured and what a person must judge.
- `collide.mjs` must pass before `assemble.mjs` (enforced); `flicker-check.mjs` and `motion-check.mjs` are in `finish.mjs`.
- Do not delete user work: move retired things into `archive/` and say so. Software installs from outside (npm, pip, uv tools, git clones) are for the owner to run.
- Optimising never lowers a gate or limit.

## Order of work (one film)
`node studio2/next-step.mjs --episode episodes/<id>` prints the first undone step. New film: `node studio2/new-episode.mjs <id> --channel <channel-id>`. Then: design doc (owner approves) -> story + FUN GATE -> models one by one in Blender (each passed on its sheet) -> scene -> `collide`, `scene-quality`, `camera-plan` -> `preflight` (PASS before a full render; `--fast` only to iterate) -> `storyboard-frames` (owner quotes approval) -> sound (paid, needs OK) -> `render-parallel --workers 4` -> `finish` -> cover and `package`. Every command: `docs/WORKFLOW.md`.

## Division of work
Main model (Sonnet 5.5, orchestrator) owns judgement: design doc, story, Blender model scripts, scene, camera plan, reading every gate and sheet, talking to the owner. Models are independent files, so subagents may build several at once (self-contained brief, one file each, report under 150 words; the orchestrator builds, looks at the sheet and passes the model). Haiku subagents (standing authorization) do inventories, log and test summaries, mechanical edits, with a word limit; verify what matters. `vibe-reviewer` reads the finished scene before the owner does. Never two writers on one file; shared files (`MODELS.json`, `scene2/main.mjs`, `film.json`, docs) are written by the orchestrator only. Long tasks run in the background; do not poll.

## Rules that save the most time (details load by themselves from `.claude/rules/` when you touch story, model or scene files; the procedure is the `make-film` skill)
- Before long work: free disk 8 GB+ (`df -h /f`) and no stray background jobs.
- Every model is a Blender script (`blender-models` skill), never three.js primitives; a model passes only after its sheet was looked at.
- Design the camera against ALL gates before building the scene; measure failing frames with a script before fixing.
- After a fix re-run only what changed or failed, never what already passed: `probe.mjs` to look at 3-8 frames first, `collide.mjs --ranges`, `render-parallel.mjs --from --to`, `flicker-check.mjs --from --to` (a change that reaches other beats, the engine or a shared model still needs the full pass).
- Render and collide run split over 4 browsers (`render-parallel.mjs`, `collide.mjs --workers 4`); never a single-process full render.
- Read `studio2/library/INDEX.json` (proven parts) and `docs/DEFECTS.json` before writing scene code; log each root cause once.

## Working style
Look before you change; smallest complete change; verify with the real tool and report real results, failures included. Read ranges, one contact sheet instead of many frames (`python studio2/shrink.py <img>`). Keep `episodes/<id>/HANDOFF.md` current with measured numbers. One version of every rule: when the owner changes one, update it in the same turn.

## Where things are
`studio2/` toolchain - `episodes/<id>/` one film - `channels/<id>/channel.json` per-channel profile - `assets/sfx/` shared effects - `reference/` the Ref - `docs/` WORKFLOW, DEFECTS, specs - `.claude/rules/` scoped rules, `.claude/skills/` procedures - `archive/` retired material. Tests: `node --test studio2/tests/*.test.mjs` (all must pass). Machine: Node 24, FFmpeg, Python with Pillow/numpy/scipy, Edge or Chrome on the RTX 4060, Three.js 0.187 at `F:\Create Cartoon\bridge-test\node_modules\three`, Blender at `F:/Blender/blender.exe`.

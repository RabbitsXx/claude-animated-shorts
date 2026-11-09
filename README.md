# Original animated shorts

Original English 55-70 s vertical (1080x1920, 30 fps) animated explainer shorts: a realistic game-like 3D world (three.js, models sculpted in Blender) with flat thick-outline characters, in the story shape of a reference clip. A film is a pure function of time, rendered frame by frame in headless Chrome on the GPU, gated by automatic checks, voiced with ElevenLabs (paid, always with the owner's OK) and assembled with FFmpeg. Nothing is ever uploaded by the tools.

**Start here:** [AGENTS.md](AGENTS.md) (hard rules, order of work, the rules that save time) -> [docs/WORKFLOW.md](docs/WORKFLOW.md) (every command in order) -> the `make-film` skill (`.claude/skills/make-film/SKILL.md`). Scoped rules in `.claude/rules/` load by themselves when story, model or scene files are touched. The story shape we copy is in [reference/REF-FORMULA.md](reference/REF-FORMULA.md); every defect met so far and the check that catches it is in [docs/DEFECTS.json](docs/DEFECTS.json).

## Needs
Node 24, FFmpeg, Python 3 (Pillow, numpy, scipy, opencv), Blender 4.5, Edge or Chrome with a GPU, Three.js 0.187 (path in `AGENTS.md`), an ElevenLabs key in a `.env` that is never committed.

## The loop that keeps a film fast
`node studio2/next-step.mjs --episode episodes/<id>` says what is next. Fix by looking first (`node studio2/probe.mjs --times ...`, 15 s), re-check only the seconds that changed (`collide.mjs --ranges`, `render-parallel.mjs --from --to`, `flicker-check.mjs --from --to`), and finish with `node studio2/finish.mjs` (skips every step whose inputs did not change). A full 63 s film renders in about 2 minutes on 4 browsers; the full collision pass takes about 6.

## Layout
`studio2/` toolchain and tests (`node --test studio2/tests/*.test.mjs`) - `episodes/<id>/` one film (script, story, Blender scripts, scene code, film.json) - `channels/` channel profiles - `reference/` the formula and measured numbers - `docs/` workflow, defects, design docs - `.claude/` rules, skills, hooks.

Not in git (regenerable or private): GLB models (`node studio2/blender-build.mjs`), frames and videos, voice and effects caches, `.env`, owner approvals.

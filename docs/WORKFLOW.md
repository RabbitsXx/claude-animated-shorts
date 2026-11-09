# Workflow: topic to delivered package

Rules live in `AGENTS.md` (short, always loaded) and `.claude/rules/*.md` (story, models, scene; loaded only when you touch those files). The procedure is the `make-film` skill. This file is only the commands, in order. Replace `<id>` with the episode folder (`episodes/<id>`).

## 0. Start
```
node studio2/briefing.mjs                                  # active episode, open to-dos, library parts, defects without a check
node studio2/next-step.mjs --episode episodes/<id>         # the first undone step of the order of work
node studio2/new-episode.mjs <id> --channel <channel-id>   # a new film (record the topic quote in approvals.json)
```
Before step 1 the owner approves the design doc `docs/specs/<date>-<id>-design.md` (intent, the one fact, beats, light plan, models list, work split); copy it into the episode folder as `DESIGN.md` when the episode is created.

## 1. Story
`SCRIPT.md`, `SPEC-BEATS.md`, `STORY.json`, `HOOK.md`, `STORYBOARD.json`, then `node studio2/story-audit.mjs --episode episodes/<id>` (includes the FUN GATE) until PASS. Never model or voice a story that fails. Shape: `reference/REF-FORMULA.md`.

## 2. Models, one by one, all in Blender (independent models may be built in parallel by workers; the orchestrator passes each)
```
node studio2/models.mjs --episode episodes/<id> --status
node studio2/blender-build.mjs --episode episodes/<id> --model <modelId>      # headless: blender/<modelId>.py -> scene2/models/glb/<modelId>.glb
node studio2/models.mjs --episode episodes/<id> --sheet <modelId>             # engine sheet, textured like the film, 1.8 m figure
python studio2/shrink.py episodes/<id>/out/models/<modelId>.jpg               # look at the small copy
node studio2/models.mjs --episode episodes/<id> --pass <modelId> --by claude --checks "a|b|c"
blender -b --python studio2/blender/check-hair.py                             # after any character-part change
```
Fill `reference`, `realDetails`, `interaction` in MODELS.json before building. The scene (`scene2/main.mjs`) awaits every model's `load()` at the top of `build`.

## 3. Gates on the assembled scene
```
node studio2/collide.mjs --episode episodes/<id>           # overlaps, hidden subject, camera inside a solid (also measures dressing)
node studio2/probe.mjs --episode episodes/<id> --times 1.0,2.4 --sky   # look at a few frames first: sheet + collision + intents + sky share (15 s)
node studio2/collide.mjs --episode episodes/<id> --ranges 52-56   # after a fix: re-check ONLY those seconds and merge into the passing full report (a change that reaches other beats needs --workers 4)
node studio2/scene-quality.mjs --episode episodes/<id>     # every beat dressed to the Ref level
python studio2/intent-sheet.py --episode episodes/<id>     # after collide: out/intent-sheet-N.jpg, 3 frames per key moment with green/red markers; look at it against the storyboard camera line
node studio2/camera-plan.mjs --episode episodes/<id>       # every shot travels
node studio2/preflight.mjs --episode episodes/<id>         # tests, story, collide, quality, sample render, colour, detail, parity; must PASS before a full render
node studio2/preflight.mjs --episode episodes/<id> --fast  # iteration only: collision every 3rd frame, no tests; never replaces the full preflight
node studio2/storyboard-frames.mjs --episode episodes/<id> # 15 real frames -> out/storyboard-frames.jpg; the owner quotes approval into approvals.json
```

## 4. Sound (paid: only with the owner's OK for this spend)
`node studio2/eleven.mjs dry` first. Voice, effects and score are cached by content hash. `node studio2/mix.mjs`, `node studio2/mixcheck.mjs` (score 10-13 dB under the voice). Without real voice, render silent and without captions.
Listening to the Ref or our cut: `python studio2/ref-audio.py <clip.mp4>`.

## 5. Render, assemble, deliver
```
node studio2/render.mjs --scene episodes/<id>/scene2/main.mjs --words episodes/<id>/voice/words.json --from 0 --to <seconds> --out episodes/<id>/renders/full --quality 0.96 --timeout 3600   # add --captions only with real voice words
node studio2/render-smart.mjs --episode episodes/<id>      # later: re-render only what changed
node studio2/assemble.mjs --episode episodes/<id>          # refuses without a passing, current collide.json
node studio2/finish.mjs --episode episodes/<id>            # tests, gate, assemble, frame check, retro
node studio2/flicker-check.mjs --episode episodes/<id>     # 12 s on the rendered frames: a patch that flips for one frame (z-fight); --contact writes out/flicker-worst.jpg
node studio2/motion-check.mjs --episode episodes/<id>      # still share, windows, dissolves, hard cuts vs the Ref
node studio2/package.mjs --episode episodes/<id>           # out/publish, post.txt with channel footer and AI disclosure; never uploads
```
Fast path (measured on pendulum-tower, RTX 4060): `node studio2/render-parallel.mjs --episode episodes/<id> --workers 4` renders 1905 frames in 2.0 min with frames byte-identical to a single render (md5 of all 1905 checked); it moves the old `renders/full` to `renders/previous` itself. The same split for the gate: `node studio2/collide.mjs --episode episodes/<id> --workers 4` (5.5 min vs about 9 single). After a fix re-render only the stretch: `--from 52 --to 56` (0.3 min for 4 s; every other frame is untouched), and `flicker-check.mjs --from 52 --to 56`. A single-process render takes 15-25 minutes; use it only when a worker fails. Move the previous `renders/full` aside first. The disk is nearly full: check free space before a render (about 5 GB of frames). `voice/words.json` is made by the sound step; `SCRIPT.md` must exist (eleven.mjs, voicegaps.mjs and render.mjs read it).

## 6. After a film
`node studio2/retro.mjs --episode episodes/<id>`, log new defects in `docs/DEFECTS.json`, promote proven parts into `studio2/library/INDEX.json`, refresh `HANDOFF.md` with measured numbers, run all tests.

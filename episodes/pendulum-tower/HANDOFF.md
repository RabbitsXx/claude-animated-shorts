# pendulum-tower - handoff (2026-11-09, evening)

Design: `DESIGN.md` (approved, quote in approvals.json `design`). Rules: AGENTS.md, commands: docs/WORKFLOW.md, story shape: reference/REF-FORMULA.md.

## State (measured)
- Story: `story-audit.mjs` PASS incl. FUN GATE (16 beats, 63.5 s). A person still has to judge the jokes.
- Models: 11 of 11 passed on their sheets (Claude looked at every sheet; the owner did not).
- Scene: `scene2/main.mjs` assembled (one world: Pete's tower with the golden ball, Rex's tower with the rooftop pool, crane, playground, queue; day -> night -> morning). 
- `node studio2/preflight.mjs --episode episodes/pendulum-tower`: **PREFLIGHT PASS** (run 14): 281 tests, story, collide 1905 frames 0 problems (allow list only for intended contacts), scene quality 16/16, camera plan (head 13% median, >12% in about half the frames), no flat/black, saturation 0.433, no sky-heavy frame, brightness swing 0.234, detail edge share 0.278 (need 0.269), parity 95.3% (need 74.3%).
- Storyboard: `out/storyboard-frames.jpg` (16 real frames) rendered and shown to the owner. NOT approved yet: the owner must quote approval into `approvals.json` key `frames`.
- NOT done: sound (voice, effects, score need the owner's OK for the spend: `node studio2/eleven.mjs dry` first), full render, assemble, finish, cover, package. `voice/words.json` is a placeholder (captions read "placeholder" in the preflight sample).

## Things to know
- The film must stay a pure function of time: every moving part is reset at the start of `state(t)`; fx bursts are scheduled once at build time (a stale pigeon rotation once broke the seek check).
- Camera plan: face cameras (`FC(...)`) follow the actor's head (`foc`), distances about 3.4 -> 3.3 m at 32 degrees keep the head over 12% of the frame; low wide shots need tall belt trees near the camera line for the depth-layer gate.
- Hidden on purpose for the look/gates: Rex's shaft and cab glass, Pete's lift glass and door, Rex's banner frame, crane hook in the night ball shot, Pete's dampers while he drills (dissolves cover the change). Facade glass is hue-shifted greener (cyan counts as sky in the sky check).
- Old files copied by the scaffold (`scene2/models/*` from double-weight-hourly and other films) are unused by `main.mjs`; archive them, do not delete.
- Faster loop for tweaks: render only the 64 preflight sample times (+0.45 s each, quality 0.85, with captions) and run `studio2/detail-check.py` / `studio2/parity.py`; run the full preflight once at the end.

## Known limits
Beat 13 ghost-replay has no blue glow; the dummy flung/curtain gag was not looked at frame by frame; Pete's hair is removed under the cap so his eyes show; Rex's slick hair reads as a dark helmet; the "tie in the elevator door" gag is not staged; audio is absent.

---
name: make-film
description: Make one animated explainer short from topic to delivered package in this repo (story, Blender models, three.js scene, voice, gates, render, package). Use when the owner asks for a new film, a new episode, or to continue or finish one.
---
# Make one film

The hard rules are in `AGENTS.md`; every command is in `docs/WORKFLOW.md`. This is the order and the habits that made the last film fast and good.

1. **Start**: `node studio2/briefing.mjs` (open to-dos, parts, defects), `df -h` (8 GB free), stop stray node/Chrome jobs, `node studio2/next-step.mjs --episode episodes/<id>`.
2. **Design doc first** (`docs/specs/<date>-<id>-design.md`): intent, the one fact, beats with the camera line of each, light plan, models list, which beats are wide shots and which are face shots. The owner approves it in chat; record the quote in `approvals.json`. Use the brainstorming skill if the topic is open.
3. **Story**: files named in `.claude/rules/story.md`; `story-audit.mjs` PASS (includes the FUN GATE).
4. **Models**: one Blender script each, built headless, sheet looked at, passed with three written checks. Independent models may be built by parallel subagents (one file each, report under 150 words); the orchestrator builds and passes them. Name every grip.
5. **Scene** `episodes/<id>/scene2/main.mjs` from the passed models. Declare `INTENTS` for the key moments, hold props with `HOLDN`, design the camera against all gates (see `.claude/rules/scene.md`).
6. **Fix loop** (this is where the time goes; keep it small): `node studio2/probe.mjs --episode ... --times ... --sky`, fix, `collide.mjs --ranges ... --workers 4`, `intent-sheet.py`. Never rerun what passed; never wait on a full gate to learn one number.
7. **Gates**: `preflight` (full, once) then `storyboard-frames` for the owner's frame approval. Sound is paid: `eleven.mjs dry`, owner's OK for that spend, quote in `approvals.json`. Cached by hash; never regenerate to re-render.
8. **Deliver**: `render-parallel.mjs --workers 4`, then `finish.mjs` (tests, collision, intent, flicker, assemble, frame check, motion check, retro; skips unchanged steps), cover from our own scene with no text (`covers/*.mjs`, render with `render.mjs --times 0`), `package.mjs`. Nothing is published: the owner uploads.
9. **After**: `retro.mjs`, log new defects in `docs/DEFECTS.json` with the check that catches them, promote proven parts to `studio2/library/INDEX.json`, refresh `HANDOFF.md` with measured numbers, all tests green.

Report to the owner in Thai: what was measured, what failed, what a person must still watch, listen to or decide. Never claim anyone watched or listened.

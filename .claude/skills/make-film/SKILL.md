---
name: make-film
description: Make an original 55-70 s vertical animated explainer short from topic to delivered local package using studio2 (the method proven by episodes/time-machine-success). Use when asked to make, continue, fix or review a film in this repository.
---

Read AGENTS.md, then docs/WORKFLOW.md and docs/AUTHORING.md, then the episode's HANDOFF.md. Reply to the user in Thai.

Short version: user picks the topic -> `node studio2/new-episode.mjs <id>` -> SCRIPT.md + SPEC-BEATS.md -> (only with the user's OK to spend) `eleven.mjs voice|sfx` -> author `scene2/` -> `node studio2/review.mjs` and read every contact sheet, fix every defect on the checklist -> `mix.mjs` -> full `render.mjs` -> `assemble.mjs` -> cover + `out/publish` -> honest report. Never publish; never claim a review or listen that did not happen; never touch `archive/`.

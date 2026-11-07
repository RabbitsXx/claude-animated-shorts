> HISTORICAL plan written before the cleanup. Paths to `pipeline/`, `shots/`, `scripts/` now live under `archive/2026-11-07-old-pipeline/`. Current instructions: AGENTS.md and docs/WORKFLOW.md.

# Time Machine Film Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) task-by-task. Steps use checkbox (`- [ ]`) syntax. Simple or thinking-light steps go to Haiku subagents (global model policy); everything needing judgement stays on Sonnet 5.5.

**Goal:** Produce `What If A Time Machine Actually Worked?` (about 60 s, 1080x1920, 30 fps) at the quality of the user's reference clip, with the reference's story skeleton.

**Architecture:** `studio2/` is the new runtime (Three.js, headless GPU render, absolute-time scene functions). The film is one scene module, `episodes/time-machine-success/scene2/main.mjs`, that dispatches to per-beat modules. Voice word timings drive every beat through anchors, so retiming never needs scene edits.

**Tech Stack:** Node 24, Three.js 0.187 (sibling `bridge-test`), Edge/Chrome headless on the RTX 4060, FFmpeg, Python/Pillow, ElevenLabs or a free fallback voice for narration.

**Spec:** `episodes/time-machine-success/SCRIPT.md`, `SPEC-BEATS.md`, `V2-PLAN.md`; quality bar in `pipeline/quality/reference-study/ANALYSIS-TH.md`.

## Global Constraints

- Characters: real 3D head and torso, 2D face ink, 2D stick limbs with arm 0.285/0.255 m and leg 0.37/0.37 m; never stretch limbs (render reports `reach`, must be 0).
- Every scene value is a pure function of absolute time; render refuses non-deterministic seeks.
- Every spoken action needs setup, contact, consequence; no held poses longer than about 0.8 s without secondary motion.
- Ink: character 4.5 px, prop 2.6 px, background 1.1 px at 1080x1920.
- No third-party art, no image generation. Cover has no text.
- Narration is exactly the paragraphs in `SCRIPT.md`; 55-70 s.
- No paid API call without the user's explicit yes in this conversation; no publishing.

## Review Focus

- Retiming: if real voice timing differs by +-15% from the estimate, every beat still plays in order without overlaps. Test: anchors with scaled words.
- A phrase anchor that is missing from the real alignment fails loudly, never silently falls back.
- A pose with an unreachable hand target is clamped and reported, never rendered with a stretched bone.
- Crowd of 24 does not break the 30 min render budget.
- A beat boundary never leaves an actor, prop or particle from the previous beat visible.

---

### Task 1: Pure runtime modules under test

**Files:**
- Create: `studio2/tests/tracks.test.mjs`, `studio2/tests/face.test.mjs`
- Modify: none unless a test exposes a defect in `studio2/runtime/tracks.js`, `face.js`

**Interfaces:**
- Consumes: `key(keys,t)`, `ramp`, `bell`, `anchors(words)(query,n)`, `faceTrack(keys,t)`, `mixFace(a,b,k)`
- Produces: a passing `node --test studio2/tests/*.test.mjs`

- [ ] Write tests: `key` holds first value before the first key and last after the last; eased segment hits exact keys; `anchors` finds a two-word phrase and its 2nd occurrence and throws on a missing one; `mixFace('neutral','shock',.5)` is the midpoint of every parameter.
- [ ] Run, record any failure, fix `tracks.js`/`face.js`, rerun green.
- [ ] Note in the test header that these were written after the first implementation; all new runtime code from here is test-first.

### Task 2: Beat modules 4-15

**Files:**
- Create: `episodes/time-machine-success/scene2/beats/{rival,test1,model,orbit,train,tracker,test2,opening,rivalboard,lever,payoff,finale}.mjs`
- Modify: `scene2/main.mjs` (dispatch only), `scene2/set.mjs` (world placements for runway A/B, stage, crowd area)

**Interfaces:**
- Produces: each beat module exports `makeBeat(env) -> {start:number,end:number,run(t):{camera,beforeRender?,note?}}`; `env={ctx,kit,T,world,cast,props,fx}`; unused actors/props are hidden by `hideAll()` before each `run`.

- [ ] For each beat: render 3 stills (start, middle, end) and read them; fix framing, reach and visibility before the next beat.
- [ ] After all beats: render the whole film silent with captions at estimated timing and read a contact sheet every 0.5 s.

### Task 3: Voice and timing

**Files:** `episodes/time-machine-success/voice/`, `audio-plan.json`

- [ ] Ask the user once for the voice route (ElevenLabs paid vs free Edge neural TTS with word boundaries); no spend before the answer.
- [ ] Produce `words.json` (`[{word,start,end}]`) from the chosen route and rerender with `--words`.

### Task 4: Music, effects, mix

**Files:** `episodes/time-machine-success/audio/`, `studio2/mix.mjs`

- [ ] Reuse listening-pending library effects first (bolt click, whoosh, chime, ambience); create only missing ones, with the user's approval of scope.
- [ ] Mix narration, music (ducked) and word-anchored effects to about -14 LUFS; verify loudness and clipping with ffmpeg.

### Task 5: Full render, QA, cover, package

**Files:** `episodes/time-machine-success/out/`, `cover.mjs`, `PUBLISH.json`

- [ ] Render all frames, encode H.264/AAC, run decode, black/freeze and loudness checks.
- [ ] Read every contact sheet; compare hammer, face and reveal strips with the reference strips.
- [ ] Stage a text-free cover; write the publish package; do not publish.
- [ ] Report limitations honestly (no continuous listening by the agent).

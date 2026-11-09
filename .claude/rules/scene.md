---
paths:
  - "episodes/*/scene2/*.mjs"
  - "episodes/*/film.json"
  - "episodes/*/covers/**"
  - "studio2/runtime/**"
  - "studio2/lib/**"
---
# Scene, camera and gates (loads only when you touch the scene or the gate code)

## The look (measured against the Ref, `studio2/lib/ref-contract.mjs`)
- Realistic world, flat characters: surfaces from `studio2/library/realism.mjs` (`texturize`), real geometry detail, instanced Blender vegetation (`studio2/library/foliage.mjs`). Sky: saturated blue to the horizon with puffy cumulus (`sky-clouds.mjs`); the pale far band is fog on far objects, never sky colour; night has a big moon.
- Gates on in `film.json`: camera travel about 10% of frame width per second per shot (floor 3%), dissolves between beats and few hard cuts, hero head 12%+ of the frame in 40%+ of frames and a median of 9%+ (a geometric measure: distance and lens of the camera target, so a close shot counts even when the hero is not in it), median saturation .38+, fine detail and edge share at least 75% of the Ref, every beat dressed in layers (foreground under 6 m, middle, far).
- Sound: a low music bed all film with one style change, a riser at the main cut, a whoosh and a ding at the payoff, voice first, -14 LUFS.

## Design the camera against ALL gates before building the scene
- Face cameras about 3.4 m at 32 degrees; the caption sits at about 0.69 of the frame height, so aim low and keep faces and key objects in the upper half. Subject never behind glass or a bar. Low wide shots need tall trees near the camera line. No big blue glass or cyan water in a shot (the sky check counts blue). Rich backgrounds behind faces (crowd, bunting, posters, paving joints) for the edge-share gate.
- Wide shots of a big object cost head-size budget: count them. Keep wide key shots to about half of the film, give each beat's key shot its own INTENT window and let face interludes for narration lines stay outside it.
- A moving camera that follows a thing must follow it analytically (use the scene's `foc` point with a face camera, or `subjAt`), not hand-timed keys against an eased move: the keys drift off the subject.
- Fast vertical rides strobe on repeating bands (floors): return `blur:<shutter seconds>` from `update()` for those frames (about .035 s).

## Fix fast: look first, then check only what changed
- **Probe** a camera or pose fix on 3-8 frames: `node studio2/probe.mjs --episode episodes/<id> --times 1,2,3 --sky` (15 s: contact sheet + collision + where each intent object sits + sky share). Never wait for a full gate to learn one number.
- **Re-check only the changed seconds**: `collide.mjs --ranges a-b,c-d --workers 4` (merges into the passing full report; add 0.5 s after a changed segment because the next dissolve uses its camera), `render-parallel.mjs --from S --to S`, `flicker-check.mjs --from S --to S`. `finish.mjs` skips every step whose inputs are byte-identical to its last PASS.
- **Run the picture gates on frames you already have** instead of a new preflight render: copy one frame per second of `renders/full` to a folder and run the official sky check (`lib/framecheck.mjs` skyRuns), `detail-check.py check` and `parity.py check` on it (20 s, not 6 min).
- Measure a failing gate per frame first, look at the worst frames, fix, check the range. The full `preflight` (about 15 min) is for before the first full render only; `--fast` for iteration.
- Before long work: free disk 8 GB+ and no stray background jobs. A full disk fails every tool with ENOSPC and slows everything 10x. The hidden eater was `studio2/.runs/b-*`: one Chrome profile (about 100 MB) per render run, never deleted; 1,400 of them took 150 GB. `render.mjs` now removes its own profile; if the disk fills anyway, look there first. Render and collide always split over 4 browsers (GPU sat at 16% with one).
- Edit scene code with a script or the Edit tool, never `sed` that appends a `//` comment to a line of code (it silently swallowed the rest of the line once and a gate "passed" with the hero never posed). After any edit run `node --check` and probe one frame.

## Determinism and tracking
- Every moving part is reset at the start of the scene's `state(t)`; never call `fx.burst` per frame (schedule bursts once at build time); `storyboard-frames.mjs` fails with "Non-deterministic seek" otherwise.
- Track points are the thing itself, not its group: the cab of a lift, not the shaft group (whose box reaches 70 m); an object bigger than the frame (a tower) is tracked with `{obj,big:true}` and counts by how much of the picture its box covers.

## Hands on props and shots that show the point (the collision pass checks both)
- A held prop is gripped through the model's own grip node: `HOLDN(id,actor,hand,model,/^node[ _]name/)` (the node's bounding-box centre is the target) or `HOLD(id,actor,hand,prop,[x,y,z])`. Order each frame: place the prop, HOLD, pose. Call HOLD only while the prop is held. More than 6 cm between the end of the arm and the grip fails the collision gate (`grip` rows); the actor's real reach error is returned in the frame state, never a hand-typed 0.
- Stand where the arm can reach (`near(from,to,d)`; the arm is about .54 x scale; the standing shoulder about .8 x scale above the floor). A handle that goes round needs the body to follow it (step to its side, crouch to its height). A big prop decides where the actor can stand: move the hole or the actor, not the ball.
- Each key moment is declared in `INTENTS` (time window, primary thing, things to show) with the things tracked per frame (`trackNow`). The collision pass measures visible, inside the frame, the primary in the title-safe middle (x .12-.88, y .10-.64), big enough (primary 6%, others 3% of the frame height), nothing solid in front. `python studio2/intent-sheet.py` gives the verdict per moment (PASS at 60% of frames, WAIVED only with a written `waive` reason from the owner) and the sheets to LOOK at against the storyboard camera line; the measured part is presence, position, size and occlusion only.

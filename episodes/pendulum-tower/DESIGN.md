# Design: "pendulum-tower" (working title: Why a Skyscraper Hangs a Giant Golden Ball)

Status: DRAFT for the owner's approval. Nothing is built yet. Channel `explainer-shorts`. Owner chose this concept 2026-11-09 (idea A of three).

## Intent and why
A new film that is as fun as the Ref (`reference/REF-FORMULA.md`): same story shape, new topic. Our earlier films taught too many facts, changed the carrier object every beat and used one flat light level. This one teaches ONE fact through ONE object that changes, with the Ref's plant -> reveal -> double payoff.

## The one fact (real)
Tall towers sway slowly in wind. A heavy ball hung on a long rope inside the top floors swings the opposite way and soaks up the sway (tuned mass damper). The rope length decides the ball's swing time, so it must be long enough to swing as slowly as the tower. Everyday picture: a playground swing; push against it and it stops. Real example for SCRIPT.md facts: Taipei 101's ball, about 660 t, hung between floors 87 and 92 (Guinness World Records; Mothership; Urban Toronto). Not used on screen: the "up to 40%" figure (manufacturer's claim) and any earthquake claim (its main job is wind sway). Fiction labelled: Pete, Rex, the rival's sabotage, the town.

## Story (16 beats, ~63 s; the But/So chain is written in the story step)
Hero **Pete** (red cap, stubborn). Rival **Rex** (dark hair, smug).
1. Hook 0-2 s: Pete winches a giant golden ball up the side of a skinny tower; the crane groans.
2. Pull back: the tower is tall and thin, Pete tiny. Banner: OPENING TOMORROW.
3. Cost gag: the ball took the penthouse that was meant to pay for the tower; empty wallet, a fly.
4. Rex builds a sleek copy "bolt for bolt", no ball, with a rooftop pool.
5. PLANT (night): wind test; Pete's ball hangs on a rope that is too short and bangs about; the test dummy comes back flung and dizzy (cause withheld).
6. Pete cannot miss the opening. At night he drills through the floors and lets the rope out, the ball sinking floor by floor.
7. "Does he know what he's doing? Not really."
8. Rex laughs, sneaks in and cranks the winch so the ball will "smash the floor". (He lengthens it to the right length by accident.)
9. Morning: the town queues at Rex's sleek tower; Rex rides up first.
10. Pete rides his; the gust arrives; he sees the ball hanging low and swinging: "But it's too late."
11. REVEAL (~65%): swing picture, the one sentence; shown on the carrier ball and the swing sign.
12. "...which is why the dummy flew" (the ball was out of step).
13-14. Pete's rope: long and slow, the ball swings against the sway; the coffee cup on his desk does not spill.
15. Rex's tower, no ball, sways; the pool empties over the roof.
16. Cut on Rex's seasick face.
Light: day (1-4) -> night (5-8) -> bright morning (9-16). About 30% night.

## Goals / non-goals / anti-goals
- Goals: Ref-level fun and look (all gates in `film.json`); one fact; ball visible in about half the beats and changing (short and fast -> lowered -> long and slow); stakes written in the world (banner, sign), captions 1-3 words only.
- Non-goals: explaining damper engineering, numbers on screen, earthquakes, a second fact.
- Anti-goals (failure even if gates pass): a list of facts; a ball that is only decoration; the ball and the tower not visible in the same shot as the sway; copying the Ref's coaster, characters or lines.

## Constraints
AGENTS.md hard rules: own Blender geometry only, no publishing, no paid sound without OK, `collide` before `assemble`, owner approves frames and spending. English narration, Thai replies.

## Approaches (how to build; my proposal, you pick)
1. **New scene from new Blender models, reusing library parts** (characters, crowd, sky, foliage, dressing). Most faithful to the Ref and to AGENTS.md; more model work (about 6). *Recommended.*
2. Adapt an old episode's scene (`square-wheel` village). Faster, but the old scene's flat look is what made earlier films dull, and the tower would sit in the wrong world.
3. Cut the ball rig to a simple prop and spend effort on acting. Cheaper, but the carrier object (the thing the viewer learns from) would be weak.

## Models and work split (approach 1)
All Blender, one script each, `episodes/pendulum-tower/blender/<id>.py`:
- W1 (worker): Pete's skinny tower with cutaway top floors, golden ball, rope rig, 4 side dampers (the carrier).
- W2 (worker): Rex's sleek tower with rooftop pool (water surface as a separate mesh that the scene animates).
- W3 (worker): crane and winch, test dummy, desk, coffee cup, chair.
- W4 (worker): town dressing: banners (OPENING TOMORROW, GRAND OPENING), swing sign, street lamps, wind socks, queue barriers; crowd via `studio2/library/crowd.mjs`.
- Orchestrator (main model): story and FUN GATE, MODELS.json, scene assembly, sway/swing animation, camera plan, all gates and sheets, owner approvals. Haiku: status/log/test summaries, contact-sheet listings. `vibe-reviewer` reads the finished scene before you do.

## Left to the builder
Exact tower proportions (real sizes recorded in MODELS.json), shot list and camera moves, narration wording (10-12 word But/So sentences, about 227 words per minute), sound plan (a quote is made with `eleven.mjs dry`; nothing is spent without your OK).

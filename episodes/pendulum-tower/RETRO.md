# Retro: pendulum-tower

Measured by studio2/retro.mjs from the film's own files. Nobody has watched or listened unless the user says so.

## What it cost (the number to push down from film to film)
- gate runs: 43 (first pass on run 1; run 1 had 0 overlaps)
- full renders: 12
- last gate: PASS, 1906 frames, 0 overlaps

## What failed most often at the gate
- shot subject x hidden by shaft_corner_post003: 5 run(s)
- shot subject x hidden by gold_sphere: 4 run(s)
- shot subject x hidden by slab_edge_fin_front: 4 run(s)
- shot subject x hidden by shaft_post001: 4 run(s)
- shot subject x hidden by floor_finish_18: 4 run(s)
- shot subject x hidden by elevator_guide_rail: 4 run(s)
- shot subject x hidden by shaft_transom_side001: 4 run(s)
- shot subject x hidden by glass_pane_curved012: 4 run(s)

## Result
- length 63.5 s, 12.3 cuts per minute, loudness -14.2 LUFS, true peak -1.5 dBFS

## To do now (a retro is not finished until these are done)
1. Log every defect that cost a retry in docs/DEFECTS.json (symptom, cause, rule, how it is caught). A defect seen twice gets a check before the next film starts.
2. Promote what proved itself. Candidates in this film's scene code that are not in studio2/library/INDEX.json yet:
   - (none found)
   Promote = move to studio2/library with a test (and a golden check if it was moved from episode code), then add it to INDEX.json.
3. Write down the number above in HANDOFF.md and compare it with the previous film.
4. Dead files (the scaffold copied them from the previous film; main.mjs never reaches them). Move them to an archive folder so the next session does not read them:
   - (none)

---
paths:
  - "episodes/*/SCRIPT.md"
  - "episodes/*/STORY.json"
  - "episodes/*/SPEC-BEATS.md"
  - "episodes/*/HOOK.md"
  - "episodes/*/STORYBOARD.json"
  - "episodes/*/DESIGN.md"
  - "docs/specs/**"
  - "reference/**"
---
# Writing the story (loads only when you touch story files)

Read `reference/REF-FORMULA.md` first. The shape we copy from the Ref:
- One stubborn hero does something that looks wrong and is laughed at; a rival "does it properly" and sabotages.
- ONE fact, said once with an everyday picture. ONE carrier object on screen in about half the beats, changing shape.
- Plant (consequence first) -> gap -> reveal at 40-80% -> double payoff (hero safe, rival hit). Day -> night -> day.
- But/So narration, 10-12 word sentences, almost no numbers. Stakes are written in the world (banner, sign), not floating tags.
- `node studio2/story-audit.mjs --episode episodes/<id>` (includes the FUN GATE) must PASS before any model, voice or scene work. A story that fails is never modelled or voiced.

Write the storyboard camera line of each beat as something a camera can show with the carrier object or the hero in frame (it becomes the beat's INTENT, checked by `collide.mjs` + `intent-sheet.py`). Say in the design doc which beats are wide shots of a big object and which are face shots: the camera-plan gate needs the hero's head over 12% of the frame in 40%+ of the frames and over 9% in half of them, so wide key shots may fill at most about half of the film.

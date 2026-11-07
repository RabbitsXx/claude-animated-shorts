# Workflow: from nothing to a delivered local package

This is exactly how `episodes/time-machine-success/` was made. Every command runs from the repository root. Nothing here publishes anything.

## 0. Check the machine
```
node --version            # 24.x
ffmpeg -version           # and ffprobe
node --test studio2/tests/tracks.test.mjs studio2/tests/face.test.mjs studio2/tests/scaffold.test.mjs
```
Three.js must exist at `F:\Create Cartoon\bridge-test\node_modules\three` (or set `STAGE_THREE`). Edge/Chrome with a GPU is used headless by `render.mjs`.

## 1. Topic (user decision)
Propose 2-3 topics (a real fact plus a visible, funny, escalating consequence) and **wait for the user to choose**. Record the user's real words in `episodes/<id>/approvals.json` (`topic.quote`, `source`, date). Never invent an approval.

## 2. New episode
```
node studio2/new-episode.mjs <id> [--from time-machine-success]
```
This copies the working scene code (`scene2/`) and `film.json`; it never copies media or approvals. Then:
- Write `SCRIPT.md`: facts with sources (mark fiction as fiction), then `## Narration` as lines starting with `> `, 55-70 s in total (about 170-190 words at the voice's pace). Every spoken action needs something to see.
- Write `SPEC-BEATS.md`: the 16-beat skeleton from `reference/TARGET.md`, one row per beat (reference beat -> your beat, narration anchor, acting/camera/consequence).
- Set `film.json` (`voiceId`, `targetSeconds`).

## 3. Voice, score, effects (needs the user's explicit OK to spend)
```
node studio2/eleven.mjs dry   --episode episodes/<id>   # prints what would be requested, 0 API calls
node studio2/eleven.mjs voice --episode episodes/<id>   # one narration take with word timestamps
node studio2/eleven.mjs sfx   --episode episodes/<id>   # effects + one score
```
Outputs: `voice/voice.wav`, `voice/words.json` (word start/end times), `voice/meta.json`, `audio/*.wav`. All requests are cached by hash, so re-running costs nothing. Edit the `EFFECTS` list in `studio2/eleven.mjs` for a different film. Shared library effects live in `assets/sfx/`.

## 4. Author the scene
Read `docs/AUTHORING.md`. Edit `episodes/<id>/scene2/` (`main.mjs` opening and wiring, `beats.mjs` the remaining beats, `props*.mjs`, `set.mjs`, `cast.mjs`). Timing comes from the voice words: `T('two word phrase', n)` returns the start time of that phrase, so the picture follows the narration.

## 5. Fast review loop (repeat until clean)
```
node studio2/review.mjs --episode episodes/<id>            # every 0.4 s at lower quality
node studio2/render.mjs --scene episodes/<id>/scene2/main.mjs --words episodes/<id>/voice/words.json --times 12.4,12.8 --out studio2/.tmp/t --captions --quality 0.9
python studio2/sheet.py studio2/.tmp/t studio2/.tmp/t.jpg --cols 5 --width 360
```
Open the sheets and look at each frame. `review.mjs` prints a `reach` line for every frame where a hand or foot could not reach its target; fix the blocking, never stretch a limb. Use the checklist in `docs/AUTHORING.md` on every sheet. Zoom into any shot with contact, feet, or overlapping objects.

## 6. Mix
```
node studio2/mix.mjs --episode episodes/<id>
```
Voice on top, score ducked under it, word-anchored effects (edit the `cues` list in `studio2/mix.mjs` for the new film), ambience, loudnorm to about -14 LUFS. No API calls.

## 7. Full render and assemble
```
node studio2/render.mjs --scene episodes/<id>/scene2/main.mjs --words episodes/<id>/voice/words.json --from 0 --to <seconds> --out episodes/<id>/renders/full --captions --quality 0.96 --timeout 3600
node studio2/assemble.mjs --episode episodes/<id>
```
About 15 minutes for 1938 frames. Move the previous `renders/full` aside first (or into `archive/`). `assemble.mjs` writes `out/final.mp4` and `out/qa.json` (decode, black/freeze segments, loudness, peak). These are measurements only.

## 8. Cover and package
- Cover: a staged still from our own scene, **no text, no image generation**. `scene2/cover.mjs` is the example; render it with `render.mjs --scene episodes/<id>/scene2/cover.mjs --times 0 --out episodes/<id>/out/publish`.
- Package in `episodes/<id>/out/publish/`: `final.mp4` (copy), `cover.png`, `cover-small.jpg`, `title.txt`, `description.txt`, `keywords.txt`, `metadata.json`. See `episodes/time-machine-success/PUBLISH.json` for the fields.

## 9. Report honestly
Tell the user (in Thai): what is delivered and where, the measured numbers, and what nobody has judged (nobody has watched or listened continuously; equality with the reference is the user's call). Update `episodes/<id>/HANDOFF.md`. Do not publish.

# time-machine-success - handoff (take 5, delivered locally, nothing published)

Topic chosen by the user in chat: "เอาเป็นแบบ ถ้าเราทำ ไทม์แมคซีนสำเร็จจะเกิดอะไรขึ้น" (what happens if a time machine works). The film copies the reference clip's skeleton (`SPEC-BEATS.md`, 16 beats) with only the topic changed. ElevenLabs spend was authorised in chat ("ElevenLabs ครบ"): one narration, one score, 7 effects, all cached in `voice/cache` and `audio/cache` - never regenerate to re-render.

## Deliverables
- `out/final.mp4` 1080x1920, 30 fps, 64.6 s, H.264/AAC (copy in `out/publish/`). `out/qa.json`: decode clean, 0 black, 0 freeze, -13.8 LUFS, -1.5 dBFS peak. `out/preview-720p.mp4` is a small preview.
- `out/publish/`: cover (staged, text-free, not a video frame), title, description, keywords, metadata. Not published.

## How to work on it
See `docs/WORKFLOW.md` and `docs/AUTHORING.md` at the repository root. Scene code: `scene2/` (`main.mjs` opening, `beats.mjs` beats 4-15, props/set/cast). Fast review: `node studio2/review.mjs --episode episodes/time-machine-success`.

## What take 5 fixed (user report: glitching, clipping, unclear explanation, double floors)
- Explainer cutaways (model/empty space, orrery, "old spot", toy train, final model payoff) now render in a single "studio" star-dome with only the prop and big tags (no grass + table + backdrop stacking; no figure covering its label).
- Characters stand on the machine deck at y 0.30 (they were buried in it in the opening and finale or floating off its edge in tests); the rival deck was extended so the rival no longer stands beyond its edge.
- Planet tracker made tall, moved to open ground (3.6, 0, 0.6); the inventor now tightens its clamp with a wrench in hand and no part of him touches the pole or rings.
- Dirt patches no longer z-fight; figurine hands attach to the arms; reach error at the tracker is 0.
- Max limb-reach error across the film is 0.043 m (rival at the lever, a few frames, limb clamped, not stretched).

## Honest limits
- No person and no agent has watched the whole film or listened to the whole mix continuously; QA numbers are measurements only.
- Quality against the reference was judged from contact sheets, not by the user. Equality with the reference is the user's call.
- Weaker spots: crowd and figurines are simple; some wide shots have little secondary motion; the rival's grip at the lever is about 4 cm short on a few frames.

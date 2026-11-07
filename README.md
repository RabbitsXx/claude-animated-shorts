# Original animated shorts

Start with [AGENTS.md](AGENTS.md), then [docs/WORKFLOW.md](docs/WORKFLOW.md).

```powershell
node studio2/new-episode.mjs my-topic            # copy the working scene code into episodes/my-topic
node studio2/review.mjs --episode episodes/my-topic   # fast review frames + reach errors + contact sheets
node studio2/render.mjs --scene episodes/my-topic/scene2/main.mjs --words episodes/my-topic/voice/words.json --from 0 --to 64.6 --out episodes/my-topic/renders/full --captions --quality 0.96
node studio2/assemble.mjs --episode episodes/my-topic
```

The finished example is `episodes/time-machine-success/` (`out/final.mp4`). Retired material is in `archive/`.

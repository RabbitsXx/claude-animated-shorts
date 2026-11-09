# Channels

One repository, one way of making films, several YouTube channels. A channel owns its brand, story profile, voice, hashtags and AI disclosure in `channels/<id>/channel.json` (validated by `studio2/tests/channels.test.mjs`); `CHANNEL.md` is the short human note. Two channels, never mixed: `explainer-shorts` (Post Time Studio) and `post-time-survival`.

- Every film has `"channel": "<id>"` in `episodes/<id>/film.json`; `node studio2/new-episode.mjs <id> --channel <channel-id>` sets it.
- `story-audit.mjs` applies the channel's story profile (`studio2/lib/story-profiles.mjs`); `post.mjs` writes `out/publish/post.txt` from `POST.json` plus the channel footer, hashtags and disclosure and never publishes.
- Shared by all channels: `studio2/`, `studio2/library/`, `assets/`, `docs/`. A lesson learned on one channel goes into the shared files; a brand or story rule stays in its channel.

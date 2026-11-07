> NOTE: the rea-video tool and `scripts/rea-video.ps1` were moved to `archive/2026-11-07-old-pipeline/tools` and `.../scripts` (history only; not needed to make films). Paths below are the old ones.

# rea-video — installed and run locally

User explicitly requested installation and analysis of the supplied Downloads video on 2026-11-07.

- Upstream: https://github.com/JuneYaooo/rea-video
- Checked-out revision: `2132c8503301fdc4f30b68539272f922f7d751ae`
- Isolated source: `F:/Create Cartoon/claude-animated-shorts/tools/rea-video`
- Isolated Python 3.11.16 environment: `tools/rea-video/.venv` (system Python 3.14 not modified)
- Installed rea-video 0.1.0 with OCR extra; source license/NOTICE retained in the checkout.
- Installed GUI OpenCV dependency conflicted with headless as documented upstream. Removed only GUI OpenCV from THIS environment and reinstalled headless <5. OCR/decompose completed successfully; this expected packaging conflict can still cause metadata-only dependency warnings.
- UVR model (~67 MB, upstream checksum verified) and face detector are cached under `tools/rea-video/.models`. Tool preferences/state stay under `.local-state`, not the user's shared agent memory.
- No global PATH or shared agent-skill installation; project wrapper below provides stable access. Third-party tool source is excluded from normal project search so its AGENTS/rules do not become animation-production rules.

## Commands from repository root

```powershell
./scripts/rea-video.ps1 --help
./scripts/rea-video.ps1 memory
./scripts/rea-video.ps1 decompose "C:/Users/LoliR/Downloads/QlDPMzGmYac-bdeb1795a8623b99cb20b7bbb408c2be895-270.mp4" -o pipeline/quality/reference-study/rea --no-vlm --lang en
./scripts/rea-video.ps1 review pipeline/quality/reference-study/rea
./scripts/rea-video.ps1 apply-review pipeline/quality/reference-study/rea --by Codex-visual-review --lang en
./scripts/rea-video.ps1 summary pipeline/quality/reference-study/rea/breakdown.json
```

Do not rerun review/apply blindly: preserve current evidence first. Apply regenerates the tool report, so its expert-warning banner must be retained/readded. Read the actual upstream skill at `tools/rea-video/skills/rea-video/SKILL.md` before a new analysis.

Actual run: decompose completed with 10 groups, OCR, local vocal/music separation and reports. Agent read every tool shot sheet and applied all 10 reviews plus caption corrections, cast details and proposed sub-scene transitions. VLM is OFF (no external vision API); the merged agent review is visual inspection, not an API call. No media uploaded to a remote analyzer; only source/package/model downloads took place.

Known tool limitations on this file: fusion still mislabels most footage as live action despite the reviewed rendered-scene evidence; ten groups under-segment dissolves; SFX count and rap/music labels are unverified signal guesses; OCR misses/misreads words and precise caption timing. Read ANALYSIS-TH.md/report-th.html as the reviewed conclusion, with the raw report kept for audit. Do not run `correct` pretending the user asserted a production method they did not assert. No paid remake, no image generation, no new film production in this analysis task.

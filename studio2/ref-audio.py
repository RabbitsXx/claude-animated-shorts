"""Listen to a clip with numbers (a local, CPU-only stand-in for the audio part of 'ears for coding agents'): voice activity and the gaps between phrases, non-voice transients (thumps = low band, swishes/dings = high band),
and how those line up with the picture cuts and transitions. Usage: python studio2/ref-audio.py <clip.mp4> [--motion reference/study/motion.json] [--out reference/study/audio-events.json]
Measured, not heard: it says WHERE sound events are and what band they sit in, a person must still judge how they sound."""
import sys, json, subprocess, tempfile, os, argparse
import numpy as np
from scipy.io import wavfile
from scipy.signal import stft, find_peaks

ap = argparse.ArgumentParser(); ap.add_argument('clip'); ap.add_argument('--motion', default='reference/study/motion.json'); ap.add_argument('--out', default='reference/study/audio-events.json'); a = ap.parse_args()
tmp = os.path.join(tempfile.gettempdir(), 'ref-audio.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a.clip, '-vn', '-ac', '1', '-ar', '22050', tmp], check=True)
sr, x = wavfile.read(tmp); x = x.astype(np.float32) / 32768.0; dur = len(x) / sr
f, t, Z = stft(x, sr, nperseg=1024, noverlap=768); P = np.abs(Z) ** 2; hop = t[1] - t[0]
band = lambda lo, hi: P[(f >= lo) & (f < hi)].sum(0)
tot = P.sum(0) + 1e-12; voice = band(300, 3400); low = band(30, 200); high = band(4000, 11000)
db = 10 * np.log10(tot / tot.max() + 1e-12)
speech = (voice / tot > .55) & (db > -38)
# voice presence and the silent gaps between phrases (gaps of at least 0.25 s)
sm = np.convolve(speech.astype(float), np.ones(int(.12 / hop)), 'same') > 0
gaps, start = [], None
for i, v in enumerate(sm):
    if not v and start is None: start = i
    if v and start is not None:
        if (i - start) * hop >= .25: gaps.append((round(t[start], 2), round(t[i], 2)))
        start = None
# transients: positive flux of each band's log energy, peaks above median + k * MAD, only where speech is not the main thing
def events(env, name, k=6.0, mind=.15):
    e = np.log10(env + 1e-10); fl = np.maximum(0, np.diff(e, prepend=e[0])); fl = np.convolve(fl, np.ones(2) / 2, 'same')
    thr = np.median(fl) + k * (np.median(np.abs(fl - np.median(fl))) + 1e-9)
    pk, pr = find_peaks(fl, height=thr, distance=int(mind / hop)); out = []
    for i in pk: out.append({'t': round(float(t[i]), 2), 'band': name, 'strength': round(float(fl[i] / (thr + 1e-9)), 1), 'voice': bool(sm[i])})
    return out
ev = sorted(events(low, 'low-thump') + events(high, 'high-swish', 7.0), key=lambda e: e['t'])
# picture cuts from the per-frame histogram delta of the reference study (hard = a single huge spike, soft = a plateau of raised change)
cuts = []
try:
    m = json.load(open(a.motion, encoding='utf-8', errors='replace')); hd = np.array([r['histDelta'] for r in m]); tt = np.array([r['time'] for r in m])
    pk, _ = find_peaks(hd, height=max(.2, np.percentile(hd, 99.5)), distance=15); cuts = [round(float(tt[i]), 2) for i in pk]
except Exception as e:
    print('motion not read:', e)
near = lambda c: [e for e in ev if abs(e['t'] - c) <= .3]
aligned = [{'cut': c, 'events': [(e['t'], e['band']) for e in near(c)]} for c in cuts]
res = {'clip': os.path.basename(a.clip), 'seconds': round(dur, 2), 'voiceShare': round(float(sm.mean()), 3), 'gaps': gaps, 'gapCount': len(gaps), 'events': ev, 'eventCount': len(ev), 'eventsPerMin': round(len(ev) / dur * 60, 1),
       'cuts': cuts, 'cutsWithSound': sum(1 for c in aligned if c['events']), 'aligned': aligned,
       'loudnessSpread': {'p10': round(float(np.percentile(db, 10)), 1), 'p50': round(float(np.percentile(db, 50)), 1), 'p90': round(float(np.percentile(db, 90)), 1)}}
os.makedirs(os.path.dirname(a.out) or '.', exist_ok=True); json.dump(res, open(a.out, 'w', encoding='utf-8'), indent=1)
print(f"{res['clip']}: {res['seconds']} s, voice present {res['voiceShare']*100:.0f}% of the time, {res['gapCount']} phrase gaps >=0.25 s")
print(f"transient events {res['eventCount']} ({res['eventsPerMin']}/min): thumps {sum(1 for e in ev if e['band']=='low-thump')}, swishes/dings {sum(1 for e in ev if e['band']=='high-swish')}, of them over silence of voice {sum(1 for e in ev if not e['voice'])}")
print(f"picture cuts found {len(cuts)}; with a sound event within 0.3 s: {res['cutsWithSound']}")
print('events (first 40):', [(e['t'], e['band'][:3], e['strength']) for e in ev[:40]])

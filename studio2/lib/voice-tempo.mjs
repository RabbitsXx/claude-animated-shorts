// How much the narration take is sped up to meet the film's length target (never slowed, at most 1.18).
// film.json voiceTargetSeconds sets the target; films without it keep the original 64 s target.
export const voiceTempo=(rawSeconds,film={})=>Math.min(1.18,Math.max(1,rawSeconds/(film.voiceTargetSeconds||64)));

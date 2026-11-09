// Judging how far the ducked score sits under the narration (studio2/mixcheck.mjs measures it with ffmpeg).
export const MUSIC_RANGE_DB=[8.5,15];
export function judgeMusicDistance(db){
 const [lo,hi]=MUSIC_RANGE_DB;
 if(db<lo)return {ok:false,message:`music is only ${db.toFixed(1)} dB under the voice: too loud (aim 10-13 dB); lower scoreVolume in cues.mjs`};
 if(db>hi)return {ok:false,message:`music is ${db.toFixed(1)} dB under the voice: too quiet (aim 10-13 dB); raise scoreVolume in cues.mjs`};
 return {ok:true,message:`music is ${db.toFixed(1)} dB under the voice: fine`};
}
export function parseIntegrated(text){const m=[...String(text).matchAll(/I:\s+(-?\d+(?:\.\d+)?)\s+LUFS/g)];return m.length?parseFloat(m[m.length-1][1]):null;}

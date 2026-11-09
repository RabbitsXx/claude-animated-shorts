// Free, local, original sound effects made with FFmpeg's lavfi generators (noise, sine, sweeps). No API, no samples.
// usage in an episode's audio/cues.mjs:  const wav=synth('snap')   // returns the path of audio/synth/snap.wav (made on first use)
// The recipes are simple on purpose; they give a film its own sonic identity (clicks and beeps for a reflex film, hums for a
// machine film). Add a recipe here when a topic needs a new sound. Nobody has listened to them unless the user says so.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const N=(d,c,a)=>`anoisesrc=d=${d}:c=${c}:a=${a}:r=48000`,S=(f,d)=>`sine=f=${f}:d=${d}:r=48000`;
export const RECIPES={
 click:{inputs:[N('.04','white','.9')],fc:'[0]highpass=f=1800,afade=t=out:st=.005:d=.035'},
 snap:{inputs:[N('.14','white','.7'),S(2200,'.14')],fc:'[0][1]amix=inputs=2:normalize=0,highpass=f=1200,afade=t=out:st=.01:d=.13,volume=1.2'},
 beep:{inputs:[S(1320,'.14')],fc:'[0]afade=t=in:d=.01,afade=t=out:st=.1:d=.04,volume=.8'},
 'beep-low':{inputs:[S(660,'.2')],fc:'[0]afade=t=in:d=.01,afade=t=out:st=.14:d=.06,volume=.8'},
 tick:{inputs:[N('.02','white','.8')],fc:'[0]highpass=f=3500,afade=t=out:st=.002:d=.018'},
 crash:{inputs:[N('.7','pink','.9'),S(180,'.7')],fc:"[0][1]amix=inputs=2:normalize=0,bandpass=f=900:w=2600,afade=t=out:st=.05:d=.65,volume=1.5"},
 boom:{inputs:[S(48,'.9'),N('.9','brown','.8')],fc:"[0][1]amix=inputs=2:normalize=0,lowpass=f=240,afade=t=out:st=.05:d=.85,volume=1.8"},
 clank:{inputs:[S(1900,'.25'),S(2870,'.25'),N('.25','white','.3')],fc:"[0][1][2]amix=inputs=3:normalize=0,afade=t=out:st=.01:d=.24,volume=.9"},
 thump:{inputs:[S(70,'.5')],fc:'[0]afade=t=out:st=.02:d=.48,volume=1.6'},
 'sweep-up':{inputs:["aevalsrc='0.6*sin(2*PI*(300*t+800*t*t))':d=.8:s=48000"],fc:'[0]afade=t=in:d=.05,afade=t=out:st=.5:d=.3'},
 whoosh:{inputs:[N('.55','pink','.8')],fc:'[0]bandpass=f=1400:w=2200,afade=t=in:d=.18,afade=t=out:st=.22:d=.33'},
 whoomp:{inputs:[N('.4','brown','1')],fc:'[0]lowpass=f=900,afade=t=in:d=.1,afade=t=out:st=.14:d=.26,volume=1.4'},
 bell:{inputs:[S(1760,'.7'),S(2640,'.7')],fc:'[0][1]amix=inputs=2:normalize=0,afade=t=out:st=.02:d=.68,volume=.7'},
 'crowd-murmur':{inputs:[N('10','brown','.6')],fc:'[0]lowpass=f=700,highpass=f=120,tremolo=f=3:d=.4,volume=1.2'},
 'crowd-cheer':{inputs:[N('2.8','pink','.8')],fc:'[0]bandpass=f=1800:w=2400,tremolo=f=7:d=.5,afade=t=in:d=.4,afade=t=out:st=1.7:d=1.1'},
 'crowd-gasp':{inputs:[N('1.0','pink','.8')],fc:'[0]bandpass=f=1500:w=1800,afade=t=in:d=.12,afade=t=out:st=.25:d=.75'},
 'night-ambience':{inputs:[N('10','brown','.4')],fc:'[0]lowpass=f=320,volume=1.4'},
 creak:{inputs:[S(120,'.9'),N('.9','pink','.25')],fc:"[0]vibrato=f=7:d=.4,volume=.5[a];[1]bandpass=f=900:w=600,afade=t=out:st=.2:d=.7,volume=.35[b];[a][b]amix=inputs=2:normalize=0"},
 groan:{inputs:[S(70,'1.4'),S(140,'1.4')],fc:"[0][1]amix=inputs=2:normalize=0,vibrato=f=3:d=.5,afade=t=in:d=.15,afade=t=out:st=.7:d=.6,volume=.9"},
 splash:{inputs:[N('.9','white','.8'),S(90,'.9')],fc:"[0]lowpass=f=4200,highpass=f=300,afade=t=out:st=.05:d=.85,volume=1.3[a];[1]afade=t=out:st=.05:d=.8,volume=.6[b];[a][b]amix=inputs=2:normalize=0"},
 rain:{inputs:[N('10','pink','.55')],fc:'[0]highpass=f=1200,lowpass=f=6800,tremolo=f=2:d=.15,volume=1.1'},
 wind:{inputs:[N('10','brown','.5')],fc:'[0]lowpass=f=420,tremolo=f=.4:d=.5,volume=1.3'},
 ding:{inputs:[S(1180,'.8'),S(1770,'.8')],fc:'[0][1]amix=inputs=2:normalize=0,afade=t=out:st=.02:d=.75,volume=.5'},
 clunk:{inputs:[S(190,'.18'),N('.18','brown','.7')],fc:"[0][1]amix=inputs=2:normalize=0,lowpass=f=700,afade=t=out:st=.01:d=.17,volume=1.7"},
 splat:{inputs:[N('.22','pink','.9'),S(140,'.22')],fc:"[0][1]amix=inputs=2:normalize=0,lowpass=f=1800,afade=t=in:d=.005,afade=t=out:st=.03:d=.19,volume=1.5"},
 'score-pulse':{inputs:[S(55,'64'),N('64','white','.3'),S(220,'64')],fc:'[0]apulsator=hz=2:amount=1,volume=.9[b];[1]highpass=f=7000,apulsator=hz=8:amount=1,volume=.25[h];[2]tremolo=f=.5:d=.6,volume=.12[p];[b][h][p]amix=inputs=3:normalize=0'},
};
export function makeSynth(dir){
 fs.mkdirSync(dir,{recursive:true});
 return (name)=>{
  const r=RECIPES[name];if(!r)throw Error('no synth recipe '+name+' (add it to studio2/lib/synth.mjs)');
  const out=path.join(dir,name+'.wav');if(fs.existsSync(out))return out;
  const z=(x)=>x.replace(/(^|[^\d])\.(\d)/g,(m,a,b)=>a+'0.'+b); // FFmpeg wants a leading zero (.01 -> 0.01)
  execFileSync('ffmpeg',['-y','-v','error',...r.inputs.flatMap(i=>['-f','lavfi','-i',z(i)]),'-filter_complex',z(r.fc),'-ar','48000','-ac','2','-c:a','pcm_s16le',out],{stdio:'inherit'});
  return out;
 };
}

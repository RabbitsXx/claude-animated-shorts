// Sound design for "Why a Skyscraper Hangs a Giant Golden Ball": the voice first (16 paragraphs placed on their beats by film.json voiceGaps), a low instrumental score under it
// with the style change at night, the studio baseline in assets/sfx and this film's six own effects (pt-*, ElevenLabs, see approvals.json 'spend').
// Times are beat starts of scene2/main.mjs: A = [0,3.2,6.4,9.4,13.2,17,21,23.5,29,32,36.4,40.6,46.4,52,56,60,63.5]. Nobody has listened to this mix unless the owner says so.
import fs from 'node:fs';
import path from 'node:path';
export default async function({T,duration,synth,ep,ROOT}){
 const pick=(file,fallback)=>fs.existsSync(file)?file:synth(fallback);
 const B=(id,fb='click')=>pick(path.join(ROOT,'assets/sfx',id+'.wav'),fb);
 const F=(id,fb='thump')=>pick(path.join(ep,'audio',id+'.wav'),fb);
 const cues=[
  // 1 (0-3.2): the crane groans, the ball swings into the wall (2.1), the pigeon faints
  [F('pt-winch-groan','whoosh'),.1,.55,3],[F('pt-ball-bonk','thump'),2.05,.85,2],[B('pop-cartoon','tick'),2.5,.25],
  // 2 (3.2-6.4): pull-back whoosh, Rex mimes the violin
  [B('whoosh-soft','whoosh'),3.3,.3],[B('boing','tick'),5.6,.22],
  // 3 (6.4-9.4): the empty wallet, a fly buzzes out, sad note
  [B('sad-wah','beep-low'),7.7,.25],
  // 4 (9.4-13.2): Rex runs the board and dives (11.6), the splash
  [B('wood-clunk','thump'),10.2,.22],[F('pt-pool-wave','splat'),11.9,.5,3],[B('crowd-laugh','crowd-cheer'),12.3,.18],
  // 5 (13.2-17, night): the gale, the ball bangs about, the dummy is flung (14.35)
  [F('pt-gale','wind'),13.2,.6,4],[F('pt-pendulum-creak','whoosh'),13.8,.45,3],[B('impact-heavy','thump'),14.35,.5],[B('pans-crash','click'),15.0,.22],
  // 6 (17-21): Pete drills through the floor (17-18.9), the plug falls, the rope runs out
  [F('pt-drill','whoosh'),17.1,.55,2],[B('thud-soft','thump'),18.9,.4],[F('pt-winch-groan','whoosh'),19.0,.4,2.4],
  // 7 (21-23.5): the I THINK sign flips
  [B('chime-reveal','ding'),22.3,.22],[B('boing','tick'),22.35,.2],
  // 8 (23.5-29): Rex cranks the winch, the ball sinks and settles into a slow swing
  [F('pt-winch-groan','whoosh'),23.6,.55,3],[B('metal-clank','click'),25.2,.2],[F('pt-pendulum-creak','whoosh'),26.3,.5,3],[B('chime-reveal','ding'),28.6,.2],
  // 9 (29-32): bright morning, the crowd
  [B('crowd-murmur-loop','crowd-cheer'),29.0,.2,3],[B('whoosh-soft','whoosh'),29.1,.25],
  // 10 (32-36.4): the lifts rise, the first gust
  [B('whoosh-soft','whoosh'),32.2,.25],[B('metal-clank','click'),33.5,.18],[F('pt-gale','wind'),35.2,.4,3],
  // 11 (36.4-40.6): the tower leans, the ball swings, dread
  [B('heartbeat-slow','thud'),37.0,.5,3.5],[F('pt-pendulum-creak','whoosh'),37.4,.45,3],
  // 12 (40.6-46.4): the swing stops dead (43.0), the reveal chime
  [B('boing','tick'),42.7,.25],[B('pop-cartoon','tick'),43.1,.3],[B('chime-reveal','ding'),44.4,.4],
  // 13 (46.4-52): the ghost replay: the dummy flung, then landed softly
  [B('whoosh-fast','whoosh'),46.9,.3],[B('impact-heavy','thump'),47.6,.35],[B('chime-reveal','ding'),50.1,.3],
  // 14 (52-56): the coffee does not spill, a sip
  [B('glass-clink','click'),54.2,.3],[B('pop-cartoon','tick'),55.2,.25],
  // 15 (56-60): Rex's tower sways, the pool slops over the roof, the crowd gasps
  [F('pt-gale','wind'),56.0,.45,4],[B('crowd-gasp','crowd-gasp'),57.0,.45],[F('pt-pool-wave','splat'),58.6,.65,3],
  // 16 (60-63.5): Rex, soaked: a sad note, a ding
  [B('sad-wah','beep-low'),60.9,.3],[B('bell-ding','ding'),Math.min(duration-.7,62.8),.3],
 ];
 const score=path.join(ep,'audio/score.wav'),night=path.join(ROOT,'assets/sfx/ambience-night-loop.wav'),day=path.join(ROOT,'assets/sfx/ambience-day-loop.wav');
 return {cues,score:fs.existsSync(score)?score:synth('score-pulse'),ambience:fs.existsSync(day)?day:synth('wind'),scoreVolume:1.35,ambVolume:.18,duck:{threshold:.05,ratio:3.5}};
}

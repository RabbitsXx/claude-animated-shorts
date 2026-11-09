// Cast of "What If You Could Stop Time for One Hour?" (carried over from the spending film; the costumes below are new). Look preset 'ref' (flat, thick outline, stick limbs, round expressive face).
// The winner: warm yellow shirt, jeans, a messy tuft; the banker: grey suit, tie, glasses, slicked grey hair.
export const WINNER={name:'winner',scale:1.12,skin:'#fffdf4',outfit:'overalls',shirt:'#efb62a',emblem:'#f6c63a',symbol:'$',pants:'#6f9fd4',hairStyle:'tuft',hair:'#3a2a22'};
export const BANKER={name:'banker',scale:1.16,skin:'#fffdf4',outfit:'suit',jacket:'#59616e',shirt:'#f4f6f8',pants:'#3f4652',suitTie:'#b3362c',hairStyle:'slick',hair:'#80868f',faceSpec:{glasses:true}};
// Townsfolk for the pizza party and the crowds: four variants with flat 2.5D hair, painted tees, different colours and heights.
export const CROWD=[
 {name:'crowd0',skin:'#fffdf4',shirt:'#e8584a',pants:'#4a525e',hairStyle:'fringe',hair:'#3a2a22',scale:1.07},
 {name:'crowd1',skin:'#fffdf4',shirt:'#4aa3df',pants:'#3f6fb5',hairStyle:'bob',hair:'#6b3b2a',scale:1.12},
 {name:'crowd2',skin:'#fffdf4',shirt:'#9b7bd1',pants:'#6d4a2b',hairStyle:'curly',hair:'#2b2b33',scale:1.16},
 {name:'crowd3',skin:'#fffdf4',shirt:'#f0a23a',pants:'#2f5d50',hairStyle:'bun',hair:'#8a5a2a',scale:1.03},
];

// stop-time-hour: the late office worker (our rig and tuft, new costume: white shirt, teal tie, dark trousers), the boss and the rival.
export const WORKER={name:'worker',scale:1.12,skin:'#fffdf4',outfit:'suit',jacket:'#eef2f6',shirt:'#eef2f6',pants:'#3b4252',suitTie:'#1f9aa6',hairStyle:'tuft',hair:'#3a2a22'};
export const BOSS={name:'boss',scale:1.16,skin:'#fffdf4',outfit:'suit',jacket:'#59616e',shirt:'#f4f6f8',pants:'#3f4652',suitTie:'#b3362c',hairStyle:'slick',hair:'#80868f',faceSpec:{glasses:true}};
export const RIVAL={name:'rival',scale:1.1,skin:'#fffdf4',outfit:'suit',jacket:'#2f3a4a',shirt:'#f4f6f8',pants:'#2a2f3a',suitTie:'#2f9e5a',hairStyle:'fringe',hair:'#2b2b33'};

// double-weight-hourly: Milo the courier (orange top, blue overalls, tuft), Vince the rival courier (teal cap and top, fringe), the bride and groom and guests. Bold colours on purpose (reference median saturation .47).
export const MILO={name:'milo',scale:1.1,skin:'#fffdf4',outfit:'overalls',shirt:'#ff8a1f',emblem:'#ffd23a',symbol:'M',pants:'#1f6fd0',hairStyle:'tuft',hair:'#7a4a2a'};
export const VINCE={name:'vince',scale:1.14,skin:'#fffdf4',outfit:'overalls',shirt:'#12b5a5',emblem:'#ffffff',symbol:'V',pants:'#2b2f3a',hairStyle:'fringe',hair:'#2b2b33',cap:'#12b5a5'};
export const BRIDE={name:'bride',scale:1.06,skin:'#fffdf4',outfit:'suit',jacket:'#ffffff',shirt:'#ffffff',pants:'#f4f4f8',suitTie:'#ff5a8a',hairStyle:'bun',hair:'#6b3b2a'};
export const GROOM={name:'groom',scale:1.15,skin:'#fffdf4',outfit:'suit',jacket:'#27324a',shirt:'#ffffff',pants:'#1c2434',suitTie:'#ff5a8a',hairStyle:'slick',hair:'#2b2b33'};

// pendulum-tower: Pete the tower owner (red cap, yellow shirt, blue overalls) and Rex the rival (slick dark hair, plum jacket by day, pale suit on opening day). Same rig and face as the passed heroes.
export const PETE={name:'pete',scale:1.1,skin:'#fffdf4',outfit:'overalls',shirt:'#fff1c9',emblem:'#e8312a',symbol:'P',pants:'#2a6fd0',hairStyle:'bald',hair:'#7a4a2a',cap:'#e8312a'};
export const REX={name:'rex',scale:1.16,skin:'#fffdf4',outfit:'suit',jacket:'#7b2d7e',shirt:'#fbf6ee',pants:'#2a2433',suitTie:'#e0a82e',hairStyle:'slick',hair:'#1c1c24'};
export const REX_SUIT={...REX,name:'rex-suit',jacket:'#efe9db',pants:'#d9d2c2',suitTie:'#c8322b'};

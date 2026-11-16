import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {Window} from 'happy-dom';
import {transportPose,launchPose} from '../src2d/scene-motion.js';
import {viewportSize,canvasPoint,clampZoom} from '../src2d/camera-view.js';
import {SOUND_CUES,synthesizeCue,GameAudio} from '../src2d/audio.js';
import {GLYPHS,uiIcon} from '../src2d/ui-icons.js';
import {NoticeCenter,noticeCopy} from '../src2d/notices.js';
import {Renderer} from '../src2d/renderer.js';
import {drawPrologue} from '../src2d/prologue.js';
import {createState,Simulation} from '../src2d/simulation.js';

test('transport remains on its returned ground, moves forward, brakes and ends at the training centre across 4,242 poses',()=>{
 for(const w of [280,320,390,519,640,683,880])for(const floor of [160,240,425,600,850,1000]){
  let previous=-Infinity;for(let n=0;n<=100;n++){const pose=transportPose(w,floor,n/100);assert.equal(pose.y,floor);assert.ok(pose.x>=previous);assert.ok(pose.x>=w*.13-1e-8&&pose.x<=w*.66+1e-8);assert.ok(pose.door>=0&&pose.door<=1);previous=pose.x;}assert.equal(transportPose(w,floor,.8).x,transportPose(w,floor,1).x);
 }
});
test('launch motion is monotonic, has a real ignition interval and controlled camera follow across 4,008 poses',()=>{
 for(const h of [120,180,240,360,425,600,850,1200]){let old=0;for(let n=0;n<=500;n++){const p=launchPose(n/500,h);assert.ok(p.rise>=old);assert.ok(p.screenRise>=0&&p.follow<=p.rise);assert.ok(p.throttle>=0&&p.throttle<=1);assert.ok(Math.abs(p.shake)<1);old=p.rise;}assert.equal(launchPose(0,h).rise,0);assert.equal(launchPose(.1,h).rise,0);assert.ok(launchPose(1,h).rise>h);}
});
test('zoom retains screen aspect and maps 9,600 client points back to the exact intended world point',()=>{
 let points=0;for(const[w,h]of[[320,740],[390,844],[844,390],[640,360],[1280,720],[1366,850],[1920,1080],[2560,1440]])for(const zoom of [.75,1,1.25,1.5,1.75,2]){
  const size=viewportSize(w,h,zoom);assert.ok(Math.abs(size.width/size.height-w/h)<.015);assert.ok(size.width>0&&size.height>0);
  const canvas={...size,getBoundingClientRect:()=>({left:13,top:29,width:w,height:h})};
  for(let i=0;i<200;i++){const x=(i*97%size.width)+.125,y=(i*53%size.height)+.25,p=canvasPoint(canvas,13+x/size.width*w,29+y/size.height*h);assert.ok(Math.abs(p.x-x)<1e-8);assert.ok(Math.abs(p.y-y)<1e-8);points++;}
 }assert.equal(points,9600);assert.equal(clampZoom(-100),.75);assert.equal(clampZoom(999),2);assert.equal(clampZoom(NaN),1);
});
test('all 16 original sound cues render bounded finite, non-silent, distinct samples at three sample rates',()=>{
 assert.equal(Object.keys(SOUND_CUES).length,16);
 for(const rate of [8000,22050,48000]){const fingerprints=new Set();for(const kind of Object.keys(SOUND_CUES)){const data=synthesizeCue(kind,rate);assert.ok(data.length>=rate*.08);assert.ok(data.some(x=>Math.abs(x)>.005));assert.ok(data.every(x=>Number.isFinite(x)&&Math.abs(x)<.75));fingerprints.add(createHash('sha256').update(Buffer.from(data.buffer)).digest('hex'));assert.deepEqual(data,synthesizeCue(kind,rate));}assert.equal(fingerprints.size,16);}
});
test('audio is gesture-unlocked once, limits concurrent sounds, reuses buffers and releases loop nodes',()=>{
 let calls=0,closed=false,disconnected=0;const sources=[];const context={sampleRate:8000,currentTime:0,state:'running',destination:{},createGain(){return{gain:{value:0,setTargetAtTime(){}},connect(){return this;},disconnect(){disconnected++;}};},createBuffer(channels,length){return{data:new Float32Array(length),copyToChannel(data){this.data.set(data);}};},createBufferSource(){const source={connect(){return this;},disconnect(){disconnected++;},start(){},stop(){},onended:null};sources.push(source);return source;},close(){closed=true;}};
 const audio=new GameAudio({contextFactory:()=>{calls++;return context;}});assert.equal(audio.play('jump'),false);audio.unlock();audio.unlock();assert.equal(calls,1);
 for(let i=0;i<25;i++){context.currentTime+=.2;audio.play('jump');}assert.equal(audio.stats().voices,12);assert.equal(audio.stats().buffers,1);for(const voice of [...audio.voices])voice.onended();assert.equal(audio.stats().voices,0);
 audio.loop('car',.5);audio.loop('car',.6);assert.equal(audio.stats().loops,1);audio.setMuted(true);assert.equal(audio.stats().loops,0);assert.equal(audio.play('jump'),false);audio.setMuted(false);audio.loop('launch',.7);audio.stopLoops();assert.equal(audio.stats().loops,0);audio.dispose();assert.ok(closed);assert.ok(disconnected>=12);
});
test('32 SVG glyphs have accessible, font-independent shapes and notice cards preserve full detail',()=>{
 const old={window:globalThis.window,document:globalThis.document};const w=new Window();Object.assign(globalThis,{window:w,document:w.document});try{
 assert.ok(Object.keys(GLYPHS).length>=30);for(const kind of Object.keys(GLYPHS)){const glyph=uiIcon(kind);assert.equal(glyph.getAttribute('viewBox'),'0 0 24 24');assert.equal(glyph.getAttribute('aria-hidden'),'true');assert.ok(glyph.querySelector('path').getAttribute('d').length>=8);}
 const node=w.document.createElement('div');w.document.body.append(node);const notices=new NoticeCenter(node);notices.push('Panel solar I fabricado. Está en la mochila: elige dónde colocarlo.',[{key:'energy',delta:-5}]);assert.equal(node.querySelectorAll('.notice-glyph svg').length,1);assert.match(node.textContent,/−5/);assert.ok(node.dataset.fullText.includes('mochila'));notices.push('Panel solar I fabricado. Está en la mochila: elige dónde colocarlo.');assert.match(node.textContent,/×2/);notices.hide();assert.ok(node.classList.contains('hidden'));assert.equal(noticeCopy('★ Medalla: Explorador').kind,'reward');
 }finally{w.happyDOM.abort();for(const[k,v]of Object.entries(old))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
});
test('renderer draws transport, launch, Moon/Mars LAB signs and every zoom with no unbounded chunk growth',async()=>{
 const old={window:globalThis.window,document:globalThis.document};const art={human:await loadImage('assets/pixel/humans/astro.png')};Object.assign(globalThis,{window:{innerWidth:1280,innerHeight:720},document:{createElement:()=>createCanvas(1,1)}});
 try{const r=new Renderer(createCanvas(640,360),art),sim=new Simulation(createState({},134));for(const t of [21,22,25,28,29.5])drawPrologue(r,sim.s.profile,t);for(const t of [10,11.5,12,12.3,14,16.9,17,18.9])r.cinematic(sim.s.profile,t,'moon');
 for(const planet of ['moon','mars']){sim.s.flags.marsUnlocked=true;if(planet==='mars')sim.arriveMars();r.setZoomEnabled(true);for(const zoom of [.75,1,1.25,1.5,1.75,2]){r.setZoom(zoom);r.render(sim,20);assert.ok(r.chunks.size<=112);assert.ok(r.ctx.getImageData(0,0,r.width,r.height).data.some(v=>v));}r.setZoomEnabled(false);assert.equal(r.width,640);}
 }finally{for(const[k,v]of Object.entries(old))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
});

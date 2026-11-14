import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {AstronautAnimator} from '../src2d/animation.js';
import {drawEnginePlume,landingDust,PixelParticles,smokeSprite} from '../src2d/effects.js';
import {treeSprite} from '../src2d/decor.js';
import {humanSprite} from '../src2d/human.js';
import {Simulation,createState,restoreState} from '../src2d/simulation.js';
import {solarPhase,radiationTransmission} from '../src2d/life-support.js';
import {UNIT} from '../src2d/world.js';

async function canvasFixture(){const original=globalThis.document;globalThis.document={createElement:()=>createCanvas(32,34)};return{art:{human:await loadImage('assets/pixel/humans/astro.png')},done(){if(original===undefined)delete globalThis.document;else globalThis.document=original;}};}
const tick=(s,n)=>{for(let i=0;i<n;i++)s.tick(1/60);};
function connectedFraction(canvas){const {width:w,height:h}=canvas,d=canvas.getContext('2d').getImageData(0,0,w,h).data,seen=new Set(),sizes=[];for(let i=0;i<w*h;i++){if(!d[i*4+3]||seen.has(i))continue;const q=[i];seen.add(i);for(let j=0;j<q.length;j++){const n=q[j],x=n%w,y=Math.floor(n/w);for(const[xx,yy]of[[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const a=yy*w+xx;if(xx>=0&&xx<w&&yy>=0&&yy<h&&d[a*4+3]&&!seen.has(a)){seen.add(a);q.push(a);}}}sizes.push(q.length);}return Math.max(...sizes)/seen.size;}

test('walking cycle follows distance rather than render FPS, and idling never advances the feet',()=>{
 const poses=[];for(const fps of[30,60,144]){const a=new AstronautAnimator(),p={x:0,vx:46,vy:0,grounded:true};a.update(0,p);for(let i=0;i<fps*2;i++){p.x+=46/fps;a.update(1/fps,p);}poses.push(a.pose().frame);p.vx=0;const d=a.distance;for(let i=0;i<fps*7;i++)a.update(1/fps,p);assert.equal(a.state,'idle');assert.equal(a.distance,d);assert.ok([0,1].includes(a.pose().frame));}assert.equal(new Set(poses).size,1);
});
test('rising, falling, boosting and landing have distinct states, and a landing settles to idle',()=>{
 const a=new AstronautAnimator(),p={x:0,vx:0,vy:0,grounded:true};a.update(.016,p);p.grounded=false;p.vy=-40;a.update(.016,p);assert.equal(a.state,'jump');p.vy=12;a.update(.016,p);assert.equal(a.state,'fall');a.update(.016,p,{boost:true});assert.equal(a.state,'boost');p.grounded=true;a.update(.016,p);assert.equal(a.state,'land');for(let i=0;i<20;i++)a.update(.016,p);assert.equal(a.state,'idle');
});
test('every authored and airborne pose keeps the complete human silhouette connected',async()=>{
 const f=await canvasFixture();try{const images=[];for(const frame of[0,1,2,9,10,17,'jump0','jump1','fall0','fall1','boost0','boost1','land0','land1']){const c=humanSprite(f.art,createState().profile,frame);assert.ok(connectedFraction(c)>.96,'detached limb in '+frame);images.push(c.toBuffer('image/png').toString('base64'));}assert.ok(new Set(images).size>=10,'states must have distinct visible poses');}finally{f.done();}
});
test('forest trees have exposed narrow bark, broad broken crowns and stable cached variants',async()=>{
 const f=await canvasFixture();try{const silhouettes=[];for(let v=0;v<4;v++){const c=treeSprite(v);assert.equal(treeSprite(v),c);const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let green=0,bark=0;for(let i=0;i<d.length;i+=4){assert.ok(d[i+3]===0||d[i+3]===255);if(!d[i+3])continue;if(d[i+1]>d[i]*1.2&&d[i+1]>d[i+2]*1.2)green++;if(d[i]>d[i+1]*1.15)bark++;}assert.ok(green>900);assert.ok(bark>500);const row=140*c.width;let solid=0;for(let x=0;x<c.width;x++)if(d[(row+x)*4+3])solid++;assert.ok(solid>=7&&solid<20,'trunk must be exposed, not a foliage blob');silhouettes.push(c.toBuffer('image/png').toString('base64'));}assert.equal(new Set(silhouettes).size,4);}finally{f.done();}
});
test('smoke has irregular layered sprites and vacuum exhaust never draws atmospheric smoke',async()=>{
 const f=await canvasFixture();try{const c=createCanvas(240,180),real=c.getContext('2d');let images=0;const proxy=new Proxy(real,{get(t,k){if(k==='drawImage')return(...args)=>{images++;return t.drawImage(...args);};const v=Reflect.get(t,k,t);return typeof v==='function'?v.bind(t):v;},set(t,k,v){return Reflect.set(t,k,v,t);}});drawEnginePlume(proxy,{x:120,y:50,time:14,power:1,vacuum:true});assert.equal(images,0);drawEnginePlume(proxy,{x:120,y:50,time:14,power:1,ground:160});assert.ok(images>=50);const puff=smokeSprite(1,2),data=puff.getContext('2d').getImageData(0,0,32,32).data;let opaque=0;const colors=new Set();for(let i=0;i<data.length;i+=4)if(data[i+3]){opaque++;colors.add(data.slice(i,i+3).toString());}assert.ok(opaque>250&&opaque<850);assert.ok(colors.size>3);assert.equal(puff,smokeSprite(1,2));}finally{f.done();}
});
test('lunar and Martian landing grains fall under their different gravities and stay above ground',()=>{
 const moon=landingDust(5,{x:100,floor:180,planet:'moon'}),mars=landingDust(5,{x:100,floor:180,planet:'mars'});assert.ok(moon.length>10);assert.ok(mars.length>5);let matches=0;for(const m of mars){assert.ok(m.y<=180);const l=moon.find(p=>p.x===m.x);if(l){assert.ok(m.y>=l.y);matches++;}}assert.ok(matches>5);
});
test('particle bursts stay bounded under stress and expire without leaking into another world',()=>{
 const fx=new PixelParticles(96),sim=new Simulation();fx.update(0,sim);for(let i=0;i<12000;i++)fx.burst(900,200,16,i);assert.equal(fx.items.length,96);for(let i=1;i<180;i++)fx.update(i/60,sim);assert.equal(fx.items.length,0);fx.burst(900,200,20,4);sim.s.flags.marsUnlocked=true;sim.arriveMars();fx.update(4,sim);assert.equal(fx.items.length,0);
});
test('a crop charges finite water/energy/seeds, pauses without electricity and yields only once',()=>{
 const sim=new Simulation();sim.s.flags.baseOnline=true;sim.s.player.x=39*UNIT;const r={...sim.s.resources},seeds=sim.s.support.seeds,rations=sim.s.inventory.rations;assert.equal(sim.manageHabitat('grow').ok,true);assert.equal(sim.s.resources.water,r.water-6);assert.equal(sim.s.resources.energy,r.energy-4);assert.equal(sim.s.support.seeds,seeds-1);assert.equal(sim.manageHabitat('grow').ok,false);const remaining=sim.s.support.crops.moon.remaining;sim.s.resources.energy=0;tick(sim,180);assert.equal(sim.s.support.crops.moon.remaining,remaining);sim.s.resources.energy=20;tick(sim,720);assert.equal(sim.s.support.crops.moon,null);assert.equal(sim.s.inventory.rations,rations+1);assert.ok(sim.s.resources.energy<20);tick(sim,120);assert.equal(sim.s.inventory.rations,rations+1);sim.s.support.seeds=0;assert.equal(sim.manageHabitat('grow').ok,false);
});
test('shielding costs materials once, only at the habitat, and reduces exposure without immunity',()=>{
 const sim=new Simulation();sim.s.flags.baseOnline=true;sim.s.inventory.regolith=8;sim.s.inventory.iron=2;sim.s.player.x=60*UNIT;assert.equal(sim.manageHabitat('shield').ok,false);sim.s.player.x=39*UNIT;const base=radiationTransmission(sim.s,true);assert.equal(sim.manageHabitat('shield').ok,true);assert.equal(sim.s.inventory.regolith,0);assert.equal(sim.s.inventory.iron,0);assert.equal(sim.manageHabitat('shield').ok,false);assert.ok(radiationTransmission(sim.s,true)>0);assert.ok(radiationTransmission(sim.s,true)<base);assert.equal(radiationTransmission(sim.s,false),1);
});
test('the solar training exercise warns before exposure, then shelter reduces cumulative consequences',()=>{
 assert.equal(solarPhase(90),'warning');assert.equal(solarPhase(114),'active');assert.equal(solarPhase(149),'clear');const outcomes=[];for(const mode of['outside','inside','reinforced']){const sim=new Simulation();sim.s.flags.baseOnline=true;sim.s.flags.solarOnline=true;if(mode==='outside'){sim.s.player.x=55*UNIT;sim.s.player.y=sim.world.groundY(55*UNIT)-34;}else sim.s.player.x=39*UNIT;sim.s.support.shield.moon=mode==='reinforced';sim.s.support.weather.moon={clock:89.9,phase:'quiet'};tick(sim,12);assert.equal(sim.s.support.weather.moon.phase,'warning');assert.equal(sim.s.support.exposure,0);tick(sim,3600);assert.equal(sim.s.support.weather.moon.phase,'clear');assert.ok(sim.s.log.some(x=>x.includes('SIMULACRO')));outcomes.push(sim.s.support.exposure);}assert.ok(outcomes[0]>outcomes[1]*3);assert.ok(outcomes[1]>outcomes[2]*5);assert.ok(outcomes[2]>0);
});
test('food use and crop state survive saving; old saves get safe defaults',()=>{
 const sim=new Simulation();sim.s.support.nutrition=40;const before=sim.s.inventory.rations;assert.equal(sim.eat(),true);assert.equal(sim.s.support.nutrition,70);assert.equal(sim.s.inventory.rations,before-1);sim.s.support.crops.moon={remaining:4.5};sim.s.support.weather.moon={clock:120,phase:'active'};const restored=restoreState(JSON.parse(JSON.stringify(sim.s)));assert.equal(restored.support.crops.moon.remaining,4.5);assert.equal(restored.support.weather.moon.phase,'active');assert.equal(restored.support.nutrition,70);delete sim.s.support;assert.equal(restoreState(sim.s).support.nutrition,85);const hostile=createState();hostile.support={nutrition:999,exposure:-20,seeds:999,weather:{moon:{clock:-10}},shield:{moon:'yes'}};const safe=restoreState(hostile).support;assert.equal(safe.nutrition,100);assert.equal(safe.exposure,0);assert.equal(safe.seeds,6);assert.equal(safe.shield.moon,false);
});
test('NASA support lessons link real official references and explicitly reject live or measured game values',()=>{
 const science=JSON.parse(readFileSync('data/pixel-science.json'));assert.equal(science.liveData,false);assert.equal(science.apiIntegration.enabled,false);assert.equal(science.simulationParameters.scientificMeasurements,false);for(const id of['donki','osdr-veg05','radiation-shelter','plants','lunar-exhaust']){const source=science.sources.find(s=>s.id===id);assert.ok(source,id);assert.ok(new URL(source.url).hostname.endsWith('nasa.gov'));}for(const fact of science.verifiedFacts)for(const id of fact.sourceIds)assert.ok(science.sources.some(s=>s.id===id),id);
});

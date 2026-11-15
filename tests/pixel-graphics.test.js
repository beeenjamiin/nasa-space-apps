import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {PixelWorld,surfaceAt,BLOCK,worldOptions} from '../src2d/world.js';
import {Simulation,createState,restoreState} from '../src2d/simulation.js';
import {exposedEdges,drawCaveWall} from '../src2d/geology-art.js';
import {geologyTile} from '../src2d/materials.js';
import {landscapeLayer,PARALLAX_SPEEDS} from '../src2d/planet-environment.js';
import {drawSurfaceDetails} from '../src2d/surface-details.js';
import {Cinematic,MOON_TIMELINE,EARTH_TIMELINE,cinemaDuration} from '../src2d/cinematic.js';
import {Renderer} from '../src2d/renderer.js';
import {cloudSprite} from '../src2d/earth-environment.js';
import {earthSprite} from '../src2d/earth-visuals.js';
import {MATERIALS} from '../src2d/block-materials.js';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const baseline={
 'moon-1':'467c577a08dc2ebd3bb8fef153637783bc2599bb00ab1acc02876c0cb279717b',
 'moon-2':'a4cddab728dd7d4cae7d4e9118dc280afec8370ba0e55053bd9132186c03de34',
 'moon-3':'0a349e2ace9b813ca96adc5b5a983227d87a4e89b7afe0e704cbafeca062f6a6',
 'mars-1':'99f0c6693f6a5ffce09139a59c9291cacc3360d845d94b1c0c095805a5afbdd0',
 'mars-2':'d2c07c542cb0d66538052475d57c4d349b2937df7dd759fe470cb5dd22cb62c5',
 'mars-3':'1bdb2e13bc8901d3e932b52f937bcb25e03eed37bb5b3f4250716206e8f1de5f'
};
function artDocument(){const old={document:globalThis.document,window:globalThis.window};let allocations=0;globalThis.document={createElement(){allocations++;return createCanvas(32,32);}};globalThis.window={innerWidth:1280,innerHeight:720};return{get allocations(){return allocations;},done(){for(const[k,v]of Object.entries(old))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}};}

test('legacy generators 1–3 retain exact terrain/ore/cave bytes for both planets',()=>{
 for(const planet of ['moon','mars'])for(const version of [1,2,3]){const w=new PixelWorld(planet,{}, {version,seed:134});assert.equal(digest(w.tiles),baseline[planet+'-'+version]);}
});
test('generation 4 is deterministic, changes distant geology and preserves the starter corridor',()=>{
 for(const planet of ['moon','mars'])for(const seed of [134,2026,0xffffffff]){
  const old=new PixelWorld(planet,{}, {version:3,seed}),a=new PixelWorld(planet,{}, {version:4,seed}),b=new PixelWorld(planet,{}, {version:4,seed});
  assert.deepEqual(a.tiles,b.tiles);assert.notDeepEqual(a.tiles,old.tiles);
  for(let x=0;x<220;x++)for(let y=0;y<172;y++)assert.equal(a.get(x,y),old.get(x,y));
  let differences=0;for(let x=260;x<630;x++){assert.ok(a.surfaceAt(x)>40&&a.surfaceAt(x)<100);if(a.surfaceAt(x)!==old.surfaceAt(x))differences++;}assert.ok(differences>150);
 }
 assert.notEqual(digest(new PixelWorld('moon',{}, {version:4,seed:134}).tiles),digest(new PixelWorld('mars',{}, {version:4,seed:134}).tiles));
});
test('generation 4 and legacy saves preserve edits, inventory, position and material provenance',()=>{
 for(const generation of [1,2,3,4]){
  const s=createState({},generation===1?null:134,generation);s.worldVersion=generation;
  const sim=new Simulation(s);sim.world.set(300,110,0);s.worlds.moon={...sim.world.edits};s.inventory.regolith=5;s.materials['moon-dust']=5;
  const loaded=new Simulation(restoreState(JSON.parse(JSON.stringify(s))));assert.equal(loaded.s.worldVersion,generation);assert.deepEqual(loaded.world.tiles,sim.world.tiles);assert.deepEqual(loaded.s.inventory,s.inventory);assert.deepEqual(loaded.s.materials,s.materials);assert.equal(loaded.s.player.x,s.player.x);
 }
});
test('autotile edge bits respond to actual neighbor occupancy and stay inside the tile',()=>{
 let air=new Set();const world={planet:'moon',get:(x,y)=>air.has(x+','+y)?0:2};
 assert.equal(exposedEdges(world,0,0),0);for(const [key,mask]of[['0,-1',1],['1,0',2],['0,1',4],['-1,0',8]]){air=new Set([key]);assert.equal(exposedEdges(world,0,0),mask);}
 const c=createCanvas(24,24),ctx=c.getContext('2d');geologyTile(ctx,2,8,8,0,0,world);const d=ctx.getImageData(0,0,24,24).data;
 for(let y=0;y<24;y++)for(let x=0;x<24;x++)if(x<8||x>=16||y<8||y>=16)assert.equal(d[(y*24+x)*4+3],0);
});
test('material textures are world-space deterministic, origin-specific and distinct by planet',()=>{
 const tile=(material,tx=38,ty=90)=>{const c=createCanvas(8,8);geologyTile(c.getContext('2d'),material.block,0,0,tx,ty,{planet:'mars',materialAt:()=>material,get:()=>material.block});return digest(c.toBuffer('image/png'));};
 assert.equal(tile(MATERIALS['moon-rock']),tile(MATERIALS['moon-rock']));assert.notEqual(tile(MATERIALS['moon-rock']),tile(MATERIALS['mars-rock']));
 const variants=new Set();for(let x=20;x<45;x++)variants.add(tile(MATERIALS['moon-rock'],x,91));assert.ok(variants.size>15);
 const c=createCanvas(16,8),ctx=c.getContext('2d');drawCaveWall(ctx,0,0,40,100,'moon',134);drawCaveWall(ctx,8,0,40,100,'mars',134);assert.notDeepEqual(ctx.getImageData(0,0,8,8).data,ctx.getImageData(8,0,8,8).data);
});
test('five parallax strips are cached, seamless at their wrap and planet-specific',()=>{
 const f=artDocument();try{assert.equal(new Set(PARALLAX_SPEEDS).size,5);assert.ok(PARALLAX_SPEEDS.every((v,i)=>i===0||v>PARALLAX_SPEEDS[i-1]));
  for(const planet of ['moon','mars'])for(let layer=0;layer<5;layer++){const a=landscapeLayer(planet,layer);assert.equal(a,landscapeLayer(planet,layer));assert.equal(a.width,1536);const ctx=a.getContext('2d'),first=ctx.getImageData(0,0,1,220).data,last=ctx.getImageData(1535,0,1,220).data;let alphaDifference=0;for(let i=3;i<first.length;i+=4)if(first[i]!==last[i])alphaDifference++;assert.ok(alphaDifference<4,'discontinuous wrap');}
  const count=f.allocations;for(let i=0;i<100;i++)landscapeLayer('moon',i%5);assert.equal(f.allocations,count);
 }finally{f.done();}
});
test('decorations, powered lights and render caches do not mutate game state or allocate each frame',async()=>{
 const f=artDocument();try{const art={human:await loadImage('assets/pixel/humans/astro.png')},c=createCanvas(640,360),r=new Renderer(c,art),s=new Simulation(createState({},134,4));s.s.player.x=2400;s.s.player.y=s.world.groundY(2400)-34;const before=JSON.stringify(s.s),tiles=digest(s.world.tiles);
  for(let i=0;i<12;i++)r.render(s,i/60);const count=f.allocations;for(let i=12;i<120;i++)r.render(s,i/60);assert.equal(f.allocations,count);assert.ok(r.chunks.size<=64);assert.equal(JSON.stringify(s.s),before);assert.equal(digest(s.world.tiles),tiles);drawSurfaceDetails(c.getContext('2d'),s.world,r.cam,640,360);assert.equal(digest(s.world.tiles),tiles);
 }finally{f.done();}
});
test('Earth art is cached and the existing travel phases/durations are unchanged',()=>{
 const f=artDocument();try{assert.equal(earthSprite(),earthSprite());assert.equal(cloudSprite(1),cloudSprite(1));assert.notEqual(digest(cloudSprite(1).toBuffer('image/png')),digest(cloudSprite(2).toBuffer('image/png')));
  assert.deepEqual(MOON_TIMELINE.map(x=>x[0]),['walk','elevator','bridge','countdown','launch','separation','orbit','transfer','landing']);assert.deepEqual(EARTH_TIMELINE.map(x=>x[0]),['launch','orbit','transfer','reentry','landing']);assert.deepEqual(['moon','mars','earth'].map(cinemaDuration),[35,21,26]);
 }finally{f.done();}
});

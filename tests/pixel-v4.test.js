import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {Simulation,createState,restoreState} from '../src2d/simulation.js';
import {PixelWorld,TILE,WIDTH,PLAYER_HEIGHT,BLOCK,worldOptions} from '../src2d/world.js';
import {PixelParticles} from '../src2d/effects.js';
import {drawSpaceSky,drawSurfaceSky,starLayer} from '../src2d/sky.js';

function arena({direction=1,height=1,ceiling=false,planet='moon'}={}){
 const s=createState();s.planet=planet;const sim=new Simulation(s),w=sim.world;w.tiles.fill(0);
 for(let y=90;y<94;y++)for(let x=0;x<WIDTH;x++)w.tiles[y*WIDTH+x]=BLOCK.ROCK;
 const wall=direction===1?105:95;for(let y=90-height;y<90;y++)w.tiles[y*WIDTH+wall]=BLOCK.ROCK;
 if(ceiling)for(let x=98;x<=107;x++)w.tiles[84*WIDTH+x]=BLOCK.HULL;
 Object.assign(s.player,{x:800,y:90*TILE-PLAYER_HEIGHT,vx:0,vy:0,grounded:true});return{sim,wall};
}
test('one eight-pixel block steps up automatically in either direction on both planets at varied update rates',()=>{
 for(const planet of['moon','mars'])for(const direction of[-1,1])for(const fps of[30,60,144]){
  const{sim}=arena({direction,planet}),initialY=sim.s.player.y;let maxRise=0;
  for(let i=0;i<fps*2;i++){sim.tick(1/fps,{axis:direction});maxRise=Math.max(maxRise,initialY-sim.s.player.y);assert.equal(sim.world.collides(sim.s.player.x,sim.s.player.y),false);}
  assert.ok((sim.s.player.x-800)*direction>65,planet+' '+direction+' '+fps);assert.ok(maxRise>=TILE-.1&&maxRise<=TILE+.1);assert.equal(sim.s.resources.energy>80,true);assert.equal(sim.lastBoostAt,undefined);
 }
});
test('two or more stacked blocks block walking instead of becoming an automatic jump',()=>{
 for(const direction of[-1,1])for(const height of[2,3,5]){const{sim,wall}=arena({direction,height}),initialY=sim.s.player.y;for(let i=0;i<180;i++)sim.tick(1/60,{axis:direction});assert.ok(Math.abs(sim.s.player.y-initialY)<.1);assert.ok(direction===1?sim.s.player.x+12<=wall*TILE+.1:sim.s.player.x>=(wall+1)*TILE-.1);}
});
test('walking on flat ground and stepping onto one block never flickers into airborne animation',()=>{
 for(const height of[0,1]){const{sim}=arena({height});for(let i=0;i<60;i++){sim.tick(1/60,{axis:1});assert.equal(sim.s.player.grounded,true,'lost contact on frame '+i);assert.ok(!['jump','fall','land'].includes(sim.animation.state),sim.animation.state);}}
});
test('automatic steps respect ceilings and never pull airborne characters onto a ledge',()=>{
 const{sim}=arena({ceiling:true});for(let i=0;i<180;i++)sim.tick(1/60,{axis:1});assert.ok(sim.s.player.x+12<=105*TILE+.1);assert.equal(sim.world.collides(sim.s.player.x,sim.s.player.y),false);
 for(const vy of[-20,20]){const{sim}=arena();Object.assign(sim.s.player,{x:105*TILE-12,y:90*TILE-PLAYER_HEIGHT,grounded:false,vy});const y=sim.s.player.y;sim.move(1,0);assert.equal(sim.s.player.y,y);assert.ok(sim.s.player.x+12<=105*TILE+.1);}
});
test('a taller obstacle remains jumpable using the real jump input',()=>{
 const{sim}=arena({height:2});let jumped=false;for(let i=0;i<240;i++){const jump=!jumped&&sim.s.player.x>815&&sim.s.player.grounded;sim.tick(1/60,{axis:1,jump});if(jump)jumped=true;assert.equal(sim.world.collides(sim.s.player.x,sim.s.player.y),false);}assert.ok(jumped);assert.ok(sim.s.player.x>105*TILE+15);
});
test('pickaxe upgrades charge resources atomically at the workbench and stop at tier four',()=>{
 const sim=new Simulation();let before=JSON.stringify(sim.s.inventory);assert.equal(sim.upgradePickaxe().ok,false);assert.equal(JSON.stringify(sim.s.inventory),before);sim.s.player.x=35*16;sim.s.inventory.regolith=100;sim.s.inventory.iron=100;sim.s.resources.energy=100;
 for(let tier=1;tier<=3;tier++){const cost=sim.pickaxeUpgrade(),inv={...sim.s.inventory},power=sim.s.resources.energy;assert.equal(sim.upgradePickaxe().ok,true);assert.equal(sim.s.equipment.pickaxe,tier+1);assert.equal(sim.s.inventory.regolith,inv.regolith-cost.regolith);assert.equal(sim.s.inventory.iron,inv.iron-cost.iron);assert.equal(sim.s.resources.energy,power-cost.energy);}
 before=JSON.stringify([sim.s.inventory,sim.s.resources]);assert.equal(sim.upgradePickaxe().ok,false);assert.equal(JSON.stringify([sim.s.inventory,sim.s.resources]),before);assert.equal(restoreState(JSON.parse(JSON.stringify(sim.s))).equipment.pickaxe,4);
});
test('higher pickaxe tiers mine faster and still require a sustained hold',()=>{
 const times=[];for(let tier=1;tier<=4;tier++){const sim=new Simulation();sim.s.equipment.pickaxe=tier;sim.s.player.x=56*16-14;const y=sim.world.surfaceAt(112);sim.s.player.y=y*TILE-PLAYER_HEIGHT;let count=0;while(sim.world.get(112,y)&&count++<90)sim.mine(112,y);assert.equal(sim.world.get(112,y),0);assert.equal(sim.s.inventory.iron,1);assert.ok(count>5);times.push(count);}assert.ok(times.every((t,i)=>i===0||t<times[i-1]));assert.ok(times[3]<times[0]/2);
});
test('hitting an unbroken block emits visible rock chips that disappear without becoming inventory',()=>{
 const sim=new Simulation(),fx=new PixelParticles();sim.s.player.x=56*16-14;const y=sim.world.surfaceAt(112);sim.s.player.y=y*TILE-PLAYER_HEIGHT;fx.update(0,sim);sim.mine(112,y);assert.ok(sim.lastMineHit);assert.notEqual(sim.world.get(112,y),0);fx.update(.016,sim);assert.ok(fx.items.some(p=>p.chip));assert.equal(sim.s.inventory.iron,0);for(let i=2;i<120;i++)fx.update(i/60,sim);assert.equal(fx.items.length,0);
});
test('different world seeds change terrain, caves and ore while keeping the habitat approachable',()=>{
 const worlds=[1,2,134,2026,0xffffffff].map(seed=>new Simulation(createState({},seed)).world);
 for(const w of worlds){assert.equal(w.get(50,66),BLOCK.FLOOR);assert.equal(w.collides(26*16,33*16-34),false);assert.equal(w.surfaceAt(80),66);assert.equal(w.get(112,w.surfaceAt(112)),BLOCK.IRON);for(const p of w.pointsOfInterest()){assert.ok(p.y>0);assert.ok(Math.abs(p.y+9-w.surfaceAt(Math.floor(p.x/TILE))*TILE)<=TILE);}}
 assert.equal(new Set(worlds.map(w=>Buffer.from(w.tiles).toString('base64'))).size,worlds.length);assert.equal(new Set(worlds.map(w=>Array.from({length:250},(_,x)=>w.surfaceAt(130+x)).join(','))).size,worlds.length);
});
test('seed, upgrades and edited terrain survive reloading and each planet gets a distinct world',()=>{
 const sim=new Simulation(createState({},134));const ty=sim.world.surfaceAt(112);sim.world.set(112,ty,0);sim.s.worlds.moon=sim.world.edits;sim.s.equipment.pickaxe=3;const loaded=new Simulation(restoreState(JSON.parse(JSON.stringify(sim.s))));assert.equal(loaded.s.worldSeed,134);assert.equal(loaded.s.equipment.pickaxe,3);assert.deepEqual(loaded.world.tiles,sim.world.tiles);assert.equal(loaded.world.get(112,ty),0);loaded.s.flags.marsUnlocked=true;loaded.arriveMars();assert.notEqual(loaded.world.seed,sim.world.seed);assert.equal(loaded.world.version,3);assert.deepEqual(loaded.world.tiles,new PixelWorld('mars',{},worldOptions(loaded.s)).tiles);
});
test('old unseeded saves retain their exact generator and new saves reject damaged seeds',()=>{
 const old=createState();delete old.worldSeed;delete old.worldVersion;delete old.equipment;const restored=restoreState(old),sim=new Simulation(restored);assert.equal(sim.s.worldVersion,1);assert.equal(sim.s.equipment.pickaxe,1);assert.deepEqual(sim.world.tiles,new PixelWorld('moon').tiles);const broken=createState({},1);broken.worldSeed=Infinity;assert.throws(()=>restoreState(broken));
});
test('sky stars remain fixed in lunar vacuum, use cached layers and differ from dusty Mars',()=>{
 const previous=globalThis.document;globalThis.document={createElement:()=>createCanvas(1,1)};
 try{const c=createCanvas(640,360),ctx=c.getContext('2d'),cam={x:0,y:0};drawSurfaceSky(ctx,640,360,'moon',cam,0);const initial=c.toBuffer('image/png');drawSurfaceSky(ctx,640,360,'moon',cam,200);assert.deepEqual(c.toBuffer('image/png'),initial);assert.equal(starLayer(640,360),starLayer(640,360));drawSurfaceSky(ctx,640,360,'mars',cam,0);assert.notDeepEqual(c.toBuffer('image/png'),initial);drawSpaceSky(ctx,640,360,{space:true});const sky=ctx.getImageData(0,0,640,360).data;let bright=0;for(let i=0;i<sky.length;i+=4)if(sky[i]>100&&sky[i+1]>100)bright++;assert.ok(bright>200);const corner=ctx.getImageData(10,345,1,1).data;assert.ok(corner[2]>corner[0]+10);}
 finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});

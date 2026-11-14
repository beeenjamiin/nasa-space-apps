import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {Simulation,createState,restoreState} from '../src2d/simulation.js';
import {PixelWorld,BLOCK,WIDTH,HEIGHT,TILE,PLAYER_HEIGHT} from '../src2d/world.js';
import {MATERIALS,collectMaterial} from '../src2d/block-materials.js';
import {analyzeStructure,settleStructures} from '../src2d/structural-physics.js';
import {geologyTile} from '../src2d/materials.js';
import {drawGameplayWorld,drawRover} from '../src2d/gameplay-view.js';
import {ROVER} from '../src2d/vehicles.js';

function flat(planet='moon'){
 const s=createState();s.planet=planet;s.flags.marsUnlocked=planet==='mars';
 const sim=new Simulation(s);sim.world.tiles.fill(0);sim.world.edits={};sim.s.worlds[planet]=sim.world.edits;sim.world.placed.clear();
 for(let y=100;y<HEIGHT;y++)sim.world.tiles.fill(BLOCK.ROCK,y*WIDTH,(y+1)*WIDTH);
 sim.world.revision++;Object.assign(s.player,{x:1000,y:800-PLAYER_HEIGHT,vx:0,vy:0,grounded:true});return sim;
}
const tick=(sim,seconds=1,input={},hz=60)=>{for(let i=0;i<Math.ceil(seconds*hz);i++)sim.tick(1/hz,input);};
function rover(sim,x=1040){const v={id:'rover-1',planet:'mars',x,y:800-ROVER.height,vx:0,vy:0,facing:1,grounded:true};sim.s.vehicles.push(v);return v;}
function bridge(planet,length){
 const sim=flat(planet);sim.world.set(150,99,MATERIALS['moon-rock'].block);
 for(let i=0;i<length;i++)sim.world.set(150+i,98,MATERIALS['moon-rock'].block);
 return sim;
}
function finishMining(sim,x,y){for(let i=0;i<1000;i++){if(sim.mine(x,y))return i+1;sim.tick(1/60);}assert.fail('mining never completed');}

test('lunar material retains its type through mining, Mars travel, placement and save/load',()=>{
 const sim=new Simulation();sim.s.player.x=56*16-14;sim.s.player.y=sim.world.surfaceAt(112)*8-34;
 finishMining(sim,112,sim.world.surfaceAt(112));assert.equal(sim.s.materials['moon-iron'],1);
 // Also retain rock separately from dust even though both feed the legacy regolith total.
 collectMaterial(sim.s,MATERIALS['moon-rock']);collectMaterial(sim.s,MATERIALS['moon-dust']);
 sim.s.flags.marsUnlocked=true;sim.arriveMars();assert.equal(sim.materialInventory().find(m=>m.id==='moon-iron').count,1);
 sim.s.player.x=112*8-14;sim.s.player.y=sim.world.surfaceAt(112)*8-34;
 const ty=sim.world.surfaceAt(112)-1;
 assert.equal(sim.place(112,ty,'moon-rock'),true);assert.equal(sim.world.materialAt(112,ty).id,'moon-rock');
 const loaded=new Simulation(restoreState(JSON.parse(JSON.stringify(sim.s))));
 assert.equal(loaded.world.materialAt(112,ty).planet,'moon');assert.equal(loaded.s.materials['moon-iron'],1);assert.equal(loaded.s.materials['moon-dust'],1);
 Object.assign(loaded.s.player,sim.s.player);finishMining(loaded,112,ty);assert.equal(loaded.s.materials['moon-rock'],1);
});

test('all four carried lunar material textures render identically on either planet',()=>{
 for(const kind of ['dust','rock','iron','ice']){
  const m=MATERIALS['moon-'+kind],images=[];
  for(const planet of ['moon','mars']){
   const c=createCanvas(8,8),world=new PixelWorld(planet);world.tiles.fill(0);world.set(150,90,m.block);
   geologyTile(c.getContext('2d'),m.block,0,0,150,90,world);images.push(c.toBuffer('image/png'));
  }
  assert.deepEqual(images[0],images[1],kind);
 }
 const draw=id=>{const c=createCanvas(8,8);geologyTile(c.getContext('2d'),MATERIALS[id].block,0,0,150,90,{get:()=>0,materialAt:()=>MATERIALS[id]});return c.toBuffer('image/png');};
 assert.notDeepEqual(draw('moon-dust'),draw('mars-dust'));
});

test('existing craft, shielding, upgrade and rescue costs cannot duplicate provenance stacks',()=>{
 const sim=new Simulation();sim.s.flags.baseOnline=true;sim.s.inventory.regolith=40;sim.s.inventory.iron=20;
 sim.materialInventory();sim.s.player.x=35*16;assert.equal(sim.craft('panel').ok,true);assert.equal(sim.upgradePickaxe().ok,true);
 sim.s.player.x=39*16;assert.equal(sim.manageHabitat('shield').ok,true);sim.rescue();
 for(const item of ['regolith','iron','ice'])assert.equal(sim.materialInventory().filter(m=>m.item===item).reduce((n,m)=>n+m.count,0),sim.s.inventory[item]);
 assert.equal(sim.s.inventory.regolith,17);assert.equal(sim.s.inventory.iron,14);
});

test('legacy saves preserve progress and grid edits while receiving safe gameplay defaults',()=>{
 const raw=createState({},134);raw.flags.analyzed=true;raw.inventory.regolith=7;raw.worlds.moon[90*WIDTH+150]=0;delete raw.materials;delete raw.vehicles;delete raw.driving;delete raw.inventory.rovers;
 const saved=restoreState(JSON.parse(JSON.stringify(raw)));
 assert.equal(saved.flags.analyzed,true);assert.equal(saved.worldSeed,134);assert.equal(saved.worlds.moon[90*WIDTH+150],0);assert.equal(saved.materials['moon-dust'],7);assert.deepEqual(saved.vehicles,[]);assert.equal(saved.inventory.rovers,0);
 saved.worlds.moon[90*WIDTH+151]=MATERIALS['mars-ice'].block;assert.equal(new PixelWorld('moon',saved.worlds.moon).materialAt(151,90).id,'mars-ice');
});

test('structure spans are finite and shorter in Martian gravity; disconnected cycles never support themselves',()=>{
 const moon=bridge('moon',12),mars=bridge('mars',12),a=analyzeStructure(moon.world),b=analyzeStructure(mars.world);
 assert.equal(a.supported.has(98*WIDTH+158),true);assert.equal(a.supported.has(98*WIDTH+159),false);
 assert.equal(b.supported.has(98*WIDTH+155),true);assert.equal(b.supported.has(98*WIDTH+156),false);
 const sim=flat();for(const [x,y]of [[180,90],[181,90],[180,91],[181,91]])sim.world.set(x,y,MATERIALS['moon-rock'].block);
 assert.equal(analyzeStructure(sim.world).unsupported.length,4);settleStructures(sim);assert.equal(sim.world.placed.size,0);
});

test('removing the real anchor collapses a bridge, persists removal and animates falling cells',()=>{
 const sim=bridge('moon',5);settleStructures(sim);assert.equal(sim.world.placed.size,6);
 sim.world.set(150,100,0);sim.tick(1/60);assert.equal(sim.world.placed.size,0);assert.equal(sim.collapses.length,6);
 const events=sim.drainEvents().filter(e=>e.type==='structure:collapse');assert.equal(events.length,1);assert.equal(events[0].count,6);
 const y=sim.collapses[0].y;sim.tick(.1);assert.ok(sim.collapses[0].y>y);
 const restored=new PixelWorld('moon',JSON.parse(JSON.stringify(sim.s.worlds.moon)));assert.equal(restored.get(150,99),0);
 const canvas=createCanvas(160,100);drawGameplayWorld(canvas.getContext('2d'),sim,{x:1190,y:760},0);assert.ok(canvas.getContext('2d').getImageData(0,0,160,100).data.some(v=>v));
});

test('unsupported blocks are paid for and fall; stability work only runs after terrain changes',()=>{
 const sim=flat();sim.s.inventory.regolith=10;
 assert.equal(sim.place(130,94),true);assert.equal(sim.s.inventory.regolith,9);assert.equal(sim.world.get(130,94),0);assert.equal(sim.collapses.length,1);
 tick(sim,.1);const checks=sim.structureChecks;tick(sim,2);assert.equal(sim.structureChecks,checks);
 sim.world.set(180,100,0);sim.tick(1/60);assert.equal(sim.structureChecks,checks+1);
 assert.equal(sim.place(NaN,98),false);assert.equal(sim.world.set(125.5,98,1),false);
});

test('excess cantilever blocks fall after a more tolerant supported span',()=>{
 for(const [planet,span]of [['moon',6],['mars',4]]){
  const sim=flat(planet);sim.s.inventory.regolith=20;
  for(let y=100;y<HEIGHT;y++)for(let x=129;x<150;x++)sim.world.tiles[y*WIDTH+x]=0;
  for(let i=0;i<=span;i++){
   Object.assign(sim.s.player,{x:(127+i)*8,y:99*8-34});
   assert.equal(sim.place(128+i,99),true,planet+' supported cell '+i);
  }
  Object.assign(sim.s.player,{x:(128+span)*8,y:99*8-34});
  const quantity=sim.s.inventory.regolith;assert.equal(sim.previewBlock(129+span,99).stable,false);assert.equal(sim.place(129+span,99),true);assert.equal(sim.world.get(129+span,99),0);assert.equal(sim.collapses.length,1);assert.equal(sim.s.inventory.regolith,quantity-1);
 }
});

test('fall damage follows impact speed; the same height hurts more on Mars and ordinary jumps are safe',()=>{
 const impacts=[];
 for(const planet of ['moon','mars']){
  const sim=flat(planet);sim.s.player.y-=200;sim.s.player.grounded=false;
  for(let i=0;i<1200&&!sim.s.player.grounded;i++)sim.tick(1/120);
  assert.equal(sim.s.player.grounded,true);assert.ok(sim.s.resources.health<100);
  const e=sim.drainEvents().find(e=>e.type==='fall:damage');assert.ok(e.speed>4.25);assert.ok(e.damage>0);assert.equal(e.health,sim.s.resources.health);impacts.push(e.damage);
  const jumping=flat(planet);jumping.tick(1/60,{jump:true});tick(jumping,6);assert.equal(jumping.s.resources.health,100);assert.equal(jumping.drainEvents().filter(e=>e.type==='fall:damage').length,0);
 }
 assert.ok(impacts[1]>impacts[0]*2);
});

test('high-speed falls cannot tunnel through a single tile floor or charge the same impact twice',()=>{
 const sim=flat('mars');sim.world.tiles.fill(0);for(let x=0;x<WIDTH;x++)sim.world.tiles[100*WIDTH+x]=BLOCK.ROCK;
 Object.assign(sim.s.player,{y:750,vy:140,grounded:false});tick(sim,1,{},10);
 assert.equal(sim.s.player.grounded,true);assert.ok(sim.s.player.y+34<=800.01);const health=sim.s.resources.health;tick(sim,1);assert.equal(sim.s.resources.health,health);assert.equal(sim.drainEvents().filter(e=>e.type==='fall:damage').length,1);
});

test('ceiling collisions and invalid time steps cannot deal fall damage or advance mining',()=>{
 const sim=flat('mars');sim.world.set(125,90,BLOCK.ROCK);sim.world.set(126,90,BLOCK.ROCK);
 Object.assign(sim.s.player,{y:730,vy:-100,grounded:false});sim.tick(.1);assert.equal(sim.s.resources.health,100);assert.equal(sim.s.player.vy,0);
 assert.equal(sim.canMine(129.5,99),false);assert.equal(sim.mine(129,99,NaN),false);assert.equal(sim.miningSnapshot().active,false);
 const elapsed=sim.s.elapsed;sim.tick(Infinity);sim.tick(-1);assert.equal(sim.s.elapsed,elapsed);
});

test('material hardness, upgrades, progress and cancelling use the existing mining rewards',()=>{
 const durations=[];
 for(const id of ['moon-dust','moon-ice','moon-rock','moon-iron']){
  const sim=flat();sim.world.set(129,99,MATERIALS[id].baseBlock);const frames=finishMining(sim,129,99);durations.push(frames);
  assert.equal(sim.s.inventory[MATERIALS[id].item],1);assert.equal(sim.s.materials[id],1);assert.equal(sim.miningSnapshot().active,false);
 }
 assert.ok(durations.every((n,i)=>!i||n>durations[i-1]));
 const sim=flat();sim.world.set(129,99,BLOCK.IRON);sim.mine(129,99,.1);assert.ok(sim.miningSnapshot().progress>0);sim.stopMining();assert.equal(sim.miningSnapshot().active,false);assert.equal(sim.s.inventory.iron,0);
 sim.s.equipment.pickaxe=4;assert.ok(finishMining(sim,129,99)<durations.at(-1)/2);
 const events=sim.drainEvents();assert.ok(events.some(e=>e.type==='mining:cancelled'));assert.ok(events.some(e=>e.type==='mining:complete'));assert.ok(events.filter(e=>e.type==='mining:progress').every(e=>e.progress>=0&&e.progress<=1));
});

test('rover recipe is Mars-only, uses atomic costs and deploys from the existing inventory',()=>{
 const sim=new Simulation();Object.assign(sim.s.inventory,{regolith:50,iron:20});sim.s.player.x=35*16;
 const before=JSON.stringify(sim.s.inventory);assert.equal(sim.craft('rover').ok,false);assert.equal(JSON.stringify(sim.s.inventory),before);
 sim.s.flags.marsUnlocked=true;sim.arriveMars();sim.s.player.x=35*16;sim.s.inventory.iron=7;
 const energy=sim.s.resources.energy;assert.equal(sim.craft('rover').ok,false);assert.equal(sim.s.resources.energy,energy);assert.equal(sim.s.inventory.regolith,50);
 sim.s.inventory.iron=20;assert.equal(sim.craft('rover').ok,true);assert.equal(sim.s.inventory.rovers,1);assert.equal(sim.s.inventory.regolith,38);assert.equal(sim.s.inventory.iron,12);assert.equal(sim.s.vehicles.length,0);
 sim.s.player.x=80*16;sim.s.player.y=sim.world.groundY(sim.s.player.x)-34;
 assert.equal(sim.use('rovers').ok,true);assert.equal(sim.s.inventory.rovers,0);assert.equal(sim.s.vehicles.length,1);assert.equal(sim.use('rovers').ok,false);
});

test('failed rover deployment spends nothing and respects space, suit and vehicle limits',()=>{
 const sim=flat('mars');sim.s.inventory.rovers=2;sim.s.equipment.suited=false;assert.equal(sim.use('rovers').ok,false);assert.equal(sim.s.inventory.rovers,2);
 sim.s.equipment.suited=true;sim.world.tiles.fill(BLOCK.ROCK);assert.equal(sim.use('rovers').ok,false);assert.equal(sim.s.inventory.rovers,2);
 const open=flat('mars');open.s.inventory.rovers=1;for(let i=0;i<3;i++)open.s.vehicles.push({id:'rover-'+(i+1),planet:'mars',x:2000+i*80,y:776,vx:0,vy:0,grounded:true});assert.equal(open.use('rovers').ok,false);assert.equal(open.s.inventory.rovers,1);
});

test('rover enters through E, accelerates, brakes, consumes energy, exits and survives save/load',()=>{
 const sim=flat('mars'),v=rover(sim);sim.s.player.x=1020;
 assert.equal(sim.interact(),'vehicle');assert.equal(sim.s.driving,v.id);const energy=sim.s.resources.energy;
 tick(sim,1,{axis:1});assert.ok(v.x>1060);assert.ok(v.vx>60&&v.vx<=ROVER.maxSpeed);assert.ok(sim.s.resources.energy<energy);assert.equal(sim.s.player.x,v.x+18);
 const saved=restoreState(JSON.parse(JSON.stringify(sim.s)));assert.equal(saved.driving,v.id);assert.equal(saved.vehicles[0].x,v.x);assert.equal(saved.vehicles[0].vx,0);
 tick(sim,1,{brake:true});assert.equal(v.vx,0);assert.equal(sim.interact(),'vehicle');assert.equal(sim.s.driving,null);assert.equal(sim.world.collides(sim.s.player.x,sim.s.player.y),false);
});

test('rover climbs one block, stops at walls and respects thin terrain under gravity at varied rates',()=>{
 for(const hz of [10,30,60,144]){
  const sim=flat('mars'),v=rover(sim,1000);sim.s.player.x=980;assert.equal(sim.enterVehicle(v.id).ok,true);
  for(let x=134;x<145;x++)sim.world.set(x,99,BLOCK.ROCK);
  for(let y=80;y<100;y++)sim.world.set(145,y,BLOCK.ROCK);
  tick(sim,4,{axis:1},hz);assert.ok(v.x>1030,'one-cell step');assert.ok(v.x+48<=145*8+.1,'wall penetration');assert.equal(sim.world.collides(v.x,v.y,48,24),false);assert.equal(v.grounded,true);
 }
 const falling=flat('mars'),v=rover(falling,1100);v.y=600;v.grounded=false;falling.tick(.1);assert.ok(v.vy>5&&v.vy<7);assert.ok(v.y>600);tick(falling,4);assert.ok(v.y+24<=800.1);assert.equal(v.grounded,true);
});

test('rover cannot phase through another rover or be crossed by a walking astronaut',()=>{
 const sim=flat('mars'),v=rover(sim,1040);sim.s.player.x=1000;tick(sim,2,{axis:1});assert.ok(sim.s.player.x+12<=v.x+.1);
 sim.s.player.x=1020;sim.enterVehicle(v.id);const other={...v,id:'rover-2',x:1200};sim.s.vehicles.push(other);tick(sim,3,{axis:1});assert.ok(v.x+48<=other.x+.1);
});

test('entering through a wall and exiting into solid rock are refused without losing drive state',()=>{
 const sim=flat('mars'),v=rover(sim,1040);sim.s.player.x=1018;
 for(let y=92;y<100;y++)sim.world.set(129,y,BLOCK.ROCK);
 assert.equal(sim.enterVehicle(v.id).ok,false);assert.equal(sim.s.driving,null);
 for(let y=92;y<100;y++)sim.world.set(129,y,0);
 assert.equal(sim.enterVehicle(v.id).ok,true);
 for(const x of [128,136])for(let y=95;y<100;y++)sim.world.set(x,y,BLOCK.ROCK);
 assert.equal(sim.exitVehicle().ok,false);assert.equal(sim.s.driving,v.id);
});

test('invalid rover saves are bounded and no vehicle can be entered after a rescue or campaign end',()=>{
 const raw=createState();raw.planet='mars';raw.flags.marsUnlocked=true;raw.vehicles=[{id:'rover-1',planet:'mars',x:1000,y:760},{id:'rover-1',planet:'mars',x:1200,y:760},{id:'bad',planet:'mars',x:NaN,y:5},{id:'rover-2',planet:'moon',x:1200,y:760}];raw.driving='missing';
 const loaded=restoreState(raw);assert.equal(loaded.vehicles.length,1);assert.equal(loaded.driving,null);
 const sim=flat('mars'),v=rover(sim);sim.s.player.x=1020;sim.enterVehicle(v.id);sim.rescue();assert.equal(sim.s.driving,null);sim.s.flags.returnedEarth=true;assert.equal(sim.enterVehicle(v.id).ok,false);
});

test('rover is drawn as pixel graphics and its drive state is exposed without touching the HUD',()=>{
 const canvas=createCanvas(90,70),c=canvas.getContext('2d');drawRover(c,{x:10,y:25,vx:20,facing:1},{x:0,y:0},.5,true);
 const pixels=c.getImageData(0,0,90,70).data;assert.ok([...pixels].filter((v,i)=>i%4===3&&v===255).length>400);
 const sim=flat('mars');const v=rover(sim);const exposed=sim.vehicleState();exposed.vehicles[0].x=-99;assert.equal(v.x,1040);
});

test('map snapshots contain 2D terrain, live coordinates, base/ship/science and vehicle markers on both planets',()=>{
 const sim=new Simulation(createState({},134));const first=sim.openMap();assert.equal(first.open,true);assert.equal(first.planet,'moon');assert.equal(first.terrain.tiles.length,first.terrain.width*first.terrain.height);assert.ok(first.terrain.tiles.some(v=>v));
 assert.ok(first.markers.some(p=>p.type==='base'));assert.ok(first.markers.some(p=>p.type==='ship'));assert.equal(first.markers.filter(p=>p.type==='sample').length,3);
 const x=first.player.x;sim.s.player.x+=12;assert.equal(sim.mapSnapshot().player.x,x+12);
 sim.s.flags.marsUnlocked=true;sim.arriveMars();rover(sim);const mars=sim.mapSnapshot();assert.equal(mars.planet,'mars');assert.equal(mars.markers.filter(p=>p.type==='discovery').length,3);assert.equal(mars.markers.filter(p=>p.type==='vehicle').length,1);
 sim.closeMap();assert.equal(sim.mapSnapshot().open,false);assert.equal(sim.toggleMap(),true);
});

test('map terrain invalidates on edits, snapshots are isolated, waypoints navigate without moving the player',()=>{
 const sim=flat();const a=sim.mapSnapshot();const tx=160,ty=80,index=Math.floor(ty/4)*a.terrain.width+Math.floor(tx/4);
 assert.equal(a.terrain.tiles[index],0);sim.world.set(tx,ty,BLOCK.ROCK);const b=sim.mapSnapshot();assert.equal(b.terrain.tiles[index],BLOCK.ROCK);assert.notEqual(a.revision,b.revision);b.terrain.tiles.fill(0);assert.equal(sim.mapSnapshot().terrain.tiles[index],BLOCK.ROCK);
 const x=sim.s.player.x;assert.equal(sim.setMapWaypoint(x+160,sim.s.player.y+17),true);assert.ok(sim.mapSnapshot().navigation.distance>9);assert.equal(sim.s.player.x,x);assert.equal(sim.setMapWaypoint(Infinity,0),false);assert.equal(sim.setMapWaypoint(-1,0),false);
 assert.equal(sim.setMapWaypoint(null),true);assert.equal(sim.mapSnapshot().waypoint,null);
});

test('gameplay event subscriptions can be removed and the retained queue stays bounded',()=>{
 const sim=new Simulation();const received=[];const off=sim.on('map:visibility',e=>received.push(e));sim.openMap();off();sim.closeMap();assert.equal(received.length,1);assert.equal(received[0].open,true);
 for(let i=0;i<200;i++)sim.toggleMap();const events=sim.drainEvents();assert.equal(events.length,128);assert.equal(sim.drainEvents().length,0);assert.ok(events.every((e,i)=>!i||e.sequence>events[i-1].sequence));
 sim.on('map:visibility',()=>{throw new Error('broken external widget');});assert.doesNotThrow(()=>sim.toggleMap());assert.ok(sim.drainEvents().some(e=>e.type==='integration:error'));
});

import test from 'node:test';import assert from 'node:assert/strict';
import {Simulation,createState,restoreState,objective} from '../src2d/simulation.js';
import {juniorState,tickJunior,dustPhase,flightChecklist} from '../src2d/junior-mission.js';
import {setLanguage,translate} from '../src2d/language.js';
import {fallImpact} from '../src2d/fall-damage.js';
import {ROVER} from '../src2d/vehicles.js';
import {UNIT} from '../src2d/world.js';
const junior=()=>{const s=createState({},134);s.junior=juniorState();return new Simulation(s);};
test('tutorial follows real walking, jumping and map use; medals cannot be farmed',()=>{
 const sim=junior(),s=sim.s;assert.equal(objective(s).title,'¡Hola, cadete!');
 for(let i=0;i<90;i++)sim.tick(1/60,{axis:.5});assert.equal(s.junior.training,1);
 sim.tick(1/60,{jump:true});assert.equal(s.junior.training,2);sim.openMap();sim.closeMap();sim.tick(1/60);assert.equal(s.junior.training,3);
 assert.deepEqual(s.junior.badges,['training']);for(let i=0;i<100;i++)sim.tick(1/60);assert.equal(s.junior.badges.filter(b=>b==='training').length,1);
 const restored=restoreState(JSON.parse(JSON.stringify(s)));assert.equal(restored.junior.training,3);assert.deepEqual(restored.junior.badges,s.junior.badges);
});
test('Mars flight checklist prevents departure until real preparation, without consuming checks',()=>{
 const sim=junior(),s=sim.s;s.junior.training=3;s.flags.module=s.flags.analyzed=s.flags.solarOnline=true;Object.assign(s.player,{x:16*UNIT,y:33*UNIT-34});
 assert.equal(sim.interact(),'locked');assert.equal(s.flags.marsUnlocked,false);s.inventory.beacons=1;s.inventory.rations=2;
 s.resources.water=34;assert.equal(sim.interact(),'locked');s.resources.water=35;s.resources.energy=39;assert.equal(sim.interact(),'locked');s.resources.energy=40;
 assert.ok(flightChecklist(s).every(c=>c.ready));assert.equal(sim.interact(),'travel');assert.equal(s.inventory.beacons,1);assert.ok(sim.arriveMars());
});
test('dust warns before becoming active, is uncommon and does not exist on the Moon',()=>{
 const sim=junior();sim.s.junior.dustClock=299.95;tickJunior(sim,.1,{},sim.s.player.x);assert.equal(sim.s.junior.dustClock,299.95);
 sim.s.planet='mars';sim.s.flags.marsOnline=true;tickJunior(sim,.1,{},sim.s.player.x);assert.equal(dustPhase(sim.s.junior.dustClock),'warning');assert.ok(sim.s.log.at(-1).includes('AVISO'));
 assert.equal(dustPhase(324.9),'warning');assert.equal(dustPhase(325),'active');assert.equal(dustPhase(370),'clear');assert.equal(dustPhase(600),'quiet');assert.equal(dustPhase(900),'warning');
});
test('dust reduces solar gain; unpowered life support harms outdoors but shelter protects',()=>{
 const sim=junior(),s=sim.s;s.planet='mars';s.flags.marsOnline=true;s.junior.training=3;s.junior.dustClock=326;s.resources.energy=50;
 const before=s.resources.energy;tickJunior(sim,1,{},s.player.x);assert.ok(s.resources.energy<before);assert.equal(s.resources.health,100);
 s.resources.energy=0;tickJunior(sim,1,{},s.player.x);assert.equal(s.resources.health,100);
 Object.assign(s.player,{x:60*UNIT,y:400});tickJunior(sim,1,{},s.player.x);assert.ok(s.resources.health<100);assert.ok(s.resources.energy>=0);
});
test('saved junior settings are bounded and older saves skip only onboarding',()=>{
 assert.deepEqual(juniorState({training:999,badges:'broken',walk:-1,dustClock:-999}),{training:3,walk:0,badges:[],dustClock:0});
 const old=restoreState(JSON.parse(JSON.stringify(createState())));assert.equal(old.junior.training,3);assert.equal(old.flags.analyzed,false);
});
test('rover is faster than running and reduced fall damage still makes deep falls matter',()=>{
 assert.ok(ROVER.maxSpeed>65*1.8);assert.equal(fallImpact(60,'moon').damage,0);const impact=fallImpact(120,'moon');assert.ok(impact.damage>0&&impact.damage<30);
});
test('English translates child-facing objectives, items, NASA lessons and consequences',()=>{
 setLanguage('en');try{
 assert.equal(translate('Mochila'),'Backpack');assert.equal(translate('Nivel II · velocidad ×1.35'),'Level II · speed ×1.35');assert.equal(translate('TU PRÓXIMO PASO ↑'),'YOUR NEXT STEP ↑');
 assert.match(translate('Módulo de viaje a Marte fabricado. Está en la mochila: puedes utilizarlo cuando lo necesites.'),/Mars travel module crafted/);
 assert.match(translate('Los astronautas entrenan antes de viajar. Aprenden a comunicarse, trabajar juntos y resolver problemas.'),/Astronauts train/);
 assert.match(translate('Ración utilizada: nutrición +30 y salud +25. Las provisiones son limitadas.'),/Food pack used/);
 }finally{setLanguage('es');}assert.equal(translate('Mochila'),'Mochila');
});

test('mission rocks remain on edited ground instead of floating after mining underneath',()=>{
 const sim=junior(),original=sim.world.pointsOfInterest()[1],tx=Math.floor(original.x/8),top=Math.floor(sim.world.groundY(original.x)/8);
 for(let y=top;y<top+6;y++)sim.world.set(tx,y,0);
 const rock=sim.world.pointsOfInterest().find(p=>p.id===original.id);assert.ok(rock.y>original.y);assert.equal(rock.y,sim.world.groundY(rock.x)-9);
});

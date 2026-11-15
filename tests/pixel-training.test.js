import test from 'node:test';
import assert from 'node:assert/strict';
import {TrainingSession,TRAINING_STAGES} from '../src2d/training.js';
import {INTRO_DURATION,introAt} from '../src2d/prologue.js';
import {Simulation,createState,restoreState} from '../src2d/simulation.js';
import {solveStage,walkTo} from './training-driver.js';

test('prologue orders conference, photographic flash boundary, news and personalized transport',()=>{
 assert.equal(introAt(0).id,'conference');assert.equal(introAt(11).id,'news');assert.equal(introAt(21).id,'transport');assert.equal(introAt(INTRO_DURATION),null);
});
test('eight playable tests use actual controls, inventory and recipes without mutating the expedition',()=>{
 const expedition=new Simulation(createState({name:'Vega',color:2,skin:'#805138',hair:'#ddd8c9',visor:'gold'},134));
 const before=JSON.stringify(expedition.s),t=new TrainingSession(expedition.s.profile);
 assert.equal(t.next(),false);
 for(let n=0;n<TRAINING_STAGES.length;n++){
  assert.equal(t.index,n);assert.deepEqual(t.sim.s.profile,expedition.s.profile);
  solveStage(t);const count=t.completed.length;t.interact();t.tick(.1,{axis:1,mine:true});assert.equal(t.completed.length,count);
  if(n<TRAINING_STAGES.length-1)assert.equal(t.next(),true);
 }
 assert.equal(t.approved,true);assert.deepEqual(t.completed,TRAINING_STAGES.map(s=>s.id));assert.equal(JSON.stringify(expedition.s),before);
 assert.equal(t.sim.s.inventory.regolith,0);assert.equal(t.sim.s.inventory.iron,0);assert.equal(t.sim.s.inventory.lamps,0);assert.equal(t.sim.s.fixtures.length,1);
});
test('medical scan, wrong signals and neutral centrifuge input cannot auto-complete training',()=>{
 const t=new TrainingSession();t.interact();assert.equal(t.active,false);walkTo(t,480);t.interact();
 for(let i=0;i<120;i++)t.tick(1/60,{axis:1});assert.equal(t.passed,false);assert.equal(t.progress,0);
 t.index=1;t.enter();walkTo(t,640);t.interact();assert.equal(t.step,0);
 t.index=2;t.enter();walkTo(t,560);t.interact();for(let i=0;i<600;i++)t.tick(1/60);assert.equal(t.passed,false);assert.equal(t.progress,0);
});
test('pressure chamber enforces suit, reserves, retry and paused equipment panels',()=>{
 const t=new TrainingSession();t.index=5;t.enter();walkTo(t,528);t.interact();assert.equal(t.step,0);
 for(let i=0;i<600;i++)t.tick(1/60,{axis:1});assert.ok(t.sim.s.player.x<=600.1);
 t.action('suit');t.sim.s.player.x=528;t.interact();assert.equal(t.step,1);t.sim.s.resources.oxygen=12;t.tick(.1);assert.equal(t.step,0);assert.equal(t.sim.s.resources.oxygen,100);
 t.enter();assert.equal(t.step,0);assert.equal(t.sim.s.equipment.suited,false);
});
test('training state stays separate from existing saved games',()=>{
 const raw=JSON.parse(JSON.stringify(createState({name:'Old save'},134)));raw.junior={training:3,badges:['training']};
 const restored=restoreState(raw);assert.equal(restored.profile.name,'Old save');assert.equal(restored.junior.training,3);assert.equal(restored.flags.baseOnline,false);
 const t=new TrainingSession();t.action('inventory');const elapsed=t.sim.s.elapsed;t.tick(.1,{axis:1});assert.equal(t.sim.s.elapsed,elapsed);t.action('pause');assert.equal(t.panel,null);
});

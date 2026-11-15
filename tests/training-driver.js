import assert from 'node:assert/strict';
export function walkTo(t,x){
 for(let i=0;i<1800;i++){
  if(t.passed)return;
  const p=t.sim.s.player,dx=x-(p.x+6);
  t.tick(1/60,{axis:Math.abs(dx)>2?Math.sign(dx):0});
  if(Math.abs(dx)<3&&Math.abs(p.vx)<1&&p.grounded)return;
 }
 assert.fail('Cannot reach training target '+x+' from '+t.sim.s.player.x);
}
export function solveStage(t){
 const ticks=(seconds,controls={})=>{for(let i=0;i<seconds*60;i++)t.tick(1/60,controls);};
 switch(t.stage.id){
 case 'medical':walkTo(t,480);t.interact();ticks(2.1);break;
 case 'psych':for(const x of[480,640,528]){walkTo(t,x);t.interact();}break;
 case 'centrifuge':walkTo(t,560);t.interact();for(let i=0;i<400&&!t.passed;i++)t.tick(1/60,{axis:-t.force()});break;
 case 'pool':for(let n=0;n<3;n++){if(t.step>n)continue;walkTo(t,t.target().x);if(t.step>n)continue;t.tick(1/60,{jump:true});for(let i=0;i<600&&t.step===n&&!t.passed;i++)t.tick(1/60);assert.ok(t.step>n,'swim through buoy '+n);}break;
 case 'survival':t.action('inventory');t.useRation();walkTo(t,672);t.interact();break;
 case 'pressure':t.action('suit');for(const x of[528,672,528]){walkTo(t,x);t.interact();}break;
 case 'navigation':t.action('map');t.markWaypoint();walkTo(t,704);t.interact();break;
 case 'technical':walkTo(t,480);ticks(2,{mine:true});assert.ok(t.mineDone);walkTo(t,560);t.action('craft');t.craftLamp();assert.equal(t.sim.s.inventory.lamps,1);t.deployLamp();break;
 }
 assert.ok(t.passed,'stage must pass: '+t.stage.id+' / '+t.feedback);
}

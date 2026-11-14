import config from '../data/pixel-config.json' with {type:'json'};
import {TILE,UNIT,WIDTH,HEIGHT,PLAYER_HEIGHT} from './world.js';
export const ROVER=Object.freeze({width:48,height:24,maxSpeed:125,acceleration:85,braking:130,coast:35,power:.045,maxPerPlanet:3});
const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
export function roverBounds(v){return{x:v.x,y:v.y,width:ROVER.width,height:ROVER.height};}
export function drivingVehicle(sim){return sim.s.vehicles.find(v=>v.id===sim.s.driving&&v.planet===sim.s.planet)||null;}
export function restoreVehicles(raw){
 const out=[];for(const v of Array.isArray(raw)?raw.slice(0,12):[]){
  if(out.length>=ROVER.maxPerPlanet||v?.planet!=='mars'||typeof v.id!=='string'||!/^rover-[1-9][0-9]{0,5}$/.test(v.id)||out.some(a=>a.id===v.id)||!Number.isFinite(v.x)||!Number.isFinite(v.y)||v.x<16||v.x>WIDTH*TILE-ROVER.width-16||v.y<0||v.y>HEIGHT*TILE-ROVER.height)continue;
  out.push({id:v.id,planet:'mars',x:v.x,y:v.y,vx:0,vy:0,grounded:false,facing:v.facing===-1?-1:1});
 }return out;
}
function blocked(sim,v,x,y){
 const box={x,y,width:ROVER.width,height:ROVER.height};
 return sim.world.collides(x,y,ROVER.width,ROVER.height)||sim.s.vehicles.some(o=>o!==v&&o.planet===v.planet&&overlaps(box,roverBounds(o)))||sim.s.driving!==v.id&&overlaps(box,{...sim.s.player,width:12,height:PLAYER_HEIGHT});
}
export function playerHitsVehicle(sim,x,y,width=12,height=PLAYER_HEIGHT){return sim.s.vehicles.some(v=>v.planet===sim.s.planet&&v.id!==sim.s.driving&&overlaps({x,y,width,height},roverBounds(v)));}
export function deployRover(sim){
 const s=sim.s,p=s.player;if(s.planet!=='mars'||sim.world.inside(p)||!s.equipment.suited||s.resources.health<=0||s.flags.returnedEarth||s.driving)return{ok:false,text:'Despliega el rover con traje en el exterior de Marte.'};
 if(!s.inventory.rovers)return{ok:false,text:'Fabrica primero un rover en el taller marciano.'};
 if(s.vehicles.filter(v=>v.planet==='mars').length>=ROVER.maxPerPlanet)return{ok:false,text:'Máximo de tres rovers en Marte.'};
 for(const offset of[p.facing*56,-p.facing*56,p.facing*80]){
  const x=Math.round((p.x+offset)/TILE)*TILE-ROVER.width/2;if(x<16||x>WIDTH*TILE-ROVER.width-16)continue;
  const floors=Array.from({length:7},(_,i)=>sim.world.groundY(x+i*7)),floor=Math.min(...floors),y=floor-ROVER.height;
  const v={id:'rover-'+(1+Math.max(0,...s.vehicles.map(o=>Number(o.id.slice(6))))),planet:'mars',x,y,vx:0,vy:0,grounded:true,facing:p.facing};
  if(Math.max(...floors)-floor>TILE||Math.abs(floor-(p.y+PLAYER_HEIGHT))>40||sim.world.inside({x,y})||blocked(sim,v,x,y))continue;
  if(s.solarPanels.some(a=>a.planet==='mars'&&Math.abs(a.x+12-(x+24))<48)||[47,50,53].some(a=>Math.abs(a*UNIT+12-(x+24))<48)||s.fixtures.some(a=>a.planet==='mars'&&Math.abs(a.x-(x+24))<32&&Math.abs(a.y-floor)<32))continue;
  s.inventory.rovers--;s.vehicles.push(v);sim.emit('vehicle:deployed',{vehicle:{...v}});return{ok:true,text:'Rover desplegado. Acércate y pulsa E para conducir; A/D mueve y espacio frena. E permite salir.'};
 }
 return{ok:false,text:'Busca una superficie exterior libre y cercana para desplegar el rover.'};
}
export function enterRover(sim,id){
 const s=sim.s,v=s.vehicles.find(v=>v.id===id&&v.planet===s.planet);
 if(!v||s.driving||s.resources.health<=0||s.flags.returnedEarth||!s.equipment.suited||Math.hypot(v.x+24-(s.player.x+6),v.y+12-(s.player.y+17))>64)return{ok:false,text:'Acércate al rover con el traje equipado.'};
 const dx=v.x+24-(s.player.x+6),dy=v.y+4-(s.player.y+17),steps=Math.ceil(Math.hypot(dx,dy)/3);
 for(let i=1;i<steps;i++)if(sim.world.solidAt(s.player.x+6+dx*i/steps,s.player.y+17+dy*i/steps))return{ok:false,text:'Hay una pared entre tú y el rover.'};
 s.driving=id;sim.stopMining();attachDriver(sim,v);sim.emit('vehicle:entered',{id});return{ok:true,text:'Conducción: A/D o controles laterales; espacio frena. E para salir.'};
}
export function exitRover(sim){
 const v=drivingVehicle(sim);if(!v)return{ok:false,text:'No estás conduciendo.'};
 for(const x of[v.x-16,v.x+ROVER.width+4]){
  const y=v.y+ROVER.height-PLAYER_HEIGHT;
  if(x<16||x>WIDTH*TILE-28||sim.world.collides(x,y)||playerHitsVehicle(sim,x,y)||!sim.suitAllows(x,y))continue;
  sim.s.driving=null;Object.assign(sim.s.player,{x,y,vx:0,vy:0,grounded:false});v.vx=0;sim.emit('vehicle:exited',{id:v.id});return{ok:true,text:'Has salido del rover.'};
 }
 return{ok:false,text:'No hay espacio para salir. Mueve el rover a un lugar despejado.'};
}
function attachDriver(sim,v){Object.assign(sim.s.player,{x:v.x+18,y:v.y-14,vx:v.vx,vy:v.vy,facing:v.facing,grounded:v.grounded,boostAvailable:false});}
function moveRover(sim,v,amount,vertical){
 const steps=Math.max(1,Math.ceil(Math.abs(amount)/2)),delta=amount/steps;
 for(let n=0;n<steps;n++){
  const x=vertical?v.x:Math.max(16,Math.min(WIDTH*TILE-ROVER.width-16,v.x+delta)),y=vertical?v.y+delta:v.y;
  if(!blocked(sim,v,x,y)){v.x=x;v.y=y;continue;}
  if(!vertical&&v.grounded){
   const top=Math.floor((v.y+ROVER.height-.05)/TILE)*TILE-ROVER.height,rise=v.y-top;
   if(rise>0&&rise<=TILE+.05&&!blocked(sim,v,v.x,top)&&!blocked(sim,v,x,top)&&sim.world.solidAt(delta>0?x+ROVER.width-.01:x,top+ROVER.height+.1)){v.x=x;v.y=top;continue;}
  }
  // Approach the contact without penetrating a thin tile or another vehicle.
  for(let k=0;k<Math.ceil(Math.abs(delta)*10);k++){
   const nx=vertical?v.x:v.x+Math.sign(delta)*.1,ny=vertical?v.y+Math.sign(delta)*.1:v.y;
   if(blocked(sim,v,nx,ny))break;v.x=nx;v.y=ny;
  }
  if(vertical){if(delta>0)v.grounded=true;v.vy=0;}else v.vx=0;break;
 }
}
export function tickVehicles(sim,dt,input={}){
 const s=sim.s,steps=Math.max(1,Math.ceil(dt*120)),step=dt/steps;
 for(const v of s.vehicles){if(v.planet!==s.planet)continue;
  for(let n=0;n<steps;n++){
   const driving=s.driving===v.id,brake=!!(input.brake||input.jump),axis=driving&&!brake&&s.resources.energy>0?Math.max(-1,Math.min(1,input.axis||0)):0;
   if(driving&&input.jump)v.vx=0;
   if(axis&&v.grounded){v.vx=Math.max(-ROVER.maxSpeed,Math.min(ROVER.maxSpeed,v.vx+axis*ROVER.acceleration*step));v.facing=Math.sign(axis);s.resources.energy=Math.max(0,s.resources.energy-ROVER.power*step);}
   else{const drop=(brake?ROVER.braking:ROVER.coast)*step;v.vx=Math.sign(v.vx)*Math.max(0,Math.abs(v.vx)-drop);}
   v.vy=Math.min(180,v.vy+config[s.planet].gravity*config.pixelsPerMeter*step);moveRover(sim,v,v.vx*step,false);v.grounded=false;moveRover(sim,v,v.vy*step,true);
   if(v.vy>=0&&blocked(sim,v,v.x,v.y+.06)){v.grounded=true;v.vy=0;}
   if(v.y>(HEIGHT-4)*TILE){v.x=56*UNIT;v.y=sim.world.groundY(v.x)-ROVER.height;v.vx=v.vy=0;sim.emit('vehicle:recovered',{id:v.id});}
  }
  if(s.driving===v.id)attachDriver(sim,v);
 }
}

/** Terrain edits or an old save must not leave a restored rover inside solid rock. */
export function validateVehiclePositions(sim){
 for(const v of sim.s.vehicles){
  if(v.planet!==sim.s.planet||!sim.world.collides(v.x,v.y,ROVER.width,ROVER.height))continue;
  let repaired=false;
  for(let n=0;n<=80&&!repaired;n++)for(const sign of [1,-1]){
   const x=Math.round((v.x+sign*n*TILE)/TILE)*TILE;
   if(x<16||x>WIDTH*TILE-ROVER.width-16)continue;
   const y=Math.min(...Array.from({length:7},(_,i)=>sim.world.groundY(x+i*7)))-ROVER.height;
   if(!blocked(sim,v,x,y)&&!sim.world.inside({x,y})){Object.assign(v,{x,y,vx:0,vy:0,grounded:false});repaired=true;}
  }
  if(!repaired&&sim.s.driving===v.id)sim.s.driving=null;
 }
}

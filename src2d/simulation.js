import {juniorState,trainingObjective,flightChecklist,tickJunior,dustPhase} from './junior-mission.js';
import config from '../data/pixel-config.json' with {type:'json'};
import {PixelWorld,TILE,UNIT,WIDTH,HEIGHT,PLAYER_HEIGHT,BLOCK,STATIONS,worldOptions} from './world.js';
import {AstronautAnimator} from './animation.js';
import {createSupport,restoreSupport,tickSupport,habitatAction} from './life-support.js';
import {craftItem,placementPreview,placeCrafted,useItem,PANEL_POWER} from './crafting.js';
import {marsObjective,discoverySites,inspectDiscovery,finishMarsReport,DISCOVERIES} from './expedition.js';
import {MATERIALS,validSavedBlock,reconcileMaterials,collectMaterial,consumeMaterial,availableMaterials} from './block-materials.js';
import {analyzeStructure,settleStructures,tickCollapses} from './structural-physics.js';
import {fallImpact} from './fall-damage.js';
import {WorldMap} from './map-system.js';
import {restoreVehicles,drivingVehicle,tickVehicles,enterRover,exitRover,playerHitsVehicle,validateVehiclePositions} from './vehicles.js';
export const SAVE_KEY='orbita-frontier-save-v1';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function createState(profile={},seed=null,generation=3){
 return {
  schema:2,worldVersion:Number.isInteger(seed)&&seed>=0&&seed<=0xffffffff?(generation===4?4:3):1,worldSeed:Number.isInteger(seed)?seed>>>0:0,
  equipment:{pickaxe:1,suited:true},
  profile:{name:String(profile.name||'Alex').trim().slice(0,18)||'Alex',color:clamp(Math.floor(Number(profile.color)||0),0,3),skin:['#e9b38b','#bf815b','#805138'].includes(profile.skin)?profile.skin:'#e9b38b',hair:['#332a28','#9b673e','#ddd8c9'].includes(profile.hair)?profile.hair:'#332a28',visor:profile.visor==='gold'?'gold':'clear',role:['engineer','biologist','explorer'].includes(profile.role)?profile.role:'engineer'},
  planet:'moon',player:{x:26*UNIT,y:33*UNIT-PLAYER_HEIGHT,vx:0,vy:0,facing:1,grounded:true,boostAvailable:true},
  resources:{oxygen:100,energy:85,water:70,health:100},
  inventory:{regolith:0,iron:0,ice:0,samples:0,rations:3,panels:0,panel2:0,panel3:0,lamps:0,beacons:0,batteries:0,repairKits:0,rovers:0},
  materials:{},vehicles:[],driving:null,gameplayVersion:1,
  support:createSupport(),flags:{baseOnline:false,solarOnline:false,analyzed:false,module:false,marsUnlocked:false,marsOnline:false,marsAnalyzed:false,marsReport:false,returnReady:false,earthDeparture:false,returnedEarth:false},
  collected:[],discoveries:[],fixtures:[],worlds:{moon:{},mars:{}},elapsed:0,log:[],solarPanels:[],version:1
 };
}
export function restoreState(raw){
 if(!raw||![1,2].includes(raw.schema)||!['moon','mars'].includes(raw.planet)||!raw.player||!raw.resources||!raw.inventory||!raw.flags)throw new Error('La partida no tiene un formato compatible.');
 if(raw.worldVersion!==undefined&&![1,2,3,4].includes(raw.worldVersion))throw new Error('La versión del mapa no es compatible.');const seeded=raw.worldVersion>=2;if(seeded&&(!Number.isInteger(raw.worldSeed)||raw.worldSeed<0||raw.worldSeed>0xffffffff))throw new Error('La semilla del mapa está dañada.');const s=createState(raw.profile,seeded?raw.worldSeed:null);s.worldVersion=raw.worldVersion||1;s.equipment.suited=raw.equipment?.suited!==false;s.equipment.pickaxe=clamp(Math.floor(Number(raw.equipment?.pickaxe)||1),1,4);s.planet=raw.planet;s.support=restoreSupport(raw.support);s.junior=juniorState(raw.junior||{training:3});
 for(const key of Object.keys(s.resources)){if(!Number.isFinite(raw.resources[key]))throw new Error('Recursos dañados.');s.resources[key]=clamp(raw.resources[key],0,100);}
 for(const key of Object.keys(s.inventory))s.inventory[key]=clamp(Math.floor(Number(raw.inventory[key])||0),0,999);
 for(const key of Object.keys(s.flags))s.flags[key]=raw.flags[key]===true;
 if(s.planet==='mars'&&!s.flags.marsUnlocked)throw new Error('La ruta a Marte aún no está desbloqueada.');
 s.player.x=clamp(Number(raw.player.x)||416,16,(WIDTH-2)*TILE);s.player.y=clamp(Number(raw.player.y)||480,0,(HEIGHT-2)*TILE);s.player.grounded=false;
 s.collected=Array.isArray(raw.collected)?raw.collected.filter(x=>typeof x==='string'&&/^(moon|mars)-sample-[012]$/.test(x)):[];s.collected=[...new Set(s.collected)];s.elapsed=clamp(Number(raw.elapsed)||0,0,1e7);s.log=Array.isArray(raw.log)?raw.log.slice(-40).filter(x=>typeof x==='string').map(x=>x.slice(0,240)):[];
 for(const planet of['moon','mars'])if(raw.worlds?.[planet]&&typeof raw.worlds[planet]==='object')for(const[key,v]of Object.entries(raw.worlds[planet]).slice(0,WIDTH*HEIGHT)){const i=Number(key),old=raw.schema===1,limit=old?320*86:WIDTH*HEIGHT;if(!Number.isInteger(i)||i<0||i>=limit||!Number.isInteger(v)||!validSavedBlock(v))continue;if(old){const x=i%320*2,y=Math.floor(i/320)*2;for(const dx of[0,1])for(const dy of[0,1])s.worlds[planet][(y+dy)*WIDTH+x+dx]=v;}else s.worlds[planet][i]=v;}

 s.materials=Object.fromEntries(Object.keys(MATERIALS).map(id=>[id,Math.max(0,Math.min(999,Math.floor(Number(raw.materials?.[id])||0)))]));reconcileMaterials(s);
 s.vehicles=restoreVehicles(raw.vehicles);s.driving=s.equipment.suited&&s.vehicles.some(v=>v.id===raw.driving&&v.planet===s.planet)?raw.driving:null;
 s.solarPanels=Array.isArray(raw.solarPanels)?raw.solarPanels.slice(0,16).filter(p=>['moon','mars'].includes(p.planet)&&Number.isFinite(p.x)&&p.x>0&&p.x<WIDTH*TILE).map(p=>({planet:p.planet,x:p.x,tier:clamp(Math.floor(Number(p.tier)||1),1,3)})):[];
 s.fixtures=Array.isArray(raw.fixtures)?raw.fixtures.slice(0,48).filter(f=>['lamp','beacon'].includes(f.type)&&['moon','mars'].includes(f.planet)&&Number.isFinite(f.x)&&f.x>0&&f.x<WIDTH*TILE&&Number.isFinite(f.y)&&f.y>=0&&f.y<HEIGHT*TILE).map(f=>({type:f.type,planet:f.planet,x:f.x,y:f.y,charge:clamp(Number(f.charge)||0,0,100)})):[];
 s.discoveries=Array.isArray(raw.discoveries)?[...new Set(raw.discoveries.filter(id=>DISCOVERIES.some(d=>d.id===id)))]:[];
 if(s.flags.returnedEarth&&(!s.flags.returnReady||!s.flags.marsReport))throw new Error('El regreso a la Tierra no tiene un informe y módulo válidos.');return s;
}
export function objective(s){
 if(s.flags.returnedEarth)return marsObjective(s);
 const training=trainingObjective(s);if(training)return training;
 if(s.planet==='mars'&&s.junior&&['warning','active'].includes(dustPhase(s.junior.dustClock)))return{step:9,title:'Vuelve al refugio',detail:'Se acerca polvo. Dentro estarás protegido mientras pasa. Los paneles producirán menos energía.',station:'control',safety:true};
 const solar=s.support?.weather[s.planet]?.phase;if(['warning','active'].includes(solar))return{step:s.planet==='moon'?4:9,title:solar==='warning'?'Busca refugio':'Protege a tu tripulación',detail:'Simulacro solar: regresa al hábitat. Puedes reforzarlo en el depósito; esperar consume provisiones.',station:'storage',safety:true};
 if(s.planet==='mars'){if(!s.flags.marsOnline)return{step:8,title:'Un nuevo hogar',detail:'Activa el control del refugio marciano.',station:'control'};if(!s.flags.marsAnalyzed){if(s.inventory.samples<1)return{step:9,title:'La historia de Marte',detail:'Recoge una roca volcánica al este. Es una pista del pasado de Marte.',sample:true};return{step:10,title:'Conecta los dos mundos',detail:'Estudia la roca que recogiste en el laboratorio. Agua 2 · energía 8.',station:'lab'};}return marsObjective(s);}
 if(!s.flags.baseOnline)return{step:1,title:'Despierta el hábitat',detail:'Acércate al control y pulsa E.',station:'control'};
 const repair=s.profile.role==='engineer'?5:6;
 if(!s.flags.solarOnline){if(s.inventory.regolith<repair)return{step:2,title:'Tus primeros recursos',detail:`Mantén pulsado el pico para reunir ${repair} unidades de regolito. Sal por la derecha.`,mining:true};return{step:3,title:'Luz para vivir',detail:`Repara el campo solar al este. Coste: ${repair} regolitos.`,station:'solar'};}
 if(!s.flags.analyzed){if(s.inventory.samples<3)return{step:4,title:'Mensajes en las rocas',detail:`Recoge las tres muestras: ${s.inventory.samples}/3. Sigue hacia el este.`,sample:true};return{step:5,title:'Ciencia en casa',detail:'Lleva las muestras al laboratorio. El análisis usa agua y energía.',station:'lab'};}
 if(!s.flags.module)return{step:6,title:'El siguiente horizonte',detail:'Fabrica el módulo de viaje: 16 de suelo · 6 hierro · 25 energía.',station:'bench'};
 if(s.junior&&flightChecklist(s).some(c=>!c.ready))return{step:7,title:'Prepara un viaje largo',detail:flightChecklist(s).filter(c=>!c.ready).map(c=>c.es).join(' · '),station:'bench'};
 return{step:7,title:'Rumbo al planeta rojo',detail:'Tu nave está al oeste de la base. Pulsa E para viajar a Marte.',station:'rocket'};
}
export class Simulation{
 constructor(state=createState(),notify=()=>{}){this.s=state;this.notify=notify;this.listeners=new Map();this.events=[];this.eventSequence=0;this.collapses=[];reconcileMaterials(state);this.map=new WorldMap(this);this.world=new PixelWorld(state.planet,state.worlds[state.planet],worldOptions(state));this.animation=new AstronautAnimator();this.cooldown=0;this.jumpQueued=false;this.noticeClock=0;this.world.protectedSites=state.solarPanels.filter(p=>p.planet===state.planet).flatMap(p=>Array.from({length:6},(_,i)=>({x:Math.floor((p.x-8+i*8)/TILE),y:Math.floor(this.world.groundY(p.x-8+i*8)/TILE)})));if(this.world.collides(state.player.x,state.player.y)){state.player.x=26*UNIT;state.player.y=33*UNIT-PLAYER_HEIGHT;}this.checkpoint={x:26*UNIT,y:33*UNIT-PLAYER_HEIGHT};if(!state.equipment.suited&&!this.world.inside(state.player))Object.assign(state.player,{...this.checkpoint,vx:0,vy:0});validateVehiclePositions(this);if(state.driving)tickVehicles(this,0);settleStructures(this);}
 on(type,listener){if(typeof listener!=='function')throw new TypeError('Expected a listener function');if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(listener);return()=>this.listeners.get(type)?.delete(listener);}
 emit(type,detail={}){const event=Object.freeze({...detail,type,sequence:++this.eventSequence,planet:this.s.planet,time:this.s.elapsed});if(this.events.length>=128)this.events.shift();this.events.push(event);for(const listener of this.listeners.get(type)||[]){try{listener(event);}catch(error){if(this.events.length>=128)this.events.shift();this.events.push(Object.freeze({type:'integration:error',sequence:++this.eventSequence,planet:this.s.planet,time:this.s.elapsed,source:type,message:String(error?.message||error).slice(0,240)}));}}return event;}
 drainEvents(){return this.events.splice(0);}
 openMap(){if(this.s.junior?.training===2)this.s.junior.training=3;this.map.setOpen(true);return this.map.snapshot();}
 closeMap(){this.map.setOpen(false);}
 toggleMap(){return this.map.toggle();}
 mapSnapshot(){return this.map.snapshot();}
 setMapWaypoint(x,y){return this.map.setWaypoint(x,y);}
 materialInventory(){return availableMaterials(this.s);}
 vehicleState(){return{driving:this.s.driving,vehicles:this.s.vehicles.map(v=>({...v})),energy:this.s.resources.energy};}
 enterVehicle(id){return enterRover(this,id);}
 exitVehicle(){return exitRover(this);}
 tell(text){this.s.log.push(text);if(this.s.log.length>40)this.s.log.shift();this.notify(text);}
 nearest(){const driving=drivingVehicle(this);if(driving)return{id:driving.id,type:'vehicle',name:'Salir del rover',distance:0};const p=this.s.player,candidates=STATIONS.map(o=>({...o,x:o.x*UNIT+8,y:33*UNIT-13}));for(const v of this.s.vehicles)if(v.planet===this.s.planet)candidates.push({id:v.id,type:'vehicle',name:'Conducir rover / E',x:v.x+24,y:v.y+12});for(const point of this.world.pointsOfInterest())if(!this.s.collected.includes(point.id))candidates.push({...point,type:'sample'});for(const point of discoverySites(this.world))if(!this.s.discoveries.includes(point.id))candidates.push(point);return candidates.map(o=>({...o,distance:Math.hypot(p.x+6-o.x,p.y+PLAYER_HEIGHT/2-o.y)})).filter(o=>o.distance<43).sort((a,b)=>a.distance-b.distance)[0]||null;}
 tick(dt,input={}){
  if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.1,dt);settleStructures(this);
  const s=this.s,p=s.player,w=this.world,previousX=p.x;this.cooldown=Math.max(0,this.cooldown-dt);if(s.resources.health<=0||s.flags.returnedEarth)return;
  tickVehicles(this,dt,input);tickCollapses(this,dt);
  if(!drivingVehicle(this)){
  const desired=clamp(input.axis||0,-1,1)*(input.run?config.mobility.run:config.mobility.walk),rate=p.grounded?12:4;p.vx+=(desired-p.vx)*(1-Math.exp(-rate*dt));if(Math.abs(p.vx)<.05&&desired===0)p.vx=0;if(desired)p.facing=Math.sign(desired);
  if(p.grounded)p.boostAvailable=true;if(input.jump&&p.grounded){p.vy=-config.mobility.jump;p.grounded=false;}else if(input.jump&&s.equipment.suited&&p.boostAvailable&&s.resources.energy>=config.mobility.boostEnergy&&!w.inside(p)){p.vy=-config.mobility.boost;p.boostAvailable=false;s.resources.energy-=config.mobility.boostEnergy;this.lastBoostAt=s.elapsed;}
  const gravity=config[s.planet].gravity*config.pixelsPerMeter;p.vy=Math.min(150,p.vy+gravity*dt);this.move(p.vx*dt,0);p.grounded=false;this.move(0,p.vy*dt);
  // A tiny support probe avoids a one-frame fall inside the collision epsilon.
  if(p.vy>=0&&this.collides(p.x,p.y+.06)){this.land(p.vy);p.grounded=true;p.vy=0;}
  }
  s.elapsed+=dt;
  const inside=w.inside(p),online=s.planet==='moon'?s.flags.baseOnline:s.flags.marsOnline,solar=s.planet==='moon'?s.flags.solarOnline:s.flags.marsOnline,extra=s.solarPanels.filter(a=>a.planet===s.planet).reduce((n,a)=>n+PANEL_POWER[a.tier||1],0);
  s.resources.energy=clamp(s.resources.energy+dt*((solar?config.power.fieldProduction:0)+extra-(online?config.power.habitatUse:config.power.idleUse)),0,100);
  s.resources.oxygen=clamp(s.resources.oxygen+dt*(inside&&online&&s.resources.energy>0&&s.resources.water>0?.65:-config[s.planet].oxygenRate*(s.profile.role==='explorer'?.92:1)*(input.run?1.25:1)),0,100);
  if(online&&s.resources.energy>0){s.resources.water=clamp(s.resources.water-dt*.004,0,100);if(inside&&s.resources.oxygen>15)s.resources.health=clamp(s.resources.health+dt*.15,0,100);}
  if(s.resources.oxygen<=0||s.resources.water<=0)s.resources.health=clamp(s.resources.health-dt*1.4,0,100);
  for(const f of s.fixtures)if(f.planet===s.planet&&f.type==='lamp')f.charge=Math.max(0,f.charge-dt*.04);tickSupport(this,dt,{inside,online});tickJunior(this,dt,input,previousX);this.animation.update(dt,p,{mining:!!this.mining,boost:s.elapsed-(this.lastBoostAt??-10)<.25});
  if(p.y>(HEIGHT-3)*TILE){s.resources.health=Math.max(0,s.resources.health-15);p.x=this.checkpoint.x;p.y=this.checkpoint.y;p.vx=p.vy=0;this.tell('El equipo te devuelve al refugio. La exploración profunda necesita reservas y una ruta de salida. Salud −15.');}
 }
 suitAllows(x,y){return this.s.equipment.suited||this.world.inside({x,y});}
 suitWarning(){if(this.s.elapsed>=(this.suitWarningUntil||0)){this.tell('Ponte el traje antes de salir. Abre la mochila o pulsa T dentro del hábitat.');this.suitWarningUntil=this.s.elapsed+3;}}
 toggleSuit(){const s=this.s;if(!this.world.inside(s.player))return{ok:false,text:'Cambia el traje dentro del hábitat.'};if(s.equipment.suited&&(!(s.planet==='moon'?s.flags.baseOnline:s.flags.marsOnline)||s.resources.energy<=0))return{ok:false,text:'Activa el soporte vital antes de quitarte el traje.'};s.equipment.suited=!s.equipment.suited;const text=s.equipment.suited?'Traje equipado. Comprueba oxígeno y energía antes de salir.':'Traje retirado. Llevas ropa de tripulación; la salida queda bloqueada hasta equiparte.';this.tell(text);return{ok:true,text};}
 tryStep(wanted,direction){
  const p=this.s.player,w=this.world;if(!p.grounded||p.vy<0)return false;
  const top=Math.floor((p.y+PLAYER_HEIGHT-.05)/TILE)*TILE,nextY=top-PLAYER_HEIGHT,rise=p.y-nextY;
  if(!this.suitAllows(wanted,nextY)||rise<=0||rise>TILE+.05||this.collides(p.x,nextY)||this.collides(wanted,nextY))return false;
  const leading=direction>0?wanted+12-.01:wanted;
  if(!w.solidAt(leading,top+.1))return false;
  p.x=wanted;p.y=nextY;return true;
 }
 collides(x,y,w=12,h=PLAYER_HEIGHT){return this.world.collides(x,y,w,h)||playerHitsVehicle(this,x,y,w,h);}
 land(speed){const impact=fallImpact(speed,this.s.planet);if(!impact.damage)return;const before=this.s.resources.health;this.s.resources.health=Math.max(0,before-impact.damage);this.lastFallImpact={...impact,damage:before-this.s.resources.health,health:this.s.resources.health,x:this.s.player.x,y:this.s.player.y};this.emit('fall:damage',this.lastFallImpact);}
 move(dx,dy){
  const p=this.s.player;
  for(const [amount,vertical]of[[dx,false],[dy,true]]){
   if(!amount)continue;const count=Math.max(1,Math.ceil(Math.abs(amount)/(TILE/2))),delta=amount/count;
   for(let i=0;i<count;i++){
    const x=vertical?p.x:clamp(p.x+delta,16,(WIDTH-2)*TILE),y=vertical?p.y+delta:p.y;
    if(!this.suitAllows(x,y)){if(vertical)p.vy=0;else p.vx=0;this.suitWarning();break;}
    if(!this.collides(x,y)){p.x=x;p.y=y;continue;}
    if(!vertical&&this.tryStep(x,Math.sign(delta)))continue;
    for(let n=0;n<Math.ceil(Math.abs(delta)*10);n++){const nx=vertical?p.x:p.x+Math.sign(delta)*.1,ny=vertical?p.y+Math.sign(delta)*.1:p.y;if(this.collides(nx,ny))break;p.x=nx;p.y=ny;}
    if(vertical){if(delta>0){this.land(p.vy);p.grounded=true;}p.vy=0;}else p.vx=0;break;
   }
  }
 }

 canMine(tx,ty){if(!Number.isInteger(tx)||!Number.isInteger(ty))return false;const p=this.s.player,block=this.world.get(tx,ty);if(this.s.resources.health<=0||this.s.driving||this.s.flags.returnedEarth||!this.world.materialAt(tx,ty)||this.world.protected(tx,ty)||Math.hypot((tx+.5)*TILE-(p.x+6),(ty+.5)*TILE-(p.y+13))>76)return false;const sx=p.x+6,sy=p.y+10,dx=(tx+.5)*TILE-sx,dy=(ty+.5)*TILE-sy,n=Math.ceil(Math.hypot(dx,dy)/3);for(let i=1;i<n;i++){const x=Math.floor((sx+dx*i/n)/TILE),y=Math.floor((sy+dy*i/n)/TILE);if((x!==tx||y!==ty)&&this.world.get(x,y))return false;}return true;}
 stopMining(){if(this.mining)this.emit('mining:cancelled',{tx:this.mining.tx,ty:this.mining.ty});this.mining=null;}
 miningSnapshot(){const m=this.mining;return m?{active:true,tx:m.tx,ty:m.ty,material:m.material,elapsed:m.elapsed,needed:m.needed,progress:clamp(m.elapsed/m.needed,0,1)}:{active:false,progress:0};}
 mine(tx,ty,dt=1/60){if(!Number.isFinite(dt)||dt<=0)return false;const p=this.s.player;if(this.cooldown||!this.canMine(tx,ty)){this.stopMining();return false;}const material=this.world.materialAt(tx,ty),block=material.baseBlock,key=tx+','+ty,needed=material.miningSeconds/config.pickaxe.speed[this.s.equipment.pickaxe-1];if(this.mining?.key!==key||this.mining.material!==material.id)this.mining={key,tx,ty,material:material.id,elapsed:0,needed,pulse:-1};this.mining.elapsed+=Math.min(.1,Math.max(0,dt));this.emit('mining:progress',this.miningSnapshot());const pulse=Math.floor(this.mining.elapsed*8);if(pulse!==this.mining.pulse){this.mining.pulse=pulse;const cx=(tx+.5)*TILE,cy=(ty+.5)*TILE,dx=p.x+6-cx,dy=p.y+16-cy,nx=Math.abs(dx)>Math.abs(dy)?Math.sign(dx):0,ny=nx?0:Math.sign(dy)||-1;this.lastMineHit={x:cx+nx*5,y:cy+ny*5,nx,ny,block,time:this.s.elapsed};}if(this.mining.elapsed+1e-8<needed)return false;
  if(this.s.inventory[material.item]>=999||!this.world.set(tx,ty,0))return false;const item=material.item;collectMaterial(this.s,material);this.s.worlds[this.s.planet]=this.world.edits;this.cooldown=.08;this.lastMine={x:(tx+.5)*TILE,y:(ty+.5)*TILE,key:item,time:this.s.elapsed};this.mining=null;this.emit('mining:complete',{tx,ty,material:material.id,item});settleStructures(this);return true;
 }
 mineAhead(dt=1/60){const p=this.s.player;if(this.mining&&this.canMine(this.mining.tx,this.mining.ty))return this.mine(this.mining.tx,this.mining.ty,dt);const candidates=[];for(let y=Math.floor(p.y/TILE)-2;y<=Math.floor((p.y+38)/TILE);y++)for(let x=Math.floor(p.x/TILE)-6;x<=Math.floor(p.x/TILE)+6;x++){if(((x+.5)*TILE-(p.x+6))*p.facing<9&&!(y<Math.floor(p.y/TILE)&&Math.abs((x+.5)*TILE-(p.x+6))<24))continue;if(this.canMine(x,y))candidates.push({x,y,d:Math.hypot((x+.5)*TILE-p.x,(y+.5)*TILE-(p.y+16))});}const a=candidates.sort((a,b)=>a.d-b.d)[0];if(!a){this.stopMining();return false;}return this.mine(a.x,a.y,dt);}

 previewBlock(tx,ty,materialId=null){
  const p=this.s.player;reconcileMaterials(this.s);
  const material=materialId?MATERIALS[materialId]:availableMaterials(this.s).find(m=>m.item==='regolith');
  const fail=reason=>({ok:false,stable:false,reason,tx,ty,material:material?.id});
  if(!Number.isInteger(tx)||!Number.isInteger(ty)||tx<0||tx>=WIDTH||ty<0||ty>=HEIGHT)return fail('bounds');
  if(this.s.resources.health<=0||this.s.flags.returnedEarth||this.s.driving||!this.suitAllows(tx*TILE,ty*TILE-PLAYER_HEIGHT))return fail('unavailable');
  if(!material||!(this.s.materials[material.id]>0))return fail('inventory');
  if(this.world.get(tx,ty)||this.world.protected(tx,ty)||Math.hypot((tx+.5)*TILE-p.x,(ty+.5)*TILE-p.y)>70)return fail('range-or-solid');
  if(tx*TILE<p.x+12&&(tx+1)*TILE>p.x&&ty*TILE<p.y+PLAYER_HEIGHT&&(ty+1)*TILE>p.y||playerHitsVehicle(this,tx*TILE,ty*TILE,TILE,TILE))return fail('occupied');
  const sx=p.x+6,sy=p.y+13,dx=(tx+.5)*TILE-sx,dy=(ty+.5)*TILE-sy,n=Math.ceil(Math.hypot(dx,dy)/3);
  for(let i=1;i<n;i++)if(this.world.solidAt(sx+dx*i/n,sy+dy*i/n))return fail('line-of-sight');
  const key=tx+','+ty+','+material.block;
  if(this.blockPreview?.world===this.world&&this.blockPreview.revision===this.world.revision&&this.blockPreview.key===key)return{...this.blockPreview.result};
  const result=analyzeStructure(this.world,{tx,ty,block:material.block}),stable=result.supported.has(ty*WIDTH+tx),preview={ok:true,stable,reason:stable?null:'unsupported',tx,ty,material:material.id,span:result.supported.get(ty*WIDTH+tx)};
  this.blockPreview={world:this.world,revision:this.world.revision,key,result:preview};return{...preview};
 }
 place(tx,ty,materialId=null){
  const preview=this.previewBlock(tx,ty,materialId);if(!preview.ok)return false;
  const material=MATERIALS[preview.material];if(!this.world.set(tx,ty,material.block))return false;
  consumeMaterial(this.s,material.id);this.s.worlds[this.s.planet]=this.world.edits;settleStructures(this);this.emit('structure:placed',preview);return true;
 }
 interact(){reconcileMaterials(this.s);const result=this.interactWorld();reconcileMaterials(this.s);return result;}

 interactWorld(){if(this.s.resources.health<=0)return null;const item=this.nearest();if(!item)return null;const s=this.s,r=s.resources;
  if(item.type==='vehicle'){const result=s.driving?this.exitVehicle():this.enterVehicle(item.id);this.tell(result.text);return result.ok?'vehicle':'locked';}
  if(item.type==='discovery'){inspectDiscovery(this,item.id);return 'discovery';}
  if(item.type==='sample'){s.collected.push(item.id);s.inventory.samples++;this.tell(s.planet==='moon'?'Muestra guardada. Los impactos mezclan fragmentos de rocas: una brecha cuenta la historia de la Luna.':'Basalto guardado. Las rocas volcánicas ayudan a investigar el pasado de Marte.');return 'sample';}
  if(item.id==='control'){if(s.planet==='moon')s.flags.baseOnline=true;else s.flags.marsOnline=true;this.tell('Hábitat activo. Producir oxígeno y reciclar agua necesita electricidad: revisa la batería.');return 'control';}
  if(item.id==='solar'){if(s.flags.solarOnline){this.tell('Paneles operativos. Más superficie solar permite producir más energía; fabricarla cuesta materiales.');return 'solar';}const cost=s.profile.role==='engineer'?5:6;if(s.inventory.regolith<cost){this.tell(`Necesitas ${cost} regolitos para los anclajes y la reparación.`);return 'locked';}s.inventory.regolith-=cost;s.flags.solarOnline=true;this.tell('Campo reparado. La batería recibe energía solar. Los paneles representan sistemas simplificados, no producción NASA medida.');return 'solar';}
  if(item.id==='eva'){const result=this.toggleSuit();if(!result.ok)this.tell(result.text);return result.ok?'suit':'locked';}
  if(item.id==='lab'){if(s.planet==='mars'&&s.flags.marsAnalyzed&&!s.flags.marsReport&&s.discoveries.length===3){const result=finishMarsReport(this);if(!result.ok)this.tell(result.text);return result.ok?'report':'locked';}const mars=s.planet==='mars',done=mars?s.flags.marsAnalyzed:s.flags.analyzed,need=mars?1:3,water=mars?2:s.profile.role==='biologist'?3:4,energy=mars?8:12;if(done){this.tell('Análisis completado. Los datos se conservan; repetirlo no genera recompensas ilimitadas.');return 'lab';}if(s.inventory.samples<need||r.water<water||r.energy<energy){this.tell(`Analizar requiere ${need} muestras, ${water} agua y ${energy} energía.`);return 'locked';}s.inventory.samples-=need;r.water-=water;r.energy-=energy;if(mars)s.flags.marsAnalyzed=true;else s.flags.analyzed=true;this.tell(mars?'¡Enlace científico establecido! Has conectado dos mundos manteniendo vivo a tu equipo.':'Investigación completada. Ya puedes fabricar el módulo de viaje en el banco de trabajo.');return 'lab';}
  if(item.id==='storage'){if(s.inventory.ice>0&&r.energy>=3){s.inventory.ice--;r.energy-=3;r.water=Math.min(100,r.water+15);this.tell('Hielo procesado: agua +15 y energía −3. Encontrar hielo utilizable depende del lugar; aquí es una simplificación educativa.');}else this.tell('Depósito: convierte 1 hielo y 3 energía en agua. Usa una ración desde el inventario para recuperar salud.');return 'storage';}
  if(item.id==='bench')return 'craft';
  if(item.id==='rocket'){if(s.planet==='mars'&&s.flags.returnReady&&s.flags.marsReport){s.flags.earthDeparture=true;return 'return';}if(!s.flags.module||s.planet==='mars'){this.tell(s.planet==='mars'?'La nave queda como refugio de la expedición. Tu siguiente objetivo está en el hábitat.':'Antes de despegar, investiga y construye el módulo de viaje en el banco.');return 'locked';}if(s.junior){const missing=flightChecklist(s).filter(c=>!c.ready);if(missing.length){this.tell('Antes de viajar: '+missing.map(c=>c.es).join(' · '));return 'locked';}}s.flags.marsUnlocked=true;return 'travel';}return null;
 }
 craft(id){return craftItem(this,id);}
 previewPlacement(id,x,y){return placementPreview(this,id,x,y);}
 placeCrafted(id,x,y){return placeCrafted(this,id,x,y);}
 use(id){return useItem(this,id);}
 pickaxeUpgrade(){const level=this.s.equipment.pickaxe;return level>=4?null:config.pickaxe.upgrades[level-1];}
 upgradePickaxe(){reconcileMaterials(this.s);const s=this.s,p=s.player,cost=this.pickaxeUpgrade();if(!cost)return{ok:false,text:'El pico ya está en su nivel máximo: IV.'};if(s.resources.health<=0||!this.world.inside(p)||Math.hypot(p.x-35*UNIT,p.y-(33*UNIT-PLAYER_HEIGHT))>64)return{ok:false,text:'Acércate al banco de fabricación dentro de la base.'};if(s.inventory.regolith<cost.regolith||s.inventory.iron<cost.iron||s.resources.energy<cost.energy)return{ok:false,text:`Necesitas ${cost.regolith} regolitos, ${cost.iron} hierro y ${cost.energy} energía.`};s.inventory.regolith-=cost.regolith;s.inventory.iron-=cost.iron;s.resources.energy-=cost.energy;s.equipment.pickaxe++;reconcileMaterials(s);this.stopMining();const text=`Pico mejorado a nivel ${['I','II','III','IV'][s.equipment.pickaxe-1]}. Picas más rápido, pero gastaste materiales y energía.`;this.tell(text);return{ok:true,text};}
 manageHabitat(id){reconcileMaterials(this.s);const result=habitatAction(this,id);reconcileMaterials(this.s);if(result.ok)this.tell(result.text);return result;}
 eat(){if(this.s.inventory.rations<1||(this.s.resources.health>=100&&this.s.support.nutrition>=95))return false;this.s.inventory.rations--;this.s.resources.health=Math.min(100,this.s.resources.health+25);this.s.support.nutrition=Math.min(100,this.s.support.nutrition+30);this.tell('Ración utilizada: nutrición +30 y salud +25. Las provisiones son limitadas.');return true;}
 arriveMars(){if(!this.s.flags.marsUnlocked||this.s.planet!=='moon'||this.s.flags.returnedEarth)return false;reconcileMaterials(this.s);this.s.driving=null;this.stopMining();this.collapses.length=0;this.s.worlds[this.s.planet]=this.world.edits;this.s.planet='mars';this.world=new PixelWorld('mars',this.s.worlds.mars,worldOptions(this.s,'mars'));Object.assign(this.s.player,{x:26*UNIT,y:33*UNIT-PLAYER_HEIGHT,vx:0,vy:0,grounded:true});this.s.equipment.suited=true;validateVehiclePositions(this);settleStructures(this);this.s.resources.oxygen=Math.max(70,this.s.resources.oxygen);this.s.resources.energy=Math.max(65,this.s.resources.energy);this.tell('Marte: su atmósfera es tenue y no respirable. El traje sigue siendo necesario; la gravedad es mayor que en la Luna.');return true;}
 arriveEarth(){if(this.s.flags.returnedEarth||this.s.planet!=='mars'||!this.s.flags.earthDeparture||!this.s.flags.returnReady||!this.s.flags.marsReport)return false;this.s.driving=null;this.stopMining();this.s.flags.returnedEarth=true;this.s.equipment.suited=false;tickJunior(this,0,{},this.s.player.x);this.tell('Regreso a la Tierra completado. Tus muestras, observaciones y decisiones forman el informe final.');return true;}
 rescue(){reconcileMaterials(this.s);this.s.driving=null;this.stopMining();this.s.resources.health=100;this.s.support.nutrition=Math.max(50,this.s.support.nutrition);this.s.resources.oxygen=85;this.s.resources.energy=Math.max(35,this.s.resources.energy);this.s.resources.water=Math.max(25,this.s.resources.water);this.s.inventory.regolith=Math.max(0,this.s.inventory.regolith-5);reconcileMaterials(this.s);Object.assign(this.s.player,{...this.checkpoint,vx:0,vy:0});this.tell('Rescate de entrenamiento: vuelves al hábitat. Se gastaron cinco regolitos de suministros.');}
}

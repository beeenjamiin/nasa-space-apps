import {Simulation,createState} from './simulation.js';
import {BLOCK,TILE,WIDTH,HEIGHT,PLAYER_HEIGHT} from './world.js';

export const TRAINING_STAGES=[
 {id:'medical',title:'Evaluación médica',instruction:'Camina al escáner iluminado y pulsa E. Quédate quieto durante la lectura.',lesson:'Moverse y detenerse con precisión permite utilizar las estaciones.'},
 {id:'psych',title:'Evaluación psicológica',instruction:'Coopera con control: visita la luz encendida y pulsa E. Sigue las tres señales en orden.',lesson:'Observa la señal activa. No hace falta correr: comunícate con tu equipo.'},
 {id:'centrifuge',title:'Centrifugadora',instruction:'Activa el equipo con E. Compensa la flecha dorada con A/D o los controles de movimiento.',lesson:'Dosifica la dirección como al controlar el movimiento del astronauta. Acumula cuatro segundos estables.'},
 {id:'pool',title:'Piscina de flotabilidad neutra',instruction:'Muévete y salta para tocar las tres boyas iluminadas, en orden.',lesson:'La piscina simula parte del trabajo en baja gravedad. No elimina la gravedad: es un ejercicio simplificado.'},
 {id:'survival',title:'Supervivencia',instruction:'Abre la mochila (I), usa una ración y camina al refugio iluminado. Pulsa E para asegurar la zona.',lesson:'Las provisiones son limitadas. Comer recupera nutrición y salud; el refugio protege al equipo.'},
 {id:'pressure',title:'Cámara de presión',instruction:'Equipa el traje (T). Activa el control (E), visita la válvula exterior y vuelve al control.',lesson:'El traje permite salir. Vigila el oxígeno y vuelve al soporte vital para recuperarlo.'},
 {id:'navigation',title:'Orientación espacial',instruction:'Abre el mapa (M), marca la baliza y sigue el rumbo. Pulsa E al llegar.',lesson:'El destino marcado y su dirección te ayudan a encontrar el camino de vuelta.'},
 {id:'technical',title:'Capacitación técnica',instruction:'Acércate al bloque de práctica y mantén F o el pico. En el banco abre el taller (C), fabrica una lámpara y colócala.',lesson:'Picar requiere tiempo. Fabricar consume materiales; colocar el equipo es una acción diferente.'}
];
export const TRAINING_FLOOR=528;
const groundY=TRAINING_FLOOR-PLAYER_HEIGHT;
class TrainingSimulation extends Simulation{
 gravity(){return this.trainingStage==='pool'?18:110;}
}

/** Disposable training state; all movement, collisions, tools and recipes use the game systems. */
export class TrainingSession{
 constructor(profile,notify=()=>{}){this.profile=profile;this.notify=notify;this.index=0;this.completed=[];this.enter();}
 get stage(){return TRAINING_STAGES[this.index];}
 get approved(){return this.completed.length===TRAINING_STAGES.length;}
 enter(){
  const s=createState(this.profile);s.flags.baseOnline=true;s.junior=null;s.equipment.suited=this.index>=3;
  const sim=this.sim=new TrainingSimulation(s,text=>{this.feedback=text;this.notify(text);});sim.trainingStage=this.stage.id;
  // A bounded indoor practice room, built on PixelWorld's existing tile/collision system.
  const w=sim.world;w.tiles.fill(BLOCK.AIR);w.edits={};w.placed.clear();w.dirtyChunks.clear();w.revision++;
  for(let y=66;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++)w.tiles[y*WIDTH+x]=BLOCK.FLOOR;
  for(let y=0;y<66;y++)for(const x of[38,96])w.tiles[y*WIDTH+x]=BLOCK.HULL;
  w.inside=p=>p.x>304&&p.x<=(this.stage.id==='pressure'?600:768)&&p.y>280;
  w.protected=(x,y)=>!(this.stage.id==='technical'&&x===62&&y===65);
  w.pointsOfInterest=()=>[];
  Object.assign(s.player,{x:416,y:groundY,vx:0,vy:0,grounded:true});
  this.elapsed=0;this.progress=0;this.step=0;this.active=false;this.passed=false;this.panel=null;this.feedback=this.stage.lesson;this.mineDone=false;this.mapUsed=false;
  sim.on('mining:complete',()=>{this.mineDone=true;this.feedback='Bloque recuperado. Acércate al banco: C abre el taller.';});
  if(this.stage.id==='technical'){s.inventory.regolith=2;s.inventory.iron=1;w.tiles[65*WIDTH+62]=BLOCK.DUST;}
  if(this.stage.id==='survival'){s.support.nutrition=25;s.resources.health=65;this.rationsBefore=s.inventory.rations;}
  if(this.stage.id==='pressure')s.equipment.suited=false;
 }
 target(){const id=this.stage.id;
  if(id==='psych')return{x:[480,640,528][Math.min(2,this.step)],y:TRAINING_FLOOR};
  if(id==='pool')return{x:[480,560,656][Math.min(2,this.step)],y:[478,450,470][Math.min(2,this.step)]};
  return{x:id==='medical'?480:id==='survival'?672:id==='navigation'?704:id==='pressure'?(this.step===1?672:528):560,y:TRAINING_FLOOR};
 }
 near(x=this.target().x){return Math.abs(this.sim.s.player.x+6-x)<30&&Math.abs(this.sim.s.player.y-groundY)<12;}
 pass(text){if(this.passed)return;this.passed=true;this.panel=null;this.sim.closeMap();this.completed.push(this.stage.id);this.feedback=text+' '+this.stage.lesson;}
 next(){if(!this.passed||this.approved)return false;this.index++;this.enter();return true;}
 interact(){
  if(this.passed)return;
  if(!this.near()){this.feedback='Acércate a la señal iluminada. Usa A/D, flechas o los botones de movimiento.';return;}
  const id=this.stage.id,s=this.sim.s;
  if(id==='medical'||id==='centrifuge'){this.active=true;this.feedback=id==='medical'?'Lectura en curso: suelta los controles y permanece en el escáner.':'Compensa la flecha: dirección contraria. La barra verde muestra estabilidad.';}
  if(id==='psych'){this.step++;this.feedback='Señal recibida. Busca la siguiente luz.';if(this.step===3)this.pass('Coordinación completada.');}
  if(id==='survival'){if(s.inventory.rations>=this.rationsBefore){this.feedback='Primero usa una ración desde la mochila (I).';return;}this.pass('Provisiones utilizadas y refugio asegurado.');}
  if(id==='pressure'){
   if(!s.equipment.suited){this.feedback='Equipa el traje con T antes de abrir la cámara.';return;}
   if(this.step===0){this.step=1;this.feedback='Cámara abierta. Ve a la válvula dorada y pulsa E. Oxígeno en consumo.';}
   else if(this.step===1){this.step=2;this.feedback='Válvula cerrada. Regresa al control de soporte vital.';}
   else this.pass('Cámara sellada y tripulación a salvo.');
  }
  if(id==='navigation'){if(!this.mapUsed||!this.sim.map.waypoints.moon){this.feedback='Abre M y marca primero el destino en el mapa.';return;}this.pass('Baliza localizada con el mapa.');}
 }
 action(id){
  if(this.passed)return;
  if(id==='interact')this.interact();
  if(id==='suit'){const r=this.sim.toggleSuit();this.feedback=r.text;}
  if(id==='inventory'||id==='craft'||id==='map'){
   this.panel=this.panel===id?null:id;this.sim.closeMap();if(this.panel==='map'){this.sim.openMap();this.mapUsed=true;}
  }
  if(id==='pause'){this.panel=null;this.sim.closeMap();}
 }
 useRation(){if(this.panel==='inventory'){this.sim.eat();this.panel=null;}}
 markWaypoint(){if(this.panel==='map'){this.sim.setMapWaypoint(704,TRAINING_FLOOR);this.feedback='Destino marcado: baliza al este →. Cierra el mapa y camina hasta ella.';this.panel=null;this.sim.closeMap();}}
 craftLamp(){if(this.panel!=='craft')return;const r=this.sim.craft('lamp');this.feedback=r.text;if(r.ok)this.panel=null;}
 deployLamp(){const s=this.sim.s,r=this.sim.placeCrafted('lamps',s.player.x+40,TRAINING_FLOOR);this.feedback=r.text;if(r.ok&&this.mineDone)this.pass('Lámpara fabricada y desplegada con materiales reales.');}
 force(){return Math.sin(this.elapsed*.8)>=0?1:-1;}
 tick(dt,input={}){
  if(this.passed||this.panel)return;dt=Math.min(.1,Math.max(0,dt));if(!dt)return;
  this.elapsed+=dt;const s=this.sim.s,p=s.player,id=this.stage.id;
  this.sim.tick(dt,id==='centrifuge'&&this.active?{}:input);
  if(id==='medical'&&this.active){this.progress=this.near()&&Math.abs(p.vx)<2?this.progress+dt:0;if(this.progress>=2)this.pass('Lectura médica completada.');}
  if(id==='centrifuge'&&this.active){const stable=(input.axis||0)*this.force()<-.3;this.progress=Math.max(0,this.progress+dt*(stable?1:-.5));if(this.progress>=4)this.pass('Control de orientación estable.');}
  if(id==='pool'){const t=this.target();if(Math.hypot(p.x+6-t.x,p.y+17-t.y)<26&&!p.grounded){this.step++;this.feedback='Boya alcanzada. Controla el siguiente salto.';if(this.step===3)this.pass('Recorrido de flotabilidad completado.');}}
  if(id==='pressure'&&this.step>0&&!this.passed){s.resources.oxygen=Math.max(0,s.resources.oxygen-dt*2);if(s.resources.oxygen<12){this.feedback='Reserva baja: el instructor te devuelve al control. Repite con una ruta más corta.';Object.assign(p,{x:416,y:groundY,vx:0,vy:0});s.resources.oxygen=100;this.step=0;}}
  if(id==='technical'&&input.mine){if(!this.mineDone)this.sim.mine(62,65,dt);}else this.sim.stopMining();
 }
}

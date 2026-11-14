import config from '../data/pixel-config.json' with {type:'json'};
/** Child-facing progression. All timings, scores and costs below are game parameters. */
export const BADGES=[
 ['training','Cadete espacial','Space cadet',s=>s.junior?.training>=3],
 ['power','Guardián de la base','Base guardian',s=>s.flags.baseOnline&&s.flags.solarOnline],
 ['science','Detective de rocas','Rock detective',s=>s.flags.analyzed],
 ['mars','Explorador de Marte','Mars explorer',s=>s.planet==='mars'],
 ['report','Equipo de descubrimiento','Discovery team',s=>s.flags.marsReport],
 ['home','Misión cumplida','Mission accomplished',s=>s.flags.returnedEarth]
];
export function juniorState(raw){return{training:Math.max(0,Math.min(3,Math.floor(Number(raw?.training))||0)),walk:Math.max(0,Math.min(50,Number(raw?.walk)||0)),badges:[...new Set((Array.isArray(raw?.badges)?raw.badges:[]).filter(id=>BADGES.some(b=>b[0]===id)))],dustClock:Math.max(0,Math.min(1e7,Number(raw?.dustClock)||0))};}
export function trainingObjective(s){
 if(!s.junior||s.junior.training>=3)return null;
 return [
 {step:0,title:'¡Hola, cadete!',detail:'Tu equipo te eligió para explorar. Camina un poco: A/D o el joystick. En NASA, los astronautas entrenan antes de viajar.'},
 {step:0,title:'Un pequeño salto',detail:'Pulsa salto. La Luna tira de ti con menos fuerza que la Tierra. Aterriza antes de seguir.'},
 {step:0,title:'Encuentra tu hogar',detail:'Abre el mapa con M o el botón Mapa. Busca la casa: es tu refugio y tu reserva de aire.'}
 ][s.junior.training];
}
export function flightChecklist(s){return[
 {id:'research',ready:s.flags.analyzed,es:'Estudiar las tres rocas lunares',en:'Study three Moon rocks'},
 {id:'power',ready:s.flags.solarOnline,es:'Reparar los paneles de la base',en:'Repair the base solar panels'},
 {id:'beacon',ready:s.inventory.beacons>0,es:'Llevar una baliza para marcar el camino',en:'Pack a beacon to mark your route'},
 {id:'food',ready:s.inventory.rations>=2,es:'Llevar dos raciones de comida',en:'Pack two food rations'},
 {id:'water',ready:s.resources.water>=35,es:'Reservar al menos 35 de agua',en:'Keep at least 35 water'},
 {id:'energy',ready:s.resources.energy>=40,es:'Cargar al menos 40 de energía',en:'Charge at least 40 energy'}
 ];}
export function dustPhase(clock){const t=clock%600;return t<300?'quiet':t<325?'warning':t<370?'active':'clear';}
export function tickJunior(sim,dt,input,previousX){
 const s=sim.s,j=s.junior;if(!j)return;
 if(j.training===0){j.walk+=Math.abs(s.player.x-previousX);if(j.walk>=32){j.training=1;sim.tell('¡Buen comienzo! Ahora prueba un salto.');}}
 else if(j.training===1&&input.jump&&s.player.vy<0){j.training=2;sim.tell('¡Salto conseguido! Abre el mapa para encontrar tu base.');}
 for(const[id,es,,check]of BADGES)if(!j.badges.includes(id)&&check(s)){j.badges.push(id);sim.tell('★ Medalla: '+es+' · +100 puntos de exploración');}
 if(s.planet!=='mars'||!s.flags.marsOnline)return;
 const before=dustPhase(j.dustClock);j.dustClock+=dt;const phase=dustPhase(j.dustClock);
 if(phase!==before)sim.tell(phase==='warning'?'AVISO: se acerca polvo. Vuelve a la base: los paneles recibirán menos luz.':phase==='active'?'Tormenta de polvo: busca refugio. Tu traje trabaja más y consume más energía.':'El polvo se despeja. Ya puedes continuar tu expedición.');
 // Dust is not a hurricane: reduced sunlight and equipment demand are the hazards.
 if(phase==='active'){
  const production=config.power.fieldProduction+s.solarPanels.filter(p=>p.planet==='mars').reduce((n,p)=>n+config.power.panelRates[p.tier||1],0);
  s.resources.energy=Math.max(0,s.resources.energy-dt*production*.7);
  if(!sim.world.inside(s.player)){s.resources.energy=Math.max(0,s.resources.energy-dt*.08);if(s.resources.energy===0)s.resources.health=Math.max(0,s.resources.health-dt*.3);}
 }
}

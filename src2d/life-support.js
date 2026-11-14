/** Normalized training parameters, never radiation doses or NASA telemetry. */
import config from '../data/pixel-config.json' with {type:'json'};
export const SUPPORT_TUNING=Object.freeze(config.support);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function createSupport(){return{nutrition:85,exposure:0,seeds:SUPPORT_TUNING.initialSeeds,shield:{moon:false,mars:false},crops:{moon:null,mars:null},weather:{moon:{clock:0,phase:'quiet'},mars:{clock:0,phase:'quiet'}}};}
export function restoreSupport(raw){const s=createSupport();if(!raw)return s;for(const k of['nutrition','exposure'])if(Number.isFinite(raw[k]))s[k]=clamp(raw[k],0,100);s.seeds=clamp(Math.floor(Number(raw.seeds)),0,SUPPORT_TUNING.initialSeeds);if(!Number.isFinite(s.seeds))s.seeds=SUPPORT_TUNING.initialSeeds;for(const planet of['moon','mars']){s.shield[planet]=raw.shield?.[planet]===true;const crop=raw.crops?.[planet];if(Number.isFinite(crop?.remaining))s.crops[planet]={remaining:clamp(crop.remaining,0,SUPPORT_TUNING.cropSeconds)};const weather=raw.weather?.[planet];if(Number.isFinite(weather?.clock)){const clock=clamp(weather.clock,0,1e7);s.weather[planet]={clock,phase:solarPhase(clock)};}}return s;}
export function solarPhase(clock){return clock<SUPPORT_TUNING.solarWarningAt?'quiet':clock<SUPPORT_TUNING.solarActiveAt?'warning':clock<SUPPORT_TUNING.solarEndsAt?'active':'clear';}
export function radiationTransmission(s,inside){return inside?(s.support.shield[s.planet]?SUPPORT_TUNING.reinforcedTransmission:SUPPORT_TUNING.shelterTransmission):1;}
export function tickSupport(sim,dt,{inside,online}){
 const s=sim.s,r=s.resources,life=s.support,weather=life.weather[s.planet];
 life.nutrition=clamp(life.nutrition-dt*SUPPORT_TUNING.nutritionRate,0,100);if(life.nutrition===0)r.health=clamp(r.health-dt*.3,0,100);
 if(online)weather.clock+=dt;const phase=solarPhase(weather.clock);
 if(phase!==weather.phase){weather.phase=phase;if(phase==='warning')sim.tell('SIMULACRO SOLAR: busca el hábitat. Las partículas energéticas pueden elevar el riesgo de radiación. Puedes reforzar el refugio con materiales.');if(phase==='active')sim.tell('SIMULACRO ACTIVO: suspende la salida. Dentro recibes menos exposición; un refugio reforzado reduce más el riesgo. No es un evento NASA en tiempo real.');if(phase==='clear')sim.tell('Simulacro terminado. El blindaje usa materiales y la espera consume provisiones. La radiación real necesita instrumentos y protocolos de misión.');}
 if(phase==='active'){const factor=radiationTransmission(s,inside);life.exposure=clamp(life.exposure+dt*SUPPORT_TUNING.radiationRate*factor,0,100);r.health=clamp(r.health-dt*SUPPORT_TUNING.radiationHealthRate*factor,0,100);}
 const crop=life.crops[s.planet];if(crop&&online&&r.energy>=SUPPORT_TUNING.cropPower*dt){r.energy-=SUPPORT_TUNING.cropPower*dt;crop.remaining=Math.max(0,crop.remaining-dt);if(crop.remaining<1e-7){life.crops[s.planet]=null;s.inventory.rations++;sim.tell('Cosecha lista: ración +1. Gastaste una semilla, agua y energía para iluminar el cultivo. Doce segundos representan un ciclo largo ficticio.');}}
}
export function habitatAction(sim,id){
 const s=sim.s,r=s.resources,life=s.support;
 if(r.health<=0||!sim.world.inside(s.player)||Math.abs(s.player.x-39*16)>100)return{ok:false,text:'Acércate al depósito de suministros dentro del hábitat.'};
 if(!(s.planet==='moon'?s.flags.baseOnline:s.flags.marsOnline))return{ok:false,text:'Activa primero el control del hábitat.'};
 if(id==='shield'){
  if(life.shield[s.planet])return{ok:false,text:'Este refugio ya tiene su revestimiento protector.'};
  if(s.inventory.regolith<SUPPORT_TUNING.shieldRegolith||s.inventory.iron<SUPPORT_TUNING.shieldIron)return{ok:false,text:'Reforzar requiere 8 regolitos y 2 hierro. Esos materiales también sirven para fabricar.'};
  s.inventory.regolith-=SUPPORT_TUNING.shieldRegolith;s.inventory.iron-=SUPPORT_TUNING.shieldIron;life.shield[s.planet]=true;
  return{ok:true,text:'Refugio reforzado. Los materiales atenúan partículas; el juego no simula un escudo energético ni elimina toda la radiación.'};
 }
 if(id==='grow'){
  if(life.crops[s.planet])return{ok:false,text:'Ya hay un cultivo creciendo; no se cobra otro ciclo.'};
  if(life.seeds<1||s.inventory.rations>=6)return{ok:false,text:life.seeds<1?'No quedan semillas. Las provisiones de esta expedición son limitadas.':'El almacén de alimentos está lleno: máximo seis raciones.'};
  if(r.water<SUPPORT_TUNING.cropWater||r.energy<SUPPORT_TUNING.cropEnergy)return{ok:false,text:'Cultivar requiere 6 agua, 4 energía y una semilla; las luces consumen más energía durante el crecimiento.'};
  r.water-=SUPPORT_TUNING.cropWater;r.energy-=SUPPORT_TUNING.cropEnergy;life.seeds--;life.crops[s.planet]={remaining:SUPPORT_TUNING.cropSeconds};
  return{ok:true,text:'Cultivo iniciado. Necesita luz y una base operativa; si se agota la electricidad, deja de crecer.'};
 }
 return{ok:false,text:'Operación no disponible.'};
}

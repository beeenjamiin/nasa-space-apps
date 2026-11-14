export const DISCOVERIES=[
 {id:'mars-layers',x:90,title:'Archivo de las capas',description:'Las capas de sedimentos guardan pistas sobre ambientes antiguos. Una roca estratificada no demuestra por sí sola que hubiera vida.',source:'mars-layers'},
 {id:'mars-water',x:124,title:'Huellas del agua antigua',description:'Algunos minerales pueden formarse o alterarse en presencia de agua. Son pistas del pasado: no significan que puedas beber agua de la superficie.',source:'mars-water'},
 {id:'mars-ice',x:160,title:'Cartografía del hielo',description:'El hielo del subsuelo es una posible reserva para explorar Marte. En este mapa ficticio recuperaste tres muestras congeladas; tratarlas aún requiere energía.',source:'mars-ice'}
];
export function discoverySites(world){return world.planet==='mars'?DISCOVERIES.map(d=>({...d,type:'discovery',name:d.title,x:d.x*16+8,y:world.surfaceAt(d.x*2+1)*8-8})):[];}
export function hasSurveyBeacon(s){return s.fixtures.some(f=>f.planet==='mars'&&f.type==='beacon'&&DISCOVERIES.some(d=>s.discoveries.includes(d.id)&&Math.abs(f.x-d.x*16)<70));}
export function marsObjective(s){
 if(s.flags.returnedEarth)return{step:19,title:'De vuelta en casa',detail:'Tu informe ha llegado a la Tierra. La expedición está completa.',complete:true};
 if(!s.flags.marsAnalyzed)return null;
 if(!s.inventory.beacons&&!hasSurveyBeacon(s))return{step:11,title:'Preparar la expedición',detail:'Fabrica una baliza en el banco antes de explorar los tres lugares científicos.',station:'bench'};
 const next=DISCOVERIES.find(d=>!s.discoveries.includes(d.id));if(next)return{step:12+DISCOVERIES.indexOf(next),title:next.title,detail:'Explora al este y pulsa E junto al afloramiento. Lleva tu baliza.',discovery:next.id};
 if(!hasSurveyBeacon(s))return{step:15,title:'Una señal para la ciencia',detail:'Coloca manualmente tu baliza junto a uno de los tres lugares estudiados.',discovery:'mars-ice'};
 if(!s.flags.marsReport)return{step:16,title:'Conecta los descubrimientos',detail:'Regresa al laboratorio. Preparar el informe usa 4 agua y 12 energía.',station:'lab'};
 if(!s.flags.returnReady)return{step:17,title:'Preparar el regreso',detail:'Fabrica el módulo de regreso en el banco: 16 regolitos, 6 hierro, 2 hielo, 4 agua y 25 energía.',station:'bench'};
 return{step:18,title:'El camino a casa',detail:'Ponte el traje y vuelve a la nave al oeste. Pulsa E para regresar a la Tierra.',station:'rocket'};
}
export function inspectDiscovery(sim,id){
 const s=sim.s,d=DISCOVERIES.find(d=>d.id===id);if(!d||s.discoveries.includes(id))return false;
 s.discoveries.push(id);if(id==='mars-ice')s.inventory.ice=Math.min(999,s.inventory.ice+3);sim.tell(d.description+' Ubicación y muestra: simulación educativa.');return true;
}
export function finishMarsReport(sim){
 const s=sim.s;if(s.flags.marsReport)return{ok:false,text:'El informe ya está archivado.'};
 if(!DISCOVERIES.every(d=>s.discoveries.includes(d.id))||!hasSurveyBeacon(s))return{ok:false,text:'Estudia los tres lugares y coloca una baliza junto a uno de ellos.'};
 if(s.resources.water<4||s.resources.energy<12)return{ok:false,text:'El informe necesita 4 agua y 12 energía.'};
 s.resources.water-=4;s.resources.energy-=12;s.flags.marsReport=true;const text='Informe completo. Ya puedes preparar el módulo de regreso a la Tierra.';sim.tell(text);return{ok:true,text};
}

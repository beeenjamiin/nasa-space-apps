import catalog from '../data/pixel-items.json' with {type:'json'};
import config from '../data/pixel-config.json' with {type:'json'};
import {TILE,UNIT,PLAYER_HEIGHT,BLOCK} from './world.js';
export const ITEMS=catalog.items,RECIPES=catalog.recipes;
export const PANEL_POWER=config.power.panelRates;
export function costText(cost){return Object.entries(cost).map(([key,n])=>`${n} ${ITEMS[key]?.name.toLowerCase()||({energy:'energía',water:'agua'}[key]||key)}`).join(' · ');}
export function craftItem(sim,id){
 const s=sim.s,p=s.player,recipe=RECIPES[id];
 if(!recipe)return{ok:false,text:'Receta no disponible.'};
 if(s.resources.health<=0||!sim.world.inside(p)||Math.hypot(p.x-35*UNIT,p.y-(33*UNIT-PLAYER_HEIGHT))>64)return{ok:false,text:'Acércate al banco de fabricación dentro de la base.'};
 if(recipe.requires&&!s.flags[recipe.requires])return{ok:false,text:recipe.requires==='marsReport'?'Completa el informe de los tres descubrimientos marcianos.':recipe.requires==='marsAnalyzed'?'Primero analiza una muestra marciana.':'Primero analiza las tres muestras lunares.'};
 if(recipe.flag&&s.flags[recipe.flag])return{ok:false,text:'Este módulo ya está instalado.'};
 if(recipe.output&&s.inventory[recipe.output]>=24)return{ok:false,text:'Ya tienes suficientes unidades de este objeto en la mochila.'};
 for(const[key,n]of Object.entries(recipe.cost))if((key in s.resources?s.resources[key]:s.inventory[key])<n)return{ok:false,text:'Necesitas '+costText(recipe.cost)+'.'};
 for(const[key,n]of Object.entries(recipe.cost))if(key in s.resources)s.resources[key]-=n;else s.inventory[key]-=n;
 if(recipe.flag)s.flags[recipe.flag]=true;else s.inventory[recipe.output]++;
 const text=recipe.output?`${recipe.name} fabricado. Está en la mochila: ${ITEMS[recipe.output].placeable?'elige COLOCAR y decide dónde desplegarlo.':'puedes utilizarlo cuando lo necesites.'}`:`${recipe.name} instalado en la nave.`;
 sim.tell(text);return{ok:true,text};
}
export function placementPreview(sim,itemId,wx,wy){
 const s=sim.s,p=s.player,w=sim.world,item=ITEMS[itemId];
 const fail=text=>({ok:false,text,itemId,x:wx,y:wy});
 if(!item?.placeable||!(s.inventory[itemId]>0))return fail('No tienes este objeto para colocar.');
 if(s.resources.health<=0||s.flags.returnedEarth)return fail('No puedes desplegar ahora.');
 const width=item.tier?40:item.fixture==='lamp'?10:14,height=item.tier?32:item.fixture==='lamp'?15:24;
 const center=Math.round(wx/TILE)*TILE,x=item.tier?center-12:center-width/2;
 if(center<12||center>640*TILE-40||Math.abs(center-(p.x+6))>104)return fail('Colócalo cerca de ti.');
 let floor;
 if(item.tier){
  const columns=Array.from({length:6},(_,i)=>w.groundY(x-6+i*8));floor=Math.min(...columns);
  if(Math.max(...columns)-floor>16||Math.abs(wy-floor)>64)return fail('Busca suelo exterior con apoyos próximos y apunta a su superficie.');
  for(let dx=-6;dx<=32;dx+=8){const id=w.get(Math.floor((x+dx)/TILE),Math.floor(w.groundY(x+dx)/TILE));if(id===BLOCK.HULL||id===BLOCK.FLOOR)return fail('El panel necesita terreno exterior, fuera del hábitat.');}
  if(s.solarPanels.filter(a=>a.planet===s.planet).length>=8)return fail('Máximo de ocho paneles adicionales por planeta.');
 }else{
  const tx=Math.floor(center/TILE),start=Math.floor(wy/TILE)-2;
  for(let ty=Math.max(1,start);ty<=Math.min(170,start+8);ty++)if(w.get(tx,ty)&&!w.get(tx,ty-1)){floor=ty*TILE;break;}
  if(floor===undefined)return fail('Apunta a un suelo con espacio encima.');
  if(s.fixtures.filter(a=>a.planet===s.planet).length>=24)return fail('Máximo de 24 lámparas y balizas por planeta.');
 }
 if(Math.hypot(center-(p.x+6),floor-(p.y+PLAYER_HEIGHT))>110)return fail('Acércate al lugar de colocación.');
 const left=item.tier?x-7:x,bodyWidth=item.tier?39:width;
 if(w.collides(left,floor-height,bodyWidth,height-.1))return fail('No cabe: hay una pared, roca o techo.');
 if(!s.equipment.suited&&!w.inside({x:center,y:floor-height}))return fail('Equipa el traje antes de instalar objetos en el exterior.');
 const sx=p.x+6,sy=p.y+PLAYER_HEIGHT/2,ex=center,ey=floor-height/2,n=Math.max(1,Math.ceil(Math.hypot(ex-sx,ey-sy)/3));
 for(let i=1;i<n;i++)if(w.solidAt(sx+(ex-sx)*i/n,sy+(ey-sy)*i/n))return fail('Hay una pared entre tú y el lugar. Acércate por una ruta libre.');
 const placed=[...s.solarPanels.map(a=>({...a,type:'panel',width:40})),...s.fixtures];
 if(placed.some(a=>a.planet===s.planet&&Math.abs((a.x+(a.type==='panel'?12:0))-center)<(a.width||14)/2+width/2+4&&Math.abs((a.y??w.groundY(a.x))-floor)<38))return fail('Deja espacio respecto a otras instalaciones.');
 if(item.tier&&[47,50,53].some(a=>Math.abs(a*UNIT+12-center)<42))return fail('Este espacio ya pertenece al campo solar de la base.');
 return{ok:true,text:'Colocar '+item.name,itemId,x,y:floor,width,height,tier:item.tier,type:item.fixture||'panel'};
}
export function placeCrafted(sim,id,x,y){
 const preview=placementPreview(sim,id,x,y);if(!preview.ok)return preview;
 const s=sim.s;s.inventory[id]--;
 if(preview.tier){s.solarPanels.push({planet:s.planet,x:preview.x,tier:preview.tier});for(let dx=-8;dx<=32;dx+=8)(sim.world.protectedSites??=[]).push({x:Math.floor((preview.x+dx)/TILE),y:Math.floor(sim.world.groundY(preview.x+dx)/TILE)});}
 else s.fixtures.push({type:preview.type,planet:s.planet,x:preview.x,y:preview.y,charge:preview.type==='lamp'?100:0});
 const text=ITEMS[id].name+' desplegado. '+(preview.type==='lamp'?'Ilumina la zona mientras conserve batería.':preview.type==='beacon'?'Su señal marca tu ruta científica.':'Ahora aporta energía a la base.');sim.tell(text);return{ok:true,text};
}
export function useItem(sim,id){
 const s=sim.s;if(s.resources.health<=0||!s.inventory[id])return{ok:false,text:'No tienes ese objeto disponible.'};
 if(id==='rations')return{ok:sim.eat(),text:'Ración utilizada si faltaba nutrición o salud.'};
 const key=id==='batteries'?'energy':id==='repairKits'?'health':null;
 if(!key||s.resources[key]>=100)return{ok:false,text:'Esa reserva ya está completa.'};
 s.inventory[id]--;s.resources[key]=Math.min(100,s.resources[key]+(id==='batteries'?18:30));const text=ITEMS[id].name+' utilizado. Se consumió una unidad.';sim.tell(text);return{ok:true,text};
}

import {BADGES,juniorState,flightChecklist,dustPhase} from './junior-mission.js';
import science from '../data/pixel-science.json' with {type:'json'};
import {ITEMS,RECIPES,costText} from './crafting.js';
import {translate,installLanguage,getLanguage} from './language.js';
const $=id=>document.getElementById(id);
const PANELS=['inventory-panel','workshop-panel','habitat-panel','journal-panel'];
export class JuniorUI{
 constructor({getSim,notify,startFlight,clearControls}){
  Object.assign(this,{getSim,notify,startFlight,clearControls});this.resultTimer=null;installLanguage();
  $('craft-button').onclick=()=>this.open('workshop');$('journal-button').onclick=()=>this.open('journal');
  $('habitat-button').onclick=()=>this.open('habitat');
  for(const b of document.querySelectorAll('[data-close-panel]'))b.onclick=()=>this.close();
  $('hud-toggle').onclick=()=>this.toggleHUD();
  window.addEventListener('keydown',e=>{if(e.code==='Escape'&&PANELS.some(id=>!$(id).classList.contains('hidden'))){e.preventDefault();e.stopImmediatePropagation();this.close();}},{capture:true});
 }
 open(kind){const id=kind==='workshop'?'workshop-panel':kind==='journal'?'journal-panel':kind==='habitat'?'habitat-panel':'inventory-panel';const was=!$(id).classList.contains('hidden');this.close();if(!was)$(id).classList.remove('hidden');this.refresh();}
 close(){for(const id of PANELS)$(id).classList.add('hidden');}
 toggleHUD(){const hidden=$('play-ui').classList.toggle('hud-hidden');$('hud-toggle').setAttribute('aria-pressed',String(hidden));$('hud-toggle').setAttribute('aria-label',translate(hidden?'Mostrar indicadores (H)':'Ocultar indicadores (H)'));}
 result(text){const s=this.getSim()?.s,changes=[];if(s&&this.resourceSnapshot)for(const key of ['oxygen','energy','water','health']){const delta=s.resources[key]-this.resourceSnapshot[key];if(Math.abs(delta)>=.9)changes.push(({oxygen:'O₂',energy:'ENERGÍA',water:'AGUA',health:'SALUD'}[key])+' '+(delta>0?'+':'−')+Math.round(Math.abs(delta)));}if(s&&this.inventorySnapshot)for(const key of ['regolith','iron','ice','rations']){const delta=s.inventory[key]-this.inventorySnapshot[key];if(delta)changes.push(ITEMS[key].name+' '+(delta>0?'+':'−')+Math.abs(delta));}this.inventorySnapshot=s?{...s.inventory}:null;this.resourceSnapshot=s?{...s.resources}:null;$('craft-result').textContent=text+(changes.length?'  |  '+changes.join(' · '):'');$('craft-result').classList.remove('hidden');window.clearTimeout(this.resultTimer);const output=$('craft-result');this.resultTimer=window.setTimeout(()=>output.classList.add('hidden'),7000);}
 refresh(){
  const sim=this.getSim();if(!sim)return;const s=sim.s;this.resourceSnapshot={...s.resources};this.inventorySnapshot={...s.inventory};
  const stockSig=JSON.stringify([s.inventory,s.flags,Math.floor(s.resources.energy),Math.floor(s.resources.water),s.planet])+getLanguage();if(stockSig!==this.stockSig){this.stockSig=stockSig;const stock=$('workshop-stock');stock.replaceChildren(...['regolith','iron','ice','samples','rations'].map(id=>{const span=document.createElement('span');span.textContent=ITEMS[id].name+' × '+s.inventory[id];return span;}));
  $('flight-checklist').replaceChildren(...flightChecklist(s).map(c=>{const p=document.createElement('p');p.className=c.ready?'ready':'';p.textContent=(c.ready?'✓ ':'○ ')+(getLanguage()==='en'?c.en:c.es);return p;}));
  for(const b of document.querySelectorAll('[data-recipe]')){const r=RECIPES[b.dataset.recipe],unlocked=(!r.requires||s.flags[r.requires])&&(!r.planet||s.planet===r.planet),enough=Object.entries(r.cost).every(([key,n])=>(key in s.resources?s.resources[key]:s.inventory[key])>=n);b.dataset.ready=String(unlocked&&enough);b.querySelector('b').textContent=r.flag&&s.flags[r.flag]?'✓ INSTALADO':!unlocked?'POR DESCUBRIR':enough?'FABRICAR →':'FALTAN RECURSOS';}
  }
  const sig=(s.junior?.badges||[]).join('|')+getLanguage();if(this.badgeSig!==sig){this.badgeSig=sig;$('medals').replaceChildren(...BADGES.map(([id,es,en])=>{const div=document.createElement('div'),icon=document.createElement('strong'),label=document.createElement('span');const won=s.junior?.badges.includes(id);div.className='medal'+(won?'':' locked');icon.textContent=won?'★ +100':'☆';label.textContent=getLanguage()==='en'?en:es;div.append(icon,label);return div;}));}
  if(!$('junior-science').children.length){$('junior-science').replaceChildren(...science.verifiedFacts.map(f=>{const div=document.createElement('div'),p=document.createElement('p'),a=document.createElement('a');div.className='science-card';p.textContent=f.childMessage;const source=science.sources.find(x=>x.id===f.sourceIds[0]);a.href=source?.url||'https://science.nasa.gov/';a.target='_blank';a.rel='noopener noreferrer';a.textContent='NASA · Ver la fuente ↗';div.append(p,a);return div;}));}
  if(s.junior&&s.planet==='mars'){const phase=dustPhase(s.junior.dustClock);if(['warning','active'].includes(phase)){$('alert').classList.remove('hidden');$('alert').textContent=phase==='warning'?'POLVO EN CAMINO · Vuelve a la base antes de la tormenta':'TORMENTA DE POLVO · Menos luz, menos energía. Busca refugio.';}}
 }
}

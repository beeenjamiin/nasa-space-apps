import {uiIcon} from './ui-icons.js';
import {itemIcon} from './icons.js';
export function noticeCopy(text){
 if(/Medalla:/.test(text))return{kind:'reward',icon:'star',title:'¡Nueva medalla!',body:text.replace(/^★ /,'')};
 if(/fabricado\.|instalado en la nave/.test(text))return{kind:'success',icon:'craft',title:'¡Construcción lista!',body:text.split('.')[0]+'.'};
 if(/mejorado|reforzado|Cosecha lista|desplegado/i.test(text))return{kind:'success',icon:'check',title:'¡Buen trabajo!',body:text.split('.')[0]+'.'};
 if(/No |Necesitas|requiere|antes de|bajo|AVISO|TORMENTA|SIMULACRO|agot/i.test(text))return{kind:'warning',icon:'warning',title:'Atención, comandante',body:text};
 return{kind:'info',icon:'info',title:'Tu misión',body:text};
}
/** One large, replaceable card. Identical rapid actions coalesce; history stays in the log. */
export class NoticeCenter{
 constructor(node){this.node=node;this.timer=null;this.lastText='';this.lastAt=0;this.count=1;}
 push(text,changes=[]){
  const now=Date.now(),copy=noticeCopy(String(text));this.count=text===this.lastText&&now-this.lastAt<1500?this.count+1:1;this.lastAt=now;this.lastText=text;
  const glyph=document.createElement('div');glyph.className='notice-glyph';glyph.append(uiIcon(copy.icon));
  const content=document.createElement('div');content.className='notice-copy';const title=document.createElement('strong');title.textContent=copy.title+(this.count>1?' ×'+this.count:'');const message=document.createElement('p');
  const short=copy.body.length>120?copy.body.slice(0,117).replace(/\s+\S*$/,'')+'…':copy.body;message.textContent=short;content.append(title,message);
  if(changes.length){const deltas=document.createElement('div');deltas.className='notice-deltas';for(const{key,delta}of changes){const chip=document.createElement('span');chip.className=delta<0?'spent':'gained';const icon={oxygen:'oxygen',water:'water',energy:'energy',health:'heart'}[key];chip.append(icon?uiIcon(icon):itemIcon(key));chip.append(document.createTextNode((delta<0?'−':'+')+Math.round(Math.abs(delta))));deltas.append(chip);}content.append(deltas);}
  if(text.length>90||text!==copy.body){const details=document.createElement('details'),summary=document.createElement('summary'),full=document.createElement('p');summary.textContent='Ver más';full.textContent=text;details.append(summary,full);content.append(details);}
  const close=document.createElement('button');close.className='notice-close';close.type='button';close.setAttribute('aria-label','Cerrar aviso');close.append(uiIcon('close'));close.onclick=()=>this.hide();
  this.node.dataset.kind=copy.kind;this.node.dataset.fullText=text;this.node.replaceChildren(glyph,content,close);this.node.classList.remove('hidden');
  window.clearTimeout(this.timer);this.timer=window.setTimeout(()=>this.hide(),Math.min(11000,Math.max(6500,copy.body.length*42)));
 }
 hide(){window.clearTimeout(this.timer);this.node.classList.add('hidden');}
}

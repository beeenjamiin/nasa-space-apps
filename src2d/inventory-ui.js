import {ITEMS,RECIPES,costText} from './crafting.js';
import {itemIcon} from './icons.js';

export function populateRecipes(container){
 container.replaceChildren(...Object.entries(RECIPES).map(([id,r])=>{const button=document.createElement('button'),body=document.createElement('span'),cost=document.createElement('small'),action=document.createElement('b');button.className='recipe';button.dataset.recipe=id;button.dataset.tipTitle=r.name;button.dataset.tipDescription=r.output?ITEMS[r.output].description:'Módulo de nave. Requiere investigación y consume recursos.';body.textContent=r.name;cost.textContent=costText(r.cost)+(r.requires?' · requiere '+({analyzed:'análisis lunar',marsAnalyzed:'análisis marciano',marsReport:'informe de Marte'}[r.requires]):'');body.append(cost);action.textContent='FABRICAR →';button.append(body,action);return button;}));
}
export function renderInventoryItems(container,state,{equip,use}){
 const entries=Object.entries(ITEMS).filter(([key])=>key!=='pick'&&(['regolith','iron','ice','samples','rations'].includes(key)||state.inventory[key]>0));
 const signature=entries.map(([key])=>key+':'+state.inventory[key]).join('|');if(container.dataset.signature===signature)return;
 const focused=document.activeElement?.dataset?.item;container.dataset.signature=signature;
 container.replaceChildren(...entries.map(([key,item])=>{const card=document.createElement('button'),amount=document.createElement('b'),name=document.createElement('span');card.className='inventory-item';card.dataset.item=key;card.setAttribute('aria-label',item.name+': '+state.inventory[key]);amount.textContent=state.inventory[key];name.textContent=item.name;card.append(itemIcon(key),amount,name);if(item.placeable||item.use){const hint=document.createElement('small');hint.textContent=item.placeable?'COLOCAR':'USAR';card.append(hint);card.onclick=()=>item.placeable?equip(key):use(key);}return card;}));
 if(focused)container.querySelector(`[data-item="${focused}"]`)?.focus({preventScroll:true});
}
export function installTooltips(){
 const tooltip=document.getElementById('item-tooltip');let active=null;
 const hide=()=>{tooltip.classList.add('hidden');active?.removeAttribute('aria-describedby');active=null;};
 const show=target=>{const node=target?.closest?.('[data-item],[data-tip-title]');if(!node)return;const item=ITEMS[node.dataset.item],title=item?.name||node.dataset.tipTitle;if(!title)return;const strong=document.createElement('strong'),text=document.createElement('span');strong.textContent=title;text.textContent=item?.description||node.dataset.tipDescription||'';tooltip.replaceChildren(strong,text);tooltip.classList.remove('hidden');active=node;node.setAttribute('aria-describedby','item-tooltip');const r=node.getBoundingClientRect(),width=Math.min(250,window.innerWidth-24);tooltip.style.width=width+'px';tooltip.style.left=Math.max(12,Math.min(window.innerWidth-width-12,r.left))+'px';tooltip.style.top=(r.top>95?r.top-88:Math.min(window.innerHeight-100,r.bottom+10))+'px';};
 document.addEventListener('pointerover',e=>{if(e.pointerType!=='touch')show(e.target);});document.addEventListener('pointerout',e=>{if(active&&!active.contains(e.relatedTarget))hide();});document.addEventListener('focusin',e=>show(e.target));document.addEventListener('focusout',hide);document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});
 return{hide};
}

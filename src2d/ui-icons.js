/** Original SVG game glyphs: consistent silhouettes, no emoji or font dependency. */
export const GLYPHS={
 map:'M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2V5z M9 3v16 M15 5v16',
 eye:'M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 eyeOff:'M3 3l18 18 M6 6c-2 2-4 6-4 6s3 7 10 7c2 0 4-1 6-2 M10 5h2c7 0 10 7 10 7l-3 4',
 pause:'M6 4h4v16H6z M14 4h4v16h-4z',
 backpack:'M8 6V4h8v2 M5 7h14v14H5z M5 10H3v8h2 M19 10h2v8h-2 M8 14h8v5H8z M8 9h8',
 craft:'M4 3h5l2 5-4 4-5-2V5l4 3 2-2-4-3z M10 11l9 10 3-3-10-9',
 book:'M3 3h13l4 4v14H3z M16 3v5h4 M7 11h9 M7 15h9 M7 18h5',
 zoom:'M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0z M15 15l6 6 M7 10h6 M10 7v6',
 reset:'M4 9a8 8 0 1 1 0 7 M4 3v6h6',
 plus:'M5 12h14 M12 5v14', minus:'M5 12h14', close:'M6 6l12 12 M18 6L6 18',
 lab:'M8 3h8 M10 3v7L4 20h16l-6-10V3 M7 15h10 M9 18h2',
 water:'M12 2L5 12c-5 9 10 14 14 5 2-5-4-11-7-15z M8 14c-1 3 1 4 3 4',
 energy:'M13 2L4 14h7l-1 8 10-13h-8z',
 heart:'M12 20L3 11C-2 4 7 0 12 7 17 0 26 4 21 11z',
 oxygen:'M7 3h10v3H7z M8 6h8v15H8z M10 10h4 M10 13h4 M10 16h4',
 helmet:'M4 13V9a8 8 0 0 1 16 0v4 M3 13h18v5H3z M7 18v3h10v-3 M7 7h10v5H7z',
 food:'M5 4h14v17H5z M8 1h8 M8 9h8 M8 13h8 M8 17h5',
 lamp:'M9 21h6 M9 18h6v-3c7-5 4-13-3-13S2 10 9 15v3z',
 check:'M3 12l6 6L21 5', lock:'M7 10V6a5 5 0 0 1 10 0v4 M4 10h16v12H4z M12 14v4',
 hand:'M7 12V5a2 2 0 0 1 4 0v5-8a2 2 0 0 1 4 0v8-6a2 2 0 0 1 4 0v8l2-3 2 2-5 10H8L2 14l2-2 3 3v-3z',
 arrow:'M4 12h16 M13 5l7 7-7 7', star:'M12 2l3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1z',
 sound:'M3 9h4l5-5v16l-5-5H3z M16 8c3 2 3 6 0 8 M19 5c5 4 5 10 0 14',
 mute:'M3 9h4l5-5v16l-5-5H3z M16 8l6 8 M22 8l-6 8',
 warning:'M12 2L1 22h22L12 2z M12 8v6 M12 17v1',
 info:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M12 10v7 M12 6v1',
 rocket:'M9 15l-3 3-1-4 3-3 M9 15l4 1 3-3-1-4 M8 11c1-5 6-8 13-8 0 7-3 12-8 13z M15 7h2v2h-2z M4 20l3-1-2-2z',
 home:'M2 11L12 2l10 9 M5 9v13h14V9 M10 22v-8h4v8',
 settings:'M9 2h6l1 4 4 2 2 5-3 3-1 5h-6l-2-4-4-2-1-6 4-2z M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0'
};
const NS='http://www.w3.org/2000/svg';
export function uiIcon(name){
 const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('class','ui-icon');svg.setAttribute('data-icon',name);svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
 const path=document.createElementNS(NS,'path');path.setAttribute('d',GLYPHS[name]||GLYPHS.star);path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.8');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');svg.append(path);return svg;
}
export function iconButton(node,name,label=null){
 node.replaceChildren(uiIcon(name));if(label){const span=document.createElement('span');span.textContent=label;node.append(span);}return node;
}
export function installGameIcons(){
 const ids={ 'map-button':'map','hud-toggle':'eye','pause-button-2d':'pause','inventory-button':'backpack','craft-button':'craft','journal-button':'book','close-inventory':'close','close-map':'close','close-science':'close','cancel-placement':'close','zoom-toggle':'zoom','zoom-in':'plus','zoom-out':'minus','zoom-reset':'reset','touch-interact':'hand','eat':'food','upgrade-pickaxe':'craft','habitat-button':'home'};
 for(const[id,name]of Object.entries(ids)){const node=document.getElementById(id);if(!node)continue;
  if(['map-button','inventory-button','craft-button','journal-button'].includes(id))iconButton(node,name,({'map-button':'Mapa','inventory-button':'Mochila','craft-button':'Taller','journal-button':'Bitácora'})[id]);
  else if(['habitat-button','eat'].includes(id)){node.prepend(uiIcon(name));}
  else if(id==='upgrade-pickaxe')node.prepend(uiIcon(name));
  else iconButton(node,name);
 }
 for(const node of document.querySelectorAll('[data-close-panel]'))iconButton(node,'close');
 for(const node of document.querySelectorAll('[data-care]'))node.prepend(uiIcon(node.dataset.care==='grow'?'food':'home'));
 for(const node of document.querySelectorAll('.resource'))node.prepend(uiIcon(node.classList.contains('oxygen')?'oxygen':node.classList.contains('energy')?'energy':node.classList.contains('water')?'water':'heart'));
 for(const node of document.querySelectorAll('[data-training-action]')){const kind={inventory:'backpack',craft:'craft',map:'map',suit:'helmet',interact:'hand'}[node.dataset.trainingAction];if(kind)node.prepend(uiIcon(kind));}
}

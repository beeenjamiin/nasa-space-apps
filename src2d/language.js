import english from '../data/pixel-en.json' with {type:'json'};
let language='es';
try{language=globalThis.localStorage?.getItem('orbita-language')==='en'?'en':'es';}catch{}
export const getLanguage=()=>language;
const cache=new Map();
const replacements=Object.entries(english).sort((a,b)=>b[0].length-a[0].length);

const templates=[
 [/^Mantén pulsado el pico para reunir (\d+) unidades de regolito\. Sal por la derecha\.$/,n=>`Hold the pickaxe to collect ${n} soil blocks. Go outside to the right.`],
 [/^Repara el campo solar al este\. Coste: (\d+) regolitos\.$/,n=>`Repair the solar panels to the east. Cost: ${n} soil blocks.`],
 [/^Recoge las tres muestras: ([\d/]+)\. Sigue hacia el este\.$/,n=>`Collect three rocks: ${n}. Keep going east.`],
 [/^Necesitas (\d+) regolitos para los anclajes y la reparación\.$/,n=>`You need ${n} soil blocks for anchors and repairs.`],
 [/^Analizar requiere (\d+) muestras, (\d+) agua y (\d+) energía\.$/,(a,b,c)=>`Studying rocks needs ${a} rocks, ${b} water and ${c} energy.`],
 [/^Pico mejorado a nivel (.+)\. Picas más rápido, pero gastaste materiales y energía\.$/,n=>`Pickaxe upgraded to level ${n}. You mine faster, but spent materials and energy.`],
 [/^(.+), tu expedición conectó la Luna, Marte y la Tierra\.$/,name=>`${name}, your adventure connected the Moon, Mars and Earth.`],
 [/^(.+) \/ apunta al suelo y pulsa clic, B o toca el mundo$/,name=>`${translate(name)} / point at the ground and click, press B or tap the world`]
];

export function translate(text){
 if(language!=='en'||typeof text!=='string')return text;
 if(cache.has(text))return cache.get(text);
 const trimmed=text.trim(),exact=english[trimmed];if(exact)return text.replace(trimmed,exact);
 for(const [pattern,format]of templates){const match=trimmed.match(pattern);if(match)return format(...match.slice(1));}
 // Only original text is scanned. A translated fragment is never translated again.
 let result='',i=0;while(i<text.length){const match=replacements.find(([from])=>text.startsWith(from,i)&&(!/[\p{L}]/u.test(from[0])||i===0||!/[\p{L}]/u.test(text[i-1]))&&(!/[\p{L}]/u.test(from.at(-1))||!/[\p{L}]/u.test(text[i+from.length]||'')));if(match){result+=match[1];i+=match[0].length;}else result+=text[i++];}if(cache.size>2048)cache.clear();cache.set(text,result);return result;
}
export function setLanguage(value){language=value==='en'?'en':'es';try{globalThis.localStorage?.setItem('orbita-language',language);}catch{}if(globalThis.document)document.documentElement.lang=language;}
export function installLanguage(){
 const originals=new WeakMap(),attributes=new WeakMap();
 const text=node=>{if(node.parentElement?.closest('script,style,.language-switch,#preview-name,input'))return;let record=originals.get(node);if(!record||node.data!==record.rendered)record={source:node.data};const rendered=translate(record.source);record.rendered=rendered;originals.set(node,record);if(node.data!==rendered)node.data=rendered;};
 const walk=root=>{if(root.nodeType===3){text(root);return;}if(root.nodeType!==1&&root.nodeType!==9)return;for(const child of root.childNodes)walk(child);if(root.nodeType===1)for(const key of['aria-label','title','data-tip-title','data-tip-description']){if(!root.hasAttribute(key))continue;const saved=attributes.get(root)||{},value=root.getAttribute(key),record=saved[key]?.rendered===value?saved[key]:{source:value};record.rendered=translate(record.source);saved[key]=record;attributes.set(root,saved);if(value!==record.rendered)root.setAttribute(key,record.rendered);}};
 const apply=()=>{document.documentElement.lang=language;walk(document.body);document.title=translate('Órbita: Frontera · Aventura espacial');for(const b of document.querySelectorAll('.language-switch'))b.textContent=language==='en'?'Español':'English';};
 const observer=new window.MutationObserver(records=>{for(const r of records)if(r.type==='childList'){for(const node of r.addedNodes)walk(node);}else if(r.type==='characterData')text(r.target);else if(r.type==='attributes')walk(r.target);});
 observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','data-tip-title','data-tip-description']});
 for(const b of document.querySelectorAll('.language-switch'))b.onclick=()=>{setLanguage(language==='en'?'es':'en');apply();};apply();return()=>observer.disconnect();
}

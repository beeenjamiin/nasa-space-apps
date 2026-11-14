/** Stable placed-block IDs; 0–6 retain their historical meaning in saved maps. */
const kinds=[['dust',1,'regolith',.38,2],['rock',2,'regolith',.55,3],['iron',3,'iron',.7,4],['ice',4,'ice',.5,2]];
export const MATERIALS=Object.freeze(Object.fromEntries(['moon','mars'].flatMap((planet,p)=>kinds.map(([kind,baseBlock,item,miningSeconds,span],i)=>{
 const id=planet+'-'+kind;
 return[id,Object.freeze({id,planet,kind,baseBlock,item,block:7+p*4+i,miningSeconds,hardness:miningSeconds/.38,span,textureSeed:71423+p*27704})];
}))));
const byBlock=new Map(Object.values(MATERIALS).map(m=>[m.block,m]));
export const materialForBlock=(block,planet='moon')=>byBlock.get(block)||MATERIALS[planet+'-'+kinds.find(k=>k[1]===block)?.[0]]||null;
export const isPlacedBlock=block=>byBlock.has(block);
export const validSavedBlock=block=>Number.isInteger(block)&&(block>=0&&block<=4||isPlacedBlock(block));

// Provenance is metadata for the existing aggregate inventory, not another wallet.
// Reconcile also supports older callers that directly debit inventory.regolith/iron/ice.
export function reconcileMaterials(state){
 state.materials??={};
 for(const item of ['regolith','iron','ice']){
  const total=Math.max(0,Math.min(999,Math.floor(Number(state.inventory[item])||0)));
  const keys=Object.keys(MATERIALS).filter(k=>MATERIALS[k].item===item);
  for(const key of keys)state.materials[key]=Math.max(0,Math.min(999,Math.floor(Number(state.materials[key])||0)));
  let sum=keys.reduce((n,k)=>n+state.materials[k],0);
  if(sum>total){let excess=sum-total;for(const key of keys){const n=Math.min(excess,state.materials[key]);state.materials[key]-=n;excess-=n;}}
  if(sum<total){const kind=item==='regolith'?'dust':item;state.materials[(state.planet==='mars'?'mars':'moon')+'-'+kind]+=total-sum;}
 }
 return state.materials;
}
export function collectMaterial(state,material){
 reconcileMaterials(state);
 if(state.inventory[material.item]>=999)return false;
 state.inventory[material.item]++;state.materials[material.id]++;return true;
}
export function consumeMaterial(state,id){
 reconcileMaterials(state);const m=MATERIALS[id];
 if(!m||state.materials[id]<1)return false;
 state.materials[id]--;state.inventory[m.item]--;return true;
}
export function availableMaterials(state){
 reconcileMaterials(state);return Object.values(MATERIALS).filter(m=>state.materials[m.id]>0).map(m=>({...m,count:state.materials[m.id]}));
}

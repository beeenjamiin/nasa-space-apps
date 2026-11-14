import {WIDTH,HEIGHT,TILE} from './world.js';
import {materialForBlock,isPlacedBlock} from './block-materials.js';

/** 0/1 support propagation over placed cells only; natural terrain is an anchor.
 * Upward compression costs zero; horizontal/cantilever and hanging loads cost one.
 * Capacity is a game parameter, reduced by local gravity, not engineering analysis.
 */
export function analyzeStructure(world,addition=null){
 const cells=new Set(world.placed),extra=addition?addition.ty*WIDTH+addition.tx:-1;
 if(addition)cells.add(extra);
 const block=i=>i===extra?addition.block:world.tiles[i];
 const gravityFactor=world.planet==='moon'?3.71/1.62:1;
 const span=i=>Math.max(1,Math.floor(materialForBlock(block(i),world.planet).span*gravityFactor+2));
 const costs=new Map(),buckets=Array.from({length:20},()=>[]);
 for(const i of cells){const below=i+WIDTH;if(below<WIDTH*HEIGHT&&world.tiles[below]&&!cells.has(below)){costs.set(i,0);buckets[0].push(i);}}
 for(let cost=0;cost<buckets.length;cost++)for(let head=0;head<buckets[cost].length;head++){
  const i=buckets[cost][head];if(costs.get(i)!==cost)continue;
  const x=i%WIDTH,y=Math.floor(i/WIDTH);
  for(const [dx,dy]of[[0,-1],[-1,0],[1,0],[0,1]]){
   if(x+dx<0||x+dx>=WIDTH||y+dy<0||y+dy>=HEIGHT)continue;
   const n=i+dy*WIDTH+dx,next=cost+(dy===-1?0:1);
   if(!cells.has(n)||next>Math.min(span(i),span(n))||next>=(costs.get(n)??Infinity))continue;
   costs.set(n,next);buckets[next].push(n);
  }
 }
 return{supported:costs,unsupported:[...cells].filter(i=>!costs.has(i)),cells:cells.size};
}
export function settleStructures(sim){
 const w=sim.world;if(sim.structureRevision===w.revision&&sim.structureWorld===w)return;
 const result=analyzeStructure(w);sim.structureChecks=(sim.structureChecks||0)+1;
 const fallen=[];
 for(const i of result.unsupported){
  const tx=i%WIDTH,ty=Math.floor(i/WIDTH),m=materialForBlock(w.tiles[i],w.planet);
  if(!isPlacedBlock(w.tiles[i])||!w.set(tx,ty,0))continue;
  fallen.push({tx,ty,material:m.id});
  if(sim.collapses.length>=128)sim.collapses.shift();
  sim.collapses.push({x:tx*TILE,y:ty*TILE,tx,ty,material:m.id,vy:0,age:0});
 }
 sim.s.worlds[sim.s.planet]=w.edits;sim.structureWorld=w;sim.structureRevision=w.revision;
 if(fallen.length)sim.emit('structure:collapse',{blocks:fallen,count:fallen.length});
 return result;
}
export function tickCollapses(sim,dt){
 const gravity=(sim.s.planet==='moon'?1.62:3.71)*16;
 for(let i=sim.collapses.length-1;i>=0;i--){
  const b=sim.collapses[i];b.age+=dt;b.vy+=gravity*dt;const distance=b.vy*dt,steps=Math.max(1,Math.ceil(distance/4));let hit=false;
  for(let n=0;n<steps;n++){b.y+=distance/steps;if(sim.world.solidAt(b.x+4,b.y+8)){hit=true;break;}}
  if(b.age>3||hit)sim.collapses.splice(i,1);
 }
}

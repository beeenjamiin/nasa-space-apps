import {materialForBlock} from './block-materials.js';
import {fbm,noise2,visualHash as hash} from './visual-noise.js';
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
export const GEOLOGY_PALETTES={
 moon:{rock:['#303b48','#424f5d','#55616d','#66727c','#7a858c','#919a9c','#b0b7b3'],dust:['#53616e','#657480','#788894','#8f9ea4','#a6b2b4','#bdc5bf']},
 mars:{rock:['#513a39','#6b4740','#825449','#9b6852','#b7805e','#cd9b72','#e1b88a'],dust:['#855142','#a56346','#ba7c50','#ce9561','#dfaf7f','#ebc895']}
};
/** Four exposed-edge bits. Material seams are handled separately from air boundaries. */
export function exposedEdges(world,tx,ty){let mask=0;for(const[dx,dy,bit]of[[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]])if(world?.get(tx+dx,ty+dy)===0)mask|=bit;return mask;}
export function drawGeologyBody(c,id,x,y,tx,ty,planet,seed,world){
 const p=GEOLOGY_PALETTES[planet],dust=id===1,palette=dust?p.dust:p.rock;
 // The fields use world pixels, not tile-local coordinates: no repeated tile frames.
 const regional=fbm(tx/21,ty/26,seed,3),depth=noise2(tx/15,ty/38,seed+81);
 for(let row=0;row<8;row++){
  const gy=ty*8+row,sediment=Math.sin(gy*.17+Math.sin(tx*.07)*1.8);
  let level=Math.round((regional*.65+depth*.35)*(palette.length-2));
  if(planet==='mars')level+=sediment>.45?1:sediment<-.7?-1:0;
  const occluded=world?.get(tx,ty-1)===0&&[1,2,3].some(n=>world.get(tx-n,ty-n)!==0);
  const tone=Math.max(0,Math.min(palette.length-1,level-(occluded?(planet==='moon'?2:1):0)));rect(c,x,y+row,8,1,palette[tone]);
  if(planet==='mars'&&!dust&&sediment<-.86)rect(c,x,y+row,8,1,palette[Math.max(0,tone-1)]);
 }
 for(let i=0;i<(dust?7:4);i++){
  const px=Math.floor(hash(tx*11+i,ty,seed+9)*8),py=Math.floor(hash(tx,ty*13+i,seed+23)*8),tone=Math.floor(regional*(palette.length-2));
  rect(c,x+px,y+py,dust?1:Math.min(8-px,2+i%3),1,palette[Math.max(0,Math.min(palette.length-1,tone+(i%2?2:-1)))]);
 }
 if(!dust&&hash(Math.floor(tx/2),Math.floor(ty/3),seed+53)>.62){const offset=(tx*3+ty*5)%7;for(let row=0;row<8;row+=2){const xx=(offset+Math.floor(row/3))%8;rect(c,x+xx,y+row,1,2,palette[0]);}}
 // Interlocking grains soften dust/bedrock boundaries without changing cell occupancy.
 for(const dy of[-1,1]){const neighbor=world?.materialAt?.(tx,ty+dy)||materialForBlock(world?.get(tx,ty+dy),planet);if(!neighbor||neighbor.planet!==planet||!((dust&&neighbor.baseBlock===2)||(!dust&&id===2&&neighbor.baseBlock===1)))continue;
  const borderPalette=neighbor.baseBlock===1?p.dust:p.rock,color=borderPalette[Math.min(borderPalette.length-1,Math.floor(regional*borderPalette.length))];
  for(let px=0;px<8;px++){const size=1+Math.floor(hash(tx*8+px,ty+(dy>0?1:0),seed+83)*2);rect(c,x+px,dy<0?y:y+8-size,1,size,color);}
 }
 const edges=exposedEdges(world,tx,ty),shadow=palette[0],shine=palette.at(-1);
 if(edges&1){rect(c,x,y,8,1,shine);rect(c,x,y+1,8,1,palette.at(-2));}
 if(edges&8)rect(c,x,y,1,8,planet==='moon'?shine:palette.at(-2));
 if(edges&2){rect(c,x+7,y,1,8,shadow);rect(c,x+6,y+2,1,5,palette[1]);}
 if(edges&4){rect(c,x,y+7,8,1,shadow);rect(c,x+1,y+6,6,1,palette[1]);}
 // Inner corners where diagonally adjacent air meets connected solid.
 if(!(edges&1)&&!(edges&8)&&world?.get(tx-1,ty-1)===0)rect(c,x,y,2,2,shine);
 if(!(edges&2)&&!(edges&4)&&world?.get(tx+1,ty+1)===0)rect(c,x+6,y+6,2,2,shadow);
}
export function drawCaveWall(c,x,y,tx,ty,planet,seed){
 const level=Math.floor(fbm(tx/13,ty/17,seed,2)*3),moon=['#18232e','#202e3b','#2a3946'],mars=['#30232b','#3e2a30','#51353a'];
 rect(c,x,y,8,8,(planet==='mars'?mars:moon)[level]);
 const seam=(ty*8+Math.round(noise2(tx/11,0,seed)*11))%19;
 if(seam<8)rect(c,x,y+Math.min(7,seam),8,1,planet==='mars'?'#64413e':'#354553');
 if(hash(tx,ty,seed)>.8)rect(c,x+3,y+2,1,4,planet==='mars'?'#271f28':'#121c26');
}

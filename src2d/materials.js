import {drawGeologyBody} from './geology-art.js';
import {hash,BLOCK} from './world.js';
import {materialForBlock} from './block-materials.js';
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
function line(c,x,y,ex,ey,color,width=1){const n=Math.max(1,Math.ceil(Math.max(Math.abs(ex-x),Math.abs(ey-y))));for(let i=0;i<=n;i++)rect(c,x+(ex-x)*i/n,y+(ey-y)*i/n,width,width,color);}
export function geologyTile(c,id,x,y,tx,ty,world){
 const material=world?.materialAt?.(tx,ty)||materialForBlock(id,world?.planet||'moon');id=material?.baseBlock||id;
 const planet=material?.planet||world?.planet||'moon',seed=material?.textureSeed||71423;
 drawGeologyBody(c,id,x,y,tx,ty,planet,seed,world);
 if(id!==BLOCK.IRON&&id!==BLOCK.ICE)return;
 const ice=id===BLOCK.ICE,edge=ice?'#486b78':'#624e42',core=ice?'#93bfc5':'#b58e60',light=ice?'#d3e1d7':'#dbc18b',cx=2+Math.floor(hash(tx,ty,seed)*4),cy=2+Math.floor(hash(ty,tx,seed+1)*4);
 for(const[dx,dy]of[[-1,0],[1,0],[0,-1],[0,1]])if((world?.materialAt?.(tx+dx,ty+dy)||materialForBlock(world?.get(tx+dx,ty+dy),planet))?.id===material?.id){const edgeOffset=2+Math.floor(hash(dx?tx+(dx<0?-1:0):tx,dy?ty+(dy<0?-1:0):ty,seed+53)*4),ex=dx<0?0:dx>0?7:edgeOffset,ey=dy<0?0:dy>0?7:edgeOffset;line(c,x+cx-1,y+cy-1,x+ex-1,y+ey-1,edge,3);line(c,x+cx-1,y+cy-1,x+ex-1,y+ey-1,core,2);}
 rect(c,x+cx-1,y+cy-1,4,3,core);rect(c,x+cx,y+cy-2,2,4,core);if(hash(tx,ty,seed+43)>.55){rect(c,x+cx-1,y+cy-1,2,1,light);rect(c,x+cx+1,y+cy,1,2,light);}
}

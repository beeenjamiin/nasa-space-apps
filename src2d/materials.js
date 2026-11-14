import {hash,BLOCK} from './world.js';
import {materialForBlock} from './block-materials.js';
const palettes={moon:{rock:['#536171','#62707c','#6d7880','#7a8588','#8d9490'],dust:['#738394','#7e8b9a','#8c98a0','#a3b1b4']},mars:{rock:['#77544e','#875e52','#956a58','#a77a61','#b58b6d'],dust:['#a97559','#b48160','#bf9169','#c49d76']}};
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
function noise(x,y,scale,seed){const gx=Math.floor(x/scale),gy=Math.floor(y/scale),u=x/scale-gx,v=y/scale-gy;return hash(gx,gy,seed)*(1-u)*(1-v)+hash(gx+1,gy,seed)*u*(1-v)+hash(gx,gy+1,seed)*(1-u)*v+hash(gx+1,gy+1,seed)*u*v;}
function line(c,x,y,ex,ey,color,width=1){const n=Math.max(1,Math.ceil(Math.max(Math.abs(ex-x),Math.abs(ey-y))));for(let i=0;i<=n;i++)rect(c,x+(ex-x)*i/n,y+(ey-y)*i/n,width,width,color);}
export function geologyTile(c,id,x,y,tx,ty,world){
 const material=world?.materialAt?.(tx,ty)||materialForBlock(id,world?.planet||'moon');id=material?.baseBlock||id;
 const planet=material?.planet||world?.planet||'moon',seed=material?.textureSeed||71423,p=palettes[planet],dust=id===BLOCK.DUST,tone=noise(tx,ty,6,seed)*.7+noise(tx,ty,2,seed+31)*.3,palette=dust?p.dust:p.rock,index=Math.min(palette.length-1,Math.floor(tone*palette.length));
 rect(c,x,y,8,8,palette[index]);
 // Facets span several tiles; fine grains have independent scales and no tile frame.
 const facet=hash(Math.floor(tx/3),Math.floor(ty/2),seed+7);if(!dust){for(let i=0;i<2;i++){const yy=(ty*3+i*5)%8,px=(tx+i*3)%7;rect(c,x+px,y+yy,Math.min(8-px,2+i*2),1,palette[Math.max(0,index-1)]);}if(facet>.73){const px=1+Math.floor(hash(tx,ty,seed+17)*3),py=2+Math.floor(hash(tx,ty,seed+18)*4);line(c,x+px,y+py,x+px+3,y+py-2,palette[Math.max(0,index-2)]);}}
 for(let i=0;i<(dust?3:2);i++){const px=Math.floor(hash(tx*3+i,ty,seed+9)*7),py=Math.floor(hash(tx,ty*3+i,seed+13)*7);rect(c,x+px,y+py,i?1:2,1,palette[Math.min(palette.length-1,index+(i?1:-1))]||palette[0]);}
 const open=(dx,dy)=>world?.get(tx+dx,ty+dy)===0;if(open(0,-1)){rect(c,x,y,8,1,'#222831');rect(c,x,y+1,8,1,palette.at(-1));}if(open(-1,0))rect(c,x,y,1,8,'#29323c');if(open(1,0))rect(c,x+7,y,1,8,'#29323c');if(open(0,1))rect(c,x,y+7,8,1,'#29323c');
 if(id!==BLOCK.IRON&&id!==BLOCK.ICE)return;
 const ice=id===BLOCK.ICE,edge=ice?'#486b78':'#624e42',core=ice?'#93bfc5':'#b58e60',light=ice?'#d3e1d7':'#dbc18b',cx=2+Math.floor(hash(tx,ty,seed)*4),cy=2+Math.floor(hash(ty,tx,seed+1)*4);
 for(const[dx,dy]of[[-1,0],[1,0],[0,-1],[0,1]])if((world?.materialAt?.(tx+dx,ty+dy)||materialForBlock(world?.get(tx+dx,ty+dy),planet))?.id===material?.id){const edgeOffset=2+Math.floor(hash(dx?tx+(dx<0?-1:0):tx,dy?ty+(dy<0?-1:0):ty,seed+53)*4),ex=dx<0?0:dx>0?7:edgeOffset,ey=dy<0?0:dy>0?7:edgeOffset;line(c,x+cx-1,y+cy-1,x+ex-1,y+ey-1,edge,3);line(c,x+cx-1,y+cy-1,x+ex-1,y+ey-1,core,2);}
 rect(c,x+cx-1,y+cy-1,4,3,core);rect(c,x+cx,y+cy-2,2,4,core);if(hash(tx,ty,seed+43)>.55){rect(c,x+cx-1,y+cy-1,2,1,light);rect(c,x+cx+1,y+cy,1,2,light);}
}

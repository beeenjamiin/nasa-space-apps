import {hash} from './world.js';
const documents=new WeakMap();
function sprite(key,w,h,pixel){if(!documents.has(document))documents.set(document,new Map());const cache=documents.get(document);if(cache.has(key))return cache.get(key);const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const c=canvas.getContext('2d'),image=c.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const color=pixel(x,y);if(color)image.data.set([...color,255],(y*w+x)*4);}const raw=image.data.slice();for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=(y*w+x)*4;if(raw[i+3])continue;if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>raw[((y+dy)*w+x+dx)*4+3]))image.data.set([20,23,29,255],i);}c.putImageData(image,0,0);cache.set(key,canvas);return canvas;}
const poly=(c,points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fill();};
const block=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
/** Original forest art: narrow trunks, visible forks and hanging leaf sprays.
 * Reference: Terraria's forest silhouette, without importing its sprites. */
export function treeSprite(variant=0){
 variant=((variant%4)+4)%4;if(!documents.has(document))documents.set(document,new Map());const cache=documents.get(document),key='forest-tree-v3-'+variant;if(cache.has(key))return cache.get(key);
 const canvas=document.createElement('canvas');canvas.width=96;canvas.height=184;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
 const trunk=46,top=22+variant*3,ink='#14291b';
 poly(c,[[42,top],[50,top],[51,151],[55,171],[62,179],[62,182],[31,182],[32,178],[39,170],[42,149]],'#382c25');
 poly(c,[[44,top],[48,top],[48,151],[52,174],[57,179],[36,179],[41,171],[44,147]],'#9d6239');
 block(c,44,top+3,2,141-top,'#ce9761');block(c,48,top+7,2,137-top,'#6d442d');
 for(let y=34;y<170;y+=7){const n=hash(y,variant);block(c,43+(y%3),y,2,3,'#70442b');block(c,46,y+3,2,2,n>.5?'#c48b54':'#b97c48');if(n>.6)block(c,42,y+1,1,4,'#dfab70');}
 const branches=variant%2?[[46,89,23,74],[48,119,70,104],[45,139,33,132]]:[[45,78,24,63],[49,108,71,92],[45,142,32,132]];
 for(const [ax,ay,bx,by]of branches){poly(c,[[ax-2,ay+3],[bx-2,by+2],[bx-2,by-3],[bx+2,by-2],[ax+3,ay-3]],'#382c25');poly(c,[[ax,ay],[bx,by],[bx,by-2],[ax+1,ay-2]],'#b77b47');}
 const tuft=(cx,cy,size,seed)=>{
  // Each spray has curved, tapered blades. Dark overlapping edges form leaf clusters.
  const blades=9;
  for(let pass=0;pass<2;pass++)for(let i=0;i<blades;i++){
   const side=(i-4)/4,offset=side*size*.54,rootY=cy-size*.36+Math.abs(side)*size*.1;
   const endX=cx+offset*1.2,endY=cy+size*(.42+Math.abs(side)*.17)+hash(i,seed)*3;
   const points=[[cx+offset*.22,rootY],[cx+offset*.75-3,rootY-2],[endX-4,cy+2],[endX-3,endY-3],[endX,endY],[endX+2,endY-7],[endX+3,cy],[cx+offset*.65+3,rootY-3]];
   if(!pass)poly(c,points,ink);
   else{poly(c,points.map(([x,y])=>[x+(x<endX?1:-1),y+(y<cy?1:-1)]),i%3===0?'#197b35':'#268e38');
    poly(c,[[cx+offset*.62,rootY+1],[endX,cy-1],[endX,endY-5],[endX-2,cy],[cx+offset*.65-1,rootY+2]],i%2?'#4cbb48':'#79ca54');
    block(c,cx+offset*.6,rootY+1,2,2,'#9ad965');block(c,endX-2,cy+5,1,4,'#115a2b');}
  }
 };
 // Branch tufts are smaller and do not cover the long exposed trunk.
 tuft(branches[0][2],branches[0][3]-4,17,variant+8);tuft(branches[1][2],branches[1][3]-4,20,variant+9);
 tuft(35,top+8,28,variant+2);tuft(58,top+5,31,variant+4);tuft(47,top-1,29,variant+6);
 // Moss and two grass blades seat the roots into Earth's topsoil.
 for(let i=0;i<9;i++){block(c,33+i*3,179-i%2,3,2,i%2?'#438d37':'#6fb547');if(i%3===0)block(c,34+i*3,176,1,4,'#8cc75b');}
 const im=c.getImageData(0,0,96,184);for(let i=3;i<im.data.length;i+=4)im.data[i]=im.data[i]>100?255:0;c.putImageData(im,0,0);
 cache.set(key,canvas);return canvas;
}
export function rockSprite(planet='moon',variant=0){
 const large=variant>=4,w=large?44:22,h=large?29:16;
 return sprite('geological-rock-'+planet+'-'+variant,w,h,(x,y)=>{
  const nx=(x-w*.5)/(w*.44),ny=(y-h*.64)/(h*.43),angle=Math.atan2(ny,nx),edge=1+Math.sin(angle*5+variant)*.13+Math.cos(angle*3-variant)*.09;
  if(y<2||y>h-2||nx*nx+ny*ny>edge)return null;
  const facet=hash(Math.floor(x/5),Math.floor(y/4),variant+77),light=-nx*.35-ny*.48+facet*.24;
  const moon=[[42,52,65],[65,78,92],[91,106,118],[124,139,145],[166,176,175]],mars=[[80,49,44],[111,66,49],[151,94,60],[191,132,83],[226,177,117]];
  let level=Math.max(0,Math.min(4,Math.floor((light+.55)*3)));
  if(planet==='mars'&&(y+Math.floor(x*.12))%7===0)level=Math.max(0,level-1);
  if((x+Math.floor(y/3)+variant*3)%19===0&&y>h*.3)level=Math.max(0,level-2);
  return(planet==='moon'?moon:mars)[level];
 });
}

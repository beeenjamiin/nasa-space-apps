import {hash} from './world.js';
const documents=new WeakMap();
/** Stylized original pixel illustrations, never scientific surface maps. */
export function planetSprite(kind='earth'){if(!documents.has(document))documents.set(document,new Map());const cache=documents.get(document);
 if(cache.has(kind))return cache.get(kind);const size=128,canvas=document.createElement('canvas');canvas.width=canvas.height=size;const c=canvas.getContext('2d'),image=c.createImageData(size,size),craters=Array.from({length:18},(_,i)=>({x:(hash(i,1)-.5)*1.45,y:(hash(i,8)-.5)*1.45,r:.06+hash(i,4)*.18}));
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const nx=(x-63.5)/61,ny=(y-63.5)/61,r2=nx*nx+ny*ny;if(r2>1)continue;let rgb=[20,24,39];const z=Math.sqrt(1-r2),light=Math.max(.16,nx*-.34+ny*-.3+z*.8),band=Math.round(light*5)/5;
  if(r2<.95){const u=Math.atan2(nx,z),v=Math.asin(ny),noise=Math.sin(u*3.7+Math.sin(v*3)*.8)*Math.cos(v*2.3)+Math.sin(u*6-v*4)*.2;
   if(kind==='earth'){const land=noise>.24&&Math.abs(ny)<.86,cloud=Math.sin(u*9+v*8+Math.sin(v*7)*.4)>.86&&Math.cos(v*13-u*2)>.25;rgb=land?(noise>.8?[126,159,76]:[62,141,101]):[39,116,184];if(cloud||Math.abs(ny)>.9)rgb=[218,237,224];}
   else if(kind==='mars'){const layer=Math.sin(v*18+u*5)+noise*.6;rgb=layer>.7?[224,163,99]:layer<-.6?[141,77,67]:[193,112,76];if(ny<-.83)rgb=[218,203,171];}
   else{rgb=noise>.25?[163,177,186]:[116,137,160];for(const cr of craters){const d=Math.hypot(nx-cr.x,ny-cr.y)/cr.r;if(d<.82)rgb=[105,125,152];else if(d<1.05)rgb=nx<cr.x?[196,203,196]:[79,99,129];}}
   rgb=rgb.map((val,i)=>Math.min(255,Math.round(val*(.38+band*.75)+(1-band)*[12,10,28][i])));
  }else rgb=kind==='earth'?[109,189,216]:kind==='mars'?[219,156,117]:[190,197,192];image.data.set([...rgb,255],(y*size+x)*4);
 }c.putImageData(image,0,0);cache.set(kind,canvas);return canvas;
}

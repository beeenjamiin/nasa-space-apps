import {treeSprite} from './decor.js';
import {loopNoise,visualHash as hash,fbm} from './visual-noise.js';
const documents=new WeakMap();
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
export function cloudSprite(variant=0){
 if(!documents.has(document))documents.set(document,new Map());const cache=documents.get(document),key='cloud:'+variant;if(cache.has(key))return cache.get(key);
 const s=document.createElement('canvas');s.width=112;s.height=42;const c=s.getContext('2d');
 const image=c.createImageData(112,42),blobs=[[17,28,17,10],[35,21,22,14],[57,16,21,13],[78,24,23,13],[98,29,14,8]];
 const colors=[[117,151,175],[160,187,201],[204,220,219],[241,239,219]];
 for(let y=0;y<42;y++)for(let x=0;x<112;x++){
  let coverage=-1,top=42;
  for(const [i,b]of blobs.entries()){const[cx,cy,rx,ry]=b,offset=(hash(i,variant,31)-.5)*6,d=((x-cx)/rx)**2+((y-cy-offset)/ry)**2;if(d<1){coverage=Math.max(coverage,1-d);top=Math.min(top,cy+offset-ry);}}
  if(coverage<0)continue;
  const light=1-(y-top)/28,band=Math.max(0,Math.min(3,Math.floor(light*4+(hash(x,y,variant)-.5)*.3)));image.data.set([...colors[band],255],(y*112+x)*4);
 }
 c.putImageData(image,0,0);
 cache.set(key,s);return s;
}
function earthLayer(layer){
 if(!documents.has(document))documents.set(document,new Map());const cache=documents.get(document),key='earth-layer:'+layer;if(cache.has(key))return cache.get(key);
 const w=1536,h=220,s=document.createElement('canvas');s.width=w;s.height=h;const c=s.getContext('2d'),palette=['#8eafba','#5e9394','#3f7972','#2c6356'];
 for(let x=0;x<w;x++){
  const y=50+loopNoise(x/128,12,91+layer*41)*60+loopNoise(x/32,48,layer+49)*12;
  rect(c,x,y,1,h-y,palette[layer]);
  if(layer>1&&x%7===0){const tree=8+hash(x,layer,7)*12;rect(c,x,y-tree,2,tree,palette[layer]);rect(c,x-2,y-tree+3,6,Math.max(3,tree-4),palette[layer]);}
 }
 cache.set(key,s);return s;
}
export function drawEarthGround(c,w,h,floor){
 rect(c,0,floor,w,h-floor,'#695343');
 for(let x=0;x<w;x+=2)for(let y=Math.ceil(floor)+5;y<h;y+=2){
  const n=hash(x,y,39),depth=y-floor,field=fbm(x/52,y/29,811,2),rock=depth>17&&field>.57;
  const colors=rock?['#424b51','#626665','#879082']:depth<17?['#4b3c30','#846348','#a47b50']:['#513e35','#745345','#94705a'];
  rect(c,x,y,2,2,colors[Math.floor(n*3)]);
  if(rock&&n>.8)rect(c,x,y,2,1,'#a9ae96');
 }
 rect(c,0,floor,w,2,'#1b3927');rect(c,0,floor+2,w,3,'#3c763e');rect(c,0,floor+5,w,1,'#a4a96b');
 for(let x=0;x<w;x+=3){const v=hash(x,4,9);rect(c,x,floor-1-v*4,1,2+v*4,v>.7?'#c1d276':v>.3?'#7bad52':'#507e40');if(v>.85){rect(c,x,floor+8,1,6,'#4e5836');rect(c,x+1,floor+12,2,1,'#4e5836');}}
}
export function drawEarthEnvironment(c,w,h,time,floor){
 const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#315b95');sky.addColorStop(.45,'#79adcc');sky.addColorStop(.82,'#c1d7d1');sky.addColorStop(1,'#e8d9b8');c.fillStyle=sky;c.fillRect(0,0,w,h);
 for(let ring=4;ring>0;ring--){c.save();c.globalAlpha=.025;rect(c,w*.17-14-ring*7,h*.17-12-ring*7,28+ring*14,24+ring*14,'#fff1c7');c.restore();}
 rect(c,w*.17-7,h*.17-10,14,20,'#fff1c6');rect(c,w*.17-10,h*.17-7,20,14,'#fff1c6');
 for(let layer=0;layer<3;layer++)for(let i=0;i<5;i++){
  const period=w+180,x=((i*173+layer*79+time*(.35+layer*.22))%period)-130,y=h*.07+layer*23+hash(i,layer,8)*19;
  c.save();c.globalAlpha=.6+layer*.13;c.drawImage(cloudSprite((i+layer)%4),Math.round(x),Math.round(y));c.restore();
 }
 for(let layer=0;layer<4;layer++){
  const strip=earthLayer(layer),offset=(time*(.02+layer*.02))%strip.width,y=Math.round(floor-160+layer*18);
  c.drawImage(strip,-Math.round(offset),y);c.drawImage(strip,strip.width-Math.round(offset),y);
 }
 c.save();c.globalAlpha=.6;for(let i=0;i<14;i++){const s=treeSprite(i%4);c.drawImage(s,Math.round(i*w/13-20),Math.round(floor-s.height*.38),Math.round(s.width*.38),Math.round(s.height*.38));}c.restore();
 for(const[i,tx]of[-.025,.105,.92,1.045].entries()){const tree=treeSprite(i);c.save();c.globalAlpha=.25;rect(c,w*tx-15,floor-1,75,3,'#102c25');c.restore();c.drawImage(tree,Math.round(w*tx-48),Math.round(floor-tree.height+3));}
 drawEarthGround(c,w,h,floor);
}
export function earthFacilityDetail(c,w,floor){
 const x=w*.23;
 for(let i=0;i<7;i++){rect(c,x+5+i*12,floor-16,9,1,'#839d9b');rect(c,x+5+i*12,floor-3,9,1,'#475c61');}
 rect(c,x+2,floor-40,88,2,'#e1e5ce');rect(c,x+82,floor-37,7,34,'#749091');
 for(let i=0;i<4;i++){rect(c,x+9+i*19,floor-28,2,9,'#bad9d6');rect(c,x+10+i*19,floor-24,10,1,'#5b8e9e');rect(c,x+8+i*19,floor-17,15,2,'#4b6871');}
 rect(c,x+63,floor-12,14,2,'#e0c58b');rect(c,x+64,floor-9,12,1,'#526e74');
 const pad=w*.68;rect(c,pad-36,floor+1,75,2,'#183038');rect(c,pad-31,floor-3,62,1,'#cfcec0');for(let i=0;i<8;i++){rect(c,pad-31+i*8,floor-1,4,1,i%2?'#e4c780':'#3d4d53');}
}

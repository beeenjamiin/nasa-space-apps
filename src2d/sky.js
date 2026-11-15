import {hash} from './world.js';
import {planetSprite} from './planets.js';

const documents=new WeakMap();
const pixel=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};

/** Fixed star layers: no lunar atmospheric twinkle, no canvas allocation per frame. */
export function starLayer(width,height,space=false){
 if(!documents.has(document))documents.set(document,new Map());const cache=documents.get(document),key=width+':'+height+':'+space;if(cache.has(key))return cache.get(key);
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const c=canvas.getContext('2d');
 const density=Math.max(.5,Math.min(2,width*height/(640*360)));
 // Restrained Milky Way texture, rendered as tiny, uneven neutral pixels.
 for(let i=0;i<Math.round(1100*density);i++){
  const x=hash(i,41)*width,offset=(hash(i,42)+hash(i,43)+hash(i,44)-1.5)*height*.13;
  const y=height*.12+x/width*height*.38+offset;
  c.globalAlpha=space?.18:.075;pixel(c,x,y,i%7?1:2,1,i%3?'#9294ae':'#b8b3b4');
 }
 c.globalAlpha=1;
 for(let i=0;i<Math.round((space?420:290)*density);i++){
  const x=hash(i,3)*width,y=hash(i,7)*height,bright=hash(i,19),colors=space?['#535e7d','#8394af','#c4cbd5','#d6c5a9']:['#343e50','#6c7d90','#b2bdc5','#c6b99c'];
  pixel(c,x,y,bright>.97?2:1,1,colors[Math.floor(hash(i,21)*colors.length)]);
  if(bright>.985){pixel(c,x-1,y,3,1,space?'#8d9bb6':'#72849a');pixel(c,x,y-1,1,3,space?'#8d9bb6':'#72849a');pixel(c,x,y,1,1,'#dce1dd');}
 }
 cache.set(key,canvas);if(cache.size>10)cache.delete(cache.keys().next().value);return canvas;
}

export function drawSun(c,x,y,r=7,{atmosphere=false}={}){
 c.save();
 // Stepped halos are optical/artistic bloom; only Earth/Mars use broad atmospheric glow.
 for(let ring=atmosphere?4:2;ring>0;ring--){c.globalAlpha=atmosphere?.035:.025;const rr=r+ring*(atmosphere?5:2);pixel(c,x-rr,y-rr+2,rr*2,rr*2-4,'#f6d5a0');}
 c.globalAlpha=1;pixel(c,x-r+2,y-r,r*2-4,r*2,'#e8c98f');pixel(c,x-r,y-r+2,r*2,r*2-4,'#e8c98f');pixel(c,x-r+2,y-r+1,r*2-5,r*2-3,'#fff1c8');pixel(c,x-r+4,y-r+2,r*2-9,2,'#fff9e2');c.restore();
}

export function drawSpaceSky(c,width,height,{camX=0,space=false}={}){
 const gradient=c.createLinearGradient(0,0,0,height);gradient.addColorStop(0,space?'#100f27':'#020408');gradient.addColorStop(1,space?'#202340':'#070b11');c.fillStyle=gradient;c.fillRect(0,0,width,height);
 const layer=starLayer(width,height,space),offset=((camX*.018)%width+width)%width;c.drawImage(layer,-Math.round(offset),0);if(offset)c.drawImage(layer,width-Math.round(offset),0);
}

export function drawSurfaceSky(c,width,height,planet,cam,time){
 if(planet==='mars'){
  const g=c.createLinearGradient(0,0,0,height);g.addColorStop(0,'#92645f');g.addColorStop(.5,'#c08b76');g.addColorStop(1,'#e1b598');c.fillStyle=g;c.fillRect(0,0,width,height);
  // Thin stratified haze and distant moons are illustrations, not an ephemeris.
  for(let i=0;i<12;i++){const y=height*(.18+hash(i,62)*.42),x=((hash(i,63)*width-cam.x*.012)%width+width)%width;c.save();c.globalAlpha=.035;pixel(c,x,y,32+Math.floor(hash(i,64)*60),2,'#ecd4ba');c.restore();}
  drawSun(c,width*.77,height*.14,5,{atmosphere:true});pixel(c,width*.25,height*.15,5,3,'#c8b3a0');pixel(c,width*.25+1,height*.15-1,3,5,'#9e8a83');pixel(c,width*.42,height*.095,2,2,'#d6bdab');return;
 }
 drawSpaceSky(c,width,height,{camX:cam.x});
 const ex=width*.76-cam.x*.025,ey=height*.19,r=25;c.imageSmoothingEnabled=false;c.drawImage(planetSprite('earth'),Math.round(ex-r),Math.round(ey-r),r*2,r*2);
 drawSun(c,width*.15-cam.x*.008,height*.12,6);
}

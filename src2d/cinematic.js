import {launchPose,smoothstep} from './scene-motion.js';
import {drawCapsule} from './spacecraft.js';
import {drawAvatar} from './human.js';import {treeSprite,rockSprite} from './decor.js';import {planetSprite} from './planets.js';import {hash} from './world.js';
import {drawEnginePlume,drawLandingDust,smokeSprite} from './effects.js';
import {drawSpaceSky,drawSun} from './sky.js';
export const MOON_TIMELINE=[['walk',0,3],['elevator',3,7],['bridge',7,10],['countdown',10,12],['launch',12,17],['separation',17,19],['orbit',19,23],['transfer',23,29],['landing',29,35]];
const MARS_TIMELINE=[['launch',0,4],['orbit',4,9],['transfer',9,15],['landing',15,21]];
export const EARTH_TIMELINE=[['launch',0,5],['orbit',5,9],['transfer',9,16],['reentry',16,21],['landing',21,26]];
export const cinemaDuration=type=>type==='earth'?26:type==='mars'?21:35;
export function cinemaState(time,type='moon'){const entries=type==='earth'?EARTH_TIMELINE:type==='mars'?MARS_TIMELINE:MOON_TIMELINE,item=entries.find(([,start,end])=>time>=start&&time<end)||entries.at(-1);return {phase:item[0],t:Math.max(0,Math.min(1,(time-item[1])/(item[2]-item[1]))),elapsed:time-item[1]};}
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
function line(c,x,y,ex,ey,color,width=1){const n=Math.ceil(Math.max(Math.abs(ex-x),Math.abs(ey-y)));for(let i=0;i<=n;i++)rect(c,x+(ex-x)*i/n,y+(ey-y)*i/n,width,width,color);}
export class Cinematic{
 constructor(renderer){this.r=renderer;}
 stars(time){const r=this.r;drawSpaceSky(r.ctx,r.width,r.height,{space:true});}
 earthLandscape(time){const r=this.r,c=r.ctx,w=r.width,h=r.height,floor=h*.84;const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#5066e5');g.addColorStop(.65,'#6a9af0');g.addColorStop(1,'#b4cfe5');c.fillStyle=g;c.fillRect(0,0,w,h);
  drawSun(c,w*.17,h*.17,10,{atmosphere:true});
  // Soft color separation comes from discrete pixel clouds and distant mountain planes.
  for(let i=0;i<17;i++){const x=(hash(i,4)*w+time*.8)%(w+90)-50,y=25+hash(i,8)*h*.21;c.drawImage(smokeSprite(i%4,3),Math.round(x),Math.round(y),42+i%4*9,17+i%3*4);}
  for(let l=0;l<4;l++){c.beginPath();c.moveTo(0,floor);for(let x=0;x<=w+4;x+=3){const u=(x+l*71)/87,k=Math.floor(u),t=u-k,a=hash(k,l+11),b=hash(k+1,l+11),ridge=a+(b-a)*t;const yy=floor-37+l*13-ridge*(119-l*16);c.lineTo(x,Math.round(yy));}c.lineTo(w,floor);c.closePath();c.fillStyle=['#8cbed6','#6baabf','#498e9e','#377c79'][l];c.fill();}
  c.save();c.globalAlpha=.38;for(let i=0;i<15;i++){const tree=treeSprite(i%4),scale=.35+(i%3)*.1;c.drawImage(tree,Math.round(i*w/14-25),Math.round(floor-tree.height*scale),Math.round(tree.width*scale),Math.round(tree.height*scale));}c.restore();
  // Natural trees remain outside the launch exclusion area, never on the Moon.
  for(const [i,tx]of[-.025,.105,.92,1.045].entries()){const tree=treeSprite(i);c.drawImage(tree,Math.round(w*tx-48),Math.round(floor-tree.height+3));}
  rect(c,0,floor,w,h-floor,'#79533d');rect(c,0,floor,w,1,'#182b22');rect(c,0,floor+1,w,3,'#77bf45');rect(c,0,floor+4,w,3,'#367a36');for(let x=0;x<w;x+=3){const a=hash(x,9);if(a>.35)rect(c,x,floor-2-a*3,1,3+a*3,'#5cad43');rect(c,x,floor+9+hash(x,7)*40,2,2,'#ad7a4b');if(a>.8)rect(c,x,floor+5,2,4,'#397435');}
  const bx=w*.23;rect(c,bx,floor-40,92,40,'#1c2e38');rect(c,bx+3,floor-38,86,36,'#c0cfbd');rect(c,bx+5,floor-36,82,3,'#e2e3c9');for(let i=0;i<4;i++){rect(c,bx+8+i*19,floor-29,15,13,'#263e53');rect(c,bx+9+i*19,floor-28,13,4,'#7fabb4');}rect(c,bx+8,floor-9,67,3,'#899c92');
  const mount=w*.68;rect(c,mount-33,floor-4,66,8,'#26394b');rect(c,mount-23,floor-15,10,12,'#899e9e');rect(c,mount+13,floor-15,10,12,'#899e9e');rect(c,mount-27,floor-17,54,3,'#374f62');
  return floor;
 }
 tower(floor,progress,bridge){const r=this.r,c=r.ctx,w=r.width,tx=w*.43,deck=floor-126,ink='#1c2534';
  rect(c,tx-18,deck-20,36,148,ink);rect(c,tx-14,deck-17,28,144,'#55697a');rect(c,tx-9,deck-13,18,136,'#263c50');for(let y=deck-14;y<floor;y+=20){line(c,tx-13,y,tx+12,y+18,'#9aaeb8',2);line(c,tx+12,y,tx-13,y+18,'#748b9b',2);}rect(c,tx-21,deck-22,42,5,'#b3c2bc');rect(c,tx-24,floor-2,48,6,'#273848');
  const carY=floor-36-progress*126;rect(c,tx-12,carY,24,36,ink);rect(c,tx-9,carY+3,18,30,'#a7bbb5');rect(c,tx-7,carY+5,14,23,'#38576a');rect(c,tx-9,carY+31,18,3,'#d7d9bc');
  const length=(w*.68-16-(tx+15))*bridge;if(length>0){rect(c,tx+12,deck,length,5,ink);rect(c,tx+12,deck-2,length,2,'#b2c3b7');rect(c,tx+12,deck-23,length,2,'#647f91');for(let x=tx+15;x<tx+length+9;x+=18)rect(c,x,deck-23,2,23,'#829aa9');rect(c,tx+length+6,deck-29,20,30,'#cdd4c4');rect(c,tx+length+9,deck-25,14,20,'#748f9c');}
  return{tx,carY,deck};
 }
 flame(x,y,time,power=1,vacuum=false,ground=null){drawEnginePlume(this.r.ctx,{x,y,time,power,vacuum,ground});}
 ground(planet,time){const r=this.r,c=r.ctx,w=r.width,h=r.height;r.sky(planet,{x:0,y:0},time);const floor=h*.84;rect(c,0,floor,w,h-floor,planet==='mars'?'#aa755d':'#6a768d');rect(c,0,floor,w,2,'#1b2235');rect(c,0,floor+2,w,2,planet==='mars'?'#d4ab79':'#b0b7b2');for(let i=0;i<30;i++){const x=hash(i,8)*w;if(i%4===0)c.drawImage(rockSprite(planet,i%3),x,floor-13);rect(c,x,floor+8+hash(i,7)*35,3,2,'#47516a');}return floor;}
 draw(profile,time,type='moon'){
  if(type==='earth'){this.drawReturn(profile,time);return;}
  const r=this.r,c=r.ctx,w=r.width,h=r.height,{phase,t}=cinemaState(time,type);this.state=cinemaState(time,type);const earth=type!=='mars',shipX=w*.68;
  if(['walk','elevator','bridge','countdown'].includes(phase)||(phase==='launch'&&earth)){
   const launch=launchPose(phase==='launch'?t:0,h);c.save();if(phase==='launch')c.translate(launch.shake,launch.follow);const floor=this.earthLandscape(time),lift=phase==='launch'?launch.rise:0,up=['bridge','countdown','launch'].includes(phase)?1:phase==='elevator'?t:0,arm=phase==='countdown'?1-t:phase==='launch'?0:1,{tx,carY,deck}=this.tower(floor,up,arm);
   // Capsule deck is exactly aligned to the bridge; rocket proportions are artistic.
   c.save();c.translate(shipX,floor-lift);c.scale(1,1.7);r.launcher(0,0);c.restore();
   if(phase==='walk')drawAvatar(c,r.art,profile,tx-90+t*78,floor-34,{time,moving:true});
   if(phase==='elevator'){c.save();c.beginPath();c.rect(tx-10,carY+1,20,34);c.clip();drawAvatar(c,r.art,profile,tx-12,carY+2,{time});c.restore();}
   if(phase==='bridge')drawAvatar(c,r.art,profile,tx-12+t*(shipX-18-tx),deck-34,{time,moving:true});
   if(phase==='countdown'){r.label(String(Math.max(1,3-Math.floor(t*3))),shipX+35,deck-28,'#f7d38d',23);if(t>.68)this.flame(shipX,floor-12,time,smoothstep((t-.68)/.32)*.45,false,floor-5);}
   if(phase==='launch'){c.save();c.globalAlpha=launch.throttle*.23;const glow=c.createRadialGradient(shipX,floor-lift-8,1,shipX,floor-lift-8,36);glow.addColorStop(0,'#ffe1a2');glow.addColorStop(1,'rgba(255,161,78,0)');c.fillStyle=glow;c.fillRect(shipX-36,floor-lift-44,72,72);c.restore();this.flame(shipX,floor-lift-12,time,.3+launch.throttle*1.35,false,floor-5);}c.restore();
   r.label(phase==='walk'?'TIERRA / CENTRO DE LANZAMIENTO':phase==='elevator'?'ASCENSOR / ACCESO A LA TRIPULACIÓN':phase==='bridge'?'PASARELA / EMBARQUE':phase==='countdown'?'ESCOTILLA SELLADA / CUENTA ATRÁS':'DESPEGUE / PRIMERA ETAPA',w/2,24,'#fff0cd',9);return;
  }
  if(phase==='launch'){const floor=this.ground('moon',time),y=floor-t*t*(h+80);r.rocket(w/2,y);this.flame(w/2,y-7,time,.8,true);r.label('SALIDA LUNAR / NUEVA EXPEDICIÓN',w/2,25,'#e5dbbd',10);return;}
  if(phase==='separation'){
   this.stars(time);const cx=w*.52,cy=h*.4;
   c.save();c.translate(cx-18-t*50,cy+75+t*70);c.rotate(-t*.22);r.launcher(0,0,true);c.restore();
   this.capsule(cx+t*22,cy-t*20);rect(c,cx-10+t*22,cy+4-t*20,20,13,'#9aabac');rect(c,cx-7+t*22,cy+17-t*20,14,4,'#424b56');
   r.label('SEPARACIÓN / CÁPSULA LIBRE · RUMBO A ÓRBITA',w/2,25,'#f2d9ab',9);return;
  }
  if(phase==='orbit'){
   this.stars(time);const radius=Math.min(h*.28,w*.17,75),cx=w*.36,cy=h*.59,kind=earth?'earth':'moon';c.drawImage(planetSprite(kind),Math.round(cx-radius),Math.round(cy-radius),radius*2,radius*2);
   const a=.3-t*2.7,rr=radius+47,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*.76;c.strokeStyle='#78889d';c.setLineDash([2,5]);c.beginPath();c.ellipse(cx,cy,rr,rr*.76,0,0,Math.PI*2);c.stroke();c.setLineDash([]);c.save();c.translate(x,y);c.rotate(-a+.6);if(earth){this.capsule(0,0);rect(c,-8,5,16,14,'#9cacac');}else r.rocket(0,0,true);this.flame(0,20,time,.45,true);c.restore();r.label(earth?'ÓRBITA TERRESTRE / PREPARANDO TRANSFERENCIA':'ÓRBITA LUNAR / RUMBO A MARTE',w/2,25,'#e5dbbd',9);return;
  }
  if(phase==='transfer'){
   this.stars(time);const origin=earth?'earth':'moon',destination=earth?'moon':'mars',r0=29-t*15,r1=25+t*22;c.drawImage(planetSprite(origin),Math.round(w*.13-r0),Math.round(h*.48-r0),r0*2,r0*2);c.drawImage(planetSprite(destination),Math.round(w*.85-r1),Math.round(h*.4-r1),r1*2,r1*2);const x=w*(.28+t*.4),y=h*.58-Math.sin(t*Math.PI)*30;c.save();c.translate(x,y);c.rotate(Math.PI/2);if(earth){this.capsule(0,0);rect(c,-8,5,16,14,'#9cacac');}else r.rocket(0,0,true);this.flame(0,20,time,.4,true);c.restore();r.label(earth?'TRANSFERENCIA LUNAR / TIEMPO COMPRIMIDO':'TRANSFERENCIA A MARTE / MESES COMPRIMIDOS',w/2,25,'#e5dbbd',9);return;
  }
  const planet=earth?'moon':'mars',floor=this.ground(planet,time),y=floor-(1-t)**2*h*.65;r.rocket(w*.53,y);if(t<.96)this.flame(w*.53,y-7,time,.3+(1-t)*.6,true);if(t>.66)drawLandingDust(c,time,{x:w*.53,floor,planet,strength:Math.max(.15,(1-t)*2)});r.label(earth?'DESCENSO LUNAR / MOTOR DE ATERRIZAJE':'MARTE / DESCENSO CONTROLADO',w/2,25,'#f2d9b2',10);
 }
 capsule(x,y,parachute=false){drawCapsule(this.r.ctx,x,y,parachute);}
 ocean(time){const r=this.r,c=r.ctx,w=r.width,h=r.height,floor=h*.75,g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#547bd5');g.addColorStop(.7,'#92c8e1');g.addColorStop(1,'#c5e1e3');c.fillStyle=g;c.fillRect(0,0,w,h);drawSun(c,w*.2,h*.2,10,{atmosphere:true});
 for(let layer=0;layer<2;layer++)for(let i=0;i<12;i++){const x=(hash(i,3+layer)*w+time*(.3+layer*.5))%(w+80)-40,y=15+hash(i,7+layer)*h*.35;c.save();c.globalAlpha=layer?.85:.48;c.drawImage(smokeSprite(i%4,3),Math.round(x),Math.round(y),43+i%5*9,15+i%3*4);c.restore();}
 for(let row=0;row<h-floor;row++){const k=row/(h-floor);rect(c,0,floor+row,w,1,k<.15?'#69b4bd':k<.4?'#3799af':k<.7?'#247f9e':'#236781');}
 for(let i=0;i<110;i++){const depth=hash(i,91),x=(hash(i,90)*w+time*(.4+depth*3))%w,y=floor+3+depth*(h-floor-5),width=3+depth*13,crest=Math.sin(time*1.3+i);rect(c,x,y,width,1,i%7===0?'#d2ebe0':crest>.5?'#89cdd0':'#4ca6bb');if(i%5===0)rect(c,x+width*.3,y+1,width*.5,1,'#287f9a');}
 for(let i=0;i<18;i++){const y=floor+3+i*1.3;rect(c,w*.2-5-i*.8+Math.sin(time+i)*3,y,10+i*1.6,1,'rgba(237,223,171,.35)');}return floor;}

 drawEarthHome(profile,time){const r=this.r,c=r.ctx,w=r.width,floor=this.ocean(time),x=w*.3;rect(c,x-52,floor-4,129,13,'#203f51');rect(c,x-44,floor+9,112,5,'#496b74');rect(c,x-49,floor-7,123,3,'#c6cbb5');rect(c,x+30,floor-36,33,29,'#aebcaf');rect(c,x+34,floor-32,25,10,'#395f70');rect(c,x+44,floor-59,2,24,'#bdc7b6');rect(c,x+36,floor-60,18,2,'#d6d5b4');this.capsule(x-20,floor-8);drawAvatar(c,r.art,profile,x+5,floor-41,{time,suited:false});r.label('TIERRA / RECUPERACIÓN DE LA TRIPULACIÓN',w/2,25,'#f0e5c4',9);}
 drawReturn(profile,time){
  const r=this.r,c=r.ctx,w=r.width,h=r.height,{phase,t}=cinemaState(time,'earth');this.state=cinemaState(time,'earth');
  if(phase==='launch'){const floor=this.ground('mars',time),y=floor-t*t*(h+90);r.rocket(w*.53,y);this.flame(w*.53,y-7,time,.8,true);if(t<.35)drawLandingDust(c,time,{x:w*.53,floor,planet:'mars',strength:1-t});r.label('SALIDA DE MARTE / CARGA CIENTÍFICA A BORDO',w/2,25,'#f1dab8',9);return;}
  if(phase==='orbit'){this.stars(time);const cx=w*.36,cy=h*.57,rad=Math.min(h*.25,72),angle=.3-t*2.6;c.drawImage(planetSprite('mars'),cx-rad,cy-rad,rad*2,rad*2);const x=cx+Math.cos(angle)*(rad+55),y=cy+Math.sin(angle)*(rad+55)*.7;this.capsule(x,y);r.label('ÓRBITA MARCIANA / PREPARANDO EL REGRESO',w/2,25,'#e6ddbe',9);return;}
  if(phase==='transfer'){this.stars(time);const from=30-t*13,to=23+t*30;c.drawImage(planetSprite('mars'),w*.12-from,h*.44-from,from*2,from*2);c.drawImage(planetSprite('earth'),w*.84-to,h*.43-to,to*2,to*2);this.capsule(w*(.27+t*.39),h*.57-Math.sin(t*Math.PI)*25);r.label('RUMBO A LA TIERRA / MESES COMPRIMIDOS',w/2,25,'#e6ddbe',9);return;}
  if(phase==='reentry'){const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#232a48');g.addColorStop(1,'#8eafc3');c.fillStyle=g;c.fillRect(0,0,w,h);const rad=h*.75;c.drawImage(planetSprite('earth'),w*.5-rad,h*.88,rad*2,rad*2);const x=w*.53,y=h*.3+t*h*.25;c.save();c.translate(x,y);c.rotate(-.35);for(let i=0;i<18;i++)rect(c,-15+hash(i,6)*28,4+i*2,1+i%3,2,i%3?'#e9ac61':'#f3d497');this.capsule(0,0);rect(c,-14,3,28,2,'#edb070');c.restore();r.label('TIERRA / REENTRADA Y ESCUDO TÉRMICO',w/2,25,'#f3e2bf',9);return;}
  const floor=this.ocean(time),y=floor-3-Math.pow(1-t,1.8)*h*.48;this.capsule(w*.5,y,t<.94);if(t>.9)for(let i=0;i<16;i++)rect(c,w*.5+(i-8)*4,floor-2-Math.sin(t*18+i)*2,2,1,'#d6dfcc');r.label('TIERRA / PARACAÍDAS Y AMERIZAJE',w/2,25,'#f1e7c8',9);
 }
}

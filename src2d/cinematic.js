import {drawAvatar} from './human.js';import {treeSprite,rockSprite} from './decor.js';import {planetSprite} from './planets.js';import {hash} from './world.js';
import {drawEnginePlume,drawLandingDust,smokeSprite} from './effects.js';
import {drawSpaceSky,drawSun} from './sky.js';
export const MOON_TIMELINE=[['walk',0,3],['elevator',3,7],['bridge',7,10],['countdown',10,12],['launch',12,17],['orbit',17,23],['transfer',23,29],['landing',29,35]];
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
  for(let i=0;i<7;i++){const x=(hash(i,4)*w+time*.8)%(w+90)-50,y=25+hash(i,8)*h*.21;c.drawImage(smokeSprite(i%4,3),Math.round(x),Math.round(y),58,25);}
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
   const floor=this.earthLandscape(time),lift=phase==='launch'?t*t*(h+140):0,up=['bridge','countdown','launch'].includes(phase)?1:phase==='elevator'?t:0,arm=phase==='countdown'?1-t:phase==='launch'?0:1,{tx,carY,deck}=this.tower(floor,up,arm);
   // Capsule deck is exactly aligned to the bridge; rocket proportions are artistic.
   c.save();c.translate(shipX,floor-lift);c.scale(1,1.7);r.launcher(0,0);c.restore();
   if(phase==='walk')drawAvatar(c,r.art,profile,tx-90+t*78,floor-34,{time,moving:true});
   if(phase==='elevator'){c.save();c.beginPath();c.rect(tx-10,carY+1,20,34);c.clip();drawAvatar(c,r.art,profile,tx-12,carY+2,{time});c.restore();}
   if(phase==='bridge')drawAvatar(c,r.art,profile,tx-12+t*(shipX-18-tx),deck-34,{time,moving:true});
   if(phase==='countdown')r.label(String(Math.max(1,3-Math.floor(t*3))),shipX+35,deck-28,'#f7d38d',23);
   if(phase==='launch')this.flame(shipX,floor-lift-12,time,1.5,false,floor-5);
   r.label(phase==='walk'?'TIERRA / CENTRO DE LANZAMIENTO':phase==='elevator'?'ASCENSOR / ACCESO A LA TRIPULACIÓN':phase==='bridge'?'PASARELA / EMBARQUE':phase==='countdown'?'ESCOTILLA SELLADA / CUENTA ATRÁS':'DESPEGUE / PRIMERA ETAPA',w/2,24,'#fff0cd',9);return;
  }
  if(phase==='launch'){const floor=this.ground('moon',time),y=floor-t*t*(h+80);r.rocket(w/2,y);this.flame(w/2,y-7,time,.8,true);r.label('SALIDA LUNAR / NUEVA EXPEDICIÓN',w/2,25,'#e5dbbd',10);return;}
  if(phase==='orbit'){
   this.stars(time);const radius=Math.min(h*.28,w*.17,75),cx=w*.36,cy=h*.59,kind=earth?'earth':'moon';c.drawImage(planetSprite(kind),Math.round(cx-radius),Math.round(cy-radius),radius*2,radius*2);
   const a=.3-t*2.7,rr=radius+47,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*.76;c.strokeStyle='#78889d';c.setLineDash([2,5]);c.beginPath();c.ellipse(cx,cy,rr,rr*.76,0,0,Math.PI*2);c.stroke();c.setLineDash([]);c.save();c.translate(x,y);c.rotate(-a+.6);r.rocket(0,0,true);this.flame(0,-6,time,.45,true);c.restore();r.label(earth?'ÓRBITA TERRESTRE / PREPARANDO TRANSFERENCIA':'ÓRBITA LUNAR / RUMBO A MARTE',w/2,25,'#e5dbbd',9);return;
  }
  if(phase==='transfer'){
   this.stars(time);const origin=earth?'earth':'moon',destination=earth?'moon':'mars',r0=29-t*15,r1=25+t*22;c.drawImage(planetSprite(origin),Math.round(w*.13-r0),Math.round(h*.48-r0),r0*2,r0*2);c.drawImage(planetSprite(destination),Math.round(w*.85-r1),Math.round(h*.4-r1),r1*2,r1*2);const x=w*(.28+t*.4),y=h*.58-Math.sin(t*Math.PI)*30;c.save();c.translate(x,y);c.rotate(Math.PI/2);r.rocket(0,0,true);this.flame(0,-7,time,.4,true);c.restore();r.label(earth?'TRANSFERENCIA LUNAR / TIEMPO COMPRIMIDO':'TRANSFERENCIA A MARTE / MESES COMPRIMIDOS',w/2,25,'#e5dbbd',9);return;
  }
  const planet=earth?'moon':'mars',floor=this.ground(planet,time),y=floor-(1-t)**2*h*.65;r.rocket(w*.53,y);if(t<.96)this.flame(w*.53,y-7,time,.3+(1-t)*.6,true);if(t>.66)drawLandingDust(c,time,{x:w*.53,floor,planet,strength:Math.max(.15,(1-t)*2)});r.label(earth?'DESCENSO LUNAR / MOTOR DE ATERRIZAJE':'MARTE / DESCENSO CONTROLADO',w/2,25,'#f2d9b2',10);
 }
 capsule(x,y,parachute=false){const c=this.r.ctx;rect(c,x-7,y-25,14,4,'#212c35');rect(c,x-11,y-21,22,9,'#c1c7b8');rect(c,x-14,y-12,28,10,'#d8d8bc');rect(c,x-15,y-2,30,5,'#4d4f49');rect(c,x-5,y-19,10,7,'#253b48');rect(c,x-3,y-18,6,3,'#90b4b2');rect(c,x+10,y-12,2,9,'#8b9891');if(parachute){line(c,x-10,y-23,x-38,y-66,'#d2d2b7');line(c,x+10,y-23,x+38,y-66,'#d2d2b7');line(c,x,y-23,x,y-79,'#d2d2b7');for(let i=0;i<9;i++){const dx=(i-4)*9,yy=y-85+Math.abs(i-4)*3;rect(c,x+dx-5,yy,10,Math.max(4,y-63-yy),i%2?'#d7dac1':'#cc7955');rect(c,x+dx-4,yy,8,2,i%2?'#f0e9d0':'#e4a76d');}}}
 ocean(time){const r=this.r,c=r.ctx,w=r.width,h=r.height,floor=h*.81,g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#536fca');g.addColorStop(.8,'#afc8d8');c.fillStyle=g;c.fillRect(0,0,w,h);drawSun(c,w*.18,h*.18,9,{atmosphere:true});for(let i=0;i<5;i++)c.drawImage(smokeSprite(i%4,3),Math.round(hash(i,3)*w+Math.sin(time*.07)*8),25+hash(i,7)*50,60,22);rect(c,0,floor,w,h-floor,'#38677b');rect(c,0,floor,w,2,'#acc3bd');for(let i=0;i<50;i++){const x=(hash(i,90)*w+time*(1+i%3))%w,y=floor+4+hash(i,91)*(h-floor-5);rect(c,x,y,5+i%7,1,i%3?'#578c98':'#a0bdba');}return floor;}
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

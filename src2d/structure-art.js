import {visualHash as hash} from './visual-noise.js';
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
export function habitatFinish(c,x,y,active){
 for(let bay=0;bay<4;bay++){
  const bx=x+bay*96;
  for(let i=0;i<10;i++){const py=y+32+i*7;rect(c,bx+19,py,64,1,i%4?'#718078':'#3e514d');rect(c,bx+20,py+1,62,1,'#55665c');}
  for(const dx of[22,78])for(const dy of[36,68,103]){rect(c,bx+dx,y+dy,2,2,'#293f45');rect(c,bx+dx,y+dy,1,1,'#b9bfa7');}
  rect(c,bx+20,y+115,62,2,'#233a3c');rect(c,bx+21,y+116,60,1,'#a8ad99');
  if(active){const g=c.createLinearGradient(0,y+27,0,y+80);g.addColorStop(0,'rgba(222,219,151,.14)');g.addColorStop(1,'rgba(222,219,151,0)');c.fillStyle=g;c.fillRect(bx+13,y+28,70,55);}
 }
}
export function shellFinish(c,x,y){
 for(let bay=0;bay<4;bay++){
  const bx=x+bay*96;
  rect(c,bx+18,y+26,64,1,'#f2ecd8');rect(c,bx+18,y+28,64,1,'#829aa2');
  for(let i=0;i<3;i++){rect(c,bx+20+i*19,y+30,16,2,'#b0c0bd');rect(c,bx+20+i*19,y+32,16,1,'#738f9a');}
  rect(c,bx+34,y+76,27,2,'#e9d6a6');rect(c,bx+36,y+79,23,1,'#7c9296');
  for(let i=0;i<4;i++){rect(c,bx+18+i*18,y+110,9,2,'#526e7d');rect(c,bx+18+i*18,y+109,9,1,'#dce1cc');}
  for(const dx of[7,84])for(const dy of[24,77,107]){rect(c,bx+dx,y+dy,2,2,'#3c5769');rect(c,bx+dx,y+dy,1,1,'#f2e9d3');}
 }
}
export function launcherFinish(c){
 for(let i=0;i<8;i++){const y=-91+i*8;rect(c,-5,y,8,1,'#f5eed8');rect(c,6,y+1,1,5,'#7c9299');}
 rect(c,-6,-62,3,8,'#dd9f62');rect(c,-5,-61,1,5,'#f1c289');
 for(const dx of[-13,13]){rect(c,dx-1,-52,1,27,'#e9e3c5');for(let n=0;n<4;n++)rect(c,dx-2,-50+n*7,4,1,'#7d8f96');}
}

const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
/** Original pixel habitat, informed by NASA pressure-shell/crew-access references. */
export function drawFacade(c,x,y,opacity){if(opacity<=0)return;c.save();c.globalAlpha=opacity;
 const w=400,h=128,ink='#17202d';rect(c,x+8,y,w-16,h,ink);rect(c,x,y+12,w,h-24,ink);rect(c,x+3,y+9,w-6,h-18,ink);rect(c,x+10,y+3,w-20,h-6,'#e4e3d3');rect(c,x+3,y+14,w-6,h-29,'#c5d0cb');rect(c,x+6,y+16,w-12,17,'#e0e5d6');rect(c,x+6,y+96,w-12,20,'#98abae');rect(c,x+6,y+116,w-12,5,'#566d7c');
 for(let bay=0;bay<4;bay++){const bx=x+bay*96+18;rect(c,bx,y+8,1,106,'#8fa3a8');rect(c,bx+2,y+10,1,104,'#f1ebd2');
  // Recessed viewport with stepped corners, gasket, reflection and sill.
  rect(c,bx+11,y+40,54,30,ink);rect(c,bx+8,y+43,60,24,ink);rect(c,bx+12,y+43,52,23,'#5c92a7');rect(c,bx+14,y+44,23,3,'#aecbd1');rect(c,bx+15,y+48,3,15,'#95b5c2');rect(c,bx+46,y+47,15,16,'#36586f');rect(c,bx+8,y+70,60,3,'#e9e4ca');
  for(let i=0;i<5;i++)rect(c,bx+16+i*8,y+89,5,2,'#607c8c');rect(c,bx+19,y+102,38,4,'#b6c6bc');for(const px of[5,76])for(const py of[20,91])rect(c,bx+px,y+py,2,2,'#506775');
 }
 rect(c,x+14,y+11,36,5,'#dfb977');rect(c,x+54,y+11,90,5,'#627f8c');rect(c,x+w-43,y+7,25,3,'#8dabae');
 // Access hatches occupy the same clear thresholds as the physical shell.
 for(const dx of[0,384]){rect(c,x+dx,y+77,16,49,ink);rect(c,x+dx+2,y+79,12,45,'#99aca9');rect(c,x+dx+4,y+82,8,37,'#526e7d');rect(c,x+dx+6,y+96,2,6,'#d8c687');rect(c,x+dx+2,y+75,12,2,'#d9c897');}
 c.restore();}
export function drawHabitatAccents(c,x,y,active){
 // Fixed service conduits, lit ceiling and floor guides stay behind the actor.
 for(let bay=0;bay<4;bay++){const bx=x+bay*96;rect(c,bx+10,y+28,3,73,'#293f51');rect(c,bx+12,y+28,1,73,'#93a8ad');rect(c,bx+15,y+30,3,63,'#3c5b67');rect(c,bx+6,y+24,80,3,active?'#f5df9c':'#647578');rect(c,bx+8,y+28,76,1,'#8b9c8c');rect(c,bx+14,y+119,65,1,active?'#86bea8':'#52676d');}
}

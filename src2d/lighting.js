export function darknessAtDepth(depth){const t=Math.max(0,Math.min(1,(depth-6)/150));return t*t*(3-2*t);}
export class CaveLighting{
 constructor(){this.amount=0;this.world=null;this.mask=null;}
 draw(c,width,height,sim,cam,dt){
  if(this.world!==sim.world){this.world=sim.world;this.amount=0;}
  const p=sim.s.player,depth=p.y-sim.world.surfaceAt(Math.floor(p.x/8))*8,target=darknessAtDepth(depth);
  this.amount+=(target-this.amount)*(1-Math.exp(-3*Math.max(0,dt)));
  if(this.amount<.002)return;
  if(!this.mask){this.mask=document.createElement('canvas');}if(this.mask.width!==width||this.mask.height!==height){this.mask.width=width;this.mask.height=height;}
  const m=this.mask.getContext('2d');m.globalCompositeOperation='source-over';m.clearRect(0,0,width,height);m.fillStyle=`rgba(3,8,12,${.9*this.amount})`;m.fillRect(0,0,width,height);m.globalCompositeOperation='destination-out';
  const light=(x,y,r,strength)=>{const g=m.createRadialGradient(x,y,10,x,y,r);g.addColorStop(0,`rgba(255,255,255,${strength})`);g.addColorStop(.45,`rgba(255,255,255,${strength*.85})`);g.addColorStop(1,'rgba(255,255,255,0)');m.fillStyle=g;m.fillRect(x-r,y-r,r*2,r*2);};
  light(p.x+6-cam.x,p.y+14-cam.y,115,.99);
  for(const f of sim.s.fixtures)if(f.type==='lamp'&&f.planet===sim.s.planet&&f.charge>0&&Math.abs(f.x-cam.x-width/2)<width/2+150&&Math.abs(f.y-cam.y-height/2)<height/2+150)light(f.x-cam.x+5,f.y-cam.y-12,145,.99);
  m.globalCompositeOperation='source-over';c.drawImage(this.mask,0,0);
 }
}

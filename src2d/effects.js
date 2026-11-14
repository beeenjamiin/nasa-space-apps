import {hash} from './world.js';

const documents=new WeakMap();
const pixel=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
const polygon=(c,points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};

/** Cached, stepped smoke sprites: no blur/filter or per-frame canvas allocation. */
export function smokeSprite(variant=0,stage=0) {
  if(!documents.has(document))documents.set(document,new Map());
  const cache=documents.get(document),key=(variant%4)+':'+Math.min(3,stage);
  if(cache.has(key))return cache.get(key);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
  const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  const lobes=[[10,18,9],[18,17,10],[15,10,8],[23,20,6],[7,23,5]];
  for(const [i,[cx,cy,r]]of lobes.entries()){
    const x=cx+(hash(i,variant+2)-.5)*3,y=cy+(hash(i,variant+6)-.5)*3;
    polygon(c,[[x-r,y-3],[x-r+3,y-7],[x-3,y-r],[x+3,y-r],[x+r-1,y-5],[x+r,y+3],[x+5,y+r-1],[x-3,y+r],[x-r,y+4]],['#777b80','#929595','#b1b1a8','#c0c0b4'][stage]);
    polygon(c,[[x-r+3,y-3],[x-3,y-r+2],[x+3,y-r+2],[x+r-3,y-3],[x+5,y],[x-4,y+2]],['#bdc3bf','#ced0c4','#dcdac9','#e3dfce'][stage]);
    pixel(c,x-4,y-r+3,5,2,['#e4e4cf','#e5e2d0','#eeead7','#eee9d8'][stage]);
  }
  // Quantize the antialiased polygon boundaries back to hard pixel alpha.
  const im=c.getImageData(0,0,32,32);for(let i=3;i<im.data.length;i+=4)im.data[i]=im.data[i]>100?255:0;c.putImageData(im,0,0);
  cache.set(key,canvas);return canvas;
}

/** Analytical particles can be scrubbed to any cinematic timestamp. */
export function drawEnginePlume(c,{x,y,time,power=1,vacuum=false,ground=null}) {
  const pulse=1+Math.sin(time*41)*.09;
  c.save();
  if(!vacuum){
    for(let i=0;i<24;i++){
      const age=(time*.8+i*.38196601125)%1,side=i%2?1:-1,size=Math.round(8+age*30*power);
      const sx=x+side*(2+age*17)*power,sy=y+24*power+age*85*power;
      if(ground!==null&&sy>ground+8)continue;
      c.globalAlpha=(1-age)*.75;c.drawImage(smokeSprite(i%4,Math.min(3,Math.floor(age*4))),Math.round(sx-size/2),Math.round(sy-size/2),size,size);
    }
    for(let i=0;i<46;i++){
      const age=(time*.42+i*.61803398875)%1,side=i%2?1:-1;
      const sx=x+side*(8+age*85*power),sy=(ground??y+34)+5-age*age*39;
      const size=Math.round(13+age*29),stage=Math.min(3,Math.floor(age*4));
      c.globalAlpha=(1-age)**.65*.75;
      c.drawImage(smokeSprite(i%4,stage),Math.round(sx-size/2),Math.round(sy-size/2),size,size);
    }
    c.globalAlpha=1;
  }
  // Nested hot core and stepped flame tongues, animated at the pixel grid.
  for(let j=13;j>=0;j--){
    const flicker=hash(j,Math.floor(time*24)),width=Math.max(1,(15-j)*(vacuum?1.15:.68)*power*pulse);
    const yy=y+j*2.1*power;
    pixel(c,x-width*.5+(flicker-.5)*3,yy,width,4*power,j<4?'#fff2c8':j<8?'#ffd16c':j<11?'#ef933f':'#be5d3d');
    if(j<8)pixel(c,x-width*.2,yy,width*.4,3*power,'#fff5d1');
  }
  for(let i=0;i<9;i++){const age=(time*2.1+i*.137)%1;pixel(c,x+(hash(i,9)-.5)*18*power,y+age*40*power,1+(i%2),2,age>.7?'#cb7745':'#ffe19b');}
  c.restore();
}

/** No lunar smoke: dust grains follow gravity and settle back to the ground. */
export function landingDust(time,{x,floor,planet='moon',strength=1}={}) {
  const particles=[],gravity=(planet==='moon'?1.62:3.71)*16;
  for(let i=0;i<52;i++){
    const age=(time*.7+i*.61803398875)%1*1.25,side=i%2?1:-1;
    const vx=side*(24+hash(i,3)*70)*strength,vy=-(7+hash(i,4)*20)*strength;
    const height=vy*age+.5*gravity*age*age;
    if(height>0)continue;
    particles.push({x:x+vx*age,y:floor+height,size:i%5===0?2:1,alpha:1-age/1.5});
  }
  return particles;
}
export function drawLandingDust(c,time,options){c.save();for(const p of landingDust(time,options)){c.globalAlpha=p.alpha;pixel(c,p.x,p.y,p.size,1,options.planet==='mars'?'#dbad7b':'#c8c8b8');}c.restore();}

function fragmentSprite(color,variant){
 if(!documents.has(document))documents.set(document,new Map());const cache=documents.get(document),key='chip:'+color+':'+variant;if(cache.has(key))return cache.get(key);
 const masks=[['..##..','.####.','#####.','.####.','..##..'],['.###..','#####.','.#####','..###.','...#..'],['..##..','..###.','.#####','#####.','.###..']],mask=masks[variant%3],canvas=document.createElement('canvas');canvas.width=6;canvas.height=5;const c=canvas.getContext('2d');for(let y=0;y<5;y++)for(let x=0;x<6;x++)if(mask[y][x]==='#'){const edge=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>mask[y+dy]?.[x+dx]!=='#');pixel(c,x,y,1,1,edge?'#26333e':color);}pixel(c,2,1,1,1,'#d5d7c4');cache.set(key,canvas);return canvas;
}

/** Bounded gameplay debris. No timers, DOM nodes or unbounded sprite lists. */
export class PixelParticles {
  constructor(limit=112){this.limit=limit;this.items=[];this.previousMine=null;this.previousHit=null;this.previousBoost=null;this.previousStep=0;this.lastTime=null;this.world=null;}
  burst(x,y,count,seed,{planet='moon',boost=false,chip=false,normal=null,block=1}={}){
    const gravity=(planet==='moon'?1.62:3.71)*16;
    for(let i=0;i<count;i++){
      if(this.items.length>=this.limit)this.items.shift();
      this.items.push({x,y,vx:(hash(i,seed)-.5)*(boost?18:54)+(normal?.nx||0)*22,vy:boost?15+hash(i,seed+1)*35:-10-hash(i,seed+2)*22+(normal?.ny||0)*8,gravity,age:0,life:boost?.28:.55+hash(i,seed+4)*.4,size:chip?4+i%3:1+i%2,chip,shape:i%3,color:boost?['#f6d387','#ffeec1','#dc8a50'][i%3]:block===4?'#9ecbd0':block===3?'#c29d78':planet==='moon'?['#c5c9bc','#909f9f','#536477'][i%3]:['#d1a27c','#a57055','#724b46'][i%3]});
    }
  }
  update(time,sim){
    if(this.world!==sim.world){this.items.length=0;this.world=sim.world;this.lastTime=time;this.previousMine=sim.lastMine;this.previousHit=sim.lastMineHit;this.previousBoost=sim.lastBoostAt;this.previousStep=0;}
    const dt=Math.max(0,Math.min(.1,time-(this.lastTime??time)));this.lastTime=time;
    if(sim.lastMine!==this.previousMine){this.previousMine=sim.lastMine;if(sim.lastMine)this.burst(sim.lastMine.x,sim.lastMine.y,16,Math.floor(time*99),{planet:sim.s.planet,chip:true});}
    if(sim.lastMineHit!==this.previousHit){this.previousHit=sim.lastMineHit;if(sim.lastMineHit){const hit=sim.lastMineHit;this.burst(hit.x,hit.y,5,Math.floor(time*197),{planet:sim.s.planet,chip:true,normal:hit,block:hit.block});}}
    if(sim.lastBoostAt!==this.previousBoost){this.previousBoost=sim.lastBoostAt;if(sim.lastBoostAt!==undefined)this.burst(sim.s.player.x+6,sim.s.player.y+24,12,Math.floor(time*77),{planet:sim.s.planet,boost:true});}
    const step=Math.floor((sim.animation?.distance??0)/13);if(step!==this.previousStep){this.previousStep=step;if(sim.s.player.grounded&&!sim.world.inside(sim.s.player))this.burst(sim.s.player.x+6,sim.s.player.y+32,3,step,{planet:sim.s.planet});}
    for(let i=this.items.length-1;i>=0;i--){const p=this.items[i];p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt+.5*p.gravity*dt*dt;p.vy+=p.gravity*dt;if(p.age>=p.life||sim.world.solidAt(p.x,p.y))this.items.splice(i,1);}
  }
  draw(c,cam){c.save();for(const p of this.items){c.globalAlpha=Math.min(1,(p.life-p.age)*5);if(p.chip)c.drawImage(fragmentSprite(p.color,p.shape),Math.round(p.x-cam.x-p.size/2),Math.round(p.y-cam.y-p.size/2),p.size,p.size);else pixel(c,p.x-cam.x,p.y-cam.y,p.size,p.size,p.color);}c.restore();}
}

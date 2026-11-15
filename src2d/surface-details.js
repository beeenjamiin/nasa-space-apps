import {rockSprite} from './decor.js';
import {visualHash as hash} from './visual-noise.js';
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
/** Cosmetic props only: sampled in world space, culled, never written into the tile map. */
export function drawSurfaceDetails(c,world,cam,width,height){
 const mars=world.planet==='mars',seed=world.seed;
 for(let cell=Math.floor((cam.x-56)/40);cell<=Math.ceil((cam.x+width+56)/40);cell++){
  const wx=cell*40+hash(cell,4,seed)*24,tx=Math.floor(wx/8);if(tx<2||tx>637||tx>=24&&tx<=108)continue;
  const ground=world.groundY(wx),x=Math.round(wx-cam.x),y=Math.round(ground-cam.y),n=hash(cell,8,seed);
  if(y<-35||y>height+40)continue;
  if(n>.46){const variant=Math.floor(hash(cell,9,seed)*6),rock=rockSprite(world.planet,variant);c.save();c.globalAlpha=mars?.2:.55;c.fillStyle='#101823';c.beginPath();c.ellipse(x+rock.width*.48,y+1,rock.width*.65,2,0,0,Math.PI*2);c.fill();c.restore();c.drawImage(rock,x-rock.width/2,y-rock.height+2);}
  for(let i=0;i<3;i++){
   const dx=hash(cell,i,seed+71)*27-12,gy=world.groundY(wx+dx)-cam.y;if(Math.abs(gy-y)>12)continue;
   rect(c,x+dx,gy-2,2+i%2,1,mars?'#e1ae7a':'#b5bdb9');rect(c,x+dx+1,gy-1,3,1,mars?'#744a40':'#38434f');
  }
  if(mars&&n<.32){for(let i=0;i<7;i++)rect(c,x-12+i*4,y+2+(i%3),3,1,i%2?'#d2a16d':'#915f48');}
 }
 // Keep the existing survey poles at their original world locations.
 for(let tx=Math.max(0,Math.floor(cam.x/8)-2);tx<Math.min(640,Math.ceil((cam.x+width)/8)+2);tx++)if(tx%94===0&&tx>108){const x=tx*8-cam.x,y=world.groundY(tx*8)-cam.y;rect(c,x,y-29,2,29,'#afb9ad');rect(c,x-6,y-29,15,4,'#d1d4bc');rect(c,x+7,y-31,2,2,'#d5b26e');}
}

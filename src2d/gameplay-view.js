/** World-only drawing hooks; no HUD, input bindings, cinematics or map UI. */
import {MATERIALS} from './block-materials.js';
import {geologyTile} from './materials.js';
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
export function drawRover(c,v,cam={x:0,y:0},time=0,occupied=false){
 const x=v.x-cam.x,y=v.y-cam.y,spin=Math.floor(time*Math.abs(v.vx)/8)%3;
 rect(c,x+1,y+7,46,11,'#19262d');rect(c,x+3,y+9,42,7,'#b99c73');rect(c,x+7,y+7,34,3,'#e5d1a0');
 for(const dx of[3,19,35]){rect(c,x+dx,y+16,10,8,'#18242c');rect(c,x+dx+2,y+18,6,4,'#697579');rect(c,x+dx+3+spin,y+18,1,4,'#c4c4ae');}
 rect(c,x+14,y-8,22,3,'#c5cbbc');rect(c,x+14,y-6,2,15,'#81999b');rect(c,x+34,y-6,2,15,'#81999b');rect(c,x+17,y+4,16,6,'#394e50');
 rect(c,x+(v.facing>0?43:1),y+9,4,3,occupied?'#f6e3a5':'#bfc4aa');rect(c,x+7,y-2,2,9,'#d6d1b3');rect(c,x+5,y-4,6,2,'#7fafa3');
}
export function drawGameplayWorld(c,sim,cam,time){
 for(const v of sim.s.vehicles)if(v.planet===sim.s.planet&&v.x+48>cam.x&&v.x<cam.x+c.canvas.width)drawRover(c,v,cam,time,sim.s.driving===v.id);
 for(const b of sim.collapses){const material=MATERIALS[b.material];c.save();c.globalAlpha=Math.min(1,3-b.age);geologyTile(c,material.block,Math.round(b.x-cam.x),Math.round(b.y-cam.y),b.tx,b.ty,{materialAt:()=>material,get:()=>0});c.restore();}
}

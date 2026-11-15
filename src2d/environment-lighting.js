/** Warm light pools for existing powered equipment. No changes to energy or lamp charge. */
export function drawEquipmentGlow(c,sim,cam){
 const s=sim.s,inside=sim.world.inside(s.player),online=s.planet==='moon'?s.flags.baseOnline:s.flags.marsOnline;
 c.save();c.globalCompositeOperation='screen';
 const glow=(x,y,r,strength)=>{const g=c.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,`rgba(245,213,137,${strength})`);g.addColorStop(.4,`rgba(189,170,115,${strength*.35})`);g.addColorStop(1,'rgba(100,135,150,0)');c.fillStyle=g;c.fillRect(Math.round(x-r),Math.round(y-r),r*2,r*2);};
 if(inside&&online&&s.resources.energy>0)for(const mx of[25,30,35,39])glow(mx*16-cam.x,27*16-cam.y,38,.11);
 for(const f of s.fixtures)if(f.type==='lamp'&&f.planet===s.planet&&f.charge>0&&Math.abs(f.x-cam.x-c.canvas.width/2)<c.canvas.width/2+70&&Math.abs(f.y-cam.y-c.canvas.height/2)<c.canvas.height/2+70)glow(f.x+5-cam.x,f.y-13-cam.y,55,.18);
 c.restore();
}

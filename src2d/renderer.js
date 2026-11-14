import {drawFacade,drawHabitatAccents} from './habitat.js';
import {treeSprite,rockSprite} from './decor.js';
import {drawAvatar} from './human.js';
import {Cinematic,cinemaDuration} from './cinematic.js';
import {planetSprite} from './planets.js';
import {PixelParticles} from './effects.js';
import {drawSurfaceSky} from './sky.js';
import {geologyTile} from './materials.js';
import {CaveLighting} from './lighting.js';
import {drawFixture,drawDiscovery} from './equipment-view.js';
import {discoverySites} from './expedition.js';
import {drawGameplayWorld} from './gameplay-view.js';
import {TILE,UNIT,WIDTH,HEIGHT,BLOCK,hash,STATIONS} from './world.js';
export async function loadArt(){const human=new Image();human.src='assets/pixel/humans/astro.png';await human.decode();return {human};}
export {drawAvatar} from './human.js';

const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
export class Renderer{
 constructor(canvas,art){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.art=art;this.chunks=new Map();this.particles=new PixelParticles();this.caveLighting=new CaveLighting();this.placementPreview=null;this.cam={x:0,y:0};this.width=640;this.height=360;this.time=0;this.facadeOpacity=1;this.cinema=new Cinematic(this);this.resize();}
 resize(){const ratio=window.innerWidth/window.innerHeight;this.width=Math.max(280,Math.min(880,Math.round(window.innerWidth/2)));this.height=Math.max(240,Math.round(this.width/ratio));this.canvas.width=this.width;this.canvas.height=this.height;this.ctx.imageSmoothingEnabled=false;}
 sky(planet,cam,time){const c=this.ctx,w=this.width,h=this.height;drawSurfaceSky(c,w,h,planet,cam,time);
  // Distant silhouettes remain visible across the whole scrolling world.
  for(let layer=0;layer<3;layer++){c._ridgeY=null;c.beginPath();c.moveTo(0,h);for(let x=0;x<=w+8;x+=8){const v=x+cam.x*(.1+layer*.09),ridge=Math.sin(v*.012+layer*2)*18+Math.sin(v*.031+layer)*9+Math.sin(v*.067)*3,y=h*.66+layer*22+ridge;c.lineTo(x,c._ridgeY??Math.round(y));c.lineTo(x,Math.round(y));c._ridgeY=Math.round(y);}c.lineTo(w,h);c.closePath();c.fillStyle=planet==='moon'?['#22272c','#33393d','#454c4d'][layer]:['#66483f','#82513e','#9d654b'][layer];c.fill();}
 }
 earth(x,y,r){this.ctx.drawImage(planetSprite('earth'),Math.round(x-r),Math.round(y-r),r*2,r*2);}

 tile(c,id,x,y,tx,ty,planet){
  const ink='#1b2131',moon=planet==='moon',r=(dx,dy,w,h,color)=>rect(c,x+dx,y+dy,w,h,color);
  if(id===BLOCK.HULL){r(0,0,8,8,'#bac6c6');r(0,0,8,1,ink);r(0,1,8,1,'#ece7d2');r(1,4,1,2,'#738b98');r(0,7,8,1,'#637d8c');return;}
  if(id===BLOCK.FLOOR){r(0,0,8,8,'#405361');r(0,0,8,1,ink);r(0,1,8,1,'#acbdb1');r(2,3,4,1,'#243545');r(2,6,4,1,'#243545');return;}
  geologyTile(c,id,x,y,tx,ty,this.world);
 }

 terrain(world){if(this.world!==world){this.chunks.clear();this.world=world;}for(const key of world.dirtyChunks)this.chunks.delete(key);world.dirtyChunks.clear();const c=this.ctx,cam=this.cam;
  const minX=Math.max(0,Math.floor(cam.x/128)),maxX=Math.min(39,Math.floor((cam.x+this.width)/128)),minY=Math.max(0,Math.floor(cam.y/128)),maxY=Math.min(10,Math.floor((cam.y+this.height)/128));
  for(let cy=minY;cy<=maxY;cy++)for(let cx=minX;cx<=maxX;cx++){const key=cx+','+cy;let chunk=this.chunks.get(key);if(!chunk){chunk=document.createElement('canvas');chunk.width=chunk.height=128;const cc=chunk.getContext('2d');for(let y=0;y<16;y++)for(let x=0;x<16;x++){const tx=cx*16+x,ty=cy*16+y,id=world.get(tx,ty);if(id&&ty<HEIGHT)this.tile(cc,id,x*TILE,y*TILE,tx,ty,world.planet);else if(ty>world.surfaceAt(tx)){rect(cc,x*TILE,y*TILE,8,8,world.planet==='moon'?'#292a3b':'#382833');rect(cc,x*TILE+2,y*TILE+3,3,1,world.planet==='moon'?'#35384b':'#4c3440');}}this.chunks.set(key,chunk);if(this.chunks.size>64)this.chunks.delete(this.chunks.keys().next().value);}c.drawImage(chunk,Math.round(cx*128-cam.x),Math.round(cy*128-cam.y));}
 }
 solar(x,y,online=true,supports=[y,y],tier=1){const c=this.ctx;for(const [i,dx]of[10,25].entries()){rect(c,x+dx-1,y-14,4,Math.max(14,supports[i]-y+14),'#1b2635');rect(c,x+dx,y-13,2,Math.max(13,supports[i]-y+13),'#a8bfbd');rect(c,x+dx-4,supports[i]-2,10,2,'#6e8c9b');}rect(c,x+10,y-24,2,24,'#adb6ad');rect(c,x-7,y-30,39,21,'#141720');rect(c,x-5,y-28,35,3,'#bfc4b9');rect(c,x-4,y-25,33,14,online?['#3f6170','#5d7275','#655f7b'][tier-1]:'#313e42');for(let i=0;i<5;i++)rect(c,x-2+i*6,y-25,1,13,'#8aaba7');rect(c,x-4,y-19,33,1,'#8aaba7');rect(c,x-8,y,40,2,'#272e2e');if(tier>1)for(let i=0;i<tier;i++)rect(c,x+25-i*4,y-28,2,2,tier===3?'#d8c3f0':'#e0c18a');}
 rocket(x,y,small=false){const c=this.ctx;c.save();c.translate(Math.round(x),Math.round(y));if(small)c.scale(.75,.75);const ink='#141720';
  // Stepped silhouette: ascent cabin, foil-wrapped descent stage and splayed legs.
  rect(c,-8,-65,16,3,ink);rect(c,-13,-62,26,5,ink);rect(c,-16,-57,32,28,ink);rect(c,-12,-59,24,28,'#c1c4b2');rect(c,-8,-62,16,4,'#ece7cd');rect(c,-14,-54,2,21,'#777f82');rect(c,11,-54,2,20,'#777f82');rect(c,-8,-54,17,16,ink);rect(c,-6,-52,13,12,'#577c8b');rect(c,-5,-51,4,8,'#adc3bd');rect(c,-12,-34,24,5,'#838e86');
  rect(c,-19,-30,38,20,ink);rect(c,-17,-28,34,16,'#ac865b');rect(c,-15,-26,30,4,'#ddc08a');for(let i=0;i<5;i++){rect(c,-14+i*6,-22,2,9,'#735b4e');rect(c,-11+i*6,-19,2,2,'#e4ca92');}rect(c,-7,-14,14,9,ink);rect(c,-5,-12,10,5,'#5b6464');
  for(const side of[-1,1]){for(let k=0;k<4;k++){rect(c,side*(16+k*3)-(side>0?0:3),-22+k*4,4,6,ink);rect(c,side*(16+k*3)-(side>0?0:3)+1,-21+k*4,2,4,'#9fa68e');}rect(c,side*28-8,-5,16,4,ink);rect(c,side*28-6,-4,12,2,'#c2bf9e');}rect(c,17,-66,2,34,ink);rect(c,15,-67,6,2,'#c8c8ae');rect(c,16,-69,4,2,'#d4ad69');c.restore();}
 launcher(x,y){const c=this.ctx;c.save();c.translate(Math.round(x),Math.round(y));const ink='#141720';rect(c,-4,-109,8,6,ink);rect(c,-7,-103,14,7,ink);rect(c,-10,-96,20,77,ink);rect(c,-8,-96,16,74,'#dddcc5');rect(c,-6,-100,12,5,'#dddcc5');rect(c,-3,-106,6,6,'#ece7cc');rect(c,4,-91,3,62,'#a6afa8');for(const yy of[-83,-64,-43]){rect(c,-9,yy,18,6,ink);rect(c,-7,yy+1,14,3,'#656e70');}rect(c,-5,-92,10,7,ink);rect(c,-3,-91,6,4,'#7ea1a5');for(const side of[-1,1]){rect(c,side*13-4,-58,8,42,ink);rect(c,side*13-2,-56,4,38,'#b6b7a6');rect(c,side*13-3,-18,6,8,ink);}rect(c,-8,-23,16,12,ink);rect(c,-5,-19,10,11,'#626564');c.restore();}

 base(s){const c=this.ctx,x=20*UNIT-this.cam.x,y=25*UNIT-this.cam.y,w=25*UNIT,h=8*UNIT,active=s.planet==='moon'?s.flags.baseOnline:s.flags.marsOnline;
  rect(c,x,y,w,h,'#283335');rect(c,x+3,y+4,w-6,h-8,'#4b5957');for(let n=0;n<12;n++){const px=x+10+n*32;rect(c,px,y+12,28,85,'#66716a');rect(c,px+2,y+14,24,1,'#889187');rect(c,px+2,y+95,24,1,'#394844');}
  // Windows, functional stations and service lines in a cutaway pressure habitat.
  for(let n=0;n<4;n++){const wx=x+30+n*88;rect(c,wx,y+22,47,27,'#1d2b31');rect(c,wx+2,y+24,43,22,'#111c23');rect(c,wx+5,y+28,2,2,'#9ca8a2');rect(c,wx+4,y+46,39,2,'#9baba5');}
  rect(c,x+7,y+9,w-14,3,'#a7aca0');rect(c,x+7,y+15,w-14,2,'#263637');for(let i=0;i<12;i++)rect(c,x+10+i*32,y+7,3,14,'#b4b8a9');rect(c,x+8,y+20,w-16,2,active?'#dcd7b2':'#737b70');
  for(const st of STATIONS.filter(o=>['control','lab','bench','storage'].includes(o.id))){const sx=st.x*UNIT-this.cam.x;rect(c,sx-14,y+82,33,36,'#141720');rect(c,sx-12,y+83,29,33,'#303e3f');rect(c,sx-14,y+81,33,3,'#b6bdb0');rect(c,sx-13,y+59,30,23,'#121822');rect(c,sx-11,y+61,26,20,'#17282b');rect(c,sx-9,y+63,22,15,active?'#537b74':'#394444');for(let i=0;i<3;i++)rect(c,sx-7,y+66+i*4,5+i*4,1,active?'#a7d5ac':'#65726a');rect(c,sx-8,y+89,7,2,'#869888');rect(c,sx+5,y+88,4,14,'#768379');this.label(st.id==='control'?'CONTROL':st.id==='lab'?'CIENCIA':st.id==='bench'?'TALLER':'AGUA',sx+2,y+55,'#e4dfc5',6);}
  // Bunks, resource tanks and secured cargo leave the central walking lane clear.
  for(let k=0;k<1;k++){const bx=x+18;rect(c,bx,y+89,28,4,'#a9b7ab');rect(c,bx,y+110,28,4,'#a9b7ab');rect(c,bx,y+83,2,35,'#c5c9b8');rect(c,bx+27,y+83,2,35,'#c5c9b8');rect(c,bx+3,y+85,20,4,'#8e9d80');rect(c,bx+3,y+106,20,4,'#8e9d80');rect(c,bx+4,y+84,5,3,'#dedccb');}
  rect(c,x+54,y+84,17,34,'#1c2b3c');rect(c,x+56,y+86,13,30,'#91aaa6');for(const yy of[92,103,114])rect(c,x+59,y+yy,7,2,'#445f70');const lab=30*UNIT-this.cam.x;rect(c,lab+23,y+87,15,29,'#22384b');for(let i=0;i<3;i++){rect(c,lab+25+i*4,y+93,2,18,'#9fc0b0');rect(c,lab+25+i*4,y+92,2,3,'#d8c78e');}const workshop=35*UNIT-this.cam.x;rect(c,workshop+25,y+78,17,37,'#304c5d');for(let i=0;i<3;i++){rect(c,workshop+28+i*4,y+84,2,16,'#b7c7b5');rect(c,workshop+27+i*4,y+83,4,3,'#c7b286');}
  for(let k=0;k<2;k++){rect(c,x+347+k*15,y+82,11,36,'#9baaa1');rect(c,x+349+k*15,y+84,7,31,'#6c8985');rect(c,x+350+k*15,y+89,2,20,'#b4c5b1');}
  // A visible growing tray and shelter status connect the NASA systems to the room.
  const crop=s.support.crops[s.planet],gx=39*UNIT-this.cam.x+16;rect(c,gx,y+42,34,25,'#1d2928');rect(c,gx+2,y+43,30,2,active?'#d7d6af':'#647267');rect(c,gx+2,y+63,30,3,'#a3997c');for(let i=0;i<4;i++){const height=crop?4+(1-crop.remaining/12)*10:4;rect(c,gx+6+i*7,y+62-height,1,height,'#86b358');rect(c,gx+4+i*7,y+60-height,3,2,'#4b9650');rect(c,gx+7+i*7,y+58-height,3,2,'#8cc65b');}rect(c,x+w-15,y+25,4,4,s.support.weather[s.planet].phase==='active'?'#e2a361':'#8cac82');
  const eva=42*UNIT-this.cam.x;rect(c,eva-9,y+58,20,59,'#263b42');rect(c,eva-7,y+60,16,54,'#82958b');rect(c,eva-3,y+64,8,9,s.equipment.suited?'#354f5a':'#cfddcc');rect(c,eva-4,y+76,10,20,s.equipment.suited?'#4f6968':'#bdcbbb');this.label('EVA',eva+1,y+54,'#dfdcc2',6);
  drawHabitatAccents(c,x,y,active);for(const edge of[20,44]){const doorX=edge*UNIT-this.cam.x,near=Math.abs(s.player.x-edge*UNIT)<42;rect(c,doorX-3,y+77,22,4,'#b5bcae');rect(c,doorX-3,y+79,3,49,'#e0dfca');rect(c,doorX+16,y+79,3,49,'#e0dfca');if(!near){rect(c,doorX,y+99,16,29,'#596f6a');rect(c,doorX+2,y+101,12,24,'#75928a');}rect(c,doorX-2,y+84,1,9,near?'#a2c68d':'#d1ad70');}
 }
 label(text,x,y,color='#dadcc8',size=8){const c=this.ctx;c.fillStyle=color;c.font=`${size}px Silkscreen, monospace`;c.textAlign='center';c.fillText(text,Math.round(x),Math.round(y));}
 render(sim,time,{menu=false}={}){const s=sim.s,p=s.player,c=this.ctx;this.time=time;const targetX=Math.max(0,Math.min(WIDTH*TILE-this.width,p.x-this.width*.45)),targetY=Math.max(0,Math.min(HEIGHT*TILE-this.height,p.y-this.height*.6));this.cam.x=targetX;this.cam.y=targetY;this.sky(s.planet,this.cam,time);const inside=sim.world.inside(p),dt=Math.min(.1,Math.max(0,time-(this.lastRenderTime??time)));this.lastRenderTime=time;if(this.facadeWorld!==sim.world){this.facadeWorld=sim.world;this.facadeOpacity=inside?0:1;}else{const target=inside?0:1,step=dt/.45;this.facadeOpacity=target>this.facadeOpacity?Math.min(1,this.facadeOpacity+step):Math.max(0,this.facadeOpacity-step);}this.base(s);this.terrain(sim.world);
  drawFacade(c,20*UNIT-this.cam.x,25*UNIT-this.cam.y,this.facadeOpacity);const cam=this.cam,solar=s.planet==='moon'?s.flags.solarOnline:s.flags.marsOnline;this.solarLayouts=[];for(const panel of[{x:47*UNIT,tier:1},{x:50*UNIT,tier:1},{x:53*UNIT,tier:1},...s.solarPanels.filter(a=>a.planet===s.planet)]){const px=panel.x,samples=Array.from({length:11},(_,i)=>sim.world.groundY(px-8+i*4)),plane=Math.min(...samples),supports=[sim.world.groundY(px+10),sim.world.groundY(px+25)];this.solarLayouts.push({x:px,plane,supports,tier:panel.tier||1});this.solar(px-cam.x,plane-cam.y,solar,supports.map(y=>y-cam.y),panel.tier||1);}
  for(const f of s.fixtures)if(f.planet===s.planet&&f.x>cam.x-30&&f.x<cam.x+this.width+30)drawFixture(c,f,cam,time);
  for(const point of discoverySites(sim.world))drawDiscovery(c,point,cam,s.discoveries.includes(point.id));
  const preview=this.placementPreview;if(preview){c.save();c.globalAlpha=.5;if(preview.tier)this.solar(preview.x-cam.x,preview.y-cam.y,true,[preview.y-cam.y,preview.y-cam.y],preview.tier);else drawFixture(c,{x:preview.x,y:preview.y,type:preview.type||'beacon',charge:100},cam,time);c.globalAlpha=.85;c.strokeStyle=preview.ok?'#b8d8a2':'#e4a18a';c.strokeRect(Math.round(preview.x-cam.x-8),Math.round(preview.y-cam.y-32),40,32);c.restore();}
  this.rocket(16*UNIT-cam.x,33*UNIT-cam.y);this.label('ODISEA / 01',16*UNIT-cam.x,33*UNIT-cam.y-73,'#b8c5b3',6);
  for(const point of sim.world.pointsOfInterest()){if(s.collected.includes(point.id))continue;const x=point.x-cam.x,y=point.y-cam.y;rect(c,x-4,y,8,5,s.planet==='moon'?'#a7b2ad':'#b78263');rect(c,x-2,y-3,5,3,'#d0c1a2');rect(c,x,y-10,1,2,'#e3c17d');rect(c,x-2,y-8,5,1,'#e3c17d');}
  // Sparse debris, instruments and shadows are deterministic and culled by the camera.
  for(let tx=Math.max(0,Math.floor(cam.x/TILE)-2);tx<Math.min(WIDTH,Math.ceil((cam.x+this.width)/TILE)+2);tx++){if(tx>=24&&tx<=108)continue;const y=sim.world.surfaceAt(tx)*TILE-cam.y,x=tx*TILE-cam.x,n=hash(tx,91);if(n>.8)c.drawImage(rockSprite(s.planet,tx%3),Math.round(x-3),Math.round(y-13));else if(n>.45){rect(c,x+4,y-3,7,3,'#1c202d');rect(c,x+5,y-5,4,4,s.planet==='moon'?'#8d98a1':'#ca9370');}if(tx%94===0){rect(c,x,y-29,2,29,'#afb9ad');rect(c,x-6,y-29,15,4,'#d1d4bc');rect(c,x+7,y-31,2,2,'#d5b26e');}}
  if(s.support.shield[s.planet]){const bx=20*UNIT-cam.x,by=25*UNIT-cam.y;for(let i=0;i<25;i++){rect(c,bx+i*16,by-6,15,5,'#646e73');rect(c,bx+i*16+1,by-6,13,1,'#adb0a0');}}
  const px=p.x-cam.x-6,py=p.y-cam.y;if(p.grounded){rect(c,px+5,py+33,19,2,'rgba(0,0,0,.35)');}drawAvatar(c,this.art,s.profile,px,py,{time,moving:Math.abs(p.vx)>4,air:!p.grounded,facing:p.facing,suited:s.equipment.suited,motion:{...sim.animation?.pose(),pickaxeLevel:s.equipment.pickaxe}});

  if(sim.lastBoostAt!==undefined&&s.elapsed-sim.lastBoostAt<.22){for(let i=0;i<4;i++)rect(c,px+(p.facing>0?7:20),py+14+i*3,3,i%2?2:3,i%2?'#dc9a59':'#f0d49b');}
  if(sim.mining){const m=sim.mining,x=m.tx*TILE-cam.x,y=m.ty*TILE-cam.y,k=m.elapsed/m.needed;c.strokeStyle='#f4d99c';c.lineWidth=1;c.strokeRect(Math.round(x),Math.round(y),8,8);rect(c,x,y-4,8,2,'#152032');rect(c,x,y-4,Math.ceil(k*8),2,'#edc47e');rect(c,x+3,y+2,1,4,'#172333');if(k>.5)rect(c,x+2,y+4,4,1,'#172333');}
  if(this.blockPlacementPreview){const b=this.blockPlacementPreview;c.save();c.strokeStyle=b.ok?'#b8d8a2':'#e4a18a';c.lineWidth=1;c.strokeRect(Math.round(b.tx*TILE-cam.x),Math.round(b.ty*TILE-cam.y),TILE,TILE);c.restore();}
  this.particles.update(s.elapsed,sim);this.particles.draw(c,cam);
  drawGameplayWorld(c,sim,cam,time);
  this.caveLighting.draw(c,this.width,this.height,sim,cam,dt);
  if(s.planet==='mars')for(let i=0;i<27;i++){const x=((hash(i,5)*this.width+time*(3+i%3))%this.width),y=hash(i,6)*this.height;rect(c,x,y,1,1,'rgba(219,171,129,.3)');}
  if(menu){c.fillStyle='rgba(5,8,10,.18)';c.fillRect(0,0,this.width,this.height);}
 }
 cinematic(profile,time,type='moon'){this.cinema.draw(profile,time,type);}
 earthHome(profile,time){this.cinema.drawEarthHome(profile,time);}
}

import {transportPose,smoothstep} from './scene-motion.js';
import {drawAvatar} from './human.js';
export const INTRO_SCENES=[
 {id:'conference',duration:11,title:'NASA / CONFERENCIA DE PRENSA',caption:'¡Tu equipo ha sido elegido! La Luna, Marte y muchos descubrimientos te esperan.'},
 {id:'news',duration:10,title:'EN ÓRBITA / EDICIÓN ESPECIAL',caption:'Antes de despegar, aprenderás a cuidar a tu tripulación. ¡El entrenamiento comienza en la Tierra!'},
 {id:'transport',duration:9,title:'RUMBO AL CENTRO DE ENTRENAMIENTO',caption:'Siguiente parada: entrenar juntos. ¡Vamos!'}
];
export function introAt(elapsed){let start=0;for(let i=0;i<INTRO_SCENES.length;i++){const scene=INTRO_SCENES[i];if(elapsed<start+scene.duration)return{...scene,index:i,time:Math.max(0,elapsed-start),t:Math.max(0,(elapsed-start)/scene.duration)};start+=scene.duration;}return null;}
export const INTRO_DURATION=INTRO_SCENES.reduce((n,s)=>n+s.duration,0);
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
export function drawPrologue(r,profile,elapsed){
 const scene=introAt(elapsed)||{...INTRO_SCENES[2],t:1,time:9},c=r.ctx,w=r.width,h=r.height,floor=h*.72;
 if(scene.id==='transport'){
  // The landscape returns the canonical ground. Wheels, actor and building share it.
  const ground=r.cinema.earthLandscape(scene.time),road=ground-2,pose=transportPose(w,road,scene.t),x=pose.x,buildingX=w*.73,buildingWidth=Math.max(68,w*.24);
  rect(c,0,road-1,w,5,'#3e4647');rect(c,0,road+4,w,2,'#747b72');for(let lane=0;lane<w;lane+=32)rect(c,lane,road+2,15,1,'#d4c9a0');
  rect(c,buildingX-12,road-86,buildingWidth+14,85,'#222a2e');rect(c,buildingX-10,road-84,buildingWidth+10,80,'#b7c6b9');rect(c,buildingX-12,road-88,buildingWidth+14,5,'#e1ddc3');
  for(let i=0;i<3;i++){const bx=buildingX+2+i*(buildingWidth-12)/3;rect(c,bx,road-70,16,18,'#283e4c');rect(c,bx+2,road-68,12,3,'#8fb9c0');}
  rect(c,buildingX+5,road-43,28,42,'#263742');rect(c,buildingX+8+pose.door*17,road-40,22*(1-pose.door),38,'#698c8f');rect(c,buildingX+3,road-46,32,3,'#e9d196');
  rect(c,buildingX-3,road-85,buildingWidth-1,17,'#24333a');r.label('CENTRO ESPACIAL',buildingX+buildingWidth*.45,road-74,'#f3dfab',Math.max(6,Math.min(8,w/75)));
  // Contact shadow and two independently rotating wheels are seated on the road.
  rect(c,x-49,road-2,99,2,'rgba(13,20,25,.45)');rect(c,x-48,road-34,94,24,'#17242d');rect(c,x-45,road-32,88,20,'#d8dfce');
  rect(c,x-37,road-56,64,24,'#182832');rect(c,x-34,road-54,58,5,'#eef0d8');rect(c,x-33,road-48,55,19,'#567f8b');
  rect(c,x+27,road-37,18,8,'#b7c8be');rect(c,x+42,road-29,5,7,'#f2d795');rect(c,x-46,road-30,4,8,'#c47f63');rect(c,x-46,road-11,94,4,'#779393');
  rect(c,x-30,road-46,2,17,'#b8ccbf');rect(c,x+3,road-46,2,17,'#b8ccbf');
  if(scene.t<.87){c.save();c.beginPath();c.rect(x-28,road-48,47,18);c.clip();drawAvatar(c,r.art,profile,x-17,road-52,{suited:false,time:elapsed});c.restore();}
  rect(c,x-20,road-28,31,16,'#b5cabb');rect(c,x-19,road-27,27,2,'#ecedcf');rect(c,x+4,road-23,4,2,'#334c58');rect(c,x-36,road-24,12,2,'#d6b878');
  for(const dx of[-28,29]){c.fillStyle='#14202a';c.beginPath();c.arc(Math.round(x+dx),road-7,7,0,Math.PI*2);c.fill();c.fillStyle='#8eaaa7';c.beginPath();c.arc(Math.round(x+dx),road-7,4,0,Math.PI*2);c.fill();c.save();c.translate(Math.round(x+dx),road-7);c.rotate(pose.wheelAngle);rect(c,-3,-1,6,2,'#d2dbca');rect(c,-1,-3,2,6,'#d2dbca');c.restore();}
  if(scene.t>=.87){const step=smoothstep((scene.t-.87)/.1),actorX=x+6+step*(buildingX+5-x-6);drawAvatar(c,r.art,profile,actorX,road-34,{suited:false,time:elapsed,moving:scene.t<.97,facing:1});}
  if(pose.fade>0)rect(c,0,0,w,h,'rgba(10,15,19,'+pose.fade+')');return;
 }
 rect(c,0,0,w,h,'#152630');rect(c,0,floor,w,h-floor,'#334349');
 for(let i=0;i<9;i++)rect(c,i*w/8,30,2,floor-30,'#2b4652');
 const speaker={name:'Control',color:1,skin:'#bf815b',hair:'#332a28',role:'engineer'};
 if(scene.id==='conference'){
  rect(c,w*.22,floor-94,w*.56,68,'#1e3c51');rect(c,w*.22+3,floor-91,w*.56-6,2,'#657e88');r.label('ÓRBITA',w/2,floor-64,'#e4e5d2',17);r.label('LUNA → MARTE',w/2,floor-45,'#b9ceca',9);
  drawAvatar(c,r.art,speaker,w*.5-12,floor-40,{suited:false,time:elapsed});rect(c,w*.5-22,floor-17,44,28,'#7d958f');rect(c,w*.5-25,floor-20,50,4,'#d3d6be');rect(c,w*.5+8,floor-31,2,14,'#101e29');
  for(let i=0;i<6;i++){
   const x=w*(.08+i*.16),y=floor+25+(i%2)*19;drawAvatar(c,r.art,{...speaker,skin:i%2?'#805138':'#e9b38b',hair:i%2?'#ddd8c9':'#332a28'},x-12,y-34,{suited:false,time:elapsed});
   rect(c,x+12,y-28,17,10,'#0c1924');rect(c,x+27,y-26,5,6,'#88a5aa');rect(c,x+18,y-18,2,20,'#a0b4aa');rect(c,x+10,y-31,8,3,'#6c8991');
  }
  // A short, single flash bridges the press conference and television coverage.
  const remaining=scene.duration-scene.time;if(remaining<.32)rect(c,0,0,w,h,'rgba(248,245,223,'+Math.sin((.32-remaining)/.32*Math.PI/2)*.45+')');
 }else{
  rect(c,w*.48,34,w*.46,floor-42,'#12212d');rect(c,w*.49,37,w*.44,3,'#819b9e');r.earth(w*.7,floor*.51,Math.min(39,w*.08));r.label('LUNA / MARTE',w*.71,floor-26,'#efc987',9);
  drawAvatar(c,r.art,speaker,w*.25-12,floor-53,{suited:false,time:elapsed});rect(c,w*.08,floor-24,w*.36,30,'#607d80');rect(c,w*.08,floor-24,w*.36,3,'#e5d3a6');
  rect(c,0,floor+10,w,22,'#a84e42');r.label('MISIÓN ESPECIAL / SE BUSCA TRIPULACIÓN',w/2,floor+24,'#fff0d1',Math.min(9,w/45));
  if(scene.time<.3)rect(c,0,0,w,h,'rgba(248,245,223,'+(1-scene.time/.3)*.45+')');
 }
}

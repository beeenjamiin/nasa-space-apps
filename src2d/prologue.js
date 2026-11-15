import {drawAvatar} from './human.js';
export const INTRO_SCENES=[
 {id:'conference',duration:11,title:'NASA / CONFERENCIA DE PRENSA',caption:'Anunciamos una misión de exploración de la Luna y Marte. Buscamos una tripulación que aprenda, cuide sus recursos y trabaje en equipo.'},
 {id:'news',duration:10,title:'EN ÓRBITA / EDICIÓN ESPECIAL',caption:'La misión ya es noticia. ¿Superarán los candidatos los exigentes estándares de entrenamiento de la NASA? El viaje comienza en la Tierra.'},
 {id:'transport',duration:9,title:'RUMBO AL CENTRO DE ENTRENAMIENTO',caption:'Tu convocatoria ha llegado. En el centro de entrenamiento, cada prueba te preparará para una parte de la expedición.'}
];
export function introAt(elapsed){let start=0;for(let i=0;i<INTRO_SCENES.length;i++){const scene=INTRO_SCENES[i];if(elapsed<start+scene.duration)return{...scene,index:i,time:Math.max(0,elapsed-start),t:Math.max(0,(elapsed-start)/scene.duration)};start+=scene.duration;}return null;}
export const INTRO_DURATION=INTRO_SCENES.reduce((n,s)=>n+s.duration,0);
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
export function drawPrologue(r,profile,elapsed){
 const scene=introAt(elapsed)||{...INTRO_SCENES[2],t:1,time:9},c=r.ctx,w=r.width,h=r.height,floor=h*.72;
 if(scene.id==='transport'){
  r.cinema.earthLandscape(scene.time);rect(c,w*.6,floor-40,w*.32,60,'#b6c6b9');rect(c,w*.6+3,floor-37,w*.32-6,5,'#e0dec4');
  for(let i=0;i<3;i++)rect(c,w*.63+i*24,floor-28,18,13,'#325668');r.label('ENTRENAMIENTO',w*.75,floor-45,'#f1d69d',8);
  const x=w*(.1+scene.t*.55);rect(c,x-42,floor+19,84,3,'#273d42');rect(c,x-36,floor-18,72,37,'#d4d7bd');rect(c,x-34,floor-16,68,5,'#f0e6c6');rect(c,x-30,floor-10,60,23,'#355b6c');
  c.save();c.beginPath();c.rect(x-28,floor-10,56,23);c.clip();drawAvatar(c,r.art,profile,x-13,floor-16,{suited:false,time:elapsed});c.restore();
  rect(c,x-35,floor+13,70,4,'#587978');for(const dx of[-23,23]){rect(c,x+dx-7,floor+17,14,9,'#172732');rect(c,x+dx-3,floor+19,6,5,'#748b8a');}
  if(scene.t>.7)rect(c,0,0,w,h,'rgba(10,20,26,'+Math.min(1,(scene.t-.7)/.3)+')');return;
 }
 rect(c,0,0,w,h,'#152630');rect(c,0,floor,w,h-floor,'#334349');
 for(let i=0;i<9;i++)rect(c,i*w/8,30,2,floor-30,'#2b4652');
 const speaker={name:'Control',color:1,skin:'#bf815b',hair:'#332a28',role:'engineer'};
 if(scene.id==='conference'){
  rect(c,w*.22,floor-94,w*.56,68,'#1e3c51');rect(c,w*.22+3,floor-91,w*.56-6,2,'#657e88');r.label('NASA',w/2,floor-64,'#e4e5d2',20);r.label('LUNA → MARTE',w/2,floor-45,'#b9ceca',9);
  drawAvatar(c,r.art,speaker,w*.5-12,floor-40,{suited:false,time:elapsed});rect(c,w*.5-22,floor-17,44,28,'#7d958f');rect(c,w*.5-25,floor-20,50,4,'#d3d6be');rect(c,w*.5+8,floor-31,2,14,'#101e29');
  for(let i=0;i<6;i++){
   const x=w*(.08+i*.16),y=floor+25+(i%2)*19;drawAvatar(c,r.art,{...speaker,skin:i%2?'#805138':'#e9b38b',hair:i%2?'#ddd8c9':'#332a28'},x-12,y-34,{suited:false,time:elapsed});
   rect(c,x+12,y-28,17,10,'#0c1924');rect(c,x+27,y-26,5,6,'#88a5aa');rect(c,x+18,y-18,2,20,'#a0b4aa');rect(c,x+10,y-31,8,3,'#6c8991');
  }
  // A short, single flash bridges the press conference and television coverage.
  const remaining=scene.duration-scene.time;if(remaining<.32)rect(c,0,0,w,h,'rgba(248,245,223,'+Math.sin((.32-remaining)/.32*Math.PI/2)+')');
 }else{
  rect(c,w*.48,34,w*.46,floor-42,'#12212d');rect(c,w*.49,37,w*.44,3,'#819b9e');r.earth(w*.7,floor*.51,Math.min(39,w*.08));r.label('LUNA / MARTE',w*.71,floor-26,'#efc987',9);
  drawAvatar(c,r.art,speaker,w*.25-12,floor-53,{suited:false,time:elapsed});rect(c,w*.08,floor-24,w*.36,30,'#607d80');rect(c,w*.08,floor-24,w*.36,3,'#e5d3a6');
  rect(c,0,floor+10,w,22,'#a84e42');r.label('MISIÓN ESPECIAL / SE BUSCA TRIPULACIÓN',w/2,floor+24,'#fff0d1',Math.min(9,w/45));
  if(scene.time<.3)rect(c,0,0,w,h,'rgba(248,245,223,'+(1-scene.time/.3)+')');
 }
}

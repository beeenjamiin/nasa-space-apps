import {drawAvatar} from './human.js';
import {TRAINING_FLOOR} from './training.js';
import {translate} from './language.js';
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};

export function drawTraining(r,session,time){
 const c=r.ctx,w=r.width,h=r.height,s=session.sim.s,p=s.player,id=session.stage.id;
 const cam={x:w>=464?(1072-w)/2:Math.max(304,Math.min(768-w,p.x-w*.45)),y:TRAINING_FLOOR-h*.7},floor=TRAINING_FLOOR-cam.y;
 r.cam=cam;c.fillStyle='#172c37';c.fillRect(0,0,w,h);
 for(let x=304;x<768;x+=48){const sx=x-cam.x;rect(c,sx,0,46,floor,'#283e46');rect(c,sx+3,floor-138,40,3,'#82988e');rect(c,sx+5,floor-125,36,37,'#111f2b');rect(c,sx+7,floor-123,32,2,'#739da4');rect(c,sx+6,floor-72,2,70,'#435c61');}
 rect(c,0,floor,w,h-floor,'#344a50');rect(c,0,floor,w,2,'#d5d6bd');for(let x=0;x<w;x+=16){rect(c,x,floor+8,12,2,'#1c3038');rect(c,x,floor+20,12,1,'#667a77');}
 const machine=(x,label,color='#84c3b5')=>{x-=cam.x;rect(c,x-21,floor-46,42,46,'#111d28');rect(c,x-19,floor-44,38,4,'#b5c9bc');rect(c,x-17,floor-36,34,22,'#304c55');rect(c,x-13,floor-31,26,2,color);rect(c,x-13,floor-25,17,2,color);rect(c,x-15,floor-9,30,5,'#637a7b');r.label(label,x,floor-53,'#d7dcc8',7);};
 if(id==='medical'){machine(480,'BIOMETRÍA');rect(c,458-cam.x,floor-67,44,2,'#a9d4bf');rect(c,458-cam.x,floor-65,2,63,'#789a9c');rect(c,500-cam.x,floor-65,2,63,'#789a9c');if(session.active)rect(c,461-cam.x,floor-60+(time*18)%55,38,1,'#c2e9b2');}
 if(id==='psych')for(const [i,x]of[480,640,528].entries()){machine(x,'0'+(i+1),i===session.step?'#f3d493':'#536f73');}
 if(id==='centrifuge'){
  const x=560-cam.x;rect(c,x-50,floor-5,100,5,'#91a7a0');rect(c,x-4,floor-50,8,45,'#587480');
  c.save();c.translate(x,floor-47);c.rotate(session.active?time*2:0);rect(c,-49,-3,98,6,'#91aaa4');for(const side of[-1,1]){rect(c,side*47-11,-13,22,26,'#111f2b');rect(c,side*47-9,-11,18,20,'#afbdaf');rect(c,side*47-6,-8,12,13,'#497482');}if(session.active){c.save();c.translate(47,-10);c.scale(.7,.7);drawAvatar(c,r.art,s.profile,-12,-28,{time,suited:true});c.restore();}c.restore();r.label('CONTROL G / '+(session.active?(session.force()>0?'←':'→'):'E'),x,floor-90,'#f3d493',10);
 }
 if(id==='pool'){
  rect(c,322-cam.x,floor-87,430,87,'#245a73');for(let y=0;y<84;y+=13)for(let x=322;x<752;x+=23)rect(c,x-cam.x+Math.sin(time+x)*2,floor-82+y,13,1,'#42849a');
  for(const [i,x]of[480,560,656].entries()){const y=[478,450,470][i]-cam.y;rect(c,x-7-cam.x,y-4,14,8,i===session.step?'#efd08c':'#638b8c');rect(c,x-3-cam.x,y+4,6,9,'#506d77');}
 }
 if(id==='survival'){machine(672,'REFUGIO');rect(c,640-cam.x,floor-64,64,4,'#d4d8ba');rect(c,640-cam.x,floor-60,3,60,'#93a89e');rect(c,701-cam.x,floor-60,3,60,'#93a89e');}
 if(id==='pressure'){machine(528,'SOPORTE VITAL');rect(c,600-cam.x,floor-106,5,106,'#bac7b5');rect(c,602-cam.x,floor-41,2,38,'#e5bf80');machine(672,'VÁLVULA',session.step===1?'#f3cb85':'#668584');}
 if(id==='navigation'){machine(704,'BALIZA');rect(c,704-cam.x,floor-80,2,30,'#bdd2be');rect(c,700-cam.x,floor-81,10,3,time%1>.5?'#eccb87':'#6e9996');}
 if(id==='technical'){machine(560,'TALLER');if(!session.mineDone){rect(c,496-cam.x,floor-8,8,8,'#bca887');rect(c,497-cam.x,floor-7,6,2,'#e1d2af');r.label('F / PICO',500-cam.x,floor-18,'#f3d493',7);}for(const f of s.fixtures){rect(c,f.x-cam.x-2,f.y-cam.y-15,4,15,'#8da7a5');rect(c,f.x-cam.x-5,f.y-cam.y-17,10,4,'#f4dea0');}}
 const target=session.target();if(!session.passed&&id!=='pool'){const x=target.x-cam.x;rect(c,x-12,floor-1,24,2,'#edce89');r.label('▼',Math.max(12,Math.min(w-12,x)),floor-74-Math.sin(time*3)*2,'#f2d28d',10);}
 if(!(id==='centrifuge'&&session.active))drawAvatar(c,r.art,s.profile,p.x-cam.x-6,p.y-cam.y,{time,moving:Math.abs(p.vx)>4,air:!p.grounded,facing:p.facing,suited:s.equipment.suited,motion:session.sim.animation.pose()});
 if(session.sim.mining){const m=session.sim.mining;rect(c,492-cam.x,floor-14,16,2,'#17232e');rect(c,492-cam.x,floor-14,16*m.elapsed/m.needed,2,'#f0ce8a');}
 r.label('TIERRA / CENTRO DE ENTRENAMIENTO',w/2,Math.max(14,floor-150),'#b2c9c2',7);
}

export class TrainingUI{
 constructor({getSession,onLaunch,onChange}){
  this.getSession=getSession;this.onChange=onChange;const $=id=>document.getElementById(id);this.$=$;
  $('training-next').onclick=()=>{const t=getSession();if(!t.passed)return;if(t.approved)onLaunch();else{t.next();onChange();this.refresh();}};
  $('training-retry').onclick=()=>{const t=getSession();if(t.passed)return;t.enter();onChange();this.refresh();};
  for(const b of document.querySelectorAll('[data-training-action]'))b.onclick=()=>{getSession().action(b.dataset.trainingAction);this.refresh();};
  $('training-ration').onclick=()=>{getSession().useRation();this.refresh();};
  $('training-waypoint').onclick=()=>{getSession().markWaypoint();this.refresh();};
  $('training-craft-button').onclick=()=>{getSession().craftLamp();this.refresh();};
  $('training-deploy').onclick=()=>{getSession().deployLamp();this.refresh();};
 }
 refresh(){
  const t=this.getSession();if(!t)return;const $=this.$,s=t.sim.s,text=(id,value)=>{const localized=translate(value);if($(id).textContent!==localized)$(id).textContent=localized;};
  text('training-heading',t.approved?'Entrenamiento aprobado':t.stage.title);
  text('training-progress',(t.index+1)+' / 8');
  text('training-instruction',t.approved?s.profile.name+', tu equipo está listo. La nave te espera.':t.stage.instruction);
  text('training-feedback',t.feedback);
  $('training-meter').value=t.passed?1:t.stage.id==='medical'?t.progress/2:t.stage.id==='centrifuge'?t.progress/4:t.step/3;
  $('training-next').classList.toggle('hidden',!t.passed);text('training-next',t.approved?'APROBADO / IR A LA NAVE →':'PRUEBA SUPERADA / SIGUIENTE →');
  $('training-retry').classList.toggle('hidden',t.passed);
  text('training-vitals','O₂ '+Math.ceil(s.resources.oxygen)+' · '+translate('ENERGÍA')+' '+Math.ceil(s.resources.energy)+' · '+translate('NUTRICIÓN')+' '+Math.ceil(s.support.nutrition)+' · '+translate(s.equipment.suited?'TRAJE EQUIPADO':'ROPA DE TRIPULACIÓN'));
  $('training-panel').classList.toggle('hidden',!t.panel||t.passed);
  for(const kind of['inventory','craft','map'])$('training-'+kind).classList.toggle('hidden',t.panel!==kind);
  text('training-stock',translate('Regolito')+' '+s.inventory.regolith+' · '+translate('Hierro')+' '+s.inventory.iron+' · '+translate('Lámpara')+' '+s.inventory.lamps);
  $('training-deploy').classList.toggle('hidden',!s.inventory.lamps||t.passed);
  text('training-ration',translate('Comer una ración')+' × '+s.inventory.rations);
  text('training-needle',t.stage.id==='centrifuge'&&t.active?(t.force()>0?'← A':'D →'):'');
 }
}

import {MATERIALS,materialForBlock} from './block-materials.js';
import {geologyTile} from './materials.js';

export const materialName=id=>{
 const m=MATERIALS[id];return m?({dust:'Regolito',rock:'Roca',iron:'Hierro',ice:'Hielo'}[m.kind]+' '+(m.planet==='moon'?'lunar':m.kind==='rock'?'marciana':'marciano')):'Regolito';
};
const $=id=>document.getElementById(id);
/** Connect existing simulation APIs to the expedition UI, without another state/save. */
export class ExpeditionUI{
 constructor({getSim,isPlaying,clearControls,save,selectMaterial,getMaterial}){
  Object.assign(this,{getSim,isPlaying,clearControls,save,selectMaterial,getMaterial});
  this.mapOpen=false;this.unsubscribers=[];this.listeners=[];this.feedbackUntil=0;
  this.hints=document.querySelector('.desktop-hints');this.defaultHints=this.hints.textContent;
  const on=(node,event,fn,options)=>{node.addEventListener(event,fn,options);this.listeners.push(()=>node.removeEventListener(event,fn,options));};
  on($('map-button'),'click',()=>this.toggleMap());on($('close-map'),'click',()=>this.closeMap());
  on($('map-dialog'),'cancel',e=>{e.preventDefault();this.closeMap();});
  on(window,'keydown',e=>{if(this.mapOpen&&['KeyM','Escape'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();this.closeMap();}},{capture:true});
  on($('map-canvas'),'click',e=>{const c=$('map-canvas'),r=c.getBoundingClientRect(),view=this.getSim().mapSnapshot();if(!r.width||!r.height)return;this.getSim().setMapWaypoint((e.clientX-r.left)/r.width*view.bounds.width,(e.clientY-r.top)/r.height*view.bounds.height);this.drawMap();});
  on($('clear-waypoint'),'click',()=>{this.getSim().setMapWaypoint(null);this.drawMap();});
  on($('exit-rover'),'click',()=>{const result=this.getSim().exitVehicle();this.feedback(result.text);if(result.ok)this.save();this.refresh();});
 }
 get isBlocking(){return this.mapOpen;}
 toggleMap(){if(this.mapOpen)this.closeMap();else this.openMap();}
 openMap(){
  if(!this.isPlaying())return;this.refresh();this.clearControls();this.save();$('inventory-panel').classList.add('hidden');
  document.querySelectorAll('.junior-panel').forEach(p=>p.classList.add('hidden'));this.mapOpen=true;this.getSim().openMap();const dialog=$('map-dialog');
  if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
  this.drawMap();$('close-map').focus();
 }
 closeMap(){
  if(!this.mapOpen)return;this.mapOpen=false;this.getSim().closeMap();
  const dialog=$('map-dialog');if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');
  this.clearControls();$('frontier').focus();
 }
 feedback(text,damage=false){
  $('gameplay-feedback').textContent=text;$('gameplay-feedback').classList.remove('hidden');
  this.feedbackUntil=this.getSim().s.elapsed+4;$('damage-flash').classList.toggle('active',damage);
 }
 refresh(){
  const sim=this.getSim();if(!sim)return;
  if(this.sim!==sim){
   this.unsubscribers.forEach(off=>off());this.sim=sim;this.feedbackUntil=0;$('gameplay-feedback').classList.add('hidden');$('damage-flash').classList.remove('active');
   this.unsubscribers=[sim.on('fall:damage',e=>this.feedback('CAÍDA · Salud −'+Math.ceil(e.damage)+' · impacto '+e.speed.toFixed(1)+' m/s',true)),sim.on('structure:collapse',e=>this.feedback('COLAPSO · '+e.count+' bloques perdieron su apoyo.'))];
  }
  if(sim.s.elapsed>this.feedbackUntil){$('gameplay-feedback').classList.add('hidden');$('damage-flash').classList.remove('active');}
  const v=sim.s.vehicles.find(v=>v.id===sim.s.driving);$('rover-status').classList.toggle('hidden',!v);
  if(v)$('rover-details').textContent='ROVER · '+(Math.abs(v.vx)/16).toFixed(1)+' m/s · energía '+Math.ceil(sim.s.resources.energy);
  const jump=document.querySelector('[data-hold=jump]');jump.textContent=v?'■':'↑';jump.setAttribute('aria-label',v?'Frenar rover':'Saltar; pulsa otra vez en el aire para un impulso de energía');
  this.hints.textContent=v?'A D / CONDUCIR · ESPACIO / FRENAR · E / SALIR · M / MAPA':this.defaultHints;
  const id=this.getMaterial()||sim.materialInventory().find(m=>m.item==='regolith')?.id;
  $('selected-block-label').classList.toggle('hidden',!!v);
  $('selected-block-label').textContent=id?'BLOQUE / '+materialName(id):'BLOQUES / REÚNE MATERIALES';
 }
 renderMaterials(){
  const sim=this.getSim(),materials=sim.materialInventory(),selected=this.getMaterial()||materials.find(m=>m.item==='regolith')?.id;
  const signature=materials.map(m=>m.id+':'+m.count).join('|')+'|'+selected,container=$('material-choices');
  if(container.dataset.signature===signature)return;container.dataset.signature=signature;
  container.replaceChildren(...materials.map(m=>{
   const button=document.createElement('button'),icon=document.createElement('canvas'),label=document.createElement('span');
   button.type='button';button.dataset.material=m.id;button.setAttribute('aria-pressed',String(m.id===selected));icon.width=icon.height=8;
   geologyTile(icon.getContext('2d'),m.block,0,0,150,90,{get:()=>0,materialAt:()=>m});
   label.textContent=materialName(m.id)+' · '+m.count;button.append(icon,label);button.onclick=()=>this.selectMaterial(m.id);return button;
  }));
  if(!materials.length){const p=document.createElement('p');p.className='subtle';p.textContent='Extrae suelo o minerales para construir. Cada material conserva su procedencia.';container.append(p);}
 }
 drawMap(){
  const sim=this.getSim(),view=sim.mapSnapshot(),canvas=$('map-canvas'),c=canvas.getContext('2d'),{width,height,tiles}=view.terrain,scale=5;
  canvas.width=width*scale;canvas.height=height*scale;c.imageSmoothingEnabled=false;c.fillStyle='#101b22';c.fillRect(0,0,canvas.width,canvas.height);
  const colors={dust:['#a3b1b4','#c49d76'],rock:['#6d7880','#956a58'],iron:['#b58e60','#b58e60'],ice:['#93bfc5','#93bfc5']};
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const block=tiles[y*width+x];if(!block)continue;const m=materialForBlock(block,view.planet);c.fillStyle=m?colors[m.kind][m.planet==='moon'?0:1]:block===5?'#d3d6c0':'#779ba0';c.fillRect(x*scale,y*scale,scale,scale);
  }
  for(const p of view.markers){
   c.fillStyle=p.type==='base'?'#a9d8a5':p.type==='ship'?'#f3da8a':p.type==='vehicle'?'#d0c1e7':p.collected||p.visited?'#82908c':'#7bd3dd';
   const size=p.type==='station'?3:9;c.fillRect(Math.round(p.mapX*scale-size/2),Math.round(p.mapY*scale-size/2),size,size);if(['base','ship','vehicle'].includes(p.type)){c.font='12px sans-serif';c.fillText(({base:'⌂',ship:'▲',vehicle:'●'}[p.type]),Math.max(0,p.mapX*scale-5),p.mapY*scale-12);}
  }
  if(view.waypoint){c.strokeStyle='#f3ae88';c.lineWidth=2;const x=view.waypoint.mapX*scale,y=view.waypoint.mapY*scale;c.strokeRect(x-5,y-5,10,10);}
  c.fillStyle='#ffffff';const px=Math.round(view.player.mapX*scale),py=Math.round(view.player.mapY*scale);c.fillRect(px-2,py-6,4,12);c.fillRect(px-6,py-2,12,4);
  $('map-title').textContent='MAPA / '+(view.planet==='moon'?'LUNA':'MARTE');
  $('map-coordinates').textContent='Tu posición: '+view.player.meters.x.toFixed(1)+' m E · '+view.player.meters.y.toFixed(1)+' m desde el borde superior. Exploración pausada.';
  $('map-navigation').textContent=view.navigation?'Destino a '+view.navigation.distance.toFixed(1)+' m de juego. Cierra el mapa para continuar.':'Toca el terreno o elige un lugar para marcar tu ruta.';
  $('map-locations').replaceChildren(...view.markers.filter(p=>['base','ship','sample','discovery','vehicle'].includes(p.type)).map(p=>{const button=document.createElement('button');button.type='button';button.textContent=(p.visited||p.collected?'✓ ':'')+p.name;button.onclick=()=>{sim.setMapWaypoint(p.x,p.y);this.drawMap();};return button;}));
 }
 dispose(){this.closeMap();this.unsubscribers.forEach(off=>off());this.listeners.forEach(off=>off());}
}

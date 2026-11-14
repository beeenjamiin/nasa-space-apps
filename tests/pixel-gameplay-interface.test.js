import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {Window} from 'happy-dom';
import {createCanvas,loadImage} from '@napi-rs/canvas';

test('existing recipe/inventory/E/A-D/space controls build, deploy, draw and drive the rover',async()=>{
 const keys=['window','document','Image','localStorage','location','requestAnimationFrame'];
 const previous=Object.fromEntries(keys.map(k=>[k,globalThis[k]])),w=new Window({url:'http://localhost/pixel.html?debug'}),natives=new WeakMap(),contexts=new WeakMap();
 w.document.body.innerHTML=readFileSync('pixel.html','utf8').split('<body>')[1].split('</body>')[0];
 for(const prop of ['width','height']){
  const descriptor=Object.getOwnPropertyDescriptor(w.HTMLCanvasElement.prototype,prop);
  Object.defineProperty(w.HTMLCanvasElement.prototype,prop,{get(){return descriptor.get.call(this);},set(value){descriptor.set.call(this,value);if(natives.has(this))natives.get(this)[prop]=value;}});
 }
 function native(node){if(!natives.has(node))natives.set(node,createCanvas(node.width,node.height));return natives.get(node);}
 w.HTMLCanvasElement.prototype.getContext=function(){
  if(!contexts.has(this)){const real=native(this).getContext('2d');contexts.set(this,new Proxy(real,{get(target,key){if(key==='drawImage')return(image,...args)=>target.drawImage(natives.has(image)?native(image):image.native||image,...args);const v=Reflect.get(target,key,target);return typeof v==='function'?v.bind(target):v;},set(target,key,value){Reflect.set(target,key,value,target);return true;}}));}
  return contexts.get(this);
 };
 w.HTMLElement.prototype.setPointerCapture=()=>{};w.HTMLElement.prototype.releasePointerCapture=()=>{};
 class AssetImage{set src(value){this.path=value;}async decode(){this.native=await loadImage(this.path);}}
 let frame=null,clock=0;
 Object.assign(globalThis,{window:w,document:w.document,Image:AssetImage,localStorage:w.localStorage,location:w.location,requestAnimationFrame:fn=>{frame=fn;return 1;}});
 const $=id=>w.document.getElementById(id),advance=n=>{for(let i=0;i<n;i++){clock+=1000/60;const cb=frame;frame=null;cb?.(clock);}},key=(code,type='keydown')=>w.dispatchEvent(new w.KeyboardEvent(type,{code,bubbles:true,cancelable:true}));
 try{
  await import('../src2d/main.js?gameplay-interface');
  const deadline=Date.now()+3000;while(!w.__FRONTIER_DEBUG__&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,5));
  const game=w.__FRONTIER_DEBUG__;assert.ok(game,$('assets-status').textContent);
  $('new-game').click();$('creator-form').dispatchEvent(new w.Event('submit',{cancelable:true}));$('skip-cinema').click();advance(2);
  key('KeyM');key('KeyM','keyup');assert.ok($('map-dialog').open,'one M press must leave the map open');
  const mapTime=game.sim.s.elapsed;advance(10);assert.equal(game.sim.s.elapsed,mapTime,'map pauses the simulation');
  key('KeyM');key('KeyM','keyup');assert.equal($('map-dialog').open,false);advance(2);assert.ok(game.sim.s.elapsed>mapTime);
  game.sim.s.flags.marsUnlocked=true;assert.equal(game.sim.arriveMars(),true);game.sim.s.flags.marsOnline=true;
  Object.assign(game.sim.s.player,{x:35*16,y:33*16-34,vx:0,vy:0});Object.assign(game.sim.s.inventory,{regolith:30,iron:10});
  $('inventory-button').click();w.document.querySelector('[data-recipe=rover]').click();assert.equal(game.sim.s.inventory.rovers,1);
  assert.ok(native(w.document.querySelector('[data-item=rovers] canvas')).getContext('2d').getImageData(0,0,24,24).data.some((v,i)=>i%4===3&&v),'rover inventory icon is visible');
  const world=game.sim.world;let spot=null;
  for(let x=80*16;x<180*16&&!spot;x+=16){Object.assign(game.sim.s.player,{x,y:world.groundY(x)-34});const result=game.sim.use('rovers');if(result.ok)spot=x;}
  assert.ok(spot,'an exterior deployment location exists');
  // Return the successful deployment to inventory, then exercise the actual generic USE button.
  game.sim.s.vehicles.length=0;game.sim.s.inventory.rovers=1;$('close-inventory').click();$('inventory-button').click();
  w.document.querySelector('#inventory-items [data-item=rovers]').click();assert.equal(game.sim.s.inventory.rovers,0);assert.equal(game.sim.s.vehicles.length,1);
  $('close-inventory').click();const v=game.sim.s.vehicles[0];
  const side=v.x>game.sim.s.player.x?v.x-14:v.x+50;Object.assign(game.sim.s.player,{x:side,y:v.y+24-34,vx:0,vy:0});advance(1);
  key('KeyE');key('KeyE','keyup');assert.equal(game.sim.s.driving,v.id);
  const x=v.x;key('KeyD');advance(30);key('KeyD','keyup');assert.ok(v.x>x);assert.ok(v.vx>0);
  key('Space');advance(2);key('Space','keyup');assert.equal(v.vx,0);
  mkdirSync('test-results/pixel',{recursive:true});writeFileSync('test-results/pixel/gameplay-mars-rover.png',native($('frontier')).toBuffer('image/png'));
  key('KeyE');key('KeyE','keyup');assert.equal(game.sim.s.driving,null);
  assert.equal(game.phase,'playing');assert.equal(game.sim.openMap().planet,'mars');
 }finally{
  w.happyDOM.abort();for(const [k,v]of Object.entries(previous))if(v===undefined)delete globalThis[k];else globalThis[k]=v;
 }
});

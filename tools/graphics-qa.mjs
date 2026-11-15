/** Graphics-only review scenes. Fixtures select views; campaign coverage lives in npm test. */
import {createCanvas,loadImage,GlobalFonts} from '@napi-rs/canvas';
import {mkdirSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {Renderer} from '../src2d/renderer.js';
import {Simulation,createState} from '../src2d/simulation.js';
const output='test-results/graphics';mkdirSync(output,{recursive:true});
GlobalFonts.registerFromPath('assets/fonts/Silkscreen-Regular.ttf','Silkscreen');
globalThis.window={innerWidth:1600,innerHeight:900};globalThis.document={createElement:()=>createCanvas(8,8)};
const art={human:await loadImage('assets/pixel/humans/astro.png')},canvas=createCanvas(800,450),r=new Renderer(canvas,art);
const save=name=>writeFileSync(`${output}/${name}.png`,canvas.toBuffer('image/png'));
for(const [name,t,type]of[['earth-launch-site',2,'moon'],['earth-tower',8,'moon'],['earth-orbit',20,'moon'],['lunar-landing',33,'moon'],['martian-landing',20,'mars'],['earth-ocean',25,'earth']]){r.cinematic(createState().profile,t,type);save(name);}
const report={scope:'Native Canvas CPU, not browser/mobile FPS',views:[],benchmarks:[]};
for(const planet of ['moon','mars']){
 const sim=new Simulation(createState({},2026,4));if(planet==='mars'){sim.s.flags.marsUnlocked=true;sim.arriveMars();}sim.s.flags.baseOnline=sim.s.flags.marsOnline=sim.s.flags.solarOnline=true;
 for(const [name,x]of[['base',26*16],['nearby',80*16],['geology',200*16],['far',280*16]]){sim.s.player.x=x;sim.s.player.y=sim.world.groundY(x)-34;for(let i=0;i<10;i++)r.render(sim,i*.1);save(planet+'-'+name);report.views.push({planet,name,x,version:sim.world.version});}
 let cave=null;for(let y=100;y<155&&!cave;y++)for(let x=260;x<420;x++)if(!sim.world.collides(x*8,y*8-34)&&sim.world.solidAt(x*8+6,y*8+.1)){cave={x:x*8,y:y*8-34};break;}
 if(cave){Object.assign(sim.s.player,cave);for(let i=0;i<50;i++)r.render(sim,5+i*.1);save(planet+'-cave');sim.s.fixtures.push({type:'lamp',planet,x:cave.x+60,y:cave.y+34,charge:90});r.render(sim,10.1);save(planet+'-cave-lit');sim.s.fixtures=[];}
 sim.s.player.x=200*16;sim.s.player.y=sim.world.groundY(sim.s.player.x)-34;r.render(sim,20);const samples=[];
 for(let i=0;i<180;i++){const start=performance.now();r.render(sim,20+i/60);samples.push(performance.now()-start);}samples.sort((a,b)=>a-b);
 report.benchmarks.push({planet,frames:samples.length,medianMs:samples[90],p95Ms:samples[171],cachedChunks:r.chunks.size});
}
writeFileSync(output+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));

import {TILE,UNIT,WIDTH,HEIGHT,STATIONS} from './world.js';
import {discoverySites} from './expedition.js';
export class WorldMap{
 constructor(sim){this.sim=sim;this.open=false;this.waypoints={moon:null,mars:null};this.cache=null;}
 setOpen(value){const open=!!value;if(this.open!==open){this.open=open;this.sim.emit('map:visibility',{open});}return this.open;}
 toggle(){return this.setOpen(!this.open);}
 setWaypoint(x,y){const planet=this.sim.s.planet;if(x===null){this.waypoints[planet]=null;}else{if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>=WIDTH*TILE||y<0||y>=HEIGHT*TILE)return false;this.waypoints[planet]={x,y};}this.sim.emit('map:waypoint',{waypoint:this.waypoints[planet]});return true;}
 snapshot(){
  const sim=this.sim,w=sim.world,s=sim.s,scale=4,width=Math.ceil(WIDTH/scale),height=Math.ceil(HEIGHT/scale);
  if(this.cache?.world!==w||this.cache.revision!==w.revision){
   const tiles=new Uint8Array(width*height);
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    let value=0;for(let dy=0;dy<scale;dy++)for(let dx=0;dx<scale;dx++){const tx=x*scale+dx,ty=y*scale+dy;if(tx<WIDTH&&ty<HEIGHT&&w.get(tx,ty))value||=w.get(tx,ty);}
    tiles[y*width+x]=value;
   }
   this.cache={world:w,revision:w.revision,tiles};
  }
  const point=p=>({...p,mapX:p.x/(TILE*scale),mapY:p.y/(TILE*scale)});
  const markers=[{id:'base',type:'base',name:'Hábitat',x:32*UNIT,y:33*UNIT},...STATIONS.map(p=>({...p,type:p.id==='rocket'?'ship':'station',x:p.x*UNIT,y:33*UNIT})),...w.pointsOfInterest().map(p=>({...p,type:'sample',collected:s.collected.includes(p.id)})),...discoverySites(w).map(p=>({...p,type:'discovery',visited:s.discoveries.includes(p.id)})),...s.vehicles.filter(v=>v.planet===s.planet).map(v=>({...v,type:'vehicle',name:'Rover'}))].map(point);
  const waypoint=this.waypoints[s.planet],p=point({x:s.player.x+6,y:s.player.y+17});
  return{open:this.open,planet:s.planet,revision:w.revision,terrain:{width,height,cellSize:TILE*scale,tiles:this.cache.tiles.slice()},bounds:{width:WIDTH*TILE,height:HEIGHT*TILE},player:{...p,meters:{x:p.x/UNIT,y:p.y/UNIT}},markers,waypoint:waypoint?point(waypoint):null,navigation:waypoint?{distance:Math.hypot(waypoint.x-p.x,waypoint.y-p.y)/UNIT,heading:Math.atan2(waypoint.y-p.y,waypoint.x-p.x)}:null};
 }
}

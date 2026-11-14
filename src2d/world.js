import {materialForBlock,isPlacedBlock,validSavedBlock} from './block-materials.js';
export const TILE=8,UNIT=16,WIDTH=640,HEIGHT=172,PLAYER_HEIGHT=34;
export const BLOCK={AIR:0,DUST:1,ROCK:2,IRON:3,ICE:4,HULL:5,FLOOR:6};
export const LEGACY_SEEDS={moon:71423,mars:99127};
export function freshWorldSeed(){const value=new Uint32Array(1);if(globalThis.crypto?.getRandomValues)globalThis.crypto.getRandomValues(value);else value[0]=(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0;return value[0];}
export function worldOptions(state,planet=state.planet){return{version:state.worldVersion>=2?state.worldVersion:1,seed:state.worldVersion>=2?(state.worldSeed^LEGACY_SEEDS[planet])>>>0:LEGACY_SEEDS[planet]};}
export function hash(x,y,seed=1){let n=Math.imul(x+seed,374761393)^Math.imul(y+seed,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
export function surfaceAt(x,planet='moon',seed=LEGACY_SEEDS[planet],version=1){x/=2;
 if(x>=12&&x<=51)return 66;
 if(version>=2){
  const phase=hash(1,3,seed)*Math.PI*2,rolling=Math.sin(x*.065+phase)*1.8+Math.sin(x*.19+phase*2)*.9;
  let y=33+rolling;
  if(planet==='mars')y+=Math.sin(x*.035+phase)*3+Math.abs(Math.sin(x*.11+phase))*.9;
  else for(let i=0;i<8;i++){const cx=72+i*29+(hash(i,5,seed)-.5)*14,r=3.5+hash(i,9,seed)*3.5,d=1.5+hash(i,11,seed)*1.8,t=Math.abs(x-cx)/r;if(t<1)y+=d*(1-t*t);else if(t<1.35)y-=.8*(1-(t-1)/.35);}
  const blend=x>51&&x<65?(x-51)/14:x<12&&x>-4?(12-x)/16:1;
  return Math.round((33+(y-33)*Math.min(1,Math.max(0,blend)))*2);
 }
 const rolling=Math.sin(x*.065)*2+Math.sin(x*.19)*1.2;
 if(planet==='mars'){const raw=34+rolling+Math.sin(x*.035)*4+Math.abs(Math.sin(x*.11))*1.5,t=x>51&&x<72?(x-51)/21:x<12&&x>-8?(12-x)/20:1;return Math.round((33+(raw-33)*t)*2);}
 let y=33+rolling;for(const [cx,r,d]of[[71,7,3],[111,5,2],[157,9,4],[198,5,2],[239,7,3],[284,10,4]]){const t=Math.abs(x-cx)/r;if(t<1)y+=d*(1-t*t);else if(t<1.4)y-=1.25*(1-(t-1)/.4);}return Math.round(y*2);
}
export class PixelWorld{
 constructor(planet='moon',edits={},options={}){
  this.planet=planet;this.version=[2,3].includes(options.version)?options.version:1;this.seed=options.seed??LEGACY_SEEDS[planet];this.tiles=new Uint8Array(WIDTH*HEIGHT);this.edits={...edits};this.revision=0;this.dirtyChunks=new Set();this.placed=new Set();
  const phase=this.version>=2?hash(2,7,this.seed)*Math.PI*2:0;
  for(let x=0;x<WIDTH;x++){const top=this.surfaceAt(x);for(let y=top;y<HEIGHT;y++){let tile=y<top+6?BLOCK.DUST:BLOCK.ROCK;const n=hash(Math.floor(x/4),Math.floor(y/4),this.seed);if(this.version<3){if(y>top+8&&n>.84)tile=BLOCK.IRON;if(y>top+18&&n<.065)tile=BLOCK.ICE;}const cave=y>top+18&&y<HEIGHT-8&&Math.sin(x*.09+y*.065+phase)+Math.sin(x*.045-y*.14-phase*.7)>1.18;if(!cave)this.tiles[y*WIDTH+x]=tile;}}
  if(this.version===3)growVeins(this);
  // Accessible ore outcrops make the first expedition possible before deep mining.
  for(const mx of[56,57,58,83,84,103,104,125])for(let dx=0;dx<2;dx++){const x=mx*2+dx,top=this.surfaceAt(x);this.tiles[top*WIDTH+x]=BLOCK.IRON;this.tiles[(top+1)*WIDTH+x]=BLOCK.IRON;}
  for(let x=40;x<90;x++){this.tiles[50*WIDTH+x]=BLOCK.HULL;this.tiles[66*WIDTH+x]=BLOCK.FLOOR;}
  for(let y=51;y<60;y++){this.tiles[y*WIDTH+40]=BLOCK.HULL;this.tiles[y*WIDTH+89]=BLOCK.HULL;}
  // The left end is sealed; entry is a walkable right-side airlock, never a teleport.
  for(const [key,value]of Object.entries(this.edits)){const index=Number(key);if(Number.isInteger(index)&&index>=0&&index<this.tiles.length&&validSavedBlock(value)&&!this.protected(index%WIDTH,Math.floor(index/WIDTH))){this.tiles[index]=value;if(isPlacedBlock(value))this.placed.add(index);}}
 }
 surfaceAt(x){return surfaceAt(x,this.planet,this.seed,this.version);}
 pointsOfInterest(){return pointsOfInterest(this.planet,this.seed,this.version);}
 materialAt(x,y){return materialForBlock(this.get(x,y),this.planet);}
 get(x,y){if(x<0||x>=WIDTH||y>=HEIGHT)return BLOCK.ROCK;if(y<0)return BLOCK.AIR;return this.tiles[y*WIDTH+x];}
 protected(x,y){const mx=x/2,my=y/2;return(mx>=19&&mx<=45&&my>=24&&my<=34)||(mx>=14&&mx<=18&&my>=32&&my<=34)||([47,50,53].some(tx=>Math.abs(mx-tx)<=1)&&my>=30&&my<=35)||(this.protectedSites||[]).some(p=>Math.abs(x-p.x)<=2&&y>=p.y&&y<=p.y+2);}
 groundY(px){const x=Math.max(0,Math.min(WIDTH-1,Math.floor(px/TILE)));this.supportCache??=new Map();if(this.supportRevision!==this.revision){this.supportCache.clear();this.supportRevision=this.revision;}if(this.supportCache.has(x))return this.supportCache.get(x);for(let y=0;y<HEIGHT;y++)if(this.get(x,y)){this.supportCache.set(x,y*TILE);return y*TILE;}return HEIGHT*TILE;}

 set(x,y,value){if(!Number.isInteger(x)||!Number.isInteger(y)||!validSavedBlock(value)||x<0||x>=WIDTH||y<0||y>=HEIGHT||this.protected(x,y))return false;const index=y*WIDTH+x;this.tiles[index]=value;this.edits[index]=value;if(isPlacedBlock(value))this.placed.add(index);else this.placed.delete(index);this.revision++;for(const dx of[-1,0,1])for(const dy of[-1,0,1])this.dirtyChunks.add(Math.floor((x+dx)/16)+','+Math.floor((y+dy)/16));return true;}
 solidAt(px,py){return this.get(Math.floor(px/TILE),Math.floor(py/TILE))!==0;}
 inside(player){return player.x>21*UNIT&&player.x<44*UNIT&&player.y>25*UNIT&&player.y<34*UNIT;}
 collides(x,y,w=12,h=PLAYER_HEIGHT){for(let ty=Math.floor(y/TILE);ty<=Math.floor((y+h-.01)/TILE);ty++)for(let tx=Math.floor(x/TILE);tx<=Math.floor((x+w-.01)/TILE);tx++)if(this.get(tx,ty))return true;return false;}
}
export const STATIONS=[{id:'control',x:25,name:'Control del hábitat',icon:'⚡'},{id:'lab',x:30,name:'Laboratorio',icon:'◈'},{id:'bench',x:35,name:'Banco de fabricación',icon:'⚒'},{id:'storage',x:39,name:'Depósito de suministros',icon:'▣'},{id:'eva',x:42,name:'Armario EVA / cambiar traje',icon:'◉'},{id:'solar',x:49,name:'Campo solar',icon:'☀'},{id:'rocket',x:16,name:'Nave de expedición',icon:'▲'}];
export function pointsOfInterest(planet,seed=LEGACY_SEEDS[planet],version=1){return [68,88,116].map((x,i)=>({id:planet+'-sample-'+i,x:x*UNIT+8,y:surfaceAt(x*2,planet,seed,version)*TILE-9,name:planet==='moon'?['Brecha de impacto','Basalto lunar','Regolito del borde'][i]:['Basalto marciano','Estrato sedimentario','Muestra mineral'][i]}));}

/** Connected mineral bodies with bends and branches, never four-cell noise squares. */
function growVeins(world){
 for(const[id,count]of[[BLOCK.IRON,82],[BLOCK.ICE,24]])for(let vein=0;vein<count;vein++){
  let x=8+hash(vein,id,world.seed)*(WIDTH-16),minDepth=id===BLOCK.ICE?20:9;
  const top=world.surfaceAt(Math.floor(x));let y=top+minDepth+hash(vein,id+20,world.seed)*Math.max(1,HEIGHT-top-minDepth-10),angle=hash(vein,id+40,world.seed)*Math.PI*2;
  const length=8+Math.floor(hash(vein,91,world.seed)*17);
  for(let step=0;step<length;step++){
   const radius=.8+hash(vein,step+100,world.seed)*1.1;
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const tx=Math.floor(x+dx),ty=Math.floor(y+dy);if(tx<1||tx>=WIDTH-1||ty<world.surfaceAt(tx)+minDepth||ty>=HEIGHT-3)continue;if(dx*dx+dy*dy>radius*radius+hash(tx,ty,world.seed)*.7)continue;if(world.tiles[ty*WIDTH+tx]===BLOCK.ROCK)world.tiles[ty*WIDTH+tx]=id;}
   angle+=(hash(vein,step+200,world.seed)-.5)*1.2;x+=Math.cos(angle)*1.1;y+=Math.sin(angle)*.8;
  }
 }
}

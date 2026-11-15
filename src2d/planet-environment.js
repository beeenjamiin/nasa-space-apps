import {loopNoise,visualHash as hash} from './visual-noise.js';
const documents=new WeakMap();
export const PARALLAX_SPEEDS=[.035,.075,.14,.23,.34];
const MOON=['#12171e','#202730','#343d45','#4a555e','#65717a'];
const MARS=['#ac837b','#a67969','#956658','#825347','#70483f'];
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
/** Seamless periodic strips; bounded cache, 1:1 pixels, never regenerated per frame. */
export function landscapeLayer(planet,layer){
 if(!documents.has(document))documents.set(document,new Map());const cache=documents.get(document),key=planet+':'+layer;
 if(cache.has(key))return cache.get(key);
 const w=1536,h=220,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const c=canvas.getContext('2d'),heights=[];
 const mars=planet==='mars',seed=(mars?9821:7142)+layer*37;
 for(let x=0;x<w;x++){
  const broad=loopNoise(x/w*12,12,seed),fine=loopNoise(x/w*48,48,seed+13);
  let y=75+(broad-.5)*60+(fine-.5)*13;
  if(mars){const mesa=Math.round(broad*5)/5;y=55+mesa*55+fine*7;}
  else for(let n=0;n<8;n++){const cx=(n+.5)*192,r=25+hash(n,8,seed)*36,dx=Math.min(Math.abs(x-cx),w-Math.abs(x-cx))/r;if(dx<1)y+=18*(1-dx*dx);else if(dx<1.2)y-=6*Math.sin((dx-1)*Math.PI/.2);}
  heights[x]=Math.round(y);rect(c,x,y,1,h-y,(mars?MARS:MOON)[layer]);
 }
 for(let x=0;x<w;x++){
  const y=heights[x],slope=heights[(x+2)%w]-heights[(x+w-2)%w];
  if(slope>0)rect(c,x,y,1,2,mars?'#c29477':'#82909b');
  if(mars){for(let k=1;k<5;k++)if(y+k*12<h)rect(c,x,y+k*12,1,1,k%2?'#5b3d3a':'#b07c61');}
  else if(hash(x,layer,seed)>.82)rect(c,x,y+4+hash(x,7,seed)*20,1,2,'#35434e');
  if(layer>=3&&x%17===0){const drop=12+hash(x,8,seed)*30;rect(c,x,y+4,1,drop,mars?'#583b38':'#28323c');}
 }
 cache.set(key,canvas);return canvas;
}
export function drawLandscape(c,w,h,planet,cam){
 for(let layer=0;layer<5;layer++){
  const sprite=landscapeLayer(planet,layer),period=sprite.width,offset=((cam.x*PARALLAX_SPEEDS[layer])%period+period)%period;
  const baseline=Math.round(h*.43+layer*17-cam.y*.025*layer),x=-Math.round(offset);
  c.drawImage(sprite,x,baseline);c.drawImage(sprite,x+period,baseline);
  const bottom=baseline+sprite.height;if(bottom<h)rect(c,0,bottom,w,h-bottom,(planet==='mars'?MARS:MOON)[layer]);
 }
}

/** Original stylized 2D Earth, not a geographic map or satellite texture.
 * One 192px sprite per document; no pixel generation in the frame loop.
 */
const caches = new WeakMap();
const mix = (a,b,t) => a.map((v,i) => v+(b[i]-v)*t);
// A shared 60-color ramp keeps the more detailed art within the existing pixel palette.
const palette = [[15,65,130],[25,103,165],[44,150,170],[91,174,186],[44,112,78],[106,145,91],[179,156,96],[161,161,138],[236,244,237],[81,168,216]].flatMap(rgb=>Array.from({length:6},(_,i)=>rgb.map(v=>Math.round(v*(.2+i*.16)))));
function pixelColor(rgb) {let best=palette[0],distance=Infinity;for(const p of palette){const d=p.reduce((n,v,i)=>n+(v-rgb[i])**2,0);if(d<distance){best=p;distance=d;}}return best;}
const clamp = x => Math.max(0,Math.min(1,x));
function field(u,v) {return Math.sin(u*13+Math.sin(v*17))*.06+Math.sin(u*29-v*23)*.025+Math.cos(u*51+v*37)*.013;}
export function earthSprite() {
 if (caches.has(document)) return caches.get(document);
 const size=192,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
 const c=canvas.getContext('2d'),image=c.createImageData(size,size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const nx=(x-95.5)/90,ny=(y-95.5)/90,r2=nx*nx+ny*ny;
  if(r2>1.09)continue;
  const index=(y*size+x)*4;
  if(r2>1){const a=clamp((1.09-r2)/.09);image.data.set([67,148,211,Math.round(a*a*3)*50],index);continue;}
  const z=Math.sqrt(1-r2),u=Math.atan2(nx,z),v=Math.asin(ny),noise=field(u,v);
  // Continent silhouettes, with independent small-scale coastline variation.
  const ellipse=(cx,cy,rx,ry)=>1-((u-cx)/rx)**2-((v-cy)/ry)**2;
  const land=Math.max(ellipse(.23,.25,.31,.58),ellipse(.48,-.65,.76,.3),ellipse(1.2,-.38,.65,.55),ellipse(-1.1,-.6,.46,.48),ellipse(-.9,.55,.2,.54),ellipse(1.1,.75,.26,.22))+noise*3;
  const light=clamp(-nx*.62-ny*.35+z*.72),shade=.16+Math.round(light*12)/12*.88;
  let rgb;
  if(land>0){
   const dry=clamp(1-Math.abs(v-.12)*3+noise*4),height=field(u+3,v+1);
   rgb=mix([44,112,78],[179,156,96],dry*.75);
   if(height>.065)rgb=mix(rgb,[161,161,138],.55);
   if(land<.08)rgb=[136,171,132];
  }else{
   const shallow=clamp(1+land*5),ripple=(Math.sin(u*47+v*63)*.5+.5)*.08;
   rgb=mix([15,65,130],[44,150,170],shallow*.7+ripple);
   const reflection=Math.exp(-((nx+.33)**2/.032+(ny+.28)**2/.07));
   rgb=mix(rgb,[179,218,218],reflection*.65);
  }
  if(Math.abs(v)>1.22)rgb=mix(rgb,[219,235,232],clamp((Math.abs(v)-1.22)*7));
  // Swirling, broken cloud bands. Land/ocean colors stay visible between them.
  const cloud=Math.sin(u*12+v*8+Math.sin(v*10)*1.4)*.48+Math.sin(u*27-v*19)*.2+Math.cos(v*22+u*5)*.23;
  if(cloud>.33)rgb=mix(rgb,[236,244,237],clamp((cloud-.33)*2.5)*.9);
  rgb=rgb.map(a=>a*shade);
  const limb=clamp((.29-z)*3)*(.35+light*.55);rgb=mix(rgb,[81,168,216],limb);
  image.data.set([...pixelColor(rgb),255],index);
 }
 c.putImageData(image,0,0);caches.set(document,canvas);return canvas;
}

/** Bounded pixel waves and sun-glitter; all passes are O(viewport width). */
export function drawEarthOcean(c,w,h,time) {
 const floor=Math.round(h*.72),sky=c.createLinearGradient(0,0,0,floor);
 sky.addColorStop(0,'#35589e');sky.addColorStop(.65,'#81b5d0');sky.addColorStop(1,'#d5dfd4');c.fillStyle=sky;c.fillRect(0,0,w,h);
 const sunX=w*.24,sunY=h*.22;c.fillStyle='#f5e7b4';c.fillRect(Math.round(sunX-8),Math.round(sunY-6),16,12);c.fillRect(Math.round(sunX-5),Math.round(sunY-9),10,18);
 for(let band=0;band<3;band++)for(let i=0;i<7;i++){
  const x=((i*113+band*53+time*(.3+band*.1))%(w+110))-80,y=h*(.12+band*.13)+Math.sin(i*2.7+band)*9;
  c.fillStyle=['#c1d7dc','#d7e3df','#e9ebe0'][band];c.fillRect(Math.round(x),Math.round(y),36+(i%3)*12,4);c.fillRect(Math.round(x+9),Math.round(y-4),18+(i%2)*9,5);c.fillRect(Math.round(x-6),Math.round(y+3),52,3);
 }
 const sea=c.createLinearGradient(0,floor,0,h);sea.addColorStop(0,'#759fa9');sea.addColorStop(.12,'#437e96');sea.addColorStop(.5,'#235c80');sea.addColorStop(1,'#173d66');c.fillStyle=sea;c.fillRect(0,floor,w,h-floor);
 c.fillStyle='#c8d9cd';c.fillRect(0,floor,w,1);
 for(let row=0;row<18;row++){
  const depth=row/17,y=floor+3+depth*depth*(h-floor-5),spacing=17+depth*32;
  for(let i=0;i<w/spacing;i++){
   const x=(i*spacing+Math.sin(row*2.3+time*.45)*12+time*(.4+depth))%w;
   const glitter=Math.abs(x-sunX)<12+depth*55 && (i+row)%3!==0;
   c.fillStyle=glitter?'#d6d6ad':row%3?'#488a9f':'#70a8b3';
   c.fillRect(Math.round(x),Math.round(y),Math.round(3+depth*10+(glitter?4:0)),1);
  }
 }
 return floor;
}

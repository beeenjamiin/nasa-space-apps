/** Astro by Ragde (CC0): whole authored walk, original articulated airborne poses. */
const documents=new WeakMap();
function suitPose(c,state,variant,rawPalette){
 const palette=rawPalette.map(color=>`rgb(${color.join(',')})`);
 const limb=(ax,ay,bx,by,cx,cy,boot=false)=>{const segment=(x,y,ex,ey,width,color)=>{c.fillStyle=color;const n=Math.max(1,Math.ceil(Math.hypot(ex-x,ey-y)));for(let i=0;i<=n;i++)c.fillRect(Math.round(x+(ex-x)*i/n-width/2),Math.round(y+(ey-y)*i/n-width/2),width,width);};for(const [w,col]of[[5,'#171c23'],[3,palette[1]],[1,palette[0]]]){segment(ax,ay,bx,by,w,col);segment(bx,by,cx,cy,w,col);}c.fillStyle='#596568';c.fillRect(Math.round(bx)-1,Math.round(by)-1,2,2);c.fillStyle='#262c30';c.fillRect(Math.round(cx)-2,Math.round(cy)-1,boot?6:4,3);c.fillStyle='#d0c6ad';c.fillRect(Math.round(cx)-1,Math.round(cy)-1,boot?4:3,2);};
 // Rebuild articulated limbs from anchored joints, never scale separate body strips.
 c.clearRect(0,24,32,10);c.clearRect(0,15,11,9);c.clearRect(22,15,10,9);
 const t=variant?1:0,fall=state==='fall',land=state==='land',boost=state==='boost';
 if(land){limb(14,23,11-t,27,11,32,true);limb(18,23,21+t,27,20,32,true);limb(12,16,9,20,8,23);limb(21,16,24,20,25,23);}
 else{
  limb(14,23,fall?13:11-t,fall?27:26,fall?12:10-t,fall?32:29,true);
  limb(18,23,boost?22:21+t,fall?27:25,fall?22:23+t,fall?32:28+t,true);
  limb(12,16,8,fall?19:14,7,fall?22:11+t);
  limb(21,16,25,fall?18:14,26,fall?20:10+t);
 }
 // Fixed hip belt and shoulder caps keep every joint connected to the torso.
 c.fillStyle=palette[2];c.fillRect(12,22,9,2);c.fillStyle=palette[0];c.fillRect(11,15,3,2);c.fillRect(20,15,3,2);
}
export function humanSprite(art,profile,frame,suited=true){if(!documents.has(document))documents.set(document,new Map());const sprites=documents.get(document);
 const key=[profile.color,profile.skin,profile.hair,profile.visor,profile.role,frame,suited].join(':');if(sprites.has(key))return sprites.get(key);
 const canvas=document.createElement('canvas');canvas.width=32;canvas.height=34;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
 const special=typeof frame==='string',baseFrame=special?0:frame;c.drawImage(art.human,baseFrame*32,0,32,32,0,2,32,32);
 const pixels=c.getImageData(0,0,32,34),data=pixels.data,palettes=[[[177,199,177],[126,160,142],[80,118,105],[48,76,70]],[[190,202,217],[136,157,182],[85,108,139],[48,64,90]],[[215,187,188],[180,138,151],[135,88,108],[85,50,73]],[[217,201,159],[181,153,105],[131,110,75],[78,67,51]]],palette=palettes[profile.color||0];
 for(let y=11;y<34;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4,r=data[i],g=data[i+1],b=data[i+2];if(!data[i+3])continue;if(Math.abs(r-g)<12&&Math.abs(b-g)<24&&r>75&&r<210){const shade=r>175?0:r>145?1:r>115?2:3;[data[i],data[i+1],data[i+2]]=palette[shade];}}
 c.putImageData(pixels,0,0);
 // Locate the authored visor per frame, so face customization follows the head bob.
 const original=c.getImageData(0,0,32,34).data;let minX=32,maxX=0,minY=34,maxY=0;for(let y=1;y<14;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4;if(original[i+3]&&original[i+2]>original[i]+7&&original[i+2]>145){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}
 const fx=Math.max(10,Math.min(15,Math.floor((minX+maxX)/2)-3)),fy=Math.max(3,minY+2);c.fillStyle=profile.visor==='gold'?'#c99d56':profile.skin||'#e9b38b';c.fillRect(fx,fy,7,5);c.fillStyle=profile.hair||'#332a28';c.fillRect(fx,fy,7,2);c.fillRect(fx,fy+1,1,3);c.fillStyle='#20212b';c.fillRect(fx+5,fy+2,1,2);
 // A connected neck gasket is part of the suit; no independently shifted head slice.
 c.fillStyle='#586c72';c.fillRect(14,13,5,2);c.fillStyle=['#b7d4b0','#c8d3df','#e2bcce','#e6ce8d'][profile.color||0];c.fillRect(15,13,3,1);c.fillStyle=profile.role==='biologist'?'#9cc29b':profile.role==='explorer'?'#e3bd78':'#9bbacc';c.fillRect(19,18,2,3);
 if(special)suitPose(c,frame.slice(0,-1),Number(frame.at(-1)),palette);
 if(!suited){
  // Flight clothing: remove the entire helmet and backpack, retain authored locomotion.
  c.clearRect(0,0,32,14);c.clearRect(6,14,5,10);
  const bob=Number.isFinite(minY)&&minY<12?Math.max(0,Math.min(1,minY-3)):0,hy=5+bob;
  c.fillStyle=profile.hair||'#332a28';c.fillRect(13,hy,8,2);c.fillRect(12,hy+2,10,6);c.fillRect(13,hy+8,7,1);
  c.fillStyle=profile.skin||'#e9b38b';c.fillRect(14,hy+3,8,5);c.fillRect(15,hy+7,5,2);c.fillRect(15,13,3,3);c.fillStyle=profile.hair||'#332a28';c.fillRect(13,hy+1,8,3);c.fillRect(13,hy+3,2,2);c.fillStyle='#29282b';c.fillRect(20,hy+4,1,1);c.fillStyle='#a97657';c.fillRect(20,hy+6,2,1);
  const swing=special?0:Math.sin((baseFrame-2)*Math.PI/4)*2,points=[[11,16],[9+swing,20],[10+swing,23]];for(let j=0;j<2;j++){const[a,b]=[points[j],points[j+1]],n=5;for(let i=0;i<=n;i++){c.fillStyle=j?'rgb('+palette[2].join(',')+')':'rgb('+palette[1].join(',')+')';c.fillRect(Math.round(a[0]+(b[0]-a[0])*i/n)-1,Math.round(a[1]+(b[1]-a[1])*i/n)-1,3,3);}}c.fillStyle=profile.skin||'#e9b38b';c.fillRect(Math.round(9+swing),22,3,2);
  const clothes=c.getImageData(0,14,32,20);for(let y=0;y<20;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4;if(clothes.data[i+3]&&y>12&&clothes.data[i]>175&&clothes.data[i+1]>165){clothes.data[i]=59;clothes.data[i+1]=66;clothes.data[i+2]=66;}}c.putImageData(clothes,0,14);
 }
 // One-pixel silhouette outlines are generated from alpha, not square tile borders.
 const image=c.getImageData(0,0,32,34),out=c.createImageData(32,34);out.data.set(image.data);for(let y=0;y<34;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4;if(image.data[i+3])continue;if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>x+dx>=0&&x+dx<32&&y+dy>=0&&y+dy<34&&image.data[((y+dy)*32+x+dx)*4+3]>128)){out.data.set([14,16,23,255],i);}}
 c.putImageData(out,0,0);sprites.set(key,canvas);if(sprites.size>64)sprites.delete(sprites.keys().next().value);return canvas;
}

export function drawAvatar(ctx,art,profile,x,y,{time=0,moving=false,air=false,scale=1,facing=1,motion=null,suited=true}={}){const frame=motion?.frame??(air?'jump'+Math.floor(time*5)%2:moving?2+Math.floor(time*9)%8:time%5.6>4.9?1:0),sprite=humanSprite(art,profile,frame,suited);ctx.save();ctx.translate(Math.round(x+12*scale),Math.round(y));ctx.scale(facing*scale,scale);ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite,-16,0,32,34);
 if(motion?.state==='mine'){const a=-1.6+Math.sin(motion.age*12)*1.1,cx=10,cy=20,ex=cx+Math.cos(a)*13,ey=cy+Math.sin(a)*13;ctx.strokeStyle='#17232a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(ex,ey);ctx.stroke();ctx.strokeStyle='#b6a281';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#17232a';ctx.fillRect(Math.round(ex)-5,Math.round(ey)-2,11,4);ctx.fillStyle=['#d0d7bf','#a6c8ce','#d8b276','#c6b4df'][(motion.pickaxeLevel||1)-1];ctx.fillRect(Math.round(ex)-4,Math.round(ey)-2,8,2);}
 ctx.restore();}

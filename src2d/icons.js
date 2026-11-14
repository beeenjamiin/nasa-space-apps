import {rockSprite} from './decor.js';
export function itemIcon(kind){const canvas=document.createElement('canvas');canvas.width=canvas.height=24;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);},ink='#131620';
 if(kind==='rations')kind='ration';if(kind==='samples')kind='sample';
 if(kind==='pick'){for(let i=0;i<13;i++){r(5+i,18-i,4,4,ink);r(6+i,18-i,2,2,'#9f744d');}r(6,3,13,4,ink);r(3,6,16,4,ink);r(3,6,3,7,ink);r(6,4,11,2,'#bdc7bb');r(4,7,13,2,'#7f9296');r(4,9,2,3,'#7f9296');}
 if(kind==='regolith')c.drawImage(rockSprite('moon',1),1,5);
 if(kind==='iron'){r(5,6,14,14,ink);r(3,9,17,8,ink);r(6,7,11,12,'#9e7156');r(4,10,14,5,'#bc915f');r(7,8,4,4,'#efd296');r(13,13,4,4,'#e1ba7c');}
 if(kind==='sample'){r(9,2,6,2,ink);r(5,4,14,4,ink);r(3,8,18,8,ink);r(5,16,14,4,ink);r(9,20,6,2,ink);r(9,4,6,16,'#a6bba2');r(6,7,12,9,'#cbd2aa');r(10,6,3,7,'#f1e3bc');r(6,10,3,6,'#839a8f');}
 if(kind==='rations')kind='ration';
 if(kind==='samples')kind='sample';
 if(['panels','panel2','panel3'].includes(kind)){r(3,4,18,13,ink);r(4,5,16,10,kind==='panel3'?'#9380b0':kind==='panel2'?'#b5a271':'#799ca5');for(let x=7;x<20;x+=4)r(x,5,1,10,'#d2d6b9');r(4,9,16,1,'#d2d6b9');r(7,17,2,5,'#a4b2a5');r(16,17,2,5,'#a4b2a5');}
 if(kind==='lamps'){r(9,8,6,13,ink);r(4,3,16,8,ink);r(6,5,12,4,'#f0d49b');r(8,19,9,2,'#91a295');}
 if(kind==='beacons'){r(11,5,2,17,'#c4c6aa');r(5,3,14,5,ink);r(7,4,10,2,'#d1b77f');r(7,13,11,8,'#a9bdab');r(9,15,4,2,'#597f89');}
 if(kind==='batteries'){r(9,2,6,2,'#c6c4aa');r(6,4,12,18,ink);r(8,6,8,14,'#879f83');r(11,8,2,5,'#e1d9a5');r(10,11,5,2,'#e1d9a5');r(12,12,2,5,'#e1d9a5');}
 if(kind==='repairKits'){r(3,7,18,14,ink);r(7,4,10,4,'#b4b6a0');r(5,9,14,10,'#d0ccae');r(10,10,4,8,'#b77b66');r(8,12,8,4,'#b77b66');}
 if(kind==='ice'){r(6,5,12,15,ink);r(7,6,10,13,'#8ebac5');r(8,7,3,6,'#d7e3d5');r(12,12,3,6,'#bad4cf');}
 if(kind==='ration'){r(5,2,14,20,ink);r(7,3,10,18,'#b9b69b');r(6,6,12,12,'#e3d4a4');r(9,8,6,7,'#7b8d67');r(10,9,4,4,'#aab781');r(8,3,8,2,'#5c6a61');r(8,19,8,2,'#5c6a61');}
 return canvas;
}

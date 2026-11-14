const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
export function drawFixture(c,f,cam,time=0){const x=f.x-cam.x,y=f.y-cam.y;
 if(f.type==='lamp'){rect(c,x+2,y-13,6,13,'#202c32');rect(c,x+3,y-12,4,9,'#b9b8a3');rect(c,x,y-16,10,5,'#192830');rect(c,x+1,y-15,8,3,f.charge>0?'#f1dfac':'#67756d');rect(c,x-1,y-2,12,2,'#727c77');}
 else{rect(c,x+5,y-23,2,23,'#a7b6aa');rect(c,x+2,y-25,8,4,'#253842');rect(c,x+3,y-24,6,2,Math.floor(time*2)%2?'#bfcc9b':'#e8c98c');rect(c,x,y-12,12,9,'#293c42');rect(c,x+2,y-11,8,5,'#b6beb0');rect(c,x+3,y-10,3,2,'#d7dec0');rect(c,x-2,y-2,16,2,'#6d807e');}
}
export function drawDiscovery(c,point,cam,done=false){const x=point.x-cam.x,y=point.y-cam.y+8;
 if(point.id==='mars-layers'){for(let i=0;i<6;i++){rect(c,x-16+i*2,y-4-i*3,32-i*4,4,i%2?'#aa7e63':'#76574f');rect(c,x-15+i*2,y-4-i*3,30-i*4,1,'#cca17c');}}
 else if(point.id==='mars-water'){for(let i=0;i<4;i++){rect(c,x-13+i*7,y-6-i%2*4,8,6+i%2*4,'#595b59');rect(c,x-12+i*7,y-7-i%2*4,6,3,'#b29879');rect(c,x-10+i*7,y-5-i%2*3,2,3,'#b9be9e');}}
 else{rect(c,x-10,y-17,20,17,'#263d49');rect(c,x-8,y-15,16,12,'#b5c2b4');rect(c,x-6,y-13,12,7,'#597c88');rect(c,x-5,y-12,4,4,'#a9d3cf');rect(c,x-4,y-24,2,8,'#a5b7b4');rect(c,x-7,y-25,8,2,'#ddcf9d');}
 rect(c,x-1,y-35,2,5,done?'#9ebd99':'#efce91');rect(c,x-3,y-30,6,1,done?'#9ebd99':'#efce91');
}

import {fbm,visualHash,smooth} from './visual-noise.js';
/** Version 4 ONLY. Existing generator versions and their edit indices stay byte-identical. */
export function generation4Surface(tileX,planet,seed,legacyHeight){
 const fade=smooth((tileX-220)/40);if(!fade)return legacyHeight;
 let detail=(fbm(tileX/130,0,seed)-.5)*7;
 if(planet==='moon'){
  for(let i=0;i<8;i++){
   const center=156+i*63+(visualHash(i,3,seed)-.5)*22,radius=12+visualHash(i,4,seed)*13,t=Math.abs(tileX-center)/radius;
   if(t<1)detail+=(2+visualHash(i,5,seed)*4)*(1-t*t);
   else if(t<1.35)detail-=1.6*Math.sin((t-1)/.35*Math.PI);
  }
 }else{
  const region=fbm(tileX/180,1,seed+94),strata=Math.round(region*7)/7;
  detail+=(strata-.5)*7+Math.sin(tileX*.12+seed%17)*Math.max(0,region-.3)*2;
 }
 return Math.round(legacyHeight+detail*fade);
}
export function generation4Cave(x,y,top,seed,phase){
 if(x<220||y<=top+20||y>=164)return false;
 return Math.sin(x*.09+y*.065+phase)+Math.sin(x*.045-y*.14-phase*.7)+(fbm(x/31,y/38,seed,3)-.5)*.7>1.2;
}

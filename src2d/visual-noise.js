/** Pure deterministic fields shared by the art and the versioned terrain generator. */
export const clamp01 = n => Math.max(0,Math.min(1,n));
export const smooth = n => {n=clamp01(n);return n*n*(3-2*n);};
function random(x,y,seed){let n=Math.imul(x+seed,374761393)^Math.imul(y+seed,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
export function noise2(x,y,seed=1){const ix=Math.floor(x),iy=Math.floor(y),u=smooth(x-ix),v=smooth(y-iy),a=random(ix,iy,seed),b=random(ix+1,iy,seed),c=random(ix,iy+1,seed),d=random(ix+1,iy+1,seed);return(a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;}
export function fbm(x,y,seed=1,octaves=4){let value=0,total=0,weight=1;for(let i=0;i<octaves;i++){value+=noise2(x,y,seed+i*71)*weight;total+=weight;x*=2;y*=2;weight*=.5;}return value/total;}
export function loopNoise(x,cells,seed){const a=Math.floor(x),u=smooth(x-a),wrap=n=>(n%cells+cells)%cells;return random(wrap(a),0,seed)*(1-u)+random(wrap(a+1),0,seed)*u;}
export {random as visualHash};

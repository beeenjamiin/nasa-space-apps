/** World zoom changes only the canvas viewport. DOM HUD keeps its physical size. */
export const ZOOM_LIMITS=Object.freeze({min:.75,max:2,step:.25});
export function clampZoom(value){return Math.min(ZOOM_LIMITS.max,Math.max(ZOOM_LIMITS.min,Number.isFinite(value)?value:1));}
export function viewportSize(width,height,zoom=1){
 width=Math.max(1,Number(width)||1);height=Math.max(1,Number(height)||1);
 const ratio=width/height;let baseWidth=Math.max(280,Math.min(880,Math.round(width/2))),baseHeight=Math.round(baseWidth/ratio);if(baseHeight<240){baseHeight=240;baseWidth=Math.round(baseHeight*ratio);}const z=clampZoom(zoom);
 return{width:Math.round(baseWidth/z),height:Math.round(baseHeight/z)};
}
export function canvasPoint(canvas,clientX,clientY){const r=canvas.getBoundingClientRect();return{x:(clientX-r.left)/Math.max(1,r.width)*canvas.width,y:(clientY-r.top)/Math.max(1,r.height)*canvas.height};}

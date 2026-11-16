/** Cinematic motion is deterministic, in game pixels and seconds, not telemetry. */
export const smoothstep=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function transportPose(width,floor,t){
 const travel=smoothstep(Math.min(1,t/.8)),x=width*(.13+travel*.53);
 return{x,y:floor,progress:travel,wheelAngle:travel*width*.53/7,moving:t<.8,door:smoothstep((t-.78)/.12),fade:smoothstep((t-.94)/.06)};
}
export function launchPose(t,height){
 t=Math.max(0,Math.min(1,t));const throttle=smoothstep(t/.22),flight=Math.max(0,(t-.12)/.88),rise=flight**2*(height+170),follow=rise*.42;
 return{throttle,rise,follow,screenRise:rise-follow,shake:Math.sin(t*180)*Math.sin(t*83)*throttle*(1-smoothstep(t/.65))*.65};
}

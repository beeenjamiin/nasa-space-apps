import config from '../data/pixel-config.json' with {type:'json'};
export const FALL_TUNING=Object.freeze({safeSpeed:4.25,damagePerEnergy:3});
/** Impact speed is in world pixels/s; damage uses specific kinetic energy (J/kg). */
export function fallImpact(speed,planet){
 const gravity=config[planet].gravity,metersPerSecond=Math.max(0,speed)/config.pixelsPerMeter;
 const excessEnergy=Math.max(0,(metersPerSecond**2-FALL_TUNING.safeSpeed**2)/2);
 return{speed:metersPerSecond,gravity,damage:Math.min(100,Math.round(excessEnergy*FALL_TUNING.damagePerEnergy*100)/100)};
}

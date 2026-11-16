/** Original procedural SFX, CC0. No samples, streaming, libraries or external requests. */
export const SOUND_CUES=Object.freeze({
 click:{duration:.09,tones:[[660,480,.12]]},confirm:{duration:.28,tones:[[520,780,.15],[780,1040,.09]]},
 error:{duration:.26,tones:[[190,110,.14]],noise:.04},mine:{duration:.16,tones:[[260,85,.08]],noise:.19},
 step:{duration:.1,tones:[[100,50,.035]],noise:.08},jump:{duration:.22,tones:[[240,570,.11]],noise:.025},
 land:{duration:.2,tones:[[120,45,.06]],noise:.14},craft:{duration:.5,tones:[[440,660,.09],[660,880,.1],[880,1100,.07]]},
 door:{duration:.6,tones:[[140,75,.045]],noise:.12},suit:{duration:.35,tones:[[350,220,.06]],noise:.1},
 alarm:{duration:.65,tones:[[740,430,.11],[430,740,.08]]},medal:{duration:.8,tones:[[523,659,.1],[659,784,.1],[784,1047,.1]]},
 countdown:{duration:.16,tones:[[620,620,.12]]},separate:{duration:.38,tones:[[140,45,.08]],noise:.18},
 car:{duration:1,tones:[[48,53,.04],[96,102,.015]],noise:.06},launch:{duration:1,tones:[[43,47,.055],[82,90,.025]],noise:.22}
});
export function synthesizeCue(kind,sampleRate=22050){
 const cue=SOUND_CUES[kind]||SOUND_CUES.click,size=Math.ceil(cue.duration*sampleRate),data=new Float32Array(size);let seed=123456789,low=0;
 for(let i=0;i<size;i++){
  const time=i/sampleRate,t=time/cue.duration;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;low=low*.82+noise*.18;
  const loop=['car','launch'].includes(kind),envelope=loop?1:Math.min(1,time/.012)*Math.max(0,(1-t))**1.65;
  let value=low*(cue.noise||0)*2;
  for(const [n,[from,to,gain]]of cue.tones.entries()){const local=Math.max(0,time-n*.055),phase=2*Math.PI*(from*local+(to-from)*local*local/(2*cue.duration));value+=time>=n*.055?Math.sin(phase)*gain:0;}
  data[i]=Math.tanh(value*envelope)*.7;
 }
 // Bounded loop endpoints prevent clicks when engine buffers repeat.
 if(['car','launch'].includes(kind))for(let i=0;i<Math.min(256,size/2);i++){const k=i/256;data[i]*=k;data[size-1-i]*=k;}
 return data;
}
export class GameAudio{
 constructor({contextFactory,muted=false,volume=.55}={}){this.contextFactory=contextFactory;this.context=null;this.muted=muted;this.volume=Math.max(0,Math.min(1,Number.isFinite(volume)?volume:.55));this.buffers=new Map();this.voices=new Set();this.loops=new Map();this.last=new Map();this.events=0;}
 unlock(){try{if(!this.context){const create=this.contextFactory||(()=>new(window.AudioContext||window.webkitAudioContext)());this.context=create();this.master=this.context.createGain();this.master.gain.value=this.muted?0:this.volume;this.master.connect(this.context.destination);}if(this.context.state==='suspended')this.context.resume().catch(()=>{});return true;}catch{return false;}}
 buffer(kind){if(this.buffers.has(kind))return this.buffers.get(kind);const data=synthesizeCue(kind,this.context.sampleRate),b=this.context.createBuffer(1,data.length,this.context.sampleRate);b.copyToChannel(data,0);this.buffers.set(kind,b);return b;}
 play(kind='click'){
  if(this.muted||this.volume===0||!this.context)return false;const now=this.context.currentTime;if(now-(this.last.get(kind)??-100)<(kind==='mine'?.1:.06)||this.voices.size>=12)return false;
  this.last.set(kind,now);const source=this.context.createBufferSource();source.buffer=this.buffer(kind);source.connect(this.master);this.voices.add(source);source.onended=()=>{source.disconnect();this.voices.delete(source);};source.start();this.events++;return true;
 }
 loop(kind,power=0){if(!this.context)return;power=this.muted||this.volume===0?0:Math.max(0,Math.min(1,power));let active=this.loops.get(kind);if(!active&&power>0){const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=this.buffer(kind);source.loop=true;gain.gain.value=0;source.connect(gain).connect(this.master);source.start();active={source,gain};this.loops.set(kind,active);}if(!active)return;const now=this.context.currentTime;active.gain.gain.setTargetAtTime(power,now,.09);if(power===0){active.source.stop(now+.35);const previous=active;active.source.onended=()=>{previous.source.disconnect();previous.gain.disconnect();};this.loops.delete(kind);}}
 stopLoops(){for(const kind of this.loops.keys())this.loop(kind,0);}
 setVolume(value){this.volume=Math.max(0,Math.min(1,Number(value)||0));this.applyVolume();}
 setMuted(value){this.muted=!!value;this.applyVolume();if(this.muted)this.stopLoops();}
 applyVolume(){if(this.context)this.master.gain.setTargetAtTime(this.muted?0:this.volume,this.context.currentTime,.025);}
 stats(){return{ready:!!this.context,muted:this.muted,volume:this.volume,voices:this.voices.size,loops:this.loops.size,buffers:this.buffers.size,events:this.events};}
 dispose(){this.stopLoops();for(const voice of this.voices){try{voice.stop();}catch{}voice.disconnect();}this.voices.clear();this.buffers.clear();this.context?.close?.();}
}

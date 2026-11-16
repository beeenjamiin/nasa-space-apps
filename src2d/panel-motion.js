/** A passive, short-lived closing snapshot keeps the real panel immediately inert/hidden. */
export function closePanel(node,{animate=true}={}){
 if(node.classList.contains('hidden'))return;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 if(animate&&!reduced&&typeof node.animate==='function'){
  const r=node.getBoundingClientRect();if(r.width&&r.height){const ghost=node.cloneNode(true);for(const element of [ghost,...ghost.querySelectorAll('*')]){element.removeAttribute('id');for(const attribute of [...element.attributes])if(attribute.name.startsWith('data-'))element.removeAttribute(attribute.name);}
   const originals=node.querySelectorAll('canvas');ghost.querySelectorAll('canvas').forEach((canvas,i)=>{if(originals[i])canvas.getContext('2d')?.drawImage(originals[i],0,0);});ghost.classList.add('panel-ghost');ghost.setAttribute('aria-hidden','true');ghost.inert=true;Object.assign(ghost.style,{left:r.left+'px',top:r.top+'px',right:'auto',bottom:'auto',width:r.width+'px',height:r.height+'px'});document.body.append(ghost);ghost.scrollTop=node.scrollTop;
   const animation=ghost.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX(14px) scale(.985)'}],{duration:135,easing:'ease-in',fill:'forwards'});const cleanup=()=>ghost.remove(),deadline=window.setTimeout(()=>{animation.cancel();cleanup();},220);animation.finished.catch(()=>{}).finally(()=>{window.clearTimeout(deadline);cleanup();});
  }
 }
 node.classList.add('hidden');
}

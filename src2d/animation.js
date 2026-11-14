/** Fixed-step animation state. Physical displacement drives the foot cycle. */
export class AstronautAnimator {
  constructor() { this.state='idle'; this.age=0; this.distance=0; this.previous=null; this.variant=0; }
  update(dt,player,{mining=false,boost=false}={}) {
    const before=this.previous,dx=before?player.x-before.x:0;
    const landed=before&&!before.grounded&&player.grounded;
    this.distance+=Math.abs(dx);
    let next;
    if(!player.grounded) next=boost?'boost':player.vy< -3?'jump':'fall';
    else if(landed||(this.state==='land'&&this.age<.16)) next='land';
    else if(mining) next='mine';
    else if(Math.abs(player.vx)>3) next=Math.abs(player.vx)>54?'run':'walk';
    else next='idle';
    if(next!==this.state){this.state=next;this.age=0;if(next==='idle'||next==='land')this.variant=(this.variant+1)%3;}
    this.age+=dt;
    this.previous={x:player.x,grounded:player.grounded};
    return this.pose();
  }
  pose() {
    const state=this.state;
    let frame=0;
    if(state==='walk'||state==='run') frame=2+Math.floor(this.distance/3.6)%8;
    else if(state==='mine') frame=10+Math.floor(this.age*12)%8;
    else if(state==='idle') frame=(this.age%5.6>4.9?1:0);
    else frame=state+Math.floor(this.age*(state==='land'?12:5))%2;
    return {state,frame,age:this.age,variant:this.variant};
  }
}

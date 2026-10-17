import {WIDTH,HEIGHT,clamp} from './world.js';

export class Camera{
  constructor(){this.x=0;this.y=0;this.w=WIDTH;this.h=HEIGHT;this.initial=true;}
  reset(){this.initial=true;}
  update(game,aspect,dt=.016,overview=false,small=false){
    aspect=Math.max(.35,aspect||WIDTH/HEIGHT);
    const fullWidth=Math.max(WIDTH,HEIGHT*aspect),base=small?660:940;
    let w,cx,cy;
    if(overview||game.phase==='ready'){
      w=fullWidth;cx=WIDTH/2;cy=HEIGHT/2;
    }else if(game.duo){
      w=Math.min(fullWidth,Math.max(base,Math.abs(game.chor.x-game.cop.x)+240,(Math.abs(game.chor.y-game.cop.y)+240)*aspect));
      cx=(game.chor.x+game.cop.x)/2;cy=(game.chor.y+game.cop.y)/2;
    }else{w=Math.min(base,fullWidth);const a=game.role==='cop'?game.cop:game.chor;cx=a.x;cy=a.y;}
    const h=w/aspect,tx=w>=WIDTH?(WIDTH-w)/2:clamp(cx-w/2,0,WIDTH-w),ty=h>=HEIGHT?(HEIGHT-h)/2:clamp(cy-h/2,0,HEIGHT-h);
    const k=dt>=1 ? 1 : 1-Math.exp(-Math.min(.1,dt)*9);
    if(this.initial||w>this.w+1||overview){Object.assign(this,{x:tx,y:ty,w,h});this.initial=false;}
    else{this.w+=(w-this.w)*k;this.h=this.w/aspect;this.x+=(tx-this.x)*k;this.y+=(ty-this.y)*k;}
    this.x=this.w>=WIDTH?(WIDTH-this.w)/2:clamp(this.x,0,WIDTH-this.w);
    this.y=this.h>=HEIGHT?(HEIGHT-this.h)/2:clamp(this.y,0,HEIGHT-this.h);
    return this;
  }
  project(point,screenWidth){const s=screenWidth/this.w;return{x:(point.x-this.x)*s,y:(point.y-this.y)*s};}
}

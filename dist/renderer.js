import {WIDTH,HEIGHT,TILE,COLS,ROWS,GRID,BUILDINGS,BUSHES,SAFE,STATION,distance,findPath} from './engine.js';
import {paintNeighbourhood,drawPasserby} from './world-art.js';

const INK='#345443';
function box(c,x,y,w,h,color,r=0){c.fillStyle=color;c.beginPath();if(r&&c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h);c.fill();}
function line(c,x,y,x2,y2,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
function circle(c,x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
function text(c,t,x,y,size=10,color=INK,align='center',weight=700){c.font=`${weight} ${size}px Arial, sans-serif`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(t,x,y);}
function shadow(c,x,y,rx,ry){c.fillStyle='#2c4a3533';c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function tree(c,x,y,size=24){shadow(c,x+6,y+16,size,size*.46);box(c,x-3,y+2,6,21,'#8d7855',2);circle(c,x+3,y,size,'#678267');circle(c,x-8,y-6,size*.7,'#7f986e');circle(c,x+6,y-10,size*.68,'#92a47b');circle(c,x+12,y+3,size*.55,'#6c8b64');circle(c,x-5,y-12,3,'#adba83');}

export function drawLoot(c,id,x,y,s=1){
  c.save();c.translate(x,y);c.scale(s,s);c.lineWidth=2;c.strokeStyle=INK;
  if(id==='cooker'){
    box(c,-12,-8,24,18,'#a4b7a4',6);box(c,4,-5,6,12,'#819a89',3);
    box(c,-16,-12,32,5,INK,2);box(c,-3,-19,6,7,INK,2);box(c,-21,-7,7,5,INK,2);box(c,14,-7,7,5,INK,2);
    circle(c,-4,-3,1.7,INK);circle(c,5,-3,1.7,INK);line(c,-3,4,3,4,INK,1.5);
  }else if(id==='trophy'){
    c.strokeStyle='#a9813e';c.lineWidth=4;c.beginPath();c.ellipse(-12,-11,7,8,0,0,Math.PI*2);c.ellipse(12,-11,7,8,0,0,Math.PI*2);c.stroke();
    box(c,-11,-20,22,24,'#dfb356',4);box(c,-3,1,6,13,'#b28c43');box(c,-12,12,24,6,INK,2);text(c,'★',0,-8,15,'#fff1a7');
  }else{
    c.beginPath();c.moveTo(0,-21);c.lineTo(18,11);c.quadraticCurveTo(0,18,-18,11);c.closePath();c.fillStyle='#e3a558';c.fill();c.strokeStyle='#a97d41';c.lineWidth=2;c.stroke();
    line(c,0,-15,13,9,'#efc47d',2);circle(c,-5,1,1.8,INK);circle(c,5,1,1.8,INK);c.beginPath();c.arc(0,6,3,0,Math.PI);c.strokeStyle=INK;c.lineWidth=1.4;c.stroke();
  }
  c.restore();
}

export function drawActor(c,a,time=0,label='',carried=null){
  if(a.invuln>0&&Math.floor(time*12)%2)c.globalAlpha=.45;
  const {x,y}=a,bob=a.moving?Math.sin(a.walk)*1.3:Math.sin(time*2)*.5;
  const body=a.kind==='cop'?'#bcaa72':'#365a49';
  shadow(c,x,y+10,13,5);
  if(a.sprinting){for(let i=0;i<3;i++)line(c,x-Math.cos(a.dir)*(16+i*6),y-Math.sin(a.dir)*(16+i*6),x-Math.cos(a.dir)*(20+i*6),y-Math.sin(a.dir)*(20+i*6),'#73856680',2);}
  c.save();c.translate(x,y+bob);
  const leg=a.moving?Math.sin(a.walk)*3:0;
  box(c,-9,-2,7,12+leg,'#254334',3);box(c,2,-2,7,12-leg,'#254334',3);
  box(c,-11,-15,22,20,body,6);box(c,-14,-12,5,15,'#b9a477',3);box(c,9,-12,5,15,'#b9a477',3);
  if(a.kind==='chor'){for(let i=0;i<3;i++)box(c,-9,-11+i*5,18,2,'#d9dbb8');box(c,8,-13,7,16,'#c6a267',4);}
  else{box(c,-9,-12,18,2,'#d5cda0');box(c,-3,-14,5,6,'#66816a');circle(c,6,-7,2,'#e2c968');box(c,-11,0,22,3,'#46614c');}
  circle(c,0,-23,12,'#dfc291');circle(c,-11,-23,3,'#d2b581');circle(c,11,-23,3,'#d2b581');
  if(a.kind==='chor'){
    box(c,-12,-33,24,10,'#305143',5);box(c,-13,-26,26,9,'#294b3d',3);
    circle(c,-5,-22,2,'#f7f0d6');circle(c,5,-22,2,'#f7f0d6');circle(c,-4,-22,1,'#233b31');circle(c,6,-22,1,'#233b31');
  }else{
    box(c,-13,-35,26,9,'#42624d',3);box(c,-16,-29,32,4,'#294a3a',2);box(c,-3,-34,6,5,'#e3c868',1);
    circle(c,-5,-22,1.6,'#294333');circle(c,5,-22,1.6,'#294333');
    line(c,-6,-15,0,-17,'#4b4432',3);line(c,0,-17,6,-15,'#4b4432',3);
  }
  if(a.stun>0){text(c,'✦',-17,-40+Math.sin(time*5)*3,13,'#d68845');text(c,'✦',15,-40-Math.sin(time*5)*3,12,'#d68845');}
  if(carried)drawLoot(c,carried.id,18,-4,.66);
  c.restore();
  if(label){box(c,x-18,y+16,36,13,a.kind==='chor'?'#315444':'#667e86',4);text(c,label,x,y+22.5,7,'#fff8e1');}
  c.globalAlpha=1;
}

export function drawMap(c){paintNeighbourhood(c);}

export class Renderer {
  constructor(canvas,makeCanvas=()=>document.createElement('canvas')){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');
    if(!this.ctx)throw new Error('Canvas 2D is unavailable in this browser.');
    this.background=makeCanvas();this.background.width=WIDTH;this.background.height=HEIGHT;
    this.homeRoute={key:'',points:[]};
    this.civilians=[[{x:80,y:80},{x:80,y:432}],[{x:368,y:240},{x:528,y:464}],[{x:816,y:272},{x:880,y:560}]].map(([a,b])=>{const route=findPath(a,b);return [...route,...route.slice(1,-1).reverse()];});
    const b=this.background.getContext('2d');if(!b)throw new Error('Unable to initialise neighbourhood rendering.');drawMap(b);
  }
  resize(width,height,pixelRatio=1){
    const dpr=Math.min(2,pixelRatio||1);this.canvas.width=Math.max(1,Math.round(width*dpr));this.canvas.height=Math.max(1,Math.round(height*dpr));
  }
  render(g,time=0,reducedMotion=false){
    const c=this.ctx,w=this.canvas.width,h=this.canvas.height;
    c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);c.fillStyle='#293f2d';c.fillRect(0,0,w,h);
    const scale=Math.min(w/WIDTH,h/HEIGHT);c.setTransform(scale,0,0,scale,(w-WIDTH*scale)/2,(h-HEIGHT*scale)/2);c.drawImage(this.background,0,0);
    const t=reducedMotion?0:time,playing=g.phase==='playing';
    // A little life even before a round begins.
    for(let i=0;i<3;i++){const phase=(t*.3+i*.33)%1;c.globalAlpha=(1-phase)*.45;circle(c,124+phase*12,98-phase*27,3+phase*6,'#fff6d6');}c.globalAlpha=1;
    for(let i=0;i<this.civilians.length;i++){
      const route=this.civilians[i];if(route.length<2)continue;
      const step=(t*.75+i*11)%route.length,j=Math.floor(step),f=step-j,a=route[j],b=route[(j+1)%route.length];
      drawPasserby(c,a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,t,i);
    }
    if(g.carried&&(g.role==='chor'||g.duo)){
      const key=`${Math.floor(g.chor.x/TILE)},${Math.floor(g.chor.y/TILE)}`;
      if(this.homeRoute.key!==key){this.homeRoute={key,points:findPath(g.chor,SAFE)};}
      const points=[g.chor,...this.homeRoute.points];
      c.save();c.lineJoin='round';c.lineCap='round';
      for(const [color,width,dash]of [['#315d4844',7,[]],['#efffd3',3,[3,8]]]){
        c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.lineDashOffset=reducedMotion?0:-t*15;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();
      }c.restore();
    }
    for(const p of g.chai){if(p.cooldown>0)continue;shadow(c,p.x,p.y+7,13,5);circle(c,p.x,p.y,17,'#f6eac56b');box(c,p.x-8,p.y-10,15,18,'#fff2cd',3);box(c,p.x-6,p.y-9,11,4,'#9e6039',1);c.strokeStyle='#f5e4bb';c.lineWidth=2.5;c.beginPath();c.arc(p.x+9,p.y-1,5,-Math.PI/2,Math.PI/2);c.stroke();box(c,p.x-18,p.y+12,36,13,'#f8f1d9e8',4);text(c,'CHAI',p.x,p.y+19,7,'#765d36');line(c,p.x-2,p.y-16,p.x+Math.sin(t*3)*2,p.y-21,'#fff7dc',2);}
    if(playing){c.strokeStyle=g.carried?'#eaffe0':'#dbe9b3';c.lineWidth=3;c.globalAlpha=.55+Math.sin(t*3)*.18;c.beginPath();c.arc(SAFE.x,SAFE.y,SAFE.radius,0,Math.PI*2);c.stroke();c.globalAlpha=1;}
    for(const [index,l] of g.loot.entries()){
      if(l.state!=='ground')continue;
      const bob=Math.sin(t*2.7+l.x)*3;
      shadow(c,l.x,l.y+15,22,8);circle(c,l.x,l.y,29+Math.sin(t*2)*2,'#fff1ab78');
      c.strokeStyle='#b7823f';c.lineWidth=1.5;c.beginPath();c.arc(l.x,l.y,30,0,Math.PI*2);c.stroke();
      c.strokeStyle='#fff4c3';c.lineWidth=3;c.setLineDash([3,5]);c.beginPath();c.arc(l.x,l.y,28+Math.sin(t*2)*2,0,Math.PI*2);c.stroke();c.setLineDash([]);
      drawLoot(c,l.id,l.x,l.y+bob,1.17);
      circle(c,l.x-25,l.y-23,9,'#345e48');text(c,String(index+1),l.x-25,l.y-22.5,9,'#fff5c9');
      box(c,l.x-45,l.y+33,90,17,'#fff4d9f5',5);text(c,l.name,l.x,l.y+42,8.5,'#5b684c');
    }
    for(const r of g.rings){c.globalAlpha=Math.max(0,r.life/r.total)*.65;c.strokeStyle=r.color;c.lineWidth=2.5;c.beginPath();c.arc(r.x,r.y,reducedMotion?48:r.r,0,Math.PI*2);c.stroke();}c.globalAlpha=1;
    // Police awareness cone is intentionally visible to help first-time players.
    if(playing&&g.alert>0){circle(c,g.cop.x,g.cop.y-51,10,'#e3a36e');text(c,'!',g.cop.x,g.cop.y-50,13,'#644b32');}
    const actors=[g.chor,g.cop].sort((a,b)=>a.y-b.y);
    for(const a of actors){
      let label='';
      if(playing)label=g.duo?(a.kind==='chor'?'P1':'P2'):(a.kind===g.role?'YOU':'AI');
      if(playing&&((g.duo)||(a.kind===g.role))){c.strokeStyle=a.kind==='chor'?'#f8f4c9':'#e6f7ff';c.lineWidth=2.5;c.beginPath();c.ellipse(a.x,a.y+10,18,8,0,0,Math.PI*2);c.stroke();}
      drawActor(c,reducedMotion?{...a,moving:false,sprinting:false}:a,t,label,a.kind==='chor'?g.carried:null);
    }
    if(g.hushed>0){circle(c,g.chor.x-18,g.chor.y-27,9,'#d7e4b8');text(c,'shh',g.chor.x-18,g.chor.y-26,6,'#5d7556');}
    if(g.netVisual>0){c.globalAlpha=g.netVisual/.4;c.strokeStyle='#648c9a';c.lineWidth=1.5;c.beginPath();c.arc(g.cop.x,g.cop.y,84,0,Math.PI*2);c.stroke();for(let i=-60;i<=60;i+=15){line(c,g.cop.x+i,g.cop.y-55,g.cop.x+i,g.cop.y+55,'#7c9e9c66');line(c,g.cop.x-55,g.cop.y+i,g.cop.x+55,g.cop.y+i,'#7c9e9c66');}c.globalAlpha=1;}
    if(!reducedMotion)for(const p of g.particles){c.globalAlpha=Math.min(1,p.life*2);box(c,p.x,p.y,3,3,p.color,1);}c.globalAlpha=1;
    for(const s of g.speech){
      const a=s.who==='cop'?g.cop:g.chor;c.font='700 10px Arial, sans-serif';
      const tw=c.measureText(s.text).width+20,bx=Math.max(8,Math.min(WIDTH-tw-8,a.x-tw/2)),by=Math.max(90,a.y-77);
      c.globalAlpha=Math.min(1,s.life*3);box(c,bx+2,by+3,tw,25,'#2c4d3122',7);box(c,bx,by,tw,25,'#fffcdf',7);
      c.fillStyle='#fffcdf';c.beginPath();c.moveTo(a.x-4,by+23);c.lineTo(a.x,by+31);c.lineTo(a.x+5,by+23);c.fill();text(c,s.text,bx+tw/2,by+13,10,s.color);c.globalAlpha=1;
    }
    if(playing&&g.role==='chor'){
      const l=g.loot.find(l=>l.state==='ground'&&distance(l,g.chor)<43);
      const msg=g.carried&&distance(g.chor,SAFE)<SAFE.radius?'E · BANK':!g.carried&&l?'E · GRAB':'';
      if(msg){box(c,g.chor.x-31,g.chor.y+33,62,18,'#f0d575',5);text(c,msg,g.chor.x,g.chor.y+42,8,INK);}
    }
    // Warm vignette ties the procedural world into the print-like page.
    const shade=c.createRadialGradient(WIDTH/2,HEIGHT/2,200,WIDTH/2,HEIGHT/2,600);shade.addColorStop(0,'#254d3000');shade.addColorStop(1,'#27462e0b');c.fillStyle=shade;c.fillRect(0,0,WIDTH,HEIGHT);
  }
}

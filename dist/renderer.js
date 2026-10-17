import {WIDTH,HEIGHT,TILE,GRID,SAFE,BUILDINGS,ROOF_ACCESS,TEA_SPOTS,ART_URL,CIVILIAN_ROUTES,distance,findPath,nearestGround,closedRoute} from './world.js';
import {Camera} from './camera.js';
import {paintNeighbourhood,paintAmbient,drawPasserby} from './world-art.js';

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
  }else if(id==='radio'){
    box(c,-17,-16,34,29,'#ad7477',5);box(c,-13,-11,16,18,'#efd5a0',3);for(let i=0;i<4;i++)line(c,-11,-7+i*4,1,-7+i*4,'#7e6857',1.5);circle(c,10,-6,4,'#eed596');circle(c,10,5,2,'#365746');line(c,7,-16,15,-30,'#3b5c4b',2);
  }else if(id==='chappal'){
    c.save();c.rotate(-.3);box(c,-12,-22,23,40,'#d29d59',10);box(c,-8,-18,15,32,'#e7bf78',8);line(c,-8,-10,0,-2,'#815d40',3);line(c,8,-10,0,-2,'#815d40',3);line(c,0,-2,0,5,'#815d40',3);circle(c,-4,-15,1.5,INK);circle(c,4,-15,1.5,INK);c.restore();
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

export function drawMap(c,image=null){paintNeighbourhood(c,image);}
function carSprite(c,car,t){
  c.save();c.translate(car.x,car.y);c.rotate(car.dir-Math.PI/2);shadow(c,4,4,18,29);
  box(c,-16,-27,32,54,'#355c60',7);box(c,-14,-25,28,50,'#e2e8d3',6);box(c,-17,-16,4,11,'#2c443c',2);box(c,13,-16,4,11,'#2c443c',2);box(c,-17,13,4,10,'#2c443c',2);box(c,13,13,4,10,'#2c443c',2);
  box(c,-11,-17,22,29,'#467b87',4);box(c,-9,-13,18,12,'#9fc5c3',2);box(c,-9,5,18,6,'#8aadaa',2);box(c,-12,0,24,5,'#e7e9d2',1);
  box(c,-9,-1,9,4,Math.sin(t*8)>0?'#ed977b':'#b76d62',1);box(c,0,-1,9,4,Math.sin(t*8)<0?'#8ac5d4':'#538b9a',1);circle(c,-10,-23,2,'#f8e5a1');circle(c,10,-23,2,'#f8e5a1');text(c,'★',0,19,11,'#537f83');
  c.restore();if(car.aware>.15){box(c,car.x-25,car.y-46,50,13,'#fff1cc',4);text(c,car.aware>.7?'SPOTTED':'LOOKING',car.x,car.y-39,7,'#9a5539');}
}

export class Renderer{
  constructor(canvas,makeCanvas=()=>document.createElement('canvas')){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');if(!this.ctx)throw new Error('Canvas 2D is unavailable.');
    this.background=makeCanvas();this.background.width=WIDTH;this.background.height=HEIGHT;drawMap(this.background.getContext('2d'));
    this.camera=new Camera();this.cssWidth=WIDTH;this.cssHeight=HEIGHT;this.dpr=1;this.homeRoute={key:'',points:[]};
    this.civilians=CIVILIAN_ROUTES.map(points=>closedRoute(points));
  }
  setMapImage(image){this.mapImage=image;drawMap(this.background.getContext('2d'),image);}
  loadMapArt(ImageClass=globalThis.Image){
    if(!ImageClass)return Promise.resolve(false);
    return new Promise((resolve,reject)=>{const image=new ImageClass();image.onload=()=>{this.setMapImage(image);resolve(true);};image.onerror=()=>reject(new Error('Painted map could not load; the playable fallback is active.'));image.src=ART_URL;});
  }
  resize(width,height,pixelRatio=1){this.cssWidth=Math.max(1,width);this.cssHeight=Math.max(1,height);this.dpr=Math.min(2,pixelRatio||1);this.canvas.width=Math.round(this.cssWidth*this.dpr);this.canvas.height=Math.round(this.cssHeight*this.dpr);this.camera.reset();}
  render(g,time=0,reducedMotion=false,{overview=false,dt=.016}={}){
    const c=this.ctx,w=this.cssWidth,h=this.cssHeight,d=this.dpr,t=reducedMotion?0:time;
    const cam=this.camera.update(g,w/h,reducedMotion ? 1 : dt,overview,w<650),s=w/cam.w;
    c.setTransform(d,0,0,d,0,0);c.fillStyle='#d2cbb0';c.fillRect(0,0,w,h);
    c.setTransform(d*s,0,0,d*s,-cam.x*d*s,-cam.y*d*s);c.drawImage(this.background,0,0);paintAmbient(c,t,g.theme);
    c.save();c.setLineDash([4,5]);c.strokeStyle='#b7f5a6';c.lineWidth=2;c.beginPath();c.arc(SAFE.x,SAFE.y,SAFE.radius-3,0,Math.PI*2);c.stroke();c.restore();text(c,'E · BANK',SAFE.x,SAFE.y-45,9,'#fff7d4');
    if(g.theme==='evening'){c.fillStyle='#e7a34c20';c.fillRect(0,0,WIDTH,HEIGHT);}
    for(let i=0;i<this.civilians.length;i++){
      const route=this.civilians[i];if(!route.length)continue;const step=(t*.6+i*9)%route.length,j=Math.floor(step),f=step-j,a=route[j],b=route[(j+1)%route.length];drawPasserby(c,a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,t,i);
    }
    const showRoofHelp=g.role==='chor'||(g.duo&&!g.online),jumpHelp=showRoofHelp?g.jumpTarget:null;let jumpLabel=null;
    for(const a of ROOF_ACCESS){const active=jumpHelp?.entry===a,pulse=.9+Math.sin(t*3)*.1;
      circle(c,a.ground.x,a.ground.y,(active?19:14)*pulse,'#f6d47a');circle(c,a.ground.x,a.ground.y,10,'#845428');text(c,'↑',a.ground.x,a.ground.y,17,'#fff5d1');
      if(showRoofHelp){box(c,a.ground.x-24,a.ground.y+17,48,15,'#3b503e',4);text(c,'SPACE',a.ground.x,a.ground.y+25,9,'#fff5d1');}
      circle(c,a.roof.x,a.roof.y,9,'#efc663aa');
    }
    if(jumpHelp&&g.phase==='playing'){
      const ready=g.chor.energy>=18&&g.chor.jumpCooldown<=0,b=BUILDINGS.find(b=>b.id===jumpHelp.roofId);
      if(b){c.save();c.strokeStyle=ready?'#ffdf81':'#d3bc91';c.lineWidth=3;c.setLineDash([7,5]);c.strokeRect(b.x*TILE,b.y*TILE,b.w*TILE,b.h*TILE);c.restore();}
      c.save();c.setLineDash([4,5]);line(c,g.chor.x,g.chor.y,jumpHelp.to.x,jumpHelp.to.y,'#ffdd88bb',2);c.restore();
      jumpLabel=!ready?(g.chor.energy<18?'Need 18 energy':'Jump recharging'):jumpHelp.kind==='climb'?'SPACE · CLIMB ROOF':jumpHelp.kind==='leap'?'SPACE · LEAP ROOF':'SPACE · DOWN TO STREET';
    }
    if(g.carried&&(g.role==='chor'||(g.duo&&!g.online))){
      const start=g.chor.layer==='ground'?g.chor:ROOF_ACCESS.find(a=>a.buildingId===g.chor.roofId)?.ground||nearestGround(g.chor);
      const key=`${Math.floor(start.x/TILE)},${Math.floor(start.y/TILE)}`;if(this.homeRoute.key!==key)this.homeRoute={key,points:findPath(start,SAFE)};
      const points=[start,...this.homeRoute.points];c.save();c.lineJoin='round';c.strokeStyle='#386346aa';c.lineWidth=6;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();c.strokeStyle='#f8fdd0';c.lineWidth=2.5;c.setLineDash([3,8]);c.lineDashOffset=-t*15;c.stroke();c.restore();
    }
    for(const p of g.chai){if(p.cooldown>0)continue;circle(c,p.x,p.y,15,p.temporary?'#fff1a5aa':'#e9c77c88');box(c,p.x-6,p.y-7,12,14,'#fff3cf',3);circle(c,p.x,p.y-6,5,'#9e633c');text(c,'+',p.x+10,p.y,12,'#526f43');}
    for(const p of g.boosts.filter(p=>p.active)){circle(c,p.x,p.y,22+Math.sin(t*4)*2,'#b5d77488');circle(c,p.x,p.y,14,'#608f48');text(c,'⚡',p.x,p.y,18,'#ffed99');text(c,'SPRINT',p.x,p.y+27,7);}
    if(g.decoy){const p=g.decoy;circle(c,p.x,p.y,24,'#e2b0a577');drawLoot(c,'radio',p.x,p.y);text(c,'FALSE CALL',p.x,p.y+29,7,'#944e51');for(let i=0;i<2;i++){c.strokeStyle='#9c626c88';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,25+(t*18+i*15)%30,0,Math.PI*2);c.stroke();}}
    g.loot.forEach((l,i)=>{if(l.state!=='ground')return;const bob=Math.sin(t*3+i)*2;shadow(c,l.x,l.y+12,17,7);circle(c,l.x,l.y,25,'#fff3cfb0');c.strokeStyle=l.color;c.lineWidth=2;c.beginPath();c.arc(l.x,l.y,24,0,Math.PI*2);c.stroke();drawLoot(c,l.id,l.x,l.y+bob);box(c,l.x-8,l.y-42,16,15,'#314d3e',4);text(c,String(i+1),l.x,l.y-34,9,'#fff5cc');});
    for(const r of g.rings){c.globalAlpha=Math.max(0,r.life/r.total)*.6;c.strokeStyle=r.color;c.lineWidth=2;c.beginPath();c.arc(r.x,r.y,r.r,0,Math.PI*2);c.stroke();}c.globalAlpha=1;
    for(const car of g.cars){let p=car;if(g.phase==='ready'){const route=car.route,step=(t*1.7+car.initialIndex)%route.length,j=Math.floor(step),f=step-j,a=route[j],b=route[(j+1)%route.length];p={...car,x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,dir:Math.atan2(b.y-a.y,b.x-a.x)};}carSprite(c,p,t);}
    const actors=[g.cop,g.chor].sort((a,b)=>(a.layer==='ground'?0:1)-(b.layer==='ground'?0:1)||a.y-b.y);
    for(const a of actors){
      if(a.kind==='chor'&&g.hidden){if(g.role==='cop'&&(!g.duo||g.online))continue;c.save();c.globalAlpha=.38;drawActor(c,{...a,moving:false},t,'CHAI',g.carried);c.restore();text(c,'INVISIBLE',a.x,a.y-49,8,'#486e45');continue;}
      const jump=a.jump?Math.sin(a.jump.t*Math.PI)*28:0,roof=a.layer==='roof'||a.jump?.targetLayer==='roof'?5:0;
      drawActor(c,{...a,y:a.y-jump-roof},t,g.online?(a.kind===g.role?'YOU':a.kind.toUpperCase()):g.duo?(a.kind==='chor'?'P1':'P2'):a.kind==='chor'?'CHOR':'COP',a.kind==='chor'?g.carried:null);
      if(a.kind==='cop'){box(c,a.x-24,a.y-57,48,13,a.state==='chase'?'#ab664c':'#496c61',4);text(c,a.state.toUpperCase(),a.x,a.y-50,7,'#fff2cd');}
    }
    if(g.netVisual>0){c.save();c.translate(g.cop.x,g.cop.y);c.rotate(g.cop.dir);c.strokeStyle='#506c54aa';c.lineWidth=2;for(let i=-30;i<=30;i+=10){line(c,20,i,85,i*.4,'#506c54aa',1);line(c,25+i*.4,-29,25+i*.4,29,'#506c54aa',1);}c.restore();}
    for(const p of g.particles){c.globalAlpha=Math.max(0,p.life);circle(c,p.x,p.y,2.5,p.color);}c.globalAlpha=1;
    c.setTransform(d,0,0,d,0,0);
    if(jumpLabel){const p=cam.project(g.chor,w),bw=Math.min(226,w-24),bx=Math.max(12,Math.min(w-bw-12,p.x-bw/2)),by=Math.max(12,Math.min(h-42,p.y-66));box(c,bx,by,bw,30,'#283f33',6);text(c,jumpLabel,bx+bw/2,by+15,12,'#fff0ba');}
    // Bubbles are screen-sized so dialogue stays legible while zoomed out.
    for(const bubble of g.speech.slice(-2)){
      const who=bubble.who,a=bubble.anchor||(who==='chor'?g.chor:who==='cop'?g.cop:g.loot.find(l=>l.id===who)||{x:336,y:560});
      if((who==='chor'||who===g.carried?.id)&&g.hidden&&g.role==='cop'&&(!g.duo||g.online))continue;
      const p=cam.project(a,w);if(p.x<-30||p.x>w+30||p.y<-30||p.y>h+30)continue;
      const max=Math.min(240,w-36),words=bubble.text.split(' '),lines=[''];c.font='600 11px Arial, sans-serif';
      for(const word of words){const i=lines.length-1,trial=`${lines[i]} ${word}`.trim();if(c.measureText(trial).width>max-22&&lines[i])lines.push(word);else lines[i]=trial;}
      const bw=Math.min(max,Math.max(...lines.map(l=>c.measureText(l).width))+22),bh=lines.length*15+14,bx=Math.max(8,Math.min(w-bw-8,p.x-bw/2)),by=Math.max(78,Math.min(h-bh-30,p.y-75-bh));
      box(c,bx+2,by+3,bw,bh,'#29493622',7);box(c,bx,by,bw,bh,'#fff8df',7);lines.forEach((l,i)=>text(c,l,bx+11,by+14+i*15,11,'#34503f','left',600));
    }
    if(!overview&&g.phase!=='ready')this.minimap(g,cam,w,h);
  }
  minimap(g,cam,w,h){
    const c=this.ctx,mw=w<650?112:150,mh=mw*HEIGHT/WIDTH,x=w-mw-12,y=h-mh-12,s=mw/WIDTH;
    box(c,x-4,y-4,mw+8,mh+8,'#fff4dce8',6);c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='#dfd2ae';c.fillRect(0,0,WIDTH,HEIGHT);
    for(let yy=0;yy<GRID.length;yy++)for(let xx=0;xx<GRID[0].length;xx++)if(GRID[yy][xx])box(c,xx*TILE,yy*TILE,TILE,TILE,'#83917a');
    circle(c,SAFE.x,SAFE.y,28,'#287c4c');g.loot.forEach((l,i)=>{if(l.state!=='ground')return;circle(c,l.x,l.y,24,'#f3bb4e');text(c,String(i+1),l.x,l.y,49,'#304a3a');});
    if(!g.hidden||g.role==='chor'||(g.duo&&!g.online))circle(c,g.chor.x,g.chor.y,26,'#2a523c');circle(c,g.cop.x,g.cop.y,26,'#426f96');
    c.strokeStyle='#fffbd7';c.lineWidth=10;c.strokeRect(cam.x,cam.y,cam.w,cam.h);c.restore();text(c,'M · OVERVIEW',x+mw/2,y-11,8,'#3d5e48');
  }
}

/** The supplied painted level, with a deterministic fallback and ambient overlays. */
import {WIDTH,HEIGHT,GRID,TILE,GROUND_OBSTACLES,SOLID_PROPS,P} from './world.js';
const circle=(c,x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
const line=(c,a,b,color,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();};
export function paintNeighbourhood(c,image=null){
  if(image){c.drawImage(image,0,0,WIDTH,HEIGHT);return;}
  // A usable map is visible even during image decoding or if the asset fails.
  c.fillStyle='#e4d1a4';c.fillRect(0,0,WIDTH,HEIGHT);
  for(let y=0;y<GRID.length;y++)for(let x=0;x<GRID[0].length;x++)if(!GRID[y][x]){c.fillStyle='#bdbaa0';c.fillRect(x*TILE,y*TILE,TILE,TILE);}
  for(const b of [...GROUND_OBSTACLES,...SOLID_PROPS]){c.fillStyle=b.kind==='building'?'#a87958':'#6f8c58';c.strokeStyle='#455f42';c.lineWidth=2;c.beginPath();b.polygon.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();c.stroke();}
}
export function paintAmbient(c,time,theme='morning'){
  // Cooking steam, warm shop bulbs and falling leaves run across the whole scene.
  for(const [xx,yy]of [[378,206],[673,857],[424,202]]){const p=P(xx,yy);for(let i=0;i<3;i++){const f=(time*.3+i/3)%1;c.globalAlpha=(1-f)*.55;circle(c,p.x+Math.sin(f*5)*5,p.y-11-f*24,2+f*5,'#fff7dc');}}c.globalAlpha=1;
  for(const [xx,yy]of [[170,186],[330,177],[570,139],[684,163],[586,816],[702,825],[1351,126]]){const p=P(xx,yy);circle(c,p.x,p.y,2.5,'#ffe49e');const r=3+Math.sin(time*2+xx)*1.3;c.globalAlpha=theme==='evening'?.25:.1;circle(c,p.x,p.y,r*2,'#ffdc7b');}c.globalAlpha=1;
  for(const [xx,yy]of [[1090,362],[1060,399],[124,35],[238,637],[1490,402],[62,666]]){const p=P(xx,yy);for(let i=0;i<3;i++){const f=(time*.09+i*.33+xx*.001)%1,x=p.x+Math.sin(f*7+i)*12,y=p.y+f*40;c.save();c.translate(x,y);c.rotate(f*5);c.fillStyle='#b9bc5a99';c.beginPath();c.ellipse(0,0,3,1.3,0,0,Math.PI*2);c.fill();c.restore();}}
  for(const [xx,yy]of [[612,475],[753,507],[1188,864],[1355,862]]){const p=P(xx,yy),sway=Math.sin(time*1.6+xx)*2;line(c,p,{x:p.x+sway,y:p.y+13},'#ecbb8eaa',3);}
  const x=40+(time*25)%1190,y=55+Math.sin(time*.3)*10;for(let i=0;i<3;i++){const f=Math.sin(time*7+i)*3;line(c,{x:x-i*18-5,y:y+i*6-f},{x:x-i*18,y:y+i*6},'#354c3a',1.5);line(c,{x:x-i*18,y:y+i*6},{x:x-i*18+5,y:y+i*6-f},'#354c3a',1.5);}
}
export function drawPasserby(c,x,y,time,index=0){
  const bob=Math.sin(time*7+index),coat=['#b77c59','#7b8c6b','#9b6271'][index%3];
  c.fillStyle='#253d3333';c.beginPath();c.ellipse(x,y+6,7,3,0,0,Math.PI*2);c.fill();
  c.fillStyle='#4c6151';c.fillRect(x-5,y+2+bob,3,7);c.fillRect(x+2,y+2-bob,3,7);c.fillStyle=coat;c.beginPath();c.roundRect(x-6,y-12,12,17,3);c.fill();circle(c,x,y-17+bob,6,'#cfa377');circle(c,x,y-20+bob,5,'#344b3e');
}

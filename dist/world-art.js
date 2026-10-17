/** Original Canvas neighbourhood art. Solid footprints come from engine.js. */
import {WIDTH,HEIGHT,TILE,COLS,ROWS,GRID,BUILDINGS,SOLID_PROPS,BUSHES,SAFE,STATION} from './engine.js';

const INK='#345342';
function rect(c,x,y,w,h,color,r=0){c.fillStyle=color;c.beginPath();if(r&&c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h);c.fill();}
function stroke(c,x,y,w,h,color='#536a50',r=0,lw=1){c.strokeStyle=color;c.lineWidth=lw;c.beginPath();if(r&&c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h);c.stroke();}
function line(c,x,y,xx,yy,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();}
function circle(c,x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
function label(c,t,x,y,size=9,color=INK,weight=700){c.fillStyle=color;c.font=`${weight} ${size}px Arial, sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(t,x,y);}
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function shadow(c,x,y,w,h,r=4){rect(c,x+6,y+8,w,h,'#2849362b',r);}
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function plant(c,x,y,s=1,flower=false){c.save();c.translate(x,y);c.scale(s,s);ellipse(c,3,6,9,4,'#31553c21');poly(c,[[-7,0],[7,0],[5,10],[-5,10]],'#ba7c58');rect(c,-8,-1,16,4,'#d59c73',2);circle(c,0,-6,8,'#7d9b5d');circle(c,-4,-9,5,'#a6b974');if(flower){circle(c,-3,-11,3,'#f1bd6c');circle(c,5,-6,3,'#ed987a');}c.restore();}
function tree(c,x,y,r=24){
  ellipse(c,x+9,y+12,r+4,r*.65,'#3d633a2a');rect(c,x-3,y-4,6,22,'#8d6948',2);
  for(const [dx,dy,sz,color]of [[7,2,.86,'#527953'],[-8,-1,.88,'#658b59'],[1,-11,.85,'#7b9d62'],[-10,-12,.57,'#92ac6b'],[10,-7,.55,'#85a767']])circle(c,x+dx,y+dy,r*sz,color);
  circle(c,x-12,y-15,4,'#b0c47b');circle(c,x+2,y-22,3,'#c3cf89');line(c,x+1,y+2,x+6,y-6,'#5b7d4e',2);
}
function streetPlate(c,t,x,y,color='#637f68'){
  rect(c,x-t.length*3-9,y-8,t.length*6+18,17,'#f8efd4dd',4);label(c,t,x,y+1,8,color);
}
function tank(c,x,y){ellipse(c,x+3,y+8,17,10,'#294e4033');rect(c,x-13,y-5,26,17,'#415f55',3);ellipse(c,x,y-6,13,7,'#6c897b');ellipse(c,x,y-8,12,6,'#789487');ellipse(c,x,y-8,6,3,'#53756a');line(c,x-12,y+1,x+12,y+1,'#88a295');}
function solar(c,x,y,w=35){rect(c,x+2,y+3,w,22,'#516656',2);rect(c,x,y,w,22,'#d9dec2',2);rect(c,x+2,y+2,w-4,18,'#456d78');for(let i=1;i<4;i++)line(c,x+2+i*(w-4)/4,y+2,x+2+i*(w-4)/4,y+20,'#8daeba');line(c,x+2,y+11,x+w-2,y+11,'#8daeba');}
function awning(c,x,y,w,color){
  rect(c,x,y+3,w,14,'#284b3330',2);
  const n=Math.ceil(w/11),ww=w/n;
  for(let i=0;i<n;i++){rect(c,x+i*ww,y,ww,10,i%2?'#f8e8bc':color);rect(c,x+i*ww,y+8,ww,6,i%2?'#e9d8ad':color,3);}
  line(c,x,y,x+w,y,'#5b7456',1.4);
}
function sign(c,title,x,y,w,color){rect(c,x,y,w,17,color,3);label(c,title,x+w/2,y+9,Math.min(10,(w-8)/title.length*1.62),'#fff1cf');}
function roof(c,b){
  const x=b.x*TILE,y=b.y*TILE,w=b.w*TILE,h=b.h*TILE;
  shadow(c,x,y,w,h,5);rect(c,x-4,y-4,w+8,h+8,'#e5d3ab',5);stroke(c,x-4,y-4,w+8,h+8,'#9b9d7d',5);
  rect(c,x,y,w,h,b.wall,3);rect(c,x,y,w,h-22,b.roof,3);
  rect(c,x+5,y+5,w-10,h-32,'#f8e7bf16',2);stroke(c,x+5,y+5,w-10,h-32,'#304d3a35',2);
  line(c,x+3,y+3,x+w-3,y+3,'#fff2cc88',2);line(c,x+w-2,y+4,x+w-2,y+h-23,'#324e4038',3);
  for(let k=x+22;k<x+w-8;k+=24)line(c,k,y+7,k,y+h-28,'#f6e7c81e');
  const colors={kitchen:'#a65f4f',library:'#58755f',samosa:'#ac7c34',shop:'#477f74',drama:'#995b65',cycle:'#456e83',chai:'#9d713a',home:'#62766f',police:'#355a70'};
  sign(c,b.name,x+6,y+h-22,w-12,colors[b.kind]||INK);
  awning(c,x+9,y+h-3,w-18,{kitchen:'#bd725b',library:'#73977a',samosa:'#e6aa4d',shop:'#5f9b8b',drama:'#b5797f',cycle:'#719cab',chai:'#d79d4a',home:'#7f9d89',police:'#547e8c'}[b.kind]);
  if(b.kind==='kitchen'){
    rect(c,x+15,y+17,29,22,'#66867a',3);rect(c,x+20,y+11,17,13,'#e4d9b8',2);rect(c,x+24,y+5,9,14,'#8a9e8b',2);ellipse(c,x+28,y+4,7,3,'#4e695b');
    for(let i=0;i<3;i++){circle(c,x+77+i*15,y+26,6,'#f3d291');circle(c,x+77+i*15,y+25,3,'#c0834a');}
    line(c,x+64,y+40,x+117,y+40,'#ecd5a5',2);rect(c,x+62,y+39,57,7,'#9d7358',2);
  }else if(b.kind==='library'){
    tank(c,x+26,y+23);solar(c,x+w-56,y+14,40);
    rect(c,x+58,y+13,30,33,'#b2b590',2);for(let i=0;i<5;i++)rect(c,x+61+i*5,y+17,3,20,['#8d6151','#d9bd76','#6c907e','#bd8a5a','#758f94'][i]);
  }else if(b.kind==='samosa'){
    rect(c,x+13,y+16,w-26,52,'#d9b164',4);stroke(c,x+17,y+20,w-34,43,'#9e7f43',3);
    for(let i=0;i<3;i++)poly(c,[[x+40+i*35,y+25],[x+29+i*35,y+49],[x+51+i*35,y+49]],'#f5d38a');
    label(c,'FRESH & VERY LOUD',x+w/2,y+80,7,'#775e35');plant(c,x+w-20,y+80,.75,true);
  }else if(b.kind==='shop'){
    for(let i=0;i<3;i++){rect(c,x+12+i*35,y+14,28,24,['#d7b976','#d49d77','#acc196'][i],3);stroke(c,x+12+i*35,y+14,28,24,'#647e65',3);line(c,x+25+i*35,y+14,x+25+i*35,y+38,'#55745b');}
    rect(c,x+18,y+54,46,29,'#668779',3);for(let i=0;i<4;i++)line(c,x+22,y+59+i*6,x+59,y+59+i*6,'#a9c4a5',2);
    plant(c,x+w-24,y+72,1.1,true);
  }else if(b.kind==='drama'){
    rect(c,x+15,y+12,w-30,h-43,'#714f5e',3);rect(c,x+25,y+17,w-50,h-53,'#e4ba86',2);
    for(let i=0;i<3;i++){rect(c,x+16+i*8,y+13,5,h-44,'#b6767b',2);rect(c,x+w-21-i*8,y+13,5,h-44,'#b6767b',2);}
    label(c,'★',x+w/2,y+31,25,'#926e43');label(c,'GULLY SUPERSTARS',x+w/2,y+52,6,'#886440');
  }else if(b.kind==='cycle'){
    for(let i=0;i<2;i++){const cx=x+30+i*62,cy=y+28;c.strokeStyle='#35574d';c.lineWidth=2;c.beginPath();c.arc(cx-11,cy,10,0,Math.PI*2);c.arc(cx+11,cy,10,0,Math.PI*2);c.stroke();line(c,cx-11,cy,cx,cy-12,'#d6b871',2);line(c,cx,cy-12,cx+11,cy,'#d6b871',2);line(c,cx-11,cy,cx+11,cy,'#d6b871',2);}
    rect(c,x+13,y+57,43,27,'#4b7782',2);for(let i=0;i<4;i++)line(c,x+18,y+62+i*5,x+51,y+62+i*5,'#88a8aa',2);rect(c,x+w-40,y+59,23,26,'#d5c79b',2);label(c,'24/7',x+w-28,y+72,8,'#5a7564');
  }else if(b.kind==='chai'){
    rect(c,x+15,y+10,36,18,'#bd9657',3);for(let i=0;i<3;i++){rect(c,x+20+i*9,y+12,6,10,'#fff0c8',1);circle(c,x+23+i*9,y+13,2,'#986039');}solar(c,x+w-49,y+8,35);label(c,'CHAI • BISCUITS • LIFE ADVICE',x+91,y+17,5.5,'#f7e2b7');
  }else if(b.kind==='home'){
    tank(c,x+24,y+17);solar(c,x+w-45,y+8,32);line(c,x+53,y+10,x+w-59,y+10,'#596c53',1);
    for(let i=0;i<5;i++){const xx=x+60+i*16;poly(c,[[xx,y+10],[xx+10,y+10],[xx+13,y+22],[xx-1,y+22]],['#d69579','#bed0aa','#f0d58d','#7d9da0','#d5b4a7'][i]);}
  }else if(b.kind==='police'){
    rect(c,x+11,y+9,w-22,26,'#426f80',3);label(c,'★',x+w/2,y+21,23,'#f3d481');rect(c,x+11,y+6,11,4,'#e48c76',2);rect(c,x+w-22,y+6,11,4,'#8fc1d0',2);
  }
}
function stall(c,x,y,color,kind='fruit'){
  shadow(c,x-23,y-12,46,26,3);rect(c,x-23,y-12,46,25,'#8e7050',3);rect(c,x-20,y-8,40,18,'#e5c394',2);
  if(kind==='fruit')for(let i=0;i<12;i++)circle(c,x-14+(i%6)*6,y-3+Math.floor(i/6)*7,3,['#dc9a5c','#a8ae65','#eac772'][Math.floor(i/4)]);
  else for(let i=0;i<5;i++){rect(c,x-15+i*7,y-3,5,9,'#fbebc5',1);circle(c,x-12+i*7,y-3,2,'#9d633e');}
  awning(c,x-25,y-22,50,color);circle(c,x-15,y+15,4,'#486047');circle(c,x+15,y+15,4,'#486047');
}
function auto(c,x,y){
  ellipse(c,x+3,y+8,17,32,'#3d5f3833');rect(c,x-16,y-29,32,58,'#2f6d55',8);stroke(c,x-16,y-29,32,58,'#315849',8,1.5);
  rect(c,x-15,y-29,30,25,'#e5be56',7);rect(c,x-11,y-22,22,15,'#2f5651',4);line(c,x-8,y-21,x+4,y-10,'#96b9a3',2);rect(c,x-13,y+2,26,19,'#47846a',3);
  rect(c,x-19,y-12,4,14,'#273f33',2);rect(c,x+15,y-12,4,14,'#273f33',2);rect(c,x-11,y+24,22,4,'#ead39b',2);label(c,'AUTO',x,y+11,6,'#dbe2ad');circle(c,x-11,y-26,2,'#faf1c1');circle(c,x+11,y-26,2,'#faf1c1');
}
function boundary(c){
  rect(c,0,0,WIDTH,25,'#8ea287');rect(c,0,HEIGHT-25,WIDTH,25,'#82977b');rect(c,0,0,25,HEIGHT,'#8ea287');rect(c,WIDTH-25,0,25,HEIGHT,'#82977b');
  for(let x=0;x<WIDTH;x+=32){line(c,x,0,x,25,'#6e8c70');line(c,x,HEIGHT-25,x,HEIGHT,'#637e64');rect(c,x+2,1,27,4,'#b4bf99');}
  for(let y=0;y<HEIGHT;y+=32){line(c,0,y,25,y,'#6e8c70');line(c,WIDTH-25,y,WIDTH,y,'#637e64');}
  line(c,26,26,934,26,'#f3e6c7',3);line(c,26,HEIGHT-27,934,HEIGHT-27,'#f3e6c7',3);
}
function street(c){
  rect(c,0,0,WIDTH,HEIGHT,'#e4d7b5');
  for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++){
    if(GRID[y][x])continue;const v=(x*17+y*29)%5;
    rect(c,x*TILE,y*TILE,TILE,TILE,['#e9dfc4','#e6dcbf','#ecdfc1','#e7d9ba','#e7ddc1'][v]);
    line(c,x*TILE,y*TILE,x*TILE+32,y*TILE,'#cbbd9a40');line(c,x*TILE,y*TILE,x*TILE,y*TILE+32,'#cbbd9a40');
  }
  // The warm pavement and cooler asphalt make every route legible.
  for(const x of [272,560]){rect(c,x-5,30,90,580,'#83917e',3);rect(c,x-2,30,84,580,'#f8edcc');rect(c,x+2,30,76,580,'#b8c0b0');for(let y=42;y<602;y+=43)rect(c,x+38,y,3,17,'#ecedcf',1);}
  for(const y of [224,448]){rect(c,30,y-5,900,74,'#83917e',3);rect(c,30,y-2,900,68,'#f8edcc');rect(c,30,y+2,900,60,'#b8c0b0');for(let x=48;x<923;x+=45)rect(c,x,y+30,17,3,'#ecedcf',1);}
  // Road edges have drain gratings and occasional patched asphalt.
  for(const [x,y]of [[278,118],[624,360],[396,454],[780,279],[60,227],[660,509]]){rect(c,x,y,15,6,'#8c9b87',1);for(let i=2;i<15;i+=4)line(c,x+i,y+1,x+i,y+5,'#c6d0b7');}
  for(const [x,y]of [[305,335],[589,562],[706,480],[391,254]]){line(c,x,y,x+9,y+5,'#a3af9c');line(c,x+9,y+5,x+5,y+11,'#a3af9c');}
  for(const [x,y]of [[276,298],[564,416]])for(let i=0;i<6;i++)rect(c,x+i*12,y,7,21,'#f4edcf',1);
}

export function paintNeighbourhood(c){
  street(c);
  // Courtyards form distinct districts, with a tiny shaded park in the east.
  rect(c,640,288,62,154,'#a9bd8a',7);stroke(c,640,288,62,154,'#7f9e6c',7);
  rect(c,672,289,28,151,'#d9cca7',3);for(let y=300;y<438;y+=16)line(c,674,y,697,y,'#c0b28e');
  rect(c,642,372,22,6,'#9d7e51',2);rect(c,642,382,22,6,'#9d7e51',2);line(c,647,371,647,390,INK,2);line(c,659,371,659,390,INK,2);
  for(let i=0;i<7;i++){circle(c,648+(i%2)*11,404+Math.floor(i/2)*8,3,['#ecd096','#e59d7e','#f6e2bb'][i%3]);}
  c.save();c.translate(687,370);c.rotate(-Math.PI/2);label(c,'NIMBU PARK',0,0,7,'#607d53');c.restore();
  // Exposed brick at the foot of each block adds depth without covering a lane.
  for(const b of BUILDINGS)roof(c,b);
  for(const b of BUSHES){rect(c,b.x-3,b.y+1,b.w+6,b.h+5,'#6b875540',8);rect(c,b.x,b.y+5,b.w,b.h-5,'#b8b895',7);for(let xx=0;xx<b.w;xx+=13){circle(c,b.x+xx+6,b.y+b.h/2,12,xx%26?'#75965e':'#94ae70');circle(c,b.x+xx+2,b.y+b.h/2-5,4,'#b2c581');}}
  for(const p of SOLID_PROPS){const x=(p.x+p.w/2)*TILE,y=(p.y+p.h/2)*TILE;if(p.kind==='tree'){rect(c,p.x*TILE,p.y*TILE,32,32,'#b9b59a',6);stroke(c,p.x*TILE,p.y*TILE,32,32,'#8d9b75',6);tree(c,x,y-3,23);}else if(p.kind==='cart'){stall(c,x,y,'#88a073');}else{stroke(c,p.x*TILE-3,p.y*TILE-3,p.w*TILE+6,p.h*TILE+6,'#eef0d3',6);auto(c,x,y);}}
  // The safehouse is a high-contrast, walkable delivery courtyard.
  shadow(c,36,515,90,84,10);rect(c,36,515,90,84,'#3d785d',10);stroke(c,36,515,90,84,'#285641',10,2);
  rect(c,43,522,76,70,'#73a075',7);c.setLineDash([5,4]);stroke(c,47,527,68,60,'#d8edb3',5,2);c.setLineDash([]);
  label(c,'⌂',SAFE.x,SAFE.y-13,31,'#f3f0c9');label(c,'SAFEHOUSE',SAFE.x,SAFE.y+14,9,'#fff4ce');label(c,'E TO BANK',SAFE.x,SAFE.y+28,7,'#edf0c4');
  rect(c,38,502,85,15,'#f5d277',3);label(c,'BRING THE MAAL HOME',80,510,6.5,'#365844');
  for(let i=0;i<3;i++){line(c,138+i*10,549,132+i*10,555,'#73996c',2);line(c,132+i*10,555,138+i*10,561,'#73996c',2);}
  // Police spawn stays in front of its building, clear of the HUD and doors.
  rect(c,833,141,88,61,'#cad8cb',6);stroke(c,833,141,88,61,'#7f9c91',6);c.setLineDash([4,4]);stroke(c,842,148,70,47,'#eff3d6',4);c.setLineDash([]);label(c,'CHOWKI',STATION.x,192,7,'#4a6e65');
  streetPlate(c,'BAZAAR LANE',454,257);streetPlate(c,'CHUTNEY CHOWK',756,482);streetPlate(c,'CHAI GULLY',216,480);
  // Useful direction markings are painted on the ground rather than floating UI.
  label(c,'N',906,566,9,'#607f67');line(c,906,578,906,595,'#607f67',2);poly(c,[[906,571],[902,581],[910,581]],'#607f67');label(c,'GULLY NO. 04',472,64,12,'#7e8e72');label(c,'GOOD NEIGHBOURS. QUESTIONABLE LOOT.',472,79,5.5,'#8f9e7d');
  // Local details: rangoli, rooftop bunting, a carrom board, and tulsi pots.
  for(let i=0;i<8;i++){const a=i*Math.PI/4;line(c,496,290,496+Math.cos(a)*15,290+Math.sin(a)*15,'#fcf4d7',2);}circle(c,496,290,3,'#dc9b6a');
  rect(c,230,347,19,19,'#b98958',2);rect(c,233,350,13,13,'#ead399',1);circle(c,240,357,3,'#9b6443');circle(c,236,353,1,'#f6edd2');
  for(const [x,y,s]of [[85,174,.7],[336,365,.7],[685,155,.8],[799,531,.8],[518,350,.65],[154,437,.7],[538,575,.7]])plant(c,x,y,s,true);
  line(c,264,205,353,205,'#6d8060',1);for(let i=0;i<7;i++)poly(c,[[269+i*12,205],[278+i*12,205],[273.5+i*12,216]],['#eab46e','#87a88c','#d2937a'][i%3]);
  boundary(c);
}

export function drawPasserby(c,x,y,time,index=0){
  const bob=Math.sin(time*7+index)*1.2,coat=['#bd9270','#8e9b8c','#ac827f'][index%3];
  ellipse(c,x+1,y+7,8,3,'#31553b22');rect(c,x-5,y+1+bob,4,7,'#74816a',2);rect(c,x+1,y+1-bob,4,7,'#74816a',2);
  rect(c,x-7,y-12,14,17,coat,4);circle(c,x,y-18+bob,7,'#d5b58a');rect(c,x-6,y-25+bob,12,5,'#6b7461',3);rect(c,x+6,y-7,5,10,'#d8c99e',2);
}

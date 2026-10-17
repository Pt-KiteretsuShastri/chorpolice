/** Shared road expansion keeps the painted streets, solids and navigation aligned. */
export const TILE=32,COLS=52,ROWS=34,WIDTH=COLS*TILE,HEIGHT=ROWS*TILE;
export const MAP_VERSION='painted-gully-3';
export const ART_URL=new URL('./assets/neighbourhood.webp',import.meta.url).href;
// Extra space is allocated to streets, rather than uniformly enlarging houses.
const expand=(n,bands)=>bands.reduce((extra,[start,end,amount])=>extra+Math.max(0,Math.min(1,(n-start)/(end-start)))*amount,0);
const X_BANDS=[[430,530,80],[817,950,72],[1310,1390,40]],Y_BANDS=[[280,350,40],[635,715,56],[940,1000,32]];
export const ART_X=[0,...X_BANDS.flatMap(([a,b])=>[a,b]),1536];
export const ART_Y=[0,...Y_BANDS.flatMap(([a,b])=>[a,b]),1024];
export const P=(x,y)=>({x:x*1472/1536+expand(x,X_BANDS),y:y*960/1024+expand(y,Y_BANDS)});
// A diagonal edge can cross multiple stretch bands. Split it at every seam so
// the collision outline follows the same piecewise transform as the artwork.
const polygon=points=>points.flatMap(([x,y],i)=>{const [xx,yy]=points[(i+1)%points.length],ts=[0];
  for(const k of ART_X)if(xx!==x){const t=(k-x)/(xx-x);if(t>0&&t<1)ts.push(t);}
  for(const k of ART_Y)if(yy!==y){const t=(k-y)/(yy-y);if(t>0&&t<1)ts.push(t);}
  return [...new Set(ts)].sort((a,b)=>a-b).map(t=>P(x+(xx-x)*t,y+(yy-y)*t));});
const block=(id,kind,points)=>({id,kind,polygon:polygon(points)});
const rectangle=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const terrace=(id,name,x,y,w,h,kind='home')=>{const a=P(x,y),b=P(x+w,y+h);return{id,name,kind,x:a.x/TILE,y:a.y/TILE,w:(b.x-a.x)/TILE,h:(b.y-a.y)/TILE};};
export const SAFE={...P(288,916),radius:40};
export const CHOR_SPAWN=P(288,885);
export const STATION=P(1415,254);
export const BUILDINGS=[
  terrace('bazaar-west','BAZAAR TERRACE',152,48,124,77,'shop'),
  terrace('bazaar-east','BAZAAR ROOFS',330,18,146,84,'kitchen'),
  terrace('bazaar-radio','RADIO TERRACE',669,45,141,67,'radio'),
  terrace('west-home','GULLY HOME',224,354,151,72),
  terrace('central-home','CENTRAL TERRACE',676,365,122,91),
  terrace('central-west','TANK TERRACE',560,465,110,80),
  terrace('chai','CHAI ROOF',570,726,150,61,'chai'),
  terrace('radio-home','RADIO HOME',812,748,124,101),
  terrace('east-home','EAST TERRACE',1288,673,182,108),
  terrace('lower-home','SOLAR TERRACE',1112,797,106,92),
  terrace('police','POLICE CHOWKI',1280,22,208,89,'police')
];
BUILDINGS.find(b=>b.id==='police').climbable=false;
// Building footprints include façades. Courtyard walls have deliberate openings.
export const GROUND_OBSTACLES=[
  block('bazaar','building',[[116,0],[838,0],[847,150],[828,233],[727,268],[539,294],[346,284],[201,265],[124,223]]),
  block('north-garden','garden',[[969,0],[1254,0],[1238,145],[1189,235],[1110,249],[986,185]]),
  block('police-building','building',[[1243,0],[1536,0],[1536,192],[1455,221],[1302,211],[1232,177]]),
  block('far-west','building',[[0,93],[69,116],[91,234],[43,274],[0,254]]),
  block('west-edge-home','building',[[0,355],[91,355],[102,492],[179,537],[160,581],[0,541]]),
  block('west-home','building',[[203,335],[309,311],[428,368],[435,520],[380,550],[205,530],[182,450]]),
  block('central-home','building',[[560,351],[794,327],[817,455],[821,544],[786,648],[547,630],[520,547],[530,443]]),
  block('east-edge-home','building',[[1392,411],[1536,424],[1536,611],[1452,638],[1383,567]]),
  block('safe-roof','building',[[172,702],[439,652],[463,821],[430,855],[198,848]]),
  block('safe-garden','garden',[[0,546],[170,567],[209,635],[184,827],[0,897]]),
  block('safe-west-wall','wall',rectangle(197,818,35,163)),
  block('safe-east-wall','wall',[[420,820],[454,813],[458,944],[426,978],[413,939]]),
  block('safe-front-left','wall',rectangle(224,932,34,42)),
  block('safe-front-right','wall',[[320,937],[419,948],[414,987],[315,971]]),
  block('chai','building',[[555,714],[757,714],[789,846],[754,909],[559,914],[539,843]]),
  block('southern-homes','building',[[833,711],[941,669],[1027,678],[1120,700],[1228,648],[1394,624],[1536,640],[1536,1024],[838,1024],[781,973],[788,873]]),
  block('park-north-wall','wall',[[921,267],[1295,338],[1300,374],[938,302]]),
  block('park-west-wall','wall',[[917,290],[949,305],[956,516],[1007,549],[993,580],[925,544]]),
  block('park-east-wall','wall',[[1290,365],[1323,374],[1343,565],[1312,577]]),
  block('park-south-west-wall','wall',[[992,546],[1172,603],[1169,638],[982,579]]),
  block('park-south-east-wall','wall',[[1250,604],[1338,561],[1344,598],[1261,642]])
];
export const SOLID_PROPS=[
  block('banyan','banyan',[[1002,393],[1120,394],[1150,500],[1080,542],[1007,497]]),
  block('red-scooter','scooter',[[796,549],[849,542],[865,577],[808,590]]),
  block('blue-scooter','scooter',[[782,606],[826,599],[858,649],[814,663]]),
  block('fruit-cart','cart',rectangle(449,229,70,43)),
  block('west-tree','tree',[[0,281],[57,277],[81,320],[49,358],[0,350]])
];
export const BUSHES=[{...P(856,358),w:22,h:32},{...P(1174,475),w:35,h:28},{...P(477,749),w:27,h:31}];
export const TEA_SPOTS=[{id:'west-seat',...P(583,948)},{id:'east-seat',...P(710,964)}];
export const CHAI_SPOTS=[P(471,682),P(893,325),P(1368,606)];
const slot=(x,y,district)=>({...P(x,y),district});
export const SPAWN_CANDIDATES=[
  slot(322,300,'bazaar'),slot(365,318,'bazaar'),slot(610,323,'bazaar'),slot(760,287,'bazaar'),
  slot(889,125,'chowk'),slot(909,230,'chowk'),slot(1128,280,'chowk'),slot(1300,302,'chowk'),
  slot(1241,536,'park'),slot(1213,581,'park'),slot(1161,557,'park'),slot(982,424,'park'),
  slot(300,594,'gullies'),slot(455,459,'gullies'),slot(475,568,'gullies'),slot(863,498,'gullies'),
  slot(888,652,'homes'),slot(1018,638,'homes'),slot(740,686,'homes'),slot(503,883,'homes')
];
export const ROOF_ACCESS=[
  ['bazaar-west',P(322,300),P(201,102)],['bazaar-east',P(385,321),P(400,77)],['bazaar-radio',P(752,296),P(730,85)],
  ['west-home',P(318,581),P(297,395)],['central-home',P(854,432),P(749,425)],['central-west',P(503,519),P(611,510)],
  ['chai',P(525,811),P(609,762)],['radio-home',P(799,704),P(855,816)],['east-home',P(1397,606),P(1393,746)],['lower-home',P(1061,665),P(1164,848)]
].map(([buildingId,ground,roof])=>({buildingId,ground,roof}));
export const PATROL=[STATION,P(1178,295),P(893,285),P(542,340),P(481,540),P(487,695),P(482,950),P(289,1000),P(483,954),P(878,666),P(1368,606),P(1369,388)];
export const CAR_WAYPOINTS=[
  [STATION,P(1167,293),P(886,278),P(536,355),P(477,578),P(486,690),P(878,666),P(1368,606),P(1381,383)],
  [P(1275,293),P(896,285),P(874,466),P(885,670),P(486,699),P(479,951),P(485,704),P(878,666),P(1368,606),P(1381,385)]
];
export const CIVILIAN_ROUTES=[[P(201,293),P(418,332)],[P(456,408),P(475,626)],[P(1185,565),P(1275,526)],[P(487,725),P(483,958)]];
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function pointInPolygon(x,y,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
function edgeDistance(x,y,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(x-a.x-t*dx,y-a.y-t*dy);}
const SOLIDS=[...GROUND_OBSTACLES,...SOLID_PROPS].map(b=>({...b,minX:Math.min(...b.polygon.map(p=>p.x)),maxX:Math.max(...b.polygon.map(p=>p.x)),minY:Math.min(...b.polygon.map(p=>p.y)),maxY:Math.max(...b.polygon.map(p=>p.y))}));
export function walkable(x,y,r=10){
  if(!Number.isFinite(x)||!Number.isFinite(y)||x-r<0||y-r<0||x+r>WIDTH||y+r>HEIGHT)return false;
  for(const b of SOLIDS){if(x+r<b.minX||x-r>b.maxX||y+r<b.minY||y-r>b.maxY)continue;const p=b.polygon;if(pointInPolygon(x,y,p))return false;for(let i=0;i<p.length;i++)if(edgeDistance(x,y,p[i],p[(i+1)%p.length])<r)return false;}
  return true;
}
/** Sweep in short steps, stop at contact, then project motion along the wall.
 * This handles painted sloping façades without axis-order sticking or teleporting.
 */
export function moveGround(a,dx,dy,r=10){
  if(!walkable(a.x,a.y,r)||!Number.isFinite(dx)||!Number.isFinite(dy))return false;
  const start={x:a.x,y:a.y},steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/2));
  for(let step=0;step<steps;step++){
    const vx=dx/steps,vy=dy/steps;
    if(walkable(a.x+vx,a.y+vy,r)){a.x+=vx;a.y+=vy;continue;}
    let lo=0,hi=1;for(let j=0;j<10;j++){const t=(lo+hi)/2;if(walkable(a.x+vx*t,a.y+vy*t,r))lo=t;else hi=t;}
    a.x+=vx*lo;a.y+=vy*lo;
    const rx=vx*(1-lo),ry=vy*(1-lo),range=r+Math.hypot(rx,ry)+.1,normals=[];
    for(const b of SOLIDS){if(a.x+range<b.minX||a.x-range>b.maxX||a.y+range<b.minY||a.y-range>b.maxY)continue;
      const p=b.polygon;for(let i=0;i<p.length;i++){const u=p[i],v=p[(i+1)%p.length],ex=v.x-u.x,ey=v.y-u.y,t=clamp(((a.x-u.x)*ex+(a.y-u.y)*ey)/(ex*ex+ey*ey||1),0,1),nx=a.x-u.x-ex*t,ny=a.y-u.y-ey*t,d=Math.hypot(nx,ny);if(d>0&&d<range)normals.push({x:nx/d,y:ny/d});}}
    if(a.x-r<range-r)normals.push({x:1,y:0});if(WIDTH-a.x-r<range-r)normals.push({x:-1,y:0});
    if(a.y-r<range-r)normals.push({x:0,y:1});if(HEIGHT-a.y-r<range-r)normals.push({x:0,y:-1});
    let best=null,bestProgress=0;
    for(const n of normals){const into=rx*n.x+ry*n.y;if(into>=0)continue;const x=rx-into*n.x,y=ry-into*n.y,progress=x*rx+y*ry;
      if(progress>bestProgress&&walkable(a.x+x,a.y+y,r)){best={x,y};bestProgress=progress;}}
    if(best){a.x+=best.x;a.y+=best.y;}
  }
  return distance(a,start)>.00001;
}
export function buildGrid(){return Array.from({length:ROWS},(_,y)=>Array.from({length:COLS},(_,x)=>walkable((x+.5)*TILE,(y+.5)*TILE,12)?0:1));}
export const GRID=buildGrid();
export function roofAt(x,y,r=10){return BUILDINGS.find(b=>b.climbable!==false&&x-r>=b.x*TILE+3&&x+r<=(b.x+b.w)*TILE-3&&y-r>=b.y*TILE+3&&y+r<=(b.y+b.h)*TILE-3);}
export function roofTarget(a,b,forward=80){return{x:clamp(a.x+Math.cos(a.dir)*forward,b.x*TILE+16,(b.x+b.w)*TILE-16),y:clamp(a.y+Math.sin(a.dir)*forward,b.y*TILE+16,(b.y+b.h)*TILE-16)};}
export function lineOfSight(a,b){const n=Math.ceil(distance(a,b)/8);for(let i=1;i<n;i++){const f=i/n;if(!walkable(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,0))return false;}return true;}
function edgeClear(a,b){for(let i=1;i<4;i++)if(!walkable(a.x+(b.x-a.x)*i/4,a.y+(b.y-a.y)*i/4,11))return false;return true;}
export const NAV_TILE=8,NAV_COLS=WIDTH/NAV_TILE,NAV_ROWS=HEIGHT/NAV_TILE;
const navPoint=(x,y)=>({x:(x+.5)*NAV_TILE,y:(y+.5)*NAV_TILE});
export const NAV_GRID=Array.from({length:NAV_ROWS},(_,y)=>Array.from({length:NAV_COLS},(_,x)=>walkable((x+.5)*NAV_TILE,(y+.5)*NAV_TILE,11)?0:1));
const EDGES=new Map();
function neighbors(k){if(EDGES.has(k))return EDGES.get(k);const x=k%NAV_COLS,y=Math.floor(k/NAV_COLS),a=navPoint(x,y),out=[];for(const [dx,dy]of [[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[-1,-1],[1,-1]]){const xx=x+dx,yy=y+dy;if(NAV_GRID[yy]?.[xx]===0&&edgeClear(a,navPoint(xx,yy)))out.push(yy*NAV_COLS+xx);}EDGES.set(k,out);return out;}
function nearestNode(p){const cell={x:Math.floor(p.x/NAV_TILE),y:Math.floor(p.y/NAV_TILE)};if(NAV_GRID[cell.y]?.[cell.x]===0&&edgeClear(p,navPoint(cell.x,cell.y)))return cell;let best=null,bestD=40;for(let y=Math.max(0,cell.y-3);y<=Math.min(NAV_ROWS-1,cell.y+3);y++)for(let x=Math.max(0,cell.x-3);x<=Math.min(NAV_COLS-1,cell.x+3);x++){const q=navPoint(x,y),d=distance(p,q);if(!NAV_GRID[y][x]&&d<bestD&&edgeClear(p,q)){best={x,y};bestD=d;}}return best;}
const PATH_CACHE=new Map();
export function findPath(from,to){
  if(!walkable(from.x,from.y,9)||!walkable(to.x,to.y,9))return [];
  const s=nearestNode(from),t=nearestNode(to);if(!s||!t)return [];
  const start=s.y*NAV_COLS+s.x,goal=t.y*NAV_COLS+t.x,key=`${start}:${goal}`;
  let core=PATH_CACHE.get(key);
  if(!core){const queue=[start],prev=new Map([[start,-1]]);
  for(let i=0;i<queue.length&&!prev.has(goal);i++)for(const k of neighbors(queue[i]))if(!prev.has(k)){prev.set(k,queue[i]);queue.push(k);}
  if(!prev.has(goal))return [];
  core=[];for(let k=goal;k!==-1;k=prev.get(k))core.push(navPoint(k%NAV_COLS,Math.floor(k/NAV_COLS)));core.reverse();if(PATH_CACHE.size>12000)PATH_CACHE.clear();PATH_CACHE.set(key,core);}
  const result=core.slice();if(distance(from,result[0])<3)result.shift();if(!result.length||distance(result.at(-1),to)>2)result.push({x:to.x,y:to.y});return result;
}
export function pathDistance(from,to){const path=findPath(from,to);return path.reduce((sum,p,i)=>sum+distance(i?path[i-1]:from,p),0);}
export function nearestGround(p){const points=[];for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(!GRID[y][x])points.push({x:(x+.5)*TILE,y:(y+.5)*TILE});points.sort((a,b)=>distance(a,p)-distance(b,p));return points.find(q=>findPath(SAFE,q).length)||{...SAFE};}
export function closedRoute(waypoints){const result=[];for(let i=0;i<waypoints.length;i++){const start=waypoints[i],leg=[start,...findPath(start,waypoints[(i+1)%waypoints.length])];for(const p of leg)if(!result.length||distance(result.at(-1),p)>.01)result.push({...p});}if(result.length>1&&distance(result[0],result.at(-1))<.01)result.pop();return result;}

/** One geometry source for illustration, physics, rooftop access and navigation. */
export const TILE=32,COLS=40,ROWS=26,WIDTH=COLS*TILE,HEIGHT=ROWS*TILE;
export const SAFE={x:80,y:752,radius:50};
export const STATION={x:1168,y:208};
export const ROADS=[{x:9,y:1,w:3,h:24},{x:24,y:1,w:3,h:24},{x:1,y:7,w:38,h:3},{x:1,y:16,w:38,h:3}];
export const PARK={x:28,y:10,w:5,h:6};
export const BUILDINGS=[
  {id:'kitchen',x:3,y:3,w:5,h:3,roof:'#bc7659',wall:'#e8bb88',name:'SEETI KITCHEN',kind:'kitchen'},
  {id:'library',x:13,y:3,w:5,h:3,roof:'#75917b',wall:'#d7d0a6',name:'GULLY LIBRARY',kind:'library'},
  {id:'samosa',x:19,y:3,w:4,h:4,roof:'#c69849',wall:'#ebcd89',name:'SAMOSA CORNER',kind:'samosa'},
  {id:'radio',x:28,y:3,w:4,h:3,roof:'#b07872',wall:'#dab2a0',name:'BOL BACHCHAN RADIO',kind:'radio'},
  {id:'police',x:33,y:2,w:5,h:3,roof:'#487d8d',wall:'#adc9c8',name:'POLICE CHOWKI',kind:'police',climbable:false},
  {id:'general',x:3,y:11,w:5,h:4,roof:'#67968a',wall:'#b8cfb6',name:'GUPTA GENERAL',kind:'shop'},
  {id:'drama',x:14,y:11,w:7,h:4,roof:'#b17676',wall:'#e0b797',name:'GULLY DRAMA CLUB',kind:'drama'},
  {id:'cycle',x:35,y:11,w:3,h:4,roof:'#70939b',wall:'#bdd1c6',name:'CYCLE REPAIR',kind:'cycle'},
  {id:'chai',x:12,y:21,w:5,h:3,roof:'#aa8450',wall:'#dfbc80',name:'CHAI & GOSSIP',kind:'chai'},
  {id:'sharma',x:20,y:21,w:5,h:3,roof:'#b09c7e',wall:'#dcc7a0',name:'SHARMA NIWAS',kind:'home'},
  {id:'textile',x:28,y:21,w:4,h:3,roof:'#7c9a90',wall:'#c8d5b5',name:'RANGREZ TEXTILES',kind:'textile'},
  {id:'mehta',x:34,y:21,w:4,h:3,roof:'#c48d61',wall:'#e6c291',name:'MEHTA NIWAS',kind:'home'}
];
export const SOLID_PROPS=[
  {x:13,y:6,w:2,h:1,kind:'cart'},
  {x:38,y:12,w:1,h:2,kind:'auto'},
  {x:29,y:12,w:2,h:2,kind:'banyan'},
  {x:1,y:10,w:1,h:1,kind:'tree'},
  {x:7,y:1,w:1,h:1,kind:'tree'},
  {x:22,y:10,w:1,h:1,kind:'tree'},
  {x:33,y:24,w:1,h:1,kind:'tree'},
  {x:5,y:24,w:1,h:1,kind:'tree'},
  {x:32,y:11,w:1,h:1,kind:'scooter'}
];
export const BUSHES=[{x:256,y:332,w:48,h:30},{x:704,y:464,w:58,h:31},{x:1072,y:332,w:45,h:32},{x:192,y:656,w:64,h:31}];
export const TEA_SPOTS=[{id:'west-seat',x:368,y:720},{id:'east-seat',x:560,y:752}];
export const CHAI_SPOTS=[{x:336,y:560},{x:816,y:304},{x:1104,y:592}];
const point=(x,y,district)=>({x:(x+.5)*TILE,y:(y+.5)*TILE,district});
export const SPAWN_CANDIDATES=[
  point(5,6,'bazaar'),point(15,7,'bazaar'),point(21,8,'bazaar'),point(12,10,'bazaar'),
  point(28,6,'radio'),point(31,8,'radio'),point(34,9,'radio'),point(37,7,'radio'),
  point(27,12,'park'),point(32,14,'park'),point(34,15,'park'),point(33,11,'park'),
  point(13,15,'theatre'),point(20,15,'theatre'),point(22,11,'theatre'),point(8,13,'theatre'),
  point(18,20,'homes'),point(27,22,'homes'),point(32,24,'homes'),point(8,20,'homes')
];
export const PATROL=[point(36,8),point(25,8),point(10,8),point(10,17),point(3,20),point(10,17),point(25,17),point(36,17),STATION];
export const CAR_WAYPOINTS=[
  [STATION,point(36,8),point(25,8),point(10,8),point(10,17),point(25,17),point(36,17)],
  [point(34,6),point(25,8),point(25,17),point(10,17),point(10,8),point(36,8)]
];
export const ROOF_ACCESS=BUILDINGS.filter(b=>b.climbable!==false).map(b=>({
  buildingId:b.id,
  ground:{x:(b.x+Math.floor(b.w/2)+.5)*TILE,y:(b.y+b.h+.5)*TILE},
  roof:{x:(b.x+Math.floor(b.w/2)+.5)*TILE,y:(b.y+b.h-.5)*TILE}
}));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function buildGrid(){
  const grid=Array.from({length:ROWS},(_,y)=>Array.from({length:COLS},(_,x)=>x===0||y===0||x===COLS-1||y===ROWS-1?1:0));
  for(const b of [...BUILDINGS,...SOLID_PROPS])for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)grid[y][x]=1;
  return grid;
}
export const GRID=buildGrid();
export function walkable(x,y,r=10){
  if(!Number.isFinite(x)||!Number.isFinite(y))return false;
  for(const [dx,dy]of [[-r,-r],[r,-r],[-r,r],[r,r]])if(GRID[Math.floor((y+dy)/TILE)]?.[Math.floor((x+dx)/TILE)]!==0)return false;
  return true;
}
export function roofAt(x,y,r=10){return BUILDINGS.find(b=>b.climbable!==false&&x-r>=b.x*TILE+3&&x+r<=(b.x+b.w)*TILE-3&&y-r>=b.y*TILE+3&&y+r<=(b.y+b.h)*TILE-3);}
export function findPath(from,to){
  const sx=Math.floor(from.x/TILE),sy=Math.floor(from.y/TILE),tx=Math.floor(to.x/TILE),ty=Math.floor(to.y/TILE);
  if(GRID[sy]?.[sx]!==0||GRID[ty]?.[tx]!==0)return [];
  const start=sy*COLS+sx,goal=ty*COLS+tx,queue=[start],prev=new Map([[start,-1]]);
  for(let i=0;i<queue.length&&!prev.has(goal);i++){
    const q=queue[i],x=q%COLS,y=Math.floor(q/COLS);
    for(const [dx,dy]of [[1,0],[0,1],[-1,0],[0,-1]]){const xx=x+dx,yy=y+dy,k=yy*COLS+xx;if(GRID[yy]?.[xx]===0&&!prev.has(k)){prev.set(k,q);queue.push(k);}}
  }
  if(!prev.has(goal))return [];
  const result=[];for(let k=goal;k!==-1;k=prev.get(k))result.push({x:(k%COLS+.5)*TILE,y:(Math.floor(k/COLS)+.5)*TILE});
  result.reverse();if(result.length>1&&distance(from,result[0])<3)result.shift();return result;
}
export function lineOfSight(a,b){const n=Math.ceil(distance(a,b)/10);for(let i=1;i<n;i++){const f=i/n;if(GRID[Math.floor((a.y+(b.y-a.y)*f)/TILE)]?.[Math.floor((a.x+(b.x-a.x)*f)/TILE)]!==0)return false;}return true;}
export function nearestGround(p){
  const candidates=[];for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++)if(GRID[y][x]===0)candidates.push({x:(x+.5)*TILE,y:(y+.5)*TILE});
  candidates.sort((a,b)=>distance(a,p)-distance(b,p));return candidates[0]||{...SAFE};
}
export function closedRoute(waypoints){
  const result=[];
  for(let i=0;i<waypoints.length;i++){
    const start=waypoints[i],leg=[{x:(Math.floor(start.x/TILE)+.5)*TILE,y:(Math.floor(start.y/TILE)+.5)*TILE},...findPath(start,waypoints[(i+1)%waypoints.length])];
    for(const p of leg)if(!result.length||distance(result.at(-1),p)>.01)result.push(p);
  }
  if(result.length>1&&distance(result[0],result.at(-1))<.01)result.pop();
  return result;
}

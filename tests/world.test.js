import {test} from 'node:test';import assert from 'node:assert/strict';
import {GRID,COLS,ROWS,TILE,WIDTH,HEIGHT,SAFE,STATION,BUILDINGS,SOLID_PROPS,SPAWN_CANDIDATES,CHAI_SPOTS,TEA_SPOTS,ROOF_ACCESS,PATROL,CAR_WAYPOINTS,walkable,findPath,distance,closedRoute,roofAt} from '../dist/world.js';
import {makeRound} from '../dist/engine.js';import {randomFrom,shuffled} from '../dist/random.js';

test('40 × 26 world: every street tile connects to home and every objective is reachable',()=>{
  assert.equal(WIDTH,1280);assert.equal(HEIGHT,832);assert.equal(TILE,32);let streets=0;
  for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++)if(!GRID[y][x]){streets++;assert.ok(findPath(SAFE,{x:(x+.5)*TILE,y:(y+.5)*TILE}).length,`Unreachable ${x},${y}`);}
  assert.ok(streets>650);assert.ok(SPAWN_CANDIDATES.length>=12);
  for(const p of [SAFE,STATION,...SPAWN_CANDIDATES,...CHAI_SPOTS,...TEA_SPOTS,...PATROL,...ROOF_ACCESS.map(a=>a.ground)]){assert.ok(walkable(p.x,p.y,12),`Blocked ${JSON.stringify(p)}`);assert.ok(findPath(SAFE,p).length);}
  for(const a of ROOF_ACCESS)assert.equal(roofAt(a.roof.x,a.roof.y)?.id,a.buildingId);
});
test('buildings, every parked vehicle, carts and solid trees share the collision grid',()=>{
  for(const p of [...BUILDINGS,...SOLID_PROPS]){assert.equal(walkable((p.x+.5)*TILE,(p.y+.5)*TILE),false,JSON.stringify(p));for(let y=p.y;y<p.y+p.h;y++)for(let x=p.x;x<p.x+p.w;x++)assert.equal(GRID[y][x],1);}
  const cart=SOLID_PROPS.find(p=>p.kind==='cart'),a={x:(cart.x-.5)*TILE,y:(cart.y+.5)*TILE},b={x:(cart.x+cart.w+.5)*TILE,y:a.y};const path=findPath(a,b);assert.ok(path.length>cart.w+2);for(const p of path)assert.ok(walkable(p.x,p.y));assert.ok(path.some(p=>p.y!==a.y),'No obstacle detour');
  for(const points of CAR_WAYPOINTS){const route=closedRoute(points);assert.ok(route.length>60);for(let i=0;i<route.length;i++){assert.ok(walkable(route[i].x,route[i].y,12));assert.ok(distance(route[i],route[(i+1)%route.length])<=32.01);}}
});
test('seeded rounds choose three distinct personalities in three distinct districts fairly',()=>{
  const layouts=new Set(),types=new Set(),themes=new Set(),events=new Set();
  for(let seed=0;seed<200;seed++){
    const r=makeRound(seed);layouts.add(r.signature);themes.add(r.theme);assert.equal(new Set(r.loot.map(l=>l.id)).size,3);assert.equal(new Set(r.loot.map(l=>l.district)).size,3);
    const travel=r.loot.reduce((n,l)=>n+findPath(SAFE,l).length*64,0);assert.ok(travel<=10500);assert.ok(new Set(r.eventPlan.map(e=>e.type)).size===2);assert.ok(r.eventPlan[0].start+r.eventPlan[0].duration<r.eventPlan[1].start-4);
    for(const e of r.eventPlan)events.add(e.type);
    for(let i=0;i<r.loot.length;i++){const l=r.loot[i];types.add(l.id);assert.ok(walkable(l.x,l.y,12));assert.ok(findPath(SAFE,l).length);assert.ok(distance(l,SAFE)>165);assert.ok(distance(l,STATION)>145);for(let j=0;j<i;j++)assert.ok(distance(l,r.loot[j])>=100);}
  }
  assert.ok(layouts.size>170);assert.equal(types.size,5);assert.equal(themes.size,2);assert.equal(events.size,3);
});
test('round seeds reproduce full layouts, palettes and event plans, including alternate arrangements',()=>{
  for(const seed of [0,1,2401,0xffffffff,'chai-time']){const first=makeRound(seed),replay=makeRound(first.seed);assert.deepEqual(first,replay);const next=makeRound(seed,first.signature);assert.notEqual(next.signature,first.signature);assert.deepEqual(next,makeRound(next.seed));}
  const input=[1,2,3,4,5];assert.deepEqual(shuffled(input,randomFrom(42)),shuffled(input,randomFrom(42)));assert.deepEqual(input,[1,2,3,4,5]);
});

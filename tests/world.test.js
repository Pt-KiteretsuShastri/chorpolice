import {test} from 'node:test';import assert from 'node:assert/strict';
import {GRID,COLS,ROWS,TILE,WIDTH,HEIGHT,SAFE,STATION,BUILDINGS,SOLID_PROPS,SPAWN_CANDIDATES,CHAI_SPOTS,TEA_SPOTS,ROOF_ACCESS,PATROL,CAR_WAYPOINTS,walkable,findPath,distance,closedRoute,roofAt,GROUND_OBSTACLES,CHOR_SPAWN,pathDistance,P,pointInPolygon} from '../dist/world.js';
import {makeRound} from '../dist/engine.js';import {randomFrom,shuffled} from '../dist/random.js';

test('46 × 30 painted world: every marked objective, spawn and access point is reachable',()=>{
  assert.equal(WIDTH,1472);assert.equal(HEIGHT,960);assert.equal(TILE,32);assert.ok(SPAWN_CANDIDATES.length>=12);
  for(const p of [SAFE,CHOR_SPAWN,STATION,...SPAWN_CANDIDATES,...CHAI_SPOTS,...TEA_SPOTS,...PATROL,...ROOF_ACCESS.map(a=>a.ground)]){assert.ok(walkable(p.x,p.y,12),`Blocked ${JSON.stringify(p)}`);assert.ok(findPath(SAFE,p).length,`Unreachable ${JSON.stringify(p)}`);}
  for(const a of ROOF_ACCESS)assert.equal(roofAt(a.roof.x,a.roof.y)?.id,a.buildingId);
  for(const route of [[CHOR_SPAWN,P(288,1000),P(485,950),STATION],[P(1200,580),P(1180,655),SAFE]])for(let i=1;i<route.length;i++)assert.ok(findPath(route[i-1],route[i]).length,'Courtyard gate or street loop is blocked');
});
test('painted façades, courtyard walls and parked vehicles share precise collision polygons',()=>{
  for(const p of [...GROUND_OBSTACLES,...SOLID_PROPS]){const center={x:p.polygon.reduce((n,a)=>n+a.x,0)/p.polygon.length,y:p.polygon.reduce((n,a)=>n+a.y,0)/p.polygon.length};if(pointInPolygon(center.x,center.y,p.polygon))assert.equal(walkable(center.x,center.y),false,p.id);}
  const a=P(490,510),b=P(875,510),path=findPath(a,b);assert.ok(path.length>20);for(const p of path)assert.ok(walkable(p.x,p.y),'Route clips a building or a scooter');assert.ok(path.some(p=>p.y<P(0,360).y||p.y>P(0,630).y),'No building detour');
  for(const points of CAR_WAYPOINTS){const route=closedRoute(points);assert.ok(route.length>100);for(let i=0;i<route.length;i++){assert.ok(walkable(route[i].x,route[i].y,9));assert.ok(distance(route[i],route[(i+1)%route.length])<=20,'Route contains a teleport');}}
});
test('seeded rounds choose three distinct personalities in three distinct districts fairly',()=>{
  const layouts=new Set(),types=new Set(),themes=new Set(),events=new Set();
  for(let seed=0;seed<200;seed++){
    const r=makeRound(seed);layouts.add(r.signature);themes.add(r.theme);assert.equal(new Set(r.loot.map(l=>l.id)).size,3);assert.equal(new Set(r.loot.map(l=>l.district)).size,3);
    const travel=r.loot.reduce((n,l)=>n+pathDistance(SAFE,l)*2,0);assert.ok(travel<=10500);assert.ok(new Set(r.eventPlan.map(e=>e.type)).size===2);assert.ok(r.eventPlan[0].start+r.eventPlan[0].duration<r.eventPlan[1].start-4);
    for(const e of r.eventPlan)events.add(e.type);
    for(let i=0;i<r.loot.length;i++){const l=r.loot[i];types.add(l.id);assert.ok(walkable(l.x,l.y,12));assert.ok(findPath(SAFE,l).length);assert.ok(distance(l,SAFE)>165);assert.ok(distance(l,STATION)>145);for(let j=0;j<i;j++)assert.ok(distance(l,r.loot[j])>=100);}
  }
  assert.ok(layouts.size>170);assert.equal(types.size,5);assert.equal(themes.size,2);assert.equal(events.size,3);
});
test('round seeds reproduce full layouts, palettes and event plans, including alternate arrangements',()=>{
  for(const seed of [0,1,2401,0xffffffff,'chai-time']){const first=makeRound(seed),replay=makeRound(first.seed);assert.deepEqual(first,replay);const next=makeRound(seed,first.signature);assert.notEqual(next.signature,first.signature);assert.deepEqual(next,makeRound(next.seed));}
  const input=[1,2,3,4,5];assert.deepEqual(shuffled(input,randomFrom(42)),shuffled(input,randomFrom(42)));assert.deepEqual(input,[1,2,3,4,5]);
});

test('wider lanes give the park gate, chai lane and safehouse approach extra clearance',()=>{for(const [x,y,r]of [[1200,645,13],[480,800,18],[288,978,26],[490,500,32]]){const p=P(x,y);assert.ok(walkable(p.x,p.y,r),`Lane is too tight at ${x},${y}`);assert.ok(findPath(SAFE,p).length);}});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game,GRID,COLS,ROWS,TILE,LOOT_TYPES,SAFE,STATION,walkable,findPath,lineOfSight,distance} from '../dist/engine.js';
import {Renderer} from '../dist/renderer.js';

function tick(g,seconds,input={}){for(let i=0;i<seconds*60;i++)g.update(1/60,input);}
function pick(g,index=0){g.chor.x=g.loot[index].x;g.chor.y=g.loot[index].y;g.action('interact');}
function bank(g){g.chor.x=SAFE.x;g.chor.y=SAFE.y;g.action('interact');}

test('every street tile connects to the safehouse; all landmarks are reachable',()=>{
  let streets=0;
  for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++)if(GRID[y][x]===0){streets++;assert.ok(findPath(SAFE,{x:(x+.5)*TILE,y:(y+.5)*TILE}).length,`Unreachable tile ${x},${y}`);}
  assert.ok(streets>300);
  for(const p of [SAFE,STATION,...LOOT_TYPES]){assert.ok(walkable(p.x,p.y));assert.ok(findPath(SAFE,p).length);}
});
test('movement collides with buildings and never exits the map',()=>{
  const g=new Game({duo:true});g.start();g.chor.x=80;g.chor.y=144;
  tick(g,1,{chor:{x:1}});assert.ok(g.chor.x<96);assert.ok(walkable(g.chor.x,g.chor.y));
  tick(g,6,{chor:{x:-1,sprint:true}});assert.ok(g.chor.x>=42);assert.ok(walkable(g.chor.x,g.chor.y));
  assert.equal(walkable(NaN,0),false);assert.equal(lineOfSight({x:80,y:144},{x:300,y:144}),false);
});
test('the parked auto blocks movement while routes can go around it',()=>{
  const g=new Game({duo:true});g.start();g.chor.x=848;g.chor.y=384;
  tick(g,.5,{chor:{x:1}});assert.ok(g.chor.x<864-9,'Actor walked into the parked auto');
  const path=findPath({x:848,y:384},{x:912,y:384});assert.ok(path.length>3);
  for(const p of path)assert.ok(walkable(p.x,p.y),'Route clips a solid prop');
  assert.ok(path.some(p=>p.y<352||p.y>416),'Route should detour around the car');
});
test('collect, hush, drop, collect again, bank all treasures, and win',()=>{
  const g=new Game({duo:true});g.start();pick(g);assert.equal(g.carried.id,'cooker');
  g.action('hush');assert.equal(g.hushed,5);assert.equal(g.chor.energy,75);
  g.action('drop');assert.equal(g.carried,null);assert.equal(g.loot[0].state,'ground');
  g.action('interact');bank(g);assert.equal(g.banked,1);assert.equal(g.carried,null);
  pick(g,1);bank(g);pick(g,2);bank(g);
  assert.equal(g.phase,'ended');assert.equal(g.winner,'chor');assert.equal(g.banked,3);
});
test('noise reveals a carried treasure and hush suppresses it',()=>{
  const g=new Game({duo:true});g.start();pick(g);g.cop.x=200;g.cop.y=320;
  g.chatter=.05;g.action('hush');tick(g,.3);assert.equal(g.rings.length,0);assert.equal(g.lastNoise,null);
  g.hushed=0;tick(g,.05);assert.ok(g.rings.length>0);assert.ok(g.lastNoise);assert.ok(g.alert>0);
});
test('tags return loot, give respawn protection, and end after three catches',()=>{
  const g=new Game({duo:true});g.start();pick(g);g.tag();assert.equal(g.catches,1);assert.equal(g.carried,null);assert.equal(g.loot[0].state,'ground');assert.ok(g.chor.invuln>0);
  g.tag();assert.equal(g.catches,1);
  g.chor.invuln=0;g.tag();g.chor.invuln=0;g.tag();assert.equal(g.winner,'cop');assert.equal(g.reason,'three-catches');
});
test('nets need range and sight, immobilize the chor, and have a cooldown',()=>{
  const g=new Game({duo:true});g.start();g.cop.x=80;g.cop.y=250;g.chor.x=130;g.chor.y=250;
  g.action('net');assert.equal(g.chor.stun,1.7);assert.equal(g.netCooldown,5);
  g.action('net');assert.equal(g.netCooldown,5);
  const x=g.chor.x;g.update(.05,{chor:{x:1}});assert.equal(g.chor.x,x);
  g.chor.stun=0;g.netCooldown=0;g.chor.x=800;g.action('net');assert.equal(g.chor.stun,0);
});
test('paused state freezes timer, physics, and actions; timeout awards police',()=>{
  const g=new Game({duo:true});g.start();g.phase='paused';tick(g,5,{chor:{x:1}});assert.equal(g.remaining,120);assert.equal(g.chor.x,SAFE.x);g.action('net');assert.equal(g.netCooldown,0);
  g.phase='playing';g.elapsed=119.99;g.update(.05);assert.equal(g.phase,'ended');assert.equal(g.winner,'cop');assert.equal(g.reason,'timeout');
});
test('sprint consumes energy and chai restores it',()=>{
  const g=new Game({duo:true});g.start();g.chor.x=400;g.chor.y=240;tick(g,.5,{chor:{x:1,sprint:true}});assert.ok(g.chor.energy<90);
  g.chor.x=g.chai[0].x;g.chor.y=g.chai[0].y;g.chor.energy=30;g.update(.01);assert.equal(g.chor.energy,100);assert.ok(g.chai[0].cooldown>0);
});
test('AI chor can complete a full round around buildings against an idle human cop',()=>{
  const g=new Game({role:'cop'});g.start();tick(g,100);
  assert.equal(g.phase,'ended',`AI got stuck at ${g.chor.x},${g.chor.y}; banked ${g.banked}`);assert.equal(g.winner,'chor');assert.equal(g.banked,3);
});
test('AI police moves, follows lanes, and reaches a stationary chor',()=>{
  const g=new Game({role:'chor',difficulty:'hard'});g.start();const start={x:g.cop.x,y:g.cop.y};tick(g,100);
  assert.ok(distance(start,g.cop)>100);assert.ok(g.catches>0);assert.ok(walkable(g.cop.x,g.cop.y));
});
test('renderer draws a map immediately, before starting a round',()=>{
  let draws=0,shapes=0;
  const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}}),measureText:t=>({width:t.length*6})},{get:(o,k)=>k in o?o[k]:(...args)=>{if(k==='drawImage')draws++;if(k==='fill')shapes++;},set:(o,k,v)=>(o[k]=v,true)});
  const canvas=()=>({width:960,height:640,getContext:()=>ctx});const r=new Renderer(canvas(),canvas);
  assert.ok(shapes>500,'Map geometry was not painted');r.resize(480,320,2);r.render(new Game(),0);assert.equal(draws,1);
  const g=new Game();g.start();pick(g);g.say('chor','Test loot');g.action('net');r.render(g,1);assert.equal(draws,2);
});

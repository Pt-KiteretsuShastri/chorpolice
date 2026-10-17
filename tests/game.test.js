import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game,SAFE,STATION,walkable,findPath,lineOfSight,distance,TEA_SPOTS,ROOF_ACCESS,LOOT_TYPES} from '../dist/engine.js';
import {roofAt,BUILDINGS,P,CHOR_SPAWN} from '../dist/world.js';
import {movement,actionFor} from '../dist/input.js';

function tick(g,seconds,input={}){for(let i=0;i<Math.ceil(seconds*60);i++)g.update(1/60,input);}
function fresh(options={}){const g=new Game({seed:47,duo:true,traffic:false,...options});g.start();return g;}
function position(a,p){a.x=p.x;a.y=p.y;}
function agree(g){assert.ok(g.negotiation);assert.ok(g.answer(g.negotiation.choices.findIndex(c=>c.correct)));}
function pick(g,index=0){position(g.chor,g.loot[index]);g.action('interact');assert.equal(g.carried,null);agree(g);}
function bank(g){position(g.chor,SAFE);g.action('interact');}

test('movement collides with painted buildings and never exits the map',()=>{
  const g=fresh();position(g.chor,P(480,500));tick(g,1,{chor:{x:1}});assert.ok(g.chor.x<434);assert.ok(walkable(g.chor.x,g.chor.y));position(g.chor,P(490,1000));tick(g,6,{chor:{x:-1,sprint:true}});assert.ok(g.chor.x>=10);assert.ok(walkable(g.chor.x,g.chor.y));assert.equal(walkable(NaN,0),false);assert.equal(lineOfSight(P(480,500),P(700,500)),false);
});
test('collect, persuade, drop, collect again and bank all three treasures',()=>{
  const g=fresh();pick(g);const id=g.carried.id;assert.equal(g.carried.trust,1);g.carried.trust=.1;g.action('persuade');agree(g);assert.equal(g.carried.trust,1);g.action('drop');assert.equal(g.carried,null);assert.equal(g.loot.find(l=>l.id===id).state,'ground');g.action('interact');agree(g);bank(g);assert.equal(g.banked,1);pick(g,1);bank(g);pick(g,2);bank(g);assert.equal(g.phase,'ended');assert.equal(g.winner,'chor');assert.equal(g.banked,3);
});
test('wrong offers make noise, have a cooldown, and allow a correct retry',()=>{
  const g=fresh();position(g.chor,g.loot[0]);position(g.cop,{x:g.chor.x+50,y:g.chor.y});g.action('interact');const wrong=g.negotiation.choices.findIndex(c=>!c.correct);assert.equal(g.answer(wrong),false);assert.equal(g.carried,null);assert.ok(g.lastNoise);assert.ok(g.rings.length);assert.equal(g.answer(g.negotiation.choices.findIndex(c=>c.correct)),false);position(g.cop,STATION);tick(g,.85);agree(g);assert.ok(g.carried);
});
test('walking away cancels an unfinished conversation',()=>{
  const g=fresh();position(g.chor,g.loot[0]);g.action('interact');position(g.chor,SAFE);g.update(.01);assert.equal(g.negotiation,null);assert.equal(g.answer(0),false);assert.equal(g.carried,null);
});
test('low-trust loot reveals the chor; a fresh agreement suppresses noise',()=>{
  const g=fresh();pick(g);position(g.chor,P(490,450));position(g.cop,P(490,530));g.carried.trust=0;g.chatter=.01;tick(g,.05);assert.ok(g.lastNoise);assert.ok(g.alert>0);const n=g.stats.noise;g.action('persuade');agree(g);g.chatter=.01;tick(g,.1);assert.equal(g.stats.noise,n);
});
test('tags return loot, grant respawn protection and end after three catches',()=>{
  const g=fresh();pick(g);const l=g.carried;g.tag();assert.equal(g.catches,1);assert.equal(g.carried,null);assert.equal(l.state,'ground');assert.deepEqual({x:l.x,y:l.y},l.origin);assert.ok(g.chor.invuln>0);g.tag();assert.equal(g.catches,1);g.chor.invuln=0;g.tag();g.chor.invuln=0;g.tag();assert.equal(g.winner,'cop');assert.equal(g.reason,'three-catches');
});
test('nets need range and sight, immobilize the chor and have a cooldown',()=>{
  const g=fresh();position(g.cop,P(490,600));position(g.chor,P(490,660));g.action('net');assert.equal(g.chor.stun,1.5);assert.equal(g.netCooldown,5);g.action('net');assert.equal(g.netCooldown,5);const x=g.chor.x;g.update(.05,{chor:{x:1}});assert.equal(g.chor.x,x);g.chor.stun=0;g.netCooldown=0;g.chor.x=800;g.action('net');assert.equal(g.chor.stun,0);
});
test('pause freezes timer, physics, cars, events and actions; timeout awards police',()=>{
  const g=fresh({traffic:true});g.phase='paused';const c={x:g.cars[0].x,y:g.cars[0].y};tick(g,5,{chor:{x:1}});assert.equal(g.remaining,120);assert.equal(g.chor.x,SAFE.x);assert.deepEqual({x:g.cars[0].x,y:g.cars[0].y},c);g.action('net');assert.equal(g.netCooldown,0);g.phase='playing';g.elapsed=119.99;g.update(.05);assert.equal(g.winner,'cop');assert.equal(g.reason,'timeout');
});
test('sprint consumes energy and chai restores it',()=>{
  const g=fresh();position(g.chor,P(490,600));tick(g,.5,{chor:{x:1,sprint:true}});assert.ok(g.chor.energy<90);position(g.chor,g.chai[0]);g.chor.energy=30;g.update(.01);assert.equal(g.chor.energy,100);assert.ok(g.chai[0].cooldown>0);
});
test('rooftop jumps climb, cross a gap, collide with roof edges and descend',()=>{
  const g=fresh(),access=ROOF_ACCESS.find(a=>a.buildingId==='bazaar-west');position(g.chor,access.ground);g.action('jump');assert.equal(g.chor.layer,'air');assert.equal(g.chor.energy,82);tick(g,.5);assert.equal(g.chor.layer,'roof');assert.equal(g.chor.roofId,'bazaar-west');assert.ok(roofAt(g.chor.x,g.chor.y));tick(g,1.2,{chor:{x:1}});const b=BUILDINGS.find(b=>b.id==='bazaar-west');assert.ok(g.chor.x<=32*(b.x+b.w)-13);g.action('jump');tick(g,.5);assert.equal(g.chor.roofId,'bazaar-east');assert.equal(g.chor.layer,'roof');const exit=ROOF_ACCESS.find(a=>a.buildingId==='bazaar-east');position(g.chor,exit.roof);tick(g,.7);g.action('jump');tick(g,.5);assert.equal(g.chor.layer,'ground');assert.ok(walkable(g.chor.x,g.chor.y));assert.equal(g.stats.jumps,3);
});
test('roof loot drops onto reachable ground and nets cannot catch a rooftop chor',()=>{
  const g=fresh();pick(g);const a=ROOF_ACCESS[0];position(g.chor,a.ground);g.action('jump');tick(g,.5);position(g.cop,g.chor);g.action('net');assert.equal(g.chor.stun,0);assert.equal(g.tag(),false);g.action('drop');const l=g.loot.find(l=>l.state==='ground'&&l.trust===0&&l.x!==l.origin.x);assert.ok(l);assert.ok(walkable(l.x,l.y));assert.ok(findPath(SAFE,l).length);
});
test('tea camouflage blocks movement, sight, nets, patrol tags and catches while time runs',()=>{
  const g=fresh({duo:false,role:'chor',traffic:true});position(g.chor,TEA_SPOTS[0]);g.action('interact');assert.ok(g.hidden);position(g.cop,g.chor);g.chor.energy=20;tick(g,3,{chor:{x:1,sprint:true}});g.action('net');g.tag('patrol');assert.equal(g.chor.stun,0);assert.equal(g.catches,0);assert.equal(g.chor.x,TEA_SPOTS[0].x);assert.ok(g.remaining<118);assert.ok(g.chor.energy>20);assert.equal(g.cop.state,'patrol');assert.equal(g.lastNoise,null);g.action('jump');assert.equal(g.chor.layer,'ground');g.action('interact');assert.equal(g.hidden,false);assert.ok(g.chor.invuln>0);g.elapsed=119.99;g.action('interact');g.update(.05);assert.equal(g.winner,'cop');
});
test('patrol cars follow navigable circuits and radio a sustained sighting',()=>{
  const g=fresh({traffic:true});const car=g.cars[0],start={x:car.x,y:car.y};for(let i=0;i<1200;i++){g.updateCars(1/60,false);for(const p of g.cars)assert.ok(walkable(p.x,p.y,8));}assert.ok(distance(start,car)>100);car.route=[P(490,450),P(490,530)];car.index=0;position(car,P(490,400));car.dir=Math.PI/2;position(g.chor,P(490,535));for(let i=0;i<50;i++)g.updateCars(1/60);assert.ok(g.lastNoise);assert.ok(g.alert>0);assert.ok(car.radioCooldown>0);
});
test('police AI reads patrol, noise investigation, sight chase, loss and decoys',()=>{
  const g=fresh({duo:false});position(g.cop,P(490,450));position(g.chor,P(490,530));g.aiCop(.01);assert.equal(g.cop.state,'chase');position(g.chor,CHOR_SPAWN);g.aiCop(.01);assert.equal(g.cop.state,'investigate');g.alert=0;g.aiCop(.01);assert.equal(g.cop.state,'patrol');g.noise(P(490,490));g.aiCop(.01);assert.equal(g.cop.state,'investigate');
});
test('all event types telegraph, activate meaningfully, and clean up',()=>{
  for(const type of ['chai','sprint','decoy']){
    const g=fresh();g.eventPlan=[{type,start:10,duration:12,announced:false,started:false,done:false}];g.elapsed=6;g.eventStep();assert.equal(g.eventBanner.stage,'soon');g.elapsed=10;g.eventStep();assert.equal(g.activeEvent.type,type);assert.equal(g.eventBanner.stage,'active');
    if(type==='chai')assert.equal(g.chai.filter(p=>p.temporary).length,3);
    if(type==='sprint'){assert.equal(g.boosts.length,2);position(g.chor,g.boosts[0]);g.update(.01);assert.ok(g.boostTime>6);assert.equal(g.boosts[0].active,false);}
    if(type==='decoy'){assert.ok(g.decoy);assert.deepEqual(g.lastNoise,{x:g.decoy.x,y:g.decoy.y});assert.ok(g.alert>0);}
    g.elapsed=22;g.eventStep();assert.equal(g.activeEvent,null);assert.equal(g.eventBanner,null);assert.equal(g.chai.filter(p=>p.temporary).length,0);assert.equal(g.boosts.length,0);assert.equal(g.decoy,null);
  }
});
test('finish and new rounds clear temporary event state and unfinished negotiations',()=>{
  const g=fresh();g.eventPlan=[{type:'chai',start:0,duration:12}];g.eventStep();position(g.chor,g.loot[0]);g.action('interact');assert.ok(g.negotiation);g.finish('cop','timeout');assert.equal(g.negotiation,null);assert.equal(g.activeEvent,null);assert.equal(g.chai.filter(p=>p.temporary).length,0);const next=new Game({seed:g.seed,previous:g.signature});assert.notEqual(next.signature,g.signature);assert.equal(next.events.length,0);assert.equal(next.banked,0);assert.equal(next.catches,0);assert.equal(next.phase,'ready');
});
test('AI chor completes whole rounds on the larger map across seeds and difficulties',()=>{
  for(const difficulty of ['easy','normal','hard'])for(const seed of [1,42,2401,65535]){const g=fresh({duo:false,role:'cop',difficulty,seed,traffic:true});tick(g,120);assert.equal(g.winner,'chor',`seed=${seed} ${difficulty}: ${g.banked} banked at ${g.chor.x},${g.chor.y}`);assert.equal(g.banked,3);assert.ok(g.elapsed<105,'Deliveries exceed fair travel budget');}
});
test('AI police follows lanes, finds the idle chor and completes a cop victory',()=>{
  const g=fresh({duo:false,role:'chor',difficulty:'hard',traffic:true}),start={...g.cop};tick(g,120);assert.ok(distance(start,g.cop)>20);assert.ok(g.catches>0,'Patrol never visited the chor neighbourhood');assert.ok(walkable(g.cop.x,g.cop.y));assert.equal(g.winner,'cop');
});
test('same-keyboard inputs independently move both actors and preserve role actions',()=>{
  const g=fresh();position(g.chor,P(490,450));position(g.cop,P(890,400));const input=movement(new Set(['KeyW','ArrowDown','ShiftLeft','Slash']),{},true);tick(g,.2,input);assert.ok(g.chor.y<P(490,450).y);assert.ok(g.cop.y>P(890,400).y);assert.ok(g.chor.energy<100);assert.ok(g.cop.energy<100);assert.equal(actionFor('Space',true),'jump');assert.equal(actionFor('Enter',true),'net');assert.equal(actionFor('Space',false,'cop'),'net');assert.equal(actionFor('KeyE',false,'cop'),null);const mobile=movement(new Set(),{x:-1,y:1,sprint:true},false,'cop');assert.deepEqual(mobile,{cop:{x:-1,y:1,sprint:true}});
});
test('dialogue avoids recent repeats and enforces character cooldowns',()=>{
  const g=fresh();g.drainEvents();const lines=['one','two','three','four'];g.say('chor',lines);const first=g.speech.at(-1).text;g.say('chor',lines);assert.equal(g.drainEvents().filter(e=>e.type==='dialogue').length,1);g.elapsed+=4;g.say('chor',lines);assert.notEqual(g.speech.at(-1).text,first);assert.ok(g.speech.length<=3);
});

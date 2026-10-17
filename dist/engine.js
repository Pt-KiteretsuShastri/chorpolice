/** Deterministic simulation. Browser, speech, and drawing stay in other modules. */
import {TILE,COLS,ROWS,WIDTH,HEIGHT,NAV_TILE,SAFE,CHOR_SPAWN,STATION,BUILDINGS,SOLID_PROPS,BUSHES,TEA_SPOTS,CHAI_SPOTS,SPAWN_CANDIDATES,PATROL,CAR_WAYPOINTS,ROOF_ACCESS,GRID,clamp,distance,walkable,roofAt,findPath,pathDistance,lineOfSight,nearestGround,closedRoute} from './world.js';
import {seedNumber,randomFrom,shuffled} from './random.js';
import {LOOT_TYPES,DISTRACTIONS,LINES,SHARED_LINES,hindiLine,speakerName} from './dialogue.js';
export {TILE,COLS,ROWS,WIDTH,HEIGHT,SAFE,STATION,BUILDINGS,SOLID_PROPS,BUSHES,TEA_SPOTS,CHAI_SPOTS,SPAWN_CANDIDATES,ROOF_ACCESS,GRID,distance,walkable,findPath,lineOfSight,LOOT_TYPES};
export const ROUND_SECONDS=120;
export const EVENT_TYPES={chai:{title:'Chai Happy Hour',description:'Extra chai is on the house.'},sprint:{title:'Chutney Sprint',description:'Find the glowing chutney for a speed burst.'},decoy:{title:'Wrong Number!',description:'A fake radio broadcast distracts the patrol.'}};

export function makeRound(seed,previous=''){
  let used=seedNumber(seed);
  for(let attempt=0;attempt<12;attempt++,used=(used+0x9e3779b9)>>>0){
    const rand=randomFrom(used);
    const candidates=SPAWN_CANDIDATES.filter(p=>walkable(p.x,p.y,12)&&distance(p,SAFE)>165&&distance(p,STATION)>145&&findPath(SAFE,p).length);
    const districts=shuffled([...new Set(candidates.map(p=>p.district))],rand).slice(0,3);
    const spots=districts.map(d=>shuffled(candidates.filter(p=>p.district===d),rand)[0]);
    const types=shuffled(LOOT_TYPES,rand).slice(0,3);
    const loot=types.map((t,i)=>({...t,...spots[i],origin:{x:spots[i].x,y:spots[i].y},state:'ground',trust:0,layer:'ground'}));
    const signature=loot.map(l=>`${l.id}:${l.x},${l.y}`).join('|');
    const travel=loot.reduce((sum,l)=>sum+pathDistance(SAFE,l)*2,0);
    if(signature===previous||spots.some((p,i)=>spots.some((q,j)=>j<i&&distance(p,q)<100))||travel>10500)continue;
    const eventIds=shuffled(Object.keys(EVENT_TYPES),rand).slice(0,2);
    return {seed:used,signature,loot,theme:rand()<.5?'morning':'evening',eventPlan:eventIds.map((type,i)=>({type,start:(i?72:28)+Math.floor(rand()*6),duration:12,announced:false,started:false,done:false}))};
  }
  throw new Error('Unable to create a fair loot arrangement.');
}
const actor=(kind,x,y)=>({kind,x,y,dir:0,moving:false,sprinting:false,energy:100,stun:0,invuln:0,path:[],planIn:0,walk:0,layer:'ground',roofId:null,jump:null,jumpCooldown:0,seated:null,seatTime:0});

export class Game{
  constructor({role='chor',duo=false,difficulty='normal',seed=Date.now(),previous='',traffic=true}={}){
    Object.assign(this,makeRound(seed,previous));this.rand=randomFrom(this.seed^0xbad5eed);this.role=role;this.duo=duo;this.difficulty=difficulty;this.traffic=traffic;
    this.phase='ready';this.elapsed=0;this.remaining=ROUND_SECONDS;this.winner=null;this.reason='';
    this.chor=actor('chor',CHOR_SPAWN.x,CHOR_SPAWN.y);this.cop=actor('cop',STATION.x,STATION.y);this.cop.state='patrol';
    this.carried=null;this.banked=0;this.catches=0;this.negotiation=null;this.speech=[];this.rings=[];this.particles=[];this.events=[];this.lastTalk={};this.recentLines={};
    this.alert=0;this.lastNoise=null;this.patrol=0;this.netCooldown=0;this.netVisual=0;this.chatter=4;this.boostTime=0;
    this.activeEvent=null;this.eventBanner=null;this.chai=CHAI_SPOTS.map(p=>({...p,cooldown:0,temporary:false}));this.boosts=[];this.decoy=null;
    this.stats={noise:0,persuaded:0,jumps:0,teas:0};this.neighborIn=18;this.botPause=0;
    this.cars=CAR_WAYPOINTS.map((waypoints,i)=>{const route=closedRoute(waypoints),index=i?4:0;return {id:i,route,index,initialIndex:index,x:route[index].x,y:route[index].y,dir:Math.PI/2,aware:0,radioCooldown:0};});
  }
  get hidden(){return !!this.chor.seated;}
  get catchable(){return !this.hidden&&this.chor.layer==='ground'&&!this.chor.jump&&this.chor.invuln<=0;}
  start(){if(this.phase!=='ready')return;this.phase='playing';this.emit('start',this.online?'Online round started. Chor delivers; cop catches.':this.duo?'P1 is chor. P2 is cop. The gully is yours.':this.role==='chor'?'Convince three treasures, then bank them at the green safehouse.':'Tag the chor three times. Patrol cars are on your side.');this.say('neighbor',LINES.neighbor,{priority:1});}
  emit(type,text,extra={}){this.events.push({type,text,...extra});}
  drainEvents(){return this.events.splice(0);}
  say(who,lines,{priority=1,anchor=null,hi=null}={}){
    if(priority<3&&this.elapsed-(this.lastTalk[who]??-100)<3)return;
    const available=(Array.isArray(lines)?lines:[lines]).filter(s=>!(this.recentLines[who]||[]).includes(s));
    const pool=available.length?available:(Array.isArray(lines)?lines:[lines]);const text=pool[Math.floor(this.rand()*pool.length)];
    this.lastTalk[who]=this.elapsed;this.recentLines[who]=[...(this.recentLines[who]||[]),text].slice(-3);
    this.speech=this.speech.filter(s=>s.who!==who);this.speech.push({who,text,anchor,life:3.5,priority});this.speech=this.speech.slice(-3);
    const translated=(typeof hi==='object' ? hi?.[text] : hi)||hindiLine(text);
    this.emit('dialogue',`${speakerName(who)}: ${text}`,{speaker:who,spoken:text,hi:translated,priority});
  }
  burst(x,y,color,n=12){for(let i=0;i<n;i++){const a=this.rand()*Math.PI*2,s=25+this.rand()*65;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.5+this.rand()*.5,color});}}
  noise(point,radius=250){
    if(this.hidden&&point===this.chor)return;
    this.stats.noise++;this.rings.push({x:point.x,y:point.y,r:10,max:radius,life:1.6,total:1.6,color:'#d78252'});
    if(distance(this.cop,point)<radius){this.alert=6;this.lastNoise=walkable(point.x,point.y)?{x:point.x,y:point.y}:nearestGround(point);this.cop.planIn=0;}
  }
  openConversation(loot,mode='pickup'){
    if(this.negotiation?.lootId===loot.id)return;
    this.negotiation={lootId:loot.id,mode,opened:this.elapsed,lockedUntil:0,prompt:loot.clue,choices:shuffled([{label:loot.offer,correct:true},...shuffled(DISTRACTIONS,this.rand).slice(0,2).map(label=>({label,correct:false}))],this.rand)};
    this.say(loot.id,loot.clue,{priority:2,anchor:{x:loot.x,y:loot.y}});this.emit('talk',`${loot.name} wants ${loot.desire}. Choose an offer with 1, 2, or 3.`);
  }
  answer(index){
    if(this.phase!=='playing'||!this.negotiation)return false;
    const n=this.negotiation,l=this.loot.find(l=>l.id===n.lootId),choice=n.choices[index];
    if(!l||!choice||this.elapsed<n.lockedUntil)return false;
    if(n.mode==='pickup'&&(l.state!=='ground'||this.chor.layer!=='ground'||distance(l,this.chor)>65)){this.negotiation=null;return false;}
    if(!choice.correct){n.lockedUntil=this.elapsed+.8;this.noise(this.chor,l.noise);this.say(l.id,SHARED_LINES.refusal,{priority:3,anchor:{x:l.x,y:l.y}});this.emit('refusal',`${l.name} refused. Read what it wants and try another offer.`);return false;}
    this.stats.persuaded++;l.trust=1;this.negotiation=null;this.chatter=l.interval+2;
    if(n.mode==='pickup'){
      l.state='carried';this.carried=l;if(l.id==='chappal')this.boostTime=4;
      this.burst(this.chor.x,this.chor.y,l.color);this.emit('pickup',`${l.name} is coming along. Keep its trust high.`);
    }else this.emit('hush',`${l.name} bought your promise. Quiet again.`);
    this.say(l.id,[l.reply,...SHARED_LINES.agreement],{priority:3,hi:l.replyHi?{[l.reply]:l.replyHi}:null});if(n.mode==='pickup')this.say('chor',LINES.pickup,{priority:1});return true;
  }
  leaveTea(){if(!this.hidden)return;this.chor.seated=null;this.chor.seatTime=0;this.chor.invuln=1;this.emit('tea','Back in the gully. Your disguise is gone.');}
  action(kind){
    if(this.phase!=='playing')return;
    const c=this.chor;
    if(kind==='net'){this.throwNet();return;}
    if(kind==='jump'){this.jump();return;}
    if(kind==='hush'||kind==='persuade'){if(this.carried)this.openConversation(this.carried,'carried');else this.emit('hint','Find a treasure and press E to make it an offer.');return;}
    if(kind==='drop'&&this.carried){const l=this.carried,p=c.layer==='ground'?c:nearestGround(c);l.state='ground';l.x=p.x;l.y=p.y;l.trust=0;this.carried=null;this.negotiation=null;this.emit('drop',`${l.name} dropped on reachable ground.`);return;}
    if(kind!=='interact'||c.jump||c.stun>0)return;
    if(this.hidden){this.leaveTea();return;}
    if(c.layer!=='ground'){this.emit('hint','Press Space at an amber rooftop marker to come down.');return;}
    const seat=TEA_SPOTS.find(p=>distance(c,p)<42);
    if(seat){c.x=seat.x;c.y=seat.y;c.seated=seat.id;c.seatTime=0;c.moving=false;c.sprinting=false;this.negotiation=null;this.alert=0;this.lastNoise=null;this.cop.state='patrol';this.cars.forEach(car=>car.aware=0);this.stats.teas++;this.say('chor',LINES.tea,{priority:3});this.emit('tea','Chai camouflage: invisible and untouchable while seated. E to leave. Time still runs.');return;}
    if(distance(c,SAFE)<SAFE.radius){
      if(this.carried){const l=this.carried;l.state='banked';this.carried=null;this.negotiation=null;this.banked++;c.energy=clamp(c.energy+20,0,100);this.burst(SAFE.x,SAFE.y,'#f3cb64',25);this.say('chor',LINES.bank,{priority:3});this.emit('bank',`${l.name} banked. ${this.banked}/3 safe.`);if(this.banked===3)this.finish('chor','all-loot');}
      else this.emit('hint','Bring a treasure here, then press E to bank it.');return;
    }
    if(this.carried){this.openConversation(this.carried,'carried');return;}
    const loot=this.loot.filter(l=>l.state==='ground'&&distance(l,c)<48).sort((a,b)=>distance(a,c)-distance(b,c))[0];
    if(loot)this.openConversation(loot);else this.emit('hint','Get close to a glowing treasure or a tea-stall chair, then press E.');
  }
  jump(){
    const a=this.chor;if(a.jump||this.hidden||a.stun>0)return;
    if(a.jumpCooldown>0||a.energy<18){this.emit('hint','Need 18 energy and a ready jump.');return;}
    let target=null,layer,roofId=null;
    if(a.layer==='ground'){
      const entry=ROOF_ACCESS.filter(p=>distance(a,p.ground)<48).sort((p,q)=>distance(a,p.ground)-distance(a,q.ground))[0];
      if(entry){target=entry.roof;layer='roof';roofId=entry.buildingId;}
    }else{
      const entry=ROOF_ACCESS.find(p=>p.buildingId===a.roofId);
      if(entry&&distance(a,entry.roof)<47){target=entry.ground;layer='ground';}
      else{
        const targets=BUILDINGS.filter(b=>b.climbable!==false&&b.id!==a.roofId).map(b=>({b,p:{x:clamp(a.x+Math.cos(a.dir)*80,b.x*TILE+16,(b.x+b.w)*TILE-16),y:clamp(a.y+Math.sin(a.dir)*80,b.y*TILE+16,(b.y+b.h)*TILE-16)}})).filter(({p})=>distance(a,p)<=122&&((p.x-a.x)*Math.cos(a.dir)+(p.y-a.y)*Math.sin(a.dir))>12).sort((p,q)=>distance(a,p.p)-distance(a,q.p));
        if(targets.length){target=targets[0].p;layer='roof';roofId=targets[0].b.id;}
      }
    }
    if(!target){this.emit('hint',a.layer==='roof'?'Move to an edge facing a nearby roof, or return to the amber exit.':'Find an amber ladder beside a shop. Space climbs to the roof.');return;}
    a.energy-=18;a.jumpCooldown=1.1;a.jump={from:{x:a.x,y:a.y},to:{...target},fromLayer:a.layer,targetLayer:layer,roofId,t:0,duration:.44};a.layer='air';this.negotiation=null;this.stats.jumps++;if(this.carried)this.carried.trust=Math.max(0,this.carried.trust-.08);this.emit('jump',layer==='roof'?'Up on the rooftops. Ground patrols cannot tag you here.':'Back on the street.');
  }
  throwNet(){
    if(this.netCooldown>0||this.cop.stun>0)return;
    this.netCooldown=5;this.netVisual=.35;
    if(this.catchable&&distance(this.cop,this.chor)<90&&lineOfSight(this.cop,this.chor)){this.chor.stun=1.5;this.emit('net','Net landed. Close in for the tag!');this.say('chor',SHARED_LINES.net,{priority:3});}
    else this.emit('net',this.hidden||this.chor.layer!=='ground'?'No clear target. Tea camouflage and rooftops block nets.':'Net missed. It reaches 90 pixels with a clear view.');
  }
  move(a,dx,dy,sprint,dt,speed){
    a.moving=false;a.sprinting=false;if(a.seated||a.jump){a.energy=clamp(a.energy+18*dt,0,100);return;}
    const len=Math.hypot(dx,dy);if(len>.01&&a.stun<=0){dx/=len;dy/=len;a.dir=Math.atan2(dy,dx);const run=sprint&&a.energy>1;if(run){speed*=1.42;a.energy=clamp(a.energy-29*dt,0,100);a.sprinting=true;}else a.energy=clamp(a.energy+14*dt,0,100);
      const can=(x,y)=>a.layer==='roof'?roofAt(x,y)?.id===a.roofId:walkable(x,y);
      const step=speed*dt;let moved=false;if(can(a.x+dx*step,a.y)){a.x+=dx*step;moved=true;}if(can(a.x,a.y+dy*step)){a.y+=dy*step;moved=true;}a.moving=moved;if(moved)a.walk+=dt*(run?17:11);
    }else a.energy=clamp(a.energy+21*dt,0,100);
  }
  follow(a,target,dt,speed,sprint=false){
    a.planIn-=dt;if(a.planIn<=0){a.path=findPath(a,target);a.planIn=.45;}
    while(a.path.length&&distance(a,a.path[0])<3)a.path.shift();const p=a.path[0];
    if(p)this.move(a,p.x-a.x,p.y-a.y,sprint,dt,Math.min(speed,distance(a,p)/Math.max(.001,dt)/(sprint&&a.energy>1?1.42:1)));else this.move(a,0,0,false,dt,speed);
  }
  aiCop(dt){
    const c=this.chor,cop=this.cop,bush=BUSHES.some(b=>c.x>b.x&&c.x<b.x+b.w&&c.y>b.y&&c.y<b.y+b.h)&&!c.sprinting;
    const seen=!this.hidden&&c.layer==='ground'&&distance(cop,c)<(bush?68:275)&&lineOfSight(cop,c);
    const previous=cop.state;
    if(seen){this.alert=4.5;this.lastNoise={x:c.x,y:c.y};cop.state='chase';}
    else{this.alert=Math.max(0,this.alert-dt);cop.state=this.alert>0&&this.lastNoise?'investigate':'patrol';}
    if(this.hidden){cop.state='patrol';this.alert=0;this.lastNoise=null;}
    if(cop.state==='chase'&&previous!=='chase')this.say('cop',LINES.chase,{priority:2});
    if(previous==='chase'&&!seen)this.say('cop',LINES.escape,{priority:1});
    let target=cop.state==='patrol'?PATROL[this.patrol%PATROL.length]:this.lastNoise;
    if(distance(cop,target)<20&&cop.state==='patrol'){this.patrol++;cop.planIn=0;target=PATROL[this.patrol%PATROL.length];}
    const factor=this.difficulty==='easy' ? .83:this.difficulty==='hard'?1.1:1;
    this.follow(cop,target,dt,145*factor,seen&&distance(cop,c)<170&&cop.energy>27);
    if(this.difficulty==='hard'&&seen&&distance(cop,c)<75&&this.netCooldown<=0&&this.catchable)this.throwNet();
  }
  aiChor(dt){
    const c=this.chor,factor=this.difficulty==='easy' ? .94:this.difficulty==='hard'?1.04:1;
    if(this.hidden){if(c.seatTime>3.5)this.leaveTea();return;}
    if(this.negotiation){if(this.elapsed-this.negotiation.opened>.5)this.answer(this.negotiation.choices.findIndex(c=>c.correct));return;}
    if(this.carried){
      if(this.carried.trust<.28){this.openConversation(this.carried,'carried');return;}
      this.follow(c,SAFE,dt,176*factor*this.carried.slow,distance(c,this.cop)<190&&c.energy>25);
      if(distance(c,SAFE)<SAFE.radius-7)this.action('interact');
    }else{
      const goals=this.loot.filter(l=>l.state==='ground').map(l=>({l,path:findPath(c,l)})).filter(a=>a.path.length).sort((a,b)=>a.path.length-b.path.length);
      if(goals.length){this.follow(c,goals[0].l,dt,178*factor,distance(c,this.cop)<170&&c.energy>25);if(distance(c,goals[0].l)<42)this.openConversation(goals[0].l);}
    }
  }
  updateCars(dt,detect=true){
    if(!this.traffic)return;
    for(const car of this.cars){
      car.radioCooldown=Math.max(0,car.radioCooldown-dt);let budget=(car.aware>0?83:68)*dt;
      while(budget>0){const target=car.route[(car.index+1)%car.route.length],d=distance(car,target);if(d<.01){car.index=(car.index+1)%car.route.length;continue;}const step=Math.min(d,budget),dx=(target.x-car.x)/d,dy=(target.y-car.y)/d;car.x+=dx*step;car.y+=dy*step;car.dir=Math.atan2(dy,dx);budget-=step;if(step===d)car.index=(car.index+1)%car.route.length;}
      const c=this.chor,seen=detect&&this.catchable&&distance(car,c)<128&&lineOfSight(car,c)&&((c.x-car.x)*Math.cos(car.dir)+(c.y-car.y)*Math.sin(car.dir))>-16;
      car.aware=seen?Math.min(2,car.aware+dt):Math.max(0,car.aware-dt*2);
      if(seen&&car.aware>.7&&car.radioCooldown<=0){this.lastNoise={x:c.x,y:c.y};this.alert=5;this.cop.planIn=0;car.radioCooldown=8;this.emit('patrol','Patrol spotted you! Break sight, jump up, or find chai.');}
      if(seen&&car.aware>.8&&distance(car,c)<24)this.tag('patrol');
    }
  }
  tag(source='cop'){
    if(!this.catchable||this.phase!=='playing')return false;
    this.catches++;this.burst(this.chor.x,this.chor.y,'#ed7950',18);
    if(this.carried){const l=this.carried;l.state='ground';l.x=l.origin.x;l.y=l.origin.y;l.trust=0;this.carried=null;}
    this.negotiation=null;this.alert=0;this.lastNoise=null;this.cop.state='patrol';this.say('cop',LINES.caught,{priority:3});this.emit('catch',`${source==='patrol'?'Patrol tag':'Pakde gaye'}! ${3-this.catches} chances left.`);
    if(this.catches>=3){this.finish('cop','three-catches');return true;}
    Object.assign(this.chor,actor('chor',CHOR_SPAWN.x,CHOR_SPAWN.y),{invuln:4});Object.assign(this.cop,actor('cop',STATION.x,STATION.y),{stun:1.5,state:'patrol'});this.cars.forEach(c=>c.aware=0);return true;
  }
  eventStep(){
    for(const e of this.eventPlan){
      if(!e.announced&&this.elapsed>=e.start-4){e.announced=true;this.eventBanner={type:e.type,stage:'soon',until:e.start};this.emit('event',`${EVENT_TYPES[e.type].title} in 4 seconds.`);}
      if(!e.started&&this.elapsed>=e.start){e.started=true;this.activeEvent={...e,end:e.start+e.duration};this.eventBanner={type:e.type,stage:'active',until:e.start+e.duration};this.emit('event',`${EVENT_TYPES[e.type].title}: ${EVENT_TYPES[e.type].description}`);
        const free=shuffled(SPAWN_CANDIDATES.filter(p=>walkable(p.x,p.y)&&!this.loot.some(l=>l.state==='ground'&&distance(p,l)<50)),this.rand);
        if(e.type==='chai')this.chai.push(...free.slice(0,3).map(p=>({...p,cooldown:0,temporary:true})));
        if(e.type==='sprint')this.boosts=free.slice(0,2).map(p=>({...p,active:true}));
        if(e.type==='decoy'){const p=free.find(p=>distance(p,this.chor)>230)||free[0];this.decoy={...p};this.lastNoise={x:p.x,y:p.y};this.alert=8;this.cop.planIn=0;}
      }
      if(e.started&&!e.done&&this.elapsed>=e.start+e.duration){e.done=true;this.activeEvent=null;this.eventBanner=null;this.chai=this.chai.filter(p=>!p.temporary);this.boosts=[];this.decoy=null;}
    }
  }
  finish(winner,reason){if(this.phase!=='playing')return;this.phase='ended';this.winner=winner;this.reason=reason;this.negotiation=null;this.eventBanner=null;this.activeEvent=null;this.boosts=[];this.decoy=null;this.chai=this.chai.filter(p=>!p.temporary);this.emit('end',winner==='chor'?'Three treasures banked. Chor wins!':reason==='timeout'?'Time is up. The cop holds the gully!':'Three tags. Cop wins!');this.say(winner==='chor'?'chor':'cop',winner==='chor'?LINES.victory:SHARED_LINES.copWin,{priority:3});}
  update(dt,input={}){
    if(this.phase!=='playing')return;
    dt=clamp(dt,0,.05);this.elapsed+=dt;this.remaining=Math.max(0,ROUND_SECONDS-this.elapsed);this.eventStep();
    for(const a of [this.chor,this.cop]){a.stun=Math.max(0,a.stun-dt);a.invuln=Math.max(0,a.invuln-dt);a.jumpCooldown=Math.max(0,a.jumpCooldown-dt);if(a.seated)a.seatTime+=dt;if(a.jump){const j=a.jump;j.t=Math.min(1,j.t+dt/j.duration);a.x=j.from.x+(j.to.x-j.from.x)*j.t;a.y=j.from.y+(j.to.y-j.from.y)*j.t;if(j.t>=1){a.layer=j.targetLayer;a.roofId=j.roofId;a.jump=null;}}}
    this.netCooldown=Math.max(0,this.netCooldown-dt);this.netVisual=Math.max(0,this.netVisual-dt);this.boostTime=Math.max(0,this.boostTime-dt);
    const ci=input.chor||{},pi=input.cop||{},speed=178*(this.carried?.slow||1)*(this.boostTime>0?1.25:1);
    if(this.duo||this.role==='chor')this.move(this.chor,ci.x||0,ci.y||0,!!ci.sprint,dt,speed);else this.aiChor(dt);
    if(this.phase!=='playing')return;
    if(this.duo||this.role==='cop'){this.move(this.cop,pi.x||0,pi.y||0,!!pi.sprint,dt,181);this.cop.state=this.alert>0?'investigate':'patrol';}else this.aiCop(dt);
    this.updateCars(dt);if(this.phase!=='playing')return;
    if(this.catchable&&distance(this.chor,this.cop)<24&&this.cop.stun<=0)this.tag();if(this.phase!=='playing')return;
    if(this.negotiation?.mode==='pickup'){const l=this.loot.find(l=>l.id===this.negotiation.lootId);if(distance(l,this.chor)>67||this.chor.layer!=='ground')this.negotiation=null;}
    if(this.carried){const l=this.carried;l.x=this.chor.x;l.y=this.chor.y;l.trust=Math.max(0,l.trust-dt*(this.hidden?0:this.chor.sprinting ? .052 : .031));this.chatter-=dt;
      if(this.chatter<=0&&!this.hidden){this.chatter=l.interval;if(l.trust<.25){this.noise(this.chor,l.noise);this.say(l.id,l.complaints,{priority:2});}else this.say(l.id,l.trust>.7?SHARED_LINES.quiet:SHARED_LINES.waiting,{priority:1});}}
    for(const p of this.chai){p.cooldown=Math.max(0,p.cooldown-dt);if(p.cooldown===0)for(const a of [this.chor,this.cop])if(a.layer==='ground'&&distance(a,p)<24&&a.energy<85){a.energy=100;p.cooldown=16;this.burst(p.x,p.y,'#e4be69');this.emit('chai','A cutting chai. Energy restored.');break;}}
    if(this.chor.layer==='ground')for(const p of this.boosts)if(p.active&&distance(p,this.chor)<25){p.active=false;this.boostTime=7;this.emit('boost','Chutney Sprint! Seven seconds of extra speed.');this.burst(p.x,p.y,'#9bc66c');}
    this.neighborIn-=dt;if(this.neighborIn<=0){this.neighborIn=20+this.rand()*7;this.say('neighbor',LINES.neighbor,{priority:1,anchor:{x:336,y:560}});}
    this.speech.forEach(s=>s.life-=dt);this.speech=this.speech.filter(s=>s.life>0);this.rings.forEach(r=>{r.life-=dt;r.r+=(r.max-10)/r.total*dt;});this.rings=this.rings.filter(r=>r.life>0);
    this.particles.forEach(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=40*dt;});this.particles=this.particles.filter(p=>p.life>0);if(this.remaining<=0)this.finish('cop','timeout');
  }
  hint(){
    if(this.hidden)return 'Tea camouflage · invisible and safe. E to leave. The clock keeps running.';
    if(this.chor.layer==='roof')return 'Rooftop route · Space at an amber exit to descend, or face a nearby roof to leap.';
    if(this.role==='cop'&&!this.duo)return this.netCooldown>0?`Net recharging · ${Math.ceil(this.netCooldown)}s`:'Follow the noise. Space nets. Rooftops and seated chai drinkers are protected.';
    if(this.carried&&distance(this.chor,SAFE)<SAFE.radius)return 'E · Bank your loot';
    if(TEA_SPOTS.some(p=>distance(p,this.chor)<42))return 'E · Sit for chai and disappear';
    if(this.carried)return `${this.carried.name} · ${this.carried.trust<.35?'F · Make a new offer before it shouts':'Follow the dotted trail home'}`;
    const l=this.loot.find(l=>l.state==='ground'&&distance(l,this.chor)<70);if(l)return `${l.name} wants ${l.desire}. E · Make an offer`;
    if(ROOF_ACCESS.some(p=>distance(p.ground,this.chor)<48))return 'Space · Jump onto this rooftop';
    return 'Find a numbered treasure. E opens a conversation. Make it the right offer.';
  }
}

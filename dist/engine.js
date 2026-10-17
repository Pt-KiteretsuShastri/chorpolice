/** Pure game simulation. No DOM, assets, network, or browser APIs. */
export const TILE = 32;
export const COLS = 30;
export const ROWS = 20;
export const WIDTH = COLS * TILE;
export const HEIGHT = ROWS * TILE;
export const ROUND_SECONDS = 120;
export const SAFE = { x: 80, y: 560, radius: 49 };
export const STATION = { x: 880, y: 176 };
export const BUILDINGS = [
  { x:3,y:3,w:5,h:3,roof:'#bd8167',wall:'#e2b693',name:'SEETI KITCHEN',kind:'kitchen' },
  { x:11,y:3,w:5,h:3,roof:'#8b9c7b',wall:'#d5d0a6',name:'GULLY LIBRARY',kind:'library' },
  { x:20,y:3,w:5,h:4,roof:'#c39c56',wall:'#ebcb8a',name:'SAMOSA CORNER',kind:'samosa' },
  { x:3,y:9,w:4,h:4,roof:'#809b91',wall:'#b6ccbb',name:'GUPTA GENERAL',kind:'shop' },
  { x:11,y:10,w:6,h:3,roof:'#b37d77',wall:'#ddb7a8',name:'DRAMA CLUB',kind:'drama' },
  { x:22,y:10,w:4,h:4,roof:'#879da0',wall:'#bdd0cc',name:'CYCLE REPAIR',kind:'cycle' },
  { x:9,y:16,w:5,h:2,roof:'#aa9568',wall:'#d7c9a0',name:'CHAI & GOSSIP',kind:'chai' },
  { x:18,y:16,w:6,h:2,roof:'#a79982',wall:'#dccfb5',name:'SHARMA NIWAS',kind:'home' },
  { x:26,y:2,w:3,h:2,roof:'#477a86',wall:'#a8c5c7',name:'POLICE CHOWKI',kind:'police' }
];
// Props share the tile grid with buildings so art, movement, and AI agree.
export const SOLID_PROPS = [
  {x:11,y:6,w:2,h:1,kind:'cart'},
  {x:27,y:11,w:1,h:2,kind:'auto'},
  {x:1,y:10,w:1,h:1,kind:'tree'},
  {x:20,y:10,w:1,h:1,kind:'tree'},
  {x:7,y:1,w:1,h:1,kind:'tree'},
  {x:26,y:17,w:1,h:1,kind:'tree'},
  {x:5,y:18,w:1,h:1,kind:'tree'}
];
export const BUSHES = [{x:288,y:273,w:64,h:35},{x:550,y:462,w:62,h:35},{x:802,y:280,w:62,h:37},{x:140,y:480,w:60,h:34}];
export const LOOT_TYPES = [
  {id:'cooker',name:'Chef Seeti',short:'COOKER',color:'#aac4b4',x:176,y:240,interval:4.7,noise:260,slow:0.96,lines:['Main pressure mein hoon!','Seeti bajegi, boss!','Gas toh band ki thi na?']},
  {id:'trophy',name:'Sir Jeet-a-Lot',short:'TROPHY',color:'#edc869',x:448,y:464,interval:6.5,noise:215,slow:0.88,lines:['Mera award kahan hai?','Applause, please!','Best supporting chor!']},
  {id:'samosa',name:'Samosa Singh',short:'SAMOSA',color:'#eaa66b',x:816,y:240,interval:5.7,noise:230,slow:1,lines:['Bhai, chutney toh le le!','Thanda ho raha hoon!','Mujhe kha mat lena!']}
];
const CHAI_SPOTS = [{x:304,y:464},{x:592,y:272},{x:880,y:496}];
const PATROL = [{x:880,y:240},{x:592,y:240},{x:592,y:464},{x:240,y:464},{x:80,y:240},{x:304,y:80},{x:592,y:80},{x:880,y:560}];
export const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));

export function buildGrid() {
  const grid = Array.from({length:ROWS},(_,y)=>Array.from({length:COLS},(_,x)=>x===0||y===0||x===COLS-1||y===ROWS-1?1:0));
  for (const b of [...BUILDINGS,...SOLID_PROPS]) for(let y=b.y;y<b.y+b.h;y++) for(let x=b.x;x<b.x+b.w;x++) grid[y][x]=1;
  return grid;
}
export const GRID = buildGrid();
export function walkable(x,y,radius=10) {
  if(!Number.isFinite(x)||!Number.isFinite(y))return false;
  for(const [dx,dy] of [[-radius,-radius],[radius,-radius],[-radius,radius],[radius,radius]]){
    const tx=Math.floor((x+dx)/TILE),ty=Math.floor((y+dy)/TILE);
    if(!GRID[ty]||GRID[ty][tx]!==0)return false;
  }
  return true;
}
export function findPath(from,to) {
  const sx=Math.floor(from.x/TILE),sy=Math.floor(from.y/TILE),tx=Math.floor(to.x/TILE),ty=Math.floor(to.y/TILE);
  if(!GRID[sy]||GRID[sy][sx]!==0||!GRID[ty]||GRID[ty][tx]!==0)return [];
  const start=sy*COLS+sx,goal=ty*COLS+tx;
  const queue=[start],previous=new Map([[start,-1]]);
  for(let i=0;i<queue.length&&!previous.has(goal);i++){
    const q=queue[i],x=q%COLS,y=Math.floor(q/COLS);
    for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){
      const nx=x+dx,ny=y+dy,k=ny*COLS+nx;
      if(GRID[ny]?.[nx]===0&&!previous.has(k)){previous.set(k,q);queue.push(k);}
    }
  }
  if(!previous.has(goal))return [];
  const route=[];
  for(let k=goal;k!==-1;k=previous.get(k))route.push({x:(k%COLS+.5)*TILE,y:(Math.floor(k/COLS)+.5)*TILE});
  route.reverse();
  if(route.length>1 && distance(from,route[0])<3)route.shift();
  return route;
}
export function lineOfSight(a,b) {
  const steps=Math.ceil(distance(a,b)/12);
  for(let i=1;i<steps;i++){
    const t=i/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
    if(GRID[Math.floor(y/TILE)]?.[Math.floor(x/TILE)]!==0)return false;
  }
  return true;
}
function actor(kind,x,y){return {kind,x,y,dir:0,moving:false,sprinting:false,energy:100,stun:0,invuln:0,path:[],planIn:0,walk:0};}

export class Game {
  constructor({role='chor',duo=false,difficulty='normal'}={}){
    this.role=role;this.duo=duo;this.difficulty=difficulty;
    this.elapsed=0;this.remaining=ROUND_SECONDS;this.phase='ready';this.winner=null;this.reason='';
    this.chor=actor('chor',SAFE.x,SAFE.y-47);this.cop=actor('cop',STATION.x,STATION.y);
    this.loot=LOOT_TYPES.map(l=>({...l,state:'ground',origin:{x:l.x,y:l.y}}));
    this.carried=null;this.banked=0;this.catches=0;this.hushed=0;this.chatter=3.5;this.netCooldown=0;this.netVisual=0;
    this.speech=[];this.rings=[];this.particles=[];this.events=[];this.alert=0;this.lastNoise=null;
    this.patrol=0;this.aiActionCooldown=0;this.chai=CHAI_SPOTS.map(p=>({...p,cooldown:0}));
    this.randomSeed=71;
  }
  rand(){this.randomSeed=(this.randomSeed*16807)%2147483647;return(this.randomSeed-1)/2147483646;}
  start(){if(this.phase==='ready'){this.phase='playing';this.emit('start',this.duo?'Duo chase! Chor: WASD. Cop: arrows.':this.role==='chor'?'Bank all three treasures at the green safehouse.':'Tag the chor three times. Space throws a net.');}}
  emit(type,text,extra={}){this.events.push({type,text,...extra});}
  drainEvents(){return this.events.splice(0);}
  say(who,text,color='#23483d'){
    this.speech=this.speech.filter(s=>s.who!==who);
    this.speech.push({who,text,color,life:2.7});
  }
  burst(x,y,color,n=12){for(let i=0;i<n;i++){const a=this.rand()*Math.PI*2,s=25+this.rand()*65;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.5+this.rand()*.5,color});}}
  action(kind){
    if(this.phase!=='playing')return;
    const c=this.chor;
    if(kind==='net'){this.throwNet();return;}
    if(kind==='hush'){
      if(!this.carried){this.emit('hint','Your bag is empty. Find a glowing treasure.');return;}
      if(this.hushed>0){this.emit('hint','Already hushed. Enjoy the silence.');return;}
      if(c.energy<25){this.emit('hint','Need 25 energy to hush. Grab a cup of chai.');return;}
      c.energy-=25;this.hushed=5;this.say('chor','Shhh. Police hai!');this.emit('hush','Loot hushed for 5 seconds.');return;
    }
    if(kind==='drop'&&this.carried){const l=this.carried;l.state='ground';l.x=c.x;l.y=c.y;this.carried=null;this.hushed=0;this.say('chor','Tu yahin ruk.');this.emit('drop','Loot dropped. Press E nearby to pick it up again.');return;}
    if(kind!=='interact')return;
    if(distance(c,SAFE)<SAFE.radius){
      if(this.carried){
        const l=this.carried;l.state='banked';this.carried=null;this.banked++;this.hushed=0;
        this.burst(SAFE.x,SAFE.y,'#eac363',24);this.say('chor',this.banked===3?'Party toh banti hai!':'Maal safe. Next!');
        c.energy=clamp(c.energy+20,0,100);this.emit('bank',`${l.name} banked! ${this.banked}/3 safe.`);
        if(this.banked===3)this.finish('chor','all-loot');return;
      }
      this.emit('hint','This is your safehouse. Bring a treasure here and press E.');return;
    }
    if(this.carried){this.emit('hint','One treasure at a time. Bring this one home, or press Q to drop.');return;}
    const nearby=this.loot.filter(l=>l.state==='ground'&&distance(l,c)<43).sort((a,b)=>distance(a,c)-distance(b,c))[0];
    if(nearby){nearby.state='carried';this.carried=nearby;this.chatter=2.6;this.hushed=0;this.say('chor','Aaja, mere saath.');this.emit('pickup',`${nearby.name} grabbed. Bank at the green safehouse!`);this.burst(c.x,c.y,nearby.color);}
    else this.emit('hint','Move closer to a glowing treasure, then press E.');
  }
  throwNet(){
    if(this.netCooldown>0){this.emit('hint',`Net ready in ${Math.ceil(this.netCooldown)}s.`);return;}
    if(this.cop.stun>0)return;
    this.netCooldown=5;this.netVisual=.4;
    this.rings.push({x:this.cop.x,y:this.cop.y,r:8,max:85,life:.45,total:.45,color:'#678c9c'});
    if(distance(this.cop,this.chor)<86&&lineOfSight(this.cop,this.chor)&&this.chor.invuln<=0){this.chor.stun=1.7;this.say('chor','Arre, net band karo!');this.emit('net','Net landed! Move in to tag the chor.');}
    else{this.say('cop','Agli baar pakka!');this.emit('net','Net thrown. Get within range before trying again.');}
  }
  move(a,dx,dy,sprint,dt,speed){
    a.moving=false;a.sprinting=false;
    const length=Math.hypot(dx,dy);
    if(length>.01&&a.stun<=0){
      dx/=length;dy/=length;a.dir=Math.atan2(dy,dx);
      const running=sprint&&a.energy>1;
      if(running){speed*=1.45;a.energy=clamp(a.energy-32*dt,0,100);a.sprinting=true;}else a.energy=clamp(a.energy+15*dt,0,100);
      const step=speed*dt;
      if(walkable(a.x+dx*step,a.y))a.x+=dx*step;
      if(walkable(a.x,a.y+dy*step))a.y+=dy*step;
      a.moving=true;a.walk+=dt*(running?17:11);
    }else a.energy=clamp(a.energy+22*dt,0,100);
  }
  follow(a,target,dt,speed,sprint=false){
    a.planIn-=dt;
    if(a.planIn<=0){a.path=findPath(a,target);a.planIn=.65;}
    while(a.path.length&&distance(a,a.path[0])<4)a.path.shift();
    const p=a.path[0];
    if(p)this.move(a,p.x-a.x,p.y-a.y,sprint,dt,Math.min(speed,distance(a,p)/Math.max(.001,dt)/(sprint&&a.energy>1?1.45:1)));
    else this.move(a,0,0,false,dt,speed);
  }
  aiCop(dt){
    const cop=this.cop,c=this.chor;
    const hiding=BUSHES.some(b=>c.x>b.x&&c.x<b.x+b.w&&c.y>b.y&&c.y<b.y+b.h)&&!c.sprinting;
    const seen=distance(cop,c)<(hiding?68:240)&&lineOfSight(cop,c);
    if(seen){this.alert=4.5;this.lastNoise={x:c.x,y:c.y};}
    else this.alert=Math.max(0,this.alert-dt);
    let target;
    if(this.alert>0&&this.lastNoise)target=this.lastNoise;
    else{target=PATROL[this.patrol%PATROL.length];if(distance(cop,target)<20){this.patrol++;cop.planIn=0;target=PATROL[this.patrol%PATROL.length];}}
    const factor=this.difficulty==='easy'?.8:this.difficulty==='hard'?1.12:1;
    this.follow(cop,target,dt,109*factor,seen&&distance(cop,c)<170&&cop.energy>28);
    if(this.difficulty==='hard'&&seen&&distance(cop,c)<73&&this.netCooldown<=0&&c.invuln<=0)this.throwNet();
  }
  aiChor(dt){
    const c=this.chor,factor=this.difficulty==='easy'?.88:this.difficulty==='hard'?1.08:1;
    if(this.carried){
      this.follow(c,SAFE,dt,124*factor*this.carried.slow,distance(c,this.cop)<160&&c.energy>20);
      if(distance(c,SAFE)<SAFE.radius-8)this.action('interact');
      if(distance(c,this.cop)<180&&this.hushed<=0&&c.energy>45)this.action('hush');
    }else{
      const options=this.loot.filter(l=>l.state==='ground').map(l=>({l,path:findPath(c,l)})).filter(p=>p.path.length).sort((a,b)=>a.path.length-b.path.length);
      if(options.length){this.follow(c,options[0].l,dt,128*factor,distance(c,this.cop)<150&&c.energy>25);if(distance(c,options[0].l)<35)this.action('interact');}
    }
  }
  tag(){
    if(this.chor.invuln>0)return;
    this.catches++;this.emit('catch',`Pakde gaye! ${3-this.catches} chances left.`);this.burst(this.chor.x,this.chor.y,'#ed7950',20);
    if(this.carried){const l=this.carried;l.state='ground';l.x=l.origin.x;l.y=l.origin.y;this.carried=null;}
    this.hushed=0;this.alert=0;this.lastNoise=null;
    if(this.catches>=3){this.finish('cop','three-catches');return;}
    Object.assign(this.chor,{x:SAFE.x,y:SAFE.y-47,invuln:4,stun:0,energy:100,path:[],planIn:0});
    Object.assign(this.cop,{x:STATION.x,y:STATION.y,stun:1.4,path:[],planIn:0});
    this.say('cop','Pakad liya!');
  }
  finish(winner,reason){if(this.phase!=='playing')return;this.phase='ended';this.winner=winner;this.reason=reason;this.emit('end',winner==='chor'?'All the maal is home. Chor wins!':reason==='timeout'?'Time’s up. Cop wins!':'Three tags. Cop wins!');}
  update(dt,input={}){
    if(this.phase!=='playing')return;
    dt=clamp(dt,0,.05);this.elapsed+=dt;this.remaining=Math.max(0,ROUND_SECONDS-this.elapsed);
    for(const a of [this.chor,this.cop]){a.stun=Math.max(0,a.stun-dt);a.invuln=Math.max(0,a.invuln-dt);}
    this.hushed=Math.max(0,this.hushed-dt);this.netCooldown=Math.max(0,this.netCooldown-dt);this.netVisual=Math.max(0,this.netVisual-dt);
    const ci=input.chor||{},pi=input.cop||{};
    if(this.duo||this.role==='chor')this.move(this.chor,ci.x||0,ci.y||0,!!ci.sprint,dt,136*(this.carried?.slow||1));else this.aiChor(dt);
    if(this.phase!=='playing')return;
    if(this.duo||this.role==='cop')this.move(this.cop,pi.x||0,pi.y||0,!!pi.sprint,dt,139);else this.aiCop(dt);
    if(distance(this.chor,this.cop)<24&&this.cop.stun<=0)this.tag();
    if(this.phase!=='playing')return;
    if(this.carried){
      this.carried.x=this.chor.x;this.carried.y=this.chor.y;
      this.chatter-=dt;
      if(this.chatter<=0&&this.hushed<=0){
        const l=this.carried;this.chatter=l.interval;this.say('chor',l.lines[Math.floor(this.rand()*l.lines.length)],'#9d6339');
        this.rings.push({x:this.chor.x,y:this.chor.y,r:10,max:l.noise,life:1.6,total:1.6,color:'#d78252'});
        if(distance(this.cop,this.chor)<l.noise){this.alert=5;this.lastNoise={x:this.chor.x,y:this.chor.y};this.cop.planIn=0;this.say('cop','Awaaz kahan se aayi?');}
        this.emit('chatter',`${l.name}: “${l.lines[Math.floor(this.rand()*l.lines.length)]}”`);
      }
    }
    for(const p of this.chai){
      p.cooldown=Math.max(0,p.cooldown-dt);
      if(p.cooldown===0){for(const a of [this.chor,this.cop])if(distance(a,p)<24&&a.energy<85){a.energy=100;p.cooldown=16;this.burst(p.x,p.y,'#e1bd63');this.say(a.kind,'Chai peelo, friends!');this.emit('chai','Chai break! Sprint energy restored.');break;}}
    }
    this.speech.forEach(s=>s.life-=dt);this.speech=this.speech.filter(s=>s.life>0);
    this.rings.forEach(r=>{r.life-=dt;r.r+=(r.max-10)/r.total*dt;});this.rings=this.rings.filter(r=>r.life>0);
    this.particles.forEach(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=40*dt;});this.particles=this.particles.filter(p=>p.life>0);
    if(this.remaining<=0)this.finish('cop','timeout');
  }
  hint(){
    if(this.role==='cop'&&!this.duo)return this.netCooldown>0?`Net recharging · ${Math.ceil(this.netCooldown)}s`:'Space: throw net when close. Tag the chor on contact.';
    if(this.carried&&distance(this.chor,SAFE)<SAFE.radius)return 'E · BANK YOUR LOOT';
    const nearby=this.loot.find(l=>l.state==='ground'&&distance(l,this.chor)<43);
    if(!this.carried&&nearby)return `E · GRAB ${nearby.short}`;
    if(this.carried)return this.hushed>0?`Hushed · ${Math.ceil(this.hushed)}s. Bring it home!`:'Head to the green safehouse. F hushes noisy loot.';
    return 'Find a glowing treasure. Press E to grab it.';
  }
}

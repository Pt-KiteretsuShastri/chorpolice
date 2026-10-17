/** Host-authoritative state transfer. Guests send controls, never positions or scores. */
import {LOOT_TYPES} from './dialogue.js';
import {WIDTH,HEIGHT,MAP_VERSION,clamp,distance} from './world.js';
export const PROTOCOL=`gully-v3-${MAP_VERSION}`;
const ACTOR_FIELDS=['x','y','dir','moving','sprinting','energy','stun','invuln','walk','layer','roofId','jump','jumpCooldown','seated','seatTime','state'];
const STATE_FIELDS=['seed','signature','theme','phase','elapsed','remaining','banked','catches','winner','reason','netCooldown','netVisual','boostTime','stats','speech','rings','particles','chai','boosts','decoy','activeEvent','eventBanner'];
const fields=(value,names)=>Object.fromEntries(names.filter(k=>value[k]!==undefined).map(k=>[k,value[k]]));
const clone=value=>JSON.parse(JSON.stringify(value));
export function snapshot(game,round=1){
  return clone({protocol:PROTOCOL,round,...fields(game,STATE_FIELDS),chor:fields(game.chor,ACTOR_FIELDS),cop:fields(game.cop,ACTOR_FIELDS),loot:game.loot.map(l=>fields(l,['id','x','y','origin','district','state','trust','layer'])),carried:game.carried?.id||null,cars:game.cars.map(c=>fields(c,['id','x','y','dir','aware']))});
}
export function validSnapshot(s){
  const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=-32&&p.x<=WIDTH+32&&p.y>=-64&&p.y<=HEIGHT+32;
  return !!(s&&s.protocol===PROTOCOL&&Number.isInteger(s.round)&&s.round>0&&Number.isInteger(s.seed)&&['ready','playing','paused','ended'].includes(s.phase)&&Number.isFinite(s.remaining)&&s.remaining>=0&&s.remaining<=120&&Number.isFinite(s.elapsed)&&[s.chor,s.cop].every(a=>point(a)&&Number.isFinite(a.energy)&&['ground','roof','air'].includes(a.layer))&&Array.isArray(s.loot)&&s.loot.length===3&&new Set(s.loot.map(l=>l.id)).size===3&&s.loot.every(l=>LOOT_TYPES.some(t=>t.id===l.id)&&point(l)&&['ground','carried','banked'].includes(l.state))&&Array.isArray(s.cars)&&s.cars.length===2&&s.cars.every(point)&&Array.isArray(s.speech)&&s.speech.length<=3&&Array.isArray(s.particles)&&s.particles.length<=200&&Array.isArray(s.chai)&&s.chai.length<=6&&Number.isInteger(s.banked)&&s.banked>=0&&s.banked<=3&&Number.isInteger(s.catches)&&s.catches>=0&&s.catches<=3);
}
export function applySnapshot(game,state,role='cop'){
  if(!validSnapshot(state))return false;
  const s=clone(state);Object.assign(game,fields(s,STATE_FIELDS));
  Object.assign(game.chor,fields(s.chor,ACTOR_FIELDS));Object.assign(game.cop,fields(s.cop,ACTOR_FIELDS));
  game.loot=s.loot.map(l=>({...LOOT_TYPES.find(t=>t.id===l.id),...l}));game.carried=game.loot.find(l=>l.id===s.carried)||null;
  game.cars.forEach((c,i)=>Object.assign(c,s.cars[i]));game.negotiation=null;game.duo=true;game.online=true;game.role=role;return true;
}
export class HostControls{
  constructor(round=1){this.reset(round);}
  reset(round){this.round=round;this.seq=-1;this.actionSeq=-1;this.last=-Infinity;this.input={x:0,y:0,sprint:false};}
  accept(message,now){
    if(!message||message.round!==this.round||!Number.isSafeInteger(message.seq)||message.seq<=this.seq||!message.input||!Number.isFinite(message.input.x)||!Number.isFinite(message.input.y)||Math.abs(message.input.x)>1||Math.abs(message.input.y)>1)return false;
    this.seq=message.seq;this.last=now;this.input={x:message.input.x,y:message.input.y,sprint:message.input.sprint===true};return true;
  }
  current(now){return now-this.last<300?this.input:{x:0,y:0,sprint:false};}
  action(message,game){if(message?.round===this.round&&Number.isSafeInteger(message.seq)&&message.seq>this.actionSeq&&message.action==='net'&&game.phase==='playing'){this.actionSeq=message.seq;game.action('net');return true;}return false;}
}
export class RemoteView{
  constructor(){this.round=0;this.seq=-1;this.transition=null;}
  accept(game,s,seq,now){
    if(!Number.isSafeInteger(seq)||seq<0||!validSnapshot(s)||s.round<this.round||(s.round===this.round&&seq<=this.seq))return false;
    const actors=[game.chor,game.cop,...game.cars],from=actors.map(p=>({x:p.x,y:p.y})),fresh=s.round!==this.round;
    if(!applySnapshot(game,s))return false;
    const to=[game.chor,game.cop,...game.cars].map(p=>({x:p.x,y:p.y}));this.transition={from,to,at:now,snap:fresh};this.round=s.round;this.seq=seq;return true;
  }
  interpolate(game,now){if(!this.transition)return;const {from,to,at,snap}=this.transition,f=clamp((now-at)/50,0,1);[game.chor,game.cop,...game.cars].forEach((a,i)=>{const t=snap||distance(from[i],to[i])>150?1:f;a.x=from[i].x+(to[i].x-from[i].x)*t;a.y=from[i].y+(to[i].y-from[i].y)*t;});}
}

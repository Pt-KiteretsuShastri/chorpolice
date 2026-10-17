import { Game, ROUND_SECONDS } from './engine.js';
import { Renderer } from './renderer.js';

const $=id=>document.getElementById(id);
const canvas=$('game');canvas.tabIndex=0;
let game=new Game(),renderer,role='chor',duo=false,starting=false,countTimer=null,lastTime=0,lastUi=0,lastStatus=0,endedHandled=false;
let keys=new Set(),touch={x:0,y:0,sprint:false},sound=false,audio=null,reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let records={};
try{records=JSON.parse(localStorage.getItem('gully-chase-records')||'{}');if(!records||typeof records!=='object'||Array.isArray(records))records={};}catch{records={};}
const fmt=n=>`${Math.floor(Math.max(0,n)/60)}:${String(Math.floor(Math.max(0,n)%60)).padStart(2,'0')}`;

function setStatus(msg){$('status').textContent=msg;lastStatus=performance.now();}
function showError(error){console.error(error);$('load-error').hidden=false;$('error-copy').textContent=error?.message||'Please reload the page to try again.';if(countTimer)clearInterval(countTimer);starting=false;}
function beep(kind){
  if(!sound)return;
  try{
    audio ||= new (window.AudioContext||window.webkitAudioContext)();
    if(audio.state==='suspended')audio.resume().catch(()=>{});
    const notes={pickup:[440,660],bank:[523,659,784],catch:[330,220,165],end:[392,523,659,784],chatter:[330,400],hush:[294,262],net:[180,220],chai:[440,554,660],start:[392,523]}[kind];
    if(!notes)return;
    notes.forEach((freq,i)=>{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*.09;o.type=kind==='chatter'?'triangle':'sine';o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.055,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+.15);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.16);});
  }catch{sound=false;updateSound();}
}
function updateSound(){const b=$('sound-btn');b.setAttribute('aria-label',sound?'Mute sound':'Turn sound on');b.title=sound?'Sound on':'Sound off';b.querySelector('.sound-slash').hidden=sound;}
function updateBest(){const r=records[role];$('best').textContent=r&&Number.isFinite(r.time)?`${role==='chor'?'Chor':'Cop'} · ${fmt(r.time)} · ${r.wins||1} wins`:'The gully awaits.';}
function setOptionsDisabled(disabled){document.querySelectorAll('[data-role]').forEach(b=>b.disabled=disabled);$('difficulty').disabled=disabled;$('duo-btn').disabled=disabled;}
function controls(){
  let hints;
  if(duo){hints='<span><kbd>WASD</kbd> chor</span><span><kbd>↑←↓→</kbd> cop</span><span><kbd>E</kbd> grab / bank</span><span><kbd>SHIFT</kbd> / <kbd>/</kbd> sprint</span><span><kbd>ENTER</kbd> net</span>';}
  else if(role==='cop'){hints='<span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / arrows move</span><span><kbd>SHIFT</kbd> sprint</span><span><kbd>SPACE</kbd> net</span><span><kbd>P</kbd> pause</span>';}
  else{hints='<span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> move</span><span><kbd>SHIFT</kbd> sprint</span><span><kbd>E</kbd> grab / bank</span><span><kbd>Q</kbd> drop</span><span><kbd>F</kbd> hush</span>';}
  $('controls').innerHTML=hints;
  $('touch-action').textContent=role==='cop'&&!duo?'Throw net':'Grab / bank';
  $('touch-special').textContent=role==='cop'&&!duo?'Net ready':'Hush';
  $('touch-special').disabled=role==='cop'&&!duo;
  $('mobile-controls').classList.toggle('duo-hidden',duo);
}
function clearInput(){keys.clear();held.clear();touch={x:0,y:0,sprint:false};document.querySelectorAll('[data-move]').forEach(b=>b.classList.remove('pressed'));}
function resetHome(){
  if(countTimer)clearInterval(countTimer);countTimer=null;starting=false;clearInput();duo=false;
  game=new Game({role,difficulty:$('difficulty').value});endedHandled=false;
  $('hud').hidden=true;$('energy-panel').hidden=true;$('play-actions').hidden=true;$('countdown').hidden=true;$('pause-screen').hidden=true;$('result-screen').hidden=true;
  $('welcome-tag').hidden=false;$('map-tip').hidden=false;$('start-label').textContent='Let’s play';$('live-label').textContent='GULLY IS OPEN';
  setOptionsDisabled(false);controls();setStatus('Childhood nostalgia. Unreasonably opinionated objects.');updateBest();
}
function startRound(isDuo=false){
  if(starting)return;
  if(game.phase==='playing'||game.phase==='paused'){togglePause();return;}
  clearInput();duo=isDuo;game=new Game({role,duo,difficulty:$('difficulty').value});endedHandled=false;starting=true;
  setOptionsDisabled(true);controls();$('hud').hidden=false;$('energy-panel').hidden=false;$('play-actions').hidden=false;
  $('welcome-tag').hidden=true;$('map-tip').hidden=true;$('pause-screen').hidden=true;$('result-screen').hidden=true;
  $('countdown').hidden=false;$('countdown').textContent='3';$('start-label').textContent='Get ready…';
  $('mode-label').textContent=duo?'DUO · P1 CHOR / P2 COP':`SOLO · ${role.toUpperCase()}`;
  setStatus(duo?'P1 chor: WASD. P2 cop: arrows. Ready?':'Find joy in a very ridiculous getaway. Ready?');updateHud();canvas.focus({preventScroll:true});
  // Bring the map into view on small screens only when needed.
  const rect=$('board').getBoundingClientRect();if(rect.bottom>innerHeight||rect.top<0)$('board').scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'center'});
  let n=3;
  countTimer=setInterval(()=>{n--;if(n>0){$('countdown').textContent=String(n);beep('pickup');}else{clearInterval(countTimer);countTimer=null;starting=false;$('countdown').hidden=true;game.start();$('start-label').textContent='Take a chai break';$('live-label').textContent='CHASE IN PROGRESS';lastTime=performance.now();canvas.focus({preventScroll:true});if(document.hidden)togglePause(true);}},700);
}
function togglePause(forcePause=false){
  if(starting)return;
  if(game.phase==='playing'){game.phase='paused';clearInput();$('pause-screen').hidden=false;$('start-label').textContent='Resume chase';$('live-label').textContent='CHAI BREAK';setStatus('Paused. No time passes during a chai break.');}
  else if(game.phase==='paused'&&!forcePause){game.phase='playing';$('pause-screen').hidden=true;$('start-label').textContent='Take a chai break';$('live-label').textContent='CHASE IN PROGRESS';lastTime=performance.now();canvas.focus({preventScroll:true});}
}
function updateHud(){
  $('clock').textContent=fmt(Math.ceil(game.remaining));$('clock').style.color=game.remaining<=20?'#c5643e':'';
  $('score').innerHTML=`${game.banked} <small>/ 3</small>`;$('lives').textContent=Array.from({length:3},(_,i)=>i<3-game.catches?'●':'○').join(' ');
  const p=role==='cop'&&!duo?game.cop:game.chor;
  $('energy-fill').style.width=`${p.energy}%`;$('energy-fill').style.background=p.energy<25?'#d18c59':'#78945f';
  $('bag-label').textContent=role==='cop'&&!duo?(game.netCooldown>0?`NET ${Math.ceil(game.netCooldown)}s`:'NET READY'):game.carried?`${game.carried.short}${game.hushed>0?' · HUSHED':''}`:'BAG EMPTY';
}
function finishRound(){
  endedHandled=true;clearInput();const won=duo||game.winner===role;
  $('result-kicker').textContent=duo?'FRIENDSHIP WINS. ALSO…':won?'GULLY LEGEND STATUS':'THE GULLY WANTS A REMATCH';
  $('result-icon').textContent=game.winner==='chor'?'✳':'✦';
  $('result-title').textContent=game.winner==='chor'?'Maal delivered!':game.reason==='timeout'?'Time’s up, chor!':'Pakde gaye!';
  $('result-copy').textContent=game.winner==='chor'?'All three treasures are safe. Even the samosa is impressed.':game.reason==='timeout'?'The cop held the gully. The loot has lodged a formal complaint.':'Three tags. One very satisfied cop. The samosa demands a lawyer.';
  if(duo)$('result-copy').textContent+=` ${game.winner==='chor'?'Player 1':'Player 2'} wins. Swap seats for the rematch!`;
  $('result-score').textContent=`${game.banked}/3`;$('result-time').textContent=fmt(game.elapsed);$('result-screen').hidden=false;
  $('play-actions').hidden=true;$('start-label').textContent='Play again';$('live-label').textContent='ROUND COMPLETE';
  if(won&&!duo){const old=records[role];records[role]={time:Math.min(Number.isFinite(old?.time)?old.time:Infinity,game.elapsed),wins:(Number.isFinite(old?.wins)?old.wins:0)+1};try{localStorage.setItem('gully-chase-records',JSON.stringify(records));}catch{}updateBest();}
  $('again-btn').focus({preventScroll:true});
}
function processEvents(){for(const e of game.drainEvents()){setStatus(e.text);beep(e.type);}}
function input(){
  const wasd={x:(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),y:(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0)};
  const arrows={x:(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0),y:(keys.has('ArrowDown')?1:0)-(keys.has('ArrowUp')?1:0)};
  const sprint=keys.has('ShiftLeft')||keys.has('ShiftRight')||touch.sprint;
  if(duo)return{chor:{...wasd,sprint},cop:{...arrows,sprint:keys.has('Slash')}};
  const solo={x:Math.max(-1,Math.min(1,wasd.x+arrows.x+touch.x)),y:Math.max(-1,Math.min(1,wasd.y+arrows.y+touch.y)),sprint};
  return role==='cop'?{cop:solo}:{chor:solo};
}
function frame(now){
  try{
    const dt=Math.min(.05,Math.max(0,(now-(lastTime||now))/1000));lastTime=now;
    game.update(dt,input());processEvents();renderer.render(game,now/1000,reducedMotion);
    if(now-lastUi>90){updateHud();if(game.phase==='playing'&&now-lastStatus>6000)setStatus(game.hint());lastUi=now;}
    if(game.phase==='ended'&&!endedHandled)finishRound();
    requestAnimationFrame(frame);
  }catch(e){showError(e);}
}
function openHelp(){if(game.phase==='playing')togglePause(true);if(!$('help-dialog').open)$('help-dialog').showModal();}
document.querySelectorAll('[data-role]').forEach(b=>b.addEventListener('click',()=>{role=b.dataset.role;document.querySelectorAll('[data-role]').forEach(r=>{const selected=r===b;r.classList.toggle('active',selected);r.setAttribute('aria-pressed',String(selected));});resetHome();}));
$('difficulty').addEventListener('change',resetHome);
$('start-btn').addEventListener('click',()=>startRound(duo));$('duo-btn').addEventListener('click',()=>startRound(true));
$('again-btn').addEventListener('click',()=>startRound(duo));$('restart-btn').addEventListener('click',()=>{game.phase='ended';startRound(duo);});
$('pause-btn').addEventListener('click',()=>togglePause());$('resume-btn').addEventListener('click',()=>togglePause());
$('quit-btn').addEventListener('click',resetHome);$('result-home').addEventListener('click',resetHome);
for(const id of ['help-btn','intro-help','bottom-help'])$(id).addEventListener('click',openHelp);
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$('help-dialog').close()));
$('help-dialog').addEventListener('click',e=>{if(e.target===$('help-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('sound-btn').addEventListener('click',()=>{sound=!sound;updateSound();if(sound)beep('bank');});
$('reload-btn').addEventListener('click',()=>location.reload());
$('fullscreen-btn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('board').requestFullscreen)await $('board').requestFullscreen();else setStatus('Fullscreen is not available in this browser. Rotate your phone for a wider map.');}catch{setStatus('Fullscreen is unavailable here. The full map still fits in the game panel.');}});
document.addEventListener('fullscreenchange',()=>{resize();$('fullscreen-btn').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen');});
document.addEventListener('visibilitychange',()=>{if(document.hidden)togglePause(true);});
window.addEventListener('blur',()=>{clearInput();if(game.phase==='playing')togglePause(true);});
window.addEventListener('keydown',e=>{
  if($('help-dialog').open||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;
  if(['Escape','KeyP'].includes(e.code)&&['playing','paused'].includes(game.phase)){e.preventDefault();if(!e.repeat)togglePause();return;}
  if(game.phase!=='playing')return;
  const codes=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','KeyE','KeyQ','KeyF','Space','Enter','Slash'];
  if(!codes.includes(e.code))return;e.preventDefault();keys.add(e.code);if(e.repeat)return;
  if((duo||role==='chor')&&e.code==='KeyE')game.action('interact');
  if((duo||role==='chor')&&e.code==='KeyQ')game.action('drop');
  if((duo||role==='chor')&&e.code==='KeyF')game.action('hush');
  if((duo&&e.code==='Enter')||(!duo&&role==='cop'&&e.code==='Space'))game.action('net');
});
window.addEventListener('keyup',e=>keys.delete(e.code));
const held=new Set();
function updateTouchMove(){touch.x=(held.has('right')?1:0)-(held.has('left')?1:0);touch.y=(held.has('down')?1:0)-(held.has('up')?1:0);}
document.querySelectorAll('[data-move]').forEach(b=>{
  const release=()=>{held.delete(b.dataset.move);b.classList.remove('pressed');updateTouchMove();};
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held.add(b.dataset.move);b.classList.add('pressed');updateTouchMove();});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,release);
});
$('touch-sprint').addEventListener('pointerdown',e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);touch.sprint=true;});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('touch-sprint').addEventListener(event,()=>touch.sprint=false);
$('touch-action').addEventListener('click',()=>game.action(role==='cop'&&!duo?'net':'interact'));$('touch-special').addEventListener('click',()=>game.action('hush'));
function resize(){if(!renderer)return;const r=canvas.getBoundingClientRect();renderer.resize(r.width||960,r.height||640,devicePixelRatio);renderer.render(game,performance.now()/1000,reducedMotion);}
try{renderer=new Renderer(canvas);new ResizeObserver(resize).observe(canvas);resize();controls();updateSound();updateBest();requestAnimationFrame(frame);}catch(e){showError(e);}

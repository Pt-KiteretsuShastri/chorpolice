import {Game,EVENT_TYPES} from './engine.js';
import {Renderer} from './renderer.js';
import {SpeechController,Effects} from './audio.js';
import {movement,actionFor} from './input.js';

const $=id=>document.getElementById(id),canvas=$('game'),keys=new Set(),held=new Set();
const touch={x:0,y:0,sprint:false},speech=new SpeechController(window),effects=new Effects(window);
const motion=window.matchMedia('(prefers-reduced-motion: reduce)');let reducedMotion=motion.matches;
motion.addEventListener?.('change',e=>reducedMotion=e.matches);
const fmt=n=>`${Math.floor(Math.max(0,n)/60)}:${String(Math.floor(Math.max(0,n)%60)).padStart(2,'0')}`;
function newSeed(){try{return crypto.getRandomValues(new Uint32Array(1))[0];}catch{return Date.now()>>>0;}}
const urlSeed=new URL(location.href).searchParams.get('seed');
let seed=urlSeed===null?newSeed():(/^\d+$/.test(urlSeed)?Number(urlSeed)>>>0:urlSeed),role='chor',duo=false,game=new Game({seed}),renderer;
let overview=false,lastTime=0,lastUi=0,lastStatus=0,visualTime=0,endedHandled=false,talkKey='',voiceWanted=true;
try{voiceWanted=localStorage.getItem('gully-voice')!=='off';effects.enabled=localStorage.getItem('gully-sfx')!=='off';}catch{}
function status(text){if(text){$('status').textContent=text;lastStatus=performance.now();}}
function clearInput(){keys.clear();held.clear();Object.assign(touch,{x:0,y:0,sprint:false});document.querySelectorAll('[data-move]').forEach(b=>b.classList.remove('pressed'));}
function focusGame(){canvas.focus({preventScroll:true});}
function soundLabels(){
  $('voice-btn').textContent=speech.supported?`Voice ${voiceWanted?'on':'off'}`:'Captions only';$('voice-btn').setAttribute('aria-pressed',String(voiceWanted&&speech.supported));$('voice-btn').disabled=!speech.supported;
  $('voice-btn').title=speech.supported?'Spoken dialogue · captions always stay on':'This browser has no speech synthesis. Captions stay on.';
  $('sound-btn').textContent=`SFX ${effects.enabled?'on':'off'}`;$('sound-btn').setAttribute('aria-pressed',String(effects.enabled));
  $('sound-note').textContent=speech.supported?'Start enables voices and sound. Both can be muted separately.':'Speech is unavailable here. Start with captions and optional sound effects.';
}
function unlockSound(){speech.setEnabled(voiceWanted);effects.unlock();}
function saveSound(){try{localStorage.setItem('gully-voice',voiceWanted?'on':'off');localStorage.setItem('gully-sfx',effects.enabled?'on':'off');}catch{}}
function controls(){
  $('controls').innerHTML=duo?'<kbd>WASD</kbd> P1 chor · <kbd>Arrows</kbd> P2 cop · <kbd>Shift</kbd> / <kbd>/</kbd> sprint · <kbd>Enter</kbd> cop net · <kbd>P</kbd> pause':role==='cop'?'<kbd>WASD</kbd> / <kbd>Arrows</kbd> move · <kbd>Shift</kbd> sprint · <kbd>Space</kbd> net · <kbd>M</kbd> overview · <kbd>P</kbd> pause':'<kbd>WASD</kbd> / <kbd>Arrows</kbd> move · <kbd>Shift</kbd> sprint · <kbd>E</kbd> interact · <kbd>Space</kbd> jump · <kbd>1–3</kbd> offer · <kbd>M</kbd> overview · <kbd>P</kbd> pause';
  const cop=role==='cop'&&!duo;$('touch-action').textContent=cop?'Throw net':'Talk / bank / chai';$('touch-jump').hidden=cop;$('touch-special').hidden=cop;$('touch-drop').hidden=cop;$('mobile-controls').classList.toggle('duo-hidden',duo);
}
function setSeed(){seed=game.seed;$('menu-seed').textContent=`CHALLENGE ${seed} · ${game.theme==='morning'?'WARM MORNING':'GOLDEN EVENING'}`;try{const url=new URL(location.href);url.searchParams.set('seed',String(seed));history.replaceState(null,'',url);}catch{}}
function makeGame(nextSeed=seed,previous=''){
  speech.stop();clearInput();game=new Game({role,duo,difficulty:$('difficulty').value,seed:nextSeed,previous});endedHandled=false;talkKey='';overview=false;renderer?.camera.reset();$('map-btn').setAttribute('aria-pressed','false');$('pause-screen').hidden=true;$('result-screen').hidden=true;$('negotiation').hidden=true;$('event-banner').hidden=true;setSeed();controls();updateHud();
}
function menu(){makeGame(newSeed(),game.signature);$('menu-screen').hidden=false;$('pause-btn').disabled=true;$('caption').textContent='Captions stay on, even when sound is muted.';status('Amber ladders lead to rooftops. The green courtyard is home.');$('start-btn').focus({preventScroll:true});}
function start({fresh=false,replay=false}={}){
  const old=game.signature;
  if(fresh||replay||game.phase!=='ready')makeGame(replay?seed:newSeed(),replay?'':old);
  unlockSound();$('menu-screen').hidden=true;$('pause-screen').hidden=true;$('result-screen').hidden=true;$('pause-btn').disabled=false;$('pause-btn').textContent='Pause';game.start();lastTime=performance.now();focusGame();if(document.hidden)pause(true);
}
function pause(force=false){
  if(game.phase==='playing'){game.phase='paused';speech.stop();clearInput();$('pause-screen').hidden=false;$('pause-btn').textContent='Resume';$('negotiation').hidden=true;status('Paused. The clock and the neighbourhood are still.');$('resume-btn').focus({preventScroll:true});}
  else if(game.phase==='paused'&&!force){game.phase='playing';speech.stop();$('pause-screen').hidden=true;$('pause-btn').textContent='Pause';lastTime=performance.now();focusGame();}
}
function action(kind){game.action(kind);focusGame();}
function answer(index){game.answer(index);focusGame();}
function updateHud(){
  $('mode-label').textContent=game.phase==='ready'?'THE GULLY IS OPEN':duo?'P1 CHOR · P2 COP':`SOLO ${role.toUpperCase()}`;
  $('clock').textContent=fmt(Math.ceil(game.remaining));$('clock').style.color=game.remaining<=20?'#a04f32':'';
  $('score').textContent=`${game.banked} / 3`;$('lives').textContent=Array.from({length:3},(_,i)=>i<3-game.catches?'●':'○').join(' ');$('lives').setAttribute('aria-label',`${3-game.catches} chor chances remaining`);
  const p=role==='cop'&&!duo?game.cop:game.chor;$('energy').value=p.energy;$('energy').textContent=`${Math.round(p.energy)}%`;$('energy-label').textContent=duo?'P1 ENERGY':'ENERGY';$('cop-energy').hidden=!duo;$('cop-energy').textContent=`P2 energy ${Math.round(game.cop.energy)}%`;
  const bag=game.carried;$('bag-label').textContent=bag?bag.name:'Empty · find a treasure';$('bag-label').title=bag?.description||'Carry one treasure at a time.';
  $('trust-label').textContent=bag?`Trust ${Math.round(bag.trust*100)}% · ${bag.trust<.35?'F to renew the deal':bag.description}`:role==='cop'&&!duo?`Net ${game.netCooldown>0?`ready in ${Math.ceil(game.netCooldown)}s`:'ready'} · ${game.cop.state}`:'';
  const e=game.eventBanner;$('event-banner').hidden=!e||game.phase==='ready';
  if(e){const type=EVENT_TYPES[e.type];$('event-title').textContent=`${e.stage==='soon'?'Coming up: ':''}${type.title}`;$('event-time').textContent=`${Math.max(0,Math.ceil(e.until-game.elapsed))}s`;$('event-description').textContent=type.description;}
  const n=game.negotiation;$('negotiation').hidden=!n||game.phase!=='playing'||(role==='cop'&&!duo);
  if(n){const key=`${n.lootId}:${n.opened}`;if(key!==talkKey){talkKey=key;const loot=game.loot.find(l=>l.id===n.lootId);$('talk-name').textContent=`MAKE A DEAL · ${loot.name}`;$('talk-prompt').textContent=n.prompt;$('talk-choices').replaceChildren(...n.choices.map((choice,i)=>{const b=document.createElement('button');b.textContent=`${i+1}. ${choice.label}`;b.addEventListener('click',()=>answer(i));return b;}));}for(const b of $('talk-choices').children)b.disabled=game.elapsed<n.lockedUntil;}
}
function processEvents(){
  let dialogue=null;
  for(const e of game.drainEvents()){
    if(e.type==='dialogue'){if(!dialogue||(e.priority||1)>=(dialogue.priority||1))dialogue=e;}
    else{status(e.text);effects.play(e.type);}
  }
  if(dialogue){$('caption').textContent=dialogue.text;if(game.phase!=='paused')speech.speak(dialogue);}
}
function finish(){
  endedHandled=true;clearInput();$('pause-btn').disabled=true;$('negotiation').hidden=true;$('result-screen').hidden=false;
  $('result-kicker').textContent=duo?`${game.winner==='chor'?'PLAYER 1':'PLAYER 2'} WINS`:game.winner===role?'GULLY LEGEND':'THE GULLY WANTS A REMATCH';
  $('result-title').textContent=game.winner==='chor'?'Maal safe. Ab chai!':game.reason==='timeout'?'Time’s up, chor!':'Pakde gaye!';
  $('result-copy').textContent=game.winner==='chor'?'Three persuaded treasures, safely home. The neighbourhood has a story to tell.':game.reason==='timeout'?'The cop held the gully for two minutes. The loot is still negotiating.':'Three tags for the cop. The samosa demands a lawyer.';
  $('result-stats').textContent=`${game.banked}/3 banked · ${fmt(game.elapsed)} · ${game.stats.jumps} rooftop jumps${game.winner==='chor'&&game.catches===0?' · Clean escape!':''}${game.winner==='chor'&&game.stats.noise===0?' · Quiet getaway!':''}`;
  $('again-btn').focus({preventScroll:true});
}
function showError(e){console.error(e);$('load-error').hidden=false;$('error-copy').textContent=e?.message||'Reload to try again.';$('start-btn').disabled=true;speech.stop();}
function frame(now){
  try{
    const dt=Math.min(.05,Math.max(0,(now-(lastTime||now))/1000));lastTime=now;
    if(game.phase!=='paused'&&game.phase!=='ended')visualTime+=dt;
    game.update(dt,movement(keys,touch,duo,role));processEvents();renderer.render(game,visualTime,reducedMotion,{overview,dt});
    if(now-lastUi>90){updateHud();if(game.phase==='playing'&&now-lastStatus>4500)status(game.hint());lastUi=now;}
    if(game.phase==='ended'&&!endedHandled)finish();requestAnimationFrame(frame);
  }catch(e){showError(e);}
}
function openDialog(id){if(game.phase==='playing')pause(true);speech.stop();clearInput();$(id).showModal();}
function invite(){openDialog('invite-dialog');const u=new URL(location.href);u.searchParams.set('seed',String(game.seed));$('invite-link').value=u.href;$('copy-status').textContent='This shares a challenge, not an online session.';}
function mapToggle(){overview=!overview;$('map-btn').setAttribute('aria-pressed',String(overview));focusGame();}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{duo=b.dataset.mode==='duo';role=b.dataset.mode==='cop'?'cop':'chor';document.querySelectorAll('[data-mode]').forEach(el=>{el.classList.toggle('selected',el===b);el.setAttribute('aria-pressed',String(el===b));});makeGame(seed);}));
$('difficulty').addEventListener('change',()=>makeGame(seed));$('start-btn').addEventListener('click',()=>start());$('again-btn').addEventListener('click',()=>start({fresh:true}));$('replay-btn').addEventListener('click',()=>start({replay:true}));$('restart-btn').addEventListener('click',()=>start({fresh:true}));
$('pause-btn').addEventListener('click',()=>pause());$('resume-btn').addEventListener('click',()=>pause());$('quit-btn').addEventListener('click',menu);$('result-home').addEventListener('click',menu);
$('help-btn').addEventListener('click',()=>openDialog('help-dialog'));$('more-help').addEventListener('click',()=>openDialog('help-dialog'));$('invite-btn').addEventListener('click',invite);
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
$('copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('invite-link').value);$('copy-status').textContent='Invitation copied. Send it to your friend!';}catch{$('invite-link').focus();$('invite-link').select();$('copy-status').textContent='Select and copy the link above to share this challenge.';}});
$('voice-btn').addEventListener('click',()=>{voiceWanted=!voiceWanted;speech.setEnabled(voiceWanted);saveSound();soundLabels();focusGame();});
$('sound-btn').addEventListener('click',()=>{effects.enabled=!effects.enabled;if(effects.enabled){effects.unlock();effects.play('chai');}saveSound();soundLabels();focusGame();});
$('map-btn').addEventListener('click',mapToggle);
$('fullscreen-btn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('board').requestFullscreen)await $('board').requestFullscreen();else status('Fullscreen is unavailable in this browser.');}catch{status('Fullscreen is unavailable in this browser.');}focusGame();});
document.addEventListener('fullscreenchange',resize);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true);});
window.addEventListener('blur',()=>{clearInput();pause(true);});
window.addEventListener('keydown',e=>{
  if($('help-dialog').open||$('invite-dialog').open||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;
  if(['KeyP','Escape'].includes(e.code)&&['playing','paused'].includes(game.phase)){e.preventDefault();if(!e.repeat)pause();return;}
  if(game.phase!=='playing')return;
  if(e.code==='KeyM'){e.preventDefault();if(!e.repeat)mapToggle();return;}
  const movementKey=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','Slash'].includes(e.code),act=actionFor(e.code,duo,role),answerKey=['Digit1','Digit2','Digit3','Numpad1','Numpad2','Numpad3'].includes(e.code);
  if(movementKey||act||answerKey){e.preventDefault();keys.add(e.code);if(e.repeat)return;if(act)game.action(act);if(answerKey&&(duo||role==='chor'))game.answer(Number(e.code.slice(-1))-1);}
});
window.addEventListener('keyup',e=>keys.delete(e.code));
function updateTouch(){touch.x=Number(held.has('right'))-Number(held.has('left'));touch.y=Number(held.has('down'))-Number(held.has('up'));}
document.querySelectorAll('[data-move]').forEach(b=>{
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held.add(b.dataset.move);b.classList.add('pressed');updateTouch();});
  const release=()=>{held.delete(b.dataset.move);b.classList.remove('pressed');updateTouch();};for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,release);
});
$('touch-sprint').addEventListener('pointerdown',e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);touch.sprint=true;});for(const event of ['pointerup','pointercancel','lostpointercapture'])$('touch-sprint').addEventListener(event,()=>touch.sprint=false);
$('touch-action').addEventListener('click',()=>action(role==='cop'&&!duo?'net':'interact'));$('touch-jump').addEventListener('click',()=>action('jump'));$('touch-special').addEventListener('click',()=>action('persuade'));$('touch-drop').addEventListener('click',()=>action('drop'));
function resize(){if(!renderer)return;const r=canvas.getBoundingClientRect();renderer.resize(r.width||1280,r.height||600,window.devicePixelRatio||1);renderer.render(game,visualTime,reducedMotion,{overview});}
try{renderer=new Renderer(canvas);renderer.loadMapArt().catch(e=>status(e.message));if(window.ResizeObserver)new ResizeObserver(resize).observe($('playfield'));else window.addEventListener('resize',resize);setSeed();controls();soundLabels();updateHud();resize();requestAnimationFrame(frame);}catch(e){showError(e);}

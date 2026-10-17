import {Game,EVENT_TYPES} from './engine.js';
import {Renderer} from './renderer.js';
import {Effects} from './audio.js';
import {CharacterVoice} from './character-voice.js';
import {movement,actionFor} from './input.js';
import {OnlineRoom,roomInURL,roomLink} from './online-room.js';
import {HostControls,RemoteView,snapshot,validSnapshot} from './net-state.js';

const $=id=>document.getElementById(id),canvas=$('game'),keys=new Set(),held=new Set();
const touch={x:0,y:0,sprint:false},speech=new CharacterVoice(window),effects=new Effects(window);
const motion=window.matchMedia('(prefers-reduced-motion: reduce)');let reducedMotion=motion.matches;
motion.addEventListener?.('change',e=>reducedMotion=e.matches);
const fmt=n=>`${Math.floor(Math.max(0,n)/60)}:${String(Math.floor(Math.max(0,n)%60)).padStart(2,'0')}`;
function newSeed(){try{return crypto.getRandomValues(new Uint32Array(1))[0];}catch{return Date.now()>>>0;}}
const urlSeed=new URL(location.href).searchParams.get('seed');
let seed=urlSeed===null?newSeed():(/^\d+$/.test(urlSeed)?Number(urlSeed)>>>0:urlSeed),role='chor',duo=false,game=new Game({seed}),renderer;
let joinTarget=roomInURL(location.href),onlineIntent=!!joinTarget,network=null,round=1,remoteReady=false,localReady=false,netSequence=0,actionSequence=0,snapshotSequence=0,lastSend=0,lastSnapshot=0,hostControls=new HostControls(),remoteView=new RemoteView();
let overview=false,lastTime=0,lastUi=0,lastStatus=0,visualTime=0,endedHandled=false,talkKey='',voiceWanted=true;
try{voiceWanted=localStorage.getItem('gully-voice')!=='off';effects.enabled=localStorage.getItem('gully-sfx')!=='off';}catch{}
function status(text){if(text){$('status').textContent=text;lastStatus=performance.now();}}
function clearInput(){keys.clear();held.clear();Object.assign(touch,{x:0,y:0,sprint:false});document.querySelectorAll('[data-move]').forEach(b=>b.classList.remove('pressed'));}
function focusGame(){canvas.focus({preventScroll:true});}
function soundLabels(){
  $('voice-btn').textContent=speech.supported?(speech.hindiUnavailable?'Hindi unavailable':`Hindi ${voiceWanted?'on':'off'}`):'Captions only';$('voice-btn').setAttribute('aria-pressed',String(voiceWanted&&speech.supported));$('voice-btn').disabled=!speech.supported;
  $('voice-btn').title=speech.supported?(speech.hindiUnavailable?'No Hindi voice is installed on this device. Captions stay on.':speech.packAvailable?'ElevenLabs Hindi character clips · device voice fallback · captions always stay on':'Device Hindi dialogue · captions always stay on'):'This browser has no speech synthesis. Captions stay on.';
  $('sound-btn').textContent=`SFX ${effects.enabled?'on':'off'}`;$('sound-btn').setAttribute('aria-pressed',String(effects.enabled));
  $('sound-note').textContent=!speech.supported?'Speech is unavailable here. Captions and sound effects still work.':speech.hindiUnavailable?'No Hindi voice is installed here. Captions and sound effects still work.':speech.packAvailable?'Start enables Hindi character voices and sound. Both can be muted separately.':'Start enables device Hindi dialogue and sound. Both can be muted separately.';
}
speech.onVoicesChanged=soundLabels;
speech.loadPack();
function unlockSound(){speech.setEnabled(voiceWanted);effects.unlock();}
function saveSound(){try{localStorage.setItem('gully-voice',voiceWanted?'on':'off');localStorage.setItem('gully-sfx',effects.enabled?'on':'off');}catch{}}
function controls(){
  $('controls').innerHTML=duo?'<kbd>WASD</kbd> P1 chor · <kbd>Arrows</kbd> P2 cop · <kbd>Shift</kbd> / <kbd>/</kbd> sprint · <kbd>Enter</kbd> cop net · <kbd>P</kbd> pause':role==='cop'?'<kbd>WASD</kbd> / <kbd>Arrows</kbd> move · <kbd>Shift</kbd> sprint · <kbd>Space</kbd> net · <kbd>M</kbd> overview · <kbd>P</kbd> pause':'<kbd>WASD</kbd> / <kbd>Arrows</kbd> move · <kbd>Shift</kbd> sprint · <kbd>E</kbd> interact · <kbd>Space</kbd> jump · <kbd>1–3</kbd> offer · <kbd>M</kbd> overview · <kbd>P</kbd> pause';
  const cop=role==='cop'&&!duo;$('touch-action').textContent=cop?'Throw net':'Talk / bank / chai';$('touch-jump').hidden=cop;$('touch-special').hidden=cop;$('touch-drop').hidden=cop;$('mobile-controls').classList.toggle('duo-hidden',duo);
  $('sidebar-role').textContent=network?`ONLINE ${role.toUpperCase()} · ${network.isHost?'HOST':'GUEST'}`:duo?'LOCAL · P1 + P2':`SOLO ${role.toUpperCase()}`;
  $('sidebar-objective').textContent=cop?'Tag the chor three times, or hold the gully until time runs out.':'Convince three treasures. Deliver them to the green safehouse.';
  const rows=cop?[['WASD / arrows','Move'],['Shift','Sprint'],['Space','Throw net'],['M','Map overview'],['P / Esc','Pause']]:duo?[['WASD','P1 chor moves'],['Arrows','P2 cop moves'],['Shift / /','P1 / P2 sprint'],['E','Talk / bank / chai'],['1 · 2 · 3','Choose an offer'],['Space','Chor rooftop jump'],['Enter','Cop throws net'],['F / Q','Renew offer / drop'],['M / P','Overview / pause']]:[['WASD / arrows','Move'],['Shift','Sprint'],['E','Talk / bank / chai'],['1 · 2 · 3','Choose an offer'],['Space','Climb / rooftop jump'],['F','Renew a promise'],['Q','Drop loot'],['M','Map overview'],['P / Esc','Pause']];
  $('control-list').innerHTML=rows.map(([key,label])=>`<div><dt><kbd>${key}</kbd></dt><dd>${label}</dd></div>`).join('');
}
function setSeed(){seed=game.seed;$('menu-seed').textContent=`CHALLENGE ${seed} · ${game.theme==='morning'?'WARM MORNING':'GOLDEN EVENING'}`;try{const url=new URL(location.href);url.searchParams.set('seed',String(seed));history.replaceState(null,'',url);}catch{}}
function makeGame(nextSeed=seed,previous=''){
  speech.stop();clearInput();game=new Game({role,duo:duo||!!network,difficulty:$('difficulty').value,seed:nextSeed,previous});game.online=!!network;$('restart-btn').hidden=!!network&&!network.isHost;$('replay-btn').hidden=!!network&&!network.isHost;$('resume-btn').textContent=network&&!network.isHost?'Ask host to resume':'Resume chase';endedHandled=false;talkKey='';overview=false;renderer?.camera.reset();$('map-btn').setAttribute('aria-pressed','false');$('pause-screen').hidden=true;$('result-screen').hidden=true;$('negotiation').hidden=true;$('event-banner').hidden=true;setSeed();controls();updateHud();
}
function menu(){
  network?.close();network=null;joinTarget=null;onlineIntent=false;duo=false;clearInput();$('room-screen').hidden=true;$('room-info').hidden=true;
  const url=new URL(location.href);url.searchParams.delete('room');history.replaceState(null,'',url);modeLabels();makeGame(newSeed(),game.signature);$('menu-screen').hidden=false;$('pause-btn').disabled=true;$('caption').textContent='Captions stay on, even when sound is muted.';status('Amber ladders lead to rooftops. The green courtyard is home.');$('start-btn').focus({preventScroll:true});
}
function start({fresh=false,replay=false}={}){
  if(network){if(!network.isHost){network.send('rematch-request',{round});status('Rematch requested. The host chooses the next round.');return;}prepareOnline(replay?seed:newSeed(),replay?'':game.signature);return;}
  if(onlineIntent){beginOnline();return;}
  const old=game.signature;
  if(fresh||replay||game.phase!=='ready')makeGame(replay?seed:newSeed(),replay?'':old);
  unlockSound();$('menu-screen').hidden=true;$('pause-screen').hidden=true;$('result-screen').hidden=true;$('pause-btn').disabled=false;$('pause-btn').textContent='Pause';game.start();lastTime=performance.now();focusGame();if(document.hidden)pause(true);
}
function pause(force=false){
  if(network){if(game.phase==='playing'){network.send('input',{round,seq:++netSequence,input:{x:0,y:0,sprint:false}});if(!network.isHost)network.send('pause',{round});showPaused();}else if(game.phase==='paused'&&!force){if(network.isHost){if(network.connected&&remoteReady){game.phase='playing';$('pause-screen').hidden=true;$('pause-btn').textContent='Pause';speech.stop();clearInput();focusGame();}else status('Wait for your friend to reconnect and ready up.');}else{network.send('resume-request',{round});status('Host asked to resume.');}}return;}
  if(game.phase==='playing'){game.phase='paused';speech.stop();clearInput();$('pause-screen').hidden=false;$('pause-btn').textContent='Resume';$('negotiation').hidden=true;status('Paused. The clock and the neighbourhood are still.');$('resume-btn').focus({preventScroll:true});}
  else if(game.phase==='paused'&&!force){game.phase='playing';speech.stop();$('pause-screen').hidden=true;$('pause-btn').textContent='Pause';lastTime=performance.now();focusGame();}
}
function action(kind){if(network&&!network.isHost){if(kind==='net')network.send('action',{round,seq:++actionSequence,action:'net'});}else game.action(kind);focusGame();}
function answer(index){if(!network||network.isHost)game.answer(index);focusGame();}
function updateHud(){
  const jump=game.jumpTarget,canJump=game.chor.energy>=18&&game.chor.jumpCooldown<=0;
  $('touch-jump').textContent=jump?(jump.kind==='climb'?'Climb roof':jump.kind==='leap'?'Leap roof':'Down to street'):'Jump';
  $('rooftop-status').textContent=role==='cop'&&!duo?'Rooftops protect the chor. Watch the amber exits.':game.chor.jump?'Jumping…':jump?!canJump?(game.chor.energy<18?'Recover 18 energy to jump.':'Jump recharging…'):jump.kind==='climb'?'Ready · Space to climb this roof':jump.kind==='leap'?'Ready · Space to leap to the next roof':'Space to return to the street':'Walk near an amber ladder, then press Space. On a roof, Space returns to the street or leaps to a nearby roof.';
  $('mode-label').textContent=network?`ONLINE ${role.toUpperCase()} · ${network.connected?'CONNECTED':'WAITING'}`:game.phase==='ready'?'THE GULLY IS OPEN':duo?'P1 CHOR · P2 COP':`SOLO ${role.toUpperCase()}`;
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
  let dialogue=null;const events=game.drainEvents();if(network?.isHost&&events.length)network.send('events',{round,events:events.slice(-12)});
  for(const e of events){
    if(e.type==='dialogue'){if(!dialogue||(e.priority||1)>=(dialogue.priority||1))dialogue=e;}
    else{status(e.text);effects.play(e.type);}
  }
  if(dialogue){$('caption').textContent=dialogue.text;if(game.phase!=='paused')speech.speak(dialogue);}
}
function finish(){
  endedHandled=true;clearInput();$('pause-btn').disabled=true;$('negotiation').hidden=true;$('result-screen').hidden=false;
  $('result-kicker').textContent=duo?`${game.winner==='chor'?'PLAYER 1':'PLAYER 2'} WINS`:game.winner===role?'GULLY LEGEND':'THE GULLY WANTS A REMATCH';
  $('result-title').textContent=game.winner==='chor'?'Loot safe. Ab chai!':game.reason==='timeout'?'Time’s up, chor!':'Pakde gaye!';
  $('result-copy').textContent=game.winner==='chor'?'Three persuaded treasures, safely home. The neighbourhood has a story to tell.':game.reason==='timeout'?'The cop held the gully for two minutes. The loot is still negotiating.':'Three tags for the cop. The samosa demands a lawyer.';
  $('result-stats').textContent=`${game.banked}/3 banked · ${fmt(game.elapsed)} · ${game.stats.jumps} rooftop jumps${game.winner==='chor'&&game.catches===0?' · Clean escape!':''}${game.winner==='chor'&&game.stats.noise===0?' · Quiet getaway!':''}`;
  $('again-btn').textContent=network&&!network.isHost?'Request rematch':'Rematch · new loot';$('replay-btn').hidden=!!network&&!network.isHost;
  $('again-btn').focus({preventScroll:true});
}
function showError(e){console.error(e);$('load-error').hidden=false;$('error-copy').textContent=e?.message||'Reload to try again.';$('start-btn').disabled=true;speech.stop();}
function frame(now){
  try{
    const dt=Math.min(.05,Math.max(0,(now-(lastTime||now))/1000));lastTime=now;
    if(game.phase!=='paused'&&game.phase!=='ended')visualTime+=dt;
    const input=movement(keys,touch,duo,role);
    if(network){network.update();if(network.isHost){if(network.connected)game.update(dt,{chor:input.chor||{},cop:hostControls.current(now)});if(network.connected&&now-lastSnapshot>=50){lastSnapshot=now;network.send('state',{seq:++snapshotSequence,state:snapshot(game,round)});}}else{if(network.connected&&now-lastSend>=33){lastSend=now;network.send('input',{round,seq:++netSequence,input:game.phase==='playing'?(input.cop||{}):{x:0,y:0,sprint:false}});}remoteView.interpolate(game,now);}}else game.update(dt,input);
    processEvents();renderer.render(game,visualTime,reducedMotion,{overview,dt});
    if(now-lastUi>90){updateHud();if(game.phase==='playing'&&now-lastStatus>4500)status(network&&role==='cop'?'Catch the chor. Space nets. Rooftops and seated chai drinkers are protected.':game.hint());if(network){$('room-latency').textContent=network.connected?`Link ${network.ping===null?'connected':Math.round(network.ping)+' ms'} · ${network.isHost?'you host as chor':'you play cop'}`:'Keep the host tab open.';}lastUi=now;}
    if(game.phase==='ended'&&!endedHandled)finish();requestAnimationFrame(frame);
  }catch(e){showError(e);}
}
function openDialog(id){if(game.phase==='playing')pause(true);speech.stop();clearInput();$(id).showModal();}
function invite(){openDialog('invite-dialog');const u=new URL(location.href);u.searchParams.delete('room');u.searchParams.set('seed',String(game.seed));$('invite-link').value=network?.id?roomLink(location.href,network.id,seed):u.href;$('invite-copy').textContent=network?'This is your live room link. One friend can join as cop. Keep the host tab open.':'Create a live online room, or copy this challenge seed for separate solo runs.';$('online-invite').hidden=!!network;$('copy-status').textContent=network?'Room links connect two browsers.':'The seed link below starts separate games.';}
function mapToggle(){overview=!overview;$('map-btn').setAttribute('aria-pressed',String(overview));focusGame();}
function modeLabels(){
  document.querySelectorAll('[data-mode]').forEach(el=>{const selected=onlineIntent?el.dataset.mode==='online':duo?el.dataset.mode==='duo':el.dataset.mode===role;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected));});
  $('menu-title').textContent=joinTarget?'Join your friend’s gully.':'Bring the loot home.';$('start-btn').textContent=joinTarget?'Join as cop →':onlineIntent?'Create online room →':'Enter the gully →';$('challenge-options').hidden=onlineIntent;
}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{network?.close();network=null;joinTarget=null;onlineIntent=b.dataset.mode==='online';duo=b.dataset.mode==='duo';role=b.dataset.mode==='cop'?'cop':'chor';const url=new URL(location.href);url.searchParams.delete('room');history.replaceState(null,'',url);modeLabels();makeGame(seed);}));
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
  if(movementKey||act||answerKey){e.preventDefault();keys.add(e.code);if(e.repeat)return;if(act)action(act);if(answerKey&&(duo||role==='chor'))answer(Number(e.code.slice(-1))-1);}
});
window.addEventListener('keyup',e=>keys.delete(e.code));
function updateTouch(){touch.x=Number(held.has('right'))-Number(held.has('left'));touch.y=Number(held.has('down'))-Number(held.has('up'));}
document.querySelectorAll('[data-move]').forEach(b=>{
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held.add(b.dataset.move);b.classList.add('pressed');updateTouch();});
  const release=()=>{held.delete(b.dataset.move);b.classList.remove('pressed');updateTouch();};for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,release);
});
$('touch-sprint').addEventListener('pointerdown',e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);touch.sprint=true;});for(const event of ['pointerup','pointercancel','lostpointercapture'])$('touch-sprint').addEventListener(event,()=>touch.sprint=false);
$('touch-action').addEventListener('click',()=>action(role==='cop'&&!duo?'net':'interact'));$('touch-jump').addEventListener('click',()=>action('jump'));$('touch-special').addEventListener('click',()=>action('persuade'));$('touch-drop').addEventListener('click',()=>action('drop'));
function showPaused(){game.phase='paused';speech.stop();clearInput();hostControls.input={x:0,y:0,sprint:false};$('pause-screen').hidden=false;$('pause-btn').textContent='Resume';$('negotiation').hidden=true;$('resume-btn').textContent=network&&!network.isHost?'Ask host to resume':'Resume chase';$('restart-btn').hidden=!!network&&!network.isHost;status('Both players paused. The host resumes when you are ready.');}
function refreshLobby(){
  if(!network)return;$('room-info').hidden=false;$('room-role').textContent=network.isHost?'YOU ARE CHOR · HOST':'YOU ARE COP · GUEST';$('room-title').textContent=network.isHost?'Your friend’s next.':'Ready for the chase?';$('room-link').value=network.id?roomLink(location.href,network.id,seed):'';$('room-copy-btn').disabled=network.state==='connecting';$('room-start').hidden=!network.isHost;$('room-start').disabled=!network.connected||!remoteReady;$('room-start').textContent=game.phase==='paused'?'Resume together':'Start round';$('room-ready').hidden=network.isHost;$('room-ready').disabled=!network.connected||localReady;$('room-ready').textContent=localReady?'Ready · waiting for host':'Ready as cop';$('room-retry').hidden=network.isHost||!['lost','error'].includes(network.state);$('room-state').textContent=network.connected?'Two players connected':network.state==='waiting'?'Waiting for your friend':network.state==='error'?'Connection failed':'Connecting players';
}
function sendWelcome(){network?.send('welcome',{state:snapshot(game,round)});}
function prepareOnline(nextSeed=seed,previous=''){
  round++;hostControls.reset(round);remoteReady=false;localReady=false;snapshotSequence=0;makeGame(nextSeed,previous);$('menu-screen').hidden=true;$('room-screen').hidden=false;$('room-copy').textContent='Your friend needs to ready up for this round.';$('pause-btn').disabled=true;sendWelcome();refreshLobby();
}
function networkMessage(m){
  const now=performance.now();
  if(network.isHost){
    if(m.type==='input')hostControls.accept(m,now);
    else if(m.type==='action')hostControls.action(m,game);
    else if(m.type==='ready'&&m.round===round){remoteReady=true;$('room-copy').textContent='Your friend is ready as cop. Start when you are ready.';refreshLobby();}
    else if(m.type==='pause'&&m.round===round&&game.phase==='playing')showPaused();
    else if(m.type==='resume-request'&&m.round===round)status('Your friend is ready. Press Resume to continue together.');
    else if(m.type==='rematch-request')status('Your friend wants a rematch. Choose Rematch when you are ready.');
    return;
  }
  if(m.type==='welcome'&&validSnapshot(m.state)&&m.state.round>=round){round=m.state.round;makeGame(m.state.seed);remoteView=new RemoteView();remoteView.accept(game,m.state,0,now);localReady=false;endedHandled=false;$('menu-screen').hidden=true;$('pause-screen').hidden=true;$('result-screen').hidden=true;$('room-screen').hidden=false;$('room-copy').textContent='Connected to your friend. Ready up as cop.';refreshLobby();updateHud();return;}
  if(m.type==='state'&&m.state?.round===round&&remoteView.accept(game,m.state,m.seq,now)){
    if(game.phase==='playing'){$('menu-screen').hidden=true;$('room-screen').hidden=true;$('pause-screen').hidden=true;$('result-screen').hidden=true;$('pause-btn').disabled=false;$('pause-btn').textContent='Pause';}
    else if(game.phase==='paused'&&$('room-screen').hidden){speech.stop();clearInput();$('pause-screen').hidden=false;$('resume-btn').textContent='Ask host to resume';$('restart-btn').hidden=true;}
    return;
  }
  if(m.type==='events'&&m.round===round&&Array.isArray(m.events)){game.events.push(...m.events.slice(-12).filter(e=>e&&typeof e.text==='string'&&e.text.length<600));}
}
function beginOnline(){
  unlockSound();network?.close();network=new OnlineRoom({onState:(state,text)=>{if(!network)return;status(text);$('room-copy').textContent=text;if(['waiting','lost','error'].includes(state)&&game.phase==='playing'){showPaused();remoteReady=false;}if(['lost','error'].includes(state)){$('pause-screen').hidden=true;$('result-screen').hidden=true;$('room-screen').hidden=false;}refreshLobby();},onConnected:()=>{if(network.isHost){remoteReady=false;hostControls.reset(round);sendWelcome();}refreshLobby();},onMessage:networkMessage});
  role=joinTarget?'cop':'chor';duo=false;round=1;remoteReady=false;localReady=false;netSequence=0;actionSequence=0;snapshotSequence=0;hostControls.reset(round);remoteView=new RemoteView();makeGame(seed);$('menu-screen').hidden=true;$('room-screen').hidden=false;$('pause-screen').hidden=true;$('result-screen').hidden=true;$('room-info').hidden=false;
  try{if(joinTarget)network.join(joinTarget);else network.host();}catch(e){network.setState('error',e.message);$('room-copy').textContent=e.message;refreshLobby();}controls();
}
async function copyRoom(){if(!network?.id)return;const link=roomLink(location.href,network.id,seed);try{await navigator.clipboard.writeText(link);status('Online join link copied. Send it to one friend.');$('room-copy').textContent='Join link copied. Keep this tab open for your friend.';}catch{if(game.phase==='playing')pause(true);$('pause-screen').hidden=true;refreshLobby();$('room-link').value=link;$('room-screen').hidden=false;$('room-link').focus();$('room-link').select();status('Select and copy the join link.');}}
$('room-ready').addEventListener('click',()=>{unlockSound();if(network?.send('ready',{round})){localReady=true;$('room-copy').textContent='You are ready. Waiting for the host to start.';refreshLobby();}});
$('room-start').addEventListener('click',()=>{if(!network?.isHost||!network.connected||!remoteReady)return;unlockSound();if(game.phase==='paused')game.phase='playing';else if(game.phase==='ready')game.start();else{prepareOnline(newSeed(),game.signature);return;}$('room-screen').hidden=true;$('pause-screen').hidden=true;$('result-screen').hidden=true;$('pause-btn').disabled=false;$('pause-btn').textContent='Pause';lastTime=performance.now();focusGame();});
$('room-copy-btn').addEventListener('click',copyRoom);$('sidebar-room-link').addEventListener('click',copyRoom);$('room-leave').addEventListener('click',menu);$('sidebar-leave').addEventListener('click',menu);$('room-retry').addEventListener('click',()=>{joinTarget=network?.id||joinTarget;beginOnline();});
$('online-invite').addEventListener('click',()=>{$('invite-dialog').close();if(game.phase==='playing')pause(true);onlineIntent=true;joinTarget=null;beginOnline();});
window.addEventListener('pagehide',()=>network?.close());
function resize(){if(!renderer)return;const r=canvas.getBoundingClientRect();renderer.resize(r.width||1280,r.height||600,window.devicePixelRatio||1);renderer.render(game,visualTime,reducedMotion,{overview});}
try{renderer=new Renderer(canvas);renderer.loadMapArt().catch(e=>status(e.message));if(window.ResizeObserver)new ResizeObserver(resize).observe($('playfield'));else window.addEventListener('resize',resize);if(joinTarget)role='cop';modeLabels();setSeed();controls();soundLabels();updateHud();resize();requestAnimationFrame(frame);}catch(e){showError(e);}

import {test} from 'node:test';import assert from 'node:assert/strict';
import {CharacterVoice} from '../dist/character-voice.js';import {voiceKey} from '../dist/voice-keys.js';import {hindiLine} from '../dist/dialogue.js';
const url=new URL('https://game.test/assets/audio/manifest.json');
const event=(speaker='chor',spoken='Loot safe. Ab chai!',priority=3)=>({speaker,spoken,hi:hindiLine(spoken),priority});
const clip=e=>[voiceKey(e.speaker,e.hi),`${voiceKey(e.speaker,e.hi)}-0123456789ab.mp3`];
const pack=events=>({version:1,provider:'elevenlabs',language:'hi',clips:Object.fromEntries(events.map(clip))});
const response=data=>async()=>new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}});
function mock({native=true,reject=false}={}){
  let time=0;const media=[],utterances=[],synth={speaking:false,getVoices:()=>[{lang:'hi-IN',name:'Hindi'}],addEventListener(){},removeEventListener(){},speak(u){utterances.push(u);this.speaking=true;},cancel(){this.speaking=false;}};
  class Audio{constructor(src){this.src=src;this.pauses=0;media.push(this);}play(){return reject?Promise.reject(Error('blocked')):Promise.resolve();}pause(){this.pauses++;}}
  const env={Audio,...native?{speechSynthesis:synth,SpeechSynthesisUtterance:class{constructor(text){this.text=text;}}}:{}};
  return{voice:new CharacterVoice(env,()=>time),media,utterances,synth,advance:n=>time+=n};
}
test('a local ElevenLabs pack plays the correct character clip and cancels previous audio',async()=>{
  const a=event(),b=event('cop','Pakad liya!'),m=mock();try{await m.voice.loadPack(response(pack([a,b])),url);assert.equal(m.voice.packAvailable,true);m.voice.setEnabled(true);assert.equal(m.voice.speak(a),true);assert.equal(m.media[0].src,new URL(clip(a)[1],url).href);assert.equal(m.media[0].volume,.8);const stale=m.media[0].onended;m.voice.speak(b);assert.ok(m.media[0].pauses>0);assert.equal(m.media[1].src,new URL(clip(b)[1],url).href);stale();assert.equal(m.voice.active,m.media[1]);assert.equal(m.voice.priority,3);assert.equal(m.utterances.filter(u=>u.text.trim()).length,0);}finally{m.voice.dispose();}
});
test('partial packs switch cleanly to device Hindi without overlapping clip playback',async()=>{
  const a=event(),b=event('cop','Pakad liya!'),m=mock();try{await m.voice.loadPack(response(pack([a])),url);m.voice.setEnabled(true);m.voice.speak(a);m.voice.speak(b);assert.ok(m.media[0].pauses);assert.equal(m.voice.active,null);assert.equal(m.utterances.at(-1).text,b.hi);assert.equal(m.utterances.at(-1).lang,'hi-IN');m.voice.speak(a);assert.equal(m.synth.speaking,false);assert.equal(m.media.length,2);}finally{m.voice.dispose();}
});
test('important clips retain priority and ambient lines do not grow a playback queue',async()=>{
  const a=event(),b=event('neighbor','Samosa sambhal ke!',1),m=mock();try{await m.voice.loadPack(response(pack([a,b])),url);m.voice.setEnabled(true);m.voice.speak(a);m.advance(3);assert.equal(m.voice.speak(b),false);assert.equal(m.media.length,1);m.media[0].onended();assert.equal(m.voice.speak(b),true);assert.equal(m.media.length,2);}finally{m.voice.dispose();}
});
test('pause, mute, restart and quit use stop to cancel clips and stale completion callbacks',async()=>{
  const e=event(),m=mock();try{await m.voice.loadPack(response(pack([e])),url);m.voice.setEnabled(true);m.voice.speak(e);const staleError=m.media[0].onerror,before=m.utterances.length;m.voice.stop();staleError();assert.equal(m.utterances.length,before);assert.equal(m.voice.active,null);assert.equal(m.voice.priority,0);m.voice.speak(e);m.voice.setEnabled(false);assert.equal(m.voice.speak(e),false);assert.ok(m.media.every(a=>a.pauses>0));}finally{m.voice.dispose();}
});
test('a failed or autoplay-blocked clip falls back once to native Hindi and is skipped next time',async()=>{
  const e=event(),m=mock({reject:true});try{await m.voice.loadPack(response(pack([e])),url);m.voice.setEnabled(true);m.voice.speak(e);const error=m.media[0].onerror;await new Promise(r=>setImmediate(r));assert.equal(m.utterances.at(-1).text,e.hi);const count=m.utterances.length;error();assert.equal(m.utterances.length,count);m.voice.speak(e);assert.equal(m.media.length,1);assert.equal(m.utterances.at(-1).text,e.hi);}finally{m.voice.dispose();}
});
test('late failed media promises cannot speak after pause or mute',async()=>{
  const e=event(),m=mock({reject:true});try{await m.voice.loadPack(response(pack([e])),url);m.voice.setEnabled(true);m.voice.speak(e);m.voice.setEnabled(false);const before=m.utterances.length;await new Promise(r=>setImmediate(r));assert.equal(m.utterances.length,before);assert.equal(m.voice.active,null);}finally{m.voice.dispose();}
});
test('a clip pack works without speech synthesis and unavailable packs never block startup',async()=>{
  const e=event(),m=mock({native:false});try{assert.equal(m.voice.supported,false);m.voice.setEnabled(true);await m.voice.loadPack(response(pack([e])),url);assert.equal(m.voice.supported,true);assert.equal(m.voice.enabled,true);assert.equal(m.voice.speak(e),true);const missing=new CharacterVoice({});assert.equal(await missing.loadPack(),false);assert.equal(await missing.loadPack(async()=>{throw Error('offline');},url),false);assert.equal(missing.setEnabled(true),false);assert.equal(missing.speak(e),false);missing.dispose();}finally{m.voice.dispose();}
});
test('manifests cannot load remote media, traversal paths or unbounded clip lists',async()=>{
  for(const clips of [{[clip(event())[0]]:'https://remote.test/clip.mp3'},{[clip(event())[0]]:'../clip.mp3'},{[clip(event())[0]]:clip(event())[1]+'?token=secret'},Object.fromEntries(Array.from({length:301},(_,i)=>[String(i),'clip.mp3']))]){
    const m=mock();try{assert.equal(await m.voice.loadPack(response({...pack([]),clips}),url),false);assert.equal(m.voice.packAvailable,false);assert.equal(m.media.length,0);}finally{m.voice.dispose();}
  }
});

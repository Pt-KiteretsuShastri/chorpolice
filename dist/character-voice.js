/** Local ElevenLabs clips first; device Hindi speech and captions remain usable. */
import {SpeechController} from './audio.js';
import {hindiLine} from './dialogue.js';
import {voiceKey} from './voice-keys.js';
export class CharacterVoice{
  constructor(env=globalThis,now=()=>performance.now()/1000){
    this.env=env;this.now=now;this.native=new SpeechController(env,now);this.native.onVoicesChanged=()=>this.onVoicesChanged?.();
    this.enabled=false;this.wanted=false;this.unlocked=false;this.clips=new Map();this.failed=new Set();this.active=null;this.watchdog=null;this.priority=0;this.last=-100;this.serial=0;this.packState='empty';
  }
  get packAvailable(){return typeof this.env.Audio==='function'&&this.clips.size>0;}
  get supported(){return this.packAvailable||this.native.supported;}
  get hindiUnavailable(){return !this.packAvailable&&this.native.hindiUnavailable;}
  async loadPack(fetcher=this.env.fetch?.bind(this.env),url=new URL('./assets/audio/manifest.json',import.meta.url)){
    if(!fetcher)return false;this.packState='loading';let timer;const abort=typeof this.env.AbortController==='function'?new this.env.AbortController():null;
    try{
      if(abort)timer=setTimeout(()=>abort.abort(),2000);
      const response=await fetcher(url,{signal:abort?.signal});if(!response.ok)throw Error('Missing voice pack');const data=await response.json();
      if(data.version!==1||data.provider!=='elevenlabs'||data.language!=='hi'||!data.clips||typeof data.clips!=='object'||Array.isArray(data.clips)||Object.keys(data.clips).length>300)throw Error('Invalid voice pack');
      const clips=new Map();for(const [key,file]of Object.entries(data.clips)){
        if(!/^(chor|cop|neighbor|cooker|trophy|samosa|radio|chappal)-[a-f0-9]{8}$/.test(key)||typeof file!=='string'||!file.startsWith(key+'-')||!new RegExp('^'+key+'-[a-f0-9]{12}\\.mp3$').test(file))throw Error('Invalid voice clip');
        clips.set(key,new URL(file,url).href);
      }
      this.clips=clips;this.failed.clear();this.packState=clips.size?'ready':'empty';
      if(this.unlocked&&this.wanted)this.enabled=this.supported;
      return this.packAvailable;
    }catch{this.packState='unavailable';return false;}
    finally{clearTimeout(timer);this.onVoicesChanged?.();}
  }
  setEnabled(value){
    this.stop();this.wanted=!!value;this.unlocked ||= this.wanted;
    this.native.setEnabled(this.wanted);this.enabled=this.wanted&&(this.packAvailable||this.native.enabled);return this.enabled;
  }
  stop(){
    clearTimeout(this.watchdog);this.watchdog=null;
    this.serial++;const audio=this.active;this.active=null;if(audio){audio.onended=null;audio.onerror=null;try{audio.pause();audio.currentTime=0;}catch{}}
    this.native.stop();this.priority=0;this.last=-100;
  }
  speak(event){
    if(!this.enabled)return false;
    const priority=event.priority||1,now=this.now();
    if(priority<3&&now-this.last<2.4)return false;
    if((this.active||this.native.synth?.speaking)&&priority<this.priority)return false;
    const text=event.hi||hindiLine(event.spoken),key=voiceKey(event.speaker,text),url=key&&!this.failed.has(key)?this.clips.get(key):null;
    if(!url||typeof this.env.Audio!=='function'){
      this.stop();
      const spoken=this.native.speak({...event,hi:text});if(spoken){this.last=now;this.priority=priority;}return spoken;
    }
    this.stop();this.last=now;this.priority=priority;const serial=++this.serial;let audio;
    const fallback=()=>{
      if(serial!==this.serial||!this.enabled)return;
      clearTimeout(this.watchdog);this.watchdog=null;
      this.serial++;this.failed.add(key);if(audio){audio.onended=null;audio.onerror=null;try{audio.pause();}catch{}}
      this.active=null;this.priority=0;if(this.native.speak({...event,hi:text}))this.priority=priority;
    };
    try{
      audio=new this.env.Audio(url);this.active=audio;audio.preload='auto';audio.volume=.8;
      audio.onended=()=>{if(serial===this.serial){clearTimeout(this.watchdog);this.watchdog=null;this.active=null;this.priority=0;}};audio.onerror=fallback;
      this.watchdog=setTimeout(fallback,8000);
      const playing=audio.play();playing?.catch?.(fallback);return true;
    }catch{fallback();return false;}
  }
  dispose(){this.stop();this.enabled=false;this.wanted=false;this.native.dispose();}
}

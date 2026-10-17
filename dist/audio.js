/** Optional browser audio; neither API is required for the simulation. */
export class SpeechController{
  constructor(env=globalThis,now=()=>performance.now()/1000){
    this.env=env;this.now=now;this.synth=env.speechSynthesis;this.Utterance=env.SpeechSynthesisUtterance;
    this.supported=!!(this.synth&&this.Utterance&&typeof this.synth.speak==='function');this.enabled=false;this.voices=[];this.last=-100;this.priority=0;this.serial=0;
    this.refresh=()=>{try{this.voices=this.synth?.getVoices?.()||[];}catch{this.voices=[];}this.onVoicesChanged?.();};
    this.refresh();this.synth?.addEventListener?.('voiceschanged',this.refresh);
  }
  get hindiVoice(){return this.voices.find(v=>/^hi[-_]IN$/i.test(v.lang))||this.voices.find(v=>/^hi(?:[-_]|$)/i.test(v.lang));}
  get hindiUnavailable(){return this.voices.length>0&&!this.hindiVoice;}
  setEnabled(value){
    this.stop();this.enabled=!!value&&this.supported;
    if(this.enabled){try{const u=new this.Utterance(' ');u.volume=0;this.synth.speak(u);this.synth.cancel();}catch{this.enabled=false;}}
    return this.enabled;
  }
  stop(){this.serial++;try{this.synth?.cancel?.();}catch{}this.priority=0;this.last=-100;}
  speak(event){
    if(!this.enabled||!this.supported)return false;
    const priority=event.priority||1,now=this.now();
    if(priority<3&&now-this.last<2.4)return false;
    if(this.synth.speaking&&priority<this.priority)return false;
    try{
      this.refresh();const voice=this.hindiVoice;
      const text=event.hi||(/[\u0900-\u097f]/.test(event.spoken||'')?event.spoken:null);
      // Ask for Hindi while voices load. If the installed list has no Hindi voice,
      // keep captions rather than reading Hindi lines with an English voice.
      if(!text||this.hindiUnavailable)return false;
      this.synth.cancel();const serial=++this.serial,u=new this.Utterance(text);
      if(voice)u.voice=voice;u.lang=voice?.lang||'hi-IN';u.rate=.98;u.volume=.8;
      u.pitch=event.speaker==='cop' ? .82:event.speaker==='samosa'?1.3:event.speaker==='radio'?1.05:1;
      this.last=now;this.priority=priority;u.onend=()=>{if(serial===this.serial)this.priority=0;};u.onerror=u.onend;this.synth.speak(u);return true;
    }catch{this.stop();return false;}
  }
  dispose(){this.stop();this.synth?.removeEventListener?.('voiceschanged',this.refresh);}
}

export class Effects{
  constructor(env=globalThis){this.env=env;this.enabled=true;this.audio=null;}
  unlock(){if(!this.enabled)return;try{const A=this.env.AudioContext||this.env.webkitAudioContext;if(A)this.audio ||= new A();this.audio?.resume?.().catch?.(()=>{});}catch{this.audio=null;}}
  play(kind){
    if(!this.enabled)return;this.unlock();if(!this.audio)return;
    const notes={pickup:[440,660],bank:[523,659,784],catch:[330,220,165],end:[392,523,659,784],hush:[294,392],refusal:[220,196],net:[180,220],chai:[440,554,660],start:[392,523],jump:[330,494],boost:[440,554,740],patrol:[392,349],event:[330,440,554]}[kind];
    if(!notes)return;
    try{notes.forEach((freq,i)=>{const o=this.audio.createOscillator(),g=this.audio.createGain(),t=this.audio.currentTime+i*.085;o.type='sine';o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.045,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+.15);o.connect(g);g.connect(this.audio.destination);o.start(t);o.stop(t+.16);});}catch{}
  }
}

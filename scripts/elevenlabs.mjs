/** Offline generation only. No API key or paid endpoint is shipped to players. */
import {readFile,writeFile,mkdir,rename,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {LOOT_TYPES,LINES,SHARED_LINES,hindiLine} from '../dist/dialogue.js';
import {VOICE_SPEAKERS,voiceKey} from '../dist/voice-keys.js';
const ROOT=new URL('../',import.meta.url);
export function dialogueScript(){
  const result=new Map(),add=(speaker,lines)=>{for(const caption of lines.flat()){const text=hindiLine(caption);if(!text)throw Error(`Missing Hindi translation for ${caption}`);const key=voiceKey(speaker,text);if(!key)throw Error('Invalid dialogue identifier');const old=result.get(key);if(old&&old.text!==text)throw Error('Dialogue identifier collision');result.set(key,{key,speaker,text});}};
  add('chor',[...LINES.pickup,...LINES.bank,...LINES.tea,...LINES.victory,SHARED_LINES.net]);
  add('cop',[...LINES.chase,...LINES.escape,...LINES.caught,SHARED_LINES.copWin]);
  add('neighbor',LINES.neighbor);
  for(const l of LOOT_TYPES)add(l.id,[l.clue,l.reply,...l.complaints,SHARED_LINES.refusal,...SHARED_LINES.agreement,SHARED_LINES.quiet,SHARED_LINES.waiting]);
  return [...result.values()];
}
export function generationPlan(config,{speaker='all',fallbackVoice=''}={}){
  if(speaker!=='all'&&!VOICE_SPEAKERS.includes(speaker))throw Error('Unknown speaker. Choose all or an authored character.');
  if(!['eleven_multilingual_v2','eleven_flash_v2_5'].includes(config.modelId))throw Error('Choose the supported Hindi model eleven_multilingual_v2 or eleven_flash_v2_5.');
  if(config.outputFormat!=='mp3_44100_128')throw Error('Use the bundled MP3 output format.');
  return dialogueScript().filter(l=>speaker==='all'||l.speaker===speaker).map(l=>{
    const voiceId=config.voices?.[l.speaker]||fallbackVoice;if(voiceId&&!/^[a-zA-Z0-9_-]{5,80}$/.test(voiceId))throw Error(`Invalid voice ID for ${l.speaker}`);
    const body={text:l.text,model_id:config.modelId,voice_settings:config.voiceSettings};
    // Multilingual v2 does not accept language_code. Devanagari provides Hindi.
    if(config.modelId!=='eleven_multilingual_v2')body.language_code='hi';
    const fingerprint=createHash('sha256').update(JSON.stringify({voiceId,format:config.outputFormat,body})).digest('hex').slice(0,12);
    return {...l,voiceId,body,file:`${l.key}-${fingerprint}.mp3`};
  });
}
export async function generateClips(plan,{apiKey,outputDir,fetcher=fetch,onProgress=()=>{}}){
  if(!apiKey)throw Error('Set ELEVENLABS_API_KEY privately before generating audio.');
  if(plan.some(l=>!l.voiceId))throw Error('Choose a voice ID for every selected speaker in audio/elevenlabs.config.json, or set ELEVENLABS_VOICE_ID.');
  await mkdir(outputDir,{recursive:true});const manifestPath=resolve(outputDir,'manifest.json');let clips={};
  try{const m=JSON.parse(await readFile(manifestPath,'utf8'));if(m.version===1&&m.provider==='elevenlabs'&&m.language==='hi'&&m.clips&&typeof m.clips==='object')clips={...m.clips};}catch{}
  const save=async()=>{const temp=manifestPath+'.tmp';await writeFile(temp,JSON.stringify({version:1,provider:'elevenlabs',language:'hi',clips},null,2)+'\n');await rename(temp,manifestPath);};
  for(const line of plan){
    const path=resolve(outputDir,line.file);let cached=false;try{cached=(await stat(path)).size>128;}catch{}
    if(!cached){
      // No automatic retry: a retry can spend credits again after a timeout.
      let response;try{response=await fetcher(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(line.voiceId)}?output_format=mp3_44100_128`,{method:'POST',headers:{'xi-api-key':apiKey,'Content-Type':'application/json'},body:JSON.stringify(line.body),signal:AbortSignal.timeout(45000)});}catch{throw Error(`Generation timed out or could not connect for ${line.speaker}; rerun to resume completed files.`);}
      if(!response.ok)throw Error(`ElevenLabs returned HTTP ${response.status} for ${line.speaker}. Check account access, voice ID and credits. Completed clips are preserved.`);
      const type=response.headers.get('content-type')||'';if(!/audio\//i.test(type))throw Error('ElevenLabs returned a non-audio response.');
      const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length<129||bytes.length>5_000_000)throw Error('Generated audio has an unexpected size.');
      await writeFile(path+'.tmp',bytes);await rename(path+'.tmp',path);
    }
    clips[line.key]=line.file;await save();onProgress({speaker:line.speaker,key:line.key,cached});
  }
  return {version:1,provider:'elevenlabs',language:'hi',clips};
}
async function main(){
  const args=process.argv.slice(2),speakerIndex=args.indexOf('--speaker'),speaker=speakerIndex<0?'all':args[speakerIndex+1];
  if(speakerIndex>=0&&!speaker)throw Error('--speaker needs a character name.');
  const apiKey=process.env.ELEVENLABS_API_KEY;
  if(args.includes('--list-voices')){
    if(!apiKey)throw Error('Set ELEVENLABS_API_KEY privately to list your available voices.');
    let token;do{const url=new URL('https://api.elevenlabs.io/v2/voices');url.searchParams.set('page_size','100');if(token)url.searchParams.set('next_page_token',token);
      const response=await fetch(url,{headers:{'xi-api-key':apiKey},signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error(`Voice listing returned HTTP ${response.status}`);const data=await response.json();
      for(const v of data.voices||[])console.log(JSON.stringify({id:v.voice_id,name:v.name,labels:v.labels,languages:v.verified_languages?.map(l=>l.language)}));
      const next=data.has_more?data.next_page_token:null;if(next&&next===token)throw Error('Voice listing returned a repeated page token');token=next;
    }while(token);return;
  }
  const config=JSON.parse(await readFile(new URL('audio/elevenlabs.config.json',ROOT),'utf8')),plan=generationPlan(config,{speaker,fallbackVoice:process.env.ELEVENLABS_VOICE_ID||''});
  const summary=VOICE_SPEAKERS.map(id=>({speaker:id,clips:plan.filter(l=>l.speaker===id).length,characters:plan.filter(l=>l.speaker===id).reduce((n,l)=>n+l.text.length,0),voiceSelected:plan.some(l=>l.speaker===id&&l.voiceId)})).filter(l=>l.clips);
  console.table(summary);console.log(`${plan.length} clips, ${plan.reduce((n,l)=>n+l.text.length,0)} text characters before cached files are skipped. Your account/model determines credit usage.`);
  if(!args.includes('--generate')){console.log('Plan only. No API request was made. Use --generate to create the selected clips.');return;}
  const result=await generateClips(plan,{apiKey,outputDir:fileURLToPath(new URL('dist/assets/audio/',ROOT)),onProgress:l=>console.log(`${l.cached?'Reused':'Generated'} ${l.key}`)});
  console.log(`Saved ${Object.keys(result.clips).length} clip mappings. Commit dist/assets/audio and deploy dist as usual.`);
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)main().catch(error=>{process.exitCode=1;console.error(error.message||'Audio generation failed. Completed clips are kept; rerun to resume.');});

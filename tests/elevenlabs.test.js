import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';
import {dialogueScript,generationPlan,generateClips} from '../scripts/elevenlabs.mjs';
import {VOICE_SPEAKERS,voiceKey} from '../dist/voice-keys.js';
import {LOOT_TYPES,LINES,SHARED_LINES,hindiLine} from '../dist/dialogue.js';
const config={modelId:'eleven_multilingual_v2',outputFormat:'mp3_44100_128',voiceSettings:{stability:.45},voices:{}};
const audio=()=>new Response(new Uint8Array(512).fill(42),{headers:{'content-type':'audio/mpeg'}});
test('the generation script covers every authored Hindi reaction for the correct character',()=>{
  const script=dialogueScript(),keys=new Set(script.map(l=>l.key));assert.equal(keys.size,script.length);assert.deepEqual(new Set(script.map(l=>l.speaker)),new Set(VOICE_SPEAKERS));
  for(const [speaker,lines]of [['chor',[...LINES.pickup,...LINES.bank,...LINES.tea,...LINES.victory,SHARED_LINES.net]],['cop',[...LINES.chase,...LINES.escape,...LINES.caught,SHARED_LINES.copWin]],['neighbor',LINES.neighbor],...LOOT_TYPES.map(l=>[l.id,[l.clue,l.reply,...l.complaints,SHARED_LINES.refusal,...SHARED_LINES.agreement,SHARED_LINES.quiet,SHARED_LINES.waiting]])])for(const text of lines)assert.ok(keys.has(voiceKey(speaker,hindiLine(text))),`${speaker}: ${text}`);
  for(const l of script)assert.match(l.text,/[\u0900-\u097f]/);assert.equal(voiceKey('unknown','hello'),null);
});
test('clip plans enforce model support and invalidate cached files when a voice changes',()=>{
  const a=generationPlan(config,{speaker:'cop',fallbackVoice:'voiceOne'}),b=generationPlan(config,{speaker:'cop',fallbackVoice:'voiceTwo'});assert.ok(a.length);assert.equal(a[0].key,b[0].key);assert.notEqual(a[0].file,b[0].file);assert.equal(a[0].body.language_code,undefined);assert.equal(generationPlan({...config,modelId:'eleven_flash_v2_5'},{speaker:'cop'})[0].body.language_code,'hi');assert.throws(()=>generationPlan(config,{speaker:'nobody'}));assert.throws(()=>generationPlan({...config,modelId:'english-only'}));assert.throws(()=>generationPlan(config,{fallbackVoice:'../voice'}));
});
test('generation makes no request without a private key and selected voices',async()=>{
  let calls=0;const fetcher=async()=>{calls++;return audio();};await assert.rejects(generateClips(generationPlan(config),{outputDir:tmpdir(),fetcher}),/ELEVENLABS_API_KEY/);await assert.rejects(generateClips(generationPlan(config),{apiKey:'test-key',outputDir:tmpdir(),fetcher}),/voice ID/);assert.equal(calls,0);
});
test('generation saves each completed clip, resumes after failure, and never writes the API key',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'gully-voice-'));try{
    const plan=generationPlan(config,{speaker:'chor',fallbackVoice:'voiceOne'}).slice(0,2);let calls=0;
    const fetcher=async(url,options)=>{calls++;assert.match(url,/^https:\/\/api.elevenlabs.io\/v1\/text-to-speech\/voiceOne\?/);assert.equal(options.headers['xi-api-key'],'private-test-key');assert.match(JSON.parse(options.body).text,/[\u0900-\u097f]/);return calls===2?new Response('',{status:403}):audio();};
    await assert.rejects(generateClips(plan,{apiKey:'private-test-key',outputDir:dir,fetcher}),/HTTP 403/);const partial=JSON.parse(await readFile(join(dir,'manifest.json'),'utf8'));assert.equal(Object.keys(partial.clips).length,1);
    const done=await generateClips(plan,{apiKey:'private-test-key',outputDir:dir,fetcher});assert.equal(calls,3,'Regenerated a paid clip after resuming');assert.equal(Object.keys(done.clips).length,2);assert.doesNotMatch(await readFile(join(dir,'manifest.json'),'utf8'),/private-test-key/);
    await generateClips(plan,{apiKey:'private-test-key',outputDir:dir,fetcher});assert.equal(calls,3,'Spent credits again for cached audio');
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('non-audio service responses cannot be published as playable clips',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'gully-voice-'));try{await assert.rejects(generateClips(generationPlan(config,{speaker:'cop',fallbackVoice:'voiceOne'}).slice(0,1),{apiKey:'test-key',outputDir:dir,fetcher:async()=>new Response('error',{headers:{'content-type':'application/json'}})}),/non-audio/);await assert.rejects(readFile(join(dir,'manifest.json')));}finally{await rm(dir,{recursive:true,force:true});}
});
test('the default CLI is a keyless, non-billable preview',()=>{
  const text=execFileSync(process.execPath,['scripts/elevenlabs.mjs'],{cwd:new URL('../',import.meta.url),encoding:'utf8',env:{PATH:process.env.PATH}});assert.match(text,/77 clips/);assert.match(text,/Plan only. No API request was made/);
});

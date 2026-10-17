/** Stable dialogue identifiers shared by the offline generator and browser. */
export const VOICE_SPEAKERS=['chor','cop','neighbor','cooker','trophy','samosa','radio','chappal'];
export function voiceKey(speaker,text){
  if(!VOICE_SPEAKERS.includes(speaker)||typeof text!=='string'||!text.trim()||text.length>600)return null;
  let hash=2166136261;for(const ch of text.normalize('NFC')){hash^=ch.codePointAt(0);hash=Math.imul(hash,16777619);}
  return `${speaker}-${(hash>>>0).toString(16).padStart(8,'0')}`;
}

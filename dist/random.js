export function seedNumber(value){
  if(typeof value==='number'&&Number.isFinite(value))return value>>>0;
  const s=String(value??'gully');let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;
}
export function randomFrom(seed){let a=seedNumber(seed);return()=>{a=(a+0x6d2b79f5)>>>0;let t=Math.imul(a^(a>>>15),1|a);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};}
export function shuffled(list,rand){const out=[...list];for(let i=out.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}

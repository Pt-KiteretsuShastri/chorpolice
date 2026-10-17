/** Shared keyboard mapping, independent of DOM and simulation. */
export function movement(keys,touch={x:0,y:0,sprint:false},duo=false,role='chor'){
  const wasd={x:Number(keys.has('KeyD'))-Number(keys.has('KeyA')),y:Number(keys.has('KeyS'))-Number(keys.has('KeyW'))};
  const arrows={x:Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft')),y:Number(keys.has('ArrowDown'))-Number(keys.has('ArrowUp'))};
  const sprint=keys.has('ShiftLeft')||keys.has('ShiftRight')||touch.sprint;
  if(duo)return{chor:{...wasd,sprint},cop:{...arrows,sprint:keys.has('Slash')}};
  const input={x:Math.max(-1,Math.min(1,wasd.x+arrows.x+(touch.x||0))),y:Math.max(-1,Math.min(1,wasd.y+arrows.y+(touch.y||0))),sprint};
  return role==='cop'?{cop:input}:{chor:input};
}
export function actionFor(code,duo=false,role='chor'){
  if((duo&&code==='Enter')||(!duo&&role==='cop'&&code==='Space'))return 'net';
  if(duo||role==='chor')return {KeyE:'interact',KeyF:'persuade',KeyQ:'drop',Space:'jump'}[code]||null;
  return null;
}

export const LOOT_TYPES=[
  {id:'cooker',name:'Chef Seeti',short:'COOKER',color:'#b6c9b1',slow:.96,noise:300,interval:5,
    desire:'a peaceful picnic',clue:'I have had enough pressure. Take me somewhere peaceful.',offer:'A picnic. No pressure, promise.',reply:'Theek hai. Seeti band!',replyHi:'ठीक है। सीटी बंद!',
    description:'Loud whistles. A peaceful picnic keeps the pressure down.',
    complaints:['Main pressure mein hoon!','Seeti baja doon kya?','Gas toh band ki thi na?']},
  {id:'trophy',name:'Sir Jeet-a-Lot',short:'TROPHY',color:'#f0ca67',slow:.89,noise:235,interval:6,
    desire:'an admiring audience',clue:'A star like me deserves applause. What is your offer?',offer:'A whole gully cheering for you.',reply:'Finally! An audience with taste.',
    description:'A heavy ego slows you down. Promise a cheering audience.',
    complaints:['Mera award kahan hai?','Applause, please!','Best supporting chor!']},
  {id:'samosa',name:'Samosa Singh',short:'SAMOSA',color:'#efa865',slow:1,noise:255,interval:5.7,
    desire:'extra chutney',clue:'A dry getaway? Not happening. Where is my chutney?',offer:'Unlimited green chutney, bhai.',reply:'Chutney ke liye kuch bhi!',replyHi:'चटनी के लिए कुछ भी!',
    description:'Small snack. Big mouth. Extra chutney earns its silence.',
    complaints:['Bhai, chutney toh le le!','Thanda ho raha hoon!','Mujhe kha mat lena!']},
  {id:'radio',name:'Bol Bachchan Radio',short:'RADIO',color:'#d7ae72',slow:.98,noise:320,interval:5.2,
    desire:'an exclusive broadcast',clue:'I need a show of my own. Make me a star.',offer:'Your own late-night radio show.',reply:'Exclusive deal. Going off-air!',
    description:'A noisy broadcaster. Offer a private show to turn it down.',
    complaints:['Breaking news! Chor in the gully!','Hello, hello! Mic testing!','Yeh hai gully radio!']},
  {id:'chappal',name:'Chappal Express',short:'CHAPPAL',color:'#dd916e',slow:1,noise:215,interval:6.5,
    desire:'a first-class ride',clue:'I walk all day. Someone else can carry me for once.',offer:'A first-class ride. No walking.',reply:'VIP passenger, coming through!',
    description:'Promise a first-class ride. Rewards you with a brief speed perk.',
    complaints:['Arey, dheere chalo!','VIP passenger hoon main!','Meri jodi kidhar hai?']}
];
export const DISTRACTIONS=['A silent cupboard forever.','A lifetime of boring homework.','A one-way trip to the recycling bin.','You can carry my bag instead.','No snacks, no music, no attention.'];
export const LINES={
  pickup:['Aaja, mere saath.','Deal pakki. Ab chup rehna!','Maal mil gaya. Ab nikal!'],
  bank:['Maal safe. Ab chai!','Ek aur. Gully still believes in me.','Delivery complete, boss!'],
  chase:['Ruk ja, samose ke saudagar!','Oye! Bag mein kya hai?','Gully watch, reporting for duty!'],
  escape:['Kidhar gaya?','Aaj phir chai wale ne bacha liya.','I will check the next lane.'],
  caught:['Pakad liya!','Chori ka plan thoda kaccha tha.','Thane mein chai milegi.'],
  neighbor:['Arre, phir shuru ho gaye!','Aaj ki gully news: full drama.','Chai thandi ho jayegi, beta!','Samosa sambhal ke!'],
  tea:['Ek cutting. Aur thodi invisibility.','Chai ke peeche chhup jao.','Main toh bas chai pee raha hoon.'],
  victory:['Party toh banti hai!','Maal bhi safe. Mood bhi set.','Gully legend, reporting!']
};
export function speakerName(id){return id==='chor'?'Chor':id==='cop'?'Inspector':id==='neighbor'?'Neighbour':LOOT_TYPES.find(l=>l.id===id)?.name||'Gully';}

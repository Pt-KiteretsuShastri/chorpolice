/** Two-player WebRTC data rooms. PeerJS Cloud brokers connections; no media is requested. */
import {PROTOCOL} from './net-state.js';
export const validRoom=id=>typeof id==='string'&&/^gully-[a-f0-9]{24}$/.test(id);
export function roomId(crypto=globalThis.crypto){const b=new Uint8Array(12);crypto.getRandomValues(b);return `gully-${[...b].map(v=>v.toString(16).padStart(2,'0')).join('')}`;}
export function roomLink(base,id,seed){if(!validRoom(id))throw new Error('Invalid room link.');const u=new URL(base);u.searchParams.set('room',id);u.searchParams.set('seed',String(seed));u.hash='';return u.href;}
export function roomInURL(url){const id=new URL(url).searchParams.get('room');return validRoom(id)?id:null;}
const ERROR_COPY={'peer-unavailable':'This room is offline. Ask your friend to keep the host tab open.','browser-incompatible':'This browser cannot connect online. Try a current Chrome, Edge, Firefox or Safari.','unavailable-id':'That room is already open. Create a new room.','network':'Connection signaling is unavailable. Try again or use another network.','webrtc':'The peer connection failed. Try another network.','socket-error':'Connection signaling failed. Try again shortly.','socket-closed':'The signaling connection closed. Try again.'};
export class OnlineRoom{
  constructor({PeerClass=globalThis.Peer,now=()=>performance.now(),onState=()=>{},onMessage=()=>{},onConnected=()=>{}}={}){this.PeerClass=PeerClass;this.now=now;this.onState=onState;this.onMessage=onMessage;this.onConnected=onConnected;this.state='idle';this.connected=false;this.conn=null;this.peer=null;this.closed=false;this.ping=null;}
  setState(state,text){this.state=state;this.onState(state,text);}
  host(id=roomId()){return this.open(id,true);}
  join(id){return this.open(id,false);}
  open(id,isHost){
    if(!validRoom(id))throw new Error('Invalid room link.');this.id=id;this.isHost=isHost;if(!this.PeerClass)throw new Error('Online support could not load. Solo play still works.');
    this.id=id;this.isHost=isHost;this.closed=false;this.started=this.now();this.lastPing=0;this.setState('connecting',isHost?'Creating your online gully…':'Finding your friend’s gully…');
    const peer=this.peer=new this.PeerClass(isHost?id:`guest-${roomId()}`,{host:'0.peerjs.com',port:443,secure:true,debug:0});
    peer.on('open',()=>{if(this.closed)return;if(isHost)this.setState('waiting','Room open. Share the join link, then wait for your friend.');else this.attach(peer.connect(id,{reliable:true,serialization:'json',metadata:{protocol:PROTOCOL}}));});
    peer.on('connection',conn=>{if(!isHost||this.conn||conn.metadata?.protocol!==PROTOCOL){conn.on('open',()=>{conn.send({type:'reject',protocol:PROTOCOL,text:'This room already has two players or uses another game version.'});setTimeout(()=>conn.close(),50);});return;}this.attach(conn);});
    peer.on('error',e=>{if(this.connected&&['network','socket-error','socket-closed'].includes(e.type))return;this.fail(ERROR_COPY[e.type]||'Could not connect online. Try again or use another network.');});
    peer.on('disconnected',()=>{if(this.closed)return;try{peer.reconnect();}catch{if(!this.connected)this.fail('Signaling disconnected. Reopen the room and try again.');}});
    peer.on('close',()=>{if(!this.closed)this.fail('The online room closed. Reopen it to continue.');});return id;
  }
  attach(conn){
    this.conn=conn;this.started=this.now();this.transportOpen=false;this.connected=false;
    conn.on('open',()=>{if(this.conn!==conn||this.closed)return;this.transportOpen=true;this.lastHeard=this.now();this.raw({type:'hello',protocol:PROTOCOL,host:this.isHost});});
    conn.on('data',message=>{
      if(this.conn!==conn||this.closed||!message||typeof message!=='object')return;
      try{if(JSON.stringify(message).length>65000)return;}catch{return;}
      this.lastHeard=this.now();
      if(message.type==='reject'){this.fail(message.text||'This room is full.');return;}
      if(message.protocol!==PROTOCOL){this.fail('Game versions differ. Reload both tabs and create a new room.');return;}
      if(message.type==='hello'){
        if(message.host===this.isHost){this.fail('Room roles did not match. Create a new room.');return;}
        if(!this.connected){this.connected=true;this.setState('connected','Two players connected. Ready up to start.');this.onConnected();}return;
      }
      if(!this.connected)return;
      if(message.type==='ping'){this.send('pong',{at:message.at});return;}
      if(message.type==='pong'){if(Number.isFinite(message.at))this.ping=Math.max(0,this.now()-message.at);return;}
      this.onMessage(message);
    });
    conn.on('close',()=>{if(this.conn!==conn||this.closed)return;this.conn=null;this.connected=false;this.transportOpen=false;this.setState(this.isHost?'waiting':'lost',this.isHost?'Friend disconnected. Round paused. They can rejoin with the same link.':'Host disconnected. The round is paused. Reconnect or ask for a new link.');});
    conn.on('error',()=>{if(this.conn===conn)this.fail('The player connection failed. Rejoin the room or try another network.');});
  }
  raw(message){if(!this.conn?.open)return false;try{this.conn.send(message);return true;}catch{return false;}}
  send(type,body={}){return this.connected&&this.raw({...body,type,protocol:PROTOCOL});}
  update(){
    if(this.closed)return;const now=this.now();
    if((this.state==='connecting'||(this.transportOpen&&!this.connected))&&now-this.started>20000){this.fail('Connection timed out. Keep the host tab open and try another network if needed.');return;}
    if(!this.connected)return;
    if(now-this.lastHeard>8000){this.conn?.close();if(this.connected){this.connected=false;this.conn=null;this.setState(this.isHost?'waiting':'lost','Connection interrupted. Round paused; rejoin with the same link.');}return;}
    if(now-this.lastPing>1000){this.lastPing=now;this.send('ping',{at:now});}
  }
  fail(text){if(this.closed)return;this.close(false);this.setState('error',text);}
  close(notify=true){this.closed=true;this.connected=false;const c=this.conn;this.conn=null;try{c?.close();this.peer?.destroy();}catch{}this.peer=null;if(notify)this.setState('closed','Left the online room.');}
}

 import { useState, useEffect, useRef, useCallback } from 'react';

// ════════════════════════════════════════════════════════
//  🔊  AUDIO  – unlock() MUST be called inside onClick
// ════════════════════════════════════════════════════════
let AC = null, MUTED = false;
function unlock() {
if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch(*){} }
if (AC && AC.state !== “running”) AC.resume();
}
function boop(f, d, t=“sine”, v=0.15, sl=null) {
if (MUTED || !AC || AC.state !== “running”) return;
try {
const o=AC.createOscillator(), g=AC.createGain();
o.connect(g); g.connect(AC.destination);
o.type=t; o.frequency.value=f;
if(sl) o.frequency.linearRampToValueAtTime(sl, AC.currentTime+d);
g.gain.setValueAtTime(v, AC.currentTime);
g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime+d);
o.start(); o.stop(AC.currentTime+d+0.1);
} catch(*) {}
}
function noize(d, v=0.12, cut=800) {
if (MUTED || !AC || AC.state !== “running”) return;
try {
const buf=AC.createBuffer(1,AC.sampleRate*d,AC.sampleRate), dt=buf.getChannelData(0);
for(let i=0;i<dt.length;i++) dt[i]=Math.random()*2-1;
const src=AC.createBufferSource(), fl=AC.createBiquadFilter(), g=AC.createGain();
fl.type=“lowpass”; fl.frequency.value=cut;
g.gain.setValueAtTime(v,AC.currentTime); g.gain.exponentialRampToValueAtTime(0.001,AC.currentTime+d);
src.buffer=buf; src.connect(fl); fl.connect(g); g.connect(AC.destination);
src.start(); src.stop(AC.currentTime+d+0.05);
} catch(_) {}
}
const S = {
click:   ()=>boop(680,0.06,“sine”,0.1),
correct: ()=>{boop(520,0.08,“sine”,0.2);setTimeout(()=>boop(780,0.12,“sine”,0.2),80);},
wrong:   ()=>boop(200,0.22,“sawtooth”,0.2,150),
jump:    ()=>{boop(260,0.06,“square”,0.16);boop(420,0.1,“sine”,0.1);},
dbl:     ()=>{boop(500,0.06,“square”,0.14);boop(640,0.1,“sine”,0.09);},
coin:    ()=>{boop(880,0.07,“sine”,0.18);setTimeout(()=>boop(1100,0.09,“sine”,0.16),65);},
hit:     ()=>{noize(0.18,0.22,380);boop(110,0.18,“sawtooth”,0.16);},
die:     ()=>[380,300,240,190].forEach((f,i)=>setTimeout(()=>boop(f,0.2,“sawtooth”,0.18),i*130)),
win:     ()=>[500,640,760,1000].forEach((f,i)=>setTimeout(()=>boop(f,0.16,“sine”,0.18),i*90)),
fanfare: ()=>[400,500,600,800,1000,1200].forEach((f,i)=>setTimeout(()=>boop(f,0.15,“sine”,0.22),i*70)),
slice:   ()=>{noize(0.1,0.2,1800);boop(900,0.06,“sawtooth”,0.08,280);},
bomb:    ()=>{noize(0.36,0.36,280);boop(75,0.36,“sawtooth”,0.26,38);},
eat:     ()=>boop(500,0.07,“square”,0.13,680),
whack:   ()=>{noize(0.07,0.26,1100);boop(190,0.07,“square”,0.16);},
flip:    ()=>boop(640,0.07,“sine”,0.1),
match:   ()=>{boop(640,0.1,“sine”,0.15);setTimeout(()=>boop(860,0.13,“sine”,0.17),85);},
swipe:   ()=>noize(0.06,0.06,1400),
miss:    ()=>boop(280,0.1,“sawtooth”,0.16,140),
timeup:  ()=>[420,320,210].forEach((f,i)=>setTimeout(()=>boop(f,0.2,“sawtooth”,0.2),i*150)),
tick:    ()=>boop(1200,0.04,“sine”,0.07),
num:     ()=>boop(440,0.05,“sine”,0.1),
};

// ════════════════════════════════════════════════════════
//  👆 SWIPE HOOK
// ════════════════════════════════════════════════════════
function useSwipe(ref, cb, thr=30) {
useEffect(()=>{
const el=ref.current; if(!el) return;
let sx=0,sy=0;
const ts=e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY;};
const te=e=>{const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)<thr&&Math.abs(dy)<thr){cb(“tap”);return;}cb(Math.abs(dx)>Math.abs(dy)?(dx>0?“right”:“left”):(dy>0?“down”:“up”));};
el.addEventListener(“touchstart”,ts,{passive:true}); el.addEventListener(“touchend”,te,{passive:true});
return()=>{el.removeEventListener(“touchstart”,ts);el.removeEventListener(“touchend”,te);};
},[ref,cb,thr]);
}

// ════════════════════════════════════════════════════════
//  🦊 FOX FOREST RUNNER
// ════════════════════════════════════════════════════════
function FoxRunner(){
const W=680,H=280,GR=H-55,GRAV=0.54,JV=-13,PX=85,PS=40;
const cR=useRef(null),gR=useRef(null),rR=useRef(null),mR=useRef(true);
const[sc,setSc]=useState(“menu”);const[score,setScore]=useState(0);const[best,setBest]=useState(0);const[lives,setLives]=useState(3);
useEffect(()=>{mR.current=true;return()=>{mR.current=false;};},[]);
const init=useCallback(()=>{gR.current={sc:“play”,score:0,speed:5,fr:0,lives:3,inv:0,p:{y:GR-PS,vy:0,j:0},obs:[],coins:[],pts:[],trees:Array.from({length:10},(*,i)=>({x:i*85,l:i%2?2:1})),clouds:Array.from({length:4},(*,i)=>({x:i*180,y:18+Math.random()*28,w:55+Math.random()*30})),tuft:Array.from({length:18},(_,i)=>({x:i*42,v:[“🌿”,“🍀”,“🌱”][i%3]})),nO:85,nC:50};},[]);
const jump=useCallback(()=>{const g=gR.current;if(!g||g.sc!==“play”)return;if(g.p.j<2){if(g.p.j===0)S.jump();else S.dbl();g.p.vy=g.p.j===0?JV:JV*.8;g.p.j++;}},[]);
const start=useCallback(()=>{unlock();S.click();init();if(mR.current){setSc(“play”);setScore(0);setLives(3);}},[init]);
useEffect(()=>{const h=e=>{if(e.code===“Space”||e.code===“ArrowUp”){e.preventDefault();if(gR.current?.sc===“play”)jump();else start();}};window.addEventListener(“keydown”,h);return()=>window.removeEventListener(“keydown”,h);},[jump,start]);
useSwipe(cR,useCallback(d=>{if(d===“tap”||d===“up”){if(gR.current?.sc===“play”)jump();else start();}else if(d===“down”&&gR.current?.sc!==“play”)start();},[jump,start]));
useEffect(()=>{
if(sc!==“play”)return; const cv=cR.current;if(!cv)return; const ctx=cv.getContext(“2d”);
const loop=()=>{
const g=gR.current;if(!g||g.sc!==“play”)return;
g.fr++;g.score++;if(g.fr%400===0)g.speed=Math.min(g.speed+.4,14);
g.p.vy+=GRAV;g.p.y+=g.p.vy;if(g.p.y>=GR-PS){g.p.y=GR-PS;g.p.vy=0;g.p.j=0;}
if(g.inv>0)g.inv–;
g.trees.forEach(t=>{t.x-=t.l===1?g.speed*.28:g.speed*.55;if(t.x<-70)t.x=W+70;});
g.clouds.forEach(c=>{c.x-=g.speed*.12;if(c.x<-120)c.x=W+120;});
g.tuft.forEach(t=>{t.x-=g.speed;if(t.x<-40)t.x=W+40;});
g.nO–;if(g.nO<=0){const tall=Math.random()>.5;g.obs.push({x:W+20,y:GR-(tall?44:30),w:tall?36:28,h:tall?44:30,e:[“🪵”,“🪨”,“🌵”,“🍄”][Math.floor(Math.random()*4)]});g.nO=52+Math.random()*72-g.speed*1.4;}
g.obs=g.obs.filter(o=>{o.x-=g.speed;return o.x>-60;});
g.nC–;if(g.nC<=0){g.coins.push({x:W+20,y:GR-68-Math.random()*50,done:false});g.nC=36+Math.random()*52;}
g.coins=g.coins.filter(c=>{c.x-=g.speed;return c.x>-40&&!c.done;});
g.pts=g.pts.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.18;p.life–;return p.life>0;});
const px=PX+10,py=g.p.y+10,pw=PS-20,ph=PS-12;
if(g.inv===0){for(const o of g.obs){if(px<o.x+o.w-6&&px+pw>o.x+6&&py<o.y+o.h-4&&py+ph>o.y+4){g.lives–;g.inv=90;S.hit();for(let i=0;i<8;i++)g.pts.push({x:PX+20,y:g.p.y+20,vx:(Math.random()-.5)*5,vy:-Math.random()*5,life:30,col:”#ff6b6b”,sz:7});if(mR.current)setLives(g.lives);if(g.lives<=0){g.sc=“dead”;S.die();const fs=Math.floor(g.score/10);if(mR.current){setSc(“dead”);setBest(b=>Math.max(b,fs));}return;}break;}}}
for(const c of g.coins){if(!c.done&&Math.hypot(PX+20-c.x,g.p.y+20-c.y)<26){c.done=true;g.score+=120;S.coin();for(let i=0;i<6;i++)g.pts.push({x:c.x,y:c.y,vx:(Math.random()-.5)*3,vy:-Math.random()*3,life:25,col:”#ffd700”,sz:5});}}
if(g.fr%8===0&&mR.current)setScore(Math.floor(g.score/10));
ctx.clearRect(0,0,W,H);const isN=g.score>5500,isE=g.score>2500;
const sk=ctx.createLinearGradient(0,0,0,H);if(isN){sk.addColorStop(0,”#06062a”);sk.addColorStop(1,”#12124a”);}else if(isE){sk.addColorStop(0,”#c94b0f”);sk.addColorStop(.5,”#f9a825”);sk.addColorStop(1,”#2d6a4f”);}else{sk.addColorStop(0,”#52b788”);sk.addColorStop(1,”#d8f3dc”);}
ctx.fillStyle=sk;ctx.fillRect(0,0,W,H);
if(isN){ctx.fillStyle=”#fff”;for(let i=0;i<30;i++){ctx.globalAlpha=.4+.5*Math.abs(Math.sin(g.fr*.05+i));ctx.beginPath();ctx.arc((i*173+40)%W,(i*97+10)%(H*.5),1.5,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
ctx.fillStyle=“rgba(255,255,255,0.5)”;g.clouds.forEach(c=>{ctx.beginPath();ctx.ellipse(c.x,c.y,c.w/2,14,0,0,Math.PI*2);ctx.ellipse(c.x+c.w*.2,c.y-8,c.w/3,11,0,0,Math.PI*2);ctx.fill();});
ctx.font=“26px serif”;g.trees.filter(t=>t.l===1).forEach(t=>{ctx.globalAlpha=.35;ctx.fillText(“🌲”,t.x,GR-6);});ctx.globalAlpha=.7;g.trees.filter(t=>t.l===2).forEach(t=>ctx.fillText(“🌳”,t.x,GR-2));ctx.globalAlpha=1;
const gg=ctx.createLinearGradient(0,GR,0,H);gg.addColorStop(0,”#2d6a4f”);gg.addColorStop(.3,”#40916c”);gg.addColorStop(1,”#1b4332”);ctx.fillStyle=gg;ctx.beginPath();ctx.roundRect(0,GR,W,H-GR,[6,6,0,0]);ctx.fill();
ctx.font=“12px serif”;g.tuft.forEach(t=>ctx.fillText(t.v,t.x,GR+16));
ctx.font=“20px serif”;g.coins.forEach(c=>{if(!c.done){ctx.save();ctx.translate(c.x,c.y+Math.sin(g.fr*.09)*4);ctx.fillText(“🫐”,-10,10);ctx.restore();}});
ctx.font=“32px serif”;g.obs.forEach(o=>ctx.fillText(o.e,o.x-4,o.y+o.h));
const bob=g.p.j===0?Math.sin(g.fr*.22)*1.8:0;ctx.save();ctx.translate(PX,g.p.y+bob);if(g.inv>0&&Math.floor(g.inv/7)%2===0)ctx.globalAlpha=.25;const sy=g.p.vy<-2?1.2:g.p.vy>3?.85:1,sx2=g.p.vy<-2?.85:g.p.vy>3?1.15:1;ctx.scale(sx2,sy);ctx.font=`${PS}px serif`;ctx.fillText(“🦊”,0,PS);if(g.p.j===2){ctx.font=“14px serif”;ctx.fillText(“✨”,-5,PS+9);ctx.fillText(“✨”,PS-6,PS+9);}ctx.restore();
g.pts.forEach(p=>{ctx.save();ctx.globalAlpha=p.life/30;ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.sz/2,0,Math.PI*2);ctx.fill();ctx.restore();});
ctx.fillStyle=“rgba(0,0,0,.28)”;ctx.beginPath();ctx.roundRect(W-122,10,112,32,[9]);ctx.fill();ctx.fillStyle=”#fff”;ctx.font=“bold 16px Georgia”;ctx.textAlign=“right”;ctx.fillText(`⭐ ${Math.floor(g.score/10)}`,W-14,29);ctx.textAlign=“left”;
ctx.font=“20px serif”;for(let i=0;i<3;i++){ctx.globalAlpha=i<g.lives?1:.18;ctx.fillText(“💚”,12+i*28,30);}ctx.globalAlpha=1;
rR.current=requestAnimationFrame(loop);
};
rR.current=requestAnimationFrame(loop);return()=>cancelAnimationFrame(rR.current);
},[sc]);
const OL=({children})=>(<div onClick={()=>{unlock();if(gR.current?.sc===“play”)jump();else start();}} style={{position:“absolute”,inset:0,borderRadius:16,background:“rgba(0,0,0,.65)”,backdropFilter:“blur(5px)”,display:“flex”,flexDirection:“column”,alignItems:“center”,justifyContent:“center”,cursor:“pointer”}}>{children}</div>);
return(<div style={{display:“flex”,flexDirection:“column”,alignItems:“center”,gap:10,padding:20}}><div style={{position:“relative”}}><canvas ref={cR} width={W} height={H} onClick={()=>{unlock();if(gR.current?.sc===“play”)jump();else start();}} style={{borderRadius:16,boxShadow:“0 12px 40px rgba(0,0,0,.6)”,cursor:“pointer”,display:“block”,maxWidth:“100%”}}/>{sc===“menu”&&<OL><div style={{fontSize:50,marginBottom:4}}>🦊</div><div style={{color:”#d8f3dc”,fontSize:26,fontWeight:900}}>Fox Forest Runner</div><div style={{color:“rgba(255,255,255,.4)”,fontSize:12,margin:“8px 0 16px”}}>⌨️ Space/↑  |  📱 Tap / Swipe Up</div><div style={{background:”#40916c”,color:”#fff”,borderRadius:12,padding:“12px 36px”,fontSize:16,fontWeight:700}}>▶ Play</div></OL>}{sc===“dead”&&<OL><div style={{fontSize:48}}>😵</div><div style={{color:”#d8f3dc”,fontSize:26,fontWeight:900}}>Game Over!</div><div style={{display:“flex”,gap:18,margin:“14px 0 18px”}}>{[{i:“⭐”,l:“Score”,v:score},{i:“🏆”,l:“Best”,v:best}].map(s=><div key={s.l} style={{background:“rgba(255,255,255,.12)”,borderRadius:12,padding:“10px 22px”,textAlign:“center”}}><div style={{fontSize:22}}>{s.i}</div><div style={{color:”#d8f3dc”,fontSize:22,fontWeight:800}}>{s.v}</div><div style={{color:”#95d5b2”,fontSize:11}}>{s.l}</div></div>)}</div><div style={{background:”#40916c”,color:”#fff”,borderRadius:12,padding:“11px 32px”,fontSize:15,fontWeight:700}}>🔄 Try Again</div></OL>}</div></div>);
}

// ════════════════════════════════════════════════════════
//  🐍 SNAKE
// ════════════════════════════════════════════════════════
const SNC=20,SCOLS=24,SROWS=18;
function SnakeGame(){
const cR=useRef(null),gR=useRef(null),rR=useRef(null),lR=useRef(0);
const[sc,setSc]=useState(“menu”);const[score,setScore]=useState(0);const[best,setBest]=useState(0);
const rF=()=>({x:Math.floor(Math.random()*SCOLS),y:Math.floor(Math.random()*SROWS)});
const init=useCallback(()=>{gR.current={sc:“play”,snake:[{x:12,y:9},{x:11,y:9},{x:10,y:9}],dir:{x:1,y:0},next:{x:1,y:0},food:rF(),score:0,speed:150};},[]);
const start=useCallback(()=>{unlock();S.click();init();setSc(“play”);setScore(0);},[init]);
const steer=useCallback((d)=>{const g=gR.current;if(!g||g.sc!==“play”)return;if(!(d.x===-g.dir.x&&d.y===-g.dir.y)){g.next=d;S.swipe();}},[]);
useEffect(()=>{const h=e=>{const d={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},KeyW:{x:0,y:-1},KeyS:{x:0,y:1},KeyA:{x:-1,y:0},KeyD:{x:1,y:0}}[e.code];if(d){e.preventDefault();steer(d);}};window.addEventListener(“keydown”,h);return()=>window.removeEventListener(“keydown”,h);},[steer]);
useSwipe(cR,useCallback(d=>{if(!gR.current||gR.current.sc!==“play”){start();return;}const m={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};if(m[d])steer(m[d]);},[start,steer]));
useEffect(()=>{
if(sc!==“play”)return; const cv=cR.current;if(!cv)return; const ctx=cv.getContext(“2d”);
const loop=(ts)=>{const g=gR.current;if(!g||g.sc!==“play”)return;rR.current=requestAnimationFrame(loop);if(ts-lR.current<g.speed)return;lR.current=ts;g.dir=g.next;const h={x:g.snake[0].x+g.dir.x,y:g.snake[0].y+g.dir.y};if(h.x<0||h.x>=SCOLS||h.y<0||h.y>=SROWS||g.snake.some(s=>s.x===h.x&&s.y===h.y)){g.sc=“dead”;S.die();setSc(“dead”);setBest(b=>Math.max(b,g.score));return;}g.snake.unshift(h);if(h.x===g.food.x&&h.y===g.food.y){g.food=rF();g.score+=10;g.speed=Math.max(80,g.speed-1.5);S.eat();setScore(g.score);}else g.snake.pop();ctx.fillStyle=”#0a1628”;ctx.fillRect(0,0,SCOLS*SNC,SROWS*SNC);ctx.strokeStyle=“rgba(0,212,170,0.05)”;ctx.lineWidth=1;for(let x=0;x<=SCOLS;x++){ctx.beginPath();ctx.moveTo(x*SNC,0);ctx.lineTo(x*SNC,SROWS*SNC);ctx.stroke();}for(let y=0;y<=SROWS;y++){ctx.beginPath();ctx.moveTo(0,y*SNC);ctx.lineTo(SCOLS*SNC,y*SNC);ctx.stroke();}g.snake.forEach((s,i)=>{const t=1-i/g.snake.length;ctx.fillStyle=`rgba(0,${Math.floor(180+t*75)},${Math.floor(100+t*70)},${.7+t*.3})`;ctx.beginPath();ctx.roundRect(s.x*SNC+2,s.y*SNC+2,SNC-4,SNC-4,[i===0?6:3]);ctx.fill();if(i===0){ctx.fillStyle=”#fff”;ctx.beginPath();ctx.arc(s.x*SNC+6,s.y*SNC+6,2.5,0,Math.PI*2);ctx.arc(s.x*SNC+SNC-6,s.y*SNC+6,2.5,0,Math.PI*2);ctx.fill();}});ctx.font=`${SNC}px serif`;ctx.fillText(“🍎”,g.food.x*SNC+2,g.food.y*SNC+SNC-2);ctx.fillStyle=“rgba(0,0,0,.4)”;ctx.beginPath();ctx.roundRect(8,8,110,30,[8]);ctx.fill();ctx.fillStyle=”#00d4aa”;ctx.font=“bold 15px Georgia”;ctx.fillText(`⭐ ${g.score}`,18,27);};
rR.current=requestAnimationFrame(loop);return()=>cancelAnimationFrame(rR.current);
},[sc]);
const DBtn=({d,l})=>(<button onClick={()=>{unlock();steer(d);}} style={{width:50,height:50,borderRadius:12,background:“rgba(0,212,170,.14)”,border:“1px solid rgba(0,212,170,.28)”,fontSize:20,cursor:“pointer”,display:“flex”,alignItems:“center”,justifyContent:“center”,color:”#00d4aa”}}>{l}</button>);
return(<div style={{display:“flex”,flexDirection:“column”,alignItems:“center”,gap:8,padding:20}}><div style={{position:“relative”}}><canvas ref={cR} width={SCOLS*SNC} height={SROWS*SNC} style={{borderRadius:14,boxShadow:“0 10px 40px rgba(0,212,170,.2)”,display:“block”,maxWidth:“100%”}}/>{sc===“menu”&&<div onClick={start} style={{position:“absolute”,inset:0,borderRadius:14,background:“rgba(10,22,40,.8)”,backdropFilter:“blur(4px)”,display:“flex”,flexDirection:“column”,alignItems:“center”,justifyContent:“center”,cursor:“pointer”}}><div style={{fontSize:48}}>🐍</div><div style={{color:”#00d4aa”,fontSize:26,fontWeight:900}}>Snake</div><div style={{color:“rgba(255,255,255,.3)”,fontSize:12,margin:“6px 0 20px”}}>⌨️ Arrows/WASD  |  📱 Swipe or D-pad</div><div style={{background:”#00d4aa”,color:”#0a1628”,borderRadius:12,padding:“12px 34px”,fontSize:15,fontWeight:800}}>▶ Play</div></div>}{sc===“dead”&&<div onClick={start} style={{position:“absolute”,inset:0,borderRadius:14,background:“rgba(10,22,40,.85)”,backdropFilter:“blur(4px)”,display:“flex”,flexDirection:“column”,alignItems:“center”,justifyContent:“center”,cursor:“pointer”}}><div style={{fontSize:46}}>💀</div><div style={{color:”#ff6b6b”,fontSize:24,fontWeight:900,margin:“8px 0 4px”}}>Game Over!</div><div style={{display:“flex”,gap:16,margin:“16px 0 22px”}}>{[{i:“⭐”,l:“Score”,v:score},{i:“🏆”,l:“Best”,v:best}].map(s=><div key={s.l} style={{background:“rgba(255,255,255,.08)”,borderRadius:10,padding:“10px 20px”,textAlign:“center”}}><div style={{fontSize:20}}>{s.i}</div><div style={{color:”#00d4aa”,fontSize:20,fontWeight:800}}>{s.v}</div><div style={{color:“rgba(255,255,255,.5)”,fontSize:11}}>{s.l}</div></div>)}</div><div style={{background:”#00d4aa”,color:”#0a1628”,borderRadius:12,padding:“11px 32px”,fontSize:15,fontWeight:800}}>🔄 Try Again</div></div>}</div>

  <div style={{display:"grid",gridTemplateColumns:"repeat(3,50px)",gridTemplateRows:"repeat(3,50px)",gap:4}}>
    <div/><DBtn d={{x:0,y:-1}} l="⬆️"/><div/>
    <DBtn d={{x:-1,y:0}} l="⬅️"/><DBtn d={{x:0,y:1}} l="⬇️"/><DBtn d={{x:1,y:0}} l="➡️"/>
  </div>
  <div style={{color:"rgba(255,255,255,.35)",fontSize:12}}>⌨️ Arrows/WASD &nbsp;|&nbsp; 📱 Swipe / tap D-pad</div></div>);
}

// ════════════════════════════════════════════════════════
//  🐹 WHACK-A-MOLE
// ════════════════════════════════════════════════════════
function WhackMole(){
const[active,setActive]=useState([]);const[score,setScore]=useState(0);const[time,setTime]=useState(30);const[running,setRunning]=useState(false);const[best,setBest]=useState(0);const[hits,setHits]=useState(Array(9).fill(false));
useEffect(()=>{if(!running)return;const t=setInterval(()=>setTime(t=>{if(t<=1){setRunning(false);setBest(b=>Math.max(b,score));S.timeup();clearInterval(t);return 0;}return t-1;}),1000);return()=>clearInterval(t);},[running,score]);
useEffect(()=>{if(!running)return;const spd=Math.max(400,900-score*8);const t=setInterval(()=>{const h=Math.floor(Math.random()*9);setActive(a=>{if(a.includes(h))return a;return[…a,h].slice(-3);});setTimeout(()=>setActive(a=>a.filter(x=>x!==h)),spd*.9);},spd);return()=>clearInterval(t);},[running,score]);
const whack=(i)=>{if(!running||!active.includes(i))return;unlock();S.whack();setScore(s=>s+1);setActive(a=>a.filter(x=>x!==i));setHits(h=>{const n=[…h];n[i]=true;setTimeout(()=>setHits(p=>{const r=[…p];r[i]=false;return r;}),200);return n;});};
const moles=[“🐹”,“🦔”,“🐭”,“🐱”,“🐶”,“🐰”,“🐸”,“🐼”,“🐻”];
return(<div style={{display:“flex”,flexDirection:“column”,alignItems:“center”,padding:24,gap:18}}><div style={{display:“flex”,gap:20}}>{[{i:“⭐”,v:score,l:“Score”},{i:“⏱️”,v:time+“s”,l:“Time”},{i:“🏆”,v:best,l:“Best”}].map(s=>(<div key={s.l} style={{background:“rgba(255,255,255,.08)”,borderRadius:12,padding:“10px 20px”,textAlign:“center”}}><div style={{fontSize:20}}>{s.i}</div><div style={{color:”#ffd700”,fontSize:20,fontWeight:800}}>{s.v}</div><div style={{color:“rgba(255,255,255,.5)”,fontSize:11}}>{s.l}</div></div>))}</div>{time>0&&<div style={{width:300,height:8,background:“rgba(255,255,255,.1)”,borderRadius:99,overflow:“hidden”}}><div style={{height:“100%”,width:`${(time/30)*100}%`,background:“linear-gradient(90deg,#ff6b35,#ffd700)”,borderRadius:99,transition:“width 1s linear”}}/></div>}<div style={{display:“grid”,gridTemplateColumns:“repeat(3,1fr)”,gap:14,maxWidth:360}}>{Array.from({length:9},(_,i)=>{const isUp=active.includes(i),isHit=hits[i];return(<div key={i} onClick={()=>whack(i)} style={{width:100,height:100,borderRadius:“50%”,background:isHit?“radial-gradient(circle,#ffd700,#ff8c00)”:isUp?“radial-gradient(circle,#8B4513,#5d2e0c)”:“radial-gradient(circle,#3a1f08,#2a1508)”,border:isUp?“3px solid #8B4513”:“3px solid #2a1508”,display:“flex”,alignItems:“center”,justifyContent:“center”,fontSize:isUp?48:0,cursor:isUp?“pointer”:“default”,transform:isUp?“translateY(-8px) scale(1.05)”:“translateY(0)”,transition:“all .12s”}}>{isUp&&(isHit?“💫”:moles[i])}</div>);})}</div>{!running&&<div style={{textAlign:“center”}}>{time===0&&<div style={{color:”#ffd700”,fontSize:22,fontWeight:900,marginBottom:14}}>Time’s Up! Score: {score}</div>}<button onClick={()=>{unlock();setScore(0);setTime(30);setActive([]);setRunning(true);}} style={{background:”#ffd700”,color:”#1a0a00”,border:“none”,borderRadius:14,padding:“14px 44px”,fontSize:18,fontWeight:800,cursor:“pointer”}}>{time===0?“🔄 Play Again”:“🎯 Start”}</button></div>}</div>);
}

// ════════════════════════════════════════════════════════
//  ✂️ ROCK PAPER SCISSORS
// ════════════════════════════════════════════════════════
function RPS(){
const ch=[“🪨”,“📄”,“✂️”],nm=[“Rock”,“Paper”,“Scissors”];
const[pl,setPl]=useState(null);const[cp,setCp]=useState(null);const[res,setRes]=useState(null);const[sc,setSc]=useState({w:0,l:0,d:0});const[an,setAn]=useState(false);
const play=(i)=>{unlock();S.click();setAn(true);setTimeout(()=>{const c=Math.floor(Math.random()*3);setPl(i);setCp(c);const w=(i===0&&c===2)||(i===1&&c===0)||(i===2&&c===1),d=i===c;setRes(d?“draw”:w?“win”:“lose”);setSc(s=>({…s,w:s.w+(w?1:0),l:s.l+(!w&&!d?1:0),d:s.d+(d?1:0)}));if(w)S.win();else if(!d)S.hit();else S.flip();setAn(false);},600);};
const col={“win”:”#00d4aa”,“lose”:”#ff6b6b”,“draw”:”#ffd700”},msg={“win”:“🎉 You Win!”,“lose”:“😢 You Lose!”,“draw”:“🤝 Draw!”};
return(<div style={{display:“flex”,flexDirection:“column”,alignItems:“center”,padding:28,gap:20,minHeight:400,justifyContent:“center”}}><div style={{display:“flex”,gap:20}}>{[{i:“✅”,l:“Wins”,v:sc.w},{i:“❌”,l:“Losses”,v:sc.l},{i:“🤝”,l:“Draws”,v:sc.d}].map(s=>(<div key={s.l} style={{background:“rgba(255,255,255,.08)”,borderRadius:12,padding:“10px 22px”,textAlign:“center”}}><div style={{fontSize:20}}>{s.i}</div><div style={{color:”#fff”,fontSize:22,fontWeight:800}}>{s.v}</div><div style={{color:“rgba(255,255,255,.5)”,fontSize:11}}>{s.l}</div></div>))}</div>{res&&!an&&(<div style={{textAlign:“center”}}><div style={{display:“flex”,gap:36,justifyContent:“center”,marginBottom:16,alignItems:“center”}}><div><div style={{fontSize:64}}>{ch[pl]}</div><div style={{color:“rgba(255,255,255,.6)”,fontSize:13}}>You</div></div><div style={{color:“rgba(255,255,255,.3)”,fontSize:28}}>VS</div><div><div style={{fontSize:64}}>{ch[cp]}</div><div style={{color:“rgba(255,255,255,.6)”,fontSize:13}}>CPU</div></div></div><div style={{fontSize:24,fontWeight:900,color:col[res]}}>{msg[res]}</div></div>)}{an&&<div style={{fontSize:60}}>🎲</div>}<div><div style={{color:“rgba(255,255,255,.5)”,fontSize:13,textAlign:“center”,marginBottom:14}}>Choose your move:</div><div style={{display:“flex”,gap:14}}>{ch.map((c,i)=>(<button key={i} onClick={()=>play(i)} style={{background:“rgba(255,255,255,.08)”,border:“2px solid rgba(255,255,255,.15)”,borderRadius:16,padding:“18px 22px”,fontSize:46,cursor:“pointer”,transition:“transform .15s”}} onMouseEnter={e=>e.currentTarget.style.transform=“scale(1.1)”} onMouseLeave={e=>e.currentTarget.style.transform=“scale(1)”}><div>{c}</div><div style={{color:“rgba(255,255,255,.5)”,fontSize:11,marginTop:4}}>{nm[i]}</div></button>))}</div></div></div>);
}

// ════════════════════════════════════════════════════════
//  🌿 ANIMAL MEMORY
// ════════════════════════════════════════════════════════
const ANIS=[“🦊”,“🐻”,“🦁”,“🐯”,“🐼”,“🦋”,“🦜”,“🦔”,“🐸”,“🦦”,“🦌”,“🐺”,“🦝”,“🦉”,“🐝”,“🦈”];
function shuf(a){return[…a].sort(()=>Math.random()-.5);}
function mkCards(n){const a=ANIS.slice(0,n);return shuf([…a,…a].map((x,i)=>({id:i,a:x,f:false,m:false})));}
function useTmr(on){const[t,setT]=useState(0);useEffect(()=>{if(!on)return;const id=setInterval(()=>setT(s=>s+1),1000);return()=>clearInterval(id);},[on]);return[t,setT];}
const fmtT=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const MLV={easy:{l:“🌱 Easy”,c:3,p:6},med:{l:“🌿 Medium”,c:4,p:8},hard:{l:“🌳 Hard”,c:4,p:16}};
function AnimalMemory(){
const[lvl,setLvl]=useState(null);const[cards,setCards]=useState([]);const[flipped,setFlipped]=useState([]);const[moves,setMoves]=useState(0);const[matched,setMatched]=useState(0);const[locked,setLocked]=useState(false);const[won,setWon]=useState(false);const[best,setBest]=useState({});const[tOn,setTOn]=useState(false);const[time,setTime]=useTmr(tOn);
const total=lvl?MLV[lvl].p:0;
const startLvl=useCallback((l)=>{unlock();S.click();setLvl(l);setCards(mkCards(MLV[l].p));setFlipped([]);setMoves(0);setMatched(0);setLocked(false);setWon(false);setTime(0);setTOn(true);},[setTime]);
const handleCard=useCallback((card)=>{
if(locked||card.f||card.m)return;S.flip();
const next=[…flipped,card];setCards(p=>p.map(c=>c.id===card.id?{…c,f:true}:c));
if(next.length===2){setLocked(true);setMoves(m=>m+1);if(next[0].a===next[1].a){setTimeout(()=>{setCards(p=>p.map(c=>c.a===card.a?{…c,m:true}:c));const nm=matched+1;setMatched(nm);setFlipped([]);setLocked(false);S.match();if(nm+1===total){setTOn(false);setWon(true);S.fanfare();setBest(p=>{const cur=p[lvl];return(!cur||moves+1<cur.moves)?{…p,[lvl]:{moves:moves+1,time}}:p;});}},600);}else{setTimeout(()=>{setCards(p=>p.map(c=>c.id===next[0].id||c.id===next[1].id?{…c,f:false}:c));setFlipped([]);setLocked(false);},900);}}else setFlipped(next);
},[locked,flipped,matched,total,lvl,moves,time]);
const cols=lvl?MLV[lvl].c:4;
if(!lvl)return(<div style={{minHeight:400,display:“flex”,flexDirection:“column”,alignItems:“center”,justifyContent:“center”,padding:24}}><div style={{fontSize:52}}>🌿</div><h2 style={{color:”#d8f3dc”,fontSize:26,fontWeight:900,margin:“8px 0 24px”}}>Animal Memory</h2><div style={{display:“flex”,gap:14,flexWrap:“wrap”,justifyContent:“center”}}>{Object.entries(MLV).map(([k,lv])=>(<button key={k} onClick={()=>startLvl(k)} style={{background:“rgba(255,255,255,.1)”,border:“2px solid rgba(255,255,255,.2)”,color:”#d8f3dc”,borderRadius:14,padding:“16px 28px”,fontSize:15,fontWeight:700,cursor:“pointer”}}><div style={{fontSize:26}}>{lv.l.split(” “)[0]}</div><div>{lv.l.split(” “)[1]}</div><div style={{fontSize:11,opacity:.6,marginTop:4}}>{lv.p} pairs</div>{best[k]&&<div style={{fontSize:10,color:”#b7e4c7”}}>Best: {best[k].moves} moves</div>}</button>))}</div></div>);
if(won)return(<div style={{minHeight:400,display:“flex”,flexDirection:“column”,alignItems:“center”,justifyContent:“center”,padding:24}}><div style={{fontSize:64}}>🏆</div><h2 style={{color:”#d8f3dc”,fontSize:28,fontWeight:900,margin:“10px 0 4px”}}>You Won!</h2><div style={{display:“flex”,gap:18,margin:“16px 0 22px”}}>{[{i:“🎯”,v:moves,l:“Moves”},{i:“⏱️”,v:fmtT(time),l:“Time”}].map(s=><div key={s.l} style={{background:“rgba(255,255,255,.1)”,borderRadius:12,padding:“12px 22px”,textAlign:“center”}}><div style={{fontSize:22}}>{s.i}</div><div style={{color:”#d8f3dc”,fontSize:20,fontWeight:800}}>{s.v}</div><div style={{color:”#95d5b2”,fontSize:11}}>{s.l}</div></div>)}</div><div style={{display:“flex”,gap:10}}><button onClick={()=>startLvl(lvl)} style={{background:”#40916c”,color:”#fff”,border:“none”,borderRadius:10,padding:“10px 24px”,fontSize:14,fontWeight:700,cursor:“pointer”}}>🔄 Again</button><button onClick={()=>setLvl(null)} style={{background:“rgba(255,255,255,.12)”,color:”#d8f3dc”,border:“1px solid rgba(255,255,255,.2)”,borderRadius:10,padding:“10px 24px”,fontSize:14,fontWeight:700,cursor:“pointer”}}>🏠 Menu</button></div></div>);
return(<div style={{display:“flex”,flexDirection:“column”,alignItems:“center”,padding:20,gap:14}}><style>{`@keyframes cFlip{from{transform:rotateY(90deg) scale(.8);opacity:0}to{transform:rotateY(0) scale(1);opacity:1}}@keyframes cPop{0%{transform:scale(1)}40%{transform:scale(1.2)}100%{transform:scale(1)}}`}</style><div style={{display:“flex”,gap:14}}>{[{i:“🎯”,v:moves,l:“Moves”},{i:“⏱️”,v:fmtT(time),l:“Time”},{i:“💚”,v:`${matched}/${total}`,l:“Matched”}].map(s=>(<div key={s.l} style={{background:“rgba(255,255,255,.08)”,borderRadius:10,padding:“8px 16px”,textAlign:“center”}}><div style={{fontSize:16}}>{s.i}</div><div style={{color:”#d8f3dc”,fontWeight:800,fontSize:16}}>{s.v}</div><div style={{color:”#95d5b2”,fontSize:10}}>{s.l}</div></div>))}</div><div style={{width:“100%”,maxWidth:500,height:6,background:“rgba(255,255,255,.1)”,borderRadius:99,overflow:“hidden”}}><div style={{height:“100%”,width:`${(matched/total)*100}%`,background:“linear-gradient(90deg,#74c69d,#d8f3dc)”,borderRadius:99,transition:“width .5s”}}/></div><div style={{display:“grid”,gridTemplateColumns:`repeat(${cols},1fr)`,gap:10,maxWidth:460,width:“100%”}}>{cards.map(card=>{const isF=card.f||card.m;return(<button key={card.id} onClick={()=>handleCard(card)} style={{background:“none”,border:“none”,padding:0,cursor:card.m?“default”:“pointer”,aspectRatio:“1”}}><div style={{width:“100%”,height:“100%”,borderRadius:12,background:card.m?“linear-gradient(135deg,#40916c,#52b788)”:isF?“linear-gradient(135deg,#fff9f0,#fff)”:“linear-gradient(135deg,#1b4332,#2d6a4f)”,display:“flex”,alignItems:“center”,justifyContent:“center”,fontSize:“clamp(20px,4vw,36px)”,border:card.m?“2px solid #74c69d”:isF?“2px solid #d8f3dc”:“2px solid rgba(255,255,255,.1)”,animation:isF&&!card.m?“cFlip .3s ease both”:card.m?“cPop .4s ease”:“none”}}>{isF?card.a:“🌿”}</div></button>);})}</div><button onClick={()=>setLvl(null)} style={{background:“rgba(255,255,255,.08)”,color:”#95d5b2”,border:“1px solid rgba(255,255,255,.15)”,borderRadius:10,padding:“8px 20px”,fontSize:13,cursor:“pointer”}}>← Change Level</button></div>);
}

// ════════════════════════════════════════════════════════
//  🍉 FRUIT NINJA
// ════════════════════════════════════════════════════════
const FRF=[{emoji:“🍉”,color:”#e53935”,juice:”#ef9a9a”,r:30},{emoji:“🍊”,color:”#fb8c00”,juice:”#ffcc80”,r:26},{emoji:“🍋”,color:”#fdd835”,juice:”#fff59d”,r:24},{emoji:“🍇”,color:”#8e24aa”,juice:”#ce93d8”,r:26},{emoji:“🍓”,color:”#e53935”,juice:”#ef9a9a”,r:22},{emoji:“🍑”,color:”#f06292”,juice:”#f48fb1”,r:26},{emoji:“🥭”,color:”#fb8c00”,juice:”#ffcc80”,r:28},{emoji:“🍎”,color:”#e53935”,juice:”#ef9a9a”,r:26}];
let _fid=0;const fid=()=>++_fid;
function fLC(x1,y1,x2,y2,cx,cy,cr){const dx=x2-x1,dy=y2-y1,fx=x1-cx,fy=y1-cy,a=dx*dx+dy*dy;if(!a)return false;const b=2*(fx*dx+fy*dy),c=fx*fx+fy*fy-cr*cr;let d=b*b-4*a*c;if(d<0)return false;d=Math.sqrt(d);const t1=(-b-d)/(2*a),t2=(-b+d)/(2*a);return(t1>=0&&t1<=1)||(t2>=0&&t2<=1);}
function fSpawn(W,H,bomb=false){const fd=FRF[Math.floor(Math.random()*FRF.length)];return{id:fid(),x:80+Math.random()*(W-160),y:H+40,vx:(Math.random()-.5)*4,vy:-(10+Math.random()*7),rot:Math.random()*Math.PI*2,rotV:(Math.random()-.5)*.12,bomb,sliced:false,missed:false,…fd,r:bomb?24:fd.r,emoji:bomb?“💣”:fd.emoji,color:bomb?”#333”:fd.color,juice:bomb?”#ff4444”:fd.juice};}
function FruitNinja(){
const FW=680,FH=460,BL=22,GV=0.28;
const cR=useRef(null),gR=useRef(null),rR=useRef(null),mR=useRef(true);
const[sc,setSc]=useState(“menu”);const[score,setScore]=useState(0);const[best,setBest]=useState(0);const[lives,setLives]=useState(3);const[combo,setCombo]=useState(0);
useEffect(()=>{mR.current=true;return()=>{mR.current=false;cancelAnimationFrame(rR.current);};},[]);
const initG=useCallback(()=>{gR.current={sc:“play”,score:0,lives:3,combo:0,cTimer:0,fruits:[],halves:[],parts:[],pops:[],blade:[],fr:0,nSpawn:60,bCD:0,bHit:0};},[]);
const startG=useCallback(()=>{unlock();S.click();initG();if(mR.current){setSc(“play”);setScore(0);setLives(3);setCombo(0);}},[initG]);
const gPos=(e,cv)=>{const r=cv.getBoundingClientRect(),sx=FW/r.width,sy=FH/r.height;if(e.touches)return{x:(e.touches[0].clientX-r.left)*sx,y:(e.touches[0].clientY-r.top)*sy};return{x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy};};
useEffect(()=>{if(sc!==“play”)return;const cv=cR.current;if(!cv)return;
const onM=e=>{e.preventDefault();const g=gR.current;if(!g||g.sc!==“play”)return;const pos=gPos(e,cv);g.blade.push({…pos,t:g.fr});if(g.blade.length>BL)g.blade.shift();if(g.blade.length>=2){const p1=g.blade[g.blade.length-2],p2=g.blade[g.blade.length-1];for(const f of g.fruits){if(f.sliced||f.missed)continue;if(fLC(p1.x,p1.y,p2.x,p2.y,f.x,f.y,f.r-4)){f.sliced=true;const ang=Math.atan2(p2.y-p1.y,p2.x-p1.x);const h1={id:fid(),x:f.x,y:f.y,vx:f.vx+Math.cos(ang-1.2)*3,vy:f.vy+Math.sin(ang-1.2)*3,rot:f.rot,rotV:(Math.random()-.5)*.18,emoji:f.emoji,r:f.r*.7,alpha:1,side:0},h2={…h1,id:fid(),vx:f.vx+Math.cos(ang+1.2)*3,vy:f.vy+Math.sin(ang+1.2)*3,side:1};g.halves.push(h1,h2);const pp=Array.from({length:16},()=>({id:fid(),x:f.x,y:f.y,vx:(Math.random()-.5)*9,vy:(Math.random()-.5)*9-2,r:2+Math.random()*5,alpha:1,color:f.juice,life:40,mL:40}));g.parts.push(…pp);if(f.bomb){g.lives–;g.bHit=12;S.bomb();g.pops.push({id:fid(),x:f.x,y:f.y,text:“💥 BOMB!”,color:”#ff4444”,life:50});if(mR.current)setLives(g.lives);if(g.lives<=0){g.sc=“dead”;if(mR.current){setSc(“dead”);setBest(b=>Math.max(b,g.score));}}}else{g.cTimer=55;const pts=g.combo>=3?20*(g.combo-1):10;g.score+=pts;g.combo++;S.slice();g.pops.push({id:fid(),x:f.x,y:f.y-20,text:g.combo>=3?`${g.combo}x COMBO! +${pts}`:`+${pts}`,color:g.combo>=3?”#ffd700”:”#fff”,life:50});if(mR.current){setScore(g.score);setCombo(g.combo);}}}}}};
const onU=()=>{const g=gR.current;if(g)g.blade=[];};
cv.addEventListener(“mousemove”,onM);cv.addEventListener(“mouseup”,onU);cv.addEventListener(“touchmove”,onM,{passive:false});cv.addEventListener(“touchend”,onU);
return()=>{cv.removeEventListener(“mousemove”,onM);cv.removeEventListener(“mouseup”,onU);cv.removeEventListener(“touchmove”,onM);cv.removeEventListener(“touchend”,onU);};
},[sc]);
useEffect(()=>{if(sc!==“play”)return;const cv=cR.current;if(!cv)return;const ctx=cv.getContext(“2d”);
const loop=()=>{const g=gR.current;if(!g||g.sc!==“play”)return;g.fr++;g.nSpawn–;if(g.nSpawn<=0){const iB=g.bCD<=0&&Math.random()<.14&&g.score>30;if(iB)g.bCD=120;const cnt=Math.random()<.3?2:1;for(let i=0;i<cnt;i++)setTimeout(()=>{if(gR.current?.sc===“play”)gR.current.fruits.push(fSpawn(FW,FH,iB&&i===0));},i*180);g.nSpawn=Math.max(28,70-Math.floor(g.score/50));}if(g.bCD>0)g.bCD–;if(g.bHit>0)g.bHit–;if(g.cTimer>0)g.cTimer–;else if(g.combo>0){g.combo=0;if(mR.current)setCombo(0);}for(const f of g.fruits){if(f.sliced)continue;f.x+=f.vx;f.y+=f.vy;f.vy+=GV;f.rot+=f.rotV;if(!f.missed&&f.y>FH+60){if(!f.bomb){f.missed=true;g.lives–;S.miss();g.pops.push({id:fid(),x:f.x,y:FH-60,text:“Miss!”,color:”#ff6b6b”,life:50});if(mR.current)setLives(g.lives);if(g.lives<=0){g.sc=“dead”;S.die();if(mR.current){setSc(“dead”);setBest(b=>Math.max(b,g.score));}}}else f.missed=true;}}g.fruits=g.fruits.filter(f=>f.y<FH+120);for(const h of g.halves){h.x+=h.vx;h.y+=h.vy;h.vy+=GV*.9;h.rot+=h.rotV;h.alpha-=.018;}g.halves=g.halves.filter(h=>h.alpha>0&&h.y<FH+80);for(const p of g.parts){p.x+=p.vx;p.y+=p.vy;p.vy+=.2;p.alpha=p.life/p.mL;p.life–;}g.parts=g.parts.filter(p=>p.life>0);for(const s of g.pops){s.y-=1.2;s.life–;}g.pops=g.pops.filter(s=>s.life>0);
if(g.bHit>0){ctx.fillStyle=`rgba(255,50,50,${g.bHit/12*.4})`;ctx.fillRect(0,0,FW,FH);}const bg=ctx.createRadialGradient(FW/2,FH/2,0,FW/2,FH/2,FW*.8);bg.addColorStop(0,”#1a0a2e”);bg.addColorStop(1,”#0a0414”);ctx.fillStyle=bg;ctx.fillRect(0,0,FW,FH);ctx.strokeStyle=“rgba(255,255,255,0.03)”;ctx.lineWidth=1;for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(i*100,0);ctx.lineTo(i*100,FH);ctx.stroke();}for(const h of g.halves){ctx.save();ctx.globalAlpha=h.alpha;ctx.translate(h.x,h.y);ctx.rotate(h.rot);ctx.font=`${h.r*1.5}px serif`;ctx.textAlign=“center”;ctx.textBaseline=“middle”;ctx.scale(h.side===0?1:-1,1);ctx.fillText(h.emoji,0,0);ctx.restore();}for(const p of g.parts){ctx.save();ctx.globalAlpha=p.alpha*.85;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.restore();}for(const f of g.fruits){if(f.sliced||f.missed)continue;ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.rot);ctx.shadowColor=f.bomb?”#ff4444”:f.color;ctx.shadowBlur=16;ctx.font=`${f.r*1.9}px serif`;ctx.textAlign=“center”;ctx.textBaseline=“middle”;ctx.fillText(f.emoji,0,0);ctx.restore();}if(g.blade.length>=2){const now=g.fr;for(let i=1;i<g.blade.length;i++){const t=i/g.blade.length,age=now-g.blade[i].t,alpha=Math.max(0,t-age/BL);ctx.save();ctx.globalAlpha=alpha*.85;ctx.strokeStyle=`hsl(${40+t*60},100%,${70+t*30}%)`;ctx.lineWidth=t*12;ctx.lineCap=“round”;ctx.shadowColor=”#ffffaa”;ctx.shadowBlur=20;ctx.beginPath();ctx.moveTo(g.blade[i-1].x,g.blade[i-1].y);ctx.lineTo(g.blade[i].x,g.blade[i].y);ctx.stroke();ctx.restore();}const tip=g.blade[g.blade.length-1];ctx.save();ctx.globalAlpha=.9;ctx.fillStyle=”#fff”;ctx.shadowColor=”#ffffaa”;ctx.shadowBlur=30;ctx.beginPath();ctx.arc(tip.x,tip.y,4,0,Math.PI*2);ctx.fill();ctx.restore();}for(const s of g.pops){ctx.save();ctx.globalAlpha=Math.min(1,s.life/20);ctx.fillStyle=s.color;ctx.font=`bold ${s.text.includes("COMBO")?20:16}px Georgia`;ctx.textAlign=“center”;ctx.shadowColor=s.color;ctx.shadowBlur=12;ctx.fillText(s.text,s.x,s.y);ctx.restore();}ctx.fillStyle=“rgba(0,0,0,0.3)”;ctx.beginPath();ctx.roundRect(FW/2-65,10,130,38,[11]);ctx.fill();ctx.fillStyle=”#fff”;ctx.font=“bold 22px Georgia”;ctx.textAlign=“center”;ctx.shadowColor=”#ffd700”;ctx.shadowBlur=10;ctx.fillText(`⭐ ${g.score}`,FW/2,34);ctx.shadowBlur=0;ctx.font=“22px serif”;ctx.textAlign=“left”;for(let i=0;i<3;i++){ctx.globalAlpha=i<g.lives?1:.15;ctx.fillText(“🍍”,12+i*30,34);}ctx.globalAlpha=1;if(g.combo>=2){ctx.save();const p2=1+Math.sin(g.fr*.2)*.06;ctx.translate(FW-75,30);ctx.scale(p2,p2);ctx.fillStyle=”#ffd700”;ctx.font=“bold 18px Georgia”;ctx.textAlign=“center”;ctx.shadowColor=”#ffd700”;ctx.shadowBlur=20;ctx.fillText(`🔥 ${g.combo}x`,0,0);ctx.restore();}rR.current=requestAnimationFrame(loop);};
rR.current=requestAnimationFrame(loop);return()=>cancelAnimationFrame(rR.current);
},[sc]);
return(<div style={{display:“flex”,flexDirection:“column”,alignItems:“center”,gap:10,padding:20,userSelect:“none”}}><div style={{position:“relative”}}><canvas ref={cR} width={FW} height={FH} style={{borderRadius:16,boxShadow:“0 0 50px rgba(180,100,255,.25),0 16px 50px rgba(0,0,0,.7)”,display:“block”,maxWidth:“100%”,cursor:“crosshair”}}/>{sc===“menu”&&<div onClick={startG} style={{position:“absolute”,inset:0,borderRadius:16,background:“rgba(10,4,20,.9)”,backdropFilter:“blur(8px)”,display:“flex”,flexDirection:“column”,alignItems:“center”,justifyContent:“center”,cursor:“pointer”}}><div style={{fontSize:70,marginBottom:4}}>🍉</div><div style={{color:”#ff6b6b”,fontSize:36,fontWeight:900}}>Fruit Ninja</div><div style={{color:“rgba(255,255,255,.5)”,fontSize:14,margin:“6px 0 24px”}}>Slice fruits • Dodge bombs • Build combos!</div><div style={{background:“linear-gradient(135deg,#e53935,#ff8a65)”,color:”#fff”,borderRadius:14,padding:“14px 44px”,fontSize:18,fontWeight:900}}>▶ PLAY</div><div style={{color:“rgba(255,255,255,.3)”,fontSize:12,marginTop:16}}>🖱️ Drag to slice  |  📱 Touch-drag</div></div>}{sc===“dead”&&<div onClick={startG} style={{position:“absolute”,inset:0,borderRadius:16,background:“rgba(10,4,20,.92)”,backdropFilter:“blur(10px)”,display:“flex”,flexDirection:“column”,alignItems:“center”,justifyContent:“center”,cursor:“pointer”}}><div style={{fontSize:56}}>💀</div><div style={{color:”#ff6b6b”,fontSize:30,fontWeight:900,margin:“8px 0 4px”}}>Game Over!</div><div style={{display:“flex”,gap:18,margin:“18px 0 24px”}}>{[{i:“⭐”,l:“Score”,v:score},{i:“🏆”,l:“Best”,v:best},{i:“🔥”,l:“Combo”,v:combo>0?`${combo}x`:”—”}].map(s=><div key={s.l} style={{background:“rgba(255,255,255,.08)”,borderRadius:12,padding:“12px 20px”,textAlign:“center”}}><div style={{fontSize:24}}>{s.i}</div><div style={{color:”#fff”,fontSize:22,fontWeight:900}}>{s.v}</div><div style={{color:“rgba(255,255,255,.4)”,fontSize:11}}>{s.l}</div></div>)}</div><div style={{background:“linear-gradient(135deg,#e53935,#ff8a65)”,color:”#fff”,borderRadius:12,padding:“12px 38px”,fontSize:16,fontWeight:900}}>🔄 Play Again</div></div>}</div></div>);
}

// ════════════════════════════════════════════════════════
//  🔢  SUDOKU
// ════════════════════════════════════════════════════════
const SUDOKUS = [
{level:“Easy”,given:[[5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],[8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],[0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]],solution:[[5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],[8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],[9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9]]},
{level:“Medium”,given:[[0,0,0,2,6,0,7,0,1],[6,8,0,0,7,0,0,9,0],[1,9,0,0,0,4,5,0,0],[8,2,0,1,0,0,0,4,0],[0,0,4,6,0,2,9,0,0],[0,5,0,0,0,3,0,2,8],[0,0,9,3,0,0,0,7,4],[0,4,0,0,5,0,0,3,6],[7,0,3,0,1,8,0,0,0]],solution:[[4,3,5,2,6,9,7,8,1],[6,8,2,5,7,1,4,9,3],[1,9,7,8,3,4,5,6,2],[8,2,6,1,9,5,3,4,7],[3,7,4,6,8,2,9,1,5],[9,5,1,7,4,3,6,2,8],[5,1,9,3,2,6,8,7,4],[2,4,8,9,5,7,1,3,6],[7,6,3,4,1,8,2,5,9]]},
{level:“Hard”,given:[[0,0,0,0,0,0,0,1,2],[0,0,0,0,3,5,0,0,0],[0,0,0,6,0,0,0,7,0],[7,0,0,0,0,0,3,0,0],[0,0,0,4,0,0,8,0,0],[1,0,0,0,0,0,0,0,0],[0,0,0,1,2,0,0,0,0],[0,8,0,0,0,0,0,4,0],[0,5,0,0,0,0,6,0,0]],solution:[[6,7,3,8,9,4,5,1,2],[9,1,2,7,3,5,4,8,6],[8,4,5,6,1,2,9,7,3],[7,9,8,2,6,1,3,5,4],[5,2,6,4,7,3,8,9,1],[1,3,4,5,8,9,2,6,7],[4,6,9,1,2,7,7,3,5],[2,8,7,3,5,6,1,4,9],[3,5,1,9,4,8,6,2,7]]},
];
function Sudoku(){
const[puzzleIdx,setPuzzleIdx]=useState(0);const[grid,setGrid]=useState(null);const[sel,setSel]=useState(null);const[errors,setErrors]=useState(0);const[won,setWon]=useState(false);const[hints,setHints]=useState(3);const[time,setTime]=useTmr(false);const[tOn,setTOn]=useState(false);const[,setTOnt]=useTmr(tOn);
const pz=SUDOKUS[puzzleIdx];
const startPuzzle=useCallback((idx)=>{unlock();S.click();const p=SUDOKUS[idx];setPuzzleIdx(idx);setGrid(p.given.map(r=>[…r]));setSel(null);setErrors(0);setWon(false);setHints(3);setTOn(true);},[]);
const[elapsed,setElapsed]=useState(0);
useEffect(()=>{if(!tOn||won)return;const id=setInterval(()=>setElapsed(e=>e+1),1000);return()=>clearInterval(id);},[tOn,won]);
const enter=(num)=>{if(!sel||!grid||won)return;const[r,c]=sel;if(pz.given[r][c]!==0)return;unlock();S.num();const ng=grid.map(row=>[…row]);ng[r][c]=num;setGrid(ng);if(num!==0&&num!==pz.solution[r][c]){S.wrong();setErrors(e=>e+1);}else if(num===pz.solution[r][c]){S.correct();const complete=ng.every((row,ri)=>row.every((v,ci)=>v===pz.solution[ri][ci]));if(complete){setWon(true);setTOn(false);S.fanfare();}}};
const hint=()=>{if(!sel||!grid||hints<=0||won)return;const[r,c]=sel;if(pz.given[r][c]!==0||grid[r][c]===pz.solution[r][c])return;unlock();S.coin();setHints(h=>h-1);const ng=grid.map(row=>[…row]);ng[r][c]=pz.solution[r][c];setGrid(ng);};
const isGiven=(r,c)=>pz.given[r][c]!==0;
const isError=(r,c)=>grid&&grid[r][c]!==0&&grid[r][c]!==pz.solution[r][c];
const isSel=(r,c)=>sel&&sel[0]===r&&sel[1]===c;
const sameNum=(r,c)=>sel&&grid&&grid[sel[0]][sel[1]]!==0&&grid[r][c]===grid[sel[0]][sel[1]];
const sameBox=(r,c)=>sel&&Math.floor(r/3)===Math.floor(sel[0]/3)&&Math.floor(c/3)===Math.floor(sel[1]/3);
if(!grid)return(<div style={{minHeight:500,display:“flex”,flexDirection:“column”,alignItems:“center”,justifyContent:“center”,padding:24}}><div style={{fontSize:56,marginBottom:12}}>🔢</div><h2 style={{color:”#ffd700”,fontSize:28,fontWeight:900,margin:“0 0 8px”}}>Sudoku</h2><p style={{color:“rgba(255,255,255,.5)”,fontSize:14,margin:“0 0 8px”}}>Fill the grid so every row, column and 3×3 box contains digits 1–9</p><p style={{color:“rgba(255,255,255,.3)”,fontSize:12,margin:“0 0 28px”}}>🧠 Train your logical thinking!</p><div style={{display:“flex”,gap:14,flexWrap:“wrap”,justifyContent:“center”}}>{SUDOKUS.map((p,i)=>(<button key={i} onClick={()=>startPuzzle(i)} style={{background:“rgba(255,255,255,.08)”,border:“2px solid rgba(255,215,0,.3)”,color:”#ffd700”,borderRadius:14,padding:“18px 28px”,fontSize:15,fontWeight:700,cursor:“pointer”}}><div style={{fontSize:32,marginBottom:6}}>{“🟢🟡🔴”[i]}</div><div style={{fontWeight:900,fontSize:18}}>{p.level}</div><div style={{fontSize:12,opacity:.6,marginTop:4}}>{i===0?“Many hints”:“Few hints”}</div></button>))}</div></div>);
return(<div style={{display:“flex”,flexDirection:“column”,alignItems:“center”,padding:20,gap:16}}>
<style>{`@keyframes sdPop{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}`}</style>
<div style={{display:“flex”,gap:20,alignItems:“center”}}>
{[{i:“❌”,l:“Errors”,v:errors},{i:“⏱️”,l:“Time”,v:fmtT(elapsed)},{i:“💡”,l:“Hints”,v:hints}].map(s=>(<div key={s.l} style={{background:“rgba(255,255,255,.08)”,borderRadius:10,padding:“8px 18px”,textAlign:“center”}}><div style={{fontSize:18}}>{s.i}</div><div style={{color:”#ffd700”,fontWeight:800,fontSize:17}}>{s.v}</div><div style={{color:“rgba(255,255,255,.4)”,fontSize:10}}>{s.l}</div></div>))}
<button onClick={hint} style={{background:hints>0?“rgba(255,215,0,.15)”:“rgba(255,255,255,.05)”,border:`1px solid ${hints>0?"rgba(255,215,0,.3)":"rgba(255,255,255,.1)"}`,color:hints>0?”#ffd700”:“rgba(255,255,255,.3)”,borderRadius:10,padding:“8px 14px”,cursor:hints>0?“pointer”:“default”,fontSize:13,fontWeight:700}}>💡 Hint</button>
</div>
{won&&<div style={{background:“linear-gradient(135deg,rgba(255,215,0,.2),rgba(0,212,170,.2))”,border:“1px solid rgba(255,215,0,.4)”,borderRadius:14,padding:“14px 28px”,textAlign:“center”}}><div style={{fontSize:32}}>🏆</div><div style={{color:”#ffd700”,fontSize:20,fontWeight:900}}>Puzzle Solved!</div><div style={{color:“rgba(255,255,255,.6)”,fontSize:13}}>Time: {fmtT(elapsed)} | Errors: {errors}</div></div>}
<div style={{display:“grid”,gridTemplateColumns:“repeat(9,1fr)”,gap:2,background:“rgba(255,255,255,.2)”,padding:3,borderRadius:10,maxWidth:380,width:“100%”}}>
{grid.map((row,r)=>row.map((val,c)=>{const sel2=isSel(r,c),err=isError(r,c),giv=isGiven(r,c),sn=sameNum(r,c),sb=sameBox(r,c)||((sel&&sel[0]===r)||(sel&&sel[1]===c));const borderT=r%3===0&&r>0?“2px solid rgba(255,255,255,.4)”:“none”;const borderL=c%3===0&&c>0?“2px solid rgba(255,255,255,.4)”:“none”;return(<div key={`${r}-${c}`} onClick={()=>{unlock();S.click();setSel(giv?null:[r,c]);}} style={{aspectRatio:“1”,display:“flex”,alignItems:“center”,justifyContent:“center”,fontSize:“clamp(11px,2.5vw,20px)”,fontWeight:giv?700:500,background:sel2?“rgba(100,180,255,.35)”:err?“rgba(255,80,80,.25)”:sn&&val>0?“rgba(255,215,0,.2)”:sb?“rgba(255,255,255,.06)”:“transparent”,color:err?”#ff8080”:giv?”#fff”:val>0?”#7dd3fc”:“rgba(255,255,255,.3)”,borderRadius:3,cursor:giv?“default”:“pointer”,borderTop:borderT,borderLeft:borderL,animation:val>0&&!giv?“sdPop .2s ease”:“none”}}>{val||””}</div>);}))}
</div>
<div style={{display:“grid”,gridTemplateColumns:“repeat(5,48px)”,gap:8}}>
{[1,2,3,4,5,6,7,8,9].map(n=>(<button key={n} onClick={()=>{unlock();enter(n);}} style={{width:48,height:48,borderRadius:10,background:“rgba(255,255,255,.1)”,border:“1px solid rgba(255,255,255,.15)”,color:”#fff”,fontSize:20,fontWeight:700,cursor:“pointer”}}>{n}</button>))}
<button onClick={()=>{unlock();enter(0);}} style={{width:48,height:48,borderRadius:10,background:“rgba(255,80,80,.15)”,border:“1px solid rgba(255,80,80,.3)”,color:”#ff8080”,fontSize:16,fontWeight:700,cursor:“pointer”}}>✕</button>
</div>
<button onClick={()=>setGrid(null)} style={{background:“rgba(255,255,255,.08)”,color:“rgba(255,255,255,.5)”,border:“1px solid rgba(255,255,255,.12)”,borderRadius:10,padding:“8px 20px”,fontSize:13,cursor:“pointer”}}>← Choose Puzzle</button>

  </div>);
}

// ════════════════════════════════════════════════════════
//  🇫🇷  FRENCH QUEST
// ════════════════════════════════════════════════════════
const FR_DATA={
“🐾 Animaux”:[[“le chien”,“dog”],[“le chat”,“cat”],[“l’oiseau”,“bird”],[“le cheval”,“horse”],[“le lapin”,“rabbit”],[“le poisson”,“fish”],[“l’éléphant”,“elephant”],[“le tigre”,“tiger”],[“le loup”,“wolf”],[“l’ours”,“bear”]],
“🎨 Couleurs”:[[“rouge”,“red”],[“bleu”,“blue”],[“vert”,“green”],[“jaune”,“yellow”],[“orange”,“orange”],[“violet”,“purple”],[“noir”,“black”],[“blanc”,“white”],[“rose”,“pink”],[“gris”,“grey”]],
“🔢 Chiffres”:[[“un”,“1”],[“deux”,“2”],[“trois”,“3”],[“quatre”,“4”],[“cinq”,“5”],[“six”,“6”],[“sept”,“7”],[“huit”,“8”],[“neuf”,“9”],[“dix”,“10”],[“vingt”,“20”],[“cent”,“100”]],
“🍕 Nourriture”:[[“le pain”,“bread”],[“le fromage”,“cheese”],[“la pomme”,“apple”],[“le lait”,“milk”],[“l’eau”,“water”],[“le café”,“coffee”],[“la soupe”,“soup”],[“le gâteau”,“cake”],[“le poulet”,“chicken”],[“les frites”,“fries”]],
“👋 Phrases”:[[“Bonjour”,“Hello”],[“Au revoir”,“Goodbye”],[“Merci”,“Thank you”],[“S’il vous plaît”,“Please”],[“Comment t’appelles-tu?”,“What’s your name?”],[“Je m’appelle…”,“My name is…”],[“Où est…?”,“Where is…?”],[“Je ne comprends pas”,“I don’t understand”],[“Parlez-vous anglais?”,“Do you speak English?”],[“Bonne nuit”,“Good night”]],
};
function FrenchQuest(){
const cats=Object.keys(FR_DATA);
const[cat,setCat]=useState(null);const[q,setQ]=useState(null);const[opts,setOpts]=useState([]);const[score,setScore]=useState(0);const[streak,setStreak]=useState(0);const[best,setBest]=useState(0);const[result,setResult]=useState(null);const[total,setTotal]=useState(0);const[mode,setMode]=useState(“fr2en”);// fr2en or en2fr
const next=useCallback((c,m)=>{const pool=FR_DATA[c||cat];const idx=Math.floor(Math.random()*pool.length);const correct=pool[idx];const wrongs=shuf(pool.filter((_,i)=>i!==idx)).slice(0,3);const all=shuf([correct,…wrongs]);setQ(correct);setOpts(all);setResult(null);},[cat]);
const startCat=(c,m)=>{unlock();S.click();setCat(c);setMode(m||“fr2en”);setScore(0);setStreak(0);setTotal(0);setTimeout(()=>next(c,m),50);};
const answer=(opt)=>{if(result)return;unlock();const correct=mode===“fr2en”?q[1]:q[0];const chosen=mode===“fr2en”?opt[1]:opt[0];const ok=chosen===correct;setResult(ok?“correct”:“wrong”);setTotal(t=>t+1);if(ok){S.correct();const ns=streak+1;setStreak(ns);setBest(b=>Math.max(b,ns));setScore(s=>s+10+(ns>=5?5:0));}else{S.wrong();setStreak(0);}setTimeout(()=>next(),1200);};
if(!cat)return(<div style={{minHeight:500,display:“flex”,flexDirection:“column”,alignItems:“center”,justifyContent:“center”,padding:24}}><div style={{fontSize:56,marginBottom:12}}>🇫🇷</div><h2 style={{color:”#4fc3f7”,fontSize:28,fontWeight:900,margin:“0 0 6px”}}>French Quest</h2><p style={{color:“rgba(255,255,255,.5)”,fontSize:14,margin:“0 0 6px”}}>Learn French vocabulary while playing!</p><div style={{display:“flex”,gap:12,margin:“12px 0 20px”,flexWrap:“wrap”,justifyContent:“center”}}><button onClick={()=>setCat(”_mode”)} style={{background:“rgba(79,195,247,.15)”,border:“1px solid rgba(79,195,247,.3)”,color:”#4fc3f7”,borderRadius:10,padding:“6px 14px”,fontSize:13,fontWeight:700,cursor:“pointer”}}>🇫🇷→🇬🇧 FR to EN</button><button onClick={()=>setCat(”_mode2”)} style={{background:“rgba(79,195,247,.15)”,border:“1px solid rgba(79,195,247,.3)”,color:”#4fc3f7”,borderRadius:10,padding:“6px 14px”,fontSize:13,fontWeight:700,cursor:“pointer”}}>🇬🇧→🇫🇷 EN to FR</button></div><p style={{color:“rgba(255,255,255,.35)”,fontSize:13,margin:“0 0 20px”}}>Choose a category:</p><div style={{display:“grid”,gridTemplateColumns:“repeat(2,1fr)”,gap:12,maxWidth:400,width:“100%”}}>{cats.map(c=>(<button key={c} onClick={()=>startCat(c,“fr2en”)} style={{background:“rgba(255,255,255,.08)”,border:“2px solid rgba(79,195,247,.25)”,color:”#4fc3f7”,borderRadius:14,padding:“16px”,fontSize:14,fontWeight:700,cursor:“pointer”,textAlign:“left”}}><div style={{fontSize:26,marginBottom:4}}>{c.split(” “)[0]}</div><div>{c.split(” “).slice(1).join(” “)}</div><div style={{fontSize:11,color:“rgba(255,255,255,.35)”,marginTop:4}}>{FR_DATA[c].length} words</div></button>))}</div></div>);
if(!q)return(<div style={{display:“flex”,alignItems:“center”,justifyContent:“center”,minHeight:400}}><div style={{color:”#4fc3f7”,fontSize:18}}>Loading…</div></div>);
const prompt=mode===“fr2en”?q[0]:q[1];
const hint=mode===“fr2en”?“What does this mean in English?”:“Comment dit-on en français?”;
return(<div style={{display:“flex”,flexDirection:“column”,alignItems:“center”,padding:24,gap:16}}>
<div style={{display:“flex”,gap:16}}>{[{i:“⭐”,v:score,l:“Score”},{i:“🔥”,v:streak,l:“Streak”},{i:“🏆”,v:best,l:“Best”},{i:“📝”,v:total,l:“Total”}].map(s=>(<div key={s.l} style={{background:“rgba(255,255,255,.08)”,borderRadius:10,padding:“8px 16px”,textAlign:“center”}}><div style={{fontSize:18}}>{s.i}</div><div style={{color:”#4fc3f7”,fontWeight:800,fontSize:16}}>{s.v}</div><div style={{color:“rgba(255,255,255,.4)”,fontSize:10}}>{s.l}</div></div>))}</div>
<div style={{background:“rgba(79,195,247,.08)”,border:“1px solid rgba(79,195,247,.2)”,borderRadius:20,padding:“28px 36px”,textAlign:“center”,maxWidth:400,width:“100%”}}>
<div style={{fontSize:12,color:“rgba(255,255,255,.4)”,marginBottom:8,letterSpacing:1}}>{mode===“fr2en”?“🇫🇷 FRANÇAIS”:“🇬🇧 ENGLISH”}</div>
<div style={{fontSize:32,fontWeight:900,color:”#fff”,marginBottom:8}}>{prompt}</div>
<div style={{fontSize:13,color:“rgba(255,255,255,.4)”}}>{hint}</div>
{streak>=5&&<div style={{marginTop:8,fontSize:13,color:”#ffd700”}}>🔥 {streak} streak! +5 bonus!</div>}
</div>
<div style={{display:“grid”,gridTemplateColumns:“1fr 1fr”,gap:12,maxWidth:400,width:“100%”}}>
{opts.map((opt,i)=>{const ans=mode===“fr2en”?opt[1]:opt[0];const isCorr=result&&(mode===“fr2en”?opt[1]===q[1]:opt[0]===q[0]);const isWrong=result===“wrong”&&(mode===“fr2en”?opt[1]===opts.find(o=>o===opt)?opt[1]:null:null);return(<button key={i} onClick={()=>answer(opt)} style={{padding:“14px”,borderRadius:14,background:result?(isCorr?“rgba(0,212,170,.25)”:“rgba(255,255,255,.06)”):“rgba(255,255,255,.08)”,border:result?(isCorr?“2px solid #00d4aa”:“1px solid rgba(255,255,255,.1)”):“1px solid rgba(255,255,255,.15)”,color:result?(isCorr?”#00d4aa”:“rgba(255,255,255,.5)”):”#fff”,fontSize:15,fontWeight:600,cursor:result?“default”:“pointer”,transition:“all .2s”}}>{ans}</button>);})}
</div>
<button onClick={()=>setCat(null)} style={{background:“rgba(255,255,255,.06)”,color:“rgba(255,255,255,.4)”,border:“none”,borderRadius:10,padding:“8px 18px”,fontSize:12,cursor:“pointer”}}>← Categories</button>

  </div>);
}

// ════════════════════════════════════════════════════════
//  🇩🇪  GERMAN GRAMMAR QUEST
// ════════════════════════════════════════════════════════
const DE_NOUNS=[[“der”,“Hund”,“dog”,“masculine”],[“die”,“Katze”,“cat”,“feminine”],[“das”,“Haus”,“house”,“neuter”],[“der”,“Mann”,“man”,“masculine”],[“die”,“Frau”,“woman”,“feminine”],[“das”,“Kind”,“child”,“neuter”],[“der”,“Apfel”,“apple”,“masculine”],[“die”,“Schule”,“school”,“feminine”],[“das”,“Buch”,“book”,“neuter”],[“der”,“Baum”,“tree”,“masculine”],[“die”,“Blume”,“flower”,“feminine”],[“das”,“Auto”,“car”,“neuter”],[“der”,“Tisch”,“table”,“masculine”],[“die”,“Musik”,“music”,“feminine”],[“das”,“Wasser”,“water”,“neuter”],[“der”,“Lehrer”,“teacher (m)”,“masculine”],[“die”,“Lehrerin”,“teacher (f)”,“feminine”],[“das”,“Fenster”,“window”,“neuter”],[“der”,“Vogel”,“bird”,“masculine”],[“die”,“Stadt”,“city”,“feminine”],[“das”,“Land”,“country”,“neuter”],[“der”,“Fisch”,“fish”,“masculine”],[“die”,“Milch”,“milk”,“feminine”],[“das”,“Brot”,“bread”,“neuter”],[“der”,“Zug”,“train”,“masculine”],[“die”,“Straße”,“street”,“feminine”],[“das”,“Spiel”,“game”,“neuter”],[“der”,“Himmel”,“sky”,“masculine”],[“die”,“Sonne”,“sun”,“feminine”],[“das”,“Herz”,“heart”,“neuter”]];
const DE_VERBS=[{v:“sein”,en:“to be”,ich:“bin”,du:“bist”,er:“ist”,wir:“sind”,ihr:“seid”,sie:“sind”},{v:“haben”,en:“to have”,ich:“habe”,du:“hast”,er:“hat”,wir:“haben”,ihr:“habt”,sie:“haben”},{v:“gehen”,en:“to go”,ich:“gehe”,du:“gehst”,er:“geht”,wir:“gehen”,ihr:“geht”,sie:“gehen”},{v:“machen”,en:“to do/make”,ich:“mache”,du:“machst”,er:“macht”,wir:“machen”,ihr:“macht”,sie:“machen”},{v:“spielen”,en:“to play”,ich:“spiele”,du:“spielst”,er:“spielt”,wir:“spielen”,ihr:“spielt”,sie:“spielen”},{v:“essen”,en:“to eat”,ich:“esse”,du:“isst”,er:“isst”,wir:“essen”,ihr:“esst”,sie:“essen”},{v:“kommen”,en:“to come”,ich:“komme”,du:“kommst”,er:“kommt”,wir:“kommen”,ihr:“kommt”,sie:“kommen”}];
const DE_PRONS=[“ich”,“du”,“er/sie/es”,“wir”,“ihr”,“sie/Sie”];
const DE_PRON_KEYS=[“ich”,“du”,“er”,“wir”,“ihr”,“sie”];
function GermanGrammar(){
const[mode,setMode]=useState(null);const[q,setQ]=useState(null);const[opts,setOpts]=useState([]);const[score,setScore]=useState(0);const[streak,setStreak]=useState(0);const[best,setBest]=useState(0);const[result,setResult]=useState(null);const[lives,setLives]=useState(3);const[total,setTotal]=useState(0);
const nextQ=useCallback((m)=>{const md=m||mode;if(md===“article”){const idx=Math.floor(Math.random()*DE_NOUNS.length);const [art,noun,en,gen]=DE_NOUNS[idx];const arts=[“der”,“die”,“das”];const wrongs=arts.filter(a=>a!==art);setQ({type:“article”,noun,en,answer:art,gen});setOpts(shuf([art,…wrongs]));setResult(null);}else{const vi=Math.floor(Math.random()*DE_VERBS.length);const vb=DE_VERBS[vi];const pi=Math.floor(Math.random()*6);const pron=DE_PRONS[pi];const pk=DE_PRON_KEYS[pi];const answer=vb[pk];const allForms=[…new Set(DE_VERBS.flatMap(v=>DE_PRON_KEYS.map(k=>v[k])))].filter(f=>f!==answer);const wrongs=shuf(allForms).slice(0,3);setQ({type:“conjugation”,verb:vb.v,en:vb.en,pron,answer});setOpts(shuf([answer,…wrongs]));setResult(null);}},[mode]);
const startMode=(m)=>{unlock();S.click();setMode(m);setScore(0);setStreak(0);setLives(3);setTotal(0);setTimeout(()=>nextQ(m),50);};
const answer=(opt)=>{if(result||!q)return;unlock();const ok=opt===q.answer;setResult(ok?“correct”:“wrong”);setTotal(t=>t+1);if(ok){S.correct();const ns=streak+1;setStreak(ns);setBest(b=>Math.max(b,ns));setScore(s=>s+10);}else{S.wrong();setStreak(0);const nl=lives-1;setLives(nl);if(nl<=0){setTimeout(()=>{setMode(null);},1500);return;}}setTimeout(()=>nextQ(),1100);};
if(!mode)return(<div style={{minHeight:500,display:“flex”,flexDirection:“column”,alignItems:“center”,justifyContent:“center”,padding:24}}><div style={{fontSize:56,marginBottom:12}}>🇩🇪</div><h2 style={{color:”#ffcc02”,fontSize:28,fontWeight:900,margin:“0 0 6px”}}>German Grammar Quest</h2><p style={{color:“rgba(255,255,255,.5)”,fontSize:14,margin:“0 0 28px”}}>Master German grammar through play!</p><div style={{display:“flex”,gap:16,flexWrap:“wrap”,justifyContent:“center”}}><button onClick={()=>startMode(“article”)} style={{background:“rgba(255,204,2,.12)”,border:“2px solid rgba(255,204,2,.35)”,color:”#ffcc02”,borderRadius:16,padding:“24px 28px”,fontSize:15,fontWeight:700,cursor:“pointer”,textAlign:“center”}}><div style={{fontSize:40,marginBottom:8}}>📰</div><div style={{fontSize:18,fontWeight:900}}>Der / Die / Das</div><div style={{fontSize:12,opacity:.6,marginTop:4}}>30 German nouns</div><div style={{fontSize:11,opacity:.5,marginTop:2}}>Learn the articles!</div></button><button onClick={()=>startMode(“verb”)} style={{background:“rgba(255,204,2,.12)”,border:“2px solid rgba(255,204,2,.35)”,color:”#ffcc02”,borderRadius:16,padding:“24px 28px”,fontSize:15,fontWeight:700,cursor:“pointer”,textAlign:“center”}}><div style={{fontSize:40,marginBottom:8}}>🔤</div><div style={{fontSize:18,fontWeight:900}}>Verb Conjugation</div><div style={{fontSize:12,opacity:.6,marginTop:4}}>7 common verbs</div><div style={{fontSize:11,opacity:.5,marginTop:2}}>ich, du, er, wir…</div></button></div></div>);
if(!q)return null;
const genColor={“masculine”:”#4fc3f7”,“feminine”:”#f48fb1”,“neuter”:”#a5d6a7”};
return(<div style={{display:“flex”,flexDirection:“column”,alignItems:“center”,padding:24,gap:16}}>
<div style={{display:“flex”,gap:16}}>{[{i:“⭐”,v:score,l:“Score”},{i:“🔥”,v:streak,l:“Streak”},{i:“💚”,v:“❤️”.repeat(lives),l:“Lives”},{i:“📝”,v:total,l:“Total”}].map(s=>(<div key={s.l} style={{background:“rgba(255,255,255,.08)”,borderRadius:10,padding:“8px 16px”,textAlign:“center”}}><div style={{fontSize:18}}>{s.i}</div><div style={{color:”#ffcc02”,fontWeight:800,fontSize:16}}>{s.v}</div><div style={{color:“rgba(255,255,255,.4)”,fontSize:10}}>{s.l}</div></div>))}</div>
{q.type===“article”?(
<div style={{background:“rgba(255,204,2,.08)”,border:“1px solid rgba(255,204,2,.2)”,borderRadius:20,padding:“28px 36px”,textAlign:“center”,maxWidth:420,width:“100%”}}>
<div style={{fontSize:13,color:“rgba(255,255,255,.4)”,marginBottom:8,letterSpacing:1}}>🇩🇪 WELCHER ARTIKEL? (Which article?)</div>
<div style={{fontSize:38,fontWeight:900,color:”#fff”,marginBottom:6}}>{q.noun}</div>
<div style={{fontSize:16,color:“rgba(255,255,255,.5)”,marginBottom:4}}>= “{q.en}” in English</div>
{result&&<div style={{marginTop:8,fontSize:14,color:genColor[q.gen],fontWeight:700}}>Gender: {q.gen} → <strong>{q.answer} {q.noun}</strong></div>}
</div>
):(
<div style={{background:“rgba(255,204,2,.08)”,border:“1px solid rgba(255,204,2,.2)”,borderRadius:20,padding:“28px 36px”,textAlign:“center”,maxWidth:420,width:“100%”}}>
<div style={{fontSize:13,color:“rgba(255,255,255,.4)”,marginBottom:8,letterSpacing:1}}>🇩🇪 COMPLETE THE SENTENCE</div>
<div style={{fontSize:24,fontWeight:900,color:”#fff”,marginBottom:8}}>{q.pron} ____ ({q.verb})</div>
<div style={{fontSize:14,color:“rgba(255,255,255,.4)}}”}}>”{q.verb}” means “{q.en}”</div>
</div>
)}
<div style={{display:“flex”,gap:12,flexWrap:“wrap”,justifyContent:“center”,maxWidth:420}}>
{opts.map((opt,i)=>{const isCorr=result&&opt===q.answer;return(<button key={i} onClick={()=>answer(opt)} style={{padding:“14px 24px”,borderRadius:14,background:result?(isCorr?“rgba(0,212,170,.25)”:“rgba(255,255,255,.05)”):“rgba(255,255,255,.1)”,border:result?(isCorr?“2px solid #00d4aa”:“1px solid rgba(255,255,255,.1)”):“1px solid rgba(255,204,2,.25)”,color:result?(isCorr?”#00d4aa”:“rgba(255,255,255,.4)”):”#ffcc02”,fontSize:18,fontWeight:700,cursor:result?“default”:“pointer”,minWidth:80,transition:“all .2s”}}>{opt}</button>);})}
</div>
<button onClick={()=>setMode(null)} style={{background:“rgba(255,255,255,.06)”,color:“rgba(255,255,255,.4)”,border:“none”,borderRadius:10,padding:“8px 18px”,fontSize:12,cursor:“pointer”}}>← Choose Mode</button>

  </div>);
}

// ════════════════════════════════════════════════════════
//  ➕  MATH BLAST
// ════════════════════════════════════════════════════════
function MathBlast(){
const[lvl,setLvl]=useState(null);const[q,setQ]=useState(null);const[opts,setOpts]=useState([]);const[score,setScore]=useState(0);const[streak,setStreak]=useState(0);const[best,setBest]=useState(0);const[lives,setLives]=useState(3);const[tLeft,setTLeft]=useState(10);const[result,setResult]=useState(null);const[total,setTotal]=useState(0);
const genQ=useCallback((l)=>{const ml=l||lvl;let a,b,op,ans;const ops=[”+”,”-”,“×”,“÷”];const opList=ml===“easy”?[”+”,”-”]:ml===“medium”?[”+”,”-”,“×”]:[”+”,”-”,“×”,“÷”];op=opList[Math.floor(Math.random()*opList.length)];const max=ml===“easy”?20:ml===“medium”?50:99;if(op===”+”){a=Math.floor(Math.random()*max)+1;b=Math.floor(Math.random()*(max-a))+1;ans=a+b;}else if(op===”-”){a=Math.floor(Math.random()*max)+1;b=Math.floor(Math.random()*a)+1;ans=a-b;}else if(op===“×”){a=Math.floor(Math.random()*12)+2;b=Math.floor(Math.random()*12)+2;ans=a*b;}else{b=Math.floor(Math.random()*11)+2;ans=Math.floor(Math.random()*11)+2;a=ans*b;}const wrongs=new Set();while(wrongs.size<3){const w=ans+(Math.floor(Math.random()*10)-5);if(w!==ans&&w>0)wrongs.add(w);}setQ({a,b,op,ans});setOpts(shuf([ans,…wrongs]));setResult(null);setTLeft(ml===“hard”?8:10);},[lvl]);
const start=(l)=>{unlock();S.click();setLvl(l);setScore(0);setStreak(0);setLives(3);setTotal(0);setTimeout(()=>genQ(l),50);};
useEffect(()=>{if(!q||result||!lvl)return;if(tLeft<=0){S.wrong();setResult(“timeout”);setStreak(0);const nl=lives-1;setLives(nl);if(nl<=0){setTimeout(()=>setLvl(null),1400);}else setTimeout(()=>genQ(),1000);return;}const t=setInterval(()=>{setTLeft(t=>{if(t<=1){S.tick();return 0;}S.tick();return t-1;});},1000);return()=>clearInterval(t);},[q,result,lvl,tLeft,lives]);
const answer=(opt)=>{if(result||!q)return;unlock();const ok=opt===q.ans;setResult(ok?“correct”:“wrong”);setTotal(t=>t+1);if(ok){S.correct();const ns=streak+1;setStreak(ns);setBest(b=>Math.max(b,ns));setScore(s=>s+10+(streak>=4?5:0));}else{S.wrong();setStreak(0);const nl=lives-1;setLives(nl);if(nl<=0){setTimeout(()=>setLvl(null),1400);return;}}setTimeout(()=>genQ(),900);};
if(!lvl)return(<div style={{minHeight:500,display:“flex”,flexDirection:“column”,alignItems:“center”,justifyContent:“center”,padding:24}}><div style={{fontSize:56,marginBottom:12}}>➕</div><h2 style={{color:”#81c784”,fontSize:28,fontWeight:900,margin:“0 0 6px”}}>Math Blast</h2><p style={{color:“rgba(255,255,255,.5)”,fontSize:14,margin:“0 0 28px”}}>Speed arithmetic – answer before time runs out!</p><div style={{display:“flex”,gap:14,flexWrap:“wrap”,justifyContent:“center”}}>{[{k:“easy”,l:“🟢 Easy”,d:”+ and − only\nNumbers 1–20”},{k:“medium”,l:“🟡 Medium”,d:”+ − ×\nNumbers 1–50”},{k:“hard”,l:“🔴 Hard”,d:”+ − × ÷\nNumbers 1–99”}].map(({k,l,d})=>(<button key={k} onClick={()=>start(k)} style={{background:“rgba(129,199,132,.12)”,border:“2px solid rgba(129,199,132,.3)”,color:”#81c784”,borderRadius:16,padding:“20px 24px”,fontSize:15,fontWeight:700,cursor:“pointer”,textAlign:“center”,whiteSpace:“pre-line”}}><div style={{fontSize:28,marginBottom:6}}>{l.split(” “)[0]}</div><div style={{fontWeight:900}}>{l.split(” “)[1]}</div><div style={{fontSize:12,opacity:.6,marginTop:6,whiteSpace:“pre-line”}}>{d}</div></button>))}</div></div>);
if(!q)return null;
const timerPct=(tLeft/(lvl===“hard”?8:10))*100;
return(<div style={{display:“flex”,flexDirection:“column”,alignItems:“center”,padding:24,gap:16}}>
<div style={{display:“flex”,gap:16}}>{[{i:“⭐”,v:score,l:“Score”},{i:“🔥”,v:streak,l:“Streak”},{i:“💚”,v:lives,l:“Lives”},{i:“✅”,v:total,l:“Done”}].map(s=>(<div key={s.l} style={{background:“rgba(255,255,255,.08)”,borderRadius:10,padding:“8px 16px”,textAlign:“center”}}><div style={{fontSize:18}}>{s.i}</div><div style={{color:”#81c784”,fontWeight:800,fontSize:16}}>{s.v}</div><div style={{color:“rgba(255,255,255,.4)”,fontSize:10}}>{s.l}</div></div>))}</div>
<div style={{width:320,height:8,background:“rgba(255,255,255,.1)”,borderRadius:99,overflow:“hidden”}}><div style={{height:“100%”,width:`${timerPct}%`,background:`linear-gradient(90deg,${tLeft<=3?"#ff5252":"#81c784"},${tLeft<=3?"#ff8a80":"#a5d6a7"})`,borderRadius:99,transition:“width 1s linear”}}/></div>
<div style={{background:“rgba(129,199,132,.1)”,border:“1px solid rgba(129,199,132,.25)”,borderRadius:20,padding:“32px 40px”,textAlign:“center”}}>
<div style={{fontSize:13,color:“rgba(255,255,255,.4)”,marginBottom:10,letterSpacing:1}}>⏱️ {tLeft}s remaining</div>
<div style={{fontSize:48,fontWeight:900,color:”#fff”,letterSpacing:4}}>{q.a} {q.op} {q.b} = <span style={{color:“rgba(255,255,255,.3)”}}>?</span></div>
</div>
<div style={{display:“grid”,gridTemplateColumns:“1fr 1fr”,gap:12,maxWidth:360,width:“100%”}}>
{opts.map((opt,i)=>{const isCorr=result&&opt===q.ans;const isWrong=result===“wrong”&&result&&opt!==q.ans;return(<button key={i} onClick={()=>answer(opt)} style={{padding:“18px”,borderRadius:14,background:result?(isCorr?“rgba(0,212,170,.25)”:“rgba(255,255,255,.04)”):“rgba(255,255,255,.1)”,border:result?(isCorr?“2px solid #00d4aa”:“1px solid rgba(255,255,255,.08)”):“1px solid rgba(129,199,132,.25)”,color:result?(isCorr?”#00d4aa”:“rgba(255,255,255,.3)”):”#81c784”,fontSize:24,fontWeight:900,cursor:result?“default”:“pointer”,transition:“all .2s”}}>{opt}</button>);})}
</div>
<button onClick={()=>setLvl(null)} style={{background:“rgba(255,255,255,.06)”,color:“rgba(255,255,255,.4)”,border:“none”,borderRadius:10,padding:“8px 18px”,fontSize:12,cursor:“pointer”}}>← Change Difficulty</button>

  </div>);
}

// ════════════════════════════════════════════════════════
//  🎮  PORTAL
// ════════════════════════════════════════════════════════
const GAMES=[
{id:“fox”,title:“Fox Forest Runner”,emoji:“🦊”,cat:“action”,color:”#40916c”,bg:“linear-gradient(135deg,#1b4332,#40916c)”,desc:“Dodge obstacles & collect berries!”,players:“12.4K”,rating:4.8,tag:“🔥 Hot”,component:FoxRunner},
{id:“fruitninja”,title:“Fruit Ninja”,emoji:“🍉”,cat:“action”,color:”#e53935”,bg:“linear-gradient(135deg,#b71c1c,#e53935bb)”,desc:“Slice fruits, dodge bombs, combos!”,players:“62K”,rating:4.9,tag:“⚔️ Slice”,component:FruitNinja},
{id:“snake”,title:“Snake”,emoji:“🐍”,cat:“action”,color:”#00d4aa”,bg:“linear-gradient(135deg,#0a1628,#00d4aaaa)”,desc:“Classic snake — eat & grow!”,players:“31K”,rating:4.9,tag:“⭐ Classic”,component:SnakeGame},
{id:“whack”,title:“Whack-A-Mole”,emoji:“🐹”,cat:“action”,color:”#f9a825”,bg:“linear-gradient(135deg,#3a1f08,#f9a825aa)”,desc:“Tap moles before they hide!”,players:“19K”,rating:4.7,tag:“🎯 Fun”,component:WhackMole},
{id:“memory”,title:“Animal Memory”,emoji:“🌿”,cat:“puzzle”,color:”#1a4a8a”,bg:“linear-gradient(135deg,#0f2d5e,#1a4a8a)”,desc:“Flip & match all animal pairs!”,players:“8K”,rating:4.6,tag:“🧩 Pairs”,component:AnimalMemory},
{id:“rps”,title:“Rock Paper Scissors”,emoji:“✂️”,cat:“casual”,color:”#ab47bc”,bg:“linear-gradient(135deg,#1a0a2e,#ab47bcaa)”,desc:“Beat the CPU in 3 rounds!”,players:“5K”,rating:4.4,tag:“😄 Easy”,component:RPS},
{id:“sudoku”,title:“Sudoku”,emoji:“🔢”,cat:“edu”,color:”#ffd700”,bg:“linear-gradient(135deg,#1a1400,#ffd700aa)”,desc:“Fill 9×9 grid — train logic!”,players:“22K”,rating:4.8,tag:“🧠 Math”,component:Sudoku},
{id:“french”,title:“French Quest”,emoji:“🇫🇷”,cat:“edu”,color:”#4fc3f7”,bg:“linear-gradient(135deg,#002654,#4fc3f7aa)”,desc:“Learn French vocab & phrases!”,players:“14K”,rating:4.7,tag:“📚 Learn”,component:FrenchQuest},
{id:“german”,title:“German Grammar”,emoji:“🇩🇪”,cat:“edu”,color:”#ffcc02”,bg:“linear-gradient(135deg,#1a1200,#ffcc02aa)”,desc:“Der/Die/Das + verb conjugation”,players:“9K”,rating:4.6,tag:“📚 Learn”,component:GermanGrammar},
{id:“math”,title:“Math Blast”,emoji:“➕”,cat:“edu”,color:”#81c784”,bg:“linear-gradient(135deg,#0a1a0a,#81c784aa)”,desc:“Speed arithmetic — beat the clock!”,players:“17K”,rating:4.8,tag:“🧮 Math”,component:MathBlast},
];
const CATS=[{id:“all”,label:“All Games”,icon:“🎮”},{id:“action”,label:“Action”,icon:“🕹️”},{id:“puzzle”,label:“Puzzle”,icon:“🧩”},{id:“edu”,label:“Education”,icon:“📚”},{id:“casual”,label:“Casual”,icon:“😊”}];

export default function Portal(){
const[cat,setCat]=useState(“all”);const[search,setSearch]=useState(””);const[playing,setPlaying]=useState(null);const[muted,setMuted]=useState(false);const[audioEnabled,setAudioEnabled]=useState(false);
const game=playing?GAMES.find(g=>g.id===playing):null;
const filtered=GAMES.filter(g=>(cat===“all”||g.cat===cat)&&g.title.toLowerCase().includes(search.toLowerCase()));
const toggleMute=()=>{unlock();const n=!muted;MUTED=n;setMuted(n);if(!n)setTimeout(()=>S.click(),20);};
const openGame=(id)=>{unlock();setAudioEnabled(true);setPlaying(id);};
return(<div style={{minHeight:“100vh”,background:”#080c14”,fontFamily:“Georgia,serif”,color:”#fff”}}>
<style>{`@keyframes pglow{0%,100%{box-shadow:0 0 20px rgba(0,212,170,.3)}50%{box-shadow:0 0 40px rgba(0,212,170,.6)}} @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}} .gc{transition:transform .2s,box-shadow .2s!important;} .gc:hover{transform:translateY(-5px)!important;box-shadow:0 20px 48px rgba(0,0,0,.6)!important;} ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#0a0e18}::-webkit-scrollbar-thumb{background:#00d4aa33;border-radius:3px}`}</style>

```
{/* ── Top Banner ── */}
<div style={{background:"linear-gradient(90deg,#0f2d5e,#1a0a2e,#0a1628)",padding:"10px 24px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(0,212,170,.1)"}}>
  <span style={{fontSize:14}}>🏫</span>
  <span style={{fontSize:12,color:"rgba(255,255,255,.5)"}}>Built by <strong style={{color:"#00d4aa"}}>Palaksi</strong> for <strong style={{color:"#00d4aa"}}>Rudolf-Diesel-Gymnasium</strong> · Class 6b</span>
  <span style={{marginLeft:"auto",fontSize:12,color:"rgba(255,255,255,.3)"}}>🎮 10 Games · 📚 4 Educational · 🔊 Sound Effects</span>
</div>

{/* ── Header ── */}
<header style={{position:"sticky",top:0,zIndex:50,background:"rgba(8,12,20,.97)",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(0,212,170,.12)",padding:"0 24px"}}>
  <div style={{maxWidth:1200,margin:"0 auto",height:62,display:"flex",alignItems:"center",gap:16}}>
    <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
      <div style={{width:40,height:40,borderRadius:13,background:"linear-gradient(135deg,#00d4aa,#0088cc)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,animation:"pglow 3s ease infinite"}}>🎮</div>
      <div><div style={{fontWeight:900,fontSize:19,background:"linear-gradient(90deg,#00d4aa,#4fc3f7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1}}>PalaksiGames</div><div style={{fontSize:10,color:"rgba(255,255,255,.35)",letterSpacing:1}}>RDG EDITION</div></div>
    </div>
    <div style={{flex:1,maxWidth:400,position:"relative"}}>
      <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:15,opacity:.4}}>🔍</span>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search games…" style={{width:"100%",padding:"9px 14px 9px 38px",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.09)",borderRadius:11,color:"#fff",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
    </div>
    <button onClick={toggleMute} style={{flexShrink:0,background:muted?"rgba(255,80,80,.12)":"rgba(0,212,170,.1)",border:muted?"1px solid rgba(255,80,80,.28)":"1px solid rgba(0,212,170,.25)",borderRadius:11,padding:"8px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:7,color:muted?"#ff8080":"#00d4aa",fontSize:13,fontWeight:700,transition:"all .2s"}}>
      <span style={{fontSize:16}}>{muted?"🔇":"🔊"}</span>{muted?"Muted":"Sound"}
    </button>
    {!audioEnabled&&<div style={{fontSize:11,color:"rgba(255,165,0,.7)",background:"rgba(255,165,0,.1)",border:"1px solid rgba(255,165,0,.2)",borderRadius:8,padding:"5px 10px",flexShrink:0}}>Click any game to enable 🔊</div>}
  </div>
</header>

<div style={{maxWidth:1200,margin:"0 auto",padding:"20px 24px",display:"grid",gridTemplateColumns:"190px 1fr",gap:22}}>
  {/* ── Sidebar ── */}
  <aside>
    <div style={{background:"rgba(255,255,255,.03)",borderRadius:16,padding:14,border:"1px solid rgba(255,255,255,.06)",position:"sticky",top:78}}>
      <div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,.25)",letterSpacing:2,marginBottom:10,padding:"0 4px"}}>CATEGORIES</div>
      {CATS.map(c=>(<button key={c.id} onClick={()=>{unlock();setCat(c.id);}} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"9px 11px",borderRadius:9,background:cat===c.id?"rgba(0,212,170,.1)":"none",border:cat===c.id?"1px solid rgba(0,212,170,.22)":"1px solid transparent",color:cat===c.id?"#00d4aa":"rgba(255,255,255,.48)",fontSize:13,fontWeight:cat===c.id?700:400,cursor:"pointer",marginBottom:2,transition:"all .14s"}}><span>{c.icon}</span><span>{c.label}</span><span style={{marginLeft:"auto",fontSize:10,opacity:.5}}>{c.id==="all"?GAMES.length:GAMES.filter(g=>g.cat===c.id).length}</span></button>))}
      <div style={{margin:"14px 0",height:1,background:"rgba(255,255,255,.06)"}}/>
      <div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,.25)",letterSpacing:2,marginBottom:8,padding:"0 4px"}}>🏆 LEADERBOARD</div>
      {GAMES.slice(0,6).map((g,i)=>(<button key={g.id} onClick={()=>openGame(g.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"7px 11px",borderRadius:9,background:"none",border:"none",color:"rgba(255,255,255,.48)",fontSize:12,cursor:"pointer",marginBottom:1,transition:"all .14s",textAlign:"left"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.05)";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color="rgba(255,255,255,.48)";}}><span style={{width:16,textAlign:"center",fontSize:10,color:"rgba(255,215,0,.5)"}}>{i+1}</span><span style={{fontSize:15}}>{g.emoji}</span><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.title}</span></button>))}
      <div style={{marginTop:14,padding:"10px 11px",background:muted?"rgba(255,80,80,.07)":"rgba(0,212,170,.06)",borderRadius:10,border:muted?"1px solid rgba(255,80,80,.16)":"1px solid rgba(0,212,170,.16)",textAlign:"center",cursor:"pointer"}} onClick={toggleMute}>
        <div style={{fontSize:22}}>{muted?"🔇":"🔊"}</div>
        <div style={{fontSize:11,color:muted?"#ff8080":"#00d4aa",fontWeight:700,marginTop:2}}>{muted?"Sound Off":"Sound On"}</div>
        <div style={{fontSize:9,color:"rgba(255,255,255,.25)",marginTop:1}}>Click to toggle</div>
      </div>
    </div>
  </aside>

  {/* ── Main ── */}
  <main>
    {/* Hero */}
    {!search&&cat==="all"&&(
      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:14,marginBottom:22}}>
        <div style={{borderRadius:18,background:"linear-gradient(135deg,#1a0a2e,#b71c1c,#e53935)",padding:"30px 32px",position:"relative",overflow:"hidden",cursor:"pointer",border:"1px solid rgba(255,255,255,.09)"}} onClick={()=>openGame("fruitninja")}>
          <div style={{position:"absolute",right:-10,top:-10,fontSize:100,opacity:.15}}>🍉</div>
          <div style={{position:"relative",zIndex:1}}><div style={{display:"inline-block",background:"rgba(255,255,255,.15)",borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700,marginBottom:10,letterSpacing:1}}>🔥 FEATURED</div><div style={{fontSize:26,fontWeight:900,marginBottom:6}}>Fruit Ninja</div><div style={{fontSize:13,opacity:.7,marginBottom:16}}>Slice fruits, dodge 💣 bombs, chain combos!</div><div style={{background:"#fff",color:"#b71c1c",borderRadius:10,padding:"10px 22px",fontSize:13,fontWeight:800,display:"inline-block"}}>▶ Play Now</div></div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {[{id:"french",bg:"linear-gradient(135deg,#002654,#4fc3f7aa)",emoji:"🇫🇷",t:"French Quest",d:"Learn vocabulary!"},{id:"german",bg:"linear-gradient(135deg,#1a1200,#ffcc02aa)",emoji:"🇩🇪",t:"German Grammar",d:"Master articles!"}].map(({id,bg,emoji,t,d})=>(<div key={id} style={{borderRadius:14,background:bg,padding:"18px 20px",cursor:"pointer",border:"1px solid rgba(255,255,255,.08)",flex:1,position:"relative",overflow:"hidden"}} onClick={()=>openGame(id)}><div style={{position:"absolute",right:-5,bottom:-5,fontSize:50,opacity:.15}}>{emoji}</div><div style={{position:"relative",zIndex:1}}><div style={{fontSize:22,marginBottom:4}}>{emoji}</div><div style={{fontSize:15,fontWeight:800}}>{t}</div><div style={{fontSize:11,opacity:.6,marginBottom:10}}>{d}</div><div style={{fontSize:11,fontWeight:700,color:"#00d4aa"}}>▶ Play</div></div></div>))}
        </div>
      </div>
    )}

    {/* Education spotlight */}
    {!search&&(cat==="all"||cat==="edu")&&(
      <div style={{marginBottom:22,background:"linear-gradient(135deg,rgba(255,215,0,.06),rgba(0,212,170,.06))",border:"1px solid rgba(255,215,0,.15)",borderRadius:16,padding:"16px 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <span style={{fontSize:20}}>📚</span><span style={{fontWeight:800,fontSize:16,color:"#ffd700"}}>Education Zone</span><span style={{fontSize:12,color:"rgba(255,255,255,.4)",marginLeft:4}}>— Learn while you play!</span>
        </div>
        <div style={{fontSize:12,color:"rgba(255,255,255,.45)"}}>Sudoku trains logical thinking · French Quest builds vocabulary · German Grammar drills articles & verbs · Math Blast sharpens arithmetic speed</div>
      </div>
    )}

    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <h2 style={{margin:0,fontSize:18,fontWeight:800}}>{search?`Results for "${search}"`:cat==="all"?"All Games":CATS.find(c=>c.id===cat)?.label}</h2>
      <div style={{color:"rgba(255,255,255,.35)",fontSize:12}}>{filtered.length} games</div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:14}}>
      {filtered.map((g,i)=>(<div key={g.id} className="gc" onClick={()=>openGame(g.id)} style={{borderRadius:15,background:g.bg,border:"1px solid rgba(255,255,255,.07)",overflow:"hidden",cursor:"pointer",animation:`fadeIn .4s ease ${i*.04}s both`}}>
        <div style={{height:100,display:"flex",alignItems:"center",justifyContent:"center",fontSize:52,position:"relative"}}>
          {g.emoji}
          <div style={{position:"absolute",top:7,right:7,background:"rgba(0,0,0,.55)",borderRadius:18,padding:"2px 8px",fontSize:9,fontWeight:700,color:g.color}}>{g.tag}</div>
          {g.cat==="edu"&&<div style={{position:"absolute",top:7,left:7,background:"rgba(255,215,0,.2)",borderRadius:18,padding:"2px 7px",fontSize:9,fontWeight:700,color:"#ffd700"}}>📚 EDU</div>}
        </div>
        <div style={{padding:"10px 12px",background:"rgba(0,0,0,.3)"}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.title}</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,.45)",marginBottom:7,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.desc}</div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:10,color:"rgba(255,255,255,.35)"}}>👥 {g.players}</span><span style={{fontSize:10,color:"#ffd700"}}>★ {g.rating}</span></div>
          <div style={{marginTop:8,background:g.color+"22",border:`1px solid ${g.color}33`,borderRadius:7,padding:"5px",textAlign:"center",fontSize:11,fontWeight:700,color:g.color}}>▶ Play</div>
        </div>
      </div>))}
    </div>

    <div style={{marginTop:32,padding:"20px",background:"rgba(255,255,255,.02)",borderRadius:14,border:"1px solid rgba(255,255,255,.05)",textAlign:"center"}}>
      <div style={{fontSize:13,color:"rgba(255,255,255,.3)"}}>🎮 PalaksiGames · Rudolf-Diesel-Gymnasium · Class 6b · Built with ❤️ and Claude AI</div>
    </div>
  </main>
</div>

{/* ── Game Modal ── */}
{playing&&game&&(<div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.94)",backdropFilter:"blur(10px)",display:"flex",flexDirection:"column",alignItems:"center",overflow:"auto"}}>
  <div style={{width:"100%",maxWidth:800,padding:"12px 18px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid rgba(255,255,255,.07)",background:"rgba(8,12,20,.99)",position:"sticky",top:0,zIndex:10,flexWrap:"wrap"}}>
    <button onClick={()=>{unlock();setPlaying(null);}} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",color:"#fff",borderRadius:9,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>← Back</button>
    <span style={{fontSize:24}}>{game.emoji}</span>
    <div><div style={{fontWeight:800,fontSize:16}}>{game.title}</div><div style={{fontSize:11,color:"rgba(255,255,255,.35)"}}>★ {game.rating} · 👥 {game.players}</div></div>
    {game.cat==="edu"&&<div style={{background:"rgba(255,215,0,.15)",border:"1px solid rgba(255,215,0,.3)",borderRadius:8,padding:"4px 10px",fontSize:11,color:"#ffd700",fontWeight:700}}>📚 Educational</div>}
    <button onClick={toggleMute} style={{background:muted?"rgba(255,80,80,.12)":"rgba(0,212,170,.09)",border:muted?"1px solid rgba(255,80,80,.28)":"1px solid rgba(0,212,170,.24)",borderRadius:9,padding:"6px 13px",cursor:"pointer",color:muted?"#ff8080":"#00d4aa",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
      {muted?"🔇 Muted":"🔊 Sound"}
    </button>
    <div style={{marginLeft:"auto",display:"flex",gap:6,flexWrap:"wrap"}}>
      {GAMES.filter(g=>g.id!==playing).slice(0,4).map(g=>(<button key={g.id} onClick={()=>openGame(g.id)} style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",color:"rgba(255,255,255,.5)",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:11}}>{g.emoji} {g.title}</button>))}
    </div>
  </div>
  <div style={{width:"100%",maxWidth:800,flex:1}}>{game.component&&<game.component/>}</div>
</div>)}
```

  </div>);
}

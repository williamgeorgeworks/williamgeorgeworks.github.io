/* Dead Air FM • 600 × 800 pinball simulation. All distances use table units,
   all times use seconds. The renderer reads exactly the collision geometry. */
(function (scope) {
  'use strict';
  const WIDTH=600, HEIGHT=800, MID=285, DT=1/240, BALL_RADIUS=8;
  const clamp=(x,lo,hi)=>Math.min(hi,Math.max(lo,x));
  const hypot=Math.hypot;
  function hash(seed) {
    let n=2166136261;
    for(const ch of String(seed))n=Math.imul(n^ch.charCodeAt(0),16777619);
    return n>>>0 || 7691;
  }
  function random(w) {
    let x=w.randomState; x^=x<<13;x^=x>>>17;x^=x<<5;
    w.randomState=x>>>0;return w.randomState/4294967296;
  }
  function makeLayout(w,stage) {
    const walls=[];
    function rail(kind,points,r=3) {
      for(let i=1;i<points.length;i++){
        const [ax,ay]=points[i-1], [bx,by]=points[i];
        walls.push({kind,ax,ay,bx,by,r});
      }
    }
    // The perimeter is open at the bottom. Two guides feed the bats, with a
    // real outlane outside each guide and a separate, curved shooter runway.
    rail('outer',[[215,813],[130,765],[66,706],[34,665],[19,626],[16,594],
      [16,152],[22,112],[40,77],[71,49],[111,34],[158,26],[411,26],
      [477,32],[524,46],[551,67],[571,94],[582,125],[585,153],[585,751]]);
    rail('outer',[[345,813],[427,761],[490,701],[520,662],[537,616],[538,576]]);
    rail('shooter',[[538,745],[538,197],[536,180],[530,165]],3);
    rail('shooter',[[538,745],[547,756],[571,756],[585,747]],3);
    rail('guide',[[40,588],[48,608],[64,623],[104,644],[178,679]],3.5);
    rail('guide',[[515,588],[509,606],[491,624],[452,644],[393,679]],3.5);
    // The ends of these small guide rails sit next to return lanes, far enough
    // apart to admit the ball, without introducing an invisible one-way wall.
    rail('return',[[47,499],[47,525],[55,552]],3);
    rail('return',[[512,499],[512,525],[505,552]],3);
    const range=(amount)=>Math.round((random(w)*2-1)*amount);
    const act=(stage-1)%3;
    const templates=[
      [[207,183],[374,190],[293,308]],
      [[194,213],[370,167],[351,312]],
      [[218,166],[386,225],[237,310]]
    ];
    const bumpers=templates[act].map(([x,y],i)=>({
      id:i,index:i,x:x+range(10),y:y+range(9),r:i===2?33:32,hitAt:-100
    }));
    const targets=[[104,275],[460,306],[act===0?289:act===1?235:336,404]].map(([x,y],i)=>({
      id:i,index:i,label:['LOW','MID','HIGH'][i],x:x+range(10),y:y+range(10),r:19,hitAt:-100
    }));
    const receiver={id:'tower',x:290+range(18),y:87,r:23,hitAt:-100};
    const slings=[[[71,506],[161,596],[78,553]],[[498,506],[491,553],[409,596]]].map((p,i)=>{
      const points=p.map(([x,y])=>({x,y}));
      return {id:i,points,ax:p[0][0],ay:p[0][1],bx:i?409:161,by:596,hitAt:-100};
    });
    return {width:WIDTH,height:HEIGHT,walls,bumpers,targets,receiver,slings,launch:{x:562,y:705}};
  }
  function flipper(side) {
    const left=side==='left', angle=left?.32:Math.PI-.32;
    const f={side,x:left?180:390,y:684,length:83,r:9,angle,omega:0,pressed:false};
    endPoint(f);return f;
  }
  function endPoint(f) {
    f.tipX=f.x+Math.cos(f.angle)*f.length;
    f.tipY=f.y+Math.sin(f.angle)*f.length;
  }
  function create(seed=1,stage=1) {
    stage=Math.max(1,Math.round(Number(stage)||1));
    const w={version:1,width:WIDTH,height:HEIGHT,seed:String(seed),stage,clock:0,accumulator:0,
      ready:true,balls:[],events:[],randomState:hash(String(seed)+'/'+stage),nextId:1,
      assist:0,flipBoost:0,gravityScale:1,nudgeInterval:2.7,nudgeCooldown:0};
    w.layout=makeLayout(w,stage);
    w.flippers=[flipper('left'),flipper('right')];
    return w;
  }
  function emit(w,type,x,y,details={}) {
    w.events.push({type,x,y,time:w.clock,...details});
  }
  function ball(w,x,y,vx,vy,inShooter) {
    return {id:w.nextId++,x,y,r:BALL_RADIUS,vx,vy,inShooter,age:0,
      sampleX:x,sampleY:y,sampleTime:w.clock,stalled:0,lastHit:{},lastBat:-9};
  }
  function launch(w,power=.8) {
    if(!w.ready||w.balls.length)return false;
    const {x,y}=w.layout.launch;
    const strength=clamp(Number.isFinite(power)?power:.8,0,1);
    w.balls.push(ball(w,x,y,-1-strength*2,-(1120+strength*245),true));
    w.ready=false;emit(w,'launch',x,y,{power:strength});
    return true;
  }
  function multiball(w) {
    if(!w.balls.length||w.balls.length>=4)return false;
    const t=w.layout.receiver,side=random(w)<.5?-1:1;
    const b=ball(w,t.x+side*48,t.y+23,side*(135+70*random(w)),285,false);
    w.balls.push(b);emit(w,'multiball',b.x,b.y,{remaining:w.balls.length,ballId:b.id});return true;
  }
  function nudge(w,direction=0) {
    if(!w.balls.length||w.nudgeCooldown>0)return false;
    const legal=w.balls.filter(b=>!b.inShooter);
    if(!legal.length)return false;
    w.nudgeCooldown=clamp(Number(w.nudgeInterval)||2.7,.3,6);
    for(const b of legal) {
      const toward=direction?Math.sign(direction):Math.sign(MID-b.x)||(random(w)<.5?1:-1);
      b.vx+=toward*145;b.vy-=100;
    }
    emit(w,'nudge',MID,600,{direction});return true;
  }
  function pulse(w,perfect=false) {
    const legal=w.balls.filter(b=>!b.inShooter&&b.y<HEIGHT+BALL_RADIUS);
    for(const b of legal) {
      b.vx=clamp(b.vx*.65+(MID-b.x)*(perfect?1.65:1.1),-440,440);
      b.vy=Math.min(b.vy-(perfect?300:210),perfect?-550:-355);
    }
    if(legal.length)emit(w,'pulse',MID,600,{perfect});
    return !!legal.length;
  }
  function updateBats(w,controls) {
    for(const f of w.flippers) {
      const left=f.side==='left',pressed=!!controls[f.side];
      const angle=pressed?-.72:.32,target=left?angle:Math.PI-angle;
      const turn=clamp(target-f.angle,-DT*(pressed?15:8.5),DT*(pressed?15:8.5));
      f.omega=turn/DT;
      f.angle+=turn;f.length=83+clamp(w.assist||0,0,3)*3.4;
      if(pressed&&!f.pressed)emit(w,'flip',f.x,f.y,{side:f.side});
      f.pressed=pressed;endPoint(f);
    }
  }
  function nearest(b,ax,ay,bx,by) {
    const dx=bx-ax,dy=by-ay;
    const t=clamp(((b.x-ax)*dx+(b.y-ay)*dy)/(dx*dx+dy*dy||1),0,1);
    return {x:ax+t*dx,y:ay+t*dy,t};
  }
  // Resolve the position before reflecting the incoming relative velocity.
  // Keeping tangent and normal components separate makes a trapped ball roll.
  function contact(b,x,y,r,sx=0,sy=0,restitution=.72,friction=.987) {
    const dx=b.x-x,dy=b.y-y,dist=hypot(dx,dy),limit=b.r+r;
    if(dist>=limit)return null;
    const nx=dist>1e-6?dx/dist:0,ny=dist>1e-6?dy/dist:-1;
    b.x=x+nx*(limit+.02);b.y=y+ny*(limit+.02);
    const ux=b.vx-sx,uy=b.vy-sy,approach=ux*nx+uy*ny;
    if(approach>=0)return null;
    const bounce=Math.abs(approach)<35?0:restitution;
    b.vx=sx+(ux-approach*nx)*friction-approach*nx*bounce;
    b.vy=sy+(uy-approach*ny)*friction-approach*ny*bounce;
    return {nx,ny,speed:-approach};
  }
  function railHit(b,wall) {
    const p=nearest(b,wall.ax,wall.ay,wall.bx,wall.by);
    contact(b,p.x,p.y,wall.r||3,0,0,.73,.992);
  }
  function allowed(w,b,key,delay) {
    if(w.clock-(b.lastHit[key]??-10)<delay)return false;
    b.lastHit[key]=w.clock;return true;
  }
  function roundHit(w,b,p,type,kick) {
    const h=contact(b,p.x,p.y,p.r,0,0,.84);
    if(!h||!allowed(w,b,type+p.id,.19))return;
    const radial=b.vx*h.nx+b.vy*h.ny;
    const boost=Math.max(0,kick-radial);
    b.vx+=h.nx*boost;b.vy+=h.ny*boost;
    // Small deterministic coil variation keeps repeat rebounds interesting.
    const variation=(random(w)-.5)*32;
    b.vx+=h.ny*variation;b.vy-=h.nx*variation;
    p.hitAt=w.clock;
    emit(w,type,b.x,b.y,{id:p.id,index:p.index,ballId:b.id,strength:h.speed});
  }
  function slingHit(w,b,s) {
    for(let i=0;i<s.points.length;i++) {
      const a=s.points[i],z=s.points[(i+1)%s.points.length];
      const p=nearest(b,a.x,a.y,z.x,z.y);
      const h=contact(b,p.x,p.y,3,0,0,.8);
      // Only the stretched inside rubber fires. The outside remains a return lane.
      if(!h||h.ny>-.16||h.nx*(s.id?-1:1)<.24||!allowed(w,b,'s'+s.id,.25))continue;
      const speed=460+random(w)*75,cur=b.vx*h.nx+b.vy*h.ny;
      const impulse=Math.max(80,speed-cur);
      b.vx+=h.nx*impulse;b.vy+=h.ny*impulse;s.hitAt=w.clock;
      emit(w,'sling',b.x,b.y,{id:s.id,ballId:b.id});
    }
  }
  function batHit(w,b,f) {
    const p=nearest(b,f.x,f.y,f.tipX,f.tipY);
    const rx=p.x-f.x,ry=p.y-f.y;
    const sx=-f.omega*ry,sy=f.omega*rx;
    const h=contact(b,p.x,p.y,f.r,sx,sy,.48,.965);
    if(!h||!f.pressed||Math.abs(f.omega)<1||h.ny>-.15||w.clock-b.lastBat<.065)return;
    const power=(1+clamp(w.flipBoost||0,0,.55));
    // A live solenoid gives a minimum useful shot near the hinge. Tip shots
    // inherit more angular speed. Both timing and contact point affect aim.
    const inward=f.side==='left'?1:-1;
    const minSpeed=(395+p.t*450)*power;
    b.vy=Math.min(b.vy,-minSpeed);
    b.vx=clamp(b.vx+inward*(.65-p.t)*205,-915,915);
    b.lastBat=w.clock;emit(w,'bat',b.x,b.y,{side:f.side,ballId:b.id});
  }
  function rescueStall(w,b,controls) {
    if(w.clock-b.sampleTime<.9)return;
    const delta=hypot(b.x-b.sampleX,b.y-b.sampleY);
    const trapped=b.y>630&&b.y<720&&(controls.left||controls.right);
    b.stalled=delta<14&&!trapped?b.stalled+1:0;
    b.sampleX=b.x;b.sampleY=b.y;b.sampleTime=w.clock;
    if(b.stalled<2)return;
    b.stalled=0;
    if(b.inShooter){b.x=w.layout.launch.x;b.vx=-2;b.vy=-1280;}
    else {b.vx=(b.x<MID?1:-1)*(145+random(w)*85);b.vy=-345;}
  }
  function advance(w,b,controls) {
    b.age+=DT;
    b.vy+=695*clamp(w.gravityScale||1,.65,1.3)*DT;
    b.vx*=.99984;b.vy*=.99984;
    const speed=hypot(b.vx,b.vy),maxSpeed=1350*(1+clamp(w.flipBoost||0,0,.55)*.14);
    if(speed>maxSpeed){b.vx*=maxSpeed/speed;b.vy*=maxSpeed/speed;}
    b.x+=b.vx*DT;b.y+=b.vy*DT;
    for(const line of w.layout.walls)railHit(b,line);
    if(b.inShooter&&b.x<519)b.inShooter=false;
    // A failed weak plunge is captured at the foot of the runway. A field
    // ball entering down the top of the runway is returned in the same way.
    if(b.x>540&&b.y>685&&b.vy>20){
      b.inShooter=true;b.x=w.layout.launch.x;b.vx=-2;b.vy=-1230;
    }
    for(const p of w.layout.bumpers)roundHit(w,b,p,'bumper',510);
    for(const p of w.layout.targets)roundHit(w,b,p,'target',365);
    roundHit(w,b,w.layout.receiver,'receiver',470);
    for(const sling of w.layout.slings)slingHit(w,b,sling);
    for(const f of w.flippers)batHit(w,b,f);
    rescueStall(w,b,controls);
  }
  function ballPair(a,b) {
    const dx=b.x-a.x,dy=b.y-a.y,d=hypot(dx,dy);
    if(d>=a.r+b.r||d<.001)return;
    const nx=dx/d,ny=dy/d,p=(a.r+b.r-d+.03)*.5;
    a.x-=nx*p;a.y-=ny*p;b.x+=nx*p;b.y+=ny*p;
    const approach=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
    if(approach<=0)return;
    const j=approach*.94;a.vx-=j*nx;a.vy-=j*ny;b.vx+=j*nx;b.vy+=j*ny;
  }
  function tick(w,controls) {
    w.clock+=DT;w.nudgeCooldown=Math.max(0,w.nudgeCooldown-DT);
    updateBats(w,controls);
    for(const b of w.balls)advance(w,b,controls);
    for(let j=1;j<w.balls.length;j++)for(let i=0;i<j;i++)ballPair(w.balls[i],w.balls[j]);
    for(let i=w.balls.length-1;i>=0;i--) {
      const b=w.balls[i];
      if(b.y<HEIGHT+20&&b.x>-40&&b.x<WIDTH+40&&b.y>-80)continue;
      w.balls.splice(i,1);
      emit(w,'drain',clamp(b.x,10,WIDTH-10),HEIGHT-5,{id:b.id,ballId:b.id,remaining:w.balls.length});
    }
    w.ready=w.balls.length===0;
  }
  function step(w,dt,controls={},onEvent) {
    if(!Number.isFinite(dt)||dt<0)return [];
    w.accumulator+=Math.min(dt,.1);
    while(w.accumulator>=DT-1e-10){
      tick(w,controls);w.accumulator=Math.max(0,w.accumulator-DT);
    }
    const events=w.events.splice(0);
    if(onEvent)for(const e of events)onEvent(e);
    return events;
  }
  const api={WIDTH,HEIGHT,create,launch,step,nudge,multiball,pulse};
  scope.FMPhysics=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);

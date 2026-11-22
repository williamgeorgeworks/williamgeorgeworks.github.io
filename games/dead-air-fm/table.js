/* Dead Air FM. The playfield is drawn from the simulation's collision geometry. */
(() => {
  'use strict';
  const W = 600, H = 800, TAU = Math.PI * 2;
  const paper = '#f4dbad', black = '#071519';
  const bandColours = ['#ff9a47', '#55e4d0', '#f87d82'];
  const bandNames = ['LOW', 'MID', 'HIGH'];
  const skins = [
    { scene:'boiler', title:'BOILER ROOM', frequency:'87.7', enamel:'#092c2d', accent:'#e78947', hot:'#ffba6c', cold:'#58cbb9' },
    { scene:'rooftop', title:'ROOFTOP RELAY', frequency:'94.6', enamel:'#0a2230', accent:'#52c6ce', hot:'#70f0ec', cold:'#e79370' },
    { scene:'moonshot', title:'THE MOONSHOT', frequency:'107.9', enamel:'#191e32', accent:'#bc859e', hot:'#ffb6b3', cold:'#5ad6cf' }
  ];
  const images = new Map(), boards = new WeakMap(), trails = new Map();
  const fx = [];
  let previousWorld = null, currentLayout = null;

  function circle(c,x,y,r,fill,stroke,width=1) {
    c.beginPath();c.arc(x,y,Math.max(0.01,r),0,TAU);
    if(fill){c.fillStyle=fill;c.fill();}
    if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
  }
  function path(c,points,close=false) {
    c.beginPath();c.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);
    if(close)c.closePath();
  }
  function poly(c,points,fill,stroke,width=1) {
    path(c,points,true);if(fill){c.fillStyle=fill;c.fill();}
    if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
  }
  function line(c,x,y,u,v,colour,width=1) {
    c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.strokeStyle=colour;c.lineWidth=width;c.stroke();
  }
  function linear(c,x,y,u,v,stops) {
    const g=c.createLinearGradient(x,y,u,v);
    for(const [t,colour] of stops)g.addColorStop(t,colour);
    return g;
  }
  function radial(c,x,y,r,stops) {
    const g=c.createRadialGradient(x,y,0,x,y,Math.max(.1,r));
    for(const [t,colour] of stops)g.addColorStop(t,colour);
    return g;
  }
  function font(c,text,x,y,size,colour,opt={}) {
    c.save();c.translate(x,y);
    if(opt.skew)c.transform(1,0,-.13,1,0,0);
    if(opt.rotate)c.rotate(opt.rotate);
    c.font=(opt.weight||'bold')+' '+size+'px '+(opt.face||'Arial, sans-serif');
    c.textAlign=opt.align||'center';c.textBaseline='middle';
    if(opt.outline){c.lineJoin='round';c.lineWidth=opt.outline;c.strokeStyle=black;c.strokeText(text,0,0,opt.maxWidth);}
    c.fillStyle=colour;c.fillText(text,0,0,opt.maxWidth);c.restore();
  }
  function rectangle(c,x,y,w,h,r,fill,stroke,width=1) {
    r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);
    c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();
    if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.lineWidth=width;c.strokeStyle=stroke;c.stroke();}
  }
  function screw(c,x,y,r=3) {
    circle(c,x,y+1,r+1,'#091417');
    circle(c,x,y,r,linear(c,x-r,y-r,x+r,y+r,[[0,'#f0dfae'],[.37,'#a6b4a4'],[.5,'#506462'],[1,'#304345']]));
    line(c,x-r*.55,y+r*.37,x+r*.55,y-r*.37,'#20353a',Math.max(1,r*.37));
  }
  function stationImage(skin) {
    if(!images.has(skin.scene)){
      const im=new Image(); const src='art/table-'+skin.scene+'.webp';
      im.src=window.DeadAirAssets?.[src]||window.FMAssets?.[src]||src;
      images.set(skin.scene,im);
    }
    const im=images.get(skin.scene);return im.complete && im.naturalWidth?im:null;
  }
  function drawFace(c,skin,img) {
    c.fillStyle=skin.enamel;c.fillRect(0,0,W,H);
    if(img){
      const scale=Math.max(W/img.width,H/img.height), w=img.width*scale,h=img.height*scale;
      c.drawImage(img,(W-w)/2,(H-h)/2,w,h);
    }
    c.fillStyle='rgba(6,24,28,.16)';c.fillRect(0,0,W,H);
    c.fillStyle=linear(c,0,0,0,H,[[0,'rgba(3,15,17,.52)'],[.25,'rgba(3,20,25,.12)'],[.55,'rgba(3,20,24,.04)'],[.82,'rgba(3,20,25,.36)'],[1,'rgba(3,13,19,.82)']]);
    c.fillRect(0,0,W,H);
    // Screen-printed key lines and the underside of the return apron.
    rectangle(c,4,4,W-8,H-8,24,null,'#14272a',8);
    rectangle(c,7,7,W-14,H-14,23,null,'#ad9066',1.6);
    rectangle(c,12,12,W-24,H-24,20,null,'#507878',1.2);
    // The thin line below the side channels is printed on the wood.
    [22,578].forEach(x=>{line(c,x,100,x,650,'#e0b97c70',1);});
    for(const [x,y] of [[17,23],[582,23],[17,776],[582,776]])screw(c,x,y);
  }
  function stampedBadge(c,x,y,word,skin) {
    c.save();c.translate(x,y);c.rotate(-.045);
    const width=Math.min(222,word.length*13+50);
    const p=[[-width/2+14,-18],[width/2,-18],[width/2-12,17],[-width/2,17]];
    c.save();c.translate(2,4);poly(c,p,'#09191ae8');c.restore();
    poly(c,p,'#102a2bde',skin.hot,1.7);
    line(c,-width/2+16,-13,width/2-6,-13,skin.cold,1);
    font(c,word,0,0,23,paper,{skew:true,weight:'900',maxWidth:width-28});
    c.restore();
  }
  function insignia(c,skin,stage) {
    stampedBadge(c,293,479,skin.title,skin);
    const freq=skin.frequency+'  MHz';
    rectangle(c,246,503,94,19,5,'#102125e6','#a8b7a3',1);
    font(c,freq,293,513,11,'#d9dcc2',{face:'monospace'});
    // A silkscreen lightning flash points back up toward the broadcast receiver.
    for(const [x,dir] of [[166,-1],[420,1]]){
      c.save();c.translate(x,482);c.scale(dir,1);
      poly(c,[[0,-8],[20,-8],[13,-1],[34,-1],[3,9],[8,2],[-6,2]],skin.accent,black,1.5);c.restore();
    }
    const bottom=stage===1?'AMPLIFIER  /  01':stage===2?'ANTENNA  /  02':'ORBITER  /  03';
    font(c,bottom,289,754,10,'#e2c68c',{face:'monospace',outline:3});
    for(const dir of [-1,1]){
      const start=dir<0?40:538;
      for(let i=0;i<3;i++)line(c,start+dir*i*3,746-i*3,dir<0?166:418,746-i*3,skin.accent,i===0?2:1);
    }
  }
  function printedRoutes(c,l,skin) {
    for(const b of l.bumpers){
      const index=Number(b.id)||0, col=bandColours[index%3];
      c.save();c.globalAlpha=.72;
      circle(c,b.x,b.y,b.r+13,null,'#0a1c21',6);
      circle(c,b.x,b.y,b.r+14,null,col,1.6);
      c.setLineDash([4,6]);circle(c,b.x,b.y,b.r+19,null,paper,1.7);c.restore();
    }
    const receiver=l.receiver;
    if(receiver) {
      const x=receiver.x,y=receiver.y;
      c.save();
      for(const d of [-1,1])for(let j=0;j<3;j++){
        c.beginPath();c.ellipse(x+d*1.5,y+10,receiver.r+10+j*8,receiver.r+24+j*7,0,d===1?-.83:Math.PI-.83,d===1?.83:Math.PI+.83);
        c.strokeStyle=j===1?skin.cold:'#d1a16c';c.lineWidth=j===1?3:1.5;c.stroke();
      }
      c.restore();
    }
    for(const t of l.targets){
      const r=t.r,x=t.x,y=t.y;
      for(let j=0;j<2;j++){
        const yy=y+r+11+j*7;
        poly(c,[[x-8,yy+3.2],[x,yy-2.5],[x+8,yy+3.2],[x+8,yy+6.2],[x,yy],[x-8,yy+6.2]],j?'#c7c3a2':bandColours[(Number(t.id)||0)%3],black,1.3);
      }
    }
  }
  function slings(c,l,skin) {
    for(const s of l.slings||[]){
      const p=s.points.map(pt=>Array.isArray(pt)?pt:[pt.x,pt.y]);
      if(p.length<3)continue;
      const cx=p.reduce((a,pt)=>a+pt[0],0)/p.length, cy=p.reduce((a,pt)=>a+pt[1],0)/p.length;
      c.save();c.translate(2,5);poly(c,p,'#061517b0', '#071318',9);c.restore();
      c.lineJoin='round';poly(c,p,linear(c,cx-30,cy-55,cx+30,cy+44,[[0,'#597771'],[.25,skin.enamel],[1,'#0a1a1d']]),'#a8b6a6',5);
      const inset=p.map(([x,y])=>[cx+(x-cx)*.82,cy+(y-cy)*.82]);
      poly(c,inset,skin.enamel,skin.hot,2);
      c.save();path(c,inset,true);c.clip();c.lineWidth=2;
      for(let i=-96;i<108;i+=8){line(c,cx+i,cy+58,cx+i+66,cy-58,'#f6bb7452',2);}
      c.restore();
      const bolts=p.map(([x,y])=>[cx+(x-cx)*.68,cy+(y-cy)*.68]);bolts.forEach(([x,y])=>screw(c,x,y,2.5));
      if(Number.isFinite(s.ax)) {
        line(c,s.ax,s.ay,s.bx,s.by,'#352d28',8);
        line(c,s.ax,s.ay-1,s.bx,s.by-1,skin.cold,6);
        line(c,s.ax,s.ay-2,s.bx,s.by-2,'#d2f3d6',1.35);
      }
    }
  }
  function rails(c,walls,skin) {
    c.lineCap='round';c.lineJoin='round';
    const groups=new Map();
    for(const wall of walls) {
      if(!groups.has(wall.kind))groups.set(wall.kind,[]);groups.get(wall.kind).push(wall);
    }
    for(const [kind,items] of groups) {
      const thick=(kind==='outer'||kind==='shooter')?10:7;
      function layer(colour,width,dx,dy) {
        c.beginPath();for(const wall of items){c.moveTo(wall.ax+dx,wall.ay+dy);c.lineTo(wall.bx+dx,wall.by+dy);}
        c.strokeStyle=colour;c.lineWidth=width;c.stroke();
      }
      layer('#071416c7',thick+7,1.8,4.5);
      layer('#0b2225',thick+3,0,0);
      layer(kind==='outer'?'#746957':'#658080',thick,0,0);
      layer(kind==='outer'?'#d2bd94':'#aec2b6',thick*.55,-.5,-.95);
      layer(kind==='return'?skin.cold:'#f6e6bc',1.45,-1.25,-1.8);
    }
  }
  function plunger(c,l,skin) {
    const x=l.launch.x,y=l.launch.y;
    rectangle(c,x-13,y+7,26,Math.max(45,775-(y+7)),8,'#152529','#a78e6b',1.8);
    line(c,x,y+14,x,769,'#879c95',7);line(c,x-1.5,y+14,x-1.5,768,'#ebd9b5',1.4);
    const limit=Math.min(761,y+65);
    for(let z=y+22;z<limit;z+=5)line(c,x-7,z,x+7,z+3,'#627974',2.8);
    rectangle(c,x-11,y+8,22,6,2,skin.accent,'#293b38',1);
  }
  function bumper(c,b,skin) {
    const {x,y,r}=b, col=bandColours[(Number(b.id)||0)%3];
    circle(c,x+2,y+7,r+3,'#061515b0');
    circle(c,x,y,r+2,linear(c,x-r*.5,y-r,x+r*.6,y+r,[[0,'#ead6ab'],[.21,'#c0aa80'],[.25,'#435456'],[.61,'#213b40'],[.78,'#9ca69b'],[1,'#4b5b56']]),'#10272a',2.2);
    circle(c,x,y,r-2,'#13272a','#3c5857',1);
    circle(c,x,y,r-4,radial(c,x-3,y-5,r+2,[[0,'#8c9d8e'],[.20,'#526a64'],[.32,'#203a3b'],[.78,'#12282d'],[.91,'#5f7974'],[1,'#182e30']]),col,2.1);
    for(let n=0;n<4;n++)circle(c,x,y,r*(.41+n*.115),null,n%2?'#8ca296':'#15292b',n%2?.8:1.7);
    circle(c,x,y,r*.36,linear(c,x-r*.2,y-r*.3,x+r*.3,y+r*.3,[[0,col],[.31,skin.enamel],[1,'#091e22']]),'#d3ceac',1.1);
    font(c,bandNames[(Number(b.id)||0)%3],x,y+.5,r*.31,'#fff1cc',{weight:'900',maxWidth:r*.69});
    for(let n=0;n<4;n++){
      const a=Math.PI*.25+n*Math.PI*.5;
      circle(c,x+Math.cos(a)*(r-.1),y+Math.sin(a)*(r-.1),1.65,'#102524');
    }
  }
  function target(c,t) {
    const x=t.x,y=t.y,r=t.r,band=Number(t.id)||0,col=bandColours[band%3];
    circle(c,x+1.5,y+4,r+2,'#071519bb');
    circle(c,x,y,r+2,linear(c,x-r,y-r,x+r,y+r,[[0,'#f9e9bc'],[.4,'#899c8d'],[.55,'#354d50'],[1,'#b5b6a1']]),'#142c30',1.6);
    circle(c,x,y,r-.8,'#18373b',col,1.4);
    circle(c,x,y,r*.67,'#132629','#7d8c76',.8);
  }
  function receiver(c,r,skin) {
    if(!r)return;
    const {x,y}=r,sz=r.r;
    c.save();c.translate(x,y);
    // Strong square inset instead of another deceptively round pop bumper.
    const pts=[[-sz-8,-sz*.40],[-sz*.52,-sz-6],[sz*.52,-sz-6],[sz+8,-sz*.4],[sz+7,sz*.48],[sz*.52,sz+5],[-sz*.52,sz+5],[-sz-7,sz*.48]];
    c.save();c.translate(1.5,4);poly(c,pts,'#051519',black,3);c.restore();
    poly(c,pts,linear(c,-30,-30,30,30,[[0,'#f1d9ac'],[.2,'#819b90'],[.45,'#354e50'],[.72,'#172c30'],[1,'#a1987b']]),'#132b30',2);
    circle(c,0,0,sz,skin.enamel,'#c8ccab',1.8);
    for(let q=0;q<4;q++)circle(c,0,0,sz*(.9-q*.10),null,q%2?'#324747':'#887b60',1.3);
    circle(c,0,0,sz*.54,'#531f1c','#de9871',1.2);
    for(const sign of [-1,1])screw(c,sign*(sz+2),0,2.4);
    rectangle(c,-22,-sz-20,44,13,3,'#162b2e','#b9a78a',1);
    font(c,'TX',0,-sz-13.2,10,'#eadbbb',{face:'monospace'});
    c.restore();
  }
  function staticBoard(layout,stage,scale) {
    const skin=skins[stage-1],img=stationImage(skin);
    let record=boards.get(layout);
    if(record&&record.stage===stage&&record.scale===scale&&record.loaded===!!img)return record.surface;
    const surface=document.createElement('canvas');surface.width=Math.round(W*scale);surface.height=Math.round(H*scale);
    const c=surface.getContext('2d');c.scale(scale,scale);c.lineJoin='round';c.lineCap='round';
    drawFace(c,skin,img);printedRoutes(c,layout,skin);insignia(c,skin,stage);
    c.fillStyle=linear(c,542,0,582,0,[[0,'#05181dd0'],[.22,'#12373bb8'],[.68,'#153e45a6'],[1,'#091c21de']]);c.fillRect(540,196,44,551);
    line(c,549,227,549,665,'#daa77191',1);line(c,576,227,576,665,'#79bab68c',1);
    for(let y=302;y<630;y+=68)poly(c,[[555,y+7],[562,y-3],[570,y+7],[562,y+3]],'#a9c5ab9c');
    font(c,'PLUNGER',562,674,8,'#c4d1bc',{weight:'bold',face:'monospace'});
    slings(c,layout,skin);plunger(c,layout,skin);rails(c,layout.walls,skin);
    layout.bumpers.forEach(b=>bumper(c,b,skin));layout.targets.forEach(t=>target(c,t));receiver(c,layout.receiver,skin);
    boards.set(layout,{stage,scale,loaded:!!img,surface});return surface;
  }
  function glow(c,x,y,r,colour,alpha) {
    if(alpha<.008)return;
    c.save();c.globalAlpha=alpha;
    circle(c,x,y,r,radial(c,x,y,r,[[0,colour],[.30,colour+'90'],[1,colour+'00']]));
    c.restore();
  }
  function bandLight(c,x,y,r,col,lit,pulse) {
    glow(c,x,y,r*3.8,col,lit?.15+pulse*.15:0);
    circle(c,x,y+.8,r+1.5,'#071b20');
    circle(c,x,y,r+1,null,'#ad9e7d',1);
    if(lit){
      circle(c,x,y,r,radial(c,x-r*.35,y-r*.40,r*1.55,[[0,'#ffffd3'],[.34,col],[1,'#526c63']]));
      circle(c,x-r*.28,y-r*.37,r*.18,'#fff2ce');
    }else{
      circle(c,x,y,r,col+'43');
      line(c,x-r*.45,y-r*.48,x+r*.15,y-r*.48,col+'8a',1.0);
    }
  }
  function lights(c,w,options,skin,now) {
    const l=w.layout,bands=options.bands||options.lit||[];
    const phase=options.reducedMotion?0:(Math.cos(now*TAU*1.45)+1)/2;
    const lit = index => typeof bands[index]==='boolean'?bands[index]:bands.includes(index);
    const since=obj=>Math.max(0,1-((w.clock||0)-(obj.hitAt??-100))/.34);
    for(const b of l.bumpers) {
      const id=Number(b.id)||0,col=bandColours[id%3],kick=since(b);
      for(const a of [-Math.PI*.96,-Math.PI*.04]){
        bandLight(c,b.x+Math.cos(a)*(b.r+8),b.y+Math.sin(a)*(b.r+8),2.2,col,lit(id)||kick>0,phase);
      }
      if(kick>0){
        glow(c,b.x,b.y,b.r*1.9,col,.3*kick);
        c.save();c.globalAlpha=kick*.83;circle(c,b.x,b.y,b.r+5+(1-kick)*11,null,col,2.7*kick+1);c.restore();
      }
    }
    for(const t of l.targets){
      const id=Number(t.id)||0,col=bandColours[id%3],isLit=lit(id),hit=since(t);
      bandLight(c,t.x,t.y,t.r*.66,col,isLit||hit>.05,phase);
      font(c,bandNames[id%3],t.x,t.y+.4,9.3,isLit?'#102324':'#f6eac9',{weight:'900',maxWidth:t.r*1.25});
    }
    for(const s of l.slings||[]){
      const hit=since(s);
      if(hit>0) {
        c.save();c.globalAlpha=hit*.8;
        line(c,s.ax,s.ay,s.bx,s.by,'#fff8c2',2.5);c.restore();
      }
    }
    const rec=l.receiver;
    if(rec){
      const on=!!options.receiverReady,hit=since(rec),col=on?'#ffe68f':'#ec774f';
      bandLight(c,rec.x,rec.y,rec.r*.50,col,on||hit>.1,phase);
      const ink=on?'#203432':'#e4c49c';
      line(c,rec.x,rec.y-2,rec.x-3.3,rec.y+5.6,ink,1.25);
      line(c,rec.x,rec.y-2,rec.x+3.3,rec.y+5.6,ink,1.25);
      line(c,rec.x-1.6,rec.y+2.8,rec.x+1.6,rec.y+2.8,ink,1);
      circle(c,rec.x,rec.y-3.4,1.4,ink);
      for(const side of [-1,1]){
        c.beginPath();c.arc(rec.x,rec.y-3,5.3,side>0?-.83:Math.PI-.83,side>0?.83:Math.PI+.83);
        c.strokeStyle=ink;c.lineWidth=1.25;c.stroke();
      }
      if(on){
        glow(c,rec.x,rec.y,58,'#ffd16b',.16+phase*.28);
        c.save();c.globalAlpha=.4+phase*.5;
        circle(c,rec.x,rec.y,rec.r+9+phase*4,null,'#ffeac2',1.6);c.restore();
      }
    }
    // These three broad inserts are readable even on a narrow phone.
    const y=575;
    for(let i=0;i<3;i++){
      const x=235+i*52, col=bandColours[i], on=lit(i);
      const points=[[x-21,y-7],[x-16,y-10],[x+20,y-10],[x+16,y+9],[x-21,y+9]];
      if(on)glow(c,x,y,29,col,.21+phase*.12);
      poly(c,points,on?col:'#102c30dd','#0c2226',3);poly(c,points,null,on?'#f1e4bd':col+'a6',1.3);
      font(c,bandNames[i],x-1,y+.1,11.5,on?'#152325':col,{weight:'900'});
    }
    if(options.receiverReady) {
      rectangle(c,237,601,100,17,4,'#ffda7f','#192a28',2);
      font(c,'TX  •  LIVE',287,610,11.7,'#162d2d',{face:'monospace'});
    }
  }
  function bat(c,f,skin) {
    const len=f.length,r=f.r,end=Math.max(6,r*.74),col=f.side==='left'?skin.hot:skin.cold;
    c.save();c.translate(f.x,f.y);c.rotate(f.angle);
    function shape(off,xoff,fill,stroke,width){
      c.beginPath();
      c.moveTo(xoff,-r+off);c.lineTo(len+xoff,-end+off);
      c.arc(len+xoff,off,end,-Math.PI/2,Math.PI/2);
      c.lineTo(xoff,r+off);c.arc(xoff,off,r,Math.PI/2,Math.PI*1.5);
      c.closePath();c.fillStyle=fill;c.fill();
      if(stroke){c.lineWidth=width;c.strokeStyle=stroke;c.stroke();}
    }
    shape(3.5,1.5,'#08191caa','#07191bb3',5);
    shape(0,0,col,'#142421',3.7);
    shape(-.5,-.4,linear(c,0,-r,0,r,[[0,'#ffebbd'],[.22,col],[.54,col],[.82,'#7c7963'],[1,'#344f4c']]),'#d7c8a5',1.0);
    c.lineCap='round';line(c,13,0,len-8,0,'#233a3c',3.4);
    line(c,14,-.6,len-11,-.6,skin.enamel,1.25);
    screw(c,0,0,4.5);
    c.restore();
  }
  function ball(c,b,resting,options) {
    const r=b.r||8,x=b.x,y=b.y;
    if(!resting&&!options.reducedMotion) {
      let trail=trails.get(b.id);
      if(!trail){trail=[];trails.set(b.id,trail);}
      const last=trail.at(-1);
      if(!last||Math.hypot(x-last.x,y-last.y)>1.4){
        trail.push({x,y});if(trail.length>7)trail.shift();
      }
      for(let i=1;i<trail.length;i++){
        const a=trail[i-1],v=trail[i];if(Math.hypot(a.x-v.x,a.y-v.y)>65)continue;
        line(c,a.x,a.y,v.x,v.y,'rgba(151,243,228,'+(.035+i*.027)+')',2+i*.65);
      }
    }
    if(resting){
      const phase=options.reducedMotion?.45:(Math.cos(performance.now()*.004)+1)/2;
      glow(c,x,y,r*3.1,'#8febd7',.14+phase*.12);
      circle(c,x,y,r+3+phase*1.5,null,'#b4e5d27d',1);
    }
    circle(c,x+2.2,y+4,r+1.35,'#071215d0');
    circle(c,x,y,r,radial(c,x-r*.36,y-r*.42,r*1.65,[[0,'#ffffff'],[.17,'#fff9d5'],[.33,'#e1f3df'],[.44,'#92c1bd'],[.50,'#334f59'],[.64,'#1b313a'],[.82,'#a8c7ba'],[1,'#d9dfc7']]),'#112b32',1.6);
    c.beginPath();c.arc(x,y,r*.78,-2.62,-1.24);c.lineWidth=1.65;c.strokeStyle='#fffde9';c.stroke();
    circle(c,x-r*.30,y-r*.44,r*.15,'#fffefa');
    circle(c,x+r*.30,y+r*.49,r*.105,'#fff1b8');
  }
  function hit(event) {
    if(!event)return;
    const kind=event.type||event.kind;const selected=['bumper','target','receiver','pulse','broadcast','bass','multiball','drain','sling'];
    if(!selected.includes(kind))return;
    const position=kind==='broadcast'&&currentLayout?.receiver?currentLayout.receiver:null;
    const x=Number.isFinite(event.x)?event.x:position?.x??285, y=Number.isFinite(event.y)?event.y:position?.y??500;
    fx.push({kind,x,y,when:performance.now()*.001,perfect:event.perfect});
    if(fx.length>20)fx.shift();
  }
  function particles(c,now,reduce) {
    for(let i=fx.length-1;i>=0;i--){
      const e=fx[i],age=now-e.when;
      if(age>.60){fx.splice(i,1);continue;}
      if(reduce)continue;
      const k=age/.6, big=['pulse','bass','broadcast','multiball'].includes(e.kind);
      const col=big?'#89f7d9':e.kind==='target'?'#f6b27a':'#ffe7ab';
      c.save();c.globalAlpha=Math.max(0,.82-k);
      if(big){
        circle(c,e.x,e.y,13+k*(e.perfect?165:99),null,col,3*(1-k)+.5);
        circle(c,e.x,e.y,12+k*72,null,col,1.1);
      }else if(e.kind!=='drain'){
        for(let n=0;n<7;n++){
          const a=n*TAU/7+e.x*.02,d=15+27*k+(n%2)*8;
          line(c,e.x+Math.cos(a)*d,e.y+Math.sin(a)*d,e.x+Math.cos(a)*(d+4),e.y+Math.sin(a)*(d+4),col,1.5*(1-k)+.3);
        }
      }
      c.restore();
    }
  }
  function render(canvas,world,options={}) {
    if(!canvas||!world?.layout)return;
    const ctx=canvas.getContext('2d');
    const bounds=canvas.getBoundingClientRect(),pixel=Math.min(2,window.devicePixelRatio||1);
    if(!bounds.width||!bounds.height)return;
    const pw=Math.max(1,Math.round(bounds.width*pixel)),ph=Math.max(1,Math.round(bounds.height*pixel));
    if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
    const scale=Math.min(pw/W,ph/H), now=performance.now()*.001;
    const stage=Math.max(1,Math.min(3,Math.floor(Number(options.stage||world.stage)||1)));
    if(previousWorld!==world){trails.clear();fx.length=0;previousWorld=world;}
    currentLayout=world.layout;
    ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=black;ctx.fillRect(0,0,pw,ph);
    ctx.setTransform(scale,0,0,scale,(pw-W*scale)/2,(ph-H*scale)/2);ctx.lineCap='round';ctx.lineJoin='round';
    ctx.drawImage(staticBoard(world.layout,stage,Math.max(1,Math.min(2,Math.ceil(scale)))),0,0,W,H);
    lights(ctx,world,options,skins[stage-1],now);
    world.flippers.forEach(f=>bat(ctx,f,skins[stage-1]));
    particles(ctx,now,options.reducedMotion);
    for(const id of trails.keys())if(!world.balls.some(b=>b.id===id))trails.delete(id);
    if(world.ready&&!world.balls.length)ball(ctx,{...world.layout.launch,r:8},true,options);
    world.balls.forEach(b=>ball(ctx,b,false,options));
  }
  window.FMTable=Object.freeze({render, draw:render, hit});
})();

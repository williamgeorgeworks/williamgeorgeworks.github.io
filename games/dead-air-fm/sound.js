/* Dead Air FM. Original three-station score and electromechanical table sounds. */
(() => {
  'use strict';

  const root = typeof window === 'undefined' ? globalThis : window;
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  const hz = note => 440 * Math.pow(2, (note - 69) / 12);
  const now = () => root.performance ? root.performance.now() / 1000 : Date.now() / 1000;
  const key = 'wgw.dead-air-fm.sound.v1';
  let settings = { muted:false, volume:0.58 };
  try {
    const stored = JSON.parse(root.localStorage?.getItem(key) || '{}');
    if (typeof stored.muted === 'boolean') settings.muted = stored.muted;
    if (Number.isFinite(stored.volume)) settings.volume = clamp(stored.volume, 0, 1);
  } catch { /* Audio also works in private storage contexts. */ }

  // Eight-bar phrases. Notes are written relative to each bar's bass root.
  const stations = [
    {
      bpm:170, root:38, roots:[0,0,3,-2,0,5,-2,-2],
      chords:[[0,3,7,10],[0,3,7,12],[0,4,7,11],[0,4,7,10],
        [0,3,7,10],[0,3,7,10],[0,4,7,10],[0,4,7,12]],
      kick:['0 6 10','0 7 11','0 3 10','0 7 10 14'],
      snare:['4 11 14','4 12','4 10 12','4 12 15'],
      ghosts:['3 8 15','6 10 14','2 7 15','2 9 13'],
      bass:[[0,0,3],[3,12,1],[6,0,2],[9,7,2],[13,10,2]],
      reply:[[0,0,5],[6,-2,2],[9,7,1],[11,10,2],[14,7,2]],
      motif:[[2,12,2],[5,15,1],[7,19,3],[12,17,2],[15,15,1]],
      answer:[[1,19,2],[4,17,3],[10,12,2],[14,10,2]]
    },
    {
      bpm:172, root:40, roots:[0,0,-2,0,3,0,-2,-2],
      chords:[[0,3,7,14],[0,3,7,12],[0,3,7,10],[0,3,7,14],
        [0,4,7,11],[0,3,7,14],[0,3,7,10],[0,3,8,10]],
      kick:['0 7 10','0 6 11','0 3 10','0 8 14'],
      snare:['4 12','4 12','4 10 12','4 12 14'],
      ghosts:['2 9 15','6 11 14','3 7 15','6 9 13'],
      bass:[[0,0,4],[5,0,1],[7,12,1],[9,0,3],[13,-2,2]],
      reply:[[0,0,2],[3,7,2],[6,0,2],[10,0,3],[15,-2,1]],
      motif:[[0,19,1],[3,19,1],[6,15,2],[10,14,1],[13,12,2]],
      answer:[[2,12,2],[7,7,1],[9,14,1],[12,15,1],[15,19,1]]
    },
    {
      bpm:174, root:37, roots:[0,5,3,7,0,5,3,-2],
      chords:[[0,3,7,14],[0,3,7,10],[0,4,7,11],[0,3,7,10],
        [0,3,7,10],[0,3,7,14],[0,4,7,11],[0,4,7,14]],
      kick:['0 8 10','0 7 11','0 6 10','0 7 14'],
      snare:['4 12','4 12','4 12 15','4 12'],
      ghosts:['3 10 14','2 6 15','6 11','3 9 15'],
      bass:[[0,0,5],[6,7,2],[9,0,3],[13,12,2]],
      reply:[[0,0,3],[4,12,2],[7,7,2],[11,0,3],[15,7,1]],
      motif:[[0,19,3],[5,22,2],[9,24,3],[14,19,2]],
      answer:[[1,14,3],[6,19,2],[9,17,2],[13,15,3]]
    }
  ];
  for (const station of stations) {
    for (const part of ['kick','snare','ghosts']) {
      station[part] = station[part].map(pattern => new Set(pattern.split(' ').map(Number)));
    }
  }

  let stage=1, mode='standby', anchorSeconds=now(), anchorBeat=0;
  let context=null, mix=null, drumBus=null, musicBus=null, effectBus=null;
  let echo=null, echoFeedback=null, output=null, samples={};
  let timer=null, nextTick=0, awake=false, hot=0;
  const lastFx = new Map();
  const tempo = () => stations[stage-1].bpm;
  const beatLength = () => 60/tempo();
  const beatsAt = seconds => anchorBeat + (seconds-anchorSeconds)/beatLength();
  const timeOfBeat = beat => anchorSeconds + (beat-anchorBeat)*beatLength();
  function timing() {
    const total=beatsAt(now()), beat=Math.floor(total);
    const phase=total-beat, beatDistance=Math.min(phase,1-phase)*beatLength();
    return { phase,beat,bar:Math.floor(beat/4),bpm:tempo(),nearBeat:beatDistance<=0.085,beatDistance };
  }

  // Table percussion and the drum kit are separately synthesised. No sound files
  // or third-party samples are needed, and buffers are reused on every hit.
  function buildSample(name,length,seed) {
    const sr=context.sampleRate, buffer=context.createBuffer(1,Math.ceil(length*sr),sr);
    const data=buffer.getChannelData(0);
    let random=seed,slow=0,previous=0,phase=0,peak=0;
    const metallic=(time,frequencies)=>frequencies.reduce((sum,f)=>sum+Math.sin(time*f*2*Math.PI),0)/frequencies.length;
    const cymbal=[1833,2911,3847,5027,6041], metal=[427,1133,1761,2597];
    for(let i=0;i<data.length;i++){
      const t=i/sr;
      random=(Math.imul(random,1664525)+1013904223)>>>0;
      const white=random/2147483648-1;
      slow+=0.10*(white-slow);
      const high=white-slow, bright=white-previous;
      previous=white;
      let value=0;
      switch(name){
        case 'kick':
          phase+=2*Math.PI*(46+114*Math.exp(-t*43))/sr;
          value=Math.sin(phase)*Math.exp(-t*15)+bright*0.16*Math.exp(-t*150);
          break;
        case 'snare':
          value=(0.52*Math.sin(t*2*Math.PI*(174+42*Math.exp(-t*44)))+
            0.2*Math.sin(t*2*Math.PI*326))*Math.exp(-t*34)+
            (high*0.57+slow*1.8)*Math.exp(-t*22)*(0.78+0.22*Math.cos(t*78));
          break;
        case 'rim':
          value=(0.7*Math.sin(t*2*Math.PI*690)+0.30*Math.sin(t*2*Math.PI*1354))*Math.exp(-t*78)+bright*0.18*Math.exp(-t*118);
          break;
        case 'hat':
        case 'open':
        case 'ride':
          value=(0.48*bright+0.19*high+0.35*metallic(t,cymbal))*Math.exp(-t*(name==='hat'?65:name==='ride'?13:20));
          break;
        case 'flipper':
          value=(0.56*Math.sin(t*2*Math.PI*154)+0.20*Math.sin(t*2*Math.PI*397)+
            1.6*slow)*Math.exp(-t*64)+0.35*high*Math.exp(-t*200);
          break;
        case 'spring':
          value=(0.5*metallic(t,metal)+0.22*Math.sin(t*2*Math.PI*(182+127*Math.exp(-t*16)))+
            slow*0.8)*Math.exp(-t*18);
          break;
        case 'switch':
          value=(0.25*Math.sin(t*2*Math.PI*1600)+high*0.77)*Math.exp(-t*165)+
            0.20*Math.sin(t*2*Math.PI*380)*Math.exp(-t*82);
          break;
        case 'wash':
          value=(high*0.26+slow*1.4)*Math.exp(-t*8);
          break;
      }
      value*=Math.min(1,t*2600)*Math.min(1,(length-t)*110);
      data[i]=value;
      peak=Math.max(peak,Math.abs(value));
    }
    const scale=0.94/Math.max(peak,0.001);
    for(let i=0;i<data.length;i++)data[i]*=scale;
    return buffer;
  }

  function connectPanned(node,destination,pan) {
    if(Math.abs(pan)>0.025&&context.createStereoPanner){
      const p=context.createStereoPanner();
      p.pan.value=clamp(pan,-1,1);node.connect(p);p.connect(destination);
    } else node.connect(destination);
  }
  function buildMixer() {
    const AC=root.AudioContext||root.webkitAudioContext;
    if(!AC)return false;
    try{ context=new AC({latencyHint:'interactive'}); } catch { return false; }
    mix=context.createGain();
    drumBus=context.createGain(); drumBus.gain.value=0.84; drumBus.connect(mix);
    musicBus=context.createGain(); musicBus.gain.value=0.84; musicBus.connect(mix);
    effectBus=context.createGain(); effectBus.gain.value=0.86; effectBus.connect(mix);
    echo=context.createDelay(1.0);echo.delayTime.value=beatLength()*0.75;
    const tape=context.createBiquadFilter();tape.type='lowpass';tape.frequency.value=2300;
    echoFeedback=context.createGain();echoFeedback.gain.value=0.24;
    echo.connect(tape);tape.connect(echoFeedback);echoFeedback.connect(echo);
    const wet=context.createGain();wet.gain.value=0.49;tape.connect(wet);connectPanned(wet,musicBus,0.27);
    const glue=context.createDynamicsCompressor();
    glue.threshold.value=-13;glue.knee.value=13;glue.ratio.value=4.8;
    glue.attack.value=0.003;glue.release.value=0.14;
    mix.connect(glue);
    output=context.createGain();output.gain.value=settings.muted?0:settings.volume*0.88;
    glue.connect(output);output.connect(context.destination);
    const kit={kick:.38,snare:.30,rim:.11,hat:.11,open:.28,ride:.42,flipper:.10,spring:.28,switch:.09,wash:.52};
    Object.entries(kit).forEach(([name,length],i)=>{samples[name]=buildSample(name,length,321444+i*957);});
    return true;
  }
  function sample(name,t,level,rate=1,pan=0,bus=drumBus) {
    const source=context.createBufferSource(),gain=context.createGain();
    source.buffer=samples[name];source.playbackRate.value=rate;gain.gain.value=level;
    source.connect(gain);connectPanned(gain,bus,pan);source.start(t);
  }
  function voice(t,note,length,level,opts={}) {
    const osc=context.createOscillator(),gain=context.createGain();
    const duration=Math.max(.025,length), attack=Math.min(opts.attack||.005,duration*.45);
    const end=t+duration;
    osc.type=opts.wave||'sine';
    const pitch=hz(note);
    osc.frequency.setValueAtTime(pitch,t);
    if(opts.slide!==undefined)osc.frequency.exponentialRampToValueAtTime(hz(opts.slide),end);
    if(opts.detune)osc.detune.value=opts.detune;
    gain.gain.setValueAtTime(.0001,t);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002,level),t+attack);
    gain.gain.exponentialRampToValueAtTime(.0001,end+.001);
    let head=osc;
    if(opts.filter){
      const filter=context.createBiquadFilter();filter.type='lowpass';
      filter.Q.value=opts.q||.72;
      filter.frequency.setValueAtTime(opts.filter,t);
      if(opts.close)filter.frequency.exponentialRampToValueAtTime(opts.close,t+duration);
      osc.connect(filter);head=filter;
    }
    head.connect(gain);
    connectPanned(gain,opts.bus||musicBus,opts.pan||0);
    if(opts.send){const send=context.createGain();send.gain.value=opts.send;gain.connect(send);send.connect(echo);}
    if(opts.fm){
      const mod=context.createOscillator(),amt=context.createGain();mod.frequency.value=pitch*opts.fm;
      amt.gain.setValueAtTime(pitch*(opts.index||.35),t);
      amt.gain.exponentialRampToValueAtTime(.01,end);mod.connect(amt);amt.connect(osc.frequency);
      mod.start(t);mod.stop(end+.015);
    }
    osc.start(t);osc.stop(end+.015);
  }
  function bass(t,note,length) {
    // Separate fundamental and tightly filtered harmonic voice keep the bass
    // audible on a phone speaker without overloading the low end on headphones.
    voice(t,note,length,.48,{wave:'sine',attack:.010});
    if(stage===1)voice(t,note+12,length*.88,.16,{wave:'triangle',filter:920,close:180,attack:.013});
    if(stage===2){
      voice(t,note,length,.18,{wave:'sawtooth',filter:980,close:130,detune:-7,q:1.3,attack:.008});
      voice(t,note,length,.12,{wave:'sawtooth',filter:720,close:145,detune:8,attack:.015});
    }
    if(stage===3)voice(t,note+12,length,.15,{wave:'sine',fm:1.5,index:.65,attack:.023});
  }
  function lead(t,note,length,answer) {
    if(stage===1){
      voice(t,note,length,.16,{wave:'triangle',filter:2300,close:640,send:.36,pan:answer?.22:-.17});
      voice(t,note+12,length*.65,.055,{wave:'sine',attack:.007,send:.28,pan:.23});
    } else if(stage===2){
      voice(t,note,length*.86,.13,{wave:'square',filter:1650,close:340,send:.18,q:1.05,pan:answer?.29:-.23});
      sample('spring',t,.085,1.33,answer?-.29:.32);
    } else {
      voice(t,note,length*1.65,.18,{fm:2,index:1.15,attack:.012,send:.49,pan:answer?.28:-.20});
      voice(t,note+12,length,.054,{wave:'triangle',attack:.026,send:.33,pan:.25});
    }
  }
  function pads(t,base,chord,length,level) {
    chord.forEach((n,i)=>{
      const tone=base+12+n;
      voice(t+i*.007,tone,length,level*(i===3?.78:1),{
        wave:stage===2?'sawtooth':'triangle',attack:stage===2?.04:.13,
        filter:stage===2?590:1250,close:stage===3?690:315,
        pan:[-.48,.26,-.15,.56][i],detune:i%2?3:-3,send:stage===3?.35:.20
      });
    });
  }
  function signature(t,bus,rich=true) {
    const notes=stage===1?[74,77,81,79]:stage===2?[76,79,83,82]:[73,80,85,87];
    for(let i=0;i<(rich?4:3);i++)voice(t+i*beatLength()*.34,notes[i],.31,.14,{
      wave:'sine',fm:2,index:.65,send:.42,pan:(i-1.5)*.14,bus
    });
  }

  function scheduleStep(t,tick) {
    const station=stations[stage-1], len=beatLength()/4;
    const step=((tick%16)+16)%16, bar=Math.floor(tick/16);
    const phrase=((bar%8)+8)%8, rhythm=((bar%4)+4)%4;
    const base=station.root+station.roots[phrase],chord=station.chords[phrase];
    // Low-density interludes share the same clock as the cabinet's beat lamp.
    if(mode!=='play') {
      if(mode==='lost'||mode==='win')return;
      if(step===0){
        pads(t,base,chord,beatLength()*4.5,.081);
        sample('kick',t,.24,.91);
      }
      if(step===8)sample('rim',t,.12,1.23,-.28);
      if(step===6||step===14)voice(t,base+24+chord[(rhythm+step)%4],len*3,.085,{fm:2,send:.49,pan:.42});
      if(step===12&&phrase===7)signature(t,musicBus,false);
      return;
    }
    if(station.kick[rhythm].has(step))sample('kick',t,step===0?.94:.71,step===0?1.0:1.054);
    if(station.snare[rhythm].has(step)){
      const accent=step===4||step===12;
      sample('snare',t,(accent?.84:.50)*(stage===3?.94:1),stage===2?1.06:.99,accent?.045:-.12);
      if(accent)sample('rim',t+.004,stage===2?.19:.105,1.12,-.18);
    }
    if(station.ghosts[rhythm].has(step)){
      sample('snare',t+len*.17,.19+(step%3)*.025,1.52,step%2?-.28:.24);
    }
    if(step%2===0){
      const offbeat=step%4===2;
      sample('hat',t+(offbeat?len*.10:0),offbeat?.29:.18,offbeat?1:1.15,offbeat?.29:-.25);
    }
    if(step===14&&(rhythm===1||stage===3))sample('open',t+.006,.23,.93,.40);
    if((rhythm===3||hot>now())&&(step===7||step===15))sample('hat',t+len*.12,.16,1.29,-.34);
    if((phrase===7||hot>now())&&step>=13){
      sample('snare',t+len*.46,.14+(step-13)*.06,1.23+(step-13)*.12,-.18);
    }
    if(stage===2&&step%8===2)sample('spring',t,.09,rhythm%2?.73:1.07,-.49);
    if(stage===3&&step===0&&phrase%2===0)sample('ride',t,.22,.83,.43);
    const bassLine=phrase%2===0?station.bass:station.reply;
    for(const [at,offset,duration] of bassLine)if(at===step){
      bass(t,base+offset,len*duration*1.19);
    }
    if(step===0&&(stage!==2||phrase%2===0))pads(t,base,chord,beatLength()*(stage===3?4.4:3),stage===2?.056:.071);
    const answer=phrase%2!==0;
    for(const [at,offset,duration] of answer?station.answer:station.motif)if(at===step){
      lead(t,base+12+offset,len*duration,answer);
    }
    if(stage===1&&(step===6||step===14)&&phrase%2===0){
      for(const interval of [3,7,10])voice(t,base+24+interval,len*1.8,.057,{wave:'sine',fm:2,index:.63,send:.23,pan:-.26});
    }
    if(stage===3&&(step%4===3)){
      voice(t+len*.09,base+36+chord[(Math.floor(step/4)+phrase)%4],len*2,.047,{fm:1.5,index:.34,send:.53,pan:step%8===3?.51:-.47});
    }
  }

  function audibleLag() {
    if(typeof context.getOutputTimestamp==='function'){
      const stamp=context.getOutputTimestamp();
      if(stamp.performanceTime>0&&stamp.contextTime>0){
        return clamp(context.currentTime-stamp.contextTime-(now()-stamp.performanceTime/1000),0,.12);
      }
    }
    return clamp((context.outputLatency||0)+(context.baseLatency||0),0,.12);
  }
  function schedule() {
    if(!context||context.state!=='running'||settings.muted)return;
    const current=now(), lag=audibleLag();
    const first=Math.ceil(beatsAt(current+lag+.004)*4);
    if(nextTick<first)nextTick=first;
    const limit=beatsAt(current+lag+.14)*4;
    while(nextTick<limit){
      const t=context.currentTime+timeOfBeat(nextTick/4)-current-lag;
      scheduleStep(Math.max(context.currentTime+.002,t),nextTick++);
    }
  }
  function stopScheduler(){if(timer!==null){root.clearInterval(timer);timer=null;}}
  function runScheduler() {
    if(timer!==null)return;
    nextTick=Math.ceil(beatsAt(now())*4);
    schedule();timer=root.setInterval(schedule,38);
  }
  function visible(){return !root.document?.hidden;}
  function sync() {
    if(!context||!awake)return;
    if(settings.muted||!visible()){
      stopScheduler();
      if(context.state==='running')context.suspend().catch(()=>{});
      return;
    }
    if(context.state==='running')runScheduler();
    else if(context.state!=='closed')context.resume().then(()=>{
      if(!settings.muted&&visible())runScheduler();else sync();
    }).catch(()=>{});
  }
  function start() {
    if(!context&&settings.muted){awake=true;return;}
    if(!context&&!buildMixer())return;
    awake=true;sync();
  }
  function saveSettings(){try{root.localStorage?.setItem(key,JSON.stringify(settings));}catch{}}
  function setVolume(value){
    if(!Number.isFinite(value))return;
    settings.volume=clamp(value,0,1);
    if(context)output.gain.setTargetAtTime(settings.muted?0:settings.volume*.88,context.currentTime,.025);
    saveSettings();
  }
  function setMuted(value) {
    settings.muted=!!value;
    if(awake&&!context&&!settings.muted)start();
    if(context)output.gain.setTargetAtTime(settings.muted?0:settings.volume*.88,context.currentTime,.018);
    saveSettings();sync();return settings.muted;
  }
  function setStage(value) {
    const index=clamp(Math.round(Number(value)||1),1,3);
    if(index===stage)return;
    const at=now();anchorBeat=beatsAt(at);anchorSeconds=at;
    stage=index;hot=0;
    if(context)echo.delayTime.setTargetAtTime(beatLength()*.75,context.currentTime,.08);
  }
  function setMode(value) {
    const aliases={playing:'play',live:'play',battle:'play',reward:'upgrade',won:'win',loss:'lost',gameover:'lost'};
    const next=aliases[value]||value;
    if(!['standby','play','upgrade','win','lost'].includes(next)||next===mode)return;
    mode=next;
    if(next==='upgrade')fx('upgrade');
    if(next==='win')fx('win');
    if(next==='lost')fx('lost');
  }

  const minGap={flip:.043,rail:.11,bumper:.065,sling:.075,target:.085,receiver:.19,nudge:.16,drain:.19,
    launch:.15,tilt:.5,multiball:.36,upgrade:.28,win:.5,lost:.5,bass:.15,perfect:.15};
  function fx(type,strength=1,pan=0) {
    if(!context||context.state!=='running'||settings.muted||!visible())return;
    const aliases={flipper:'flip',wall:'rail',gate:'target',ball:'launch',over:'lost',tuned:'target',save:'ballsave',drop:'bass'};
    type=aliases[type]||type;
    const clock=now(),gap=minGap[type]||.08;
    if(clock-(lastFx.get(type)??-1)<gap)return;
    lastFx.set(type,clock);
    const t=context.currentTime+.004, pos=clamp(Number(pan)||0,-1,1)*.68;
    const weight=clamp(Number(strength)||1,.40,1.35);
    const info=timing(),station=stations[stage-1],phrase=((info.bar%8)+8)%8;
    const base=station.root+station.roots[phrase];
    const blip=(note,len,amp,extra={})=>voice(t,note,len,amp*weight,{bus:effectBus,pan:pos,...extra});
    const drum=(name,gain,rate=1)=>sample(name,t,gain*weight,rate,pos,effectBus);
    const chime=(notes,spacing,amp,decay=.29)=>notes.forEach((n,i)=>voice(t+spacing*i,base+n,decay,amp*weight,{bus:effectBus,fm:2,index:.50,pan:pos,send:.32}));
    switch(type){
      case 'flip': drum('flipper',.45,pos<0?.90:1.13);drum('switch',.14,.92);break;
      case 'rail': drum('switch',.15,1+pos*.2);break;
      case 'sling': drum('spring',.45,1.32+pos*.19);drum('switch',.22,1.22);break;
      case 'bumper': {
        const interval=[12,15,19,22][((info.beat%4)+4)%4];
        drum('flipper',.38,1.38);
        blip(base+interval,.23,.28,{fm:2,index:1.47,send:.25});
        break;
      }
      case 'target': drum('switch',.31,1.18);chime([24,31],.052,.23);break;
      case 'receiver': drum('spring',.38,.78);chime([12,19,24,27],beatLength()/6,.24,.42);break;
      case 'launch': drum('spring',.52,.94);blip(base+8,.22,.14,{wave:'triangle',slide:base+24,send:.23});break;
      case 'nudge': drum('flipper',.57,.62);break;
      case 'tilt': blip(43,.39,.23,{wave:'square',slide:35,filter:750,close:190});break;
      case 'drain': drum('wash',.27,.79);blip(base+19,.40,.20,{wave:'triangle',slide:base-1,filter:1500,close:240});break;
      case 'ballsave': chime([19,24,31],.064,.27);break;
      case 'multiball': hot=clock+beatLength()*24;signature(t,effectBus);chime([0,7,12],beatLength()*.5,.33,.60);break;
      case 'upgrade': signature(t,effectBus);break;
      case 'win': signature(t,effectBus);chime([12,19,24,31,36],beatLength()*.50,.25,.67);break;
      case 'lost': chime([19,15,12,0],beatLength()*.52,.23,.53);drum('wash',.25,.68);break;
      case 'bass':
      case 'perfect': {
        const perfect=type==='perfect';
        drum('kick',perfect?.97:.69,.93);drum('wash',perfect?.27:.18,.70);
        blip(base+12,.46,perfect?.45:.32,{slide:base-7,wave:'sine'});
        if(perfect){hot=clock+beatLength()*8;chime([12,19,22,24],beatLength()*.18,.19,.29);}
        break;
      }
      case 'click': drum('switch',.24,1.16);break;
    }
  }
  function pulse(){const beat=timing();fx(beat.nearBeat?'perfect':'bass');return beat;}
  root.document?.addEventListener('visibilitychange',sync);
  root.FMSound=Object.freeze({
    start,setStage,setMode,fx,pulse,timing,phase:()=>timing().phase,setMuted,
    toggleMute:()=>setMuted(!settings.muted),setVolume,getSettings:()=>({...settings})
  });
})();

/* Dead Air FM. The cabinet, physics and sound all consume this deterministic rule set. */
(function (root) {
  'use strict';
  const VERSION = 1;
  const bands = ['Low', 'Mid', 'High'];
  const stages = [
    {name:'The Boiler Room',frequency:'87.7 FM',place:'The mill basement',bands,goal:5,
      rule:'Speaker bumpers give double Signal.',cue:'Jo has found the mains. Ferret has found the volume.'},
    {name:'Rooftop Relay',frequency:'94.6 FM',place:'The roof of the mill',bands,goal:7,
      rule:'Alternate between numbered bumpers or targets for double Signal.',cue:'Kenneth has strapped the aerial to a shopping trolley.'},
    {name:'The Moonshot',frequency:'107.9 FM',place:'The orbital uplink',bands,goal:9,
      rule:'Chain three quick scoring hits for double Signal.',cue:'Arthur has claimed the only chair in mission control.'}
  ];
  const difficulties = ['Local Pirate','After Hours','Dead Zone'];
  const kits = {};
  function kit(id,name,owner,text,group) {
    kits[id] = {id,name,owner,slug:owner.toLowerCase(),text,group};
  }
  kit('dubplate','Dubplate Acetate','Ferret','Perfect Bass Drops light two bands and repay one charge.','tuner');
  kit('fuse','Spare Fuse','Jo','Bank an extra ball now. Raise the ball stock limit to four.','control');
  kit('coil','Flyback Coil','Terry','Add 25% flipper power. Receiver shots score an extra 350.','control');
  kit('pencil','Red Pencil','Reggie','Hit an already-lit target to strike off a different missing band.','tuner');
  kit('splitter','Feedback Splitter','Kenneth','Your first perfect Bass Drop on each table releases a second ball.','wild');
  kit('cushion','The Good Cushion','Arthur','Shift the flippers inward to cover more of the drain.','control');
  kit('box','Box of Spares','Spyro','Gain one ball save now and one on arrival at the next table.','control');
  kit('needle','Quiet Needle','Tilly','Slow gravity by 16%. Keep your shot chain for two more seconds.','control');
  kit('patchbay','Patchbay Jumper','Trixie','A fresh target lights its band and fills the Bass Drop meter.','tuner');
  kit('marshal','Queue Marshal','Dexter','Nudges recharge in one second. Bumpers pay double for two seconds after a nudge.','control');
  kit('tin','Biscuit Tin','Daisy','Every third speaker hit pops the tin, lights a missing band and banks 300 points.','wild');
  const kitIds = Object.keys(kits);
  const scoreFor = {bumper:120,target:180,receiver:220,sling:40};
  const clamp = (n,lo,hi) => Math.max(lo,Math.min(hi,n));
  const has = (s,id) => s.kit.includes(id);
  function hash(seed) {
    let n = 2166136261;
    for (let i=0;i<seed.length;i++) n=Math.imul(n^seed.charCodeAt(i),16777619);
    return (n>>>0)||0x23c3f35b;
  }
  function random(s) {
    let n=s.rng;
    n ^= n<<13; n ^= n>>>17; n ^= n<<5;
    s.rng=n>>>0;
    return s.rng/4294967296;
  }
  function shuffle(s,list) {
    const out=list.slice();
    for(let i=out.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[out[i],out[j]]=[out[j],out[i]];}
    return out;
  }
  function dailySeed(date = new Date()) {
    return 'FM-'+new Date(date).toISOString().slice(0,10);
  }
  function resetTable(s) {
    s.signal=0; s.goal=stages[s.stage-1].goal+s.difficulty*2;
    s.bands=[false,false,false]; s.receiverReady=false; s.stageHits=0;
    s.transmissions=0; s.transmissionsNeeded=s.stage;
    s.stageGear=false; s.stageSplit=false; s.chainSplit=false;
    s.breakChain=false; s.combo=0; s.multiplier=1; s.lastHit=-100; s.lastFreq=-1;
    s.nudgedAt=-100; s.bumperHits=0; s.multi=0;
    s.charges=Math.max(2,s.charges||0);
    s.lastCall=stages[s.stage-1].cue;
  }
  function newRun(seed,difficulty=0) {
    seed=seed==null||seed===''?'AIR-'+Math.random().toString(36).slice(2,8).toUpperCase():String(seed).slice(0,80);
    difficulty=clamp(Math.floor(Number(difficulty)||0),0,2);
    const s={version:VERSION,seed,rng:hash(seed),difficulty,stage:1,phase:'ready',score:0,
      balls:difficulty===2?2:3,ballSaves:difficulty===0?1:0,kit:[],offers:[],offerReason:'',
      resumePhase:'ready',archived:false,charges:2,
      stats:{broadcasts:0,drains:0,ballsLaunched:0,saves:0,hits:0,bumpers:0,targets:0,
        receiverShots:0,tunes:0,links:0,chain:0,pulses:0,perfect:0,multiballs:0,gear:0}};
    resetTable(s);
    return s;
  }
  function tuning(s) {
    return {
      assist:has(s,'cushion')?2:0,
      flipBoost:has(s,'coil') ? .25 : 0,
      gravityScale:(1+s.difficulty*.065)*(has(s,'needle')?.84:1),
      nudgeInterval:has(s,'marshal')?1:2.7
    };
  }
  function objective(s) {
    if(s.phase==='won')return 'Three stations on air. The signal is yours.';
    if(s.phase==='lost')return 'The transmitter has gone quiet.';
    if(s.phase==='upgrade')return s.offerReason==='station'?'Choose a mod for the next broadcast.':'Choose a crew mod. Your ball is held.';
    const leg=s.stage===1?'':(s.stage===2?'Relay ':'Packet ')+(s.transmissions+1)+'/'+s.transmissionsNeeded+'. ';
    if(s.receiverReady)return leg+'Shoot the receiver or fill Signal to transmit.';
    return leg+'Light LOW, MID and HIGH. A full Signal meter tunes a missing band.';
  }
  function newRecord() {
    return {runs:0,wins:0,highScore:0,bestStage:0,bestChain:0,gear:[],daily:{},last:null};
  }
  function recordRun(record,s) {
    if(!record||!s||s.archived||!['won','lost'].includes(s.phase))return false;
    record.runs=(record.runs||0)+1;
    record.wins=(record.wins||0)+(s.phase==='won'?1:0);
    record.highScore=Math.max(record.highScore||0,s.score);
    record.bestStage=Math.max(record.bestStage||0,s.stage);
    record.bestChain=Math.max(record.bestChain||0,s.stats.chain);
    record.gear=Array.from(new Set([...(Array.isArray(record.gear)?record.gear:[]),...s.kit]));
    record.last={seed:s.seed,score:s.score,stage:s.stage,won:s.phase==='won',difficulty:s.difficulty};
    if(/^FM-\d{4}-\d{2}-\d{2}$/.test(s.seed)){
      const daily=record.daily||{},key=s.seed+'/'+s.difficulty;
      daily[key]=Math.max(daily[key]||0,s.score);
      record.daily=Object.fromEntries(Object.entries(daily).sort(([a],[b])=>b.localeCompare(a)).slice(0,40));
    }
    s.archived=true;
    return true;
  }
  function canResume(s) {
    if(!s||s.version!==VERSION||!['ready','live','upgrade','lost','won'].includes(s.phase))return false;
    return Number.isInteger(s.stage)&&s.stage>=1&&s.stage<=3&&
      Number.isInteger(s.difficulty)&&s.difficulty>=0&&s.difficulty<=2&&
      typeof s.seed==='string'&&Number.isInteger(s.rng)&&Number.isFinite(s.score)&&s.score>=0&&
      Number.isInteger(s.balls)&&s.balls>=0&&Array.isArray(s.bands)&&s.bands.length===3&&
      s.bands.every(b=>typeof b==='boolean')&&Array.isArray(s.kit)&&s.kit.every(id=>Object.hasOwn(kits,id))&&
      Array.isArray(s.offers)&&s.offers.every(id=>Object.hasOwn(kits,id))&&
      (s.phase!=='upgrade'||s.offers.length===3)&&!!s.stats;
  }
  function pickEquipment(s,reason) {
    const available=shuffle(s,kitIds.filter(id=>!has(s,id)));
    const pick=[];
    for(const group of ['control','tuner']){
      const id=available.find(id=>kits[id].group===group);
      if(id)pick.push(id);
    }
    for(const id of available){if(pick.length===3)break;if(!pick.includes(id))pick.push(id);}
    s.offers=shuffle(s,pick);s.offerReason=reason;s.resumePhase=s.phase;s.phase='upgrade';
  }
  function award(s,points,results) {
    s.score+=points;
    results.push({type:'score',amount:points,score:s.score});
  }
  function say(s,text,results) {
    s.lastCall=text;results.push({type:'notice',text});
  }
  function light(s,index,results) {
    if(index<0||index>2||s.bands[index])return false;
    s.bands[index]=true;s.stats.tunes++;
    results.push({type:'tune',index,band:bands[index]});
    if(s.bands.every(Boolean)){
      s.receiverReady=true;s.signal=0;results.push({type:'armed'});
      say(s,'All three bands locked. Shoot the receiver!',results);
    }else say(s,bands[index]+' band tuned.',results);
    return true;
  }
  function transmit(s,results) {
    s.transmissions++;s.stats.links++;
    if(s.transmissions<s.transmissionsNeeded){
      const label=s.stage===2?'Relay':'Packet';
      award(s,450*s.stage,results);
      s.bands=[false,false,false];s.signal=0;s.receiverReady=false;
      s.charges=Math.max(2,s.charges);
      say(s,label+' '+s.transmissions+' received. Tune the next three bands.',results);
      results.push({type:'relay',index:s.transmissions,total:s.transmissionsNeeded});
      return;
    }
    s.stats.broadcasts++;
    award(s,1200*s.stage+250*s.balls,results);
    results.push({type:'broadcast',stage:s.stage});
    if(s.stage===stages.length){
      s.phase='won';s.multi=0;
      say(s,'The Moonshot is live. Arthur expects royalties.',results);
      results.push({type:'won',score:s.score});
    }else{
      pickEquipment(s,'station');
      say(s,stages[s.stage-1].name+' is on air. Choose your next rig.',results);
      results.push({type:'upgrade',reason:'station'});
    }
  }
  function feed(s,amount,results) {
    s.signal=Math.min(s.goal,s.signal+amount);
    if(s.signal<s.goal)return;
    s.signal=0;
    if(s.receiverReady)transmit(s,results);
    else light(s,s.bands.indexOf(false),results);
  }
  function releaseSecondBall(s,results) {
    if(s.multi!==1)return false;
    s.multi=2;s.stats.multiballs++;
    say(s,'Two balls live. Mind the aerial.',results);
    results.push({type:'multiball'});
    return true;
  }
  function chooseUpgrade(s,index) {
    const results=[];
    if(s.phase!=='upgrade'||!Number.isInteger(index)||!s.offers[index])return results;
    const id=s.offers[index],reason=s.offerReason;
    s.kit.push(id);s.stats.gear++;
    if(id==='fuse')s.balls=Math.min(4,s.balls+1);
    if(id==='box')s.ballSaves++;
    s.offers=[];s.offerReason='';s.phase=s.resumePhase;
    results.push({type:'installed',id});
    if(reason==='station'){
      s.stage++;s.phase='ready';resetTable(s);
      if(has(s,'box'))s.ballSaves++;
      if(!s.difficulty)s.balls=Math.min(has(s,'fuse')?4:3,s.balls+1);
      results.push({type:'stage',stage:s.stage});
    }else say(s,kits[id].owner+' fitted '+kits[id].name+'.',results);
    return results;
  }
  function drain(s,remaining,results) {
    s.multi=remaining;
    if(remaining>0)return;
    s.stats.drains++;s.combo=0;s.multiplier=1;s.breakChain=true;
    if(s.ballSaves>0){
      s.ballSaves--;s.stats.saves++;
      say(s,'Ball saved. The station gets another go.',results);
      results.push({type:'save'});
    }else s.balls=Math.max(0,s.balls-1);
    if(s.balls===0){
      s.phase='lost';s.offers=[];s.offerReason='';
      say(s,'Dead air. Jo gives the transmitter one last thump.',results);
      results.push({type:'lost',score:s.score});
    }else if(s.phase==='upgrade'){s.resumePhase='ready';}
    else{
      s.phase='ready';s.charges=Math.max(s.charges,1);
      if(!results.some(e=>e.type==='save'))say(s,'Ball drained. '+s.balls+' left in the cabinet.',results);
      results.push({type:'serve',balls:s.balls});
    }
  }
  function comboNow(s,clock) {
    const windowSeconds=has(s,'needle')?5.1:3.1;
    return !s.breakChain&&clock-s.lastHit<=windowSeconds?s.combo:0;
  }
  function onContact(s,e,t,results) {
    const type=e.type,idx=Number(e.index??e.id);
    const indexed=(type==='target'||type==='bumper')&&Number.isInteger(idx)&&idx>=0&&idx<=2;
    const readyBefore=s.receiverReady;
    s.combo=comboNow(s,t)+1;s.breakChain=false;s.lastHit=t;
    s.stats.chain=Math.max(s.stats.chain,s.combo);
    s.multiplier=Math.min(4,1+Math.floor((s.combo-1)/3));
    s.stats.hits++;s.stageHits++;
    let signal=1,base=scoreFor[type];
    if(s.stage===2&&indexed&&s.lastFreq>=0&&s.lastFreq!==idx)signal++;
    if(s.stage===3&&s.combo>=3)signal++;
    if(indexed)s.lastFreq=idx;
    if(type==='bumper'){
      s.bumperHits++;s.stats.bumpers++;
      if(s.stage===1)signal++;
      if(has(s,'marshal')&&t-s.nudgedAt<2)base*=2;
      if(has(s,'tin')&&s.bumperHits%3===0){base+=300;light(s,s.bands.indexOf(false),results);}
    }else if(type==='target'){
      s.stats.targets++;signal++;
      if(indexed){
        const fresh=light(s,idx,results);
        if(fresh&&has(s,'patchbay'))s.charges=3;
        if(!fresh&&has(s,'pencil'))light(s,s.bands.indexOf(false),results);
      }
    }else if(type==='receiver'){
      s.stats.receiverShots++;signal++;
      if(has(s,'coil'))base+=350;
    }
    if(type!=='sling'||s.stageHits%2===0)s.charges=Math.min(3,s.charges+1);
    award(s,base*s.multiplier,results);
    if(type==='receiver'&&readyBefore){transmit(s,results);return;}
    // A switch that just armed transmission opens a fresh meter for the relay.
    if(readyBefore||!s.receiverReady)feed(s,signal,results);
    if(s.phase!=='live')return;
    if(s.combo>=5&&!s.chainSplit&&releaseSecondBall(s,results))s.chainSplit=true;
    if(!s.stageGear&&s.stageHits>=s.stage+1){
      s.stageGear=true;pickEquipment(s,'gear');
      say(s,'A rig part is in. Pick a crew mod.',results);
      results.push({type:'upgrade',reason:'gear'});
    }
  }
  function applyEvent(s,e,clock) {
    const results=[];
    if(!s||!e||['won','lost'].includes(s.phase))return results;
    const t=Number.isFinite(clock)?clock:Number(e.time)||0;
    if(e.type==='launch'&&s.phase==='ready'&&s.balls>0){
      s.phase='live';s.multi=1;s.stats.ballsLaunched++;s.breakChain=true;
      say(s,'On the air.',results);
    }else if(e.type==='drain'&&(s.phase==='live'||(s.phase==='upgrade'&&s.offerReason==='gear'&&s.resumePhase==='live'))){
      drain(s,Math.max(0,Number(e.remaining)||0),results);
    }else if(s.phase==='live'){
      if(e.type==='nudge')s.nudgedAt=t;
      else if(Object.hasOwn(scoreFor,e.type))onContact(s,e,t,results);
    }
    return results;
  }
  function dropBass(s,clock,onBeat) {
    const results=[];
    if(s.phase!=='live'||s.charges<3)return results;
    const perfect=Boolean(onBeat);
    s.charges=perfect&&has(s,'dubplate')?1:0;
    s.stats.pulses++;if(perfect)s.stats.perfect++;
    results.push({type:'pulse',perfect});
    award(s,perfect?500:100,results);
    if(perfect){
      const readyBefore=s.receiverReady;
      if(readyBefore)feed(s,2,results);
      else{
        light(s,s.bands.indexOf(false),results);
        if(has(s,'dubplate'))light(s,s.bands.indexOf(false),results);
      }
      if(s.phase==='live'&&has(s,'splitter')&&!s.stageSplit&&releaseSecondBall(s,results))s.stageSplit=true;
    }
    if(s.phase==='live'&&!results.some(e=>e.type==='armed'||e.type==='relay'))
      say(s,perfect?'On the beat! Bass wave out.':'Bass wave out.',results);
    return results;
  }
  const api={version:VERSION,stages,difficulties,kits,newRun,canResume,dailySeed,newRecord,recordRun,
    tuning,objective,comboNow,applyEvent,dropBass,chooseUpgrade};
  root.FMRules=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);

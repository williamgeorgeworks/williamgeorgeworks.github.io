/* Dead Air FM — input, cabinet, between-ball decisions and local saves. */
(() => {
  'use strict';
  const R=window.FMRules, P=window.FMPhysics, T=window.FMTable, A=window.FMSound;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const art=p=>(window.DeadAirAssets||{})[p]||p;
  const shapes={
    wave:'<path d="M1 13h4l3-8 4 16 4-19 3 11h4"/>',
    sound:'<path d="M3 9h4l5-4v14l-5-4H3zM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    mute:'<path d="M3 9h4l5-4v14l-5-4H3zM16 9l6 6m0-6-6 6"/>',pause:'<path d="M7 5v14M16 5v14" stroke-width="3.5"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2.5-3 5m0 3h.01"/>',
    plug:'<path d="M7 3v5m7-5v5M4 8h13v3a6 6 0 0 1-6 6v4m6-8h3"/>',
    meter:'<path d="M3 18a9 9 0 1 1 18 0zM12 14l4-6"/>',
    radio:'<circle cx="12" cy="9" r="1.5"/><path d="M8 6a5 5 0 0 0 0 6m8-6a5 5 0 0 1 0 6M5 3a9 9 0 0 0 0 12m14-12a9 9 0 0 1 0 12m-7-4-4 10m4-10 4 10m-7-3h6"/>',
    record:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M6 11a6 6 0 0 1 5-5m7 7a6 6 0 0 1-5 5"/>',
    left:'<path d="m14 5-7 7 7 7"/>',right:'<path d="m10 5 7 7-7 7"/>',
    close:'<path d="m5 5 14 14M19 5 5 19"/>',bolt:'<path d="m14 2-9 12h7l-2 8 10-14h-8z"/>'
  };
  const icon=key=>'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7">'+(shapes[key]||'')+'</svg>';
  document.querySelectorAll('[data-icon]').forEach(node=>node.replaceWith(document.createRange().createContextualFragment(icon(node.dataset.icon))));
  const RUN='wgw.dead-air-fm.run.1', RECORD='wgw.dead-air-fm.records.1';
  const GAME='dead-air-fm', ARCADE='https://williamgeorgeworks.co.uk/arcade.html';
  const standalone=!!window.DeadAirAssets||!['http:','https:'].includes(location.protocol);
  const arcadeLink='<a class="btn secondary" href="'+ARCADE+'">Back to arcade</a>';
  const boardUrl=ARCADE+'#dead-air-fm-scores';
  let scorePanel,scoreRun;
  function load(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
  function store(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
  function okSave(save){
    const r=save?.state,w=save?.world;
    return R.canResume(r)&&w?.version===1&&w.stage===r.stage&&w.seed===r.seed&&Number.isFinite(w.clock)&&Array.isArray(w.flippers)&&w.flippers.length===2&&Array.isArray(w.balls)&&w.balls.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y))&&Array.isArray(w.events)&&Array.isArray(w.layout?.walls)&&Array.isArray(w.layout?.bumpers)&&Array.isArray(w.layout?.targets)&&!!w.layout?.receiver;
  }
  const saved=load(RUN),restored=okSave(saved);
  let s=restored?saved.state:R.newRun(), world=restored?saved.world:P.create(s.seed,s.stage);
  let record=Object.assign(R.newRecord(),load(RECORD)||{}),dialog='',lastFocus=null,lastFrame=performance.now(),savedAt=0,saveOK=true,captionTimer=0,difficulty=s.difficulty,dirty=true;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const presses={left:new Set(),right:new Set()};
  const pointerSides=new Map();
  const scoreText=n=>String(Math.max(0,Math.round(Number(n)||0))).padStart(6,'0');
  const pad=n=>String(n).padStart(2,'0');
  const button=(action,content,style='secondary')=>'<button data-action="'+action+'" class="btn '+style+'">'+content+'</button>';
  const crewImg=kit=>art('art/crew/'+kit.slug+'.webp');
  function checkpoint(){saveOK=store(RUN,{state:s,world});savedAt=performance.now();}
  function crest(key,text){const el=$(key);if(el.textContent!==text)el.textContent=text;}
  function caption(text){
    if(!text)return;
    clearTimeout(captionTimer);const el=$('flashCaption');el.textContent=text;el.classList.remove('show');void el.offsetWidth;
    el.classList.add('show');captionTimer=setTimeout(()=>el.classList.remove('show'),850);
  }
  function syncMode(){A.setStage(s.stage);A.setMode(s.phase==='lost'?'lost':s.phase==='won'?'win':s.phase==='upgrade'?'upgrade':s.phase==='live'&&!dialog?'play':'standby');}
  function setInput(side,id,held){if(!presses[side])return;if(held)presses[side].add(id);else presses[side].delete(id);$(side+'Paddle').classList.toggle('pressed',!!presses[side].size);}
  function release(){for(const side of ['left','right']){presses[side].clear();$(side+'Paddle').classList.remove('pressed');}pointerSides.clear();}
  function paintStation(){
    const stage=R.stages[s.stage-1];
    crest('stationKind',stage.place);crest('stationIndex',pad(s.stage)+' / 03');crest('stationName',stage.name);crest('stationRule',stage.rule);crest('frequency',stage.frequency.split(' ')[0]);
    document.querySelector('.dial-scale').style.setProperty('--tuned',[21,51,88][s.stage-1]+'%');
    $('stationList').innerHTML=R.stages.map((st,i)=>'<li class="'+(i+1===s.stage?'current':i+1<s.stage?'done':'')+'">'+esc(st.name)+'</li>').join('');
    crest('kitCount',pad(s.kit.length));
    $('kitList').innerHTML=s.kit.map(id=>R.kits[id]).map(k=>'<div class="kit-item" title="'+esc(k.text)+'"><img src="'+crewImg(k)+'" alt=""><div><strong>'+esc(k.name)+'</strong><small>'+esc(k.owner)+'</small></div></div>').join('')||'<p class="rig-empty">Hit two switches to call in your first crew upgrade.</p>';
    crest('highScore',scoreText(record.highScore));crest('bpm',A.timing().bpm+' BPM');
  }
  function leds(){
    const stock=Math.max(3,s.balls);return Array.from({length:stock},(_,i)=>'<i class="ball-led'+(i<s.balls?'':' spent')+'" aria-hidden="true"></i>').join('')+'<span class="sr-only">'+s.balls+' balls remaining</span>';
  }
  function hud(){
    const stage=R.stages[s.stage-1],ready=s.phase==='ready',live=s.phase==='live';
    const score=scoreText(s.score);crest('score',score);crest('mobileScore',score);
    const percent=Math.round(100*s.signal/s.goal);
    crest('signalNumber',percent+'%');const meter=$('signalMeter');meter.style.setProperty('--power',percent+'%');meter.setAttribute('aria-valuenow',percent);
    $('bands').innerHTML=stage.bands.map((band,i)=>'<span class="band-tag '+(s.bands[i]?'lit':'')+'" aria-label="'+esc(band)+(s.bands[i]?' tuned':' untuned')+'">'+esc(band)+'</span>').join('');
    const mobileObj=s.receiverReady?'Hit the receiver':s.bands.filter(Boolean).length+'/3 bands';
    crest('mobileObjective','FM '+stage.frequency.split(' ')[0]+' · '+mobileObj);
    $('mobileBalls').innerHTML=leds();$('balls').innerHTML=leds();
    crest('objective',R.objective(s));crest('bassCharge',s.charges+'/3');crest('bassStatus',s.charges>=3?'Drop on the beat':'Hits charge bass');
    $('bassBtn').disabled=$('compactBass').disabled=!live||s.charges<3;
    $('nudgeBtn').disabled=!live;if($('compactNudge'))$('compactNudge').disabled=!live;
    $('launchPanel').hidden=!ready||!!dialog;
    crest('launchName',s.stats.ballsLaunched?'Back on the plunger':'Ball on the plunger');
    crest('launchKicker',s.stats.ballsLaunched?(s.ballSaves?'Ball save armed':'Transmitter ready'):(matchMedia('(pointer:coarse)').matches?'Tap each side to flip':'Arrows to flip'));
    crest('boothLive',live&&!dialog?'On air':s.phase==='won'?'Transmitted':'Standby');
    $('boothLive').classList.toggle('live',live&&!dialog);
    const chain=R.comboNow(s,world.clock);
    crest('ticker',(s.multi>1?'MULTIBALL · ':'')+(chain>=3&&live?'Chain ×'+chain+' · ':'')+s.lastCall);
    document.querySelector('[data-action="sound"]').innerHTML=icon(A.getSettings().muted?'mute':'sound');
    dirty=false;
  }
  function completeRun(){
    if(R.recordRun(record,s))store(RECORD,record);
    checkpoint();show('finish');
  }
  function handleEffects(events){
    for(const e of events){
      switch(e.type){
        case 'multiball': if(P.multiball(world))caption('MULTIBALL'); break;
        case 'tune': caption(e.band.toUpperCase()+' LOCKED');break;
        case 'armed': caption('RECEIVER ARMED');break;
        case 'relay': T.hit({type:'broadcast'});A.fx('receiver');caption('RELAY JACKPOT');break;
        case 'broadcast': T.hit(e);A.fx('receiver');caption('ON THE AIR');break;
        case 'pulse': P.pulse(world,e.perfect);caption(e.perfect?'PERFECT DROP':'BASS DROP');break;
        case 'save': A.fx('save');caption('BALL SAVED');break;
        case 'upgrade': show('gear');break;
        case 'stage': world=P.create(s.seed,s.stage);break;
        case 'won': case 'lost': completeRun();break;
        case 'notice': $('announce').textContent=e.text;break;
      }
    }
  }
  function onPhysical(e){
    T.hit(e);
    if(e.type!=='pulse')A.fx(e.type,e.strength?Math.min(1.2,.55+e.strength/650):.85,(e.x/300)-1);
    const phase=s.phase,ef=R.applyEvent(s,e,e.time);
    handleEffects(ef);
    if(ef.length||phase!==s.phase)dirty=true;
    if(phase!==s.phase){syncMode();checkpoint();}
  }
  function launch(){
    if(dialog||s.phase!=='ready'||!P.launch(world,.79))return;
    P.step(world,0,{},onPhysical);dirty=true;hud();syncMode();checkpoint();$('table').focus({preventScroll:true});
  }
  function bass(){
    if(dialog||s.phase!=='live'||s.charges<3||!world.balls.some(b=>!b.inShooter))return;
    const timing=A.pulse(),events=R.dropBass(s,world.clock,timing.nearBeat);
    handleEffects(events);dirty=true;hud();syncMode();checkpoint();
  }
  function tick(frame){
    const dt=Math.max(0,Math.min((frame-lastFrame)/1000,.055));lastFrame=frame;
    if(!document.hidden){
      if(!dialog&&(s.phase==='live'||s.phase==='ready')){
        P.step(world,dt,{left:!!presses.left.size,right:!!presses.right.size},onPhysical);
        if(s.phase==='live'&&frame-savedAt>1800)checkpoint();
      }
      if(dirty)hud();
      const beat=A.timing(),lit=!motion.matches&&beat.nearBeat;
      $('beatMark').classList.toggle('on',lit);$('compactBass').classList.toggle('on',s.charges>=3&&lit);
      const elapsed=world.clock;
      T.render($('table'),world,{stage:s.stage,time:elapsed,beat:beat.phase,bands:s.bands,signal:s.signal,goal:s.goal,receiverReady:s.receiverReady,combo:R.comboNow(s,elapsed),reducedMotion:motion.matches});
    }
    requestAnimationFrame(tick);
  }
  function stationRecap(){
    return '<p>'+s.stats.broadcasts+' / 3 broadcasts · '+s.stats.hits+' switch hits · Best chain '+s.stats.chain+' · '+s.stats.multiballs+' multiball'+(s.stats.multiballs===1?'':'s')+'</p>';
  }
  function recordMarkup(){
    const rows=[['Personal best',scoreText(record.highScore)],['Completed runs',record.runs],['Full broadcasts',record.wins],['Best hit chain',record.bestChain],['Crew mods collected',(Array.isArray(record.gear)?record.gear.length:0)+' / '+Object.keys(R.kits).length],['Today’s best · '+R.difficulties[difficulty],scoreText(record.daily?.[R.dailySeed()+'/'+difficulty]||0)]];
    return '<ul class="record-list">'+rows.map(([k,v])=>'<li><span>'+esc(k)+'</span><b>'+esc(v)+'</b></li>').join('')+'</ul>';
  }
  function mountScorePanel(run,host){
    if(scoreRun===run&&scorePanel){host.append(scorePanel);return;}
    scoreRun=run;
    scorePanel=document.createElement('div');
    scorePanel.className='score-panel';
    host.append(scorePanel);
    const receipt=run.scoreReceipt;
    if(receipt){
      const text=receipt.status==='added'?'Score logged for '+receipt.name+'.'
        :receipt.status==='duplicate'?'This score is already on the board.'
        :'Score checked. It fell outside the top ten.';
      scorePanel.textContent=text;
      return;
    }
    if(!Number.isSafeInteger(run.score)||run.score<1||run.score>999999){
      scorePanel.textContent=run.score===0?'Score a point on your next run to enter the top ten.':'This score falls outside the arcade’s submission range.';
      return;
    }
    const link=document.createElement('a');
    link.className='score-entry';
    link.href=ARCADE+'?game='+GAME+'&score='+run.score+'#send-score';
    link.textContent=standalone?'Send in your score at the arcade':'Send in your score';
    scorePanel.append(link);
    if(standalone)return;
    link.addEventListener('wgw-score-result',e=>{
      const result=e.detail;
      if(result?.game!==GAME||Number(result.score)!==run.score||!['added','duplicate','not-top'].includes(result.status))return;
      run.scoreReceipt={status:result.status,name:result.name};
      if(run===s)checkpoint();
    });
    if(!document.getElementById('shared-score-script')){
      const script=document.createElement('script');
      script.id='shared-score-script';
      script.src='../../quickscore.js';
      script.onerror=()=>script.remove();
      document.head.append(script);
    }
  }
  async function loadTopTen(box){
    try{
      const response=await fetch(standalone?new URL('scores.json',ARCADE):'../../scores.json',{cache:'no-cache'});
      if(!response.ok)throw new Error('Arcade unavailable');
      const board=(await response.json()).games?.[GAME];
      if(!Array.isArray(board?.entries))throw new Error('Board unavailable');
      const entries=board.entries.slice().sort((a,b)=>b.score-a.score||String(a.date).localeCompare(String(b.date))).slice(0,10);
      if(!box.isConnected)return;
      if(!entries.length){box.textContent='No scores on air yet. Finish a run and send yours in.';return;}
      const fmt=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
      const rows=entries.map((entry,i)=>{
        const date=new Date(entry.date);
        const when=Number.isFinite(date.getTime())?fmt.format(date):'';
        return '<li><span class="board-rank">'+pad(i+1)+'</span><span class="board-handle">'+esc(entry.name)+'</span><strong>'+esc(Number(entry.score).toLocaleString('en-GB'))+'</strong><small>'+esc(when)+'</small></li>';
      });
      box.innerHTML='<ol class="top-ten-list" aria-label="Scores ranked highest first">'+rows.join('')+'</ol>';
    }catch{
      if(box.isConnected)box.textContent='The score board is off air. Check your connection and try again.';
    }
  }
  function show(name){
    if(!dialog){lastFocus=document.activeElement;release();}
    dialog=name;
    const terminal=name==='gear'||name==='finish';
    let title='',tag='',html='';
    if(name==='menu'){
      tag='Broadcast desk';title='Off the air';html='<p>'+esc(R.stages[s.stage-1].name)+' · '+esc(R.difficulties[s.difficulty])+' · '+scoreText(s.score)+' points</p><p class="fine">'+esc(s.seed)+' · '+(saveOK?'Run saved on this browser.':'Local saves are unavailable in this browser.')+'</p><div class="modal-actions">'+button('resume','Resume','btn-amber')+button('new','New run')+button('records','Records')+button('help','Controls')+'</div>';
      html+='<div class="score-nav">'+button('leaderboard','Public top ten')+arcadeLink+'</div>';
    }else if(name==='gear'){
      const next=s.offerReason==='station';tag=next?'Transmission complete':'Crew workshop';title=next?'Rebuild the rig':'Fit a crew mod';
      html='<p>'+esc(next?R.stages[s.stage-1].name+' is on air. Take one part to '+R.stages[s.stage].name+'.':'The ball is held. Choose one part to change how the machine plays.')+'</p><div class="offers">'+s.offers.map((id,i)=>{const k=R.kits[id];return '<button class="offer" data-action="install" data-i="'+i+'"><img src="'+crewImg(k)+'" alt=""><span class="offer-copy"><small>'+esc(k.owner)+'</small><strong>'+esc(k.name)+'</strong><span class="description">'+esc(k.text)+'</span></span></button>';}).join('')+'</div>';
    }else if(name==='finish'){
      tag=s.phase==='won'?'Final transmission':'End of transmission';title=s.phase==='won'?'The Moonshot is live':'The station went quiet';
      html='<p class="end-score">'+scoreText(s.score)+' points</p>'+stationRecap()+'<p>'+esc(s.phase==='won'?'Arthur would like his royalties in biscuits.':'The last ball drained at '+R.stages[s.stage-1].name+'.')+'</p><div id="finishScore"></div><div class="modal-actions">'+button('new','New run','btn-amber')+button('retry','Replay this seed')+button('records','Cabinet records')+'</div>';
      html+='<div class="score-nav">'+button('leaderboard','Public top ten')+arcadeLink+'</div>';
    }else if(name==='leaderboard'){
      tag='Arcade hall of fame';title='Dead Air FM top ten';
      html='<div id="topTen" role="status" aria-live="polite">Tuning in to the arcade…</div><div class="modal-actions">'+button('resume','Back to the rig','btn-teal')+'<a class="btn secondary" href="'+boardUrl+'">View at the arcade</a></div>';
    }else if(name==='help'){
      tag='Operator’s manual';title='Work the machine';
      html='<p>Send three pirate broadcasts from the Lancashire mill to orbit. Keep the silver ball alive with the flippers.</p><h3>Tune and transmit</h3><p>Hit LOW, MID and HIGH. Other switches fill Signal and light missed bands. Once all three glow, hit the receiver or fill Signal once more. The rooftop and lunar rigs need extra transmissions.</p><h3>Work the beat</h3><p>Switches charge Bass. Drop it as the beat lamp flashes to kick the ball upwards and tune a band. Chain five quick scoring hits for multiball.</p><h3>Controls</h3><p><b>Keyboard</b> · Arrows or A/D flip. Space launches or drops bass. N nudges the table. P pauses.</p><p><b>Touch or mouse</b> · Press the left or right half of the table, or use the flipper buttons. Two fingers can work both flippers.</p><p class="fine">William George &amp; Terrance Quill (AI collaborator). Original station art, playfield illustrations and synthesised score. Crew portraits adapted from the William George Works universe.</p><div class="modal-actions">'+button('resume','Back to the rig','btn-amber')+'</div>';
    }else if(name==='sound'){
      title='Sound desk';tag='Studio monitor';const audio=A.getSettings(),v=Math.round(audio.volume*100);
      html='<p>Three original broadcasts. The boiler room opens with jungle, the rooftop switches to industrial drum and bass, and the orbital uplink ends at 174 BPM.</p><div class="setting"><label for="level">Volume</label><input id="level" type="range" min="0" max="100" value="'+v+'"><output id="volumeValue">'+v+'%</output></div><div class="modal-actions">'+button('mute',audio.muted?'Switch sound on':'Mute audio')+button('resume','Back to the rig','btn-teal')+'</div>';
    }else if(name==='records'){tag='Local cabinet';title='Station log';html=recordMarkup()+'<div class="modal-actions">'+button('resume','Back','btn-teal')+'</div>';
    }else if(name==='new'){
      tag='Programme selector';title='Start a broadcast';
      html='<p>'+(s.phase==='lost'||s.phase==='won'?'Choose a difficulty and cue the next broadcast.':'Starting another broadcast replaces the current run. Your cabinet records stay on this browser.')+'</p><div class="setting"><label for="difficulty">Difficulty</label><select id="difficulty">'+R.difficulties.map((d,i)=>'<option value="'+i+'"'+(i===difficulty?' selected':'')+'>'+esc(d)+'</option>').join('')+'</select></div><div class="modal-actions">'+button('random','Fresh broadcast','btn-amber')+button('daily','Daily frequency')+button('resume','Back')+'</div><p class="fine">The daily frequency uses one shared seed per UTC day. Each difficulty has its own daily best.</p>';
    }
    $('overlay').hidden=false;$('cabinet').inert=true;
    $('overlay').innerHTML='<section class="modal" role="dialog" aria-modal="true" aria-labelledby="dlgTitle"><div class="modal-top"><div><div class="eyebrow">'+esc(tag)+'</div><h2 id="dlgTitle">'+esc(title)+'</h2></div>'+(terminal?'':'<button class="round" data-action="resume" aria-label="Close panel">'+icon('close')+'</button>')+'</div>'+html+'</section>';
    if(name==='finish')mountScorePanel(s,$('finishScore'));
    if(name==='leaderboard')loadTopTen($('topTen'));
    $('overlay').querySelector('button')?.focus({preventScroll:true});syncMode();dirty=true;hud();
  }
  function close(force=false){
    if(!force&&s.phase==='upgrade'){show('gear');return;}
    if(!force&&['won','lost'].includes(s.phase)){show('finish');return;}
    dialog='';$('overlay').hidden=true;$('overlay').innerHTML='';$('cabinet').inert=false;
    if(lastFocus?.isConnected&&!lastFocus.disabled)lastFocus.focus({preventScroll:true});else $('table').focus({preventScroll:true});
    lastFrame=performance.now();dirty=true;hud();syncMode();
  }
  function reset(seed,level){
    release();s=R.newRun(seed,level);world=P.create(s.seed,s.stage);Object.assign(world,R.tuning(s));close(true);paintStation();hud();checkpoint();
  }
  function action(name,i){
    A.start();
    if(name==='launch'){launch();return;}
    if(name==='nudge'){if(!dialog&&s.phase==='live')P.nudge(world);return;}
    if(name==='bass'){bass();return;}
    if(name==='resume'){close();return;}
    if(name==='install'){
      if(s.phase!=='upgrade')return;
      const changes=R.chooseUpgrade(s,i);if(!changes.length)return;
      handleEffects(changes);Object.assign(world,R.tuning(s));close(true);paintStation();hud();checkpoint();A.fx('target');return;
    }
    if(name==='mute'){A.toggleMute();show('sound');return;}
    if(name==='random'||name==='daily'||name==='retry'){reset(name==='daily'?R.dailySeed():name==='retry'?s.seed:undefined,name==='retry'?s.difficulty:difficulty);return;}
    if(name==='new')difficulty=s.difficulty;
    if(['new','menu','help','records','leaderboard','sound'].includes(name)){checkpoint();show(name);}
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b&&!b.disabled)action(b.dataset.action,Number(b.dataset.i));else if(e.target===$('overlay'))close();});
  document.addEventListener('input',e=>{if(e.target.id==='level'){A.setVolume(Number(e.target.value)/100);crest('volumeValue',e.target.value+'%');}if(e.target.id==='difficulty')difficulty=Number(e.target.value);});
  for(const id of ['leftPaddle','rightPaddle','table']){
    $(id).addEventListener('pointerdown',e=>{
      if(dialog||e.button!==0)return;e.preventDefault();A.start();
      const rect=$('table').getBoundingClientRect(),side=id==='table'?(e.clientX-rect.left<rect.width/2?'left':'right'):(id==='leftPaddle'?'left':'right');
      pointerSides.set(e.pointerId,side);setInput(side,'p'+e.pointerId,true);e.currentTarget.setPointerCapture(e.pointerId);
    });
    $(id).addEventListener('lostpointercapture',e=>{const side=pointerSides.get(e.pointerId);if(side){setInput(side,'p'+e.pointerId,false);pointerSides.delete(e.pointerId);}});
  }
  const sides={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
  document.addEventListener('keydown',e=>{
    if(dialog){
      if(e.code==='Escape'||e.code==='KeyP'){if(!e.repeat){e.preventDefault();close();}}
      if(e.code==='Tab'){
        const items=[...$('overlay').querySelectorAll('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled)')].filter(el=>el.getClientRects().length),first=items[0],last=items.at(-1);
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
      }return;
    }
    if(e.altKey||e.ctrlKey||e.metaKey)return;
    if(sides[e.code]){e.preventDefault();if(!e.repeat){A.start();setInput(sides[e.code],e.code,true);}return;}
    if(e.repeat)return;
    if(e.code==='Space'){e.preventDefault();action(s.phase==='ready'?'launch':'bass');}
    if(e.code==='KeyN'){e.preventDefault();action('nudge');}
    if(e.code==='KeyP'||e.code==='Escape'){e.preventDefault();action('menu');}
  });
  document.addEventListener('keyup',e=>{if(sides[e.code])setInput(sides[e.code],e.code,false);});
  function suspend(){release();if(s.phase==='live'&&!dialog)show('menu');checkpoint();}
  window.addEventListener('blur',suspend);window.addEventListener('pagehide',checkpoint);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else lastFrame=performance.now();});
  Object.assign(world,R.tuning(s));paintStation();hud();syncMode();
  if(s.phase==='upgrade')show('gear');else if(s.phase==='lost'||s.phase==='won')completeRun();else if(restored&&s.phase==='live')show('menu');
  checkpoint();requestAnimationFrame(tick);
})();

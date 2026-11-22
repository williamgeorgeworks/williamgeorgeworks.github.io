/* Browser presentation for The Nonsense Engine. The rules live in engine.js. */
(() => {
  'use strict';
  const E = window.AccordEngine, A = window.AccordAudio;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const asset = path => (window.AccordAssets || {})[path] || path;
  const paths = {
    bolt:'<path fill="currentColor" stroke="none" d="M14.8 1 3.7 14h6.8l-1.2 9L21 9.1h-7.7z"/>',
    heart:'<path fill="currentColor" stroke="none" d="M12 21 3.4 12.8C-2.4 6.6 5.3-.5 12 6.1 18.7-.5 26.4 6.6 20.6 12.8z"/>',
    ink:'<path d="M12 2c-2.5 4.5-7.5 9.1-7.5 13.1a7.5 7.5 0 0 0 15 0C19.5 11.1 14.5 6.5 12 2Z"/><path d="M8.3 15.1c0 1.8 1.2 3 3 3.2"/>',
    cards:'<rect x="7" y="3" width="13" height="16" rx="2"/><path d="M4 7 2.7 19a2 2 0 0 0 1.8 2.2l10.2.8M11 8h5m-5 4h3"/>',
    pile:'<path d="m2 8 10-5 10 5-10 5zM2 12l10 5 10-5M2 16l10 5 10-5"/>',
    discard:'<path d="M4.3 10a8 8 0 1 1 .7 6m-.7-6-1-6m1 6 5-2"/>',
    map:'<path d="m2 5 6-2 8 3 6-2v15l-6 2-8-3-6 2zM8 3v15m8-12v15"/>',
    volume:'<path d="M3 9h4l5-4v14l-5-4H3zM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    mute:'<path d="M3 9h4l5-4v14l-5-4H3zM16 9l6 6m0-6-6 6"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>', close:'<path d="m5 5 14 14M19 5 5 19"/>',
    sword:'<path d="m5 20 4-4m-4-2 5 5m-3-5L17 3l4-1-1 5L10 17"/>',
    shield:'<path d="m12 2 8.5 3.5v6c0 4-3.2 7.8-8.5 10.5C6.7 19.3 3.5 15.5 3.5 11.5v-6z"/>',
    star:'<path fill="currentColor" stroke="none" d="M12 1.3 15 8l7.3.8-5.5 5 .9 7.3-5.7-3.7-6.4 3.7 1.4-7.4-5.4-4.9 7.2-.8z"/>',
    next:'<path d="M4 5v14l10-7zM19 5v14"/>', help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2.5-3 5m0 3h.01"/>',
    log:'<path d="M5 3h14v18H5zM8 7h8m-8 4h8m-8 4h5"/>',
    flag:'<path d="M4 22V3c5-4 10 4 16 0v10c-6 4-11-4-16 0"/>',
    mug:'<path d="M3 7h13v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM16 8h2a3 3 0 0 1 0 6h-2M6 3v1m4-2v2"/>',
    crown:'<path d="m2 6 5 4 5-7 5 7 5-4-3 12H5zM5 21h14"/>',
    pen:'<path d="m3 21 5-1 13-13-4-4L4 16zM14 6l4 4"/>',
    shuffle:'<path d="M2 5h3c4 0 8 14 12 14h4m-3-3 3 3-3 3M2 19h3c1.5 0 3-2 4-4m5-7c1.1-1.8 2-3 4-3h3m-3-3 3 3-3 3"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 2v6m8-6v6"/>'
  };
  const icon = key => '<svg class="ico" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'+(paths[key] || paths.star)+'</svg>';
  document.querySelectorAll('[data-icon]').forEach(node => node.replaceWith(document.createRange().createContextualFragment(icon(node.dataset.icon))));
  const SAVE = 'wgw.nonsense-engine.run.v1', RECORD = 'wgw.nonsense-engine.record.v1';
  function getStored(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
  function putStored(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
  const saved = getStored(SAVE);
  let s = E.canResume(saved) ? saved : E.newRun();
  const storedProfile = getStored(RECORD) || {};
  const profile = {wins:Number(storedProfile.wins)||0, best:Number(storedProfile.best)||0, played:Array.isArray(storedProfile.played)?storedProfile.played.filter(id=>Object.hasOwn(E.cards,id)):[]};
  let savedOK = true, dialog = '', focusOrigin = null, pendingDifficulty = s.difficulty, effectTimer = 0;
  const roman = ['I','II','III'];
  const alternate = new Set(['ferret_drop','jo_chair','arthur_precedent','spyro_crowd','tilly_matinee','trixie_warrant','dexter_umbrella','daisy_tin','jo_double','arthur_recess','dexter_patience','tilly_purr','daisy_crumbs','spyro_flaps']);
  const portrait = c => asset('art/crew/'+c.art+(alternate.has(c.id)?'-2':'')+'.webp');
  const actorFiles = {};
  const actor = id => asset('art/actors/'+(actorFiles[id] || id)+'.webp');
  const kindIcon = kind => ({attack:'sword',guard:'shield',rally:'bolt',battle:'sword',elite:'bolt',event:'mug',boss:'crown'}[kind]||'star');
  const actNo = n => roman[n-1] || n;
  const pad = n => String(n).padStart(2,'0');
  const button = (action,label,style='secondary',index) => '<button class="'+style+'" data-action="'+action+'"'+(index!==undefined?' data-i="'+index+'"':'')+'>'+label+'</button>';
  function persist() {
    if ((s.phase==='won'||s.phase==='lost')&&!s.recorded) {
      if (s.phase==='won') profile.wins++;
      s.recorded=true;
    }
    profile.best=Math.max(profile.best,s.casesWon);
    savedOK=putStored(SAVE,s);
    putStored(RECORD,profile);
  }
  function music() {
    const scene = s.phase==='battle' ? s.enemy.kind : ({reward:'reward',route:'route',event:'route',upgrade:'route',won:'victory',lost:'defeat'}[s.phase]||'menu');
    A.setScene(scene);
  }
  function refreshSoundIcon() { $('soundButton').innerHTML=icon(A.getSettings().muted?'mute':'volume'); }
  function crewPanel(foe,battle) {
    const hp=foe?s.enemy.hp:s.hp, max=foe?s.enemy.maxHp:s.maxHp;
    const intent=battle&&foe?E.intent(s):null;
    const statuses=foe?[[s.enemy.block,'Block'],[s.enemy.mark,'Mark'],[s.enemy.weak,'Weaken'],[s.enemy.power,'Power']]:[[s.block,'Block'],[s.strength,'Power']];
    const plate='<div class="fighter-hud"><div class="fighter-name"><span>'+esc(foe?s.enemy.name:'The Quill Crew')+'</span><span class="hp-nums">'+icon('heart')+hp+'/'+max+'</span></div><div class="hp-track" role="meter" aria-label="'+(foe?'Opponent':'Crew')+' health" aria-valuenow="'+hp+'" aria-valuemin="0" aria-valuemax="'+max+'"><b style="width:'+Math.max(0,Math.min(100,100*hp/max))+'%"></b></div></div>';
    return '<div class="duellist '+(foe?'foe':'crew')+'"><div class="sprite-wrap"><img draggable="false" class="sprite" src="'+actor(foe?s.enemy.id:'hero')+'" alt="'+esc(foe?s.enemy.name:'Terry with Arthur in his wizard hat')+'">'+(intent?'<span class="foe-intent" title="'+esc(intent.name)+' on end turn">'+icon(kindIcon(intent.kind))+esc(intent.label)+'</span>':'')+'<div class="status-pips">'+(battle?statuses.filter(x=>x[0]>0).map(x=>'<span>'+x[0]+' '+x[1]+'</span>').join(''):'')+'</div></div>'+plate+'</div>';
  }
  function stage() {
    const route=s.phase==='route', act=route?s.nextAct:s.act, step=route?s.nextStep:s.step;
    const battle=s.phase==='battle';
    $('stage').dataset.act=act;
    $('actLabel').textContent='ACT '+actNo(act)+'   /   '+E.acts[act-1];
    $('venueName').textContent=route?'Choose your route':s.venue;
    $('turnLabel').textContent=battle?'Turn '+pad(s.turn):'Stop '+pad(step)+' / 04';
    $('inkTotal').innerHTML=icon('ink')+s.ink+' <span class="ink-word">Ink</span>';
    if(battle) $('duellists').innerHTML=crewPanel(false,true)+crewPanel(true,true)+'<span class="versus" aria-hidden="true">VS</span>';
    else {
      const title={reward:'Case dismissed!',route:'Next stop',event:'Tea break',upgrade:'Workshop',won:'Motion carried!',lost:'Overruled!'}[s.phase];
      $('duellists').innerHTML=crewPanel(false,false)+(s.phase==='reward'||s.phase==='lost'||s.phase==='won'?crewPanel(true,false):'')+'<div class="story-emblem">'+title+'</div>';
    }
  }
  function playingCard(value,index,action) {
    const c=E.card(value), playable=action!=='play'||E.canPlay(s,index);
    const name=c.name+(value.level?' +':'');
    const label=(action==='play'?'Play ':'Draft ')+name+', '+c.owner+', costs '+c.cost+'. '+c.text;
    return '<button class="card '+c.type.toLowerCase()+'" data-action="'+action+'" data-i="'+index+'" aria-label="'+esc(label)+'" title="'+esc(c.flavour)+'"'+(!playable?' disabled':'')+'><span class="card-art"><img src="'+portrait(c)+'" alt="" draggable="false"><span class="card-kind">'+esc(c.type)+'</span></span><span class="cost" aria-hidden="true">'+c.cost+'</span><span class="card-copy"><span class="card-name">'+esc(name)+'</span><span class="card-text">'+esc(c.text)+'</span><span class="card-by">'+icon('star')+esc(c.owner)+(action==='reward'?' · '+c.rarity:'')+'</span></span></button>';
  }
  function battleTable() {
    const hype = [0,1,2].map(n=>'<b class="'+(s.hype>n?'full':'')+'"></b>').join('');
    const hint = s.lastOwner ? 'Last played by '+s.lastOwner : 'Play a card · Switch crew for Hype';
    return '<div class="table-top"><div class="group"><div class="energy-meter">'+icon('bolt')+'<span class="section-label">Energy</span><strong>'+s.energy+'<i> / '+s.maxEnergy+'</i></strong></div><div class="hype-meter" title="Switch crew members to earn Hype. At 3, gain a card and energy." aria-label="'+s.hype+' of 3 Hype"><span class="section-label">Hype</span><span class="pips">'+hype+'</span></div></div><div class="group">'+button('deck',icon('cards')+'<span class="wide">Deck</span> '+s.deck.length,'small-action')+button('end','End turn '+icon('next'),'primary')+'</div></div><div class="hand-zone"><div class="hand-line"><h3 id="handTitle" tabindex="-1">Your hand</h3><span class="micro">'+icon('shuffle')+esc(hint)+'</span></div><div class="hand">'+(s.hand.map((c,i)=>playingCard(c,i,'play')).join('')||'<p class="empty-hand">Hand empty. End your turn to draw five.</p>')+'</div><div class="pile-strip"><div>'+button('draw',icon('pile')+'Draw '+s.draw.length,'')+button('discard',icon('discard')+'Discard '+s.discard.length,'')+'</div><p>'+esc(s.turn===1&&s.stats.cardsPlayed===0?'“One ticket. Eleven passengers.”':s.log[0]||'')+'</p></div></div>';
  }
  function choice(action,index,label,description,kind,category,disabled) {
    return '<button class="choice" data-action="'+action+'" data-i="'+index+'"'+(disabled?' disabled':'')+'><span class="choice-meta">'+icon(kindIcon(kind))+' '+esc(category)+'</span><strong>'+esc(label)+'</strong><small>'+esc(description)+'</small></button>';
  }
  const intro = (tag,title,desc='') => '<div class="result-intro"><div><div class="eyebrow">'+esc(tag)+'</div><h3 id="handTitle" tabindex="-1">'+esc(title)+'</h3></div>'+(desc?'<p>'+esc(desc)+'</p>':'')+'</div>';
  function resultTable() {
    let html='';
    if(s.phase==='reward') {
      html=intro('Case closed   /   +'+s.rewardInk+' Ink','Draft a card','Take one for your deck, or keep it lean.');
      if(s.rewardRelic)html+='<p class="relic-callout">'+icon('crown')+' '+esc(s.rewardRelic.name)+' · '+esc(s.rewardRelic.text)+'</p>';
      html+='<div class="choice-grid cards-three">'+s.reward.map((v,i)=>playingCard(v,i,'reward')).join('')+'</div><div class="buttons">'+button('reward','Skip this draft','secondary',-1)+button('deck','Inspect deck','secondary')+'</div>';
    } else if(s.phase==='route') {
      html=intro('Act '+actNo(s.nextAct)+'   /   Stop '+s.nextStep+' of 4','Pick the next stop','Crew HP '+s.hp+' / '+s.maxHp+'   ·   '+s.ink+' Ink');
      html+='<div class="choice-grid">'+s.routes.map((r,i)=>choice('route',i,r.name,r.description,r.kind,r.kind==='battle'?'Encounter':r.kind)).join('')+'</div>';
    } else if(s.phase==='event') {
      html=intro('Pier services',s.event.name)+'<p class="event-text">'+esc(s.event.text)+'</p><div class="choice-grid">'+s.event.choices.map((r,i)=>choice('event',i,r.label,r.description,'event','Service',r.disabled)).join('')+'</div>';
    } else if(s.phase==='upgrade') {
      html=intro('Permanent for this run','Amend a card','Pick a card to upgrade for '+s.upgradeCost+' Ink.')+'<div class="choice-grid upgrade-grid">'+s.deck.map((v,i)=>v.level?'':choice('upgrade',i,E.card(v).name+' +',E.previewUpgrade(v).text,'event',E.card(v).owner)).join('')+'</div><div class="buttons">'+button('upgrade','Back to services','secondary',-1)+'</div>';
    } else {
      html=intro(s.phase==='won'?'The committee has adjourned':'Case closed',s.phase==='won'?'The crew takes the pier':'The committee wins this one')+'<p>'+s.casesWon+' cases won · '+s.stats.cardsPlayed+' cards played · '+s.stats.encores+' Encores · '+esc(E.difficulties[s.difficulty])+'</p><div class="buttons">'+button('new','Deal a new run','primary')+button('retry','Replay this seed')+button('collection','Card collection')+'</div>';
    }
    return '<div class="result-zone">'+html+'</div>';
  }
  function render() {
    const oldHand=document.querySelector('.hand'), scroll=oldHand?.scrollLeft||0;
    stage(); $('tableArea').innerHTML=s.phase==='battle'?battleTable():resultTable();
    const hand=document.querySelector('.hand'); if(hand){hand.classList.toggle('long-hand',s.hand.length>5);hand.scrollLeft=scroll;}
    $('stage').dataset.phase=s.phase;
    refreshSoundIcon(); music();
  }
  function announce(text) { $('announce').textContent=text; }
  function impact(text,side,animation) {
    clearTimeout(effectTimer);
    const st=$('stage'), el=$('impact');
    st.classList.remove('turn-anim','card-anim','hurt','enemy-hurt');
    el.classList.remove('pop'); void el.offsetWidth;
    if(animation)st.classList.add(...animation.split(' '));
    el.style.left=side==='crew'?'24%':side==='centre'?'42%':'70%'; el.textContent=text; el.classList.add('pop');
    effectTimer=setTimeout(()=>{el.textContent='';st.classList.remove('turn-anim','card-anim','hurt','enemy-hurt');},660);
  }
  function kineticEffect(kind, side) {
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const layer=$('battleFlash');
    layer.replaceChildren();
    const colours=kind==='guard'?['#b9f3dd','#73d6d2','#fff5c9']:['#ffd154','#fff0bb','#eb7867'];
    if(kind==='strike'||kind==='reply'){
      const shot=document.createElement('i');
      shot.className='shot-fx '+(kind==='reply'?'return-ticket':'brush-stroke');
      layer.append(shot);
      shot.addEventListener('animationend',()=>shot.remove(),{once:true});
    }
    const x=side==='crew'?25:side==='centre'?50:75;
    for(let n=0;n<10;n++){
      const fleck=document.createElement('i'),angle=(n*36+12)*Math.PI/180;
      fleck.className='fleck';fleck.style.left=x+'%';
      fleck.style.setProperty('--dx',Math.cos(angle)*(32+n%3*14)+'px');
      fleck.style.setProperty('--dy',Math.sin(angle)*(20+n%4*8)+'px');
      fleck.style.setProperty('--tilt',n*39+'deg');
      fleck.style.backgroundColor=colours[n%3];
      layer.append(fleck);fleck.addEventListener('animationend',()=>fleck.remove(),{once:true});
    }
  }
  function perform(action,index) {
    const before={hp:s.hp,enemyHP:s.enemy.hp,encores:s.stats.encores,block:s.block,phase:s.phase};
    const c=action==='play'?E.card(s.hand[index]):null;
    const move=action==='end'?E.intent(s):null;
    const methods={play:E.play,end:E.endTurn,reward:E.chooseReward,route:E.chooseRoute,event:E.chooseEvent,upgrade:E.upgrade};
    if(!methods[action](s,index))return;
    if(c&&!profile.played.includes(c.id))profile.played.push(c.id);
    persist(); render();
    let summary=s.log[0]||'';
    if(action==='play') {
      const damage=before.enemyHP-s.enemy.hp,block=Math.max(0,s.block-before.block);
      if(s.stats.encores>before.encores) { A.fx('combo'); impact('ENCORE!','centre','card-anim'); }
      else if(damage>0) { A.fx('hit'); impact('−'+damage,'foe','card-anim hurt'); }
      else if(block>0) { A.fx('block'); impact('+'+block+' BLOCK','crew','card-anim'); }
      else { A.fx('play'); impact(c.type.toUpperCase(),'crew','card-anim'); }
      kineticEffect(damage?'strike':block?'guard':'combo',damage?'foe':block?'crew':'centre');
      summary=c.name+'. '+s.energy+' energy. '+s.enemy.hp+' enemy HP.';
    } else if(action==='end') {
      const lost=before.hp-s.hp, blocked=move.kind==='attack'&&lost===0;
      A.fx(blocked?'block':'enemy'); impact(lost?'−'+lost:blocked?'BLOCKED':move.label.toUpperCase(),move.kind==='attack'?'crew':'foe',lost?'turn-anim enemy-hurt':'turn-anim');
      kineticEffect(move.kind==='attack'?'reply':'guard',move.kind==='attack'?'crew':'foe');
      summary=move.name+'. '+s.hp+' crew HP. Turn '+s.turn+'.';
    } else A.fx(action==='upgrade'&&index>=0?'upgrade':action==='reward'?'draw':'click');
    if(before.phase!==s.phase) {
      if(s.phase==='reward')A.fx('reward'); else if(s.phase==='won')A.fx('win'); else if(s.phase==='lost')A.fx('lose');
      summary+=' '+$('handTitle').textContent+'.';
      $('handTitle').focus({preventScroll:true});
    }
    announce(summary);
  }
  function deckRows(cards, orderByName=false) {
    const list=cards.map(E.card);
    if(orderByName)list.sort((a,b)=>a.name.localeCompare(b.name));
    return '<ul class="deck-list">'+list.map(c=>'<li><img alt="" src="'+portrait(c)+'"><div><b>'+esc(c.name)+(c.level?' +':'')+'</b><small>'+esc(c.owner)+' · '+esc(c.text)+'</small></div><span class="deck-cost">'+icon('bolt')+c.cost+'</span></li>').join('')+'</ul>';
  }
  function menuMarkup() {
    const relics=s.relics.map(r=>esc(r.name)+' — '+esc(r.text)).join('<br>');
    return '<p>'+esc(E.difficulties[s.difficulty])+' · Act '+actNo(s.act)+' · '+s.casesWon+' cases won</p><p class="fine">Case file '+esc(s.seed)+' · '+(savedOK?'Progress saves after every move on this browser.':'Storage is unavailable in this browser. Keep this page open to continue.')+'</p><div class="buttons">'+button('close','Resume','primary')+button('new','New run')+button('collection','Card collection')+button('help','How to play')+'</div>'+(relics?'<h3>Relics</h3><p>'+relics+'</p>':'')+'<hr><p class="fine">William George &amp; Terrance Quill (AI collaborator). Crew artwork from <i>The Magnificent Nonsense</i> and the William George Works portrait series. Original game illustrations and adaptive score.</p>';
  }
  function mapMarkup() {
    return E.acts.map((name,i)=>{
      const stops=s.routeHistory.filter(r=>r.act===i+1);
      return '<div class="map-row '+(i===s.act-1?'active':'')+'"><strong>'+actNo(i+1)+'</strong><div><b>'+esc(name)+'</b><small>'+esc(stops.length?stops.map(r=>r.name).join(' · '):'Four stops. The fourth is a boss hearing.')+'</small></div></div>';
    }).join('')+'<p class="fine">After each stop, choose a destination. Elite hearings pay more Ink and offer a rare card.</p>';
  }
  function showDialog(name,keepFocus=false) {
    if(!dialog)focusOrigin=document.activeElement;
    const panel=$('overlay');
    dialog=name;
    let title='',html='';
    if(name==='menu'){title='The case file';html=menuMarkup();}
    if(name==='help'){
      title='How to play';
      html='<p>Get Ferret, Jo, six cats and three Quills past the Ministry of Nonsense. Each act has four stops. Defeat the boss at the fourth to advance.</p><h3>Your turn</h3><p>Read the opponent’s next move in the speech bubble. Click a card to play it immediately. Its yellow number is its energy cost. Block absorbs incoming damage for one turn.</p><h3>Earn an Encore</h3><p>The first card earns one Hype. Switch to a different crew member to earn another. Every three Hype gives you one energy and draws a card. The chain carries across turns.</p><h3>Build the deck</h3><p>End your turn to face their move, refill your energy and draw five. Your discard gets shuffled when the draw pile runs out. Win fights to draft cards. Spend Ink at services and collect relics from bosses.</p><p class="fine">Keyboard: 1–8 plays a hand card. E ends the turn. D opens the deck. Escape closes a panel. On a phone, swipe across your hand.</p><div class="buttons">'+button('close','Back to the pier','primary')+'</div>';
    }
    if(['deck','draw','discard'].includes(name)){
      title={deck:'Your deck',draw:'Draw pile',discard:'Discard pile'}[name];
      const cards=s[name]; html='<p class="fine">'+cards.length+' card'+(cards.length===1?'':'s')+(name==='draw'?' · Listed alphabetically. Draw order is hidden.':'')+'</p>'+deckRows(cards,name!=='discard');
      if(!cards.length)html+='<p>No cards in this pile.</p>';
    }
    if(name==='map'){title='Run map';html=mapMarkup();}
    if(name==='log'){title='Case log';html='<ol class="log-list">'+s.log.map(line=>'<li>'+esc(line)+'</li>').join('')+'</ol>';}
    if(name==='collection'){
      title='Card collection';
      html='<p>'+profile.played.length+' / '+Object.keys(E.cards).length+' cards played · '+profile.wins+' winning runs · Best run '+profile.best+' cases</p>'+deckRows(profile.played.map(id=>({id,level:0})),true);
      if(!profile.played.length)html+='<p class="fine">Play a card to enter it in your collection.</p>';
    }
    if(name==='sound'){
      title='Sound desk';const audio=A.getSettings();
      html='<p>Original pier-organ hooks, swung breaks and a 174 BPM battle score.</p><div class="setting-row"><label for="volumeInput">Volume</label><input id="volumeInput" type="range" min="0" max="100" value="'+Math.round(audio.volume*100)+'"><output id="volumeValue">'+Math.round(audio.volume*100)+'%</output></div><div class="buttons">'+button('mute',icon(audio.muted?'volume':'mute')+(audio.muted?'Switch sound on':'Mute sound'),'secondary')+'</div>';
    }
    if(name==='new'||name==='retry'){
      title=name==='retry'?'Replay this case':'Open a new case';
      const active=!['won','lost'].includes(s.phase);
      html='<p>'+(active?'Starting a new case replaces the current run. Your card collection and records carry over.':'Pick a difficulty and deal the crew in.')+'</p><div class="setting-row"><label for="difficulty">Difficulty</label><select id="difficulty">'+E.difficulties.map((n,i)=>'<option value="'+i+'"'+(i===pendingDifficulty?' selected':'')+'>'+esc(n)+'</option>').join('')+'</select></div><div class="buttons">'+(name==='retry'?button('start-same','Replay '+esc(s.seed),'primary'):button('start-fresh',icon('shuffle')+'Random case','primary')+button('start-daily',icon('calendar')+'Daily case'))+button('close','Back')+'</div><p class="fine">'+(name==='retry'?'The same seed reproduces the same draws and choices on the same difficulty.':'The daily case uses one shared seed per UTC date. A random case deals a fresh seed every time.')+'</p>';
    }
    if(!title)return;
    panel.innerHTML='<section class="sheet" role="dialog" aria-modal="true" aria-labelledby="dialogTitle"><div class="sheet-head"><h2 id="dialogTitle">'+esc(title)+'</h2>'+button('close',icon('close')+'<span class="sr-only">Close panel</span>','dialog-close')+'</div>'+html+'</section>';
    panel.hidden=false; $('cabinet').inert=true;
    const focusButton=keepFocus?panel.querySelector('[data-action="mute"]'):panel.querySelector('.dialog-close');
    focusButton?.focus({preventScroll:true});
  }
  function closeDialog() {
    const panel=$('overlay');dialog='';panel.hidden=true;panel.innerHTML='';$('cabinet').inert=false;
    if(focusOrigin?.isConnected)focusOrigin.focus({preventScroll:true});else $('handTitle')?.focus({preventScroll:true});
  }
  function handleAction(action,index) {
    if(['play','end','reward','route','event','upgrade'].includes(action)){perform(action,index);return;}
    if(action==='close'){closeDialog();return;}
    if(action==='mute'){A.toggleMute();refreshSoundIcon();showDialog('sound',true);return;}
    if(['start-same','start-fresh','start-daily'].includes(action)) {
      const seed=action==='start-same'?s.seed:action==='start-daily'?'DAILY-'+new Date().toISOString().slice(0,10):undefined;
      s=E.newRun(seed,pendingDifficulty);closeDialog();persist();render();A.fx('draw');announce('New run. St Annes Pier. Your turn.');return;
    }
    if(action==='new'||action==='retry')pendingDifficulty=s.difficulty;
    A.fx('click');showDialog(action);
  }
  document.addEventListener('click',event=>{
    const b=event.target.closest('[data-action]');
    if(b&&!b.disabled){A.start();handleAction(b.dataset.action,Number(b.dataset.i));}
    else if(event.target===$('overlay'))closeDialog();
  });
  document.addEventListener('input',event=>{
    if(event.target.id==='volumeInput'){A.setVolume(Number(event.target.value)/100);$('volumeValue').textContent=event.target.value+'%';}
    if(event.target.id==='difficulty')pendingDifficulty=Number(event.target.value);
  });
  document.addEventListener('keydown',event=>{
    if(dialog){
      if(event.key==='Escape'){event.preventDefault();closeDialog();}
      if(event.key==='Tab'){
        const targets=[...$('overlay').querySelectorAll('button:not([disabled]),input,select,a[href]')];
        if(event.shiftKey&&document.activeElement===targets[0]){event.preventDefault();targets.at(-1)?.focus();}
        else if(!event.shiftKey&&document.activeElement===targets.at(-1)){event.preventDefault();targets[0]?.focus();}
      }
      return;
    }
    if(event.repeat||event.altKey||event.ctrlKey||event.metaKey)return;
    if(s.phase==='battle'&&/^[1-8]$/.test(event.key)) {event.preventDefault();A.start();perform('play',Number(event.key)-1);}
    else if(s.phase==='battle'&&event.key.toLowerCase()==='e'){event.preventDefault();A.start();perform('end',0);}
    else if(event.key.toLowerCase()==='d'){event.preventDefault();A.start();showDialog('deck');}
    else if(event.key==='Escape'){showDialog('menu');}
  });
  persist();render();
})();

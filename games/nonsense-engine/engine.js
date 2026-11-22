/* The Nonsense Engine. All gameplay state is plain JSON, including its PRNG. */
(function (root) {
  "use strict";

  const VERSION = 1;
  const acts = ["Trouble on the Pier", "The Borough Objects", "The Ministry of Nonsense"];
  const crew = ["Ferret", "Jo", "Terry", "Reggie", "Kenneth", "Arthur", "Spyro", "Tilly", "Trixie", "Dexter", "Daisy"];
  const difficulties = ["Standard", "After Hours", "Public Inquiry"];
  const maxHand = 8;

  // Each effect records its value at normal and upgraded level.
  const cardBook = {};
  function register(id, name, owner, cost, type, rarity, flavour, effects) {
    cardBook[id] = { id, name, owner, cost, type, rarity, flavour, effects };
  }
  register("ferret_flick", "Fly-Tip", "Ferret", 1, "Attack", "Common",
    "A perfect cast. Wrong side of the railings.", [["hit", 7, 10]]);
  register("jo_order", "Point of Order", "Jo", 1, "Guard", "Common",
    "Put that down. Both of you.", [["block", 7, 10]]);
  register("terry_invoice", "Imaginary Invoice", "Terry", 1, "Attack", "Common",
    "There's an extra tenner for the Y.", [["hit", 5, 7], ["mark", 3, 4]]);
  register("arthur_gavel", "Order in Court", "Arthur", 2, "Attack", "Uncommon",
    "His Honour would like his cushion back.", [["hit", 13, 17], ["block", 4, 6]]);
  register("kenneth_racket", "Kick Up a Racket", "Kenneth", 0, "Trick", "Common",
    "Kenneth has requested a louder complaints procedure.", [["hit", 2, 4], ["draw", 1, 1]]);
  register("reggie_redpen", "Red Pen", "Reggie", 1, "Attack", "Common",
    "Your threat would benefit from a second draft.", [["hit", 5, 7], ["weak", 3, 4]]);
  register("spyro_box", "Box Clever", "Spyro", 1, "Guard", "Common",
    "Officially, it's a very small fortified residence.", [["block", 5, 7], ["mark", 3, 4]]);
  register("tilly_quiet", "A Quiet Word", "Tilly", 1, "Guard", "Common",
    "She's been sitting on the paperwork since Tuesday.", [["block", 5, 7], ["draw", 1, 1]]);
  register("trixie_inspect", "Cushion Inspection", "Trixie", 1, "Attack", "Common",
    "A tiny hole, almost exactly the shape of a claw.", [["hit", 5, 7], ["intercept", 4, 6]]);
  register("dexter_geese", "Mind the Geese", "Dexter", 1, "Attack", "Common",
    "After you, sir. And all of your enormous relatives.", [["hit", 5, 8], ["block", 4, 5]]);
  register("daisy_levy", "Biscuit Levy", "Daisy", 0, "Trick", "Common",
    "One for the tin, two for the inspector.", [["block", 3, 5], ["mark", 2, 3]]);
  register("ferret_drop", "Drop the Bass", "Ferret", 2, "Attack", "Rare",
    "Half the pier just changed postcode.", [["chainHit", 11, 15]]);
  register("jo_chair", "Chair's Decision", "Jo", 1, "Guard", "Uncommon",
    "Motion carried. So was the chair.", [["block", 8, 11], ["weak", 4, 6]]);
  register("terry_warranty", "Extended Warranty", "Terry", 1, "Guard", "Uncommon",
    "Covers everything except the thing that's broken.", [["block", 7, 10], ["heal", 2, 3]]);
  register("reggie_clause", "Clause Twenty", "Reggie", 1, "Trick", "Rare",
    "The Anti-Bollocks Clause is hereby invoked.", [["mark", 6, 9], ["draw", 2, 2]]);
  register("kenneth_feedback", "Feedback Loop", "Kenneth", 1, "Attack", "Uncommon",
    "A wholly unnecessary second loudhailer.", [["double", 5, 7]]);
  register("arthur_precedent", "Binding Precedent", "Arthur", 1, "Power", "Rare",
    "A binding precedent is a cat asleep on your sleeve.", [["strength", 2, 3]]);
  register("spyro_crowd", "Crowd the Box", "Spyro", 0, "Trick", "Uncommon",
    "The capacity was one. That was more of a guideline.", [["mark", 4, 6], ["hype", 1, 1]]);
  register("tilly_matinee", "Quiet Matinée", "Tilly", 1, "Guard", "Uncommon",
    "Tilly has removed the batteries from the organ.", [["block", 6, 9], ["weak", 3, 5]]);
  register("trixie_warrant", "Search Warrant", "Trixie", 1, "Attack", "Uncommon",
    "You're harbouring an unlicensed feather.", [["hit", 7, 10], ["draw", 1, 1]]);
  register("dexter_umbrella", "Courtesy Brolly", "Dexter", 1, "Guard", "Uncommon",
    "You're welcome to the handle. He needs the top.", [["guardHit", 4, 6]]);
  register("daisy_tin", "The Emergency Tin", "Daisy", 1, "Trick", "Rare",
    "In case of emergency, blame the other five.", [["heal", 4, 6], ["block", 5, 7]]);
  register("ferret_rod", "Reel 'Em In", "Ferret", 1, "Attack", "Uncommon",
    "Land it first. Worry about the byelaw afterwards.", [["markedHit", 7, 10]]);
  register("jo_double", "Casting Vote", "Jo", 2, "Attack", "Rare",
    "The chair votes twice. Once with each boot.", [["double", 8, 11], ["weak", 2, 3]]);
  register("terry_spares", "Genuine Spares", "Terry", 0, "Trick", "Uncommon",
    "Genuine bits of something, certainly.", [["draw", 1, 2], ["block", 2, 3]]);
  register("reggie_margin", "Margin Notes", "Reggie", 0, "Trick", "Common",
    "He's left just enough room for the original argument.", [["mark", 3, 5], ["weak", 2, 3]]);
  register("kenneth_amp", "Borrowed Amp", "Kenneth", 1, "Power", "Rare",
    "The landlord can hear it from Preston.", [["strength", 1, 2], ["hype", 2, 2]]);
  register("arthur_recess", "Court in Recess", "Arthur", 2, "Guard", "Uncommon",
    "Proceedings resume when the sunbeam moves.", [["block", 15, 21], ["heal", 2, 3]]);
  register("trixie_stitch", "Pick a Seam", "Trixie", 0, "Attack", "Uncommon",
    "Structural integrity was never her department.", [["hit", 4, 6], ["mark", 2, 3]]);
  register("dexter_patience", "After You", "Dexter", 0, "Guard", "Common",
    "Impeccable manners. Absolutely dreadful timing.", [["block", 4, 6], ["weak", 1, 2]]);
  register("tilly_purr", "Purr Review", "Tilly", 1, "Trick", "Rare",
    "Approved in principle, subject to chin scratches.", [["draw", 2, 3], ["hype", 1, 2]]);
  register("daisy_crumbs", "Crumb Trail", "Daisy", 1, "Attack", "Uncommon",
    "All roads lead to somebody else's lunch.", [["hit", 6, 8], ["mark", 5, 7]]);
  register("spyro_flaps", "Packing Peanuts", "Spyro", 1, "Attack", "Uncommon",
    "Three hundred tiny witnesses. None reliable.", [["double", 4, 6], ["block", 3, 4]]);

  const effectText = {
    hit: n => "Deal " + n + " damage.",
    double: n => "Hit twice for " + n + ".",
    block: n => "Gain " + n + " Block.",
    mark: n => "Mark +" + n + " on the next hit.",
    weak: n => "Reduce their next attack by " + n + ".",
    draw: n => "Draw " + n + ".",
    heal: n => "Recover " + n + " HP.",
    strength: n => "All hits +" + n + " this fight.",
    hype: n => "Gain " + n + " extra Hype.",
    intercept: n => "+" + n + " damage if they intend to attack.",
    markedHit: n => "Deal " + n + ". A Marked foe takes 5 extra.",
    chainHit: n => "Deal " + n + ", plus 4 per Hype held.",
    guardHit: n => "Gain " + n + " Block, then deal damage equal to your Block."
  };
  const instance = (id, level = 0) => ({ id, level });
  const definitions = [{}, {}];
  for (const source of Object.values(cardBook)) {
    for (let level = 0; level <= 1; level++) {
      const effects = source.effects.map(([key, normal, upgraded]) => [key, level ? upgraded : normal]);
      definitions[level][source.id] = {
        ...source, art: source.owner.toLowerCase(), level, effects,
        text: effects.map(([key, amount]) => effectText[key](amount)).join(" ")
      };
    }
  }
  function card(value) {
    if (!value) return null;
    return definitions[value.level ? 1 : 0][value.id || value] || null;
  }
  function previewUpgrade(value) {
    return value ? card(instance(value.id || value, 1)) : null;
  }

  // Intent tuples carry their base value and on-screen action name.
  const A = (n, name) => ["attack", n, name];
  const G = (n, name) => ["guard", n, name];
  const R = (n, name) => ["rally", n, name];
  const foes = {};
  function foe(id, name, venue, hp, quote, pattern) {
    foes[id] = { id, name, venue, hp, quote, pattern };
  }
  foe("inspector", "The Ticket Inspector", "St Annes Pier", 27,
    "The gull punches your ticket. Then he confiscates your chips.",
    [A(6, "Punch Ticket"), G(5, "Check Counterfoil"), A(9, "On-the-Spot Fine")]);
  foe("kiosk", "Madame Exact Change", "The Change Kiosk", 55,
    "It's twenty pence for an argument. I've no change.",
    [G(6, "Close Shutter"), A(14, "Coin Roll"), A(11, "Cash Only")]);
  foe("gull", "The Chip Inspector", "The Prom Chippy", 57,
    "The gull produces a badge. The badge is a chip.",
    [A(11, "Swoop"), A(12, "Chip Seizure"), G(6, "Wheel About")]);
  foe("organist", "The End-of-Pier Organist", "The Penny Ballroom", 77,
    "Requests accepted in writing. Requests denied in B flat.",
    [A(12, "Opening Chord"), R(2, "Wind It Up"), A(18, "Full Pedal")]);
  foe("bailiff", "The Deckchair Bailiff", "The Deckchair Office", 89,
    "Possession is nine tenths of a folding chair.",
    [G(7, "Stack the Chairs"), A(17, "Repossession"), A(12, "Sit Down"), R(2, "Add Interest")]);
  foe("parking", "The Parking Oracle", "Kirkham Car Park", 82,
    "Your future contains a small yellow envelope.",
    [A(16, "Expiry Notice"), G(7, "Review Appeal"), A(21, "Double Yellow")]);
  foe("tea", "The Tea Urn Warden", "The Parish Rooms", 84,
    "For licensing purposes that biscuit constitutes a meal.",
    [G(8, "Raise Lid"), A(18, "Steamed Up"), A(16, "Slipped Saucer")]);
  foe("minute", "The Minute Taker", "The Council Annex", 86,
    "The committee has voted to remember this differently.",
    [A(14, "Strike from Record"), R(2, "Amend Minutes"), A(19, "Action Point")]);
  foe("raffle", "The Raffle Syndicate", "The Tombola Tent", 112,
    "First prize is another ticket. Same for second.",
    [A(19, "Winning Number"), G(8, "Fold Tickets"), R(3, "Roll Over"), A(23, "Jackpot")]);
  foe("mayor", "The Mayor of Minor Works", "Kirkham Town Hall", 140,
    "This ribbon is the only thing holding the precinct together.",
    [A(18, "Cut the Ribbon"), G(9, "Chain of Office"), A(26, "Civic Duty"), R(2, "Call a Quorum")]);
  foe("printer", "The Photocopier", "Ministry Print Room", 121,
    "PC LOAD BOLLOCKS.",
    [A(22, "Duplex"), G(8, "Paper Jam"), A(26, "Collate")]);
  foe("stapler", "Miss Stapleton", "The Filing Cabinet", 126,
    "You'll find your appeal securely fastened to your rejection.",
    [A(20, "Staple Twice"), R(3, "Reload"), A(26, "Industrial Staple")]);
  foe("auditor", "The Duplicate Auditor", "The Records Office", 121,
    "I'm afraid this is the original copy of the duplicate.",
    [G(9, "Make a Copy"), A(24, "Double Entry"), A(24, "File Again")]);
  foe("archive", "The Filing Centipede", "Deep Storage", 157,
    "A hundred tiny shoes stamp 'RECEIVED' in unison.",
    [A(24, "Stampede"), A(26, "Rubber Stamp"), G(11, "Interleave")]);
  foe("permanent", "The Permanent Secretary", "The Last Committee Room", 217,
    "Your application for an ending is under consideration.",
    [A(22, "Call to Order"), G(10, "Close the Agenda"), A(32, "Final Notice"), R(3, "Adjourn Forever")]);
  const encounters = [
    { regular: ["kiosk", "gull"], elite: "organist", boss: "bailiff" },
    { regular: ["parking", "tea", "minute"], elite: "raffle", boss: "mayor" },
    { regular: ["printer", "stapler", "auditor"], elite: "archive", boss: "permanent" }
  ];
  const opener = ["ferret_flick", "jo_order", "terry_invoice", "arthur_gavel", "kenneth_racket"];
  const starter = [...opener, "reggie_redpen", "spyro_box", "tilly_quiet", "trixie_inspect", "dexter_geese", "daisy_levy"];
  const relicBook = {
    bell: { id: "bell", name: "Last Orders Bell", text: "Start each fight with 1 Hype." },
    rosette: { id: "rosette", name: "Mayor's Rosette", text: "Start each fight with 5 Block." }
  };

  function hash(text) {
    let value = 2166136261;
    for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619);
    return value >>> 0 || 1;
  }
  function random(s) {
    let x = s.rng >>> 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    s.rng = x >>> 0;
    return s.rng / 4294967296;
  }
  function shuffle(s, list) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(random(s) * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }
  function pick(s, list) { return list[Math.floor(random(s) * list.length)]; }
  function note(s, text) {
    s.log.unshift(text);
    s.log.length = Math.min(30, s.log.length);
  }
  function drawCards(s, number) {
    for (let i = 0; i < number && s.hand.length < maxHand; i++) {
      if (!s.draw.length) {
        if (!s.discard.length) return;
        s.draw = shuffle(s, s.discard.splice(0));
      }
      s.hand.push(s.draw.pop());
    }
  }
  function intent(s) {
    if (!s || !s.enemy || !foes[s.enemy.id]) return null;
    const enemy = s.enemy;
    const cycle = foes[enemy.id].pattern;
    const [kind, base, name] = cycle[enemy.move % cycle.length];
    let amount = base;
    if (kind === "attack") amount = Math.max(0, base + enemy.power + s.difficulty * 3 - enemy.weak);
    if (kind === "guard") amount += s.difficulty;
    const label = { attack: "Attack ", guard: "Guard ", rally: "Power +" }[kind] + amount;
    return { kind, amount, name, label };
  }
  function startBattle(s, id, kind) {
    const source = foes[id];
    const maxHp = Math.round(source.hp * (1 + s.difficulty * 0.18));
    s.enemy = {
      id, kind, name: source.name, hp: maxHp, maxHp, quote: source.quote,
      block: 0, power: 0, weak: 0, mark: 0, move: 0
    };
    s.phase = "battle";
    s.venue = source.venue;
    s.block = s.relics.some(x => x.id === "rosette") ? 5 : 0;
    s.hype = s.relics.some(x => x.id === "bell") ? 1 : 0;
    s.strength = 0;
    s.turn = 1;
    s.energy = s.maxEnergy;
    s.lastOwner = "";
    s.hand = [];
    s.discard = [];
    s.draw = shuffle(s, s.deck.map(value => ({ ...value })));
    if (s.casesWon === 0 && id === "inspector") {
      for (const id of opener) {
        const idx = s.draw.findIndex(c => c.id === id);
        s.hand.push(s.draw.splice(idx, 1)[0]);
      }
    } else drawCards(s, 5);
    s.reward = [];
    s.event = null;
    note(s, source.name + " at " + source.venue + ".");
  }
  function newRun(seed, difficulty = 0) {
    const code = seed == null || seed === "" ?
      Math.random().toString(36).slice(2, 8).toUpperCase() : String(seed);
    const tier = Math.max(0, Math.min(2, Math.floor(Number(difficulty) || 0)));
    const s = {
      version: VERSION, seed: code, rng: hash(code), difficulty: tier,
      phase: "battle", act: 1, step: 1, turn: 1, hp: 48, maxHp: 48,
      energy: 3, maxEnergy: 3, block: 0, hype: 0, ink: 6, strength: 0, lastOwner: "",
      deck: starter.map(id => instance(id)), hand: [], draw: [], discard: [], enemy: null,
      venue: "", routes: [], routeHistory: [], nextAct: 1, nextStep: 2,
      reward: [], rewardInk: 0, rewardRelic: null, event: null, upgradeCost: 0,
      casesWon: 0, relics: [], log: [],
      stats: { damage: 0, cardsPlayed: 0, encores: 0, upgrades: 0, elites: 0, bosses: 0, turns: 0, recruits: 0, inkEarned: 0 }
    };
    startBattle(s, "inspector", "battle");
    s.routeHistory.push({ act: 1, step: 1, name: s.venue, kind: "battle" });
    return s;
  }
  function heal(s, number) { s.hp = Math.min(s.maxHp, s.hp + number); }
  function hit(s, number) {
    if (s.enemy.hp <= 0) return;
    const foe = s.enemy;
    const impact = number + s.strength + foe.mark;
    foe.mark = 0;
    const blocked = Math.min(foe.block, impact);
    foe.block -= blocked;
    const damage = Math.min(foe.hp, impact - blocked);
    foe.hp -= damage;
    s.stats.damage += damage;
  }
  function addHype(s, amount) {
    s.hype += amount;
    while (s.hype >= 3) {
      s.hype -= 3;
      s.energy++;
      drawCards(s, 1);
      s.stats.encores++;
      note(s, "Encore! +1 energy and a fresh card.");
    }
  }
  function effect(s, key, amount) {
    switch (key) {
      case "hit": hit(s, amount); break;
      case "double": hit(s, amount); hit(s, amount); break;
      case "block": s.block += amount; break;
      case "mark": s.enemy.mark += amount; break;
      case "weak": s.enemy.weak += amount; break;
      case "heal": heal(s, amount); break;
      case "draw": drawCards(s, amount); break;
      case "strength": s.strength += amount; break;
      case "hype": addHype(s, amount); break;
      case "markedHit": hit(s, amount + (s.enemy.mark > 0 ? 5 : 0)); break;
      case "chainHit": hit(s, amount + s.hype * 4); break;
      case "guardHit": s.block += amount; hit(s, s.block); break;
    }
  }
  function canPlay(s, index) {
    return s.phase === "battle" && Number.isInteger(index) && !!s.hand[index] && s.energy >= card(s.hand[index]).cost;
  }
  function play(s, index) {
    if (!canPlay(s, index)) return false;
    const value = s.hand.splice(index, 1)[0];
    const def = card(value);
    s.energy -= def.cost;
    s.stats.cardsPlayed++;
    note(s, def.owner + " played " + def.name + ".");
    for (let i = 0; i < def.effects.length; i++) {
      const [key, amount] = def.effects[i];
      // Intercepts are part of the preceding hit: Mark and strength apply once.
      if (key === "intercept") continue;
      const next = def.effects[i + 1];
      const bonus = key === "hit" && next && next[0] === "intercept" && intent(s).kind === "attack" ? next[1] : 0;
      effect(s, key, amount + bonus);
    }
    if (s.lastOwner !== def.owner) addHype(s, 1);
    s.lastOwner = def.owner;
    // The card cannot redraw itself during its own effects or Encore.
    s.discard.push(value);
    if (s.enemy.hp === 0) winFight(s);
    return true;
  }
  function endTurn(s) {
    if (s.phase !== "battle") return false;
    const move = intent(s);
    const enemy = s.enemy;
    enemy.block = 0;
    s.stats.turns++;
    if (move.kind === "attack") {
      const damage = Math.max(0, move.amount - s.block);
      s.hp = Math.max(0, s.hp - damage);
      enemy.weak = 0;
      note(s, enemy.name + " used " + move.name + ". " + (damage ? damage + " HP lost." : "Fully blocked."));
    } else if (move.kind === "guard") {
      enemy.block = move.amount;
      note(s, enemy.name + " gained " + move.amount + " Block.");
    } else {
      enemy.power += move.amount;
      note(s, enemy.name + " gained " + move.amount + " Power.");
    }
    if (s.hp === 0) {
      s.phase = "lost";
      note(s, "Case dismissed. The committee has your number.");
      return true;
    }
    enemy.move++;
    s.discard.push(...s.hand.splice(0));
    s.block = 0;
    s.energy = s.maxEnergy;
    s.turn++;
    drawCards(s, 5);
    return true;
  }

  function rewardCards(s, kind) {
    const all = Object.values(definitions[0]);
    const chosen = [];
    const assureRare = kind === "elite" || kind === "boss";
    for (let index = 0; index < 3; index++) {
      const roll = random(s);
      let rarity = roll < 0.17 ? "Rare" : roll < 0.7 ? "Uncommon" : "Common";
      if (!index && assureRare) rarity = "Rare";
      const eligible = all.filter(c => c.rarity === rarity && !chosen.some(x => x.id === c.id));
      const preferred = eligible.filter(c => !s.deck.some(x => x.id === c.id));
      const c = pick(s, preferred.length ? preferred : eligible);
      chosen.push(instance(c.id, kind === "boss" && index === 0 ? 1 : 0));
    }
    return chosen;
  }
  function winFight(s) {
    const kind = s.enemy.kind;
    s.casesWon++;
    if (kind === "elite") s.stats.elites++;
    if (kind === "boss") s.stats.bosses++;
    s.rewardInk = kind === "boss" ? 15 : kind === "elite" ? 12 : 7;
    s.ink += s.rewardInk;
    s.stats.inkEarned += s.rewardInk;
    s.rewardRelic = null;
    note(s, s.enemy.name + " defeated. +" + s.rewardInk + " Ink.");
    if (kind === "boss" && s.act === 3) {
      s.phase = "won";
      note(s, "The last committee has adjourned. The pier belongs to the crew.");
      return;
    }
    if (kind === "boss") {
      const relic = relicBook[s.act === 1 ? "bell" : "rosette"];
      s.relics.push({ ...relic });
      s.rewardRelic = { ...relic };
      heal(s, 8);
      note(s, "A restorative brew (up to 8 HP) and " + relic.name + ".");
    }
    s.phase = "reward";
    s.reward = rewardCards(s, kind);
  }
  function chooseReward(s, index) {
    if (s.phase !== "reward" || !Number.isInteger(index) || index < -1 || index >= s.reward.length) return false;
    if (index >= 0) {
      const gained = { ...s.reward[index] };
      s.deck.push(gained);
      s.stats.recruits++;
      note(s, card(gained).name + " joined your deck.");
    }
    s.reward = [];
    makeRoutes(s);
    return true;
  }
  function battleRoute(id, kind) {
    const foe = foes[id];
    const prize = kind === "elite" ? "12 Ink and a rare draft." : kind === "boss" ? "Win the hearing." : "7 Ink and a card draft.";
    return { id, kind, name: foe.venue, description: foe.name + ". " + prize };
  }
  const stops = {
    cafe: { id: "cafe", kind: "event", name: "Jo's Tea Stall", description: "A brew, a quiet word and a chance to recover HP." },
    shed: { id: "shed", kind: "event", name: "Terry's Repair Shed", description: "Upgrade a card or patch yourself up." },
    arcade: { id: "arcade", kind: "event", name: "The Penny Arcade", description: "Trade Ink for a prize, or take an honest shift." },
    tent: { id: "tent", kind: "event", name: "Arthur's Chambers", description: "Improve a card or accept a judicial nap." }
  };
  function makeRoutes(s) {
    const newAct = s.step === 4;
    s.nextAct = s.act + (newAct ? 1 : 0);
    s.nextStep = newAct ? 1 : s.step + 1;
    const table = encounters[s.nextAct - 1];
    const normals = shuffle(s, table.regular.slice());
    if (s.nextStep === 4) s.routes = [battleRoute(table.boss, "boss")];
    else if (s.nextStep === 3) {
      s.routes = [ { ...stops[pick(s, ["tent", "shed"])] }, battleRoute(normals[0], "battle") ];
    } else if (s.nextStep === 2) {
      s.routes = [ { ...stops[pick(s, ["cafe", "arcade"])] }, battleRoute(table.elite, "elite") ];
    } else s.routes = normals.slice(0, 2).map(id => battleRoute(id, "battle"));
    s.phase = "route";
  }
  function chooseRoute(s, index) {
    if (s.phase !== "route" || !Number.isInteger(index) || !s.routes[index]) return false;
    const route = s.routes[index];
    s.act = s.nextAct;
    s.step = s.nextStep;
    s.routes = [];
    s.routeHistory.push({ act: s.act, step: s.step, name: route.name, kind: route.kind });
    if (route.kind === "event") startEvent(s, route.id);
    else startBattle(s, route.id, route.kind);
    return true;
  }
  const option = (id, label, description, disabled = false) => ({ id, label, description, disabled });
  function startEvent(s, id) {
    s.phase = "event";
    s.venue = stops[id].name;
    const service = (cost, label) => option("upgrade", label,
      (cost ? cost + " Ink. " : "") + "Permanently improve a card in this run.",
      s.ink < cost || s.deck.every(c => c.level > 0));
    let text, choices;
    if (id === "cafe") {
      text = "Jo puts two mugs on the counter. One says TEA. The other says ALSO TEA in distinctly shakier handwriting.";
      choices = [option("brew", "Have a proper brew", "Recover 10 HP."), option("shift", "Cover Jo's break", "Earn 8 Ink.")];
    } else if (id === "arcade") {
      text = "Daisy is inside the prize machine. She has eaten the instructions and appointed herself management.";
      choices = [option("rare", "Claim a prize", "Spend 9 Ink for a random rare card.", s.ink < 9), option("shift", "Unjam the machine", "Earn 8 Ink.")];
    } else if (id === "tent") {
      text = "Arthur recognises your right to remain horizontal. His clerk also has a red pen and five minutes to spare.";
      choices = [service(4, "Request an amendment"), option("rest", "Take a judicial nap", "Recover 12 HP.")];
    } else {
      text = "Terry unrolls a velvet pouch containing one screwdriver, a spoon and a receipt for a considerably better screwdriver.";
      choices = [service(4, "Tune a card"), option("rest", "Patch up the crew", "Recover 12 HP.")];
    }
    s.event = { id, name: s.venue, text, choices };
    note(s, "Stopped at " + s.venue + ".");
  }
  function chooseEvent(s, index) {
    if (s.phase !== "event" || !Number.isInteger(index) || !s.event || !s.event.choices[index]) return false;
    const choice = s.event.choices[index];
    if (choice.disabled) return false;
    if (choice.id === "upgrade") {
      if (s.ink < 4 || s.deck.every(c => c.level > 0)) return false;
      s.upgradeCost = 4;
      s.phase = "upgrade";
      return true;
    }
    if (choice.id === "brew" || choice.id === "rest") {
      const before = s.hp;
      heal(s, choice.id === "brew" ? 10 : 12);
      note(s, "Recovered " + (s.hp - before) + " HP.");
    } else if (choice.id === "shift") {
      s.ink += 8;
      s.stats.inkEarned += 8;
      note(s, "A rare honest shift. Earned 8 Ink.");
    } else if (choice.id === "rare") {
      if (s.ink < 9) return false;
      s.ink -= 9;
      const reward = pick(s, Object.values(definitions[0]).filter(c => c.rarity === "Rare"));
      s.deck.push(instance(reward.id));
      s.stats.recruits++;
      note(s, "Prize claimed: " + reward.name + ".");
    }
    s.event = null;
    makeRoutes(s);
    return true;
  }
  function upgrade(s, index) {
    if (s.phase !== "upgrade" || !Number.isInteger(index)) return false;
    if (index === -1) { s.phase = "event"; return true; }
    if (!s.deck[index] || s.deck[index].level > 0 || s.ink < s.upgradeCost) return false;
    s.ink -= s.upgradeCost;
    s.deck[index].level = 1;
    s.stats.upgrades++;
    note(s, card(s.deck[index]).name + " upgraded.");
    s.event = null;
    makeRoutes(s);
    return true;
  }
  function canResume(s) {
    const phases = ["battle", "reward", "route", "event", "upgrade", "won", "lost"];
    if (!s || s.version !== VERSION || !phases.includes(s.phase) ||
        !Number.isInteger(s.act) || s.act < 1 || s.act > 3 ||
        !Number.isInteger(s.step) || s.step < 1 || s.step > 4 ||
        !Number.isInteger(s.rng) || !Number.isFinite(s.hp) || !s.stats ||
        !Array.isArray(s.deck) || !s.deck.length || !Array.isArray(s.routes) ||
        !Array.isArray(s.relics) || !Array.isArray(s.log) || !Array.isArray(s.routeHistory)) return false;
    if (![s.deck, s.hand, s.draw, s.discard, s.reward].every(pile => Array.isArray(pile) &&
      pile.every(c => c && Object.hasOwn(cardBook, c.id) && (c.level === 0 || c.level === 1)))) return false;
    if (s.phase === "route" && !s.routes.length) return false;
    if (s.phase === "reward" && !s.reward.length) return false;
    if (["event", "upgrade"].includes(s.phase) && (!s.event || !Array.isArray(s.event.choices))) return false;
    return !!s.enemy && Object.hasOwn(foes, s.enemy.id);
  }
  const api = {
    version: VERSION, cards: definitions[0], opponents: foes, acts, crew, difficulties,
    newRun, canResume, card, previewUpgrade, intent, canPlay, play, endTurn, chooseReward,
    chooseRoute, chooseEvent, upgrade
  };
  root.AccordEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);

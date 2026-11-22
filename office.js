/* Virtual office — three private offices and ten desks on the open floor.
   To add or remove someone (including Kenneth, Terrance or Reginald), edit STAFF only. */

/* Paste the Worker address here after Kenneth deploys it, then open a follow-up PR
   (or tell George the address). Leave it empty to stay in friendly offline mode. */
const OFFICE_FEED_URL = "";

const POLL_MS = 60000;

/* Single list of everyone with a desk. Remove or comment out an entry to take
   that person off this page — the layout, board and feed mapping all follow. */
const STAFF = [
  { id: "kenneth", name: "Kenneth Quill", tag: "Ken", role: "Chief of Staff", prop: "clipboard", office: true,
    plate: ["KENNETH QUILL", "CHIEF OF STAFF"],
    body: "#6b5344", skin: "#f0c9a0", hair: "#2a2420", accent: "#c4a574" },
  { id: "terry", name: "Terrance Quill", tag: "Terry", role: "The Machine", prop: "quill", office: true, kind: "terry",
    plate: ["TERRANCE QUILL"],
    body: "#b81c24", skin: "#d8d4c8", hair: "#b0aaa0", accent: "#d1202f" },
  { id: "reggie", name: "Reginald Quill", tag: "Reggie", role: "The Cousin", prop: "quill", office: true, kind: "reggie",
    plate: ["REGINALD QUILL"],
    body: "#b81c24", skin: "#ccc8bc", hair: "#9a968c", accent: "#d1202f" },
  { id: "boris", name: "Boris Mailer", tag: "Boris", role: "Email", prop: "envelope",
    body: "#1e3a5f", skin: "#e0b894", hair: "#3b2a1a", accent: "#f4f0e4" },
  { id: "tweety", name: "Tweety McPost", tag: "Tweet", role: "X", prop: "bird",
    body: "#3a7ca5", skin: "#f3d2b3", hair: "#c45c26", accent: "#f2d36b" },
  { id: "percy", name: "Percy Proofington", tag: "Percy", role: "Books", prop: "book",
    body: "#7a1f2b", skin: "#f0c9a0", hair: "#4a2c0a", accent: "#f2e6d0" },
  { id: "george", name: "Foreman George", tag: "George", role: "Website", prop: "hat",
    body: "#2c3d5a", skin: "#e8c4a0", hair: "#5a3a20", accent: "#e6c200" },
  { id: "archie", name: "Arcade Archie", tag: "Archie", role: "Games", prop: "joystick",
    body: "#7b2d8e", skin: "#f3d2b3", hair: "#1a1a1a", accent: "#e23d4a" },
  { id: "brian", name: "Brian Drum", tag: "Brian", role: "Music", prop: "headphones",
    body: "#222222", skin: "#d4a07a", hair: "#3a2010", accent: "#c0c0c0" },
  { id: "clive", name: "Clive Cloud", tag: "Clive", role: "Vape shops", prop: "cloud",
    body: "#8a9aa3", skin: "#f3d2b3", hair: "#6a6a6a", accent: "#f4f7fa" },
  { id: "frank", name: "Frank Batter", tag: "Frank", role: "Chip shop", prop: "basket",
    body: "#f4f0e4", skin: "#e8c4a0", hair: "#4a3020", accent: "#1a2744" },
  { id: "filament", name: "Filament Spool", tag: "Fila", role: "3D printer", prop: "spool",
    body: "#1a6b6b", skin: "#f0c9a0", hair: "#2a1a10", accent: "#e07a2f" },
  { id: "oddly", name: "Oddly Wilkins", tag: "Oddly", role: "Quirky shop", prop: "duck",
    body: "#5a3d7a", skin: "#f3d2b3", hair: "#f2e6a0", accent: "#f2c14e" }
];

const WORK_FLAVOUR = [
  "Head down",
  "In the trenches",
  "Absolutely not on the kettle",
  "Typing like it owes him money",
  "A rare and beautiful focus",
  "On the case, after a fashion",
  "The very idea of endeavour",
  "Quietly nailing it",
  "Do not wave, he is plotting",
  "Having a moment with the work"
];
const IDLE_FLAVOUR = [
  "Kettle duty",
  "Staring at the printer",
  "A wander, purely medicinal",
  "Between engagements",
  "Consulting the biscuits",
  "Out to lunch, spiritually",
  "Examining the ceiling for clues",
  "Waiting for the muse, or lunch",
  "Off to the kettle, diplomatically",
  "Practising looking busy"
];
const CELE_FLAVOUR = [
  "A brief, unsanctioned jig",
  "That's that, then",
  "Victory lap, very small",
  "Off to the kettle in triumph"
];

const W = 640, H = 430, FLOOR_Y = 122;
let viewScale = 1;
const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const params = new URLSearchParams(location.search);
const DEMO = params.get("demo") || "";

const canvas = document.getElementById("office-canvas");
const ctx = canvas.getContext("2d");
const boardList = document.getElementById("office-board-list");
const feedNote = document.getElementById("office-feed-note");
const demoNote = document.getElementById("office-demo-note");

const desks = [];
const rooms = [];
const people = [];
const cats = [];
const hotspots = [];
let feedOffline = !OFFICE_FEED_URL && !DEMO;
let lastFeed = 0;
let fetching = false;
let t0 = 0;
let lastTs = 0;
let demoAppliedWorking = false;
let demoAppliedIdle = false;

function pick(arr, salt) {
  return arr[Math.abs((salt | 0) + arr.length * 3) % arr.length];
}


function fitCanvas() {
  const avail = document.documentElement.clientWidth;
  if (avail >= 1280) {
    viewScale = 2;
    canvas.style.width = (W * 2) + "px";
    canvas.style.height = (H * 2) + "px";
  } else if (avail >= 640) {
    viewScale = 1;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
  } else {
    viewScale = avail / W;
    canvas.style.width = "100%";
    canvas.style.height = "auto";
  }
}

function layoutOffices() {
  rooms.length = 0;
  const holders = STAFF.filter(s => s.office);
  const margin = 4, gap = 4, rh = 118;
  const n = holders.length;
  const rw = Math.floor((W - margin * 2 - gap * (n - 1)) / n);
  holders.forEach((staff, i) => {
    const x = margin + i * (rw + gap);
    const y = 2;
    const cx = x + Math.round(rw / 2);
    rooms.push({
      id: staff.id,
      staff: staff,
      x: x,
      y: y,
      w: rw,
      h: rh,
      cx: cx,
      doorX: cx,
      doorY: y + rh + 6,
      doorW: 24
    });
    const deskY = y + 36;
    desks.push({
      id: staff.id,
      x: cx - 29,
      y: deskY,
      w: 58,
      h: 28,
      cx: cx,
      chairX: cx,
      chairY: deskY + 40,
      staff: staff,
      private: true
    });
  });
}

function layoutDesks() {
  desks.length = 0;
  layoutOffices();
  const floorStaff = STAFF.filter(s => !s.office);
  const n = floorStaff.length;
  const topN = Math.ceil(n / 2);
  const botN = n - topN;
  function row(list, y) {
    const slot = 58, gap = 22;
    const total = list.length * slot + (list.length - 1) * gap;
    const x0 = Math.round((W - total) / 2);
    list.forEach((staff, i) => {
      const x = x0 + i * (slot + gap);
      desks.push({
        id: staff.id,
        x: x,
        y: y,
        w: slot,
        h: 28,
        cx: x + slot / 2,
        chairX: x + slot / 2,
        chairY: y + 46,
        staff: staff
      });
    });
  }
  row(floorStaff.slice(0, topN), FLOOR_Y + 50);
  if (botN) row(floorStaff.slice(topN), FLOOR_Y + 178);
}

function setupHotspots() {
  hotspots.length = 0;
  [
    { x: 54, y: FLOOR_Y + 28, kind: "kettle" },
    { x: 586, y: FLOOR_Y + 28, kind: "printer" },
    { x: 320, y: FLOOR_Y + 30, kind: "plant" },
    { x: 160, y: FLOOR_Y + 118 },
    { x: 320, y: FLOOR_Y + 118 },
    { x: 480, y: FLOOR_Y + 118 },
    { x: 90, y: H - 28 },
    { x: 250, y: H - 28 },
    { x: 400, y: H - 28 },
    { x: 550, y: H - 28 }
  ].forEach(s => hotspots.push(s));
  rooms.forEach(r => {
    hotspots.push({ x: r.cx - 24, y: r.y + 90, room: r.id });
    hotspots.push({ x: r.doorX, y: r.doorY, room: r.id });
  });
}

function roomAt(x, y) {
  return rooms.find(r => x >= r.x + 2 && x <= r.x + r.w - 2 && y >= r.y + 2 && y <= r.y + r.h) || null;
}

function setRoute(who, dest) {
  who.waypoints = [];
  const from = roomAt(who.x, who.y);
  const to = roomAt(dest.x, dest.y);
  if (from && (!to || from.id !== to.id)) who.waypoints.push({ x: from.doorX, y: from.doorY });
  if (to && (!from || from.id !== to.id)) who.waypoints.push({ x: to.doorX, y: to.doorY });
  who.waypoints.push({ x: dest.x, y: dest.y });
  who.target = who.waypoints.shift();
}

function flavourFor(id, mode, salt) {
  if (mode === "working") return pick(WORK_FLAVOUR, salt + id.length * 11);
  if (mode === "celebrating") return pick(CELE_FLAVOUR, salt + id.length * 17);
  return pick(IDLE_FLAVOUR, salt + id.length * 13);
}

function makePerson(staff, index) {
  const desk = desks.find(d => d.id === staff.id);
  const floorSpots = hotspots.filter(s => !s.room);
  const start = staff.office
    ? { x: desk.chairX + (index % 2 ? -16 : 16), y: desk.chairY + 8 }
    : floorSpots[index % floorSpots.length];
  return {
    id: staff.id,
    staff: staff,
    desk: desk,
    x: REDUCE ? desk.chairX : start.x + (index % 3) * 4,
    y: REDUCE ? desk.chairY : start.y,
    want: "idle",
    phase: "idle",
    target: null,
    waypoints: [],
    wait: 0.4 * index,
    walkT: index * 0.3,
    celeT: 0,
    facing: "r",
    flavour: flavourFor(staff.id, "idle", index + 3),
    typeT: 0
  };
}

function makeCat(id, x, y) {
  return { id, x, y, target: null, wait: id === "arthur" ? 0.2 : 1.2, walkT: 0, facing: "l", loaf: id === "arthur" };
}

function buildBoard() {
  boardList.innerHTML = "";
  STAFF.forEach(s => {
    const li = document.createElement("li");
    li.id = "board-" + s.id;
    li.innerHTML = '<span class="office-dot idle" aria-hidden="true"></span>' +
      '<span class="office-who">' + s.name + ' <small>' + s.role + "</small></span>" +
      '<span class="office-flavour"></span>';
    boardList.appendChild(li);
  });
  paintBoard();
}

function paintBoard() {
  feedNote.hidden = !feedOffline;
  people.forEach(p => {
    const li = document.getElementById("board-" + p.id);
    if (!li) return;
    const dot = li.querySelector(".office-dot");
    const fl = li.querySelector(".office-flavour");
    const mode = p.phase === "celebrating" ? "celebrating" : p.want === "working" ? "working" : "idle";
    dot.className = "office-dot " + mode;
    fl.textContent = p.flavour;
  });
}

function setOffline(off) {
  feedOffline = off;
  paintBoard();
}

function setWant(person, want) {
  if (person.want === want && !(want === "idle" && person.phase === "celebrating")) {
    if (want === person.want && person.phase !== "celebrating") return;
  }
  const prev = person.want;
  person.want = want;
  if (want === "working") {
    person.flavour = flavourFor(person.id, "working", Date.now() / 1000 | 0);
    person.phase = REDUCE ? "working" : "to-desk";
    setRoute(person, { x: person.desk.chairX, y: person.desk.chairY });
    person.wait = 0;
    if (REDUCE) {
      person.x = person.desk.chairX;
      person.y = person.desk.chairY;
      person.phase = "working";
    }
  } else if (prev === "working" || person.phase === "working" || person.phase === "to-desk") {
    person.flavour = flavourFor(person.id, "celebrating", Date.now() / 1000 | 0);
    person.phase = "celebrating";
    person.celeT = 0;
    person.target = null;
    if (REDUCE) {
      person.phase = "idle";
      person.flavour = flavourFor(person.id, "idle", Date.now() / 1000 | 0);
      person.wait = 0.2;
    }
  } else {
    person.flavour = flavourFor(person.id, "idle", Date.now() / 1000 | 0);
    if (person.phase !== "celebrating") person.phase = "idle";
  }
  paintBoard();
}

function applyBots(bots) {
  const map = bots || {};
  people.forEach(p => {
    const state = map[p.id] === "working" ? "working" : "idle";
    setWant(p, state);
  });
}

function stepMove(who, dt, speed) {
  if (!who.target) return true;
  const dx = who.target.x - who.x;
  const dy = who.target.y - who.y;
  const d = Math.hypot(dx, dy);
  if (d < 1.6) {
    who.x = who.target.x;
    who.y = who.target.y;
    if (who.waypoints && who.waypoints.length) {
      who.target = who.waypoints.shift();
      return false;
    }
    who.target = null;
    return true;
  }
  const step = speed * dt;
  who.x += (dx / d) * Math.min(step, d);
  who.y += (dy / d) * Math.min(step, d);
  if (Math.abs(dx) > 0.4) who.facing = dx < 0 ? "l" : "r";
  who.walkT += dt;
  return false;
}

function idleTarget(person) {
  let pool;
  if (person.staff.office) {
    pool = Math.random() < 0.45
      ? hotspots.filter(s => s.room === person.id)
      : hotspots.filter(s => !s.room);
  } else {
    pool = hotspots.filter(s => !s.room);
  }
  const far = pool.filter(s => Math.hypot(s.x - person.x, s.y - person.y) > 28);
  const use = far.length ? far : (pool.length ? pool : hotspots.filter(s => !s.room));
  return use[Math.floor(Math.random() * use.length)];
}

function tickPerson(p, dt) {
  p.typeT += dt;
  if (p.phase === "to-desk") {
    const arrived = REDUCE ? true : stepMove(p, dt, 46);
    if (arrived) {
      p.x = p.desk.chairX;
      p.y = p.desk.chairY;
      p.phase = "working";
      p.facing = "r";
    }
    return;
  }
  if (p.phase === "working") {
    p.x = p.desk.chairX;
    p.y = p.desk.chairY;
    return;
  }
  if (p.phase === "celebrating") {
    p.celeT += dt;
    if (DEMO === "celebrating") {
      if (p.celeT > 0.9) p.celeT = 0.25;
      return;
    }
    if (p.celeT >= 1.8) {
      p.phase = "idle";
      p.flavour = flavourFor(p.id, "idle", Date.now() / 1000 | 0);
      p.wait = 0.2;
      if (!REDUCE) setRoute(p, { x: hotspots[0].x, y: hotspots[0].y });
      else p.target = null;
      paintBoard();
    }
    return;
  }
  if (REDUCE) {
    if (p.staff.office) {
      p.x = p.desk.chairX;
      p.y = p.desk.chairY + 12;
    } else {
      const floor = hotspots.filter(s => !s.room);
      const stand = floor[STAFF.filter(s => !s.office).findIndex(s => s.id === p.id) % floor.length];
      p.x = stand.x;
      p.y = stand.y;
    }
    return;
  }
  if (p.wait > 0) {
    p.wait -= dt;
    return;
  }
  const arrived = stepMove(p, dt, 38);
  if (arrived) {
    p.wait = 1.2 + Math.random() * 2.8;
    setRoute(p, idleTarget(p));
  }
}

function tickCat(c, dt) {
  if (REDUCE) return;
  if (c.wait > 0) {
    c.wait -= dt;
    return;
  }
  if (c.loaf && Math.random() < 0.004) {
    c.wait = 3 + Math.random() * 4;
    return;
  }
  const arrived = stepMove(c, dt, 28);
  if (arrived) {
    c.wait = 0.8 + Math.random() * 3;
    const floor = hotspots.filter(s => !s.room);
    const spots = floor.filter(s => Math.hypot(s.x - c.x, s.y - c.y) > 20);
    const use = spots.length ? spots : floor;
    const t = use[Math.floor(Math.random() * use.length)];
    c.target = { x: t.x + (Math.random() * 16 - 8), y: t.y + (Math.random() * 10 - 5) };
  }
}

function p(x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function drawRoom() {
  /* Open-floor boards */
  for (let x = 0; x < W; x += 16) {
    p(x, FLOOR_Y, 15, H - FLOOR_Y, (x / 16) % 2 ? "#c4a06a" : "#d0ad78");
    p(x + 15, FLOOR_Y, 1, H - FLOOR_Y, "#a88850");
  }
  /* rug */
  p(210, FLOOR_Y + 108, 220, 36, "#8a2a2a");
  p(214, FLOOR_Y + 112, 212, 28, "#7a2424");
  p(218, FLOOR_Y + 116, 204, 20, "#6b3d12");
  /* kettle */
  p(28, FLOOR_Y + 16, 36, 6, "#6b4a2a");
  p(30, FLOOR_Y + 22, 6, 12, "#5a3c22");
  p(56, FLOOR_Y + 22, 6, 12, "#5a3c22");
  p(38, FLOOR_Y + 2, 16, 14, "#c4bfb2");
  p(41, FLOOR_Y - 2, 10, 8, "#d1202f");
  p(49, FLOOR_Y - 6, 3, 6, "#3d2a1c");
  const steam = (t0 * 2) % 1;
  if (!REDUCE) {
    p(44, FLOOR_Y - 12 - steam * 6, 2, 3, "#ffffff");
    p(48, FLOOR_Y - 14 - steam * 8, 2, 3, "#ffffffaa");
  }
  /* plant */
  p(312, FLOOR_Y + 16, 16, 8, "#6b4a2a");
  p(316, FLOOR_Y + 4, 8, 12, "#0f4a4a");
  p(310, FLOOR_Y - 2, 8, 10, "#1a6b4a");
  p(322, FLOOR_Y, 8, 10, "#0f4a4a");
  /* printer */
  p(560, FLOOR_Y + 6, 36, 22, "#d8d2c6");
  p(564, FLOOR_Y, 28, 8, "#c4bfb2");
  p(568, FLOOR_Y + 10, 20, 6, "#22409a");
  p(590, FLOOR_Y + 12, 4, 3, (t0 % 1 < 0.5) ? "#2e8b57" : "#e6c200");
  p(566, FLOOR_Y + 28, 24, 4, "#f4f0e4");
  /* clock on the office front wall, between doors */
  p(308, FLOOR_Y + 4, 22, 22, "#3d2a1c");
  p(310, FLOOR_Y + 6, 18, 18, "#f4f0e4");
  p(318, FLOOR_Y + 8, 2, 7, "#141414");
  p(318, FLOOR_Y + 14, 6, 2, "#141414");
  /* ink splat */
  p(18, H - 36, 10, 6, "#14141422");
  p(22, H - 32, 6, 6, "#14141422");
  p(600, H - 30, 12, 8, "#d1202f22");
  drawPrivateOffices();
  /* inner frame */
  p(0, 0, W, 2, "#141414");
  p(0, H - 2, W, 2, "#141414");
  p(0, 0, 2, H, "#141414");
  p(W - 2, 0, 2, H, "#141414");
}

function drawPrivateOffices() {
  const carpets = { kenneth: "#c4a87a", terry: "#e8dcc0", reggie: "#d4b6a4" };
  rooms.forEach(r => {
    p(r.x, r.y, r.w, r.h, carpets[r.id] || "#e4d4b8");
    /* back wall */
    p(r.x, r.y, r.w, 16, "#efe6d4");
    /* little window */
    p(r.cx - 22, r.y + 3, 44, 12, "#3d2a1c");
    p(r.cx - 20, r.y + 4, 20, 10, "#8ec8e6");
    p(r.cx + 1, r.y + 4, 19, 10, "#7eb8d8");
    /* bookshelf for Terry and Reggie, as in their portraits */
    if (r.id === "terry" || r.id === "reggie") {
      p(r.x + 6, r.y + 20, 16, 28, "#6b4a2a");
      p(r.x + 8, r.y + 22, 5, 8, "#7a1f2b");
      p(r.x + 14, r.y + 22, 5, 8, "#22409a");
      p(r.x + 8, r.y + 32, 5, 7, "#0f4a4a");
      p(r.x + 14, r.y + 32, 5, 7, "#6b3d12");
    }
    /* glass partitions: ink posts and pale glass */
    p(r.x, r.y, 2, r.h, "#141414");
    p(r.x + r.w - 2, r.y, 2, r.h, "#141414");
    p(r.x, r.y, r.w, 2, "#141414");
    /* front wall with a door gap */
    const doorL = r.doorX - Math.floor(r.doorW / 2);
    const doorR = doorL + r.doorW;
    p(r.x, r.y + r.h - 3, doorL - r.x, 3, "#141414");
    p(doorR, r.y + r.h - 3, r.x + r.w - doorR, 3, "#141414");
    /* pale glass on the front wall either side of the door */
    p(r.x + 2, r.y + r.h - 14, Math.max(0, doorL - r.x - 3), 8, "#c5d8e4");
    p(doorR + 1, r.y + r.h - 14, Math.max(0, r.x + r.w - 2 - doorR - 1), 8, "#c5d8e4");
    /* threshold */
    p(doorL, r.y + r.h - 1, r.doorW, 4, "#6b4a2a");
    /* nameplates are crisp at 1x/2x; on a small phone the board carries the names */
    if (viewScale >= 1) {
      const lines = r.staff.plate || [r.staff.name.toUpperCase()];
      const plateW = Math.max.apply(null, lines.map(s => s.length * 4 + 6));
      const plateH = lines.length * 7 + 4;
      const px = r.cx - Math.round(plateW / 2);
      const py = r.y + 17;
      p(px, py, plateW, plateH, "#f4f0e4");
      p(px, py, plateW, 1, "#3d2a1c");
      p(px, py + plateH - 1, plateW, 1, "#3d2a1c");
      lines.forEach((line, i) => drawLabel(r.cx, py + 2 + i * 7, line, "#141414"));
    }
  });
}



const GLYPHS = {
  A:[0b010,0b101,0b111,0b101,0b101],
  B:[0b110,0b101,0b110,0b101,0b110],
  C:[0b011,0b100,0b100,0b100,0b011],
  D:[0b110,0b101,0b101,0b101,0b110],
  E:[0b111,0b100,0b110,0b100,0b111],
  F:[0b111,0b100,0b110,0b100,0b100],
  G:[0b011,0b100,0b111,0b101,0b011],
  H:[0b101,0b101,0b111,0b101,0b101],
  I:[0b111,0b010,0b010,0b010,0b111],
  K:[0b101,0b101,0b110,0b101,0b101],
  L:[0b100,0b100,0b100,0b100,0b111],
  M:[0b101,0b111,0b101,0b101,0b101],
  N:[0b110,0b101,0b101,0b101,0b101],
  O:[0b111,0b101,0b101,0b101,0b111],
  P:[0b110,0b101,0b110,0b100,0b100],
  Q:[0b010,0b101,0b101,0b111,0b001],
  R:[0b110,0b101,0b110,0b101,0b101],
  S:[0b011,0b100,0b010,0b001,0b110],
  T:[0b111,0b010,0b010,0b010,0b010],
  U:[0b101,0b101,0b101,0b101,0b111],
  V:[0b101,0b101,0b101,0b010,0b010],
  W:[0b101,0b101,0b101,0b111,0b101],
  Y:[0b101,0b101,0b010,0b010,0b010]
};
function drawGlyph(x, y, ch, color) {
  const bits = GLYPHS[ch];
  if (!bits) return 4;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      if (bits[row] & (1 << (2 - col))) p(x + col, y + row, 1, 1, color);
    }
  }
  return 4;
}
function drawLabel(cx, y, text, color) {
  const s = String(text || "").toUpperCase();
  const w = s.length * 4 - 1;
  let x = Math.round(cx - w / 2);
  for (const ch of s) x += drawGlyph(x, y, ch, color);
}

function drawDesk(d) {
  /* monitor */
  p(d.cx - 8, d.y - 2, 16, 14, "#141414");
  p(d.cx - 6, d.y, 12, 10, d.staff.accent);
  p(d.cx - 2, d.y + 12, 4, 4, "#3d2a1c");
  /* surface */
  p(d.x + 4, d.y + 16, d.w - 8, 10, "#8b5a2b");
  p(d.x + 4, d.y + 16, d.w - 8, 2, "#a88850");
  p(d.x + 8, d.y + 26, 6, 8, "#6b4a2a");
  p(d.x + d.w - 14, d.y + 26, 6, 8, "#6b4a2a");
  /* chair */
  p(d.chairX - 7, d.chairY - 4, 14, 6, "#3d2a1c");
  p(d.chairX - 8, d.chairY + 2, 16, 5, "#2a1c14");
}

function drawProp(px, py, kind, facing) {
  const flip = facing === "l" ? -1 : 1;
  if (kind === "clipboard") {
    p(px, py, 6, 8, "#c4a574");
    p(px + 1, py + 1, 4, 6, "#f4f0e4");
  } else if (kind === "envelope") {
    p(px, py + 2, 8, 5, "#f4f0e4");
    p(px, py + 2, 8, 1, "#1e3a5f");
  } else if (kind === "book") {
    p(px, py, 7, 8, "#7a1f2b");
    p(px + 6, py, 1, 8, "#f2e6d0");
  } else if (kind === "joystick") {
    p(px, py + 4, 8, 4, "#141414");
    p(px + 3, py, 2, 5, "#c0c0c0");
    p(px + 2, py - 2, 4, 3, "#e23d4a");
  } else if (kind === "basket") {
    p(px, py, 8, 6, "#c0c0c0");
    p(px + 1, py + 1, 6, 4, "#e07a2f");
  } else if (kind === "spool") {
    p(px, py, 6, 8, "#e07a2f");
    p(px + 1, py + 2, 4, 4, "#22409a");
  } else if (kind === "duck") {
    p(px, py + 2, 7, 5, "#f2c14e");
    p(px + 5, py, 4, 4, "#f2c14e");
    p(px + 8, py + 2, 3, 2, "#e07a2f");
  } else if (kind === "quill") {
    p(px + 3, py, 3, 4, "#f4f0e4");
    p(px + 2, py + 3, 2, 8, "#e8e0d0");
    p(px + 2, py + 10, 1, 3, "#3d2a1c");
  }
  return flip;
}

function drawRobot(pr) {
  const s = pr.staff;
  const terry = s.kind === "terry";
  const cele = pr.phase === "celebrating";
  const walk = pr.phase === "idle" || pr.phase === "to-desk";
  const work = pr.phase === "working";
  const moving = !REDUCE && walk && pr.target;
  const bob = moving ? ((pr.walkT * 8 | 0) % 2) : 0;
  const jump = (!REDUCE && cele) ? Math.round(Math.abs(Math.sin(pr.celeT * 10)) * 8) : 0;
  const x = Math.round(pr.x);
  const y = Math.round(pr.y - jump + bob);
  p(x - 7, Math.round(pr.y) + 2, 14, 3, "#14141433");
  const metal = terry ? "#d8d4c8" : "#ccc8bc";
  const vest = "#b81c24";
  const shirt = "#f4f0e4";

  if (work) {
    p(x - 7, y - 12, 14, 12, vest);
    p(x - 4, y - 12, 8, 3, shirt);
    if (terry) {
      p(x - 1, y - 12, 2, 6, "#141414"); /* tie */
      p(x - 6, y - 24, 12, 12, metal);
      p(x - 2, y - 28, 2, 4, metal);
      p(x - 3, y - 31, 4, 3, "#d1202f");
      p(x - 5, y - 21, 3, 3, "#fff");
      p(x + 2, y - 21, 3, 3, "#fff");
      p(x - 4, y - 20, 2, 2, "#141414");
      p(x + 3, y - 20, 2, 2, "#141414");
    } else {
      p(x - 5, y - 26, 10, 14, metal);
      p(x - 1, y - 29, 2, 4, metal);
      p(x - 4, y - 22, 3, 2, "#fff");
      p(x + 2, y - 22, 3, 2, "#fff");
      p(x - 3, y - 22, 2, 1, "#141414");
      p(x + 3, y - 22, 2, 1, "#141414");
      p(x + 1, y - 23, 5, 5, "#14141400");
      p(x + 1, y - 24, 5, 1, "#141414");
      p(x + 1, y - 24, 1, 5, "#141414");
      p(x + 5, y - 24, 1, 5, "#141414");
      p(x + 1, y - 20, 5, 1, "#141414");
      p(x - 4, y - 12, 3, 2, "#141414");
      p(x + 1, y - 12, 3, 2, "#141414");
    }
    const tap = (!REDUCE && ((pr.typeT * 6 | 0) % 2)) ? 1 : 0;
    p(x - 10, y - 8, 6, 3, metal);
    p(x + 4, y - 8 + tap, 6, 3, metal);
    return;
  }

  /* legs */
  p(x - 5, y - 8, 4, 10, metal);
  p(x + 1, y - 8, 4, 10, metal);
  if (bob) p(x + (pr.facing === "l" ? -5 : 1), y - 6, 4, 10, metal);
  /* body: white shirt, red waistcoat */
  p(x - 6, y - 20, 12, 13, shirt);
  p(x - 6, y - 18, 12, 10, vest);
  if (terry) p(x - 1, y - 20, 2, 7, "#141414");
  else {
    p(x - 4, y - 20, 3, 2, "#141414");
    p(x + 1, y - 20, 3, 2, "#141414");
  }
  /* head — from the portraits: Terry is a cheerful box, Reggie is taller with a monocle */
  if (terry) {
    p(x - 6, y - 32, 12, 12, metal);
    p(x - 7, y - 28, 2, 5, "#b0aaa0");
    p(x + 5, y - 28, 2, 5, "#b0aaa0");
    p(x - 1, y - 36, 2, 4, metal);
    p(x - 2, y - 39, 4, 3, "#d1202f");
    p(x - 5, y - 29, 4, 4, "#fff");
    p(x + 1, y - 29, 4, 4, "#fff");
    p(x - 4, y - 28, 2, 2, "#141414");
    p(x + 2, y - 28, 2, 2, "#141414");
    p(x - 3, y - 24, 6, 1, "#141414");
    p(x - 2, y - 23, 4, 1, "#141414");
  } else {
    p(x - 5, y - 34, 10, 14, metal);
    p(x - 6, y - 30, 2, 5, "#9a968c");
    p(x + 4, y - 30, 2, 5, "#9a968c");
    p(x - 1, y - 38, 2, 4, metal);
    p(x - 4, y - 30, 3, 3, "#fff");
    p(x + 2, y - 30, 3, 3, "#fff");
    p(x - 3, y - 30, 2, 1, "#141414");
    p(x + 3, y - 29, 2, 2, "#141414");
    /* monocle */
    p(x + 1, y - 32, 6, 1, "#141414");
    p(x + 1, y - 32, 1, 6, "#141414");
    p(x + 6, y - 32, 1, 6, "#141414");
    p(x + 1, y - 27, 6, 1, "#141414");
    p(x + 7, y - 26, 1, 8, "#141414");
    p(x - 2, y - 24, 4, 1, "#3d2a1c");
  }
  if (["quill"].includes(s.prop)) {
    const left = pr.facing === "l";
    drawProp(left ? x - 14 : x + 7, y - 22, "quill", pr.facing);
  }
  p(x + (pr.facing === "l" ? -9 : 6), y - 18, 4, 8, metal);
  if (cele) {
    p(x - 10, y - 32 - Math.min(jump, 4), 4, 8, metal);
    p(x + 6, y - 34 - Math.min(jump, 4), 4, 8, metal);
    p(x - 12, y - 36 - jump, 3, 3, "#e6c200");
    p(x + 10, y - 38 - jump, 3, 3, "#d1202f");
    p(x - 2, y - 44 - jump, 3, 3, "#22409a");
  }
}

function drawPerson(pr) {
  const s = pr.staff;
  if (s.kind === "terry" || s.kind === "reggie") {
    drawRobot(pr);
    return;
  }

  const cele = pr.phase === "celebrating";
  const walk = pr.phase === "idle" || pr.phase === "to-desk";
  const work = pr.phase === "working";
  const moving = !REDUCE && walk && pr.target;
  const bob = moving ? ((pr.walkT * 8 | 0) % 2) : 0;
  const jump = (!REDUCE && cele) ? Math.round(Math.abs(Math.sin(pr.celeT * 10)) * 8) : 0;
  const x = Math.round(pr.x);
  const y = Math.round(pr.y - jump + bob);
  const left = pr.facing === "l";
  p(x - 7, Math.round(pr.y) + 2, 14, 3, "#14141433");

  if (work) {
    /* Seated in front of the desk, back to us, facing the monitor. */
    p(x - 7, y - 12, 14, 12, s.body);
    if (s.id === "frank") p(x - 7, y - 7, 14, 7, s.accent);
    p(x - 6, y - 22, 12, 10, s.skin);
    if (s.prop === "hat") {
      p(x - 8, y - 26, 16, 5, s.accent);
      p(x - 6, y - 29, 12, 4, s.accent);
    } else {
      p(x - 6, y - 26, 12, 5, s.hair);
    }
    if (s.prop === "headphones") {
      p(x - 8, y - 22, 3, 6, "#111");
      p(x + 5, y - 22, 3, 6, "#111");
      p(x - 8, y - 26, 16, 3, "#111");
    }
    if (s.prop === "cloud") {
      p(x - 8, y - 38, 6, 4, s.accent);
      p(x - 5, y - 41, 10, 5, s.accent);
      p(x + 3, y - 37, 6, 4, s.accent);
    }
    if (s.prop === "bird") {
      p(x + 5, y - 30, 7, 5, s.accent);
      p(x + 11, y - 29, 3, 2, "#e07a2f");
    }
    const tap = (!REDUCE && ((pr.typeT * 6 | 0) % 2)) ? 1 : 0;
    p(x - 10, y - 8, 6, 3, s.skin);
    p(x + 4, y - 8 + tap, 6, 3, s.skin);
    return;
  }

  /* legs */
  p(x - 5, y - 8, 4, 10, "#2a2420");
  p(x + 1, y - 8, 4, 10, "#2a2420");
  if (bob) p(x + (left ? -5 : 1), y - 6, 4, 10, "#2a2420");
  /* body */
  p(x - 6, y - 20, 12, 13, s.body);
  if (s.id === "frank") p(x - 6, y - 13, 12, 7, s.accent);
  /* head */
  p(x - 5, y - 30, 10, 10, s.skin);
  p(x - 5, y - 33, 10, 4, s.hair);
  if (s.prop === "hat") {
    p(x - 7, y - 35, 14, 5, s.accent);
    p(x - 5, y - 38, 10, 4, s.accent);
  }
  if (s.prop === "headphones") {
    p(x - 7, y - 28, 3, 6, s.accent);
    p(x + 4, y - 28, 3, 6, s.accent);
    p(x - 7, y - 32, 14, 3, "#111");
  }
  if (s.prop === "cloud") {
    p(x - 8, y - 44, 6, 4, s.accent);
    p(x - 5, y - 47, 10, 5, s.accent);
    p(x + 3, y - 43, 6, 4, s.accent);
    p(x - 1, y - 40, 3, 2, s.accent);
  }
  if (s.prop === "bird") {
    p(x + (left ? -9 : 5), y - 38, 7, 5, s.accent);
    p(x + (left ? -10 : 11), y - 37, 3, 2, "#e07a2f");
  }
  /* eyes */
  p(x - 3, y - 26, 2, 2, "#141414");
  p(x + 1, y - 26, 2, 2, "#141414");
  const held = ["clipboard", "envelope", "book", "joystick", "basket", "spool", "duck", "quill"];
  if (held.includes(s.prop)) {
    drawProp(left ? x - 14 : x + 7, y - 18, s.prop, pr.facing);
  }
  p(x + (left ? -9 : 6), y - 18, 4, 8, s.skin);
  if (cele) {
    /* arms up */
    p(x - 10, y - 32 - Math.min(jump, 4), 4, 8, s.skin);
    p(x + 6, y - 34 - Math.min(jump, 4), 4, 8, s.skin);
    p(x - 12, y - 36 - jump, 3, 3, "#e6c200");
    p(x + 10, y - 38 - jump, 3, 3, "#d1202f");
    p(x - 2, y - 44 - jump, 3, 3, "#22409a");
    p(x + 5, y - 42, 3, 2, "#e6c200");
    p(x - 8, y - 42, 2, 2, "#f4f0e4");
  }
}

function drawArthur(c) {
  const bob = (!REDUCE && c.target && c.wait <= 0) ? ((c.walkT * 7 | 0) % 2) : 0;
  const x = Math.round(c.x), y = Math.round(c.y + bob);
  p(x - 9, y + 3, 18, 4, "#14141433");
  /* Cream body, seal-point face, ears and long bushy tail, white chest, blue eyes. */
  const cream = "#e6d3b8";
  const point = "#6b5348";
  const chest = "#f4efe8";
  p(x - 9, y - 10, 18, 13, cream);
  p(x - 5, y - 8, 10, 8, chest);
  p(x - 6, y - 18, 12, 10, cream);
  p(x - 6, y - 21, 5, 5, point);
  p(x + 1, y - 21, 5, 5, point);
  p(x - 5, y - 16, 10, 8, point);
  p(x - 5, y - 12, 10, 4, cream);
  p(x - 3, y - 14, 3, 3, "#7ec8e8");
  p(x + 1, y - 14, 3, 3, "#7ec8e8");
  p(x - 2, y - 10, 3, 2, "#c48a8a");
  const tailL = c.facing === "l";
  p(x + (tailL ? 8 : -15), y - 6, 10, 6, point);
  p(x + (tailL ? 13 : -18), y - 2, 7, 8, "#5a433a");
  p(x - 8, y, 5, 4, cream);
  p(x + 3, y, 5, 4, cream);
}

function drawDexter(c) {
  const bob = (!REDUCE && c.target && c.wait <= 0) ? ((c.walkT * 7 | 0) % 2) : 0;
  const x = Math.round(c.x), y = Math.round(c.y + bob);
  p(x - 9, y + 3, 18, 4, "#14141433");
  /* Smoky dark face, curly grey chest ruff, amber eyes. */
  p(x - 9, y - 10, 18, 13, "#3d3530");
  p(x - 6, y - 9, 12, 9, "#b0a8a0");
  p(x - 6, y - 19, 12, 10, "#1a1210");
  p(x - 6, y - 22, 5, 5, "#1a1210");
  p(x + 1, y - 22, 5, 5, "#1a1210");
  p(x - 3, y - 15, 3, 3, "#e6c84a");
  p(x + 1, y - 15, 3, 3, "#e6c84a");
  p(x - 2, y - 11, 3, 2, "#1a1210");
  const tailL = c.facing === "l";
  p(x + (tailL ? 8 : -14), y - 6, 9, 5, "#2a2420");
  p(x - 8, y, 5, 4, "#1a1210");
  p(x + 3, y, 5, 4, "#1a1210");
}

function drawFrame() {
  ctx.imageSmoothingEnabled = false;
  drawRoom();
  const sprites = [];
  desks.forEach(d => sprites.push({ y: d.y + 20, draw: () => drawDesk(d) }));
  people.forEach(pr => sprites.push({ y: pr.y, draw: () => drawPerson(pr) }));
  cats.forEach(c => sprites.push({
    y: c.y,
    draw: () => (c.id === "arthur" ? drawArthur(c) : drawDexter(c))
  }));
  sprites.sort((a, b) => a.y - b.y);
  sprites.forEach(s => s.draw());
  if (viewScale >= 1) {
    desks.forEach(d => {
      if (d.private) return;
      const w = String(d.staff.tag).length * 4 + 3;
      p(d.cx - w / 2, d.chairY + 6, w, 7, "#f4f0e4");
      p(d.cx - w / 2, d.chairY + 6, w, 1, "#3d2a1c");
      drawLabel(d.cx, d.chairY + 7, d.staff.tag, "#141414");
    });
  }
}

function applyDemo(now) {
  const george = people.find(p => p.id === "george");
  if (!george) return;
  if (DEMO === "working") {
    if (!demoAppliedWorking) {
      people.forEach(p => { if (p.id !== "george") setWant(p, "idle"); });
      setWant(george, "working");
      george.x = george.desk.chairX;
      george.y = george.desk.chairY;
      george.phase = "working";
      demoAppliedWorking = true;
    }
    return;
  }
  if (DEMO === "celebrating") {
    if (!demoAppliedIdle) {
      people.forEach(p => { if (p.id !== "george") setWant(p, "idle"); });
      george.want = "working";
      george.x = george.desk.chairX;
      george.y = george.desk.chairY;
      george.phase = "working";
      setWant(george, "idle");
      george.celeT = 0.35;
      demoAppliedIdle = true;
    }
    return;
  }
  if (DEMO === "1") {
    if (!demoAppliedWorking && now > 0.7) {
      setWant(george, "working");
      demoAppliedWorking = true;
    }
    if (!demoAppliedIdle && now > 6) {
      setWant(george, "idle");
      demoAppliedIdle = true;
    }
  }
}

async function pullFeed() {
  if (DEMO) return;
  if (!OFFICE_FEED_URL) {
    setOffline(true);
    return;
  }
  if (document.hidden || fetching) return;
  fetching = true;
  try {
    const res = await fetch(OFFICE_FEED_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("bad");
    const data = await res.json();
    setOffline(false);
    applyBots(data && data.bots);
  } catch (err) {
    setOffline(true);
    applyBots({});
  } finally {
    fetching = false;
    lastFeed = performance.now();
  }
}

function loop(ts) {
  if (!t0) t0 = ts;
  const now = (ts - t0) / 1000;
  let dt = lastTs ? (ts - lastTs) / 1000 : 0.016;
  if (dt > 0.08) dt = 0.08;
  lastTs = ts;
  if (DEMO) applyDemo(now);
  people.forEach(p => tickPerson(p, dt));
  cats.forEach(c => tickCat(c, dt));
  drawFrame();
  if (!DEMO && OFFICE_FEED_URL && !document.hidden && performance.now() - lastFeed > POLL_MS) {
    pullFeed();
  }
  requestAnimationFrame(loop);
}

function boot() {
  fitCanvas();
  window.addEventListener("resize", fitCanvas);
  layoutDesks();
  setupHotspots();
  STAFF.forEach((s, i) => people.push(makePerson(s, i)));
  cats.push(makeCat("arthur", 320, FLOOR_Y + 126));
  cats.push(makeCat("dexter", 360, H - 30));
  if (DEMO) {
    demoNote.hidden = false;
    feedOffline = false;
  }
  buildBoard();
  if (DEMO === "working" || DEMO === "celebrating" || DEMO === "1") applyDemo(DEMO === "1" ? 0 : 10);
  drawFrame();
  if (!DEMO) pullFeed();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !DEMO) pullFeed();
  });
  requestAnimationFrame(loop);
}

boot();

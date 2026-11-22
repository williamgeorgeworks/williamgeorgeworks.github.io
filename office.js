/* Virtual office — private offices, an open floor, amenity rooms, and the machine.
   To add or remove someone (including Kenneth, Terrance or Reginald), edit STAFF only. */

/* Paste the Worker address here after Kenneth deploys it, then open a follow-up PR
   (or tell George the address). Leave it empty to stay in friendly offline mode. */
const OFFICE_FEED_URL = "https://wgw-office-feed.benharding75.workers.dev";

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
  "A wander, purely medicinal",
  "Between engagements",
  "Consulting the biscuits",
  "Out to lunch, spiritually",
  "Examining the ceiling for clues",
  "Waiting for the muse, or lunch",
  "Practising looking busy",
  "Loitering with intent",
  "A lap of the floor, then another"
];
const CELE_FLAVOUR = [
  "A brief, unsanctioned jig",
  "That's that, then",
  "Victory lap, very small",
  "Off to the kettle in triumph"
];

const W = 640, H = 760, FLOOR_Y = 122;
const MACHINE = { x: 558, y: 352, w: 74, h: 62, cx: 595, cy: 383, berth: 52 };

let viewScale = 1;
const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const params = new URLSearchParams(location.search);
const DEMO = params.get("demo") || "";
const EMBED = params.get("embed") === "1" || (!document.getElementById("office-canvas") && !!document.getElementById("office-live"));
const EMBED_CAM_X = 0;
const EMBED_CAM_Y = 148;
const EMBED_W = 640;
const EMBED_H = 240;

if (EMBED && params.get("embed") === "1") document.documentElement.classList.add("office-embed");

const canvas = document.getElementById("office-canvas") || document.getElementById("office-live");
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
  if (EMBED) {
    viewScale = 1;
    canvas.width = EMBED_W;
    canvas.height = EMBED_H;
    canvas.style.width = "";
    canvas.style.height = "";
    return;
  }
  /* Integer scale only, and never shrink below 1x. On a narrow phone the
     stage scrolls sideways instead of becoming a tiny blur. */
  const avail = document.documentElement.clientWidth;
  const scale = Math.max(1, Math.floor(avail / W));
  viewScale = scale;
  canvas.style.width = (W * scale) + "px";
  canvas.style.height = (H * scale) + "px";
  const wrap = document.getElementById("office-stage-wrap");
  const hint = document.getElementById("office-pan-hint");
  if (wrap && hint) {
    const overflow = W * scale > wrap.clientWidth + 8;
    hint.hidden = !overflow;
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

function layoutAmenities() {
  const rows = [
    { y: 428, h: 154, doors: "n", items: [
      { id: "canteen", plate: ["CANTEEN"], x: 4, w: 250 },
      { id: "tv", plate: ["TV ROOM"], x: 258, w: 186 },
      { id: "meet-a", plate: ["MEETING A"], x: 448, w: 188 }
    ]},
    { y: 598, h: 156, doors: "n", items: [
      { id: "music", plate: ["MUSIC"], x: 4, w: 210 },
      { id: "reflection", plate: ["REFLECTION"], x: 218, w: 210 },
      { id: "meet-b", plate: ["MEETING B"], x: 432, w: 204 }
    ]}
  ];
  /* The last bay on the bottom row is left as a short meeting room;
     the weird machine lives in the open-floor corner above, not in a room. */
  rows.forEach(row => {
    row.items.forEach(item => {
      const cx = item.x + Math.round(item.w / 2);
      rooms.push({
        id: item.id,
        plate: item.plate,
        amenity: true,
        doorSide: row.doors,
        x: item.x,
        y: row.y,
        w: item.w,
        h: row.h,
        cx: cx,
        doorX: cx,
        doorY: row.y - 6,
        doorW: 24
      });
      hotspots.push({ x: cx - 16, y: row.y + 70, room: item.id, kind: item.id });
      hotspots.push({ x: cx + 18, y: row.y + 110, room: item.id, kind: item.id });
    });
  });
}

function layoutDesks() {
  desks.length = 0;
  layoutOffices();
  layoutAmenities();
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
  /* Amenity rooms already added their interior spots in layoutAmenities. */
  [
    { x: 54, y: FLOOR_Y + 28, kind: "kettle" },
    { x: 500, y: FLOOR_Y + 28, kind: "printer" },
    { x: 320, y: FLOOR_Y + 30, kind: "plant" },
    { x: 160, y: FLOOR_Y + 118 },
    { x: 320, y: FLOOR_Y + 118 },
    { x: 430, y: FLOOR_Y + 118 },
    { x: 90, y: FLOOR_Y + 270 },
    { x: 250, y: FLOOR_Y + 270 },
    { x: 400, y: FLOOR_Y + 270 },
    { x: 80, y: 416, kind: "corridor" },
    { x: 240, y: 416, kind: "corridor" },
    { x: 400, y: 416, kind: "corridor" },
    { x: 80, y: 586, kind: "corridor" },
    { x: 300, y: 586, kind: "corridor" }
  ].forEach(s => {
    if (!nearMachine(s.x, s.y)) hotspots.push(s);
  });
  rooms.forEach(r => {
    if (r.amenity) return;
    hotspots.push({ x: r.cx - 24, y: r.y + 90, room: r.id });
    hotspots.push({ x: r.doorX, y: r.doorY, room: r.id });
  });
}

function nearMachine(x, y, extra) {
  return Math.hypot(x - MACHINE.cx, y - MACHINE.cy) < MACHINE.berth + (extra || 0);
}

function aroundMachine(x1, y1, x2, y2) {
  const mx = MACHINE.cx, my = MACHINE.cy, r = MACHINE.berth + 8;
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((mx - x1) * dx + (my - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + t * dx, py = y1 + t * dy;
  if (Math.hypot(px - mx, py - my) >= r) return null;
  return { x: MACHINE.x - 18, y: my };
}

function roomAt(x, y) {
  return rooms.find(r => x >= r.x + 2 && x <= r.x + r.w - 2 && y >= r.y + 2 && y <= r.y + r.h) || null;
}

function setRoute(who, dest) {
  who.waypoints = [];
  if (nearMachine(dest.x, dest.y, -8)) {
    dest = { x: MACHINE.x - 24, y: dest.y };
  }
  const from = roomAt(who.x, who.y);
  const to = roomAt(dest.x, dest.y);
  if (from && (!to || from.id !== to.id)) who.waypoints.push({ x: from.doorX, y: from.doorY });
  if (to && (!from || from.id !== to.id)) who.waypoints.push({ x: to.doorX, y: to.doorY });
  who.waypoints.push({ x: dest.x, y: dest.y });
  const points = [{ x: who.x, y: who.y }].concat(who.waypoints);
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const detour = aroundMachine(a.x, a.y, b.x, b.y);
    if (detour) out.push(detour);
    out.push(b);
  }
  who.waypoints = out;
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
    glanceT: 0,
    pendingDest: null,
    facing: "r",
    flavour: flavourFor(staff.id, "idle", index + 3),
    typeT: 0
  };
}

function makeCat(id, x, y) {
  return { id, x, y, target: null, wait: id === "arthur" ? 0.2 : 1.2, walkT: 0, facing: "l", loaf: id === "arthur" };
}

function buildBoard() {
  if (!boardList) return;
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
  if (feedNote) feedNote.hidden = EMBED || !feedOffline;
  if (EMBED || !boardList) return;
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
    if (REDUCE && state === "working" && p.desk) {
      p.x = p.desk.chairX;
      p.y = p.desk.chairY;
      p.phase = "working";
      p.target = null;
      p.waypoints = [];
    }
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

const PLACE_FLAVOUR = {
  canteen: ["Frank's domain, the canteen", "A diplomatic bacon sandwich", "Lunch, or the idea of lunch"],
  tv: ["Watching something unspeakable", "The TV is winning, quietly"],
  music: ["Brian's natural haunt", "Having a listen"],
  reflection: ["A quiet word with himself", "In the reflection room, eyes shut"],
  "meet-a": ["In a meeting, sort of", "The meeting about meetings"],
  "meet-b": ["Around the table", "Nodding at a whiteboard"],
  kettle: ["Kettle duty", "Off to the kettle, diplomatically"],
  printer: ["Staring at the printer"]
};

function flavourForPlace(person, dest) {
  const key = (dest && (dest.kind || dest.room)) || "";
  const list = PLACE_FLAVOUR[key];
  if (list) return pick(list, (Date.now() / 1000 | 0) + person.id.length);
  return flavourFor(person.id, "idle", Date.now() / 1000 | 0);
}

function idleTarget(person) {
  const safe = hotspots.filter(s => !nearMachine(s.x, s.y));
  let preferred = [];
  if (person.id === "frank") preferred = safe.filter(s => s.room === "canteen" || s.kind === "canteen");
  if (person.id === "brian") preferred = safe.filter(s => s.room === "music" || s.kind === "music");
  let pool;
  if (preferred.length && Math.random() < 0.55) pool = preferred;
  else if (person.staff.office && Math.random() < 0.3) pool = safe.filter(s => s.room === person.id);
  else pool = safe;
  const far = pool.filter(s => Math.hypot(s.x - person.x, s.y - person.y) > 28);
  const use = far.length ? far : (pool.length ? pool : safe);
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
    if (!REDUCE && p.glanceT <= 0 && nearMachine(p.x, p.y, 40) && !nearMachine(p.x, p.y) && Math.random() < 0.02) {
      p.glanceT = 0.9;
      p.facing = p.x < MACHINE.cx ? "r" : "l";
      p.flavour = "Giving the machine a wide berth";
      paintBoard();
    }
    if (p.glanceT > 0) p.glanceT -= dt;
    if (p.wait <= 0 && p.pendingDest) {
      setRoute(p, p.pendingDest);
      p.pendingDest = null;
    }
    return;
  }
  const arrived = stepMove(p, dt, 38);
  if (arrived) {
    p.wait = 1.2 + Math.random() * 2.8;
    p.flavour = flavourHere(p);
    paintBoard();
    p.pendingDest = idleTarget(p);
    p.target = null;
  }
}

function flavourHere(person) {
  const room = roomAt(person.x, person.y);
  if (room && room.amenity) return flavourForPlace(person, { room: room.id, kind: room.id });
  let best = null, bestD = 24;
  hotspots.forEach(s => {
    if (s.room || (s.kind !== "kettle" && s.kind !== "printer")) return;
    const d = Math.hypot(s.x - person.x, s.y - person.y);
    if (d < bestD) { best = s; bestD = d; }
  });
  if (best) return flavourForPlace(person, best);
  return flavourFor(person.id, "idle", Date.now() / 1000 | 0);
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
    const floor = hotspots.filter(s => !s.room && !nearMachine(s.x, s.y, 10) && (s.y || 0) < 430);
    const spots = floor.filter(s => Math.hypot(s.x - c.x, s.y - c.y) > 20);
    const use = spots.length ? spots : floor;
    const dest = use[Math.floor(Math.random() * use.length)];
    if (dest) c.target = { x: dest.x + (Math.random() * 16 - 8), y: dest.y + (Math.random() * 10 - 5) };
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
  /* ink splat on the open floor, not in the new rooms */
  p(18, FLOOR_Y + 290, 10, 6, "#14141422");
  p(22, FLOOR_Y + 294, 6, 6, "#14141422");
  /* open-floor furnishings */
  drawPlant(140, FLOOR_Y + 18);
  drawPlant(470, FLOOR_Y + 20);
  drawPlant(70, FLOOR_Y + 200);
  drawPlant(520, FLOOR_Y + 210);
  /* water cooler */
  p(200, FLOOR_Y + 8, 16, 6, "#c0c0c0");
  p(204, FLOOR_Y + 14, 8, 18, "#8ec8e6");
  p(202, FLOOR_Y + 32, 12, 6, "#c0c0c0");
  if (!REDUCE && (t0 * 2 % 1) < 0.5) p(207, FLOOR_Y + 20, 2, 2, "#f4f0e4");
  /* filing cabinets */
  p(580, FLOOR_Y + 200, 22, 28, "#6b5344");
  p(582, FLOOR_Y + 206, 18, 6, "#4a3a30");
  p(582, FLOOR_Y + 216, 18, 6, "#4a3a30");
  p(584, FLOOR_Y + 208, 3, 2, "#c4a574");
  /* noticeboard */
  p(420, FLOOR_Y + 4, 36, 22, "#6b3d12");
  p(423, FLOOR_Y + 6, 10, 8, "#f4f0e4");
  p(435, FLOOR_Y + 8, 8, 7, "#d1202f");
  p(444, FLOOR_Y + 7, 9, 10, "#22409a");
  /* coat rack */
  p(18, FLOOR_Y + 200, 3, 28, "#3d2a1c");
  p(14, FLOOR_Y + 204, 12, 2, "#3d2a1c");
  p(12, FLOOR_Y + 206, 5, 10, "#1e3a5f");
  p(20, FLOOR_Y + 208, 5, 12, "#7a1f2b");
  /* sofa by the rug */
  p(150, FLOOR_Y + 148, 44, 16, "#5a2a2a");
  p(150, FLOOR_Y + 146, 8, 20, "#4a2020");
  p(186, FLOOR_Y + 146, 8, 20, "#4a2020");
  /* bin */
  p(250, FLOOR_Y + 24, 10, 12, "#3d2a1c");
  p(248, FLOOR_Y + 22, 14, 3, "#2a1c14");
  drawMachine();
  drawAllRooms();
  /* inner frame */
  p(0, 0, W, 2, "#141414");
  p(0, H - 2, W, 2, "#141414");
  p(0, 0, 2, H, "#141414");
  p(W - 2, 0, 2, H, "#141414");
}

function drawPlant(x, y) {
  p(x, y + 16, 16, 8, "#6b4a2a");
  p(x + 4, y + 4, 8, 12, "#0f4a4a");
  p(x - 2, y - 2, 8, 10, "#1a6b4a");
  p(x + 10, y, 8, 10, "#0f4a4a");
}

function drawMachine() {
  const m = MACHINE;
  p(m.x - 6, m.y - 6, m.w + 12, m.h + 14, "#2a1c16");
  for (let i = 0; i < 8; i++) {
    const c = i % 2 ? "#e6c200" : "#141414";
    p(m.x - 6 + i * 10, m.y - 6, 6, 4, c);
    p(m.x - 6 + i * 10, m.y + m.h + 4, 6, 4, c);
  }
  p(m.x + 10, m.y + 34, 54, 22, "#2a2420");
  p(m.x + 16, m.y + 10, 40, 28, "#4a3a58");
  const glow = REDUCE ? "#6b2a8a" : ((Math.sin((t0 || 0) * 3) > 0) ? "#a04ad0" : "#3dff7a");
  p(m.x + 24, m.y - 2, 24, 18, glow);
  p(m.x + 30, m.y + 2, 8, 8, "#f4f0e4");
  p(m.x + 6, m.y + 22, 12, 2, "#141414");
  p(m.x + 6, m.y + 22, 2, 22, "#141414");
  p(m.x + 22, m.y + 40, 12, 12, "#f4f0e4");
  p(m.x + 26, m.y + 44, 4, 6, "#d1202f");
  p(m.x + 50, m.y + 4, 2, 18, "#c0c0c0");
  if (!REDUCE && (((t0 || 0) * 6) % 1) < 0.18) {
    p(m.x + 54, m.y - 2, 3, 3, "#e6c200");
    p(m.x + 58, m.y + 4, 2, 2, "#f4f0e4");
  }
  if (viewScale >= 1 && !EMBED) drawLabel(m.cx, m.y + m.h - 6, "NO", "#d1202f");
}

function drawAllRooms() {
  const carpets = {
    kenneth: "#c4a87a", terry: "#e8dcc0", reggie: "#d4b6a4",
    canteen: "#e8d0a8", tv: "#3a3450", music: "#4a2a3c",
    reflection: "#d8e4d0", "meet-a": "#e8e0d4", "meet-b": "#e4dcc8"
  };
  rooms.forEach(r => {
    p(r.x, r.y, r.w, r.h, carpets[r.id] || "#e4d4b8");
    if (!r.amenity) {
      p(r.x, r.y, r.w, 16, "#efe6d4");
      p(r.cx - 22, r.y + 3, 44, 12, "#3d2a1c");
      p(r.cx - 20, r.y + 4, 20, 10, "#8ec8e6");
      p(r.cx + 1, r.y + 4, 19, 10, "#7eb8d8");
      if (r.id === "terry" || r.id === "reggie") {
        p(r.x + 6, r.y + 20, 16, 28, "#6b4a2a");
        p(r.x + 8, r.y + 22, 5, 8, "#7a1f2b");
        p(r.x + 14, r.y + 22, 5, 8, "#22409a");
        p(r.x + 8, r.y + 32, 5, 7, "#0f4a4a");
        p(r.x + 14, r.y + 32, 5, 7, "#6b3d12");
      }
    }
    p(r.x, r.y, 2, r.h, "#141414");
    p(r.x + r.w - 2, r.y, 2, r.h, "#141414");
    const doorL = r.doorX - Math.floor(r.doorW / 2);
    const doorR = doorL + r.doorW;
    const north = r.doorSide === "n";
    if (north) {
      p(r.x, r.y, doorL - r.x, 3, "#141414");
      p(doorR, r.y, r.x + r.w - doorR, 3, "#141414");
      p(r.x, r.y + r.h - 3, r.w, 3, "#141414");
      p(r.x + 2, r.y + 3, Math.max(0, doorL - r.x - 3), 8, "#c5d8e4");
      p(doorR + 1, r.y + 3, Math.max(0, r.x + r.w - 2 - doorR - 1), 8, "#c5d8e4");
      p(doorL, r.y - 2, r.doorW, 4, "#6b4a2a");
    } else {
      p(r.x, r.y, r.w, 2, "#141414");
      p(r.x, r.y + r.h - 3, doorL - r.x, 3, "#141414");
      p(doorR, r.y + r.h - 3, r.x + r.w - doorR, 3, "#141414");
      p(r.x + 2, r.y + r.h - 14, Math.max(0, doorL - r.x - 3), 8, "#c5d8e4");
      p(doorR + 1, r.y + r.h - 14, Math.max(0, r.x + r.w - 2 - doorR - 1), 8, "#c5d8e4");
      p(doorL, r.y + r.h - 1, r.doorW, 4, "#6b4a2a");
    }
    drawAmenityFurniture(r);
    if (viewScale >= 1 && !EMBED) {
      const lines = (r.staff && r.staff.plate) || r.plate || [String(r.id).toUpperCase()];
      const plateW = Math.max.apply(null, lines.map(s => s.length * 4 + 6));
      const plateH = lines.length * 7 + 4;
      const px = r.cx - Math.round(plateW / 2);
      const py = north ? r.y + 6 : r.y + 17;
      p(px, py, plateW, plateH, "#f4f0e4");
      p(px, py, plateW, 1, "#3d2a1c");
      p(px, py + plateH - 1, plateW, 1, "#3d2a1c");
      lines.forEach((line, i) => drawLabel(r.cx, py + 2 + i * 7, line, "#141414"));
    }
  });
}

function drawAmenityFurniture(r) {
  if (r.id === "canteen") {
    p(r.x + 8, r.y + 28, 70, 16, "#8b5a2b");
    p(r.x + 14, r.y + 16, 16, 14, "#c0c0c0");
    p(r.x + 18, r.y + 10, 8, 8, "#d8d2c6");
    p(r.x + 40, r.y + 18, 12, 10, "#e07a2f");
    p(r.x + 56, r.y + 20, 6, 8, "#d1202f");
    p(r.x + 100, r.y + 70, 40, 24, "#f4f0e4");
    p(r.x + 104, r.y + 92, 6, 8, "#3d2a1c");
    p(r.x + 130, r.y + 92, 6, 8, "#3d2a1c");
    p(r.x + 160, r.y + 70, 40, 24, "#f4f0e4");
    p(r.x + 164, r.y + 92, 6, 8, "#3d2a1c");
    p(r.x + 190, r.y + 92, 6, 8, "#3d2a1c");
    drawPlant(r.x + r.w - 28, r.y + 28);
  } else if (r.id === "tv") {
    p(r.cx - 20, r.y + 24, 40, 28, "#141414");
    const flicker = REDUCE ? "#22409a" : (((t0 || 0) * 8 | 0) % 2 ? "#2a50b0" : "#3a6ad4");
    p(r.cx - 16, r.y + 28, 32, 20, flicker);
    p(r.x + 20, r.y + 90, 70, 18, "#4a3048");
    p(r.x + 20, r.y + 86, 10, 24, "#3a2438");
    p(r.x + 80, r.y + 86, 10, 24, "#3a2438");
    p(r.x + 44, r.y + 78, 22, 10, "#6b4a2a");
    drawPlant(r.x + r.w - 26, r.y + 100);
  } else if (r.id === "music") {
    p(r.x + 16, r.y + 36, 18, 28, "#1a1a1a");
    p(r.x + 18, r.y + 40, 14, 16, "#3a3a3a");
    p(r.x + 48, r.y + 48, 28, 16, "#d8d2c6");
    p(r.x + 52, r.y + 44, 20, 6, "#141414");
    p(r.x + 54, r.y + 46, 3, 3, "#f4f0e4");
    p(r.x + 90, r.y + 50, 16, 16, "#2a1c14");
    p(r.x + 92, r.y + 52, 12, 12, "#c41c1c");
    p(r.x + 16, r.y + 90, 36, 10, "#6b3d12");
    p(r.x + 20, r.y + 92, 10, 6, "#141414");
    p(r.x + 32, r.y + 92, 10, 6, "#141414");
    p(r.cx - 10, r.y + 24, 28, 18, "#7a1f2b");
    p(r.cx - 6, r.y + 28, 20, 10, "#f4f0e4");
  } else if (r.id === "reflection") {
    p(r.cx - 30, r.y + 70, 60, 36, "#c8d8c4");
    p(r.cx - 16, r.y + 80, 14, 10, "#d4a07a");
    p(r.cx + 4, r.y + 82, 14, 10, "#e0b894");
    p(r.cx - 8, r.y + 40, 16, 10, "#8ec8e6");
    p(r.cx - 6, r.y + 36, 12, 6, "#7eb8d8");
    if (!REDUCE) p(r.cx, r.y + 32, 2, 3, "#f4f0e4");
    drawPlant(r.x + 12, r.y + 36);
    drawPlant(r.x + r.w - 28, r.y + 100);
  } else if (r.id === "meet-a" || r.id === "meet-b") {
    p(r.cx - 32, r.y + 60, 64, 28, "#8b5a2b");
    p(r.cx - 36, r.y + 88, 8, 8, "#3d2a1c");
    p(r.cx + 28, r.y + 88, 8, 8, "#3d2a1c");
    p(r.cx - 36, r.y + 52, 8, 8, "#3d2a1c");
    p(r.cx + 28, r.y + 52, 8, 8, "#3d2a1c");
    p(r.x + 8, r.y + 30, 28, 20, "#f4f0e4");
    p(r.x + 12, r.y + 34, 16, 2, "#22409a");
    p(r.x + 14, r.y + 38, 10, 2, "#d1202f");
    p(r.x + 16, r.y + 42, 12, 2, "#141414");
  }
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
  if (pr.glanceT > 0) p(x + (left ? -8 : 6), y - 34, 2, 4, "#8ec8e6");
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
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (EMBED) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, EMBED_W, EMBED_H);
    ctx.clip();
    ctx.translate(-EMBED_CAM_X, -EMBED_CAM_Y);
  }
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
  if (viewScale >= 1 && !EMBED) {
    desks.forEach(d => {
      if (d.private) return;
      const w = String(d.staff.tag).length * 4 + 3;
      p(d.cx - w / 2, d.chairY + 6, w, 7, "#f4f0e4");
      p(d.cx - w / 2, d.chairY + 6, w, 1, "#3d2a1c");
      drawLabel(d.cx, d.chairY + 7, d.staff.tag, "#141414");
    });
  }
  if (EMBED) ctx.restore();
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

let officeOnScreen = true;
let rafId = 0;

function shouldAnimate() {
  return !REDUCE && !document.hidden && officeOnScreen;
}

function loop(ts) {
  rafId = 0;
  if (!shouldAnimate()) return;
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
  rafId = requestAnimationFrame(loop);
}

function resumeLoop() {
  if (!shouldAnimate() || rafId) return;
  lastTs = 0;
  rafId = requestAnimationFrame(loop);
}

function watchEmbedVisibility() {
  const el = document.getElementById("office-live-tile") || canvas;
  if (el && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      officeOnScreen = entries.some(e => e.isIntersecting);
      if (officeOnScreen) resumeLoop();
    }, { threshold: 0.08 });
    io.observe(el);
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      if (!DEMO) pullFeed();
      resumeLoop();
    }
  });
}

function boot() {
  if (!canvas || !ctx) return;
  fitCanvas();
  window.addEventListener("resize", fitCanvas);
  layoutDesks();
  setupHotspots();
  STAFF.forEach((s, i) => people.push(makePerson(s, i)));
  cats.push(makeCat("arthur", 320, FLOOR_Y + 126));
  cats.push(makeCat("dexter", 360, FLOOR_Y + 270));
  if (DEMO && demoNote) {
    demoNote.hidden = false;
    feedOffline = false;
  }
  buildBoard();
  if (DEMO === "working" || DEMO === "celebrating" || DEMO === "1") applyDemo(DEMO === "1" ? 0 : 10);
  drawFrame();
  if (!DEMO) pullFeed();
  watchEmbedVisibility();
  resumeLoop();
}

boot();

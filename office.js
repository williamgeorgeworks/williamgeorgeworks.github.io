/* Virtual office — private offices, an open floor, a canteen, a music room, and the machine.
   To add or remove someone (including Kenneth, Terrance or Reginald), edit STAFF only. */

/* Paste the Worker address here after Kenneth deploys it, then open a follow-up PR
   (or tell George the address). Leave it empty to stay in friendly offline mode. */
const OFFICE_FEED_URL = "https://wgw-office-feed.williamgeorgeworks.workers.dev";

const POLL_MS = 60000;

/* Single list of everyone with a desk. Remove or comment out an entry to take
   that person off this page — the layout, board and feed mapping all follow. */
const STAFF = [
  { id: "kenneth", name: "Kenneth Quill", tag: "Ken", role: "Chief of Staff", prop: "clipboard", office: true, kind: "kenneth",
    plate: ["KENNETH QUILL", "CHIEF OF STAFF"],
    body: "#1a1a1a", skin: "#e8dcc8", hair: "#1a1a1a", accent: "#c4a574" },
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

const W = 640, H = 640, FLOOR_Y = 128;
const MACHINE = { x: 548, y: 368, w: 78, h: 66, cx: 587, cy: 401, berth: 56 };

let viewScale = 1;
const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const params = new URLSearchParams(location.search);
const DEMO = params.get("demo") || "";
const EMBED = params.get("embed") === "1" || (!document.getElementById("office-canvas") && !!document.getElementById("office-live"));
const EMBED_CAM_X = 0;
const EMBED_CAM_Y = 136;
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
let animT = 0;
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
  const margin = 8, gap = 14, rh = 120;
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
  /* One row only, with a proper gap between the two rooms. The TV room,
     reflection room and both meeting rooms are gone: nobody was really
     sent there, and Ben asked for air rather than empty rooms. */
  const rows = [
    { y: 492, h: 140, doors: "n", items: [
      { id: "canteen", plate: ["CANTEEN"], x: 10, w: 292 },
      { id: "music", plate: ["MUSIC"], x: 338, w: 292 }
    ]}
  ];
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
  row(floorStaff.slice(0, topN), FLOOR_Y + 58);
  if (botN) row(floorStaff.slice(topN), FLOOR_Y + 200);
}

function setupHotspots() {
  /* Amenity rooms already added their interior spots in layoutAmenities. */
  [
    { x: 54, y: FLOOR_Y + 32, kind: "kettle" },
    { x: 500, y: FLOOR_Y + 32, kind: "printer" },
    { x: 160, y: FLOOR_Y + 164 },
    { x: 320, y: FLOOR_Y + 164 },
    { x: 430, y: FLOOR_Y + 164 },
    { x: 90, y: FLOOR_Y + 290 },
    { x: 250, y: FLOOR_Y + 290 },
    { x: 400, y: FLOOR_Y + 290 },
    { x: 80, y: 472, kind: "corridor" },
    { x: 240, y: 472, kind: "corridor" },
    { x: 400, y: 472, kind: "corridor" }
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
  music: ["Brian's natural haunt", "Having a listen"],
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
    const floor = hotspots.filter(s => !s.room && !nearMachine(s.x, s.y, 10) && (s.y || 0) < 492);
    const spots = floor.filter(s => Math.hypot(s.x - c.x, s.y - c.y) > 20);
    const use = spots.length ? spots : floor;
    const dest = use[Math.floor(Math.random() * use.length)];
    if (dest) c.target = { x: dest.x + (Math.random() * 16 - 8), y: dest.y + (Math.random() * 10 - 5) };
  }
}

function p(x, y, w, h, c) {
  if (w <= 0 || h <= 0) return;
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function hexRgb(h) {
  h = String(h).replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length < 6) return [20, 20, 20];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbHex(r, g, b) {
  const c = n => ("0" + Math.max(0, Math.min(255, n | 0)).toString(16)).slice(-2);
  return "#" + c(r) + c(g) + c(b);
}
function lite(h, a) {
  const [r, g, b] = hexRgb(h);
  return rgbHex(r + (255 - r) * a, g + (255 - g) * a, b + (255 - b) * a);
}
function dark(h, a) {
  const [r, g, b] = hexRgb(h);
  return rgbHex(r * (1 - a), g * (1 - a), b * (1 - a));
}

function box(x, y, w, h, fill, edge) {
  p(x, y, w, h, fill);
  const e = edge || "#141414";
  p(x, y, w, 1, e);
  p(x, y + h - 1, w, 1, e);
  p(x, y, 1, h, e);
  p(x + w - 1, y, 1, h, e);
}

function shadow(x, y, w, h) {
  p(x + 1, y, w - 2, h, "#14141433");
  p(x, y + 1, w, h - 1, "#14141422");
}

let plankSheet = null;
function ensurePlanks() {
  if (plankSheet) return plankSheet;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  for (let x = 0; x < W; x += 16) {
    const even = (x / 16) % 2;
    g.fillStyle = even ? "#c8a56c" : "#d4b27a";
    g.fillRect(x, 0, 15, H);
    g.fillStyle = "#8e6c3c";
    g.fillRect(x + 15, 0, 1, H);
    g.fillStyle = even ? "#b8935c" : "#c4a56a";
    g.fillRect(x, 0, 2, H);
    g.fillStyle = "rgba(255, 232, 190, 0.22)";
    g.fillRect(x + 3, 0, 1, H);
    for (let y = 0; y < H; y += 29) {
      const j = (x * 13 + y * 7) % 17;
      g.fillStyle = "rgba(80, 48, 16, 0.22)";
      g.fillRect(x + 2, y + j, 10, 1);
      g.fillStyle = "rgba(255, 236, 200, 0.16)";
      g.fillRect(x + 5, y + j + 11, 7, 1);
    }
  }
  plankSheet = c;
  return c;
}

function tileFloor(x, y, w, h, a, b) {
  const size = 16;
  for (let ty = y; ty < y + h; ty += size) {
    for (let tx = x; tx < x + w; tx += size) {
      const even = (((tx - x) / size | 0) + ((ty - y) / size | 0)) % 2;
      const tw = Math.min(size, x + w - tx);
      const th = Math.min(size, y + h - ty);
      p(tx, ty, tw, th, even ? a : b);
      p(tx, ty, tw, 1, "#00000022");
      p(tx, ty, 1, th, "#00000022");
      if (tw > 3 && th > 3) p(tx + 1, ty + 1, 2, 1, "#ffffff22");
    }
  }
}

function drawWindow(x, y, w, h) {
  box(x, y, w, h, "#3d2a1c", "#141414");
  p(x + 2, y + 2, w - 4, h - 4, "#8ec8e8");
  p(x + 2, y + 2, Math.floor((w - 4) / 2), h - 4, "#7eb8dc");
  p(x + 3, y + 3, 3, 2, "#f4f0e4");
  p(x + 3, y + 6, 2, 4, "#ffffff55");
  /* mullion */
  p(x + Math.floor(w / 2) - 1, y, 2, h, "#3d2a1c");
  p(x, y + Math.floor(h / 2), w, 2, "#3d2a1c");
}

function drawSkirting(x, y, w) {
  p(x, y, w, 5, "#5a3c22");
  p(x, y, w, 1, "#3d2a1c");
  p(x, y + 4, w, 1, "#2a1c14");
  p(x, y + 1, w, 1, "#7a5a38");
}

function drawPlant(x, y) {
  shadow(x + 1, y + 20, 16, 5);
  box(x + 2, y + 14, 14, 9, "#7a1f2b", "#3d2a1c");
  p(x + 3, y + 15, 12, 2, "#9a3a44");
  p(x + 4, y + 14, 10, 2, "#5a3c22");
  p(x + 5, y + 4, 8, 11, "#0f4a3a");
  p(x + 6, y + 5, 3, 6, "#1a7a52");
  p(x + 1, y + 2, 8, 10, "#146b48");
  p(x + 2, y + 3, 3, 4, "#2a8a5a");
  p(x + 9, y, 8, 10, "#0f4a3a");
  p(x + 11, y + 2, 3, 4, "#1a7a52");
  p(x + 7, y - 2, 5, 6, "#146b48");
}

function drawKettle() {
  const x = 32, y = FLOOR_Y + 8;
  shadow(x - 2, y + 26, 40, 6);
  box(x - 4, y + 22, 40, 8, "#6b4a2a", "#3d2a1c");
  p(x - 2, y + 23, 36, 2, "#8b6a42");
  p(x + 2, y + 22, 6, 10, "#5a3c22");
  p(x + 26, y + 22, 6, 10, "#5a3c22");
  /* body */
  box(x + 8, y + 6, 16, 16, "#c8c4b8", "#141414");
  p(x + 9, y + 7, 5, 13, "#e8e4d8");
  p(x + 20, y + 8, 3, 12, "#9a968c");
  p(x + 10, y + 18, 12, 3, "#8a8680");
  /* lid + red knob */
  p(x + 10, y + 3, 12, 4, "#d8d4c8");
  p(x + 9, y + 4, 14, 2, "#141414");
  box(x + 13, y - 2, 6, 6, "#d1202f", "#141414");
  p(x + 14, y - 1, 2, 2, "#f26a6a");
  /* spout + handle */
  p(x + 24, y + 10, 6, 3, "#a8a49c");
  p(x + 28, y + 8, 3, 5, "#a8a49c");
  p(x + 6, y + 8, 3, 2, "#3d2a1c");
  p(x + 5, y + 8, 2, 10, "#3d2a1c");
  p(x + 6, y + 17, 3, 2, "#3d2a1c");
  if (!REDUCE) {
    const s = (animT * 1.6) % 1;
    p(x + 14, y - 8 - s * 7, 2, 3, "#ffffffcc");
    p(x + 18, y - 10 - s * 9, 2, 3, "#ffffff88");
  }
}

function drawPrinter() {
  const x = 548, y = FLOOR_Y + 4;
  shadow(x + 1, y + 30, 36, 5);
  box(x, y + 8, 36, 22, "#d8d2c6", "#141414");
  p(x + 1, y + 9, 34, 3, "#f0ece4");
  p(x + 2, y + 18, 32, 10, "#b8b2a6");
  box(x + 4, y, 28, 10, "#c4bfb2", "#141414");
  p(x + 6, y + 2, 24, 6, "#22409a");
  p(x + 7, y + 3, 10, 3, "#4a6ab0");
  p(x + 8, y + 4, 4, 1, "#c0d0f0");
  const led = !REDUCE && (animT % 1 < 0.5);
  p(x + 30, y + 14, 3, 3, led ? "#2e8b57" : "#e6c200");
  p(x + 6, y + 28, 24, 4, "#f4f0e4");
  p(x + 6, y + 27, 24, 1, "#141414");
  p(x + 8, y + 29, 20, 1, "#d8d2c6");
}

function drawWaterCooler() {
  const x = 196, y = FLOOR_Y + 6;
  shadow(x, y + 34, 18, 5);
  box(x, y + 18, 16, 16, "#c0c0c0", "#141414");
  p(x + 1, y + 19, 6, 14, "#d8d8d8");
  box(x + 3, y, 10, 20, "#6ab8d8", "#141414");
  p(x + 4, y + 1, 4, 16, "#8ec8e6");
  p(x + 5, y + 3, 2, 6, "#f4f0e4");
  p(x + 2, y + 32, 12, 4, "#a0a0a0");
  if (!REDUCE && (animT * 2 % 1) < 0.45) p(x + 7, y + 24, 2, 2, "#f4f0e4");
}

function drawClock() {
  const x = 308, y = FLOOR_Y + 4;
  box(x, y, 24, 24, "#3d2a1c", "#141414");
  p(x + 2, y + 2, 20, 20, "#f4f0e4");
  p(x + 3, y + 3, 18, 18, "#efe6d4");
  p(x + 11, y + 4, 2, 8, "#141414");
  p(x + 11, y + 11, 7, 2, "#d1202f");
  p(x + 11, y + 11, 2, 2, "#141414");
}

function drawRug() {
  const x = 210, y = FLOOR_Y + 144, w = 220, h = 40;
  shadow(x + 2, y + h - 2, w - 2, 5);
  p(x, y, w, h, "#6b1c1c");
  p(x + 3, y + 3, w - 6, h - 6, "#8a2a2a");
  p(x + 8, y + 8, w - 16, h - 16, "#7a2424");
  /* ink-red border pattern */
  for (let i = 0; i < w - 8; i += 8) {
    p(x + 4 + i, y + 4, 4, 2, "#d1202f");
    p(x + 4 + i, y + h - 6, 4, 2, "#d1202f");
  }
  p(x + 6, y + 10, w - 12, 1, "#5a1818");
}

function drawMachine() {
  const m = MACHINE;
  /* berth stain */
  p(m.x - 8, m.y + m.h - 2, m.w + 16, 10, "#14141422");
  shadow(m.x - 2, m.y + m.h, m.w + 8, 7);
  /* hazard stripes on the plinth */
  p(m.x - 8, m.y + m.h - 2, m.w + 16, 8, "#141414");
  for (let i = 0; i < 10; i++) {
    p(m.x - 8 + i * 10, m.y + m.h - 2, 6, 8, i % 2 ? "#e6c200" : "#141414");
  }
  /* chassis */
  box(m.x + 8, m.y + 28, 60, 32, "#2a2420", "#141414");
  p(m.x + 10, m.y + 30, 20, 28, "#3a342e");
  p(m.x + 12, m.y + 32, 8, 2, "#5a5248");
  box(m.x + 14, m.y + 8, 44, 32, "#3a2a48", "#141414");
  p(m.x + 16, m.y + 10, 14, 28, "#4a3a58");
  /* pulsing eye */
  const pulse = REDUCE ? 0.55 : (Math.sin(animT * 3.2) * 0.5 + 0.5);
  const glow = pulse > 0.55 ? "#a04ad0" : "#3dff7a";
  const glowDim = pulse > 0.55 ? "#6b2a8a" : "#1a6b3a";
  p(m.x + 22, m.y - 4, 28, 22, glowDim);
  p(m.x + 26, m.y, 20, 16, glow);
  p(m.x + 30, m.y + 3, 12, 10, "#f4f0e4");
  p(m.x + 33, m.y + 5, 6, 6, "#141414");
  p(m.x + 34, m.y + 6, 2, 2, "#f4f0e4");
  /* cables */
  p(m.x + 4, m.y + 22, 12, 2, "#141414");
  p(m.x + 4, m.y + 22, 2, 26, "#141414");
  p(m.x + 68, m.y + 36, 10, 2, "#141414");
  /* switch and spark */
  box(m.x + 20, m.y + 40, 14, 14, "#f4f0e4", "#141414");
  p(m.x + 24, m.y + 44, 6, 7, "#d1202f");
  p(m.x + 52, m.y + 4, 2, 20, "#c0c0c0");
  if (!REDUCE && ((animT * 7) % 1) < 0.22) {
    p(m.x + 56, m.y - 6, 3, 3, "#e6c200");
    p(m.x + 60, m.y, 2, 2, "#f4f0e4");
    p(m.x + 54, m.y + 2, 2, 2, "#3dff7a");
  }
  if (viewScale >= 1 && !EMBED) drawLabel(m.cx, m.y + m.h - 8, "NO", "#d1202f");
}

function drawInkSplat() {
  const x = 22, y = FLOOR_Y + 300;
  p(x, y, 12, 7, "#14141433");
  p(x + 4, y + 4, 8, 6, "#14141433");
  p(x + 10, y + 2, 4, 4, "#14141422");
  p(x - 3, y + 3, 4, 3, "#14141422");
  p(x + 2, y - 2, 3, 3, "#14141422");
}

function drawRoom() {
  ctx.drawImage(ensurePlanks(), 0, FLOOR_Y, W, H - FLOOR_Y, 0, FLOOR_Y, W, H - FLOOR_Y);
  /* north wall under the private offices */
  p(0, 0, W, FLOOR_Y, "#efe6d4");
  drawRug();
  drawKettle();
  drawPrinter();
  drawWaterCooler();
  drawClock();
  drawInkSplat();
  drawPlant(70, FLOOR_Y + 210);
  drawPlant(470, FLOOR_Y + 16);
  /* one filing cabinet, out of the way */
  shadow(20, FLOOR_Y + 230, 22, 6);
  box(20, FLOOR_Y + 204, 20, 28, "#6b5344", "#141414");
  p(22, FLOOR_Y + 206, 16, 2, "#8a7360");
  p(22, FLOOR_Y + 210, 16, 7, "#4a3a30");
  p(22, FLOOR_Y + 220, 16, 7, "#4a3a30");
  p(24, FLOOR_Y + 212, 3, 2, "#c4a574");
  p(24, FLOOR_Y + 222, 3, 2, "#c4a574");
  drawMachine();
  drawAllRooms();
  /* outer frame */
  p(0, 0, W, 2, "#141414");
  p(0, H - 2, W, 2, "#141414");
  p(0, 0, 2, H, "#141414");
  p(W - 2, 0, 2, H, "#141414");
}

function drawAllRooms() {
  const carpets = {
    kenneth: "#c4a87a",
    terry: "#e8dcc0",
    reggie: "#d4b6a4",
    canteen: "#e8d0a8",
    music: "#4a2a3c"
  };
  const walls = {
    kenneth: "#efe6d4",
    terry: "#f2ebe0",
    reggie: "#efe4d8",
    canteen: "#f0e4cc",
    music: "#3a2030"
  };
  rooms.forEach(r => {
    const carpet = carpets[r.id] || "#e4d4b8";
    const wall = walls[r.id] || "#efe6d4";
    const north = r.doorSide === "n" || r.amenity;
    if (r.id === "canteen") tileFloor(r.x, r.y, r.w, r.h, "#e8d0a8", "#d4bc90");
    else if (r.id === "music") {
      p(r.x, r.y, r.w, r.h, "#4a2a3c");
      for (let y = r.y + 8; y < r.y + r.h; y += 12) {
        p(r.x, y, r.w, 1, "#3a2030");
      }
    } else {
      p(r.x, r.y, r.w, r.h, carpet);
      /* subtle carpet grain */
      for (let i = r.y + 8; i < r.y + r.h - 4; i += 10) {
        p(r.x + 4, i, r.w - 8, 1, dark(carpet, 0.06));
      }
    }
    /* back wall band */
    const wallH = r.amenity ? 18 : 16;
    p(r.x, r.y, r.w, wallH, wall);
    p(r.x, r.y + wallH - 1, r.w, 1, dark(wall, 0.18));
    if (!r.amenity) {
      drawWindow(r.cx - 22, r.y + 2, 44, 13);
      if (r.id === "terry" || r.id === "reggie") {
        /* modest bookshelf */
        box(r.x + 6, r.y + 22, 16, 30, "#6b4a2a", "#141414");
        p(r.x + 8, r.y + 24, 5, 9, "#7a1f2b");
        p(r.x + 14, r.y + 24, 5, 9, "#22409a");
        p(r.x + 8, r.y + 35, 5, 8, "#0f4a4a");
        p(r.x + 14, r.y + 35, 5, 8, "#c4a574");
        p(r.x + 8, r.y + 44, 11, 5, "#f4f0e4");
      }
    }
    /* side walls */
    p(r.x, r.y, 3, r.h, "#141414");
    p(r.x + 1, r.y, 1, r.h, lite(wall, 0.15));
    p(r.x + r.w - 3, r.y, 3, r.h, "#141414");
    const doorL = r.doorX - Math.floor(r.doorW / 2);
    const doorR = doorL + r.doorW;
    if (north) {
      p(r.x, r.y, doorL - r.x, 3, "#141414");
      p(doorR, r.y, r.x + r.w - doorR, 3, "#141414");
      p(r.x, r.y + r.h - 4, r.w, 4, "#141414");
      p(r.x + 3, r.y + 3, Math.max(0, doorL - r.x - 4), 8, "#c5d8e4");
      p(doorR + 1, r.y + 3, Math.max(0, r.x + r.w - 3 - doorR - 1), 8, "#c5d8e4");
      /* door as a warm gap */
      p(doorL, r.y - 3, r.doorW, 6, "#6b4a2a");
      p(doorL + 2, r.y - 2, r.doorW - 4, 4, "#8b6a42");
      drawSkirting(r.x + 3, r.y + r.h - 9, doorL - r.x - 3);
      drawSkirting(doorR, r.y + r.h - 9, r.x + r.w - 3 - doorR);
    } else {
      p(r.x, r.y, r.w, 3, "#141414");
      p(r.x, r.y + r.h - 3, doorL - r.x, 3, "#141414");
      p(doorR, r.y + r.h - 3, r.x + r.w - doorR, 3, "#141414");
      p(r.x + 3, r.y + r.h - 16, Math.max(0, doorL - r.x - 4), 8, "#c5d8e4");
      p(doorR + 1, r.y + r.h - 16, Math.max(0, r.x + r.w - 3 - doorR - 1), 8, "#c5d8e4");
      p(doorL, r.y + r.h - 3, r.doorW, 6, "#6b4a2a");
      p(doorL + 2, r.y + r.h - 2, r.doorW - 4, 4, "#8b6a42");
      drawSkirting(r.x + 3, r.y + r.h - 8, doorL - r.x - 3);
      drawSkirting(doorR, r.y + r.h - 8, r.x + r.w - 3 - doorR);
    }
    drawAmenityFurniture(r);
    if (viewScale >= 1 && !EMBED) {
      const lines = (r.staff && r.staff.plate) || r.plate || [String(r.id).toUpperCase()];
      const plateW = Math.max.apply(null, lines.map(s => s.length * 4 + 6));
      const plateH = lines.length * 7 + 4;
      const px = r.cx - Math.round(plateW / 2);
      const py = north ? r.y + 6 : r.y + 17;
      box(px, py, plateW, plateH, "#f4f0e4", "#3d2a1c");
      lines.forEach((line, i) => drawLabel(r.cx, py + 2 + i * 7, line, "#141414"));
    }
  });
}

function drawAmenityFurniture(r) {
  if (r.id === "canteen") {
    /* serving counter */
    shadow(r.x + 10, r.y + 48, 86, 6);
    box(r.x + 8, r.y + 30, 86, 18, "#8b5a2b", "#141414");
    p(r.x + 9, r.y + 31, 84, 3, "#a87840");
    p(r.x + 9, r.y + 44, 84, 3, "#6b4a2a");
    /* urn */
    box(r.x + 16, r.y + 18, 16, 14, "#c0c0c0", "#141414");
    p(r.x + 18, r.y + 20, 6, 10, "#d8d8d8");
    p(r.x + 20, r.y + 14, 8, 6, "#d8d2c6");
    /* ketchup / tea */
    box(r.x + 44, r.y + 22, 12, 10, "#e07a2f", "#141414");
    box(r.x + 62, r.y + 24, 8, 8, "#d1202f", "#141414");
    p(r.x + 64, r.y + 25, 3, 2, "#f26a6a");
    /* two tables, not four, with a bit of air */
    [[r.x + 120, r.y + 70], [r.x + 200, r.y + 70]].forEach(([tx, ty]) => {
      shadow(tx + 2, ty + 18, 44, 6);
      box(tx, ty, 46, 18, "#f4f0e4", "#141414");
      p(tx + 1, ty + 1, 44, 3, "#ffffff");
      p(tx + 6, ty + 16, 6, 8, "#3d2a1c");
      p(tx + 34, ty + 16, 6, 8, "#3d2a1c");
    });
    drawPlant(r.x + r.w - 32, r.y + 28);
  } else if (r.id === "music") {
    /* amp */
    box(r.x + 16, r.y + 36, 20, 30, "#1a1a1a", "#141414");
    p(r.x + 18, r.y + 38, 16, 16, "#3a3a3a");
    p(r.x + 22, r.y + 42, 8, 8, "#2a2a2a");
    p(r.x + 24, r.y + 44, 4, 4, "#111");
    p(r.x + 18, r.y + 56, 16, 6, "#d1202f");
    /* keyboard */
    shadow(r.x + 50, r.y + 68, 36, 5);
    box(r.x + 48, r.y + 52, 36, 16, "#d8d2c6", "#141414");
    p(r.x + 50, r.y + 48, 32, 6, "#141414");
    p(r.x + 52, r.y + 50, 3, 4, "#f4f0e4");
    p(r.x + 58, r.y + 50, 3, 4, "#f4f0e4");
    p(r.x + 64, r.y + 50, 3, 4, "#141414");
    /* drum */
    box(r.x + 100, r.y + 56, 20, 18, "#2a1c14", "#141414");
    p(r.x + 102, r.y + 58, 16, 14, "#c41c1c");
    p(r.x + 106, r.y + 61, 8, 6, "#f4f0e4");
    /* guitar on the wall */
    p(r.cx - 8, r.y + 24, 6, 16, "#6b3d12");
    p(r.cx - 12, r.y + 36, 14, 10, "#7a1f2b");
    p(r.cx - 8, r.y + 38, 6, 6, "#f4f0e4");
    /* bench */
    box(r.x + 16, r.y + 96, 40, 10, "#6b3d12", "#141414");
    p(r.x + 18, r.y + 97, 36, 2, "#8b5a2b");
  }
}

function drawDesk(d) {
  const x = d.x, y = d.y, w = d.w;
  /* empty chair first, behind the desk; person may cover it */
  shadow(d.chairX - 8, d.chairY + 6, 18, 5);
  /* back */
  box(d.chairX - 8, d.chairY - 16, 16, 14, "#4a3224", "#141414");
  p(d.chairX - 7, d.chairY - 15, 14, 4, "#5a4232");
  p(d.chairX - 6, d.chairY - 10, 12, 6, "#3d2a1c");
  /* seat */
  box(d.chairX - 9, d.chairY - 4, 18, 7, "#3d2a1c", "#141414");
  p(d.chairX - 8, d.chairY - 3, 16, 2, "#5a4232");
  p(d.chairX - 7, d.chairY + 3, 3, 6, "#2a1c14");
  p(d.chairX + 4, d.chairY + 3, 3, 6, "#2a1c14");
  /* desk surface */
  shadow(x + 5, y + 24, w - 8, 6);
  box(x + 3, y + 16, w - 6, 10, "#8b5a2b", "#141414");
  p(x + 4, y + 17, w - 8, 3, "#b07a40");
  p(x + 4, y + 23, w - 8, 2, "#6b4a2a");
  p(x + 8, y + 26, 6, 8, "#6b4a2a");
  p(x + w - 14, y + 26, 6, 8, "#6b4a2a");
  /* monitor with glow */
  box(d.cx - 10, y - 4, 20, 16, "#141414", "#141414");
  const glow = lite(d.staff.accent || "#8ec8e6", 0.2);
  p(d.cx - 8, y - 2, 16, 12, glow);
  p(d.cx - 7, y - 1, 6, 4, lite(glow, 0.45));
  if (!REDUCE && ((animT * 3 + d.cx) % 1) < 0.08) p(d.cx - 4, y + 2, 8, 1, "#ffffff55");
  p(d.cx - 2, y + 12, 4, 5, "#3d2a1c");
  /* mug on a few desks, not all. Kenneth has his black-cat mug and a red quill. */
  if (d.id === "kenneth") {
    const mx = d.x + 8;
    box(mx, y + 9, 7, 8, "#f4f0e4", "#141414");
    p(mx + 1, y + 8, 2, 2, "#141414");
    p(mx + 4, y + 8, 2, 2, "#141414");
    p(mx + 2, y + 11, 1, 1, "#141414");
    p(mx + 4, y + 11, 1, 1, "#141414");
    p(mx + 3, y + 12, 1, 1, "#141414");
    p(mx + 2, y + 14, 3, 2, "#d1202f");
    p(mx + 7, y + 11, 2, 3, "#f4f0e4");
    /* red quill on the other side of the desk */
    const qx = d.x + d.w - 16;
    p(qx + 3, y + 2, 3, 5, "#d1202f");
    p(qx + 2, y + 3, 2, 3, lite("#d1202f", 0.25));
    p(qx + 4, y + 6, 2, 8, "#f4f0e4");
    p(qx + 4, y + 13, 1, 3, "#3d2a1c");
  } else if (d.id === "percy" || d.id === "george") {
    const mx = d.x + 8;
    box(mx, y + 10, 6, 6, "#f4f0e4", "#141414");
    p(mx + 1, y + 11, 4, 2, "#d1202f");
    p(mx + 6, y + 12, 2, 3, "#f4f0e4");
  }
}

function drawProp(px, py, kind, facing) {
  if (kind === "clipboard") {
    box(px, py, 7, 9, "#c4a574", "#141414");
    p(px + 1, py + 2, 5, 6, "#f4f0e4");
    p(px + 2, py, 3, 2, "#8a6a40");
  } else if (kind === "envelope") {
    box(px, py + 2, 9, 6, "#f4f0e4", "#141414");
    p(px, py + 2, 9, 1, "#1e3a5f");
    p(px + 1, py + 3, 7, 1, "#1e3a5f");
  } else if (kind === "book") {
    box(px, py, 8, 9, "#7a1f2b", "#141414");
    p(px + 6, py + 1, 1, 7, "#f2e6d0");
    p(px + 1, py + 1, 4, 1, "#f2e6d0");
  } else if (kind === "joystick") {
    box(px, py + 5, 9, 5, "#141414", "#141414");
    p(px + 3, py, 3, 6, "#c0c0c0");
    box(px + 2, py - 3, 5, 4, "#e23d4a", "#141414");
  } else if (kind === "basket") {
    box(px, py, 9, 7, "#c0c0c0", "#141414");
    p(px + 1, py + 1, 7, 4, "#e07a2f");
    p(px + 2, py + 2, 3, 2, "#f4c078");
  } else if (kind === "spool") {
    box(px, py, 7, 9, "#e07a2f", "#141414");
    p(px + 1, py + 2, 5, 5, "#22409a");
    p(px + 2, py + 3, 3, 2, "#4a6ab0");
  } else if (kind === "duck") {
    p(px, py + 3, 8, 5, "#f2c14e");
    p(px + 1, py + 4, 3, 2, "#f8dc80");
    p(px + 6, py, 5, 5, "#f2c14e");
    p(px + 10, py + 2, 3, 2, "#e07a2f");
    p(px + 8, py + 2, 2, 2, "#141414");
  } else if (kind === "quill") {
    p(px + 3, py, 4, 5, "#f4f0e4");
    p(px + 4, py + 1, 2, 3, "#ffffff");
    p(px + 3, py + 4, 2, 9, "#e8e0d0");
    p(px + 3, py + 12, 1, 3, "#3d2a1c");
  }
}

function walkFrame(pr) {
  if (REDUCE || !pr.target) return 0;
  return (pr.walkT * 7 | 0) % 3;
}

function idleBob(pr) {
  if (REDUCE) return 0;
  if (pr.phase === "idle" && !pr.target) {
    return Math.sin(animT * 3 + (pr.walkT || 0)) > 0.35 ? 1 : 0;
  }
  return 0;
}

function drawPerson(pr) {
  const s = pr.staff;
  if (s.kind === "terry" || s.kind === "reggie") {
    drawRobot(pr);
    return;
  }
  if (s.kind === "kenneth") {
    drawKenneth(pr);
    return;
  }
  const cele = pr.phase === "celebrating";
  const walk = pr.phase === "idle" || pr.phase === "to-desk";
  const work = pr.phase === "working";
  const moving = !REDUCE && walk && pr.target;
  const frame = moving ? walkFrame(pr) : 0;
  const jump = (!REDUCE && cele) ? Math.round(Math.abs(Math.sin(pr.celeT * 10)) * 8) : 0;
  const bob = moving ? (frame === 1 ? 0 : 1) : idleBob(pr);
  const x = Math.round(pr.x);
  const y = Math.round(pr.y - jump + bob);
  const left = pr.facing === "l";
  shadow(x - 8, Math.round(pr.y) + 2, 16, 5);

  if (work) {
    /* Seated, back to us, facing the monitor. */
    box(x - 8, y - 14, 16, 14, s.body, "#141414");
    p(x - 7, y - 13, 6, 4, lite(s.body, 0.2));
    if (s.id === "frank") p(x - 8, y - 8, 16, 8, s.accent);
    /* head from behind */
    box(x - 6, y - 26, 12, 12, s.skin, "#141414");
    p(x - 5, y - 25, 4, 4, lite(s.skin, 0.2));
    if (s.prop === "hat") {
      box(x - 8, y - 30, 16, 6, s.accent, "#141414");
      p(x - 6, y - 33, 12, 4, s.accent);
      p(x - 5, y - 32, 4, 2, lite(s.accent, 0.3));
    } else {
      p(x - 6, y - 30, 12, 6, s.hair);
      p(x - 6, y - 30, 12, 1, "#141414");
    }
    if (s.prop === "headphones") {
      p(x - 9, y - 24, 3, 7, "#111");
      p(x + 6, y - 24, 3, 7, "#111");
      p(x - 9, y - 30, 18, 3, "#111");
    }
    if (s.prop === "cloud") {
      p(x - 8, y - 40, 7, 5, s.accent);
      p(x - 5, y - 44, 11, 6, s.accent);
      p(x + 4, y - 39, 7, 5, s.accent);
    }
    if (s.prop === "bird") {
      p(x + 6, y - 32, 8, 5, s.accent);
      p(x + 13, y - 31, 3, 2, "#e07a2f");
    }
    const tap = (!REDUCE && ((pr.typeT * 6 | 0) % 2)) ? 1 : 0;
    p(x - 12, y - 9, 6, 3, s.skin);
    p(x + 6, y - 9 + tap, 6, 3, s.skin);
    return;
  }

  /* legs + shoes, 3-frame walk */
  const shoe = "#2a1c14";
  const trouser = dark(s.body, 0.45);
  if (frame === 1) {
    p(x - 5, y - 10, 5, 10, trouser);
    p(x + 1, y - 10, 5, 10, trouser);
    p(x - 5, y, 5, 3, shoe);
    p(x + 1, y, 5, 3, shoe);
  } else if (frame === 2) {
    p(x - 6, y - 8, 5, 8, trouser);
    p(x + 2, y - 12, 5, 12, trouser);
    p(x - 7, y, 6, 3, shoe);
    p(x + 2, y, 5, 3, shoe);
  } else {
    p(x - 6, y - 12, 5, 12, trouser);
    p(x + 2, y - 8, 5, 8, trouser);
    p(x - 6, y, 5, 3, shoe);
    p(x + 3, y, 6, 3, shoe);
  }
  /* body */
  box(x - 7, y - 24, 14, 15, s.body, "#141414");
  p(x - 6, y - 23, 6, 5, lite(s.body, 0.22));
  p(x + 3, y - 16, 3, 6, dark(s.body, 0.18));
  if (s.id === "frank") {
    p(x - 7, y - 16, 14, 7, s.accent);
    p(x - 6, y - 16, 12, 1, lite(s.accent, 0.25));
  }
  /* head + face */
  box(x - 6, y - 36, 12, 12, s.skin, "#141414");
  p(x - 5, y - 35, 5, 4, lite(s.skin, 0.25));
  p(x + 2, y - 30, 3, 5, dark(s.skin, 0.12));
  p(x - 6, y - 39, 12, 5, s.hair);
  p(x - 6, y - 39, 12, 1, "#141414");
  p(x - 6, y - 39, 1, 5, "#141414");
  p(x + 5, y - 39, 1, 5, "#141414");
  if (s.prop === "hat") {
    box(x - 8, y - 41, 16, 6, s.accent, "#141414");
    p(x - 6, y - 44, 12, 4, s.accent);
    p(x - 5, y - 43, 4, 2, lite(s.accent, 0.3));
  }
  if (s.prop === "headphones") {
    p(x - 8, y - 32, 3, 7, s.accent);
    p(x + 5, y - 32, 3, 7, s.accent);
    p(x - 8, y - 38, 16, 3, "#111");
  }
  /* eyes and mouth */
  p(x - 3, y - 31, 3, 3, "#fff");
  p(x + 2, y - 31, 3, 3, "#fff");
  p(x + (left ? -3 : -2), y - 30, 2, 2, "#141414");
  p(x + (left ? 2 : 3), y - 30, 2, 2, "#141414");
  if (pr.glanceT > 0) {
    p(x + (left ? -9 : 7), y - 40, 2, 4, "#8ec8e6");
  } else {
    p(x - 1, y - 26, 4, 1, "#c47a7a");
  }
  if (s.prop === "cloud") {
    p(x - 8, y - 50, 7, 5, s.accent);
    p(x - 5, y - 54, 11, 6, s.accent);
    p(x + 4, y - 49, 7, 5, s.accent);
    p(x - 1, y - 46, 4, 3, s.accent);
  }
  if (s.prop === "bird") {
    const bx = left ? x - 12 : x + 6;
    p(bx, y - 44, 8, 5, s.accent);
    p(bx + (left ? -3 : 7), y - 43, 3, 2, "#e07a2f");
  }
  const held = ["clipboard", "envelope", "book", "joystick", "basket", "spool", "duck", "quill"];
  const armX = left ? x - 11 : x + 7;
  p(armX, y - 22, 4, 10, s.skin);
  if (held.includes(s.prop)) drawProp(left ? x - 16 : x + 9, y - 20, s.prop, pr.facing);
  if (cele) {
    p(x - 12, y - 36 - Math.min(jump, 4), 4, 8, s.skin);
    p(x + 8, y - 38 - Math.min(jump, 4), 4, 8, s.skin);
  }
}

function drawKenneth(pr) {
  const cele = pr.phase === "celebrating";
  const walk = pr.phase === "idle" || pr.phase === "to-desk";
  const work = pr.phase === "working";
  const moving = !REDUCE && walk && pr.target;
  const frame = moving ? walkFrame(pr) : 0;
  const jump = (!REDUCE && cele) ? Math.round(Math.abs(Math.sin(pr.celeT * 10)) * 8) : 0;
  const bob = moving ? (frame === 1 ? 0 : 1) : idleBob(pr);
  const x = Math.round(pr.x);
  const y = Math.round(pr.y - jump + bob);
  const left = pr.facing === "l";
  const metal = "#e8dcc8";
  const vest = "#1a1a1a";
  const shirt = "#f4f0e4";
  const cap = "#1a1a1a";
  const red = "#d1202f";
  const silver = "#9a968c";
  shadow(x - 8, Math.round(pr.y) + 2, 16, 5);

  if (work) {
    /* Seated, back to us: black vest, cream collar, cap and a side-feather. */
    box(x - 8, y - 14, 16, 14, vest, "#141414");
    p(x - 4, y - 14, 8, 4, shirt);
    p(x - 1, y - 14, 2, 7, red);
    box(x - 6, y - 28, 12, 14, metal, "#141414");
    p(x - 5, y - 27, 5, 5, lite(metal, 0.22));
    p(x - 9, y - 22, 3, 6, "#2a2a2a");
    p(x + 6, y - 22, 3, 6, "#2a2a2a");
    /* flat cap from behind, 1px red brim, feather off to the left */
    p(x - 6, y - 34, 12, 3, cap);
    box(x - 8, y - 32, 16, 5, cap, "#141414");
    p(x - 7, y - 28, 14, 1, red);
    p(x - 11, y - 42, 2, 10, red);
    p(x - 10, y - 40, 1, 4, lite(red, 0.25));
    p(x - 12, y - 38, 1, 3, dark(red, 0.15));
    const tap = (!REDUCE && ((pr.typeT * 6 | 0) % 2)) ? 1 : 0;
    p(x - 12, y - 9, 6, 3, silver);
    p(x + 6, y - 9 + tap, 6, 3, silver);
    return;
  }

  const shoe = "#2a1c14";
  const trouser = "#2a2a2a";
  if (frame === 1) {
    p(x - 5, y - 10, 5, 10, trouser);
    p(x + 1, y - 10, 5, 10, trouser);
    p(x - 5, y, 5, 3, shoe);
    p(x + 1, y, 5, 3, shoe);
  } else if (frame === 2) {
    p(x - 6, y - 8, 5, 8, trouser);
    p(x + 2, y - 12, 5, 12, trouser);
    p(x - 7, y, 6, 3, shoe);
    p(x + 2, y, 5, 3, shoe);
  } else {
    p(x - 6, y - 12, 5, 12, trouser);
    p(x + 2, y - 8, 5, 8, trouser);
    p(x - 6, y, 5, 3, shoe);
    p(x + 3, y, 6, 3, shoe);
  }

  /* black waistcoat over a cream shirt, red tie, Q badge */
  box(x - 7, y - 24, 14, 15, vest, "#141414");
  p(x - 2, y - 24, 4, 5, shirt);
  p(x - 1, y - 24, 2, 9, red);
  p(x, y - 23, 1, 3, lite(red, 0.25));
  p(x + 3, y - 16, 3, 3, red);
  p(x + 4, y - 15, 1, 1, "#f4f0e4");

  /* cream robot head, panel line, ear-cups with a red centre */
  box(x - 6, y - 38, 12, 14, metal, "#141414");
  p(x - 5, y - 37, 5, 5, lite(metal, 0.25));
  p(x - 5, y - 31, 10, 1, dark(metal, 0.18));
  p(x - 9, y - 32, 3, 6, "#2a2a2a");
  p(x + 6, y - 32, 3, 6, "#2a2a2a");
  p(x - 8, y - 30, 2, 2, red);
  p(x + 7, y - 30, 2, 2, red);

  /* thin round glasses, pupils follow facing / a glance at the machine */
  const glance = pr.glanceT > 0;
  p(x - 4, y - 32, 4, 3, "#fff");
  p(x + 1, y - 32, 4, 3, "#fff");
  p(x - 5, y - 33, 6, 1, "#141414");
  p(x - 5, y - 29, 6, 1, "#141414");
  p(x - 5, y - 33, 1, 5, "#141414");
  p(x, y - 33, 1, 5, "#141414");
  p(x, y - 33, 6, 1, "#141414");
  p(x, y - 29, 6, 1, "#141414");
  p(x + 5, y - 33, 1, 5, "#141414");
  const px1 = x + (left ? -3 : -2) + (glance && !left ? 1 : 0);
  const px2 = x + (left ? 2 : 3) + (glance && !left ? 1 : 0);
  p(px1, y - 31, 2, 2, "#141414");
  p(px2, y - 31, 2, 2, "#141414");
  p(x - 1, y - 26, 3, 1, "#141414");

  /* black flat cap, one-pixel red brim, feather off to the left */
  p(x - 6, y - 44, 12, 3, cap);
  p(x - 5, y - 43, 4, 2, "#2e2e2e");
  box(x - 8, y - 42, 16, 5, cap, "#141414");
  p(x - 7, y - 38, 14, 1, red);
  p(x - 11, y - 52, 2, 11, red);
  p(x - 10, y - 50, 1, 4, lite(red, 0.25));
  p(x - 12, y - 48, 1, 4, dark(red, 0.15));

  if (glance) p(x + (left ? -10 : 8), y - 48, 2, 4, "#8ec8e6");
  const armX = left ? x - 11 : x + 7;
  p(armX, y - 22, 4, 10, silver);
  drawProp(left ? x - 16 : x + 9, y - 20, "clipboard", pr.facing);
  if (cele) {
    p(x - 12, y - 36 - Math.min(jump, 4), 4, 8, silver);
    p(x + 8, y - 38 - Math.min(jump, 4), 4, 8, silver);
  }
}

function drawRobot(pr) {
  const s = pr.staff;
  const terry = s.kind === "terry";
  const cele = pr.phase === "celebrating";
  const walk = pr.phase === "idle" || pr.phase === "to-desk";
  const work = pr.phase === "working";
  const moving = !REDUCE && walk && pr.target;
  const frame = moving ? walkFrame(pr) : 0;
  const jump = (!REDUCE && cele) ? Math.round(Math.abs(Math.sin(pr.celeT * 10)) * 8) : 0;
  const bob = moving ? (frame === 1 ? 0 : 1) : idleBob(pr);
  const x = Math.round(pr.x);
  const y = Math.round(pr.y - jump + bob);
  const left = pr.facing === "l";
  const metal = terry ? "#d8d4c8" : "#ccc8bc";
  const vest = "#b81c24";
  const shirt = "#f4f0e4";
  shadow(x - 8, Math.round(pr.y) + 2, 16, 5);

  if (work) {
    box(x - 8, y - 14, 16, 14, vest, "#141414");
    p(x - 4, y - 14, 8, 4, shirt);
    if (terry) p(x - 1, y - 14, 2, 8, "#141414");
    else {
      /* bow tie peek */
      p(x - 3, y - 14, 6, 3, "#141414");
    }
    if (terry) {
      box(x - 8, y - 28, 16, 14, metal, "#141414");
      p(x - 7, y - 27, 6, 5, lite(metal, 0.25));
      p(x - 1, y - 34, 2, 6, metal);
      p(x - 3, y - 37, 6, 4, "#d1202f");
      p(x - 2, y - 36, 2, 2, lite("#d1202f", 0.3));
      p(x - 6, y - 23, 5, 5, "#fff");
      p(x + 2, y - 23, 5, 5, "#fff");
      p(x - 5, y - 22, 3, 3, "#141414");
      p(x + 3, y - 22, 3, 3, "#141414");
      p(x - 4, y - 17, 8, 2, "#141414");
    } else {
      box(x - 6, y - 32, 12, 18, metal, "#141414");
      p(x - 5, y - 31, 5, 6, lite(metal, 0.25));
      p(x - 1, y - 36, 2, 5, metal);
      p(x - 4, y - 24, 4, 3, "#fff");
      p(x + 2, y - 24, 4, 3, "#fff");
      p(x - 3, y - 23, 2, 2, "#141414");
      p(x + 3, y - 23, 2, 2, "#141414");
      /* monocle */
      box(x + 1, y - 26, 7, 7, "#14141400", "#141414");
      p(x + 1, y - 26, 7, 1, "#141414");
      p(x + 1, y - 26, 1, 7, "#141414");
      p(x + 7, y - 26, 1, 7, "#141414");
      p(x + 1, y - 20, 7, 1, "#141414");
    }
    const tap = (!REDUCE && ((pr.typeT * 6 | 0) % 2)) ? 1 : 0;
    p(x - 12, y - 9, 6, 3, metal);
    p(x + 6, y - 9 + tap, 6, 3, metal);
    return;
  }

  /* legs */
  const thigh = "#6a6860";
  if (frame === 2) {
    p(x - 6, y - 8, 5, 8, thigh);
    p(x + 2, y - 13, 5, 13, thigh);
  } else if (frame === 1) {
    p(x - 5, y - 10, 5, 10, thigh);
    p(x + 1, y - 10, 5, 10, thigh);
  } else {
    p(x - 6, y - 13, 5, 13, thigh);
    p(x + 2, y - 8, 5, 8, thigh);
  }
  p(x - 6, y, 5, 3, "#2a1c14");
  p(x + 2, y, 5, 3, "#2a1c14");

  if (terry) {
    box(x - 8, y - 24, 16, 15, vest, "#141414");
    p(x - 4, y - 24, 8, 5, shirt);
    p(x - 1, y - 24, 2, 9, "#141414");
    p(x - 7, y - 23, 5, 4, lite(vest, 0.2));
    /* box head */
    box(x - 9, y - 40, 18, 16, metal, "#141414");
    p(x - 8, y - 39, 7, 6, lite(metal, 0.28));
    p(x + 5, y - 34, 3, 8, dark(metal, 0.15));
    /* antenna, red ball */
    p(x - 1, y - 46, 2, 6, metal);
    box(x - 3, y - 50, 6, 5, "#d1202f", "#141414");
    p(x - 2, y - 49, 2, 2, "#f26a6a");
    /* ear discs */
    p(x - 12, y - 36, 3, 8, "#9a968c");
    p(x + 9, y - 36, 3, 8, "#9a968c");
    /* face: big cheerful eyes and smile */
    p(x - 6, y - 35, 6, 6, "#fff");
    p(x + 2, y - 35, 6, 6, "#fff");
    p(x + (left ? -5 : -4), y - 33, 3, 3, "#141414");
    p(x + (left ? 3 : 4), y - 33, 3, 3, "#141414");
    p(x - 4, y - 28, 10, 2, "#141414");
    p(x - 3, y - 27, 8, 2, "#141414");
    p(x - 2, y - 26, 6, 1, "#141414");
  } else {
    /* taller, slimmer */
    box(x - 7, y - 26, 14, 17, vest, "#141414");
    p(x - 4, y - 26, 8, 5, shirt);
    p(x - 3, y - 26, 6, 3, "#141414"); /* bow tie */
    p(x - 1, y - 27, 2, 2, "#141414");
    p(x - 6, y - 25, 4, 4, lite(vest, 0.2));
    /* pocket square */
    p(x + 3, y - 18, 3, 3, "#f4f0e4");
    /* long head */
    box(x - 6, y - 46, 12, 20, metal, "#141414");
    p(x - 5, y - 45, 5, 7, lite(metal, 0.28));
    p(x + 3, y - 38, 2, 10, dark(metal, 0.15));
    p(x - 1, y - 50, 2, 5, metal);
    p(x - 9, y - 40, 3, 7, "#9a968c");
    p(x + 6, y - 40, 3, 7, "#9a968c");
    /* lidded eyes + small smile */
    p(x - 4, y - 38, 4, 3, "#fff");
    p(x + 2, y - 38, 4, 3, "#fff");
    p(x - 3, y - 37, 2, 2, "#141414");
    p(x + 3, y - 37, 2, 2, "#141414");
    p(x - 4, y - 39, 4, 1, "#141414");
    p(x + 2, y - 39, 4, 1, "#141414");
    /* monocle */
    p(x + 1, y - 40, 7, 1, "#141414");
    p(x + 1, y - 40, 1, 7, "#141414");
    p(x + 7, y - 40, 1, 7, "#141414");
    p(x + 1, y - 34, 7, 1, "#141414");
    p(x + 8, y - 34, 1, 8, "#141414");
    p(x - 2, y - 32, 6, 1, "#141414");
  }
  const armX = left ? x - 12 : x + 8;
  p(armX, y - 22, 4, 10, metal);
  if (pr.glanceT > 0) p(x + (left ? -9 : 8), y - 50, 2, 4, "#8ec8e6");
  drawProp(left ? x - 16 : x + 10, y - 22, "quill", pr.facing);
  if (cele) {
    p(x - 13, y - 38 - Math.min(jump, 4), 4, 8, metal);
    p(x + 9, y - 40 - Math.min(jump, 4), 4, 8, metal);
  }
}

function drawArthur(c) {
  const bob = (!REDUCE && c.target && c.wait <= 0) ? ((c.walkT * 7 | 0) % 2) : 0;
  const x = Math.round(c.x), y = Math.round(c.y + bob);
  shadow(x - 10, y + 3, 22, 5);
  const cream = "#e8d6b8";
  const hi = "#f4efe4";
  const point = "#6b5348";
  const pointD = "#4a3a34";
  /* fluffy cream body */
  p(x - 11, y - 11, 22, 14, cream);
  p(x - 9, y - 12, 18, 3, hi);
  p(x - 6, y - 9, 12, 9, "#f4efe8");
  /* head */
  p(x - 7, y - 21, 14, 12, cream);
  p(x - 6, y - 22, 5, 6, point);
  p(x + 2, y - 22, 5, 6, point);
  p(x - 6, y - 18, 12, 9, point);
  p(x - 5, y - 13, 10, 4, cream);
  /* blue Ragdoll eyes */
  p(x - 4, y - 16, 4, 4, "#7ec8e8");
  p(x + 1, y - 16, 4, 4, "#7ec8e8");
  p(x - 3, y - 15, 2, 2, "#141414");
  p(x + 2, y - 15, 2, 2, "#141414");
  p(x - 3, y - 16, 1, 1, "#f4f0e4");
  p(x + 2, y - 16, 1, 1, "#f4f0e4");
  p(x - 2, y - 11, 4, 2, "#c48a8a");
  const tailL = c.facing === "l";
  p(x + (tailL ? 9 : -16), y - 8, 11, 6, point);
  p(x + (tailL ? 15 : -20), y - 4, 8, 9, pointD);
  p(x - 10, y, 6, 4, cream);
  p(x + 4, y, 6, 4, cream);
  p(x - 10, y + 2, 5, 3, point);
  p(x + 5, y + 2, 5, 3, point);
}

function drawDexter(c) {
  const bob = (!REDUCE && c.target && c.wait <= 0) ? ((c.walkT * 7 | 0) % 2) : 0;
  const x = Math.round(c.x), y = Math.round(c.y + bob);
  shadow(x - 11, y + 3, 24, 5);
  /* huge grey ruff */
  p(x - 13, y - 12, 26, 15, "#b8b0a8");
  p(x - 11, y - 14, 22, 6, "#c8c0b8");
  p(x - 8, y - 10, 16, 10, "#d0c8c0");
  /* dark face peeking */
  p(x - 6, y - 20, 13, 12, "#1a1210");
  p(x - 7, y - 24, 6, 6, "#1a1210");
  p(x + 2, y - 24, 6, 6, "#1a1210");
  /* amber eyes */
  p(x - 4, y - 16, 4, 4, "#e6c84a");
  p(x + 2, y - 16, 4, 4, "#e6c84a");
  p(x - 3, y - 15, 2, 2, "#141414");
  p(x + 3, y - 15, 2, 2, "#141414");
  p(x - 3, y - 16, 1, 1, "#fff");
  p(x + 3, y - 16, 1, 1, "#fff");
  p(x - 1, y - 11, 4, 2, "#1a1210");
  const tailL = c.facing === "l";
  p(x + (tailL ? 10 : -18), y - 8, 12, 7, "#2a2420");
  p(x + (tailL ? 16 : -22), y - 4, 8, 8, "#1a1210");
  p(x - 10, y, 6, 4, "#1a1210");
  p(x + 5, y, 6, 4, "#1a1210");
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
      const ly = d.y + 28;
      p(d.cx - w / 2, ly, w, 7, "#f4f0e4");
      p(d.cx - w / 2, ly, w, 1, "#3d2a1c");
      drawLabel(d.cx, ly + 1, d.staff.tag, "#141414");
    });
  }
  if (EMBED) ctx.restore();
}

function applyShareDemo() {
  if (demoAppliedWorking) return;
  const working = ["kenneth", "terry", "george", "percy", "tweety", "archie", "filament"];
  const places = {
    reggie: { x: 54, y: FLOOR_Y + 32, facing: "r", flavour: "Off to the kettle, diplomatically" },
    frank: { x: 142, y: 592, facing: "l", flavour: "Frank's domain, the canteen" },
    boris: { x: 222, y: 592, facing: "r", flavour: "Lunch, or the idea of lunch" },
    oddly: { x: 174, y: 610, facing: "l", flavour: "A diplomatic bacon sandwich" },
    brian: { x: 400, y: 580, facing: "r", flavour: "Brian's natural haunt" },
    clive: { x: 510, y: 604, facing: "l", flavour: "Having a listen" }
  };
  people.forEach(p => {
    p.target = null;
    p.waypoints = [];
    p.pendingDest = null;
    if (working.includes(p.id)) {
      setWant(p, "working");
      p.x = p.desk.chairX;
      p.y = p.desk.chairY;
      p.phase = "working";
      p.facing = "r";
    } else {
      setWant(p, "idle");
      const spot = places[p.id];
      if (spot) {
        p.x = spot.x;
        p.y = spot.y;
        p.facing = spot.facing;
        p.phase = "idle";
        p.wait = 9999;
        p.flavour = spot.flavour;
      }
    }
  });
  cats.forEach(c => {
    c.target = null;
    c.wait = 9999;
  });
  paintBoard();
  demoAppliedWorking = true;
}

function applyDemo(now) {
  if (DEMO === "share") {
    applyShareDemo();
    return;
  }
  const george = people.find(p => p.id === "george");
  if (!george) return;
  if (DEMO === "working") {
    if (!demoAppliedWorking) {
      const k = people.find(p => p.id === "kenneth") || george;
      people.forEach(p => { if (p.id !== k.id) setWant(p, "idle"); });
      setWant(k, "working");
      k.x = k.desk.chairX;
      k.y = k.desk.chairY;
      k.phase = "working";
      k.facing = "r";
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
    /* Pose Kenneth idle, facing us, in his office, so the new portrait can be checked. */
    if (!demoAppliedIdle) {
      const k = people.find(p => p.id === "kenneth") || george;
      people.forEach(p => { if (p.id !== k.id) setWant(p, "idle"); });
      setWant(k, "idle");
      k.target = null;
      k.waypoints = [];
      k.pendingDest = null;
      k.x = k.desk.chairX;
      k.y = k.desk.chairY + 6;
      k.phase = "idle";
      k.facing = "r";
      k.wait = 9999;
      k.glanceT = 0;
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
  animT = now;
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
  cats.push(makeCat("arthur", 320, FLOOR_Y + 164));
  cats.push(makeCat("dexter", 360, FLOOR_Y + 270));
  if (DEMO && demoNote) {
    demoNote.hidden = false;
    feedOffline = false;
    if (DEMO === "share") {
      demoNote.textContent = "Demo mode — a posed snapshot of the floor, for the share picture.";
    }
  }
  buildBoard();
  if (DEMO === "working" || DEMO === "celebrating" || DEMO === "1" || DEMO === "share") applyDemo(DEMO === "1" ? 0 : 10);
  drawFrame();
  if (!DEMO) pullFeed();
  watchEmbedVisibility();
  resumeLoop();
}

boot();

function setupOfficeShare() {
  const root = document.getElementById("office-share");
  if (!root) return;
  const pageUrl = "https://williamgeorgeworks.co.uk/office.html";
  const title = "The virtual office | William George Works";
  const text = "Have a nosy round the William George Works office: one human, three machines, six cats and a lot of bots.";
  const message = text + " " + pageUrl;
  const wa = document.getElementById("office-share-wa");
  const x = document.getElementById("office-share-x");
  const native = document.getElementById("office-share-native");
  const copy = document.getElementById("office-share-copy");
  const copied = document.getElementById("office-share-copied");
  if (wa) {
    wa.href = "https://wa.me/?text=" + encodeURIComponent(message);
    wa.setAttribute("aria-label", "Share the office on WhatsApp");
  }
  if (x) {
    x.href = "https://x.com/intent/post?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(pageUrl);
    x.setAttribute("aria-label", "Share the office on X");
  }
  const img = document.getElementById("office-share-image");
  if (img) img.setAttribute("aria-label", "Open the office snapshot image");
  if (native && typeof navigator.share === "function") {
    native.hidden = false;
    native.setAttribute("aria-label", "Share the office with this device");
    native.addEventListener("click", function () {
      navigator.share({ title: title, text: text, url: pageUrl }).catch(function () {});
    });
  }
  if (copy) {
    copy.setAttribute("aria-label", "Copy the link to the office");
    copy.addEventListener("click", function () {
      function done(ok) {
        const label = ok ? "Copied!" : "Copy failed";
        copy.textContent = label;
        if (copied) {
          copied.hidden = !ok;
          copied.textContent = label;
        }
        setTimeout(function () {
          copy.textContent = "Copy link";
          if (copied) copied.hidden = true;
        }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pageUrl).then(function () { done(true); }, function () { done(false); });
        return;
      }
      try {
        const t = document.createElement("textarea");
        t.value = pageUrl;
        t.setAttribute("readonly", "");
        t.style.position = "fixed";
        t.style.opacity = "0";
        document.body.appendChild(t);
        t.select();
        const ok = document.execCommand("copy");
        t.remove();
        done(ok);
      } catch (err) {
        done(false);
      }
    });
  }
}

setupOfficeShare();

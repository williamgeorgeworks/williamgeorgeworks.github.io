/* Virtual office: private offices, a games nook, an open floor of desks, the kettle
   corner, a lounge, a canteen, a music room, and the machine.
   To add or remove someone (including Kenneth, Terrance or Reginald), edit STAFF only.

   How it hangs together:
   - STAFF is the roster. The live feed maps each id to "working" or "idle", nothing more.
   - Working people walk to their own desk and sit there.
   - Idle people drift between SPOTS (kettle, darts, arcade, rod rack, sofa, canteen,
     music room, printer...) and do a little something at each one.
   - The still scenery is painted once into an off-screen sheet; each frame only redraws
     the moving bits, at about 30 frames a second, and stops when the tab is hidden,
     the office is scrolled out of view, or the visitor prefers reduced motion. */

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
    body: "#5a3d7a", skin: "#f3d2b3", hair: "#f2e6a0", accent: "#f2c14e" },
  { id: "rupert", name: "Reel Rupert", tag: "Rupert", role: "Video", prop: "reel",
    body: "#241818", skin: "#e8c4a0", hair: "#5a2010", accent: "#d4af37" },
  { id: "penny", name: "Penny Pincher", tag: "Penny", role: "Money", prop: "coin",
    body: "#1a5c3a", skin: "#f0c9a0", hair: "#3b2a1a", accent: "#d4af37" },
  /* Kraken Keith sits next to Penny: the money corner. Feed key "keith" (label for-keith). */
  { id: "keith", name: "Kraken Keith", tag: "Keith", role: "Crypto watch", prop: "tablet", kind: "keith",
    body: "#1e2a4a", skin: "#8a5cc4", hair: "#8a5cc4", accent: "#d4af37" },
  { id: "sheila", name: "Shifty Sheila", tag: "Sheila", role: "Rota", prop: "whistle",
    body: "#c45c26", skin: "#f3d2b3", hair: "#5a2010", accent: "#f2d36b" },
  { id: "sarge", name: "Sergeant Statute", tag: "Sarge", role: "Compliance", prop: "badge",
    body: "#1b2b1a", skin: "#e8c4a0", hair: "#2a2a2a", accent: "#c0c0c0" },
  { id: "mona", name: "Mona Megaphone", tag: "Mona", role: "Marketing", prop: "megaphone",
    body: "#7a1a5c", skin: "#f3d2b3", hair: "#1a1a1a", accent: "#e040fb" },
  { id: "hettie", name: "Hettie Homefront", tag: "Hettie", role: "Home", prop: "teacup",
    body: "#7a4a2a", skin: "#f0c9a0", hair: "#6a3a20", accent: "#c5a572" },
  { id: "stockley", name: "Stockley Shelves", tag: "Stockley", role: "Stock", prop: "crate",
    body: "#a8875a", skin: "#e8c4a0", hair: "#c45c26", accent: "#6b4a28" },
  { id: "grant", name: "Grant Grabber", tag: "Grant", role: "Grants", prop: "grant",
    body: "#5a3d20", skin: "#e8c4a0", hair: "#2a1a10", accent: "#4c1d95" },
  { id: "vinnie", name: "Vinnie Views", tag: "Vinnie", role: "YouTube", prop: "trophy",
    body: "#1a1a1a", skin: "#e8c4a0", hair: "#1a1a1a", accent: "#c81e3a" }
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

/* ---------- Floor plan (640 x 640, drawn at whole-number scales only) ----------
   Top band:    three private offices, and the games nook (rod rack, arcade, darts).
   Middle:      the open floor, twenty desks in four rows (Kraken Keith took the printer's); on the right the kettle
                corner and the lounge.
   Bottom band: the canteen, the music room, and the machine's corner.
   People walk along lanes (the aisles) rather than straight through the furniture. */
const W = 640, H = 640;
const TOP_H = 118;              /* bottom wall of the offices and the nook */
const AISLE_X = 440;            /* the main walkway, top to bottom */
const TOP_LANE = 126;           /* walkway under the offices and the nook */
const BOTTOM_LANE = 440;        /* walkway above the canteen and the music room */
const DESK_ROWS = [150, 220, 290, 360];
const DESK_SLOT = 58, DESK_GAP = 22, DESK_X0 = 30;
const FLOOR_BLOCK = { x: 12, y: 134, w: 420, h: 298 };
const BAND_Y = 452;             /* top of the canteen, music room and machine corner */
const NOOK = { x: 410, y: 2, w: 222, h: TOP_H - 2 };
const KETTLE = { x: 452, y: 132, w: 180, h: 102 };
const LOUNGE = { x: 452, y: 246, w: 180, h: 190 };
const MACHINE_CORNER = { x: 516, y: BAND_Y, w: 116, h: H - BAND_Y - 8 };
const MACHINE = { x: 544, y: 532, w: 78, h: 66, cx: 583, cy: 565 };
const BOARD = { cx: 606, cy: 20, r: 11 };        /* the dartboard */
const CABINET = { x: 512, y: 12, w: 32, h: 66 }; /* the arcade cabinet */
const SOFA = { x: 472, y: 280, w: 140, h: 50 };
const SIT_DROP = 6;
const FRAME_MS = 1000 / 30;

let viewScale = 1;
const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const params = new URLSearchParams(location.search);
const DEMO = params.get("demo") || "";
const NIGHT_PARAM = (params.get("night") || "").toLowerCase();
const SEASON_PARAM = (params.get("season") || "").toLowerCase();
const MACHINE_PARAM = (params.get("machine") || "").toLowerCase();
const RAIN_PARAM = (params.get("rain") || "").toLowerCase();
const EGG_PARAM = (params.get("egg") || (params.get("ferret") === "1" ? "ferret" : "")).toLowerCase();
const EMBED = params.get("embed") === "1" || (!document.getElementById("office-canvas") && !!document.getElementById("office-live"));
const EMBED_CAM_X = 0;
const EMBED_CAM_Y = 60;
const EMBED_W = 640;
const EMBED_H = 240;

if (EMBED && params.get("embed") === "1") document.documentElement.classList.add("office-embed");

const canvas = document.getElementById("office-canvas") || document.getElementById("office-live");
const screenCtx = canvas ? canvas.getContext("2d") : null;
let ctx = screenCtx;            /* swapped to the scenery sheet while that is painted */
const boardList = document.getElementById("office-board-list");
const feedNote = document.getElementById("office-feed-note");
const demoNote = document.getElementById("office-demo-note");

const desks = [];
const rooms = [];
const people = [];
const cats = [];
const spots = [];
let printerStation = null;
let sceneSheet = null;
let feedOffline = !OFFICE_FEED_URL && !DEMO;
let lastFeed = 0;
let fetching = false;
let t0 = 0;
let lastTs = 0;
let animT = 0;
let demoAppliedWorking = false;
let demoAppliedIdle = false;

/* What people get up to at each kind of spot. Shown on the status board. */
const PLACE_FLAVOUR = {
  kettle: ["Kettle duty", "Brewing up, strictly medicinal", "Auditing the biscuits", "Third cuppa, for morale"],
  darts: ["Darts, for morale", "Aiming for treble twenty, hitting the wall", "One hundred and eighty, allegedly"],
  arcade: ["Just one more go", "Chasing the high score", "Insert coin, insert excuse"],
  rods: ["Untangling a line, at length", "Admiring the rods", "Describing the one that got away"],
  sofa: ["Resting the eyes", "A strategic sit-down", "On the sofa, thinking hard"],
  lounge: ["Chatting by the plant", "Loitering with intent", "Examining the ceiling for clues"],
  canteen: ["Frank's domain, the canteen", "A diplomatic bacon sandwich", "Chips, for research"],
  music: ["Brian's natural haunt", "Having a listen", "Air guitar, very loud"],
  printer: ["Staring at the printer", "Negotiating with the printer"],
  office: ["Pacing the office, thoughtfully", "Rearranging the pens", "A quiet moment in the office"]
};
/* Little speech bubbles. Kept short: the pixel font is tiny. */
const BUBBLES = {
  kettle: ["TEA?", "BREW!", "BISCUIT?", "WHO'S HAD MY MUG?", "I'LL BE MOTHER", "JUST THE ONE"],
  darts: ["180!", "OOPS", "DOUBLE TOP", "MIDDLES!", "ONE SEVEN FIVE"],
  arcade: ["1UP!", "HI SCORE", "ONE MORE GO", "INSERT EXCUSE"],
  rods: ["THIS BIG", "NIBBLE?"],
  sofa: ["ZZZ", "COMFY", "FIVE MORE MINS"],
  lounge: ["NO WAY", "OOH", "DID YOU HEAR?"],
  canteen: ["CHIPS!", "VINEGAR?", "SCRAPS?", "THE USUAL"],
  printer: ["PC LOAD LETTER", "JAM?", "TILLY AGAIN", "CAT IN PRINTER"],
  music: ["ONE MORE TUNE", "THINNER!", "BAIRD?"],
  office: ["SHH", "GONE ON HOLIDAY"]
};
/* Who tends to head where, when they have the choice. Everyone else picks at random. */
const LIKES = {
  kenneth: ["office"], terry: ["office", "rods"], reggie: ["office", "kettle"],
  frank: ["canteen"], brian: ["music"], archie: ["arcade"], rupert: ["sofa", "arcade"],
  penny: ["kettle"], keith: ["arcade", "kettle"], hettie: ["kettle", "sofa"], sarge: ["darts"], george: ["darts", "kettle"],
  oddly: ["rods"], vinnie: ["arcade"], percy: ["sofa"], boris: ["darts"], clive: ["lounge"],
  filament: ["printer"], stockley: ["printer", "canteen"], tweety: ["kettle"], mona: ["lounge", "music"],
  sheila: ["kettle"], grant: ["canteen"]
};
/* How long people linger at each kind of spot, in seconds: [least, extra]. */
const DWELL = {
  kettle: [12, 12], darts: [16, 14], arcade: [16, 16], rods: [12, 12], sofa: [20, 20], lounge: [10, 10],
  canteen: [16, 14], music: [16, 14], printer: [8, 6], office: [14, 14]
};

function pick(arr, salt) {
  return arr[Math.abs((salt | 0) + arr.length * 3) % arr.length];
}

/* Wall-clock time in Europe/London, including BST when it's on. Used for the
   office clock, Today's Special, and the darts score as the day wears on. */
function ukNow() {
  const parts = {};
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "numeric", minute: "numeric", second: "numeric",
    hourCycle: "h23",
    day: "numeric", month: "numeric", year: "numeric"
  }).formatToParts(new Date()).forEach(p => { parts[p.type] = p.value; });
  return {
    hour: +parts.hour, minute: +parts.minute, second: +parts.second,
    day: +parts.day, month: +parts.month, year: +parts.year
  };
}
function ukDayOfYear() {
  const t = ukNow();
  const md = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (t.year % 4 === 0 && (t.year % 100 !== 0 || t.year % 400 === 0)) md[2] = 29;
  let n = t.day;
  for (let m = 1; m < t.month; m++) n += md[m];
  return n;
}
const CANTEEN_SPECIALS = [
  "CHIP BARM", "MUSHY PEAS", "GRAVY", "SCRAPS", "HADDOCK",
  "PIE AND PEAS", "CURRY SAUCE", "FISH CAKE", "PEA WET",
  "SAUSAGE BARM", "STEAK PUD", "CHIP BUTTY", "SCALLOPS",
  "CHEESE CHIPS", "FISH SUPPER", "GRAVY BARM"
];
function todaySpecial() {
  return CANTEEN_SPECIALS[(ukDayOfYear() - 1) % CANTEEN_SPECIALS.length];
}
/* The wall clock hangs on the office wall, and Arthur naps on the floor under it. */
const CLOCK = { cx: 248, cy: 108, r: 13 };

/* Approximate sunrise and sunset in Blackpool, as clock times, used only for
   the office windows. No network call; dusk is a short band around sunset. */
const SUN = [
  null,
  [8 * 60 + 20, 16 * 60 + 15], [7 * 60 + 40, 17 * 60 + 15], [6 * 60 + 30, 18 * 60 + 10],
  [6 * 60 + 20, 20 * 60 + 10], [5 * 60 + 15, 21 * 60 + 10], [4 * 60 + 40, 21 * 60 + 45],
  [5 * 60 + 0, 21 * 60 + 30], [5 * 60 + 50, 20 * 60 + 30], [6 * 60 + 45, 19 * 60 + 20],
  [7 * 60 + 40, 18 * 60 + 10], [7 * 60 + 40, 16 * 60 + 20], [8 * 60 + 20, 15 * 60 + 50]
];

function currentSky() {
  if (NIGHT_PARAM === "1" || NIGHT_PARAM === "night" || NIGHT_PARAM === "late") return "night";
  if (NIGHT_PARAM === "dusk") return "dusk";
  if (NIGHT_PARAM === "0" || NIGHT_PARAM === "day") return "day";
  const t = ukNow();
  const m = t.hour * 60 + t.minute;
  const sun = SUN[t.month] || SUN[1];
  if (m >= sun[1] - 35 && m <= sun[1] + 50) return "dusk";
  if (m >= sun[0] - 30 && m < sun[0] + 25) return "dusk";
  if (m >= sun[0] + 25 && m < sun[1] - 35) return "day";
  return "night";
}
function isLateHours() {
  if (NIGHT_PARAM === "1" || NIGHT_PARAM === "night" || NIGHT_PARAM === "late") return true;
  if (NIGHT_PARAM === "0" || NIGHT_PARAM === "day" || NIGHT_PARAM === "dusk") return false;
  const t = ukNow();
  const m = t.hour * 60 + t.minute;
  return m >= 22 * 60 || m < 6 * 60;
}
function currentSeason() {
  if (SEASON_PARAM === "december" || SEASON_PARAM === "xmas" || SEASON_PARAM === "christmas") return "december";
  if (SEASON_PARAM === "halloween") return "halloween";
  if (SEASON_PARAM === "none" || SEASON_PARAM === "0" || SEASON_PARAM === "off") return "none";
  const t = ukNow();
  if (t.month === 12) return "december";
  if (t.month === 10 && t.day >= 24) return "halloween";
  return "none";
}
function nightOwl() {
  if (!isLateHours() || !people.length) return null;
  const working = people.filter(p => p.want === "working");
  if (working.length) return working[0];
  /* In the posed ?demo=1, Kenneth is standing for his portrait, so he is not the night owl. */
  const owls = ["keith", "george", "rupert", "vinnie", "percy", "kenneth"];
  const skip = (DEMO === "1") ? "kenneth" : "";
  const list = owls.filter(id => id !== skip);
  const id = list[(ukDayOfYear() - 1) % list.length];
  return people.find(p => p.id === id) || people[0];
}
function isLateSitting(pr) {
  const owl = nightOwl();
  return !!(owl && pr.id === owl.id && pr.want !== "working" && pr.phase !== "celebrating" &&
    !pr.target && pr.desk && Math.hypot(pr.x - pr.desk.chairX, pr.y - pr.desk.chairY) < 4);
}
function shouldSitLate(pr) {
  const owl = nightOwl();
  return !!(owl && pr.id === owl.id && pr.want !== "working" && pr.phase !== "celebrating" && pr.phase !== "to-desk");
}
function isWorkingPose(pr) {
  return pr.phase === "working" || isLateSitting(pr);
}

/* ---- Batch 3: sound, the machine's daily fuss, easter eggs, and rain. ---- */

const SOUND_KEY = "wgw-office-sound";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast?latitude=53.82&longitude=-3.05&current=weather_code,precipitation,is_day";
const WEATHER_MS = 20 * 60 * 1000;
const MACHINE_EVENT_DUR = 3.2;

let audioCtx = null;
let soundWanted = false;
let soundReady = false;
let weatherRainy = false;
let lastWeather = 0;
const windowPanes = [];
let machineEvent = null;
let machineFiredDay = "";
let machineSoundPlayed = false;
let typedKeys = "";
let ferretDash = null;
let dexterTaps = 0;
let dexterTapReset = 0;

function ukDateKey() {
  const t = ukNow();
  return t.year + "-" + t.month + "-" + t.day;
}
function forceMachine() {
  return MACHINE_PARAM === "1" || MACHINE_PARAM === "on" || MACHINE_PARAM === "spark" || MACHINE_PARAM === "yes";
}
function machineEventActive() {
  return !!(machineEvent && machineEvent.t < machineEvent.dur);
}
function machineEventMinute() {
  /* The same UK minute for everyone that day, sometime between ten and five. */
  return 10 * 60 + (ukDayOfYear() * 29) % (7 * 60);
}
function isRaining() {
  if (RAIN_PARAM === "1" || RAIN_PARAM === "rain" || RAIN_PARAM === "on" || RAIN_PARAM === "yes") return true;
  if (RAIN_PARAM === "0" || RAIN_PARAM === "off" || RAIN_PARAM === "none" || RAIN_PARAM === "dry") return false;
  return weatherRainy;
}
function rainFromWeather(data) {
  const cur = data && data.current;
  if (!cur) return false;
  const code = +cur.weather_code;
  const precip = +cur.precipitation;
  /* Rain, drizzle, showers or thunder. Snow is not drawn as rain. */
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99) || (precip > 0 && code >= 51 && code <= 99 && !(code >= 71 && code <= 77) && !(code >= 85 && code <= 86));
}

function soundEnabled() {
  return !EMBED && soundWanted && soundReady && audioCtx && audioCtx.state === "running" && !document.hidden;
}
function readSoundPref() {
  try { return localStorage.getItem(SOUND_KEY) === "on"; } catch (err) { return false; }
}
function writeSoundPref(on) {
  try { localStorage.setItem(SOUND_KEY, on ? "on" : "off"); } catch (err) {}
}
function syncSoundButton() {
  const btn = document.getElementById("office-sound");
  if (!btn) return;
  const running = soundEnabled();
  btn.textContent = running ? "Sound on" : "Sound off";
  btn.setAttribute("aria-pressed", running ? "true" : "false");
  btn.setAttribute("data-started", running ? "1" : "0");
  if (running) {
    btn.setAttribute("aria-label", "Office sound is on. Mute the office.");
  } else if (soundWanted && !soundReady) {
    btn.setAttribute("aria-label", "Office sound is off until you press this. You had it on last time; click to start it. Browsers will not let it start by itself.");
  } else {
    btn.setAttribute("aria-label", "Office sound is off. Turn sound on.");
  }
}
function unlockSound() {
  if (EMBED) return Promise.resolve(false);
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return Promise.resolve(false);
    if (!audioCtx) audioCtx = new AC();
    const go = audioCtx.state === "suspended" ? audioCtx.resume() : Promise.resolve();
    return go.then(function () {
      soundReady = audioCtx && audioCtx.state === "running";
      syncSoundButton();
      return soundReady;
    }).catch(function () {
      soundReady = false;
      syncSoundButton();
      return false;
    });
  } catch (err) {
    soundReady = false;
    syncSoundButton();
    return Promise.resolve(false);
  }
}
function playTone(opts) {
  if (!soundEnabled()) return;
  const freq = opts.freq || 440, dur = opts.dur || 0.12, type = opts.type || "sine";
  const vol = opts.vol || 0.05, at = opts.at || 0;
  const t0 = audioCtx.currentTime + at;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (opts.freq2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.freq2), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}
function playNoise(opts) {
  if (!soundEnabled()) return;
  const dur = opts.dur || 0.08, vol = opts.vol || 0.04, at = opts.at || 0;
  const n = Math.max(32, Math.floor(audioCtx.sampleRate * dur));
  const buf = audioCtx.createBuffer(1, n, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const f = audioCtx.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = opts.highpass || 900;
  const g = audioCtx.createGain();
  const t0 = audioCtx.currentTime + at;
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f);
  f.connect(g);
  g.connect(audioCtx.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}
function playUnmuteBlip() {
  playTone({ freq: 520, freq2: 780, dur: 0.09, type: "square", vol: 0.045 });
  playTone({ freq: 780, freq2: 1040, dur: 0.1, type: "square", vol: 0.035, at: 0.08 });
}
function playMachineSound() {
  playTone({ freq: 80, freq2: 130, dur: 0.55, type: "sawtooth", vol: 0.05 });
  playTone({ freq: 70, freq2: 50, dur: 0.85, type: "sawtooth", vol: 0.035, at: 0.2 });
  for (let i = 0; i < 8; i++) {
    playNoise({ dur: 0.05, vol: 0.045, at: 0.16 + i * 0.18, highpass: 1100 + i * 180 });
  }
  playTone({ freq: 1400, freq2: 380, dur: 0.12, type: "square", vol: 0.028, at: 0.4 });
}
function playBoo() {
  playTone({ freq: 180, freq2: 90, dur: 0.35, type: "triangle", vol: 0.06 });
  playTone({ freq: 240, freq2: 80, dur: 0.28, type: "sine", vol: 0.035, at: 0.05 });
}
function playFerretZip() {
  playTone({ freq: 400, freq2: 1200, dur: 0.18, type: "square", vol: 0.04 });
  playTone({ freq: 900, freq2: 400, dur: 0.2, type: "sine", vol: 0.028, at: 0.12 });
}

function setupOfficeSound() {
  const btn = document.getElementById("office-sound");
  const row = document.getElementById("office-sound-row");
  if (EMBED) {
    if (row) row.hidden = true;
    return;
  }
  if (!btn) return;
  soundWanted = readSoundPref();
  syncSoundButton();
  btn.addEventListener("click", function () {
    if (!soundWanted) {
      soundWanted = true;
      writeSoundPref(true);
      unlockSound().then(function (ok) { if (ok) playUnmuteBlip(); });
      return;
    }
    if (!soundReady || !audioCtx || audioCtx.state !== "running") {
      unlockSound().then(function (ok) { if (ok) playUnmuteBlip(); });
      return;
    }
    soundWanted = false;
    writeSoundPref(false);
    soundReady = false;
    if (audioCtx && audioCtx.state === "running") audioCtx.suspend().catch(function () {});
    syncSoundButton();
  });
}

function pullWeather() {
  if (EMBED) return;
  if (RAIN_PARAM) return;
  const now = performance.now();
  if (lastWeather && now - lastWeather < WEATHER_MS - 1000) return;
  lastWeather = now;
  fetch(WEATHER_URL, { cache: "no-store" }).then(function (res) {
    if (!res.ok) return null;
    return res.json();
  }).then(function (data) {
    if (!data) return;
    weatherRainy = rainFromWeather(data);
  }).catch(function () {
    /* Stay as we were. The office does not depend on the weather arriving. */
  });
}

function flinchOffset(who) {
  if (!machineEventActive()) return { x: 0, y: 0 };
  const t = machineEvent.t;
  const dur = machineEvent.dur;
  /* Jump and lean away for most of the fuss, then ease back in the last beat. */
  let shock;
  if (t < 0.12) shock = t / 0.12;
  else if (t < dur - 0.7) shock = 1;
  else shock = Math.max(0, (dur - t) / 0.7);
  const away = who.x < MACHINE.cx ? -1 : 1;
  const shake = REDUCE ? 0 : Math.round(Math.sin(t * 42) * 2 * shock);
  return { x: Math.round(away * 6 * shock) + shake, y: Math.round(-9 * shock) };
}
function startMachineEvent() {
  if (machineEventActive()) return;
  machineEvent = { t: REDUCE && !forceMachine() ? 0.9 : 0, dur: MACHINE_EVENT_DUR };
  machineFiredDay = ukDateKey();
  machineSoundPlayed = false;
  if (soundEnabled()) {
    playMachineSound();
    machineSoundPlayed = true;
  }
  people.forEach(function (p) {
    p.facing = p.x < MACHINE.cx ? "r" : "l";
  });
}
function tickMachineEvent(dt) {
  if (forceMachine() && !machineEvent) startMachineEvent();
  if (!machineEvent) {
    if (document.hidden) return;
    const t = ukNow();
    const m = t.hour * 60 + t.minute;
    if (ukDateKey() !== machineFiredDay && m === machineEventMinute()) startMachineEvent();
    return;
  }
  if (!machineSoundPlayed && soundEnabled() && machineEvent.t < 0.6) {
    playMachineSound();
    machineSoundPlayed = true;
  }
  machineEvent.t += dt;
  if (machineEvent.t >= machineEvent.dur) {
    if (forceMachine()) machineEvent.t = 0.15;
    else machineEvent = null;
  }
}

function startFerretDash() {
  ferretDash = { t: REDUCE ? 0.7 : 0, dur: 1.8 };
  playFerretZip();
  if (REDUCE) { drawFrame(); return; }
  kickEggAnim();
}
function tickEggs(dt) {
  if (ferretDash) {
    if (!(REDUCE && EGG_PARAM === "ferret")) ferretDash.t += dt;
    if (ferretDash.t >= ferretDash.dur) ferretDash = null;
  }
  cats.forEach(function (c) {
    if (c.bubble) {
      c.bubble.t -= dt;
      if (c.bubble.t <= 0) c.bubble = null;
    }
  });
  if (dexterTaps && dexterTapReset) {
    dexterTapReset -= dt;
    if (dexterTapReset <= 0) { dexterTaps = 0; dexterTapReset = 0; }
  }
}
function booDexter() {
  const dex = cats.find(c => c.id === "dexter");
  if (!dex) return;
  dex.bubble = { text: "BOO", t: EGG_PARAM === "boo" ? 9999 : 3.2 };
  dexterTaps = 0;
  dexterTapReset = 0;
  playBoo();
  if (!shouldAnimate()) drawFrame();
}
function noteDexterTap() {
  dexterTaps += 1;
  dexterTapReset = 4;
  if (dexterTaps >= 5) booDexter();
}
function kickEggAnim() {
  if (shouldAnimate()) {
    resumeLoop();
    return;
  }
  /* Reduced motion: one still frame, no extra loop. */
  if (forceMachine() && !machineEvent) startMachineEvent();
  if (machineEvent && machineEvent.t < 0.9) machineEvent.t = 0.9;
  if (ferretDash && ferretDash.t < 0.7) ferretDash.t = 0.7;
  drawFrame();
}

function setupEasterEggs() {
  if (EMBED) return;
  document.addEventListener("keydown", function (ev) {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const el = ev.target;
    const tag = el && el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || (el && el.isContentEditable)) return;
    const k = ev.key;
    if (!k || k.length !== 1) return;
    typedKeys = (typedKeys + k.toLowerCase()).slice(-6);
    if (typedKeys === "ferret") {
      typedKeys = "";
      startFerretDash();
    }
  });
}

/* Portraits that already exist. Most of the specialists do not have one yet;
   their cards show a name and a line only. Paths stay lazy-loaded, one at a time. */
const PORTRAITS = {
  kenneth: "portraits/kenneth.jpg",
  terry: "portraits/terry.jpg",
  reggie: "portraits/reggie.jpg",
  keith: "portraits/kraken-keith.jpg",
  arthur: "portraits/arthur.jpg",
  dexter: "portraits/dexter.jpg",
  spyro: "portraits/spyro.jpg"
};
const JOB_LINE = {
  kenneth: "Chief of Staff to the Ferret, coordinating the bots.",
  terry: "The Machine: editor, and the first of the three.",
  reggie: "The Cousin: proofreader, and the second of the three.",
  boris: "Looks after the email.",
  tweety: "Posts to X, when the Ferret says so.",
  percy: "The books, from the proofs to the shop.",
  george: "This website, by branch and pull request.",
  archie: "The games in the arcade.",
  brian: "The music.",
  clive: "Vapers Choice.",
  frank: "The View, and the canteen.",
  filament: "The 3D printer.",
  oddly: "A new shop, not yet named.",
  rupert: "Incognito Science, on video.",
  penny: "The money, the VAT, and an eye on the investments.",
  keith: "Watches the crypto, and only trades when the Ferret says so.",
  sheila: "Rotas and staff.",
  sarge: "Keeps everyone on the right side of the rules.",
  mona: "The shops' socials and reviews.",
  hettie: "Home admin, and the cats.",
  stockley: "The stock and the suppliers.",
  grant: "Grants and other funding.",
  vinnie: "Incognito Science on YouTube.",
  arthur: "A Ragdoll, and the office loaf. Often found under the clock.",
  dexter: "The grey wolf, here to supervise the rug.",
  spyro: "The true king, who will occasionally take an empty desk."
};
const CHATS = {
  kettle: [
    ["BREW?", "GO ON THEN."],
    ["BISCUIT?", "GONE"],
    ["WHO'S HAD MY MUG?", "NOT ME"],
    ["I'LL BE MOTHER", "TA"]
  ],
  arcade: [
    ["1UP!", "GO ON!"],
    ["ONE MORE GO", "GO ON THEN"],
    ["HI SCORE", "IS IT?"]
  ]
};
let chatWait = 6;
let paintedSky = null, paintedSeason = null;

function line(x0, y0, x1, y1, colour) {
  const dx = x1 - x0, dy = y1 - y0;
  const n = Math.max(Math.abs(dx), Math.abs(dy), 1);
  for (let i = 0; i <= n; i++) p(x0 + dx * i / n, y0 + dy * i / n, 1, 1, colour);
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
  const holders = STAFF.filter(s => s.office);
  const margin = 8, gap = 10, rh = TOP_H - 2;
  const n = holders.length;
  const rw = Math.floor((NOOK.x - 10 - margin - gap * (n - 1)) / n);
  holders.forEach((staff, i) => {
    const x = margin + i * (rw + gap);
    const y = 2;
    const cx = x + Math.round(rw / 2);
    rooms.push({
      id: staff.id, staff: staff, x: x, y: y, w: rw, h: rh, cx: cx,
      doorX: cx, doorY: y + rh + 6, doorW: 24, lane: TOP_LANE
    });
    const deskY = y + 36;
    desks.push({
      id: staff.id, x: cx - 29, y: deskY, w: 58, h: 28, cx: cx,
      chairX: cx, chairY: deskY + 40, staff: staff, private: true, lane: TOP_LANE
    });
  });
}

function layoutAmenities() {
  /* The canteen and the music room share the bottom band with the machine's corner. */
  [
    { id: "canteen", plate: ["CANTEEN"], x: 8, w: 248 },
    { id: "music", plate: ["MUSIC"], x: 268, w: 236 }
  ].forEach(item => {
    const cx = item.x + Math.round(item.w / 2);
    rooms.push({
      id: item.id, plate: item.plate, amenity: true, doorSide: "n",
      x: item.x, y: BAND_Y, w: item.w, h: H - BAND_Y - 8, cx: cx,
      doorX: cx, doorY: BAND_Y - 6, doorW: 24, lane: BOTTOM_LANE
    });
  });
}

function layoutDesks() {
  desks.length = 0;
  rooms.length = 0;
  layoutOffices();
  layoutAmenities();
  const floorStaff = STAFF.filter(s => !s.office);
  /* Five to a row, four rows. If the crew outgrows twenty, the rows squeeze up. */
  const cols = Math.max(5, Math.ceil(floorStaff.length / DESK_ROWS.length));
  const pitch = Math.min(DESK_SLOT + DESK_GAP, Math.floor((FLOOR_BLOCK.w - 8) / cols));
  const slot = Math.min(DESK_SLOT, pitch - 12);
  const x0 = cols === 5 ? DESK_X0 : FLOOR_BLOCK.x + 6;
  floorStaff.forEach((staff, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    const x = x0 + c * pitch, y = DESK_ROWS[Math.min(r, DESK_ROWS.length - 1)];
    desks.push({
      id: staff.id, x: x, y: y, w: slot, h: 28, cx: x + slot / 2,
      chairX: x + slot / 2, chairY: y + 46, staff: staff, lane: y + 62
    });
  });
  /* The printer gets the first spare desk, if there is one. */
  const n = floorStaff.length;
  printerStation = null;
  if (n < cols * DESK_ROWS.length) {
    const r = Math.floor(n / cols), c = n % cols;
    printerStation = { x: x0 + c * pitch, y: DESK_ROWS[r], w: slot, lane: DESK_ROWS[r] + 62 };
    printerStation.spotX = printerStation.x + slot / 2 - 4;
    printerStation.spotY = printerStation.y + 46;
    printerStation.facing = "r";
  } else {
    /* Every desk is taken, so the printer has moved to the top of the lounge,
       between the kettle corner and the sofa. Users queue to its right. */
    printerStation = { x: LOUNGE.x + 48, y: LOUNGE.y - 8, w: 58, lane: LOUNGE.y + 20 };
    printerStation.spotX = printerStation.x + 70;
    printerStation.spotY = LOUNGE.y + 20;
    printerStation.facing = "l";
  }
}

function layoutSpots() {
  spots.length = 0;
  function add(kind, x, y, facing, lane, extra) {
    const n = spots.filter(s => s.kind === kind).length;
    spots.push(Object.assign({ id: kind + "-" + n, kind: kind, x: x, y: y, facing: facing, lane: lane, who: null }, extra || {}));
  }
  /* Games nook, open to the walkway below it. */
  add("rods", 446, 100, "l", TOP_LANE);
  add("arcade", 554, 90, "l", TOP_LANE);
  add("arcade", 494, 104, "r", TOP_LANE, { watch: true });
  add("darts", 608, 106, "l", TOP_LANE);
  add("darts", 580, 110, "r", TOP_LANE, { waiting: true });
  /* Kettle corner. */
  add("kettle", 482, 200, "r", 200);
  add("kettle", 530, 206, "l", 206);
  add("kettle", 578, 200, "r", 200);
  /* Lounge: three on the sofa, two stood about. */
  add("sofa", 502, 326, "r", 346, { seat: true });
  add("sofa", 532, 326, "l", 346, { seat: true });
  add("sofa", 562, 326, "r", 346, { seat: true });
  add("lounge", 470, 266, "r", 266);
  add("lounge", 478, 414, "r", 414);
  /* The printer, on its spare desk. */
  if (printerStation) add("printer", printerStation.spotX, printerStation.spotY, printerStation.facing, printerStation.lane);
  /* Canteen and music room. */
  rooms.forEach(r => {
    if (r.id === "canteen") {
      add("canteen", r.x + 58, r.y + 72, "r", BOTTOM_LANE, { room: r.id });
      add("canteen", r.x + 128, r.y + 108, "r", BOTTOM_LANE, { room: r.id });
      add("canteen", r.x + 206, r.y + 108, "l", BOTTOM_LANE, { room: r.id });
      add("canteen", r.x + 166, r.y + 150, "l", BOTTOM_LANE, { room: r.id });
    } else if (r.id === "music") {
      add("music", r.x + 70, r.y + 96, "l", BOTTOM_LANE, { room: r.id });
      add("music", r.x + 132, r.y + 102, "r", BOTTOM_LANE, { room: r.id });
      add("music", r.x + 40, r.y + 140, "r", BOTTOM_LANE, { room: r.id });
      add("music", r.x + 180, r.y + 124, "l", BOTTOM_LANE, { room: r.id, guitar: true });
      add("music", r.x + 120, r.y + 156, "r", BOTTOM_LANE, { room: r.id });
    } else if (r.staff) {
      add("office", r.cx - 30, r.y + 94, "r", TOP_LANE, { room: r.id, only: r.id });
      add("office", r.cx + 32, r.y + 96, "l", TOP_LANE, { room: r.id, only: r.id });
    }
  });
}

/* Cats go where they like, in straight lines, as cats do. */
const CAT_SPOTS = [
  { x: CLOCK.cx, y: 136, clock: true },
  { x: 590, y: 322, sofa: true }, { x: 540, y: 412 }, { x: 612, y: 216 }, { x: 600, y: 266 },
  { x: 200, y: 280 }, { x: 120, y: 350 }, { x: 300, y: 420 }, { x: 440, y: 380 },
  { x: 520, y: 118 }, { x: 440, y: 180 }
];

function roomAt(x, y) {
  return rooms.find(r => x >= r.x + 2 && x <= r.x + r.w - 2 && y >= r.y + 2 && y <= r.y + r.h) || null;
}

/* Which walkway a point joins. Desk-floor points use the aisle just below them. */
function laneFor(pt) {
  if (pt.lane !== undefined && pt.lane !== null) return pt.lane;
  if (pt.y <= TOP_LANE + 6) return TOP_LANE;
  if (pt.y >= BOTTOM_LANE - 2) return BOTTOM_LANE;
  if (pt.x < AISLE_X - 6) {
    const lanes = [TOP_LANE].concat(DESK_ROWS.map(y => y + 62));
    return lanes.find(l => l >= pt.y - 1) || lanes[lanes.length - 1];
  }
  return pt.y;
}

function routeBetween(a, b, out, nudge) {
  /* A small per-person nudge keeps people from walking in perfect single file. */
  const n = nudge || 0;
  const la = laneFor(a) + n, lb = laneFor(b) + n;
  function add(x, y) {
    const last = out[out.length - 1] || a;
    if (Math.abs(last.x - x) > 0.5 || Math.abs(last.y - y) > 0.5) out.push({ x: x, y: y });
  }
  add(a.x, la);
  if (la !== lb) {
    add(AISLE_X + n, la);
    add(AISLE_X + n, lb);
  }
  add(b.x, lb);
  add(b.x, b.y);
}

function setRoute(who, dest) {
  const out = [];
  const from = roomAt(who.x, who.y);
  const to = dest.room ? rooms.find(r => r.id === dest.room) : roomAt(dest.x, dest.y);
  let start = { x: who.x, y: who.y, lane: from ? undefined : who.atLane };
  const nudge = who.salt === undefined ? 0 : ((who.salt % 5) - 2) * 2;
  who.atLane = undefined;
  if (from && to && from.id === to.id) {
    out.push({ x: dest.x, y: dest.y });
  } else {
    if (from) {
      out.push({ x: from.doorX, y: from.doorY });
      start = { x: from.doorX, y: from.doorY, lane: from.lane };
    }
    if (to) {
      routeBetween(start, { x: to.doorX, y: to.doorY, lane: to.lane }, out, nudge);
      out.push({ x: dest.x, y: dest.y });
    } else {
      routeBetween(start, dest, out, nudge);
    }
  }
  who.waypoints = out;
  who.target = who.waypoints.shift() || null;
}

function flavourFor(id, mode, salt) {
  if (mode === "working") return pick(WORK_FLAVOUR, salt + id.length * 11);
  if (mode === "celebrating") return pick(CELE_FLAVOUR, salt + id.length * 17);
  return pick(IDLE_FLAVOUR, salt + id.length * 13);
}

function flavourForPlace(person, spot) {
  const list = spot && PLACE_FLAVOUR[spot.kind];
  if (list) return pick(list, (Date.now() / 1000 | 0) + person.salt * 7 + person.id.length);
  return flavourFor(person.id, "idle", Date.now() / 1000 | 0);
}

function freeSpots(person) {
  return spots.filter(s => !s.who && (!s.only || s.only === person.id));
}

function releaseSpot(person) {
  if (person.spot && person.spot.who === person.id) person.spot.who = null;
  person.spot = null;
  person.activity = null;
  person.bubble = null;
}

function claimSpot(person, spot) {
  releaseSpot(person);
  spot.who = person.id;
  person.spot = spot;
}

/* Pick somewhere new to be idle. Favourite haunts first, about half the time. */
function idleTarget(person) {
  const free = freeSpots(person).filter(s => s !== person.spot);
  if (!free.length) return null;
  const likes = LIKES[person.id] || [];
  const liked = free.filter(s => likes.includes(s.kind));
  if (liked.length && Math.random() < 0.55) return liked[Math.floor(Math.random() * liked.length)];
  /* Office holders keep to their own office a fair bit; nobody else goes in. */
  const pool = free.filter(s => s.kind !== "office" || Math.random() < 0.4);
  const use = pool.length ? pool : free;
  return use[Math.floor(Math.random() * use.length)];
}

function settleAt(person, spot) {
  claimSpot(person, spot);
  person.x = spot.x;
  person.y = spot.y;
  person.target = null;
  person.waypoints = [];
  person.facing = spot.facing;
  person.activity = spot.kind;
  person.atLane = spot.lane;
  person.flavour = flavourForPlace(person, spot);
  person.bubbleT = 2 + Math.random() * 6;
  const d = DWELL[spot.kind] || [6, 6];
  person.wait = d[0] + Math.random() * d[1];
}

function headForSpot(person) {
  const spot = idleTarget(person);
  if (!spot) {
    person.wait = 1.5 + Math.random() * 2;
    return;
  }
  if (REDUCE) {
    settleAt(person, spot);
    return;
  }
  claimSpot(person, spot);
  setRoute(person, spot);
}

function firstSpot(person, index) {
  const free = freeSpots(person);
  const likes = LIKES[person.id] || [];
  const liked = free.filter(s => likes.includes(s.kind));
  if (liked.length) return liked[index % liked.length];
  const open = free.filter(s => s.kind !== "office");
  const use = open.length ? open : free;
  return use.length ? use[(index * 7) % use.length] : null;
}

function makePerson(staff, index) {
  const desk = desks.find(d => d.id === staff.id);
  const pr = {
    id: staff.id,
    staff: staff,
    desk: desk,
    x: desk.chairX,
    y: desk.chairY,
    want: "idle",
    phase: "idle",
    target: null,
    waypoints: [],
    wait: 0,
    walkT: index * 0.3,
    celeT: 0,
    glanceT: 0,
    facing: "r",
    flavour: flavourFor(staff.id, "idle", index + 3),
    typeT: 0,
    salt: index,
    spot: null,
    activity: null,
    atLane: desk.lane,
    bubble: null,
    bubbleT: 3,
    throwT: 0
  };
  const spot = firstSpot(pr, index);
  if (spot) {
    settleAt(pr, spot);
    /* Stagger the first wander so the whole office does not stand up at once. */
    pr.wait = 4 + (index % 7) * 2 + Math.random() * 10;
  }
  return pr;
}

function makeCat(id, spotIndex) {
  const s = CAT_SPOTS[spotIndex];
  return { id, x: s.x, y: s.y, spot: s, target: null, wait: id === "arthur" ? 6 : 3, walkT: 0, facing: "l" };
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
    releaseSpot(person);
    person.flavour = flavourFor(person.id, "working", Date.now() / 1000 | 0);
    person.phase = REDUCE ? "working" : "to-desk";
    setRoute(person, { x: person.desk.chairX, y: person.desk.chairY, lane: person.desk.lane });
    person.wait = 0;
    if (REDUCE) {
      person.x = person.desk.chairX;
      person.y = person.desk.chairY;
      person.phase = "working";
      person.target = null;
      person.waypoints = [];
    }
  } else if (prev === "working" || person.phase === "working" || person.phase === "to-desk") {
    person.flavour = flavourFor(person.id, "celebrating", Date.now() / 1000 | 0);
    person.phase = "celebrating";
    person.celeT = 0;
    person.target = null;
    if (REDUCE) {
      person.phase = "idle";
      person.atLane = person.desk.lane;
      headForSpot(person);
    }
  } else {
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
  /* With reduced motion there is no animation loop, so repaint the still picture. */
  if (!shouldAnimate()) drawFrame();
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

function bubblesShowing() {
  return people.filter(p => p.bubble).length;
}

function tickPerson(p, dt) {
  p.typeT += dt;
  if (machineEventActive()) {
    p.facing = p.x < MACHINE.cx ? "r" : "l";
    if (p.bubble) {
      if (p.bubble.delay > 0) p.bubble.delay -= dt;
      else {
        p.bubble.t -= dt;
        if (p.bubble.t <= 0) p.bubble = null;
      }
    }
    return;
  }
  if (p.phase === "to-desk") {
    const arrived = REDUCE ? true : stepMove(p, dt, 46);
    if (arrived) {
      p.x = p.desk.chairX;
      p.y = p.desk.chairY;
      p.phase = "working";
      p.facing = "r";
      p.atLane = p.desk.lane;
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
      p.atLane = p.desk.lane;
      headForSpot(p);
      paintBoard();
    }
    return;
  }
  /* After ten, one person stays on for a late one, at their own desk under the lamp. */
  if (shouldSitLate(p)) {
    const atDesk = Math.hypot(p.x - p.desk.chairX, p.y - p.desk.chairY) < 4;
    if (!atDesk) {
      const goingHome = p.target && Math.hypot(p.target.x - p.desk.chairX, p.target.y - p.desk.chairY) < 4;
      if (!goingHome) {
        releaseSpot(p);
        setRoute(p, { x: p.desk.chairX, y: p.desk.chairY, lane: p.desk.lane });
        p.flavour = "Heading back for a late one";
        paintBoard();
      } else {
        stepMove(p, dt, 46);
      }
      return;
    }
    p.x = p.desk.chairX;
    p.y = p.desk.chairY;
    p.target = null;
    p.waypoints = [];
    p.facing = "r";
    if (p.flavour !== "Working late") {
      p.flavour = "Working late";
      paintBoard();
    }
    p.wait = 2;
    return;
  }
  /* Idle: walking to a spot, or doing something at one. */
  if (p.target) {
    if (stepMove(p, dt, 42) && p.spot) {
      settleAt(p, p.spot);
      paintBoard();
    }
    return;
  }
  if (p.bubble) {
    if (p.bubble.delay > 0) p.bubble.delay -= dt;
    else {
      p.bubble.t -= dt;
      if (p.bubble.t <= 0) p.bubble = null;
    }
  } else if (p.activity) {
    p.bubbleT -= dt;
    const lines = (p.spot && p.spot.watch) ? ["OOH", "GO ON!"] : (BUBBLES[p.activity] || []);
    if (p.bubbleT <= 0) {
      p.bubbleT = 5 + Math.random() * 9;
      if (lines.length && bubblesShowing() < 3 && !(p.spot && p.spot.waiting)) {
        p.bubble = { text: lines[Math.floor(Math.random() * lines.length)], t: 2 };
      }
    }
  }
  if (p.glanceT > 0) p.glanceT -= dt;
  else if (Math.hypot(p.x - MACHINE.cx, p.y - MACHINE.cy) < 200 && Math.random() < dt * 0.06) {
    p.glanceT = 1;
    p.facing = p.x < MACHINE.cx ? "r" : "l";
    p.flavour = "Giving the machine a wide berth";
    paintBoard();
  }
  if (p.wait > 0) {
    p.wait -= dt;
    return;
  }
  headForSpot(p);
}

/* The darts: one thrower at a time, three darts, then they fetch them back. */
const darts = { stuck: [], t: 0, flying: null, session: 0 };
function tickDarts(dt) {
  const thrower = people.find(p => p.activity === "darts" && p.spot && !p.spot.waiting && !p.target);
  if (!thrower) {
    darts.flying = null;
    return;
  }
  thrower.throwT += dt;
  darts.t += dt;
  if (!darts.flying && darts.t > 1.7) {
    darts.t = 0;
    if (darts.stuck.length >= 3) {
      darts.stuck = [];
      return;
    }
    const miss = Math.random() < 0.18;
    const ang = Math.random() * Math.PI * 2;
    const rad = miss ? BOARD.r + 3 + Math.random() * 4 : Math.random() * (BOARD.r - 2);
    darts.flying = {
      x0: thrower.x + (thrower.facing === "l" ? 8 : -10), y0: thrower.y - 40,
      x1: BOARD.cx + Math.cos(ang) * rad, y1: BOARD.cy + Math.sin(ang) * rad, t: 0, miss: miss
    };
    thrower.throwT = 0;
  }
  if (darts.flying) {
    darts.flying.t += dt / 0.32;
    if (darts.flying.t >= 1) {
      darts.stuck.push({ x: darts.flying.x1, y: darts.flying.y1 });
      if (!darts.flying.miss) darts.session += 15 + ((darts.stuck.length * 17 + (ukNow().minute | 0)) % 46);
      darts.flying = null;
    }
  }
}

function emptyDesks() {
  return desks.filter(d => {
    const owner = people.find(p => p.id === d.id);
    if (!owner) return true;
    if (owner.phase === "working" || owner.phase === "to-desk" || isLateSitting(owner)) return false;
    return Math.hypot(owner.x - d.chairX, owner.y - d.chairY) > 18;
  });
}
function perchSpyro(c, desk) {
  c.deskSit = desk;
  c.spot = { x: desk.cx + 10, y: desk.y + 18, desk: desk.id };
  c.x = c.spot.x;
  c.y = c.spot.y;
  c.target = null;
  c.facing = "l";
}
function tickCat(c, dt) {
  if (REDUCE) return;
  if (machineEventActive()) return;
  if (c.wait > 0) {
    c.wait -= dt;
    return;
  }
  const arrived = stepMove(c, dt, 28);
  if (arrived) {
    c.wait = 4 + Math.random() * 10;
    if (c.id === "arthur" && c.spot && (c.spot.sofa || c.spot.clock)) c.wait += 16;
    if (c.id === "spyro" && c.deskSit) c.wait += 14;
    const taken = cats.filter(o => o !== c).map(o => o.spot);
    const clock = CAT_SPOTS.find(s => s.clock);
    let dest = null;
    c.deskSit = null;
    if (c.id === "spyro" && Math.random() < 0.55) {
      const free = emptyDesks();
      if (free.length) {
        perchSpyro(c, free[Math.floor(Math.random() * free.length)]);
        c.wait = 16 + Math.random() * 16;
        return;
      }
    }
    let options = CAT_SPOTS.filter(s => s !== c.spot && !taken.includes(s));
    if (c.id === "arthur" && clock && !taken.includes(clock) && Math.random() < 0.45) options = [clock];
    dest = options[Math.floor(Math.random() * options.length)];
    if (dest) {
      c.spot = dest;
      c.target = { x: dest.x, y: dest.y };
      c.wait = c.wait > 0 ? c.wait : 0;
    }
  }
}

const LATE_FLAVOUR = ["Working late", "A late one, apparently", "Burning the midnight oil, unofficially"];

function tickChat(dt) {
  if (REDUCE) return;
  chatWait -= dt;
  if (chatWait > 0) return;
  const idleAt = kind => people.filter(p => p.phase === "idle" && !p.target && p.activity === kind);
  const archie = people.find(p => p.id === "archie");
  const rupert = people.find(p => p.id === "rupert");
  let a = null, b = null, lines = null;
  if (archie && rupert && idleAt("arcade").includes(archie) && idleAt("arcade").includes(rupert)) {
    a = archie; b = rupert;
    lines = CHATS.arcade[Math.floor(Math.random() * CHATS.arcade.length)];
  } else {
    const kettle = idleAt("kettle");
    if (kettle.length >= 2) {
      const i = Math.floor(Math.random() * kettle.length);
      let j = Math.floor(Math.random() * (kettle.length - 1));
      if (j >= i) j += 1;
      a = kettle[i]; b = kettle[j];
      lines = CHATS.kettle[Math.floor(Math.random() * CHATS.kettle.length)];
    }
  }
  if (!a || !b || !lines) {
    chatWait = 4;
    return;
  }
  a.bubble = { text: lines[0], t: 3.4 };
  b.bubble = { text: lines[1], t: 3.4, delay: 0.9 };
  chatWait = 14 + Math.random() * 10;
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
  windowPanes.push({ x: x, y: y, w: w, h: h });
  const sky = currentSky();
  let pane, pane2, glint;
  if (sky === "night") {
    pane = "#1a2048"; pane2 = "#121830"; glint = "#8ec8e855";
  } else if (sky === "dusk") {
    pane = "#e07a4a"; pane2 = "#8a3a6a"; glint = "#f2d36b";
  } else {
    pane = "#8ec8e8"; pane2 = "#7eb8dc"; glint = "#f4f0e4";
  }
  box(x, y, w, h, "#3d2a1c", "#141414");
  p(x + 2, y + 2, w - 4, h - 4, pane);
  p(x + 2, y + 2, Math.floor((w - 4) / 2), h - 4, pane2);
  if (sky === "night") {
    const seed = (x * 13 + y * 7) | 0;
    for (let i = 0; i < 5; i++) {
      const sx = x + 3 + ((seed + i * 17) % Math.max(2, w - 8));
      const sy = y + 3 + ((seed + i * 11) % Math.max(2, h - 8));
      p(sx, sy, 1, 1, i % 2 ? "#f4f0e4" : "#c5d8e4");
    }
  } else {
    p(x + 3, y + 3, 3, 2, glint);
    p(x + 3, y + 6, 2, 4, sky === "dusk" ? "#ffffff33" : "#ffffff55");
  }
  if (currentSeason() === "december") {
    p(x + 2, y + h - 4, w - 4, 2, "#f4f0e4");
    p(x + 3, y + h - 5, 3, 1, "#ffffff");
    p(x + w - 8, y + h - 5, 2, 1, "#ffffff");
  }
  /* mullion */
  p(x + Math.floor(w / 2) - 1, y, 2, h, "#3d2a1c");
  p(x, y + Math.floor(h / 2), w, 2, "#3d2a1c");
}

function drawTree(x, y) {
  /* A small office Christmas tree, used only in December. */
  shadow(x + 4, y + 36, 16, 5);
  p(x + 10, y + 28, 4, 12, "#6b4a2a");
  p(x + 1, y + 18, 22, 12, "#0f4a3a");
  p(x + 4, y + 10, 16, 12, "#146b48");
  p(x + 7, y + 2, 10, 12, "#1a7a52");
  p(x + 3, y + 20, 6, 3, "#0f4a3a");
  p(x + 15, y + 14, 5, 3, "#146b48");
  p(x + 10, y - 2, 4, 4, "#e6c200");
  p(x + 11, y - 3, 2, 2, "#f2e6a0");
  p(x + 6, y + 12, 2, 2, "#d1202f");
  p(x + 16, y + 8, 2, 2, "#d1202f");
  p(x + 8, y + 22, 2, 2, "#e6c200");
  p(x + 14, y + 18, 2, 2, "#22409a");
  p(x + 5, y + 8, 2, 2, "#f4f0e4");
}

function drawPumpkin(x, y) {
  shadow(x + 1, y + 12, 14, 4);
  p(x + 1, y + 3, 14, 10, "#e07a2f");
  p(x + 3, y + 1, 10, 3, "#e07a2f");
  p(x + 2, y + 4, 4, 8, "#f08a3a");
  p(x + 7, y, 2, 4, "#1a7a52");
  p(x + 4, y + 5, 2, 2, "#141414");
  p(x + 9, y + 5, 2, 2, "#141414");
  p(x + 5, y + 9, 6, 2, "#141414");
  p(x + 6, y + 8, 4, 1, "#141414");
  if (!REDUCE && ((animT * 3 + x) % 1) < 0.5) p(x + 6, y + 6, 3, 2, "#f2d36b");
}

function drawSeasonalScenery() {
  const season = currentSeason();
  if (season === "december") {
    /* In the lounge corner, in place of the little plant. */
    drawTree(LOUNGE.x + 2, LOUNGE.y + 8);
  }
  if (season === "halloween") {
    drawPumpkin(428, 120);
    drawPumpkin(448, 230);
    drawPumpkin(24, 424);
  }
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

function disc(cx, cy, r, colour) {
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy) + 0.3);
    p(cx - half, cy + dy, half * 2 + 1, 1, colour);
  }
}

function drawCarpet(x, y, w, h) {
  /* Hard-wearing office carpet tiles under the desks, in a sensible slate blue. */
  const size = 20;
  for (let ty = y; ty < y + h; ty += size) {
    for (let tx = x; tx < x + w; tx += size) {
      const odd = (((tx - x) / size | 0) + ((ty - y) / size | 0)) % 2;
      const tw = Math.min(size, x + w - tx), th = Math.min(size, y + h - ty);
      p(tx, ty, tw, th, odd ? "#5f7386" : "#586b7d");
      for (let i = 3; i < th - 1; i += 4) p(tx + (odd ? 2 : 1), ty + i, tw - 3, 1, odd ? "#66798b" : "#536475");
    }
  }
  p(x - 2, y - 2, w + 4, 2, "#3d4a57");
  p(x - 2, y + h, w + 4, 2, "#3d4a57");
  p(x - 2, y, 2, h, "#3d4a57");
  p(x + w, y, 2, h, "#3d4a57");
}

function drawKettleOn(x, y) {
  /* The office kettle, sat on the counter. Steam is added each frame. */
  box(x + 8, y + 6, 16, 16, "#c8c4b8", "#141414");
  p(x + 9, y + 7, 5, 13, "#e8e4d8");
  p(x + 20, y + 8, 3, 12, "#9a968c");
  p(x + 10, y + 18, 12, 3, "#8a8680");
  p(x + 10, y + 3, 12, 4, "#d8d4c8");
  p(x + 9, y + 4, 14, 2, "#141414");
  box(x + 13, y - 2, 6, 6, "#d1202f", "#141414");
  p(x + 14, y - 1, 2, 2, "#f26a6a");
  p(x + 24, y + 10, 6, 3, "#a8a49c");
  p(x + 28, y + 8, 3, 5, "#a8a49c");
  p(x + 5, y + 8, 2, 10, "#3d2a1c");
  p(x + 6, y + 8, 3, 2, "#3d2a1c");
  p(x + 6, y + 17, 3, 2, "#3d2a1c");
}

function drawWaterCooler(x, y) {
  shadow(x, y + 34, 18, 5);
  box(x, y + 18, 16, 16, "#c0c0c0", "#141414");
  p(x + 1, y + 19, 6, 14, "#d8d8d8");
  box(x + 3, y, 10, 20, "#6ab8d8", "#141414");
  p(x + 4, y + 1, 4, 16, "#8ec8e6");
  p(x + 5, y + 3, 2, 6, "#f4f0e4");
  p(x + 2, y + 32, 12, 4, "#a0a0a0");
}

function drawPlate(cx, y, lines, fill) {
  const plateW = Math.max.apply(null, lines.map(s => s.length * 4 + 6));
  const plateH = lines.length * 7 + 4;
  const px = cx - Math.round(plateW / 2);
  box(px, y, plateW, plateH, fill || "#f4f0e4", "#3d2a1c");
  lines.forEach((line, i) => drawLabel(cx, y + 2 + i * 7, line, "#141414"));
}

function drawNook() {
  const n = NOOK;
  /* Pub carpet: red with a little gold diamond, as is traditional. */
  p(n.x, n.y, n.w, n.h, "#6b1f24");
  for (let y = n.y + 36; y < n.y + n.h; y += 12) {
    for (let x = n.x + 6 + ((y / 12) % 2 ? 6 : 0); x < n.x + n.w - 4; x += 12) {
      p(x, y, 2, 2, "#b8862a");
      p(x + 1, y - 1, 1, 1, "#8a2a30");
    }
  }
  /* Bottle-green back wall with a dado rail. */
  p(n.x, n.y, n.w, 34, "#2e4a3c");
  p(n.x, n.y + 24, n.w, 10, "#3a5a48");
  p(n.x, n.y + 23, n.w, 1, "#c4a574");
  p(n.x, n.y + 33, n.w, 1, "#1a2a22");
  /* Walls: top and west; the south side is open to the walkway. */
  p(n.x, n.y - 2, n.w + 6, 3, "#141414");
  p(n.x - 2, n.y - 2, 3, n.h + 2, "#141414");
  p(W - 8, n.y, 6, n.h, "#141414");
  /* Rod rack on the wall: four rods, reels down at the bottom. */
  box(n.x + 8, n.y + 8, 50, 4, "#6b4a2a", "#3d2a1c");
  box(n.x + 8, n.y + 40, 50, 4, "#6b4a2a", "#3d2a1c");
  ["#2a2a2a", "#7a1f2b", "#1a5c3a", "#c4a574"].forEach((c, i) => {
    const rx = n.x + 14 + i * 12;
    p(rx, n.y + 4, 2, 56, c);
    p(rx, n.y + 4, 1, 56, lite(c, 0.25));
    box(rx - 2, n.y + 46, 6, 6, "#c0c0c0", "#141414");
    p(rx - 1, n.y + 56, 4, 3, "#3d2a1c");
  });
  /* Landing net leaning on the wall. */
  p(n.x + 66, n.y + 12, 1, 46, "#8a6a40");
  p(n.x + 60, n.y + 6, 13, 1, "#3d2a1c");
  p(n.x + 60, n.y + 6, 1, 9, "#3d2a1c");
  p(n.x + 72, n.y + 6, 1, 9, "#3d2a1c");
  p(n.x + 61, n.y + 15, 11, 1, "#3d2a1c");
  for (let i = 0; i < 3; i++) p(n.x + 63 + i * 3, n.y + 7, 1, 8, "#6a6a6a");
  /* A stuffed fish on a plaque. It is very big, apparently. */
  box(n.x + 76, n.y + 6, 22, 12, "#6b4a2a", "#3d2a1c");
  p(n.x + 79, n.y + 10, 12, 4, "#7a9a6a");
  p(n.x + 78, n.y + 11, 2, 2, "#7a9a6a");
  p(n.x + 91, n.y + 9, 4, 6, "#5a7a4a");
  p(n.x + 81, n.y + 11, 1, 1, "#141414");
  /* The arcade cabinet (the screen is drawn each frame). */
  const c = CABINET;
  shadow(c.x + 2, c.y + c.h - 2, c.w, 6);
  box(c.x, c.y, c.w, c.h, "#3a1a4a", "#141414");
  p(c.x + 1, c.y + 1, 4, c.h - 2, "#5a2a6e");
  box(c.x + 2, c.y + 2, c.w - 4, 10, "#e6c200", "#141414");
  if (!EMBED) drawLabel(c.x + c.w / 2, c.y + 5, "ARCADE", "#7a1f2b");
  box(c.x + 4, c.y + 14, c.w - 8, 22, "#141414", "#141414");
  box(c.x - 1, c.y + 38, c.w + 2, 8, "#2a2a2a", "#141414");
  p(c.x + 7, c.y + 35, 2, 5, "#c0c0c0");
  box(c.x + 5, c.y + 33, 6, 4, "#d1202f", "#141414");
  p(c.x + 16, c.y + 40, 3, 3, "#3dff7a");
  p(c.x + 21, c.y + 40, 3, 3, "#e23d4a");
  p(c.x + 26, c.y + 40, 3, 3, "#6ab8d8");
  p(c.x + 12, c.y + 52, 8, 6, "#141414");
  p(c.x + 15, c.y + 53, 2, 4, "#e6c200");
  /* Chalk scoreboard (the numbers are drawn each frame, as the day wears on). */
  box(BOARD.cx - 48, n.y + 4, 32, 30, "#1a1a1a", "#6b4a2a");
  p(BOARD.cx - 47, n.y + 5, 30, 1, "#3a3a28");
  disc(BOARD.cx, BOARD.cy, BOARD.r + 1, "#141414");
  disc(BOARD.cx, BOARD.cy, BOARD.r - 1, "#1a1a1a");
  for (let a = 0; a < 20; a++) {
    const ang = a * Math.PI / 10;
    for (let r = 2; r < BOARD.r - 1; r++) {
      const col = r > BOARD.r - 3 ? (a % 2 ? "#d1202f" : "#1a7a52") : r > 5 && r < 7 ? (a % 2 ? "#d1202f" : "#1a7a52") : (a % 2 ? "#f2e6c8" : "#1a1a1a");
      p(BOARD.cx + Math.round(Math.cos(ang) * r), BOARD.cy + Math.round(Math.sin(ang) * r), 1, 1, col);
    }
  }
  disc(BOARD.cx, BOARD.cy, 1, "#1a7a52");
  p(BOARD.cx, BOARD.cy, 1, 1, "#d1202f");
  /* The oche, in white tape. */
  p(BOARD.cx - 24, n.y + n.h - 6, 40, 2, "#f4f0e4");
}

function drawKettleCorner() {
  const k = KETTLE;
  tileFloor(k.x, k.y, k.w, k.h, "#e8e2c8", "#cfd8c0");
  /* Counter with a tiled splashback, kettle, toaster, biscuit tin and a mug tree. */
  const cx = k.x + 16, cy = k.y + 12, cw = 126;
  p(cx, cy - 8, cw, 10, "#f4f0e4");
  for (let i = 0; i < cw; i += 8) p(cx + i, cy - 8, 1, 10, "#d8d4c8");
  p(cx, cy - 4, cw, 1, "#d8d4c8");
  shadow(cx + 2, cy + 30, cw, 6);
  box(cx, cy + 2, cw, 30, "#8b5a2b", "#141414");
  p(cx + 1, cy + 3, cw - 2, 6, "#d8d2c6");
  p(cx + 1, cy + 8, cw - 2, 1, "#a8a296");
  for (let i = 1; i < 4; i++) p(cx + i * (cw / 4), cy + 10, 1, 21, "#6b4a2a");
  for (let i = 0; i < 4; i++) p(cx + i * (cw / 4) + cw / 8 - 3, cy + 16, 6, 2, "#c4a574");
  drawKettleOn(cx + 2, cy - 18);
  /* toaster */
  box(cx + 42, cy - 8, 20, 13, "#c0c0c0", "#141414");
  p(cx + 43, cy - 7, 7, 10, "#e0e0e0");
  p(cx + 46, cy - 8, 4, 2, "#141414");
  p(cx + 54, cy - 8, 4, 2, "#141414");
  /* biscuit tin */
  box(cx + 70, cy - 6, 16, 11, "#22409a", "#141414");
  p(cx + 70, cy - 8, 16, 3, "#2a50b0");
  p(cx + 74, cy - 3, 8, 4, "#d1202f");
  /* mug tree */
  p(cx + 98, cy - 20, 2, 24, "#6b4a2a");
  p(cx + 94, cy + 2, 10, 2, "#6b4a2a");
  [["#d1202f", -6, -16], ["#f4f0e4", 3, -11], ["#e6c200", -6, -7]].forEach(([c, dx, dy]) => box(cx + 99 + dx, cy + dy, 5, 5, c, "#141414"));
  /* fridge, with magnets */
  const fx = k.x + k.w - 30;
  shadow(fx + 1, k.y + 50, 26, 6);
  box(fx, k.y + 2, 26, 50, "#f0ece4", "#141414");
  p(fx + 1, k.y + 3, 6, 47, "#ffffff");
  p(fx, k.y + 18, 26, 1, "#141414");
  p(fx + 20, k.y + 8, 2, 7, "#9a968c");
  p(fx + 20, k.y + 24, 2, 10, "#9a968c");
  p(fx + 8, k.y + 26, 3, 3, "#d1202f");
  p(fx + 13, k.y + 30, 3, 3, "#1a7a52");
  p(fx + 9, k.y + 36, 6, 6, "#f4f0e4");
  p(fx + 9, k.y + 36, 6, 1, "#c4a574");
  if (!EMBED) drawPlate(k.x + 92, k.y + k.h - 16, ["KETTLE CORNER"]);
}

function drawLounge() {
  const l = LOUNGE;
  /* Rug: cream border, red field, a bit worn where Dexter supervises it. */
  const rx = l.x + 8, ry = l.y + 52, rw = l.w - 14, rh = l.h - 62;
  shadow(rx + 2, ry + rh - 2, rw, 5);
  p(rx, ry, rw, rh, "#f2e6c8");
  p(rx + 4, ry + 4, rw - 8, rh - 8, "#8a2a2a");
  p(rx + 8, ry + 8, rw - 16, rh - 16, "#7a2424");
  for (let i = 0; i < rw - 12; i += 8) {
    p(rx + 6 + i, ry + 6, 4, 1, "#d1202f");
    p(rx + 6 + i, ry + rh - 7, 4, 1, "#d1202f");
  }
  for (let i = 0; i < rw; i += 4) {
    p(rx + i, ry - 2, 1, 2, "#e8dcc0");
    p(rx + i, ry + rh, 1, 2, "#e8dcc0");
  }
  p(rx + rw / 2 - 10, ry + rh / 2 + 8, 20, 6, "#6b1c1c");
  /* The sofa, facing us: teal velvet, three cushions, two fat arms. */
  const s = SOFA;
  shadow(s.x + 2, s.y + s.h - 2, s.w, 7);
  box(s.x + 8, s.y, s.w - 16, 24, "#1f5a5e", "#141414");
  p(s.x + 10, s.y + 2, s.w - 20, 5, "#2f7a7e");
  box(s.x + 10, s.y + 22, s.w - 20, 22, "#2a6e72", "#141414");
  for (let i = 1; i < 3; i++) p(s.x + 10 + i * ((s.w - 20) / 3), s.y + 23, 1, 20, "#1f5a5e");
  p(s.x + 11, s.y + 23, s.w - 22, 3, "#3a8a8e");
  box(s.x, s.y + 10, 14, s.h - 10, "#1f5a5e", "#141414");
  box(s.x + s.w - 14, s.y + 10, 14, s.h - 10, "#1f5a5e", "#141414");
  p(s.x + 2, s.y + 11, 10, 4, "#2f7a7e");
  p(s.x + s.w - 12, s.y + 11, 10, 4, "#2f7a7e");
  p(s.x + 4, s.y + s.h, 4, 3, "#3d2a1c");
  p(s.x + s.w - 8, s.y + s.h, 4, 3, "#3d2a1c");
  /* Coffee table with two mugs and a newspaper. */
  const tx = s.x + 40, ty = s.y + 78;
  shadow(tx + 2, ty + 14, 62, 6);
  box(tx, ty, 62, 14, "#8b5a2b", "#141414");
  p(tx + 1, ty + 1, 60, 3, "#b07a40");
  p(tx + 4, ty + 14, 4, 5, "#5a3c22");
  p(tx + 54, ty + 14, 4, 5, "#5a3c22");
  box(tx + 8, ty + 2, 18, 9, "#f4f0e4", "#141414");
  p(tx + 10, ty + 4, 10, 1, "#141414");
  p(tx + 10, ty + 6, 13, 1, "#6a6a6a");
  p(tx + 10, ty + 8, 8, 1, "#6a6a6a");
  box(tx + 36, ty - 2, 6, 6, "#d1202f", "#141414");
  box(tx + 46, ty, 6, 6, "#f4f0e4", "#141414");
  /* Standard lamp and plants. */
  p(l.x + l.w - 12, l.y + 4, 1, 40, "#3d2a1c");
  box(l.x + l.w - 20, l.y, 16, 10, "#f2d36b", "#3d2a1c");
  p(l.x + l.w - 18, l.y + 1, 12, 3, "#fff1b0");
  p(l.x + l.w - 16, l.y + 44, 10, 2, "#3d2a1c");
  drawPlant(l.x + l.w - 24, l.y + l.h - 28);
  if (currentSeason() !== "december") drawPlant(l.x + 2, l.y + 30);
}

function drawMachineCorner() {
  const m = MACHINE_CORNER;
  /* Bare concrete, hazard tape round the edge, and a sign nobody needed to write. */
  p(m.x, m.y, m.w, m.h, "#4a4844");
  for (let i = 0; i < 6; i++) p(m.x + 10 + i * 17, m.y + 20 + (i * 37) % (m.h - 40), 9, 1, "#3a3834");
  p(m.x + 30, m.y + 70, 1, 14, "#2a2824");
  p(m.x + 31, m.y + 83, 8, 1, "#2a2824");
  for (let i = 0; i < m.w; i += 10) {
    p(m.x + i, m.y, 6, 4, "#e6c200");
    p(m.x + i + 6, m.y, 4, 4, "#141414");
  }
  for (let i = 0; i < m.h; i += 10) {
    p(m.x, m.y + i, 4, 6, "#e6c200");
    p(m.x, m.y + i + 6, 4, 4, "#141414");
  }
  p(m.x - 2, m.y, 2, m.h, "#141414");
  p(m.x, m.y + m.h, m.w, 2, "#141414");
  if (!EMBED) drawPlate(m.x + m.w / 2 + 2, m.y + 12, ["DO NOT", "TOUCH"], "#e6c200");
  const mc = MACHINE;
  shadow(mc.x - 2, mc.y + mc.h, mc.w + 8, 7);
  p(mc.x - 8, mc.y + mc.h - 2, mc.w + 16, 8, "#141414");
  for (let i = 0; i < 10; i++) p(mc.x - 8 + i * 10, mc.y + mc.h - 2, 6, 8, i % 2 ? "#e6c200" : "#141414");
  box(mc.x + 8, mc.y + 28, 60, 32, "#2a2420", "#141414");
  p(mc.x + 10, mc.y + 30, 20, 28, "#3a342e");
  p(mc.x + 12, mc.y + 32, 8, 2, "#5a5248");
  box(mc.x + 14, mc.y + 8, 44, 32, "#3a2a48", "#141414");
  p(mc.x + 16, mc.y + 10, 14, 28, "#4a3a58");
  p(mc.x + 4, mc.y + 22, 12, 2, "#141414");
  p(mc.x + 4, mc.y + 22, 2, 26, "#141414");
  p(mc.x + 68, mc.y + 36, 10, 2, "#141414");
  box(mc.x + 20, mc.y + 40, 14, 14, "#f4f0e4", "#141414");
  p(mc.x + 24, mc.y + 44, 6, 7, "#d1202f");
  p(mc.x + 52, mc.y + 4, 2, 20, "#c0c0c0");
  if (!EMBED) drawLabel(mc.cx, mc.y + mc.h - 8, "NO", "#d1202f");
}

function drawPrinterStation() {
  const s = printerStation;
  if (!s) return;
  const x = s.x + 10, y = s.y + 6;
  /* A small table of its own, and the printer, which is having a day. */
  shadow(s.x + 6, s.y + 34, s.w - 10, 6);
  box(s.x + 4, s.y + 22, s.w - 8, 10, "#6b5344", "#141414");
  p(s.x + 5, s.y + 23, s.w - 10, 3, "#8a7360");
  p(s.x + 8, s.y + 32, 5, 8, "#4a3a30");
  p(s.x + s.w - 13, s.y + 32, 5, 8, "#4a3a30");
  box(x, y + 4, 36, 18, "#d8d2c6", "#141414");
  p(x + 1, y + 5, 34, 3, "#f0ece4");
  box(x + 4, y - 4, 28, 9, "#c4bfb2", "#141414");
  p(x + 6, y - 2, 24, 5, "#22409a");
  p(x + 7, y - 1, 10, 2, "#4a6ab0");
  p(x + 6, y + 18, 24, 3, "#f4f0e4");
  /* the jam */
  p(x + 10, y + 20, 8, 6, "#f4f0e4");
  p(x + 11, y + 22, 6, 1, "#9a968c");
  drawPlant(s.x + s.w - 4, s.y + 12);
}

/* Everything that never moves, painted once into an off-screen sheet. */
function paintScenery() {
  windowPanes.length = 0;
  ctx.drawImage(ensurePlanks(), 0, 0);
  p(0, 0, W, TOP_H + 2, "#efe6d4");
  drawCarpet(FLOOR_BLOCK.x, FLOOR_BLOCK.y, FLOOR_BLOCK.w, FLOOR_BLOCK.h);
  drawNook();
  drawKettleCorner();
  drawWaterCooler(KETTLE.x + 2, KETTLE.y + 54);
  drawLounge();
  drawMachineCorner();
  drawPrinterStation();
  drawAllRooms();
  drawSeasonalScenery();
  p(0, 0, W, 2, "#141414");
  p(0, H - 2, W, 2, "#141414");
  p(0, 0, 2, H, "#141414");
  p(W - 2, 0, 2, H, "#141414");
}

function buildScenery() {
  const sheet = document.createElement("canvas");
  sheet.width = W;
  sheet.height = H;
  const sctx = sheet.getContext("2d");
  if (!sctx) return null;
  ctx = sctx;
  ctx.imageSmoothingEnabled = false;
  paintScenery();
  ctx = screenCtx;
  paintedSky = currentSky();
  paintedSeason = currentSeason();
  return sheet;
}
function syncAtmosphere() {
  if (paintedSky !== currentSky() || paintedSeason !== currentSeason()) {
    sceneSheet = buildScenery();
    if (!shouldAnimate()) drawFrame();
  }
}

/* The bits of scenery that move: steam, toast, the arcade screen, the darts, the machine. */
function dartsRemaining() {
  /* A 301 game that ticks down through the UK day, plus any throws this visit. */
  const t = ukNow();
  const elapsed = Math.max(0, t.hour * 60 + t.minute - 8 * 60);
  const visits = Math.floor(elapsed / 11);
  let score = 301;
  for (let i = 0; i < visits; i++) score = Math.max(0, score - (15 + (i * 17) % 46));
  score = Math.max(0, score - (darts.session || 0));
  return score;
}

function drawWallClock() {
  const cx = CLOCK.cx, cy = CLOCK.cy, r = CLOCK.r;
  disc(cx, cy, r + 2, "#3d2a1c");
  disc(cx, cy, r, "#f4f0e4");
  p(cx, cy - r + 2, 1, 3, "#141414");
  p(cx, cy + r - 4, 1, 3, "#141414");
  p(cx - r + 2, cy, 3, 1, "#141414");
  p(cx + r - 4, cy, 3, 1, "#141414");
  const t = ukNow();
  const hourAng = ((t.hour % 12) + t.minute / 60) / 12 * Math.PI * 2 - Math.PI / 2;
  const minAng = (t.minute + t.second / 60) / 60 * Math.PI * 2 - Math.PI / 2;
  line(cx, cy, cx + Math.cos(hourAng) * (r - 6), cy + Math.sin(hourAng) * (r - 6), "#141414");
  line(cx, cy, cx + Math.cos(minAng) * (r - 3), cy + Math.sin(minAng) * (r - 3), "#3d2a1c");
  if (!REDUCE) {
    const secAng = t.second / 60 * Math.PI * 2 - Math.PI / 2;
    line(cx, cy, cx + Math.cos(secAng) * (r - 2), cy + Math.sin(secAng) * (r - 2), "#d1202f");
  }
  p(cx, cy, 2, 2, "#d1202f");
}

function drawCanteenSpecial() {
  const room = rooms.find(r => r.id === "canteen");
  if (!room) return;
  const x = room.x + 168, y = room.y + 4, w = 70, h = 22;
  box(x, y, w, h, "#2a2a18", "#6b4a2a");
  p(x + 1, y + 1, w - 2, 1, "#4a4a30");
  if (!EMBED) {
    drawLabel(x + w / 2, y + 3, "TODAY", "#c8c4a0");
    drawLabel(x + w / 2, y + 12, todaySpecial(), "#f4f0e4");
  }
}

function drawDartsScore() {
  const x = BOARD.cx - 48, y = 4;
  const left = dartsRemaining();
  if (EMBED) return;
  drawLabel(x + 16, y + 6, "301", "#8a8668");
  p(x + 4, y + 13, 24, 1, "#5a5640");
  drawLabel(x + 16, y + 16, left === 0 ? "GAME" : String(left), "#f4f0e4");
}

function drawLiveScenery() {
  const kx = KETTLE.x + 18, ky = KETTLE.y + 12 - 18;
  const brewing = people.some(pr => pr.activity === "kettle" && !pr.target);
  /* Steam only really gets going when someone is on kettle duty. */
  /* Puffs stay over the counter, rather than drifting up into the games nook. */
  if (brewing) {
    const s1 = REDUCE ? 0.4 : (animT * 1.4) % 1;
    const s2 = REDUCE ? 0.7 : (animT * 1.1 + 0.35) % 1;
    const s3 = REDUCE ? 0.2 : (animT * 1.7 + 0.6) % 1;
    p(kx + 13, ky + 2 - s1 * 8, 3, 4, "#ffffffdd");
    p(kx + 18, ky + 1 - s2 * 9, 3, 4, "#ffffffbb");
    p(kx + 10, ky + 4 - s3 * 7, 2, 3, "#ffffffcc");
    p(kx + 16, ky - 2 - s2 * 5, 4, 3, "#ffffff88");
    p(kx + 21, ky + 3 - s1 * 6, 2, 3, "#ffffff99");
  }
  drawWallClock();
  drawCanteenSpecial();
  drawDartsScore();
  /* Toast pops up every so often. */
  const tx = KETTLE.x + 16 + 42, ty = KETTLE.y + 12 - 8;
  const pop = !REDUCE && (animT % 9) > 7.6;
  if (pop) {
    p(tx + 4, ty - 6, 4, 6, "#c4893a");
    p(tx + 12, ty - 5, 4, 5, "#c4893a");
    p(tx + 4, ty - 6, 4, 1, "#8a5a20");
  }
  /* Arcade screen: attract mode, or a proper game when somebody is playing. */
  const c = CABINET, sx = c.x + 5, sy = c.y + 15, sw = c.w - 10, sh = 20;
  const playing = people.some(pr => pr.activity === "arcade" && !pr.target && !(pr.spot && pr.spot.watch));
  p(sx, sy, sw, sh, playing ? "#101830" : "#141428");
  if (playing) {
    const t = REDUCE ? 0.4 : (animT * 0.5) % 1;
    for (let i = 0; i < 6; i++) if (i / 6 > t) p(sx + 2 + i * 4, sy + 10, 1, 1, "#f2e6a0");
    p(sx + 1 + Math.round(t * (sw - 6)), sy + 8, 5, 5, "#e6c200");
    p(sx + 3 + Math.round(t * (sw - 6)), sy + 10, 3, 1, "#101830");
    p(sx + 2, sy + 2, 3, 1, "#e23d4a");
    p(sx + sw - 6, sy + 2, 4, 1, "#3dff7a");
    const g = Math.round(((t + 0.6) % 1) * (sw - 6));
    p(sx + sw - 6 - g, sy + 13, 4, 4, "#e040fb");
  } else if (REDUCE || (animT % 1.4) < 0.9) {
    p(sx + 3, sy + 8, sw - 6, 1, "#d1202f");
    p(sx + 5, sy + 11, sw - 10, 1, "#e6c200");
  }
  /* Darts in the board, and one in flight. */
  darts.stuck.forEach(d => {
    p(d.x, d.y, 1, 1, "#141414");
    p(d.x - 1, d.y + 1, 1, 2, "#f4f0e4");
    p(d.x - 2, d.y + 2, 1, 1, "#d1202f");
  });
  if (darts.flying) {
    const f = darts.flying, t = Math.min(1, f.t);
    const x = f.x0 + (f.x1 - f.x0) * t, y = f.y0 + (f.y1 - f.y0) * t - Math.sin(t * Math.PI) * 6;
    p(x, y, 2, 1, "#141414");
    p(x - 2, y + 1, 2, 1, "#d1202f");
  }
  /* The machine's eye. Everyone pretends not to notice it. */
  const m = MACHINE;
  const pulse = REDUCE ? 0.55 : (Math.sin(animT * 3.2) * 0.5 + 0.5);
  const glow = pulse > 0.55 ? "#a04ad0" : "#3dff7a";
  const glowDim = pulse > 0.55 ? "#6b2a8a" : "#1a6b3a";
  p(m.x + 22, m.y - 4, 28, 22, glowDim);
  p(m.x + 26, m.y, 20, 16, glow);
  p(m.x + 30, m.y + 3, 12, 10, "#f4f0e4");
  p(m.x + 33, m.y + 5, 6, 6, "#141414");
  p(m.x + 34, m.y + 6, 2, 2, "#f4f0e4");
  if (!REDUCE && ((animT * 7) % 1) < 0.22) {
    p(m.x + 56, m.y - 6, 3, 3, "#e6c200");
    p(m.x + 60, m.y, 2, 2, "#f4f0e4");
    p(m.x + 54, m.y + 2, 2, 2, "#3dff7a");
  }
  if (machineEventActive()) drawMachineFuss(m);
  /* The printer's light blinks orange. It always blinks orange. */
  if (printerStation) {
    const led = !REDUCE && (animT % 1 < 0.5);
    p(printerStation.x + 10 + 31, printerStation.y + 6 + 9, 3, 3, led ? "#e07a2f" : "#6a3a10");
  }
}

function drawMachineFuss(m) {
  const t = machineEvent.t;
  const flash = REDUCE || ((t * 18) % 1) < 0.55;
  /* The eye goes a bit mental, then the sparks start. */
  p(m.x + 20, m.y - 8, 32, 26, flash ? "#f4f0e4" : "#d1202f");
  p(m.x + 24, m.y - 4, 24, 20, flash ? "#e6c200" : "#a04ad0");
  p(m.x + 30, m.y + 2, 12, 10, "#141414");
  p(m.x + 33, m.y + 5, 6, 6, flash ? "#3dff7a" : "#d1202f");
  const sparks = [
    [m.x + 8, m.y - 12], [m.x + 62, m.y - 10], [m.x + 70, m.y + 8],
    [m.x + 4, m.y + 16], [m.x + 58, m.y - 20], [m.x + 16, m.y - 22],
    [m.x + 74, m.y - 4], [m.x + 40, m.y - 26]
  ];
  sparks.forEach(function (s, i) {
    const on = REDUCE ? (i % 2 === 0) : ((t * 14 + i * 0.37) % 1) < 0.6;
    if (!on) return;
    const col = i % 3 === 0 ? "#f4f0e4" : (i % 3 === 1 ? "#e6c200" : "#3dff7a");
    p(s[0], s[1], 3, 3, col);
    p(s[0] + (i % 2 ? 4 : -4), s[1] - 3, 2, 2, col);
    p(s[0] + (i % 2 ? 7 : -6), s[1] - 1, 1, 4, col);
  });
}

function drawRainOnWindows() {
  if (!isRaining() || !windowPanes.length) return;
  const sky = currentSky();
  const drop = sky === "night" ? "#c5d8e4" : (sky === "dusk" ? "#efe6d4" : "#3a5a78");
  const veil = sky === "night" ? "#12183099" : (sky === "dusk" ? "#4a2a3c44" : "#6a8aa066");
  windowPanes.forEach(function (w, wi) {
    p(w.x + 2, w.y + 2, w.w - 4, w.h - 4, veil);
    const n = 7;
    for (let i = 0; i < n; i++) {
      const col = (w.x + 4 + ((i * 11 + wi * 5) % Math.max(2, w.w - 8)));
      let row;
      if (REDUCE) {
        row = w.y + 3 + ((i * 7 + wi) % Math.max(2, w.h - 7));
      } else {
        const fall = (animT * (18 + (i % 4) * 6) + i * 9 + wi * 13) % Math.max(3, w.h - 5);
        row = w.y + 3 + fall;
      }
      if (row > w.y + w.h - 4) continue;
      p(col, row, 1, 4, drop);
      if (i % 2 === 0) p(col, row + 1, 1, 2, "#f4f0e4aa");
    }
    /* Put the mullion back over the rain, so the window still reads as a window. */
    p(w.x + Math.floor(w.w / 2) - 1, w.y, 2, w.h, "#3d2a1c");
    p(w.x, w.y + Math.floor(w.h / 2), w.w, 2, "#3d2a1c");
  });
}

function drawFerretDash() {
  if (!ferretDash) return;
  const u = Math.min(1, ferretDash.t / ferretDash.dur);
  const x = Math.round(-24 + u * (W + 48));
  const y = 272 + (REDUCE ? 0 : Math.round(Math.sin(ferretDash.t * 22) * 2));
  const brown = "#8a5a32", dark = "#5a3a20", cream = "#e8d6b8", nose = "#c48a8a";
  shadow(x - 8, y + 3, 28, 4);
  /* A long little body, cream bib, and a bit of a dash. */
  p(x - 6, y - 8, 22, 9, brown);
  p(x - 4, y - 7, 14, 5, dark);
  p(x + 4, y - 6, 8, 5, cream);
  p(x + 12, y - 14, 12, 10, brown);
  p(x + 14, y - 15, 8, 6, cream);
  p(x + 14, y - 12, 3, 3, "#141414");
  p(x + 20, y - 12, 3, 3, "#141414");
  p(x + 15, y - 11, 1, 1, "#f4f0e4");
  p(x + 21, y - 11, 1, 1, "#f4f0e4");
  p(x + 22, y - 8, 3, 2, nose);
  p(x + 24, y - 7, 3, 1, "#3d2a1c");
  p(x + 12, y - 16, 3, 3, brown);
  p(x + 18, y - 16, 3, 3, brown);
  p(x - 14, y - 10, 10, 5, brown);
  p(x - 18, y - 14, 8, 5, dark);
  const step = REDUCE ? 0 : ((ferretDash.t * 14 | 0) % 2);
  p(x - 2, y + 1, 4, 3, dark);
  p(x + 8, y + 1, 4, 3, dark);
  p(x + (step ? 2 : 12), y + 2, 3, 2, "#3d2a1c");
}

function drawFlinchBang(who) {
  if (!machineEventActive()) return;
  const f = flinchOffset(who);
  const x = Math.round(who.x + f.x);
  let top = 26;
  if (who.staff) {
    const k = who.staff.kind;
    top = (k === "kenneth" || k === "reggie") ? 64 : (k === "terry" || k === "keith") ? 60 : 54;
  } else if (who.id === "spyro" && who.deskSit) top = 34;
  const y = Math.round(who.y + f.y) - top;
  /* A little comic startle, so the flinch reads even in a still frame. */
  p(x, y - 8, 2, 5, "#141414");
  p(x, y - 2, 2, 2, "#141414");
  p(x + 1, y - 8, 1, 5, "#f4f0e4");
}

function drawCatBubble(c) {
  if (!c.bubble || c.bubble.t <= 0) return;
  const text = c.bubble.text;
  const x = Math.round(c.x + flinchOffset(c).x);
  const y = Math.round(c.y + flinchOffset(c).y);
  const top = y - 28;
  const w = text.length * 4 + 5, h = 10;
  let bx = Math.round(x - w / 2);
  bx = Math.max(4, Math.min(W - w - 4, bx));
  box(bx, top - h, w, h, "#fffdf7", "#141414");
  p(x - 1, top - 1, 3, 2, "#fffdf7");
  p(x - 2, top, 1, 2, "#141414");
  p(x + 2, top, 1, 2, "#141414");
  p(x - 1, top + 2, 3, 1, "#141414");
  drawLabel(bx + w / 2, top - h + 3, text, "#141414");
}

function drawLateLamp(d) {
  /* Private offices are tight under the nameplate, so the lamp sits a little lower. */
  const lx = d.x + d.w - 14, ly = d.y + (d.private ? 8 : -2);
  /* A warm pool of light on the desk, then the lamp itself. */
  p(lx - 8, ly + 14, 22, 10, "#f2d36b44");
  p(lx - 4, ly + 16, 14, 6, "#f2d36b66");
  p(lx + 2, ly + 18, 4, 8, "#3d2a1c");
  p(lx + 2, ly + 4, 2, 14, "#c0c0c0");
  box(lx - 4, ly, 12, 7, "#e6c200", "#141414");
  p(lx - 3, ly + 1, 10, 3, "#f2e6a0");
  p(lx, ly + 7, 2, 3, "#c0c0c0");
}

function drawSnow() {
  if (currentSeason() !== "december") return;
  if (REDUCE) {
    /* A little settled snow, no falling flakes. */
    for (let i = 0; i < 18; i++) {
      const x = (i * 37 + 11) % W, y = (i * 53 + 20) % 40 + TOP_H - 8;
      p(x, y, 2, 1, "#ffffffcc");
    }
    return;
  }
  const n = 36;
  for (let i = 0; i < n; i++) {
    const speed = 12 + (i % 5) * 6;
    const x = (i * 79 + animT * (8 + i % 6)) % W;
    const y = (i * 47 + animT * speed) % H;
    p(x, y, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1, i % 2 ? "#ffffff" : "#e8f0ff");
  }
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
    [[r.x + 112, r.y + 70], [r.x + 184, r.y + 70]].forEach(([tx, ty]) => {
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
  } else if (!d.private) {
    /* A bit of desk clutter, so the rows do not look like a showroom. */
    const k = STAFF.indexOf(d.staff) % 4;
    if (k === 0) {
      p(d.x + 6, y + 12, 9, 5, "#f4f0e4");
      p(d.x + 7, y + 11, 8, 1, "#d8d4c8");
      p(d.x + 7, y + 14, 6, 1, "#9a968c");
    } else if (k === 1) {
      box(d.x + d.w - 13, y + 11, 6, 6, "#c45c26", "#3d2a1c");
      p(d.x + d.w - 12, y + 5, 4, 6, "#2a8a5a");
      p(d.x + d.w - 13, y + 7, 1, 2, "#2a8a5a");
    } else if (k === 2) {
      p(d.x + d.w - 12, y + 15, 7, 2, "#3d2a1c");
      p(d.x + d.w - 10, y + 6, 1, 9, "#3d2a1c");
      box(d.x + d.w - 13, y + 3, 7, 4, "#e6c200", "#3d2a1c");
    }
  }
  const owl = nightOwl();
  if (owl && owl.desk === d) drawLateLamp(d);
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
  } else if (kind === "reel") {
    box(px, py, 9, 9, "#2a2a2a", "#141414");
    p(px + 1, py + 1, 7, 7, "#d4af37");
    p(px + 3, py + 3, 3, 3, "#2a2a2a");
    p(px + 8, py + 2, 3, 5, "#3d2a1c");
  } else if (kind === "coin") {
    /* Penny's coin: every few seconds it spins on the spot, then sits still again. */
    const spin = !REDUCE && ((animT * 0.55) % 7) < 1.1;
    const phase = spin ? Math.abs(Math.cos(animT * 10)) : 1;
    const cw = Math.max(1, Math.round(9 * phase));
    const cx = px + 4 - Math.floor(cw / 2);
    p(cx + 1, py, cw - 2, 9, "#d4af37");
    p(cx, py + 2, cw, 5, "#d4af37");
    if (cw > 3) {
      p(cx + Math.floor(cw / 2), py + 2, 1, 5, "#f2e6a0");
      if (cw > 5) p(cx + Math.floor(cw / 2), py + 3, 1, 3, "#8a6a20");
    }
  } else if (kind === "whistle") {
    box(px, py + 2, 8, 4, "#c0c0c0", "#141414");
    p(px + 8, py + 3, 3, 2, "#c0c0c0");
    p(px + 2, py, 3, 3, "#c45c26");
  } else if (kind === "badge") {
    p(px + 1, py, 7, 2, "#c0c0c0");
    p(px, py + 2, 9, 5, "#c0c0c0");
    p(px + 1, py + 7, 7, 2, "#c0c0c0");
    p(px + 2, py + 2, 5, 5, "#1b2b1a");
    p(px + 3, py + 3, 3, 2, "#d4af37");
  } else if (kind === "megaphone") {
    p(px, py + 3, 4, 4, "#7a1a5c");
    p(px + 3, py + 1, 3, 8, "#7a1a5c");
    p(px + 6, py, 4, 10, "#e040fb");
    p(px + 1, py + 7, 3, 3, "#1a1a1a");
  } else if (kind === "teacup") {
    box(px, py + 3, 7, 5, "#f4f0e4", "#141414");
    p(px + 1, py + 4, 5, 3, "#c5a572");
    p(px + 7, py + 4, 3, 3, "#f4f0e4");
    p(px + 2, py, 2, 3, "#d8d4c8");
    p(px + 5, py + 1, 2, 2, "#d8d4c8");
  } else if (kind === "crate") {
    box(px, py + 3, 10, 7, "#c4a574", "#141414");
    p(px + 1, py + 5, 8, 1, "#8a6a40");
    p(px + 2, py, 3, 4, "#d4b896");
    p(px + 5, py + 1, 4, 3, "#b08956");
    p(px + 3, py + 2, 2, 2, "#8a6a40");
  } else if (kind === "grant") {
    box(px, py + 4, 6, 6, "#c4a574", "#141414");
    p(px + 1, py + 5, 4, 4, "#a8875a");
    p(px + 2, py + 2, 2, 3, "#8a6a40");
    p(px + 4, py, 6, 6, "#a8d4e8");
    p(px + 5, py + 1, 4, 4, "#d4e8f4");
    p(px + 9, py + 5, 3, 2, "#d4af37");
  } else if (kind === "trophy") {
    box(px, py, 9, 7, "#d4af37", "#141414");
    p(px + 1, py + 1, 7, 5, "#f2e6a0");
    p(px + 3, py + 2, 1, 3, "#1a1a1a");
    p(px + 4, py + 2, 2, 3, "#1a1a1a");
    p(px + 5, py + 3, 1, 1, "#1a1a1a");
  } else if (kind === "tablet") {
    /* Kraken Keith's tablet: the chart flips from a green rise to a red dip. */
    const up = REDUCE || ((animT * 0.35 | 0) % 2 === 0);
    box(px, py, 10, 9, "#1a1a1a", "#141414");
    p(px + 1, py + 1, 8, 7, up ? "#0e1a14" : "#1a0e0e");
    const col = up ? "#3dff7a" : "#d1202f";
    const bars = up ? [2, 3, 3, 5, 4, 6] : [6, 5, 5, 3, 4, 2];
    bars.forEach((h, i) => p(px + 2 + i, py + 8 - h, 1, Math.max(1, h - 1), col));
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
  if (s.kind === "keith") {
    drawKeith(pr);
    return;
  }
  const cele = pr.phase === "celebrating";
  const walk = pr.phase === "idle" || pr.phase === "to-desk";
  const work = isWorkingPose(pr);
  const moving = !REDUCE && walk && pr.target;
  const frame = moving ? walkFrame(pr) : 0;
  const jump = (!REDUCE && cele) ? Math.round(Math.abs(Math.sin(pr.celeT * 10)) * 8) : 0;
  const bob = moving ? (frame === 1 ? 0 : 1) : idleBob(pr);
  const x = Math.round(pr.x);
  let y = Math.round(pr.y - jump + bob);
  const sit = isSeated(pr);
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
  if (sit) {
    drawSeatedLegs(x, y, trouser, shoe);
    y += SIT_DROP;
  } else if (frame === 1) {
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
  const held = ["clipboard", "envelope", "book", "joystick", "basket", "spool", "duck", "reel", "coin", "whistle", "badge", "megaphone", "teacup", "crate", "grant", "trophy", "quill"];
  const armX = left ? x - 11 : x + 7;
  p(armX, y - 22, 4, 10, s.skin);
  if (held.includes(s.prop)) drawProp(left ? x - 16 : x + 9, y - 20, s.prop, pr.facing);
  if (cele) {
    p(x - 12, y - 36 - Math.min(jump, 4), 4, 8, s.skin);
    p(x + 8, y - 38 - Math.min(jump, 4), 4, 8, s.skin);
  }
}

/* Kraken Keith, from his portrait: a purple octopus in round black glasses and a navy
   waistcoat with a gold brooch, his chart tablet in one tentacle and a gold coin in another. */
function drawKeith(pr) {
  const cele = pr.phase === "celebrating";
  const walk = pr.phase === "idle" || pr.phase === "to-desk";
  const work = isWorkingPose(pr);
  const moving = !REDUCE && walk && pr.target;
  const frame = moving ? walkFrame(pr) : 0;
  const jump = (!REDUCE && cele) ? Math.round(Math.abs(Math.sin(pr.celeT * 10)) * 8) : 0;
  const bob = moving ? (frame === 1 ? 0 : 1) : idleBob(pr);
  const x = Math.round(pr.x);
  let y = Math.round(pr.y - jump + bob);
  const sit = isSeated(pr);
  const left = pr.facing === "l";
  const skin = "#8a5cc4", skinD = "#6a3fa0", skinL = "#a87ad8", sucker = "#e8a0b8";
  const vest = "#1e2a4a", gold = "#d4af37";
  shadow(x - 9, Math.round(pr.y) + 2, 18, 5);

  if (work) {
    /* Seated, back to us: waistcoat, the back of a large purple head, two tentacles typing. */
    box(x - 8, y - 14, 16, 14, vest, "#141414");
    p(x - 7, y - 13, 5, 4, lite(vest, 0.2));
    p(x - 6, y - 35, 12, 3, skin);
    p(x - 6, y - 35, 12, 1, "#141414");
    box(x - 8, y - 33, 16, 19, skin, "#141414");
    p(x - 6, y - 31, 5, 7, skinL);
    p(x + 3, y - 29, 1, 1, skinD);
    p(x - 2, y - 25, 1, 1, skinD);
    p(x - 10, y - 25, 2, 1, "#141414");
    p(x + 8, y - 25, 2, 1, "#141414");
    const tap = (!REDUCE && ((pr.typeT * 6 | 0) % 2)) ? 1 : 0;
    p(x - 13, y - 9, 6, 3, skin);
    p(x - 15, y - 8, 3, 4, skin);
    p(x + 7, y - 9 + tap, 6, 3, skin);
    p(x + 12, y - 8 + tap, 3, 4, skin);
    return;
  }

  /* Tentacles where the legs would be, with a little wiggle when he walks. */
  if (sit) {
    for (let i = 0; i < 4; i++) {
      p(x - 7 + i * 4, y - 4, 3, 4, skin);
      p(x - 7 + i * 4, y, 3, 1, sucker);
    }
    y += SIT_DROP;
  } else {
    for (let i = 0; i < 4; i++) {
      const tx = x - 7 + i * 4;
      const out = i < 2 ? -1 : 1;
      const sway = moving && ((i + frame) % 2) ? 1 : 0;
      p(tx, y - 12, 3, 9, skin);
      p(tx + out * (1 + sway), y - 4, 3, 3, skin);
      p(tx + out * (2 + sway), y - 1, 3, 2, skin);
      p(tx + out * (1 + sway) + 1, y - 3, 1, 1, sucker);
    }
  }

  /* Navy waistcoat, dark buttons, gold brooch. */
  box(x - 7, y - 24, 14, 14, vest, "#141414");
  p(x - 6, y - 23, 4, 4, lite(vest, 0.2));
  p(x - 1, y - 18, 1, 1, "#0a1020");
  p(x - 1, y - 14, 1, 1, "#0a1020");
  p(x + 2, y - 22, 3, 3, gold);
  p(x + 3, y - 21, 1, 1, "#c47a1a");

  /* The big domed head. */
  p(x - 6, y - 47, 12, 4, skin);
  p(x - 6, y - 48, 12, 1, "#141414");
  p(x - 7, y - 47, 1, 3, "#141414");
  p(x + 6, y - 47, 1, 3, "#141414");
  box(x - 8, y - 44, 16, 20, skin, "#141414");
  p(x - 6, y - 46, 4, 7, skinL);
  p(x + 3, y - 43, 1, 1, skinD);
  p(x + 1, y - 40, 1, 1, skinD);
  p(x - 4, y - 38, 1, 1, skinD);
  /* Round black glasses; the pupils follow where he is looking. */
  const glance = pr.glanceT > 0;
  p(x - 6, y - 35, 5, 5, "#141414");
  p(x + 1, y - 35, 5, 5, "#141414");
  p(x - 5, y - 34, 3, 3, "#fff");
  p(x + 2, y - 34, 3, 3, "#fff");
  p(x - 1, y - 33, 2, 1, "#141414");
  p(x + (left ? -5 : -4), y - 33, 2, 2, "#141414");
  p(x + (left ? 2 : 3), y - 33, 2, 2, "#141414");
  p(x - 6, y - 37, 4, 1, skinD);
  p(x + 2, y - 37, 4, 1, skinD);
  p(x - 2, y - 28, 5, 1, "#141414");
  p(x + 3, y - 29, 1, 1, "#141414");
  /* Face tentacles drooping over the waistcoat. */
  p(x - 5, y - 25, 2, 4, skin);
  p(x - 1, y - 25, 2, 5, skin);
  p(x + 3, y - 25, 2, 3, skin);
  if (glance) p(x + (left ? -10 : 9), y - 46, 2, 4, "#8ec8e6");

  /* The tablet in one tentacle... */
  const armX = left ? x - 11 : x + 7;
  p(armX, y - 22, 4, 10, skin);
  p(armX + 1, y - 14, 1, 1, sucker);
  drawProp(left ? x - 18 : x + 9, y - 21, "tablet", pr.facing);
  /* ...and the gold coin held up in another, unless that tentacle is busy with a mug or a dart. */
  const busy = pr.phase === "idle" && !pr.target && pr.spot &&
    ["kettle", "lounge", "darts", "rods", "canteen", "sofa", "music"].includes(pr.activity);
  if (cele) {
    p(x - 12, y - 36 - Math.min(jump, 4), 4, 10, skin);
    p(x + 8, y - 38 - Math.min(jump, 4), 4, 10, skin);
  } else if (!busy) {
    const ox = left ? x + 7 : x - 11;
    p(ox, y - 27, 4, 10, skin);
    p(ox + 1, y - 22, 1, 1, sucker);
    p(ox - 1, y - 33, 6, 6, "#141414");
    p(ox, y - 32, 4, 4, gold);
    p(ox + 1, y - 31, 2, 2, "#f2d36b");
  }
}

function drawKenneth(pr) {
  const cele = pr.phase === "celebrating";
  const walk = pr.phase === "idle" || pr.phase === "to-desk";
  const work = isWorkingPose(pr);
  const moving = !REDUCE && walk && pr.target;
  const frame = moving ? walkFrame(pr) : 0;
  const jump = (!REDUCE && cele) ? Math.round(Math.abs(Math.sin(pr.celeT * 10)) * 8) : 0;
  const bob = moving ? (frame === 1 ? 0 : 1) : idleBob(pr);
  const x = Math.round(pr.x);
  let y = Math.round(pr.y - jump + bob);
  const sit = isSeated(pr);
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
  if (sit) {
    drawSeatedLegs(x, y, trouser, shoe);
    y += SIT_DROP;
  } else if (frame === 1) {
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
  const work = isWorkingPose(pr);
  const moving = !REDUCE && walk && pr.target;
  const frame = moving ? walkFrame(pr) : 0;
  const jump = (!REDUCE && cele) ? Math.round(Math.abs(Math.sin(pr.celeT * 10)) * 8) : 0;
  const bob = moving ? (frame === 1 ? 0 : 1) : idleBob(pr);
  const x = Math.round(pr.x);
  let y = Math.round(pr.y - jump + bob);
  const sit = isSeated(pr);
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
  if (sit) {
    drawSeatedLegs(x, y, thigh, "#2a1c14");
    y += SIT_DROP;
  } else {
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
  }

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

function isSeated(pr) {
  return pr.phase === "idle" && !pr.target && !!pr.spot && !!pr.spot.seat && pr.activity === "sofa";
}

function drawSeatedLegs(x, y, trouser, shoe) {
  p(x - 6, y - 4, 5, 4, trouser);
  p(x + 2, y - 4, 5, 4, trouser);
  p(x - 6, y, 5, 2, shoe);
  p(x + 2, y, 5, 2, shoe);
}

function armColour(s) {
  if (s.kind === "kenneth") return "#9a968c";
  if (s.kind === "terry") return "#d8d4c8";
  if (s.kind === "reggie") return "#ccc8bc";
  return s.skin;
}

function drawMug(x, y, band) {
  box(x - 1, y, 6, 6, "#f4f0e4", "#141414");
  p(x, y + 2, 4, 2, band);
  if (!REDUCE) {
    const s = (animT * 1.4 + x * 0.07) % 1;
    p(x + 1, y - 3 - s * 5, 1, 2, "#ffffffaa");
  }
}

/* Whatever someone is up to at their idle spot, drawn over the top of them.
   Their own icon and prop are never changed; this only adds a mug, a rod, a dart... */
function drawActivity(pr) {
  if (pr.phase !== "idle" || pr.target || !pr.activity || !pr.spot) return;
  const s = pr.staff, kind = pr.activity, spot = pr.spot;
  const robot = s.kind === "terry" || s.kind === "reggie";
  const x = Math.round(pr.x);
  const y = Math.round(pr.y) + (isSeated(pr) ? SIT_DROP : 0) + idleBob(pr);
  const left = pr.facing === "l";
  const fx = left ? x + (robot ? 8 : 7) : x - (robot ? 12 : 11);  /* the free hand */
  const arm = armColour(s);
  const band = s.accent || "#d1202f";
  if (kind === "kettle" || kind === "lounge" || (kind === "sofa" && pr.salt % 2 === 0) || (kind === "darts" && spot.waiting)) {
    p(fx, y - 22, 4, 9, arm);
    drawMug(fx, y - 15, band);
  } else if (kind === "darts") {
    /* Throwing arm up, dart in hand, until it has just been thrown. */
    const thrown = !REDUCE && pr.throwT < 0.35;
    if (thrown) {
      p(fx + (left ? -2 : 2), y - 30, 4, 8, arm);
    } else {
      p(fx, y - 34, 4, 12, arm);
      p(fx + 1, y - 39, 1, 5, "#141414");
      p(fx, y - 36, 3, 1, "#d1202f");
    }
  } else if (kind === "rods") {
    const dir = left ? 1 : -1;
    p(fx, y - 22, 4, 9, arm);
    for (let i = 0; i < 20; i++) p(fx + 1 + dir * i, y - 14 - i, 1, 1, i < 4 ? "#3d2a1c" : "#5a5a5a");
    p(fx + dir * 3, y - 17, 3, 3, "#c0c0c0");
    const tipX = fx + 1 + dir * 19, tipY = y - 33;
    const bob = REDUCE ? 0 : Math.round(Math.sin(animT * 2 + pr.salt) * 1.5);
    p(tipX, tipY, 1, 16 + bob, "#e8e8e8");
    p(tipX - 1, tipY + 16 + bob, 3, 2, "#d1202f");
    p(tipX - 1, tipY + 18 + bob, 3, 1, "#f4f0e4");
  } else if (kind === "arcade" && !spot.watch) {
    const jig = REDUCE ? 0 : (((animT * 8 + pr.salt) | 0) % 2);
    p(fx, y - 22 + jig, 4, 9, arm);
  } else if (kind === "canteen") {
    p(fx, y - 20, 4, 7, arm);
    p(fx - 3, y - 14, 10, 2, "#f4f0e4");
    p(fx - 3, y - 13, 10, 1, "#9a968c");
    p(fx - 2, y - 17, 2, 3, "#f2c14e");
    p(fx + 1, y - 18, 2, 4, "#e6b23a");
    p(fx + 4, y - 17, 2, 3, "#f2c14e");
  } else if (kind === "music") {
    if (spot.guitar) {
      /* Air guitar, with an actual guitar, which slightly ruins the joke. */
      p(x - 8, y - 18, 16, 3, "#6b3d12");
      box(x - 12, y - 21, 9, 9, "#7a1f2b", "#141414");
      p(x - 9, y - 18, 3, 3, "#141414");
      const strum = REDUCE ? 0 : (((animT * 6) | 0) % 2);
      p(x - 6, y - 16 - strum * 2, 4, 3, arm);
    }
    if (!REDUCE) {
      const t = (animT * 0.7 + pr.salt * 0.37) % 1.6;
      if (t < 1.2) {
        const nx = x + 6 + Math.round(Math.sin(t * 5) * 2), ny = Math.round(y - 46 - t * 12);
        const col = t < 0.9 ? "#f2e6a0" : "#c4b880";
        p(nx, ny, 3, 2, col);
        p(nx + 2, ny - 6, 1, 6, col);
        p(nx + 2, ny - 6, 3, 1, col);
      }
    }
  }
}

function drawBubble(pr) {
  if (!pr.bubble || pr.bubble.delay > 0 || pr.target || pr.phase !== "idle") return;
  const text = pr.bubble.text;
  const x = Math.round(pr.x);
  const sit = isSeated(pr);
  const top = Math.round(pr.y) + (sit ? SIT_DROP : 0) - (pr.staff.kind === "kenneth" || pr.staff.kind === "reggie" ? 60 : pr.staff.kind === "terry" || pr.staff.kind === "keith" ? 56 : 50);
  const w = text.length * 4 + 5, h = 10;
  let bx = Math.round(x - w / 2);
  bx = Math.max(4, Math.min(W - w - 4, bx));
  box(bx, top - h, w, h, "#fffdf7", "#141414");
  p(x - 1, top - 1, 3, 2, "#fffdf7");
  p(x - 2, top, 1, 2, "#141414");
  p(x + 2, top, 1, 2, "#141414");
  p(x - 1, top + 2, 3, 1, "#141414");
  drawLabel(bx + w / 2, top - h + 3, text, "#141414");
}

function drawArthur(c) {
  const asleep = c.spot && c.spot.clock && !c.target;
  const bob = (!REDUCE && c.target && c.wait <= 0) ? ((c.walkT * 7 | 0) % 2) : 0;
  const x = Math.round(c.x), y = Math.round(c.y + bob);
  if (asleep) {
    /* A Ragdoll loaf, under the clock. Eyes shut, tail wrapped round. */
    shadow(x - 12, y + 2, 24, 5);
    const cream = "#e8d6b8", hi = "#f4efe4", point = "#6b5348", pointD = "#4a3a34";
    p(x - 13, y - 8, 26, 11, cream);
    p(x - 11, y - 10, 22, 5, hi);
    p(x - 8, y - 7, 16, 7, "#f4efe8");
    p(x - 8, y - 16, 14, 9, cream);
    p(x - 7, y - 17, 5, 5, point);
    p(x + 2, y - 17, 5, 5, point);
    p(x - 7, y - 13, 12, 6, point);
    p(x - 6, y - 10, 10, 3, cream);
    p(x - 5, y - 13, 4, 1, "#3d2a1c");
    p(x + 1, y - 13, 4, 1, "#3d2a1c");
    p(x - 3, y - 9, 4, 2, "#c48a8a");
    p(x + 8, y - 6, 10, 6, point);
    p(x + 14, y - 3, 7, 6, pointD);
    p(x - 11, y + 1, 8, 3, cream);
    p(x + 3, y + 1, 8, 3, cream);
    if (!REDUCE && ((animT * 0.8) % 2) < 1.2) {
      p(x + 8, y - 22, 1, 2, "#9a968c");
      p(x + 10, y - 26, 1, 3, "#9a968c");
      p(x + 12, y - 23, 1, 2, "#9a968c");
    }
    return;
  }
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

function drawSpyro(c) {
  const bob = (!REDUCE && c.target && c.wait <= 0) ? ((c.walkT * 7 | 0) % 2) : 0;
  const sit = !!c.deskSit;
  const x = Math.round(c.x), y = Math.round(c.y + bob);
  const white = "#f4f0e4", shade = "#d8d4c8", tail = "#c45c26", tailD = "#8a3a10";
  shadow(x - 9, y + 3, 20, 4);
  if (sit) {
    /* Upright on a desk, as the true king of that particular throne. */
    p(x - 7, y - 10, 14, 12, white);
    p(x - 6, y - 9, 5, 6, shade);
    p(x - 6, y - 22, 12, 12, white);
    p(x - 5, y - 23, 4, 5, "#f4c4c4");
    p(x + 2, y - 23, 4, 5, "#f4c4c4");
    p(x - 5, y - 22, 3, 4, white);
    p(x + 2, y - 22, 3, 4, white);
    p(x - 1, y - 23, 2, 2, "#c4a070");
    p(x - 4, y - 16, 3, 3, "#c5d86a");
    p(x + 2, y - 16, 3, 3, "#c5d86a");
    p(x - 3, y - 15, 2, 2, "#141414");
    p(x + 3, y - 15, 2, 2, "#141414");
    p(x - 1, y - 12, 3, 2, "#c48a8a");
    p(x + 7, y - 12, 8, 6, tail);
    p(x + 12, y - 16, 5, 8, tailD);
    /* a very small crown */
    p(x - 4, y - 26, 9, 3, "#d4af37");
    p(x - 4, y - 28, 2, 3, "#d4af37");
    p(x - 1, y - 29, 3, 4, "#d1202f");
    p(x + 3, y - 28, 2, 3, "#d4af37");
    p(x - 1, y - 26, 3, 2, "#e6c200");
    p(x - 6, y, 5, 4, white);
    p(x + 1, y, 5, 4, white);
    return;
  }
  p(x - 10, y - 10, 20, 13, white);
  p(x - 8, y - 11, 16, 4, "#ffffff");
  p(x - 6, y - 8, 12, 8, shade);
  p(x - 6, y - 20, 13, 11, white);
  p(x - 6, y - 21, 5, 5, "#f4c4c4");
  p(x + 2, y - 21, 5, 5, "#f4c4c4");
  p(x - 5, y - 20, 4, 4, white);
  p(x + 2, y - 20, 4, 4, white);
  p(x - 1, y - 21, 2, 2, "#c4a070");
  p(x - 4, y - 15, 4, 4, "#c5d86a");
  p(x + 1, y - 15, 4, 4, "#c5d86a");
  p(x - 3, y - 14, 2, 2, "#141414");
  p(x + 2, y - 14, 2, 2, "#141414");
  p(x - 1, y - 11, 3, 2, "#c48a8a");
  const tailL = c.facing === "l";
  p(x + (tailL ? 8 : -16), y - 8, 11, 6, tail);
  p(x + (tailL ? 14 : -20), y - 14, 6, 9, tailD);
  p(x - 9, y, 6, 4, white);
  p(x + 3, y, 6, 4, white);
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
  Y:[0b101,0b101,0b010,0b010,0b010],
  J:[0b001,0b001,0b001,0b101,0b010],
  X:[0b101,0b101,0b010,0b101,0b101],
  Z:[0b111,0b001,0b010,0b100,0b111],
  "0":[0b111,0b101,0b101,0b101,0b111],
  "1":[0b010,0b110,0b010,0b010,0b111],
  "2":[0b110,0b001,0b010,0b100,0b111],
  "3":[0b110,0b001,0b010,0b001,0b110],
  "4":[0b101,0b101,0b111,0b001,0b001],
  "5":[0b111,0b100,0b110,0b001,0b110],
  "6":[0b011,0b100,0b111,0b101,0b111],
  "7":[0b111,0b001,0b010,0b010,0b010],
  "8":[0b111,0b101,0b111,0b101,0b111],
  "9":[0b111,0b101,0b111,0b001,0b110],
  "!":[0b010,0b010,0b010,0b000,0b010],
  "?":[0b110,0b001,0b010,0b000,0b010],
  "'":[0b010,0b010,0b000,0b000,0b000]
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
  if (!ctx) return;
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
  if (!sceneSheet) sceneSheet = buildScenery();
  if (sceneSheet) ctx.drawImage(sceneSheet, 0, 0);
  else paintScenery();
  drawLiveScenery();
  const sprites = [];
  desks.forEach(d => sprites.push({ y: d.y + 20, draw: () => drawDesk(d) }));
  people.forEach(pr => sprites.push({
    y: pr.y + flinchOffset(pr).y,
    draw: () => {
      const f = flinchOffset(pr);
      const ox = pr.x, oy = pr.y;
      pr.x += f.x; pr.y += f.y;
      drawPerson(pr); drawActivity(pr);
      pr.x = ox; pr.y = oy;
    }
  }));
  cats.forEach(c => sprites.push({
    y: c.y + flinchOffset(c).y,
    draw: () => {
      const f = flinchOffset(c);
      const ox = c.x, oy = c.y;
      c.x += f.x; c.y += f.y;
      if (c.id === "arthur") drawArthur(c);
      else if (c.id === "spyro") drawSpyro(c);
      else drawDexter(c);
      c.x = ox; c.y = oy;
    }
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
    people.forEach(drawBubble);
    cats.forEach(drawCatBubble);
  }
  if (machineEventActive()) {
    people.forEach(drawFlinchBang);
    cats.forEach(drawFlinchBang);
  }
  drawSnow();
  drawRainOnWindows();
  drawFerretDash();
  if (EMBED) ctx.restore();
}

function applyShareDemo() {
  if (demoAppliedWorking) return;
  const working = ["kenneth", "terry", "george", "percy", "tweety", "filament", "rupert", "penny", "sheila", "sarge", "mona", "hettie", "stockley", "grant", "vinnie"];
  /* A posed snapshot for office-share.png: most at their desks, a few at the idle spots. */
  const places = {
    reggie: "kettle-0", archie: "arcade-0", boris: "darts-0", oddly: "sofa-1",
    frank: "canteen-1", brian: "music-0", clive: "rods-0", keith: "arcade-1"
  };
  const bubbles = { boris: "180!", archie: "1UP!", oddly: "ZZZ" };
  people.forEach(p => {
    p.target = null;
    p.waypoints = [];
    if (working.includes(p.id)) {
      setWant(p, "working");
      releaseSpot(p);
      p.x = p.desk.chairX;
      p.y = p.desk.chairY;
      p.target = null;
      p.waypoints = [];
      p.phase = "working";
      p.facing = "r";
    } else {
      releaseSpot(p);
    }
  });
  people.forEach(p => {
    const id = places[p.id];
    const spot = id && spots.find(s => s.id === id);
    if (!spot) return;
    setWant(p, "idle");
    settleAt(p, spot);
    p.phase = "idle";
    p.wait = 9999;
    p.bubbleT = 9999;
    p.throwT = 1;
    if (bubbles[p.id]) p.bubble = { text: bubbles[p.id], t: 9999 };
  });
  darts.stuck = [{ x: BOARD.cx - 2, y: BOARD.cy - 3 }, { x: BOARD.cx + 1, y: BOARD.cy - 4 }, { x: BOARD.cx - 1, y: BOARD.cy - 5 }];
  const clock = CAT_SPOTS.find(s => s.clock);
  const poses = [
    { x: clock ? clock.x : CLOCK.cx, y: clock ? clock.y : 136, spot: clock },
    { x: 540, y: 412, spot: CAT_SPOTS.find(s => s.x === 540) }
  ];
  cats.forEach((c, i) => {
    c.target = null;
    c.wait = 9999;
    c.deskSit = null;
    if (c.id === "spyro") {
      const perch = desks.find(d => d.id === "frank") || desks.find(d => !d.private);
      if (perch) perchSpyro(c, perch);
      return;
    }
    c.x = poses[i % poses.length].x;
    c.y = poses[i % poses.length].y;
    if (poses[i % poses.length].spot) c.spot = poses[i % poses.length].spot;
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
      releaseSpot(george);
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
      releaseSpot(k);
      k.target = null;
      k.waypoints = [];
      k.pendingDest = null;
      k.x = k.desk.chairX;
      k.y = k.desk.chairY + 6;
      k.phase = "idle";
      k.facing = "r";
      k.wait = 9999;
      k.glanceT = 0;
      const arthur = cats.find(c => c.id === "arthur");
      const clock = CAT_SPOTS.find(s => s.clock);
      if (arthur && clock) {
        arthur.target = null;
        arthur.wait = 9999;
        arthur.x = clock.x;
        arthur.y = clock.y;
        arthur.spot = clock;
      }
      const spyro = cats.find(c => c.id === "spyro");
      const perch = desks.find(d => d.id === "percy") || desks.find(d => !d.private);
      if (spyro && perch) {
        perchSpyro(spyro, perch);
        spyro.wait = 9999;
      }
      if (isLateHours()) {
        const owl = nightOwl();
        if (owl && owl.id !== k.id) {
          releaseSpot(owl);
          owl.target = null;
          owl.waypoints = [];
          owl.x = owl.desk.chairX;
          owl.y = owl.desk.chairY;
          owl.phase = "idle";
          owl.want = "idle";
          owl.flavour = "Working late";
          owl.wait = 9999;
        }
      }
      const archie = people.find(p => p.id === "archie");
      const rupert = people.find(p => p.id === "rupert");
      const aSpot = spots.find(s => s.id === "arcade-0");
      const rSpot = spots.find(s => s.id === "arcade-1");
      if (archie && rupert && aSpot && rSpot) {
        releaseSpot(archie); releaseSpot(rupert);
        people.forEach(p => {
          if ((p.spot === aSpot || p.spot === rSpot) && p.id !== "archie" && p.id !== "rupert") releaseSpot(p);
        });
        settleAt(archie, aSpot); settleAt(rupert, rSpot);
        archie.wait = 9999; rupert.wait = 9999;
        archie.bubble = { text: "ONE MORE GO", t: 9999 };
        rupert.bubble = { text: "GO ON THEN", t: 9999 };
      }
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
let lastDraw = 0;

function shouldAnimate() {
  return !REDUCE && !document.hidden && officeOnScreen;
}

function loop(ts) {
  rafId = 0;
  if (!shouldAnimate()) return;
  /* About thirty frames a second is plenty for pixel people, and kinder to phones. */
  if (lastDraw && ts - lastDraw < FRAME_MS - 2) {
    rafId = requestAnimationFrame(loop);
    return;
  }
  lastDraw = ts;
  if (!t0) t0 = ts;
  const now = (ts - t0) / 1000;
  let dt = lastTs ? (ts - lastTs) / 1000 : 0.016;
  if (dt > 0.1) dt = 0.1;
  lastTs = ts;
  animT = now;
  if (DEMO) applyDemo(now);
  tickMachineEvent(dt);
  tickEggs(dt);
  people.forEach(p => tickPerson(p, dt));
  tickDarts(dt);
  tickChat(dt);
  cats.forEach(c => tickCat(c, dt));
  syncAtmosphere();
  drawFrame();
  if (!DEMO && OFFICE_FEED_URL && !document.hidden && performance.now() - lastFeed > POLL_MS) {
    pullFeed();
  }
  rafId = requestAnimationFrame(loop);
}

function resumeLoop() {
  if (!shouldAnimate() || rafId) return;
  lastTs = 0;
  lastDraw = 0;
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

/* On a phone the office is wider than the screen. Start with the middle in view
   (the aisle, the kettle corner and the sofa), rather than the empty left edge. */
function centreStage() {
  const wrap = document.getElementById("office-stage-wrap");
  if (!wrap || EMBED) return;
  const spare = wrap.scrollWidth - wrap.clientWidth;
  if (spare > 8 && wrap.scrollLeft === 0) wrap.scrollLeft = Math.round(spare * 0.62);
}

function boot() {
  if (!canvas || !ctx) return;
  fitCanvas();
  window.addEventListener("resize", fitCanvas);
  centreStage();
  layoutDesks();
  layoutSpots();
  STAFF.forEach((s, i) => people.push(makePerson(s, i)));
  cats.push(makeCat("arthur", 0));
  cats.push(makeCat("dexter", 1));
  cats.push(makeCat("spyro", 2));
  if (REDUCE) {
    const spyro = cats.find(c => c.id === "spyro");
    const perch = desks.find(d => d.id === "percy");
    if (spyro && perch) perchSpyro(spyro, perch);
    const owl = nightOwl();
    if (owl && owl.want !== "working") {
      releaseSpot(owl);
      owl.x = owl.desk.chairX;
      owl.y = owl.desk.chairY;
      owl.target = null;
      owl.flavour = "Working late";
    }
  }
  if (DEMO && demoNote) {
    demoNote.hidden = false;
    feedOffline = false;
    if (DEMO === "share") {
      demoNote.textContent = "Demo mode — a posed snapshot of the floor, for the share picture.";
    }
  }
  buildBoard();
  if (DEMO === "working" || DEMO === "celebrating" || DEMO === "1" || DEMO === "share") applyDemo(DEMO === "1" ? 0 : 10);
  if (!EMBED) setupOfficeCards();
  if (!EMBED) setupOfficeSound();
  if (!EMBED) setupEasterEggs();
  if (forceMachine()) {
    startMachineEvent();
    if (REDUCE && machineEvent) machineEvent.t = 0.9;
  }
  if (EGG_PARAM === "boo") booDexter();
  if (EGG_PARAM === "ferret") {
    startFerretDash();
    if (REDUCE && ferretDash) ferretDash.t = 0.7;
  }
  syncAtmosphere();
  drawFrame();
  if (!DEMO) pullFeed();
  if (!EMBED) {
    pullWeather();
    setInterval(function () {
      if (!document.hidden) pullWeather();
    }, WEATHER_MS);
  }
  watchEmbedVisibility();
  resumeLoop();
  setInterval(syncAtmosphere, 60000);
  setInterval(function () {
    if (document.hidden) return;
    if (!machineEvent && !forceMachine()) {
      const t = ukNow();
      const m = t.hour * 60 + t.minute;
      if (ukDateKey() !== machineFiredDay && m === machineEventMinute()) {
        startMachineEvent();
        if (!shouldAnimate()) kickEggAnim();
      }
    }
  }, 15000);
}

boot();

function setupOfficeCards() {
  const wrap = document.getElementById("office-stage-wrap");
  const card = document.getElementById("office-card");
  if (!wrap || !card || !canvas) return;
  const pic = document.getElementById("office-card-pic");
  const nameEl = document.getElementById("office-card-name");
  const jobEl = document.getElementById("office-card-job");
  let shown = null;
  let pointerOnCanvas = false;

  function worldFromEvent(ev) {
    const r = canvas.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    return {
      x: (ev.clientX - r.left) * (W / r.width),
      y: (ev.clientY - r.top) * (H / r.height)
    };
  }
  function hitAt(pt) {
    if (!pt) return null;
    const hits = [];
    people.forEach(pr => {
      const top = isWorkingPose(pr) ? 30 : (pr.staff.kind === "reggie" ? 56 : pr.staff.kind === "keith" ? 52 : 48);
      if (pt.x >= pr.x - 12 && pt.x <= pr.x + 12 && pt.y >= pr.y - top && pt.y <= pr.y + 4) {
        hits.push({ y: pr.y, kind: "person", who: pr });
      }
    });
    cats.forEach(c => {
      const top = c.id === "spyro" && c.deskSit ? 30 : 22;
      if (pt.x >= c.x - 14 && pt.x <= c.x + 14 && pt.y >= c.y - top && pt.y <= c.y + 4) {
        hits.push({ y: c.y, kind: "cat", who: c });
      }
    });
    if (!hits.length) return null;
    hits.sort((a, b) => b.y - a.y);
    return hits[0];
  }
  function hideCard() {
    shown = null;
    card.hidden = true;
    canvas.style.cursor = "";
  }
  function showCard(hit, ev) {
    if (!hit) {
      hideCard();
      return;
    }
    const who = hit.who;
    const id = who.id;
    const staff = who.staff;
    const title = staff ? staff.name : (id === "arthur" ? "Arthur" : id === "dexter" ? "Dexter" : id === "spyro" ? "Spyro" : id);
    const line = JOB_LINE[id] || (staff ? staff.role : "");
    const src = PORTRAITS[id] || "";
    nameEl.textContent = title;
    jobEl.textContent = line;
    if (src) {
      if (pic.getAttribute("src") !== src) pic.src = src;
      pic.alt = "Portrait of " + title;
      pic.hidden = false;
    } else {
      pic.removeAttribute("src");
      pic.alt = "";
      pic.hidden = true;
    }
    shown = id;
    card.hidden = false;
    const wr = wrap.getBoundingClientRect();
    let left = ev.clientX - wr.left + wrap.scrollLeft + 14;
    let top = ev.clientY - wr.top + wrap.scrollTop - 12;
    const cw = card.offsetWidth || 220, ch = card.offsetHeight || 160;
    if (left + cw > wrap.scrollLeft + wr.width - 8) left = ev.clientX - wr.left + wrap.scrollLeft - cw - 10;
    if (top + ch > wr.height - 8) top = ev.clientY - wr.top + wrap.scrollTop - ch - 8;
    if (left < wrap.scrollLeft + 8) left = wrap.scrollLeft + 8;
    if (top < 8) top = 8;
    if (top + ch > wr.height - 8) top = Math.max(8, wr.height - ch - 8);
    card.style.left = Math.round(left) + "px";
    card.style.top = Math.round(top) + "px";
    canvas.style.cursor = "pointer";
  }

  canvas.addEventListener("pointermove", ev => {
    if (ev.pointerType !== "mouse") return;
    pointerOnCanvas = true;
    const hit = hitAt(worldFromEvent(ev));
    canvas.style.cursor = hit ? "pointer" : "";
    if (hit) showCard(hit, ev);
    else hideCard();
  });
  canvas.addEventListener("pointerleave", ev => {
    if (ev.pointerType === "mouse") hideCard();
  });
  canvas.addEventListener("pointerup", ev => {
    const hit = hitAt(worldFromEvent(ev));
    if (hit && hit.kind === "cat" && hit.who.id === "dexter") noteDexterTap();
    if (ev.pointerType === "mouse") return;
    if (hit && shown === hit.who.id) hideCard();
    else if (hit) showCard(hit, ev);
    else hideCard();
  });
  document.addEventListener("pointerdown", ev => {
    if (ev.pointerType === "mouse") return;
    if (ev.target === canvas || card.contains(ev.target)) return;
    hideCard();
  });
}

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

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

/* ---------- Floor plan (1920 x 1920, 3× the original 640 plan) ----------
   The layout is the same as the 640 office, just drawn with room for real faces,
   hands, grain and type, rather than blowing the old pixels up. A helper, sx(),
   turns a measurement from that original plan into a world-pixel size.
   Top band:    three private offices, and the games nook (rod rack, arcade, darts).
   Middle:      the open floor, twenty desks in four rows (Kraken Keith took the printer's); on the right the kettle
                corner and the lounge.
   Bottom band: the canteen, the music room, and the machine's corner.
   People walk along lanes (the aisles) rather than straight through the furniture. */
const S = 3;
const BASE = 640;
const W = BASE * S, H = BASE * S;
function sx(n) { return Math.round(n * S); }
const TOP_H = sx(118);              /* bottom wall of the offices and the nook */
const AISLE_X = sx(440);            /* the main walkway, top to bottom */
const TOP_LANE = sx(126);           /* walkway under the offices and the nook */
const BOTTOM_LANE = sx(440);        /* walkway above the canteen and the music room */
const DESK_ROWS = [sx(150), sx(220), sx(290), sx(360)];
const DESK_SLOT = sx(58), DESK_GAP = sx(22), DESK_X0 = sx(30);
const FLOOR_BLOCK = { x: sx(12), y: sx(134), w: sx(420), h: sx(298) };
const BAND_Y = sx(452);             /* top of the canteen, music room and machine corner */
const NOOK = { x: sx(410), y: sx(2), w: sx(222), h: TOP_H - sx(2) };
const KETTLE = { x: sx(452), y: sx(132), w: sx(180), h: sx(102) };
const LOUNGE = { x: sx(452), y: sx(246), w: sx(180), h: sx(190) };
const MACHINE_CORNER = { x: sx(516), y: BAND_Y, w: sx(116), h: H - BAND_Y - sx(8) };
const MACHINE = { x: sx(544), y: sx(532), w: sx(78), h: sx(66), cx: sx(583), cy: sx(565) };
const BOARD = { cx: sx(606), cy: sx(20), r: sx(11) };        /* the dartboard */
const CABINET = { x: sx(512), y: sx(12), w: sx(32), h: sx(66) }; /* the arcade cabinet */
const SOFA = { x: sx(472), y: sx(280), w: sx(140), h: sx(50) };
const SIT_DROP = sx(6);
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
const EMBED_CAM_Y = sx(60);
const EMBED_W = W;
const EMBED_H = sx(240);

if (EMBED && params.get("embed") === "1") document.documentElement.classList.add("office-embed");

const canvas = document.getElementById("office-canvas") || document.getElementById("office-live");
let screenCtx = canvas ? canvas.getContext("2d") : null;
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
const CLOCK = { cx: sx(248), cy: sx(108), r: sx(13) };

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
    !pr.target && pr.desk && Math.hypot(pr.x - pr.desk.chairX, pr.y - pr.desk.chairY) < sx(4));
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
  const shake = REDUCE ? 0 : Math.round(Math.sin(t * 42) * sx(2) * shock);
  return { x: Math.round(away * sx(6) * shock) + shake, y: Math.round(-sx(9) * shock) };
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
  spyro: "portraits/spyro.jpg",
  tilly: "portraits/tilly.jpg",
  trixie: "portraits/trixie.jpg",
  daisy: "portraits/daisy.jpg"
};
const CAT_NAMES = { arthur: "Arthur", dexter: "Dexter", spyro: "Spyro", tilly: "Tilly", trixie: "Trixie", daisy: "Daisy" };
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
  spyro: "The true king, who will occasionally take an empty desk.",
  tilly: "A Ragdoll. Shy and quiet, and quietly dangerous.",
  trixie: "A Ragdoll, chosen on appearance. Fair enough.",
  daisy: "A Ragdoll. Butter would not melt."
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
  for (let i = 0; i <= n; i++) p(x0 + dx * i / n, y0 + dy * i / n, 3, 3, colour);
}


function backingCap(cssPx) {
  /* HiDPI is welcome, but a 1920 world at 3× on a phone would be a 30MB bitmap.
     Cap the backing store, and cap it harder on a narrow screen. */
  const dpr = window.devicePixelRatio || 1;
  let cap = dpr;
  if (cssPx <= 700) cap = Math.min(dpr, 2);
  const maxBack = cssPx <= 700 ? 1280 : W;
  return Math.max(1, Math.min(cap, maxBack / Math.max(cssPx, 1)));
}

function applyWorldTransform() {
  if (!ctx) return;
  if (EMBED) {
    const rx = canvas.width / EMBED_W, ry = canvas.height / EMBED_H;
    ctx.setTransform(rx, 0, 0, ry, 0, 0);
    ctx.imageSmoothingEnabled = canvas.width < EMBED_W - 1;
    return;
  }
  const rx = canvas.width / W, ry = canvas.height / H;
  ctx.setTransform(rx, 0, 0, ry, 0, 0);
  ctx.imageSmoothingEnabled = canvas.width < W - 1;
}

function fitCanvas() {
  if (!canvas) return;
  if (EMBED) {
    viewScale = 1;
    /* Leave CSS to the homepage tile (width:100%; height:auto). Bitmap is the
       8:3 peek at world resolution, so the little tile still looks sharp. */
    const cssW = canvas.getBoundingClientRect().width || 420;
    const cap = backingCap(cssW);
    /* Keep a decent bitmap even on a 1× dpr tile, so the 420px peek stays sharp. */
    const bw = Math.min(EMBED_W, Math.max(960, Math.round(cssW * cap)));
    const bh = Math.max(1, Math.round(bw * (EMBED_H / EMBED_W)));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
      screenCtx = canvas.getContext("2d");
      ctx = screenCtx;
    }
    canvas.style.width = "";
    canvas.style.height = "";
    canvas.style.imageRendering = "auto";
    return;
  }
  /* Fill the available width, up to the 1920 world. On a phone keep the CSS
     size around 640–800 so the floor is still swipeable, not a tiny stamp,
     and not a huge zoomed-in crop either. */
  const avail = document.documentElement.clientWidth;
  const css = Math.round(Math.min(W, Math.max(avail, 640)));
  viewScale = css / BASE;
  canvas.style.width = css + "px";
  canvas.style.height = css + "px";
  const cap = backingCap(css);
  let bw = Math.round(css * cap);
  if (css > 700) bw = Math.min(W, Math.max(bw, Math.min(css, 1280)));
  else bw = Math.min(1280, Math.max(bw, 640));
  if (canvas.width !== bw || canvas.height !== bw) {
    canvas.width = bw;
    canvas.height = bw;
    screenCtx = canvas.getContext("2d");
    ctx = screenCtx;
  }
  canvas.style.imageRendering = (bw >= W - 1 || css >= W - 1) ? "pixelated" : "auto";
  const wrap = document.getElementById("office-stage-wrap");
  const hint = document.getElementById("office-pan-hint");
  if (wrap && hint) {
    const overflow = css > wrap.clientWidth + 8;
    hint.hidden = !overflow;
  }
}

function layoutOffices() {
  const holders = STAFF.filter(s => s.office);
  const margin = sx(8), gap = sx(10), rh = TOP_H - sx(2);
  const n = holders.length;
  const rw = Math.floor((NOOK.x - sx(10) - margin - gap * (n - 1)) / n);
  holders.forEach((staff, i) => {
    const x = margin + i * (rw + gap);
    const y = sx(2);
    const cx = x + Math.round(rw / 2);
    rooms.push({
      id: staff.id, staff: staff, x: x, y: y, w: rw, h: rh, cx: cx,
      doorX: cx, doorY: y + rh + sx(6), doorW: sx(24), lane: TOP_LANE
    });
    const deskY = y + sx(36);
    desks.push({
      id: staff.id, x: cx - sx(29), y: deskY, w: sx(58), h: sx(28), cx: cx,
      chairX: cx, chairY: deskY + sx(40), staff: staff, private: true, lane: TOP_LANE
    });
  });
}

function layoutAmenities() {
  /* The canteen and the music room share the bottom band with the machine's corner. */
  [
    { id: "canteen", plate: ["CANTEEN"], x: sx(8), w: sx(248) },
    { id: "music", plate: ["MUSIC"], x: sx(268), w: sx(236) }
  ].forEach(item => {
    const cx = item.x + Math.round(item.w / 2);
    rooms.push({
      id: item.id, plate: item.plate, amenity: true, doorSide: "n",
      x: item.x, y: BAND_Y, w: item.w, h: H - BAND_Y - 8, cx: cx,
      doorX: cx, doorY: BAND_Y - sx(6), doorW: sx(24), lane: BOTTOM_LANE
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
  const pitch = Math.min(DESK_SLOT + DESK_GAP, Math.floor((FLOOR_BLOCK.w - sx(8)) / cols));
  const slot = Math.min(DESK_SLOT, pitch - sx(12));
  const x0 = cols === 5 ? DESK_X0 : FLOOR_BLOCK.x + sx(6);
  floorStaff.forEach((staff, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    const x = x0 + c * pitch, y = DESK_ROWS[Math.min(r, DESK_ROWS.length - 1)];
    desks.push({
      id: staff.id, x: x, y: y, w: slot, h: sx(28), cx: x + slot / 2,
      chairX: x + slot / 2, chairY: y + sx(46), staff: staff, lane: y + sx(62)
    });
  });
  /* The printer gets the first spare desk, if there is one. */
  const n = floorStaff.length;
  printerStation = null;
  if (n < cols * DESK_ROWS.length) {
    const r = Math.floor(n / cols), c = n % cols;
    printerStation = { x: x0 + c * pitch, y: DESK_ROWS[r], w: slot, lane: DESK_ROWS[r] + sx(62) };
    printerStation.spotX = printerStation.x + slot / 2 - sx(4);
    printerStation.spotY = printerStation.y + sx(46);
    printerStation.facing = "r";
  } else {
    /* Every desk is taken, so the printer has moved to the top of the lounge,
       between the kettle corner and the sofa. Users queue to its right. */
    printerStation = { x: LOUNGE.x + sx(48), y: LOUNGE.y - sx(8), w: sx(58), lane: LOUNGE.y + sx(20) };
    printerStation.spotX = printerStation.x + sx(70);
    printerStation.spotY = LOUNGE.y + sx(20);
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
  add("rods", sx(446), sx(100), "l", TOP_LANE);
  add("arcade", sx(554), sx(90), "l", TOP_LANE);
  add("arcade", sx(494), sx(104), "r", TOP_LANE, { watch: true });
  add("darts", sx(608), sx(106), "l", TOP_LANE);
  add("darts", sx(580), sx(110), "r", TOP_LANE, { waiting: true });
  /* Kettle corner. */
  add("kettle", sx(482), sx(200), "r", sx(200));
  add("kettle", sx(530), sx(206), "l", sx(206));
  add("kettle", sx(578), sx(200), "r", sx(200));
  /* Lounge: three on the sofa, two stood about. */
  add("sofa", sx(502), sx(326), "r", sx(346), { seat: true });
  add("sofa", sx(532), sx(326), "l", sx(346), { seat: true });
  add("sofa", sx(562), sx(326), "r", sx(346), { seat: true });
  add("lounge", sx(470), sx(266), "r", sx(266));
  add("lounge", sx(478), sx(414), "r", sx(414));
  /* The printer, on its spare desk. */
  if (printerStation) add("printer", printerStation.spotX, printerStation.spotY, printerStation.facing, printerStation.lane);
  /* Canteen and music room. */
  rooms.forEach(r => {
    if (r.id === "canteen") {
      add("canteen", r.x + sx(58), r.y + sx(72), "r", BOTTOM_LANE, { room: r.id });
      add("canteen", r.x + sx(128), r.y + sx(108), "r", BOTTOM_LANE, { room: r.id });
      add("canteen", r.x + sx(206), r.y + sx(108), "l", BOTTOM_LANE, { room: r.id });
      add("canteen", r.x + sx(166), r.y + sx(150), "l", BOTTOM_LANE, { room: r.id });
    } else if (r.id === "music") {
      add("music", r.x + sx(70), r.y + sx(96), "l", BOTTOM_LANE, { room: r.id });
      add("music", r.x + sx(132), r.y + sx(102), "r", BOTTOM_LANE, { room: r.id });
      add("music", r.x + sx(40), r.y + sx(140), "r", BOTTOM_LANE, { room: r.id });
      add("music", r.x + sx(180), r.y + sx(124), "l", BOTTOM_LANE, { room: r.id, guitar: true });
      add("music", r.x + sx(120), r.y + sx(156), "r", BOTTOM_LANE, { room: r.id });
    } else if (r.staff) {
      add("office", r.cx - sx(30), r.y + sx(94), "r", TOP_LANE, { room: r.id, only: r.id });
      add("office", r.cx + sx(32), r.y + sx(96), "l", TOP_LANE, { room: r.id, only: r.id });
    }
  });
}

/* Cats go where they like, in straight lines, as cats do. */
const CAT_SPOTS = [
  { x: CLOCK.cx, y: sx(136), clock: true },
  { x: sx(590), y: sx(322), sofa: true }, { x: sx(540), y: sx(412) }, { x: sx(612), y: sx(216) }, { x: sx(600), y: sx(266) },
  { x: sx(200), y: sx(280) }, { x: sx(120), y: sx(350) }, { x: sx(300), y: sx(420) }, { x: sx(440), y: sx(380) },
  { x: sx(520), y: sx(118) }, { x: sx(440), y: sx(180) }
];

function roomAt(x, y) {
  return rooms.find(r => x >= r.x + sx(2) && x <= r.x + r.w - sx(2) && y >= r.y + sx(2) && y <= r.y + r.h) || null;
}

/* Which walkway a point joins. Desk-floor points use the aisle just below them. */
function laneFor(pt) {
  if (pt.lane !== undefined && pt.lane !== null) return pt.lane;
  if (pt.y <= TOP_LANE + sx(6)) return TOP_LANE;
  if (pt.y >= BOTTOM_LANE - sx(2)) return BOTTOM_LANE;
  if (pt.x < AISLE_X - sx(6)) {
    const lanes = [TOP_LANE].concat(DESK_ROWS.map(y => y + sx(62)));
    return lanes.find(l => l >= pt.y - sx(1)) || lanes[lanes.length - 1];
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
    const arrived = REDUCE ? true : stepMove(p, dt, sx(46));
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
    const atDesk = Math.hypot(p.x - p.desk.chairX, p.y - p.desk.chairY) < sx(4);
    if (!atDesk) {
      const goingHome = p.target && Math.hypot(p.target.x - p.desk.chairX, p.target.y - p.desk.chairY) < sx(4);
      if (!goingHome) {
        releaseSpot(p);
        setRoute(p, { x: p.desk.chairX, y: p.desk.chairY, lane: p.desk.lane });
        p.flavour = "Heading back for a late one";
        paintBoard();
      } else {
        stepMove(p, dt, sx(46));
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
    if (stepMove(p, dt, sx(42)) && p.spot) {
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
  else if (Math.hypot(p.x - MACHINE.cx, p.y - MACHINE.cy) < sx(200) && Math.random() < dt * 0.06) {
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
    const rad = miss ? BOARD.r + sx(3) + Math.random() * sx(4) : Math.random() * (BOARD.r - sx(2));
    darts.flying = {
      x0: thrower.x + (thrower.facing === "l" ? sx(8) : -sx(10)), y0: thrower.y - sx(40),
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
    return Math.hypot(owner.x - d.chairX, owner.y - d.chairY) > sx(18);
  });
}
function perchSpyro(c, desk) {
  c.deskSit = desk;
  c.spot = { x: desk.cx + sx(10), y: desk.y + sx(18), desk: desk.id };
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
  const arrived = stepMove(c, dt, sx(28));
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

/* Extra marks used at 1920 so faces, desks and wood are not just 3× the old pixels. */
function woodGrain(x, y, w, h, colour) {
  for (let i = 4; i < h - 2; i += 5) {
    p(x + 2, y + i, Math.max(2, w - 4), 1, colour);
  }
}
function paintEyes(cx, cy, left) {
  const look = left ? 0 : 3;
  p(cx - 12, cy - 3, 10, 8, "#fffef8");
  p(cx + 2, cy - 3, 10, 8, "#fffef8");
  p(cx - 12, cy - 3, 10, 2, "#e8e0d4");
  p(cx + 2, cy - 3, 10, 2, "#e8e0d4");
  p(cx - 10 + look, cy - 1, 5, 5, "#141414");
  p(cx + 4 + look, cy - 1, 5, 5, "#141414");
  p(cx - 9 + look, cy - 1, 2, 2, "#f4f0e4");
  p(cx + 5 + look, cy - 1, 2, 2, "#f4f0e4");
  p(cx - 13, cy - 7, 11, 2, "#3d2a1c");
  p(cx + 2, cy - 7, 11, 2, "#3d2a1c");
}
function paintMouth(cx, cy) {
  p(cx - 4, cy, 9, 2, "#c47a7a");
  p(cx - 2, cy + 1, 5, 1, "#a05a5a");
}
function paintHand(x, y, skin, left) {
  p(x, y, 10, 8, skin);
  p(x + (left ? -3 : 9), y + 1, 4, 5, skin);
  p(x + 1, y + 7, 2, 4, skin);
  p(x + 4, y + 7, 2, 4, skin);
  p(x + 7, y + 7, 2, 4, skin);
}

function box(x, y, w, h, fill, edge) {
  p(x, y, w, h, fill);
  const e = edge || "#141414";
  p(x, y, w, 3, e);
  p(x, y + h - 3, w, 3, e);
  p(x, y, 3, h, e);
  p(x + w - 3, y, 3, h, e);
}

function shadow(x, y, w, h) {
  p(x + 3, y, w - 6, h, "#14141433");
  p(x, y + 3, w, h - 3, "#14141422");
}

let plankSheet = null;
function ensurePlanks() {
  if (plankSheet) return plankSheet;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  for (let x = 0; x < W; x += 48) {
    const even = (x / 48) % 2;
    g.fillStyle = even ? "#c8a56c" : "#d4b27a";
    g.fillRect(x, 0, 46, H);
    g.fillStyle = "#8e6c3c";
    g.fillRect(x + 46, 0, 2, H);
    g.fillStyle = even ? "#b8935c" : "#c4a56a";
    g.fillRect(x, 0, 2, H);
    g.fillStyle = "rgba(255, 232, 190, 0.22)";
    g.fillRect(x + 8, 0, 2, H);
    g.fillRect(x + 22, 0, 1, H);
    for (let y = 0; y < H; y += 54) {
      const j = (x * 13 + y * 7) % 36;
      g.fillStyle = "rgba(80, 48, 16, 0.22)";
      g.fillRect(x + 6, y + j, 28, 2);
      g.fillStyle = "rgba(255, 236, 200, 0.16)";
      g.fillRect(x + 14, y + j + 22, 18, 1);
      g.fillRect(x + 10, y + j + 8, 12, 1);
    }
  }
  plankSheet = c;
  return c;
}

function tileFloor(x, y, w, h, a, b) {
  const size = 48;
  for (let ty = y; ty < y + h; ty += size) {
    for (let tx = x; tx < x + w; tx += size) {
      const even = (((tx - x) / size | 0) + ((ty - y) / size | 0)) % 2;
      const tw = Math.min(size, x + w - tx);
      const th = Math.min(size, y + h - ty);
      p(tx, ty, tw, th, even ? a : b);
      p(tx, ty, tw, 3, "#00000022");
      p(tx, ty, 3, th, "#00000022");
      if (tw > 3 && th > 3) p(tx + 3, ty + 3, 6, 3, "#ffffff22");
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
  p(x + 6, y + 6, w - 12, h - 12, pane);
  p(x + 6, y + 6, Math.floor((w - 12) / 2), h - 12, pane2);
  if (sky === "night") {
    const seed = (x * 13 + y * 7) | 0;
    for (let i = 0; i < 5; i++) {
      const starX = x + sx(3) + ((seed + i * 17) % Math.max(2, w - sx(8)));
      const starY = y + sx(3) + ((seed + i * 11) % Math.max(2, h - sx(8)));
      p(starX, starY, 2, 2, i % 2 ? "#f4f0e4" : "#c5d8e4");
    }
  } else {
    p(x + 9, y + 9, 9, 6, glint);
    p(x + 9, y + 18, 6, 12, sky === "dusk" ? "#ffffff33" : "#ffffff55");
  }
  if (currentSeason() === "december") {
    p(x + 6, y + h - 12, w - 12, 6, "#f4f0e4");
    p(x + 9, y + h - 15, 9, 3, "#ffffff");
    p(x + w - 24, y + h - 15, 6, 3, "#ffffff");
  }
  /* mullion, with a thin highlight so the frame has a bit of depth. */
  p(x + 2, y + 2, w - 4, 2, "#5a4232");
  p(x + 2, y + 2, 2, h - 4, "#5a4232");
  p(x + Math.floor(w / 2) - 3, y, 6, h, "#3d2a1c");
  p(x + Math.floor(w / 2) - 2, y + 2, 1, h - 4, "#7a5a38");
  p(x, y + Math.floor(h / 2), w, 6, "#3d2a1c");
  p(x + 2, y + Math.floor(h / 2) + 1, w - 4, 1, "#7a5a38");
}

function drawTree(x, y) {
  /* A small office Christmas tree, used only in December. */
  shadow(x + 12, y + 108, 48, 15);
  p(x + 30, y + 84, 12, 36, "#6b4a2a");
  p(x + 3, y + 54, 66, 36, "#0f4a3a");
  p(x + 12, y + 30, 48, 36, "#146b48");
  p(x + 21, y + 6, 30, 36, "#1a7a52");
  p(x + 9, y + 60, 18, 9, "#0f4a3a");
  p(x + 45, y + 42, 15, 9, "#146b48");
  p(x + 30, y - 6, 12, 12, "#e6c200");
  p(x + 33, y - 9, 6, 6, "#f2e6a0");
  p(x + 18, y + 36, 6, 6, "#d1202f");
  p(x + 48, y + 24, 6, 6, "#d1202f");
  p(x + 24, y + 66, 6, 6, "#e6c200");
  p(x + 42, y + 54, 6, 6, "#22409a");
  p(x + 15, y + 24, 6, 6, "#f4f0e4");
}

function drawPumpkin(x, y) {
  shadow(x + 3, y + 36, 42, 12);
  p(x + 3, y + 9, 42, 30, "#e07a2f");
  p(x + 9, y + 3, 30, 9, "#e07a2f");
  p(x + 6, y + 12, 12, 24, "#f08a3a");
  p(x + 21, y, 6, 12, "#1a7a52");
  p(x + 12, y + 15, 6, 6, "#141414");
  p(x + 27, y + 15, 6, 6, "#141414");
  p(x + 15, y + 27, 18, 6, "#141414");
  p(x + 18, y + 24, 12, 3, "#141414");
  if (!REDUCE && ((animT * 3 + x) % 1) < 0.5) p(x + 18, y + 18, 9, 6, "#f2d36b");
}

function drawSeasonalScenery() {
  const season = currentSeason();
  if (season === "december") {
    /* In the lounge corner, in place of the little plant. */
    drawTree(LOUNGE.x + 6, LOUNGE.y + 24);
  }
  if (season === "halloween") {
    drawPumpkin(1284, 360);
    drawPumpkin(1344, 690);
    drawPumpkin(72, 1272);
  }
}

function drawSkirting(x, y, w) {
  p(x, y, w, 15, "#5a3c22");
  p(x, y, w, 3, "#3d2a1c");
  p(x, y + 12, w, 3, "#2a1c14");
  p(x, y + 3, w, 3, "#7a5a38");
}

function drawPlant(x, y) {
  shadow(x + 3, y + 60, 48, 15);
  box(x + 6, y + 42, 42, 27, "#7a1f2b", "#3d2a1c");
  p(x + 9, y + 45, 36, 6, "#9a3a44");
  p(x + 12, y + 42, 30, 6, "#5a3c22");
  p(x + 15, y + 12, 24, 33, "#0f4a3a");
  p(x + 18, y + 15, 9, 18, "#1a7a52");
  p(x + 3, y + 6, 24, 30, "#146b48");
  p(x + 6, y + 9, 9, 12, "#2a8a5a");
  p(x + 27, y, 24, 30, "#0f4a3a");
  p(x + 33, y + 6, 9, 12, "#1a7a52");
  p(x + 21, y - 6, 15, 18, "#146b48");
}

function disc(cx, cy, r, colour) {
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy) + 0.3);
    p(cx - half, cy + dy, half * 2 + 1, 2, colour);
  }
}

function drawCarpet(x, y, w, h) {
  /* Hard-wearing office carpet tiles under the desks, in a sensible slate blue. */
  const size = sx(20);
  for (let ty = y; ty < y + h; ty += size) {
    for (let tx = x; tx < x + w; tx += size) {
      const odd = (((tx - x) / size | 0) + ((ty - y) / size | 0)) % 2;
      const tw = Math.min(size, x + w - tx), th = Math.min(size, y + h - ty);
      p(tx, ty, tw, th, odd ? "#5f7386" : "#586b7d");
      for (let i = 3; i < th - 1; i += 4) p(tx + (odd ? 6 : 3), ty + i, tw - 9, 3, odd ? "#66798b" : "#536475");
    }
  }
  p(x - 6, y - 6, w + 12, 6, "#3d4a57");
  p(x - 6, y + h, w + 12, 6, "#3d4a57");
  p(x - 6, y, 6, h, "#3d4a57");
  p(x + w, y, 6, h, "#3d4a57");
}

function drawKettleOn(x, y) {
  /* The office kettle, sat on the counter. Steam is added each frame. */
  box(x + 24, y + 18, 48, 48, "#c8c4b8", "#141414");
  p(x + 27, y + 21, 15, 39, "#e8e4d8");
  p(x + 60, y + 24, 9, 36, "#9a968c");
  p(x + 30, y + 54, 36, 9, "#8a8680");
  p(x + 30, y + 9, 36, 12, "#d8d4c8");
  p(x + 27, y + 12, 42, 6, "#141414");
  box(x + 39, y - 6, 18, 18, "#d1202f", "#141414");
  p(x + 42, y - 3, 6, 6, "#f26a6a");
  p(x + 72, y + 30, 18, 9, "#a8a49c");
  p(x + 84, y + 24, 9, 15, "#a8a49c");
  p(x + 15, y + 24, 6, 30, "#3d2a1c");
  p(x + 18, y + 24, 9, 6, "#3d2a1c");
  p(x + 18, y + 51, 9, 6, "#3d2a1c");
}

function drawWaterCooler(x, y) {
  shadow(x, y + 102, 54, 15);
  box(x, y + 54, 48, 48, "#c0c0c0", "#141414");
  p(x + 3, y + 57, 18, 42, "#d8d8d8");
  box(x + 9, y, 30, 60, "#6ab8d8", "#141414");
  p(x + 12, y + 3, 12, 48, "#8ec8e6");
  p(x + 15, y + 9, 6, 18, "#f4f0e4");
  p(x + 6, y + 96, 36, 12, "#a0a0a0");
}

function drawPlate(cx, y, lines, fill) {
  const plateW = Math.max.apply(null, lines.map(s => labelWidth(s) + 12));
  const plateH = lines.length * 21 + 10;
  const px = cx - Math.round(plateW / 2);
  box(px, y, plateW, plateH, fill || "#f4f0e4", "#3d2a1c");
  lines.forEach((line, i) => drawLabel(cx, y + 6 + i * 21, line, "#141414"));
}

function drawNook() {
  const n = NOOK;
  /* Pub carpet: red with a little gold diamond, as is traditional. */
  p(n.x, n.y, n.w, n.h, "#6b1f24");
  for (let y = n.y + sx(36); y < n.y + n.h; y += sx(12)) {
    for (let x = n.x + sx(6) + ((y / sx(12)) % 2 ? sx(6) : 0); x < n.x + n.w - sx(4); x += sx(12)) {
      p(x, y, 6, 6, "#b8862a");
      p(x + 3, y - 3, 3, 3, "#8a2a30");
    }
  }
  /* Bottle-green back wall with a dado rail. */
  p(n.x, n.y, n.w, 102, "#2e4a3c");
  p(n.x, n.y + 72, n.w, 30, "#3a5a48");
  p(n.x, n.y + 69, n.w, 3, "#c4a574");
  p(n.x, n.y + 99, n.w, 3, "#1a2a22");
  /* Walls: top and west; the south side is open to the walkway. */
  p(n.x, n.y - 6, n.w + 18, 9, "#141414");
  p(n.x - 6, n.y - 6, 9, n.h + 6, "#141414");
  p(W - 24, n.y, 18, n.h, "#141414");
  /* Rod rack on the wall: four rods, reels down at the bottom. */
  box(n.x + 24, n.y + 24, 150, 12, "#6b4a2a", "#3d2a1c");
  box(n.x + 24, n.y + 120, 150, 12, "#6b4a2a", "#3d2a1c");
  ["#2a2a2a", "#7a1f2b", "#1a5c3a", "#c4a574"].forEach((c, i) => {
    const rx = n.x + sx(14) + i * sx(12);
    p(rx, n.y + 12, 6, 168, c);
    p(rx, n.y + 12, 3, 168, lite(c, 0.25));
    box(rx - 6, n.y + 138, 18, 18, "#c0c0c0", "#141414");
    p(rx - 3, n.y + 168, 12, 9, "#3d2a1c");
  });
  /* Landing net leaning on the wall. */
  p(n.x + 198, n.y + 36, 3, 138, "#8a6a40");
  p(n.x + 180, n.y + 18, 39, 3, "#3d2a1c");
  p(n.x + 180, n.y + 18, 3, 27, "#3d2a1c");
  p(n.x + 216, n.y + 18, 3, 27, "#3d2a1c");
  p(n.x + 183, n.y + 45, 33, 3, "#3d2a1c");
  for (let i = 0; i < 3; i++) p(n.x + 189 + i * 9, n.y + 21, 3, 24, "#6a6a6a");
  /* A stuffed fish on a plaque. It is very big, apparently. */
  box(n.x + 228, n.y + 18, 66, 36, "#6b4a2a", "#3d2a1c");
  p(n.x + 237, n.y + 30, 36, 12, "#7a9a6a");
  p(n.x + 234, n.y + 33, 6, 6, "#7a9a6a");
  p(n.x + 273, n.y + 27, 12, 18, "#5a7a4a");
  p(n.x + 243, n.y + 33, 3, 3, "#141414");
  /* The arcade cabinet (the screen is drawn each frame). */
  const c = CABINET;
  shadow(c.x + 6, c.y + c.h - 6, c.w, 18);
  box(c.x, c.y, c.w, c.h, "#3a1a4a", "#141414");
  p(c.x + 3, c.y + 3, 12, c.h - 6, "#5a2a6e");
  box(c.x + 6, c.y + 6, c.w - 12, 30, "#e6c200", "#141414");
  if (!EMBED) drawLabel(c.x + c.w / 2, c.y + 15, "ARCADE", "#7a1f2b");
  box(c.x + 12, c.y + 42, c.w - 24, 66, "#141414", "#141414");
  box(c.x - 3, c.y + 114, c.w + 6, 24, "#2a2a2a", "#141414");
  p(c.x + 21, c.y + 105, 6, 15, "#c0c0c0");
  box(c.x + 15, c.y + 99, 18, 12, "#d1202f", "#141414");
  p(c.x + 48, c.y + 120, 9, 9, "#3dff7a");
  p(c.x + 63, c.y + 120, 9, 9, "#e23d4a");
  p(c.x + 78, c.y + 120, 9, 9, "#6ab8d8");
  p(c.x + 36, c.y + 156, 24, 18, "#141414");
  p(c.x + 45, c.y + 159, 6, 12, "#e6c200");
  /* Chalk scoreboard (the numbers are drawn each frame, as the day wears on). */
  box(BOARD.cx - 144, n.y + 12, 96, 90, "#1a1a1a", "#6b4a2a");
  p(BOARD.cx - 141, n.y + 15, 90, 3, "#3a3a28");
  disc(BOARD.cx, BOARD.cy, BOARD.r + 3, "#141414");
  disc(BOARD.cx, BOARD.cy, BOARD.r - 3, "#1a1a1a");
  for (let a = 0; a < 20; a++) {
    const ang = a * Math.PI / 10;
    for (let r = 2; r < BOARD.r - 1; r++) {
      const col = r > BOARD.r - sx(3) ? (a % 2 ? "#d1202f" : "#1a7a52") : r > sx(5) && r < sx(7) ? (a % 2 ? "#d1202f" : "#1a7a52") : (a % 2 ? "#f2e6c8" : "#1a1a1a");
      p(BOARD.cx + Math.round(Math.cos(ang) * r), BOARD.cy + Math.round(Math.sin(ang) * r), 3, 3, col);
    }
  }
  disc(BOARD.cx, BOARD.cy, 3, "#1a7a52");
  p(BOARD.cx, BOARD.cy, 3, 3, "#d1202f");
  /* The oche, in white tape. */
  p(BOARD.cx - 72, n.y + n.h - 18, 120, 6, "#f4f0e4");
}

function drawKettleCorner() {
  const k = KETTLE;
  tileFloor(k.x, k.y, k.w, k.h, "#e8e2c8", "#cfd8c0");
  /* Counter with a tiled splashback, kettle, toaster, biscuit tin and a mug tree. */
  const cx = k.x + sx(16), cy = k.y + sx(12), cw = sx(126);
  p(cx, cy - 24, cw, 30, "#f4f0e4");
  for (let i = 0; i < cw; i += 8) p(cx + i, cy - 24, 3, 30, "#d8d4c8");
  p(cx, cy - 12, cw, 3, "#d8d4c8");
  shadow(cx + 6, cy + 90, cw, 18);
  box(cx, cy + 6, cw, 90, "#8b5a2b", "#141414");
  p(cx + 3, cy + 9, cw - 6, 18, "#d8d2c6");
  p(cx + 3, cy + 24, cw - 6, 3, "#a8a296");
  for (let i = 1; i < 4; i++) p(cx + i * (cw / 4), cy + 30, 3, 63, "#6b4a2a");
  for (let i = 0; i < 4; i++) p(cx + i * (cw / 4) + cw / 8 - 9, cy + 48, 18, 6, "#c4a574");
  drawKettleOn(cx + 6, cy - 54);
  /* toaster */
  box(cx + 126, cy - 24, 60, 39, "#c0c0c0", "#141414");
  p(cx + 129, cy - 21, 21, 30, "#e0e0e0");
  p(cx + 138, cy - 24, 12, 6, "#141414");
  p(cx + 162, cy - 24, 12, 6, "#141414");
  /* biscuit tin */
  box(cx + 210, cy - 18, 48, 33, "#22409a", "#141414");
  p(cx + 210, cy - 24, 48, 9, "#2a50b0");
  p(cx + 222, cy - 9, 24, 12, "#d1202f");
  /* mug tree */
  p(cx + 294, cy - 60, 6, 72, "#6b4a2a");
  p(cx + 282, cy + 6, 30, 6, "#6b4a2a");
  [["#d1202f", -6, -16], ["#f4f0e4", 3, -11], ["#e6c200", -6, -7]].forEach(([c, dx, dy]) => box(cx + 297 + dx, cy + dy, 15, 15, c, "#141414"));
  /* fridge, with magnets */
  const fx = k.x + k.w - sx(30);
  shadow(fx + 3, k.y + 150, 78, 18);
  box(fx, k.y + 6, 78, 150, "#f0ece4", "#141414");
  p(fx + 3, k.y + 9, 18, 141, "#ffffff");
  p(fx, k.y + 54, 78, 3, "#141414");
  p(fx + 60, k.y + 24, 6, 21, "#9a968c");
  p(fx + 60, k.y + 72, 6, 30, "#9a968c");
  p(fx + 24, k.y + 78, 9, 9, "#d1202f");
  p(fx + 39, k.y + 90, 9, 9, "#1a7a52");
  p(fx + 27, k.y + 108, 18, 18, "#f4f0e4");
  p(fx + 27, k.y + 108, 18, 3, "#c4a574");
  if (!EMBED) drawPlate(k.x + 276, k.y + k.h - 48, ["KETTLE CORNER"]);
}

function drawLounge() {
  const l = LOUNGE;
  /* Rug: cream border, red field, a bit worn where Dexter supervises it. */
  const rx = l.x + sx(8), ry = l.y + sx(52), rw = l.w - sx(14), rh = l.h - sx(62);
  shadow(rx + 6, ry + rh - 6, rw, 15);
  p(rx, ry, rw, rh, "#f2e6c8");
  p(rx + 12, ry + 12, rw - 24, rh - 24, "#8a2a2a");
  p(rx + 24, ry + 24, rw - 48, rh - 48, "#7a2424");
  for (let i = 0; i < rw - sx(12); i += sx(8)) {
    p(rx + 18 + i, ry + 18, 12, 3, "#d1202f");
    p(rx + 18 + i, ry + rh - 21, 12, 3, "#d1202f");
  }
  for (let i = 0; i < rw; i += sx(4)) {
    p(rx + i, ry - 6, 3, 6, "#e8dcc0");
    p(rx + i, ry + rh, 3, 6, "#e8dcc0");
  }
  p(rx + rw / 2 - 30, ry + rh / 2 + 24, 60, 18, "#6b1c1c");
  /* The sofa, facing us: teal velvet, three cushions, two fat arms. */
  const s = SOFA;
  shadow(s.x + 6, s.y + s.h - 6, s.w, 21);
  box(s.x + 24, s.y, s.w - 48, 72, "#1f5a5e", "#141414");
  p(s.x + 30, s.y + 6, s.w - 60, 15, "#2f7a7e");
  box(s.x + 30, s.y + 66, s.w - 60, 66, "#2a6e72", "#141414");
  for (let i = 1; i < 3; i++) p(s.x + 30 + i * ((s.w - 60) / 3), s.y + 69, 3, 60, "#1f5a5e");
  p(s.x + 33, s.y + 69, s.w - 66, 9, "#3a8a8e");
  box(s.x, s.y + 30, 42, s.h - 30, "#1f5a5e", "#141414");
  box(s.x + s.w - 42, s.y + 30, 42, s.h - 30, "#1f5a5e", "#141414");
  p(s.x + 6, s.y + 33, 30, 12, "#2f7a7e");
  p(s.x + s.w - 36, s.y + 33, 30, 12, "#2f7a7e");
  p(s.x + 12, s.y + s.h, 12, 9, "#3d2a1c");
  p(s.x + s.w - 24, s.y + s.h, 12, 9, "#3d2a1c");
  /* Coffee table with two mugs and a newspaper. */
  const tx = s.x + sx(40), ty = s.y + sx(78);
  shadow(tx + 6, ty + 42, 186, 18);
  box(tx, ty, 186, 42, "#8b5a2b", "#141414");
  p(tx + 3, ty + 3, 180, 9, "#b07a40");
  p(tx + 12, ty + 42, 12, 15, "#5a3c22");
  p(tx + 162, ty + 42, 12, 15, "#5a3c22");
  box(tx + 24, ty + 6, 54, 27, "#f4f0e4", "#141414");
  p(tx + 30, ty + 12, 30, 3, "#141414");
  p(tx + 30, ty + 18, 39, 3, "#6a6a6a");
  p(tx + 30, ty + 24, 24, 3, "#6a6a6a");
  box(tx + 108, ty - 6, 18, 18, "#d1202f", "#141414");
  box(tx + 138, ty, 18, 18, "#f4f0e4", "#141414");
  /* Standard lamp and plants. */
  p(l.x + l.w - 36, l.y + 12, 3, 120, "#3d2a1c");
  box(l.x + l.w - 60, l.y, 48, 30, "#f2d36b", "#3d2a1c");
  p(l.x + l.w - 54, l.y + 3, 36, 9, "#fff1b0");
  p(l.x + l.w - 48, l.y + 132, 30, 6, "#3d2a1c");
  drawPlant(l.x + l.w - 72, l.y + l.h - 84);
  if (currentSeason() !== "december") drawPlant(l.x + 6, l.y + 90);
}

function drawMachineCorner() {
  const m = MACHINE_CORNER;
  /* Bare concrete, hazard tape round the edge, and a sign nobody needed to write. */
  p(m.x, m.y, m.w, m.h, "#4a4844");
  for (let i = 0; i < 6; i++) p(m.x + 30 + i * 51, m.y + 60 + (i * 111) % (m.h - 120), 27, 3, "#3a3834");
  p(m.x + 90, m.y + 210, 3, 42, "#2a2824");
  p(m.x + 93, m.y + 249, 24, 3, "#2a2824");
  for (let i = 0; i < m.w; i += sx(10)) {
    p(m.x + i, m.y, 18, 12, "#e6c200");
    p(m.x + i + 18, m.y, 12, 12, "#141414");
  }
  for (let i = 0; i < m.h; i += sx(10)) {
    p(m.x, m.y + i, 12, 18, "#e6c200");
    p(m.x, m.y + i + 18, 12, 12, "#141414");
  }
  p(m.x - 6, m.y, 6, m.h, "#141414");
  p(m.x, m.y + m.h, m.w, 6, "#141414");
  if (!EMBED) drawPlate(m.x + m.w / 2 + 6, m.y + 36, ["DO NOT", "TOUCH"], "#e6c200");
  const mc = MACHINE;
  shadow(mc.x - 6, mc.y + mc.h, mc.w + 24, 21);
  p(mc.x - 24, mc.y + mc.h - 6, mc.w + 48, 24, "#141414");
  for (let i = 0; i < 10; i++) p(mc.x - 24 + i * 30, mc.y + mc.h - 6, 18, 24, i % 2 ? "#e6c200" : "#141414");
  box(mc.x + 24, mc.y + 84, 180, 96, "#2a2420", "#141414");
  p(mc.x + 30, mc.y + 90, 60, 84, "#3a342e");
  p(mc.x + 36, mc.y + 96, 24, 6, "#5a5248");
  box(mc.x + 42, mc.y + 24, 132, 96, "#3a2a48", "#141414");
  p(mc.x + 48, mc.y + 30, 42, 84, "#4a3a58");
  p(mc.x + 12, mc.y + 66, 36, 6, "#141414");
  p(mc.x + 12, mc.y + 66, 6, 78, "#141414");
  p(mc.x + 204, mc.y + 108, 30, 6, "#141414");
  box(mc.x + 60, mc.y + 120, 42, 42, "#f4f0e4", "#141414");
  p(mc.x + 72, mc.y + 132, 18, 21, "#d1202f");
  p(mc.x + 156, mc.y + 12, 6, 60, "#c0c0c0");
  if (!EMBED) drawLabel(mc.cx, mc.y + mc.h - 24, "NO", "#d1202f");
}

function drawPrinterStation() {
  const s = printerStation;
  if (!s) return;
  const x = s.x + sx(10), y = s.y + sx(6);
  /* A small table of its own, and the printer, which is having a day. */
  shadow(s.x + 18, s.y + 102, s.w - 30, 18);
  box(s.x + 12, s.y + 66, s.w - 24, 30, "#6b5344", "#141414");
  p(s.x + 15, s.y + 69, s.w - 30, 9, "#8a7360");
  p(s.x + 24, s.y + 96, 15, 24, "#4a3a30");
  p(s.x + s.w - 39, s.y + 96, 15, 24, "#4a3a30");
  box(x, y + 12, 108, 54, "#d8d2c6", "#141414");
  p(x + 3, y + 15, 102, 9, "#f0ece4");
  box(x + 12, y - 12, 84, 27, "#c4bfb2", "#141414");
  p(x + 18, y - 6, 72, 15, "#22409a");
  p(x + 21, y - 3, 30, 6, "#4a6ab0");
  p(x + 18, y + 54, 72, 9, "#f4f0e4");
  /* the jam */
  p(x + 30, y + 60, 24, 18, "#f4f0e4");
  p(x + 33, y + 66, 18, 3, "#9a968c");
  drawPlant(s.x + s.w - 12, s.y + 36);
}

/* Everything that never moves, painted once into an off-screen sheet. */
function paintScenery() {
  windowPanes.length = 0;
  ctx.drawImage(ensurePlanks(), 0, 0);
  p(0, 0, W, TOP_H + 6, "#efe6d4");
  drawCarpet(FLOOR_BLOCK.x, FLOOR_BLOCK.y, FLOOR_BLOCK.w, FLOOR_BLOCK.h);
  drawNook();
  drawKettleCorner();
  drawWaterCooler(KETTLE.x + 6, KETTLE.y + 162);
  drawLounge();
  drawMachineCorner();
  drawPrinterStation();
  drawAllRooms();
  drawSeasonalScenery();
  p(0, 0, W, 6, "#141414");
  p(0, H - 6, W, 6, "#141414");
  p(0, 0, 6, H, "#141414");
  p(W - 6, 0, 6, H, "#141414");
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
  disc(cx, cy, r + 6, "#3d2a1c");
  disc(cx, cy, r + 4, "#5a4232");
  disc(cx, cy, r, "#f4f0e4");
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2 - Math.PI / 2;
    const inner = (i % 3 === 0) ? 8 : 5;
    const thick = (i % 3 === 0) ? 3 : 2;
    const x0 = cx + Math.cos(a) * (r - inner), y0 = cy + Math.sin(a) * (r - inner);
    p(x0, y0, thick, thick, "#141414");
  }
  const t = ukNow();
  const hourAng = ((t.hour % 12) + t.minute / 60) / 12 * Math.PI * 2 - Math.PI / 2;
  const minAng = (t.minute + t.second / 60) / 60 * Math.PI * 2 - Math.PI / 2;
  line(cx, cy, cx + Math.cos(hourAng) * (r - 18), cy + Math.sin(hourAng) * (r - 18), "#141414");
  line(cx, cy, cx + Math.cos(minAng) * (r - 9), cy + Math.sin(minAng) * (r - 9), "#3d2a1c");
  if (!REDUCE) {
    const secAng = t.second / 60 * Math.PI * 2 - Math.PI / 2;
    line(cx, cy, cx + Math.cos(secAng) * (r - 6), cy + Math.sin(secAng) * (r - 6), "#d1202f");
  }
  p(cx, cy, 6, 6, "#d1202f");
}

function drawCanteenSpecial() {
  const room = rooms.find(r => r.id === "canteen");
  if (!room) return;
  const x = room.x + sx(168), y = room.y + sx(4), w = sx(70), h = sx(36);
  box(x, y, w, h, "#2a2a18", "#6b4a2a");
  p(x + 3, y + 3, w - 6, 3, "#4a4a30");
  if (!EMBED) {
    drawLabel(x + w / 2, y + 9, "TODAY", "#c8c4a0");
    drawLabel(x + w / 2, y + 36, todaySpecial(), "#f4f0e4");
  }
}

function drawDartsScore() {
  const x = BOARD.cx - sx(48), y = sx(4);
  const left = dartsRemaining();
  if (EMBED) return;
  drawLabel(x + 48, y + 18, "301", "#8a8668");
  p(x + 12, y + 39, 72, 3, "#5a5640");
  drawLabel(x + 48, y + 48, left === 0 ? "GAME" : String(left), "#f4f0e4");
}

function drawLiveScenery() {
  const kx = KETTLE.x + sx(18), ky = KETTLE.y + sx(12) - sx(18);
  const brewing = people.some(pr => pr.activity === "kettle" && !pr.target);
  /* Steam only really gets going when someone is on kettle duty. */
  /* Puffs stay over the counter, rather than drifting up into the games nook. */
  if (brewing) {
    const s1 = REDUCE ? 0.4 : (animT * 1.4) % 1;
    const s2 = REDUCE ? 0.7 : (animT * 1.1 + 0.35) % 1;
    const s3 = REDUCE ? 0.2 : (animT * 1.7 + 0.6) % 1;
    p(kx + 39, ky + 6 - s1 * 24, 9, 12, "#ffffffdd");
    p(kx + 54, ky + 3 - s2 * 27, 9, 12, "#ffffffbb");
    p(kx + 30, ky + 12 - s3 * 21, 6, 9, "#ffffffcc");
    p(kx + 48, ky - 6 - s2 * 15, 12, 9, "#ffffff88");
    p(kx + 63, ky + 9 - s1 * 18, 6, 9, "#ffffff99");
  }
  drawWallClock();
  drawCanteenSpecial();
  drawDartsScore();
  /* Toast pops up every so often. */
  const tx = KETTLE.x + sx(16) + sx(42), ty = KETTLE.y + sx(12) - sx(8);
  const pop = !REDUCE && (animT % 9) > 7.6;
  if (pop) {
    p(tx + 12, ty - 18, 12, 18, "#c4893a");
    p(tx + 36, ty - 15, 12, 15, "#c4893a");
    p(tx + 12, ty - 18, 12, 3, "#8a5a20");
  }
  /* Arcade screen: attract mode, or a proper game when somebody is playing. */
  const c = CABINET, ax = c.x + sx(5), ay = c.y + sx(15), sw = c.w - sx(10), sh = sx(20);
  const playing = people.some(pr => pr.activity === "arcade" && !pr.target && !(pr.spot && pr.spot.watch));
  p(ax, ay, sw, sh, playing ? "#101830" : "#141428");
  if (playing) {
    const t = REDUCE ? 0.4 : (animT * 0.5) % 1;
    for (let i = 0; i < 6; i++) if (i / 6 > t) p(ax + 6 + i * 12, ay + 30, 3, 3, "#f2e6a0");
    p(ax + 3 + Math.round(t * (sw - 18)), ay + 24, 15, 15, "#e6c200");
    p(ax + 9 + Math.round(t * (sw - 18)), ay + 30, 9, 3, "#101830");
    p(ax + 6, ay + 6, 9, 3, "#e23d4a");
    p(ax + sw - 18, ay + 6, 12, 3, "#3dff7a");
    const g = Math.round(((t + 0.6) % 1) * (sw - 6));
    p(ax + sw - 18 - g, ay + 39, 12, 12, "#e040fb");
  } else if (REDUCE || (animT % 1.4) < 0.9) {
    p(ax + 9, ay + 24, sw - 18, 3, "#d1202f");
    p(ax + 15, ay + 33, sw - 30, 3, "#e6c200");
  }
  /* Darts in the board, and one in flight. */
  darts.stuck.forEach(d => {
    p(d.x, d.y, 3, 3, "#141414");
    p(d.x - 3, d.y + 3, 3, 6, "#f4f0e4");
    p(d.x - 6, d.y + 6, 3, 3, "#d1202f");
  });
  if (darts.flying) {
    const f = darts.flying, t = Math.min(1, f.t);
    const x = f.x0 + (f.x1 - f.x0) * t, y = f.y0 + (f.y1 - f.y0) * t - Math.sin(t * Math.PI) * sx(6);
    p(x, y, 6, 3, "#141414");
    p(x - 6, y + 3, 6, 3, "#d1202f");
  }
  /* The machine's eye. Everyone pretends not to notice it. */
  const m = MACHINE;
  const pulse = REDUCE ? 0.55 : (Math.sin(animT * 3.2) * 0.5 + 0.5);
  const glow = pulse > 0.55 ? "#a04ad0" : "#3dff7a";
  const glowDim = pulse > 0.55 ? "#6b2a8a" : "#1a6b3a";
  p(m.x + 66, m.y - 12, 84, 66, glowDim);
  p(m.x + 78, m.y, 60, 48, glow);
  p(m.x + 90, m.y + 9, 36, 30, "#f4f0e4");
  p(m.x + 99, m.y + 15, 18, 18, "#141414");
  p(m.x + 102, m.y + 18, 6, 6, "#f4f0e4");
  if (!REDUCE && ((animT * 7) % 1) < 0.22) {
    p(m.x + 168, m.y - 18, 9, 9, "#e6c200");
    p(m.x + 180, m.y, 6, 6, "#f4f0e4");
    p(m.x + 162, m.y + 6, 6, 6, "#3dff7a");
  }
  if (machineEventActive()) drawMachineFuss(m);
  /* The printer's light blinks orange. It always blinks orange. */
  if (printerStation) {
    const led = !REDUCE && (animT % 1 < 0.5);
    p(printerStation.x + 30 + 93, printerStation.y + 18 + 27, 9, 9, led ? "#e07a2f" : "#6a3a10");
  }
}

function drawMachineFuss(m) {
  const t = machineEvent.t;
  const flash = REDUCE || ((t * 18) % 1) < 0.55;
  /* The eye goes a bit mental, then the sparks start. */
  p(m.x + 60, m.y - 24, 96, 78, flash ? "#f4f0e4" : "#d1202f");
  p(m.x + 72, m.y - 12, 72, 60, flash ? "#e6c200" : "#a04ad0");
  p(m.x + 90, m.y + 6, 36, 30, "#141414");
  p(m.x + 99, m.y + 15, 18, 18, flash ? "#3dff7a" : "#d1202f");
  const sparks = [
    [m.x + sx(8), m.y - sx(12)], [m.x + sx(62), m.y - sx(10)], [m.x + sx(70), m.y + sx(8)],
    [m.x + sx(4), m.y + sx(16)], [m.x + sx(58), m.y - sx(20)], [m.x + sx(16), m.y - sx(22)],
    [m.x + sx(74), m.y - sx(4)], [m.x + sx(40), m.y - sx(26)]
  ];
  sparks.forEach(function (s, i) {
    const on = REDUCE ? (i % 2 === 0) : ((t * 14 + i * 0.37) % 1) < 0.6;
    if (!on) return;
    const col = i % 3 === 0 ? "#f4f0e4" : (i % 3 === 1 ? "#e6c200" : "#3dff7a");
    p(s[0], s[3], 9, 9, col);
    p(s[0] + (i % 6 ? 12 : -12), s[3] - 9, 6, 6, col);
    p(s[0] + (i % 6 ? 21 : -18), s[3] - 3, 3, 12, col);
  });
}

function drawRainOnWindows() {
  if (!isRaining() || !windowPanes.length) return;
  const sky = currentSky();
  const drop = sky === "night" ? "#c5d8e4" : (sky === "dusk" ? "#efe6d4" : "#3a5a78");
  const veil = sky === "night" ? "#12183099" : (sky === "dusk" ? "#4a2a3c44" : "#6a8aa066");
  windowPanes.forEach(function (w, wi) {
    p(w.x + 6, w.y + 6, w.w - 12, w.h - 12, veil);
    const n = 11;
    for (let i = 0; i < n; i++) {
      const col = (w.x + sx(4) + ((i * 11 + wi * 5) % Math.max(2, w.w - sx(8))));
      let row;
      if (REDUCE) {
        row = w.y + sx(3) + ((i * 7 + wi) % Math.max(2, w.h - sx(7)));
      } else {
        const fall = (animT * (sx(18) + (i % 4) * sx(6)) + i * 9 + wi * 13) % Math.max(3, w.h - sx(5));
        row = w.y + sx(3) + fall;
      }
      if (row > w.y + w.h - sx(4)) continue;
      p(col, row, 3, 12, drop);
      if (i % 2 === 0) p(col, row + 3, 3, 6, "#f4f0e4aa");
    }
    /* Put the mullion back over the rain, so the window still reads as a window. */
    p(w.x + Math.floor(w.w / 2) - 3, w.y, 6, w.h, "#3d2a1c");
    p(w.x, w.y + Math.floor(w.h / 2), w.w, 6, "#3d2a1c");
  });
}

function drawFerretDash() {
  if (!ferretDash) return;
  const u = Math.min(1, ferretDash.t / ferretDash.dur);
  const x = Math.round(sx(-24) + u * (W + sx(48)));
  const y = sx(272) + (REDUCE ? 0 : Math.round(Math.sin(ferretDash.t * 22) * sx(2)));
  const brown = "#8a5a32", dark = "#5a3a20", cream = "#e8d6b8", nose = "#c48a8a";
  shadow(x - 24, y + 9, 84, 12);
  /* A long little body, cream bib, and a bit of a dash. */
  p(x - 18, y - 24, 66, 27, brown);
  p(x - 12, y - 21, 42, 15, dark);
  p(x + 12, y - 18, 24, 15, cream);
  p(x + 36, y - 42, 36, 30, brown);
  p(x + 42, y - 45, 24, 18, cream);
  p(x + 42, y - 36, 9, 9, "#141414");
  p(x + 60, y - 36, 9, 9, "#141414");
  p(x + 45, y - 33, 3, 3, "#f4f0e4");
  p(x + 63, y - 33, 3, 3, "#f4f0e4");
  p(x + 66, y - 24, 9, 6, nose);
  p(x + 72, y - 21, 9, 3, "#3d2a1c");
  p(x + 36, y - 48, 9, 9, brown);
  p(x + 54, y - 48, 9, 9, brown);
  p(x - 42, y - 30, 30, 15, brown);
  p(x - 54, y - 42, 24, 15, dark);
  const step = REDUCE ? 0 : ((ferretDash.t * 14 | 0) % 2);
  p(x - 6, y + 3, 12, 9, dark);
  p(x + 24, y + 3, 12, 9, dark);
  p(x + (step ? 6 : 36), y + 6, 9, 6, "#3d2a1c");
}

function drawFlinchBang(who) {
  if (!machineEventActive()) return;
  const f = flinchOffset(who);
  const x = Math.round(who.x + f.x);
  let top = sx(26);
  if (who.staff) {
    const k = who.staff.kind;
    top = (k === "kenneth" || k === "reggie") ? sx(64) : (k === "terry" || k === "keith") ? sx(60) : sx(54);
  } else if (who.id === "spyro" && who.deskSit) top = sx(34);
  const y = Math.round(who.y + f.y) - top;
  /* A little comic startle, so the flinch reads even in a still frame. */
  p(x, y - 24, 6, 15, "#141414");
  p(x, y - 6, 6, 6, "#141414");
  p(x + 3, y - 24, 3, 15, "#f4f0e4");
}

function drawCatBubble(c) {
  if (!c.bubble || c.bubble.t <= 0) return;
  const text = c.bubble.text;
  const x = Math.round(c.x + flinchOffset(c).x);
  const y = Math.round(c.y + flinchOffset(c).y);
  const top = y - sx(28);
  const w = labelWidth(text) + 10, h = 20;
  let bx = Math.round(x - w / 2);
  bx = Math.max(sx(4), Math.min(W - w - sx(4), bx));
  box(bx, top - h, w, h, "#fffdf7", "#141414");
  p(x - 3, top - 3, 9, 6, "#fffdf7");
  p(x - 6, top, 3, 6, "#141414");
  p(x + 6, top, 3, 6, "#141414");
  p(x - 3, top + 6, 9, 3, "#141414");
  drawLabel(bx + w / 2, top - h + 3, text, "#141414");
}

function drawLateLamp(d) {
  /* Private offices are tight under the nameplate, so the lamp sits a little lower. */
  const lx = d.x + d.w - sx(14), ly = d.y + (d.private ? sx(8) : -sx(2));
  /* A warm pool of light on the desk, then the lamp itself. */
  p(lx - 24, ly + 42, 66, 30, "#f2d36b44");
  p(lx - 12, ly + 48, 42, 18, "#f2d36b66");
  p(lx + 6, ly + 54, 12, 24, "#3d2a1c");
  p(lx + 6, ly + 12, 6, 42, "#c0c0c0");
  box(lx - 12, ly, 36, 21, "#e6c200", "#141414");
  p(lx - 9, ly + 3, 30, 9, "#f2e6a0");
  p(lx, ly + 21, 6, 9, "#c0c0c0");
}

function drawSnow() {
  if (currentSeason() !== "december") return;
  if (REDUCE) {
    /* A little settled snow, no falling flakes. */
    for (let i = 0; i < 18; i++) {
      const x = (i * 37 + 11) % W, y = (i * 53 + 20) % sx(40) + TOP_H - sx(8);
      p(x, y, 6, 3, "#ffffffcc");
    }
    return;
  }
  const n = 36;
  for (let i = 0; i < n; i++) {
    const speed = sx(12) + (i % 5) * sx(6);
    const x = (i * 79 + animT * (sx(8) + i % 6)) % W;
    const y = (i * 47 + animT * speed) % H;
    p(x, y, i % 9 === 0 ? 6 : 3, i % 9 === 0 ? 6 : 3, i % 2 ? "#ffffff" : "#e8f0ff");
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
      for (let y = r.y + sx(8); y < r.y + r.h; y += sx(12)) {
        p(r.x, y, r.w, 3, "#3a2030");
      }
    } else {
      p(r.x, r.y, r.w, r.h, carpet);
      /* subtle carpet grain */
      for (let i = r.y + sx(8); i < r.y + r.h - sx(4); i += sx(10)) {
        p(r.x + 12, i, r.w - 24, 3, dark(carpet, 0.06));
      }
    }
    /* back wall band */
    const wallH = r.amenity ? sx(18) : sx(16);
    p(r.x, r.y, r.w, wallH, wall);
    p(r.x, r.y + wallH - 3, r.w, 3, dark(wall, 0.18));
    if (!r.amenity) {
      drawWindow(r.cx - 66, r.y + 6, 132, 39);
      if (r.id === "terry" || r.id === "reggie") {
        /* modest bookshelf */
        box(r.x + 18, r.y + 66, 48, 90, "#6b4a2a", "#141414");
        p(r.x + 24, r.y + 72, 15, 27, "#7a1f2b");
        p(r.x + 42, r.y + 72, 15, 27, "#22409a");
        p(r.x + 24, r.y + 105, 15, 24, "#0f4a4a");
        p(r.x + 42, r.y + 105, 15, 24, "#c4a574");
        p(r.x + 24, r.y + 132, 33, 15, "#f4f0e4");
      }
    }
    /* side walls */
    p(r.x, r.y, 9, r.h, "#141414");
    p(r.x + 3, r.y, 3, r.h, lite(wall, 0.15));
    p(r.x + r.w - 9, r.y, 9, r.h, "#141414");
    const doorL = r.doorX - Math.floor(r.doorW / 2);
    const doorR = doorL + r.doorW;
    if (north) {
      p(r.x, r.y, doorL - r.x, 9, "#141414");
      p(doorR, r.y, r.x + r.w - doorR, 9, "#141414");
      p(r.x, r.y + r.h - 12, r.w, 12, "#141414");
      p(r.x + 9, r.y + 9, Math.max(0, doorL - r.x - 12), 24, "#c5d8e4");
      p(doorR + 3, r.y + 9, Math.max(0, r.x + r.w - 9 - doorR - 3), 24, "#c5d8e4");
      /* door as a warm gap */
      p(doorL, r.y - 9, r.doorW, 18, "#6b4a2a");
      p(doorL + 6, r.y - 6, r.doorW - 12, 12, "#8b6a42");
      drawSkirting(r.x + sx(3), r.y + r.h - sx(9), doorL - r.x - sx(3));
      drawSkirting(doorR, r.y + r.h - sx(9), r.x + r.w - sx(3) - doorR);
    } else {
      p(r.x, r.y, r.w, 9, "#141414");
      p(r.x, r.y + r.h - 9, doorL - r.x, 9, "#141414");
      p(doorR, r.y + r.h - 9, r.x + r.w - doorR, 9, "#141414");
      p(r.x + 9, r.y + r.h - 48, Math.max(0, doorL - r.x - 12), 24, "#c5d8e4");
      p(doorR + 3, r.y + r.h - 48, Math.max(0, r.x + r.w - 9 - doorR - 3), 24, "#c5d8e4");
      p(doorL, r.y + r.h - 9, r.doorW, 18, "#6b4a2a");
      p(doorL + 6, r.y + r.h - 6, r.doorW - 12, 12, "#8b6a42");
      drawSkirting(r.x + sx(3), r.y + r.h - sx(8), doorL - r.x - sx(3));
      drawSkirting(doorR, r.y + r.h - sx(8), r.x + r.w - sx(3) - doorR);
    }
    drawAmenityFurniture(r);
    if (!EMBED) {
      const lines = (r.staff && r.staff.plate) || r.plate || [String(r.id).toUpperCase()];
      const plateW = Math.max.apply(null, lines.map(s => labelWidth(s) + 12));
      const plateH = lines.length * 21 + 10;
      const px = r.cx - Math.round(plateW / 2);
      const py = north ? r.y + sx(6) : r.y + sx(17);
      box(px, py, plateW, plateH, "#f4f0e4", "#3d2a1c");
      lines.forEach((line, i) => drawLabel(r.cx, py + 6 + i * 21, line, "#141414"));
    }
  });
}

function drawAmenityFurniture(r) {
  if (r.id === "canteen") {
    /* serving counter */
    shadow(r.x + 30, r.y + 144, 258, 18);
    box(r.x + 24, r.y + 90, 258, 54, "#8b5a2b", "#141414");
    p(r.x + 27, r.y + 93, 252, 9, "#a87840");
    p(r.x + 27, r.y + 132, 252, 9, "#6b4a2a");
    /* urn */
    box(r.x + 48, r.y + 54, 48, 42, "#c0c0c0", "#141414");
    p(r.x + 54, r.y + 60, 18, 30, "#d8d8d8");
    p(r.x + 60, r.y + 42, 24, 18, "#d8d2c6");
    /* ketchup / tea */
    box(r.x + 132, r.y + 66, 36, 30, "#e07a2f", "#141414");
    box(r.x + 186, r.y + 72, 24, 24, "#d1202f", "#141414");
    p(r.x + 192, r.y + 75, 9, 6, "#f26a6a");
    /* two tables, not four, with a bit of air */
    [[r.x + sx(112), r.y + sx(70)], [r.x + sx(184), r.y + sx(70)]].forEach(([tx, ty]) => {
      shadow(tx + 6, ty + 54, 132, 18);
      box(tx, ty, 138, 54, "#f4f0e4", "#141414");
      p(tx + 3, ty + 3, 132, 9, "#ffffff");
      p(tx + 18, ty + 48, 18, 24, "#3d2a1c");
      p(tx + 102, ty + 48, 18, 24, "#3d2a1c");
    });
    drawPlant(r.x + r.w - 96, r.y + 84);
  } else if (r.id === "music") {
    /* amp */
    box(r.x + 48, r.y + 108, 60, 90, "#1a1a1a", "#141414");
    p(r.x + 54, r.y + 114, 48, 48, "#3a3a3a");
    p(r.x + 66, r.y + 126, 24, 24, "#2a2a2a");
    p(r.x + 72, r.y + 132, 12, 12, "#111");
    p(r.x + 54, r.y + 168, 48, 18, "#d1202f");
    /* keyboard */
    shadow(r.x + 150, r.y + 204, 108, 15);
    box(r.x + 144, r.y + 156, 108, 48, "#d8d2c6", "#141414");
    p(r.x + 150, r.y + 144, 96, 18, "#141414");
    p(r.x + 156, r.y + 150, 9, 12, "#f4f0e4");
    p(r.x + 174, r.y + 150, 9, 12, "#f4f0e4");
    p(r.x + 192, r.y + 150, 9, 12, "#141414");
    /* drum */
    box(r.x + 300, r.y + 168, 60, 54, "#2a1c14", "#141414");
    p(r.x + 306, r.y + 174, 48, 42, "#c41c1c");
    p(r.x + 318, r.y + 183, 24, 18, "#f4f0e4");
    /* guitar on the wall */
    p(r.cx - 24, r.y + 72, 18, 48, "#6b3d12");
    p(r.cx - 36, r.y + 108, 42, 30, "#7a1f2b");
    p(r.cx - 24, r.y + 114, 18, 18, "#f4f0e4");
    /* bench */
    box(r.x + 48, r.y + 288, 120, 30, "#6b3d12", "#141414");
    p(r.x + 54, r.y + 291, 108, 6, "#8b5a2b");
  }
}

function drawDesk(d) {
  const x = d.x, y = d.y, w = d.w;
  /* empty chair first, behind the desk; person may cover it */
  shadow(d.chairX - 24, d.chairY + 18, 54, 15);
  /* back */
  box(d.chairX - 24, d.chairY - 48, 48, 42, "#4a3224", "#141414");
  p(d.chairX - 21, d.chairY - 45, 42, 12, "#5a4232");
  p(d.chairX - 18, d.chairY - 30, 36, 18, "#3d2a1c");
  /* seat */
  box(d.chairX - 27, d.chairY - 12, 54, 21, "#3d2a1c", "#141414");
  p(d.chairX - 24, d.chairY - 9, 48, 6, "#5a4232");
  p(d.chairX - 21, d.chairY + 9, 9, 18, "#2a1c14");
  p(d.chairX + 12, d.chairY + 9, 9, 18, "#2a1c14");
  /* desk surface */
  shadow(x + 15, y + 72, w - 24, 18);
  box(x + 9, y + 48, w - 18, 30, "#8b5a2b", "#141414");
  p(x + 12, y + 51, w - 24, 9, "#b07a40");
  p(x + 12, y + 69, w - 24, 6, "#6b4a2a");
  woodGrain(x + 12, y + 51, w - 24, 24, "#7a4e24");
  p(x + 24, y + 78, 18, 24, "#6b4a2a");
  p(x + w - 42, y + 78, 18, 24, "#6b4a2a");
  /* A little keyboard, so the desk is a desk and not a blank slab. */
  const kw = Math.min(54, w - 48), kx = d.cx - Math.floor(kw / 2), ky = y + 58;
  box(kx, ky, kw, 12, "#2a2a2a", "#141414");
  for (let i = 2; i < kw - 3; i += 5) {
    p(kx + i, ky + 2, 3, 3, "#d8d4c8");
    p(kx + i, ky + 7, 3, 3, "#d8d4c8");
  }
  /* monitor with glow */
  box(d.cx - 32, y - 14, 64, 52, "#1a1a1a", "#141414");
  p(d.cx - 30, y - 12, 60, 3, "#3a3a3a");
  const glow = lite(d.staff.accent || "#8ec8e6", 0.2);
  p(d.cx - 26, y - 8, 52, 40, glow);
  p(d.cx - 24, y - 6, 20, 10, lite(glow, 0.45));
  p(d.cx - 24, y - 8, 52, 3, "#1a1a1acc");
  p(d.cx - 22, y - 7, 4, 2, "#3dff7a");
  p(d.cx - 16, y - 7, 8, 2, "#f4f0e4");
  if (!REDUCE && ((animT * 3 + d.cx) % 1) < 0.08) p(d.cx - 12, y + 8, 24, 2, "#ffffff66");
  p(d.cx - 6, y + 38, 12, 16, "#3d2a1c");
  p(d.cx - 8, y + 36, 16, 3, "#2a1c14");
  /* mug on a few desks, not all. Kenneth has his black-cat mug and a red quill. */
  if (d.id === "kenneth") {
    const mx = d.x + 8;
    box(mx, y + 27, 21, 24, "#f4f0e4", "#141414");
    p(mx + 3, y + 24, 6, 6, "#141414");
    p(mx + 12, y + 24, 6, 6, "#141414");
    p(mx + 6, y + 33, 3, 3, "#141414");
    p(mx + 12, y + 33, 3, 3, "#141414");
    p(mx + 9, y + 36, 3, 3, "#141414");
    p(mx + 6, y + 42, 9, 6, "#d1202f");
    p(mx + 21, y + 33, 6, 9, "#f4f0e4");
    /* red quill on the other side of the desk */
    const qx = d.x + d.w - 16;
    p(qx + 9, y + 6, 9, 15, "#d1202f");
    p(qx + 6, y + 9, 6, 9, lite("#d1202f", 0.25));
    p(qx + 12, y + 18, 6, 24, "#f4f0e4");
    p(qx + 12, y + 39, 3, 9, "#3d2a1c");
  } else if (d.id === "percy" || d.id === "george") {
    const mx = d.x + 8;
    box(mx, y + 30, 18, 18, "#f4f0e4", "#141414");
    p(mx + 3, y + 33, 12, 6, "#d1202f");
    p(mx + 18, y + 36, 6, 9, "#f4f0e4");
  } else if (!d.private) {
    /* A bit of desk clutter, so the rows do not look like a showroom. */
    const k = STAFF.indexOf(d.staff) % 4;
    if (k === 0) {
      p(d.x + 18, y + 36, 27, 15, "#f4f0e4");
      p(d.x + 21, y + 33, 24, 3, "#d8d4c8");
      p(d.x + 21, y + 42, 18, 3, "#9a968c");
    } else if (k === 1) {
      box(d.x + d.w - 39, y + 33, 18, 18, "#c45c26", "#3d2a1c");
      p(d.x + d.w - 36, y + 15, 12, 18, "#2a8a5a");
      p(d.x + d.w - 39, y + 21, 3, 6, "#2a8a5a");
    } else if (k === 2) {
      p(d.x + d.w - 36, y + 45, 21, 6, "#3d2a1c");
      p(d.x + d.w - 30, y + 18, 3, 27, "#3d2a1c");
      box(d.x + d.w - 39, y + 9, 21, 12, "#e6c200", "#3d2a1c");
    }
  }
  const owl = nightOwl();
  if (owl && owl.desk === d) drawLateLamp(d);
}

/* ---------- The characters, drawn as little cartoon figures at 1920 ----------
   These are drawn with smooth shapes and a soft ink outline rather than blocks, so
   faces, hands, clothes and props read properly at the larger size. The layout,
   colours and each person's icon are the same as before. Coordinates are world
   pixels, with (x, y) at the feet. */
const INK = "#1c1410";
const OUTLINE = 2.5;
function q(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

function vFill(fill, line, lw) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (line) { ctx.lineWidth = lw || OUTLINE; ctx.strokeStyle = line; ctx.stroke(); }
}
function vEll(cx, cy, rx, ry, fill, line, lw) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
  vFill(fill, line, lw);
}
function vEllRot(cx, cy, rx, ry, rot, fill, line, lw) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), rot, 0, Math.PI * 2);
  vFill(fill, line, lw);
}
function rrPath(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function vRect(x, y, w, h, r, fill, line, lw) {
  ctx.beginPath();
  rrPath(x, y, w, h, r);
  vFill(fill, line, lw);
}
function vPoly(pts, fill, line, lw) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  vFill(fill, line, lw);
}
function vPath(build, fill, line, lw) {
  ctx.beginPath();
  build();
  vFill(fill, line, lw);
}
function vStroke(pts, col, lw) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.lineWidth = lw;
  ctx.strokeStyle = col;
  ctx.stroke();
}
function vLimb(pts, w, col, line) {
  if (line) vStroke(pts, line, w + OUTLINE * 2);
  vStroke(pts, col, w);
}
function vArc(cx, cy, r, a0, a1, col, lw) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, a0, a1);
  ctx.lineWidth = lw;
  ctx.strokeStyle = col;
  ctx.stroke();
}
function vShadow(x, y, rx) {
  vEll(x, y + 3, rx, rx * 0.3, "rgba(20, 14, 10, 0.22)");
}
function withClip(build, draw) {
  ctx.save();
  ctx.beginPath();
  build();
  ctx.clip();
  draw();
  ctx.restore();
}
function charBegin() {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
}
function charEnd() {
  ctx.restore();
}

/* How someone is standing this frame: walking swing, celebration jump, idle bob. */
function walkFrame(pr) {
  if (REDUCE || !pr.target) return 0;
  return (pr.walkT * 7 | 0) % 3;
}
function idleBob(pr) {
  if (REDUCE) return 0;
  if (pr.phase === "idle" && !pr.target) {
    return Math.sin(animT * 3 + (pr.walkT || 0)) > 0.35 ? S : 0;
  }
  return 0;
}
function poseOf(pr) {
  const cele = pr.phase === "celebrating";
  const walking = pr.phase === "idle" || pr.phase === "to-desk";
  const moving = !REDUCE && walking && !!pr.target;
  const ph = moving ? pr.walkT * 10 : 0;
  const swing = moving ? Math.sin(ph) : 0;
  const jump = (!REDUCE && cele) ? Math.abs(Math.sin(pr.celeT * 10)) * sx(8) : 0;
  const bob = moving ? (1 - Math.abs(Math.cos(ph))) * 3 : (idleBob(pr) ? 2 : 0);
  const left = pr.facing === "l";
  return {
    x: Math.round(pr.x), feet: Math.round(pr.y), y: Math.round(pr.y - jump),
    body: Math.round(pr.y - jump - bob), swing: swing, moving: moving, cele: cele, jump: jump,
    sit: isSeated(pr), work: isWorkingPose(pr), left: left, look: left ? -1 : 1,
    glance: pr.glanceT > 0
  };
}
function isSeated(pr) {
  return pr.phase === "idle" && !pr.target && !!pr.spot && !!pr.spot.seat && pr.activity === "sofa";
}
function armColour(s) {
  if (s.kind === "kenneth") return "#9a968c";
  if (s.kind === "terry") return "#d8d4c8";
  if (s.kind === "reggie") return "#ccc8bc";
  return s.skin;
}

/* Legs and shoes. Standing legs swing in the direction of travel; seated legs
   are short thighs pointing at us, with the shoes just below. */
function drawLegsV(P, trouser, shoe, opts) {
  const o = opts || {};
  const x = P.x, y = P.y;
  const hipY = y - (o.hip || 38);
  const legW = o.legW || 11;
  if (P.sit) {
    [-1, 1].forEach(s => {
      vEll(x + s * 8, y - 8, 8, 10, trouser, INK);
      vEll(x + s * 9, y + 2, 8, 4.5, shoe, INK, 2);
    });
    return;
  }
  const order = P.look > 0 ? [-1, 1] : [1, -1];
  order.forEach(s => {
    const k = s * P.swing;
    const dx = P.look * k * 10;
    const lift = P.moving ? Math.max(0, k) * 5 : 0;
    const fx = x + s * 6 + dx, fy = y - 6 - lift;
    const kx = x + s * 6 + dx * 0.55 + P.look * Math.abs(k) * 3, ky = (hipY + fy) / 2;
    vLimb([x + s * 6, hipY, kx, ky, fx, fy], legW, trouser, INK);
    vEll(fx + P.look * 3, fy + 3, 8.5, 4.5, shoe, INK, 2);
    vEll(fx + P.look * 3 - 2, fy + 1.5, 3, 1.4, lite(shoe, 0.35));
  });
}

/* A rounded trapezoid body, lit from the top left. */
function torsoPath(x, top, bottom, wt, wb) {
  return function () {
    ctx.moveTo(x - wt, top + 8);
    ctx.quadraticCurveTo(x - wt, top, x - wt + 8, top);
    ctx.lineTo(x + wt - 8, top);
    ctx.quadraticCurveTo(x + wt, top, x + wt, top + 8);
    ctx.lineTo(x + wb, bottom - 4);
    ctx.quadraticCurveTo(x + wb, bottom, x + wb - 4, bottom);
    ctx.lineTo(x - wb + 4, bottom);
    ctx.quadraticCurveTo(x - wb, bottom, x - wb, bottom - 4);
    ctx.closePath();
  };
}
function drawTorsoV(x, top, bottom, wt, wb, fill, details) {
  const path = torsoPath(x, top, bottom, wt, wb);
  vPath(path, fill);
  withClip(path, () => {
    p(x + wt * 0.35, top, wt, bottom - top, dark(fill, 0.16));
    p(x - wt, top, wt * 0.6, 6, lite(fill, 0.18));
    if (details) details();
  });
  vPath(path, null, INK);
}

/* An arm from the shoulder to the hand, with a little elbow, and a mitten hand. */
function drawArmV(sx0, sy0, hx, hy, sleeve, skin, opts) {
  const o = opts || {};
  const mx = (sx0 + hx) / 2, my = (sy0 + hy) / 2;
  const dx = hx - sx0, dy = hy - sy0, len = Math.max(1, Math.hypot(dx, dy));
  const bend = o.bend === undefined ? 3 : o.bend;
  const side = sx0 < hx ? -1 : 1;
  const ex = mx + (-dy / len) * bend * side, ey = my + (dx / len) * bend * side;
  vLimb([sx0, sy0, ex, ey, hx, hy], o.w || 8.5, sleeve, INK);
  if (o.cuff) vEll(hx - dx / len * 4, hy - dy / len * 4, 5, 3.6, o.cuff, INK, 1.5);
  if (o.noHand) return;
  drawHandV(hx, hy, skin, o.fingers);
}
function drawHandV(hx, hy, skin, fingers) {
  vEll(hx, hy, 5.2, 5, skin, INK, 2);
  vEll(hx - 3.6, hy - 1.5, 2, 2.6, skin, INK, 1.5);
  vEll(hx, hy, 4.2, 4, skin);
  if (fingers) {
    vStroke([hx - 1, hy + 2.5, hx - 1, hy + 4.2], dark(skin, 0.3), 1);
    vStroke([hx + 1.8, hy + 2.2, hx + 1.8, hy + 4], dark(skin, 0.3), 1);
  }
}

/* A friendly face: whites, irises that follow the facing, a glint, brows, nose, mouth. */
function drawFaceV(cx, cy, look, o) {
  const opt = o || {};
  const eyeDX = 7, shift = look * 2;
  const iris = opt.eye || "#2a1c14";
  [-1, 1].forEach(s => {
    const ex = cx + s * eyeDX + shift;
    if (opt.sleepy) {
      vArc(ex, cy + 1, 3.6, Math.PI * 0.1, Math.PI * 0.9, INK, 1.8);
      return;
    }
    vEll(ex, cy, 4.2, 5, "#fffef8", INK, 1.5);
    const ix = ex + look * 1.4 + (opt.glance ? look * 0.6 : 0), iy = cy + (opt.glance ? 1.2 : 0.4);
    vEll(ix, iy, 2.6, 3.2, iris);
    vEll(ix, iy, 1.3, 1.6, "#0e0a08");
    vEll(ix - 0.9, iy - 1.4, 1, 1, "#ffffff");
  });
  const brow = opt.brow || INK;
  const lift = opt.cele ? -2 : 0;
  [-1, 1].forEach(s => {
    const bx = cx + s * eyeDX + shift;
    const tilt = opt.glance ? s * 1.5 : (opt.stern ? -s * 1.2 : 0);
    vStroke([bx - 3.5, cy - 7.5 + lift + tilt, bx + 3.5, cy - 7.5 + lift - tilt], brow, opt.browW || 2.2);
  });
  const skin = opt.skin || "#e8c4a0";
  if (!opt.noNose) vArc(cx + look * 3, cy + 5.5, 2.2, look > 0 ? -Math.PI * 0.3 : Math.PI * 0.3, look > 0 ? Math.PI * 0.6 : Math.PI * 1.3, dark(skin, 0.3), 1.6);
  const mx = cx + look * 2, my = cy + 11;
  if (opt.cele) {
    vPath(() => { ctx.moveTo(mx - 5, my - 1); ctx.quadraticCurveTo(mx, my + 8, mx + 5, my - 1); ctx.closePath(); }, "#7a2420", INK, 1.5);
    vEll(mx, my + 3, 2.4, 1.4, "#e07a7a");
  } else if (opt.glance) {
    vEll(mx, my + 1, 2, 2.4, "#7a2420", INK, 1.2);
  } else if (opt.grin) {
    vPath(() => { ctx.moveTo(mx - 7, my - 3); ctx.quadraticCurveTo(mx, my + 10, mx + 7, my - 3); ctx.closePath(); }, "#7a2420", INK, 1.5);
    q(mx - 5.4, my - 2.2, 10.8, 2.6, "#fffdf6");
    vEll(mx, my + 3.4, 3, 1.6, "#e07a7a");
  } else if (!opt.noMouth) {
    vArc(mx, my - 3, 4.6, Math.PI * 0.2, Math.PI * 0.8, "#7a3a30", 1.8);
  }
  if (!opt.noBlush) {
    vEll(cx - 10 + shift, cy + 6, 3.2, 1.8, "rgba(230, 110, 110, 0.28)");
    vEll(cx + 10 + shift, cy + 6, 3.2, 1.8, "rgba(230, 110, 110, 0.28)");
  }
}
function drawSweat(x, y) {
  vPath(() => { ctx.moveTo(x, y - 5); ctx.quadraticCurveTo(x + 4, y + 1, x, y + 3); ctx.quadraticCurveTo(x - 4, y + 1, x, y - 5); }, "#8ec8e6", INK, 1.2);
}


/* Everyone's own prop, held in the hand at (hx, hy). look is +1 facing right, -1 left. */
function drawPropV(kind, hx, hy, look, sym) {
  const L = look || 1;
  if (kind === "clipboard") {
    ctx.save(); ctx.translate(hx + L * 6, hy - 6); ctx.rotate(L * 0.12);
    vRect(-11, -14, 22, 28, 3, "#b8925a", INK);
    vRect(-8, -9, 16, 20, 1, "#fbf8ee");
    [-4, 0, 4].forEach(dy => vStroke([-5, dy, 5, dy], "#9a968c", 1.2));
    vStroke([-5, 8, 1, 8], "#d1202f", 1.4);
    vRect(-5, -17, 10, 6, 2, "#c0c0c0", INK, 1.5);
    ctx.restore();
  } else if (kind === "envelope") {
    ctx.save(); ctx.translate(hx + L * 8, hy - 3); ctx.rotate(-L * 0.08);
    vRect(-14, -9, 28, 18, 2, "#fbf6ea", INK);
    vStroke([-13, -8, 0, 2, 13, -8], "#9a8a70", 1.4);
    vRect(6, -6, 6, 6, 1, "#d1202f");
    vStroke([-10, 5, -2, 5], "#1e3a5f", 1.4);
    ctx.restore();
  } else if (kind === "book") {
    ctx.save(); ctx.translate(hx + L * 6, hy - 5); ctx.rotate(L * 0.1);
    vRect(-10, -13, 21, 27, 2, "#f2e6d0", INK);
    vRect(-11, -13, 19, 27, 2, "#7a1f2b", INK);
    p(-7, -6, 12, 2, "#d4af37");
    p(-7, -2, 9, 1.5, "#d4af37");
    p(-9, -13, 2.5, 27, dark("#7a1f2b", 0.3));
    ctx.restore();
  } else if (kind === "joystick") {
    const x = hx + L * 8, y = hy;
    vRect(x - 13, y - 4, 26, 12, 4, "#1e1e1e", INK);
    vEll(x + L * 7, y + 1, 2.6, 2.6, "#e23d4a");
    vLimb([x - L * 3, y - 2, x - L * 4, y - 16], 3.2, "#c0c0c0", INK);
    vEll(x - L * 4, y - 18, 5.5, 5.5, "#e23d4a", INK, 2);
    vEll(x - L * 5.5, y - 20, 1.8, 1.8, "#ff8a94");
  } else if (kind === "basket") {
    const x = hx + L * 10, y = hy + 2;
    vLimb([x - L * 10, y - 4, x - L * 22, y - 8], 3, "#3d2a1c", INK);
    ["#f2c14e", "#e6b23a", "#f8d86a", "#e6b23a", "#f2c14e"].forEach((c, i) => {
      vRect(x - 9 + i * 4, y - 15 + (i % 2) * 3, 3.4, 12, 1, c, "#a8761a", 1);
    });
    vRect(x - 12, y - 6, 24, 13, 3, "#c8c8c8", INK);
    for (let i = -8; i <= 8; i += 4) vStroke([x + i, y - 5, x + i, y + 6], "#8a8a8a", 1);
    vStroke([x - 11, y, x + 11, y], "#8a8a8a", 1);
  } else if (kind === "spool") {
    const x = hx + L * 8, y = hy - 4;
    vRect(x - 9, y - 12, 18, 24, 3, "#e07a2f", INK);
    vRect(x - 7, y - 8, 14, 16, 1, "#22409a");
    for (let i = -6; i <= 6; i += 3) vStroke([x - 7, y + i, x + 7, y + i + 1], "#4a6ab0", 1.2);
    vEll(x, y - 12, 9, 2.6, "#f09a5a", INK, 1.5);
    vStroke([x + 7, y + 6, x + 12, y + 14], "#22409a", 1.6);
  } else if (kind === "duck") {
    const x = hx + L * 9, y = hy - 4;
    vEll(x, y + 3, 12, 8, "#f2c14e", INK);
    vEll(x - L * 3, y + 1, 6, 3.5, "#f8dc80");
    vEll(x + L * 6, y - 7, 7, 7, "#f2c14e", INK);
    vPoly([x + L * 11, y - 8, x + L * 18, y - 6, x + L * 11, y - 4], "#e07a2f", INK, 1.5);
    vEll(x + L * 8, y - 9, 1.6, 1.8, INK);
    vPath(() => { ctx.moveTo(x - L * 12, y + 2); ctx.lineTo(x - L * 17, y - 3); ctx.lineTo(x - L * 10, y - 1); }, "#f2c14e", INK, 1.5);
  } else if (kind === "reel") {
    const x = hx + L * 10, y = hy - 4;
    vEll(x, y, 13, 13, "#d4af37", INK);
    vEll(x, y, 10, 10, "#b8941e");
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2 + animT * (REDUCE ? 0 : 0.6);
      vEll(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 2.4, 2.4, "#3a2a10");
    }
    vEll(x, y, 2.2, 2.2, "#f2e6a0", INK, 1);
    vPath(() => { ctx.moveTo(x + L * 11, y + 6); ctx.quadraticCurveTo(x + L * 20, y + 14, x + L * 14, y + 22); }, null, "#2a2a2a", 4);
  } else if (kind === "coin") {
    /* Penny's coin: every few seconds it spins on the spot, then sits still again. */
    const spin = !REDUCE && ((animT * 0.55) % 7) < 1.1;
    const phase = spin ? Math.abs(Math.cos(animT * 10)) : 1;
    const x = hx + L * 6, y = hy - 10;
    vEll(x, y, Math.max(1.5, 9 * phase), 9, "#d4af37", INK, 2);
    if (phase > 0.4) {
      vEll(x, y, 6.5 * phase, 6.5, "#e8c650");
      ctx.save(); ctx.translate(x, y); ctx.scale(phase, 1);
      ctx.fillStyle = "#8a6a20"; ctx.font = "bold 11px Georgia, serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(sym || "£", 0, 1);
      ctx.restore();
    }
  } else if (kind === "whistle") {
    const x = hx + L * 8, y = hy - 4;
    vPath(() => { ctx.moveTo(hx - L * 4, hy - 24); ctx.quadraticCurveTo(x, y - 18, x, y - 4); }, null, "#c45c26", 2);
    vRect(x - 8, y - 5, 16, 10, 5, "#d8d8d8", INK);
    vRect(x + L * 6 - (L > 0 ? 0 : 8), y - 4, 8, 5, 1, "#c0c0c0", INK, 1.5);
    vEll(x - L * 2, y, 2.4, 2.4, "#6a6a6a");
  } else if (kind === "badge") {
    const x = hx + L * 8, y = hy - 6;
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6 : 13;
      pts.push(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    vPoly(pts, "#d0d0d0", INK);
    vEll(x, y, 5.5, 5.5, "#1b2b1a", INK, 1.2);
    vEll(x, y, 2.4, 2.4, "#d4af37");
  } else if (kind === "megaphone") {
    const x = hx + L * 2, y = hy - 6;
    vPoly([x, y - 4, x + L * 22, y - 12, x + L * 22, y + 12, x, y + 4], "#e040fb", INK);
    vEll(x + L * 22, y, 3.5, 12, "#b020c8", INK, 2);
    vRect(x - (L > 0 ? 6 : 0), y - 5, 6, 10, 2, "#7a1a5c", INK, 1.8);
    vLimb([x + L * 2, y + 4, x + L * 2, y + 12], 4, "#1a1a1a", INK);
  } else if (kind === "teacup") {
    const x = hx + L * 8, y = hy - 2;
    vEll(x, y + 6, 13, 3.4, "#f4f0e4", INK, 1.8);
    vPath(() => { ctx.moveTo(x - 9, y - 6); ctx.lineTo(x + 9, y - 6); ctx.quadraticCurveTo(x + 8, y + 5, x, y + 5); ctx.quadraticCurveTo(x - 8, y + 5, x - 9, y - 6); }, "#fbf8ee", INK);
    vEll(x, y - 6, 9, 2.4, "#a8763a");
    vArc(x + L * 10, y - 1, 3.6, -Math.PI / 2, Math.PI / 2, INK, 2);
    p(x - 6, y - 2, 12, 2, "#c5a572");
    if (!REDUCE) {
      const s = (animT * 1.2) % 1;
      vPath(() => { ctx.moveTo(x - 2, y - 10 - s * 6); ctx.quadraticCurveTo(x + 3, y - 16 - s * 6, x - 1, y - 22 - s * 6); }, null, "rgba(255,255,255,0.75)", 2);
    }
  } else if (kind === "crate") {
    const x = hx + L * 6, y = hy + 2;
    vEll(x - 5, y - 13, 5, 5, "#d1202f", INK, 1.5);
    vRect(x + 1, y - 18, 8, 9, 1, "#f4f0e4", INK, 1.5);
    vRect(x - 15, y - 9, 30, 20, 2, "#c4a574", INK);
    p(x - 13, y - 4, 26, 2.5, "#8a6a40");
    p(x - 13, y + 3, 26, 2.5, "#8a6a40");
    vStroke([x - 13, y - 7, x + 13, y + 9], "#a8875a", 2);
  } else if (kind === "grant") {
    const x = hx + L * 8, y = hy - 6;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-L * 0.1);
    vRect(-13, -10, 26, 18, 2, "#fbf6ea", INK);
    [-5, -1, 3].forEach(dy => vStroke([-9, dy, 4, dy], "#9a968c", 1.2));
    vEll(8, 4, 4.5, 4.5, "#d4af37", INK, 1.5);
    vPoly([6, 7, 4, 13, 8, 10, 12, 13, 10, 7], "#4c1d95");
    ctx.restore();
  } else if (kind === "trophy") {
    const x = hx + L * 8, y = hy - 6;
    vRect(x - 13, y - 11, 26, 20, 3, "#d4af37", INK);
    vRect(x - 10, y - 8, 20, 14, 2, "#f2e6a0");
    vPoly([x - 3, y - 5, x - 3, y + 3, x + 5, y - 1], "#c81e3a");
    vRect(x - 4, y + 9, 8, 4, 1, "#8a6a20", INK, 1.5);
  } else if (kind === "tablet") {
    /* Kraken Keith's tablet: the chart flips from a green rise to a red dip. */
    const up = REDUCE || ((animT * 0.35 | 0) % 2 === 0);
    const x = hx + L * 8, y = hy - 6;
    vRect(x - 14, y - 12, 28, 24, 3, "#1a1a1a", INK);
    vRect(x - 11, y - 9, 22, 18, 1, up ? "#0e1a14" : "#1a0e0e");
    const col = up ? "#3dff7a" : "#e0303a";
    const pts = up ? [0, 6, 4, 3, 8, 4, 12, -1, 16, 0, 20, -6] : [0, -6, 4, -2, 8, -3, 12, 2, 16, 1, 20, 6];
    const line = [];
    for (let i = 0; i < pts.length; i += 2) line.push(x - 10 + pts[i], y + pts[i + 1]);
    vStroke(line, col, 2);
    vEll(line[line.length - 2], line[line.length - 1], 1.8, 1.8, col);
  } else if (kind === "quill") {
    const x = hx + L * 3, y = hy;
    vPath(() => {
      ctx.moveTo(x, y + 6);
      ctx.quadraticCurveTo(x + L * 14, y - 12, x + L * 6, y - 34);
      ctx.quadraticCurveTo(x - L * 4, y - 16, x, y + 6);
    }, "#fbf8f0", INK, 2);
    for (let i = 0; i < 4; i++) vStroke([x + L * (2 + i), y - 6 - i * 6, x + L * (8 + i), y - 10 - i * 6], "#d8d0c0", 1.2);
    vStroke([x, y + 6, x - L * 2, y + 14], "#3d2a1c", 2.4);
  }
}

/* The hats, headphones, clouds and birds some people wear. */
function drawHeadgearV(s, cx, cy, look, back) {
  const kind = s.prop;
  if (kind === "hat") {
    /* Foreman George's hard hat. */
    vEll(cx, cy - 12, 22, 4.5, dark(s.accent, 0.1), INK);
    vPath(() => { ctx.moveTo(cx - 17, cy - 12); ctx.quadraticCurveTo(cx - 17, cy - 32, cx, cy - 32); ctx.quadraticCurveTo(cx + 17, cy - 32, cx + 17, cy - 12); ctx.closePath(); }, s.accent, INK);
    vRect(cx - 3, cy - 33, 6, 20, 2, lite(s.accent, 0.25));
    vEll(cx - 8, cy - 25, 4, 2.6, "rgba(255,255,255,0.45)");
  } else if (kind === "headphones") {
    vArc(cx, cy - 2, 19, Math.PI * 1.05, Math.PI * 1.95, "#1a1a1a", 4);
    if (!back || true) {
      vRect(cx - 22, cy - 6, 8, 14, 3, s.accent, INK);
      vRect(cx + 14, cy - 6, 8, 14, 3, s.accent, INK);
    }
  } else if (kind === "cloud") {
    const t = REDUCE ? 0 : animT;
    const bx = cx - look * 4, by = cy - 40 - Math.sin(t * 1.3) * 2;
    [[-12, 2, 8], [-3, -4, 10], [9, 0, 8], [2, 5, 7]].forEach(([dx, dy, r]) => vEll(bx + dx, by + dy, r, r * 0.85, INK));
    [[-12, 2, 6.5], [-3, -4, 8.5], [9, 0, 6.5], [2, 5, 5.5]].forEach(([dx, dy, r]) => vEll(bx + dx, by + dy, r, r * 0.85, s.accent));
    vEll(bx - 5, by - 6, 3, 2, "#ffffff");
  } else if (kind === "bird") {
    const bx = cx + (back ? 8 : look * 10), by = cy - 26;
    vEll(bx, by, 8, 6, s.accent, INK, 2);
    vEll(bx + look * 6, by - 5, 5, 5, s.accent, INK, 2);
    vPoly([bx + look * 10, by - 6, bx + look * 15, by - 4, bx + look * 10, by - 3], "#e07a2f", INK, 1.2);
    vEll(bx + look * 7, by - 6, 1.2, 1.3, INK);
    vPath(() => { ctx.moveTo(bx - look * 7, by); ctx.lineTo(bx - look * 13, by - 4); ctx.lineTo(bx - look * 8, by + 3); }, lite(s.accent, 0.1), INK, 1.5);
    vStroke([bx - 2, by + 6, bx - 2, by + 9], "#e07a2f", 1.5);
    vStroke([bx + 2, by + 6, bx + 2, by + 9], "#e07a2f", 1.5);
  }
}


/* Each floor specialist's look: hair, clothes, and the odd extra. Colours come from STAFF. */
function hairFrontBaseV(style, cx, cy, col, look) {
  const top = () => { ctx.ellipse(cx, cy - 1, 17.5, 19, 0, Math.PI, Math.PI * 2); };
  const hi = lite(col, 0.22);
  if (style === "crew") {
    vPath(() => { ctx.ellipse(cx, cy - 2, 17, 17.5, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.quadraticCurveTo(cx, cy - 15, cx - 16.5, cy - 7); }, col, INK, 2);
    for (let i = -10; i <= 10; i += 4) q(cx + i, cy - 14 + Math.abs(i) * 0.25, 1.5, 1.5, dark(col, 0.2));
    return;
  }
  if (style === "curly") {
    [[-15, -6], [-11, -14], [-4, -18], [4, -18], [11, -14], [15, -6], [0, -10], [-8, -9], [8, -9]].forEach(([dx, dy]) => vEll(cx + dx, cy + dy, 6.5, 6.5, col, INK, 2));
    [[-11, -14], [-4, -18], [4, -18], [11, -14], [0, -10], [-8, -9], [8, -9]].forEach(([dx, dy]) => vEll(cx + dx, cy + dy, 5, 5, col));
    vEll(cx - 6, cy - 16, 2, 1.4, hi);
    return;
  }
  /* the cap of hair over the crown */
  vPath(() => {
    ctx.moveTo(cx - 17.5, cy - 1);
    top();
    if (style === "side" || style === "swept") {
      ctx.lineTo(cx + 17.5, cy + (look > 0 ? -3 : 3));
      ctx.quadraticCurveTo(cx + look * 4, cy - 18, cx - 17.5, cy + (look > 0 ? 3 : -3));
    } else if (style === "bob") {
      ctx.lineTo(cx + 17.5, cy - 7);
      ctx.lineTo(cx - 17.5, cy - 7);
    } else {
      ctx.lineTo(cx + 17.5, cy - 3);
      ctx.quadraticCurveTo(cx, cy - 13, cx - 17.5, cy - 3);
    }
    ctx.closePath();
  }, col, INK, 2);
  if (style === "bob") {
    vRect(cx - 19, cy - 6, 6, 20, 3, col);
    vRect(cx + 13, cy - 6, 6, 20, 3, col);
    vStroke([cx - 19, cy - 2, cx - 19, cy + 14], INK, 2);
    vStroke([cx + 19, cy - 2, cx + 19, cy + 14], INK, 2);
  }
  if (style === "quiff") vEllRot(cx + look * 5, cy - 18, 11, 6, -look * 0.3, col, INK, 2);
  if (style === "spiky") {
    for (let i = -2; i <= 2; i++) vPoly([cx + i * 7 - 4, cy - 14, cx + i * 7 + look * 3, cy - 26 + Math.abs(i) * 2, cx + i * 7 + 4, cy - 14], col, INK, 1.8);
    vPath(top, col);
  }
  if (style === "messy") {
    vStroke([cx - 4, cy - 19, cx - 9, cy - 25], col, 3);
    vStroke([cx + 3, cy - 19, cx + 6, cy - 26], col, 3);
    vStroke([cx + 10, cy - 15, cx + 16, cy - 19], col, 3);
  }
  if (style === "swept") vPath(() => { ctx.moveTo(cx - look * 14, cy - 12); ctx.quadraticCurveTo(cx, cy - 22, cx + look * 16, cy - 8); }, null, dark(col, 0.25), 1.6);
  vEllRot(cx - 6, cy - 13, 5, 2, -0.3, hi);
}
function outfitBaseV(look, s, x, top, bottom, wt) {
  const o = look.outfit, body = s.body, acc = s.accent;
  const shirt = "#fbf8ee";
  if (o === "jacket" || o === "hivis" || o === "coat") {
    vPoly([x - 7, top, x + 7, top, x, top + 19], shirt, INK, 1.5);
    if (look.tie !== null) {
      const tie = look.tie || (s.id === "grant" ? acc : dark(body, 0.35));
      vPoly([x - 2.5, top + 3, x + 2.5, top + 3, x + 3.5, top + 18, x, top + 22, x - 3.5, top + 18], tie, INK, 1.2);
    }
    vStroke([x - 7, top, x - 3, top + 22], dark(body, 0.35), 2);
    vStroke([x + 7, top, x + 3, top + 22], dark(body, 0.35), 2);
    q(x + 2, top + 27, 3, 3, dark(body, 0.4));
    q(x + 2, top + 34, 3, 3, dark(body, 0.4));
    if (o === "hivis") {
      q(x - wt, top + 24, wt * 2, 5, acc);
      q(x - wt, top + 26, wt * 2, 1.4, "#e8e8e8");
      q(x - wt, top + 34, wt * 2, 5, acc);
      q(x - wt, top + 36, wt * 2, 1.4, "#e8e8e8");
    }
    if (o === "coat") {
      vRect(x - wt + 4, top + 14, 8, 8, 1, dark(body, 0.1), INK, 1.2);
      q(x - wt + 6, top + 9, 1.6, 7, "#22409a");
    }
  } else if (o === "hoodie") {
    vPath(() => { ctx.moveTo(x - 12, top + 1); ctx.quadraticCurveTo(x, top + 12, x + 12, top + 1); }, dark(body, 0.18), INK, 1.5);
    vStroke([x - 4, top + 6, x - 5, top + 18], "#f4f0e4", 1.6);
    vStroke([x + 4, top + 6, x + 5, top + 18], "#f4f0e4", 1.6);
    vRect(x - 11, bottom - 16, 22, 10, 3, dark(body, 0.1), INK, 1.4);
  } else if (o === "cardigan") {
    vPoly([x - 8, top, x + 8, top, x, top + 16], shirt, INK, 1.5);
    vStroke([x, top + 16, x, bottom], dark(body, 0.35), 1.6);
    [22, 29, 36].forEach(dy => vEll(x + 3, top + dy, 1.6, 1.6, lite(body, 0.4)));
  } else if (o === "tee") {
    vEll(x, top, 7, 4, s.skin, INK, 1.5);
    if (look.stripe) q(x - wt, top + 17, wt * 2, 5, acc);
    if (look.logo) {
      vRect(x - 8, top + 13, 16, 12, 3, acc, INK, 1.2);
      vPoly([x - 2, top + 16, x - 2, top + 22, x + 4, top + 19], "#ffffff");
    }
  } else if (o === "chef") {
    vPoly([x - 7, top, x + 7, top, x, top + 9], s.skin);
    vStroke([x - 7, top, x - 1, top + 12, x + 7, top], dark(body, 0.25), 1.6);
    [-5, 5].forEach(dx => [16, 24].forEach(dy => vEll(x + dx, top + dy, 1.6, 1.6, "#9a968c")));
    vRect(x - wt + 3, top + 22, wt * 2 - 6, bottom - top - 22, 2, acc, INK, 1.4);
    vStroke([x - wt + 4, top + 22, x - 6, top + 4], acc, 2);
    vStroke([x + wt - 4, top + 22, x + 6, top + 4], acc, 2);
  } else if (o === "overall") {
    vEll(x, top, 7, 4, "#f4f0e4", INK, 1.5);
    vRect(x - 11, top + 10, 22, bottom - top - 10, 3, dark(body, 0.1), INK, 1.4);
    vStroke([x - 9, top + 10, x - 13, top], dark(body, 0.25), 3);
    vStroke([x + 9, top + 10, x + 13, top], dark(body, 0.25), 3);
    vRect(x - 5, top + 16, 10, 8, 1, acc, INK, 1.2);
  } else if (o === "waistcoat") {
    vPoly([x - 10, top, x + 10, top, x + 5, top + 26, x - 5, top + 26], shirt, INK, 1.5);
    vPoly([x - 2, top + 2, x + 2, top + 2, x + 2.5, top + 14, x, top + 17, x - 2.5, top + 14], acc, INK, 1);
    [30, 36].forEach(dy => vEll(x, top + dy, 1.8, 1.8, acc, INK, 1));
  } else if (o === "turtleneck") {
    vRect(x - 9, top - 4, 18, 8, 3, lite(body, 0.12), INK, 1.5);
    vStroke([x - 7, top, x + 7, top], dark(body, 0.3), 1);
  } else if (o === "blouse") {
    vPoly([x - 8, top, x, top + 8, x - 2, top + 11, x - 10, top + 4], "#fbf8ee", INK, 1.2);
    vPoly([x + 8, top, x, top + 8, x + 2, top + 11, x + 10, top + 4], "#fbf8ee", INK, 1.2);
    if (look.brooch) vEll(x - 9, top + 16, 2.8, 2.8, acc, INK, 1);
    [16, 24, 32].forEach(dy => vEll(x, top + dy, 1.4, 1.4, lite(body, 0.45)));
  } else if (o === "tabard") {
    vEll(x, top, 7, 4, s.skin, INK, 1.5);
    q(x - wt, top + 18, wt * 2, 4, acc);
    q(x - wt, top + 28, wt * 2, 4, acc);
  } else if (o === "uniform") {
    vEll(x, top, 6, 3.5, "#d8d4c8", INK, 1.2);
    [-1, 1].forEach(s2 => {
      vRect(x + s2 * 9 - 5, top + 10, 10, 8, 1, dark(body, 0.12), INK, 1.2);
      q(x + s2 * (wt - 6) - 4, top + 1, 8, 3, acc);
    });
    [14, 22, 30, 38].forEach(dy => vEll(x, top + dy, 1.6, 1.6, acc));
  }
}



const HELD = ["clipboard", "envelope", "book", "joystick", "basket", "spool", "duck", "reel", "coin", "whistle", "badge", "megaphone", "teacup", "crate", "grant", "trophy", "quill", "tablet"];

/* Whatever someone is up to at their idle spot decides where their free hand goes.
   Their own icon and prop are never changed; this only adds a mug, a rod, a dart... */
function activityPlan(pr, P, by) {
  if (pr.phase !== "idle" || pr.target || !pr.activity || !pr.spot) return null;
  const kind = pr.activity, spot = pr.spot, L = P.look, x = P.x;
  if (kind === "kettle" || kind === "lounge" || (kind === "sofa" && pr.salt % 2 === 0) || (kind === "darts" && spot.waiting)) {
    return { kind: "mug", hx: x - L * 12, hy: by - 58 };
  }
  if (kind === "darts") {
    const thrown = !REDUCE && pr.throwT < 0.35;
    return thrown ? { kind: "thrown", hx: x + L * 18, hy: by - 86 } : { kind: "dart", hx: x - L * 12, hy: by - 104 };
  }
  if (kind === "rods") return { kind: "rod", hx: x - L * 20, hy: by - 56 };
  if (kind === "arcade" && !spot.watch) {
    const jig = REDUCE ? 0 : (((animT * 8 + pr.salt) | 0) % 2) * 3;
    return { kind: "arcade", hx: x + L * 8, hy: by - 62 + jig };
  }
  if (kind === "canteen") return { kind: "tray", hx: x - L * 6, hy: by - 54 };
  if (kind === "music") {
    if (spot.guitar) {
      const strum = REDUCE ? 0 : (((animT * 6) | 0) % 2);
      return { kind: "guitar", hx: x - L * 2, hy: by - 50 - strum * 4, x: x, by: by };
    }
    return { kind: "notes", x: x, by: by };
  }
  return null;
}

function drawMugV(cx, cy, band, L) {
  vRect(cx - 7, cy - 8, 14, 15, 3, "#f4f0e4", INK, 2);
  q(cx - 6, cy - 3, 12, 4, band);
  vArc(cx + L * 8, cy, 3.6, L > 0 ? -Math.PI / 2 : Math.PI / 2, L > 0 ? Math.PI / 2 : Math.PI * 1.5, INK, 2);
  vEll(cx, cy - 8, 6, 1.6, "#6b3d12");
  if (!REDUCE) {
    const s = (animT * 1.4 + cx * 0.07) % 1;
    vPath(() => { ctx.moveTo(cx - 1, cy - 11 - s * 8); ctx.quadraticCurveTo(cx + 4, cy - 16 - s * 8, cx, cy - 22 - s * 8); }, null, "rgba(255,255,255,0.7)", 2);
  }
}
function drawNoteV(x, y, col) {
  vEll(x, y, 4, 3, col, INK, 1.2);
  vStroke([x + 3.5, y, x + 3.5, y - 14], INK, 1.6);
  vStroke([x + 3.5, y - 14, x + 9, y - 10], INK, 1.6);
}

function drawActivity(pr) {
  const a = pr._act;
  if (!a) return;
  charBegin();
  const s = pr.staff, L = pr.facing === "l" ? -1 : 1;
  const band = s.accent || "#d1202f";
  if (a.kind === "mug") {
    drawMugV(a.hx - L * 9, a.hy - 2, band, L);
    drawHandV(a.hx, a.hy, armColour(s));
  } else if (a.kind === "dart") {
    vStroke([a.hx - L * 4, a.hy + 2, a.hx + L * 12, a.hy - 6], "#3a3a3a", 2.4);
    vPoly([a.hx + L * 12, a.hy - 6, a.hx + L * 18, a.hy - 9, a.hx + L * 13, a.hy - 4], "#c0c0c0");
    vPoly([a.hx - L * 4, a.hy + 2, a.hx - L * 11, a.hy - 2, a.hx - L * 9, a.hy + 6], "#d1202f", INK, 1);
  } else if (a.kind === "rod") {
    const tipX = a.hx - L * 58, tipY = a.hy - 66;
    vStroke([a.hx + L * 4, a.hy + 8, a.hx, a.hy], "#3d2a1c", 4);
    vStroke([a.hx, a.hy, tipX, tipY], "#5a5a5a", 2.4);
    vEll(a.hx - L * 6, a.hy - 4, 4, 4, "#c0c0c0", INK, 1.5);
    const bob = REDUCE ? 0 : Math.sin(animT * 2 + pr.salt) * 4;
    vStroke([tipX, tipY, tipX, tipY + 48 + bob], "rgba(240,240,240,0.9)", 1.2);
    vEll(tipX, tipY + 52 + bob, 4, 4.5, "#d1202f", INK, 1.2);
    q(tipX - 4, tipY + 52 + bob, 8, 2.5, "#f4f0e4");
    drawHandV(a.hx, a.hy, armColour(s));
  } else if (a.kind === "tray") {
    vRect(a.hx - 20, a.hy - 5, 40, 6, 2, "#d8d4c8", INK, 1.8);
    ["#f2c14e", "#e6b23a", "#f8d86a", "#e6b23a", "#f2c14e", "#f8d86a"].forEach((c, i) => q(a.hx - 14 + i * 3.4, a.hy - 13 + (i % 3) * 2, 3, 8, c));
    vEll(a.hx + 11, a.hy - 7, 4, 2.4, "#d1202f");
    drawHandV(a.hx, a.hy + 2, armColour(s));
  } else if (a.kind === "guitar" || a.kind === "notes") {
    if (a.kind === "guitar") {
      const gx = a.x - L * 4, gy = a.by - 50;
      vStroke([gx, gy, a.x + L * 34, a.by - 74], "#6b3d12", 5);
      vRect(a.x + L * 34 - 4, a.by - 82, 8, 10, 2, "#3d2a1c", INK, 1.5);
      vEll(gx - L * 6, gy + 4, 12, 10, "#7a1f2b", INK);
      vEll(gx + L * 6, gy - 2, 9, 8, "#7a1f2b", INK);
      vEll(gx - L * 6, gy + 4, 11, 9, "#7a1f2b");
      vEll(gx, gy + 1, 3.6, 3.6, "#1a1010");
      drawHandV(a.hx, a.hy, armColour(s));
    }
    if (!REDUCE) {
      const t = (animT * 0.7 + pr.salt * 0.37) % 1.6;
      if (t < 1.2) {
        const nx = a.x + sx(6) + Math.sin(t * 5) * sx(2), ny = a.by - sx(46) - t * sx(12);
        drawNoteV(nx, ny, t < 0.9 ? "#f2e6a0" : "#c4b880");
      }
    }
  }
  charEnd();
}

function drawBubble(pr) {
  if (!pr.bubble || pr.bubble.delay > 0 || pr.target || pr.phase !== "idle") return;
  const text = pr.bubble.text;
  const x = Math.round(pr.x);
  const sit = isSeated(pr);
  const top = Math.round(pr.y) + (sit ? SIT_DROP : 0) - (pr.staff.kind === "kenneth" || pr.staff.kind === "reggie" ? sx(60) : pr.staff.kind === "terry" || pr.staff.kind === "keith" ? sx(56) : sx(50));
  const w = labelWidth(text) + 10, h = 20;
  let bx = Math.round(x - w / 2);
  bx = Math.max(sx(4), Math.min(W - w - sx(4), bx));
  box(bx, top - h, w, h, "#fffdf7", "#141414");
  p(x - 3, top - 3, 9, 6, "#fffdf7");
  p(x - 6, top, 3, 6, "#141414");
  p(x + 6, top, 3, 6, "#141414");
  p(x - 3, top + 6, 9, 3, "#141414");
  drawLabel(bx + w / 2, top - h + 3, text, "#141414");
}

function drawPerson(pr) {
  const s = pr.staff;
  pr._act = null;
  charBegin();
  if (s.kind === "terry" || s.kind === "reggie") drawRobot(pr);
  else if (s.kind === "kenneth") drawKenneth(pr);
  else if (s.kind === "keith") drawKeith(pr);
  else drawSpecialist(pr);
  charEnd();
}

/* Work out both hands: walking swing, the prop hand, an activity, or both up to celebrate. */
function handsFor(pr, P, by, held, act, opts) {
  const o = opts || {};
  const x = P.x, L = P.look, reach = o.reach || 19, rest = o.rest || 46;
  const hands = {};
  [-1, 1].forEach(sd => {
    const k = -sd * P.swing;
    let hx = x + sd * reach + L * k * 8, hy = by - rest + Math.abs(k) * 1.5;
    if (sd === L && held) { hx = x + L * (reach + 2); hy = by - rest - 6; }
    if (sd === -L && act && act.hx !== undefined) { hx = act.hx; hy = act.hy; }
    if (P.cele) { hx = x + sd * (reach + 5); hy = by - (o.up || 116) - Math.min(P.jump, 12); }
    hands[sd] = [hx, hy];
  });
  return hands;
}

/* ---------- Each bot's look, taken from their own icon ----------
   ov = colours that differ from the STAFF entry (STAFF itself is unchanged). */
const LOOKS = {
  boris: { ov: { body: "#1e2a48", hair: "#4a2c14" }, hair: "side", outfit: "jacket", tie: null, hat: "postcap", tache: true, strap: true, piping: "#c4202a" },
  tweety: { bird: true },
  percy: { ov: { body: "#3a5a2a", hair: "#5a3a20" }, hair: "side", outfit: "cardigan", glasses: true, beard: true, bow: "#2f5a2a" },
  george: { ov: { body: "#a8322e", hair: "#4a3020", skin: "#dcae86" }, hair: "short", outfit: "plaidvest", stubble: true, vestC: "#f08a1c" },
  archie: { ov: { body: "#6a3fd0", hair: "#14121a" }, hair: "quiff", outfit: "jacketopen", shirt: "#141418", zig: "#26b8e8", streak: true, grin: true },
  brian: { ov: { body: "#1c1c20", hair: "#3a2010" }, hair: "crew", outfit: "hoodie", hat: "beanie", stubble: true, grin: true },
  clive: { cloud: true },
  frank: { ov: { hair: "#c8602a" }, hair: "short", outfit: "chef", hat: "chefhat", bignose: true, grin: true, wide: 1.06, pin: true, cheeks: true },
  filament: { ov: { hair: "#7a4a22" }, hair: "messy", outfit: "overall", goggles: true, freckles: true },
  oddly: { ov: { body: "#7a5030", hair: "#dcd8d4" }, hair: "wild", outfit: "waistcoat", bow: "#8a2a3a", monocle: true, bignose: true, vestC: "#b0583a", watch: true },
  rupert: { ov: { body: "#1a1618", hair: "#4a2410" }, hair: "curly", outfit: "jacket", tie: null, hat: "beret", scarf: "#7a1f30", camera: true, goatee: true, tache: true },
  penny: { ov: { body: "#1f6a40", hair: "#8a3a1a" }, hair: "bun", outfit: "cardigan", glasses: true, brooch: true, shirt: "#14402a" },
  sheila: { ov: { body: "#1f8a8c", hair: "#2a1a14" }, hair: "curly", outfit: "blazer", shirt: "#2aa6a6" },
  sarge: { ov: { body: "#1a2240", hair: "#2a1a14" }, hair: "crew", outfit: "uniform", hat: "helmet", stern: true, tache: true, bignose: true, chevrons: true },
  mona: { ov: { body: "#2878b8", hair: "#4a2410" }, hair: "bigcurl", outfit: "blazer", shirt: "#e8782a", scarf: "#2aa6a6", earring: true, grin: true },
  hettie: { ov: { body: "#8a5a3a", hair: "#a09c96" }, hair: "bun", outfit: "apron" },
  stockley: { ov: { body: "#c8a574", hair: "#c07030" }, hair: "quiff", outfit: "coat", plaid: "#8a2a2a", grin: true, wide: 1.1 },
  grant: { ov: { body: "#6a4a2a", hair: "#3a2414" }, hair: "side", outfit: "jacket", tie: null, bow: "#3a2a1a", vestC: "#4a3220", stern: true },
  vinnie: { ov: { body: "#1c1c20", hair: "#16120e" }, hair: "spiky", outfit: "jacketopen", shirt: "#c4202a", earring: true, grin: true, bold: true }
};

function hairBackV(style, cx, cy, col, look, back) {
  if (style === "bob") {
    vRect(cx - 19, cy - 12, 38, 30, 10, col, INK);
  } else if (style === "ponytail") {
    const px = back ? cx : cx - look * 15;
    vEllRot(px, cy + 8, 6, 14, back ? 0 : look * 0.35, col, INK);
    vEll(px, cy - 4, 3.5, 2.5, "#d1202f", INK, 1.2);
  } else if (style === "bun") {
    vEll(cx - (back ? 0 : look * 3), cy - 20, 8, 7, col, INK);
  } else if (style === "bigcurl") {
    [[-20, -4], [20, -4], [-21, 8], [21, 8], [-16, 16], [16, 16]].forEach(([dx, dy]) => vEll(cx + dx, cy + dy, 8, 8, col, INK, 2));
  } else if (style === "wild") {
    [[-20, 0], [20, 0], [-19, -9], [19, -9]].forEach(([dx, dy]) => vEllRot(cx + dx, cy + dy, 8, 5, dx < 0 ? -0.5 : 0.5, col, INK, 2));
  }
}
function hairFrontV(style, cx, cy, col, look) {
  if (style === "bigcurl") {
    [[-17, -6], [-12, -16], [-4, -21], [5, -21], [13, -16], [18, -6], [0, -13], [-9, -10], [9, -10]].forEach(([dx, dy]) => vEll(cx + dx, cy + dy, 8, 8, col, INK, 2));
    [[-12, -16], [-4, -21], [5, -21], [13, -16], [0, -13], [-9, -10], [9, -10]].forEach(([dx, dy]) => vEll(cx + dx, cy + dy, 6.6, 6.6, col));
    vEll(cx - 6, cy - 19, 2.6, 1.8, lite(col, 0.25));
    return;
  }
  if (style === "wild") {
    for (let i = -3; i <= 3; i++) {
      const a = -Math.PI / 2 + i * 0.42;
      vPoly([cx + Math.cos(a - 0.2) * 14, cy - 3 + Math.sin(a - 0.2) * 15, cx + Math.cos(a) * 29, cy - 3 + Math.sin(a) * 31, cx + Math.cos(a + 0.2) * 14, cy - 3 + Math.sin(a + 0.2) * 15], col, INK, 1.8);
    }
    vPath(() => { ctx.ellipse(cx, cy - 1, 17.5, 18, 0, Math.PI, Math.PI * 2); ctx.lineTo(cx + 17.5, cy - 4); ctx.quadraticCurveTo(cx, cy - 12, cx - 17.5, cy - 4); ctx.closePath(); }, col);
    vEllRot(cx - 6, cy - 14, 5, 2, -0.3, lite(col, 0.3));
    return;
  }
  hairFrontBaseV(style, cx, cy, col, look);
}
function hairBackOfHeadV(style, cx, cy, col) {
  /* Seen from behind: hair covers most of the head. */
  if (style === "crew") {
    vPath(() => { ctx.ellipse(cx, cy, 16.5, 17.5, 0, Math.PI * 0.95, Math.PI * 2.05); ctx.closePath(); }, lite(col, 0.08), INK, 2);
  } else if (style === "bob") {
    vRect(cx - 19, cy - 18, 38, 34, 12, col, INK);
  } else if (style === "curly" || style === "bigcurl") {
    const big = style === "bigcurl";
    [[-12, -8], [0, -14], [12, -8], [-13, 4], [13, 4], [-6, 6], [6, 6], [0, -2]].forEach(([dx, dy]) => vEll(cx + dx * (big ? 1.25 : 1), cy + dy * (big ? 1.2 : 1), big ? 9 : 7.5, big ? 9 : 7.5, col, INK, 2));
    [[-12, -8], [0, -14], [12, -8], [-6, 6], [6, 6], [0, -2]].forEach(([dx, dy]) => vEll(cx + dx * (big ? 1.25 : 1), cy + dy * (big ? 1.2 : 1), big ? 7.6 : 6, big ? 7.6 : 6, col));
  } else if (style === "wild") {
    for (let i = -3; i <= 3; i++) {
      const a = -Math.PI / 2 + i * 0.4;
      vPoly([cx + Math.cos(a - 0.22) * 14, cy + Math.sin(a - 0.22) * 15, cx + Math.cos(a) * 29, cy + Math.sin(a) * 30, cx + Math.cos(a + 0.22) * 14, cy + Math.sin(a + 0.22) * 15], col, INK, 1.8);
    }
    vEll(cx, cy, 17.5, 18, col, INK);
  } else {
    vPath(() => { ctx.ellipse(cx, cy - 1, 17.5, 18.5, 0, Math.PI * 0.9, Math.PI * 2.1); ctx.quadraticCurveTo(cx, cy + 14, cx - 17, cy + 5); ctx.closePath(); }, col, INK, 2);
  }
  vEllRot(cx - 6, cy - 9, 6, 2.5, -0.4, lite(col, 0.2));
}

/* Hats from the icons: postman's cap, beanie, chef's toque, beret, custodian helmet. */
function drawHatV(kind, cx, cy, L, back) {
  if (kind === "postcap") {
    vPath(() => { ctx.moveTo(cx - 17.5, cy - 8); ctx.quadraticCurveTo(cx - 20, cy - 28, cx, cy - 28); ctx.quadraticCurveTo(cx + 20, cy - 28, cx + 17.5, cy - 8); ctx.closePath(); }, "#1e2a48", INK);
    vEll(cx - 7, cy - 21, 6, 3, "rgba(255,255,255,0.18)");
    vRect(cx - 18, cy - 14, 36, 7, 2.5, "#141e38", INK, 1.8);
    if (!back) {
      vEllRot(cx + L * 11, cy - 7, 11, 3.4, 0, "#101830", INK, 1.8);
      vEll(cx + L * 2, cy - 10.5, 3.4, 3.4, "#c4202a", INK, 1.2);
    }
  } else if (kind === "beanie") {
    vPath(() => { ctx.moveTo(cx - 18, cy - 4); ctx.quadraticCurveTo(cx - 20, cy - 29, cx, cy - 29); ctx.quadraticCurveTo(cx + 20, cy - 29, cx + 18, cy - 4); ctx.closePath(); }, "#26262a", INK);
    vRect(cx - 18.5, cy - 11, 37, 8, 3, "#34343a", INK, 1.8);
    for (let i = -14; i <= 14; i += 5) vStroke([cx + i, cy - 10, cx + i, cy - 5], "#1a1a1e", 1);
    vEll(cx - 7, cy - 22, 6, 3, "rgba(255,255,255,0.14)");
  } else if (kind === "chefhat") {
    vRect(cx - 16, cy - 20, 32, 9, 3, "#fdfcf8", INK, 1.8);
    [[-9, -27, 9.5], [9, -27, 9.5], [0, -33, 10.5]].forEach(([dx, dy, r]) => vEll(cx + dx, cy + dy, r, r, "#fdfcf8", INK, 1.8));
    [[-9, -27, 8.2], [9, -27, 8.2], [0, -33, 9.2]].forEach(([dx, dy, r]) => vEll(cx + dx, cy + dy, r, r, "#fdfcf8"));
    vRect(cx - 15, cy - 19, 30, 7, 2.5, "#fdfcf8");
    vStroke([cx - 5, cy - 31, cx - 6, cy - 22], "#e8e4d8", 1.2);
    vStroke([cx + 6, cy - 30, cx + 7, cy - 22], "#e8e4d8", 1.2);
    vRect(cx - 15, cy - 14, 30, 3, 1, "#e4e0d2");
  } else if (kind === "beret") {
    vEllRot(cx + L * 3, cy - 16, 21, 9, -L * 0.12, "#1a1618", INK);
    vEllRot(cx + L * 3 - 5, cy - 19, 9, 3, -L * 0.12, "rgba(255,255,255,0.14)");
    vStroke([cx + L * 3, cy - 25, cx + L * 3, cy - 28], "#1a1618", 2.4);
    vPath(() => { ctx.moveTo(cx - 17, cy - 10); ctx.quadraticCurveTo(cx, cy - 5, cx + 17, cy - 10); }, null, "#3a3236", 3);
  } else if (kind === "helmet") {
    vPath(() => { ctx.moveTo(cx - 18, cy - 8); ctx.quadraticCurveTo(cx - 21, cy - 31, cx, cy - 33); ctx.quadraticCurveTo(cx + 21, cy - 31, cx + 18, cy - 8); ctx.closePath(); }, "#14182a", INK);
    vStroke([cx, cy - 33, cx, cy - 9], "#2a3050", 2.4);
    vEll(cx - 8, cy - 24, 5, 2.6, "rgba(255,255,255,0.18)");
    vEllRot(cx, cy - 8, 20, 4, 0, "#0e1220", INK, 1.8);
    vEll(cx, cy - 36, 3, 3, "#d8d8d8", INK, 1.4);
    if (!back) {
      vEll(cx + L * 1, cy - 19, 5, 5.4, "#d8d8d8", INK, 1.4);
      vEll(cx + L * 1, cy - 19, 2.4, 2.4, "#8a8a92");
    }
  }
}

/* Torso extras: bow ties, scarves, satchel strap, camera, vest, plaid, chevrons. */
function torsoExtrasV(look, s, x, top, bottom, wt, L) {
  if (look.plaid) {
    for (let i = -wt; i <= wt; i += 7) q(x + i, top, 1.6, bottom - top, look.plaid);
    for (let j = top + 4; j < bottom; j += 7) q(x - wt, j, wt * 2, 1.6, look.plaid);
  }
  if (look.vestC && look.outfit !== "waistcoat" && look.outfit !== "plaidvest") {
    vPoly([x - 9, top + 1, x + 9, top + 1, x + 6, bottom, x - 6, bottom], look.vestC, INK, 1.4);
    [18, 26, 34].forEach(dy => vEll(x, top + dy, 1.6, 1.6, dark(look.vestC, 0.4)));
  }
  if (look.strap) {
    vStroke([x - wt + 3, top + 3, x + wt - 3, bottom - 8], INK, 6);
    vStroke([x - wt + 3, top + 3, x + wt - 3, bottom - 8], "#8a5a30", 3.4);
    vRect(x + wt - 10, bottom - 16, 13, 12, 2, "#7a4a28", INK, 1.5);
    vRect(x + wt - 10, bottom - 16, 13, 4, 1.5, "#8a5a30", INK, 1.2);
  }
  if (look.camera) {
    vStroke([x - 9, top, x - 5, top + 20], "#2a2a2a", 2.4);
    vStroke([x + 9, top, x + 5, top + 20], "#2a2a2a", 2.4);
    vRect(x - 9, top + 20, 18, 12, 2.5, "#2e2e32", INK, 1.5);
    vRect(x - 9, top + 20, 18, 4, 1.5, "#b8b8b8", INK, 1);
    vEll(x, top + 27, 4.6, 4.6, "#1a1a1e", INK, 1.5);
    vEll(x - 1, top + 26, 1.4, 1.4, "#8ec8e6");
  }
  if (look.chevrons) {
    [-1, 1].forEach(sd => [0, 4, 8].forEach(dy => vStroke([x + sd * (wt - 2) - 4, top + 5 + dy, x + sd * (wt - 2), top + 8 + dy, x + sd * (wt - 2) + 4, top + 5 + dy], "#f4f0e4", 1.6)));
    vEll(x - L * 9, top + 17, 3.6, 3.6, "#d8d8d8", INK, 1.2);
  }
  if (look.scarf) {
    const c = look.scarf, multi = s.id === "mona";
    vRect(x - 11, top - 4, 22, 9, 4.5, c, INK, 1.6);
    vPoly([x + 1, top + 3, x + 11, top + 3, x + 13, top + 24, x + 4, top + 26], c, INK, 1.6);
    if (multi) { [["#f2c200", 9], ["#d1202f", 15], ["#e8782a", 21]].forEach(([cc, dy]) => q(x + 2, top + dy, 11, 2.6, cc)); }
    else q(x + 2, top + 22, 11, 2, dark(c, 0.3));
  }
  if (look.bow) {
    vPoly([x, top + 3, x - 9, top - 2, x - 9, top + 8], look.bow, INK, 1.4);
    vPoly([x, top + 3, x + 9, top - 2, x + 9, top + 8], look.bow, INK, 1.4);
    vEll(x, top + 3, 2.6, 2.6, dark(look.bow, 0.25), INK, 1.2);
  }
  if (look.watch) {
    vStroke([x + 6, top + 22, x + 2, top + 28, x - 6, top + 30], "#d4af37", 1.4);
    vEll(x - 7, top + 31, 3.6, 3.6, "#f4efe0", INK, 1.4);
  }
}

function outfitDetailsV(look, s, x, top, bottom, wt) {
  const o = look.outfit, body = s.body, acc = s.accent;
  if (o === "plaidvest") {
    for (let i = -wt; i <= wt; i += 7) q(x + i, top, 1.8, bottom - top, dark(body, 0.4));
    for (let j = top + 3; j < bottom; j += 7) q(x - wt, j, wt * 2, 1.8, dark(body, 0.4));
    vPoly([x - 8, top, x + 8, top, x, top + 8], "#7a1f1c", INK, 1.2);
    [-1, 1].forEach(sd => {
      vPoly([x + sd * 4, top, x + sd * (wt + 1), top, x + sd * (wt + 1), bottom, x + sd * 4, bottom], look.vestC, INK, 1.6);
      [24, 34].forEach(dy => { q(x + sd * 4 - (sd < 0 ? wt - 3 : 0), top + dy, wt - 3, 5, "#d8dce0"); });
    });
    return;
  }
  if (o === "jacketopen") {
    vPoly([x - 9, top, x + 9, top, x + 7, bottom, x - 7, bottom], look.shirt, INK, 1.4);
    [-1, 1].forEach(sd => {
      vStroke([x + sd * 9, top, x + sd * 7, bottom], dark(body, 0.4), 2.2);
      if (look.zig) {
        vStroke([x + sd * 12, top + 4, x + sd * 17, top + 12, x + sd * 12, top + 20, x + sd * 17, top + 28, x + sd * 12, top + 36], look.zig, 3);
        q(x + sd * 14 - 2, top + 8, 4, 1.6, "#f2c200"); q(x + sd * 14 - 0.8, top + 6.8, 1.6, 4, "#f2c200");
      }
    });
    if (look.zig) vEll(x - wt + 5, top + 5, 2.2, 2.2, "#e23d8a");
    return;
  }
  if (o === "blazer") {
    vPoly([x - 10, top, x + 10, top, x + 6, bottom, x - 6, bottom], look.shirt, INK, 1.4);
    vPoly([x - 9, top - 1, x - 2, top + 1, x - 5, top + 8], lite(look.shirt, 0.25), INK, 1.2);
    vPoly([x + 9, top - 1, x + 2, top + 1, x + 5, top + 8], lite(look.shirt, 0.25), INK, 1.2);
    [-1, 1].forEach(sd => vStroke([x + sd * 10, top, x + sd * 6, top + 26, x + sd * 5, bottom], dark(body, 0.4), 2.2));
    [16, 24].forEach(dy => vEll(x, top + dy, 1.5, 1.5, dark(look.shirt, 0.3)));
    return;
  }
  if (o === "apron") {
    vPoly([x - 8, top, x + 8, top, x, top + 14], "#fbf8ee", INK, 1.4);
    vStroke([x, top + 14, x, bottom], dark(body, 0.35), 1.6);
    vRect(x - wt + 5, top + 12, wt * 2 - 10, bottom - top - 12, 3, "#f1e8d6", INK, 1.5);
    vStroke([x - wt + 7, top + 12, x - 8, top + 1], "#f1e8d6", 2.4);
    vStroke([x + wt - 7, top + 12, x + 8, top + 1], "#f1e8d6", 2.4);
    [[-8, 18, "#c4503a"], [6, 22, "#d98a3a"], [-2, 28, "#7a9a5a"], [8, 32, "#c4503a"], [-9, 34, "#d98a3a"], [0, 38, "#c4503a"]].forEach(([dx, dy, c]) => {
      vEll(x + dx, top + dy, 2.6, 2.6, c);
      vEll(x + dx, top + dy, 0.9, 0.9, "#f2e6a0");
    });
    return;
  }
  if (o === "chef" && look.pin) {
    vPoly([x - 7, top, x + 7, top, x, top + 9], s.skin);
    vStroke([x - 7, top, x - 1, top + 12, x + 7, top], dark("#f4f0e4", 0.25), 1.6);
    [-5, 5].forEach(dx => [16, 24].forEach(dy => vEll(x + dx, top + dy, 1.6, 1.6, "#9a968c")));
    vRect(x - wt + 3, top + 22, wt * 2 - 6, bottom - top - 22, 2, "#fdfcf8", INK, 1.4);
    for (let i = -wt + 6; i < wt - 4; i += 5) q(x + i, top + 23, 2.4, bottom - top - 24, "#2a4a8a");
    vStroke([x - wt + 4, top + 22, x - 6, top + 4], "#2a4a8a", 2.4);
    vStroke([x + wt - 4, top + 22, x + 6, top + 4], "#2a4a8a", 2.4);
    return;
  }
  if (o === "cardigan" && look.shirt) {
    vPoly([x - 8, top, x + 8, top, x, top + 16], look.shirt, INK, 1.5);
    vStroke([x, top + 16, x, bottom], dark(body, 0.35), 1.6);
    [22, 29, 36].forEach(dy => vEll(x + 3, top + dy, 1.6, 1.6, lite(body, 0.4)));
    return;
  }
  if (o === "waistcoat" && look.vestC) {
    vPoly([x - 10, top, x + 10, top, x + 5, top + 26, x - 5, top + 26], look.vestC, INK, 1.5);
    vPath(() => { ctx.moveTo(x - 10, top); ctx.quadraticCurveTo(x - 2, top + 14, x - 5, top + 26); }, null, dark(look.vestC, 0.35), 1.4);
    [30, 36].forEach(dy => vEll(x, top + dy, 1.8, 1.8, "#d4af37", INK, 1));
    return;
  }
  outfitBaseV(look, s, x, top, bottom, wt);
}

function facialExtrasV(look, s, cx, ey, lk) {
  const shift = lk * 2;
  if (look.freckles) [[-8, 6], [-5, 8], [-11, 8], [6, 6], [9, 8], [12, 6]].forEach(([dx, dy]) => q(cx + dx + shift, ey + dy, 1.2, 1.2, "rgba(150, 90, 50, 0.6)"));
  if (look.bignose) {
    vEll(cx + shift + lk * 1, ey + 6, 4.6, 4.2, dark(s.skin, 0.04), dark(s.skin, 0.32), 1.4);
    vEll(cx + shift + lk * 0.4, ey + 4.6, 1.6, 1.1, lite(s.skin, 0.35));
  }
  if (look.tache) {
    const big = look.stern || s.id === "boris" ? 1 : 0.85, ww = s.id === "sarge" ? 11 : 8;
    vPath(() => { ctx.moveTo(cx + shift - ww, ey + 10); ctx.quadraticCurveTo(cx + shift - ww * 0.4, ey + 6.5 * big, cx + shift, ey + 8.6); ctx.quadraticCurveTo(cx + shift + ww * 0.4, ey + 6.5 * big, cx + shift + ww, ey + 10); ctx.quadraticCurveTo(cx + shift + ww * 0.5, ey + 12, cx + shift, ey + 10); ctx.quadraticCurveTo(cx + shift - ww * 0.5, ey + 12, cx + shift - ww, ey + 10); }, s.hair, INK, 1.3);
  }
  if (look.goatee) vPath(() => { ctx.moveTo(cx + shift - 4, ey + 12); ctx.quadraticCurveTo(cx + shift, ey + 14, cx + shift + 4, ey + 12); ctx.lineTo(cx + shift + 1.6, ey + 21); ctx.lineTo(cx + shift - 1.6, ey + 21); ctx.closePath(); }, s.hair, INK, 1.3);
  if (look.beard) vPath(() => { ctx.moveTo(cx - 15, ey + 1); ctx.quadraticCurveTo(cx - 13, ey + 19, cx, ey + 20); ctx.quadraticCurveTo(cx + 13, ey + 19, cx + 15, ey + 1); ctx.quadraticCurveTo(cx + 10, ey + 12, cx + shift, ey + 13); ctx.quadraticCurveTo(cx - 10, ey + 12, cx - 15, ey + 1); }, s.hair, INK, 1.5);
  if (look.stubble) for (let i = -9; i <= 9; i += 3) for (let j = 0; j < 2; j++) q(cx + i + shift + j * 1.5, ey + 13 + Math.abs(i) * -0.2 + j * 2.5, 1.2, 1.2, "rgba(50, 50, 50, 0.5)");
  if (look.glasses) {
    [-1, 1].forEach(sd => vEll(cx + sd * 7 + shift, ey, 5.8, 5.6, "rgba(220, 235, 245, 0.18)", INK, 1.8));
    vStroke([cx - 1.4 + shift, ey - 1, cx + 1.4 + shift, ey - 1], INK, 1.8);
    vStroke([cx - 13 + shift, ey - 1, cx - 16, ey - 2], INK, 1.6);
    vStroke([cx + 13 + shift, ey - 1, cx + 16, ey - 2], INK, 1.6);
  }
  if (look.monocle) {
    const mx = cx + 7 + shift;
    vArc(mx, ey, 7, 0, Math.PI * 2, "#d4af37", 2);
    vEll(mx - 2.5, ey - 2.5, 2.2, 1.3, "rgba(255,255,255,0.6)");
    vPath(() => { ctx.moveTo(mx + 5, ey + 5); ctx.quadraticCurveTo(mx + 14, ey + 20, mx + 6, ey + 34); }, null, "#d4af37", 1);
  }
  if (look.goggles) {
    vStroke([cx - 17, ey - 13, cx + 17, ey - 13], "#2a2a2a", 3.4);
    [-1, 1].forEach(sd => { vEll(cx + sd * 8 + shift, ey - 14, 6, 4.6, "#8ec8e6", INK, 1.8); vEll(cx + sd * 8 + shift - 2, ey - 15.5, 2, 1.2, "rgba(255,255,255,0.7)"); });
  }
  if (look.cheeks) [-1, 1].forEach(sd => vEll(cx + sd * 11 + shift, ey + 6, 4.2, 2.6, "rgba(235, 100, 90, 0.4)"));
}


/* ---------- Tweety: a yellow chick with a blue neckerchief ---------- */
function drawTweety(pr, P, by0, act0) {
  const x = P.x, L = P.look;
  const yel = "#f6d21c", yelL = "#ffe86a", yelD = "#d8a812", wing = "#8a8a2a", beak = "#f08a2a";
  const back = !!P.work;
  const y0 = back ? P.y : by0;
  const hc = back ? y0 - 56 : y0 - 80;
  /* feet and legs */
  if (!back) {
    const order = L > 0 ? [-1, 1] : [1, -1];
    order.forEach(sd => {
      const k = sd * P.swing, dx = L * k * 8, lift = P.moving ? Math.max(0, k) * 4 : 0;
      if (P.sit) return;
      const fx = x + sd * 7 + dx, fy = P.y - 3 - lift;
      vStroke([x + sd * 7, P.y - 22, fx, fy - 1], beak, 3.4);
      vPath(() => { ctx.moveTo(fx - 6, fy + 2); ctx.lineTo(fx, fy - 2); ctx.lineTo(fx + 6, fy + 2); ctx.moveTo(fx, fy - 2); ctx.lineTo(fx + L * 1, fy + 3); }, null, beak, 2.4);
    });
  }
  /* tail feathers */
  const tb = back ? y0 - 10 : y0 - 30;
  [0, 1, 2].forEach(i => vEllRot(x - L * (back ? 0 : 20) + (back ? (i - 1) * 9 : 0), tb + (back ? 12 : 4 + i * 4), back ? 4.4 : 11, back ? 11 : 4.4, back ? (i - 1) * 0.5 : -L * (0.5 - i * 0.5), wing, INK, 1.6));
  /* body */
  const bodyC = back ? y0 - 24 : y0 - 42;
  vEll(x, bodyC, 20, back ? 22 : 24, yel, INK);
  if (!back) {
    vEll(x + L * 3, bodyC + 5, 13, 16, yelL);
    vEll(x - 6, bodyC - 12, 7, 4, "rgba(255,255,255,0.35)");
    /* neckerchief */
    vPoly([x - 12, hc + 17, x + 12, hc + 17, x + 1, hc + 32], "#2a70c8", INK, 1.6);
    vEll(x + L * 1, hc + 18, 11, 4.2, "#2a70c8", INK, 1.6);
    vStroke([x - 3, hc + 22, x - 1, hc + 27], "#6aa4e8", 1.2);
  } else {
    vEll(x - 6, bodyC - 12, 7, 4, "rgba(255,255,255,0.3)");
  }
  /* head */
  const hr = 21;
  vEll(x, hc, hr + 1, hr, yel, INK);
  vEll(x - 7, hc - 9, 8, 4, "rgba(255,255,255,0.35)");
  if (!back) {
    vEll(x + 8, hc + 6, 12, 14, yelD);
    vEll(x, hc + 2, hr - 1, hr - 2, yel);
    vEll(x + 8, hc + 8, 8, 10, "rgba(216,168,18,0.35)");
  }
  /* head tuft */
  [-1, 0, 1].forEach(i => vPath(() => { ctx.moveTo(x + i * 4 - 2, hc - hr + 3); ctx.quadraticCurveTo(x + i * 6 + L * 3, hc - hr - 8 - (i === 0 ? 3 : 0), x + i * 7 + 3, hc - hr + 2); ctx.closePath(); }, yel, INK, 1.5));
  if (!back) {
    const shift = L * 2;
    [-1, 1].forEach(sd => {
      const ex = x + sd * 8 + shift, ey = hc - 2;
      vEll(ex, ey, 5.2, 7, "#fffef8", INK, 1.6);
      vEll(ex + L * 1.5 + (P.glance ? L * 0.6 : 0), ey + (P.glance ? 1.5 : 0.5), 3.5, 5, "#0e0a08");
      vEll(ex + L * 1.5 - 1.2, ey - 2.2, 1.5, 1.5, "#ffffff");
      [-1, 0, 1].forEach(i => vStroke([ex + sd * 4.4, ey - 4 + i * 2.6, ex + sd * (8 + (i === 0 ? 1 : 0)), ey - 6 + i * 3.4], INK, 1.3));
    });
    vEll(x - 14 + shift, hc + 7, 4.6, 3, "rgba(240, 120, 70, 0.45)");
    vEll(x + 14 + shift, hc + 7, 4.6, 3, "rgba(240, 120, 70, 0.45)");
    const bx = x + L * 3 + shift;
    if (P.cele) {
      vPoly([bx - 7, hc + 5, bx + 7, hc + 5, bx, hc + 19], "#e07a20", INK, 1.5);
      vPoly([bx - 5, hc + 8, bx + 5, hc + 8, bx, hc + 17], "#8a2a20");
    } else {
      vPoly([bx - 8, hc + 6, bx + 8, hc + 6, bx + L * 2, hc + 16], beak, INK, 1.6);
      vStroke([bx - 6, hc + 9, bx + 6, hc + 9], "#c8641a", 1.2);
    }
    if (P.glance) drawSweat(x + (P.left ? -24 : 24), hc - 16);
  }
  /* wings as arms */
  let hands;
  let act = null;
  if (back) {
    const tap = (!REDUCE && ((pr.typeT * 6 | 0) % 2)) ? 3 : 0;
    [-1, 1].forEach(sd => {
      vLimb([x + sd * 16, y0 - 34, x + sd * 27, y0 - 32 + (sd > 0 ? tap : 0)], 9, wing, INK);
      vEll(x + sd * 27, y0 - 32 + (sd > 0 ? tap : 0), 4.2, 3.8, yel, INK, 1.5);
    });
    return null;
  }
  act = activityPlan(pr, P, by0);
  hands = handsFor(pr, P, by0, false, act, { rest: 40, up: 100 });
  [-L, L].forEach(sd => {
    const hx = hands[sd][0], hy2 = hands[sd][1];
    drawArmV(x + sd * 17, by0 - 56, hx, hy2, wing, wing, { noHand: true, w: 9 });
    vEll(hx, hy2, 4.6, 4.2, yel, INK, 1.6);
    vEll(hx + sd * 2.4, hy2 + 2, 2, 2.6, yel, INK, 1.2);
  });
  return act;
}

/* ---------- Clive: a friendly little cloud who vapes (from his icon) ---------- */
function drawClive(pr, P, by0) {
  const x = P.x, L = P.look, back = !!P.work;
  const white = "#fdfeff", shade = "#cfdbe8", shade2 = "#b4c6d8";
  const cl = (cx, cy, r) => { vEll(cx, cy, r, r * 0.92, white, INK, 2); };
  const clFill = (cx, cy, r) => { vEll(cx, cy, r - 1.2, r * 0.92 - 1.2, white); };
  const y0 = back ? P.y : by0;
  const bodyC = back ? y0 - 24 : y0 - 54, headC = back ? y0 - 58 : y0 - 92;
  if (!back) {
    const order = L > 0 ? [-1, 1] : [1, -1];
    if (!P.sit) order.forEach(sd => {
      const k = sd * P.swing, dx = L * k * 8, lift = P.moving ? Math.max(0, k) * 4 : 0;
      const fx = x + sd * 8 + dx, fy = P.y - 5 - lift;
      vLimb([x + sd * 8, P.y - 34, fx, fy], 8, "#9fb0bd", INK);
      vEll(fx + L * 3, fy + 3, 8, 4.2, "#f4f6fa", INK, 2);
    });
  }
  /* puffy body */
  const body = [[-18, 0, 14], [18, 0, 14], [-10, 14, 14], [10, 14, 14], [0, -8, 18], [0, 8, 18], [-20, -14, 10], [20, -14, 10]];
  body.forEach(([dx, dy, r]) => cl(x + dx, bodyC + dy, r));
  body.forEach(([dx, dy, r]) => clFill(x + dx, bodyC + dy, r));
  vEll(x + 12, bodyC + 12, 14, 12, shade);
  vEll(x - 8, bodyC - 12, 9, 4, "rgba(255,255,255,0.9)");
  /* head puffs */
  const head = [[-16, 4, 13], [16, 4, 13], [-9, -10, 14], [9, -10, 14], [0, -4, 18], [0, 8, 14]];
  head.forEach(([dx, dy, r]) => cl(x + dx, headC + dy, r));
  head.forEach(([dx, dy, r]) => clFill(x + dx, headC + dy, r));
  vEll(x + 12, headC + 6, 11, 11, shade);
  vEll(x - 6, headC - 4, 14, 14, white);
  vEll(x - 9, headC - 15, 7, 3.5, "rgba(255,255,255,0.9)");
  /* wisp of steam */
  const wob = REDUCE ? 0 : Math.sin(animT * 2) * 2;
  vPath(() => { ctx.moveTo(x - 1, headC - 24); ctx.quadraticCurveTo(x + 6 + wob, headC - 30, x + 1, headC - 36); ctx.quadraticCurveTo(x - 3, headC - 40, x + 2 + wob, headC - 43); }, null, INK, 3.6);
  vPath(() => { ctx.moveTo(x - 1, headC - 24); ctx.quadraticCurveTo(x + 6 + wob, headC - 30, x + 1, headC - 36); ctx.quadraticCurveTo(x - 3, headC - 40, x + 2 + wob, headC - 43); }, null, "#f2f6fb", 1.8);
  if (back) {
    const tap = (!REDUCE && ((pr.typeT * 6 | 0) % 2)) ? 3 : 0;
    [-1, 1].forEach(sd => {
      vLimb([x + sd * 16, y0 - 34, x + sd * 27, y0 - 30 + (sd > 0 ? tap : 0)], 9, white, INK);
      vEll(x + sd * 27, y0 - 30 + (sd > 0 ? tap : 0), 4.6, 4.2, white, INK, 1.8);
    });
    return null;
  }
  /* face */
  const shift = L * 2, ey = headC + 2;
  [-1, 1].forEach(sd => {
    const ex = x + sd * 8.5 + shift;
    vEll(ex, ey, 4.4, 6.2, "#16161c");
    vEll(ex - 1.2 + L * (P.glance ? 1.5 : 0), ey - 2.4, 1.6, 2, "#ffffff");
    vStroke([ex + sd * 3.4, ey - 5.5, ex + sd * 6.4, ey - 7.5], INK, 1.2);
  });
  vStroke([x - 14 + shift, ey - 11, x - 5 + shift, ey - 10.5], INK, 1.8);
  vStroke([x + 5 + shift, ey - 10.5, x + 14 + shift, ey - 11], INK, 1.8);
  vEll(x - 15 + shift, ey + 6, 4.6, 3, "rgba(240, 130, 150, 0.55)");
  vEll(x + 15 + shift, ey + 6, 4.6, 3, "rgba(240, 130, 150, 0.55)");
  vEll(x + L * 3 + shift, ey + 5, 3.4, 3, "#f4f6fa", "#8a96a8", 1.3);
  const mx = x + L * 2 + shift, my = ey + 11;
  vPath(() => { ctx.moveTo(mx - 7, my - 2); ctx.quadraticCurveTo(mx, my + 10, mx + 7, my - 2); ctx.closePath(); }, "#7a2430", INK, 1.5);
  vEll(mx, my + 3.4, 3.6, 2, "#e87a8a");
  q(mx - 5, my - 1.6, 10, 2, "#ffffff");
  if (P.glance) drawSweat(x + (P.left ? -30 : 30), headC - 14);
  /* arms and the vape */
  const act = activityPlan(pr, P, by0);
  const hands = handsFor(pr, P, by0, true, act, { reach: 24, rest: 50, up: 112 });
  [-L, L].forEach(sd => {
    const hx = hands[sd][0], hy2 = hands[sd][1];
    vLimb([x + sd * 22, by0 - 62, (x + sd * 22 + hx) / 2 + sd * 3, (by0 - 62 + hy2) / 2 + 2, hx, hy2], 10, white, INK);
    vEll(hx, hy2, 6, 5.6, white, INK, 2);
    if (sd === L) {
      vRect(hx + L * 2 - 3, hy2 - 17, 6.4, 18, 2, "#1c1c22", INK, 1.5);
      vRect(hx + L * 2 - 2, hy2 - 22, 4.4, 6, 1.5, "#3a3a44", INK, 1.2);
      vEll(hx + L * 2 + 1, hy2 - 11, 1.3, 4, "rgba(255,255,255,0.45)");
      vEll(hx, hy2, 5.2, 4.8, white);
    }
  });
  return act;
}


function drawSpecialist(pr) {
  const look = LOOKS[pr.staff.id] || { hair: "short", outfit: "tee" };
  const s = look.ov ? Object.assign({}, pr.staff, look.ov) : pr.staff;
  const P = poseOf(pr);
  const x = P.x, L = P.look;
  vShadow(x, P.feet, 20);
  if (look.bird || look.cloud) {
    let by0 = P.body;
    if (P.sit) by0 += SIT_DROP;
    pr._act = look.bird ? drawTweety(pr, P, by0) : drawClive(pr, P, by0);
    return;
  }
  if (P.work) { drawSpecialistBack(pr, P, s, look); return; }
  const w2 = look.wide || 1;
  let by = P.body;
  const casual = look.outfit === "tee" || look.outfit === "hoodie";
  const trouser = s.id === "george" ? "#3a4a6a" : s.id === "sarge" ? "#161a2a" : s.id === "vinnie" ? "#2a2a30" : s.id === "stockley" ? "#4a4a56" : s.id === "hettie" ? "#4a3a30" : s.id === "sheila" ? "#1a4a5a" : s.id === "mona" ? "#2a2a38" : s.id === "penny" ? "#1a1a24" : casual ? "#34405a" : (s.id === "frank" ? "#2a2a34" : dark(s.body, 0.45));
  const shoe = s.id === "sheila" || s.id === "george" ? "#3a2a1a" : "#2a1c14";
  drawLegsV(P, trouser, shoe, { legW: 11 * w2 });
  if (P.sit) by += SIT_DROP;
  const hy = by - 100;
  hairBackV(look.hair, x, hy, s.hair, L, false);
  vRect(x - 5, by - 88, 10, 10, 3, dark(s.skin, 0.12), INK, 1.5);
  drawTorsoV(x, by - 80, by - 36, 17 * w2, 15 * w2, s.body, () => {
    outfitDetailsV(look, s, x, by - 80, by - 36, 17 * w2);
    torsoExtrasV(look, s, x, by - 80, by - 36, 17 * w2, L);
  });
  vEll(x - 16 * w2, hy + 2, 3.5, 5, s.skin, INK, 2);
  vEll(x + 16 * w2, hy + 2, 3.5, 5, s.skin, INK, 2);
  if (look.earring) vArc(x + (L > 0 ? -16 : 16) * w2, hy + 9, 3.2, 0, Math.PI * 2, "#e8c040", 1.6);
  vEll(x, hy, 16 * w2, 17, s.skin, INK);
  vEll(x - 5, hy - 7, 6, 3.5, lite(s.skin, 0.25));
  vEll(x + 6, hy + 9, 7, 4, dark(s.skin, 0.05));
  if (s.prop !== "hat") hairFrontV(look.hair, x, hy, s.hair, L);
  else vPath(() => { ctx.moveTo(x - 16, hy - 4); ctx.quadraticCurveTo(x, hy - 9, x + 16, hy - 4); ctx.lineTo(x + 16, hy - 10); ctx.lineTo(x - 16, hy - 10); ctx.closePath(); }, s.hair);
  if (look.streak) {
    [["#26b8e8", -4], ["#f2c200", 0], ["#e23d8a", 4]].forEach(([c, d]) => vStroke([x + L * 3 + d, hy - 13, x + L * 9 + d * 1.4, hy - 24], c, 2.4));
  }
  drawFaceV(x, hy + 2, L, { skin: s.skin, brow: dark(s.hair, 0.2), cele: P.cele, glance: P.glance, stern: look.stern, grin: look.grin, browW: look.bold ? 3.4 : (look.stern ? 2.8 : 0), eye: look.eye });
  facialExtrasV(look, s, x, hy + 2, L);
  if (look.hat) drawHatV(look.hat, x, hy, L, false);
  drawHeadgearV(s, x, hy, L, false);
  if (P.glance) drawSweat(x + (P.left ? -22 : 22), hy - 14);
  const act = activityPlan(pr, P, by);
  const held = HELD.includes(s.prop);
  const hands = handsFor(pr, P, by, held, act);
  const shortSleeve = look.outfit === "tee";
  [-L, L].forEach(sd => {
    const hx = hands[sd][0], hy2 = hands[sd][1];
    const shx = x + sd * 14 * w2, shy = by - 76;
    const holding = sd === L && held;
    if (shortSleeve) {
      drawArmV(shx, shy, hx, hy2, s.skin, s.skin, { noHand: holding });
      vLimb([shx, shy, shx + (hx - shx) * 0.38, shy + (hy2 - shy) * 0.38], 10, s.body, INK);
    } else {
      drawArmV(shx, shy, hx, hy2, s.body, s.skin, { noHand: holding, cuff: look.outfit === "chef" ? "#fbf8ee" : null, w: 8.5 * w2 });
    }
    if (holding) {
      drawPropV(s.prop, hx, hy2, L);
      drawHandV(hx, hy2, s.skin, true);
    }
  });
  pr._act = act;
}

function drawSpecialistBack(pr, P, s, look) {
  const x = P.x, by = P.y, L = P.look, w2 = look.wide || 1;
  const tap = (!REDUCE && ((pr.typeT * 6 | 0) % 2)) ? 3 : 0;
  [-1, 1].forEach(sd => drawArmV(x + sd * 13 * w2, by - 38, x + sd * 25 * w2, by - 30 + (sd > 0 ? tap : 0), s.body, s.skin, { bend: 2 }));
  drawTorsoV(x, by - 46, by - 2, 18 * w2, 16 * w2, s.body, () => {
    if (look.outfit === "hoodie") vEll(x, by - 40, 13, 9, dark(s.body, 0.16), INK, 1.5);
    else if (look.outfit === "chef") q(x - 16, by - 30, 32, 3, s.accent);
    else if (look.outfit === "plaidvest") { q(x - 18, by - 46, 36, 44, look.vestC); q(x - 18, by - 28, 36, 4, "#d8dce0"); q(x - 18, by - 20, 36, 4, "#d8dce0"); }
    else if (look.outfit === "overall" || look.outfit === "tabard") q(x - 18, by - 26, 36, 4, s.accent);
    else if (look.outfit === "apron") q(x - 12, by - 26, 24, 24, "#f1e8d6");
    else if (look.outfit === "jacketopen" && look.zig) { q(x - 18, by - 30, 36, 3, look.zig); }
    if (look.scarf) vRect(x - 11, by - 48, 22, 7, 3.5, look.scarf, INK, 1.4);
    if (look.strap) vStroke([x - 16, by - 44, x + 16, by - 8], "#8a5a30", 3.4);
    vStroke([x, by - 40, x, by - 6], dark(s.body, 0.22), 1.4);
  });
  vRect(x - 5, by - 52, 10, 9, 3, dark(s.skin, 0.12), INK, 1.5);
  vEll(x - 16 * w2, by - 62, 3.5, 5, s.skin, INK, 2);
  vEll(x + 16 * w2, by - 62, 3.5, 5, s.skin, INK, 2);
  vEll(x, by - 64, 16 * w2, 17, s.skin, INK);
  if (s.prop === "hat") {
    vPath(() => { ctx.moveTo(x - 16, by - 72); ctx.quadraticCurveTo(x, by - 60, x + 16, by - 72); ctx.lineTo(x + 16, by - 77); ctx.lineTo(x - 16, by - 77); ctx.closePath(); }, s.hair);
  } else {
    hairBackOfHeadV(look.hair, x, by - 64, s.hair);
  }
  if (look.hair === "ponytail") { vEll(x, by - 46, 6, 13, s.hair, INK, 2); vEll(x, by - 58, 4, 2.6, "#d1202f", INK, 1); }
  if (look.hair === "bun") vEll(x, by - 82, 8, 7, s.hair, INK, 2);
  if (look.goggles) vStroke([x - 16, by - 74, x + 16, by - 74], "#2a2a2a", 3.4);
  if (look.hat) drawHatV(look.hat, x, by - 64, L, true);
  drawHeadgearV(s, x, by - 64, L, true);
}

/* ---------- Kenneth: cream metal head, flat cap with a red feather, round glasses ---------- */
function drawKenCap(x, top, L, back) {
  /* The feather sweeps back and low, so it stays clear of his nameplate. */
  const fb = back ? 10 : -L * 13, dir = back ? 1 : -L;
  vPath(() => {
    ctx.moveTo(x + fb, top - 1);
    ctx.quadraticCurveTo(x + fb + dir * 13, top - (back ? 14 : 15), x + fb + dir * (back ? 20 : 23), top - (back ? 10 : 11));
    ctx.quadraticCurveTo(x + fb + dir * 11, top - 2, x + fb, top - 1);
  }, "#d1202f", INK, 1.5);
  vStroke([x + fb, top - 1, x + fb + dir * 18, top - 9], "#8a1018", 1.1);
  if (back) {
    vEll(x, top + 3, 19, 8, "#1a1a1a", INK);
    vRect(x - 18, top + 1, 36, 4, 1.5, "#c4202a");
    return;
  }
  vPath(() => {
    ctx.moveTo(x - 19, top + 5);
    ctx.quadraticCurveTo(x - 17 + L * 2, top - 9, x + L * 4, top - 9);
    ctx.quadraticCurveTo(x + 20 + L * 2, top - 8, x + 19, top + 5);
    ctx.closePath();
  }, "#1a1a1a", INK);
  vEll(x - 6 + L * 2, top - 4, 6, 2, "#3a3a3a");
  vRect(x - 18, top + 1, 36, 4, 1.5, "#c4202a");
  vEll(x + L * 17, top + 5, 11, 3.4, "#141414", INK, 2);
}

function drawKenneth(pr) {
  const s = pr.staff, P = poseOf(pr), x = P.x, L = P.look;
  const metal = "#e8dcc8", metalD = "#c8bca4", arm = "#9a968c", hand = "#b8b4aa";
  vShadow(x, P.feet, 20);
  if (P.work) {
    const by = P.y, tap = (!REDUCE && ((pr.typeT * 6 | 0) % 2)) ? 3 : 0;
    [-1, 1].forEach(sd => drawArmV(x + sd * 13, by - 38, x + sd * 25, by - 30 + (sd > 0 ? tap : 0), arm, hand, { bend: 2 }));
    drawTorsoV(x, by - 46, by - 2, 18, 16, "#1a1a1a", () => {
      q(x - 18, by - 46, 36, 5, "#f4ecd8");
      vRect(x - 7, by - 24, 14, 3, 1, "#3a3a3a");
    });
    vRect(x - 5, by - 52, 10, 9, 2, metalD, INK, 1.5);
    vEll(x - 17, by - 64, 3.5, 5, metalD, INK, 2);
    vEll(x + 17, by - 64, 3.5, 5, metalD, INK, 2);
    vRect(x - 16, by - 82, 32, 34, 11, metal, INK);
    vEll(x - 9, by - 58, 1.4, 1.4, metalD);
    vEll(x + 9, by - 58, 1.4, 1.4, metalD);
    vStroke([x - 15, by - 68, x - 18, by - 66], INK, 2);
    vStroke([x + 15, by - 68, x + 18, by - 66], INK, 2);
    drawKenCap(x, by - 84, L, true);
    return;
  }
  let by = P.body;
  drawLegsV(P, "#1a1a1a", "#0e0e0e");
  if (P.sit) by += SIT_DROP;
  vRect(x - 5, by - 90, 10, 12, 2, metalD, INK, 1.5);
  drawTorsoV(x, by - 80, by - 36, 17, 15, "#f4ecd8", () => {
    vPoly([x - 18, by - 81, x - 5, by - 81, x, by - 62, x, by - 35, x - 18, by - 35], "#1a1a1a");
    vPoly([x + 18, by - 81, x + 5, by - 81, x, by - 62, x, by - 35, x + 18, by - 35], "#1a1a1a");
    vStroke([x - 5, by - 81, x, by - 62, x, by - 35], "#3a3a3a", 1.2);
    vPoly([x - 3, by - 79, x + 3, by - 79, x + 2.4, by - 72, x + 4, by - 60, x, by - 55, x - 4, by - 60, x - 2.4, by - 72], "#c4202a", INK, 1);
    [by - 56, by - 47, by - 40].forEach(yy => vEll(x - 2.5, yy, 1.4, 1.4, "#8a8070"));
    const bx = x - L * 10, byy = by - 66;
    vEll(bx, byy, 5, 5, "#c4a574", INK, 1.2);
    vArc(bx, byy, 2.4, 0, Math.PI * 2, "#3a2a10", 1.4);
    vStroke([bx + 1, byy + 1, bx + 3, byy + 3], "#3a2a10", 1.4);
    vArc(x + L * 8, by - 48, 5, 0.2, Math.PI - 0.2, "#c4a574", 1.2);
  });
  const hy = by - 104;
  vEll(x - 18, hy + 2, 3.5, 5.5, metalD, INK, 2);
  vEll(x + 18, hy + 2, 3.5, 5.5, metalD, INK, 2);
  const head = () => rrPath(x - 17, hy - 20, 34, 38, 12);
  vPath(head, metal);
  withClip(head, () => {
    q(x + 7, hy - 20, 12, 40, metalD);
    q(x - 15, hy - 18, 8, 6, lite(metal, 0.35));
  });
  vPath(head, null, INK);
  [[-12, 12], [12, 12]].forEach(([dx, dy]) => vEll(x + dx, hy + dy, 1.3, 1.3, "#a89c84"));
  drawFaceV(x, hy + 2, L, { skin: metal, brow: INK, noBlush: true, noNose: true, noMouth: true, cele: P.cele, glance: P.glance, stern: true });
  [-1, 1].forEach(sd => {
    const gx = x + sd * 7 + L * 2;
    vArc(gx, hy + 2, 6.4, 0, Math.PI * 2, INK, 2);
    vEll(gx - 2, hy - 1, 2, 1.2, "rgba(255,255,255,0.6)");
  });
  vStroke([x - 1 + L * 2, hy + 1, x + 1 + L * 2, hy + 1], INK, 2);
  const mx = x + L * 2, my = hy + 12;
  if (P.cele) vRect(mx - 6, my - 1, 12, 7, 3, "#5a2a20", INK, 1.2);
  else {
    vRect(mx - 6, my, 12, 4.5, 2, "#3a3430", INK, 1.2);
    vStroke([mx - 2, my + 0.5, mx - 2, my + 4], "#8a8070", 1);
    vStroke([mx + 2, my + 0.5, mx + 2, my + 4], "#8a8070", 1);
  }
  drawKenCap(x, hy - 18, L, false);
  if (P.glance) drawSweat(x + (P.left ? -24 : 24), hy - 12);
  const act = activityPlan(pr, P, by);
  const hands = handsFor(pr, P, by, true, act);
  [-L, L].forEach(sd => {
    const hx = hands[sd][0], hy2 = hands[sd][1];
    drawArmV(x + sd * 14, by - 76, hx, hy2, arm, hand, { noHand: sd === L, w: 7.5, cuff: "#f4ecd8" });
    if (sd === L) { drawPropV(s.prop, hx, hy2, L); drawHandV(hx, hy2, hand, true); }
  });
  pr._act = act;
}

/* ---------- Terry and Reggie, the Quill robots ---------- */
function drawRobotHead(s, reg, x, hc, top, L, P) {
  const metal = s.skin, metalD = dark(metal, 0.18), metalL = lite(metal, 0.35);
  const hw = reg ? 15 : 19, hh = reg ? 52 : 38, hTop = reg ? hc - 28 : hc - 19;
  if (!reg) {
    vStroke([x, hTop, x + L * 2, hTop - 14], "#5a5a5a", 2.6);
    vEll(x + L * 2, hTop - 17, 4.5, 4.5, "#d1202f", INK, 1.5);
    vEll(x + L * 2 - 1.5, hTop - 18.5, 1.4, 1.4, "#ff9a9a");
  } else {
    vRect(x - 4, hTop - 6, 8, 7, 2, metalD, INK, 1.5);
  }
  vEll(x - hw - 2, hc + 2, 4.5, 7, metalD, INK, 2);
  vEll(x + hw + 2, hc + 2, 4.5, 7, metalD, INK, 2);
  vEll(x - hw - 2, hc + 2, 1.8, 3, metalL);
  vEll(x + hw + 2, hc + 2, 1.8, 3, metalL);
  const head = () => rrPath(x - hw, hTop, hw * 2, hh, reg ? 13 : 8);
  vPath(head, metal);
  withClip(head, () => {
    q(x + hw * 0.45, hTop, hw, hh, metalD);
    q(x - hw + 3, hTop + 3, hw * 0.6, 5, metalL);
  });
  vPath(head, null, INK);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => vEll(x + a * (hw - 4), hTop + (b < 0 ? 4 : hh - 4), 1.3, 1.3, dark(metal, 0.35)));
  return { metal, metalD };
}

function drawRobot(pr) {
  const s = pr.staff, reg = s.kind === "reggie", P = poseOf(pr), x = P.x, L = P.look;
  const metal = s.skin, metalD = dark(metal, 0.18);
  vShadow(x, P.feet, 20);
  if (P.work) {
    const by = P.y, tap = (!REDUCE && ((pr.typeT * 6 | 0) % 2)) ? 3 : 0;
    [-1, 1].forEach(sd => drawArmV(x + sd * 13, by - 38, x + sd * 25, by - 30 + (sd > 0 ? tap : 0), metal, metal, { bend: 2, cuff: "#f4ecd8" }));
    drawTorsoV(x, by - 46, by - 2, 18, 16, s.body, () => {
      q(x - 18, by - 46, 36, 5, "#f4ecd8");
      vRect(x - 8, by - 26, 16, 4, 1.5, dark(s.body, 0.25));
    });
    vRect(x - 5, by - 54, 10, 10, 2, metalD, INK, 1.5);
    drawRobotHead(s, reg, x, reg ? by - 78 : by - 70, by - 46, L, P);
    return;
  }
  const hip = reg ? 44 : 38;
  let by = P.body;
  drawLegsV(P, "#2e2e34", "#141414", { hip: hip, legW: 10 });
  if (P.sit) by += SIT_DROP;
  const top = reg ? by - 88 : by - 80, bot = by - hip + 2;
  vRect(x - 5, top - 10, 10, 12, 2, metalD, INK, 1.5);
  drawTorsoV(x, top, bot, 17, 15, "#f4ecd8", () => {
    vPoly([x - 18, top - 1, x - 5, top - 1, x, top + 18, x, bot + 1, x - 18, bot + 1], s.body);
    vPoly([x + 18, top - 1, x + 5, top - 1, x, top + 18, x, bot + 1, x + 18, bot + 1], s.body);
    vStroke([x - 5, top - 1, x, top + 18, x, bot + 1], dark(s.body, 0.3), 1.2);
    [top + 22, top + 30, top + 38].forEach(yy => vEll(x - 3, yy, 1.5, 1.5, "#d4af37"));
    if (reg) {
      vPoly([x, top + 3, x - 8, top - 1, x - 8, top + 7], "#141414", INK, 1);
      vPoly([x, top + 3, x + 8, top - 1, x + 8, top + 7], "#141414", INK, 1);
      vEll(x, top + 3, 2, 2, "#2a2a2a");
      const px = x - L * 10;
      vPoly([px - 4, top + 14, px + 4, top + 14, px + 2, top + 9, px, top + 11, px - 2, top + 8], "#fbf8ee", INK, 1);
      vStroke([px - 5, top + 14, px + 5, top + 14], dark(s.body, 0.35), 1.4);
    } else {
      vPoly([x - 2.6, top + 1, x + 2.6, top + 1, x + 2, top + 8, x + 3.6, top + 22, x, top + 26, x - 3.6, top + 22, x - 2, top + 8], "#141414", INK, 1);
    }
  });
  const hc = reg ? top - 34 : top - 25;
  drawRobotHead(s, reg, x, hc, top, L, P);
  if (!reg) {
    ctx.save();
    ctx.translate(x, hc);
    ctx.scale(1.22, 1.22);
    drawFaceV(0, -1, L, { skin: metal, brow: "#3a3a3a", noNose: true, noMouth: true, cele: P.cele, glance: P.glance });
    ctx.restore();
    if (P.cele) vPath(() => { ctx.moveTo(x - 8 + L * 2, hc + 8); ctx.quadraticCurveTo(x + L * 2, hc + 19, x + 8 + L * 2, hc + 8); ctx.closePath(); }, "#5a2a20", INK, 1.6);
    else vArc(x + L * 2, hc + 4, 8, Math.PI * 0.2, Math.PI * 0.8, INK, 2.4);
  } else {
    drawFaceV(x, hc - 2, L, { skin: metal, brow: "#3a3a3a", noNose: true, noMouth: true, noBlush: true, cele: P.cele, glance: P.glance });
    if (!P.cele) {
      [-1, 1].forEach(sd => {
        const ex = x + sd * 7 + L * 2, ey = hc - 2;
        vPath(() => { ctx.ellipse(ex, ey, 4.6, 5.4, 0, Math.PI, Math.PI * 2); ctx.lineTo(ex - 4.6, ey - 0.2); }, metal);
        vStroke([ex - 4.6, ey - 0.4, ex + 4.6, ey - 0.4], INK, 1.8);
      });
    }
    const mx = x + L * 7 + L * 2, my = hc - 2;
    vArc(mx, my, 6.8, 0, Math.PI * 2, "#d4af37", 2.2);
    vEll(mx - 2, my - 3, 2, 1.2, "rgba(255,255,255,0.55)");
    vPath(() => { ctx.moveTo(mx + L * 5, my + 5); ctx.quadraticCurveTo(mx + L * 12, my + 22, mx + L * 6, top + 6); }, null, "#d4af37", 1.2);
    if (P.cele) vEll(x + L * 2, hc + 14, 4, 3, "#5a2a20", INK, 1.2);
    else vStroke([x - 4 + L * 2, hc + 14, x + 5 + L * 2, hc + 13], INK, 2);
  }
  if (P.glance) drawSweat(x + (P.left ? -26 : 26), hc - 16);
  const act = activityPlan(pr, P, by);
  const hands = handsFor(pr, P, by, true, act, { rest: reg ? 50 : 46, up: reg ? 124 : 116 });
  [-L, L].forEach(sd => {
    const hx = hands[sd][0], hy2 = hands[sd][1];
    drawArmV(x + sd * 14, top + 4, hx, hy2, metal, metal, { noHand: sd === L, w: 7.5, cuff: "#f4ecd8" });
    if (sd === L) { drawPropV(s.prop, hx, hy2, L); drawHandV(hx, hy2, metal, true); }
  });
  pr._act = act;
}

/* ---------- Kraken Keith: a purple octopus in a navy waistcoat ---------- */
function skinDOf(c) { return dark(c, 0.25); }
const KEITH_BUSY = ["kettle", "lounge", "darts", "rods", "canteen", "sofa", "music"];
function drawTentacle(pts, w, skin, sucker, curl) {
  vLimb(pts, w, skin, INK);
  const n = pts.length;
  const tx = pts[n - 2], ty = pts[n - 1];
  if (curl) { vEll(tx + curl * 2, ty + 1, 3.4, 3.2, skin, INK, 1.5); vEll(tx + curl * 2, ty + 1, 1.3, 1.2, skinDOf(skin)); }
  if (sucker) {
    const ax = pts[n - 4], ay = pts[n - 3];
    for (let i = 1; i <= 2; i++) {
      const t = 0.35 + i * 0.22;
      vEll(ax + (tx - ax) * t, ay + (ty - ay) * t + 1.5, 1.8, 1.4, sucker);
    }
  }
}
function drawKeith(pr) {
  const s = pr.staff, P = poseOf(pr), x = P.x, L = P.look;
  const skin = "#8a5cc4", skinD = "#6a3fa0", skinL = "#a87ad8", sucker = "#e8a0b8", vest = "#1e2a4a", gold = "#d4af37";
  vShadow(x, P.feet, 26);
  if (P.work) {
    const by = P.y, tap = (!REDUCE && ((pr.typeT * 6 | 0) % 2)) ? 3 : 0;
    [-1, 1].forEach(sd => drawTentacle([x + sd * 16, by - 36, x + sd * 30, by - 34, x + sd * 36, by - 24 + (sd > 0 ? tap : 0)], 8, skin, sucker));
    drawTorsoV(x, by - 44, by - 2, 22, 20, vest, () => q(x - 6, by - 30, 12, 3, lite(vest, 0.15)));
    vEll(x, by - 76, 24, 30, skin, INK);
    vEll(x - 9, by - 90, 8, 10, skinL);
    [[8, -92], [-4, -70], [12, -74]].forEach(([dx, dy]) => vEll(x + dx, by + dy, 2.2, 2.2, skinD));
    vStroke([x - 24, by - 76, x - 18, by - 74], INK, 2);
    vStroke([x + 24, by - 76, x + 18, by - 74], INK, 2);
    return;
  }
  let by = P.body;
  if (P.sit) {
    for (let i = 0; i < 4; i++) {
      const bx = x - 15 + i * 10;
      drawTentacle([bx, P.y - 16, bx + (i - 1.5) * 2, P.y - 6, bx + (i - 1.5) * 4, P.y + 2], 9, skin, sucker);
    }
    by += SIT_DROP;
  } else {
    for (let i = 0; i < 4; i++) {
      const spread = i - 1.5;
      const sway = P.swing * (i % 2 ? 1 : -1) * 6 * L;
      const hx0 = x + spread * 6, hy0 = P.y - 34;
      drawTentacle([hx0, hy0, x + spread * 8 + sway * 0.5, P.y - 18, x + spread * 14 + sway, P.y - 3], 9, skin, sucker);
    }
  }
  drawTorsoV(x, by - 74, by - 30, 21, 19, vest, () => {
    vStroke([x - 8, by - 74, x, by - 58, x + 8, by - 74], lite(vest, 0.25), 1.6);
    [by - 52, by - 43].forEach(yy => vEll(x, yy, 1.6, 1.6, "#0a1020"));
    const bx = x + L * 10, byy = by - 64;
    vEll(bx, byy, 4.6, 4.6, gold, INK, 1.4);
    vEll(bx, byy, 2, 2, "#c47a1a");
  });
  for (let i = 0; i < 3; i++) {
    const fx = x - 8 + i * 8;
    drawTentacle([fx, by - 82, fx + (i - 1) * 2, by - 70, fx + (i - 1) * 3 + 1, by - 62], 6, skin, null);
  }
  const hc = by - 104;
  const head = () => { ctx.ellipse(x, hc, 24, 30, 0, 0, Math.PI * 2); };
  vPath(head, skin);
  withClip(head, () => {
    vEll(x + 14, hc + 6, 14, 30, skinD);
    vEll(x - 9, hc - 14, 8, 11, skinL);
  });
  vPath(head, null, INK);
  [[9, -18], [3, -24], [-12, -6], [14, -2]].forEach(([dx, dy]) => vEll(x + dx, hc + dy, 2, 2, skinD));
  const ey = hc + 6, gl = P.glance ? 1.2 : 0;
  [-1, 1].forEach(sd => {
    const gx = x + sd * 9 + L * 2;
    vEll(gx, ey, 7.4, 7.4, "#fffef8", INK, 2.6);
    vEll(gx + L * (2 + gl), ey + 0.5, 3, 3.4, "#141414");
    vEll(gx + L * (2 + gl) - 1, ey - 1, 1, 1, "#ffffff");
    vStroke([gx - 4, ey - 11 + (P.cele ? -2 : 0), gx + 4, ey - 11 + (P.cele ? -2 : 0)], skinD, 2.2);
  });
  vStroke([x - 2 + L * 2, ey, x + 2 + L * 2, ey], INK, 2.4);
  vStroke([x - 16 + L * 2, ey - 1, x - 23, ey - 3], INK, 2);
  vStroke([x + 16 + L * 2, ey - 1, x + 23, ey - 3], INK, 2);
  if (P.cele) vPath(() => { ctx.moveTo(x - 5 + L * 2, hc + 17); ctx.quadraticCurveTo(x + L * 2, hc + 25, x + 5 + L * 2, hc + 17); ctx.closePath(); }, "#5a2050", INK, 1.4);
  else vArc(x + L * 2, hc + 15, 4.4, Math.PI * 0.2, Math.PI * 0.8, INK, 1.8);
  if (P.glance) drawSweat(x + (P.left ? -28 : 28), hc - 18);
  const act = activityPlan(pr, P, by);
  const hands = handsFor(pr, P, by, true, act, { reach: 24, up: 112 });
  const busy = KEITH_BUSY.includes(pr.activity) && pr.phase === "idle" && !pr.target;
  [-L, L].forEach(sd => {
    const hx = hands[sd][0], hy2 = hands[sd][1];
    const shx = x + sd * 16, shy = by - 68;
    drawTentacle([shx, shy, (shx + hx) / 2 + sd * 8, (shy + hy2) / 2, hx, hy2], 7.5, skin, sucker, sd);
    if (sd === L) drawPropV("tablet", hx, hy2, L);
    else if (!busy && !act && !P.cele) drawPropV("coin", hx, hy2, -L, "B");
  });
  pr._act = act;
}


/* ---------- The office cats ----------
   Each is drawn from their photos on the Cats page: colours, markings, coat length
   and build. Long-haired cats get a fluffy outline and a plume tail; Spyro is sleek. */
const CAT_LOOKS = {
  /* Arthur: blue-point Ragdoll, taupe mask, cream body with a fawn back, big dark plume, white mitts. */
  arthur: { fur: "long", base: "#f1e6d2", back: "#d6bb98", belly: "#fbf5ea", ruff: "#fbf5ea", face: "#eadfca", mask: "#8d7d72", ear: "#7d6d62", eye: "#7ec0ea", nose: "#6a5a58", leg: "#f4ecdc", paw: "#ffffff", tail: "#85705f", tailD: "#5e4b40", sx: 1.1, sy: 1.04 },
  /* Spyro: short-haired white with pink ears, a ginger dab on the forehead and a ginger tail. */
  spyro: { fur: "short", base: "#f7f4ec", back: "#ffffff", belly: "#ece7db", face: "#faf8f2", ear: "#f2bcbc", eye: "#c8d46a", nose: "#e8a0a0", leg: "#f7f4ec", paw: "#ffffff", tail: "#d98a3a", tailD: "#b26418", patch: "#d9a060", rings: true, sx: 0.94, sy: 1 },
  /* Tilly: silver-tabby (lynx-point) Ragdoll: grey-barred face and legs, pink nose, white ruff. */
  tilly: { fur: "long", base: "#e6dccd", back: "#cdbfae", belly: "#faf6ee", ruff: "#fbf8f2", face: "#e5dbcf", mask: "#a99d91", stripes: "#5e554e", ear: "#9c9086", eye: "#74b2e0", nose: "#d98a96", leg: "#cfc3b4", legStripe: "#6a6058", paw: "#ddd2c4", tail: "#b9ab9b", tailD: "#6a6058", rings: true, sx: 0.98, sy: 1.08, soft: true },
  /* Trixie: seal-point Ragdoll: very dark face and ears, vivid blue eyes, white socks, dark plume. */
  trixie: { fur: "long", base: "#f0e6d6", back: "#d4bc9a", belly: "#fffaf0", ruff: "#fffaf0", face: "#e4d6c2", mask: "#3f332e", ear: "#3f332e", eye: "#56aae6", nose: "#3a2c28", leg: "#f6eddc", paw: "#ffffff", tail: "#6d5d55", tailD: "#463a34", stern: true, sx: 1.02, sy: 1 },
  /* Daisy: cream-and-white mitted Ragdoll: fawn cap with a white blaze, pink nose, grey-taupe tail. */
  daisy: { fur: "long", base: "#f6eedf", back: "#ebcfa8", belly: "#fffdf8", ruff: "#fffdf8", face: "#f8f2e6", mask: "#d6bb98", blaze: true, ear: "#cdb090", eye: "#78b4e0", nose: "#e8a0a8", leg: "#fbf6ec", paw: "#ffffff", tail: "#9b9088", tailD: "#756b62", sx: 1.08, sy: 1 },
  /* Dexter: black-smoke longhair: black face and legs, smoky-grey ruff and body, amber eyes. */
  dexter: { fur: "long", base: "#524b46", back: "#27201e", belly: "#7c756f", ruff: "#908983", face: "#1c1614", ear: "#1c1614", eye: "#eab838", nose: "#2a2020", leg: "#1e1816", paw: "#1e1816", tail: "#4b4440", tailD: "#26201e", noCheek: true, sx: 1.12, sy: 1.02 }
};

function fluffRing(cx, cy, rx, ry, col, n, r, from, to) {
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < n; i++) {
      const a = from + (to - from) * (n === 1 ? 0 : i / (n - 1));
      const px = cx + Math.cos(a) * rx, py = cy + Math.sin(a) * ry;
      if (pass === 0) vEll(px, py, r, r * 0.92, col, INK, 1.8);
      else vEll(px, py, r - 1.1, r * 0.92 - 1.1, col);
    }
  }
}
function catBodyV(cx, cy, rx, ry, k, o) {
  const long = k.fur === "long";
  if (long) fluffRing(cx, cy, rx - 1, ry - 1, k.base, o.n || 14, o.r || 6.5, o.from === undefined ? 0 : o.from, o.to === undefined ? Math.PI * 2 : o.to);
  const path = () => { ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); };
  vPath(path, k.base, long ? null : INK);
  withClip(path, () => {
    vEll(cx, cy - ry * 0.78, rx * 1.1, ry * 0.95, k.back);
    vEll(cx, cy + ry * 0.7, rx * 0.62, ry * 0.55, k.belly);
  });
  if (!long) vPath(path, null, INK);
}
function polySample(pts, n) {
  const seg = [];
  let tot = 0;
  for (let i = 2; i < pts.length; i += 2) {
    const l = Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
    seg.push(l);
    tot += l;
  }
  const out = [];
  for (let j = 0; j < n; j++) {
    let d = tot * j / (n - 1), i = 0;
    while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
    const t = seg[i] ? Math.min(1, d / seg[i]) : 0;
    out.push([pts[i * 2] + (pts[i * 2 + 2] - pts[i * 2]) * t, pts[i * 2 + 1] + (pts[i * 2 + 3] - pts[i * 2 + 1]) * t]);
  }
  return out;
}
function catTail(pts, k, w) {
  const col = k.tail, colD = k.tailD;
  if (k.fur === "long") {
    /* A feathery plume: puffs that fatten towards the tip. */
    const sp = polySample(pts, 10);
    for (let pass = 0; pass < 2; pass++) {
      sp.forEach(([px, py], i) => {
        const r = (w * 0.5 + i * 0.75) + (i % 2 ? 0.8 : 0) - pass * 1.2;
        vEll(px, py, r, r, i > 6 ? mixHex(col, colD, (i - 6) / 4) : col, pass ? null : INK, 1.8);
      });
    }
    return;
  }
  vLimb(pts, w, col, INK);
  if (k.rings) {
    const sp = polySample(pts, 6);
    for (let i = 1; i < sp.length - 1; i++) {
      const dx = sp[i + 1][0] - sp[i - 1][0], dy = sp[i + 1][1] - sp[i - 1][1], l = Math.max(1, Math.hypot(dx, dy));
      const nx = -dy / l * w * 0.42, ny = dx / l * w * 0.42;
      vStroke([sp[i][0] - nx, sp[i][1] - ny, sp[i][0] + nx, sp[i][1] + ny], colD, 2);
    }
  }
  const n = pts.length;
  vEll(pts[n - 2], pts[n - 1], w / 2, w / 2, colD);
}
function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = sh => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
  return "rgb(" + ch(16) + "," + ch(8) + "," + ch(0) + ")";
}
function catEars(cx, cy, k) {
  [-1, 1].forEach(sd => {
    const ex = cx + sd * 11.5;
    vPoly([ex - sd * 9, cy - 4, ex + sd * 0.5, cy - 21, ex + sd * 10, cy - 1], k.ear, INK, 2);
    vPoly([ex - sd * 5, cy - 5, ex + sd * 0.8, cy - 16, ex + sd * 7, cy - 2], "#e9a9ae");
    if (k.fur === "long") [-2, 0, 2].forEach(o => vStroke([ex + sd * 5 + sd * o * 0.5, cy - 3, ex + sd * 4 + sd * o, cy - 9], lite(k.face, 0.3), 1));
  });
}
function catHeadV(cx, cy, look, k, o) {
  const opt = o || {}, sh = look * 2;
  catEars(cx, cy, k);
  const long = k.fur === "long";
  if (long && !k.noCheek) {
    [-1, 1].forEach(sd => {
      vPoly([cx + sd * 14, cy + 1, cx + sd * 25, cy + 10, cx + sd * 15, cy + 12], k.ruff, INK, 1.8);
      vPoly([cx + sd * 13, cy + 7, cx + sd * 22, cy + 17, cx + sd * 10, cy + 15], k.ruff, INK, 1.8);
    });
  }
  const head = () => { ctx.ellipse(cx, cy, 19, 16, 0, 0, Math.PI * 2); };
  vPath(head, k.face);
  withClip(head, () => {
    if (k.mask) {
      vEll(cx + sh * 0.4, cy - (k.blaze ? 5 : 0), k.blaze ? 18 : 15.5, k.blaze ? 11 : 13, k.mask);
      if (k.stripes) {
        for (let i = -1; i <= 1; i++) vStroke([cx + i * 5 + sh * 0.4, cy - 16, cx + i * 4.2 + sh * 0.4, cy - 8], k.stripes, 1.8);
        [-1, 1].forEach(sd => {
          vStroke([cx + sd * 15, cy + 1, cx + sd * 10, cy + 2], k.stripes, 1.6);
          vStroke([cx + sd * 15, cy + 5, cx + sd * 10, cy + 5], k.stripes, 1.6);
        });
      }
      if (k.blaze) vPoly([cx - 2 + sh, cy - 14, cx + 2 + sh, cy - 14, cx + 5 + sh, cy + 4, cx + sh, cy + 12, cx - 5 + sh, cy + 4], k.face);
      else vEll(cx + sh, cy + 9, 8, 5, k.stripes ? lite(k.face, 0.1) : k.ruff ? k.face : k.mask);
    }
    vEll(cx - 7, cy - 9, 7, 3.4, "rgba(255,255,255,0.22)");
    if (k.patch) vEll(cx - 3 + sh * 0.3, cy - 10, 3.6, 2.6, k.patch);
  });
  vPath(head, null, INK);
  [-1, 1].forEach(sd => {
    const ex = cx + sd * 7.2 + sh, ey = cy - 0.5;
    if (opt.sleep) { vArc(ex, ey - 1, 3.8, Math.PI * 0.15, Math.PI * 0.85, INK, 1.8); return; }
    vEll(ex, ey, 4.8, 4.8, k.eye, INK, 1.5);
    vEll(ex + look * 0.8, ey, 1.5, 3.8, "#0e0a08");
    vEll(ex - 1.3, ey - 1.7, 1.2, 1.2, "#ffffff");
    if (k.stern) vStroke([ex - sd * 5.6, ey - 7.2 + (sd > 0 ? 0 : 0), ex + sd * 4, ey - 3.8], "#241a16", 2);
  });
  vPoly([cx + sh - 3, cy + 5, cx + sh + 3, cy + 5, cx + sh, cy + 8.4], k.nose, INK, 1);
  vPath(() => { ctx.moveTo(cx + sh - 4, cy + 10.5); ctx.quadraticCurveTo(cx + sh - 2, cy + 12.5, cx + sh, cy + 8.6); ctx.quadraticCurveTo(cx + sh + 2, cy + 12.5, cx + sh + 4, cy + 10.5); }, null, INK, 1.2);
  const wc = (k.id === "dexter" || k.id === "trixie") ? "rgba(235,228,220,0.85)" : "rgba(70,50,40,0.5)";
  [-1, 1].forEach(sd => {
    vStroke([cx + sh + sd * 6, cy + 8, cx + sh + sd * 18, cy + 5.5], wc, 1);
    vStroke([cx + sh + sd * 6, cy + 9.6, cx + sh + sd * 18, cy + 11], wc, 1);
  });
}
function drawZzz(x, y) {
  if (REDUCE || ((animT * 0.8) % 2) >= 1.2) return;
  [[0, 0, 5], [9, -12, 6.5], [20, -26, 8]].forEach(([dx, dy, r]) => {
    vStroke([x + dx - r / 2, y + dy - r / 2, x + dx + r / 2, y + dy - r / 2, x + dx - r / 2, y + dy + r / 2, x + dx + r / 2, y + dy + r / 2], "#8a867c", 1.8);
  });
}
function drawCrown(cx, cy) {
  /* Spyro's small crown: red velvet cap, gold band and points. */
  vPath(() => { ctx.moveTo(cx - 10, cy); ctx.quadraticCurveTo(cx - 12, cy - 12, cx, cy - 13); ctx.quadraticCurveTo(cx + 12, cy - 12, cx + 10, cy); ctx.closePath(); }, "#b81c24", INK, 1.5);
  vPoly([cx - 11, cy + 2, cx - 11.5, cy - 8, cx - 6, cy - 3, cx, cy - 11, cx + 6, cy - 3, cx + 11.5, cy - 8, cx + 11, cy + 2], "#d4af37", INK, 1.5);
  vStroke([cx, cy - 11, cx, cy - 16], "#d4af37", 2.2);
  vStroke([cx - 2.6, cy - 14, cx + 2.6, cy - 14], "#d4af37", 2.2);
  vEll(cx, cy - 1, 1.8, 1.8, "#d1202f");
  vEll(cx - 6.5, cy - 0.5, 1.2, 1.2, "#2a7ad1");
  vEll(cx + 6.5, cy - 0.5, 1.2, 1.2, "#2a9a4a");
}

function drawCat(c) {
  const k = CAT_LOOKS[c.id] || CAT_LOOKS.tilly;
  k.id = c.id;
  const walking = !REDUCE && c.target && c.wait <= 0;
  const x = Math.round(c.x), y = Math.round(c.y);
  const L = c.facing === "l" ? -1 : 1;
  const long = k.fur === "long";
  const loaf = !c.target && c.spot && (c.spot.clock || (c.spot.sofa && c.id === "arthur"));
  charBegin();
  ctx.translate(x, y);
  ctx.scale(k.sx, k.sy);
  ctx.translate(-x, -y);
  if (loaf) {
    /* A loaf: paws tucked, tail wrapped round, eyes shut. */
    vShadow(x, y, 40);
    catTail([x + 30, y - 8, x + 42, y, x + 24, y + 7, x - 2, y + 7], k, 9);
    catBodyV(x + 6, y - 16, 34, 18, k, { n: 18, r: 6.5, from: Math.PI * 0.9, to: Math.PI * 2.1 });
    vEll(x - 14, y + 1, 9.5, 4.8, k.paw, INK, 1.5);
    vEll(x + 4, y + 1, 9.5, 4.8, k.paw, INK, 1.5);
    if (long) vEll(x - 6, y - 8, 16, 8, k.ruff);
    catHeadV(x - 14, y - 30, 0, k, { sleep: true });
    drawZzz(x + 20, y - 56);
    charEnd();
    return;
  }
  if (walking) {
    /* Side-on trot: four legs in a diagonal gait, tail up. */
    const ph = c.walkT * 12, sw = Math.sin(ph);
    vShadow(x, y, 32);
    catTail([x - L * 24, y - 28, x - L * 42, y - 36, x - L * 42, y - 58], k, 7);
    const legs = [[-L * 16, sw], [L * 14, -sw]];
    legs.forEach(([dx, s2]) => vLimb([x + dx - 4, y - 18, x + dx - 4 - L * s2 * 6, y - 3], 7, dark(k.leg, 0.08), INK));
    catBodyV(x, y - 24, 29, 15, k, { n: 13, r: 6.5, from: Math.PI * 0.05, to: Math.PI * 1.95 });
    if (long) vEll(x + L * 15, y - 21, 11, 11, k.ruff);
    if (k.legStripe) legs.forEach(([dx]) => vStroke([x + dx - 5, y - 12, x + dx + 3, y - 12], k.legStripe, 1.6));
    legs.forEach(([dx, s2]) => {
      const fx = x + dx + 4 + L * s2 * 6;
      vLimb([x + dx + 4, y - 16, fx, y - 3], 7, k.leg, INK);
      vEll(fx + L * 2, y - 2, 5.4, 3.2, k.paw, INK, 1.5);
    });
    catHeadV(x + L * 24, y - 42, L, k, {});
    charEnd();
    return;
  }
  /* Sitting up, facing us. Spyro on a desk wears his crown. */
  vShadow(x, y, 29);
  catTail([x - L * 20, y - 8, x - L * 36, y - 6, x - L * 40, y - 22, x - L * 34, y - 38], k, 7);
  catBodyV(x, y - 21, 28, 22, k, { n: 15, r: 7.5, from: Math.PI * 0.0, to: Math.PI * 1.0 });
  if (long) {
    fluffRing(x, y - 31, 18, 12, k.ruff, 9, 6.5, Math.PI * 0.05, Math.PI * 0.95);
    vEll(x, y - 31, 19, 12, k.ruff);
  }
  vLimb([x - 9, y - 18, x - 9.5, y - 5], 8, k.leg, INK);
  vLimb([x + 9, y - 18, x + 9.5, y - 5], 8, k.leg, INK);
  if (k.legStripe) [-1, 1].forEach(sd => { vStroke([x + sd * 9 - 3.5, y - 13, x + sd * 9 + 3.5, y - 13], k.legStripe, 1.6); vStroke([x + sd * 9 - 3.5, y - 9, x + sd * 9 + 3.5, y - 9], k.legStripe, 1.6); });
  vEll(x - 9.5, y - 2, 6.6, 4, k.paw, INK, 1.5);
  vEll(x + 9.5, y - 2, 6.6, 4, k.paw, INK, 1.5);
  if (long) fluffRing(x, y - 4, 12, 3, k.paw, 3, 3.6, Math.PI * 0.2, Math.PI * 0.8);
  catHeadV(x, y - 48, L * 0.5, k, {});
  if (c.id === "spyro" && c.deskSit) drawCrown(x, y - 64);
  charEnd();
}

const GLYPH_ADV = 12, GLYPH_H = 14; /* 5×7 cells at 2px, with a 2px gap */
const GLYPHS = {
  A:[0b01110,0b10001,0b10001,0b11111,0b10001,0b10001,0b10001],
  B:[0b11110,0b10001,0b10001,0b11110,0b10001,0b10001,0b11110],
  C:[0b01110,0b10001,0b10000,0b10000,0b10000,0b10001,0b01110],
  D:[0b11110,0b10001,0b10001,0b10001,0b10001,0b10001,0b11110],
  E:[0b11111,0b10000,0b10000,0b11110,0b10000,0b10000,0b11111],
  F:[0b11111,0b10000,0b10000,0b11110,0b10000,0b10000,0b10000],
  G:[0b01110,0b10001,0b10000,0b10111,0b10001,0b10001,0b01110],
  H:[0b10001,0b10001,0b10001,0b11111,0b10001,0b10001,0b10001],
  I:[0b11111,0b00100,0b00100,0b00100,0b00100,0b00100,0b11111],
  J:[0b00111,0b00010,0b00010,0b00010,0b00010,0b10010,0b01100],
  K:[0b10001,0b10010,0b10100,0b11000,0b10100,0b10010,0b10001],
  L:[0b10000,0b10000,0b10000,0b10000,0b10000,0b10000,0b11111],
  M:[0b10001,0b11011,0b10101,0b10101,0b10001,0b10001,0b10001],
  N:[0b10001,0b11001,0b10101,0b10011,0b10001,0b10001,0b10001],
  O:[0b01110,0b10001,0b10001,0b10001,0b10001,0b10001,0b01110],
  P:[0b11110,0b10001,0b10001,0b11110,0b10000,0b10000,0b10000],
  Q:[0b01110,0b10001,0b10001,0b10001,0b10101,0b10010,0b01101],
  R:[0b11110,0b10001,0b10001,0b11110,0b10100,0b10010,0b10001],
  S:[0b01111,0b10000,0b10000,0b01110,0b00001,0b00001,0b11110],
  T:[0b11111,0b00100,0b00100,0b00100,0b00100,0b00100,0b00100],
  U:[0b10001,0b10001,0b10001,0b10001,0b10001,0b10001,0b01110],
  V:[0b10001,0b10001,0b10001,0b10001,0b10001,0b01010,0b00100],
  W:[0b10001,0b10001,0b10001,0b10101,0b10101,0b10101,0b01010],
  X:[0b10001,0b10001,0b01010,0b00100,0b01010,0b10001,0b10001],
  Y:[0b10001,0b10001,0b01010,0b00100,0b00100,0b00100,0b00100],
  Z:[0b11111,0b00001,0b00010,0b00100,0b01000,0b10000,0b11111],
  "0":[0b01110,0b10001,0b10011,0b10101,0b11001,0b10001,0b01110],
  "1":[0b00100,0b01100,0b00100,0b00100,0b00100,0b00100,0b01110],
  "2":[0b01110,0b10001,0b00001,0b00010,0b00100,0b01000,0b11111],
  "3":[0b01110,0b10001,0b00001,0b00110,0b00001,0b10001,0b01110],
  "4":[0b00010,0b00110,0b01010,0b10010,0b11111,0b00010,0b00010],
  "5":[0b11111,0b10000,0b11110,0b00001,0b00001,0b10001,0b01110],
  "6":[0b00110,0b01000,0b10000,0b11110,0b10001,0b10001,0b01110],
  "7":[0b11111,0b00001,0b00010,0b00100,0b01000,0b01000,0b01000],
  "8":[0b01110,0b10001,0b10001,0b01110,0b10001,0b10001,0b01110],
  "9":[0b01110,0b10001,0b10001,0b01111,0b00001,0b00010,0b01100],
  "!":[0b00100,0b00100,0b00100,0b00100,0b00100,0b00000,0b00100],
  "?":[0b01110,0b10001,0b00001,0b00010,0b00100,0b00000,0b00100],
  "'":[0b00100,0b00100,0b01000,0b00000,0b00000,0b00000,0b00000],
  ".":[0b00000,0b00000,0b00000,0b00000,0b00000,0b00000,0b00100],
  ":":[0b00000,0b00100,0b00000,0b00000,0b00100,0b00000,0b00000],
  "-":[0b00000,0b00000,0b00000,0b11111,0b00000,0b00000,0b00000],
  "+":[0b00000,0b00100,0b00100,0b11111,0b00100,0b00100,0b00000],
};
function drawGlyph(x, y, ch, color) {
  const bits = GLYPHS[ch];
  if (!bits) return GLYPH_ADV;
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 5; col++) {
      if (bits[row] & (1 << (4 - col))) p(x + col * 2, y + row * 2, 2, 2, color);
    }
  }
  return GLYPH_ADV;
}
function labelWidth(text) {
  const s = String(text || "");
  return s.length ? s.length * GLYPH_ADV - 2 : 0;
}
function drawLabel(cx, y, text, color) {
  const s = String(text || "").toUpperCase();
  const w = labelWidth(s);
  let x = Math.round(cx - w / 2);
  for (const ch of s) x += drawGlyph(x, y, ch, color);
}

function drawFrame() {
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  applyWorldTransform();
  if (EMBED) {
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
  desks.forEach(d => sprites.push({ y: d.y + sx(20), draw: () => drawDesk(d) }));
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
      drawCat(c);
      c.x = ox; c.y = oy;
    }
  }));
  sprites.sort((a, b) => a.y - b.y);
  sprites.forEach(s => s.draw());
  if (!EMBED) {
    desks.forEach(d => {
      if (d.private) return;
      const w = labelWidth(d.staff.tag) + 8;
      const ly = d.y + sx(28);
      p(d.cx - w / 2, ly, w, 21, "#f4f0e4");
      p(d.cx - w / 2, ly, w, 3, "#3d2a1c");
      drawLabel(d.cx, ly + 3, d.staff.tag, "#141414");
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
  darts.stuck = [{ x: BOARD.cx - sx(2), y: BOARD.cy - sx(3) }, { x: BOARD.cx + sx(1), y: BOARD.cy - sx(4) }, { x: BOARD.cx - sx(1), y: BOARD.cy - sx(5) }];
  const clock = CAT_SPOTS.find(s => s.clock);
  const poses = [
    { x: clock ? clock.x : CLOCK.cx, y: clock ? clock.y : sx(136), spot: clock },
    { x: sx(540), y: sx(412), spot: CAT_SPOTS.find(s => s.x === sx(540)) }
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
    const pose = c.id === "arthur" ? poses[0] : c.id === "dexter" ? poses[1] : null;
    if (!pose) {
      c.x = c.spot.x;
      c.y = c.spot.y;
      return;
    }
    c.x = pose.x;
    c.y = pose.y;
    if (pose.spot) c.spot = pose.spot;
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
      k.y = k.desk.chairY + sx(6);
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
  /* The three younger Ragdolls wander about too. */
  cats.push(makeCat("tilly", 3));
  cats.push(makeCat("trixie", 4));
  cats.push(makeCat("daisy", 5));
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
    if (EMBED) {
      return {
        x: (ev.clientX - r.left) * (EMBED_W / r.width) + EMBED_CAM_X,
        y: (ev.clientY - r.top) * (EMBED_H / r.height) + EMBED_CAM_Y
      };
    }
    return {
      x: (ev.clientX - r.left) * (W / r.width),
      y: (ev.clientY - r.top) * (H / r.height)
    };
  }
  function hitAt(pt) {
    if (!pt) return null;
    const hits = [];
    people.forEach(pr => {
      const top = isWorkingPose(pr) ? sx(30) : (pr.staff.kind === "reggie" ? sx(56) : pr.staff.kind === "keith" ? sx(52) : sx(48));
      if (pt.x >= pr.x - sx(12) && pt.x <= pr.x + sx(12) && pt.y >= pr.y - top && pt.y <= pr.y + sx(4)) {
        hits.push({ y: pr.y, kind: "person", who: pr });
      }
    });
    cats.forEach(c => {
      const top = c.id === "spyro" && c.deskSit ? sx(30) : sx(22);
      if (pt.x >= c.x - sx(14) && pt.x <= c.x + sx(14) && pt.y >= c.y - top && pt.y <= c.y + sx(4)) {
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
    const title = staff ? staff.name : (CAT_NAMES[id] || id);
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

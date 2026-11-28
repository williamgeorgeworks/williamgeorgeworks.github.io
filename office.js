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

function drawProp(px, py, kind, facing) {
  if (kind === "clipboard") {
    box(px, py, 21, 27, "#c4a574", "#141414");
    p(px + 3, py + 6, 15, 18, "#f4f0e4");
    p(px + 6, py, 9, 6, "#8a6a40");
  } else if (kind === "envelope") {
    box(px, py + 6, 27, 18, "#f4f0e4", "#141414");
    p(px, py + 6, 27, 3, "#1e3a5f");
    p(px + 3, py + 9, 21, 3, "#1e3a5f");
  } else if (kind === "book") {
    box(px, py, 24, 27, "#7a1f2b", "#141414");
    p(px + 18, py + 3, 3, 21, "#f2e6d0");
    p(px + 3, py + 3, 12, 3, "#f2e6d0");
  } else if (kind === "joystick") {
    box(px, py + 15, 27, 15, "#141414", "#141414");
    p(px + 9, py, 9, 18, "#c0c0c0");
    box(px + 6, py - 9, 15, 12, "#e23d4a", "#141414");
  } else if (kind === "basket") {
    box(px, py, 27, 21, "#c0c0c0", "#141414");
    p(px + 3, py + 3, 21, 12, "#e07a2f");
    p(px + 6, py + 6, 9, 6, "#f4c078");
  } else if (kind === "spool") {
    box(px, py, 21, 27, "#e07a2f", "#141414");
    p(px + 3, py + 6, 15, 15, "#22409a");
    p(px + 6, py + 9, 9, 6, "#4a6ab0");
  } else if (kind === "duck") {
    p(px, py + 9, 24, 15, "#f2c14e");
    p(px + 3, py + 12, 9, 6, "#f8dc80");
    p(px + 18, py, 15, 15, "#f2c14e");
    p(px + 30, py + 6, 9, 6, "#e07a2f");
    p(px + 24, py + 6, 6, 6, "#141414");
  } else if (kind === "reel") {
    box(px, py, 27, 27, "#2a2a2a", "#141414");
    p(px + 3, py + 3, 21, 21, "#d4af37");
    p(px + 9, py + 9, 9, 9, "#2a2a2a");
    p(px + 24, py + 6, 9, 15, "#3d2a1c");
  } else if (kind === "coin") {
    /* Penny's coin: every few seconds it spins on the spot, then sits still again. */
    const spin = !REDUCE && ((animT * 0.55) % 7) < 1.1;
    const phase = spin ? Math.abs(Math.cos(animT * 10)) : 1;
    const cw = Math.max(1, Math.round(9 * phase));
    const cx = px + 4 - Math.floor(cw / 2);
    p(cx + 3, py, cw - 6, 27, "#d4af37");
    p(cx, py + 6, cw, 15, "#d4af37");
    if (cw > 3) {
      p(cx + Math.floor(cw / 2), py + 6, 3, 15, "#f2e6a0");
      if (cw > 5) p(cx + Math.floor(cw / 2), py + 9, 3, 9, "#8a6a20");
    }
  } else if (kind === "whistle") {
    box(px, py + 6, 24, 12, "#c0c0c0", "#141414");
    p(px + 24, py + 9, 9, 6, "#c0c0c0");
    p(px + 6, py, 9, 9, "#c45c26");
  } else if (kind === "badge") {
    p(px + 3, py, 21, 6, "#c0c0c0");
    p(px, py + 6, 27, 15, "#c0c0c0");
    p(px + 3, py + 21, 21, 6, "#c0c0c0");
    p(px + 6, py + 6, 15, 15, "#1b2b1a");
    p(px + 9, py + 9, 9, 6, "#d4af37");
  } else if (kind === "megaphone") {
    p(px, py + 9, 12, 12, "#7a1a5c");
    p(px + 9, py + 3, 9, 24, "#7a1a5c");
    p(px + 18, py, 12, 30, "#e040fb");
    p(px + 3, py + 21, 9, 9, "#1a1a1a");
  } else if (kind === "teacup") {
    box(px, py + 9, 21, 15, "#f4f0e4", "#141414");
    p(px + 3, py + 12, 15, 9, "#c5a572");
    p(px + 21, py + 12, 9, 9, "#f4f0e4");
    p(px + 6, py, 6, 9, "#d8d4c8");
    p(px + 15, py + 3, 6, 6, "#d8d4c8");
  } else if (kind === "crate") {
    box(px, py + 9, 30, 21, "#c4a574", "#141414");
    p(px + 3, py + 15, 24, 3, "#8a6a40");
    p(px + 6, py, 9, 12, "#d4b896");
    p(px + 15, py + 3, 12, 9, "#b08956");
    p(px + 9, py + 6, 6, 6, "#8a6a40");
  } else if (kind === "grant") {
    box(px, py + 12, 18, 18, "#c4a574", "#141414");
    p(px + 3, py + 15, 12, 12, "#a8875a");
    p(px + 6, py + 6, 6, 9, "#8a6a40");
    p(px + 12, py, 18, 18, "#a8d4e8");
    p(px + 15, py + 3, 12, 12, "#d4e8f4");
    p(px + 27, py + 15, 9, 6, "#d4af37");
  } else if (kind === "trophy") {
    box(px, py, 27, 21, "#d4af37", "#141414");
    p(px + 3, py + 3, 21, 15, "#f2e6a0");
    p(px + 9, py + 6, 3, 9, "#1a1a1a");
    p(px + 12, py + 6, 6, 9, "#1a1a1a");
    p(px + 15, py + 9, 3, 3, "#1a1a1a");
  } else if (kind === "tablet") {
    /* Kraken Keith's tablet: the chart flips from a green rise to a red dip. */
    const up = REDUCE || ((animT * 0.35 | 0) % 2 === 0);
    box(px, py, 30, 27, "#1a1a1a", "#141414");
    p(px + 3, py + 3, 24, 21, up ? "#0e1a14" : "#1a0e0e");
    const col = up ? "#3dff7a" : "#d1202f";
    const bars = up ? [2, 3, 3, 5, 4, 6] : [6, 5, 5, 3, 4, 2];
    bars.forEach((h, i) => p(px + 6 + i, py + 24 - h, 3, Math.max(3, h - 3), col));
  } else if (kind === "quill") {
    p(px + 9, py, 12, 15, "#f4f0e4");
    p(px + 12, py + 3, 6, 9, "#ffffff");
    p(px + 9, py + 12, 6, 27, "#e8e0d0");
    p(px + 9, py + 36, 3, 9, "#3d2a1c");
  }
}

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
  const jump = (!REDUCE && cele) ? Math.round(Math.abs(Math.sin(pr.celeT * 10)) * sx(8)) : 0;
  const bob = moving ? (frame === 1 ? 0 : S) : idleBob(pr);
  const x = Math.round(pr.x);
  let y = Math.round(pr.y - jump + bob);
  const sit = isSeated(pr);
  const left = pr.facing === "l";
  shadow(x - 24, Math.round(pr.y) + 6, 48, 15);

  if (work) {
    /* Seated, back to us, facing the monitor. */
    box(x - 24, y - 42, 48, 42, s.body, "#141414");
    p(x - 21, y - 39, 18, 12, lite(s.body, 0.2));
    if (s.id === "frank") p(x - 24, y - 24, 48, 24, s.accent);
    /* head from behind */
    box(x - 18, y - 78, 36, 36, s.skin, "#141414");
    p(x - 15, y - 75, 12, 12, lite(s.skin, 0.2));
    if (s.prop === "hat") {
      box(x - 24, y - 90, 48, 18, s.accent, "#141414");
      p(x - 18, y - 99, 36, 12, s.accent);
      p(x - 15, y - 96, 12, 6, lite(s.accent, 0.3));
    } else {
      p(x - 18, y - 90, 36, 18, s.hair);
      p(x - 18, y - 90, 36, 3, "#141414");
    }
    if (s.prop === "headphones") {
      p(x - 27, y - 72, 9, 21, "#111");
      p(x + 18, y - 72, 9, 21, "#111");
      p(x - 27, y - 90, 54, 9, "#111");
    }
    if (s.prop === "cloud") {
      p(x - 24, y - 120, 21, 15, s.accent);
      p(x - 15, y - 132, 33, 18, s.accent);
      p(x + 12, y - 117, 21, 15, s.accent);
    }
    if (s.prop === "bird") {
      p(x + 18, y - 96, 24, 15, s.accent);
      p(x + 39, y - 93, 9, 6, "#e07a2f");
    }
    const tap = (!REDUCE && ((pr.typeT * 6 | 0) % 2)) ? S : 0;
    paintHand(x - 36, y - 27, s.skin, true);
    paintHand(x + 18, y - 27 + tap, s.skin, false);
    return;
  }

  /* legs + shoes, 3-frame walk */
  const shoe = "#2a1c14";
  const trouser = dark(s.body, 0.45);
  if (sit) {
    drawSeatedLegs(x, y, trouser, shoe);
    y += SIT_DROP;
  } else if (frame === 1) {
    p(x - 15, y - 30, 15, 30, trouser);
    p(x + 3, y - 30, 15, 30, trouser);
    p(x - 15, y, 15, 9, shoe);
    p(x + 3, y, 15, 9, shoe);
  } else if (frame === 2) {
    p(x - 18, y - 24, 15, 24, trouser);
    p(x + 6, y - 36, 15, 36, trouser);
    p(x - 21, y, 18, 9, shoe);
    p(x + 6, y, 15, 9, shoe);
  } else {
    p(x - 18, y - 36, 15, 36, trouser);
    p(x + 6, y - 24, 15, 24, trouser);
    p(x - 18, y, 15, 9, shoe);
    p(x + 9, y, 18, 9, shoe);
  }
  /* body */
  box(x - 21, y - 72, 42, 45, s.body, "#141414");
  p(x - 18, y - 69, 18, 15, lite(s.body, 0.22));
  p(x + 9, y - 48, 9, 18, dark(s.body, 0.18));
  if (s.id === "frank") {
    p(x - 21, y - 48, 42, 21, s.accent);
    p(x - 18, y - 48, 36, 3, lite(s.accent, 0.25));
  }
  /* head + face */
  box(x - 18, y - 108, 36, 36, s.skin, "#141414");
  p(x - 15, y - 105, 15, 12, lite(s.skin, 0.25));
  p(x + 6, y - 90, 9, 15, dark(s.skin, 0.12));
  p(x - 18, y - 117, 36, 15, s.hair);
  p(x - 18, y - 117, 36, 3, "#141414");
  p(x - 18, y - 117, 3, 15, "#141414");
  p(x + 15, y - 117, 3, 15, "#141414");
  if (s.prop === "hat") {
    box(x - 24, y - 123, 48, 18, s.accent, "#141414");
    p(x - 18, y - 132, 36, 12, s.accent);
    p(x - 15, y - 129, 12, 6, lite(s.accent, 0.3));
  }
  if (s.prop === "headphones") {
    p(x - 24, y - 96, 9, 21, s.accent);
    p(x + 15, y - 96, 9, 21, s.accent);
    p(x - 24, y - 114, 48, 9, "#111");
  }
  /* eyes, brows, a glint, and a little mouth — not just 3× the old squares. */
  paintEyes(x, y - 90, left);
  if (pr.glanceT > 0) {
    p(x + (left ? -27 : 21), y - 120, 6, 12, "#8ec8e6");
  } else {
    paintMouth(x, y - 75);
  }
  if (s.prop === "cloud") {
    p(x - 24, y - 150, 21, 15, s.accent);
    p(x - 15, y - 162, 33, 18, s.accent);
    p(x + 12, y - 147, 21, 15, s.accent);
    p(x - 3, y - 138, 12, 9, s.accent);
  }
  if (s.prop === "bird") {
    const bx = left ? x - 12 : x + 6;
    p(bx, y - 132, 24, 15, s.accent);
    p(bx + (left ? -9 : 21), y - 129, 9, 6, "#e07a2f");
  }
  const held = ["clipboard", "envelope", "book", "joystick", "basket", "spool", "duck", "reel", "coin", "whistle", "badge", "megaphone", "teacup", "crate", "grant", "trophy", "quill"];
  const armX = left ? x - 11 : x + 7;
  p(armX, y - 66, 12, 30, s.skin);
  if (held.includes(s.prop)) drawProp(left ? x - 48 : x + 27, y - 60, s.prop, pr.facing);
  if (cele) {
    p(x - 36, y - 108 - Math.min(jump, 12), 12, 24, s.skin);
    p(x + 24, y - 114 - Math.min(jump, 12), 12, 24, s.skin);
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
  const jump = (!REDUCE && cele) ? Math.round(Math.abs(Math.sin(pr.celeT * 10)) * sx(8)) : 0;
  const bob = moving ? (frame === 1 ? 0 : S) : idleBob(pr);
  const x = Math.round(pr.x);
  let y = Math.round(pr.y - jump + bob);
  const sit = isSeated(pr);
  const left = pr.facing === "l";
  const skin = "#8a5cc4", skinD = "#6a3fa0", skinL = "#a87ad8", sucker = "#e8a0b8";
  const vest = "#1e2a4a", gold = "#d4af37";
  shadow(x - 27, Math.round(pr.y) + 6, 54, 15);

  if (work) {
    /* Seated, back to us: waistcoat, the back of a large purple head, two tentacles typing. */
    box(x - 24, y - 42, 48, 42, vest, "#141414");
    p(x - 21, y - 39, 15, 12, lite(vest, 0.2));
    p(x - 18, y - 105, 36, 9, skin);
    p(x - 18, y - 105, 36, 3, "#141414");
    box(x - 24, y - 99, 48, 57, skin, "#141414");
    p(x - 18, y - 93, 15, 21, skinL);
    p(x + 9, y - 87, 3, 3, skinD);
    p(x - 6, y - 75, 3, 3, skinD);
    p(x - 30, y - 75, 6, 3, "#141414");
    p(x + 24, y - 75, 6, 3, "#141414");
    const tap = (!REDUCE && ((pr.typeT * 6 | 0) % 2)) ? S : 0;
    p(x - 39, y - 27, 18, 9, skin);
    p(x - 45, y - 24, 9, 12, skin);
    p(x + 21, y - 27 + tap, 18, 9, skin);
    p(x + 36, y - 24 + tap, 9, 12, skin);
    return;
  }

  /* Tentacles where the legs would be, with a little wiggle when he walks. */
  if (sit) {
    for (let i = 0; i < 4; i++) {
      p(x - 21 + i * 12, y - 12, 9, 12, skin);
      p(x - 21 + i * 12, y, 9, 3, sucker);
    }
    y += SIT_DROP;
  } else {
    for (let i = 0; i < 4; i++) {
      const tx = x - 7 + i * 4;
      const out = i < 2 ? -1 : 1;
      const sway = moving && ((i + frame) % 2) ? 1 : 0;
      p(tx, y - 36, 9, 27, skin);
      p(tx + out * (3 + sway), y - 12, 9, 9, skin);
      p(tx + out * (6 + sway), y - 3, 9, 6, skin);
      p(tx + out * (3 + sway) + 3, y - 9, 3, 3, sucker);
    }
  }

  /* Navy waistcoat, dark buttons, gold brooch. */
  box(x - 21, y - 72, 42, 42, vest, "#141414");
  p(x - 18, y - 69, 12, 12, lite(vest, 0.2));
  p(x - 3, y - 54, 3, 3, "#0a1020");
  p(x - 3, y - 42, 3, 3, "#0a1020");
  p(x + 6, y - 66, 9, 9, gold);
  p(x + 9, y - 63, 3, 3, "#c47a1a");

  /* The big domed head. */
  p(x - 18, y - 141, 36, 12, skin);
  p(x - 18, y - 144, 36, 3, "#141414");
  p(x - 21, y - 141, 3, 9, "#141414");
  p(x + 18, y - 141, 3, 9, "#141414");
  box(x - 24, y - 132, 48, 60, skin, "#141414");
  p(x - 18, y - 138, 12, 21, skinL);
  p(x + 9, y - 129, 3, 3, skinD);
  p(x + 3, y - 120, 3, 3, skinD);
  p(x - 12, y - 114, 3, 3, skinD);
  /* Round black glasses; the pupils follow where he is looking. */
  const glance = pr.glanceT > 0;
  p(x - 18, y - 105, 15, 15, "#141414");
  p(x + 3, y - 105, 15, 15, "#141414");
  p(x - 15, y - 102, 9, 9, "#fff");
  p(x + 6, y - 102, 9, 9, "#fff");
  p(x - 3, y - 99, 6, 3, "#141414");
  p(x + (left ? -15 : -12), y - 99, 6, 6, "#141414");
  p(x + (left ? 6 : 9), y - 99, 6, 6, "#141414");
  p(x - 18, y - 111, 12, 3, skinD);
  p(x + 6, y - 111, 12, 3, skinD);
  p(x - 6, y - 84, 15, 3, "#141414");
  p(x + 9, y - 87, 3, 3, "#141414");
  /* Face tentacles drooping over the waistcoat. */
  p(x - 15, y - 75, 6, 12, skin);
  p(x - 3, y - 75, 6, 15, skin);
  p(x + 9, y - 75, 6, 9, skin);
  if (glance) p(x + (left ? -30 : 27), y - 138, 6, 12, "#8ec8e6");

  /* The tablet in one tentacle... */
  const armX = left ? x - 11 : x + 7;
  p(armX, y - 66, 12, 30, skin);
  p(armX + 3, y - 42, 3, 3, sucker);
  drawProp(left ? x - 54 : x + 27, y - 63, "tablet", pr.facing);
  /* ...and the gold coin held up in another, unless that tentacle is busy with a mug or a dart. */
  const busy = pr.phase === "idle" && !pr.target && pr.spot &&
    ["kettle", "lounge", "darts", "rods", "canteen", "sofa", "music"].includes(pr.activity);
  if (cele) {
    p(x - 36, y - 108 - Math.min(jump, 12), 12, 30, skin);
    p(x + 24, y - 114 - Math.min(jump, 12), 12, 30, skin);
  } else if (!busy) {
    const ox = left ? x + 7 : x - 11;
    p(ox, y - 81, 12, 30, skin);
    p(ox + 3, y - 66, 3, 3, sucker);
    p(ox - 3, y - 99, 18, 18, "#141414");
    p(ox, y - 96, 12, 12, gold);
    p(ox + 3, y - 93, 6, 6, "#f2d36b");
  }
}

function drawKenneth(pr) {
  const cele = pr.phase === "celebrating";
  const walk = pr.phase === "idle" || pr.phase === "to-desk";
  const work = isWorkingPose(pr);
  const moving = !REDUCE && walk && pr.target;
  const frame = moving ? walkFrame(pr) : 0;
  const jump = (!REDUCE && cele) ? Math.round(Math.abs(Math.sin(pr.celeT * 10)) * sx(8)) : 0;
  const bob = moving ? (frame === 1 ? 0 : S) : idleBob(pr);
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
  shadow(x - 24, Math.round(pr.y) + 6, 48, 15);

  if (work) {
    /* Seated, back to us: black vest, cream collar, cap and a side-feather. */
    box(x - 24, y - 42, 48, 42, vest, "#141414");
    p(x - 12, y - 42, 24, 12, shirt);
    p(x - 3, y - 42, 6, 21, red);
    box(x - 18, y - 84, 36, 42, metal, "#141414");
    p(x - 15, y - 81, 15, 15, lite(metal, 0.22));
    p(x - 27, y - 66, 9, 18, "#2a2a2a");
    p(x + 18, y - 66, 9, 18, "#2a2a2a");
    /* flat cap from behind, 1px red brim, feather off to the left */
    p(x - 18, y - 102, 36, 9, cap);
    box(x - 24, y - 96, 48, 15, cap, "#141414");
    p(x - 21, y - 84, 42, 3, red);
    p(x - 33, y - 126, 6, 30, red);
    p(x - 30, y - 120, 3, 12, lite(red, 0.25));
    p(x - 36, y - 114, 3, 9, dark(red, 0.15));
    const tap = (!REDUCE && ((pr.typeT * 6 | 0) % 2)) ? S : 0;
    p(x - 36, y - 27, 18, 9, silver);
    p(x + 18, y - 27 + tap, 18, 9, silver);
    return;
  }

  const shoe = "#2a1c14";
  const trouser = "#2a2a2a";
  if (sit) {
    drawSeatedLegs(x, y, trouser, shoe);
    y += SIT_DROP;
  } else if (frame === 1) {
    p(x - 15, y - 30, 15, 30, trouser);
    p(x + 3, y - 30, 15, 30, trouser);
    p(x - 15, y, 15, 9, shoe);
    p(x + 3, y, 15, 9, shoe);
  } else if (frame === 2) {
    p(x - 18, y - 24, 15, 24, trouser);
    p(x + 6, y - 36, 15, 36, trouser);
    p(x - 21, y, 18, 9, shoe);
    p(x + 6, y, 15, 9, shoe);
  } else {
    p(x - 18, y - 36, 15, 36, trouser);
    p(x + 6, y - 24, 15, 24, trouser);
    p(x - 18, y, 15, 9, shoe);
    p(x + 9, y, 18, 9, shoe);
  }

  /* black waistcoat over a cream shirt, red tie, Q badge */
  box(x - 21, y - 72, 42, 45, vest, "#141414");
  p(x - 6, y - 72, 12, 15, shirt);
  p(x - 3, y - 72, 6, 27, red);
  p(x, y - 69, 3, 9, lite(red, 0.25));
  p(x + 9, y - 48, 9, 9, red);
  p(x + 12, y - 45, 3, 3, "#f4f0e4");

  /* cream robot head, panel line, ear-cups with a red centre */
  box(x - 18, y - 114, 36, 42, metal, "#141414");
  p(x - 15, y - 111, 15, 15, lite(metal, 0.25));
  p(x - 15, y - 93, 30, 3, dark(metal, 0.18));
  p(x - 27, y - 96, 9, 18, "#2a2a2a");
  p(x + 18, y - 96, 9, 18, "#2a2a2a");
  p(x - 24, y - 90, 6, 6, red);
  p(x + 21, y - 90, 6, 6, red);

  /* thin round glasses, pupils follow facing / a glance at the machine */
  const glance = pr.glanceT > 0;
  p(x - 12, y - 96, 12, 9, "#fff");
  p(x + 3, y - 96, 12, 9, "#fff");
  p(x - 15, y - 99, 18, 3, "#141414");
  p(x - 15, y - 87, 18, 3, "#141414");
  p(x - 15, y - 99, 3, 15, "#141414");
  p(x, y - 99, 3, 15, "#141414");
  p(x, y - 99, 18, 3, "#141414");
  p(x, y - 87, 18, 3, "#141414");
  p(x + 15, y - 99, 3, 15, "#141414");
  const px1 = x + (left ? -sx(3) : -sx(2)) + (glance && !left ? sx(1) : 0);
  const px2 = x + (left ? sx(2) : sx(3)) + (glance && !left ? sx(1) : 0);
  p(px1, y - 93, 5, 5, "#141414");
  p(px2, y - 93, 5, 5, "#141414");
  p(px1 + 1, y - 93, 2, 2, "#f4f0e4");
  p(px2 + 1, y - 93, 2, 2, "#f4f0e4");
  p(x - 3, y - 78, 9, 3, "#141414");

  /* black flat cap, one-pixel red brim, feather off to the left */
  p(x - 18, y - 132, 36, 9, cap);
  p(x - 15, y - 129, 12, 6, "#2e2e2e");
  box(x - 24, y - 126, 48, 15, cap, "#141414");
  p(x - 21, y - 114, 42, 3, red);
  p(x - 33, y - 156, 6, 33, red);
  p(x - 30, y - 150, 3, 12, lite(red, 0.25));
  p(x - 36, y - 144, 3, 12, dark(red, 0.15));

  if (glance) p(x + (left ? -30 : 24), y - 144, 6, 12, "#8ec8e6");
  const armX = left ? x - 11 : x + 7;
  p(armX, y - 66, 12, 30, silver);
  drawProp(left ? x - 48 : x + 27, y - 60, "clipboard", pr.facing);
  if (cele) {
    p(x - 36, y - 108 - Math.min(jump, 12), 12, 24, silver);
    p(x + 24, y - 114 - Math.min(jump, 12), 12, 24, silver);
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
  const jump = (!REDUCE && cele) ? Math.round(Math.abs(Math.sin(pr.celeT * 10)) * sx(8)) : 0;
  const bob = moving ? (frame === 1 ? 0 : S) : idleBob(pr);
  const x = Math.round(pr.x);
  let y = Math.round(pr.y - jump + bob);
  const sit = isSeated(pr);
  const left = pr.facing === "l";
  const metal = terry ? "#d8d4c8" : "#ccc8bc";
  const vest = "#b81c24";
  const shirt = "#f4f0e4";
  shadow(x - 24, Math.round(pr.y) + 6, 48, 15);

  if (work) {
    box(x - 24, y - 42, 48, 42, vest, "#141414");
    p(x - 12, y - 42, 24, 12, shirt);
    if (terry) p(x - 3, y - 42, 6, 24, "#141414");
    else {
      /* bow tie peek */
      p(x - 9, y - 42, 18, 9, "#141414");
    }
    if (terry) {
      box(x - 24, y - 84, 48, 42, metal, "#141414");
      p(x - 21, y - 81, 18, 15, lite(metal, 0.25));
      p(x - 3, y - 102, 6, 18, metal);
      p(x - 9, y - 111, 18, 12, "#d1202f");
      p(x - 6, y - 108, 6, 6, lite("#d1202f", 0.3));
      p(x - 18, y - 69, 15, 15, "#fff");
      p(x + 6, y - 69, 15, 15, "#fff");
      p(x - 15, y - 66, 9, 9, "#141414");
      p(x + 9, y - 66, 9, 9, "#141414");
      p(x - 12, y - 51, 24, 6, "#141414");
    } else {
      box(x - 18, y - 96, 36, 54, metal, "#141414");
      p(x - 15, y - 93, 15, 18, lite(metal, 0.25));
      p(x - 3, y - 108, 6, 15, metal);
      p(x - 12, y - 72, 12, 9, "#fff");
      p(x + 6, y - 72, 12, 9, "#fff");
      p(x - 9, y - 69, 6, 6, "#141414");
      p(x + 9, y - 69, 6, 6, "#141414");
      /* monocle */
      box(x + 3, y - 78, 21, 21, "#14141400", "#141414");
      p(x + 3, y - 78, 21, 3, "#141414");
      p(x + 3, y - 78, 3, 21, "#141414");
      p(x + 21, y - 78, 3, 21, "#141414");
      p(x + 3, y - 60, 21, 3, "#141414");
    }
    const tap = (!REDUCE && ((pr.typeT * 6 | 0) % 2)) ? S : 0;
    p(x - 36, y - 27, 18, 9, metal);
    p(x + 18, y - 27 + tap, 18, 9, metal);
    return;
  }

  /* legs */
  const thigh = "#6a6860";
  if (sit) {
    drawSeatedLegs(x, y, thigh, "#2a1c14");
    y += SIT_DROP;
  } else {
    if (frame === 2) {
      p(x - 18, y - 24, 15, 24, thigh);
      p(x + 6, y - 39, 15, 39, thigh);
    } else if (frame === 1) {
      p(x - 15, y - 30, 15, 30, thigh);
      p(x + 3, y - 30, 15, 30, thigh);
    } else {
      p(x - 18, y - 39, 15, 39, thigh);
      p(x + 6, y - 24, 15, 24, thigh);
    }
    p(x - 18, y, 15, 9, "#2a1c14");
    p(x + 6, y, 15, 9, "#2a1c14");
  }

  if (terry) {
    box(x - 24, y - 72, 48, 45, vest, "#141414");
    p(x - 12, y - 72, 24, 15, shirt);
    p(x - 3, y - 72, 6, 27, "#141414");
    p(x - 21, y - 69, 15, 12, lite(vest, 0.2));
    /* box head */
    box(x - 27, y - 120, 54, 48, metal, "#141414");
    p(x - 24, y - 117, 21, 18, lite(metal, 0.28));
    p(x + 15, y - 102, 9, 24, dark(metal, 0.15));
    /* antenna, red ball */
    p(x - 3, y - 138, 6, 18, metal);
    box(x - 9, y - 150, 18, 15, "#d1202f", "#141414");
    p(x - 6, y - 147, 6, 6, "#f26a6a");
    /* ear discs */
    p(x - 36, y - 108, 9, 24, "#9a968c");
    p(x + 27, y - 108, 9, 24, "#9a968c");
    /* face: big cheerful eyes and smile */
    p(x - 18, y - 105, 18, 18, "#fff");
    p(x + 6, y - 105, 18, 18, "#fff");
    p(x + (left ? -15 : -12), y - 99, 9, 9, "#141414");
    p(x + (left ? 9 : 12), y - 99, 9, 9, "#141414");
    p(x - 12, y - 84, 30, 6, "#141414");
    p(x - 9, y - 81, 24, 6, "#141414");
    p(x - 6, y - 78, 18, 3, "#141414");
  } else {
    /* taller, slimmer */
    box(x - 21, y - 78, 42, 51, vest, "#141414");
    p(x - 12, y - 78, 24, 15, shirt);
    p(x - 9, y - 78, 18, 9, "#141414"); /* bow tie */
    p(x - 3, y - 81, 6, 6, "#141414");
    p(x - 18, y - 75, 12, 12, lite(vest, 0.2));
    /* pocket square */
    p(x + 9, y - 54, 9, 9, "#f4f0e4");
    /* long head */
    box(x - 18, y - 138, 36, 60, metal, "#141414");
    p(x - 15, y - 135, 15, 21, lite(metal, 0.28));
    p(x + 9, y - 114, 6, 30, dark(metal, 0.15));
    p(x - 3, y - 150, 6, 15, metal);
    p(x - 27, y - 120, 9, 21, "#9a968c");
    p(x + 18, y - 120, 9, 21, "#9a968c");
    /* lidded eyes + small smile */
    p(x - 12, y - 114, 12, 9, "#fff");
    p(x + 6, y - 114, 12, 9, "#fff");
    p(x - 9, y - 111, 6, 6, "#141414");
    p(x + 9, y - 111, 6, 6, "#141414");
    p(x - 12, y - 117, 12, 3, "#141414");
    p(x + 6, y - 117, 12, 3, "#141414");
    /* monocle */
    p(x + 3, y - 120, 21, 3, "#141414");
    p(x + 3, y - 120, 3, 21, "#141414");
    p(x + 21, y - 120, 3, 21, "#141414");
    p(x + 3, y - 102, 21, 3, "#141414");
    p(x + 24, y - 102, 3, 24, "#141414");
    p(x - 6, y - 96, 18, 3, "#141414");
  }
  const armX = left ? x - 12 : x + 8;
  p(armX, y - 66, 12, 30, metal);
  if (pr.glanceT > 0) p(x + (left ? -27 : 24), y - 150, 6, 12, "#8ec8e6");
  drawProp(left ? x - 48 : x + 30, y - 66, "quill", pr.facing);
  if (cele) {
    p(x - 39, y - 114 - Math.min(jump, 12), 12, 24, metal);
    p(x + 27, y - 120 - Math.min(jump, 12), 12, 24, metal);
  }
}

function isSeated(pr) {
  return pr.phase === "idle" && !pr.target && !!pr.spot && !!pr.spot.seat && pr.activity === "sofa";
}

function drawSeatedLegs(x, y, trouser, shoe) {
  p(x - 18, y - 12, 15, 12, trouser);
  p(x + 6, y - 12, 15, 12, trouser);
  p(x - 18, y, 15, 6, shoe);
  p(x + 6, y, 15, 6, shoe);
}

function armColour(s) {
  if (s.kind === "kenneth") return "#9a968c";
  if (s.kind === "terry") return "#d8d4c8";
  if (s.kind === "reggie") return "#ccc8bc";
  return s.skin;
}

function drawMug(x, y, band) {
  box(x - 3, y, 18, 18, "#f4f0e4", "#141414");
  p(x, y + 6, 12, 6, band);
  if (!REDUCE) {
    const s = (animT * 1.4 + x * 0.07) % 1;
    p(x + 3, y - 9 - s * 15, 3, 6, "#ffffffaa");
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
  const fx = left ? x + (robot ? sx(8) : sx(7)) : x - (robot ? sx(12) : sx(11));  /* the free hand */
  const arm = armColour(s);
  const band = s.accent || "#d1202f";
  if (kind === "kettle" || kind === "lounge" || (kind === "sofa" && pr.salt % 2 === 0) || (kind === "darts" && spot.waiting)) {
    p(fx, y - 66, 12, 27, arm);
    drawMug(fx, y - 45, band);
  } else if (kind === "darts") {
    /* Throwing arm up, dart in hand, until it has just been thrown. */
    const thrown = !REDUCE && pr.throwT < 0.35;
    if (thrown) {
      p(fx + (left ? -6 : 6), y - 90, 12, 24, arm);
    } else {
      p(fx, y - 102, 12, 36, arm);
      p(fx + 3, y - 117, 3, 15, "#141414");
      p(fx, y - 108, 9, 3, "#d1202f");
    }
  } else if (kind === "rods") {
    const dir = left ? 1 : -1;
    p(fx, y - 66, 12, 27, arm);
    for (let i = 0; i < 20; i++) p(fx + 3 + dir * i, y - 42 - i, 3, 3, i < 4 ? "#3d2a1c" : "#5a5a5a");
    p(fx + dir * 9, y - 51, 9, 9, "#c0c0c0");
    const tipX = fx + sx(1) + dir * sx(19), tipY = y - sx(33);
    const bob = REDUCE ? 0 : Math.round(Math.sin(animT * 2 + pr.salt) * sx(1.5));
    p(tipX, tipY, 3, 48 + bob, "#e8e8e8");
    p(tipX - 3, tipY + 48 + bob, 9, 6, "#d1202f");
    p(tipX - 3, tipY + 54 + bob, 9, 3, "#f4f0e4");
  } else if (kind === "arcade" && !spot.watch) {
    const jig = REDUCE ? 0 : (((animT * 8 + pr.salt) | 0) % 2);
    p(fx, y - 66 + jig, 12, 27, arm);
  } else if (kind === "canteen") {
    p(fx, y - 60, 12, 21, arm);
    p(fx - 9, y - 42, 30, 6, "#f4f0e4");
    p(fx - 9, y - 39, 30, 3, "#9a968c");
    p(fx - 6, y - 51, 6, 9, "#f2c14e");
    p(fx + 3, y - 54, 6, 12, "#e6b23a");
    p(fx + 12, y - 51, 6, 9, "#f2c14e");
  } else if (kind === "music") {
    if (spot.guitar) {
      /* Air guitar, with an actual guitar, which slightly ruins the joke. */
      p(x - 24, y - 54, 48, 9, "#6b3d12");
      box(x - 36, y - 63, 27, 27, "#7a1f2b", "#141414");
      p(x - 27, y - 54, 9, 9, "#141414");
      const strum = REDUCE ? 0 : (((animT * 6) | 0) % 2);
      p(x - 18, y - 48 - strum * 6, 12, 9, arm);
    }
    if (!REDUCE) {
      const t = (animT * 0.7 + pr.salt * 0.37) % 1.6;
      if (t < 1.2) {
        const nx = x + sx(6) + Math.round(Math.sin(t * 5) * sx(2)), ny = Math.round(y - sx(46) - t * sx(12));
        const col = t < 0.9 ? "#f2e6a0" : "#c4b880";
        p(nx, ny, 9, 6, col);
        p(nx + 6, ny - 18, 3, 18, col);
        p(nx + 6, ny - 18, 9, 3, col);
      }
    }
  }
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

function drawArthur(c) {
  const asleep = c.spot && c.spot.clock && !c.target;
  const bob = (!REDUCE && c.target && c.wait <= 0) ? (((c.walkT * 7 | 0) % 2) ? S : 0) : 0;
  const x = Math.round(c.x), y = Math.round(c.y + bob);
  if (asleep) {
    /* A Ragdoll loaf, under the clock. Eyes shut, tail wrapped round. */
    shadow(x - 36, y + 6, 72, 15);
    const cream = "#e8d6b8", hi = "#f4efe4", point = "#6b5348", pointD = "#4a3a34";
    p(x - 39, y - 24, 78, 33, cream);
    p(x - 33, y - 30, 66, 15, hi);
    p(x - 24, y - 21, 48, 21, "#f4efe8");
    p(x - 24, y - 48, 42, 27, cream);
    p(x - 21, y - 51, 15, 15, point);
    p(x + 6, y - 51, 15, 15, point);
    p(x - 21, y - 39, 36, 18, point);
    p(x - 18, y - 30, 30, 9, cream);
    p(x - 15, y - 39, 12, 3, "#3d2a1c");
    p(x + 3, y - 39, 12, 3, "#3d2a1c");
    p(x - 9, y - 27, 12, 6, "#c48a8a");
    p(x + 24, y - 18, 30, 18, point);
    p(x + 42, y - 9, 21, 18, pointD);
    p(x - 33, y + 3, 24, 9, cream);
    p(x + 9, y + 3, 24, 9, cream);
    if (!REDUCE && ((animT * 0.8) % 2) < 1.2) {
      p(x + 24, y - 66, 3, 6, "#9a968c");
      p(x + 30, y - 78, 3, 9, "#9a968c");
      p(x + 36, y - 69, 3, 6, "#9a968c");
    }
    return;
  }
  shadow(x - 30, y + 9, 66, 15);
  const cream = "#e8d6b8";
  const hi = "#f4efe4";
  const point = "#6b5348";
  const pointD = "#4a3a34";
  /* fluffy cream body */
  p(x - 33, y - 33, 66, 42, cream);
  p(x - 27, y - 36, 54, 9, hi);
  p(x - 18, y - 27, 36, 27, "#f4efe8");
  /* head */
  p(x - 21, y - 63, 42, 36, cream);
  p(x - 18, y - 66, 15, 18, point);
  p(x + 6, y - 66, 15, 18, point);
  p(x - 18, y - 54, 36, 27, point);
  p(x - 15, y - 39, 30, 12, cream);
  /* blue Ragdoll eyes */
  p(x - 12, y - 48, 12, 12, "#7ec8e8");
  p(x + 3, y - 48, 12, 12, "#7ec8e8");
  p(x - 9, y - 45, 6, 6, "#141414");
  p(x + 6, y - 45, 6, 6, "#141414");
  p(x - 9, y - 48, 3, 3, "#f4f0e4");
  p(x + 6, y - 48, 3, 3, "#f4f0e4");
  p(x - 6, y - 33, 12, 6, "#c48a8a");
  const tailL = c.facing === "l";
  p(x + (tailL ? 27 : -48), y - 24, 33, 18, point);
  p(x + (tailL ? 45 : -60), y - 12, 24, 27, pointD);
  p(x - 30, y, 18, 12, cream);
  p(x + 12, y, 18, 12, cream);
  p(x - 30, y + 6, 15, 9, point);
  p(x + 15, y + 6, 15, 9, point);
}

function drawSpyro(c) {
  const bob = (!REDUCE && c.target && c.wait <= 0) ? (((c.walkT * 7 | 0) % 2) ? S : 0) : 0;
  const sit = !!c.deskSit;
  const x = Math.round(c.x), y = Math.round(c.y + bob);
  const white = "#f4f0e4", shade = "#d8d4c8", tail = "#c45c26", tailD = "#8a3a10";
  shadow(x - 27, y + 9, 60, 12);
  if (sit) {
    /* Upright on a desk, as the true king of that particular throne. */
    p(x - 21, y - 30, 42, 36, white);
    p(x - 18, y - 27, 15, 18, shade);
    p(x - 18, y - 66, 36, 36, white);
    p(x - 15, y - 69, 12, 15, "#f4c4c4");
    p(x + 6, y - 69, 12, 15, "#f4c4c4");
    p(x - 15, y - 66, 9, 12, white);
    p(x + 6, y - 66, 9, 12, white);
    p(x - 3, y - 69, 6, 6, "#c4a070");
    p(x - 12, y - 48, 9, 9, "#c5d86a");
    p(x + 6, y - 48, 9, 9, "#c5d86a");
    p(x - 9, y - 45, 6, 6, "#141414");
    p(x + 9, y - 45, 6, 6, "#141414");
    p(x - 3, y - 36, 9, 6, "#c48a8a");
    p(x + 21, y - 36, 24, 18, tail);
    p(x + 36, y - 48, 15, 24, tailD);
    /* a very small crown */
    p(x - 12, y - 78, 27, 9, "#d4af37");
    p(x - 12, y - 84, 6, 9, "#d4af37");
    p(x - 3, y - 87, 9, 12, "#d1202f");
    p(x + 9, y - 84, 6, 9, "#d4af37");
    p(x - 3, y - 78, 9, 6, "#e6c200");
    p(x - 18, y, 15, 12, white);
    p(x + 3, y, 15, 12, white);
    return;
  }
  p(x - 30, y - 30, 60, 39, white);
  p(x - 24, y - 33, 48, 12, "#ffffff");
  p(x - 18, y - 24, 36, 24, shade);
  p(x - 18, y - 60, 39, 33, white);
  p(x - 18, y - 63, 15, 15, "#f4c4c4");
  p(x + 6, y - 63, 15, 15, "#f4c4c4");
  p(x - 15, y - 60, 12, 12, white);
  p(x + 6, y - 60, 12, 12, white);
  p(x - 3, y - 63, 6, 6, "#c4a070");
  p(x - 12, y - 45, 12, 12, "#c5d86a");
  p(x + 3, y - 45, 12, 12, "#c5d86a");
  p(x - 9, y - 42, 6, 6, "#141414");
  p(x + 6, y - 42, 6, 6, "#141414");
  p(x - 3, y - 33, 9, 6, "#c48a8a");
  const tailL = c.facing === "l";
  p(x + (tailL ? 24 : -48), y - 24, 33, 18, tail);
  p(x + (tailL ? 42 : -60), y - 42, 18, 27, tailD);
  p(x - 27, y, 18, 12, white);
  p(x + 9, y, 18, 12, white);
}

function drawDexter(c) {
  const bob = (!REDUCE && c.target && c.wait <= 0) ? (((c.walkT * 7 | 0) % 2) ? S : 0) : 0;
  const x = Math.round(c.x), y = Math.round(c.y + bob);
  shadow(x - 33, y + 9, 72, 15);
  /* huge grey ruff */
  p(x - 39, y - 36, 78, 45, "#b8b0a8");
  p(x - 33, y - 42, 66, 18, "#c8c0b8");
  p(x - 24, y - 30, 48, 30, "#d0c8c0");
  /* dark face peeking */
  p(x - 18, y - 60, 39, 36, "#1a1210");
  p(x - 21, y - 72, 18, 18, "#1a1210");
  p(x + 6, y - 72, 18, 18, "#1a1210");
  /* amber eyes */
  p(x - 12, y - 48, 12, 12, "#e6c84a");
  p(x + 6, y - 48, 12, 12, "#e6c84a");
  p(x - 9, y - 45, 6, 6, "#141414");
  p(x + 9, y - 45, 6, 6, "#141414");
  p(x - 9, y - 48, 3, 3, "#fff");
  p(x + 9, y - 48, 3, 3, "#fff");
  p(x - 3, y - 33, 12, 6, "#1a1210");
  const tailL = c.facing === "l";
  p(x + (tailL ? 30 : -54), y - 24, 36, 21, "#2a2420");
  p(x + (tailL ? 48 : -66), y - 12, 24, 24, "#1a1210");
  p(x - 30, y, 18, 12, "#1a1210");
  p(x + 15, y, 18, 12, "#1a1210");
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
      if (c.id === "arthur") drawArthur(c);
      else if (c.id === "spyro") drawSpyro(c);
      else drawDexter(c);
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

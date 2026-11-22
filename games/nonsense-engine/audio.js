/* Original score and one-shot instrument bank for The Nonsense Engine. */
(() => {
  'use strict';

  const storageKey = 'wgw.accord.sound.v1';
  const scenes = {
    menu:    { bpm: 142, kit: 0, bass: 0.58, lead: 0.85, air: 1 },
    route:   { bpm: 150, kit: 1, bass: 0.68, lead: 0.75, air: 1 },
    battle:  { bpm: 174, kit: 2, bass: 1,    lead: 0.86, air: 0.75 },
    elite:   { bpm: 174, kit: 3, bass: 1.08, lead: 0.94, air: 0.72 },
    boss:    { bpm: 174, kit: 4, bass: 1.12, lead: 0.95, air: 0.85 },
    reward:  { bpm: 145, kit: 1, bass: 0.65, lead: 1,    air: 1 },
    victory: { bpm: 160, kit: 2, bass: 0.82, lead: 1,    air: 1 },
    defeat:  { bpm: 120, kit: 0, bass: 0.48, lead: 0.60, air: 1 }
  };
  // Bass, four upper voices, then the notes used by the pier-organ melody.
  const chords = [
    [38, [53, 57, 60, 64], [69, 72, 74, 76, 77, 81]], // Dm9
    [34, [53, 57, 62, 65], [69, 70, 72, 74, 77, 81]], // Bbmaj7
    [41, [52, 57, 60, 67], [67, 69, 72, 76, 77, 79]], // Fmaj9
    [36, [52, 55, 62, 65], [67, 70, 72, 74, 76, 79]], // Cadd9/11
    [31, [50, 53, 57, 62], [65, 67, 69, 72, 74, 77]], // Gm9
    [33, [49, 55, 58, 64], [67, 69, 70, 73, 76, 79]]  // A7b9
  ];
  const progressions = {
    main: [0, 0, 1, 1, 2, 3, 4, 5],
    boss: [0, 5, 0, 1, 4, 5, 1, 5],
    prize: [2, 2, 3, 3, 0, 1, 4, 3],
    hush: [0, 0, 4, 4, 1, 1, 5, 5]
  };
  // Four call-and-response lines. Triples are sixteenth, scale index, length.
  const tunes = [
    [[0, 2, 2], [3, 4, 1], [6, 3, 2], [10, 1, 3], [15, 0, 1]],
    [[2, 2, 2], [5, 0, 2], [9, 1, 1], [11, 2, 3]],
    [[0, 4, 3], [5, 5, 1], [7, 4, 2], [10, 2, 1], [13, 3, 2]],
    [[1, 3, 2], [4, 2, 2], [8, 1, 3], [14, 0, 2]]
  ];
  const basslines = [
    [[0, 0, 3], [5, 0, 2], [8, 7, 1], [10, 12, 2], [14, 7, 1]],
    [[0, 0, 4], [6, 12, 1], [7, 7, 2], [11, 0, 2], [15, 7, 1]],
    [[0, 0, 2], [3, 7, 1], [6, 12, 3], [10, 0, 3], [14, 7, 2]],
    [[0, 0, 3], [5, 7, 2], [8, 12, 2], [11, 7, 1], [13, 0, 2]]
  ];
  const kickPatterns = [[0, 7, 10], [0, 6, 10, 15], [0, 3, 9, 10], [0, 7, 10, 13]];
  const ghostPatterns = [[3, 9, 14], [2, 7, 11], [6, 11, 15], [3, 8, 14]];
  const sixteenth = bpm => 60 / bpm / 4;
  const hz = note => 440 * Math.pow(2, (note - 69) / 12);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  let settings = { muted: false, volume: 0.52 };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved) {
      if (typeof saved.muted === 'boolean') settings.muted = saved.muted;
      if (Number.isFinite(saved.volume)) settings.volume = clamp(saved.volume, 0, 1);
    }
  } catch (_) { /* A private or sandboxed frame can still play audio. */ }

  let ctx, master, music, drums, synth, effects, send, noiseBuffer, organWave, bassWave;
  let interval = 0, clock = 0, step = 0, generation = 0;
  let activated = false, scene = 'menu';
  let lastDraw = -10, lastClick = -10;
  const hidden = () => typeof document !== 'undefined' && document.hidden;

  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(settings)); } catch (_) {}
  }
  function gain(value, dest) {
    const node = ctx.createGain();
    node.gain.value = value;
    node.connect(dest);
    return node;
  }
  function busVolume() {
    // Perceptual volume curve with a hard ceiling for layered card effects.
    return settings.muted || hidden() ? 0 : 0.82 * Math.pow(settings.volume, 1.35);
  }
  function createGraph() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    ctx = new AudioContext({ latencyHint: 'interactive' });
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -11;
    limiter.knee.value = 8;
    limiter.ratio.value = 7;
    limiter.attack.value = 0.004;
    limiter.release.value = 0.16;
    limiter.connect(ctx.destination);
    master = gain(0, limiter);
    music = gain(0.87, master);
    drums = gain(0.93, music);
    synth = gain(0.82, music);
    effects = gain(0.76, master);

    const echo = ctx.createDelay(1);
    echo.delayTime.value = 3 * sixteenth(174);
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 2600;
    echo.connect(damp);
    const feedback = gain(0.23, echo);
    damp.connect(feedback);
    const echoReturn = gain(0.35, music);
    damp.connect(echoReturn);
    send = gain(1, echo);

    const samples = Math.ceil(ctx.sampleRate * 1.2);
    noiseBuffer = ctx.createBuffer(1, samples, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let random = 1937149;
    for (let i = 0; i < samples; i++) {
      random = (Math.imul(1664525, random) + 1013904223) >>> 0;
      data[i] = random / 2147483648 - 1;
    }
    const wave = amplitudes => ctx.createPeriodicWave(
      new Float32Array(amplitudes.length), new Float32Array(amplitudes));
    organWave = wave([0, 1, 0.36, 0.18, 0.39, 0.08, 0.05, 0.027, 0.10]);
    bassWave = wave([0, 1, 0.39, 0.28, 0.14, 0.13, 0.07, 0.04, 0.03]);
    return true;
  }

  // Disconnect short-lived nodes only after a voice has finished its tail.
  function cleanOnEnd(source, nodes) {
    source.onended = () => {
      source.disconnect();
      for (const node of nodes) node.disconnect();
    };
  }
  function position(input, destination, pan, owned) {
    if (!pan || !ctx.createStereoPanner) { input.connect(destination); return; }
    const stereo = ctx.createStereoPanner();
    stereo.pan.value = pan;
    input.connect(stereo);
    stereo.connect(destination);
    owned.push(stereo);
  }
  function voice(type, freq, when, duration, level, options = {}) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    const end = when + duration;
    const attack = Math.min(options.attack || 0.005, duration / 3);
    osc.frequency.setValueAtTime(freq, when);
    if (options.slide) osc.frequency.exponentialRampToValueAtTime(options.slide, end);
    if (type === 'organ') osc.setPeriodicWave(organWave);
    else if (type === 'reed') osc.setPeriodicWave(bassWave);
    else osc.type = type;
    if (options.detune) osc.detune.value = options.detune;
    const owned = [env];
    if (options.cutoff) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(options.cutoff, when);
      if (options.close) filter.frequency.exponentialRampToValueAtTime(options.close, end);
      filter.Q.value = options.q || 0.67;
      osc.connect(filter);
      filter.connect(env);
      owned.push(filter);
    } else osc.connect(env);
    env.gain.setValueAtTime(0.0001, when);
    env.gain.exponentialRampToValueAtTime(level, when + attack);
    if (options.hold) {
      env.gain.exponentialRampToValueAtTime(level * 0.70,
        when + Math.max(attack, duration * options.hold));
    }
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    position(env, options.dest || synth, options.pan, owned);
    if (options.echo) {
      const tap = gain(options.echo, send);
      env.connect(tap);
      owned.push(tap);
    }
    cleanOnEnd(osc, owned);
    osc.start(when);
    osc.stop(end + 0.005);
  }
  function noise(when, duration, level, type, frequency, pan = 0, destination = drums, q = 0.8) {
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    const env = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    source.connect(filter);
    filter.connect(env);
    const owned = [filter, env];
    position(env, destination, pan, owned);
    env.gain.setValueAtTime(0.0001, when);
    env.gain.linearRampToValueAtTime(level, when + 0.002);
    env.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    cleanOnEnd(source, owned);
    source.start(when, (when * 7.113) % 0.45);
    source.stop(when + duration + 0.006);
  }
  function kick(t, v) {
    voice('sine', 132, t, 0.19, 0.83 * v, { slide: 44, dest: drums, attack: 0.003 });
    noise(t, 0.022, 0.22 * v, 'bandpass', 3100, 0, drums, 1.3);
  }
  function snare(t, v, ghost = false) {
    voice('triangle', ghost ? 220 : 200, t, ghost ? 0.048 : 0.10, v * 0.32,
      { slide: 125, dest: drums, attack: 0.002 });
    noise(t, ghost ? 0.060 : 0.155, v * 0.56, 'highpass', ghost ? 1400 : 1120, ghost ? -0.12 : 0);
    if (!ghost) noise(t + 0.010, 0.115, v * 0.24, 'bandpass', 2240, 0.13);
  }
  function hats(t, v, open, pan) {
    noise(t, open ? 0.148 : 0.044, v * (open ? 0.17 : 0.24), 'highpass', open ? 5520 : 6740, pan);
  }
  function kit(t, s, bar, intensity, section) {
    // The eight-bar drop breathes out on its final beat, then picks up again.
    if (intensity === 0) {
      if (s === 0 && bar % 2 === 0) kick(t, 0.43);
      if (s === 8 && bar % 2 === 1) snare(t, 0.26, true);
      if (s === 6 || s === 14) hats(t, 0.42, false, -0.30);
      return;
    }
    const light = intensity === 1;
    const row = bar % 4;
    if ((light ? [0, 10] : kickPatterns[row]).includes(s)) kick(t, (s === 0 ? 0.98 : 0.73) * (light ? 0.67 : 1));
    if (s === 4 || s === 12) snare(t, light ? 0.56 : s === 12 ? 1 : 0.91);
    if (!light && ghostPatterns[row].includes(s)) snare(t + 0.004, (s % 3 ? 0.24 : 0.33), true);
    if (s % 2 === 0 || (!light && (s === 7 || (s === 15 && bar % 2)))) {
      hats(t + (s % 4 === 2 ? 0.003 : 0), s % 4 === 2 ? 0.92 : 0.53,
        s === 6 || (s === 14 && !light), s % 4 === 2 ? 0.34 : -0.29);
    }
    if (bar % 8 === 7 && s >= 13 && !light) snare(t, (s - 11) * 0.13, s < 15);
    if (intensity >= 3 && s === 15 && bar % 2) kick(t, 0.49);
    if (s === 0 && bar % 8 === 0 && section) {
      noise(t, 0.65, 0.23, 'highpass', 6450, 0.22);
    }
  }
  function bass(t, note, duration, strength, fierce) {
    voice('sine', hz(note), t, duration, 0.47 * strength, { attack: 0.014, hold: 0.54 });
    voice('reed', hz(note), t, duration * 0.98, 0.18 * strength,
      { attack: 0.012, cutoff: fierce ? 1540 : 850, close: 190, q: 1.1, hold: 0.43 });
    if (fierce) voice('sawtooth', hz(note + 12), t + 0.005, duration * 0.82, 0.043,
      { detune: -7, cutoff: 920, close: 200, pan: -0.14 });
  }
  function lead(t, note, duration, level, pan) {
    voice('organ', hz(note), t, duration, level, {
      cutoff: 3150, close: 820, attack: 0.010, hold: 0.32, pan, echo: 0.48
    });
    voice('sine', hz(note + 12), t, 0.076, level * 0.36, { pan: -pan });
  }
  function scoreTick(n, t) {
    const spec = scenes[scene];
    const unit = sixteenth(spec.bpm);
    const s = n % 16;
    const bar = Math.floor(n / 16);
    const section = Math.floor(bar / 8) % 4;
    const drop = (section === 2 && bar % 8 < 2 && spec.kit >= 2);
    const intensity = drop ? 1 : spec.kit;
    const progression = scene === 'boss' || scene === 'elite' ? progressions.boss :
      scene === 'reward' || scene === 'victory' ? progressions.prize :
      scene === 'defeat' ? progressions.hush : progressions.main;
    const [root, harmony, melody] = chords[progression[bar % 8]];
    const swingTime = t + (s % 2 ? unit * 0.075 : 0);
    kit(swingTime, s, bar, intensity, section);

    const bassPattern = intensity < 2 ? [[0, 0, 6], [10, 7, 3]] : basslines[(bar + section) % 4];
    for (const [on, interval, length] of bassPattern) {
      if (on === s) bass(t, root + interval, unit * length * 0.91, spec.bass, intensity >= 3);
    }
    if (s === 0 && (intensity < 2 || bar % 2 === 0)) {
      harmony.forEach((pitch, i) => {
        voice(i % 2 ? 'triangle' : 'organ', hz(pitch), t + i * 0.009,
          unit * (intensity < 2 ? 13 : 7), spec.air * 0.060, {
            attack: 0.075, cutoff: 1270, close: 650, hold: 0.51, pan: (i - 1.5) * 0.27
          });
      });
    }
    if (intensity >= 2 && (s === 6 || (s === 14 && bar % 2))) {
      for (let i = 0; i < 3; i++) {
        voice('organ', hz(harmony[i]), swingTime + i * 0.004, unit * 1.8, 0.072,
          { cutoff: 1950, close: 600, pan: (i - 1) * 0.3, echo: 0.26 });
      }
    }
    const tune = tunes[(bar + (section === 1 ? 2 : 0)) % 4];
    for (const [on, index, length] of tune) {
      if (on !== s || (intensity === 0 && on % 2 && scene === 'defeat')) continue;
      if (intensity >= 2 && section === 0 && bar % 8 >= 4 && on < 8) continue;
      const octave = section === 2 || scene === 'defeat' ? -12 : 0;
      lead(swingTime, melody[index] + octave, unit * (length + 0.72),
        spec.lead * 0.125, bar % 2 ? -0.15 : 0.16);
    }
  }
  function stopClock() {
    clearInterval(interval);
    interval = 0;
  }
  function pump() {
    if (ctx.state !== 'running' || hidden() || settings.muted) return;
    if (clock < ctx.currentTime - 0.10) clock = ctx.currentTime + 0.02;
    while (clock < ctx.currentTime + 0.12) {
      scoreTick(step++, clock);
      clock += sixteenth(scenes[scene].bpm);
    }
  }
  function sync() {
    const token = ++generation;
    if (!activated) return;
    if (!ctx && (settings.muted || hidden())) return;
    try {
      if (!ctx && !createGraph()) return;
      master.gain.setTargetAtTime(busVolume(), ctx.currentTime, 0.018);
      if (hidden() || settings.muted) {
        stopClock();
        if (ctx.state === 'running') {
          setTimeout(() => {
            if (generation === token && (hidden() || settings.muted)) ctx.suspend().catch(() => {});
          }, 85);
        }
        return;
      }
      const resume = ctx.state === 'running' ? Promise.resolve() : ctx.resume();
      resume.then(() => {
        if (token !== generation || hidden() || settings.muted || interval || ctx.state !== 'running') return;
        clock = ctx.currentTime + 0.035;
        pump();
        interval = setInterval(pump, 35);
      }).catch(() => {});
    } catch (_) { /* Audio is optional on embedded or restricted browsers. */ }
  }
  function start() {
    if (activated && ctx && ctx.state === 'running' && interval) return;
    activated = true;
    sync();
  }
  function setScene(next) {
    if (!Object.prototype.hasOwnProperty.call(scenes, next) || scene === next) return;
    scene = next;
    // Keep the beat across the transition. The new phrase enters on the next tick.
    step %= 16;
  }
  function setMuted(value) {
    settings.muted = Boolean(value);
    persist();
    sync();
    return settings.muted;
  }
  function setVolume(value) {
    if (!Number.isFinite(Number(value))) return settings.volume;
    settings.volume = clamp(Number(value), 0, 1);
    persist();
    if (ctx && master) master.gain.setTargetAtTime(busVolume(), ctx.currentTime, 0.018);
    return settings.volume;
  }
  function bells(t, notes, spacing, length, level, type = 'triangle') {
    notes.forEach((note, i) => voice(type, hz(note), t + spacing * i, length, level, {
      dest: effects, pan: (i % 3 - 1) * 0.19, echo: 0.32, cutoff: 3700, close: 1300
    }));
  }
  function fx(name, power = 1) {
    if (!ctx || ctx.state !== 'running' || settings.muted || hidden()) return;
    const t = ctx.currentTime + 0.005;
    const weight = clamp(Number(power) || 1, 0.55, 2);
    switch (name) {
      case 'click':
        if (t - lastClick < 0.045) return;
        lastClick = t;
        voice('triangle', 550, t, 0.045, 0.15, { slide: 760, dest: effects });
        break;
      case 'draw':
        if (t - lastDraw < 0.065) return;
        lastDraw = t;
        noise(t, 0.085, 0.18, 'bandpass', 2350, -0.22, effects, 0.65);
        bells(t, [74, 81], 0.033, 0.11, 0.075);
        break;
      case 'play':
        noise(t, 0.064, 0.23, 'highpass', 2400, -0.16, effects);
        voice('triangle', 390, t, 0.080, 0.25, { slide: 720, dest: effects });
        break;
      case 'hit':
        voice('sine', 145, t, 0.17, 0.50 * weight, { slide: 43, dest: effects });
        noise(t, 0.095, 0.39, 'bandpass', 1850, 0.08, effects);
        break;
      case 'enemy':
        voice('sawtooth', 140, t, 0.21, 0.32, { slide: 49, cutoff: 1150, close: 170, dest: effects });
        noise(t + 0.025, 0.17, 0.42, 'lowpass', 1830, -0.12, effects);
        break;
      case 'block':
        bells(t, [62, 69, 74], 0.013, 0.29, 0.18, 'sine');
        noise(t, 0.09, 0.20, 'bandpass', 3400, 0.25, effects, 2);
        break;
      case 'combo':
        bells(t, [74, 77, 81, 84, 86], 0.039, 0.23, 0.18, 'organ');
        break;
      case 'reward':
        bells(t, [69, 74, 77, 81], 0.059, 0.34, 0.16, 'organ');
        break;
      case 'upgrade':
        bells(t, [62, 69, 74, 81, 86], 0.073, 0.42, 0.16);
        break;
      case 'win':
        bells(t, [62, 65, 69, 74, 77, 81], 0.096, 0.50, 0.18, 'organ');
        break;
      case 'lose':
        bells(t, [65, 64, 60, 57, 50], 0.142, 0.57, 0.14);
        break;
    }
  }
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', sync);
  window.AccordAudio = Object.freeze({
    start, setScene, fx, setVolume, setMuted, toggleMute: () => setMuted(!settings.muted),
    getSettings: () => ({ ...settings })
  });
})();

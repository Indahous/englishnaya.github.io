/* Спокойная и весёлая музыка + мягкие звуки для малышей. Всё синтезируется в браузере (WebAudio):
   «музыкальная шкатулка» в до мажоре (аккорды C – Am – F – G), тихий пэд и мягкий бас.
   Файлов нет, поэтому нет и лицензионных вопросов. */
window.LeafAudio = (() => {
  'use strict';
  const KEY = 'leaves-audio-v1';
  let prefs = { music: true, sfx: true };
  try { Object.assign(prefs, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* ignore */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) { /* ignore */ } };

  let ctx = null, master = null, musicBus = null, sfxBus = null, echo = null;
  const MUSIC_LEVEL = 0.5, SFX_LEVEL = 0.9;
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  const ensure = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);

      const soft = ctx.createBiquadFilter();
      soft.type = 'lowpass';
      soft.frequency.value = 4200;
      soft.connect(master);

      musicBus = ctx.createGain();
      musicBus.gain.value = prefs.music ? MUSIC_LEVEL : 0;
      musicBus.connect(soft);

      sfxBus = ctx.createGain();
      sfxBus.gain.value = prefs.sfx ? SFX_LEVEL : 0;
      sfxBus.connect(master);

      // мягкое эхо для «хвостов» колокольчиков
      echo = ctx.createDelay(1);
      echo.delayTime.value = 0.3;
      const fb = ctx.createGain();
      fb.gain.value = 0.27;
      const wet = ctx.createGain();
      wet.gain.value = 0.2;
      echo.connect(fb); fb.connect(echo);
      echo.connect(wet); wet.connect(master);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  /* ---------- инструменты ---------- */
  const bell = (freq, t, vel, dest) => {
    const c = ctx;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.2 * vel, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    [[1, 1], [2, 0.26], [3.01, 0.07]].forEach(([mul, a]) => {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq * mul;
      const og = c.createGain();
      og.gain.value = a;
      o.connect(og); og.connect(g);
      o.start(t); o.stop(t + 1.5);
    });
    g.connect(dest);
    g.connect(echo);
  };

  const pad = (midis, t, dur, dest) => {
    const c = ctx;
    midis.forEach((m) => {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = mtof(m);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.03, t + 0.5);
      g.gain.setValueAtTime(0.03, t + dur - 0.2);
      g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.5);
      o.connect(g); g.connect(dest);
      o.start(t); o.stop(t + dur + 0.6);
    });
  };

  const bass = (m, t, dest) => {
    const c = ctx;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = mtof(m);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + 0.8);
  };

  /* ---------- музыка ---------- */
  const PROG = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]];
  const LADDER = [[60, 64, 67, 72, 76, 79], [57, 60, 64, 69, 72, 76], [53, 57, 60, 65, 69, 72], [55, 59, 62, 67, 71, 74]];
  const PATS = [
    [2, 4, 3, 4, 5, 4, 3, null],
    [3, null, 4, 5, 4, null, 3, 2],
    [2, 3, 4, 3, 2, null, 4, null],
    [5, 4, 3, 4, 3, 2, 3, null]
  ];
  let timer = null, step = 0, nextT = 0, lastPat = -1, curPat = PATS[0], intensity = 0;

  const eighth = () => 60 / (90 + intensity * 4) / 2;

  const playStep = (s, t) => {
    const bar = Math.floor(s / 8), ci = bar % 4, si = s % 8;
    if (si === 0) {
      let p;
      do { p = Math.floor(Math.random() * PATS.length); } while (p === lastPat);
      lastPat = p; curPat = PATS[p];
      pad(PROG[ci], t, eighth() * 8, musicBus);
      bass(PROG[ci][0] - 24, t, musicBus);
    }
    if (si === 4) bass(PROG[ci][0] - 24 + (ci === 3 ? 7 : 0), t, musicBus);
    const idx = curPat[si];
    if (idx != null) bell(mtof(LADDER[ci][idx]), t, 0.55 + Math.random() * 0.35, musicBus);
  };

  const schedule = () => {
    timer = null;
    if (!ctx || !prefs.music) return;
    while (nextT < ctx.currentTime + 0.3) {
      playStep(step, nextT);
      nextT += eighth();
      step += 1;
    }
    timer = setTimeout(schedule, 70);
  };
  const startMusic = () => {
    if (!prefs.music || timer || !ensure()) return;
    nextT = ctx.currentTime + 0.1;
    schedule();
  };
  const stopMusic = () => { clearTimeout(timer); timer = null; };

  /* ---------- звуки ---------- */
  const can = () => prefs.sfx && ensure();
  const seq = (midis, gap, vel) => {
    const t = ctx.currentTime + 0.01;
    midis.forEach((m, i) => bell(mtof(m), t + i * gap, vel, sfxBus));
  };

  const api = {
    get music() { return prefs.music; },
    get sfx() { return prefs.sfx; },
    start() { if (ensure()) startMusic(); },
    unlock: ensure,
    setMusic(on) {
      prefs.music = !!on; save();
      if (ctx) musicBus.gain.setTargetAtTime(on ? MUSIC_LEVEL : 0, ctx.currentTime, 0.1);
      if (on) startMusic(); else stopMusic();
    },
    setSfx(on) {
      prefs.sfx = !!on; save();
      if (ctx) sfxBus.gain.setTargetAtTime(on ? SFX_LEVEL : 0, ctx.currentTime, 0.05);
      if (!on && 'speechSynthesis' in window) { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
    },
    setIntensity(n) { intensity = n; },
    tap() { if (can()) seq([72], 0, 0.5); },
    pick() { if (can()) seq([79, 84], 0.09, 0.7); },
    catch() { if (can()) seq([79, 84, 88], 0.09, 0.7); },
    oops() {
      if (!can()) return;
      const c = ctx, t = c.currentTime;
      [[360, 250, 0.12], [540, 380, 0.04]].forEach(([f0, f1, v]) => {
        const o = c.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(f0, t);
        o.frequency.exponentialRampToValueAtTime(f1, t + 0.28);
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(v, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
        o.connect(g); g.connect(sfxBus);
        o.start(t); o.stop(t + 0.4);
      });
    },
    roundDone() { if (can()) seq([72, 76, 79, 84, 88], 0.11, 0.8); },
    win() { if (can()) seq([72, 76, 79, 84, 79, 84, 88, 91, 96], 0.14, 0.8); }
  };

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });
  return api;
})();

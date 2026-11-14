/* Новогодняя музыка (Jingle Bells, народная мелодия) и звуки — WebAudio, без файлов */
window.XmasAudio = (function () {
  'use strict';
  var ctx = null, master, musicBus, sfxBus, musicOn = true, sfxOn = true, timer = null, nextT = 0, step = 0;
  try { musicOn = localStorage.getItem('xmas-music') !== '0'; sfxOn = localStorage.getItem('xmas-sfx') !== '0'; } catch (e) {}
  function init() {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = .9; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? .22 : 0; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? .6 : 0; sfxBus.connect(master);
    return true;
  }
  function unlock() { if (!init()) return; if (ctx.state === 'suspended') ctx.resume(); }
  var noiseBuf = null;
  function noise() {
    if (noiseBuf) return noiseBuf;
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * .5, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }
  /* «музыкальная шкатулка» */
  function bell(f, t, dur, vol, bus) {
    var o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 3.01;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .005); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    g2.gain.setValueAtTime(vol * .25, t); g2.gain.exponentialRampToValueAtTime(.0005, t + dur * .4);
    o.connect(g); o2.connect(g2); g.connect(bus); g2.connect(bus);
    o.start(t); o2.start(t); o.stop(t + dur + .05); o2.stop(t + dur + .05);
  }
  function soft(f, t, dur, vol, bus, type) {
    var o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = type || 'triangle'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 900;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    o.connect(lp); lp.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + .05);
  }
  function jingle(t, vol, bus) {
    var s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise(); hp.type = 'highpass'; hp.frequency.value = 7000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0005, t + .12);
    s.connect(hp); hp.connect(g); g.connect(bus); s.start(t, Math.random() * .3); s.stop(t + .15);
  }
  /* Jingle Bells (припев), длительности в долях */
  var N = { G3: 196, D4: 293.66, G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, G5: 783.99 };
  var MEL = [
    ['B4', 1], ['B4', 1], ['B4', 2], ['B4', 1], ['B4', 1], ['B4', 2], ['B4', 1], ['D5', 1], ['G4', 1.5], ['A4', .5], ['B4', 4],
    ['C5', 1], ['C5', 1], ['C5', 1.5], ['C5', .5], ['C5', 1], ['B4', 1], ['B4', 1], ['B4', .5], ['B4', .5], ['B4', 1], ['A4', 1], ['A4', 1], ['B4', 1], ['A4', 2], ['D5', 2],
    ['B4', 1], ['B4', 1], ['B4', 2], ['B4', 1], ['B4', 1], ['B4', 2], ['B4', 1], ['D5', 1], ['G4', 1.5], ['A4', .5], ['B4', 4],
    ['C5', 1], ['C5', 1], ['C5', 1.5], ['C5', .5], ['C5', 1], ['B4', 1], ['B4', 1], ['B4', .5], ['B4', .5], ['D5', 1], ['D5', 1], ['C5', 1], ['A4', 1], ['G4', 3], ['', 1]
  ];
  var BASS = [98, 98, 98, 98, 130.81, 98, 110, 146.83, 98, 98, 98, 98, 130.81, 98, 146.83, 98]; // по тактам
  var BEAT = .42, mi = 0, beatPos = 0;
  function schedule() {
    if (!ctx) return;
    while (nextT < ctx.currentTime + .35) {
      var n = MEL[mi], d = n[1] * BEAT;
      if (n[0]) bell(N[n[0]] * 2, nextT, Math.min(1.4, d * 1.6 + .3), .32, musicBus);
      // бас и бубенцы по долям
      var b0 = beatPos, b1 = beatPos + n[1];
      for (var b = Math.ceil(b0 - 1e-6); b < b1 - 1e-6; b++) {
        var tt = nextT + (b - b0) * BEAT, bar = Math.floor(b / 4) % 16;
        if (b % 2 === 0) soft(BASS[bar], tt, BEAT * 1.8, .35, musicBus);
        else soft(BASS[bar] * 1.5, tt, BEAT * 1.2, .18, musicBus);
        jingle(tt, b % 2 ? .25 : .12, musicBus); jingle(tt + BEAT / 2, .07, musicBus);
      }
      beatPos = b1; nextT += d; mi = (mi + 1) % MEL.length;
      if (mi === 0) beatPos = 0;
    }
  }
  function start() {
    if (!init()) return; unlock();
    if (timer) return;
    nextT = ctx.currentTime + .1; mi = 0; beatPos = 0;
    timer = setInterval(schedule, 100);
  }
  function setMusic(on) {
    musicOn = on; try { localStorage.setItem('xmas-music', on ? '1' : '0'); } catch (e) {}
    if (musicBus) musicBus.gain.setTargetAtTime(on ? .22 : 0, ctx.currentTime, .1);
  }
  function setSfx(on) {
    sfxOn = on; try { localStorage.setItem('xmas-sfx', on ? '1' : '0'); } catch (e) {}
    if (sfxBus) sfxBus.gain.setTargetAtTime(on ? .6 : 0, ctx.currentTime, .05);
  }
  function duck(on) { if (musicBus && musicOn) musicBus.gain.setTargetAtTime(on ? .07 : .22, ctx.currentTime, .08); }
  function now() { return ctx ? ctx.currentTime + .01 : 0; }
  var fx = {
    tap: function () { if (!ctx) return; bell(1318.5, now(), .25, .25, sfxBus); },
    ok: function () { if (!ctx) return; var t = now(); [783.99, 987.77, 1174.66, 1567.98].forEach(function (f, i) { bell(f, t + i * .07, .8, .3, sfxBus); }); },
    oops: function () { if (!ctx) return; var t = now(); soft(330, t, .25, .4, sfxBus, 'sine'); soft(262, t + .14, .35, .4, sfxBus, 'sine'); },
    hang: function () { if (!ctx) return; var t = now(); bell(2093, t, .5, .2, sfxBus); jingle(t, .3, sfxBus); },
    star: function () { if (!ctx) return; var t = now(); for (var i = 0; i < 8; i++) bell(1046.5 * Math.pow(1.122, i), t + i * .05, .6, .18, sfxBus); },
    lights: function () { if (!ctx) return; var t = now(); for (var i = 0; i < 14; i++) { bell(1567.98 + Math.random() * 1200, t + i * .09, .5, .14, sfxBus); jingle(t + i * .09, .12, sfxBus); } },
    win: function () { if (!ctx) return; var t = now(); [[392, 0], [493.88, .15], [587.33, .3], [783.99, .45], [987.77, .6]].forEach(function (p) { bell(p[0] * 2, t + p[1], 1.2, .3, sfxBus); }); }
  };
  return { start: start, unlock: unlock, setMusic: setMusic, setSfx: setSfx, duck: duck, fx: fx,
    get music() { return musicOn; }, get sfx() { return sfxOn; } };
})();

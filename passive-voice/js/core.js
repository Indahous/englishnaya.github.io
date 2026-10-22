/* Shared helpers for all levels: sound, drag & drop, puzzle assembler, balloons, rain.
   Plain JS, no dependencies. Sounds are synthesised with WebAudio (no audio files). */
(() => {
  'use strict';

  const MUTE_KEY = 'whodidit-l1-v1-mute'; // one shared mute switch for every level

  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const shuffle = (a) => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  };
  const rand = (a, b) => a + Math.random() * (b - a);

  const store = (key) => ({
    load(defaults) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) return Object.assign({}, defaults, JSON.parse(raw));
      } catch (e) { /* storage unavailable */ }
      return Object.assign({}, defaults);
    },
    save(v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* ignore */ } },
    clear() { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }
  });

  /* ---------- Sound ---------- */
  const sfx = (() => {
    let ctx = null;
    let muted = false;
    let rainWanted = false;
    let rain = null;
    try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { /* ignore */ }

    const ensure = () => {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      }
      if (ctx && ctx.state === 'suspended') ctx.resume();
      return ctx;
    };
    const tone = (f, d, type = 'sine', v = 0.14, slide = 0, delay = 0) => {
      if (muted) return;
      const c = ensure();
      if (!c) return;
      const t = c.currentTime + delay;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + d + 0.05);
    };
    const noiseBuffer = (c, d) => {
      const len = Math.floor(c.sampleRate * d);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      return buf;
    };
    const noise = (d, v = 0.4) => {
      if (muted) return;
      const c = ensure();
      if (!c) return;
      const len = Math.floor(c.sampleRate * d);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource();
      src.buffer = buf;
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 900;
      const g = c.createGain();
      g.gain.value = v;
      src.connect(hp).connect(g).connect(c.destination);
      src.start();
    };

    const startRainNode = () => {
      if (rain || muted) return;
      const c = ensure();
      if (!c) return;
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c, 2.5);
      src.loop = true;
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 500;
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3200;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.045, c.currentTime + 1.2);
      src.connect(hp).connect(lp).connect(g).connect(c.destination);
      src.start();
      rain = { src, g };
    };
    const stopRainNode = () => {
      if (!rain) return;
      const r = rain;
      rain = null;
      try {
        r.g.gain.cancelScheduledValues(0);
        r.g.gain.setValueAtTime(r.g.gain.value, ctx.currentTime);
        r.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        r.src.stop(ctx.currentTime + 0.5);
      } catch (e) { /* ignore */ }
    };

    return {
      get muted() { return muted; },
      setMuted(m) {
        muted = m;
        try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) { /* ignore */ }
        if (m) stopRainNode(); else if (rainWanted) startRainNode();
      },
      unlock: ensure,
      ok() { tone(660, 0.12, 'triangle', 0.12); tone(880, 0.18, 'triangle', 0.1, 0, 0.09); },
      bad() { tone(150, 0.28, 'sawtooth', 0.1, -70); },
      pop() { noise(0.14, 0.55); tone(240, 0.1, 'square', 0.08, -150); },
      win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.1, 0, i * 0.12)); },
      dark() { tone(70, 1.8, 'sine', 0.2, -25); tone(52, 1.8, 'sawtooth', 0.05, -10); },
      drip() { tone(1400, 0.09, 'sine', 0.06, -700); },
      whoosh() { noise(0.35, 0.12); },
      thunder() {
        if (muted) return;
        const c = ensure();
        if (!c) return;
        const src = c.createBufferSource();
        src.buffer = noiseBuffer(c, 2.4);
        const lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(380, c.currentTime);
        lp.frequency.exponentialRampToValueAtTime(70, c.currentTime + 2.2);
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.5, c.currentTime + 0.15);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 2.3);
        src.connect(lp).connect(g).connect(c.destination);
        src.start();
      },
      rainOn() { rainWanted = true; startRainNode(); },
      rainOff() { rainWanted = false; stopRainNode(); }
    };
  })();

  /* ---------- Toast ---------- */
  let toastTimer = null;
  const toast = (html, ms = 3600) => {
    const t = $('#toast');
    if (!t) return;
    t.innerHTML = html;
    t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), ms);
  };

  /* ---------- Rain canvas ---------- */
  const rainFx = (() => {
    let cv = null, cx = null, raf = 0, drops = [], w = 0, h = 0, running = false;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const resize = () => {
      if (!cv) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = reduced ? 40 : Math.min(160, Math.floor(w / 9));
      drops = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, l: rand(10, 22), v: rand(520, 820), o: rand(0.15, 0.4) }));
    };
    let last = 0;
    const frame = (now) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      cx.clearRect(0, 0, w, h);
      cx.lineWidth = 1.2;
      for (const d of drops) {
        d.y += d.v * dt;
        d.x -= d.v * dt * 0.18;
        if (d.y > h) { d.y = -d.l; d.x = Math.random() * (w + 80); }
        cx.strokeStyle = 'rgba(170,210,235,' + d.o + ')';
        cx.beginPath();
        cx.moveTo(d.x, d.y);
        cx.lineTo(d.x + d.l * 0.18, d.y + d.l);
        cx.stroke();
      }
      raf = requestAnimationFrame(frame);
    };
    return {
      start(canvas) {
        if (running) return;
        cv = canvas;
        cx = cv.getContext('2d');
        cv.classList.remove('hidden');
        resize();
        window.addEventListener('resize', resize);
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      },
      stop() {
        running = false;
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        if (cv) cv.classList.add('hidden');
      }
    };
  })();

  /* ---------- Drag & drop helper (pointer events: mouse, touch, pen) ---------- */
  // btn: the pressable element, wrap: the element cloned as a drag ghost.
  // opts: enabled(), targetSel, onDrop(targetEl), onTap(), onOver(targetEl|null)
  const bindDrag = (btn, wrap, opts) => {
    let sx = 0, sy = 0, pid = null, dragging = false, ghost = null, over = null, suppress = false;
    const clearOver = () => { if (over) over.classList.remove('drop'); over = null; };
    const cleanup = () => {
      if (ghost) { ghost.remove(); ghost = null; }
      clearOver();
      wrap.style.opacity = '';
      dragging = false;
      pid = null;
    };
    btn.addEventListener('pointerdown', (e) => {
      if (opts.enabled && !opts.enabled()) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      sx = e.clientX; sy = e.clientY; pid = e.pointerId; dragging = false;
      try { btn.setPointerCapture(pid); } catch (err) { /* ignore */ }
    });
    btn.addEventListener('pointermove', (e) => {
      if (pid === null || e.pointerId !== pid) return;
      if (!dragging && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) {
        dragging = true;
        sfx.unlock();
        ghost = wrap.cloneNode(true);
        ghost.classList.add('ghost');
        ghost.style.width = wrap.offsetWidth + 'px';
        document.body.appendChild(ghost);
        wrap.style.opacity = '0.35';
      }
      if (dragging) {
        ghost.style.left = e.clientX + 'px';
        ghost.style.top = e.clientY + 'px';
        const under = document.elementFromPoint(e.clientX, e.clientY);
        const t = under && under.closest ? under.closest(opts.targetSel) : null;
        if (t !== over) { clearOver(); over = t; if (t) t.classList.add('drop'); }
      }
    });
    btn.addEventListener('pointerup', (e) => {
      if (pid === null || e.pointerId !== pid) return;
      if (dragging) {
        const target = over;
        cleanup();
        suppress = true;
        setTimeout(() => { suppress = false; }, 0);
        if (target) opts.onDrop(target);
      } else {
        cleanup();
      }
    });
    btn.addEventListener('pointercancel', cleanup);
    btn.addEventListener('click', () => { if (!suppress && opts.onTap) opts.onTap(); });
  };

  /* ---------- Puzzle assembler (torn pieces -> slots) ---------- */
  // cfg: { answer: [..], distractors: [{text, why}], roles?: [..], enabled(), onRight(i, text), onWrong({piece, why, trap}), onDone() }
  const assembler = (host, cfg) => {
    host.innerHTML = '';
    const strip = el('div', 'headline-strip');
    const tray = el('div', 'tray');
    host.appendChild(strip);
    host.appendChild(tray);

    const pieces = cfg.answer.map((t, i) => ({ id: 'a' + i, text: t, slot: i, trap: null, role: cfg.roles ? cfg.roles[i] : null }))
      .concat((cfg.distractors || []).map((d, i) => ({ id: 'd' + i, text: d.text, slot: -1, trap: d, role: null })));
    let order = shuffle(pieces);
    if (order.slice(0, cfg.answer.length).every((p, i) => p.slot === i)) order = shuffle(pieces);
    const placed = new Array(cfg.answer.length).fill(null);
    let selected = null;
    let finished = false;
    const enabled = () => !finished && (!cfg.enabled || cfg.enabled());

    const pieceEl = (id) => tray.querySelector('.piece[data-id="' + id + '"]');
    const find = (id) => pieces.find((p) => p.id === id);

    cfg.answer.forEach((_, i) => {
      const s = el('button', 'slot empty');
      s.type = 'button';
      s.dataset.i = i;
      s.setAttribute('aria-label', 'Slot ' + (i + 1));
      s.appendChild(el('span', 'n', String(i + 1)));
      s.addEventListener('click', () => {
        if (!enabled() || placed[i]) return;
        if (!selected) { if (cfg.onHint) cfg.onHint('Pick a torn piece first (click it), then click a slot. Or drag it.'); return; }
        place(selected, i);
      });
      strip.appendChild(s);
    });

    const select = (id) => {
      if (!enabled()) return;
      sfx.unlock();
      selected = selected === id ? null : id;
      tray.querySelectorAll('.chunk').forEach((b) => b.classList.remove('selected'));
      if (selected) {
        pieceEl(selected).querySelector('.chunk').classList.add('selected');
        if (cfg.onHint) cfg.onHint('Now choose the slot for “' + find(selected).text + '”.');
      }
    };

    const place = (id, i) => {
      if (!enabled() || placed[i]) return;
      const piece = find(id);
      if (!piece) return;
      const slot = strip.children[i];
      const pe = pieceEl(id);
      if (piece.slot === i) {
        placed[i] = id;
        slot.classList.remove('empty', 'shake');
        slot.classList.add('filled');
        if (piece.role) slot.classList.add('role-' + piece.role);
        slot.textContent = '';
        slot.appendChild(el('span', 'n', String(i + 1)));
        slot.appendChild(document.createTextNode(piece.text));
        slot.disabled = true;
        pe.classList.add('used');
        selected = null;
        if (cfg.onRight) cfg.onRight(i, piece.text);
        if (placed.every(Boolean)) {
          finished = true;
          tray.querySelectorAll('.piece:not(.used)').forEach((p) => p.classList.add('leaving'));
          setTimeout(() => tray.querySelectorAll('.piece.leaving').forEach((p) => p.classList.add('used')), 420);
          if (cfg.onDone) cfg.onDone();
        }
      } else {
        selected = null;
        tray.querySelectorAll('.chunk').forEach((b) => b.classList.remove('selected'));
        const chunk = pe.querySelector('.chunk');
        chunk.classList.remove('bounce'); void chunk.offsetWidth; chunk.classList.add('bounce');
        slot.classList.remove('shake'); void slot.offsetWidth; slot.classList.add('shake');
        setTimeout(() => { chunk.classList.remove('bounce'); slot.classList.remove('shake'); }, 450);
        if (cfg.onWrong) cfg.onWrong({ piece, trap: piece.trap, why: piece.trap ? piece.trap.why : 'Good piece, wrong place. Think about the word order.' });
      }
    };

    order.forEach((p, k) => {
      const wrap = el('div', 'piece' + (p.role ? ' role-' + p.role : ''));
      wrap.dataset.id = p.id;
      const b = el('button', 'chunk t' + ((k % 4) + 1), p.text);
      b.type = 'button';
      wrap.appendChild(b);
      bindDrag(b, wrap, {
        enabled,
        targetSel: '.slot.empty',
        onDrop: (t) => place(p.id, Number(t.dataset.i)),
        onTap: () => select(p.id)
      });
      tray.appendChild(wrap);
    });

    return {
      get done() { return finished; },
      removeTrap() {
        const left = pieces.filter((p) => p.trap && !pieceEl(p.id).classList.contains('used') && !pieceEl(p.id).classList.contains('leaving'));
        if (!left.length) return false;
        const p = left[Math.floor(Math.random() * left.length)];
        const pe = pieceEl(p.id);
        pe.classList.add('leaving');
        setTimeout(() => pe.classList.add('used'), 420);
        if (selected === p.id) selected = null;
        return true;
      },
      hint() {
        const i = placed.findIndex((x) => !x);
        if (i < 0) return false;
        const id = 'a' + i;
        const chunk = pieceEl(id).querySelector('.chunk');
        chunk.classList.add('glint');
        strip.children[i].classList.add('drop');
        setTimeout(() => { chunk.classList.remove('glint'); strip.children[i].classList.remove('drop'); }, 2600);
        return true;
      }
    };
  };

  /* ---------- Red balloon manager (generic, used by Level 2+) ---------- */
  const BALLOON_SVG =
    '<svg viewBox="0 0 70 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M35 98 C31 104 39 106 35 112" stroke="#cfc3a6" stroke-width="1.5" fill="none"/>' +
    '<path d="M35 92 L30 100 L40 100 Z" fill="#a01c1c"/>' +
    '<ellipse cx="35" cy="48" rx="31" ry="43" fill="#d62828"/>' +
    '<ellipse cx="24" cy="30" rx="7" ry="12" fill="#ff8a80" opacity="0.55" transform="rotate(20 24 30)"/>' +
    '</svg>';

  const popFx = (cx, cy) => {
    for (let i = 0; i < 14; i++) {
      const s = el('span', 'scrap');
      s.style.left = cx + 'px';
      s.style.top = cy + 'px';
      document.body.appendChild(s);
      const ang = (Math.PI * 2 * i) / 14 + rand(-0.2, 0.2);
      const dist = rand(50, 130);
      s.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + Math.cos(ang) * dist + 'px,' + (Math.sin(ang) * dist + 40) + 'px) rotate(' + rand(120, 420) + 'deg)', opacity: 0 }
      ], { duration: rand(550, 900), easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => s.remove();
    }
  };

  // cfg: { layer, max, active(), onPop() }
  const balloons = (cfg) => {
    let timer = null, current = null, spawned = 0, stopped = false;
    const clear = () => {
      if (current) { cancelAnimationFrame(current.raf); current.node.remove(); current = null; }
    };
    const schedule = (a, b) => {
      clearTimeout(timer);
      if (stopped || spawned >= (cfg.max || 1)) return;
      timer = setTimeout(spawn, rand(a, b));
    };
    const spawn = () => {
      if (stopped) return;
      if (cfg.active && !cfg.active()) { schedule(2000, 4000); return; }
      spawned += 1;
      const node = el('button', 'balloon');
      node.type = 'button';
      node.setAttribute('aria-label', 'Red balloon. Pop it.');
      node.innerHTML = BALLOON_SVG;
      cfg.layer.appendChild(node);
      const W = window.innerWidth, H = window.innerHeight;
      const dir = Math.random() < 0.5 ? 1 : -1;
      const baseY = rand(H * 0.3, H * 0.6);
      const speed = rand(34, 48);
      const phase = rand(0, Math.PI * 2);
      let x = dir === 1 ? -90 : W + 20;
      const t0 = performance.now();
      let last = t0;
      const b = { node, raf: 0 };
      current = b;
      const frame = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        x += dir * speed * dt;
        const t = (now - t0) / 1000;
        const y = baseY + Math.sin(t * 0.9 + phase) * 26 - t * 4;
        const rot = Math.sin(t * 0.7 + phase) * 7;
        node.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + rot.toFixed(1) + 'deg)';
        if ((dir === 1 && x > window.innerWidth + 40) || (dir === -1 && x < -120) || y < -140) {
          clear();
          schedule(9000, 15000);
          return;
        }
        b.raf = requestAnimationFrame(frame);
      };
      b.raf = requestAnimationFrame(frame);
      node.addEventListener('click', () => {
        const r = node.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height * 0.45;
        clear();
        sfx.unlock();
        sfx.pop();
        popFx(cx, cy);
        if (cfg.onPop) cfg.onPop();
        schedule(10000, 16000);
      });
    };
    schedule(6000, 11000);
    return { stop() { stopped = true; clearTimeout(timer); clear(); } };
  };

  window.Core = { $, el, shuffle, rand, store, sfx, toast, rainFx, bindDrag, assembler, balloons, popFx };
})();

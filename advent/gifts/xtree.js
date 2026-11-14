/* Наряженная ёлка для окошка 3 (та же ёлка, что в игре «Нарядим ёлку!») */
window.XTree = (function () {
  'use strict';
  var TIERS = [
    { ty: 410, tw: 170, by: 600, bw: 268, n: 7 },
    { ty: 285, tw: 120, by: 465, bw: 222, n: 6 },
    { ty: 165, tw: 70, by: 335, bw: 172, n: 5 },
    { ty: 60, tw: 0, by: 215, bw: 118, n: 4 }
  ];
  function tierPath(t) {
    var c = 300, xl = c - t.bw + 6, xr = c + t.bw - 6, seg = (xr - xl) / t.n, my = t.ty + (t.by - t.ty) * .72;
    var d = 'M' + (c - t.tw) + ' ' + t.ty +
      'Q' + (c - t.bw * .62) + ' ' + my + ' ' + (c - t.bw - 12) + ' ' + (t.by - 10) +
      'Q' + (c - t.bw - 16) + ' ' + (t.by + 4) + ' ' + xl + ' ' + (t.by + 2);
    for (var i = 1; i <= t.n; i++) d += 'A' + (seg * .56) + ' ' + (seg * .5) + ' 0 0 0 ' + (xl + seg * i).toFixed(1) + ' ' + (t.by + 2);
    d += 'Q' + (c + t.bw + 16) + ' ' + (t.by + 4) + ' ' + (c + t.bw + 12) + ' ' + (t.by - 10) +
      'Q' + (c + t.bw * .62) + ' ' + my + ' ' + (c + t.tw) + ' ' + t.ty + 'Z';
    return d;
  }
  var GARLANDS = [[200, 185, 300, 240, 400, 180, 5], [175, 300, 300, 362, 435, 295, 6], [130, 440, 300, 505, 470, 430, 7], [112, 565, 300, 625, 492, 560, 8]];
  var BULB = ['#ff6b6b', '#ffd23f', '#4fc3f7', '#ff8fd0', '#7ee081'];
  var SLOTS = [[300, 112], [238, 222], [362, 222], [192, 342], [300, 350], [408, 342], [228, 474], [372, 474]];
  var BALL_W = 60;
  function starPath(cx, cy, r) {
    var d = '', i;
    for (i = 0; i < 10; i++) { var rr = i % 2 ? r * .5 : r, an = Math.PI / 5 * i - Math.PI / 2; d += (i ? 'L' : 'M') + (cx + rr * Math.cos(an)).toFixed(1) + ' ' + (cy + rr * Math.sin(an)).toFixed(1); }
    return d + 'Z';
  }
  function buildTree(svg) {
    var s = '<defs>' +
      '<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7" result="n"/>' +
      '<feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  3.2 0 0 0 -2.05" result="w"/>' +
      '<feComposite in="w" in2="SourceGraphic" operator="in" result="sp"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="sp"/></feMerge></filter>' +
      '<filter id="blur6" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="6"/></filter>' +
      '<clipPath id="potclip"><path d="M248 592L352 592L344 678Q300 688 256 678Z"/></clipPath>' +
      '</defs>';
    // горшок
    s += '<path d="M248 592L352 592L344 678Q300 688 256 678Z" fill="#ec9a8c" stroke="#b9584f" stroke-width="4" stroke-linejoin="round"/>' +
      '<g clip-path="url(#potclip)" stroke="#f9cfc5" stroke-width="5"><path d="M240 618H360M240 640H360M240 662H360"/></g>' +
      '<rect x="236" y="584" width="128" height="20" rx="7" fill="#e7887b" stroke="#b9584f" stroke-width="4"/>';
    // ярусы (снизу вверх), с тенью от верхнего яруса
    TIERS.forEach(function (t, i) {
      if (i > 0) s += '<path d="' + tierPath(t) + '" fill="#7fb5a8" opacity=".5" transform="translate(0 9)"/>';
      s += '<path d="' + tierPath(t) + '" fill="#acd8cd" filter="url(#grain)"/>' +
        '<path d="' + tierPath(t) + '" fill="none" stroke="#3f7f78" stroke-width="4.5" stroke-linejoin="round"/>';
    });
    // блёстки
    var rnd = mulberry(11), dots = '';
    for (var k = 0; k < 170; k++) {
      var y = 80 + rnd() * 510, half = y < 215 ? (y - 60) / 155 * 110 : y < 335 ? 100 + (y - 215) / 120 * 70 : y < 465 ? 150 + (y - 335) / 130 * 70 : 200 + (y - 465) / 135 * 65;
      var x = 300 + (rnd() * 2 - 1) * half * .9;
      dots += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (rnd() * 1.6 + .8).toFixed(1) + '" fill="#fff" opacity="' + (.5 + rnd() * .5).toFixed(2) + '"/>';
    }
    s += '<g>' + dots + '</g>';
    // гирлянды
    var bi = 0;
    GARLANDS.forEach(function (g) {
      s += '<path d="M' + g[0] + ' ' + g[1] + 'Q' + g[2] + ' ' + g[3] + ' ' + g[4] + ' ' + g[5] + '" fill="none" stroke="#e7c27a" stroke-width="3" stroke-linecap="round"/>';
      for (var j = 1; j <= g[6]; j++) {
        var t = j / (g[6] + 1), x = (1 - t) * (1 - t) * g[0] + 2 * (1 - t) * t * g[2] + t * t * g[4], y = (1 - t) * (1 - t) * g[1] + 2 * (1 - t) * t * g[3] + t * t * g[5];
        var col = BULB[bi % BULB.length];
        s += '<circle class="bulb-glow" cx="' + x.toFixed(1) + '" cy="' + (y + 6).toFixed(1) + '" r="13" fill="' + col + '" filter="url(#blur6)" style="transition-delay:' + (bi * 60) + 'ms"/>' +
          '<rect x="' + (x - 2.5).toFixed(1) + '" y="' + (y - 1).toFixed(1) + '" width="5" height="4" fill="#b9934a"/>' +
          '<ellipse class="bulb" data-c="' + col + '" cx="' + x.toFixed(1) + '" cy="' + (y + 7).toFixed(1) + '" rx="5" ry="7" fill="#fff8e6" stroke="#cdb383" stroke-width="1.5" style="animation-delay:' + (bi % 5 * .23) + 's"/>';
        bi++;
      }
    });
    // звезда (появится в конце)
    s += '<g id="topstar" class="topstar" style="display:none"><path d="' + starPath(300, 46, 44) + '" fill="#f6cf4a" stroke="#c9952a" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="' + starPath(300, 46, 26) + '" fill="#fbe38a" opacity=".7"/></g>';
    s += '<rect id="star-target" x="256" y="2" width="88" height="88" fill="none"/>';
    svg.innerHTML = s;
  }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }


  var BALLS = ['blue', 'red', 'yellow', 'green', 'yellow', 'green', 'blue', 'red'];
  function build(svg, slotsEl, ballsPath) {
    buildTree(svg);
    svg.classList.add('lit');
    svg.querySelectorAll('.bulb').forEach(function (e) { e.setAttribute('fill', e.dataset.c); e.setAttribute('stroke', 'none'); });
    svg.querySelector('#topstar').style.display = '';
    slotsEl.innerHTML = SLOTS.map(function (p, i) {
      return '<div class="slot" style="left:' + p[0] / 6 + '%;top:' + p[1] / 7 + '%;width:' + BALL_W / 6 + '%"><img src="' + ballsPath + 'ball-' + BALLS[i] + '.png" alt=""></div>';
    }).join('');
  }
  return { build: build };
})();

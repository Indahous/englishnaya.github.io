/* Окошки адвент-календаря в стиле образца: коралл, бирюза, белый; волнистый край; viewBox 100×100 */
window.ADVENT_ART = (function () {
  'use strict';
  var C = '#ec6561', T = '#3a7872', W = '#ffffff';
  var f = function (n) { return Math.round(n * 10) / 10; };

  /* прямоугольник с волнистыми краями */
  function wavy(a, k) {
    var s = 100, pts = [], st = s / (k * 8), x;
    var w = function (t) { return a * (1 - Math.cos(2 * Math.PI * k * t / s)) / 2; };
    for (x = 0; x < s; x += st) pts.push([x, w(x)]);
    for (x = 0; x < s; x += st) pts.push([s - w(x), x]);
    for (x = 0; x < s; x += st) pts.push([s - x, s - w(x)]);
    for (x = 0; x < s; x += st) pts.push([w(x), s - x]);
    return 'M' + pts.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join('L') + 'Z';
  }
  /* ёлочка: ярусы с подвёрнутыми краями */
  var TREE = 'M40 10 L53 30 Q50 33 46 30 L60 49 Q55 52 49 49 L67 70 Q40 77 13 70 L31 49 Q25 52 20 49 L34 30 Q30 33 27 30 Z';
  /* снежинка */
  function flake(cx, cy, r, sw, col) {
    var g = '', i;
    for (i = 0; i < 6; i++) {
      var an = i * 60;
      g += '<g transform="rotate(' + an + ' ' + cx + ' ' + cy + ')"><path d="M' + cx + ' ' + cy + 'V' + (cy - r) +
        'M' + (cx - r * .22) + ' ' + (cy - r * .78) + 'L' + cx + ' ' + (cy - r * .56) + 'L' + (cx + r * .22) + ' ' + (cy - r * .78) +
        'M' + (cx - r * .3) + ' ' + (cy - r * .5) + 'L' + cx + ' ' + (cy - r * .28) + 'L' + (cx + r * .3) + ' ' + (cy - r * .5) + '"/></g>' +
        '<circle cx="' + cx + '" cy="' + (cy - r) + '" r="' + sw * .7 + '" fill="' + col + '" transform="rotate(' + an + ' ' + cx + ' ' + cy + ')"/>';
    }
    return '<g stroke="' + col + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round" fill="none">' + g + '</g>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r * .2 + '" fill="none" stroke="' + col + '" stroke-width="' + sw + '"/>';
  }
  /* лист остролиста */
  function leaf(L, Wd, n) {
    var up = [], dn = [], i;
    for (i = 1; i < n; i++) { var t = i / n, w = Wd * Math.sin(Math.PI * t); up.push([L * t, -w]); dn.push([L * t, w]); }
    var path = 'M0 0', prev = [0, 0];
    up.concat([[L, 0]]).forEach(function (p) { path += 'Q' + f((prev[0] + p[0]) / 2) + ' ' + f((prev[1] + p[1]) / 2 * .6) + ' ' + f(p[0]) + ' ' + f(p[1]); prev = p; });
    dn.reverse().concat([[0, 0]]).forEach(function (p) { path += 'Q' + f((prev[0] + p[0]) / 2) + ' ' + f((prev[1] + p[1]) / 2 * .6) + ' ' + f(p[0]) + ' ' + f(p[1]); prev = p; });
    return path + 'Z';
  }
  function zig(x0, x1, y, h, n, col, sw) {
    var d = 'M' + x0 + ' ' + y, st = (x1 - x0) / n, i;
    for (i = 1; i <= n; i++) d += 'L' + f(x0 + st * i - st / 2) + ' ' + (y - h) + 'L' + f(x0 + st * i) + ' ' + y;
    return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + (sw || 2) + '" stroke-linejoin="round" stroke-linecap="round"/>';
  }
  function wav(x0, x1, y, h, n, col, sw) {
    var st = (x1 - x0) / n, d = 'M' + x0 + ' ' + y, i;
    for (i = 0; i < n; i++) d += 'q' + f(st / 2) + ' ' + (i % 2 ? h : -h) + ' ' + f(st) + ' 0';
    return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + (sw || 2.5) + '" stroke-linecap="round"/>';
  }
  function spark(x, y, r, col) {
    return '<path d="M' + x + ' ' + (y - r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x - r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y - r) + 'Z" fill="' + col + '"/>';
  }
  function star(x, y, r, col) {
    var d = '', i;
    for (i = 0; i < 10; i++) { var rr = i % 2 ? r * .45 : r, an = Math.PI / 5 * i - Math.PI / 2; d += (i ? 'L' : 'M') + f(x + rr * Math.cos(an)) + ' ' + f(y + rr * Math.sin(an)); }
    return '<path d="' + d + 'Z" fill="' + col + '"/>';
  }
  function bow(x, y, s, col) {
    return '<g fill="none" stroke="' + col + '" stroke-width="' + (2.6 * s) + '" stroke-linejoin="round"><path d="M' + x + ' ' + y + 'C' + (x - 4 * s) + ' ' + (y - 9 * s) + ' ' + (x - 13 * s) + ' ' + (y - 7 * s) + ' ' + (x - 10 * s) + ' ' + (y - 1 * s) + 'Z"/><path d="M' + x + ' ' + y + 'C' + (x + 4 * s) + ' ' + (y - 9 * s) + ' ' + (x + 13 * s) + ' ' + (y - 7 * s) + ' ' + (x + 10 * s) + ' ' + (y - 1 * s) + 'Z"/></g>';
  }
  function num(n, x, y, col, anchor, size) {
    return '<text class="num" x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') + '" font-size="' + (size || 34) + '" fill="' + col + '">' + n + '</text>';
  }

  var ART = {
    1: { pos: 'br', bg: C, svg:
      '<g transform="translate(36 14) scale(.82)"><path d="' + TREE + '" fill="' + T + '"/><rect x="37" y="68" width="6" height="10" fill="' + T + '"/>' +
      '<circle cx="40" cy="30" r="2" fill="' + W + '"/><circle cx="48" cy="46" r="2" fill="' + W + '"/><circle cx="36" cy="58" r="2" fill="' + W + '"/><circle cx="56" cy="64" r="2" fill="' + W + '"/></g>' +
      '<g transform="translate(6 18)"><path d="' + TREE + '" fill="' + W + '"/><rect x="36" y="70" width="8" height="10" fill="' + W + '"/>' +
      '<circle cx="38" cy="26" r="2.2" fill="' + T + '"/><circle cx="44" cy="40" r="2.2" fill="' + T + '"/><circle cx="32" cy="44" r="2.2" fill="' + T + '"/><circle cx="50" cy="58" r="2.2" fill="' + T + '"/>' +
      '<circle cx="28" cy="62" r="2.2" fill="' + T + '"/><circle cx="40" cy="66" r="2.2" fill="' + T + '"/><circle cx="58" cy="66" r="2.2" fill="' + T + '"/></g>' +
      num(1, 84, 44, T, 'middle', 40) },
    2: { pos: 'br', bg: T, svg:
      '<path d="M38 6V28" stroke="' + W + '" stroke-width="1.4"/><rect x="33" y="26" width="10" height="6" rx="1" fill="' + W + '"/><path d="M36 26q2-5 4 0" fill="none" stroke="' + W + '" stroke-width="1.5"/>' +
      '<defs><clipPath id="orn"><path d="M38 32C56 32 66 44 66 54C66 64 50 70 38 86C26 70 10 64 10 54C10 44 20 32 38 32Z"/></clipPath></defs>' +
      '<path d="M38 32C56 32 66 44 66 54C66 64 50 70 38 86C26 70 10 64 10 54C10 44 20 32 38 32Z" fill="' + W + '"/>' +
      '<g clip-path="url(#orn)"><path d="M6 58q4-6 8 0t8 0t8 0t8 0t8 0t8 0t8 0t8 0" fill="none" stroke="' + C + '" stroke-width="4" stroke-linecap="round"/><rect x="6" y="66" width="64" height="2" fill="' + C + '" opacity="0"/></g>' +
      spark(24, 46, 4, C) + spark(52, 46, 4, C) + spark(38, 72, 3.5, C) + spark(38, 42, 3, C) +
      num(2, 80, 44, C, 'middle', 40) },
    3: { pos: 'tl', bg: C, svg:
      '<rect x="10" y="44" width="50" height="10" fill="' + T + '"/><rect x="13" y="54" width="44" height="32" fill="' + T + '"/>' +
      '<rect x="32" y="44" width="6" height="42" fill="' + W + '"/><rect x="10" y="52" width="50" height="2" fill="' + C + '" opacity=".0"/>' + bow(35, 44, 1.3, W) +
      star(21, 64, 3.2, W) + star(49, 64, 3.2, W) + star(21, 78, 3.2, W) + star(49, 78, 3.2, W) + star(25, 49, 2.4, W) + star(46, 49, 2.4, W) +
      '<rect x="58" y="62" width="32" height="8" fill="' + W + '"/><rect x="60" y="70" width="28" height="18" fill="' + W + '"/>' +
      '<rect x="72" y="62" width="4" height="26" fill="' + T + '"/>' + bow(74, 62, 1, T) +
      num(3, 80, 44, W, 'middle', 40) },
    4: { pos: 'br', bg: T, svg:
      '<circle cx="36" cy="24" r="12" fill="' + C + '"/>' +
      '<path d="M26 34H46L62 40Q68 42 66 48Q64 52 58 51L48 49L50 66L58 80Q61 86 55 88Q50 89 47 84L36 70L25 84Q22 89 17 88Q11 86 14 80L22 66L24 49L14 51Q8 52 6 48Q4 42 10 40Z" fill="' + C + '"/>' +
      '<circle cx="31.5" cy="22" r="1.8" fill="' + W + '"/><circle cx="40.5" cy="22" r="1.8" fill="' + W + '"/><path d="M31 27q5 4 10 0" fill="none" stroke="' + W + '" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M32 36l4 2.5 4-2.5v5l-4-2.5-4 2.5z" fill="' + W + '"/><circle cx="36" cy="47" r="2.2" fill="' + W + '"/><circle cx="36" cy="56" r="2.2" fill="' + W + '"/>' +
      '<g fill="none" stroke="' + W + '" stroke-width="1.5" stroke-linejoin="round"><path d="M10 43.5l1.5 3 1.5-3 1.5 3 1.5-3"/><path d="M57 43.5l1.5 3 1.5-3 1.5 3 1.5-3"/><path d="M15 80.5l1.5 3 1.5-3 1.5 3 1.5-3"/><path d="M50 80.5l1.5 3 1.5-3 1.5 3 1.5-3"/></g>' +
      '<path d="M40 12q4-6 8-2q2 4-3 4" fill="none" stroke="' + C + '" stroke-width="2.5" stroke-linecap="round"/>' +
      num(4, 82, 44, W, 'middle', 40) },
    5: { pos: 'tl', bg: T, svg:
      '<defs><clipPath id="hat"><path d="M34 74C34 48 44 32 60 32C76 32 86 48 86 74Z"/></clipPath></defs>' +
      '<path d="M34 74C34 48 44 32 60 32C76 32 86 48 86 74Z" fill="' + W + '"/>' +
      '<g clip-path="url(#hat)">' + wav(30, 90, 50, 4, 8, C, 3) + zig(30, 90, 62, 4, 10, C, 2) + zig(30, 90, 42, 3, 10, C, 1.6) + '</g>' +
      '<circle cx="60" cy="28" r="8" fill="' + C + '"/><circle cx="57" cy="26" r="2" fill="' + W + '" opacity=".35"/>' +
      '<rect x="30" y="72" width="60" height="14" rx="3" fill="' + W + '"/>' +
      '<g stroke="' + C + '" stroke-width="1.6" stroke-linecap="round">' + [36, 42, 48, 54, 60, 66, 72, 78, 84].map(function (x) { return '<path d="M' + x + ' 75v8"/>'; }).join('') + '</g>' +
      num(5, 18, 58, C, 'middle', 40) },
    6: { pos: 'bl', bg: C, svg:
      '<defs><clipPath id="sock"><path d="M44 28H80V58Q80 68 72 74L58 86Q46 94 36 86Q28 78 36 70L44 62Z"/></clipPath></defs>' +
      '<path d="M44 28H80V58Q80 68 72 74L58 86Q46 94 36 86Q28 78 36 70L44 62Z" fill="' + T + '"/>' +
      '<g clip-path="url(#sock)"><circle cx="77" cy="70" r="11" fill="' + W + '"/><path d="M30 76Q40 70 50 80Q48 92 30 92Z" fill="' + W + '"/>' +
      wav(40, 84, 44, 3, 8, W, 2) + wav(40, 84, 54, 3, 8, W, 2) + '</g>' +
      '<path d="M40 14H84V28Q81 32 77 28Q73 32 69 28Q65 32 62 28Q58 32 55 28Q51 32 48 28Q44 32 40 28Z" fill="' + W + '"/>' +
      '<circle cx="47" cy="20" r="1.6" fill="' + C + '"/><circle cx="59" cy="18" r="1.6" fill="' + C + '"/><circle cx="71" cy="21" r="1.6" fill="' + C + '"/>' +
      num(6, 20, 48, W, 'middle', 40) },
    7: { pos: 'br', bg: T, svg:
      '<circle cx="42" cy="44" r="28" fill="' + W + '"/>' +
      '<path d="M28 50L42 36L56 50Z" fill="' + C + '"/><rect x="32" y="49" width="20" height="16" fill="' + C + '"/><rect x="39" y="55" width="6" height="10" fill="' + W + '"/>' +
      '<rect x="48" y="38" width="4" height="8" fill="' + C + '"/><rect x="34" y="52" width="4" height="4" fill="' + W + '"/>' +
      [[26, 30], [34, 24], [50, 24], [58, 32], [24, 42], [60, 44], [30, 36], [54, 58]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.6" fill="' + C + '"/>'; }).join('') +
      '<path d="M20 70H64L70 88H14Z" fill="' + C + '"/>' + zig(20, 64, 80, 4, 8, W, 1.8) + spark(30, 74, 2.4, W) + spark(54, 74, 2.4, W) +
      num(7, 82, 44, C, 'middle', 40) },
    8: { pos: 'tr', bg: C, svg:
      '<g transform="rotate(-24 40 50)">' +
      '<defs><clipPath id="bell"><path d="M40 16C26 16 22 32 22 46C22 58 14 64 10 72H70C66 64 58 58 58 46C58 32 54 16 40 16Z"/></clipPath></defs>' +
      '<path d="M40 16C26 16 22 32 22 46C22 58 14 64 10 72H70C66 64 58 58 58 46C58 32 54 16 40 16Z" fill="' + W + '"/>' +
      '<path d="M36 16q4-9 8 0" fill="none" stroke="' + W + '" stroke-width="3"/>' +
      '<g clip-path="url(#bell)">' + zig(16, 64, 40, 5, 8, T, 2.2) + spark(30, 30, 2.6, T) + spark(48, 30, 2.6, T) + spark(40, 50, 2.6, T) + '</g>' +
      '<rect x="8" y="70" width="64" height="7" rx="3.5" fill="' + T + '"/>' +
      '<circle cx="40" cy="84" r="6" fill="' + W + '" stroke="' + T + '" stroke-width="2"/></g>' +
      num(8, 84, 56, T, 'middle', 40) },
    9: { pos: 'tr', bg: C, svg:
      flake(32, 28, 15, 2.6, W) + flake(64, 62, 24, 3.4, W) +
      num(9, 18, 90, T, 'middle', 40) },
    10: { pos: 'tl', bg: T, svg:
      '<defs><pattern id="cane" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)"><rect width="8" height="8" fill="' + W + '"/><rect width="4" height="8" fill="' + C + '"/></pattern></defs>' +
      '<g fill="none" stroke-linecap="round"><path d="M12 56L60 16Q68 10 75 15Q81 21 75 27" stroke="' + W + '" stroke-width="8.5"/><path d="M12 56L60 16Q68 10 75 15Q81 21 75 27" stroke="url(#cane)" stroke-width="6"/>' +
      '<path d="M78 86V48Q78 38 86 38Q93 38 93 46" stroke="' + W + '" stroke-width="8.5"/><path d="M78 86V48Q78 38 86 38Q93 38 93 46" stroke="url(#cane)" stroke-width="6"/></g>' +
      num(10, 34, 90, W, 'middle', 40) },
    11: { pos: 'tr', bg: C, svg:
      '<g fill="none" stroke="' + T + '" stroke-width="1.8" stroke-linecap="round"><path d="M40 50Q34 66 18 80M31 63L22 60M26 70L27 80M22 75L14 72"/></g>' +
      '<g transform="translate(37 46) rotate(-152) scale(.85)"><path d="M0 0Q3 -1.225 6 -7Q9.5 -2.975 13 -10Q16.5 -3.675 20 -11Q23.5 -3.5875 27 -9.5Q30.5 -2.8 34 -6.5Q39 -1.1375 44 0Q39 1.1375 34 6.5Q30.5 2.8 27 9.5Q23.5 3.5875 20 11Q16.5 3.675 13 10Q9.5 2.975 6 7Q3 1.225 0 0Z" fill="' + W + '"/><path d="M3 0H41" stroke="' + T + '" stroke-width="1.5"/></g>' +
      '<g transform="translate(47 46) rotate(-22) scale(.9)"><path d="M0 0Q3 -1.225 6 -7Q9.5 -2.975 13 -10Q16.5 -3.675 20 -11Q23.5 -3.5875 27 -9.5Q30.5 -2.8 34 -6.5Q39 -1.1375 44 0Q39 1.1375 34 6.5Q30.5 2.8 27 9.5Q23.5 3.5875 20 11Q16.5 3.675 13 10Q9.5 2.975 6 7Q3 1.225 0 0Z" fill="' + W + '"/><path d="M3 0H41" stroke="' + T + '" stroke-width="1.5"/></g>' +
      '<circle cx="38" cy="50" r="5.5" fill="' + T + '"/><circle cx="47" cy="45" r="5.5" fill="' + T + '"/><circle cx="46" cy="56" r="5.5" fill="' + T + '"/>' +
      '<circle cx="36.5" cy="48.5" r="1.4" fill="' + W + '" opacity=".6"/><circle cx="45.5" cy="43.5" r="1.4" fill="' + W + '" opacity=".6"/><circle cx="44.5" cy="54.5" r="1.4" fill="' + W + '" opacity=".6"/>' +
      num(11, 76, 90, W, 'middle', 40) }
  };
  return { ART: ART, wavy: wavy, flake: flake, C: C, T: T, W: W };
})();

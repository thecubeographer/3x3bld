/* tips.js
   The Tips sheet. Plain words, one rule per card, and live 2x2 examples you
   step through one shot at a time with everything greyed out except the
   pieces that matter. Examples are found at open time by scanning random
   scrambles for the exact situation each card is about. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var L = Cube.SPEFFZ;
  function faceOf(l) { return Cube.FACE_ORDER[Math.floor(L.indexOf(l) / 4)]; }
  function tint(str) {
    return String(str).split('').map(function (c) {
      return L.indexOf(c) < 0 ? c : '<span class="f-' + faceOf(c) + '">' + c + '</span>';
    }).join('');
  }
  function pieceIdx(letter) {              // every sticker index on that corner
    return Cube.cPiece[letter].map(function (l) { return Cube.cornerOf[l]; });
  }
  var BUFFER = pieceIdx('A');

  /* wrong corners, not counting the buffer: pieces, not stickers */
  function wrongPieces(state) {
    var seen = {}, n = 0;
    L.split('').forEach(function (l) {
      var key = Cube.cPiece[l][0];
      if (seen[key] || Cube.cPiece['A'].indexOf(l) >= 0) return;
      seen[key] = true;
      var ok = Cube.cPiece[l].every(function (x) { return state[Cube.cornerOf[x]] === Cube.cornerOf[x]; });
      if (!ok) n++;
    });
    return n;
  }

  var N = 2;                                // which puzzle the examples are drawn on
  function findExample(test) {
    for (var i = 0; i < 5000; i++) {
      var a = N === 2 ? Cube.analyse2x2(Cube.scramble2(11)) : Cube.analyse(Cube.scramble3(22));
      if (test(a)) return a;
    }
    return null;
  }
  var EX = {
    breakin: function (a) {
      var bi = a.cornerCycles.filter(function (c) { return c.breakIn && !c.twist; });
      var tw = a.cornerCycles.filter(function (c) { return c.twist; });
      return bi.length === 1 && tw.length === 0 && a.corners.length >= 5 && a.corners.length <= 7 &&
        !a.cornerCycles[0].breakIn;
    },
    twist: function (a) {
      var tw = a.cornerCycles.filter(function (c) { return c.twist; });
      return tw.length === 1 && a.cornerCycles.length === 2 && a.corners.length <= 6 &&
        !a.cornerCycles[0].breakIn;
    }
  };

  function bracketHTML(a) {
    return a.cornerCycles.map(function (c) {
      var inner = a.corners.slice(c.from, c.to + 1).map(function (Lt, i, arr) {
        var last = c.breakIn && i === arr.length - 1 && arr.length > 1;
        return '<span class="' + (last ? 'close ' : '') + 'f-' + faceOf(Lt) + '">' + Lt + '</span>';
      }).join(' ');
      if (!c.breakIn) return '<span class="cyc">' + inner + '</span>';
      return '<span class="cyc bi' + (c.twist ? ' tw' : '') + '"><i>' + (c.twist ? 'twist' : 'break-in') +
        '</i>' + inner + '</span>';
    }).join('');
  }

  /* one shot per click: the buffer piece and the target piece stay in colour,
     everything else goes grey */
  function stepper(host, a, mode) {
    host.innerHTML =
      '<div class="tip-cube"></div>' +
      '<div class="tip-ex">' +
        '<div class="tip-letters">' + bracketHTML(a) + '</div>' +
        '<div class="tip-call"></div>' +
        '<div class="tip-ctl"><button class="btn" data-act="reset">Start over</button>' +
        '<button class="btn primary" data-act="next">Next shot</button></div>' +
      '</div>';
    var cube = Cube3D.create($('.tip-cube', host), { n: N, size: N === 3 ? 140 : 180, tilt: [-24, -38] });
    var k = 0, busy = false, call = $('.tip-call', host);
    function cycleOf(i) {
      for (var c = 0; c < a.cornerCycles.length; c++) {
        var cy = a.cornerCycles[c]; if (i >= cy.from && i <= cy.to) return cy;
      }
    }
    function show(i) {
      cube.clearLights();
      var keep = BUFFER.slice();
      if (i < a.corners.length) {
        keep = keep.concat(pieceIdx(a.corners[i]));
        cube.light([Cube.cornerOf.A, Cube.cornerOf[a.corners[i]]], true);
      }
      cube.focus(keep);
    }
    function say(i) {
      if (i >= a.corners.length) {
        call.innerHTML = '<b>Solved.</b> ' + a.corners.length + ' letters, ' + a.corners.length +
          ' algorithms.'; return;
      }
      var t = a.corners[i], cy = cycleOf(i), head = 'Shot ' + (i + 1) + ' of ' + a.corners.length + ': ';
      if (cy.twist && i === cy.from) {
        call.innerHTML = head + 'this corner is in the right spot but turned. Shoot ' + tint(t) + '.';
      } else if (cy.twist) {
        call.innerHTML = head + '<b>second shot on the same piece</b>, at ' + tint(t) + '. Now it sits right.';
      } else if (cy.breakIn && i === cy.from) {
        call.innerHTML = head + '<b>buffer piece is home but this piece is still wrong.</b> Shoot it at ' +
          tint(t) + '. That is a break-in.';
      } else if (cy.breakIn && i === cy.to) {
        call.innerHTML = head + '<b>the extra shot.</b> Back at the piece you broke in on, at ' + tint(t) +
          '. Miss this and that piece stays wrong.';
      } else {
        call.innerHTML = head + 'buffer shows ' + tint(t) + '. Shoot ' + tint(t) + '.';
      }
    }
    function mark() {
      $$('.tip-letters .cyc > span', host).forEach(function (e, i) {
        e.classList.toggle('did', i < k); e.classList.toggle('now', i === k);
      });
    }
    function reset() { k = 0; cube.setState(a.state); show(0); say(0); mark(); }
    function next() {
      if (busy || k >= a.corners.length) return;
      busy = true;
      cube.play(Cube.cornerFull[a.corners[k]], 200).then(function () {
        k++; busy = false; show(k); say(k); mark();
      });
    }
    $('[data-act="next"]', host).addEventListener('click', next);
    $('[data-act="reset"]', host).addEventListener('click', reset);
    reset();
    return a;
  }

  /* the count rule, worked on the break-in example: wrong pieces + break-ins */
  function countCard(host, a) {
    var W = wrongPieces(a.state);
    var B = a.cornerCycles.filter(function (c) { return c.breakIn; }).length;
    host.innerHTML =
      '<div class="tip-cube"></div>' +
      '<div class="tip-ex">' +
        '<div class="count-row"><span>wrong pieces (coloured)</span><b>' + W + '</b></div>' +
        '<div class="count-row"><span>break-ins</span><b>+ ' + B + '</b></div>' +
        '<div class="count-row total"><span>letters you must have</span><b>' + (W + B) + '</b></div>' +
        '<div class="tip-letters small">' + bracketHTML(a) + '</div>' +
      '</div>';
    var cube = Cube3D.create($('.tip-cube', host), { n: N, size: N === 3 ? 140 : 180, tilt: [-24, -38] });
    cube.setState(a.state);
    var keep = [];
    L.split('').forEach(function (l) {
      if (Cube.cPiece['A'].indexOf(l) >= 0) return;
      var solved = Cube.cPiece[l].every(function (x) { return a.state[Cube.cornerOf[x]] === Cube.cornerOf[x]; });
      if (!solved) keep.push(Cube.cornerOf[l]);
    });
    cube.focus(keep);
  }

  /* examples are rebuilt whenever the puzzle switches, so 3x3 mode shows
     3x3 cubes; the fixed-corner card only makes sense on a 2x2 */
  var builtFor = 0;
  function build(n) {
    n = n === 3 ? 3 : 2;
    if (builtFor === n) return;
    builtFor = n; N = n;
    $('#tips').classList.toggle('three', n === 3);
    var bi = findExample(EX.breakin), tw = findExample(EX.twist);
    if (bi) { stepper($('#tip-breakin'), bi); countCard($('#tip-count'), bi); }
    if (tw) stepper($('#tip-twist'), tw);
    $('#tip-two').innerHTML = '';
    var two = Cube3D.create($('#tip-two'), { n: 2, size: 190, tilt: [28, 40] });
    two.focus(pieceIdx('H'));
    $('#tip-parity-alg').innerHTML = window.tintMoves(Cube.PARITY_ALG);
  }
  window.Tips = { build: build };
})();

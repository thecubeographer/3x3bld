/* tips.js
   The Tips sheet: five cards, one rule each, with a live 2x2 example you step
   through one shot at a time. The examples are found at open time by scanning
   random scrambles for the situation each card is about, so they are always
   real solves the site could verify. */
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

  /* find a 2x2 scramble that shows exactly the situation a card is about */
  function findExample(test) {
    for (var i = 0; i < 4000; i++) {
      var a = Cube.analyse2x2(Cube.scramble2(11));
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
      return tw.length === 1 && a.corners.length <= 6 && !a.cornerCycles[0].breakIn;
    }
  };

  function bracketHTML(a) {
    return a.cornerCycles.map(function (c) {
      var inner = a.corners.slice(c.from, c.to + 1).map(function (Lt, i, arr) {
        var last = c.breakIn && i === arr.length - 1 && arr.length > 1;
        return '<span class="' + (last ? 'close ' : '') + 'f-' + faceOf(Lt) + '">' + Lt + '</span>';
      }).join(' ');
      if (!c.breakIn) return '<span class="cyc">' + inner + '</span>';
      return '<span class="cyc bi' + (c.twist ? ' tw' : '') + '"><i>' + (c.twist ? 'twist' : 'break in') +
        '</i>' + inner + '</span>';
    }).join('');
  }

  /* a stepper: one shot per click, with the target lit and a one-line callout */
  function stepper(host, a) {
    host.innerHTML =
      '<div class="tip-cube"></div>' +
      '<div class="tip-ex">' +
        '<div class="tip-letters">' + bracketHTML(a) + '</div>' +
        '<div class="tip-call" data-k="0"></div>' +
        '<div class="tip-ctl"><button class="btn" data-act="reset">Start over</button>' +
        '<button class="btn primary" data-act="next">Next shot</button></div>' +
      '</div>';
    var cube = Cube3D.create($('.tip-cube', host), { n: 2, size: 190, tilt: [-24, -38] });
    var start = a.state, k = 0, busy = false;
    var call = $('.tip-call', host);
    function cycleOf(i) {
      for (var c = 0; c < a.cornerCycles.length; c++) {
        var cy = a.cornerCycles[c];
        if (i >= cy.from && i <= cy.to) return cy;
      }
    }
    function light(i) {
      cube.clearLights();
      cube.light([Cube.cornerOf.A], true);
      if (i < a.corners.length) cube.light([Cube.cornerOf[a.corners[i]]], true);
    }
    function say(i) {
      if (i >= a.corners.length) {
        call.innerHTML = '<b>Solved.</b> ' + a.corners.length + ' letters, ' + a.corners.length + ' algorithms.';
        return;
      }
      var t = a.corners[i], cy = cycleOf(i), n = i + 1;
      var head = 'Shot ' + n + ' of ' + a.corners.length + ': ';
      if (cy.breakIn && i === cy.from && cy.twist) {
        call.innerHTML = head + '<b>twisted corner.</b> Right slot, wrong turn. Shoot ' + tint(t) +
          ', then another sticker of the same piece.';
      } else if (cy.breakIn && i === cy.from) {
        call.innerHTML = head + '<b>buffer is home, pieces still wrong.</b> Break in at ' + tint(t) + '.';
      } else if (cy.breakIn && i === cy.to) {
        call.innerHTML = head + '<b>the extra shot.</b> Back to the slot you broke into, as ' + tint(t) +
          '. This is the one that gets missed.';
      } else {
        call.innerHTML = head + 'buffer says ' + tint(t) + ', shoot ' + tint(t) + '.';
      }
    }
    function reset() {
      k = 0; cube.setState(start); light(0); say(0);
      $$('.tip-letters span span, .tip-letters .cyc > span', host).forEach(function (e) { e.classList.remove('did'); });
      markLetters();
    }
    function markLetters() {
      var spans = $$('.tip-letters .cyc > span:not(.close), .tip-letters .cyc > span.close', host);
      spans.forEach(function (e, i) { e.classList.toggle('did', i < k); e.classList.toggle('now', i === k); });
    }
    function next() {
      if (busy || k >= a.corners.length) return;
      busy = true;
      var t = a.corners[k];
      cube.play(Cube.cornerFull[t], 200).then(function () {
        k++; busy = false; light(k); say(k); markLetters();
      });
    }
    $('[data-act="next"]', host).addEventListener('click', next);
    $('[data-act="reset"]', host).addEventListener('click', reset);
    reset();
  }

  var built = false;
  function build() {
    if (built) return; built = true;
    var bi = findExample(EX.breakin), tw = findExample(EX.twist);
    if (bi) stepper($('#tip-breakin'), bi);
    if (tw) stepper($('#tip-twist'), tw);

    var stop = Cube3D.create($('#tip-stop'), { n: 2, size: 190, tilt: [-24, -38] });
    stop.light([Cube.cornerOf.A, Cube.cornerOf.E, Cube.cornerOf.R], true);
    var two = Cube3D.create($('#tip-two'), { n: 2, size: 190, tilt: [28, 40] });
    two.light([Cube.cornerOf.H, Cube.cornerOf.S, Cube.cornerOf.X], true);
    $('#tip-parity-alg').innerHTML = window.tintMoves(Cube.PARITY_ALG);
  }

  window.Tips = { build: build };
})();

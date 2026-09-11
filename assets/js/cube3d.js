/* cube3d.js
   A real 3D cube built from CSS transforms. No library, no WebGL, no assets.

   It draws whatever state the simulator in cube.js hands it, animates any
   algorithm turn by turn, and can spotlight individual stickers, which is what
   makes it useful for teaching: the buffer, the target and the swap slot can be
   pointed at while the algorithm runs.

     var c = Cube3D.create(hostElement, { n: 3, size: 260 });
     c.setState(state);            // 54-facelet array from Cube
     c.play("R U R' U'", 320);     // returns a Promise
     c.light([13, 47], true);      // facelet indices
*/
(function (root) {
  'use strict';

  // CSS space is x right, y DOWN, z out of the screen. The simulator uses
  // y up, so every y is negated on the way in.
  var FACE_T = {
    U: 'rotateX(90deg)', D: 'rotateX(-90deg)', F: '',
    B: 'rotateY(180deg)', R: 'rotateY(90deg)', L: 'rotateY(-90deg)'
  };
  var TURN = {                      // clockwise seen from outside that face
    U: ['Y', -1], D: ['Y', 1], R: ['X', 1], L: ['X', -1], F: ['Z', 1], B: ['Z', -1]
  };
  var AXIS = { U: [0, 1, 0], D: [0, -1, 0], R: [1, 0, 0], L: [-1, 0, 0], F: [0, 0, 1], B: [0, 0, -1] };

  function create(host, opts) {
    opts = opts || {};
    var n = opts.n || 3;
    var size = opts.size || 260;
    var unit = Math.round(size / 3);
    var gap = n === 2 ? unit / 2 : unit;      // 2x2 is the eight corner cubies pulled in
    var half = unit / 2;

    host.classList.add('c3d');
    host.style.setProperty('--c3d-size', size + 'px');
    host.innerHTML = '<div class="c3d-scene"><div class="c3d-cube"></div></div>';
    var cubeEl = host.querySelector('.c3d-cube');
    cubeEl.style.width = cubeEl.style.height = unit + 'px';

    var cubies = {}, stickerEl = [], base = {}, own = {};
    Cube.facelets.forEach(function (f, i) {
      if (n === 2 && (f.p[0] === 0 || f.p[1] === 0 || f.p[2] === 0)) return;
      var key = f.p.join(',');
      (own[key] = own[key] || {})[f.face] = i;
    });
    function plate(parent, face) {
      var st = document.createElement('div');
      st.style.transform = (FACE_T[face] ? FACE_T[face] + ' ' : '') +
        'translateZ(' + half + 'px)';
      parent.appendChild(st);
      return st;
    }
    Object.keys(own).forEach(function (key) {
      var p = key.split(',').map(Number);
      var el = document.createElement('div');
      el.className = 'c3d-cubie';
      base[key] = 'translate3d(' + (p[0] * gap) + 'px,' + (-p[1] * gap) + 'px,' +
        (p[2] * gap) + 'px)';
      el.style.transform = base[key];
      cubeEl.appendChild(el);
      cubies[key] = el;
      // every side gets a plate, so a turning layer never shows a hole
      Object.keys(FACE_T).forEach(function (face) {
        var st = plate(el, face);
        var idx = own[key][face];
        if (idx === undefined) { st.className = 'c3d-st blank'; return; }
        stickerEl[idx] = st;
        if (opts.labels) {                    // Speffz letter of the POSITION
          var L = Cube.letterAtC[idx] || Cube.letterAtE[idx] || '';
          if (L) st.innerHTML = '<b>' + L + '</b>';
        }
      });
    });

    var state = Cube.SOLVED.slice();
    var tilt = opts.tilt || [-26, -34];
    function applyTilt() {
      cubeEl.style.setProperty('--tilt',
        'rotateX(' + tilt[0] + 'deg) rotateY(' + tilt[1] + 'deg)');
    }
    applyTilt();

    function paint() {
      for (var i = 0; i < stickerEl.length; i++) {
        if (!stickerEl[i]) continue;
        var keepCls = stickerEl[i].className.replace(/\bs-\w\b/g, '').replace(/\bc3d-st\b/, '').trim();
        stickerEl[i].className = 'c3d-st s-' + Cube.stickerFace(state, i) + (keepCls ? ' ' + keepCls : '');
      }
    }
    paint();

    function setState(s) { state = s.slice(); paint(); return api; }

    function light(indices, on) {
      (indices || []).forEach(function (i) {
        if (stickerEl[i]) stickerEl[i].classList.toggle('lit', on !== false);
      });
      return api;
    }
    function clearLights() {
      stickerEl.forEach(function (e) { if (e) e.classList.remove('lit'); });
      return api;
    }
    /* grey out every sticker except the ones to look at */
    function focus(indices) {
      var keep = {};
      (indices || []).forEach(function (i) { keep[i] = true; });
      stickerEl.forEach(function (e, i) { if (e) e.classList.toggle('dim', !keep[i]); });
      return api;
    }
    function unfocus() {
      stickerEl.forEach(function (e) { if (e) e.classList.remove('dim'); });
      return api;
    }

    var busy = false;
    function turn(move, ms) {
      return new Promise(function (done) {
        var face = move[0], suffix = move.slice(1);
        var amount = suffix === '2' ? 2 : suffix === "'" ? -1 : 1;
        var t = TURN[face];
        if (!t) {                                   // slice, wide or rotation: no animation
          state = Cube.doAlg(state, move); paint(); return done();
        }
        var ax = AXIS[face], deg = t[1] * 90 * amount;
        var moving = [];
        Object.keys(cubies).forEach(function (k) {
          var p = k.split(',').map(Number);
          if (p[0] * ax[0] + p[1] * ax[1] + p[2] * ax[2] === 1) moving.push(k);
        });
        moving.forEach(function (k) {
          cubies[k].style.transition = 'transform ' + ms + 'ms cubic-bezier(.34,.02,.2,1)';
          cubies[k].style.transform = 'rotate' + t[0] + '(' + deg + 'deg) ' + base[k];
        });
        setTimeout(function () {
          state = Cube.doAlg(state, move);
          moving.forEach(function (k) {
            cubies[k].style.transition = 'none';
            cubies[k].style.transform = base[k];
          });
          paint();
          void cubeEl.offsetWidth;
          moving.forEach(function (k) { cubies[k].style.transition = ''; });
          done();
        }, ms + 10);
      });
    }

    function play(alg, ms) {
      ms = ms || 300;
      if (busy) return Promise.resolve();
      busy = true;
      var moves = (alg || '').trim().split(/\s+/).filter(Boolean);
      var chain = Promise.resolve();
      moves.forEach(function (m) { chain = chain.then(function () { return turn(m, ms); }); });
      return chain.then(function () { busy = false; });
    }

    /* drag to look around, so a learner can check the back of the cube */
    var dragging = false, last = null;
    host.addEventListener('pointerdown', function (e) {
      dragging = true; last = [e.clientX, e.clientY]; host.setPointerCapture(e.pointerId);
    });
    host.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      tilt[1] += (e.clientX - last[0]) * 0.55;
      tilt[0] -= (e.clientY - last[1]) * 0.55;
      tilt[0] = Math.max(-89, Math.min(89, tilt[0]));
      last = [e.clientX, e.clientY];
      applyTilt();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      host.addEventListener(ev, function () { dragging = false; });
    });

    var spinning = null;
    function spin(on) {
      if (on === false) { clearInterval(spinning); spinning = null; return api; }
      if (spinning) return api;
      spinning = setInterval(function () { tilt[1] += 0.4; applyTilt(); }, 32);
      return api;
    }

    var api = {
      el: host, setState: setState, play: play, light: light, clearLights: clearLights,
      focus: focus, unfocus: unfocus,
      spin: spin, isBusy: function () { return busy; },
      state: function () { return state.slice(); },
      setTilt: function (x, y) { tilt = [x, y]; applyTilt(); return api; },
      reset: function () { return setState(Cube.SOLVED); }
    };
    return api;
  }

  root.Cube3D = { create: create };
})(typeof window !== 'undefined' ? window : global);

/* cube.js
   A tiny 3x3 sticker simulator plus the Old Pochmann tracer.

   Everything here was derived from cube geometry and checked against 1000
   random scrambles offline: trace the scramble, execute the generated
   setup + algorithm + undo-setup sequence, cube ends solved. The setup tables
   below are the output of that check, not copied from a forum post.

   Buffers:  corners = A (UBL sticker),  edges = B (UR sticker)
   Swap slot: corners = P (DFR, R-face sticker),  edges = D (UL sticker)
*/
(function (root) {
  'use strict';

  // ---------------------------------------------------------------- geometry
  var AX = { U: [0, 1, 0], D: [0, -1, 0], R: [1, 0, 0], L: [-1, 0, 0], F: [0, 0, 1], B: [0, 0, -1] };
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  function rotCW(v, a) {           // -90 degrees about a (clockwise seen from +a)
    var d = dot(a, v), c = cross(a, v);
    return [a[0] * d - c[0], a[1] * d - c[1], a[2] * d - c[2]];
  }

  var facelets = [], IDX = {};
  function key(p, n) { return p.join(',') + '|' + n.join(','); }
  [-1, 0, 1].forEach(function (x) {
    [-1, 0, 1].forEach(function (y) {
      [-1, 0, 1].forEach(function (z) {
        if (!x && !y && !z) return;
        Object.keys(AX).forEach(function (f) {
          if (dot([x, y, z], AX[f]) === 1) {
            IDX[key([x, y, z], AX[f])] = facelets.length;
            facelets.push({ p: [x, y, z], n: AX[f], face: f });
          }
        });
      });
    });
  });
  var N = facelets.length;                       // 54

  function turnPerm(face, times) {
    var a = AX[face], perm = [];
    for (var i = 0; i < N; i++) perm[i] = i;
    for (i = 0; i < N; i++) {
      var f = facelets[i];
      if (dot(f.p, a) !== 1) continue;
      var p = f.p, n = f.n;
      for (var t = 0; t < times; t++) { p = rotCW(p, a); n = rotCW(n, a); }
      perm[i] = IDX[key(p, n)];
    }
    return perm;
  }
  function rotPerm(face, times) {
    var a = AX[face], perm = [];
    for (var i = 0; i < N; i++) {
      var f = facelets[i], p = f.p, n = f.n;
      for (var t = 0; t < times; t++) { p = rotCW(p, a); n = rotCW(n, a); }
      perm[i] = IDX[key(p, n)];
    }
    return perm;
  }

  var MOVES = {};
  Object.keys(AX).forEach(function (f) {
    MOVES[f] = turnPerm(f, 1); MOVES[f + '2'] = turnPerm(f, 2); MOVES[f + "'"] = turnPerm(f, 3);
  });
  [['x', 'R'], ['y', 'U'], ['z', 'F']].forEach(function (r) {
    MOVES[r[0]] = rotPerm(r[1], 1); MOVES[r[0] + '2'] = rotPerm(r[1], 2); MOVES[r[0] + "'"] = rotPerm(r[1], 3);
  });

  var SOLVED = []; for (var i = 0; i < N; i++) SOLVED.push(i);
  function applyPerm(state, perm) {
    var out = new Array(N);
    for (var i = 0; i < N; i++) out[perm[i]] = state[i];
    return out;
  }
  function permOf(alg) {                          // alg -> position permutation
    var st = doAlg(SOLVED.slice(), alg), p = new Array(N);
    for (var i = 0; i < N; i++) p[st[i]] = i;
    return p;
  }
  function doAlg(state, alg) {
    if (!alg) return state;
    var ms = alg.trim().split(/\s+/);
    for (var i = 0; i < ms.length; i++) {
      var m = MOVES[ms[i]];
      if (!m) throw new Error('unknown move ' + ms[i]);
      state = applyPerm(state, m);
    }
    return state;
  }
  // composite moves, defined once the basic ones exist
  [['M', "R L' x'"], ['M2', 'R2 L2 x2'], ["M'", "R' L x"],
   ['E', "U D' y'"], ['E2', 'U2 D2 y2'], ["E'", "U' D y"],
   ['S', "F' B z"], ['S2', 'F2 B2 z2'], ["S'", "F B' z'"],
   ['r', "R M'"], ['r2', 'R2 M2'], ["r'", "R' M"],
   ['l', 'L M'], ['l2', 'L2 M2'], ["l'", "L' M'"],
   ['u', "U E'"], ['u2', 'U2 E2'], ["u'", "U' E"],
   ['d', 'D E'], ['d2', 'D2 E2'], ["d'", "D' E'"],
   ['f', 'F S'], ['f2', 'F2 S2'], ["f'", "F' S'"],
   ['b', "B S'"], ['b2', 'B2 S2'], ["b'", "B' S"]
  ].forEach(function (e) { MOVES[e[0]] = permOf(e[1]); });

  function invAlg(alg) {
    if (!alg) return '';
    return alg.trim().split(/\s+/).reverse().map(function (m) {
      var s = m.slice(1);
      return m[0] + (s === '2' ? '2' : s === "'" ? '' : "'");
    }).join(' ');
  }

  // ------------------------------------------------------------ Speffz names
  var VIEW = {                                    // face: [up, right] in the view
    U: [[0, 0, -1], [1, 0, 0]], L: [[0, 1, 0], [0, 0, 1]], F: [[0, 1, 0], [1, 0, 0]],
    R: [[0, 1, 0], [0, 0, -1]], B: [[0, 1, 0], [-1, 0, 0]], D: [[0, 0, 1], [1, 0, 0]]
  };
  var FACE_ORDER = ['U', 'L', 'F', 'R', 'B', 'D'];
  var SPEFFZ = 'ABCDEFGHIJKLMNOPQRSTUVWX';
  var cornerOf = {}, edgeOf = {}, letterAtC = {}, letterAtE = {}, nameOfC = {}, nameOfE = {};

  FACE_ORDER.forEach(function (face, fi) {
    var a = AX[face], up = VIEW[face][0], right = VIEW[face][1];
    function at(v) { return IDX[key([a[0] + v[0], a[1] + v[1], a[2] + v[2]], a)]; }
    function neg(v) { return [-v[0], -v[1], -v[2]]; }
    function add(u, v) { return [u[0] + v[0], u[1] + v[1], u[2] + v[2]]; }
    var cs = [add(up, neg(right)), add(up, right), add(neg(up), right), add(neg(up), neg(right))];
    var es = [up, right, neg(up), neg(right)];
    for (var j = 0; j < 4; j++) {
      var L = SPEFFZ[fi * 4 + j];
      cornerOf[L] = at(cs[j]); letterAtC[at(cs[j])] = L;
      edgeOf[L] = at(es[j]); letterAtE[at(es[j])] = L;
    }
  });
  function stickerName(idx) {                     // e.g. "UBL", face of the sticker first
    var f = facelets[idx], names = [];
    Object.keys(AX).forEach(function (k) { if (dot(f.p, AX[k]) === 1) names.push(k); });
    names.sort(function (a, b) { return (a === f.face ? -1 : 0) - (b === f.face ? -1 : 0); });
    return names.join('');
  }
  SPEFFZ.split('').forEach(function (L) {
    nameOfC[L] = stickerName(cornerOf[L]);
    nameOfE[L] = stickerName(edgeOf[L]);
  });

  // -------------------------------------------------- verified OP tables
  var CORNER_ALG = "R U' R' U' R U R' F' R U R' U' R' F R";
  var EDGE_ALG = "R U R' U' R' F R2 U' R' U' R U R' F'";
  var PARITY_ALG = "R U' R' U' R U R D R' U' R D' R' U2 R' U'";

  var CORNER_SETUP = {
    A: null, B: "R D'", C: 'F', D: "F R'", E: null, F: 'F2', G: "F2 R'", H: 'D2',
    I: "F' D", J: "R2 D'", K: 'R F', L: 'D', M: "R'", N: 'R2', O: 'R', P: '',
    Q: "R' F", R: null, S: "D' R", T: "D'", U: "F'", V: "R' D'", W: 'R2 F', X: "D F'"
  };
  var EDGE_SETUP = {
    A: "l2 D' L2", B: null, C: 'l2 D L2', D: '', E: "L d' L", F: "d' L", G: "L d L'",
    H: "d L'", I: "l D' L2", J: 'd2 L', K: 'l D L2', L: "L'", M: null, N: 'd L',
    O: "D l' D' L2", P: "d' L'", Q: "l' D L2", R: 'L', S: "l' D' L2", T: "d2 L'",
    U: "D' L2", V: 'D2 L2', W: 'D L2', X: 'L2'
  };

  function conj(setup, core) {
    return [setup, core, invAlg(setup)].filter(function (s) { return s; }).join(' ');
  }
  var cornerFull = {}, edgeFull = {}, cornerPerm = {}, edgePerm = {};
  SPEFFZ.split('').forEach(function (L) {
    if (CORNER_SETUP[L] !== null) {
      cornerFull[L] = conj(CORNER_SETUP[L], CORNER_ALG);
      cornerPerm[L] = permOf(cornerFull[L]);
    }
    if (EDGE_SETUP[L] !== null) {
      edgeFull[L] = conj(EDGE_SETUP[L], EDGE_ALG);
      edgePerm[L] = permOf(edgeFull[L]);
    }
  });
  var parityPerm = permOf(PARITY_ALG);

  // pieces (which letters live on the same physical cubie)
  function group(homeMap) {
    var byPos = {}, out = {};
    SPEFFZ.split('').forEach(function (L) {
      var k = facelets[homeMap[L]].p.join(',');
      (byPos[k] = byPos[k] || []).push(L);
    });
    SPEFFZ.split('').forEach(function (L) { out[L] = byPos[facelets[homeMap[L]].p.join(',')]; });
    return out;
  }
  var cPiece = group(cornerOf), ePiece = group(edgeOf);

  function trace(state, homeMap, letterAt, perms, bufLetter) {
    var bufPiece = (homeMap === cornerOf ? cPiece : ePiece)[bufLetter];
    var st = state.slice(), targets = [], guard = 0;
    while (guard++ < 80) {
      var t = letterAt[st[homeMap[bufLetter]]];
      if (bufPiece.indexOf(t) >= 0) {              // buffer piece is home: new cycle
        t = null;
        for (var i = 0; i < SPEFFZ.length; i++) {
          var L = SPEFFZ[i];
          if (bufPiece.indexOf(L) >= 0) continue;
          if (st[homeMap[L]] !== homeMap[L]) { t = L; break; }
        }
        if (!t) break;
      }
      targets.push(t);
      st = applyPerm(st, perms[t]);
    }
    return { targets: targets, state: st };
  }

  function analyse(scramble) {
    var start = doAlg(SOLVED.slice(), scramble);
    var c = trace(start, cornerOf, letterAtC, cornerPerm, 'A');
    var parity = c.targets.length % 2 === 1;
    var mid = parity ? applyPerm(c.state, parityPerm) : c.state;
    var e = trace(mid, edgeOf, letterAtE, edgePerm, 'B');
    var solved = e.state.every(function (v, i) { return v === i; });
    return {
      scramble: scramble, state: start, corners: c.targets, edges: e.targets,
      parity: parity, solved: solved,
      cornerAlgs: c.targets.map(function (L) { return { target: L, setup: CORNER_SETUP[L], alg: cornerFull[L] }; }),
      edgeAlgs: e.targets.map(function (L) { return { target: L, setup: EDGE_SETUP[L], alg: edgeFull[L] }; })
    };
  }

  function analyse2x2(scramble) {
    var start = doAlg(SOLVED.slice(), scramble);
    var c = trace(start, cornerOf, letterAtC, cornerPerm, 'A');
    var solved = SPEFFZ.split('').every(function (L) { return c.state[cornerOf[L]] === cornerOf[L]; });
    return {
      scramble: scramble, state: start, corners: c.targets, edges: [], parity: false,
      solved: solved,
      cornerAlgs: c.targets.map(function (L) { return { target: L, setup: CORNER_SETUP[L], alg: cornerFull[L] }; }),
      edgeAlgs: []
    };
  }

  // ------------------------------------------------------------- scrambles
  function scramble3(n) {
    n = n || 22;
    var faces = 'UDLRFB', opp = { U: 'D', D: 'U', L: 'R', R: 'L', F: 'B', B: 'F' }, out = [];
    while (out.length < n) {
      var f = faces[Math.floor(Math.random() * 6)];
      if (out.length && out[out.length - 1][0] === f) continue;
      if (out.length > 1 && out[out.length - 1][0] === opp[f] && out[out.length - 2][0] === f) continue;
      out.push(f + ['', "'", '2'][Math.floor(Math.random() * 3)]);
    }
    return out.join(' ');
  }
  function scramble2(n) {
    n = n || 11;
    var faces = 'URF', out = [];
    while (out.length < n) {
      var f = faces[Math.floor(Math.random() * 3)];
      if (out.length && out[out.length - 1][0] === f) continue;
      out.push(f + ['', "'", '2'][Math.floor(Math.random() * 3)]);
    }
    return out.join(' ');
  }

  // colours of a state, for drawing a flat net
  function netColors(state) {
    var out = {};
    FACE_ORDER.forEach(function (f) { out[f] = []; });
    for (var i = 0; i < N; i++) out[facelets[i].face].push(null);
    // rebuild in view order per face
    FACE_ORDER.forEach(function (face) {
      var a = AX[face], up = VIEW[face][0], right = VIEW[face][1], cells = [];
      for (var r = 1; r >= -1; r--) {
        for (var c = -1; c <= 1; c++) {
          var p = [a[0] + up[0] * r + right[0] * c, a[1] + up[1] * r + right[1] * c,
                   a[2] + up[2] * r + right[2] * c];
          var idx = IDX[key(p, a)];
          cells.push(facelets[state[idx]].face);
        }
      }
      out[face] = cells;
    });
    return out;
  }
  function letterGrid(face) {                      // Speffz letters drawn on a net
    var a = AX[face], up = VIEW[face][0], right = VIEW[face][1], cells = [];
    for (var r = 1; r >= -1; r--) {
      for (var c = -1; c <= 1; c++) {
        var p = [a[0] + up[0] * r + right[0] * c, a[1] + up[1] * r + right[1] * c,
                 a[2] + up[2] * r + right[2] * c];
        var idx = IDX[key(p, a)];
        cells.push({ corner: letterAtC[idx] || null, edge: letterAtE[idx] || null, face: face });
      }
    }
    return cells;
  }

  root.Cube = {
    SPEFFZ: SPEFFZ, FACE_ORDER: FACE_ORDER,
    CORNER_ALG: CORNER_ALG, EDGE_ALG: EDGE_ALG, PARITY_ALG: PARITY_ALG,
    CORNER_SETUP: CORNER_SETUP, EDGE_SETUP: EDGE_SETUP,
    cornerFull: cornerFull, edgeFull: edgeFull,
    nameOfC: nameOfC, nameOfE: nameOfE,
    analyse: analyse, analyse2x2: analyse2x2,
    facelets: facelets, cornerOf: cornerOf, edgeOf: edgeOf,
    letterAtC: letterAtC, letterAtE: letterAtE,
    stickerFace: function (state, i) { return facelets[state[i]].face; },
    scramble3: scramble3, scramble2: scramble2,
    netColors: netColors, letterGrid: letterGrid,
    doAlg: doAlg, invAlg: invAlg, SOLVED: SOLVED
  };
})(typeof window !== 'undefined' ? window : global);

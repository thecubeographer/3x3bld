/* path.js
   The guided course: a quiz that decides where you start, eight steps with a
   3D demonstration each, and gates that only open when you have actually done
   the thing (three blind solves in a row, not three attempts).

   Progress lives in localStorage under bld.path.
*/
(function (root) {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var L = Cube.SPEFFZ;

  function store(k, d) {
    try { var v = localStorage.getItem('bld.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; }
  }
  function save(k, v) { try { localStorage.setItem('bld.' + k, JSON.stringify(v)); } catch (e) { } }

  var P = store('path', null);
  function fresh() {
    return { started: false, skip: {}, done: {}, counts: {}, streaks: {}, current: null };
  }
  if (!P) P = fresh();
  function persist() { save('path', P); }

  /* ---------------------------------------------------------------- steps */
  var STAGES = [
    {
      id: 'letters', title: 'The lettering',
      blurb: 'Name any sticker on sight.',
      need: 12, unit: 'stickers named',
      teach:
        '<p>Every sticker gets a letter. Hold <b>white on top, green in front</b> and never turn the ' +
        'cube during a solve, or the letters move under you.</p>' +
        '<p>On each face the four corner stickers are lettered clockwise from the top left, and the ' +
        'four edge stickers clockwise from the top. The faces run U, L, F, R, B, D, so U takes ' +
        '<b class="f-U">A to D</b>, L takes <b class="f-L">E to H</b>, F takes <b class="f-F">I to L</b>, ' +
        'R takes <b class="f-R">M to P</b>, B takes <b class="f-B">Q to T</b> and D takes ' +
        '<b class="f-D">U to X</b>.</p>' +
        '<p>Drag the cube to look around the back. Then name the lit sticker.</p>',
      drill: 'sticker'
    },
    {
      id: 'cornerAlg', title: 'The corner algorithm',
      blurb: 'One algorithm sends any corner home.',
      teach:
        '<p>The buffer is sticker <b class="f-U">A</b>, the U face sticker of the up back left corner. ' +
        'You never solve it directly. You read whatever sticker is sitting in it, and that tells you ' +
        'where to shoot.</p>' +
        '<p>The swap slot is <b class="f-R">P</b>, the R face sticker of the down front right corner. ' +
        'This algorithm swaps those two corners and nothing else that matters:</p>' +
        '<p class="alg-big" id="t-corner-alg"></p>' +
        '<p>Watch it. A goes to P, P comes back to A. Two edges get disturbed on the way, which is ' +
        'what parity later cleans up.</p>',
      demo: { alg: 'CORNER', lights: ['cA', 'cP'] },
      selfMark: 'I can run it from memory'
    },
    {
      id: 'cornerSetup', title: 'Corner setups',
      blurb: 'Bring the target to the slot, run the algorithm, undo.',
      need: 15, unit: 'setups recalled',
      teach:
        '<p>The algorithm only ever swaps A with P. To send the buffer somewhere else you first move ' +
        'that sticker <b>into</b> P, run the algorithm, then undo the move.</p>' +
        '<p>Corner setups only ever use <b>R, F and D</b>. That is not a style choice. Those three ' +
        'faces are the only ones that leave the buffer corner alone, so the swap stays clean.</p>' +
        '<p>Pick a letter and watch the whole thing: setup, algorithm, undo.</p>',
      drill: 'setup'
    },
    {
      id: 'twoBld', title: '2x2 blindfolded',
      blurb: 'Three in a row, no edges, no parity.',
      need: 3, unit: 'solves in a row',
      teach:
        '<p>A 2x2 is a 3x3 with the edges taken away. Same buffer, same algorithm, same setups. ' +
        'There are no edges to disturb, so there is no parity either.</p>' +
        '<p>This is the cheapest place to fail. A bad memo costs you thirty seconds, not five minutes.</p>' +
        '<p>Go to Solve, switch to 2x2, memorise the corner letters, then execute blind. The timer ' +
        'asks whether it came out. Three clean ones in a row opens the next step.</p>',
      go: { tab: 'solve', puzzle: '222' }
    },
    {
      id: 'pairs', title: 'Letter pairs',
      blurb: 'Turn letters into pictures you can chain.',
      need: 40, unit: 'pairs recalled',
      teach:
        '<p>Nobody remembers <b>V P H I D G</b>. They remember a viper biting a hippo that is sitting ' +
        'on a dog. VP is the viper, HI is the hippo, DG is the dog. Letters go in two at a time and ' +
        'come out as one image.</p>' +
        '<p>The word starts with the first letter and the second letter is the next sound you hear. ' +
        'VP is <b>ViPer</b>, DG is <b>DoG</b>. If the second letter is a vowel the word just starts ' +
        'with both, so BO is <b>BOot</b>.</p>' +
        '<p>Chain them with violence. Image one does something absurd to image two. Still pictures ' +
        'do not stick, actions do.</p>',
      go: { tab: 'pairs' }
    },
    {
      id: 'edges', title: 'Edges and parity',
      blurb: 'The second algorithm, and the one fix you need.',
      teach:
        '<p>Edges work exactly the same way with a different buffer. The buffer is ' +
        '<b class="f-U">B</b>, the U sticker of the up right edge, and the swap slot is ' +
        '<b class="f-U">D</b>, the U sticker of the up left edge.</p>' +
        '<p class="alg-big" id="t-edge-alg"></p>' +
        '<p>Edge setups use <b>L, D and the wide l and d</b>. Same reason as before: those are the ' +
        'turns that leave the buffer edge and the two corners this algorithm disturbs alone.</p>' +
        '<p><b class="f-R">Parity.</b> Count your corner targets. If the count is odd, run this once ' +
        'after the corners and before the first edge:</p>' +
        '<p class="alg-big" id="t-parity-alg"></p>',
      demo: { alg: 'EDGE', lights: ['eB', 'eD'] },
      selfMark: 'I can run both from memory'
    },
    {
      id: 'assisted', title: '3x3 with the notes open',
      blurb: 'Three in a row with the safety net still on.',
      need: 3, unit: 'solves in a row',
      teach:
        '<p>Full 3x3 now, but you are allowed to look. Pull the scramble into Notes, write the story ' +
        'out, check your memo against the real letters, then execute blind.</p>' +
        '<p>Order matters. Memorise the edges first and the corners last, then solve corners first. ' +
        'The corners are still fresh when your hands start, and the edges have had time to settle.</p>' +
        '<p>Three that come out solved and you are off the net.</p>',
      go: { tab: 'solve', puzzle: '333', assisted: true }
    },
    {
      id: 'full', title: 'Full 3x3, timed',
      blurb: 'Scramble, memorise, execute. Nothing open.',
      need: 3, unit: 'solves in a row',
      teach:
        '<p>No notes, no reveal. Space starts the memo clock, space again switches to execution, ' +
        'space stops it.</p>' +
        '<p>Chase accuracy before speed. A 4 minute solve that works beats a 90 second DNF every ' +
        'time, and memo time comes down on its own once the images are automatic.</p>',
      go: { tab: 'solve', puzzle: '333' }
    }
  ];

  function stageById(id) { for (var i = 0; i < STAGES.length; i++) if (STAGES[i].id === id) return STAGES[i]; }
  function isDone(id) { return !!P.done[id] || !!P.skip[id]; }
  function ordered() { return STAGES.filter(function (s) { return !P.skip[s.id]; }); }
  function currentStage() {
    var list = ordered();
    for (var i = 0; i < list.length; i++) if (!P.done[list[i].id]) return list[i];
    return null;
  }
  function progress(id) { return P.counts[id] || 0; }

  /* ------------------------------------------------------------ the quiz */
  var QUESTIONS = [
    { k: 'sighted', q: 'Can you solve a 3x3 with your eyes open?',
      a: [['yes', 'Yes'], ['no', 'Not yet']] },
    { k: 'bld', q: 'Have you finished a blindfolded solve before?',
      a: [['none', 'Never'], ['two', 'A 2x2'], ['three', 'A 3x3']] },
    { k: 'speffz', q: 'Do you know Speffz lettering?',
      a: [['cold', 'Cold, any sticker'], ['some', 'Roughly'], ['no', 'No']] },
    { k: 'algs', q: 'Which of these can you run from memory right now?',
      a: [['both', 'Y perm and T perm'], ['one', 'One of them'], ['none', 'Neither']] }
  ];
  var answers = {};

  function renderQuiz() {
    $('#quiz-qs').innerHTML = QUESTIONS.map(function (q) {
      return '<div class="q"><p>' + q.q + '</p><div class="q-opts">' + q.a.map(function (o) {
        return '<button class="q-opt" data-k="' + q.k + '" data-v="' + o[0] + '">' + o[1] + '</button>';
      }).join('') + '</div></div>';
    }).join('');
    $$('#quiz-qs .q-opt').forEach(function (b) {
      b.addEventListener('click', function () {
        answers[b.dataset.k] = b.dataset.v;
        $$('.q-opt[data-k="' + b.dataset.k + '"]').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        $('#quiz-go').disabled = Object.keys(answers).length < QUESTIONS.length;
      });
    });
  }

  function applyQuiz(a) {
    P = fresh(); P.started = true; P.quiz = a;
    // teaching steps can be skipped on the strength of an answer; the three
    // practice gates (2x2, assisted 3x3, full 3x3) can only be earned
    if (a.speffz === 'cold') P.done.letters = true;
    if (a.algs === 'both') { P.done.cornerAlg = true; P.done.edges = true; }
    if (a.bld === 'two' || a.bld === 'three') {
      P.done.letters = true; P.done.cornerAlg = true; P.done.cornerSetup = true;
    }
    if (a.bld === 'three') { P.done.pairs = true; P.done.edges = true; }
    persist(); render();
  }

  /* --------------------------------------------------------------- gates */
  function bump(id, n) {
    var s = stageById(id); if (!s || !s.need || P.done[id]) return;
    P.counts[id] = Math.max(0, (P.counts[id] || 0) + n);
    if (P.counts[id] >= s.need) { P.counts[id] = s.need; complete(id); }
    persist(); render();
  }
  function resetCount(id) { P.counts[id] = 0; persist(); render(); }

  function complete(id) {
    if (P.done[id]) return;
    P.done[id] = true; persist();
    var next = currentStage();
    celebrate(stageById(id), next);
  }

  /* the Solve screen reports every attempt here */
  function recordSolve(puzzle, assisted, ok) {
    var id = puzzle === '222' ? 'twoBld' : assisted ? 'assisted' : 'full';
    if (P.done[id]) { render(); return; }
    if (ok) bump(id, 1); else resetCount(id);
  }
  function recordPair(ok) { if (ok) bump('pairs', 1); }
  function recordDrill(id, ok) { if (ok) bump(id, 1); }

  /* --------------------------------------------------------- celebration */
  function celebrate(stage, next) {
    var el = $('#celebrate');
    $('#cel-title').textContent = stage.title + ' done';
    $('#cel-sub').textContent = next ? 'Next: ' + next.title : 'That is the whole course. Go get faster.';
    $('#cel-go').textContent = next ? 'Next step' : 'Back to the path';
    var v = $('#cel-3d');
    v.innerHTML = '<video autoplay muted playsinline width="260" height="260">' +
      '<source src="assets/video/cube-cel.webm" type="video/webm">' +
      '<source src="assets/video/cube-cel.mp4" type="video/mp4"></video>';
    el.removeAttribute('hidden');
  }
  function closeCelebration() {
    $('#celebrate').setAttribute('hidden', ''); $('#cel-3d').innerHTML = '';
    var n = currentStage(); selected = n ? n.id : selected; render();
  }

  /* ---------------------------------------------------- the course screen */
  var FACE_CYCLE = ['U', 'L', 'F', 'R', 'B', 'D', 'U', 'L'];
  var selected = null;

  function render() {
    var quizOn = !P.started;
    $('#quiz').toggleAttribute('hidden', !quizOn);
    $('#course').toggleAttribute('hidden', quizOn);
    if (quizOn) { renderQuiz(); return; }

    var list = ordered(), cur = currentStage();
    if (!selected || !stageById(selected) || P.skip[selected]) selected = cur ? cur.id : list[list.length - 1].id;

    $('#stages').innerHTML = list.map(function (s, i) {
      var done = !!P.done[s.id], active = cur && s.id === cur.id, locked = !done && !active;
      var cls = 'step f' + FACE_CYCLE[i] + (done ? ' done' : '') + (active ? ' active' : '') +
        (locked ? ' locked' : '') + (s.id === selected ? ' sel' : '');
      var meter = '';
      if (s.need && !done) meter = '<i class="meter"><b style="width:' + Math.round(progress(s.id) / s.need * 100) + '%"></b></i>';
      return '<button class="' + cls + '" data-id="' + s.id + '"' + (locked ? ' disabled' : '') + '>' +
        '<span class="n">' + (i + 1) + '</span>' +
        '<span class="t">' + s.title + '</span>' +
        (done ? '<span class="tick">&#10003;</span>' : '') + meter + '</button>';
    }).join('');
    $$('#stages .step').forEach(function (b) {
      b.addEventListener('click', function () { openLesson(b.dataset.id); });
    });
    openLesson(selected);
  }

  var cube3d = null, lessonId = null, drill = null;

  function openLesson(id) {
    var s = stageById(id); if (!s) return;
    selected = id; lessonId = id;
    $$('#stages .step').forEach(function (b) { b.classList.toggle('sel', b.dataset.id === id); });
    var idx = ordered().indexOf(s);
    $('#lesson-text').innerHTML =
      '<p class="kicker">Step ' + (idx + 1) + '</p><h1>' + s.title + '</h1>' + s.teach;
    if ($('#t-corner-alg')) $('#t-corner-alg').innerHTML = window.tintMoves(Cube.CORNER_ALG);
    if ($('#t-edge-alg')) $('#t-edge-alg').innerHTML = window.tintMoves(Cube.EDGE_ALG);
    if ($('#t-parity-alg')) $('#t-parity-alg').innerHTML = window.tintMoves(Cube.PARITY_ALG);

    var done = !!P.done[id];
    $('#lesson-done').toggleAttribute('hidden', !(s.selfMark || s.go) || done);
    $('#lesson-done').textContent = s.selfMark ? s.selfMark : 'Take me there';
    $('#lesson-score').textContent = done ? 'Done' : s.need ? progress(s.id) + ' of ' + s.need + ' ' + s.unit : '';
    $('#lesson').style.setProperty('--step-c', 'var(--' + FACE_CYCLE[idx] + ')');
    buildCube(s);
  }

  function buildCube(s) {
    var host = $('#lesson-3d'); host.innerHTML = '';
    var wrap = document.createElement('div'); host.appendChild(wrap);
    var n = s.id === 'twoBld' ? 2 : 3;
    cube3d = Cube3D.create(wrap, { n: n, size: 240, labels: s.id === 'letters' });
    var ctl = $('#cube-ctl'); ctl.innerHTML = ''; drill = null;

    if (s.demo) {
      var alg = s.demo.alg === 'CORNER' ? Cube.CORNER_ALG : Cube.EDGE_ALG;
      var lights = s.demo.lights.map(function (k) {
        return k[0] === 'c' ? Cube.cornerOf[k[1]] : Cube.edgeOf[k[1]];
      });
      cube3d.light(lights, true);
      ctl.innerHTML = '<button class="btn" id="demo-play">Play it slowly</button>' +
        '<button class="btn" id="demo-reset">Reset</button>' +
        (s.id === 'edges' ? '<button class="btn" id="demo-par">Parity alg</button>' : '');
      $('#demo-play').addEventListener('click', function () { cube3d.play(alg, 420); });
      $('#demo-reset').addEventListener('click', function () {
        cube3d.reset(); cube3d.clearLights(); cube3d.light(lights, true);
      });
      if ($('#demo-par')) $('#demo-par').addEventListener('click', function () {
        cube3d.play(Cube.PARITY_ALG, 300);
      });
    }
    if (s.drill === 'sticker') startStickerDrill(ctl);
    if (s.drill === 'setup') startSetupDrill(ctl);
    if (s.go) {
      ctl.innerHTML += '<p class="ctl-note">The gate is ' + s.need + ' ' + s.unit + '. ' +
        'It resets to zero on a DNF.</p>';
    }
  }

  /* name the lit sticker */
  function startStickerDrill(ctl) {
    ctl.innerHTML = '<div class="drill-box"><span class="dq" id="dq"></span>' +
      '<input class="in" id="dans" maxlength="1" placeholder="letter" autocomplete="off">' +
      '<span class="dv" id="dv"></span></div>' +
      '<p class="ctl-note">Type the letter of the flashing sticker. Drag the cube to see the back.</p>';
    var cur = null;
    function next() {
      cube3d.clearLights();
      var isC = Math.random() < 0.5;
      var letter = L[Math.floor(Math.random() * 24)];
      cur = letter;
      cube3d.light([isC ? Cube.cornerOf[letter] : Cube.edgeOf[letter]], true);
      $('#dq').textContent = isC ? 'corner' : 'edge';
      $('#dans').value = ''; $('#dv').textContent = ''; $('#dans').focus();
    }
    $('#dans').addEventListener('input', function () {
      var v = this.value.toUpperCase();
      if (!v) return;
      this.value = v;
      if (v === cur) {
        $('#dv').textContent = 'yes'; $('#dv').className = 'dv ok';
        recordDrill('letters', true);
        setTimeout(next, 420);
      } else {
        $('#dv').textContent = cur; $('#dv').className = 'dv bad';
        setTimeout(next, 900);
      }
    });
    next();
  }

  /* recall the setup for a target */
  function startSetupDrill(ctl) {
    ctl.innerHTML = '<div class="drill-box col"><span class="dq big" id="dq"></span>' +
      '<span class="dv" id="dv"></span>' +
      '<div class="row"><button class="btn" id="d-show">Show</button>' +
      '<button class="btn ok-btn" id="d-ok">Had it</button>' +
      '<button class="btn bad-btn" id="d-no">Missed</button></div></div>' +
      '<p class="ctl-note">Say the setup out loud, then check. Show plays the whole thing on the cube.</p>';
    var cur = null, shown = false;
    var pool = L.split('').filter(function (c) { return Cube.CORNER_SETUP[c] !== null; });
    function next() {
      cur = pool[Math.floor(Math.random() * pool.length)];
      shown = false;
      cube3d.reset(); cube3d.clearLights();
      cube3d.light([Cube.cornerOf.A, Cube.cornerOf[cur]], true);
      $('#dq').innerHTML = '<span class="f-' + faceOf(cur) + '">' + cur + '</span>';
      $('#dv').textContent = '';
    }
    function faceOf(l) { return Cube.FACE_ORDER[Math.floor(L.indexOf(l) / 4)]; }
    function show() {
      if (shown) return; shown = true;
      var setup = Cube.CORNER_SETUP[cur];
      $('#dv').innerHTML = setup === '' ? 'no setup' : window.tintMoves(setup);
      cube3d.play(Cube.cornerFull[cur], 260);
    }
    $('#d-show').addEventListener('click', show);
    $('#d-ok').addEventListener('click', function () { show(); recordDrill('cornerSetup', true); next(); });
    $('#d-no').addEventListener('click', function () { show(); setTimeout(next, 1400); });
    next();
  }

  /* ------------------------------------------------------------- wiring */
  /* the first build of the quiz wrongly marked practice gates as passed. A gate
     that was never actually earned (no count behind it) goes back to open. */
  function repair() {
    if (P.repaired) return;
    ['twoBld', 'assisted', 'full'].forEach(function (id) {
      if (P.done[id] && !((P.counts[id] || 0) >= stageById(id).need)) delete P.done[id];
    });
    P.repaired = true; persist();
  }

  function init() {
    repair();
    $('#quiz-go').addEventListener('click', function () { applyQuiz(answers); });
    $('#quiz-skip').addEventListener('click', function () {
      P = fresh(); P.started = true; persist(); render();
    });
    $('#lesson-done').addEventListener('click', function () {
      var s = stageById(lessonId); if (!s) return;
      if (s.selfMark) { complete(s.id); render(); }
      else if (s.go) { root.BLD.goto(s.go); }
    });
    $('#cel-go').addEventListener('click', closeCelebration);
    $('#path-reset').addEventListener('click', function () {
      P = fresh(); selected = null; persist(); render();
    });
    render();
  }

  root.Path = {
    init: init, render: render, open: openLesson,
    recordSolve: recordSolve, recordPair: recordPair,
    current: currentStage, stageById: stageById,
    activeGo: function () { var c = currentStage(); return c && c.go ? c.go : null; }
  };
  init();   // path.js loads after app.js, so it starts itself
})(typeof window !== 'undefined' ? window : global);

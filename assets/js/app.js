/* app.js , BLD Trainer UI. Vanilla, no build step. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var L = Cube.SPEFFZ, FACES = Cube.FACE_ORDER;

  /* every Speffz letter belongs to one face, and gets that face's colour */
  function faceOf(l) { return FACES[Math.floor(L.indexOf(l) / 4)]; }
  function tint(str) {
    return String(str).split('').map(function (c) {
      return L.indexOf(c) < 0 ? c : '<span class="f-' + faceOf(c) + '">' + c + '</span>';
    }).join('');
  }

  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem('bld.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; }
    },
    set: function (k, v) { try { localStorage.setItem('bld.' + k, JSON.stringify(v)); } catch (e) { } }
  };
  var toastEl = $('#toast'), toastT;
  function toast(m) {
    toastEl.textContent = m; toastEl.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 1500);
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(ms) {
    if (ms == null) return '0.00';
    var s = ms / 1000;
    return s < 60 ? s.toFixed(2)
      : Math.floor(s / 60) + ':' + pad(Math.floor(s % 60)) + '.' + pad(Math.round((s % 1) * 100));
  }
  /* two-step confirm, so no OS confirm() dialog ever appears */
  function confirmed(btn, run) {
    var label = btn.textContent, t;
    btn.addEventListener('click', function () {
      if (btn.classList.contains('armed')) {
        clearTimeout(t); btn.classList.remove('armed'); btn.textContent = label; run();
      } else {
        btn.classList.add('armed'); btn.textContent = btn.dataset.confirm;
        t = setTimeout(function () { btn.classList.remove('armed'); btn.textContent = label; }, 2600);
      }
    });
  }

  var overrides = store.get('letters', {});
  function word(p) { return overrides[p] || window.PAIRS[p] || p; }
  function pairsOf(s) { var o = []; for (var i = 0; i < s.length; i += 2) o.push(s.substr(i, 2)); return o; }

  /* ------------------------------------------------------------------ tabs */
  $$('#tabs .tab').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('#tabs .tab').forEach(function (x) { x.classList.remove('is-on'); });
      $$('.screen').forEach(function (p) { p.classList.remove('is-on'); });
      b.classList.add('is-on');
      $('#page-' + b.dataset.tab).classList.add('is-on');
    });
  });
  function onTab(id) { return $('#page-' + id).classList.contains('is-on'); }

  /* ------------------------------------------------------------------- net */
  function drawColorNet(host, colors) {
    host.className = 'net' + (host.dataset.size ? ' ' + host.dataset.size : '');
    host.innerHTML = FACES.map(function (f) {
      return '<div class="face ' + f + '">' +
        colors[f].map(function (c) { return '<div class="cell c-' + c + '"></div>'; }).join('') + '</div>';
    }).join('');
  }
  /* ----------------------------------------------------------------- solve */
  var puzzle = store.get('puzzle', '333'), scramble = '', analysis = null;
  var assisted = store.get('assisted', true);
  var sessions = { '333': store.get('session.333', []), '222': store.get('session.222', []) };

  /* the scramble is easier to read when each turn wears its own face colour */
  var MOVE_FACE = { U: 'U', D: 'D', L: 'L', R: 'R', F: 'F', B: 'B', M: 'L', E: 'D', S: 'F',
                    x: 'R', y: 'U', z: 'F' };
  function tintMoves(alg) {
    return alg.split(/\s+/).map(function (m) {
      var f = MOVE_FACE[m[0]] || MOVE_FACE[m[0].toUpperCase()];
      return f ? '<span class="f-' + f + '">' + m + '</span>' : m;
    }).join(' ');
  }

  window.tintMoves = tintMoves;

  function newScramble() {
    scramble = puzzle === '222' ? Cube.scramble2(11) : Cube.scramble3(22);
    $('#scramble').innerHTML = tintMoves(scramble);
    analysis = puzzle === '222' ? Cube.analyse2x2(scramble) : Cube.analyse(scramble);
    renderSolution();
  }
  $('#new-scramble').addEventListener('click', newScramble);
  $$('#puzzle-seg .seg-btn').forEach(function (b) {
    b.classList.toggle('is-on', b.dataset.puzzle === puzzle);
    b.addEventListener('click', function () {
      $$('#puzzle-seg .seg-btn').forEach(function (x) { x.classList.remove('is-on'); });
      b.classList.add('is-on'); puzzle = b.dataset.puzzle; store.set('puzzle', puzzle);
      newScramble(); renderSession();
    });
  });

  function splitAlg(setup, core) {
    if (!setup) return '<span class="core">' + tintMoves(core) + '</span>';
    return tintMoves(setup) + ' <span class="sep">/</span> <span class="core">' + tintMoves(core) +
      '</span> <span class="sep">/</span> ' + tintMoves(Cube.invAlg(setup));
  }
  function memoHTML(title, letters, flag) {
    return '<h3>' + title + ' <span>' + letters.length + '</span>' + (flag || '') + '</h3>' +
      '<div class="memo-letters">' + tint(letters.join(' ')) + '</div>' +
      '<div class="memo-pairs">' + pairsOf(letters.join('')).map(function (p) {
        return '<div class="mp" data-pair="' + p + '"><i>' + tint(p) + '</i><b>' +
          (p.length === 2 ? word(p) : '&middot;') + '</b></div>';
      }).join('') + '</div>';
  }
  function renderSolution() {
    if (!analysis) return;
    $('#memo-corners').innerHTML = memoHTML('corners', analysis.corners,
      analysis.parity ? '<span class="par">parity</span>' : '');
    $('#memo-edges').innerHTML = analysis.edges.length
      ? memoHTML('edges', analysis.edges) : '<h3>edges <span>0</span></h3>';
    $('#alg-list').innerHTML =
      analysis.cornerAlgs.map(function (a) {
        return '<li><b class="f-' + faceOf(a.target) + '">' + a.target + '</b> ' +
          splitAlg(a.setup, Cube.CORNER_ALG) + '</li>';
      }).join('') +
      (analysis.parity ? '<li><b class="f-R">P</b> <span class="core">' + tintMoves(Cube.PARITY_ALG) + '</span></li>' : '') +
      analysis.edgeAlgs.map(function (a) {
        return '<li><b class="f-' + faceOf(a.target) + '">' + a.target + '</b> ' +
          splitAlg(a.setup, Cube.EDGE_ALG) + '</li>';
      }).join('');
    drawColorNet($('#net'), Cube.netColors(analysis.state));
    $('#check-c').value = ''; $('#check-e').value = ''; $('#check-out').textContent = '';
  }
  /* click a pair chip to hide its image and test yourself */
  $('#solution').addEventListener('click', function (e) {
    var mp = e.target.closest('.mp'); if (!mp) return;
    var b = $('b', mp);
    if (b.dataset.hid) { b.textContent = b.dataset.hid; delete b.dataset.hid; }
    else { b.dataset.hid = b.textContent; b.textContent = '?'; }
  });

  function checkMemo() {
    function clean(s) { return (s || '').toUpperCase().replace(/[^A-X]/g, ''); }
    var c = clean($('#check-c').value), e = clean($('#check-e').value), out = $('#check-out');
    if (!c && !e) { out.textContent = ''; return; }
    function diff(a, b) { for (var i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) return i + 1; return 0; }
    var m = [];
    if (c) { var dc = diff(c, analysis.corners.join('')); m.push(dc ? 'corners off at ' + dc : 'corners ok'); }
    if (e) { var de = diff(e, analysis.edges.join('')); m.push(de ? 'edges off at ' + de : 'edges ok'); }
    out.textContent = m.join(' / ');
    out.style.color = /off/.test(out.textContent) ? 'var(--R)' : 'var(--F)';
  }
  $('#check-c').addEventListener('input', checkMemo);
  $('#check-e').addEventListener('input', checkMemo);

  function sheetOpen() { return !$('#solution').hasAttribute('hidden'); }
  function toggleSheet(force) {
    var open = force == null ? !sheetOpen() : force;
    $('#solution').toggleAttribute('hidden', !open);
  }
  $('#toggle-solution').addEventListener('click', function () { toggleSheet(); });
  $('#close-solution').addEventListener('click', function () { toggleSheet(false); });
  $('#solution').addEventListener('mousedown', function (e) { if (e.target === this) toggleSheet(false); });

  /* ----------------------------------------------------------------- timer */
  var TS = 'idle', t0 = 0, memoMs = 0, raf = null;
  var clock = $('#clock'), phase = $('#phase');
  function setPhase(p, c) { phase.textContent = p; clock.className = 'clock' + (c ? ' ' + c : ''); }
  function tick() { clock.textContent = fmt(Date.now() - t0); raf = requestAnimationFrame(tick); }

  /* one state machine, two ways in: the space bar on a desk, a tap on a phone */
  function press() {
    if (TS === 'idle') { TS = 'armed'; clock.textContent = '0.00'; setPhase('release to start', 'armed'); }
    else if (TS === 'memo') {
      memoMs = Date.now() - t0; TS = 'exec';
      $('#split-memo').textContent = fmt(memoMs); setPhase('execution', 'exec');
    } else if (TS === 'exec') {
      var total = Date.now() - t0; cancelAnimationFrame(raf); TS = 'idle';
      clock.textContent = fmt(total); $('#split-exec').textContent = fmt(total - memoMs);
      setPhase('ready', '');
      pending = { ms: total, memo: memoMs, exec: total - memoMs, pen: null,
                  at: Date.now(), assisted: assisted };
      $('#verdict-ask').removeAttribute('hidden');
    }
  }
  function release() {
    if (TS !== 'armed') return;
    TS = 'memo'; t0 = Date.now(); memoMs = 0;
    $('#split-memo').textContent = '0.00'; $('#split-exec').textContent = '0.00';
    setPhase('memo', 'memo'); tick();
  }
  function timerLive() { return onTab('solve') && !sheetOpen() && !pending; }

  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (e.key === 'Escape' && sheetOpen()) { toggleSheet(false); return; }
    if (!onTab('solve')) return;
    if (pending) {
      if (e.code === 'KeyY') settle(true);
      if (e.code === 'KeyN') settle(false);
      if (e.code === 'Space') e.preventDefault();
      return;
    }
    if (e.code === 'KeyS' && TS === 'idle') { toggleSheet(); return; }
    if (e.code === 'KeyN' && TS === 'idle') { newScramble(); return; }
    if (e.code !== 'Space' || sheetOpen()) return;
    e.preventDefault(); if (e.repeat) return;
    press();
  });
  document.addEventListener('keyup', function (e) {
    if (e.code !== 'Space' || !timerLive()) return;
    e.preventDefault(); release();
  });
  var stageEl = $('#page-solve .stage');
  stageEl.addEventListener('pointerdown', function (e) {
    if (!timerLive() || e.button) return;
    e.preventDefault(); press();
  });
  stageEl.addEventListener('pointerup', function () { if (timerLive()) release(); });
  stageEl.addEventListener('pointercancel', function () { if (TS === 'armed') { TS = 'idle'; setPhase('ready', ''); } });

  var pending = null;
  function settle(ok) {
    if (!pending) return;
    pending.pen = ok ? null : 'DNF';
    sessions[puzzle].push(pending);
    store.set('session.' + puzzle, sessions[puzzle]);
    var wasAssisted = pending.assisted;
    pending = null;
    $('#verdict-ask').setAttribute('hidden', '');
    renderSession();
    if (window.Path) Path.recordSolve(puzzle, wasAssisted, ok);
    newScramble();
  }
  $$('#verdict-ask [data-v]').forEach(function (b) {
    b.addEventListener('click', function () { settle(b.dataset.v === 'ok'); });
  });

  function lastSolve() { var s = sessions[puzzle]; return s[s.length - 1]; }
  function pen(kind) {
    var s = lastSolve(); if (!s) return;
    s.pen = s.pen === kind ? null : kind;
    store.set('session.' + puzzle, sessions[puzzle]); renderSession();
  }
  $('#pen-plus2').addEventListener('click', function () { pen('+2'); });
  $('#pen-dnf').addEventListener('click', function () { pen('DNF'); });
  $('#del-last').addEventListener('click', function () {
    sessions[puzzle].pop(); store.set('session.' + puzzle, sessions[puzzle]); renderSession();
  });
  confirmed($('#clear-session'), function () {
    sessions[puzzle] = []; store.set('session.' + puzzle, []); renderSession();
  });

  function effMs(s) { return s.pen === 'DNF' ? Infinity : s.ms + (s.pen === '+2' ? 2000 : 0); }
  function avgOf(n, arr) {
    if (arr.length < n) return null;
    var w = arr.slice(-n).map(effMs).sort(function (a, b) { return a - b; }).slice(1, -1);
    if (w.indexOf(Infinity) >= 0) return Infinity;
    return w.reduce(function (a, b) { return a + b; }, 0) / w.length;
  }
  function renderSession() {
    var arr = sessions[puzzle], ok = arr.filter(function (s) { return s.pen !== 'DNF'; });
    function stat(k, v) {
      return '<div class="stat"><span>' + k + '</span><b>' +
        (v == null ? '&ndash;' : v === Infinity ? 'dnf' : typeof v === 'string' ? v : fmt(v)) + '</b></div>';
    }
    $('#stats').innerHTML =
      stat('solves', String(arr.length)) +
      stat('best', ok.length ? Math.min.apply(null, ok.map(effMs)) : null) +
      stat('ao5', avgOf(5, arr)) + stat('ao12', avgOf(12, arr)) +
      stat('mean', ok.length ? ok.map(effMs).reduce(function (a, b) { return a + b; }, 0) / ok.length : null) +
      stat('best memo', ok.length ? Math.min.apply(null, ok.map(function (s) { return s.memo; })) : null) +
      stat('accuracy', arr.length ? Math.round(ok.length / arr.length * 100) + '%' : null);
    $('#solve-list').innerHTML = arr.slice().reverse().map(function (s, i) {
      return '<div class="srow' + (s.pen === 'DNF' ? ' dnf' : '') + '">' +
        '<span class="n">' + (arr.length - i) + '</span>' +
        '<span class="t">' + fmt(s.ms + (s.pen === '+2' ? 2000 : 0)) + (s.pen === '+2' ? '+' : '') + '</span>' +
        '<span class="s">' + fmt(s.memo) + ' / ' + fmt(s.exec) + '</span></div>';
    }).join('');
  }

  /* --------------------------------------------------------------- letters */
  function renderGrid() {
    var head = '<tr><th class="corner"></th>' + L.split('').map(function (c) {
      return '<th class="f-' + faceOf(c) + '">' + c + '</th>';
    }).join('') + '</tr>';
    var body = L.split('').map(function (r) {
      return '<tr class="band-' + faceOf(r) + '"><td class="rh" style="background:var(--' + faceOf(r) + ')">' +
        r + '</td>' + L.split('').map(function (c) {
          var p = r + c;
          return '<td data-pair="' + p + '" class="' + (r === c ? 'same' : '') +
            (overrides[p] ? ' edited' : '') + '">' + word(p) + '</td>';
        }).join('') + '</tr>';
    }).join('');
    $('#pair-grid').innerHTML = head + body;
  }
  /* inline edit, never prompt() */
  $('#pair-grid').addEventListener('click', function (e) {
    var td = e.target.closest('td[data-pair]');
    if (!td || td.classList.contains('same') || $('.cell-in', td)) return;
    var p = td.dataset.pair, cur = word(p);
    td.innerHTML = '<input class="cell-in" value="' + cur.replace(/"/g, '&quot;') + '">';
    var inp = $('.cell-in', td); inp.focus(); inp.select();
    function done(save) {
      var v = inp.value.trim();
      if (save && v) { if (v === window.PAIRS[p]) delete overrides[p]; else overrides[p] = v; store.set('letters', overrides); }
      td.classList.toggle('edited', !!overrides[p]);
      td.textContent = word(p);
    }
    inp.addEventListener('blur', function () { done(true); });
    inp.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); inp.blur(); }
      if (ev.key === 'Escape') { ev.preventDefault(); inp.value = cur; inp.blur(); }
    });
  });
  $('#letter-search').addEventListener('input', function () {
    var q = this.value.trim().toLowerCase();
    $$('#pair-grid td[data-pair]').forEach(function (td) {
      td.classList.toggle('hit', !!q && (td.dataset.pair.toLowerCase().indexOf(q) === 0 ||
        td.textContent.toLowerCase().indexOf(q) >= 0));
    });
  });
  $('#export-letters').addEventListener('click', function () {
    var all = {};
    L.split('').forEach(function (r) { L.split('').forEach(function (c) { all[r + c] = word(r + c); }); });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(all, null, 1)], { type: 'application/json' }));
    a.download = 'bld-letter-pairs.json'; a.click(); toast('576 exported');
  });
  $('#import-letters').addEventListener('click', function () { $('#file-input').click(); });
  $('#file-input').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return;
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var d = JSON.parse(fr.result), n = 0;
        Object.keys(d).forEach(function (k) {
          if (/^[A-X]{2}$/.test(k) && d[k] && d[k] !== window.PAIRS[k]) { overrides[k] = d[k]; n++; }
        });
        store.set('letters', overrides); renderGrid(); toast(n + ' imported');
      } catch (err) { toast('bad json'); }
    };
    fr.readAsText(f); e.target.value = '';
  });
  confirmed($('#reset-letters'), function () {
    overrides = {}; store.set('letters', {}); renderGrid(); toast('defaults');
  });

  /* ------------------------------------------------------------ pair drill */
  var pairStats = store.get('pairstats', {});
  var pd = { mode: 'p2w', scope: 'all', cur: null, shown: false, t: 0, right: 0, wrong: 0, times: [] };
  var pool = [];
  L.split('').forEach(function (r) { L.split('').forEach(function (c) { if (r !== c) pool.push(r + c); }); });

  function weakest(n) {
    return Object.keys(pairStats).map(function (k) {
      var s = pairStats[k];
      return { p: k, miss: s.miss || 0, seen: s.seen || 0, avg: s.seen ? s.ms / s.seen : 0 };
    }).filter(function (x) { return x.seen; })
      .sort(function (a, b) { return (b.miss / b.seen - a.miss / a.seen) || (b.avg - a.avg); })
      .slice(0, n);
  }
  function nextPair() {
    var src = pool;
    if (pd.scope === 'weak') {
      var w = weakest(40).map(function (x) { return x.p; });
      if (w.length > 4) src = w;
    }
    pd.cur = src[Math.floor(Math.random() * src.length)];
    pd.shown = false; pd.t = Date.now();
    $('#pair-answer').setAttribute('hidden', '');
    $('#pair-grade').setAttribute('hidden', '');
    $('#pair-keys').removeAttribute('hidden');
    if (pd.mode === 'p2w') {
      $('#pair-prompt').className = 'prompt';
      $('#pair-prompt').innerHTML = tint(pd.cur);
      $('#pair-answer').textContent = word(pd.cur);
    } else {
      $('#pair-prompt').className = 'prompt words';
      $('#pair-prompt').textContent = word(pd.cur);
      $('#pair-answer').innerHTML = tint(pd.cur);
    }
  }
  function showPair() {
    if (!pd.cur || pd.shown) return;
    pd.shown = true;
    $('#pair-answer').removeAttribute('hidden');
    $('#pair-grade').removeAttribute('hidden');
    $('#pair-keys').setAttribute('hidden', '');
  }
  function gradePair(ok) {
    if (!pd.cur) return;
    var s = pairStats[pd.cur] || { seen: 0, miss: 0, ms: 0 };
    s.seen++; s.ms += Date.now() - pd.t; if (!ok) s.miss++;
    pairStats[pd.cur] = s; store.set('pairstats', pairStats);
    if (ok) { pd.right++; pd.times.push(Date.now() - pd.t); } else pd.wrong++;
    if (window.Path) Path.recordPair(ok);
    renderPairStats(); nextPair();
  }
  function renderPairStats() {
    var avg = pd.times.length ? pd.times.reduce(function (a, b) { return a + b; }, 0) / pd.times.length : 0;
    $('#pair-stats').textContent = pd.right + ' / ' + (pd.right + pd.wrong) +
      (avg ? '  ' + (avg / 1000).toFixed(2) + 's' : '');
    var w = weakest(46);
    $('#weak-list').innerHTML = w.length ? w.map(function (x) {
      return '<span class="chip">' + tint(x.p) + ' <b class="f-R">' + x.miss + '</b>/' + x.seen +
        ' ' + (x.avg / 1000).toFixed(1) + 's</span>';
    }).join('') : '<span class="chip empty">weak pairs land here once you drill</span>';
  }
  $$('#pair-mode .seg-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('#pair-mode .seg-btn').forEach(function (x) { x.classList.remove('is-on'); });
      b.classList.add('is-on'); pd.mode = b.dataset.mode; nextPair();
    });
  });
  $$('#pair-scope .seg-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('#pair-scope .seg-btn').forEach(function (x) { x.classList.remove('is-on'); });
      b.classList.add('is-on'); pd.scope = b.dataset.scope; nextPair();
    });
  });
  confirmed($('#clear-pair-stats'), function () {
    pairStats = {}; store.set('pairstats', {}); renderPairStats(); toast('wiped');
  });

  /* ----------------------------------------------------------------- notes */
  var notes = store.get('notes', { c: '', e: '', lines: {} });
  function clean(s) { return (s || '').toUpperCase().replace(/[^A-X]/g, ''); }

  /* letters go in as one run and come back split into pairs, so a long memo
     never has to be counted off by eye */
  function chunk(raw) {
    var out = [];
    for (var i = 0; i < raw.length; i += 2) out.push(raw.substr(i, 2));
    return out.join(' ');
  }
  function setField(el, raw) { el.value = chunk(raw); }
  function reformat(el) {
    var caret = el.selectionStart;
    var before = clean(el.value.slice(0, caret)).length;
    var raw = clean(el.value);
    el.value = chunk(raw);
    var pos = el.value.length, n = 0;
    if (before === 0) pos = 0;
    else for (var i = 0; i < el.value.length; i++) {
      if (el.value[i] !== ' ') n++;
      if (n === before) { pos = i + 1; break; }
    }
    el.setSelectionRange(pos, pos);
    return raw;
  }

  function renderStory(which) {
    var raw = clean(which === 'c' ? notes.c : notes.e);
    var host = $(which === 'c' ? '#story-corners' : '#story-edges');
    var prs = pairsOf(raw);
    host.innerHTML = prs.map(function (p, i) {
      var one = p.length === 1, key = which + i + p;
      return '<div class="srow2' + (one ? ' single' : '') + '">' +
        '<span class="ix">' + (i + 1) + '</span>' +
        '<span class="pr">' + tint(p) + '</span>' +
        '<span class="wd">' + (one ? 'odd one out' : word(p)) + '</span>' +
        '<input data-key="' + key + '" value="' + (notes.lines[key] || '').replace(/"/g, '&quot;') +
        '" placeholder="what happens"></div>';
    }).join('');
    $$('input[data-key]', host).forEach(function (inp) {
      inp.addEventListener('input', function () {
        notes.lines[inp.dataset.key] = inp.value; store.set('notes', notes);
      });
    });
    var full = Math.floor(raw.length / 2);
    $(which === 'c' ? '#count-c' : '#count-e').innerHTML = raw.length
      ? raw.length + ' targets, ' + full + ' pair' + (full === 1 ? '' : 's') +
        (raw.length % 2 ? ' <u>+1 odd</u>' : '')
      : '';
    if (which === 'c') appendParityStep(host);
  }

  /* parity is a step in the solve, so it lives at the foot of the corner list:
     last corner, this, then the first edge. It switches itself on when the
     corner count is odd. Click the row to force it either way. */
  var parityOpen = false;
  function parityAuto() { return clean(notes.c).length % 2 === 1; }
  function parityOn() {
    return (notes.par === true || notes.par === false) ? notes.par : parityAuto();
  }
  function appendParityStep(host) {
    var on = parityOn(), forced = notes.par === true || notes.par === false;
    host.insertAdjacentHTML('beforeend',
      '<div class="srow2 par-step' + (on ? ' on' : '') + '" id="par-step">' +
        '<span class="ix"><span class="par-dot"></span></span>' +
        '<span class="pr">PAR</span>' +
        '<span class="wd">' + (on ? 'parity, then start edges' : 'no parity') +
          (forced ? ', forced' : '') + '</span>' +
        '<button class="btn" id="parity-alg-btn">' + (parityOpen ? 'hide' : 'alg') + '</button>' +
      '</div>' +
      '<div class="par-alg" id="parity-drop"' + (parityOpen ? '' : ' hidden') + '>' +
        '<code>' + tintMoves(Cube.PARITY_ALG) + '</code>' +
        '<span class="par-note">once, after the last corner and before the first edge</span>' +
      '</div>');
    $('#par-step').addEventListener('click', function (e) {
      if (e.target.closest('#parity-alg-btn')) return;
      notes.par = forced ? null : !parityAuto();
      store.set('notes', notes); renderStory('c');
    });
    $('#parity-alg-btn').addEventListener('click', function () {
      parityOpen = !parityOpen; renderStory('c');
    });
  }
  $('#in-corners').addEventListener('input', function () {
    notes.c = reformat(this); store.set('notes', notes); renderStory('c');
  });
  $('#in-edges').addEventListener('input', function () {
    notes.e = reformat(this); store.set('notes', notes); renderStory('e');
  });

  /* three ways to look at the same memo: everything, images only (the letters
     are covered so you have to name them), or blind (nothing but the row
     numbers, click a row to peek at it) */
  var nmode = store.get('nmode', 'all');
  function applyMode() {
    var page = $('#page-notepad');
    page.className = page.className.replace(/\bm-\w+\b/g, '').trim() + ' m-' + nmode;
    $$('.srow2.peek').forEach(function (r) { r.classList.remove('peek'); });
    $$('#notes-mode .seg-btn').forEach(function (b) {
      b.classList.toggle('is-on', b.dataset.nmode === nmode);
    });
  }
  $$('#notes-mode .seg-btn').forEach(function (b) {
    b.addEventListener('click', function () { nmode = b.dataset.nmode; store.set('nmode', nmode); applyMode(); });
  });
  $('#page-notepad').addEventListener('click', function (e) {
    if (nmode === 'all') return;
    var row = e.target.closest('.srow2');
    if (!row || row.classList.contains('par-step')) return;
    row.classList.toggle('peek');
  });

  /* the scramble the memo came from, kept on this screen so the letters can be
     checked against the cube without switching back to Solve */
  function renderNoteScramble() {
    var band = $('#note-scramble');
    band.toggleAttribute('hidden', !notes.scr);
    if (!notes.scr) return;
    $('#note-scramble-tag').textContent = (notes.scrPuzzle || '3x3') + ' scramble';
    $('#note-scramble-text').innerHTML = tintMoves(notes.scr);
  }

  $('#pull-memo').addEventListener('click', function () {
    if (!analysis) return;
    notes.c = analysis.corners.join(''); notes.e = analysis.edges.join('');
    notes.scr = scramble; notes.scrPuzzle = puzzle === '222' ? '2x2' : '3x3';
    setField($('#in-corners'), notes.c); setField($('#in-edges'), notes.e);
    store.set('notes', notes); renderStory('c'); renderStory('e'); renderNoteScramble();
    toast('pulled');
  });
  $('#copy-notes').addEventListener('click', function () {
    function block(t, raw, w) {
      return t + ': ' + clean(raw) + '\n' + pairsOf(clean(raw)).map(function (p, i) {
        return '  ' + p + '  ' + (p.length === 2 ? word(p) : '.') +
          (notes.lines[w + i + p] ? '  ' + notes.lines[w + i + p] : '');
      }).join('\n');
    }
    navigator.clipboard.writeText(block('Corners', notes.c, 'c') + '\n\n' + block('Edges', notes.e, 'e'))
      .then(function () { toast('copied'); }, function () { toast('clipboard blocked'); });
  });
  confirmed($('#clear-notes'), function () {
    notes = { c: '', e: '', lines: {}, par: null }; store.set('notes', notes);
    $('#in-corners').value = ''; $('#in-edges').value = '';
    renderStory('c'); renderStory('e'); renderNoteScramble();
  });

  /* on a phone the five tabs need the whole rail, so the puzzle switch moves
     down beside the scramble */
  var seg = $('#puzzle-seg'), railEl = $('.rail'), bandEl = $('#page-solve .scramble-band');
  function placeSeg() {
    var small = innerWidth <= 600;
    if (small && seg.parentNode !== bandEl) bandEl.appendChild(seg);
    if (!small && seg.parentNode !== railEl) railEl.appendChild(seg);
  }
  placeSeg(); addEventListener('resize', placeSeg);

  if (window.matchMedia && matchMedia('(hover: none)').matches) {
    document.body.classList.add('touch');
    $('#page-solve .keys').innerHTML = 'tap: memo <span>&rsaquo;</span> exec <span>&rsaquo;</span> stop';
    $('#pair-keys').textContent = 'tap to show';
  }

  /* the course jumps you into a screen already set up for the step */
  window.BLD = {
    goto: function (go) {
      if (go.puzzle && go.puzzle !== puzzle) {
        var b = $('#puzzle-seg .seg-btn[data-puzzle="' + go.puzzle + '"]');
        if (b) b.click();
      }
      if (typeof go.assisted === 'boolean') setAssisted(go.assisted);
      $('#tabs .tab[data-tab="' + (go.tab || 'solve') + '"]').click();
    },
    assisted: function () { return assisted; }
  };
  function setAssisted(v) {
    assisted = v; store.set('assisted', v);
    $('#toggle-solution').toggleAttribute('hidden', !v);
    $('#assist-tag').textContent = v ? 'notes allowed' : 'no help';
    $('#assist-tag').className = 'assist-tag' + (v ? '' : ' strict');
  }
  $('#assist-tag').addEventListener('click', function () { setAssisted(!assisted); });

  /* ------------------------------------------------------------------ boot */
  $('#net').dataset.size = '';
  renderGrid(); renderPairStats(); renderSession(); setAssisted(assisted);
  setField($('#in-corners'), notes.c); setField($('#in-edges'), notes.e);
  renderStory('c'); renderStory('e'); renderNoteScramble(); applyMode();
  nextPair();
  newScramble();
})();

// ===== 하늘 방어대 — 화면·진행·저장 =====
(() => {
  const $ = id => document.getElementById(id);
  const SAVE = 'skyDefense.save.v1', META = 'skyDefense.meta.v1';
  let run = null, W = null, snap = null, mode = 'title', paused = false, demo = null, demoT = 0, demoCity = 0;
  const mouse = { x: 640, y: 380, cx: -1, cy: -1, inCv: false };

  // ----- 저장 -----
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 불가 */ } }
  function load(k) { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  const meta = Object.assign({ best: 0, clears: 0, hardClears: 0, time: 0, kills: 0, bestChain: 0, sfx: 0.85, bgm: 0.6, shake: true, lines: true, seenHow: false }, load(META) || {});
  function saveMeta() { store(META, meta); }
  function saveRun() { if (run) store(SAVE, run); }
  function validRun(r) {
    return r && r.v === 1 && r.up && Array.isArray(r.bld) && r.bld.length === 8 && Array.isArray(r.stars) && r.city >= 0 && r.city < 6 && r.wave >= 1 && r.wave <= 10;
  }
  function loadRun() {
    const r = load(SAVE);
    if (!validRun(r)) return null;
    const base = Engine.newRun(r.diff);
    for (const k in base) if (r[k] === undefined) r[k] = base[k];
    for (const k in base.up) if (typeof r.up[k] !== 'number') r.up[k] = 0;
    for (const k in base.stats) if (typeof r.stats[k] !== 'number') r.stats[k] = 0;
    return r;
  }

  // ----- 화면 맞추기 -----
  function fit() {
    const st = $('stage'), s = Math.min(innerWidth / 1280, innerHeight / 720);
    st.style.transform = `scale(${s})`;
    st.style.left = (innerWidth - 1280 * s) / 2 + 'px';
    st.style.top = (innerHeight - 720 * s) / 2 + 'px';
    Render.resize(s);
  }
  function toggleFull() {
    try {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      else document.exitFullscreen();
    } catch (e) { /* 지원 안 함 */ }
  }

  // ----- 입력 -----
  function toStage(cx, cy) {
    const r = $('cv').getBoundingClientRect();
    return [(cx - r.left) / r.width * VW, (cy - r.top) / r.height * VH];
  }
  window.addEventListener('mousemove', e => {
    mouse.cx = e.clientX; mouse.cy = e.clientY;
    const p = toStage(e.clientX, e.clientY); mouse.x = p[0]; mouse.y = p[1];
    mouse.inCv = e.target === $('cv');
  });
  $('cv').addEventListener('mouseleave', () => { mouse.inCv = false; });
  $('cv').addEventListener('click', e => {
    Sound.init();
    if (mode !== 'play' || paused || !W) return;
    const p = toStage(e.clientX, e.clientY);
    const wasMega = W.megaArmed;
    Engine.fire(W, p[0], p[1]);
    if (wasMega) updateHud(true);
  });
  // 스페이스바 = 좌클릭
  window.addEventListener('keydown', e => {
    if (e.code !== 'Space' && e.key !== ' ') return;
    e.preventDefault();
    if (e.repeat) return;
    const x = mouse.cx >= 0 ? mouse.cx : innerWidth / 2, y = mouse.cy >= 0 ? mouse.cy : innerHeight / 2;
    const el = document.elementFromPoint(x, y);
    if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window }));
  });
  window.addEventListener('keyup', e => { if (e.code === 'Space' || e.key === ' ') e.preventDefault(); });
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('button');
    if (b) { Sound.init(); setTimeout(() => b.blur(), 0); }
  }, true);
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play' && !paused) openPause(); });
  window.addEventListener('blur', () => { if (mode === 'play' && !paused) openPause(); });

  // ----- 작은 도우미 -----
  const fmt = n => Math.round(n).toLocaleString('ko-KR');
  // 받침에 맞는 조사: J('노을 항구', '을', '를') → '노을 항구를'
  function J(word, a, b) {
    let ch = 0;
    for (let i = word.length - 1; i >= 0; i--) { const c = word.charCodeAt(i); if (c >= 0xAC00 && c <= 0xD7A3) { ch = c; break; } if (/[0-9]/.test(word[i])) { ch = -1; break; } }
    const jong = ch > 0 ? (ch - 0xAC00) % 28 : 0;
    if (a === '으로') return word + (jong && jong !== 8 ? '으로' : '로');
    return word + (jong ? a : b);
  }
  const starStr = n => '★'.repeat(n) + '<i>' + '★'.repeat(3 - n) + '</i>';
  const ICON = {
    radius: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="10" fill="#fff3b0"/><g stroke="#ffb040" stroke-width="4" stroke-linecap="round"><path d="M24 3v8M24 37v8M3 24h8M37 24h8M9 9l6 6M33 33l6 6M39 9l-6 6M9 39l6-6"/></g></svg>',
    speed: '<svg viewBox="0 0 48 48"><path d="M31 5c8 2 12 6 12 12L22 38 10 26 31 5z" fill="#cfe0ff"/><circle cx="31" cy="17" r="4" fill="#5a8cff"/><path d="M10 26l-7 7 8 2 2 8 7-7z" fill="#ff8a4a"/></svg>',
    ammo: '<svg viewBox="0 0 48 48"><g fill="#e8f0ff"><rect x="11" y="5" width="7" height="16" rx="3.5"/><rect x="20.5" y="3" width="7" height="18" rx="3.5"/><rect x="30" y="5" width="7" height="16" rx="3.5"/></g><rect x="5" y="18" width="38" height="25" rx="3" fill="#b07a3a"/><rect x="5" y="18" width="38" height="6" fill="#8a5a2a"/></svg>',
    chain: '<svg viewBox="0 0 48 48"><g fill="none" stroke-width="5"><circle cx="15" cy="31" r="10" stroke="#ff9a4a"/><circle cx="33" cy="17" r="10" stroke="#ff5aa0"/></g><circle cx="24" cy="24" r="5" fill="#fff"/></svg>',
    battery: '<svg viewBox="0 0 48 48"><path d="M3 45l8-14h26l8 14z" fill="#6a7088"/><rect x="21" y="6" width="6" height="22" rx="3" fill="#dfe8ff" transform="rotate(28 24 30)"/><path d="M13 31a11 11 0 0 1 22 0z" fill="#aab4cc"/></svg>',
    shield: '<svg viewBox="0 0 48 48"><path d="M24 3l17 6v13c0 11-8 19-17 23C15 41 7 33 7 22V9z" fill="#5ac8ff"/><path d="M24 10l10 4v8c0 7-4 12-10 15z" fill="#c6f0ff"/></svg>',
    repair: '<svg viewBox="0 0 48 48"><path d="M8 45V23l16-12 16 12v22z" fill="#d9b98a"/><path d="M4 25L24 9l20 16" fill="none" stroke="#8b2f35" stroke-width="5" stroke-linejoin="round"/><rect x="20" y="31" width="8" height="14" fill="#6a4a2a"/></svg>',
    mega: '<svg viewBox="0 0 48 48"><circle cx="24" cy="28" r="16" fill="#3a3f52"/><circle cx="24" cy="28" r="10" fill="#ffd34a"/><path d="M31 12l4-7M35 15l8-3" stroke="#ff8a3a" stroke-width="3.5" stroke-linecap="round"/><path d="M24 21l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" fill="#fff"/></svg>',
  };
  function bldSvg(alive, i) {
    const h = [26, 32, 24, 38, 30, 34, 22, 30][i];
    return alive
      ? `<svg viewBox="0 0 40 40"><rect x="7" y="${40 - h}" width="26" height="${h}" fill="#d9b98a"/><path d="M5 ${42 - h}L20 ${30 - h}L35 ${42 - h}z" fill="#8b2f35"/><rect x="12" y="${46 - h}" width="5" height="5" fill="#ffd76a"/><rect x="23" y="${46 - h}" width="5" height="5" fill="#ffd76a"/></svg>`
      : '<svg viewBox="0 0 40 40"><path d="M4 40l5-8 6 3 6-9 7 6 5-4 3 12z" fill="#4a4048"/></svg>';
  }
  function screen(html) { $('scr').innerHTML = html; }
  function on(id, fn) { const el = $(id); if (el) el.onclick = fn; }
  function showHud(v) {
    $('hud').classList.toggle('hidden', !v);
    $('stage').classList.toggle('aim', v);
    if (!v) $('megaHint').classList.add('hidden');
  }

  // ----- 데모 (배경에서 저절로 싸움) -----
  function newDemo(c) {
    const r = Engine.newRun(0);
    r.city = c; r.wave = 3 + ((Math.random() * 5) | 0); r.up.radius = 2; r.up.speed = 3; r.up.battery = 2; r.seed = (Math.random() * 1e9) | 0;
    const w = Engine.startWave(r); w.ammo = 999; if (w.boss) { w.boss = null; }
    return w;
  }
  function stepDemo(dt) {
    if (!demo || demo.city !== demoCity) demo = newDemo(demoCity);
    demoT -= dt;
    if (demoT <= 0) {
      demoT = 0.55 + Math.random() * 0.5;
      const es = demo.enemies.filter(e => e.y > 90 && e.y < 520);
      if (es.length) { es.sort((a, b) => b.y - a.y); const e = es[(Math.random() * Math.min(2, es.length)) | 0]; const p = Engine.predict(e, 0.75); Engine.fire(demo, p[0], p[1]); }
    }
    Engine.step(demo, dt);
    for (const ev of demo.ev) visual(ev, true, demo);
    demo.ev.length = 0;
    if (demo.over || demo.failT >= 0 || demo.t > 50) demo = newDemo(demoCity);
  }

  // ----- 사건 → 소리·효과 -----
  const CHAIN_COL = ['#ffffff', '#ffffff', '#ffe27a', '#ffb05a', '#ff7aa8', '#c98aff', '#7ad8ff', '#7affc8'];
  function visual(ev, quiet, w) {
    const S = n => { if (!quiet) Sound.play(n); };
    switch (ev.k) {
      case 'fire': S(ev.mega ? 'mega' : 'fire'); Render.burst(ev.x, ev.y - 8, 6, 'rgba(160,240,255,', 140, 0.3); break;
      case 'boom':
        if (ev.kind !== 'chain' && !quiet) Sound.boom(ev.kind, 0);
        if (ev.kind === 'mega') { Render.shake(14); Render.flash(0.22, '#cfeaff'); }
        Render.burst(ev.x, ev.y, ev.kind === 'chain' ? 9 : 14, ev.kind === 'mega' ? 'rgba(170,230,255,' : 'rgba(255,200,120,', ev.kind === 'mega' ? 420 : 230, 0.6);
        break;
      case 'kill': {
        if (!quiet) Sound.boom('chain', ev.n);
        Render.burst(ev.x, ev.y, 8, ev.type === 'bomb' ? 'rgba(140,255,160,' : ev.type === 'drone' ? 'rgba(120,230,255,' : ev.type === 'split' ? 'rgba(210,150,255,' : 'rgba(200,140,90,', 180, 0.9, 'debris');
        if (quiet) break;
        if (ev.n >= 2) Render.text(ev.x, ev.y - 26, (ev.n >= 6 ? '대' : '') + ev.n + '연쇄!', CHAIN_COL[Math.min(ev.n, 7)], 24 + Math.min(ev.n, 8) * 3, 1.1);
        Render.text(ev.x, ev.y + 6, '+' + ev.pts, '#ffe9a0', 18, 0.8, -30);
        if (ev.n >= 5) Render.shake(4 + Math.min(ev.n, 10));
        break;
      }
      case 'armor': S('armor'); Render.burst(ev.x, ev.y, 10, 'rgba(255,240,180,', 260, 0.35); if (!quiet) Render.text(ev.x, ev.y - 22, '깡!', '#ffe27a', 22, 0.6); break;
      case 'split': S('split'); Render.burst(ev.x, ev.y, 14, 'rgba(220,160,255,', 200, 0.5); break;
      case 'impact':
        if (ev.shield) { S('shield'); Render.burst(ev.x, ev.y, 18, 'rgba(140,230,255,', 260, 0.5); if (!quiet) Render.text(ev.x, ev.y - 30, '방어막!', '#9fe8ff', 26, 1); }
        else if (ev.hit) {
          S('bld'); Render.shake(10); Render.burst(ev.x, ev.y, 26, 'rgba(255,170,90,', 320, 0.8); Render.burst(ev.x, ev.y, 16, 'rgba(120,100,90,', 200, 1.4, 'debris');
          for (let i = 0; i < 6; i++) Render.addPart({ x: ev.x + (Math.random() - 0.5) * 40, y: ev.y, vx: (Math.random() - 0.5) * 30, vy: -30 - Math.random() * 30, life: 2, size: 12, col: 'rgba(80,70,80,', type: 'smoke' });
          if (!quiet) Render.text(ev.x, ev.y - 40, '건물 피해!', '#ff8a8a', 28, 1.2);
        } else { S('ground'); Render.burst(ev.x, ev.y, 12, 'rgba(200,170,130,', 160, 0.6, 'debris'); }
        break;
      case 'empty': S('empty'); Render.text(mouse.x, mouse.y - 40, '요격탄이 없어!', '#ff9a9a', 24, 0.8); break;
      case 'bossEnter': break;
      case 'bossHit': S('bossHit'); Render.burst(ev.x, ev.y, 12, 'rgba(255,255,200,', 300, 0.4); Render.text(ev.x, ev.y - 20, '-' + ev.dmg, '#ffb0b0', 28, 0.8); break;
      case 'bossBlock': S('block'); Render.text(ev.x, ev.y - 20, '막혔어!', '#9fe8ff', 24, 0.8); break;
      case 'bossShield': S('bshield'); Render.text(w.boss.x, w.boss.y - 70, '방어막 전개! 잠깐 기다려', '#9fe8ff', 26, 1.6, -10); break;
      case 'charge': S('charge'); Render.setBanner('광선 충전!', '모선을 두 번 맞히면 막을 수 있어!', 2.4, '#ff8a8a'); break;
      case 'chargeCancel': S('cancel2'); Render.text(ev.x, ev.y - 60, '저지 성공! +300', '#9fe8b8', 30, 1.4, -20); break;
      case 'beam': {
        S('beam'); const b = w.bld[ev.bi];
        if (b && w.boss) Render.beam(w.boss.x, w.boss.y + w.boss.h * 0.3, b.x, GROUND - b.h);
        Render.shake(12); Render.flash(0.18, '#ff8080');
        if (ev.hit) { Render.burst(b.x, GROUND - b.h, 30, 'rgba(255,120,120,', 320, 0.9); Render.text(b.x, GROUND - b.h - 30, '건물 피해!', '#ff8a8a', 28, 1.2); }
        if (ev.shield && b) Render.text(b.x, GROUND - b.h - 30, '방어막!', '#9fe8ff', 28, 1.2);
        break;
      }
      case 'enrage': S('enrage'); Render.text(w.boss.x, w.boss.y - 80, '모선이 화났어!', '#ff7a7a', 32, 1.6, -10); break;
      case 'bossDie': S('bossDie'); Render.shake(22); Render.flash(0.5, '#fff1d0'); Render.setBanner('모선 격추!', J(CITIES[w.city].boss.name, '을', '를') + ' 물리쳤어!', 2.6, '#ffe27a'); break;
      case 'resupply': S('resupply'); Render.text(640, 600, '요격탄 보급 +' + ev.n, '#9fe8b8', 28, 1.4, -20); break;
      case 'bossDrop': S('drop'); break;
      case 'fall': S('fall'); Render.setBanner('도시가 무너졌어…', '괜찮아, 이 웨이브를 다시 할 수 있어', 2.2, '#ff9a9a'); break;
      case 'win': if (!w.boss) { S('win'); Render.setBanner('웨이브 클리어!', null, 1.4, '#9fe8b8'); } break;
    }
  }

  // ----- 위쪽 정보 -----
  let hudKey = '';
  function updateHud(force) {
    if (!W || !run) return;
    const key = [run.city, run.wave, run.score + W.score, run.parts, W.megas, W.megaArmed].join('|');
    if (!force && key === hudKey) return;
    hudKey = key;
    $('hCity').textContent = CITIES[run.city].name;
    $('hWave').textContent = '웨이브 ' + run.wave + '/10';
    const th = THEME_INFO[W.theme];
    $('hTheme').textContent = th.label; $('hTheme').classList.toggle('hidden', !th.label); $('hTheme').classList.toggle('boss', W.theme === 'boss');
    $('hScore').textContent = '점수 ' + fmt(run.score + W.score);
    $('hParts').textContent = '부품 ' + fmt(run.parts);
    $('hMega').textContent = W.megas;
    $('bMega').disabled = W.megas <= 0;
    $('bMega').classList.toggle('on', W.megaArmed);
    $('megaHint').classList.toggle('hidden', !W.megaArmed);
  }
  on('bMega', () => { if (mode !== 'play' || !W || W.megas <= 0) return; W.megaArmed = !W.megaArmed; Sound.play(W.megaArmed ? 'select' : 'cancel'); updateHud(true); });
  on('bPause', () => { if (mode === 'play') openPause(); });
  on('bFull', toggleFull);

  // ----- 웨이브 진행 -----
  function startWave() {
    snap = JSON.stringify(run);
    W = Engine.startWave(run);
    mode = 'play'; paused = false;
    screen(''); closeModal(); showHud(true); Render.clear();
    const th = THEME_INFO[W.theme];
    if (W.P.boss) {
      Render.setBanner('⚠ 모선 출현 ⚠', CITIES[run.city].boss.name, 3.2, '#ff8a8a');
      Sound.play('siren'); setTimeout(() => { if (mode === 'play') Sound.play('horn'); }, 900);
      Sound.setSong('boss');
    } else {
      const first = run.city === 0 && run.wave === 1;
      Render.setBanner('웨이브 ' + run.wave, th.label ? th.label + ' — ' + th.tip : first ? '떨어지는 운석 근처를 클릭해 봐!' : null, first ? 3.4 : 2.4);
      Sound.play('wave'); Sound.setSong(CITIES[run.city].song);
    }
    if (W.assist) Render.text(640, 440, '재도전 지원 — 요격탄 +' + W.assist * 4 + ', 적 속도 -' + W.assist * 6 + '%, 방어막 +' + Math.min(2, W.assist), '#9fe8ff', 25, 3.4, 0);
    updateHud(true);
  }
  function waveOver() {
    const w = W;
    showHud(false);
    if (w.result === 'fail') {
      const t = run.stats.time;
      run = JSON.parse(snap); run.stats.time = t;
      run.attempt++; run.stats.fails++; run.cityRun.fails++;
      saveRun(); mode = 'screen';
      showFail();
      return;
    }
    const r = Engine.finishWave(run, w);
    if (r.ending) { if (run.diff) meta.hardClears++; else meta.clears++; run.endingSeen = false; }
    meta.kills += r.kills; meta.bestChain = Math.max(meta.bestChain, r.chainBest); meta.best = Math.max(meta.best, run.score);
    saveMeta(); saveRun();
    mode = 'screen';
    if (r.boss) showClear(r); else showPrep(r);
  }

  // ----- 화면들 -----
  function showTitle() {
    mode = 'title'; showHud(false); closeModal(); Sound.setSong('title');
    demoCity = (Math.random() * 6) | 0;
    const saved = loadRun();
    const where = saved ? (saved.cleared && saved.stage === 'clear' ? '모든 도시 해방 · 별 ' + saved.stars.reduce((a, b) => a + b, 0) + '/18' : CITIES[saved.city].name + ' · 웨이브 ' + saved.wave) + (saved.diff ? ' · 어려움' : '') : '';
    screen(`<div class="full title">
      <h1>하늘 방어대</h1>
      <div class="sub">운석과 외계 폭탄으로부터 도시 6곳을 지켜 줘!</div>
      <div class="menu">
        ${saved ? `<button class="btn gold" id="tCont">이어하기</button><div class="save">${where}</div>` : ''}
        <button class="btn ${saved ? '' : 'gold'}" id="tNew">새 게임</button>
        ${meta.clears > 0 ? '<button class="btn red" id="tHard">어려움 모드로 새 게임</button>' : ''}
        <div class="row"><button class="btn gray small" id="tHelp">게임 방법</button><button class="btn gray small" id="tRec">기록</button><button class="btn gray small" id="tSet">설정</button><button class="btn gray small" id="tFull">전체 화면</button></div>
      </div>
      <div class="foot">마우스 왼쪽 클릭만 쓰면 돼 · 스페이스바도 클릭이랑 똑같아 · 진행은 자동 저장돼</div>
    </div>`);
    on('tCont', () => { Sound.play('start'); run = saved; resume(); });
    on('tNew', () => confirmNew(0, !!saved));
    on('tHard', () => confirmNew(1, !!saved));
    on('tHelp', () => showHelp());
    on('tRec', showRecords);
    on('tSet', () => openSettings(false));
    on('tFull', toggleFull);
  }
  function confirmNew(diff, hasSave) {
    const go = () => { Sound.play('start'); run = Engine.newRun(diff); Engine.startCity(run, 0); saveRun(); showIntro(); };
    if (!hasSave) return go();
    modal(`<h2>새로 시작할까?</h2><div class="mtext">지금 저장된 진행은 지워져.</div>
      <div class="btnrow"><button class="btn red" id="mYes">새로 시작</button><button class="btn gray" id="mNo">취소</button></div>`);
    on('mYes', () => { closeModal(); go(); });
    on('mNo', closeModal);
  }
  function resume() {
    if (run.cleared && run.endingSeen === false) showEnding();
    else if (run.stage === 'intro') showIntro();
    else if (run.stage === 'prep') showPrep(null);
    else showMap();
  }

  function showMap() {
    mode = 'map'; showHud(false); closeModal(); Sound.setSong('shop');
    demoCity = Math.min(5, run.unlocked);
    const total = run.stars.reduce((a, b) => a + b, 0);
    const cards = CITIES.map((c, i) => {
      const lock = i > run.unlocked;
      const nowTag = i === run.city && run.stage === 'prep' ? `<span class="now">웨이브 ${run.wave}부터</span>`
        : i === run.unlocked && !run.stars[i] ? '<span class="now">다음 도시</span>' : '';
      const grad = ['#2b3a8a,#6b4f93', '#8d3e6e,#e7845a', '#4d3f86,#d9895f', '#183563,#5f86b3', '#22164a,#2f8080', '#3a0f2e,#8f3a3d'][i];
      return `<button class="city ${lock ? 'lock' : ''}" id="city${i}" ${lock ? 'disabled' : ''} style="background:linear-gradient(135deg,${grad})">
        <div class="no">도시 ${i + 1}</div><div class="nm">${c.name}</div>
        <div class="st">${starStr(run.stars[i])}</div>
        <div class="ne">${lock ? '앞 도시를 지키면 열려' : c.newEnemy ? '새 적: ' + ENEMY[c.newEnemy].name : '모든 적 + 거대 모선'}</div>
        ${lock ? '<span class="lk">잠김</span>' : nowTag}
      </button>`;
    }).join('');
    screen(`<div class="full"><div class="map panel">
      <h2>도시 지도</h2>
      <div class="info">별 ${total}/18 · 점수 ${fmt(run.score)} · 부품 ${fmt(run.parts)}${run.diff ? ' · 어려움 모드' : ''}</div>
      <div class="cities">${cards}</div>
      <div class="bar"><button class="btn gray small" id="mTitle">타이틀로</button><button class="btn gray small" id="mSet">설정</button></div>
    </div></div>`);
    CITIES.forEach((c, i) => on('city' + i, () => pickCity(i)));
    on('mTitle', showTitle);
    on('mSet', () => openSettings(false));
  }
  function pickCity(i) {
    Sound.play('select');
    if (i === run.city && run.stage === 'prep') return showPrep(null);
    if (i === run.city && run.stage === 'intro') return showIntro();
    const go = () => { Engine.startCity(run, i); saveRun(); showIntro(); };
    if (run.stage === 'prep' && run.wave > 1) {
      modal(`<h2>다른 도시로 갈까?</h2><div class="mtext">${J(CITIES[run.city].name, '은', '는')} 웨이브 ${run.wave}까지 진행 중이야.<br>옮기면 그 도시는 나중에 처음부터 다시 해야 해.</div>
        <div class="btnrow"><button class="btn gold" id="mYes">옮기기</button><button class="btn gray" id="mNo">취소</button></div>`);
      on('mYes', () => { closeModal(); go(); });
      on('mNo', closeModal);
    } else go();
  }

  function showIntro() {
    mode = 'intro'; showHud(false); closeModal(); Sound.setSong(CITIES[run.city].song);
    demoCity = run.city;
    const c = CITIES[run.city], ne = c.newEnemy;
    const how = run.city === 0 ? `<div class="how">
      • <b>클릭</b>(스페이스바도 돼)한 곳으로 요격탄이 날아가서 크게 터져.<br>
      • 폭발에 닿은 적은 같이 터지고, 그 폭발이 옆의 적을 또 터뜨려. <b>연쇄!</b><br>
      • 요격탄 수가 정해져 있으니 <b>한 방에 여러 개</b>를 노려 봐. 빨간 선은 건물을 노리는 적이야.<br>
      • 웨이브가 끝나면 남은 건물만큼 <b>부품</b>을 받아 포대를 강화해.</div>` : '';
    screen(`<div class="full"><div class="intro panel">
      <div class="no">도시 ${run.city + 1} / 6${run.diff ? ' · 어려움' : ''}</div>
      <h2>${c.name}</h2>
      <div class="desc">${c.desc}</div>
      ${ne ? `<div class="newE"><canvas id="neIcon" width="160" height="160"></canvas><div><div class="t1">${run.city === 0 ? '적' : '새 적'}: ${ENEMY[ne].name}</div><div class="t2">${ENEMY[ne].tip}</div></div></div>` : '<div class="newE"><div><div class="t1">마지막 도시</div><div class="t2">지금까지 나온 적이 모두 섞여서 와. 마지막 웨이브엔 거대 모선이 기다려!</div></div></div>'}
      ${how}
      <div class="bossP">10번째 웨이브: ${c.boss.name}<br><span style="color:#ffe9a8">끝까지 건물을 7채 이상 지키면 별 3개, 4채 이상이면 별 2개!</span></div>
      <div class="btnrow"><button class="btn gray small" id="iMap">지도</button><button class="btn" id="iShop">포대 강화</button><button class="btn gold" id="iGo">방어 시작!</button></div>
    </div></div>`);
    if (ne) Render.enemyIcon($('neIcon'), ne);
    on('iMap', showMap);
    on('iShop', () => { run.stage = 'prep'; saveRun(); showPrep(null); });
    on('iGo', () => { Sound.play('start'); run.stage = 'prep'; startWave(); });
  }

  function showPrep(r) {
    mode = 'prep'; showHud(false); closeModal(); Sound.setSong('shop');
    demoCity = run.city;
    run.stage = 'prep'; saveRun();
    renderPrep(r);
  }
  function renderPrep(r) {
    const P = Engine.plan(run), th = THEME_INFO[P.theme];
    let res;
    if (r) {
      const p = r.parts;
      res = `<h3>웨이브 ${run.wave - 1} 클리어!</h3>
        <div class="line">남은 건물 ${r.alive}/8 <b>+${p.bld}</b></div>
        <div class="line">남은 요격탄 ${r.ammoLeft}발 <b>+${p.ammo}</b></div>
        <div class="line">격추 ${r.kills} <b>+${p.kill}</b></div>
        <div class="line">최대 연쇄 ${r.chainBest} <b>+${p.chain}</b></div>
        ${p.perfect ? `<div class="line">무피해 보너스 <b>+${p.perfect}</b></div>` : ''}
        <div class="sum"><span>받은 부품</span><span>+${r.total}</span></div>
        <div class="line" style="border:none">웨이브 점수 <b style="color:#ffe9a8">${fmt(r.waveScore + r.bonusScore)}</b></div>
        ${r.rebuilt != null ? '<div class="note">시민들이 무너진 건물 하나를 다시 지었어!</div>' : ''}`;
    } else {
      res = `<h3 class="ready">작전 준비</h3>
        <div class="line">도시 <b style="color:#fff">${CITIES[run.city].name}</b></div>
        <div class="line">점수 <b style="color:#ffe9a8">${fmt(run.score)}</b></div>
        <div class="line">메가 폭탄 <b style="color:#ffd34a">${run.megas}개</b></div>
        ${run.attempt ? `<div class="note">재도전 지원 중: 요격탄 +${Math.min(4, run.attempt) * 4}, 적 속도 -${Math.min(4, run.attempt) * 6}%, 방어막 +${Math.min(2, run.attempt)}</div>` : ''}`;
    }
    const next = P.boss ? `<div class="next">다음: 웨이브 10 · 모선 출현!<span>${J(CITIES[run.city].boss.name, '이', '가')} 와. 모선을 맞혀서 격추해!</span></div>`
      : `<div class="next">다음: 웨이브 ${run.wave}${th.label ? ' · ' + th.label : ''}<span>${th.tip || '적 ' + P.count + '개 정도가 내려와.'}</span></div>`;
    const cards = UPGRADES.map(u => {
      const lv = run.up[u.id], cost = Engine.upCost(run, u.id), max = cost == null;
      const pips = '●'.repeat(lv) + '<i>' + '●'.repeat(u.costs.length - lv) + '</i>';
      const cv = max ? u.fmt(u.val(lv)) + u.unit + ' (최고)' : u.fmt(u.val(lv)) + ' → ' + u.fmt(u.val(lv + 1)) + u.unit;
      return `<button class="card ${max ? 'max' : ''}" id="up_${u.id}" ${max || run.parts < cost ? 'disabled' : ''} title="${u.desc}">
        ${ICON[u.id]}<div class="cn">${u.name}</div><div class="pips">${pips}</div><div class="cv">${cv}</div>
        <div class="cc ${!max && run.parts < cost ? 'no' : ''}">${max ? '완료' : '부품 ' + cost}</div></button>`;
    }).join('');
    const dead = run.bld.filter(v => !v).length, rc = repairCost(run.city);
    const items = `<button class="card" id="itRepair" ${dead && run.parts >= rc ? '' : 'disabled'}>${ICON.repair}<div class="cn">건물 수리</div><div class="cv">무너진 건물 ${dead}채</div><div class="cv">하나 다시 짓기</div><div class="cc ${run.parts < rc ? 'no' : ''}">${dead ? '부품 ' + rc : '필요 없음'}</div></button>
      <button class="card" id="itMega" ${run.megas < MEGA_MAX && run.parts >= MEGA_COST ? '' : 'disabled'}>${ICON.mega}<div class="cn">메가 폭탄</div><div class="cv">아주 크게 터지는 한 방</div><div class="cv">가진 것 ${run.megas}/${MEGA_MAX}</div><div class="cc ${run.parts < MEGA_COST ? 'no' : ''}">${run.megas >= MEGA_MAX ? '가득' : '부품 ' + MEGA_COST}</div></button>`;
    const blds = run.bld.map((v, i) => bldSvg(v, i)).join('');
    screen(`<div class="prep">
      <div class="res panel">${res}${next}</div>
      <div class="shop panel">
        <div class="shopHead"><h3>포대 강화</h3><span class="parts">부품 ${fmt(run.parts)}</span></div>
        <div class="cards">${cards}${items}</div>
      </div>
      <div class="bottom panel">
        <div class="blds"><span class="lbl">건물</span>${blds}</div>
        <div class="btnrow"><button class="btn gray small" id="pMap">지도</button><button class="btn gray small" id="pTitle">저장하고 나가기</button><button class="btn gold" id="pGo">${P.boss ? '모선 맞서기 ▶' : '웨이브 ' + run.wave + ' 시작 ▶'}</button></div>
      </div>
    </div>`);
    UPGRADES.forEach(u => on('up_' + u.id, () => { if (Engine.buyUp(run, u.id)) { Sound.play('buy'); saveRun(); renderPrep(r); } else Sound.play('error'); }));
    on('itRepair', () => { if (Engine.buyRepair(run) >= 0) { Sound.play('buy'); saveRun(); renderPrep(r); } else Sound.play('error'); });
    on('itMega', () => { if (Engine.buyMega(run)) { Sound.play('buy'); saveRun(); renderPrep(r); } else Sound.play('error'); });
    on('pMap', showMap);
    on('pTitle', () => { saveRun(); showTitle(); });
    on('pGo', () => { Sound.play('start'); startWave(); });
  }

  function showFail() {
    mode = 'fail'; showHud(false); Sound.setSong('shop');
    const a = Math.min(4, run.attempt);
    screen(`<div class="full"><div class="mid panel">
      <h2>도시가 무너졌어…</h2>
      <div class="msg">${CITIES[run.city].name} 웨이브 ${run.wave}부터 다시 할 수 있어.<br>부품과 강화는 웨이브 시작 전 그대로야.</div>
      <div class="assist">재도전 지원: 요격탄 +${a * 4} · 적 속도 -${a * 6}% · 방어막 +${Math.min(2, a)}${run.wave === 10 ? ' · 모선 체력 -' + a * 12 + '%' : ''}</div>
      <div class="btnrow"><button class="btn" id="fShop">포대 강화 들르기</button><button class="btn gold" id="fGo">다시 도전 ▶</button></div>
    </div></div>`);
    on('fShop', () => showPrep(null));
    on('fGo', () => { Sound.play('start'); startWave(); });
  }

  function showClear(r) {
    mode = 'clear'; showHud(false); Sound.setSong('ending');
    Sound.play('clear');
    const cr = r.cityRun, c = CITIES[run.city];
    const stars = Array.from({ length: 3 }, (_, i) => i < r.stars ? `<span style="animation-delay:${0.3 + i * 0.35}s">★</span>` : `<span style="animation-delay:${0.3 + i * 0.35}s"><i>★</i></span>`).join('');
    for (let i = 0; i < r.stars; i++) setTimeout(() => Sound.play('star'), 300 + i * 350);
    screen(`<div class="full"><div class="mid panel">
      <h2>${J(c.name, '을', '를')} 지켜냈어!</h2>
      <div class="bigstars">${stars}</div>
      <div class="msg" style="margin-bottom:8px">${r.stars === 3 ? '완벽한 방어야!' : r.stars === 2 ? '건물이 7채 이상 남으면 별 3개야.' : '건물이 4채 이상 남으면 별 2개야.'}${r.newBest && !r.firstClear ? ' 별 기록을 새로 세웠어!' : ''}</div>
      <div class="stats">
        <div>남은 건물 <b>${r.alive}/8</b></div><div>격추 <b>${cr.kills}</b></div>
        <div>최대 연쇄 <b>${cr.chain}</b></div><div>잃은 건물 <b>${cr.lost}</b></div>
        <div>도시 점수 <b>${fmt(cr.score)}</b></div><div>재도전 <b>${cr.fails}번</b></div>
        <div>모선 보상 <b>부품 +${r.parts.boss}</b></div><div>도시 보상 <b>부품 +${r.clearBonus}</b></div>
      </div>
      <div class="btnrow">${r.ending ? '<button class="btn gold" id="cEnd">마지막 이야기 ▶</button>'
        : `<button class="btn gray" id="cMap">지도</button>${run.city < 5 ? `<button class="btn gold" id="cNext">${J(CITIES[run.city + 1].name, '으로', '로')} ▶</button>` : ''}`}</div>
    </div></div>`);
    on('cEnd', showEnding);
    on('cMap', showMap);
    on('cNext', () => { Sound.play('start'); Engine.startCity(run, run.city + 1); saveRun(); showIntro(); });
  }

  function showEnding() {
    mode = 'ending'; Sound.setSong('ending'); Sound.play('ending');
    run.endingSeen = true;
    meta.best = Math.max(meta.best, run.score); saveMeta(); saveRun();
    const total = run.stars.reduce((a, b) => a + b, 0), rank = RANKS.find(x => total >= x.min).name;
    const mins = Math.round(run.stats.time / 60);
    screen(`<div class="full"><div class="mid panel" style="width:860px">
      <h2>하늘이 다시 맑아졌어!</h2>
      <div class="msg">거대 모선 「검은 별」이 무너지고, 외계 함대는 멀리 물러갔어.<br>여섯 도시의 사람들이 밤하늘의 불꽃놀이를 올려다보며 하늘 방어대를 외쳐!</div>
      <div class="rank">칭호: ${rank}</div>
      <div class="stats">
        <div>모은 별 <b>${total}/18</b></div><div>총점 <b>${fmt(run.score)}</b></div>
        <div>격추 <b>${fmt(run.stats.kills)}</b></div><div>최대 연쇄 <b>${run.stats.bestChain}</b></div>
        <div>재도전 <b>${run.stats.fails}번</b></div><div>플레이 시간 <b>${mins}분</b></div>
      </div>
      <div class="msg" style="font-size:22px">${run.diff ? '어려움 모드까지 깼어! 진짜 전설이야.' : '타이틀에서 어려움 모드가 열렸어. 지도에서 도시를 다시 골라 별을 더 모을 수도 있어.'}</div>
      <div class="btnrow"><button class="btn gray" id="eMap">지도</button><button class="btn gold" id="eTitle">타이틀로</button></div>
    </div></div>`);
    let n = 0;
    const fw = setInterval(() => {
      if (mode !== 'ending' || n++ > 40) return clearInterval(fw);
      const x = 120 + Math.random() * 1040, y = 90 + Math.random() * 300;
      Render.burst(x, y, 40, ['rgba(255,220,120,', 'rgba(255,140,200,', 'rgba(140,220,255,', 'rgba(160,255,170,'][n % 4], 260, 1.4);
      if (n % 3 === 0) Sound.boom('fx', 0);
    }, 450);
    on('eMap', showMap);
    on('eTitle', showTitle);
  }

  // ----- 모달 -----
  function modal(html) { $('mbox').innerHTML = html; $('modal').classList.remove('hidden'); }
  function closeModal() { $('modal').classList.add('hidden'); $('mbox').innerHTML = ''; }
  function openPause() {
    paused = true; showHud(true);
    $('stage').classList.remove('aim');
    modal(`<h2>잠깐 쉬는 중</h2><div class="col">
      <button class="btn gold" id="psGo">계속하기</button>
      <button class="btn" id="psSet">설정</button>
      <button class="btn" id="psHelp">게임 방법</button>
      <button class="btn gray" id="psRe">이 웨이브 처음부터</button>
      <button class="btn gray" id="psOut">나가기 (웨이브 시작 전으로 저장됨)</button></div>`);
    on('psGo', resumePlay);
    on('psSet', () => openSettings(true));
    on('psHelp', () => showHelp(openPause));
    on('psRe', () => { const t = run.stats.time; run = JSON.parse(snap); run.stats.time = t; closeModal(); startWave(); });
    on('psOut', () => { const t = run.stats.time; run = JSON.parse(snap); run.stats.time = t; saveRun(); W = null; showTitle(); });
  }
  function resumePlay() { closeModal(); paused = false; $('stage').classList.add('aim'); }
  function openSettings(fromPause) {
    const levels = [['끄기', 0], ['작게', 0.3], ['보통', 0.6], ['크게', 0.85], ['최대', 1]];
    const near = cur => levels.reduce((bi, l, i) => Math.abs(l[1] - cur) < Math.abs(levels[bi][1] - cur) ? i : bi, 0);
    const seg = (key, cur) => levels.map(([n], i) => `<button class="seg ${near(cur) === i ? 'on' : ''}" id="s_${key}_${i}">${n}</button>`).join('');
    const tog = (key, cur) => `<button class="seg ${cur ? 'on' : ''}" id="s_${key}_1">켜기</button><button class="seg ${!cur ? 'on' : ''}" id="s_${key}_0">끄기</button>`;
    modal(`<h2>설정</h2>
      <div class="opt"><span class="on2">효과음</span>${seg('sfx', meta.sfx)}</div>
      <div class="opt"><span class="on2">배경 음악</span>${seg('bgm', meta.bgm)}</div>
      <div class="opt"><span class="on2">화면 흔들림</span>${tog('shake', meta.shake)}</div>
      <div class="opt"><span class="on2">조준 보조선</span>${tog('lines', meta.lines)}</div>
      <div class="opt c" style="margin-top:18px"><button class="btn gray small" id="sFull">전체 화면</button><button class="btn gold small" id="sClose">닫기</button></div>`);
    levels.forEach(([n, v], i) => {
      on(`s_sfx_${i}`, () => { meta.sfx = v; applyOpts(); saveMeta(); Sound.play('fire'); openSettings(fromPause); });
      on(`s_bgm_${i}`, () => { meta.bgm = v; applyOpts(); saveMeta(); openSettings(fromPause); });
    });
    ['shake', 'lines'].forEach(k => [0, 1].forEach(v => on(`s_${k}_${v}`, () => { meta[k] = !!v; applyOpts(); saveMeta(); openSettings(fromPause); })));
    on('sFull', toggleFull);
    on('sClose', () => { if (fromPause) openPause(); else closeModal(); });
  }
  function applyOpts() { Sound.setSfx(meta.sfx); Sound.setBgm(meta.bgm); Render.opt.shake = meta.shake; Render.opt.lines = meta.lines; }
  function showHelp(back) {
    const list = Object.keys(ENEMY).map(k => `<div class="hrow"><canvas id="hi_${k}" width="120" height="120"></canvas><div><b>${ENEMY[k].name}</b>${ENEMY[k].tip}</div></div>`).join('');
    modal(`<h2>게임 방법</h2>
      <div class="help">
        <p>• 하늘을 <b>클릭</b>(스페이스바도 같아)하면 요격탄이 날아가 그 자리에서 터져.</p>
        <p>• 폭발에 닿은 적은 같이 터지고, 옆의 적을 또 터뜨려. <b>연쇄</b>일수록 점수가 몇 배!</p>
        <p>• 요격탄 수는 정해져 있어. 남기면 부품을 더 줘. 빨간 선은 건물을 노리는 적이야.</p>
        <p>• <b>메가 폭탄</b> 버튼을 누르고 하늘을 클릭하면 아주 크게 터져. 모선에는 3배로 아파.</p>
        <p>• 도시마다 웨이브 10개, 마지막엔 모선이 와. 건물이 다 무너지면 그 웨이브만 다시 하면 돼.</p>
      </div>
      <div class="hlist">${list}</div>
      <button class="btn gold small" id="hClose">닫기</button>`);
    Object.keys(ENEMY).forEach(k => Render.enemyIcon($('hi_' + k), k));
    on('hClose', () => { if (back) back(); else closeModal(); });
  }
  function showRecords() {
    const r = loadRun();
    const mins = Math.round(meta.time / 60);
    modal(`<h2>기록</h2><div class="recs">
      <div>최고 점수 <b>${fmt(meta.best)}</b></div><div>최대 연쇄 <b>${meta.bestChain}</b></div>
      <div>모든 도시 해방 <b>${meta.clears}번</b></div><div>어려움 모드 해방 <b>${meta.hardClears}번</b></div>
      <div>총 격추 <b>${fmt(meta.kills)}</b></div><div>총 플레이 <b>${mins}분</b></div>
      ${r ? `<div>지금 별 <b>${r.stars.reduce((a, b) => a + b, 0)}/18</b></div><div>지금 점수 <b>${fmt(r.score)}</b></div>` : ''}
      </div><button class="btn gold small" id="rClose">닫기</button>`);
    on('rClose', closeModal);
  }

  // ----- 돌아가는 고리 -----
  let last = performance.now(), speedMul = 1;
  function loop(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)) * speedMul; last = now;
    if (mode === 'play' && W && !paused) {
      let left = dt;
      while (left > 1e-6 && !W.over) { const h = Math.min(left, 1 / 60); Engine.step(W, h); left -= h; }
      for (const ev of W.ev) visual(ev, false, W);
      W.ev.length = 0;
      run.stats.time += dt; meta.time += dt;
      updateHud();
      if (W.over) waveOver();
    } else if (mode !== 'play') stepDemo(dt);
    const play = mode === 'play' && W;
    Render.frame(play && !paused ? dt : (play ? 0 : dt), play ? W : demo, {
      mx: mouse.x, my: mouse.y, mouseIn: mouse.inCv && play && !paused, hud: !!play, dim: play ? (paused ? 0.45 : 0) : 0.42,
    });
    requestAnimationFrame(loop);
  }

  // ----- 시작 -----
  Render.init($('cv'));
  window.addEventListener('resize', fit);
  document.addEventListener('fullscreenchange', fit);
  fit(); applyOpts();
  setInterval(saveMeta, 15000);
  window.addEventListener('beforeunload', saveMeta);
  showTitle();
  requestAnimationFrame(loop);
  window.__sky = { get run() { return run; }, get W() { return W; }, get mode() { return mode; }, set speed(v) { speedMul = v; }, startWave, showPrep, showTitle, showMap };
})();

// ===== 화면 / 진행 =====
(() => {
  const $ = id => document.getElementById(id);
  const SAVE_KEY = 'starDaughter.save.v1', META_KEY = 'starDaughter.meta.v1';
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 불가 */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* 무시 */ } },
  };
  const DEFAULT_META = { endings: {}, runs: 0, keptOutfits: [], lastName: '', settings: { speed: 1, sfx: 1, bgm: 0.5 } };
  let meta = Object.assign({}, DEFAULT_META, store.get(META_KEY) || {});
  meta.settings = Object.assign({}, DEFAULT_META.settings, meta.settings || {});
  const saveMeta = () => store.set(META_KEY, meta);

  let S = null;            // 진행 중인 게임
  let busy = false;        // 스케줄 진행 중
  let skip = false;        // 클릭으로 빨리 넘기기
  const mouse = { x: -1, y: -1 };
  const SLOT_NAMES = ['상순', '중순', '하순'];
  const hairCol = id => (HAIRS.find(h => h.id === id) || HAIRS[0]).col;
  const F = t => Logic.fmt(t, S);

  // ---------- 공통 ----------
  function fit() {
    const st = $('stage');
    const s = Math.min(innerWidth / 1280, innerHeight / 720);
    st.style.transform = `scale(${s})`;
    st.style.left = (innerWidth - 1280 * s) / 2 + 'px';
    st.style.top = (innerHeight - 720 * s) / 2 + 'px';
  }
  function sleep(ms) {
    return new Promise(res => {
      const t0 = performance.now();
      const f = () => {
        const need = ms * meta.settings.speed * (skip ? 0.12 : 1);
        if (performance.now() - t0 >= need) res(); else requestAnimationFrame(f);
      };
      f();
    });
  }
  function show(id) {
    document.querySelectorAll('.screen').forEach(e => e.classList.toggle('on', e.id === id));
  }
  let toastT = null;
  function toast(msg, ms) {
    const t = $('toast');
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms || 2000);
  }
  function fullscreen() {
    const d = document;
    try {
      if (!d.fullscreenElement) (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen).call(d.documentElement);
      else (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    } catch (e) { toast('전체 화면을 쓸 수 없는 환경이야'); }
  }

  function openModal(html, cls) {
    const m = $('modal');
    m.className = 'modal ' + (cls || '');
    m.innerHTML = html;
    m.onclick = null;
    $('modalWrap').classList.add('on');
    return m;
  }
  function closeModal() { $('modalWrap').classList.remove('on'); $('modal').onclick = null; }
  function choose(html, cls) {
    const m = openModal(html, cls);
    return new Promise(res => {
      m.onclick = e => {
        const b = e.target.closest('[data-v]');
        if (!b || b.disabled || b.classList.contains('off')) return;
        m.onclick = null;
        res(b.dataset.v);
      };
    });
  }

  const KEY_NAME = Object.assign({}, STAT_NAME, { gold: '돈', stress: '스트레스', fame: '평판', friend: '하루와의 추억', prince: '왕자님과의 인연', adv: '모험심' });
  function chipsHTML(changes) {
    return '<div class="chgs">' + changes.filter(c => KEY_NAME[c.k] && c.d).map(c => {
      const good = c.k === 'stress' ? c.d < 0 : c.d > 0;
      const v = c.k === 'gold' ? `${c.d > 0 ? '+' : ''}${c.d}G` : `${c.d > 0 ? '+' : ''}${c.d}`;
      return `<span class="chg ${good ? 'up' : 'down'}">${KEY_NAME[c.k]} <b class="${good ? 'up' : 'down'}">${v}</b></span>`;
    }).join('') + '</div>';
  }

  // ---------- 저장 ----------
  function save() { if (S) store.set(SAVE_KEY, S); }
  function load() {
    const s = store.get(SAVE_KEY);
    if (!s || !s.st || typeof s.m !== 'number') return null;
    return s;
  }

  // ---------- 타이틀 ----------
  function initStars() {
    const box = $('stars');
    let h = '';
    for (let i = 0; i < 90; i++) {
      const sz = Math.random() < 0.15 ? 4 : 2;
      h += `<i style="left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${sz}px;height:${sz}px;animation-delay:${(Math.random() * 3).toFixed(2)}s"></i>`;
    }
    box.innerHTML = h;
  }
  function toTitle() {
    closeModal();
    S = null; busy = false;
    Sound.setSong('home');
    const seen = Object.keys(meta.endings).length;
    $('tContinue').disabled = !load();
    $('tInfo').textContent = `엔딩 도감 ${seen} / ${ENDINGS.length}  ·  키운 횟수 ${meta.runs}번`;
    const h = HAIRS[Math.floor(Math.random() * HAIRS.length)].col;
    $('tPic').innerHTML = Art.girl({ stage: 2, outfit: 'star', expr: 'happy', hair: h, acc: 'flower' });
    show('title');
  }

  // ---------- 새 게임 ----------
  let setupHair = 'brown';
  function toSetup(name) {
    $('nameInput').value = name || '';
    $('nameChips').innerHTML = NAME_SUGGEST.map(n => `<span class="chip" data-name="${n}">${n}</span>`).join('');
    $('hairChips').innerHTML = HAIRS.map(h => `<span class="swatch${h.id === setupHair ? ' on' : ''}" data-hair="${h.id}" title="${h.n}" style="background:${h.col}"></span>`).join('');
    const n = Object.keys(meta.endings).length;
    const kept = meta.keptOutfits.length;
    $('ngBonus').textContent = n ? `다시 키우기 보너스: 시작 자금 +${Logic.newGame('a', 'brown', meta).gold - 500}G${kept ? `, 예전에 산 옷 ${kept}벌 그대로` : ''}` : '';
    $('setupRoom').innerHTML = Art.room(false);
    updateSetupPreview();
    show('setup');
  }
  function updateSetupPreview() {
    $('setupGirl').innerHTML = Art.girl({ stage: 0, outfit: 'basic', expr: 'happy', hair: hairCol(setupHair) });
    document.querySelectorAll('#hairChips .swatch').forEach(s => s.classList.toggle('on', s.dataset.hair === setupHair));
  }
  function startNew() {
    const name = $('nameInput').value.trim().replace(/\s+/g, ' ').slice(0, 6);
    if (!name) { toast('딸 이름을 지어 줘!'); Sound.play('cancel'); $('nameInput').focus(); return; }
    $('nameInput').blur();
    S = Logic.newGame(name, setupHair, meta);
    meta.runs++; meta.lastName = name; saveMeta();
    Sound.play('start');
    show('main');
    $('pRoom').innerHTML = Art.room(false);
    renderAll();
    save();
    beginMonth(true);
  }
  function continueGame() {
    const s = load();
    if (!s) return;
    S = s;
    Sound.play('start');
    show('main');
    $('pRoom').innerHTML = Art.room(false);
    renderAll();
    beginMonth();
  }

  // ---------- 메인 그리기 ----------
  let girlKey = '';
  function renderGirl(expr, force) {
    if (!S) return;
    const e = expr || Logic.mood(S);
    const key = [Logic.stage(S), S.outfit, e, S.hair].join('|');
    if (key === girlKey && !force) return;
    girlKey = key;
    $('pGirl').innerHTML = Art.girl({ stage: Logic.stage(S), outfit: S.outfit, expr: e, hair: hairCol(S.hair) });
  }
  function bounce() {
    const g = $('pGirl'); g.classList.remove('bounce'); void g.offsetWidth; g.classList.add('bounce');
  }
  function renderHud() {
    $('hDate').textContent = `${Logic.yearNo(S)}년째 ${Logic.calMonth(S) + 1}월 · ${Logic.age(S)}살`;
    $('hGold').textContent = `💰 ${Math.floor(S.gold).toLocaleString()}G`;
    $('pName').textContent = S.name;
    $('pTitle').textContent = S.titles.length ? `「${S.titles[S.titles.length - 1]}」` : '';
    $('mStress').style.width = S.stress + '%';
    $('mStress').style.background = S.stress >= 80 ? '#d4495b' : S.stress >= 60 ? '#f29e4c' : '#7ac58f';
    $('vStress').textContent = Math.round(S.stress);
    $('mFame').style.width = Math.min(100, S.fame / 3) + '%';
    $('vFame').textContent = Math.floor(S.fame);
    const wins = S.wins.martial + S.wins.beauty + S.wins.cook + S.wins.magic;
    $('pMisc').textContent = `🏆 대회 우승 ${wins}회 · 어른이 될 때까지 ${Logic.TOTAL_MONTHS - S.m}개월`;
  }
  function renderStats(hint, flash) {
    $('stats').innerHTML = STATS.map(s => {
      const v = Math.floor(S.st[s.k]);
      const h = hint && hint[s.k];
      const arrow = h ? (h > 0 ? '<span class="arrow up">▲</span>' : '<span class="arrow down">▼</span>') : '<span class="arrow"></span>';
      return `<div class="srow${flash && flash[s.k] ? ' flash' : ''}"><b>${s.n}</b>${arrow}<div class="bar"><i style="width:${Math.min(100, v / 5)}%;background:${s.col}"></i></div><span>${v}</span></div>`;
    }).join('');
  }
  function gainText(a) {
    const ks = Object.keys(a.gain);
    const up = ks.filter(k => a.gain[k] > 0).map(k => STAT_NAME[k] + '↑');
    const dn = ks.filter(k => a.gain[k] < 0).map(k => STAT_NAME[k] + '↓');
    if (a.type === 'rest' || a.type === 'travel') return '스트레스↓↓ ' + up.slice(0, 2).join(' ');
    return up.slice(0, 2).concat(dn.slice(0, 1)).join(' ');
  }
  function renderActs() {
    const planned = Logic.schedCost(S);
    $('acts').innerHTML = ACTS.map(a => {
      const st = Logic.actState(S, a, planned);
      let money;
      if (a.type === 'job') money = `<span class="money up">+${Logic.payOf(S, a)}G</span>`;
      else if (a.cost) money = `<span class="money down">-${a.cost}G</span>`;
      else money = `<span class="money">무료</span>`;
      const lv = a.type === 'lesson' ? `<span class="lv">${'★'.repeat(Logic.lessonLv(S, a.id))}${'☆'.repeat(5 - Logic.lessonLv(S, a.id))}</span>` : '';
      const sub = st.ok ? gainText(a) : `🔒 ${st.why}`;
      return `<div class="act ${a.type}${st.ok ? '' : ' dis'}" data-act="${a.id}"><span class="ic">${a.icon}${lv}</span><span class="tx"><span class="r1">${a.name}${money}</span><small>${sub}</small></span></div>`;
    }).join('');
  }
  function renderSched() {
    const firstEmpty = S.sched.indexOf(null);
    document.querySelectorAll('#sched .slot').forEach((el, i) => {
      const id = S.sched[i];
      el.className = 'slot ' + (id ? 'filled' : 'empty') + (i === firstEmpty ? ' next' : '');
      el.innerHTML = `<span class="when">${SLOT_NAMES[i]}</span>` + (id ? `<span class="ic">${ACT[id].icon}</span><span class="nm">${ACT[id].name}</span>` : `<span class="ic" style="opacity:.25">＋</span><span class="nm">왼쪽에서 골라 줘</span>`);
    });
    let out = 0, inc = 0;
    for (const id of S.sched) if (id) { const a = ACT[id]; if (a.type === 'job') inc += Logic.payOf(S, a); else out += a.cost || 0; }
    $('schedSum').innerHTML = `지출 <b class="down">-${out}G</b> · 수입 <b class="up">+${inc}G</b>`;
    $('startBtn').disabled = firstEmpty !== -1;
    $('repeatBtn').disabled = !canRepeat();
  }
  function canRepeat() {
    if (!S.lastSched || S.lastSched.some(x => !x)) return false;
    let cost = 0;
    for (const id of S.lastSched) {
      const st = Logic.actState(S, ACT[id], cost);
      if (!st.ok) return false;
      cost += ACT[id].cost || 0;
    }
    return true;
  }
  function renderAll() {
    if (!S) return;
    renderHud(); renderStats(); renderActs(); renderSched(); renderGirl();
  }
  function setHudLock(on) {
    ['hShop', 'hCodex', 'hSet'].forEach(id => { $(id).disabled = on; });
  }

  // 말풍선
  function talk(text) {
    if (text) { $('bubble').textContent = text; return; }
    const a = Logic.age(S), cm = Logic.calMonth(S), st = Logic.stage(S);
    let pool;
    if (S.stress >= 80) pool = ['너무 힘들어… 좀 쉬고 싶어.', '머리가 핑 돌아…', '쉬게 해 주면 안 돼?'];
    else if (S.stress >= 60) pool = ['요즘 좀 지쳐.', '놀러 가고 싶다~', '휴식이 필요해…'];
    else if (S.gold < 80) pool = ['우리 집… 돈 괜찮아?', '나 아르바이트 할까?'];
    else if (S.m === 0) pool = [`안녕, 아빠! 나 ${S.name}! 잘 부탁해!`];
    else if (S.m >= 90) pool = ['곧 열여덟 살이야… 두근두근.', '어른이 되면 뭘 하고 있을까?'];
    else if (cm === 8) pool = ['다음 달은 가을 축제야! 준비해야지.', '축제에 무슨 대회 나갈까?'];
    else if (st === 0) pool = ['이번 달엔 뭐 해?', '아빠, 오늘 저녁 뭐야?', '나 키 컸지?', '헤헤, 열심히 할게!'];
    else if (st === 1) pool = ['이번 달도 힘내 볼게!', '친구들이랑 놀고 싶은데…', '거울 보는 게 좋아졌어.', '나 많이 컸지?'];
    else pool = ['벌써 이렇게 컸네.', '아빠, 늘 고마워.', '꿈에 한 걸음씩!', '오늘은 뭘 배울까?'];
    $('bubble').textContent = pool[Math.floor(Math.random() * pool.length)];
    void a;
  }

  // ---------- 스케줄 고르기 ----------
  function onActClick(id) {
    if (busy || !S) return;
    const a = ACT[id];
    const i = S.sched.indexOf(null);
    if (i === -1) { toast('칸이 다 찼어. 바꿀 칸을 먼저 눌러서 비워 줘'); Sound.play('cancel'); return; }
    const st = Logic.actState(S, a, Logic.schedCost(S));
    if (!st.ok) { toast(`${a.name}: ${st.why}`); Sound.play('cancel'); return; }
    S.sched[i] = id;
    Sound.play('select');
    renderActs(); renderSched();
  }
  function onSlotClick(i) {
    if (busy || !S || !S.sched[i]) return;
    S.sched[i] = null;
    Sound.play('cancel');
    renderActs(); renderSched();
  }
  function onRepeat() {
    if (busy || !S || !canRepeat()) return;
    S.sched = S.lastSched.slice();
    Sound.play('select');
    renderActs(); renderSched();
  }

  // ---------- 한 달 진행 ----------
  async function runMonth() {
    if (busy || !S || S.sched.includes(null)) return;
    busy = true; setHudLock(true);
    Sound.play('start');
    $('bubble').textContent = '';
    $('run').classList.add('on');
    $('rSummary').classList.remove('on');
    for (let i = 0; i < 3; i++) await playSlot(i);
    skip = false;
    const end = Logic.monthEnd(S);
    await showSummary(end);
    $('run').classList.remove('on');
    busy = false; setHudLock(false);
    save();
    renderAll();
    await beginMonth();
  }

  async function playSlot(i) {
    skip = false;
    const id = S.sched[i], a = ACT[id];
    $('rSteps').innerHTML = [0, 1, 2].map(k => `<i class="${k < i ? 'done' : k === i ? 'on' : ''}"></i>`).join('');
    $('rTitle').textContent = `${SLOT_NAMES[i]} · ${a.icon} ${a.name}${a.type === 'lesson' ? ' 수업' : ''}`;
    $('rIcon').textContent = a.icon;
    $('rIcon').style.animation = '';
    $('rDays').innerHTML = '<i></i>'.repeat(10);
    $('rLine').textContent = '';
    $('rResult').innerHTML = '';
    renderGirl(a.type === 'rest' || a.type === 'travel' ? 'happy' : 'normal');
    const res = Logic.runSlot(S, id);
    const days = $('rDays').children;
    await sleep(350);
    for (let d = 0; d < 10; d++) {
      days[d].classList.add('on');
      Sound.play('tick');
      if (d === 3) $('rLine').textContent = res.line;
      await sleep(380);
    }
    const kindTxt = { great: '대성공!', ok: '성공!', fail: '실패…', sick: '아파서 쉬었어…' }[res.kind];
    const ch = res.changes.slice();
    if (res.gold) ch.push({ k: 'gold', d: res.gold });
    if (res.stress) ch.push({ k: 'stress', d: res.stress });
    $('rResult').innerHTML = `<span class="kind ${res.kind} jua">${kindTxt}</span>${chipsHTML(ch)}`;
    if (res.kind === 'sick') $('rIcon').textContent = '🤒';
    $('rIcon').style.animation = 'none';
    Sound.play({ great: 'great', ok: 'good', fail: 'fail', sick: 'sick' }[res.kind]);
    if (res.gold > 0) setTimeout(() => Sound.play('coin'), 250);
    renderGirl(res.kind === 'great' || res.kind === 'ok' ? 'happy' : res.kind === 'sick' ? 'sick' : 'sulky');
    if (res.kind !== 'fail') bounce();
    const fl = {}; res.changes.forEach(c => { fl[c.k] = 1; });
    renderHud();
    if (res.lvUp) { setTimeout(() => { Sound.play('lvup'); toast(`${a.name} 수업이 ${res.lvUp}단계가 됐어! 효과가 더 커져`); }, 500); }
    skip = false;
    await sleep(res.lvUp ? 2300 : 1800);
    void fl;
  }

  async function showSummary(end) {
    const box = $('rSummary');
    const ch = [{ k: 'gold', d: end.stipend }].concat(end.bonus);
    box.innerHTML = `<div class="jua" style="font-size:40px">한 달 끝!</div><div>나라에서 주는 양육 지원금이 들어왔어.</div>${chipsHTML(ch)}`;
    box.classList.add('on');
    Sound.play('coin');
    renderAll();
    await sleep(1500);
    box.classList.remove('on');
  }

  // ---------- 달 시작 ----------
  async function beginMonth(first) {
    if (!S) return;
    if (S.runaway) await runawayScene();
    if (S.m >= Logic.TOTAL_MONTHS) return startEnding();
    renderAll();
    if (first && S.m === 0) await tutorial();
    if (Logic.isBirthday(S) && S.bdayDone !== S.m) { await birthday(); S.bdayDone = S.m; save(); }
    if (Logic.isFestival(S) && S.festDone !== S.m) { await festival(); S.festDone = S.m; save(); }
    if (S.evDone !== S.m) {
      const ev = Logic.pickEvent(S);
      S.evDone = S.m;
      if (ev) await doEvent(ev);
      save();
    }
    closeModal();
    renderAll();
    talk();
    if (Logic.mood(S) === 'tired') bounce();
  }

  async function tutorial() {
    await choose(`<h3><span class="ic">🌟</span>${F('{n}{과} 함께하는 8년')}</h3>
      <p>매달 <b>상순·중순·하순</b> 세 칸에 할 일을 넣어 줘.<br>오른쪽 목록을 <b>클릭</b>하면 빈칸에 차례로 들어가고, 칸을 클릭하면 빠져.</p>
      <p>📚 수업은 돈이 들고 능력치가 올라. 🥐 아르바이트는 돈을 벌어.<br>😫 스트레스가 쌓이면 아프거나 집을 나갈 수도 있으니 🛏️ 휴식·🧳 여행도 챙겨 줘.</p>
      <p>🍂 해마다 10월엔 가을 축제 대회가 열리고, 🎂 열여덟 살 생일에 엔딩이 정해져.<br>📖 도감에서 엔딩별 힌트를 볼 수 있어. (스페이스바 = 클릭)</p>
      <div class="btns"><button class="btn pri jua" data-v="ok">알겠어!</button></div>`);
    Sound.play('select');
  }

  async function birthday() {
    const a = Logic.age(S);
    const grow = a === 13 || a === 16;
    const gifts = Logic.birthdayGifts(S);
    Sound.play('bday');
    renderGirl('happy', true);
    const v = await choose(`<h3><span class="ic">🎂</span>${F('{n}의')} ${a}번째 생일!</h3>
      <p>${grow ? F('{n}{이} 몰라보게 훌쩍 컸어! ') : ''}생일 선물을 하나 골라 줘.</p>
      <div class="gifts">${gifts.map(g => `<div class="gift" data-v="${g.id}"><span class="ic">${g.icon}</span>${g.n}<small>${Object.entries(g.fx).map(([k, d]) => `${KEY_NAME[k]} ${d > 0 ? '+' : ''}${d}${k === 'gold' ? 'G' : ''}`).join(', ')}</small></div>`).join('')}</div>`, '');
    const g = BDAY_GIFTS.find(x => x.id === v);
    const ch = Logic.applyFx(S, g.fx);
    Sound.play('great');
    bounce();
    renderAll();
    toast(F(`{n}{이} ${Logic.josa(g.n, '을')} 받고 활짝 웃었어!`));
    void ch;
  }

  async function doEvent(ev) {
    Sound.play('event');
    const html = `<h3><span class="ic">${ev.icon}</span>${ev.title}</h3><p>${F(ev.text)}</p>
      <div class="btns">${ev.choices.map((c, i) => {
        const off = c.need && S.gold < c.need;
        return `<button class="btn ${i === 0 ? 'pri' : ''} jua" data-v="${i}" ${off ? 'disabled' : ''}>${c.t}</button>`;
      }).join('')}</div>`;
    const v = await choose(html);
    const r = Logic.chooseEvent(S, ev, +v);
    Sound.play('select');
    renderAll();
    await choose(`<h3><span class="ic">${ev.icon}</span>${ev.title}</h3><p>${r.msg}</p>${chipsHTML(r.changes)}
      <div class="btns"><button class="btn pri jua" data-v="ok">확인</button></div>`);
  }

  async function runawayScene() {
    Sound.play('lose');
    renderGirl('sulky', true);
    await choose(`<h3><span class="ic">🚪</span>${F('{n}{이} 사라졌어!')}</h3>
      <p>${F('아침에 일어나 보니 {n}의 방이 비어 있었어. 스트레스가 너무 쌓였던 거야…')}</p>
      <p>한 달 동안 온 마을을 찾아다녔어.</p>
      <div class="btns"><button class="btn jua" data-v="ok">계속 찾는다…</button></div>`);
    const r = Logic.resolveRunaway(S);
    renderAll();
    await choose(`<h3><span class="ic">🏠</span>돌아왔어</h3>
      <p>${F('한 달 만에 {n}{이} 고개를 푹 숙이고 돌아왔어. "…미안해."')}</p>
      ${chipsHTML([{ k: 'gold', d: -r.lost }, { k: 'mor', d: -10 }, { k: 'fame', d: -25 }])}
      <p style="font-size:22px">다음부터는 휴식이랑 여행을 꼭 챙겨 주자.</p>
      <div class="btns"><button class="btn pri jua" data-v="ok">꼭 안아 준다</button></div>`);
    save();
  }

  // ---------- 가을 축제 ----------
  function chanceOf(id) {
    const me = Logic.contestPower(S, id);
    const fin = Logic.rivalBase(Logic.yearNo(S)) * 1.08;
    const r = me / fin;
    if (r >= 1.12) return ['우승 가능성 높음!', '#2f9e6e'];
    if (r >= 0.97) return ['해 볼 만해', '#3a7bd5'];
    if (r >= 0.8) return ['조금 어려워', '#e0702e'];
    return ['아직 무리야', '#d4495b'];
  }
  async function festival() {
    Sound.setSong('fest');
    Sound.play('event');
    const y = Logic.yearNo(S);
    const v = await choose(`<h3><span class="ic">🎪</span>가을 별빛 축제 (${y}번째)</h3>
      <p>광장에 등불이 가득해! ${F('{n}{은}')} 어느 대회에 나갈까? 우승하면 상금과 칭호를 받아.</p>
      <div class="fest">${CONTESTS.map(c => {
        const [t, col] = chanceOf(c.id);
        const w = S.wins[c.id];
        return `<div class="fcard" data-v="${c.id}"><div class="ic">${c.icon}</div><div class="nm jua">${c.name}</div><small>${c.stat}</small><div class="chance" style="color:${col}">${t}</div><small>내 실력 ${Logic.contestPower(S, c.id)}${w ? ` · 우승 ${w}회` : ''}</small></div>`;
      }).join('')}</div>
      <div class="btns"><button class="btn jua" data-v="none">구경만 할래 (스트레스 -20)</button></div>`);
    if (v === 'none') {
      Logic.applyFx(S, { stress: -20, sen: 3 });
      toast('솜사탕을 먹으며 축제를 즐겼어!');
    } else await contest(v);
    Sound.setSong('home');
    renderAll();
  }
  async function contest(id) {
    const c = CONTEST[id];
    const r = Logic.runContest(S, id);
    for (let i = 0; i < r.rounds.length; i++) {
      const rd = r.rounds[i];
      const max = Math.max(rd.me, rd.them) * 1.15;
      openModal(`<div class="match"><h3><span class="ic">${c.icon}</span>${c.name}</h3>
        <div class="rlabel jua">${rd.label}</div>
        <div class="vs"><div class="who jua">${S.name}</div><div class="bar"><i id="cbMe" style="background:#e86a92"></i></div><div class="sc" id="csMe">0</div></div>
        <div class="vs"><div class="who">${rd.rival}</div><div class="bar"><i id="cbThem" style="background:#7a8aa0"></i></div><div class="sc" id="csThem">0</div></div>
        <div class="rres jua" id="cRes"></div></div>`);
      await sleep(500);
      Sound.play('hit');
      $('cbMe').style.width = (rd.me / max * 100) + '%';
      $('cbThem').style.width = (rd.them / max * 100) + '%';
      const t0 = performance.now();
      await new Promise(res => {
        const f = () => {
          const k = Math.min(1, (performance.now() - t0) / 1400);
          $('csMe').textContent = Math.round(rd.me * k);
          $('csThem').textContent = Math.round(rd.them * k);
          if (k < 1) requestAnimationFrame(f); else res();
        };
        f();
      });
      await sleep(300);
      $('cRes').innerHTML = rd.win ? '<span class="up">승리!</span>' : '<span class="down">패배…</span>';
      Sound.play(rd.win ? 'good' : 'fail');
      await sleep(1400);
    }
    Sound.play(r.won ? 'win' : 'lose');
    renderGirl(r.won ? 'happy' : 'sulky', true);
    const reached = r.rounds.length;
    const msg = r.won ? F(`{n}{이} ${c.name}에서 우승했어! 「${c.name} 우승」 칭호를 얻었어.`)
      : reached === 3 ? F('아깝게 결승에서 졌어. 그래도 준우승이야!') : reached === 2 ? '준결승에서 아쉽게 졌어.' : '1회전에서 졌어… 내년엔 더 강해지자.';
    await choose(`<h3><span class="ic">${r.won ? '🏆' : c.icon}</span>${r.won ? '우승!' : '대회 끝'}</h3><p>${msg}</p>
      ${chipsHTML([{ k: 'gold', d: r.prize }, { k: 'fame', d: r.won ? 40 : 5 + reached * 3 }])}
      <div class="btns"><button class="btn pri jua" data-v="ok">확인</button></div>`);
  }

  // ---------- 옷가게 ----------
  async function openShop() {
    if (busy || !S) return;
    let sel = S.outfit;
    const shopList = OUTFITS.filter(o => !o.hidden);
    let draw = () => {
      const o = OUTFIT[sel];
      const owned = S.owned.includes(sel);
      let btn;
      if (S.outfit === sel) btn = `<button class="btn jua" disabled>입는 중</button>`;
      else if (owned) btn = `<button class="btn pri jua" data-act="wear">입기</button>`;
      else btn = `<button class="btn pri jua" data-act="buy" ${S.gold < o.price ? 'disabled' : ''}>사기 (${o.price}G)</button>`;
      openModal(`<h3><span class="ic">👗</span>옷가게 <span style="font-size:24px;margin-left:auto">💰 ${Math.floor(S.gold).toLocaleString()}G</span></h3>
        <div class="shop">${shopList.map(x => `<div class="ocard${x.id === sel ? ' sel' : ''}" data-o="${x.id}">
          ${S.outfit === x.id ? '<span class="tag wear">입는 중</span>' : S.owned.includes(x.id) ? '<span class="tag">보유</span>' : ''}
          <div class="pv">${Art.girl({ stage: Logic.stage(S), outfit: x.id, expr: 'normal', hair: hairCol(S.hair) })}</div>
          <div class="nm jua">${x.name}</div><div class="pr">${x.price ? x.price + 'G' : '기본'}</div></div>`).join('')}</div>
        <div class="shopinfo"><div class="d"><b class="jua">${o.name}</b> — ${o.desc}</div>${btn}<button class="btn jua" data-act="close">닫기</button></div>`, 'wide');
    };
    await new Promise(res => {
      const handler = e => {
        const card = e.target.closest('[data-o]');
        if (card) { sel = card.dataset.o; Sound.play('click'); draw(); return; }
        const b = e.target.closest('[data-act]');
        if (!b || b.disabled) return;
        if (b.dataset.act === 'close') { closeModal(); res(); return; }
        if (b.dataset.act === 'buy') {
          const o = OUTFIT[sel];
          if (S.gold < o.price) return;
          S.gold -= o.price; S.owned.push(sel); S.outfit = sel;
          Sound.play('buy'); toast(F(`{n}{이} ${Logic.josa(o.name, '을')} 입고 빙글 돌았어!`));
        } else if (b.dataset.act === 'wear') { S.outfit = sel; Sound.play('select'); }
        renderAll(); renderGirl('happy'); bounce(); save(); draw();
      };
      const d0 = draw;
      draw = () => { d0(); $('modal').onclick = handler; };
      draw();
    });
    renderAll();
  }

  // ---------- 도감 ----------
  async function openCodex() {
    if (busy) return;
    const seen = Object.keys(meta.endings).length;
    const info = e => {
      const got = meta.endings[e.id];
      const pg = S ? Math.round(Logic.reqProgress(S, e.req) * 100) : null;
      return `<b class="jua" style="font-size:26px">${e.icon} ${e.name}</b> ${got ? `<span class="up">✔ 달성 (${got.count}번)</span>` : '<span style="color:#8a7c99">미달성</span>'}
        ${pg !== null && e.id !== 'villager' ? `<span style="float:right;color:#7a6cf0">지금 ${S.name}: ${pg}%</span>` : ''}<br>힌트: ${e.hint}`;
    };
    openModal(`<h3><span class="ic">📖</span>엔딩 도감 <span style="font-size:26px;color:#7a6cf0">${seen} / ${ENDINGS.length}</span><button class="btn small jua x" data-act="close">닫기</button></h3>
      <div class="codex">${ENDINGS.map(e => {
        const got = meta.endings[e.id];
        const pg = S && e.id !== 'villager' ? Math.round(Logic.reqProgress(S, e.req) * 100) : null;
        return `<div class="ecard ${got ? 'got' : 'lock'}" data-e="${e.id}"><span class="ic">${e.icon}</span><span class="nm">${e.name}</span>${pg !== null ? `<div class="pg"><i style="width:${pg}%"></i></div>` : ''}</div>`;
      }).join('')}</div>
      <div class="cinfo" id="cInfo">카드 위에 마우스를 올리면 힌트가 보여. ${S ? '보라색 막대는 지금 딸이 그 엔딩에 얼마나 가까운지야.' : ''}</div>`, 'wide');
    const m = $('modal');
    m.onmouseover = e => { const c = e.target.closest('[data-e]'); if (c) $('cInfo').innerHTML = info(ENDING[c.dataset.e]); };
    await new Promise(res => {
      m.onclick = e => {
        const c = e.target.closest('[data-e]');
        if (c) { $('cInfo').innerHTML = info(ENDING[c.dataset.e]); Sound.play('click'); return; }
        const b = e.target.closest('[data-act]');
        if (b) { m.onmouseover = null; closeModal(); res(); }
      };
    });
  }

  // ---------- 설정 ----------
  async function openSettings(fromTitle) {
    if (busy) return;
    const st = meta.settings;
    const seg = (key, opts) => `<div class="seg">${opts.map(([v, t]) => `<button class="btn jua${st[key] === v ? ' on' : ''}" data-k="${key}" data-val="${v}">${t}</button>`).join('')}</div>`;
    let draw = () => openModal(`<h3><span class="ic">⚙️</span>설정</h3>
      <div class="setrow"><b>연출 속도</b>${seg('speed', [[1, '보통'], [0.55, '빠름'], [0.3, '아주 빠름']])}</div>
      <div class="setrow"><b>효과음</b>${seg('sfx', [[0, '끄기'], [0.6, '작게'], [1, '보통'], [1.6, '크게']])}</div>
      <div class="setrow"><b>배경 음악</b>${seg('bgm', [[0, '끄기'], [0.3, '작게'], [0.5, '보통'], [0.9, '크게']])}</div>
      <p style="font-size:20px;color:#6b5d7a">보통 속도로 한 번 키우는 데 1시간쯤 걸려. 두 번째부터는 '빠름'도 좋아.<br>게임은 매달 자동으로 저장돼.</p>
      <div class="btns">
        <button class="btn jua" data-act="full">전체 화면</button>
        ${fromTitle ? '' : '<button class="btn jua" data-act="title">타이틀로 (저장됨)</button>'}
        <button class="btn pri jua" data-act="close">닫기</button>
      </div>`);
    await new Promise(res => {
      const handler = e => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.k) {
          st[b.dataset.k] = +b.dataset.val;
          applySettings(); saveMeta(); Sound.play('select'); draw(); return;
        }
        if (b.dataset.act === 'full') { fullscreen(); return; }
        if (b.dataset.act === 'title') { save(); closeModal(); res(); toTitle(); return; }
        if (b.dataset.act === 'close') { closeModal(); res(); }
      };
      const d0 = draw;
      draw = () => { d0(); $('modal').onclick = handler; };
      draw();
    });
  }
  function applySettings() {
    Sound.setSfx(meta.settings.sfx);
    Sound.setBgm(meta.settings.bgm);
    Sound.setBgmOn(meta.settings.bgm > 0);
  }

  // ---------- 엔딩 ----------
  async function startEnding() {
    const e = Logic.decideEnding(S);
    const isNew = !meta.endings[e.id];
    meta.endings[e.id] = { count: (meta.endings[e.id] ? meta.endings[e.id].count : 0) + 1, name: S.name };
    const kept = new Set(meta.keptOutfits);
    S.owned.forEach(o => { if (o !== 'basic' && !OUTFIT[o].hidden) kept.add(o); });
    meta.keptOutfits = Array.from(kept);
    saveMeta();
    store.del(SAVE_KEY);
    closeModal();
    show('ending');
    Sound.setBgmOn(false);
    const bg = $('eBg'), intro = $('eIntro'), pic = $('ePic'), txt = $('eTxt');
    bg.style.background = '#0d1030';
    pic.style.opacity = 0; txt.style.opacity = 0; pic.innerHTML = ''; txt.innerHTML = '';
    intro.style.opacity = 1;
    const lines = ['그리고 8년이 흘렀어…', F('오늘은 {n}의 열여덟 번째 생일.'), F('{n}{은} 어떤 어른이 되었을까?')];
    for (const l of lines) {
      intro.style.opacity = 0; await sleep(500);
      intro.textContent = l; intro.style.opacity = 1;
      Sound.play('tick');
      await sleep(2200);
    }
    intro.style.opacity = 0;
    await sleep(700);
    bg.style.background = `radial-gradient(ellipse at 30% 40%, ${Art.shade(e.bg, 0.25)}, ${e.bg} 60%, ${Art.shade(e.bg, -0.45)})`;
    pic.innerHTML = Art.girl({ stage: 2, outfit: e.outfit, expr: 'happy', hair: hairCol(S.hair), acc: e.acc });
    const no = ENDINGS.indexOf(e) + 1;
    const t = S.st;
    txt.innerHTML = `<div class="no">엔딩 ${no} / ${ENDINGS.length}${isNew ? '<span class="new">NEW!</span>' : ''}</div>
      <h2 class="jua">${e.icon} ${e.name}</h2>
      <p>${F(e.text)}</p>
      <div class="final">${STATS.map(s => `<div>${s.n} <b>${Math.floor(t[s.k])}</b></div>`).join('')}
        <div>돈 <b>${Math.floor(S.gold)}G</b></div><div>평판 <b>${Math.floor(S.fame)}</b></div><div>우승 <b>${S.wins.martial + S.wins.beauty + S.wins.cook + S.wins.magic}회</b></div><div>여행 <b>${S.cnt.travel}번</b></div><div>가출 <b>${S.runaways}번</b></div></div>
      <div class="btns">
        <button class="btn pri jua" data-end="again">같은 이름으로 다시 키우기</button>
        <button class="btn jua" data-end="new">새 이름으로</button>
        <button class="btn jua" data-end="codex">엔딩 도감</button>
        <button class="btn jua" data-end="title">타이틀로</button>
      </div>`;
    pic.style.opacity = 1; txt.style.opacity = 1;
    Sound.play('ending');
    setTimeout(() => { applySettings(); Sound.setSong('home'); }, 2500);
  }
  function onEndingBtn(v) {
    const name = meta.lastName;
    if (S) setupHair = S.hair;
    if (v === 'again') {
      S = null;
      $('nameInput').value = name;
      startNewWith(name);
    } else if (v === 'new') { S = null; toSetup(''); }
    else if (v === 'codex') { const keep = S; S = null; openCodex().then(() => { S = keep; }); }
    else { toTitle(); }
  }
  function startNewWith(name) {
    $('nameInput').value = name;
    startNew();
  }

  // ---------- 입력 ----------
  function bind() {
    $('tContinue').onclick = () => { Sound.play('click'); continueGame(); };
    $('tNew').onclick = () => {
      Sound.play('click');
      if (load()) {
        choose(`<h3><span class="ic">⚠️</span>새로 키울까?</h3><p>지금 키우던 딸의 저장이 사라져. (엔딩 도감은 그대로야)</p>
          <div class="btns"><button class="btn pri jua" data-v="y">새로 키울래</button><button class="btn jua" data-v="n">그만둘래</button></div>`)
          .then(v => { closeModal(); if (v === 'y') { store.del(SAVE_KEY); toSetup(''); } });
      } else toSetup('');
    };
    $('tCodex').onclick = () => { Sound.play('click'); openCodex(); };
    $('tSettings').onclick = () => { Sound.play('click'); openSettings(true); };
    $('tFull').onclick = () => { Sound.play('click'); fullscreen(); };
    $('nameChips').onclick = e => { const c = e.target.closest('[data-name]'); if (c) { $('nameInput').value = c.dataset.name; Sound.play('select'); } };
    $('hairChips').onclick = e => { const c = e.target.closest('[data-hair]'); if (c) { setupHair = c.dataset.hair; Sound.play('select'); updateSetupPreview(); } };
    $('setupGo').onclick = startNew;
    $('setupBack').onclick = () => { Sound.play('cancel'); toTitle(); };
    $('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); startNew(); } });
    $('acts').onclick = e => { const a = e.target.closest('[data-act]'); if (a) onActClick(a.dataset.act); };
    $('acts').onmouseover = e => {
      const a = e.target.closest('[data-act]');
      if (!a || busy || !S) return;
      renderStats(ACT[a.dataset.act].gain);
    };
    $('acts').onmouseleave = () => { if (S && !busy) renderStats(); };
    document.querySelectorAll('#sched .slot').forEach(el => { el.onclick = () => onSlotClick(+el.dataset.slot); });
    $('repeatBtn').onclick = onRepeat;
    $('startBtn').onclick = runMonth;
    $('run').onclick = () => { if (busy) skip = true; };
    $('hShop').onclick = () => { Sound.play('click'); openShop(); };
    $('hCodex').onclick = () => { Sound.play('click'); openCodex(); };
    $('hSet').onclick = () => { Sound.play('click'); openSettings(false); };
    $('hFull').onclick = () => { Sound.play('click'); fullscreen(); };
    $('eTxt').onclick = e => { const b = e.target.closest('[data-end]'); if (b) { Sound.play('click'); onEndingBtn(b.dataset.end); } };

    // 스페이스바 = 마우스 좌클릭
    document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    document.addEventListener('keydown', e => {
      Sound.init();
      if (e.code !== 'Space' && e.key !== ' ') return;
      const ae = document.activeElement;
      if (ae && ae.tagName === 'INPUT') return;
      e.preventDefault();
      if (e.repeat || mouse.x < 0) return;
      const el = document.elementFromPoint(mouse.x, mouse.y);
      if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: mouse.x, clientY: mouse.y }));
    });
    document.addEventListener('keyup', e => { if (e.code === 'Space' && !(document.activeElement && document.activeElement.tagName === 'INPUT')) e.preventDefault(); });
    document.addEventListener('pointerdown', () => Sound.init());
    // 버튼에 포커스가 남아 스페이스로 두 번 눌리는 것 방지
    document.addEventListener('click', () => { const a = document.activeElement; if (a && a.tagName === 'BUTTON') a.blur(); });
    addEventListener('resize', fit);
    document.addEventListener('fullscreenchange', fit);
  }

  // ---------- 시작 ----------
  initStars();
  bind();
  fit();
  applySettings();
  toTitle();
  window.__game = { get S() { return S; }, set S(v) { S = v; }, meta: () => meta, renderAll, beginMonth, Logic };
})();

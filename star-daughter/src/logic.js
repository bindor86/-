// ===== 게임 규칙 (화면과 분리: 시뮬레이션에서도 그대로 씀) =====
const Logic = (() => {
  let rng = Math.random;
  const setRng = f => { rng = f; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = arr => arr[Math.floor(rng() * arr.length)];

  const TOTAL_MONTHS = 96;
  const STIPEND = 60;   // 10살 기준, 해마다 +10
  const stipendOf = s => STIPEND + (age(s) - 10) * 10;
  const GAIN = 0.4;   // 수업·일 능력치 상승 배율
  const AFF_SOFT = 150;   // 사이가 높을수록 덜 오름
  const AFF_DRIFT = 1.5;  // 사이가 좋을 때(50 넘게) 딸과 시간을 안 보낸 달에 식는 만큼
  const age = s => 10 + Math.floor(s.m / 12);
  const calMonth = s => (2 + s.m) % 12;           // 0 = 1월
  const yearNo = s => Math.floor(s.m / 12) + 1;   // n년째
  const isBirthday = s => s.m > 0 && s.m % 12 === 0;
  const isFestival = s => s.m % 12 === 7;          // 10월

  // ----- 한국어 조사 -----
  function hasBatchim(word) {
    const ch = word.charCodeAt(word.length - 1);
    if (ch < 0xac00 || ch > 0xd7a3) return false;
    return (ch - 0xac00) % 28 !== 0;
  }
  const JOSA = { '은': ['은', '는'], '이': ['이', '가'], '을': ['을', '를'], '과': ['과', '와'], '아': ['아', '야'], '도': ['도', '도'], '이라': ['이라', '라'] };
  const josa = (word, j) => word + JOSA[j][hasBatchim(word) ? 0 : 1];
  function fmt(text, s) {
    const n = s.name;
    const b = hasBatchim(n);
    return text.replace(/\{n\}\{(이라|은|이|을|과|아|도)\}/g, (_, j) => n + JOSA[j][b ? 0 : 1]).replace(/\{n\}/g, () => n);
  }

  // ----- 새 게임 -----
  function newGame(name, hair, meta, hairStyle) {
    meta = meta || {};
    const r = () => Math.floor(rng() * 7) - 3;
    const s = {
      v: 2, name, hair, hairStyle: hairStyle || 'long', m: 0, aff: 30,
      st: { hp: 30 + r(), str: 15 + r(), int: 20 + r(), ele: 20 + r(), cha: 25 + r(), sen: 20 + r(), mag: 5 + r(), mor: 40 + r(), cook: 5 + r(), swd: 5 + r() },
      stress: 0, fame: 0,
      gold: 500 + newGamePlusGold(meta),
      outfit: 'basic',
      owned: Array.from(new Set(['basic', ...(meta.keptOutfits || [])])),
      wear: null, ownedAcc: Array.from(new Set(meta.keptAcc || [])), talkedM: -1,
      cnt: {}, flags: {}, wins: { martial: 0, beauty: 0, cook: 0, magic: 0 },
      titles: [], seen: {}, sched: [null, null, null], lastSched: null,
      sick: 0, runaways: 0, runaway: false, contestLog: [],
    };
    for (const a of ACTS) s.cnt[a.id] = 0;
    return s;
  }
  function newGamePlusGold(meta) {
    const n = Object.keys(meta.endings || {}).length;
    return Math.min(1000, n * 50);
  }

  // ----- 수업 단계 · 일 숙련도 (같은 기준) -----
  function lessonLv(s, id) {
    const c = s.cnt[id] || 0;
    let lv = 1;
    for (let i = 0; i < LESSON_LV.length; i++) if (c >= LESSON_LV[i]) lv = i + 1;
    return lv;
  }
  const lvMult = lv => 1 + (lv - 1) * 0.12;
  const costOf = (s, a) => Math.round((a.cost || 0) * (a.type === 'lesson' ? 1 + (lessonLv(s, a.id) - 1) * 0.15 : 1));

  const jobPayMult = lv => 1 + (lv - 1) * 0.08;
  function payOf(s, a) { return Math.round(a.pay * (1 + (age(s) - 10) * 0.12) * jobPayMult(lessonLv(s, a.id))); }

  function actState(s, a, plannedCost) {
    if (a.minAge && age(s) < a.minAge) return { ok: false, why: `${a.minAge}살부터` };
    if (a.req) for (const k in a.req) if (s.st[k] < a.req[k]) return { ok: false, why: `${STAT_NAME[k]} ${a.req[k]} 필요` };
    const cost = costOf(s, a);
    if (cost > 0 && s.gold - (plannedCost || 0) < cost) return { ok: false, why: '돈이 모자라' };
    return { ok: true };
  }
  function schedCost(s) {
    return s.sched.reduce((t, id) => t + (id ? costOf(s, ACT[id]) : 0), 0);
  }

  // ----- 옷 · 액세서리 -----
  function gear(s) { return [OUTFIT[s.outfit], s.wear && ACC_ITEM[s.wear]].filter(Boolean); }
  function gearMult(s, id) { let m = 1; for (const g of gear(s)) if (g.act && g.act[id]) m *= g.act[id]; return m; }
  function gearContest(s, id) { let p = 0; for (const g of gear(s)) if (g.contest && g.contest[id]) p += g.contest[id]; return p; }

  // ----- 스탯 적용 -----
  function addStat(s, k, d) {
    if (k === 'gold') { s.gold = Math.max(0, s.gold + d); return; }
    if (k === 'stress') { s.stress = clamp(s.stress + d, 0, 100); return; }
    if (k === 'fame') { s.fame = clamp(s.fame + d, 0, 999); return; }
    if (k === 'aff') { s.aff = clamp(s.aff + (d > 0 ? d * (1 - s.aff / AFF_SOFT) : d), 0, 100); return; }
    if (k in s.st) { s.st[k] = clamp(s.st[k] + d, 0, STAT_MAX); return; }
    s.flags[k] = (s.flags[k] || 0) + d;  // 플래그 (friend, prince 등)
  }
  // 실제로 변한 만큼을 돌려줌 (상한·하한, 사이 완만함 반영)
  function valueOf(s, k) {
    if (k === 'gold' || k === 'stress' || k === 'fame' || k === 'aff') return s[k];
    if (k in s.st) return s.st[k];
    return null;
  }
  function applyFx(s, fx) {
    const out = [];
    for (const k in fx) {
      const before = valueOf(s, k);
      addStat(s, k, fx[k]);
      const after = valueOf(s, k);
      out.push({ k, d: before === null ? fx[k] : Math.round(after - before) });
    }
    return out;
  }

  // ----- 스케줄 한 칸 실행 -----
  function runSlot(s, id) {
    const a = ACT[id];
    const res = { id, kind: 'ok', changes: [], gold: 0, stress: 0, line: pick(a.lines), lvUp: false };

    // 아픔 판정 (스트레스가 높으면)
    if (a.type !== 'rest' && a.type !== 'travel' && s.stress >= 80) {
      const p = clamp((s.stress - 75) / 50 + (s.st.hp < 100 ? 0.1 : 0), 0, 0.65);
      if (rng() < p) {
        res.kind = 'sick';
        const med = Math.min(s.gold, 40);
        s.gold -= med; res.gold = -med;
        addStat(s, 'stress', -25); res.stress = -25;
        addStat(s, 'hp', -3); res.changes.push({ k: 'hp', d: -3 });
        s.sick++;
        res.line = '열이 나서 앓아누웠어… 약값이 들었어.';
        return res;
      }
    }

    // 성공 판정
    const sp = Math.max(0, s.stress - 40) * 0.008;
    let pOk, pGreat;
    if (a.type === 'lesson') { pOk = 0.9 - sp; pGreat = 0.12; }
    else if (a.type === 'job') { const kv = s.st[a.key] || 0; pOk = clamp(0.55 + kv / 400, 0.55, 0.95) - sp; pGreat = 0.08 + Math.min(0.15, kv / 2000); }
    else { pOk = 1; pGreat = 0.15; }
    const roll = rng();
    res.kind = roll < pGreat ? 'great' : roll < pOk ? 'ok' : 'fail';
    if (res.kind === 'fail') res.line = a.lines[a.lines.length - 1];
    const mult = { great: 1.5, ok: 1, fail: 0.35 }[res.kind];

    // 효과 배율: 수업 단계 · 옷
    const leveled = a.type === 'lesson' || a.type === 'job';
    const before = leveled ? lessonLv(s, id) : 0;
    let m = leveled ? lvMult(before) : 1;
    m *= gearMult(s, id);

    for (const k in a.gain) {
      const base = a.gain[k];
      let d;
      if (base > 0) d = Math.max(res.kind === 'fail' ? 0 : 1, Math.round(base * GAIN * m * mult * (0.8 + rng() * 0.4)));
      else { const x = -base * GAIN; d = -(Math.floor(x) + (rng() < x - Math.floor(x) ? 1 : 0)); }  // 평균만큼만 깎임
      if (d !== 0) { addStat(s, k, d); res.changes.push({ k, d }); }
    }

    // 돈 (일 숙련도 반영은 payOf 안에서)
    if (a.type === 'job') {
      const g = Math.round(payOf(s, a) * (res.kind === 'great' ? 1.5 : res.kind === 'fail' ? 0.4 : 1));
      s.gold += g; res.gold = g;
    } else if (a.cost) {
      const c = Math.min(s.gold, costOf(s, a));
      s.gold -= c; res.gold = -c;
    }

    // 스트레스: 체력이 높을수록 덜 쌓여
    let sd = a.stress;
    if (sd > 0) sd = Math.round(sd * (1 - Math.min(0.45, s.st.hp / 900)) * (res.kind === 'fail' ? 1.3 : 1));
    else if (res.kind === 'great') sd = Math.round(sd * 1.3);
    addStat(s, 'stress', sd); res.stress = sd;

    if (a.fame) { addStat(s, 'fame', a.fame * (res.kind === 'fail' ? 0 : 1)); }
    if (a.type === 'job' && res.kind !== 'fail' && !a.fame) addStat(s, 'fame', 0.5);

    s.cnt[id] = (s.cnt[id] || 0) + 1;
    if (leveled && lessonLv(s, id) > before) res.lvUp = lessonLv(s, id);
    return res;
  }

  // ----- 달 마감 -----
  function monthEnd(s) {
    const out = { stipend: stipendOf(s), bonus: [], runaway: false };
    s.gold += out.stipend;
    for (const g of gear(s)) if (g.bonus) out.bonus = out.bonus.concat(applyFx(s, g.bonus));
    if (s.talkedM !== s.m && s.aff > 50) addStat(s, 'aff', -Math.min(AFF_DRIFT, s.aff - 50));
    s.fame = Math.round(s.fame * 10) / 10;
    // 아빠와 사이가 좋으면 집을 나가지 않아
    if (s.stress >= 100 && s.st.mor < 200 && s.aff < 60 && rng() < 0.5) { s.runaway = true; out.runaway = true; }
    s.lastSched = s.sched.slice();
    s.sched = [null, null, null];
    s.m++;
    return out;
  }

  function resolveRunaway(s) {
    s.runaway = false;
    s.runaways++;
    const lost = Math.min(s.gold, 100);
    s.gold -= lost;
    s.stress = 40;
    addStat(s, 'mor', -10);
    addStat(s, 'fame', -25);
    addStat(s, 'aff', -10);
    s.gold += stipendOf(s);
    s.m++;
    return { lost };
  }

  // ----- 이벤트 -----
  function eventOK(s, e) {
    if (!e.repeat && s.seen[e.id]) return false;
    if (e.month !== undefined && calMonth(s) !== e.month) return false;
    if (e.cond && !e.cond(s, s.st, age(s), calMonth(s))) return false;
    return true;
  }
  function pickEvent(s) {
    const fixed = EVENTS.filter(e => e.weight === 99 && eventOK(s, e));
    if (fixed.length) return fixed[0];
    if (s.m === 0 || rng() > 0.5) return null;
    const pool = EVENTS.filter(e => e.weight !== 99 && eventOK(s, e) && !(e.repeat && s.seen[e.id] && rng() < 0.6));
    if (!pool.length) return null;
    // 인물 이야기는 더 자주 나오게
    const w = e => /^(haru|liana|bianca|locket|orphan)\d/.test(e.id) ? 6 : e.key ? 4 : e.month !== undefined ? 3 : 1;
    let total = pool.reduce((t, e) => t + w(e), 0), r = rng() * total;
    for (const e of pool) { r -= w(e); if (r <= 0) return e; }
    return pool[pool.length - 1];
  }
  function chooseEvent(s, e, i) {
    s.seen[e.id] = (s.seen[e.id] || 0) + 1;
    const ch = e.choices[i];
    const fx = Object.assign({}, ch.fx);
    let after = (ch.after || []).slice();
    if (fx.gamble) {
      delete fx.gamble;
      if (rng() < 0.55) { fx.gold = (fx.gold || 0) + 450; after = [['peddler', '나리! 약속대로 450G 가져왔습니다요! 남쪽 항구 후추 값이 폭등했지 뭡니까!']]; }
      else after = [['n', '행상인은… 다시 나타나지 않았어.'], ['me', '아빠, 그러니까 내가 눈이 굴러간다고 했잖아.']];
    }
    if (fx.fortune) {
      delete fx.fortune;
      const near = nearestEnding(s);
      after = [['fortune', `흐흐… 따님에게서 「${near.name}」의 기운이 느껴지는구려.`], ['fortune', near.hint]];
    }
    const changes = applyFx(s, fx);
    return { after, changes };
  }

  // ----- 생일 -----
  function birthdayGifts(s) {
    const pool = BDAY_GIFTS.slice();
    const out = [];
    while (out.length < 4) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    return out;
  }

  // ----- 축제 대회 -----
  function contestPower(s, id) {
    const c = CONTEST[id];
    return Math.round(c.power(s.st) + gearContest(s, id));
  }
  function rivalBase(y) { return 40 + y * 62; }  // y: 1~8
  function runContest(s, id) {
    const c = CONTEST[id];
    const y = yearNo(s);
    const base = rivalBase(y);
    const names = c.rivals.slice().sort(() => rng() - 0.5);
    const rounds = [];
    const muls = [0.7, 0.9, 1.08];
    const labels = ['1회전', '준결승', '결승'];
    let won = true;
    const me = contestPower(s, id);
    for (let i = 0; i < 3; i++) {
      const them = Math.round(base * muls[i] * (0.88 + rng() * 0.24));
      const mine = Math.round(me * (0.9 + rng() * 0.2));
      const win = mine >= them;
      rounds.push({ label: labels[i], rival: names[i], me: mine, them, win });
      if (!win) { won = false; break; }
    }
    const prize = won ? 200 + y * 50 : rounds.length >= 2 ? 50 : 0;
    s.gold += prize;
    addStat(s, 'fame', won ? 40 : 5 + rounds.length * 3);
    addStat(s, 'stress', won ? -15 : 5);
    if (won) s.wins[id]++;
    s.contestLog.push({ y, id, won, reach: rounds.length });
    return { rounds, won, prize, power: me };
  }

  // ----- 엔딩 -----
  function reqMet(s, req) {
    if (req.st) for (const k in req.st) if (s.st[k] < req.st[k]) return false;
    if (req.max) for (const k in req.max) if (s.st[k] > req.max[k]) return false;
    if (req.cnt) for (const k in req.cnt) if ((s.cnt[k] || 0) < req.cnt[k]) return false;
    if (req.wins) for (const k in req.wins) if (s.wins[k] < req.wins[k]) return false;
    if (req.flags) for (const k in req.flags) if ((s.flags[k] || 0) < req.flags[k]) return false;
    if (req.gold && s.gold < req.gold) return false;
    if (req.aff && s.aff < req.aff) return false;
    if (req.fame && s.fame < req.fame) return false;
    if (req.runaways && s.runaways < req.runaways) return false;
    return true;
  }
  // 0~1: 조건에 얼마나 가까운지
  function reqProgress(s, req) {
    const parts = [];
    if (req.st) for (const k in req.st) parts.push(Math.min(1, s.st[k] / req.st[k]));

    if (req.cnt) for (const k in req.cnt) parts.push(Math.min(1, (s.cnt[k] || 0) / req.cnt[k]));
    if (req.wins) for (const k in req.wins) parts.push(Math.min(1, s.wins[k] / req.wins[k]));
    if (req.flags) for (const k in req.flags) parts.push(Math.min(1, (s.flags[k] || 0) / req.flags[k]));
    if (req.gold) parts.push(Math.min(1, s.gold / req.gold));
    if (req.aff) parts.push(Math.min(1, s.aff / req.aff));
    if (req.fame) parts.push(Math.min(1, s.fame / req.fame));
    if (req.runaways) parts.push(Math.min(1, s.runaways / req.runaways));
    if (!parts.length) return 0;
    // '도덕이 낮아야' 같은 상한 조건은 다른 조건이 반쯤 찼을 때만 진척으로 쳐
    const avg = parts.reduce((a, b) => a + b, 0) / parts.length;
    if (req.max) {
      for (const k in req.max) parts.push(avg < 0.5 ? 0 : s.st[k] <= req.max[k] ? 1 : Math.max(0, 1 - (s.st[k] - req.max[k]) / 200));
      return parts.reduce((a, b) => a + b, 0) / parts.length;
    }
    return avg;
  }
  // 같은 등급 안에서 고를 때: 조건마다 '얼마나 넘겼나(배수)'를 보고 가장 아슬아슬한 조건으로 비교.
  // 이야기·우승 조건은 채웠으면 넉넉한 것으로 침. 같으면 ENDINGS 앞쪽(더 어려운 쪽)이 이김
  const FIT_CAP = 3;
  function reqFit(s, req) {
    let low = FIT_CAP;
    const r = (v, t) => { low = Math.min(low, v / t); };
    if (req.st) for (const k in req.st) r(s.st[k], req.st[k]);
    if (req.max) for (const k in req.max) low = Math.min(low, 1 + Math.max(0, req.max[k] - s.st[k]) / 100);
    if (req.cnt) for (const k in req.cnt) r(s.cnt[k] || 0, req.cnt[k]);
    if (req.gold) r(s.gold, req.gold);
    if (req.aff) r(s.aff, req.aff);
    if (req.fame) r(s.fame, req.fame);
    return low;
  }
  // X의 조건이 Y의 조건을 모두 포함하고 더 높으면 X가 Y를 '덮음' (예: 치유사 ⊃ 교사)
  function covers(X, Y) {
    let more = false;
    const groups = ['st', 'cnt', 'wins', 'flags'];
    for (const g of groups) for (const k in (Y[g] || {})) {
      if (!X[g] || X[g][k] === undefined || X[g][k] < Y[g][k]) return false;
      if (X[g][k] > Y[g][k]) more = true;
    }
    for (const k of ['gold', 'fame', 'aff']) if (Y[k] !== undefined) { if (X[k] === undefined || X[k] < Y[k]) return false; if (X[k] > Y[k]) more = true; }
    if (Y.max) return false;
    for (const g of groups) for (const k in (X[g] || {})) if (!Y[g] || Y[g][k] === undefined) more = true;
    for (const k of ['gold', 'fame', 'aff']) if (X[k] !== undefined && Y[k] === undefined) more = true;
    return more;
  }
  const TIER_ORDER = ['S', 'H', 'A', 'W', 'D', 'Z'];
  function decideEnding(s) {
    for (const t of TIER_ORDER) {
      const met = ENDINGS.filter(e => e.tier === t && reqMet(s, e.req));
      const cand = met.filter(y => !met.some(x => x !== y && covers(x.req, y.req)));
      let best = null, bv = -1;
      for (const e of cand) { const v = reqFit(s, e.req); if (v > bv) { bv = v; best = e; } }
      if (best) return best;
    }
    return ENDING.villager;
  }
  function nearestEnding(s) {
    let best = null, bv = -1;
    for (const e of ENDINGS) {
      if (e.id === 'villager' || e.hidden) continue;
      const v = reqProgress(s, e.req);
      if (v > bv) { bv = v; best = e; }
    }
    return best;
  }

  // ----- 칭호 -----
  function checkTitles(s) {
    s.titles = s.titles || [];
    const got = [];
    for (const t of TITLES) if (!s.titles.includes(t.id) && t.c(s)) { s.titles.push(t.id); got.push(t); }
    return got;
  }

  // ----- 딸과의 시간 (한 달에 한 번) -----
  const DAD_ACTS = [
    { id: 'talk', name: '대화하기', icon: '💬', desc: '사이 ↑ 스트레스 ↓', fx: { aff: 4, stress: -8 } },
    { id: 'walk', name: '함께 산책', icon: '🌳', desc: '사이 ↑ 체력·감성 조금 ↑', fx: { aff: 3, stress: -6, hp: 1, sen: 1 } },
    { id: 'money', name: '용돈 주기', icon: '🪙', desc: '스트레스 ↓↓ 돈이 들어', fx: { stress: -15, aff: 2, mor: -1 } },
    { id: 'praise', name: '칭찬하기', icon: '👏', desc: '사이 ↑ 매력 조금 ↑', fx: { aff: 4, stress: -4, cha: 1 } },
    { id: 'scold', name: '꾸짖기', icon: '☝️', desc: '도덕 ↑ 스트레스 ↑ 사이 ↓', fx: { mor: 4, stress: 10, aff: -5 } },
  ];
  const allowance = s => 20 + age(s) * 5;
  function dadTime(s, id) {
    const d = DAD_ACTS.find(x => x.id === id);
    const fx = Object.assign({}, d.fx);
    if (id === 'money') fx.gold = -Math.min(s.gold, allowance(s));
    const st = stage(s);
    let lines;
    if (id === 'talk') {
      let pair;
      if (s.stress >= 70) pair = DAD_TALK_STATE.tired;
      else if (s.gold < 80) pair = DAD_TALK_STATE.poor;
      else if (s.stress <= 15 && rng() < 0.4) pair = DAD_TALK_STATE.happy;
      else pair = pick(DAD_TALK[st]);
      lines = [['me', pair[0]], ['me', pair[1], 'happy']];
    } else if (id === 'walk') lines = [['n', pick(['둘이 별빛 언덕을 천천히 걸었어.', '저녁노을 속을 나란히 걸었어.', '시장 골목을 구경하며 걸었어.'])], ['me', pick(['아빠 걸음 느려~ 무릎 괜찮아?', '이렇게 걷는 거 좋다.', '저 구름, 별똥이 닮았다!']), 'happy']];
    else if (id === 'money') lines = [['me', st === 0 ? '와! 사탕 사 먹어야지!' : st === 1 ? '고마워! 친구들이랑 맛있는 거 먹을래.' : '아빠, 고마워. 아껴 쓸게.', 'happy']];
    else if (id === 'praise') lines = [['dad', pick(['요즘 정말 열심히 하는구나. 대견하다.', '네가 자랑스럽다.', '오늘도 수고했다.'])], ['me', pick(['헤헤… 갑자기 왜 그래.', '…더 열심히 할게!', '아빠가 칭찬하니까 이상해. 좋은 쪽으로.']), 'happy']];
    else lines = [['dad', pick(['요즘 행동이 좀 지나치구나.', '해야 할 일을 소홀히 하면 안 된다.', '말투가 많이 거칠어졌어.'])], ['me', pick(['…알았어.', '잔소리…', '…미안해.']), 'sulky']];
    s.talkedM = s.m;
    s.flags.dadtime = (s.flags.dadtime || 0) + 1;
    return { lines, changes: applyFx(s, fx) };
  }

  // ----- 루퍼스의 조언 -----
  function rufusAdvice(s) {
    const out = [];
    if (s.stress >= 70) out.push(RUFUS.stressHigh);
    else if (s.stress >= 50) out.push(RUFUS.stressMid);
    if (s.gold < 150) out.push(RUFUS.poor);
    if (calMonth(s) === 8) {
      let best = CONTESTS[0], bv = -1;
      for (const c of CONTESTS) { const v = contestPower(s, c.id); if (v > bv) { bv = v; best = c; } }
      out.push(RUFUS.festSoon.replace('{c}', best.name));
    }
    if (s.aff < 40 && s.talkedM < s.m - 2) out.push(RUFUS.affLow);
    for (const a of ACTS) {
      if (a.type !== 'lesson') continue;
      const c = s.cnt[a.id] || 0;
      const next = LESSON_LV.find(v => v > c);
      if (next && c > 0 && next - c <= 3) { out.push(RUFUS.lvSoon.replace('{l}', a.name)); break; }
    }
    if (s.m >= 6) {
      const near = nearestEnding(s);
      if (near) out.push(RUFUS.near.replace('{e}', near.name).replace('{h}', near.hint));
    }
    if (s.gold >= 1200 && out.length < 3) out.push(RUFUS.rich);
    if (!out.length) out.push(RUFUS.calm);
    return out.slice(0, 3);
  }

  // 딸 표정
  function mood(s) {
    if (s.stress >= 80) return 'tired';
    if (s.stress >= 60) return 'sulky';
    if (s.stress <= 20) return 'happy';
    return 'normal';
  }
  function stage(s) {
    const a = age(s);
    return a <= 12 ? 0 : a <= 15 ? 1 : 2;
  }

  return {
    setRng, TOTAL_MONTHS, STIPEND, josa, age, calMonth, yearNo, isBirthday, isFestival, fmt, hasBatchim,
    newGame, lessonLv, lvMult, payOf, costOf, AFF_SOFT, reqFit, covers, actState, schedCost, applyFx, runSlot, monthEnd, resolveRunaway,
    pickEvent, chooseEvent, eventOK, birthdayGifts, contestPower, rivalBase, runContest,
    reqMet, reqProgress, decideEnding, nearestEnding, mood, stage, addStat,
    checkTitles, DAD_ACTS, allowance, dadTime, rufusAdvice, gearMult, gearContest,
  };
})();
if (typeof module !== 'undefined') module.exports = { Logic };

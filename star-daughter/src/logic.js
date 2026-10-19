// ===== 게임 규칙 (화면과 분리: 시뮬레이션에서도 그대로 씀) =====
const Logic = (() => {
  let rng = Math.random;
  const setRng = f => { rng = f; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = arr => arr[Math.floor(rng() * arr.length)];

  const TOTAL_MONTHS = 96;
  const STIPEND = 70;
  const GAIN = 0.5;   // 수업·일 능력치 상승 배율
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
  const JOSA = { '은': ['은', '는'], '이': ['이', '가'], '을': ['을', '를'], '과': ['과', '와'], '아': ['아', '야'], '도': ['도', '도'] };
  const josa = (word, j) => word + JOSA[j][hasBatchim(word) ? 0 : 1];
  function fmt(text, s) {
    const n = s.name;
    const b = hasBatchim(n);
    return text.replace(/\{n\}\{(은|이|을|과|아|도)\}/g, (_, j) => n + JOSA[j][b ? 0 : 1]).replace(/\{n\}/g, n);
  }

  // ----- 새 게임 -----
  function newGame(name, hair, meta) {
    meta = meta || {};
    const r = () => Math.floor(rng() * 7) - 3;
    const s = {
      v: 1, name, hair, m: 0,
      st: { hp: 30 + r(), str: 15 + r(), int: 20 + r(), ele: 20 + r(), cha: 25 + r(), sen: 20 + r(), mag: 5 + r(), mor: 40 + r(), cook: 5 + r(), swd: 5 + r() },
      stress: 0, fame: 0,
      gold: 500 + newGamePlusGold(meta),
      outfit: 'basic',
      owned: Array.from(new Set(['basic', ...(meta.keptOutfits || [])])),
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

  // ----- 수업 단계 -----
  function lessonLv(s, id) {
    const c = s.cnt[id] || 0;
    let lv = 1;
    for (let i = 0; i < LESSON_LV.length; i++) if (c >= LESSON_LV[i]) lv = i + 1;
    return lv;
  }
  const lvMult = lv => 1 + (lv - 1) * 0.15;

  function payOf(s, a) { return Math.round(a.pay * (1 + (age(s) - 10) * 0.12)); }

  function actState(s, a, plannedCost) {
    if (a.minAge && age(s) < a.minAge) return { ok: false, why: `${a.minAge}살부터` };
    if (a.req) for (const k in a.req) if (s.st[k] < a.req[k]) return { ok: false, why: `${STAT_NAME[k]} ${a.req[k]} 필요` };
    const cost = a.cost || 0;
    if (cost > 0 && s.gold - (plannedCost || 0) < cost) return { ok: false, why: '돈이 모자라' };
    return { ok: true };
  }
  function schedCost(s) {
    return s.sched.reduce((t, id) => t + (id ? (ACT[id].cost || 0) : 0), 0);
  }

  // ----- 스탯 적용 -----
  function addStat(s, k, d) {
    if (k === 'gold') { s.gold = Math.max(0, s.gold + d); return; }
    if (k === 'stress') { s.stress = clamp(s.stress + d, 0, 100); return; }
    if (k === 'fame') { s.fame = clamp(s.fame + d, 0, 999); return; }
    if (k in s.st) { s.st[k] = clamp(s.st[k] + d, 0, STAT_MAX); return; }
    s.flags[k] = (s.flags[k] || 0) + d;  // 플래그 (friend, prince 등)
  }
  function applyFx(s, fx) {
    const out = [];
    for (const k in fx) { addStat(s, k, fx[k]); out.push({ k, d: fx[k] }); }
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
    const before = a.type === 'lesson' ? lessonLv(s, id) : 0;
    let m = a.type === 'lesson' ? lvMult(before) : 1;
    const of = OUTFIT[s.outfit];
    if (of && of.act && of.act[id]) m *= of.act[id];

    for (const k in a.gain) {
      const base = a.gain[k];
      let d;
      if (base > 0) d = Math.max(res.kind === 'fail' ? 0 : 1, Math.round(base * GAIN * m * mult * (0.8 + rng() * 0.4)));
      else d = Math.min(-1, Math.round(base * GAIN));
      if (d !== 0) { addStat(s, k, d); res.changes.push({ k, d }); }
    }

    // 돈
    if (a.type === 'job') {
      const g = Math.round(payOf(s, a) * (res.kind === 'great' ? 1.5 : res.kind === 'fail' ? 0.4 : 1));
      s.gold += g; res.gold = g;
    } else if (a.cost) {
      const c = Math.min(s.gold, a.cost);
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
    if (a.type === 'lesson' && lessonLv(s, id) > before) res.lvUp = lessonLv(s, id);
    return res;
  }

  // ----- 달 마감 -----
  function monthEnd(s) {
    const out = { stipend: STIPEND, bonus: [], runaway: false };
    s.gold += STIPEND;
    const of = OUTFIT[s.outfit];
    if (of && of.bonus) out.bonus = applyFx(s, of.bonus);
    s.fame = Math.round(s.fame * 10) / 10;
    if (s.stress >= 100 && s.st.mor < 200 && rng() < 0.5) { s.runaway = true; out.runaway = true; }
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
    s.gold += STIPEND;
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
    if (s.m === 0 || rng() > 0.4) return null;
    const pool = EVENTS.filter(e => e.weight !== 99 && eventOK(s, e) && !(e.repeat && s.seen[e.id] && rng() < 0.7));
    if (!pool.length) return null;
    return pick(pool);
  }
  function chooseEvent(s, e, i) {
    s.seen[e.id] = (s.seen[e.id] || 0) + 1;
    const ch = e.choices[i];
    const fx = Object.assign({}, ch.fx);
    let msg = ch.msg;
    let extra = null;
    if (fx.gamble) {
      delete fx.gamble;
      if (rng() < 0.55) { fx.gold = (fx.gold || 0) + 450; msg = '행상인이 정말로 450G를 들고 돌아왔어! 대박!'; }
      else msg = '행상인은… 다시 나타나지 않았어. 비싼 수업료였어.';
    }
    if (fx.fortune) {
      delete fx.fortune;
      const near = nearestEnding(s);
      msg = `"따님에게서 「${near.name}」의 기운이 느껴지는구려…" ${near.hint}`;
      extra = near.id;
    }
    const changes = applyFx(s, fx);
    return { msg: fmt(msg, s), changes, extra };
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
    let p = c.power(s.st);
    const of = OUTFIT[s.outfit];
    if (of && of.contest && of.contest[id]) p += of.contest[id];
    return Math.round(p);
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
    if (won) {
      s.wins[id]++;
      const t = `${c.name} 우승`;
      if (!s.titles.includes(t)) s.titles.push(t);
    }
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
    return true;
  }
  // 0~1: 조건에 얼마나 가까운지
  function reqProgress(s, req) {
    const parts = [];
    if (req.st) for (const k in req.st) parts.push(Math.min(1, s.st[k] / req.st[k]));
    if (req.max) for (const k in req.max) parts.push(s.st[k] <= req.max[k] ? 1 : Math.max(0, 1 - (s.st[k] - req.max[k]) / 200));
    if (req.cnt) for (const k in req.cnt) parts.push(Math.min(1, (s.cnt[k] || 0) / req.cnt[k]));
    if (req.wins) for (const k in req.wins) parts.push(Math.min(1, s.wins[k] / req.wins[k]));
    if (req.flags) for (const k in req.flags) parts.push(Math.min(1, (s.flags[k] || 0) / req.flags[k]));
    if (req.gold) parts.push(Math.min(1, s.gold / req.gold));
    if (!parts.length) return 0;
    return parts.reduce((a, b) => a + b, 0) / parts.length;
  }
  function decideEnding(s) {
    for (const e of ENDINGS) if (reqMet(s, e.req)) return e;
    return ENDING.villager;
  }
  function nearestEnding(s) {
    let best = null, bv = -1;
    for (const e of ENDINGS) {
      if (e.id === 'villager') continue;
      const v = reqProgress(s, e.req);
      if (v > bv) { bv = v; best = e; }
    }
    return best;
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
    newGame, lessonLv, lvMult, payOf, actState, schedCost, applyFx, runSlot, monthEnd, resolveRunaway,
    pickEvent, chooseEvent, eventOK, birthdayGifts, contestPower, rivalBase, runContest,
    reqMet, reqProgress, decideEnding, nearestEnding, mood, stage, addStat,
  };
})();
if (typeof module !== 'undefined') module.exports = { Logic };

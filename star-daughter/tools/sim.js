// 게임 규칙만 돌리는 시뮬레이터 (화면 없이). node tools/balance.js 에서 사용
const fs = require('fs');
const path = require('path');

const src = ['data.js', 'story.js', 'logic.js'].map(f => fs.readFileSync(path.join(__dirname, '../src', f), 'utf8')).join('\n');
const ctx = {};
new Function('ctx', src + `
ctx.Logic = Logic; ctx.ENDINGS = ENDINGS; ctx.ENDING = ENDING; ctx.ACT = ACT; ctx.ACTS = ACTS;
ctx.CONTESTS = CONTESTS; ctx.CONTEST = CONTEST; ctx.EVENTS = EVENTS; ctx.BDAY_GIFTS = BDAY_GIFTS; ctx.TITLES = TITLES;
ctx.OUTFITS = OUTFITS; ctx.OUTFIT = OUTFIT; ctx.ACC_ITEMS = ACC_ITEMS; ctx.ACC_ITEM = ACC_ITEM; ctx.STATS = STATS; ctx.LESSON_LV = LESSON_LV;`)(ctx);
const { Logic, ACT, CONTESTS, OUTFIT, ACC_ITEM } = ctx;

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const STAT_KEYS = ['hp', 'str', 'int', 'ele', 'cha', 'sen', 'mag', 'mor', 'cook', 'swd'];
const ARC = ['haru', 'liana', 'bianca', 'locket', 'orphan', 'cat'];

// 선택지 점수: 목표 능력치 가중치 + 돈 + 스트레스 + 사이 + 이야기
function fxScore(pol, s, fx) {
  let v = 0;
  for (const k in fx) {
    const d = fx[k];
    if (STAT_KEYS.includes(k)) {
      let w = pol.w[k] !== undefined ? pol.w[k] : 0.1;
      if (k === 'mor' && pol.lowMor) w = -1;          // 도덕을 낮춰야 하는 길
      v += w * d;
    } else if (k === 'gold') v += d * (s.gold < 300 ? 0.06 : 0.015) * (pol.goldW || 1);
    else if (k === 'stress') v -= d * 0.15;
    else if (k === 'aff') v += d * (pol.affW !== undefined ? pol.affW : 0.3);
    else if (ARC.includes(k)) v += (pol.story ? 6 : 1.5) * d + ((pol.arcW && pol.arcW[k]) || 0) * d;
    else if (k === 'gamble') v += 0.5;
    else if (k === 'dark' || k === 'forbidden') v += pol.lowMor ? 5 : -3;
  }
  return v;
}

function pickChoice(pol, s, ev, rng) {
  const ok = ev.choices.map((c, i) => ({ c, i })).filter(x => !x.c.need || s.gold >= x.c.need);
  const list = ok.length ? ok : [{ c: ev.choices[ev.choices.length - 1], i: ev.choices.length - 1 }];
  if (pol.firstChoice && rng() < pol.firstChoice && list[0].i === 0) return 0;
  let best = list[0], bv = -1e9;
  for (const x of list) { const v = fxScore(pol, s, x.c.fx) + (rng() - 0.5) * 0.5; if (v > bv) { bv = v; best = x; } }
  return best.i;
}

// jobs: ['a','b'] = 앞에서부터 우선 · [['a',1],['b',1]] = 비중대로 번갈아
function bestJob(pol, s, st) {
  const jobs = pol.jobs || ['bakery'];
  if (Array.isArray(jobs[0])) {
    let best = null, bv = 1e9;
    for (const [id, w] of jobs) {
      if (!Logic.actState(s, ACT[id], 0).ok) continue;
      const v = ((st.jd[id] || 0) + 0.01) / w;
      if (v < bv) { bv = v; best = id; }
    }
    if (best) { st.jd[best] = (st.jd[best] || 0) + 1; return best; }
    return 'bakery';
  }
  for (const id of jobs) if (Logic.actState(s, ACT[id], 0).ok) return id;
  return 'bakery';
}

// 한 달 스케줄: 사람처럼 스트레스·돈을 보면서 고름
function schedule(pol, s, st, rng) {
  const out = [];
  let cost = 0;
  const add = id => { out.push(id); cost += Logic.costOf(s, ACT[id]); };
  const restAt = pol.restAt !== undefined ? pol.restAt : 50;
  const wantTravel = pol.travel && (s.cnt.travel || 0) < pol.travel;
  if (s.stress >= restAt) {
    if ((wantTravel || s.stress >= (pol.travelAt || 75)) && s.gold >= 120 + 80) add('travel');
    else add('rest');
  }
  if (s.stress >= 88 && restAt <= 100) add('rest');
  // 돈이 모자라면 일
  while (out.length < 3 && s.gold - cost < (pol.minGold || 120)) add(bestJob(pol, s, st));
  // 일 비율
  while (out.length < 3) {
    st.jobAcc = (st.jobAcc || 0) + (pol.jobShare || 0.25);
    if (st.jobAcc >= 1) { st.jobAcc -= 1; add(bestJob(pol, s, st)); continue; }
    // 수업: 가중치 대비 적게 한 것부터
    let best = null, bv = 1e9;
    for (const [id, w] of pol.lessons) {
      if (!Logic.actState(s, ACT[id], cost).ok) continue;
      const v = ((st.done[id] || 0) + rng() * 0.5) / w;
      if (v < bv) { bv = v; best = id; }
    }
    if (!best) { add(bestJob(pol, s, st)); continue; }
    st.done[best] = (st.done[best] || 0) + 1;
    add(best);
  }
  return out.slice(0, 3);
}

function shop(pol, s) {
  for (const id of pol.buy || []) {
    const isAcc = !!ACC_ITEM[id];
    const owned = isAcc ? s.ownedAcc.includes(id) : s.owned.includes(id);
    const item = isAcc ? ACC_ITEM[id] : OUTFIT[id];
    if (owned) continue;
    if (s.gold >= item.price + (pol.shopReserve || 250)) {
      s.gold -= item.price;
      if (isAcc) { s.ownedAcc.push(id); s.wear = id; } else { s.owned.push(id); s.outfit = id; }
    }
    break;  // 순서대로 하나씩
  }
}

function festival(pol, s, log) {
  const y = Logic.yearNo(s);
  const fin = Logic.rivalBase(y) * 1.08;
  const ratio = id => Logic.contestPower(s, id) / fin;
  let pickId = null;
  if (pol.noContest) { Logic.applyFx(s, { stress: -20, sen: 3, aff: 2 }); log.contest.push({ y, id: null }); return; }
  for (const id of pol.contest || []) if (ratio(id) >= 0.8) { pickId = id; break; }
  if (!pickId) {
    let best = null, bv = 0;
    for (const c of CONTESTS) { const r = ratio(c.id); if (r > bv) { bv = r; best = c.id; } }
    if (bv >= 0.95) pickId = best;
  }
  if (!pickId && pol.contest && pol.contest.length && pol.alwaysEnter) pickId = pol.contest[0];
  if (!pickId) { Logic.applyFx(s, { stress: -20, sen: 3, aff: 2 }); log.contest.push({ y, id: null }); return; }
  const r = Logic.runContest(s, pickId);
  log.contest.push({ y, id: pickId, won: r.won, power: r.power, fin: Math.round(fin) });
}

function dadAct(pol, s, rng) {
  if (pol.lowMor) return s.stress >= 60 ? 'money' : 'talk';
  if (pol.scold && s.st.mor < pol.scold) return 'scold';
  if (s.stress >= 60 && s.gold >= Logic.allowance(s) + 200) return 'money';
  const opts = pol.dadOpts || ['talk', 'walk', 'praise'];
  return opts[Math.floor(rng() * opts.length)];
}

function play(pol, seed, opts) {
  opts = opts || {};
  const rng = mulberry32(seed);
  Logic.setRng(rng);
  const s = Logic.newGame('별이', 'brown', opts.meta || {}, 'long');
  const st = { done: {}, jd: {} };
  const log = { lines: 0, events: 0, evIds: [], dad: 0, bdays: 0, contest: [], affAt: {}, goldAt: {}, sickSlots: 0, runawayMonths: 0, monthsPlayed: 0 };
  while (s.m < 96) {
    if (s.runaway) { Logic.resolveRunaway(s); log.runawayMonths++; if (s.m >= 96) break; }
    log.monthsPlayed++;
    if (Logic.isBirthday(s)) {
      const gs = Logic.birthdayGifts(s);
      let g = gs[0], bv = -1e9;
      for (const x of gs) { const v = fxScore(pol, s, x.fx); if (v > bv) { bv = v; g = x; } }
      Logic.applyFx(s, g.fx); Logic.addStat(s, 'aff', 3); log.bdays++;
    }
    if (Logic.isFestival(s)) festival(pol, s, log);
    const ev = Logic.pickEvent(s);
    if (ev) {
      const i = pickChoice(pol, s, ev, rng);
      const r = Logic.chooseEvent(s, ev, i);
      log.events++; log.evIds.push(ev.id);
      log.lines += (ev.lines || []).length + Math.max(1, r.after.length);
    }
    shop(pol, s);
    if (rng() < (pol.dad || 0)) { const r = Logic.dadTime(s, dadAct(pol, s, rng)); log.dad++; log.lines += r.lines.length; }
    const ids = schedule(pol, s, st, rng);
    for (let k = 0; k < 3; k++) s.sched[k] = ids[k];
    for (let k = 0; k < 3; k++) { const r = Logic.runSlot(s, s.sched[k]); if (r.kind === 'sick') log.sickSlots++; }
    Logic.checkTitles(s);
    if (s.m % 12 === 11) { log.affAt[Logic.age(s)] = Math.round(s.aff); log.goldAt[Logic.age(s)] = s.gold; }
    Logic.monthEnd(s);
  }
  Logic.checkTitles(s);
  return { s, ending: Logic.decideEnding(s), log };
}

module.exports = { ctx, play, mulberry32, fxScore };

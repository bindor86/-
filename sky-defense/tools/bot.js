// 하늘 방어대 난이도 측정용 자동 플레이 봇
// node tools/bot.js [skill] [runs]
const fs = require('fs'), path = require('path');
const src = ['data.js', 'engine.js'].map(f => fs.readFileSync(path.join(__dirname, '../src', f), 'utf8')).join('\n');
const G = new Function(src + '\nreturn { Engine, CITIES, ENEMY, UPGRADES, UPG, GROUND, VW, BLD_X, MEGA_COST, MEGA_MAX, repairCost, WAVE_THEME };')();
const { Engine, CITIES, UPG, GROUND } = G;

const SKILLS = {
  // react: 생각 간격(초), err: 조준 오차(px), plan: 무리 노리기, prio: 집 지키기 우선, miss: 엉뚱한 클릭 확률
  // lead: 앞을 노리는 정도, dup: 이미 노린 적을 또 쏘는 확률, see: 한 번에 눈에 들어오는 적 비율
  casual: { react: 1.35, jit: 0.6, err: 28, plan: 0.25, prio: 0.5, lead: 0.65, miss: 0.08, dup: 0.35, see: 0.6 },
  mid:    { react: 1.2, jit: 0.55, err: 24, plan: 0.4, prio: 0.65, lead: 0.75, miss: 0.06, dup: 0.25, see: 0.7 },
  normal: { react: 1.05, jit: 0.5, err: 20, plan: 0.55, prio: 0.8, lead: 0.85, miss: 0.04, dup: 0.15, see: 0.8 },
  good:   { react: 0.75, jit: 0.35, err: 12, plan: 0.9, prio: 1.0, lead: 1.0, miss: 0.01, dup: 0.03, see: 1.0 },
};

// 사람처럼: 지금 움직이는 방향으로 곧게 앞을 어림함
function guess(e, t) {
  const n = e.trail.length;
  if (n < 6) return Engine.predict(e, t);
  const vx = (e.x - e.trail[n - 6]) / 0.135, vy = (e.y - e.trail[n - 5]) / 0.135;
  return [e.x + vx * t, e.y + vy * t];
}

function gauss(rng) { let u = 0, v = 0; while (!u) u = rng(); while (!v) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283 * v); }

function shotTime(W, x, y) {
  let bt = 1e9;
  for (const b of W.bats) bt = Math.min(bt, Math.hypot(x - b.x, y - b.y) / W.shotSpeed + Math.max(0, b.cd));
  return bt;
}

// 이미 날아가는 탄/폭발이 잡을 적은 빼고 생각
function covered(W, e) {
  for (const s of W.shots) {
    const t = Math.hypot(s.tx - s.x, s.ty - s.y) / s.speed;
    const p = Engine.predict(e, t + 0.15);
    const R = s.mega ? 175 : W.R;
    if (Math.hypot(p[0] - s.tx, p[1] - s.ty) < R * 0.85) return true;
  }
  for (const b of W.bats) for (const q of b.q) {
    const t = Math.hypot(q.x - b.x, q.y - b.y) / W.shotSpeed + 0.2;
    const p = Engine.predict(e, t + 0.15);
    if (Math.hypot(p[0] - q.x, p[1] - q.y) < W.R * 0.85) return true;
  }
  for (const b of W.blasts) {
    if (b.kind === 'fx') continue;
    const left = b.g + b.h - b.t;
    if (left <= 0) continue;
    const p = Engine.predict(e, Math.min(left, 0.25));
    if (Math.hypot(p[0] - b.x, p[1] - b.y) < Engine.blastR(b) + 4) return true;
  }
  return false;
}

function think(W, sk, rng) {
  const cands = W.enemies.filter(e => !e.dead && e.y > 20 && rng() < sk.see && (rng() < sk.dup || !covered(W, e)));
  const B = W.boss;
  if (!cands.length) {
    if (B && !B.dead && B.enter >= 1 && B.shieldT <= 0 && W.ammo > 2) {
      const t = shotTime(W, B.x, B.y + 10);
      return [B.x + B.dir * B.def.speed * t * sk.lead, B.y + 8];
    }
    return null;
  }
  // 급한 정도: 집을 노리고 땅에 가까울수록
  let best = null, bv = -1e9;
  for (const e of cands) {
    const t0 = shotTime(W, e.x, e.y);
    const p = guess(e, t0 * sk.lead);
    const t1 = shotTime(W, p[0], p[1]);
    const aim = guess(e, t1 * sk.lead + 0.1);
    const timeLeft = (1 - e.p) * e.len / e.speed;
    const threat = (e.bi >= 0 && W.bld[e.bi].alive ? 1 : 0.35 + 0.65 * (1 - sk.prio));
    let v = threat * (10 / (timeLeft + 1.5));
    // 무리: 같은 폭발에 들어갈 적 수
    if (rng() < sk.plan) {
      let n = 0;
      for (const o of cands) { if (o === e) continue; const q = guess(o, t1 * sk.lead + 0.1); if (Math.hypot(q[0] - aim[0], q[1] - aim[1]) < W.R * 0.8) n++; }
      v *= 1 + n * 0.8;
    }
    if (aim[1] > GROUND - 40) v *= 0.4;
    if (v > bv) { bv = v; best = aim; }
  }
  // 모선 광선 충전 중이면 모선을 우선
  if (B && !B.dead && B.charge > 0 && B.shieldT <= 0 && rng() < sk.plan) {
    const t = shotTime(W, B.x, B.y);
    return [B.x + B.dir * B.def.speed * 0.25 * t, B.y + 6];
  }
  return best;
}

function shop(run, sk) {
  const order = ['radius', 'speed', 'ammo', 'battery', 'chain', 'shield', 'radius', 'ammo', 'speed', 'chain', 'shield', 'radius', 'ammo', 'speed', 'battery', 'radius', 'speed', 'ammo', 'shield', 'chain'];
  let bought = true;
  while (bought) {
    bought = false;
    const alive = run.bld.reduce((a, b) => a + b, 0);
    if (alive <= 5 && Engine.canRepair(run)) { Engine.buyRepair(run); bought = true; continue; }
    for (const id of order) {
      const c = Engine.upCost(run, id);
      if (c != null && run.parts >= c + 60) { Engine.buyUp(run, id); bought = true; break; }
    }
    if (!bought && alive <= 6 && Engine.canRepair(run)) { Engine.buyRepair(run); bought = true; }
    if (!bought && run.megas < 1 && run.parts >= 260) { Engine.buyMega(run); bought = true; }
  }
}

function playWave(run, sk, rng, log) {
  const W = Engine.startWave(run);
  const dt = 1 / 60;
  let nextThink = 1.2, clicks = 0;
  while (!W.over && W.t < 400) {
    if (W.t >= nextThink) {
      nextThink = W.t + sk.react * (1 - sk.jit / 2 + rng() * sk.jit);
      let aim = think(W, sk, rng);
      if (aim && W.ammo > 0) {
        // 메가: 적이 많이 몰렸을 때
        if (W.megas > 0 && W.enemies.length >= 7 && rng() < 0.3) W.megaArmed = true;
        if (rng() < sk.miss) aim = [aim[0] + (rng() - 0.5) * 300, aim[1] + (rng() - 0.5) * 200];
        Engine.fire(W, aim[0] + gauss(rng) * sk.err, aim[1] + gauss(rng) * sk.err);
        clicks++;
      }
    }
    Engine.step(W, dt);
    W.ev.length = 0;
  }
  return { W, clicks };
}

function playGame(skill, seed, verbose) {
  const sk = SKILLS[skill];
  const rng = Engine.rngOf(seed * 7 + 3);
  const run = Engine.newRun(+(process.env.HARD || 0));
  run.seed = seed * 131;
  const out = { fails: 0, failsBy: [0, 0, 0, 0, 0, 0], waves: [], time: 0, clicks: [], stars: [], partsEnd: 0 };
  for (let c = 0; c < 6; c++) {
    Engine.startCity(run, c);
    while (run.stage !== 'clear') {
      shop(run, sk);
      const snap = JSON.stringify(run);
      const { W, clicks } = playWave(run, sk, rng);
      out.time += W.t + 12;   // 정산·상점 시간 어림
      if (W.result === 'fail') {
        out.fails++; out.failsBy[c]++;
        const att = run.attempt + 1;
        Object.assign(run, JSON.parse(snap)); run.attempt = att; run.stats.fails++;
        if (out.fails > 80) return out;
        continue;
      }
      const r = Engine.finishWave(run, W);
      out.clicks.push(clicks);
      out.waves.push({ c, w: W.wave, t: W.t, alive: r.alive, lost: r.lost, ammoLeft: r.ammoLeft, ammo: W.ammoStart, chain: r.chainBest, parts: r.total, kills: r.kills, clicks });
      if (verbose) console.log(`c${c + 1} w${W.wave} ${W.theme.padEnd(6)} t=${W.t.toFixed(0).padStart(3)}s ammo ${String(W.ammoStart).padStart(2)} left ${String(r.ammoLeft).padStart(2)} clicks ${String(clicks).padStart(2)} kills ${String(r.kills).padStart(2)} chain ${r.chainBest} lost ${r.lost} alive ${r.alive} +${r.total} parts=${run.parts} up=${JSON.stringify(run.up)}`);
      if (r.stars) out.stars.push(r.stars);
    }
  }
  out.partsEnd = run.parts; out.up = run.up; out.score = run.score;
  return out;
}

if (require.main === module) {
  const skill = process.argv[2] || 'normal', runs = +(process.argv[3] || 10);
  if (runs === 1) { const o = playGame(skill, 1, true); console.log(o.fails, o.failsBy, (o.time / 60).toFixed(1) + 'min', o.stars, o.up, o.partsEnd); return; }
  const agg = { fails: [], time: [], clicks: [], stars: [], failsBy: [0, 0, 0, 0, 0, 0], waveT: [] };
  for (let s = 1; s <= runs; s++) {
    const o = playGame(skill, s);
    agg.fails.push(o.fails); agg.time.push(o.time / 60); agg.stars.push(o.stars.reduce((a, b) => a + b, 0));
    o.failsBy.forEach((v, i) => agg.failsBy[i] += v);
    agg.clicks.push(...o.clicks); agg.waveT.push(...o.waves.map(w => w.t));
  }
  const avg = a => (a.reduce((x, y) => x + y, 0) / a.length);
  console.log(`${skill}: fails avg ${avg(agg.fails).toFixed(1)} [${agg.fails.join(',')}] byCity ${agg.failsBy.map(v => (v / runs).toFixed(1)).join('/')}`);
  console.log(`  time ${avg(agg.time).toFixed(1)}min, wave ${avg(agg.waveT).toFixed(1)}s, clicks/wave ${avg(agg.clicks).toFixed(1)} (min ${Math.min(...agg.clicks)} max ${Math.max(...agg.clicks)}), stars ${avg(agg.stars).toFixed(1)}/18`);
}
module.exports = { playGame, G };

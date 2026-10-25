// ===== 하늘 방어대 — 게임 규칙 (화면 없이도 돌아가) =====
const Engine = (() => {
  function rngOf(seed) {
    let a = seed >>> 0;
    return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  function newRun(diff) {
    return {
      v: 1, diff: diff ? 1 : 0, city: 0, wave: 1, attempt: 0, stage: 'intro',
      bld: [1, 1, 1, 1, 1, 1, 1, 1],
      up: { radius: 0, speed: 0, ammo: 0, chain: 0, battery: 0, shield: 0 },
      parts: 0, score: 0, megas: 1,
      stars: [0, 0, 0, 0, 0, 0], unlocked: 0, cleared: false,
      cityRun: { score: 0, lost: 0, kills: 0, chain: 0, fails: 0 },
      stats: { kills: 0, fired: 0, bestChain: 0, fails: 0, bosses: 0, time: 0, waves: 0 },
      seed: (Math.random() * 1e9) | 0,
    };
  }

  // ----- 웨이브 계획 -----
  function plan(run) {
    const c = run.city, w = run.wave, theme = WAVE_THEME[w], hard = run.diff;
    const boss = theme === 'boss';
    let count = 10 + (w - 1) * 1.3 + c * 2.2;
    if (theme === 'shower') count *= 1.4;
    if (theme === 'rush') count *= 0.8;
    if (theme === 'storm') count *= 1.3;
    if (boss) count *= 0.35;
    if (hard) count *= 1.3;
    count = Math.round(count);
    let spd = 1 + (w - 1) * 0.04 + c * 0.08;
    if (theme === 'rush') spd *= 1.15;
    if (hard) spd *= 1.28;
    let dur = 16 + w * 0.8 + c * 0.6;
    if (theme === 'shower') dur *= 0.9;
    if (theme === 'rush') dur *= 0.8;
    if (boss) dur = 34 + c * 4;
    return { theme, boss, count, spd, dur };
  }

  function poolFor(run, theme) {
    const city = CITIES[run.city], w = run.wave;
    const pool = Object.assign({}, city.pool);
    const ne = city.newEnemy;
    if (ne && ne !== 'meteor') pool[ne] *= Math.min(1.25, 0.45 + 0.11 * w);
    if (theme === 'shower') { pool.meteor *= 2.6; if (pool.split) pool.split *= 1.4; }
    if (theme === 'rush') { if (pool.bomb) pool.bomb *= 2.4; if (pool.drone) pool.drone *= 1.5; }
    return pool;
  }
  function pickType(pool, rng) {
    let sum = 0; for (const k in pool) sum += pool[k];
    let r = rng() * sum;
    for (const k in pool) { r -= pool[k]; if (r <= 0) return k; }
    return 'meteor';
  }

  function buildQueue(run, P, rng) {
    const q = [], pool = poolFor(run, P.theme);
    const shower = P.theme === 'shower', storm = P.theme === 'storm';
    const avg = shower ? 4 : storm ? 3 : 2.3;
    let left = P.count, t = 2.4;
    const gap = P.dur / Math.max(1, Math.round(P.count / avg));
    let vol = 0;
    while (left > 0) {
      let size;
      if (shower) size = 3 + Math.floor(rng() * 3);
      else if (storm) size = 2 + Math.floor(rng() * 3);
      else size = 1 + Math.floor(rng() * 3) + (rng() < 0.22 ? 1 : 0);
      if (vol === 0) size = Math.min(size, 2);
      size = Math.min(size, left);
      const cx = 90 + rng() * 1100, spread = shower ? 80 : 150;
      const grp = shower ? vol + 1 : 0;
      for (let i = 0; i < size; i++)
        q.push({ t: t + i * (shower ? 0.16 : 0.32) + rng() * 0.25, type: pickType(pool, rng), x: clamp(cx + (rng() - 0.5) * spread, 30, 1250), grp });
      left -= size; vol++;
      t += gap * (size / avg) * (0.7 + rng() * 0.6);
    }
    q.sort((a, b) => a.t - b.t);
    return q;
  }

  // ----- 웨이브 시작 -----
  function startWave(run) {
    const P = plan(run);
    const rng = rngOf(run.seed + run.city * 1013 + run.wave * 97 + run.attempt * 7919);
    const style = CITIES[run.city].style;
    const nb = UPG.battery.val(run.up.battery);
    const W = {
      P, rng, t: 0, city: run.city, wave: run.wave, theme: P.theme, diff: run.diff, spd: P.spd * (1 - Math.min(4, run.attempt) * 0.06), assist: Math.min(4, run.attempt),
      R: UPG.radius.val(run.up.radius), shotSpeed: UPG.speed.val(run.up.speed), chainF: UPG.chain.val(run.up.chain),
      bld: BLD_X.map((x, i) => ({ i, x, w: BLD_W, h: BLD_H[style][i], alive: !!run.bld[i], targeted: 0, hitT: 0 })),
      bats: BAT_POS.slice(0, nb).map(p => ({ x: p.x, y: p.y, cd: 0, q: [], fireT: 0 })),
      shields: UPG.shield.val(run.up.shield) + Math.min(2, run.attempt), shieldMax: UPG.shield.val(run.up.shield) + Math.min(2, run.attempt),
      queue: buildQueue(run, P, rng), qi: 0, grpTarget: {},
      enemies: [], shots: [], blasts: [], groups: {}, ev: [],
      ammo: 0, ammoStart: 0, megas: run.megas, megaUsed: 0, megaArmed: false,
      kills: 0, chainBest: 0, fired: 0, lost: 0, score: 0, nid: 1,
      boss: null, resupT: 0, over: false, result: null, failT: -1, winT: -1,
    };
    const ratio = (P.theme === 'shower' ? 0.6 : 0.72) - run.city * 0.025 - run.diff * 0.06;
    const att = Math.min(4, run.attempt);
    let ammo = Math.ceil(P.count * ratio) + 2 + UPG.ammo.val(run.up.ammo) + (nb - 1) + att * 4;
    if (P.theme === 'storm') ammo += 3;
    if (P.boss) {
      const d = CITIES[run.city].boss;
      const hp = Math.round(d.hp * (run.diff ? 1.25 : 1) * (1 - att * 0.12));
      ammo += Math.ceil(hp * 0.9) + 2;
      W.boss = {
        def: d, x: 640, y: -140, baseY: 150, w: d.w, h: d.h, hp, maxHp: hp, dir: rng() < 0.5 ? -1 : 1,
        enter: 0, t: 0, dropT: 4, shieldT: 0, shieldCd: d.shield ? d.shield * 0.6 : 0,
        charge: 0, chargeCd: d.charge ? d.charge * 0.65 : 0, chargeHits: 0, chargeBi: -1,
        stun: 0, flash: 0, enraged: false, dead: false, deathT: 0, fxT: 0,
      };
      W.ev.push({ k: 'bossEnter' });
    }
    W.ammo = W.ammoStart = ammo;
    return W;
  }

  // ----- 목표 고르기 -----
  function pickTarget(W, grp) {
    const alive = W.bld.filter(b => b.alive);
    if (grp && W.grpTarget[grp] != null) {
      const b = W.bld[W.grpTarget[grp]];
      const near = alive.filter(o => Math.abs(o.i - b.i) <= 1);
      if (near.length) { const o = near[(W.rng() * near.length) | 0]; o.targeted++; return { x: o.x + (W.rng() - 0.5) * o.w * 0.5, y: GROUND - o.h + 6, bi: o.i }; }
    }
    if (alive.length && W.rng() < 0.8) {
      let best = null, bv = 1e9;
      for (const b of alive) { const v = b.targeted + W.rng() * 1.6; if (v < bv) { bv = v; best = b; } }
      best.targeted++;
      if (grp) W.grpTarget[grp] = best.i;
      return { x: best.x + (W.rng() - 0.5) * best.w * 0.5, y: GROUND - best.h + 6, bi: best.i };
    }
    return { x: 50 + W.rng() * 1180, y: GROUND + 4, bi: -1 };
  }

  function spawnEnemy(W, type, x, y, grp, speedMul) {
    const d = ENEMY[type], tg = pickTarget(W, grp);
    const e = {
      id: W.nid++, type, x, y, sx: x, sy: y, tx: tg.x, ty: tg.y, bi: tg.bi, p: 0,
      len: Math.max(1, Math.hypot(tg.x - x, tg.y - y)),
      speed: d.speed * W.spd * (0.92 + W.rng() * 0.16) * (speedMul || 1),
      r: d.r, hp: d.hp, maxHp: d.hp, age: 0, ph: W.rng() * 6.283, trail: [], tt: 0, dead: false, hitT: 0,
    };
    if (type === 'split') e.splitY = 230 + W.rng() * 110;
    if (type === 'drone') { e.amp = 50 + W.rng() * 35; e.freq = 0.45 + W.rng() * 0.25; }
    W.enemies.push(e);
    return e;
  }

  // 적 위치 (예측에도 씀)
  function enemyPos(e, p, age) {
    let x = e.sx + (e.tx - e.sx) * p, y = e.sy + (e.ty - e.sy) * p;
    if (e.type === 'drone') {
      const env = Math.min(1, p * 7, (1 - p) * 2.6);
      x += Math.sin(e.ph + age * e.freq * 6.283) * e.amp * Math.max(0, env);
      x = clamp(x, 16, VW - 16);
    }
    return [x, y];
  }
  function predict(e, dt) {
    const p = Math.min(1, e.p + e.speed * dt / e.len);
    return enemyPos(e, p, e.age + dt);
  }

  // ----- 발사 -----
  function fire(W, x, y) {
    if (W.over || W.failT >= 0) return false;
    x = clamp(x, 8, VW - 8); y = clamp(y, 14, GROUND - 34);
    const mega = W.megaArmed && W.megas > 0;
    W.megaArmed = false;
    if (!mega && W.ammo <= 0) { W.ev.push({ k: 'empty' }); return false; }
    let best = null, bt = 1e9;
    for (const b of W.bats) {
      const t = Math.max(0, b.cd) + b.q.length * 0.2 + Math.hypot(x - b.x, y - b.y) / W.shotSpeed;
      if (t < bt) { bt = t; best = b; }
    }
    if (best.q.length >= 3) return false;
    if (mega) { W.megas--; W.megaUsed++; } else W.ammo--;
    W.fired++;
    best.q.push({ x, y, mega });
    return true;
  }
  function launch(W, b, s) {
    b.cd = 0.2; b.fireT = 0.25;
    W.shots.push({ id: W.nid++, bx: b.x, by: b.y, x: b.x, y: b.y, tx: s.x, ty: s.y, speed: W.shotSpeed * (s.mega ? 0.85 : 1), mega: s.mega });
    W.ev.push({ k: 'fire', x: b.x, y: b.y, tx: s.x, ty: s.y, mega: s.mega });
  }

  // ----- 폭발 -----
  function addBlast(W, x, y, R, depth, root, kind) {
    const T = kind === 'mega' ? [0.34, 0.65, 0.45] : kind === 'shot' ? [0.22, 0.38, 0.32] : kind === 'fx' ? [0.2, 0.25, 0.35] : [0.18, 0.3, 0.28];
    const b = { id: W.nid++, x, y, R, t: 0, g: T[0], h: T[1], f: T[2], depth, root, kind, hit: new Set(), hitBoss: kind === 'fx' };
    W.blasts.push(b);
    W.ev.push({ k: 'boom', x, y, R, depth, kind });
    return b;
  }
  function blastR(b) {
    if (b.t < b.g) { const u = b.t / b.g; return b.R * (1 - (1 - u) * (1 - u)); }
    if (b.t < b.g + b.h) return b.R;
    return b.R * Math.max(0, 1 - (b.t - b.g - b.h) / b.f);
  }

  function kill(W, e, b) {
    e.dead = true;
    if (e.bi >= 0) W.bld[e.bi].targeted--;
    const d = ENEMY[e.type];
    if (!b) { W.score += d.pts; W.kills++; W.ev.push({ k: 'kill', x: e.x, y: e.y, type: e.type, n: 1, pts: d.pts, quiet: true }); return; }
    const g = W.groups[b.root] || (W.groups[b.root] = { n: 0 });
    g.n++;
    const pts = Math.round(d.pts * Math.min(g.n, 8) * (W.diff ? 1.5 : 1));
    W.score += pts; W.kills++;
    if (g.n > W.chainBest) W.chainBest = g.n;
    W.ev.push({ k: 'kill', x: e.x, y: e.y, type: e.type, n: g.n, pts });
    addBlast(W, e.x, e.y, W.R * W.chainF * d.chain, b.depth + 1, b.root, 'chain');
  }

  function damage(W, e, b) {
    e.hp -= b.kind === 'mega' ? 3 : 1;
    if (e.hp <= 0) kill(W, e, b);
    else { e.hitT = 0.5; W.ev.push({ k: 'armor', x: e.x, y: e.y }); }
  }

  function impact(W, e) {
    e.dead = true;
    if (e.bi >= 0) {
      const b = W.bld[e.bi];
      b.targeted--;
      if (b.alive) {
        if (W.shields > 0) { W.shields--; W.ev.push({ k: 'impact', x: e.x, y: e.y, bi: b.i, shield: true }); return; }
        b.alive = false; b.hitT = 1; W.lost++;
        W.ev.push({ k: 'impact', x: e.x, y: e.y, bi: b.i, hit: true });
        return;
      }
    }
    W.ev.push({ k: 'impact', x: e.x, y: e.y, bi: -1 });
  }

  function split(W, e) {
    e.dead = true;
    if (e.bi >= 0) W.bld[e.bi].targeted--;
    W.ev.push({ k: 'split', x: e.x, y: e.y });
    for (let i = 0; i < 3; i++) {
      const c = spawnEnemy(W, 'meteor', e.x, e.y, 0, 1.08);
      c.speed = Math.max(c.speed, e.speed * 1.05);
    }
  }

  function hitsBoss(B, x, y, r) {
    const ax = B.w / 2 + r * 0.75, ay = B.h / 2 + r * 0.75;
    const dx = (x - B.x) / ax, dy = (y - B.y) / ay;
    return dx * dx + dy * dy < 1;
  }

  // ----- 모선 -----
  function stepBoss(W, dt) {
    const B = W.boss, d = B.def;
    B.t += dt; if (B.flash > 0) B.flash -= dt;
    if (B.dead) {
      B.deathT += dt; B.fxT -= dt;
      if (B.fxT <= 0 && B.deathT < 2.2) {
        B.fxT = 0.16;
        addBlast(W, B.x + (W.rng() - 0.5) * B.w * 0.9, B.y + (W.rng() - 0.5) * B.h, 40 + W.rng() * 50, 0, 0, 'fx');
      }
      return;
    }
    if (B.enter < 1) {
      B.enter = Math.min(1, B.enter + dt / 2.6);
      const u = 1 - Math.pow(1 - B.enter, 3);
      B.y = -140 + (B.baseY + 140) * u;
      return;
    }
    const sp = B.def.speed * (B.enraged ? 1.3 : 1) * (B.charge > 0 ? 0.25 : 1) * (W.diff ? 1.1 : 1);
    B.x += B.dir * sp * dt;
    const m = B.w / 2 + 30;
    if (B.x > VW - m) { B.x = VW - m; B.dir = -1; }
    if (B.x < m) { B.x = m; B.dir = 1; }
    B.y = B.baseY + Math.sin(B.t * 1.2) * 9;
    if (B.stun > 0) { B.stun -= dt; return; }
    // 방어막
    if (d.shield) {
      if (B.shieldT > 0) B.shieldT -= dt;
      else if (B.charge <= 0) { B.shieldCd -= dt; if (B.shieldCd <= 0) { B.shieldT = 2.6; B.shieldCd = d.shield * (B.enraged ? 0.8 : 1); W.ev.push({ k: 'bossShield' }); } }
    }
    // 광선 충전
    if (d.charge) {
      if (B.charge > 0) {
        B.charge -= dt;
        if (B.chargeHits >= 2) {
          B.charge = 0; B.stun = 1.8; B.chargeCd = d.charge;
          W.score += 300; W.ev.push({ k: 'chargeCancel', x: B.x, y: B.y });
        } else if (B.charge <= 0) {
          B.chargeCd = d.charge * (B.enraged ? 0.85 : 1);
          const b = W.bld[B.chargeBi];
          if (b && b.alive) {
            if (W.shields > 0) { W.shields--; W.ev.push({ k: 'beam', bi: b.i, shield: true }); }
            else { b.alive = false; b.hitT = 1; W.lost++; W.ev.push({ k: 'beam', bi: b.i, hit: true }); }
          } else W.ev.push({ k: 'beam', bi: B.chargeBi });
        }
      } else if (B.shieldT <= 0) {
        B.chargeCd -= dt;
        if (B.chargeCd <= 0) {
          const alive = W.bld.filter(b => b.alive);
          if (alive.length) {
            alive.sort((a, b) => Math.abs(a.x - B.x) - Math.abs(b.x - B.x));
            const pick = alive[Math.min(alive.length - 1, (W.rng() * 2) | 0)];
            B.charge = 3.8; B.chargeHits = 0; B.chargeBi = pick.i;
            W.ev.push({ k: 'charge', bi: pick.i });
          } else B.chargeCd = 3;
        }
      }
    }
    // 폭탄 떨구기
    if (B.charge <= 0) {
      B.dropT -= dt;
      if (B.dropT <= 0) {
        B.dropT = d.every * (B.enraged ? 0.72 : 1) * (W.diff ? 0.88 : 1);
        const n = d.n[0] + Math.floor(W.rng() * (d.n[1] - d.n[0] + 1)) + (B.enraged && W.rng() < 0.4 ? 1 : 0);
        for (let i = 0; i < n; i++) {
          const type = d.drops[(W.rng() * d.drops.length) | 0];
          spawnEnemy(W, type, B.x + (W.rng() - 0.5) * B.w * 0.55, B.y + B.h * 0.35, 0);
        }
        W.ev.push({ k: 'bossDrop', x: B.x, y: B.y + B.h * 0.4, n });
      }
    }
  }

  function bossHit(W, B, b) {
    b.hitBoss = true;
    if (B.dead || B.enter < 1) return;
    if (B.shieldT > 0) { W.ev.push({ k: 'bossBlock', x: b.x, y: b.y }); return; }
    const dmg = b.kind === 'mega' ? 3 : 1;
    B.hp -= dmg; B.flash = 0.18;
    if (B.charge > 0) B.chargeHits += dmg;
    W.score += 50 * dmg;
    W.ev.push({ k: 'bossHit', x: b.x, y: b.y, dmg });
    if (!B.enraged && B.hp <= B.maxHp / 2 && B.hp > 0) { B.enraged = true; W.ev.push({ k: 'enrage' }); }
    if (B.hp <= 0) {
      B.hp = 0; B.dead = true; B.charge = 0; B.shieldT = 0;
      W.score += 1500 + W.city * 500;
      W.ev.push({ k: 'bossDie', x: B.x, y: B.y });
      for (const e of W.enemies) if (!e.dead) { kill(W, e, null); addBlast(W, e.x, e.y, 34, 1, 0, 'fx'); }
    }
  }

  // ----- 한 걸음 -----
  function step(W, dt) {
    if (W.over) return;
    W.t += dt;
    const B = W.boss;
    // 등장
    const spawning = W.failT < 0 && !(B && B.dead);
    while (spawning && W.qi < W.queue.length && W.queue[W.qi].t <= W.t) {
      const q = W.queue[W.qi++];
      spawnEnemy(W, q.type, q.x, -18, q.grp);
    }
    // 포대
    for (const b of W.bats) {
      if (b.cd > 0) b.cd -= dt;
      if (b.fireT > 0) b.fireT -= dt;
      if (b.cd <= 0 && b.q.length) launch(W, b, b.q.shift());
    }
    // 요격탄
    for (const s of W.shots) {
      const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy), mv = s.speed * dt;
      if (d <= mv) { s.done = true; addBlast(W, s.tx, s.ty, s.mega ? MEGA_R : W.R, 0, s.id, s.mega ? 'mega' : 'shot'); }
      else { s.x += dx / d * mv; s.y += dy / d * mv; }
    }
    // 적
    for (const e of W.enemies) {
      if (e.dead) continue;
      e.age += dt; if (e.hitT > 0) e.hitT -= dt;
      e.p += e.speed * dt / e.len;
      if (e.p >= 1) { e.p = 1; const pp = enemyPos(e, 1, e.age); e.x = pp[0]; e.y = pp[1]; impact(W, e); continue; }
      const pp = enemyPos(e, e.p, e.age); e.x = pp[0]; e.y = pp[1];
      e.tt += dt; if (e.tt > 0.045) { e.tt = 0; e.trail.push(e.x, e.y); if (e.trail.length > 32) e.trail.splice(0, 2); }
      if (e.type === 'split' && e.y >= e.splitY) split(W, e);
    }
    // 폭발
    for (const b of W.blasts) {
      b.t += dt;
      if (b.kind === 'fx') continue;
      const r = blastR(b);
      if (r <= 1) continue;
      for (const e of W.enemies) {
        if (e.dead || b.hit.has(e.id)) continue;
        const dx = e.x - b.x, dy = e.y - b.y, rr = r + e.r * 0.6;
        if (dx * dx + dy * dy < rr * rr) { b.hit.add(e.id); damage(W, e, b); }
      }
      if (B && !b.hitBoss && hitsBoss(B, b.x, b.y, r)) bossHit(W, B, b);
    }
    if (B) stepBoss(W, dt);
    // 보급 (모선전)
    if (B && !B.dead) {
      W.resupT += dt;
      if (W.resupT >= 7 && W.ammo < 5) { W.resupT = 0; W.ammo += 5; W.ev.push({ k: 'resupply', n: 5 }); }
    }
    for (const b of W.bld) if (b.hitT > 0) b.hitT -= dt;
    // 정리
    if (W.enemies.some(e => e.dead)) W.enemies = W.enemies.filter(e => !e.dead);
    if (W.shots.some(s => s.done)) W.shots = W.shots.filter(s => !s.done);
    if (W.blasts.some(b => b.t >= b.g + b.h + b.f)) W.blasts = W.blasts.filter(b => b.t < b.g + b.h + b.f);
    // 끝?
    if (W.failT >= 0) { W.failT -= dt; if (W.failT < 0) { W.over = true; W.result = 'fail'; } return; }
    if (!W.bld.some(b => b.alive)) { W.failT = 2.0; W.ev.push({ k: 'fall' }); return; }
    if (W.winT >= 0) { W.winT -= dt; if (W.winT < 0) { W.over = true; W.result = 'win'; } return; }
    const pendingShots = W.bats.some(b => b.q.length);
    if (B) {
      if (B.dead && B.deathT >= 2.4) { W.winT = 0.6; W.ev.push({ k: 'win' }); }
    } else if (W.qi >= W.queue.length && !W.enemies.length && !W.shots.length && !pendingShots && !W.blasts.length) {
      W.winT = 1.5; W.ev.push({ k: 'win' });
    }
  }

  // ----- 웨이브 끝 정산 -----
  function finishWave(run, W) {
    const alive = W.bld.filter(b => b.alive).length;
    const parts = {
      bld: alive * 10,
      ammo: W.ammo * 2,
      kill: W.kills,
      chain: W.chainBest >= 3 ? W.chainBest * 10 : 0,
      perfect: W.lost === 0 ? 30 : 0,
      boss: W.boss ? 200 + W.city * 40 : 0,
    };
    const total = Object.values(parts).reduce((a, b) => a + b, 0);
    const bonusScore = alive * 100 + W.ammo * 20;
    const r = { alive, lost: W.lost, kills: W.kills, chainBest: W.chainBest, ammoLeft: W.ammo, fired: W.fired, parts, total, waveScore: W.score, bonusScore, boss: !!W.boss };
    run.parts += total;
    run.score += W.score + bonusScore;
    run.megas = W.megas;
    run.bld = W.bld.map(b => b.alive ? 1 : 0);
    const cr = run.cityRun;
    cr.score += W.score + bonusScore; cr.lost += W.lost; cr.kills += W.kills; cr.chain = Math.max(cr.chain, W.chainBest);
    const st = run.stats;
    st.kills += W.kills; st.fired += W.fired; st.bestChain = Math.max(st.bestChain, W.chainBest); st.waves++;
    run.attempt = 0;
    if (W.boss) {
      st.bosses++;
      const stars = alive >= 7 ? 3 : alive >= 4 ? 2 : 1;
      r.stars = stars; r.newBest = stars > run.stars[run.city];
      run.stars[run.city] = Math.max(run.stars[run.city], stars);
      r.clearBonus = 150 + run.city * 50;
      run.parts += r.clearBonus;
      r.firstClear = run.unlocked <= run.city;
      run.unlocked = Math.max(run.unlocked, Math.min(6, run.city + 1));
      r.cityRun = Object.assign({}, cr);
      if (run.city === 5 && !run.cleared) { run.cleared = true; r.ending = true; }
      run.stage = 'clear';
    } else {
      run.wave++;
      run.stage = 'prep';
      // 4·7웨이브 전에 시민들이 건물 하나를 다시 지어 줌
      if ((run.wave === 4 || run.wave === 7) && run.bld.some(v => !v)) {
        let bi = -1, bd = 1e9;
        run.bld.forEach((v, i) => { if (!v) { const d = Math.abs(BLD_X[i] - 640); if (d < bd) { bd = d; bi = i; } } });
        run.bld[bi] = 1; r.rebuilt = bi;
      }
    }
    return r;
  }

  function startCity(run, c) {
    run.city = c; run.wave = 1; run.attempt = 0; run.bld = [1, 1, 1, 1, 1, 1, 1, 1];
    run.cityRun = { score: 0, lost: 0, kills: 0, chain: 0, fails: 0 };
    run.stage = 'intro';
  }

  // ----- 상점 -----
  function upCost(run, id) { const u = UPG[id], lv = run.up[id]; return lv < u.costs.length ? u.costs[lv] : null; }
  function buyUp(run, id) {
    const c = upCost(run, id);
    if (c == null || run.parts < c) return false;
    run.parts -= c; run.up[id]++; return true;
  }
  function canRepair(run) { return run.bld.some(v => !v) && run.parts >= repairCost(run.city); }
  function buyRepair(run) {
    if (!canRepair(run)) return -1;
    // 가운데에 가까운 무너진 건물부터
    let bi = -1, bd = 1e9;
    run.bld.forEach((v, i) => { if (!v) { const d = Math.abs(BLD_X[i] - 640); if (d < bd) { bd = d; bi = i; } } });
    run.parts -= repairCost(run.city); run.bld[bi] = 1; return bi;
  }
  function buyMega(run) {
    if (run.megas >= MEGA_MAX || run.parts < MEGA_COST) return false;
    run.parts -= MEGA_COST; run.megas++; return true;
  }

  return { rngOf, newRun, plan, startWave, step, fire, finishWave, startCity, upCost, buyUp, canRepair, buyRepair, buyMega, blastR, enemyPos, predict, hitsBoss };
})();

// ===== 하늘 방어대 — 그리기 (캔버스) =====
const Render = (() => {
  let cv, ctx, k = 1, bg = {}, T = 0;
  const parts = [], texts = [], beams = [];
  let shakeA = 0, sx = 0, sy = 0, banner = null, flashA = 0, flashCol = '#fff';
  const FONT = '"Jua", "Gowun Dodum", sans-serif';
  const opt = { shake: true, lines: true };

  function init(canvas) { cv = canvas; ctx = cv.getContext('2d'); }
  function resize(scale) {
    const nk = Math.max(1, Math.min(2, scale * (window.devicePixelRatio || 1)));
    if (Math.abs(nk - k) < 0.01 && cv.width === Math.round(VW * nk)) return;
    k = nk; cv.width = Math.round(VW * k); cv.height = Math.round(VH * k); bg = {};
  }

  // ----- 도시 풍경 -----
  const THEME = {
    village: { sky: [[0, '#070b2a'], [0.55, '#232a66'], [1, '#6b4f93']], stars: 220, ground: ['#26402c', '#1b2e20'], edge: '#3d6b42' },
    harbor:  { sky: [[0, '#25174a'], [0.45, '#8d3e6e'], [0.8, '#e7845a'], [1, '#f6b86a']], stars: 60, ground: ['#5a4136', '#3e2c25'], edge: '#7a5a48' },
    oasis:   { sky: [[0, '#141c48'], [0.5, '#4d3f86'], [0.85, '#d9895f'], [1, '#f0b77a']], stars: 120, ground: ['#c99a5e', '#a8783f'], edge: '#e2b97a' },
    snow:    { sky: [[0, '#050d22'], [0.55, '#183563'], [1, '#5f86b3']], stars: 200, ground: ['#dfe8f4', '#b9c9de'], edge: '#ffffff' },
    crystal: { sky: [[0, '#070618'], [0.5, '#22164a'], [1, '#2f5c80']], stars: 240, ground: ['#2b2446', '#1c1730'], edge: '#5a4a8e' },
    capital: { sky: [[0, '#0e0614'], [0.5, '#3a0f2e'], [1, '#8f3a3d']], stars: 140, ground: ['#3b3343', '#2a2430'], edge: '#5a4f62' },
  };

  function ridge(g, base, amp, step, col, r, smooth) {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, GROUND + 2);
    let y = base;
    for (let x = 0; x <= VW + step; x += step) {
      y = base - r() * amp;
      if (smooth) g.quadraticCurveTo(x - step / 2, y - amp * 0.3, x, y); else g.lineTo(x, y);
    }
    g.lineTo(VW, GROUND + 2); g.closePath(); g.fill();
  }

  function makeBg(style) {
    const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height;
    const g = c.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0);
    const th = THEME[style], r = Engine.rngOf(style.length * 7919 + style.charCodeAt(0));
    const sky = g.createLinearGradient(0, 0, 0, GROUND);
    th.sky.forEach(([o, col]) => sky.addColorStop(o, col));
    g.fillStyle = sky; g.fillRect(0, 0, VW, GROUND);
    for (let i = 0; i < th.stars; i++) {
      g.globalAlpha = 0.25 + r() * 0.75; g.fillStyle = r() < 0.15 ? '#ffe9b0' : '#ffffff';
      const s = r() < 0.08 ? 2.2 : 1.2; g.fillRect(r() * VW, r() * GROUND * 0.7, s, s);
    }
    g.globalAlpha = 1;
    if (style === 'village') {
      moon(g, 1060, 150, 46, '#fff6d8');
      ridge(g, 560, 50, 80, '#1b2152', r, true);
      ridge(g, 600, 30, 60, '#20284f', r, true);
      // 풍차
      g.fillStyle = '#161b40'; g.fillRect(118, 520, 16, 70);
      g.save(); g.translate(126, 520); g.strokeStyle = '#161b40'; g.lineWidth = 6;
      for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 46); g.stroke(); }
      g.restore();
    } else if (style === 'harbor') {
      const sun = g.createRadialGradient(300, 560, 10, 300, 560, 160);
      sun.addColorStop(0, 'rgba(255,230,160,1)'); sun.addColorStop(0.35, 'rgba(255,170,90,0.9)'); sun.addColorStop(1, 'rgba(255,120,80,0)');
      g.fillStyle = sun; g.fillRect(100, 380, 400, 260);
      g.fillStyle = '#ffdca0'; g.beginPath(); g.arc(300, 566, 62, Math.PI, 0); g.fill();
      // 바다
      const sea = g.createLinearGradient(0, 566, 0, GROUND);
      sea.addColorStop(0, '#5a3a6a'); sea.addColorStop(1, '#2a2348');
      g.fillStyle = sea; g.fillRect(0, 566, VW, GROUND - 566);
      g.fillStyle = 'rgba(255,210,150,0.3)';
      for (let i = 0; i < 18; i++) { const w = 16 + r() * 40 * (1 - i / 20); g.fillRect(300 - w / 2 + (r() - 0.5) * 50, 572 + i * 3.4, w, 1.4); }
      // 먼 배
      g.fillStyle = '#2b1d3a';
      g.beginPath(); g.moveTo(860, 566); g.lineTo(940, 566); g.lineTo(928, 576); g.lineTo(870, 576); g.fill();
      g.fillRect(896, 530, 3, 36); g.beginPath(); g.moveTo(899, 532); g.lineTo(926, 560); g.lineTo(899, 560); g.fill();
    } else if (style === 'oasis') {
      moon(g, 1000, 130, 34, '#fff1d0');
      ridge(g, 580, 40, 140, '#9a5f55', r, true);
      ridge(g, 610, 26, 110, '#b9784f', r, true);
      // 야자수
      [[90, 600], [1200, 596], [640, 612]].forEach(([x, y]) => palm(g, x, y));
    } else if (style === 'snow') {
      moon(g, 220, 130, 40, '#eaf4ff');
      peaks(g, 560, 170, 6, 11, '#3b5b8a', '#e8f1fb');
      peaks(g, 605, 90, 9, 23, '#28446e', '#9fb8d8');
    } else if (style === 'crystal') {
      for (let i = 0; i < 16; i++) {
        const x = r() * VW, h = 60 + r() * 120, w = 14 + r() * 26;
        const cg = g.createLinearGradient(x, GROUND - h, x, GROUND);
        cg.addColorStop(0, 'rgba(160,120,255,0.55)'); cg.addColorStop(1, 'rgba(60,40,120,0.2)');
        g.fillStyle = cg; g.beginPath(); g.moveTo(x - w / 2, GROUND); g.lineTo(x, GROUND - h); g.lineTo(x + w / 2, GROUND); g.fill();
      }
    } else if (style === 'capital') {
      const m = g.createRadialGradient(1050, 150, 10, 1050, 150, 120);
      m.addColorStop(0, 'rgba(255,140,120,0.9)'); m.addColorStop(0.4, 'rgba(220,70,70,0.5)'); m.addColorStop(1, 'rgba(160,40,60,0)');
      g.fillStyle = m; g.fillRect(900, 0, 300, 300);
      g.fillStyle = '#ffb3a0'; g.beginPath(); g.arc(1050, 150, 40, 0, 6.283); g.fill();
      // 먼 성
      g.fillStyle = '#2a1028';
      g.fillRect(560, 470, 160, 140);
      for (let i = 0; i < 5; i++) g.fillRect(560 + i * 36, 455, 18, 16);
      g.fillRect(520, 430, 40, 180); g.fillRect(720, 430, 40, 180);
      tri(g, 516, 430, 564, 430, 540, 380); tri(g, 716, 430, 764, 430, 740, 380);
      g.fillRect(615, 380, 50, 90); tri(g, 610, 380, 670, 380, 640, 320);
      ridge(g, 600, 20, 90, '#231226', r, true);
    }
    // 땅
    const gr = g.createLinearGradient(0, GROUND, 0, VH);
    gr.addColorStop(0, th.ground[0]); gr.addColorStop(1, th.ground[1]);
    g.fillStyle = gr; g.fillRect(0, GROUND, VW, VH - GROUND);
    g.fillStyle = th.edge; g.fillRect(0, GROUND, VW, 3);
    if (style === 'capital') { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1; for (let x = 0; x < VW; x += 26) { g.beginPath(); g.moveTo(x + (x % 52 ? 13 : 0), GROUND + 3); g.lineTo(x, VH); g.stroke(); } }
    return c;
  }
  function moon(g, x, y, r, col) {
    const h = g.createRadialGradient(x, y, r * 0.6, x, y, r * 2.6);
    h.addColorStop(0, 'rgba(255,250,220,0.35)'); h.addColorStop(1, 'rgba(255,250,220,0)');
    g.fillStyle = h; g.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
    g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.08)';
    [[-0.3, -0.2, 0.22], [0.25, 0.15, 0.16], [-0.05, 0.4, 0.12]].forEach(([a, b, c]) => { g.beginPath(); g.arc(x + a * r, y + b * r, c * r, 0, 6.283); g.fill(); });
  }
  function tri(g, x1, y1, x2, y2, x3, y3) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3); g.closePath(); g.fill(); }
  function peaks(g, base, amp, n, seed, body, cap) {
    const rr = Engine.rngOf(seed), step = VW / n;
    for (let i = -1; i <= n; i++) {
      const x = i * step + rr() * step * 0.5, h = amp * (0.5 + rr() * 0.5), top = base - h, hw = step * 0.45 + 30;
      g.fillStyle = body; tri(g, x - hw, GROUND, x + hw, GROUND, x, top);
      if (cap) { const d = (GROUND - top) * 0.22, f = d / (GROUND - top); g.fillStyle = cap; tri(g, x - hw * f, top + d, x + hw * f, top + d, x, top); }
    }
  }
  function palm(g, x, y) {
    g.strokeStyle = '#3b2a2a'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 10, y - 40, x + 4, y - 74); g.stroke();
    g.fillStyle = '#2f4a3a';
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.55;
      g.save(); g.translate(x + 4, y - 74); g.rotate(a); g.beginPath(); g.ellipse(26, 0, 28, 7, 0.25, 0, 6.283); g.fill(); g.restore();
    }
  }

  // ----- 건물 -----
  const BCOL = {
    village: { body: ['#c98b5a', '#d9b98a', '#b07650', '#e0c39a'], roof: ['#8b2f35', '#5a3b6b', '#7a4a2a'], win: '#ffd76a' },
    harbor:  { body: ['#3f7d86', '#d8c7a0', '#4f6b8f', '#c9805a'], roof: ['#2a3e55', '#6b3b3b', '#36554a'], win: '#ffe08a' },
    oasis:   { body: ['#e3b57c', '#d6a066', '#efc794', '#cf9a62'], roof: ['#3a8a9a', '#2f6f8f', '#4aa0a0'], win: '#ffe7a0' },
    snow:    { body: ['#8a96b0', '#7a86a3', '#9aa6bf', '#6f7c99'], roof: ['#3b5ea8', '#2f4f8f', '#4a6fb8'], win: '#ffd68a' },
    crystal: { body: ['#5a8ee8', '#9a6be8', '#4fc4d8', '#c86bd8'], roof: ['#bfe6ff', '#efc6ff', '#c6fff6'], win: '#ffffff' },
    capital: { body: ['#d8d0c4', '#c9bfb2', '#e6dfd4', '#bfb4a6'], roof: ['#2f4fa8', '#27408f', '#3a5fc0'], win: '#ffd76a' },
  };
  function drawBuilding(b, style, t) {
    const x = b.x - b.w / 2, h = b.h, y = GROUND - h, C = BCOL[style], i = b.i;
    if (!b.alive) {
      ctx.fillStyle = '#2a2326';
      ctx.beginPath(); ctx.moveTo(x + 2, GROUND); ctx.lineTo(x + 10, GROUND - 14); ctx.lineTo(x + 22, GROUND - 9); ctx.lineTo(x + 33, GROUND - 22);
      ctx.lineTo(x + 45, GROUND - 12); ctx.lineTo(x + 56, GROUND - 17); ctx.lineTo(x + b.w - 2, GROUND); ctx.fill();
      ctx.fillStyle = 'rgba(255,120,40,' + (0.35 + 0.25 * Math.sin(t * 5 + i)) + ')';
      ctx.fillRect(x + 20, GROUND - 6, 4, 3); ctx.fillRect(x + 40, GROUND - 8, 3, 3);
      if (Math.random() < 0.05) addPart({ x: b.x + (Math.random() - 0.5) * 40, y: GROUND - 12, vx: (Math.random() - 0.5) * 8, vy: -18 - Math.random() * 14, life: 2.4, size: 8 + Math.random() * 8, col: 'rgba(70,64,70,', type: 'smoke' });
      return;
    }
    const body = C.body[i % C.body.length], roof = C.roof[i % C.roof.length];
    ctx.save();
    if (b.hitT > 0) ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 40);
    if (style === 'crystal') {
      const g = ctx.createLinearGradient(x, y, x + b.w, GROUND);
      g.addColorStop(0, roof); g.addColorStop(0.5, body); g.addColorStop(1, '#2a2050');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x + 6, GROUND); ctx.lineTo(x + 2, y + h * 0.3); ctx.lineTo(b.x, y - 10); ctx.lineTo(x + b.w - 2, y + h * 0.3); ctx.lineTo(x + b.w - 6, GROUND); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,' + (0.35 + 0.2 * Math.sin(t * 2 + i)) + ')';
      ctx.beginPath(); ctx.moveTo(b.x, y - 6); ctx.lineTo(b.x + 6, y + h * 0.35); ctx.lineTo(b.x, y + h * 0.75); ctx.lineTo(b.x - 4, y + h * 0.35); ctx.fill();
      ctx.restore(); return;
    }
    // 몸통
    ctx.fillStyle = body; ctx.fillRect(x + 4, y, b.w - 8, h);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + b.w / 2, y, b.w / 2 - 4, h);
    // 지붕
    ctx.fillStyle = roof;
    if (style === 'village') {
      if (h > 80) { ctx.fillRect(b.x - 9, y - 30, 18, 30); tri(ctx, b.x - 13, y - 30, b.x + 13, y - 30, b.x, y - 58); ctx.fillStyle = '#ffd76a'; ctx.fillRect(b.x - 1, y - 72, 2, 14); ctx.fillRect(b.x - 5, y - 67, 10, 2); }
      else tri(ctx, x, y + 2, x + b.w, y + 2, b.x, y - 24);
    } else if (style === 'harbor') {
      if (h > 90) {
        ctx.fillStyle = '#e8e2d8'; ctx.fillRect(b.x - 12, y, 24, h);
        ctx.fillStyle = '#c0404a'; for (let j = 0; j < 4; j++) ctx.fillRect(b.x - 12, y + 10 + j * 24, 24, 11);
        ctx.fillStyle = '#2a3e55'; ctx.fillRect(b.x - 15, y - 14, 30, 14); tri(ctx, b.x - 15, y - 14, b.x + 15, y - 14, b.x, y - 28);
        const a = t * 1.5;
        ctx.fillStyle = 'rgba(255,240,170,0.25)'; ctx.beginPath(); ctx.moveTo(b.x, y - 8); ctx.lineTo(b.x + Math.cos(a) * 200, y - 8 - 24); ctx.lineTo(b.x + Math.cos(a) * 200, y - 8 + 24); ctx.fill();
        ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(b.x, y - 8, 5, 0, 6.283); ctx.fill();
        ctx.restore(); return;
      }
      ctx.fillRect(x + 1, y - 8, b.w - 2, 10);
    } else if (style === 'oasis') {
      if (h > 80) { ctx.fillStyle = body; ctx.fillRect(b.x - 10, y - 26, 20, 26); ctx.fillStyle = roof; ctx.beginPath(); ctx.arc(b.x, y - 26, 12, Math.PI, 0); ctx.fill(); ctx.fillRect(b.x - 1, y - 48, 2, 10); }
      else { ctx.beginPath(); ctx.arc(b.x, y + 2, b.w * 0.32, Math.PI, 0); ctx.fill(); }
    } else if (style === 'snow') {
      if (h > 85) { tri(ctx, x + 2, y + 2, x + b.w - 2, y + 2, b.x, y - 38); ctx.fillStyle = '#ffffff'; tri(ctx, b.x - 9, y - 22, b.x + 9, y - 22, b.x, y - 38); }
      else { ctx.fillStyle = body; for (let j = 0; j < 4; j++) ctx.fillRect(x + 4 + j * 16, y - 9, 10, 10); ctx.fillStyle = '#ffffff'; for (let j = 0; j < 4; j++) ctx.fillRect(x + 4 + j * 16, y - 11, 10, 4); }
    } else if (style === 'capital') {
      if (h > 95) {
        tri(ctx, x + 2, y + 2, x + b.w - 2, y + 2, b.x, y - 40);
        ctx.fillStyle = '#ffd76a'; ctx.fillRect(b.x - 1, y - 60, 2, 22);
        ctx.fillStyle = '#d84a5a'; ctx.beginPath(); ctx.moveTo(b.x + 1, y - 60); ctx.lineTo(b.x + 18 + Math.sin(t * 4 + i) * 3, y - 55); ctx.lineTo(b.x + 1, y - 50); ctx.fill();
      } else { ctx.fillRect(x + 1, y - 10, b.w - 2, 12); ctx.fillStyle = '#ffd76a'; ctx.fillRect(x + 1, y - 2, b.w - 2, 3); }
    }
    // 창문
    const cols = 3, rows = Math.max(1, Math.floor((h - 14) / 18));
    for (let ry = 0; ry < rows; ry++) for (let cx = 0; cx < cols; cx++) {
      const on = ((i * 7 + ry * 3 + cx * 5) % 5) !== 0;
      ctx.fillStyle = on ? C.win : 'rgba(0,0,0,0.35)';
      if (on && ((i + ry + cx + Math.floor(t * 0.3)) % 11 === 0)) ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x + 12 + cx * 16, y + 10 + ry * 18, 9, 10);
    }
    ctx.restore();
  }

  // ----- 포대 -----
  function drawBattery(b, idx, mx, my, W) {
    ctx.fillStyle = '#4a4f63';
    ctx.beginPath(); ctx.moveTo(b.x - 46, GROUND + 2); ctx.lineTo(b.x - 28, b.y + 6); ctx.lineTo(b.x + 28, b.y + 6); ctx.lineTo(b.x + 46, GROUND + 2); ctx.fill();
    ctx.fillStyle = '#5c6279'; ctx.fillRect(b.x - 28, b.y + 6, 56, 6);
    const a = Math.atan2(my - b.y, mx - b.x);
    const recoil = b.fireT > 0 ? b.fireT * 24 : 0;
    ctx.save(); ctx.translate(b.x, b.y + 4); ctx.rotate(Math.min(-0.15, Math.max(-Math.PI + 0.15, a)));
    ctx.fillStyle = '#c9d2e6'; ctx.fillRect(4 - recoil, -5, 32, 10);
    ctx.fillStyle = '#7fe0ff'; ctx.fillRect(30 - recoil, -4, 6, 8);
    ctx.restore();
    ctx.fillStyle = '#8a93ad'; ctx.beginPath(); ctx.arc(b.x, b.y + 6, 15, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#3a3f52'; ctx.fillRect(b.x - 4, b.y - 4, 8, 4);
    if (b.fireT > 0.1) { ctx.fillStyle = 'rgba(160,240,255,' + b.fireT * 3 + ')'; ctx.beginPath(); ctx.arc(b.x, b.y, 22, 0, 6.283); ctx.fill(); }
  }

  // ----- 방어막 -----
  function drawShield(W, t) {
    if (W.shields <= 0) return;
    ctx.save();
    const a = 0.08 + 0.04 * Math.sin(t * 2.4);
    [[380, 230], [900, 230]].forEach(([cx, rw]) => {
      ctx.strokeStyle = 'rgba(120,220,255,' + (a * 3) + ')'; ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(120,220,255,' + a + ')';
      ctx.beginPath(); ctx.ellipse(cx, GROUND, rw, 150, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
    });
    ctx.restore();
  }

  // ----- 적 -----
  const ECOL = { meteor: [255, 150, 60], bomb: [110, 255, 140], split: [200, 120, 255], drone: [90, 220, 255], armor: [255, 220, 120] };
  function drawTrail(e) {
    const tr = e.trail, n = tr.length / 2, c = ECOL[e.type];
    if (n < 2) return;
    ctx.lineCap = 'round';
    for (let i = 1; i < n; i++) {
      const a = i / n;
      ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${a * 0.55})`;
      ctx.lineWidth = 1 + a * e.r * 0.9;
      ctx.beginPath(); ctx.moveTo(tr[i * 2 - 2], tr[i * 2 - 1]); ctx.lineTo(i === n - 1 ? e.x : tr[i * 2], i === n - 1 ? e.y : tr[i * 2 + 1]); ctx.stroke();
    }
  }
  function drawEnemy(e, t) {
    const c = ECOL[e.type], x = e.x, y = e.y, r = e.r;
    // 빛무리
    const g = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 2.6);
    g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0.55)`); g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, 6.283); ctx.fill();
    const ang = Math.atan2(e.ty - e.sy, e.tx - e.sx);
    ctx.save(); ctx.translate(x, y);
    if (e.type === 'meteor') {
      ctx.rotate(e.age * 2 + e.ph);
      ctx.fillStyle = '#8a5a3a'; ctx.beginPath();
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, rr = r * (0.82 + ((i * 37 + e.id) % 5) * 0.06); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.fill();
      ctx.fillStyle = '#5e3a26'; ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.2, r * 0.25, 0, 6.283); ctx.arc(r * 0.35, r * 0.25, r * 0.18, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(255,190,90,0.8)'; ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.35, r * 0.18, 0, 6.283); ctx.fill();
    } else if (e.type === 'bomb') {
      ctx.rotate(ang - Math.PI / 2);
      ctx.fillStyle = '#3c4252'; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.8, r * 1.5, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#5c6478'; tri(ctx, -r * 0.8, -r * 1.2, r * 0.8, -r * 1.2, 0, -r * 0.2);
      ctx.fillStyle = (Math.floor(t * 6 + e.id) % 2) ? '#ff4a4a' : '#7dff8a';
      ctx.beginPath(); ctx.arc(0, r * 0.5, r * 0.36, 0, 6.283); ctx.fill();
    } else if (e.type === 'split') {
      const pulse = 0.5 + 0.5 * Math.sin(t * (6 + Math.max(0, (e.y - 120) / 30)));
      ctx.rotate(e.age * 1.2);
      ctx.fillStyle = '#5a3a7a'; ctx.beginPath();
      for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283, rr = r * (0.85 + (i % 3) * 0.08); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.fill();
      ctx.strokeStyle = `rgba(230,170,255,${0.5 + pulse * 0.5})`; ctx.lineWidth = 2.2;
      ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = i / 3 * 6.283; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9); } ctx.stroke();
    } else if (e.type === 'drone') {
      ctx.rotate(Math.sin(e.age * e.freq * 6.283 + e.ph) * 0.35);
      ctx.fillStyle = '#9aa6bc'; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.5, r * 0.55, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(120,230,255,0.9)'; ctx.beginPath(); ctx.ellipse(0, -r * 0.25, r * 0.7, r * 0.6, 0, Math.PI, 0); ctx.fill();
      for (let i = 0; i < 3; i++) { ctx.fillStyle = (Math.floor(t * 5) + i) % 3 ? '#3a4a5a' : '#ffef6a'; ctx.beginPath(); ctx.arc((i - 1) * r * 0.8, r * 0.15, 2, 0, 6.283); ctx.fill(); }
    } else if (e.type === 'armor') {
      ctx.rotate(ang - Math.PI / 2);
      ctx.fillStyle = e.hp > 1 ? '#6a7286' : '#4a3a36'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.283); ctx.fill();
      if (e.hp > 1) {
        ctx.strokeStyle = '#ffd76a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, 6.283); ctx.stroke();
        ctx.fillStyle = '#c9d0de'; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72, 1.8, 0, 6.283); ctx.fill(); }
      } else {
        ctx.fillStyle = `rgba(255,140,60,${0.6 + 0.4 * Math.sin(t * 20)})`; ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, 6.283); ctx.fill();
        ctx.strokeStyle = '#1a1414'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.2); ctx.lineTo(0, r * 0.1); ctx.lineTo(r * 0.5, -r * 0.5); ctx.stroke();
      }
    }
    ctx.restore();
    if (e.hitT > 0) { ctx.fillStyle = `rgba(255,255,255,${e.hitT})`; ctx.beginPath(); ctx.arc(x, y, r * 1.2, 0, 6.283); ctx.fill(); }
  }

  // ----- 모선 -----
  const BOSS_COL = [
    { hull: ['#6a6f86', '#2f3246'], dome: 'rgba(160,140,255,0.85)', light: '#ff5a6a' },
    { hull: ['#a8505a', '#4a1f2a'], dome: 'rgba(255,170,120,0.85)', light: '#ffd76a' },
    { hull: ['#c09060', '#5a3a22'], dome: 'rgba(255,220,140,0.85)', light: '#ff8a3a' },
    { hull: ['#a8c8e8', '#3a5878'], dome: 'rgba(190,240,255,0.85)', light: '#7af0ff' },
    { hull: ['#b88ae8', '#40306a'], dome: 'rgba(255,190,255,0.85)', light: '#ff7af0' },
    { hull: ['#4a4458', '#141020'], dome: 'rgba(255,90,90,0.85)', light: '#ff3a3a' },
  ];
  function drawBoss(W, t) {
    const B = W.boss; if (!B) return;
    if (B.dead && B.deathT > 1.6) return;
    const C = BOSS_COL[W.city], w = B.w, h = B.h;
    ctx.save(); ctx.translate(B.x + (B.dead ? (Math.random() - 0.5) * 8 : 0), B.y);
    if (B.dead) ctx.globalAlpha = Math.max(0, 1 - B.deathT / 1.6);
    // 아래 빛
    const ug = ctx.createRadialGradient(0, h * 0.3, 4, 0, h * 0.3, w * 0.5);
    ug.addColorStop(0, 'rgba(255,255,255,0.18)'); ug.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = ug; ctx.beginPath(); ctx.ellipse(0, h * 0.35, w * 0.5, h * 0.6, 0, 0, 6.283); ctx.fill();
    // 몸체
    if (W.city === 5) { // 거대 모선: 옆 날개
      ctx.fillStyle = C.hull[1];
      ctx.beginPath(); ctx.moveTo(-w * 0.5, 0); ctx.lineTo(-w * 0.62, -h * 0.25); ctx.lineTo(-w * 0.62, h * 0.3); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(w * 0.5, 0); ctx.lineTo(w * 0.62, -h * 0.25); ctx.lineTo(w * 0.62, h * 0.3); ctx.closePath(); ctx.fill();
    }
    const hg = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    hg.addColorStop(0, C.hull[0]); hg.addColorStop(1, C.hull[1]);
    ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(0, 0, w / 2, h * 0.32, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, h * 0.12, w * 0.42, h * 0.14, 0, 0, Math.PI); ctx.fill();
    // 돔
    ctx.fillStyle = C.dome; ctx.beginPath(); ctx.ellipse(0, -h * 0.16, w * 0.2, h * 0.4, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-w * 0.07, -h * 0.36, w * 0.05, h * 0.1, -0.4, 0, 6.283); ctx.fill();
    // 눈
    const eyeX = Math.max(-w * 0.08, Math.min(w * 0.08, (B.dir || 0) * w * 0.06));
    ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.ellipse(eyeX, -h * 0.28, w * 0.05, h * 0.12, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = B.enraged ? '#ff3030' : '#ffef9a'; ctx.beginPath(); ctx.arc(eyeX, -h * 0.28, Math.min(w * 0.03, 7), 0, 6.283); ctx.fill();
    // 둘레 불빛
    const nl = 9;
    for (let i = 0; i < nl; i++) {
      const a = Math.PI * (0.08 + 0.84 * i / (nl - 1));
      const lx = -Math.cos(a) * w * 0.44, ly = Math.sin(a) * h * 0.14 + 2;
      const on = (Math.floor(t * 8) + i) % 3 === 0;
      ctx.fillStyle = on ? (B.enraged ? '#ff4040' : C.light) : 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.arc(lx, ly, on ? 4.5 : 3, 0, 6.283); ctx.fill();
    }
    // 충전
    if (B.charge > 0) {
      const p = 1 - B.charge / 3.8;
      const cg = ctx.createRadialGradient(0, h * 0.3, 2, 0, h * 0.3, 18 + p * 34);
      cg.addColorStop(0, 'rgba(255,255,255,1)'); cg.addColorStop(0.4, 'rgba(255,80,80,0.9)'); cg.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, h * 0.3, 18 + p * 34, 0, 6.283); ctx.fill();
    }
    // 맞음
    if (B.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${B.flash * 3})`; ctx.beginPath(); ctx.ellipse(0, 0, w / 2, h * 0.34, 0, 0, 6.283); ctx.fill(); }
    // 방어막
    if (B.shieldT > 0) {
      const a = Math.min(1, B.shieldT * 2) * (0.55 + 0.15 * Math.sin(t * 18));
      ctx.strokeStyle = `rgba(140,230,255,${a})`; ctx.lineWidth = 4;
      ctx.fillStyle = `rgba(140,230,255,${a * 0.25})`;
      ctx.beginPath(); ctx.ellipse(0, 0, w * 0.6, h * 0.8, 0, 0, 6.283); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
    // 광선 예고
    if (B.charge > 0 && W.bld[B.chargeBi]) {
      const b = W.bld[B.chargeBi];
      ctx.save(); ctx.setLineDash([10, 10]); ctx.lineDashOffset = -t * 60;
      ctx.strokeStyle = `rgba(255,70,70,${0.4 + 0.4 * Math.sin(t * 16)})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(B.x, B.y + h * 0.3); ctx.lineTo(b.x, GROUND - b.h); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#ff5050'; ctx.font = '34px ' + FONT; ctx.textAlign = 'center';
      ctx.fillText('⚠', b.x, GROUND - b.h - 16 + Math.sin(t * 10) * 3);
    }
  }
  function drawBossBar(W) {
    const B = W.boss; if (!B || B.dead) return;
    const bw = 520, x = 640 - bw / 2, y = TOPBAR + 14;
    ctx.fillStyle = 'rgba(10,8,20,0.7)'; rr(x - 8, y - 6, bw + 16, 40, 10); ctx.fill();
    ctx.fillStyle = '#3a2030'; ctx.fillRect(x, y + 18, bw, 12);
    const p = B.hp / B.maxHp;
    const g = ctx.createLinearGradient(x, 0, x + bw, 0); g.addColorStop(0, '#ff4a6a'); g.addColorStop(1, '#ffb04a');
    ctx.fillStyle = g; ctx.fillRect(x, y + 18, bw * p, 12);
    ctx.fillStyle = '#fff'; ctx.font = '19px ' + FONT; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(B.def.name + (B.enraged ? '  (분노!)' : ''), x, y + 13);
    ctx.textAlign = 'right'; ctx.fillText(B.hp + ' / ' + B.maxHp, x + bw, y + 13);
  }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  // ----- 폭발 -----
  const BLAST_COL = [
    ['255,240,170', '255,140,60'],
    ['255,220,120', '255,90,90'],
    ['255,180,230', '220,80,255'],
    ['190,220,255', '90,140,255'],
    ['180,255,230', '60,220,170'],
  ];
  function drawBlast(b) {
    const r = Engine.blastR(b);
    if (r <= 0.5) return;
    let c = b.kind === 'mega' ? ['220,250,255', '90,190,255'] : b.kind === 'fx' ? ['255,220,150', '255,100,40'] : BLAST_COL[Math.min(b.depth, BLAST_COL.length - 1)];
    const fade = b.t > b.g + b.h ? Math.max(0, 1 - (b.t - b.g - b.h) / b.f) : 1;
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
    g.addColorStop(0, `rgba(255,255,255,${0.95 * fade})`);
    g.addColorStop(0.3, `rgba(${c[0]},${0.85 * fade})`);
    g.addColorStop(0.75, `rgba(${c[1]},${0.55 * fade})`);
    g.addColorStop(1, `rgba(${c[1]},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 6.283); ctx.fill();
    if (b.t < 0.32) {
      ctx.strokeStyle = `rgba(255,255,255,${(0.32 - b.t) * 2})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.R * (0.6 + b.t * 2.2), 0, 6.283); ctx.stroke();
    }
  }

  // ----- 파티클 -----
  function addPart(p) { if (parts.length < 900) { p.max = p.life; parts.push(p); } }
  function burst(x, y, n, col, speed, life, type) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, s = speed * (0.3 + Math.random() * 0.9);
      addPart({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.6 + Math.random() * 0.6), size: type === 'debris' ? 2 + Math.random() * 3 : 2, col, type: type || 'spark', g: type === 'debris' ? 260 : 40 });
    }
  }
  function stepParts(dt) {
    for (const p of parts) {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.type === 'smoke') { p.vx *= 0.98; p.size += dt * 10; }
      else { p.vy += (p.g || 0) * dt; p.vx *= 0.985; }
      if (p.type === 'debris' && p.y > GROUND) { p.y = GROUND; p.vy *= -0.3; p.vx *= 0.6; }
    }
    for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
  }
  function drawParts() {
    for (const p of parts) {
      const a = Math.max(0, p.life / p.max);
      if (p.type === 'smoke') { ctx.fillStyle = p.col + (a * 0.35) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.283); ctx.fill(); }
      else if (p.type === 'debris') { ctx.fillStyle = p.col + a + ')'; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); }
      else { ctx.strokeStyle = p.col + a + ')'; ctx.lineWidth = p.size; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); ctx.stroke(); }
    }
  }

  // ----- 글자 -----
  function text(x, y, s, col, size, life, vy) { texts.push({ x, y, s, col, size: size || 26, life: life || 1.1, max: life || 1.1, vy: vy == null ? -40 : vy }); if (texts.length > 40) texts.shift(); }
  function drawTexts(dt) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const o of texts) {
      o.life -= dt; o.y += o.vy * dt;
      const a = Math.min(1, o.life / o.max * 2.5), pop = 1 + Math.max(0, (o.life - o.max + 0.15) / 0.15) * 0.4;
      ctx.globalAlpha = Math.max(0, a);
      ctx.font = Math.round(o.size * pop) + 'px ' + FONT;
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,8,25,0.85)'; ctx.strokeText(o.s, o.x, o.y);
      ctx.fillStyle = o.col; ctx.fillText(o.s, o.x, o.y);
    }
    ctx.globalAlpha = 1;
    for (let i = texts.length - 1; i >= 0; i--) if (texts[i].life <= 0) texts.splice(i, 1);
  }
  function setBanner(s, sub, dur, col) { banner = { s, sub, t: 0, dur: dur || 2.2, col: col || '#ffffff' }; }
  function drawBanner(dt) {
    if (!banner) return;
    banner.t += dt;
    const b = banner, u = b.t / b.dur;
    if (u >= 1) { banner = null; return; }
    const a = Math.min(1, b.t * 4, (1 - u) * 4);
    ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(8,6,24,0.55)'; ctx.fillRect(0, 262, VW, b.sub ? 132 : 92);
    ctx.font = '58px ' + FONT; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.strokeText(b.s, 640, 308); ctx.fillStyle = b.col; ctx.fillText(b.s, 640, 308);
    if (b.sub) { ctx.font = '28px ' + FONT; ctx.fillStyle = '#ffe9a8'; ctx.fillText(b.sub, 640, 362); }
    ctx.globalAlpha = 1;
  }
  function beam(x1, y1, x2, y2) { beams.push({ x1, y1, x2, y2, t: 0.45 }); }
  function shake(a) { if (opt.shake) shakeA = Math.max(shakeA, a); }
  function flash(a, col) { flashA = Math.max(flashA, a); flashCol = col || '#fff'; }

  // ----- 한 장면 그리기 -----
  function frame(dt, W, view) {
    T += dt;
    if (!W) { ctx.setTransform(k, 0, 0, k, 0, 0); ctx.fillStyle = '#070b2a'; ctx.fillRect(0, 0, VW, VH); return; }
    const style = CITIES[W.city].style;
    if (!bg[style]) bg[style] = makeBg(style);
    stepParts(dt);
    shakeA = Math.max(0, shakeA - dt * 30);
    sx = (Math.random() - 0.5) * shakeA; sy = (Math.random() - 0.5) * shakeA;
    ctx.setTransform(k, 0, 0, k, sx * k, sy * k);
    ctx.drawImage(bg[style], -10, -10, VW + 20, VH + 20);
    // 움직이는 하늘
    if (style === 'snow') {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (let i = 0; i < 70; i++) { const x = (i * 97.3 + T * (14 + i % 5 * 4) + Math.sin(T + i) * 10) % VW, y = (i * 53.7 + T * (30 + i % 7 * 6)) % GROUND; ctx.fillRect(x, y, 2, 2); }
    } else if (style === 'crystal') {
      for (let j = 0; j < 3; j++) {
        ctx.fillStyle = `rgba(${j === 1 ? '255,120,220' : '90,255,200'},${0.06 + 0.04 * Math.sin(T * 0.7 + j)})`;
        ctx.beginPath(); ctx.moveTo(0, 150 + j * 50);
        for (let x = 0; x <= VW; x += 64) ctx.lineTo(x, 150 + j * 50 + Math.sin(x / 160 + T * 0.5 + j) * 40);
        for (let x = VW; x >= 0; x -= 64) ctx.lineTo(x, 230 + j * 50 + Math.sin(x / 140 + T * 0.4 + j * 2) * 40);
        ctx.fill();
      }
    } else if (style === 'harbor') {
      ctx.fillStyle = 'rgba(255,220,180,0.10)';
      for (let i = 0; i < 4; i++) { const x = (i * 360 + T * 8) % (VW + 300) - 150; ctx.beginPath(); ctx.ellipse(x, 160 + i * 40, 120, 18, 0, 0, 6.283); ctx.fill(); }
    }
    // 위협선
    if (opt.lines) {
      ctx.lineWidth = 1;
      for (const e of W.enemies) {
        ctx.strokeStyle = e.bi >= 0 && W.bld[e.bi].alive ? 'rgba(255,90,90,0.13)' : 'rgba(255,255,255,0.05)';
        ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.tx, e.ty); ctx.stroke();
      }
    }
    for (const b of W.bld) drawBuilding(b, style, T);
    drawShield(W, T);
    drawBoss(W, T);
    // 요격탄
    for (const s of W.shots) {
      ctx.strokeStyle = s.mega ? 'rgba(255,230,120,0.6)' : 'rgba(140,230,255,0.45)'; ctx.lineWidth = s.mega ? 3 : 2;
      ctx.beginPath(); ctx.moveTo(s.bx, s.by); ctx.lineTo(s.x, s.y); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.mega ? 5 : 3.2, 0, 6.283); ctx.fill();
      const blink = Math.floor(T * 10) % 2;
      ctx.strokeStyle = blink ? (s.mega ? '#ffe070' : '#9ff0ff') : '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(s.tx - 6, s.ty - 6); ctx.lineTo(s.tx + 6, s.ty + 6); ctx.moveTo(s.tx + 6, s.ty - 6); ctx.lineTo(s.tx - 6, s.ty + 6); ctx.stroke();
    }
    for (const b of W.bats) for (const q of b.q) {
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(q.x - 5, q.y - 5); ctx.lineTo(q.x + 5, q.y + 5); ctx.moveTo(q.x + 5, q.y - 5); ctx.lineTo(q.x - 5, q.y + 5); ctx.stroke();
    }
    for (const e of W.enemies) drawTrail(e);
    for (const e of W.enemies) {
      drawEnemy(e, T);
      if (e.p > 0.72 && e.bi >= 0 && W.bld[e.bi].alive && Math.floor(T * 6) % 2) {
        ctx.strokeStyle = 'rgba(255,80,80,0.8)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(e.tx, e.ty, 9, 0, 6.283); ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const b of W.blasts) drawBlast(b);
    for (const bm of beams) {
      bm.t -= dt;
      const a = Math.max(0, bm.t / 0.45);
      ctx.strokeStyle = `rgba(255,80,80,${a})`; ctx.lineWidth = 18 * a + 4;
      ctx.beginPath(); ctx.moveTo(bm.x1, bm.y1); ctx.lineTo(bm.x2, bm.y2); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 5 * a + 1; ctx.stroke();
    }
    for (let i = beams.length - 1; i >= 0; i--) if (beams[i].t <= 0) beams.splice(i, 1);
    drawParts();
    ctx.globalCompositeOperation = 'source-over';
    for (const [i, b] of W.bats.entries()) drawBattery(b, i, view.mx, view.my, W);
    // 아래 정보
    ctx.setTransform(k, 0, 0, k, 0, 0);
    if (view.hud) drawBottom(W);
    drawBossBar(W);
    drawTexts(dt);
    drawBanner(dt);
    if (view.hud && view.mouseIn) drawReticle(W, view.mx, view.my);
    if (flashA > 0) { ctx.globalAlpha = flashA; ctx.fillStyle = flashCol; ctx.fillRect(0, 0, VW, VH); ctx.globalAlpha = 1; flashA = Math.max(0, flashA - dt * 2.5); }
    if (view.dim) { ctx.fillStyle = `rgba(6,6,20,${view.dim})`; ctx.fillRect(0, 0, VW, VH); }
  }

  function pill(x, y, w, h, bgc, s, col, size) {
    ctx.fillStyle = bgc; rr(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
    ctx.fillStyle = col; ctx.font = size + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y + 1);
  }
  function drawBottom(W) {
    const low = W.ammo <= 3;
    const bgc = W.ammo === 0 ? 'rgba(160,30,40,0.85)' : low ? `rgba(160,60,40,${0.65 + 0.25 * Math.sin(T * 8)})` : 'rgba(10,12,30,0.72)';
    pill(640, 683, 220, 46, bgc, '요격탄 ' + W.ammo, '#ffffff', 30);
    const alive = W.bld.filter(b => b.alive).length;
    pill(420, 683, 170, 40, 'rgba(10,12,30,0.6)', '건물 ' + alive + '/8', alive <= 2 ? '#ff9a9a' : '#e8f0ff', 24);
    if (W.shieldMax > 0) pill(860, 683, 170, 40, 'rgba(10,30,50,0.65)', '방어막 ' + W.shields, '#9fe8ff', 24);
  }
  function drawReticle(W, x, y) {
    const mega = W.megaArmed && W.megas > 0;
    const R = mega ? MEGA_R : W.R;
    ctx.save();
    ctx.strokeStyle = mega ? 'rgba(255,220,100,0.85)' : W.ammo > 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,90,90,0.6)';
    ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -T * 20;
    ctx.beginPath(); ctx.arc(x, y, R, 0, 6.283); ctx.stroke();
    ctx.setLineDash([]); ctx.lineWidth = 2.5; ctx.strokeStyle = mega ? '#ffe070' : '#ffffff';
    ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x - 5, y); ctx.moveTo(x + 5, y); ctx.lineTo(x + 14, y);
    ctx.moveTo(x, y - 14); ctx.lineTo(x, y - 5); ctx.moveTo(x, y + 5); ctx.lineTo(x, y + 14); ctx.stroke();
    ctx.restore();
  }

  // 작은 그림 (도감·소개용)
  function enemyIcon(canvas, type) {
    const g = canvas.getContext('2d'), s = canvas.width / 80;
    const save = ctx; ctx = g;
    g.setTransform(s, 0, 0, s, 0, 0); g.clearRect(0, 0, 80, 80);
    const e = { type, x: 40, y: 40, sx: 20, sy: 0, tx: 60, ty: 80, r: ENEMY[type].r * 1.9, hp: ENEMY[type].hp, age: 0.4, ph: 1, id: 3, freq: 0.5, hitT: 0 };
    drawEnemy(e, 0.2);
    ctx = save;
  }

  return { init, resize, frame, burst, addPart, text, setBanner, shake, flash, beam, enemyIcon, opt, clear() { parts.length = 0; texts.length = 0; beams.length = 0; banner = null; } };
})();

// ===== 그림 (SVG): 딸 · 인물 초상 · 방 =====
const Art = (() => {
  const SKIN = '#ffe4d2', SKIN_LINE = '#e9b89f', EYE = '#4b3768', IRIS = '#7a64c8';
  const BODY = [
    { hr: 58, hy: 128, neck: 180, sh: 60, waist: 252, hem: 322, foot: 398 },  // 10~12살
    { hr: 54, hy: 106, neck: 155, sh: 66, waist: 236, hem: 318, foot: 402 },  // 13~15살
    { hr: 50, hy: 88,  neck: 133, sh: 70, waist: 218, hem: 318, foot: 405 },  // 16~18살
  ];

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
    else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  }

  // ---------- 딸 ----------
  // o: { stage, outfit, expr, hair(색), hairStyle, acc(엔딩 소품), wear(액세서리 id) }
  function girl(o) {
    const stage = o.stage || 0;
    const B = BODY[stage];
    const hair = o.hair || '#7a4a2a';
    const hairD = shade(hair, -0.28);
    const of = OUTFIT[o.outfit] || OUTFIT.basic;
    const st = of.style;
    const col = of.col, colD = shade(col, -0.22), acc = of.acc;
    const expr = o.expr || 'normal';
    const hs = o.hairStyle || 'long';
    const cx = 150, hr = B.hr, hy = B.hy;
    const p = [];
    const defs = [];

    p.push(`<ellipse cx="${cx}" cy="${B.foot + 6}" rx="70" ry="9" fill="rgba(0,0,0,.18)"/>`);

    // 망토
    if (st === 'armor') {
      const cape = of.cape || '#b53a4a';
      p.push(`<path d="M${cx - B.sh * 0.6},${B.neck + 10} Q${cx - B.sh * 1.2},${B.foot - 30} ${cx - B.sh * 0.9},${B.foot - 4} L${cx + B.sh * 0.9},${B.foot - 4} Q${cx + B.sh * 1.2},${B.foot - 30} ${cx + B.sh * 0.6},${B.neck + 10}Z" fill="${cape}" stroke="${shade(cape, -0.25)}" stroke-width="2"/>`);
    }

    // 뒷머리
    p.push(backHair(hs, stage, B, cx, hy, hr, hair, hairD));

    // 다리
    const longSkirt = st === 'gown' || st === 'robe' || st === 'coat';
    const legTop = B.hem - 12;
    let legCol = '#fdfdfd';
    if (st === 'train' || st === 'armor') legCol = st === 'armor' ? '#5a6b80' : shade(acc, 0);
    if (st === 'tutu') legCol = '#ffd6e6';
    if (st === 'maid') legCol = '#3a3340';
    if (!longSkirt) {
      p.push(`<rect x="${cx - 24}" y="${legTop}" width="16" height="${B.foot - legTop - 6}" rx="7" fill="${legCol}" stroke="${SKIN_LINE}" stroke-width="1"/>`);
      p.push(`<rect x="${cx + 8}" y="${legTop}" width="16" height="${B.foot - legTop - 6}" rx="7" fill="${legCol}" stroke="${SKIN_LINE}" stroke-width="1"/>`);
    }
    const shoe = st === 'armor' ? '#6b7a8c' : st === 'train' ? '#5a3c22' : st === 'tutu' ? '#f08aaa' : '#7a3b52';
    p.push(`<ellipse cx="${cx - 17}" cy="${B.foot - 3}" rx="14" ry="7" fill="${shoe}"/><ellipse cx="${cx + 17}" cy="${B.foot - 3}" rx="14" ry="7" fill="${shoe}"/>`);

    // 몸통 + 치마
    const sw = B.sh * 0.56, ww = B.sh * 0.38, top = B.neck + 6;
    let fill = col;
    if (of.pattern === 'check') {
      const pid = 'ck' + col.slice(1) + acc.slice(1);
      defs.push(`<pattern id="${pid}" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="${col}"/><rect width="8" height="16" fill="${acc}" opacity=".35"/><rect width="16" height="8" fill="${acc}" opacity=".35"/></pattern>`);
      fill = `url(#${pid})`;
    }
    const bodice = `M${cx - sw},${top + 6} Q${cx},${top - 4} ${cx + sw},${top + 6} L${cx + ww},${B.waist} L${cx - ww},${B.waist}Z`;
    if (st === 'gown') {
      const hem = B.foot - 6, fw = B.sh * 1.25;
      p.push(`<path d="M${cx - ww},${B.waist - 2} Q${cx - fw * 0.7},${hem - 40} ${cx - fw},${hem} Q${cx},${hem + 12} ${cx + fw},${hem} Q${cx + fw * 0.7},${hem - 40} ${cx + ww},${B.waist - 2}Z" fill="${fill}" stroke="${colD}" stroke-width="2"/>`);
      p.push(`<path d="M${cx - fw + 4},${hem - 6} Q${cx},${hem + 8} ${cx + fw - 4},${hem - 6}" stroke="${acc}" stroke-width="6" fill="none" stroke-linecap="round"/>`);
      p.push(`<path d="M${cx - fw * 0.55},${hem - 30} Q${cx - fw * 0.3},${B.waist + 40} ${cx - ww * 0.4},${B.waist + 4}" stroke="${shade(col, 0.25)}" stroke-width="3" fill="none"/>`);
      p.push(`<path d="M${cx + fw * 0.5},${hem - 26} Q${cx + fw * 0.25},${B.waist + 50} ${cx + ww * 0.5},${B.waist + 6}" stroke="${shade(col, 0.25)}" stroke-width="3" fill="none"/>`);
      if (of.sparkle) for (let i = 0; i < 9; i++) {
        const sx = cx - fw * 0.7 + (i * 37 % (fw * 1.4)), sy = B.waist + 25 + (i * 53 % (hem - B.waist - 40));
        p.push(`<circle cx="${sx}" cy="${sy}" r="2.4" fill="${of.sparkle}"/>`);
      }
      if (of.id === 'rose') for (let i = 0; i < 5; i++) p.push(rosette(cx - fw * 0.8 + i * fw * 0.4, hem - 14, '#ff9ab8'));
      p.push(`<path d="${bodice}" fill="${fill}" stroke="${colD}" stroke-width="2"/>`);
      p.push(`<path d="M${cx - sw + 4},${top + 8} Q${cx},${top + 26} ${cx + sw - 4},${top + 8}" stroke="${acc}" stroke-width="5" fill="none"/>`);
    } else if (st === 'robe' || st === 'coat') {
      const hem = B.foot - (st === 'coat' ? 26 : 6), fw = B.sh * (st === 'coat' ? 0.85 : 0.95);
      if (st === 'coat') {
        p.push(`<rect x="${cx - 24}" y="${hem - 10}" width="16" height="${B.foot - hem + 4}" rx="7" fill="#5a4a5a"/><rect x="${cx + 8}" y="${hem - 10}" width="16" height="${B.foot - hem + 4}" rx="7" fill="#5a4a5a"/>`);
      }
      p.push(`<path d="M${cx - sw},${top + 6} Q${cx},${top - 4} ${cx + sw},${top + 6} L${cx + fw},${hem} Q${cx},${hem + 8} ${cx - fw},${hem}Z" fill="${fill}" stroke="${colD}" stroke-width="2"/>`);
      if (st === 'robe') {
        if (of.sparkle) for (let i = 0; i < 10; i++) p.push(`<circle cx="${cx - fw * 0.7 + (i * 41 % (fw * 1.4))}" cy="${B.waist + 18 + (i * 47 % (hem - B.waist - 30))}" r="2.6" fill="${of.sparkle}"/>`);
        p.push(`<path d="M${cx - fw + 3},${hem - 4} Q${cx},${hem + 6} ${cx + fw - 3},${hem - 4}" stroke="${acc}" stroke-width="7" fill="none"/>`);
        p.push(`<line x1="${cx}" y1="${top + 10}" x2="${cx}" y2="${hem}" stroke="${acc}" stroke-width="5"/>`);
        p.push(`<rect x="${cx - ww - 2}" y="${B.waist - 6}" width="${ww * 2 + 4}" height="9" rx="4" fill="${shade(col, -0.35)}"/>`);
      } else {
        for (let i = 0; i < 4; i++) p.push(`<circle cx="${cx + 8}" cy="${top + 26 + i * 30}" r="5" fill="${acc}"/>`);
        p.push(`<line x1="${cx}" y1="${top + 10}" x2="${cx}" y2="${hem}" stroke="${colD}" stroke-width="3"/>`);
        p.push(`<path d="M${cx - sw - 4},${top + 10} Q${cx},${top + 34} ${cx + sw + 4},${top + 10} Q${cx},${top - 6} ${cx - sw - 4},${top + 10}Z" fill="#fff6ea" stroke="#e8d8c0" stroke-width="2"/>`);
      }
    } else {
      const shortH = st === 'train' || st === 'armor';
      const tutu = st === 'tutu';
      const hem = shortH ? B.waist + (B.hem - B.waist) * 0.55 : tutu ? B.waist + (B.hem - B.waist) * 0.6 : B.hem;
      const fw = B.sh * (shortH ? 0.62 : tutu ? 1.2 : st === 'smock' ? 1.0 : 0.95);
      if (tutu) {
        for (let k = 0; k < 3; k++) {
          const y = hem - k * 10, w = fw - k * 8;
          p.push(`<path d="M${cx - ww},${B.waist - 2} Q${cx - w},${y - 8} ${cx - w},${y} Q${cx},${y + 12} ${cx + w},${y} Q${cx + w},${y - 8} ${cx + ww},${B.waist - 2}Z" fill="${shade(col, k * 0.15)}" stroke="${colD}" stroke-width="1.5" opacity=".95"/>`);
        }
      } else {
        p.push(`<path d="M${cx - ww},${B.waist - 2} Q${cx - fw * 0.8},${hem - 30} ${cx - fw},${hem} Q${cx},${hem + 10} ${cx + fw},${hem} Q${cx + fw * 0.8},${hem - 30} ${cx + ww},${B.waist - 2}Z" fill="${fill}" stroke="${colD}" stroke-width="2"/>`);
        if (!shortH) p.push(`<path d="M${cx - fw + 4},${hem - 3} Q${cx},${hem + 9} ${cx + fw - 4},${hem - 3}" stroke="${shade(col, 0.45)}" stroke-width="5" fill="none"/>`);
      }
      p.push(`<path d="${bodice}" fill="${fill}" stroke="${colD}" stroke-width="2"/>`);
      if (st === 'apron' || st === 'maid') {
        p.push(`<path d="M${cx - ww * 0.8},${B.waist} L${cx + ww * 0.8},${B.waist} L${cx + fw * 0.62},${hem - 6} Q${cx},${hem + 2} ${cx - fw * 0.62},${hem - 6}Z" fill="#fff" stroke="#e6d8d8" stroke-width="2"/>`);
        p.push(`<rect x="${cx - ww * 0.62}" y="${top + 16}" width="${ww * 1.24}" height="${B.waist - top - 16}" rx="4" fill="#fff" stroke="#e6d8d8" stroke-width="2"/>`);
        p.push(`<rect x="${cx - ww - 4}" y="${B.waist - 5}" width="${ww * 2 + 8}" height="8" rx="4" fill="${st === 'maid' ? '#fff' : acc === '#ffffff' ? '#f4b6b6' : acc}"/>`);
        if (st === 'maid') p.push(`<path d="M${cx - 18},${top + 2} Q${cx},${top + 18} ${cx + 18},${top + 2}" fill="#fff" stroke="#ddd" stroke-width="2"/><circle cx="${cx}" cy="${top + 16}" r="5" fill="#d4495b"/>`);
      }
      if (st === 'train') {
        p.push(`<rect x="${cx - ww - 3}" y="${B.waist - 6}" width="${ww * 2 + 6}" height="10" rx="3" fill="${acc}"/><rect x="${cx - 7}" y="${B.waist - 7}" width="14" height="12" rx="2" fill="#e8c547"/>`);
      }
      if (st === 'armor') {
        p.push(`<path d="M${cx - sw + 6},${top + 12} Q${cx},${top + 2} ${cx + sw - 6},${top + 12} L${cx + ww - 2},${B.waist - 4} Q${cx},${B.waist + 6} ${cx - ww + 2},${B.waist - 4}Z" fill="#cdd8e4" stroke="#7d8ea3" stroke-width="2"/>`);
        p.push(`<path d="M${cx},${top + 20} l-8,14 l8,12 l8,-12z" fill="${acc}"/>`);
        p.push(`<ellipse cx="${cx - sw}" cy="${top + 10}" rx="15" ry="10" fill="#cdd8e4" stroke="#7d8ea3" stroke-width="2"/><ellipse cx="${cx + sw}" cy="${top + 10}" rx="15" ry="10" fill="#cdd8e4" stroke="#7d8ea3" stroke-width="2"/>`);
      }
      if (st === 'dress' || st === 'smock') {
        p.push(`<path d="M${cx - 18},${top + 2} Q${cx},${top + 20} ${cx + 18},${top + 2}" fill="${acc}" stroke="${shade(acc, -0.1)}" stroke-width="2"/>`);
        if (st === 'dress') p.push(`<circle cx="${cx}" cy="${top + 22}" r="5" fill="${acc === '#ffffff' ? '#f07fb4' : acc}"/>`);
        else ['#e86a92', '#4fa3e0', '#f2c94c', '#3fb8a5'].forEach((c, i) => p.push(`<circle cx="${cx - 30 + i * 19}" cy="${B.waist + 20 + (i % 2) * 22}" r="${4 + i % 2 * 2}" fill="${c}" opacity=".8"/>`));
      }
      if (st === 'sailor') {
        p.push(`<path d="M${cx - sw},${top + 6} L${cx},${top + 44} L${cx + sw},${top + 6} L${cx + sw - 6},${top + 26} L${cx},${top + 58} L${cx - sw + 6},${top + 26}Z" fill="${acc}" stroke="${shade(acc, -0.2)}" stroke-width="2"/>`);
        p.push(`<path d="M${cx},${top + 50} l-14,-8 l0,16z M${cx},${top + 50} l14,-8 l0,16z" fill="#e2414f"/><circle cx="${cx}" cy="${top + 50}" r="5" fill="#c23040"/>`);
        p.push(`<path d="M${cx - fw + 6},${hem - 4} Q${cx},${hem + 8} ${cx + fw - 6},${hem - 4}" stroke="${acc}" stroke-width="4" fill="none"/>`);
      }
      if (st === 'tutu') p.push(`<path d="M${cx - 16},${top + 4} Q${cx},${top + 16} ${cx + 16},${top + 4}" stroke="${acc}" stroke-width="4" fill="none"/>`);
    }

    // 팔
    const sl = [cx - sw + 2, top + 10], sr = [cx + sw - 2, top + 10];
    const hl = [cx - sw - 16, B.waist + 14], hrr = [cx + sw + 16, B.waist + 14];
    const sleeve = st === 'armor' ? '#cdd8e4' : st === 'tutu' ? SKIN : col;
    for (const [s0, h] of [[sl, hl], [sr, hrr]]) {
      const ex = (s0[0] + h[0]) / 2 + (h[0] < cx ? -6 : 6), ey = (s0[1] + h[1]) / 2;
      p.push(`<path d="M${s0[0]},${s0[1]} Q${ex},${ey} ${h[0]},${h[1] - 10}" stroke="${shade(sleeve, -0.25)}" stroke-width="19" fill="none" stroke-linecap="round"/>`);
      p.push(`<path d="M${s0[0]},${s0[1]} Q${ex},${ey} ${h[0]},${h[1] - 10}" stroke="${sleeve}" stroke-width="15" fill="none" stroke-linecap="round"/>`);
      p.push(`<circle cx="${h[0]}" cy="${h[1]}" r="9" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="1.5"/>`);
    }
    if (st === 'gown' || st === 'dress' || st === 'maid' || st === 'sailor') {
      const pc = st === 'maid' ? '#fff' : shade(col, 0.15);
      p.push(`<ellipse cx="${sl[0] - 2}" cy="${sl[1] + 4}" rx="14" ry="11" fill="${pc}" stroke="${colD}" stroke-width="1.5"/>`);
      p.push(`<ellipse cx="${sr[0] + 2}" cy="${sr[1] + 4}" rx="14" ry="11" fill="${pc}" stroke="${colD}" stroke-width="1.5"/>`);
    }

    // 목
    p.push(`<rect x="${cx - 9}" y="${hy + hr * 0.8}" width="18" height="${B.neck - hy - hr * 0.8 + 10}" fill="${SKIN}"/>`);
    const W = o.wear && ACC_ITEM[o.wear];
    if (W && W.slot === 'neck') p.push(neckAcc(o.wear, cx, B.neck + 4));

    // 들고 있는 것
    if (o.acc === 'sword') p.push(`<g transform="translate(${hrr[0]},${hrr[1]}) rotate(-20)"><rect x="-3" y="-110" width="7" height="104" rx="2" fill="#e6edf5" stroke="#8a9bb0"/><rect x="-14" y="-8" width="29" height="7" rx="3" fill="#c79a2c"/><rect x="-3" y="-1" width="7" height="22" rx="2" fill="#6b4226"/></g>`);
    if (o.acc === 'violin') p.push(`<g transform="translate(${hl[0] + 10},${hl[1] - 30}) rotate(-35)"><ellipse cx="0" cy="0" rx="16" ry="24" fill="#a85a2a"/><rect x="-3" y="-60" width="6" height="40" fill="#5a2f14"/></g>`);
    if (o.acc === 'coin') p.push(`<circle cx="${hrr[0]}" cy="${hrr[1] - 4}" r="12" fill="#f2c94c" stroke="#b8902a" stroke-width="3"/>`);
    if (o.acc === 'book' || o.acc === 'glasses') p.push(`<g transform="translate(${hrr[0] - 4},${hrr[1] - 8}) rotate(-12)"><rect x="-16" y="-20" width="32" height="40" rx="3" fill="#8a3b52"/><rect x="-12" y="-16" width="24" height="32" fill="#f6ead2"/></g>`);
    if (o.acc === 'brush') p.push(`<g transform="translate(${hrr[0]},${hrr[1]}) rotate(25)"><rect x="-2" y="-50" width="5" height="50" fill="#a8743a"/><path d="M-3,-50 q3,-14 6,0z" fill="#e86a92"/></g>`);
    if (o.acc === 'bread') p.push(`<ellipse cx="${hrr[0]}" cy="${hrr[1] - 6}" rx="20" ry="11" fill="#d9993c" stroke="#a8702a" stroke-width="2"/>`);
    if (o.acc === 'staff') p.push(`<g transform="translate(${hrr[0]},${hrr[1]})"><rect x="-3" y="-150" width="6" height="190" rx="3" fill="#7a4a2a"/><circle cx="0" cy="-156" r="12" fill="#b7a8ff" stroke="#fff" stroke-width="3"/></g>`);
    if (o.acc === 'mic') p.push(`<g transform="translate(${hl[0] + 6},${hl[1] - 14})"><circle r="9" fill="#555"/><rect x="-3" y="6" width="6" height="22" fill="#333"/></g>`);
    if (o.acc === 'locket') p.push(neckAcc('locket', cx, B.neck + 4));

    // 얼굴
    p.push(`<ellipse cx="${cx}" cy="${hy}" rx="${hr * 0.93}" ry="${hr}" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2"/>`);
    p.push(face(cx, hy, hr, expr, stage));

    // 앞머리
    const b = hy - hr * 0.08;
    const bangs = hs === 'bob'
      ? `M${cx - hr - 5},${hy + hr * 0.35} Q${cx - hr - 8},${hy - hr * 1.18} ${cx},${hy - hr * 1.15} Q${cx + hr + 8},${hy - hr * 1.18} ${cx + hr + 5},${hy + hr * 0.35} Q${cx + hr * 0.7},${b - hr * 0.05} ${cx + hr * 0.3},${b - hr * 0.08} Q${cx},${b - hr * 0.2} ${cx - hr * 0.3},${b - hr * 0.08} Q${cx - hr * 0.7},${b - hr * 0.05} ${cx - hr - 5},${hy + hr * 0.35}Z`
      : `M${cx - hr - 5},${hy + hr * 0.25} Q${cx - hr - 8},${hy - hr * 1.18} ${cx},${hy - hr * 1.15} Q${cx + hr + 8},${hy - hr * 1.18} ${cx + hr + 5},${hy + hr * 0.25} Q${cx + hr * 0.82},${b - hr * 0.1} ${cx + hr * 0.7},${b - hr * 0.3} Q${cx + hr * 0.5},${b} ${cx + hr * 0.38},${b + hr * 0.02} Q${cx + hr * 0.3},${b - hr * 0.25} ${cx + hr * 0.12},${b - hr * 0.35} Q${cx},${b} ${cx - hr * 0.12},${b + hr * 0.04} Q${cx - hr * 0.22},${b - hr * 0.28} ${cx - hr * 0.42},${b - hr * 0.3} Q${cx - hr * 0.55},${b} ${cx - hr * 0.68},${b + hr * 0.02} Q${cx - hr * 0.8},${b - hr * 0.2} ${cx - hr - 5},${hy + hr * 0.25}Z`;
    p.push(`<path d="${bangs}" fill="${hair}" stroke="${hairD}" stroke-width="2" stroke-linejoin="round"/>`);
    p.push(`<path d="M${cx - hr * 0.55},${hy - hr * 0.85} Q${cx - hr * 0.1},${hy - hr * 1.02} ${cx + hr * 0.3},${hy - hr * 0.9}" stroke="rgba(255,255,255,.45)" stroke-width="5" fill="none" stroke-linecap="round"/>`);
    const sideLen = hs === 'bob' ? 0.85 : 1.02;
    p.push(`<path d="M${cx - hr - 4},${hy - hr * 0.2} Q${cx - hr - 2},${hy + hr * 0.7} ${cx - hr * 0.72},${hy + hr * sideLen} Q${cx - hr * 0.86},${hy + hr * 0.3} ${cx - hr * 0.78},${hy - hr * 0.1}Z" fill="${hair}" stroke="${hairD}" stroke-width="1.5"/>`);
    p.push(`<path d="M${cx + hr + 4},${hy - hr * 0.2} Q${cx + hr + 2},${hy + hr * 0.7} ${cx + hr * 0.72},${hy + hr * sideLen} Q${cx + hr * 0.86},${hy + hr * 0.3} ${cx + hr * 0.78},${hy - hr * 0.1}Z" fill="${hair}" stroke="${hairD}" stroke-width="1.5"/>`);

    // 머리 장식: 엔딩 소품 > 액세서리 > 옷 기본 > 나이 기본
    let head = o.acc && o.acc !== 'none' ? o.acc : null;
    if (!head && W && W.slot === 'head') head = o.wear;
    if (!head && st === 'maid') head = 'maidcap';
    if (!head && o.acc !== 'none') head = hs === 'pony' ? 'none' : stage === 0 ? 'ribbon' : stage === 1 ? 'hairpin' : 'none';
    p.push(headAcc(head, cx, hy, hr, of));
    if (expr === 'sick') p.push(`<rect x="${cx - hr * 0.5}" y="${hy - hr * 0.72}" width="${hr}" height="${hr * 0.28}" rx="6" fill="#fff" stroke="#cfd8e0" stroke-width="2"/>`);
    if (expr === 'tired') p.push(`<path d="M${cx + hr * 0.85},${hy - hr * 0.35} q6,10 0,16 q-6,-6 0,-16z" fill="#8fd0ff"/>`);
    if (expr === 'surprise') p.push(`<g stroke="#e0702e" stroke-width="4" stroke-linecap="round"><line x1="${cx + hr * 1.05}" y1="${hy - hr * 0.9}" x2="${cx + hr * 1.25}" y2="${hy - hr * 1.15}"/><line x1="${cx + hr * 1.15}" y1="${hy - hr * 0.7}" x2="${cx + hr * 1.42}" y2="${hy - hr * 0.78}"/></g>`);
    return `<svg viewBox="0 -40 300 460" xmlns="http://www.w3.org/2000/svg"><defs>${defs.join('')}</defs>${p.join('')}</svg>`;
  }

  function rosette(x, y, c) {
    return `<g transform="translate(${x},${y})">${[0, 72, 144, 216, 288].map(a => `<ellipse rx="5" ry="8" transform="rotate(${a}) translate(0,-6)" fill="${c}"/>`).join('')}<circle r="4" fill="#ffd166"/></g>`;
  }

  function backHair(hs, stage, B, cx, hy, hr, hair, hairD) {
    const hw = hr * 1.08 + (stage === 0 ? 2 : 6);
    const cap = `M${cx - hw},${hy} Q${cx - hw - 2},${hy - hr * 1.25} ${cx},${hy - hr * 1.22} Q${cx + hw + 2},${hy - hr * 1.25} ${cx + hw},${hy}`;
    const stroke = `stroke="${hairD}" stroke-width="2"`;
    const out = [];
    if (hs === 'long') {
      const len = [hy + hr * 1.45, B.waist - 10, B.waist + 34][stage];
      out.push(`<path d="${cap} L${cx + hw + (stage ? 8 : 4)},${len} Q${cx + hw * 0.5},${len + 14} ${cx},${len - 4} Q${cx - hw * 0.5},${len + 14} ${cx - hw - (stage ? 8 : 4)},${len}Z" fill="${hair}" ${stroke}/>`);
    } else if (hs === 'bob') {
      const len = hy + hr * 0.98;
      out.push(`<path d="${cap} L${cx + hw + 2},${len} Q${cx},${len + 16} ${cx - hw - 2},${len}Z" fill="${hair}" ${stroke}/>`);
    } else if (hs === 'twin') {
      const len = hy + hr * 0.9;
      out.push(`<path d="${cap} L${cx + hw},${len} Q${cx},${len + 12} ${cx - hw},${len}Z" fill="${hair}" ${stroke}/>`);
      const tl = [96, 140, 175][stage];
      out.push(`<path d="M${cx - hw + 2},${hy - 4} q-30,30 -18,${tl} q8,-30 30,-${tl - 26}z" fill="${hair}" ${stroke}/>`);
      out.push(`<path d="M${cx + hw - 2},${hy - 4} q30,30 18,${tl} q-8,-30 -30,-${tl - 26}z" fill="${hair}" ${stroke}/>`);
    } else { // pony
      const len = hy + hr * 0.95;
      out.push(`<path d="${cap} L${cx + hw},${len} Q${cx},${len + 12} ${cx - hw},${len}Z" fill="${hair}" ${stroke}/>`);
      const tl = [110, 150, 190][stage];
      out.push(`<path d="M${cx + hr * 0.5},${hy - hr * 0.95} q${hr * 1.3},10 ${hr * 0.9},${tl} q-12,-${tl * 0.5} -${hr * 0.75},-${tl - 20}z" fill="${hair}" ${stroke}/>`);
      out.push(`<circle cx="${cx + hr * 0.62}" cy="${hy - hr * 0.88}" r="8" fill="#f05a7e" stroke="#c23b5d" stroke-width="2"/>`);
    }
    return out.join('');
  }

  function face(cx, hy, hr, expr, stage) {
    const p = [];
    const ey = hy + hr * 0.18, ex = hr * 0.38;
    const erx = hr * (0.15 + (2 - stage) * 0.012), ery = hr * (0.21 + (2 - stage) * 0.015);
    const blush = expr === 'sick' ? 'rgba(240,80,90,.55)' : 'rgba(255,130,150,.35)';
    p.push(`<ellipse cx="${cx - hr * 0.58}" cy="${ey + hr * 0.3}" rx="${hr * 0.17}" ry="${hr * 0.09}" fill="${blush}"/><ellipse cx="${cx + hr * 0.58}" cy="${ey + hr * 0.3}" rx="${hr * 0.17}" ry="${hr * 0.09}" fill="${blush}"/>`);
    for (const sgn of [-1, 1]) {
      const x = cx + sgn * ex;
      if (expr === 'happy' || expr === 'cry') {
        if (expr === 'happy') p.push(`<path d="M${x - erx},${ey + 2} Q${x},${ey - ery * 1.1} ${x + erx},${ey + 2}" stroke="${EYE}" stroke-width="4" fill="none" stroke-linecap="round"/>`);
        else {
          p.push(`<path d="M${x - erx},${ey - 3} Q${x},${ey + ery * 0.7} ${x + erx},${ey - 3}" stroke="${EYE}" stroke-width="4" fill="none" stroke-linecap="round"/>`);
          p.push(`<path d="M${x + sgn * erx * 0.4},${ey + 6} q${sgn * 4},14 0,26 q${-sgn * 6},-8 0,-26z" fill="#8fd0ff"/>`);
        }
      } else if (expr === 'tired' || expr === 'sick') {
        p.push(`<path d="M${x - erx},${ey - 1} L${x + erx},${ey - 1}" stroke="${EYE}" stroke-width="3.5" stroke-linecap="round"/>`);
        p.push(`<path d="M${x - erx * 0.85},${ey} Q${x},${ey + ery * 1.1} ${x + erx * 0.85},${ey}Z" fill="${EYE}"/>`);
        p.push(`<path d="M${x - erx * 0.5},${ey + 2} Q${x},${ey + ery * 0.8} ${x + erx * 0.5},${ey + 2}Z" fill="${IRIS}"/>`);
      } else if (expr === 'surprise') {
        p.push(`<ellipse cx="${x}" cy="${ey}" rx="${erx * 1.05}" ry="${ery * 1.1}" fill="#fff" stroke="${EYE}" stroke-width="3"/>`);
        p.push(`<circle cx="${x}" cy="${ey + 2}" r="${erx * 0.45}" fill="${EYE}"/>`);
      } else {
        p.push(`<ellipse cx="${x}" cy="${ey}" rx="${erx}" ry="${ery}" fill="${EYE}"/>`);
        p.push(`<ellipse cx="${x}" cy="${ey + ery * 0.35}" rx="${erx * 0.75}" ry="${ery * 0.5}" fill="${IRIS}"/>`);
        p.push(`<circle cx="${x - erx * 0.35}" cy="${ey - ery * 0.38}" r="${erx * 0.38}" fill="#fff"/><circle cx="${x + erx * 0.35}" cy="${ey + ery * 0.4}" r="${erx * 0.16}" fill="#fff"/>`);
        p.push(`<path d="M${x - erx * 1.25},${ey - ery * 0.75} Q${x},${ey - ery * 1.35} ${x + erx * 1.25},${ey - ery * 0.75}" stroke="${EYE}" stroke-width="3" fill="none" stroke-linecap="round"/>`);
      }
      const by = ey - ery - hr * 0.13;
      if (expr === 'sulky') p.push(`<path d="M${x - erx * 1.1},${by + (sgn < 0 ? -3 : 3)} L${x + erx * 1.1},${by + (sgn < 0 ? 3 : -3)}" stroke="${EYE}" stroke-width="3" stroke-linecap="round"/>`);
      else if (expr === 'tired' || expr === 'sick' || expr === 'cry') p.push(`<path d="M${x - erx},${by + (sgn < 0 ? 3 : -2)} L${x + erx},${by + (sgn < 0 ? -2 : 3)}" stroke="${EYE}" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>`);
      else if (expr === 'surprise') p.push(`<path d="M${x - erx},${by - 6} Q${x},${by - 12} ${x + erx},${by - 6}" stroke="${EYE}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>`);
      else p.push(`<path d="M${x - erx},${by} Q${x},${by - 4} ${x + erx},${by}" stroke="${EYE}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>`);
    }
    const my = hy + hr * 0.6;
    if (expr === 'happy') p.push(`<path d="M${cx - hr * 0.16},${my - 3} Q${cx},${my + hr * 0.22} ${cx + hr * 0.16},${my - 3}Z" fill="#c9455b"/>`);
    else if (expr === 'sulky') p.push(`<path d="M${cx - hr * 0.1},${my + 3} Q${cx},${my - 5} ${cx + hr * 0.1},${my + 3}" stroke="#b5475a" stroke-width="3" fill="none" stroke-linecap="round"/>`);
    else if (expr === 'sick' || expr === 'cry') p.push(`<path d="M${cx - hr * 0.14},${my} q${hr * 0.07},-5 ${hr * 0.14},0 q${hr * 0.07},5 ${hr * 0.14},0" stroke="#b5475a" stroke-width="3" fill="none" stroke-linecap="round"/>`);
    else if (expr === 'tired') p.push(`<ellipse cx="${cx}" cy="${my}" rx="${hr * 0.07}" ry="${hr * 0.05}" fill="#b5475a"/>`);
    else if (expr === 'surprise') p.push(`<ellipse cx="${cx}" cy="${my + 2}" rx="${hr * 0.09}" ry="${hr * 0.12}" fill="#b5475a"/>`);
    else p.push(`<path d="M${cx - hr * 0.12},${my - 2} Q${cx},${my + 7} ${cx + hr * 0.12},${my - 2}" stroke="#b5475a" stroke-width="3" fill="none" stroke-linecap="round"/>`);
    return p.join('');
  }

  function neckAcc(id, cx, y) {
    if (id === 'pearl') return `<path d="M${cx - 20},${y - 4} Q${cx},${y + 16} ${cx + 20},${y - 4}" fill="none" stroke="#fff" stroke-width="0"/>${Array.from({ length: 9 }, (_, i) => { const t = i / 8; const x = cx - 20 + 40 * t; const yy = y - 4 + 40 * t * (1 - t); return `<circle cx="${x}" cy="${yy}" r="3.4" fill="#fbf6ff" stroke="#d8cfe8"/>`; }).join('')}`;
    if (id === 'locket') return `<path d="M${cx - 16},${y - 6} Q${cx},${y + 12} ${cx + 16},${y - 6}" fill="none" stroke="#c9ced8" stroke-width="2"/><ellipse cx="${cx}" cy="${y + 10}" rx="7" ry="9" fill="#dfe4ee" stroke="#9aa3b5" stroke-width="2"/><circle cx="${cx}" cy="${y + 10}" r="2.5" fill="#9aa3b5"/>`;
    if (id === 'brooch') return `<path d="M${cx},${y + 2} l4,9 l10,1 l-8,6 l3,10 l-9,-6 l-9,6 l3,-10 l-8,-6 l10,-1z" fill="#ffe066" stroke="#d4a017" stroke-width="1.5"/>`;
    return '';
  }

  function headAcc(acc, cx, hy, hr, of) {
    const top = hy - hr * 1.12;
    switch (acc) {
      case 'ribbon': return `<g transform="translate(${cx + hr * 0.62},${hy - hr * 0.88}) rotate(20)"><path d="M0,0 L-22,-14 L-22,14Z M0,0 L22,-14 L22,14Z" fill="#f05a7e" stroke="#c23b5d" stroke-width="2"/><circle r="6" fill="#ff8aa6"/></g>`;
      case 'bigribbon': return `<g transform="translate(${cx},${top + 4})"><path d="M0,0 L-34,-20 L-30,16Z M0,0 L34,-20 L30,16Z" fill="#7ec8f0" stroke="#4a92c0" stroke-width="2"/><circle r="8" fill="#a6dcf8"/></g>`;
      case 'hairpin': return `<g transform="translate(${cx + hr * 0.6},${hy - hr * 0.72})"><circle r="7" fill="#ffd166"/><circle cx="10" cy="4" r="5" fill="#ff8aa6"/></g>`;
      case 'flower': return `<g transform="translate(${cx + hr * 0.7},${hy - hr * 0.7})">${[0, 72, 144, 216, 288].map(a => `<ellipse rx="7" ry="11" transform="rotate(${a}) translate(0,-9)" fill="#ff7aa2"/>`).join('')}<circle r="6" fill="#ffd166"/></g>`;
      case 'crown': return `<path d="M${cx - 34},${top + 14} L${cx - 38},${top - 22} L${cx - 18},${top - 4} L${cx},${top - 30} L${cx + 18},${top - 4} L${cx + 38},${top - 22} L${cx + 34},${top + 14}Z" fill="#f2c94c" stroke="#b8902a" stroke-width="3"/><circle cx="${cx}" cy="${top - 2}" r="6" fill="#e24a6a"/>`;
      case 'tiara': return `<path d="M${cx - 36},${top + 16} Q${cx},${top - 4} ${cx + 36},${top + 16} L${cx + 26},${top + 6} L${cx + 14},${top - 6} L${cx},${top - 18} L${cx - 14},${top - 6} L${cx - 26},${top + 6}Z" fill="#e6ecf5" stroke="#9aa8c0" stroke-width="2.5"/><circle cx="${cx}" cy="${top - 6}" r="5" fill="#7ec8f0"/>`;
      case 'halo': return `<ellipse cx="${cx}" cy="${top - 18}" rx="40" ry="10" fill="none" stroke="#ffe680" stroke-width="7" opacity=".9"/>`;
      case 'hat': case 'magehat': return `<path d="M${cx - hr * 1.5},${top + 18} Q${cx},${top + 36} ${cx + hr * 1.5},${top + 18} Q${cx},${top + 2} ${cx - hr * 1.5},${top + 18}Z M${cx - hr * 0.8},${top + 14} L${cx + 26},${top - 80} L${cx + hr * 0.8},${top + 14}Z" fill="${acc === 'magehat' ? '#4b3a8c' : of.col}" stroke="${acc === 'magehat' ? '#e8c547' : of.acc}" stroke-width="3"/><circle cx="${cx + 26}" cy="${top - 80}" r="6" fill="#e8c547"/>`;
      case 'witchhat': return `<path d="M${cx - hr * 1.6},${top + 20} Q${cx},${top + 38} ${cx + hr * 1.6},${top + 20} Q${cx},${top + 4} ${cx - hr * 1.6},${top + 20}Z M${cx - hr * 0.8},${top + 16} Q${cx - 6},${top - 60} ${cx + 40},${top - 70} Q${cx + 6},${top - 40} ${cx + hr * 0.8},${top + 16}Z" fill="#2d2340" stroke="#8f5cd6" stroke-width="3"/>`;
      case 'chefhat': return `<rect x="${cx - 32}" y="${top - 10}" width="64" height="22" rx="4" fill="#fff" stroke="#ddd" stroke-width="2"/><circle cx="${cx - 20}" cy="${top - 22}" r="20" fill="#fff" stroke="#ddd" stroke-width="2"/><circle cx="${cx + 20}" cy="${top - 22}" r="20" fill="#fff" stroke="#ddd" stroke-width="2"/><circle cx="${cx}" cy="${top - 34}" r="22" fill="#fff" stroke="#ddd" stroke-width="2"/>`;
      case 'strawhat': return `<ellipse cx="${cx}" cy="${top + 18}" rx="${hr * 1.6}" ry="16" fill="#e9c46a" stroke="#b8902a" stroke-width="2"/><path d="M${cx - hr * 0.85},${top + 16} Q${cx},${top - 40} ${cx + hr * 0.85},${top + 16}Z" fill="#e9c46a" stroke="#b8902a" stroke-width="2"/><rect x="${cx - hr * 0.85}" y="${top + 4}" width="${hr * 1.7}" height="9" fill="#e24a4a"/>`;
      case 'beret': return `<ellipse cx="${cx - 10}" cy="${top + 4}" rx="${hr * 1.05}" ry="22" fill="#c0392b" stroke="#8e2a20" stroke-width="2"/><circle cx="${cx - 10}" cy="${top - 16}" r="5" fill="#8e2a20"/>`;
      case 'veil': return `<path d="M${cx - hr * 0.9},${top + 14} Q${cx},${top - 16} ${cx + hr * 0.9},${top + 14} L${cx + hr * 1.5},${hy + hr * 2.4} L${cx - hr * 1.5},${hy + hr * 2.4}Z" fill="rgba(255,255,255,.55)" stroke="rgba(255,255,255,.9)" stroke-width="2"/>`;
      case 'nunveil': return `<path d="M${cx - hr * 1.1},${hy + hr * 0.2} Q${cx - hr * 1.2},${top - 10} ${cx},${top - 12} Q${cx + hr * 1.2},${top - 10} ${cx + hr * 1.1},${hy + hr * 0.2} L${cx + hr * 1.3},${hy + hr * 2} L${cx - hr * 1.3},${hy + hr * 2}Z" fill="#30324a"/><path d="M${cx - hr * 0.95},${hy - hr * 0.2} Q${cx},${top - 2} ${cx + hr * 0.95},${hy - hr * 0.2}" stroke="#fff" stroke-width="8" fill="none"/>`;
      case 'glasses': return `<g stroke="#5a4a3a" stroke-width="3" fill="rgba(255,255,255,.2)"><circle cx="${cx - hr * 0.38}" cy="${hy + hr * 0.18}" r="${hr * 0.25}"/><circle cx="${cx + hr * 0.38}" cy="${hy + hr * 0.18}" r="${hr * 0.25}"/><line x1="${cx - hr * 0.13}" y1="${hy + hr * 0.16}" x2="${cx + hr * 0.13}" y2="${hy + hr * 0.16}"/></g>`;
      case 'mask': return `<path d="M${cx - hr * 0.8},${hy + hr * 0.1} Q${cx},${hy - hr * 0.1} ${cx + hr * 0.8},${hy + hr * 0.1} L${cx + hr * 0.7},${hy + hr * 0.35} Q${cx},${hy + hr * 0.2} ${cx - hr * 0.7},${hy + hr * 0.35}Z" fill="#2a2a3a" opacity=".85"/>`;
      case 'catears': return `<path d="M${cx - hr * 0.75},${top + 22} l-6,-40 l34,22z M${cx + hr * 0.75},${top + 22} l6,-40 l-34,22z" fill="#3a3340" stroke="#222" stroke-width="2"/><path d="M${cx - hr * 0.72},${top + 14} l-3,-22 l18,12z M${cx + hr * 0.72},${top + 14} l3,-22 l-18,12z" fill="#ff9ab8"/>`;
      case 'feather': return `<ellipse cx="${cx - 6}" cy="${top + 8}" rx="${hr * 1.1}" ry="16" fill="#2e6b4a"/><path d="M${cx + hr * 0.4},${top} q30,-40 60,-46 q-20,30 -54,52z" fill="#e24a4a"/>`;
      case 'maidcap': return `<path d="M${cx - hr * 0.8},${top + 18} Q${cx},${top - 6} ${cx + hr * 0.8},${top + 18}" stroke="#fff" stroke-width="12" fill="none"/><path d="M${cx - hr * 0.8},${top + 18} Q${cx},${top - 6} ${cx + hr * 0.8},${top + 18}" stroke="#e8e0e0" stroke-width="3" fill="none" stroke-dasharray="6 4"/>`;
      default: return '';
    }
  }

  // ---------- 인물 상반신 ----------
  // n: { sex:'m'|'f', age:'kid'|'adult'|'old', hair, hs:'short'|'long'|'bun'|'bald'|'spiky'|'curly'|'messy', cloth, cloth2, beard, mustache, glasses, hat, skin, eye }
  function npc(n) {
    const skin = n.skin || '#ffe0c8', line = shade(skin, -0.18);
    const hair = n.hair || '#5a3a22', hairD = shade(hair, -0.3);
    const cloth = n.cloth || '#7a8aa0', cloth2 = n.cloth2 || '#fff';
    const kid = n.age === 'kid', old = n.age === 'old';
    const hy = kid ? 100 : 92, hr = kid ? 46 : 42;
    const p = [];
    // 어깨
    const sh = kid ? 58 : 70;
    p.push(`<path d="M${100 - sh},200 Q${100 - sh},${hy + 62} 100,${hy + 56} Q${100 + sh},${hy + 62} ${100 + sh},200Z" fill="${cloth}" stroke="${shade(cloth, -0.25)}" stroke-width="2"/>`);
    p.push(`<path d="M${100 - 22},${hy + 54} L100,${hy + 80} L${100 + 22},${hy + 54}" fill="${cloth2}" stroke="${shade(cloth2, -0.15)}" stroke-width="2"/>`);
    if (n.collar === 'priest') p.push(`<rect x="92" y="${hy + 52}" width="16" height="10" fill="#fff"/>`);
    if (n.necklace) p.push(`<path d="M76,${hy + 58} Q100,${hy + 84} 124,${hy + 58}" fill="none" stroke="#fbf6ff" stroke-width="5" stroke-dasharray="1 6" stroke-linecap="round"/>`);
    // 뒷머리
    if (n.hs === 'long' || n.hs === 'curly') {
      const len = hy + (n.hs === 'curly' ? 70 : 90);
      p.push(`<path d="M${100 - hr - 8},${hy} Q${100 - hr - 8},${hy - hr * 1.3} 100,${hy - hr * 1.25} Q${100 + hr + 8},${hy - hr * 1.3} ${100 + hr + 8},${hy} L${100 + hr + 14},${len} Q100,${len + 14} ${100 - hr - 14},${len}Z" fill="${hair}" stroke="${hairD}" stroke-width="2"/>`);
      if (n.hs === 'curly') for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) p.push(`<circle cx="${100 + sx * (hr + 8)}" cy="${hy + 20 + i * 18}" r="12" fill="${hair}" stroke="${hairD}" stroke-width="2"/>`);
    }
    if (n.hs === 'bun') p.push(`<circle cx="100" cy="${hy - hr - 10}" r="20" fill="${hair}" stroke="${hairD}" stroke-width="2"/>`);
    // 목·얼굴
    p.push(`<rect x="90" y="${hy + 30}" width="20" height="28" fill="${skin}"/>`);
    p.push(`<ellipse cx="100" cy="${hy}" rx="${hr * 0.92}" ry="${hr}" fill="${skin}" stroke="${line}" stroke-width="2"/>`);
    // 눈
    const ey = hy + 6, eye = n.eye || '#3a2b3a';
    for (const s of [-1, 1]) {
      const x = 100 + s * hr * 0.38;
      if (old) p.push(`<path d="M${x - 7},${ey} Q${x},${ey - 5} ${x + 7},${ey}" stroke="${eye}" stroke-width="3" fill="none" stroke-linecap="round"/>`);
      else if (n.sex === 'f' || kid) { p.push(`<ellipse cx="${x}" cy="${ey}" rx="${kid ? 6.5 : 6}" ry="${kid ? 9 : 8}" fill="${eye}"/><circle cx="${x - 2}" cy="${ey - 3}" r="2.4" fill="#fff"/>`); if (n.sex === 'f') p.push(`<path d="M${x - 8},${ey - 6} Q${x},${ey - 12} ${x + 8},${ey - 6}" stroke="${eye}" stroke-width="2.5" fill="none"/>`); }
      else p.push(`<ellipse cx="${x}" cy="${ey}" rx="5" ry="6" fill="${eye}"/><circle cx="${x - 1.5}" cy="${ey - 2}" r="1.8" fill="#fff"/>`);
      const bc = n.brow || (old ? '#bbb' : hairD);
      p.push(`<path d="M${x - 8},${ey - 15} Q${x},${ey - 19} ${x + 8},${ey - 15}" stroke="${bc}" stroke-width="${n.sex === 'm' ? 4 : 2.5}" fill="none" stroke-linecap="round"/>`);
    }
    if (n.patch) p.push(`<ellipse cx="${100 + hr * 0.38}" cy="${ey}" rx="10" ry="9" fill="#2a2a2a"/><line x1="${100 - hr * 0.9}" y1="${hy - 18}" x2="${100 + hr * 0.9}" y2="${hy - 4}" stroke="#2a2a2a" stroke-width="3"/>`);
    if (old) p.push(`<path d="M${100 - hr * 0.62},${ey + 14} q6,4 10,0 M${100 + hr * 0.62},${ey + 14} q-6,4 -10,0" stroke="${line}" stroke-width="2" fill="none"/>`);
    p.push(`<ellipse cx="${100 - hr * 0.55}" cy="${ey + 14}" rx="7" ry="4" fill="rgba(255,120,140,${n.sex === 'f' || kid ? 0.35 : 0.15})"/><ellipse cx="${100 + hr * 0.55}" cy="${ey + 14}" rx="7" ry="4" fill="rgba(255,120,140,${n.sex === 'f' || kid ? 0.35 : 0.15})"/>`);
    // 수염 · 입
    if (n.beard) p.push(`<path d="M${100 - hr * 0.8},${hy + 8} Q${100 - hr * 0.7},${hy + hr + 26} 100,${hy + hr + 30} Q${100 + hr * 0.7},${hy + hr + 26} ${100 + hr * 0.8},${hy + 8} Q100,${hy + 34} ${100 - hr * 0.8},${hy + 8}Z" fill="${n.beard}" stroke="${shade(n.beard, -0.2)}" stroke-width="2"/>`);
    if (n.mustache) p.push(`<path d="M100,${hy + 24} q-10,-6 -20,2 q10,4 20,-2z M100,${hy + 24} q10,-6 20,2 q-10,4 -20,-2z" fill="${n.mustache}"/>`);
    if (!n.beard) p.push(`<path d="M92,${hy + 28} Q100,${hy + 34} 108,${hy + 28}" stroke="#a5475a" stroke-width="3" fill="none" stroke-linecap="round"/>`);
    // 앞머리
    if (n.hs !== 'bald') {
      if (n.hs === 'spiky' || n.hs === 'messy') {
        p.push(`<path d="M${100 - hr - 4},${hy + 4} L${100 - hr - 10},${hy - hr * 0.6} L${100 - hr * 0.6},${hy - hr * 1.0} L${100 - hr * 0.5},${hy - hr * 1.35} L${100 - hr * 0.1},${hy - hr * 1.1} L${100 + hr * 0.2},${hy - hr * 1.4} L${100 + hr * 0.45},${hy - hr * 1.05} L${100 + hr * 0.9},${hy - hr * 1.2} L${100 + hr * 0.85},${hy - hr * 0.7} L${100 + hr + 10},${hy - hr * 0.5} L${100 + hr + 4},${hy + 4} Q${100 + hr * 0.6},${hy - hr * 0.5} ${100 + hr * 0.2},${hy - hr * 0.42} L100,${hy - hr * 0.6} L${100 - hr * 0.3},${hy - hr * 0.4} Q${100 - hr * 0.7},${hy - hr * 0.4} ${100 - hr - 4},${hy + 4}Z" fill="${hair}" stroke="${hairD}" stroke-width="2" stroke-linejoin="round"/>`);
      } else {
        const side = n.hs === 'short' ? 0.1 : 0.4;
        p.push(`<path d="M${100 - hr - 5},${hy + hr * side} Q${100 - hr - 8},${hy - hr * 1.2} 100,${hy - hr * 1.18} Q${100 + hr + 8},${hy - hr * 1.2} ${100 + hr + 5},${hy + hr * side} Q${100 + hr * 0.8},${hy - hr * 0.55} ${100 + hr * 0.3},${hy - hr * 0.55} Q100,${hy - hr * 0.3} ${100 - hr * 0.2},${hy - hr * 0.6} Q${100 - hr * 0.8},${hy - hr * 0.5} ${100 - hr - 5},${hy + hr * side}Z" fill="${hair}" stroke="${hairD}" stroke-width="2"/>`);
      }
    } else {
      p.push(`<path d="M${100 - hr - 2},${hy - 2} Q${100 - hr - 4},${hy - 22} ${100 - hr * 0.7},${hy - 26}" stroke="${hair}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${100 + hr + 2},${hy - 2} Q${100 + hr + 4},${hy - 22} ${100 + hr * 0.7},${hy - 26}" stroke="${hair}" stroke-width="9" fill="none" stroke-linecap="round"/>`);
      p.push(`<ellipse cx="${100 - 12}" cy="${hy - hr * 0.7}" rx="12" ry="6" fill="rgba(255,255,255,.5)"/>`);
    }
    if (n.glasses) p.push(`<g stroke="#5a4a3a" stroke-width="2.5" fill="rgba(255,255,255,.25)"><circle cx="${100 - hr * 0.38}" cy="${ey}" r="11"/><circle cx="${100 + hr * 0.38}" cy="${ey}" r="11"/><line x1="${100 - hr * 0.38 + 11}" y1="${ey}" x2="${100 + hr * 0.38 - 11}" y2="${ey}"/></g>`);
    // 모자
    const top = hy - hr * 1.1;
    const hats = {
      wizard: `<path d="M${100 - hr * 1.5},${top + 20} Q100,${top + 36} ${100 + hr * 1.5},${top + 20} Q100,${top + 4} ${100 - hr * 1.5},${top + 20}Z M${100 - hr * 0.8},${top + 16} Q94,${top - 60} ${140},${top - 66} Q106,${top - 36} ${100 + hr * 0.8},${top + 16}Z" fill="${n.hatCol || '#4b3a8c'}" stroke="#e8c547" stroke-width="3"/>`,
      tiara: `<path d="M${100 - 30},${top + 16} Q100,${top} ${100 + 30},${top + 16} L${100 + 20},${top + 6} L100,${top - 12} L${100 - 20},${top + 6}Z" fill="#f2c94c" stroke="#b8902a" stroke-width="2"/><circle cx="100" cy="${top + 2}" r="5" fill="#e24a6a"/>`,
      straw: `<ellipse cx="100" cy="${top + 18}" rx="${hr * 1.6}" ry="15" fill="#e9c46a" stroke="#b8902a" stroke-width="2"/><path d="M${100 - hr * 0.85},${top + 16} Q100,${top - 36} ${100 + hr * 0.85},${top + 16}Z" fill="#e9c46a" stroke="#b8902a" stroke-width="2"/>`,
      beret: `<ellipse cx="94" cy="${top + 6}" rx="${hr * 1.05}" ry="18" fill="${n.hatCol || '#2e6b4a'}"/><circle cx="94" cy="${top - 10}" r="4" fill="${shade(n.hatCol || '#2e6b4a', -0.3)}"/>`,
      feather: `<ellipse cx="94" cy="${top + 8}" rx="${hr * 1.1}" ry="15" fill="${n.hatCol || '#2e6b4a'}"/><path d="M${100 + hr * 0.4},${top} q30,-36 56,-40 q-20,28 -50,46z" fill="#e24a4a"/>`,
      scarf: `<path d="M${100 - hr - 6},${hy + 10} Q${100 - hr - 8},${top - 6} 100,${top - 8} Q${100 + hr + 8},${top - 6} ${100 + hr + 6},${hy + 10} Q100,${hy - hr * 0.7} ${100 - hr - 6},${hy + 10}Z" fill="${n.hatCol || '#c0392b'}"/>`,
      hood: `<path d="M${100 - hr - 12},${hy + 40} Q${100 - hr - 16},${top - 14} 100,${top - 16} Q${100 + hr + 16},${top - 14} ${100 + hr + 12},${hy + 40} L${100 + hr},${hy + 10} Q100,${hy - hr * 0.9} ${100 - hr},${hy + 10}Z" fill="${n.hatCol || '#6b4f2e'}"/>`,
      chef: `<rect x="${100 - 30}" y="${top - 6}" width="60" height="20" rx="4" fill="#fff" stroke="#ddd" stroke-width="2"/><circle cx="82" cy="${top - 18}" r="18" fill="#fff" stroke="#ddd" stroke-width="2"/><circle cx="118" cy="${top - 18}" r="18" fill="#fff" stroke="#ddd" stroke-width="2"/><circle cx="100" cy="${top - 28}" r="20" fill="#fff" stroke="#ddd" stroke-width="2"/>`,
      cap: `<path d="M${100 - hr * 0.95},${top + 22} Q100,${top - 18} ${100 + hr * 0.95},${top + 22}Z" fill="${n.hatCol || '#fff'}" stroke="#ccc" stroke-width="2"/>`,
    };
    if (n.hat && hats[n.hat]) p.push(hats[n.hat]);
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${p.join('')}</svg>`;
  }

  // ---------- 방 ----------
  // season: 0 봄 1 여름 2 가을 3 겨울
  function room(season, night) {
    const sky = night ? ['#1d2557', '#4a3f8a'] : [['#9fd8f8', '#e2f4ff'], ['#6cc4f2', '#cdeeff'], ['#f5c28a', '#fde7c8'], ['#b8c6d8', '#eef2f7']][season || 0];
    const tree = [
      '<circle cx="190" cy="150" r="22" fill="#ffc0d4"/><circle cx="210" cy="140" r="16" fill="#ffd4e2"/><circle cx="250" cy="150" r="20" fill="#ffc0d4"/>',
      '<circle cx="195" cy="148" r="24" fill="#5cbf6a"/><circle cx="250" cy="148" r="22" fill="#4fae5e"/>',
      '<circle cx="195" cy="148" r="22" fill="#e9893a"/><circle cx="248" cy="150" r="22" fill="#d9673a"/><circle cx="220" cy="140" r="14" fill="#f2b33a"/>',
      '<path d="M170,160 L270,160 L270,150 Q220,138 170,152Z" fill="#fff"/><circle cx="190" cy="80" r="3" fill="#fff"/><circle cx="240" cy="96" r="3" fill="#fff"/><circle cx="215" cy="120" r="3" fill="#fff"/><circle cx="255" cy="70" r="3" fill="#fff"/>',
    ][season || 0];
    return `<svg viewBox="0 0 300 420" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf1dc"/><stop offset="1" stop-color="#f6e2c4"/></linearGradient>
      <linearGradient id="sky${season}${night ? 'n' : ''}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>
      <clipPath id="win"><rect x="170" y="40" width="100" height="120" rx="50"/></clipPath></defs>
      <rect width="300" height="420" fill="url(#wall)"/>
      <g opacity=".35" stroke="#e8cfa8" stroke-width="2">${Array.from({ length: 8 }, (_, i) => `<line x1="${i * 40 + 10}" y1="0" x2="${i * 40 + 10}" y2="330"/>`).join('')}</g>
      <rect x="170" y="40" width="100" height="120" rx="50" fill="url(#sky${season}${night ? 'n' : ''})"/>
      <g clip-path="url(#win)">${night ? '<circle cx="245" cy="70" r="10" fill="#fff6c2"/><circle cx="190" cy="80" r="2" fill="#fff"/><circle cx="200" cy="130" r="2" fill="#fff"/>' : '<circle cx="245" cy="70" r="12" fill="#fff3a0"/>'}${tree}</g>
      <rect x="170" y="40" width="100" height="120" rx="50" fill="none" stroke="#b07a4a" stroke-width="6"/>
      <line x1="220" y1="40" x2="220" y2="160" stroke="#b07a4a" stroke-width="4"/><line x1="170" y1="105" x2="270" y2="105" stroke="#b07a4a" stroke-width="4"/>
      <rect x="20" y="70" width="80" height="10" rx="3" fill="#b07a4a"/>
      <rect x="28" y="50" width="12" height="20" fill="#e06666"/><rect x="42" y="46" width="10" height="24" fill="#4fa3e0"/><rect x="54" y="52" width="12" height="18" fill="#58c7b8"/><circle cx="82" cy="60" r="10" fill="#f2c94c"/>
      <rect x="20" y="170" width="70" height="90" rx="6" fill="#e9d2b0" stroke="#b07a4a" stroke-width="3"/><path d="M30,250 l10,-40 l14,24 l12,-30 l14,46z" fill="#9cc7a8" opacity=".8"/>
      <rect y="330" width="300" height="90" fill="#c99a6b"/><rect y="330" width="300" height="6" fill="#a87a4e"/>
      <ellipse cx="150" cy="392" rx="120" ry="22" fill="#e8a0b4" opacity=".55"/>
    </svg>`;
  }

  // 딸 얼굴만 (대화창용)
  function portrait(o) {
    const B = BODY[o.stage || 0];
    return girl(o).replace('viewBox="0 -40 300 460"', `viewBox="${150 - 92} ${B.hy - B.hr * 1.45} 184 184"`);
  }

  return { girl, portrait, npc, room, shade };
})();

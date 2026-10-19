// ===== 딸 그림 (SVG) =====
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

  function girl(o) {
    const stage = o.stage || 0;
    const B = BODY[stage];
    const hair = o.hair || '#7a4a2a';
    const hairD = shade(hair, -0.28);
    const of = OUTFIT[o.outfit] || OUTFIT.basic;
    const col = of.col, colD = shade(col, -0.22), acc = of.acc;
    const expr = o.expr || 'normal';
    const cx = 150, hr = B.hr, hy = B.hy;
    const p = [];

    // 그림자
    p.push(`<ellipse cx="${cx}" cy="${B.foot + 6}" rx="70" ry="9" fill="rgba(0,0,0,.18)"/>`);

    // 망토(갑옷)
    if (of.style === 'armor') {
      p.push(`<path d="M${cx - B.sh * 0.6},${B.neck + 10} Q${cx - B.sh * 1.2},${B.foot - 30} ${cx - B.sh * 0.9},${B.foot - 4} L${cx + B.sh * 0.9},${B.foot - 4} Q${cx + B.sh * 1.2},${B.foot - 30} ${cx + B.sh * 0.6},${B.neck + 10}Z" fill="#b53a4a"/>`);
    }

    // 뒷머리
    const hairLen = [hy + hr * 1.05, B.waist - 10, B.waist + 34][stage];
    const hw = hr * 1.08 + (stage === 0 ? 2 : 6);
    p.push(`<path d="M${cx - hw},${hy} Q${cx - hw - 2},${hy - hr * 1.25} ${cx},${hy - hr * 1.22} Q${cx + hw + 2},${hy - hr * 1.25} ${cx + hw},${hy} L${cx + hw + (stage ? 8 : 2)},${hairLen} Q${cx + hw * 0.5},${hairLen + 14} ${cx},${hairLen - 4} Q${cx - hw * 0.5},${hairLen + 14} ${cx - hw - (stage ? 8 : 2)},${hairLen}Z" fill="${hair}" stroke="${hairD}" stroke-width="2"/>`);
    if (stage === 0) {
      // 양갈래
      p.push(`<path d="M${cx - hw + 2},${hy - 4} q-30,30 -18,96 q8,-30 30,-70z" fill="${hair}" stroke="${hairD}" stroke-width="2"/>`);
      p.push(`<path d="M${cx + hw - 2},${hy - 4} q30,30 18,96 q-8,-30 -30,-70z" fill="${hair}" stroke="${hairD}" stroke-width="2"/>`);
    }

    // 다리
    const longSkirt = of.style === 'gown' || of.style === 'robe';
    const legTop = B.hem - 12;
    const legCol = of.style === 'train' || of.style === 'armor' ? shade(acc === '#e8c547' ? '#5a6b80' : acc, 0) : '#fdfdfd';
    if (!longSkirt) {
      p.push(`<rect x="${cx - 24}" y="${legTop}" width="16" height="${B.foot - legTop - 6}" rx="7" fill="${legCol}" stroke="${SKIN_LINE}" stroke-width="1"/>`);
      p.push(`<rect x="${cx + 8}" y="${legTop}" width="16" height="${B.foot - legTop - 6}" rx="7" fill="${legCol}" stroke="${SKIN_LINE}" stroke-width="1"/>`);
    }
    const shoe = of.style === 'armor' ? '#6b7a8c' : of.style === 'train' ? '#5a3c22' : '#7a3b52';
    p.push(`<ellipse cx="${cx - 17}" cy="${B.foot - 3}" rx="14" ry="7" fill="${shoe}"/><ellipse cx="${cx + 17}" cy="${B.foot - 3}" rx="14" ry="7" fill="${shoe}"/>`);

    // 몸통 + 치마
    const sw = B.sh * 0.56, ww = B.sh * 0.38, top = B.neck + 6;
    const bodice = `M${cx - sw},${top + 6} Q${cx},${top - 4} ${cx + sw},${top + 6} L${cx + ww},${B.waist} L${cx - ww},${B.waist}Z`;
    if (of.style === 'gown') {
      const hem = B.foot - 6, fw = B.sh * 1.25;
      p.push(`<path d="M${cx - ww},${B.waist - 2} Q${cx - fw * 0.7},${hem - 40} ${cx - fw},${hem} Q${cx},${hem + 12} ${cx + fw},${hem} Q${cx + fw * 0.7},${hem - 40} ${cx + ww},${B.waist - 2}Z" fill="${col}" stroke="${colD}" stroke-width="2"/>`);
      p.push(`<path d="M${cx - fw + 4},${hem - 6} Q${cx},${hem + 8} ${cx + fw - 4},${hem - 6}" stroke="${acc}" stroke-width="6" fill="none" stroke-linecap="round"/>`);
      p.push(`<path d="M${cx - fw * 0.55},${hem - 30} Q${cx - fw * 0.3},${B.waist + 40} ${cx - ww * 0.4},${B.waist + 4}" stroke="${shade(col, 0.25)}" stroke-width="3" fill="none"/>`);
      p.push(`<path d="M${cx + fw * 0.5},${hem - 26} Q${cx + fw * 0.25},${B.waist + 50} ${cx + ww * 0.5},${B.waist + 6}" stroke="${shade(col, 0.25)}" stroke-width="3" fill="none"/>`);
      if (of.id === 'star') for (let i = 0; i < 9; i++) {
        const sx = cx - fw * 0.7 + (i * 37 % (fw * 1.4)), sy = B.waist + 25 + (i * 53 % (hem - B.waist - 40));
        p.push(`<circle cx="${sx}" cy="${sy}" r="2.4" fill="#ffe680"/>`);
      }
      p.push(`<path d="${bodice}" fill="${col}" stroke="${colD}" stroke-width="2"/>`);
    } else if (of.style === 'robe') {
      const hem = B.foot - 6, fw = B.sh * 0.95;
      p.push(`<path d="M${cx - sw},${top + 6} Q${cx},${top - 4} ${cx + sw},${top + 6} L${cx + fw},${hem} Q${cx},${hem + 8} ${cx - fw},${hem}Z" fill="${col}" stroke="${colD}" stroke-width="2"/>`);
      p.push(`<path d="M${cx - fw + 3},${hem - 4} Q${cx},${hem + 6} ${cx + fw - 3},${hem - 4}" stroke="${acc}" stroke-width="7" fill="none"/>`);
      p.push(`<line x1="${cx}" y1="${top + 10}" x2="${cx}" y2="${hem}" stroke="${acc}" stroke-width="5"/>`);
      p.push(`<rect x="${cx - ww - 2}" y="${B.waist - 6}" width="${ww * 2 + 4}" height="9" rx="4" fill="${shade(col, -0.35)}"/>`);
    } else {
      const shortH = of.style === 'train' || of.style === 'armor';
      const hem = shortH ? B.waist + (B.hem - B.waist) * 0.55 : B.hem, fw = B.sh * (shortH ? 0.62 : 0.95);
      p.push(`<path d="M${cx - ww},${B.waist - 2} Q${cx - fw * 0.8},${hem - 30} ${cx - fw},${hem} Q${cx},${hem + 10} ${cx + fw},${hem} Q${cx + fw * 0.8},${hem - 30} ${cx + ww},${B.waist - 2}Z" fill="${col}" stroke="${colD}" stroke-width="2"/>`);
      if (!shortH) p.push(`<path d="M${cx - fw + 4},${hem - 3} Q${cx},${hem + 9} ${cx + fw - 4},${hem - 3}" stroke="${shade(col, 0.45)}" stroke-width="5" fill="none"/>`);
      p.push(`<path d="${bodice}" fill="${col}" stroke="${colD}" stroke-width="2"/>`);
      if (of.style === 'apron') {
        p.push(`<path d="M${cx - ww * 0.8},${B.waist} L${cx + ww * 0.8},${B.waist} L${cx + fw * 0.62},${hem - 6} Q${cx},${hem + 2} ${cx - fw * 0.62},${hem - 6}Z" fill="#fff" stroke="#e6d8d8" stroke-width="2"/>`);
        p.push(`<rect x="${cx - ww * 0.62}" y="${top + 16}" width="${ww * 1.24}" height="${B.waist - top - 16}" rx="4" fill="#fff" stroke="#e6d8d8" stroke-width="2"/>`);
        p.push(`<rect x="${cx - ww - 4}" y="${B.waist - 5}" width="${ww * 2 + 8}" height="8" rx="4" fill="${acc === '#ffffff' ? '#f4b6b6' : acc}"/>`);
      }
      if (of.style === 'train') {
        p.push(`<rect x="${cx - ww - 3}" y="${B.waist - 6}" width="${ww * 2 + 6}" height="10" rx="3" fill="${acc}"/><rect x="${cx - 7}" y="${B.waist - 7}" width="14" height="12" rx="2" fill="#e8c547"/>`);
      }
      if (of.style === 'armor') {
        p.push(`<path d="M${cx - sw + 6},${top + 12} Q${cx},${top + 2} ${cx + sw - 6},${top + 12} L${cx + ww - 2},${B.waist - 4} Q${cx},${B.waist + 6} ${cx - ww + 2},${B.waist - 4}Z" fill="#cdd8e4" stroke="#7d8ea3" stroke-width="2"/>`);
        p.push(`<path d="M${cx},${top + 20} l-8,14 l8,12 l8,-12z" fill="${acc}"/>`);
        p.push(`<ellipse cx="${cx - sw}" cy="${top + 10}" rx="15" ry="10" fill="#cdd8e4" stroke="#7d8ea3" stroke-width="2"/><ellipse cx="${cx + sw}" cy="${top + 10}" rx="15" ry="10" fill="#cdd8e4" stroke="#7d8ea3" stroke-width="2"/>`);
      }
      if (of.style === 'dress') {
        p.push(`<path d="M${cx - 18},${top + 2} Q${cx},${top + 20} ${cx + 18},${top + 2}" fill="${acc}" stroke="${shade(acc, -0.1)}" stroke-width="2"/>`);
        p.push(`<circle cx="${cx}" cy="${top + 22}" r="5" fill="${acc === '#ffffff' ? '#f07fb4' : acc}"/>`);
      }
    }
    if (of.style === 'gown') {
      p.push(`<path d="M${cx - sw + 4},${top + 8} Q${cx},${top + 26} ${cx + sw - 4},${top + 8}" stroke="${acc}" stroke-width="5" fill="none"/>`);
    }

    // 팔
    const sl = [cx - sw + 2, top + 10], sr = [cx + sw - 2, top + 10];
    const hl = [cx - sw - 16, B.waist + 14], hrr = [cx + sw + 16, B.waist + 14];
    const sleeve = of.style === 'armor' ? '#cdd8e4' : col;
    for (const [s0, h] of [[sl, hl], [sr, hrr]]) {
      const ex = (s0[0] + h[0]) / 2 + (h[0] < cx ? -6 : 6), ey = (s0[1] + h[1]) / 2;
      p.push(`<path d="M${s0[0]},${s0[1]} Q${ex},${ey} ${h[0]},${h[1] - 10}" stroke="${shade(sleeve, -0.25)}" stroke-width="19" fill="none" stroke-linecap="round"/>`);
      p.push(`<path d="M${s0[0]},${s0[1]} Q${ex},${ey} ${h[0]},${h[1] - 10}" stroke="${sleeve}" stroke-width="15" fill="none" stroke-linecap="round"/>`);
      p.push(`<circle cx="${h[0]}" cy="${h[1]}" r="9" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="1.5"/>`);
    }
    if (of.style === 'gown' || of.style === 'dress') {
      p.push(`<ellipse cx="${sl[0] - 2}" cy="${sl[1] + 4}" rx="14" ry="11" fill="${shade(col, 0.15)}" stroke="${colD}" stroke-width="1.5"/>`);
      p.push(`<ellipse cx="${sr[0] + 2}" cy="${sr[1] + 4}" rx="14" ry="11" fill="${shade(col, 0.15)}" stroke="${colD}" stroke-width="1.5"/>`);
    }

    // 목
    p.push(`<rect x="${cx - 9}" y="${hy + hr * 0.8}" width="18" height="${B.neck - hy - hr * 0.8 + 10}" fill="${SKIN}"/>`);

    // 들고 있는 것
    if (o.acc === 'sword') p.push(`<g transform="translate(${hrr[0]},${hrr[1]}) rotate(-20)"><rect x="-3" y="-110" width="7" height="104" rx="2" fill="#e6edf5" stroke="#8a9bb0"/><rect x="-14" y="-8" width="29" height="7" rx="3" fill="#c79a2c"/><rect x="-3" y="-1" width="7" height="22" rx="2" fill="#6b4226"/></g>`);
    if (o.acc === 'violin') p.push(`<g transform="translate(${hl[0] + 10},${hl[1] - 30}) rotate(-35)"><ellipse cx="0" cy="0" rx="16" ry="24" fill="#a85a2a"/><rect x="-3" y="-60" width="6" height="40" fill="#5a2f14"/></g>`);
    if (o.acc === 'coin') p.push(`<circle cx="${hrr[0]}" cy="${hrr[1] - 4}" r="12" fill="#f2c94c" stroke="#b8902a" stroke-width="3"/>`);

    // 얼굴
    p.push(`<ellipse cx="${cx}" cy="${hy}" rx="${hr * 0.93}" ry="${hr}" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2"/>`);
    p.push(face(cx, hy, hr, expr, stage));

    // 앞머리
    const b = hy - hr * 0.08;
    p.push(`<path d="M${cx - hr - 5},${hy + hr * 0.25} Q${cx - hr - 8},${hy - hr * 1.18} ${cx},${hy - hr * 1.15} Q${cx + hr + 8},${hy - hr * 1.18} ${cx + hr + 5},${hy + hr * 0.25} Q${cx + hr * 0.82},${b - hr * 0.1} ${cx + hr * 0.7},${b - hr * 0.3} Q${cx + hr * 0.5},${b} ${cx + hr * 0.38},${b + hr * 0.02} Q${cx + hr * 0.3},${b - hr * 0.25} ${cx + hr * 0.12},${b - hr * 0.35} Q${cx},${b} ${cx - hr * 0.12},${b + hr * 0.04} Q${cx - hr * 0.22},${b - hr * 0.28} ${cx - hr * 0.42},${b - hr * 0.3} Q${cx - hr * 0.55},${b} ${cx - hr * 0.68},${b + hr * 0.02} Q${cx - hr * 0.8},${b - hr * 0.2} ${cx - hr - 5},${hy + hr * 0.25}Z" fill="${hair}" stroke="${hairD}" stroke-width="2" stroke-linejoin="round"/>`);
    p.push(`<path d="M${cx - hr * 0.55},${hy - hr * 0.85} Q${cx - hr * 0.1},${hy - hr * 1.02} ${cx + hr * 0.3},${hy - hr * 0.9}" stroke="rgba(255,255,255,.45)" stroke-width="5" fill="none" stroke-linecap="round"/>`);
    // 옆머리
    p.push(`<path d="M${cx - hr - 4},${hy - hr * 0.2} Q${cx - hr - 2},${hy + hr * 0.7} ${cx - hr * 0.72},${hy + hr * 1.02} Q${cx - hr * 0.86},${hy + hr * 0.3} ${cx - hr * 0.78},${hy - hr * 0.1}Z" fill="${hair}" stroke="${hairD}" stroke-width="1.5"/>`);
    p.push(`<path d="M${cx + hr + 4},${hy - hr * 0.2} Q${cx + hr + 2},${hy + hr * 0.7} ${cx + hr * 0.72},${hy + hr * 1.02} Q${cx + hr * 0.86},${hy + hr * 0.3} ${cx + hr * 0.78},${hy - hr * 0.1}Z" fill="${hair}" stroke="${hairD}" stroke-width="1.5"/>`);

    // 머리 장식
    p.push(headAcc(o.acc || (stage === 0 ? 'ribbon' : stage === 1 ? 'hairpin' : 'none'), cx, hy, hr, of));
    if (expr === 'sick') p.push(`<rect x="${cx - hr * 0.5}" y="${hy - hr * 0.72}" width="${hr}" height="${hr * 0.28}" rx="6" fill="#fff" stroke="#cfd8e0" stroke-width="2"/>`);
    if (expr === 'tired') p.push(`<path d="M${cx + hr * 0.85},${hy - hr * 0.35} q6,10 0,16 q-6,-6 0,-16z" fill="#8fd0ff"/>`);
    return `<svg viewBox="0 -40 300 460" xmlns="http://www.w3.org/2000/svg">${p.join('')}</svg>`;
  }

  function face(cx, hy, hr, expr, stage) {
    const p = [];
    const ey = hy + hr * 0.18, ex = hr * 0.38;
    const erx = hr * (0.15 + (2 - stage) * 0.012), ery = hr * (0.21 + (2 - stage) * 0.015);
    // 볼
    const blush = expr === 'sick' ? 'rgba(240,80,90,.55)' : 'rgba(255,130,150,.35)';
    p.push(`<ellipse cx="${cx - hr * 0.58}" cy="${ey + hr * 0.3}" rx="${hr * 0.17}" ry="${hr * 0.09}" fill="${blush}"/><ellipse cx="${cx + hr * 0.58}" cy="${ey + hr * 0.3}" rx="${hr * 0.17}" ry="${hr * 0.09}" fill="${blush}"/>`);
    for (const sgn of [-1, 1]) {
      const x = cx + sgn * ex;
      if (expr === 'happy') {
        p.push(`<path d="M${x - erx},${ey + 2} Q${x},${ey - ery * 1.1} ${x + erx},${ey + 2}" stroke="${EYE}" stroke-width="4" fill="none" stroke-linecap="round"/>`);
      } else if (expr === 'tired' || expr === 'sick') {
        p.push(`<path d="M${x - erx},${ey - 1} L${x + erx},${ey - 1}" stroke="${EYE}" stroke-width="3.5" stroke-linecap="round"/>`);
        p.push(`<path d="M${x - erx * 0.85},${ey} Q${x},${ey + ery * 1.1} ${x + erx * 0.85},${ey}Z" fill="${EYE}"/>`);
        p.push(`<path d="M${x - erx * 0.5},${ey + 2} Q${x},${ey + ery * 0.8} ${x + erx * 0.5},${ey + 2}Z" fill="${IRIS}"/>`);
      } else {
        p.push(`<ellipse cx="${x}" cy="${ey}" rx="${erx}" ry="${ery}" fill="${EYE}"/>`);
        p.push(`<ellipse cx="${x}" cy="${ey + ery * 0.35}" rx="${erx * 0.75}" ry="${ery * 0.5}" fill="${IRIS}"/>`);
        p.push(`<circle cx="${x - erx * 0.35}" cy="${ey - ery * 0.38}" r="${erx * 0.38}" fill="#fff"/><circle cx="${x + erx * 0.35}" cy="${ey + ery * 0.4}" r="${erx * 0.16}" fill="#fff"/>`);
        p.push(`<path d="M${x - erx * 1.25},${ey - ery * 0.75} Q${x},${ey - ery * 1.35} ${x + erx * 1.25},${ey - ery * 0.75}" stroke="${EYE}" stroke-width="3" fill="none" stroke-linecap="round"/>`);
      }
      // 눈썹
      const by = ey - ery - hr * 0.13;
      if (expr === 'sulky') p.push(`<path d="M${x - erx * 1.1},${by - sgn * 0 - 3} L${x + erx * 1.1},${by + 3}" transform="${sgn > 0 ? `scale(-1,1) translate(${-2 * x},0)` : ''}" stroke="${EYE}" stroke-width="3" stroke-linecap="round"/>`);
      else if (expr === 'tired' || expr === 'sick') p.push(`<path d="M${x - erx},${by + (sgn < 0 ? 3 : -2)} L${x + erx},${by + (sgn < 0 ? -2 : 3)}" stroke="${EYE}" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>`);
      else p.push(`<path d="M${x - erx},${by} Q${x},${by - 4} ${x + erx},${by}" stroke="${EYE}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>`);
    }
    // 입
    const my = hy + hr * 0.6;
    if (expr === 'happy') p.push(`<path d="M${cx - hr * 0.16},${my - 3} Q${cx},${my + hr * 0.22} ${cx + hr * 0.16},${my - 3}Z" fill="#c9455b"/>`);
    else if (expr === 'sulky') p.push(`<path d="M${cx - hr * 0.1},${my + 3} Q${cx},${my - 5} ${cx + hr * 0.1},${my + 3}" stroke="#b5475a" stroke-width="3" fill="none" stroke-linecap="round"/>`);
    else if (expr === 'sick') p.push(`<path d="M${cx - hr * 0.14},${my} q${hr * 0.07},-5 ${hr * 0.14},0 q${hr * 0.07},5 ${hr * 0.14},0" stroke="#b5475a" stroke-width="3" fill="none" stroke-linecap="round"/>`);
    else if (expr === 'tired') p.push(`<ellipse cx="${cx}" cy="${my}" rx="${hr * 0.07}" ry="${hr * 0.05}" fill="#b5475a"/>`);
    else p.push(`<path d="M${cx - hr * 0.12},${my - 2} Q${cx},${my + 7} ${cx + hr * 0.12},${my - 2}" stroke="#b5475a" stroke-width="3" fill="none" stroke-linecap="round"/>`);
    return p.join('');
  }

  function headAcc(acc, cx, hy, hr, of) {
    const top = hy - hr * 1.12;
    switch (acc) {
      case 'ribbon': return `<g transform="translate(${cx + hr * 0.62},${hy - hr * 0.88}) rotate(20)"><path d="M0,0 L-22,-14 L-22,14Z M0,0 L22,-14 L22,14Z" fill="#f05a7e" stroke="#c23b5d" stroke-width="2"/><circle r="6" fill="#ff8aa6"/></g>`;
      case 'hairpin': return `<g transform="translate(${cx + hr * 0.6},${hy - hr * 0.72})"><circle r="7" fill="#ffd166"/><circle cx="10" cy="4" r="5" fill="#ff8aa6"/></g>`;
      case 'flower': return `<g transform="translate(${cx + hr * 0.7},${hy - hr * 0.7})">${[0, 72, 144, 216, 288].map(a => `<ellipse rx="7" ry="11" transform="rotate(${a}) translate(0,-9)" fill="#ff7aa2"/>`).join('')}<circle r="6" fill="#ffd166"/></g>`;
      case 'crown': return `<path d="M${cx - 34},${top + 14} L${cx - 38},${top - 22} L${cx - 18},${top - 4} L${cx},${top - 30} L${cx + 18},${top - 4} L${cx + 38},${top - 22} L${cx + 34},${top + 14}Z" fill="#f2c94c" stroke="#b8902a" stroke-width="3"/><circle cx="${cx}" cy="${top - 2}" r="6" fill="#e24a6a"/>`;
      case 'halo': return `<ellipse cx="${cx}" cy="${top - 18}" rx="40" ry="10" fill="none" stroke="#ffe680" stroke-width="7" opacity=".9"/>`;
      case 'hat': return `<path d="M${cx - hr * 1.5},${top + 18} Q${cx},${top + 36} ${cx + hr * 1.5},${top + 18} Q${cx},${top + 2} ${cx - hr * 1.5},${top + 18}Z M${cx - hr * 0.8},${top + 14} L${cx + 26},${top - 80} L${cx + hr * 0.8},${top + 14}Z" fill="${of.col}" stroke="${of.acc}" stroke-width="3"/><circle cx="${cx + 26}" cy="${top - 80}" r="6" fill="${of.acc}"/>`;
      case 'witchhat': return `<path d="M${cx - hr * 1.6},${top + 20} Q${cx},${top + 38} ${cx + hr * 1.6},${top + 20} Q${cx},${top + 4} ${cx - hr * 1.6},${top + 20}Z M${cx - hr * 0.8},${top + 16} Q${cx - 6},${top - 60} ${cx + 40},${top - 70} Q${cx + 6},${top - 40} ${cx + hr * 0.8},${top + 16}Z" fill="#2d2340" stroke="#8f5cd6" stroke-width="3"/>`;
      case 'chefhat': return `<rect x="${cx - 32}" y="${top - 10}" width="64" height="22" rx="4" fill="#fff" stroke="#ddd" stroke-width="2"/><circle cx="${cx - 20}" cy="${top - 22}" r="20" fill="#fff" stroke="#ddd" stroke-width="2"/><circle cx="${cx + 20}" cy="${top - 22}" r="20" fill="#fff" stroke="#ddd" stroke-width="2"/><circle cx="${cx}" cy="${top - 34}" r="22" fill="#fff" stroke="#ddd" stroke-width="2"/>`;
      case 'strawhat': return `<ellipse cx="${cx}" cy="${top + 18}" rx="${hr * 1.6}" ry="16" fill="#e9c46a" stroke="#b8902a" stroke-width="2"/><path d="M${cx - hr * 0.85},${top + 16} Q${cx},${top - 40} ${cx + hr * 0.85},${top + 16}Z" fill="#e9c46a" stroke="#b8902a" stroke-width="2"/><rect x="${cx - hr * 0.85}" y="${top + 4}" width="${hr * 1.7}" height="9" fill="#e24a4a"/>`;
      case 'beret': return `<ellipse cx="${cx - 10}" cy="${top + 4}" rx="${hr * 1.05}" ry="22" fill="#c0392b" stroke="#8e2a20" stroke-width="2"/><circle cx="${cx - 10}" cy="${top - 16}" r="5" fill="#8e2a20"/>`;
      case 'veil': return `<path d="M${cx - hr * 0.9},${top + 14} Q${cx},${top - 16} ${cx + hr * 0.9},${top + 14} L${cx + hr * 1.5},${hy + hr * 2.4} L${cx - hr * 1.5},${hy + hr * 2.4}Z" fill="rgba(255,255,255,.55)" stroke="rgba(255,255,255,.9)" stroke-width="2"/>${of.id === 'wed' ? `<g transform="translate(${cx + hr * 0.7},${top + 18})">${[0, 72, 144, 216, 288].map(a => `<ellipse rx="6" ry="9" transform="rotate(${a}) translate(0,-7)" fill="#ffd0e0"/>`).join('')}</g>` : ''}`;
      case 'glasses': return `<g stroke="#5a4a3a" stroke-width="3" fill="rgba(255,255,255,.2)"><circle cx="${cx - hr * 0.38}" cy="${hy + hr * 0.18}" r="${hr * 0.25}"/><circle cx="${cx + hr * 0.38}" cy="${hy + hr * 0.18}" r="${hr * 0.25}"/><line x1="${cx - hr * 0.13}" y1="${hy + hr * 0.16}" x2="${cx + hr * 0.13}" y2="${hy + hr * 0.16}"/></g>`;
      case 'mask': return `<path d="M${cx - hr * 0.8},${hy + hr * 0.1} Q${cx},${hy - hr * 0.1} ${cx + hr * 0.8},${hy + hr * 0.1} L${cx + hr * 0.7},${hy + hr * 0.35} Q${cx},${hy + hr * 0.2} ${cx - hr * 0.7},${hy + hr * 0.35}Z" fill="#2a2a3a" opacity=".85"/>`;
      default: return '';
    }
  }

  // 방 배경
  function room(night) {
    return `<svg viewBox="0 0 300 420" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf1dc"/><stop offset="1" stop-color="#f6e2c4"/></linearGradient>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${night ? '#1d2557' : '#8fd0f5'}"/><stop offset="1" stop-color="${night ? '#4a3f8a' : '#d8f0ff'}"/></linearGradient></defs>
      <rect width="300" height="420" fill="url(#wall)"/>
      <g opacity=".35" stroke="#e8cfa8" stroke-width="2">${Array.from({ length: 8 }, (_, i) => `<line x1="${i * 40 + 10}" y1="0" x2="${i * 40 + 10}" y2="330"/>`).join('')}</g>
      <rect x="170" y="40" width="100" height="120" rx="50" fill="url(#sky)" stroke="#b07a4a" stroke-width="6"/>
      <line x1="220" y1="40" x2="220" y2="160" stroke="#b07a4a" stroke-width="4"/><line x1="170" y1="105" x2="270" y2="105" stroke="#b07a4a" stroke-width="4"/>
      ${night ? '<circle cx="245" cy="70" r="10" fill="#fff6c2"/><circle cx="190" cy="80" r="2" fill="#fff"/><circle cx="200" cy="130" r="2" fill="#fff"/><circle cx="255" cy="130" r="2" fill="#fff"/>' : '<circle cx="245" cy="70" r="12" fill="#fff3a0"/>'}
      <rect x="20" y="70" width="80" height="10" rx="3" fill="#b07a4a"/>
      <rect x="28" y="50" width="12" height="20" fill="#e06666"/><rect x="42" y="46" width="10" height="24" fill="#4fa3e0"/><rect x="54" y="52" width="12" height="18" fill="#58c7b8"/><circle cx="82" cy="60" r="10" fill="#f2c94c"/>
      <rect y="330" width="300" height="90" fill="#c99a6b"/><rect y="330" width="300" height="6" fill="#a87a4e"/>
      <ellipse cx="150" cy="392" rx="120" ry="22" fill="#e8a0b4" opacity=".55"/>
    </svg>`;
  }

  return { girl, room, shade };
})();

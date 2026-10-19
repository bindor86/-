// ===== 장면 그림 (활동 · 프롤로그 · 대회) =====
const Scenes = (() => {
  const W = 850, H = 300;
  const rnd = (i, k) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;  // 고정 난수

  function embed(svg, x, y, w, h, cls) {
    return `<g class="${cls || ''}" style="transform-origin:${x + w / 2}px ${y + h}px">` + svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" `) + '</g>';
  }
  const floor = (c, y) => `<rect y="${y || 230}" width="${W}" height="${H - (y || 230)}" fill="${c}"/>`;
  const sky = (a, b, id) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id})"/>`;
  const windowBox = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${c || '#bfe6ff'}" stroke="#8a6a4a" stroke-width="6"/><line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="#8a6a4a" stroke-width="4"/><line x1="${x}" y1="${y + h / 2}" x2="${x + w}" y2="${y + h / 2}" stroke="#8a6a4a" stroke-width="4"/>`;
  const shelf = (x, y, w, n) => `<rect x="${x}" y="${y}" width="${w}" height="8" fill="#8a6a4a"/>` + Array.from({ length: n }, (_, i) => `<rect x="${x + 6 + i * (w - 12) / n}" y="${y - 30 + (i % 3) * 4}" width="${(w - 12) / n - 4}" height="${30 - (i % 3) * 4}" fill="${['#e06666', '#4fa3e0', '#58c7b8', '#f2c94c', '#9b7fe6', '#e3814f'][i % 6]}"/>`).join('');
  const tree = (x, y, s, c) => `<rect x="${x - 6 * s}" y="${y - 10 * s}" width="${12 * s}" height="${50 * s}" fill="#7a5232"/><circle cx="${x}" cy="${y - 30 * s}" r="${34 * s}" fill="${c}"/><circle cx="${x - 22 * s}" cy="${y - 12 * s}" r="${22 * s}" fill="${c}"/><circle cx="${x + 22 * s}" cy="${y - 14 * s}" r="${24 * s}" fill="${c}"/>`;
  const leaf = ['#7cc77a', '#4fae5e', '#e9893a', '#cfd8dc'];

  const PLACES = {
    yard: se => sky('#9fd8f8', '#e2f4ff', 'gy') + `<path d="M0,190 Q200,160 420,185 T850,175 L850,300 L0,300Z" fill="${['#9ad27a', '#7cc35f', '#d6b25a', '#e8eef2'][se]}"/>` +
      Array.from({ length: 12 }, (_, i) => `<rect x="${i * 72 + 10}" y="170" width="10" height="56" fill="#b07a4a"/>`).join('') + '<rect x="0" y="182" width="850" height="8" fill="#b07a4a"/><rect x="0" y="206" width="850" height="8" fill="#b07a4a"/>' +
      '<g transform="translate(640,120)"><rect x="-4" y="0" width="8" height="120" fill="#8a6a4a"/><ellipse cx="0" cy="30" rx="26" ry="36" fill="#e9c46a" stroke="#b8902a" stroke-width="3"/><circle cx="0" cy="-12" r="18" fill="#e9c46a" stroke="#b8902a" stroke-width="3"/><rect x="-40" y="20" width="80" height="8" fill="#8a6a4a"/></g>',
    class: () => `<rect width="${W}" height="${H}" fill="#f1e4cc"/>` + '<rect x="230" y="40" width="390" height="150" rx="8" fill="#2f5a4a" stroke="#8a6a4a" stroke-width="10"/><text x="260" y="100" fill="#fff" font-size="28" opacity=".85">1 + 1 = 2</text><text x="420" y="150" fill="#fff" font-size="24" opacity=".85">★ 별자리</text>' +
      windowBox(40, 50, 120, 120) + floor('#c99a6b') + '<rect x="660" y="190" width="150" height="14" fill="#8a5a3a"/><rect x="670" y="204" width="10" height="40" fill="#8a5a3a"/><rect x="790" y="204" width="10" height="40" fill="#8a5a3a"/>',
    salon: () => `<rect width="${W}" height="${H}" fill="#fbe3ea"/>` + Array.from({ length: 22 }, (_, i) => `<rect x="${i * 40}" y="0" width="18" height="230" fill="#f6d0dc"/>`).join('') +
      '<path d="M40,20 Q90,140 60,230 L20,230 L20,20Z" fill="#c2507a"/><path d="M810,20 Q760,140 790,230 L830,230 L830,20Z" fill="#c2507a"/><rect x="0" y="12" width="850" height="14" fill="#a83a5f"/>' + floor('#b07a5a') +
      '<ellipse cx="640" cy="210" rx="90" ry="18" fill="#fff" stroke="#e2c4cf" stroke-width="3"/><rect x="632" y="210" width="16" height="60" fill="#8a5a3a"/><path d="M605,200 q20,-30 40,0z" fill="#fff" stroke="#c2507a" stroke-width="3"/><ellipse cx="680" cy="200" rx="14" ry="6" fill="#fff" stroke="#c2507a" stroke-width="2"/>',
    music: () => `<rect width="${W}" height="${H}" fill="#e8f0e4"/>` + windowBox(60, 40, 140, 120, '#cfeaff') + floor('#a8744a') +
      '<g transform="translate(560,110)"><rect width="230" height="110" rx="8" fill="#2a2a33"/><rect x="10" y="80" width="210" height="20" fill="#fff"/>' + Array.from({ length: 14 }, (_, i) => `<rect x="${12 + i * 15}" y="80" width="9" height="12" fill="#2a2a33"/>`).join('') + '<rect x="10" y="110" width="12" height="40" fill="#2a2a33"/><rect x="208" y="110" width="12" height="40" fill="#2a2a33"/></g>',
    tower: () => sky('#2b2466', '#4a3f8a', 'gt') + shelf(30, 90, 180, 8) + shelf(30, 160, 180, 7) + shelf(640, 90, 180, 8) + shelf(640, 160, 180, 7) + floor('#3a2f5a', 236) +
      '<ellipse cx="425" cy="262" rx="200" ry="26" fill="none" stroke="#b7a8ff" stroke-width="4" class="glow"/><ellipse cx="425" cy="262" rx="150" ry="18" fill="none" stroke="#e8c547" stroke-width="2" class="glow"/>' +
      Array.from({ length: 14 }, (_, i) => `<circle cx="${rnd(i, 1) * W}" cy="${rnd(i, 2) * 80 + 10}" r="${1 + rnd(i, 3) * 2}" fill="#fff"/>`).join(''),
    atelier: () => `<rect width="${W}" height="${H}" fill="#f5ead6"/>` + windowBox(640, 30, 160, 140, '#fff6d8') + '<path d="M640,170 L560,300 L850,300 L800,170Z" fill="#fff6d8" opacity=".5"/>' + floor('#c99a6b', 240) +
      '<g transform="translate(150,70)"><line x1="10" y1="0" x2="-20" y2="190" stroke="#8a6a4a" stroke-width="8"/><line x1="90" y1="0" x2="120" y2="190" stroke="#8a6a4a" stroke-width="8"/><rect x="0" y="10" width="100" height="120" fill="#fff" stroke="#8a6a4a" stroke-width="4"/><circle cx="50" cy="60" r="22" fill="#f29e4c"/><path d="M5,110 Q50,80 95,110 L95,125 L5,125Z" fill="#7cc77a"/></g>' +
      ['#e86a92', '#4fa3e0', '#f2c94c'].map((c, i) => `<rect x="${60 + i * 30}" y="250" width="22" height="26" rx="3" fill="${c}"/>`).join(''),
    bakery: () => `<rect width="${W}" height="${H}" fill="#f6e2c4"/>` + '<rect x="560" y="40" width="240" height="190" rx="100" fill="#b5654a"/><rect x="600" y="120" width="160" height="90" rx="40" fill="#3a2020"/><ellipse cx="680" cy="190" rx="60" ry="16" fill="#ff9a3a" class="glow"/>' +
      shelf(40, 90, 220, 0) + Array.from({ length: 6 }, (_, i) => `<ellipse cx="${60 + i * 36}" cy="80" rx="16" ry="10" fill="#d9993c" stroke="#a8702a" stroke-width="2"/>`).join('') +
      shelf(40, 160, 220, 0) + Array.from({ length: 5 }, (_, i) => `<path d="M${50 + i * 42},150 q16,-18 32,0z" fill="#e8b25a" stroke="#a8702a" stroke-width="2"/>`).join('') + floor('#a8744a') + '<rect x="0" y="222" width="850" height="12" fill="#8a5a3a"/>',
    farm: se => sky('#8fd0f5', '#e6f6ff', 'gf') + '<circle cx="760" cy="60" r="30" fill="#fff3a0"/>' + `<path d="M0,170 Q300,140 850,165 L850,300 L0,300Z" fill="${['#9ad27a', '#7cc35f', '#e2b85a', '#eef2f6'][se]}"/>` +
      Array.from({ length: 6 }, (_, i) => `<path d="M0,${200 + i * 18} Q425,${190 + i * 18} 850,${200 + i * 18}" stroke="${['#6a9a4a', '#5a8a3a', '#c99a3a', '#d8e0e6'][se]}" stroke-width="5" fill="none"/>`).join('') +
      '<g transform="translate(60,80)"><rect width="130" height="100" fill="#c0392b"/><path d="M-10,0 L65,-50 L140,0Z" fill="#8e2a20"/><rect x="45" y="40" width="40" height="60" fill="#fff"/></g>',
    church: () => `<rect width="${W}" height="${H}" fill="#d8d2c4"/>` + [120, 425, 730].map(x => `<path d="M${x - 40},180 L${x - 40},70 Q${x},20 ${x + 40},70 L${x + 40},180Z" fill="#7a9ad8" stroke="#5a5a6a" stroke-width="5"/><path d="M${x - 40},120 L${x + 40},120 M${x},40 L${x},180" stroke="#f2c94c" stroke-width="4"/><circle cx="${x}" cy="90" r="14" fill="#e86a92"/>`).join('') +
      floor('#9a8a7a', 220) + Array.from({ length: 3 }, (_, i) => `<rect x="${80 + i * 260}" y="240" width="200" height="16" rx="4" fill="#7a5232"/>`).join('') + [300, 550].map(x => `<rect x="${x}" y="190" width="8" height="34" fill="#fff"/><ellipse cx="${x + 4}" cy="186" rx="5" ry="9" fill="#ffcf4a" class="glow"/>`).join(''),
    tavern: () => `<rect width="${W}" height="${H}" fill="#7a5232"/>` + Array.from({ length: 10 }, (_, i) => `<rect x="0" y="${i * 24}" width="${W}" height="2" fill="#5a3a22"/>`).join('') +
      [100, 425, 750].map(x => `<line x1="${x}" y1="0" x2="${x}" y2="40" stroke="#333" stroke-width="2"/><circle cx="${x}" cy="50" r="14" fill="#ffcf4a" class="glow"/>`).join('') + floor('#5a3a22', 225) +
      '<g transform="translate(40,140)"><ellipse cx="40" cy="45" rx="40" ry="50" fill="#a8743a"/><rect x="0" y="20" width="80" height="6" fill="#5a3a22"/><rect x="0" y="66" width="80" height="6" fill="#5a3a22"/></g><g transform="translate(130,160)"><ellipse cx="30" cy="35" rx="30" ry="38" fill="#a8743a"/></g>' +
      '<rect x="600" y="200" width="200" height="14" fill="#8a5a3a"/>' + [620, 680, 740].map(x => `<rect x="${x}" y="176" width="22" height="26" rx="3" fill="#f2c94c"/><rect x="${x}" y="172" width="22" height="8" rx="3" fill="#fff"/>`).join(''),
    forest: se => sky('#bfe6c8', '#eaf8ee', 'gfo') + floor(['#6aa84f', '#4f9a3a', '#b98a3a', '#e8eef2'][se], 220) + [60, 200, 690, 800, 330].map((x, i) => tree(x, 200 - (i % 2) * 10, 1.2 + (i % 3) * 0.2, leaf[se])).join('') +
      '<circle cx="560" cy="80" r="14" fill="#fff" opacity=".3"/>',
    library: () => `<rect width="${W}" height="${H}" fill="#e8dcc4"/>` + [40, 230, 620].map(x => shelf(x, 80, 180, 9) + shelf(x, 150, 180, 8) + shelf(x, 215, 180, 9)).join('') +
      '<rect x="420" y="20" width="30" height="230" fill="#d8c8a8"/><rect x="410" y="12" width="50" height="14" fill="#c9b898"/>' + floor('#8a2a3a', 240) + '<rect x="650" y="225" width="140" height="10" fill="#6b4226"/><rect x="700" y="205" width="6" height="20" fill="#fff"/><ellipse cx="703" cy="200" rx="4" ry="8" fill="#ffcf4a" class="glow"/>',
    bedroom: () => `<rect width="${W}" height="${H}" fill="#e8dcf0"/>` + windowBox(620, 40, 140, 120, '#2b2466') + '<circle cx="720" cy="80" r="14" fill="#fff6c2"/>' + floor('#c99a6b', 235) +
      '<g transform="translate(40,150)"><rect width="260" height="70" rx="10" fill="#fff"/><rect x="0" y="20" width="260" height="50" rx="10" fill="#f4b6c8"/><rect x="-10" y="-60" width="20" height="130" fill="#8a5a3a"/><ellipse cx="40" cy="14" rx="34" ry="16" fill="#fff" stroke="#ddd"/></g>',
    road: se => sky('#9fd8f8', '#f2fbff', 'gr') + '<path d="M0,150 L120,90 L240,150Z M180,150 L330,70 L480,150Z" fill="#a8b8d8"/><rect y="140" width="850" height="30" fill="#6cc4f2"/>' +
      `<path d="M0,170 Q425,150 850,170 L850,300 L0,300Z" fill="${['#9ad27a', '#7cc35f', '#e2b85a', '#eef2f6'][se]}"/><path d="M380,300 Q440,230 520,170 L560,170 Q500,230 480,300Z" fill="#e2c49a"/>` +
      '<g class="drift"><ellipse cx="200" cy="50" rx="50" ry="16" fill="#fff"/><ellipse cx="640" cy="40" rx="60" ry="18" fill="#fff"/></g>',
    ruins: () => sky('#2a1020', '#7a2a2a', 'gru') + '<path d="M0,210 L60,150 L90,170 L120,120 L170,170 L220,140 L260,190 L340,130 L380,170 L420,150 L470,200 L540,140 L600,180 L660,120 L720,170 L790,140 L850,190 L850,300 L0,300Z" fill="#1a0a10"/>' +
      Array.from({ length: 24 }, (_, i) => `<circle cx="${rnd(i, 5) * W}" cy="${100 + rnd(i, 6) * 150}" r="${2 + rnd(i, 7) * 3}" fill="#ff8a3a" class="ember" style="animation-delay:${(rnd(i, 8) * 3).toFixed(2)}s"/>`).join(''),
    home: () => sky('#1d2557', '#5a4f9a', 'gh') + Array.from({ length: 40 }, (_, i) => `<circle cx="${rnd(i, 9) * W}" cy="${rnd(i, 10) * 150}" r="${1 + rnd(i, 11) * 1.8}" fill="#fff" class="tw" style="animation-delay:${(rnd(i, 12) * 3).toFixed(2)}s"/>`).join('') +
      '<path d="M0,230 Q300,170 850,220 L850,300 L0,300Z" fill="#2e4a3a"/><g transform="translate(470,120)"><rect width="160" height="110" fill="#e8d2b0"/><path d="M-20,0 L80,-60 L180,0Z" fill="#8e2a20"/><rect x="30" y="40" width="34" height="34" fill="#ffd96a" class="glow"/><rect x="100" y="50" width="34" height="60" fill="#6b4226"/></g>',
    arena: () => sky('#f5c28a', '#fde7c8', 'ga') + Array.from({ length: 30 }, (_, i) => `<circle cx="${i * 30 + 10}" cy="${100 + (i % 2) * 14}" r="12" fill="${['#e06666', '#4fa3e0', '#f2c94c', '#9b7fe6', '#58c7b8'][i % 5]}"/>`).join('') +
      '<rect y="120" width="850" height="30" fill="#8a5a3a"/>' + floor('#e2c49a', 150) + '<ellipse cx="425" cy="240" rx="360" ry="44" fill="none" stroke="#c99a6b" stroke-width="4"/>' +
      Array.from({ length: 6 }, (_, i) => `<path d="M${60 + i * 150},0 l0,60 l40,-15 l-40,-15" fill="${['#e86a92', '#4fa3e0', '#f2c94c'][i % 3]}" stroke="#555" stroke-width="2"/>`).join(''),
    stage: () => `<rect width="${W}" height="${H}" fill="#3a1a3a"/>` + '<path d="M0,0 Q120,150 60,300 L0,300Z M850,0 Q730,150 790,300 L850,300Z" fill="#a8304f"/><rect y="0" width="850" height="34" fill="#8a2040"/>' +
      '<rect x="80" y="220" width="690" height="80" fill="#c99a6b"/><path d="M200,0 L120,220 L380,220Z M650,0 L470,220 L730,220Z" fill="#fff6c2" opacity=".18"/>',
    kitchen: () => `<rect width="${W}" height="${H}" fill="#fdf1dc"/>` + Array.from({ length: 8 }, (_, i) => `<path d="M${i * 110},0 l55,40 l55,-40" fill="${i % 2 ? '#e86a92' : '#f2c94c'}"/>`).join('') +
      '<rect x="40" y="190" width="770" height="20" fill="#8a5a3a"/>' + floor('#d8c0a0', 210) + [180, 425, 670].map(x => `<ellipse cx="${x}" cy="186" rx="50" ry="10" fill="#fff" stroke="#ddd" stroke-width="2"/>`).join(''),
    plaza: () => sky('#141a3d', '#2b2466', 'gp') + '<path d="M0,230 L850,230 L850,300 L0,300Z" fill="#3a3a5a"/>' + [100, 300, 550, 750].map(x => `<rect x="${x}" y="150" width="8" height="80" fill="#555"/><circle cx="${x + 4}" cy="146" r="10" fill="#ffcf4a" class="glow"/>`).join(''),
  };

  const FX = {
    music: () => Array.from({ length: 5 }, (_, i) => `<text x="${360 + i * 40}" y="120" font-size="30" fill="#7a6cf0" class="float" style="animation-delay:${i * 0.35}s">${i % 2 ? '♪' : '♫'}</text>`).join(''),
    magic: () => Array.from({ length: 8 }, (_, i) => `<text x="${340 + rnd(i, 13) * 180}" y="${140 + rnd(i, 14) * 60}" font-size="${18 + rnd(i, 15) * 16}" fill="#ffe680" class="float" style="animation-delay:${(i * 0.25).toFixed(2)}s">✦</text>`).join(''),
    art: () => ['#e86a92', '#4fa3e0', '#f2c94c'].map((c, i) => `<circle cx="${470 + i * 26}" cy="160" r="7" fill="${c}" class="float" style="animation-delay:${i * 0.5}s"/>`).join(''),
    bakery: () => Array.from({ length: 4 }, (_, i) => `<path d="M${650 + i * 20},170 q-8,-15 0,-30 q8,-15 0,-30" stroke="#fff" stroke-width="4" fill="none" opacity=".7" class="float" style="animation-delay:${i * 0.4}s"/>`).join(''),
    farm: () => '<text x="510" y="120" font-size="26" class="float">💦</text>',
    rest: () => Array.from({ length: 3 }, (_, i) => `<text x="${330 + i * 26}" y="${150 - i * 22}" font-size="${22 + i * 6}" fill="#7a6cf0" class="float" style="animation-delay:${i * 0.5}s">Z</text>`).join(''),
    church: () => '<text x="520" y="110" font-size="28" fill="#f2c94c" class="float">✝</text>',
    tavern: () => '<text x="520" y="140" font-size="30" class="float">🎵</text>',
    hunter: () => '<text x="520" y="160" font-size="30" class="float">🐾</text>',
    scribe: () => '<text x="520" y="160" font-size="28" class="float">✒️</text>',
    sword: () => '<text x="520" y="130" font-size="30" fill="#fff" class="float">💥</text>',
    study: () => '<text x="520" y="130" font-size="28" class="float">💡</text>',
    manner: () => '<text x="520" y="130" font-size="28" class="float">✨</text>',
    travel: () => '<text x="520" y="120" font-size="28" class="float">🎒</text>',
  };
  const POSE = { sword: 'swing', study: 'nod', manner: 'sway', music: 'sway', magic: 'bob', art: 'nod', bakery: 'bob', farm: 'swing', church: 'nod', tavern: 'bob', hunter: 'swing', scribe: 'nod', rest: 'breathe', travel: 'walk' };
  const PROP = { sword: 'sword', study: 'book', music: 'violin', magic: 'staff', art: 'brush', bakery: 'bread', scribe: 'book', hunter: 'sword', travel: 'none' };

  // 활동 장면.  o: { girlSvgOpts, npcSvg, sick }
  function activity(act, season, girlOpts, npcSvg) {
    const place = PLACES[act.place] || PLACES.class;
    const g = Art.girl(Object.assign({}, girlOpts, { acc: girlOpts.expr === 'sick' ? 'none' : (PROP[act.id] || girlOpts.acc) }));
    let girl;
    if (act.id === 'rest') girl = embed(g, 70, 40, 200, 300, 'pose-breathe');
    else girl = embed(g, 330, 10, 190, 290, 'pose-' + (POSE[act.id] || 'bob'));
    const npc = npcSvg ? embed(npcSvg, 600, 110, 190, 190, 'npc-in') : '';
    const fx = girlOpts.expr === 'sick' ? '<text x="500" y="110" font-size="34" class="float">🌡️</text>' : (FX[act.id] ? FX[act.id]() : '');
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${place(season || 0)}${npc}${girl}${fx}</svg>`;
  }

  function backdrop(id, season, extra) {
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${(PLACES[id] || PLACES.home)(season || 0)}${extra || ''}</svg>`;
  }

  // 대회 장면: 딸 vs 상대
  function contest(id, girlSvg, rivalSvg) {
    const place = { martial: 'arena', beauty: 'stage', cook: 'kitchen', magic: 'plaza' }[id];
    let fx = '';
    if (id === 'martial') fx = '<g class="clash"><text x="395" y="150" font-size="60">💥</text></g>';
    if (id === 'beauty') fx = [250, 425, 600].map((x, i) => `<g class="card" style="animation-delay:${i * 0.3}s"><rect x="${x - 30}" y="30" width="60" height="44" rx="6" fill="#fff" stroke="#c99a6b" stroke-width="3"/><text x="${x}" y="62" font-size="24" text-anchor="middle" fill="#a8304f">★</text></g>`).join('');
    if (id === 'cook') fx = [180, 670].map((x, i) => `<g class="float" style="animation-delay:${i * 0.4}s"><text x="${x - 20}" y="176" font-size="36">${i ? '🍲' : '🍰'}</text></g>`).join('');
    if (id === 'magic') fx = Array.from({ length: 6 }, (_, i) => `<g class="firework" style="transform-origin:${150 + i * 110}px ${60 + (i % 2) * 40}px;animation-delay:${(i * 0.3).toFixed(1)}s">${Array.from({ length: 8 }, (_, k) => `<line x1="${150 + i * 110}" y1="${60 + (i % 2) * 40}" x2="${150 + i * 110 + Math.cos(k * Math.PI / 4) * 26}" y2="${60 + (i % 2) * 40 + Math.sin(k * Math.PI / 4) * 26}" stroke="${['#ffe680', '#ff9ab8', '#9fd8f8'][i % 3]}" stroke-width="3" stroke-linecap="round"/>`).join('')}</g>`).join('');
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${PLACES[place](0)}${embed(girlSvg, 150, 20, 180, 270, 'pose-bob')}${embed(rivalSvg, 540, 100, 180, 180, 'pose-bob')}${fx}</svg>`;
  }

  return { activity, backdrop, contest };
})();

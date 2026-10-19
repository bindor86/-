// 수업 두 개 조합별로 '적당히 키운 사람'이 받는 엔딩: node tools/pairs.js
const { play } = require('./sim.js');
const L = ['sword', 'study', 'manner', 'music', 'magic', 'art'];
const JOB = { sword: 'hunter', study: 'scribe', manner: 'bakery', music: 'tavern', magic: 'church', art: 'bakery' };
const CON = { sword: 'martial', study: 'magic', manner: 'beauty', music: 'beauty', magic: 'magic', art: 'cook' };
const N = 80;
const rows = [];
for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
  const a = L[i], b = L[j];
  const pol = { lessons: [[a, 1], [b, 1]], jobs: [JOB[a], JOB[b], 'bakery'], jobShare: 0.3, contest: [CON[a], CON[b]], w: {}, dad: 0.4, firstChoice: 0.5 };
  const t = {};
  for (let k = 0; k < N; k++) { const r = play(pol, 3000 + k * 101); t[r.ending.id] = (t[r.ending.id] || 0) + 1; }
  rows.push(`${(a + '+' + b).padEnd(14)} ${Object.entries(t).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([k, v]) => `${k} ${Math.round(v / N * 100)}%`).join(', ')}`);
}
console.log(rows.join('\n'));

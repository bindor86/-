// 밸런스 보고서: node tools/balance.js [판 수] [정책이름...]
const { play, ctx } = require('./sim.js');
const { P, CASUAL } = require('./policies.js');
const N = +process.argv[2] || 200;
const only = process.argv.slice(3);
const all = Object.assign({}, P, CASUAL);
const names = only.length ? only : Object.keys(all);
const pct = (a, b) => Math.round(a / b * 100);
const avg = arr => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);

let okTargets = 0, tgtCount = 0;
for (const name of names) {
  const pol = all[name];
  const tally = {};
  const fails = {};
  const fin = { st: {}, gold: [], aff: [], wins: [], run: [], dad: [], events: [], lines: [], sick: [] };
  for (let i = 0; i < N; i++) {
    const r = play(pol, 1000 + i * 7919);
    tally[r.ending.id] = (tally[r.ending.id] || 0) + 1;
    if (P[name] && r.ending.id !== name) {
      const req = ctx.ENDING[name].req, s = r.s;
      for (const k in req.st || {}) if (s.st[k] < req.st[k]) fails[k] = (fails[k] || 0) + 1;
      for (const k in req.max || {}) if (s.st[k] > req.max[k]) fails['max' + k] = (fails['max' + k] || 0) + 1;
      for (const k in req.cnt || {}) if ((s.cnt[k] || 0) < req.cnt[k]) fails['cnt' + k] = (fails['cnt' + k] || 0) + 1;
      for (const k in req.wins || {}) if (s.wins[k] < req.wins[k]) fails['win' + k] = (fails['win' + k] || 0) + 1;
      for (const k in req.flags || {}) if ((s.flags[k] || 0) < req.flags[k]) fails['flag' + k] = (fails['flag' + k] || 0) + 1;
      if (req.gold && s.gold < req.gold) fails.gold = (fails.gold || 0) + 1;
      if (req.fame && s.fame < req.fame) fails.fame = (fails.fame || 0) + 1;
      if (req.aff && s.aff < req.aff) fails.aff = (fails.aff || 0) + 1;
      if (ctx.Logic.reqMet(s, req)) fails.outranked = (fails.outranked || 0) + 1;
    }
    for (const k in r.s.st) (fin.st[k] = fin.st[k] || []).push(r.s.st[k]);
    fin.gold.push(r.s.gold); fin.aff.push(r.s.aff); fin.run.push(r.s.runaways); fin.dad.push(r.log.dad);
    fin.wins.push(r.s.wins.martial + r.s.wins.beauty + r.s.wins.cook + r.s.wins.magic);
    fin.events.push(r.log.events); fin.lines.push(r.log.lines); fin.sick.push(r.log.sickSlots);
  }
  const top = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} ${pct(v, N)}%`).join(', ');
  const hit = P[name] ? pct(tally[name] || 0, N) : null;
  if (P[name]) { tgtCount++; if (hit >= 50) okTargets++; }
  const stats = Object.entries(fin.st).map(([k, v]) => `${k}:${Math.round(avg(v))}`).join(' ');
  console.log(`${name.padEnd(13)} ${hit !== null ? `목표 ${String(hit).padStart(3)}% ` : '         '}| ${top}`);
  if (Object.keys(fails).length) console.log(`              막힌 조건: ${Object.entries(fails).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v, N)}%`).join(', ')}`);
  console.log(`              ${stats} | gold ${Math.round(avg(fin.gold))} aff ${Math.round(avg(fin.aff))} wins ${avg(fin.wins).toFixed(1)} run ${avg(fin.run).toFixed(2)} sick ${avg(fin.sick).toFixed(1)} ev ${avg(fin.events).toFixed(0)}`);
}
if (tgtCount) console.log(`\n목표 엔딩 50% 이상 달성: ${okTargets}/${tgtCount}`);

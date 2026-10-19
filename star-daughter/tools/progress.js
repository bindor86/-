// 진행 곡선 분석: node tools/progress.js
const { play, ctx } = require('./sim.js');
const { P, CASUAL } = require('./policies.js');
const { Logic } = ctx;
const N = 120;
const avg = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
// 1) 목표 엔딩 조건을 처음 채우는 나이
const origEnd = Logic.monthEnd;
console.log('== 목표 조건을 처음 채운 나이 (평균) / 첫 우승 연차 / 나이별 돈 ==');
for (const name of Object.keys(P)) {
  const firstMet = [], firstWin = [], gold = {};
  for (let i = 0; i < N; i++) {
    let met = null;
    Logic.monthEnd = function (s) { if (met === null && s.m % 3 === 2 && Logic.reqMet(s, ctx.ENDING[name].req)) met = Logic.age(s) + (s.m % 12) / 12; return origEnd(s); };
    const r = play(P[name], 5000 + i * 104729);
    Logic.monthEnd = origEnd;
    if (met !== null) firstMet.push(met);
    const w = r.log.contest.find(c => c.won); if (w) firstWin.push(w.y);
    for (const a in r.log.goldAt) (gold[a] = gold[a] || []).push(r.log.goldAt[a]);
  }
  const g = Object.keys(gold).map(a => `${a}:${Math.round(avg(gold[a]))}`).join(' ');
  console.log(`${name.padEnd(11)} 조건충족 ${firstMet.length ? avg(firstMet).toFixed(1) + '살' : '  -  '} (${Math.round(firstMet.length / N * 100)}%)  첫우승 ${firstWin.length ? avg(firstWin).toFixed(1) + '년째' : '-'}  돈 ${g}`);
}
// 2) 사이 곡선
console.log('\n== 아빠와의 사이 (나이별 평균) ==');
for (const name of ['no_dad', 'half_dad', 'all_dad', 'casual_story']) {
  const aff = {};
  for (let i = 0; i < N; i++) { const r = play(CASUAL[name], 7000 + i * 31); for (const a in r.log.affAt) (aff[a] = aff[a] || []).push(r.log.affAt[a]); }
  console.log(`${name.padEnd(13)} ${Object.keys(aff).map(a => `${a}:${Math.round(avg(aff[a]))}`).join(' ')}`);
}
// 3) 인물 이야기 완주율 · 이벤트 수 · 대사 수
console.log('\n== 인물 이야기 완주율 (이야기 좋아하는 사람 / 아무나) ==');
for (const name of ['casual_story', 'villager']) {
  const done = { haru: 0, liana: 0, bianca: 0, locket: 0, orphan: 0 }, ev = [], lines = [], dad = [];
  const pol = CASUAL[name] || P[name];
  for (let i = 0; i < N; i++) {
    const r = play(pol, 9000 + i * 13);
    if ((r.s.flags.haru || 0) >= 5) done.haru++; if ((r.s.flags.liana || 0) >= 4) done.liana++;
    if ((r.s.flags.bianca || 0) >= 4) done.bianca++; if ((r.s.flags.locket || 0) >= 3) done.locket++;
    if ((r.s.flags.orphan || 0) >= 2) done.orphan++;
    ev.push(r.log.events); lines.push(r.log.lines); dad.push(r.log.dad);
  }
  console.log(`${name.padEnd(13)} ${Object.entries(done).map(([k, v]) => `${k} ${Math.round(v / N * 100)}%`).join(', ')} | 이벤트 ${avg(ev).toFixed(0)}개, 대사 ${avg(lines).toFixed(0)}줄, 딸과의 시간 ${avg(dad).toFixed(0)}번`);
}
// 4) 덜 꼼꼼한 사람: 스트레스 70에서야 쉼
console.log('\n== 덜 꼼꼼한 사람 (스트레스 70/85에서 쉼) ==');
for (const restAt of [70, 85]) {
  const pol = Object.assign({}, P.scholar, { restAt, dad: 0.2 });
  const sick = [], run = [], ends = {};
  for (let i = 0; i < N; i++) { const r = play(pol, 11000 + i * 17); sick.push(r.log.sickSlots); run.push(r.s.runaways); ends[r.ending.id] = (ends[r.ending.id] || 0) + 1; }
  console.log(`restAt ${restAt}: 아픈 칸 ${avg(sick).toFixed(1)}, 가출 ${avg(run).toFixed(2)}회, 엔딩 ${Object.entries(ends).map(([k, v]) => `${k} ${Math.round(v / N * 100)}%`).join(', ')}`);
}

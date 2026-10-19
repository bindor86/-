// 능력치 출처 분석: node tools/sources.js
const { play, ctx } = require('./sim.js');
const { P } = require('./policies.js');
const { Logic } = ctx;
const names = process.argv.slice(2).length ? process.argv.slice(2) : ['scholar', 'painter', 'knightcap', 'chef', 'diva', 'villager'];
for (const name of names) {
  const src = { slot: {}, event: {}, gift: {}, dad: {}, gear: {}, other: {} };
  const N = 60;
  const origRun = Logic.runSlot, origChoose = Logic.chooseEvent, origDad = Logic.dadTime, origEnd = Logic.monthEnd, origApply = Logic.applyFx;
  let phase = 'other';
  const snap = s => Object.assign({}, s.st);
  const diff = (a, b, bucket) => { for (const k in b) bucket[k] = (bucket[k] || 0) + (b[k] - a[k]) / N; };
  Logic.runSlot = function (s, id) { const a = snap(s); const r = origRun(s, id); diff(a, snap(s), src.slot); return r; };
  Logic.chooseEvent = function (s, e, i) { const a = snap(s); const r = origChoose(s, e, i); diff(a, snap(s), src.event); return r; };
  Logic.dadTime = function (s, id) { const a = snap(s); const r = origDad(s, id); diff(a, snap(s), src.dad); return r; };
  Logic.monthEnd = function (s) { const a = snap(s); const r = origEnd(s); diff(a, snap(s), src.gear); return r; };
  for (let i = 0; i < N; i++) play(P[name], 1000 + i * 7919);
  Object.assign(Logic, { runSlot: origRun, chooseEvent: origChoose, dadTime: origDad, monthEnd: origEnd });
  const show = b => Object.entries(b).filter(([, v]) => Math.abs(v) >= 5).map(([k, v]) => `${k}:${Math.round(v)}`).join(' ');
  console.log(`${name}\n  slots : ${show(src.slot)}\n  events: ${show(src.event)}\n  dad   : ${show(src.dad)}\n  gear  : ${show(src.gear)}`);
}

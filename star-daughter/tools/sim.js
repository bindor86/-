// 로직만 돌려 보는 시뮬레이터: node tools/sim.js
const fs = require('fs');
const src = ['data.js', 'logic.js'].map(f => fs.readFileSync(__dirname + '/../src/' + f, 'utf8')).join('\n');
const ctx = {};
new Function('ctx', src + '\nctx.Logic = Logic; ctx.ENDINGS = ENDINGS; ctx.ACT = ACT; ctx.ACTS = ACTS; ctx.CONTESTS = CONTESTS; ctx.EVENTS = EVENTS; ctx.BDAY_GIFTS = BDAY_GIFTS;')(ctx);
const { Logic, ACT } = ctx;

// policy: { main: [lesson ids], job: id, contest: id, gift: fx-key, rest at stress }
function play(pol) {
  const s = Logic.newGame('테스트', 'brown', {});
  while (s.m < 96) {
    if (s.runaway) { Logic.resolveRunaway(s); if (s.m >= 96) break; }
    if (Logic.isBirthday(s)) { const gs = Logic.birthdayGifts(s); const g = gs.find(x => pol.gift && x.fx[pol.gift]) || gs[0]; Logic.applyFx(s, g.fx); }
    if (Logic.isFestival(s)) Logic.runContest(s, pol.contest);
    const ev = Logic.pickEvent(s);
    if (ev) { let i = 0; if (pol.evPick) i = pol.evPick(ev, s); const c = ev.choices[i]; if (c.need && s.gold < c.need) i = ev.choices.length - 1; Logic.chooseEvent(s, ev, i); }
    const ids = pol.month(s);
    let cost = 0;
    for (let k = 0; k < 3; k++) {
      let id = ids[k];
      if (!Logic.actState(s, ACT[id], cost).ok) id = pol.job || 'bakery';
      if (!Logic.actState(s, ACT[id], cost).ok) id = 'rest';
      s.sched[k] = id; cost += ACT[id].cost || 0;
    }
    for (let k = 0; k < 3; k++) Logic.runSlot(s, s.sched[k]);
    Logic.monthEnd(s);
  }
  return s;
}
module.exports = { play, ctx };
if (require.main === module) {
  const mk = (lessons, job, contest, gift) => ({ contest, gift, job, month: s => {
    if (s.stress >= 60) return ['travel', 'rest', lessons[0]];
    if (s.gold < 150) return [job, job, lessons[0]];
    return [lessons[s.m % lessons.length], lessons[(s.m + 1) % lessons.length], s.m % 2 ? job : 'rest'];
  } });
  const pols = {
    knight: mk(['sword', 'sword', 'manner'], 'hunter', 'martial', 'swd'),
    mage: mk(['magic', 'study'], 'church', 'magic', 'mag'),
    beauty: mk(['manner', 'music'], 'tavern', 'beauty', 'cha'),
    chef: mk(['study', 'art'], 'bakery', 'cook', 'cook'),
    scholar: mk(['study', 'study', 'manner'], 'scribe', 'magic', 'int'),
  };
  for (const [n, pol] of Object.entries(pols)) {
    const tally = {}; let st = null;
    for (let i = 0; i < 200; i++) { const s = play(pol); const e = Logic.decideEnding(s); tally[e.id] = (tally[e.id] || 0) + 1; st = s; }
    console.log(n, JSON.stringify(tally));
    console.log('   ', Object.entries(st.st).map(([k, v]) => k + ':' + v).join(' '), 'gold', st.gold, 'wins', JSON.stringify(st.wins), 'sick', st.sick, 'run', st.runaways);
  }
}

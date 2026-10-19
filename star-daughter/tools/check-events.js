// 이벤트 데이터 점검: node tools/check-events.js
const { ctx } = require('./sim.js');
const fs = require('fs');
const src = ['data.js', 'story.js'].map(f => fs.readFileSync(__dirname + '/../src/' + f, 'utf8')).join('\n');
const c = {}; new Function('c', src + ';c.NPCS=NPCS;c.EVENTS=EVENTS;c.TEACH=TEACH_LINES;c.BOSS=BOSS_LINES;c.ACTS=ACTS;c.PRO=PROLOGUE')(c);
const { Logic } = ctx;
const okWho = w => w === 'me' || w === 'dad' || w === 'n' || c.NPCS[w];
const FX_OK = new Set(['gold', 'stress', 'fame', 'aff', 'hp', 'str', 'int', 'ele', 'cha', 'sen', 'mag', 'mor', 'cook', 'swd', 'haru', 'liana', 'bianca', 'locket', 'orphan', 'cat', 'adv', 'dark', 'trade', 'gamble', 'fortune']);
let problems = 0;
const bad = m => { problems++; console.log('✗', m); };
for (const e of c.EVENTS) {
  for (const l of (e.lines || [])) if (!okWho(l[0])) bad(`${e.id}: unknown speaker ${l[0]}`);
  e.choices.forEach((ch, i) => {
    for (const k in ch.fx) if (!FX_OK.has(k)) bad(`${e.id}#${i}: unknown fx ${k}`);
    for (const l of (ch.after || [])) if (!okWho(l[0])) bad(`${e.id}#${i}: unknown speaker ${l[0]}`);
    const s = Logic.newGame('별이', 'brown', {}); s.m = 50; s.gold = 5000;
    try {
      const r = Logic.chooseEvent(s, e, i);
      for (const l of r.after) { const t = Logic.fmt(l[1], s); if (/[{}]/.test(t)) bad(`${e.id}#${i}: leftover brace: ${t}`); }
    } catch (err) { bad(`${e.id}#${i}: ${err.message}`); }
  });
  const s = Logic.newGame('하늘', 'brown', {});
  for (const l of (e.lines || [])) { const t = Logic.fmt(l[1], s); if (/[{}]/.test(t)) bad(`${e.id}: leftover brace: ${t}`); }
  try { if (e.cond) e.cond(s, s.st, 12, 3); } catch (err) { bad(`${e.id} cond: ${err.message}`); }
}
for (const a of c.ACTS) if (a.npc && !c.NPCS[a.npc]) bad(`act ${a.id}: npc ${a.npc}`);
for (const k in c.TEACH) if (c.TEACH[k].length !== 4) bad(`teach ${k}`);
for (const p of c.PRO) if (!okWho(p.who)) bad('prologue who ' + p.who);
for (const e of ctx.ENDINGS) for (const t of [e.text, e.epi]) { const r = Logic.fmt(t, Logic.newGame('별', 'brown', {})); if (/[{}]/.test(r)) bad(`ending ${e.id}: ${r}`); }
console.log(problems ? `${problems} problems` : `OK: ${c.EVENTS.length} events, ${ctx.ENDINGS.length} endings checked`);

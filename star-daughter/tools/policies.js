// 엔딩별로 "그 엔딩을 노리는 사람"의 플레이 방식
// lessons: [수업, 비중] · jobs: 선호 일(앞부터) · jobShare: 일 칸 비율 · w: 이벤트·선물 고를 때 능력치 가중치
// contest: 나갈 대회 · travel: 목표 여행 횟수 · dad: 딸과의 시간 확률 · buy: 살 옷·장신구 순서
const ALL6 = [['study', 1], ['music', 1], ['art', 1], ['manner', 1], ['sword', 1], ['magic', 1]];
const P = {
  hero:       { lessons: [['sword', 2], ['magic', 1.3]], jobs: ['farm', 'hunter'], jobShare: 0.3, contest: ['martial', 'magic'], travel: 10, w: { swd: 1, mag: 1, hp: 0.6, str: 0.3, mor: 0.3 }, buy: ['train', 'magehat', 'brooch'], dad: 0.5, dadOpts: ['walk'] },
  diplomat:   { lessons: [['manner', 2], ['study', 1.1], ['music', 1]], jobs: ['scribe', 'church', 'bakery'], jobShare: 0.25, contest: ['beauty'], w: { ele: 1, cha: 1, int: 0.8 }, story: true, arcW: { liana: 20 }, buy: ['maid', 'silk', 'pearl', 'rose'], dad: 0.5, dadOpts: ['praise'] },
  saint:      { lessons: [['magic', 1]], jobs: ['church'], jobShare: 0.55, contest: ['magic'], w: { mor: 1, mag: 1 }, buy: ['choir', 'magehat'], dad: 0.5 },
  knightcap:  { lessons: [['sword', 2.5], ['manner', 0.3]], jobs: ['hunter', 'farm'], jobShare: 0.3, contest: ['martial'], alwaysEnter: true, w: { swd: 1, str: 0.8, hp: 0.3, mor: 0.7 }, scold: 160, buy: ['train', 'brooch'], dad: 0.4 },
  archmage:   { lessons: [['magic', 2], ['study', 1]], jobs: ['scribe', 'church', 'bakery'], jobShare: 0.25, contest: ['magic'], alwaysEnter: true, w: { mag: 1, int: 0.8 }, buy: ['robe', 'magehat'], dad: 0.4 },
  chef:       { lessons: [['art', 0.6], ['study', 0.4]], jobs: ['bakery'], jobShare: 0.6, contest: ['cook'], alwaysEnter: true, w: { cook: 1, sen: 0.4, int: 0.2 }, buy: ['apron', 'brooch'], dad: 0.4 },
  scholar:    { lessons: [['study', 3], ['manner', 0.6]], jobs: ['scribe', 'bakery'], jobShare: 0.25, w: { int: 1, ele: 0.4 }, buy: ['sailor', 'glasses'], dad: 0.4 },
  painter:    { lessons: [['art', 3], ['study', 0.3]], jobs: ['bakery', 'church'], jobShare: 0.25, w: { sen: 1 }, buy: ['smock', 'beret'], dad: 0.4 },
  musician:   { lessons: [['music', 3], ['art', 0.5]], jobs: ['tavern', 'bakery'], jobShare: 0.25, contest: ['beauty'], w: { sen: 1, cha: 0.8 }, buy: ['dancer', 'feather'], dad: 0.4 },
  merchant:   { lessons: [['study', 1]], jobs: ['scribe', 'tavern', 'hunter'], jobShare: 0.75, minGold: 400, w: { int: 0.8 }, goldW: 3, buy: [], dad: 0.3 },
  heir:       { lessons: [['manner', 1.5], ['study', 1.5]], jobs: ['scribe', 'bakery'], jobShare: 0.25, w: { ele: 1, int: 1 }, story: true, arcW: { locket: 30 }, buy: ['maid'], dad: 0.4 },
  wanderer:   { lessons: [['study', 1], ['sword', 1]], jobs: ['tavern'], jobShare: 0.3, restAt: 101, dad: 0, w: {} },
  witch:      { lessons: [['magic', 2.5]], jobs: ['tavern'], jobShare: 0.35, lowMor: true, contest: ['magic'], w: { mag: 1 }, buy: ['robe'], dad: 0.2 },
  thief:      { lessons: [['sword', 1.5]], jobs: ['tavern', 'hunter'], jobShare: 0.45, lowMor: true, w: { str: 1, swd: 1 }, buy: ['train'], dad: 0.2 },
  adventurer: { lessons: [['sword', 1.5]], jobs: ['hunter', 'farm'], jobShare: 0.4, travel: 12, contest: ['martial'], w: { swd: 1, hp: 1 }, buy: ['train', 'hunt'], dad: 0.4 },
  guard:      { lessons: [['sword', 1.5], ['manner', 1.2]], jobs: ['hunter', 'bakery'], jobShare: 0.25, contest: ['martial'], w: { swd: 1, ele: 1 }, buy: ['train', 'maid'], dad: 0.4 },
  magicknight: { lessons: [['sword', 1.3], ['magic', 1]], jobs: ['hunter', 'church'], jobShare: 0.3, contest: ['martial', 'magic'], w: { swd: 1, mag: 1 }, buy: ['train', 'magehat'], dad: 0.4 },
  strategist: { lessons: [['sword', 1], ['study', 1.2]], jobs: ['scribe', 'hunter', 'bakery'], jobShare: 0.3, contest: ['martial'], w: { swd: 1, int: 1 }, buy: ['train', 'glasses'], dad: 0.4 },
  astrologer: { lessons: [['magic', 1.2], ['manner', 1]], jobs: ['church', 'bakery'], jobShare: 0.3, contest: ['magic'], w: { mag: 1, ele: 1 }, buy: ['robe', 'maid'], dad: 0.4 },
  designer:   { lessons: [['art', 1.2], ['manner', 1]], jobs: ['bakery'], jobShare: 0.3, contest: ['beauty'], w: { sen: 1, ele: 1 }, buy: ['smock', 'maid', 'beret'], dad: 0.4 },
  researcher: { lessons: [['magic', 1], ['study', 1.2]], jobs: ['church', 'scribe', 'bakery'], jobShare: 0.3, noContest: true, w: { mag: 1, int: 1 }, buy: ['robe', 'glasses'], dad: 0.4 },
  courtclerk: { lessons: [['study', 1.1], ['manner', 1]], jobs: ['scribe', 'bakery'], jobShare: 0.3, w: { int: 1, ele: 1 }, arcW: { locket: -30 }, buy: ['maid', 'glasses'], dad: 0.4 },
  healer:     { lessons: [['study', 1.5], ['magic', 0.7]], jobs: ['church'], jobShare: 0.35, noContest: true, w: { int: 1, mor: 1, mag: 0.6 }, buy: ['choir'], dad: 0.4 },
  diva:       { lessons: [['music', 2], ['manner', 0.8]], jobs: ['tavern', 'bakery'], jobShare: 0.3, contest: ['beauty'], w: { cha: 1, sen: 0.7 }, buy: ['dancer', 'silk', 'bigribbon'], dad: 0.5, dadOpts: ['praise'] },
  writer:     { lessons: [['study', 1.5], ['art', 1.5]], jobs: ['scribe', 'bakery'], jobShare: 0.25, w: { int: 1, sen: 1 }, buy: ['check'], dad: 0.4 },
  socialite:  { lessons: [['manner', 2], ['music', 1.2]], jobs: ['bakery'], jobShare: 0.25, contest: ['beauty'], w: { ele: 1, cha: 1 }, buy: ['silk', 'pearl'], dad: 0.4 },
  orphanage:  { lessons: [['study', 0.5]], jobs: [['church', 1], ['bakery', 1]], jobShare: 0.6, w: { mor: 1, cook: 0.8 }, story: true, arcW: { orphan: 20 }, buy: ['choir', 'apron'], dad: 0.4 },
  nun:        { lessons: [['study', 0.5], ['music', 0.5]], jobs: ['church'], jobShare: 0.55, w: { mor: 1 }, buy: ['choir'], dad: 0.4 },
  teacher:    { lessons: [['study', 2]], jobs: ['church', 'scribe'], jobShare: 0.35, w: { int: 1, mor: 0.8 }, buy: ['sailor'], dad: 0.4 },
  baker:      { lessons: [['art', 0.5]], jobs: ['bakery'], jobShare: 0.6, noContest: true, w: { cook: 1 }, buy: ['apron'], dad: 0.4 },
  hostess:    { lessons: [['study', 1]], jobs: ['tavern'], jobShare: 0.55, noContest: true, w: { cha: 1 }, dad: 0.4 },
  farmer:     { lessons: [['study', 1], ['art', 1]], jobs: ['farm'], jobShare: 0.6, noContest: true, w: { hp: 1, str: 0.5 }, buy: ['hunt', 'strawhat'], dad: 0.4 },
  dadsgirl:   { lessons: ALL6, jobs: ['bakery', 'farm'], jobShare: 0.3, w: {}, affW: 2, dad: 1, firstChoice: 0.7 },
  villager:   { lessons: ALL6, jobs: ['bakery', 'farm', 'church', 'tavern'], jobShare: 0.35, w: {}, dad: 0.2 },
};
// 엔딩을 노리지 않는 사람들 (다양성 확인용)
const CASUAL = {
  casual_story: { lessons: ALL6, jobs: ['bakery', 'church'], jobShare: 0.3, w: {}, story: true, firstChoice: 0.8, dad: 0.6 },
  casual_two:   { lessons: [['music', 1], ['manner', 1]], jobs: ['bakery'], jobShare: 0.3, w: { cha: 0.5, ele: 0.5 }, contest: ['beauty'], dad: 0.5 },
  casual_sword: { lessons: [['sword', 1], ['study', 1]], jobs: ['farm'], jobShare: 0.3, w: { swd: 0.5 }, contest: ['martial'], dad: 0.3 },
  casual_magic: { lessons: [['magic', 1], ['art', 1]], jobs: ['church'], jobShare: 0.3, w: { mag: 0.5 }, contest: ['magic'], dad: 0.3 },
  no_dad:       { lessons: ALL6, jobs: ['bakery'], jobShare: 0.3, w: {}, dad: 0 },
  half_dad:     { lessons: ALL6, jobs: ['bakery'], jobShare: 0.3, w: {}, dad: 0.5 },
  all_dad:      { lessons: ALL6, jobs: ['bakery'], jobShare: 0.3, w: {}, dad: 1 },
};
module.exports = { P, CASUAL };

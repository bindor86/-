// ===== 하늘 방어대 — 데이터 =====
const VW = 1280, VH = 720, GROUND = 640, TOPBAR = 60;
const BLD_X = [232, 332, 432, 532, 748, 848, 948, 1048];
const BLD_W = 66;
const BAT_POS = [{ x: 640, y: 600 }, { x: 108, y: 600 }, { x: 1172, y: 600 }];

// 적 종류
const ENEMY = {
  meteor: { name: '운석',     speed: 56, r: 10, hp: 1, pts: 25,  chain: 1.0,  tip: '천천히 떨어지는 돌덩이야. 앞쪽을 살짝 노리면 돼.' },
  bomb:   { name: '외계 폭탄', speed: 96, r: 8,  hp: 1, pts: 50,  chain: 1.1,  tip: '운석보다 훨씬 빨라. 떨어질 자리를 미리 노려!' },
  split:  { name: '분열 운석', speed: 56, r: 13, hp: 1, pts: 60,  chain: 1.25, tip: '하늘 중간에서 셋으로 갈라져. 갈라지기 전에 터뜨려!' },
  drone:  { name: '외계 드론', speed: 64, r: 10, hp: 1, pts: 80,  chain: 0.95, tip: '좌우로 흔들리며 내려와. 흔들림 한가운데를 노려 봐.' },
  armor:  { name: '철갑 폭탄', speed: 46, r: 14, hp: 2, pts: 120, chain: 1.35, tip: '두 번 맞혀야 터져. 대신 터질 때 크게 터져!' },
};

// 웨이브 구성 (1~10)
const WAVE_THEME = [null, 'normal', 'normal', 'normal', 'shower', 'normal', 'normal', 'rush', 'normal', 'storm', 'boss'];
const THEME_INFO = {
  normal: { label: '',       tip: '' },
  shower: { label: '유성우',  tip: '운석이 떼로 몰려와! 한 방에 여러 개를 노려 봐.' },
  rush:   { label: '기습',    tip: '적들이 빠르게 내려와. 조금 앞을 노려!' },
  storm:  { label: '총공세',  tip: '온갖 적이 한꺼번에 몰려와. 요격탄도 넉넉히 줄게!' },
  boss:   { label: '모선 출현', tip: '모선을 맞혀서 격추해! 모선 근처에서 터진 연쇄 폭발도 모선에 맞아.' },
};

// 도시 6곳
const CITIES = [
  { id: 'village', name: '별빛 마을',    style: 'village', newEnemy: 'meteor',
    desc: '언덕 위 작은 마을이야. 밤하늘에서 첫 운석들이 떨어지기 시작했어.',
    pool: { meteor: 1 }, song: 'c1',
    boss: { name: '정찰 모선 「흑점」',    hp: 10, w: 200, h: 60, speed: 70, drops: ['meteor'], every: 3.1, n: [1, 1], charge: 0, shield: 0 } },
  { id: 'harbor',  name: '노을 항구',    style: 'harbor', newEnemy: 'bomb',
    desc: '노을 지는 바닷가 항구 도시야. 빠른 외계 폭탄이 섞여서 내려와.',
    pool: { meteor: 3, bomb: 1.3 }, song: 'c2',
    boss: { name: '폭격 모선 「붉은 갈퀴」', hp: 14, w: 214, h: 62, speed: 80, drops: ['bomb', 'meteor'], every: 2.9, n: [1, 2], charge: 0, shield: 0 } },
  { id: 'oasis',   name: '모래 오아시스', style: 'oasis', newEnemy: 'split',
    desc: '사막 한가운데 오아시스 마을이야. 갈라지는 운석을 조심해.',
    pool: { meteor: 3, bomb: 1.4, split: 1.2 }, song: 'c3',
    boss: { name: '사막 모선 「모래 전갈」', hp: 18, w: 228, h: 64, speed: 85, drops: ['split', 'meteor', 'bomb'], every: 2.8, n: [1, 2], charge: 0, shield: 0 } },
  { id: 'snow',    name: '눈꽃 산성',    style: 'snow', newEnemy: 'drone',
    desc: '눈 덮인 산 위의 성이야. 흔들리며 내려오는 드론이 나타나.',
    pool: { meteor: 3, bomb: 1.5, split: 1, drone: 1.3 }, song: 'c4',
    boss: { name: '얼음 모선 「서리 눈」',  hp: 20, w: 244, h: 68, speed: 88, drops: ['drone', 'meteor', 'bomb'], every: 2.9, n: [1, 2], charge: 15, shield: 0 } },
  { id: 'crystal', name: '수정 도시',    style: 'crystal', newEnemy: 'armor',
    desc: '빛나는 수정 탑의 도시야. 두 번 맞혀야 하는 철갑 폭탄이 와.',
    pool: { meteor: 2.6, bomb: 1.5, split: 1, drone: 1.1, armor: 1.1 }, song: 'c5',
    boss: { name: '수정 모선 「프리즘」',   hp: 24, w: 258, h: 70, speed: 92, drops: ['armor', 'bomb', 'drone', 'meteor'], every: 2.9, n: [1, 2], charge: 14, shield: 11 } },
  { id: 'capital', name: '별빛 왕도',    style: 'capital', newEnemy: null,
    desc: '왕국의 수도이자 마지막 도시야. 모든 적과 거대 모선이 몰려와!',
    pool: { meteor: 2.6, bomb: 1.6, split: 1.1, drone: 1.2, armor: 1.1 }, song: 'c6',
    boss: { name: '거대 모선 「검은 별」',  hp: 30, w: 320, h: 84, speed: 78, drops: ['meteor', 'bomb', 'split', 'drone', 'armor'], every: 2.9, n: [1, 2], charge: 12, shield: 10 } },
];

// 포대 강화
const UPGRADES = [
  { id: 'radius',  name: '폭발 범위', costs: [160, 340, 580, 900, 1350],
    val: lv => 54 + lv * 9,       fmt: v => v + '',          unit: '',   desc: '요격탄 폭발이 커져.' },
  { id: 'speed',   name: '요격탄 속도', costs: [140, 290, 520, 800, 1150],
    val: lv => 640 + lv * 110,    fmt: v => v + '',          unit: '',   desc: '요격탄이 더 빨리 날아가.' },
  { id: 'ammo',    name: '탄약 보급', costs: [160, 340, 580, 900, 1350],
    val: lv => lv * 2,            fmt: v => '+' + v,         unit: '발', desc: '웨이브마다 요격탄이 늘어나.' },
  { id: 'chain',   name: '연쇄 폭발', costs: [340, 700, 1150],
    val: lv => 0.62 + lv * 0.12,  fmt: v => Math.round(v * 100) + '%', unit: '', desc: '적이 터질 때 생기는 폭발이 커져.' },
  { id: 'battery', name: '포대 증설', costs: [560, 1000],
    val: lv => 1 + lv,            fmt: v => v + '',          unit: '기', desc: '끝 쪽에 포대가 생겨서 빨리 닿아. 요격탄도 1발 더.' },
  { id: 'shield',  name: '방어막',   costs: [450, 900, 1500],
    val: lv => lv,                fmt: v => v + '',          unit: '회', desc: '웨이브마다 건물 피해를 막아 줘.' },
];
const UPG = Object.fromEntries(UPGRADES.map(u => [u.id, u]));
// 도시별 건물 높이 (8칸)
const BLD_H = {
  village: [50, 62, 46, 84, 56, 68, 44, 60],
  harbor:  [58, 44, 70, 52, 48, 64, 104, 56],
  oasis:   [48, 60, 86, 52, 56, 50, 62, 46],
  snow:    [70, 56, 92, 60, 62, 88, 54, 72],
  crystal: [78, 96, 64, 108, 100, 70, 92, 80],
  capital: [72, 86, 66, 100, 102, 68, 88, 74],
};
const MEGA_MAX = 3, MEGA_COST = 200, MEGA_R = 175;
const repairCost = c => 100 + c * 20;

const RANKS = [
  { min: 18, name: '전설의 하늘 방어대장' },
  { min: 15, name: '하늘 방어대장' },
  { min: 11, name: '베테랑 포수' },
  { min: 0,  name: '새내기 포수' },
];

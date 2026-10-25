// ===== 하늘 방어대 — 소리 (WebAudio 합성) =====
const Sound = (() => {
  let ctx = null, master = null, bgmGain = null, sfxGain = null, noise = null;
  let sfxVol = 0.85, bgmVol = 0.5, bgmTimer = null, bgmStep = 0, bgmSong = 'title';
  let boomBudget = 0, boomT = 0;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 6; comp.knee.value = 8;
      master = ctx.createGain(); master.gain.value = 1.6;   // 넉넉하게 큰 편
      master.connect(comp); comp.connect(ctx.destination);
      sfxGain = ctx.createGain(); sfxGain.gain.value = sfxVol; sfxGain.connect(master);
      bgmGain = ctx.createGain(); bgmGain.gain.value = bgmVol * 0.5; bgmGain.connect(master);
      const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      noise = buf;
      startBgm();
    } catch (e) { ctx = null; }
  }

  function tone(freq, t0, dur, type, vol, dest, slideTo) {
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'triangle';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || sfxGain);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function hiss(t0, dur, vol, f0, f1, type, dest) {
    if (!ctx) return;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise; s.playbackRate.value = 1;
    f.type = type || 'lowpass'; f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(dest || sfxGain);
    s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.05);
  }
  const N = n => 440 * Math.pow(2, (n - 69) / 12);
  function seq(notes, step, type, vol, dur) {
    if (!ctx) return;
    const t = ctx.currentTime + 0.01;
    notes.forEach((n, i) => { if (n) tone(N(n), t + i * step, dur || step * 1.6, type, vol); });
  }
  const PENTA = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96];

  const FX = {
    click:  () => tone(N(84), ctx.currentTime, 0.06, 'square', 0.15),
    select: () => seq([76, 83], 0.06, 'triangle', 0.4),
    cancel: () => seq([72, 65], 0.06, 'triangle', 0.35),
    buy:    () => seq([79, 84, 91], 0.07, 'square', 0.25),
    error:  () => seq([60, 56], 0.09, 'square', 0.22),
    fire:   () => { const t = ctx.currentTime; hiss(t, 0.18, 0.35, 4000, 900, 'bandpass'); tone(320, t, 0.14, 'square', 0.12, null, 980); },
    mega:   () => { const t = ctx.currentTime; hiss(t, 0.4, 0.5, 2500, 400, 'bandpass'); tone(160, t, 0.4, 'sawtooth', 0.18, null, 640); },
    empty:  () => { tone(N(50), ctx.currentTime, 0.05, 'square', 0.2); tone(N(45), ctx.currentTime + 0.06, 0.05, 'square', 0.16); },
    armor:  () => { const t = ctx.currentTime; tone(1300, t, 0.12, 'square', 0.16, null, 900); tone(2100, t, 0.08, 'triangle', 0.14); hiss(t, 0.08, 0.2, 6000, 3000, 'highpass'); },
    split:  () => { const t = ctx.currentTime; tone(500, t, 0.16, 'triangle', 0.3, null, 180); hiss(t, 0.15, 0.25, 3000, 600); },
    bld:    () => { const t = ctx.currentTime; hiss(t, 1.1, 0.9, 900, 60); tone(90, t, 0.7, 'square', 0.3, null, 30); tone(60, t + 0.05, 0.9, 'sine', 0.5, null, 25); },
    ground: () => { const t = ctx.currentTime; hiss(t, 0.35, 0.3, 700, 80); tone(80, t, 0.25, 'sine', 0.3, null, 40); },
    shield: () => { const t = ctx.currentTime; tone(700, t, 0.35, 'sine', 0.4, null, 300); tone(1400, t, 0.25, 'triangle', 0.18, null, 700); },
    siren:  () => { const t = ctx.currentTime; for (let i = 0; i < 3; i++) { tone(520, t + i * 0.6, 0.3, 'sawtooth', 0.12, null, 820); tone(820, t + i * 0.6 + 0.3, 0.3, 'sawtooth', 0.12, null, 520); } },
    horn:   () => { const t = ctx.currentTime; tone(N(33), t, 1.3, 'sawtooth', 0.32); tone(N(40), t, 1.3, 'sawtooth', 0.24); tone(N(45), t + 0.1, 1.2, 'square', 0.12); },
    bossHit: () => { const t = ctx.currentTime; tone(240, t, 0.2, 'square', 0.28, null, 120); tone(1800, t, 0.06, 'square', 0.14); hiss(t, 0.15, 0.3, 5000, 1500, 'highpass'); },
    block:  () => { const t = ctx.currentTime; tone(1200, t, 0.2, 'sine', 0.3, null, 1600); tone(600, t, 0.25, 'triangle', 0.2); },
    bshield: () => { const t = ctx.currentTime; tone(300, t, 0.6, 'sine', 0.3, null, 900); tone(450, t, 0.6, 'triangle', 0.16, null, 1350); },
    charge: () => { const t = ctx.currentTime; tone(120, t, 3.6, 'sawtooth', 0.14, null, 900); tone(122, t, 3.6, 'square', 0.06, null, 910); },
    cancel2: () => seq([84, 79, 88, 91], 0.07, 'square', 0.3),
    beam:   () => { const t = ctx.currentTime; tone(1600, t, 0.5, 'sawtooth', 0.3, null, 80); hiss(t, 0.6, 0.7, 3000, 100); },
    enrage: () => { const t = ctx.currentTime; tone(N(36), t, 0.8, 'sawtooth', 0.3, null, N(48)); tone(N(43), t + 0.1, 0.7, 'sawtooth', 0.2, null, N(55)); },
    bossDie: () => { const t = ctx.currentTime; for (let i = 0; i < 7; i++) { hiss(t + i * 0.22, 0.9, 0.9, 2000, 60); tone(120 - i * 8, t + i * 0.22, 0.6, 'sine', 0.5, null, 30); } },
    resupply: () => seq([67, 72, 79], 0.08, 'triangle', 0.4),
    drop:   () => tone(300, ctx.currentTime, 0.2, 'square', 0.12, null, 120),
    wave:   () => seq([72, 76, 79, 84, 0, 79, 84], 0.09, 'square', 0.28, 0.2),
    win:    () => seq([67, 72, 76, 79, 0, 76, 79, 84, 84, 84], 0.1, 'square', 0.3, 0.22),
    fall:   () => seq([72, 71, 70, 69, 0, 64, 0, 60], 0.18, 'triangle', 0.45, 0.35),
    clear:  () => seq([72, 76, 79, 84, 0, 84, 86, 88, 0, 88, 91, 96], 0.11, 'square', 0.3, 0.25),
    star:   () => seq([88, 93, 100], 0.07, 'triangle', 0.4),
    ending: () => seq([72, 76, 79, 84, 83, 79, 76, 79, 84, 88, 91, 96], 0.16, 'triangle', 0.5, 0.4),
    start:  () => seq([60, 64, 67, 72], 0.07, 'triangle', 0.45),
  };
  function play(name) {
    if (!ctx || !FX[name]) return;
    try { FX[name](); } catch (e) { /* 무시 */ }
  }
  // 폭발: 연쇄가 깊을수록 높은 음이 겹쳐
  function boom(kind, n) {
    if (!ctx) return;
    const now = ctx.currentTime;
    if (now - boomT > 0.05) { boomT = now; boomBudget = 0; }
    if (++boomBudget > 4) return;
    try {
      const big = kind === 'mega' ? 1.6 : kind === 'shot' ? 1 : 0.75;
      hiss(now, 0.55 * big, 0.55 * big, 2600, 120);
      tone(140, now, 0.4 * big, 'sine', 0.45 * big, null, 38);
      if (n && n >= 2) tone(N(PENTA[Math.min(PENTA.length - 1, n - 2)]), now, 0.32, 'triangle', 0.3);
      if (n && n >= 4) tone(N(PENTA[Math.min(PENTA.length - 1, n - 2)] + 12), now + 0.03, 0.25, 'sine', 0.18);
    } catch (e) { /* 무시 */ }
  }

  // 배경음: 멜로디 + 베이스 + 북
  const SONGS = {
    title: { tempo: 0.2, mel: [72, 0, 67, 72, 76, 0, 74, 72, 74, 0, 71, 67, 69, 71, 72, 0, 72, 0, 67, 72, 76, 0, 79, 77, 76, 74, 72, 71, 72, 0, 0, 0],
             bass: [48, 48, 43, 43, 45, 45, 41, 43, 48, 48, 43, 43, 41, 43, 48, 48], drum: 1 },
    c1: { tempo: 0.18, mel: [76, 0, 79, 81, 79, 76, 72, 0, 74, 76, 74, 72, 69, 0, 72, 0, 76, 0, 79, 81, 84, 81, 79, 76, 74, 76, 79, 74, 72, 0, 0, 0],
          bass: [48, 55, 45, 52, 41, 48, 43, 50, 48, 55, 45, 52, 41, 43, 48, 48], drum: 1 },
    c2: { tempo: 0.18, mel: [69, 72, 76, 72, 74, 72, 69, 0, 67, 71, 74, 71, 72, 71, 67, 0, 69, 72, 76, 79, 77, 76, 74, 72, 71, 74, 72, 71, 69, 0, 0, 0],
          bass: [45, 52, 45, 52, 43, 50, 43, 50, 41, 48, 41, 48, 40, 47, 45, 45], drum: 1 },
    c3: { tempo: 0.17, mel: [76, 77, 80, 77, 76, 0, 74, 76, 77, 76, 74, 72, 71, 0, 0, 0, 76, 77, 80, 81, 80, 77, 76, 0, 74, 72, 71, 72, 76, 0, 0, 0],
          bass: [40, 40, 41, 41, 40, 40, 38, 38, 40, 40, 41, 41, 44, 44, 40, 40], drum: 2 },
    c4: { tempo: 0.19, mel: [69, 0, 72, 0, 76, 0, 74, 72, 71, 0, 67, 0, 69, 0, 0, 0, 72, 0, 76, 0, 79, 0, 77, 76, 74, 0, 71, 0, 69, 0, 0, 0],
          bass: [45, 45, 41, 41, 43, 43, 40, 40, 45, 45, 41, 41, 44, 44, 45, 45], drum: 1 },
    c5: { tempo: 0.16, mel: [74, 78, 81, 86, 81, 78, 74, 78, 76, 79, 83, 88, 83, 79, 76, 79, 74, 78, 81, 86, 85, 81, 78, 81, 79, 83, 86, 83, 81, 0, 0, 0],
          bass: [50, 50, 47, 47, 52, 52, 45, 45, 50, 50, 47, 47, 43, 45, 50, 50], drum: 2 },
    c6: { tempo: 0.17, mel: [69, 69, 72, 69, 76, 0, 74, 72, 71, 71, 74, 71, 77, 0, 76, 74, 72, 72, 76, 72, 81, 0, 79, 77, 76, 74, 72, 71, 69, 0, 0, 0],
          bass: [45, 45, 45, 45, 43, 43, 43, 43, 41, 41, 41, 41, 40, 40, 44, 44], drum: 2 },
    boss: { tempo: 0.15, mel: [69, 0, 69, 72, 0, 69, 75, 74, 69, 0, 69, 72, 0, 69, 67, 68, 69, 0, 69, 72, 0, 69, 75, 74, 77, 76, 75, 74, 73, 72, 71, 70],
            bass: [33, 33, 33, 36, 33, 33, 39, 38, 33, 33, 33, 36, 33, 33, 31, 32], drum: 3 },
    shop: { tempo: 0.26, mel: [72, 0, 76, 0, 79, 0, 76, 0, 77, 0, 74, 0, 71, 0, 0, 0, 72, 0, 76, 0, 79, 0, 84, 0, 83, 0, 79, 0, 76, 0, 0, 0],
            bass: [48, 0, 52, 0, 53, 0, 50, 0, 48, 0, 52, 0, 55, 0, 48, 0], drum: 0 },
    ending: { tempo: 0.24, mel: [72, 76, 79, 84, 83, 79, 76, 0, 77, 81, 84, 88, 86, 0, 84, 0, 81, 79, 77, 76, 74, 76, 77, 79, 76, 0, 72, 0, 0, 0, 0, 0],
              bass: [48, 55, 52, 55, 53, 57, 55, 59, 53, 57, 48, 52, 50, 55, 48, 55], drum: 1 },
  };
  function drum(t, i, kind) {
    if (!kind) return;
    if (i % 8 === 0 || (kind >= 2 && i % 8 === 6)) { tone(150, t, 0.16, 'sine', 0.35, bgmGain, 45); }
    if (i % 8 === 4) hiss(t, 0.12, 0.22, 4000, 1200, 'bandpass', bgmGain);
    if (i % 2 === 1 && kind >= 1) hiss(t, 0.04, kind >= 3 ? 0.12 : 0.07, 9000, 6000, 'highpass', bgmGain);
  }
  function startBgm() {
    if (!ctx || bgmTimer) return;
    let next = ctx.currentTime + 0.1;
    bgmTimer = setInterval(() => {
      if (!ctx) return;
      const song = SONGS[bgmSong];
      if (next < ctx.currentTime - 0.05) next = ctx.currentTime + 0.05;  // 탭이 쉬는 동안 밀린 음은 건너뜀
      while (next < ctx.currentTime + 0.4) {
        const i = bgmStep % song.mel.length;
        if (bgmVol > 0) {
          if (song.mel[i]) tone(N(song.mel[i]), next, song.tempo * 1.8, 'square', 0.09, bgmGain);
          if (song.mel[i]) tone(N(song.mel[i] + 12), next, song.tempo * 1.4, 'triangle', 0.075, bgmGain);
          if (i % 2 === 0) { const b = song.bass[(i / 2) % song.bass.length]; if (b) tone(N(b), next, song.tempo * 1.9, 'triangle', 0.22, bgmGain); }
          drum(next, i, song.drum);
        }
        next += song.tempo; bgmStep++;
      }
    }, 100);
  }
  function setSong(name) { if (SONGS[name] && bgmSong !== name) { bgmSong = name; bgmStep = 0; } }
  function setSfx(v) { sfxVol = v; if (sfxGain) sfxGain.gain.value = v; }
  function setBgm(v) { bgmVol = v; if (bgmGain) bgmGain.gain.value = v * 0.5; }

  return { init, play, boom, setSfx, setBgm, setSong, get sfx() { return sfxVol; }, get bgm() { return bgmVol; } };
})();

// ===== 소리 (WebAudio 합성) =====
const Sound = (() => {
  let ctx = null, master = null, bgmGain = null, sfxGain = null;
  let sfxVol = 1, bgmVol = 0.5, bgmOn = true, bgmTimer = null, bgmStep = 0, bgmSong = 'home';

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -10; comp.ratio.value = 4;
      master = ctx.createGain(); master.gain.value = 1.0;
      master.connect(comp); comp.connect(ctx.destination);
      sfxGain = ctx.createGain(); sfxGain.gain.value = sfxVol; sfxGain.connect(master);
      bgmGain = ctx.createGain(); bgmGain.gain.value = bgmVol * 0.55; bgmGain.connect(master);
      if (bgmOn) startBgm();
    } catch (e) { ctx = null; }
  }

  function tone(freq, t0, dur, type, vol, dest, slideTo) {
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'triangle';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || sfxGain);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  const N = n => 440 * Math.pow(2, (n - 69) / 12);  // MIDI → Hz

  function seq(notes, step, type, vol, dur) {
    if (!ctx) return;
    const t = ctx.currentTime + 0.01;
    notes.forEach((n, i) => { if (n) tone(N(n), t + i * step, dur || step * 1.6, type, vol); });
  }

  const FX = {
    click:  () => tone(N(84), ctx.currentTime, 0.07, 'square', 0.18),
    select: () => seq([76, 83], 0.06, 'triangle', 0.45),
    cancel: () => seq([72, 65], 0.06, 'triangle', 0.4),
    tick:   () => tone(N(91), ctx.currentTime, 0.05, 'sine', 0.22),
    coin:   () => seq([88, 95], 0.07, 'square', 0.25),
    good:   () => seq([72, 76, 79], 0.07, 'triangle', 0.5),
    great:  () => seq([72, 76, 79, 84, 88], 0.06, 'triangle', 0.55),
    fail:   () => seq([67, 63, 60], 0.11, 'sawtooth', 0.25),
    sick:   () => seq([64, 60, 57, 52], 0.14, 'triangle', 0.45),
    lvup:   () => seq([72, 76, 79, 84, 0, 84], 0.08, 'square', 0.3),
    event:  () => seq([84, 79, 88], 0.09, 'sine', 0.55),
    buy:    () => seq([79, 84, 91], 0.07, 'square', 0.28),
    start:  () => seq([60, 64, 67, 72], 0.07, 'triangle', 0.5),
    hit:    () => { tone(N(48), ctx.currentTime, 0.18, 'square', 0.4, null, N(36)); tone(N(72), ctx.currentTime, 0.06, 'sawtooth', 0.2); },
    win:    () => seq([67, 72, 76, 79, 0, 76, 79, 84, 84, 84], 0.1, 'square', 0.32, 0.22),
    lose:   () => seq([72, 71, 70, 69, 0, 64], 0.16, 'triangle', 0.45),
    bday:   () => seq([67, 67, 69, 67, 72, 71], 0.16, 'triangle', 0.5),
    ending: () => seq([72, 76, 79, 84, 83, 79, 76, 79, 84, 88, 91], 0.16, 'triangle', 0.5, 0.4),
  };
  function play(name) {
    if (!ctx || !FX[name]) return;
    try { FX[name](); } catch (e) { /* 무시 */ }
  }

  // 오르골풍 배경음
  const SONGS = {
    home: { tempo: 0.27, mel: [76, 0, 79, 76, 74, 0, 72, 74, 76, 0, 72, 0, 67, 0, 0, 0, 69, 0, 72, 69, 67, 0, 64, 67, 69, 0, 72, 74, 72, 0, 0, 0],
            bass: [48, 55, 52, 55, 45, 52, 48, 52, 41, 48, 45, 48, 43, 50, 47, 50] },
    fest: { tempo: 0.18, mel: [72, 76, 79, 76, 72, 76, 79, 84, 81, 79, 77, 76, 74, 76, 77, 79, 72, 76, 79, 76, 72, 76, 79, 84, 83, 81, 79, 77, 76, 74, 72, 0],
            bass: [48, 0, 55, 0, 48, 0, 55, 0, 53, 0, 48, 0, 55, 0, 43, 0] },
  };
  function startBgm() {
    if (!ctx || bgmTimer) return;
    let next = ctx.currentTime + 0.1;
    bgmTimer = setInterval(() => {
      if (!ctx) return;
      const song = SONGS[bgmSong];
      while (next < ctx.currentTime + 0.4) {
        const i = bgmStep % song.mel.length;
        if (song.mel[i]) tone(N(song.mel[i] + 12), next, song.tempo * 2.2, 'sine', 0.22, bgmGain);
        if (i % 2 === 0) { const b = song.bass[(i / 2) % song.bass.length]; if (b) tone(N(b), next, song.tempo * 2.5, 'triangle', 0.16, bgmGain); }
        next += song.tempo; bgmStep++;
      }
    }, 100);
  }
  function stopBgm() { clearInterval(bgmTimer); bgmTimer = null; }
  function setSong(name) { if (SONGS[name] && bgmSong !== name) { bgmSong = name; bgmStep = 0; } }

  function setSfx(v) { sfxVol = v; if (sfxGain) sfxGain.gain.value = v; }
  function setBgm(v) { bgmVol = v; if (bgmGain) bgmGain.gain.value = v * 0.55; }
  function setBgmOn(on) { bgmOn = on; if (on) startBgm(); else stopBgm(); }

  return { init, play, setSfx, setBgm, setBgmOn, setSong, get sfx() { return sfxVol; }, get bgm() { return bgmVol; }, get bgmOn() { return bgmOn; } };
})();

/**
 * ==========================================================================
 * SAYI AVCISI - Profesyonel Sayı Tahmin Oyunu
 * Yapan: Emir Yaşar Kendir
 * ==========================================================================
 */

'use strict';

// ==========================================================================
// 1. TEMA TANIMLARI (15 HAREKETLİ ARKA PLAN + ÖZEL RENK)
// ==========================================================================
const THEMES = [
  { id: 'rgb_rainbow', name: 'RGB Gökkuşağı', free: true, desc: 'Akıcı spektrum dalgaları', icon: '🌈' },
  { id: 'neon_red', name: 'Neon Kırmızı', free: true, desc: 'Siber lazer ve darbe dalgaları', icon: '🔴' },
  { id: 'electric_blue', name: 'Elektrik Mavisi', free: true, desc: 'Yüksek voltajlı enerji ağı', icon: '⚡' },
  { id: 'galaxy_purple', name: 'Galaksi Moru', free: false, desc: 'Dönen kozmik nebula bulutu', icon: '🌌' },
  { id: 'gold_particles', name: 'Altın Parçacıkları', free: false, desc: 'Parıldayan altın tozu fırtınası', icon: '✨' },
  { id: 'matrix_green', name: 'Matrix Yeşili', free: false, desc: 'Kayan dijital kod yağmuru', icon: '💻' },
  { id: 'pink_neon', name: 'Pembe Neon', free: false, desc: 'Cyberpunk fütüristik neon ızgarası', icon: '🌸' },
  { id: 'fire', name: 'Ateş', free: false, desc: 'Yükselen dinamik alev közleri', icon: '🔥' },
  { id: 'ice', name: 'Buz', free: false, desc: 'Kristalize kar ve buz parçaları', icon: '❄️' },
  { id: 'starry_sky', name: 'Yıldızlı Gökyüzü', free: false, desc: 'Yanıp sönen yıldızlar ve kayan meteorlar', icon: '⭐' },
  { id: 'space', name: 'Uzay', free: false, desc: 'Işık hızında hiperuzay yolculuğu', icon: '🚀' },
  { id: 'sunset', name: 'Gün Batımı', free: false, desc: 'Synthwave ufuk ve gün batımı ışınları', icon: '🌅' },
  { id: 'turquoise_waves', name: 'Turkuaz Dalgalar', free: false, desc: 'İpeksi harmonik okyanus dalgaları', icon: '🌊' },
  { id: 'purple_particles', name: 'Mor Parçacıklar', free: false, desc: 'Ağ oluşturan parlayan küreler', icon: '🔮' },
  { id: 'black_neon', name: 'Siyah Neon', free: false, desc: 'Karanlık obsidyen üzerinde lazer çizgileri', icon: '🖤' }
];

// ==========================================================================
// 2. OYUN ZORLUKLARI VE STANDART PARAMETRELER
// ==========================================================================
const DIFFICULTY_CONFIG = {
  kolay: { name: 'Kolay', min: 1, max: 50, attempts: null, badge: 'Başlangıç' },
  orta: { name: 'Orta', min: 1, max: 100, attempts: 10, badge: 'Popüler' },
  zor: { name: 'Zor', min: 1, max: 500, attempts: 9, badge: 'Usta' },
  efsane: { name: 'Efsane', min: 1, max: 1000, attempts: 8, badge: 'Uzman' }
};

// ==========================================================================
// 3. KALICI DURUM YÖNETİCİSİ (LOCALSTORAGE)
// ==========================================================================
const STORAGE_KEY = 'sayi_avcisi_data_v1';

const defaultState = {
  unlockedThemes: ['rgb_rainbow', 'neon_red', 'electric_blue'], // İlk 3 ücretsiz
  activeTheme: 'electric_blue',
  customColor: '#090d16',
  useCustomColor: false,
  unlockTokens: 0,
  records: {
    kolay: null,
    orta: null,
    zor: null,
    efsane: null
  },
  settings: {
    musicVolume: 40,
    sfxVolume: 70,
    isMuted: false,
    animationsEnabled: true
  },
  stats: {
    played: 0,
    won: 0
  }
};

let appState = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(defaultState));
    const parsed = JSON.parse(raw);
    return {
      ...defaultState,
      ...parsed,
      settings: { ...defaultState.settings, ...(parsed.settings || {}) },
      stats: { ...defaultState.stats, ...(parsed.stats || {}) },
      records: { ...defaultState.records, ...(parsed.records || {}) },
      unlockedThemes: Array.isArray(parsed.unlockedThemes) && parsed.unlockedThemes.length >= 3 
        ? parsed.unlockedThemes 
        : ['rgb_rainbow', 'neon_red', 'electric_blue']
    };
  } catch (e) {
    console.warn('Veri yüklenemedi, varsayılanlar uygulanıyor:', e);
    return JSON.parse(JSON.stringify(defaultState));
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.error('Veri kaydedilemedi:', e);
  }
}

// ==========================================================================
// 4. SES MOTORU (WEB AUDIO API) - SIFIR HARİCİ DOSYA, %100 ÇALIŞIR
// ==========================================================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.isMusicPlaying = false;
    this.musicOscillators = [];
    this.musicInterval = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master FX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.ctx.destination);

      // Music Gain
      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.ctx.destination);

      this.updateVolumes();
    } catch (e) {
      console.warn('Web Audio başlatılamadı:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  updateVolumes() {
    if (!this.ctx) return;
    const isMuted = appState.settings.isMuted;
    const sfxVal = isMuted ? 0 : (appState.settings.sfxVolume / 100);
    const musicVal = isMuted ? 0 : (appState.settings.musicVolume / 100) * 0.25; // Yumuşak ambient

    if (this.sfxGain) this.sfxGain.gain.setValueAtTime(sfxVal, this.ctx.currentTime);
    if (this.musicGain) this.musicGain.gain.setValueAtTime(musicVal, this.ctx.currentTime);
  }

  // Klik Sesi
  playClick() {
    if (appState.settings.isMuted || appState.settings.sfxVolume <= 0) return;
    this.init(); this.resume();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  // Daha Yüksek! Sesi (Yukarı doğru iki ton)
  playHigher() {
    if (appState.settings.isMuted || appState.settings.sfxVolume <= 0) return;
    this.init(); this.resume();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.setValueAtTime(560, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  // Daha Düşük! Sesi (Aşağı doğru iki ton)
  playLower() {
    if (appState.settings.isMuted || appState.settings.sfxVolume <= 0) return;
    this.init(); this.resume();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(380, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  // Hata / Uyarı Sesi (Buzzer)
  playWarn() {
    if (appState.settings.isMuted || appState.settings.sfxVolume <= 0) return;
    this.init(); this.resume();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.setValueAtTime(120, now + 0.07);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  }

  // Tebrikler / Kazanma Sesi (Akustik Majör Akor Arpeji)
  playWin() {
    if (appState.settings.isMuted || appState.settings.sfxVolume <= 0) return;
    this.init(); this.resume();
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0.2, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.45);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.45);
      });
    } catch (e) {}
  }

  // Yeni Rekor Fanfarı (Epik Şölen Melodisi)
  playRecord() {
    if (appState.settings.isMuted || appState.settings.sfxVolume <= 0) return;
    this.init(); this.resume();
    try {
      const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.5]; // A4, C#5, E5, A5, C#6, E6
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.25, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.55);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.55);
      });
    } catch (e) {}
  }

  // Oyun Kaybetme Sesi
  playGameOver() {
    if (appState.settings.isMuted || appState.settings.sfxVolume <= 0) return;
    this.init(); this.resume();
    try {
      const now = this.ctx.currentTime;
      const notes = [350, 310, 270, 220];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.18, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.35);
      });
    } catch (e) {}
  }

  // Kilit Açma Sesi (Sihirli Parıltı)
  playUnlock() {
    if (appState.settings.isMuted || appState.settings.sfxVolume <= 0) return;
    this.init(); this.resume();
    try {
      const notes = [587.33, 739.99, 880, 1174.66, 1479.98, 1760];
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.18, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.4);
      });
    } catch (e) {}
  }

  // Ambient Arka Plan Müziği (Synthesizer Chill Pad)
  startAmbientMusic() {
    if (this.isMusicPlaying) return;
    this.init(); this.resume();
    this.isMusicPlaying = true;

    // Rahatlatıcı ve atmosferik lo-fi synth akor zinciri
    const chords = [
      [220, 261.63, 329.63, 392],    // Am7
      [174.61, 220, 261.63, 329.63], // Fmaj7
      [261.63, 329.63, 392, 493.88], // Cmaj7
      [196, 246.94, 293.66, 392]     // G
    ];

    let chordIndex = 0;

    const playNextChord = () => {
      if (!this.isMusicPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const currentNotes = chords[chordIndex];
      chordIndex = (chordIndex + 1) % chords.length;

      currentNotes.forEach(freq => {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(650, now);

          // Yumuşak fade-in & fade-out
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.06, now + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.musicGain);

          osc.start(now);
          osc.stop(now + 4.0);
        } catch (e) {}
      });
    };

    playNextChord();
    this.musicInterval = setInterval(playNextChord, 3800);
  }

  stopAmbientMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

const sounds = new SoundEngine();

// ==========================================================================
// 5. PARÇACIK & HAREKETLİ ARKA PLAN TUVALİ (CANVAS 60 FPS MOTORU)
// ==========================================================================
class BackgroundRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.particles = [];
    this.time = 0;
    this.animId = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initTheme(appState.activeTheme);
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.initTheme(appState.activeTheme);
  }

  initTheme(themeId) {
    this.particles = [];
    this.time = 0;

    if (themeId === 'matrix_green') {
      const columns = Math.floor(this.width / 18);
      for (let i = 0; i < columns; i++) {
        this.particles.push({
          x: i * 18,
          y: Math.random() * this.height,
          speed: 2 + Math.random() * 4,
          chars: '0123456789ABCDEFΣΩΨλπ10'.split(''),
          currentChar: '1'
        });
      }
    } else if (themeId === 'starry_sky' || themeId === 'space') {
      const count = themeId === 'space' ? 160 : 120;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          z: Math.random() * this.width,
          size: Math.random() * 2 + 0.8,
          alpha: Math.random(),
          speed: 0.02 + Math.random() * 0.04
        });
      }
    } else if (themeId === 'gold_particles' || themeId === 'fire' || themeId === 'ice' || themeId === 'purple_particles') {
      const count = themeId === 'purple_particles' ? 45 : 80;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * 1.5,
          vy: themeId === 'fire' ? -(1 + Math.random() * 3) : (themeId === 'gold_particles' ? -(0.5 + Math.random() * 1.5) : (Math.random() - 0.5) * 1.2),
          size: Math.random() * 3 + 1.5,
          alpha: Math.random() * 0.8 + 0.2,
          life: Math.random() * 100
        });
      }
    }
  }

  render() {
    this.time += 0.016;

    // Özel düz renk seçildiyse
    if (appState.useCustomColor) {
      this.ctx.fillStyle = appState.customColor;
      this.ctx.fillRect(0, 0, this.width, this.height);
      if (appState.settings.animationsEnabled) {
        this.drawSubtleStars();
      }
      return;
    }

    const t = appState.activeTheme;

    switch (t) {
      case 'rgb_rainbow':
        this.drawRGBRainbow();
        break;
      case 'neon_red':
        this.drawNeonRed();
        break;
      case 'electric_blue':
        this.drawElectricBlue();
        break;
      case 'galaxy_purple':
        this.drawGalaxyPurple();
        break;
      case 'gold_particles':
        this.drawGoldParticles();
        break;
      case 'matrix_green':
        this.drawMatrixGreen();
        break;
      case 'pink_neon':
        this.drawPinkNeon();
        break;
      case 'fire':
        this.drawFire();
        break;
      case 'ice':
        this.drawIce();
        break;
      case 'starry_sky':
        this.drawStarrySky();
        break;
      case 'space':
        this.drawSpaceWarp();
        break;
      case 'sunset':
        this.drawSunset();
        break;
      case 'turquoise_waves':
        this.drawTurquoiseWaves();
        break;
      case 'purple_particles':
        this.drawPurpleParticles();
        break;
      case 'black_neon':
        this.drawBlackNeon();
        break;
      default:
        this.drawElectricBlue();
    }
  }

  // --- 1. RGB GÖKKUŞAĞI ---
  drawRGBRainbow() {
    const grad = this.ctx.createLinearGradient(
      0, 0, 
      this.width * Math.cos(this.time * 0.5), 
      this.height * Math.sin(this.time * 0.5)
    );
    const h1 = (this.time * 35) % 360;
    const h2 = (h1 + 90) % 360;
    const h3 = (h1 + 180) % 360;
    const h4 = (h1 + 270) % 360;

    grad.addColorStop(0, `hsla(${h1}, 75%, 12%, 1)`);
    grad.addColorStop(0.33, `hsla(${h2}, 80%, 15%, 1)`);
    grad.addColorStop(0.66, `hsla(${h3}, 85%, 12%, 1)`);
    grad.addColorStop(1, `hsla(${h4}, 90%, 10%, 1)`);

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Akıcı dalga çizgileri
    this.ctx.strokeStyle = `hsla(${h1}, 90%, 65%, 0.18)`;
    this.ctx.lineWidth = 3;
    for (let j = 0; j < 3; j++) {
      this.ctx.beginPath();
      for (let x = 0; x <= this.width; x += 20) {
        const y = this.height * 0.5 + Math.sin(x * 0.008 + this.time * 2 + j) * 80;
        if (x === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();
    }
  }

  // --- 2. NEON KIRMIZI ---
  drawNeonRed() {
    this.ctx.fillStyle = '#0a0305';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Dairesel darbe dalgası
    const cx = this.width / 2;
    const cy = this.height / 2;
    const maxR = Math.min(this.width, this.height) * 0.6;
    const pulse = (Math.sin(this.time * 3) + 1) * 0.5;

    const radGrad = this.ctx.createRadialGradient(cx, cy, 10, cx, cy, maxR);
    radGrad.addColorStop(0, `rgba(239, 68, 68, ${0.15 + pulse * 0.1})`);
    radGrad.addColorStop(0.6, 'rgba(153, 27, 27, 0.08)');
    radGrad.addColorStop(1, 'rgba(10, 3, 5, 0)');

    this.ctx.fillStyle = radGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Kırmızı siber ızgara
    this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.12)';
    this.ctx.lineWidth = 1;
    const step = 60;
    const offset = (this.time * 25) % step;

    for (let x = 0; x < this.width; x += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = offset; y < this.height; y += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }

  // --- 3. ELEKTRİK MAVİSİ ---
  drawElectricBlue() {
    this.ctx.fillStyle = '#060c18';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Dinamik elektrik kıvılcımları
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    this.ctx.lineWidth = 1.5;

    const cy = this.height * 0.45;
    for (let i = 0; i < 2; i++) {
      this.ctx.beginPath();
      let x = 0;
      let y = cy + (i - 0.5) * 120;
      this.ctx.moveTo(x, y);
      while (x < this.width) {
        x += 35 + Math.random() * 20;
        y += (Math.random() - 0.5) * 45;
        this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();
    }

    // Mavi derinlik gradyanı
    const grad = this.ctx.createRadialGradient(this.width / 2, this.height / 2, 50, this.width / 2, this.height / 2, this.width * 0.6);
    grad.addColorStop(0, 'rgba(0, 180, 255, 0.12)');
    grad.addColorStop(1, 'transparent');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  // --- 4. GALAKSİ MORU ---
  drawGalaxyPurple() {
    this.ctx.fillStyle = '#080512';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const cx = this.width * 0.5;
    const cy = this.height * 0.5;
    const rot = this.time * 0.2;

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(rot);

    // Nebula sarmalları
    for (let r = 0; r < 4; r++) {
      const armGrad = this.ctx.createRadialGradient(0, 0, 20, 0, 0, this.width * 0.5);
      armGrad.addColorStop(0, 'rgba(168, 85, 247, 0.2)');
      armGrad.addColorStop(0.5, 'rgba(126, 34, 206, 0.1)');
      armGrad.addColorStop(1, 'transparent');

      this.ctx.fillStyle = armGrad;
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, this.width * 0.4, this.height * 0.2, (r * Math.PI) / 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  // --- 5. ALTIN PARÇACIKLARI ---
  drawGoldParticles() {
    this.ctx.fillStyle = '#0a0904';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.particles.forEach(p => {
      p.y += p.vy;
      p.x += Math.sin(this.time + p.life) * 0.5;
      if (p.y < -10) {
        p.y = this.height + 10;
        p.x = Math.random() * this.width;
      }

      this.ctx.fillStyle = `rgba(255, 215, 0, ${p.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();

      // Işıltı halesi
      this.ctx.fillStyle = `rgba(255, 190, 11, ${p.alpha * 0.25})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  // --- 6. MATRIX YEŞİLİ ---
  drawMatrixGreen() {
    this.ctx.fillStyle = 'rgba(5, 12, 7, 0.35)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.fillStyle = '#22c55e';
    this.ctx.font = '14px monospace';

    this.particles.forEach(p => {
      p.y += p.speed;
      if (p.y > this.height) {
        p.y = 0;
        p.speed = 2 + Math.random() * 4;
      }
      p.currentChar = p.chars[Math.floor(Math.random() * p.chars.length)];

      // Lider beyazı
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(p.currentChar, p.x, p.y);

      // Gövde yeşili
      this.ctx.fillStyle = 'rgba(34, 197, 94, 0.75)';
      this.ctx.fillText(p.currentChar, p.x, p.y - 15);
    });
  }

  // --- 7. PEMBE NEON ---
  drawPinkNeon() {
    this.ctx.fillStyle = '#110411';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Neon güneş
    const cx = this.width / 2;
    const cy = this.height * 0.6;
    const sunGrad = this.ctx.createRadialGradient(cx, cy, 10, cx, cy, 140);
    sunGrad.addColorStop(0, '#ff007f');
    sunGrad.addColorStop(0.7, '#a21caf');
    sunGrad.addColorStop(1, 'transparent');
    this.ctx.fillStyle = sunGrad;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 140, 0, Math.PI * 2);
    this.ctx.fill();

    // Ufuk çizgileri
    this.ctx.strokeStyle = 'rgba(255, 0, 127, 0.22)';
    this.ctx.lineWidth = 1.5;
    for (let y = cy; y < this.height; y += 22) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }

  // --- 8. ATEŞ ---
  drawFire() {
    this.ctx.fillStyle = '#0f0502';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.particles.forEach(p => {
      p.y += p.vy;
      p.x += Math.sin(this.time * 2 + p.y * 0.02) * 1.2;
      p.alpha -= 0.005;

      if (p.y < 0 || p.alpha <= 0) {
        p.y = this.height + 10;
        p.x = Math.random() * this.width;
        p.alpha = Math.random() * 0.8 + 0.2;
      }

      const heat = p.y / this.height;
      const color = heat > 0.6 ? `rgba(249, 115, 22, ${p.alpha})` : `rgba(239, 68, 68, ${p.alpha})`;

      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * (1.5 - heat * 0.5), 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  // --- 9. BUZ ---
  drawIce() {
    this.ctx.fillStyle = '#050c18';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.particles.forEach(p => {
      p.y += (Math.abs(p.vy) + 0.5);
      p.x += Math.cos(this.time + p.y * 0.01) * 0.8;
      if (p.y > this.height) {
        p.y = -10;
        p.x = Math.random() * this.width;
      }

      this.ctx.strokeStyle = `rgba(186, 230, 253, ${p.alpha})`;
      this.ctx.lineWidth = 1.2;
      this.ctx.beginPath();
      // Küçük 6 köşeli kar kristali artısı
      const s = p.size;
      this.ctx.moveTo(p.x - s, p.y);
      this.ctx.lineTo(p.x + s, p.y);
      this.ctx.moveTo(p.x, p.y - s);
      this.ctx.lineTo(p.x, p.y + s);
      this.ctx.stroke();
    });
  }

  // --- 10. YILDIZLI GÖKYÜZÜ ---
  drawStarrySky() {
    this.ctx.fillStyle = '#050711';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.particles.forEach(p => {
      const flicker = (Math.sin(this.time * 4 + p.x) + 1) * 0.5;
      this.ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.4 + flicker * 0.6})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Ara sıra kayan meteor
    if (Math.sin(this.time * 0.7) > 0.95) {
      const mx = ((this.time * 800) % (this.width + 300)) - 100;
      const my = (mx * 0.4) % this.height;
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(mx, my);
      this.ctx.lineTo(mx - 80, my - 32);
      this.ctx.stroke();
    }
  }

  // --- 11. UZAY (WARP SPEED) ---
  drawSpaceWarp() {
    this.ctx.fillStyle = 'rgba(3, 5, 12, 0.4)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;

    this.particles.forEach(p => {
      p.z -= 12;
      if (p.z <= 0) {
        p.z = this.width;
        p.x = Math.random() * this.width;
        p.y = Math.random() * this.height;
      }

      const k = 250 / p.z;
      const px = (p.x - cx) * k + cx;
      const py = (p.y - cy) * k + cy;

      if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
        const size = (1 - p.z / this.width) * 3 + 0.5;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(px, py, size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }

  // --- 12. GÜN BATIMI ---
  drawSunset() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#2e1065');
    grad.addColorStop(0.5, '#701a75');
    grad.addColorStop(0.8, '#c2410c');
    grad.addColorStop(1, '#09090b');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Güneş
    const cx = this.width / 2;
    const cy = this.height * 0.75;
    this.ctx.fillStyle = '#fde047';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 110, 0, Math.PI * 2);
    this.ctx.fill();
  }

  // --- 13. TURKUAZ DALGALAR ---
  drawTurquoiseWaves() {
    this.ctx.fillStyle = '#04131a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    for (let i = 0; i < 4; i++) {
      this.ctx.strokeStyle = `rgba(45, 212, 191, ${0.12 + i * 0.08})`;
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      for (let x = 0; x <= this.width; x += 25) {
        const y = this.height * 0.6 + Math.sin(x * 0.006 + this.time * 2 + i * 1.2) * (50 + i * 15);
        if (x === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();
    }
  }

  // --- 14. MOR PARÇACIKLAR & AĞ ---
  drawPurpleParticles() {
    this.ctx.fillStyle = '#0a0514';
    this.ctx.fillRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > this.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.height) p.vy *= -1;

      this.ctx.fillStyle = '#a855f7';
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();

      // Bağlantı çizgileri
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 110) {
          this.ctx.strokeStyle = `rgba(168, 85, 247, ${1 - dist / 110 * 0.6})`;
          this.ctx.lineWidth = 0.8;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }
  }

  // --- 15. SİYAH NEON ---
  drawBlackNeon() {
    this.ctx.fillStyle = '#050507';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const scanY = (this.time * 120) % this.height;

    // Tarama çizgisi
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, scanY);
    this.ctx.lineTo(this.width, scanY);
    this.ctx.stroke();

    // Neon köşe parıltıları
    const grad = this.ctx.createRadialGradient(this.width, this.height, 10, this.width, this.height, 300);
    grad.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
    grad.addColorStop(1, 'transparent');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawSubtleStars() {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < 30; i++) {
      const x = (Math.sin(i * 99 + this.time * 0.2) * 0.5 + 0.5) * this.width;
      const y = (Math.cos(i * 33 + this.time * 0.2) * 0.5 + 0.5) * this.height;
      this.ctx.fillRect(x, y, 2, 2);
    }
  }

  start() {
    const loop = () => {
      if (appState.settings.animationsEnabled) {
        this.render();
      }
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }
}

let bgRenderer = null;

// ==========================================================================
// 6. KONFETİ MOTORU (KUTLAMA PARÇACIKLARI)
// ==========================================================================
class ConfettiEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.active = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  boom() {
    this.particles = [];
    const count = 140;
    const colors = ['#00f0ff', '#ffbe0b', '#ef4444', '#10b981', '#a855f7', '#ec4899', '#ffffff'];

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: this.canvas.width / 2 + (Math.random() - 0.5) * 100,
        y: this.canvas.height / 2 + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 16,
        vy: -8 - Math.random() * 14,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        life: 1.0,
        decay: 0.007 + Math.random() * 0.008
      });
    }

    if (!this.active) {
      this.active = true;
      this.loop();
    }
  }

  loop() {
    if (!this.active) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    let hasAlive = false;
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // Yer çekimi
      p.rotation += p.vRot;
      p.life -= p.decay;

      if (p.life > 0) {
        hasAlive = true;
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.life;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        this.ctx.restore();
      }
    });

    if (hasAlive) {
      requestAnimationFrame(() => this.loop());
    } else {
      this.active = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

let confetti = null;

// ==========================================================================
// 7. OYUN DURUMU VE MOTORU (SAYI AVCISI ENGINE)
// ==========================================================================
class GameEngine {
  constructor() {
    this.selectedDiff = 'orta';
    this.min = 1;
    this.max = 100;
    this.maxAttempts = 10;

    this.secretNumber = 0;
    this.remainingAttempts = 10;
    this.attemptsUsed = 0;
    this.minBound = 1;
    this.maxBound = 100;

    this.guesses = [];
    this.guessedSet = new Set();
    this.isOver = false;
  }

  setDifficulty(diffKey, customMin = null, customMax = null, customAtt = null) {
    this.selectedDiff = diffKey;
    if (diffKey === 'ozel') {
      this.min = Math.max(1, parseInt(customMin) || 1);
      this.max = Math.max(this.min + 1, parseInt(customMax) || 200);
      const att = parseInt(customAtt);
      this.maxAttempts = (att && att > 0) ? att : null;
    } else {
      const cfg = DIFFICULTY_CONFIG[diffKey] || DIFFICULTY_CONFIG.orta;
      this.min = cfg.min;
      this.max = cfg.max;
      this.maxAttempts = cfg.attempts;
    }
  }

  getRecordKey() {
    if (this.selectedDiff === 'ozel') {
      return `ozel_${this.min}_${this.max}_${this.maxAttempts || 'inf'}`;
    }
    return this.selectedDiff;
  }

  getCurrentRecord() {
    const key = this.getRecordKey();
    return appState.records[key] || null;
  }

  startNewGame() {
    this.secretNumber = Math.floor(Math.random() * (this.max - this.min + 1)) + this.min;
    this.remainingAttempts = this.maxAttempts;
    this.attemptsUsed = 0;
    this.minBound = this.min;
    this.maxBound = this.max;
    this.guesses = [];
    this.guessedSet.clear();
    this.isOver = false;

    appState.stats.played += 1;
    saveState();
  }

  // Tahmin Kontrolü
  submitGuess(guessNum) {
    if (this.isOver) return { status: 'game_over' };

    // 1. Sayı mı?
    if (isNaN(guessNum) || guessNum === null) {
      return { status: 'invalid', message: 'Lütfen geçerli bir sayı girin!' };
    }

    // 2. Aralık Kontrolü
    if (guessNum < this.min || guessNum > this.max) {
      return { 
        status: 'out_of_bounds', 
        message: `Lütfen ${this.min} ile ${this.max} arasında bir sayı girin!` 
      };
    }

    // 3. Daha Önce Girildi mi? (Hakkı eksilmez!)
    if (this.guessedSet.has(guessNum)) {
      return { 
        status: 'repeated', 
        message: `⚠️ ${guessNum} sayısını zaten denedin! Tahmin hakkın eksilmedi.` 
      };
    }

    // Geçerli tahmin, kaydet
    this.attemptsUsed += 1;
    this.guessedSet.add(guessNum);

    if (this.maxAttempts !== null) {
      this.remainingAttempts -= 1;
    }

    // Doğru tahmin mi?
    if (guessNum === this.secretNumber) {
      this.isOver = true;
      appState.stats.won += 1;

      const recordKey = this.getRecordKey();
      const prevRecord = appState.records[recordKey] || null;

      let isNewRecord = false;
      let earnedToken = false;

      if (prevRecord === null) {
        // İlk kazanılan oyun: Yalnızca başlangıç rekorunu oluşturur (Ödül vermez)
        appState.records[recordKey] = this.attemptsUsed;
        isNewRecord = false;
      } else if (this.attemptsUsed < prevRecord) {
        // Var olan rekoru GEÇTİ: 1 Kilit Açma Jetonu kazanır!
        appState.records[recordKey] = this.attemptsUsed;
        appState.unlockTokens += 1;
        isNewRecord = true;
        earnedToken = true;
      }

      saveState();

      this.guesses.push({ num: guessNum, hint: 'win', index: this.attemptsUsed });

      return {
        status: 'win',
        secretNumber: this.secretNumber,
        attemptsUsed: this.attemptsUsed,
        prevRecord,
        isNewRecord,
        earnedToken
      };
    }

    // Yanlış tahmin - İpucu belirle
    let hint = '';
    let message = '';

    if (guessNum < this.secretNumber) {
      hint = 'higher';
      message = 'Daha yüksek! ⬆️';
      if (guessNum > this.minBound) {
        this.minBound = guessNum;
      }
    } else {
      hint = 'lower';
      message = 'Daha düşük! ⬇️';
      if (guessNum < this.maxBound) {
        this.maxBound = guessNum;
      }
    }

    this.guesses.push({ num: guessNum, hint, index: this.attemptsUsed });

    // Hak bitti mi?
    if (this.maxAttempts !== null && this.remainingAttempts <= 0) {
      this.isOver = true;
      return {
        status: 'lost',
        secretNumber: this.secretNumber,
        message: 'Hakkın bitti! 😢'
      };
    }

    return {
      status: 'continue',
      hint,
      message,
      minBound: this.minBound,
      maxBound: this.maxBound,
      remainingAttempts: this.remainingAttempts,
      attemptsUsed: this.attemptsUsed
    };
  }
}

const game = new GameEngine();

// ==========================================================================
// 8. KULLANICI ARAYÜZÜ (UI) BAĞLANTILARI & ETKİLEŞİM YÖNETİCİSİ
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Motorları Başlat
  bgRenderer = new BackgroundRenderer('bg-canvas');
  bgRenderer.start();

  confetti = new ConfettiEngine('confetti-canvas');

  // 2. DOM Elemanlarını Seç
  // Ekranlar
  const menuScreen = document.getElementById('menu-screen');
  const gameScreen = document.getElementById('game-screen');

  // Menü Elemanları
  const btnStartGame = document.getElementById('btn-start-game');
  const diffCards = document.querySelectorAll('.diff-card');
  const customRangeBox = document.getElementById('custom-range-box');
  const customMinInput = document.getElementById('custom-min');
  const customMaxInput = document.getElementById('custom-max');
  const customAttInput = document.getElementById('custom-attempts');
  const customRangeSummary = document.getElementById('custom-range-summary');
  const customAttSummary = document.getElementById('custom-attempts-summary');
  const menuCurrentRecord = document.getElementById('menu-current-record');
  const menuTokensCount = document.getElementById('menu-tokens-count');

  // Modallar ve Butonlar
  const btnOpenHowTo = document.getElementById('btn-open-how-to');
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const modalHowTo = document.getElementById('modal-how-to');
  const modalSettings = document.getElementById('modal-settings');
  const modalVictory = document.getElementById('modal-victory');
  const modalGameover = document.getElementById('modal-gameover');

  // Hızlı Üst Butonlar
  const btnQuickSound = document.getElementById('btn-quick-sound');
  const btnQuickTheme = document.getElementById('btn-quick-theme');

  // Oyun İçi Elemanlar
  const btnBackToMenu = document.getElementById('btn-back-to-menu');
  const btnRestartGame = document.getElementById('btn-restart-game');
  const gameDiffLabel = document.getElementById('game-diff-label');
  const gameRangeLabel = document.getElementById('game-range-label');
  const gameAttemptsLabel = document.getElementById('game-attempts-label');
  const gameRecordLabel = document.getElementById('game-record-label');

  const radarMinBound = document.getElementById('radar-min-bound');
  const radarMaxBound = document.getElementById('radar-max-bound');
  const radarActiveRange = document.getElementById('radar-active-range');

  const feedbackDisplay = document.getElementById('feedback-display');
  const feedbackIcon = document.getElementById('feedback-icon');
  const feedbackText = document.getElementById('feedback-text');

  const guessForm = document.getElementById('guess-form');
  const guessInput = document.getElementById('guess-input');
  const btnChipClear = document.getElementById('btn-chip-clear');
  const chipButtons = document.querySelectorAll('.btn-chip[data-delta]');
  const historyList = document.getElementById('history-list');
  const historyCount = document.getElementById('history-count');

  // Zafer & Gameover Elemanları
  const revealNumber = document.getElementById('reveal-number');
  const revealGuesses = document.getElementById('reveal-guesses');
  const revealBest = document.getElementById('reveal-best');
  const victoryRecordBanner = document.getElementById('victory-record-banner');
  const rewardText = document.getElementById('reward-text');
  const btnVictoryStore = document.getElementById('btn-victory-store');
  const btnVictoryPlayAgain = document.getElementById('btn-victory-play-again');
  const btnVictoryMenu = document.getElementById('btn-victory-menu');

  const gameoverRevealNumber = document.getElementById('gameover-reveal-number');
  const btnGameoverRetry = document.getElementById('btn-gameover-retry');
  const btnGameoverMenu = document.getElementById('btn-gameover-menu');

  // Ayarlar & Mağaza Elemanları
  const storeThemeGrid = document.getElementById('store-theme-grid');
  const storeTokensCount = document.getElementById('store-tokens-count');
  const customColorInput = document.getElementById('custom-color-input');
  const btnApplyCustomColor = document.getElementById('btn-apply-custom-color');
  const settingMusicVol = document.getElementById('setting-music-vol');
  const settingSfxVol = document.getElementById('setting-sfx-vol');
  const musicVolumeVal = document.getElementById('music-volume-val');
  const sfxVolumeVal = document.getElementById('sfx-volume-val');
  const settingMuteToggle = document.getElementById('setting-mute-toggle');
  const settingAnimToggle = document.getElementById('setting-anim-toggle');
  const statPlayed = document.getElementById('stat-played');
  const statWon = document.getElementById('stat-won');
  const statUnlocked = document.getElementById('stat-unlocked');
  const btnResetData = document.getElementById('btn-reset-data');

  // ------------------------------------------------------------------------
  // ARAYÜZ YENİLEME VE GÜNCELLEME METOTLARI
  // ------------------------------------------------------------------------
  function updateMenuDisplay() {
    menuTokensCount.textContent = appState.unlockTokens;
    storeTokensCount.textContent = appState.unlockTokens;

    const rec = game.getCurrentRecord();
    if (rec) {
      menuCurrentRecord.textContent = `${rec} Tahmin 🎯`;
    } else {
      menuCurrentRecord.textContent = 'Henüz Yok (- tahminde)';
    }

    statPlayed.textContent = appState.stats.played;
    statWon.textContent = appState.stats.won;
    statUnlocked.textContent = `${appState.unlockedThemes.length}/15`;

    // Ses İkonu
    const soundIconSpan = btnQuickSound.querySelector('.sound-icon');
    if (soundIconSpan) {
      soundIconSpan.textContent = appState.settings.isMuted ? '🔇' : '🔊';
    }
  }

  function updateSettingsControls() {
    settingMusicVol.value = appState.settings.musicVolume;
    musicVolumeVal.textContent = `%${appState.settings.musicVolume}`;
    settingSfxVol.value = appState.settings.sfxVolume;
    sfxVolumeVal.textContent = `%${appState.settings.sfxVolume}`;
    settingMuteToggle.checked = appState.settings.isMuted;
    settingAnimToggle.checked = appState.settings.animationsEnabled;
    customColorInput.value = appState.customColor;
  }

  // 15 Hareketli Arka Plan Kartını Oluştur
  function renderStoreGrid() {
    storeThemeGrid.innerHTML = '';

    THEMES.forEach(theme => {
      const isUnlocked = appState.unlockedThemes.includes(theme.id);
      const isActive = !appState.useCustomColor && appState.activeTheme === theme.id;

      const card = document.createElement('div');
      card.className = `theme-card ${isActive ? 'active-theme' : ''} ${!isUnlocked ? 'locked' : ''}`;

      // Önizleme Stili
      let previewBg = '';
      switch (theme.id) {
        case 'rgb_rainbow': previewBg = 'linear-gradient(45deg, #f43f5e, #fbbf24, #10b981, #00f0ff, #8b5cf6)'; break;
        case 'neon_red': previewBg = 'radial-gradient(circle, #ef4444 0%, #450a0a 100%)'; break;
        case 'electric_blue': previewBg = 'linear-gradient(135deg, #00f0ff 0%, #0369a1 100%)'; break;
        case 'galaxy_purple': previewBg = 'radial-gradient(circle, #a855f7 0%, #1e1b4b 100%)'; break;
        case 'gold_particles': previewBg = 'radial-gradient(circle, #ffd700 0%, #422006 100%)'; break;
        case 'matrix_green': previewBg = 'linear-gradient(180deg, #22c55e 0%, #052e16 100%)'; break;
        case 'pink_neon': previewBg = 'linear-gradient(135deg, #ff007f 0%, #4a044e 100%)'; break;
        case 'fire': previewBg = 'linear-gradient(180deg, #ef4444 0%, #f97316 60%, #451a03 100%)'; break;
        case 'ice': previewBg = 'linear-gradient(135deg, #e0f2fe 0%, #0284c7 100%)'; break;
        case 'starry_sky': previewBg = 'radial-gradient(circle, #1e1b4b 0%, #020617 100%)'; break;
        case 'space': previewBg = 'radial-gradient(circle, #ffffff 5%, #0f172a 60%, #020617 100%)'; break;
        case 'sunset': previewBg = 'linear-gradient(180deg, #701a75 0%, #ea580c 60%, #18181b 100%)'; break;
        case 'turquoise_waves': previewBg = 'linear-gradient(135deg, #2dd4bf 0%, #134e4a 100%)'; break;
        case 'purple_particles': previewBg = 'radial-gradient(circle, #c084fc 0%, #2e1065 100%)'; break;
        case 'black_neon': previewBg = 'linear-gradient(135deg, #0f172a 0%, #020617 100%)'; break;
        default: previewBg = '#0f172a';
      }

      let btnHtml = '';
      if (isActive) {
        btnHtml = `<button class="btn btn-primary theme-btn" disabled>✓ AKTİF</button>`;
      } else if (isUnlocked) {
        btnHtml = `<button class="btn btn-secondary theme-btn" data-action="apply" data-id="${theme.id}">SEÇ VE UYGULA</button>`;
      } else {
        const canUnlock = appState.unlockTokens > 0;
        btnHtml = `<button class="btn ${canUnlock ? 'btn-primary' : 'btn-outline'} theme-btn" data-action="unlock" data-id="${theme.id}" ${!canUnlock ? 'disabled' : ''}>
          ${canUnlock ? '🔓 Kilidi Aç (1 Jeton)' : '🔒 Kilitli (Yeni Rekor Kır)'}
        </button>`;
      }

      card.innerHTML = `
        <div class="theme-preview" style="background: ${previewBg}">
          <span style="font-size: 1.8rem;">${theme.icon}</span>
          <span class="theme-badge-top ${isUnlocked ? 'free' : 'lock'}">${isUnlocked ? 'AÇIK' : 'KİLİTLİ'}</span>
        </div>
        <div class="theme-meta">
          <span class="theme-title">${theme.name}</span>
        </div>
        ${btnHtml}
      `;

      storeThemeGrid.appendChild(card);
    });

    // Buton dinleyicileri
    storeThemeGrid.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        const themeId = e.currentTarget.dataset.id;
        sounds.playClick();

        if (action === 'apply') {
          appState.activeTheme = themeId;
          appState.useCustomColor = false;
          saveState();
          bgRenderer.initTheme(themeId);
          renderStoreGrid();
        } else if (action === 'unlock') {
          if (appState.unlockTokens > 0 && !appState.unlockedThemes.includes(themeId)) {
            appState.unlockTokens -= 1;
            appState.unlockedThemes.push(themeId);
            appState.activeTheme = themeId;
            appState.useCustomColor = false;
            saveState();

            sounds.playUnlock();
            confetti.boom();
            bgRenderer.initTheme(themeId);
            updateMenuDisplay();
            renderStoreGrid();
          }
        }
      });
    });
  }

  // ------------------------------------------------------------------------
  // OYUN EKRANI VE DARALMA RADARI GÜNCELLEMELERİ
  // ------------------------------------------------------------------------
  function setupGameView() {
    const diffName = game.selectedDiff === 'ozel' ? 'Özel' : DIFFICULTY_CONFIG[game.selectedDiff].name;
    gameDiffLabel.textContent = diffName;
    gameRangeLabel.textContent = `${game.min} - ${game.max}`;

    if (game.maxAttempts === null) {
      gameAttemptsLabel.textContent = '∞ Sınırsız';
      gameAttemptsLabel.classList.remove('hearts');
    } else {
      gameAttemptsLabel.textContent = game.remainingAttempts;
      gameAttemptsLabel.classList.add('hearts');
    }

    const rec = game.getCurrentRecord();
    gameRecordLabel.textContent = rec ? `${rec} Tahmin` : '-';

    radarMinBound.textContent = game.min;
    radarMaxBound.textContent = game.max;
    radarActiveRange.style.left = '0%';
    radarActiveRange.style.width = '100%';

    feedbackDisplay.className = 'feedback-display idle';
    feedbackIcon.textContent = '🎯';
    feedbackText.textContent = `Aklımdan ${game.min} ile ${game.max} arasında bir sayı tuttum. Tahminini gir ve avı başlat!`;

    historyList.innerHTML = '<div class="history-empty">Henüz bir tahmin yapmadın.</div>';
    historyCount.textContent = '0 Tahmin';

    guessInput.value = '';
    guessInput.min = game.min;
    guessInput.max = game.max;
    guessInput.focus();
  }

  function updateRadar() {
    radarMinBound.textContent = game.minBound;
    radarMaxBound.textContent = game.maxBound;

    const totalSpan = game.max - game.min;
    if (totalSpan <= 0) return;

    const leftPercent = ((game.minBound - game.min) / totalSpan) * 100;
    const rightPercent = ((game.max - game.maxBound) / totalSpan) * 100;
    const widthPercent = Math.max(0, 100 - leftPercent - rightPercent);

    radarActiveRange.style.left = `${leftPercent}%`;
    radarActiveRange.style.width = `${widthPercent}%`;
  }

  function appendHistoryPill(item) {
    const emptyMsg = historyList.querySelector('.history-empty');
    if (emptyMsg) emptyMsg.remove();

    const pill = document.createElement('div');
    pill.className = `history-pill ${item.hint}`;
    const icon = item.hint === 'higher' ? '▲' : (item.hint === 'lower' ? '▼' : '🎯');

    pill.innerHTML = `
      <span class="pill-index">#${item.index}</span>
      <span class="pill-num">${item.num}</span>
      <span>${icon}</span>
    `;

    historyList.prepend(pill);
    historyCount.textContent = `${game.attemptsUsed} Tahmin`;
  }

  // ------------------------------------------------------------------------
  // ETKİLEŞİM DİNLEYİCİLERİ (EVENT LISTENERS)
  // ------------------------------------------------------------------------

  // Zorluk Seçimi
  diffCards.forEach(card => {
    card.addEventListener('click', () => {
      sounds.playClick();
      diffCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      const diff = card.dataset.diff;
      if (diff === 'ozel') {
        customRangeBox.classList.remove('hidden');
        game.setDifficulty('ozel', customMinInput.value, customMaxInput.value, customAttInput.value);
      } else {
        customRangeBox.classList.add('hidden');
        game.setDifficulty(diff);
      }
      updateMenuDisplay();
    });
  });

  // Özel Aralık Girişleri Dinleyicileri
  [customMinInput, customMaxInput, customAttInput].forEach(inp => {
    inp.addEventListener('input', () => {
      const minVal = parseInt(customMinInput.value) || 1;
      const maxVal = parseInt(customMaxInput.value) || 200;
      const attVal = parseInt(customAttInput.value) || 0;

      customRangeSummary.textContent = `${minVal} - ${maxVal}`;
      customAttSummary.textContent = attVal > 0 ? `${attVal} Hak` : 'Sınırsız';

      game.setDifficulty('ozel', minVal, maxVal, attVal);
      updateMenuDisplay();
    });
  });

  // Oyunu Başlat Butonu
  btnStartGame.addEventListener('click', () => {
    sounds.playClick();
    sounds.startAmbientMusic();

    game.startNewGame();
    setupGameView();

    menuScreen.classList.remove('active');
    gameScreen.classList.add('active');
  });

  // Ana Menüye Dön
  btnBackToMenu.addEventListener('click', () => {
    sounds.playClick();
    gameScreen.classList.remove('active');
    menuScreen.classList.add('active');
    updateMenuDisplay();
  });

  // Yeniden Başlat
  btnRestartGame.addEventListener('click', () => {
    sounds.playClick();
    game.startNewGame();
    setupGameView();
  });

  // Tahmin Gönderme
  guessForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = parseInt(guessInput.value);

    const result = game.submitGuess(val);

    if (result.status === 'invalid' || result.status === 'out_of_bounds' || result.status === 'repeated') {
      sounds.playWarn();
      feedbackDisplay.className = 'feedback-display warn';
      feedbackIcon.textContent = '⚠️';
      feedbackText.textContent = result.message;

      guessInput.classList.add('shake-anim');
      setTimeout(() => guessInput.classList.remove('shake-anim'), 500);
      guessInput.focus();
      return;
    }

    if (result.status === 'continue') {
      if (result.hint === 'higher') {
        sounds.playHigher();
        feedbackDisplay.className = 'feedback-display higher';
        feedbackIcon.textContent = '⬆️';
        feedbackText.textContent = `Daha yüksek! Tuttuğum sayı ${val} sayısından BÜYÜK.`;
      } else {
        sounds.playLower();
        feedbackDisplay.className = 'feedback-display lower';
        feedbackIcon.textContent = '⬇️';
        feedbackText.textContent = `Daha düşük! Tuttuğum sayı ${val} sayısından KÜÇÜK.`;
      }

      if (game.maxAttempts !== null) {
        gameAttemptsLabel.textContent = result.remainingAttempts;
      }

      updateRadar();
      appendHistoryPill({ num: val, hint: result.hint, index: result.attemptsUsed });

      guessInput.value = '';
      guessInput.focus();
    } else if (result.status === 'win') {
      // KAZANDIN!
      appendHistoryPill({ num: val, hint: 'win', index: result.attemptsUsed });

      feedbackDisplay.className = 'feedback-display win';
      feedbackIcon.textContent = '🎯';
      feedbackText.textContent = `TEBRİKLER! SAYIYI BULDUN! Gizli sayı: ${result.secretNumber}`;

      revealNumber.textContent = result.secretNumber;
      revealGuesses.textContent = result.attemptsUsed;
      revealBest.textContent = appState.records[game.getRecordKey()] || result.attemptsUsed;

      if (result.isNewRecord && result.earnedToken) {
        // YENİ REKOR VE ÖDÜL KAZANDI!
        sounds.playRecord();
        confetti.boom();

        victoryRecordBanner.classList.remove('hidden');
        rewardText.textContent = `Eski rekorun ${result.prevRecord} tahmindi. Yeni rekorun ${result.attemptsUsed} tahmin! 1 Adet Arka Plan Kilit Açma Hakkı kazandın!`;
        btnVictoryStore.classList.remove('hidden');
      } else {
        sounds.playWin();
        confetti.boom();
        victoryRecordBanner.classList.add('hidden');
        btnVictoryStore.classList.add('hidden');
      }

      modalVictory.classList.remove('hidden');
    } else if (result.status === 'lost') {
      // HAKLAR TÜKENDİ!
      sounds.playGameOver();
      gameoverRevealNumber.textContent = result.secretNumber;
      modalGameover.classList.remove('hidden');
    }
  });

  // Hızlı Numpad Çipleri (-10, -1, +1, +10)
  chipButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      sounds.playClick();
      const delta = parseInt(btn.dataset.delta);
      const current = parseInt(guessInput.value) || Math.floor((game.minBound + game.maxBound) / 2);
      const next = Math.max(game.min, Math.min(game.max, current + delta));
      guessInput.value = next;
      guessInput.focus();
    });
  });

  btnChipClear.addEventListener('click', () => {
    sounds.playClick();
    guessInput.value = '';
    guessInput.focus();
  });

  // Zafer Modalı Butonları
  btnVictoryPlayAgain.addEventListener('click', () => {
    sounds.playClick();
    modalVictory.classList.add('hidden');
    game.startNewGame();
    setupGameView();
  });

  btnVictoryMenu.addEventListener('click', () => {
    sounds.playClick();
    modalVictory.classList.add('hidden');
    gameScreen.classList.remove('active');
    menuScreen.classList.add('active');
    updateMenuDisplay();
  });

  btnVictoryStore.addEventListener('click', () => {
    sounds.playClick();
    modalVictory.classList.add('hidden');
    renderStoreGrid();
    modalSettings.classList.remove('hidden');
  });

  // Game Over Modalı Butonları
  btnGameoverRetry.addEventListener('click', () => {
    sounds.playClick();
    modalGameover.classList.add('hidden');
    game.startNewGame();
    setupGameView();
  });

  btnGameoverMenu.addEventListener('click', () => {
    sounds.playClick();
    modalGameover.classList.add('hidden');
    gameScreen.classList.remove('active');
    menuScreen.classList.add('active');
    updateMenuDisplay();
  });

  // Modalları Açma / Kapatma
  btnOpenHowTo.addEventListener('click', () => {
    sounds.playClick();
    modalHowTo.classList.remove('hidden');
  });

  btnOpenSettings.addEventListener('click', () => {
    sounds.playClick();
    renderStoreGrid();
    updateSettingsControls();
    modalSettings.classList.remove('hidden');
  });

  btnQuickTheme.addEventListener('click', () => {
    sounds.playClick();
    renderStoreGrid();
    updateSettingsControls();
    modalSettings.classList.remove('hidden');
  });

  btnQuickSound.addEventListener('click', () => {
    appState.settings.isMuted = !appState.settings.isMuted;
    saveState();
    sounds.updateVolumes();
    sounds.playClick();
    updateMenuDisplay();
    updateSettingsControls();
  });

  // Modal Kapatma Butonları (data-close)
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      sounds.playClick();
      const targetId = btn.dataset.close;
      const targetModal = document.getElementById(targetId);
      if (targetModal) targetModal.classList.add('hidden');
    });
  });

  // Modal Dışına Tıklama ile Kapatma
  [modalHowTo, modalSettings].forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) {
        sounds.playClick();
        m.classList.add('hidden');
      }
    });
  });

  // Ayarlar Sekmeleri Arasında Geçiş
  document.querySelectorAll('.modal-tab-btn').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      sounds.playClick();
      document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      tabBtn.classList.add('active');
      const targetPane = document.getElementById(tabBtn.dataset.tab);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // Özel Renk Seçici Butonu
  btnApplyCustomColor.addEventListener('click', () => {
    sounds.playClick();
    const color = customColorInput.value;
    appState.customColor = color;
    appState.useCustomColor = true;
    saveState();
    renderStoreGrid();
  });

  // Ses Sliderları & Switchler
  settingMusicVol.addEventListener('input', (e) => {
    appState.settings.musicVolume = parseInt(e.target.value);
    musicVolumeVal.textContent = `%${appState.settings.musicVolume}`;
    saveState();
    sounds.updateVolumes();
  });

  settingSfxVol.addEventListener('input', (e) => {
    appState.settings.sfxVolume = parseInt(e.target.value);
    sfxVolumeVal.textContent = `%${appState.settings.sfxVolume}`;
    saveState();
    sounds.updateVolumes();
  });

  settingMuteToggle.addEventListener('change', (e) => {
    appState.settings.isMuted = e.target.checked;
    saveState();
    sounds.updateVolumes();
    updateMenuDisplay();
  });

  settingAnimToggle.addEventListener('change', (e) => {
    appState.settings.animationsEnabled = e.target.checked;
    saveState();
  });

  // Veri Sıfırlama Butonu
  btnResetData.addEventListener('click', () => {
    const confirmReset = confirm('Tüm rekorlarınızı, açtığınız arka planları ve ayarlarınızı sıfırlamak istediğinize emin misiniz? Bu işlem geri alınamaz!');
    if (confirmReset) {
      sounds.playWarn();
      localStorage.removeItem(STORAGE_KEY);
      appState = JSON.parse(JSON.stringify(defaultState));
      saveState();
      bgRenderer.initTheme(appState.activeTheme);
      updateMenuDisplay();
      updateSettingsControls();
      renderStoreGrid();
      alert('Tüm verileriniz başarıyla sıfırlandı.');
    }
  });

  // İlk Başlatma Ekran Güncellemeleri
  updateMenuDisplay();
  updateSettingsControls();
  renderStoreGrid();
});


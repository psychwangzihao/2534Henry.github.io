/* ============================================================
   Connecting the Dots · Zihao Wang
   纯原生 2D Canvas · 无 CDN · 无外部依赖 · 可离线双击放映

   结构：
     · 中央为金色"悬念点"（不写字），四周环绕 5 颗章节星。
     · 点星进章节；点过的星点亮并连向中央。
     · 5 颗都点亮后中央解锁；点它 → 全网金光汇聚 → 6 组诗逐组上演，
       第 6 组为"神经元→大脑→金色爆发"特效 + 英文。

   想改文案：改下方 SATELLITES 数组与 FINALE_GROUPS。
   ============================================================ */
'use strict';

/* ----------------------- 可编辑内容 ----------------------- */
const SATELLITES = [
  {
    label: '浙大', idx: '01', word: '汇聚星辰', en: 'WHY ZHEJIANG UNIVERSITY',
    sub: '清北已经成为清北，浙大正在成为浙大', hue: 200,
    logo: { src: './logos/zju-emblem.png', plaque: 'light' },
    site: { url: 'https://www.zju.edu.cn', text: 'zju.edu.cn ↗' },
  },
  {
    label: '心理学', idx: '02', word: '包容万象', en: 'WHY PSYCHOLOGY',
    sub: '心之所求，求索之心', hue: 255,
    psi: true,
    site: { url: 'https://www.psych.zju.edu.cn/', text: 'psych.zju.edu.cn ↗' },
  },
  {
    label: '2050', idx: '03', word: '“让人见面”', en: '2050 GATHERING',
    sub: '自愿 · 年青 · 科技 · 团聚', hue: 170,
    logo: { src: './logos/2050.png', plaque: 'bare' },
    site: { url: 'https://2050.org.cn', text: '2050.org.cn ↗' },
  },
  {
    label: '牛津', idx: '04', word: '全球视野', en: 'GLOBAL',
    sub: '', hue: 218,
    logo: { src: './logos/globe.png', plaque: 'light' },
    site: { url: 'http://www.ir.zju.edu.cn/', text: 'ir.zju.edu.cn ↗' },
  },
  {
    label: 'CO-LAB', idx: '05', word: 'Consciousness Observers', en: 'LINKING ACROSS BOUNDARIES',
    sub: '意识科学跨学科交流小组', hue: 285,
    logo: { src: './logos/colab.png', plaque: 'light' },
    site: { url: 'https://consciousness-observers.github.io', text: 'consciousness-observers.github.io ↗' },
  },
];

const COPY = {
  locked: '请先点亮周围星星',
};

// 终章 6 组诗。每组三行。第 6 组 special（配合粒子特效 + 英文）。
// theme：对应主题（0 浙大 / 1 心理学 / 2 2050 / 3 牛津·全球 / 4 CO-LAB）；第 6 组意识无 theme（不设 logo）。
const FINALE_GROUPS = [
  {
    theme: 0,
    lines: ['孤峰独秀，终有尽时；', '群峦连脉，方成峻极之势。', '浙大的天空，从不只容一颗星辰闪耀。'],
  },
  {
    theme: 1,
    lines: ['一瓢饮，难解千般渴；', '万卷书，方筑大地基。', '人心本是万象，岂能只用一把尺丈量？'],
  },
  {
    theme: 2,
    lines: ['孤灯下求解，万语千言皆困顿；', '不如围坐篝火旁，', '让不同星球的言语，碰撞成黎明的光。'],
  },
  {
    theme: 3,
    lines: ['故土的辞藻再美，', '也须在他乡的语境里淬炼；', '冷眼或是热忱，跨出去便已是回响。'],
  },
  {
    theme: 4,
    lines: ['一粒沙，无法抵挡潮汐的呼吸；', '万千石，方筑成彼岸的长堤。', '我们站在一起，便是群山移步的回音。'],
  },
  {
    special: true,            // 第六组：神经元 → 大脑 → 宇宙
    warm: 2,                  // 第 3 行(index2)金色
    lines: [
      '一个神经元闪烁，只是黑暗中转瞬即逝的光点；',
      '但当千亿个神经元一同放电——',
      '你的大脑里，升起一片比宇宙更璀璨的星空。',
    ],
    en: [
      'One neuron flickers, a fleeting spark in the dark.',
      'But billions firing together—',
      'your brain becomes a universe more radiant than the stars.',
    ],
  },
];

/* ----------------------- DOM 与画布 ----------------------- */
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');

const chapterEl = document.getElementById('chapter');
const finaleEl  = document.getElementById('finale');
const toastEl   = document.getElementById('toast');
const chIdx  = document.getElementById('chIdx');
const chWord = document.getElementById('chWord');
const chEn   = document.getElementById('chEn');
const chSub  = document.getElementById('chSub');
const chRule = document.getElementById('chRule');
const chLogoArea = document.getElementById('chLogoArea');
const chSite     = document.getElementById('chSite');

const fVerse = document.getElementById('fVerse');
const fEn    = document.getElementById('fEn');
const fTag   = document.getElementById('fTag');
const fAdv   = document.getElementById('fAdv');
const restartBtn = document.getElementById('restartBtn');
const bgm    = document.getElementById('bgm');

let W = 0, H = 0, DPR = 1, CX = 0, CY = 0;

const NUM = SATELLITES.length;
const visited   = new Array(NUM).fill(false);
const visitedAt = new Array(NUM).fill(0);
let hubUnlocked = false;

let screen = 'net';      // 'net' | 'chapter' | 'finale'
let chapterIdx = -1;
let cursor = -1;
let finale = { phase: 'off', t0: 0, grp: -1, done: false };

/* 配乐卡点（music.m4a，总长 53.6s）
   视频白/黑屏只是节拍标记：
     白 0.0–4.90s   光点汇聚（converge）
     黑 4.90–10.87s 第 1 组诗
     白 10.87–16.83s 第 2 组诗
     黑 16.83–22.90s 第 3 组诗
     白 22.90–29.10s 第 4 组诗
     黑 29.10–35.00s 第 5 组诗
     白 35.00–53.57s 第 6 组诗（神经元特效 + 英文，长尾）
   各组开始时刻（相对音频 0）： */
const MUSIC = {
  el: bgm,
  CONVERGE_END: 4.90,
  GROUP_START: [4.90, 10.87, 16.83, 22.90, 29.10, 35.00],
  TOTAL: 53.57,
  // 第 6 组内部三行 + 英文的节拍（相对音频 35.00s）
  G6: [35.00 + 0.3, 35.00 + 2.2, 35.00 + 4.2, 35.00 + 6.4],
  started: false,
  useWall: false,   // 自动播放被拦时按真实时间静默走完
  debugT: null,     // 测试/调试：手动指定当前秒数
};
function musicNow() {
  if (!bgm) return 0;
  return bgm.currentTime || 0;
}
function playMusic() {
  if (!bgm) return;
  MUSIC.started = true;
  bgm.currentTime = 0;
  const p = bgm.play();
  if (p && p.catch) p.catch(() => { MUSIC.useWall = true; /* 自动播放被拦则按真实时间静默推进 */ });
  else MUSIC.useWall = true;
}
function pauseMusic() { if (bgm && !bgm.paused) bgm.pause(); }
let convergeParts = [];

/* ----------------------- 星空背景 ----------------------- */
const STARS = [];
function initStars() {
  STARS.length = 0;
  for (let i = 0; i < 160; i++) {
    STARS.push({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.4 + 0.3,
      ph: Math.random() * Math.PI * 2,
      sp: Math.random() * 1.6 + 0.4,
      vy: Math.random() * 0.0008 + 0.00015,
    });
  }
}

/* ----------------------- 布局 ----------------------- */
const ANG  = [-90, -18, 54, 126, 198].map(d => d * Math.PI / 180);
const RFAC = [1.02, 0.9, 1.08, 0.92, 1.0];

function layout() {
  CX = W / 2; CY = H / 2;
  const R = Math.min(Math.min(W, H) * 0.40, W * 0.44);
  for (let i = 0; i < NUM; i++) {
    const a = ANG[i];
    SATELLITES[i]._x = CX + Math.cos(a) * R * RFAC[i];
    SATELLITES[i]._y = CY + Math.sin(a) * R * RFAC[i];
    SATELLITES[i]._r = Math.max(6, Math.min(W, H) * 0.016);
  }
}

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = Math.round(W * DPR);
  cv.height = Math.round(H * DPR);
  cv.style.width = W + 'px';
  cv.style.height = H + 'px';
  layout();
  if (screen === 'chapter' && chapterIdx >= 0) fitWord();
}

/* ----------------------- 小工具 ----------------------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp  = (a, b, t) => a + (b - a) * t;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn  = t => t * t * t;
const hsla = (h, s, l, a) => `hsla(${h},${s}%,${l}%,${a})`;

function strokeSeg(x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color; ctx.lineWidth = width || 1;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function dot(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
function ringDot(x, y, r, color, width) {
  ctx.strokeStyle = color; ctx.lineWidth = width || 1.2;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
}
function glowDot(x, y, radius, inner, outer) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, outer || 'rgba(255,255,255,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  dot(x, y, radius * 0.18, inner || '#fff');
}
function label(x, y, txt, color, size) {
  ctx.fillStyle = color;
  ctx.font = `500 ${size}px -apple-system,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(txt, x, y);
}

/* ----------------------- 章节 ----------------------- */
function fitWord() {
  const s = SATELLITES[chapterIdx];
  if (!s) return;
  // 让长词（如 Consciousness Observers）自动缩到一行内
  const avail = Math.min(window.innerWidth * 0.86, 1200);
  const FONT = '700 100px -apple-system,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
  ctx.font = FONT;
  const w = ctx.measureText(s.word).width;
  let size = Math.min(128, Math.floor(100 * (avail * 0.94) / w));
  size = Math.max(24, size);
  chWord.style.fontSize = size + 'px';
}

function openChapter(i) {
  chapterIdx = i; cursor = i;
  const s = SATELLITES[i];
  chIdx.textContent  = s.idx + ' / ' + String(NUM).padStart(2, '0');
  chWord.textContent = s.word;
  chEn.textContent   = s.en;
  chSub.textContent  = s.sub || '';
  chSub.style.display = s.sub ? '' : 'none';
  if (chRule) chRule.style.display = s.sub ? '' : 'none';
  renderLogo(s);
  renderSite(s);
  if (!visited[i]) { visited[i] = true; visitedAt[i] = performance.now(); checkHub(); }
  screen = 'chapter';
  chapterEl.classList.add('on');
  requestAnimationFrame(() => fitWord());
}

function buildLogoEl(s) {
  if (!s) return null;
  const p = document.createElement('div');
  if (s.psi) {
    p.className = 'plaque light';
    p.innerHTML = '<span class="psi">Ψ</span>';
    return p;
  }
  if (s.logo && s.logo.src) {
    p.className = 'plaque ' + (s.logo.plaque || 'bare');
    const img = document.createElement('img');
    img.src = s.logo.src; img.alt = s.label || '';
    p.appendChild(img);
    return p;
  }
  return null;
}
function renderLogo(s) {
  chLogoArea.innerHTML = '';
  const el = buildLogoEl(s);
  if (el) chLogoArea.appendChild(el);
}

function renderSite(s) {
  chSite.innerHTML = '';
  if (s.site && s.site.url) {
    const a = document.createElement('a');
    a.href = s.site.url; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = s.site.text || s.site.url;
    chSite.appendChild(a);
  }
}

function closeChapter() {
  screen = 'net'; chapterIdx = -1;
  chapterEl.classList.remove('on');
}

function goToChapter(i) { openChapter(((i % NUM) + NUM) % NUM); }
function checkHub() { hubUnlocked = visited.every(Boolean); }

function nav(delta) {
  if (screen === 'finale') return;
  if (screen === 'chapter') goToChapter(chapterIdx + delta);
  else {
    for (let k = 1; k <= NUM; k++) {
      const i = (((cursor < 0 ? -delta : cursor) + delta * k) % NUM + NUM) % NUM;
      if (!visited[i] || k === NUM) { openChapter(i); break; }
    }
  }
}

/* ----------------------- 终章：汇聚 + 6 组诗 ----------------------- */
function tryHub() {
  if (!hubUnlocked) { toast(COPY.locked); return; }
  startFinale();
}

function startFinale() {
  if (screen === 'finale') return;
  screen = 'finale';
  chapterEl.classList.remove('on');
  finale.phase = 'converge';
  finale.t0 = performance.now();
  finale.grp = -1;
  finale.done = false;
  // 汇聚粒子：从网络各方向飞向中央
  convergeParts = [];
  const d = Math.min(W, H);
  for (let i = 0; i < 150; i++) {
    const a = Math.random() * Math.PI * 2;
    const r0 = d * (0.06 + Math.random() * 0.4);
    convergeParts.push({ x: CX + Math.cos(a) * r0, y: CY + Math.sin(a) * r0, delay: Math.random() * 300, dur: 700 + Math.random() * 700 });
  }
  MUSIC.useWall = false;
  playMusic();  // 同步开配乐
}

function renderGroup(g) {
  const grp = FINALE_GROUPS[g];
  fVerse.classList.toggle('g6', !!grp.special);
  fVerse.innerHTML = '';
  fEn.innerHTML = ''; fEn.classList.remove('vis');
  fTag.classList.remove('vis');
  // 终章主题徽章：theme 对应 SATELLITES；第 6 组（意识，无 theme）隐藏空位保持原样
  const fLogoArea = document.getElementById('fLogoArea');
  if (fLogoArea) {
    fLogoArea.innerHTML = '';
    const theme = (grp.theme != null && grp.theme < SATELLITES.length) ? SATELLITES[grp.theme] : null;
    const el = buildLogoEl(theme);
    if (el) { fLogoArea.appendChild(el); fLogoArea.style.display = ''; }
    else fLogoArea.style.display = 'none';
  }
  grp.lines.forEach((ln, li) => {
    const d = document.createElement('div');
    d.className = 'v-line' + (grp.warm != null && li === grp.warm ? ' warm' : '');
    d.textContent = ln;
    d.style.transitionDelay = (li * 0.05) + 's';   // 极短错峰，基本同一拍
    fVerse.appendChild(d);
  });
  const isLast = g === FINALE_GROUPS.length - 1;
  fAdv.classList.toggle('vis', !isLast);
  if (grp.special) {
    // 第 6 组：内部行句由配乐时钟触发（见 drawGroup6），这里仅重置
    g6Tick = -1;
    g6EnBuilt = false;
    g6Beat = 0;
  } else {
    // 普通组：文字逐行浮现由 updateVerseReveal 依 Block 节奏点亮（此处保持隐藏）
  }
}

/* 普通组（前 5 章）逐行点亮：章节时长均分 4 个 Block
   line0 在第 1 Block（切章即现，与 logo 同拍）
   line1 在第 2 Block
   line2 在第 3、4 Block
   用双 rAF 先让行以隐藏态渲染一帧，再点亮 → CSS 过渡自然淡入 */
function updateVerseReveal() {
  const g = finale.grp;
  const grp = FINALE_GROUPS[g];
  if (!grp || grp.special) return;
  const start = MUSIC.GROUP_START[g];
  const end = (g + 1 < MUSIC.GROUP_START.length) ? MUSIC.GROUP_START[g + 1] : MUSIC.TOTAL;
  const dur = Math.max(0.1, end - start);
  const t = Math.max(0, finaleClock() - start);
  let want = 1;
  if (t >= dur * 0.25) want = 2;
  if (t >= dur * 0.5) want = 3;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const lines = fVerse.children;
    for (let i = 0; i < lines.length; i++) lines[i].classList.toggle('vis', i < want);
  }));
}

// 第 6 组：逐行点亮（tick 0/1/2 → 第 1/2/3 行；英文/字由 drawGroup6 依配乐时钟处理）
function g6Reveal(tick) {
  if (tick < 0 || tick > 2 || tick === g6Tick) return;
  g6Tick = tick;
  const lines = fVerse.children;
  if (lines[tick]) lines[tick].classList.add('vis');
}

let g6Tick = -1, g6EnBuilt = false, g6Beat = 0;

// 组间手动推进：跳到相邻组的开始时刻（让配乐与画面同步；点击/→ 快进，← 回退）
function finaleAdvance(delta) {
  if (finale.phase !== 'show') return;
  const t0 = bgm && bgm.readyState >= 2 ? bgm.currentTime : finaleClock();
  const cur = finaleGroupForClock(t0);
  let g = Math.max(0, Math.min(FINALE_GROUPS.length - 1, cur + delta));
  if (g === cur && g === FINALE_GROUPS.length - 1) return;   // 已到第 6 组
  seekTo(Math.max(0, MUSIC.GROUP_START[g] + 0.05));
}

function seekTo(sec) {
  if (bgm && bgm.readyState >= 2) { bgm.currentTime = sec; if (bgm.paused) bgm.play().catch(()=>{}); }
  else {   // 无音频时直接渲染对应组
    const tgt = finaleGroupForClock(sec);
    if (tgt >= 0 && tgt !== finale.grp) { finale.grp = tgt; renderGroup(tgt); }
  }
}

/* 回放（终章按钮） */
restartBtn.addEventListener('click', () => location.reload());

/* ----------------------- 主循环 ----------------------- */
function frame(now) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawBackdrop(now);
  if (screen === 'finale') drawFinale(now);
  else drawWeb(now);
  requestAnimationFrame(frame);
}

function drawBackdrop(now) {
  const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.max(W, H) * 0.72);
  g.addColorStop(0, '#0a1120'); g.addColorStop(0.55, '#060a15'); g.addColorStop(1, '#04050c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const t = now * 0.001;
  for (const s of STARS) {
    let y = (s.y + s.vy * t) % 1; if (y < 0) y += 1;
    const a = 0.14 + 0.22 * (0.5 + 0.5 * Math.sin(s.ph + t * s.sp));
    ctx.globalAlpha = a; dot(s.x * W, y * H, s.r, '#cdd9f5');
  }
  ctx.globalAlpha = 1;
}

/* ----------------------- 网络视图 ----------------------- */
function drawWeb(now) {
  const t = now * 0.001;
  const minDim = Math.min(W, H);
  const hubR = minDim * 0.014;

  for (let i = 0; i < NUM; i++) {
    const s = SATELLITES[i];
    strokeSeg(CX, CY, s._x, s._y, 'rgba(140,175,255,0.06)', 1);
    const b = SATELLITES[(i + 1) % NUM];
    strokeSeg(s._x, s._y, b._x, b._y, 'rgba(140,175,255,0.045)', 1);
  }

  for (let i = 0; i < NUM; i++) {
    if (!visited[i]) continue;
    const s = SATELLITES[i];
    const p = easeOut(clamp((now - visitedAt[i]) / 900, 0, 1));
    const ex = CX + (s._x - CX) * p, ey = CY + (s._y - CY) * p;
    strokeSeg(CX, CY, ex, ey, hsla(s.hue, 90, 72, 0.5), 1.3);
    if (p < 1) glowDot(ex, ey, s._r * 1.1, '#fff', 'rgba(255,255,255,0.85)');
  }

  // 中央悬念金点（不写字）
  const breathe = 0.5 + 0.5 * Math.sin(t * 2.2);
  if (!hubUnlocked) {
    dot(CX, CY, hubR, hsla(45, 90, 70, 0.35));
    ringDot(CX, CY, hubR * 2.0, hsla(45, 90, 75, 0.4), 1);
  } else {
    const grow = hubR * (1.5 + 0.25 * breathe);
    const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, grow * 4.5);
    g.addColorStop(0, 'rgba(255,214,130,0.5)'); g.addColorStop(1, 'rgba(255,214,130,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX, CY, grow * 4.5, 0, Math.PI * 2); ctx.fill();
    glowDot(CX, CY, grow * 2.1, '#fff3cf', 'rgba(255,222,150,0.6)');
    ringDot(CX, CY, grow * (2.1 + 0.5 * breathe), hsla(45, 95, 82, 0.65), 1.4);
  }

  for (let i = 0; i < NUM; i++) drawSatellite(i, now);
}

function drawSatellite(i, now) {
  const s = SATELLITES[i];
  const r = s._r;
  const active = screen === 'chapter' && chapterIdx === i;
  if (visited[i]) {
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.003 + i * 1.7);
    const col = hsla(s.hue, 90, active ? 85 : 72, 1);
    const g = ctx.createRadialGradient(s._x, s._y, 0, s._x, s._y, r * 3.4);
    g.addColorStop(0, hsla(s.hue, 92, 72, 0.45)); g.addColorStop(1, hsla(s.hue, 92, 72, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s._x, s._y, r * 3.4, 0, Math.PI * 2); ctx.fill();
    dot(s._x, s._y, r * (active ? 1.35 : 1.1), col);
    if (active) ringDot(s._x, s._y, r * 2.4, hsla(s.hue, 92, 86, 0.9), 1.4);
    else ringDot(s._x, s._y, r * (2.0 + 0.3 * pulse), hsla(s.hue, 90, 80, 0.5), 1);
    label(s._x, s._y + r * 3.6, s.label, hsla(s.hue, 90, 82, 0.95), 13);
  } else {
    dot(s._x, s._y, r * 0.8, hsla(s.hue, 30, 62, 0.18));
    ringDot(s._x, s._y, r * 1.8, hsla(s.hue, 40, 74, 0.3), 1);
    label(s._x, s._y + r * 2.6, s.label, 'rgba(165,185,225,0.55)', 12);
  }
}

/* ----------------------- 终章绘制 ----------------------- */
const g6Parts = [];   // 第 6 组的粒子（神经元）
let g6BrainTargets = null;

function makeBrainTargets(n) {
  // 采样"双叶大脑剪影"内的点（相对中心，单位：半径）
  const out = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 300) {
    const x = (Math.random() * 2 - 1);      // -1..1
    const y = (Math.random() * 2 - 1);
    // 左叶 / 右叶 / 小脑 三椭圆并集（近似大脑俯视剪影）
    const lobes = [
      { cx: -0.26, cy: 0, rx: 0.24, ry: 0.30 },
      { cx: 0.26, cy: 0, rx: 0.24, ry: 0.30 },
      { cx: 0, cy: 0.52, rx: 0.28, ry: 0.10 },
    ];
    let inside = false;
    for (const L of lobes) {
      const v = ((x - L.cx) / L.rx) ** 2 + ((y - L.cy) / L.ry) ** 2;
      if (v <= 1) { inside = true; break; }
    }
    if (inside) out.push({ x, y });
  }
  return out;
}

function drawFinale(now) {
  const el = now - finale.t0;
  const d = Math.min(W, H);

  if (finale.phase === 'converge') {
    // 网络瞬间点亮 → 汇聚
    const ignite = clamp(el / 700, 0, 1);
    for (let i = 0; i < NUM; i++) {
      const s = SATELLITES[i];
      strokeSeg(CX, CY, s._x, s._y, hsla(s.hue, 90, 78, 0.55 * ignite), 1.5);
      const b = SATELLITES[(i + 1) % NUM];
      strokeSeg(s._x, s._y, b._x, b._y, hsla(210, 90, 82, 0.4 * ignite), 1);
    }
    const col = clamp((el - 400) / 1200, 0, 1);
    const ce = easeIn(col);
    for (let i = 0; i < NUM; i++) {
      const s = SATELLITES[i];
      const px = lerp(s._x, CX, ce), py = lerp(s._y, CY, ce);
      const a = 1 - ce, r = s._r * (1 + ce * 0.6);
      ctx.globalAlpha = a;
      dot(px, py, r * (1.2 + 0.5 * Math.sin(now * 0.02 + i)), hsla(s.hue, 92, 80, 1));
      ctx.globalAlpha = 1;
    }
    const orbT = clamp((el - 400) / 1600, 0, 1);
    const orbR = d * 0.02 + easeOut(orbT) * d * 0.05;
    ctx.globalCompositeOperation = 'lighter';
    for (const p of convergeParts) {
      if (el < p.delay) continue;
      const pp = clamp((el - p.delay) / p.dur, 0, 1);
      if (pp >= 1) continue;
      const rr = 1 - easeOut(pp);
      dot(CX + (p.x - CX) * rr, CY + (p.y - CY) * rr, 1 + pp, hsla(45, 90, 70, Math.sin(Math.PI * pp) * 0.8));
    }
    ctx.globalCompositeOperation = 'source-over';
    const breathe = 0.5 + 0.5 * Math.sin(now * 0.003);
    const glowR = orbR * (4 + 2.2 * breathe);
    const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, glowR);
    g.addColorStop(0, 'rgba(255,241,210,0.96)'); g.addColorStop(0.4, 'rgba(255,208,126,0.6)'); g.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX, CY, glowR, 0, Math.PI * 2); ctx.fill();
    glowDot(CX, CY, orbR * 0.9, '#fffef6', 'rgba(255,244,220,0.9)');

    // 汇聚时长对齐配乐的白屏（0 → CONVERGE_END）
    if (finaleClock() >= MUSIC.CONVERGE_END) {
      finale.phase = 'show';
      finaleEl.classList.add('on');
      fVerse.classList.remove('g6');
      fVerse.innerHTML = '';
      fEn.innerHTML = ''; fEn.classList.remove('vis');
      fTag.classList.remove('vis');
      fAdv.classList.add('vis');
      restartBtn.classList.remove('vis');
      restartBtn.classList.add('hidden');
      // grp 由下面按音乐时钟自动推进
    }
    return;
  }

  // ---- phase 'show'：6 组诗（按配乐节拍自动逐组推进）----
  if (finale.phase === 'show') {
    const sec = finaleClock();
    const tgt = finaleGroupForClock(sec);
    // 只自动前进、不回退（手动 ← 回看不受影响）
    if (tgt > finale.grp) {
      finale.grp = tgt;
      renderGroup(tgt);
    }
    // 普通组文字逐行浮现（前 5 章按 Block 节奏），第 6 组走 drawGroup6
    if (!FINALE_GROUPS[finale.grp].special) updateVerseReveal();
  }
  const grp = FINALE_GROUPS[finale.grp] || FINALE_GROUPS[0];
  // 背后常驻：一团温柔光晕（前 5 组）
  drawAmbientGlow(now);

  if (grp.special) {
    drawGroup6(now, grp);
  }
}

/* 终章统一时钟：能播配乐则跟随音频，否则按真实时间推进（自动播放被拦时仍走完） */
function finaleClock() {
  if (MUSIC.debugT != null) return MUSIC.debugT;   // 测试钩子
  if (bgm && bgm.readyState >= 2 && MUSIC.started && !MUSIC.useWall) {
    return bgm.currentTime;
  }
  return (performance.now() - finale.t0) / 1000;
}
function finaleGroupForClock(sec) {
  if (sec < MUSIC.CONVERGE_END) return -1;
  let g = 0;
  for (let i = 0; i < MUSIC.GROUP_START.length; i++) if (sec >= MUSIC.GROUP_START[i]) g = i;
  return g;
}

function drawAmbientGlow(now) {
  const d = Math.min(W, H);
  const breathe = 0.5 + 0.5 * Math.sin(now * 0.0016);
  const R = d * (0.10 + 0.02 * breathe);
  const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, R * 5);
  g.addColorStop(0, 'rgba(255,214,140,0.22)'); g.addColorStop(1, 'rgba(255,190,110,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX, CY, R * 5, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'lighter';
  // 细微光点环绕（沉稳）
  const t = now * 0.0002;
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * Math.PI * 2 + t;
    const rr = R * (1.6 + 0.35 * Math.sin(now * 0.001 + i * 0.9));
    const px = CX + Math.cos(a) * rr, py = CY + Math.sin(a) * rr;
    dot(px, py, 0.6 + 0.4 * Math.sin(now * 0.002 + i), hsla(48, 90, 70, 0.16));
  }
  ctx.globalCompositeOperation = 'source-over';
}

function initG6() {
  if (g6Parts.length) return;
  g6BrainTargets = makeBrainTargets(140);
  for (let i = 0; i < 150; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.9 + 0.1;
    g6Parts.push({
      x: CX + Math.cos(a) * Math.min(W, H) * 0.5 * r,
      y: CY + Math.sin(a) * Math.min(W, H) * 0.5 * r,
      tx: CX, ty: CY, hue: 200, tw: Math.random() * Math.PI * 2,
      target: null,
    });
  }
}

function drawGroup6(now, grp) {
  const d = Math.min(W, H);
  initG6();

  // 给每个粒子分配大脑剪影内的目标点
  if (!g6Parts[0].target && g6BrainTargets) {
    const tgt = g6BrainTargets.slice();
    g6Parts.forEach(p => {
      if (!tgt.length) tgt.push(...g6BrainTargets);
      const tp = tgt.pop();
      p.target = { x: CX + tp.x * d * 0.34, y: CY + tp.y * d * 0.42 };
    });
  }

  // 进入第 6 组时先填充英文三行
  if (!g6EnBuilt && grp.en) {
    g6EnBuilt = true;
    fEn.innerHTML = '';
    grp.en.forEach(tx => { const el2 = document.createElement('div'); el2.textContent = tx; fEn.appendChild(el2); });
  }
  // 第 6 组：由配乐时钟驱动（音频 35.0s 进入本组）
  const t = Math.max(0, finaleClock() - MUSIC.GROUP_START[5]);   // 本组内的秒数
  // 三个行句在 MUSIC.G6 时刻逐行点亮
  const beatsPassed = MUSIC.G6.filter(x => x <= finaleClock()).length;   // 0..4
  if (beatsPassed >= 1) g6Reveal(Math.min(2, beatsPassed - 1));
  if (beatsPassed >= 4) {   // 英文 + tag + 再看一遍（音频 ~41.4s，第 6 组快节奏收尾）
    fEn.classList.add('vis');
    fTag.classList.add('vis');
    fAdv.classList.remove('vis');
    restartBtn.classList.remove('hidden');
    restartBtn.classList.add('vis');
  }

  // 视觉阶段：0 星云 → 1 大脑 → 2 金色（分段对应行句，整体加快）
  const stage = t < 1.6 ? 0 : t < 3.4 ? 1 : 2;
  const et = t * 1000;

  ctx.globalCompositeOperation = 'lighter';
  const partR = d * 0.5;

  for (const p of g6Parts) {
    let px = p.x, py = p.y;
    if (stage === 0) {
      px += Math.sin(now * 0.0006 + p.tw) * d * 0.012;
      py += Math.cos(now * 0.0007 + p.tw * 1.3) * d * 0.012;
      p.x = px; p.y = py;
    } else if (stage >= 1) {
      const sp = easeOut(clamp((t - 1.4) / 1.2, 0, 1));
      px = lerp(p.x, p.target.x, sp);
      py = lerp(p.y, p.target.y, sp);
      p.x = px; p.y = py;
    }
    const hue = stage === 2 ? 45 : (stage === 1 ? 210 : (Math.sin(now * 0.002 + p.tw) > 0.2 ? 45 : 210));
    const tw = 0.5 + 0.5 * Math.sin(now * 0.004 + p.tw * 2);
    dot(px, py, (stage === 2 ? 1.4 : 1) + tw, hsla(hue, 90, 70, stage === 2 ? 0.9 : 0.5 + 0.3 * tw));
  }

  if (stage === 0) {
    const linkR = partR * 0.14;
    for (let i = 0; i < g6Parts.length; i += 1) {
      const a = g6Parts[i];
      for (let j = i + 1; j < Math.min(g6Parts.length, i + 18); j += 1) {
        const b = g6Parts[j];
        const dd = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        if (dd < linkR * linkR) strokeSeg(a.x, a.y, b.x, b.y, 'rgba(120,200,255,0.16)', 0.6);
      }
    }
  } else if (stage === 1 || stage === 2) {
    const linkR = d * 0.06;
    for (let i = 0; i < g6Parts.length; i += 2) {
      const a = g6Parts[i];
      for (let j = i + 2; j < Math.min(g6Parts.length, i + 12); j += 2) {
        const b = g6Parts[j];
        const dd = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        if (dd < linkR * linkR) strokeSeg(a.x, a.y, b.x, b.y, stage === 2 ? 'rgba(255,214,120,0.3)' : 'rgba(150,190,255,0.35)', 0.8);
      }
    }
  }

  if (stage === 1) {
    const spread = clamp((t - 1.6) / 1.6, 0, 1);
    ctx.strokeStyle = `rgba(160,205,255,${0.5 * (1 - spread)})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(CX, CY, d * 0.34 * (1 + 0.7 * spread), d * 0.42 * (1 + 0.7 * spread), 0, 0, Math.PI * 2); ctx.stroke();
  }

  if (stage === 2) {
    const bloom = clamp((t - 3.4) / 1.0, 0, 1);
    const R = d * 0.5 * (0.7 + 0.5 * bloom);
    const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, R);
    g.addColorStop(0, `rgba(255,240,200,${0.5 * bloom})`);
    g.addColorStop(0.5, `rgba(255,205,120,${0.3 * bloom})`);
    g.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  if (stage <= 1) {
    const pulse = (et % 700) / 700;
    const pr = d * 0.05 + 0.3 * easeOut(pulse) * d * 0.3;
    ctx.strokeStyle = `rgba(255,214,140,${0.25 * (1 - pulse)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(CX, CY, pr, 0, Math.PI * 2); ctx.stroke();
  }
}

/* ----------------------- 交互 ----------------------- */
function hitTest(x, y) {
  if (Math.hypot(x - CX, y - CY) < Math.min(W, H) * 0.05) return { type: 'hub' };
  for (let i = 0; i < NUM; i++) {
    const s = SATELLITES[i];
    if (Math.hypot(x - s._x, y - s._y) < s._r * 3.2) return { type: 'sat', i };
  }
  return null;
}

cv.addEventListener('click', e => {
  if (screen !== 'net') return;
  const rect = cv.getBoundingClientRect();
  const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
  if (!hit) return;
  if (hit.type === 'hub') tryHub();
  else openChapter(hit.i);
});

cv.addEventListener('mousemove', e => {
  if (screen !== 'net') { cv.style.cursor = 'default'; return; }
  const rect = cv.getBoundingClientRect();
  cv.style.cursor = hitTest(e.clientX - rect.left, e.clientY - rect.top) ? 'pointer' : 'default';
});

/* 章节面板 */
chapterEl.addEventListener('click', e => {
  if (e.target.closest('.box')) return;
  closeChapter();
});
chapterEl.querySelectorAll('[data-dir]').forEach(btn => {
  btn.addEventListener('click', e => { e.stopPropagation(); nav(parseInt(btn.dataset.dir, 10)); });
});
document.getElementById('backBtn').addEventListener('click', e => { e.stopPropagation(); closeChapter(); });

/* 终章：任意处点击 → 下一组（避免误点再用 → 前进；点按钮不回退） */
finaleEl.addEventListener('click', e => {
  if (e.target.closest('#restartBtn')) return;   // 重播按钮单独处理
  finaleAdvance(1);
});
document.getElementById('fAdv').addEventListener('click', e => { e.stopPropagation(); finaleAdvance(1); });
document.getElementById('fEn').addEventListener('click', e => { e.stopPropagation(); finaleAdvance(1); });

/* 键盘 */
window.addEventListener('keydown', e => {
  if (e.isComposing) return;
  if (e.key === 'Escape') {
    if (screen === 'chapter') { closeChapter(); e.preventDefault(); }
    else if (screen === 'finale' && finale.phase === 'show') { finaleAdvance(-1); e.preventDefault(); }
    else if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    return;
  }
  if (screen === 'finale') {
    if (finale.phase !== 'show') return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ' || e.key === 'Enter') finaleAdvance(1);
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') finaleAdvance(-1);
    e.preventDefault();
    return;
  }
  if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ' || e.key === 'Enter') { nav(1); e.preventDefault(); }
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { nav(-1); e.preventDefault(); }
  else if (e.key >= '1' && e.key <= '5') { openChapter(+e.key - 1); e.preventDefault(); }
  else if (e.key === '6') { tryHub(); e.preventDefault(); }
  else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
});

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else document.documentElement.requestFullscreen().catch(() => {});
}
document.getElementById('fsbtn').addEventListener('click', toggleFullscreen);

/* 轻提示 */
let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2000);
}

initStars();
resize();
requestAnimationFrame(frame);

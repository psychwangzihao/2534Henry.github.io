/* ============================================================
   Connecting the Dots · Zihao Wang
   纯原生 2D Canvas · 无 CDN · 无外部依赖 · 可离线双击放映

   版式：
     · 画面中央为"意识"金点（hub），四周环绕 5 颗"章节星"。
     · 5 颗星 = 你 8 分钟分享的 5 个章节。点星进入该章（极简内容）。
     · 点过的星会被点亮并连向中央。
     · 5 颗都点亮后，中央金点解锁；点它 → 全网汇聚成光团（终章）。

   想改文案：直接改下方 SATELLITES 数组与 HUB 即可。
   ============================================================ */
'use strict';

/* ----------------------- 可编辑内容 ----------------------- */
// logo: { src, plaque:'light'|'bare' } 在章节卡片顶部显示一个徽标；psi:true 显示希腊字母 Ψ
// site: 官方链接（可选）。改这里即可。
const SATELLITES = [
  {
    label: '浙大', idx: '01', word: '学科交叉', en: 'ZJU · WHY ZHEJIANG',
    sub: '清北已成清北 · 浙大正在成为浙大', hue: 200,
    logo: { src: './logos/zju-emblem.png', plaque: 'light' },
    site: { url: 'https://www.zju.edu.cn', text: 'zju.edu.cn ↗' },
  },
  {
    label: '心理学', idx: '02', word: '广博', en: 'PSYCHOLOGY',
    sub: '最好的学科，只是在中国它还"尚未成为"自己', hue: 255,
    psi: true,
    site: { url: 'https://www.psych.zju.edu.cn/', text: 'psych.zju.edu.cn ↗' },
  },
  {
    label: '2050', idx: '03', word: '团聚', en: '2050 GATHERING',
    sub: '自愿 · 年青 · 科技 · 团聚', hue: 170,
    logo: { src: './logos/2050.png', plaque: 'bare' },
    site: { url: 'https://2050.org.cn', text: '2050.org.cn ↗' },
  },
  {
    label: '牛津', idx: '04', word: '换一个语境', en: 'OXFORD',
    sub: '轻装前行 · 只为真正交流', hue: 218,
    site: { url: 'https://www.ox.ac.uk', text: 'ox.ac.uk ↗' },
  },
  {
    label: 'CO-LAB', idx: '05', word: '跨出边界', en: 'LINKING ACROSS BOUNDARIES',
    sub: '意识科学 · 跨学科小组', hue: 285,
    logo: { src: './logos/colab.png', plaque: 'light' },
    site: { url: 'https://consciousness-observers.github.io', text: 'consciousness-observers.github.io ↗' },
  },
];

const HUB = {
  label: '意识',
  word: '连接 · 涌现',
  en: 'A NEURON IS NOTHING',
  sub: '860亿个神经元连成网络，才成了你。',
};

const COPY = {
  hintChapter: '点星进入 · ← → 换章 · Esc 回网络',
  locked: '先把五颗星都点亮，再来唤醒意识',
};

/* ----------------------- DOM 与画布 ----------------------- */
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');

const chapterEl = document.getElementById('chapter');
const finaleEl  = document.getElementById('finale');
const hintEl    = document.getElementById('hint');
const toastEl   = document.getElementById('toast');
const chIdx  = document.getElementById('chIdx');
const chWord = document.getElementById('chWord');
const chEn   = document.getElementById('chEn');
const chSub  = document.getElementById('chSub');
const chLogoArea = document.getElementById('chLogoArea');
const chSite     = document.getElementById('chSite');

let W = 0, H = 0, DPR = 1, CX = 0, CY = 0;

const NUM = SATELLITES.length;
const visited   = new Array(NUM).fill(false);
const visitedAt = new Array(NUM).fill(0);   // 首次点亮的时刻（用于连接动画）
let hubUnlocked = false;

let screen = 'net';      // 'net' | 'chapter' | 'finale'
let chapterIdx = -1;     // 当前打开的章节
let cursor = -1;         // 键盘导航游标
let finale = { t0: 0, done: false };
let parts = [];

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
    const a = ANG[i];   // 已含从正上方起的朝向
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
}

/* ----------------------- 小工具 ----------------------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp  = (a, b, t) => a + (b - a) * t;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn  = t => t * t * t;
const hsla = (h, s, l, a) => `hsla(${h},${s}%,${l}%,${a})`;

/* ---- 画布基元：全部接受 x,y ---- */
function strokeSeg(x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width || 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function dot(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function ringDot(x, y, r, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width || 1.2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}
function glowDot(x, y, radius, inner, outer) {
  // 两层：外层光晕 + 内层实心
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, outer || 'rgba(255,255,255,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  dot(x, y, radius * 0.18, inner || '#fff');
}
function label(x, y, txt, color, size) {
  ctx.fillStyle = color;
  ctx.font = `500 ${size}px -apple-system,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(txt, x, y);
}

/* ----------------------- 章节 / 状态 ----------------------- */
function openChapter(i) {
  chapterIdx = i;
  cursor = i;
  const s = SATELLITES[i];
  chIdx.textContent  = s.idx + ' / ' + String(NUM).padStart(2, '0');
  chWord.textContent = s.word;
  chEn.textContent   = s.en;
  chSub.textContent  = s.sub || '';
  renderLogo(s);
  renderSite(s);
  if (!visited[i]) {
    visited[i] = true;
    visitedAt[i] = performance.now();
    checkHub();
  }
  screen = 'chapter';
  chapterEl.classList.add('on');
  syncChrome();
}

function renderLogo(s) {
  chLogoArea.innerHTML = '';
  if (s.psi) {
    const p = document.createElement('div');
    p.className = 'plaque light';
    p.innerHTML = '<span class="psi">Ψ</span>';
    chLogoArea.appendChild(p);
  } else if (s.logo && s.logo.src) {
    const p = document.createElement('div');
    p.className = 'plaque ' + (s.logo.plaque || 'bare');
    const img = document.createElement('img');
    img.src = s.logo.src;
    img.alt = s.label || '';
    p.appendChild(img);
    chLogoArea.appendChild(p);
  }
}

function renderSite(s) {
  chSite.innerHTML = '';
  if (s.site && s.site.url) {
    const a = document.createElement('a');
    a.href = s.site.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.site.text || s.site.url;
    chSite.appendChild(a);
  }
}

function closeChapter() {
  screen = 'net';
  chapterIdx = -1;
  chapterEl.classList.remove('on');
  syncChrome();
}

function goToChapter(i) {
  openChapter(((i % NUM) + NUM) % NUM);
}

function checkHub() {
  hubUnlocked = visited.every(Boolean);
}

function tryHub() {
  if (!hubUnlocked) { toast(COPY.locked); return; }
  runFinale();
}

/* 键盘 / 按钮导航：±1 顺序走（不强制，仅辅助） */
function nav(delta) {
  if (screen === 'finale') return;
  if (screen === 'chapter') goToChapter(chapterIdx + delta);
  else {
    // 在网络视图：从当前游标往目标方向找，优先开未点的
    for (let k = 1; k <= NUM; k++) {
      const i = (((cursor < 0 ? -delta : cursor) + delta * k) % NUM + NUM) % NUM;
      if (!visited[i] || k === NUM) { openChapter(i); break; }
    }
  }
}

function syncChrome() {
  hintEl.style.opacity = (screen === 'net' && !finale.done) ? 1 : 0;
}

function runFinale() {
  if (screen === 'finale') return;
  screen = 'finale';
  chapterEl.classList.remove('on');
  finale.t0 = performance.now();
  finale.done = false;
  syncChrome();
  // 从中心向外一圈发射汇聚粒子
  parts = [];
  const d = Math.min(W, H);
  for (let i = 0; i < 150; i++) {
    const a = Math.random() * Math.PI * 2;
    const r0 = d * (0.06 + Math.random() * 0.36);
    parts.push({
      x: CX + Math.cos(a) * r0, y: CY + Math.sin(a) * r0,
      delay: Math.random() * 380,
      dur: 800 + Math.random() * 800,
      hue: Math.random() < 0.7 ? 45 : 210,
    });
  }
}

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
  g.addColorStop(0, '#0a1120');
  g.addColorStop(0.55, '#060a15');
  g.addColorStop(1, '#04050c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const t = now * 0.001;
  for (const s of STARS) {
    let y = (s.y + s.vy * t) % 1;
    if (y < 0) y += 1;
    const a = 0.14 + 0.22 * (0.5 + 0.5 * Math.sin(s.ph + t * s.sp));
    ctx.globalAlpha = a;
    dot(s.x * W, y * H, s.r, '#cdd9f5');
  }
  ctx.globalAlpha = 1;
}

/* ----------------------- 网络 / 目录视图 ----------------------- */
function drawWeb(now) {
  const t = now * 0.001;
  const minDim = Math.min(W, H);
  const hubR = minDim * 0.014;

  // 暗底连线：星→心、星→星（构成一张"网"）
  for (let i = 0; i < NUM; i++) {
    const s = SATELLITES[i];
    strokeSeg(CX, CY, s._x, s._y, 'rgba(140,175,255,0.06)', 1);
    const b = SATELLITES[(i + 1) % NUM];
    strokeSeg(s._x, s._y, b._x, b._y, 'rgba(140,175,255,0.045)', 1);
  }

  // 被点亮星的连接线：从中心"长"向该星
  for (let i = 0; i < NUM; i++) {
    if (!visited[i]) continue;
    const s = SATELLITES[i];
    const p = easeOut(clamp((now - visitedAt[i]) / 900, 0, 1));
    const col = hsla(s.hue, 90, 72, 0.5);
    const ex = CX + (s._x - CX) * p;
    const ey = CY + (s._y - CY) * p;
    strokeSeg(CX, CY, ex, ey, col, 1.3);
    if (p < 1) glowDot(ex, ey, s._r * 1.1, '#fff', 'rgba(255,255,255,0.85)');
  }

  // 中心：意识金点（锁定 vs 解锁）
  const breathe = 0.5 + 0.5 * Math.sin(t * 2.2);
  if (!hubUnlocked) {
    dot(CX, CY, hubR, hsla(45, 90, 70, 0.35));
    ringDot(CX, CY, hubR * 2.0, hsla(45, 90, 75, 0.4), 1);
    label(CX, CY + hubR * 2.2 + 10, HUB.label, 'rgba(255,210,122,0.5)', 12);
  } else {
    const grow = hubR * (1.5 + 0.25 * breathe);
    const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, grow * 4.5);
    g.addColorStop(0, 'rgba(255,214,130,0.5)');
    g.addColorStop(1, 'rgba(255,214,130,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(CX, CY, grow * 4.5, 0, Math.PI * 2); ctx.fill();
    glowDot(CX, CY, grow * 2.1, '#fff3cf', 'rgba(255,222,150,0.6)');
    ringDot(CX, CY, grow * (2.1 + 0.5 * breathe), hsla(45, 95, 82, 0.65), 1.4);
    label(CX, CY + grow * 2.6 + 10, HUB.label, 'rgba(255,236,200,0.95)', 13);
  }

  // 5 颗卫星
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
    g.addColorStop(0, hsla(s.hue, 92, 72, 0.45));
    g.addColorStop(1, hsla(s.hue, 92, 72, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(s._x, s._y, r * 3.4, 0, Math.PI * 2); ctx.fill();
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
function drawFinale(now) {
  const el = now - finale.t0;
  const d = Math.min(W, H);
  const hubR = d * 0.016;

  // 全网络瞬间点亮
  const ignite = clamp(el / 700, 0, 1);
  for (let i = 0; i < NUM; i++) {
    const s = SATELLITES[i];
    strokeSeg(CX, CY, s._x, s._y, hsla(s.hue, 90, 78, 0.55 * ignite), 1.5);
    const b = SATELLITES[(i + 1) % NUM];
    strokeSeg(s._x, s._y, b._x, b._y, hsla(210, 90, 82, 0.4 * ignite), 1);
  }

  // 卫星向中心坍缩
  const col = clamp((el - 500) / 1400, 0, 1);
  const ce = easeIn(col);
  for (let i = 0; i < NUM; i++) {
    const s = SATELLITES[i];
    const px = lerp(s._x, CX, ce);
    const py = lerp(s._y, CY, ce);
    const a = 1 - ce;
    const r = s._r * (1 + ce * 0.6);
    ctx.globalAlpha = a;
    dot(px, py, r * (1.2 + 0.5 * Math.sin(now * 0.02 + i)), hsla(s.hue, 92, 80, 1));
    ctx.globalAlpha = 1;
    if (a > 0.12) label(px, py + r * 2.2, s.label, hsla(s.hue, 92, 82, a), 12);
  }

  // 汇聚粒子（lighter 叠加）
  const orbT = clamp((el - 500) / 1700, 0, 1);
  const orbR = d * 0.02 + easeOut(orbT) * d * 0.06;
  ctx.globalCompositeOperation = 'lighter';
  for (const p of parts) {
    if (el < p.delay) continue;
    const pp = clamp((el - p.delay) / p.dur, 0, 1);
    if (pp >= 1) continue;
    const rr = 1 - easeOut(pp);
    const x = CX + (p.x - CX) * rr;
    const y = CY + (p.y - CY) * rr;
    const a = Math.sin(Math.PI * Math.min(1, pp)) * 0.85;
    dot(x, y, 1 + pp * 1.7, hsla(p.hue, 90, 72, a));
  }
  ctx.globalCompositeOperation = 'source-over';

  // 中央光团
  const breathe = 0.5 + 0.5 * Math.sin(now * 0.003);
  const glowR = orbR * (4 + 2.2 * breathe);
  const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, glowR);
  g.addColorStop(0, 'rgba(255,241,210,0.96)');
  g.addColorStop(0.4, 'rgba(255,208,126,0.6)');
  g.addColorStop(1, 'rgba(255,190,110,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(CX, CY, glowR, 0, Math.PI * 2); ctx.fill();
  glowDot(CX, CY, orbR * 0.85, '#fffef6', 'rgba(255,244,220,0.9)');

  if (!finale.done && el > 1900) {
    finale.done = true;
    finaleEl.classList.add('on');
  }
}

/* ----------------------- 交互 ----------------------- */
function hitTest(x, y) {
  // 中心金点优先（无论是否解锁都可点，解锁与否在 tryHub 里区分）
  const dHub = Math.hypot(x - CX, y - CY);
  if (dHub < Math.min(W, H) * 0.05) return { type: 'hub' };
  for (let i = 0; i < NUM; i++) {
    const s = SATELLITES[i];
    const d = Math.hypot(x - s._x, y - s._y);
    if (d < s._r * 3.2) return { type: 'sat', i };
  }
  return null;
}

cv.addEventListener('click', e => {
  if (screen !== 'net') return;
  const rect = cv.getBoundingClientRect();
  const x = (e.clientX - rect.left);
  const y = (e.clientY - rect.top);
  const hit = hitTest(x, y);
  if (!hit) return;
  if (hit.type === 'hub') tryHub();
  else openChapter(hit.i);
});

// 悬停指针
cv.addEventListener('mousemove', e => {
  if (screen !== 'net') { cv.style.cursor = 'default'; return; }
  const rect = cv.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  cv.style.cursor = hitTest(x, y) ? 'pointer' : 'default';
});

/* 章节面板：点遮罩关闭；导航按钮单独处理 */
chapterEl.addEventListener('click', e => {
  if (e.target.closest('.box')) return; // 按钮区内部不关闭
  closeChapter();
});
chapterEl.querySelectorAll('[data-dir]').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    nav(parseInt(btn.dataset.dir, 10));
  });
});
document.getElementById('backBtn').addEventListener('click', e => {
  e.stopPropagation();
  closeChapter();
});
document.getElementById('restartBtn').addEventListener('click', () => location.reload());

/* 键盘：← → 换章（page 上/下等同）；Esc 返回网络；数字 1-6 直达；F 全屏 */
window.addEventListener('keydown', e => {
  if (e.isComposing) return;
  if (e.key === 'Escape') {
    if (screen === 'chapter') { closeChapter(); e.preventDefault(); }
    else if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    return;
  }
  if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ' || e.key === 'Enter') {
    nav(1); e.preventDefault();
  }
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

/* ----------------------- 轻提示 ----------------------- */
let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2000);
}

/* ----------------------- 启动 ----------------------- */
initStars();
resize();
requestAnimationFrame(frame);

// diagrams.mjs
// --------------------------------------------------------------------
// Original, hand-authored SVG figures for the knowledge-base articles.
//
// Why: AdSense read the site as "low value content" partly because NO article
// had an original image — every page shared og-image.jpg. These are genuine,
// data-accurate diagrams (the fermentation curve is the calculator's own
// bulkHours model; the DDT panel is the real 3-factor formula), branded to the
// site, generated at build time and saved as /diagrams/<name>.svg. They are
// embedded as <figure><img> in the matching articles by inject-articles.js.
//
// Pure SVG, zero dependencies (no sharp/canvas), deterministic — so they build
// identically in CI. Fonts are kept to system/generic families because an SVG
// loaded via <img> cannot pull in the page's web fonts.
//
// Each exported builder returns a complete <svg> document string.

import { bulkHours } from './dough-math.mjs';

// Brand palette (mirrors the --tokens in inject-articles.js SITE_CSS).
const C = {
  cream: '#F4ECDD', creamDeep: '#EBE0CB', paper: '#FBF7EE',
  ink: '#1F1611', inkSoft: '#4A3B2E', inkMute: '#8A7866',
  crust: '#B85C38', crustDeep: '#8E3F22', gold: '#C9A24E', sage: '#6F8060',
  line: '#D9CFB9', lineSoft: '#E8DFC9',
};
const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
const MONO = "ui-monospace,'SF Mono',Menlo,Consolas,monospace";

const W = 820, H = 480;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r2 = (n) => Math.round(n * 100) / 100;

// ---- shared chrome ---------------------------------------------------------

function frame(title, subtitle, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" width="${W}" height="${H}">
  <rect x="0" y="0" width="${W}" height="${H}" rx="16" fill="${C.paper}"/>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="15" fill="none" stroke="${C.line}" stroke-width="2"/>
  <rect x="0" y="0" width="${W}" height="6" rx="3" fill="${C.crust}"/>
  <text x="40" y="50" font-family="${SERIF}" font-size="27" font-weight="700" fill="${C.ink}">${esc(title)}</text>
  ${subtitle ? `<text x="40" y="74" font-family="${SANS}" font-size="15" fill="${C.inkMute}">${esc(subtitle)}</text>` : ''}
  ${inner}
  <text x="${W - 30}" y="${H - 22}" text-anchor="end" font-family="${SANS}" font-size="12" fill="${C.inkMute}" opacity="0.8">loafandlevain.com</text>
  <g transform="translate(${W - 30 - 132}, ${H - 34})" opacity="0.65">
    <ellipse cx="9" cy="8" rx="11" ry="7" fill="${C.gold}" opacity="0.35"/>
    <ellipse cx="9" cy="7" rx="11" ry="7" fill="none" stroke="${C.ink}" stroke-width="1.1"/>
    <path d="M1 7 Q5 2 9 2 Q13 2 17 7" fill="none" stroke="${C.crust}" stroke-width="0.9"/>
  </g>
</svg>`;
}

// small label helper
function txt(x, y, s, { size = 14, fill = C.inkSoft, weight = 400, anchor = 'start', font = SANS, style = '' } = {}) {
  return `<text x="${r2(x)}" y="${r2(y)}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${style ? ` style="${style}"` : ''}>${esc(s)}</text>`;
}

// ---- 1. bulk fermentation time vs temperature (the calculator's own curve) --

export function bulkTempCurve(highlight = 'none') {
  const PL = 78, PR = 770, PT = 100, PB = 396;
  const tMin = 15, tMax = 30, hMax = 13;
  const sx = (t) => PL + (t - tMin) / (tMax - tMin) * (PR - PL);
  const sy = (h) => PB - Math.min(h, hMax) / hMax * (PB - PT);

  // accurate points from the shared bulkHours model at 20% inoculation
  const pts = [];
  for (let t = tMin; t <= tMax + 0.001; t += 0.5) pts.push([t, bulkHours(t, 20)]);
  const poly = pts.map(([t, h]) => `${r2(sx(t))},${r2(sy(h))}`).join(' ');

  let zone = '';
  if (highlight === 'cold') {
    zone = `<rect x="${r2(sx(15))}" y="${PT}" width="${r2(sx(20) - sx(15))}" height="${PB - PT}" fill="${C.sage}" opacity="0.13"/>` +
      txt(sx(17.5), PT + 22, 'cold kitchen', { size: 13, fill: C.sage, anchor: 'middle', weight: 600 });
  } else if (highlight === 'warm') {
    zone = `<rect x="${r2(sx(26))}" y="${PT}" width="${r2(sx(30) - sx(26))}" height="${PB - PT}" fill="${C.crust}" opacity="0.12"/>` +
      txt(sx(28), PT + 22, 'hot kitchen', { size: 13, fill: C.crustDeep, anchor: 'middle', weight: 600 });
  }

  // gridlines + axis labels
  let grid = '';
  for (let t = 15; t <= 30; t += 3) {
    grid += `<line x1="${r2(sx(t))}" y1="${PT}" x2="${r2(sx(t))}" y2="${PB}" stroke="${C.lineSoft}" stroke-width="1"/>`;
    grid += txt(sx(t), PB + 20, `${t}°`, { size: 13, fill: C.inkMute, anchor: 'middle', font: MONO });
  }
  for (let h = 0; h <= 12; h += 2) {
    grid += `<line x1="${PL}" y1="${r2(sy(h))}" x2="${PR}" y2="${r2(sy(h))}" stroke="${C.lineSoft}" stroke-width="1"/>`;
    grid += txt(PL - 12, sy(h) + 4, `${h}h`, { size: 12, fill: C.inkMute, anchor: 'end', font: MONO });
  }

  const refX = sx(24), refY = sy(5);
  const inner = `
  ${zone}
  ${grid}
  <line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PB}" stroke="${C.ink}" stroke-width="1.5"/>
  <line x1="${PL}" y1="${PB}" x2="${PR}" y2="${PB}" stroke="${C.ink}" stroke-width="1.5"/>
  <polyline points="${poly}" fill="none" stroke="${C.crust}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
  <circle cx="${r2(refX)}" cy="${r2(refY)}" r="6" fill="${C.crustDeep}"/>
  <circle cx="${r2(refX)}" cy="${r2(refY)}" r="11" fill="none" stroke="${C.crustDeep}" stroke-width="1.4" opacity="0.5"/>
  ${txt(refX + 16, refY - 6, '24°C ≈ 5 h', { size: 14, fill: C.ink, weight: 700 })}
  ${txt(refX + 16, refY + 12, 'calculator baseline (20% starter)', { size: 12, fill: C.inkMute })}
  ${txt((PL + PR) / 2, PB + 48, 'dough temperature', { size: 14, fill: C.inkSoft, anchor: 'middle', weight: 600 })}
  <text x="26" y="${(PT + PB) / 2}" font-family="${SANS}" font-size="14" font-weight="600" fill="${C.inkSoft}" text-anchor="middle" transform="rotate(-90 26 ${(PT + PB) / 2})">bulk time to ~50% rise</text>`;

  const sub = highlight === 'cold' ? 'Every ~8 °C colder roughly doubles the wait — winter math.'
    : highlight === 'warm' ? 'Every ~8 °C warmer roughly halves the wait — summer math.'
    : 'Fermentation rate follows a Q10 curve: ~8 °C doubles or halves the time.';
  return frame('How temperature drives bulk time', sub, inner);
}

// ---- 2. gummy/dense vs open crumb -----------------------------------------

function crumbSlice(x, y, w, h, holes, gummy, label, sub) {
  const crust = `<path d="M${x} ${y + 18} Q${x} ${y} ${x + 18} ${y} L${x + w - 18} ${y} Q${x + w} ${y} ${x + w} ${y + 18} L${x + w} ${y + h} L${x} ${y + h} Z" fill="${C.creamDeep}" stroke="${C.crustDeep}" stroke-width="2.5"/>`;
  const crustTop = `<path d="M${x} ${y + 18} Q${x} ${y} ${x + 18} ${y} L${x + w - 18} ${y} Q${x + w} ${y} ${x + w} ${y + 18}" fill="none" stroke="${C.crust}" stroke-width="5" stroke-linecap="round"/>`;
  let holeSvg = '';
  for (const [hx, hy, hr] of holes) {
    holeSvg += `<ellipse cx="${x + hx}" cy="${y + hy}" rx="${hr}" ry="${hr * 0.8}" fill="${C.paper}" stroke="${C.line}" stroke-width="1"/>`;
  }
  const gummyBand = gummy
    ? `<rect x="${x + 4}" y="${y + h - 34}" width="${w - 8}" height="30" rx="4" fill="${C.inkMute}" opacity="0.32"/>` +
      txt(x + w / 2, y + h - 14, 'dense, gummy band', { size: 11, fill: C.inkSoft, anchor: 'middle', weight: 600 })
    : '';
  return crust + holeSvg + gummyBand + crustTop +
    txt(x + w / 2, y + h + 28, label, { size: 16, fill: C.ink, anchor: 'middle', weight: 700, font: SERIF }) +
    txt(x + w / 2, y + h + 50, sub, { size: 12.5, fill: C.inkMute, anchor: 'middle' });
}

export function crumbCompare() {
  const gummyHoles = [[40, 30, 5], [70, 26, 4], [110, 34, 6], [150, 28, 4], [190, 32, 5], [230, 27, 4], [60, 50, 3], [120, 52, 3], [180, 50, 3]];
  const openHoles = [[45, 40, 14], [95, 30, 9], [140, 55, 18], [200, 38, 12], [250, 60, 15], [70, 80, 11], [170, 95, 16], [240, 110, 10], [110, 128, 11], [45, 122, 8], [205, 138, 9]];
  const inner = `
  ${crumbSlice(70, 130, 300, 170, gummyHoles, true, 'Underbaked / underproofed', 'tight holes, sticky band near the base')}
  ${crumbSlice(452, 130, 300, 170, openHoles, false, 'Well-fermented', 'even, varied holes all the way down')}
  ${txt(410, 215, '→', { size: 40, fill: C.crust, anchor: 'middle', weight: 400 })}`;
  return frame('What the crumb is telling you', 'A gummy band low in the slice means the dough was not done — not that you need more flour.', inner);
}

// ---- 3. starter activity curve (feed -> peak -> collapse) -------------------

export function starterCurve() {
  const PL = 78, PR = 770, PT = 112, PB = 398;
  const tMax = 12, yMax = 1.16;
  const sx = (t) => PL + t / tMax * (PR - PL);
  const sy = (v) => PB - v / yMax * (PB - PT);
  // lag (0-2h flat low), rise (2-6h up to peak), peak ~6h, collapse (6-12h down)
  const pts = [];
  for (let t = 0; t <= 12.001; t += 0.25) {
    let v;
    if (t < 2) v = 0.08 + 0.02 * t;
    else if (t <= 6) v = 0.12 + 0.88 * Math.pow((t - 2) / 4, 1.4);
    else v = 1 - 0.62 * Math.pow((t - 6) / 6, 1.2);
    pts.push([t, Math.max(0.04, v)]);
  }
  const poly = pts.map(([t, v]) => `${r2(sx(t))},${r2(sy(v))}`).join(' ');
  let grid = '';
  for (let t = 0; t <= 12; t += 2) {
    grid += `<line x1="${r2(sx(t))}" y1="${PT}" x2="${r2(sx(t))}" y2="${PB}" stroke="${C.lineSoft}" stroke-width="1"/>`;
    grid += txt(sx(t), PB + 22, `${t}h`, { size: 12, fill: C.inkMute, anchor: 'middle', font: MONO });
  }
  const peakX = sx(5.4), peakX2 = sx(6.6);
  const inner = `
  ${grid}
  <rect x="${r2(peakX)}" y="${PT}" width="${r2(peakX2 - peakX)}" height="${PB - PT}" fill="${C.sage}" opacity="0.16"/>
  ${txt((peakX + peakX2) / 2, PT - 8, 'use it now', { size: 13, fill: C.sage, anchor: 'middle', weight: 700 })}
  <line x1="${PL}" y1="${PB}" x2="${PR}" y2="${PB}" stroke="${C.ink}" stroke-width="1.5"/>
  <line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PB}" stroke="${C.ink}" stroke-width="1.5"/>
  <polyline points="${poly}" fill="none" stroke="${C.crust}" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="${r2(sx(6))}" cy="${r2(sy(1))}" r="6" fill="${C.crustDeep}"/>
  ${txt(sx(6) + 14, sy(1) + 2, 'peak', { size: 13, fill: C.ink, anchor: 'start', weight: 700 })}
  ${txt(sx(1), sy(0.12) - 14, 'lag', { size: 12.5, fill: C.inkMute, anchor: 'middle', style: 'font-style:italic' })}
  ${txt(sx(9), sy(0.42) + 4, 'collapsing — over-acidic, weak', { size: 12.5, fill: C.inkMute, anchor: 'middle', style: 'font-style:italic' })}
  <text x="26" y="${(PT + PB) / 2}" font-family="${SANS}" font-size="14" font-weight="600" fill="${C.inkSoft}" text-anchor="middle" transform="rotate(-90 26 ${(PT + PB) / 2})">rise in the jar</text>
  ${txt((PL + PR) / 2, H - 50, 'hours since feeding (warm room)', { size: 14, fill: C.inkSoft, anchor: 'middle', weight: 600 })}`;
  return frame('A starter’s daily arc', 'Strength peaks then falls. Mix at the top of the dome, not hours after it has dropped.', inner);
}

// ---- 4. hydration scale ----------------------------------------------------

export function hydrationScale() {
  const PL = 78, PR = 760, y = 230, hMin = 60, hMax = 90;
  const sx = (h) => PL + (h - hMin) / (hMax - hMin) * (PR - PL);
  let ticks = '';
  for (let h = hMin; h <= hMax; h += 5) {
    ticks += `<line x1="${r2(sx(h))}" y1="${y - 14}" x2="${r2(sx(h))}" y2="${y + 14}" stroke="${C.ink}" stroke-width="1.5"/>`;
    ticks += txt(sx(h), y + 38, `${h}%`, { size: 14, fill: C.ink, anchor: 'middle', weight: 600, font: MONO });
  }
  const markers = [
    [65, 'Stiff', 'easy to shape', C.sage],
    [72, 'Balanced', 'beginner-friendly', C.gold],
    [78, 'Slack', 'open crumb, trickier', C.crust],
    [85, 'Very slack', 'experienced hands', C.crustDeep],
  ].map(([h, name, note, col]) =>
    `<circle cx="${r2(sx(h))}" cy="${y}" r="9" fill="${col}"/>` +
    txt(sx(h), y - 34, name, { size: 15, fill: C.ink, anchor: 'middle', weight: 700 }) +
    txt(sx(h), y - 16, note, { size: 11.5, fill: C.inkMute, anchor: 'middle' })
  ).join('');
  const inner = `
  <defs><linearGradient id="hyd" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.sage}"/><stop offset="0.45" stop-color="${C.gold}"/>
    <stop offset="0.75" stop-color="${C.crust}"/><stop offset="1" stop-color="${C.crustDeep}"/>
  </linearGradient></defs>
  <rect x="${PL}" y="${y - 6}" width="${PR - PL}" height="12" rx="6" fill="url(#hyd)"/>
  ${ticks}
  ${markers}
  ${txt(PL, 130, 'Drier dough', { size: 14, fill: C.sage, anchor: 'start', weight: 700 })}
  ${txt(PR, 130, 'Wetter dough', { size: 14, fill: C.crustDeep, anchor: 'end', weight: 700 })}
  ${txt((PL + PR) / 2, 360, 'Higher hydration buys a more open crumb but costs you control. Move in 2–3% steps.', { size: 14, fill: C.inkSoft, anchor: 'middle' })}`;
  return frame('The hydration trade-off', 'Baker’s percentage = water ÷ flour. Where your dough sits changes how it handles.', inner);
}

// ---- 5. same-day vs cold-retard timeline -----------------------------------

function timelineRow(y, label, blocks, maxTotal) {
  const PL = 250, PR = 770;
  const denom = maxTotal || blocks.reduce((s, b) => s + b.span, 0);
  let x = PL, out = txt(40, y + 22, label, { size: 14, fill: C.ink, weight: 700 });
  for (const b of blocks) {
    const w = b.span / denom * (PR - PL);
    out += `<rect x="${r2(x)}" y="${y}" width="${r2(w - 3)}" height="34" rx="6" fill="${b.fill}"/>`;
    // Only label blocks wide enough to hold text; narrow blocks would overflow.
    if (w > 44) out += txt(x + (w - 3) / 2, y + 22, b.t, { size: 12, fill: b.tc || C.paper, anchor: 'middle', weight: 600 });
    x += w;
  }
  return out;
}

export function retardTimeline() {
  const MAX = 16; // both rows share one time scale so equal stages line up
  const inner = `
  ${timelineRow(150, 'Same-day', [
    { span: 1, t: 'mix', fill: C.gold, tc: C.ink },
    { span: 4, t: 'bulk', fill: C.crust },
    { span: 2, t: 'proof', fill: C.sage },
    { span: 1, t: 'bake', fill: C.crustDeep },
  ], MAX)}
  ${timelineRow(240, 'Cold retard', [
    { span: 1, t: 'mix', fill: C.gold, tc: C.ink },
    { span: 4, t: 'bulk', fill: C.crust },
    { span: 10, t: 'fridge overnight — slow proof, more flavour', fill: C.ink },
    { span: 1, t: 'bake', fill: C.crustDeep },
  ], MAX)}
  ${txt(40, 322, 'Same-day is faster and milder. The cold retard adds tang, a crisper crust and a calmer scoring surface,', { size: 13.5, fill: C.inkSoft, anchor: 'start' })}
  ${txt(40, 344, 'and it splits the work across two days — mix today, bake tomorrow. (Bars share one time scale.)', { size: 13.5, fill: C.inkSoft, anchor: 'start' })}
  <g font-family="${SANS}" font-size="12.5" fill="${C.inkMute}">
    <rect x="40" y="376" width="14" height="14" rx="3" fill="${C.crust}"/><text x="62" y="388">bulk</text>
    <rect x="120" y="376" width="14" height="14" rx="3" fill="${C.sage}"/><text x="142" y="388">ambient proof</text>
    <rect x="262" y="376" width="14" height="14" rx="3" fill="${C.ink}"/><text x="284" y="388">cold retard</text>
  </g>`;
  return frame('Same-day vs cold retard', 'Same dough, two routes to the oven — width is proportional to time.', inner);
}

// ---- 6. float test ---------------------------------------------------------

function glass(x, y, blobY, pass) {
  const gw = 150, gh = 200, waterTop = y + 50;
  return `
  <path d="M${x} ${y} L${x + 14} ${y + gh} Q${x + gw / 2} ${y + gh + 18} ${x + gw - 14} ${y + gh} L${x + gw} ${y} " fill="#EAF1F4" stroke="${C.inkMute}" stroke-width="2"/>
  <path d="M${x + 7} ${waterTop} L${x + 17} ${y + gh} Q${x + gw / 2} ${y + gh + 14} ${x + gw - 17} ${y + gh} L${x + gw - 7} ${waterTop} Z" fill="#BFD7E0" opacity="0.7"/>
  <line x1="${x + 7}" y1="${waterTop}" x2="${x + gw - 7}" y2="${waterTop}" stroke="#7FA8B5" stroke-width="2"/>
  <ellipse cx="${x + gw / 2}" cy="${blobY}" rx="34" ry="22" fill="${C.creamDeep}" stroke="${C.crust}" stroke-width="2"/>
  <text x="${x + gw / 2}" y="${y + gh + 48}" font-family="${SERIF}" font-size="16" font-weight="700" fill="${pass ? C.sage : C.crustDeep}" text-anchor="middle">${pass ? 'Floats — ready' : 'Sinks — wait'}</text>`;
}

export function floatTest() {
  const inner = `
  ${glass(150, 120, 178, true)}
  ${glass(520, 120, 300, false)}
  ${txt(410, 230, 'vs', { size: 22, fill: C.inkMute, anchor: 'middle', style: 'font-style:italic' })}
  ${txt(410, 420, 'Drop a teaspoon of starter in water: trapped gas floats it. Useful on a starter — unreliable on bulk dough.', { size: 13.5, fill: C.inkSoft, anchor: 'middle' })}`;
  return frame('The float test', 'A quick gas check, not a guarantee. Read it alongside rise and smell.', inner);
}

// ---- 7. DDT water-temperature formula --------------------------------------

export function ddtWater() {
  const boxY = 150, bh = 66;
  function box(x, w, top, bottom, fill, tc) {
    return `<rect x="${x}" y="${boxY}" width="${w}" height="${bh}" rx="10" fill="${fill}"/>` +
      txt(x + w / 2, boxY + 28, top, { size: 17, fill: tc, anchor: 'middle', weight: 700, font: MONO }) +
      txt(x + w / 2, boxY + 50, bottom, { size: 11.5, fill: tc, anchor: 'middle', style: 'opacity:0.85' });
  }
  function op(x, s) { return txt(x, boxY + 40, s, { size: 26, fill: C.ink, anchor: 'middle', weight: 700 }); }
  const inner = `
  ${box(40, 150, 'DDT × 3', 'target × 3', C.crust, C.paper)}
  ${op(212, '−')}
  ${box(232, 132, 'flour', 'temp', C.creamDeep, C.ink)}
  ${op(380, '−')}
  ${box(398, 132, 'room', 'temp', C.creamDeep, C.ink)}
  ${op(546, '−')}
  ${box(564, 150, 'friction', 'mix heat 2–6', C.creamDeep, C.ink)}
  ${op(726, '=')}
  ${box(744, 36, '', '', C.paper, C.ink)}
  <rect x="744" y="${boxY}" width="36" height="${bh}" rx="10" fill="none" stroke="${C.crustDeep}" stroke-width="2.5"/>
  ${txt(762, boxY + 42, 'W', { size: 20, fill: C.crustDeep, anchor: 'middle', weight: 700, font: MONO })}
  <rect x="40" y="270" width="740" height="120" rx="12" fill="${C.cream}" stroke="${C.line}" stroke-width="1.5"/>
  ${txt(64, 300, 'Worked example', { size: 13, fill: C.crust, weight: 700 })}
  ${txt(64, 330, 'Target 25 · flour 20 · room 20 · hand-mix friction 2', { size: 15, fill: C.inkSoft, font: MONO })}
  ${txt(64, 360, '(25 × 3) − 20 − 20 − 2  =  33 °C water', { size: 18, fill: C.ink, weight: 700, font: MONO })}
  ${txt(560, 342, 'The ×3 matches the three', { size: 12.5, fill: C.inkMute })}
  ${txt(560, 360, 'masses you subtract.', { size: 12.5, fill: C.inkMute })}`;
  return frame('Desired dough temperature → water temp', 'The 3-factor formula the calculator uses. Multiplier = number of temperatures you subtract.', inner);
}

// ---- 8. proof window (under / ideal / over) --------------------------------

function dome(x, label, sub, kind) {
  const cx = x + 110, base = 250;
  let shape;
  if (kind === 'under') shape = `<path d="M${cx - 70} ${base} Q${cx} ${base - 70} ${cx + 70} ${base} Z" fill="${C.creamDeep}" stroke="${C.crustDeep}" stroke-width="2.5"/>`;
  else if (kind === 'ideal') shape = `<path d="M${cx - 90} ${base} Q${cx} ${base - 118} ${cx + 90} ${base} Z" fill="${C.creamDeep}" stroke="${C.crust}" stroke-width="2.5"/>`;
  else shape = `<path d="M${cx - 100} ${base} Q${cx - 50} ${base - 64} ${cx} ${base - 58} Q${cx + 50} ${base - 52} ${cx + 100} ${base} Z" fill="${C.creamDeep}" stroke="${C.inkMute}" stroke-width="2.5"/>`;
  const poke = `<circle cx="${cx}" cy="${base - (kind === 'ideal' ? 64 : kind === 'under' ? 40 : 30)}" r="6" fill="${C.inkSoft}" opacity="0.5"/>`;
  return shape + poke +
    txt(cx, 290, label, { size: 16, fill: C.ink, anchor: 'middle', weight: 700, font: SERIF }) +
    txt(cx, 312, sub, { size: 12.5, fill: C.inkMute, anchor: 'middle' });
}

export function proofWindow() {
  const inner = `
  <line x1="40" y1="250" x2="780" y2="250" stroke="${C.line}" stroke-width="2"/>
  ${dome(30, 'Underproofed', 'springs back fast', 'under')}
  ${dome(300, 'Ready', 'springs back slowly', 'ideal')}
  ${dome(560, 'Overproofed', 'doesn’t spring back', 'over')}
  ${txt(410, 360, 'Poke test: a floured fingertip, 1 cm deep. The dent that fills in slowly is the one you want.', { size: 14, fill: C.inkSoft, anchor: 'middle' })}`;
  return frame('Reading the proof', 'Volume is a hint; the poke test is the answer.', inner);
}

// ---- 9. feeding ratio vs time-to-peak --------------------------------------

export function feedingRatio() {
  const rows = [
    ['1:1:1', 3.5, 'fast, frequent feeds'],
    ['1:2:2', 5, 'a daily-bake rhythm'],
    ['1:5:5', 8.5, 'once-a-day maintenance'],
    ['1:10:10', 12, 'slow — holds longer'],
  ];
  const PL = 200, PR = 740, y0 = 130, rh = 64, hMax = 13;
  const sx = (h) => PL + h / hMax * (PR - PL);
  let bars = '';
  rows.forEach(([ratio, hrs, note], i) => {
    const y = y0 + i * rh;
    bars += txt(60, y + 26, ratio, { size: 17, fill: C.ink, weight: 700, font: MONO });
    bars += `<rect x="${PL}" y="${y + 8}" width="${r2(sx(hrs) - PL)}" height="30" rx="6" fill="${C.crust}"/>`;
    bars += txt(sx(hrs) + 10, y + 29, `~${hrs} h`, { size: 14, fill: C.ink, weight: 700 });
    bars += txt(PL + 8, y + 29, note, { size: 12.5, fill: C.paper, weight: 600 });
  });
  const inner = `
  ${bars}
  ${txt(PL, y0 + 4 * rh + 18, 'Approximate time to peak at ~22 °C with a healthy starter. Warmer is faster; colder is slower.', { size: 13.5, fill: C.inkMute })}
  ${txt(60, 96, 'starter : flour : water', { size: 13, fill: C.inkMute, weight: 600 })}`;
  return frame('Feeding ratio sets the clock', 'A bigger feed (more flour & water per part starter) simply takes longer to peak.', inner);
}

// ---- 10. stretch and fold sequence -----------------------------------------

function foldPanel(x, y, dir, n) {
  const s = 120, cx = x + s / 2, cy = y + s / 2;
  const arrows = {
    N: `M${cx} ${y + 16} L${cx} ${cy}`, E: `M${x + s - 16} ${cy} L${cx} ${cy}`,
    S: `M${cx} ${y + s - 16} L${cx} ${cy}`, W: `M${x + 16} ${cy} L${cx} ${cy}`,
  };
  return `
  <rect x="${x}" y="${y}" width="${s}" height="${s}" rx="12" fill="${C.cream}" stroke="${C.line}" stroke-width="1.5"/>
  <circle cx="${cx}" cy="${cy}" r="34" fill="${C.creamDeep}" stroke="${C.crust}" stroke-width="2"/>
  <path d="${arrows[dir]}" stroke="${C.crustDeep}" stroke-width="3" fill="none" marker-end="url(#ah)"/>
  <circle cx="${cx}" cy="${cy}" r="4" fill="${C.crustDeep}"/>
  ${txt(x + 12, y + 24, String(n), { size: 14, fill: C.inkMute, weight: 700, font: MONO })}`;
}

export function stretchFold() {
  const inner = `
  <defs><marker id="ah" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 Z" fill="${C.crustDeep}"/></marker></defs>
  ${foldPanel(70, 150, 'N', 1)}
  ${foldPanel(250, 150, 'E', 2)}
  ${foldPanel(430, 150, 'S', 3)}
  ${foldPanel(610, 150, 'W', 4)}
  ${txt(410, 330, 'Lift one side, stretch up, fold to the centre. Quarter-turn and repeat — four folds is one set.', { size: 14, fill: C.inkSoft, anchor: 'middle' })}
  ${txt(410, 358, 'Three to four sets in the first two hours builds strength without kneading.', { size: 14, fill: C.inkSoft, anchor: 'middle' })}`;
  return frame('One set of stretch & folds', 'Gluten built by gentle folding, not muscle.', inner);
}

// ---- 11. scoring angle / ear -----------------------------------------------

export function scoringAngle() {
  const base = 300, cx = 360;
  const inner = `
  <path d="M${cx - 200} ${base} Q${cx} ${base - 150} ${cx + 200} ${base} Z" fill="${C.creamDeep}" stroke="${C.crustDeep}" stroke-width="2.5"/>
  <path d="M${cx - 60} ${base - 120} L${cx + 10} ${base - 96}" stroke="${C.crustDeep}" stroke-width="3" fill="none"/>
  <path d="M${cx - 60} ${base - 120} q -22 26 -10 60" stroke="${C.crust}" stroke-width="3" fill="none"/>
  ${txt(cx - 120, base - 96, 'the flap lifts', { size: 13, fill: C.crustDeep, anchor: 'middle', weight: 600 })}
  ${txt(cx - 120, base - 78, 'into an ear', { size: 13, fill: C.crustDeep, anchor: 'middle', weight: 600 })}
  <line x1="${cx + 150} " y1="${base - 64}" x2="${cx + 60}" y2="${base - 110}" stroke="${C.ink}" stroke-width="3"/>
  ${txt(cx + 165, base - 60, 'blade', { size: 13, fill: C.ink, weight: 700 })}
  <path d="M${cx + 60} ${base - 110} a 50 50 0 0 1 44 8" fill="none" stroke="${C.sage}" stroke-width="2" stroke-dasharray="4 3"/>
  ${txt(cx + 118, base - 92, '30–45°', { size: 14, fill: C.sage, anchor: 'middle', weight: 700, font: MONO })}
  ${txt(cx, 370, 'A shallow, angled cut lets one edge peel back and set proud — that’s the ear. Straight down just splits.', { size: 14, fill: C.inkSoft, anchor: 'middle' })}`;
  return frame('Why the blade tilts', 'Hold the lame at a low angle and cut a shallow flap, not a deep gash.', inner);
}

// ---- 12. autolyse vs fermentolyse ------------------------------------------

export function autolyseTimeline() {
  const inner = `
  ${timelineRow(150, 'Autolyse', [
    { span: 3, t: 'flour + water rest', fill: C.gold, tc: C.ink },
    { span: 1, t: '+ levain', fill: C.crust },
    { span: 1, t: '+ salt', fill: C.sage },
    { span: 4, t: 'bulk', fill: C.crustDeep },
  ], 9)}
  ${timelineRow(240, 'Fermentolyse', [
    { span: 3, t: 'flour + water + levain rest', fill: C.crust },
    { span: 1, t: '+ salt', fill: C.sage },
    { span: 4, t: 'bulk', fill: C.crustDeep },
  ], 9)}
  ${txt(40, 320, 'Autolyse rests flour and water alone so the flour hydrates and gluten starts forming before fermentation.', { size: 13.5, fill: C.inkSoft })}
  ${txt(40, 346, 'Fermentolyse folds the starter in from the start — simpler, and fermentation begins during the rest.', { size: 13.5, fill: C.inkSoft })}
  ${txt(40, 372, 'Salt goes in last either way, because it tightens gluten and slows enzyme activity during the rest.', { size: 13.5, fill: C.inkMute })}`;
  return frame('Autolyse vs fermentolyse', 'When the starter joins the rest is the only real difference.', inner);
}

// ---- 13. flour water-absorption ranges -------------------------------------

export function flourAbsorption() {
  const rows = [
    ['White bread flour', 62, 68, C.gold],
    ['Whole wheat', 72, 82, C.crust],
    ['Whole rye', 80, 95, C.crustDeep],
  ];
  const PL = 230, PR = 740, y0 = 140, rh = 70, hMin = 55, hMax = 100;
  const sx = (h) => PL + (h - hMin) / (hMax - hMin) * (PR - PL);
  let grid = '';
  for (let h = 60; h <= 100; h += 10) {
    grid += `<line x1="${r2(sx(h))}" y1="${y0 - 10}" x2="${r2(sx(h))}" y2="${y0 + 3 * rh - 30}" stroke="${C.lineSoft}" stroke-width="1"/>`;
    grid += txt(sx(h), y0 + 3 * rh - 12, `${h}%`, { size: 12, fill: C.inkMute, anchor: 'middle', font: MONO });
  }
  let bars = '';
  rows.forEach(([name, lo, hi, col], i) => {
    const y = y0 + i * rh;
    bars += txt(50, y + 28, name, { size: 15, fill: C.ink, weight: 700 });
    bars += `<rect x="${r2(sx(lo))}" y="${y + 10}" width="${r2(sx(hi) - sx(lo))}" height="32" rx="8" fill="${col}"/>`;
    bars += txt((sx(lo) + sx(hi)) / 2, y + 31, `${lo}–${hi}%`, { size: 13, fill: C.paper, anchor: 'middle', weight: 700, font: MONO });
  });
  const inner = `
  ${grid}
  ${bars}
  ${txt(50, y0 + 3 * rh + 14, 'Roughly how much water each flour can hold. More bran and broken starch → thirstier dough.', { size: 13.5, fill: C.inkMute })}`;
  return frame('Different flours, different thirst', 'Why a rye or whole-wheat dough needs more water than white at the same feel.', inner);
}

// ---- registry --------------------------------------------------------------

export const DIAGRAMS = {
  'bulk-temp-curve': () => bulkTempCurve('none'),
  'bulk-temp-curve-cold': () => bulkTempCurve('cold'),
  'bulk-temp-curve-warm': () => bulkTempCurve('warm'),
  'crumb-compare': crumbCompare,
  'starter-curve': starterCurve,
  'hydration-scale': hydrationScale,
  'retard-timeline': retardTimeline,
  'float-test': floatTest,
  'ddt-water': ddtWater,
  'proof-window': proofWindow,
  'feeding-ratio': feedingRatio,
  'stretch-fold': stretchFold,
  'scoring-angle': scoringAngle,
  'autolyse-timeline': autolyseTimeline,
  'flour-absorption': flourAbsorption,
};

// slug -> { name, alt, caption } for the diagram embedded at the top of each article.
export const ARTICLE_DIAGRAM = {
  'bulk-fermentation-by-temperature': { name: 'bulk-temp-curve', alt: 'Line chart of sourdough bulk fermentation time falling as dough temperature rises, from about 12 hours at 15°C to under 3 hours at 30°C, with a marked baseline of 5 hours at 24°C.', caption: 'Bulk time against dough temperature, plotted from the same Q10 model the calculator uses.' },
  'why-sourdough-gummy': { name: 'crumb-compare', alt: 'Two sourdough crumb cross-sections compared: an underproofed slice with tight holes and a dense gummy band near the base, beside a well-fermented slice with even, varied holes.', caption: 'A gummy band low in the slice is an underbake or underproof, not a flour problem.' },
  'revive-forgotten-starter': { name: 'starter-curve', alt: 'Curve of a sourdough starter rising after feeding to a peak around six hours, then collapsing, with a shaded “use it now” window at the peak.', caption: 'The strength window: catch the starter at its peak, before it falls.' },
  'hydration-explained': { name: 'hydration-scale', alt: 'A hydration scale from 60 to 90 percent showing stiff, balanced, slack and very slack dough zones with a colour gradient from drier to wetter.', caption: 'Where your dough sits on the hydration scale changes how it handles.' },
  'cold-retard-vs-same-day': { name: 'retard-timeline', alt: 'Two timelines compared: a same-day bake of mix, bulk, proof and bake, and a cold-retard bake that adds a long overnight fridge stage before baking.', caption: 'Same dough, two routes to the oven — the cold retard trades time for flavour.' },
  'float-test-explained': { name: 'float-test', alt: 'Two glasses of water: a spoonful of starter floating at the surface labelled ready, and one sunk to the bottom labelled wait.', caption: 'The float test reads trapped gas — handy on a starter, unreliable on bulk dough.' },
  'ddt-formula-water-temperature': { name: 'ddt-water', alt: 'The desired dough temperature formula shown as blocks: target times three, minus flour, room and friction temperatures, equals the water temperature, with a worked example giving 33°C.', caption: 'The 3-factor DDT formula, exactly as the calculator computes it.' },
  'fix-dense-sourdough': { name: 'proof-window', alt: 'Three dough domes side by side — underproofed, ready and overproofed — illustrating how each responds to the poke test.', caption: 'Most dense loaves are a proofing miss; the poke test tells you which way.' },
  'starter-feeding-ratio': { name: 'feeding-ratio', alt: 'Bar chart of starter feeding ratios from 1:1:1 to 1:10:10 against approximate time to peak, from about 3.5 hours up to 12 hours at 22°C.', caption: 'A bigger feed simply takes longer to peak — that is how you time a starter.' },
  'stretch-and-fold': { name: 'stretch-fold', alt: 'Four panels showing one set of stretch and folds: lifting north, east, south and west sides of the dough into the centre.', caption: 'One set is four folds — north, east, south, west — into the centre.' },
  'scoring-sourdough': { name: 'scoring-angle', alt: 'Cross-section of a dough loaf with a lame held at a 30 to 45 degree angle cutting a shallow flap that lifts into an ear.', caption: 'A shallow, angled cut lets an edge peel back into an ear.' },
  'autolyse-vs-fermentolyse': { name: 'autolyse-timeline', alt: 'Two timelines comparing autolyse, which rests flour and water before adding starter, with fermentolyse, which rests flour, water and starter together, both adding salt last.', caption: 'The only real difference is when the starter joins the rest.' },
  'whole-wheat-sourdough': { name: 'flour-absorption', alt: 'Bar chart of water absorption ranges by flour: white bread flour 62 to 68 percent, whole wheat 72 to 82 percent, whole rye 80 to 95 percent.', caption: 'Whole-grain flours are thirstier — why the same recipe needs more water.' },
  'rye-sourdough-rules': { name: 'flour-absorption', alt: 'Bar chart of water absorption ranges by flour: white bread flour 62 to 68 percent, whole wheat 72 to 82 percent, whole rye 80 to 95 percent.', caption: 'Rye holds far more water than white flour — plan hydration around it.' },
  'winter-sourdough': { name: 'bulk-temp-curve-cold', alt: 'Bulk fermentation time versus dough temperature with the cold-kitchen zone below 20°C highlighted, where bulk stretches past 10 hours.', caption: 'In a cold kitchen you live on the steep left of the curve — expect long bulks.' },
  'summer-sourdough': { name: 'bulk-temp-curve-warm', alt: 'Bulk fermentation time versus dough temperature with the hot-kitchen zone above 26°C highlighted, where bulk drops below 3 hours.', caption: 'In a hot kitchen you are on the fast right of the curve — watch the dough, not the clock.' },
};

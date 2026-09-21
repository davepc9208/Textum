// Genera portadas 1200x630 para EII-01 (versiones ES y EN) — identidad visual TEXTUM.
// Uso: node make-eii-covers.mjs  (requiere sharp, ya instalado)
import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('eii-covers', { recursive: true });

const NAVY = '#0d1f3c';
const NAVY_2 = '#16305c';
const GOLD = '#c9a84c';
const CREAM = '#faf7f2';

const VARIANTS = {
  es: {
    kicker: 'COLECCIÓN TEXTUM · MENTORÍA ACADÉMICA',
    code: 'EII-01',
    titleLines: ['El Enfoque Investigativo', 'Integral'],
    subtitleLines: [
      'Una concepción integral, articulada y recursiva',
      'de la investigación científica',
    ],
    dims: ['INTEGRALIDAD', 'ARTICULACIÓN', 'RECURSIVIDAD'],
    version: 'V 1.0 — 2026',
    file: 'eii-01-cover-es',
  },
  en: {
    kicker: 'TEXTUM COLLECTION · ACADEMIC MENTORING',
    code: 'EII-01',
    titleLines: ['The Integral', 'Research Approach'],
    subtitleLines: [
      'An integral, articulated and recursive conception',
      'of scientific research',
    ],
    dims: ['INTEGRALITY', 'ARTICULATION', 'RECURSIVITY'],
    version: 'V 1.0 — September 2026',
    file: 'eii-01-cover-en',
  },
};

function svg({ kicker, code, titleLines, subtitleLines, dims, version }) {
  const titleSize = 58;
  const titleStart = 250;
  const titleLeading = 66;
  const subtitleStart = titleStart + titleLines.length * titleLeading + 26;

  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<tspan x="600" y="${titleStart + i * titleLeading}">${line}</tspan>`
    )
    .join('');
  const subtitleSvg = subtitleLines
    .map(
      (line, i) =>
        `<tspan x="600" y="${subtitleStart + i * 34}">${line}</tspan>`
    )
    .join('');
  // Los tres conceptos centrados como grupo (ancho aproximado de Georgia 15px + tracking 3).
  const gap = 40;
  const approx = (s) => s.length * 13.2;
  const total = dims.map(approx).reduce((a, b) => a + b, 0) + gap * 2;
  let x = 600 - total / 2;
  const dimsSvg = dims
    .map((d, i) => {
      const el = `<text x="${x + approx(d) / 2}" y="522" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="15" letter-spacing="3" fill="${GOLD}" opacity="0.75">${d}</text>${i < 2 ? `<rect x="${x + approx(d) + gap / 2 - 3}" y="514" width="6" height="6" transform="rotate(45 ${x + approx(d) + gap / 2} 517)" fill="${GOLD}" opacity="0.55"/>` : ''}`;
      x += approx(d) + gap;
      return el;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${NAVY_2}"/>
      <stop offset="100%" stop-color="${NAVY}"/>
    </linearGradient>
    <radialGradient id="orb" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hairL" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0.55"/>
    </linearGradient>
    <linearGradient id="hairR" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1060" cy="60" r="360" fill="url(#orb)"/>
  <circle cx="90" cy="620" r="220" fill="url(#orb)"/>

  <!-- Kicker -->
  <text x="600" y="92" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="17" letter-spacing="6" fill="${GOLD}" opacity="0.62">${kicker}</text>

  <!-- Separador -->
  <rect x="440" y="128" width="120" height="1" fill="url(#hairL)"/>
  <rect x="596" y="123" width="9" height="9" transform="rotate(45 600.5 128)" fill="${GOLD}"/>
  <rect x="640" y="128" width="120" height="1" fill="url(#hairR)"/>

  <!-- Código -->
  <text x="600" y="185" text-anchor="middle" font-family="'Courier New', monospace" font-size="27" letter-spacing="10" fill="${GOLD}">${code}</text>

  <!-- Título -->
  <text text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${titleSize}" font-weight="normal" fill="${CREAM}">${titleSvg}</text>

  <!-- Subtítulo -->
  <text text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="25" font-style="italic" fill="${CREAM}" opacity="0.78">${subtitleSvg}</text>

  <!-- Dimensiones -->
  ${dimsSvg}

  <!-- Versión -->
  <text x="600" y="585" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="15" letter-spacing="3" fill="${CREAM}" opacity="0.42">${version}</text>

  <!-- Marco fino -->
  <rect x="18" y="18" width="1164" height="594" fill="none" stroke="${GOLD}" stroke-opacity="0.28" stroke-width="1"/>
</svg>`;
}

for (const v of Object.values(VARIANTS)) {
  const svgBuffer = Buffer.from(svg(v), 'utf-8');
  await sharp(svgBuffer).png({ compressionLevel: 9 }).toFile(`eii-covers/${v.file}.png`);
  await sharp(svgBuffer).webp({ quality: 92 }).toFile(`eii-covers/${v.file}.webp`);
  console.log(`OK ${v.file} (.png + .webp)`);
}

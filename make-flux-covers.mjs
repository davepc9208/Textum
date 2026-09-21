// Genera portadas PNG y WebP para TEXTUM Flux®.
// Uso: node make-flux-covers.mjs
import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('flux-covers', { recursive: true });

const NAVY = '#0d2745';
const NAVY_2 = '#12395e';
const GOLD = '#c9a84c';
const CREAM = '#faf7f2';

// Sustituye estos textos solo si el DOCX contiene varios artículos Flux.
const VARIANTS = {
  es: {
    kicker: 'FLUX-01 · TEXTUM FLUX®',
    titleLines: ['TEXTUM Flux'],
    subtitleLines: ['Una metodología dinámica para investigar,', 'articular y transformar'],
    dimension: 'MOVIMIENTO · CONEXIÓN · TRANSFORMACIÓN',
    footer: 'TEXTUM · MENTORÍA ACADÉMICA · V 1.0 — 2026',
    file: 'flux-01-cover-es',
  },
  en: {
    kicker: 'FLUX-01 · TEXTUM FLUX®',
    titleLines: ['TEXTUM Flux'],
    subtitleLines: ['A dynamic methodology to investigate,', 'connect and transform'],
    dimension: 'MOVEMENT · CONNECTION · TRANSFORMATION',
    footer: 'TEXTUM · ACADEMIC MENTORING · V 1.0 — 2026',
    file: 'flux-01-cover-en',
  },
};

function escapeXml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function svg({ kicker, titleLines, subtitleLines, dimension, footer }) {
  const titleSvg = titleLines.map((line, i) => `<tspan x="600" y="${218 + i * 62}">${escapeXml(line)}</tspan>`).join('');
  const subtitleSvg = subtitleLines.map((line, i) => `<tspan x="600" y="${310 + i * 30}">${escapeXml(line)}</tspan>`).join('');
  const centers = [320, 600, 880];
  const nodes = centers.map((cx) => `
    <circle cx="${cx}" cy="480" r="42" fill="none" stroke="${GOLD}" stroke-opacity="0.52" stroke-width="1"/>
    <circle cx="${cx}" cy="480" r="29" fill="none" stroke="${GOLD}" stroke-opacity="0.36" stroke-width="1"/>
    <circle cx="${cx}" cy="480" r="8" fill="${GOLD}" fill-opacity="0.88"/>
    <circle cx="${cx}" cy="480" r="3" fill="${CREAM}"/>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${NAVY_2}"/>
      <stop offset="100%" stop-color="${NAVY}"/>
    </linearGradient>
    <radialGradient id="orb" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="${GOLD}" fill-opacity="0.30"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1030" cy="150" r="330" fill="url(#orb)"/>
  <circle cx="120" cy="540" r="250" fill="url(#orb)"/>
  <rect x="20" y="20" width="1160" height="590" fill="none" stroke="${GOLD}" stroke-opacity="0.34"/>
  <rect x="38" y="42" width="145" height="110" fill="url(#dots)" opacity="0.65"/>
  <rect x="1017" y="478" width="145" height="110" fill="url(#dots)" opacity="0.65"/>
  <path d="M0 155 L155 0" stroke="${GOLD}" stroke-opacity="0.5"/>
  <path d="M1045 630 L1200 475" stroke="${GOLD}" stroke-opacity="0.5"/>
  <rect x="72" y="62" width="34" height="34" transform="rotate(45 89 79)" fill="${GOLD}"/>
  <rect x="1094" y="534" width="34" height="34" transform="rotate(45 1111 551)" fill="${GOLD}"/>
  <text x="600" y="82" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="16" letter-spacing="5" fill="${GOLD}" opacity="0.72">${escapeXml(kicker)}</text>
  <rect x="420" y="115" width="140" height="1" fill="${GOLD}" opacity="0.38"/>
  <rect x="596" y="110" width="10" height="10" transform="rotate(45 601 115)" fill="${GOLD}"/>
  <rect x="642" y="115" width="140" height="1" fill="${GOLD}" opacity="0.38"/>
  <text text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="58" fill="${CREAM}">${titleSvg}</text>
  <text text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="24" font-style="italic" fill="${CREAM}" opacity="0.82">${subtitleSvg}</text>
  <rect x="395" y="392" width="410" height="1" fill="${GOLD}" opacity="0.42"/>
  <text x="600" y="420" text-anchor="middle" font-family="'Courier New', monospace" font-size="12" letter-spacing="3" fill="${GOLD}" opacity="0.78">${escapeXml(dimension)}</text>
  <path d="M275 480 C360 400 430 560 520 480 S680 400 760 480 S920 560 1005 480" fill="none" stroke="${GOLD}" stroke-opacity="0.78" stroke-width="2"/>
  <path d="M275 480 C360 560 430 400 520 480 S680 560 760 480 S920 400 1005 480" fill="none" stroke="${GOLD}" stroke-opacity="0.25" stroke-width="1"/>
  ${nodes}
  <text x="600" y="584" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="13" letter-spacing="3" fill="${CREAM}" opacity="0.46">${escapeXml(footer)}</text>
</svg>`;
}

for (const variant of Object.values(VARIANTS)) {
  const buffer = Buffer.from(svg(variant), 'utf8');
  await sharp(buffer).png({ compressionLevel: 9 }).toFile(`flux-covers/${variant.file}.png`);
  await sharp(buffer).webp({ quality: 92 }).toFile(`flux-covers/${variant.file}.webp`);
  console.log(`OK ${variant.file}`);
}

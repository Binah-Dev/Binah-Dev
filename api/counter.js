const fs = require('fs');
const path = require('path');

const COUNTER_SOURCE =
  'https://hits.sh/github.com/Binah-Dev-profile.svg?label=profile%20views';
const DIGIT_DIR = path.join(__dirname, '..', 'assets', 'steins-gate-digits');

/*
 * The digit artwork is adapted from:
 * https://github.com/greenhandatsjtu/steins-gate-visitor-count
 * Apache-2.0; see assets/steins-gate-digits/LICENSE and NOTICE.md.
 */
function loadDigitArtwork() {
  return Array.from({ length: 10 }, (_, digit) => {
    try {
      return fs
        .readFileSync(path.join(DIGIT_DIR, `${digit}.png`))
        .toString('base64');
    } catch (_error) {
      return '';
    }
  });
}

const DIGITS = loadDigitArtwork();

function readCount(svg) {
  const match = svg.match(/aria-label="[^\"]*?([0-9][0-9,]*)"/i);
  if (!match) return 0;
  return Number.parseInt(match[1].replace(/,/g, ''), 10) || 0;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderDigitStack(digit, index, digitWidth) {
  const finalDigit = Number(digit);
  const start = (finalDigit + 10) % 10;
  const centerX = 31 + index * digitWidth;
  const imageX = centerX - 25;
  const imageSize = 50;
  const sequence = [start, (start + 3) % 10, (start + 7) % 10, finalDigit];
  const dataImages = sequence
    .map((value, sequenceIndex) => {
      const image = DIGITS[value];
      if (!image) {
        return `<text x="${centerX}" y="${57 + sequenceIndex * 52}" text-anchor="middle">${value}</text>`;
      }
      return `<image x="${imageX}" y="${23 + sequenceIndex * 52}" width="${imageSize}" height="${imageSize}" href="data:image/png;base64,${image}" preserveAspectRatio="xMidYMid slice" />`;
    })
    .join('');

  return `
    <g clip-path="url(#digit-${index})">
      <g>
        ${dataImages}
        <animateTransform attributeName="transform" type="translate" values="0 ${-start * 52};0 ${-((start + 3) % 10) * 52};0 ${-((start + 7) % 10) * 52};0 ${-finalDigit * 52}" keyTimes="0;0.38;0.7;1" dur="1.45s" calcMode="spline" keySplines=".2 .8 .2 1;.2 .8 .2 1;.2 .8 .2 1" fill="freeze" />
      </g>
    </g>`;
}

function renderCounter(count) {
  const value = String(Math.max(0, count));
  const digitWidth = 52;
  const width = 54 + value.length * digitWidth;
  const clips = value
    .split('')
    .map((_, index) => {
      const centerX = 31 + index * digitWidth;
      return `<clipPath id="digit-${index}"><rect x="${centerX - 27}" y="21" width="54" height="57" rx="8" /></clipPath>`;
    })
    .join('');
  const digits = value
    .split('')
    .map((digit, index) => renderDigitStack(digit, index, digitWidth))
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="112" viewBox="0 0 ${width} 112" role="img" aria-label="Animated profile views counter: ${escapeXml(value)}">
  <defs>
    ${clips}
    <radialGradient id="glass" cx="50%" cy="43%" r="74%">
      <stop offset="0" stop-color="#3a120a" />
      <stop offset="0.58" stop-color="#170806" />
      <stop offset="1" stop-color="#040202" />
    </radialGradient>
    <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffbd46" />
      <stop offset="0.28" stop-color="#8e1e0d" />
      <stop offset="0.72" stop-color="#360c08" />
      <stop offset="1" stop-color="#d75517" />
    </linearGradient>
    <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
      <path d="M0 0H4" stroke="#ff9b38" stroke-opacity=".25" stroke-width="1" />
    </pattern>
    <filter id="ember-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2.2" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="soft-glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <style>
      .micro { font: 600 6px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: 1px; fill: #f28b2b; }
      .label { font: 700 7px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: 1.5px; fill: #ffb13b; }
      .fallback { font: 800 40px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; fill: #ff9a2e; filter: url(#ember-glow); }
      .warning { font: 700 5px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .7px; fill: #ff5c20; }
    </style>
  </defs>
  <rect x="1.5" y="1.5" width="${width - 3}" height="109" rx="10" fill="#050303" stroke="#42100a" stroke-width="3" />
  <rect x="4" y="4" width="${width - 8}" height="104" rx="8" fill="url(#glass)" stroke="url(#frame)" stroke-width="1.2" />
  <ellipse cx="${width / 2}" cy="55" rx="${Math.max(30, width / 2 - 8)}" ry="47" fill="none" stroke="#ff5c20" stroke-opacity=".22" stroke-width="1" filter="url(#soft-glow)" />
  <rect x="5" y="5" width="${width - 10}" height="102" rx="7" fill="url(#scanlines)" opacity=".75" />
  <path d="M7 20H${width - 7}" stroke="#e34216" stroke-opacity=".62" />
  <circle cx="12" cy="12" r="2.4" fill="#ff5421" filter="url(#ember-glow)">
    <animate attributeName="opacity" values="1;.22;1" dur="1.1s" repeatCount="indefinite" />
  </circle>
  <text class="micro" x="18" y="14">FUTURE GADGET LAB // ACCESS LOG</text>
  <text class="warning" x="${width - 8}" y="14" text-anchor="end">EL. PSY. CONGR∞</text>
  <text class="label" x="8" y="101">STEINS;GATE // PROFILE VIEWS</text>
  <text class="warning" x="${width - 8}" y="101" text-anchor="end">WORLDLINE 001.000</text>
  <g class="fallback">${digits}</g>
</svg>`;
}

module.exports = async function handler(_request, response) {
  try {
    const upstream = await fetch(COUNTER_SOURCE, { cache: 'no-store' });
    const sourceSvg = await upstream.text();
    const count = readCount(sourceSvg);
    response.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store, max-age=0, s-maxage=0, must-revalidate');
    response.status(200).send(renderCounter(count));
  } catch (_error) {
    response.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store, max-age=0, s-maxage=0, must-revalidate');
    response.status(200).send(renderCounter(0));
  }
};

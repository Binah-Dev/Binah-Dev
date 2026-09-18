const COUNTER_SOURCE =
  'https://hits.sh/github.com/Binah-Dev-profile.svg?label=profile%20views';
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

// Hand-drawn cathode shapes keep the tube readable even when the viewer does
// not have a particular font installed. They are intentionally thin and
// slightly irregular, like the wire cathodes inside a real Nixie tube.
const NIXIE_DIGITS = [
  'M35 10 C21 10 15 22 15 46 C15 70 21 82 35 82 C49 82 55 70 55 46 C55 22 49 10 35 10 Z',
  'M24 24 L35 12 L35 82 M25 82 H46',
  'M17 25 C18 15 27 10 37 11 C49 12 55 20 53 30 C51 39 42 45 32 53 L18 66 C15 69 17 82 23 82 H54',
  'M18 20 C26 11 43 9 51 19 C57 27 51 38 40 44 C53 47 58 58 53 69 C48 82 28 85 18 75',
  'M49 11 L18 54 H55 M46 34 V82',
  'M53 12 H22 L18 45 C25 38 37 37 46 43 C58 51 55 69 45 77 C34 86 19 78 17 67',
  'M51 17 C43 9 29 10 21 20 C15 28 15 43 16 57 C18 75 25 83 36 82 C49 81 55 70 53 57 C51 45 43 39 33 42 C24 45 18 53 17 62',
  'M17 12 H55 L31 82',
  'M35 10 C22 10 16 18 18 29 C19 38 27 43 35 45 C45 47 53 40 53 29 C54 18 47 10 35 10 Z M35 45 C22 45 16 53 18 65 C20 77 27 83 35 82 C46 82 53 76 53 65 C53 53 46 45 35 45 Z',
  'M52 38 C48 47 40 53 31 50 C20 47 15 38 17 26 C19 15 27 9 37 11 C49 12 55 23 54 39 C53 59 49 76 37 81 C28 84 20 78 17 70'
];

function renderNixieSymbols() {
  return NIXIE_DIGITS
    .map((pathData, digit) => `
      <symbol id="tube-digit-${digit}" viewBox="0 0 70 92">
        <path d="${pathData}" class="nixie-wire" />
      </symbol>`)
    .join('');
}

function renderDigitStack(digit, index, digitWidth) {
  const finalDigit = Number(digit);
  const start = (finalDigit + 10) % 10;
  const tubeX = 14 + index * digitWidth;
  const tubeWidth = digitWidth - 8;
  const imageX = tubeX + (tubeWidth - 70) / 2;
  const stackStep = 98;
  const sequence = [start, (start + 3) % 10, (start + 7) % 10, finalDigit];
  const animationOffsets = sequence
    .map((_, sequenceIndex) => `0 ${-sequenceIndex * stackStep}`)
    .join(';');
  const dataImages = sequence
    .map((value, sequenceIndex) => {
      return `<use href="#tube-digit-${value}" x="${imageX}" y="${16 + sequenceIndex * stackStep}" width="70" height="92" />`;
    })
    .join('');

  return `
    <g clip-path="url(#tube-slot-${index})">
      <g>
        ${dataImages}
        <animateTransform attributeName="transform" type="translate" values="${animationOffsets}" keyTimes="0;0.35;0.72;1" dur="1.65s" calcMode="spline" keySplines=".2 .8 .2 1;.2 .8 .2 1;.2 .8 .2 1" fill="freeze" />
      </g>
    </g>`;
}

function renderCounter(count) {
  const rawValue = String(Math.max(0, count));
  const value = rawValue.length > 8 ? rawValue.slice(-8) : rawValue.padStart(8, '0');
  const digitWidth = 88;
  const width = 28 + value.length * digitWidth;
  const clips = value
    .split('')
    .map((_, index) => {
      const tubeX = 14 + index * digitWidth;
      return `<clipPath id="tube-slot-${index}"><rect x="${tubeX + 7}" y="18" width="${digitWidth - 22}" height="94" rx="35" /></clipPath>`;
    })
    .join('');
  const digits = value
    .split('')
    .map((digit, index) => renderDigitStack(digit, index, digitWidth))
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="154" viewBox="0 0 ${width} 154" role="img" aria-label="Animated profile views counter: ${escapeXml(rawValue)}">
  <defs>
    ${clips}
    ${renderNixieSymbols()}
    <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#180b0a" />
      <stop offset="0.52" stop-color="#070303" />
      <stop offset="1" stop-color="#210b08" />
    </linearGradient>
    <linearGradient id="tube-glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff9a4a" stop-opacity=".14" />
      <stop offset="0.18" stop-color="#7d2715" stop-opacity=".24" />
      <stop offset="0.52" stop-color="#120506" stop-opacity=".96" />
      <stop offset="0.84" stop-color="#4f170f" stop-opacity=".44" />
      <stop offset="1" stop-color="#ffb04c" stop-opacity=".18" />
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffd27a" />
      <stop offset=".18" stop-color="#70432b" />
      <stop offset=".52" stop-color="#1b0d0b" />
      <stop offset=".82" stop-color="#d06a31" />
      <stop offset="1" stop-color="#35170f" />
    </linearGradient>
    <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
      <path d="M0 0H4" stroke="#ff9b38" stroke-opacity=".13" stroke-width="1" />
    </pattern>
    <filter id="tube-aura" x="-70%" y="-45%" width="240%" height="190%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 .55  0 0 0 0 .09  0 0 0 0 0  0 0 0 .9 0" />
      <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="digit-glow" x="-80%" y="-60%" width="260%" height="220%">
      <feGaussianBlur stdDeviation="3.4" result="blur" />
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 .9  0 0 0 0 .22  0 0 0 0 .03  0 0 0 .95 0" result="orange" />
      <feMerge><feMergeNode in="orange" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="ember-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2.2" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <style>
      .nixie-wire { fill: none; stroke: #ffb55f; stroke-width: 3.2; stroke-linecap: round; stroke-linejoin: round; filter: url(#digit-glow); }
    </style>
  </defs>
  <rect x="1.5" y="1.5" width="${width - 3}" height="151" rx="15" fill="#050303" stroke="#48140c" stroke-width="3" />
  <rect x="5" y="5" width="${width - 10}" height="144" rx="12" fill="url(#panel)" stroke="#c35525" stroke-opacity=".78" stroke-width="1.4" />
  <path d="M11 26H${width - 11} M11 128H${width - 11}" stroke="#c14f24" stroke-opacity=".44" />
  <rect x="7" y="7" width="${width - 14}" height="140" rx="10" fill="url(#scanlines)" />
  <ellipse cx="${width / 2}" cy="75" rx="${Math.max(30, width / 2 - 10)}" ry="67" fill="none" stroke="#ff5728" stroke-opacity=".22" stroke-width="1" filter="url(#tube-aura)" />
  ${value.split('').map((_, index) => {
    const tubeX = 14 + index * digitWidth;
    const tubeWidth = digitWidth - 8;
    const centerX = tubeX + tubeWidth / 2;
    return `
  <g class="tube" aria-hidden="true">
    <rect x="${tubeX + 3}" y="12" width="${tubeWidth - 6}" height="120" rx="38" fill="#ff5d24" fill-opacity=".12" filter="url(#tube-aura)" />
    <rect x="${tubeX + 7}" y="13" width="${tubeWidth - 14}" height="116" rx="34" fill="url(#tube-glass)" stroke="#a83b1b" stroke-opacity=".9" stroke-width="1.2" />
    <ellipse cx="${centerX}" cy="15" rx="${Math.max(16, tubeWidth / 2 - 15)}" ry="6" fill="url(#metal)" stroke="#e0833d" stroke-opacity=".55" />
    <ellipse cx="${centerX}" cy="128" rx="${Math.max(16, tubeWidth / 2 - 15)}" ry="6" fill="url(#metal)" stroke="#7b331d" stroke-opacity=".85" />
    <path d="M${centerX - 18} 15V128 M${centerX + 18} 15V128" stroke="#ffd18a" stroke-opacity=".13" />
    <path d="M${tubeX + 15} 31H${tubeX + tubeWidth - 15} M${tubeX + 14} 109H${tubeX + tubeWidth - 14}" stroke="#e96b30" stroke-opacity=".22" />
    <path d="M${tubeX + 18} 22 C${tubeX + 8} 50 ${tubeX + 8} 95 ${tubeX + 18} 120" fill="none" stroke="#ffd48b" stroke-opacity=".16" stroke-width="2" />
  </g>`;
  }).join('')}
  <circle cx="15" cy="16" r="3" fill="#ff5421" filter="url(#ember-glow)">
    <animate attributeName="opacity" values="1;.22;1" dur="1.1s" repeatCount="indefinite" />
  </circle>
  <g>${digits}</g>
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

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

// Hand-drawn cathode shapes keep the tube readable without relying on a font.
// They are intentionally thin and slightly irregular, like real Nixie wires.
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
        <path d="${pathData}" class="nixie-halo" />
        <path d="${pathData}" class="nixie-wire" />
        <path d="${pathData}" class="nixie-core" />
      </symbol>`)
    .join('');
}

function renderDigitStack(digit, index, digitWidth) {
  const finalDigit = Number(digit);
  const start = (finalDigit + 10) % 10;
  const tubeX = 14 + index * digitWidth;
  const digitX = tubeX + 5;
  const stackStep = 106;
  const begin = `${(index * 0.09).toFixed(2)}s`;
  const duration = (2.18 + index * 0.055).toFixed(2);
  const sequence = [
    start,
    (start + 6) % 10,
    (start + 3) % 10,
    (start + 8) % 10,
    (start + 2) % 10,
    (start + 7) % 10,
    (start + 4) % 10,
    finalDigit
  ];
  const animationOffsets = sequence
    .map((_, sequenceIndex) => `0 ${-sequenceIndex * stackStep}`)
    .join(';');
  const keyTimes = '0;.11;.23;.38;.54;.68;.84;1';
  const keySplines = '.35 .02 .7 1;.18 .85 .3 1;.28 .02 .55 1;.15 .9 .25 1;.28 .02 .6 1;.2 .85 .25 1;.12 .94 .22 1';
  const cathodes = sequence
    .map((value, sequenceIndex) =>
      `<use href="#tube-digit-${value}" x="${digitX}" y="${14 + sequenceIndex * stackStep}" width="70" height="108" />`)
    .join('');

  return `
    <g clip-path="url(#tube-slot-${index})">
      <g opacity=".62">
        ${cathodes}
        <animate attributeName="opacity" values=".58;1;.76;1" keyTimes="0;.24;.58;1" dur="2.8s" begin="${begin}" repeatCount="indefinite" />
        <animateTransform attributeName="transform" type="translate" values="${animationOffsets}" keyTimes="${keyTimes}" dur="${duration}s" begin="${begin}" calcMode="spline" keySplines="${keySplines}" fill="freeze" />
      </g>
    </g>`;
}

function renderTube(index, digitWidth) {
  const tubeX = 14 + index * digitWidth;
  const tubeWidth = digitWidth - 8;
  const centerX = tubeX + tubeWidth / 2;
  const left = tubeX + 7;
  const right = tubeX + tubeWidth - 7;
  const body = `M${left} 133 V50 C${left} 26 ${tubeX + 19} 12 ${centerX} 12 C${tubeX + 61} 12 ${right} 26 ${right} 50 V133 Z`;
  const delay = `${(index * 0.11).toFixed(2)}s`;
  const ghostDigit = NIXIE_DIGITS[8];

  return `
  <g class="nixie-tube" aria-hidden="true">
    <path d="${body}" fill="#ff5b22" fill-opacity=".16" stroke="#ff6e2b" stroke-opacity=".48" stroke-width="7" filter="url(#tube-aura)" />
    <path d="${body}" fill="url(#tube-glass)" stroke="url(#glass-rim)" stroke-width="1.5" />
    <path d="${body}" fill="url(#fresnel)" opacity=".42" />
    <ellipse cx="${centerX}" cy="82" rx="28" ry="51" fill="#ff6c2c" opacity=".06" filter="url(#tube-aura)">
      <animate attributeName="opacity" values=".04;.18;.06;.12;.04" dur="3.8s" begin="${delay}" repeatCount="indefinite" />
    </ellipse>
    <rect x="${left + 4}" y="29" width="${tubeWidth - 22}" height="101" rx="23" fill="url(#mesh)" opacity=".34" clip-path="url(#tube-slot-${index})">
      <animate attributeName="opacity" values=".22;.55;.28;.46;.22" dur="3.1s" begin="${delay}" repeatCount="indefinite" />
    </rect>
    <path d="${ghostDigit}" transform="translate(${tubeX + 5} 14) scale(1 1.17)" fill="none" stroke="#8d3d24" stroke-opacity=".2" stroke-width="1.25" />
    <ellipse cx="${centerX}" cy="83" rx="24" ry="45" fill="none" stroke="#c47a43" stroke-opacity=".2" stroke-width="1" />
    <path d="M${tubeX + 27} 35 C${tubeX + 18} 61 ${tubeX + 22} 104 ${tubeX + 32} 127 M${tubeX + 53} 35 C${tubeX + 63} 62 ${tubeX + 59} 104 ${tubeX + 49} 127" fill="none" stroke="#d9874b" stroke-opacity=".22" stroke-width="1.2" />
    <path d="M${tubeX + 20} 28 C${tubeX + 34} 36 ${tubeX + 46} 36 ${tubeX + 61} 28" fill="none" stroke="#ffd58c" stroke-opacity=".28" stroke-width="1" stroke-dasharray="2 7">
      <animate attributeName="stroke-dashoffset" values="0;-18;0" dur="2.6s" begin="${delay}" repeatCount="indefinite" />
    </path>
    <path d="M${tubeX + 22} 35 V129 M${tubeX + 58} 35 V129" stroke="#f2a45a" stroke-opacity=".28" stroke-width="1.1" />
    <circle cx="${tubeX + 22}" cy="38" r="2" fill="#d98b50" fill-opacity=".45" />
    <circle cx="${tubeX + 58}" cy="38" r="2" fill="#d98b50" fill-opacity=".45" />
    <path d="M${tubeX + 21} 40 H${tubeX + 59} M${tubeX + 20} 123 H${tubeX + 60}" stroke="#ffbd69" stroke-opacity=".28" stroke-width="1" />
    <ellipse cx="${centerX}" cy="12" rx="10" ry="4" fill="url(#metal)" stroke="#ffd28a" stroke-opacity=".5" />
    <path d="M${centerX - 6} 10 V6 C${centerX - 6} 1 ${centerX + 6} 1 ${centerX + 6} 6 V10" fill="url(#glass-top)" stroke="#ffb668" stroke-opacity=".66" stroke-width="1" />
    <path d="M${tubeX + 17} 26 C${tubeX + 11} 51 ${tubeX + 12} 100 ${tubeX + 23} 126" fill="none" stroke="#fff0c5" stroke-opacity=".2" stroke-width="2.2">
      <animate attributeName="stroke-opacity" values=".14;.6;.2" dur="4.6s" begin="${delay}" repeatCount="indefinite" />
    </path>
    <path d="M${tubeX + 66} 29 C${tubeX + 72} 51 ${tubeX + 70} 98 ${tubeX + 63} 122" fill="none" stroke="#ffb65a" stroke-opacity=".12" stroke-width="1.4" />
    <path d="M${tubeX + 4} 129 H${tubeX + tubeWidth - 4} V151 C${tubeX + tubeWidth - 4} 156 ${tubeX + tubeWidth - 10} 159 ${tubeX + tubeWidth - 16} 159 H${tubeX + 16} C${tubeX + 10} 159 ${tubeX + 4} 156 ${tubeX + 4} 151 Z" fill="url(#metal)" stroke="#a9522d" stroke-width="1.3" />
    <rect x="${tubeX + 7}" y="133" width="${tubeWidth - 14}" height="7" rx="3" fill="#2c100a" opacity=".72" />
    <path d="M${tubeX + 12} 145 H${tubeX + tubeWidth - 12}" stroke="#f2ad65" stroke-opacity=".55" />
    <rect x="${tubeX + 13}" y="145" width="${tubeWidth - 26}" height="2" rx="1" fill="#ff8a3c" opacity=".26">
      <animate attributeName="opacity" values=".2;.9;.3;.65;.2" dur="2.2s" begin="${delay}" repeatCount="indefinite" />
    </rect>
    <circle cx="${tubeX + 16}" cy="149" r="1.8" fill="#ff9b48" filter="url(#ember-glow)">
      <animate attributeName="opacity" values=".18;1;.25" dur="1.9s" begin="${delay}" repeatCount="indefinite" />
    </circle>
    <circle cx="${tubeX + tubeWidth - 16}" cy="149" r="1.8" fill="#ff9b48" filter="url(#ember-glow)">
      <animate attributeName="opacity" values="1;.2;1" dur="2.3s" begin="${delay}" repeatCount="indefinite" />
    </circle>
    <circle cx="${tubeX + 25}" cy="61" r="1.2" fill="#ffe0a3" filter="url(#ember-glow)">
      <animate attributeName="cy" values="61;96;61" dur="2.7s" begin="${delay}" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;.95;0" dur="2.7s" begin="${delay}" repeatCount="indefinite" />
    </circle>
    <circle cx="${tubeX + 56}" cy="106" r="1" fill="#ffb557" filter="url(#ember-glow)">
      <animate attributeName="cy" values="106;52;106" dur="3.4s" begin="${delay}" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;.7;0" dur="3.4s" begin="${delay}" repeatCount="indefinite" />
    </circle>
    <path d="M${tubeX + 18} 159 V177 M${tubeX + 31} 159 V177 M${tubeX + 49} 159 V177 M${tubeX + 62} 159 V177" stroke="#d58a50" stroke-width="2.6" stroke-linecap="round" />
    <path d="M${tubeX + 17} 177 H${tubeX + 20} M${tubeX + 30} 177 H${tubeX + 33} M${tubeX + 48} 177 H${tubeX + 51} M${tubeX + 61} 177 H${tubeX + 64}" stroke="#ffd08a" stroke-opacity=".7" stroke-width="1.3" />
  </g>`;
}

function renderCounter(count) {
  const rawValue = String(Math.max(0, count));
  const value = rawValue.length > 8 ? rawValue.slice(-8) : rawValue.padStart(8, '0');
  const digitWidth = 88;
  const width = 28 + value.length * digitWidth;
  const height = 190;
  const clips = value
    .split('')
    .map((_, index) => {
      const tubeX = 14 + index * digitWidth;
      const tubeWidth = digitWidth - 8;
      const centerX = tubeX + tubeWidth / 2;
      const clipPath = `M${tubeX + 9} 130 V51 C${tubeX + 9} 27 ${tubeX + 20} 17 ${centerX} 17 C${tubeX + 60} 17 ${tubeX + tubeWidth - 9} 27 ${tubeX + tubeWidth - 9} 51 V130 Z`;
      return `<clipPath id="tube-slot-${index}"><path d="${clipPath}" /></clipPath>`;
    })
    .join('');
  const tubes = value
    .split('')
    .map((_, index) => renderTube(index, digitWidth))
    .join('');
  const digits = value
    .split('')
    .map((digit, index) => renderDigitStack(digit, index, digitWidth))
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Animated profile views counter: ${escapeXml(rawValue)}">
  <defs>
    ${clips}
    ${renderNixieSymbols()}
    <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#11100e" />
      <stop offset="0.48" stop-color="#090909" />
      <stop offset="1" stop-color="#15120f" />
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="46%" r="74%">
      <stop offset="0" stop-color="#3a2417" stop-opacity=".18" />
      <stop offset=".46" stop-color="#17120f" stop-opacity=".08" />
      <stop offset="1" stop-color="#020202" stop-opacity=".64" />
    </radialGradient>
    <linearGradient id="tube-glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f8dbac" stop-opacity=".16" />
      <stop offset="0.15" stop-color="#9c5c36" stop-opacity=".2" />
      <stop offset="0.5" stop-color="#0f0c0a" stop-opacity=".94" />
      <stop offset="0.78" stop-color="#4c2a1a" stop-opacity=".38" />
      <stop offset="1" stop-color="#d99a5e" stop-opacity=".15" />
    </linearGradient>
    <linearGradient id="fresnel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff4d0" stop-opacity=".28" />
      <stop offset=".08" stop-color="#fff6dc" stop-opacity=".06" />
      <stop offset=".5" stop-color="#fff1cb" stop-opacity="0" />
      <stop offset=".9" stop-color="#fff1cb" stop-opacity=".03" />
      <stop offset="1" stop-color="#ffd494" stop-opacity=".23" />
    </linearGradient>
    <linearGradient id="glass-rim" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffd58d" stop-opacity=".86" />
      <stop offset=".25" stop-color="#a34623" stop-opacity=".78" />
      <stop offset=".7" stop-color="#4f1a12" stop-opacity=".94" />
      <stop offset="1" stop-color="#f08b43" stop-opacity=".8" />
    </linearGradient>
    <linearGradient id="glass-top" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff0c6" stop-opacity=".62" />
      <stop offset=".4" stop-color="#d96b35" stop-opacity=".42" />
      <stop offset="1" stop-color="#38120d" stop-opacity=".92" />
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffd18a" />
      <stop offset=".16" stop-color="#8d4d2c" />
      <stop offset=".45" stop-color="#291512" />
      <stop offset=".76" stop-color="#bc6736" />
      <stop offset="1" stop-color="#351710" />
    </linearGradient>
    <pattern id="mesh" width="12" height="10" patternUnits="userSpaceOnUse">
      <path d="M0 5 L3 0 H9 L12 5 L9 10 H3 Z M-6 5 L-3 0 H3 L6 5 L3 10 H-3 Z" fill="none" stroke="#ef8b42" stroke-opacity=".38" stroke-width=".75" />
      <animateTransform attributeName="patternTransform" type="translate" values="0 0;6 5;0 0" dur="5.6s" repeatCount="indefinite" />
    </pattern>
    <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
      <path d="M0 0 H4" stroke="#ff9b38" stroke-opacity=".11" stroke-width="1" />
    </pattern>
    <filter id="grain" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="2" seed="19" result="noise" />
      <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
      <feComponentTransfer in="mono">
        <feFuncA type="table" tableValues="0 .16" />
      </feComponentTransfer>
    </filter>
    <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ff9f4b" stop-opacity="0" />
      <stop offset=".48" stop-color="#ffd38a" stop-opacity=".72" />
      <stop offset=".52" stop-color="#ff7b35" stop-opacity=".86" />
      <stop offset="1" stop-color="#ff742e" stop-opacity="0" />
    </linearGradient>
    <filter id="tube-aura" x="-65%" y="-35%" width="230%" height="180%">
      <feGaussianBlur stdDeviation="5.6" result="blur" />
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 .45 0 0 0 0 .08 0 0 0 0 0 0 0 0 .82 0" />
      <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="digit-glow" x="-85%" y="-50%" width="270%" height="200%">
      <feGaussianBlur stdDeviation="3.2" result="blur" />
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 .9 0 0 0 0 .25 0 0 0 0 .02 0 0 0 .98 0" result="orange" />
      <feMerge><feMergeNode in="orange" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="digit-bloom" x="-120%" y="-100%" width="340%" height="300%">
      <feGaussianBlur stdDeviation="7.5" result="blur" />
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 .86 0 0 0 0 .16 0 0 0 0 0 0 0 0 .62 0" />
    </filter>
    <filter id="ember-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2.2" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <style>
      .nixie-halo { fill: none; stroke: #ff5a00; stroke-width: 10; stroke-linecap: round; stroke-linejoin: round; opacity: .24; filter: url(#digit-bloom); }
      .nixie-wire { fill: none; stroke: #ff8a24; stroke-width: 3.6; stroke-linecap: round; stroke-linejoin: round; filter: url(#digit-glow); }
      .nixie-core { fill: none; stroke: #ffd08a; stroke-width: 1.05; stroke-linecap: round; stroke-linejoin: round; opacity: .92; }
    </style>
  </defs>
  <rect x="1.5" y="1.5" width="${width - 3}" height="${height - 3}" rx="8" fill="#060606" stroke="#544131" stroke-width="2.5" />
  <rect x="5" y="5" width="${width - 10}" height="${height - 10}" rx="6" fill="url(#panel)" stroke="#a36b3d" stroke-opacity=".72" stroke-width="1.1" />
  <path d="M11 26 H${width - 11} M11 183 H${width - 11}" stroke="#c35727" stroke-opacity=".45" />
  <rect x="7" y="7" width="${width - 14}" height="${height - 14}" rx="4" fill="url(#panel)" />
  <rect x="7" y="7" width="${width - 14}" height="${height - 14}" rx="4" fill="url(#scanlines)" opacity=".68" />
  <rect x="7" y="7" width="${width - 14}" height="${height - 14}" rx="4" fill="#c6a47e" opacity=".035" filter="url(#grain)" />
  <rect x="7" y="7" width="${width - 14}" height="${height - 14}" rx="4" fill="url(#vignette)" />
  <path d="M-26 8 V182" stroke="url(#sweep)" stroke-width="7" opacity=".24" filter="url(#tube-aura)">
    <animateTransform attributeName="transform" type="translate" values="0 0;${width + 52} 0;0 0" dur="8.5s" repeatCount="indefinite" />
  </path>
  <path d="M12 21 H${width - 12} M12 176 H${width - 12}" stroke="#ffd08a" stroke-opacity=".08" stroke-dasharray="2 9" />
  <ellipse cx="${width / 2}" cy="78" rx="${Math.max(30, width / 2 - 10)}" ry="70" fill="none" stroke="#ff5728" stroke-opacity=".2" stroke-width="1" filter="url(#tube-aura)" />
  <g>${tubes}</g>
  <g>${digits}</g>
  <circle cx="15" cy="16" r="3" fill="#ff5421" filter="url(#ember-glow)">
    <animate attributeName="opacity" values="1;.22;1" dur="1.1s" repeatCount="indefinite" />
  </circle>
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

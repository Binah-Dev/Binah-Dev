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
  const tubeX = 14 + index * digitWidth;
  const digitX = tubeX + 5;
  const begin = `${(index * 0.09).toFixed(2)}s`;
  const duration = (0.2 + index * 0.008).toFixed(2);

  return `
    <g clip-path="url(#tube-slot-${index})">
      <g opacity=".72">
        <use href="#tube-digit-${finalDigit}" x="${digitX}" y="14" width="70" height="108" />
        <animate attributeName="opacity" values=".16;.46;1.08;.84;1" keyTimes="0;.18;.45;.78;1" dur="${duration}s" begin="${begin}" fill="freeze" />
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
  const highlightShift = (index % 3) - 1;
  const glassOpacity = [0.94, 0.98, 0.92, 0.96][index % 4];
  const inactiveCathodes = NIXIE_DIGITS
    .map((pathData, digit) => {
      const opacity = digit === 8 ? '.045' : '.018';
      return `<path d="${pathData}" transform="translate(${tubeX + 5} 14) scale(1 1.17)" fill="none" stroke="#897563" stroke-opacity="${opacity}" stroke-width=".9" />`;
    })
    .join('');

  return `
  <g class="nixie-tube" aria-hidden="true">
    <path d="${body}" fill="#5a392b" fill-opacity=".06" stroke="#b19a83" stroke-opacity=".12" stroke-width="5" />
    <path d="${body}" fill="url(#tube-glass)" fill-opacity="${glassOpacity}" stroke="url(#glass-rim)" stroke-width="1.2" />
    <path d="${body}" fill="url(#fresnel)" opacity=".2" />
    <ellipse cx="${centerX}" cy="82" rx="28" ry="51" fill="#ff6c2c" opacity=".018" filter="url(#tube-aura)">
      <animate attributeName="opacity" values=".04;.18;.06;.12;.04" dur="3.8s" begin="${delay}" repeatCount="indefinite" />
    </ellipse>
    <rect x="${left + 4}" y="29" width="${tubeWidth - 22}" height="101" rx="23" fill="url(#mesh)" opacity=".2" clip-path="url(#tube-slot-${index})">
      <animate attributeName="opacity" values=".12;.32;.18;.27;.12" dur="3.1s" begin="${delay}" repeatCount="indefinite" />
    </rect>
    ${inactiveCathodes}
    <ellipse cx="${centerX}" cy="83" rx="24" ry="45" fill="none" stroke="#c47a43" stroke-opacity=".2" stroke-width="1" />
    <path d="M${tubeX + 27} 35 C${tubeX + 18} 61 ${tubeX + 22} 104 ${tubeX + 32} 127 M${tubeX + 53} 35 C${tubeX + 63} 62 ${tubeX + 59} 104 ${tubeX + 49} 127" fill="none" stroke="#d9874b" stroke-opacity=".22" stroke-width="1.2" />
    <path d="M${tubeX + 20} 28 C${tubeX + 34} 36 ${tubeX + 46} 36 ${tubeX + 61} 28" fill="none" stroke="#e8d0b1" stroke-opacity=".12" stroke-width="1" stroke-dasharray="2 7">
      <animate attributeName="stroke-dashoffset" values="0;-18;0" dur="2.6s" begin="${delay}" repeatCount="indefinite" />
    </path>
    <path d="M${tubeX + 22} 35 V129 M${tubeX + 58} 35 V129" stroke="#9d8872" stroke-opacity=".2" stroke-width="1.1" />
    <circle cx="${tubeX + 22}" cy="38" r="2" fill="#927965" fill-opacity=".32" />
    <circle cx="${tubeX + 58}" cy="38" r="2" fill="#927965" fill-opacity=".32" />
    <path d="M${tubeX + 21} 40 H${tubeX + 59} M${tubeX + 20} 123 H${tubeX + 60}" stroke="#b39a7c" stroke-opacity=".17" stroke-width="1" />
    <ellipse cx="${centerX}" cy="12" rx="10" ry="4" fill="url(#metal)" stroke="#d6c1a4" stroke-opacity=".16" />
    <path d="M${centerX - 6} 10 V6 C${centerX - 6} 1 ${centerX + 6} 1 ${centerX + 6} 6 V10" fill="url(#glass-top)" stroke="#e7d4ba" stroke-opacity=".28" stroke-width="1" />
    <path d="M${tubeX + 17 + highlightShift} 26 C${tubeX + 11 + highlightShift} 51 ${tubeX + 12 + highlightShift} 100 ${tubeX + 23 + highlightShift} 126" fill="none" stroke="#fff4df" stroke-opacity=".12" stroke-width="2.2">
      <animate attributeName="stroke-opacity" values=".08;.28;.12" dur="4.6s" begin="${delay}" repeatCount="indefinite" />
    </path>
    <path d="M${tubeX + 66 - highlightShift} 29 C${tubeX + 72 - highlightShift} 51 ${tubeX + 70 - highlightShift} 98 ${tubeX + 63 - highlightShift} 122" fill="none" stroke="#f0d7b5" stroke-opacity=".06" stroke-width="1.4" />
    <ellipse cx="${centerX}" cy="161" rx="30" ry="6" fill="#ff8a24" opacity=".025" filter="url(#tube-aura)">
      <animate attributeName="opacity" values=".018;.055;.022" dur="2.6s" begin="${delay}" repeatCount="indefinite" />
    </ellipse>
    <path d="M${tubeX + 4} 129 H${tubeX + tubeWidth - 4} V151 C${tubeX + tubeWidth - 4} 156 ${tubeX + tubeWidth - 10} 159 ${tubeX + tubeWidth - 16} 159 H${tubeX + 16} C${tubeX + 10} 159 ${tubeX + 4} 156 ${tubeX + 4} 151 Z" fill="url(#metal)" stroke="#6d5542" stroke-opacity=".7" stroke-width="1.1" />
    <rect x="${tubeX + 7}" y="133" width="${tubeWidth - 14}" height="7" rx="2" fill="#100f0d" opacity=".82" />
    <path d="M${tubeX + 12} 145 H${tubeX + tubeWidth - 12}" stroke="#a98b6b" stroke-opacity=".25" />
    <rect x="${tubeX + 13}" y="145" width="${tubeWidth - 26}" height="2" rx="1" fill="#b86c3f" opacity=".09">
      <animate attributeName="opacity" values=".06;.2;.08;.16;.06" dur="2.2s" begin="${delay}" repeatCount="indefinite" />
    </rect>
    <circle cx="${tubeX + 16}" cy="149" r="1.3" fill="#c0784e" filter="url(#ember-glow)">
      <animate attributeName="opacity" values=".08;.35;.1" dur="1.9s" begin="${delay}" repeatCount="indefinite" />
    </circle>
    <circle cx="${tubeX + tubeWidth - 16}" cy="149" r="1.3" fill="#c0784e" filter="url(#ember-glow)">
      <animate attributeName="opacity" values=".35;.08;.35" dur="2.3s" begin="${delay}" repeatCount="indefinite" />
    </circle>
    <circle cx="${tubeX + 25}" cy="61" r="1.2" fill="#ffe0a3" filter="url(#ember-glow)">
      <animate attributeName="cy" values="61;96;61" dur="2.7s" begin="${delay}" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;.95;0" dur="2.7s" begin="${delay}" repeatCount="indefinite" />
    </circle>
    <circle cx="${tubeX + 56}" cy="106" r="1" fill="#ffb557" filter="url(#ember-glow)">
      <animate attributeName="cy" values="106;52;106" dur="3.4s" begin="${delay}" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;.7;0" dur="3.4s" begin="${delay}" repeatCount="indefinite" />
    </circle>
    <path d="M${tubeX + 18} 159 V177 M${tubeX + 31} 159 V177 M${tubeX + 49} 159 V177 M${tubeX + 62} 159 V177" stroke="#6b4933" stroke-width="2.4" stroke-linecap="round" />
    <path d="M${tubeX + 17} 177 H${tubeX + 20} M${tubeX + 30} 177 H${tubeX + 33} M${tubeX + 48} 177 H${tubeX + 51} M${tubeX + 61} 177 H${tubeX + 64}" stroke="#ca7540" stroke-opacity=".28" stroke-width="1.1" />
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
      <stop offset="0" stop-color="#15120f" stop-opacity=".28" />
      <stop offset=".46" stop-color="#0e0d0b" stop-opacity=".1" />
      <stop offset="1" stop-color="#080909" stop-opacity=".72" />
    </radialGradient>
    <linearGradient id="tube-glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ded2c1" stop-opacity=".09" />
      <stop offset="0.15" stop-color="#877b6e" stop-opacity=".08" />
      <stop offset="0.5" stop-color="#070707" stop-opacity=".96" />
      <stop offset="0.78" stop-color="#4b4035" stop-opacity=".13" />
      <stop offset="1" stop-color="#c9b39a" stop-opacity=".07" />
    </linearGradient>
    <linearGradient id="fresnel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff4d0" stop-opacity=".28" />
      <stop offset=".08" stop-color="#fff6dc" stop-opacity=".06" />
      <stop offset=".5" stop-color="#fff1cb" stop-opacity="0" />
      <stop offset=".9" stop-color="#fff1cb" stop-opacity=".03" />
      <stop offset="1" stop-color="#ffd494" stop-opacity=".23" />
    </linearGradient>
    <linearGradient id="glass-rim" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff5e4" stop-opacity=".09" />
      <stop offset=".25" stop-color="#d7c8b7" stop-opacity=".05" />
      <stop offset=".7" stop-color="#6f655b" stop-opacity=".08" />
      <stop offset="1" stop-color="#fff0da" stop-opacity=".1" />
    </linearGradient>
    <linearGradient id="glass-top" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff7e6" stop-opacity=".22" />
      <stop offset=".4" stop-color="#c9b9a5" stop-opacity=".08" />
      <stop offset="1" stop-color="#2f2a25" stop-opacity=".72" />
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6f5a47" />
      <stop offset=".16" stop-color="#2a241f" />
      <stop offset=".45" stop-color="#171411" />
      <stop offset=".76" stop-color="#332a23" />
      <stop offset="1" stop-color="#0f0e0d" />
    </linearGradient>
    <pattern id="mesh" width="12" height="10" patternUnits="userSpaceOnUse">
      <path d="M0 5 L3 0 H9 L12 5 L9 10 H3 Z M-6 5 L-3 0 H3 L6 5 L3 10 H-3 Z" fill="none" stroke="#9d8974" stroke-opacity=".24" stroke-width=".7" />
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
  <rect x="1.5" y="1.5" width="${width - 3}" height="${height - 3}" rx="8" fill="#060606" stroke="#3c332b" stroke-width="2.5" />
  <rect x="5" y="5" width="${width - 10}" height="${height - 10}" rx="6" fill="url(#panel)" stroke="#7b6754" stroke-opacity=".42" stroke-width="1.1" />
  <path d="M11 26 H${width - 11} M11 183 H${width - 11}" stroke="#8e7560" stroke-opacity=".2" />
  <rect x="7" y="7" width="${width - 14}" height="${height - 14}" rx="4" fill="url(#panel)" />
  <rect x="7" y="7" width="${width - 14}" height="${height - 14}" rx="4" fill="url(#scanlines)" opacity=".68" />
  <rect x="7" y="7" width="${width - 14}" height="${height - 14}" rx="4" fill="#c6a47e" opacity=".035" filter="url(#grain)" />
  <rect x="7" y="7" width="${width - 14}" height="${height - 14}" rx="4" fill="url(#vignette)" />
  <path d="M-26 8 V182" stroke="url(#sweep)" stroke-width="7" opacity=".24" filter="url(#tube-aura)">
    <animateTransform attributeName="transform" type="translate" values="0 0;${width + 52} 0;0 0" dur="8.5s" repeatCount="indefinite" />
  </path>
  <path d="M12 21 H${width - 12} M12 176 H${width - 12}" stroke="#ffd08a" stroke-opacity=".08" stroke-dasharray="2 9" />
  <ellipse cx="${width / 2}" cy="78" rx="${Math.max(30, width / 2 - 10)}" ry="70" fill="none" stroke="#9d8062" stroke-opacity=".06" stroke-width="1" />
  <g fill="#bca78b" stroke="#3b332c" stroke-width=".7" opacity=".55">
    <circle cx="13" cy="13" r="2.1" /><circle cx="${width - 13}" cy="13" r="2.1" />
    <circle cx="13" cy="177" r="2.1" /><circle cx="${width - 13}" cy="177" r="2.1" />
  </g>
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

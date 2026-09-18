const COUNTER_SOURCE =
  'https://hits.sh/github.com/Binah-Dev-profile.svg?label=profile%20views';

const DISPLAY_DIGITS = 8;
const CANVAS_WIDTH = 840;
const CANVAS_HEIGHT = 310;
const TUBE_START_X = 52;
const TUBE_PITCH = 92;
const TUBE_WIDTH = 74;

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

// Purpose-drawn cathodes: narrow, imperfect bends instead of a display font.
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
  return NIXIE_DIGITS.map((pathData, digit) => `
    <symbol id="cathode-${digit}" viewBox="0 0 70 92">
      <path d="${pathData}" class="cathode-atmosphere" />
      <path d="${pathData}" class="cathode-bloom" />
      <path d="${pathData}" class="cathode-wire" />
      <path d="${pathData}" class="cathode-core" />
    </symbol>`).join('');
}

function renderClipPaths() {
  return Array.from({ length: DISPLAY_DIGITS }, (_, index) => {
    const x = TUBE_START_X + index * TUBE_PITCH;
    const center = x + TUBE_WIDTH / 2;
    const path = `M${x + 8} 205 V105 C${x + 8} 83 ${x + 19} 69 ${center} 69 C${x + 55} 69 ${x + 66} 83 ${x + 66} 105 V205 Z`;
    return `<clipPath id="tube-clip-${index}"><path d="${path}" /></clipPath>`;
  }).join('');
}

function renderInactiveCathodes(index) {
  const x = TUBE_START_X + index * TUBE_PITCH + 2;
  return NIXIE_DIGITS.map((pathData, digit) => {
    const offset = ((digit % 3) - 1) * 0.7;
    const opacity = digit === 8 ? '.032' : '.014';
    return `<path d="${pathData}" transform="translate(${x + offset} 99) scale(1 1.08)" fill="none" stroke="#a55f36" stroke-opacity="${opacity}" stroke-width=".82" />`;
  }).join('');
}

function renderTube(index) {
  const x = TUBE_START_X + index * TUBE_PITCH;
  const center = x + TUBE_WIDTH / 2;
  const left = x + 7;
  const right = x + TUBE_WIDTH - 7;
  const variation = (index % 4) - 1.5;
  const reflectionX = left + 8 + variation;
  const body = `M${left} 205 V106 C${left} 82 ${x + 18} 66 ${center} 66 C${x + 56} 66 ${right} 82 ${right} 106 V205 Z`;
  const delay = `${(index * 0.055).toFixed(3)}s`;

  return `
    <g class="tube" aria-hidden="true">
      <ellipse cx="${center}" cy="221" rx="34" ry="12" fill="url(#light-spill)" opacity=".38" />
      <g clip-path="url(#tube-clip-${index})">
        <rect x="${left + 3}" y="84" width="${right - left - 6}" height="121" rx="25" fill="#070402" opacity=".9" />
        <rect x="${left + 5}" y="89" width="${right - left - 10}" height="111" rx="23" fill="url(#anode-mesh)" opacity=".36" />
        <ellipse cx="${center}" cy="145" rx="25" ry="48" fill="none" stroke="#a35c34" stroke-opacity=".3" stroke-width="1.2" />
        <ellipse cx="${center}" cy="145" rx="20" ry="43" fill="none" stroke="#62361f" stroke-opacity=".25" stroke-width=".8" />
        <path d="M${x + 20} 91 V201 M${x + 54} 91 V201" stroke="#b86a3b" stroke-opacity=".46" stroke-width="1.35" />
        <path d="M${x + 17} 99 H${x + 57} M${x + 16} 191 H${x + 58}" stroke="#d1814b" stroke-opacity=".34" stroke-width="1" />
        <path d="M${x + 24} 199 C${x + 22} 176 ${x + 21} 118 ${x + 29} 94 M${x + 50} 199 C${x + 52} 176 ${x + 53} 118 ${x + 45} 94" fill="none" stroke="#bd5c29" stroke-opacity=".38" stroke-width="1.1" />
        <g fill="#c77c4a" fill-opacity=".42" stroke="#31180e" stroke-width=".5">
          <circle cx="${x + 20}" cy="102" r="2.1" /><circle cx="${x + 54}" cy="102" r="2.1" />
          <circle cx="${x + 24}" cy="194" r="1.8" /><circle cx="${x + 50}" cy="194" r="1.8" />
        </g>
        <g fill="#e5a15f" fill-opacity=".34">
          <rect x="${x + 18}" y="111" width="4" height="7" rx="1" />
          <rect x="${x + 52}" y="168" width="4" height="7" rx="1" />
        </g>
        ${renderInactiveCathodes(index)}
        <ellipse cx="${center}" cy="148" rx="29" ry="53" fill="url(#ion-cloud)" opacity=".78" />
      </g>
      <path d="${body}" fill="url(#glass-body)" stroke="#db915d" stroke-opacity=".2" stroke-width="1.1" />
      <path d="${body}" fill="url(#glass-depth)" opacity=".74" />
      <path d="M${reflectionX} 192 V108 C${reflectionX} 88 ${x + 23 + variation} 76 ${center - 6} 72" fill="none" stroke="#ffc187" stroke-opacity=".24" stroke-width="1.8" stroke-linecap="round">
        <animate attributeName="stroke-opacity" values=".19;.28;.2" dur="7.4s" begin="${delay}" repeatCount="indefinite" />
      </path>
      <path d="M${right - 7} 194 V110 C${right - 7} 90 ${right - 13} 78 ${center + 9} 73" fill="none" stroke="#c86d38" stroke-opacity=".1" stroke-width="1.1" />
      <path d="M${center - 16} 73 C${center - 6} 67 ${center + 7} 67 ${center + 16} 74" fill="none" stroke="#ffd19f" stroke-opacity=".21" stroke-width="1.4" stroke-linecap="round" />
      <path d="M${left + 2} 198 Q${center} 207 ${right - 2} 198" fill="none" stroke="#c87545" stroke-opacity=".22" stroke-width="2.3" />
      <path d="M${center - 5} 68 V61 C${center - 5} 56 ${center + 5} 56 ${center + 5} 61 V68" fill="url(#glass-tip)" stroke="#eaa46e" stroke-opacity=".24" stroke-width=".9" />
      <ellipse cx="${center}" cy="68" rx="8" ry="3" fill="#ed9e5d" fill-opacity=".09" />
      <rect x="${x + 12}" y="198" width="50" height="10" rx="3" fill="#130a06" stroke="#914925" stroke-opacity=".55" />
      <path d="M${x + 5} 205 H${x + 69} V229 C${x + 69} 235 ${x + 63} 238 ${x + 57} 238 H${x + 17} C${x + 11} 238 ${x + 5} 235 ${x + 5} 229 Z" fill="url(#socket-metal)" stroke="#9f552e" stroke-opacity=".86" stroke-width="1" />
      <path d="M${x + 8} 209 H${x + 66} M${x + 8} 232 H${x + 66}" stroke="#d07943" stroke-opacity=".4" stroke-width=".8" />
      <rect x="${x + 10}" y="213" width="54" height="13" rx="1.5" fill="#100804" opacity=".84" />
      <path d="M${x + 13} 216 H${x + 61}" stroke="#a5572e" stroke-opacity=".43" />
      <text x="${center}" y="223" text-anchor="middle" class="socket-mark">IN-14</text>
      <path d="M${x + 14} 229 H${x + 60}" stroke="#3b1d11" stroke-width="2" stroke-dasharray="2 2" />
      <g stroke="url(#pin-metal)" stroke-width="2.25" stroke-linecap="round">
        <path d="M${x + 16} 238 V256" /><path d="M${x + 29} 238 V258" />
        <path d="M${x + 45} 238 V258" /><path d="M${x + 58} 238 V256" />
      </g>
    </g>`;
}

function renderActiveDigit(digit, index) {
  const x = TUBE_START_X + index * TUBE_PITCH + 2;
  const delay = `${(0.04 + index * 0.045).toFixed(3)}s`;
  const duration = `${(0.22 + (index % 3) * 0.018).toFixed(3)}s`;
  return `
    <g clip-path="url(#tube-clip-${index})" opacity="1">
      <use href="#cathode-${Number(digit)}" x="${x}" y="99" width="70" height="99" />
      <animate attributeName="opacity" values="0;.24;.88;.58;1" keyTimes="0;.14;.45;.68;1" dur="${duration}" begin="${delay}" fill="freeze" />
      <animate attributeName="opacity" values="1;.97;1;.985;1" dur="6.8s" begin="${1.1 + index * 0.13}s" repeatCount="indefinite" />
    </g>`;
}

function renderScrews() {
  return [[31, 64, 25], [809, 64, -18], [31, 257, -32], [809, 257, 38]]
    .map(([x, y, angle]) => `
      <g transform="translate(${x} ${y}) rotate(${angle})">
        <circle r="4.1" fill="url(#screw-metal)" stroke="#090909" stroke-width="1" />
        <path d="M-2.3 0 H2.3" stroke="#25211e" stroke-width=".9" />
      </g>`).join('');
}

function renderCounter(count) {
  const rawValue = String(Math.max(0, count));
  const value = rawValue.length > DISPLAY_DIGITS
    ? rawValue.slice(-DISPLAY_DIGITS)
    : rawValue.padStart(DISPLAY_DIGITS, '0');
  const tubes = Array.from({ length: DISPLAY_DIGITS }, (_, index) => renderTube(index)).join('');
  const digits = value.split('').map(renderActiveDigit).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}" role="img" aria-label="Animated profile views counter: ${escapeXml(rawValue)}">
  <defs>
    ${renderClipPaths()}
    ${renderNixieSymbols()}
    <linearGradient id="backdrop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#110c08" /><stop offset=".5" stop-color="#090604" /><stop offset="1" stop-color="#040302" />
    </linearGradient>
    <radialGradient id="ambient" cx="50%" cy="42%" r="72%">
      <stop offset="0" stop-color="#2b170b" stop-opacity=".56" /><stop offset=".48" stop-color="#160b05" stop-opacity=".2" /><stop offset="1" stop-color="#020100" stop-opacity=".8" />
    </radialGradient>
    <linearGradient id="frame-metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#764522" /><stop offset=".08" stop-color="#301a0e" /><stop offset=".56" stop-color="#0b0704" /><stop offset=".92" stop-color="#351a0c" /><stop offset="1" stop-color="#955329" />
    </linearGradient>
    <linearGradient id="recess" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#050302" /><stop offset=".2" stop-color="#160b05" /><stop offset=".77" stop-color="#070402" /><stop offset="1" stop-color="#201005" />
    </linearGradient>
    <linearGradient id="glass-body" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffd6ad" stop-opacity=".11" /><stop offset=".12" stop-color="#c96f39" stop-opacity=".05" /><stop offset=".46" stop-color="#050201" stop-opacity=".13" /><stop offset=".84" stop-color="#a3471f" stop-opacity=".035" /><stop offset="1" stop-color="#e78849" stop-opacity=".09" />
    </linearGradient>
    <linearGradient id="glass-depth" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe0bd" stop-opacity=".045" /><stop offset=".33" stop-color="#090402" stop-opacity=".04" /><stop offset=".82" stop-color="#020100" stop-opacity=".17" /><stop offset="1" stop-color="#dc7439" stop-opacity=".1" />
    </linearGradient>
    <linearGradient id="glass-tip" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffe0b5" stop-opacity=".19" /><stop offset=".5" stop-color="#88401f" stop-opacity=".07" /><stop offset="1" stop-color="#140905" stop-opacity=".5" />
    </linearGradient>
    <radialGradient id="ion-cloud"><stop offset="0" stop-color="#ffb21a" stop-opacity=".58" /><stop offset=".32" stop-color="#ff6800" stop-opacity=".26" /><stop offset=".7" stop-color="#ff3c00" stop-opacity=".07" /><stop offset="1" stop-color="#ff2600" stop-opacity="0" /></radialGradient>
    <radialGradient id="light-spill"><stop offset="0" stop-color="#ff9a0a" stop-opacity=".56" /><stop offset=".42" stop-color="#ff5800" stop-opacity=".18" /><stop offset="1" stop-color="#ff3000" stop-opacity="0" /></radialGradient>
    <linearGradient id="socket-metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a65d30" /><stop offset=".08" stop-color="#4a2513" /><stop offset=".38" stop-color="#1a0e08" /><stop offset=".7" stop-color="#3b1b0d" /><stop offset="1" stop-color="#0d0704" />
    </linearGradient>
    <linearGradient id="pin-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8e4a27" /><stop offset=".65" stop-color="#29140b" /><stop offset="1" stop-color="#b25d31" /></linearGradient>
    <radialGradient id="screw-metal" cx="35%" cy="28%" r="70%"><stop offset="0" stop-color="#c47d4e" /><stop offset=".35" stop-color="#69381f" /><stop offset="1" stop-color="#1b0d07" /></radialGradient>
    <pattern id="anode-mesh" width="10" height="8.6" patternUnits="userSpaceOnUse">
      <path d="M0 4.3 L2.5 0 H7.5 L10 4.3 L7.5 8.6 H2.5 Z M-5 4.3 L-2.5 0 H2.5 L5 4.3 L2.5 8.6 H-2.5 Z" fill="none" stroke="#b86234" stroke-opacity=".48" stroke-width=".6" />
    </pattern>
    <pattern id="brushed-lines" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 .5 H5 M0 3.5 H5" stroke="#cf7541" stroke-opacity=".06" stroke-width=".45" /></pattern>
    <filter id="material-grain" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency=".48" numOctaves="3" seed="29" result="noise" /><feColorMatrix in="noise" type="saturate" values="0" /><feComponentTransfer><feFuncA type="table" tableValues="0 .11" /></feComponentTransfer>
    </filter>
    <filter id="cathode-wide-glow" x="-150%" y="-135%" width="400%" height="370%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="wide-blur" />
      <feFlood flood-color="#ff3800" flood-opacity=".95" result="wide-color" />
      <feComposite in="wide-color" in2="wide-blur" operator="in" result="wide-light" />
      <feMerge><feMergeNode in="wide-light" /><feMergeNode in="wide-blur" /></feMerge>
    </filter>
    <filter id="cathode-near-glow" x="-100%" y="-80%" width="300%" height="260%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3.8" result="near-blur" />
      <feFlood flood-color="#ff6500" flood-opacity="1" result="near-color" />
      <feComposite in="near-color" in2="near-blur" operator="in" result="near-light" />
      <feMerge><feMergeNode in="near-light" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="cathode-wire-light" x="-60%" y="-45%" width="220%" height="190%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="1.45" result="wire-blur" />
      <feFlood flood-color="#ffa014" flood-opacity="1" result="wire-color" />
      <feComposite in="wire-color" in2="wire-blur" operator="in" result="wire-light" />
      <feMerge><feMergeNode in="wire-light" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="cathode-core-light" x="-55%" y="-45%" width="210%" height="190%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation=".9" result="soft-core" />
      <feFlood flood-color="#fff7c7" flood-opacity="1" result="core-color" />
      <feComposite in="core-color" in2="soft-core" operator="in" result="core-light" />
      <feMerge><feMergeNode in="core-light" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <style>
      .cathode-atmosphere { fill: none; stroke: #ff3000; stroke-width: 18; stroke-linecap: round; stroke-linejoin: round; opacity: .48; filter: url(#cathode-wide-glow); }
      .cathode-bloom { fill: none; stroke: #ff5a00; stroke-width: 9; stroke-linecap: round; stroke-linejoin: round; opacity: .94; filter: url(#cathode-near-glow); }
      .cathode-wire { fill: none; stroke: #ff8b00; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; filter: url(#cathode-wire-light); }
      .cathode-core { fill: none; stroke: #fff6c2; stroke-width: 1.65; stroke-linecap: round; stroke-linejoin: round; opacity: 1; filter: url(#cathode-core-light); }
      .socket-mark { fill: #dc8b51; fill-opacity: .7; font: 600 5px Georgia, serif; letter-spacing: 1.2px; }
      .brand { fill: #efb77e; fill-opacity: .96; font: 600 10px Georgia, 'Times New Roman', serif; letter-spacing: 2.2px; }
      .instrument { fill: #c87949; fill-opacity: .62; font: 500 6.5px ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: 1.45px; }
      .worldline { fill: #d78b57; fill-opacity: .54; font: 500 6px ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: 1.7px; }
      .caption { fill: #e19a63; fill-opacity: .72; font: 500 7px Georgia, 'Times New Roman', serif; letter-spacing: 2px; }
    </style>
  </defs>
  <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" rx="10" fill="url(#backdrop)" />
  <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" rx="10" fill="url(#ambient)" />
  <rect x="1" y="1" width="838" height="308" rx="9" fill="none" stroke="#8f4725" stroke-opacity=".34" />
  <text x="28" y="30" class="brand">STEINS;GATE COUNTER LAB</text>
  <text x="28" y="43" class="instrument">COLD CATHODE DISPLAY  /  TYPE IN-14  /  170V</text>
  <g text-anchor="end">
    <text x="812" y="28" class="worldline">STEINS;GATE WORLDLINE</text>
    <text x="812" y="42" class="instrument">0.000081  /  OBSERVATION ACTIVE</text>
  </g>
  <path d="M28 51 H812" stroke="#c96d3a" stroke-opacity=".23" />
  <rect x="19" y="53" width="802" height="220" rx="5" fill="#030201" stroke="#080402" stroke-width="5" />
  <rect x="22" y="56" width="796" height="214" rx="3" fill="url(#frame-metal)" stroke="#aa5b31" stroke-opacity=".58" />
  <rect x="30" y="65" width="780" height="192" rx="2" fill="url(#recess)" stroke="#110804" stroke-width="3" />
  <rect x="34" y="69" width="772" height="184" rx="1" fill="#0b0502" stroke="#a8522b" stroke-opacity=".32" />
  <rect x="34" y="69" width="772" height="184" fill="url(#brushed-lines)" opacity=".58" />
  <rect x="34" y="69" width="772" height="184" fill="#c45f31" opacity=".07" filter="url(#material-grain)" />
  <path d="M38 73 H802 M38 249 H802" stroke="#d57b49" stroke-opacity=".2" />
  ${renderScrews()}
  ${Array.from({ length: DISPLAY_DIGITS }, (_, index) => {
    const x = TUBE_START_X + index * TUBE_PITCH;
    return `<rect x="${x - 4}" y="75" width="82" height="170" rx="30" fill="#020100" fill-opacity=".46" stroke="#a9542b" stroke-opacity=".16" />`;
  }).join('')}
  <g>${tubes}</g>
  <g>${digits}</g>
  <text x="32" y="294" class="caption">ANALOG GLOW IN A DIGITAL WORLD.</text>
  <text x="808" y="294" text-anchor="end" class="instrument">PROFILE OBSERVATIONS  /  ${escapeXml(rawValue.padStart(DISPLAY_DIGITS, '0'))}</text>
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

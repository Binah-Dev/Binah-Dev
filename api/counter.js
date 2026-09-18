const COUNTER_SOURCE =
  'https://hits.sh/github.com/Binah-Dev-profile.svg?label=profile%20views';

function readCount(svg) {
  const match = svg.match(/aria-label="[^"]*?([0-9][0-9,]*)"/i);
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

function renderCounter(count) {
  const value = String(Math.max(0, count));
  const digitWidth = 30;
  const width = 34 + value.length * digitWidth;
  const digits = value
    .split('')
    .map((digit, index) => {
      const finalDigit = Number(digit);
      const x = 24 + index * digitWidth;
      const start = (finalDigit + 10) % 10;
      const values = `${start};${(start + 3) % 10};${(start + 7) % 10};${finalDigit}`;
      return `
        <g clip-path="url(#digit-${index})">
          <g>
            ${Array.from({ length: 10 }, (_, n) =>
              `<text x="${x}" y="${38 + n * 30}" text-anchor="middle">${n}</text>`
            ).join('')}
            <animateTransform attributeName="transform" type="translate" values="0 ${-start * 30};0 ${-((start + 3) % 10) * 30};0 ${-((start + 7) % 10) * 30};0 ${-finalDigit * 30}" keyTimes="0;0.38;0.7;1" dur="1.25s" calcMode="spline" keySplines=".2 .8 .2 1;.2 .8 .2 1;.2 .8 .2 1" fill="freeze" />
          </g>
        </g>`;
    })
    .join('');

  const clips = value
    .split('')
    .map((_, index) => {
      const x = 9 + index * digitWidth;
      return `<clipPath id="digit-${index}"><rect x="${x}" y="13" width="${digitWidth}" height="30" rx="5" /></clipPath>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="62" viewBox="0 0 ${width} 62" role="img" aria-label="Animated profile views counter: ${escapeXml(value)}">
  <defs>
    ${clips}
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#171b2c" />
      <stop offset="1" stop-color="#242b48" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.2" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <style>
      .label { font: 600 9px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: 1.5px; fill: #a9b7dd; }
      .number { font: 700 25px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; fill: #f3a6c8; }
    </style>
  </defs>
  <rect x="1" y="1" width="${width - 2}" height="60" rx="13" fill="url(#bg)" stroke="#59678f" stroke-width="1.5" />
  <circle cx="15" cy="24" r="4" fill="#f3a6c8" filter="url(#glow)" />
  <text class="label" x="9" y="53">PROFILE VIEWS</text>
  <g class="number">${digits}</g>
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

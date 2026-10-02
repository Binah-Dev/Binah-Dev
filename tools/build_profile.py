#!/usr/bin/env python3
"""Build the Binah-Dev profile visuals from profile.json.

    python tools/build_profile.py          # requires: pip install fonttools

Outputs
  assets/profile/panel.svg     the main "editor" panel (hero, stack, trace)
  api/_counter-frame.js        window chrome the Vercel counter wraps its tubes in

Edit profile.json to change the stack — layers and items are laid out
automatically and the panel grows to fit. Icons are Simple Icons slugs
(https://simpleicons.org); missing ones are downloaded into tools/icons/ on
first build, and anything unknown falls back to a monogram tile.

Everything is self-contained SVG (subset fonts embedded as WOFF, inline
paths, CSS/SMIL animation) because GitHub proxies README images and blocks
external requests from inside them.
"""
import base64, heapq, io, json, math, random, re, urllib.request
from pathlib import Path
from xml.sax.saxutils import escape
from fontTools.ttLib import TTFont
from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"
import os
CONFIG = json.loads((ROOT / os.environ.get("PROFILE_CONFIG", "profile.json")).read_text(encoding="utf-8"))

# ── fonts ────────────────────────────────────────────────────────────────
FONT_FILES = {
    "mono": TOOLS / "fonts/JetBrainsMono-Regular.ttf",
    "monomed": TOOLS / "fonts/JetBrainsMono-Medium.ttf",
    "serif": TOOLS / "fonts/InstrumentSerif-Regular.ttf",
    "serifi": TOOLS / "fonts/InstrumentSerif-Italic.ttf",
}
FAMILY = {"mono": "BMono", "monomed": "BMonoMed", "serif": "BSerif", "serifi": "BSerifItalic"}
FALLBACK = {k: ("ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" if k.startswith("mono")
                else "Georgia, 'Times New Roman', serif") for k in FONT_FILES}
_tt = {k: TTFont(v) for k, v in FONT_FILES.items()}


def text_width(kind, s, size):
    f = _tt[kind]; cmap = f.getBestCmap(); hmtx = f["hmtx"]; upm = f["head"].unitsPerEm
    return sum(hmtx[cmap.get(ord(c), cmap[ord("?")])][0] for c in s) * size / upm


def font_face(kind, chars):
    opts = subset.Options(); opts.flavor = "woff"; opts.layout_features = ["kern", "liga"]
    opts.name_IDs = []; opts.notdef_outline = True; opts.hinting = False
    font = TTFont(FONT_FILES[kind])
    sub = subset.Subsetter(opts); sub.populate(text="".join(sorted(set(chars)))); sub.subset(font)
    buf = io.BytesIO(); font.flavor = "woff"; font.save(buf)
    b64 = base64.b64encode(buf.getvalue()).decode()
    return f"@font-face{{font-family:{FAMILY[kind]};src:url(data:font/woff;base64,{b64}) format('woff');}}"


class Svg:
    def __init__(self, w, h, title, desc):
        self.w, self.h, self.title, self.desc = w, h, title, desc
        self.used = {k: set() for k in FONT_FILES}
        self.body, self.defs, self.css, self.reduced = [], [], [], ""

    def t(self, x, y, s, kind="mono", size=12, fill="#8b8f98", anchor="start", ls=0, extra=""):
        self.used[kind].update(s)
        a = f' text-anchor="{anchor}"' if anchor != "start" else ""
        l = f' letter-spacing="{ls}"' if ls else ""
        return (f'<text x="{x:.1f}" y="{y:.1f}" font-family="{FAMILY[kind]}, {FALLBACK[kind]}" '
                f'font-size="{size}" fill="{fill}"{a}{l}{extra}>{escape(s)}</text>')

    def render(self, header=True):
        faces = "".join(font_face(k, v) for k, v in self.used.items() if v)
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h:.0f}" '
                f'viewBox="0 0 {self.w} {self.h:.0f}" role="img" aria-labelledby="t d">\n'
                f'<title id="t">{escape(self.title)}</title><desc id="d">{escape(self.desc)}</desc>\n'
                f'<defs><style>{faces}\n{"".join(self.css)}\n'
                '@media (prefers-reduced-motion: reduce){*{animation:none!important}' + self.reduced + '}'
                f'</style>{"".join(self.defs)}</defs>\n' + "\n".join(self.body) + "\n</svg>\n")


# ── palette & grid ───────────────────────────────────────────────────────
BG, BAR, LINE, LINE2 = "#0b0c0f", "#0f1014", "#202329", "#30343c"
INK, SOFT, MUTED, DIM = "#f3eee6", "#d6d0c6", "#a9adb5", "#6e737d"
AMBER, AMBER2, EMBER = "#ffb766", "#ff9445", "#ff6a1f"
W, GUT, CX, CR = 880, 48, 72, 852   # drawn ~1:1 for the README column
CW = CR - CX
TB, SBH = 50, 34                    # title bar, status bar heights


def smooth(t):
    t = max(0.0, min(1.0, t)); return t * t * (3 - 2 * t)


# ── icons ────────────────────────────────────────────────────────────────
def icon_path(slug):
    p = TOOLS / "icons" / f"{slug}.svg"
    if not p.exists():
        try:
            url = f"https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/{slug}.svg"
            p.write_bytes(urllib.request.urlopen(url, timeout=15).read())
            print(f"  fetched icon: {slug}")
        except Exception as exc:  # unknown slug / offline → monogram
            print(f"  icon '{slug}' unavailable ({exc.__class__.__name__}); using monogram")
            return None
    m = re.search(r' d="([^"]+)"', p.read_text())
    return m.group(1) if m else None


# ── shared pieces ────────────────────────────────────────────────────────
COMMON_DEFS = [
    '<pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#fff" fill-opacity=".05"/></pattern>',
    '<filter id="bloom" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>',
    '<filter id="soft" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5"/></filter>',
]
COMMON_CSS = ".blink{animation:blink 1.2s steps(1) infinite}@keyframes blink{50%{opacity:0}}\n"


def window(s, tab, right, status_mid, status_right):
    """Editor window chrome: title bar + tab, gutter rule, status bar."""
    H = s.h; b = s.body
    s.defs.append(f'<clipPath id="clip"><rect width="{W}" height="{H:.0f}" rx="16"/></clipPath>')
    b.insert(0, f'<g clip-path="url(#clip)"><rect width="{W}" height="{H:.0f}" fill="{BG}"/><rect width="{W}" height="{H:.0f}" fill="url(#dots)"/>')
    b.append(f'<rect width="{W}" height="{TB}" fill="{BAR}"/><line x1="0" y1="{TB - .5}" x2="{W}" y2="{TB - .5}" stroke="{LINE}"/>')
    for i in range(3):
        b.append(f'<circle cx="{22 + i * 16}" cy="{TB / 2}" r="4.5" fill="#3a3d45"/>')
    tx, tw = 80, text_width("monomed", tab, 13) + 44
    b.append(f'<rect x="{tx}" y="8" width="{tw:.1f}" height="{TB - 8}" rx="7" fill="{BG}" stroke="{LINE}"/>'
             f'<rect x="{tx}" y="{TB - 4}" width="{tw:.1f}" height="6" fill="{BG}"/>'
             f'<rect x="{tx + 12}" y="8" width="{tw - 24:.1f}" height="2" fill="{AMBER}"/>')
    b.append(s.t(tx + 16, TB / 2 + 8, "●", "mono", 9, AMBER))
    b.append(s.t(tx + 30, TB / 2 + 8.5, tab, "monomed", 13, INK))
    b.append(s.t(tx + tw + 18, TB / 2 + 8.5, CONFIG.get("handle", "binah-dev"), "mono", 13, DIM))
    b.append(s.t(CR, TB / 2 + 8.5, right, "mono", 12.5, MUTED, "end"))
    b.append(f'<circle cx="{CR - text_width("mono", right, 12.5) - 11:.1f}" cy="{TB / 2 + 4}" r="3.2" fill="{AMBER}" class="blink"/>')
    SB = H - SBH
    b.append(f'<rect y="{SB:.0f}" width="{W}" height="{SBH}" fill="{BAR}"/><line x1="0" y1="{SB + .5:.0f}" x2="{W}" y2="{SB + .5:.0f}" stroke="{LINE}"/>')
    b.append(f'<rect y="{SB:.0f}" width="96" height="{SBH}" fill="{AMBER}" fill-opacity=".14"/>')
    b.append(s.t(16, SB + 22, "⎇ main", "monomed", 12, AMBER))
    b.append(s.t(112, SB + 22, status_mid, "mono", 12, MUTED))
    b.append(s.t(CR, SB + 22, status_right, "mono", 12, MUTED, "end"))
    b.append(f'<line x1="{GUT + .5}" y1="{TB}" x2="{GUT + .5}" y2="{SB:.0f}" stroke="{LINE}"/>')
    return SB


def gutter(s, SB, marks, start=1):
    rows = list(range(TB + 26, int(SB) - 6, 22))
    g = []
    for k, yy in enumerate(rows):
        mark = any(abs(yy - m) < 11 for m in marks)
        g.append(s.t(GUT - 12, yy + 4, str(start + k), "mono", 10.5, AMBER if mark else DIM, "end",
                     extra="" if mark else ' fill-opacity=".7"'))
    s.body.append("".join(g))
    for m in marks:
        s.body.append(f'<rect x="{GUT - 2}" y="{m - 9:.1f}" width="2.5" height="18" fill="{AMBER}"/>')
    return rows


def close(s):
    s.body.append("</g>")
    s.body.append(f'<rect x=".5" y=".5" width="{W - 1}" height="{s.h - 1:.0f}" rx="16" fill="none" stroke="{LINE2}"/>')


def divider(s, y, num, title, sub):
    b = s.body
    b.append(s.t(CX, y + 5, num, "monomed", 14, AMBER))
    b.append(s.t(CX + 30, y + 8, title, "serifi", 32, INK))
    tw, sw = text_width("serifi", title, 32), text_width("mono", sub, 12.5)
    b.append(f'<line x1="{CX + 30 + tw + 18:.1f}" y1="{y + .5:.1f}" x2="{CR - sw - 18:.1f}" y2="{y + .5:.1f}" stroke="{LINE2}"/>')
    b.append(s.t(CR, y + 5, sub, "mono", 12.5, MUTED, "end"))


# ── hero: name + world-line diagram ──────────────────────────────────────
HERO_H = 300


def hero(s, top):
    b = s.body; px = CX; h = CONFIG.get("hero", {})
    name = h.get("name", "Binah"); tag = h.get("tagline", ["Embarking on an endless journey", "through infinite worlds."])
    b.append(f'<rect y="{TB}" width="{W}" height="400" fill="url(#glowH)" class="breathe"/>')
    b.append(s.t(px, top + 48, "~/binah", "mono", 15, MUTED))
    b.append(s.t(px + text_width("mono", "~/binah ", 15), top + 48, "$", "mono", 15, AMBER))
    b.append(s.t(px + text_width("mono", "~/binah $ ", 15), top + 48, "whoami", "mono", 15, INK))
    b.append(f'<rect x="{px + text_width("mono", "~/binah $ whoami ", 15):.1f}" y="{top + 35}" width="9" height="17" fill="{AMBER}" class="blink"/>')
    b.append(s.t(px - 5, top + 152, name, "serif", 116, INK, ls=-1.5))
    nw = text_width("serif", name, 116) - len(name) * 1.5
    b.append(f'<circle cx="{px - 5 + nw + 14:.1f}" cy="{top + 144}" r="8" fill="{AMBER}" filter="url(#bloom)"/>')
    for i, line in enumerate(tag[:2]):
        b.append(s.t(px, top + 198 + i * 31, line, "serifi", 25, SOFT))
    x = px
    for i, tg in enumerate(h.get("tags", ["algorithms", "product", "local-first"])):
        if i:
            b.append(s.t(x + 7, top + 268, "/", "mono", 13, AMBER)); x += 26
        b.append(s.t(x, top + 268, tg, "mono", 13, MUTED, ls=.6)); x += text_width("mono", tg, 13) + len(tg) * .6

    X0, X1, Y0, Y1 = 500, 728, top + 28, top + 262
    b.append("".join(f'<line x1="{gx}" y1="{Y0}" x2="{gx}" y2="{Y1}" stroke="#fff" stroke-opacity=".045"/>' for gx in range(X0, X1 + 1, 38)))
    trunk = top + 176
    lines = [("β", "1.130205", top + 52, 580, False), ("SG", "1.048596", top + 104, 640, True),
             ("α", "0.571024", top + 156, 606, False), ("α", "0.456903", top + 214, 566, False),
             ("α", "0.409431", top + 250, 536, False)]
    rnd = random.Random(1048596); built = []
    for li, (sym, val, ey, dx, hi) in enumerate(lines):
        pts = []
        for x in range(X0, X1 + 1, 3):
            if x <= dx: y = trunk
            else:
                u = (x - dx) / (X1 - dx)
                y = (trunk + (ey - trunk) * smooth(u * 1.3)
                     + math.sin(x * .12 + li) * .9 * min(1, (x - dx) / 50) + rnd.uniform(-.4, .4))
            pts.append((x, y))
        built.append(("M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts), sym, val, ey, dx, hi, li))
    for d, sym, val, ey, dx, hi, li in built:
        if hi: continue
        b.append(f'<path d="{d}" pathLength="1" class="draw in" style="animation-delay:{.2 + li * .12:.2f}s" fill="none" stroke="#b6bcc6" stroke-opacity=".55" stroke-width="1.4"/>')
        b.append(f'<g class="fade" style="animation-delay:{1.4 + li * .1:.2f}s"><circle cx="{X1}" cy="{ey:.1f}" r="2.6" fill="#b6bcc6"/>'
                 + s.t(X1 + 14, ey + 4.5, sym, "mono", 13, MUTED) + s.t(X1 + 34, ey + 4.5, val, "mono", 13, MUTED) + "</g>")
    for d, sym, val, ey, dx, hi, li in built:
        if not hi: continue
        b.append(f'<path d="{d}" fill="none" stroke="{EMBER}" stroke-width="9" stroke-opacity=".3" filter="url(#soft)" pathLength="1" class="draw in" style="animation-delay:.7s"/>')
        b.append(f'<path id="sg" d="{d}" pathLength="1" class="draw in" style="animation-delay:.7s" fill="none" stroke="{AMBER}" stroke-width="2.4" stroke-linecap="round"/>')
        b.append(f'<circle cx="{dx}" cy="{trunk}" r="4" fill="{BG}" stroke="{AMBER}" stroke-width="2" class="fade" style="animation-delay:.8s"/>')
        b.append(f'<g class="fade" style="animation-delay:2.2s"><circle cx="{X1}" cy="{ey:.1f}" r="4.5" fill="{AMBER}" filter="url(#bloom)"/>'
                 + s.t(X1 + 14, ey + 5, "SG", "monomed", 14, AMBER) + s.t(X1 + 38, ey + 5, val, "monomed", 14, AMBER, extra=' filter="url(#bloom)"')
                 + s.t(X1 + 14, ey + 25, "steins gate", "mono", 11.5, MUTED, ls=.6) + "</g>")
        b.append(f'<g opacity="0"><animate attributeName="opacity" values="0;1" begin="2.8s" dur=".6s" fill="freeze"/>'
                 f'<circle r="11" fill="{EMBER}" opacity=".45" filter="url(#soft)"><animateMotion dur="5.5s" begin="2.8s" repeatCount="indefinite"><mpath href="#sg"/></animateMotion></circle>'
                 f'<circle r="3" fill="#fff6e4"><animateMotion dur="5.5s" begin="2.8s" repeatCount="indefinite"><mpath href="#sg"/></animateMotion></circle></g>')
    b.append(s.t(X0, trunk - 12, "t₀", "mono", 12, MUTED))


# ── stack: layered rows, grows with profile.json ─────────────────────────
CHIP_H, CHIP_GAP, ROW_GAP, LABEL_W = 40, 10, 22, 150


def chip_w(name):
    return 44 + text_width("mono", name, 14) + 16


def layout_stack():
    """Return [(layer, [(item, x, y_off)], row_height)] — pure geometry."""
    rows = []
    for layer in CONFIG["stack"]:
        x0 = CX + LABEL_W; x, line = x0, 0; placed = []
        for it in layer["items"]:
            w = chip_w(it["name"])
            if x + w > CR and x > x0:
                x, line = x0, line + 1
            placed.append((it, x, line * (CHIP_H + 8)))
            x += w + CHIP_GAP
        rows.append((layer, placed, (line + 1) * CHIP_H + line * 8))
    return rows


def stack_height(rows):
    return sum(h for _, _, h in rows) + ROW_GAP * (len(rows) - 1)


def stack(s, top, rows):
    b = s.body
    n = len(rows); per = 1.6; cyc = per * n + 1.2
    s.css.append(f".lit{{opacity:0;animation:lit {cyc:.1f}s ease-in-out infinite}}"
                 f"@keyframes lit{{0%{{opacity:0}}{4/cyc*100:.1f}%{{opacity:1}}{per/cyc*100:.1f}%{{opacity:1}}{(per+.8)/cyc*100:.1f}%{{opacity:0}}100%{{opacity:0}}}}")
    bus_x = CX + 5
    y = top; centers = []
    for k, (layer, placed, rh) in enumerate(rows):
        cy = y + CHIP_H / 2; centers.append(cy)
        # layer label on the bus
        b.append(f'<circle cx="{bus_x}" cy="{cy:.1f}" r="4.5" fill="{BG}" stroke="{AMBER}" stroke-width="1.6"/>')
        b.append(s.t(bus_x + 18, cy - 3, f"L{k + 1}", "mono", 10.5, AMBER, ls=.5))
        b.append(s.t(bus_x + 18, cy + 13, layer["layer"], "monomed", 13.5, INK))
        # row highlight that sweeps down the layers, request-style
        g = [f'<g class="lit" style="animation-delay:{k * per:.1f}s">'
             f'<rect x="{CX + LABEL_W - 10}" y="{y - 6:.1f}" width="{CR - CX - LABEL_W + 14}" height="{rh + 12:.1f}" rx="10" fill="url(#rowg)"/>']
        for it, x, yo in placed:
            g.append(f'<rect x="{x:.1f}" y="{y + yo:.1f}" width="{chip_w(it["name"]):.1f}" height="{CHIP_H}" rx="8" fill="none" stroke="{AMBER}" stroke-opacity=".75"/>')
        g.append(f'<circle cx="{bus_x}" cy="{cy:.1f}" r="4.5" fill="{AMBER}" filter="url(#bloom)"/></g>')
        b.append("".join(g))
        for it, x, yo in placed:
            w = chip_w(it["name"]); yy = y + yo
            b.append(f'<rect x="{x:.1f}" y="{yy:.1f}" width="{w:.1f}" height="{CHIP_H}" rx="8" fill="url(#tile)" stroke="{LINE2}"/>')
            d = icon_path(it.get("icon", ""))
            if d:
                b.append(f'<g transform="translate({x + 13:.1f} {yy + 10:.1f}) scale(.8333)"><path d="{d}" fill="{INK}"/></g>')
            else:
                b.append(f'<rect x="{x + 13:.1f}" y="{yy + 10:.1f}" width="20" height="20" rx="5" fill="none" stroke="{INK}" stroke-width="1.3"/>'
                         + s.t(x + 23, yy + 24.5, it["name"][0].upper(), "monomed", 12, INK, "middle"))
            b.append(s.t(x + 44, yy + 25, it["name"], "mono", 14, SOFT))
        y += rh + ROW_GAP
        if k < n - 1:
            b.append(f'<line x1="{CX + LABEL_W - 10}" y1="{y - ROW_GAP / 2:.1f}" x2="{CR}" y2="{y - ROW_GAP / 2:.1f}" stroke="{LINE}" stroke-dasharray="2 5"/>')
    if n > 1:
        b.append(f'<line x1="{bus_x}" y1="{centers[0]:.1f}" x2="{bus_x}" y2="{centers[-1]:.1f}" stroke="{AMBER}" stroke-opacity=".35" stroke-width="1.2"/>')
        # packet travelling down the bus in step with the highlight
        kt = []; vals = []
        for k, c in enumerate(centers):
            kt += [k * per / cyc, (k * per + .25) / cyc]; vals += [c, c]
        kt += [1.0]; vals += [centers[0]]
        kt = [min(1.0, max(0.0, v)) for v in kt]
        b.append(f'<circle cx="{bus_x}" cy="0" r="2.4" fill="#fff4dc"><animate attributeName="cy" values="{";".join(f"{v:.1f}" for v in vals)}" '
                 f'keyTimes="{";".join(f"{v:.3f}" for v in kt)}" dur="{cyc:.1f}s" repeatCount="indefinite"/></circle>')
    return top + stack_height(rows)


# ── trace: Dijkstra drawn in light ───────────────────────────────────────
def trace(s, top, height, T=12.0):
    b = s.body
    rnd = random.Random(1048); pts, tries = [], 0
    while tries < 20000 and len(pts) < 60:
        tries += 1
        p = (rnd.uniform(CX + 24, CR - 24), rnd.uniform(top + 28, top + height - 18))
        if all((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 > 66 ** 2 for q in pts): pts.append(p)
    n = len(pts)
    dd = lambda a, c: math.hypot(pts[a][0] - pts[c][0], pts[a][1] - pts[c][1])
    edges = set()
    for i in range(n):
        for d, j in sorted((dd(i, j), j) for j in range(n) if j != i)[:4]:
            if d < 118: edges.add((min(i, j), max(i, j)))
    adj = {i: [] for i in range(n)}
    for a, c in edges: adj[a].append((c, dd(a, c))); adj[c].append((a, dd(a, c)))
    mid = top + height / 2
    src = min(range(n), key=lambda i: pts[i][0] + abs(pts[i][1] - mid) * 1.5)
    dst = max(range(n), key=lambda i: pts[i][0] - abs(pts[i][1] - mid) * 1.5)
    while True:
        seen, st = {src}, [src]
        while st:
            u = st.pop()
            for v, _ in adj[u]:
                if v not in seen: seen.add(v); st.append(v)
        if len(seen) == n: break
        d, a, c = min((dd(a, c), a, c) for a in seen for c in range(n) if c not in seen)
        edges.add((min(a, c), max(a, c))); adj[a].append((c, d)); adj[c].append((a, d))
    D = {i: math.inf for i in range(n)}; D[src] = 0; par = {src: None}; pq = [(0, src)]; order = []
    while pq:
        d, u = heapq.heappop(pq)
        if d > D[u]: continue
        order.append(u)
        for v, w in adj[u]:
            if d + w < D[v]: D[v] = d + w; par[v] = u; heapq.heappush(pq, (D[v], v))
    maxd = max(D.values()); tv = {i: .5 + 5.0 * D[i] / maxd for i in range(n)}
    path = [dst]
    while par[path[-1]] is not None: path.append(par[path[-1]])
    path.reverse()
    P0, P1, HOLD, OFF = 5.9, 7.3, 11.0, 11.7
    pc = lambda t: f"{max(0, min(100, t / T * 100)):.2f}%"
    css = []
    s.defs.append(f'<clipPath id="plot"><rect x="{CX}" y="{top}" width="{CW}" height="{height}"/></clipPath>')
    b.append(f'<rect x="{CX}" y="{top}" width="{CW}" height="{height}" rx="10" fill="url(#glowT)"/>')
    b.append("<g>" + "".join(f'<line x1="{pts[a][0]:.1f}" y1="{pts[a][1]:.1f}" x2="{pts[c][0]:.1f}" y2="{pts[c][1]:.1f}" '
                             f'stroke="#c9ced8" stroke-opacity=".16" stroke-width="1.2"/>' for a, c in sorted(edges)) + "</g>")
    sx, sy = pts[src]
    css.append(f".ring{{transform-origin:{sx:.1f}px {sy:.1f}px;animation:ring {T}s linear infinite}}"
               f"@keyframes ring{{0%{{transform:scale(0);opacity:0}}{pc(.5)}{{transform:scale(0);opacity:.7}}"
               f"{pc(5.5)}{{transform:scale({maxd:.0f});opacity:.25}}{pc(5.9)}{{transform:scale({maxd * 1.03:.0f});opacity:0}}100%{{opacity:0}}}}")
    b.append(f'<g clip-path="url(#plot)"><circle class="ring" cx="{sx:.1f}" cy="{sy:.1f}" r="1" fill="none" stroke="{AMBER}" stroke-width="1.4" vector-effect="non-scaling-stroke"/></g>')
    for k, v in enumerate(order[1:]):
        u = par[v]
        css.append(f".e{k}{{animation:e{k} {T}s linear infinite}}@keyframes e{k}{{0%,{pc(tv[u])}{{stroke-dashoffset:1;opacity:1}}"
                   f"{pc(tv[v])}{{stroke-dashoffset:0}}{pc(HOLD)}{{stroke-dashoffset:0;opacity:1}}{pc(OFF)}{{stroke-dashoffset:0;opacity:0}}100%{{stroke-dashoffset:1;opacity:0}}}}")
        b.append(f'<path class="draw e{k}" pathLength="1" d="M{pts[u][0]:.1f} {pts[u][1]:.1f} L{pts[v][0]:.1f} {pts[v][1]:.1f}" '
                 f'stroke="{AMBER2}" stroke-opacity=".75" stroke-width="1.7" stroke-linecap="round"/>')
    pd = "M" + " L".join(f"{pts[i][0]:.1f} {pts[i][1]:.1f}" for i in path)
    css.append(f".fp{{animation:fp {T}s cubic-bezier(.6,0,.3,1) infinite}}@keyframes fp{{0%,{pc(P0)}{{stroke-dashoffset:1;opacity:1}}{pc(P1)}{{stroke-dashoffset:0}}"
               f"{pc(HOLD)}{{stroke-dashoffset:0;opacity:1}}{pc(OFF)}{{stroke-dashoffset:0;opacity:0}}100%{{stroke-dashoffset:1;opacity:0}}}}")
    b.append(f'<path class="draw fp" pathLength="1" d="{pd}" fill="none" stroke="{EMBER}" stroke-width="12" stroke-opacity=".3" stroke-linejoin="round" stroke-linecap="round" filter="url(#bloom)"/>')
    b.append(f'<path class="draw fp" pathLength="1" d="{pd}" fill="none" stroke="#ffc98a" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/>')
    for i in range(n):
        x, y = pts[i]; t = tv[i]
        css.append(f".n{i}{{animation:n{i} {T}s linear infinite}}@keyframes n{i}{{0%,{pc(t - .02)}{{fill:#14151a;stroke:#6b717c}}"
                   f"{pc(t)}{{fill:#fff3dc;stroke:{AMBER}}}{pc(t + .8)}{{fill:#3a2412;stroke:{AMBER2}}}{pc(HOLD)}{{fill:#3a2412;stroke:{AMBER2}}}"
                   f"{pc(OFF)},100%{{fill:#14151a;stroke:#6b717c}}}}"
                   f".h{i}{{transform-box:fill-box;transform-origin:center;animation:h{i} {T}s ease-out infinite}}"
                   f"@keyframes h{i}{{0%,{pc(t - .01)}{{opacity:0;transform:scale(.3)}}{pc(t + .04)}{{opacity:.9;transform:scale(.5)}}"
                   f"{pc(t + 1.2)}{{opacity:0;transform:scale(1.8)}}100%{{opacity:0;transform:scale(1.8)}}}}")
        b.append(f'<circle class="h{i}" cx="{x:.1f}" cy="{y:.1f}" r="18" fill="url(#halo)" opacity="0"/>')
        b.append(f'<circle class="n{i}" cx="{x:.1f}" cy="{y:.1f}" r="5" fill="#14151a" stroke="#6b717c" stroke-width="1.6"/>')
    plen = sum(dd(path[k], path[k + 1]) for k in range(len(path) - 1)); acc = 0
    for k, i in enumerate(path):
        if k: acc += dd(path[k - 1], i)
        t = P0 + (P1 - P0) * acc / plen
        css.append(f".p{k}{{animation:p{k} {T}s linear infinite}}@keyframes p{k}{{0%,{pc(t - .02)}{{opacity:0}}{pc(t + .05)}{{opacity:1}}{pc(HOLD)}{{opacity:1}}{pc(OFF)},100%{{opacity:0}}}}")
        b.append(f'<circle class="p p{k}" cx="{pts[i][0]:.1f}" cy="{pts[i][1]:.1f}" r="5.5" fill="#fff3dc" stroke="{AMBER}" stroke-width="2" filter="url(#bloom)" opacity="0"/>')
    for i, lab in ((src, "s"), (dst, "t")):
        x, y = pts[i]
        b.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="11" fill="none" stroke="{AMBER}" stroke-width="1.4"/>')
        b.append(s.t(x, y - 19, lab, "monomed", 16, AMBER, "middle"))
    by = top + height + 14
    b.append(f'<line x1="{CX}" y1="{by}" x2="{CR}" y2="{by}" stroke="{LINE}"/>')
    css.append(f".bar{{transform-origin:{CX}px 0;animation:bar {T}s linear infinite}}@keyframes bar{{0%,{pc(.5)}{{transform:scaleX(0);opacity:1}}"
               f"{pc(5.5)}{{transform:scaleX(1)}}{pc(HOLD)}{{transform:scaleX(1);opacity:1}}{pc(OFF)},100%{{transform:scaleX(1);opacity:0}}}}")
    b.append(f'<rect class="bar" x="{CX}" y="{by - 1}" width="{CW}" height="2.5" fill="{AMBER}"/>')
    b.append(s.t(CX, by + 26, "dijkstra(G, s)  ·  O((V + E) log V)", "mono", 13, MUTED))
    b.append(s.t(CR, by + 26, "dist(s, t) = 1.048596", "mono", 13, SOFT, "end"))
    s.css.append("\n".join(css))
    return n, len(edges)


# ── assemble ─────────────────────────────────────────────────────────────
TRACE_H = 250


def panel():
    rows = layout_stack()
    d1 = TB + HERO_H + 34
    st_top = d1 + 34
    d2 = st_top + stack_height(rows) + 48
    tr_top = d2 + 24
    H = tr_top + TRACE_H + 14 + 26 + 30 + SBH
    names = ", ".join(it["name"] for l in CONFIG["stack"] for it in l["items"])
    s = Svg(W, H, CONFIG.get("hero", {}).get("name", "Binah"),
            "Embarking on an endless journey through infinite worlds. A world-line diagram converging on 1.048596; "
            f"stack: {names}; an animated Dijkstra trace.")
    s.css.append(COMMON_CSS + """
.draw{stroke-dasharray:1;stroke-dashoffset:1}
.in{animation:draw 2.4s cubic-bezier(.6,0,.2,1) forwards}@keyframes draw{to{stroke-dashoffset:0}}
.fade{opacity:0;animation:fade 1s ease forwards}@keyframes fade{to{opacity:1}}
.breathe{animation:breathe 6s ease-in-out infinite}@keyframes breathe{0%,100%{opacity:.6}50%{opacity:1}}
""")
    s.reduced = ".draw{stroke-dashoffset:0}.fade{opacity:1}.p{opacity:1}.bar{transform:none}"
    s.defs += COMMON_DEFS + [
        f'<radialGradient id="glowH" cx="74%" cy="30%" r="45%"><stop offset="0" stop-color="{EMBER}" stop-opacity=".22"/><stop offset=".5" stop-color="{EMBER}" stop-opacity=".05"/><stop offset="1" stop-color="{EMBER}" stop-opacity="0"/></radialGradient>',
        f'<radialGradient id="glowT" cx="50%" cy="55%" r="60%"><stop offset="0" stop-color="{EMBER}" stop-opacity=".08"/><stop offset="1" stop-color="{EMBER}" stop-opacity="0"/></radialGradient>',
        f'<radialGradient id="halo"><stop offset="0" stop-color="{AMBER}" stop-opacity=".95"/><stop offset="1" stop-color="{EMBER}" stop-opacity="0"/></radialGradient>',
        '<linearGradient id="tile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#17181d"/><stop offset="1" stop-color="#101115"/></linearGradient>',
        f'<linearGradient id="rowg" x1="0" x2="1"><stop offset="0" stop-color="{EMBER}" stop-opacity=".14"/><stop offset="1" stop-color="{EMBER}" stop-opacity="0"/></linearGradient>',
        f'<linearGradient id="curg" x1="0" x2="1"><stop offset="0" stop-color="{AMBER}" stop-opacity=".10"/><stop offset=".5" stop-color="{AMBER}" stop-opacity=".03"/><stop offset="1" stop-color="{AMBER}" stop-opacity="0"/></linearGradient>',
    ]
    hero(s, TB)
    divider(s, d1, "01", "stack", CONFIG.get("stack_caption", "layer by layer"))
    stack(s, st_top, rows)
    divider(s, d2, "02", "trace", "shortest paths, drawn in light")
    nV, nE = trace(s, tr_top, TRACE_H)
    SB = window(s, "readme.md", "online", f"|V| {nV}  |E| {nE}", "utf-8   LF   ln 1048, col 596")
    rws = gutter(s, SB, [d1, d2])
    s.last_line = len(rws)
    # reading cursor that pauses on a few lines
    picks = [rws[min(len(rws) - 1, int(len(rws) * f))] for f in (.08, .2, .38, .6, .82)]
    stops = sum(([p, p] for p in picks), []) + [picks[0]]
    kt = [0]; step = 1 / len(picks)
    for i in range(len(picks)):
        kt += [i * step + step * .72, (i + 1) * step] if i < len(picks) - 1 else [i * step + step * .72, 1]
    kt = kt[:len(stops)]
    s.body.append(f'<g><rect x="{GUT + 1}" y="0" width="{W - GUT}" height="22" fill="url(#curg)"/>'
                  f'<rect x="0" y="0" width="{GUT}" height="22" fill="{AMBER}" fill-opacity=".08"/>'
                  f'<animateTransform attributeName="transform" type="translate" values="{";".join(f"0 {v - 11}" for v in stops)}" '
                  f'keyTimes="{";".join(f"{v:.3f}" for v in kt)}" calcMode="spline" keySplines="{";".join([".7 0 .3 1"] * (len(kt) - 1))}" '
                  f'dur="24s" repeatCount="indefinite"/></g>')
    close(s)
    return s


def counter_frame(start=42):
    """Second window; the Vercel function drops its tubes in at <!--TUBES-->."""
    H = 430
    s = Svg(W, H, "World line", "Profile views on animated Nixie tubes. It's the choice of Steins Gate.")
    s.css.append(COMMON_CSS)
    s.defs += COMMON_DEFS + [f'<radialGradient id="glowC" cx="50%" cy="48%" r="50%"><stop offset="0" stop-color="{EMBER}" stop-opacity=".16"/><stop offset="1" stop-color="{EMBER}" stop-opacity="0"/></radialGradient>']
    s.body.append(f'<rect y="60" width="{W}" height="300" fill="url(#glowC)"/>')
    d = TB + 34
    divider(s, d, "03", "world line", "visitors, in nixie light")
    th = CW * 230 / 840
    s.body.append("<!--TUBES-->")
    s.body.append(s.t((CX + CR) / 2, d + 22 + th + 40, "It’s the choice of Steins Gate.", "serifi", 22, SOFT, "middle"))
    s.used["mono"].update("0123456789,")
    SB = window(s, "world_line.log", "live", "visitors {{COUNT}}", "divergence 1.048596%")
    gutter(s, SB, [d], start=start)
    close(s)
    return s, (CX, d + 22, CW, th)


def main():
    out = ROOT / "assets/profile"; out.mkdir(parents=True, exist_ok=True)
    p = panel(); data = p.render(); (out / "panel.svg").write_text(data)
    print(f"panel.svg            {len(data) / 1024:6.1f} KB")
    fr, box = counter_frame(p.last_line + 1); fdata = fr.render()
    (out / "counter-frame.preview.svg").write_text(fdata)
    js = ("// Generated by tools/build_profile.py — do not edit by hand.\n"
          f"module.exports = {{ svg: {json.dumps(fdata)}, box: {json.dumps(dict(zip(('x', 'y', 'width', 'height'), [round(v, 2) for v in box])))} }};\n")
    (ROOT / "api/_counter-frame.js").write_text(js)
    print(f"_counter-frame.js    {len(js) / 1024:6.1f} KB")


if __name__ == "__main__":
    main()

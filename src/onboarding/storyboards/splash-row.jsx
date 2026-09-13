// Splash — logo reveal. Static storyboard row + the live splash screen.
//
// Every variation is a pure function of one progress value `p` in [0, 1], exactly how the
// Compose splash runs (`AnimatedSplash.kt`: one `Animatable` → derived geometry). Picking a
// variation here therefore hands Compose a spec, not a mood board: port `render(p)` as-is.
//
// Rendered on the Splash board via:
//   <x-import component="SplashRow"    from="./storyboards/splash-row.jsx" active="{{ activeIdx }}" font="{{ font }}" on-select-frame="{{ selectFrame }}">
//   <x-import component="SplashScreen" from="./storyboards/splash-row.jsx" variant="{{ activeVariant }}" play-key="{{ playKey }}" font="{{ font }}">

/* ── Geometry shared with AnimatedSplash.kt (dp == px on the 402x874 canvas) ─────────── */
const SPLASH_LOGO_START = 158;   // logoStartSize
const SPLASH_LOGO_END = 100;     // logoEndSize
const SPLASH_PAD = 8;            // horizontal / vertical padding
const SPLASH_GAP = 16;           // spacerTargetWidth
const SPLASH_TEXT_PX = 54;       // 54.sp wordmark
const SPLASH_R_OUT = 24;         // radius.huge
const SPLASH_R_IN = SPLASH_R_OUT - 4;
const SPLASH_R_LOGO = SPLASH_R_IN - 4;
const SPLASH_LOGO_SRC = '../../images/logo.webp';
const SPLASH_WORDMARK = 'PAIGHAM';

/* Wordmark font choices. `system` is what Compose ships today: material3 `Text` with a bare
   `TextStyle(fontSize = 54.sp)` inherits `FontFamily.Default`, not a Noor face. */
const SPLASH_FONTS = {
  system: { label: 'System (as shipped)', css: '-apple-system, system-ui, "Segoe UI", Roboto, sans-serif', weight: 400, tracking: '0' },
  title:  { label: 'Fraunces (Noor title)', css: 'var(--font-title)', weight: 600, tracking: '0.01em' },
  body:   { label: 'Plus Jakarta (Noor body)', css: 'var(--font-body)', weight: 700, tracking: '0.04em' },
};

/* ── Easing — the Noor motion tokens as cubic-beziers, solved in JS ───────────────────── */
function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {           // Newton–Raphson, then bisection fallback
      const err = sx(t) - x;
      if (Math.abs(err) < 1e-5) return sy(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0, hi = 1; t = x;
    while (hi - lo > 1e-5) { t = (lo + hi) / 2; if (sx(t) < x) lo = t; else hi = t; }
    return sy(t);
  };
}
const EASE = {
  fastOutSlowIn: cubicBezier(0.4, 0, 0.2, 1),      // Compose FastOutSlowInEasing (current splash)
  out: cubicBezier(0.23, 1, 0.32, 1),              // --ease-out
  inOut: cubicBezier(0.77, 0, 0.175, 1),           // --ease-in-out
  spring: cubicBezier(0.34, 1.4, 0.64, 1),         // --ease-spring (overshoots, then settles)
  linear: (x) => x,
};

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
/* Sub-phase of the master progress: 0 before `from`, 1 after `to`, eased between. */
const phase = (p, from, to, ease = EASE.out) => ease(clamp01((p - from) / (to - from)));

/* ── Progress engine — rAF clock, one per mounted screen ─────────────────────────────── */
function useSplashProgress({ duration, hold, playKey, loop, loopGap = 900 }) {
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [p, setP] = React.useState(reduce ? 1 : 0);
  const [done, setDone] = React.useState(reduce);
  React.useEffect(() => {
    if (reduce) { setP(1); setDone(true); return undefined; }   // reduced motion: land at once
    let raf = 0, start = 0, cancelled = false;
    setP(0); setDone(false);
    const tick = (now) => {
      if (cancelled) return;
      if (!start) start = now;
      const t = now - start;
      if (t < duration) { setP(t / duration); raf = requestAnimationFrame(tick); return; }
      setP(1);
      if (t < duration + hold) { raf = requestAnimationFrame(tick); return; }
      setDone(true);
      if (loop && t >= duration + hold + loopGap) { start = now; setDone(false); }
      if (loop) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [playKey, loop, duration, hold, reduce]);
  return { p, done };
}

/* Measures the wordmark once per font so the pill can be sized like Compose's textMeasurer. */
function useWordmarkWidth(fontKey, sizePx) {
  // Webfonts (Fraunces / Plus Jakarta) may land after first paint; re-measure once they do.
  const [fontsTick, setFontsTick] = React.useState(0);
  React.useEffect(() => {
    let live = true;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (live) setFontsTick((t) => t + 1); });
    return () => { live = false; };
  }, []);
  return React.useMemo(() => {
    const f = SPLASH_FONTS[fontKey] || SPLASH_FONTS.system;
    const c = document.createElement('canvas').getContext('2d');
    const family = f.css.startsWith('var(')
      ? getComputedStyle(document.documentElement).getPropertyValue(f.css.slice(4, -1)).trim() || 'serif'
      : f.css;
    c.font = `${f.weight} ${sizePx}px ${family}`;
    const w = c.measureText(SPLASH_WORDMARK).width;
    const trackingEm = parseFloat(f.tracking) || 0;
    return Math.round(w + trackingEm * sizePx * (SPLASH_WORDMARK.length - 1));
  }, [fontKey, sizePx, fontsTick]);
}

/* ── Shared pieces ───────────────────────────────────────────────────────────────────── */
function LogoTile({ size, x, y, radius = SPLASH_R_LOGO, opacity = 1, scale = 1, style = {} }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: radius,
      background: 'var(--color-surface-primary)', opacity, transform: `scale(${scale})`,
      overflow: 'hidden', zIndex: 2, ...style,
    }}>
      <img src={SPLASH_LOGO_SRC} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}

function Wordmark({ font, sizePx = SPLASH_TEXT_PX, color, style = {}, children }) {
  const f = SPLASH_FONTS[font] || SPLASH_FONTS.system;
  return (
    <div style={{
      fontFamily: f.css, fontWeight: f.weight, fontSize: sizePx, lineHeight: 1, letterSpacing: f.tracking,
      color, whiteSpace: 'nowrap', ...style,
    }}>{children || SPLASH_WORDMARK}</div>
  );
}

/* ── Variations ──────────────────────────────────────────────────────────────────────── */
// Each: { id, name, icon, duration, hold, easingLabel, tagline, why, compose, render(p, ctx), backdrop?(p, ctx) }
// backdrop() returns styles for a full-canvas layer drawn behind the composition (full-bleed fills).
// ctx = { font, tw } where tw is the measured wordmark width. Geometry in the 402x874 canvas;
// the composition is centred by the caller, so render() returns a fixed-size block.

/* Today's sweep lockup as a function of the eased progress `pe` (AnimatedSplash.kt math). */
function sweepLockup(pe, { font, tw }) {
  const lp = clamp01(pe / 0.6);
  const fr = pe <= 0.6 ? 0 : clamp01((pe - 0.6) / 0.4);
  const logoSize = lerp(SPLASH_LOGO_START, SPLASH_LOGO_END, lp);
  const W = SPLASH_LOGO_END + SPLASH_PAD * 2 + SPLASH_GAP + tw;
  const contentW = W - SPLASH_PAD * 2;
  const H = logoSize + SPLASH_PAD * 2;
  const textStart = SPLASH_LOGO_END + SPLASH_GAP;               // outer coords, like Compose
  const logoX = ((contentW - SPLASH_LOGO_START) / 2) * (1 - lp);
  const fillRight = logoX + (textStart - logoX) * lp + (W - textStart) * fr;
  return (
    <div style={{ position: 'relative', width: W, height: H, borderRadius: SPLASH_R_OUT, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: logoX, width: Math.max(0, fillRight - logoX), background: 'var(--color-action-primary)' }} />
      <div style={{ position: 'absolute', inset: SPLASH_PAD, borderRadius: SPLASH_R_IN, overflow: 'hidden' }}>
        <Wordmark font={font} color="var(--color-surface-primary)"
          style={{ position: 'absolute', left: textStart, top: '50%', transform: 'translateY(-50%)' }} />
        <LogoTile size={logoSize} x={logoX} y={(H - SPLASH_PAD * 2 - logoSize) / 2} />
      </div>
    </div>
  );
}

/* ── Glow + Flood family ──────────────────────────────────────────────────────────────
   One builder, several knobs, so every variation below differs in exactly the way its
   caption says. Stacked lockup: tile centred, wordmark beneath; the glow behind the tile IS
   the flood (one radial gradient) and keeps growing until the screen is primary. */
const GF_TILE = 120, GF_BLOCK_H = 240, GF_TEXT_TOP = 148, GF_CX = 201, GF_CY = 377;
function glowFlood({
  id, name, icon = 'wb_sunny', duration, hold = 300, easingLabel, tagline, why, compose,
  glow = [0.0, 0.5],            // glow opacity ramp window
  flood = [0.15, 1],            // flood radius window
  tile = [0, 0.3],              // tile alpha/scale window
  tileEase = EASE.out, tileFrom = 0.92,
  text = [0.2, 0.9],            // wordmark window
  textMode = 'track',           // 'track' | 'rise' | 'letters'
  pulses = 0,                   // glow pulses before the flood commits
  inward = false,               // flood closes in from the edges instead of out from the tile
  floodEase = EASE.out,
  feather = 260,
  handoff = false,              // tile visible from frame one at the OS launch-image size, centred on screen
}) {
  const cy = handoff ? 437 : GF_CY;
  const far = Math.hypot(GF_CX, Math.max(cy, 874 - cy));
  const F = feather;
  // Progress at which the gradient's mid-stop crosses a point `dist` from the tile centre —
  // used to time the wordmark's colour cross-fade to the green actually reaching it.
  const greenAt = (dist) => {
    const rMid = inward ? (far + F - dist + F / 2) / (far + 2 * F) : (dist - F / 2) / (far + F);
    // invert the eased flood window (numeric — easings are monotonic)
    let lo = flood[0], hi = flood[1];
    for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (phase(m, flood[0], flood[1], floodEase) < rMid) lo = m; else hi = m; }
    return (lo + hi) / 2;
  };
  const textGreen = greenAt(GF_TEXT_TOP + 15 - GF_TILE / 2);
  return {
    id, name, icon, duration, hold, easingLabel, tagline, why, compose, feather,
    backdrop(p) {
      const r = phase(p, flood[0], flood[1], floodEase);
      if (inward) {
        const r1 = lerp(far + F, -F, r);
        return { background: `radial-gradient(circle ${far + 2 * F}px at ${GF_CX}px ${cy}px, transparent ${Math.max(0, r1)}px, var(--color-action-primary) ${Math.max(0, r1 + F)}px)` };
      }
      let g = phase(p, glow[0], glow[1]);
      if (pulses) g *= 0.7 + 0.3 * Math.sin(clamp01(p / flood[0]) * Math.PI * 2 * pulses - Math.PI / 2);
      const r1 = (far + F) * r;
      return { opacity: lerp(0.35 * g, 1, r), background: `radial-gradient(circle ${r1 + F}px at ${GF_CX}px ${cy}px, var(--color-action-primary) ${r1}px, transparent ${r1 + F}px)` };
    },
    render(p, { font }) {
      const t = phase(p, tile[0], tile[1], tileEase);
      const tx = phase(p, text[0], text[1]);
      const onGreen = phase(p, textGreen - 0.07, textGreen + 0.07, EASE.linear);
      const wmStyle = { position: 'absolute', left: 0, right: 0, top: GF_TEXT_TOP, textAlign: 'center' };
      const wm = (color, opacity) => {
        if (textMode === 'letters' || textMode === 'letters-in') {
          const letters = SPLASH_WORDMARK.split(''); const mid = (letters.length - 1) / 2;
          const fromEdges = textMode === 'letters-in';
          return (
            <div style={{ ...wmStyle, display: 'flex', justifyContent: 'center', opacity }}>
              {letters.map((ch, i) => {
                const order = fromEdges ? 1 - Math.abs(i - mid) / mid : Math.abs(i - mid) / mid;
                const s0 = text[0] + order * (text[1] - text[0]) * 0.55;
                const a = phase(p, s0, s0 + (text[1] - text[0]) * 0.45);
                // letters arriving from the edges drift inward; from the centre they lift
                const shift = fromEdges ? `translateX(${(1 - a) * 6 * Math.sign(i - mid)}px)` : `translateY(${(1 - a) * 8}px)`;
                return <Wordmark key={i} font={font} sizePx={30} color={color} style={{ opacity: a, letterSpacing: '0.12em', transform: shift }}>{ch}</Wordmark>;
              })}
            </div>
          );
        }
        if (textMode === 'rise') {
          return (
            <div style={{ ...wmStyle, top: GF_TILE, height: GF_TEXT_TOP - GF_TILE + 40, overflow: 'hidden', opacity }}>
              <Wordmark font={font} sizePx={30} color={color} style={{ marginTop: GF_TEXT_TOP - GF_TILE, letterSpacing: '0.12em', paddingLeft: '0.12em', transform: `translateY(${(1 - tx) * -44}px)`, opacity: tx }} />
            </div>
          );
        }
        const track = lerp(0.42, 0.12, tx);
        return <Wordmark font={font} sizePx={30} color={color} style={{ ...wmStyle, opacity: tx * opacity, letterSpacing: `${track}em`, paddingLeft: `${track}em` }} />;
      };
      // handoff: the block is the tile's height so the centred block puts the tile at screen centre;
      // the wordmark hangs below it (the block is not clipped).
      return (
        <div style={{ position: 'relative', width: 402, height: handoff ? GF_TILE : GF_BLOCK_H }}>
          <div style={{ position: 'relative', width: GF_TILE, height: GF_TILE, margin: '0 auto' }}>
            <LogoTile size={GF_TILE} x={0} y={0} radius={SPLASH_R_OUT} opacity={handoff ? 1 : Math.min(1, phase(p, tile[0], tile[0] + 0.2))} scale={lerp(tileFrom, 1, t)} />
          </div>
          {wm('var(--color-info-primary)', 1 - onGreen)}
          {wm('var(--color-surface-primary)', onGreen)}
        </div>
      );
    },
  };
}

const GLOW_FLOOD_FAMILY = [
  glowFlood({
    id: 'glow-flood', name: 'Glow + Flood', duration: 1300, hold: 300,
    easingLabel: 'ease-out · glow becomes the flood · 1.3 s',
    tagline: 'The pick, tightened: the glow behind the tile keeps growing until it is the whole screen while the wordmark condenses into place. 1.3 s instead of 1.9 s.',
    why: 'Same choreography as before with every window pulled in — the tile lands in the first 25 %, the flood commits at 12 % and the wordmark settles by 80 %, so the hold starts sooner.',
    compose: 'One Animatable, 1300 ms. Full-size drawBehind radialGradient centred on the tile: alpha lerp(0.35·glow, 1, flood), inner stop tween(ease-out) 0 → far corner, 260 dp feather. Column lockup: tile alpha/scale 0–25 %; wordmark letterSpacing 0.42em → 0.12em over 15–80 %, colour cross-faded on the same progress.',
    glow: [0, 0.4], flood: [0.12, 1], tile: [0, 0.25], text: [0.15, 0.8],
  }),
  glowFlood({
    id: 'gf-pulse', name: 'Pulse', duration: 1500, hold: 300,
    easingLabel: 'two soft pulses · then the flood',
    tagline: 'The glow breathes twice behind the tile — a heartbeat — before it commits and floods the screen.',
    why: 'Adds intent to the pause: the light is alive before it spreads. Two pulses is the most the 1.5 s allows without feeling like a loader.',
    compose: 'Same as Glow + Flood; glow alpha multiplied by 0.7 + 0.3·sin(2π·2·p/floodStart − π/2) before the flood window opens at 45 %.',
    glow: [0, 0.3], flood: [0.45, 1], tile: [0, 0.25], text: [0.35, 0.9], pulses: 2,
  }),
  glowFlood({
    id: 'gf-rise', name: 'Rise', duration: 1300, hold: 300,
    easingLabel: 'ease-out · wordmark rises from behind the tile',
    tagline: 'Same flood, but the wordmark slides up from behind the tile instead of condensing — it is revealed, not faded.',
    why: 'Gives the wordmark a spatial origin (the mark) so the two read as one object; the clip edge is the tile’s own bottom edge, so nothing extra is on screen.',
    compose: 'Same backdrop. Wordmark inside a Box clipped below the tile; offset y tween −44 dp → 0 with alpha, 15–80 %.',
    glow: [0, 0.4], flood: [0.12, 1], tile: [0, 0.25], text: [0.15, 0.8], textMode: 'rise',
  }),
  glowFlood({
    id: 'gf-letters', name: 'Letters', duration: 1400, hold: 300,
    easingLabel: 'ease-out · letters light from the centre out',
    tagline: 'Same flood; the letters light up from the middle outwards, in step with the green spreading past them.',
    why: 'Ties the type to the flood’s own direction — the reveal has one cause, the spreading light.',
    compose: 'Same backdrop. Per-letter alpha + 8 dp offset, start staggered by |i − mid| / mid across the first 55 % of the text window, each over the remaining 45 %.',
    glow: [0, 0.4], flood: [0.12, 1], tile: [0, 0.25], text: [0.2, 0.85], textMode: 'letters',
  }),
  glowFlood({
    id: 'gf-spring', name: 'Spring', duration: 1300, hold: 300,
    easingLabel: 'spring tile · flood chases it',
    tagline: 'The tile springs in from small with a slight overshoot and the flood chases it outward; wordmark condenses as before.',
    why: 'Puts the energy in the mark itself. Uses the Noor spring tokens, so it matches how the Fab and sheets settle elsewhere in the app.',
    compose: 'Same backdrop, flood from 18 %. Tile scale spring(springDamping, springStiffness) 0.6 → 1 with alpha over the first 35 %.',
    glow: [0, 0.4], flood: [0.18, 1], tile: [0, 0.35], tileEase: EASE.spring, tileFrom: 0.6, text: [0.2, 0.85],
  }),
  glowFlood({
    id: 'gf-gather', name: 'Gather', duration: 1700, hold: 350,
    easingLabel: 'FastOutSlowIn gather · letters arrive from the edges · 1.7 s',
    tagline: 'Refined: the green gathers in from the edges on a smooth in-out curve, the letters arrive from the outside in with it, and the tile settles as the light lands on it.',
    why: 'Everything now moves in the same direction — inward. The flood starts gently from the corners and lands gently on the mark (no abrupt start at the bezel), a 320 dp feather keeps the closing hole soft, the tile eases from 1.06× down to 1 so the arrival has weight, and the wordmark turns surface-coloured at the exact moment the green reaches it.',
    compose: 'One Animatable, 1700 ms. Full-size drawBehind radialGradient centred on the tile, stops (transparent at r1, primary at r1 + 320 dp), r1 = lerp(far + F, −F, FastOutSlowIn(window 8–100 %)). Tile: alpha 8–28 %, scale 1.06 → 1 ease-out 30–95 %. Letters: per-letter alpha + 6 dp inward drift, staggered from the outer letters to the centre over 30–90 %. Wordmark colour cross-fades ±7 % around the frame where the gradient mid-stop crosses it.',
    flood: [0.08, 1], floodEase: EASE.fastOutSlowIn, feather: 320,
    tile: [0.08, 0.95], tileFrom: 1.06, text: [0.3, 0.9], textMode: 'letters-in', inward: true,
  }),
  glowFlood({
    id: 'gf-gather-quiet', name: 'Gather · Quiet', duration: 1900, hold: 350,
    easingLabel: 'FastOutSlowIn gather · wordmark condenses · 1.9 s',
    tagline: 'CHOSEN 2026-09-08, ported to Compose (AnimatedSplash.kt). The refined gather, slower, with the wordmark condensing from wide tracking; the tile is already on screen when Compose starts.',
    why: 'The OS launch image is part of the choreography: Android 12+ centres the launcher icon (≈131 dp) and iOS centres the 120 pt LaunchLogo asset, both on the surface colour. So the tile sits at the exact screen centre from frame one, at the size the OS drew it, and settles to 120 dp as the light lands — no fade-in to replay. This frame shows the Android start size; iOS starts at 1×.',
    compose: 'As Gather, 1900 ms; tile alpha 1 from the first frame, scale SplashHandoff.tileScaleStart → 1 (Android 131/120, iOS 1) ease-out 8–95 %; wordmark letterSpacing 0.42em → 0.12em with alpha over 30–90 %.',
    flood: [0.08, 1], floodEase: EASE.fastOutSlowIn, feather: 320,
    tile: [0.08, 0.95], tileFrom: 131 / 120, text: [0.3, 0.9], inward: true, handoff: true,
  }),
];

const SPLASH_VARIANTS = [
  {
    id: 'current', name: 'Current', icon: 'play_arrow', duration: 1800, hold: 300,
    easingLabel: 'FastOutSlowIn · one tween',
    tagline: 'What the app ships today: the tile shrinks and slides left while a primary sweep reveals the wordmark.',
    why: 'Faithful port of AnimatedSplash.kt — logo phase is the first 60 % of one eased tween, the fill finishes in the remaining 40 %.',
    compose: 'No change. Reference for the others.',
    render(p, { font, tw }) {
      return sweepLockup(EASE.fastOutSlowIn(p), { font, tw });
    },
  },
  {
    id: 'sweep-flood', name: 'Sweep + Flood', icon: 'auto_awesome', duration: 1900, hold: 400,
    easingLabel: 'FastOutSlowIn sweep · ease-out feathered flood, together',
    tagline: 'Current and Flood at the same time: while the tile slides and the sweep reveals the wordmark, the pill’s green is already flooding out with a soft edge.',
    why: 'Both motions share one clock, so the pill never sits finished on a dark screen — its outline dissolves into the flood as it forms. No sharp edge anywhere at any frame.',
    compose: 'One Animatable. Lockup: today’s AnimatedSplash math on FastOutSlowIn(p). Full-size drawBehind from 8 %: Brush.radialGradient centred on the pill, inner stop tween(ease-out) 0 → far corner, 260 dp feather, alpha ramps in over its first quarter.',
    feather: 260,
    backdrop(p) {
      const r = phase(p, 0.08, 1);
      const cx = 201, cy = 437;
      const far = Math.hypot(cx, cy);
      const F = this.feather;
      const r1 = (far + F) * r;
      return { opacity: Math.min(1, r * 4), background: `radial-gradient(circle ${r1 + F}px at ${cx}px ${cy}px, var(--color-action-primary) ${r1}px, transparent ${r1 + F}px)` };
    },
    render(p, ctx) {
      return sweepLockup(EASE.fastOutSlowIn(p), ctx);
    },
  },
  {
    id: 'flood', name: 'Flood', icon: 'auto_awesome', duration: 1700, hold: 400,
    easingLabel: 'ease-out · feathered radial',
    tagline: 'The same primary green, but it keeps going: it floods out of the tile with a soft, feathered edge until the whole screen is green.',
    why: 'No sharp boundary anywhere — the fill is a radial gradient whose inner radius grows past the far corner, with a 260 dp feather. The wordmark is surface-coloured, so it surfaces gently as the flood passes rather than being cut by an edge.',
    compose: 'Full-size drawBehind: Brush.radialGradient(0f→primary, r1/(r1+F)→primary, 1f→transparent, center = tile centre, radius = r1 + F), r1 = tween(ease-out) 0 → distance to far corner. Row lockup static; tile alpha/scale tween 0–30 %.',
    feather: 260,
    lockupW({ tw }) { return SPLASH_LOGO_END + SPLASH_GAP + tw; },
    backdrop(p, { tw, scale }) {
      const r = phase(p, 0.18, 1);
      const W = this.lockupW({ tw }) * scale;
      const cx = 201 - W / 2 + (SPLASH_LOGO_END / 2) * scale, cy = 437;
      const far = Math.hypot(Math.max(cx, 402 - cx), Math.max(cy, 874 - cy));
      const F = this.feather;
      const r1 = (far + F) * r;
      // Fade the layer in over the first part of the flood so the feather is not a visible halo at r1 = 0.
      return { opacity: Math.min(1, r * 4), background: `radial-gradient(circle ${r1 + F}px at ${cx}px ${cy}px, var(--color-action-primary) ${r1}px, transparent ${r1 + F}px)` };
    },
    render(p, { font, tw }) {
      const tile = phase(p, 0, 0.3);
      const W = this.lockupW({ tw });
      return (
        <div style={{ position: 'relative', width: W, height: SPLASH_LOGO_END }}>
          <Wordmark font={font} color="var(--color-surface-primary)"
            style={{ position: 'absolute', left: SPLASH_LOGO_END + SPLASH_GAP, top: '50%', transform: 'translateY(-50%)' }} />
          <LogoTile size={SPLASH_LOGO_END} x={0} y={0} opacity={tile} scale={lerp(0.8, 1, tile)} />
        </div>
      );
    },
  },
  {
    id: 'wash', name: 'Wash', icon: 'wb_sunny', duration: 1600, hold: 400,
    easingLabel: 'ease-out · feathered rise',
    tagline: 'Same idea, stacked: the green rises from the bottom of the screen as a soft wash and settles behind the tile and wordmark.',
    why: 'A vertical wash reads as dawn rather than a wipe; the 300 dp feather means there is never a line crossing the artwork. Ends full-bleed primary like Flood.',
    compose: 'Full-size drawBehind: Brush.verticalGradient(transparent at y1, primary at y1 + F) with y1 = tween(ease-out) (height + F) → −F. Column lockup static; tile alpha/scale tween 0–30 %.',
    feather: 300,
    backdrop(p) {
      const r = phase(p, 0.12, 1);
      const F = this.feather;
      const y1 = lerp(874 + F, -F, r);
      return { background: `linear-gradient(to bottom, transparent ${y1}px, var(--color-action-primary) ${y1 + F}px)` };
    },
    render(p, { font }) {
      const tile = phase(p, 0, 0.3);
      return (
        <div style={{ position: 'relative', width: 402, height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 120, height: 120 }}>
            <LogoTile size={120} x={0} y={0} radius={SPLASH_R_OUT} opacity={tile} scale={lerp(0.88, 1, tile)} />
          </div>
          <Wordmark font={font} sizePx={34} color="var(--color-surface-primary)" style={{ marginTop: 28, letterSpacing: '0.12em', paddingLeft: '0.12em' }} />
        </div>
      );
    },
  },
  {
    id: 'bloom', name: 'Bloom', icon: 'auto_awesome', duration: 1500, hold: 400,
    easingLabel: 'ease-out tile · spring pill',
    tagline: 'The tile lands first; the pill then blooms out of it on the spring and the wordmark fades in over the back half.',
    why: 'One element in motion (the Fab rule): the pill width is the only thing animating, the tile stays glued to its left edge and the group stays centred, so it never reads as three things happening.',
    compose: 'Tile: tween(ease-out) scale+alpha 0–35 %. Pill width: spring(springDamping, springStiffness) 116 → full; wordmark alpha 50–100 %.',
    render(p, { font, tw }) {
      const tile = phase(p, 0, 0.35);
      const grow = phase(p, 0.3, 1, EASE.spring);
      const text = phase(p, 0.5, 1);
      const H = SPLASH_LOGO_END + SPLASH_PAD * 2;
      const Wfull = SPLASH_LOGO_END + SPLASH_PAD * 2 + SPLASH_GAP + tw;
      const W = lerp(H, Wfull, grow);
      return (
        <div style={{ position: 'relative', width: Wfull, height: H }}>
          <div style={{
            position: 'absolute', top: 0, height: H, left: (Wfull - W) / 2, width: W,
            borderRadius: SPLASH_R_OUT, overflow: 'hidden', background: 'var(--color-action-primary)',
            opacity: tile,
          }}>
            <Wordmark font={font} color="var(--color-surface-primary)" style={{
              position: 'absolute', left: SPLASH_PAD + SPLASH_LOGO_END + SPLASH_GAP, top: '50%',
              transform: `translateY(-50%) translateX(${(1 - text) * 10}px)`, opacity: text,
            }} />
            <LogoTile size={SPLASH_LOGO_END} x={SPLASH_PAD} y={SPLASH_PAD} scale={lerp(0.7, 1, tile)} />
          </div>
        </div>
      );
    },
  },
  {
    id: 'iris', name: 'Iris', icon: 'light_mode', duration: 1500, hold: 400,
    easingLabel: 'ease-out · radial clip',
    tagline: 'Same final pill, but the primary fill opens as a circle from the tile — light spreading from the mark.',
    why: 'Keeps today’s end frame while replacing the mechanical left-to-right sweep with a reveal that starts where the eye already is; the wordmark surfaces along the circle’s edge.',
    compose: 'Static final layout; drawBehind fills a Path circle centred on the tile with radius tween(ease-out) 0 → pill diagonal, clipped by the pill shape.',
    render(p, { font, tw }) {
      const tile = phase(p, 0, 0.3);
      const r = phase(p, 0.15, 0.9);
      const W = SPLASH_LOGO_END + SPLASH_PAD * 2 + SPLASH_GAP + tw;
      const H = SPLASH_LOGO_END + SPLASH_PAD * 2;
      const cx = SPLASH_PAD + SPLASH_LOGO_END / 2, cy = H / 2;
      const radius = Math.hypot(W - cx, cy) * r;
      return (
        <div style={{ position: 'relative', width: W, height: H, borderRadius: SPLASH_R_OUT, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'var(--color-action-primary)', clipPath: `circle(${radius}px at ${cx}px ${cy}px)` }} />
          <Wordmark font={font} color="var(--color-surface-primary)"
            style={{ position: 'absolute', left: SPLASH_PAD + SPLASH_LOGO_END + SPLASH_GAP, top: '50%', transform: 'translateY(-50%)' }} />
          <LogoTile size={SPLASH_LOGO_END} x={SPLASH_PAD} y={SPLASH_PAD} opacity={tile} scale={lerp(0.7, 1, tile)} />
        </div>
      );
    },
  },
  {
    id: 'rise', name: 'Rise', icon: 'star', duration: 1600, hold: 400,
    easingLabel: 'ease-out · 45 ms letter stagger',
    tagline: 'Stacked composition: the tile settles, a thin primary rule draws out beneath it and the wordmark rises letter by letter.',
    why: 'Drops the pill for a quieter vertical lockup that fits narrow viewports without scaling; the rule is the only accent-coloured element, so the brand mark stays the hero.',
    compose: 'Column layout. Tile: tween scale 0.88 → 1. Rule: width tween 0 → 64 dp. Letters: per-index alpha + offset, each a 300 ms tween started 45 ms apart from one progress value.',
    render(p, { font }) {
      const tile = phase(p, 0, 0.4);
      const rule = phase(p, 0.28, 0.6);
      const letters = SPLASH_WORDMARK.split('');
      const stagger = 0.045, span = 0.3, first = 0.35;
      return (
        <div style={{ position: 'relative', width: 402, height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 120, height: 120 }}>
            <LogoTile size={120} x={0} y={0} radius={SPLASH_R_OUT} opacity={tile} scale={lerp(0.88, 1, tile)} />
          </div>
          <div style={{ marginTop: 22, height: 2, width: 64 * rule, borderRadius: 1, background: 'var(--color-action-primary)' }} />
          <div style={{ marginTop: 20, display: 'flex' }}>
            {letters.map((ch, i) => {
              const s = first + i * stagger;
              const a = phase(p, s, s + span);
              return (
                <Wordmark key={i} font={font} sizePx={34} color="var(--color-info-primary)"
                  style={{ opacity: a, transform: `translateY(${(1 - a) * 14}px)`, letterSpacing: '0.12em' }}>{ch}</Wordmark>
              );
            })}
          </div>
        </div>
      );
    },
  },
  {
    id: 'glow', name: 'Glow', icon: 'wb_sunny', duration: 1800, hold: 300,
    easingLabel: 'ease-out · tracking settles',
    tagline: 'Noor, literally: a soft primary glow breathes in behind the tile while the wordmark condenses from wide tracking into place.',
    why: 'The calmest option — nothing translates across the screen. Motion is light and letter-spacing only, which reads as the brand settling rather than arriving.',
    compose: 'Tile alpha/scale tween. Glow: drawBehind radial gradient, radius + alpha tween. Wordmark: letterSpacing tween 0.42em → 0.12em with alpha, on the same progress.',
    render(p, { font }) {
      const tile = phase(p, 0, 0.4);
      const glow = phase(p, 0.05, 0.75);
      const text = phase(p, 0.3, 0.95);
      return (
        <div style={{ position: 'relative', width: 402, height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%', width: 340, height: 340, marginLeft: -170, marginTop: -200,
            borderRadius: '50%', opacity: 0.32 * glow, transform: `scale(${lerp(0.55, 1.15, glow)})`,
            background: 'radial-gradient(circle, var(--color-action-primary) 0%, transparent 62%)',
          }} />
          <div style={{ position: 'relative', width: 120, height: 120, marginTop: -60 }}>
            <LogoTile size={120} x={0} y={0} radius={SPLASH_R_OUT} opacity={tile} scale={lerp(0.92, 1, tile)} />
          </div>
          <Wordmark font={font} sizePx={30} color="var(--color-info-primary)" style={{
            marginTop: 30, opacity: text, letterSpacing: `${lerp(0.42, 0.12, text)}em`,
            paddingLeft: `${lerp(0.42, 0.12, text)}em`,   // keeps optical centre while tracking changes
          }} />
        </div>
      );
    },
  },
  {
    id: 'slide', name: 'Slide', icon: 'replay', duration: 1400, hold: 400,
    easingLabel: 'ease-out · masked slide',
    tagline: 'Today’s choreography without the fill: the tile shifts left and the wordmark slides out from behind it, on the plain surface.',
    why: 'Minimal — the sweep was doing two jobs (colour and reveal); this keeps only the reveal, so the pill can go and the wordmark uses the text colour instead of white-on-primary.',
    compose: 'Row with offset { } reads: tile x from centre → 0, wordmark clipped by a Box whose start edge tracks the tile’s trailing edge; wordmark alpha 0 → 1 over the first third.',
    render(p, { font, tw }) {
      const s = phase(p, 0.1, 1);
      const a = phase(p, 0.2, 0.55);
      const W = SPLASH_LOGO_END + SPLASH_GAP + tw;
      const logoX = ((W - SPLASH_LOGO_END) / 2) * (1 - s);
      const revealLeft = logoX + SPLASH_LOGO_END;
      return (
        <div style={{ position: 'relative', width: W, height: SPLASH_LOGO_END }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: revealLeft, right: 0, overflow: 'hidden' }}>
            <Wordmark font={font} color="var(--color-info-primary)" style={{
              position: 'absolute', left: SPLASH_LOGO_END + SPLASH_GAP - revealLeft, top: '50%',
              transform: 'translateY(-50%)', opacity: a,
            }} />
          </div>
          <LogoTile size={SPLASH_LOGO_END} x={logoX} y={0} />
        </div>
      );
    },
  },
  ...GLOW_FLOOD_FAMILY,
];

/* ── The splash screen (full device canvas) ──────────────────────────────────────────── */
// Props: variant (object or id string), playKey (change → replay), font (SPLASH_FONTS key),
// loop (bool, storyboard frames), onFinished (live device: fires once the hold elapses).
function SplashScreen({ variant, playKey = 0, font = 'system', loop = false, onFinished }) {
  const v = typeof variant === 'string' ? SPLASH_VARIANTS.find((x) => x.id === variant) : variant;
  const def = v || SPLASH_VARIANTS[0];
  const tw = useWordmarkWidth(font, SPLASH_TEXT_PX);
  const { p, done } = useSplashProgress({ duration: def.duration, hold: def.hold, playKey: `${def.id}:${playKey}`, loop });
  React.useEffect(() => { if (done && !loop && onFinished) onFinished(); }, [done, loop, onFinished]);
  // Compose scales the whole composition uniformly to fit; the canvas is 402 wide with 24 dp margin.
  const naturalW = (['rise', 'glow', 'wash'].includes(def.id) || def.id.startsWith('g')) ? 402
    : def.lockupW ? def.lockupW({ tw }) : SPLASH_LOGO_END + SPLASH_PAD * 2 + SPLASH_GAP + tw;
  const scale = Math.min(1, (402 - 24) / naturalW);
  const ctx = { font, tw, scale };
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--color-surface-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {def.backdrop ? <div style={{ position: 'absolute', inset: 0, ...def.backdrop(p, ctx) }} /> : null}
      <div style={{ position: 'relative', transform: `scale(${scale})`, transformOrigin: 'center' }}>{def.render(p, ctx)}</div>
    </div>
  );
}

/* ── Storyboard row: one looping frame per variation ─────────────────────────────────── */
function SplashRow({ active = -1, font = 'system', onSelectFrame }) {
  return (
    <div>
      <div className="poc-row-label"><span className="mi" data-i="auto_awesome"></span> 00 · Splash — logo reveal · current + {SPLASH_VARIANTS.length - 1} variations · frames loop, tap one to run it on the device</div>
      <div className="poc-board">
        {SPLASH_VARIANTS.map((v, i) => {
          const ringClass = active === i ? 'is-active' : '';
          return (
            <div key={v.id} className="poc-board-item" onClick={() => onSelectFrame && onSelectFrame(i)}>
              <div className={`noor-frame ${ringClass}`} style={{ '--s': '0.46', cursor: onSelectFrame ? 'pointer' : 'default' }}>
                <div className="noor-frame-inner">
                  <div className="noor-screen">
                    <div className="noor-island"></div>
                    <SplashScreen variant={v} font={font} loop />
                    <div className="noor-home"></div>
                  </div>
                </div>
              </div>
              <div className="poc-frame-caption">{i} · {v.name} · {v.duration + v.hold} ms</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { SplashRow, SplashScreen, SPLASH_VARIANTS, SPLASH_FONTS });

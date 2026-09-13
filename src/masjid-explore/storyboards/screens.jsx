// Shared screen components for the Masjid Explore section board.
// Used by both the static storyboards (*-row.jsx) and the live interactive device
// (Explore Masjids.dc.html). Design-system tokens/components only; the map itself is
// treated as imagery, so its literal palette + on-imagery whites are DS-whitelisted.

// ── Nearby masjids (real-ish sample data, mirrors the reference maps) ──
const MASJIDS = [
  { letter: 'M', name: 'Madeena Musalla Attur', area: 'Yelahanka', pin: '560064', dist: '582m', prayer: 'Isha', azaan: '8:15 PM', iqama: '8:30 PM', pos: { left: '47%', top: '34%' } },
  { letter: 'N', name: 'Masjid Nurul Huda', area: 'Vidyaranyapura', pin: '560097', dist: '267m', prayer: 'Isha', azaan: '8:05 PM', iqama: '8:20 PM', pos: { left: '73%', top: '45%' } },
  { letter: 'G', name: 'Masjid E Gumbad', area: 'Chikkabettahalli', pin: '560002', dist: '839m', prayer: 'Isha', azaan: '8:12 PM', iqama: '8:28 PM', pos: { left: '61%', top: '25%' } },
  { letter: 'Q', name: 'Cubbonpet Masjid', area: 'Bengaluru', pin: '560002', dist: '757m', prayer: 'Isha', azaan: '8:08 PM', iqama: '8:24 PM', pos: { left: '40%', top: '52%' } },
  { letter: 'J', name: 'Jamia Masjid', area: 'Chikkabettahalli', pin: '560097', dist: '1.2km', prayer: 'Isha', azaan: '8:10 PM', iqama: '8:25 PM', pos: { left: '30%', top: '64%' } },
  { letter: 'B', name: 'Masjid E Bilal', area: 'Yelahanka New Town', pin: '560064', dist: '1.4km', prayer: 'Isha', azaan: '8:00 PM', iqama: '8:15 PM', pos: { left: '55%', top: '40%' } },
  { letter: 'W', name: 'Masjid E Wheel & Axle', area: 'Bengaluru', pin: '560064', dist: '2.0km', prayer: 'Isha', azaan: '8:08 PM', iqama: '8:23 PM', pos: { left: '34%', top: '29%' } },
];

const SHEET_H = 324; // px — the tallest rendered bottom sheet; the location control sits above it. 262 left it half hidden behind the sheet.
const NEARBY_COUNT = MASJIDS.length * 8 + 4; // headline count, shared by both views
const masjidCardTransitionName = (masjid) =>
  `masjid-card-${masjid.pin}-${masjid.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

// Page indices a windowed pager indicator shows — at most `maxVisible`, centred on the current
// page, sliding as it changes. Mirrors `pagerIndicatorWindow` in the Compose PagerIndicator.
function pagerIndicatorWindow(currentIdx, count, maxVisible = 5) {
  if (count <= 0) return [];
  if (count <= maxVisible) return Array.from({ length: count }, (_, i) => i);
  const start = Math.min(Math.max(currentIdx - Math.floor((maxVisible - 1) / 2), 0), count - maxVisible);
  return Array.from({ length: maxVisible }, (_, i) => start + i);
}

// Circular glass control that floats over the map imagery.
// Literal translucent white + white glyph are whitelisted (on-color over imagery).
function GlassBtn({ icon, onClick, ariaLabel }) {
  return (
    <button
      className="ib md"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        background: 'rgba(255,255,255,0.16)',
        border: '1px solid rgba(255,255,255,0.28)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.28)',
      }}
    >
      <span className="mi" style={{ color: '#fff' }} data-i={icon}></span>
    </button>
  );
}

// The map's one location control (MapLocationButton.kt). A full-size filled `.ib` rather than a
// glass control: it floats over map tiles that are usually LIGHT, where a translucent white
// circle with a white glyph is invisible — which is what users reported (2026-09-08).
// Three states, one place:
//   ready       — filled brand circle, `my_location`; tap recentres on the device fix.
//   locating    — same circle, the button-scale spinner replaces the glyph and taps are refused.
//   unavailable — card surface with a red `location_disabled`: permission is denied or location
//                 services are off. Tap requests permission or opens Settings — it never does
//                 nothing silently.
function LocateBtn({ state = 'ready', onClick, style }) {
  const unavailable = state === 'unavailable';
  const locating = state === 'locating';
  const label = unavailable ? 'Location unavailable. Tap to enable' : locating ? 'Finding your location' : 'My location';
  return (
    <button
      className={`ib ${unavailable ? 'ib-tonal' : 'ib-filled'}`}
      onClick={onClick}
      aria-label={label}
      aria-busy={locating || undefined}
      style={{
        ...(unavailable ? { background: 'var(--color-surface-card)', borderColor: 'var(--color-neutral-border)', boxShadow: '0 8px 20px -8px rgba(0,0,0,0.35)' } : null),
        ...(locating ? { cursor: 'progress' } : null),
        ...style,
      }}
    >
      {locating
        ? <span className="btn-spinner" style={{ width: 20, height: 20 }} />
        : <span className="mi" style={unavailable ? { color: 'var(--color-status-error)' } : null} data-i={unavailable ? 'location_disabled' : 'my_location'}></span>}
    </button>
  );
}

// Shared floating app bar (over map imagery) — same on the map and list views.
function ExploreAppBar({ onBack, onSearch, onQr }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 10, padding: '54px 16px 10px' }}>
      <GlassBtn icon="arrow_back" onClick={onBack} ariaLabel="Back" />
      <div className="ab-title" style={{ flex: 1, color: '#fff', fontSize: 24, textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>Explore Masjids</div>
      <GlassBtn icon="search" onClick={onSearch} ariaLabel="Search by pincode" />
      <GlassBtn icon="qr_code_scanner" onClick={onQr} ariaLabel="Scan QR" />
    </div>
  );
}

// Stylized dark map (imagery). Roads/water/parks are decorative data colors.
function MapCanvas({ masjids, selectedIdx, onSelectMasjid }) {
  return (
    // zIndex:0 makes this a stacking context so the pins' z-index stays contained
    // (they must sit BEHIND the list sheet in the list view, not bleed over it).
    <div style={{ position: 'absolute', inset: 0, background: '#1C2535', overflow: 'hidden', zIndex: 0 }}>
      <svg width="100%" height="100%" viewBox="0 0 402 874" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, opacity: 0.9 }}>
        {/* water body */}
        <path d="M -20 470 Q 120 400 250 470 T 460 460 L 460 620 Q 260 560 90 630 L -20 600 Z" fill="#16324f" />
        {/* parks */}
        <rect x="292" y="600" width="120" height="130" rx="10" fill="rgba(28,120,60,0.35)" />
        <rect x="20" y="150" width="70" height="60" rx="8" fill="rgba(28,120,60,0.28)" />
        {/* major roads */}
        <g stroke="#31415a" strokeWidth="13" strokeLinecap="round">
          <line x1="0" y1="300" x2="402" y2="330" />
          <line x1="210" y1="0" x2="180" y2="874" />
        </g>
        <g stroke="#28374d" strokeWidth="7" strokeLinecap="round">
          <line x1="70" y1="0" x2="90" y2="874" />
          <line x1="330" y1="0" x2="300" y2="874" />
          <line x1="0" y1="180" x2="402" y2="150" />
          <line x1="0" y1="640" x2="402" y2="690" />
          <line x1="0" y1="90" x2="300" y2="470" />
          <line x1="120" y1="0" x2="402" y2="520" />
        </g>
        <text x="215" y="322" fill="rgba(190,205,225,0.5)" fontSize="10" fontFamily="sans-serif" textAnchor="middle">1ST MAIN ROAD</text>
        <text x="28" y="380" fill="rgba(190,205,225,0.45)" fontSize="9" fontFamily="sans-serif" transform="rotate(-88,28,380)">BETTAHALLI ROAD</text>
        <text x="150" y="520" fill="rgba(190,205,225,0.45)" fontSize="9" fontFamily="sans-serif">YASWANTPUR ROAD</text>
        <text x="120" y="455" fill="rgba(120,170,215,0.75)" fontSize="10" fontFamily="sans-serif">Attur Lake</text>
      </svg>

      {/* user location */}
      <div style={{ position: 'absolute', left: '50%', top: '40%', transform: 'translate(-50%,-50%)', width: 16, height: 16, borderRadius: '50%', background: '#4A8AFF', border: '3px solid rgba(255,255,255,0.92)', boxShadow: '0 0 0 7px rgba(74,138,255,0.18)' }} />

      {/* masjid pins */}
      {masjids.map((m, i) => {
        const active = i === selectedIdx;
        const size = active ? 38 : 30;
        return (
          <div
            key={i}
            onClick={() => onSelectMasjid && onSelectMasjid(i)}
            style={{ position: 'absolute', left: m.pos.left, top: m.pos.top, transform: 'translate(-50%,-100%)', cursor: 'pointer', zIndex: active ? 6 : 5, transition: 'all 180ms' }}
          >
            <div style={{ width: size, height: size, borderRadius: '50% 50% 50% 0', background: active ? '#fff' : '#C9AD7B', transform: 'rotate(-45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: active ? '0 4px 14px rgba(0,0,0,0.45)' : '0 2px 8px rgba(0,0,0,0.4)' }}>
              <span className="mi fill" style={{ transform: 'rotate(45deg)', fontSize: active ? 20 : 16, color: active ? 'var(--color-action-primary)' : '#1A2030', fontVariationSettings: "'FILL' 1" }} data-i="mosque"></span>
            </div>
          </div>
        );
      })}

      {/* cluster badge (imagery decoration) */}
      <div style={{ position: 'absolute', left: '20%', top: '72%', transform: 'translate(-50%,-50%)', width: 30, height: 30, borderRadius: '50%', background: '#E05040', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 800 }}>2</div>
    </div>
  );
}

// A single masjid result card — DS .surf card + .btn / .ib components.
// `showFollow` hides the inline Follow chip (QR result uses a full-width CTA instead).
function MasjidCard({ m, following, onToggleFollow, onNavigate, showFollow = true, transitionName = 'none' }) {
  return (
    <div className="surf" style={{ borderRadius: 18, viewTransitionName: transitionName }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--color-action-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 800, color: 'var(--color-action-primary-inverse)' }}>{m.letter}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 800, color: 'var(--color-info-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-info-secondary)', marginTop: 1 }}>{m.area} · {m.pin} · {m.dist}</div>
        </div>
        {showFollow ? (
          <button className="btn btn-tonal sm" onClick={onToggleFollow} style={following ? { color: 'var(--color-action-primary)', borderColor: 'color-mix(in oklab, var(--color-action-primary) 30%, transparent)', background: 'color-mix(in oklab, var(--color-action-primary) 12%, transparent)' } : null}>
            {following ? <span className="mi" data-i="check" style={{ fontSize: 16 }}></span> : null}
            {following ? 'Following' : 'Follow'}
          </button>
        ) : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 800, color: 'var(--color-action-primary)' }}>{m.prayer}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-info-secondary)', marginTop: 1 }}>Azaan {m.azaan} · Iqama {m.iqama}</div>
        </div>
        <button className="ib ib-tonal primary md" onClick={onNavigate} aria-label="Directions">
          <span className="mi" data-i="near_me"></span>
        </button>
      </div>
    </div>
  );
}

// ── Map view: full-bleed map, floating app bar, bottom sheet with a masjid carousel ──
function ExploreMapScreen({
  masjids = MASJIDS,
  selectedIdx = 0,
  followed = {},
  guest = false, // guest browse mode (MasjidExplorerSheet.kt ExplorerMode.Guest)
  onSelectMasjid,
  onToggleFollow,
  onBack,
  onSearch,
  onQr,
  onOpenList,
  onRecenter,
  locationState = 'ready', // 'ready' | 'locating' | 'unavailable' — see LocateBtn
  cardTransitionEnabled = false,
}) {
  const list = masjids || MASJIDS;
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#1C2535' }}>
      <MapCanvas masjids={list} selectedIdx={selectedIdx} onSelectMasjid={onSelectMasjid} />

      <ExploreAppBar onBack={onBack} onSearch={onSearch} onQr={onQr} />

      {/* Location control — sits just above the sheet */}
      <LocateBtn state={locationState} onClick={onRecenter} style={{ position: 'absolute', right: 16, bottom: SHEET_H + 14, zIndex: 20 }} />

      {/* Bottom sheet */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20, background: 'color-mix(in oklab, var(--color-surface-primary) 92%, transparent)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', borderTop: '1px solid var(--color-neutral-border)', borderRadius: '24px 24px 0 0', padding: '10px 16px 22px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--color-info-faint)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-title)', fontSize: 22, color: 'var(--color-info-primary)', letterSpacing: '-0.3px' }}>{NEARBY_COUNT} Masjids Nearby</span>
          <button className="ib ib-tonal primary md" onClick={onOpenList} aria-label="List view">
            <span className="mi" data-i="format_list_bulleted"></span>
          </button>
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-info-secondary)', marginTop: 2, marginBottom: 14 }}>{guest ? 'Sign in to follow masjids and get prayer time notifications' : 'Follow masjids to get prayer time notifications'}</div>

        {/* Carousel — transform track, dots + pins drive the index */}
        <div style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', transform: `translateX(-${selectedIdx * 100}%)`, transition: 'transform 320ms cubic-bezier(.2,.8,.2,1)' }}>
            {list.map((m, i) => (
              <div key={i} style={{ flex: '0 0 100%', minWidth: 0, boxSizing: 'border-box' }}>
                <MasjidCard
                  m={m}
                  following={!!followed[i]}
                  onToggleFollow={() => onToggleFollow && onToggleFollow(i)}
                  onNavigate={() => {}}
                  transitionName={cardTransitionEnabled && i === selectedIdx ? masjidCardTransitionName(m) : 'none'}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Dots — a sliding window of at most five (PagerIndicator.kt `pagerIndicatorWindow`):
            forty results filled the sheet with dots; the edge dot shrinks to hint at more beyond. */}
        <div className="ind" style={{ justifyContent: 'center', marginTop: 14 }}>
          {pagerIndicatorWindow(selectedIdx, list.length).map((i, pos, win) => {
            const active = i === selectedIdx;
            const edge = (pos === 0 && win[0] > 0) || (pos === win.length - 1 && win[win.length - 1] < list.length - 1);
            return (
              <div key={i} onClick={() => onSelectMasjid && onSelectMasjid(i)} className={`dot${active ? ' active' : ''}${edge ? ' edge' : ''}`} style={{ cursor: 'pointer' }} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── List view: map fixed behind, a vertical list of masjid cards scrolls over it ──
function ExploreListScreen({
  masjids = MASJIDS,
  followed = {},
  guest = false,
  onToggleFollow,
  onBack,
  onSearch,
  onQr,
  onOpenMap,
  selectedIdx = 0,
  cardTransitionEnabled = false,
}) {
  const list = masjids || MASJIDS;
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--color-surface-primary)' }}>
      {/* Map backdrop (markers sit behind, contained by MapCanvas' stacking context) */}
      <MapCanvas masjids={list} selectedIdx={-1} />
      {/* Frosted sheet — translucent + blur so the map & markers read faintly behind; the
          mask keeps a clear map strip at top for the headline (same technique as .app-bar). */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'color-mix(in oklab, var(--color-surface-primary) 80%, transparent)',
        backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, transparent 13%, #000 32%, #000 100%)',
        maskImage: 'linear-gradient(to bottom, transparent 0, transparent 13%, #000 32%, #000 100%)'
      }} />

      {/* Scrolling list */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingTop: 150, paddingBottom: 28, boxSizing: 'border-box' }}>
        {/* Headline — sits over the visible map strip */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '0 16px', marginBottom: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 26, color: '#fff', letterSpacing: '-0.3px', textShadow: '0 1px 6px rgba(0,0,0,0.55)' }}>{NEARBY_COUNT} Masjids Nearby</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 3, textShadow: '0 1px 5px rgba(0,0,0,0.5)' }}>{guest ? 'Sign in to follow masjids and get prayer time notifications' : 'Follow masjids to get prayer time notifications'}</div>
          </div>
          <button
            className="ib md"
            onClick={onOpenMap}
            aria-label="Map view"
            style={{ flexShrink: 0, background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', boxShadow: '0 2px 10px rgba(0,0,0,0.28)' }}
          >
            <span className="mi" style={{ color: 'var(--color-action-primary)' }} data-i="map"></span>
          </button>
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>
          {list.map((m, i) => (
            <MasjidCard
              key={i}
              m={m}
              following={!!followed[i]}
              onToggleFollow={() => onToggleFollow && onToggleFollow(i)}
              onNavigate={() => {}}
              transitionName={cardTransitionEnabled && i === selectedIdx ? masjidCardTransitionName(m) : 'none'}
            />
          ))}
        </div>
      </div>

      <ExploreAppBar onBack={onBack} onSearch={onSearch} onQr={onQr} />
    </div>
  );
}

// Deterministic faux QR graphic (imagery) — 3 finder patterns + patterned modules.
function FauxQR({ size = 150 }) {
  const N = 21, cell = size / N;
  const inBox = (r, c, br, bc) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
  const isFinder = (r, c) => inBox(r, c, 0, 0) || inBox(r, c, 0, N - 7) || inBox(r, c, N - 7, 0);
  const finderOn = (r, c) => {
    const ring = (br, bc) => { const rr = r - br, cc = c - bc; const edge = rr === 0 || rr === 6 || cc === 0 || cc === 6; const core = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4; return edge || core; };
    if (r < 7 && c < 7) return ring(0, 0);
    if (r < 7 && c >= N - 7) return ring(0, N - 7);
    if (r >= N - 7 && c < 7) return ring(N - 7, 0);
    return false;
  };
  const rects = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const on = isFinder(r, c) ? finderOn(r, c) : ((r * 3 + c * 7 + r * c) % 3 === 0);
      if (on) rects.push(<rect key={r + '-' + c} x={c * cell} y={r * cell} width={cell + 0.5} height={cell + 0.5} fill="#111" />);
    }
  }
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ background: '#fff', borderRadius: 8 }}>{rects}</svg>;
}

// ── QR scan: camera view with a scan frame; on detect a result sheet slides up ──
function QRScreen({
  scanning = true,
  masjid = MASJIDS[0],
  following = false,
  guest = false, // guest CTA reads "Sign in to Follow" (MasjidQrSearchScreen.kt)
  permissionDenied = false,
  onToggleFollow,
  onBack,
  onScan,      // tap the frame to simulate a detection
}) {
  const FRAME = 260;
  const bracket = { position: 'absolute', width: 40, height: 40, borderColor: 'var(--color-action-primary)', borderStyle: 'solid' };
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#20222a' }}>
      {/* Camera feed (imagery) — dark textured surface */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 50% 35%, #3a3d47 0%, #24262e 55%, #16171c 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 0.35, backgroundImage: 'repeating-linear-gradient(115deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 26px)' }} />
      {/* darken outside the frame a touch more once detected */}
      <div style={{ position: 'absolute', inset: 0, background: scanning ? 'transparent' : 'rgba(0,0,0,0.35)', transition: 'background 300ms' }} />

      {/* App bar (over camera imagery) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12, padding: '54px 16px 10px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)' }}>
        <GlassBtn icon="arrow_back" onClick={onBack} ariaLabel="Back" />
        <div className="ab-title" style={{ color: '#fff', fontSize: 23, textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>Scan QR at your Masjid</div>
      </div>

      {permissionDenied ? (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <span className="mi" data-i="photo_camera" style={{ fontSize: 48, color: 'var(--color-neutral-white)' }}></span>
          <div style={{ fontFamily: 'var(--font-title)', fontSize: 24, color: 'var(--color-neutral-white)', marginTop: 12 }}>Camera access is off</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-neutral-white)', marginTop: 8, maxWidth: 300 }}>Allow camera access in Settings to scan your masjid’s Paigham QR code.</div>
          <button className="btn btn-filled lg" style={{ marginTop: 16 }}>Open Settings</button>
        </div>
      ) : null}

      {/* Scan frame */}
      {!permissionDenied && (
      <div style={{ position: 'absolute', left: '50%', top: scanning ? '46%' : '34%', transform: 'translate(-50%,-50%)', width: FRAME, height: FRAME, transition: 'top 320ms cubic-bezier(.2,.8,.2,1)' }} onClick={scanning ? onScan : undefined}>
        {/* window fill */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: scanning ? 'rgba(255,255,255,0.06)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {!scanning && <FauxQR size={168} />}
        </div>
        {/* corner brackets */}
        <div style={{ ...bracket, top: 0, left: 0, borderWidth: '4px 0 0 4px', borderRadius: '18px 0 0 0' }} />
        <div style={{ ...bracket, top: 0, right: 0, borderWidth: '4px 4px 0 0', borderRadius: '0 18px 0 0' }} />
        <div style={{ ...bracket, bottom: 0, left: 0, borderWidth: '0 0 4px 4px', borderRadius: '0 0 0 18px' }} />
        <div style={{ ...bracket, bottom: 0, right: 0, borderWidth: '0 4px 4px 0', borderRadius: '0 0 18px 0' }} />
        {/* scanning line */}
        {scanning && <div className="qr-scanline" style={{ position: 'absolute', left: 10, right: 10, height: 2, background: 'var(--color-action-primary)', boxShadow: '0 0 12px 2px color-mix(in oklab, var(--color-action-primary) 70%, transparent)' }} />}
      </div>
      )}

      {/* Hint (scanning) */}
      {!permissionDenied && scanning && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: '46%', marginTop: FRAME / 2 + 34, textAlign: 'center', padding: '0 32px' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.82)', textShadow: '0 1px 5px rgba(0,0,0,0.5)' }}>Align QR code within the frame</span>
        </div>
      )}

      {/* Result sheet */}
      {!permissionDenied && !scanning && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20, background: 'color-mix(in oklab, var(--color-surface-primary) 94%, transparent)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', borderTop: '1px solid var(--color-neutral-border)', borderRadius: '24px 24px 0 0', padding: '10px 16px 22px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--color-info-faint)' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-title)', fontSize: 26, color: 'var(--color-info-primary)', letterSpacing: '-0.3px' }}>{masjid.name}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-info-secondary)', marginTop: 3, marginBottom: 14 }}>{masjid.area} · {masjid.pin}</div>

          <MasjidCard m={masjid} showFollow={false} onNavigate={() => {}} />

          <button className="btn btn-filled lg" onClick={onToggleFollow} style={{ width: '100%', marginTop: 16 }}>
            {!guest && following ? <span className="mi" data-i="check"></span> : null}
            {guest ? 'Sign in to Follow' : (following ? 'Following' : 'Follow')}
          </button>
        </div>
      )}
    </div>
  );
}

// Numeric keypad (mirrors the onboarding keypad look; theme-aware DS tokens).
const PIN_KEYS = [
  { label: '1', sub: '' }, { label: '2', sub: 'ABC' }, { label: '3', sub: 'DEF' },
  { label: '4', sub: 'GHI' }, { label: '5', sub: 'JKL' }, { label: '6', sub: 'MNO' },
  { label: '7', sub: 'PQRS' }, { label: '8', sub: 'TUV' }, { label: '9', sub: 'WXYZ' },
  { isGlobe: true }, { label: '0', sub: '' }, { isBackspace: true },
];
function PincodeKeypad({ onPress }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '10px 6px 26px' }}>
      {PIN_KEYS.map((k, i) => {
        if (k.isGlobe) {
          return (
            <div key={i} style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="mi" style={{ fontSize: 22, color: 'var(--color-info-secondary)' }} data-i="travel_explore"></span>
            </div>
          );
        }
        if (k.isBackspace) {
          return (
            <div key={i} className="kp-key" onClick={() => onPress && onPress('backspace')} style={{ height: 50, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <span className="mi" style={{ fontSize: 22, color: 'var(--color-info-primary)' }} data-i="backspace"></span>
            </div>
          );
        }
        return (
          <div key={i} className="kp-key" onClick={() => onPress && onPress(k.label)} style={{ height: 50, borderRadius: 12, background: 'var(--color-action-background)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', userSelect: 'none' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 22, fontWeight: 600, color: 'var(--color-info-primary)', lineHeight: 1 }}>{k.label}</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 700, letterSpacing: '.12em', color: 'var(--color-info-secondary)', height: 10, marginTop: 2 }}>{k.sub}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Pincode search: input pill in the app bar, empty state → suggestions → results ──
const PINCODE_KEYPAD_H = 244; // reserved bottom space when the keypad is up

function PincodeScreen({
  masjids = MASJIDS,
  query = '',
  focused = false,
  onBack,
  onFocus,
  onKeyPress,
  onPickSuggestion,
  followed = {},
  onToggleFollow,
}) {
  const list = masjids || MASJIDS;
  const complete = query.length === 6;
  const showSuggestions = focused && query.length >= 1 && !complete;
  // Results keep their original index so Follow toggles the right masjid.
  const results = complete ? list.map((m, idx) => ({ m, idx })).filter(x => x.m.pin === query) : [];
  const suggestions = showSuggestions
    ? Array.from({ length: 8 }, (_, i) => query + String(i).padStart(6 - query.length, '0'))
    : [];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--color-surface-primary)' }}>

      {/* Empty state — base layer (behind suggestions), hidden once results show */}
      {!complete && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: focused ? PINCODE_KEYPAD_H : 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '132px 32px 0', textAlign: 'center' }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'color-mix(in oklab, var(--color-action-primary) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
            <span className="mi" style={{ fontSize: 46, color: 'var(--color-action-primary)' }} data-i="travel_explore"></span>
          </div>
          <div style={{ fontFamily: 'var(--font-title)', fontSize: 26, color: 'var(--color-info-primary)', letterSpacing: '-0.3px', marginBottom: 10 }}>Search Masjids by Pincode</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.5, color: 'var(--color-info-secondary)' }}>Enter a 6-digit pincode to find masjids in your desired area. You can explore prayer times, events, and community updates.</div>
        </div>
      )}

      {/* Results list */}
      {complete && (
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingTop: 104, paddingBottom: PINCODE_KEYPAD_H + 12, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>
            {results.length ? results.map(({ m, idx }) => (
              <MasjidCard key={idx} m={m} following={!!followed[idx]} onToggleFollow={() => onToggleFollow && onToggleFollow(idx)} onNavigate={() => {}} />
            )) : (
              <div style={{ textAlign: 'center', padding: '32px 16px', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--color-info-secondary)' }}>No masjids found for {query}</div>
            )}
          </div>
        </div>
      )}

      {/* Suggestions dropdown (overlays the empty state) */}
      {showSuggestions && (
        <div className="surf" style={{ position: 'absolute', top: 100, left: 16, right: 16, zIndex: 15, padding: 0, borderRadius: 18, overflow: 'hidden', maxHeight: `calc(100% - 100px - ${PINCODE_KEYPAD_H}px)`, overflowY: 'auto' }}>
          {suggestions.map((sug, i) => (
            <div key={sug} onClick={() => onPickSuggestion && onPickSuggestion(sug)} style={{ padding: '15px 18px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 17, color: 'var(--color-info-primary)', borderTop: i === 0 ? 'none' : '1px solid var(--color-neutral-border)' }}>{sug}</div>
          ))}
        </div>
      )}

      {/* App bar — back + search input pill */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 10, padding: '52px 16px 10px', background: 'var(--color-surface-primary)' }}>
        <button className="ib ib-tonal md" onClick={onBack} aria-label="Back"><span className="mi" data-i="arrow_back"></span></button>
        <div className={`input ${focused ? 'focused' : ''}`} onClick={onFocus} style={{ flex: 1, cursor: 'text' }}>
          <div className="inner">
            <div className="val">
              {query ? <span>{query}</span> : <span className="ph">Enter 6-digit Pincode</span>}
              {focused && <span className="pc-cursor"></span>}
            </div>
          </div>
        </div>
      </div>

      {/* Numeric keypad (up while focused) */}
      {focused && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 25, background: 'var(--color-surface-secondary)', padding: '0 8px', boxSizing: 'border-box' }}>
          <PincodeKeypad onPress={onKeyPress} />
        </div>
      )}
    </div>
  );
}

Object.assign(window, { MASJIDS, ExploreMapScreen, ExploreListScreen, QRScreen, PincodeScreen });

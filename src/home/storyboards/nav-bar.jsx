// Shared bottom nav bar — single source for the app tab list + markup.
// Used by BOTH the live interactive device (Home Broadcast Studio.dc.html, via <x-import>)
// and every static storyboard frame (the Home and nudge rows render <BottomNav/> directly).
// Styling comes from the shared `.nb-bar` / `.nb-item` kit in _theme/components.css.
//
// Props:
//   activeIndex — index (0-4) of the highlighted tab; also drives the glow position.
//   onSelect    — optional (index) => void. When omitted the bar is non-interactive
//                 (used by the storyboard, where the whole frame is the click target).

const NAV_TABS = [
  { label: 'Home', icon: 'home' },
  { label: 'Qaum', icon: 'groups' },
  { label: 'Quran', icon: 'menu_book' },
  { label: 'Salaah', icon: 'mosque_clock2' },
  { label: 'Profile', icon: 'person' }
];

function BottomNav({ activeIndex = 0, onSelect }) {
  const idx = Number(activeIndex) || 0;
  const glowLeft = idx * (100 / NAV_TABS.length) + '%';
  return (
    <div className="nb-bar" aria-label="Primary navigation">
      <div className="nb-glow" style={{ left: glowLeft }}></div>
      <div className="nb-nav" role="tablist">
        {NAV_TABS.map((t, i) => (
          <button
            type="button"
            key={i}
            className={`nb-item ${i === idx ? 'active' : ''}`}
            role="tab"
            aria-selected={i === idx ? 'true' : 'false'}
            onClick={onSelect ? () => onSelect(i) : undefined}
          >
            <span className="mi" data-i={t.icon}></span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { BottomNav, NAV_TABS });

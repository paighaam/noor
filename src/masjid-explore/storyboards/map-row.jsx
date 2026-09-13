// Masjid Explore — map view · static storyboard row (one frame per visible state).
// Board imports it via:
//   <x-import component="MapRow" from="./storyboards/map-row.jsx" active="{{ mapActive }}">
// `active` = index of the frame the live device currently shows (-1 = none).

// Each frame is a snapshot of the map view: which masjid is selected, and whether it's followed.
// `guest` + `sheet` snapshot a guest follow attempt (LoginSheet copy from MasjidExplorerEffect.kt).
const FRAMES = [
  { name: 'Nearby — first result', selectedIdx: 0, followed: {} },
  { name: 'Following a masjid', selectedIdx: 0, followed: { 0: true } },
  { name: 'Another result selected', selectedIdx: 1, followed: { 0: true } },
  { name: 'Guest — sign in to follow', selectedIdx: 0, followed: {}, guest: true, sheet: true },
  { name: 'Finding your location', selectedIdx: 0, followed: {}, locationState: 'locating' },
  { name: 'Location unavailable — tap to enable', selectedIdx: 0, followed: {}, locationState: 'unavailable' },
];

function MapRow({ active = -1, onSelectFrame }) {
  const { ExploreMapScreen, Dialog } = window;
  return (
    <div>
      <div className="poc-row-label">
        <span className="mi" data-i="location_on"></span>
        01 · Explore Masjids — map view · {FRAMES.length} states
      </div>
      <div className="poc-board">
        {FRAMES.map((f, i) => {
          const isActive = active === i;
          return (
            <div key={i} className="poc-board-item" onClick={() => onSelectFrame && onSelectFrame(i)}>
              <div className={`noor-frame ${isActive ? 'is-active' : ''}`} style={{ '--s': '0.46', cursor: onSelectFrame ? 'pointer' : 'default' }}>
                <div className="noor-frame-inner">
                  <div className="noor-screen">
                    <div className="noor-island"></div>
                    {ExploreMapScreen && <ExploreMapScreen selectedIdx={f.selectedIdx} followed={f.followed} guest={f.guest} locationState={f.locationState} />}
                    {f.sheet && Dialog && (
                      <Dialog mode="sheet" isOpen title="Sign in to follow masjids"
                              description="Sign in with your phone number to follow masjids and receive their prayer timings and updates."
                              primary={{ text: 'Sign in', onClick: () => {} }}
                              secondary={{ text: 'Cancel', onClick: () => {} }}
                              onClose={() => {}} />
                    )}
                    <div className="noor-home"></div>
                  </div>
                </div>
              </div>
              <div className="poc-frame-caption">{i + 1} · {f.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { MapRow });

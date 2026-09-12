// Admin Console — Storyboard frame renderer.
//
// Renders static storyboard rows grouped by feature flow, mapping each frame
// to the exact screen component and state builder used by the live interactive device.

(function () {
  const ADMIN_SCREEN_FOR = {
    home: 'AdminHomeScreen',
    queue: 'AdminQueueScreen',
    'standard-review': 'StandardReviewScreen',
    'claimed-review': 'ClaimedReviewScreen',
  };

  function AdminFrame({ frame, index, active, onSelectFrame }) {
    const Screen = window[ADMIN_SCREEN_FOR[frame.screen]];
    const rawState = window.adminFrameState ? window.adminFrameState(frame) : {};
    const data = window.buildAdminData ? window.buildAdminData(rawState, {}) : {};

    return (
      <div className="poc-board-item" onClick={() => onSelectFrame && onSelectFrame(index)}>
        <div
          className={`noor-frame ${active === index ? 'is-active' : ''}`}
          style={{ '--s': '0.46', cursor: 'pointer' }}
        >
          <div className="noor-frame-inner">
            <div className="noor-screen">
              <div className="noor-island"></div>
              {Screen ? <Screen data={data} /> : null}
              <div className="noor-home"></div>
            </div>
          </div>
        </div>
        <div className="poc-frame-caption">
          {index + 1} · {frame.name}
        </div>
      </div>
    );
  }

  function AdminBoard({ active = -1, onSelectFrame }) {
    const frames = window.ADMIN_FRAMES || [];
    const groups = window.ADMIN_GROUPS || [];

    return (
      <div>
        {groups.map((group) => {
          const rows = frames
            .map((frame, index) => ({ frame, index }))
            .filter((item) => item.frame.group === group.id);
          if (!rows.length) return null;
          return (
            <div key={group.id}>
              <div className="poc-row-label">
                <span className="mi" data-i={group.icon}></span>
                {group.num} · {group.title} · {rows.length} states
              </div>
              <div className="poc-board">
                {rows.map((item) => (
                  <AdminFrame
                    key={item.index}
                    frame={item.frame}
                    index={item.index}
                    active={active}
                    onSelectFrame={onSelectFrame}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  Object.assign(window, { AdminBoard });
})();

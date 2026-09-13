// Admin Console — storyboard rows.
//
// Every frame is rendered by the SAME screen component and the SAME `buildAdminData` assembly
// the live device uses (see ./admin-state.js), so a static frame can never drift from the
// prototype. Tapping a frame hands its state to the device.

(function () {
  const ADMIN_SCREEN_FOR = {
    hub: 'AdminHubScreen',
    invalid: 'AdminInvalidScreen',
    signups: 'AdminSignupsScreen',
    approvals: 'AdminApprovalsScreen',
    lead: 'AdminLeadScreen',
    moderation: 'AdminModerationScreen',
    post: 'AdminPostScreen',
  };

  function AdminFrame({ frame, index, active, onSelectFrame }) {
    const Screen = window[ADMIN_SCREEN_FOR[frame.screen]];
    const data = window.buildAdminData ? window.buildAdminData(window.adminFrameState(frame), {}) : {};
    return (
      <div className="poc-board-item" onClick={() => onSelectFrame && onSelectFrame(index)}>
        <div className={`noor-frame ${active === index ? 'is-active' : ''}`} style={{ '--s': '0.46', cursor: 'pointer' }}>
          <div className="noor-frame-inner">
            <div className="noor-screen">
              <div className="noor-island"></div>
              {Screen ? <Screen data={data} /> : null}
              <div className="noor-home"></div>
            </div>
          </div>
        </div>
        <div className="poc-frame-caption">{index + 1} · {frame.name}</div>
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
                  <AdminFrame key={item.index} frame={item.frame} index={item.index} active={active} onSelectFrame={onSelectFrame} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  Object.assign(window, { AdminBoard });
}());

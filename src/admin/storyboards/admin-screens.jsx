// Admin Console — Screen components rendered in the live device frame
// and static storyboard cards.
//
// Screens:
// 1. AdminHomeScreen — Executive dashboard, urgent approvals prompt, stats, shortcuts
// 2. AdminQueueScreen — List of pending and past registration/claim requests
// 3. StandardReviewScreen — Full review of a newly registered masjid
// 4. ClaimedReviewScreen — Hero feature: Side-by-side comparative diff & point-by-point
//    data picking between User Data (LEAD) and Sourced Data (MASJID).

(function () {
  const { useState } = React;

  // ────────────────────────────────────────────────────────────
  // Screen 1: Admin Home
  // ────────────────────────────────────────────────────────────
  function AdminHomeScreen({ data = {}, onNavigate }) {
    const admin = data.admin || {};
    const pendingCount = data.pendingCount || 0;
    const hasPending = pendingCount > 0;

    return (
      <div className="adm-screen">
        <div className="adm-bar">
          <div className="adm-bar-content">
            <span className="adm-bar-title">Paigham Admin</span>
            <span className="adm-bar-sub">{admin.location || 'Operations HQ'}</span>
          </div>
          <button className="adm-bar-btn" title="Admin Settings">
            <span className="mi" data-i="settings"></span>
          </button>
        </div>

        <div className="adm-scroll">
          {/* Hero Profile Card */}
          <div className="adm-hero">
            <div className="adm-hero-avatar">
              {admin.name ? admin.name.charAt(0) : 'A'}
            </div>
            <div className="adm-hero-info">
              <div className="adm-hero-name">{admin.name}</div>
              <div className="adm-hero-role">
                <span className="mi" data-i="shield" style={{ fontSize: '13px' }}></span>
                {admin.role}
              </div>
            </div>
            <span className="chip active" style={{ fontSize: '11px', padding: '3px 8px' }}>
              Online
            </span>
          </div>

          {/* Stats Bar */}
          <div className="adm-stats-grid">
            <div className="adm-stat-pill">
              <span className={`adm-stat-num ${hasPending ? 'urgent' : ''}`}>{pendingCount}</span>
              <span className="adm-stat-lbl">Pending Leads</span>
            </div>
            <div className="adm-stat-pill">
              <span className="adm-stat-num">{admin.totalMasjids || 148}</span>
              <span className="adm-stat-lbl">Masjids Active</span>
            </div>
            <div className="adm-stat-pill">
              <span className="adm-stat-num">{admin.postsToday || 24}</span>
              <span className="adm-stat-lbl">Posts Today</span>
            </div>
          </div>

          {/* Urgent Approvals Banner */}
          {hasPending ? (
            <div
              className="adm-urgent-banner"
              onClick={() => onNavigate && onNavigate('queue', { filter: 'PENDING' })}
            >
              <div className="adm-urgent-left">
                <div className="adm-urgent-icon">
                  <span className="mi" data-i="format_list_bulleted"></span>
                </div>
                <div>
                  <div className="adm-urgent-title">Masjid Approvals Waiting</div>
                  <div className="adm-urgent-sub">
                    {pendingCount} registration {pendingCount === 1 ? 'request needs' : 'requests need'} review
                  </div>
                </div>
              </div>
              <span className="adm-badge-count">{pendingCount} New</span>
            </div>
          ) : (
            <div
              className="adm-hero"
              style={{ background: 'var(--color-surface-card)', justifyContent: 'flex-start', gap: 'var(--size-md)' }}
            >
              <span className="mi" data-i="check_circle" style={{ color: 'var(--color-status-success)', fontSize: '24px' }}></span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--body-sm-size)' }}>Queue Clear</div>
                <div style={{ fontSize: 'var(--body-xs-size)', color: 'var(--color-info-secondary)' }}>
                  All masjid applications are reviewed and processed.
                </div>
              </div>
            </div>
          )}

          {/* Console Actions Grid */}
          <div className="adm-section-title">Operations Console</div>
          <div className="adm-actions-grid">
            <div
              className="adm-action-tile"
              onClick={() => onNavigate && onNavigate('queue', { filter: 'ALL' })}
            >
              <div className="adm-action-icon">
                <span className="mi" data-i="format_list_bulleted"></span>
              </div>
              <div className="adm-action-title">Approvals Queue</div>
              <div className="adm-action-meta">Review claims &amp; leads</div>
            </div>

            <div
              className="adm-action-tile"
              onClick={() => onNavigate && onNavigate('timings')}
            >
              <div className="adm-action-icon">
                <span className="mi" data-i="schedule"></span>
              </div>
              <div className="adm-action-title">Salaah Timings</div>
              <div className="adm-action-meta">Configure daily timings</div>
            </div>

            <div
              className="adm-action-tile"
              onClick={() => onNavigate && onNavigate('post')}
            >
              <div className="adm-action-icon">
                <span className="mi" data-i="campaign"></span>
              </div>
              <div className="adm-action-title">Send Paigham</div>
              <div className="adm-action-meta">Emergency announcements</div>
            </div>

            <div
              className="adm-action-tile"
              onClick={() => onNavigate && onNavigate('directory')}
            >
              <div className="adm-action-icon">
                <span className="mi" data-i="mosque"></span>
              </div>
              <div className="adm-action-title">Masjid Directory</div>
              <div className="adm-action-meta">Browse all 148 masjids</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // Screen 2: Approvals Queue
  // ────────────────────────────────────────────────────────────
  function AdminQueueScreen({ data = {}, onNavigate }) {
    const leads = data.filteredLeads || [];
    const activeFilter = data.filter || 'ALL';
    const [searchVal, setSearchVal] = useState(data.search || '');

    return (
      <div className="adm-screen">
        <div className="adm-bar">
          <button className="adm-bar-btn" onClick={() => onNavigate && onNavigate('home')}>
            <span className="mi" data-i="arrow_back"></span>
          </button>
          <div className="adm-bar-content">
            <span className="adm-bar-title">Approvals Queue</span>
            <span className="adm-bar-sub">{leads.length} Applications</span>
          </div>
        </div>

        <div className="adm-scroll">
          {/* Search Field */}
          <div className="input" style={{ marginBottom: 'var(--size-xs)' }}>
            <div className="inner">
              <span className="mi" data-i="search"></span>
              <input
                type="text"
                className="val"
                placeholder="Search by masjid, city, or phone..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Chips */}
          <div className="adm-queue-filters">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((filterKey) => (
              <button
                key={filterKey}
                className={`chip ${activeFilter === filterKey ? 'active' : ''}`}
                onClick={() => onNavigate && onNavigate('queue', { filter: filterKey })}
              >
                {filterKey.charAt(0) + filterKey.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Lead List Cards */}
          {leads.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--size-2xl) var(--size-md)',
                color: 'var(--color-info-secondary)',
              }}
            >
              <span className="mi" data-i="format_list_bulleted" style={{ fontSize: '36px', marginBottom: 'var(--size-sm)' }}></span>
              <div style={{ fontWeight: 700, fontSize: 'var(--body-md-size)', color: 'var(--color-info-primary)' }}>
                No applications found
              </div>
              <div style={{ fontSize: 'var(--body-xs-size)', marginTop: 'var(--size-xs)' }}>
                Try selecting a different filter or clearing search.
              </div>
            </div>
          ) : (
            leads.map((lead) => {
              const isClaim = !!lead.claimedMasjidId;
              return (
                <div
                  key={lead.id}
                  className={`adm-lead-card ${isClaim ? 'claimed' : ''}`}
                  onClick={() => {
                    if (isClaim) {
                      onNavigate && onNavigate('claimed-review', { leadId: lead.id });
                    } else {
                      onNavigate && onNavigate('standard-review', { leadId: lead.id });
                    }
                  }}
                >
                  <div className="adm-lead-card-top">
                    <div className="adm-lead-title">{lead.masjidName}</div>
                    {isClaim ? (
                      <span className="adm-claim-badge">
                        <span className="mi" data-i="splitscreen" style={{ fontSize: '11px' }}></span>
                        Claimed
                      </span>
                    ) : (
                      <span
                        className={`chip ${
                          lead.status === 'APPROVED' ? 'active' : ''
                        }`}
                        style={{ fontSize: '10px', padding: '2px 8px' }}
                      >
                        {lead.status}
                      </span>
                    )}
                  </div>

                  <div className="adm-lead-meta">
                    <span>
                      <span className="mi" data-i="mosque" style={{ fontSize: '12px', marginRight: '3px' }}></span>
                      {lead.maslak}
                    </span>
                    <span>•</span>
                    <span>
                      <span className="mi" data-i="location_on" style={{ fontSize: '12px', marginRight: '3px' }}></span>
                      {lead.city}, {lead.pincode}
                    </span>
                  </div>

                  {isClaim ? (
                    <div
                      style={{
                        marginTop: 'var(--size-xs)',
                        fontSize: '11px',
                        color: 'var(--color-action-primary)',
                        fontWeight: 600,
                      }}
                    >
                      Claims sourced masjid: &ldquo;{lead.claimedMasjidName}&rdquo;
                    </div>
                  ) : null}

                  <div className="adm-lead-submitter">
                    <div className="adm-lead-contact">
                      <span className="mi" data-i="person" style={{ fontSize: '13px' }}></span>
                      <span>{lead.contactName} ({lead.roleDisplay})</span>
                    </div>
                    <span style={{ color: 'var(--color-info-secondary)' }}>{lead.submittedAt}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // Screen 3: Standard Lead Review
  // ────────────────────────────────────────────────────────────
  function StandardReviewScreen({ data = {}, onNavigate }) {
    const lead = data.lead || {};
    const showRejectSheet = data.showRejectSheet || false;
    const reasons = data.rejectionReasons || [];
    const [selectedReason, setSelectedReason] = useState(reasons[0] || '');

    return (
      <div className="adm-screen">
        <div className="adm-bar">
          <button className="adm-bar-btn" onClick={() => onNavigate && onNavigate('queue')}>
            <span className="mi" data-i="arrow_back"></span>
          </button>
          <div className="adm-bar-content">
            <span className="adm-bar-title">Review Lead</span>
            <span className="adm-bar-sub">New Masjid Registration</span>
          </div>
        </div>

        <div className="adm-scroll">
          {/* Masjid Overview Card */}
          <div className="adm-diff-card">
            <div className="adm-diff-head">
              <span className="adm-diff-field-name">Masjid Details</span>
              <span className="chip active" style={{ fontSize: '10px', padding: '2px 8px' }}>
                {lead.status || 'PENDING'}
              </span>
            </div>
            <div style={{ fontWeight: 800, fontSize: 'var(--title-h3-size)', color: 'var(--color-info-primary)' }}>
              {lead.masjidName}
            </div>
            <div style={{ fontSize: 'var(--body-xs-size)', color: 'var(--color-info-secondary)', display: 'flex', gap: 'var(--size-md)' }}>
              <span>Tradition: <strong>{lead.maslak}</strong></span>
              <span>Pincode: <strong>{lead.pincode}</strong></span>
            </div>
            <div style={{ fontSize: 'var(--body-xs-size)', color: 'var(--color-info-primary)', lineHeight: 1.4 }}>
              <span className="mi" data-i="location_on" style={{ fontSize: '13px', marginRight: '4px' }}></span>
              {lead.address}, {lead.city}, {lead.state}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-info-secondary)' }}>
              GPS: {lead.coordinates}
            </div>
          </div>

          {/* Submitter & Authority Card */}
          <div className="adm-diff-card">
            <div className="adm-diff-field-name">Submitter &amp; Committee</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-md)' }}>
              <div className="adm-hero-avatar" style={{ width: '38px', height: '38px', fontSize: '14px' }}>
                {lead.contactName ? lead.contactName.charAt(0) : 'S'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--body-sm-size)' }}>{lead.contactName}</div>
                <div style={{ fontSize: 'var(--body-xs-size)', color: 'var(--color-info-secondary)' }}>
                  Requested Role: <strong style={{ color: 'var(--color-action-primary)' }}>{lead.roleDisplay}</strong>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--size-md)', marginTop: 'var(--size-xs)' }}>
              <a
                href={`tel:${lead.phone}`}
                className="btn btn-tonal"
                style={{ flex: 1, minHeight: '36px', fontSize: 'var(--body-xs-size)' }}
              >
                <span className="mi" data-i="call"></span>
                {lead.phone}
              </a>
            </div>
            {lead.notes ? (
              <div style={{ fontSize: 'var(--body-xs-size)', color: 'var(--color-info-secondary)', background: 'var(--color-surface-secondary)', padding: 'var(--size-sm)', borderRadius: 'var(--radius-lg)' }}>
                &ldquo;{lead.notes}&rdquo;
              </div>
            ) : null}
          </div>

          {/* Verification Photos */}
          <div className="adm-section-title">Submitted Documents &amp; Photos</div>
          <div className="adm-media-grid">
            <div
              className="adm-media-card"
              onClick={() => onNavigate && onNavigate('standard-review', { viewingMedia: 'masjid' })}
            >
              <img className="adm-media-img" src={lead.masjidPhotoUrl} alt="Masjid Exterior" />
              <div className="adm-media-caption">
                <span className="mi" data-i="photo_camera" style={{ fontSize: '13px' }}></span>
                Masjid Exterior
              </div>
            </div>
            <div
              className="adm-media-card"
              onClick={() => onNavigate && onNavigate('standard-review', { viewingMedia: 'verification' })}
            >
              <img className="adm-media-img" src={lead.verificationPhotoUrl} alt="Verification Doc" />
              <div className="adm-media-caption">
                <span className="mi" data-i="description" style={{ fontSize: '13px' }}></span>
                Verification Letter
              </div>
            </div>
          </div>
        </div>

        {/* Docked Action Bar */}
        <div className="adm-docked-bar">
          <button
            className="btn btn-destructive"
            onClick={() => onNavigate && onNavigate('standard-review', { showRejectSheet: true })}
          >
            <span className="mi" data-i="close"></span>
            Reject
          </button>
          <button
            className="btn btn-filled"
            onClick={() => onNavigate && onNavigate('queue', { filter: 'APPROVED' })}
          >
            <span className="mi" data-i="check"></span>
            Approve Registration
          </button>
        </div>

        {/* Rejection Bottom Sheet Modal */}
        {showRejectSheet ? (
          <div className="adm-sheet-overlay">
            <div className="adm-sheet-content">
              <div className="adm-sheet-title">Reject Application</div>
              <div style={{ fontSize: 'var(--body-xs-size)', color: 'var(--color-info-secondary)' }}>
                Select a clear reason for the submitter to explain why this application could not be verified:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-xs)' }}>
                {reasons.map((r) => (
                  <div
                    key={r}
                    className={`adm-reason-item ${selectedReason === r ? 'selected' : ''}`}
                    onClick={() => setSelectedReason(r)}
                  >
                    <span className="mi" data-i={selectedReason === r ? 'radio_button_checked' : 'radio_button_unchecked'}></span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 'var(--size-md)', marginTop: 'var(--size-sm)' }}>
                <button
                  className="btn btn-tonal"
                  style={{ flex: 1 }}
                  onClick={() => onNavigate && onNavigate('standard-review', { showRejectSheet: false })}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-destructive"
                  style={{ flex: 1 }}
                  onClick={() => onNavigate && onNavigate('queue', { filter: 'REJECTED' })}
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // Screen 4: Claimed Masjid Review & Point-by-Point Pick & Merge
  // ────────────────────────────────────────────────────────────
  function ClaimedReviewScreen({ data = {}, onNavigate, onUpdateSelection }) {
    const lead = data.lead || {};
    const sourced = data.sourcedMasjid || {};
    const mergeFields = data.mergeFields || [];
    const diffCount = data.diffCount || 0;
    const composite = data.compositePreview || {};
    const showConfirmDialog = data.showConfirmDialog || false;
    const isSuccess = data.isSuccess || false;

    return (
      <div className="adm-screen">
        <div className="adm-bar">
          <button className="adm-bar-btn" onClick={() => onNavigate && onNavigate('queue')}>
            <span className="mi" data-i="arrow_back"></span>
          </button>
          <div className="adm-bar-content">
            <span className="adm-bar-title">Claimed Masjid Review</span>
            <span className="adm-bar-sub">Compare &amp; Pick Data Points</span>
          </div>
        </div>

        <div className="adm-scroll">
          {/* Claim Context Header */}
          <div className="adm-claimed-banner">
            <div className="adm-diff-counter">
              <span className="mi" data-i="splitscreen" style={{ fontSize: '13px' }}></span>
              {diffCount} Data Differences Detected
            </div>
            <div style={{ fontWeight: 800, fontSize: 'var(--body-md-size)', color: 'var(--color-info-primary)' }}>
              Claim for: {sourced.name}
            </div>
            <div style={{ fontSize: 'var(--body-xs-size)', color: 'var(--color-info-secondary)', marginTop: '3px' }}>
              Submitter <strong>{lead.contactName}</strong> claims committee authority over this sourced masjid.
              Review the fields below and select which value to retain.
            </div>
          </div>

          {/* Submitter Strip */}
          <div
            className="adm-diff-card"
            style={{ padding: 'var(--size-sm) var(--size-md)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--body-xs-size)' }}>
              <div>
                <strong>{lead.contactName}</strong> ({lead.phone})
              </div>
              <a
                href={`tel:${lead.phone}`}
                className="chip active"
                style={{ fontSize: '11px', padding: '2px 8px' }}
              >
                Call Submitter
              </a>
            </div>
          </div>

          {/* Comparison Field Matrix */}
          <div className="adm-section-title">Field-by-Field Selection</div>

          {mergeFields.map((field) => {
            const isLeadSelected = field.selected === 'LEAD';
            const isMasjidSelected = field.selected === 'MASJID';

            return (
              <div
                key={field.key}
                className={`adm-diff-card ${field.isDiff ? 'has-conflict' : ''}`}
              >
                <div className="adm-diff-head">
                  <span className="adm-diff-field-name">{field.label}</span>
                  <span className={`adm-diff-status-pill ${field.isDiff ? 'diff' : 'same'}`}>
                    {field.isDiff ? 'Differs' : 'Identical'}
                  </span>
                </div>

                {/* 2-Column Pick Grid */}
                <div className="adm-diff-options">
                  {/* Option 1: User / Lead Entered */}
                  <div
                    className={`adm-diff-opt ${isLeadSelected ? 'selected' : ''}`}
                    onClick={() => onUpdateSelection && onUpdateSelection(field.key, 'LEAD')}
                  >
                    <div className="adm-diff-opt-top">
                      <span className="adm-diff-opt-label">User Entered</span>
                      <div className="adm-diff-opt-radio">
                        {isLeadSelected ? <div className="adm-diff-opt-radio-inner"></div> : null}
                      </div>
                    </div>
                    <div className="adm-diff-opt-val">{field.leadValue || '—'}</div>
                  </div>

                  {/* Option 2: Sourced Masjid Existing */}
                  <div
                    className={`adm-diff-opt ${isMasjidSelected ? 'selected' : ''}`}
                    onClick={() => onUpdateSelection && onUpdateSelection(field.key, 'MASJID')}
                  >
                    <div className="adm-diff-opt-top">
                      <span className="adm-diff-opt-label">Sourced Masjid</span>
                      <div className="adm-diff-opt-radio">
                        {isMasjidSelected ? <div className="adm-diff-opt-radio-inner"></div> : null}
                      </div>
                    </div>
                    <div className="adm-diff-opt-val">{field.masjidValue || '—'}</div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Composite Result Preview */}
          <div className="adm-composite-card">
            <div className="adm-composite-title">Resulting Masjid Record Preview</div>
            <div className="adm-composite-row">
              <span className="adm-composite-key">Name</span>
              <span className="adm-composite-val">{composite.name}</span>
            </div>
            <div className="adm-composite-row">
              <span className="adm-composite-key">Maslak</span>
              <span className="adm-composite-val">{composite.maslak}</span>
            </div>
            <div className="adm-composite-row">
              <span className="adm-composite-key">Address</span>
              <span className="adm-composite-val">{composite.address}</span>
            </div>
            <div className="adm-composite-row">
              <span className="adm-composite-key">City / State</span>
              <span className="adm-composite-val">{composite.city}, {composite.state} ({composite.pincode})</span>
            </div>
            <div className="adm-composite-row">
              <span className="adm-composite-key">Assigned Role</span>
              <span className="adm-composite-val" style={{ color: 'var(--color-action-primary)' }}>
                {composite.role}
              </span>
            </div>
          </div>
        </div>

        {/* Docked Action Bar */}
        <div className="adm-docked-bar">
          <button
            className="btn btn-destructive"
            onClick={() => onNavigate && onNavigate('standard-review', { showRejectSheet: true })}
          >
            <span className="mi" data-i="close"></span>
            Reject Claim
          </button>
          <button
            className="btn btn-filled"
            onClick={() => onNavigate && onNavigate('claimed-review', { showConfirmDialog: true })}
          >
            <span className="mi" data-i="check"></span>
            Merge &amp; Approve
          </button>
        </div>

        {/* Confirmation Modal */}
        {showConfirmDialog ? (
          <div className="adm-sheet-overlay">
            <div className="adm-sheet-content">
              <div className="adm-sheet-title">Confirm Masjid Merge</div>
              <div style={{ fontSize: 'var(--body-xs-size)', color: 'var(--color-info-secondary)', lineHeight: 1.4 }}>
                You are about to merge this claim into <strong>{sourced.name}</strong> with the chosen composite data.
                The submitter (<strong>{lead.contactName}</strong>) will be activated as <strong>{composite.role}</strong> and notified via push notification.
              </div>
              <div style={{ display: 'flex', gap: 'var(--size-md)', marginTop: 'var(--size-md)' }}>
                <button
                  className="btn btn-tonal"
                  style={{ flex: 1 }}
                  onClick={() => onNavigate && onNavigate('claimed-review', { showConfirmDialog: false })}
                >
                  Back to Edit
                </button>
                <button
                  className="btn btn-filled"
                  style={{ flex: 1 }}
                  onClick={() => onNavigate && onNavigate('claimed-review', { showConfirmDialog: false, isSuccess: true })}
                >
                  Confirm &amp; Publish
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Success Modal */}
        {isSuccess ? (
          <div className="adm-sheet-overlay">
            <div className="adm-sheet-content" style={{ textAlign: 'center', alignItems: 'center' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: 'var(--radius-circle)',
                  background: 'color-mix(in oklab, var(--color-status-success) 18%, transparent)',
                  color: 'var(--color-status-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  marginBottom: 'var(--size-xs)',
                }}
              >
                <span className="mi" data-i="check"></span>
              </div>
              <div className="adm-sheet-title">Masjid Successfully Merged!</div>
              <div style={{ fontSize: 'var(--body-xs-size)', color: 'var(--color-info-secondary)', maxWidth: '280px' }}>
                The claimed masjid has been updated with the selected composite data, and the admin has been granted management access.
              </div>
              <button
                className="btn btn-filled"
                style={{ width: '100%', marginTop: 'var(--size-md)' }}
                onClick={() => onNavigate && onNavigate('queue', { filter: 'APPROVED' })}
              >
                Done
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // Assign to window for global storyboard access
  Object.assign(window, {
    AdminHomeScreen,
    AdminQueueScreen,
    StandardReviewScreen,
    ClaimedReviewScreen,
  });
})();

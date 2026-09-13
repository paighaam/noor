// Shared screen components for the Masjid registration / onboarding flow.
// Used by BOTH the static storyboards (*-row.jsx) and the live device (Masjid Onboarding.dc.html).
//
// Ported from the old flat `src/Masjid Onboarding.dc.html`. Deliberate changes from the source:
//   1. My Masjids (Manage + Follow) is the single `MyMasjidsSheet` bottom sheet — opened by tapping
//      the masjid name on the Home / Salaah / Profile tab (those tabs are the REAL shared screens
//      from ../home/storyboards/screens.jsx). The left-column exploration gallery is dropped.
//   2. All hardcoded hex / font literals are mapped to semantic DS tokens; DS component classes
//      (.btn, .ib, .tbar, .input, .dlg) are used instead of inline re-implementations where they fit.
//
// Every screen takes ONE `data` object prop (built in the board's renderVals / in the rows), so the
// dc x-import only binds a single value per screen.

const MANAGE_DATA = [
  { id: 'dargha', name: 'Dargha Masjid 3', sub: 'Molakalmuru · 577535', letter: 'D' },
  { id: 'mohammadi', name: 'Masjid-e-Mohammadi', sub: 'Bengaluru · 560064', letter: 'M' }
];
const FOLLOW_DATA = [
  { id: 'subhania', name: 'Masjid-e-Subhania', sub: 'HBR Layout · 560064', letter: 'S', city: 'Bengaluru' },
  { id: 'bilal', name: 'Bilal Masjid', sub: 'BTM Layout · 560076', letter: 'B', city: 'Bengaluru' },
  { id: 'jamia', name: 'Jamia Masjid Shivajinagar', sub: 'Shivajinagar · 560001', letter: 'J', city: 'Bengaluru' },
  { id: 'noor', name: 'Noor Masjid', sub: 'Main Road · 577535', letter: 'N', city: 'Molakalmuru' },
  { id: 'aqsa', name: 'Masjid-e-Aqsa', sub: 'Gandhi Nagar · 577535', letter: 'M', city: 'Molakalmuru' }
];
const REGISTRATION_DATA = {
  id: 'registration-noor',
  name: 'Masjid-e-Noor',
  status: 'pending',
  statusLabel: 'Verification pending',
  description: 'Submitted for review. Tap to view progress.'
};
const CLAIM_DATA = [
  { id: 1, name: 'Jama Masjid Mahim', addr: 'St. Michael Church Rd, Mahim, Mumbai', dist: '0.4 km', claimStatus: 'claimable' },
  { id: 2, name: 'Masjid-e-Noor', addr: 'Kabutar Khana, Mahim, Mumbai', dist: '0.9 km', claimStatus: 'pending' },
  { id: 3, name: 'Anjuman-e-Islam Masjid', addr: 'Cadell Road, Mahim, Mumbai', dist: '1.6 km', claimStatus: 'claimed' }
];
const ROLE_LIST = ['Chairman', 'Assistant Chairman', 'Secretary', 'Assistant Secretary', 'Treasurer', 'Assistant Treasurer', 'Member', 'Imam', 'Muezzin'];
const MASLAK_LIST = ['Ahle Hadith', 'Ahle Sunnat Wal Jamaat (Barelvi)', 'Ahle Sunnat Wal Jamaat (Deoband)'];
const STATE_LIST = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const FONT_B = 'var(--font-body)';
const FONT_T = 'var(--font-title)';

// A tokenised text field shell (label + framed input) — the wizard reuses it for every text step.
function Field({ label, children, helper, error, mb = 16 }) {
  return (
    <div style={{ marginBottom: mb }}>
      {label ? <div style={{ fontFamily: FONT_B, fontSize: 13, fontWeight: 600, color: 'var(--color-info-primary)', marginBottom: 6 }}>{label}</div> : null}
      {children}
      {error ? <div className="helper err" role="alert">{error}</div> : null}
      {!error && helper ? <div className="helper">{helper}</div> : null}
    </div>
  );
}
// Consumes the DS `.input` atom (components.css). Pass `code` for the fixed-length numeric
// variant (`.input.code`) — pincode / PIN — reserved for entries where each digit should read
// distinctly. Standard (proportional 16px) is the default for all free-text fields.
function TextInput({ value, onChange, placeholder, maxLength, inputMode, code, error, readOnly }) {
  return (
    <div className={`${code ? 'input code' : 'input'} ${error ? 'error' : ''} ${readOnly ? 'disabled' : ''}`}>
      <div className="inner">
        <input className="val" value={value || ''} onChange={onChange} placeholder={placeholder} maxLength={maxLength} inputMode={inputMode} readOnly={readOnly} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 1 · My Masjids — bottom sheet (Manage / Follow). Device-level overlay,
//     opened by tapping the masjid name/header on Home, Salaah or Profile.
//     Uses the DS .dlg-scrim.sheet + .dlg construction (same as the app's
//     other bottom sheets). `data.isOpen` gates it.
// ══════════════════════════════════════════════════════════════════════
function PrimaryMasjidSummary({ masjid }) {
  if (!masjid) return null;
  return (
    <section className="my-masjids-primary" aria-label={`Current salaah timings use ${masjid.name}`}>
      <span className="my-masjids-primary-icon">
        <span className="mi fill" style={{ fontVariationSettings: "'FILL' 1" }} data-i="mosque"></span>
      </span>
      <span className="my-masjids-primary-copy">
        <span className="my-masjids-eyebrow">Salaah timings from</span>
        <span className="my-masjids-primary-name">{masjid.name}</span>
        <span className="my-masjids-primary-note">Your current timing source</span>
      </span>
      <span className="my-masjids-current">
        <span className="mi" aria-hidden="true" data-i="check_circle"></span>
        Current
      </span>
    </section>
  );
}

function SwitchMasjidAction({ current, onClick, busy }) {
  if (current) {
    return (
      <span className="my-masjids-current">
        <span className="mi" aria-hidden="true" data-i="check"></span>
        Current
      </span>
    );
  }
  // Inert while a switch is in flight, and it keeps its label: the capsule above the discovery
  // action is what says which masjid is being switched to, and a spinner in a 28px trailing chip
  // would be a second indicator saying less. One switch at a time — every row goes inert, because
  // the timings can only come from one masjid.
  return (
    <button
      className="btn btn-tonal sm masjid-switch-action"
      onClick={busy ? undefined : onClick}
      aria-disabled={busy ? 'true' : 'false'}
      style={busy ? { opacity: 'var(--opacity-emphasis, .6)' } : undefined}
    >
      <span className="mi" aria-hidden="true" data-i="swap_horiz"></span>
      <span>Switch</span>
    </button>
  );
}

function RegistrationTile({ registration }) {
  if (!registration) return null;
  const rejected = registration.status === 'rejected';
  const status = rejected ? 'Needs changes' : 'Under review';
  return (
    <button
      className={`registration-tile ${rejected ? 'rejected' : ''}`}
      onClick={registration.onOpen}
      aria-label={`${registration.name}, ${status}. View application`}
    >
      <span className="registration-tile-icon">
        <span className="mi" data-i={rejected ? 'error' : 'schedule'}></span>
      </span>
      <span className="registration-tile-copy">
        <span className="registration-tile-title">{registration.name}</span>
        <span className="registration-tile-meta">
          <span className="registration-tile-state">
            <span className="mi" aria-hidden="true" data-i={rejected ? 'error' : 'schedule'}></span>
            {status}
          </span>
          <span className="registration-tile-separator" aria-hidden="true">·</span>
          <span>{rejected ? 'Update application' : 'View application'}</span>
        </span>
      </span>
      <span className="mi registration-tile-chevron" data-i="chevron_right"></span>
    </button>
  );
}

function MyMasjidsSheet({ data = {} }) {
  const {
    isOpen,
    tab = 'manage',
    onTab,
    manageTiles = [],
    followRows = [],
    registration,
    onClose,
    onRegister,
    onFind,
    switchingName = null,
  } = data;
  if (!isOpen) return null;
  const manageCount = manageTiles.length + (registration ? 1 : 0);
  const hasManage = manageCount > 0;
  const hasFollowing = followRows.length > 0;
  const showTabs = hasManage && hasFollowing;
  const activeSection = showTabs ? tab : (hasManage ? 'manage' : 'follow');
  const isManage = activeSection === 'manage';
  const manageItemCount = manageTiles.length + (registration ? 1 : 0);
  const pendingRegistrationSpans = Boolean(
    registration && registration.status === 'pending' && manageItemCount % 2 === 1
  );
  const showRegisterGridCard = manageItemCount % 2 === 1 && !pendingRegistrationSpans;
  const primaryMasjid = manageTiles.find((masjid) => masjid.isPrimary)
    || followRows.find((masjid) => masjid.checked);
  const activeCount = isManage ? manageCount : followRows.length;
  const activeLabel = isManage ? 'Manage' : 'Following';
  return (
    <div className="dlg-scrim sheet" onClick={onClose}>
      <div className="dlg my-masjids-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="dlg-handle" />
        <header className="my-masjids-header">
          <span className="my-masjids-heading">
            <span className="dlg-title">My Masjids</span>
            <span className="my-masjids-subtitle">Choose where your salaah timings come from.</span>
          </span>
          <button className="ib ib-link" onClick={onClose} aria-label="Close My Masjids">
            <span className="mi" data-i="close"></span>
          </button>
        </header>
        <div style={{ flexShrink: 0 }}>
          <PrimaryMasjidSummary masjid={primaryMasjid} />
          {showTabs ? (
            <div className="tbar my-masjids-tabs" role="tablist" aria-label="Masjid relationships">
              <button className={`tab ${isManage ? 'active' : ''}`} role="tab" aria-selected={isManage} onClick={() => onTab && onTab('manage')}>
                Manage <span className="my-masjids-tab-count">{manageCount}</span>
              </button>
              <button className={`tab ${!isManage ? 'active' : ''}`} role="tab" aria-selected={!isManage} onClick={() => onTab && onTab('follow')}>
                Following <span className="my-masjids-tab-count">{followRows.length}</span>
              </button>
            </div>
          ) : (
            <div className="my-masjids-section-head">
              <strong>{activeLabel}</strong>
              <span>{activeCount} {activeCount === 1 ? 'masjid' : 'masjids'}</span>
            </div>
          )}
        </div>

        <div className="my-masjids-scroll">
          {isManage ? (
            <div>
            <div className="masjid-manage-grid">
              {/* A managed masjid's tile OPENS ITS CONSOLE — that is what "Manage" means.
                  Choosing which masjid supplies salaah timings stays its own explicit
                  control on the tile, so the two jobs never share one tap. */}
              {manageTiles.map((t) => (
                <div key={t.id} onClick={t.onManage || t.onSelect} style={{ position: 'relative', borderRadius: 16, padding: '14px 12px', boxSizing: 'border-box', cursor: 'pointer', minHeight: 108,
                  background: t.isPrimary ? 'var(--color-action-primary)' : 'var(--color-surface-card)',
                  border: t.isPrimary ? '1px solid transparent' : '1px solid var(--color-neutral-border)',
                  boxShadow: t.isPrimary ? 'var(--shadow-button)' : 'none' }}>
                  <span className="mi" style={{ position: 'absolute', top: 10, right: 10, fontSize: 16, color: t.isPrimary ? 'var(--color-action-primary-inverse)' : 'var(--color-info-faint)' }} data-i="chevron_right"></span>
                  <span className={`mi ${t.isPrimary ? 'fill' : ''}`} style={{ fontSize: 22, color: t.isPrimary ? 'var(--color-action-primary-inverse)' : 'var(--color-info-secondary)', fontVariationSettings: t.isPrimary ? "'FILL' 1" : "'FILL' 0" }} data-i="mosque"></span>
                  <div style={{ fontFamily: FONT_B, fontSize: 13.5, fontWeight: 700, marginTop: 8, lineHeight: 1.25, color: t.isPrimary ? 'var(--color-action-primary-inverse)' : 'var(--color-info-primary)' }}>{t.name}</div>
                  <div style={{ fontFamily: FONT_B, fontSize: 10.5, marginTop: 2, color: t.isPrimary ? 'color-mix(in oklab, var(--color-action-primary-inverse) 80%, transparent)' : 'var(--color-info-secondary)' }}>{t.sub}</div>
                  {t.isPrimary ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontFamily: FONT_B, fontSize: 10.5, fontWeight: 700, color: 'var(--color-action-primary-inverse)' }}>
                      <span className="mi" style={{ fontSize: 15 }} data-i="check"></span>
                      Current timings
                    </div>
                  ) : (
                    <button
                      className="btn btn-tonal sm masjid-switch-action"
                      style={{ marginTop: 8 }}
                      onClick={(event) => { event.stopPropagation(); if (t.onSelect) t.onSelect(); }}
                    >
                      <span className="mi" aria-hidden="true" data-i="swap_horiz"></span>
                      <span>Use timings</span>
                    </button>
                  )}
                </div>
              ))}
              {registration ? (
                <div className={`registration-grid-cell ${pendingRegistrationSpans ? 'masjid-manage-grid-item-wide' : ''}`}>
                  <RegistrationTile registration={registration} />
                </div>
              ) : null}
              {showRegisterGridCard ? (
                <div>
                  <button className="register-masjid-tile" onClick={onRegister}>
                    <span className="mi" data-i="add"></span>
                    <span>Register masjid</span>
                  </button>
                </div>
              ) : null}
            </div>
            {!hasFollowing ? (
              <button className="btn btn-tonal lg" onClick={onFind} style={{ width: '100%' }}>
                <span className="mi" style={{ fontSize: 20 }} data-i="travel_explore"></span>
                Find a masjid to follow
              </button>
            ) : null}
            </div>
          ) : (
            <div>
            <div className="my-masjids-follow-list">
              {followRows.map((f) => (
                <div key={f.id} className={`my-masjids-follow-row ${f.checked ? 'current' : ''}`}>
                    <div className="my-masjids-avatar">{f.letter}</div>
                    <div className="my-masjids-row-copy">
                      <div className="my-masjids-row-name">{f.name}</div>
                      <div className="my-masjids-row-meta">{f.sub}</div>
                    </div>
                    <SwitchMasjidAction current={f.checked} onClick={f.onToggle} busy={!!switchingName} />
                </div>
              ))}
            </div>
            {/* Changing where the timings come from is a request, and the row's `Current` marker
                cannot move until it lands — so the capsule floats above this sheet's pinned action
                and NAMES the masjid. Outside the action's measurement, so the list beneath it does
                not shift while the switch runs. */}
            <div className="docked-host my-masjids-discovery">
              {switchingName ? (
                <div className="docked-status status-capsule" role="status" aria-live="polite">
                  <span className="status-capsule-ring" aria-hidden="true"></span>
                  <b>Switching to {switchingName}…</b>
                </div>
              ) : null}
              <button className="btn btn-filled lg" onClick={onFind}>
                <span className="mi" data-i="travel_explore"></span>
                Find another masjid
              </button>
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 3 · Register wizard — one screen, `data.step` selects the body
// ══════════════════════════════════════════════════════════════════════
const WIZARD_TITLE = { fontFamily: FONT_T, letterSpacing: '-0.5px', color: 'var(--color-info-primary)' };
const WIZARD_SUB = { fontFamily: FONT_B, fontSize: 14, lineHeight: 1.6, color: 'var(--color-info-secondary)' };

function ReviewRow({ label, value, onEdit, border }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderBottom: border ? '1px solid var(--color-neutral-border)' : 'none' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: FONT_B, fontSize: 11.5, color: 'var(--color-info-secondary)' }}>{label}</div>
        <div style={{ fontFamily: FONT_B, fontSize: 14.5, fontWeight: 600, color: 'var(--color-info-primary)' }}>{value}</div>
      </div>
      <button className="btn btn-link sm" onClick={onEdit}>Edit</button>
    </div>
  );
}

function LocationMap({ d }) {
  const phase = d.locationPhase || (d.pinDropped ? 'confirmed' : 'choice');
  const locating = phase === 'loading';
  const showGuidance = ['choice', 'loading', 'denied', 'unavailable'].includes(phase);
  const guidance = {
    choice: {
      icon: 'near_me',
      title: 'Start near the masjid entrance',
      body: 'Use your current location, then move the map to the exact entrance.',
    },
    loading: {
      icon: 'progress_activity',
      title: 'Finding your location',
      body: 'This can take a moment. Keep this screen open while we position the map.',
    },
    denied: {
      icon: 'location_off',
      title: 'Location access is off',
      body: 'Allow location in Settings, or start near the pincode and place the entrance manually.',
    },
    unavailable: {
      icon: 'location_searching',
      title: 'We could not find your location',
      body: 'Try again, or start near the pincode and move the map to the entrance.',
    },
  }[phase];

  const status = phase === 'confirmed'
    ? { icon: 'check_circle', text: 'Entrance pin confirmed · pan again to refine it' }
    : phase === 'positioned'
      ? { icon: 'my_location', text: 'Near your current location · pan to the exact entrance' }
      : { icon: 'location_on', text: 'Map starts near the pincode · pan to the exact entrance' };

  return (
    <div className={`wizard-map phase-${phase}`}>
      <div className="wizard-map-grid"></div>
      <div className="wizard-map-road"></div>
      {!showGuidance ? (
        <>
          <button className="wizard-map-hit-area" onClick={d.onTogglePin} aria-label="Place entrance pin"></button>
          <div className="wizard-map-pin">
            <span className="mi fill" style={{ fontVariationSettings: "'FILL' 1" }} data-i="location_on"></span>
          </div>
          <div className="wizard-map-actions">
            <button className="ib ib-tonal md" onClick={d.onRecenterLocation} aria-label="Use my current location">
              <span className="mi" data-i="my_location"></span>
            </button>
          </div>
          <button className="wizard-map-status" onClick={d.onTogglePin}>
            <span className="mi" style={{ fontSize: 18, color: 'var(--color-action-primary)' }} data-i={status.icon}></span>
            <span>{status.text}</span>
          </button>
        </>
      ) : (
        <div className="wizard-map-guidance">
          <div className={`wizard-map-guidance-icon ${locating ? 'loading' : ''}`}>
            <span className="mi" data-i={guidance.icon}></span>
          </div>
          <div className="wizard-map-guidance-title">{guidance.title}</div>
          <div className="wizard-map-guidance-body">{guidance.body}</div>
          {phase === 'choice' ? (
            <div className="wizard-map-guidance-actions">
              <button className="btn btn-filled" onClick={d.onRecenterLocation}>
                <span className="mi" data-i="my_location"></span>
                Use my location
              </button>
              <button className="btn btn-tonal" onClick={d.onChooseLocationManually}>Choose manually</button>
            </div>
          ) : null}
          {phase === 'denied' ? (
            <div className="wizard-map-guidance-actions">
              <button className="btn btn-filled" onClick={d.onOpenLocationSettings}>Open settings</button>
              <button className="btn btn-tonal" onClick={d.onChooseLocationManually}>Choose manually</button>
            </div>
          ) : null}
          {phase === 'unavailable' ? (
            <div className="wizard-map-guidance-actions">
              <button className="btn btn-filled" onClick={d.onRecenterLocation}>Try again</button>
              <button className="btn btn-tonal" onClick={d.onChooseLocationManually}>Choose manually</button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function CameraStage({ d }) {
  if (!d.cameraMode) return null;
  if (d.cameraPermission !== 'granted') return null;
  const selfie = d.cameraMode === 'selfie';
  const imageSrc = selfie ? '../../images/identity-camera-preview.png' : '../../images/masjid-camera-preview.png';
  const captured = d.cameraStage === 'captured';
  const locationUnavailable = !selfie && d.captureLocationStatus === 'unavailable';
  const locationOutsideRange = !selfie && d.captureLocationStatus === 'outside';
  return (
    <div className="camera-stage">
      <div className="camera-topbar">
        <button className="ib ib-tonal md camera-control" onClick={d.onCloseCamera} aria-label="Close camera">
          <span className="mi" data-i="close"></span>
        </button>
        <div className="camera-title">
          {captured ? 'Review photo' : (selfie ? 'Identity photo' : 'Masjid photo')}
          <small>{captured ? 'This is exactly what will be saved' : (selfie ? 'Keep your face inside the guide' : 'Keep the entrance within the frame')}</small>
        </div>
        <button className="ib ib-tonal md camera-control" onClick={d.onFlipCamera} aria-label="Switch camera">
          <span className="mi" data-i="swap_horiz"></span>
        </button>
      </div>
      <div className={`camera-viewport ${selfie ? 'selfie' : ''}`}>
        <img src={imageSrc} alt="" />
        {!captured ? <div className={`camera-guide ${selfie ? 'selfie' : ''}`}></div> : null}
        {!selfie && !locationUnavailable && !locationOutsideRange ? (
          <div className="camera-location-card">
            <span className="mi fill" data-i="location_on"></span>
            <div className="camera-location-copy">
              <strong>{captured ? 'Location verified' : 'Within entrance range'}</strong>
              <span>{d.capturePlace || 'Kabutar Khana, Mumbai'}</span>
            </div>
          </div>
        ) : null}
        {locationOutsideRange ? (
          <div className="camera-location-recovery">
            <div><strong>Move closer to the entrance</strong><br />You are outside the allowed range of the pinned entrance.</div>
            <button className="btn btn-tonal sm" onClick={d.onRetryCaptureLocation}>Refresh location</button>
          </div>
        ) : null}
        {!selfie && locationUnavailable ? (
          <div className={`camera-location-status ${locationUnavailable ? 'warning' : ''}`}>
            <span className="mi" data-i={locationUnavailable ? 'location_off' : 'my_location'}></span>
            Location unavailable
          </div>
        ) : null}
        {locationUnavailable ? (
          <div className="camera-location-recovery">
            <div>Turn on location so Paigham can compare this photo with the entrance pin.</div>
            <button className="btn btn-tonal sm" onClick={d.onRetryCaptureLocation}>Retry location</button>
          </div>
        ) : null}
      </div>
      {captured ? (
        <div className="camera-capture-actions">
          <button className="btn btn-filled lg camera-use-photo" onClick={d.onUseCapture}>
            <span className="mi" data-i="check"></span>
            Use this photo
          </button>
          <button className="btn btn-link camera-retake-photo" onClick={d.onRetakeCamera}>Retake photo</button>
        </div>
      ) : (
        <div className="camera-controls">
          {!selfie ? (
            <button className="ib ib-tonal md camera-control" onClick={d.onRetryCaptureLocation} aria-label="Refresh capture location">
              <span className="mi" data-i="my_location"></span>
            </button>
          ) : <div></div>}
          <button className="camera-shutter" onClick={d.onCapture} disabled={locationUnavailable || locationOutsideRange} aria-label="Take photo"></button>
          <button className="ib ib-tonal md camera-control" onClick={d.onToggleFlash} aria-label="Toggle flash">
            <span className="mi" data-i="wb_sunny"></span>
          </button>
        </div>
      )}
    </div>
  );
}

function PhotoCaptureCard({ mode, captured, locationAttached, locationLabel, imageSrc, onOpen, onRemove, error }) {
  const selfie = mode === 'selfie';
  const resolvedImage = imageSrc || (selfie ? '../../images/identity-camera-preview.png' : '../../images/masjid-camera-preview.png');
  if (captured) {
    return (
      <div>
        <div className={`capture-thumbnail ${selfie ? 'selfie camera-source' : ''}`}>
          <img src={resolvedImage} alt={selfie ? 'Selected identity photo' : 'Selected masjid photo'} />
          <span className="badge sm teal" style={{ position: 'absolute', top: 10, right: 10 }}>
            <span className="mi" style={{ fontSize: 14 }} data-i={selfie ? 'check' : 'my_location'}></span>
            {selfie ? 'Captured' : (locationAttached ? 'Location verified' : 'Captured')}
          </span>
        </div>
        <button className="btn btn-tonal photo-retake-action" onClick={onOpen}>
          <span className="mi" data-i="photo_camera"></span>
          Retake photo
        </button>
        {!selfie && onRemove ? <button className="btn btn-link photo-remove-action" onClick={onRemove}>Remove photo</button> : null}
      </div>
    );
  }
  return (
    <div className={`photo-source-panel ${error ? 'error' : ''}`}>
      {selfie ? (
        <>
          <div className="guided-illustration-preview" aria-label="Identity photo framing guide">
            <div className="identity-guided-glow"></div>
            <div className="identity-guided-face">
              <span className="mi" data-i="person"></span>
              <span className="identity-guide-corner top-left"></span>
              <span className="identity-guide-corner top-right"></span>
              <span className="identity-guide-corner bottom-left"></span>
              <span className="identity-guide-corner bottom-right"></span>
            </div>
            <span className="identity-private-chip">
              <span className="mi" data-i="visibility_off"></span>
              Private verification
            </span>
          </div>
          <div className="photo-guidance-list">
            <div className="photo-guidance-row">
              <span className="mi" data-i="filter_center_focus"></span>
              <span><strong>Centre your face</strong><small>Keep your head inside the guide</small></span>
            </div>
            <div className="photo-guidance-row">
              <span className="mi" data-i="wb_sunny"></span>
              <span><strong>Use even light</strong><small>Avoid a bright window behind you</small></span>
            </div>
            <div className="photo-guidance-row">
              <span className="mi" data-i="visibility_off"></span>
              <span><strong>Stays private</strong><small>Never appears on your profile</small></span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="guided-illustration-preview" aria-label="Masjid entrance framing guide">
            <div className="masjid-guided-subject">
              <span className="mi fill" data-i="mosque"></span>
              <span className="identity-guide-corner top-left"></span>
              <span className="identity-guide-corner top-right"></span>
              <span className="identity-guide-corner bottom-left"></span>
              <span className="identity-guide-corner bottom-right"></span>
            </div>
          </div>
          <div className="photo-pin-guidance">
            <span className="photo-pin-marker">
              <span className="mi fill" data-i="location_on"></span>
            </span>
            <span className="photo-pin-copy">
              <strong>At the entrance pin</strong>
              <small>{locationLabel || 'Pinned masjid location'}</small>
            </span>
            <span className="mi photo-pin-confirmed" data-i="check_circle" aria-label="Entrance location confirmed"></span>
          </div>
          <div className="photo-guidance-list">
            <div className="photo-guidance-row">
              <span className="mi" data-i="filter_center_focus"></span>
              <span><strong>Frame the entrance</strong><small>Include the masjid name when visible</small></span>
            </div>
            <div className="photo-guidance-row">
              <span className="mi" data-i="wb_sunny"></span>
              <span><strong>Use even light</strong><small>Avoid glare and strong backlight</small></span>
            </div>
            <div className="photo-guidance-row">
              <span className="mi" data-i="my_location"></span>
              <span><strong>Stay near the pinned location</strong><small>The live capture is matched to the entrance pin</small></span>
            </div>
          </div>
        </>
      )}
      {error ? (
        <div className="photo-source-error" role="alert">
          <span className="mi" data-i="error"></span>
          {error}
        </div>
      ) : null}
    </div>
  );
}

function VerificationPhotoPair({ d, editable = false }) {
  return (
    <div className="review-photo-grid featured">
      <div className="review-photo">
        <img src={d.photoSrc || '../../images/masjid-camera-preview.png'} alt="Masjid entrance photo for verification" />
        {editable ? <button className="review-photo-edit" onClick={d.onEditPhoto} aria-label="Edit masjid photo">Edit</button> : null}
        <span className="review-photo-label">
          <strong>Masjid entrance</strong>
          <small>Location attached</small>
        </span>
      </div>
      <div className="review-photo selfie camera-source">
        <img src={d.selfieSrc || '../../images/identity-camera-preview.png'} alt="Applicant identity photo for verification" />
        {editable ? <button className="review-photo-edit" onClick={d.onEditSelfie} aria-label="Edit identity photo">Edit</button> : null}
        <span className="review-photo-label">
          <strong>Identity</strong>
          <small>Private</small>
        </span>
      </div>
    </div>
  );
}

function EvidenceMap({ address }) {
  return (
    <section className="review-evidence-map" aria-label={`Entrance pin for ${address}`}>
      <div className="wizard-map-grid"></div>
      <div className="wizard-map-road"></div>
      <span className="review-evidence-pin"><span className="mi fill" data-i="location_on"></span></span>
      <span className="review-evidence-label">
        <strong>Entrance pin confirmed</strong>
        <small>Matched to the live masjid photo</small>
      </span>
    </section>
  );
}

function WizardBody({ d }) {
  const step = d.step;
  if (step === 'pincode') {
    return (
      <div>
        <div style={{ ...WIZARD_TITLE, fontSize: 28, lineHeight: 1.2, marginBottom: 10 }}>Bring your masjid to Paigham</div>
        <div style={{ ...WIZARD_SUB, fontSize: 15, lineHeight: 1.55, marginBottom: 26 }}>Enter your masjid's pincode to check if it's already listed, or register it fresh.</div>
        <Field label="Pincode" error={d.errors && d.errors.pincode} mb={0}>
          <TextInput value={d.pincode} onChange={d.onPincodeChange} placeholder="6-digit pincode" maxLength={6} inputMode="numeric" code error={d.errors && d.errors.pincode} />
        </Field>
        <div style={{ fontFamily: FONT_B, fontSize: 12.5, color: 'var(--color-info-secondary)', marginTop: 14, lineHeight: 1.6 }}>Tip — try <b style={{ color: 'var(--color-info-primary)' }}>400001</b> to see claimable masjids, or any other 6 digits to see the register-new path.</div>
      </div>
    );
  }
  if (step === 'searching') {
    return (
      <div>
        <div style={{ ...WIZARD_TITLE, fontSize: 24, marginBottom: 4 }}>Searching near {d.pincode}</div>
        <div style={{ ...WIZARD_SUB, marginBottom: 18 }}>Checking for masjids already listed in this pincode…</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, background: 'var(--color-surface-card)', border: '1px solid var(--color-neutral-border)' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--color-action-background)', flexShrink: 0, animation: 'pulse 1.1s ease-in-out infinite' }}></div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ width: '60%', height: 12, borderRadius: 6, background: 'var(--color-action-background)', animation: 'pulse 1.1s ease-in-out infinite' }}></div>
                <div style={{ width: '85%', height: 10, borderRadius: 6, background: 'var(--color-action-background)', animation: 'pulse 1.1s ease-in-out infinite' }}></div>
              </div>
              <div style={{ width: 40, height: 18, borderRadius: 999, background: 'var(--color-action-background)', flexShrink: 0, animation: 'pulse 1.1s ease-in-out infinite' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (step === 'claimList') {
    return (
      <div>
        <div style={{ ...WIZARD_TITLE, fontSize: 24, marginBottom: 4 }}>Is your masjid here?</div>
        <div style={{ ...WIZARD_SUB, marginBottom: 18 }}>All listed masjids in {d.pincode}. Available masjids can be selected to continue.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
          {d.claimResults.map((m) => {
            const claimable = m.claimStatus === 'claimable';
            const pending = m.claimStatus === 'pending';
            return (
              <div key={m.id} onClick={claimable ? m.onSelect : undefined} aria-disabled={!claimable} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, cursor: claimable ? 'pointer' : 'default',
                background: m.selected ? 'var(--color-surface-secondary)' : 'var(--color-surface-card)', border: `1.5px solid ${m.selected ? 'var(--color-action-primary)' : 'var(--color-neutral-border)'}` }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: claimable ? `2px solid ${m.selected ? 'var(--color-action-primary)' : 'var(--color-info-faint)'}` : 'none',
                  background: m.selected ? 'var(--color-action-primary)' : claimable ? 'transparent' : 'var(--color-surface-secondary)' }}>
                  {m.selected && <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--color-action-primary-inverse)' }}></div>}
                  {!claimable && <span className="mi" style={{ fontSize: 14, color: pending ? 'var(--color-status-warning)' : 'var(--color-info-secondary)' }} data-i={pending ? 'schedule' : 'lock'}></span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT_B, fontSize: 15, fontWeight: 700, color: 'var(--color-info-primary)' }}>{m.name}</div>
                  <div style={{ fontFamily: FONT_B, fontSize: 12.5, color: 'var(--color-info-secondary)' }}>{m.addr}</div>
                  {!claimable && (
                    <div style={{ fontFamily: FONT_B, fontSize: 11.5, lineHeight: 1.4, color: 'var(--color-info-secondary)', marginTop: 2 }}>
                      {pending ? 'Another registration is being reviewed.' : 'Verified managers are already connected.'}
                    </div>
                  )}
                </div>
                {claimable ? (
                  <div style={{ background: 'var(--color-surface-secondary)', borderRadius: 999, padding: '4px 10px', flexShrink: 0 }}>
                    <span style={{ fontFamily: FONT_B, fontSize: 11.5, fontWeight: 700, color: 'var(--color-action-primary)' }}>{m.dist}</span>
                  </div>
                ) : (
                  <span className={`badge sm ${pending ? 'amber' : ''}`}>{pending ? 'Under review' : 'Already managed'}</span>
                )}
              </div>
            );
          })}
        </div>
        {d.errors && d.errors.claim ? <div className="helper err" role="alert" style={{ marginBottom: 12 }}>{d.errors.claim}</div> : null}
        <div onClick={d.onRegisterManually} style={{ textAlign: 'center', padding: 14, borderRadius: 14, border: '1px dashed var(--color-neutral-brand)', cursor: 'pointer' }}>
          <span style={{ fontFamily: FONT_B, fontSize: 14, fontWeight: 700, color: 'var(--color-neutral-brand)' }}>Can't find your masjid? Add it manually</span>
        </div>
      </div>
    );
  }
  if (step === 'claimEmpty') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '30px 6px 10px' }}>
        <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--color-surface-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <span className="mi" style={{ fontSize: 36, color: 'var(--color-action-primary)' }} data-i="mosque"></span>
        </div>
        <div style={{ ...WIZARD_TITLE, fontSize: 22, marginBottom: 10 }}>No listed masjids in {d.pincode} yet</div>
        <div style={{ ...WIZARD_SUB, marginBottom: 26, maxWidth: 280 }}>That just means yours could be the first. Register it now — it takes about two minutes.</div>
      </div>
    );
  }
  if (step === 'register') {
    return (
        <div>
          <div style={{ ...WIZARD_TITLE, fontSize: 26, marginBottom: 8 }}>Masjid details</div>
          <div style={{ ...WIZARD_SUB, marginBottom: 18 }}>Confirm the masjid details and exact entrance below.</div>
        {d.locationLookupFailed ? (
          <div className="resolved-location" style={{ borderColor: 'var(--color-status-warning)' }}>
            <span className="mi" style={{ color: 'var(--color-status-warning)' }} data-i="location_on"></span>
            <div style={{ fontFamily: FONT_B, fontSize: 12, lineHeight: 1.5, color: 'var(--color-info-primary)' }}>We could not position the map near this pincode. Confirm the town or locality and entrance pin below.</div>
          </div>
        ) : null}
        <Field label="Masjid name" error={d.errors && d.errors.masjidName}><TextInput value={d.masjidName} onChange={d.onMasjidNameChange} placeholder="e.g. Masjid-e-Noor" error={d.errors && d.errors.masjidName} /></Field>
        <Field label="Address and landmark" error={d.errors && d.errors.address}><TextInput value={d.address} onChange={d.onAddressChange} placeholder="Street, landmark" error={d.errors && d.errors.address} /></Field>
        <Field label="Town or locality" error={d.errors && d.errors.city}><TextInput value={d.city} onChange={d.onCityChange} placeholder="e.g. Molakalmuru" error={d.errors && d.errors.city} /></Field>
        <Field label="State" error={d.errors && d.errors.stateVal}><PickerField value={d.stateVal} placeholder="Select state" onOpen={d.onOpenStateSheet} error={d.errors && d.errors.stateVal} /></Field>
        <Field label="Pincode" error={d.errors && d.errors.pincode} mb={20}><TextInput value={d.pincode} onChange={d.onPincodeChange} maxLength={6} inputMode="numeric" code readOnly error={d.errors && d.errors.pincode} /></Field>
        <div style={{ fontFamily: FONT_B, fontSize: 13, fontWeight: 700, color: 'var(--color-info-primary)', marginBottom: 8 }}>Pin the masjid entrance</div>
        <LocationMap d={d} />
        {d.errors && d.errors.pinDropped ? <div className="helper err" role="alert">{d.errors.pinDropped}</div> : null}
      </div>
    );
  }
  if (step === 'contact') {
    return (
      <div>
        <div style={{ ...WIZARD_TITLE, fontSize: 26, marginBottom: 10 }}>Who should we contact?</div>
        <div style={{ ...WIZARD_SUB, marginBottom: 22 }}>Our verification team may call this number to confirm the details you've shared.</div>
        <Field label="Contact name" error={d.errors && d.errors.contactName} mb={0}><TextInput value={d.contactName} onChange={d.onContactNameChange} placeholder="Full name" error={d.errors && d.errors.contactName} /></Field>
      </div>
    );
  }
  if (step === 'role') {
    return (
      <div>
        <div style={{ ...WIZARD_TITLE, fontSize: 26, marginBottom: 10 }}>What's your role?</div>
        <div style={{ ...WIZARD_SUB, marginBottom: 22 }}>Your role is verified by our team before this masjid is approved.</div>
        <Field label="Your role" error={d.errors && d.errors.role} mb={0}><PickerField value={d.role} placeholder="Select your role" onOpen={d.onOpenRoleSheet} error={d.errors && d.errors.role} /></Field>
      </div>
    );
  }
  if (step === 'maslak') {
    return (
      <div>
        <div style={{ ...WIZARD_TITLE, fontSize: 26, marginBottom: 10 }}>Which maslak does the masjid follow?</div>
        <div style={{ ...WIZARD_SUB, marginBottom: 22 }}>We use this to calculate accurate salaah timings for this masjid.</div>
        <Field label="Maslak" error={d.errors && d.errors.maslak} mb={0}><PickerField value={d.maslak} placeholder="Select maslak" onOpen={d.onOpenMaslakSheet} error={d.errors && d.errors.maslak} /></Field>
      </div>
    );
  }
  if (step === 'photo') {
    return (
      <div>
        <div style={{ ...WIZARD_TITLE, fontSize: 26, marginBottom: 10 }}>Show us the masjid you are registering</div>
        <div style={{ ...WIZARD_SUB, marginBottom: 20 }}>One live entrance photo connects the application to this exact place.</div>
        <PhotoCaptureCard
          mode="masjid"
          captured={d.photoTaken}
          locationAttached={d.photoLocationAttached}
          locationLabel={d.capturePlace}
          imageSrc={d.photoSrc}
          onOpen={d.onTakePhoto}
          onRemove={d.onRemovePhoto}
          error={d.errors && d.errors.photo}
        />
      </div>
    );
  }
  if (step === 'selfie') {
    return (
      <div>
        <div style={{ ...WIZARD_TITLE, fontSize: 26, marginBottom: 10 }}>Show us who is registering</div>
        <div style={{ ...WIZARD_SUB, marginBottom: 20 }}>A private live photo connects you to this masjid submission.</div>
        <PhotoCaptureCard
          mode="selfie"
          captured={d.selfieTaken}
          imageSrc={d.selfieSrc}
          onOpen={d.onTakeSelfie}
          error={d.errors && d.errors.selfie}
        />
      </div>
    );
  }
  if (step === 'review') {
    return (
      <div className="review-folio-live">
        <span className="review-folio-kicker">Submission folio</span>
        <div style={{ ...WIZARD_TITLE, fontSize: 28, marginBottom: 6 }}>{d.masjidSummaryName}</div>
        <div className="review-full-address">
          <span className="mi" data-i="location_on"></span>
          <span>{d.masjidSummaryAddr}</span>
        </div>

        <EvidenceMap address={d.masjidSummaryAddr} />

        <div className="review-section-head">
          <span className="review-section-title">Verification photos</span>
          <span className="badge sm teal">2 required</span>
        </div>
        <VerificationPhotoPair d={d} editable />

        <section className="review-folio-sheet">
          <div className="review-folio-sheet-head">
            <span>Application summary</span>
            <span className="badge sm teal">Complete</span>
          </div>
          <div className="review-folio-row"><span>Contact</span><strong>{d.contactName}</strong></div>
          <div className="review-folio-row"><span>Role</span><strong>{d.role}</strong></div>
          <div className="review-folio-row"><span>Maslak</span><strong>{d.maslak}</strong></div>
          <div className="review-folio-row"><span>Location</span><strong>Entrance pin confirmed</strong></div>
          <button className="btn btn-tonal review-edit-application" onClick={d.onEditRegister}>
            <span className="mi" data-i="edit"></span>
            Edit application
          </button>
        </section>
      </div>
    );
  }
  return null;
}

function PendingFolioScreen({ d }) {
  return (
    <div className="outcome-screen pending-folio-live">
      <main className="pending-folio-scroll">
        <span className="review-folio-kicker">Submission receipt</span>
        <div className="outcome-title" style={{ ...WIZARD_TITLE, fontSize: 28, marginBottom: 8 }}>We have it from here</div>
        <div style={{ ...WIZARD_SUB, marginBottom: 20 }}>Your application is safely with the verification team.</div>

        <section className="pending-receipt">
          <div className="pending-receipt-head">
            <span className="pending-receipt-icon"><span className="mi fill" data-i="mosque"></span></span>
            <span>
              <strong>{d.masjidSummaryName}</strong>
              <small>{d.masjidSummaryAddr}</small>
            </span>
          </div>
          <div className="pending-receipt-divider"></div>
          <div className="pending-status">
            <span className="mi" data-i="hourglass_top"></span>
            <span><small>Current status</small><strong>Under review</strong></span>
            <span className="badge sm amber">2 to 3 days</span>
          </div>
          <div className="pending-receipt-list">
            <div><span>Applicant</span><strong>{d.contactName}</strong></div>
            <div><span>Role</span><strong>{d.role}</strong></div>
            <div><span>Submitted</span><strong>{d.submittedDate}</strong></div>
            <div><span>Reference</span><strong>MAS-2048</strong></div>
          </div>
          <div className="pending-receipt-divider"></div>
          <div className="review-section-head">
            <span className="review-section-title">Submitted photos</span>
            <span className="badge sm teal">2 received</span>
          </div>
          <VerificationPhotoPair d={d} />
        </section>

        <div className="pending-notification-note">
          <span className="mi" data-i="notifications"></span>
          <span>We will notify you when the status changes.</span>
        </div>
      </main>
      <div className="pending-folio-actions">
        <button className="btn btn-filled lg" onClick={d.onDone}>Done, take me home</button>
        <button className="btn btn-tonal lg" onClick={d.onUpdate}>Update details</button>
        <button className="btn btn-link sm" onClick={d.onTogglePreview}>Preview rejected state</button>
      </div>
    </div>
  );
}

function WizardScreen({ data = {} }) {
  const d = data;
  const dots = Array.from({ length: 8 }, (_, i) => (i + 1) <= d.progressIndex);
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--color-surface-primary)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <div className="app-bar" style={{ height: 130, flexShrink: 0, position: 'relative', padding: '54px 20px 14px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="ib ib-tonal md" onClick={d.onBack} aria-label="Back"><span className="mi" data-i="arrow_back"></span></button>
          <span className="ab-title" style={{ flex: 1, fontSize: 23 }}>Register masjid</span>
          <span style={{ fontFamily: FONT_B, fontSize: 12, fontWeight: 700, color: 'var(--color-info-secondary)', whiteSpace: 'nowrap', flexShrink: 0 }}>Step {d.progressIndex} of 8</span>
        </div>
        <div className="stepbar" role="progressbar" aria-valuemin={1} aria-valuemax={dots.length} aria-valuenow={d.progressIndex}>
          {dots.map((on, i) => <span key={i} className={on ? 'on' : ''}></span>)}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 16px', position: 'relative' }}>
        <WizardBody d={d} />
        <OptionSheet isOpen={d.roleSheetOpen} title="Select your role" options={d.roleOptions} value={d.role} onPick={d.onSelectRole} onClose={d.onCloseSheets} />
        <OptionSheet isOpen={d.maslakSheetOpen} title="Select maslak" options={d.maslakOptions} value={d.maslak} onPick={d.onSelectMaslak} onClose={d.onCloseSheets} />
        <OptionSheet isOpen={d.stateSheetOpen} title="Select state" options={d.stateOptions} value={d.stateVal} onPick={d.onSelectState} onClose={d.onCloseSheets} />
      </div>

      {/* Progress above the bar and outside it, never inside the button: a spinner where
          `Submit for verification` was removes the one line that says what is being committed, at
          the moment the applicant most needs to know a two-photo upload is still running.
          Submitting is THREE requests — the entrance photo, the applicant's photo, then the
          registration itself — so the line names the step. `Uploading photos and submitting…` held
          for all three cannot distinguish a working upload from a stalled one, and these are the
          largest payloads the app sends. */}
      <div className="docked-host">
        {d.ctaBusy ? (
          <div className="docked-status status-capsule" role="status" aria-live="polite">
            <span className="status-capsule-ring" aria-hidden="true"></span>
            <b>{d.ctaBusyLabel || 'Uploading masjid photo · 1 of 3'}</b>
          </div>
        ) : null}
        <div style={{ flexShrink: 0, padding: '12px 20px 26px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn btn-filled lg" onClick={d.ctaOnClick} disabled={d.ctaDisabled || d.ctaBusy} style={{ width: '100%' }}>
          {d.ctaLabel}
        </button>
        {d.step === 'review' && !d.ctaBusy && <div style={{ textAlign: 'center', fontFamily: FONT_B, fontSize: 12, color: 'var(--color-info-secondary)' }}>A member of our team reviews every submission by hand.</div>}
        </div>
      </div>
      <CameraStage d={d} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 4 · Outcome — pending · rejected (submitting stays on the review step; see WizardScreen)
// ══════════════════════════════════════════════════════════════════════
function OutcomeScreen({ data = {} }) {
  const d = data;
  if (d.variant === 'pending') {
    return <PendingFolioScreen d={d} />;
  }
  // rejected
  return (
    <div className="outcome-screen" style={{ width: '100%', height: '100%', boxSizing: 'border-box', background: 'var(--color-surface-primary)', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '70px 24px 24px', textAlign: 'center' }}>
      <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'color-mix(in oklab, var(--color-status-error) 8%, var(--color-surface-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
        <span className="mi" style={{ fontSize: 40, color: 'var(--color-status-error)' }} data-i="info"></span>
      </div>
      <div className="outcome-title" style={{ ...WIZARD_TITLE, fontSize: 26, marginBottom: 10 }}>We couldn't verify this submission</div>
      <div style={{ ...WIZARD_SUB, marginBottom: 20, maxWidth: 290 }}>This isn't final — most masjids are approved after a quick follow-up. Here's what our team noted.</div>
      <div className="outcome-summary" style={{ width: '100%', boxSizing: 'border-box', background: 'var(--color-surface-card)', borderRadius: 16, border: '1px solid var(--color-neutral-border)', padding: 16, textAlign: 'left', marginBottom: 24 }}>
        <div style={{ fontFamily: FONT_B, fontSize: 12, fontWeight: 700, color: 'var(--color-info-secondary)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Reason noted by our team</div>
        <div style={{ fontFamily: FONT_B, fontSize: 14, lineHeight: 1.6, color: 'var(--color-info-primary)' }}>We couldn't reach {d.contactName} on the contact number provided. Please re-apply with an active number our team can call.</div>
      </div>
      <button className="btn btn-filled lg" onClick={d.onReapply} style={{ width: '100%', marginBottom: 12 }}>Re-apply</button>
      <button className="btn btn-tonal lg" onClick={d.onContactSupport} style={{ width: '100%', marginBottom: 14 }}>Contact support</button>
      <div onClick={d.onTogglePreview} style={{ cursor: 'pointer' }}><span style={{ fontFamily: FONT_B, fontSize: 12, color: 'var(--color-info-secondary)', borderBottom: '1px solid var(--color-info-secondary)' }}>Back to pending preview</span></div>
    </div>
  );
}

Object.assign(window, {
  MyMasjidsSheet, WizardScreen, OutcomeScreen,
  MASJID_MANAGE_DATA: MANAGE_DATA, MASJID_FOLLOW_DATA: FOLLOW_DATA, MASJID_REGISTRATION_DATA: REGISTRATION_DATA, MASJID_CLAIM_DATA: CLAIM_DATA,
  MASJID_ROLE_LIST: ROLE_LIST, MASJID_MASLAK_LIST: MASLAK_LIST, MASJID_STATE_LIST: STATE_LIST
});

// Shared screen components for the Personal Details section board.
// Used by both the static storyboard (details-row.jsx) and the live interactive device
// (Personal Details.dc.html). Mirrors the app's onboarding/personaldetails module
// (PersonalDetailsScreen.kt, GenderSelector.kt, SuccessCelebrationOverlay.kt).

// ── "Almost There!" app bar (DS .app-bar) — shared by the form + success screens ──
function AlmostThereAppBar({ onBack }) {
  return (
    <div className="app-bar" style={{ alignItems: 'center', gap: 14, height: 96, padding: '52px 16px 10px' }}>
      <button className="ib ib-tonal md" onClick={onBack} aria-label="Back"><span className="mi" data-i="arrow_back"></span></button>
      <div className="ab-title">Almost There!</div>
    </div>
  );
}

// One accessible Noor choice card (Brother/Sister).
function GenderCard({ illustration, label, selected, onClick, disabled = false }) {
  return (
    <button className={`choice-card ${selected ? 'selected' : ''}`} role="radio" aria-checked={selected ? 'true' : 'false'} disabled={disabled} onClick={onClick}>
      <span className="choice-card-art" aria-hidden="true">{illustration}</span>
      <span className="choice-card-label">{label}</span>
      <span className="mi" aria-hidden="true" data-i={selected ? 'radio_button_checked' : 'radio_button_unchecked'}></span>
    </button>
  );
}

// PERSONAL DETAILS — profile completion form (PersonalDetailsScreen.kt). Complete Setup validates:
// name < 3 chars → nameError, no gender → genderError (the gender row shakes via `shakeKey`).
// `intro` and `actionText` default to onboarding's copy. The invitation inbox reuses this screen for a
// member who accepts a committee role before ever giving a name, and only those two sentences differ.
function PersonalDetailsScreen({ name = '', onNameTap, gender = null, onSelectGender, onCompleteSetup, onBack, onRetry, onDismissError, nameError = false, genderError = false, loading = false, submitStatus = null, serviceError = false, shakeKey = 0, intro = 'Tell us how to address you before we finish following your selected masjids.', actionText = 'Complete Setup' }) {
  const APPBAR_H = 96;
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: 'var(--color-surface-primary)' }}>
      {/* Content scrolls under the app bar */}
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingTop: APPBAR_H, paddingBottom: 96, boxSizing: 'border-box' }}>
        <div style={{ padding: '18px 24px 0' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.55, color: 'var(--color-info-secondary)' }}>{intro}</div>

          {/* Full Name */}
          <div style={{ marginTop: 28 }}>
            <div className="flabel">Full Name</div>
            <div className={`input ${nameError ? 'error' : ''}`} onClick={onNameTap} style={{ cursor: 'text' }}>
              <div className="inner">
                <div className="val">{name ? <span>{name}</span> : <span className="ph">Enter your full name</span>}</div>
              </div>
            </div>
            <div className="helper err" style={{ minHeight: 20 }}>{nameError ? 'Please enter your full name' : ''}</div>
          </div>

          {/* Gender */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--color-input-text)', marginBottom: 12 }}>How should we address you?</div>
            <div key={shakeKey} className="choice-group" role="radiogroup" aria-label="How should we address you?" style={{ animation: genderError ? 'ptshake var(--motion-emphasized) var(--ease-out)' : 'none' }}>
              <GenderCard illustration="👳🏻" label="Brother" selected={gender === 'male'} disabled={loading} onClick={() => onSelectGender && onSelectGender('male')} />
              <GenderCard illustration="🧕🏻" label="Sister" selected={gender === 'female'} disabled={loading} onClick={() => onSelectGender && onSelectGender('female')} />
            </div>
            <div className="helper err" style={{ minHeight: 20, marginTop: 8 }}>{genderError ? 'Please select your gender' : ''}</div>
          </div>
        </div>
      </div>

      <AlmostThereAppBar onBack={onBack} />

      {/* Bottom bar — Complete Setup (CompleteSetupBottomBar). Progress sits above the bar and
          OUTSIDE it, in a `.docked-host`, so its offset comes from the bar's real height instead
          of a `calc()` that has to be re-derived every time the bar's padding changes.
          Completing setup is THREE chained requests in a fixed order — save the name and gender,
          follow every selected masjid, then confirm with the server that onboarding really is
          complete — so the line names the one that is running. One sentence held across all three
          cannot tell a working request from a stalled one, and this is the slowest submit in the
          app on a first install. */}
      <div className="docked-host" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        {loading && (
          <div className="docked-status status-capsule" role="status" aria-live="polite">
            <span className="status-capsule-ring" aria-hidden="true"></span>
            <b>{submitStatus || 'Saving your details · 1 of 3'}</b>
          </div>
        )}
        <div style={{ padding: '12px 16px 28px', background: 'var(--color-surface-primary)', boxSizing: 'border-box' }}>
          <button className="btn btn-filled lg" disabled={loading} aria-busy={loading ? 'true' : 'false'} onClick={onCompleteSetup} style={{ width: '100%' }}>
            {actionText}
          </button>
        </div>
      </div>

      {serviceError && (
        <div className="dlg-scrim sheet" role="alertdialog" aria-modal="true" aria-labelledby="details-error-title">
          <div className="dlg">
            <div className="dlg-handle"></div>
            <div id="details-error-title" className="dlg-title">We could not save your details</div>
            <div className="dlg-desc">Check your connection and try again. Your entries are still here.</div>
            <div className="dlg-actions">
              <button className="btn btn-tonal" onClick={onDismissError}>Dismiss</button>
              <button className="btn btn-filled" onClick={onRetry}>Retry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Deterministic confetti using semantic theme colors. Pieces drift and rotate in place via
// the `confettidrift` keyframe declared in the board helmet.
const CONFETTI_COLORS = [
  'var(--color-action-primary)',
  'var(--color-action-secondary)',
  'var(--color-status-error)',
  'var(--color-status-warning)',
  'var(--color-status-warning-alt)',
  'var(--color-neutral-brand)'
];
function Confetti({ count = 46 }) {
  const rnd = (i, s) => { const x = Math.sin((i + 1) * s) * 10000; return x - Math.floor(x); };
  const pieces = Array.from({ length: count }, (_, i) => ({
    left: rnd(i, 12.9898) * 100,
    top: rnd(i, 78.233) * 96,
    w: 5 + rnd(i, 5.5) * 5,
    h: 8 + rnd(i, 9.1) * 8,
    rot: Math.round(rnd(i, 3.14) * 360),
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: (rnd(i, 2.2) * 2).toFixed(2)
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {pieces.map((p, i) => (
        <div key={i} style={{ position: 'absolute', left: p.left + '%', top: p.top + '%' }}>
          <div style={{ width: p.w, height: p.h, background: p.color, borderRadius: 'var(--radius-xs)', transform: `rotate(${p.rot}deg)`, animation: `confettidrift var(--motion-celebration) ${p.delay}s var(--ease-out) both` }} />
        </div>
      ))}
    </div>
  );
}

// SUCCESS - celebration after Complete Setup. Continue returns to Home.
function SuccessScreen({ onBack, onContinue }) {
  const features = [
    'View Jamaah timings for your masjids',
    'Stay updated with Qaum announcements',
    'Never miss community events'
  ];
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: 'var(--color-surface-primary)' }}>
      <Confetti />
      <AlmostThereAppBar onBack={onBack} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center' }}>
        <span className="mi" data-i="check_circle" style={{ fontSize: 96, color: 'var(--color-action-primary)' }}></span>
        <div style={{ marginTop: 20, fontFamily: 'var(--font-title)', fontSize: 34, lineHeight: 1.15, color: 'var(--color-info-primary)' }}>Welcome to Paigham!</div>
        <div style={{ marginTop: 12, fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.5, color: 'var(--color-info-secondary)' }}>Your profile is ready and your selected masjids are now followed.</div>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {features.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--color-info-secondary)' }}>
              <span className="mi" data-i="check" style={{ fontSize: 18, color: 'var(--color-info-secondary)' }}></span>
              <span>{t}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-filled lg" onClick={onContinue} style={{ width: '100%', marginTop: 24 }}>Continue to Home</button>
      </div>
    </div>
  );
}

Object.assign(window, { PersonalDetailsScreen, SuccessScreen });

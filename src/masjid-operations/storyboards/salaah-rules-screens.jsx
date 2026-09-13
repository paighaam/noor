// Salaah timing rules — the two pages that own how a masjid's timings update through the year.
//
//   Salaah timings  ──info──▶  How timings update  ──prayer row──▶  Prayer timing rule
//
// Both pages edit ONE draft and neither publishes: the docked `Publish timings` action on the
// timings screen stays the single moment six rules become public (spec §2.5). That is why this
// page's only footer is a sentence, not a button — a second publish affordance here would make
// the same change reachable two ways and land it from a screen that cannot show its result.
//
// Everything is rendered from `buildSrData` in ./salaah-rules-state.js, the same assembly the
// storyboard frames use, so a static frame cannot drift from the live device.
//
// Construction comes from the kit: `.list-group`/`.list-item` for the summary rows,
// `.choice-card.rich` for the three rule choices, `.summary-hero` for the live preview,
// `.empty-state` for the full-page load states, `.snack`, `.skeleton`. This module adds only the
// feature's own marks (see ./salaah-rules.css).

const SRL_APPBAR_H = 114; // 54px status inset + 48px control row + 12px bottom
const SRL_VARIANTS = window.SR_VARIANTS || { ON_TIME: 'ON_TIME', FIXED: 'FIXED', VARIES: 'VARIES_WITH_ON_TIME' };

const srFmt = (mins) => (window.srFormat ? window.srFormat(mins) : '—');
const srFmtShort = (mins) => (window.srFormatShort ? window.srFormatShort(mins) : '—');

// ══════════════════════════════════════════════════════════════════════
// Shell
// ══════════════════════════════════════════════════════════════════════

function SrlShell({ children }) {
  return <div className="srl-shell">{children}</div>;
}

// The app bar floats over the body and the body carries its height as a top inset, so content
// scrolls UNDER the haze rather than starting after it — the fade only reads with something behind it.
function SrlAppBar({ title, subtitle, subtitleAccent, onBack, trailing }) {
  return (
    <div className="app-bar" style={{
      alignItems: 'center', gap: 12, minHeight: SRL_APPBAR_H,
      padding: '54px 16px 12px', boxSizing: 'border-box',
    }}>
      {/* The kit's `.ab-haze`, which OCCLUDES. `.app-bar::before` only blurs, and a blur with no
          surface behind it leaves near-black body text legible straight through the title — on a page
          this scrollable that reads as the screen being broken. The haze carries a real surface and
          fades out at its bottom edge, so content still passes under the bar rather than being cut
          off at a hard line. */}
      <div className="ab-haze" style={{ height: '100%', zIndex: -1 }} aria-hidden="true"></div>
      <button type="button" className="ib ib-tonal" onClick={onBack} aria-label="Back">
        <span className="mi" data-i="arrow_back" aria-hidden="true"></span>
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* The row height is a MINIMUM: at larger dynamic-text scales a two-line title has to be
            allowed to grow rather than be clipped. */}
        <div className="ab-title" style={{ fontSize: 22, lineHeight: 1.15 }}>{title}</div>
        {subtitle ? (
          <div
            className={subtitleAccent ? 'srl-appbar-state' : undefined}
            style={{ fontSize: 12, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-info-secondary)' }}
          >{subtitle}</div>
        ) : null}
      </div>
      {trailing || <div style={{ width: 48, flexShrink: 0 }} />}
    </div>
  );
}

function SrlBody({ children, gap = 14, bottomInset = 40 }) {
  return (
    <div className="srl-body" style={{ gap, paddingTop: SRL_APPBAR_H + 14, paddingBottom: bottomInset }}>
      {children}
    </div>
  );
}

function SrlSnack({ snack, onClose }) {
  if (!snack) return null;
  return (
    <div className="snack docked" role="status">
      <span className={`mi snack-icon ${snack.tone === 'error' ? 'error' : ''}`} data-i={snack.tone === 'error' ? 'error' : 'check_circle'} aria-hidden="true"></span>
      <span className="snack-copy">{snack.message}</span>
      <button type="button" className="snack-close" onClick={onClose} aria-label="Dismiss">
        <span className="mi" data-i="close" aria-hidden="true"></span>
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Load states — full pages, because none of them leaves anything to read behind them
// ══════════════════════════════════════════════════════════════════════

// A structure-matching skeleton, not a spinner on empty space: the lead line and six rows inside
// one card, in the geometry they will occupy, so the arrival of the real rules moves nothing.
function SrlSkeletonSummary() {
  return (
    <SrlBody>
      <span className="skeleton" style={{ width: '86%', height: 15, borderRadius: 'var(--radius-sm)' }} aria-hidden="true"></span>
      <span className="skeleton" style={{ width: '54%', height: 15, borderRadius: 'var(--radius-sm)' }} aria-hidden="true"></span>
      <div className="srl-skeleton-rows" role="status" aria-label="Loading timing rules">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div className="srl-skeleton-row" key={i}>
            <span className="skeleton" style={{ width: 22, height: 22, borderRadius: 'var(--radius-circle)' }}></span>
            <span className="srl-skeleton-copy">
              <span className="skeleton" style={{ width: '38%', height: 13, borderRadius: 'var(--radius-sm)' }}></span>
              <span className="skeleton" style={{ width: '72%', height: 11, borderRadius: 'var(--radius-sm)' }}></span>
            </span>
            <span className="skeleton" style={{ width: 54, height: 15, borderRadius: 'var(--radius-sm)' }}></span>
          </div>
        ))}
      </div>
    </SrlBody>
  );
}

function SrlFullState({ icon, tone, title, description, action }) {
  const { EmptyState } = window;
  if (!EmptyState) return null;
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', paddingTop: SRL_APPBAR_H }}>
      <EmptyState icon={icon} tone={tone} title={title} description={description} action={action} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 1 · Salaah timings — the scrolling day, dragged by rule
//
// The axis, the rows and the gesture come from ./salaah-scroll-timeline.jsx: one day, one set of
// clamping rules, shared with the shipped editor. What is different here is the COMMIT. The
// timeline reports a raw minute under the finger; `srCommitDrag` turns it into a parameter of the
// prayer's own rule, so a rounded prayer stays rounded and a sunset prayer cannot be nudged into a
// clock time. That is the whole reason this screen exists alongside the console's.
// ══════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════
// The board scan — an input accelerator, never an invisible mutation
//
// Flow: capture -> recognition -> a review SHEET -> an explicit `Add N to draft` -> a narrated
// walk that lands each value on its own row in view -> the ordinary editable draft -> Publish.
//
// What is different here from a times-only editor is the LANDING. Every value commits through the
// same path a drag uses, so on this section the reading is translated by the prayer's own rule:
// a rounded prayer snaps up to its own grid, a fixed one takes the minute, and an anchored one
// takes nothing at all. That last outcome has no equivalent on an editor that writes clock times,
// so the receipt carries it as its own kind rather than skipping the prayer in silence.
//
// Nothing here publishes. A reading is a proposal until a human presses Publish on values they
// watched land.
// ══════════════════════════════════════════════════════════════════════

// The scan LEADS the body. Dragging fifteen values by hand is the fallback path, and OCR reached
// only from a small action beside the title is an accelerator nobody finds. It is a pressable band
// rather than a description, and its tile carries the one idle animation this screen allows — a
// reading line travelling behind the glyph, because a still glyph cannot say that the camera does
// the typing.
function SrlScanCallout({ onOpenScan }) {
  return (
    <button type="button" className="summary-hero action" onClick={onOpenScan}>
      <span className="icon-tile scanning" style={{ '--tile': '38px' }}>
        <span className="mi" data-i="filter_center_focus" aria-hidden="true"></span>
      </span>
      <span className="summary-hero-copy">
        <span className="summary-hero-title" style={{ display: 'block' }}>Scan your timing board</span>
        <span className="summary-hero-label" style={{ display: 'block' }}>
          Point the camera at the board — the times come back as suggestions you check before publishing.
        </span>
      </span>
      <span className="mi" style={{ fontSize: 20, color: 'var(--color-info-faint)' }} data-i="chevron_right" aria-hidden="true"></span>
    </button>
  );
}

// The capture stage owns the whole window, so it sits at shell level rather than inside the body.
// Capture FREEZES it: the camera stops, the captured still fills the viewport and the reading line
// sweeps it. A live feed under `Reading the captured photo` reads as the capture not having
// happened, and a circular loader says busy without saying reading — so the framing guide, the
// shutter and the by-hand escape all withdraw while it reads, and the control row keeps its height
// so the still does not jump mid-read.
function SrlScanStage({ stage, onClose, onCapture, onRetry }) {
  const reading = stage === 'reading';
  const failed = stage === 'failed';
  return (
    <div className="camera-stage scan-camera-stage">
      <div className="camera-topbar">
        <button type="button" className="ib ib-tonal camera-control" aria-label="Close scanner" onClick={onClose}>
          <span className="mi" data-i="close" aria-hidden="true"></span>
        </button>
        <div className="camera-title">
          {failed ? 'Couldn’t read the board' : 'Scan the timing board'}
          {failed ? null : <small>{reading ? 'Reading the captured photo…' : 'Fill the frame with the board, square-on'}</small>}
        </div>
        <span style={{ width: 48, flexShrink: 0 }}></span>
      </div>

      {failed ? (
        <div className="fullscreen-notice">
          <span className="mi" data-i="filter_center_focus" aria-hidden="true"></span>
          <strong>The board didn’t read</strong>
          <span>
            LED boards can defeat a camera — glare, angle, or a display that scrolls. Get closer and
            square-on, or set the timings by hand; the day is one step away.
          </span>
          <button type="button" className="btn btn-filled lg" onClick={onRetry}>Try again</button>
          <button type="button" className="btn btn-link" onClick={onClose}>Set them by hand instead</button>
        </div>
      ) : (
        <React.Fragment>
          <div className="camera-viewport">
            <img src="../../images/salaah-board-sample.jpeg" alt="" />
            {reading ? null : (
              <div className="camera-guide scan-board-guide" aria-hidden="true">
                <span className="scan-guide-corner tl"></span>
                <span className="scan-guide-corner tr"></span>
                <span className="scan-guide-corner bl"></span>
                <span className="scan-guide-corner br"></span>
              </div>
            )}
            {reading ? (
              <div className="scan-reading" role="status" aria-label="Reading the captured photo">
                <div className="scan-sweep" aria-hidden="true"></div>
                <div className="scan-reading-label">
                  <span className="btn-spinner" aria-hidden="true"></span>Reading captured photo…
                </div>
              </div>
            ) : <div className="scan-capture-tip">Full board in frame · avoid glare</div>}
          </div>

          <div className="camera-controls">
            <span></span>
            {reading
              ? <span className="camera-control" style={{ width: 72 }}></span>
              : <button type="button" className="camera-shutter" aria-label="Capture the board" onClick={onCapture}></button>}
            <span></span>
          </div>
          <div className="scan-stage-foot">
            {reading ? null : <button type="button" className="btn btn-link" onClick={onClose}>Set them by hand instead</button>}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

// The receipt. A counts line, one pill per prayer in day order, the column question, then exactly
// one affirmative. Recovery explanations live with the receipt, where the committee makes its
// decision, rather than growing an in-body strip over the timeline.
//
// Every prayer gets a pill, including the ones the board did not show. A pill is a reference, so its
// time drops the meridiem, and it shows what the board PRINTED — a jamaat column prints the jamaat.
// Amber never letters here: ok pills locate with the action tint; red borders require attention.
// The reason distinguishes a timing-rule restriction from a reading outside today's window.
function SrlScanSheet({ open, rows, counts, usable, meaning, needMeaning, onMeaning, onAdd, onDiscard, onRescan, onReviewRules }) {
  const { Dialog } = window;
  if (!open || !Dialog) return null;
  const ruleBlocked = rows.some((r) => r.kind === 'anchored');
  const outsideWindow = rows.some((r) => r.kind === 'bad');
  const alreadySet = rows.some((r) => r.kind === 'same');
  const primary = !meaning
    ? { text: 'Add to draft', onClick: onAdd }
    : usable
      ? { text: `Add ${usable} to draft`, onClick: onAdd }
      : ruleBlocked || outsideWindow
        ? { text: 'Review timing rules', onClick: onReviewRules }
        : alreadySet && !outsideWindow
          ? { text: 'Back to timings', onClick: onDiscard }
          : { text: 'Set times manually', onClick: onDiscard };
  return (
    <Dialog
      mode="sheet"
      className="scan-review-sheet"
      isOpen
      onClose={onDiscard}
      title="Board read"
      description={counts}
      primary={primary}
      secondary={usable || !meaning || ruleBlocked || alreadySet
        ? { text: 'Discard reading', onClick: onDiscard }
        : { text: 'Scan again', onClick: onRescan }}
    >
      <div className="scan-sheet-pills" role="list">
        {rows.map((r) => (
          <span key={r.key} role="listitem" className={`scan-sheet-pill is-${r.kind}`}>
            {r.label}
            <em>{r.kind === 'mut' ? '—' : srFmtShort(r.printed)}</em>
            {r.kind === 'ok' ? <span className="mi" data-i="check" aria-hidden="true"></span> : null}
            {r.kind === 'bad' ? <small>Outside window</small> : null}
            {r.kind === 'anchored' ? <small>Rule: {r.note}</small> : null}
            {r.kind === 'same' ? <small>{r.note}</small> : null}
          </span>
        ))}
      </div>
      {ruleBlocked ? (
        <div className="scan-sheet-help">
          <p>Prayers marked “Rule” follow their calculated starts. Review their timing rules to use the board times.</p>
          {usable > 0 ? <button type="button" className="btn btn-link" onClick={onReviewRules}>Review timing rules</button> : null}
        </div>
      ) : null}
      {outsideWindow ? <div className="scan-sheet-help">{rows.filter((r) => r.kind === 'bad').map((r) => <p key={r.key}>{r.note}</p>)}</div> : null}
      <div className={`scan-sheet-meaning${needMeaning ? ' is-asking' : ''}`} role="radiogroup" aria-label="What the scanned column shows">
        <span className="eyebrow">What does that column show?</span>
        <div>
          {[{ value: 'jamaat', label: 'Jamaat times' }, { value: 'azaan', label: 'Azaan times' }].map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={meaning === o.value}
              className={`chip ${meaning === o.value ? 'solid' : 'outline'}`}
              onClick={() => onMeaning(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════════
// The drift offer
//
// A published FIXED azaan keeps its clock time while the calculated start slides across the year,
// so it eventually sits outside its own window. Dragging it to a new fixed time only restarts the
// clock that broke it. The durable answer is a rounding rule, and only the masjid knows whether it
// has one — so this ASKS, at drift, where the evidence is, and never on an ordinary edit.
//
// Out of flow, like the scan's companion and for the same reason: it appears and retires while a
// finger may be on the axis, and a card in flow would resize the day mid-drag. It shares that
// capsule's bottom, so the two can never sit at different heights above the same docked action —
// they never coexist, because a walk retires before anything can be found to have drifted.
// ══════════════════════════════════════════════════════════════════════

function SrlDriftOffer({ offer, onAdopt, bottom }) {
  if (!offer) return null;
  return (
    <div className="srl-drift" style={bottom ? { bottom } : undefined} role="status">
      <span className="mi" data-i="error" aria-hidden="true"></span>
      <div className="srl-drift-copy">
        {/* The card owns the OFFER and nothing else. The manual path is the screen itself, and the
            docked helper already says to drag — two lines telling the same reader to drag, stacked,
            is what the console's version was corrected for. */}
        <b>{offer.label} can no longer be called at {srFmt(offer.azaan)}</b>
        <span>
          It now begins at {srFmt(offer.opens)}, and a fixed time will drift again. Let it follow the
          prayer instead:
        </span>
        {/* ONE action, stating its own consequence. It has no dismissal: dragging the prayer back
            inside its window retires the offer, and so does accepting. */}
        <button type="button" className="chip solid" onClick={() => onAdopt && onAdopt(offer.key, offer.step)}>
          {window.srStepLabel ? window.srStepLabel(offer.step) : `Next ${offer.step} minutes`} · {srFmt(offer.today)} today
        </button>
      </div>
    </div>
  );
}

// The narrating companion. It floats above the docked action and is deliberately OUTSIDE its
// measurement: a line inside the bar would change the content's clearance and move the very rows the
// walk is landing on.
function SrlScanCapsule({ walk, bottom }) {
  if (!walk) return null;
  return (
    <div
      className={`scan-capsule status-capsule${walk.done ? ' is-done' : ''}`}
      style={bottom ? { bottom } : undefined}
      role="status"
      aria-live="polite"
    >
      {walk.done
        ? <span className="mi fill" data-i="check_circle" aria-hidden="true"></span>
        : <span className="status-capsule-ring" aria-hidden="true"></span>}
      <b>
        {walk.done
          ? `${walk.queue.length} added · publish when ready`
          : `Adding ${walk.i + 1} of ${walk.queue.length} · ${walk.queue[walk.i].label}…`}
      </b>
    </div>
  );
}

// `Add` never snaps. Each reading is scrolled into view, held under the amber landing ring, then
// committed — so the change is watched rather than discovered. Reduced motion is immediate
// replacement, not a slower walk: every value lands at once and the bar's changed-count is the
// announcement.
function useSrlScanWalk({ scrollerRef, landings, ready, onConsumed, onLand }) {
  const timer = React.useRef(null);
  const [walk, setWalk] = React.useState(null);
  const [needMeaning, setNeedMeaning] = React.useState(false);
  React.useEffect(() => () => clearTimeout(timer.current), []);

  const begin = () => {
    // The one thing the sheet cannot decide for itself. The question sits directly above the button,
    // so the press points at it instead of refusing silently — no dead affirmatives.
    if (!ready) { setNeedMeaning(true); return; }
    const queue = landings.slice();
    onConsumed && onConsumed();
    if (!queue.length) return;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { queue.forEach((it) => onLand(it)); return; }
    const step = (i) => {
      if (i >= queue.length) {
        setWalk({ queue, i: queue.length - 1, done: true });
        timer.current = setTimeout(() => setWalk(null), 1800);
        return;
      }
      const it = queue[i];
      setWalk({ queue, i, landingKey: it.key, done: false });
      // "In view" means below the app bar, not at the top of the display: this body scrolls under an
      // overlaid bar, so the reveal's lead is that bar's own height.
      const scroller = scrollerRef.current;
      const row = scroller ? scroller.querySelector(`.sst-row[data-key="${it.key}"]`) : null;
      if (scroller && row) {
        const box = scroller.getBoundingClientRect();
        const at = row.getBoundingClientRect();
        scroller.scrollTo({ top: scroller.scrollTop + (at.top - box.top) - (SRL_APPBAR_H + 16), behavior: 'smooth' });
      }
      timer.current = setTimeout(() => {
        onLand(it);
        timer.current = setTimeout(() => step(i + 1), 650);
      }, 720);
    };
    step(0);
  };

  return { walk, needMeaning, answered: () => setNeedMeaning(false), begin };
}

// The docked action. Publish is never disabled: the two reasons it can refuse need completely
// different things from the reader, and a grey button says something is wrong without saying what.
function SrlPublishBar({ data, hostRef }) {
  const { dirty, needsFirstPublish, changedCount, reachText, saving, guideSeen, onPublish } = data;
  const note = (() => {
    if (saving) return null;
    if (needsFirstPublish && !dirty) return 'This setup has never been published. Publishing makes it the masjid’s timings.';
    if (dirty) return `${changedCount} ${changedCount === 1 ? 'prayer' : 'prayers'} changed · publishing updates musalleen and records your name.`;
    if (!guideSeen) return 'Drag a prayer’s card to move its azaan, or its iqama chip to change the delay.';
    return 'Nothing has changed yet.';
  })();
  return (
    <div className="docked-host" ref={hostRef}>
      {/* Above the bar and outside it: publishing must not move the hairline or the label that
          states what is about to reach musalleen. One request, so one sentence — there is no
          sequence here to count, and a manufactured `1 of 1` says nothing. */}
      {saving ? (
        <div className="docked-status status-capsule" role="status" aria-live="polite">
          <span className="status-capsule-ring" aria-hidden="true"></span>
          <b>Publishing timings…</b>
        </div>
      ) : null}
      <div className="docked-action bordered">
        <button type="button" className="btn btn-filled lg" onClick={onPublish} disabled={saving}>
          {reachText ? `Publish to ${reachText} musalleen` : 'Publish timings'}
        </button>
        {note ? <div className="docked-action-note">{note}</div> : null}
      </div>
    </div>
  );
}

function SrlTimingsBody({ data }) {
  const {
    timelinePrayers = [], timelineJumah, cfgOf, pubOf, dragFeel,
    dayStatus, needsFirstPublish, blocked = [], onDragCommit, onDragSettle, onOpenRules, onOpenPrayer,
    scanPending, scanRows = [], scanCounts, scanUsable = 0, scanLandings = [], scanColumnMeaning,
    scanProposal, onOpenScan, onScanMeaning, onScanConsumed, onDiscardScan,
    driftOffer, onAdoptRounding,
  } = data;

  // Each prayer's rule, as the glyph in its rail button. This is how the day states that a prayer
  // is seasonal without a table above it — and the tap opens that one prayer's rule.
  const ruleOf = (key) => {
    const feel = dragFeel ? dragFeel(key) : null;
    const row = (data.rows || []).find((r) => r.key === key);
    if (!feel) return null;
    return { icon: feel.icon, label: `${row ? row.label : key} timing rule — ${row ? row.copy.short : feel.text}` };
  };

  const { SstDay, useSstDrag } = window;
  const byKey = {};
  timelinePrayers.concat(timelineJumah ? [timelineJumah] : []).forEach((p) => { byKey[p.key] = p; });

  // The gesture is the timeline's; the translation is ours. `onCommit` fires on every move, so the
  // card's position comes straight back out of the rule it just wrote — which is what makes a
  // rounded prayer JUMP between its legal slots under the finger instead of sliding and snapping
  // only on release.
  const drag = (useSstDrag || (() => ({})))({
    cfgOf,
    prayerOf: (key) => byKey[key],
    onCommit: (key, value, meta) => onDragCommit && onDragCommit(key, value, meta),
    onSettle: (key, value, meta) => onDragSettle && onDragSettle(key, value, meta),
    live: true,
  });

  // The reading's place ON the day, behind the sheet: an amber dot at the proposed minute and a
  // `BOARD 5:15` overline on the chip. The big value stays the CURRENT time — the card's position
  // IS that value, so a proposal may annotate it but never replace it.
  const scanOf = (p) => (scanProposal ? scanProposal[p.key] || null : null);

  // Landing a reading is an ORDINARY DRAFT EDIT: it goes through the same commit a drag uses, so
  // afterwards nothing can tell a landed timing from a dragged one and there is no second path into
  // the config. On this section that also means the prayer's own rule decides what the minute MEANS
  // — which is why `scanLandings` excludes the prayers whose rule can take no clock time.
  const scrollerRef = React.useRef(null);

  // Both floats sit above the docked bar and OUTSIDE its measurement, so they have to be told how
  // tall it currently is. A constant will not do on this screen: the bar's note wraps to two lines
  // once a change exists and to three while the drag guide is still showing, which is a 24dp swing —
  // enough for a card pinned at a fixed offset to clear the bar in one state and be buried by it in
  // the next. Same reasoning as the content's own clearance, which is measured for the same reason.
  const dockRef = React.useRef(null);
  const [dockHeight, setDockHeight] = React.useState(0);
  React.useLayoutEffect(() => {
    const node = dockRef.current;
    if (!node) return undefined;
    const read = () => setDockHeight(node.offsetHeight);
    read();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const floatBottom = dockHeight ? dockHeight + 12 : undefined;

  const scan = useSrlScanWalk({
    scrollerRef,
    landings: scanLandings,
    ready: !!scanColumnMeaning,
    onConsumed: onScanConsumed,
    onLand: (it) => {
      const value = { azaan: it.azaan, iqama: it.iqama };
      onDragCommit && onDragCommit(it.key, value, { field: 'azaan', source: 'scan' });
      onDragSettle && onDragSettle(it.key, value, { field: 'azaan', source: 'scan' });
    },
  });

  if (dayStatus !== 'loaded') {
    return (
      <>
        <SrlBody>
          <div className="srl-context" role="status">
            <span className="mi" data-i="schedule" aria-hidden="true"></span>
            <div className="srl-context-copy">
              <strong>{dayStatus === 'loading' ? 'Working out today’s prayer times…' : 'Today’s prayer times are unavailable'}</strong>
              <span>
                {dayStatus === 'loading'
                  ? 'The day is drawn from the calculated prayer starts, so the axis waits for them rather than guessing at a position.'
                  : 'The saved rules are readable from the info action, but nothing can be placed on a day we cannot calculate.'}
              </span>
            </div>
          </div>
          {dayStatus === 'loading' ? (
            <span className="skeleton" style={{ width: '100%', height: 320, borderRadius: 'var(--radius-card)' }} aria-hidden="true"></span>
          ) : null}
          <button type="button" className="btn btn-tonal lg" onClick={onOpenRules} style={{ marginTop: 4 }}>
            <span className="mi" data-i="settings" style={{ fontSize: 20 }} aria-hidden="true"></span>
            How timings update
          </button>
        </SrlBody>
        <SrlPublishBar data={data} />
      </>
    );
  }

  return (
    <>
      <div
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}
        onPointerMove={drag.onMove}
        onPointerUp={drag.onRelease}
        onPointerCancel={drag.onRelease}
      >
        {/* pan-y so the day scrolls from the gutter and the empty bands, while the cards' own
            touch-action:none keeps the drag. Touch the prayer and you move it; touch anywhere else
            and you move the day. */}
        <div ref={scrollerRef} className="srl-body" style={{ gap: 12, paddingTop: SRL_APPBAR_H + 12, paddingBottom: 16, touchAction: 'pan-y' }}>
          {/* Withdrawn while a reading is pending — the sheet owns the scan then — and for the whole
              walk: a "scan the board" invitation over readings that are still landing competes with
              its own result, and anything appearing above the day mid-walk would ride the row the
              walk had just revealed back up behind the app bar. */}
          {!scanPending && !scan.walk ? <SrlScanCallout onOpenScan={onOpenScan} /> : null}

          {needsFirstPublish ? (
            <div className="srl-context seed" role="status">
              <span className="mi" data-i="info" aria-hidden="true"></span>
              <div className="srl-context-copy">
                <strong>Not published yet</strong>
                <span>These are the timings we found for this masjid. Publish them to make them the masjid’s own.</span>
              </div>
            </div>
          ) : null}

          {/* The prayer the drift offer speaks for is deliberately skipped here: one fault, one
              statement, and the one carrying an action wins. This card keeps every fault the offer
              cannot serve — an incomplete rule, a jamaat spilling past its close, and a drifted
              prayer whose masjid has no readable rounding habit to offer. */}
          {(() => {
            const say = blocked.find((b) => !driftOffer || b.key !== driftOffer.key);
            if (!say) return null;
            return (
              <div className="srl-context blocked" role="alert">
                <span className="mi" data-i="error" aria-hidden="true"></span>
                <div className="srl-context-copy">
                  <strong>{say.label} can no longer be called at that time</strong>
                  <span>
                    {say.malformed
                      ? say.malformed
                      : `${say.fault.text} Drag it back inside its window, or change how it updates so it follows the prayer.`}
                  </span>
                </div>
              </div>
            );
          })()}

          {SstDay ? (
            <SstDay
              prayers={timelinePrayers}
              cfgOf={cfgOf} pubOf={pubOf} scanOf={scanOf}
              drag={drag.drag} bad={drag.bad} live onGrab={drag.onGrab}
              landingKey={scan.walk ? scan.walk.landingKey : null}
              ruleOf={ruleOf} onRule={onOpenPrayer}
            />
          ) : null}

          {/* Jumah is weekly and takes Zohar's place, so it gets its own axis at the same scale
              rather than a position on a day that is showing today. */}
          {timelineJumah && SstDay ? (
            <div className="sst-friday">
              <div className="sst-friday-head">
                <span className="sst-eyebrow">EVERY FRIDAY</span>
                <small>Replaces Zohar</small>
              </div>
              <SstDay
                prayers={[timelineJumah]}
                cfgOf={cfgOf} pubOf={pubOf} scanOf={scanOf}
                spanFrom={timelineJumah.opens} spanTo={timelineJumah.closes} breaks={[]} showNow={false}
                drag={drag.drag} bad={drag.bad} live onGrab={drag.onGrab}
                landingKey={scan.walk ? scan.walk.landingKey : null}
                ruleOf={ruleOf} onRule={onOpenPrayer}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* The reading LANDS as a sheet, not as prose above the day. Modal on purpose: a drag and an
          unanswered reading can then never coexist, so there is no per-edit reconciliation to do. */}
      <SrlScanSheet
        open={!!scanPending && !scan.walk}
        rows={scanRows}
        counts={scanCounts}
        usable={scanUsable}
        meaning={scanColumnMeaning}
        needMeaning={scan.needMeaning}
        onMeaning={(v) => { scan.answered(); onScanMeaning && onScanMeaning(v); }}
        onAdd={scan.begin}
        onDiscard={onDiscardScan}
        onRescan={onOpenScan}
        onReviewRules={onOpenRules}
      />

      <SrlScanCapsule walk={scan.walk} bottom={floatBottom} />

      {/* Withheld while a reading is pending or landing: the sheet is modal and the walk owns the
          screen, so an offer under either is a card nobody can act on. */}
      <SrlDriftOffer
        offer={!scanPending && !scan.walk ? driftOffer : null}
        onAdopt={onAdoptRounding}
        bottom={floatBottom}
      />

      <SrlPublishBar data={data} hostRef={dockRef} />
    </>
  );
}

// A landed publish takes the whole screen. A toast sliding off a view that still looks mid-edit
// does not say that the masjid's times just changed for everyone.
function SrlPublishedBody({ data }) {
  const { reachText, onDone } = data;
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 24px', gap: 12 }}>
      <div className="empty-state-icon" style={{ background: 'color-mix(in oklab,var(--color-status-success) 14%,transparent)', color: 'var(--color-status-success)' }} aria-hidden="true">
        <span className="mi fill" data-i="check_circle"></span>
      </div>
      <div className="empty-state-title" role="status">Timings published</div>
      <div className="empty-state-description">
        All {reachText} musalleen see the new azaan and iqama times now, and the change is recorded in your name.
      </div>
      <div className="empty-state-action">
        <button type="button" className="btn btn-filled lg" onClick={onDone}>Done</button>
      </div>
    </div>
  );
}

// The read-only record. Timings are public and nothing is reviewed, so the record IS the safeguard.
function SrlHistorySheet({ data }) {
  const { Dialog } = window;
  if (!Dialog) return null;
  const { history = [], historyOpen, onCloseHistory } = data;
  return (
    <Dialog
      mode="sheet"
      isOpen={!!historyOpen}
      onClose={onCloseHistory}
      title="Timing changes"
      description="Every published change, and who published it."
      primary={null}
      secondary={null}
    >
      <div className="list-group flush" role="list">
        {history.map((entry) => (
          <div className="list-item" role="listitem" key={entry.id}>
            <span className="list-item-copy">
              <span className="list-item-title">{entry.by}</span>
              <span className="list-item-subtitle">{entry.role} · {entry.when}<br />{entry.changes.join(' · ')}</span>
            </span>
          </div>
        ))}
      </div>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 2 · How timings update — the readable summary, and the way into every rule
// ══════════════════════════════════════════════════════════════════════

// The row's right-hand column: today's answer. It states nothing when the calculated day has not
// resolved, because a rule page that invents a time is worse than one that admits it is waiting.
function SrlRowTime({ row, dayStatus }) {
  if (row.malformed) {
    return <span className="srl-row-time bad"><b>—</b><small>needs a fix</small></span>;
  }
  if (dayStatus === 'loading' || (!row.dayReady && dayStatus !== 'error')) {
    return (
      <span className="srl-row-time" aria-label="Loading today’s time">
        <span className="skeleton" style={{ width: 52, height: 14, borderRadius: 'var(--radius-sm)' }}></span>
      </span>
    );
  }
  if (!row.dayReady || row.resolved.azaan == null) {
    // A fixed rule still knows its own clock time with no calculated day; the others do not.
    const cfg = row.cfg || {};
    if (cfg.variant === SRL_VARIANTS.FIXED && cfg.salaahTime) {
      return <span className="srl-row-time"><b>{srFmt(window.srToMinutes(cfg.salaahTime))}</b><small>every day</small></span>;
    }
    return <span className="srl-row-time"><b>—</b><small>day unavailable</small></span>;
  }
  // The azaan alone. The jamaat was here too and made every row a four-value read; it belongs on
  // the prayer's own page, where there is room for it and a control beside it.
  return <span className={`srl-row-time ${row.fault ? 'bad' : ''}`}><b>{srFmt(row.resolved.azaan)}</b></span>;
}

// One prayer's rule, as a LABEL. It used to run "Next quarter-hour after Fajr begins · not before
// 4:45 · iqama 20 min" — three facts and a clause, six times over, which is a page nobody reads.
// The rule's own name is what distinguishes the rows; everything else lives one tap in.
const srlRowSubtitle = (row) => row.copy.short;

function SrlSummaryBody({ data }) {
  const { rows = [], dayStatus, origin, needsFirstPublish, changedCount, blocked = [], onOpenPrayer, focusPrayer, onFocused } = data;
  const rowRefs = React.useRef({});

  // Focus returns to the row a rule page was opened from (spec §15). Without this, leaving a
  // detail page drops focus at the top of the document and a keyboard or switch user has to walk
  // the whole list back to where they were.
  React.useEffect(() => {
    if (!focusPrayer) return;
    const node = rowRefs.current[focusPrayer];
    if (node && node.focus) node.focus({ preventScroll: false });
    if (onFocused) onFocused();
  }, [focusPrayer]);

  return (
    <SrlBody>
      {needsFirstPublish ? (
        <div className="srl-context seed" role="status">
          <span className="mi" data-i="info" aria-hidden="true"></span>
          <div className="srl-context-copy">
            <strong>Not published yet</strong>
            <span>{origin === 'sourced' ? 'Found for this masjid. No musalli sees these yet.' : 'Paigham’s starting setup for a new masjid.'}</span>
          </div>
        </div>
      ) : null}

      {blocked.length ? (
        <div className="srl-context blocked" role="alert">
          <span className="mi" data-i="error" aria-hidden="true"></span>
          <div className="srl-context-copy">
            <strong>
              {blocked.length === 1
                ? `${blocked[0].label} cannot be published as it stands`
                : `${blocked.length} prayers cannot be published as they stand`}
            </strong>
            <span>Open it to correct it. Publishing is refused until then.</span>
          </div>
        </div>
      ) : null}

      {changedCount ? (
        <div className="srl-context changed" role="status">
          <span className="mi" data-i="edit" aria-hidden="true"></span>
          <div className="srl-context-copy">
            <strong>{changedCount === 1 ? '1 rule changed' : `${changedCount} rules changed`}</strong>
            <span>Nothing has reached musalleen yet.</span>
          </div>
        </div>
      ) : null}

      {dayStatus === 'error' ? (
        <div className="srl-context" role="status">
          <span className="mi" data-i="error" aria-hidden="true"></span>
          <div className="srl-context-copy">
            <strong>Today’s prayer times are unavailable</strong>
            <span>The rules below are exactly what is saved; today’s answers cannot be shown.</span>
          </div>
        </div>
      ) : null}

      <div className="list-group flush" role="list" style={{ marginTop: 4 }}>
        {rows.map((row) => (
          <React.Fragment key={row.key}>
            <button
              type="button"
              role="listitem"
              ref={(node) => { rowRefs.current[row.key] = node; }}
              className={`list-item actionable srl-row ${row.changed ? 'changed' : ''} ${row.fault || row.malformed ? 'bad' : ''}`}
              onClick={() => onOpenPrayer && onOpenPrayer(row.key)}
              aria-label={`${row.label} — ${row.copy.title}. ${row.changed ? 'Changed. ' : ''}Open timing rule`}
            >
              <span className="list-item-copy">
                <span className="list-item-title">{row.label}</span>
                <span className="srl-row-rule">
                  <small>{srlRowSubtitle(row)}</small>
                </span>
              </span>
              <SrlRowTime row={row} dayStatus={dayStatus} />
              <span className="mi list-item-chevron" data-i="chevron_right" aria-hidden="true"></span>
            </button>
            {row.malformed || row.fault ? (
              <div className="srl-row-fault">
                <span className="mi" data-i="error" aria-hidden="true"></span>
                <span>{row.malformed || row.fault.text}</span>
              </div>
            ) : null}
          </React.Fragment>
        ))}
      </div>

      <p className="srl-foot">Changes stay in your draft until you publish timings.</p>
    </SrlBody>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 2 · Prayer timing rule — one prayer, three choices, only the fields its rule owns
// ══════════════════════════════════════════════════════════════════════

/**
 * The kit's select: a `.picker-field` that opens a `.dd-menu`. It replaced a −5/−1/+1/+5 button row
 * — five controls per value, twenty on the screen, and none of them said what the value could be.
 * A select states the value, opens the real options, and is the same control the rest of the app
 * uses for a choice.
 */
function SrlSelect({ label, value, options, open, onOpen, onPick, error, maxHeight = 200 }) {
  const menu = React.useRef(null);
  // Open ON the chosen option. A 100-entry menu that starts at the top makes the reader hunt for the
  // value the field is already showing them.
  React.useEffect(() => {
    if (!open || !menu.current) return;
    const chosen = menu.current.querySelector('.dd-item.selected');
    if (chosen) chosen.scrollIntoView({ block: 'center' });
  }, [open]);
  return (
    <div className="field">
      {label ? <div className="flabel">{label}</div> : null}
      <button
        type="button"
        className={`picker-field ${error ? 'error' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={!!open}
        onClick={() => onOpen(!open)}
      >
        <span className="picker-field-value">{(options.find((o) => o.value === value) || {}).label || value}</span>
        <span className="mi" data-i="expand_more" aria-hidden="true"></span>
      </button>
      {open ? (
        <div className="dd-menu" role="listbox" ref={menu} style={{ maxHeight, overflowY: 'auto' }}>
          {options.map((o) => (
            <div
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={`dd-item ${o.value === value ? 'selected' : ''}`}
              onClick={() => { onPick(o.value); onOpen(false); }}
            >
              {o.value === value ? <span className="mi" data-i="check" aria-hidden="true"></span> : null}
              {o.label}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * A time inside a known window — hour and minute, and NO meridiem picker.
 *
 * The window already decides it. Fajr's runs 4:52 AM to 5:44 AM, so `5` can only be AM and offering
 * AM/PM is a third control that can only ever be set wrong. The hour options carry their own
 * meridiem instead (`12 PM`, `1 PM`), which also disambiguates the windows that genuinely straddle
 * noon — Zohar opens at 12:28 PM.
 *
 * Both lists are cut to the bounds, so a picker can never present a value the screen would then
 * refuse. `SrlFault` still exists for the values that arrive from STORED data, which is the case
 * a control cannot prevent.
 */
function SrlBoundedTimeSelect({ label, minutes, min, max, menuKey, openMenu, setOpenMenu, onPick, error }) {
  const hourOf = (m) => Math.floor(m / 60);
  const hourLabel = (h24) => `${((h24 + 11) % 12) + 1} ${h24 < 12 ? 'AM' : 'PM'}`;
  const current = Math.min(Math.max(minutes, min), max);
  const h = hourOf(current);

  const hours = [];
  for (let hh = hourOf(min); hh <= hourOf(max); hh += 1) hours.push({ value: hh, label: hourLabel(hh) });
  // Only the minutes this hour can legally hold.
  const lo = Math.max(min, h * 60);
  const hi = Math.min(max, (h * 60) + 59);
  const mins = [];
  for (let mm = lo % 60; mm <= hi - (h * 60); mm += 1) mins.push({ value: mm, label: String(mm).padStart(2, '0') });

  const slot = (key) => ({
    open: openMenu === `${menuKey}-${key}`,
    onOpen: (next) => setOpenMenu(next ? `${menuKey}-${key}` : null),
  });
  // Changing the hour can strand the minute outside the new hour's legal range, so the write is
  // clamped rather than allowed to produce a time the list would not have offered.
  const write = (hh, mm) => onPick(Math.min(Math.max((hh * 60) + mm, min), max));

  return (
    <div className="field">
      {label ? <div className="flabel">{label}</div> : null}
      <div className="time-select">
        <div><SrlSelect value={h} options={hours} maxHeight={176} error={error} onPick={(v) => write(v, current % 60)} {...slot('h')} /></div>
        <div><SrlSelect value={current % 60} options={mins} maxHeight={176} error={error} onPick={(v) => write(h, v)} {...slot('m')} /></div>
      </div>
    </div>
  );
}

// Every minute from the five-minute floor up to what the window still has room for. A curated list
// of round numbers rounded a masjid's real timing to a neighbouring one — the same mistake the
// timeline's five-minute grid made before 2026-08-07 — and a list running past the window would offer
// delays the screen then refuses.
const srlDelayOptions = (max) => {
  const out = [];
  for (let n = 5; n <= Math.max(5, max); n += 1) out.push({ value: n, label: `${n} min after azaan` });
  return out;
};

const SRL_INTERVALS = [
  { value: 5, label: 'Next 5-minute mark' },
  { value: 10, label: 'Next 10-minute mark' },
  { value: 15, label: 'Next quarter-hour' },
];

function SrlFault({ fault, field }) {
  if (!fault || (field && fault.field !== field)) return null;
  return (
    <div className="srl-fault" role="alert">
      <span className="mi" data-i="error" aria-hidden="true"></span>
      <span>{fault.text}</span>
    </div>
  );
}

/**
 * The fields one rule owns, opened inside its own row.
 *
 * A rule that owns nothing says so in a line. `At prayer start` and `Same time every day` are both
 * fully described by their name — the first has no clock time to store, and the second's clock time
 * is TODAY'S time, which is set on the day below where it can be seen against its window.
 */
function SrlRuleFields({ row, openMenu, setOpenMenu, onPickInterval, onSetEarliest }) {
  const cfg = row.cfg || {};
  const fault = row.fault;
  const floor = window.srToMinutes(cfg.neverBefore) || 0;
  // `adding` only REVEALS the field; it never writes. A floor is set by picking a time, and the
  // rounding alone decides until then — writing one on reveal would create a seasonal bound the
  // committee never chose. Declared before the early returns below, because a hook after a
  // conditional return is called on some renders and not others.
  const [adding, setAdding] = React.useState(false);
  const showFloor = floor !== 0 || adding;

  if (cfg.variant === SRL_VARIANTS.ON_TIME) {
    return (
      <p className="srl-rule-note">
        {row.key === 'maghrib'
          ? 'Sunset moves a little every day. Paigham recalculates it — nothing to set.'
          : `${row.label}'s start moves through the year. Paigham recalculates it — nothing to set.`}
      </p>
    );
  }

  if (cfg.variant === SRL_VARIANTS.FIXED) {
    return <p className="srl-rule-note">Drag the card on the day below to set the time. It stays there all year.</p>;
  }

  const step = window.srVariationStep(cfg.salaahTimeVariation) || 15;
  const canFloor = !!row.bounds;

  // The way back to "the rounding alone decides". It has to exist: without it one tap on
  // `Add an earliest time` was a one-way door into a bound the masjid may not want.
  const clearFloor = () => {
    setAdding(false);
    setOpenMenu(null);
    if (floor !== 0 && onSetEarliest) onSetEarliest(row.key, 0);
  };

  return (
    <>
      <SrlSelect
        label="Round up to"
        value={step}
        options={SRL_INTERVALS}
        open={openMenu === 'interval'}
        onOpen={(next) => setOpenMenu(next ? 'interval' : null)}
        onPick={(v) => onPickInterval && onPickInterval(row.key, v)}
      />
      <p className="srl-rule-note">
        {row.dayReady && row.resolved.natural != null
          ? `${row.label} begins ${srFmt(row.prayer.opens)} today, so the azaan is ${srFmt(row.resolved.azaan)}.`
          : 'Today’s prayer start is unavailable, so the result cannot be shown.'}
      </p>
      {showFloor && canFloor ? (
        <>
          <div className="srl-field-head">
            <span className="flabel">Never before</span>
            <button type="button" className="btn btn-link srl-clear" onClick={clearFloor}>
              {floor === 0 ? 'Cancel' : 'Remove'}
            </button>
          </div>
          <SrlBoundedTimeSelect
            minutes={floor === 0 ? row.bounds.azaanMin : floor}
            min={row.bounds.azaanMin}
            max={row.bounds.azaanMax}
            menuKey="floor"
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            error={!!fault && fault.field === 'azaan'}
            onPick={(v) => onSetEarliest && onSetEarliest(row.key, v)}
          />
          {floor === 0 ? (
            <p className="srl-rule-note">Not set yet — pick a time and the azaan will never be called before it.</p>
          ) : null}
          <SrlFault fault={fault} field="azaan" />
        </>
      ) : canFloor ? (
        // Almost no masjid needs a floor — the rounding is the whole rule — so it waits behind one
        // line rather than sitting there inviting someone to set a season-specific bound.
        <button type="button" className="btn btn-link srl-advanced" onClick={() => setAdding(true)}>
          Add an earliest time
        </button>
      ) : null}
    </>
  );
}

/**
 * The config card. Four rows: three azaan rules and the jamaat delay.
 *
 * SELECTION IS EXPANSION. Tapping a rule chooses it and opens the fields it owns; the row that was
 * open closes. There is no second disclosure state to reason about, and a reader is never looking at
 * parameters belonging to a rule this prayer is not using — which is what the loose `Round up to` /
 * `Set an earliest azaan` / `JAMAAT` blocks under the card allowed.
 *
 * Collapsed, every row states its own value, so the whole config reads in four lines without opening
 * anything.
 */
function SrlConfigCard({ row, openMenu, setOpenMenu, onPickVariant, onPickInterval, onSetEarliest }) {
  const cfg = row.cfg || {};

  // What a collapsed rule row says on its right. Only where there is something to say: the two rules
  // whose answer is today's clock time already have that number on the day below.
  const summaryFor = (variant) => {
    if (variant !== SRL_VARIANTS.VARIES) return null;
    if (cfg.variant !== SRL_VARIANTS.VARIES) return null;
    const step = window.srVariationStep(cfg.salaahTimeVariation);
    return step ? (step === 15 ? 'quarter-hour' : `${step} min`) : null;
  };

  return (
    <div className="srl-config">
      <div role="radiogroup" aria-label={`How ${row.label}'s azaan updates`}>
        {row.choices.map((choice) => {
          // An INCOMPLETE rule pre-selects nothing: showing its half-variant as chosen — with a
          // rounding interval this screen picked — would present a guess as the masjid's decision.
          const selected = !row.malformed && cfg.variant === choice.variant;
          const summary = selected ? null : summaryFor(choice.variant);
          return (
            <div className={`srl-rule ${selected ? 'is-open' : ''}`} key={choice.variant}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                className="srl-rule-head"
                onClick={() => { setOpenMenu(null); onPickVariant && onPickVariant(row.key, choice.variant); }}
              >
                <span className="mi srl-rule-glyph" data-i={choice.icon} aria-hidden="true"></span>
                <span className="srl-rule-title">{choice.title}</span>
                {summary ? <span className="srl-rule-summary">{summary}</span> : null}
                <span className="mi srl-rule-mark" data-i={selected ? 'check' : 'radio_button_unchecked'} aria-hidden="true"></span>
              </button>
              {selected ? (
                <div className="srl-rule-fields">
                  <SrlRuleFields
                    row={row}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    onPickInterval={onPickInterval}
                    onSetEarliest={onSetEarliest}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

    </div>
  );
}

/**
 * This prayer, on its own axis.
 *
 * The same `SstDay` the whole day is drawn with, scoped to one window — the treatment Jumah's Friday
 * block already uses, so there is one axis implementation and not a second. It replaced a read-only
 * hero stating `5:00 AM`: the axis says that number AND says where it sits between the prayer's start
 * and its close, which is the one thing a number cannot tell you. It is live, so a fixed prayer's
 * time is set here by dragging rather than typed into a picker on another screen.
 */
function SrlPrayerAxis({ data, row }) {
  const { SstDay, useSstDrag } = window;
  const { cfgOf, pubOf, onDragCommit, onDragSettle, dayStatus } = data;
  const prayer = row.prayer;

  const drag = (useSstDrag || (() => ({})))({
    cfgOf,
    prayerOf: () => prayer,
    onCommit: (key, value, meta) => onDragCommit && onDragCommit(key, value, meta),
    onSettle: (key, value, meta) => onDragSettle && onDragSettle(key, value, meta),
    live: true,
  });

  if (!SstDay || !row.dayReady || dayStatus !== 'loaded' || prayer.opens == null) {
    return (
      <div className="srl-context" role="status">
        <span className="mi" data-i="schedule" aria-hidden="true"></span>
        <div className="srl-context-copy">
          <strong>Today’s prayer times are unavailable</strong>
          <span>The rule above is exactly what is saved; it cannot be placed on a day we cannot calculate.</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="srl-axis"
      onPointerMove={drag.onMove}
      onPointerUp={drag.onRelease}
      onPointerCancel={drag.onRelease}
    >
      <div className="srl-axis-head">
        <span className="sst-eyebrow">TODAY</span>
        <small>{row.label} {srFmt(prayer.opens)} – {srFmt(prayer.closes)}</small>
      </div>
      <SstDay
        prayers={[prayer]}
        cfgOf={cfgOf} pubOf={pubOf}
        spanFrom={prayer.opens} spanTo={prayer.closes} breaks={[]} showNow={false}
        drag={drag.drag} bad={drag.bad} live onGrab={drag.onGrab}
      />
    </div>
  );
}

/**
 * One prayer's rule page: THREE sections, each with its own label above it.
 *
 *   1 · How <prayer> is timed  → the rule, chosen from three rows
 *   2 · Jamaat                 → the delay, which applies under whichever rule is chosen
 *   3 · Today                  → the result, on the same axis the whole day uses
 *
 * The labels sit OUTSIDE their cards. A card that carries its own eyebrow reads as a titled panel
 * rather than as one part of a page, and the jamaat delay inside that panel read as a fourth rule
 * you could pick instead of one of the three.
 */
function SrlDetailBody({ data }) {
  const { row, onPickVariant, onPickInterval, onSetEarliest, onSetIqama } = data;
  // Which menu is open. View state, not the draft.
  const [openMenu, setOpenMenu] = React.useState(null);
  if (!row) return null;
  const fault = row.fault;
  const delay = row.resolved.delay == null ? 5 : row.resolved.delay;

  return (
    <SrlBody gap={4}>
      {row.malformed ? (
        <div className="srl-context blocked" role="alert" style={{ marginBottom: 10 }}>
          <span className="mi" data-i="error" aria-hidden="true"></span>
          <div className="srl-context-copy">
            <strong>This rule is incomplete</strong>
            {/* Never guessed. The saved rule says what it wanted to do and not how, so the only
                honest move is to ask the committee which of the three it meant. */}
            <span>{row.malformed} Choose how {row.label} should update.</span>
          </div>
        </div>
      ) : null}

      {/* 1 · The rule. It leads, because it is the durable decision this page exists for. */}
      <div className="srl-section">
        <div className="eyebrow srl-section-label">How {row.label} is timed</div>
        <SrlConfigCard
          row={row}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          onPickVariant={onPickVariant}
          onPickInterval={onPickInterval}
          onSetEarliest={onSetEarliest}
        />
      </div>

      {/* 2 · The delay. Its own section: it is not one of the three rules, it applies under all of
              them, and it is the one value here a musalli feels directly. */}
      <div className="srl-section">
        <div className="eyebrow srl-section-label">Jamaat</div>
        <SrlSelect
          value={delay}
          options={srlDelayOptions(row.bounds ? row.bounds.delayMax : 115)}
          open={openMenu === 'iqama'}
          onOpen={(next) => setOpenMenu(next ? 'iqama' : null)}
          onPick={(v) => onSetIqama && onSetIqama(row.key, v)}
          error={!!fault && fault.field === 'iqama'}
        />
        <SrlFault fault={fault} field="iqama" />
      </div>

      {/* 3 · The result, on the same axis the whole day uses: the answer AND the two bounds it sits
              between. Live, so a fixed prayer's time is set here rather than typed into a picker. */}
      <div className="srl-section">
        <div className="eyebrow srl-section-label">Today</div>
        <SrlPrayerAxis data={data} row={row} />
      </div>

    </SrlBody>
  );
}

// ══════════════════════════════════════════════════════════════════════
// The routed screen
// ══════════════════════════════════════════════════════════════════════

/**
 * The rule page's one trailing action: Undo, offered only while this prayer differs from what is
 * published.
 *
 * It used to be a line at the BOTTOM of the scroll (`Saved to your draft · publish on the timings
 * screen`). On Isha the axis alone is ~360px, so the acknowledgement of a change sat reliably below
 * the fold — the one thing that must be visible was the one thing that was not.
 *
 * A docked bottom bar was the other candidate and is worse: it would sit exactly where `Publish`
 * sits on the timings screen, one Back-tap away, so a bar that publishes nothing would be learned
 * beside a bar that publishes to 1,284 people.
 *
 * The app bar is already this page's persistent chrome and its trailing side was empty. What has to
 * persist is the STATE (this prayer has an unpublished change) and the ACTION (undo it); where
 * publishing happens is stated by the screen that publishes, and by the summary this page came from.
 * The change itself needs no announcement — the axis below visibly moves.
 */
function SrlRuleActions({ data }) {
  const { row, onRestore, needsFirstPublish } = data;
  if (!row || !row.changed) return null;
  return (
    <div className="srl-appbar-actions">
      <button
        type="button"
        className="chip tonal srl-undo"
        onClick={() => onRestore && onRestore(row.key)}
        aria-label={`Undo the unpublished change to ${row.label}'s timing rule`}
      >
        <span className="mi" data-i="replay" aria-hidden="true"></span>
        {needsFirstPublish ? 'Restore' : 'Undo'}
      </button>
    </div>
  );
}

// The timings screen's two trailing actions. The gear opens how the timings update; the record is
// offered only once there is a record — an icon that opens an empty sheet is a dead end.
//
// A gear, not an `info` glyph (ratified 2026-08-25): what it opens is where each prayer's RULE is
// chosen, so it is a way in to settings rather than a note about the screen. `info` also reads as
// the same thing as the two informational context cards below, which are notes and nothing else.
function SrlTimingsActions({ data }) {
  const { history = [], onOpenRules, onOpenHistory } = data;
  return (
    <div className="srl-appbar-actions">
      <button type="button" className="ib ib-tonal" onClick={onOpenRules} aria-label="How timings update">
        <span className="mi" data-i="settings" aria-hidden="true"></span>
      </button>
      {history.length ? (
        <button
          type="button"
          className="ib ib-tonal"
          onClick={onOpenHistory}
          aria-label={`Timing changes — last published by ${history[0].by}`}
        >
          <span className="mi" data-i="receipt_long" aria-hidden="true"></span>
        </button>
      ) : null}
    </div>
  );
}

function SalaahRulesScreen({ data = {} }) {
  const {
    route, status, masjid, row, onBack, onRetry, onRefresh, snack, onCloseSnack,
    justPublished, confirmPublish, reachText, onConfirmPublish, onCancelPublish,
  } = data;
  const detail = route === 'detail' && !!row;
  const timings = route === 'timings';
  const { Dialog } = window;

  // A landed publish owns the whole screen, app bar included: there is nothing left to edit on it.
  if (justPublished) {
    return (
      <SrlShell>
        <SrlPublishedBody data={data} />
      </SrlShell>
    );
  }

  let title = 'How timings update';
  if (detail) title = `${row.label} timing rule`;
  if (timings) title = 'Salaah timings';

  // On a rule page with an unpublished change, the parent's name is the least useful thing the
  // subtitle could say. The STATE goes there instead, which is what answers the question a reader
  // actually has with a Back arrow under their thumb: has this been kept?
  let subtitle = masjid;
  if (detail) subtitle = row.changed ? 'Unpublished change' : 'How timings update';

  return (
    <SrlShell>
      <SrlAppBar
        title={title}
        subtitle={subtitle}
        subtitleAccent={detail && row.changed}
        onBack={onBack}
        trailing={status !== 'loaded' ? undefined
          : timings ? <SrlTimingsActions data={data} />
            : detail ? <SrlRuleActions data={data} /> : undefined}
      />

      {status === 'loading' ? <SrlSkeletonSummary /> : null}

      {status === 'error' ? (
        <SrlFullState
          icon="error"
          tone="error"
          title="Timing rules could not be loaded"
          description="We could not reach the masjid’s saved timing rules. Nothing has been changed."
          action={{ text: 'Try again', icon: 'replay', filled: true, onClick: onRetry }}
        />
      ) : null}

      {/* Another publish landed under this draft. Nothing may overwrite it silently, and merging
          two people's rule edits field by field is not something this screen can do honestly —
          so it refuses, names it, and offers the refresh. */}
      {status === 'conflict' ? (
        <SrlFullState
          icon="error"
          tone="error"
          title="Timings changed while you were editing"
          description="Someone else published new timings for this masjid. Refresh to review the latest timings before publishing your draft."
          action={{ text: 'Refresh timings', icon: 'replay', filled: true, onClick: onRefresh }}
        />
      ) : null}

      {status === 'loaded' ? (
        timings
          ? <SrlTimingsBody data={data} />
          : detail ? <SrlDetailBody data={data} /> : <SrlSummaryBody data={data} />
      ) : null}

      <SrlHistorySheet data={data} />

      {/* Publishing always confirms, and the confirmation names the blast radius as a NUMBER.
          "Every musalli of this masjid" is true but abstract; the count is what makes someone
          re-read the times before they go out. */}
      {Dialog ? (
        <Dialog
          isOpen={!!confirmPublish}
          onClose={onCancelPublish}
          title="Publish new timings?"
          description={`All ${reachText} musalleen of this masjid see the updated azaan and iqama times right away, and the change is recorded in your name.`}
          primary={{ text: 'Publish', onClick: onConfirmPublish }}
          secondary={{ text: 'Cancel', onClick: onCancelPublish }}
        />
      ) : null}

      {/* The capture stage owns the whole window, app bar included, so it is mounted at shell level
          rather than inside the body it was opened from. */}
      {data.scanStage ? (
        <SrlScanStage
          stage={data.scanStage}
          onClose={data.onCloseScan}
          onCapture={data.onScanCapture}
          onRetry={data.onScanRetry}
        />
      ) : null}

      <SrlSnack snack={snack} onClose={onCloseSnack} />
    </SrlShell>
  );
}

Object.assign(window, { SalaahRulesScreen });

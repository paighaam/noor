// Payments POC 03 — direct UPI giving.
//
// Built on the Noor kit: `components.css` classes plus the React components that
// `_theme/components.jsx` (EmptyState, OptionSheet) and `home/storyboards/nav-bar.jsx`
// (BottomNav) put on `window`. The screen chrome follows the Masjid Console: a floating
// `.app-bar` with an `.ib` back, the wizard's `.stepbar`, and `.docked-action` for the committed
// action. `payments-v2.css` holds layout only, plus the few constructions the kit does not have
// yet (see the PROPOSAL notes on P2Note, P2Promo, P2RequestCard and P2RequestRail).

const P2_MASJIDS = {
  bilal: { key: 'bilal', name: 'Masjid E Bilal', place: 'Bengaluru', code: 'PGM-BLR-1042', photo: '/images/masjid-camera-preview.png', vpa: 'masjidebilal@upi', payee: 'Masjid E Bilal Trust', bankName: 'MASJID E BILAL TRUST' },
  jamia: { key: 'jamia', name: 'Jamia Masjid', place: 'Frazer Town', code: 'PGM-BLR-0217', vpa: 'jamiamasjidft@upi', payee: 'Jamia Masjid Frazer Town Trust', bankName: 'JAMIA MASJID FRAZER TOWN TRUST' },
  // Accepts UPI but has no live request: Choose a masjid lists it anyway, because the list now
  // comes from the followed-masjid giving directory (an ACTIVE payee), not from Home's requests.
  quba: { key: 'quba', name: 'Masjid E Quba', place: 'Shivajinagar', code: 'PGM-BLR-0588', vpa: 'masjidequba@upi', payee: 'Masjid E Quba Committee', bankName: 'MASJID E QUBA COMMITTEE' },
};
// A replacement QR the Masjid E Bilal committee submits while its current payee stays ACTIVE.
// The same row becomes the payee a follower is shown after the server reports PAYEE_CHANGED.
const P2_NEW_PAYEE = { vpa: 'bilalwaqf@okaxis', payee: 'Masjid E Bilal Waqf Trust', bankName: 'MASJID E BILAL WAQF TRUST' };
// The reason Paigham Admin gave when it returned the replacement (latestDecision.reviewReason).
const P2_RETURN_REASON = 'Name at bank does not match the masjid.';
// The follower's primary masjid. It is the one the admin side of this board sets up, so the
// Friday card and the masjid console always describe the same payee.
const P2_MASJID = P2_MASJIDS.bilal;
// Requests from masjids the follower follows. A title is optional: the last one was published
// without one to show the fallback followers see.
const P2_REQUESTS = [
  { id: 'cooler', masjid: 'bilal', title: 'Repair the water cooler', detail: 'Drinking water before Friday prayers', amount: 1000, icon: 'favorite', when: 'Today', endsIn: 29, starts: 7 },
  { id: 'mats', masjid: 'jamia', title: 'New prayer mats', detail: 'Replace worn-out mats in the prayer hall', amount: 8000, icon: 'volunteer_activism', when: '2 days ago', endsIn: 6, starts: 3 },
  { id: 'untitled', masjid: 'bilal', title: '', detail: 'Monthly electricity and water bills', amount: 4500, icon: 'volunteer_activism', when: 'Last week', endsIn: 3, starts: 4 },
];
// Requests that already left followers' screens: one the committee marked as met, one that
// reached its end date. They stay in the hub so the committee keeps the record.
const P2_ENDED = [
  { id: 'iftar', masjid: 'bilal', title: 'Iftar for 200 musalleen', amount: 15000, icon: 'favorite', how: 'met', endedOn: '12 Sep', endedAgo: 17, starts: 38 },
  { id: 'fans', masjid: 'bilal', title: 'Ceiling fans for the hall', amount: 6000, icon: 'volunteer_activism', how: 'ended', endedOn: '2 Sep', endedAgo: 27, starts: 9 },
];
// Requests that reached their end date in the last week. One can still be extended (TRD §4.5:
// ended by at most 7 days); the other already used all three extensions.
const P2_ENDED_RECENT = [
  { id: 'quran', masjid: 'bilal', title: 'Quran stands', detail: 'New stands for the madrasa class', amount: 3000, icon: 'volunteer_activism', how: 'ended', endedOn: '26 Sep', endedAgo: 3, extendedCount: 0, starts: 9 },
  { id: 'roof', masjid: 'bilal', title: 'Roof waterproofing', amount: 20000, icon: 'volunteer_activism', how: 'ended', endedOn: '24 Sep', endedAgo: 5, extendedCount: 3, starts: 21 },
];
// Every request ends. Paigham cannot see money arrive, so a request can never close itself on
// its amount: the committee marks it met, or it ends on its date. 30 days unless they change it.
const P2_DURATIONS = [['7', '1 week'], ['14', '2 weeks'], ['30', '30 days'], ['60', '60 days'], ['90', '90 days']];
const P2_DEFAULT_DURATION = '30';
const P2_EXTEND_DAYS = 30;
const P2_REMIND_DAYS = 3;
// TRD §4.5: an extension is possible from 3 days before the end until 7 days after it, at most
// 3 times, and never for a request marked met. The server sends `extendable`; these mirror it.
const P2_MAX_EXTENSIONS = 3;
const P2_EXTEND_GRACE_DAYS = 7;
// Amount bounds come from the hub's LimitsDto / the give target at runtime; these are the values
// the review measured (request ₹1 crore, giving ₹1 lakh).
const P2_REQUEST_MAX = 10000000;
const P2_GIVE_MAX = 100000;
// The POC's "today", so end dates on the board never drift with the real clock.
const P2_TODAY = new Date(2026, 8, 29);
const P2_SAMPLE_FORM = { target: '1000', title: 'Repair the water cooler', detail: 'Drinking water before Friday prayers', duration: P2_DEFAULT_DURATION };
const P2_STARTS = [
  { amount: 250, note: 'Repair the water cooler', when: 'Today' },
  { amount: 500, note: 'General giving', when: 'Friday' },
  { amount: 100, note: 'Support Masjid E Bilal', when: 'Monday' },
];
const p2Rupees = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const p2RequestTitle = (request) => (request.title || '').trim() || `Support ${P2_MASJIDS[request.masjid].name}`;
const p2EndDate = (days) => { const date = new Date(P2_TODAY); date.setDate(date.getDate() + Number(days)); return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); };
const p2DurationLabel = (days) => (P2_DURATIONS.find(([value]) => value === String(days)) || [null, `${days} days`])[1];
const p2EndingSoon = (request) => request.endsIn <= P2_REMIND_DAYS;
// Every request the masjid has published in this session, newest first.
const p2Published = (form, posted) => posted ? [{ id: 'new', masjid: 'bilal', title: form.title, detail: form.detail, amount: form.target, icon: 'volunteer_activism', when: 'Just now', endsIn: Number(form.duration || P2_DEFAULT_DURATION), starts: 0 }, ...P2_REQUESTS] : P2_REQUESTS;
// Live requests: the ones not marked met, with any extension applied. Followers only ever see these.
// An extended request that had already ended comes back live for 30 days from today
// (ends_at = max(ends_at, now) + 30 days).
const p2AllRequests = (form, posted, closed = [], extended = [], recent = false) => [
  ...p2Published(form, posted)
    .filter((request) => !closed.includes(request.id))
    .map((request) => extended.includes(request.id) ? { ...request, endsIn: request.endsIn + P2_EXTEND_DAYS, extendedCount: (request.extendedCount || 0) + 1 } : request),
  ...(recent ? P2_ENDED_RECENT : [])
    .filter((request) => extended.includes(request.id))
    .map(({ how, endedOn, endedAgo, ...request }) => ({ ...request, when: 'Extended today', endsIn: P2_EXTEND_DAYS, extendedCount: (request.extendedCount || 0) + 1 })),
];
const p2EndedRequests = (form, posted, closed = [], extended = [], recent = false) => [
  ...p2Published(form, posted).filter((request) => closed.includes(request.id)).map((request) => ({ ...request, how: 'met', endedOn: 'Today', endedAgo: 0 })),
  ...(recent ? P2_ENDED_RECENT : []).filter((request) => !extended.includes(request.id)),
  ...P2_ENDED,
];
// Why a request cannot be extended, or null when it can. Mirrors the server's `extendable`
// predicate and the reasons its 409 REQUEST_NOT_EXTENDABLE names.
const p2ExtendBlock = (request) => {
  if (request.how === 'met') return 'Marked as met';
  if ((request.extendedCount || 0) >= P2_MAX_EXTENSIONS) return `Extended ${P2_MAX_EXTENSIONS} times — the limit`;
  if (request.how === 'ended' && request.endedAgo > P2_EXTEND_GRACE_DAYS) return `Ended more than ${P2_EXTEND_GRACE_DAYS} days ago`;
  if (!request.how && request.endsIn > P2_REMIND_DAYS) return 'Not ending soon';
  return null;
};
const p2ExtendableUntil = (request) => p2EndDate(P2_EXTEND_GRACE_DAYS - request.endedAgo);
// Field-level amount validation, answered on tap (the Paigham form pattern: the action stays
// enabled and the field says what is wrong).
const p2AmountError = (value, max, maxCopy) => {
  const amount = Number(value);
  if (!String(value || '').trim() || !(amount >= 1)) return 'Enter an amount of at least ₹1';
  if (amount > max) return maxCopy;
  return null;
};
// A frame's optional third entry marks the 2 Oct review fixes, approved as drawn by the product
// owner on 2 Oct 2026: 'new' for a frame they added, 'changed' for an earlier frame they alter.
const P2_ROWS = [
  { number: '01', title: 'Masjid · activate payments', icon: 'qr_code_scanner', frames: [['console', 'Console nudge'], ['scan', 'Scan existing QR'], ['review', 'Review payee'], ['pending', 'Awaiting review', 'changed'], ['ready', 'Payments ready', 'changed']] },
  { number: '02', title: 'Paigham Admin · human review', icon: 'shield', frames: [['admin-home', 'Admin Console'], ['admin-queue', 'Payment QR queue'], ['admin-review', 'Review match'], ['admin-approved', 'Approved'], ['admin-returned', 'Returned']] },
  { number: '03', title: 'Masjid · requests & activity', icon: 'campaign', frames: [['console-ready', 'Console · Payments entry'], ['masjid-details', 'Details · payment record', 'changed'], ['masjid-payments', 'Payments hub + FAB'], ['request-amount', '1 · Amount needed', 'changed'], ['request-amount-invalid', '1 · Amount · invalid on tap', 'new'], ['request-details', '2 · Title (optional)'], ['request-review', '3 · Review'], ['request-ends', '3 · End date sheet'], ['published', 'Visible to followers'], ['close-confirm', 'Mark as met · confirm'], ['hub-extend', 'Ended · extend within 7 days', 'new'], ['hub-ended-list', 'Ended · why Extend is unavailable', 'new'], ['reminder-cap', 'Ending soon · extension limit', 'new'], ['initiations', 'Initiations only']] },
  { number: '04', title: 'Follower · discover', icon: 'home', frames: [['user-home', 'Friday · primary masjid card'], ['user-home-weekday', 'Weekday · requests carousel'], ['user-home-empty', 'No requests · give to primary'], ['user-home-none', 'No requests · primary not on UPI'], ['user-home-committee', 'Committee · split FAB'], ['updates', 'All requests'], ['choose-masjid', 'Choose a masjid', 'changed'], ['user-scan', 'Scan masjid QR']] },
  { number: '05', title: 'Follower · UPI handoff', icon: 'account_balance', frames: [['amount', 'Enter amount', 'changed'], ['amount-invalid', 'Amount · invalid on tap', 'new'], ['apps', 'Choose UPI app'], ['amount-preparing', 'Preparing the hand-off', 'new'], ['amount-changed', 'Payee changed · confirm', 'new'], ['handoff', 'Open UPI app'], ['android-done', 'Android · reported paid'], ['android-failed', 'Android · not completed'], ['android-unknown', 'Android · no result'], ['ios-return', 'iOS · check UPI app']] },
  { number: '06', title: 'Masjid · replace payment QR', icon: 'swap_horiz', frames: [['replace-scan', 'Scan the new QR', 'new'], ['replace-review', 'Review · replacement', 'new'], ['replace-pending', 'Payments on · new QR in review', 'new'], ['console-replacing', 'Console · new QR in review', 'new'], ['details-replacing', 'Details · active + in review', 'new'], ['hub-replacing', 'Hub · in review, publishing on', 'new'], ['hub-replace-returned', 'Hub · new QR returned', 'new'], ['console-replace-returned', 'Console · new QR returned', 'new']] },
];
// Board frames that show a replacement state; the live device reads the same state from go().
const P2_STAGE_REPLACEMENT = { 'replace-pending': 'pending', 'console-replacing': 'pending', 'details-replacing': 'pending', 'hub-replacing': 'pending', 'hub-replace-returned': 'returned', 'console-replace-returned': 'returned' };
const P2_RECENT_ENDED_STAGES = ['hub-extend', 'hub-ended-list'];
const P2_NOOP = () => {};
const P2_UPI_APPS = ['Google Pay', 'PhonePe', 'BHIM'];
const P2_REQUEST_STEPS = 3;

// ── Kit wrappers ───────────────────────────────────────────────────────
// Thin JSX over kit classes, so each screen reads as the construction it uses.

function P2Icon({ name, className = '' }) { return <span className={`mi ${className}`} data-i={name} aria-hidden="true" />; }

// `busy` is the kit's in-flight button: inert (disabled) with aria-busy, keeping its label while
// the status capsule above the docked bar says what is running.
function P2Button({ children, onClick = P2_NOOP, icon, kind = 'btn-filled', disabled = false, busy = false }) {
  return <button type="button" className={`btn lg ${kind}`} onClick={onClick} disabled={disabled || busy} aria-busy={busy ? 'true' : undefined}>{icon && <P2Icon name={icon} />}{children}</button>;
}

// The Masjid Console's app bar (OpsAppBar / CmpStepBar): floating `.app-bar`, `.ib` back,
// `.screen-title`, and — inside a wizard — the step count and `.stepbar` under it.
function P2AppBar({ title, subtitle, back = P2_NOOP, step }) {
  return (
    <div className={`app-bar p2-appbar ${step ? 'has-step' : ''}`}>
      <div className="p2-appbar-row">
        <button type="button" className="ib ib-tonal" onClick={back} aria-label="Back"><P2Icon name="arrow_back" /></button>
        <span className="p2-appbar-copy">
          <span className="screen-title">{title}</span>
          {subtitle && <small>{subtitle}</small>}
        </span>
        {step ? <span className="p2-step-count">Step {step} of {P2_REQUEST_STEPS}</span> : null}
      </div>
      {step ? (
        <div className="stepbar" role="progressbar" aria-valuemin={1} aria-valuemax={P2_REQUEST_STEPS} aria-valuenow={step}>
          {Array.from({ length: P2_REQUEST_STEPS }, (_, i) => <span key={i} className={i < step ? 'on' : ''} />)}
        </div>
      ) : null}
    </div>
  );
}

function P2Screen({ children }) { return <main className="p2-screen">{children}</main>; }
// `anchor` opens the screen scrolled to a `data-anchor` section, so a board frame can show a
// part of a long screen that sits below the fold. It is board framing, not a product behaviour.
function P2Scroll({ children, bar = true, step = false, nav = false, fab = false, onScroll, anchor }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    const target = anchor && el && el.querySelector(`[data-anchor="${anchor}"]`);
    if (target) el.scrollTop = target.offsetTop - (bar ? 126 : 54) - 8;
  }, [anchor]);
  return <div ref={ref} className={`p2-scroll ${bar ? 'under-bar' : ''} ${step ? 'under-step' : ''} ${nav ? 'over-nav' : ''} ${fab ? 'under-fab' : ''} ${anchor ? 'is-anchored' : ''}`} onScroll={onScroll}>{children}</div>;
}
// `status` is the kit's submit progress: a `.status-capsule` floating above the bar inside a
// `.docked-host`, replacing the helper note rather than stacking with it.
function P2Docked({ children, note, status }) {
  const bar = <div className="docked-action bordered">{note && !status && <div className="docked-action-note">{note}</div>}{children}</div>;
  if (!status) return bar;
  return (
    <div className="docked-host">
      <div className="docked-status status-capsule" role="status" aria-live="polite"><span className="status-capsule-ring" aria-hidden="true" /><b>{status}</b></div>
      {bar}
    </div>
  );
}

function P2Heading({ eyebrow, title, lead }) {
  return (
    <div className="p2-heading">
      {eyebrow && <span className="eyebrow accent">{eyebrow}</span>}
      <div className="section-title">{title}</div>
      {lead && <p className="p2-lead">{lead}</p>}
    </div>
  );
}

// A section heading inside a screen: `.section-title` plus a hint or a link-style action.
function P2Section({ title, hint, action, anchor }) {
  return (
    <div className="p2-section-head" data-anchor={anchor}>
      <span className="section-title">{title}</span>
      {action ? <button type="button" className="btn btn-link" onClick={action.onClick}>{action.text}</button> : hint ? <small>{hint}</small> : null}
    </div>
  );
}

function P2Badge({ children, tone = 'teal' }) { return <span className={`badge sm ${tone}`}>{children}</span>; }

function P2Tile({ icon, size = 40, accent = false }) {
  return <span className={`icon-tile ${accent ? 'accent' : ''}`} style={{ '--tile': `${size}px` }} aria-hidden="true"><P2Icon name={icon} /></span>;
}
// The Console's MasjidMark: the masjid's own photo when it has one, the accent tile otherwise.
function P2MasjidMark({ masjid, size = 44 }) {
  if (masjid.photo) return <span className="masjid-mark" style={{ '--tile': `${size}px` }}><img src={masjid.photo} alt="" /></span>;
  return <P2Tile icon="mosque" size={size} accent />;
}

// `.list-item` row, the Console's ConsoleRow construction: leading glyph, title, subtitle, then
// a value or badge, and a chevron only when the row goes somewhere.
function P2Row({ icon, lead, title, subtitle, value, trailing, onClick }) {
  const Root = onClick ? 'button' : 'div';
  return (
    <Root type={onClick ? 'button' : undefined} className={`list-item ${onClick ? 'actionable' : ''}`} onClick={onClick}>
      {lead || (icon ? <span className="mi list-item-leading p2-row-accent" data-i={icon} aria-hidden="true" /> : null)}
      <span className="list-item-copy">
        <span className="list-item-title">{title}</span>
        {subtitle && <span className="list-item-subtitle">{subtitle}</span>}
      </span>
      {value && <span className="list-item-value">{value}</span>}
      {trailing}
      {onClick && <span className="mi list-item-chevron" data-i="chevron_right" aria-hidden="true" />}
    </Root>
  );
}
function P2Group({ children, attention = false, label, anchor }) {
  return <>{label && <div className="eyebrow p2-group-label" data-anchor={anchor}>{label}</div>}<div className={`list-group ${attention ? 'attention' : ''}`}>{children}</div></>;
}

function P2Identity({ masjid = P2_MASJID }) {
  return <P2Row lead={<P2MasjidMark masjid={masjid} />} title={masjid.name} subtitle={masjid.place} trailing={<P2Icon name="verified" className="p2-verified" />} />;
}
// "Verified payee" is only ever shown beside the name the bank holds for the UPI ID (Cashfree's
// nameAtBank), and only once a Paigham Super Admin has approved it (TRD §8.1).
function P2PayeeGroup({ masjid = P2_MASJID, label = 'Pays to' }) {
  return (
    <P2Group label={label}>
      <P2Row icon="verified" title={masjid.bankName} subtitle={`Verified payee · ${masjid.vpa}`} />
    </P2Group>
  );
}

// PROPOSAL `.callout` — an info/trust note (icon + one or two sentences on the secondary
// surface). No kit construction says "read this before you act"; the Console's `.detail-note`
// is page-local and has no icon. Kept local until approved.
function P2Note({ children, icon = 'info' }) { return <div className="p2-note"><P2Icon name={icon} /><span>{children}</span></div>; }

// `EmptyState` from the components layer is the kit's centred outcome view; outcome screens use
// it rather than restating an icon + headline + copy stack.
function P2Outcome({ icon, tone, title, description }) {
  const { EmptyState } = window;
  return EmptyState ? <EmptyState icon={icon} tone={tone} title={title} description={description} style={{ minHeight: 0, padding: '28px 8px 8px' }} /> : null;
}

// Amount entry: the kit `.input` with a rupee prefix, and `.chip` shortcuts (`.solid` is the
// kit's selected chip). PROPOSAL `.amount-field` would give this a display-size figure.
// An `error` follows the Paigham form pattern (personal details, masjid registration): the
// kit `.input.error` frame plus a `.helper.err` line directly under the field, announced as an
// alert. `disabled` holds the field still while a hand-off is being prepared.
function P2AmountField({ label, value, onChange, presets, error = null, disabled = false }) {
  return (
    <div className="field">
      <div className="flabel">{label}</div>
      <div className={`input ${error ? 'error' : 'focused'} ${disabled ? 'disabled' : ''}`}>
        <div className="inner">
          <span className="p2-rupee" aria-hidden="true">₹</span>
          <input className="val" aria-label={`${label} in rupees`} aria-invalid={error ? 'true' : undefined} type="number" inputMode="numeric" min="1" placeholder="0" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
        </div>
      </div>
      {error && <div className="helper err" role="alert">{error}</div>}
      <div className="p2-chips">
        {presets.map((preset) => <button type="button" key={preset} className={`chip ${value === preset ? 'solid' : 'outline'}`} disabled={disabled} onClick={() => onChange(preset)}>{p2Rupees(preset)}</button>)}
      </div>
    </div>
  );
}

// PROPOSAL `.request-card` — the payment request as followers see it. Nothing in the kit
// carries a requested amount with a give action; `.post-preview` is the authoring surface for a
// paigham and `.feed-post` is a flat feed row. Kept local until approved.
function P2RequestCard({ request, onGive }) {
  const masjid = P2_MASJIDS[request.masjid];
  return (
    <article className="p2-request-card">
      <div className="p2-request-card-head">
        <P2Tile icon={request.icon} />
        <span><span className="eyebrow">Payment request</span><small>{masjid.name}{request.endsIn ? ` · ends ${p2EndDate(request.endsIn)}` : ''}</small></span>
      </div>
      <div className="section-title">{p2RequestTitle(request)}</div>
      {request.detail && <p className="p2-lead">{request.detail}</p>}
      <div className="p2-request-card-foot">
        <span><span className="eyebrow faint">Requested</span><b>{p2Rupees(request.amount)}</b></span>
        {onGive && <button type="button" className="btn btn-filled" onClick={onGive}>Give<P2Icon name="arrow_forward" /></button>}
      </div>
    </article>
  );
}

// PROPOSAL `.promo-card` — an eyebrow, serif title, one line and a link, beside an
// illustration. Used twice here (the console's payment setup nudge and the follower's Friday
// card); PromptCard has no illustration slot. Kept local until approved.
function P2Promo({ eyebrow, title, copy, action, art, onClick }) {
  return (
    <button type="button" className="p2-promo" onClick={onClick}>
      <span>
        <span className="eyebrow accent">{eyebrow}</span>
        <strong>{title}</strong>
        <small>{copy}</small>
        <b>{action}<P2Icon name="arrow_forward" /></b>
      </span>
      <img src={art} alt="" />
    </button>
  );
}

// A snapshot card: the `.promo-card` proposal's shell with what is happening now and two
// explicit actions — a filled primary for the job and a tonal secondary into the section.
// Two buttons rather than a pressable card with a button inside it: a nested target is
// invalid markup, and copy that is secretly a link is a target nobody finds.
function P2SnapshotCard({ eyebrow, title, copy, art, primary, secondary, status }) {
  return (
    <section className="p2-promo is-snapshot">
      <div className="p2-promo-copy">
        <span className="eyebrow accent">{eyebrow}</span>
        <strong>{title}</strong>
        <small>{copy}</small>
        {status}
      </div>
      <img src={art} alt="" />
      <div className="p2-promo-actions">
        <button type="button" className="btn btn-filled sm" onClick={primary.onClick}>{primary.icon && <P2Icon name={primary.icon} />}{primary.text}</button>
        <button type="button" className="btn btn-tonal sm" onClick={secondary.onClick}>{secondary.text}</button>
      </div>
    </section>
  );
}

// Once payments are on, the setup nudge's slot becomes the console's window into payments.
// A replacement QR never changes the card's state: the masjid is still accepting UPI through its
// active payee, so the card keeps New request and only adds the replacement's status (console
// `payments.replacement`). The reason and Scan again live in the hub, one tap away.
function P2PaymentsSnapshot({ go, requests, replacement = 'none' }) {
  const own = requests.filter((request) => request.masjid === 'bilal');
  const soon = own.filter(p2EndingSoon).length;
  const latest = P2_STARTS[0];
  const copy = soon ? `${soon} ending in ${P2_REMIND_DAYS} days · 12 payment starts this month` : `12 payment starts this month · latest ${p2Rupees(latest.amount)} ${latest.when.toLowerCase()}`;
  const status = replacement === 'pending' ? <P2Badge tone="amber">New QR in review</P2Badge> : replacement === 'returned' ? <P2Badge tone="amber">New QR returned</P2Badge> : null;
  return <P2SnapshotCard eyebrow="Payments · accepting UPI" title={`${own.length} live ${own.length === 1 ? 'request' : 'requests'}`} copy={copy} status={status} art="./assets/masjid-payment-setup.png" primary={{ text: 'New request', icon: 'add', onClick: () => go('request-amount') }} secondary={{ text: 'View payments', onClick: () => go(replacement === 'none' ? 'masjid-payments' : replacement === 'pending' ? 'hub-replacing' : 'hub-replace-returned') }} />;
}

// ── Payee replacement (F7) ─────────────────────────────────────────────
// The ACTIVE payee and a replacement are two different rows (hub `payee` / `pendingPayee` /
// `latestDecision`). Every surface shows the active one first and the replacement separately;
// nothing about a replacement stops requests, because publishing needs only the active payee.
const P2_REPLACE_COPY = 'The current payee stays active until Paigham Admin approves the new one';
function P2ReplaceRow({ go }) {
  return <P2Row icon="swap_horiz" title="Replace payment QR" subtitle={P2_REPLACE_COPY} onClick={() => go('replace-scan')} />;
}
// A submitted payee before Paigham Admin decides: the QR's own name and UPI ID, never the bank
// name and never "Verified payee" (TRD D7 needs Cashfree VALID and Admin approval for that).
function P2PendingPayeeRow({ payee = P2_NEW_PAYEE, prefix = 'New QR · ' }) {
  return <P2Row icon="hourglass_top" title={payee.payee} subtitle={`${prefix}${payee.vpa} · submitted today`} trailing={<P2Badge tone="amber">In review</P2Badge>} />;
}
// The reminder's construction (attention group + action row), reused for a returned replacement:
// it is work owed, with one action.
function P2ReturnedCard({ go }) {
  return (
    <div className="list-group attention p2-reminder">
      <P2Row icon="reply" title="New payment QR returned" subtitle={`${P2_RETURN_REASON} Current payee still active.`} />
      <div className="p2-reminder-actions single">
        <button type="button" className="btn btn-tonal sm" onClick={() => go('replace-scan')}><P2Icon name="qr_code_scanner" />Scan again</button>
      </div>
    </div>
  );
}
function P2PaymentQrSnapshot({ go }) {
  return <P2SnapshotCard eyebrow="Payment QRs · needs review" title="1 QR to review" copy={`${P2_MASJID.name} submitted today · 3 approved this month`} art="./assets/masjid-payment-setup.png" primary={{ text: 'Review next', onClick: () => go('admin-review') }} secondary={{ text: 'View queue', onClick: () => go('admin-queue') }} />;
}

// The Console's send composer as the committee sees it: whatever is written here goes to every
// musalli following the masjid. Restated with the `.composer-card` proposal's classes so the
// stand-in reads as the real surface; the POC does not open the paigham wizard from it.
function P2PaighamComposer() {
  return (
    <section className="p2-composer">
      <span className="p2-composer-kicker">NEW PAIGHAM</span>
      <h1>What should musalleen know?</h1>
      <p>Message all 1.3k musalleen of {P2_MASJID.name}.</p>
      <textarea className="p2-composer-field" rows={3} readOnly aria-label="Start a paigham" placeholder="Jumah bayan begins at 1:00 PM this week…" />
      <div className="p2-composer-tools">
        <button type="button" className="btn btn-tonal sm"><P2Icon name="mic" />Record audio</button>
        <button type="button" className="btn btn-tonal sm"><P2Icon name="photo_camera" />Add photos</button>
      </div>
    </section>
  );
}

// ── Masjid · payment setup ─────────────────────────────────────────────

// Stand-in for the real ConsoleScreen (masjid-operations/storyboards/broadcast-studio-screens.jsx):
// its header, a pointer to the composer, and the kit `.deck` the console itself is built from.
// PROPOSAL: render the real ConsoleScreen here once ConsoleHome takes a `payments` tile.
function P2Console({ go, ready = false, requests = P2_REQUESTS, replacement = 'none' }) {
  return (
    <P2Screen>
      <P2Scroll bar={false}>
        <header className="p2-console-head">
          <button type="button" className="ib ib-tonal" aria-label="Back"><P2Icon name="arrow_back" /></button>
          <P2MasjidMark masjid={P2_MASJID} size={46} />
          <span className="p2-console-id"><strong>{P2_MASJID.name}</strong><small>Chairman · Full admin</small></span>
          <P2Icon name="verified" className="p2-verified" />
        </header>
        <P2PaighamComposer />
        {ready ? <P2PaymentsSnapshot go={go} requests={requests} replacement={replacement} /> : null}
        {!ready && <P2Promo eyebrow="New for your masjid" title="Accept UPI payments" copy="Use the QR already at your masjid" action="Get started" art="./assets/masjid-payment-setup.png" onClick={() => go('scan')} />}
        <P2Section title="Operations" hint="Run the masjid" />
        <div className="deck">
          <button type="button" className="deck-tile jade"><span className="deck-tile-value">1:30PM</span><strong>Salaah</strong><small>Next Zohar · iqama +15m</small></button>
          <button type="button" className="deck-tile teal"><span className="deck-tile-value">4</span><strong>Committee</strong><small>1 waiting to accept</small></button>
          <button type="button" className="deck-tile gold"><span className="deck-tile-value">1.3k</span><strong>Musalleen</strong><small>Receiving every paigham</small></button>
          <button type="button" className="deck-tile" onClick={() => go('masjid-details')}><P2Icon name="mosque" className="deck-tile-glyph" /><strong>Masjid details</strong><small>{P2_MASJID.code}</small></button>
        </div>
        <P2Section title="Recent paighams" hint="4 sent" />
        <P2Group><P2Row icon="campaign" title="Jumah bayan begins at 1:00 PM" subtitle="Sent by Ayaan Khan" /></P2Group>
      </P2Scroll>
    </P2Screen>
  );
}

// `.camera-stage` is the kit's full-bleed capture shell (masjid registration uses it for photos).
function P2Scan({ title, hint, action, onBack, onScan }) {
  return (
    <P2Screen>
      <div className="camera-stage">
        <div className="camera-topbar">
          <button type="button" className="ib ib-tonal camera-control" onClick={onBack} aria-label="Back"><P2Icon name="arrow_back" /></button>
          <div className="camera-title">{title}<small>{hint}</small></div>
          <span className="p2-camera-spacer" />
        </div>
        <div className="camera-viewport">
          <div className="camera-guide" />
          <P2Icon name="qr_code_scanner" className="p2-viewfinder-glyph" />
        </div>
        <div className="camera-capture-actions">
          <button type="button" className="btn btn-filled lg camera-use-photo" onClick={onScan}><P2Icon name="qr_code_scanner" />{action}</button>
          <span className="docked-action-note p2-on-dark">Design POC · camera is not connected</span>
        </div>
      </div>
    </P2Screen>
  );
}

// `replacing` is the same Review stage reached from an ACTIVE payee: the new QR is listed apart
// from the payee followers pay today, and the copy says the active one stays until approval.
function P2Review({ go, replacing = false }) {
  const scan = replacing ? 'replace-scan' : 'scan';
  const found = replacing ? P2_NEW_PAYEE : P2_MASJID;
  return (
    <P2Screen>
      <P2AppBar title={replacing ? 'Replace payment QR' : 'Check QR details'} back={() => go(scan)} />
      <P2Scroll>
        <P2Heading eyebrow={replacing ? 'Found on the new QR' : 'Found on your QR'} title={replacing ? 'Use this QR instead?' : 'Is this your masjid’s payment QR?'} />
        <P2Group label={replacing ? 'New QR' : undefined}>
          <P2Row title="Payee name" value={found.payee} />
          <P2Row title="UPI ID" value={found.vpa} />
        </P2Group>
        {replacing && (
          <P2Group label="Active until approved">
            <P2Row icon="verified" title={P2_MASJID.bankName} subtitle={`${P2_MASJID.vpa} · followers pay this payee now`} />
          </P2Group>
        )}
        <P2Note>{replacing
          ? 'Paigham checks the new UPI ID with the bank, then a Paigham admin reviews it. Your current payee stays active until the admin approves the new one, and your requests stay open.'
          : 'Paigham checks this UPI ID with the bank, then a Paigham admin reviews it before payments are enabled.'}</P2Note>
      </P2Scroll>
      <P2Docked>
        <P2Button onClick={() => go(replacing ? 'replace-pending' : 'pending')}>Submit for review</P2Button>
        <P2Button kind="btn-tonal" onClick={() => go(scan)}>Scan a different QR</P2Button>
      </P2Docked>
    </P2Screen>
  );
}

function P2Pending({ go }) {
  return (
    <P2Screen>
      <P2AppBar title="Payment setup" back={() => go('console')} />
      <P2Scroll>
        <P2Outcome icon="schedule" title="We’re checking your QR" description="Paigham Admin compares the payee details with your masjid record." />
        <P2Group label="Submitted payee"><P2PendingPayeeRow payee={P2_MASJID} prefix="" /></P2Group>
      </P2Scroll>
      <P2Docked><P2Button kind="btn-tonal" onClick={() => go('console')}>Back to Console</P2Button></P2Docked>
    </P2Screen>
  );
}

// Setup reached with an ACTIVE payee. It used to offer only Open payments, so a replacement
// could not be started (F7); it now offers Replace payment QR, and doubles as the Submitted
// stage of a replacement: the active payee first, the replacement under its own label.
function P2Ready({ go, replacement = 'none' }) {
  const description = replacement === 'pending'
    ? 'Followers keep paying your active payee while Paigham Admin reviews the new QR.'
    : replacement === 'returned'
      ? 'Followers keep paying your active payee. The new QR was returned.'
      : 'Followers see your verified payee details before they open a UPI app.';
  return (
    <P2Screen>
      <P2AppBar title="Payment setup" back={() => go(replacement === 'none' ? 'console' : 'console-ready')} />
      <P2Scroll>
        <P2Outcome icon="verified" tone="success" title="Payments are on" description={description} />
        {replacement === 'returned' && <P2ReturnedCard go={go} />}
        <P2PayeeGroup label={replacement === 'none' ? 'Pays to' : 'Active payee'} />
        {replacement === 'pending' && (
          <>
            <P2Group label="Awaiting review"><P2PendingPayeeRow /></P2Group>
            <P2Note>Your requests stay open. Followers pay the active payee until the new one is approved.</P2Note>
          </>
        )}
      </P2Scroll>
      <P2Docked>
        <P2Button onClick={() => go('masjid-payments')}>Open payments</P2Button>
        {replacement === 'none' && <P2Button kind="btn-tonal" icon="swap_horiz" onClick={() => go('replace-scan')}>Replace payment QR</P2Button>}
      </P2Docked>
    </P2Screen>
  );
}

// ── Paigham Admin · review ─────────────────────────────────────────────

// Stand-in for the real AdminHubScreen (admin/storyboards/admin-screens.jsx), rebuilt from the
// same kit pieces it uses: `.list-group.attention` rows with amber counts and the `.deck`.
// PROPOSAL: render the real AdminHubScreen once its deck takes a Payment QRs tile.
function P2AdminHome({ go }) {
  return (
    <P2Screen>
      <P2Scroll bar={false}>
        <P2Row lead={<span className="avatar accent">T</span>} title="Toufeeq Ahamed" subtitle="Super Admin · approvals for the whole platform" trailing={<button type="button" className="ib ib-link" aria-label="Log out"><P2Icon name="logout" /></button>} />
        <P2Group attention>
          <P2Row icon="fact_check" title="3 masjid requests to review" subtitle="Registrations and claims waiting on a decision" trailing={<P2Badge tone="amber">3</P2Badge>} />
          <P2Row icon="campaign" title="2 paighams waiting to go live" subtitle="Sent by committees, held for a moderator" trailing={<P2Badge tone="amber">2</P2Badge>} />
        </P2Group>
        <P2PaymentQrSnapshot go={go} />
        <P2Section title="Operations" hint="Run the platform" />
        <div className="deck">
          <button type="button" className="deck-tile jade"><span className="deck-tile-value">3</span><strong>Approvals</strong><small>masjid requests waiting</small></button>
          <button type="button" className="deck-tile teal"><span className="deck-tile-value">2</span><strong>Paighams</strong><small>held for a moderator</small></button>
          <button type="button" className="deck-tile gold"><span className="deck-tile-value">214</span><strong>Masjids</strong><small>verified</small></button>
          <button type="button" className="deck-tile"><P2Icon name="schedule" className="deck-tile-glyph" /><strong>Salaah timings</strong><small>Publish rules for any masjid</small></button>
        </div>
        <P2Note icon="shield">Payment QR reviews sit in their own card. Masjid registration approvals stay in Approvals.</P2Note>
      </P2Scroll>
    </P2Screen>
  );
}

function P2AdminQueue({ go }) {
  return (
    <P2Screen>
      <P2AppBar title="Payment QRs" subtitle="Operations" back={() => go('admin-home')} />
      <P2Scroll>
        <P2Section title="Pending" hint="1 masjid" />
        <P2Group>
          <P2Row lead={<P2MasjidMark masjid={P2_MASJID} size={40} />} title={P2_MASJID.name} subtitle={`${P2_MASJID.place} · submitted today`} onClick={() => go('admin-review')} />
        </P2Group>
        <P2Note icon="shield">This queue reviews existing masjid payment QRs, not masjid registration or claim requests.</P2Note>
      </P2Scroll>
    </P2Screen>
  );
}

function P2AdminReview({ go }) {
  return (
    <P2Screen>
      <P2AppBar title="Review payment QR" subtitle={P2_MASJID.name} back={() => go('admin-queue')} />
      <P2Scroll>
        <P2Heading eyebrow="QR submission" title="Do these details match?" />
        <P2Group label="Masjid record">
          <P2Row title="Masjid" value={P2_MASJID.name} />
          <P2Row title="City" value={P2_MASJID.place} />
        </P2Group>
        <P2Group label="QR payee">
          <P2Row title="Name on QR" value={P2_MASJID.payee} />
          <P2Row title="UPI ID" value={P2_MASJID.vpa} />
          <P2Row title="Name at bank" value={P2_MASJID.bankName} />
          <P2Row title="UPI ID check" trailing={<P2Badge tone="jade">Valid</P2Badge>} />
        </P2Group>
        <P2Note icon="shield">Compare the masjid record with the name the bank holds for this UPI ID. Approve is only available once the UPI ID check is valid.</P2Note>
      </P2Scroll>
      <P2Docked>
        <P2Button onClick={() => go('admin-approved')}>Approve QR</P2Button>
        <P2Button kind="btn-tonal" onClick={() => go('admin-returned')}>Return for correction</P2Button>
      </P2Docked>
    </P2Screen>
  );
}

function P2AdminDecision({ go, approved }) {
  return (
    <P2Screen>
      <P2AppBar title="Payment QR review" back={() => go('admin-queue')} />
      <P2Scroll>
        <P2Outcome icon={approved ? 'verified' : 'reply'} tone={approved ? 'success' : 'neutral'} title={approved ? 'QR approved' : 'Needs a new QR'} description={approved ? 'Masjid E Bilal can now receive direct UPI payments through its existing payee.' : 'The masjid admin is asked to scan the current payment QR again.'} />
      </P2Scroll>
      <P2Docked><P2Button onClick={() => go(approved ? 'ready' : 'scan')}>{approved ? 'View masjid state' : 'View rescan flow'}</P2Button></P2Docked>
    </P2Screen>
  );
}

// ── Masjid · requests & activity ───────────────────────────────────────

// Follows the Console's DetailsBody: `.media-identity-hero`, then eyebrow-labelled groups.
// DetailsBody's `.detail-field` is page-local to the Masjid Console, so rows here are kit
// `.list-item` label/value pairs (PROPOSAL: promote `.detail-field` to the kit).
function P2MasjidDetails({ go, ready = true, requests = P2_REQUESTS, replacement = 'none', anchor }) {
  const live = requests.filter((request) => request.masjid === 'bilal').length;
  return (
    <P2Screen>
      <P2AppBar title="Masjid details" subtitle={P2_MASJID.name} back={() => go(ready ? 'console-ready' : 'console')} />
      <P2Scroll anchor={anchor}>
        <div className="media-identity-hero p2-bleed">
          <img src={P2_MASJID.photo} alt={`${P2_MASJID.name} entrance`} />
          <div className="media-identity-hero-copy">
            <div className="screen-title on-media">{P2_MASJID.name}</div>
            <div className="media-identity-hero-caption"><span className="badge sm gold"><P2Icon name="verified" />Verified</span></div>
          </div>
        </div>
        <P2Group label="Identity">
          <P2Row title="Masjid code" value={P2_MASJID.code} />
          <P2Row title="City" value={P2_MASJID.place} />
        </P2Group>
        {ready ? (
          <>
            <P2Group label="Payments" anchor="payments">
              <P2Row title="Status" trailing={<P2Badge tone="jade">Accepting</P2Badge>} />
              <P2Row title="Name at bank" value={P2_MASJID.bankName} />
              <P2Row title="UPI ID" value={P2_MASJID.vpa} />
              <P2Row title="Reviewed" value="20 Sep 2026" />
              {replacement === 'none' && <P2ReplaceRow go={go} />}
              <P2Row icon="volunteer_activism" title="Payment requests" subtitle={`${live} live · requests and activity`} onClick={() => go(replacement === 'none' ? 'masjid-payments' : replacement === 'pending' ? 'hub-replacing' : 'hub-replace-returned')} />
            </P2Group>
            {replacement === 'pending' && (
              <P2Group label="New QR · in review">
                <P2Row title="Status" trailing={<P2Badge tone="amber">In review</P2Badge>} />
                <P2Row title="Payee name" value={P2_NEW_PAYEE.payee} />
                <P2Row title="UPI ID" value={P2_NEW_PAYEE.vpa} />
                <P2Row title="Submitted" value="Today" />
              </P2Group>
            )}
            {replacement === 'returned' && <P2ReturnedCard go={go} />}
            <P2Note icon="verified">{replacement === 'pending'
              ? `Followers keep paying ${P2_MASJID.bankName} until Paigham Admin approves the new QR.`
              : 'Shown to followers before they open a UPI app. Replacing the payee needs a new QR review.'}</P2Note>
          </>
        ) : (
          <P2Group label="Payments">
            <P2Row title="Status" trailing={<P2Badge tone="muted">Not set up</P2Badge>} />
            <P2Row icon="qr_code_scanner" title="Set up UPI payments" subtitle="Scan the payment QR already at your masjid" onClick={() => go('scan')} />
          </P2Group>
        )}
      </P2Scroll>
    </P2Screen>
  );
}

// The Console's send composer (ConsoleHome's BroadcastComposer), asking for money instead of a
// message. Its field is the first surface of step 1, not an input of its own: focusing it opens
// the amount step, exactly as the Console's textarea opens the paigham wizard. The two shortcuts
// play the part of Record audio / Add photos — each opens step 1 with that amount filled in.
// PROPOSAL `.composer-card`: promote `.bcs-composer` from broadcast-studio.css into the kit so
// the Console and this hub share one construction; until then it is restated as `.p2-composer`.
function P2RequestComposer({ go, form, setForm }) {
  const start = (target) => { if (target) setForm({ ...form, target }); go('request-amount'); };
  return (
    <section className="p2-composer">
      <span className="p2-composer-kicker">PAYMENT REQUEST</span>
      <h1>What does the masjid need?</h1>
      <p>Ask all 1.3k musalleen of {P2_MASJID.name}. Start with the amount; a title is optional.</p>
      <input className="p2-composer-field" readOnly aria-label="Start a payment request" placeholder="₹  Amount needed, e.g. 5,000" onFocus={() => start()} onClick={() => start()} />
      <div className="p2-composer-tools">
        {['1000', '5000'].map((target) => <button type="button" key={target} className="btn btn-tonal sm" onClick={() => start(target)}><P2Icon name="add" />{p2Rupees(target)}</button>)}
      </div>
    </section>
  );
}

// Payments hub: the top of the screen is the ask, the bottom is what followers did with it.
// The `.fab` keeps "New request" reachable once the highlight scrolls away.
// Extensions (F6): Extend shows only where the server would accept it — an open request ending
// within 3 days, or one that ended at most 7 days ago — and never past 3 extensions or for a met
// request. Where it is not available the row says why rather than offering a refused action.
function P2MasjidPayments({ go, form, setForm, requests = P2_REQUESTS, ended = P2_ENDED, onClose = P2_NOOP, onExtend = P2_NOOP, confirmInitial = null, replacement = 'none', anchor }) {
  const { Dialog } = window;
  const own = requests.filter((request) => request.masjid === 'bilal');
  const soon = own.find(p2EndingSoon);
  const soonBlock = soon ? p2ExtendBlock(soon) : null;
  const reopen = ended.find((request) => request.how === 'ended' && !p2ExtendBlock(request));
  // An ended (not met) row leads with whether it can still be extended; the line is narrow beside
  // the date badge, so the reason replaces the amount and starts rather than being cut off.
  const endedSubtitle = (request) => {
    if (request.how === 'met') return `${p2Rupees(request.amount)} · ${request.starts} payment starts`;
    return p2ExtendBlock(request) || `Can be extended until ${p2ExtendableUntil(request)}`;
  };
  const [confirmId, setConfirmId] = React.useState(confirmInitial);
  const confirming = own.find((request) => request.id === confirmId);
  return (
    <P2Screen>
      <P2AppBar title="Payments" subtitle={P2_MASJID.name} back={() => go('console-ready')} />
      <P2Scroll fab anchor={anchor}>
        <P2RequestComposer go={go} form={form} setForm={setForm} />
        {replacement === 'returned' && <P2ReturnedCard go={go} />}
        {soon && (
          // The reminder the committee also gets as a notification: nothing ends without warning.
          // At the extension limit it offers Mark as met only, and says why.
          <div className="list-group attention p2-reminder">
            <P2Row icon="schedule" title={`${p2RequestTitle(soon)} ends in ${soon.endsIn} days`} subtitle={`Ends ${p2EndDate(soon.endsIn)} · ${soon.starts} payment starts so far${soonBlock ? `. ${soonBlock}.` : ''}`} />
            <div className={`p2-reminder-actions ${soonBlock ? 'single' : ''}`}>
              {!soonBlock && <button type="button" className="btn btn-tonal sm" onClick={() => onExtend(soon.id)}>Extend {P2_EXTEND_DAYS} days</button>}
              <button type="button" className="btn btn-filled sm" onClick={() => setConfirmId(soon.id)}>Mark as met</button>
            </div>
          </div>
        )}
        {reopen && (
          // An ended, not-met request inside the 7-day window: the same reminder, Extend only —
          // an ended request cannot be marked met.
          <div className="list-group attention p2-reminder">
            <P2Row icon="history" title={`${p2RequestTitle(reopen)} ended ${reopen.endedAgo} days ago`} subtitle={`You can extend it until ${p2ExtendableUntil(reopen)} · ${reopen.starts} payment starts so far`} />
            <div className="p2-reminder-actions single">
              <button type="button" className="btn btn-tonal sm" onClick={() => onExtend(reopen.id)}>Extend {P2_EXTEND_DAYS} days</button>
            </div>
          </div>
        )}
        <P2Section title="Live requests" hint={`${own.length} visible to followers`} />
        <P2Group>
          {own.map((request) => <P2Row key={request.id} icon={request.icon} title={p2RequestTitle(request)} subtitle={`${p2Rupees(request.amount)} requested · ends ${p2EndDate(request.endsIn)}`} trailing={<button type="button" className="chip outline" onClick={() => setConfirmId(request.id)}>Need met</button>} />)}
        </P2Group>
        <P2Section title="Activity" action={{ text: '12 this month · View all', onClick: () => go('initiations') }} />
        <P2Group>
          {P2_STARTS.slice(0, 2).map((start) => <P2Row key={start.when} icon="arrow_forward" title={`${p2Rupees(start.amount)} · ${start.note}`} subtitle={`${start.when} · UPI app opened`} trailing={<P2Badge>Started</P2Badge>} onClick={() => go('initiations')} />)}
        </P2Group>
        <P2Note>Activity shows payment starts only. Confirm money received in your bank or UPI app.</P2Note>
        <P2Section title="Ended" hint="No longer shown to followers" anchor="ended" />
        <P2Group>
          {ended.map((request) => <P2Row key={request.id} icon={request.icon} title={p2RequestTitle(request)} subtitle={endedSubtitle(request)} trailing={<P2Badge tone="muted">{request.how === 'met' ? 'Met' : 'Ended'} {request.endedOn}</P2Badge>} />)}
        </P2Group>
        <P2Group label="Payee" anchor="payee">
          <P2Row icon="verified" title={P2_MASJID.payee} subtitle={`${replacement === 'none' ? '' : 'Active · '}${P2_MASJID.vpa}`} onClick={() => go(replacement === 'pending' ? 'details-replacing' : 'masjid-details')} />
          {replacement === 'pending' ? <P2PendingPayeeRow /> : <P2ReplaceRow go={go} />}
        </P2Group>
      </P2Scroll>
      <button type="button" className="fab" onClick={() => go('request-amount')} aria-label="New payment request"><P2Icon name="add" /><span className="fab-label">New request</span></button>
      {Dialog && confirming && (
        <Dialog
          isOpen
          onClose={() => setConfirmId(null)}
          title="Mark this need as met?"
          description={`“${p2RequestTitle(confirming)}” leaves followers’ Home and the request list now. Its ${confirming.starts} payment starts stay in your activity.`}
          primary={{ text: 'Mark as met', onClick: () => { onClose(confirming.id); setConfirmId(null); } }}
          secondary={{ text: 'Keep it live', onClick: () => setConfirmId(null) }}
        />
      )}
    </P2Screen>
  );
}
// Continue stays enabled (proposal 2): the press answers with a field-level error, as
// registration's Continue and the Salaah editor's Publish do. A grey button never says what is wrong.
function P2RequestAmount({ go, form, setForm, errorInitial = false }) {
  const [tried, setTried] = React.useState(errorInitial);
  const problem = p2AmountError(form.target, P2_REQUEST_MAX, `A request can be up to ${p2Rupees(P2_REQUEST_MAX)}`);
  const next = () => { if (problem) { setTried(true); return; } go('request-details'); };
  return (
    <P2Screen>
      <P2AppBar title="New request" back={() => go('masjid-payments')} step={1} />
      <P2Scroll step>
        <P2Heading eyebrow="Start with the need" title="How much is needed?" lead="Followers see this amount on the request card." />
        <P2AmountField label="Amount needed" value={form.target} onChange={(target) => setForm({ ...form, target })} presets={['1000', '5000', '10000', '25000']} error={tried ? problem : null} />
        <P2Note>A requested amount, not a target Paigham can track. Followers do not see a progress bar or a collected total.</P2Note>
      </P2Scroll>
      <P2Docked>
        <P2Button onClick={next}>Continue</P2Button>
      </P2Docked>
    </P2Screen>
  );
}

// Step 2 is skippable: a request with no title is shown to followers as "Support <masjid>".
function P2RequestDetails({ go, form, setForm }) {
  const empty = !form.title.trim() && !form.detail.trim();
  return (
    <P2Screen>
      <P2AppBar title="New request" back={() => go('request-amount')} step={2} />
      <P2Scroll step>
        <P2Heading eyebrow="Optional" title="Add a title?" lead="A title helps followers see the need at a glance. You can skip this." />
        <div className="field">
          <div className="flabel">Title</div>
          <div className="input"><div className="inner"><input className="val" maxLength="70" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Repair the water cooler" /></div></div>
        </div>
        <div className="field">
          <div className="flabel">Details</div>
          <div className="input p2-textarea"><div className="inner"><textarea className="val" maxLength="300" rows="4" value={form.detail} onChange={(event) => setForm({ ...form, detail: event.target.value })} placeholder="Share why this is needed" /></div></div>
          <div className="helper">Optional · up to 300 characters</div>
        </div>
        <P2Note>Without a title, followers see “{p2RequestTitle({ masjid: 'bilal' })}”.</P2Note>
      </P2Scroll>
      <P2Docked note="For news that does not ask for money, send a New Paigham from your Console.">
        <P2Button onClick={() => go('request-review')}>{empty ? 'Skip and review' : 'Review request'}</P2Button>
      </P2Docked>
    </P2Screen>
  );
}

// The end date is a filled-in row, not a step: 30 days unless the committee changes it.
function P2RequestReview({ go, form, setForm = P2_NOOP, sheetInitial = false }) {
  const { OptionSheet } = window;
  const [sheet, setSheet] = React.useState(sheetInitial);
  const duration = form.duration || P2_DEFAULT_DURATION;
  const request = { masjid: 'bilal', title: form.title, detail: form.detail, amount: form.target || P2_SAMPLE_FORM.target, icon: 'volunteer_activism', endsIn: Number(duration) };
  return (
    <P2Screen>
      <P2AppBar title="New request" back={() => go('request-details')} step={3} />
      <P2Scroll step>
        <P2Heading eyebrow="What followers will see" title="Ready to publish?" />
        <P2RequestCard request={request} />
        <P2Group>
          <P2Row icon="account_balance" title={`${p2Rupees(request.amount)} needed`} subtitle="Amount" onClick={() => go('request-amount')} />
          <P2Row icon="edit" title={request.title.trim() ? request.title : 'No title'} subtitle={request.detail.trim() ? 'Title and details' : 'Title · optional'} onClick={() => go('request-details')} />
          <P2Row icon="calendar_month" title={`Ends ${p2EndDate(duration)}`} subtitle={`${p2DurationLabel(duration)} · you can mark it met sooner`} onClick={() => setSheet(true)} />
        </P2Group>
        <P2Note>Paigham cannot confirm or total the money received. This request does not show collection progress.</P2Note>
      </P2Scroll>
      <P2Docked><P2Button onClick={() => go('published')}>Publish request</P2Button></P2Docked>
      {OptionSheet && <OptionSheet isOpen={sheet} title="Keep it live for" value={duration} options={P2_DURATIONS.map(([value, label]) => ({ value, label: `${label} · ends ${p2EndDate(value)}` }))} onPick={(value) => setForm({ ...form, duration: value })} onClose={() => setSheet(false)} />}
    </P2Screen>
  );
}
function P2Published({ go, form }) {
  return (
    <P2Screen>
      <P2AppBar title="Published" back={() => go('masjid-payments')} />
      <P2Scroll>
        <P2Outcome icon="campaign" tone="success" title="Your request is live" description={`${p2RequestTitle({ masjid: 'bilal', title: form.title })} · ${p2Rupees(form.target || P2_SAMPLE_FORM.target)} requested · ends ${p2EndDate(form.duration || P2_DEFAULT_DURATION)}`} />
      </P2Scroll>
      <P2Docked>
        <P2Button onClick={() => go('user-home-weekday')}>View as a follower</P2Button>
        <P2Button kind="btn-tonal" onClick={() => go('masjid-payments')}>Back to payments</P2Button>
      </P2Docked>
    </P2Screen>
  );
}

function P2Initiations({ go }) {
  return (
    <P2Screen>
      <P2AppBar title="Payment starts" subtitle="September" back={() => go('masjid-payments')} />
      <P2Scroll>
        <div className="summary-hero">
          <P2Tile icon="arrow_forward" accent />
          <div className="summary-hero-copy">
            <div className="summary-hero-value">12</div>
            <div className="summary-hero-label">UPI app opens this month · not confirmed payments</div>
          </div>
        </div>
        <P2Section title="Recent starts" />
        <P2Group>
          {P2_STARTS.map((start) => <P2Row key={start.when} icon="arrow_forward" title={p2Rupees(start.amount)} subtitle={`${start.when} · ${start.note}`} trailing={<P2Badge>Started</P2Badge>} />)}
        </P2Group>
        <P2Note>Do not use this list as a ledger. Confirm actual receipts in your bank or UPI app.</P2Note>
      </P2Scroll>
    </P2Screen>
  );
}

// ── Follower · discover ────────────────────────────────────────────────

// Stand-in for the real HomeScreen (home/storyboards/broadcast-home-screens.jsx): its hero and
// Salaah strip are reduced to what places the payments section. The Friday card appears only on
// Fridays and only when the primary masjid accepts payments; it goes straight to giving. Requests
// sit below it as one swipeable rail; "Choose a masjid" is only ever the rail's last card.
// With no live requests there is no empty state — the section simply is not there. A primary
// masjid that accepts UPI still gets one card to give to it directly, except on a Friday, when
// the Friday card is already that card.
// PROPOSAL: render the real HomeScreen with a `giving` slot instead of this stand-in.
// Scan is Home's one floating action: centred over the nav bar, named on arrival and collapsed
// to its glyph once the reader scrolls past the same 24px the Home FAB uses.
// A committee member's Home already owns a FAB — Send a paigham — and a screen gets one. For them
// the two share one wide floating action split in two, Paigham | Scan QR; both segments collapse to
// their glyphs on scroll, exactly like the single FAB (PROPOSAL `.fab-split`).
const P2_FAB_COLLAPSE_AT = 24;
function P2Home({ go, give, friday = false, requests = P2_REQUESTS, primaryAccepting = true, committee = false }) {
  const { BottomNav } = window;
  const [fabCompact, setFabCompact] = React.useState(false);
  const empty = requests.length === 0;
  const done = friday ? 1 : 4;
  return (
    <P2Screen>
      <P2Scroll bar={false} nav onScroll={(event) => setFabCompact(event.currentTarget.scrollTop > P2_FAB_COLLAPSE_AT)}>
        <section className="p2-user-hero">
          <div className="p2-user-greet">
            <span className="avatar">T</span>
            <span><strong>Salaam, Toufeeq Ahamed</strong><small>{P2_MASJID.name}<P2Icon name="unfold_more" /></small></span>
            <button type="button" className="ib ib-tonal md" aria-label="Notifications"><P2Icon name="notifications" /></button>
          </div>
          <div className="p2-prayer-stage">
            <span className="eyebrow">{friday ? 'Jumu‘ah · Friday' : 'Azan · 6:49 PM'}</span>
            <strong>{friday ? 'Jumu‘ah 1:30 PM' : 'Maghrib 6:52 PM'}</strong>
          </div>
        </section>
        <section className="p2-user-content">
          <P2Section title="Track Salaah" hint={`${done} of 5 today`} />
          <div className="p2-salaah-track">
            {['Fajr', 'Zohar', 'Asr', 'Maghrib', 'Isha'].map((name, i) => <span key={name}><span className={`cb small ${i < done ? 'on' : ''}`}>{i < done && <P2Icon name="check" />}</span><small>{friday && name === 'Zohar' ? 'Jumu‘ah' : name}</small></span>)}
          </div>
          {friday && <P2Promo eyebrow="Jumu‘ah Mubarak" title="Give this Jumu‘ah" copy={`${P2_MASJID.name} · your primary masjid`} action="Give directly" art="./assets/friday-giving.png" onClick={() => give('bilal')} />}
          {empty ? (
            !friday && primaryAccepting && <P2Promo eyebrow="Your primary masjid" title={`Give to ${P2_MASJID.name}`} copy={`Verified payee · ${P2_MASJID.bankName}`} action="Give directly" art="./assets/friday-giving.png" onClick={() => give('bilal')} />
          ) : (
            <>
              <P2Section title="Requests from your masjids" action={{ text: 'View all', onClick: () => go('updates') }} />
              <P2RequestRail requests={requests} give={give} go={go} />
            </>
          )}
          <P2Section title="For you" />
          <div className="p2-media-grid">
            <button type="button" className="media-tile"><img src="/images/maghrib_quran.webp" alt="" /><span className="media-tile-label">Quran</span></button>
            <button type="button" className="media-tile"><img src="/images/maghrib_dua.webp" alt="" /><span className="media-tile-label">Dua &amp; Dikhr</span></button>
          </div>
        </section>
      </P2Scroll>
      {committee ? (
        // Send a paigham opens the console here, standing in for the real composer.
        <div className="p2-fab-center">
          <div className={`p2-fab-split ${fabCompact ? 'compact' : ''}`} role="group" aria-label="Quick actions">
            <button type="button" onClick={() => go('console-ready')} aria-label="Send a paigham"><P2Icon name="campaign" /><span className="fab-label">Paigham</span></button>
            <button type="button" onClick={() => go('user-scan')} aria-label="Scan a masjid QR"><P2Icon name="qr_code_scanner" /><span className="fab-label">Scan QR</span></button>
          </div>
        </div>
      ) : (
        <div className="p2-fab-center">
          <button type="button" className={`fab ${fabCompact ? 'compact' : ''}`} onClick={() => go('user-scan')} aria-label="Scan a masjid QR"><P2Icon name="qr_code_scanner" /><span className="fab-label">Scan masjid QR</span></button>
        </div>
      )}
      {BottomNav && <BottomNav activeIndex={0} />}
    </P2Screen>
  );
}

// PROPOSAL `.card-rail` — a horizontal scroll-snap rail with the kit pager (`.ind` / `.dot`)
// under it. Home's Qaum carousel builds the same thing inline; one construction would serve both.
function P2RequestRail({ requests, give, go }) {
  const track = React.useRef(null);
  const [index, setIndex] = React.useState(0);
  const slides = requests.length + 1;
  const onScroll = () => {
    const el = track.current;
    const first = el && el.firstElementChild;
    if (!first) return;
    const step = first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || 0);
    setIndex(Math.min(slides - 1, Math.round(el.scrollLeft / step)));
  };
  return (
    <div>
      <div className="p2-rail-track" ref={track} onScroll={onScroll}>
        {requests.map((request) => <P2RequestCard key={request.id} request={request} onGive={() => give(request.masjid, request)} />)}
        <article className="p2-request-card is-more">
          <P2Tile icon="mosque" />
          <div className="section-title">Give to another masjid</div>
          <p className="p2-lead">Any masjid you follow with a verified UPI payee.</p>
          <div className="p2-request-card-foot"><span /><button type="button" className="btn btn-tonal" onClick={() => go('choose-masjid')}>Choose<P2Icon name="arrow_forward" /></button></div>
        </article>
      </div>
      <div className="ind p2-rail-pager" aria-hidden="true">
        {Array.from({ length: slides }, (_, item) => <span key={item} className={`dot ${item === index ? 'active' : ''}`} />)}
      </div>
    </div>
  );
}

function P2ChooseMasjid({ go, give, backTo = 'user-home-empty' }) {
  return (
    <P2Screen>
      <P2AppBar title="Choose a masjid" subtitle="Masjids you follow" back={() => go(backTo)} />
      <P2Scroll>
        <P2Heading title="Give directly" lead="Only masjids with an Admin-approved UPI payee are ready." />
        {/* Every followed masjid with an ACTIVE payee, primary first then by name, whether or not it
            has a live request (Masjid E Quba has none). "Verified payee" always sits beside the
            bank name (TRD §8.1). */}
        <P2Group label="Accepting UPI">
          {Object.values(P2_MASJIDS).map((masjid) => <P2Row key={masjid.key} lead={<P2MasjidMark masjid={masjid} size={40} />} title={masjid.name} subtitle={`${masjid.key === P2_MASJID.key ? 'Primary · ' : ''}${masjid.place} · Verified payee · ${masjid.bankName}`} onClick={() => give(masjid.key)} />)}
        </P2Group>
        <P2Group label="Not accepting yet">
          <P2Row lead={<P2Tile icon="mosque" size={40} />} title="Masjid Al Noor" subtitle="UPI setup not complete" trailing={<P2Badge tone="muted">Not yet</P2Badge>} />
        </P2Group>
      </P2Scroll>
    </P2Screen>
  );
}

function P2Updates({ go, give, requests = P2_REQUESTS }) {
  return (
    <P2Screen>
      <P2AppBar title="Payment requests" subtitle="From masjids you follow" back={() => go('user-home')} />
      <P2Scroll>
        <P2Heading title="Ways to help" lead="Give directly to a verified masjid payee. Requested amounts are not progress totals." />
        <P2Group>
          {requests.map((request) => <P2Row key={request.id} icon={request.icon} title={p2RequestTitle(request)} subtitle={`${P2_MASJIDS[request.masjid].name} · ${p2Rupees(request.amount)} requested · ends ${p2EndDate(request.endsIn)}`} trailing={<span className="chip accent">Give</span>} onClick={() => give(request.masjid, request)} />)}
        </P2Group>
      </P2Scroll>
    </P2Screen>
  );
}

// ── Follower · UPI handoff ─────────────────────────────────────────────

// Choose a UPI app stays enabled and answers an invalid amount under the field (proposal 2).
// `preparing`: after an app is picked, the hand-off is being recorded — the button is inert and
//   busy, the field holds still, and the capsule names the app; nothing opens until it returns.
// `changed`: the server refused the prepare with PAYEE_CHANGED (the masjid's active payee is not
//   the one this screen showed). The refreshed payee moves to the top under an attention row, and
//   the action becomes an explicit confirmation; no UPI app was opened (F10).
function P2Amount({ go, amount, setAmount, backTo = 'user-home', masjid = P2_MASJID, request = null, errorInitial = false, preparing = false, changed = false, app = 'Google Pay' }) {
  const [tried, setTried] = React.useState(errorInitial);
  const problem = p2AmountError(amount, P2_GIVE_MAX, `You can give up to ${p2Rupees(P2_GIVE_MAX)} at a time`);
  const next = () => { if (problem) { setTried(true); return; } go('apps'); };
  // POC only: stand in for the prepare round trip, then hand off.
  React.useEffect(() => {
    if (!preparing) return undefined;
    const timer = setTimeout(() => go('handoff'), 1600);
    return () => clearTimeout(timer);
  }, [preparing]);
  return (
    <P2Screen>
      <P2AppBar title="Give with UPI" back={() => go(backTo)} />
      <P2Scroll>
        <P2Group><P2Identity masjid={masjid} /></P2Group>
        {changed && (
          <>
            <P2Group attention><P2Row icon="update" title="These UPI details changed" subtitle="No UPI app was opened. Check the new name and UPI ID before you pay." /></P2Group>
            <P2PayeeGroup masjid={masjid} label="Pays to · updated" />
          </>
        )}
        <div className="summary-hero">
          <P2Tile icon={request ? request.icon : 'favorite'} accent />
          <div className="summary-hero-copy">
            <div className="eyebrow accent">{request ? 'Towards a request' : 'General giving'}</div>
            <div className="summary-hero-title">{request ? p2RequestTitle(request) : `Give to ${masjid.name}`}</div>
            {request && <div className="summary-hero-label">{p2Rupees(request.amount)} requested by the masjid</div>}
          </div>
        </div>
        <P2AmountField label="Your amount" value={amount} onChange={setAmount} presets={['100', '250', '500', '1000']} error={tried ? problem : null} disabled={preparing} />
        {!changed && <P2PayeeGroup masjid={masjid} />}
        <P2Note>Money goes to this UPI payee, not Paigham. Check the name in your UPI app.</P2Note>
        <P2Note icon="shield">Paigham keeps a record that you started this payment: the amount, the app you chose and what the app reports back.</P2Note>
      </P2Scroll>
      <P2Docked status={preparing ? `Preparing ${app}…` : null}>
        <P2Button onClick={next} busy={preparing}>{changed ? 'Confirm and choose a UPI app' : 'Choose a UPI app'}</P2Button>
      </P2Docked>
    </P2Screen>
  );
}

// The kit's single-choice picker (OptionSheet): picking an app commits and hands off. The
// sheet calls onClose after onPick, so a pick must not also send the reader back.
function P2Apps({ go, amount, app, setApp, backTo, masjid, request }) {
  const { OptionSheet } = window;
  const picked = React.useRef(false);
  return (
    <>
      <P2Amount go={go} amount={amount} setAmount={P2_NOOP} backTo={backTo} masjid={masjid} request={request} />
      {OptionSheet && <OptionSheet isOpen title={`Pay ${p2Rupees(amount)} with`} value={app} options={P2_UPI_APPS.map((name) => ({ value: name, label: name }))} onPick={(name) => { picked.current = true; setApp(name); go('amount-preparing'); }} onClose={() => { if (!picked.current) go('amount'); }} />}
    </>
  );
}

function P2Handoff({ go, amount, app, masjid, request }) {
  const note = request ? p2RequestTitle(request) : 'General giving';
  const uri = `upi://pay?pa=${encodeURIComponent(masjid.vpa)}&pn=${encodeURIComponent(masjid.payee)}&am=${encodeURIComponent(amount)}&cu=INR&tn=${encodeURIComponent(note)}`;
  return (
    <P2Screen>
      <P2AppBar title="Opening UPI app" back={() => go('amount')} />
      <P2Scroll>
        <P2Outcome icon="arrow_forward" title={`Continue in ${app}`} description="Confirm the payee and amount in your UPI app. Paigham has recorded only that you started." />
        <P2Group label="Handed to your UPI app">
          <P2Row title="Amount" value={p2Rupees(amount)} />
          <P2Row title="Payee" value={masjid.payee} />
          <P2Row title="Note" value={note} />
        </P2Group>
        <div className="p2-demo">
          <span className="eyebrow faint">POC · simulate the app returning</span>
          <div className="p2-chips">
            {[['android-done', 'Android: paid'], ['android-failed', 'not paid'], ['android-unknown', 'no result'], ['ios-return', 'iOS']].map(([id, label]) => <button type="button" key={id} className="chip tonal" onClick={() => go(id)}>{label}</button>)}
          </div>
        </div>
        <span className="p2-uri" aria-label="Generated UPI URI">{uri}</span>
      </P2Scroll>
    </P2Screen>
  );
}

function P2Return({ go, kind, app, masjid = P2_MASJID }) {
  const ios = kind === 'ios-return';
  const paid = kind === 'android-done';
  const failed = kind === 'android-failed';
  const unknown = kind === 'android-unknown';
  const explanation = ios ? `${app} does not tell Paigham whether the payment went through.` : `Check the final status in ${app}. Paigham does not receive confirmation from your bank.`;
  return (
    <P2Screen>
      <P2AppBar title="Back in Paigham" back={() => go('user-home')} />
      <P2Scroll>
        <P2Outcome icon={ios ? 'arrow_forward' : paid ? 'check_circle' : failed ? 'error' : 'info'} tone={paid ? 'success' : failed ? 'error' : 'neutral'} title={ios ? `Check ${app}` : paid ? `${app} reported paid` : failed ? `${app} reported not completed` : `No result from ${app}`} description={explanation} />
        <P2PayeeGroup masjid={masjid} label="Payee" />
        <P2Note>{ios ? `Open ${app} to see whether the payment went through.` : `This is what ${app} reported, not a receipt. Your bank is the source of truth.`}</P2Note>
        <P2Group><P2Row icon="info" title={ios ? 'Why no payment status?' : 'Why is this status only indicative?'} onClick={() => go('terms')} /></P2Group>
      </P2Scroll>
      <P2Docked><P2Button onClick={() => go('user-home')}>Done</P2Button></P2Docked>
    </P2Screen>
  );
}

function P2Terms({ go, returnStage = 'android-done' }) {
  return (
    <P2Screen>
      <P2AppBar title="About payment status" back={() => go(returnStage)} />
      <P2Scroll>
        <P2Heading eyebrow="Important" title="Your bank is the source of truth" lead="On Android, a UPI app may return a result after the handoff. It can be missing or inaccurate. Paigham does not receive bank or payment-network confirmation." />
        <p className="p2-lead">On iOS, Paigham does not show a payment result. In both cases, check your UPI app or bank statement before treating a payment as completed.</p>
      </P2Scroll>
    </P2Screen>
  );
}

// ── Router, device and board ───────────────────────────────────────────

function P2Stage({ stage, live = false, go = P2_NOOP, give = P2_NOOP, approved = false, termsFrom = 'android-done', amount = '250', setAmount = P2_NOOP, app = 'Google Pay', setApp = P2_NOOP, form = P2_SAMPLE_FORM, setForm = P2_NOOP, posted = false, closed = [], extended = [], onClose = P2_NOOP, onExtend = P2_NOOP, paymentFrom = 'user-home', chooseFrom = 'user-home-empty', giveTo = { masjid: 'bilal', request: null }, replacement = 'none', recentEnded = false }) {
  const recent = recentEnded || P2_RECENT_ENDED_STAGES.includes(stage);
  const requests = p2AllRequests(form, posted, closed, extended, recent);
  const ended = p2EndedRequests(form, posted, closed, extended, recent);
  const repl = P2_STAGE_REPLACEMENT[stage] || replacement;
  const hub = { go, form, setForm, requests, ended, onClose, onExtend, replacement: repl };
  // After a confirmed PAYEE_CHANGED the follower gives to the refreshed (new) payee.
  const masjid = giveTo.payee ? { ...P2_MASJIDS[giveTo.masjid], ...P2_NEW_PAYEE } : P2_MASJIDS[giveTo.masjid];
  const request = giveTo.request;
  const amountProps = { go, amount, setAmount, backTo: paymentFrom, masjid, request, app };
  switch (stage) {
    case 'console': return <P2Console go={go} ready={approved} />;
    case 'scan': return <P2Scan title="Scan masjid QR" hint="The payment QR already at your masjid" action="Simulate QR scan" onBack={() => go('console')} onScan={() => go('review')} />;
    case 'review': return <P2Review go={go} />;
    case 'pending': return <P2Pending go={go} />;
    case 'ready': return <P2Ready go={go} replacement={repl} />;
    case 'admin-home': return <P2AdminHome go={go} />;
    case 'admin-queue': return <P2AdminQueue go={go} />;
    case 'admin-review': return <P2AdminReview go={go} />;
    case 'admin-approved': return <P2AdminDecision go={go} approved />;
    case 'admin-returned': return <P2AdminDecision go={go} />;
    case 'console-ready': return <P2Console go={go} ready requests={requests} replacement={repl} />;
    case 'masjid-details': return <P2MasjidDetails go={go} requests={requests} replacement={repl} />;
    case 'masjid-details-basic': return <P2MasjidDetails go={go} ready={false} />;
    case 'masjid-payments': return <P2MasjidPayments {...hub} />;
    case 'close-confirm': return <P2MasjidPayments {...hub} confirmInitial="untitled" />;
    case 'request-amount': return <P2RequestAmount go={go} form={form} setForm={setForm} />;
    case 'request-amount-invalid': return <P2RequestAmount go={go} form={live ? form : { ...form, target: '' }} setForm={setForm} errorInitial />;
    case 'hub-extend': return <P2MasjidPayments {...hub} />;
    case 'hub-ended-list': return <P2MasjidPayments {...hub} anchor="ended" />;
    case 'reminder-cap': return <P2MasjidPayments {...hub} requests={requests.map((item) => item.id === 'untitled' ? { ...item, extendedCount: P2_MAX_EXTENSIONS } : item)} />;
    case 'replace-scan': return <P2Scan title="Scan the new payment QR" hint="Your current payee stays active until it is approved" action="Simulate QR scan" onBack={() => go('ready')} onScan={() => go('replace-review')} />;
    case 'replace-review': return <P2Review go={go} replacing />;
    case 'replace-pending': return <P2Ready go={go} replacement="pending" />;
    case 'console-replacing': return <P2Console go={go} ready requests={requests} replacement="pending" />;
    case 'console-replace-returned': return <P2Console go={go} ready requests={requests} replacement="returned" />;
    case 'details-replacing': return <P2MasjidDetails go={go} requests={requests} replacement="pending" anchor="payments" />;
    case 'hub-replacing': return <P2MasjidPayments {...hub} anchor="payee" />;
    case 'hub-replace-returned': return <P2MasjidPayments {...hub} />;
    case 'request-details': return <P2RequestDetails go={go} form={form} setForm={setForm} />;
    case 'request-review': return <P2RequestReview go={go} form={form} setForm={setForm} />;
    case 'request-ends': return <P2RequestReview go={go} form={form} setForm={setForm} sheetInitial />;
    case 'published': return <P2Published go={go} form={form} />;
    case 'initiations': return <P2Initiations go={go} />;
    case 'user-home': return <P2Home go={go} give={give} friday requests={requests} />;
    case 'user-home-weekday': return <P2Home go={go} give={give} requests={requests} />;
    case 'user-home-empty': return <P2Home go={go} give={give} requests={[]} />;
    case 'user-home-committee': return <P2Home go={go} give={give} requests={requests} committee />;
    case 'user-home-none': return <P2Home go={go} give={give} requests={[]} primaryAccepting={false} />;
    case 'choose-masjid': return <P2ChooseMasjid go={go} give={give} backTo={chooseFrom} />;
    case 'updates': return <P2Updates go={go} give={give} requests={requests} />;
    case 'user-scan': return <P2Scan title="Scan a payment QR" hint="We check it belongs to a registered masjid" action="Simulate registered QR" onBack={() => go('user-home')} onScan={() => give('bilal')} />;
    case 'amount': return <P2Amount {...amountProps} />;
    case 'amount-invalid': return <P2Amount {...amountProps} amount={live ? amount : ''} errorInitial />;
    case 'amount-preparing': return <P2Amount {...amountProps} preparing />;
    case 'amount-changed': return <P2Amount {...amountProps} masjid={{ ...P2_MASJIDS.bilal, ...P2_NEW_PAYEE }} changed />;
    case 'apps': return <P2Apps go={go} amount={amount} app={app} setApp={setApp} backTo={paymentFrom} masjid={masjid} request={request} />;
    case 'handoff': return <P2Handoff go={go} amount={amount} app={app} masjid={masjid} request={request} />;
    case 'terms': return <P2Terms go={go} returnStage={termsFrom} />;
    default: return <P2Return go={go} kind={stage} app={app} masjid={masjid} />;
  }
}

function P2Device({ stage, live, ...props }) {
  return <div className="noor-frame" style={{ '--s': live ? '0.82' : '0.46' }}><div className="noor-frame-inner"><div className="noor-screen"><div className="noor-island" /><P2Stage stage={stage} live={live} {...props} /><div className="noor-home" /></div></div></div>;
}

const P2_MASJID_STAGES = ['console', 'console-ready', 'scan', 'review', 'pending', 'ready', 'masjid-details', 'masjid-details-basic', 'masjid-payments', 'request-amount', 'request-amount-invalid', 'request-details', 'request-review', 'request-ends', 'published', 'close-confirm', 'hub-extend', 'hub-ended-list', 'reminder-cap', 'initiations', 'replace-scan', 'replace-review', 'replace-pending', 'console-replacing', 'console-replace-returned', 'details-replacing', 'hub-replacing', 'hub-replace-returned'];
const P2_EMPTY_FORM = { title: '', detail: '', target: '', duration: P2_DEFAULT_DURATION };
function PaymentsV2Experience() {
  const params = new URLSearchParams(window.location.search);
  const [stage, setStage] = React.useState(params.get('stage') || 'console');
  const [approved, setApproved] = React.useState(false);
  const [posted, setPosted] = React.useState(false);
  const [paymentFrom, setPaymentFrom] = React.useState('user-home');
  const [termsFrom, setTermsFrom] = React.useState('android-done');
  const [amount, setAmount] = React.useState('250');
  const [app, setApp] = React.useState('Google Pay');
  const [form, setForm] = React.useState(P2_EMPTY_FORM);
  const [giveTo, setGiveTo] = React.useState({ masjid: 'bilal', request: null });
  const [chooseFrom, setChooseFrom] = React.useState('user-home-empty');
  const [closed, setClosed] = React.useState([]);
  const [extended, setExtended] = React.useState([]);
  const [replacement, setReplacement] = React.useState('none');
  const [recentEnded, setRecentEnded] = React.useState(false);
  const closeRequest = (id) => setClosed((ids) => ids.includes(id) ? ids : [...ids, id]);
  const extendRequest = (id) => setExtended((ids) => ids.includes(id) ? ids : [...ids, id]);
  const go = (target) => {
    if (target === 'terms') setTermsFrom(stage);
    if (target === 'choose-masjid' && stage !== 'amount') setChooseFrom(stage);
    if (target === 'admin-approved') setApproved(true);
    if (target === 'admin-returned') setApproved(false);
    // The amount is the only required field; a request without a title still publishes.
    if (target === 'published' && Number(form.target) > 0) setPosted(true);
    if (target === 'amount' && !['apps', 'handoff', 'amount-preparing'].includes(stage)) setPaymentFrom(stage);
    if (target === 'amount-invalid') setAmount('');
    if (target === 'request-amount-invalid') setForm((current) => ({ ...current, target: '' }));
    if (P2_STAGE_REPLACEMENT[target]) setReplacement(P2_STAGE_REPLACEMENT[target]);
    if (P2_RECENT_ENDED_STAGES.includes(target)) setRecentEnded(true);
    // Confirming changed UPI details binds the give to the refreshed payee.
    if (stage === 'amount-changed' && target === 'apps') setGiveTo({ masjid: 'bilal', request: null, payee: 'new' });
    if (target === 'amount-changed') setPaymentFrom('user-home');
    if (target === 'masjid-details' && !approved && stage === 'console') target = 'masjid-details-basic';
    setStage(target);
  };
  const give = (masjid, request = null) => { setGiveTo({ masjid, request }); setAmount('250'); go('amount'); };
  const capture = params.get('capture') === '1';
  const role = stage.startsWith('admin') ? 'admin' : P2_MASJID_STAGES.includes(stage) ? 'masjid' : 'user';
  const restart = () => { setStage('console'); setApproved(false); setPosted(false); setPaymentFrom('user-home'); setAmount('250'); setForm(P2_EMPTY_FORM); setGiveTo({ masjid: 'bilal', request: null }); setClosed([]); setExtended([]); setReplacement('none'); setRecentEnded(false); };
  return (
    <div className="poc-stage">
      <div className="poc-frames p2-board">
        <div className="p2-board-intro">
          <span className="eyebrow accent">Paigham · Payments / Design POC 03</span>
          <h1>Direct giving, without a payment claim</h1>
          <p>Five journeys on one board. A payment request has one type: the amount comes first and the title is optional. News without an ask stays a Paigham. The follower Friday card appears only on Fridays, for a primary masjid that accepts payments.</p>
          <p>Review fixes, 2 Oct 2026, approved as drawn on 2 Oct 2026: frames marked New were added, frames marked Changed alter an earlier frame. They cover extensions within 7 days of ending, replacing an active payment QR, a payee that changed before payment, and amount steps that answer on tap.</p>
          <div>{['Existing masjid UPI QR', 'Admin-reviewed payee', 'Amount first · title optional', 'No bank status'].map((tag) => <P2Badge key={tag}>{tag}</P2Badge>)}</div>
        </div>
        {P2_ROWS.map((row) => (
          <section key={row.number} className="p2-board-row">
            <div className="poc-row-label"><P2Icon name={row.icon} /> {row.number} · {row.title} · {row.frames.length} screens</div>
            <div className="poc-board">
              {row.frames.map(([id, label, mark]) => (
                <div key={id} className="poc-board-item p2-frame-pick" role="button" tabIndex={0} aria-label={label} onClick={() => go(id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') go(id); }}>
                  <P2Device stage={id} />
                  <span className="poc-frame-caption">{label}{mark && <> <P2Badge tone={mark === 'new' ? 'amber' : 'teal'}>{mark === 'new' ? 'New' : 'Changed'}</P2Badge></>}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className={`poc-live payments-live ${capture ? 'is-capture' : ''}`}>
        <div className="payments-demo-tabs" aria-label="Switch design flow">
          {[['masjid', 'Masjid', 'console'], ['admin', 'Paigham Admin', 'admin-home'], ['user', 'Follower', 'user-home']].map(([id, label, target]) => <button type="button" key={id} className={`btn sm ${role === id ? 'btn-filled' : 'btn-tonal'}`} onClick={() => go(target)}>{label}</button>)}
        </div>
        <P2Device stage={stage} go={go} give={give} live replacement={replacement} recentEnded={recentEnded} approved={approved} termsFrom={termsFrom} amount={amount} setAmount={setAmount} app={app} setApp={setApp} form={form} setForm={setForm} posted={posted} closed={closed} extended={extended} onClose={closeRequest} onExtend={extendRequest} paymentFrom={paymentFrom} chooseFrom={chooseFrom} giveTo={giveTo} />
        <button className="poc-play" type="button" onClick={restart}><P2Icon name="replay" /> Restart</button>
      </div>
    </div>
  );
}
Object.assign(window, { PaymentsV2Experience });

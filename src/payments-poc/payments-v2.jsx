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
};
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
  { id: 'iftar', masjid: 'bilal', title: 'Iftar for 200 musalleen', amount: 15000, icon: 'favorite', how: 'met', endedOn: '12 Sep', starts: 38 },
  { id: 'fans', masjid: 'bilal', title: 'Ceiling fans for the hall', amount: 6000, icon: 'volunteer_activism', how: 'ended', endedOn: '2 Sep', starts: 9 },
];
// Every request ends. Paigham cannot see money arrive, so a request can never close itself on
// its amount: the committee marks it met, or it ends on its date. 30 days unless they change it.
const P2_DURATIONS = [['7', '1 week'], ['14', '2 weeks'], ['30', '30 days'], ['60', '60 days'], ['90', '90 days']];
const P2_DEFAULT_DURATION = '30';
const P2_EXTEND_DAYS = 30;
const P2_REMIND_DAYS = 3;
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
const p2AllRequests = (form, posted, closed = [], extended = []) => p2Published(form, posted)
  .filter((request) => !closed.includes(request.id))
  .map((request) => extended.includes(request.id) ? { ...request, endsIn: request.endsIn + P2_EXTEND_DAYS } : request);
const p2EndedRequests = (form, posted, closed = []) => [
  ...p2Published(form, posted).filter((request) => closed.includes(request.id)).map((request) => ({ ...request, how: 'met', endedOn: 'Today' })),
  ...P2_ENDED,
];
const P2_ROWS = [
  { number: '01', title: 'Masjid · activate payments', icon: 'qr_code_scanner', frames: [['console', 'Console nudge'], ['scan', 'Scan existing QR'], ['review', 'Review payee'], ['pending', 'Awaiting review'], ['ready', 'Payments ready']] },
  { number: '02', title: 'Paigham Admin · human review', icon: 'shield', frames: [['admin-home', 'Admin Console'], ['admin-queue', 'Payment QR queue'], ['admin-review', 'Review match'], ['admin-approved', 'Approved'], ['admin-returned', 'Returned']] },
  { number: '03', title: 'Masjid · requests & activity', icon: 'campaign', frames: [['console-ready', 'Console · Payments entry'], ['masjid-details', 'Details · payment record'], ['masjid-payments', 'Payments hub + FAB'], ['request-amount', '1 · Amount needed'], ['request-details', '2 · Title (optional)'], ['request-review', '3 · Review'], ['request-ends', '3 · End date sheet'], ['published', 'Visible to followers'], ['close-confirm', 'Mark as met · confirm'], ['initiations', 'Initiations only']] },
  { number: '04', title: 'Follower · discover', icon: 'home', frames: [['user-home', 'Friday · primary masjid card'], ['user-home-weekday', 'Weekday · requests carousel'], ['user-home-empty', 'No requests · give to primary'], ['user-home-none', 'No requests · primary not on UPI'], ['user-home-committee', 'Committee · split FAB'], ['updates', 'All requests'], ['choose-masjid', 'Choose a masjid'], ['user-scan', 'Scan masjid QR']] },
  { number: '05', title: 'Follower · UPI handoff', icon: 'account_balance', frames: [['amount', 'Enter amount'], ['apps', 'Choose UPI app'], ['handoff', 'Open UPI app'], ['android-done', 'Android · reported paid'], ['android-failed', 'Android · not completed'], ['android-unknown', 'Android · no result'], ['ios-return', 'iOS · check UPI app']] },
];
const P2_NOOP = () => {};
const P2_UPI_APPS = ['Google Pay', 'PhonePe', 'BHIM'];
const P2_REQUEST_STEPS = 3;

// ── Kit wrappers ───────────────────────────────────────────────────────
// Thin JSX over kit classes, so each screen reads as the construction it uses.

function P2Icon({ name, className = '' }) { return <span className={`mi ${className}`} data-i={name} aria-hidden="true" />; }

function P2Button({ children, onClick = P2_NOOP, icon, kind = 'btn-filled', disabled = false }) {
  return <button type="button" className={`btn lg ${kind}`} onClick={onClick} disabled={disabled}>{icon && <P2Icon name={icon} />}{children}</button>;
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
function P2Scroll({ children, bar = true, step = false, nav = false, fab = false, onScroll }) {
  return <div className={`p2-scroll ${bar ? 'under-bar' : ''} ${step ? 'under-step' : ''} ${nav ? 'over-nav' : ''} ${fab ? 'under-fab' : ''}`} onScroll={onScroll}>{children}</div>;
}
function P2Docked({ children, note }) {
  return <div className="docked-action bordered">{note && <div className="docked-action-note">{note}</div>}{children}</div>;
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
function P2Section({ title, hint, action }) {
  return (
    <div className="p2-section-head">
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
function P2Group({ children, attention = false, label }) {
  return <>{label && <div className="eyebrow p2-group-label">{label}</div>}<div className={`list-group ${attention ? 'attention' : ''}`}>{children}</div></>;
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
function P2AmountField({ label, value, onChange, presets }) {
  return (
    <div className="field">
      <div className="flabel">{label}</div>
      <div className="input focused">
        <div className="inner">
          <span className="p2-rupee" aria-hidden="true">₹</span>
          <input className="val" aria-label={`${label} in rupees`} type="number" inputMode="numeric" min="1" placeholder="0" value={value} onChange={(event) => onChange(event.target.value)} />
        </div>
      </div>
      <div className="p2-chips">
        {presets.map((preset) => <button type="button" key={preset} className={`chip ${value === preset ? 'solid' : 'outline'}`} onClick={() => onChange(preset)}>{p2Rupees(preset)}</button>)}
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
function P2SnapshotCard({ eyebrow, title, copy, art, primary, secondary }) {
  return (
    <section className="p2-promo is-snapshot">
      <div className="p2-promo-copy">
        <span className="eyebrow accent">{eyebrow}</span>
        <strong>{title}</strong>
        <small>{copy}</small>
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
function P2PaymentsSnapshot({ go, requests }) {
  const own = requests.filter((request) => request.masjid === 'bilal');
  const soon = own.filter(p2EndingSoon).length;
  const latest = P2_STARTS[0];
  const copy = soon ? `${soon} ending in ${P2_REMIND_DAYS} days · 12 payment starts this month` : `12 payment starts this month · latest ${p2Rupees(latest.amount)} ${latest.when.toLowerCase()}`;
  return <P2SnapshotCard eyebrow="Payments · accepting UPI" title={`${own.length} live ${own.length === 1 ? 'request' : 'requests'}`} copy={copy} art="./assets/masjid-payment-setup.png" primary={{ text: 'New request', icon: 'add', onClick: () => go('request-amount') }} secondary={{ text: 'View payments', onClick: () => go('masjid-payments') }} />;
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
function P2Console({ go, ready = false, requests = P2_REQUESTS }) {
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
        {ready ? <P2PaymentsSnapshot go={go} requests={requests} /> : null}
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

function P2Review({ go }) {
  return (
    <P2Screen>
      <P2AppBar title="Check QR details" back={() => go('scan')} />
      <P2Scroll>
        <P2Heading eyebrow="Found on your QR" title="Is this your masjid’s payment QR?" />
        <P2Group>
          <P2Row title="Payee name" value={P2_MASJID.payee} />
          <P2Row title="UPI ID" value={P2_MASJID.vpa} />
        </P2Group>
        <P2Note>Paigham checks this UPI ID with the bank, then a Paigham admin reviews it before payments are enabled.</P2Note>
      </P2Scroll>
      <P2Docked>
        <P2Button onClick={() => go('pending')}>Submit for review</P2Button>
        <P2Button kind="btn-tonal" onClick={() => go('scan')}>Scan a different QR</P2Button>
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
        <P2PayeeGroup label="Submitted payee" />
      </P2Scroll>
      <P2Docked><P2Button kind="btn-tonal" onClick={() => go('console')}>Back to Console</P2Button></P2Docked>
    </P2Screen>
  );
}

function P2Ready({ go }) {
  return (
    <P2Screen>
      <P2AppBar title="Payment setup" back={() => go('console')} />
      <P2Scroll>
        <P2Outcome icon="verified" tone="success" title="Payments are on" description="Followers see your verified payee details before they open a UPI app." />
        <P2PayeeGroup />
      </P2Scroll>
      <P2Docked><P2Button onClick={() => go('masjid-payments')}>Open payments</P2Button></P2Docked>
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
function P2MasjidDetails({ go, ready = true, requests = P2_REQUESTS }) {
  const live = requests.filter((request) => request.masjid === 'bilal').length;
  return (
    <P2Screen>
      <P2AppBar title="Masjid details" subtitle={P2_MASJID.name} back={() => go(ready ? 'console-ready' : 'console')} />
      <P2Scroll>
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
            <P2Group label="Payments">
              <P2Row title="Status" trailing={<P2Badge tone="jade">Accepting</P2Badge>} />
              <P2Row title="Name at bank" value={P2_MASJID.bankName} />
              <P2Row title="UPI ID" value={P2_MASJID.vpa} />
              <P2Row title="Reviewed" value="20 Sep 2026" />
              <P2Row icon="volunteer_activism" title="Payment requests" subtitle={`${live} live · requests and activity`} onClick={() => go('masjid-payments')} />
            </P2Group>
            <P2Note icon="verified">Shown to followers before they open a UPI app. Replacing the payee needs a new QR review.</P2Note>
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
function P2MasjidPayments({ go, form, setForm, requests = P2_REQUESTS, ended = P2_ENDED, onClose = P2_NOOP, onExtend = P2_NOOP, confirmInitial = null }) {
  const { Dialog } = window;
  const own = requests.filter((request) => request.masjid === 'bilal');
  const soon = own.find(p2EndingSoon);
  const [confirmId, setConfirmId] = React.useState(confirmInitial);
  const confirming = own.find((request) => request.id === confirmId);
  return (
    <P2Screen>
      <P2AppBar title="Payments" subtitle={P2_MASJID.name} back={() => go('console-ready')} />
      <P2Scroll fab>
        <P2RequestComposer go={go} form={form} setForm={setForm} />
        {soon && (
          // The reminder the committee also gets as a notification: nothing ends without warning.
          <div className="list-group attention p2-reminder">
            <P2Row icon="schedule" title={`${p2RequestTitle(soon)} ends in ${soon.endsIn} days`} subtitle={`Ends ${p2EndDate(soon.endsIn)} · ${soon.starts} payment starts so far`} />
            <div className="p2-reminder-actions">
              <button type="button" className="btn btn-tonal sm" onClick={() => onExtend(soon.id)}>Extend {P2_EXTEND_DAYS} days</button>
              <button type="button" className="btn btn-filled sm" onClick={() => setConfirmId(soon.id)}>Mark as met</button>
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
        <P2Section title="Ended" hint="No longer shown to followers" />
        <P2Group>
          {ended.map((request) => <P2Row key={request.id} icon={request.icon} title={p2RequestTitle(request)} subtitle={`${p2Rupees(request.amount)} · ${request.starts} payment starts`} trailing={<P2Badge tone="muted">{request.how === 'met' ? 'Met' : 'Ended'} {request.endedOn}</P2Badge>} />)}
        </P2Group>
        <P2Group label="Payee">
          <P2Row icon="verified" title={P2_MASJID.payee} subtitle={P2_MASJID.vpa} onClick={() => go('masjid-details')} />
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
function P2RequestAmount({ go, form, setForm }) {
  const valid = Number(form.target) > 0;
  return (
    <P2Screen>
      <P2AppBar title="New request" back={() => go('masjid-payments')} step={1} />
      <P2Scroll step>
        <P2Heading eyebrow="Start with the need" title="How much is needed?" lead="Followers see this amount on the request card." />
        <P2AmountField label="Amount needed" value={form.target} onChange={(target) => setForm({ ...form, target })} presets={['1000', '5000', '10000', '25000']} />
        <P2Note>A requested amount, not a target Paigham can track. Followers do not see a progress bar or a collected total.</P2Note>
      </P2Scroll>
      <P2Docked note={valid ? null : 'Enter an amount greater than ₹0'}>
        <P2Button onClick={() => valid && go('request-details')} disabled={!valid}>Continue</P2Button>
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
        <P2Group label="Accepting UPI">
          {Object.values(P2_MASJIDS).map((masjid) => <P2Row key={masjid.key} lead={<P2MasjidMark masjid={masjid} size={40} />} title={masjid.name} subtitle={`${masjid.key === P2_MASJID.key ? 'Primary · ' : ''}Verified payee · ${masjid.place}`} onClick={() => give(masjid.key)} />)}
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

function P2Amount({ go, amount, setAmount, backTo = 'user-home', masjid = P2_MASJID, request = null }) {
  const valid = Number(amount) > 0;
  return (
    <P2Screen>
      <P2AppBar title="Give with UPI" back={() => go(backTo)} />
      <P2Scroll>
        <P2Group><P2Identity masjid={masjid} /></P2Group>
        <div className="summary-hero">
          <P2Tile icon={request ? request.icon : 'favorite'} accent />
          <div className="summary-hero-copy">
            <div className="eyebrow accent">{request ? 'Towards a request' : 'General giving'}</div>
            <div className="summary-hero-title">{request ? p2RequestTitle(request) : `Give to ${masjid.name}`}</div>
            {request && <div className="summary-hero-label">{p2Rupees(request.amount)} requested by the masjid</div>}
          </div>
        </div>
        <P2AmountField label="Your amount" value={amount} onChange={setAmount} presets={['100', '250', '500', '1000']} />
        <P2PayeeGroup masjid={masjid} />
        <P2Note>Money goes to this UPI payee, not Paigham. Check the name in your UPI app.</P2Note>
        <P2Note icon="shield">Paigham keeps a record that you started this payment: the amount, the app you chose and what the app reports back.</P2Note>
      </P2Scroll>
      <P2Docked note={valid ? null : 'Enter an amount greater than ₹0'}>
        <P2Button onClick={() => valid && go('apps')} disabled={!valid}>Choose a UPI app</P2Button>
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
      {OptionSheet && <OptionSheet isOpen title={`Pay ${p2Rupees(amount)} with`} value={app} options={P2_UPI_APPS.map((name) => ({ value: name, label: name }))} onPick={(name) => { picked.current = true; setApp(name); go('handoff'); }} onClose={() => { if (!picked.current) go('amount'); }} />}
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

function P2Stage({ stage, go = P2_NOOP, give = P2_NOOP, approved = false, termsFrom = 'android-done', amount = '250', setAmount = P2_NOOP, app = 'Google Pay', setApp = P2_NOOP, form = P2_SAMPLE_FORM, setForm = P2_NOOP, posted = false, closed = [], extended = [], onClose = P2_NOOP, onExtend = P2_NOOP, paymentFrom = 'user-home', chooseFrom = 'user-home-empty', giveTo = { masjid: 'bilal', request: null } }) {
  const requests = p2AllRequests(form, posted, closed, extended);
  const ended = p2EndedRequests(form, posted, closed);
  const hub = { go, form, setForm, requests, ended, onClose, onExtend };
  const masjid = P2_MASJIDS[giveTo.masjid];
  const request = giveTo.request;
  switch (stage) {
    case 'console': return <P2Console go={go} ready={approved} />;
    case 'scan': return <P2Scan title="Scan masjid QR" hint="The payment QR already at your masjid" action="Simulate QR scan" onBack={() => go('console')} onScan={() => go('review')} />;
    case 'review': return <P2Review go={go} />;
    case 'pending': return <P2Pending go={go} />;
    case 'ready': return <P2Ready go={go} />;
    case 'admin-home': return <P2AdminHome go={go} />;
    case 'admin-queue': return <P2AdminQueue go={go} />;
    case 'admin-review': return <P2AdminReview go={go} />;
    case 'admin-approved': return <P2AdminDecision go={go} approved />;
    case 'admin-returned': return <P2AdminDecision go={go} />;
    case 'console-ready': return <P2Console go={go} ready requests={requests} />;
    case 'masjid-details': return <P2MasjidDetails go={go} requests={requests} />;
    case 'masjid-details-basic': return <P2MasjidDetails go={go} ready={false} />;
    case 'masjid-payments': return <P2MasjidPayments {...hub} />;
    case 'close-confirm': return <P2MasjidPayments {...hub} confirmInitial="untitled" />;
    case 'request-amount': return <P2RequestAmount go={go} form={form} setForm={setForm} />;
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
    case 'amount': return <P2Amount go={go} amount={amount} setAmount={setAmount} backTo={paymentFrom} masjid={masjid} request={request} />;
    case 'apps': return <P2Apps go={go} amount={amount} app={app} setApp={setApp} backTo={paymentFrom} masjid={masjid} request={request} />;
    case 'handoff': return <P2Handoff go={go} amount={amount} app={app} masjid={masjid} request={request} />;
    case 'terms': return <P2Terms go={go} returnStage={termsFrom} />;
    default: return <P2Return go={go} kind={stage} app={app} masjid={masjid} />;
  }
}

function P2Device({ stage, live, ...props }) {
  return <div className="noor-frame" style={{ '--s': live ? '0.82' : '0.46' }}><div className="noor-frame-inner"><div className="noor-screen"><div className="noor-island" /><P2Stage stage={stage} {...props} /><div className="noor-home" /></div></div></div>;
}

const P2_MASJID_STAGES = ['console', 'console-ready', 'scan', 'review', 'pending', 'ready', 'masjid-details', 'masjid-details-basic', 'masjid-payments', 'request-amount', 'request-details', 'request-review', 'request-ends', 'published', 'close-confirm', 'initiations'];
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
  const closeRequest = (id) => setClosed((ids) => ids.includes(id) ? ids : [...ids, id]);
  const extendRequest = (id) => setExtended((ids) => ids.includes(id) ? ids : [...ids, id]);
  const go = (target) => {
    if (target === 'terms') setTermsFrom(stage);
    if (target === 'choose-masjid' && stage !== 'amount') setChooseFrom(stage);
    if (target === 'admin-approved') setApproved(true);
    if (target === 'admin-returned') setApproved(false);
    // The amount is the only required field; a request without a title still publishes.
    if (target === 'published' && Number(form.target) > 0) setPosted(true);
    if (target === 'amount' && !['apps', 'handoff'].includes(stage)) setPaymentFrom(stage);
    if (target === 'masjid-details' && !approved && stage === 'console') target = 'masjid-details-basic';
    setStage(target);
  };
  const give = (masjid, request = null) => { setGiveTo({ masjid, request }); setAmount('250'); go('amount'); };
  const capture = params.get('capture') === '1';
  const role = stage.startsWith('admin') ? 'admin' : P2_MASJID_STAGES.includes(stage) ? 'masjid' : 'user';
  const restart = () => { setStage('console'); setApproved(false); setPosted(false); setPaymentFrom('user-home'); setAmount('250'); setForm(P2_EMPTY_FORM); setGiveTo({ masjid: 'bilal', request: null }); setClosed([]); setExtended([]); };
  return (
    <div className="poc-stage">
      <div className="poc-frames p2-board">
        <div className="p2-board-intro">
          <span className="eyebrow accent">Paigham · Payments / Design POC 03</span>
          <h1>Direct giving, without a payment claim</h1>
          <p>Five journeys on one board. A payment request has one type: the amount comes first and the title is optional. News without an ask stays a Paigham. The follower Friday card appears only on Fridays, for a primary masjid that accepts payments.</p>
          <div>{['Existing masjid UPI QR', 'Admin-reviewed payee', 'Amount first · title optional', 'No bank status'].map((tag) => <P2Badge key={tag}>{tag}</P2Badge>)}</div>
        </div>
        {P2_ROWS.map((row) => (
          <section key={row.number} className="p2-board-row">
            <div className="poc-row-label"><P2Icon name={row.icon} /> {row.number} · {row.title} · {row.frames.length} screens</div>
            <div className="poc-board">
              {row.frames.map(([id, label]) => (
                <div key={id} className="poc-board-item p2-frame-pick" role="button" tabIndex={0} aria-label={label} onClick={() => go(id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') go(id); }}>
                  <P2Device stage={id} />
                  <span className="poc-frame-caption">{label}</span>
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
        <P2Device stage={stage} go={go} give={give} live approved={approved} termsFrom={termsFrom} amount={amount} setAmount={setAmount} app={app} setApp={setApp} form={form} setForm={setForm} posted={posted} closed={closed} extended={extended} onClose={closeRequest} onExtend={extendRequest} paymentFrom={paymentFrom} chooseFrom={chooseFrom} giveTo={giveTo} />
        <button className="poc-play" type="button" onClick={restart}><P2Icon name="replay" /> Restart</button>
      </div>
    </div>
  );
}
Object.assign(window, { PaymentsV2Experience });

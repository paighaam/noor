// Shared screen components for the Masjid Console section board — the masjid
// console plus the journeys that hang off it.
//
// Used by BOTH the static storyboards (./broadcast-studio-board.jsx) and the live device
// (../Masjid Console.dc.html). Every screen takes ONE `data` object so the dc x-import
// binds a single value, and every handler is optional (the static frames pass none).
//
// Source of truth for behaviour is the Compose implementation:
//   modules/masjid/admin/MasjidAdminScreen.kt         → ConsoleScreen (Overview tab + tab shell)
//   modules/masjid/post/MasjidPostsAdminScreen.kt     → ConsoleScreen (Posts tab)
//   modules/masjid/members/MasjidMembersScreen.kt     → ConsoleScreen (Members tab)
//   modules/masjid/post/CreatePostScreen.kt           → ComposePostScreen (./broadcast-studio-compose.jsx)
//   modules/masjid/post/PostVerificationPendingScreen → PostSentScreen
//   modules/masjid/invitations/InvitationsScreen.kt   → InvitationsScreen
// Role gating mirrors models/OrganisationMember.kt (MasjidPermissions) — UI gating only;
// the server stays authoritative.
//
// SalaahConfigScreen.kt is NOT here. Timings are their own section board
// (../Salaah Timing Rules.dc.html): the day, each prayer's rule, the board scan, publishing and
// the change record all live there, and this console keeps only the hub tile that opens it.

const FONT_B = 'var(--font-body)';
const FONT_T = 'var(--font-title)';

// ══════════════════════════════════════════════════════════════════════
// Domain reference data (mirrors app/paigham/models)
// ══════════════════════════════════════════════════════════════════════

// PAIGHAM_ADMIN is internal-only and rejected server-side, so it is never assignable.
const OPS_ROLES = [
  'CHAIRMAN', 'ASSISTANT_CHAIRMAN', 'SECRETARY', 'ASSISTANT_SECRETARY',
  'TREASURER', 'ASSISTANT_TREASURER', 'MEMBER', 'IMAM', 'MUEZZIN',
];

const isRepeatableCommitteeRole = (role) => role === 'MEMBER' || role === 'MUEZZIN';

const availableCommitteeRoles = (members, editingMemberId) => {
  const currentRole = (members || []).find((member) => member.id === editingMemberId)?.role;
  const occupied = (members || [])
    .filter((member) => member.id !== editingMemberId && member.status !== 'IN_ACTIVE')
    .map((member) => member.role)
    .filter((role) => !isRepeatableCommitteeRole(role));
  return OPS_ROLES.filter((role) => (
    role === currentRole || isRepeatableCommitteeRole(role) || occupied.indexOf(role) === -1
  ));
};

const canonicalCommitteePhone = (phone) => (phone || '').replace(/\D/g, '').slice(-10);

const isCommitteePhoneTaken = (members, phone) => {
  const canonical = canonicalCommitteePhone(phone);
  return canonical.length === 10 && (members || []).some((member) => (
    member.status !== 'IN_ACTIVE' && canonicalCommitteePhone(member.phone) === canonical
  ));
};

// Title Case reads better than the raw enum on a dense console screen.
const roleLabel = (role) => (role || '')
  .toLowerCase()
  .split('_')
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

// ── Capabilities ──────────────────────────────────────────────────────
// A committee member's ROLE is a title; what they may DO is a set of capabilities granted
// per member. The registry is the extension point: new capabilities (azaan, live bayan,
// payments) appear here with `available: false` and the whole UI — hub rows, permission
// screen, invite screen — picks them up without new layout.
//
// Salaah timings are deliberately NOT a capability. Any signed-in Paigham user can update
// any masjid's timings; the safeguard is attribution and the change record, not a grant. Do not
// reintroduce a 'timings' capability without changing that decision. The editor itself lives on
// the Salaah Timing Rules board — the hub's Salaah tile opens it.
const OPS_CAPABILITIES = [
  {
    id: 'post', icon: 'campaign', label: 'Send paighams', short: 'Paighams', available: true,
    copy: 'Write, record and send updates to everyone following this masjid',
  },
  {
    id: 'committee', icon: 'groups', label: 'Manage the committee', short: 'Full admin', available: true,
    copy: 'Invite members, change roles and set what each member can do',
  },
  {
    id: 'azaan', icon: 'volume_up', label: 'Give the azaan', short: 'Azaan', available: false,
    copy: 'Call the azaan from the app so musalleen hear it live',
  },
  {
    id: 'live', icon: 'sensors', label: 'Go live with a bayan', short: 'Live bayan', available: false,
    copy: 'Stream a bayan or a programme to musalleen',
  },
  {
    id: 'payments', icon: 'money_bag', label: 'Manage payments', short: 'Payments', available: false,
    copy: 'Masjid QR, donations and the transaction record',
  },
];

const OPS_CAPS = {
  available: () => OPS_CAPABILITIES.filter((c) => c.available),
  planned: () => OPS_CAPABILITIES.filter((c) => !c.available),
  find: (id) => OPS_CAPABILITIES.find((c) => c.id === id),
  // Everything the console gates on. `caps` is the caller's granted set.
  can: (caps, id) => (caps || []).indexOf(id) !== -1,
  // A member holding `committee` is a full admin: they grant and revoke for everyone.
  isAdmin: (caps) => (caps || []).indexOf('committee') !== -1,
  // "Full admin" says everything, so it stands alone; otherwise list the short labels.
  summary: (caps) => {
    if (OPS_CAPS.isAdmin(caps)) return 'Full admin';
    const labels = (caps || []).map((id) => OPS_CAPS.find(id)).filter(Boolean).map((c) => c.short);
    return labels.length ? `Can: ${labels.join(', ')}` : 'View only';
  },
};

// Every masjid this member manages. The switcher only appears when there is more than one.
const OPS_MANAGED = [
  {
    id: 'bilal', name: 'Masjid E Bilal', code: 'PGM-BLR-1042', role: 'CHAIRMAN',
    city: 'Yelahanka New Town · 560064', followers: 1284,
    address: '12, 5th Cross, Yelahanka New Town, Bengaluru, Karnataka 560064',
    photo: '../../images/masjid-camera-preview.png',
  },
  {
    id: 'noor', name: 'Masjid-e-Noor', code: 'PGM-BLR-2251', role: 'SECRETARY',
    city: 'Vidyaranyapura · 560097', followers: 412, photo: null,
    address: '4th Main, Vidyaranyapura, Bengaluru, Karnataka 560097',
  },
];

const OPS_MASJID = {
  name: 'Masjid E Bilal',
  code: 'PGM-BLR-1042',
  maslak: 'Ahle Sunnat Wal Jamaat (Deoband)',
  contactName: 'Salim Shaikh',
  phone: '+91 98450 12345',
  address: '12, 5th Cross, Yelahanka New Town, Bengaluru, Karnataka 560064',
  stats: { followers: 1284, posts: 96, reactions: 3120 },
};

// Every committee member sees everything; `caps` decides what they can DO. A member with no
// capabilities still reads the console and can still update timings — that is open to
// everyone — they simply cannot send paighams or change the committee.
const OPS_MEMBERS = [
  { id: 'm1', name: 'Salim Shaikh', phone: '+91 98450 12345', role: 'CHAIRMAN', status: 'ACTIVE', you: true, caps: ['post', 'committee'] },
  { id: 'm2', name: 'Ayaan Khan', phone: '+91 98861 40219', role: 'SECRETARY', status: 'ACTIVE', caps: ['post', 'committee'] },
  { id: 'm3', name: 'Hafiz Bilal Ahmed', phone: '+91 90084 77120', role: 'IMAM', status: 'ACTIVE', caps: ['post'] },
  { id: 'm4', name: 'Yusuf Ali', phone: '+91 99001 23845', role: 'MUEZZIN', status: 'ACTIVE', caps: [] },
  { id: 'm5', name: 'Imran Sait', phone: '+91 80881 55403', role: 'TREASURER', status: 'INVITED', caps: [] },
];

const OPS_FOLLOWERS = [
  { id: 'f1', name: 'Abdul Rahman', phone: '+91 90362 11784', city: 'Yelahanka New Town', since: 'Mar 2026' },
  { id: 'f2', name: 'Imtiyaz Pasha', phone: '+91 73493 60012', city: 'Vidyaranyapura', since: 'Feb 2026' },
  { id: 'f3', name: '', phone: '+91 90080 44127', city: 'Yelahanka', since: 'Jan 2026' },
  { id: 'f4', name: 'Mohammed Rafi', phone: '+91 99862 30014', city: 'Attur Layout', since: 'Dec 2025' },
  { id: 'f5', name: 'Sameer Ahmed', phone: '+91 88842 51190', city: 'Yelahanka New Town', since: 'Dec 2025' },
  { id: 'f6', name: 'Nadeem Sharief', phone: '+91 97417 22608', city: 'Chikkabettahalli', since: 'Nov 2025' },
];

// Paighams go live immediately — there is no review state.
const OPS_POSTS = [
  {
    id: 'p1', kind: 'message', target: 'MASJID', author: 'Ayaan Khan', authorId: 'm2',
    when: 'Today · 9:12 AM', reactions: 42, images: 1,
    message: 'Jumah bayan begins at 1:00 PM this week. Please be seated by 12:45 PM, in shaa Allah.',
  },
  {
    id: 'p2', kind: 'audio', target: 'MASJID_MASLAK', author: 'Hafiz Bilal Ahmed', authorId: 'm3',
    when: 'Today · 7:40 AM', reactions: 16, duration: '1:24',
  },
  {
    id: 'p3', kind: 'message', target: 'MASJID', author: 'Salim Shaikh', authorId: 'm1',
    when: 'Yesterday · 6:05 PM', reactions: 118, images: 0,
    message: 'Ramadhan taraweeh programme and the sehri timetable for the whole month are now available at the masjid office and on the notice board. Hafiz Bilal Ahmed leads from the 1st, and guests are requested to arrive by 8:30 PM so the rows can be settled before takbeer.',
  },
  {
    id: 'p4', kind: 'image', target: 'MASJID_PINCODE', author: 'Yusuf Ali', authorId: 'm4',
    when: '2 days ago', reactions: 24, images: 3,
  },
];

// An invitation has to answer three questions before someone accepts: which masjid, what
// will I be able to do, and who asked me. It lives for 7 days.
const OPS_INVITATIONS = [
  {
    id: 'i1', name: 'Masjid E Bilal', city: 'Yelahanka New Town · 560064',
    photo: '../../images/masjid-camera-preview.png',
    role: 'SECRETARY', caps: ['post', 'committee'],
    invitedBy: 'Salim Shaikh', invitedByRole: 'CHAIRMAN', sent: '2 days ago', daysLeft: 5,
  },
  {
    id: 'i2', name: 'Masjid-e-Noor', city: 'Vidyaranyapura · 560097', photo: null,
    role: 'MUEZZIN', caps: [],
    invitedBy: 'Ayaan Khan', invitedByRole: 'SECRETARY', sent: '5 days ago', daysLeft: 1,
  },
  {
    id: 'i3', name: 'Jamia Masjid Shivajinagar', city: 'Shivajinagar · 560001', photo: null,
    role: 'MEMBER', caps: [], invitedBy: 'Imran Sait', invitedByRole: 'TREASURER',
    sent: '9 days ago', daysLeft: 0, expired: true,
  },
];

// SalaahConfigViewModel.kt variants. The console no longer edits a config — these exist so the
// hub's Salaah tile can read the published sample and say what is next.
const VARIANT_FIXED = 'FIXED';
const VARIANT_ON_TIME = 'ON_TIME';
const VARIANT_VARIES = 'VARIES_WITH_ON_TIME';

const SALAAH_ORDER = [
  { key: 'fajr', label: 'Fajr' },
  { key: 'zohar', label: 'Zohar' },
  { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha', label: 'Isha' },
  { key: 'jumah', label: 'Jumah' },
];

const OPS_SALAAH_CONFIG = {
  // The recommended first-publish template mirrors the pattern committees already use: the three
  // seasonal prayers follow the calculated day, Zohar and Jumah hold a clock time, and Maghrib is
  // called at sunset. These wire variants never appear in the interface; the rule receipt below
  // explains them in the language a committee uses.
  fajr: { variant: VARIANT_VARIES, neverBefore: '00:00', salaahTimeVariation: 'VARIES_EVERY_15_MINS', iqamaDelay: 20 },
  zohar: { variant: VARIANT_FIXED, salaahTime: '13:30', iqamaDelay: 15 },
  asr: { variant: VARIANT_VARIES, neverBefore: '00:00', salaahTimeVariation: 'VARIES_EVERY_15_MINS', iqamaDelay: 15 },
  maghrib: { variant: VARIANT_ON_TIME, iqamaDelay: 5 },
  isha: { variant: VARIANT_VARIES, neverBefore: '00:00', salaahTimeVariation: 'VARIES_EVERY_15_MINS', iqamaDelay: 15 },
  jumah: { variant: VARIANT_FIXED, salaahTime: '13:20', iqamaDelay: 0 },
};

// ══════════════════════════════════════════════════════════════════════
// Formatting helpers
// ══════════════════════════════════════════════════════════════════════

// "HH:mm" (wire format) → "h:mm AM/PM" (TimeSelectField renders 12h in the app too).
const fmt12 = (time) => {
  if (!time) return '--:--';
  const [h, m] = time.split(':').map((n) => parseInt(n, 10));
  const pm = h >= 12;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${pm ? 'PM' : 'AM'}`;
};

// The device frame's clock is a fixed 9:41 AM, so the console derives "next" from the same
// constant. Every storyboard frame has to render identically on every load; real time would
// make the board non-deterministic.
const FRAME_NOW_MINUTES = 9 * 60 + 41;

const salaahToMinutes = (hhmm) => {
  const parts = String(hhmm || '00:00').split(':').map((n) => parseInt(n, 10));
  return (parts[0] * 60) + (parts[1] || 0);
};

const prayerMinutes = (config = {}, key) => {
  const starts = { fajr: 292, zohar: 748, asr: 972, maghrib: 1128, isha: 1206 };
  if (config.variant === VARIANT_ON_TIME) return starts[key] == null ? null : starts[key];
  if (config.variant === VARIANT_VARIES) {
    const start = starts[key];
    const step = parseInt(String(config.salaahTimeVariation || '').replace(/\D/g, ''), 10);
    if (start == null || !step) return null;
    const floor = config.neverBefore ? salaahToMinutes(config.neverBefore) : 0;
    return Math.max((Math.floor(start / step) * step) + step, floor);
  }
  if (!config.salaahTime) return null;
  const [h, m] = config.salaahTime.split(':').map((n) => parseInt(n, 10));
  return (h * 60) + m;
};

// Jumah is weekly, so it never answers "what is next today", and Maghrib follows sunset with
// no configured time — both appear in the strip, neither is a "next" candidate. Past Isha the
// answer rolls to tomorrow's Fajr rather than going blank.
const nextPrayer = (config = {}) => {
  const day = SALAAH_ORDER.filter(({ key }) => key !== 'jumah');
  const upcoming = day.find(({ key }) => {
    const mins = prayerMinutes(config[key], key);
    return mins !== null && mins > FRAME_NOW_MINUTES;
  });
  if (upcoming) return { ...upcoming, tomorrow: false };
  const first = day.find(({ key }) => prayerMinutes(config[key], key) !== null);
  return first ? { ...first, tomorrow: true } : null;
};

const POST_TARGET_LABEL = { MASJID: 'My Masjid', MASJID_MASLAK: 'My Maslak', MASJID_PINCODE: 'My Pincode Area' };

const postPreview = (post) => {
  if (post.message) return post.message;
  if (post.kind === 'audio') return 'Audio paigham';
  return 'Image paigham';
};

const countLabel = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

// Feed grouping: an admin scans by day, so the feed carries Today / Yesterday / Earlier.
const postDay = (post) => {
  const when = post.when || '';
  if (when.startsWith('Today')) return 'Today';
  if (when.startsWith('Yesterday')) return 'Yesterday';
  return 'Earlier';
};

// Long bodies truncate with the same inline "Show more" the Qaum feed uses.
const POST_CLAMP = 150;
const postBody = (message) => {
  const text = message || '';
  if (text.length <= POST_CLAMP) return { text, clamped: false };
  return { text: `${text.slice(0, POST_CLAMP).replace(/\s+\S*$/, '')}… `, clamped: true };
};

// ══════════════════════════════════════════════════════════════════════
// Screen primitives (Components layer only — no raw primitives, no literal hex)
// ══════════════════════════════════════════════════════════════════════

function Screen({ children }) {
  return (
    <div className="bcs-shell" style={{
      width: '100%', height: '100%', boxSizing: 'border-box', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      background: 'var(--color-surface-primary)', fontFamily: FONT_B, color: 'var(--color-info-primary)',
    }}>
      {children}
    </div>
  );
}

// Top app bar — the DS `.app-bar` every other section uses: transparent, floating over the
// body, with the progressive-blur haze that fades out toward its bottom edge. Bodies below
// pass `BCS_APPBAR_H` as their top inset so content scrolls UNDER the bar rather than
// starting after it — the fade only reads when there is something behind it to blur.
// `transitionName` carries the console's shared-element title (masjid name) from Profile.
const BCS_APPBAR_H = 114; // 54px status inset + 48px control row + 12px bottom
function OpsAppBar({ title, subtitle, onBack, trailing, transitionName, backHref = './Masjid Console.dc.html#admin' }) {
  return (
    <div className="app-bar" style={{
      alignItems: 'center', gap: 12, height: BCS_APPBAR_H,
      padding: '54px 16px 12px', boxSizing: 'border-box',
    }}>
      <a
        className="ib ib-tonal"
        href={backHref}
        aria-label="Back"
      >
        <span className="mi" data-i="arrow_back"></span>
      </a>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ab-title" style={{
          fontSize: 22, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          viewTransitionName: transitionName || 'none',
        }}>{title}</div>
        {subtitle ? (
          <div style={{ fontSize: 12, marginTop: 3, color: 'var(--color-info-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div>
        ) : null}
      </div>
      {trailing || <div style={{ width: 48, flexShrink: 0 }} />}
    </div>
  );
}

// Scrollable screen body. `bottomInset` keeps content clear of the home indicator
// (and of a docked footer action when one is present).
function Body({ children, bottomInset = 44, gutter = 16, style = {}, scrollRef, onScroll, className = '' }) {
  return (
    <div className={`bcs-body ${className}`} ref={scrollRef} onScroll={onScroll} style={{
      flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain',
      padding: `14px ${gutter}px ${bottomInset}px`, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 12, ...style,
    }}>
      {children}
    </div>
  );
}

// The three state views come from the components layer (_theme/components.jsx) so every
// board shares one construction; these wrappers only supply this section's copy defaults.
function Loading({ label }) {
  const { Loader } = window;
  return Loader ? <Loader label={label} /> : null;
}

function ErrorState({ title, copy, actionText = 'Try again', onRetry }) {
  const { EmptyState } = window;
  if (!EmptyState) return null;
  return (
    <EmptyState
      tone="error"
      icon="error"
      title={title}
      description={copy}
      action={onRetry ? { text: actionText, onClick: onRetry } : undefined}
    />
  );
}

function Empty({ icon, title, copy, actionText, actionIcon, onAction }) {
  const { EmptyState } = window;
  if (!EmptyState) return null;
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={copy}
      action={actionText ? { text: actionText, icon: actionIcon, onClick: onAction } : undefined}
    />
  );
}

function Card({ children, style = {}, onClick, ariaLabel }) {
  const Root = onClick ? 'button' : 'div';
  return (
    <Root
      className="surf"
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        borderRadius: 18, padding: 14, width: '100%', textAlign: 'left', flexShrink: 0,
        border: '1px solid var(--color-neutral-border)', background: 'var(--color-surface-card)',
        cursor: onClick ? 'pointer' : 'default', font: 'inherit', color: 'inherit', ...style,
      }}
    >
      {children}
    </Root>
  );
}

function Avatar({ text, size = 40, tone = 'tonal' }) {
  return (
    <span className={`avatar ${tone === 'accent' ? 'accent' : ''}`} style={{ '--tile': `${size}px` }} aria-hidden="true">
      {(text || '?').charAt(0).toUpperCase()}
    </span>
  );
}

function MasjidMark({ masjid = {}, size = 48 }) {
  if (masjid.photo) {
    return (
      <span className="masjid-mark" style={{ '--tile': `${size}px` }}>
        <img src={masjid.photo} alt="" />
      </span>
    );
  }
  return (
    <span className="icon-tile accent" style={{ '--tile': `${size}px` }} aria-hidden="true">
      <span className="mi" data-i="mosque"></span>
    </span>
  );
}

function IconTile({ icon, size = 40, tone = 'tonal' }) {
  return (
    <span className={`icon-tile ${tone === 'accent' ? 'accent' : ''}`} style={{ '--tile': `${size}px` }} aria-hidden="true">
      <span className="mi" data-i={icon}></span>
    </span>
  );
}

function SectionLabel({ children, hint }) {
  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{ fontFamily: FONT_T, fontSize: 18, letterSpacing: '-0.2px' }}>{children}</div>
      {hint ? <div style={{ fontSize: 12, lineHeight: 1.45, marginTop: 4, color: 'var(--color-info-secondary)' }}>{hint}</div> : null}
    </div>
  );
}

function KeyValue({ label, value }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 12, color: 'var(--color-info-secondary)' }}>{label}</div>
      <div style={{ fontSize: 14, marginTop: 2, lineHeight: 1.45 }}>{value}</div>
    </div>
  );
}

// Docked primary action. Progress is rendered above the bar and OUTSIDE it (`.docked-status`),
// never inside the bar and never inside the button: the bar's hairline, its height and its label
// all stay put while the request is in flight, so the reader can still see what they committed to.
// `busyLabel` names the STEP when the submit is a sequence of requests — see `.docked-status`.
function FooterAction({ label, onClick, disabled, busy, busyLabel, secondary, helper }) {
  return (
    <div className="docked-host">
      {busy ? (
        <div className="docked-status status-capsule" role="status" aria-live="polite">
          <span className="status-capsule-ring" aria-hidden="true"></span>
          <b>{busyLabel || 'Saving…'}</b>
        </div>
      ) : null}
      <div className="docked-action bordered">
        {!busy && helper ? <div className="docked-action-note">{helper}</div> : null}
        <button className="btn btn-filled lg" disabled={disabled || busy} onClick={onClick}>{label}</button>
        {secondary ? (
          <button className="btn btn-tonal lg" onClick={secondary.onClick}>{secondary.text}</button>
        ) : null}
      </div>
    </div>
  );
}

function Snack({ snack, onClose }) {
  if (!snack) return null;
  return (
    <div className="snack docked" role="status">
      <span className={`mi snack-icon ${snack.tone === 'error' ? 'error' : ''}`} data-i={snack.tone === 'error' ? 'error' : 'check_circle'}></span>
      <span className="snack-copy">{snack.message}</span>
      <button className="snack-close" onClick={onClose} aria-label="Dismiss"><span className="mi" data-i="close"></span></button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 1 · Console — Overview tab
// ══════════════════════════════════════════════════════════════════════

// A screen's one persistent action. Extended so it names itself on arrival, compact once the
// reader scrolls — `compact` is passed in rather than measured here, so a static storyboard
// frame can demonstrate the collapsed state without a scroll event.
function Fab({ icon, label, compact, onClick, bottom }) {
  return (
    <button
      className={`fab ${compact ? 'compact' : ''}`}
      onClick={onClick}
      aria-label={label}
      style={bottom ? { bottom } : undefined}
    >
      <span className="mi" data-i={icon} aria-hidden="true"></span>
      <span className="fab-label">{label}</span>
    </button>
  );
}

// How far the reader has to move before the label gets out of the way. Small, but past the
// couple of pixels a rubber-band overscroll produces — otherwise the label flickers at rest.
const FAB_COLLAPSE_AT = 24;

function AttentionRow({ icon, title, copy, count, onClick }) {
  return (
    <button className="list-item actionable" onClick={onClick} type="button" style={{ padding: '12px 4px' }}>
      <span className="mi list-item-leading" style={{ color: 'var(--color-action-primary)' }} data-i={icon} aria-hidden="true"></span>
      <span className="list-item-copy">
        <span className="list-item-title">{title}</span>
        <span className="list-item-subtitle">{copy}</span>
      </span>
      <span className="badge sm amber" style={{ flexShrink: 0 }}>{count}</span>
      <span className="mi list-item-chevron" data-i="chevron_right" aria-hidden="true"></span>
    </button>
  );
}

function LockedConsole() {
  // The usual cause of no console access: the caller is not an ACTIVE committee member yet
  // (registration still in review, or an invitation not accepted).
  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '28px 24px 40px', gap: 12 }}>
        <div className="empty-state-icon" aria-hidden="true"><span className="mi" data-i="security"></span></div>
        <div style={{ fontFamily: FONT_T, fontSize: 22, marginTop: 6 }}>This console is committee-only</div>
        <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--color-info-secondary)' }}>
          Only verified committee members of this masjid can manage it. If you just registered or
          claimed this masjid, your verification is still in review — the console opens automatically
          the moment it is approved. If someone else manages this masjid, ask them to send you a
          committee invitation from their committee list.
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-info-tertiary)' }}>Committee membership not found for this account.</div>
      </div>
    </div>
  );
}

// A row on the console: leading icon, title, subtitle, trailing value, chevron.
function ConsoleRow({ icon, title, copy, value, onClick }) {
  return (
    <button className="list-item actionable" onClick={onClick} style={{ padding: '13px 4px', minHeight: 62 }}>
      <span className="mi list-item-leading" style={{ color: 'var(--color-action-primary)' }} data-i={icon} aria-hidden="true"></span>
      <span className="list-item-copy">
        <span className="list-item-title">{title}</span>
        {copy ? <span className="list-item-subtitle">{copy}</span> : null}
      </span>
      {value ? <span className="list-item-value">{value}</span> : null}
      <span className="mi list-item-chevron" data-i="chevron_right" aria-hidden="true"></span>
    </button>
  );
}

// ── The paigham feed — the Qaum post construction, plus the controls an admin needs ──
function ConsolePost({ post, masjid, canManage, menuOpen, deleting, onToggleMenu, onDelete }) {
  const audio = post.kind === 'audio';
  return (
    <article className="feed-post">
      <div className="feed-post-head">
        {masjid.photo
          ? <span className="masjid-mark round" style={{ '--tile': '44px' }} aria-hidden="true"><img src={masjid.photo} alt="" /></span>
          : <span className="avatar accent" style={{ '--tile': '44px' }} aria-hidden="true">{masjid.name.charAt(0)}</span>}
        <span className="feed-post-id">
          <span className="feed-post-name">{masjid.name}</span>
          <span className="feed-post-sub">Sent by {post.author}</span>
        </span>
        {canManage ? (
          <span style={{ position: 'relative', flexShrink: 0 }}>
            {deleting ? (
              <span className="btn-spinner" style={{ margin: 12, color: 'var(--color-info-secondary)' }} role="status" aria-label="Deleting"></span>
            ) : (
              <button
                className="ib ib-tonal md"
                aria-haspopup="menu"
                aria-expanded={!!menuOpen}
                aria-label={`Options for the paigham sent by ${post.author}`}
                onClick={onToggleMenu}
              >
                <span className="mi" data-i="more_vert"></span>
              </button>
            )}
            {menuOpen ? (
              <div className="dd-menu" role="menu" style={{ left: 'auto', right: 0, width: 176 }}>
                <div className="dd-item" role="menuitem" onClick={onDelete} style={{ color: 'var(--color-status-error)' }}>
                  <span className="mi" style={{ color: 'var(--color-status-error)' }} data-i="delete"></span>Delete paigham
                </div>
              </div>
            ) : null}
          </span>
        ) : null}
      </div>

      {audio ? (
        <div className="aplayer" style={{ marginBottom: 10 }}>
          <button className="ap-toggle" aria-label="Play recording">
            <span className="mi fill" data-i="play_arrow"></span>
          </button>
          <span className="ap-time">{post.duration}</span>
          <div className="ap-wave" aria-hidden="true">
            {[38, 62, 44, 78, 96, 70, 52, 84, 66, 40, 58, 88, 72, 46, 62, 34, 54, 76].map((h, i) => (
              <i key={i} className={i < 4 ? 'on' : ''} style={{ '--h': `${h}%` }}></i>
            ))}
          </div>
        </div>
      ) : (
        <div className="feed-post-body">
          {postBody(post.message || 'Photo notice').text}
          {postBody(post.message || 'Photo notice').clamped ? <span className="feed-post-more">Show more</span> : null}
        </div>
      )}

      {post.images ? (
        <div className="post-preview-photos count-1" style={{ marginBottom: 10, borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <img src="../../images/masjid-camera-preview.png" alt="" />
        </div>
      ) : null}

      <div className="feed-post-actions">
        <span className="feed-post-react"><span className="mi" data-i="favorite" aria-hidden="true"></span></span>
        <span className="feed-post-count">{post.reactions}</span>
        <span className="feed-post-time">{(post.when || '').split(' · ').pop()}</span>
      </div>
      <div className="feed-post-admin">
        <span className="mi" data-i="groups" aria-hidden="true"></span>
        {POST_TARGET_LABEL[post.target] || 'My Masjid'} · seen by {(masjid.stats.followers || 0).toLocaleString('en-IN')} musalleen
      </div>
    </article>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Masjid Console — approved production direction
// ══════════════════════════════════════════════════════════════════════

function BroadcastStudioHeader({ masjid, role, caps, managed, onBack, onOpenSwitcher, transitionEnabled }) {
  const isAdmin = OPS_CAPS.isAdmin(caps);
  const access = isAdmin
    ? 'Full admin'
    : OPS_CAPS.can(caps, 'post')
      ? 'Can send paighams'
      : 'View only';
  return (
    <header className="bcs-header">
      <a className="ib ib-tonal" aria-label="Back" href="../home/Home Broadcast Studio.dc.html#home-managed">
        <span className="mi" data-i="arrow_back"></span>
      </a>
      <MasjidMark masjid={masjid} size={46} />
      <button
        className="bcs-identity"
        onClick={managed.length > 1 ? onOpenSwitcher : undefined}
        aria-haspopup={managed.length > 1 ? 'dialog' : undefined}
        aria-label={managed.length > 1 ? `${masjid.name} — switch masjid` : undefined}
      >
        <span className="bcs-name-line">
          <strong style={{ viewTransitionName: transitionEnabled ? CONSOLE_TITLE_TRANSITION : 'none' }}>{masjid.name}</strong>
          <span className="mi bcs-verified" data-i="verified"></span>
          {managed.length > 1 ? <span className="mi bcs-swap" data-i="unfold_more"></span> : null}
        </span>
        <small>{roleLabel(role)} · {access}</small>
      </button>
    </header>
  );
}

function BroadcastComposer({ followerCount, masjidName, onCreatePost }) {
  return (
    <section className="bcs-composer">
      <span className="bcs-kicker inverse">NEW PAIGHAM</span>
      <h1>What should musalleen know?</h1>
      {/* "Message all 0 musalleen" is a discouraging first line on a masjid that opened the
          console today, and it is not what the author needs to hear. Name the gap instead. */}
      <p>{followerCount
        ? `Message all ${countLabel(followerCount)} musalleen of ${masjidName}.`
        : `No musalleen yet — share the masjid QR and your paighams reach them from the next one.`}</p>
      {/* This is the first surface of the real message field, not a third action competing
          with Record and Photos. Focusing it opens Step 1 and hands focus to the full field. */}
      <textarea
        className="bcs-inline-message"
        rows={3}
        readOnly
        aria-label="Start a paigham"
        placeholder="Jumah bayan begins at 1:00 PM this week…"
        onFocus={() => onCreatePost()}
      />
      {/* The two existing intent shortcuts stay exactly that: recorder or photo picker.
          Neither skips step 1, because the paigham still needs text or a recording. */}
      <div className="bcs-tools">
        <button className="btn btn-tonal sm" onClick={() => onCreatePost('audio')}>
          <span className="mi" data-i="mic"></span>Record audio
        </button>
        <button className="btn btn-tonal sm" onClick={() => onCreatePost('photos')}>
          <span className="mi" data-i="photo_camera"></span>Add photos
        </button>
      </div>
    </section>
  );
}

function BroadcastReadOnlyStrip() {
  return (
    <section className="bcs-readonly">
      <span className="bcs-icon-orb"><span className="mi" data-i="visibility"></span></span>
      <span><strong>Published paighams</strong><small>You can view what the committee has sent.</small></span>
    </section>
  );
}

// The recent-paigham feed owns its own loading, error and empty states. They used to live
// in a latest-paigham summary card above the deck; with that card gone the feed is the only
// place the console talks about paighams, so it has to answer for all three.
function BroadcastFeedState({ status, hasItems, canPost, followerCount, onCreate, onRetry }) {
  if (status === 'loading') {
    return (
      <div className="bcs-feed-state loading">
        <span className="skeleton"></span><span className="skeleton"></span><span className="skeleton short"></span>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="bcs-feed-state error">
        <span className="bcs-icon-orb"><span className="mi" data-i="cloud_off"></span></span>
        <span><strong>Couldn’t load paighams</strong><small>Your console data is safe.</small></span>
        <button className="btn btn-tonal sm" onClick={onRetry}>Try again</button>
      </div>
    );
  }
  if (!hasItems) {
    return (
      <div className="bcs-feed-state empty">
        <span className="bcs-kicker">NO PAIGHAMS YET</span>
        <strong>{(() => {
          if (!canPost) return 'Paighams sent by the committee will appear here.';
          // Same reason as the composer: on a new masjid the count is zero, and "send the
          // first update to 0 musalleen" reads as pointless rather than encouraging.
          return followerCount
            ? `Send the first update to ${countLabel(followerCount)} musalleen.`
            : 'Send your first paigham — everyone who follows the masjid from now on will see it.';
        })()}</strong>
        {canPost ? (
          <button className="btn btn-tonal" onClick={onCreate}>
            <span className="mi" data-i="campaign"></span>Create first paigham
          </button>
        ) : null}
      </div>
    );
  }
  return null;
}

// Operations deck — the Bold board's "Bento Blocks" direction: every destination is a solid
// slab of its own colour and leads with its own state (the next jamaat clock, the committee
// size, the musalleen count) instead of four identical grey cards behind four small icons.
// Each tone is a semantic token paired with its on-colour partner; no literal hex.
//
// A tile leads with a number ONLY when there is a number worth leading with. On a masjid
// that opened its console this morning every count is zero, and a 29px "0" filling a gold
// slab is both the loudest thing on the screen and the most discouraging — so at zero the
// tile falls back to its icon and the caption becomes the thing to go and do.
function BroadcastOperationTile({ tone, value, icon, title, caption, badge, onClick, transitionName }) {
  return (
    <button className={`bcs-operation ${tone}`} onClick={onClick}>
      {badge ? <span className="bcs-operation-badge">{badge}</span> : null}
      {value
        ? <span className="bcs-operation-value">{value}</span>
        : <span className="mi bcs-operation-glyph" data-i={icon}></span>}
      <strong style={{ viewTransitionName: transitionName || 'none' }}>{title}</strong>
      {caption ? <small>{caption}</small> : null}
    </button>
  );
}

// The Salaah slab shouts the clock value; the caption names the prayer it belongs to and,
// for a varies-with-on-time prayer, that the value is the earliest jamaat rather than a
// fixed one. `nextPrayer` only ever returns a prayer that has a time, so there is always a
// value to show unless no prayer is configured at all.
const salaahTile = (config, next) => {
  if (!next) return { value: null, caption: 'Publish your timings' };
  const cfg = config[next.key] || {};
  const varies = cfg.variant === VARIANT_VARIES;
  return {
    value: fmt12(varies ? cfg.neverBefore : cfg.salaahTime),
    caption: `${next.tomorrow ? 'Tomorrow' : 'Next'} ${next.label}${varies ? ' · earliest' : ''} · iqama +${cfg.iqamaDelay}m`,
  };
};

function ConsoleHome({ data, transitionEnabled }) {
  const {
    masjid = OPS_MASJID, role, caps = [], status, counts = {}, managed = [], me,
    attention = [], posts = {}, salaahPublished = true, onRetry, onCreatePost, onOpenDest,
    onOpenSwitcher, onTogglePostMenu, onDeletePost,
  } = data;

  if (status === 'loading') return <Loading label="Loading broadcast studio…" />;
  if (status === 'locked') return <LockedConsole />;
  if (status === 'error') {
    return <ErrorState title="Couldn’t load this masjid" copy="Your console data is safe. Check your connection and try again." onRetry={onRetry} />;
  }

  const items = posts.items || [];
  const canPost = OPS_CAPS.can(caps, 'post');
  const isAdmin = OPS_CAPS.isAdmin(caps);
  const canManagePost = (post) => isAdmin || (canPost && me && post.authorId === me.id);
  const salaah = salaahTile(OPS_SALAAH_CONFIG, salaahPublished ? nextPrayer(OPS_SALAAH_CONFIG) : null);
  const inviteCount = attention.reduce((sum, item) => sum + (item.count || 0), 0);
  const feedLoaded = posts.status === 'loaded' && items.length > 0;
  const memberCount = counts.members || 0;
  const musalleenCount = masjid.stats.followers || 0;

  return (
    <Body className="bcs-studio-body" bottomInset={36} style={{ gap: 0, padding: '54px 16px 36px' }}>
      <BroadcastStudioHeader
        masjid={masjid}
        role={role}
        caps={caps}
        managed={managed}
        onBack={data.onBack}
        onOpenSwitcher={onOpenSwitcher}
        transitionEnabled={transitionEnabled}
      />

      {canPost
        ? <BroadcastComposer followerCount={masjid.stats.followers} masjidName={masjid.name} onCreatePost={onCreatePost} />
        : <BroadcastReadOnlyStrip />}

      <section className="bcs-section">
        <div className="bcs-section-head"><strong>Operations</strong><small>Run the masjid</small></div>
        <div className="bcs-operations">
          <BroadcastOperationTile
            tone="jade"
            value={salaah.value}
            icon="schedule"
            title="Salaah"
            caption={salaah.caption}
            onClick={() => onOpenDest && onOpenDest('salaah')}
            transitionName={transitionEnabled ? destTransitionName('salaah') : undefined}
          />
          <BroadcastOperationTile
            tone="teal"
            value={memberCount ? String(memberCount) : null}
            icon="groups"
            title="Committee"
            caption={(() => {
              if (isAdmin && inviteCount) return `${inviteCount} waiting to accept`;
              if (!memberCount) return 'Invite your imam and secretary';
              if (memberCount === 1) return 'Just you — invite the rest';
              return 'Roles and permissions';
            })()}
            badge={isAdmin ? inviteCount : 0}
            onClick={() => onOpenDest && onOpenDest('members')}
            transitionName={transitionEnabled ? destTransitionName('members') : undefined}
          />
          <BroadcastOperationTile
            tone="gold"
            value={musalleenCount ? countLabel(musalleenCount) : null}
            icon="favorite"
            title="Musalleen"
            caption={musalleenCount ? 'Receiving every paigham' : 'Share the masjid QR so they can follow'}
            onClick={() => onOpenDest && onOpenDest('followers')}
            transitionName={transitionEnabled ? destTransitionName('followers') : undefined}
          />
          <BroadcastOperationTile
            tone="plain"
            icon="mosque"
            title="Masjid details"
            caption={masjid.code}
            onClick={() => onOpenDest && onOpenDest('details')}
            transitionName={transitionEnabled ? destTransitionName('details') : undefined}
          />
        </div>
      </section>

      <section className="bcs-section">
        <div className="bcs-section-head">
          <strong>Recent paighams</strong>
          {feedLoaded ? <small>{items.length} sent · {countLabel(masjid.stats.reactions)} reactions</small> : null}
        </div>
        <BroadcastFeedState
          status={posts.status}
          hasItems={items.length > 0}
          canPost={canPost}
          followerCount={masjid.stats.followers}
          onCreate={onCreatePost}
          onRetry={onRetry}
        />
        {feedLoaded ? (
          <div className="bcs-feed-list">
            {items.map((post) => (
              <ConsolePost
                key={post.id}
                post={post}
                masjid={masjid}
                canManage={canManagePost(post)}
                menuOpen={posts.menuFor === post.id}
                deleting={posts.deleting === post.id}
                onToggleMenu={() => onTogglePostMenu && onTogglePostMenu(posts.menuFor === post.id ? null : post.id)}
                onDelete={() => onDeletePost && onDeletePost(post)}
              />
            ))}
          </div>
        ) : null}
      </section>

      {/* No floating `New paigham` action (removed 2026-08-10). The composer IS the top of this
          screen and the hub is short enough to return to; a second permanent send action restated
          the screen's own purpose over the feed it was covering. */}
    </Body>
  );
}

// ── Masjid switcher ──────────────────────────────────────────────────
function MasjidSwitcherSheet({ open, managed = [], currentId, onPick, onClose }) {
  const { Dialog } = window;
  if (!open || !Dialog) return null;
  return (
    <Dialog
      mode="sheet"
      isOpen
      onClose={onClose}
      title="Switch masjid"
      description="You manage more than one. Everything on the console follows the masjid you pick."
      primary={null}
      secondary={null}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }} role="radiogroup" aria-label="Masjids you manage">
        {managed.map((m) => {
          const current = m.id === currentId;
          return (
            <button
              key={m.id}
              role="radio"
              aria-checked={current}
              className={`list-item ${current ? '' : 'actionable'}`}
              onClick={current ? undefined : () => onPick && onPick(m.id)}
              style={{ minHeight: 68, borderRadius: 'var(--radius-2xl)', background: current ? 'var(--color-action-background)' : 'transparent' }}
            >
              <IconTile icon="mosque" size={40} tone={current ? 'accent' : 'tonal'} />
              <span className="list-item-copy" style={{ gap: 2 }}>
                <span className="list-item-title">{m.name}</span>
                <span className="list-item-subtitle" style={{ WebkitLineClamp: 1 }}>
                  {roleLabel(m.role)} · {m.city} · {countLabel(m.followers)} musalleen
                </span>
              </span>
              {current
                ? <span className="badge sm teal" style={{ flexShrink: 0 }}>Current</span>
                : <span className="mi list-item-chevron" data-i="chevron_right"></span>}
            </button>
          );
        })}
      </div>
    </Dialog>
  );
}

// ── Masjid details — the verified record, read-only by design ─────────
// These fields were checked when the masjid was verified, so nothing here is editable in
// the app. A full admin can ask Paigham to correct something; everyone else can only read.
function DetailField({ label, value, mono }) {
  return (
    <div className="detail-field">
      <span className="detail-label">{label}</span>
      <span className={`detail-value${mono ? ' mono' : ''}`}>{value}</span>
    </div>
  );
}

function DetailsBody({ data }) {
  const { masjid = OPS_MASJID, caps = [], onRequestCorrection } = data;
  const isAdmin = OPS_CAPS.isAdmin(caps);
  const pincode = (masjid.address.match(/\d{6}/) || [''])[0];

  return (
    <Body bottomInset={40} style={{ gap: 0, padding: `${BCS_APPBAR_H}px 0 40px` }}>
      {/* the masjid as it was verified: its photo, name and code. The hero starts BELOW the
          app bar rather than under it: the bar's title is unscrimmed, and a committee photo
          cannot be art-directed, so a dark upload would swallow it. */}
      <div className="media-identity-hero">
        {masjid.photo ? <img src={masjid.photo} alt={`${masjid.name} entrance`} /> : null}
        <div className="media-identity-hero-copy">
          <div className="screen-title on-media">{masjid.name}</div>
          <div className="media-identity-hero-caption">
            <span className="badge sm gold"><span className="mi" data-i="verified"></span>Verified</span>
            <span className="detail-hero-code">{masjid.code}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <div className="eyebrow detail-group-label">Identity</div>
        <div className="list-group detail-group">
          <DetailField label="Masjid name" value={masjid.name} />
          <DetailField label="Masjid code" value={masjid.code} mono />
          <DetailField label="Maslak" value={masjid.maslak} />
        </div>

        <div className="eyebrow detail-group-label">Contact</div>
        <div className="list-group detail-group">
          <DetailField label="Contact person" value={masjid.contactName} />
          <DetailField label="Phone" value={masjid.phone} mono />
        </div>

        <div className="eyebrow detail-group-label">Location</div>
        <div className="list-group detail-group">
          <DetailField label="Address" value={masjid.address} />
          {pincode ? <DetailField label="Pincode" value={pincode} mono /> : null}
        </div>

        {isAdmin ? (
          <button className="list-item actionable detail-correction" onClick={onRequestCorrection}>
            <span className="mi list-item-leading" style={{ color: 'var(--color-action-primary)' }} data-i="mail" aria-hidden="true"></span>
            <span className="list-item-copy">
              <span className="list-item-title">Request a correction</span>
              <span className="list-item-subtitle">Ask Paigham to fix a detail. The masjid code never changes.</span>
            </span>
            <span className="mi list-item-chevron" data-i="chevron_right" aria-hidden="true"></span>
          </button>
        ) : (
          <div className="detail-note">
            These details were checked when this masjid was verified. Only a full admin can
            request a correction.
          </div>
        )}
      </div>
    </Body>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 2 · Console — Posts tab
// ══════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════
// 3 · Console — Members tab (Committee + Musalleen)
// ══════════════════════════════════════════════════════════════════════

// A committee row: who they are, the title they hold, and — at a glance — what they may do.
// An INVITED row has no member screen behind it — nothing to open, no permissions to edit — so
// for a full admin it carries its one action inline: a small tonal destructive `close` that
// withdraws the invitation (after confirmation). A chevron leading nowhere would promise more.
function MemberRow({ member, manageable, onOpen, onWithdraw, withdrawing }) {
  const invited = member.status === 'INVITED';
  const opens = manageable && !invited;
  const Root = opens ? 'button' : 'div';
  return (
    <Root
      className={`list-item${opens ? ' actionable' : ''}`}
      onClick={opens ? onOpen : undefined}
      type={opens ? 'button' : undefined}
      style={{ padding: '12px 4px', minHeight: 68 }}
    >
      <span style={{ flexShrink: 0 }}><Avatar text={member.name} size={42} /></span>
      <span className="list-item-copy" style={{ gap: 3 }}>
        <span className="list-item-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {member.name}
          {member.you ? <span className="badge sm teal">You</span> : null}
          {member.isOwner ? <span className="badge sm">Owner</span> : null}
        </span>
        <span className="member-caps">
          <span className="member-role">{roleLabel(member.role)}</span>
          {OPS_CAPS.available().map((capability) => {
            const on = OPS_CAPS.can(member.caps, capability.id);
            return (
              <span
                key={capability.id}
                className={`mi member-cap ${on ? 'on' : ''}`}
                data-i={capability.icon}
                title={`${capability.label}${on ? '' : ' — not granted'}`}
                aria-label={`${capability.label}${on ? '' : ' not granted'}`}
              ></span>
            );
          })}
        </span>
      </span>
      {invited ? <span className="badge sm amber" style={{ flexShrink: 0 }}>Invited</span> : null}
      {invited && manageable ? (
        <button
          className="btn btn-tonal destructive sm"
          type="button"
          aria-label="Withdraw invitation"
          disabled={withdrawing}
          onClick={onWithdraw}
          style={{ flexShrink: 0, padding: 0, width: 32, minHeight: 32, borderRadius: 999 }}
        >
          {withdrawing
            ? <span className="status-capsule-ring" aria-hidden="true"></span>
            : <span className="mi" data-i="close" style={{ fontSize: 18 }}></span>}
        </button>
      ) : null}
      {opens ? <span className="mi list-item-chevron" data-i="chevron_right" aria-hidden="true"></span> : null}
    </Root>
  );
}

// Committee: everyone in the committee can SEE it; only a full admin can open a member to
// change their role, their permissions, or remove them. Active members and members who have
// not accepted yet are separate groups, because they need different attention.
function CommitteeBody({ data }) {
  const {
    caps = [], masjid = OPS_MASJID, members = {},
    onRetry, onOpenInvite, onOpenMember, onWithdrawInvitation,
  } = data;
  const { status = 'loaded', items = [], withdrawingId = null } = members;
  const isAdmin = OPS_CAPS.isAdmin(caps);
  const active = items.filter((m) => m.status !== 'INVITED');
  const invited = items.filter((m) => m.status === 'INVITED');

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {status === 'loading' ? <Loading label="Loading committee…" /> : null}
      {status === 'error' ? (
        <ErrorState title="Couldn't load the committee" copy="Check your connection and try again." onRetry={onRetry} />
      ) : null}
      {status === 'loaded' && !items.length ? (
        <Empty
          icon="groups"
          title="Your committee starts here"
          copy={isAdmin
            ? 'Invite your imam, secretary, muezzin and other members by phone number, then choose what each of them can do. They get the invitation inside Paigham and can accept within 7 days.'
            : 'Committee members appear here once they accept their invitations. A full admin sends the invitations.'}
          actionText={isAdmin ? 'Invite the first member' : undefined}
          actionIcon={isAdmin ? 'add' : undefined}
          onAction={onOpenInvite}
        />
      ) : null}

      {status === 'loaded' && items.length ? (
        <Body bottomInset={isAdmin ? 8 : 40} style={{ gap: 0, paddingTop: BCS_APPBAR_H + 14 }}>
          <div className="summary-hero">
            <span className="icon-tile" style={{ '--tile': '38px' }}><span className="mi" data-i="groups"></span></span>
            <div className="summary-hero-copy">
              <div className="summary-hero-title">
                {active.length} {active.length === 1 ? 'member' : 'members'} running {masjid.name}
              </div>
              <div className="summary-hero-label">
                {isAdmin
                  ? 'View members and manage their access.'
                  : 'The icons show what each member is allowed to do.'}
              </div>
            </div>
          </div>

          <div className="list-group" style={{ marginTop: 14 }}>
            {active.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                manageable={isAdmin && (member.status !== 'INVITED' || !OPS_CAPS.isAdmin(member.caps) || !!(data.me && data.me.isOwner))}
                onOpen={() => onOpenMember && onOpenMember(member)}
              />
            ))}
          </div>

          {invited.length ? (
            <>
              <div className="eyebrow committee-label">
                Waiting to accept
                <span>{invited.length}</span>
              </div>
              <div className="list-group">
                {invited.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    manageable={isAdmin && (member.status !== 'INVITED' || !OPS_CAPS.isAdmin(member.caps) || !!(data.me && data.me.isOwner))}
                    withdrawing={withdrawingId === member.id}
                    onWithdraw={() => onWithdrawInvitation && onWithdrawInvitation(member)}
                  />
                ))}
              </div>
              <div className="committee-note">
                An invitation is valid for 7 days. Until it is accepted the member has no access.
              </div>
            </>
          ) : null}

          <div className="committee-legend">
            {OPS_CAPS.available().map((capability) => (
              <span key={capability.id}>
                <span className="mi" data-i={capability.icon}></span>
                {capability.short}
              </span>
            ))}
          </div>
        </Body>
      ) : null}

      {isAdmin && status === 'loaded' && items.length ? (
        <div className="docked-action bordered">
          <button className="btn btn-filled lg" onClick={onOpenInvite}>
            <span className="mi" style={{ fontSize: 20 }} data-i="add"></span>Invite a member
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ── Member permissions destination ───────────────────────────────────
// The extension point for the whole permission model: available capabilities are switch
// rows, planned ones are listed as Coming soon so the committee can see what is arriving.
function CapabilityRow({ capability, on, disabled, onToggle }) {
  return (
    <div className="toggle-row" aria-disabled={capability.available ? undefined : 'true'}>
      <span className="toggle-row-icon"><span className="mi" data-i={capability.icon}></span></span>
      <span className="toggle-row-copy">
        <strong>{capability.label}</strong>
        <small>{capability.copy}</small>
      </span>
      {capability.available ? (
        <button
          className={`sw ${on ? 'on' : ''}`}
          role="switch"
          aria-checked={!!on}
          aria-label={capability.label}
          disabled={disabled}
          onClick={disabled ? undefined : onToggle}
          style={disabled ? { opacity: 'var(--opacity-strong)', cursor: 'not-allowed' } : undefined}
        ></button>
      ) : (
        <span className="badge sm gold" style={{ flexShrink: 0 }}>Soon</span>
      )}
    </div>
  );
}

// One full screen for both scenarios: inviting someone new and viewing/editing an existing
// member. The role picker, the permission switches and the Coming-soon list are identical in
// both — only the header (a name vs. a phone field) and the committed action differ. Keeping
// them in one component is the point: the set of permissions you grant at invite time and the
// set you edit later cannot drift apart.
function MemberBody({ data }) {
  const {
    caps = [], members = {}, openMenu, onBack, onOpenMenu, onPickRole, onToggleCapability, onOpenRemove, onOpenTransfer,
    onInvitePhone, onInviteRole, onInviteCapability, onSendInvite,
  } = data;
  const inviting = data.dest === 'invite';
  const invite = members.invite || {};
  const member = inviting ? null : members.editing;
  const [plannedOpen, setPlannedOpen] = React.useState(false);
  if (!inviting && !member) return <Loading label="Loading member…" />;

  const isAdmin = OPS_CAPS.isAdmin(caps);
  const grantedCaps = inviting ? (invite.caps || []) : member.caps;
  const memberIsAdmin = OPS_CAPS.isAdmin(grantedCaps);
  // The masjid must keep one full admin, so the last one cannot revoke their own grant.

  // Inviting is itself a full-admin action, so the switches are live; editing someone else
  // requires the grant.
  const amOwner = !!(data.me && data.me.isOwner);
  const canEdit = isAdmin && (inviting || amOwner || (!member.isOwner && !memberIsAdmin));
  const transferring = !!members.transferringId;
  const phone = invite.phone || '';
  const inviteValid = phone.replace(/\D/g, '').length >= 10 && !!invite.role;
  const availableRoles = availableCommitteeRoles(members.items, member && member.id);

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* the person IS the header — identity once, not twice */}
      <div className="console-head">
        <a className="ib ib-tonal" aria-label="Back" href="./Masjid Console.dc.html#members">
          <span className="mi" data-i="arrow_back"></span>
        </a>
        {inviting
          ? <IconTile icon="person" size={48} tone="accent" />
          : <Avatar text={member.name} size={48} tone="accent" />}
        <div className="console-head-copy">
          <div className="screen-title">{inviting ? 'Invite a member' : `${member.name}${member.you ? ' (you)' : ''}`}</div>
          <div className="member-head-meta">
            <span>{inviting ? 'They accept inside Paigham within 7 days' : member.phone}</span>
            {!inviting && member.isOwner ? <span className="badge sm">Owner</span> : null}
            {!inviting && member.status === 'INVITED' ? <span className="badge sm amber">Invitation pending</span> : null}
          </div>
        </div>
      </div>

      <Body bottomInset={inviting ? 16 : 40} style={{ gap: 14, paddingTop: 4 }}>
        {/* the only field the invite scenario adds: who is being invited */}
        {inviting ? (
          <div className="field" style={{ marginBottom: 0 }}>
            <div className="flabel">Phone number</div>
            <div className={`input ${invite.error ? 'error' : ''}`}>
              <div className="inner">
                <span className="mi" style={{ fontSize: 18, color: 'var(--color-info-secondary)' }} data-i="call"></span>
                <input
                  className="val"
                  value={phone}
                  inputMode="tel"
                  maxLength={14}
                  placeholder="Enter member's phone number"
                  aria-label="Member phone number"
                  onInput={(e) => onInvitePhone && onInvitePhone(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: FONT_B }}
                />
              </div>
            </div>
            {invite.error
              ? <div className="helper err" role="alert">{invite.error}</div>
              : <div className="helper">The number they use for Paigham.</div>}
          </div>
        ) : null}

        {/* One picker, one presentation. This was an anchored `.dd-menu` hung off the field; it is
            the kit's OptionSheet now, so choosing a committee role reads exactly like choosing a
            maslak or a state during registration. The anchored menu is kept only where the value
            has to stay attached to the card it sits in — the Zakaat karat, a prayer's rule fields. */}
        <div className="field" style={{ marginBottom: 0 }}>
          <div className="flabel">Role in the committee</div>
          <PickerField
            value={(() => {
              const current = inviting ? invite.role : member.role;
              return current ? roleLabel(current) : '';
            })()}
            placeholder="Select a role"
            disabled={!canEdit || transferring}
            ariaLabel="Role in the committee"
            onOpen={() => onOpenMenu && onOpenMenu('member-role')}
          />
          <div className="helper">The role is a title. What they can do is set below.</div>
        </div>
        <OptionSheet
          isOpen={openMenu === 'member-role'}
          onClose={() => onOpenMenu && onOpenMenu(null)}
          title="Select a role"
          options={availableRoles.map((r) => ({ value: r, label: roleLabel(r) }))}
          value={inviting ? invite.role : member.role}
          onPick={(value) => (inviting ? onInviteRole && onInviteRole(value) : onPickRole && onPickRole(value))}
        />

        <div>
          <SectionLabel hint={(() => {
            if (inviting) return 'They get these the moment they accept. Changeable any time afterwards.';
            return canEdit ? 'Changes apply immediately.' : memberIsAdmin ? 'Only the owner can change this manager’s permissions.' : 'A committee manager can change these permissions.';
          })()}>
            Permissions
          </SectionLabel>
          <Card style={{ padding: '4px 12px', marginTop: 8 }}>
            {OPS_CAPS.available().map((capability) => {
              const on = OPS_CAPS.can(grantedCaps, capability.id);
              return (
                <CapabilityRow
                  key={capability.id}
                  capability={capability}
                  on={on}
                  disabled={!canEdit || transferring || (capability.id === 'committee' && (!amOwner || (!inviting && member.isOwner)))}
                  onToggle={() => (inviting
                    ? onInviteCapability && onInviteCapability(capability.id)
                    : onToggleCapability && onToggleCapability(member.id, capability.id))}
                />
              );
            })}
          </Card>
          {!inviting && member.isOwner ? <div className="helper">{member.you
            ? 'You are the owner. Transfer ownership to another active member before leaving or giving up management access.'
            : 'The owner manages committee access. Their membership is protected until they transfer ownership.'}</div> : null}
          {!amOwner ? <div className="helper">Only the owner can appoint or remove managers.</div> : null}
          {/* Says out loud what is no longer a permission, so its absence reads as a decision. */}
          <div style={{ fontSize: 11, lineHeight: 1.5, padding: '8px 4px 0', color: 'var(--color-info-tertiary)' }}>
            Salaah timings are not listed here — anyone using Paigham can update them, and every
            change is recorded with the name of the person who made it.
          </div>
        </div>

        <Card style={{ padding: 0, overflow: 'hidden', opacity: 'var(--opacity-emphasis)' }}>
          <button
            type="button"
            aria-expanded={plannedOpen}
            onClick={() => setPlannedOpen(!plannedOpen)}
            style={{
              width: '100%', minHeight: 56, display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', border: 0, background: 'transparent', color: 'inherit',
              font: 'inherit', textAlign: 'left', cursor: 'pointer',
            }}
          >
            <span className="mi" style={{ fontSize: 20, color: 'var(--color-info-secondary)' }} data-i="schedule"></span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ display: 'block', fontSize: 13.5 }}>Coming later</strong>
              <small style={{ display: 'block', marginTop: 2, fontSize: 11.5, color: 'var(--color-info-secondary)' }}>
                Azaan, live bayan and payments
              </small>
            </span>
            <span className={`mi chev ${plannedOpen ? 'open' : ''}`} style={{ fontSize: 22, color: 'var(--color-info-faint)' }} data-i="keyboard_arrow_down"></span>
          </button>
          {plannedOpen ? (
            <div style={{ padding: '0 12px 4px', borderTop: '1px solid var(--color-neutral-border)' }}>
              {OPS_CAPS.planned().map((capability) => (
                <CapabilityRow key={capability.id} capability={capability} on={false} disabled />
              ))}
            </div>
          ) : null}
        </Card>

        {!inviting && isAdmin && amOwner && !member.you && !member.isOwner && member.status === 'ACTIVE' ? (
          <button className="btn lg btn-tonal" type="button" disabled={transferring} onClick={() => onOpenTransfer && onOpenTransfer(member)}>
            Transfer ownership to this member
          </button>
        ) : null}
        {transferring ? <div className="status-capsule" role="status">Transferring ownership…</div> : null}
        {members.transferError ? <div className="helper err" role="alert">Ownership was not transferred. Review the member and try again.</div> : null}
        {!inviting && !member.isOwner && (canEdit || member.you) && !transferring ? (
          // Tonal, not filled. This screen exists to grant and revoke permissions, so the
          // toggles must stay the visual centre of gravity; a solid red bar outranks them and
          // makes the rarest action the loudest. The confirmation dialog carries the weight.
          <button className="btn lg btn-tonal destructive" style={{ width: '100%' }} onClick={() => onOpenRemove && onOpenRemove(member)}>
            <span className="mi" style={{ fontSize: 20 }} data-i="delete"></span>{member.you ? 'Leave committee' : 'Remove from committee'}
          </button>
        ) : null}
      </Body>

      {/* Invite is the one scenario with a committed action; editing saves as you toggle. */}
      {inviting ? (
        <FooterAction
          label="Send invitation"
          busy={invite.sending}
          busyLabel="Sending invitation…"
          disabled={!inviteValid}
          onClick={onSendInvite}
        />
      ) : null}
    </div>
  );
}

// ── Musalleen — a read-only record of who receives this masjid's updates ──
// Nobody approves a follow, so this screen exists to answer "who are they?" and nothing
// else. The committee sees contact details, which is exactly why the screen says so.
function FollowerRow({ follower }) {
  return (
    <div className="list-item" style={{ padding: '12px 4px', minHeight: 64 }}>
      <span style={{ flexShrink: 0 }}>
        {follower.name ? <Avatar text={follower.name} size={42} /> : <IconTile icon="person" size={42} />}
      </span>
      <span className="list-item-copy" style={{ gap: 2 }}>
        <span className="list-item-title">{follower.name || follower.phone}</span>
        <span className="list-item-subtitle" style={{ WebkitLineClamp: 1 }}>
          {[follower.name ? follower.phone : 'Name not set yet', follower.city].filter(Boolean).join(' · ')}
        </span>
      </span>
      <span className="list-item-value" style={{ fontSize: 11 }}>{follower.since}</span>
    </div>
  );
}

function FollowersBody({ data }) {
  const { masjid = OPS_MASJID, members = {}, onLoadFollowers, onRetry } = data;
  const { followers = [], followersStatus = 'loaded', followersLoadingMore } = members;

  const total = masjid.stats.followers || followers.length;

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {followersStatus === 'loading' ? <Loading label="Loading musalleen…" /> : null}
      {followersStatus === 'error' ? (
        <ErrorState title="Couldn't load musalleen" copy="Check your connection and try again." onRetry={onRetry} />
      ) : null}
      {followersStatus === 'loaded' && !followers.length ? (
        <Empty
          icon="person"
          title="No musalleen yet"
          copy="Musalleen who follow this masjid receive its salaah timings and every paigham you send. Share the masjid QR or ask the jamaat to search for it in Paigham."
        />
      ) : null}

      {followersStatus === 'loaded' && followers.length ? (
        <>
          <div style={{ flexShrink: 0, padding: `${BCS_APPBAR_H + 14}px 16px 0` }}>
            <div className="summary-hero">
              <span className="icon-tile accent" style={{ '--tile': '44px' }}><span className="mi" data-i="groups"></span></span>
              <div className="summary-hero-copy">
                <div className="summary-hero-value">{total.toLocaleString('en-IN')}</div>
                <div className="summary-hero-label">receiving timings and paighams</div>
              </div>
            </div>
          </div>

          <Body bottomInset={40} style={{ gap: 0, paddingTop: 12 }}>
            <div className="list-group">
              {followers.map((follower) => <FollowerRow key={follower.id} follower={follower} />)}
            </div>

            <div className="followers-more">
              <span>Showing {followers.length} of {total.toLocaleString('en-IN')}</span>
              {followersLoadingMore ? (
                <span className="inline-loading-status"><span className="btn-spinner" aria-hidden="true"></span>Loading…</span>
              ) : (
                <button className="btn btn-tonal" onClick={onLoadFollowers}>Load more</button>
              )}
            </div>

            <div className="followers-note">
              <span className="mi" data-i="security" aria-hidden="true"></span>
              <span>
                Names and numbers here are visible to the committee only. Musalleen never appear
                publicly, and Paigham never shares them.
              </span>
            </div>
          </Body>
        </>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 5 · Overlays — confirmations
// ══════════════════════════════════════════════════════════════════════


function ConfirmDialog({ confirm, onCancel }) {
  const { Dialog } = window;
  if (!confirm || !Dialog) return null;
  return (
    <Dialog
      mode="alert"
      isOpen
      onClose={onCancel}
      title={confirm.title}
      description={confirm.description}
      destructive={!!confirm.destructive}
      primary={{ text: confirm.confirmText, onClick: confirm.onConfirm }}
      secondary={{ text: 'Cancel', onClick: onCancel }}
    />
  );
}

// ══════════════════════════════════════════════════════════════════════
// 6 · ConsoleScreen — command deck: hub + one full screen per destination
// ══════════════════════════════════════════════════════════════════════

const CONSOLE_TITLE_TRANSITION = 'masjid-admin-masjid-e-bilal-title';

// Each destination's title is a shared element: the row label on the hub morphs into the
// destination's app-bar title. Only the live device sets the names (duplicates across the
// storyboard frames would invalidate the transition).
const destTransitionName = (dest) => `masjid-console-dest-${dest}`;

// One entry per destination: what the app bar says, which body it hosts, and any trailing action.
const CONSOLE_DESTINATIONS = {
  members: { title: 'Committee', body: CommitteeBody },
  followers: { title: 'Musalleen', body: FollowersBody },
  details: { title: 'Masjid details', body: DetailsBody },
  // Opened from a committee row; its title is the member's name.
  // The member screen carries its own header (avatar + name + number), so no app bar.
  member: { title: 'Member', body: MemberBody, ownHeader: true },
  // Same screen, invite scenario — a full destination, not a sheet, because it holds the
  // same role picker and permission switches as the member screen.
  invite: { title: 'Invite a member', body: MemberBody, ownHeader: true },
};

function ConsoleScreen({ data = {}, transitionEnabled = false }) {
  const {
    role = 'CHAIRMAN', caps = [], dest = 'home', status = 'loaded', masjid = OPS_MASJID,
    onBack, snack, onCloseSnack, confirm, onCancelConfirm,
  } = data;

  const locked = status === 'locked';
  // A destination the role cannot reach falls back to the hub — the same rule the rows use.
  const reachable = !locked
    && dest !== 'home'
    && !!CONSOLE_DESTINATIONS[dest]
    && (dest !== 'member' || !!(data.members || {}).editing)
    && (dest !== 'invite' || OPS_CAPS.isAdmin(caps));
  const destination = reachable ? CONSOLE_DESTINATIONS[dest] : null;
  const DestBody = destination ? destination.body : null;

  return (
    <Screen>
      {destination && !destination.ownHeader ? (
        <OpsAppBar
          title={destination.title}
          subtitle={masjid.name}
          onBack={onBack}
          trailing={destination.trailing ? destination.trailing(data) : undefined}
          transitionName={transitionEnabled ? destTransitionName(dest) : undefined}
        />
      ) : null}
      {/* The console home carries its own header (masjid mark + name + switch icon); the
          locked state still needs a way back. */}
      {!destination && locked ? <OpsAppBar title="" onBack={onBack} /> : null}

      {destination
        ? <DestBody data={data} />
        : <ConsoleHome data={data} transitionEnabled={transitionEnabled} />}

      <MasjidSwitcherSheet
        open={!!data.switcherOpen}
        managed={data.managed}
        currentId={(data.masjid || {}).id}
        onPick={data.onPickMasjid}
        onClose={data.onCloseSwitcher}
      />
      <ConfirmDialog confirm={confirm} onCancel={onCancelConfirm} />
      <Snack snack={snack} onClose={onCloseSnack} />
    </Screen>
  );
}

const MAX_POST_MESSAGE = 1024;
const MAX_POST_IMAGES = 4;

// ══════════════════════════════════════════════════════════════════════
// 9 · PostSentScreen — verification-pending outcome
// ══════════════════════════════════════════════════════════════════════

function PostSentScreen({ data = {} }) {
  const { onHome, onAnother, onBack } = data;
  return (
    <Screen>
      <OpsAppBar title="Paigham sent" onBack={onBack || onHome} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: `${BCS_APPBAR_H}px 24px 40px`, gap: 12 }}>
        <div className="empty-state-icon" style={{ background: 'color-mix(in oklab,var(--color-status-success) 14%,transparent)', color: 'var(--color-status-success)' }} aria-hidden="true">
          <span className="mi" data-i="check_circle"></span>
        </div>
        <div style={{ fontFamily: FONT_T, fontSize: 24, lineHeight: 1.2, marginTop: 6 }}>Your paigham is live</div>
        <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--color-info-secondary)' }}>
          Every musalli of this masjid has it now. You can see it — and delete it if something is
          wrong — from Paighams in the console.
        </div>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          <button className="btn btn-filled lg" style={{ width: '100%' }} onClick={onHome}>Take me home</button>
          <button className="btn btn-tonal lg" style={{ width: '100%' }} onClick={onAnother}>Send another paigham</button>
        </div>
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 10 · InvitationsScreen — accept / decline committee invitations
// ══════════════════════════════════════════════════════════════════════

// ── Invitations — decide before you accept ────────────────────────────
// An invitation is a grant of power, so the card states what the role will let you DO, who
// asked, and how long the invitation has left. Accepting hands you straight into that
// masjid's console; an invitation older than 7 days is shown expired rather than hidden.
function InvitationCard({ invitation, actioning, accepted, onAccept, onDecline, onOpenConsole }) {
  const caps = (invitation.caps || [])
    .map((id) => OPS_CAPS.find(id))
    .filter(Boolean);
  const urgent = !invitation.expired && invitation.daysLeft <= 1;

  if (accepted) {
    return (
      <div className="invite-card accepted">
        <div className="invite-card-head">
          {invitation.photo
            ? <span className="masjid-mark" style={{ '--tile': '44px' }}><img src={invitation.photo} alt="" /></span>
            : <IconTile icon="mosque" size={44} tone="accent" />}
          <div className="invite-card-id">
            <div className="section-title truncate invite-card-name">{invitation.name}</div>
            <div className="invite-card-city">You are now {roleLabel(invitation.role)} here</div>
          </div>
          <span className="mi invite-card-tick" data-i="check_circle" aria-hidden="true"></span>
        </div>
        <button className="btn btn-filled invite-card-open" onClick={onOpenConsole}>
          <span className="mi" style={{ fontSize: 18 }} data-i="dashboard"></span>Open the console
        </button>
      </div>
    );
  }

  return (
    <div className={`invite-card${invitation.expired ? ' expired' : ''}`}>
      <div className="invite-card-head">
        {invitation.photo
          ? <span className="masjid-mark" style={{ '--tile': '44px' }}><img src={invitation.photo} alt="" /></span>
          : <IconTile icon="mosque" size={44} />}
        <div className="invite-card-id">
          <div className="section-title truncate invite-card-name">{invitation.name}</div>
          <div className="invite-card-city">{invitation.city}</div>
        </div>
        {/* Expired is muted, not coral: an invitation you can still save and one that is already
            gone must not read the same. Coral stays reserved for "act now". */}
        {invitation.expired
          ? <span className="badge sm muted">Expired</span>
          : <span className={`badge sm ${urgent ? 'coral' : 'amber'}`}>
              <span className="mi" data-i="schedule"></span>
              {invitation.daysLeft <= 0 ? 'Last day' : `${invitation.daysLeft} ${invitation.daysLeft === 1 ? 'day' : 'days'} left`}
            </span>}
      </div>

      <div className="invite-card-role">
        <span className="invite-card-role-label">Invited as</span>
        <strong>{roleLabel(invitation.role)}</strong>
      </div>

      <div className={`invite-card-caps ${caps.length ? '' : 'empty'}`}>
        <span className="eyebrow accent invite-card-caps-label">
          {caps.length ? 'You will be able to' : 'This role has no permissions yet'}
        </span>
        {caps.length ? (
          <span className="invite-card-caps-list">
            {caps.map((capability) => (
              <span className="invite-card-cap" key={capability.id}>
                <span className="mi" data-i={capability.icon}></span>
                {capability.label}
              </span>
            ))}
          </span>
        ) : (
          <span className="invite-card-caps-none">
            You will see everything the committee sees. A full admin can grant permissions later.
          </span>
        )}
      </div>

      <div className="invite-card-from">
        <Avatar text={invitation.invitedBy} size={26} />
        <span>{invitation.invitedBy} · {roleLabel(invitation.invitedByRole)} · {invitation.sent}</span>
      </div>

      {invitation.expired ? (
        <div className="invite-card-note">
          This invitation has run out. Ask {invitation.invitedBy.split(' ')[0]} to send a new one.
        </div>
      ) : actioning ? (
        /* The capsule REPLACES the pair, in the pair's own slot, which keeps its height so the card
           does not resize under the reader's finger. It names the action: `Working…` could not,
           because one flag could not tell accepting from declining — and those are opposite
           outcomes for the same committee role, so which one is running is the whole question. */
        <div className="invite-card-actions is-working">
          <div className="status-capsule" role="status" aria-live="polite">
            <span className="status-capsule-ring" aria-hidden="true"></span>
            <b>{actioning === 'decline' ? 'Declining…' : 'Accepting…'}</b>
          </div>
        </div>
      ) : (
        <div className="invite-card-actions">
          {/* .lg, not base .btn: base is 40px, and accepting or declining a committee role is the
              highest-consequence pair of taps in the console. It must clear 48dp / 44pt. */}
          <button className="btn lg btn-tonal" onClick={onDecline}>Decline</button>
          <button className="btn lg btn-filled" onClick={onAccept}>Accept</button>
        </div>
      )}
    </div>
  );
}

function InvitationsScreen({ data = {} }) {
  const {
    invitations = {}, onBack, onAccept, onDecline, onRetry, snack, onCloseSnack, onExplore,
    onOpenAcceptedConsole,
  } = data;
  const { status = 'loaded', items = [], actioning, acceptedId } = invitations;
  const live = items.filter((i) => !i.expired);

  return (
    <Screen>
      <OpsAppBar title="Invitations" subtitle="Committee roles you have been invited to" onBack={onBack} />

      {status === 'loading' ? <Loading label="Loading invitations…" /> : null}
      {status === 'error' ? (
        <ErrorState title="Couldn't load invitations" copy="Check your connection and try again." onRetry={onRetry} />
      ) : null}
      {status === 'loaded' && !items.length ? (
        <Empty
          icon="mail"
          title="No invitations"
          copy="When a masjid committee invites you, it appears here for 7 days — with the role you are offered and what it will let you do."
          actionText="Explore masjids"
          actionIcon="travel_explore"
          onAction={onExplore}
        />
      ) : null}
      {status === 'loaded' && items.length ? (
        <Body bottomInset={40} style={{ gap: 12, paddingTop: BCS_APPBAR_H + 14 }}>
          <div className="eyebrow">
            {live.length
              ? `${live.length} ${live.length === 1 ? 'invitation' : 'invitations'} waiting for you`
              : 'Nothing waiting — these have run out'}
          </div>
          {items.map((invitation) => (
            <InvitationCard
              key={invitation.id}
              invitation={invitation}
              actioning={actioning && actioning.id === invitation.id ? actioning.kind : null}
              accepted={acceptedId === invitation.id}
              onAccept={() => onAccept && onAccept(invitation)}
              onDecline={() => onDecline && onDecline(invitation)}
              onOpenConsole={() => onOpenAcceptedConsole && onOpenAcceptedConsole(invitation)}
            />
          ))}
          <div className="invite-foot">
            Accepting adds you to that masjid's committee. You can leave at any time by asking a
            full admin to remove you.
          </div>
        </Body>
      ) : null}

      <ConfirmDialog confirm={data.confirm} onCancel={data.onCancelConfirm} />
      <Snack snack={snack} onClose={onCloseSnack} />
    </Screen>
  );
}

Object.assign(window, {
  // screens
  ConsoleScreen,
  // shared by the compose wizard (./broadcast-studio-compose.jsx)
  OpsConfirmDialog: ConfirmDialog,
  // Shared with the compose wizard: switching masjid mid-compose uses the console's sheet.
  MasjidSwitcherSheet,
  PostSentScreen,
  InvitationsScreen,
  // reference data + helpers shared with the board rows and the live device
  OPS_ROLES,
  opsAvailableCommitteeRoles: availableCommitteeRoles,
  opsCanonicalCommitteePhone: canonicalCommitteePhone,
  opsIsCommitteePhoneTaken: isCommitteePhoneTaken,
  OPS_CAPABILITIES,
  OPS_CAPS,
  OPS_MASJID,
  OPS_MANAGED,
  OPS_MEMBERS,
  OPS_FOLLOWERS,
  OPS_POSTS,
  OPS_INVITATIONS,
  OPS_SALAAH_CONFIG,
  opsRoleLabel: roleLabel,
  MAX_POST_MESSAGE,
  MAX_POST_IMAGES,
  CONSOLE_TITLE_TRANSITION,
  opsDestTransitionName: destTransitionName,
});

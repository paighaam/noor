// Admin Console — one state model shared by the storyboard frames and the live device.
//
// Plain JS (loaded synchronously from the page <head>) so `buildAdminData` and `ADMIN_FRAMES`
// exist before the page's DCLogic runs. Every storyboard frame is produced by the SAME
// `buildAdminData` the live device uses, so a frame can never drift from the prototype. A frame
// declares only the state that differs from the default; `matchesFrame` decides which ring lights.
//
// Server truth this model mirrors (paigham-core-server, read 2026-09-12):
//   GET  /v1/core/admin                       → AdminDto { name, role: ADMIN | SUPER_ADMIN, status }
//   GET  /v1/core/admin/destination           → HOME | MASJID | INVALID_ADMIN
//   GET  /v1/core/admin/leads?filter=         → AdminLeadDto[]; LeadFilterType P | V | R | ALL
//   GET  /v1/core/admin/lead/{id}/media-url   → signed URL, ONLY while status = PENDING_VERIFICATION
//   POST /v1/core/admin/lead/approve          → new masjid (registration) or claim grant (409 if taken)
//   POST /v1/core/admin/lead/reject           → REJECTED + lead_revisions row carrying the reason
//   POST /v1/core/admin/lead/merge            → writes name / maslak / address onto the sourced masjid
//   GET  /v1/core/admin/posts?filter=         → PostDto[]; PostFilterType P | L | R
//   POST /v1/core/admin/post/{approve,reject}
// A claim lead carries NO masjid fields of its own (RegisterMasjidRequestDto ignores them, and
// masjid.leads has CHECK claimed_masjid_id IS NULL OR address_id IS NULL), so the claim review
// verifies the PERSON against the sourced record and lets the admin correct that record — it does
// not diff two columns.
// Signups have no endpoint yet: the numbers here are what `count(*) FILTER (WHERE created_at >= …)`
// over paigham.users (deleted_at IS NULL) would return.

(function () {
  const TODAY = new Date(2026, 8, 12); // Sat 12 Sep 2026 — the board's "now"

  // ── Who is signed in ──
  const ADMIN_ME = {
    id: 'adm-1', name: 'Toufeeq Ahamed', phone: '+91 98450 12345', status: 'ACTIVE',
  };

  // ── Signups — paigham.users.created_at, UTC, deleted accounts excluded ──
  // Thirty daily counts ending today. The last eight are the "8 days" window (today + the
  // same weekday last week), the last one is today.
  const SIGNUPS_DAILY_30 = [
    27, 31, 29, 35, 33, 30, 38, 41, 36, 34, 39, 42, 37, 40, 44, 35, 38, 43, 41, 39, 45, 42,
    31, 36, 42, 29, 44, 37, 34, 38,
  ];
  const SIGNUPS_PREV_DAY_HOURLY_TOTAL = 34; // yesterday's 24h, for the delta
  // Today's 24 hourly buckets (UTC hour 0 → 23); sums to today's daily count.
  const SIGNUPS_HOURLY_24 = [0, 0, 0, 1, 2, 3, 4, 3, 2, 1, 1, 2, 3, 2, 1, 1, 2, 2, 3, 2, 1, 1, 1, 0];
  // Months since launch (Feb 2026 → Aug 2026); September is month-to-date from the daily series.
  const SIGNUPS_MONTHLY = [
    { label: 'Feb', count: 312 }, { label: 'Mar', count: 468 }, { label: 'Apr', count: 541 },
    { label: 'May', count: 627 }, { label: 'Jun', count: 702 }, { label: 'Jul', count: 761 },
    { label: 'Aug', count: 843 },
  ];
  // UserStatus split of everyone who ever signed up.
  const SIGNUPS_STATUS_SHARE = [
    { status: 'VERIFIED', label: 'Finished onboarding', share: 0.82 },
    { status: 'PENDING_MASJID_SELECTION', label: 'Still choosing a masjid', share: 0.11 },
    { status: 'PENDING_DETAILS', label: 'Stopped at personal details', share: 0.07 },
  ];

  const sum = (xs) => xs.reduce((a, b) => a + b, 0);
  const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dayLabel = (offsetBack) => {
    const d = new Date(TODAY);
    d.setDate(d.getDate() - offsetBack);
    return DAY_NAMES[d.getDay()];
  };
  const dateLabel = (offsetBack) => {
    const d = new Date(TODAY);
    d.setDate(d.getDate() - offsetBack);
    return `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]} ${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]}`;
  };

  const buildSignups = () => {
    const daily = SIGNUPS_DAILY_30;
    const today = daily[daily.length - 1];
    const last8 = daily.slice(-8);
    const prev8 = daily.slice(-16, -8);
    const last30 = daily;
    const septemberToDate = sum(daily.slice(-12)); // 1 Sep → 12 Sep
    const allTime = sum(SIGNUPS_MONTHLY.map((m) => m.count)) + septemberToDate;
    const pct = (now, before) => (before ? Math.round(((now - before) / before) * 100) : null);

    const windows = {
      h24: {
        id: 'h24', tab: '24 hours', title: 'Last 24 hours', total: today,
        delta: pct(today, SIGNUPS_PREV_DAY_HOURLY_TOTAL), deltaAgainst: 'the day before',
        series: SIGNUPS_HOURLY_24.map((count, hour) => ({
          count, label: hour % 6 === 0 ? `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}${hour < 12 ? 'am' : 'pm'}` : '',
          name: `${hour}:00 – ${hour + 1}:00 UTC`,
        })),
        unit: 'per hour',
      },
      d8: {
        id: 'd8', tab: '8 days', title: 'Last 8 days', total: sum(last8),
        delta: pct(sum(last8), sum(prev8)), deltaAgainst: 'the 8 days before',
        series: last8.map((count, i) => ({ count, label: dayLabel(7 - i), name: dateLabel(7 - i) })),
        unit: 'per day',
      },
      d30: {
        id: 'd30', tab: '30 days', title: 'Last 30 days', total: sum(last30),
        delta: null, deltaAgainst: null,
        series: last30.map((count, i) => {
          const back = 29 - i;
          const d = new Date(TODAY); d.setDate(d.getDate() - back);
          const show = d.getDate() === 1 || back === 29 || back === 0 || d.getDate() % 7 === 0;
          return { count, label: show ? String(d.getDate()) : '', name: dateLabel(back) };
        }),
        unit: 'per day',
      },
      all: {
        id: 'all', tab: 'All time', title: 'Since launch', total: allTime,
        delta: null, deltaAgainst: null,
        series: SIGNUPS_MONTHLY.concat([{ label: 'Sep', count: septemberToDate }])
          .map((m) => ({ count: m.count, label: m.label, name: `${m.label} 2026` })),
        unit: 'per month',
      },
    };

    return {
      today,
      last8: windows.d8.total,
      last30: windows.d30.total,
      allTime,
      deltaToday: windows.h24.delta,
      launched: 'Feb 2026',
      windows,
      statusShare: SIGNUPS_STATUS_SHARE.map((row) => ({ ...row, count: Math.round(allTime * row.share) })),
    };
  };

  // ── Masjids on the platform (masjid.masjids by status) ──
  const MASJID_COUNTS = { verified: 148, sourcedUnclaimed: 12, pendingRegistration: 1 };

  // ── Sourced records an admin typed in (POST /masjid/sourced) — a claim points at one ──
  const SOURCED_MASJIDS = {
    'msj-501': {
      id: 'msj-501', masjidId: 'M560051012', status: 'PENDING_VERIFICATION', sourced: true,
      name: 'Jamia Masjid Bilal', maslak: 'Ahle Sunnat Wal Jamaat (Deoband)',
      address: { address: 'No. 12/B, Old Tank Bund Road', city: 'Shivajinagar, Bengaluru', state: 'Karnataka', pincode: '560051', coordinates: { lat: 12.985, lng: 77.6062 } },
      photo: '../../images/masjid-camera-preview.png',
      sourcedBy: 'Field survey · Mar 2026',
    },
  };

  // ── The queue — AdminLeadDto rows plus what the review screen fetches for a PENDING one ──
  const ADMIN_LEADS = [
    {
      id: 'lead-101', phone: '+91 98450 12345', status: 'PENDING_VERIFICATION', role: 'CHAIRMAN',
      contactName: 'Mohammed Imran Khan',
      // A claim: no masjid fields of its own — everything about the masjid is the sourced record.
      masjidName: null, maslak: null, address: null,
      claimedMasjidId: 'msj-501',
      masjidPhotoAvailable: true, verificationPhotoAvailable: true,
      masjidPhoto: '../../images/masjid-camera-preview.png',
      verificationPhoto: '../../images/masjid-camera-preview.png',
      submittedAt: '2 hours ago', submittedOn: 'Sat 12 Sep · 9:14 AM', resubmitted: false,
    },
    {
      id: 'lead-102', phone: '+91 99887 76655', status: 'PENDING_VERIFICATION', role: 'TREASURER',
      contactName: 'Syed Abdul Rahaman',
      masjidName: 'Masjid Umar Farooq', maslak: 'Shafi',
      address: { address: 'Opp. Eidgah Ground, Rajiv Gandhi Nagar', city: 'Mysuru', state: 'Karnataka', pincode: '570019', coordinates: { lat: 12.3118, lng: 76.6529 } },
      claimedMasjidId: null,
      masjidPhotoAvailable: true, verificationPhotoAvailable: true,
      masjidPhoto: '../../images/masjid-camera-preview.png',
      verificationPhoto: '../../images/masjid-camera-preview.png',
      submittedAt: '5 hours ago', submittedOn: 'Sat 12 Sep · 6:02 AM', resubmitted: true,
      previousRejection: { reason: 'Address or pin does not match a masjid', on: 'Wed 9 Sep' },
    },
    {
      id: 'lead-103', phone: '+91 97400 33221', status: 'PENDING_VERIFICATION', role: 'SECRETARY',
      contactName: 'Abdul Kareem',
      masjidName: 'Masjid-e-Aqsa', maslak: 'Hanafi',
      address: { address: '3rd Main, KHB Colony, Basaveshwaranagar', city: 'Bengaluru', state: 'Karnataka', pincode: '560079', coordinates: { lat: 12.9903, lng: 77.5391 } },
      claimedMasjidId: null,
      masjidPhotoAvailable: true, verificationPhotoAvailable: false,
      masjidPhoto: '../../images/masjid-camera-preview.png', verificationPhoto: null,
      submittedAt: 'Yesterday', submittedOn: 'Fri 11 Sep · 7:48 PM', resubmitted: false,
    },
    {
      id: 'lead-104', phone: '+91 91234 56789', status: 'PENDING_DETAILS', role: 'CHAIRMAN',
      contactName: 'Farhan Ahmed', masjidName: 'Masjid Noor-ul-Huda', maslak: 'Hanafi',
      address: { address: 'Main Bazaar Road', city: 'Hubballi', state: 'Karnataka', pincode: '580020', coordinates: null },
      claimedMasjidId: null, masjidPhotoAvailable: false, verificationPhotoAvailable: false,
      submittedAt: 'Started 3 days ago', submittedOn: 'Wed 9 Sep', resubmitted: false,
    },
    {
      id: 'lead-105', phone: '+91 98800 11223', status: 'VERIFIED', role: 'CHAIRMAN',
      contactName: 'Irfan Pasha', masjidName: 'Masjid-e-Khadria', maslak: 'Ahle Sunnat Wal Jamaat (Deoband)',
      address: { address: '1st Cross, Frazer Town', city: 'Bengaluru', state: 'Karnataka', pincode: '560005', coordinates: { lat: 12.9982, lng: 77.6143 } },
      claimedMasjidId: null, masjidPhotoAvailable: false, verificationPhotoAvailable: false,
      submittedAt: 'Yesterday', submittedOn: 'Fri 11 Sep · 11:20 AM',
      decision: { by: 'Toufeeq Ahamed', on: 'Yesterday · 4:32 PM', masjidId: 'M560005007' },
    },
    {
      id: 'lead-106', phone: '+91 96320 45678', status: 'VERIFIED', role: 'IMAM',
      contactName: 'Maulana Ashraf Ali', masjidName: 'Masjid-e-Ameer', maslak: 'Hanafi',
      address: { address: 'Kalasipalya Main Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560002', coordinates: { lat: 12.9634, lng: 77.5807 } },
      claimedMasjidId: 'msj-402', masjidPhotoAvailable: false, verificationPhotoAvailable: false,
      submittedAt: '3 days ago', submittedOn: 'Wed 9 Sep',
      decision: { by: 'Toufeeq Ahamed', on: 'Wed 9 Sep · 6:10 PM', masjidId: 'M560002003', corrections: 1 },
    },
    {
      id: 'lead-107', phone: '+91 90000 11111', status: 'REJECTED', role: 'MEMBER',
      contactName: 'Unknown submitter', masjidName: 'Grand City Masjid', maslak: null,
      address: { address: 'Sector 4, Ring Road', city: 'Mangaluru', state: 'Karnataka', pincode: '575001', coordinates: { lat: 12.9141, lng: 74.856 } },
      claimedMasjidId: null, masjidPhotoAvailable: false, verificationPhotoAvailable: false,
      submittedAt: '4 days ago', submittedOn: 'Tue 8 Sep',
      decision: { by: 'Toufeeq Ahamed', on: 'Tue 8 Sep · 9:05 PM', reason: 'Could not reach the committee on this number' },
    },
  ];

  // Reasons are the copy the applicant reads in the app, so they name what to fix.
  const REJECT_REASONS = [
    'Could not reach the committee on this number',
    'Entrance photo does not show this masjid',
    'Identity photo is unclear or missing',
    'Address or pin does not match a masjid',
    'This masjid already has a verified committee',
    'Requested role could not be confirmed',
  ];

  // ── Paighams waiting for a moderator (PostDto rows, PostStatus PENDING) ──
  const ADMIN_POSTS = [
    {
      id: 'post-901', status: 'PENDING', message: 'Jumah bayan this week will be on the rights of neighbours, in shaa Allah. Please be seated by 12:45 PM — the first row is reserved for the elderly.',
      images: [], audio: null,
      createdBy: { name: 'Salim Shaikh', role: 'Chairman' }, masjid: { name: 'Masjid E Bilal', code: 'PGM-BLR-1042', followers: 1284 },
      target: 'MASJID', targetLabel: 'Musalleen of Masjid E Bilal', createdAt: '40 min ago', createdOn: 'Sat 12 Sep · 10:31 AM',
    },
    {
      id: 'post-902', status: 'PENDING', message: 'Masjid cleaning drive on Sunday after Fajr. Volunteers welcome — bring your own gloves.',
      images: ['../../images/masjid-camera-preview.png'], audio: null,
      createdBy: { name: 'Ayaan Khan', role: 'Secretary' }, masjid: { name: 'Masjid-e-Noor', code: 'PGM-BLR-2251', followers: 412 },
      target: 'MASJID', targetLabel: 'Musalleen of Masjid-e-Noor', createdAt: '3 hours ago', createdOn: 'Sat 12 Sep · 8:05 AM',
    },
    {
      id: 'post-903', status: 'LIVE', message: 'Eid Milad programme details are now on the notice board. Jazakallah khair for the overwhelming support.',
      images: [], audio: null,
      createdBy: { name: 'Hafiz Bilal Ahmed', role: 'Imam' }, masjid: { name: 'Masjid E Bilal', code: 'PGM-BLR-1042', followers: 1284 },
      target: 'MASJID', targetLabel: 'Musalleen of Masjid E Bilal', createdAt: 'Yesterday', createdOn: 'Fri 11 Sep · 5:12 PM',
      decision: { by: 'Toufeeq Ahamed', on: 'Yesterday · 5:40 PM' },
    },
    {
      id: 'post-904', status: 'REJECTED', message: 'Send this to all your contacts for barakah!!! Forward forward forward',
      images: [], audio: null,
      createdBy: { name: 'Unknown', role: 'Member' }, masjid: { name: 'Grand City Masjid', code: 'PGM-MLR-0450', followers: 36 },
      target: 'MASJID', targetLabel: 'Musalleen of Grand City Masjid', createdAt: '4 days ago', createdOn: 'Tue 8 Sep',
      decision: { by: 'Toufeeq Ahamed', on: 'Tue 8 Sep · 9:12 PM', reason: 'Chain message, not a masjid notice' },
    },
  ];

  const POST_REJECT_REASONS = [
    'Chain message, not a masjid notice',
    'Contains personal or financial details',
    'Not from this masjid’s committee',
    'Duplicate of a paigham already live',
    'Language that could cause offence',
  ];

  // ── Default state — a super admin opening a busy console ──
  const ADMIN_DEFAULT_STATE = {
    route: 'hub', // 'hub' | 'signups' | 'approvals' | 'lead' | 'moderation' | 'post' | 'invalid'
    role: 'SUPER_ADMIN', // 'SUPER_ADMIN' | 'ADMIN'
    hubStatus: 'loaded', // 'loading' | 'loaded' | 'error'
    quiet: false, // nothing is waiting anywhere — every count that would shout is zero

    signupsWindow: 'd8', // 'h24' | 'd8' | 'd30' | 'all'

    leadFilter: 'P', // LeadFilterType: 'P' (to review) | 'V' | 'R' | 'ALL'
    leadSearch: '',
    leadsStatus: 'loaded', // 'loading' | 'loaded' | 'error'
    leadId: null,
    viewer: null, // 'MASJID_PHOTO' | 'VERIFICATION_PHOTO' — full-screen photo
    // Corrections the admin makes to a SOURCED record before approving a claim. Keys are the
    // masjid fields POST /lead/merge can write: name, maslak, address.
    corrections: {},
    editing: null, // { field, value } — the correction sheet
    working: null, // 'approve' | 'reject' | 'post-approve' | 'post-reject' — a request in flight
    confirm: null, // { kind: 'approve' | 'post-approve' }
    rejectSheet: null, // { reason: string | null }
    conflict: false, // 409: another committee was verified for the claimed masjid meanwhile

    postFilter: 'P', // PostFilterType: 'P' | 'L' | 'R'
    postsStatus: 'loaded',
    postId: null,

    snack: null, // { tone: 'success' | 'error', message }

    // Live-device mutations (a decision just taken). NOT part of the frame signature: they change
    // list contents, not which state the screen is in.
    decided: {}, // leadId -> { status, reason }
    postDecided: {}, // postId -> status
  };

  const NESTED_KEYS = ['corrections'];

  const cloneState = (state) => {
    const next = Object.assign({}, state);
    NESTED_KEYS.forEach((key) => { next[key] = Object.assign({}, state[key]); });
    return next;
  };

  const applyPatch = (state, patch) => {
    const next = cloneState(state);
    Object.keys(patch || {}).forEach((key) => {
      if (NESTED_KEYS.indexOf(key) !== -1) next[key] = Object.assign({}, next[key], patch[key]);
      else next[key] = patch[key];
    });
    return next;
  };

  const frameState = (frame) => applyPatch(ADMIN_DEFAULT_STATE, frame.state);

  const sameValue = (a, b) => {
    if (a === b) return true;
    if (a == null || b == null) return a == b; // eslint-disable-line eqeqeq
    if (typeof a === 'object' && typeof b === 'object') {
      return Object.keys(a).every((k) => sameValue(a[k], b[k]))
        && Object.keys(b).every((k) => sameValue(a[k], b[k]));
    }
    return false;
  };

  // ── Frame matching — only the slice the screen is showing takes part ──
  const signature = (state) => {
    const s = state || ADMIN_DEFAULT_STATE;
    const base = {
      route: s.route,
      role: s.role,
      quiet: !!s.quiet,
      working: s.working || null,
      confirm: s.confirm ? s.confirm.kind : null,
      rejectSheet: !!s.rejectSheet,
      conflict: !!s.conflict,
      snack: s.snack ? s.snack.tone : null,
    };
    const slices = {};
    if (s.route === 'hub' || s.route === 'invalid') slices.hubStatus = s.hubStatus;
    if (s.route === 'signups') slices.signupsWindow = s.signupsWindow;
    if (s.route === 'approvals') {
      Object.assign(slices, {
        leadFilter: s.leadFilter,
        leadsStatus: s.leadsStatus,
        search: (s.leadSearch || '').trim() ? 'text' : 'empty',
      });
    }
    if (s.route === 'lead') {
      Object.assign(slices, {
        leadId: s.leadId,
        viewer: s.viewer || null,
        editing: s.editing ? s.editing.field : null,
        corrected: Object.keys(s.corrections || {}).filter((k) => s.corrections[k] != null).length > 0,
      });
    }
    if (s.route === 'moderation') Object.assign(slices, { postFilter: s.postFilter, postsStatus: s.postsStatus });
    if (s.route === 'post') slices.postId = s.postId;
    return Object.assign(base, slices);
  };

  const matchesFrame = (state, frame) => sameValue(signature(state), signature(frameState(frame)));
  const activeFrameIndex = (state) => ADMIN_FRAMES.findIndex((frame) => matchesFrame(state, frame));

  // ── Formatting ──
  const roleLabel = (role) => (role || '')
    .toLowerCase().split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const countLabel = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n));
  const withCommas = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const LEAD_FILTERS = [
    { id: 'P', label: 'Waiting', matches: (st) => st === 'PENDING_VERIFICATION' },
    { id: 'V', label: 'Approved', matches: (st) => st === 'VERIFIED' },
    { id: 'R', label: 'Rejected', matches: (st) => st === 'REJECTED' },
    { id: 'ALL', label: 'All', matches: () => true },
  ];
  const POST_FILTERS = [
    { id: 'P', label: 'Waiting', matches: (st) => st === 'PENDING' },
    { id: 'L', label: 'Live', matches: (st) => st === 'LIVE' },
    { id: 'R', label: 'Rejected', matches: (st) => st === 'REJECTED' },
  ];

  // ── The one assembly the frames and the device share ──
  function buildAdminData(state, handlers) {
    const s = state || ADMIN_DEFAULT_STATE;
    const h = handlers || {};

    const leads = ADMIN_LEADS.map((lead) => {
      const decided = (s.decided || {})[lead.id];
      return decided ? Object.assign({}, lead, { status: decided.status, decision: decided.decision }) : lead;
    });
    const posts = ADMIN_POSTS.map((post) => {
      const decided = (s.postDecided || {})[post.id];
      return decided ? Object.assign({}, post, { status: decided.status, decision: decided.decision }) : post;
    });

    const pendingLeads = s.quiet ? [] : leads.filter((l) => l.status === 'PENDING_VERIFICATION');
    const pendingPosts = s.quiet ? [] : posts.filter((p) => p.status === 'PENDING');

    const filter = LEAD_FILTERS.find((f) => f.id === s.leadFilter) || LEAD_FILTERS[0];
    const query = (s.leadSearch || '').trim().toLowerCase();
    const visibleLeads = (s.quiet ? leads.filter((l) => l.status !== 'PENDING_VERIFICATION') : leads)
      .filter((l) => filter.matches(l.status))
      .filter((l) => {
        if (!query) return true;
        const sourced = l.claimedMasjidId ? SOURCED_MASJIDS[l.claimedMasjidId] : null;
        const hay = [l.masjidName, sourced && sourced.name, l.contactName, l.phone,
          l.address && l.address.city, l.address && l.address.pincode, sourced && sourced.address.pincode]
          .filter(Boolean).join(' ').toLowerCase();
        return hay.indexOf(query) !== -1;
      });

    const lead = s.leadId ? leads.find((l) => l.id === s.leadId) : null;
    const sourced = lead && lead.claimedMasjidId ? SOURCED_MASJIDS[lead.claimedMasjidId] : null;
    const corrections = s.corrections || {};
    const correctionCount = Object.keys(corrections).filter((k) => corrections[k] != null).length;
    // The record as it will be written: the sourced value unless the admin corrected it.
    const record = sourced ? {
      name: corrections.name != null ? corrections.name : sourced.name,
      maslak: corrections.maslak != null ? corrections.maslak : sourced.maslak,
      address: corrections.address != null ? corrections.address : sourced.address.address,
    } : null;

    const postFilter = POST_FILTERS.find((f) => f.id === s.postFilter) || POST_FILTERS[0];
    const visiblePosts = (s.quiet ? posts.filter((p) => p.status !== 'PENDING') : posts).filter((p) => postFilter.matches(p.status));
    const post = s.postId ? posts.find((p) => p.id === s.postId) : null;

    // Recent decisions — leads.verified_at/verified_by plus lead_revisions REJECTED rows, newest first.
    const decisions = leads
      .filter((l) => l.decision)
      .map((l) => ({
        id: l.id,
        kind: l.status === 'VERIFIED' ? (l.claimedMasjidId ? 'claim' : 'approved') : 'rejected',
        title: l.masjidName || (l.claimedMasjidId && SOURCED_MASJIDS[l.claimedMasjidId] ? SOURCED_MASJIDS[l.claimedMasjidId].name : 'Masjid'),
        copy: l.status === 'VERIFIED'
          ? `${roleLabel(l.role)} · ${l.contactName}${l.decision.corrections ? ` · ${l.decision.corrections} correction` : ''}`
          : l.decision.reason,
        when: l.decision.on,
      }));

    const signups = buildSignups();

    return {
      me: Object.assign({}, ADMIN_ME, { role: s.role, roleLabel: s.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin' }),
      route: s.route,
      hubStatus: s.hubStatus,
      quiet: !!s.quiet,
      counts: {
        pendingLeads: pendingLeads.length,
        pendingPosts: pendingPosts.length,
        masjids: MASJID_COUNTS,
      },
      signups,
      signupsWindow: signups.windows[s.signupsWindow] || signups.windows.d8,
      leadFilters: LEAD_FILTERS.map((f) => ({ id: f.id, label: f.label, active: f.id === filter.id })),
      leadFilter: filter.id,
      leadSearch: s.leadSearch || '',
      leadsStatus: s.leadsStatus,
      visibleLeads,
      sourcedNames: Object.keys(SOURCED_MASJIDS).reduce((acc, id) => { acc[id] = SOURCED_MASJIDS[id].name; return acc; }, {}),
      lead,
      sourced,
      record,
      corrections,
      correctionCount,
      editing: s.editing,
      viewer: s.viewer,
      rejectReasons: s.route === 'post' ? POST_REJECT_REASONS : REJECT_REASONS,
      rejectSheet: s.rejectSheet,
      confirm: s.confirm,
      working: s.working,
      conflict: !!s.conflict,
      postFilters: POST_FILTERS.map((f) => ({ id: f.id, label: f.label, active: f.id === postFilter.id })),
      postFilter: postFilter.id,
      postsStatus: s.postsStatus,
      visiblePosts,
      post,
      decisions,
      snack: s.snack,
      fmt: { roleLabel, countLabel, withCommas },
      ...h,
    };
  }

  // ── Storyboard frame catalog ──
  const CLAIM = { route: 'lead', leadId: 'lead-101' };
  const REQUEST = { route: 'lead', leadId: 'lead-102' };

  const ADMIN_FRAMES = [
    // 01 · Hub
    { group: 'hub', name: 'Hub · super admin', screen: 'hub', state: {} },
    { group: 'hub', name: 'Hub · nothing waiting', screen: 'hub', state: { quiet: true } },
    { group: 'hub', name: 'Hub · admin (not super)', screen: 'hub', state: { role: 'ADMIN' } },
    { group: 'hub', name: 'Hub · loading', screen: 'hub', state: { hubStatus: 'loading' } },
    { group: 'hub', name: 'Hub · load failed', screen: 'hub', state: { hubStatus: 'error' } },
    { group: 'hub', name: 'Not an admin', screen: 'invalid', state: { route: 'invalid' } },

    // 02 · Signups
    { group: 'signups', name: 'Signups · 8 days', screen: 'signups', state: { route: 'signups', signupsWindow: 'd8' } },
    { group: 'signups', name: 'Signups · 24 hours', screen: 'signups', state: { route: 'signups', signupsWindow: 'h24' } },
    { group: 'signups', name: 'Signups · 30 days', screen: 'signups', state: { route: 'signups', signupsWindow: 'd30' } },
    { group: 'signups', name: 'Signups · since launch', screen: 'signups', state: { route: 'signups', signupsWindow: 'all' } },

    // 03 · Approvals queue
    { group: 'approvals', name: 'Queue · to review', screen: 'approvals', state: { route: 'approvals' } },
    { group: 'approvals', name: 'Queue · approved', screen: 'approvals', state: { route: 'approvals', leadFilter: 'V' } },
    { group: 'approvals', name: 'Queue · rejected', screen: 'approvals', state: { route: 'approvals', leadFilter: 'R' } },
    { group: 'approvals', name: 'Queue · everything', screen: 'approvals', state: { route: 'approvals', leadFilter: 'ALL' } },
    { group: 'approvals', name: 'Queue · searching', screen: 'approvals', state: { route: 'approvals', leadFilter: 'ALL', leadSearch: 'Bilal' } },
    { group: 'approvals', name: 'Queue · nothing to review', screen: 'approvals', state: { route: 'approvals', quiet: true } },
    { group: 'approvals', name: 'Queue · loading', screen: 'approvals', state: { route: 'approvals', leadsStatus: 'loading' } },
    { group: 'approvals', name: 'Queue · just approved', screen: 'approvals', state: { route: 'approvals', snack: { tone: 'success', message: 'Masjid Umar Farooq is live · M570019004' } } },

    // 04 · New masjid request
    { group: 'request', name: 'Request · review', screen: 'lead', state: REQUEST },
    { group: 'request', name: 'Request · entrance photo', screen: 'lead', state: { ...REQUEST, viewer: 'MASJID_PHOTO' } },
    { group: 'request', name: 'Request · approve?', screen: 'lead', state: { ...REQUEST, confirm: { kind: 'approve' } } },
    { group: 'request', name: 'Request · approving', screen: 'lead', state: { ...REQUEST, working: 'approve' } },
    { group: 'request', name: 'Request · why reject?', screen: 'lead', state: { ...REQUEST, rejectSheet: { reason: REJECT_REASONS[1] } } },
    { group: 'request', name: 'Approved request · read-only', screen: 'lead', state: { route: 'lead', leadId: 'lead-105' } },

    // 05 · Claim on a sourced masjid
    { group: 'claim', name: 'Claim · review', screen: 'lead', state: CLAIM },
    { group: 'claim', name: 'Claim · correcting the name', screen: 'lead', state: { ...CLAIM, editing: { field: 'name', value: 'Jamia Masjid Bilal' } } },
    { group: 'claim', name: 'Claim · record corrected', screen: 'lead', state: { ...CLAIM, corrections: { name: 'Jamia Masjid-e-Bilal' } } },
    { group: 'claim', name: 'Claim · approve?', screen: 'lead', state: { ...CLAIM, corrections: { name: 'Jamia Masjid-e-Bilal' }, confirm: { kind: 'approve' } } },
    { group: 'claim', name: 'Claim · already claimed', screen: 'lead', state: { ...CLAIM, conflict: true } },

    // 06 · Paigham moderation
    { group: 'moderation', name: 'Paighams · waiting', screen: 'moderation', state: { route: 'moderation' } },
    { group: 'moderation', name: 'Paigham · review', screen: 'post', state: { route: 'post', postId: 'post-901' } },
    { group: 'moderation', name: 'Paigham · send live?', screen: 'post', state: { route: 'post', postId: 'post-901', confirm: { kind: 'post-approve' } } },
    { group: 'moderation', name: 'Paighams · nothing waiting', screen: 'moderation', state: { route: 'moderation', quiet: true } },
  ];

  const ADMIN_GROUPS = [
    { id: 'hub', num: '01', title: 'Admin hub', icon: 'dashboard' },
    { id: 'signups', num: '02', title: 'Signups', icon: 'person_add' },
    { id: 'approvals', num: '03', title: 'Approvals queue', icon: 'fact_check' },
    { id: 'request', num: '04', title: 'New masjid request', icon: 'add_home_work' },
    { id: 'claim', num: '05', title: 'Claim on a sourced masjid', icon: 'verified' },
    { id: 'moderation', num: '06', title: 'Paigham moderation', icon: 'campaign' },
  ];

  Object.assign(window, {
    ADMIN_DEFAULT_STATE,
    ADMIN_FRAMES,
    ADMIN_GROUPS,
    ADMIN_REJECT_REASONS: REJECT_REASONS,
    ADMIN_POST_REJECT_REASONS: POST_REJECT_REASONS,
    adminApplyPatch: applyPatch,
    adminFrameState: frameState,
    adminMatchesFrame: matchesFrame,
    adminActiveFrameIndex: activeFrameIndex,
    buildAdminData,
  });
}());

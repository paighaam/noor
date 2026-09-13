// Salaah timing rules — one state model shared by the storyboard frames and the live device.
//
// Plain JS (loaded synchronously from the page helmet) so `buildSrData` and `SR_FRAMES` exist
// before the page's DCLogic runs. The calculated day is read LAZILY off `window.SstPrayerWindows`
// (published by ./salaah-scroll-timeline.jsx), so this file never depends on that async module
// having loaded yet — and the rules page can never disagree with the timeline about when a prayer
// opens or closes.
//
// Why one model: every storyboard frame is produced by the SAME `buildSrData` the live device
// uses, so a frame cannot drift from the prototype. A frame declares only the state that differs
// from the default; `matchesFrame` then decides which frame ring lights up.

(function () {
  // ── Wire vocabulary. It NEVER appears on screen (spec §3) — the humanised names live in
  //    `srRuleCopy` below, which is the single place backend taxonomy is translated. ──
  const ON_TIME = 'ON_TIME';
  const FIXED = 'FIXED';
  const VARIES = 'VARIES_WITH_ON_TIME';

  const STEP_TO_WIRE = { 5: 'VARIES_EVERY_5_MINS', 10: 'VARIES_EVERY_10_MINS', 15: 'VARIES_EVERY_15_MINS' };
  const WIRE_TO_STEP = { VARIES_EVERY_5_MINS: 5, VARIES_EVERY_10_MINS: 10, VARIES_EVERY_15_MINS: 15 };

  // A window is when the prayer may be PRAYED, not when it may be begun, so the jamaat must
  // finish inside it. Same two constants the timeline enforces.
  const JAMAAT_MIN = 10;
  const IQAMA_MIN = 5;

  const ORDER = [
    { key: 'fajr', label: 'Fajr' },
    { key: 'zohar', label: 'Zohar' },
    { key: 'asr', label: 'Asr' },
    { key: 'maghrib', label: 'Maghrib' },
    { key: 'isha', label: 'Isha' },
    { key: 'jumah', label: 'Jumah' },
  ];

  // ── Minute arithmetic. Times are minutes from midnight everywhere inside this model; the
  //    `HH:mm` strings only exist at the wire boundary. ──
  const toMinutes = (hhmm) => {
    if (hhmm == null) return null;
    const parts = String(hhmm).split(':').map((n) => parseInt(n, 10));
    if (isNaN(parts[0])) return null;
    return (parts[0] * 60) + (parts[1] || 0);
  };
  const toHHMM = (mins) => {
    const m = ((Math.round(mins) % 1440) + 1440) % 1440;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  };
  // The timeline's formatter when it has loaded; the same shape when it has not.
  const fmt = (mins) => {
    if (mins == null) return '—';
    if (window.SstFormat) return window.SstFormat(mins);
    const m = ((Math.round(mins) % 1440) + 1440) % 1440;
    const h = Math.floor(m / 60);
    const h12 = ((h + 11) % 12) + 1;
    return `${h12}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  };
  // A reference to a time the reader is already anchored on drops the meridiem.
  const fmtShort = (mins) => fmt(mins).replace(/\s[AP]M$/, '');

  // ── The calculated day. Read at call time from the timeline module so there is one fixture. ──
  const srDay = () => {
    const windows = (window.SstPrayerWindows || []).concat(window.SstJumahWindow ? [window.SstJumahWindow] : []);
    const byKey = {};
    windows.forEach((p) => { byKey[p.key] = p; });
    return byKey;
  };

  // ══════════════════════════════════════════════════════════════════
  // Resolution — spec §5. This mirrors the server's own arithmetic; the app and the backend
  // must agree to the minute, so the rule is written once and read by every surface here.
  // ══════════════════════════════════════════════════════════════════

  const variationStep = (wire) => WIRE_TO_STEP[wire] || null;

  // The rounding uses the NEXT multiple, not the current one: a start already sitting exactly on
  // the grid still moves forward one step. That is the server's rule, not a rounding preference.
  const nextMultiple = (start, step) => (Math.floor(start / step) * step) + step;

  /**
   * Resolve one rule onto one day.
   * Returns `{ azaan, jamaat, natural, floor, floorBinds, malformed }` — `azaan` is null when the
   * day is unavailable or the rule is incomplete, and `malformed` names why rather than guessing a
   * semantic replacement (spec §14.3).
   */
  const srResolve = (cfg, opens) => {
    const delay = cfg && typeof cfg.iqamaDelay === 'number' ? cfg.iqamaDelay : null;
    const out = { azaan: null, jamaat: null, natural: null, floor: null, floorBinds: false, malformed: null, delay };
    if (!cfg || !cfg.variant) { out.malformed = 'This prayer has no rule saved.'; return out; }
    if (delay == null) { out.malformed = 'This prayer is missing its iqama delay.'; return out; }

    if (cfg.variant === ON_TIME) {
      if (opens == null) return out;
      out.azaan = opens;
    } else if (cfg.variant === FIXED) {
      const at = toMinutes(cfg.salaahTime);
      if (at == null) { out.malformed = 'This prayer is set to a fixed time but has no time saved.'; return out; }
      out.azaan = at;
    } else if (cfg.variant === VARIES) {
      const step = variationStep(cfg.salaahTimeVariation);
      if (!step) { out.malformed = 'This prayer rounds up but has no rounding interval saved.'; return out; }
      out.floor = toMinutes(cfg.neverBefore) || 0;
      if (opens == null) return out;
      out.natural = nextMultiple(opens, step);
      out.azaan = Math.max(out.natural, out.floor);
      out.floorBinds = out.floor > out.natural;
    } else {
      out.malformed = 'This prayer uses a rule this version cannot read.';
      return out;
    }
    out.jamaat = out.azaan + delay;
    return out;
  };

  // ══════════════════════════════════════════════════════════════════
  // Validation — spec §11. Two bounds, both enforced, both named after the thing they protect.
  // ══════════════════════════════════════════════════════════════════

  const srFault = (prayer, resolved) => {
    if (!prayer || !resolved || resolved.azaan == null) return null;
    if (resolved.azaan < prayer.opens) {
      return {
        field: 'azaan',
        text: `${prayer.label} does not begin until ${fmt(prayer.opens)} today, so the azaan cannot be called at ${fmt(resolved.azaan)}.`,
      };
    }
    const latest = prayer.closes - JAMAAT_MIN;
    if (resolved.jamaat > latest) {
      return {
        field: 'iqama',
        text: `Jamaat must finish before ${prayer.ends}, so it cannot start after ${fmt(latest)}.`,
      };
    }
    return null;
  };

  // ══════════════════════════════════════════════════════════════════
  // Product language — spec §3. The ONLY place a wire variant becomes words.
  // ══════════════════════════════════════════════════════════════════

  const stepWord = (step) => (step === 15 ? 'quarter-hour' : `${step} minutes`);
  const stepLabel = (step) => (step === 15 ? 'Next quarter-hour' : `Next ${step}-minute mark`);

  // Maghrib's "prayer start" IS sunset, and that is what a committee calls it.
  const startWord = (key, label) => (key === 'maghrib' ? 'sunset' : `${label} begins`);

  const srRuleCopy = (key, label, cfg) => {
    const jumah = key === 'jumah';
    if (!cfg || !cfg.variant) return { short: 'Not set', title: 'No rule saved', detail: '' };
    // `short` is the rule as a LABEL — what a row or a rail needs. `title` is the same rule as a
    // sentence, for the one place that has room to explain it. Keeping both here stops the two
    // surfaces from inventing their own wording for the same rule.
    if (cfg.variant === ON_TIME) {
      const name = key === 'maghrib' ? 'At sunset' : 'At prayer start';
      return { short: name, title: name, detail: 'Azaan moves with the prayer start.' };
    }
    if (cfg.variant === VARIES) {
      const step = variationStep(cfg.salaahTimeVariation);
      return {
        short: step ? stepLabel(step) : 'Rounding not set',
        title: step ? `${stepLabel(step)} after ${startWord(key, label)}` : 'Round up after prayer begins',
        detail: step ? `Azaan moves to the next ${stepWord(step)} mark as the day shifts.` : '',
      };
    }
    const name = jumah ? 'Same time every Friday' : 'Same time every day';
    return { short: name, title: name, detail: 'Azaan stays at this clock time.' };
  };

  // The three choices offered on the detail page, in the spec's order.
  const srChoices = (key) => [
    {
      variant: ON_TIME,
      icon: 'wb_sunny',
      title: key === 'maghrib' ? 'At sunset' : 'At prayer start',
      support: 'Azaan moves with the prayer start. Nothing to set.',
    },
    {
      variant: VARIES,
      icon: 'update',
      title: 'Round up after prayer begins',
      support: 'Azaan moves to the next 5, 10 or 15-minute mark.',
    },
    {
      variant: FIXED,
      icon: 'keep',
      title: key === 'jumah' ? 'Same time every Friday' : 'Same time every day',
      support: 'Azaan stays at this clock time all year.',
    },
  ];

  // ══════════════════════════════════════════════════════════════════
  // Canonical comparison — spec §13.2. Two rules that resolve to the same time TODAY are still
  // different rules, so the comparison is on the rule object, never on the resolved minute.
  // ══════════════════════════════════════════════════════════════════

  // Canonicalize on read: the wire may return `05:12:00`, and an un-normalized string makes a
  // no-op commit report a phantom change.
  const canonRule = (cfg) => {
    if (!cfg) return null;
    const next = { variant: cfg.variant, iqamaDelay: cfg.iqamaDelay };
    if (cfg.variant === FIXED) next.salaahTime = cfg.salaahTime ? toHHMM(toMinutes(cfg.salaahTime)) : cfg.salaahTime;
    if (cfg.variant === VARIES) {
      next.salaahTimeVariation = cfg.salaahTimeVariation;
      next.neverBefore = toHHMM(toMinutes(cfg.neverBefore) || 0);
    }
    return next;
  };
  const canonConfig = (config) => {
    const next = {};
    ORDER.forEach(({ key }) => { if (config && config[key]) next[key] = canonRule(config[key]); });
    return next;
  };
  const sameRule = (a, b) => JSON.stringify(canonRule(a)) === JSON.stringify(canonRule(b));

  // ══════════════════════════════════════════════════════════════════
  // Server fixtures. Every one of these is a real shape the app has to survive — the
  // recommended model, a sourced seed, and the four awkward configs in spec §14.3.
  // ══════════════════════════════════════════════════════════════════

  // Spec §2.1 — the recommended real-world pattern. Recommended, not enforced.
  const SR_RECOMMENDED = {
    fajr: { variant: VARIES, neverBefore: '00:00', salaahTimeVariation: STEP_TO_WIRE[15], iqamaDelay: 20 },
    zohar: { variant: FIXED, salaahTime: '13:30', iqamaDelay: 15 },
    asr: { variant: VARIES, neverBefore: '00:00', salaahTimeVariation: STEP_TO_WIRE[15], iqamaDelay: 15 },
    maghrib: { variant: ON_TIME, iqamaDelay: 5 },
    isha: { variant: VARIES, neverBefore: '00:00', salaahTimeVariation: STEP_TO_WIRE[15], iqamaDelay: 15 },
    jumah: { variant: FIXED, salaahTime: '13:20', iqamaDelay: 0 },
  };

  const withRule = (base, key, rule) => Object.assign({}, base, { [key]: rule });

  const SR_SCENARIOS = {
    // The ordinary case: someone published this, and it is the recommended pattern.
    published: { config: SR_RECOMMENDED, status: 'PUBLISHED', origin: 'published' },

    // A rule set imported for this masjid that nobody has published yet. `dirty` is false and
    // publish must STILL be allowed — the seed is not public until someone says so.
    sourced: { config: SR_RECOMMENDED, status: 'UNPUBLISHED', origin: 'sourced' },
    serverDefault: { config: SR_RECOMMENDED, status: 'UNPUBLISHED', origin: 'default' },

    // §14.3 — a floor that is not on the interval. Rendered exactly as the server resolves it;
    // normalized only once the user edits that value.
    unalignedFloor: {
      config: withRule(SR_RECOMMENDED, 'asr', {
        variant: VARIES, neverBefore: '16:07', salaahTimeVariation: STEP_TO_WIRE[15], iqamaDelay: 15,
      }),
      status: 'PUBLISHED', origin: 'published',
    },

    // §14.3 — a floor LATER than today's natural rounding, so the floor is what is called.
    floorWins: {
      config: withRule(SR_RECOMMENDED, 'asr', {
        variant: VARIES, neverBefore: '17:00', salaahTimeVariation: STEP_TO_WIRE[15], iqamaDelay: 15,
      }),
      status: 'PUBLISHED', origin: 'published',
    },

    // §14.3 — a fixed time that has drifted BEFORE its own prayer start as the season moved.
    // Fajr opens 4:52 today; 4:45 was legal when it was published and is not any more.
    drifted: {
      config: withRule(SR_RECOMMENDED, 'fajr', { variant: FIXED, salaahTime: '04:45', iqamaDelay: 20 }),
      status: 'PUBLISHED', origin: 'published',
    },

    // §14.3 — off-recommendation but deliberate. Preserved, never silently converted.
    onTimeZohar: {
      config: withRule(SR_RECOMMENDED, 'zohar', { variant: ON_TIME, iqamaDelay: 15 }),
      status: 'PUBLISHED', origin: 'published',
    },
    // Review fixture, not a live masjid configuration: a successful scan can be blocked by rules.
    allAtStart: {
      config: Object.fromEntries(ORDER.map(({ key }) => [key, { variant: ON_TIME, iqamaDelay: 15 }])),
      status: 'PUBLISHED', origin: 'published',
    },
    fixedMaghrib: {
      config: withRule(SR_RECOMMENDED, 'maghrib', { variant: FIXED, salaahTime: '18:52', iqamaDelay: 5 }),
      status: 'PUBLISHED', origin: 'published',
    },

    // §14.3 — a rule missing a field it needs. Error for that prayer, publish blocked, no guess.
    malformed: {
      config: withRule(SR_RECOMMENDED, 'isha', { variant: VARIES, neverBefore: '00:00', iqamaDelay: 15 }),
      status: 'PUBLISHED', origin: 'published',
    },
  };

  // ── Default state — a committee member opening the timings of a healthy masjid ──
  const SR_DEFAULT_STATE = {
    // The section's entry is the TIMELINE. The rule pages are reached from its info action, which
    // is the whole information architecture: today's times are the work, the rule is the reference.
    route: 'timings', // 'timings' | 'summary' | 'detail' | 'published'
    prayer: null, // the prayer whose rule page is open
    // Where the open rule page was entered from. A prayer is reachable from the rail on the day AND
    // from the summary list, and Back has to land where the reader actually came from — walking them
    // through a list they never opened is how a two-entrance destination loses people.
    from: 'timings', // 'timings' | 'summary'
    scenario: 'published', // which server fixture loaded
    // A publish LANDS here. Without this the fixture stayed the baseline and a published change
    // vanished the moment the success screen closed — which is fine for a storyboard frame and
    // useless for demonstrating the app.
    serverConfig: null,   // null → the scenario's fixture
    serverStatus: null,   // null → the scenario's status
    historyExtra: [],     // publishes made in this session, newest first
    // The load itself. 'conflict' is a full-page state, not a banner: another publish landed
    // under this draft and nothing may overwrite it silently (spec §13.5).
    status: 'loaded', // 'loading' | 'loaded' | 'error' | 'conflict'
    // The calculated day resolves separately from the config, so the rule text can be readable
    // while every time on the page is still pending.
    dayStatus: 'loaded', // 'loading' | 'loaded' | 'error'
    // Draft overrides on top of the loaded server config, keyed by prayer. One draft, shared with
    // the timeline; nothing here publishes (spec §2.5).
    draft: {},
    snack: null,
    focusPrayer: null, // returning from a detail page puts focus back on its row (§15)

    // ── Publish lifecycle. Publishing is the ONE moment six rules become public, and it lives on
    //    the timeline. The rule pages edit the same draft and never publish (spec §2.5). ──
    saving: false,
    justPublished: false, // a landed publish takes the whole screen, not a toast
    confirmPublish: false,
    historyOpen: false,
    // The drag guide is an opening instruction: which half of a row moves which value cannot be
    // discovered by looking, and once someone has done it the line is noise above the one action.
    guideSeen: false,

    // ── The board scan. An accelerator, never an invisible mutation: a reading is a PROPOSAL that
    //    lands as a sheet, and only an explicit Add walks it into the draft. Publish is still the
    //    one moment anything reaches musalleen. ──
    scanStage: null, // null | 'camera' | 'reading' | 'failed'
    scanProposal: null, // null | 'full' | 'partial' — a pending reading, NOT yet in the draft
    // A single-column board does not say which column it is. Asked on the sheet, and the question
    // stays there after it is answered so every scan can correct it.
    scanColumnMeaning: null, // null | 'azaan' | 'jamaat'
  };

  const cloneState = (state) => Object.assign({}, state, { draft: Object.assign({}, state.draft) });

  const applyPatch = (state, patch) => {
    const next = cloneState(state);
    Object.keys(patch || {}).forEach((key) => {
      if (key === 'draft') next.draft = Object.assign({}, next.draft, patch.draft);
      else next[key] = patch[key];
    });
    return next;
  };

  const frameState = (frame) => {
    const next = applyPatch(SR_DEFAULT_STATE, Object.assign({}, frame.state, { draft: undefined }));
    // A frame's draft REPLACES the default rather than merging, so a frame can show a clean draft.
    next.draft = Object.assign({}, (frame.state || {}).draft || {});
    return next;
  };

  // ══════════════════════════════════════════════════════════════════
  // buildSrData — the assembly both the board and the device render from.
  // ══════════════════════════════════════════════════════════════════

  // ══════════════════════════════════════════════════════════════════
  // The drift offer — spec §8.4
  //
  // A FIXED azaan keeps its clock time while the calculated start slides across the year, so it
  // eventually sits outside its own window. Dragging it to a new fixed time only restarts the clock
  // that broke it; the durable answer is a rounding rule, and only the masjid knows whether it has
  // one — so the screen OFFERS one and never adopts it.
  // ══════════════════════════════════════════════════════════════════

  // The step is READ off the masjid's own published times, never guessed: the coarsest of 15/10/5
  // that divides all of them. Only the numbers a committee actually TYPED count — an anchored prayer
  // has none, a `00:00` floor is the absence of one rather than midnight, and Jumah's time is a
  // khutbah convention rather than a daily rounding habit. Fewer than two times, or no common step,
  // means no offer at all: the screen says nothing it cannot deliver.
  const srRoundingStep = (config) => {
    const typed = [];
    ORDER.forEach(({ key }) => {
      if (key === 'jumah') return;
      const cfg = config[key] || {};
      if (cfg.variant === ON_TIME) return;
      const at = toMinutes(cfg.variant === VARIES ? cfg.neverBefore : cfg.salaahTime);
      if (at) typed.push(at);
    });
    if (typed.length < 2) return null;
    return [15, 10, 5].find((step) => typed.every((m) => m % step === 0)) || null;
  };

  // Drift is a PUBLISHED value that has stopped being possible AND a draft that has not rescued it,
  // which is what makes the offer retire on its own: dragging the prayer back inside its window
  // ends it, and so does accepting. Only a FIXED rule can drift this way — an anchored prayer IS
  // its start, and a rounded one already follows it — and only an AZAAN fault is one a rounding can
  // fix; a jamaat spilling past the close needs a shorter delay, and rounding up would worsen it.
  const srDriftOffer = (rows, server) => {
    const row = rows.find((r) => (
      r.dayReady
      && (r.cfg || {}).variant === FIXED
      && r.fault && r.fault.field === 'azaan'
      && srFault(r.prayer, r.publishedResolved)
    ));
    if (!row) return null;
    const step = srRoundingStep(server);
    if (!step) return null;
    return {
      key: row.key,
      label: row.label,
      // The value the reader is LOOKING at, which is the draft's. It equals the published one in the
      // ordinary case, and naming a time that is not on the axis helps nobody when it does not.
      azaan: row.resolved.azaan,
      opens: row.prayer.opens,
      step,
      // The offer has to state its own consequence: "the next quarter-hour" means nothing until it
      // also says what that is today.
      today: nextMultiple(row.prayer.opens, step),
    };
  };

  // ══════════════════════════════════════════════════════════════════
  // The board scan — spec §11. Server-side OCR with an on-device fallback; both readers converge
  // on one shape, so everything below is identical whichever one read the photo.
  // ══════════════════════════════════════════════════════════════════

  // What the demo board prints. ONE column of times — which is the whole reason the sheet has to
  // ask what the column is. Chosen against today's windows so the receipt carries every outcome a
  // real board produces: readings that translate cleanly, one an LED misread put outside its own
  // window, prayers glare lost entirely, and Maghrib, which no clock time can be set for.
  const SR_BOARD = {
    full: { fajr: '05:35', zohar: '13:50', asr: '16:45', maghrib: '18:58', isha: '20:30', jumah: '13:30' },
    fivePrayer: { fajr: '05:30', zohar: '13:15', asr: '17:25', maghrib: '18:53', isha: '20:25' },
    // Zohar and Maghrib are the two a real board most often loses to glare; Fajr's leading digit
    // came back wrong, which is an ordinary misread rather than an edge case.
    partial: { fajr: '04:20', asr: '16:45', isha: '20:30', jumah: '13:30' },
  };

  // The reading in the two shapes every surface needs: the azaan in minutes from midnight, and the
  // time the board actually PRINTED. One source, so the amber dot on the axis, the pill on the
  // sheet and the value the walk lands can never disagree.
  //
  // A printed jamaat is the azaan plus the delay the masjid already keeps, so the delay is read off
  // the current rule rather than invented. An azaan column needs no arithmetic at all.
  const scanReading = (which, meaning, rowByKey) => {
    const printedBy = SR_BOARD[which];
    if (!printedBy) return null;
    const out = {};
    ORDER.forEach(({ key }) => {
      if (printedBy[key] == null) return;
      const row = rowByKey[key] || {};
      const resolved = row.resolved || {};
      const delay = resolved.delay == null ? IQAMA_MIN : resolved.delay;
      const printed = toMinutes(printedBy[key]);
      out[key] = {
        printed,
        iqama: delay,
        azaan: meaning === 'azaan' ? printed : printed - delay,
      };
    });
    return out;
  };

  // The receipt, one entry per prayer in day order — including the prayers the board did not show,
  // because silence about a prayer is what makes a reader distrust the four that did.
  //
  // One outcome per prayer, and the walk lands only `ok`. `bad` conflicts with today's window:
  // the same two bounds `srFault` enforces everywhere else, so the sheet cannot promise a value the
  // day would then refuse. `anchored` is this section's own outcome and has no equivalent on a
  // times-only editor: the reading is fine, but the prayer follows its own start and stores no clock
  // time, so there is nothing for a landing to write. It is named, with the place the decision
  // lives, rather than skipped in silence.
  const scanRows = (s, rows) => {
    if (!s.scanProposal) return [];
    const rowByKey = {};
    rows.forEach((r) => { rowByKey[r.key] = r; });
    const reading = scanReading(s.scanProposal, s.scanColumnMeaning, rowByKey);
    if (!reading) return [];
    return ORDER.map(({ key, label }) => {
      const read = reading[key];
      if (!read) return { key, label, kind: 'mut' };
      const row = rowByKey[key] || {};
      const prayer = row.prayer && row.prayer.opens != null ? row.prayer : null;
      const entry = {
        key, label, printed: read.printed, azaan: read.azaan, iqama: read.iqama,
      };
      if (!s.scanColumnMeaning) return Object.assign(entry, { kind: 'unlabelled' });
      // A rule restriction must not hide a real window conflict. Both the receipt and walk use
      // this outcome; the count cannot describe a different reason from the pill.
      const fault = srFault(prayer, { azaan: read.azaan, jamaat: read.azaan + read.iqama });
      if (fault) return Object.assign(entry, {
        kind: 'bad',
        note: s.scanColumnMeaning === 'jamaat' && prayer && read.azaan < prayer.opens
          ? `${label}: the saved ${read.iqama}-minute gap puts azaan at ${fmt(read.azaan)}, before the ${fmt(prayer.opens)} prayer start.`
          : fault.text.startsWith(label) ? fault.text : `${label}: ${fault.text}`,
      });
      if (row.resolved.azaan === read.azaan && row.resolved.jamaat === read.azaan + read.iqama) {
        return Object.assign(entry, { kind: 'same', note: 'Already set' });
      }
      if ((row.cfg || {}).variant === ON_TIME) {
        return Object.assign(entry, { kind: 'anchored', note: srRuleCopy(key, label, row.cfg).short });
      }
      return Object.assign(entry, { kind: 'ok' });
    });
  };

  const buildSrData = (state, handlers) => {
    const s = state;
    const h = handlers || {};
    const fixture = SR_SCENARIOS[s.scenario] || SR_SCENARIOS.published;
    // The baseline is whatever was published last: this session's publish if there was one,
    // otherwise the config the server sent.
    const server = canonConfig(s.serverConfig || fixture.config);
    const day = srDay();
    const dayReady = s.dayStatus === 'loaded';

    // The draft is the server config with the user's overrides on top. Both halves are canonical,
    // so `sameRule` compares intent and not string formatting.
    const draft = {};
    ORDER.forEach(({ key }) => { draft[key] = s.draft[key] ? canonRule(s.draft[key]) : server[key]; });

    const rows = ORDER.map(({ key, label }) => {
      const prayer = dayReady ? day[key] : null;
      const cfg = draft[key];
      const resolved = srResolve(cfg, prayer ? prayer.opens : null);
      const publishedResolved = srResolve(server[key], prayer ? prayer.opens : null);
      const fault = srFault(prayer, resolved);
      // What this prayer's controls may legally offer. Derived from the SAME two bounds `srFault`
      // enforces, so a picker cannot present a value the screen would then refuse — and so the
      // meridiem never needs its own control: the window already decides whether 5 o'clock is AM.
      const latest = prayer ? prayer.closes - JAMAAT_MIN : null;
      const currentDelay = resolved.delay == null ? IQAMA_MIN : resolved.delay;
      const bounds = prayer ? {
        // A floor earlier than the prayer's own start can never bind, and one so late the jamaat
        // spills past the close is refused — so neither is worth offering.
        azaanMin: prayer.opens,
        azaanMax: Math.max(prayer.opens, latest - currentDelay),
        // The delay is bounded by what is left of the window after the azaan.
        delayMax: Math.max(IQAMA_MIN, latest - (resolved.azaan == null ? prayer.opens : resolved.azaan)),
      } : null;
      return {
        key,
        label,
        bounds,
        cfg,
        published: server[key],
        prayer: prayer || (day[key] ? { key, label, ends: day[key].ends } : { key, label }),
        dayReady: !!prayer,
        resolved,
        publishedResolved,
        fault,
        malformed: resolved.malformed,
        changed: !sameRule(cfg, server[key]),
        copy: srRuleCopy(key, label, cfg),
        choices: srChoices(key),
      };
    });

    const changed = rows.filter((r) => r.changed);
    const blocked = rows.filter((r) => r.fault || r.malformed);
    const needsFirstPublish = (s.serverStatus || fixture.status) === 'UNPUBLISHED';

    const openRow = rows.find((r) => r.key === s.prayer) || null;
    const byRow = {};
    rows.forEach((r) => { byRow[r.key] = r; });

    // ── What the timeline needs. `cfgOf`/`pubOf` hand the axis a resolved {azaan, iqama} pair for a
    //    prayer, so the day always draws the RULE's answer for today rather than a stored time. The
    //    published pair is what the row's `WAS` overline and its green mark compare against. ──
    const pair = (row, which) => {
      const r = which === 'published' ? row.publishedResolved : row.resolved;
      if (!r || r.azaan == null) return { azaan: (row.prayer && row.prayer.opens) || 0, iqama: r ? (r.delay || IQAMA_MIN) : IQAMA_MIN };
      return { azaan: r.azaan, iqama: r.delay == null ? IQAMA_MIN : r.delay };
    };
    const cfgOf = (p) => pair(byRow[p.key] || {}, 'draft');
    const pubOf = (p) => pair(byRow[p.key] || {}, 'published');

    // The offer, and the prayer it speaks for. The blocked card below must not restate that same
    // prayer — one fault, one statement, and the actionable one wins.
    const driftOffer = srDriftOffer(rows, server);

    // The board reading, resolved against the rules the draft currently holds. Computed here rather
    // than in the screen so the receipt and the walk read one array.
    const scan = scanRows(s, rows);
    const scanUsable = scan.filter((r) => r.kind === 'ok');
    const scanFaulted = scan.filter((r) => r.kind === 'bad');
    const scanAnchored = scan.filter((r) => r.kind === 'anchored');
    const scanSame = scan.filter((r) => r.kind === 'same');
    const scanMissed = scan.filter((r) => r.kind === 'mut');
    // Zeroes stay silent: `seen by 0` and `0 not read` are the same lie.
    const scanCounts = [
      scan.length ? `${scan.length - scanMissed.length} read` : null,
      scan.some((r) => r.kind === 'unlabelled') ? 'choose a column' : null,
      scanUsable.length ? `${scanUsable.length} usable` : null,
      scanFaulted.length ? `${scanFaulted.length} outside ${scanFaulted.length === 1 ? 'its' : 'their'} window` : null,
      scanAnchored.length ? `${scanAnchored.length} blocked by timing rules` : null,
      scanSame.length ? `${scanSame.length} already set` : null,
      scanMissed.length ? `${scanMissed.length} not read` : null,
    ].filter(Boolean).join(' · ');

    return {
      route: s.route,
      status: s.status,
      dayStatus: s.dayStatus,
      origin: fixture.origin,
      needsFirstPublish,
      masjid: 'Masjid-e-Bilal',
      rows,
      changedCount: changed.length,
      blocked,
      driftOffer,
      row: openRow,
      snack: s.snack,
      focusPrayer: s.focusPrayer,

      // ── timeline ──
      // The five windows of the day, and Jumah on its own axis: it is weekly and replaces Zohar,
      // so it can never sit on an axis showing today.
      timelinePrayers: dayReady ? (window.SstPrayerWindows || []) : [],
      timelineJumah: dayReady ? (window.SstJumahWindow || null) : null,
      cfgOf,
      pubOf,
      dragFeel: (key) => srDragFeel((byRow[key] || {}).cfg),
      // ── board scan ──
      // The stage, the receipt and the walk's queue all come from ONE computation, so the sheet
      // cannot promise a value the walk will not land. The queue is the `ok` entries in day order;
      // a refused or unread prayer dies with the sheet that named it.
      scanStage: s.scanStage || null,
      scanColumnMeaning: s.scanColumnMeaning || null,
      scanPending: !!s.scanProposal,
      scanRows: scan,
      scanUsable: scanUsable.length,
      scanLandings: scanUsable,
      scanCounts: scanCounts,
      // What the axis draws behind the sheet: the reading's place ON the day. The big value on a
      // card stays the CURRENT time — a proposal may annotate it, never replace it.
      scanProposal: scan.length
        ? scan.reduce((acc, r) => {
          if (r.kind === 'mut' || r.kind === 'unlabelled') return acc;
          acc[r.key] = { azaan: r.azaan, iqama: r.iqama, fault: r.kind === 'bad' ? r.note : null };
          return acc;
        }, {})
        : null,

      // ── publish ──
      saving: !!s.saving,
      justPublished: !!s.justPublished,
      confirmPublish: !!s.confirmPublish,
      historyOpen: !!s.historyOpen,
      guideSeen: !!s.guideSeen,
      dirty: changed.length > 0,
      reach: SR_REACH,
      reachText: srReach(SR_REACH),
      history: (s.historyExtra || []).concat(SR_HISTORY),
      // ── handlers ──
      onBack: h.onBack,
      onOpenPrayer: h.onOpenPrayer,
      onPickVariant: h.onPickVariant,
      onPickInterval: h.onPickInterval,
      onSetEarliest: h.onSetEarliest,
      onSetFixed: h.onSetFixed,
      onSetIqama: h.onSetIqama,
      onRestore: h.onRestore,
      onRetry: h.onRetry,
      onRefresh: h.onRefresh,
      onCloseSnack: h.onCloseSnack,
      onFocused: h.onFocused,
      onOpenRules: h.onOpenRules,
      onAdoptRounding: h.onAdoptRounding,
      onOpenScan: h.onOpenScan,
      onCloseScan: h.onCloseScan,
      onScanCapture: h.onScanCapture,
      onScanRetry: h.onScanRetry,
      onScanMeaning: h.onScanMeaning,
      onScanConsumed: h.onScanConsumed,
      onDiscardScan: h.onDiscardScan,
      onDragCommit: h.onDragCommit,
      onDragSettle: h.onDragSettle,
      onPublish: h.onPublish,
      onConfirmPublish: h.onConfirmPublish,
      onCancelPublish: h.onCancelPublish,
      onDone: h.onDone,
      onOpenHistory: h.onOpenHistory,
      onCloseHistory: h.onCloseHistory,
    };
  };

  // ══════════════════════════════════════════════════════════════════
  // Draft edits. Every one of these is the SAME path the timeline's drag writes through, which
  // is why a rule-page edit and a dragged edit are indistinguishable afterwards (spec §9.3).
  // ══════════════════════════════════════════════════════════════════

  // Choosing a rule keeps everything the new rule can still own and invents nothing it cannot.
  // A newly chosen round-up rule floors at 00:00 — initialising it to today's answer would
  // silently create a seasonal floor nobody asked for (spec §8.4).
  const srSetVariant = (cfg, variant, ctx) => {
    const delay = cfg && typeof cfg.iqamaDelay === 'number' ? cfg.iqamaDelay : IQAMA_MIN;
    if (variant === ON_TIME) return { variant: ON_TIME, iqamaDelay: delay };
    if (variant === VARIES) {
      return {
        variant: VARIES,
        neverBefore: '00:00',
        salaahTimeVariation: cfg && cfg.salaahTimeVariation ? cfg.salaahTimeVariation : STEP_TO_WIRE[15],
        iqamaDelay: delay,
      };
    }
    // A fixed rule needs a clock time. The honest starting point is what this prayer is called at
    // today under its current rule; falling back to the calculated start when the day is unknown.
    const at = (ctx && ctx.azaan != null) ? ctx.azaan : (ctx && ctx.opens != null ? ctx.opens : 0);
    return { variant: FIXED, salaahTime: toHHMM(at), iqamaDelay: delay };
  };

  // The rule page writes ABSOLUTE values, not deltas: its controls are selects, so the user picks a
  // time rather than nudging one. It does NOT clamp into the prayer window (spec §11.2) — the
  // timeline clamps because the finger has nowhere else to go, but here a value is chosen by intent
  // and the screen answers with a named reason beside the control. Clamping silently would move a
  // committee's choice and never say so.
  const srSetFixed = (cfg, minutes) => Object.assign({}, cfg, { salaahTime: toHHMM(minutes) });

  const srSetEarliest = (cfg, minutes) => Object.assign({}, cfg, { neverBefore: toHHMM(minutes) });

  // There is no upper ceiling on the delay other than the window itself, and the window is reported
  // as a fault rather than enforced here. The five-minute floor IS enforced: a jamaat called four
  // minutes after the azaan is not a timing anyone means.
  const srSetIqama = (cfg, minutes) => (
    Object.assign({}, cfg, { iqamaDelay: Math.max(minutes, IQAMA_MIN) })
  );

  // Changing the interval re-aligns a floor the user has set, but leaves 00:00 alone: there is
  // nothing to align when the rounding is the whole rule.
  const srSetInterval = (cfg, step) => {
    const floor = toMinutes(cfg.neverBefore) || 0;
    return Object.assign({}, cfg, {
      salaahTimeVariation: STEP_TO_WIRE[step],
      neverBefore: floor === 0 ? '00:00' : toHHMM(Math.ceil(floor / step) * step),
    });
  };

  // ══════════════════════════════════════════════════════════════════
  // Rule-aware dragging on the timeline — spec §9.
  //
  // This is the whole difference between this section and the shipped console. The timeline hands
  // back a raw minute under the finger; what that minute MEANS depends on the prayer's rule, so
  // the commit translates it into a parameter of that rule instead of flattening every prayer to a
  // fixed clock time. The same position can be four different intentions (fixed at 4:30, the next
  // quarter-hour, the next ten minutes, or a 4:30 floor), and no single gesture can tell them
  // apart — so the configured rule resolves it once and the drag only edits its parameter.
  // ══════════════════════════════════════════════════════════════════

  /**
   * Translate one drag commit into a rule.
   * `value` is `{ azaan, iqama }` in minutes as the timeline computed it — the azaan under the
   * finger, and the delay it already shrank to hold the jamaat still.
   * Returns `{ rule, refusal, anchored }`. `rule` is null when nothing may change.
   */
  const srCommitDrag = (cfg, prayer, value, field) => {
    if (!cfg || !prayer) return { rule: null, refusal: null };
    const latest = prayer.closes - JAMAAT_MIN;

    if (field === 'iqama') {
      // The delay is a delay under every rule, so this one commit is rule-independent. It must never
      // collapse a seasonal azaan into a clock time — which is what writing `salaahTime` would do.
      return { rule: Object.assign({}, cfg, { iqamaDelay: Math.max(value.iqama, IQAMA_MIN) }), refusal: null };
    }

    /**
     * Land an azaan and keep the delay with it.
     *
     * The card is the LENGTH of the prayer, so dragging its body moves the whole prayer and the
     * jamaat travels with the azaan (decided 2026-08-17, reversing the 2026-08-07 hold-the-jamaat
     * rule). Absorbing the move into the delay instead meant a 20-minute iqama silently became a
     * 5-minute one after a drag — the committee moved when the call goes out and Paigham quietly
     * rewrote how long the congregation has to arrive. Moving the azaan is a decision about the
     * whole prayer; the delay is a separate decision with its own handle.
     *
     * The delay is only ever SHORTENED, and only by the window: pinned against the close there is
     * no room left for the full gap, and a jamaat outside its own window cannot be published.
     */
    const land = (azaan, keep) => {
      const ceiling = Math.max(prayer.opens, latest - IQAMA_MIN);
      const at = Math.min(Math.max(azaan, prayer.opens), ceiling);
      return { at, delay: Math.max(Math.min(keep, latest - at), IQAMA_MIN) };
    };
    const keep = cfg.iqamaDelay || IQAMA_MIN;

    if (cfg.variant === ON_TIME) {
      // ANCHORED. The rule stores no clock time, so there is nothing for this gesture to write —
      // and silently converting the prayer to FIXED (which is what the shipped console does) turns
      // a nudge into a decision the committee never made. The card does not move; the screen says
      // where the decision lives.
      return {
        rule: null,
        anchored: true,
        refusal: `${prayer.label} follows ${prayer.key === 'maghrib' ? 'sunset' : 'its start'}. Change how it updates to set a time.`,
      };
    }

    if (cfg.variant === VARIES) {
      const step = variationStep(cfg.salaahTimeVariation);
      if (!step) return { rule: null, refusal: null };
      const natural = nextMultiple(prayer.opens, step);
      // The next slot the grid allows at or after the finger. The card therefore JUMPS between
      // legal positions during the gesture rather than sliding and snapping on release — a value
      // that moves continuously is promising a minute the rule cannot store.
      let target = Math.ceil(value.azaan / step) * step;
      let refusal = null;
      // Clamp to the window FIRST, then to the nearest step that still fits inside it.
      if (target + keep > latest) {
        const fits = Math.floor((latest - IQAMA_MIN) / step) * step;
        if (target > fits) {
          target = fits;
          refusal = `Jamaat must finish before ${prayer.ends}, so it cannot start after ${fmt(latest)}.`;
        }
      }
      // At or below what the rounding already gives there is no floor to keep: writing one would
      // bind wrongly next season for no benefit today.
      const landing = land(target <= natural ? natural : target, keep);
      const floor = target <= natural ? '00:00' : toHHMM(landing.at);
      return { rule: Object.assign({}, cfg, { neverBefore: floor, iqamaDelay: landing.delay }), refusal };
    }

    // FIXED moves minute by minute, because that is the only rule whose stored value IS a minute.
    const landing = land(value.azaan, keep);
    let refusal = null;
    if (value.azaan < prayer.opens) refusal = `${prayer.label} does not begin until ${fmt(prayer.opens)}.`;
    else if (value.azaan > landing.at) refusal = `Jamaat must finish before ${prayer.ends}, so it cannot start after ${fmt(latest)}.`;
    return { rule: Object.assign({}, cfg, { salaahTime: toHHMM(landing.at), iqamaDelay: landing.delay }), refusal };
  };

  // How a prayer's card will BEHAVE under the finger, in words. The rules page can describe the
  // rule; only the timeline can tell you what dragging it does, and the three answers differ.
  const srDragFeel = (cfg) => {
    if (!cfg) return null;
    if (cfg.variant === ON_TIME) return { icon: 'wb_sunny', text: 'Anchored to the start — drag the iqama chip only' };

    if (cfg.variant === VARIES) {
      const step = variationStep(cfg.salaahTimeVariation);
      return { icon: 'update', text: step ? `Jumps in ${step}-minute steps` : 'Rounding interval not set' };
    }
    return { icon: 'keep', text: 'Moves minute by minute' };
  };

  /**
   * What a publish leaves behind: the draft becomes the baseline, and the change is recorded in the
   * publisher's name. Built here rather than in the page so the sentence a history row shows uses
   * the same resolution the axis does — a row claiming "5:00 AM → 5:15 AM" has to mean the minutes
   * the reader actually saw move.
   */
  const srPublish = (data, by) => {
    const config = {};
    data.rows.forEach((row) => { config[row.key] = row.cfg; });
    const changes = data.rows.filter((r) => r.changed).map((r) => {
      const from = r.publishedResolved && r.publishedResolved.azaan != null ? fmt(r.publishedResolved.azaan) : null;
      const to = r.resolved && r.resolved.azaan != null ? fmt(r.resolved.azaan) : null;
      // A rule can change without today's answer changing — a new rounding interval that happens to
      // land on the same minute. The record has to say the RULE changed, not print "5:00 → 5:00".
      if (from && to && from !== to) return `${r.label} ${from} → ${to}`;
      return `${r.label} · ${r.copy.title.toLowerCase()}`;
    });
    return {
      config,
      entry: {
        id: `live-${data.rows.length}-${changes.join('|').length}`,
        by: by || 'You',
        role: 'Committee',
        when: 'just now',
        changes: changes.length ? changes : ['Published the masjid’s timing setup'],
      },
    };
  };

  // ── The published record. Timings are public, so the record IS the safeguard. ──
  const SR_HISTORY = [
    { id: 'h1', by: 'Ayaan Khan', role: 'Secretary', when: '12 days ago', changes: ['Isha 8:00 PM → 8:15 PM'] },
    { id: 'h2', by: 'Abdul Rahman', role: 'Musalli', when: '26 Jun 2026', changes: ['Fajr now rounds up to the next quarter-hour'] },
    { id: 'h3', by: 'Imran Sheikh', role: 'Chairman', when: '2 Mar 2026', changes: ['Zohar 1:15 PM → 1:30 PM', 'Jumah 1:20 PM'] },
  ];

  const SR_REACH = 1284;

  // Indian digit grouping, the same as every other reach count in the app.
  const srReach = (n) => Number(n).toLocaleString('en-IN');

  // ══════════════════════════════════════════════════════════════════
  // Storyboard frames. Every state in spec §14 plus the awkward server configs in §14.3.
  // ══════════════════════════════════════════════════════════════════

  const SR_GROUPS = [
    { id: 'timings', num: '1', icon: 'schedule', title: 'The day' },
    { id: 'drag', num: '2', icon: 'unfold_more', title: 'What the rule does to the drag' },
    { id: 'scan', num: '3', icon: 'filter_center_focus', title: 'Reading the board' },
    { id: 'publish', num: '4', icon: 'campaign', title: 'Publishing' },
    { id: 'summary', num: '5', icon: 'info', title: 'The rules behind the day' },
    { id: 'detail', num: '6', icon: 'update', title: 'One prayer’s rule' },
    { id: 'edge', num: '7', icon: 'error', title: 'Configs and failures the app must survive' },
  ];

  // Draft fixtures used by the detail frames. Named so a frame reads as an intention.
  const D = {
    fajrOnTime: { fajr: { variant: ON_TIME, iqamaDelay: 20 } },
    fajrFixed: { fajr: { variant: FIXED, salaahTime: '05:00', iqamaDelay: 20 } },
    fajrTen: { fajr: { variant: VARIES, neverBefore: '00:00', salaahTimeVariation: STEP_TO_WIRE[10], iqamaDelay: 20 } },
    // Two rules changed against the published baseline — the summary's dirty state.
    twoChanged: {
      fajr: { variant: FIXED, salaahTime: '05:00', iqamaDelay: 20 },
      isha: { variant: VARIES, neverBefore: '20:15', salaahTimeVariation: STEP_TO_WIRE[15], iqamaDelay: 15 },
    },
    // A fixed time BEFORE the prayer exists — the inline invalid state.
    fajrTooEarly: { fajr: { variant: FIXED, salaahTime: '04:40', iqamaDelay: 20 } },
    // A floor so late the jamaat can no longer finish inside the window.
    fajrLateFloor: { fajr: { variant: VARIES, neverBefore: '06:00', salaahTimeVariation: STEP_TO_WIRE[15], iqamaDelay: 20 } },
  };

  // Drafts that demonstrate the drag itself. Each is the state a gesture LEAVES BEHIND under one
  // rule, which is the only way a static frame can show that the three rules behave differently.
  const DRAG = {
    // FIXED moved by one minute — the only rule whose stored value is a minute.
    fixedMinute: { zohar: { variant: FIXED, salaahTime: '13:31', iqamaDelay: 15 } },
    // A rounded prayer dragged past its natural rounding: the floor now binds and the azaan sits on
    // the next grid slot, NOT on the minute the finger was on.
    variesSnapped: {
      asr: { variant: VARIES, neverBefore: '16:30', salaahTimeVariation: STEP_TO_WIRE[15], iqamaDelay: 15 },
    },
    // The same prayer dragged back to (or below) its natural rounding: the floor is dropped, because
    // a floor pinned to today's answer would bind wrongly next season.
    variesHome: {
      asr: { variant: VARIES, neverBefore: '00:00', salaahTimeVariation: STEP_TO_WIRE[15], iqamaDelay: 25 },
    },
    // Only the iqama chip was dragged: the azaan's seasonal rule is untouched.
    iqamaOnly: {
      fajr: { variant: VARIES, neverBefore: '00:00', salaahTimeVariation: STEP_TO_WIRE[15], iqamaDelay: 30 },
    },
  };

  // What the companion walk LEAVES BEHIND, so the frame after it is the real thing rather than a
  // drawing of it. Every value here came out of `srCommitDrag` — the same writer a drag uses — for
  // the Jamaat reading of SR_BOARD.full against today's windows, which is why none of them is the
  // minute the board printed: Fajr, Asr and Isha snap up to their own 15-minute grid, Zohar is the
  // one rule that stores a minute, and Maghrib is absent because it follows sunset and no landing
  // can write a clock time to it.
  const SCAN = {
    landed: {
      fajr: { variant: VARIES, neverBefore: '05:15', salaahTimeVariation: STEP_TO_WIRE[15], iqamaDelay: 20 },
      zohar: { variant: FIXED, salaahTime: '13:35', iqamaDelay: 15 },
      asr: { variant: VARIES, neverBefore: '16:30', salaahTimeVariation: STEP_TO_WIRE[15], iqamaDelay: 15 },
      isha: { variant: VARIES, neverBefore: '20:15', salaahTimeVariation: STEP_TO_WIRE[15], iqamaDelay: 15 },
      jumah: { variant: FIXED, salaahTime: '13:30', iqamaDelay: 5 },
    },
  };

  // What ACCEPTING the drift offer leaves behind — written by the same two writers the offer's own
  // action calls, so the frame is the real thing rather than a drawing of it. The floor is `00:00`
  // because there is no floor: the rounding is the whole rule, and one pinned to today's answer
  // would bind wrongly next season. Fajr's 20-minute delay is carried across untouched — adopting a
  // rounding is a decision about when the azaan is called, never about how long the congregation
  // has to arrive.
  const DRIFT = {
    adopted: {
      fajr: { variant: VARIES, neverBefore: '00:00', salaahTimeVariation: STEP_TO_WIRE[15], iqamaDelay: 20 },
    },
  };

  // The board is a DEMO SCRIPT, not a catalogue. Every state the app can be in is still reachable
  // on the live device — the logic below decides them, not this table — but 42 thumbnails asked a
  // reader to find the story instead of being told it. These are the frames that carry it, in the
  // order someone would walk through them.
  const SR_FRAMES = [
    // ── 1 · The day ──
    { group: 'timings', name: 'Loading', state: { status: 'loading' } },
    { group: 'timings', name: 'Today’s timings', state: {} },
    { group: 'timings', name: 'Never published yet', state: { scenario: 'sourced' } },
    { group: 'timings', name: 'A fixed timing has drifted', state: { scenario: 'drifted' } },
    { group: 'timings', name: 'Drift · rounding adopted', state: { scenario: 'drifted', draft: DRIFT.adopted, guideSeen: true } },
    { group: 'timings', name: 'The change record', state: { historyOpen: true } },

    // ── 2 · What the rule does to the drag ──
    { group: 'drag', name: 'Fixed · moved one minute', state: { draft: DRAG.fixedMinute, guideSeen: true } },
    { group: 'drag', name: 'Rounded · snapped a whole step', state: { draft: DRAG.variesSnapped, guideSeen: true } },
    { group: 'drag', name: 'At sunset · anchored, refused', state: { guideSeen: true, snack: { message: 'Maghrib follows sunset. Change how it updates to set a time.', tone: 'error' } } },

    // ── 3 · Reading the board ──
    // The scan is an input accelerator, never an invisible mutation: capture → recognition →
    // receipt → an explicit Add that WALKS each value onto its own row. Every landing goes through
    // the same commit a drag uses, so a landed timing and a dragged one are indistinguishable
    // afterwards — and on this section that means the reading is translated by the prayer's own
    // rule, not stamped on as a clock time.
    { group: 'scan', name: 'The board in frame', state: { scanStage: 'camera', guideSeen: true } },
    { group: 'scan', name: 'Reading the captured photo', state: { scanStage: 'reading', guideSeen: true } },
    { group: 'scan', name: 'The board didn’t read', state: { scanStage: 'failed', guideSeen: true } },
    { group: 'scan', name: 'Read · which column is it?', state: { scanProposal: 'full', guideSeen: true } },
    { group: 'scan', name: 'Read · Jamaat column', state: { scanProposal: 'full', scanColumnMeaning: 'jamaat', guideSeen: true } },
    { group: 'scan', name: 'Read · Azaan column', state: { scanProposal: 'full', scanColumnMeaning: 'azaan', guideSeen: true } },
    { group: 'scan', name: 'Five read · rules need attention', state: { scenario: 'allAtStart', scanProposal: 'fivePrayer', scanColumnMeaning: 'jamaat', guideSeen: true } },
    // An LED misread is an ordinary outcome, not an edge case: named on the pill, never landed.
    { group: 'scan', name: 'Misread and glare-lost', state: { scanProposal: 'partial', scanColumnMeaning: 'jamaat', guideSeen: true } },
    { group: 'scan', name: 'Landed · publish when ready', state: { draft: SCAN.landed, guideSeen: true } },

    // ── 4 · Publishing ──
    { group: 'publish', name: 'Confirm · naming the reach', state: { draft: D.twoChanged, guideSeen: true, confirmPublish: true } },
    { group: 'publish', name: 'Published', state: { justPublished: true } },
    { group: 'publish', name: 'Refused · a prayer is impossible', state: { scenario: 'drifted', guideSeen: true, snack: { message: 'Fajr does not begin until 4:52 AM today, so the azaan cannot be called at 4:45 AM.', tone: 'error' } } },

    // ── 4 · The rules behind the day ──
    { group: 'summary', name: 'How timings update', state: { route: 'summary' } },
    { group: 'summary', name: 'Two rules changed', state: { route: 'summary', draft: D.twoChanged } },

    // ── 5 · One prayer's rule ──
    { group: 'detail', name: 'Rounds up', state: { route: 'detail', prayer: 'fajr' } },
    { group: 'detail', name: 'At prayer start', state: { route: 'detail', prayer: 'fajr', draft: D.fajrOnTime } },
    { group: 'detail', name: 'Same time every day', state: { route: 'detail', prayer: 'fajr', draft: D.fajrFixed } },
    { group: 'detail', name: 'Changed · restore offered', state: { route: 'detail', prayer: 'zohar', draft: DRAG.fixedMinute } },
    { group: 'detail', name: 'Refused · before the prayer', state: { route: 'detail', prayer: 'fajr', draft: D.fajrTooEarly } },

    // ── 6 · Configs the app must survive ──
    { group: 'edge', name: 'Earliest azaan binds today', state: { route: 'detail', prayer: 'asr', scenario: 'floorWins' } },
    { group: 'edge', name: 'Maghrib fixed · preserved', state: { route: 'detail', prayer: 'maghrib', scenario: 'fixedMaghrib' } },
    { group: 'edge', name: 'Incomplete rule · publish blocked', state: { route: 'summary', scenario: 'malformed' } },
    { group: 'edge', name: 'Incomplete rule · asked, not guessed', state: { route: 'detail', prayer: 'isha', scenario: 'malformed' } },
    { group: 'edge', name: 'Calculated day unavailable', state: { dayStatus: 'error' } },
    { group: 'edge', name: 'Load failed', state: { status: 'error' } },
    { group: 'edge', name: 'Someone else published', state: { status: 'conflict' } },
  ];

  // ── Frame ⇄ device matching. The signature is every key that changes which STATE the screen is
  //    in; `snack` and `focusPrayer` are transient and deliberately excluded. ──
  // `snack` IS part of the signature here, unlike the console: a refusal is the whole point of
  // several frames — an anchored drag and a blocked publish differ from their clean states by
  // nothing except the sentence they answer with.
  const signature = (s) => JSON.stringify({
    route: s.route, prayer: s.prayer, from: s.from, scenario: s.scenario,
    status: s.status, dayStatus: s.dayStatus, draft: canonConfig(s.draft),
    saving: !!s.saving, justPublished: !!s.justPublished,
    confirmPublish: !!s.confirmPublish, historyOpen: !!s.historyOpen,
    guideSeen: !!s.guideSeen, snack: s.snack ? s.snack.message : null,
    scanStage: s.scanStage || null, scanProposal: s.scanProposal || null,
    scanColumnMeaning: s.scanColumnMeaning || null,
    serverConfig: canonConfig(s.serverConfig || {}), serverStatus: s.serverStatus || null,
  });
  const activeFrameIndex = (state) => SR_FRAMES.findIndex((frame) => signature(state) === signature(frameState(frame)));

  Object.assign(window, {
    SR_DEFAULT_STATE,
    SR_FRAMES,
    SR_GROUPS,
    SR_SCENARIOS,
    SR_RECOMMENDED,
    SR_IQAMA_MIN: IQAMA_MIN,
    SR_JAMAAT_MIN: JAMAAT_MIN,
    SR_VARIANTS: { ON_TIME, FIXED, VARIES },
    buildSrData,
    srApplyPatch: applyPatch,
    srFrameState: frameState,
    srActiveFrameIndex: activeFrameIndex,
    srSetVariant,
    srSetInterval,
    srSetFixed,
    srSetEarliest,
    srSetIqama,
    srCommitDrag,
    srDragFeel,
    srPublish,
    srReach,
    SR_HISTORY,
    SR_REACH,
    srResolve,
    srFault,
    srVariationStep: variationStep,
    srFormat: fmt,
    srFormatShort: fmtShort,
    srStepLabel: stepLabel,
    srToMinutes: toMinutes,
    srToHHMM: toHHMM,
  });
}());

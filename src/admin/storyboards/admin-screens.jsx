// Admin Console — shared screen components for the platform admin board.
//
// Used by BOTH the static storyboards (./admin-board.jsx) and the live device
// (../Admin Console.dc.html). Every screen takes ONE `data` object assembled by
// `buildAdminData` (./admin-state.js) so the dc x-import binds a single value, and every
// handler is optional (the static frames pass none).
//
// Construction comes from the kit: `.app-bar` + `.ib` + `.ab-title`, `.tbar`/`.tab`, `.list-group`
// + `.list-item`, `.badge`, `.surf`, `.summary-hero`, `.media-identity-hero`, `.media-tile`,
// `.deck`/`.deck-tile`, `.manage-entry-stats`, `.docked-action` + `.status-capsule`, `.snack`,
// `Dialog` / `EmptyState` / `Loader` / `SearchBar` from _theme/components.jsx. This module adds
// only the feature's own marks (see ./admin.css): the identity header, the signups card and its
// bars, the photo pair and the two-up docked footer.
//
// Source of truth for behaviour is the server (see the header of ./admin-state.js); the Compose
// admin app (paigham-admin) follows this board.

(function () {
  const FONT_B = 'var(--font-body)';
  const FONT_T = 'var(--font-title)';
  const APPBAR_H = 114; // 54px status inset + 48px control row + 12px bottom
  const APPBAR_H_TABS = APPBAR_H + 56; // + pinned .tbar row

  // ══════════════════════════════════════════════════════════════════════
  // Screen primitives (Components layer only — no raw primitives, no literal hex)
  // ══════════════════════════════════════════════════════════════════════

  function Screen({ children, className = '' }) {
    return (
      <div className={`adm-shell ${className}`} style={{
        width: '100%', height: '100%', boxSizing: 'border-box', position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        background: 'var(--color-surface-primary)', fontFamily: FONT_B, color: 'var(--color-info-primary)',
      }}>
        {children}
      </div>
    );
  }

  // The DS `.app-bar`: transparent, floating, progressive blur. A tab row is PINNED inside it.
  function AppBar({ title, subtitle, onBack, trailing, tabs }) {
    return (
      <div className="app-bar" style={{
        flexDirection: 'column', alignItems: 'stretch', gap: 0,
        height: tabs ? APPBAR_H_TABS : APPBAR_H, padding: '54px 16px 12px', boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 48 }}>
          <button className="ib ib-tonal" type="button" onClick={onBack} aria-label="Back">
            <span className="mi" data-i="arrow_back"></span>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ab-title" style={{ fontSize: 22, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
            {subtitle ? (
              <div style={{ fontSize: 12, marginTop: 3, color: 'var(--color-info-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div>
            ) : null}
          </div>
          {trailing || <div style={{ width: 48, flexShrink: 0 }} />}
        </div>
        {tabs ? <div style={{ marginTop: 12 }}>{tabs}</div> : null}
      </div>
    );
  }

  function Tabs({ items, onPick }) {
    return (
      <div className="tbar" role="tablist">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.active}
            className={`tab ${item.active ? 'active' : ''}`}
            style={{ border: 0, background: item.active ? undefined : 'transparent' }}
            onClick={() => onPick && onPick(item.id)}
          >{item.label}</button>
        ))}
      </div>
    );
  }

  // Scrollable body. `top` is the app bar it scrolls under; `bottomInset` clears the home
  // indicator or a docked footer.
  function Body({ children, top = APPBAR_H, bottomInset = 44, style = {} }) {
    return (
      <div className="adm-body" style={{
        flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain',
        padding: `${top + 6}px 16px ${bottomInset}px`, boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: 12, ...style,
      }}>
        {children}
      </div>
    );
  }

  function Loading({ label }) {
    const { Loader } = window;
    return Loader ? <Loader label={label} /> : null;
  }

  function ErrorState({ title, copy, onRetry }) {
    const { EmptyState } = window;
    if (!EmptyState) return null;
    return <EmptyState tone="error" icon="error" title={title} description={copy} action={onRetry ? { text: 'Try again', onClick: onRetry } : undefined} />;
  }

  function Empty({ icon, title, copy }) {
    const { EmptyState } = window;
    return EmptyState ? <EmptyState icon={icon} title={title} description={copy} /> : null;
  }

  function Avatar({ text, size = 40, accent }) {
    return (
      <span className={`avatar ${accent ? 'accent' : ''}`} style={{ '--tile': `${size}px` }} aria-hidden="true">
        {(text || '?').charAt(0).toUpperCase()}
      </span>
    );
  }

  function SectionLabel({ children, hint }) {
    return (
      <div className="adm-section-label">
        <span className="eyebrow">{children}</span>
        {hint ? <small>{hint}</small> : null}
      </div>
    );
  }

  function Skeleton({ w, h, r = 'var(--radius-sm)', style = {} }) {
    return <span className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden="true"></span>;
  }

  // Two-up docked footer. Progress is the kit capsule ABOVE the bar, outside its measurement, and
  // the buttons go inert rather than wordless — the reader still sees what they committed to.
  function FooterPair({ primary, secondary, helper, working, workingLabel }) {
    return (
      <div className="docked-host">
        {working ? (
          <div className="docked-status status-capsule" role="status" aria-live="polite">
            <span className="status-capsule-ring" aria-hidden="true"></span>
            <b>{workingLabel}</b>
          </div>
        ) : null}
        <div className="docked-action bordered">
          {helper && !working ? <div className="docked-action-note">{helper}</div> : null}
          <div className="adm-two-up">
            <button className="btn btn-tonal lg" type="button" disabled={!!working} onClick={secondary.onClick}>{secondary.text}</button>
            <button className="btn btn-filled lg" type="button" disabled={!!working} onClick={primary.onClick}>{primary.text}</button>
          </div>
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
        <button className="snack-close" type="button" onClick={onClose} aria-label="Dismiss"><span className="mi" data-i="close"></span></button>
      </div>
    );
  }

  // ── Signups bars — one series, one hue. The current bucket takes the accent, the rest the
  // de-emphasised step of the same hue; direct labels only on the peak and the current bucket;
  // tapping a bar names it (the hover layer of a phone). Text wears text tokens, never the series.
  function Bars({ series = [], height = 96, compact = false, unit = '' }) {
    const [pick, setPick] = React.useState(null);
    const max = Math.max(1, ...series.map((p) => p.count));
    const peak = series.reduce((best, p, i) => (p.count > series[best].count ? i : best), 0);
    const last = series.length - 1;
    const dense = series.length > 12;
    return (
      <div className={`adm-bars ${compact ? 'compact' : ''} ${dense ? 'dense' : ''}`}>
        <div className="adm-bars-plot" style={{ height }}>
          {series.map((p, i) => {
            const labelled = !compact && (i === peak || i === last) && !dense;
            const picked = pick === i;
            return (
              <button
                key={i}
                type="button"
                className={`adm-bar-col ${i === last ? 'is-now' : ''} ${picked ? 'is-pick' : ''}`}
                aria-label={`${p.name || p.label}: ${p.count}`}
                onClick={() => setPick(picked ? null : i)}
              >
                {picked ? (
                  <span className="adm-bar-tip status-capsule"><b>{p.count}</b><span>{p.name || p.label}</span></span>
                ) : null}
                {labelled && !picked ? <span className="adm-bar-label">{p.count}</span> : null}
                <span className="adm-bar" style={{ height: `${Math.max(3, Math.round((p.count / max) * 100))}%` }}></span>
              </button>
            );
          })}
        </div>
        <div className="adm-bars-axis" aria-hidden="true">
          {series.map((p, i) => <span key={i}>{p.label}</span>)}
        </div>
        {unit ? <div className="adm-bars-unit">{unit}</div> : null}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // 1 · Hub
  // ══════════════════════════════════════════════════════════════════════

  function IdentityHeader({ me, onLogout }) {
    return (
      <header className="adm-head">
        <Avatar text={me.name} size={46} accent />
        <div className="adm-head-copy">
          <span className="eyebrow accent">Paigham admin</span>
          <div className="screen-title" style={{ fontSize: 22 }}>{me.name}</div>
          <div className="adm-head-role">
            <span className="mi" data-i="shield" aria-hidden="true"></span>
            {me.roleLabel}{me.role === 'ADMIN' ? ' · your paighams are moderated before they go live' : ' · approves for the whole platform'}
          </div>
        </div>
        <button className="ib ib-tonal md" type="button" onClick={onLogout} aria-label="Sign out">
          <span className="mi" data-i="logout"></span>
        </button>
      </header>
    );
  }

  function AttentionRow({ icon, title, copy, count, onClick }) {
    return (
      <button className="list-item actionable" type="button" onClick={onClick} style={{ padding: '12px 4px' }}>
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

  function GrowthCard({ signups, fmt, onOpen }) {
    const d8 = signups.windows.d8;
    const delta = signups.deltaToday;
    return (
      <button className="surf adm-growth" type="button" onClick={onOpen} aria-label="Signups, open the breakdown">
        <div className="adm-growth-head">
          <span className="eyebrow accent"><span className="mi" data-i="person_add" aria-hidden="true"></span>Signups</span>
          <span className="mi" data-i="chevron_right" aria-hidden="true"></span>
        </div>
        <div className="adm-growth-hero">
          <span className="adm-growth-value">{fmt.withCommas(signups.allTime)}</span>
          <span className="adm-growth-caption">people on Paigham since {signups.launched}</span>
        </div>
        <div className="manage-entry-stats">
          <span className="manage-entry-stat">
            <span className="manage-entry-stat-fig">
              <span className="manage-entry-stat-value">{signups.today}</span>
              {delta != null ? <span className={`manage-entry-stat-delta ${delta < 0 ? 'down' : ''}`}>{delta >= 0 ? '+' : ''}{delta}%</span> : null}
            </span>
            <span className="manage-entry-stat-label">Last 24h</span>
          </span>
          <span className="manage-entry-stat">
            <span className="manage-entry-stat-fig"><span className="manage-entry-stat-value">{signups.last8}</span></span>
            <span className="manage-entry-stat-label">8 days</span>
          </span>
          <span className="manage-entry-stat">
            <span className="manage-entry-stat-fig"><span className="manage-entry-stat-value">{fmt.withCommas(signups.last30)}</span></span>
            <span className="manage-entry-stat-label">30 days</span>
          </span>
        </div>
        <Bars series={d8.series} height={44} compact />
      </button>
    );
  }

  function DeckTile({ tone, value, icon, title, caption, badge, onClick, href }) {
    const Root = href ? 'a' : 'button';
    return (
      <Root className={`deck-tile ${tone}`} type={href ? undefined : 'button'} href={href} onClick={onClick}>
        {badge ? <span className="deck-tile-badge">{badge}</span> : null}
        {value ? <span className="deck-tile-value">{value}</span> : <span className="mi deck-tile-glyph" data-i={icon} aria-hidden="true"></span>}
        <strong>{title}</strong>
        {caption ? <small>{caption}</small> : null}
      </Root>
    );
  }

  function DecisionRow({ decision, onClick }) {
    const icon = decision.kind === 'rejected' ? 'close' : decision.kind === 'claim' ? 'verified' : 'check_circle';
    const color = decision.kind === 'rejected' ? 'var(--color-status-error)' : 'var(--color-action-primary)';
    return (
      <button className="list-item actionable" type="button" onClick={onClick} style={{ padding: '12px 4px' }}>
        <span className="mi list-item-leading" style={{ color }} data-i={icon} aria-hidden="true"></span>
        <span className="list-item-copy">
          <span className="list-item-title">{decision.title}</span>
          <span className="list-item-subtitle">{decision.copy}</span>
        </span>
        <span className="list-item-value">{decision.when}</span>
      </button>
    );
  }

  function HubSkeleton() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} aria-busy="true" aria-label="Loading the console">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 18 }}>
          <Skeleton w={46} h={46} r="var(--radius-circle)" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton w="30%" h={10} /><Skeleton w="62%" h={20} /><Skeleton w="48%" h={11} />
          </div>
        </div>
        <Skeleton w="100%" h={170} r="var(--radius-card)" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Skeleton w="100%" h={122} r="var(--radius-huge)" /><Skeleton w="100%" h={122} r="var(--radius-huge)" />
          <Skeleton w="100%" h={122} r="var(--radius-huge)" /><Skeleton w="100%" h={122} r="var(--radius-huge)" />
        </div>
      </div>
    );
  }

  function AdminHubScreen({ data = {} }) {
    const { me = {}, counts = { masjids: {} }, signups, decisions = [], fmt, hubStatus, quiet } = data;
    const pendingLeads = counts.pendingLeads || 0;
    const pendingPosts = counts.pendingPosts || 0;
    const masjids = counts.masjids || {};
    // The hidden pre-load import renders with no data; there is nothing to draw yet.
    if (!signups || !fmt) return <Screen />;

    if (hubStatus === 'error') {
      return (
        <Screen>
          <Body top={40}>
            <ErrorState title="Couldn’t load the console" copy="Nothing was changed. Check your connection and try again." onRetry={data.onRetry} />
          </Body>
        </Screen>
      );
    }

    return (
      <Screen className="adm-hub">
        <Body top={48} bottomInset={36} style={{ gap: 0 }}>
          {hubStatus === 'loading' ? <HubSkeleton /> : (
            <>
              <IdentityHeader me={me} onLogout={data.onLogout} />

              {pendingLeads || pendingPosts ? (
                <div className="list-group attention" style={{ padding: '0 12px' }}>
                  {pendingLeads ? (
                    <AttentionRow icon="fact_check" title={`${pendingLeads} masjid ${pendingLeads === 1 ? 'request' : 'requests'} to review`} copy="Registrations and claims waiting on a decision" count={pendingLeads} onClick={() => data.onOpen && data.onOpen('approvals')} />
                  ) : null}
                  {pendingPosts ? (
                    <AttentionRow icon="campaign" title={`${pendingPosts} ${pendingPosts === 1 ? 'paigham' : 'paighams'} waiting to go live`} copy="Sent by committees, held for a moderator" count={pendingPosts} onClick={() => data.onOpen && data.onOpen('moderation')} />
                  ) : null}
                </div>
              ) : (
                <div className="adm-quiet">
                  <span className="mi" data-i="check_circle" aria-hidden="true"></span>
                  Nothing is waiting on you right now.
                </div>
              )}

              <section className="adm-section">
                <GrowthCard signups={signups} fmt={fmt} onOpen={() => data.onOpen && data.onOpen('signups')} />
              </section>

              <section className="adm-section">
                <div className="adm-section-head"><strong>Operations</strong><small>Run the platform</small></div>
                <div className="deck">
                  <DeckTile
                    tone="jade"
                    value={pendingLeads ? String(pendingLeads) : null}
                    icon="fact_check"
                    title="Approvals"
                    caption={pendingLeads ? 'masjid requests waiting for a decision' : 'Queue is clear · see past decisions'}
                    onClick={() => data.onOpen && data.onOpen('approvals')}
                  />
                  <DeckTile
                    tone="teal"
                    value={pendingPosts ? String(pendingPosts) : null}
                    icon="campaign"
                    title="Paighams"
                    caption={pendingPosts ? 'held for a moderator' : 'Nothing held · everything sent is live'}
                    onClick={() => data.onOpen && data.onOpen('moderation')}
                  />
                  <DeckTile
                    tone="gold"
                    value={String(masjids.verified || 0)}
                    icon="mosque"
                    title="Masjids"
                    caption={`verified · ${masjids.sourcedUnclaimed || 0} sourced, not yet claimed`}
                    onClick={() => data.onOpen && data.onOpen('approvals', { leadFilter: 'V' })}
                  />
                  <DeckTile
                    tone="plain"
                    icon="schedule"
                    title="Salaah timings"
                    caption="Publish rules for any masjid"
                    href="../masjid-operations/Salaah Timing Rules.dc.html"
                  />
                </div>
              </section>

              <section className="adm-section">
                <div className="adm-section-head"><strong>Recent decisions</strong><small>{decisions.length} this week</small></div>
                <div className="list-group" style={{ marginTop: 0, padding: '0 12px' }}>
                  {decisions.map((d) => <DecisionRow key={d.id} decision={d} onClick={() => data.onOpenLead && data.onOpenLead(d.id)} />)}
                </div>
              </section>

              {quiet ? null : (
                <p className="adm-foot">Counts refresh when you open the console. Signups count paigham.users by creation time.</p>
              )}
            </>
          )}
        </Body>
      </Screen>
    );
  }

  // The INVALID_ADMIN destination: a valid sign-in whose number is not on the admin list.
  function AdminInvalidScreen({ data = {} }) {
    const me = data.me || {};
    return (
      <Screen>
        <Body top={40} style={{ justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 12px', gap: 12 }}>
            <div className="empty-state-icon" aria-hidden="true"><span className="mi" data-i="security"></span></div>
            <div style={{ fontFamily: FONT_T, fontSize: 22, marginTop: 6 }}>This console is for Paigham admins</div>
            <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--color-info-secondary)' }}>
              The number you signed in with isn’t on the admin list. If you were added just now, sign out and
              back in — the list is checked at sign-in, not while you are here.
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-info-tertiary)' }}>Signed in as {me.phone}</div>
            <button className="btn btn-tonal lg" type="button" style={{ marginTop: 8 }} onClick={data.onLogout}>
              <span className="mi" data-i="logout" aria-hidden="true"></span>Sign out
            </button>
          </div>
        </Body>
      </Screen>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // 2 · Signups
  // ══════════════════════════════════════════════════════════════════════

  function AdminSignupsScreen({ data = {} }) {
    const { signups, signupsWindow: win, fmt } = data;
    if (!signups || !win) return null;
    const tabs = ['h24', 'd8', 'd30', 'all'].map((id) => ({ id, label: signups.windows[id].tab, active: win.id === id }));
    const peak = win.series.reduce((best, p) => (p.count > best.count ? p : best), win.series[0]);
    const avg = Math.round(win.total / win.series.length);
    return (
      <Screen>
        <AppBar title="Signups" subtitle="People who finished sign-up" onBack={data.onBack} tabs={<Tabs items={tabs} onPick={data.onWindow} />} />
        <Body top={APPBAR_H_TABS}>
          <div className="adm-stat-hero">
            <span className="adm-growth-value" style={{ fontSize: 44 }}>{fmt.withCommas(win.total)}</span>
            <span className="adm-growth-caption">{win.title.toLowerCase()}</span>
            {win.delta != null ? (
              <span className={`manage-entry-stat-delta ${win.delta < 0 ? 'down' : ''}`} style={{ fontSize: 12 }}>
                {win.delta >= 0 ? '+' : ''}{win.delta}% vs {win.deltaAgainst}
              </span>
            ) : null}
          </div>

          <div className="surf adm-chart">
            <Bars series={win.series} height={132} unit={`signups ${win.unit} · tap a bar`} />
          </div>

          <div className="list-group" style={{ marginTop: 0 }}>
            <div className="list-item" style={{ padding: '12px 4px' }}>
              <span className="mi list-item-leading" data-i="trending_up" aria-hidden="true"></span>
              <span className="list-item-copy"><span className="list-item-title">Busiest</span><span className="list-item-subtitle">{peak.name || peak.label}</span></span>
              <span className="list-item-value" style={{ color: 'var(--color-info-primary)', fontWeight: 700 }}>{peak.count}</span>
            </div>
            <div className="list-item" style={{ padding: '12px 4px' }}>
              <span className="mi list-item-leading" data-i="schedule" aria-hidden="true"></span>
              <span className="list-item-copy"><span className="list-item-title">Average</span><span className="list-item-subtitle">{win.unit}</span></span>
              <span className="list-item-value" style={{ color: 'var(--color-info-primary)', fontWeight: 700 }}>{avg}</span>
            </div>
            <div className="list-item" style={{ padding: '12px 4px' }}>
              <span className="mi list-item-leading" data-i="group" aria-hidden="true"></span>
              <span className="list-item-copy"><span className="list-item-title">Since launch</span><span className="list-item-subtitle">{signups.launched} → today</span></span>
              <span className="list-item-value" style={{ color: 'var(--color-info-primary)', fontWeight: 700 }}>{fmt.withCommas(signups.allTime)}</span>
            </div>
          </div>

          <SectionLabel hint="Everyone who ever signed up, by where they stopped">Onboarding</SectionLabel>
          <div className="list-group" style={{ marginTop: 0 }}>
            {signups.statusShare.map((row) => (
              <div className="list-item" key={row.status} style={{ padding: '12px 4px', alignItems: 'stretch' }}>
                <span className="list-item-copy" style={{ gap: 6, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span className="list-item-title">{row.label}</span>
                    <span className="list-item-value" style={{ color: 'var(--color-info-primary)', fontWeight: 700 }}>{fmt.withCommas(row.count)}</span>
                  </span>
                  <span className="adm-meter" aria-hidden="true"><span style={{ width: `${Math.round(row.share * 100)}%` }}></span></span>
                </span>
              </div>
            ))}
          </div>

          <p className="adm-foot">Counted by account creation time (UTC) from paigham.users. Deleted accounts are excluded, so a day can lose a signup later.</p>
        </Body>
      </Screen>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // 3 · Approvals queue
  // ══════════════════════════════════════════════════════════════════════

  const leadStatusBadge = (lead) => {
    if (lead.status === 'VERIFIED') return <span className="badge sm jade">Approved</span>;
    if (lead.status === 'REJECTED') return <span className="badge sm coral">Rejected</span>;
    if (lead.status === 'PENDING_DETAILS') return <span className="badge sm muted">Incomplete</span>;
    if (lead.claimedMasjidId) return <span className="badge sm purple"><span className="mi" data-i="verified"></span>Claim</span>;
    return null;
  };

  function LeadRow({ lead, sourcedName, fmt, onOpen }) {
    const incomplete = lead.status === 'PENDING_DETAILS';
    const title = lead.masjidName || sourcedName || 'Masjid';
    const place = lead.address ? `${lead.address.city.split(',')[0]} ${lead.address.pincode}` : null;
    const subtitle = [fmt.roleLabel(lead.role), lead.contactName, place].filter(Boolean).join(' · ');
    const Root = incomplete ? 'div' : 'button';
    return (
      <Root className={`list-item ${incomplete ? '' : 'actionable'}`} type={incomplete ? undefined : 'button'} onClick={incomplete ? undefined : onOpen} style={{ padding: '12px 4px', opacity: incomplete ? 'var(--opacity-high)' : 1 }}>
        {lead.claimedMasjidId
          ? <span className="icon-tile accent" style={{ '--tile': '40px' }} aria-hidden="true"><span className="mi" data-i="mosque"></span></span>
          : <span className="icon-tile" style={{ '--tile': '40px' }} aria-hidden="true"><span className="mi" data-i="add_home_work"></span></span>}
        <span className="list-item-copy">
          <span className="list-item-title">{title}</span>
          <span className="list-item-subtitle">{incomplete ? `${lead.contactName} hasn’t finished the form · ${lead.submittedAt.toLowerCase()}` : subtitle}</span>
        </span>
        {leadStatusBadge(lead) || <span className="list-item-value">{lead.submittedAt}</span>}
        {incomplete ? null : <span className="mi list-item-chevron" data-i="chevron_right" aria-hidden="true"></span>}
      </Root>
    );
  }

  function QueueSkeleton() {
    return (
      <div className="list-group" style={{ marginTop: 0, padding: '0 12px' }} aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div className="list-item" key={i} style={{ padding: '12px 4px' }}>
            <Skeleton w={40} h={40} r="var(--radius-xl)" />
            <span className="list-item-copy" style={{ gap: 8, display: 'flex', flexDirection: 'column' }}>
              <Skeleton w="58%" h={14} /><Skeleton w="82%" h={11} />
            </span>
            <Skeleton w={48} h={14} />
          </div>
        ))}
      </div>
    );
  }

  function AdminApprovalsScreen({ data = {} }) {
    const { SearchBar } = window;
    const { leadFilters = [], leadFilter, visibleLeads = [], leadsStatus, counts = {}, fmt, quiet } = data;
    const sourcedName = (lead) => (lead.claimedMasjidId && data.sourcedNames ? data.sourcedNames[lead.claimedMasjidId] : null);
    const emptyCopy = {
      P: quiet ? { title: 'Nothing to review', copy: 'Every request has a decision. New registrations and claims land here the moment they are submitted.' } : { title: 'No matches', copy: 'Nothing waiting matches that search.' },
      V: { title: 'No approvals yet', copy: 'Approved requests stay here as the record of who verified each masjid.' },
      R: { title: 'Nothing rejected', copy: 'Rejected requests keep the reason the applicant was given.' },
      ALL: { title: 'No requests', copy: 'Nothing has been submitted yet.' },
    }[leadFilter] || {};
    const subtitle = counts.pendingLeads ? `${counts.pendingLeads} to review` : 'Nothing waiting';
    return (
      <Screen>
        <AppBar title="Approvals" subtitle={subtitle} onBack={data.onBack} tabs={<Tabs items={leadFilters} onPick={data.onFilter} />} />
        <Body top={APPBAR_H_TABS}>
          {SearchBar ? <SearchBar value={data.leadSearch} placeholder="Masjid, applicant, phone or pincode" onChange={data.onSearch} /> : null}
          {leadsStatus === 'loading' ? <QueueSkeleton /> : null}
          {leadsStatus === 'error' ? <ErrorState title="Couldn’t load the queue" copy="Nothing was changed. Try again." onRetry={data.onRetry} /> : null}
          {leadsStatus === 'loaded' && !visibleLeads.length ? (
            <Empty icon={leadFilter === 'P' ? 'check_circle' : 'format_list_bulleted'} title={emptyCopy.title} copy={emptyCopy.copy} />
          ) : null}
          {leadsStatus === 'loaded' && visibleLeads.length ? (
            <div className="list-group" style={{ marginTop: 0, padding: '0 12px' }}>
              {visibleLeads.map((lead) => (
                <LeadRow key={lead.id} lead={lead} sourcedName={sourcedName(lead)} fmt={fmt} onOpen={() => data.onOpenLead && data.onOpenLead(lead.id)} />
              ))}
            </div>
          ) : null}
          {leadsStatus === 'loaded' && leadFilter === 'P' && visibleLeads.length ? (
            <p className="adm-foot">Oldest first. Photos and the signed media links are only available while a request is under review.</p>
          ) : null}
        </Body>
        <Snack snack={data.snack} onClose={data.onCloseSnack} />
      </Screen>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // 4 · 5 · Lead review — a new masjid request, or a claim on a sourced masjid
  // ══════════════════════════════════════════════════════════════════════

  function RecordRow({ label, value, was, editable, mono, onEdit }) {
    const Root = editable ? 'button' : 'div';
    return (
      <Root className={`list-item ${editable ? 'actionable' : ''}`} type={editable ? 'button' : undefined} onClick={onEdit} style={{ padding: '12px 4px', alignItems: 'flex-start' }}>
        <span className="list-item-copy">
          <span className="list-item-subtitle" style={{ marginTop: 0, WebkitLineClamp: 1 }}>{label}</span>
          <span className={`list-item-title ${mono ? 'adm-mono' : ''}`} style={{ whiteSpace: 'normal', marginTop: 2 }}>{value || '—'}</span>
          {was ? <span className="list-item-subtitle">was: {was}</span> : null}
        </span>
        {was ? <span className="badge sm amber" style={{ flexShrink: 0 }}>Corrected</span> : null}
        {editable ? <span className="mi list-item-chevron" data-i="edit" aria-hidden="true"></span> : null}
      </Root>
    );
  }

  function PhotoPair({ lead, onView }) {
    const pending = lead.status === 'PENDING_VERIFICATION';
    if (!pending) {
      return (
        <div className="adm-note">
          <span className="mi" data-i="visibility_off" aria-hidden="true"></span>
          Photos are kept only while a request is under review, so they are no longer available here.
        </div>
      );
    }
    return (
      <div className="adm-photos">
        {lead.masjidPhotoAvailable ? (
          <button className="media-tile" type="button" onClick={() => onView && onView('MASJID_PHOTO')} aria-label="Open the entrance photo">
            <img src={lead.masjidPhoto} alt="" />
            <span className="media-tile-label"><span className="mi" data-i="mosque" aria-hidden="true"></span>Entrance</span>
          </button>
        ) : (
          <div className="adm-photo-missing"><span className="mi" data-i="photo_camera" aria-hidden="true"></span>No entrance photo</div>
        )}
        {lead.verificationPhotoAvailable ? (
          <button className="media-tile" type="button" onClick={() => onView && onView('VERIFICATION_PHOTO')} aria-label="Open the identity photo">
            <img src={lead.verificationPhoto} alt="" />
            <span className="media-tile-label"><span className="mi" data-i="person" aria-hidden="true"></span>Identity</span>
          </button>
        ) : (
          <div className="adm-photo-missing is-warn"><span className="mi" data-i="person" aria-hidden="true"></span>No identity photo</div>
        )}
      </div>
    );
  }

  function PhotoViewer({ lead, viewer, onClose }) {
    if (!viewer) return null;
    const entrance = viewer === 'MASJID_PHOTO';
    return (
      <div className="qaum-media-overlay" onClick={onClose}>
        <div className="qaum-media-viewer" onClick={(e) => e.stopPropagation()}>
          <button className="qaum-media-close" type="button" onClick={onClose} aria-label="Close"><span className="mi" data-i="close"></span></button>
          <div className="adm-viewer">
            <img src={entrance ? lead.masjidPhoto : lead.verificationPhoto} alt={entrance ? 'Masjid entrance' : 'Applicant identity'} />
            <div className="adm-viewer-caption">
              <strong>{entrance ? 'Entrance photo' : 'Identity photo'}</strong>
              <span>Taken in the app · {lead.submittedOn}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function DecisionStrip({ lead, fmt }) {
    if (!lead.decision) return null;
    const approved = lead.status === 'VERIFIED';
    return (
      <div className={`summary-hero ${approved ? '' : 'adm-rejected'}`} style={{ padding: 14, gap: 12 }}>
        <span className={`icon-tile ${approved ? 'accent' : ''}`} style={{ '--tile': '40px' }} aria-hidden="true">
          <span className="mi" data-i={approved ? 'check_circle' : 'close'}></span>
        </span>
        <span className="summary-hero-copy">
          <span className="summary-hero-title" style={{ display: 'block' }}>
            {approved ? `Approved · ${lead.decision.masjidId}` : 'Rejected'}
          </span>
          <span className="summary-hero-label" style={{ display: 'block' }}>
            {approved ? `${fmt.roleLabel(lead.role)} ${lead.contactName} was added to the committee` : lead.decision.reason} · by {lead.decision.by} · {lead.decision.on}
          </span>
        </span>
      </div>
    );
  }

  function RejectSheet({ open, reasons = [], reason, kind, onPick, onClose, onReject }) {
    const { Dialog } = window;
    if (!Dialog) return null;
    return (
      <Dialog
        mode="sheet"
        isOpen={!!open}
        onClose={onClose}
        title="Why is it being rejected?"
        description={kind === 'post' ? 'The committee reads this, so name what to change.' : 'The applicant reads this in the app, so name what to fix. They can resubmit.'}
        primary={null}
        secondary={null}
        className="opt-sheet adm-reject"
      >
        <div className="opt-list" role="listbox" aria-label="Reason">
          {reasons.map((r) => {
            const selected = r === reason;
            return (
              <button key={r} type="button" role="option" aria-selected={selected} className={`opt-row ${selected ? 'selected' : ''}`} onClick={() => onPick && onPick(r)}>
                <span>{r}</span>
                <span className="opt-row-mark"><span className="mi" data-i={selected ? 'radio_button_checked' : 'radio_button_unchecked'} aria-hidden="true"></span></span>
              </button>
            );
          })}
        </div>
        <div className="dlg-actions">
          <button className="btn lg btn-tonal" type="button" onClick={onClose}>Cancel</button>
          <button className="btn lg btn-destructive" type="button" disabled={!reason} onClick={onReject}>{kind === 'post' ? 'Reject paigham' : 'Reject request'}</button>
        </div>
      </Dialog>
    );
  }

  const FIELD_LABELS = { name: 'masjid name', maslak: 'maslak', address: 'street address' };

  function CorrectionSheet({ editing, onChange, onClose, onSave }) {
    const { Dialog } = window;
    if (!Dialog || !editing) return null;
    return (
      <Dialog
        mode="sheet"
        isOpen
        onClose={onClose}
        title={`Correct the ${FIELD_LABELS[editing.field] || editing.field}`}
        description="Written onto the sourced record when you approve. The applicant is not asked — confirm it with them on the call."
        primary={{ text: 'Save correction', onClick: onSave }}
        secondary={{ text: 'Cancel', onClick: onClose }}
      >
        <div className="input focused">
          <div className="inner">
            <input className="val" type="text" value={editing.value || ''} aria-label={FIELD_LABELS[editing.field]} onInput={(e) => onChange && onChange(e.target.value)} />
          </div>
        </div>
      </Dialog>
    );
  }

  function AdminLeadScreen({ data = {} }) {
    const { Dialog } = window;
    const { lead, sourced, record, corrections = {}, correctionCount = 0, fmt, working, confirm, rejectSheet, conflict, editing, viewer } = data;
    if (!lead) return <Screen><Loading label="Loading the request…" /></Screen>;

    const isClaim = !!lead.claimedMasjidId;
    const pending = lead.status === 'PENDING_VERIFICATION';
    const role = fmt.roleLabel(lead.role);
    const masjidName = isClaim ? (record ? record.name : sourced && sourced.name) : lead.masjidName;
    const address = isClaim && sourced ? sourced.address : lead.address;
    const coords = address && address.coordinates ? `${address.coordinates.lat.toFixed(4)}, ${address.coordinates.lng.toFixed(4)}` : null;
    const heroPhoto = isClaim ? (sourced && sourced.photo) : (pending && lead.masjidPhotoAvailable ? lead.masjidPhoto : null);

    const approveTitle = isClaim ? 'Approve this claim?' : `Approve ${lead.masjidName}?`;
    const approveCopy = isClaim
      ? `${lead.contactName} becomes ${role} of ${masjidName} and can send paighams to its musalleen from today.${correctionCount ? ` ${correctionCount} correction${correctionCount === 1 ? '' : 's'} to the record ${correctionCount === 1 ? 'is' : 'are'} saved with it.` : ''} They get a welcome notification.`
      : `A new masjid is created in ${address ? address.pincode : 'this pincode'} with the details below, and ${lead.contactName} becomes its ${role}. They get a welcome notification.`;
    const helper = isClaim ? `Approving makes ${lead.contactName} ${role} of ${masjidName}` : `Approving creates the masjid and makes ${lead.contactName} its ${role}`;

    return (
      <Screen>
        <AppBar
          title={isClaim ? 'Review claim' : 'Review request'}
          subtitle={isClaim ? 'On a masjid sourced by Paigham' : 'New masjid registration'}
          onBack={data.onBack}
          trailing={<a className="ib ib-tonal" href={`tel:${lead.phone}`} aria-label={`Call ${lead.contactName}`}><span className="mi" data-i="call"></span></a>}
        />
        <Body bottomInset={pending ? 16 : 44} style={{ padding: `${APPBAR_H}px 0 ${pending ? 16 : 44}px`, gap: 0 }}>
          <div className="media-identity-hero" style={{ height: heroPhoto ? undefined : 150 }}>
            {heroPhoto ? <img src={heroPhoto} alt="" /> : null}
            <div className="media-identity-hero-copy">
              <div className="screen-title on-media">{masjidName}</div>
              <div className="media-identity-hero-caption">
                {isClaim
                  ? <span className="badge sm gold"><span className="mi" data-i="verified"></span>Sourced</span>
                  : <span className="badge sm amber"><span className="mi" data-i="add_home_work"></span>New masjid</span>}
                <span className="adm-hero-code">{isClaim && sourced ? sourced.masjidId : (address ? `Pincode ${address.pincode}` : '')}</span>
              </div>
            </div>
          </div>

          <div className="adm-lead-body">
            <DecisionStrip lead={lead} fmt={fmt} />

            <SectionLabel hint={isClaim ? 'Claims to run this masjid. Call before you decide.' : 'Registered the masjid and asks to run it'}>Who is asking</SectionLabel>
            <div className="surf adm-person">
              <Avatar text={lead.contactName} size={44} />
              <div className="adm-person-copy">
                <strong>{lead.contactName}</strong>
                <span>{lead.phone} · submitted {lead.submittedAt.toLowerCase()}</span>
              </div>
              <span className="chip tonal sm" style={{ flexShrink: 0 }}>{role}</span>
            </div>
            {lead.resubmitted && lead.previousRejection ? (
              <div className="adm-note">
                <span className="mi" data-i="history" aria-hidden="true"></span>
                Resubmitted after a rejection on {lead.previousRejection.on}: “{lead.previousRejection.reason}”.
              </div>
            ) : null}

            <SectionLabel hint={pending ? 'Both were taken live in the app, not uploaded' : null}>Photos</SectionLabel>
            <PhotoPair lead={lead} onView={data.onViewPhoto} />

            <SectionLabel hint={isClaim ? (pending ? 'Typed in by Paigham. Tap a line to correct it before approving.' : `Sourced · ${sourced && sourced.sourcedBy}`) : 'As the applicant entered it'}>
              {isClaim ? 'Sourced record' : 'Masjid'}
            </SectionLabel>
            <div className="list-group" style={{ marginTop: 0, padding: '0 12px' }}>
              <RecordRow label="Name" value={masjidName} was={corrections.name != null && sourced ? sourced.name : null} editable={isClaim && pending} onEdit={() => data.onEdit && data.onEdit('name', masjidName)} />
              <RecordRow label="Maslak" value={isClaim ? (record && record.maslak) : lead.maslak} was={corrections.maslak != null && sourced ? sourced.maslak : null} editable={isClaim && pending} onEdit={() => data.onEdit && data.onEdit('maslak', record && record.maslak)} />
              <RecordRow label="Street address" value={isClaim ? (record && record.address) : (address && address.address)} was={corrections.address != null && sourced ? sourced.address.address : null} editable={isClaim && pending} onEdit={() => data.onEdit && data.onEdit('address', record && record.address)} />
              <RecordRow label="Town & pincode" value={address ? `${address.city} · ${address.pincode}, ${address.state}` : null} />
              <RecordRow label="Entrance pin" value={coords} mono />
            </div>
            {isClaim && sourced && pending ? (
              <p className="adm-foot">{sourced.masjidId} · {sourced.sourcedBy}. Town, pincode and the pin come from the sourced record and cannot be changed here.</p>
            ) : null}
          </div>
        </Body>

        {pending ? (
          <FooterPair
            primary={{ text: isClaim ? 'Approve claim' : 'Approve', onClick: data.onAskApprove }}
            secondary={{ text: 'Reject', onClick: data.onOpenReject }}
            helper={helper}
            working={working}
            workingLabel={working === 'reject' ? 'Rejecting…' : (isClaim ? 'Approving the claim…' : 'Creating the masjid…')}
          />
        ) : null}

        {Dialog ? (
          <Dialog
            isOpen={!!confirm && confirm.kind === 'approve'}
            onClose={data.onCancelConfirm}
            title={approveTitle}
            description={approveCopy}
            primary={{ text: 'Approve', onClick: data.onConfirm }}
            secondary={{ text: 'Not yet', onClick: data.onCancelConfirm }}
          />
        ) : null}
        {Dialog ? (
          <Dialog
            isOpen={!!conflict}
            onClose={data.onBack}
            title="Already claimed"
            description={`Another committee was verified for ${masjidName} while this claim was open. A masjid can’t be granted twice, so this request can only be rejected — the applicant hears back with the reason.`}
            primary={{ text: 'Reject request', onClick: data.onOpenReject }}
            secondary={{ text: 'Back to queue', onClick: data.onBack }}
            destructive
          />
        ) : null}
        <RejectSheet open={!!rejectSheet} reasons={data.rejectReasons} reason={rejectSheet && rejectSheet.reason} onPick={data.onPickReason} onClose={data.onCloseReject} onReject={data.onReject} />
        <CorrectionSheet editing={editing} onChange={data.onEditValue} onClose={data.onCloseEdit} onSave={data.onSaveEdit} />
        <PhotoViewer lead={lead} viewer={viewer} onClose={data.onCloseViewer} />
      </Screen>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // 6 · Paigham moderation
  // ══════════════════════════════════════════════════════════════════════

  const postBadge = (post) => {
    if (post.status === 'LIVE') return <span className="badge sm jade">Live</span>;
    if (post.status === 'REJECTED') return <span className="badge sm coral">Rejected</span>;
    return <span className="badge sm amber">Waiting</span>;
  };

  function ModerationPost({ post, fmt, onOpen, full }) {
    const clamp = !full && post.message.length > 140;
    const text = clamp ? `${post.message.slice(0, 140).replace(/\s+\S*$/, '')}…` : post.message;
    return (
      <article className={`feed-post ${onOpen ? 'adm-post-tap' : ''}`} onClick={onOpen} role={onOpen ? 'button' : undefined} tabIndex={onOpen ? 0 : undefined}>
        <div className="feed-post-head">
          <span className="avatar accent" style={{ '--tile': '44px' }} aria-hidden="true">{post.masjid.name.charAt(0)}</span>
          <span className="feed-post-id">
            <span className="feed-post-name">{post.masjid.name}</span>
            <span className="feed-post-sub">Sent by {post.createdBy.name} · {post.createdBy.role}</span>
          </span>
          {postBadge(post)}
        </div>
        <div className="feed-post-body">{text}{clamp ? <span className="feed-post-more"> Show more</span> : null}</div>
        {post.images && post.images.length ? (
          <div className="adm-post-photos">{post.images.map((src, i) => <img key={i} src={src} alt="" />)}</div>
        ) : null}
        <div className="feed-post-actions">
          <span className="feed-post-time">{post.createdAt}</span>
        </div>
        <div className="feed-post-admin"><span className="mi" data-i="groups"></span>{post.targetLabel} · {fmt.countLabel(post.masjid.followers)} musalleen</div>
      </article>
    );
  }

  function AdminModerationScreen({ data = {} }) {
    const { postFilters = [], postFilter, visiblePosts = [], postsStatus, counts = {}, fmt } = data;
    const empty = {
      P: { title: 'Nothing waiting', copy: 'Every paigham a committee sent is live. New ones land here the moment they are sent.' },
      L: { title: 'Nothing live yet', copy: 'Paighams you send live stay here.' },
      R: { title: 'Nothing rejected', copy: 'Rejected paighams keep the reason the committee was given.' },
    }[postFilter] || {};
    return (
      <Screen>
        <AppBar title="Paighams" subtitle={counts.pendingPosts ? `${counts.pendingPosts} waiting to go live` : 'Nothing waiting'} onBack={data.onBack} tabs={<Tabs items={postFilters} onPick={data.onPostFilter} />} />
        <Body top={APPBAR_H_TABS}>
          {postsStatus === 'loading' ? <QueueSkeleton /> : null}
          {postsStatus === 'loaded' && !visiblePosts.length ? <Empty icon="campaign" title={empty.title} copy={empty.copy} /> : null}
          {postsStatus === 'loaded' && visiblePosts.length ? (
            <div className="adm-feed">
              {visiblePosts.map((post) => <ModerationPost key={post.id} post={post} fmt={fmt} onOpen={() => data.onOpenPost && data.onOpenPost(post.id)} />)}
            </div>
          ) : null}
          {postFilter === 'P' && visiblePosts.length ? (
            <p className="adm-foot">A committee’s paigham waits here until a moderator sends it live. A super admin’s own paighams go live at once.</p>
          ) : null}
        </Body>
        <Snack snack={data.snack} onClose={data.onCloseSnack} />
      </Screen>
    );
  }

  function AdminPostScreen({ data = {} }) {
    const { Dialog } = window;
    const { post, fmt, working, confirm, rejectSheet } = data;
    if (!post) return <Screen><Loading label="Loading the paigham…" /></Screen>;
    const pending = post.status === 'PENDING';
    const reach = `${fmt.withCommas(post.masjid.followers)} musalleen of ${post.masjid.name}`;
    return (
      <Screen>
        <AppBar title="Review paigham" subtitle={post.masjid.name} onBack={data.onBack} />
        <Body bottomInset={pending ? 16 : 44}>
          <div className="adm-feed"><ModerationPost post={post} fmt={fmt} full /></div>
          {post.decision ? (
            <div className={`summary-hero ${post.status === 'LIVE' ? '' : 'adm-rejected'}`} style={{ padding: 14, gap: 12 }}>
              <span className={`icon-tile ${post.status === 'LIVE' ? 'accent' : ''}`} style={{ '--tile': '40px' }} aria-hidden="true"><span className="mi" data-i={post.status === 'LIVE' ? 'check_circle' : 'close'}></span></span>
              <span className="summary-hero-copy">
                <span className="summary-hero-title" style={{ display: 'block' }}>{post.status === 'LIVE' ? 'Sent live' : 'Rejected'}</span>
                <span className="summary-hero-label" style={{ display: 'block' }}>{post.decision.reason ? `${post.decision.reason} · ` : ''}by {post.decision.by} · {post.decision.on}</span>
              </span>
            </div>
          ) : null}
          <div className="list-group" style={{ marginTop: 0, padding: '0 12px' }}>
            <RecordRow label="From" value={`${post.createdBy.name} · ${post.createdBy.role}, ${post.masjid.name}`} />
            <RecordRow label="To" value={`${post.targetLabel} · ${fmt.withCommas(post.masjid.followers)} people`} />
            <RecordRow label="Sent" value={post.createdOn} />
          </div>
          <p className="adm-foot">Check it reads as a masjid notice: no chain messages, no personal or payment details, nothing that could cause offence.</p>
        </Body>
        {pending ? (
          <FooterPair
            primary={{ text: 'Send live', onClick: data.onAskApprove }}
            secondary={{ text: 'Reject', onClick: data.onOpenReject }}
            helper={`Goes live to ${reach}`}
            working={working}
            workingLabel={working === 'post-reject' ? 'Rejecting…' : 'Sending live…'}
          />
        ) : null}
        {Dialog ? (
          <Dialog
            isOpen={!!confirm && confirm.kind === 'post-approve'}
            onClose={data.onCancelConfirm}
            title="Send this paigham live?"
            description={`It reaches ${reach} right away and appears in their Qaum feed. It can be taken down later, but not unsent.`}
            primary={{ text: 'Send live', onClick: data.onConfirm }}
            secondary={{ text: 'Not yet', onClick: data.onCancelConfirm }}
          />
        ) : null}
        <RejectSheet open={!!rejectSheet} kind="post" reasons={data.rejectReasons} reason={rejectSheet && rejectSheet.reason} onPick={data.onPickReason} onClose={data.onCloseReject} onReject={data.onReject} />
      </Screen>
    );
  }

  Object.assign(window, {
    AdminHubScreen,
    AdminInvalidScreen,
    AdminSignupsScreen,
    AdminApprovalsScreen,
    AdminLeadScreen,
    AdminModerationScreen,
    AdminPostScreen,
  });
}());

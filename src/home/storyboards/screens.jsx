// Shared screen components for the Home Flow Section Board.
// These are used by both the static storyboard frames and the live interactive Home Broadcast Studio board.

// 1. HOME SCREEN
function HomeScreen({
  heroSel = null, // 'suhoor' | 'iftaar' | null
  onSuhoorTap,
  onIftaarTap,
  prayers = { Fajr: true, Zohar: true, Asr: true, Maghrib: true, Isha: false },
  onTogglePrayer,
  salaahCount = "4 of 5 today",
  sehriNoteVisible = false,
  onSehriTap,
  goSehri,
  slide = 0,
  onSlideDotTap,
  likes = { haj: { liked: true, count: 4 }, eid: { liked: true, count: 12 } },
  onHajLike,
  onEidLike,
  userName = "Toufeeq Ahamed",
  masjidName = "Masjid E Bilal",
  onBellTap,
  notifOn = true,
  goQuran,
  goDua,
  goMasjids,
  onMasjidTap,              // tap the masjid name in the header → open My Masjids (masjid-register board)
  goHijri,
  goAsma,
  goZakaat,
  goQibla,
  prayer = 'Maghrib',
  loginNudge = false,
  onCloseLoginNudge,
  onSignInTap,
  followNudge = false,      // signed-in without a primary masjid (InlineNudge.FollowMasjidSignedIn)
  onCloseFollowNudge,
  onFindMasjid,
  notifNudge = false,       // signed-in with masjid, notifs off (InlineNudge.NotificationPermission)
  onCloseNotifNudge,
  onAllowNotif,
  trackingLoading = false,
  managedMasjid = null,      // masjid name when this member manages one → console tile
  managedAttention = 0,
  managedRole = 'Chairman',  // your standing in this masjid — why the tile is here at all
  // The summary supplies musalleen context when no task needs attention. Legacy storyboard
  // values stay accepted so old frames remain stable; Home intentionally renders no stat strip.
  managedStats = [
    { value: '1.3k', label: 'Musalleen', delta: '+12' },
    { value: '96', label: 'Paighams', delta: '+3' },
    { value: '3.1k', label: 'Reactions', delta: '+148' }
  ],
  managedStatsLoading = false,
  onManageMasjid,
  onManageCommittee
}) {
  const { PromptCard } = window;
  // First run is derived from the numbers themselves, so the prompt and the strip can never
  // disagree about whether this masjid has anything to show yet.
  const managedFirstRun = managedStats.every((s) => String(s.value) === '0');
  const bellIcon = notifOn ? 'notifications' : 'notifications_off';
  const bellFill = notifOn ? 1 : 0;
  const bellOpacity = notifOn ? 0.9 : 0.5;
  const bellDotOpacity = notifOn ? 1 : 0;

  const pName = (prayer || 'Maghrib').toLowerCase();
  const bgImg = `../../images/${pName}_background.webp`;
  const quranImg = `../../images/${pName}_quran.webp`;
  const sehriImg = `../../images/${pName}_sehri.webp`;
  const duaImg = `../../images/${pName}_dua.webp`;
  const masjidImg = `../../images/${pName}_masjid.webp`;

  const prayerTimes = {
    fajr: { name: 'Fajr', azan: '4:36 AM', iqama: '5:00 AM', range: 'From 4:36 AM To 6:00 AM' },
    zohar: { name: 'Zohar', azan: '12:35 PM', iqama: '1:00 PM', range: 'From 12:35 PM To 4:30 PM' },
    asr: { name: 'Asr', azan: '4:52 PM', iqama: '5:15 PM', range: 'From 4:52 PM To 6:30 PM' },
    maghrib: { name: 'Maghrib', azan: '6:49 PM', iqama: '6:52 PM', range: 'From 6:49 PM To 8:00 PM' },
    isha: { name: 'Isha', azan: '8:05 PM', iqama: '8:30 PM', range: 'From 8:05 PM To 11:30 PM' }
  };
  const activePrayer = prayerTimes[pName] || prayerTimes.maghrib;

  // Theme definition for bright vs dark prayer backgrounds
  const theme = pName === 'isha' ? {
    textColorPrimary: 'rgba(255,255,255,0.95)',
    textColorSecondary: 'rgba(255,255,255,0.70)',
    textColorTertiary: 'rgba(255,255,255,0.55)',
    appBarTitle: '#FFFFFF',
    appBarSubtitle: 'rgba(255,255,255,0.75)',
    bellIconColor: '#FFFFFF',
    bellBtnBg: 'rgba(255,255,255,0.15)',
    bellBtnBorder: 'rgba(255,255,255,0.30)',
    avatarBorder: 'rgba(255,255,255,0.6)',
    flankerIconColor: 'rgba(255,255,255,0.85)',
    flankerTextColor: 'rgba(255,255,255,0.65)',
    flankerTimeColor: 'rgba(255,255,255,0.85)',
  } : {
    textColorPrimary: 'rgba(10,6,2,0.9)',
    textColorSecondary: 'rgba(15,10,5,0.55)',
    textColorTertiary: 'rgba(15,10,5,0.5)',
    appBarTitle: '#1A1612',
    appBarSubtitle: 'rgba(26,22,18,0.70)',
    bellIconColor: '#1A1612',
    bellBtnBg: 'rgba(0,0,0,0.12)',
    bellBtnBorder: 'rgba(26,22,18,0.20)',
    avatarBorder: 'rgba(26,22,18,0.72)',
    flankerIconColor: 'rgba(20,15,8,0.7)',
    flankerTextColor: 'rgba(20,15,8,0.6)',
    flankerTimeColor: 'rgba(20,15,8,0.75)',
  };

  const prayerList = ['Fajr', 'Zohar', 'Asr', 'Maghrib', 'Isha'].map(name => ({
    name,
    checked: prayers[name],
    labelColor: prayers[name] ? 'var(--color-info-tertiary)' : 'var(--color-action-primary)'
  }));

  const suhoorBg = heroSel === 'suhoor' ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.22)';
  const suhoorBorder = heroSel === 'suhoor' ? '1.5px solid rgba(255,255,255,0.75)' : '1.5px solid rgba(255,255,255,0.35)';
  const iftaarBg = heroSel === 'iftaar' ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.22)';
  const iftaarBorder = heroSel === 'iftaar' ? '1.5px solid rgba(255,255,255,0.75)' : '1.5px solid rgba(255,255,255,0.35)';

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Full screen background image */}
      <img src={bgImg} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%', zIndex: 0 }} />
      
      {/* App Bar — transparent + blur only, matching hazeSurfaceColor=Color.Transparent in HomeTab.kt */}
      <div className="app-bar" style={{ padding: '54px 16px 10px', height: 98 }}>
        {/* Avatar */}
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.18)', border: `1.5px solid ${theme.avatarBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 700, color: '#fff' }}>{userName.charAt(0)}</span>
        </div>
        {/* Title & Subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 700, color: theme.appBarTitle }}>Salaam, {userName}</div>
          <div onClick={onMasjidTap} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-body)', fontSize: 12, color: theme.appBarSubtitle, marginTop: 1, cursor: onMasjidTap ? 'pointer' : 'default' }}>
            {masjidName}
            {onMasjidTap && <span className="mi" style={{ fontSize: 15, color: theme.appBarSubtitle }} data-i="unfold_more"></span>}
          </div>
        </div>
        {/* Bell icon button */}
        <div onClick={onBellTap} style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', background: theme.bellBtnBg, border: `1.5px solid ${theme.bellBtnBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <span className="mi" style={{ fontSize: 20, color: theme.bellIconColor, opacity: bellOpacity, fontVariationSettings: `'FILL' ${bellFill}`, transition: 'opacity 160ms' }} data-i={bellIcon}></span>
          <div style={{ position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: '50%', background: 'var(--color-action-primary)', border: '1.5px solid rgba(255,255,255,0.8)', opacity: bellDotOpacity, transition: 'opacity 160ms' }} />
        </div>
      </div>

      {/* Fixed hero — time + Suhoor/Iftaar flank it. Stays put; only the sheet scrolls over it. */}
      <div style={{ position: 'absolute', top: 98, left: 0, right: 0, height: 152, zIndex: 1, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 40%,rgba(22,18,28,0.3) 100%)' }} />

        {/* Share one row between the prayer heading and both icons; labels sit below. */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 26, padding: '0 16px', display: 'grid', gridTemplateColumns: '49px minmax(0, 1fr) 49px', gridTemplateRows: 'auto 49px auto', alignContent: 'center', alignItems: 'center', columnGap: 8, rowGap: 5, pointerEvents: 'auto' }}>
          {/* Suhoor — beside the time */}
          <div onClick={onSuhoorTap} style={{ display: 'contents', cursor: 'pointer' }}>
            <div style={{ gridColumn: 1, gridRow: 2, width: 46, height: 46, borderRadius: '50%', background: suhoorBg, backdropFilter: 'blur(10px)', border: suhoorBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 200ms, border 200ms' }}>
              <span className="mi" style={{ fontSize: 20, color: theme.flankerIconColor }} data-i="wb_sunny"></span>
            </div>
            <div style={{ gridColumn: 1, gridRow: 3, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: theme.flankerTextColor }}>Suhoor</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: theme.flankerTimeColor }}>4:31 AM</div>
            </div>
          </div>

          {/* Time (center) */}
          <div style={{ display: 'contents' }}>
            <div style={{ fontFamily: 'var(--font-body)', gridColumn: 2, gridRow: 1, textAlign: 'center', fontSize: 11, fontWeight: 600, color: theme.textColorSecondary, letterSpacing: '.08em', textTransform: 'uppercase' }}>Azan: {activePrayer.azan}</div>
            <div style={{ gridColumn: 2, gridRow: 2, textAlign: 'center', minWidth: 0, fontFamily: 'var(--font-title)', fontSize: 'var(--title-h2-size)', color: theme.textColorPrimary, lineHeight: 'var(--title-h2-lh)', letterSpacing: 'var(--title-h2-tracking)', whiteSpace: 'nowrap' }}>{activePrayer.name} {activePrayer.iqama}</div>
            <div style={{ fontFamily: 'var(--font-body)', gridColumn: 2, gridRow: 3, textAlign: 'center', fontSize: 12, color: theme.textColorTertiary }}>{activePrayer.range}</div>
          </div>

          {/* Iftaar — beside the time */}
          <div onClick={onIftaarTap} style={{ display: 'contents', cursor: 'pointer' }}>
            <div style={{ gridColumn: 3, gridRow: 2, width: 46, height: 46, borderRadius: '50%', background: iftaarBg, backdropFilter: 'blur(10px)', border: iftaarBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 200ms, border 200ms' }}>
              <span className="mi" style={{ fontSize: 20, color: theme.flankerIconColor }} data-i="bedtime"></span>
            </div>
            <div style={{ gridColumn: 3, gridRow: 3, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: theme.flankerTextColor }}>Iftaar</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: theme.flankerTimeColor }}>At Azan</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll layer — only the sheet scrolls; it rises over the fixed hero */}
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 80, zIndex: 2, boxSizing: 'border-box' }}>
        {/* Transparent spacer keeps the sheet below the hero at rest (clicks pass through to Suhoor/Iftaar) */}
        <div style={{ height: 224, flexShrink: 0, pointerEvents: 'none' }} />

        {/* Sheet card — scrolls up over the fixed hero */}
        <div style={{ position: 'relative', pointerEvents: 'auto', background: 'color-mix(in oklab, var(--color-surface-card) 82%, transparent)', backdropFilter: 'blur(28px) saturate(180%)', WebkitBackdropFilter: 'blur(28px) saturate(180%)', borderRadius: '24px 24px 0 0', paddingBottom: 32 }}>
          {/* Home is a window into the console. The identity row opens the console; the only
              separate row is work that needs a person, and it deep-links to that destination. */}
          {managedMasjid && onManageMasjid ? (
            <div style={{ padding: '18px 20px 0' }}>
              <div className="manage-entry compact stacked">
                <button className="manage-entry-main" onClick={onManageMasjid}>
                  <span className="masjid-mark" style={{ '--tile': '38px' }}>
                    <img src="../../images/masjid-camera-preview.png" alt="" />
                  </span>
                  <span className="manage-entry-copy">
                    <span className="manage-entry-eyebrow">{managedRole}</span>
                    <span className="manage-entry-name">{managedMasjid}</span>
                  </span>
                  <span className="mi manage-entry-go" data-i="chevron_right"></span>
                </button>
                {managedStatsLoading ? (
                  <span className="manage-entry-summary skeleton" aria-hidden="true">Loading console summary</span>
                ) : managedAttention ? (
                  <button className="manage-entry-need" onClick={onManageCommittee || onManageMasjid}>
                    <span className="mi" data-i="group" aria-hidden="true"></span>
                    <span>{managedAttention} {managedAttention === 1 ? 'invitation' : 'invitations'} waiting</span>
                    <span className="mi manage-entry-go" data-i="chevron_right"></span>
                  </button>
                ) : (
                  <span className="manage-entry-summary">
                    {managedStats[0]?.value || '0'} following · {managedFirstRun ? 'timings not published' : 'timings updated today'}
                  </span>
                )}
              </div>
            </div>
          ) : null}

          <div style={{ padding: '14px 20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 20, fontWeight: 700, color: 'var(--color-info-primary)' }}>Track Salaah</div>
              {trackingLoading ? (
                <span className="skeleton" aria-hidden="true" style={{ width: 64, height: 12, borderRadius: 6 }} />
              ) : (
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: 'var(--color-action-primary)' }}>{salaahCount}</span>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {prayerList.map((p, idx) => (
                <div key={idx} onClick={() => !trackingLoading && onTogglePrayer && onTogglePrayer(p.name)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: trackingLoading ? 'default' : 'pointer' }}>
                  <div className={`cb ${trackingLoading ? 'skeleton' : (p.checked ? 'on' : '')}`} aria-hidden={trackingLoading ? 'true' : undefined}>
                    {!trackingLoading && p.checked && <span className="mi" data-i="check"></span>}
                  </div>
                  {trackingLoading ? (
                    <span className="skeleton" aria-hidden="true" style={{ width: 34, height: 12, borderRadius: 6 }} />
                  ) : (
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: p.labelColor }}>{p.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Guest Login Nudge (PromptCard.error variant from NudgeInline.kt) */}
          {loginNudge && (
            <PromptCard
              variant="error"
              title="Sign in for your masjid & reminders"
              description="Pick a masjid, see iqama times, and sync reminders across all your devices"
              primaryActionText="Sign In"
              onPrimaryAction={onSignInTap}
              onDismiss={onCloseLoginNudge}
              style={{ margin: '0 20px 24px' }}
            />
          )}

          {/* Follow-a-Masjid Nudge — signed in, no primary masjid (PromptCard.warning, NudgeInline.kt) */}
          {followNudge && (
            <PromptCard
              variant="warning"
              title="Follow a Masjid"
              description="Follow a masjid you trust for iqama times and community updates"
              primaryActionText="Find a Masjid"
              primaryActionIcon="mosque"
              onPrimaryAction={onFindMasjid}
              onDismiss={onCloseFollowNudge}
              style={{ margin: '0 20px 24px' }}
            />
          )}

          {/* Enable-Notifications Nudge — signed in with masjid, notifs off (PromptCard.success, NudgeInline.kt) */}
          {notifNudge && (
            <PromptCard
              variant="success"
              title="Enable Notifications"
              description="Never miss prayer time updates, announcements, and direct messages"
              primaryActionText="Allow Notifications"
              onPrimaryAction={onAllowNotif}
              onDismiss={onCloseNotifNudge}
              style={{ margin: '0 20px 24px' }}
            />
          )}

          {/* Hero details popup sheets (Absolute overlay within card context) */}
          {heroSel === 'suhoor' && (
            <div style={{ margin: '0 20px 24px', background: 'var(--color-surface-primary)', border: '1.5px solid var(--color-action-primary)', borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span className="mi" style={{ fontSize: 28, color: 'var(--color-action-primary)', flexShrink: 0 }} data-i="wb_sunny"></span>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 800, color: 'var(--color-info-primary)' }}>Suhoor ends at 4:31 AM</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-info-secondary)', marginTop: 4, lineHeight: 1.45 }}>Eat before this time. The Fajr Azan is at 4:36 AM. Recommended to stop eating 10 mins before Azan.</div>
              </div>
            </div>
          )}

          {heroSel === 'iftaar' && (
            <div style={{ margin: '0 20px 24px', background: 'var(--color-surface-primary)', border: '1.5px solid var(--color-action-primary)', borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span className="mi" style={{ fontSize: 28, color: 'var(--color-action-primary)', flexShrink: 0 }} data-i="bedtime"></span>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 800, color: 'var(--color-info-primary)' }}>Iftaar starts at 6:49 PM</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-info-secondary)', marginTop: 4, lineHeight: 1.45 }}>Open your fast now. Remember to recite the fast-breaking dua before eating.</div>
              </div>
            </div>
          )}

          {/* For You Section */}
          <div style={{ padding: '0 20px 24px' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 20, fontWeight: 700, color: 'var(--color-info-primary)', marginBottom: 14 }}>For you</div>
            
            <div style={{ display: 'flex', gap: 14, height: 274 }}>
              {/* Left Column (Quran + Sehri) */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Quran Card */}
                <div onClick={goQuran} style={{ position: 'relative', height: 130, borderRadius: 24, overflow: 'hidden', cursor: 'pointer' }}>
                  <img src={quranImg} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.6) 0%, transparent 65%)' }} />
                  <div style={{ position: 'absolute', left: 16, bottom: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span className="mi" style={{ fontSize: 18, color: '#FFFFFF' }} data-i="auto_stories"></span>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 800, color: '#FFFFFF' }}>Quran</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>Recite</div>
                  </div>
                </div>
                
                {/* Sehri Card */}
                <div onClick={goSehri || onSehriTap} style={{ position: 'relative', height: 130, borderRadius: 24, overflow: 'hidden', cursor: 'pointer' }}>
                  <img src={sehriImg} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.6) 0%, transparent 65%)' }} />
                  <div style={{ position: 'absolute', left: 16, bottom: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span className="mi" style={{ fontSize: 18, color: '#FFFFFF' }} data-i="restaurant"></span>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 800, color: '#FFFFFF' }}>Sehri</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>Locations &amp; more</div>
                  </div>
                  {sehriNoteVisible && (
                    <div style={{ position: 'absolute', right: 12, top: 12, background: 'var(--color-info-primary)', color: 'var(--color-info-secondary-inverse)', fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 700, padding: '4px 8px', borderRadius: 8, pointerEvents: 'none' }}>
                      open till 4:15 AM
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right Column (Dua Card) */}
              <div style={{ flex: 1 }}>
                <div onClick={goDua} style={{ position: 'relative', height: '100%', borderRadius: 24, overflow: 'hidden', cursor: 'pointer' }}>
                  <img src={duaImg} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.68) 0%, transparent 58%)' }} />
                  <div style={{ position: 'absolute', left: 16, bottom: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: '#FFFFFF' }}>
                      <path d="M15.40,10.00 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M15.01,12.22 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M13.88,14.18 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M7.77,16.40 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M5.65,15.63 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M3.92,14.18 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M2.79,12.22 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M2.40,10.00 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M2.79,7.78 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M3.92,5.82 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M5.65,4.37 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M7.77,3.60 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M10.03,3.60 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M12.15,4.37 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M13.88,5.82 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M15.01,7.78 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M11.85,15.63 a1.4,1.4 0 1,0 2.8,0 a1.4,1.4 0 1,0 -2.8,0 M14.15,17.63 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M16.15,19.63 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M18.15,21.63 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0" />
                    </svg>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 800, color: '#FFFFFF' }}>Dua &amp; Dikhr</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>Daily supplications</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Explore Masjids Card (Wide) */}
            <div onClick={goMasjids} style={{ position: 'relative', height: 168, borderRadius: 24, overflow: 'hidden', marginTop: 14, cursor: 'pointer' }}>
              <img src={masjidImg} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, transparent 55%)' }} />
              <div style={{ position: 'absolute', left: 20, bottom: 20, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="mi" style={{ fontSize: 20, color: '#FFFFFF' }} data-i="mosque"></span>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>Masjids</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>Explore masjids near you</div>
              </div>
            </div>
          </div>

          {/* Islamic tools */}
          <div style={{ padding: '0 20px 24px' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 20, fontWeight: 700, color: 'var(--color-info-primary)', marginBottom: 14 }}>Islamic tools</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {[
                { img: '../../images/zakaat.webp', label: 'Zakaat', onClick: goZakaat },
                { img: '../../images/hijri.webp', label: 'Hijri', onClick: goHijri },
                { img: '../../images/qibla.png', label: 'Qibla', onClick: goQibla },
                { img: '../../images/99Names.webp', label: '99 Names', onClick: goAsma }
              ].map((t, idx) => (
                <div key={idx} onClick={t.onClick} style={{ background: 'transparent', borderRadius: 16, padding: '8px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <img src={t.img} style={{ width: 48, height: 48, objectFit: 'contain' }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'var(--color-info-primary)', textWrap: 'nowrap' }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Qaum updates carousel */}
          <div style={{ padding: '0 0 12px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 20px', marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 20, fontWeight: 700, color: 'var(--color-info-primary)' }}>Recent from Qaum</div>
              <div style={{ display: 'flex', gap: 3 }}>
                {[0, 1].map((dotIdx) => {
                  const active = slide === dotIdx;
                  return (
                    <div key={dotIdx} onClick={() => onSlideDotTap && onSlideDotTap(dotIdx)} style={{ height: 6, width: active ? 18 : 6, background: active ? 'var(--color-info-primary)' : 'var(--color-info-faint)', borderRadius: 3, transition: 'width 250ms', cursor: 'pointer' }} />
                  );
                })}
              </div>
            </div>

            {/* Carousel wrapper */}
            <div id="qaum-carousel" style={{ display: 'flex', gap: 12, overflowX: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 20px 4px', scrollSnapType: 'x mandatory' }}>
              {/* Card 1 */}
              <div style={{ flexShrink: 0, width: 250, background: 'var(--color-surface-card)', border: '1px solid var(--color-neutral-border)', borderRadius: 16, padding: 14, scrollSnapAlign: 'start', position: 'relative' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1A5E30', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>P</div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: 'var(--color-info-primary)' }}>Paigham</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, color: 'var(--color-info-faint)' }}>Haj 2027 Applications</div>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-info-secondary)', lineHeight: 1.45, height: 54, overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 12 }}>
                  Haj 2027 Applications Are Now Open! Register online on the official website.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div onClick={onHajLike} style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-action-background)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <span className="mi" style={{ fontSize: 12, color: likes.haj.liked ? '#E05060' : 'var(--color-info-faint)', fontVariationSettings: `'FILL' ${likes.haj.liked ? 1 : 0}` }} data-i="favorite"></span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-info-secondary)' }}>{likes.haj.count}</span>
                  <span className="mi" style={{ fontSize: 16, color: 'var(--color-info-faint)', transform: 'scaleX(-1)' }} data-i="reply"></span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-info-faint)', marginLeft: 'auto' }}>2d ago</span>
                </div>
              </div>

              {/* Card 2 */}
              <div style={{ flexShrink: 0, width: 250, background: 'var(--color-surface-card)', border: '1px solid var(--color-neutral-border)', borderRadius: 16, padding: 14, scrollSnapAlign: 'start' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1A5E30', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>P</div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: 'var(--color-info-primary)' }}>Paigham</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, color: 'var(--color-info-faint)' }}>Eid Mubarak announcements</div>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-info-secondary)', lineHeight: 1.45, height: 54, overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 12 }}>
                  We wish you and your family a blessed Eid-ul-Fitr. May Allah accept our fasts.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div onClick={onEidLike} style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-action-background)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <span className="mi" style={{ fontSize: 12, color: likes.eid.liked ? '#E05060' : 'var(--color-info-faint)', fontVariationSettings: `'FILL' ${likes.eid.liked ? 1 : 0}` }} data-i="favorite"></span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-info-secondary)' }}>{likes.eid.count}</span>
                  <span className="mi" style={{ fontSize: 16, color: 'var(--color-info-faint)', transform: 'scaleX(-1)' }} data-i="reply"></span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-info-faint)', marginLeft: 'auto' }}>1w ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* Home Footer (Replicated from HomeFooter.kt) */}
          <div style={{ height: 48 }} />
          <div style={{
            background: 'linear-gradient(to bottom, transparent 0%, color-mix(in oklab, var(--color-surface-secondary) 70%, transparent) 55%, color-mix(in oklab, var(--color-surface-secondary) 90%, transparent) 100%)',
            paddingTop: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            {/* Large Arabic branding "پیغام" in RTL */}
            <div style={{
              fontFamily: '"Noto Nastaliq Urdu", serif',
              fontSize: 72,
              lineHeight: 1.1,
              color: 'var(--color-action-primary)',
              width: '100%',
              textAlign: 'center',
              direction: 'rtl',
              marginBottom: 2
            }}>پیغام</div>
            
            {/* Tagline */}
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              fontWeight: 500,
              color: 'color-mix(in oklab, var(--color-info-secondary) 40%, transparent)',
              textAlign: 'center',
              letterSpacing: '0.02em',
              marginBottom: 24
            }}>a message that connects</div>
            
            {/* Made with ❤️ in Bengaluru, India */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'color-mix(in oklab, var(--color-info-secondary) 40%, transparent)',
              marginBottom: 16
            }}>
              <span>Made with</span>
              <span style={{ color: 'var(--color-info-primary)' }}>❤️</span>
              <span>in Bengaluru, India</span>
            </div>
            
            {/* © 2025 Paigham */}
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 10,
              color: 'color-mix(in oklab, var(--color-info-secondary) 20%, transparent)',
              textAlign: 'center',
              paddingBottom: 40
            }}>© 2025 Paigham</div>
          </div>

        </div>

      </div>
    </div>
  );
}

// ── Qaum audio player (DS .aplayer molecule) helpers ──
const QAUM_AUDIO_TOTAL = 22; // seconds
const QAUM_AMP = Array.from({ length: 38 }, (_, i) =>
  26 + Math.round(Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.33)) * 70));
function qaumBars(frac) {
  const played = Math.round(QAUM_AMP.length * frac);
  return QAUM_AMP.map((h, i) => ({ h: h + '%', on: i < played }));
}
function qaumTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(Math.round(sec) % 60).padStart(2, '0');
  return m + ':' + s;
}
// Reusable .aplayer body (toggle + time + waveform + optional close).
function QaumAudioPlayer({ playing, progress, onToggle, onClose, className = '', style }) {
  const frac = Math.min(1, progress / QAUM_AUDIO_TOTAL);
  const bars = qaumBars(frac);
  return (
    <div className={`aplayer ${className}`} style={style}>
      <button className="ap-toggle" onClick={onToggle} aria-label={playing ? 'Pause' : 'Play'}>
        <span className="mi fill" data-i={playing ? 'pause' : 'play_arrow'}></span>
      </button>
      <span className="ap-time">{qaumTime(progress)}</span>
      <div className="ap-wave">
        {bars.map((b, i) => <i key={i} className={b.on ? 'on' : ''} style={{ '--h': b.h }}></i>)}
        <div className="ap-head" style={{ left: Math.round(frac * 100) + '%' }}></div>
      </div>
      {onClose ? (
        <button className="ap-close" onClick={onClose} aria-label="Close player">
          <span className="mi" data-i="close"></span>
        </button>
      ) : null}
    </div>
  );
}

// Post header (avatar + name + subtitle) and action row (like + reply + time) — shared by feed posts.
function PostHeader({ letter, bg, name, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 700 }}>{letter}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: 'var(--color-info-primary)' }}>{name}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-info-secondary)' }}>{sub}</div>
      </div>
    </div>
  );
}
function PostActions({ liked, count, time, onLike }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div onClick={onLike} style={{ width: 28, height: 28, borderRadius: '50%', background: liked ? 'rgba(224,80,96,0.15)' : 'var(--color-action-background)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: onLike ? 'pointer' : 'default', transition: 'background 200ms' }}>
        <span className="mi" style={{ fontSize: 14, color: liked ? '#E05060' : 'var(--color-info-secondary)', fontVariationSettings: `'FILL' ${liked ? 1 : 0}` }} data-i="favorite"></span>
      </div>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-info-secondary)' }}>{count}</span>
      <span className="mi" style={{ fontSize: 20, color: 'var(--color-info-secondary)', transform: 'scaleX(-1)', cursor: 'pointer' }} data-i="reply"></span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-info-faint)', marginLeft: 'auto' }}>{time}</span>
    </div>
  );
}

const QAUM_MEDIA_TRANSITION_NAME = 'qaum-post-post1-media-0';

function QaumPostMedia({ expanded = false, onOpen, transitionName = 'none' }) {
  const Tag = onOpen ? 'button' : 'div';
  return (
    <Tag
      className={`qaum-post-media${expanded ? ' expanded' : ''}`}
      type={onOpen ? 'button' : undefined}
      onClick={onOpen}
      aria-label={onOpen ? 'Open community gathering image' : undefined}
      style={{ viewTransitionName: transitionName }}
    >
      <img
        src="../../images/intro_qaum.webp"
        alt={expanded ? 'Community gathering at a masjid' : ''}
      />
    </Tag>
  );
}

// 2. QAUM SCREEN
function QaumScreen({
  activeFilter = 0,
  likes = { post1: { liked: true, count: 4 }, post2: { liked: false, count: 2 }, post3: { liked: true, count: 8 } },
  onLike,
  audioPlaying = false,
  audioProgress = 0,     // seconds, of QAUM_AUDIO_TOTAL
  onToggleAudio,
  dock = 'none',         // storyboard override: force the docked player to 'top' | 'bottom'
  onCloseAudio,
  dockBottomOffset = 104, // px from bottom for .dock-bottom (clears the nav bar + a gap; storyboard passes ~14)
  loginNudge = false,    // guest sign-in nudge (PromptCard.error from NudgeInline.kt, Qaum copy)
  onCloseLoginNudge,
  onSignInTap,
  followNudge = false,   // signed-in without a primary masjid (InlineNudge.FollowMasjidSignedIn)
  onCloseFollowNudge,
  onFindMasjid,
  notifNudge = false,    // signed-in with masjid, notifs off (InlineNudge.NotificationPermission)
  onCloseNotifNudge,
  onAllowNotif,
  contentState = 'ready', // 'ready' | 'loading' | 'empty' | 'error'
  onRetry,
  mediaOpen = false,
  mediaTransitionEnabled = false,
  onOpenMedia,
  onCloseMedia,
  onManageMasjid,         // present only for a committee member → the masjid console
  // Send-a-paigham shortcut. Present only for a member who may post; the paigham targets
  // `sendTarget` (their primary managed masjid) and the target is changeable inside compose,
  // so managing several masjids never costs a picker before the action.
  onSendPaigham,
  sendTarget = null,
  fabCompact = false      // storyboard override; the live device lets scroll position decide
}) {
  const { PromptCard, EmptyState } = window;
  const APP_BAR_H = 96;
  // Scroll-driven docking: when the inline player scrolls out of view while playing,
  // the mini player sticks to the nearest edge (top if scrolled above, bottom if below).
  const feedRef = React.useRef(null);
  const inlineRef = React.useRef(null);
  const [scrollDock, setScrollDock] = React.useState('none');

  // The FAB label gets out of the way once the reader starts moving; 24px is past the couple
  // of pixels a rubber-band overscroll produces, so the label does not flicker at rest.
  const [fabScrolled, setFabScrolled] = React.useState(false);

  const recomputeDock = () => {
    const feedEl = feedRef.current, inlEl = inlineRef.current;
    if (feedEl) setFabScrolled(feedEl.scrollTop > 24);
    if (!feedEl || !inlEl) return;
    // Layout coords (offsetTop/scrollTop/clientHeight) are unscaled, so this stays correct
    // even though the live device is rendered at 0.82 scale.
    const top = inlEl.offsetTop - feedEl.scrollTop;      // inline player top, relative to the feed viewport
    const bottom = top + inlEl.offsetHeight;
    if (bottom < APP_BAR_H + 4) setScrollDock('top');                       // scrolled up behind the app bar
    else if (top > feedEl.clientHeight - dockBottomOffset - 4) setScrollDock('bottom'); // scrolled down behind the nav
    else setScrollDock('none');
  };

  React.useEffect(() => {
    const id = requestAnimationFrame(recomputeDock);
    return () => cancelAnimationFrame(id);
  }, [audioPlaying]);

  // Storyboard passes an explicit `dock` to demo the state; the live device leaves it
  // 'none' and lets scroll position decide (only while playing).
  const effectiveDock = (dock && dock !== 'none') ? dock : (audioPlaying ? scrollDock : 'none');

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--color-surface-primary)' }}>

      {/* Feed — scrolls UNDER the app bar (like the Home tab) */}
      <div
        ref={feedRef}
        onScroll={recomputeDock}
        aria-hidden={mediaOpen ? true : undefined}
        style={{ position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingTop: APP_BAR_H, paddingBottom: 90 }}
      >
        {/* Guest sign-in nudge (PromptCard.error, NudgeInline.kt Qaum copy) */}
        {loginNudge && (
          <PromptCard
            variant="error"
            title="Sign in to join Qaum"
            description="React to posts and join conversations on Qaum with your account"
            primaryActionText="Sign In"
            onPrimaryAction={onSignInTap}
            onDismiss={onCloseLoginNudge}
            style={{ margin: '8px 16px 12px' }}
          />
        )}

        {/* Follow-a-Masjid nudge — signed in, no primary masjid (PromptCard.warning, NudgeInline.kt Qaum copy) */}
        {followNudge && (
          <PromptCard
            variant="warning"
            title="Follow a Masjid"
            description="Follow a masjid to see iqama-related posts and updates from your community in Qaum"
            primaryActionText="Find a Masjid"
            primaryActionIcon="mosque"
            onPrimaryAction={onFindMasjid}
            onDismiss={onCloseFollowNudge}
            style={{ margin: '8px 16px 12px' }}
          />
        )}

        {/* Enable-Notifications nudge — signed in with masjid, notifs off (PromptCard.success, NudgeInline.kt Qaum copy) */}
        {notifNudge && (
          <PromptCard
            variant="success"
            title="Enable Notifications"
            description="Enable notifications to stay updated with posts, reactions, and replies in your community"
            primaryActionText="Allow Notifications"
            onPrimaryAction={onAllowNotif}
            onDismiss={onCloseNotifNudge}
            style={{ margin: '8px 16px 12px' }}
          />
        )}

        {contentState === 'loading' && (
          <div className="empty-state" role="status" aria-live="polite">
            <div className="empty-state-icon"><span className="mi" data-i="hourglass_top"></span></div>
            <div className="empty-state-title">Loading community updates</div>
            <div className="empty-state-description">Fetching the latest posts from Paigham and your masjids.</div>
          </div>
        )}

        {contentState === 'empty' && EmptyState && (
          <EmptyState
            icon="group"
            title="No community updates yet"
            description="Posts from Paigham and the masjids you follow will appear here."
          />
        )}

        {contentState === 'error' && EmptyState && (
          <div className="empty-state" role="alert">
            <div className="empty-state-icon"><span className="mi" data-i="error"></span></div>
            <div className="empty-state-title">Couldn’t load Qaum</div>
            <div className="empty-state-description">Check your connection and try again.</div>
            <button className="btn btn-filled empty-state-action" onClick={onRetry}>Try again</button>
          </div>
        )}

        {contentState === 'ready' && (<React.Fragment>
        {/* Post 1 — Paigham · Haj 2027 */}
        <div style={{ borderBottom: '1px solid var(--color-neutral-border)', padding: '16px 16px 14px' }}>
            <PostHeader letter="P" bg="#1A5E30" name="Paigham" sub="Paigham HQ" />
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'color-mix(in oklab, var(--color-info-primary) 85%, transparent)', marginBottom: 10, lineHeight: 1.5 }}>
              Haj 2027 registration is open. Please check the website. <span style={{ fontWeight: 700, color: 'var(--color-info-primary)', cursor: 'pointer' }}>Read more</span>
            </div>
            <QaumPostMedia
              onOpen={onOpenMedia}
              transitionName={!mediaTransitionEnabled || mediaOpen ? 'none' : QAUM_MEDIA_TRANSITION_NAME}
            />
            <PostActions liked={likes.post1.liked} count={likes.post1.count} time="2d ago" onLike={() => onLike && onLike('post1')} />
        </div>

        {/* Post 2 — Paigham · Milad-un-Nabi (gives scroll room above the audio post) */}
        <div style={{ borderBottom: '1px solid var(--color-neutral-border)', padding: '16px 16px 14px' }}>
          <PostHeader letter="P" bg="#1A5E30" name="Paigham" sub="Paigham HQ" />
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'color-mix(in oklab, var(--color-info-primary) 85%, transparent)', marginBottom: 10, lineHeight: 1.5 }}>
            Let us celebrate 1500th Milad-un-Nabi ﷺ by spreading love and charity. <span style={{ fontWeight: 700, color: 'var(--color-info-primary)', cursor: 'pointer' }}>Show more</span>
          </div>
          <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 10, background: 'linear-gradient(150deg,#F7EFD8,#EADFC0)', padding: '22px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 12, letterSpacing: '.14em', color: '#9A7B33', marginBottom: 6 }}>PAIGHAM CELEBRATES &amp; WISHES</div>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 30, lineHeight: 1.05, color: '#8A6B2E' }}>Milad un-Nabi</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: '#9A7B33', marginTop: 8 }}>12 Rabiʼ al-Awwal · 1447 H</div>
          </div>
          <PostActions liked={likes.post3.liked} count={likes.post3.count} time="6mo ago" onLike={() => onLike && onLike('post3')} />
        </div>

        {/* Post 3 — Dargah Masjid · voice note (the playing/inline audio post) */}
        <div style={{ borderBottom: '1px solid var(--color-neutral-border)', padding: '16px 16px 14px' }}>
          <PostHeader letter="D" bg="#2A3580" name="Dargah Masjid" sub="Molkalmuru - 577535" />
          {/* Audio player — DS .aplayer molecule (voice note), inline in the post */}
          <div ref={inlineRef} style={{ marginBottom: 10 }}>
            <QaumAudioPlayer playing={audioPlaying} progress={audioProgress} onToggle={onToggleAudio} />
          </div>
          <PostActions liked={likes.post2.liked} count={likes.post2.count} time="9mo ago" onLike={() => onLike && onLike('post2')} />
        </div>

        {/* Post 4 — Paigham · Islamic New Year (scroll room below the audio post) */}
        <div style={{ borderBottom: '1px solid var(--color-neutral-border)', padding: '16px 16px 14px' }}>
          <PostHeader letter="P" bg="#1A5E30" name="Paigham" sub="Paigham HQ" />
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'color-mix(in oklab, var(--color-info-primary) 85%, transparent)', marginBottom: 10, lineHeight: 1.5 }}>
            Crescent of Muharram Ul Haraam 1447 H has been sighted. <span style={{ fontWeight: 700, color: 'var(--color-info-primary)', cursor: 'pointer' }}>Show more</span>
          </div>
          <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 10, background: 'linear-gradient(160deg,#DCE6EC,#C4D2DB)', padding: '22px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 26, lineHeight: 1.05, color: '#3A4A55' }}>Islamic New Year</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 800, letterSpacing: '.08em', color: '#54646F', marginTop: 8 }}>1 MUHARRAM 1447 H</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: '#7A8A94', marginTop: 3 }}>27 JUNE 2025</div>
          </div>
          <PostActions liked={true} count={10} time="12mo ago" />
        </div>

        {/* Post 5 — Paigham · text announcement (more scroll room) */}
        <div style={{ borderBottom: '1px solid var(--color-neutral-border)', padding: '16px 16px 14px' }}>
          <PostHeader letter="P" bg="#1A5E30" name="Paigham" sub="Paigham HQ" />
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'color-mix(in oklab, var(--color-info-primary) 85%, transparent)', marginBottom: 10, lineHeight: 1.5 }}>
            Important Announcement. Jumuʼah timings for this week have been updated across all masjids. <span style={{ fontWeight: 700, color: 'var(--color-info-primary)', cursor: 'pointer' }}>Show more</span>
          </div>
          <PostActions liked={false} count={5} time="5mo ago" />
        </div>

        {/* Post 6 — Paigham · Ramadan (extra scroll room below so the player can dock to the top) */}
        <div style={{ padding: '16px 16px 20px' }}>
          <PostHeader letter="P" bg="#1A5E30" name="Paigham" sub="Paigham HQ" />
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'color-mix(in oklab, var(--color-info-primary) 85%, transparent)', marginBottom: 10, lineHeight: 1.5 }}>
            Prophet Muhammad ﷺ used to recite the following duʼa in Rajab and Shaʼban. <span style={{ fontWeight: 700, color: 'var(--color-info-primary)', cursor: 'pointer' }}>Show more</span>
          </div>
          <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 10, background: 'linear-gradient(160deg,#E7EEE9,#CFDDD3)', padding: '26px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 22, color: '#3C5245' }}>58 days to go</div>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 26, letterSpacing: '.02em', color: '#2E4638', marginTop: 2 }}>COMING SOON</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 800, letterSpacing: '.1em', color: '#5A7264', marginTop: 8 }}>RAMADAAN 2026</div>
          </div>
          <PostActions liked={true} count={6} time="6mo ago" />
        </div>
        </React.Fragment>)}
      </div>

      {/* App bar — DS .app-bar (transparent, progressive blur), same as the Home tab.
          When the player docks UP, it pins into the app bar's bottom edge (like the Dua
          tab bar), so the bar grows to hold the title + the mini player. */}
      <div aria-hidden={mediaOpen ? true : undefined} className="app-bar" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0, height: effectiveDock === 'top' ? APP_BAR_H + 58 : APP_BAR_H, padding: '54px 14px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="ab-title" style={{ paddingLeft: 4, flex: 1 }}>Qaum</div>
          {/* Committee members post from here, so the console is one tap away. */}
          {onManageMasjid ? (
            <button className="ib ib-tonal" onClick={onManageMasjid} aria-label="Open the masjid console">
              <span className="mi" data-i="dashboard"></span>
            </button>
          ) : null}
        </div>
        {effectiveDock === 'top' && (
          <div style={{ marginTop: 12 }}>
            <QaumAudioPlayer playing={audioPlaying} progress={audioProgress} onToggle={onToggleAudio} onClose={onCloseAudio} />
          </div>
        )}
      </div>

      {/* Bottom dock — floats above the nav bar with a gap between them. */}
      {effectiveDock === 'bottom' && (
        <QaumAudioPlayer
          playing={audioPlaying}
          progress={audioProgress}
          onToggle={onToggleAudio}
          onClose={onCloseAudio}
          className="dock-bottom"
          style={{ bottom: dockBottomOffset }}
        />
      )}

      {/* Send a paigham — the committee's one action on this tab. It sits above the nav bar,
          and lifts clear of the mini player when that docks to the same corner. Hidden while
          the media viewer is open: nothing floats over a full-screen image. */}
      {onSendPaigham && !mediaOpen && (
        <button
          className={`fab ${fabScrolled || fabCompact ? 'compact' : ''}`}
          onClick={onSendPaigham}
          aria-label={sendTarget ? `Send a paigham from ${sendTarget}` : 'Send a paigham'}
          style={{ bottom: effectiveDock === 'bottom' ? dockBottomOffset + 68 : 104 }}
        >
          <span className="mi" data-i="campaign" aria-hidden="true"></span>
          <span className="fab-label">Send a paigham</span>
        </button>
      )}

      {mediaOpen && (
        <div
          className="qaum-media-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Community post image"
          onClick={onCloseMedia}
        >
          <div className="qaum-media-viewer" onClick={(event) => event.stopPropagation()}>
            <button className="qaum-media-close" type="button" onClick={onCloseMedia} aria-label="Close image viewer">
              <span className="mi" data-i="close"></span>
            </button>
            <QaumPostMedia
              expanded
              transitionName={mediaTransitionEnabled ? QAUM_MEDIA_TRANSITION_NAME : 'none'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// 3. QURAN SCREEN
// Surah card row — shared by the Surah list and the grouped Juz list.
// `meta` is the ayah count ("7 ayahs") in the Surah tab, or the ayah range
// ("142 - 252 ayahs") in the Juz tab.
function SurahRow({ n, name, tr, meta, arabic, place, transitionName, onClick }) {
  return (
    <div className="qrow" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="qrow-num">{n}</div>
      <div className="qrow-body">
        <div className="qrow-name">{name}</div>
        <div className="qrow-sub">{tr}</div>
        <div className="qrow-meta">{meta}</div>
      </div>
      <div className="qrow-trail">
        <div className="qrow-ar" style={transitionName ? { viewTransitionName: transitionName } : undefined}>{arabic}</div>
        <div className="qrow-place">{place}</div>
      </div>
    </div>
  );
}

function QuranScreen({
  activeTab = 0, // 0 = Surah, 1 = Juz
  onSelectTab,
  onSelectSurah, // (idx) => open reader from the Surah list
  onSelectJuz,   // (juzIdx) => open reader from the Juz list
  contentState = 'ready',
  onRetry
}) {
  const tabs = [
    { label: 'Surah', index: 0 },
    { label: 'Juz', index: 1 }
  ];

  const surahs = [
    { n: 1,  name: "Al-Faatiha",   tr: "The Opener",        ayahs: 7,   place: "Makkah",  arabic: "سُورَةُ الْفَاتِحَةِ" },
    { n: 2,  name: "Al-Baqara",    tr: "The Cow",           ayahs: 286, place: "Madinah", arabic: "سُورَةُ الْبَقَرَةِ" },
    { n: 3,  name: "Aal-i-Imraan", tr: "Family of Imran",   ayahs: 200, place: "Madinah", arabic: "سُورَةُ الِعِمْرَانِ" },
    { n: 4,  name: "An-Nisaa",     tr: "The Women",         ayahs: 176, place: "Madinah", arabic: "سُورَةُ النِّسَاءِ" },
    { n: 5,  name: "Al-Maaida",    tr: "The Table Spread",  ayahs: 120, place: "Madinah", arabic: "سُورَةُ الْمَائِدَةِ" },
    { n: 6,  name: "Al-An'aam",    tr: "The Cattle",        ayahs: 165, place: "Makkah",  arabic: "سُورَةُ الْأَنْعَامِ" },
    { n: 7,  name: "Al-A'raaf",    tr: "The Heights",       ayahs: 206, place: "Makkah",  arabic: "سُورَةُ الْأَعْرَافِ" },
    { n: 8,  name: "Al-Anfaal",    tr: "The Spoils of War", ayahs: 75,  place: "Madinah", arabic: "سُورَةُ الْأَنْفَالِ" },
    { n: 9,  name: "At-Tawba",     tr: "The Repentance",    ayahs: 129, place: "Madinah", arabic: "سُورَةُ التَّوْبَةِ" }
  ];

  // Juz tab: surahs grouped under each Juz, each with its ayah range for that Juz.
  const juzData = [
    { title: "Juz 1", surahs: [
      { n: 1, name: "Al-Faatiha", tr: "The Opener", range: "1 - 7 ayahs",   arabic: "سُورَةُ الْفَاتِحَةِ", place: "Makkah" },
      { n: 2, name: "Al-Baqara",  tr: "The Cow",    range: "1 - 141 ayahs", arabic: "سُورَةُ الْبَقَرَةِ",  place: "Madinah" }
    ]},
    { title: "Juz 2", surahs: [
      { n: 2, name: "Al-Baqara", tr: "The Cow", range: "142 - 252 ayahs", arabic: "سُورَةُ الْبَقَرَةِ", place: "Madinah" }
    ]},
    { title: "Juz 3", surahs: [
      { n: 2, name: "Al-Baqara",     tr: "The Cow",         range: "253 - 286 ayahs", arabic: "سُورَةُ الْبَقَرَةِ",  place: "Madinah" },
      { n: 3, name: "Aal-i-Imraan",  tr: "Family of Imran", range: "1 - 92 ayahs",    arabic: "سُورَةُ الِعِمْرَانِ", place: "Madinah" }
    ]},
    { title: "Juz 4", surahs: [
      { n: 3, name: "Aal-i-Imraan", tr: "Family of Imran", range: "93 - 200 ayahs", arabic: "سُورَةُ الِعِمْرَانِ", place: "Madinah" },
      { n: 4, name: "An-Nisaa",     tr: "The Women",       range: "1 - 23 ayahs",   arabic: "سُورَةُ النِّسَاءِ",  place: "Madinah" }
    ]}
  ];

  const QURAN_APPBAR_H = 150;
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--color-surface-primary)' }}>

      {/* List content — scrolls UNDER the app bar. The app-bar offset lives on the
          inner div, NOT as padding on the scroller: sticky offsets resolve against the
          scroller's content edge, so scroller padding would push the pinned Juz headers
          down by that amount. */}
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ padding: `${QURAN_APPBAR_H + 4}px 16px 90px` }}>
        {contentState === 'loading' ? (
          <div className="empty-state" role="status" aria-live="polite">
            <div className="empty-state-icon"><span className="mi" data-i="hourglass_top"></span></div>
            <div className="empty-state-title">Loading Quran index</div>
            <div className="empty-state-description">Preparing the Surah and Juz listings.</div>
          </div>
        ) : contentState === 'empty' ? (
          <EmptyState
            icon="auto_stories"
            title="No Quran entries available"
            description="The Quran index is currently empty."
          />
        ) : contentState === 'error' ? (
          <div className="empty-state" role="alert">
            <div className="empty-state-icon"><span className="mi" data-i="error"></span></div>
            <div className="empty-state-title">Couldn’t load Quran</div>
            <div className="empty-state-description">Check your connection and try again.</div>
            <button className="btn btn-filled empty-state-action" onClick={onRetry}>Try again</button>
          </div>
        ) : activeTab === 0 ? (
          /* Surah tab — flat list of surah cards (name · translation · ayah count) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {surahs.map((s, idx) => (
              <SurahRow
                key={idx}
                n={s.n}
                name={s.name}
                tr={s.tr}
                meta={`${s.ayahs} ayahs`}
                arabic={s.arabic}
                place={s.place}
                transitionName={`quran-surah-${s.n}`}
                onClick={() => onSelectSurah && onSelectSurah(s)}
              />
            ))}
          </div>
        ) : (
          /* Juz tab — grouped by Juz; the title lives INSIDE the group card (like the
             reference app) and sticks below the app bar while its group scrolls, so the
             pinned title always names the Juz currently under the finger. */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {juzData.map((j, ji) => (
              <div key={ji} style={{ background: 'color-mix(in oklab, var(--color-info-primary) 3%, var(--color-surface-primary))', border: '1px solid var(--color-neutral-border)', borderRadius: 20 }}>
                <div style={{ position: 'sticky', top: QURAN_APPBAR_H, zIndex: 2, background: 'color-mix(in oklab, var(--color-info-primary) 3%, var(--color-surface-primary))', borderRadius: '20px 20px 0 0', padding: '12px 16px 8px', fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 800, color: 'var(--color-info-primary)' }}>{j.title}</div>
                <div style={{ padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {j.surahs.map((s, si) => (
                    <SurahRow
                      key={si}
                      n={s.n}
                      name={s.name}
                      tr={s.tr}
                      meta={s.range}
                      arabic={s.arabic}
                      place={s.place}
                      transitionName={`quran-juz-${ji + 1}-surah-${s.n}`}
                      onClick={() => onSelectJuz && onSelectJuz(ji + 1, s)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* App bar — DS .app-bar with the Surah/Juz segmented tabs pinned in (like the Dua tab bar) */}
      <div className="app-bar" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0, height: QURAN_APPBAR_H, padding: '54px 16px 10px' }}>
        <div className="ab-title" style={{ paddingLeft: 2 }}>Quran</div>
        <div className="tbar" style={{ marginTop: 12 }}>
          {tabs.map((t, idx) => (
            <div key={idx} className={`tab ${activeTab === t.index ? 'active' : ''}`} onClick={() => onSelectTab && onSelectTab(t.index)}>{t.label}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 4. SALAAH SCREEN
function SalaahScreen({
  masjidLetter = "B",
  masjidName = "Masjid E Bilal",
  masjidSub = "Bannerghatta Road, Bengaluru",
  onMasjidSheetToggle,
  showMasjidSheet = false,
  onSelectMasjid,
  prayersAlert = { Fajr: false, Zohar: true, Asr: false, Maghrib: true, Isha: false },
  prayersChecked = { Fajr: true, Zohar: true, Asr: true, Maghrib: false, Isha: false },
  onToggleCheck,
  onToggleAlert,
  // Guest mode (SalaahTab.kt): approximate location timings, no masjid, no tracking.
  guest = false,
  loginNudge = false,       // guest sign-in nudge (PromptCard.error, NudgeInline.kt Salaah copy)
  onCloseLoginNudge,
  onSignInTap,
  loginSheet = false,       // "Sign in to continue" LoginSheet — opened by auth-gated taps
  onOpenLoginSheet,
  onCloseLoginSheet,
  // Signed in without a primary masjid: same approximate timings, but tracking works.
  noMasjid = false,
  followNudge = false,      // follow-masjid nudge (PromptCard.warning, NudgeInline.kt Salaah copy)
  onCloseFollowNudge,
  onFindMasjid,
  notifNudge = false,       // signed-in with masjid, notifs off (InlineNudge.NotificationPermission)
  onCloseNotifNudge,
  onAllowNotif,
  // Timings are public — anyone signed in may correct any masjid's times. The shortcut only
  // appears when the times on screen actually belong to a masjid: the approximate-location
  // fallback has no record to publish to, so there is nothing there to update.
  onEditTimings,
  fabCompact = false        // storyboard override; the live device lets scroll position decide
}) {
  const { PromptCard, Dialog } = window;
  // No masjid followed (guest or signed-in): approximate city timings — no iqama
  // config, so Iqama mirrors Azaan and the date pager row shows.
  const approx = guest || noMasjid;
  // The correction shortcut needs a masjid record behind the numbers on screen.
  const showEditFab = !!onEditTimings && !approx;
  const [fabScrolled, setFabScrolled] = React.useState(false);
  const prayerData = approx ? [
    { name: 'Fajr', azaan: '4:42 AM', iqama: '4:42 AM' },
    { name: 'Zohar', azaan: '12:26 PM', iqama: '12:26 PM' },
    { name: 'Asr', azaan: '4:58 PM', iqama: '4:58 PM' },
    { name: 'Maghrib', azaan: '6:50 PM', iqama: '6:50 PM' },
    { name: 'Isha', azaan: '8:08 PM', iqama: '8:08 PM' }
  ] : [
    { name: 'Fajr', azaan: '4:36 AM', iqama: '5:00 AM' },
    { name: 'Zohar', azaan: '12:35 PM', iqama: '1:00 PM' },
    { name: 'Asr', azaan: '4:52 PM', iqama: '5:15 PM' },
    { name: 'Maghrib', azaan: '6:49 PM', iqama: '6:52 PM' },
    { name: 'Isha', azaan: '8:05 PM', iqama: '8:30 PM' }
  ];
  const sunTimes = approx ? [
    { label: 'Sehri', time: '4:32 AM' },
    { label: 'Sunrise', time: '6:00 AM' },
    { label: 'Iftaar', time: '6:50 PM' }
  ] : [
    { label: 'Sehri', time: '4:31 AM' },
    { label: 'Sunrise', time: '5:55 AM' },
    { label: 'Iftaar', time: '6:49 PM' }
  ];

  // ── GitHub-style attendance heatmap ─────────────────────────────────────
  // Continuous weekday(row) × week(column) grid over the Hijri year, labelled by
  // month. The grid ENDS at "today" (in the current month), so there are no future
  // columns to scroll into; on mount we pin the scroll to the far right (this month).
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const HIJRI = ['Muh', 'Saf', 'Rab1', 'Rab2', 'Jum1', 'Jum2', 'Raj', 'Shb', 'Ram', 'Shw', 'DhQ', 'DhH'];
  const START_DOW = 2;                     // year's first day lands on Tue
  const MONTH_LEN = 30;
  const TODAY = 11 * MONTH_LEN + 20;       // ~20 Dhul Hijjah → current month is the end
  const TOTAL = TODAY + 1;
  const LVL = [5, 4, 0, 3, 5, 2, 5, 1, 4, 0, 5, 3, 5, 2, 4, 0, 5, 3, 1, 5, 4, 2, 5, 0];
  const numCols = Math.ceil((START_DOW + TOTAL) / 7);
  const grid = Array.from({ length: 7 }, () => new Array(numCols).fill(undefined));
  for (let d = 0; d < TOTAL; d++) {
    const slot = START_DOW + d;
    grid[slot % 7][Math.floor(slot / 7)] = LVL[d % LVL.length];
  }
  const monthLabelByCol = {};
  HIJRI.forEach((lbl, m) => { monthLabelByCol[Math.floor((START_DOW + m * MONTH_LEN) / 7)] = lbl; });
  const cols = Array.from({ length: numCols }, (_, i) => i);
  const CELL = 12, GAP = 3, LABEL_H = 14;
  const cellBg = (v) => (v === undefined || v === 0)
    ? 'color-mix(in oklab, var(--color-info-primary) 7%, transparent)'
    : `color-mix(in oklab, var(--color-action-primary) ${({ 1: 25, 2: 45, 3: 65, 4: 85, 5: 100 })[v]}%, transparent)`;

  const heatRef = React.useRef(null);
  React.useEffect(() => { const el = heatRef.current; if (el) el.scrollLeft = el.scrollWidth; }, []);

  const SAL_APPBAR_H = 96;
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--color-surface-primary)' }}>

      {/* Scrollable content — scrolls under the app bar */}
      <div
        onScroll={(e) => setFabScrolled(e.target.scrollTop > 24)}
        style={{ position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingTop: SAL_APPBAR_H, paddingBottom: showEditFab ? 150 : 80 }}
      >
        <div style={{ padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Guest sign-in nudge (PromptCard.error, NudgeInline.kt Salaah copy) */}
        {loginNudge && (
          <PromptCard
            variant="error"
            title="Sign in for iqama times & reminders"
            description="Follow a masjid for iqama times and prayer reminders on every device where you use Paigham"
            primaryActionText="Sign In"
            onPrimaryAction={onSignInTap}
            onDismiss={onCloseLoginNudge}
          />
        )}

        {/* Follow-a-Masjid nudge — signed in, no primary masjid (PromptCard.warning, NudgeInline.kt Salaah copy) */}
        {followNudge && (
          <PromptCard
            variant="warning"
            title="Follow a Masjid"
            description="Follow a masjid for iqama times and prayer reminders from that masjid"
            primaryActionText="Find a Masjid"
            primaryActionIcon="mosque"
            onPrimaryAction={onFindMasjid}
            onDismiss={onCloseFollowNudge}
          />
        )}

        {/* Enable-Notifications nudge — signed in with masjid, notifs off (PromptCard.success, NudgeInline.kt Salaah copy) */}
        {notifNudge && (
          <PromptCard
            variant="success"
            title="Enable Notifications"
            description="Get timely reminders for Iqama times and prayer alerts from your followed Masjids"
            primaryActionText="Allow Notifications"
            onPrimaryAction={onAllowNotif}
            onDismiss={onCloseNotifNudge}
          />
        )}

        {/* Approx-location date pager row (Hijri date + prev/next) */}
        {approx && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <button className="ib ib-tonal primary md" aria-label="Previous day">
              <span className="mi" data-i="chevron_left"></span>
            </button>
            <div style={{ textAlign: 'center', minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 21, color: 'var(--color-info-primary)', letterSpacing: '-0.3px' }}>27th Muharram 1448</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-info-secondary)', marginTop: 2 }}>Mon, Jul 13</div>
            </div>
            <button className="ib ib-tonal primary md" aria-label="Next day">
              <span className="mi" data-i="chevron_right"></span>
            </button>
          </div>
        )}

        {/* Timings card */}
        <div style={{ background: 'color-mix(in oklab, var(--color-action-primary) 5%, var(--color-surface-primary))', border: '1px solid color-mix(in oklab, var(--color-action-primary) 25%, transparent)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ display: 'flex', padding: '12px 16px 8px', borderBottom: '1px solid var(--color-neutral-border)' }}>
            <div style={{ flex: 1 }} />
            <div style={{ width: 80, textAlign: 'center' }}><span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--color-info-secondary)' }}>Azaan</span></div>
            <div style={{ width: 100, textAlign: 'right' }}><span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--color-info-secondary)' }}>Iqama</span></div>
          </div>

          {prayerData.map((p, idx) => {
            // Guest: tracking is auth-gated — checks stay empty and taps open the LoginSheet.
            // Approx (no masjid): local azan alerts are on by default, not per-masjid toggles.
            const checked = !guest && prayersChecked[p.name];
            const alertOn = approx || prayersAlert[p.name];
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid color-mix(in oklab, var(--color-info-primary) 6%, transparent)' }}>
                <div onClick={() => guest ? (onOpenLoginSheet && onOpenLoginSheet()) : (onToggleCheck && onToggleCheck(p.name))} className={`cb small ${checked ? 'on' : ''}`} style={{ marginRight: 10 }}>
                  {checked && <span className="mi" data-i="check"></span>}
                </div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: 'var(--color-info-primary)', flex: 1 }}>{p.name}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-info-secondary)', width: 80, textAlign: 'center' }}>{p.azaan}</span>
                <div style={{ width: 100, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-info-primary)' }}>{p.iqama}</span>
                  <span onClick={() => !approx && onToggleAlert && onToggleAlert(p.name)} className={`mi ${alertOn ? 'fill' : ''}`} style={{ fontSize: 18, color: alertOn ? 'var(--color-action-primary)' : 'var(--color-info-faint)', cursor: 'pointer' }} data-i="campaign"></span>
                </div>
              </div>
            );
          })}

          {/* Sehri · Sunrise · Iftaar */}
          <div style={{ display: 'flex', padding: '14px 16px 16px' }}>
            {sunTimes.map((s, idx) => (
              <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-info-secondary)', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700, color: 'var(--color-info-primary)' }}>{s.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance heatmap (GitHub-style, Hijri month-wise) — tracking is signed-in only */}
        {!guest && <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14, gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-title)', fontSize: 19, color: 'var(--color-info-primary)', letterSpacing: '-0.3px' }}>Muharram - Dhul Hijjah 1446</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--color-action-primary)', textDecoration: 'underline', cursor: 'pointer', whiteSpace: 'nowrap' }}>⇄ English</span>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {/* weekday labels (fixed) */}
            <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ height: LABEL_H + GAP }} />
              {DAY_LABELS.map((d, i) => (
                <div key={i} style={{ height: CELL, marginBottom: i === 6 ? 0 : GAP, display: 'flex', alignItems: 'center', fontFamily: 'var(--font-body)', fontSize: 9, color: 'var(--color-info-secondary)' }}>{d}</div>
              ))}
            </div>

            {/* scrollable weeks */}
            <div ref={heatRef} style={{ overflowX: 'auto', flex: 1 }}>
              <div style={{ width: 'max-content' }}>
                {/* month labels */}
                <div style={{ display: 'flex', gap: GAP, height: LABEL_H, marginBottom: GAP }}>
                  {cols.map((c) => (
                    <div key={c} style={{ width: CELL, flexShrink: 0, fontFamily: 'var(--font-body)', fontSize: 9, color: 'var(--color-info-secondary)', whiteSpace: 'nowrap', overflow: 'visible' }}>{monthLabelByCol[c] || ''}</div>
                  ))}
                </div>
                {/* weekday rows */}
                {grid.map((rowCells, r) => (
                  <div key={r} style={{ display: 'flex', gap: GAP, marginBottom: r === 6 ? 0 : GAP }}>
                    {rowCells.map((v, c) => (
                      <div key={c} style={{ width: CELL, height: CELL, flexShrink: 0, borderRadius: 3, background: cellBg(v) }} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* legend */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 10 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-info-secondary)', marginRight: 2 }}>0</span>
            {[0, 1, 2, 3, 4, 5].map((l) => (
              <div key={l} style={{ width: 12, height: 12, borderRadius: 3, background: cellBg(l) }} />
            ))}
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-info-secondary)', marginLeft: 2 }}>5 times</span>
          </div>
        </div>}

        </div>
      </div>

      {/* App bar — DS .app-bar (progressive blur); masjid selector pinned in.
          No masjid followed — approximate location label (SalaahTab.kt); guest tap opens the LoginSheet. */}
      {approx ? (
        <div className="app-bar" style={{ alignItems: 'center', height: SAL_APPBAR_H, padding: '54px 16px 10px' }} onClick={guest ? onOpenLoginSheet : undefined}>
          <div style={{ flex: 1, minWidth: 0, cursor: guest ? 'pointer' : 'default' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-sm)', color: 'var(--color-info-primary)' }}>
              <span className="mi" data-i="location_on" aria-hidden="true" style={{ fontSize: 'var(--icon-md)' }}></span>
              <span style={{ fontFamily: 'var(--font-title)', fontSize: 22, letterSpacing: '-0.3px' }}>Bangalore (Approx.)</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="app-bar" style={{ alignItems: 'center', height: SAL_APPBAR_H, padding: '54px 16px 10px' }} onClick={onMasjidSheetToggle}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--color-action-secondary)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-title)', fontSize: 20 }}>{masjidLetter}</div>
          <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontFamily: 'var(--font-title)', fontSize: 22, color: 'var(--color-info-primary)', letterSpacing: '-0.3px' }}>{masjidName}</span>
              <span className="mi" style={{ fontSize: 20, color: 'var(--color-info-secondary)' }} data-i="keyboard_arrow_down"></span>
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-info-secondary)' }}>{masjidSub}</div>
          </div>
        </div>
      )}

      {/* Update timings — public, so this is not gated on a role. It only appears when the
          times shown belong to a masjid; the approximate-location fallback has no record to
          publish to. Clears the nav bar the same distance as the Qaum FAB. */}
      {showEditFab && (
        <button
          className={`fab ${fabScrolled || fabCompact ? 'compact' : ''}`}
          onClick={onEditTimings}
          aria-label={`Update salaah timings for ${masjidName}`}
          style={{ bottom: 104 }}
        >
          <span className="mi" data-i="mosque_clock2" aria-hidden="true"></span>
          <span className="fab-label">Update timings</span>
        </button>
      )}

      {/* Guest LoginSheet (LoginSheet.kt defaults) — auth-gated taps land here */}
      <Dialog
        mode="sheet"
        isOpen={guest && loginSheet}
        onClose={onCloseLoginSheet}
        title="Sign in to continue"
        description="Enter your phone number to unlock your account and stay connected with your community."
        primary={{ text: 'Sign in', onClick: onSignInTap }}
        secondary={{ text: 'Cancel', onClick: onCloseLoginSheet }}
      />

      {/* Masjid switcher — DS bottom-sheet dialog (only when a masjid is followed) */}
      {!approx && showMasjidSheet && (
        <div className="dlg-scrim sheet" onClick={onMasjidSheetToggle}>
          <div className="dlg" onClick={(e) => e.stopPropagation()}>
            <div className="dlg-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="dlg-title">Switch Masjid</span>
              <span onClick={onMasjidSheetToggle} className="mi" style={{ fontSize: 24, color: 'var(--color-info-faint)', cursor: 'pointer' }} data-i="close"></span>
            </div>
            <div className="dlg-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { letter: 'B', name: 'Masjid E Bilal', sub: 'Bannerghatta Road, Bengaluru', bg: 'var(--color-action-secondary)' },
                { letter: 'Q', name: 'Masjid E Quba', sub: 'Jayanagar, Bengaluru', bg: 'var(--color-action-primary)' }
              ].map((m, idx) => (
                <div key={idx} onClick={() => onSelectMasjid && onSelectMasjid(m.name)} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, background: m.name === masjidName ? 'var(--color-action-background)' : 'transparent', borderRadius: 12, cursor: 'pointer' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.bg, color: '#fff', fontFamily: 'var(--font-title)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{m.letter}</div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: 'var(--color-info-primary)' }}>{m.name}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-info-secondary)' }}>{m.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 5. PROFILE SCREEN
const PROFILE_ADMIN_TRANSITION_NAME = 'masjid-admin-masjid-e-bilal-title';

function ProfileScreen({
  userName = "Toufeeq",
  phone = "+91 87928 13003",
  version = "1.0.0",
  masjidName = "Masjid E Bilal",
  showMyMasjids = true,
  showManagedMasjid = false,
  managedCount = 1,          // how many masjids this member manages (the console switches between them)
  managedAttention = 0,      // things waiting inside the console (suggestions, unaccepted invites)
  onMyMasjids,             // tap the My Masjids row → open My Masjids sheet (masjid-register board)
  onManageMasjid,
  adminTransitionEnabled = false,
  onRegister,
  onInvite,
  onApprove,
  onTerms,
  onPrivacy,
  onAbout,
  logoutOpen = false,
  onToggleLogoutSheet,
  onConfirmLogout
}) {
  // Settings row (ProfileTab.kt ProfileItem): leading icon · label · optional trailing value · chevron.
  const renderRow = (r, last) => (
    <div key={r.label} onClick={r.onClick} className="prow" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderBottom: last ? 'none' : '1px solid var(--color-neutral-border)' }}>
      <span className="mi" style={{ fontSize: 22, color: r.destructive ? 'var(--color-status-error)' : 'var(--color-info-secondary)' }} data-i={r.icon}></span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: r.destructive ? 'var(--color-status-error)' : 'var(--color-info-primary)', flex: 1, viewTransitionName: r.transitionName || 'none' }}>{r.label}</span>
      {r.value ? <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-info-secondary)' }}>{r.value}</span> : null}
      <span className="mi" style={{ fontSize: 20, color: r.destructive ? 'color-mix(in oklab, var(--color-status-error) 40%, transparent)' : 'var(--color-info-faint)' }} data-i="chevron_right"></span>
    </div>
  );

  const cards = [
    showMyMasjids && onMyMasjids
      ? [
          { icon: 'mosque', label: 'My Masjids', value: masjidName, onClick: onMyMasjids },
          { icon: 'add', label: 'Register a Masjid', onClick: onRegister }
        ]
      : [{ icon: 'add', label: 'Register a Masjid', onClick: onRegister }],
    [
      { icon: 'groups_outlined', label: 'Invite your Friends', onClick: onInvite },
      { icon: 'check_circle', label: 'Approve Friends', onClick: onApprove }
    ],
    [
      { icon: 'contract', label: 'Terms & Conditions', onClick: onTerms },
      { icon: 'security', label: 'Privacy Policy', onClick: onPrivacy },
      { icon: 'info', label: 'About', value: `Version ${version}`, onClick: onAbout }
    ],
    [{ icon: 'arrow_back', label: 'Log Out', destructive: true, onClick: onToggleLogoutSheet }]
  ];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-surface-primary)' }}>
      {/* Scroll container */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 80 }}>
        {/* Profile Hero — avatar + name + phone (no masjid when none followed) */}
        <div className="p-hero" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '56px 20px 28px', background: 'var(--gradient-emerald)' }}>
          <div style={{ width: 112, height: 112, borderRadius: '50%', background: 'color-mix(in oklab, var(--color-action-secondary) 22%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-title)', fontSize: 44, color: 'var(--color-info-primary)' }}>{userName.charAt(0)}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 28, color: 'var(--color-info-primary)', marginBottom: 4 }}>{userName}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--color-info-secondary)' }}>{phone}</div>
          </div>
        </div>

        {/* Console entry — the only door into the masjid console. A card, not a settings
            row: the masjid's mark, its name, your role, and what is waiting for you. */}
        {showManagedMasjid && onManageMasjid ? (
          <div style={{ padding: '4px 16px 0' }}>
            <button className="manage-entry" onClick={onManageMasjid}>
              <span className="masjid-mark" style={{ '--tile': '46px' }}>
                <img src="../../images/masjid-camera-preview.png" alt="" />
              </span>
              <span className="manage-entry-copy">
                <span className="manage-entry-eyebrow">You manage this masjid</span>
                <span
                  className="manage-entry-name"
                  style={{ viewTransitionName: adminTransitionEnabled ? PROFILE_ADMIN_TRANSITION_NAME : 'none' }}
                >{masjidName}</span>
                <span className="manage-entry-role">Chairman · full admin{managedCount > 1 ? ` · and ${managedCount - 1} more` : ''}</span>
              </span>
              {managedAttention ? <span className="badge sm amber" aria-label={`${managedAttention} need your attention`}>{managedAttention}</span> : null}
              <span className="mi manage-entry-go" data-i="chevron_right"></span>
            </button>
          </div>
        ) : null}

        {/* Settings cards */}
        <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {cards.map((rows, ci) => (
            <div key={ci} style={{ background: 'var(--color-surface-card)', borderRadius: 16, overflow: 'hidden' }}>
              {rows.map((r, ri) => renderRow(r, ri === rows.length - 1))}
            </div>
          ))}
        </div>

        {/* Footer branding */}
        <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
          <span style={{ fontFamily: '"Noto Nastaliq Urdu", serif', fontSize: 34, lineHeight: 1.4, color: 'var(--color-info-primary)', direction: 'rtl' }}>پیغام</span>
        </div>
      </div>

      {/* Logout sheet overlay */}
      {logoutOpen && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', background: 'var(--color-surface-primary)', borderRadius: '24px 24px 0 0', padding: 24, boxSizing: 'border-box' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 800, color: 'var(--color-info-primary)', marginBottom: 8, textWrap: 'balance' }}>Are you sure you want to log out?</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-info-secondary)', marginBottom: 20 }}>You'll need to sign in again to access your account.</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={onToggleLogoutSheet} className="btn btn-tonal lg" style={{ flex: 1 }}>Cancel</button>
              <button onClick={onConfirmLogout} className="btn btn-filled lg" style={{ flex: 1, background: 'var(--color-status-error)', color: '#fff' }}>Log out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Rich follow-masjid sheet (UserOnboardingNudge.kt + NudgeSheetFactory.kt FirstTimeFollowMasjid).
// Shown once per cold start to signed-in users without a primary masjid, alongside the inline nudge.
// RichNudgeSheet is the shared shell (see _theme/components.jsx); this supplies the content preset.
function MasjidNudgeSheet({ isOpen, onClose, onFindMasjid }) {
  const { RichNudgeSheet } = window;
  return (
    <RichNudgeSheet
      isOpen={isOpen}
      onClose={onClose}
      illustration="../../images/follow_masjids.webp"
      title="Pick your masjid, stay in sync"
      description="Choose a masjid you trust—iqama times and community updates stay with you here."
      benefits={[
        { icon: 'explore', title: 'Explore before you follow.', caption: 'Browse nearby masjids on the map, then pick the one you trust.' },
        { icon: 'schedule', title: 'Iqama times that match your masjid.', caption: 'Prayer times reflect the schedule from the masjid you follow.' },
        { icon: 'campaign', title: 'Updates in one place.', caption: 'Hear what matters from your masjid inside the app.' }
      ]}
      primaryText="Find my masjid"
      onPrimary={onFindMasjid}
    />
  );
}

// Rich notification sheet (NotificationPermissionSheetContent.kt + NudgeSheetFactory.kt
// NotificationPermission). Shown once to signed-in users with a masjid but notifs off,
// on the 2nd qualifying Home/Salaah visit.
function NotificationNudgeSheet({ isOpen, onClose, onAllow }) {
  const { RichNudgeSheet } = window;
  return (
    <RichNudgeSheet
      isOpen={isOpen}
      onClose={onClose}
      illustration="../../images/notifications_request_illustration.webp"
      title="Stay in the loop"
      description="Turn on notifications for prayer reminders and timely updates in Paigham."
      benefits={[
        { icon: 'schedule', title: 'Prayer times, right on time.', caption: 'Get reminders before each salah so you never miss a prayer.' },
        { icon: 'menu_book', title: 'Quran and duas at your fingertips.', caption: 'Gentle nudges to keep your daily practice consistent.' },
        { icon: 'campaign', title: 'Community updates in one place.', caption: 'Stay connected with your masjid and the broader ummah.' }
      ]}
      primaryText="Allow"
      onPrimary={onAllow}
      secondaryText="Maybe later"
    />
  );
}

// ATT pre-prompt / privacy-consent sheet (AttPermissionSheetContent.kt). Device-level, like the
// other nudge sheets, so it stays fixed over the whole screen (incl. the nav bar) and never
// scrolls with the Home content. Continue → the system ATT dialog; Not now dismisses.
function PrivacyNudgeSheet({ isOpen, onClose, onContinue }) {
  const { RichNudgeSheet } = window;
  return (
    <RichNudgeSheet
      isOpen={isOpen}
      onClose={onClose}
      showClose={false}
      icon="security"
      title="Your privacy, your choice"
      description="We use anonymised data to personalise your experience and show relevant Islamic content."
      benefits={[
        { icon: 'security', title: 'Private by design.', caption: 'All data is anonymised before use. No personal identifiers are stored.' },
        { icon: 'person', title: 'Tailored to you.', caption: 'Quran, duas, and community content matched to your interests.' },
        { icon: 'campaign', title: 'Help us grow.', caption: 'Your choice helps us make Paigham better for the whole ummah.' }
      ]}
      primaryText="Continue"
      onPrimary={onContinue}
      secondaryText="Not now"
    />
  );
}

// iOS App Tracking Transparency system dialog — device-level centred modal (fixed, no scroll).
function AttDialog({ isOpen, onChoice }) {
  if (!isOpen) return null;
  const btn = {
    background: 'transparent', border: 'none', color: '#0A84FF', fontSize: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '11px 8px', width: '100%', cursor: 'pointer', outline: 'none'
  };
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.4)', zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 270, background: 'rgba(33, 33, 33, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: 14, boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)', border: '0.5px solid rgba(255, 255, 255, 0.15)', textAlign: 'center', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Orange tracking card icon */}
        <div style={{ width: 60, height: 60, background: 'linear-gradient(135deg, #FF9500, #FF5E3A)', borderRadius: 14, margin: '16px auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <span className="mi" style={{ fontSize: 32, color: '#FFFFFF' }} data-i="sensors"></span>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#007AFF', position: 'absolute', bottom: -4, right: -4, border: '2px solid #202020', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="mi" style={{ fontSize: 11, color: '#FFFFFF' }} data-i="front_hand"></span>
          </div>
        </div>
        <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontSize: 15, fontWeight: 600, color: '#FFFFFF', padding: '0 16px', lineHeight: 1.3 }}>Allow “Paigham” to track your activity across other companies’ apps and websites?</div>
        <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontSize: 12, color: '#EBEBF5', opacity: 0.8, padding: '6px 16px 16px', lineHeight: 1.3 }}>Paigham uses this identifier to personalise your experience</div>
        <div style={{ borderTop: '0.5px solid rgba(255, 255, 255, 0.15)' }}>
          <button onClick={onChoice} style={{ ...btn, fontWeight: 400 }}>Ask App Not to Track</button>
        </div>
        <div style={{ borderTop: '0.5px solid rgba(255, 255, 255, 0.15)' }}>
          <button onClick={onChoice} style={{ ...btn, fontWeight: 600 }}>Allow</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, QaumScreen, QuranScreen, SalaahScreen, ProfileScreen, MasjidNudgeSheet, NotificationNudgeSheet, PrivacyNudgeSheet, AttDialog });

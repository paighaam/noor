// A color-only comparison of the real Admin screens and fixtures.
// No duplicate component markup or business behavior lives in this preview.
(function () {
  const screens = {
    hub: 'AdminHubScreen', invalid: 'AdminInvalidScreen',
    signups: 'AdminSignupsScreen', approvals: 'AdminApprovalsScreen', lead: 'AdminLeadScreen',
    moderation: 'AdminModerationScreen', post: 'AdminPostScreen',
  };
  const palettes = [
    { id: 'navy', name: 'Navy & sapphire', description: 'Cool, crisp blues', icon: './assets/admin-icon-preview.svg', alt: 'Pale blue arch and gold mark on navy' },
    { id: 'plum', name: 'Plum & linen', description: 'Soft, warm purples', icon: './assets/admin-icon-plum.svg', alt: 'Pale lilac arch and gold mark on deep plum' },
    { id: 'copper', name: 'Copper & ivory', description: 'Earthy, warm neutrals', icon: './assets/admin-icon-copper.svg', alt: 'Pale copper arch and gold mark on espresso' },
    { id: 'graphite', name: 'Graphite & gold', description: 'Quiet, neutral tones', icon: './assets/admin-icon-graphite.svg', alt: 'Champagne arch and gold mark on charcoal' },
    { id: 'teal', name: 'Teal & mist', description: 'Muted coastal greens', icon: './assets/admin-icon-teal.svg', alt: 'Pale mint arch and gold mark on deep teal' },
    { id: 'wine', name: 'Wine & parchment', description: 'Rich burgundy and rose', icon: './assets/admin-icon-wine.svg', alt: 'Pale rose arch and gold mark on burgundy' },
    { id: 'olive', name: 'Olive & sand', description: 'Natural, muted greens', icon: './assets/admin-icon-olive.svg', alt: 'Pale olive arch and gold mark on dark olive' },
  ];

  function ThemeFrame({ frame, palette }) {
    const Screen = window[screens[frame.screen]];
    const data = window.buildAdminData(window.adminFrameState(frame), {});
    // The shared fixtures are relative to the Admin board, one directory above this
    // preview. Adjust only the assembled display data; never mutate shared fixtures.
    const previewImage = (path) => typeof path === 'string' && path.startsWith('../../images/')
      ? path.replace('../../images/', '../../../images/') : path;
    const previewLead = (lead) => ({ ...lead,
      masjidPhoto: previewImage(lead.masjidPhoto),
      verificationPhoto: previewImage(lead.verificationPhoto),
    });
    const previewPost = (post) => ({ ...post, images: (post.images || []).map(previewImage) });
    if (data.lead) data.lead = previewLead(data.lead);
    data.visibleLeads = (data.visibleLeads || []).map(previewLead);
    if (data.sourced) data.sourced = { ...data.sourced, photo: previewImage(data.sourced.photo) };
    if (data.post) data.post = previewPost(data.post);
    data.visiblePosts = (data.visiblePosts || []).map(previewPost);
    return (
      <section className="admin-theme-column">
        <div className="admin-theme-label">
          <strong>{palette ? `Admin · ${palette.name}` : 'Current · Paigham green'}</strong>
          <span>{palette ? palette.id === 'olive' ? 'Approved color preset' : 'Alternative color preset' : 'Existing color preset'}</span>
        </div>
        <div className="noor-frame" data-brand={palette ? 'admin' : undefined} data-admin-palette={palette ? palette.id : undefined}>
          <div className="noor-frame-inner">
            <div className="noor-screen" onClickCapture={(event) => {
              // Shared screens include live links. This comparison deliberately stays
              // read-only, including keyboard activation, while retaining body scrolling.
              event.preventDefault();
              event.stopPropagation();
            }}>
              <div className="noor-island"></div>
              {Screen ? <Screen data={data} /> : null}
              <div className="noor-home"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function AdminThemePreview() {
    const [selected, setSelected] = React.useState(0);
    const [paletteId, setPaletteId] = React.useState('olive');
    const palette = palettes.find((item) => item.id === paletteId);
    const frames = window.ADMIN_FRAMES || [];
    const frame = frames[selected];
    if (!frame) return null;
    return (
      <main className="admin-theme-preview">
        <section className="admin-theme-intro">
          <div>
            <h1>{palettes.length} color directions for Admin.</h1>
            <p>Olive & sand is the approved Admin palette. Compare the alternatives below. Every option uses the same screens, components and original gold mark.</p>
          </div>
          <div className="admin-theme-icons" aria-label="Launcher icon comparison">
            <figure>
              <img src="./assets/paigham-icon-reference.png" alt="Current Paigham icon: green arch and gold mark on white" width="80" height="80" />
              <figcaption>Paigham</figcaption>
            </figure>
            <figure>
              <img src={palette.icon} alt={`Proposed Admin icon: ${palette.alt}`} width="80" height="80" />
              <figcaption>Paigham Admin</figcaption>
            </figure>
            <figure>
              <img className="admin-theme-icon-round" src={palette.icon} alt={`${palette.name} Admin icon in a circular launcher mask`} width="48" height="48" />
              <figcaption>Small / round</figcaption>
            </figure>
          </div>
        </section>
        <div className="admin-theme-choices" role="group" aria-label="Admin color directions">
          {palettes.map((item) => (
            <button key={item.id} type="button" className={`choice-card rich ${paletteId === item.id ? 'selected' : ''}`}
              data-brand="admin" data-admin-palette={item.id} aria-label={`Preview ${item.name}`} aria-pressed={paletteId === item.id}
              onClick={() => setPaletteId(item.id)}>
              <img className="admin-theme-choice-icon" src={item.icon} alt="" width="48" height="48" />
              <span className="choice-card-copy">
                <strong>{item.name}</strong>
                <small>{item.description}</small>
                <span className="admin-theme-choice-status">{paletteId === item.id ? 'Selected' : 'View palette'}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="admin-theme-toolbar">
          <label htmlFor="admin-theme-screen">Compare screen</label>
          <select className="input" id="admin-theme-screen" value={selected} onChange={(e) => setSelected(Number(e.target.value))}>
            {frames.map((item, index) => <option key={index} value={index}>{item.name}</option>)}
          </select>
          <span>Read-only screens · use the theme switch above for light or dark</span>
        </div>
        <div className="admin-theme-comparison" aria-live="polite">
          <ThemeFrame key={`current-${selected}`} frame={frame} />
          <ThemeFrame key={`admin-${selected}`} frame={frame} palette={palette} />
        </div>
        <p className="admin-theme-note">Green success, amber warnings and red destructive actions retain their meaning. This preview changes only colors and launcher artwork; it is not a released app build.</p>
      </main>
    );
  }

  Object.assign(window, { AdminThemePreview });
}());

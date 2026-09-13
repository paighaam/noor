// Register masjid journey storyboard.
// Each product screen owns one horizontal row containing its meaningful states.

const noop = () => {};
const ROLES = ['Imam', 'Chairman', 'Secretary', 'Trustee', 'Volunteer'];
const MASLAKS = ['Hanafi', 'Shafi\u2019i', 'Maliki', 'Hanbali', 'Ahle Hadith'];
const STATES = window.MASJID_STATE_LIST || [];

function baseData(overrides = {}) {
  return {
    step: 'pincode',
    progressIndex: 1,
    ctaLabel: 'Continue',
    ctaDisabled: false,
    ctaBusy: false,
    ctaFeedback: '',
    errors: {},
    pincode: '',
    claimResults: [],
    masjidName: 'Masjid-e-Noor',
    address: 'Kabutar Khana',
    city: 'Mumbai',
    stateVal: 'Maharashtra',
    pinDropped: false,
    locationPhase: 'choice',
    locationResolved: false,
    locationLookupFailed: false,
    contactName: 'Salim Shaikh',
    stateSheetOpen: false,
    stateOptions: STATES.map((name) => ({ value: name, label: name })),
    roleOptions: ROLES.map((name) => ({ value: name, label: name })),
    maslakOptions: MASLAKS.map((name) => ({ value: name, label: name })),
    photoTaken: false,
    selfieTaken: false,
    photoSrc: null,
    selfieSrc: null,
    photoLocationAttached: false,
    captureLocationStatus: 'ready',
    capturePlace: 'Kabutar Khana, Mumbai',
    captureCoordinates: '19.0206, 72.8406',
    captureAccuracy: '±8 m',
    cameraMode: null,
    cameraStage: 'rationale',
    cameraPermission: 'unknown',
    masjidLocked: false,
    masjidSummaryName: 'Masjid-e-Noor',
    masjidSummaryAddr: 'Kabutar Khana, Mumbai, Maharashtra · 400016',
    role: 'Chairman',
    maslak: 'Ahle Hadith',
    onBack: noop,
    ctaOnClick: noop,
    onPincodeChange: noop,
    onRegisterManually: noop,
    onMasjidNameChange: noop,
    onAddressChange: noop,
    onCityChange: noop,
    onOpenStateSheet: noop,
    onTogglePin: noop,
    onRecenterLocation: noop,
    onChooseLocationManually: noop,
    onOpenLocationSettings: noop,
    onContactNameChange: noop,
    onOpenRoleSheet: noop,
    onOpenMaslakSheet: noop,
    onCloseSheets: noop,
    onTakePhoto: noop,
    onRetakePhoto: noop,
    onRemovePhoto: noop,
    onTakeSelfie: noop,
    onRetakeSelfie: noop,
    onAllowCamera: noop,
    onOpenCameraSettings: noop,
    onCloseCamera: noop,
    onCapture: noop,
    onRetakeCamera: noop,
    onUseCapture: noop,
    onRetryCaptureLocation: noop,
    onFlipCamera: noop,
    onToggleFlash: noop,
    onEditRegister: noop,
    onEditContact: noop,
    onEditRole: noop,
    onEditMaslak: noop,
    onEditPhoto: noop,
    onEditSelfie: noop,
    ...overrides,
  };
}

function claimResults(selectedId) {
  return (window.MASJID_CLAIM_DATA || []).map((masjid) => ({
    ...masjid,
    selected: masjid.claimStatus === 'claimable' && masjid.id === selectedId,
    onSelect: noop,
  }));
}

function options(items) {
  return items.map((name) => ({ value: name, label: name }));
}

function journeyGroups() {
  return [
    {
      icon: 'location_on',
      label: '03 · Pincode lookup',
      frames: [
        { name: 'Empty', data: baseData() },
        { name: 'Validation feedback', data: baseData({ errors: { pincode: 'Enter a valid 6-digit pincode.' } }) },
        { name: 'Searching', data: baseData({ step: 'searching', pincode: '400001', ctaLabel: 'Searching nearby', ctaDisabled: true, ctaBusy: true }) },
      ],
    },
    {
      icon: 'travel_explore',
      label: '04 · Existing masjid search',
      frames: [
        { name: 'Choose masjid', data: baseData({ step: 'claimList', progressIndex: 2, pincode: '400001', claimResults: claimResults(null), errors: { claim: 'Choose your masjid, or add it manually.' } }) },
        { name: 'Masjid selected', data: baseData({ step: 'claimList', progressIndex: 2, pincode: '400001', claimResults: claimResults(1) }) },
        { name: 'No result', data: baseData({ step: 'claimEmpty', progressIndex: 2, pincode: '560001', ctaLabel: 'Register manually' }) },
      ],
    },
    {
      icon: 'mosque',
      label: '05 · Masjid details and location',
      frames: [
        { name: 'Choose location start', data: baseData({ step: 'register', progressIndex: 2, pincode: '400016' }) },
        { name: 'Finding current location', data: baseData({ step: 'register', progressIndex: 2, pincode: '400016', locationPhase: 'loading' }) },
        { name: 'Permission denied', data: baseData({ step: 'register', progressIndex: 2, pincode: '400016', locationPhase: 'denied' }) },
        { name: 'Location unavailable', data: baseData({ step: 'register', progressIndex: 2, pincode: '400016', locationPhase: 'unavailable' }) },
        { name: 'Move to exact entrance', data: baseData({ step: 'register', progressIndex: 2, pincode: '400016', locationPhase: 'positioned', locationResolved: true }) },
        { name: 'Entrance confirmed', data: baseData({ step: 'register', progressIndex: 2, pincode: '400016', locationPhase: 'confirmed', locationResolved: true, pinDropped: true }) },
        { name: 'Manual pincode start', data: baseData({ step: 'register', progressIndex: 2, pincode: '400016', locationPhase: 'manual' }) },
        { name: 'Validation feedback', data: baseData({ step: 'register', progressIndex: 2, pincode: '400016', masjidName: '', address: '', city: '', stateVal: '', pinDropped: false, locationResolved: false, errors: { masjidName: 'Enter the masjid name.', address: 'Enter an address or nearby landmark.', city: 'Enter the town or locality.', stateVal: 'Enter the state.', pinDropped: 'Pin the masjid entrance on the map.' } }) },
        { name: 'State selection sheet', data: baseData({ step: 'register', progressIndex: 2, pincode: '400016', stateSheetOpen: true }) },
      ],
    },
    {
      icon: 'person',
      label: '06 · Contact',
      frames: [
        { name: 'Filled', data: baseData({ step: 'contact', progressIndex: 3 }) },
        { name: 'Validation feedback', data: baseData({ step: 'contact', progressIndex: 3, contactName: '', errors: { contactName: 'Enter the name of the person we should contact.' } }) },
      ],
    },
    {
      icon: 'person',
      label: '07 · Role',
      frames: [
        { name: 'Unselected', data: baseData({ step: 'role', progressIndex: 4 }) },
        { name: 'Validation feedback', data: baseData({ step: 'role', progressIndex: 4, errors: { role: 'Select your role at this masjid.' } }) },
        { name: 'Frosted selection sheet', data: baseData({ step: 'role', progressIndex: 4, roleSheetOpen: true, role: 'Chairman', roleOptions: options(ROLES) }) },
      ],
    },
    {
      icon: 'groups',
      label: '08 · Maslak',
      frames: [
        { name: 'Unselected', data: baseData({ step: 'maslak', progressIndex: 5 }) },
        { name: 'Validation feedback', data: baseData({ step: 'maslak', progressIndex: 5, errors: { maslak: 'Select the maslak followed by this masjid.' } }) },
        { name: 'Frosted selection sheet', data: baseData({ step: 'maslak', progressIndex: 5, maslakSheetOpen: true, maslak: 'Ahle Hadith', maslakOptions: options(MASLAKS) }) },
      ],
    },
    {
      icon: 'photo_camera',
      label: '09 · Masjid photo',
      frames: [
        { name: 'Guided journey', data: baseData({ step: 'photo', progressIndex: 6, ctaLabel: 'Continue' }) },
        { name: 'Camera viewport', data: baseData({ step: 'photo', progressIndex: 6, cameraMode: 'masjid', cameraPermission: 'granted', cameraStage: 'ready' }) },
        { name: 'Exact capture review', data: baseData({ step: 'photo', progressIndex: 6, cameraMode: 'masjid', cameraPermission: 'granted', cameraStage: 'captured' }) },
        { name: 'Photo and location added', data: baseData({ step: 'photo', progressIndex: 6, photoTaken: true, photoLocationAttached: true, photoSrc: '../../images/masjid-camera-preview.png' }) },
        { name: 'Outside entrance range', data: baseData({ step: 'photo', progressIndex: 6, cameraMode: 'masjid', cameraPermission: 'granted', cameraStage: 'ready', captureLocationStatus: 'outside' }) },
        { name: 'Location unavailable', data: baseData({ step: 'photo', progressIndex: 6, cameraMode: 'masjid', cameraPermission: 'granted', cameraStage: 'ready', captureLocationStatus: 'unavailable' }) },
      ],
    },
    {
      icon: 'person',
      label: '10 · Identity photo',
      frames: [
        { name: 'Guided journey', data: baseData({ step: 'selfie', progressIndex: 7 }) },
        { name: 'Camera viewport', data: baseData({ step: 'selfie', progressIndex: 7, cameraMode: 'selfie', cameraPermission: 'granted', cameraStage: 'ready' }) },
        { name: 'Exact capture review', data: baseData({ step: 'selfie', progressIndex: 7, cameraMode: 'selfie', cameraPermission: 'granted', cameraStage: 'captured' }) },
        { name: 'Photo added', data: baseData({ step: 'selfie', progressIndex: 7, selfieTaken: true, selfieSrc: '../../images/identity-camera-preview.png' }) },
      ],
    },
    {
      icon: 'receipt_long',
      label: '11 · Review and submit',
      frames: [
        { name: 'Complete submission', data: baseData({ step: 'review', progressIndex: 8, ctaLabel: 'Submit for verification', photoTaken: true, photoLocationAttached: true, selfieTaken: true, photoSrc: '../../images/masjid-camera-preview.png', selfieSrc: '../../images/identity-camera-preview.png' }) },
        // Submitting is a state OF this step, not a screen of its own: three requests, each named,
        // with every answer and both photos still on screen in case one of them fails.
        { name: 'Submitting · 1 of 3', data: baseData({ step: 'review', progressIndex: 8, ctaLabel: 'Submit for verification', ctaBusy: true, ctaBusyLabel: 'Uploading masjid photo · 1 of 3', photoTaken: true, photoLocationAttached: true, selfieTaken: true, photoSrc: '../../images/masjid-camera-preview.png', selfieSrc: '../../images/identity-camera-preview.png' }) },
        { name: 'Submitting · 2 of 3', data: baseData({ step: 'review', progressIndex: 8, ctaLabel: 'Submit for verification', ctaBusy: true, ctaBusyLabel: 'Uploading your photo · 2 of 3', photoTaken: true, photoLocationAttached: true, selfieTaken: true, photoSrc: '../../images/masjid-camera-preview.png', selfieSrc: '../../images/identity-camera-preview.png' }) },
        { name: 'Submitting · 3 of 3', data: baseData({ step: 'review', progressIndex: 8, ctaLabel: 'Submit for verification', ctaBusy: true, ctaBusyLabel: 'Submitting for verification · 3 of 3', photoTaken: true, photoLocationAttached: true, selfieTaken: true, photoSrc: '../../images/masjid-camera-preview.png', selfieSrc: '../../images/identity-camera-preview.png' }) },
      ],
    },
  ];
}

function JourneyFrame({ frame, globalIndex, active, onSelectFrame }) {
  const { WizardScreen } = window;
  const ring = active === globalIndex ? 'is-active' : '';
  return (
    <div className="poc-board-item" onClick={() => onSelectFrame && onSelectFrame(globalIndex)}>
      <div className={`noor-frame ${ring}`} style={{ '--s': '0.46', cursor: 'pointer' }}>
        <div className="noor-frame-inner">
          <div className="noor-screen">
            <div className="noor-island"></div>
            {WizardScreen ? <WizardScreen data={frame.data} /> : null}
            <div className="noor-home"></div>
          </div>
        </div>
      </div>
      <div className="poc-frame-caption">{globalIndex + 1} · {frame.name}</div>
    </div>
  );
}

function JourneyRows({ active = -1, onSelectFrame, offset = 5 }) {
  let index = offset;
  return (
    <div>
      {journeyGroups().map((group) => {
        const start = index;
        index += group.frames.length;
        return (
          <div key={group.label}>
            <div className="poc-row-label"><span className="mi" data-i={group.icon}></span> {group.label} · {group.frames.length} states</div>
            <div className="poc-board">
              {group.frames.map((frame, frameIndex) => (
                <JourneyFrame key={frame.name} frame={frame} globalIndex={start + frameIndex} active={active} onSelectFrame={onSelectFrame} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { JourneyRows });

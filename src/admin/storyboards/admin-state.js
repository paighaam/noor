// Admin Console — Storyboard frame catalog & state builder.
//
// Defines all frames, groups, and mock data for the platform admin console:
// Home, Approvals Queue, Standard Lead Review, and the Claimed Masjid
// Point-by-Point Data Pick-and-Merge flow.

(function () {
  const ADMIN_GROUPS = [
    { id: 'home', num: '01', title: 'Admin Home & Hub', icon: 'dashboard' },
    { id: 'queue', num: '02', title: 'Masjid Approvals Queue', icon: 'format_list_bulleted' },
    { id: 'lead', num: '03', title: 'Standard Lead Review', icon: 'description' },
    { id: 'claimed', num: '04', title: 'Claimed Masjid Review & Pick-and-Merge', icon: 'splitscreen' },
    { id: 'outcomes', num: '05', title: 'Review Outcomes & Dialogs', icon: 'check_circle' },
  ];

  const MOCK_ADMIN = {
    name: 'Toufeeq Ahamed',
    role: 'Super Admin',
    location: 'Paigham Operations HQ',
    pendingCount: 2,
    totalMasjids: 148,
    postsToday: 24,
  };

  const MOCK_SOURCED_MASJID = {
    id: 'masjid-src-501',
    name: 'Jamia Masjid Bilal',
    maslak: 'Sunni',
    address: 'No. 12/B, Old Tank Bund Road, Shivajinagar',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560051',
    coordinates: '12.9850, 77.6062',
    status: 'SOURCED',
    sourcedFrom: 'Census & Field Survey 2024',
    photoUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&q=80',
  };

  const MOCK_LEADS = [
    {
      id: 'lead-claim-101',
      masjidName: 'Masjid-e-Bilal (Ahle Sunnah)',
      maslak: 'Ahle Sunnah Wal Jamaat',
      contactName: 'Mohammed Imran Khan',
      phone: '+91 98450 12345',
      role: 'CHAIRMAN',
      roleDisplay: 'Chairman',
      address: '14, 2nd Cross, Tank Road, Shivajinagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560051',
      coordinates: '12.9856, 77.6058',
      status: 'PENDING',
      claimedMasjidId: 'masjid-src-501',
      claimedMasjidName: 'Jamia Masjid Bilal',
      masjidPhotoAvailable: true,
      verificationPhotoAvailable: true,
      masjidPhotoUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=600&q=80',
      verificationPhotoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80',
      submittedAt: '2 hours ago',
      notes: 'Applying as committee chairman to manage daily updates and official broadcasts.',
    },
    {
      id: 'lead-std-102',
      masjidName: 'Masjid Umar Farooq',
      maslak: 'Shafi',
      contactName: 'Syed Abdul Rahaman',
      phone: '+91 99887 76655',
      role: 'TRUSTEE',
      roleDisplay: 'Trustee / Mutawalli',
      address: 'Opp. Eidgah Ground, Rajiv Gandhi Nagar',
      city: 'Mysuru',
      state: 'Karnataka',
      pincode: '570019',
      coordinates: '12.3118, 76.6529',
      status: 'PENDING',
      claimedMasjidId: null,
      masjidPhotoAvailable: true,
      verificationPhotoAvailable: true,
      masjidPhotoUrl: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=600&q=80',
      verificationPhotoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80',
      submittedAt: '5 hours ago',
      notes: 'Newly built community masjid registered by local trust committee.',
    },
    {
      id: 'lead-appr-103',
      masjidName: 'Masjid Noor-ul-Huda',
      maslak: 'Hanafi',
      contactName: 'Farhan Ahmed',
      phone: '+91 91234 56789',
      role: 'CHAIRMAN',
      roleDisplay: 'Chairman',
      address: 'Main Bazaar Road',
      city: 'Hubballi',
      state: 'Karnataka',
      pincode: '580020',
      coordinates: '15.3647, 75.1240',
      status: 'APPROVED',
      claimedMasjidId: null,
      masjidPhotoAvailable: true,
      verificationPhotoAvailable: false,
      submittedAt: 'Yesterday',
    },
    {
      id: 'lead-rej-104',
      masjidName: 'Grand City Masjid',
      maslak: 'Other',
      contactName: 'Unknown Submitter',
      phone: '+91 90000 11111',
      role: 'MEMBER',
      roleDisplay: 'Volunteer',
      address: 'Sector 4, Ring Road',
      city: 'Mangaluru',
      state: 'Karnataka',
      pincode: '575001',
      coordinates: '12.9141, 74.8560',
      status: 'REJECTED',
      claimedMasjidId: null,
      rejectReason: 'Incomplete committee authorization documents',
      submittedAt: '3 days ago',
    },
  ];

  const REJECTION_REASONS = [
    'Incomplete or unverified authorization document',
    'Cannot verify committee identity or contact number',
    'Duplicate registration request for an active masjid',
    'Address or coordinates do not match a physical masjid location',
    'Requested role cannot be validated',
    'Other reason (details provided in follow-up call)',
  ];

  const DEFAULT_MERGE_SELECTIONS = {
    name: 'LEAD',
    maslak: 'LEAD',
    address: 'LEAD',
    city: 'MASJID',
    state: 'MASJID',
    pincode: 'MASJID',
    coordinates: 'LEAD',
    role: 'LEAD',
  };

  const ADMIN_FRAMES = [
    // 01: Home & Hub
    {
      id: 'home-active',
      group: 'home',
      name: 'Admin Home (Active Queue)',
      screen: 'home',
      state: { hasPending: true },
    },
    {
      id: 'home-empty',
      group: 'home',
      name: 'Admin Home (Queue Clear)',
      screen: 'home',
      state: { hasPending: false, pendingCount: 0 },
    },

    // 02: Queue & Filters
    {
      id: 'queue-all',
      group: 'queue',
      name: 'Queue — All Leads',
      screen: 'queue',
      state: { filter: 'ALL' },
    },
    {
      id: 'queue-pending',
      group: 'queue',
      name: 'Queue — Pending Only (2)',
      screen: 'queue',
      state: { filter: 'PENDING' },
    },
    {
      id: 'queue-claimed',
      group: 'queue',
      name: 'Queue — Claimed Badges',
      screen: 'queue',
      state: { filter: 'PENDING', search: 'Bilal' },
    },
    {
      id: 'queue-empty',
      group: 'queue',
      name: 'Queue — No Results Found',
      screen: 'queue',
      state: { filter: 'PENDING', search: 'Nonexistent' },
    },

    // 03: Standard Lead Review
    {
      id: 'std-review',
      group: 'lead',
      name: 'Standard Lead — Detail Review',
      screen: 'standard-review',
      state: { leadId: 'lead-std-102' },
    },
    {
      id: 'std-doc-photo',
      group: 'lead',
      name: 'Standard Lead — Photo Preview',
      screen: 'standard-review',
      state: { leadId: 'lead-std-102', viewingMedia: 'masjid' },
    },

    // 04: Claimed Masjid Review & Field-by-Field Merge
    {
      id: 'claimed-diff',
      group: 'claimed',
      name: 'Claimed Review — Diff Inspection',
      screen: 'claimed-review',
      state: {
        leadId: 'lead-claim-101',
        mergeSelections: DEFAULT_MERGE_SELECTIONS,
      },
    },
    {
      id: 'claimed-lead-pick',
      group: 'claimed',
      name: 'Claimed Review — Picking User Data',
      screen: 'claimed-review',
      state: {
        leadId: 'lead-claim-101',
        mergeSelections: {
          name: 'LEAD',
          maslak: 'LEAD',
          address: 'LEAD',
          city: 'LEAD',
          state: 'LEAD',
          pincode: 'LEAD',
          coordinates: 'LEAD',
          role: 'LEAD',
        },
      },
    },
    {
      id: 'claimed-sourced-pick',
      group: 'claimed',
      name: 'Claimed Review — Picking Sourced Data',
      screen: 'claimed-review',
      state: {
        leadId: 'lead-claim-101',
        mergeSelections: {
          name: 'MASJID',
          maslak: 'MASJID',
          address: 'MASJID',
          city: 'MASJID',
          state: 'MASJID',
          pincode: 'MASJID',
          coordinates: 'MASJID',
          role: 'MASJID',
        },
      },
    },
    {
      id: 'claimed-preview',
      group: 'claimed',
      name: 'Claimed Review — Live Composite',
      screen: 'claimed-review',
      state: {
        leadId: 'lead-claim-101',
        mergeSelections: DEFAULT_MERGE_SELECTIONS,
        showCompositeSummary: true,
      },
    },

    // 05: Outcomes & Dialogs
    {
      id: 'outcome-reject',
      group: 'outcomes',
      name: 'Reject Reason Sheet',
      screen: 'standard-review',
      state: { leadId: 'lead-std-102', showRejectSheet: true },
    },
    {
      id: 'outcome-confirm-merge',
      group: 'outcomes',
      name: 'Confirm Merge & Approve Dialog',
      screen: 'claimed-review',
      state: {
        leadId: 'lead-claim-101',
        mergeSelections: DEFAULT_MERGE_SELECTIONS,
        showConfirmDialog: true,
      },
    },
    {
      id: 'outcome-success',
      group: 'outcomes',
      name: 'Merge Success Feedback',
      screen: 'claimed-review',
      state: {
        leadId: 'lead-claim-101',
        mergeSelections: DEFAULT_MERGE_SELECTIONS,
        isSuccess: true,
      },
    },
  ];

  function adminFrameState(frame) {
    return {
      screen: frame.screen,
      admin: MOCK_ADMIN,
      leads: MOCK_LEADS,
      sourcedMasjid: MOCK_SOURCED_MASJID,
      rejectionReasons: REJECTION_REASONS,
      ...frame.state,
    };
  }

  function buildAdminData(state, overrides) {
    const s = { ...state, ...overrides };
    const lead = s.leadId ? s.leads.find((l) => l.id === s.leadId) : null;
    const filter = s.filter || 'ALL';
    const search = (s.search || '').trim().toLowerCase();

    const filteredLeads = s.leads.filter((l) => {
      if (filter === 'PENDING' && l.status !== 'PENDING') return false;
      if (filter === 'APPROVED' && l.status !== 'APPROVED') return false;
      if (filter === 'REJECTED' && l.status !== 'REJECTED') return false;
      if (search) {
        const queryMatches =
          (l.masjidName && l.masjidName.toLowerCase().includes(search)) ||
          (l.contactName && l.contactName.toLowerCase().includes(search)) ||
          (l.city && l.city.toLowerCase().includes(search)) ||
          (l.phone && l.phone.includes(search));
        if (!queryMatches) return false;
      }
      return true;
    });

    const pendingCount = s.leads.filter((l) => l.status === 'PENDING').length;

    // Field difference matrix for claimed lead vs sourced masjid
    const mergeSelections = s.mergeSelections || DEFAULT_MERGE_SELECTIONS;
    const sourced = s.sourcedMasjid || MOCK_SOURCED_MASJID;

    const mergeFields = lead
      ? [
          {
            key: 'name',
            label: 'Masjid Name',
            leadValue: lead.masjidName,
            masjidValue: sourced.name,
            isDiff: lead.masjidName !== sourced.name,
            selected: mergeSelections.name,
          },
          {
            key: 'maslak',
            label: 'Maslak / Tradition',
            leadValue: lead.maslak,
            masjidValue: sourced.maslak,
            isDiff: lead.maslak !== sourced.maslak,
            selected: mergeSelections.maslak,
          },
          {
            key: 'address',
            label: 'Street Address',
            leadValue: lead.address,
            masjidValue: sourced.address,
            isDiff: lead.address !== sourced.address,
            selected: mergeSelections.address,
          },
          {
            key: 'city',
            label: 'City',
            leadValue: lead.city,
            masjidValue: sourced.city,
            isDiff: lead.city !== sourced.city,
            selected: mergeSelections.city,
          },
          {
            key: 'state',
            label: 'State',
            leadValue: lead.state,
            masjidValue: sourced.state,
            isDiff: lead.state !== sourced.state,
            selected: mergeSelections.state,
          },
          {
            key: 'pincode',
            label: 'Pincode',
            leadValue: lead.pincode,
            masjidValue: sourced.pincode,
            isDiff: lead.pincode !== sourced.pincode,
            selected: mergeSelections.pincode,
          },
          {
            key: 'coordinates',
            label: 'GPS Coordinates',
            leadValue: lead.coordinates,
            masjidValue: sourced.coordinates,
            isDiff: lead.coordinates !== sourced.coordinates,
            selected: mergeSelections.coordinates,
          },
          {
            key: 'role',
            label: 'Submitter Role',
            leadValue: lead.roleDisplay || 'Chairman',
            masjidValue: 'Masjid Coordinator (Local)',
            isDiff: true,
            selected: mergeSelections.role,
          },
        ]
      : [];

    const diffCount = mergeFields.filter((f) => f.isDiff).length;

    // Resolved composite preview based on current selections
    const compositePreview = lead
      ? {
          name: mergeSelections.name === 'LEAD' ? lead.masjidName : sourced.name,
          maslak: mergeSelections.maslak === 'LEAD' ? lead.maslak : sourced.maslak,
          address: mergeSelections.address === 'LEAD' ? lead.address : sourced.address,
          city: mergeSelections.city === 'LEAD' ? lead.city : sourced.city,
          state: mergeSelections.state === 'LEAD' ? lead.state : sourced.state,
          pincode: mergeSelections.pincode === 'LEAD' ? lead.pincode : sourced.pincode,
          coordinates: mergeSelections.coordinates === 'LEAD' ? lead.coordinates : sourced.coordinates,
          role: mergeSelections.role === 'LEAD' ? lead.roleDisplay : 'Masjid Coordinator',
        }
      : null;

    return {
      ...s,
      lead,
      filteredLeads,
      pendingCount,
      mergeFields,
      diffCount,
      compositePreview,
    };
  }

  window.ADMIN_GROUPS = ADMIN_GROUPS;
  window.ADMIN_FRAMES = ADMIN_FRAMES;
  window.MOCK_ADMIN = MOCK_ADMIN;
  window.MOCK_LEADS = MOCK_LEADS;
  window.MOCK_SOURCED_MASJID = MOCK_SOURCED_MASJID;
  window.adminFrameState = adminFrameState;
  window.buildAdminData = buildAdminData;
})();

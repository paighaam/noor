// Masjid Console — one state model shared by the storyboard frames and the live device.
//
// Plain JS (loaded synchronously from the page helmet) so `buildOpsData` and `OPS_FRAMES`
// exist before the page's DCLogic runs. The sample data and formatting helpers live in
// ./broadcast-studio-screens.jsx and are read lazily (at call time) from `window`, so this file never
// depends on the async JSX module having loaded yet.
//
// Why one model: every storyboard frame is produced by the SAME `buildOpsData` the live
// device uses, so a frame can never drift from the interactive prototype. A frame declares
// only the state that differs from the default; `matchesFrame` then decides which frame
// ring lights up for the device's current state.

(function () {
  // ── Default state — a chairman looking at a healthy console ──
  const OPS_DEFAULT_STATE = {
    route: 'console', // 'console' | 'create' | 'sent' | 'invitations'
    role: 'CHAIRMAN',
    // Command deck: 'home' is the hub, everything else is a full destination screen.
    dest: 'home', // 'home' | 'members' | 'member' | 'invite' | 'followers' | 'details'
    masjidId: 'bilal', // which managed masjid the console is showing
    switcherOpen: false,
    consoleStatus: 'loaded', // 'loading' | 'loaded' | 'locked' | 'error'

    // Capabilities of the signed-in member (`OPS_MEMBERS[0]` by default: a full admin).
    // Salaah timings are public and deliberately absent from this set — see OPS_CAPABILITIES.
    // They are also not a destination here: the editor is its own section board
    // (../Salaah Timing Rules.dc.html) and the hub's Salaah tile navigates to it.
    caps: ['post', 'committee'],

    // Storyboard override for the floating action's collapsed form; the live device lets
    // scroll position decide (same idiom as the Qaum player's `dock`).
    fabCompact: false,

    postsStatus: 'loaded', // 'loading' | 'loaded' | 'error'
    postsEmpty: false,
    // A masjid whose console has just been opened for the first time: no musalleen, no
    // committee but the registrant, no published timings, nothing sent. Every count the
    // hub would normally shout is zero here, which is exactly why it needs its own state.
    fresh: false,
    postMenuFor: null,
    deletingId: null,

    membersStatus: 'loaded', // 'loading' | 'loaded' | 'error'
    membersEmpty: false,
    withdrawingId: null, // invitation withdrawal in flight
    memberId: null, // the member whose permission screen is open
    ownerId: 'm1',
    transferringId: null,
    transferError: false,
    followersStatus: 'loaded',
    followersEmpty: false,
    followersLoadingMore: false,
    followersPage: 4, // how many of the total are loaded
    // The invite draft. Visibility is `dest === 'invite'`, not a flag on this object — the
    // invite is a destination screen, so the route owns whether it is showing.
    invite: { phone: '', role: null, caps: [], sending: false, error: null },

    // The compose wizard's own state. `step` is the screen, `recorder` / `picker` / `crop`
    // are its full-screen stages, `audience` is the PostTarget.
    post: {
      step: 'message', // 'message' | 'photos' | 'audience' | 'review'
      message: '',
      audio: null, // { uploading, failed, playing, progress, duration }
      recorder: null, // { stage: 'recording' | 'review' | 'blocked', elapsed }
      photos: [], // [{ id, src }] — local draft attachments until final Send paigham
      picker: false,
      crop: null, // { src, rotation }
      audience: 'MASJID',
      submitting: false,
      micBlocked: false,
      messageError: false,
      focusMessage: false,
      focusMessageKey: 0,
    },

    invitationsStatus: 'loaded', // 'loading' | 'loaded' | 'error'
    invitationsEmpty: false,
    // { id, kind: 'accept' | 'decline' } — the kind is what lets the capsule name itself.
    invitationActioning: null,
    invitationAcceptedId: null, // accepted just now → the card offers the console

    openMenu: null,
    snack: null,
    confirm: null, // { kind, id }

    // Content mutations produced by the live device (a confirmed delete, an accepted
    // invitation, a role change, a sent invite). They are deliberately NOT part of the
    // frame signature: they change list contents, not which state the screen is in.
    hidden: [],
    roleOverrides: {},
    capOverrides: {},
    extraMembers: [],
  };

  const NESTED_KEYS = ['invite', 'post'];

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

  const frameState = (frame) => applyPatch(OPS_DEFAULT_STATE, frame.state);

  const sameValue = (a, b) => {
    if (a === b) return true;
    if (a == null || b == null) return a == b; // eslint-disable-line eqeqeq
    if (typeof a === 'object' && typeof b === 'object') {
      return Object.keys(a).every((k) => sameValue(a[k], b[k]))
        && Object.keys(b).every((k) => sameValue(a[k], b[k]));
    }
    return false;
  };

  // ── Frame matching ──
  // A frame lights up when the device's state SIGNATURE equals the frame's. The signature
  // drops values that change continuously (elapsed time, playback progress, the exact text
  // typed, the working config object) and keeps them as buckets, so the ring survives real
  // interaction instead of dropping on every keystroke.
  const MAX_MESSAGE = 1024;

  const signature = (state) => {
    const s = state || OPS_DEFAULT_STATE;
    const post = s.post || {};
    const invite = s.invite || {};
    const message = post.message || '';

    // Only the slice the screen is actually showing takes part in the comparison, so a
    // leftover from another tab (a filter, a sub-tab) never suppresses the ring.
    const onConsole = s.route === 'console';
    const scope = {
      posts: onConsole && s.dest === 'home',
      members: onConsole && ['members', 'followers', 'member', 'invite'].indexOf(s.dest) !== -1,
      post: s.route === 'create',
      invitations: s.route === 'invitations',
    };

    const base = {
      route: s.route,
      role: s.role,
      caps: (s.caps || []).slice().sort().join(','),
      dest: onConsole ? s.dest : null,
      consoleStatus: s.consoleStatus,
      openMenu: s.openMenu || null,
      snack: s.snack ? (s.snack.kind || 'success') : null,
      confirm: s.confirm ? { kind: s.confirm.kind, id: s.confirm.id } : null,
    };

    const slices = {};
    if (scope.posts) {
      Object.assign(slices, {
        postsStatus: s.postsStatus,
        postsEmpty: !!s.postsEmpty,
        fresh: !!s.fresh,
        postMenuFor: s.postMenuFor || null,
        deletingId: s.deletingId || null,
        masjidId: s.masjidId,
        switcherOpen: !!s.switcherOpen,
        fabCompact: !!s.fabCompact,
      });
    }
    if (scope.members) {
      Object.assign(slices, {
        membersStatus: s.membersStatus,
        membersEmpty: !!s.membersEmpty,
        withdrawingId: s.withdrawingId || null,
        memberId: s.memberId || null,
        ownerId: s.ownerId,
        transferringId: s.transferringId || null,
        transferError: !!s.transferError,
        followersStatus: s.followersStatus,
        followersEmpty: !!s.followersEmpty,
        followersLoadingMore: !!s.followersLoadingMore,
        followersPage: s.followersPage,
        invite: {
          role: invite.role || null,
          caps: (invite.caps || []).slice().sort().join(','),
          sending: !!invite.sending,
          hasError: !!invite.error,
          hasPhone: !!(invite.phone || '').length,
        },
      });
    }
    if (scope.post) {
      const photos = post.photos || [];
      slices.post = {
        step: post.step || 'message',
        message: message.length === 0 ? 'empty' : (message.length > MAX_MESSAGE ? 'too-long' : 'text'),
        audio: post.audio ? { uploading: !!post.audio.uploading, failed: !!post.audio.failed } : null,
        recorder: post.recorder ? (post.recorder.stage || 'recording') : null,
        photos: photos.length,
        picker: !!post.picker,
        crop: !!post.crop,
        audience: post.audience || 'MASJID',
        submitting: !!post.submitting,
        // Which step of the send is running. Sending is a sequence of requests, so the
        // status line names the one in flight rather than holding one sentence for all of
        // them; null falls back to the final `Sending your paigham…`.
        submitStatus: post.submitStatus || null,
        micBlocked: !!post.micBlocked,
        messageError: !!post.messageError,
        // Compose can retarget the masjid mid-draft, so the switcher is part of this
        // screen's state, not only the hub's.
        switcherOpen: !!s.switcherOpen,
      };
    }
    if (scope.invitations) {
      Object.assign(slices, {
        invitationsStatus: s.invitationsStatus,
        invitationsEmpty: !!s.invitationsEmpty,
        invitationActioning: s.invitationActioning || null,
        invitationAcceptedId: s.invitationAcceptedId || null,
      });
    }

    return Object.assign(base, slices);
  };

  const matchesFrame = (state, frame) => sameValue(signature(state), signature(frameState(frame)));

  const activeFrameIndex = (state) => OPS_FRAMES.findIndex((frame) => matchesFrame(state, frame));

  // ── Confirmation copy. Destructive wording names the blast radius explicitly. ──
  const confirmSpec = (state, handlers) => {
    const confirm = state.confirm;
    if (!confirm) return null;
    const members = window.OPS_MEMBERS || [];
    const posts = window.OPS_POSTS || [];
    const roleLabel = window.opsRoleLabel || ((r) => r);
    const h = handlers || {};

    if (confirm.kind === 'deletePost') {
      const post = posts.find((p) => p.id === confirm.id);
      return {
        title: 'Delete this paigham?',
        description: `It is removed for every musalli of ${(window.OPS_MASJID || {}).name || 'this masjid'} and cannot be restored.${post && post.reactions ? ` ${post.reactions} reactions will be lost.` : ''}`,
        confirmText: 'Delete paigham',
        destructive: true,
        onConfirm: h.onConfirmAction,
      };
    }
    if (confirm.kind === 'transferOwnership') {
      const member = members.concat(state.extraMembers || []).find((m) => m.id === confirm.id);
      return {
        title: 'Transfer ownership?',
        description: `${member ? member.name : 'This member'} becomes the owner and can appoint or remove managers. You stay a manager and will need the new owner or Paigham support to transfer ownership back. Committee titles stay the same.`,
        confirmText: 'Transfer ownership',
        onConfirm: h.onConfirmAction,
      };
    }
    if (confirm.kind === 'removeMember') {
      const member = members.find((m) => m.id === confirm.id);
      return {
        title: member && member.you ? 'Leave the committee?' : 'Remove this member?',
        description: member && member.you ? 'You lose committee access. Your paighams stay published. The owner or a manager can invite you back.' : `${member ? member.name : 'This member'} loses every permission and can no longer manage this masjid. Their paighams stay published. You can invite them again later.`,
        confirmText: member && member.you ? 'Leave committee' : 'Remove member',
        destructive: true,
        onConfirm: h.onConfirmAction,
      };
    }
    if (confirm.kind === 'withdrawInvitation') {
      const member = members.concat(state.extraMembers || []).find((m) => m.id === confirm.id);
      return {
        title: 'Withdraw this invitation?',
        // Names the number, what stops, and that it is reversible — the same three answers the
        // remove-member dialog gives.
        description: `${member ? member.phone : 'This number'} can no longer accept it and gets no access to this masjid. You can invite them again later.`,
        confirmText: 'Withdraw invitation',
        destructive: true,
        onConfirm: h.onConfirmAction,
      };
    }
    if (confirm.kind === 'declineInvitation') {
      return {
        title: 'Decline this invitation?',
        description: 'The committee is told you declined. They can invite you again if it was a mistake.',
        confirmText: 'Decline',
        destructive: true,
        onConfirm: h.onConfirmAction,
      };
    }
    if (confirm.kind === 'discardDraft') {
      return {
        title: 'Discard this paigham?',
        description: 'Your message, recording and photos are removed. Nothing is sent.',
        confirmText: 'Discard',
        destructive: true,
        onConfirm: h.onConfirmAction,
      };
    }
    return null;
  };

  // The console shows one masjid at a time. Sample data only varies the identity fields; a second
  // masjid keeps the same feed so the switch reads clearly in the storyboard.
  const activeMasjid = (state) => {
    const base = window.OPS_MASJID || {};
    const managed = window.OPS_MANAGED || [];
    const pick = managed.find((m) => m.id === state.masjidId) || managed[0];
    if (!pick) return base;
    return Object.assign({}, base, {
      id: pick.id,
      name: pick.name,
      code: pick.code,
      address: pick.address || pick.city,
      photo: pick.photo,
      stats: Object.assign({}, base.stats, { followers: pick.followers }),
    });
  };

  // A fresh masjid keeps its identity but loses every accumulated number.
  const freshMasjid = (state) => {
    const masjid = activeMasjid(state);
    if (!state.fresh) return masjid;
    return Object.assign({}, masjid, {
      stats: Object.assign({}, masjid.stats, { followers: 0, posts: 0, reactions: 0 }),
    });
  };

  // ── Hub attention queue — only real, actionable work ─────────────────
  // Nothing is "in review": paighams go live on send, anyone may follow, and timings are
  // public and unreviewed. All that remains is work the committee owes someone — an
  // invitation nobody has accepted yet.
  const attentionItems = (state) => {
    // A masjid that opened its console today owes nobody anything yet.
    if (state.fresh) return [];
    const hidden = state.hidden || [];
    const live = (list) => list.filter((item) => hidden.indexOf(item.id) === -1);
    const caps = state.caps || [];
    const members = state.membersEmpty ? [] : live((window.OPS_MEMBERS || []).concat(state.extraMembers || []));
    const pendingInvites = members.filter((m) => m.status === 'INVITED');
    const invited = pendingInvites.length;
    const items = [];
    if (invited && caps.indexOf('committee') !== -1) {
      items.push({
        id: 'pending-invites', icon: 'mail', count: invited,
        title: `${invited} ${invited === 1 ? 'invitation' : 'invitations'} waiting`,
        copy: invited === 1
          ? `${(pendingInvites[0].name || 'The member').split(' ')[0]} has not accepted yet`
          : 'Members have not accepted yet',
      });
    }
    return items;
  };

  // ── State → screen data. The single assembly point for both surfaces. ──
  function buildOpsData(state, handlers) {
    const s = state || OPS_DEFAULT_STATE;
    const h = handlers || {};
    const hidden = s.hidden || [];
    const overrides = s.roleOverrides || {};
    const visible = (list) => list.filter((item) => hidden.indexOf(item.id) === -1);

    const capOverrides = s.capOverrides || {};
    const members = visible(
      (s.membersEmpty ? [] : (window.OPS_MEMBERS || [])).concat(s.extraMembers || []),
    ).map((m) => {
      let next = Object.assign({}, m, { isOwner: m.id === s.ownerId && (m.you ? (s.caps || []).includes('committee') : true) });
      if (overrides[m.id]) next = Object.assign({}, next, { role: overrides[m.id] });
      if (capOverrides[m.id]) next = Object.assign({}, next, { caps: capOverrides[m.id] });
      if (next.isOwner) next = Object.assign({}, next, { caps: Array.from(new Set((next.caps || []).concat(['committee']))) });
      return next;
    });
    const followers = visible(s.followersEmpty ? [] : (window.OPS_FOLLOWERS || []))
      .slice(0, s.followersPage || 4);
    const posts = visible((s.postsEmpty || s.fresh) ? [] : (window.OPS_POSTS || []));
    const invitations = visible(s.invitationsEmpty ? [] : (window.OPS_INVITATIONS || []));

    return Object.assign({
      role: s.role,
      caps: s.caps,
      me: members.find((m) => m.you) || null,
      managed: window.OPS_MANAGED || [],
      switcherOpen: s.switcherOpen,
      dest: s.dest,
      status: s.consoleStatus,
      masjid: freshMasjid(s),
      // A brand-new masjid has published nothing, so the hub must not quote a jamaat time
      // it does not have. The tile falls back to "Publish your timings" instead.
      salaahPublished: !s.fresh,
      attention: attentionItems(s),
      fabCompact: s.fabCompact,
      // Counts shown on the hub rows, so the deck answers "how much is there?" up front.
      // `members` counts people who actually have access, matching the Committee screen's
      // "N members running <masjid>" hero. Pending invitations are deliberately excluded —
      // they carry no access and are already surfaced in the Needs-you queue, so counting
      // them here would make the hub promise more than the destination delivers.
      counts: {
        posts: posts.length,
        members: s.fresh ? 1 : members.filter((m) => m.status !== 'INVITED').length,
        followers: s.fresh ? 0 : ((window.OPS_MASJID || { stats: {} }).stats.followers || followers.length),
      },
      openMenu: s.openMenu,
      snack: s.snack,
      confirm: confirmSpec(s, h),

      posts: {
        status: s.postsStatus,
        items: posts,
        menuFor: s.postMenuFor,
        deleting: s.deletingId,
      },

      members: {
        status: s.membersStatus,
        withdrawingId: s.withdrawingId || null,
        items: members,
        editing: members.find((m) => m.id === s.memberId) || null,
        transferringId: s.transferringId,
        transferError: s.transferError,
        adminCount: members.filter((m) => (m.caps || []).indexOf('committee') !== -1).length,
        followers,
        followersStatus: s.followersStatus,
        followersLoadingMore: s.followersLoadingMore,
        invite: s.invite,
      },

      post: s.post,

      invitations: {
        status: s.invitationsStatus,
        items: invitations,
        actioning: s.invitationActioning,
        acceptedId: s.invitationAcceptedId,
      },

      // Handlers pass straight through (absent on static frames), so adding a screen
      // handler never needs an edit here.
    }, handlers);
  }

  const AUDIO_READY = { uploading: false, failed: false, playing: false, progress: 0.32, duration: '0:24' };
  // Library sources for the photo frames; CMP_LIBRARY (broadcast-studio-compose.jsx) owns the real list.
  const LIB = [
    '../../images/masjid-camera-preview.png',
    '../../images/isha_masjid.webp',
    '../../images/maghrib_masjid.webp',
    '../../images/zohar_masjid.webp',
  ];
  const PHOTO = (i) => ({ id: `ph${i + 1}`, src: LIB[i % LIB.length] });
  const SAMPLE_MESSAGE = 'Taraweeh begins after Isha from tomorrow, in shaa Allah. Please bring your own musallah for the first week.';

  // ── Storyboard frames. Order = board order; every frame is one real state. ──
  const OPS_FRAMES = [
    // 01 · The console — eagle view of the masjid you manage
    { group: 'console', name: 'Loading', screen: 'console', state: { route: 'console', consoleStatus: 'loading' } },
    { group: 'console', name: 'Console · full admin', screen: 'console', state: { route: 'console', dest: 'home' } },
    { group: 'console', name: 'Console · can post', screen: 'console', state: { route: 'console', dest: 'home', role: 'IMAM', caps: ['post'] } },
    { group: 'console', name: 'Console · view only', screen: 'console', state: { route: 'console', dest: 'home', role: 'MUEZZIN', caps: [] } },
    // Nothing owed: the Needs-you block is absent rather than an empty card.
    { group: 'console', name: 'Nothing pending', screen: 'console', state: { route: 'console', dest: 'home', hidden: ['m5'] } },
    { group: 'console', name: 'Switch masjid', screen: 'console', state: { route: 'console', dest: 'home', switcherOpen: true } },
    { group: 'console', name: 'Second masjid', screen: 'console', state: { route: 'console', dest: 'home', masjidId: 'noor', role: 'SECRETARY' } },
    { group: 'console', name: 'No paighams yet', screen: 'console', state: { route: 'console', dest: 'home', postsEmpty: true } },
    { group: 'console', name: 'Brand-new masjid · every count zero', screen: 'console', state: { route: 'console', dest: 'home', fresh: true } },
    { group: 'console', name: 'Scrolled · FAB compact', screen: 'console', state: { route: 'console', dest: 'home', fabCompact: true } },
    { group: 'console', name: 'Paigham options', screen: 'console', state: { route: 'console', dest: 'home', postMenuFor: 'p1' } },
    { group: 'console', name: 'Delete confirmation', screen: 'console', state: { route: 'console', dest: 'home', confirm: { kind: 'deletePost', id: 'p1' } } },
    { group: 'console', name: 'Deleting', screen: 'console', state: { route: 'console', dest: 'home', deletingId: 'p1' } },
    { group: 'console', name: 'Deleted · confirmation', screen: 'console', state: { route: 'console', dest: 'home', snack: { kind: 'post-deleted', message: 'Paigham deleted' } } },
    { group: 'console', name: 'Feed failed · retry', screen: 'console', state: { route: 'console', dest: 'home', postsStatus: 'error' } },
    { group: 'console', name: 'Masjid details', screen: 'console', state: { route: 'console', dest: 'details' } },
    { group: 'console', name: 'Details · read only', screen: 'console', state: { route: 'console', dest: 'details', role: 'MUEZZIN', caps: [] } },
    { group: 'console', name: 'Committee-only lock', screen: 'console', state: { route: 'console', consoleStatus: 'locked', caps: [] } },
    { group: 'console', name: 'Load failed · retry', screen: 'console', state: { route: 'console', consoleStatus: 'error' } },

    // 02 · Committee & permissions
    { group: 'members', name: 'Loading', screen: 'console', state: { route: 'console', dest: 'members', membersStatus: 'loading' } },
    { group: 'members', name: 'Committee · admin', screen: 'console', state: { route: 'console', dest: 'members' } },
    { group: 'members', name: 'Committee · read only', screen: 'console', state: { route: 'console', dest: 'members', role: 'MUEZZIN', caps: [] } },
    { group: 'members', name: 'None yet', screen: 'console', state: { route: 'console', dest: 'members', membersEmpty: true } },
    { group: 'members', name: 'Member permissions', screen: 'console', state: { route: 'console', dest: 'member', memberId: 'm3' } },
    { group: 'members', name: 'Member · role picker', screen: 'console', state: { route: 'console', dest: 'member', memberId: 'm3', openMenu: 'member-role' } },
    { group: 'members', name: 'Member · full admin', screen: 'console', state: { route: 'console', dest: 'member', memberId: 'm2' } },
    { group: 'members', name: 'Member · owner', screen: 'console', state: { route: 'console', dest: 'member', memberId: 'm1' } },
    { group: 'members', name: 'Member · invited', screen: 'console', state: { route: 'console', dest: 'member', memberId: 'm5' } },
    { group: 'members', name: 'Remove confirmation', screen: 'console', state: { route: 'console', dest: 'member', memberId: 'm4', confirm: { kind: 'removeMember', id: 'm4' } } },
    { group: 'members', name: 'Removed · confirmation', screen: 'console', state: { route: 'console', dest: 'members', snack: { kind: 'member-removed', message: 'Yusuf Ali removed from the committee' } } },
    { group: 'members', name: 'Withdraw invitation · confirmation', screen: 'console', state: { route: 'console', dest: 'members', confirm: { kind: 'withdrawInvitation', id: 'm5' } } },
    { group: 'members', name: 'Withdrawing invitation', screen: 'console', state: { route: 'console', dest: 'members', withdrawingId: 'm5' } },
    { group: 'members', name: 'Invitation withdrawn', screen: 'console', state: { route: 'console', dest: 'members', hidden: ['m5'], snack: { kind: 'invitation-withdrawn', message: 'Invitation withdrawn' } } },
    { group: 'members', name: 'Load failed · retry', screen: 'console', state: { route: 'console', dest: 'members', membersStatus: 'error' } },

    // 03 · Invitations & musalleen
    { group: 'members', name: 'Manager viewing owner', screen: 'console', state: { route: 'console', dest: 'member', memberId: 'm2', ownerId: 'm2' } },
    { group: 'members', name: 'Manager viewing manager', screen: 'console', state: { route: 'console', dest: 'member', memberId: 'm2', ownerId: 'm3' } },
    { group: 'members', name: 'Transfer ownership', screen: 'console', state: { route: 'console', dest: 'member', memberId: 'm2', confirm: { kind: 'transferOwnership', id: 'm2' } } },
    { group: 'members', name: 'Transferring ownership', screen: 'console', state: { route: 'console', dest: 'member', memberId: 'm2', transferringId: 'm2' } },
    { group: 'members', name: 'Transfer failed · retry', screen: 'console', state: { route: 'console', dest: 'member', memberId: 'm2', transferError: true } },
    { group: 'members', name: 'Ownership transferred', screen: 'console', state: { route: 'console', dest: 'member', memberId: 'm2', ownerId: 'm2', snack: { kind: 'ownership-transferred', message: 'Ownership transferred' } } },

    { group: 'invite', name: 'Invite member', screen: 'console', state: { route: 'console', dest: 'invite' } },
    { group: 'invite', name: 'Role picker', screen: 'console', state: { route: 'console', dest: 'invite', invite: { phone: '98861 40219' }, openMenu: 'member-role' } },
    { group: 'invite', name: 'Permissions chosen', screen: 'console', state: { route: 'console', dest: 'invite', invite: { phone: '98861 40219', role: 'ASSISTANT_SECRETARY', caps: ['post'] } } },
    { group: 'invite', name: 'Sending', screen: 'console', state: { route: 'console', dest: 'invite', invite: { phone: '98861 40219', role: 'ASSISTANT_SECRETARY', caps: ['post'], sending: true } } },
    { group: 'invite', name: 'Invite failed', screen: 'console', state: { route: 'console', dest: 'invite', invite: { phone: '9886', role: 'MEMBER', error: 'Enter a valid 10-digit mobile number.' } } },
    { group: 'invite', name: 'Musalleen', screen: 'console', state: { route: 'console', dest: 'followers' } },
    { group: 'invite', name: 'Musalleen · loading more', screen: 'console', state: { route: 'console', dest: 'followers', followersLoadingMore: true } },
    { group: 'invite', name: 'Musalleen · loading', screen: 'console', state: { route: 'console', dest: 'followers', followersStatus: 'loading' } },
    { group: 'invite', name: 'Musalleen · none', screen: 'console', state: { route: 'console', dest: 'followers', followersEmpty: true } },

    // 04 · Send a paigham — the guided wizard
    { group: 'create', name: 'Step 1 · empty', screen: 'create', state: { route: 'create' } },
    { group: 'create', name: 'Step 1 · empty feedback', screen: 'create', state: { route: 'create', post: { messageError: true } } },
    { group: 'create', name: 'Step 1 · written', screen: 'create', state: { route: 'create', post: { message: SAMPLE_MESSAGE } } },
    { group: 'create', name: 'Step 1 · too long', screen: 'create', state: { route: 'create', post: { message: SAMPLE_MESSAGE.repeat(10) } } },
    { group: 'create', name: 'Recorder · live', screen: 'create', state: { route: 'create', post: { recorder: { stage: 'recording', elapsed: '0:12' } } } },
    { group: 'create', name: 'Recorder · listen back', screen: 'create', state: { route: 'create', post: { recorder: { stage: 'review', elapsed: '0:24' } } } },
    { group: 'create', name: 'Recorder · mic blocked', screen: 'create', state: { route: 'create', post: { recorder: { stage: 'blocked' }, micBlocked: true } } },
    { group: 'create', name: 'Step 1 · voice attached', screen: 'create', state: { route: 'create', post: { audio: AUDIO_READY } } },
    { group: 'create', name: 'Step 1 · upload failed', screen: 'create', state: { route: 'create', post: { audio: { uploading: false, failed: true, duration: '0:24' } } } },
    { group: 'create', name: 'Step 2 · no photos', screen: 'create', state: { route: 'create', post: { step: 'photos', message: SAMPLE_MESSAGE } } },
    { group: 'create', name: 'Step 2 · library', screen: 'create', state: { route: 'create', post: { step: 'photos', message: SAMPLE_MESSAGE, picker: true } } },
    { group: 'create', name: 'Step 2 · crop', screen: 'create', state: { route: 'create', post: { step: 'photos', message: SAMPLE_MESSAGE, crop: { src: LIB[0], rotation: 0 } } } },
    { group: 'create', name: 'Step 2 · one added', screen: 'create', state: { route: 'create', post: { step: 'photos', message: SAMPLE_MESSAGE, photos: [PHOTO(0)] } } },
    { group: 'create', name: 'Step 2 · two added', screen: 'create', state: { route: 'create', post: { step: 'photos', message: SAMPLE_MESSAGE, photos: [PHOTO(0), PHOTO(1)] } } },
    { group: 'create', name: 'Step 2 · four added', screen: 'create', state: { route: 'create', post: { step: 'photos', message: SAMPLE_MESSAGE, photos: [PHOTO(0), PHOTO(1), PHOTO(2), PHOTO(3)] } } },
    { group: 'create', name: 'Step 3 · audience', screen: 'create', state: { route: 'create', post: { step: 'audience', message: SAMPLE_MESSAGE, photos: [PHOTO(0), PHOTO(1)] } } },
    { group: 'create', name: 'Step 3 · wider circle', screen: 'create', state: { route: 'create', post: { step: 'audience', message: SAMPLE_MESSAGE, audience: 'MASJID_MASLAK' } } },
    { group: 'create', name: 'Step 4 · review text', screen: 'create', state: { route: 'create', post: { step: 'review', message: SAMPLE_MESSAGE, photos: [PHOTO(0), PHOTO(1)] } } },
    { group: 'create', name: 'Step 4 · review voice', screen: 'create', state: { route: 'create', post: { step: 'review', audio: AUDIO_READY, audience: 'MASJID_PINCODE' } } },
    { group: 'create', name: 'Change the masjid', screen: 'create', state: { route: 'create', switcherOpen: true, post: { step: 'review', message: SAMPLE_MESSAGE, photos: [PHOTO(0), PHOTO(1)] } } },
    { group: 'create', name: 'Sending', screen: 'create', state: { route: 'create', post: { step: 'review', message: SAMPLE_MESSAGE, submitting: true } } },
    { group: 'create', name: 'Sending · photo 2 of 3', screen: 'create', state: { route: 'create', post: { step: 'review', message: SAMPLE_MESSAGE, photos: [PHOTO(0), PHOTO(1), PHOTO(0)], submitting: true, submitStatus: 'Uploading photo 2 of 3…' } } },
    { group: 'create', name: 'Sending · recording', screen: 'create', state: { route: 'create', post: { step: 'review', audio: AUDIO_READY, submitting: true, submitStatus: 'Uploading your recording…' } } },
    { group: 'create', name: 'Discard draft?', screen: 'create', state: { route: 'create', post: { message: SAMPLE_MESSAGE }, confirm: { kind: 'discardDraft' } } },
    { group: 'create', name: 'Sent · live', screen: 'sent', state: { route: 'sent' } },

    // 05 · Invitations inbox
    { group: 'invitations', name: 'Loading', screen: 'invitations', state: { route: 'invitations', invitationsStatus: 'loading' } },
    { group: 'invitations', name: 'Pending invitations', screen: 'invitations', state: { route: 'invitations' } },
    { group: 'invitations', name: 'Accepting', screen: 'invitations', state: { route: 'invitations', invitationActioning: { id: 'i1', kind: 'accept' } } },
    { group: 'invitations', name: 'Declining', screen: 'invitations', state: { route: 'invitations', invitationActioning: { id: 'i1', kind: 'decline' } } },
    { group: 'invitations', name: 'Accepted · open console', screen: 'invitations', state: { route: 'invitations', invitationAcceptedId: 'i1', snack: { kind: 'invitation-accepted', message: 'Invitation accepted' } } },
    { group: 'invitations', name: 'Decline confirmation', screen: 'invitations', state: { route: 'invitations', confirm: { kind: 'declineInvitation', id: 'i2' } } },
    { group: 'invitations', name: 'Last day', screen: 'invitations', state: { route: 'invitations', invitationActioning: { id: 'i2', kind: 'accept' } } },
    { group: 'invitations', name: 'No invitations', screen: 'invitations', state: { route: 'invitations', invitationsEmpty: true } },
    { group: 'invitations', name: 'Load failed · retry', screen: 'invitations', state: { route: 'invitations', invitationsStatus: 'error' } },
  ];

  const OPS_GROUPS = [
    { id: 'console', num: '01', title: 'Broadcast hub', icon: 'campaign' },
    { id: 'members', num: '02', title: 'Committee & permissions', icon: 'groups' },
    { id: 'invite', num: '03', title: 'Invitations & musalleen', icon: 'person' },
    { id: 'create', num: '04', title: 'Broadcast composer', icon: 'edit' },
    { id: 'invitations', num: '05', title: 'My invitations', icon: 'mail' },
  ];

  Object.assign(window, {
    OPS_DEFAULT_STATE,
    OPS_FRAMES,
    OPS_GROUPS,
    opsApplyPatch: applyPatch,
    opsFrameState: frameState,
    opsMatchesFrame: matchesFrame,
    opsActiveFrameIndex: activeFrameIndex,
    buildOpsData,
    OPS_AUDIO_READY: AUDIO_READY,
    OPS_SAMPLE_MESSAGE: SAMPLE_MESSAGE,
  });
}());

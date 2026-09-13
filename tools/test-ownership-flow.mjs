import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

// Independent review artifact: executes the real Noor state builder and DC component.
// DC setState, the DOM transition fallback, and timers are substituted; no policy is copied.
// This is component/state evidence, not browser layout or server authorization evidence.
const root = process.argv[2] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'src/masjid-operations/Masjid Console.dc.html',
  'src/masjid-operations/storyboards/broadcast-studio-state.js',
  'src/masjid-operations/storyboards/broadcast-studio-screens.jsx',
];
const source = files.map(file => fs.readFileSync(path.join(root, file), 'utf8'));
const [html, stateJs, screens] = source;
const domainEnd = screens.indexOf('\nconst OPS_FOLLOWERS =');
assert.ok(domainEnd > 0, 'Real screen domain fixtures and helpers must be available');
const script = html.match(/<script type="text\/x-dc" data-dc-script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'Actual page DC component must be available');
const plain = value => JSON.parse(JSON.stringify(value));

function fixture(patch = {}) {
  let timerId = 0;
  const pending = new Map();
  const context = vm.createContext({
    window: { location: { hash: '' } },
    document: {},
    console,
    setTimeout: (callback, delay) => { pending.set(++timerId, { callback, delay }); return timerId; },
    clearTimeout: id => pending.delete(id),
    setInterval: () => { throw new Error('Interval is outside the reviewed ownership flow'); },
    clearInterval: id => pending.delete(id),
    DCLogic: class {
      setState(update) {
        const next = typeof update === 'function' ? update(this.state) : update;
        this.state = { ...this.state, ...next };
      }
    },
  });
  vm.runInContext(screens.slice(0, domainEnd) + `
    Object.assign(window, { OPS_MEMBERS, OPS_MANAGED, OPS_MASJID, OPS_CAPS,
      opsAvailableCommitteeRoles: availableCommitteeRoles,
      opsIsCommitteePhoneTaken: isCommitteePhoneTaken, opsRoleLabel: roleLabel });
  `, context);
  vm.runInContext(stateJs, context);
  vm.runInContext(script + '; globalThis.component = new Component();', context);
  const component = context.component;
  component.patch(patch);
  return {
    component,
    window: context.window,
    data: () => context.window.buildOpsData(component.state, {}),
    member: id => context.window.buildOpsData(component.state, {}).members.items.find(m => m.id === id),
    runDelay(delay) {
      const timer = [...pending.entries()].find(([, value]) => value.delay === delay);
      assert.ok(timer, `Expected an actual component timer at ${delay} ms`);
      pending.delete(timer[0]);
      timer[1].callback();
    },
  };
}

const tests = [];
const test = (name, run) => tests.push({ name, run });

test('every existing storyboard frame builds through the real state mapper', () => {
  const f = fixture();
  const names = new Set(f.window.OPS_FRAMES.map(frame => frame.name));
  for (const name of ['Member · owner', 'Manager viewing owner', 'Manager viewing manager', 'Transfer ownership', 'Transferring ownership', 'Transfer failed · retry', 'Ownership transferred', 'Withdraw invitation · confirmation']) {
    assert.ok(names.has(name), `Required ownership storyboard: ${name}`);
  }
  for (const frame of f.window.OPS_FRAMES) {
    const data = f.window.buildOpsData(f.window.opsFrameState(frame), {});
    for (const member of data.members.items.filter(m => m.isOwner)) {
      assert.ok(member.caps.includes('committee'), `${frame.name}: owner must manage committee`);
    }
  }
});

test('ordinary manager cannot edit owner or another manager', () => {
  for (const target of ['m2', 'm3']) {
    const f = fixture({ ownerId: 'm3', dest: 'member', memberId: target });
    const before = plain(f.member(target));
    f.component.onPickRole('MEMBER');
    f.component.onToggleCapability(target, 'post');
    f.component.patch({ confirm: { kind: 'removeMember', id: target } });
    f.component.onConfirmAction();
    assert.deepEqual(plain(f.member(target)), before);
  }
});

test('ordinary manager may manage a non-manager but cannot appoint a manager', () => {
  const f = fixture({ ownerId: 'm2', dest: 'member', memberId: 'm4' });
  f.component.onToggleCapability('m4', 'post');
  assert.ok(f.member('m4').caps.includes('post'));
  f.component.onToggleCapability('m4', 'committee');
  assert.ok(!f.member('m4').caps.includes('committee'));
  f.component.onInviteCapability('committee');
  assert.ok(!f.component.state.invite.caps.includes('committee'));
});

test('owner can edit own title but cannot revoke own management or leave', () => {
  const f = fixture({ dest: 'member', memberId: 'm1' });
  f.component.onPickRole('MEMBER');
  assert.equal(f.member('m1').role, 'MEMBER');
  f.component.onToggleCapability('m1', 'committee');
  assert.ok(f.member('m1').caps.includes('committee'));
  f.component.patch({ confirm: { kind: 'removeMember', id: 'm1' } });
  f.component.onConfirmAction();
  assert.equal(f.member('m1').isOwner, true);
});

test('transfer to active non-manager grants management and retains both titles and former access', () => {
  const f = fixture({ dest: 'member', memberId: 'm3' });
  const beforeOld = plain(f.member('m1'));
  const beforeTarget = plain(f.member('m3'));
  f.component.onOpenTransfer(f.member('m3'));
  assert.match(f.data().confirm.description, /You stay a manager/);
  f.component.onConfirmAction();
  assert.equal(f.component.state.confirm, null);
  assert.equal(f.component.state.transferringId, 'm3');
  f.runDelay(700);
  assert.equal(f.component.state.transferringId, null);
  assert.deepEqual(f.data().members.items.filter(m => m.isOwner).map(m => m.id).join(','), 'm3');
  assert.ok(f.member('m3').caps.includes('committee'));
  assert.equal(f.member('m3').role, beforeTarget.role);
  assert.equal(f.member('m1').role, beforeOld.role);
  assert.deepEqual(plain(f.member('m1').caps), beforeOld.caps);
  f.component.onOpenTransfer(f.member('m2'));
  assert.equal(f.component.state.confirm, null, 'Former owner cannot initiate another transfer');
});

test('masjid switching is blocked during transfer and works again after completion', () => {
  const f = fixture({ dest: 'member', memberId: 'm2' });
  f.component.onOpenTransfer(f.member('m2'));
  f.component.onConfirmAction();
  f.component.onPickMasjid('noor');
  assert.equal(f.component.state.masjidId, 'bilal');
  f.runDelay(700);
  assert.equal(f.component.state.transferringId, null);
  assert.equal(f.component.state.ownerId, 'm2');
  f.component.onPickMasjid('noor');
  assert.equal(f.component.state.masjidId, 'noor');
});

test('transfer failure storyboard retains ownership and supports a confirmed retry', () => {
  const f = fixture();
  const frame = f.window.OPS_FRAMES.find(frame => frame.name === 'Transfer failed · retry');
  assert.ok(frame);
  f.component.setState(f.window.opsFrameState(frame));
  assert.equal(f.data().members.transferError, true);
  assert.equal(f.member('m1').isOwner, true);
  f.component.onOpenTransfer(f.member('m2'));
  assert.equal(f.component.state.transferError, false);
  f.component.onCancelConfirm();
  assert.equal(f.member('m1').isOwner, true);
  assert.equal(f.component.state.transferringId, null);
  f.component.onOpenTransfer(f.member('m2'));
  f.component.onConfirmAction();
  f.runDelay(700);
  assert.equal(f.member('m2').isOwner, true);
});

test('former owner can leave and console authority is removed without later handler crashes', () => {
  const f = fixture({ dest: 'member', memberId: 'm1', ownerId: 'm2' });
  f.component.onOpenRemove(f.member('m1'));
  assert.equal(f.data().confirm.confirmText, 'Leave committee');
  assert.match(f.data().confirm.description, /owner or a manager can invite you back/);
  f.component.onConfirmAction();
  assert.equal(f.component.state.consoleStatus, 'locked');
  assert.deepEqual(plain(f.data().caps), []);
  assert.equal(f.data().me, null);
  const before = plain(f.data().members.items);
  f.component.onToggleCapability('m4', 'post');
  f.component.onPickRole('MEMBER');
  f.component.onWithdrawInvitation(f.member('m5'));
  assert.deepEqual(plain(f.data().members.items), before);
  assert.equal(f.component.state.confirm, null);
});

test('ordinary manager cannot withdraw a manager invitation through opener or confirmation', () => {
  const f = fixture({ ownerId: 'm2', capOverrides: { m5: ['committee'] } });
  f.component.onWithdrawInvitation(f.member('m5'));
  assert.equal(f.component.state.confirm, null);
  f.component.patch({ confirm: { kind: 'withdrawInvitation', id: 'm5' } });
  f.component.onConfirmAction();
  assert.equal(f.component.state.withdrawingId, null);
  assert.ok(f.member('m5'));
});

test('owner can withdraw a manager invitation and ordinary manager can withdraw a normal invitation', () => {
  for (const patch of [{ capOverrides: { m5: ['committee'] } }, { ownerId: 'm2' }]) {
    const f = fixture(patch);
    f.component.onWithdrawInvitation(f.member('m5'));
    f.component.onConfirmAction();
    assert.equal(f.component.state.withdrawingId, 'm5');
    f.runDelay(700);
    assert.equal(f.member('m5'), undefined);
    assert.equal(f.component.state.withdrawingId, null);
  }
});

const results = tests.map(({ name, run }) => {
  try { run(); return { name, status: 'PASS' }; }
  catch (error) { return { name, status: 'FAIL', error: error.stack }; }
});
console.log(JSON.stringify({
  evidence: 'Independent actual Noor component and state execution with deterministic timers; no browser or server proof',
  sources: files.map((file, i) => ({ file, sha256: crypto.createHash('sha256').update(source[i]).digest('hex') })),
  tests: results,
}, null, 2));
if (results.some(result => result.status === 'FAIL')) process.exitCode = 1;

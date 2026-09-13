import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const stateSource = readFileSync(new URL('src/masjid-operations/storyboards/salaah-rules-state.js', root), 'utf8');
const timelineSource = readFileSync(new URL('src/masjid-operations/storyboards/salaah-scroll-timeline.jsx', root), 'utf8');
const pageSource = readFileSync(new URL('src/masjid-operations/Salaah Timing Rules.dc.html', root), 'utf8');

function model() {
  const context = vm.createContext({ window: {} });
  // Use the actual board's calculated-day fixture, without loading its React UI.
  const day = timelineSource.slice(timelineSource.indexOf('const SST_PRAYERS ='), timelineSource.indexOf('const SST_ALL ='));
  vm.runInContext(`const SstMin = (h, m) => h * 60 + m; ${day}
    window.SstPrayerWindows = SST_PRAYERS; window.SstJumahWindow = SST_JUMAH;`, context);
  vm.runInContext(stateSource, context);
  const api = context.window;
  const state = (patch = {}) => api.srApplyPatch(api.SR_DEFAULT_STATE, { scanProposal: 'full', ...patch });
  const data = (patch = {}) => api.buildSrData(state(patch));
  return { api, state, data, context };
}

test('an unanswered column shows the read times but promises no additions', () => {
  const { data } = model();
  const review = data();
  assert.equal(review.scanRows.length, 6);
  assert.ok(review.scanRows.every((row) => row.kind === 'unlabelled'));
  assert.equal(review.scanUsable, 0);
  assert.equal(review.scanLandings.length, 0);
  assert.equal(review.scanCounts, '6 read · choose a column');
  assert.equal(Object.keys(review.scanProposal).length, 0);
});

test('selecting or correcting the column evaluates the same original reading', () => {
  const { data } = model();
  const jamaat = data({ scanColumnMeaning: 'jamaat' });
  const azaan = data({ scanColumnMeaning: 'azaan' });
  assert.equal(jamaat.scanRows[0].printed, 335);
  assert.equal(azaan.scanRows[0].printed, 335);
  assert.equal(jamaat.scanRows[0].azaan, 315);
  assert.equal(azaan.scanRows[0].azaan, 335);
  assert.ok(jamaat.scanRows.every((row) => row.kind !== 'unlabelled'));
  assert.equal(jamaat.scanRows.find((row) => row.key === 'maghrib').kind, 'anchored');
  assert.equal(jamaat.scanCounts, '6 read · 5 usable · 1 blocked by timing rules');
});

test('five read times remain visible when timing rules and a window block them', () => {
  const { data } = model();
  const review = data({ scenario: 'allAtStart', scanProposal: 'fivePrayer', scanColumnMeaning: 'jamaat' });
  assert.equal(review.scanRows.filter((row) => row.kind === 'anchored').length, 4);
  assert.equal(review.scanRows.find((row) => row.key === 'maghrib').kind, 'bad');
  assert.equal(review.scanRows.find((row) => row.key === 'jumah').kind, 'mut');
  assert.equal(review.scanCounts, '5 read · 1 outside its window · 4 blocked by timing rules · 1 not read');
  assert.equal(review.scanLandings.length, 0);
  assert.deepEqual(Array.from(review.scanRows.filter((row) => row.kind !== 'mut'), (row) => row.printed), [330, 795, 1045, 1133, 1225]);
});

test('a window conflict is named even when the prayer follows its calculated start', () => {
  const { data } = model();
  const review = data({ scanProposal: 'partial', scanColumnMeaning: 'jamaat', draft: { fajr: { variant: 'ON_TIME', iqamaDelay: 20 } } });
  const fajr = review.scanRows.find((row) => row.key === 'fajr');
  assert.equal(fajr.kind, 'bad');
  assert.match(fajr.note, /20-minute gap/);
  assert.match(fajr.note, /4:00 AM/);
  assert.match(fajr.note, /4:52 AM/);
  assert.ok(review.scanLandings.every((row) => row.key !== 'fajr'));
});

test('a detected time that already matches is kept visible and never walked', () => {
  const { data } = model();
  const review = data({ scanColumnMeaning: 'jamaat', draft: { zohar: { variant: 'FIXED', salaahTime: '13:35', iqamaDelay: 15 } } });
  const zohar = review.scanRows.find((row) => row.key === 'zohar');
  assert.equal(zohar.kind, 'same');
  assert.equal(zohar.printed, 830);
  assert.match(review.scanCounts, /1 already set/);
  assert.ok(review.scanLandings.every((row) => row.key !== 'zohar'));
});

test('reviewing a rule keeps the scan and reevaluates it after an explicit draft edit', () => {
  const { api, context } = model();
  api.location = { hash: '#board-rules' };
  // The page's real navigation and edit handlers, with only the dc state host replaced.
  const pageLogic = pageSource.match(/<script type="text\/x-dc" data-dc-script>([\s\S]*?)<\/script>/)[1];
  vm.runInContext(`class DCLogic { setState(update) { this.state = typeof update === 'function' ? update(this.state) : update; } }
    ${pageLogic}
    this.page = new Component();`, context);
  const page = context.page;
  const before = api.buildSrData(page.state);
  page.onOpenRules();
  page.onOpenPrayer('fajr');
  page.onPickVariant('fajr', 'FIXED');
  page.onBack();
  page.onBack();
  const after = api.buildSrData(page.state);
  assert.equal(page.state.route, 'timings');
  assert.equal(page.state.scanProposal, 'fivePrayer');
  assert.equal(page.state.scanColumnMeaning, 'jamaat');
  assert.equal(before.scanUsable, 0);
  assert.equal(after.scanUsable, 1);
  assert.equal(after.scanLandings[0].key, 'fajr');
  assert.equal(after.scanRows[0].printed, 330);
  assert.equal(after.rows.find((row) => row.key === 'asr').cfg.variant, 'ON_TIME');
  assert.equal(after.justPublished, false);
});

test('pills, counts and the landing queue agree for every review frame', () => {
  const { api } = model();
  for (const frame of api.SR_FRAMES.filter((frame) => frame.state.scanProposal)) {
    const data = api.buildSrData(api.srFrameState(frame));
    const ok = data.scanRows.filter((row) => row.kind === 'ok');
    assert.equal(data.scanUsable, ok.length, frame.name);
    assert.deepEqual(Array.from(data.scanLandings, (row) => row.key), Array.from(ok, (row) => row.key), frame.name);
  }
});

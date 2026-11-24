'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const appScript = inlineScripts.find(s => s.includes('const RULE_BANK') && s.includes('createApp'));
assert.ok(appScript, 'app script extracted from index.html');

// Run the real inline script with tiny Vue/audio stubs — no browser, no network.
function boot() {
  const state = {};
  const ctx = vm.createContext({
    console, setTimeout, clearTimeout, Date, Math, JSON,
    alert: () => {},
    Vue: {
      createApp: (opts) => ({ mount() { Object.assign(state, opts.setup()); } }),
      ref: (value) => ({ value }),
      computed: (fn) => ({ get value() { return fn(); } }),
      onMounted: () => {}
    }
  });
  ctx.window = ctx;
  ctx.__spoken = [];
  ctx.speechSynthesis = { cancel() {}, speak(u) { ctx.__spoken.push(u.text); } };
  ctx.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  ctx.AudioContext = class {
    constructor() { this.currentTime = 0; this.destination = {}; }
    createOscillator() {
      return { connect() {}, start() {}, stop() {}, type: '',
        frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } };
    }
    createGain() {
      return { connect() {}, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } };
    }
  };
  // RULE_BANK is scoped inside setup(); expose it just after its declaration.
  const instrumented = appScript.replace(
    '// --- AUDIO SYSTEM',
    'globalThis.__RULE_BANK = RULE_BANK;\n                // --- AUDIO SYSTEM'
  );
  vm.runInContext(instrumented, ctx);
  return { state, ruleBank: ctx.__RULE_BANK, ctx };
}

test('all 10 rules accept their own examples', () => {
  const { ruleBank } = boot();
  assert.equal(ruleBank.length, 10);
  for (const rule of ruleBank) {
    for (const ex of rule.examples) {
      assert.equal(rule.check(ex.item, ex.destination), true, `${rule.id}: ${ex.item}`);
    }
  }
  const vowel = ruleBank.find(r => r.id === 'starts_with_vowel');
  assert.equal(vowel.check('Umbrella', 'Picnic'), true);
  assert.equal(vowel.check('Keyboard', 'Picnic'), false);
});

test('each hint costs one streak point, with a floor of zero', () => {
  const { state } = boot();
  state.currentSoloRule.value = {
    id: 'fake', name: 'Fake', description: '', hint1: 'h1', hint2: 'h2', check: () => true
  };
  state.soloHistory.value = [1, 2, 3].map(id => ({ id, destination: 'Picnic', item: `i${id}`, approved: true }));
  assert.equal(state.currentStreak.value, 3);

  state.requestHint();
  assert.equal(state.hintsGiven.value, 1);
  assert.equal(state.activeHints.value.length, 1);
  assert.equal(state.currentStreak.value, 2);
  assert.match(state.hintButtonText.value, /−1 streak/);

  state.requestHint();
  assert.equal(state.currentStreak.value, 1);
  state.requestHint();
  assert.equal(state.hintsGiven.value, 2, 'no more than two hints');
  assert.equal(state.currentStreak.value, 1);
});

test('custom rules are host-judged; generated rules can auto-evaluate', () => {
  const { state } = boot();
  state.customRuleName.value = 'My rule';
  state.customRuleDesc.value = 'Only red things';
  state.saveCustomRule();
  assert.equal(state.currentHostRule.value.check, undefined);
  assert.equal(state.currentHostRule.value.hostJudged, true);

  state.partyFeed.value = [];
  state.hostInputItem.value = 'Apple';
  state.hostInputDestination.value = 'Picnic';
  state.hostAutoEvaluate();
  assert.equal(state.partyFeed.value.length, 0, 'custom rules never auto-log a verdict');

  state.hostManualDecision(false);
  assert.equal(state.partyFeed.value.length, 1);
  assert.equal(state.partyFeed.value[0].allowed, false);

  state.currentHostRule.value = { id: 'generated', check: item => item.toLowerCase() === 'apple' };
  state.hostInputItem.value = 'Apple';
  state.hostAutoEvaluate();
  assert.equal(state.partyFeed.value[0].allowed, true);
  state.hostInputItem.value = 'Banana';
  state.hostAutoEvaluate();
  assert.equal(state.partyFeed.value[0].allowed, false);
});

test('solo item verdicts speak the exact phrases', () => {
  const { state, ctx } = boot();
  state.currentSoloRule.value = {
    id: 'no_e', name: 'No E', description: '', hint1: 'h1', hint2: 'h2',
    check: (item) => !/e/i.test(item),
  };
  state.inputItem.value = 'Tacos';
  state.submitSoloAttempt();
  assert.deepEqual(ctx.__spoken, ['Yes you can bring that']);
  state.inputItem.value = 'Egg';
  state.submitSoloAttempt();
  assert.deepEqual(ctx.__spoken, ['Yes you can bring that', 'Sorr you cannot bring that']);
});

test('party host decisions speak the verdicts and respect mute', () => {
  const { state, ctx } = boot();
  state.partyPlayers.value = [{ id: 1, name: 'Alex', color: '#fff' }];
  state.hostManualDecision(true);
  state.hostManualDecision(false);
  assert.deepEqual(ctx.__spoken, ['Yes you can bring that', 'Sorr you cannot bring that']);
  state.muted.value = true;
  state.hostManualDecision(true);
  assert.equal(ctx.__spoken.length, 2, 'muted: no speech');
});

test('CDN scripts are pinned; CORS-enabled Vue uses SRI', () => {
  const tags = [...html.matchAll(/<script[^>]*\bsrc="[^"]+"[^>]*>/g)].map(m => m[0]);
  assert.ok(tags.length >= 2);
  const vueTag = tags.find(tag => tag.includes('unpkg.com'));
  assert.ok(vueTag, 'Vue script tag found');
  assert.match(vueTag, /integrity="sha384-[A-Za-z0-9+/=]+"/);
  assert.match(vueTag, /crossorigin="anonymous"/);
  assert.match(html, /cdn\.tailwindcss\.com\/3\.4\.17/);
  assert.match(html, /vue@3\.5\.46\/dist\/vue\.global\.prod\.js/);
  assert.doesNotMatch(html, /cdn\.tailwindcss\.com"/);
});

test('docs and package metadata match the tooling', () => {
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  assert.doesNotMatch(readme, /Local Firebase CLI dependency/);
  assert.match(readme, /host judges manually/);
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.test, 'node --test test/game.test.js');
});

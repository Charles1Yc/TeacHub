const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({ URL });
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, '../assets/quality-analysis-core.js'), 'utf8') + '\nthis.analysis = QualityAnalysis;', context);
const analyze = context.analysis.analyze;
function group(scores) {
  return { className: 'Example class', max: 100, students: scores.map((semester, i) => ({ id: String(i), semester })), options: { mode: 'semester', excellent: null, good: null, pass: null, operators: ['>=', '>', '>='], previous: null, targets: [null, null, null] } };
}
test('final scores exclude blanks and include zero', () => {
  const result = analyze(group([100, 97, null, 0]));
  assert.equal(result.count, 4); assert.equal(result.taken, 3);
  assert.equal(result.max, 100); assert.equal(result.min, 0); assert.equal(result.mean, 197 / 3);
  assert.equal(result.counts[0], null); assert.equal(result.change, null);
});
test('threshold operators distinguish the boundary and count cumulatively', () => {
  const g = group([100, 90, 60, null]); Object.assign(g.options, { excellent: 98, good: 90, pass: 60 });
  const result = analyze(g);
  assert.equal(result.counts[0], 1); assert.equal(result.counts[1], 1); assert.equal(result.counts[2], 3);
  g.options.operators[1] = '>='; assert.equal(analyze(g).counts[1], 2);
  g.options.pass = 0; assert.equal(analyze(g).counts[2], 3);
});
test('prior average and target completion handle blanks, zero and overachievement', () => {
  const g = group([97]); Object.assign(g.options, { good: 90, previous: 90, targets: [null, 2, 0] });
  assert.equal(analyze(g).change, 7); assert.equal(analyze(g).completion[1], .5);
  g.options.targets[1] = 0; assert.equal(analyze(g).completion[1], null);
  const other = group([100, 100]); Object.assign(other.options, { excellent: 90, targets: [1, null, null] });
  assert.equal(analyze(other).completion[0], 2);
  other.options.targets[0] = 1.5; assert.throws(() => analyze(other), /目标人数/);
});
test('empty results stay blank and invalid inputs are exposed', () => {
  const g = group([null]); g.options.good = 90; const result = analyze(g);
  assert.equal(result.taken, 0); assert.equal(result.mean, null); assert.equal(result.counts[1], null);
  assert.equal(analyze(group([101])).invalid, 1);
  Object.assign(g.options, { excellent: 80, good: 90 }); assert.throws(() => analyze(g), /分数线/);
});

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const practiceScript = fs.readFileSync(__dirname + '/cong-tru-2-chu-so.html', 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const practice = vm.createContext({
  document: { getElementById: () => ({ addEventListener() {} }), querySelector: () => ({ value: 'input' }), querySelectorAll: () => [] },
  window: { location: { hash: '' } },
  Math,
});
vm.runInContext(practiceScript, practice);
const cases = vm.runInContext('Array.from({ length: 1000 }, () => createProblem("subtract10", "mixed", null))', practice);
for (const { first, second, answer, operator } of cases) {
  assert(first >= 10 && first <= 18 && second >= 1 && second <= 9);
  assert(second > first % 10 && answer >= 1 && answer <= 9 && answer === first - second);
  assert.equal(operator, '−');
}
for (let answer = 1; answer <= 9; answer++) {
  const distractors = vm.runInContext(`generateDistractors(${answer}, 'subtract10')`, practice);
  assert.equal(new Set(distractors).size, 2);
  assert(distractors.every(value => value >= 1 && value <= 9 && value !== answer));
}

class Element {
  constructor() { this.listeners = {}; this.hidden = false; const names = new Set(); this.classList = { add: value => names.add(value), remove: value => names.delete(value), contains: value => names.has(value), toggle: (value, active) => active ? names.add(value) : names.delete(value) }; }
  addEventListener(type, fn) { this.listeners[type] = fn; }
}
const elements = new Map();
const getElementById = id => {
  if (!elements.has(id)) elements.set(id, new Element());
  return elements.get(id);
};
const body = new Element();
const visual = vm.createContext({ document: { getElementById, body }, Math });
const visualHtml = fs.readFileSync(__dirname + '/minh-hoa-tru-qua-10.html', 'utf8');
assert.match(visualHtml, /<div class="number-row">[\s\S]*?id="whole-frame"[\s\S]*?id="tens-frame"[\s\S]*?id="units-frame"[\s\S]*?<div class="number-row">[\s\S]*?id="subtract-whole-frame"[\s\S]*?id="subtract-tens-frame"[\s\S]*?id="subtract-units-frame"/);
assert.match(visualHtml, /\.number-row \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
const visualScript = visualHtml.match(/<script>([\s\S]*?)<\/script>/)[1];
vm.runInContext(visualScript, visual);
getElementById('first').value = '13';
getElementById('second').value = '2';
vm.runInContext('start()', visual);
assert.match(getElementById('error').textContent, /Chọn số/);
getElementById('second').value = '5';
vm.runInContext('start()', visual);
assert(body.classList.contains('studying'));
assert.equal(getElementById('equation').textContent, '13 − 5 = ?');
assert.equal((getElementById('whole').innerHTML.match(/🍬/g) || []).length, 10);
assert.equal((getElementById('whole').innerHTML.match(/🍭/g) || []).length, 3);
assert.equal((getElementById('subtract-whole').innerHTML.match(/🍭/g) || []).length, 5);
assert(getElementById('tens-frame').hidden);
getElementById('stage').listeners.click();
assert.equal(getElementById('equation').textContent, '13 = 10 + 3');
assert(getElementById('whole-frame').hidden);
assert.equal((getElementById('tens').innerHTML.match(/🍬/g) || []).length, 10);
assert.equal((getElementById('units').innerHTML.match(/🍭/g) || []).length, 3);
getElementById('stage').listeners.click();
assert.equal(getElementById('equation').textContent, '5 = 3 + 2');
assert(getElementById('subtract-whole-frame').hidden);
assert.equal((getElementById('subtract-units').innerHTML.match(/🍭/g) || []).length, 3);
assert.equal((getElementById('subtract-tens').innerHTML.match(/🍬/g) || []).length, 2);
getElementById('stage').listeners.click();
assert(getElementById('subtract-units-frame').classList.contains('used'));
assert.equal((getElementById('units').innerHTML.match(/🍭/g) || []).length, 0);
getElementById('stage').listeners.click();
assert.equal((getElementById('tens').innerHTML.match(/to-remove/g) || []).length, 2);
getElementById('stage').listeners.click();
assert.equal(getElementById('equation').textContent, '13 − 5 = 8');
assert.equal((getElementById('tens').innerHTML.match(/🍬/g) || []).length, 8);
assert(getElementById('subtract-tens-frame').classList.contains('used'));
getElementById('settings').listeners.click();
assert(!body.classList.contains('studying'));
getElementById('first').value = '10';
getElementById('second').value = '9';
vm.runInContext('start()', visual);
getElementById('stage').listeners.click();
getElementById('stage').listeners.click();
assert(getElementById('units-frame').hidden);
assert(getElementById('subtract-units-frame').hidden);
getElementById('stage').listeners.click();
assert.equal(getElementById('equation').textContent, '10 − 9 = ?');
getElementById('stage').listeners.click();
assert.equal(getElementById('equation').textContent, '10 − 9 = 1');

console.log('Trừ qua 10: đề, đáp án và minh họa từng bước đều đạt.');

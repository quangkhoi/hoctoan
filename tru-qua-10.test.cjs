const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const practiceScript = fs.readFileSync(__dirname + '/tru-qua-10.html', 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const practice = vm.createContext({
  document: { getElementById: () => ({ addEventListener() {} }), querySelector: () => ({ value: 'input' }), querySelectorAll: () => [] },
  Math,
});
vm.runInContext(practiceScript, practice);
const cases = vm.runInContext('Array.from({ length: 1000 }, () => createProblem(null))', practice);
for (const { first, second, answer, operator } of cases) {
  assert(first >= 10 && first <= 18 && second >= 1 && second <= 9);
  assert(second > first % 10 && answer >= 1 && answer <= 9 && answer === first - second);
  assert.equal(operator, '-');
}
for (let answer = 1; answer <= 9; answer++) {
  const distractors = vm.runInContext(`generateDistractors(${answer})`, practice);
  assert.equal(new Set(distractors).size, 2);
  assert(distractors.every(value => value >= 1 && value <= 9 && value !== answer));
}

class Element {
  constructor() { this.listeners = {}; this.hidden = false; const names = new Set(); this.classList = { add: value => names.add(value), remove: value => names.delete(value), contains: value => names.has(value) }; }
  addEventListener(type, fn) { this.listeners[type] = fn; }
}
const elements = new Map();
const getElementById = id => {
  if (!elements.has(id)) elements.set(id, new Element());
  return elements.get(id);
};
const body = new Element();
const visual = vm.createContext({ document: { getElementById, body }, Math });
const visualScript = fs.readFileSync(__dirname + '/minh-hoa-tru-qua-10.html', 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
vm.runInContext(visualScript, visual);
getElementById('first').value = '13';
getElementById('second').value = '2';
vm.runInContext('start()', visual);
assert.match(getElementById('error').textContent, /Chọn số/);
getElementById('second').value = '5';
vm.runInContext('start()', visual);
assert(body.classList.contains('studying'));
assert.equal(getElementById('equation').textContent, '13 − 5 = ?');
assert.equal((getElementById('units').innerHTML.match(/🍭/g) || []).length, 3);
for (let i = 0; i < 4; i++) getElementById('stage').listeners.click();
assert.equal(getElementById('equation').textContent, '13 − 5 = 8');
assert.equal((getElementById('tens').innerHTML.match(/🍬/g) || []).length, 8);
getElementById('settings').listeners.click();
assert(!body.classList.contains('studying'));

console.log('Trừ qua 10: đề, đáp án và minh họa từng bước đều đạt.');

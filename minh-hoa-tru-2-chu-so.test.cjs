const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Element {
  constructor() {
    this.listeners = {};
    this.hidden = false;
    const names = new Set();
    this.classList = { add: name => names.add(name), remove: name => names.delete(name), contains: name => names.has(name) };
  }
  addEventListener(type, fn) { this.listeners[type] = fn; }
  focus() { this.focused = true; }
}

const elements = new Map();
const getElementById = id => {
  if (!elements.has(id)) elements.set(id, new Element());
  return elements.get(id);
};
const body = new Element();
const html = fs.readFileSync(__dirname + '/minh-hoa-tru-2-chu-so.html', 'utf8');
assert.match(html, /id="first-tens"[\s\S]*?id="first-units"[\s\S]*?id="second-tens"[\s\S]*?id="second-units"/);
const page = vm.createContext({ document: { getElementById, body }, Math });
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], page);
const input = (a, b) => { getElementById('first').value = String(a); getElementById('second').value = String(b); vm.runInContext('start()', page); };
const click = () => getElementById('stage').listeners.click();
const tokens = (id, kind) => (getElementById(id).innerHTML.match(new RegExp(`${kind}-token`, 'g')) || []).length;

input(17, 31);
assert.match(getElementById('error').textContent, /số bị trừ/);
assert(!body.classList.contains('studying'));

input(31, 17);
assert(getElementById('stage').focused);
assert.equal(tokens('first-tens', 'ten'), 3);
assert.equal(tokens('first-units', 'unit'), 1);
assert.equal(tokens('second-tens', 'ten'), 1);
assert.equal(tokens('second-units', 'unit'), 7);
click();
assert.equal(getElementById('equation').textContent, '31 = 2 chục + 11 đơn vị');
assert.equal(tokens('first-tens', 'ten'), 2);
assert.equal(tokens('first-units', 'unit'), 11);
click();
assert.equal((getElementById('first-units').innerHTML.match(/marked/g) || []).length, 7);
click();
assert.equal(tokens('first-units', 'unit'), 4);
assert.equal((getElementById('second-units').innerHTML.match(/used/g) || []).length, 7);
click();
assert.equal((getElementById('first-tens').innerHTML.match(/marked/g) || []).length, 1);
click();
assert.equal(getElementById('equation').textContent, '31 − 17 = 14');
assert.equal(tokens('first-tens', 'ten'), 1);
assert.equal(tokens('first-units', 'unit'), 4);

getElementById('settings').listeners.click();
input(45, 23);
click();
assert.equal(getElementById('equation').textContent, '5 đơn vị − 3 đơn vị = ?');
click(); click(); click();
assert.equal(getElementById('equation').textContent, '45 − 23 = 22');

getElementById('settings').listeners.click();
input(20, 10);
click();
assert.equal(getElementById('equation').textContent, '2 chục − 1 chục = ?');
click();
assert.equal(getElementById('equation').textContent, '20 − 10 = 10');

for (let i = 0; i < 100; i++) {
  vm.runInContext('randomProblem()', page);
  const a = Number(getElementById('first').value), b = Number(getElementById('second').value);
  assert(a >= 10 && a <= 99 && b >= 10 && b <= a);
}

console.log('Minh họa trừ hai chữ số: có mượn, không mượn, số 0 và đề ngẫu nhiên đều đạt.');

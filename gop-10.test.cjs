const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Element {
  constructor() { this.style = {}; this.children = []; this.classList = { add() {}, remove() {} }; }
  appendChild(child) { this.children.push(child); }
  remove() {}
}

const elements = new Map();
const getElementById = id => {
  if (!elements.has(id)) elements.set(id, new Element());
  return elements.get(id);
};
const listeners = { document: {}, window: {} };
const document = {
  getElementById,
  body: { classList: (() => { const names = new Set(); return { add: name => names.add(name), remove: name => names.delete(name), contains: name => names.has(name) }; })() },
  createElement: () => new Element(),
  addEventListener: (type, fn) => { listeners.document[type] = fn; },
  removeEventListener: type => { delete listeners.document[type]; },
};
const window = {
  addEventListener: (type, fn) => { listeners.window[type] = fn; },
  removeEventListener: type => { delete listeners.window[type]; },
};
const randomValues = [];
const randomMath = Object.create(Math);
randomMath.random = () => randomValues.shift();
let starts = 0;
const context = vm.createContext({ document, window, Math: randomMath, setTimeout() {}, onRun: () => { starts++; } });
const script = fs.readFileSync(__dirname + '/gop-10.html', 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
vm.runInContext(script, context);
vm.runInContext('originalRunAdditionVisualizer = runAdditionVisualizer', context);
vm.runInContext('runAdditionVisualizer = onRun', context);

for (let first = 0; first < 8; first++) for (const second of [0, 0.999]) {
  randomValues.push(first / 8, second);
  vm.runInContext('runRandomAddition()', context);
  const n1 = getElementById('num1').value, n2 = getElementById('num2').value;
  assert(n1 >= 2 && n1 <= 9 && n2 >= 1 && n2 <= 9 && n1 + n2 > 10);
}
assert.equal(starts, 16);
getElementById('num1').value = 8;
getElementById('num2').value = 4;
vm.runInContext('resetVisualizer(false)', context);
assert.equal(getElementById('num1').value, 8);
assert.equal(getElementById('num2').value, 4);

async function checkSteps() {
  getElementById('num1').value = 7;
  getElementById('num2').value = 5;
  const running = vm.runInContext('originalRunAdditionVisualizer()', context);
  assert(document.body.classList.contains('practicing'));
  randomValues.push(0, 0);
  vm.runInContext('startNewRandom()', context);
  await running;
  assert(!document.body.classList.contains('practicing'));
  assert.equal(starts, 17);

  const explanation = getElementById('explanation');
  let waiting = vm.runInContext('waitForNext(document.getElementById("explanation"))', context);
  listeners.document.click({ target: { closest: () => ({}) } });
  assert.equal(vm.runInContext('cancelStepWait !== null', context), true);
  listeners.window.keydown({ key: 'Tab', code: 'Tab', repeat: false, target: { closest: () => null } });
  assert.equal(vm.runInContext('cancelStepWait !== null', context), true);
  listeners.document.click({ target: { closest: () => null } });
  assert.equal(await waiting, true);
  assert.equal(listeners.document.click, undefined);

  waiting = vm.runInContext('waitForNext(document.getElementById("explanation"))', context);
  listeners.window.keydown({ key: 'Enter', code: 'Enter', repeat: false, target: { closest: () => ({}) } });
  assert.equal(vm.runInContext('cancelStepWait !== null', context), true);
  listeners.window.keydown({ key: 'Enter', code: 'Enter', repeat: false, target: { closest: () => null }, preventDefault() {} });
  assert.equal(await waiting, true);

  waiting = vm.runInContext('waitForNext(document.getElementById("explanation"))', context);
  vm.runInContext('resetVisualizer()', context);
  assert.equal(await waiting, false);
  assert.equal(listeners.window.keydown, undefined);
  assert(explanation.children.length >= 2);
}

checkSteps().then(() => console.log('Gộp 10: phép toán ngẫu nhiên và thao tác chuyển bước đạt.'));

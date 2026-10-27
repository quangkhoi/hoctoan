const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Element {
  constructor() {
    this.listeners = {};
    this.hidden = false;
    const names = new Set();
    this.classList = { add: name => names.add(name), remove: name => names.delete(name), contains: name => names.has(name), toggle: (name, active) => active ? names.add(name) : names.delete(name) };
  }
  addEventListener(type, fn) { this.listeners[type] = fn; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
}

const elements = new Map();
const getElementById = id => {
  if (!elements.has(id)) elements.set(id, new Element());
  return elements.get(id);
};
const app = new Element();
const html = fs.readFileSync(__dirname + '/cong-tru-2-chu-so.html', 'utf8');
const page = vm.createContext({
  document: { getElementById, querySelector: selector => selector === '.app' ? app : { value: selector.includes('mode') ? 'mcq' : 'vertical' } },
  window: { location: { hash: '' }, scrollTo() {} },
  Math,
});
getElementById('scope').value = 'two';
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], page);
for (const scope of ['findAddend', 'findMinuend', 'findSubtrahend']) assert.match(html, new RegExp(`<option value="${scope}">`));

const shown = problem => page.expressionTemplate(problem, 'horizontal').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
assert.equal(shown({ first: 12, second: 'x', operator: '+', total: 30, findX: true }), '12 + x = 30 x = 30 − 12');
assert.equal(shown({ first: 'x', second: 16, operator: '+', total: 24, findX: true }), 'x + 16 = 24 x = 24 − 16');
assert.equal(shown({ first: 'x', second: 15, operator: '−', total: 30, findX: true }), 'x − 15 = 30 x = 30 + 15');
assert.equal(shown({ first: 60, second: 'x', operator: '−', total: 17, findX: true }), '60 − x = 17 x = 60 − 17');
assert.equal(page.hintFormula({ first: 'x', second: 49, operator: '−', total: 47 }), 'x = 47 + 49');
assert.match(page.expressionTemplate({ first: 'x', second: 49, operator: '−', total: 47, findX: true }, 'horizontal'), /class="hint-formula" role="status" hidden/);

for (const scope of ['add10', 'subtract10', 'two', 'three']) {
  const cases = vm.runInContext(`Array.from({ length: 500 }, () => createProblem('${scope}', 'mixed'))`, page);
  for (const { first, second, operator, answer } of cases) {
    assert.equal(answer, operator === '+' ? first + second : first - second);
    if (scope === 'add10') assert(first >= 1 && first <= 9 && second >= 1 && second <= 9 && answer >= 10 && answer <= 18);
    if (scope === 'subtract10') assert(first >= 10 && first <= 18 && second >= 1 && second <= 9 && answer >= 1 && answer <= 9 && operator === '−');
    if (scope === 'two' || scope === 'three') {
      const min = scope === 'two' ? 10 : 100, max = scope === 'two' ? 99 : 999;
      assert(first >= min && first <= max && second >= min && second <= max && answer >= min && answer <= max);
    }
  }
}

for (const scope of ['findAddend', 'findMinuend', 'findSubtrahend']) {
  const cases = vm.runInContext(`Array.from({ length: 500 }, () => createProblem('${scope}', 'mixed'))`, page);
  for (const problem of cases) {
    const { first, second, total, answer } = problem;
    assert(problem.findX && total >= 10 && total <= 99 && answer >= 1 && answer <= 99);
    if (scope === 'findAddend') {
      assert.equal(problem.operator, '+');
      assert((first === 'x') !== (second === 'x'));
      assert.equal((first === 'x' ? answer : first) + (second === 'x' ? answer : second), total);
    }
    if (scope === 'findMinuend') assert(first === 'x' && second >= 10 && second <= 89 && answer - second === total);
    if (scope === 'findSubtrahend') assert(second === 'x' && first >= 20 && first <= 99 && first - answer === total);
  }
}

for (const scope of ['add10', 'subtract10']) {
  const answer = scope === 'add10' ? 10 : 1;
  const options = vm.runInContext(`generateDistractors(${answer}, '${scope}')`, page);
  assert.equal(new Set(options).size, 2);
  assert(options.every(value => value !== answer && value >= (scope === 'add10' ? 10 : 1) && value <= (scope === 'add10' ? 18 : 9)));
}

getElementById('scope').value = 'add10';
getElementById('scope').listeners.change();
assert(getElementById('operation-field').hidden);
assert(!getElementById('answer-mode-field').hidden);
getElementById('count').value = '3';
getElementById('generateBtn').listeners.click();
assert(app.classList.contains('practicing'));
assert.equal(getElementById('practiceTitle').textContent, '🧮 Cộng qua 10');
assert.equal((getElementById('problems').innerHTML.match(/class="mcq-btn"/g) || []).length, 9);
getElementById('gradeBtn').listeners.click();
assert.match(getElementById('scoreBox').innerHTML, /0\/3/);
getElementById('settingsBtn').listeners.click();
assert(!app.classList.contains('practicing'));

getElementById('scope').value = 'two';
getElementById('scope').listeners.change();
assert(!getElementById('operation-field').hidden);
assert(getElementById('answer-mode-field').hidden);
getElementById('operation').value = 'mixed';
getElementById('generateBtn').listeners.click();
assert.match(getElementById('problems').innerHTML, /class="answer"/);
assert.doesNotMatch(getElementById('problems').innerHTML, /mcq-btn/);

getElementById('settingsBtn').listeners.click();
getElementById('scope').value = 'findAddend';
getElementById('scope').listeners.change();
assert(getElementById('operation-field').hidden);
assert(getElementById('layout-field').hidden);
assert(getElementById('answer-mode-field').hidden);
getElementById('generateBtn').listeners.click();
assert.equal(getElementById('practiceTitle').textContent, '🧮 Tìm số hạng x');
assert.equal((getElementById('problems').innerHTML.match(/class="x-answer"/g) || []).length, 3);
assert.equal((getElementById('problems').innerHTML.match(/class="ui-button hint-button"/g) || []).length, 3);
assert.match(getElementById('hintText').textContent, /giá trị x/);

const firstHint = { hidden: true }, secondHint = { hidden: true };
const firstCard = { querySelector: () => firstHint };
const firstHintButton = { disabled: false, closest: selector => selector === '.hint-button' ? firstHintButton : firstCard };
getElementById('problems').listeners.click({ target: firstHintButton });
assert(!firstHint.hidden && firstHintButton.disabled && secondHint.hidden);

const card = new Element(), answerInput = { value: '18' }, result = {};
card.dataset = { index: '0' };
card.querySelector = selector => selector === '.answer' ? answerInput : result;
getElementById('problems').querySelectorAll = () => [card];
vm.runInContext("problems = [{ first: 12, second: 'x', operator: '+', total: 30, answer: 18, findX: true }]; gradeProblems()", page);
assert.match(getElementById('scoreBox').innerHTML, /1\/1/);
answerInput.value = '17';
vm.runInContext('gradeProblems()', page);
assert.match(getElementById('scoreBox').innerHTML, /0\/1/);

for (const [file, scope] of [['cong-qua-10.html', 'add10'], ['tru-qua-10.html', 'subtract10']]) {
  const redirect = fs.readFileSync(__dirname + '/' + file, 'utf8');
  assert.match(redirect, new RegExp(`url=cong-tru-2-chu-so\\.html#${scope}`));
}

console.log('Luyện cộng trừ: bảy phạm vi, gợi ý từng câu, chấm điểm và đường dẫn cũ đều đạt.');

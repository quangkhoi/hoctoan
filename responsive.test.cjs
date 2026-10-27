const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Element {
  constructor() {
    this.style = {}; this.children = []; this.listeners = {};
    const classes = new Set();
    this.classList = {
      add: name => classes.add(name),
      remove: name => classes.delete(name),
      contains: name => classes.has(name),
    };
  }
  addEventListener(type, fn) { this.listeners[type] = fn; }
  appendChild(child) { this.children.push(child); }
  querySelector() { return null; }
  querySelectorAll() { return []; }
}

function load(file, selected) {
  const elements = new Map();
  const getElementById = id => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  };
  const app = new Element(), body = new Element();
  const document = {
    body, getElementById,
    querySelector: selector => selector === '.app' ? app : { value: selected },
    querySelectorAll: () => [],
    createElement: () => new Element(),
  };
  const context = vm.createContext({ document, window: { scrollTo() {} }, Math });
  const html = fs.readFileSync(__dirname + '/' + file, 'utf8');
  vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
  return { context, app, body, getElementById };
}

for (const [file, selected] of [['cong-qua-10.html', 'input'], ['tru-qua-10.html', 'input'], ['cong-tru-2-chu-so.html', 'vertical']]) {
  const page = load(file, selected);
  page.getElementById('count').value = '3';
  page.getElementById('digits').value = '2';
  page.getElementById('operation').value = 'add';
  page.getElementById('generateBtn').listeners.click();
  assert(page.app.classList.contains('practicing'), file);
  const oldProblems = vm.runInContext('problems', page.context);
  page.getElementById('regenerateBtn').listeners.click();
  assert.notEqual(vm.runInContext('problems', page.context), oldProblems, file);
  assert(page.app.classList.contains('practicing'), file);
  assert.match(fs.readFileSync(__dirname + '/' + file, 'utf8'), /class="session-actions ui-actions ui-actions--sticky">[\s\S]*?<a class="ui-button" href="index\.html">← Trang chủ<\/a>[\s\S]*?id="settingsBtn"[\s\S]*?id="regenerateBtn"[\s\S]*?id="gradeBtn"/);
  page.getElementById('gradeBtn').listeners.click();
  assert.match(page.getElementById('scoreBox').innerHTML, /0\/3/, file);
  page.getElementById('settingsBtn').listeners.click();
  assert(!page.app.classList.contains('practicing'), file);
}

const pairs = load('cong-bang-10.html');
const pairButton = new Element();
pairs.context.pairButton = pairButton;
vm.runInContext('showPair(3, 7, pairButton)', pairs.context);
assert(pairs.body.classList.contains('viewing'));
assert.equal(pairs.getElementById('visualBox').children.length, 10);
vm.runInContext('choosePair()', pairs.context);
assert(!pairs.body.classList.contains('viewing'));
assert.equal(pairs.getElementById('displayBox').style.display, 'none');

const findPairs = fs.readFileSync(__dirname + '/tim-cap-so.html', 'utf8');
assert.match(findPairs, /class="ui-actions" id="game-header">[\s\S]*?class="back-link game-home ui-button"[\s\S]*?id="btn-settings"[\s\S]*?id="btn-new"/);
assert.match(fs.readFileSync(__dirname + '/gop-10.html', 'utf8'), /class="practice-actions ui-actions ui-actions--sticky">[\s\S]*?href="index\.html"[\s\S]*?resetVisualizer\(false\)[\s\S]*?startNewRandom\(\)/);
assert.match(fs.readFileSync(__dirname + '/ban-so.html', 'utf8'), /class="game-actions ui-actions ui-actions--sticky">[\s\S]*?href="index\.html"[\s\S]*?id="settings"[\s\S]*?id="new-game"/);
assert.match(fs.readFileSync(__dirname + '/cong-bang-10.html', 'utf8'), /class="ui-actions ui-actions--sticky">[\s\S]*?href="index\.html"[\s\S]*?choosePair\(\)/);

assert.match(fs.readFileSync(__dirname + '/ui.css', 'utf8'), /family=Baloo\+2/);
for (const file of ['index.html', 'gop-10.html', 'cong-bang-10.html', 'minh-hoa-tru-qua-10.html', 'cong-qua-10.html', 'tru-qua-10.html', 'cong-tru-2-chu-so.html', 'tim-cap-so.html', 'ban-so.html']) {
  const html = fs.readFileSync(__dirname + '/' + file, 'utf8');
  assert.match(html, /<link rel="stylesheet" href="ui\.css">/, file);
  for (const [, attributes] of html.matchAll(/<button\b([^>]*)>/g)) {
    if (!attributes.includes('mcq-btn')) assert.match(attributes, /class="[^"]*ui-button/, file);
  }
  for (const [, attributes] of html.matchAll(/<a\b([^>]*href="index\.html"[^>]*)>/g)) {
    assert.match(attributes, /class="[^"]*ui-button/, file);
  }
}

for (const [, page] of fs.readFileSync(__dirname + '/index.html', 'utf8').matchAll(/href="([^"]+\.html)"/g)) {
  assert(fs.existsSync(__dirname + '/' + page), page);
}

console.log('Bố cục: tạo đề, mở cài đặt và chọn cặp số đều đạt.');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const script = fs.readFileSync(__dirname + '/ban-so.html', 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const ids = Object.fromEntries([
  'field', 'setup', 'game', 'result', 'countdown', 'ammo', 'target', 'difficulty',
  'goal', 'result-title', 'result-text', 'again', 'new-game', 'settings', 'left', 'right', 'fire'
].map(id => [id, { hidden: false, textContent: '', handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; } }]));
const drawn = [], guide = [];
ids.field.getContext = () => ({
  ...Object.fromEntries(['fillRect', 'beginPath', 'lineTo', 'stroke', 'arc', 'fill'].map(name => [name, () => {}])),
  moveTo(x, y) { guide.push([x, y]); },
  setLineDash(pattern) { if (pattern.length) guide.push(pattern); },
  fillText(value, x, y) { drawn.push({ value, x, y }); },
});
ids.field.getBoundingClientRect = () => ({ left: 0, width: 320 });
ids.field.setPointerCapture = () => {};
ids.target.value = '10';
ids.difficulty.value = '32';
const bodyClasses = new Set();
const body = { classList: { add: name => bodyClasses.add(name), remove: name => bodyClasses.delete(name) } };
const context = vm.createContext({
  document: { getElementById: id => ids[id], body },
  window: { addEventListener() {} },
  requestAnimationFrame() {},
  performance: { now: () => 0 },
  Math,
});
vm.runInContext(script, context);
const run = code => vm.runInContext(code, context);

run('start()');
assert(bodyClasses.has('playing'));
assert.equal(run('grid.slice(0, 3).flat().filter(value => value !== null).length'), 24);
assert.equal(run('grid.slice(3).flat().filter(value => value !== null).length'), 0);
assert.equal(run('exposedNumbers().includes(target - nextValue)'), true);
run('update(32)');
assert.equal(run('grid.slice(0, 4).flat().filter(value => value !== null).length'), 32);
assert.equal(run('grid.slice(4).flat().filter(value => value !== null).length'), 0);
assert.equal(run('playing'), true);
ids.target.value = '2';
run('start()');
assert.equal(run('grid[0].every(value => value === 1) && nextValue === 1'), true);
ids.target.value = '10';

run('grid = Array.from({length: ROWS}, () => Array(COLS).fill(null)); grid[0][0] = 2; grid[1][0] = 3; grid[2][0] = 4; grid[5][5] = 6;');
assert.equal(run('dropLoose()'), 3);
assert.equal(run('grid[5][5]'), null);
assert.equal(run('falling.length'), 1);

run('start(); grid = Array.from({length: ROWS}, () => Array(COLS).fill(null)); grid[0][0] = 1; shot = {col: 0, y: 60, value: 6}; hit(0, 0);');
assert.equal(run('grid[1][0]'), 6);
run('start(); grid = Array.from({length: ROWS}, () => Array(COLS).fill(null)); grid[0][0] = 1; grid[1][0] = 3; grid[0][1] = 2; grid[1][1] = 5; grid[2][1] = 4; shot = {col: 0, y: 100, value: 6}; hit(1, 0);');
assert.equal(run('grid[2][0]'), null);
assert.equal(run('grid[2][1]'), null);
assert.equal(run('playing'), true);

run('start(); grid = Array.from({length: ROWS}, () => Array(COLS).fill(null)); grid[0][0] = 4; grid[1][0] = 2; grid[1][1] = 3; shot = {col: 0, y: 60, value: 6}; hit(0, 0);');
assert.equal(run('playing'), false);
assert.equal(ids.result.hidden, true);
assert.match(ids['result-title'].textContent, /Chiến thắng/);
assert.equal(run('falling.length'), 2);
run('lastFrame = 100; frame(900)');
assert.equal(ids.result.hidden, false);

run('start(); grid[11][0] = 3; addRow();');
assert.equal(run('playing'), false);
assert.match(ids['result-title'].textContent, /Hết lượt/);

run('start()');
const firedValue = run('nextValue');
ids.field.handlers.pointerdown({ pointerId: 7, clientX: 180, preventDefault() {} });
assert.equal(run('shot'), null);
ids.field.handlers.pointermove({ pointerId: 7, clientX: 220 });
assert.equal(run('lane'), 5);
guide.length = 0;
run('draw()');
assert.equal(guide.some(([x, y]) => x === 220 && y === 486), true);
assert.equal(guide.some(([first, second]) => first === 8 && second === 6), true);
ids.field.handlers.pointerup({ pointerId: 7, clientX: 220 });
assert.equal(run('shot.col'), 5);
assert.equal(run('shot.y'), 460);
assert.equal(run('shot.value'), firedValue);
assert.equal(Number(ids.ammo.textContent), run('nextValue'));
assert.equal(run('exposedNumbers().includes(target - nextValue)'), true);
drawn.length = 0;
run('draw()');
assert.equal(drawn.at(-1).value, Number(run('nextValue')));
assert.equal(drawn.at(-1).y, 501);
ids['new-game'].handlers.click();
assert.equal(run('shot'), null);
assert.equal(run('grid.slice(0, 3).flat().filter(value => value !== null).length'), 24);
ids.settings.handlers.click();
assert(!bodyClasses.has('playing'));
console.log('Bắn số: kiểm tra khởi tạo, đạn, rơi cụm, thắng và thua đều đạt.');

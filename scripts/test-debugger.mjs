import { loadPyodide } from 'pyodide';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const py = await loadPyodide();
const messages = [];
let queue = [];
let stopNumber = 0;
let onStop;
let requestId = 0;
let stdout = '';
py.setStdout({ batched: line => { stdout += line + '\n'; } });
py.setStderr({ batched: line => { stdout += line + '\n'; } });
py.globals.set('_debug_send', text => {
  const message = JSON.parse(text);
  messages.push(message);
  if (message.event === 'stopped') onStop(++stopNumber, message);
});
py.globals.set('_debug_poll', () => false);
py.globals.set('_debug_receive', () => {
  assert.ok(queue.length, 'Debugger paused without a queued test command');
  return JSON.stringify(queue.shift());
});
py.runPython(fs.readFileSync('src/debug/runtime.py', 'utf8'));
const run = py.globals.get('debug_entry');
py.FS.mkdirTree('/Markdown/debug');
const enqueue = (method, args = {}) => {
  const id = ++requestId;
  queue.push({ id, method, args });
  return id;
};
const result = id => messages.find(m => m.kind === 'response' && m.id === id);
const program = '/Markdown/debug/test.py';
py.FS.writeFile(program, 'def twice(x):\n    y = x * 2\n    return y\n\nnumber = 3\nanswer = twice(number)\nprint(answer)\n');
let localsId, stackId, evaluateId, changeId, afterChange;
onStop = number => {
  if (number === 1) enqueue('next');
  else if (number === 2) enqueue('next');
  else if (number === 3) enqueue('stepIn');
  else if (number === 4) {
    stackId = enqueue('stackTrace');
    localsId = enqueue('scopes', { frameId: 1 });
    evaluateId = enqueue('evaluate', { expression: 'x', frameId: 1 });
    // The first scope registered by scopes() receives reference 1.
    changeId = enqueue('setVariable', { variablesReference: 1, name: 'x', value: '5' });
    enqueue('next');
  } else if (number === 5) {
    afterChange = enqueue('evaluate', { expression: 'y' });
    enqueue('stepOut');
  } else enqueue('continue');
};
run(JSON.stringify({ program, stopOnEntry: true, breakpoints: {}, filters: ['uncaught'] }));
assert.equal(result(evaluateId).result.result, '3');
assert.equal(result(changeId).result.value, '5');
assert.equal(result(afterChange).result.result, '10');
assert.equal(result(stackId).result.stackFrames.length, 2);
assert.equal(result(localsId).result.scopes[0].name, '局部变量');
assert.equal(stdout.trim(), '10');
assert.equal(stopNumber, 6);
console.log('PASS: real execution, step over/into/out, stack, scopes, evaluate, setVariable');

messages.length = 0; stopNumber = 0; queue = []; stdout = '';
py.FS.writeFile(program, 'total = 0\nfor i in range(5):\n    total += i\nprint(total)\n');
let conditionValue;
onStop = () => { conditionValue = enqueue('evaluate', { expression: 'i' }); enqueue('continue'); };
run(JSON.stringify({ program, stopOnEntry: false, breakpoints: { [program]: [{ line: 3, condition: 'i == 3' }] }, filters: [] }));
assert.equal(stopNumber, 1);
assert.equal(result(conditionValue).result.result, '3');
assert.equal(stdout.trim(), '10');
console.log('PASS: conditional breakpoint');

messages.length = 0; stopNumber = 0; queue = [];
onStop = () => enqueue('continue');
run(JSON.stringify({ program, stopOnEntry: false, breakpoints: { [program]: [{ line: 3, hitCondition: '3' }] }, filters: [] }));
assert.equal(stopNumber, 1);
messages.length = 0; stopNumber = 0;
run(JSON.stringify({ program, stopOnEntry: false, breakpoints: { [program]: [{ line: 3, logMessage: 'i={i}' }] }, filters: [] }));
assert.equal(stopNumber, 0);
assert.equal(messages.filter(m => m.event === 'output' && m.body.output.startsWith('i=')).length, 5);
console.log('PASS: hit count and logpoints');

for (const file of fs.readdirSync('src/example/debug').filter(name => name.endsWith('.py'))) {
  messages.length = 0; stopNumber = 0;
  py.FS.writeFile(program, fs.readFileSync('src/example/debug/' + file));
  run(JSON.stringify({ program, stopOnEntry: false, breakpoints: {}, filters: ['uncaught'] }));
  assert.equal(stopNumber, 1, file + ' should pause at its deliberate exception');
  assert.equal(messages.find(m => m.event === 'exited').body.exitCode, 1);
}
messages.length = 0; stdout = '';
py.FS.writeFile(program, fs.readFileSync('src/example/debug/参考答案/答案与检验.py'));
run(JSON.stringify({ program, noDebug: true, breakpoints: {}, filters: [] }));
assert.equal(messages.find(m => m.event === 'exited').body.exitCode, 0);
assert.match(stdout, /五项练习全部通过/);
console.log('PASS: all five deliberate bugs, exception stops, and corrected solutions');
run.destroy();

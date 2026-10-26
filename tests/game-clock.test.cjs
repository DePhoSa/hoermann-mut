const { test } = require('node:test');
const assert = require('node:assert/strict');
const clock = require('../game-clock.js');
test('same simulation step count at 30, 60, 120, 144 and 240 display Hz', () => {
  for (const hz of [30, 60, 120, 144, 240]) {
    let ticks = 0; clock.reset('test');
    for (let frame = 0; frame <= hz * 2; frame++) clock.run('test', frame * 1000 / hz, () => ticks++);
    assert.equal(ticks, 121, hz + ' Hz');
  }
});
test('long pauses do not fast-forward gameplay, and restart resets old time', () => {
  let ticks = 0; clock.reset('pause');
  clock.run('pause', 0, () => ticks++);
  clock.run('pause', 10000, () => ticks++);
  assert.equal(ticks, 1);
  clock.reset('pause'); clock.run('pause', 20000, () => ticks++);
  assert.equal(ticks, 2);
});
test('independent games do not share accumulated time', () => {
  let a = 0, b = 0;
  clock.reset('a'); clock.reset('b');
  clock.run('a', 0, () => a++); clock.run('b', 10, () => b++);
  clock.run('a', 1000 / 60, () => a++);
  assert.equal(a, 2); assert.equal(b, 1);
});

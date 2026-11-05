import test from 'node:test'
import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'
import { createSpinEase, normalize, randomInt, randomOffset, segmentAtPointer, targetRotation } from '../src/lib/wheelMath.js'

const COUNT = 6

test('segment 0 is under the pointer at rotation 0', () => {
  assert.equal(segmentAtPointer(0, COUNT), 0)
})

test('rotating the wheel clockwise brings the previous segment to the pointer', () => {
  assert.equal(segmentAtPointer(60, COUNT), 5)
  assert.equal(segmentAtPointer(-60, COUNT), 1)
  assert.equal(segmentAtPointer(300, COUNT), 1)
})

test('segment edges fall exactly half a segment from centre', () => {
  assert.equal(segmentAtPointer(-29.9, COUNT), 0)
  assert.equal(segmentAtPointer(-30.1, COUNT), 1)
  assert.equal(segmentAtPointer(29.9, COUNT), 0)
  assert.equal(segmentAtPointer(30.1, COUNT), 5)
})

test('every target lands on the chosen winner, across 60,000 spins from drifting start angles', () => {
  let current = 0
  for (let i = 0; i < 60000; i += 1) {
    const winner = randomInt(COUNT, webcrypto)
    const offset = randomOffset(COUNT, 7, webcrypto)
    const next = targetRotation({ current, winner, count: COUNT, turns: 5 + (i % 3), offset })
    assert.equal(segmentAtPointer(next, COUNT), winner)
    // Rotation accumulates in floating point, so allow for rounding noise.
    const travel = next - current
    assert.ok(travel >= (5 + (i % 3)) * 360 - 1e-6, 'always spins forward by the full turns')
    assert.ok(travel < (6 + (i % 3)) * 360 + 1e-6, 'never adds more than one extra turn')
    current = next
  }
})

test('the stop point stays clear of the segment edges', () => {
  for (let i = 0; i < 20000; i += 1) {
    const offset = randomOffset(COUNT, 7, webcrypto)
    assert.ok(Math.abs(offset) <= 23, `offset ${offset} too close to an edge`)
  }
})

test('prizes are selected evenly', () => {
  const tally = Array(COUNT).fill(0)
  const runs = 120000
  for (let i = 0; i < runs; i += 1) tally[randomInt(COUNT, webcrypto)] += 1
  for (const hits of tally) assert.ok(Math.abs(hits / runs - 1 / COUNT) < 0.01, `uneven tally ${tally}`)
})

test('spin easing starts at 0, ends at 1, never reverses, and has no speed jump', () => {
  const ease = createSpinEase()
  assert.equal(ease(0), 0)
  assert.equal(ease(1), 1)
  let last = 0
  let lastStep = 0
  const dt = 1 / 2000
  for (let t = dt; t <= 1; t += dt) {
    const value = ease(t)
    const step = value - last
    assert.ok(step >= -1e-12, 'never moves backwards')
    assert.ok(Math.abs(step - lastStep) < 0.0005, `speed jump at t=${t.toFixed(3)}`)
    last = value
    lastStep = step
  }
})

test('normalize wraps any angle into 0 to 360', () => {
  assert.equal(normalize(-30), 330)
  assert.equal(normalize(725), 5)
})

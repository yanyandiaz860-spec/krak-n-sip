/**
 * Pure maths for the Krak N Spin wheel. No DOM, so it can be unit tested.
 *
 * Conventions: the pointer sits at the top of the wheel. Segment 0 is centred
 * under the pointer when rotation is 0, and segment numbers increase clockwise.
 * Rotation is in degrees, clockwise, and is never wrapped while spinning.
 */

export const normalize = (deg) => ((deg % 360) + 360) % 360

/** Which segment is under the pointer for a given wheel rotation. */
export function segmentAtPointer(rotation, count) {
  const size = 360 / count
  return Math.floor(normalize(-rotation + size / 2) / size) % count
}

/**
 * Final rotation that lands `winner` under the pointer. Always moves forward by
 * at least `turns` full turns from `current`. `offset` shifts the stop point
 * inside the segment so the wheel does not always stop dead centre.
 */
export function targetRotation({ current, winner, count, turns, offset = 0 }) {
  const size = 360 / count
  const stopAt = normalize(-(winner * size + offset))
  const base = current + turns * 360
  return base + normalize(stopAt - normalize(base))
}

/** Unbiased integer in [0, max) from the browser's crypto source. */
export function randomInt(max, source = globalThis.crypto) {
  const limit = Math.floor(0xffffffff / max) * max
  const buffer = new Uint32Array(1)
  do {
    source.getRandomValues(buffer)
  } while (buffer[0] >= limit)
  return buffer[0] % max
}

/** Random offset that keeps the pointer clear of the segment edges. */
export function randomOffset(count, margin = 7, source = globalThis.crypto) {
  const half = 360 / count / 2 - margin
  return (randomInt(2001, source) / 1000 - 1) * half
}

/**
 * Easing for the spin: a short quadratic speed-up that joins, with matching
 * speed, a long power curve slowing to a stop.
 */
export function createSpinEase(accelerate = 0.16, power = 3.4) {
  const a = accelerate
  const p = power
  const c = 1 / ((1 - a) ** (p - 1) * ((p * a) / 2 + (1 - a)))
  const k = (c * p * (1 - a) ** (p - 1)) / (2 * a)
  return (t) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    return t < a ? k * t * t : 1 - c * (1 - t) ** p
  }
}

import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { gsap, prefersReducedMotion } from '../lib/motion'
import { createSpinEase, randomInt, randomOffset, segmentAtPointer, targetRotation } from '../lib/wheelMath'
import { DEMO_NOTICE, prizes } from '../data/wheel'
import { WaveEdge } from '../components/ui'

const COUNT = prizes.length
const SEGMENT = 360 / COUNT
const CENTER = 300
const RADIUS = 268
const spinEase = createSpinEase()

function polar(angle, radius) {
  const radians = ((angle - 90) * Math.PI) / 180
  return [CENTER + radius * Math.cos(radians), CENTER + radius * Math.sin(radians)]
}

function segmentPath(index) {
  const [x1, y1] = polar(index * SEGMENT - SEGMENT / 2, RADIUS)
  const [x2, y2] = polar(index * SEGMENT + SEGMENT / 2, RADIUS)
  return `M${CENTER} ${CENTER} L${x1} ${y1} A${RADIUS} ${RADIUS} 0 0 1 ${x2} ${y2} Z`
}

function TicketIcon({ color }) {
  return (
    <g transform="translate(262 70)" fill="none" stroke={color} strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M2 2h72v12a7 7 0 0 0 0 14v12H2V28a7 7 0 0 0 0-14Z" />
      <path d="M24 3v36" strokeDasharray="4 5" />
      <path d="M58 11 40 31" />
      <circle cx="42" cy="14" r="3.4" />
      <circle cx="56" cy="28" r="3.4" />
    </g>
  )
}

function GiftIcon({ color }) {
  return (
    <g transform="translate(272 62)" fill="none" stroke={color} strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M3 18h50v12H3zM8 30v24h40V30M28 18v36" />
      <path d="M28 18C20 4 8 4 10 12c1 5 10 6 18 6Zm0 0C36 4 48 4 46 12c-1 5-10 6-18 6Z" />
    </g>
  )
}

function Wheel() {
  return (
    <svg viewBox="0 0 600 600" role="presentation">
      <circle cx={CENTER} cy={CENTER} r="296" fill="#145BDC" />
      <circle cx={CENTER} cy={CENTER} r="276" fill="#FD791B" />
      {prizes.map(({ id, lines, icon }, index) => {
        const isBlue = index % 2 === 0
        const ink = isBlue ? '#FFFFFF' : '#102A5B'
        const hasIcon = Boolean(icon)
        const firstLine = hasIcon ? 152 : lines.length === 3 ? 108 : 124
        const fontSize = lines.length === 3 ? 33 : 37
        return (
          <g key={id}>
            <path d={segmentPath(index)} fill={isBlue ? '#145BDC' : '#FFBE30'} data-segment={index} data-prize={id} />
            <g transform={`rotate(${index * SEGMENT} ${CENTER} ${CENTER})`} style={{ pointerEvents: 'none' }}>
              {icon === 'ticket' && <TicketIcon color={ink} />}
              {icon === 'gift' && <GiftIcon color={ink} />}
              <text x={CENTER} y={firstLine} textAnchor="middle" fill={ink} fontFamily="Poppins, sans-serif" fontSize={fontSize} fontWeight="700">
                {lines.map((line, lineIndex) => (
                  <tspan key={line} x={CENTER} dy={lineIndex === 0 ? 0 : fontSize + 3}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          </g>
        )
      })}
      {prizes.map(({ id }, index) => {
        const [x, y] = polar(index * SEGMENT + SEGMENT / 2, 285)
        return <circle key={id} cx={x} cy={y} r="8" fill="#FFF9F2" stroke="#102A5B" strokeWidth="2" style={{ pointerEvents: 'none' }} />
      })}
      <g style={{ pointerEvents: 'none' }}>
        <circle cx={CENTER} cy={CENTER} r="66" fill="#FD791B" />
        <circle cx={CENTER} cy={CENTER} r="58" fill="#102A5B" />
        <image href="/images/brand/secondary-logo-small.webp" x={CENTER - 54} y={CENTER - 54} width="108" height="108" />
      </g>
    </svg>
  )
}

function celebrate(wheelEl, prize) {
  const box = wheelEl.getBoundingClientRect()
  const origin = {
    x: (box.left + box.width / 2) / window.innerWidth,
    y: (box.top + box.height / 2) / window.innerHeight,
  }
  if (prize.isMiss) {
    confetti({ particleCount: 36, spread: 80, startVelocity: 26, gravity: 1.1, scalar: 0.9, ticks: 130, origin, colors: ['#1F65FF', '#77C9F4', '#FFFFFF'], disableForReducedMotion: true })
    return
  }
  const colors = ['#FD791B', '#163893', '#FFBE30', '#1F65FF', '#FFFFFF']
  confetti({ particleCount: 150, spread: 110, startVelocity: 46, ticks: 260, origin, colors, disableForReducedMotion: true })
  confetti({ particleCount: 60, angle: 60, spread: 70, startVelocity: 56, ticks: 240, origin: { x: 0, y: 0.75 }, colors, disableForReducedMotion: true })
  confetti({ particleCount: 60, angle: 120, spread: 70, startVelocity: 56, ticks: 240, origin: { x: 1, y: 0.75 }, colors, disableForReducedMotion: true })
}

export default function KrakNSpin() {
  const [phase, setPhase] = useState('idle')
  const [result, setResult] = useState(null)
  const rotorRef = useRef(null)
  const pointerRef = useRef(null)
  const cardRef = useRef(null)
  const rotation = useRef(0)
  const isBusy = useRef(false)
  const tween = useRef(null)

  useEffect(
    () => () => {
      tween.current?.kill()
      confetti.reset()
    },
    [],
  )

  function finish(target) {
    rotation.current = target
    gsap.set(rotorRef.current, { rotation: target, lazy: false })
    // Read the prize back from the wheel's final angle, so the text can only ever
    // show what is really under the pointer.
    const landed = segmentAtPointer(target, COUNT)
    const prize = prizes[landed]
    rotorRef.current.dataset.landed = String(landed)
    isBusy.current = false
    setResult(prize)
    setPhase('done')
    celebrate(rotorRef.current, prize)
    if (!prefersReducedMotion()) {
      gsap.fromTo(cardRef.current, { scale: 0.9, rotation: -2 }, { scale: 1, rotation: 0, duration: 0.55, ease: 'back.out(2.6)' })
    }
  }

  function spin() {
    if (isBusy.current) return
    isBusy.current = true
    setResult(null)
    setPhase('spinning')

    const winner = randomInt(COUNT)
    const start = rotation.current
    const target = targetRotation({
      current: start,
      winner,
      count: COUNT,
      turns: 6 + randomInt(3),
      offset: randomOffset(COUNT),
    })
    rotorRef.current.dataset.winner = String(winner)

    if (prefersReducedMotion()) {
      finish(target)
      return
    }

    let lastPeg = Math.floor((start + SEGMENT / 2) / SEGMENT)
    tween.current = gsap.fromTo(rotorRef.current, { rotation: start }, {
      rotation: target,
      duration: 5.4,
      ease: spinEase,
      onUpdate() {
        const peg = Math.floor((gsap.getProperty(rotorRef.current, 'rotation') + SEGMENT / 2) / SEGMENT)
        if (peg !== lastPeg) {
          lastPeg = peg
          gsap.fromTo(pointerRef.current, { rotation: -13 }, { rotation: 0, duration: 0.2, ease: 'power2.out', overwrite: true })
        }
      },
      onComplete: () => finish(target),
    })
  }

  const spinning = phase === 'spinning'
  const buttonLabel = spinning ? 'Spinning...' : phase === 'done' ? 'Play Again' : 'Spin the wheel'

  return (
    <section id="spin" className="section zone-spin pt-[calc(var(--section-y)+40px)] pb-[calc(var(--section-y)+50px)]" aria-labelledby="spin-title">
      <WaveEdge fill="#102A5B" shape="chop" flip />
      <div className="wrap spin-grid">
        <div className="wheel-shell" data-testid="wheel-shell">
          <svg ref={pointerRef} className="wheel-pointer" viewBox="0 0 70 84" aria-hidden="true">
            <path d="M6 8 Q2 2 10 2 H60 Q68 2 64 8 L38 76 Q35 82 32 76 Z" fill="#FFF9F2" stroke="#102A5B" strokeWidth="5" strokeLinejoin="round" />
          </svg>
          <div ref={rotorRef} className="wheel-rotor" data-testid="wheel-rotor" role="img" aria-label={`Prize wheel with six segments: ${prizes.map(({ label }) => label).join(', ')}.`}>
            <Wheel />
          </div>
        </div>

        <div className="spin-panel">
          <p className="spin-ready">READY TO</p>
          <h2 id="spin-title" className="spin-title">
            <span className="krak">KRAK</span>
            <span className="and-spin">AND SPIN?</span>
          </h2>

          <div ref={cardRef} className="result-card" role="status" aria-live="polite" data-testid="result">
            {result ? (
              <>
                <p className="result-eyebrow">{result.isMiss ? 'So close!' : 'You landed on'}</p>
                <p className="result-prize" data-prize-text>
                  {result.label}
                </p>
              </>
            ) : (
              <>
                <p className="result-eyebrow">{spinning ? 'Round and round it goes...' : 'Six prizes on the wheel.'}</p>
                <p className="result-prize opacity-50" aria-hidden={spinning}>
                  {spinning ? '...' : 'Your turn'}
                </p>
              </>
            )}
          </div>

          <button type="button" className="btn text-lg" style={{ '--btn-bg': 'var(--color-cup)', '--btn-fg': '#fff' }} aria-disabled={spinning} onClick={spin} data-testid="spin-button">
            {buttonLabel}
          </button>
          <p className="demo-note">{DEMO_NOTICE}</p>
        </div>
      </div>
      <WaveEdge fill="#FFF0D4" shape="lift" />
    </section>
  )
}

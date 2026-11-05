import { useRef, useState } from 'react'
import { gsap, PINNED, ScrollTrigger, useGSAP } from '../lib/motion'
import { logoBreakdown, logoComponents, logoPalettes, logoTypography } from '../data/content'
import { logoProcess, logos } from '../data/logos'
import { ArtSlot, OutputTag, Palette, Sticker, WaveEdge } from '../components/ui'

const WHITE = '#fff'
const ORANGE = 'var(--color-tray)'
const BLUE = 'var(--color-cup)'

function Bubbles() {
  const bubbles = [
    [6, 18, 13], [15, 10, 17], [28, 24, 11], [44, 12, 19], [58, 20, 14], [71, 9, 16], [84, 26, 12], [93, 14, 20],
  ]
  return (
    <div className="bubble-field" aria-hidden="true">
      {bubbles.map(([left, size, duration], index) => (
        <i key={left} style={{ left: `${left}%`, width: size, height: size, animationDuration: `${duration}s`, animationDelay: `${index * -2.3}s` }} />
      ))}
    </div>
  )
}

/** CT#1 opener. The process area is a placeholder until the original artwork is supplied. */
export function LogoProcess() {
  return (
    <section id="logo" className="section zone-cool" aria-labelledby="logo-title">
      <Bubbles />
      <div className="wrap relative">
        <div data-reveal="up">
          <OutputTag code="CT#1" label="Logo Design" onDark />
          <Sticker
            id="logo-title"
            size="lg"
            outline="var(--color-navy)"
            words={[
              ['Logo', WHITE, -2],
              ['Design', ORANGE, 1],
            ]}
          />
        </div>
        <h3 className="spec-title mt-[clamp(28px,4vw,48px)] text-[1.6rem]">Logo Design Process</h3>
        {logoProcess.length === 0 ? (
          <ArtSlot title="Logo Design Process" note="The original process artwork will appear here." className="min-h-[clamp(220px,30vw,360px)]" />
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {logoProcess.map(({ src, alt }) => (
              <ArtSlot key={src} src={src} alt={alt} />
            ))}
          </div>
        )}
      </div>
      <WaveEdge fill="#FFF0D4" shape="swell" />
    </section>
  )
}

/** K, S and I: pinned and driven by scroll on large screens, tap-through everywhere else. */
export function LogoBreakdown() {
  const root = useRef(null)
  const trigger = useRef(null)
  const [active, setActive] = useState(0)
  const item = logoBreakdown[active]

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(PINNED, () => {
        trigger.current = ScrollTrigger.create({
          trigger: root.current,
          start: 'top top',
          end: '+=170%',
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => setActive(Math.min(logoBreakdown.length - 1, Math.floor(self.progress * logoBreakdown.length))),
        })
        return () => {
          trigger.current = null
        }
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  function choose(next) {
    const pinned = trigger.current
    if (pinned) {
      const span = pinned.end - pinned.start
      window.scrollTo({ top: pinned.start + (span * (next + 0.5)) / logoBreakdown.length })
    }
    setActive(next)
  }

  function onKey(event) {
    const moves = { ArrowRight: 1, ArrowLeft: -1 }
    if (!(event.key in moves)) return
    event.preventDefault()
    const next = (active + moves[event.key] + logoBreakdown.length) % logoBreakdown.length
    choose(next)
    root.current.querySelector(`#letter-${logoBreakdown[next].id}`)?.focus()
  }

  return (
    <section id="logo-breakdown" ref={root} className="breakdown" aria-labelledby="breakdown-title">
      <div className="wrap breakdown-grid">
        <div className="breakdown-art" role="img" aria-label={`Krak N Sip mascot with the part for the letter ${item.letter} highlighted`}>
          {logoBreakdown.map(({ id, image }, index) => (
            <img key={id} src={image} alt="" width="857" height="889" data-active={index === active} loading="lazy" decoding="async" />
          ))}
        </div>
        <div>
          <Sticker
            id="breakdown-title"
            size="md"
            words={[
              ['Logo', BLUE, -2],
              ['Breakdown', ORANGE, 1],
            ]}
          />
          <div className="letter-tabs" role="tablist" aria-label="Letters hidden in the logo" onKeyDown={onKey}>
            {logoBreakdown.map(({ id, letter }, index) => (
              <button
                key={id}
                id={`letter-${id}`}
                type="button"
                role="tab"
                className="letter-tab"
                aria-selected={index === active}
                aria-controls="breakdown-panel"
                tabIndex={index === active ? 0 : -1}
                onClick={() => choose(index)}
              >
                {letter}
              </button>
            ))}
          </div>
          <div id="breakdown-panel" role="tabpanel" aria-labelledby={`letter-${item.id}`} aria-live="polite">
            <h3 className="m-0 font-display text-[clamp(1.75rem,3.2vw,2.75rem)] font-black leading-[1.1] text-cup">{item.heading}</h3>
            <p className="breakdown-body">{item.body}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Components, the logo family, and the logo palette and typography. */
export function LogoSystem() {
  return (
    <section id="logo-system" className="section zone-cool pt-[calc(var(--section-y)+40px)]" aria-label="Logo components, versions, colours and typography">
      <WaveEdge fill="#FFF0D4" shape="chop" flip />
      <Bubbles />
      <div className="wrap relative">
        <Sticker
          size="sm"
          as="h3"
          outline="var(--color-navy)"
          words={[
            ['Logo', WHITE, 0],
            ['Components', ORANGE, 0],
          ]}
        />
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {logoComponents.map(({ title, body, image, width, height }, index) => (
            <article key={title} className="frame p-6" data-reveal="up" data-reveal-delay={index * 0.08}>
              <div className="mb-4 grid h-[150px] place-items-center">
                <img src={image} alt="" width={width} height={height} loading="lazy" decoding="async" className="h-[150px] w-full object-contain" />
              </div>
              <h4 className="m-0 font-display text-xl font-black leading-tight text-cup">{title}</h4>
              <p className="mt-1.5 mb-0 text-[0.975rem]">{body}</p>
            </article>
          ))}
        </div>

        <Sticker
          size="sm"
          as="h3"
          className="mt-[clamp(48px,7vw,84px)]"
          outline="var(--color-navy)"
          words={[
            ['Our', WHITE, 0],
            ['Logos', ORANGE, 0],
          ]}
        />
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {logos.map(({ id, label, src, alt }, index) => (
            <figure key={id} className="m-0" data-reveal="up" data-reveal-delay={index * 0.08}>
              <ArtSlot title={label} src={src} alt={alt} note="Official logo file to be added." className="aspect-square" />
              <figcaption className="mt-3 text-center font-bold">{label}</figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-[clamp(48px,7vw,84px)] grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="spec-card">
            <h3 className="spec-title">Color Palette</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {logoPalettes.map(({ title, colors }) => (
                <div key={title}>
                  <p className="mt-0 mb-1 text-[0.9rem] font-semibold">{title}</p>
                  <Palette colors={colors} lineColor="var(--color-navy)" />
                </div>
              ))}
            </div>
          </div>
          <div className="spec-card !mt-0">
            <h3 className="spec-title">Typography</h3>
            <p className="m-0 text-[clamp(3.5rem,6vw,5rem)] leading-none font-black font-display">
              <span className="text-cup">A</span>
              <span className="text-tray">a</span>
            </p>
            <p className="mt-3 mb-0">{logoTypography}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

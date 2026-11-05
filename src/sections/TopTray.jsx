import { useRef } from 'react'
import { gsap, MOTION_OK, useGSAP } from '../lib/motion'
import { meetTheBrand, missionVision, story, uniqueAppeal } from '../data/content'
import { products } from '../data/products'
import { teamMembers } from '../data/team'
import { OutputTag, Sticker, WaveEdge } from '../components/ui'

const ORANGE = 'var(--color-tray)'
const BLUE = 'var(--color-cup)'
const SAND = '#FFF0D4'

const MEET_ICONS = ['/images/brand/icon-seafood.webp', '/images/brand/icon-on-the-go.webp', '/images/brand/icon-cup.webp']

export function MeetBrand() {
  return (
    <section id="brand" className="section" aria-labelledby="meet-title">
      <div className="wrap grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div data-reveal="left">
          <OutputTag code="PT#1" label="Business Concept Development" />
          <Sticker
            id="meet-title"
            size="lg"
            words={[
              ['Meet the', BLUE, -2],
              ['Brand', ORANGE, 1],
            ]}
          />
        </div>
        <ul className="m-0 list-none p-0">
          {meetTheBrand.map((line, index) => (
            <li key={line} className="meet-line" data-reveal="up" data-reveal-delay={index * 0.08}>
              <img src={MEET_ICONS[index]} alt="" width="80" height="80" loading="lazy" className="size-[clamp(52px,6vw,76px)] rounded-full" />
              {line}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function BrandStory() {
  const root = useRef(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          '.story-cup',
          { yPercent: 12, rotation: 7 },
          { yPercent: -10, rotation: -3, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 } },
        )
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  const cup = products[0]

  return (
    <section id="story" ref={root} className="section bg-tray pb-[calc(var(--section-y)+60px)]" aria-labelledby="story-title">
      <WaveEdge fill={ORANGE} shape="chop" className="!bottom-auto top-[calc(clamp(44px,8vw,120px)*-1+1px)]" />
      <div className="wrap grid items-center gap-8 md:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[clamp(28px,4vw,56px)] bg-cream p-[clamp(26px,5vw,68px)]" data-reveal="up">
          <Sticker
            id="story-title"
            size="lg"
            words={[
              ['Our', BLUE, -3],
              ['Brand', ORANGE, 1],
              ['Story', BLUE, -1],
            ]}
          />
          <p className="mt-7 mb-5 inline-block rounded-full bg-tray px-5 py-1.5 text-lg font-bold text-navy shadow-[-4px_4px_0_var(--color-cup)]">{story.founded}</p>
          <p className="m-0 max-w-[46ch] text-[clamp(1.1rem,1.7vw,1.4rem)] leading-[1.5] text-cup">{story.body}</p>
        </div>
        <div className="story-cup mx-auto w-[min(70%,330px)] md:w-full md:max-w-[380px]">
          <img src={cup.image} alt={`${cup.name} cup with grilled seafood on top of a chilled drink`} width={cup.width} height={cup.height} loading="lazy" decoding="async" />
        </div>
      </div>
      <WaveEdge fill={SAND} shape="lift" />
    </section>
  )
}

const LAYER_STYLES = [
  { background: 'var(--color-tray)', color: 'var(--color-navy)' },
  { background: 'var(--color-cup)', color: '#fff' },
  { background: 'var(--color-cream)', color: 'var(--color-cup)', boxShadow: '0 -10px 0 rgb(16 42 91 / 0.12), inset 0 0 0 4px var(--color-cup)' },
]

export function MissionVision() {
  return (
    <section id="mission" className="section" aria-labelledby="mv-title">
      <div className="wrap">
        <div className="mb-[clamp(32px,5vw,64px)] text-center" data-reveal="up">
          <Sticker
            id="mv-title"
            size="lg"
            words={[
              ['Mission', BLUE, -2],
              ['&', ORANGE, 0],
              ['Vision', BLUE, 2],
            ]}
          />
        </div>
        {missionVision.map(({ id, title, body }, index) => (
          <article key={id} className="layer" style={{ ...LAYER_STYLES[index], zIndex: index + 1 }}>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export function Team() {
  return (
    <section id="team" className="section pt-[clamp(24px,4vw,56px)]" aria-labelledby="team-title">
      <div className="wrap">
        <div className="mb-[clamp(32px,5vw,60px)] text-center" data-reveal="up">
          <Sticker
            id="team-title"
            size="lg"
            words={[
              ['Meet', BLUE, -2],
              ['Our', BLUE, 0],
              ['Team', ORANGE, 2],
            ]}
          />
        </div>
        <div className="team-grid">
          {teamMembers.map(({ id, name, image, isTemporary }, index) => {
            const blue = index % 2 === 1
            return (
              <figure
                key={id}
                className="team-card"
                data-reveal="pop"
                data-reveal-delay={index * 0.08}
                style={{ '--edge': blue ? 'var(--color-cup)' : 'var(--color-tray)', '--name-fg': blue ? '#fff' : 'var(--color-navy)' }}
              >
                <div className="team-photo">
                  <img src={image} alt={isTemporary ? `Temporary template photo shown for ${name}` : `Portrait of ${name}`} width="538" height="716" loading="lazy" decoding="async" />
                </div>
                <figcaption>
                  <span className="team-name">{name}</span>
                  {isTemporary && <span className="team-temp">Temporary photo</span>}
                </figcaption>
              </figure>
            )
          })}
        </div>
      </div>
    </section>
  )
}

const TILTS = ['-3deg', '2deg', '-2deg']
const EDGES = [ORANGE, BLUE, ORANGE]

export function UniqueAppeal() {
  return (
    <section id="unique" className="section overflow-hidden pb-[calc(var(--section-y)+90px)]" aria-labelledby="unique-title">
      <div className="appeal-stripes hidden md:block" aria-hidden="true">
        <i className="left-[6%] w-[22%] bg-cup" />
        <i className="left-[28%] w-[26%] bg-tray" />
        <i className="left-[54%] right-[-20%] bg-[#F65B1B]" />
      </div>
      <div className="wrap relative">
        <div data-reveal="left">
          <Sticker
            id="unique-title"
            size="lg"
            words={[
              ['Unique', BLUE, -1],
              ['Appeal', ORANGE, 1],
            ]}
          />
        </div>
        <div className="mt-[clamp(32px,5vw,60px)] grid gap-8 md:grid-cols-3 md:gap-7">
          {uniqueAppeal.map(({ title, body }, index) => (
            <article key={title} className="appeal-card" data-reveal="pop" data-reveal-delay={index * 0.1} style={{ '--tilt': TILTS[index], '--edge': EDGES[index] }}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

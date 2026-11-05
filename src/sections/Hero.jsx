import { useRef } from 'react'
import { gsap, MOTION_OK, PINNED, UNPINNED, useGSAP } from '../lib/motion'
import { brand } from '../data/content'
import { products } from '../data/products'
import SplitCup from '../components/SplitCup'

const heroCup = products[1]

/** The tray starts above the cup. Scrolling seats it, then the tagline completes. */
function buildAssembly(root, scrollTrigger) {
  const q = gsap.utils.selector(root)
  const tray = q('.cup-part-top img')
  const cup = q('.cup-part-bottom img')
  gsap.set(tray, { yPercent: -13 })
  gsap.set(q('.hero-note'), { autoAlpha: 0, scale: 0.7 })
  gsap.set(q('.hero-splash'), { autoAlpha: 0, scale: 0.3 })

  return gsap
    .timeline({ defaults: { ease: 'none' }, paused: !scrollTrigger, scrollTrigger })
    .to(q('.note-top'), { autoAlpha: 1, scale: 1, duration: 0.2, ease: 'back.out(2)' }, 0.05)
    .to(tray, { yPercent: 0, duration: 0.7, ease: 'power2.in' }, 0.1)
    .to(cup, { scaleY: 0.97, transformOrigin: '50% 100%', duration: 0.07 }, 0.76)
    .to(cup, { scaleY: 1, duration: 0.16, ease: 'back.out(3)' }, 0.83)
    .to(q('.hero-splash'), { autoAlpha: 1, scale: 1, duration: 0.2, ease: 'back.out(2.2)' }, 0.78)
    .to(q('.note-bottom'), { autoAlpha: 1, scale: 1, duration: 0.2, ease: 'back.out(2)' }, 0.82)
    .to(q('.note-end'), { autoAlpha: 1, scale: 1, duration: 0.2, ease: 'back.out(2)' }, 0.95)
}

export default function Hero() {
  const root = useRef(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      const q = gsap.utils.selector(root)

      mm.add(MOTION_OK, () => {
        gsap.from(q('.hero-title [data-word]'), {
          yPercent: 60,
          rotation: -8,
          scale: 0.7,
          autoAlpha: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'back.out(1.9)',
        })
        gsap.from(q('.hero-tagline, .hero-actions'), { y: 24, autoAlpha: 0, duration: 0.7, delay: 0.45, stagger: 0.1, ease: 'power3.out' })
        gsap.from(q('.hero-disc'), { scale: 0.6, autoAlpha: 0, duration: 0.9, ease: 'back.out(1.5)' })
      })

      mm.add(PINNED, () => {
        buildAssembly(root.current, { trigger: root.current, start: 'top top', end: '+=120%', pin: true, scrub: 0.5, anticipatePin: 1 })
      })

      // Phones and tablets play the same moment once instead of pinning the page.
      mm.add(UNPINNED, () => {
        gsap.to(buildAssembly(root.current), { progress: 1, duration: 1.9, delay: 0.9, ease: 'none' })
      })

      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section id="home" ref={root} className="hero" aria-labelledby="hero-title">
      <svg className="absolute inset-0 size-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d="M0 0H1010C880 96 742 64 566 120S230 206 0 176Z" fill="#FD791B" />
        <path d="M0 0H820C700 52 560 40 420 78S120 120 0 92Z" fill="#163893" />
        <path d="M1160 0H1440V168C1370 214 1290 176 1250 120S1190 40 1160 0Z" fill="#163893" />
        <path d="M0 900V772C190 700 400 790 600 802S1000 880 1180 830 1380 760 1440 770V900Z" fill="#FD791B" />
        <path d="M0 900V838C240 780 420 852 640 866S1040 912 1440 842V900Z" fill="#163893" />
      </svg>

      <div className="wrap hero-grid">
        <div>
          <h1 id="hero-title" className="sticker hero-title">
            <span className="sr-only">Krak N Sip</span>
            <span aria-hidden="true">
              <span className="sticker-word" data-word style={{ color: 'var(--color-tray)', transform: 'rotate(-2deg)' }}>
                KRAK
              </span>
              <br />
              <span className="sticker-word" data-word style={{ color: 'var(--color-cup)' }}>
                N
              </span>{' '}
              <span className="sticker-word" data-word style={{ color: 'var(--color-tray)', transform: 'rotate(1.5deg)' }}>
                SIP
              </span>
            </span>
          </h1>
          <p className="hero-tagline">{brand.tagline}</p>
          <div className="hero-actions flex flex-wrap gap-3.5">
            <a className="btn" href="#brand">
              Meet the brand
            </a>
            <a className="btn btn-ghost" href="#spin">
              Krak N Spin
            </a>
          </div>
        </div>

        <div className="hero-cup">
          <div className="hero-disc absolute inset-[6%_-8%_4%] rounded-[48%_52%_44%_56%/52%_46%_54%_48%] bg-cup" aria-hidden="true" />
          <SplitCup product={heroCup} alt="A Krak cup: grilled seafood in the top tray, seated on a chilled drink below" loading="eager" fetchPriority="high" className="relative z-[1]" />
          <img className="hero-splash absolute -left-[2%] top-[42%] z-[2] w-[17%]" src="/images/brand/component-droplets.webp" alt="" width="247" height="256" />
          <img className="hero-splash absolute -right-[3%] top-[34%] z-[2] w-[13%] -scale-x-100" src="/images/brand/component-droplets.webp" alt="" width="247" height="256" />
          <span className="hero-note note-top -left-[9%] top-[8%] -rotate-3">Tasty on the top</span>
          <span className="hero-note note-bottom -right-[7%] top-[60%] rotate-2 max-lg:top-[79%]">juicy at the bottom</span>
          <span className="hero-note note-end bottom-[6%] left-[2%] -rotate-2 max-lg:-bottom-[2%]">non-stop.</span>
        </div>
      </div>
    </section>
  )
}

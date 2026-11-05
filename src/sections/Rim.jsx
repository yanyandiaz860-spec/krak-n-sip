import { useRef } from 'react'
import { gsap, MOTION_OK, useGSAP } from '../lib/motion'
import { Sticker } from '../components/ui'

const WAVE = 'M0 60 C 120 10 240 10 360 60 S 600 110 720 60 S 960 10 1080 60 S 1320 110 1440 60 C 1560 10 1680 10 1800 60 S 2040 110 2160 60 S 2400 10 2520 60 S 2760 110 2880 60 V 120 H 0 Z'

function LiquidWave({ fill, className = '', style }) {
  return (
    <svg className={`rim-wave ${className}`} style={style} viewBox="0 0 2880 120" preserveAspectRatio="none" aria-hidden="true">
      <path d={WAVE} fill={fill} />
    </svg>
  )
}

/** The moment the page drops from the warm tray into the cool cup: the drink rises to fill the screen. */
export default function Rim() {
  const root = useRef(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const trigger = { trigger: root.current, start: 'top 85%', end: 'center 45%', scrub: 0.6 }
        gsap.fromTo('.rim-liquid', { yPercent: 88 }, { yPercent: 0, ease: 'none', scrollTrigger: trigger })
        gsap.fromTo('.rim-ice-a', { y: -220, rotation: -24 }, { y: 80, rotation: 8, ease: 'none', scrollTrigger: { ...trigger, end: 'bottom top' } })
        gsap.fromTo('.rim-ice-b', { y: -320, rotation: 22 }, { y: 120, rotation: -10, ease: 'none', scrollTrigger: { ...trigger, end: 'bottom top' } })
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section id="rim" ref={root} className="rim" aria-labelledby="rim-title">
      <div className="rim-liquid">
        <LiquidWave fill="#1F65FF" className="slow" style={{ top: -66 }} />
        <LiquidWave fill="#163893" style={{ top: -44 }} />
        <div className="absolute inset-x-0 top-[74px] bottom-0 bg-cup" />
      </div>
      <img className="rim-ice rim-ice-a left-[7%] top-[22%] w-[clamp(110px,17vw,240px)]" src="/images/products/coke-garnish.webp" alt="" width="299" height="145" loading="lazy" />
      <img className="rim-ice rim-ice-b right-[9%] top-[46%] w-[clamp(90px,13vw,190px)]" src="/images/products/coke-garnish.webp" alt="" width="299" height="145" loading="lazy" />
      <div className="rim-copy">
        <Sticker
          id="rim-title"
          size="lg"
          outline="var(--color-navy)"
          words={[
            ['Now for', '#fff', -2],
            ['the Sip', 'var(--color-tray)', 1.5],
          ]}
        />
        <p className="mx-auto mt-6 max-w-[30ch] text-[clamp(1.05rem,1.7vw,1.35rem)] font-semibold text-white">From the top tray down to the bottom cup: the brand behind the snack.</p>
      </div>
    </section>
  )
}

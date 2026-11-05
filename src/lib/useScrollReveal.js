import { gsap, MOTION_OK, useGSAP } from './motion'

const FROM = {
  up: { y: 40, opacity: 0 },
  left: { x: -48, opacity: 0 },
  right: { x: 48, opacity: 0 },
  pop: { scale: 0.82, rotation: -3, opacity: 0 },
}

/** Animates every [data-reveal] element the first time it scrolls into view. */
export function useScrollReveal() {
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        const kind = el.dataset.reveal || 'up'
        gsap.from(el, {
          ...FROM[kind],
          duration: 0.8,
          delay: Number(el.dataset.revealDelay || 0),
          ease: kind === 'pop' ? 'back.out(1.7)' : 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        })
      })
    })
    return () => mm.revert()
  })
}

import { useEffect, useRef } from 'react'

const ORANGE = '#FD791B'
const BLUE = '#1F65FF'

/**
 * Scroll progress drawn as a drinking straw. Orange drink rises through the top
 * tray half of the page and turns blue once the reader passes the rim.
 */
export default function StrawProgress() {
  const fillRef = useRef(null)
  const barRef = useRef(null)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      const rim = document.getElementById('rim')
      const pastRim = rim ? rim.getBoundingClientRect().top < window.innerHeight * 0.5 : false
      const color = pastRim ? BLUE : ORANGE
      if (fillRef.current) {
        fillRef.current.setAttribute('height', String(progress * 420))
        fillRef.current.setAttribute('y', String(470 - progress * 420))
        fillRef.current.setAttribute('fill', color)
      }
      if (barRef.current) {
        barRef.current.style.setProperty('--p', String(progress))
        barRef.current.style.setProperty('--straw-fill', color)
      }
    }
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', request, { passive: true })
    window.addEventListener('resize', request)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', request)
      window.removeEventListener('resize', request)
    }
  }, [])

  return (
    <>
      <svg className="straw" viewBox="0 0 60 480" preserveAspectRatio="xMidYMid meet" aria-hidden="true" data-testid="straw">
        <defs>
          <clipPath id="straw-tube">
            <path d="M20 470 V52 Q20 44 13 39 L5 33 Q-1 28 4 22 L12 12 Q18 6 24 12 L38 24 Q44 30 44 40 V470 Q44 476 32 476 Q20 476 20 470 Z" />
          </clipPath>
          <pattern id="straw-stripe" width="24" height="34" patternUnits="userSpaceOnUse" patternTransform="skewY(-24)">
            <rect width="24" height="13" fill="#163893" opacity="0.14" />
          </pattern>
        </defs>
        <g clipPath="url(#straw-tube)">
          <rect x="-4" y="0" width="60" height="480" fill="#FFF9F2" />
          <rect ref={fillRef} x="-4" y="470" width="60" height="0" fill={ORANGE} />
          <rect x="-4" y="0" width="60" height="480" fill="url(#straw-stripe)" />
        </g>
        <path
          d="M20 470 V52 Q20 44 13 39 L5 33 Q-1 28 4 22 L12 12 Q18 6 24 12 L38 24 Q44 30 44 40 V470 Q44 476 32 476 Q20 476 20 470 Z"
          fill="none"
          stroke="#102A5B"
          strokeWidth="3.5"
        />
      </svg>
      <div ref={barRef} className="straw-mobile" aria-hidden="true">
        <span />
      </div>
    </>
  )
}

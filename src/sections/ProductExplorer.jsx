import { useLayoutEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '../lib/motion'
import { cupParts, products } from '../data/products'
import SplitCup from '../components/SplitCup'
import { OutputTag, Sticker, WaveEdge } from '../components/ui'

const TONES = { orange: '#FD791B', blue: '#163893' }

function PlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export default function ProductExplorer() {
  const [index, setIndex] = useState(0)
  const [base, setBase] = useState(TONES[products[0].tone])
  const [focus, setFocus] = useState(null)
  const stageRef = useRef(null)
  const wipeRef = useRef(null)
  const tabRefs = useRef([])
  const firstRender = useRef(true)

  const product = products[index]
  const color = TONES[product.tone]
  const titleColor = product.tone === 'blue' ? 'var(--color-tray)' : 'var(--color-cup)'

  // A new flavour pours in: colour rises from below, the tray lands on the new cup.
  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return undefined
    }
    if (prefersReducedMotion()) {
      setBase(color)
      return undefined
    }
    const stage = stageRef.current
    const q = gsap.utils.selector(stage)
    const timeline = gsap.timeline()
    timeline
      .set(wipeRef.current, { visibility: 'visible', backgroundColor: color, yPercent: 104 })
      .to(wipeRef.current, { yPercent: 0, duration: 0.6, ease: 'power2.inOut', onComplete: () => setBase(color) }, 0)
      .set(wipeRef.current, { visibility: 'hidden' })
      .fromTo(q('.cup-part-bottom img'), { y: 46, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out' }, 0.05)
      .fromTo(q('.cup-part-top img'), { yPercent: -22, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: 'bounce.out' }, 0.18)
      .fromTo(q('.stage-sign'), { scale: 0.5, rotation: -14, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.5, ease: 'back.out(2)' }, 0.32)
      .fromTo(q('.stage-garnish'), { scale: 0.5, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(2)' }, 0.4)
    return () => timeline.kill()
  }, [index, color])

  function select(next) {
    setIndex(next)
    setFocus(null)
  }

  function onTabKey(event) {
    const moves = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }
    let next = null
    if (event.key in moves) next = (index + moves[event.key] + products.length) % products.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = products.length - 1
    if (next === null) return
    event.preventDefault()
    select(next)
    tabRefs.current[next]?.focus()
  }

  const toggle = (part) => setFocus((current) => (current === part ? null : part))

  return (
    <section id="products" className="explorer section pb-[calc(var(--section-y)+40px)]" data-tone={product.tone} style={{ '--base': base }} aria-labelledby="products-title">
      <WaveEdge fill={base} shape="chop" className="!bottom-auto top-[calc(clamp(44px,8vw,120px)*-1+1px)] z-[2]" />
      <div className="explorer-clip" aria-hidden="true">
        <div ref={wipeRef} className="explorer-wipe" />
      </div>
      <div className="wrap explorer-grid">
        <div>
          <OutputTag code="PT#1" label="Sample Products" onDark={product.tone === 'blue'} />
          <Sticker
            id="products-title"
            size="md"
            words={[
              ['Sample', titleColor, -2],
              ['Products', titleColor, 1],
            ]}
          />
          <p className="mt-5 mb-6 max-w-[34ch] font-semibold">Grilled seafood on top. Refreshing drink below. One convenient cup.</p>
          <div className="flavour-list" role="tablist" aria-label="Choose a Krak" aria-orientation="vertical" onKeyDown={onTabKey}>
            {products.map((item, itemIndex) => (
              <button
                key={item.id}
                ref={(node) => {
                  tabRefs.current[itemIndex] = node
                }}
                type="button"
                role="tab"
                id={`tab-${item.id}`}
                className="flavour-tab"
                aria-selected={itemIndex === index}
                aria-controls="product-stage"
                tabIndex={itemIndex === index ? 0 : -1}
                onClick={() => select(itemIndex)}
              >
                <img src={item.image} alt="" width="40" height="56" loading="lazy" decoding="async" />
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <div id="product-stage" role="tabpanel" aria-labelledby={`tab-${product.id}`}>
          <div ref={stageRef} className="stage" data-focus={focus ?? undefined}>
            <SplitCup key={product.id} product={product} alt={`${product.name}: grilled seafood in the top tray above a chilled drink in the bottom cup`} />
            <img key={`${product.id}-sign`} className="stage-sign" src={`/images/products/${product.id}-sign.webp`} alt="" width="640" height="620" loading="lazy" decoding="async" />
            <img key={`${product.id}-garnish`} className="stage-garnish" src={`/images/products/${product.id}-garnish.webp`} alt="" loading="lazy" decoding="async" />
            <button type="button" className="hotspot" style={{ left: '86%', top: '17%' }} aria-pressed={focus === 'top'} aria-label="Highlight the top tray" onClick={() => toggle('top')}>
              <PlusIcon />
            </button>
            <button type="button" className="hotspot" style={{ left: '76%', top: '62%' }} aria-pressed={focus === 'bottom'} aria-label="Highlight the bottom cup" onClick={() => toggle('bottom')}>
              <PlusIcon />
            </button>
          </div>
        </div>

        <div>
          {['top', 'bottom'].map((part) => (
            <button key={part} type="button" className="part-note" aria-pressed={focus === part} onClick={() => toggle(part)}>
              <strong>{cupParts[part].title}</strong>
              <em>{cupParts[part].subtitle}</em>
              <p>{cupParts[part].body}</p>
            </button>
          ))}
        </div>
      </div>
      <WaveEdge fill="#FFF0D4" shape="swell" />
    </section>
  )
}

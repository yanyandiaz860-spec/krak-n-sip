import { applications, brandPost, poster } from '../data/content'
import { OutputTag, Palette, Sticker, WaveEdge, ZoomArt } from '../components/ui'

function FontList({ fonts }) {
  return (
    <ul className="font-list">
      {fonts.map(({ name, family, weight }) => (
        <li key={name} style={family ? { fontFamily: family, fontWeight: weight, fontSize: '1.45rem', letterSpacing: '0.02em' } : undefined}>
          {name}
        </li>
      ))}
    </ul>
  )
}

/** CT#2: original artwork, palette, typography and the original caption. */
export function BrandPost() {
  return (
    <section id="post" className="section zone-post pt-[calc(var(--section-y)+40px)] pb-[calc(var(--section-y)+50px)]" aria-labelledby="post-title">
      <WaveEdge fill="#163893" shape="lift" flip />
      <div className="wrap">
        <div className="mb-[clamp(28px,4vw,48px)]" data-reveal="up">
          <OutputTag code="CT#2" label="First Ever Brand Post" />
          <Sticker
            id="post-title"
            size="lg"
            words={[
              ['First Ever', 'var(--color-cup)', -1.5],
              ['Brand Post', 'var(--color-tray)', 1],
            ]}
          />
        </div>
        <div className="post-grid">
          <div className="post-art">
            <ZoomArt src={brandPost.image} full={brandPost.full} alt={brandPost.alt} width={838} height={838} label="First ever brand post" />
          </div>
          <div className="grid gap-5">
            <article className="caption-card">
              <h3 className="spec-title">Caption</h3>
              <p className="caption-text">{brandPost.caption}</p>
            </article>
            <div className="spec-card !mt-0">
              <h3 className="spec-title">Color Palette</h3>
              <Palette colors={brandPost.colors} lineColor="var(--color-navy)" />
            </div>
            <div className="spec-card !mt-0">
              <h3 className="spec-title">Typography</h3>
              <FontList fonts={brandPost.fonts} />
            </div>
          </div>
        </div>
      </div>
      <WaveEdge fill="#102A5B" shape="swell" />
    </section>
  )
}

/** CT#3: original poster, palette and typography. The brief says no explanation is needed. */
export function Poster() {
  return (
    <section id="poster" className="section zone-poster" aria-labelledby="poster-title">
      <svg className="absolute inset-0 size-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d="M0 0H300C340 120 240 220 120 240S0 300 0 330Z" fill="#FD791B" />
        <path d="M1440 900H1080C1010 800 1120 700 1240 690S1440 600 1440 560Z" fill="#FD791B" />
        <path d="M1200 0H1440V170C1350 190 1240 120 1200 0Z" fill="#145BDC" />
      </svg>
      <div className="wrap poster-grid">
        <div>
          <div data-reveal="left">
            <OutputTag code="CT#3" label="Promotional Event Poster" onDark />
            <Sticker
              id="poster-title"
              size="md"
              outline="var(--color-cream)"
              words={[
                ['Promotional', 'var(--color-cup)', -1],
                ['Event Poster', 'var(--color-tray)', 1],
              ]}
            />
          </div>
          <div className="mt-[clamp(24px,3vw,36px)]">
            <div className="spec-card">
              <h3 className="spec-title">Color Palette</h3>
              <Palette colors={poster.colors} lineColor="var(--color-navy)" />
            </div>
            <div className="spec-card">
              <h3 className="spec-title">Typography</h3>
              <FontList fonts={poster.fonts} />
            </div>
          </div>
        </div>
        <div className="poster-art" data-reveal="pop">
          <ZoomArt src={poster.image} full={poster.full} alt={poster.alt} width={864} height={1080} label="Promotional event poster" />
        </div>
      </div>
    </section>
  )
}

const ORANGE = '#FD791B'
const NAVY = '#102A5B'
const TILES_WIDE = [ORANGE, NAVY, ORANGE, NAVY, NAVY, ORANGE, NAVY, ORANGE]
const TILES_NARROW = [ORANGE, NAVY, NAVY, ORANGE, ORANGE, NAVY, NAVY, ORANGE]

/** The deck's own checkerboard of mockups, with a separate pattern for the two-column phone layout. */
export function Applications() {
  return (
    <section id="applications" className="bg-sand" aria-labelledby="apps-title">
      <div className="wrap py-[clamp(52px,7vw,88px)] text-center">
        <Sticker
          id="apps-title"
          size="lg"
          words={[
            ['Brand', 'var(--color-cup)', -2],
            ['Applications', 'var(--color-tray)', 1],
          ]}
        />
      </div>
      <div className="checker">
        {applications.map(({ id, label, image, alt }, index) => (
          <div key={id} className="checker-tile" style={{ '--tile-wide': TILES_WIDE[index], '--tile-narrow': TILES_NARROW[index] }}>
            <ZoomArt src={image} alt={alt} width={1100} height={1100} label={label} />
            <span className="checker-label">{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

import { useEffect, useId, useRef, useState } from 'react'

/** Heading in the deck's outlined sticker style. `words` is [text, colour, tilt]. */
export function Sticker({ as: Tag = 'h2', size = 'md', words, outline, className = '', ...rest }) {
  return (
    <Tag className={`sticker sticker-${size} ${className}`} style={outline ? { '--outline': outline } : undefined} {...rest}>
      {words.map(([text, color, tilt = 0], index) => (
        <span key={text + index}>
          <span
            className="sticker-word"
            style={{ color, transform: tilt ? `rotate(${tilt}deg)` : undefined }}
            data-word
          >
            {text}
          </span>
          {index < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  )
}

/** Marks which academic output a section belongs to, so it is easy to find when grading. */
export function OutputTag({ code, label, onDark = false }) {
  return (
    <p className={`output-tag ${onDark ? 'on-dark' : ''}`}>
      <b>{code}</b>
      {label}
    </p>
  )
}

/** Soft wave used to join two sections. Sits at the top of the section it belongs to. */
const WAVES = {
  swell: 'M0 64 C 240 8 480 8 720 52 S 1200 104 1440 44 V 120 H 0 Z',
  chop: 'M0 80 C 160 24 300 104 480 66 S 780 18 960 64 S 1280 104 1440 46 V 120 H 0 Z',
  lift: 'M0 30 C 320 120 760 116 1040 70 S 1340 22 1440 40 V 120 H 0 Z',
}
export function WaveEdge({ fill, shape = 'swell', flip = false, className = '' }) {
  return (
    <svg
      className={`pointer-events-none absolute left-0 block h-[clamp(44px,8vw,120px)] w-full ${flip ? 'top-[-1px] rotate-180' : 'bottom-[-1px]'} ${className}`}
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={WAVES[shape]} fill={fill} />
    </svg>
  )
}

/** Colour drops. Selecting one copies its hex code. */
export function Palette({ colors, lineColor }) {
  const [copied, setCopied] = useState('')
  const timer = useRef(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy(hex) {
    try {
      await navigator.clipboard.writeText(hex)
      setCopied(`Copied ${hex}`)
    } catch {
      setCopied(`${hex} (copy not available here)`)
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(''), 1800)
  }

  return (
    <div>
      <ul className="palette" style={lineColor ? { '--drop-line': lineColor } : undefined}>
        {colors.map(({ name, hex }) => (
          <li key={name + hex}>
            <button type="button" className="drop-btn" onClick={() => copy(hex)} aria-label={`${name}, ${hex}. Copy colour code`}>
              <span className="drop" style={{ '--drop': hex }} aria-hidden="true" />
              <span className="drop-name">{name}</span>
              <span className="drop-hex">{hex}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="copy-note" role="status">
        {copied}
      </p>
    </div>
  )
}

/** Artwork that opens full size in a dialog. */
export function ZoomArt({ src, full, alt, width, height, className = '', loading = 'lazy', label }) {
  const dialogRef = useRef(null)
  const [open, setOpen] = useState(false)
  const titleId = useId()

  useEffect(() => {
    if (open) dialogRef.current?.showModal()
  }, [open])

  return (
    <>
      <button type="button" className={`art-btn ${className}`} onClick={() => setOpen(true)} aria-label={`View full size: ${label ?? alt}`}>
        <img src={src} alt={alt} width={width} height={height} loading={loading} decoding="async" />
      </button>
      {open && (
        <dialog
          ref={dialogRef}
          className="lightbox"
          aria-labelledby={titleId}
          onClose={() => setOpen(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget || event.target.classList.contains('lightbox-inner')) {
              dialogRef.current?.close()
            }
          }}
        >
          <span id={titleId} className="sr-only">
            {label ?? alt}
          </span>
          <div className="lightbox-inner">
            <img src={full ?? src} alt={alt} />
          </div>
          <button type="button" className="btn lightbox-close" onClick={() => dialogRef.current?.close()}>
            Close
          </button>
        </dialog>
      )}
    </>
  )
}

/** Labelled image slot. Shows the placeholder until a real file is supplied. */
export function ArtSlot({ title, src, alt, note, className = '', style }) {
  if (src) {
    return (
      <div className={`frame grid place-items-center p-4 ${className}`} style={style}>
        <img src={src} alt={alt} loading="lazy" decoding="async" className="size-full object-contain" />
      </div>
    )
  }
  return (
    <div className={`frame frame-empty ${className}`} style={style} data-placeholder={title}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <circle cx="8.5" cy="9.5" r="1.6" />
        <path d="m4 18 5-5 3.5 3.5L16 13l4 4.5" />
      </svg>
      <strong>{title}</strong>
      <span>{note}</span>
    </div>
  )
}

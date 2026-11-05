import { useEffect, useRef, useState } from 'react'
import { navLinks } from '../data/content'

export default function Nav() {
  const [active, setActive] = useState('')
  const [open, setOpen] = useState(false)
  const toggleRef = useRef(null)

  // Highlight the link for the section crossing the middle of the screen.
  useEffect(() => {
    const sections = ['home', ...navLinks.map(({ id }) => id)].map((id) => document.getElementById(id)).filter(Boolean)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header>
      <nav className="site-nav" aria-label="Main">
        <div className="nav-pill w-full justify-between lg:w-auto lg:justify-start">
          <a href="#home" className="block shrink-0 rounded-full" aria-label="Krak N Sip, back to top" onClick={() => setOpen(false)}>
            <img src="/images/brand/secondary-logo-small.webp" alt="" width="44" height="44" className="block size-11" />
          </a>
          <ul className="m-0 hidden list-none items-center gap-0.5 p-0 lg:flex">
            {navLinks.map(({ id, label }) => (
              <li key={id}>
                <a className="nav-link" href={`#${id}`} aria-current={active === id ? 'true' : undefined}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <button
            ref={toggleRef}
            type="button"
            className="btn min-h-11 px-5 py-1 text-[0.9rem] shadow-none lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </nav>
      {open && (
        <div id="mobile-menu" className="mobile-menu lg:hidden">
          {navLinks.map(({ id, label }) => (
            <a key={id} href={`#${id}`} aria-current={active === id ? 'true' : undefined} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}

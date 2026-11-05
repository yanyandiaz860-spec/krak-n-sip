import { brand, navLinks } from '../data/content'
import { teamMembers } from '../data/team'

export default function Footer() {
  return (
    <footer className="site-footer pt-[calc(var(--section-y)+24px)] pb-10">
      <div className="wrap grid gap-10 md:grid-cols-[auto_1fr] md:items-center">
        <img src="/images/brand/secondary-logo.webp" alt="Krak N Sip logo" width="1000" height="1000" loading="lazy" decoding="async" className="w-[clamp(140px,18vw,220px)]" />
        <div>
          <p className="m-0 font-display text-[clamp(1.75rem,4.4vw,3.5rem)] font-black leading-[1.05]">{brand.tagline}</p>
          <nav aria-label="Footer" className="mt-6">
            <ul className="footer-links">
              <li>
                <a href="#home">Home</a>
              </li>
              {navLinks.map(({ id, label }) => (
                <li key={id}>
                  <a href={`#${id}`}>{label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      <div className="wrap mt-10 flex flex-wrap justify-between gap-x-8 gap-y-2 border-t-2 border-white/20 pt-6 text-[0.9rem]">
        <p className="m-0">{teamMembers.map(({ name }) => name).join('  ·  ')}</p>
        <p className="m-0">ITWS06 Brand Portfolio</p>
      </div>
    </footer>
  )
}

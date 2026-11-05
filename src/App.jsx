import { useEffect } from 'react'
import { ScrollTrigger } from './lib/motion'
import { useScrollReveal } from './lib/useScrollReveal'
import Nav from './components/Nav'
import StrawProgress from './components/StrawProgress'
import Hero from './sections/Hero'
import { BrandStory, MeetBrand, MissionVision, Team, UniqueAppeal } from './sections/TopTray'
import ProductExplorer from './sections/ProductExplorer'
import Rim from './sections/Rim'
import { LogoBreakdown, LogoProcess, LogoSystem } from './sections/LogoDesign'
import { Applications, BrandPost, Poster } from './sections/Artwork'
import KrakNSpin from './sections/KrakNSpin'
import Footer from './sections/Footer'

export default function App() {
  useScrollReveal()

  // Fonts and images change section heights, so re-measure the scroll scenes once they are in.
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    document.fonts?.ready.then(refresh)
    return () => window.removeEventListener('load', refresh)
  }, [])

  return (
    <>
      <a className="skip-link" href="#brand">
        Skip to content
      </a>
      <Nav />
      <StrawProgress />
      <main>
        <Hero />
        <MeetBrand />
        <BrandStory />
        <MissionVision />
        <Team />
        <UniqueAppeal />
        <ProductExplorer />
        <Rim />
        <LogoProcess />
        <LogoBreakdown />
        <LogoSystem />
        <BrandPost />
        <Poster />
        <KrakNSpin />
        <Applications />
      </main>
      <Footer />
    </>
  )
}

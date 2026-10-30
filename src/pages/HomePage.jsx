import { useState } from 'react'
import FiguresSection from '../components/FiguresSection'
import Hero from '../components/Hero'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import TrainersSection from '../components/TrainersSection'

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div id="top">
      <SiteHeader menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <Hero />
      <hr className="hv-divider" />
      <FiguresSection />
      <hr className="hv-divider" />
      <TrainersSection />
      <SiteFooter />
    </div>
  )
}

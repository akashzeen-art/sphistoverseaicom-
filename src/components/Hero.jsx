import { Link } from 'react-router-dom'

const STATS = [
  { value: '14', label: 'Historical Figures' },
  { value: 'AI', label: 'Powered Voice' },
  { value: '5', label: 'Categories' },
]

export default function Hero() {
  const scrollToFigures = (e) => {
    e.preventDefault()
    document.getElementById('slider')?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <div className="hv-hero">
      <div className="hv-hero__bg" />
      <div className="hv-hero__orb hv-hero__orb--1" />
      <div className="hv-hero__orb hv-hero__orb--2" />
      <div className="hv-hero__content container-xxl">
        <div className="hv-hero__eyebrow hv-rise">
          <span className="hv-hero__eyebrow-dot" />HistoVerse AI
        </div>
        <h1 className="hv-hero__title hv-rise hv-rise-delay-1">
          Speak with the<br /><span>Legends of History</span>
        </h1>
        <p className="hv-hero__sub hv-rise hv-rise-delay-2">
          Have real conversations with Shakespeare, Lincoln, Einstein and more —
          powered by AI, brought to life with voice.
        </p>
        <div className="hv-hero__actions hv-rise hv-rise-delay-3">
          <a href="#slider" className="hv-btn-primary" onClick={scrollToFigures}>
            Explore Figures
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{marginLeft:'8px',verticalAlign:'middle'}}>
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <Link to="/brain-trainers" className="hv-btn-ghost">Brain Trainers</Link>
        </div>
        <div className="hv-hero__stats hv-rise hv-rise-delay-4">
          {STATS.map((s, i) => (
            <div key={i} className="hv-hero__stat">
              <span className="hv-hero__stat-value">{s.value}</span>
              <span className="hv-hero__stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

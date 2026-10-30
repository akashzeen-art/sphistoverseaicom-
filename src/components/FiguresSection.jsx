import { useState } from 'react'
import { Link } from 'react-router-dom'
import { figures, talkUrl } from '../data/site'

const ALL = 'All'

export default function FiguresSection() {
  const categories = [ALL, ...Array.from(new Set(figures.map((f) => f.category)))]
  const [active, setActive] = useState(ALL)
  const filtered = active === ALL ? figures : figures.filter((f) => f.category === active)

  return (
    <div className="container-fluid hv-figures-section" id="slider">
      <div className="container-xxl py-4 py-lg-5">
        <div className="hv-section-label hv-rise">— Figuras Históricas —</div>
        <h2 className="hv-section-title hv-rise hv-rise-delay-1">
          ¿Con quién quieres <span>hablar?</span>
        </h2>

        <div className="hv-filter-tabs hv-rise hv-rise-delay-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`hv-filter-tab${active === cat ? ' hv-filter-tab--active' : ''}`}
              onClick={() => setActive(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="hv-figures-grid hv-rise hv-rise-delay-3">
          {filtered.map((figure, i) => (
            <Link key={figure.id} to={talkUrl(figure.id)} className="hv-figure-card">
              <div className="hv-figure-card__num">0{i + 1}</div>
              <div className="hv-figure-card__era">{figure.category}</div>
              <div className="hv-figure-card__name">{figure.name}</div>
              <div className="hv-figure-card__job">{figure.job}</div>
              <div className="hv-figure-card__cta">Hablar →</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

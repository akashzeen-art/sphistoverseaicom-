import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import {
  BRAIN_TRAINERS_TOTAL_PAGES,
  getBrainTrainersPage,
} from '../data/brainTrainers'
import { talkUrl } from '../data/site'

export default function BrainTrainersPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchParams] = useSearchParams()
  const page = Number(searchParams.get('page') || 1)
  const { page: currentPage, category, items } = getBrainTrainersPage(page)

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Entrenadores Mentales | HistoVerse AI'
    return () => {
      document.title = 'HistoVerse AI'
    }
  }, [currentPage])

  return (
    <div className="brain-trainers-page">
      <SiteHeader menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <div className="container-fluid relative more-page">
        <div className="container-xxl py-3 py-lg-5 index3 relative">
          <div className="row g-0 py-3">
            <div className="col-12 mt-5 mb-0 my-md-0 hv-rise">
              <Link className="back_arrow" to="/#brain-trainers">
                Volver
              </Link>
            </div>
            <div className="col-12 mt-3 hv-rise hv-rise-delay-1">
              <div className="section-header-dark">
                Entrenadores<span>Mentales</span>
              </div>
              {category ? (
                <p
                  className="mb-0 mt-2"
                  style={{ color: 'var(--ht-muted)', fontSize: '1.1rem' }}
                >
                  {category}
                </p>
              ) : null}
            </div>
          </div>

          <div className="row g-4 py-3 py-lg-5">
            {items.length === 0 ? (
              <div className="col-12 text-center py-5">
                <p className="mb-0" style={{ color: 'var(--ht-muted)' }}>
                  Más entrenadores próximamente en esta página.
                </p>
              </div>
            ) : (
              items.map((trainer, index) => (
                <div
                  className="col-12 col-sm-6 col-md-4 col-xl-3 hv-rise"
                  key={trainer.id}
                  style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
                >
                  <Link to={talkUrl(trainer.id)} className="hv-trainer-card hv-trainer-card--page">
                    <div className="hv-trainer-card__category">{trainer.category}</div>
                    <div className="hv-trainer-card__name">{trainer.name}</div>
                    <div className="hv-trainer-card__cta">Hablar →</div>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="container-xxl pb-5">
          <div className="row py-4 pb-5">
            <div className="col-12 text-center">
              <div className="block-27">
                <div
                  role="navigation"
                  aria-label="Paginación"
                  className="pagination"
                >
                  {currentPage <= 1 ? (
                    <span className="previous_page disabled" aria-label="Página anterior">
                      ← Anterior
                    </span>
                  ) : (
                    <Link
                      className="previous_page"
                      aria-label="Página anterior"
                      to={`/brain-trainers?page=${currentPage - 1}`}
                      rel="prev"
                    >
                      ← Anterior
                    </Link>
                  )}

                  {Array.from({ length: BRAIN_TRAINERS_TOTAL_PAGES }, (_, i) => {
                    const n = i + 1
                    if (n === currentPage) {
                      return (
                        <em
                          key={n}
                          className="current"
                          aria-label={`Página ${n}`}
                          aria-current="page"
                        >
                          {n}
                        </em>
                      )
                    }
                    return (
                      <Link
                        key={n}
                        aria-label={`Página ${n}`}
                        to={`/brain-trainers?page=${n}`}
                        rel={n === currentPage + 1 ? 'next' : undefined}
                      >
                        {n}
                      </Link>
                    )
                  })}

                  {currentPage >= BRAIN_TRAINERS_TOTAL_PAGES ? (
                    <span className="next_page disabled" aria-label="Página siguiente">
                      Siguiente →
                    </span>
                  ) : (
                    <Link
                      className="next_page"
                      aria-label="Página siguiente"
                      to={`/brain-trainers?page=${currentPage + 1}`}
                      rel="next"
                    >
                      Siguiente →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}

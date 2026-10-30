import { Link } from 'react-router-dom'
import { talkUrl, trainers } from '../data/site'

const ICONS = ['🧠', '📜', '⚔️', '🎭', '🔬', '🎨', '🏛️', '📚']

export default function TrainersSection() {
  return (
    <div className="container-fluid hv-trainers-section" id="brain-trainers">
      <div className="container-xxl py-4 py-lg-5">
        <div className="hv-section-label hv-rise">— Entrenadores Mentales —</div>
        <h2 className="hv-section-title hv-rise hv-rise-delay-1">
          Entrena tu mente con <span>la historia</span>
        </h2>

        <div className="hv-trainers-grid hv-rise hv-rise-delay-2">
          {trainers.map((trainer, i) => (
            <Link key={trainer.id} to={talkUrl(trainer.id)} className="hv-trainer-card">
              <div className="hv-trainer-card__icon">{ICONS[i % ICONS.length]}</div>
              <div className="hv-trainer-card__category">{trainer.title}</div>
              <div className="hv-trainer-card__name">{trainer.name}</div>
              <div className="hv-trainer-card__cta">Empezar →</div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-5 hv-rise hv-rise-delay-3">
          <Link className="hv-btn-outline" to="/brain-trainers">Ver todos los entrenadores</Link>
        </div>
      </div>
    </div>
  )
}

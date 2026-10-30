import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import TalkPanel from '../components/TalkPanel'
import { getTalkProfile } from '../data/talkProfiles'

export default function TalkPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const profile = getTalkProfile(id)

  useEffect(() => {
    if (!profile) return undefined
    window.scrollTo(0, 0)
    document.title = `${profile.name} | HistoVerse AI`
    return () => {
      document.title = 'HistoVerse AI'
    }
  }, [profile])

  if (!profile) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="talk-page">
      <SiteHeader menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <div className="container-fluid relative second info-page">
        <div className="container-xxl py-3 py-lg-5 index3 relative">
          <div className="row g-0 py-3">
            <div className="col-12">
              <button
                type="button"
                className="back_arrow mb-3 d-inline-block border-0 hv-rise"
                onClick={() => navigate(-1)}
              >
                ← Back
              </button>
              <span className="function-head hv-rise hv-rise-delay-1">{profile.job}</span>
              <div className="name_and_surname hv-rise hv-rise-delay-2">{profile.name}</div>
              <div className="row">
                <div className="col-12 text-center hv-rise hv-rise-delay-3">
                  <TalkPanel key={id} profile={profile} figureId={id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter hidden />
    </div>
  )
}

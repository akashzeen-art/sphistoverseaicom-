import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { menuLinks } from '../data/site'

export default function SiteHeader({ menuOpen, setMenuOpen }) {
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="container-fluid landing-page index4 px-0">
      <div className="menu-top">
        <nav className="top_logo index4 pt-2 mb-5">
          <div className="container-xxl">
            <div className="row">
              <div className="d-flex relative col-12">
                <Link className="navbar-brand-two mx-auto d-inline-block" to="/">
                  <img className="logo" src="/images/logo_w.png" alt="HistoVerse AI" />
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div
          className={`collapse ${menuOpen ? 'show' : ''}`}
          id="navbarToggleExternalContent"
        >
          <div className="bg-dark">
            <nav className="top_logo index4 pt-2 mb-5">
              <div className="container">
                <div className="d-flex">
                  <Link
                    className="navbar-brand-two mx-auto d-inline-block"
                    to="/"
                    onClick={closeMenu}
                  >
                    <img className="logo" src="/images/logo_w.png" alt="HistoVerse AI" />
                  </Link>
                </div>
              </div>
            </nav>
            {menuLinks.map((item) =>
              item.href.startsWith('/') ? (
                <Link
                  key={item.label}
                  to={item.href}
                  className="menu_button"
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="menu_button"
                  onClick={closeMenu}
                >
                  {item.label}
                </a>
              ),
            )}
            <div className="clouds index0" />
          </div>
        </div>

        <nav className="navbar navbar-dark bg-dark">
          <div className="container-fluid">
            <button
              className="navbar-toggler custom-toggler"
              type="button"
              aria-controls="navbarToggleExternalContent"
              aria-expanded={menuOpen}
              aria-label="Toggle navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="navbar-toggler-icon" />
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}

export default function SiteFooter({ hidden = false }) {
  return (
    <div
      className={`footer mt-auto py-3 text-center fixed-bottom index4${
        hidden ? ' d-none talk-footer-hidden' : ''
      }`}
    >
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="c-legal" />
          </div>
          <div className="col-md-12">
            <p className="mb-0">
              Copyright © 2026 Todos los derechos reservados{' '}
              <a href="https://content.histoverseai.com/history/" target="_blank" rel="noreferrer">
                HistoVerse AI
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

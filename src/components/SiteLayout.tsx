import { useEffect, useState, type ReactNode } from 'react'
import { Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { siteSettings } from '../data/siteContent'
import '../styles/chrome.css'

const primaryLinks = [
  { label: 'Sponsors', to: '/partners' },
  { label: 'Members', to: '/about' },
  { label: 'Recruitment', to: '/membership' },
]

const MOBILE_MENU_ID = 'tac-mobile-menu'

function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)
  const location = useLocation()

  // Close the mobile panel whenever the route changes — including on
  // browser back/forward. Adjusting state during render (rather than in an
  // effect) avoids a cascading second render.
  const [menuPath, setMenuPath] = useState(location.pathname)
  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname)
    setOpen(false)
  }

  const closeMenu = () => setOpen(false)

  return (
    <header className="tac-header">
      <div className="tac-header__inner tac-container">
        <Link className="tac-header__brand" to="/" aria-label="Traders at Carolina home">
          {logoFailed ? (
            <span className="tac-header__logo-fallback" aria-hidden="true">
              TC
            </span>
          ) : (
            <img
              className="tac-header__logo"
              src="/images/logo/logo-mark.svg"
              alt=""
              width={36}
              height={36}
              onError={() => setLogoFailed(true)}
            />
          )}
          <span className="tac-header__wordmark">Traders at Carolina</span>
        </Link>

        <nav className="tac-header__nav" aria-label="Primary navigation">
          <ul className="tac-header__links">
            {primaryLinks.map((item) => (
              <li key={item.to}>
                <Link className="tac-header__link" to={item.to}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link className="tac-btn tac-header__join" to="/join">
            JOIN
          </Link>
        </nav>

        <button
          className="tac-header__toggle"
          type="button"
          aria-expanded={open}
          aria-controls={MOBILE_MENU_ID}
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </div>

      <nav
        id={MOBILE_MENU_ID}
        className={open ? 'tac-header__panel tac-container is-open' : 'tac-header__panel tac-container'}
        aria-label="Mobile navigation"
      >
        <ul className="tac-header__panel-list">
          {primaryLinks.map((item) => (
            <li key={item.to}>
              <Link className="tac-header__link" to={item.to} onClick={closeMenu}>
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link className="tac-btn tac-header__join" to="/join" onClick={closeMenu}>
              JOIN
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}

function SiteFooter() {
  /* TODO: real URLs — these fall back to "#" until confirmed links exist. */
  const footerLinks = [
    { label: 'Instagram', href: siteSettings.instagramUrl || '#' },
    { label: 'LinkedIn', href: siteSettings.linkedinUrl || '#' },
    { label: 'Mailing list', href: '#' },
  ]

  return (
    <footer className="tac-footer">
      <div className="tac-footer__inner tac-container">
        <span className="tac-footer__brand">Traders at Carolina</span>
        <div className="tac-footer__links">
          {footerLinks.map((item) =>
            item.href === '#' ? (
              <a key={item.label} className="tac-footer__link" href="#">
                {item.label}
              </a>
            ) : (
              <a
                key={item.label}
                className="tac-footer__link"
                href={item.href}
                target="_blank"
                rel="noreferrer"
              >
                {item.label}
              </a>
            ),
          )}
        </div>
        <span className="tac-footer__meta">© 2026, Chapel Hill</span>
      </div>
    </footer>
  )
}

function RouteEffects() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  return null
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <RouteEffects />
      <SiteHeader />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </div>
  )
}

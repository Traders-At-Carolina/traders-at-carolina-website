import { useEffect, useState, type ReactNode } from 'react'
import { ArrowUpRight, LogIn, Menu, X } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { navigation, siteSettings } from '../data/siteContent'

function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Traders at Carolina home">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="brand-name">
        Traders <span>at Carolina</span>
      </span>
    </Link>
  )
}

function SiteHeader() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('menu-open', open)
    return () => document.body.classList.remove('menu-open')
  }, [open])

  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <div className="header-mobile-actions">
          <Link className="mobile-join" to="/join" onClick={() => setOpen(false)}>Join</Link>
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="primary-navigation"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
        <nav
          id="primary-navigation"
          className={`primary-navigation ${open ? 'is-open' : ''}`}
          aria-label="Primary navigation"
        >
          <div className="nav-links">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="nav-actions">
            <Link className="login-link" to="/login" onClick={() => setOpen(false)}>
              <LogIn size={17} aria-hidden="true" />
              Member Login
            </Link>
            <Link className="button button-small" to="/join" onClick={() => setOpen(false)}>
              Join
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}

function SiteFooter() {
  const socials = [
    { label: 'LinkedIn', url: siteSettings.linkedinUrl },
    { label: 'Instagram', url: siteSettings.instagramUrl },
    { label: 'Discord', url: siteSettings.discordUrl },
  ].filter((item): item is { label: string; url: string } => Boolean(item.url))

  return (
    <footer className="site-footer">
      <div className="footer-main container">
        <div className="footer-statement">
          <Brand />
          <p>A student community exploring quantitative finance at UNC-Chapel Hill.</p>
        </div>
        <div className="footer-column">
          <h2>Explore</h2>
          {navigation.slice(1).map((item) => (
            <Link key={item.to} to={item.to}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="footer-column">
          <h2>Get involved</h2>
          <Link to="/join">Join the club</Link>
          <Link to="/partners">Partner with us</Link>
          <Link to="/login">Member login</Link>
        </div>
        <div className="footer-column">
          <h2>Follow</h2>
          {socials.length ? (
            socials.map((item) => (
              <a key={item.label} href={item.url} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            ))
          ) : (
            <p className="footer-pending">Verified social links will be published here.</p>
          )}
        </div>
      </div>
      <div className="footer-bottom container">
        <span>© {new Date().getFullYear()} Traders at Carolina</span>
        <span>Student-led at UNC-Chapel Hill</span>
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

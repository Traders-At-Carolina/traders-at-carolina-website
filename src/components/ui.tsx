import type { ReactNode } from 'react'
import { ArrowRight, CalendarDays, FileQuestion, Mail, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

export function PageMeta({ title, description }: { title: string; description: string }) {
  document.title = `${title} | Traders at Carolina`
  const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (meta) meta.content = description
  return null
}

export function SectionHeading({
  title,
  description,
  align = 'left',
}: {
  title: string
  description?: string
  align?: 'left' | 'center'
}) {
  return (
    <div className={`section-heading section-heading-${align}`}>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  )
}

export function PageHero({
  title,
  description,
  children,
  variant = 'light',
}: {
  title: string
  description: string
  children?: ReactNode
  variant?: 'light' | 'blue' | 'dark'
}) {
  return (
    <section className={`page-hero page-hero-${variant}`}>
      <div className="container page-hero-inner">
        <h1>{title}</h1>
        <p>{description}</p>
        {children ? <div className="page-hero-actions">{children}</div> : null}
      </div>
    </section>
  )
}

export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className="text-link" to={to}>
      {children}
      <ArrowRight size={18} aria-hidden="true" />
    </Link>
  )
}

export function ContentUnavailable({
  title,
  description,
  action,
  icon = 'question',
}: {
  title: string
  description: string
  action?: ReactNode
  icon?: 'question' | 'calendar' | 'mail' | 'location'
}) {
  const icons = {
    question: FileQuestion,
    calendar: CalendarDays,
    mail: Mail,
    location: MapPin,
  }
  const Icon = icons[icon]

  return (
    <div className="empty-state">
      <Icon aria-hidden="true" />
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  )
}

export function CtaBand({
  title,
  description,
  primaryLabel,
  primaryTo,
  secondaryLabel,
  secondaryTo,
}: {
  title: string
  description: string
  primaryLabel: string
  primaryTo: string
  secondaryLabel?: string
  secondaryTo?: string
}) {
  return (
    <section className="cta-band">
      <div className="container cta-band-inner">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="button-row">
          <Link className="button button-light" to={primaryTo}>
            {primaryLabel}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          {secondaryLabel && secondaryTo ? (
            <Link className="button button-ghost-light" to={secondaryTo}>
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function DisclosureList({
  items,
}: {
  items: Array<{ question: string; answer: string }>
}) {
  return (
    <div className="disclosure-list">
      {items.map((item) => (
        <details key={item.question}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  )
}

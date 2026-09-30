import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

/** Stroke-style (1.6px) icons. Colour comes from `currentColor`. */
function baseProps(size: number): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    focusable: false,
  }
}

export function LinkedInIcon({ size = 20, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 10.5V16.5" />
      <path d="M8 7.5V7.51" />
      <path d="M11.5 16.5V10.5" />
      <path d="M11.5 13.25c0-1.6 1-2.75 2.5-2.75s2.25 1 2.25 2.5v3.5" />
    </svg>
  )
}

export function MailIcon({ size = 20, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
      <path d="M3.5 7l8.5 6 8.5-6" />
    </svg>
  )
}

/** LinkedIn profile link: 44x44 target, opens in a new tab. */
export function LinkedInLink({ href, name, size }: { href: string; name: string; size?: number }) {
  return (
    <a
      className="tac-icon-link"
      href={href}
      target="_blank"
      rel="noopener"
      aria-label={`LinkedIn profile for ${name}`}
    >
      <LinkedInIcon size={size} />
    </a>
  )
}

/** mailto link: 44x44 target. */
export function EmailLink({ email, name, size }: { email: string; name: string; size?: number }) {
  return (
    <a className="tac-icon-link" href={`mailto:${email}`} aria-label={`Email ${name}`}>
      <MailIcon size={size} />
    </a>
  )
}

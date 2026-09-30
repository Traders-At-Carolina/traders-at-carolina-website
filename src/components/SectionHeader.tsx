import type { ReactNode } from 'react'
import { Reveal } from './Reveal'

type SectionHeaderProps = {
  /** Marker number, e.g. "01". */
  number: string
  /** Marker label shown under the number, e.g. "About". */
  label: string
  heading: string
  subtext: ReactNode
  /** h1 on standalone pages, h2 inside a longer page. */
  headingLevel?: 'h1' | 'h2'
  /** Extra content under the subtext, in the right column (e.g. stats). */
  children?: ReactNode
}

/**
 * The shared section header: a 260px marker column (number + italic label,
 * no rule line), an 80px gap, then the heading and one line of subtext.
 * Styles live in src/styles/tokens.css (.tac-sh).
 */
export function SectionHeader({
  number,
  label,
  heading,
  subtext,
  headingLevel = 'h2',
  children,
}: SectionHeaderProps) {
  const Heading = headingLevel

  return (
    <div className="tac-sh">
      <Reveal className="tac-sh__marker">
        <span className="tac-sh__num">{number}</span>
        <span className="tac-sh__label">{label}</span>
      </Reveal>

      <Reveal delay={80}>
        <Heading className="tac-h-lg tac-sh__heading">{heading}</Heading>
        <p className="tac-body tac-sh__subtext">{subtext}</p>
        {children}
      </Reveal>
    </div>
  )
}

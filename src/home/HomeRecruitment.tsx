import { Reveal } from '../components/Reveal'
import { recruitmentSteps } from '../data/recruitmentSteps'
import '../styles/recruitment.css'

/**
 * Section 6 — Recruitment.
 *
 * Centred, warm-gray field. The heading leads: no eyebrow, no section
 * number, no italic section name above it. The five steps are an ordered
 * list rendered as an equal-width row, with no connecting line between them —
 * the numbered navy squares carry the sequence on their own.

 */
export function HomeRecruitment() {
  return (
    <section id="recruitment" className="tac-section tac-section--warm tac-recruit">
      <div className="tac-container">
        <Reveal as="header">
          <h2 className="tac-h-lg tac-recruit__heading">How recruitment works</h2>
          <p className="tac-body tac-recruit__lede">
            Recruitment for Fall 2026 is over.
          </p>
        </Reveal>

        <ol className="tac-recruit__steps">
          {recruitmentSteps.map((step, index) => (
            <Reveal
              as="li"
              key={step.number}
              className="tac-recruit__step"
              delay={index * 60}
            >
              <span className="tac-recruit__num" aria-hidden="true">
                {step.number}
              </span>
              <span className="tac-recruit__title">{step.title}</span>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}

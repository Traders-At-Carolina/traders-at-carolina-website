import { useEffect, useState } from 'react'
import type { CSSProperties, ElementType, ReactElement, ReactNode } from 'react'

/**
 * Tags Reveal is allowed to render as. Kept narrow on purpose so callers
 * can't smuggle in something that breaks the surrounding layout.
 */
type RevealTag = 'div' | 'section' | 'header' | 'li' | 'article' | 'p' | 'span'

type RevealProps = {
  children: ReactNode
  className?: string
  /** ms of extra delay before this element animates */
  delay?: number
  /** element tag to render, default 'div' */
  as?: RevealTag
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function hasIntersectionObserver(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.IntersectionObserver !== 'undefined'
  )
}

/**
 * Scroll-triggered fade-and-rise wrapper.
 *
 * Fires once per element: as soon as it crosses into view the `is-visible`
 * class is added and the element is unobserved, so it never re-animates.
 * When the visitor prefers reduced motion — or IntersectionObserver is
 * missing — the content renders immediately visible with no transition.
 *
 * The animation itself lives in `src/styles/tokens.css`
 * (`.tac-reveal` / `.tac-reveal.is-visible`); the only inline style here is
 * the per-instance `transition-delay`.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as = 'div',
}: RevealProps): ReactElement {
  // A callback ref in state (rather than useRef) so the observer effect can
  // depend on the node itself — and so nothing reads a ref during render.
  const [node, setNode] = useState<HTMLElement | null>(null)
  // Decided once, before first paint, so we never flash a hidden element.
  const [immediate] = useState<boolean>(
    () => prefersReducedMotion() || !hasIntersectionObserver(),
  )
  const [visible, setVisible] = useState<boolean>(false)

  useEffect(() => {
    if (immediate || visible || !node) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          setVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [immediate, visible, node])

  const classNames: string[] = []
  if (!immediate) {
    classNames.push('tac-reveal')
    if (visible) classNames.push('is-visible')
  }
  if (className) classNames.push(className)

  const style: CSSProperties | undefined =
    !immediate && delay > 0 ? { transitionDelay: `${delay}ms` } : undefined

  const Tag = as as ElementType

  return (
    <Tag
      ref={setNode}
      className={classNames.length > 0 ? classNames.join(' ') : undefined}
      style={style}
    >
      {children}
    </Tag>
  )
}

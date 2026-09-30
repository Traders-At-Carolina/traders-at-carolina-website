import { useState } from 'react'

type ImageOrPlaceholderProps = {
  src?: string
  alt: string
  className?: string
  /** Text inside the empty block, e.g. "[Photo]". Decorative only. */
  placeholder: string
  /** Placeholder fill: warm gray (default) or white for warm-gray sections. */
  tone?: 'warm' | 'white'
  loading?: 'lazy' | 'eager'
}

/**
 * Renders the image, or a flat colour block when `src` is empty or the file
 * fails to load — so an empty image folder never shows a broken-image icon.
 */
export function ImageOrPlaceholder({
  src,
  alt,
  className,
  placeholder,
  tone = 'warm',
  loading = 'lazy',
}: ImageOrPlaceholderProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (!src || failedSrc === src) {
    return (
      <div className={tone === 'white' ? 'tac-ph tac-ph--white' : 'tac-ph'}>
        <span aria-hidden="true">{placeholder}</span>
      </div>
    )
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  )
}

'use client'
export default function LogoImg({ className, src, fallback, alt, style }) {
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      style={style}
      onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = fallback }}
    />
  )
}

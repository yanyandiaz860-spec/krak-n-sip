/**
 * Stacks a product's tray layer on its cup layer (see tools/split_cups.py).
 * Together they look like the untouched artwork; apart, the tray can lift off.
 */
export default function SplitCup({ product, alt, loading = 'lazy', fetchPriority, className = '' }) {
  const shared = { width: product.width, height: product.height, decoding: 'async', draggable: false, alt: '', loading, fetchPriority }

  return (
    <div className={`cup ${className}`} style={{ aspectRatio: `${product.width} / ${product.height}` }} role="img" aria-label={alt}>
      <div className="cup-layer cup-part-bottom">
        <img {...shared} src={`/images/products/${product.id}-cup.webp`} />
      </div>
      <div className="cup-layer cup-part-top">
        <img {...shared} src={`/images/products/${product.id}-tray.webp`} />
      </div>
    </div>
  )
}

import type { Product } from '../types'

type Props = {
  product: Product
}

// Extrai uma cor sugerida do nome do produto pra usar como acento visual
// no topo do card. Sem necessidade de imagens reais.
function getAccentColor(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('preta')) return '#1f2937'
  if (lower.includes('transparente')) return '#94a3b8'
  if (lower.includes('caramelo')) return '#b45309'
  return '#8b5cf6'
}

export function ProductCard({ product }: Props) {
  const isOutOfStock = product.stock === 0
  const accent = getAccentColor(product.name)

  return (
    <article className="card">
      <div className="card-accent" style={{ background: accent }} />
      <div className="card-body">
        <span className="card-emoji" aria-hidden>
          📱
        </span>
        <h2>{product.name}</h2>
        <p className="price">R$ {product.price.toFixed(2)}</p>
        {isOutOfStock ? (
          <span className="badge badge-out">Esgotado</span>
        ) : (
          <span className="badge badge-in">{product.stock} em estoque</span>
        )}
        <button className="btn btn-primary" disabled={isOutOfStock}>
          Comprar
        </button>
      </div>
    </article>
  )
}

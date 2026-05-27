import type { Product } from '../types'

type Props = {
  product: Product
}

export function ProductCard({ product }: Props) {
  const isOutOfStock = product.stock === 0

  return (
    <article className="card">
      <img className="card-image" src={product.imageUrl} alt={product.name} loading="lazy" />
      <div className="card-body">
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

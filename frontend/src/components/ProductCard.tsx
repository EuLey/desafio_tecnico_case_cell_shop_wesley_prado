import type { Product } from '../types'
import { LoadingSpinner } from './LoadingSpinner'

type Props = {
  product: Product
  isPending: boolean
  isOtherPending: boolean
  onBuy: (productId: string) => void
}

export function ProductCard({ product, isPending, isOtherPending, onBuy }: Props) {
  const isOutOfStock = product.stock === 0
  const isDisabled = isOutOfStock || isPending || isOtherPending

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
        <button
          type="button"
          className="btn btn-primary"
          disabled={isDisabled}
          onClick={() => onBuy(product.id)}
        >
          {isPending ? (
            <>
              <LoadingSpinner /> Processando…
            </>
          ) : (
            'Comprar'
          )}
        </button>
      </div>
    </article>
  )
}

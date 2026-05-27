import { useEffect, useState } from 'react'
import { ProductCard } from './components/ProductCard'
import { fetchProducts } from './api/client'
import type { Product } from './types'

export function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container">
      <header className="brand">
        <h1>🛍️ CaseCellShop</h1>
        <p className="subtitle">Capinhas de celular para todo tipo de gente</p>
      </header>

      <main>
        {loading && <p className="loading">Carregando produtos…</p>}
        {loadError && <div className="feedback feedback-error">{loadError}</div>}
        {!loading && !loadError && (
          <div className="catalog">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

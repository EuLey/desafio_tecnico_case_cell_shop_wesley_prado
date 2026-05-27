import { useEffect, useState } from 'react'
import { ProductCard } from './components/ProductCard'
import { StatusBanner } from './components/StatusBanner'
import { fetchProducts, resetAll } from './api/client'
import { useCheckout } from './hooks/useCheckout'
import type { Product } from './types'

export function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [simulateFailure, setSimulateFailure] = useState(false)
  const [resetting, setResetting] = useState(false)
  const { state, checkout, reset } = useCheckout()

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((err: Error) => setProductsError(err.message))
      .finally(() => setProductsLoading(false))
  }, [])

  // Após uma compra bem-sucedida, recarrega os produtos para refletir o estoque atualizado.
  useEffect(() => {
    if (state.status === 'success') {
      fetchProducts().then(setProducts).catch(() => undefined)
    }
  }, [state.status])

  const isCheckoutLoading = state.status === 'loading'
  const loadingProductId = state.status === 'loading' ? state.productId : null

  const handleBuy = (productId: string) => {
    checkout(productId, { simulatePaymentFailure: simulateFailure })
  }

  const handleReset = async () => {
    setResetting(true)
    try {
      await resetAll()
      const fresh = await fetchProducts()
      setProducts(fresh)
      reset()
    } catch (err) {
      console.error('Falha ao resetar:', err)
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="container">
      <header className="brand">
        <h1>🛍️ CaseCellShop</h1>
        <p className="subtitle">Capinhas de celular para todo tipo de gente</p>
      </header>

      <main>
        {productsLoading && <p className="loading">Carregando produtos…</p>}
        {productsError && (
          <div className="feedback feedback-error">{productsError}</div>
        )}

        {!productsLoading && !productsError && (
          <div className="dev-tools">
            <label className="dev-toggle">
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(e) => setSimulateFailure(e.target.checked)}
                disabled={isCheckoutLoading || resetting}
              />
              <span>Simular pagamento recusado</span>
              <span className="dev-toggle-hint">
                (próximo clique em &quot;Comprar&quot; usará um cartão recusado)
              </span>
            </label>
            <button
              type="button"
              className="btn-reset"
              onClick={handleReset}
              disabled={isCheckoutLoading || resetting}
              title="Restaura estoque e limpa pedidos (uso de desenvolvimento)"
            >
              {resetting ? 'Resetando…' : '↻ Resetar estoque'}
            </button>
          </div>
        )}

        {state.status === 'success' && (
          <StatusBanner
            type="success"
            message={`Pedido criado com sucesso! Código: ${state.order.orderId}`}
            onClose={reset}
          />
        )}
        {state.status === 'error' && (
          <StatusBanner type="error" message={state.message} onClose={reset} />
        )}

        {!productsLoading && !productsError && (
          <div className="catalog">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isPending={loadingProductId === p.id}
                isOtherPending={isCheckoutLoading && loadingProductId !== p.id}
                onBuy={handleBuy}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

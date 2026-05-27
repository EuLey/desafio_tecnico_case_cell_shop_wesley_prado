export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super(400, 'VALIDATION_ERROR', 'Dados inválidos no corpo da requisição.', details)
  }
}

export class ProductNotFoundError extends AppError {
  constructor(productId: string) {
    super(404, 'PRODUCT_NOT_FOUND', `Produto "${productId}" não encontrado.`, { productId })
  }
}

export class OutOfStockError extends AppError {
  constructor(productId: string, availableQty: number) {
    super(409, 'OUT_OF_STOCK', 'Estoque insuficiente para um ou mais itens.', { productId, availableQty })
  }
}

export class PaymentDeclinedError extends AppError {
  constructor(reason: string) {
    super(422, 'PAYMENT_DECLINED', 'Pagamento recusado.', { reason })
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(retryAfter?: number) {
    super(503, 'SERVICE_UNAVAILABLE', 'Serviço temporariamente indisponível.', { retryAfter })
  }
}

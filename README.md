# Desafio Técnico CaseCellShop — Parte 1.B

Implementação da mini-tarefa de checkout do desafio técnico CaseCellShop (vaga Júnior Fullstack). As respostas conceituais (Parte 1.A) são entregues em arquivo separado.

## Stack

- **Backend**: Node 20+ · Express · TypeScript · Zod (validação) · Vitest + Supertest (testes)
- **Frontend**: React · TypeScript · Vite
- **Persistência**: em memória (`Map<id, T>`) — sem banco

## Pré-requisitos

- Node 20 ou superior (`node -v` pra checar)
- npm (vem junto com o Node)

## Como rodar

Abra dois terminais:

### Terminal 1 — Backend

```bash
cd backend
npm install
npm run dev
```

Sobe em `http://localhost:3001`. Quando estiver pronto, mostra:

```
backend rodando em http://localhost:3001
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Sobe em `http://localhost:5173`. O Vite faz proxy automático de `/api/*` para o backend, então não tem configuração de CORS pra fazer.

Abre `http://localhost:5173` no navegador e você vê o catálogo com 3 capinhas.

### Testes (backend)

```bash
cd backend
npm test
```

Roda 7 testes que cobrem os 6 cenários de checkout definidos na Parte 1.A (Pergunta 4): caminho feliz, validação, sem estoque, produto inexistente, idempotência e concorrência.

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Healthcheck — retorna `{ "ok": true }` |
| `GET` | `/products` | Lista os 3 produtos do seed |
| `POST` | `/checkout` | Cria um pedido (ver contrato abaixo) |
| `GET` | `/orders/:id` | Busca um pedido pelo `orderId` |
| `POST` | `/admin/reset` | **DEV-ONLY** — zera estoque, pedidos e cache (ver seção sobre dev tools) |

### Contrato do `POST /checkout`

Request body:

```json
{
  "idempotencyKey": "uuid-gerado-pelo-cliente",
  "customerId": "cliente-001",
  "items": [{ "productId": "cap-iphone-15", "quantity": 1 }],
  "shippingAddress": { "cep": "01310-100" },
  "paymentMethod": { "type": "credit_card", "token": "tok_visa_approved" }
}
```

Sucesso (`201 Created`):

```json
{
  "orderId": "uuid-gerado",
  "status": "received",
  "customerId": "cliente-001",
  "items": [{ "productId": "cap-iphone-15", "quantity": 1, "unitPrice": 89.9 }],
  "total": 89.9,
  "createdAt": "2026-05-27T13:00:00.000Z"
}
```

Erros possíveis:

| Status | Quando | `error.code` |
|---|---|---|
| `400` | Payload inválido (campo faltando, tipo errado, quantity ≤ 0) | `VALIDATION_ERROR` |
| `404` | `productId` não existe | `PRODUCT_NOT_FOUND` |
| `409` | Estoque insuficiente | `OUT_OF_STOCK` |
| `422` | Pagamento recusado (token contendo `"declined"`) | `PAYMENT_DECLINED` |

Exemplo de curl (caminho feliz):

```bash
curl -X POST http://localhost:3001/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "idempotencyKey": "test-001",
    "customerId": "cliente-1",
    "items": [{"productId": "cap-iphone-15", "quantity": 1}],
    "shippingAddress": {"cep": "01310-100"},
    "paymentMethod": {"type": "credit_card", "token": "tok_visa_approved"}
  }'
```

### Simulação de pagamento

Pra evitar integrar com gateway real, o `payment.service.ts` segue uma regra determinística:

- Token contendo a substring `"declined"` → simula recusa (`422 PAYMENT_DECLINED`)
- Qualquer outro token → aprovado

Na UI tem um checkbox **"Simular pagamento recusado"** no topo da página que troca o token automaticamente — permite testar o fluxo de erro sem precisar editar nada.

## ⚠ Ferramentas de desenvolvimento

Há 2 recursos no projeto que existem **só pra facilitar o teste manual** — não fariam parte de uma versão real em produção:

### 1. `POST /admin/reset`
Endpoint que zera o estoque (volta ao seed), limpa todos os pedidos criados e esvazia o cache de idempotência. Sem auth.

```bash
curl -X POST http://localhost:3001/admin/reset
```

### 2. Botão "↻ Resetar estoque" na UI
Aparece numa caixa roxa pontilhada no topo do catálogo. Quando clicado, chama o endpoint acima e recarrega a lista de produtos.

### Por que tá assim?
Sem isso, depois de clicar em "Comprar" algumas vezes o estoque zera e o avaliador (ou você) precisa derrubar o backend pra resetar — fricção desnecessária.

**Em produção, este endpoint não existiria** Aqui ficam explícitos como dev tools, isolados no path `/admin/`.

## Decisões de design

### Separação em camadas (controllers / services / repositories)
Mesmo num projeto pequeno, separei pra demonstrar familiaridade com o padrão e facilitar evolução. Se virasse algo real, só a camada de repositório mudaria quando trocássemos o `Map` por Postgres.

### Mutex por produto pra proteger contra furo de estoque
`backend/src/lib/mutex.ts` implementa um mutex assíncrono encadeado em Promises, por chave. O checkout adquire lock no `productId` antes de validar estoque → cobrar pagamento → decrementar. Isso garante que duas requests simultâneas pro mesmo produto se serializam, e a segunda vê o estoque atualizado pela primeira. **O teste `checkout.concurrency.test.ts` prova isso com `Promise.all` de 2 requests pro produto com `stock=1`.**

### Idempotência
`Map<idempotencyKey, Order>` em memória. Se a mesma key chegar 2x, retorna o pedido original sem reprocessar nem decrementar estoque de novo. Em produção viraria Redis com TTL de ~24h.

### Por que `status: "received"` em vez de `"confirmed"`?
Espelha o modelo desacoplado descrito na Parte 1.A (Pergunta 3) — o pedido é aceito imediatamente, e o processamento pesado (faturamento, NF) iria pra uma fila assíncrona consumida no ritmo do ERP. Como não temos ERP nem fila aqui, fica só o `received`, mas a estrutura tá pronta pra evoluir.

### Validação com Zod
Schema declarativo em `schemas/checkout.schema.ts`. Middleware `validate(schema)` valida o body e, em erro, dispara `ValidationError` que o `errorHandler` mapeia pra `400` com lista de campos problemáticos.

### Imagens dos produtos
Arquivos `.jpg` em `frontend/public/produtos/`, servidos diretamente pelo Vite. O campo `imageUrl` no produto é uma URL relativa (`/produtos/...`), o backend só armazena a string.

## O que ficou de fora e por quê

| Item | Por quê |
|---|---|
| Autenticação | PDF dispensa explicitamente |
| Banco de dados | Em memória atende o escopo; trocar por Postgres seria 1 camada de repositório |
| Gateway de pagamento real | Simulação determinística (`token.includes("declined")`) cobre os cenários de teste |
| Docker / deploy | PDF dispensa |
| TTL na idempotência | Em produção, Redis com expire em 24h. Em memória vive enquanto o processo viver |
| Lock distribuído | Mutex atual funciona em 1 processo Node. Com cluster/PM2 precisaria virar SETNX no Redis |
| `GET /orders/:id` consumido pela UI | Endpoint existe e está testável via curl/REST Client, mas a UI atual não tem tela de detalhe de pedido |

## Estrutura do projeto

```
desafio_tecnico_case_cell_shop_wesley_prado/
├── backend/
│   ├── src/
│   │   ├── server.ts            # bootstrap, app.listen
│   │   ├── app.ts               # monta express + rotas + error handler
│   │   ├── routes/              # express routers (products, checkout, orders, admin)
│   │   ├── controllers/         # handlers HTTP (camada fina)
│   │   ├── services/            # regra de negócio (checkout, payment, products, orders)
│   │   ├── repositories/        # acesso a dados em memória
│   │   ├── domain/              # types + classes de erro tipadas
│   │   ├── schemas/             # zod schemas
│   │   ├── middlewares/         # validate + errorHandler
│   │   ├── lib/                 # mutex
│   │   └── __tests__/           # 6 cenários do checkout + helpers
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # raiz, orquestra estado e renderiza catálogo
│   │   ├── main.tsx
│   │   ├── api/                 # client HTTP (fetch wrappers)
│   │   ├── components/          # ProductCard, StatusBanner, LoadingSpinner
│   │   ├── hooks/               # useCheckout (state machine do fluxo)
│   │   ├── types.ts
│   │   └── styles.css
│   ├── public/produtos/         # imagens dos produtos
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── CASE_CELL_SHOP/              # PDF do enunciado original (referência)
```

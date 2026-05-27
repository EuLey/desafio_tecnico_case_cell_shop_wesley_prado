# Parte 1.A — Respostas Conceituais

---

## Pergunta 1 — Leitura inicial dos problemas

Olhando os três problemas juntos, eles têm um fio em comum: **a loja virtual está acoplada demais ao ERP**. O ERP era suficiente quando o tráfego era de milhares por dia, mas saiu do controle quando virou milhões.

### 01 · Performance da vitrine

- **O que provavelmente está causando:** toda visita na vitrine bate direto no ERP via REST síncrona. Não há cache no meio. O ERP é monolítico e o MySQL roda nos servidores próprios da empresa, então cada page view dispara queries que ele não foi dimensionado pra aguentar nesse volume. Resultado: a fila de espera no ERP cresce e a vitrine sente.
- **Impacto:** o cliente sai antes mesmo de ver o produto. Perde-se conversão logo na porta de entrada e a percepção da marca despenca. Puxando uma experiência breve que tive mexendo com Google Analytics, dá pra ver claramente nas métricas como tempo de carregamento e taxa de rejeição andam de mãos dadas, quanto mais a página demora, mais gente fecha a aba antes de ver qualquer coisa. E esse mesmo sinal de "experiência ruim" o Google usa pra rebaixar o site nos resultados de busca, então quem ainda nem tinha chegado na loja também passa a não chegar.
- **Por onde eu começaria:** medir antes de mexer. Olhar tempo de resposta do ERP por endpoint, quais chamadas são mais frequentes e o que muda com que frequência (preço muda menos do que imagem, estoque muda mais do que descrição). Com isso na mão, dá pra desenhar uma camada de cache na frente do ERP com TTLs diferentes por tipo de dado.

### 02 · Consistência de estoque

- **O que provavelmente está causando:** A leitura do estoque e a decisão de comprar acontecem em momentos separados, sem nenhum lock. Vários clientes leem "tem 1 em estoque" ao mesmo tempo e todos passam pelo checkout. Provavelmente também não há reserva no carrinho, o produto fica "disponível" até o exato instante em que o ERP é avisado.
- **Impacto:** vender o que não tem é caro. Gera cancelamento, reclamações no SAC, cliente exigir o dinheiro de volta e principalmente quebra de confiança do cliente. Em e-commerce, isso vira reclamação pública rápido.

- **Por onde eu começaria:** criar uma camada de reserva de estoque por fora do ERP, (já que o ERP é read-only pra gente). A ideia seria algo como no momento do checkout, o sistema "segura" aquela unidade pra ele em um espaço próprio nosso, feito pra aguentar muitas tentativas simultâneas sem se confundir e acabar vendendo o mesmo item duas vezes, com TTL pra liberar caso o pagamento não vá adiante. E periodicamente o sistema confere a contagem que a gente tem com a do ERP, pra garantir que os dois lados continuam batendo.

### 03 · Resiliência do checkout

- **O que provavelmente está causando:** a confirmação do pedido depende de uma chamada síncrona ao ERP. Se o ERP está lento, o cliente espera junto. Se passa do timeout do servidor (ou do navegador), a requisição morre e o pedido se perde, mesmo que o ERP eventualmente fosse processar.
- **Impacto:** o pior tipo de perda, cliente disposto a pagar, prestes a comprar, e a gente derruba. Receita escapando da nossa mão, e o cliente provavelmente vai comprar em outro lugar.
- **Por onde eu começaria:** desacoplar. Aceitar o pedido na hora e responder "recebido" pro cliente, e mandar o processamento pesado (faturamento, NF) pra uma fila que um worker consome no ritmo do ERP. O cliente vê confirmação imediata e recebe um e-mail quando o ERP terminar de processar.

---

## Pergunta 2 — Infraestrutura e serviços de apoio

A ideia geral é parar de tratar o ERP como API pública da loja. Ele continua sendo a fonte da verdade, mas não precisa ser quem responde a cada clique. Pra isso, eu colocaria quatro coisas no meio do caminho:

**1. Cache distribuído (ex.: Redis)**
Guarda produtos, preços e estoque com TTL curto (segundos a minutos, dependendo do dado). A vitrine consulta o cache; só vai ao ERP quando o cache não tem a informação ou ela expirou. Reduz drasticamente a carga no ERP e o tempo de resposta cai pra milissegundos.

**2. CDN pra estáticos e conteúdo cacheável**
Imagens de capinha, CSS, JS e até HTML de páginas de produto podem ser servidos da borda, mais perto do usuário. O ERP nem fica sabendo dessas requisições. É o ganho mais barato e mais imediato.

**3. Fila de mensagens (ex.: RabbitMQ, SQS)**
Pro checkout. A loja aceita o pedido, joga na fila e responde rápido pro cliente. Um worker consome a fila no ritmo que o ERP aguenta. Se o ERP cair por 10 minutos, a fila segura — quando ele voltar, processa o que ficou acumulado. Resolve o problema 3 e dá fôlego pra picos (Black Friday, por exemplo).

**4. Camada intermediária (BFF — Backend For Frontend)**
A ideia é que a loja virtual pare de conversar direto com o ERP, e botar um "maestro" no meio. Esse maestro é uma API nossa, que sabe falar com todo mundo do back-end (cache, fila, ERP) e devolve pra loja um dado já pronto, no formato que ela precisa.

Na prática, a loja virtual não precisa saber se a resposta veio do cache, do ERP, ou da soma de várias fontes, ela só pede ao BFF "me dá os produtos da home".

O ganho vai além de organizar o código:

- **O back-end vira trocável.** Se amanhã o ERP for substituído, ou se subir um serviço novo de estoque, só o BFF precisa ser ajustado — a loja virtual nem fica sabendo.
- **Lugar natural pra orquestrar** cache, fila, validações e tratamento de erro. Em vez de espalhar essa lógica pela loja virtual, fica tudo concentrado num único ponto, fácil de testar e de evoluir.

---

## Pergunta 3 — SDD: contrato do `POST /checkout`

Antes de codificar, definiria o contrato mais ou menos assim:

### O que o endpoint precisa receber

```json
{
  "idempotencyKey": "uuid-gerado-pelo-client",
  "customerId": "string",
  "items": [
    { "productId": "string", "quantity": 1 }
  ],
  "shippingAddress": { "cep": "string", "...": "..." },
  "paymentMethod": { "type": "credit_card", "token": "string" }
}
```

A `idempotencyKey` é uma boa prática, é o que evita cobrar duas vezes se o cliente clicar duas vezes em "comprar" ou se a rede cair no meio da resposta.

### Resposta de sucesso (`201 Created`)

```json
{
  "orderId": "uuid",
  "status": "received",
  "total": 199.90,
  "items": [{ "productId": "...", "quantity": 1, "unitPrice": 99.95 }],
  "createdAt": "2026-05-26T12:00:00Z"
}
```

Status `received` (e não `confirmed`) porque, no modelo desacoplado que tratamos na Pergunta 2, o pedido é aceito na hora e o faturamento acontece depois. Vale uma rota separada `GET /orders/:id` pro front consultar o status final.

### Respostas de erro

| Status | Quando | Corpo |
|---|---|---|
| `400` | payload inválido (campo faltando, tipo errado) | `{ error: { code: "VALIDATION_ERROR", message, details } }` |
| `404` | produto não existe | `{ error: { code: "PRODUCT_NOT_FOUND", ... } }` |
| `409` | estoque insuficiente | `{ error: { code: "OUT_OF_STOCK", availableQty } }` |
| `422` | pagamento recusado | `{ error: { code: "PAYMENT_DECLINED", reason } }` |
| `503` | ERP indisponível e fila também | `{ error: { code: "SERVICE_UNAVAILABLE", retryAfter } }` |

### Por que vale a pena definir isso antes

Pra mim a maior vantagem é prática: front e back conseguem trabalhar em paralelo sem ficar esperando um pelo outro. Mas tem outras três que pesam:

- **Força pensar nos erros antes do código.** Listar os status acima me obriga a perguntar "e se o ERP cair?", "e se o cliente clicar duas vezes?". É bem mais barato responder isso na spec do que depois que o código tá em produção.
- **Contrato vira documentação viva.** Quem chegar depois lê o JSON e entende o que a rota faz. Sem precisar abrir o controller.
- **Testes ficam triviais.** Com o contrato definido, escrever os testes da Pergunta 4 vira praticamente preencher uma tabela: pra cada caso de erro listado, um teste.

---

## Pergunta 4 — TDD: testes do `POST /checkout`

Os cenários que eu escreveria primeiro:

1. **Caminho feliz** — produto existe, estoque suficiente, payload válido → `201` com `orderId` e estoque decrementado.
2. **Estoque insuficiente** — `quantity` maior que o disponível → `409`, e o estoque **não pode** ter sido tocado.
3. **Produto inexistente** — `productId` que não existe → `404`.
4. **Payload inválido** — falta `customerId` ou `quantity` é zero/negativo → `400` com mensagem clara apontando o campo.
5. **Idempotência** — mesma `idempotencyKey` enviada duas vezes → segunda chamada devolve o mesmo `orderId`, sem criar pedido duplicado nem decrementar estoque de novo.
6. **Concorrência no último item** — duas requisições simultâneas pro mesmo produto com 1 em estoque → uma ganha (`201`), a outra recebe `409`. Esse aqui não é trivial de testar, mas é o teste que prova que a Pergunta 1 (problema 2) está resolvida de verdade.

### A vantagem de escrever os testes antes

Tem duas que considero as principais.

A primeira é que **o teste vira a spec executável**. Quando eu escrevo "este teste espera 409 quando estoque está zerado" antes de codar, eu fui obrigado a decidir qual status retornar. O código depois só está preenchendo um buraco já desenhado. Sem TDD, é fácil escrever o código primeiro, ver que ele devolve 500, e racionalizar que "tá bom assim".

A segunda é que **dá segurança pra refatorar**. Em código júnior (e eu me incluo aqui kkkkkk) a primeira versão raramente é a melhor. Ter teste verde antes de mexer me deixa trocar a implementação inteira sem medo: se passou, passou.

Confesso uma coisa honesta: nem sempre faço TDD puro no dia a dia. Pra rotas com contrato claro como essa, faz muito sentido. Pra coisas mais exploratórias (mexer em UI, por exemplo), eu costumo escrever os testes logo depois do primeiro esboço funcionar. Mas a disciplina de pensar em testes *antes de considerar a tarefa pronta* é inegociável.

---

## Pergunta 5 — Uso de IA pro Problema 2 (Furo de Estoque)

Antes de listar perguntas, registro como eu abordaria a conversa: **eu daria contexto primeiro, depois perguntaria**. IA sem contexto inventa solução genérica que não cabe na nossa restrição (ERP read-only, on-premise, MySQL). Então o primeiro "prompt" não seria uma pergunta, seria um pequeno resumo do que estou trabalhando, minhas restrições e onde quero chegar / quero resolver.

Algo como:

> "Estou trabalhando num e-commerce em Node.js/TypeScript que consome um ERP monolítico (MySQL, rodando em servidor próprio da empresa) via REST. **Não posso alterar nada dentro do ERP** — só leio dados dele. O problema é furo de estoque: clientes conseguem comprar o mesmo produto simultaneamente quando o estoque está acabando. Volume é alto (milhões de acessos/dia). Já existe um Redis disponível como infraestrutura de apoio."

Com isso na mesa, as perguntas que eu faria:

1. **"Quais estratégias de reserva de estoque funcionam fora do ERP evitando o furo de estoque por compras simultâneas?"**

2. **"Quais os trade-offs entre cada estratégia?"** 

3. **"Como modelar a reserva de carrinho? Qual TTL é razoável e como liberar quando expira?"**

4. **"Gere casos de teste que provem a acertividade sob concorrência."** 

5. **"Como conciliar o estoque do Redis com a verdade do ERP periodicamente?"** 

6. **"O que pode dar errado nessa solução e como eu detectaria em produção?"** 

Trato as respostas como sugestão de um colega sênior que pode estar errado. Leio o código que ela gera e testo, a IA já me fez perder tempo "inventando" método que não existe kkkkk. E nunca colo no projeto sem entender o que cada linha está fazendo, porque se quebrar amanhã sou eu que vou ter que arrumar.

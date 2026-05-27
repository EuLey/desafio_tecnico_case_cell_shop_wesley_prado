# PROMPTS.md — Registro de uso de IA

## Como usei IA neste desafio

Usei o **Claude Code** (CLI da Anthropic) como par de programação durante toda a Parte 1.B. O fluxo foi sempre o mesmo:

1. Eu definia o que queria fazer (na maior parte das vezes baseado nas decisões que já tinha escrito nas respostas da Parte 1.A)
2. Discutia a abordagem com a IA — trade-offs, escolhas de stack, estrutura de pastas, design da UI
3. A IA gerava o código por commit atômico, eu revisava cada arquivo
4. Cada `git push` aconteceu só depois da minha confirmação explícita
5. Eu testei manualmente o sistema no browser e via testes automatizados

 Em vários momentos pausei pra perguntar conceitos que apareciam no código. Preferi atrasar a execução pra ter clareza do que estava entrando no repositório, em vez de só aceitar.

## Prompts mais relevantes

### 1. Plano antes do código

> "Plan mode para desenvolver a parte 1.B"

Esse foi o pontapé. Pedi pra IA formalizar um plano detalhado **antes** de escrever qualquer linha. O plano cobriu: stack, estrutura de pastas, 17 commits atômicos com mensagens prévias, resolução de ambiguidades do enunciado, pontos críticos de implementação e plano de verificação. Aprovei o plano completo antes de começar a execução.

### 2. Mapear o checklist do PDF contra a implementação

Pedi pra IA ler o PDF do desafio e mapear cada checkbox do "O que esperamos observar na entrega" contra o que ia ser implementado, identificando **gaps** (coisas que o PDF não esclarece: quantos produtos? front é catálogo ou só formulário? simulação de pagamento como?). Pra cada gap a IA propôs resolução com justificativa, eu validei.

### 3. Execução em commits atômicos

> "pode fazer push no git, mas sempre me sinalize antes de fazer para eu autorizar"

Cada feature virou um commit pequeno (~10-200 linhas) com mensagem em português. Antes de cada push, a IA pedia minha autorização explícita. Resultado: timeline do GitHub com 17+ commits que contam a história da implementação passo a passo.

### 4. Aprofundamento de conceitos durante o desenvolvimento

Quando algo no código não estava 100% claro, eu parava:

> "detalhe melhor oq é Decremento atomico em Redis?"
>
Em vez de só copiar e seguir, fui validando que entendia cada peça antes de aceitar.

### 5. Direção do design do frontend

> "precisamos melhorar esse front? quero ele mais elaborado, com mais cores também"
>

A direção visual veio de mim (paleta roxa moderada, real product images), a implementação em CSS/React veio da IA. Forneci as 3 imagens reais e deixei a IA encaixar na estrutura existente sem quebrar nada.

### 6. Identificação e correção de fricções

> "faz sentido resetar os produtos na tela, para realizar novas simulações?"

Identifiquei uma fricção testando o sistema (depois de algumas compras, estoque zerava e eu não conseguia resetar sem reiniciar o backend). A IA propôs adicionar um endpoint `POST /admin/reset` + botão na UI, claramente marcado como dev-only no README. Aprovei a ideia e ela implementou.

## O que NÃO veio da IA

- **A escolha de stack** — Node + TS + React/Vite, alinhada com a stack preferencial do desafio.
- **Os cenários de teste do checkout** — saíram da minha resposta da Pergunta 4. A IA me ajudou a mapear mais cenários do que pensei e implementou junto com o que eu já tinha listado.
- **A direção visual do projeto** — paleta roxa, header com emoji + brand, layout dos cards, decisão de usar imagens reais — vieram de pedidos meus específicos, não de iniciativa da IA.
- **As validações no browser** — testei cada commit manualmente em `localhost:5173` e dei feedback (ex.: tirar footer, melhorar design, adicionar reset).

## Aprendizados

1. **IA acelera, mas não substitui entendimento.** Quando parei pra perguntar "o que é mutex?", "o que é idempotência?", consegui defender as escolhas técnicas que estavam indo pro repo.

2. **Commits atômicos com aprovação por etapa funcionam muito bem com IA.** Em vez de receber 200 arquivos de uma vez, recebi 17 mudanças pequenas e foi possível revisar cada uma. Recomendo esse fluxo pra qualquer trabalho com IA — o controle fica mais real do que parece.

3. **A IA é boa em propor; o julgamento é meu.** Várias vezes ela propôs alternativas (paletas de cores, estratégias de teste, opções de armazenamento de imagem, formas de implementar idempotência). Escolher qual seguir foi sempre minha responsabilidade — e a IA sempre apresentou os trade-offs honestamente quando perguntada.

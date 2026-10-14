# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Clientes consultam livros, compram, alugam, reservam e acompanham pedidos. Administradores gerenciam acervo, contas, operações, moderação e atendimento. Esses papéis e fluxos existem no sistema original.

## Product Purpose

Biblioteca online BiblioConnect, projeto acadêmico com apresentação prevista para dezembro de 2026. A repaginação aprovada deve conferir apresentação profissional sem perder funcionalidades ou integração com banco.

## Operating Context

React/Vite no navegador, Express e Prisma/PostgreSQL no servidor. Desenvolvimento no Windows. A demonstração persistente existe; QA usa banco temporário separado. Integrações externas requerem configuração própria, e sua operação real não é inferida dos testes locais.

## Capabilities and Constraints

Catálogo, compra, aluguel, reserva, entrega, pagamentos, conta/confirmação/recuperação, avaliações moderadas, chat e administração. Preservar rotas, contratos, cores e dados. O usuário solicitou uma nova marca em 14/10/2026; a obrigação anterior de preservar o logotipo foi substituída. A etapa atual muda o frontend e seu ferramental de validação; não acrescenta leitor digital ou novas regras de negócio.

## Brand Commitments

Nome BiblioConnect e nova marca em avaliação. Paleta existente e direção editorial contemporânea com Atlas do Acervo como assinatura de descoberta. Uiverse, 21st.dev e React Bits são referências solicitadas, com atribuição para código incorporado. Sol/lua RiccardoRapelli, Interactive Hover Button Magic UI, loading Nawsome e fade de caracteres foram escolhidos pelo usuário.

## Evidence on Hand

Código original, especificação inicial e decisões da segunda rodada em `docs/design-references/2026-10-14/README.md`, com plano revisado e aprovado em `docs/superpowers/plans/2026-10-14-biblioconnect-atlas-plan.md`. O banco original recebeu livros expressamente autorizados; proveniência e verificações em `docs/verification/2026-10-14-persistent-acervo.md`. Não há evidência para inventar depoimentos, parceiros ou vendas.

## Product Principles

- A apresentação acompanha a verdade dos dados recebidos.
- O acesso aos livros e às operações continua prático em qualquer tela.
- Movimento e 3D não bloqueiam uma tarefa.
- O ambiente de teste não altera dados persistentes do usuário.

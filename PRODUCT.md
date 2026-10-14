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

Catálogo, compra, aluguel, reserva, entrega, pagamentos, conta/confirmação/recuperação, avaliações moderadas, chat e administração. Preservar rotas, contratos, logotipo, cores e dados. A etapa atual muda o frontend e seu ferramental de validação; não acrescenta leitor digital ou novas regras de negócio.

## Brand Commitments

Nome e logotipo BiblioConnect. Paleta existente e direção editorial contemporânea, fontes e composição detalhadas na especificação aprovada. Uiverse, 21st.dev e React Bits são referências solicitadas, com atribuição para código incorporado.

## Evidence on Hand

Código original e especificação em `docs/superpowers/specs/2026-10-13-biblioconnect-editorial-design.md`. Baseline: testes unitários, integração real em QA e screenshots de navegador em `frontend/test-results`. Não há evidência para inventar depoimentos, parceiros, títulos em estoque ou vendas.

## Product Principles

- A apresentação acompanha a verdade dos dados recebidos.
- O acesso aos livros e às operações continua prático em qualquer tela.
- Movimento e 3D não bloqueiam uma tarefa.
- O ambiente de teste não altera dados persistentes do usuário.

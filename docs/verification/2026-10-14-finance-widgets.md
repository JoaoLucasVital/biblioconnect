# Widgets financeiros escolhidos — 14/10/2026

## Resultado

Composição aprovada em chat: Stats Widget (1) como card principal; Sales Card Uiverse (5) nos totais secundários; Financial Score Cards (2) no indicador semicircular; Donut Chart (4) na receita por origem; barras horizontais shadcn e referências de interação/entrada do React Bits Pro. Links e limites em `../design-references/2026-10-14/finance-components-selected.md`. Implementações locais com dependências existentes, sem acesso/incorporação de código pago.

O card principal destaca receita aprovada, contagem e confirmação. Os demais mantêm pendências, estornos e cancelamentos. A rosca usa totais por tipo; hover/foco atualiza o centro, Enter/Espaço seleciona categoria e o botão de retorno restaura o total. A lista fornece valores textuais acessíveis. O indicador calcula `pedidosPagos / (pedidosPagos + pedidosPendentes + pedidosCanceladosPagamento + pedidosEstornados)` e mostra ausência de base quando não há pedidos. Não foram adicionadas séries temporais, períodos ou crescimento sem dados.

## Verificação

- TDD: três testes novos falharam antes da implementação e passaram depois, cobrindo cálculo, interação por teclado e ausência de dados.
- `rtk npm test`: **92/92 aprovados**, 18 arquivos.
- `rtk npm run lint`: aprovado.
- Build de produção e testes com banco temporário: `rtk proxy node scripts/qa-environment.js --e2e-production e2e/admin.spec.js e2e/dashboards.spec.js e2e/review-fixes.spec.js e2e/visual.spec.js`: **13/13 aprovados** na execução final.
- Primeira execução: 12/13; falha de seletor ambíguo no teste existente de atendimento, pois o texto aparece na prévia e na mensagem. Corrigido para verificar o parágrafo da mensagem, preservando a verificação do envio; nenhuma alteração na implementação de atendimento.
- Teste novo de navegador cobre rosca por teclado, percentual real, cinco larguras (320/360/768/1024/1440), os dois temas e movimento reduzido.
- Pagamento e conclusão de pedido, gestão de usuários, avaliações, atendimento, contraste e resumos de ranking permanecem cobertos pela suíte executada.
- Revisão independente do diff por leitura: sem findings concretos.
- QA visual com banco persistente: desktop claro/escuro, celular, seleção da legenda e painel principal com barras horizontais. Capturas em `../design-references/2026-10-14/finance-widgets-*.jpg` e `admin-horizontal-bars-dark.jpg`.

## Preservação

Sem alterações em schema, backend, banco persistente, permissões ou contratos de pagamento. Nenhuma dependência nova. Nenhum pagamento/reset executado no ambiente de demonstração. Banco original permanece com 22 livros; frontend integrado em `http://localhost:5173`, API em `http://localhost:3000`. O aviso conhecido Three/CommonJS permanece fora do escopo. O ambiente persistente foi deixado aberto no financeiro.

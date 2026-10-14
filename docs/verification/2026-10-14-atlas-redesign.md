# Segunda rodada BiblioConnect — entrega para avaliação visual

Data: 14/10/2026. Branch `codex/biblioconnect-editorial`, worktree editorial existente. Base funcional da rodada `495607a`; código inicial já verificado mantido como referência. Esta é uma prévia integrada local, sem deploy público e sem aprovação estética final presumida.

## Entrega

- Atlas do Acervo na abertura, com livros/categorias reais, relações verificáveis por autor/categoria, busca com acentos, seleção por foco/clique, detalhes, valores e acesso ao catálogo.
- Lista completa equivalente no celular e como alternativa no desktop. Movimento reduzido abre em lista e impede cena/ciclos. Mapa com no máximo48 pontos, limite efetivo informado, sem perder os resultados da lista.
- Pontos projetados na área real do mapa por ResizeObserver, com alvos44px separados. Células de pelo menos52px mantêm a seleção correta em mapas densos.
- Seletor sol/nuvens/lua/estrelas escolhido pelo usuário, preservando preferência e body.dark. Teclado, foco visível, alvo60×44px, reduced-motion e pausa em aba oculta.
- Interactive Hover Link da Magic UI no CTA de descoberta, loading de livro Nawsome durante requisições reais e navegação de rotas, revelação curta de títulos.
- FadeInput nas buscas da home/catálogo e nome do cadastro: valor imediato, efeito visual180ms, sem fila. Inputs continuam nativos; colagem, composição, seleção, exclusão e edição no meio não recebem o efeito. Não foi criado fluxo de perfil inexistente.
- Nova marca BC em SVG e favicon: proposta03 aplicada provisoriamente à prévia, enquanto a preferência entre as três propostas segue aberta. Isso foi comunicado ao usuário; não equivale a uma escolha final dele.
- Sidebar administrativa marinho, destinos e permissões preservados, indicadores reais e hierarquia de tabelas. Sem filas fictícias, classificação Dewey ou novos processos operacionais.
- Livro3D existente mantido como destaque secundário, com as alternativas estáticas e verificações de falha existentes.

## Banco existente

API original/Prisma consultam o PGlite persistente original em `biblioconnect/.local/database`. Foram adicionados11 títulos e preservado o registro anterior: total12. Três capas históricas foram cadastradas; oito títulos usam o fallback tipográfico por não terem imagem. Valores/estoques são configurados para apresentação. Nenhuma venda, usuário ou pedido foi criado para preencher indicadores.

Backups, fontes bibliográficas, ids, reexecução sem duplicatas e reinícios documentados em [Acervo persistente](2026-10-14-persistent-acervo.md). O launcher local teve capacidade de sockets ajustada de1 para4 após reprodução isolada da falha de conexão sobreposta; consultas continuam serializadas. Após reinício,12 livros permaneceram, ambas as cargas criaram0 duplicatas, e uma nova abertura após mais de6min sem consulta carregou de primeira.

## Verificação final

| Comando / verificação | Resultado |
| --- | --- |
| `rtk proxy npm --prefix frontend test` | 13 arquivos,66 testes passando |
| `rtk proxy npm --prefix frontend run lint` | Exit0 |
| `rtk proxy npm --prefix frontend run build` | Exit0 |
| `rtk proxy node scripts/qa-environment.js --integration` | 15 testes passando;39 respostas HTTP verificadas e regras de concorrência/estoque |
| `rtk proxy node scripts/qa-environment.js --e2e-production` | **47/47 passando**, rodada final2,2min |
| Código de backend/schema/serviços frente à base495607a | Sem alterações em `server.js`, `prisma`, `src` |
| Prévia persistente no navegador |12 livros, capas históricas, mapa, seleção, busca e temas claro/escuro conferidos |

Os testes de navegador incluem compra/aluguel/reserva, pagamento demonstrativo, devolução/cancelamento, financeiro, usuários, avaliações, atendimento, autenticação/recuperação e controles de acesso. Responsividade: home360/768/1440px, Atlas390/768/1440px, casos extremos320px, zoom de texto200%, teclado, reduced-motion e WebGL ausente/perdido. Todos os testes que gravam dados usam bancos descartáveis do harness, separados do banco persistente.

A primeira bateria desta rodada encontrou seletores antigos de tema/CTA e overflow2px no cabeçalho320px. As referências de testes foram atualizadas para os controles aprovados e o wrapper do seletor passou de64 para60px; a bateria final completa passou. O fade foi verificado com valor/cursor imediatos, edição intermediária, colagem e composição de acentos.

## Revisão independente e correção

Uma revisão somente leitura com `gpt-6-astra`, sem subagentes adicionais, encontrou um problema P2: alvos sobrepostos no mapa com200 livros da mesma categoria. A reprodução real em Chromium identificou32 centros que atingiam outro botão. Um teste de navegador confirmou a falha antes da alteração; dois testes do modelo também falharam antes da correção.

Correção: projeção determinística no espaço disponível, sem alvos sobrepostos e com contagem visível efetiva. Depois:48/48 centros e cliques individuais corretos,4 testes do Atlas passando,66 testes do frontend e47 cenários finais de navegador passando. Não houve nova revisão paga para repetir o mesmo julgamento; a correção foi fechada pelos testes. Nenhum achado menor foi adiado.

## Decisões e limites

1. Marca03 provisória, sem resposta à preferência opcional: permite avaliar a identidade no cabeçalho; uma preferência posterior muda somente os SVGs/favicon.
2. Digitação aplicada a buscas/nome existentes; não inventar perfil para cumprir uma referência condicional do plano. Se esse fluxo for criado depois, o componente está disponível.
3. P1001 foi tratado como configuração operacional do serviço local, fora do diff de negócio. Reprodução/retomada verificadas não substituem disponibilidade e configuração de uma futura infraestrutura pública.

O build mantém avisos sobre tamanho dos chunks lazy de Three/Recharts e as dependências3D emitem avisos de depreciação. Não houve migração dessas bibliotecas nesta rodada. Integrações reais de pagamento/e-mail/deploy dependem da configuração própria já prevista pelo projeto; os testes usam simulação/arquivos locais.

As fontes dos componentes e licenças incorporadas estão em `THIRD_PARTY_NOTICES.md`. Fotos de referência, prancha das logos e decisões do usuário estão em `docs/design-references/2026-10-14/`. O botão Uiverse STORM rejeitado não foi incorporado. Não houve instalação de uma biblioteca completa para copiar um componente.

## Abrir e retomar

Prévia integrada: http://localhost:5173 — API http://localhost:3000. Worktree preservado. Inicialização nesta máquina, a partir do worktree: `rtk proxy node .superpowers/start-persistent.mjs`. Não iniciar simultaneamente outra instância do banco. Esse comando não volta a cadastrar livros nem executa migrações/reset.

PR/fork autorizados anteriormente continuam dependentes de autenticação normal no GitHub; esta rodada não publicou PR nem realizou merge. Nenhuma tentativa de acesso ao gerenciador de credenciais foi repetida. Deploy online permanece uma etapa posterior.

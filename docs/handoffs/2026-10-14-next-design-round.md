# Retomada do BiblioConnect — nova direção de apresentação

**Status atualizado:** descoberta implementada e marca 02 — Elo escolhida e aplicada em SVG. O usuário priorizou os painéis administrativo e financeiro, agora integrados aos dados reais. Acervo persistente: 22 livros. Consulte `docs/verification/2026-10-14-elo-dashboards.md` para esta etapa e `docs/verification/2026-10-14-discovery-redesign.md` para a anterior. Os registros abaixo preservam a conversa histórica de planejamento, não indicam trabalho ainda pausado.

Pedido de 14/10/2026: guardar estas decisões e abrir somente a versão atual para mostrar aos amigos. Implementação adiada até o usuário voltar após a renovação do limite. Nenhuma destas mudanças foi implementada neste intervalo.

## Decisões para a próxima rodada

- Mover o Atlas/constelação para o topo da página de Catálogo; abaixo, manter a listagem convencional dos livros.
- Na home, implementar a referência Image Stream Hero: https://21st.dev/@ruixen.ui/components/image-stream-hero . Substituir as fotos por capas de livros que realmente existam no catálogo. Dar evidência às capas e permitir a mudança dos livros exibidos.
- Priorizar um público jovem nos destaques da home e na hero: dark romance, títulos populares no TikTok/BookTok e suspense. Pesquisar títulos e popularidade na retomada; cadastrar os livros concretamente no banco existente, com capas corretas. Não inventar números de vendas ou popularidade.
- Manter os clássicos disponíveis e pesquisáveis no catálogo, sem protagonismo nos destaques.
- Preservar os painéis da home de livro mais vendido e tema/gênero mais pedido, com dados reais.
- Todas as propostas anteriores de logo foram rejeitadas, incluindo a BC03 provisória. Pensar em outro estilo na próxima rodada, sem criar logo agora. Esta decisão substitui o registro anterior de escolha provisória.
- Manter funcionalidades, React/Tailwind, Prisma/backend/banco existentes, cores e direção editorial contemporânea. Continuam as escolhas de switch, botão, loading e digitação já implementadas.

## Referências adicionais enviadas pelo usuário — implementar depois

- Home: https://reactbits.dev/animations/scroll-expand , https://reactbits.dev/animations/animated-content , https://reactbits.dev/animations/click-spark e https://reactbits.dev/animations/star-border . O usuário autorizou escolher os melhores encaixes; definir a composição na retomada, mantendo a Image Stream Hero e a direção editorial. Ainda não foram implementadas.
- Navegação: https://reactbits.dev/components/card-nav para mobile e todas as resoluções em que apareça o menu de três riscos. Preservar links, permissões, navegação por teclado e comportamento acessível.
- Dashboard/painel: o usuário considera a aparência atual ruim e quer uma revisão visual mais ambiciosa. Na retomada, pesquisar referências e componentes React/JSX adequados para dashboards; preservar dados reais, permissões e funcionalidades existentes. Nenhuma pesquisa adicional de dashboards ou implementação foi feita agora.
- Respeitar preferência por movimento reduzido, desempenho mobile e leitura das capas ao combinar os efeitos. A localização exata de cada animação ainda será definida na próxima rodada.

## Estado e operação

### Descobertas na retomada de 14/10

- Branch conferida: `codex/biblioconnect-editorial`, alterações pendentes apenas neste handoff. CodeGraph disponível e consultado; Navbar é compartilhada por PublicLayout, ClientLayout e AdminLayout, portanto o Card Nav precisa preservar os três contextos e a composição de links por autenticação.
- Home já seleciona `disponivel` e `destaque` da API: usar esses campos para hero/destaques reais. Atlas existente pode ser reutilizado no catálogo sem alterar os contratos da API.
- Referência recomendada de painel: https://ui.shadcn.com/blocks (dashboard-01); segunda referência para métricas/gráficos: https://www.tremor.so/ . Recharts e GSAP já estão instalados; adaptar a composição ao React/JSX e à identidade existente, evitando importar um template inteiro como dependência.
- Fonte primária para suspense: https://www.editoraarqueiro.com.br/livros/a-empregada/ (Freida McFadden, ISBN 9786555655063) e https://www.record.com.br/products/verity (Colleen Hoover, ISBN 9788501117847). A editora identifica Verity como suspense e informa classificação 18; não classificá-lo automaticamente como dark romance. Complementar pesquisa de dark romance e títulos BookTok antes de cadastrar a seleção final.
- A próxima proposta deve definir os encaixes dos efeitos: Image Stream Hero na abertura, Scroll Expand em vitrine de capas, Animated Content nas entradas de seção, Click Spark em poucas ações de descoberta e Star Border no acesso ao Atlas. Movimento reduzido deve manter todos os conteúdos e controles disponíveis.
- Não houve implementação de produto nem alterações no banco nesta retomada inicial. Falta validar a composição apresentada e então implementar/verificar os fluxos afetados.

- Pasta ativa: `C:/Users/jluca/OneDrive/Documentos/ChatGPT/JãoDev/biblioconnect/.worktrees/biblioconnect-editorial`.
- Branch: `codex/biblioconnect-editorial`; último commit da rodada concluída: `7e30ec9`.
- Versão atual: frontend editorial + backend original + banco local persistente existente, com 12 livros. Não resetar, migrar nem repetir seed para abrir a apresentação.
- Iniciar na pasta ativa: `rtk proxy node .superpowers/start-persistent.mjs > .superpowers/persistent-runtime.log 2>&1`.
- Frontend: http://localhost:5173 ; API: http://localhost:3000 ; socket do banco: 127.0.0.1:55440. O launcher faz backup antes de abrir o banco existente.
- Usar esta versão integrada para demonstrar; não iniciar a antiga demo isolada. Deploy online fica para depois.
- Relatórios existentes: `docs/verification/2026-10-14-atlas-redesign.md` e `docs/verification/2026-10-14-persistent-acervo.md`.
- Referências visuais e quatro imagens: `docs/design-references/2026-10-14/`. O plano anterior de Atlas já foi concluído; não reexecutá-lo. A nova rodada deve considerar as alterações acima.
- Publicação no GitHub continua pendente; não tentar acessar credenciais por scripts. Não é parte da abertura da versão atual.

## Frase de retomada

Retome o BiblioConnect pelo documento `docs/handoffs/2026-10-14-next-design-round.md`. Vamos implementar a nova direção da home e do catálogo e discutir outra logo, preservando o sistema e o banco existentes.

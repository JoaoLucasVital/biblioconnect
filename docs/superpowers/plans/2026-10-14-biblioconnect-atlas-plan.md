# BiblioConnect Atlas — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar a primeira versão editorial em uma biblioteca com Atlas interativo, identidade própria e componentes aprovados, preservando todas as operações e o banco existente.

**Architecture:** A API e os contratos Prisma permanecem existentes. A home consome os livros públicos e os passa a um Atlas React/SVG determinístico, com seleção e busca acessíveis; os fluxos de compra, aluguel e reserva continuam no catálogo. Componentes compartilhados recebem o seletor claro/escuro escolhido, CTA, loading e revelação de texto; administração recebe a organização visual das referências sem novos processos operacionais.

**Tech Stack:** React 19, Tailwind 4, GSAP, SVG, Lucide e a cena Three/R3F já existente. Sem instalação de biblioteca completa por causa de um componente.

**Spec:** [Proposta escrita e referências avaliadas pelo usuário](../../design-references/2026-10-14/README.md). As escolhas explícitas de 14/10 prevalecem sobre candidatos rejeitados. A formalização aqui não muda o escopo aprovado.

**Execução:** Inline, como já escolhido pelo usuário; revisão final independente. A escolha da logo é uma dependência apenas da tarefa 2.

## Global Constraints

- Preservar React, Tailwind, contratos de API, Prisma/schema, permissões, URLs e fluxos existentes.
- Paleta: marinho #1e3a5f, laranja #e67e00, creme #fff7ed; manter tokens de contraste já corrigidos.
- Usar dados reais retornados pela API; imagens de referência não autorizam métricas, pedidos ou pessoas fictícias.
- Banco persistente original já conectado e abastecido; nenhuma migração, reset ou carga automática na inicialização.
- Respeitar teclado, foco, leitores de tela, movimento reduzido e telas pequenas.
- Valor de formulários atualiza imediatamente. Senhas, composição, autofill, seleção e colagem mantêm comportamento nativo.
- Registrar fontes e licenças de componentes efetivamente adaptados. Não usar o botão STORM rejeitado.
- Não realizar deploy, merge ou criar serviços externos nesta rodada.

## Review Focus

1. API vazia, falha ou acervo com um único livro: nenhuma constelação fictícia; manter busca/lista e retry.
2. Centenas de livros ou títulos/autores longos: limites de pontos, rótulos sem sobreposição e contagem correta do conjunto filtrado.
3. Busca com acentos, caracteres compostos, colagem e edição no meio: valor/cursor nativos corretos, nenhuma fila de animação.
4. Alternância de tema antes/depois de recarregar e instâncias responsivas: estado persistido e controle sempre operável por teclado.
5. Dados privados ou estados indisponíveis: Atlas usa somente resposta pública; estoque e ações coerentes com catálogo, sem furar autenticação.

---

### Task 1: Componentes aprovados e movimento compartilhado

**Files:**
- Modify: `frontend/src/components/ThemeToggle.jsx`, `frontend/src/styles/global.css`.
- Create: `frontend/src/components/theme-toggle.css`, `frontend/src/components/ui/InteractiveHoverLink.jsx`, `frontend/src/components/ui/BookLoader.jsx`, `frontend/src/components/ui/book-loader.css`, `frontend/src/components/ui/RevealText.jsx`.
- Modify: `frontend/src/components/ui/StatusMessage.jsx` somente se necessário para o estado de carregamento; não trocar avisos/erros por spinner.
- Test: `frontend/src/components/ui/motion-components.test.jsx`, `frontend/e2e/navigation.spec.js`.
- Attribution: `THIRD_PARTY_NOTICES.md` (ou documento de atribuição existente encontrado no repositório).

**Interfaces:** `ThemeToggle()` mantém localStorage.theme e body.dark; checkbox com role=switch e nome constante `Tema escuro`. `InteractiveHoverLink({to,children,className})` retorna Link com nome acessível único. `BookLoader({label='Carregando acervo…'})` retorna role=status. `RevealText({as='span',children,className})` separa texto visual por caracteres, com texto semântico único.

- [ ] Escrever testes: switch teclado/clique/persistência, link com href correto/nome único, loading com status sem duplicação de leitura, texto acessível íntegro.
- [ ] Rodar `rtk proxy npm --prefix frontend test -- motion-components`; confirmar falha por componentes ainda ausentes.
- [ ] Adaptar o seletor [RiccardoRapelli](https://uiverse.io/RiccardoRapelli/jolly-chicken-91) preservando sol/nuvens/lua/estrelas, isolando IDs/classes, foco visível e alvo mínimo 44px. Desativar ciclos em reduced-motion e aba oculta.
- [ ] Adaptar o [Interactive Hover Button oficial](https://magicui.design/docs/components/interactive-hover-button) para link, com preenchimento/seta e equivalência por focus-visible. Reservar para CTA de descoberta, sem mudar todos os botões operacionais.
- [ ] Adaptar o [loading Nawsome](https://uiverse.io/Nawsome/curly-goose-54) para a paleta; animar somente enquanto montado por requisição real. Sem duração mínima artificial.
- [ ] Implementar RevealText com opacity/transform, duração de 200ms por caractere e stagger limitado a 400ms no total; somente títulos/destaques, sem animação a cada render. Reduzir movimento para estado final estático.
- [ ] Rodar testes focados, lint e build. Registrar licenças MIT/fontes das versões copiadas e adaptar seletores e2e do tema.
- [ ] Commit: `feat: add approved theme switch and motion components`.

### Task 2: Marca selecionada em SVG

**Files:** Modify `frontend/src/components/BrandLogo.jsx`, `frontend/public/favicon.svg`; create `docs/design-references/2026-10-14/brand-selected.md`.

**Interfaces:** `BrandLogo({className})` mantém API/nome BiblioConnect. Favicon tem silhueta reconhecível a 16/24px. O conceito depende da resposta à prancha `logo-concepts.png`.

- [ ] Aguardar escolha entre 01/02/03 já perguntada, sem bloquear outras tarefas independentes após aprovação do plano.
- [ ] Traduzir o conceito escolhido em SVG simples com formas substanciais e contraste claro/escuro, sem inserir a prancha raster no cabeçalho.
- [ ] Registrar prompt/proveniência da prancha e decisões de simplificação. Atualizar DESIGN.md e exigência anterior de preservar a logo, conforme novo pedido.
- [ ] Verificar visualmente cabeçalho e favicon em claro/escuro; não criar teste que apenas espelhe os paths SVG.
- [ ] Commit: `feat: introduce selected BiblioConnect identity`.

### Task 3: Atlas do Acervo e home com presença editorial

**Files:** Create `frontend/src/features/atlas/atlasModel.js`, `AtlasExplorer.jsx`, `AtlasMap.jsx`, `AtlasBookPanel.jsx`, `atlas.css`, `atlas.test.jsx`; modify `frontend/src/pages/Home.jsx`, `frontend/src/features/home/EditorialHero.jsx`, `HomeHighlights.jsx`, `home.test.jsx`; create `frontend/e2e/atlas.spec.js`.

**Interfaces:** `buildAtlas(livros, {query='',category=''}) -> {books,categories,nodes,edges,total,visibleCount}`; livro tem contrato público existente. Ordenação determinística por categoria/título/id. Nó `{id,x,y,livro}` em viewBox 1000x560. Aresta `{source,target,reason:'categoria'|'autor'}` sem dados privados. `AtlasExplorer({livros,loading,error,onRetry})` gerencia busca/categoria/livro selecionado. `AtlasBookPanel({livro})` mostra capa, autor, disponibilidade e Link `/livros`, preservando operações no catálogo.

- [ ] Testar modelo: vazio/um item, acentos em busca, categoria ausente como `Sem categoria`, entrada sem mutação, relações apenas por autor/categoria normalizados, ordem estável independentemente da ordem da API. Centenas de livros: no máximo 48 pontos renderizados, lista/contagem do conjunto completo e aviso explícito de limite.
- [ ] Rodar `rtk proxy npm --prefix frontend test -- atlas`; confirmar falha inicial.
- [ ] Implementar agrupamento determinístico por categoria, livres de dependência de física. Conectar vizinhos de categoria e autores coincidentes com no máximo três ligações por ponto. Não criar pontos para preencher espaço.
- [ ] Implementar mapa SVG com linhas atrás dos pontos e botões HTML sobrepostos; nome acessível por livro, seleção por foco/click sem hover obrigatório. Rótulos espaçados por âncoras de categoria; livros próximos do selecionado ficam discretos.
- [ ] Compor hero marinho de altura generosa com título editorial creme, detalhe laranja, busca e contagem real; mapa protagonista, faixa de capas e painel de livro. Incorporar livro 3D existente como destaque secundário, sem competir com o mapa.
- [ ] Manter lista equivalente alternável e padrão em telas pequenas; lista também é opção em reduced-motion. Sem pan/zoom obrigatório. Filtrar pode limpar seleção inválida, mas nunca roubar foco.
- [ ] Home mantém insights reais e explicação dos fluxos existentes. Loading e erro não mostram `0` como dado já carregado; vazio é estado próprio. Remover composição antiga somente quando a nova estiver conectada.
- [ ] Testar seleção, filtro sem resultados, API indisponível/retry e link para catálogo. E2e com dado da fixture pública: selecionar um livro por teclado abre seus detalhes; lista em 390px sem overflow; reduced-motion sem cenas/ciclos; 1440px com conexões e capa selecionada visíveis.
- [ ] Rodar testes de home/Atlas e build. Comparar visualmente com `challenger-star-atlas.png` e verificar quatro livros do banco existente via navegador, sem mutações de teste nesse banco.
- [ ] Commit: `feat: make the collection atlas the library discovery experience`.

### Task 4: Digitação com fade, sem atrasar a entrada

**Files:** Create `frontend/src/components/ui/FadeInput.jsx`, `fade-input.css`, `fade-input.test.jsx`; modify buscas da home/catálogo e inputs de nome em cadastro/perfil por usos explícitos.

**Interfaces:** `FadeInput(props)` aceita props/ref de input nativo, controlado ou não; mantém event handlers externos. Usos explícitos: type=text/search e nome; nunca password/email/number/date nem textarea nesta rodada.

- [ ] Testar valor imediato com `userEvent.type`, acentos/composição, paste, delete, seleção/edição no meio e input controlado. Animação não emite onChange extra.
- [ ] Rodar teste focado e confirmar falha.
- [ ] Manter input nativo editável, com caret preservado. Durante a janela de 180ms, uma camada espelhada aria-hidden desenha o texto anterior opaco e o novo caractere em fade; só nessa janela a cor dos glifos nativos fica transparente. Ao concluir, restaurar texto nativo e remover a camada. Espelhar tipografia, padding e scroll; se houver divergência, usar imediatamente a apresentação nativa. Não usar contenteditable.
- [ ] Composição, seleção ativa, colagem longa, autofill e edição no meio seguem nativos sem efeito. Cancelar animação anterior ao digitar novamente; nunca enfileirar caracteres. Desativar em reduced-motion/forced-colors.
- [ ] Demonstrar visualmente antes de espalhar pelos usos aprovados; browser check para cursor, acento, teclado e mobile. Testes focados passam.
- [ ] Commit: `feat: add nonblocking character fade to selected inputs`.

### Task 5: Organização administrativa e revisão integrada

**Files:** Modify `frontend/src/layouts/AdminLayout.jsx`, `AdminSidebar.jsx`, `frontend/src/pages/AdminDashboard.jsx`; estilizar telas de acervo/pedidos existentes somente via componentes/layout compartilhados, sem reescrever handlers. Update `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, `docs/verification/2026-10-14-atlas-redesign.md`.

**Interfaces:** AdminSidebar mantém mesmos links/permissões; dashboard mantém GET `/admin/dashboard` e todos os controles existentes. Referências `assigned.png`, `model-pick.png`, `canon.png` orientam densidade, capas, sidebar marinho e hierarquia.

- [ ] Ajustar navegação lateral, resumos e hierarquia de tabelas com cores/tipografia do sistema. Usar somente métricas disponíveis; qualquer fila, classificação Dewey ou atividade fictícia fica excluída.
- [ ] Verificar páginas administrativas em desktop/mobile e claro/escuro; formulários e diálogos mantêm foco e ações. Não efetuar pedidos/reset no banco persistente para testar UI.
- [ ] Rodar `rtk proxy npm --prefix frontend test`, `rtk proxy npm --prefix frontend run lint`, `rtk proxy npm --prefix frontend run build`.
- [ ] Rodar `rtk proxy node scripts/qa-environment.js --integration` e `rtk proxy node scripts/qa-environment.js --e2e-production` em bancos descartáveis separados; confirmar regressões de compra/aluguel/reserva/admin/autenticação ausentes.
- [ ] Revisar telas reais da versão persistente em 390/768/1440px, com teclado e reduced-motion. Salvar screenshots claro/escuro e relatório com comandos/resultados reais, limites e fontes.
- [ ] Uma revisão independente final sobre funcionalidade, dados, acessibilidade, fidelidade às escolhas e movimento. Corrigir itens materiais e repetir só verificações afetadas.
- [ ] Abrir e manter a prévia persistente correta; deixar claro que deploy público e PR continuam etapas posteriores. Commit final somente depois de verificações concluídas.

## Auto-revisão do plano

Cobertura: seleções de componentes (1), logo (2), quatro imagens e Atlas funcional (3/5), digitação (4), banco existente e preservação de operações (restrições/5). Os cinco riscos da seção Review Focus possuem verificações nas tarefas 1/3/4/5. A escolha da logo é a única decisão estética pendente; nenhuma nova regra de negócio ou dependência paga foi introduzida.

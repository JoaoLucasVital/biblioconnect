# BiblioConnect Editorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repaginar todo o frontend original em React e Tailwind, com identidade editorial, GSAP e livro 3D, preservando os fluxos e o banco.

**Architecture:** Migrar por áreas sobre as consultas e os controladores existentes. Compartilhar tokens, componentes acessíveis e layouts; carregar a cena 3D somente na home. Validar alterações de negócio em ambiente temporário separado do banco persistente.

**Tech Stack:** Node.js >=22.12, React 19/JavaScript/JSX, Vite, React Router, Axios, Recharts, Tailwind 4 com `@tailwindcss/vite`, GSAP/`@gsap/react`, Three.js/React Three Fiber. Vitest, Testing Library e Playwright para regressões relevantes. Express, Prisma e PostgreSQL permanecem como estão.

**Spec:** [Desenho aprovado](../specs/2026-10-13-biblioconnect-editorial-design.md).

## Global Constraints

- Base: `biblioconnect` original. Não incorporar automaticamente `biblioconnect-redesign`.
- Preservar todas as 22 rotas explícitas e o fallback da matriz da especificação.
- Preservar Express, Prisma, PostgreSQL, contratos HTTP, `VITE_API_URL`, Bearer token e regras de conta, estoque e pagamento.
- Paleta: `#fff7ed`, `#ffffff`, `#1e293b`, `#64748b`, `#1e3a5f`, `#e67e00`, `#c96a00`, `#fed7aa`, `#ffedd5`.
- Fontes locais: Source Serif 4 e IBM Plex Sans, com fallback e `font-display: swap`.
- Pressão por ponteiro: 120–160 ms; diálogos/menus: 180–240 ms; abertura editorial: 400–600 ms. Não atrasar teclado, digitação ou filtros.
- Manter informações e ações em HTML acessível. Movimento reduzido e telas pequenas usam a alternativa estática do 3D.
- Nenhuma migration, reset ou seed no banco existente. Testes mutáveis nunca usam `.local/database` nem PostgreSQL real.
- Uiverse é fonte de componentes Tailwind locais; código copiado precisa de URL, autor e licença. Manter a mesma identidade entre Uiverse, 21st.dev e React Bits.
- Usar RTK nos comandos, CodeGraph em consultas focadas e token-efficiency. Não reler a mesma fonte atual nem alegar economia não medida.
- Aplicar design-taste/impeccable à composição, emil-design-eng ao acabamento, animate/animation-performance ao movimento e mobile-native/break-ui à adaptação e aos casos extremos.

## Review Focus

1. **Falha de rede após preencher uma operação:** o formulário mantém seus dados e permite tentar novamente. Teste da tarefa 4.
2. **Imagem ausente/quebrada, troca de livro ou WebGL indisponível:** o título correto e as ações continuam disponíveis. Testes das tarefas 2 e 5.
3. **Sem estoque, livro doado ou usuário sem permissão:** a interface não dispara operação proibida e o servidor mantém a autorização. Testes das tarefas 3 e 4; integração na tarefa 8.
4. **Teclado, Escape, foco e confirmação repetida:** navegação e fechamento funcionam; uma confirmação em andamento não cria pedidos duplicados. Testes das tarefas 2 e 4.
5. **Títulos longos e tela de 360 px:** conteúdo e ações permanecem legíveis e alcançáveis, sem rolagem horizontal da página. Verificação de catálogo na tarefa 4 e administração na tarefa 7.

## Preparação e organização

Na execução, aplicar `using-git-worktrees` e criar uma branch `codex/biblioconnect-editorial` em checkout isolado a partir do commit que contém esta especificação e plano. Usar a ferramenta nativa de worktree quando ela resolver este repositório; caso contrário, criar um worktree Git dentro da pasta de trabalho autorizada. A base atual permanece disponível para comparação.

Registrar o CodeGraph no checkout da execução antes de consultá-lo; nesta etapa, o índice existente aponta para a pasta original. `AGENTS.md` e `.gitignore` devem acompanhar o checkout. Novas dependências de produto só são instaladas após revisão deste plano e escolha da execução.

| Unidade | Arquivos principais | Responsabilidade |
| --- | --- | --- |
| QA | `scripts/qa-environment.js`, `frontend/e2e/` | Banco temporário, processos próprios e testes de navegador |
| Base visual | `frontend/src/styles/global.css`, `legacy.css`, `components/ui/` | Tokens, Tailwind e componentes compartilhados |
| Navegação | `AppRoutes.jsx`, `layouts/`, `components/Navbar.jsx` | Layout público, cliente e administrador, mantendo URLs/proteções |
| Catálogo | `pages/Books.jsx`, `features/catalog/` | Visual e diálogos sobre os controladores atuais |
| Home | `pages/Home.jsx`, `features/home/` | Destaques reais, GSAP e cena 3D opcional |
| Cliente e gestão | Páginas existentes | Migrar apresentação sem substituir operações |
| Proveniência | `THIRD_PARTY_NOTICES.md` | Registrar somente código/assets efetivamente incorporados |

## Task 1: Ambiente isolado e cobertura de regressão

**Files:** Create `scripts/qa-environment.js`, `tests/qa-environment.test.js`, `frontend/vitest.config.js`, `frontend/playwright.config.js`, `frontend/src/test/setup.js`, `frontend/src/test/renderWithRouter.jsx`, `frontend/src/test/fixtures.js`, `frontend/src/components/route-access.test.jsx`, `frontend/e2e/baseline.spec.js`, `frontend/e2e/helpers.js`. Modify `frontend/package.json`, `frontend/package-lock.json`, `frontend/eslint.config.js`.

**Interfaces:** `buildQaEnv({apiPort, frontendPort, databasePort, emailDir, jwtSecret}) -> env`; `startQaEnvironment({withFrontend=false}={}) -> Promise<{apiUrl, frontendUrl:string|null, databaseUrl, emailDir, stop}>`; `renderWithRouter(ui, {route='/'}={}) -> RenderResult`. Fixtures exportam `livroDisponivel`, `livroSemEstoque`, `livroDoado` e `livroTituloLongo`. Helpers e2e exportam `loginUi(page,{email,senha})`, `createConfirmedClient({request,emailDir}) -> {usuario,token,email,senha}`, `createBook({request,adminToken,overrides={}}) -> livro`. O harness oferece CLI `--integration`, `--e2e` e `--serve`; a execução e2e fornece `QA_API_URL`, `QA_BASE_URL` e `EMAIL_OUTPUT_DIR` aos testes.

- [ ] Instalar somente ferramentas de teste: Vitest, jsdom, Testing Library React/jest-dom/user-event e Playwright. Se Chromium não estiver instalado para a versão escolhida, executar `rtk proxy npm --prefix frontend exec -- playwright install chromium`. Configurar testes DOM em jsdom e glob de e2e separado; declarar os globais Node somente nos arquivos de configuração/e2e pertinentes. Criar scripts `test`, `test:watch` e `test:e2e` no frontend.
- [ ] Escrever teste inicialmente falho para `buildQaEnv`: mesmo com `DATABASE_URL` externo no ambiente, o resultado usa `127.0.0.1` e `databasePort`; e-mail vai para `emailDir`; chaves de pagamento, Maps e SMTP reais são neutralizadas. Executar `rtk proxy node --test tests/qa-environment.test.js`; a falha inicial deve indicar ausência da implementação, não erro de sintaxe.

```js
test('QA usa exclusivamente os destinos temporários', () => {
  const env = buildQaEnv({apiPort:3001, frontendPort:3377, databasePort:55441,
    emailDir:path.resolve('.local/qa/test/emails'), jwtSecret:'qa-secret-with-at-least-32-characters'});
  assert.equal(new URL(env.DATABASE_URL).hostname, '127.0.0.1');
  assert.equal(new URL(env.DATABASE_URL).port, '55441');
  assert.equal(env.EMAIL_PROVIDER, 'file');
  assert.equal(env.EMAIL_OUTPUT_DIR, path.resolve('.local/qa/test/emails'));
  assert.equal(env.MERCADO_PAGO_ACCESS_TOKEN, '');
});
```

- [ ] Implementar o harness usando PGlite e PGLiteSocketServer já instalados, diretório próprio em `.local/qa/<uuid>` e portas livres com até 3 tentativas se houver colisão. Aplicar as migrations SQL existentes apenas nesse banco novo. Iniciar `server.js` com ambiente explícito: URLs locais, JWT aleatório, `EMAIL_PROVIDER=file`, `ALLOW_PAYMENT_SIMULATION=true`, `DISABLE_DELAY_EMAIL_JOB=true`, administrador de teste `admin@biblioconnect.com`/`admin123`; neutralizar `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`, `GOOGLE_MAPS_API_KEY`, `GOOGLE_BOOKS_API_KEY`, `EMAIL_USER`, `EMAIL_PASS` e `EMAIL_HOST`. Aguardar prontidão HTTP por até 45 segundos; encerrar apenas processos criados pelo harness e fechar socket/banco em `finally`. Limpeza só pode remover o diretório QA próprio após validar que o caminho absoluto está dentro de `.local/qa`.
- [ ] Configurar `--integration` para executar os testes atuais com `API_TEST_URL` e `EMAIL_OUTPUT_DIR` desse ambiente. Em `--e2e`, iniciar Vite sem abrir janela, passar `VITE_API_URL` isolada e executar Playwright. A configuração Playwright recusa executar sem `QA_BASE_URL`/`QA_API_URL` locais fornecidas pelo harness.
- [ ] Criar fixture de livro ID 7, compra R$20, aluguel R$5, 7 dias inclusos, extra R$2/dia e estoque 2, além de variantes indisponível, doado e título longo. `route-access.test.jsx` verifica visitante redirecionado, cliente com acesso negado a admin e estado de autenticação carregando; usar os guards reais com contexto controlado. E2E baseline usa API real isolada para cadastro/confirmação/login, catálogo e acesso administrativo autorizado.
- [ ] Verificar `rtk proxy node --test tests/qa-environment.test.js`, `rtk proxy node scripts/qa-environment.js --integration`, `rtk proxy npm --prefix frontend test` e `rtk proxy node scripts/qa-environment.js --e2e`. Resultado: todos passam; dados do banco persistente não foram utilizados. Registrar baseline visual em 360, 768 e 1440 px e commit apenas dos arquivos desta tarefa.

## Task 2: Tailwind, tokens e componentes compartilhados

**Files:** Modify `frontend/package.json`, `frontend/package-lock.json`, `frontend/vite.config.js`, `frontend/src/styles/global.css`. Create `frontend/src/styles/legacy.css`, `frontend/src/components/ui/{Button,Field,Dialog,BookCover,StatusMessage,StatusBadge}.jsx`, `frontend/src/components/ui/ui.test.jsx`, `THIRD_PARTY_NOTICES.md`.

**Interfaces:** `Button({variant='primary',busy=false,disabled=false,children,...props})`; `Field({id,label,error,hint,children})`; `Dialog({open,title,busy=false,onClose,children,footer})`; `BookCover({livro,className=''})`; `StatusMessage({type,title,children,onRetry})`; `StatusBadge({tone='neutral',children})`. Todos produzem elementos React. `Button` usa `type='button'` por padrão; formulários podem passar `type='submit'`.

- [ ] Escrever testes falhos: botão ocupado não aciona callback; campo expõe label e erro associados; capa quebrada mostra fallback com título; trocar livro após erro tenta a nova imagem; botão de fechar chama `onClose`, mas não enquanto o diálogo está ocupado. Executar `rtk proxy npm --prefix frontend test -- src/components/ui/ui.test.jsx` e verificar falhas de comportamento/ausência dos componentes.

```jsx
it('um botão ocupado não confirma novamente', async () => {
  const confirmar = vi.fn();
  render(<Button busy onClick={confirmar}>Comprar</Button>);
  await userEvent.click(screen.getByRole('button', {name:'Comprar'}));
  expect(confirmar).not.toHaveBeenCalled();
});
```

- [ ] Instalar `tailwindcss`, `@tailwindcss/vite`, `@fontsource/source-serif-4` e `@fontsource/ibm-plex-sans`; registrar plugin junto ao plugin React. Fixar resolução no lockfile sem atualizar dependências não relacionadas.
- [ ] Transferir CSS atual para `legacy.css`; manter `global.css` como ponto de entrada. Importar tema/utilitários Tailwind e CSS legado em camadas, com utilitários acima do legado. Adiar Preflight completo até a tarefa 8 para proteger telas ainda não migradas. Declarar tokens exatos da especificação, curvas e fontes locais, incluindo apenas pesos usados.
- [ ] Implementar componentes sem regras de negócio. `Dialog` usa `<dialog>` nativo, nome acessível, backdrop, botão de fechar e tratamento de `cancel`; o fechamento fica suspenso durante confirmação pendente. `Field` associa os IDs de label/hint/erro ao único controle filho. `BookCover` mantém imagem/fallback por URL, proporção de capa e texto alternativo. Estados e foco de controles são explícitos.
- [ ] Consultar as coleções Uiverse de campos, botões e loaders, escolher peças compatíveis e adaptá-las para esses componentes. Se copiar código, registrar URL específica, autor e licença MIT completa em `THIRD_PARTY_NOTICES.md`. Fazer a mesma atribuição para outras fontes incorporadas; não registrar componentes apenas consultados como se fossem usados.
- [ ] Reexecutar teste da tarefa, lint, build e baseline visual das telas ainda legadas. Resultado: comportamento aprovado, sem regressão de cascata. Commit dos componentes, estilos, dependências e atribuições desta tarefa.

## Task 3: Navegação e layouts por papel

**Files:** Modify `frontend/src/App.jsx`, `frontend/src/components/Navbar.jsx`, `frontend/src/components/{AdminRoute,ProtectedRoute}.jsx`. Create `frontend/src/AppRoutes.jsx`, `frontend/src/layouts/{PublicLayout,ClientLayout,AdminLayout,AdminSidebar}.jsx`, `frontend/src/layouts/nav-items.js`, `frontend/src/layouts/navigation.test.jsx`, `frontend/e2e/navigation.spec.js`.

**Interfaces:** `AppRoutes()` renderiza as rotas sem criar BrowserRouter/AuthProvider; `App` mantém esses providers e renderiza `AppRoutes`. Layouts renderizam `<Outlet>`. `nav-items.js` exporta `publicItems`, `clientItems` e `adminGroups`, com `{label,to}` e grupos `{label,items}`. `Navbar` consome somente o contexto existente e esses itens.

- [ ] Escrever testes falhos para menu público compacto, pedidos/atendimento para cliente, grupos laterais para admin e todos os destinos da matriz. Verificar que `loadingAuth` não mostra conteúdo protegido e que acesso direto de cliente a `/admin` continua negado. Executar o teste de navegação.

```jsx
it('cliente não abre conteúdo administrativo por URL direta', async () => {
  renderWithRouter(<AuthContext.Provider value={{usuario:{role:'CLIENTE'},
    isAuthenticated:true,isAdmin:false,loadingAuth:false}}><AppRoutes /></AuthContext.Provider>,
    {route:'/admin'});
  expect(await screen.findByRole('heading', {name:'Acesso negado'})).toBeVisible();
  expect(screen.queryByRole('navigation', {name:'Administração'})).not.toBeInTheDocument();
});
```

- [ ] Implementar a separação em `AppRoutes` e layouts mantendo lazy imports, Suspense, URLs, parâmetro `:id`, parâmetro `:token` e wildcard. Reutilizar os guards existentes; não criar uma segunda estratégia de autorização.
- [ ] Agrupar sidebar em Visão geral, Acervo, Operações e Gestão, com `aria-label="Administração"` na navegação. Manter todos os links administrativos, inclusive adicionar/editar nas URLs originais. No celular, usar menu com botão, estado expandido anunciado, Escape e retorno de foco. Logout usa o contexto atual e retorna a `/`.
- [ ] Reutilizar marca e componentes da tarefa 2; aplicar os tokens aprovados e tratamento de navegação ativa. Os ajustes visuais dos guards não alteram sua decisão de acesso.
- [ ] Verificar `navigation.test.jsx`, testes de guards e e2e de visitante/cliente/admin, incluindo abrir um endereço protegido diretamente e navegação a 360 px. Resultado: todos os destinos preservados e nenhum conteúdo admin exposto a cliente.
- [ ] Executar lint/build e commit dos arquivos desta tarefa.

## Task 4: Catálogo e diálogos de operação

**Files:** Modify `frontend/src/pages/Books.jsx`. Create `frontend/src/features/catalog/{CatalogFilters,CatalogBookCard,PurchaseDialog,RentalDialog,ReservationDialog}.jsx`, `frontend/src/features/catalog/catalog-flows.test.jsx`, `frontend/e2e/catalog.spec.js`, `frontend/e2e/dialog-accessibility.spec.js`.

**Interfaces:** `CatalogFilters({busca,categoria,tipoFiltro,categorias,onBusca,onCategoria,onTipo,onClear})`; `CatalogBookCard({livro,onComprar,onAlugar,onReservar,onAvaliacoes})`, callbacks recebem `livro`. `PurchaseDialog({livro,modalidadeEntrega,enderecoEntrega,cotacaoEntrega,loadingCotacao,loadingCompra,onModalidadeChange,onEnderecoChange,onCotar,onConfirmar,onClose})`; `RentalDialog({livro,dias,calculo,busy,onDiasChange,onConfirmar,onClose})`; `ReservationDialog({livro,dataRetirada,calculo,busy,onDataChange,onConfirmar,onClose})`. `livro=null` fecha o diálogo.

- [ ] Escrever testes sobre `Books` usando Axios controlado e a fixture da tarefa 1: filtros/limpar; estoque zero sem POST; doado sem reserva; compra entrega sem cotação bloqueada; erro mantendo endereço/dias/data; confirmação repetida com promessa pendente gera somente um POST. Rodar para confirmar que os novos requisitos falham onde o código atual não os atende.

```jsx
it('sem estoque não permite criar compra', async () => {
  api.get.mockResolvedValue({data:[livroSemEstoque]});
  renderWithRouter(<AuthContext.Provider value={{usuario:{id:1},isAuthenticated:true}}>
    <Books /></AuthContext.Provider>);
  await screen.findByText(livroSemEstoque.titulo);
  expect(screen.getByRole('button', {name:'Comprar',exact:true})).toBeDisabled();
  expect(api.post).not.toHaveBeenCalled();
});
```

- [ ] Manter `Books.jsx` como controlador; extrair a apresentação para os componentes acima. Preservar `carregarLivros`, cálculos, filtros e endpoints, evitando reescrever a lógica de negócio. Consultar os trechos omitidos pelo CodeGraph antes de mover código.
- [ ] Implementar cards e filtros Tailwind com a hierarquia aprovada. Todos os metadados atuais continuam acessíveis. Ajustar títulos extensos e mensagens de catálogo vazio/erro, com tentativa novamente.
- [ ] Implementar diálogos com `Dialog`, `Field` e `Button`. Fixar testes de payload: compra retirada `{livroId:7, modalidadeEntrega:'retirada', enderecoEntrega:undefined}`; aluguel de 9 dias `{livroId:7,dias:9}`, valor apresentado R$9; reserva envia a data selecionada em `dataRetirada`. Entrega mantém cotação e endereço; sucesso preserva `/pedido-confirmado/:id`.
- [ ] E2E isolado verifica compra/aluguel/reserva, avaliações, filtros, operação indisponível, foco inicial, Tab/Shift+Tab contidos no diálogo, Escape, retorno ao botão de origem e uma confirmação por interação. Caso de título longo a 360 px exige ações alcançáveis e `document.documentElement.scrollWidth <= innerWidth`.
- [ ] Executar testes de catálogo, e2e, lint e build. Comparar os contratos usados com o original e commit desta tarefa.

## Task 5: Home editorial, GSAP e cena 3D

**Files:** Modify `frontend/src/pages/Home.jsx`, `frontend/package.json`, `frontend/package-lock.json`. Create `frontend/src/features/home/{EditorialHero,HomeHighlights,HomeRankings,BookScene,SceneBoundary}.jsx`, `frontend/src/features/home/useHeroMotion.js`, `frontend/src/features/home/home.test.jsx`, `frontend/e2e/home.spec.js`.

**Interfaces:** `EditorialHero({livro,destaques,selectedIndex,onSelect,accountAction})`, onde `accountAction={label,to}` deriva do papel atual; `HomeHighlights({livros})`; `HomeRankings({insights})`; `BookScene({livro,active,onUnavailable})`, exportação default carregada por `lazy`; `SceneBoundary({fallback,children})`; `useHeroMotion(ref,{enabled}) -> void`.

- [ ] Escrever testes falhos: livros/rankings vêm das respostas reais controladas; CTA muda por papel; lista vazia não inventa livros/vendas; destaque alterna em 6000 ms e pausa em foco/interação/aba oculta/movimento reduzido; falha de WebGL conserva título e acesso ao catálogo.

```jsx
it('sem WebGL o caminho para o catálogo permanece disponível', () => {
  function CenaComFalha() { throw new Error('WebGL indisponível'); }
  render(<SceneBoundary fallback={<a href="/livros">Ver catálogo</a>}>
    <CenaComFalha /></SceneBoundary>);
  expect(screen.getByRole('link', {name:'Ver catálogo'})).toHaveAttribute('href','/livros');
});
```

- [ ] Instalar GSAP/`@gsap/react`, Three.js e uma versão de React Three Fiber compatível com React 19. Manter esses imports fora da entrada e das rotas operacionais; não adicionar Drei sem uma necessidade concreta da cena.
- [ ] Reutilizar a seleção e as consultas existentes da home. `Home` mantém dados e índice selecionado; `EditorialHero` controla o timer de 6000 ms e suas pausas, solicitando a troca por `onSelect`. Compor abertura, destaques e rankings com os componentes acima, usando os controles e CTAs da especificação. Usar `BookCover` quando não houver cena ou capa carregável.
- [ ] Implementar sequência GSAP de 400–600 ms com `useGSAP`, escopo local e limpeza. Texto continua legível para leitores de tela; links funcionam desde o primeiro render. Cancelar timers de troca ao desmontar.
- [ ] Implementar a cena como tarefa delimitada para Astra se esse método for escolhido: somente `BookScene.jsx` e testes/evidências próprios, sem editar controlador/rotas/API. Usar malhas simples de capa, lombada e páginas, textura real quando disponível e luz discreta. Limitar DPR a 1,5; cena inativa não mantém loop contínuo. Em viewport menor que 768 px ou movimento reduzido, a home não monta Canvas. Capa com erro/CORS resulta em alternativa estática, sem tentar contornar a origem.
- [ ] E2E cobre capa ausente, falha de cena, troca de destaque, desmontagem, teclado e fallback móvel. Confirmar que outra rota não requisita o módulo `BookScene`. Executar testes da home, lint/build e revisão visual antes de commit.

## Task 6: Conta, pedidos, comprovante e atendimento do cliente

**Files:** Modify `frontend/src/pages/{Login,Register,ForgotPassword,ResetPassword,MyOrders,OrderSuccess,OrderReceipt,BookReviews,ClientChat}.jsx`. Create `frontend/src/features/account/account-flows.test.jsx`, `frontend/src/features/orders/order-flows.test.jsx`, `frontend/e2e/customer.spec.js`.

**Interfaces:** Estas páginas continuam consumindo `AuthProvider`, Axios e parâmetros atuais. Usam os componentes da tarefa 2 e o layout da tarefa 3; não introduzem novos endpoints, estados de pagamento ou perfis.

- [ ] Escrever regressões para login inválido manter e-mail; cadastro/reenvio/recuperação usar os contratos atuais; pagamento manter pendência até confirmação do servidor; ação indisponível não chamar API; envio de chat pendente não duplicar mensagem. Rodar os casos novos antes de alterar o comportamento necessário.

```jsx
it('falha de login preserva o e-mail para nova tentativa', async () => {
  const login = vi.fn().mockRejectedValue({response:{data:{erro:'Credenciais inválidas'}}});
  renderWithRouter(<AuthContext.Provider value={{isAuthenticated:false,isAdmin:false,
    loadingAuth:false,login}}><Login /></AuthContext.Provider>);
  await userEvent.type(screen.getByLabelText(/e.?mail/i), 'leitor@example.test');
  await userEvent.type(screen.getByLabelText(/^senha$/i), 'SenhaDeTeste123!');
  await userEvent.click(screen.getByRole('button', {name:/entrar/i}));
  expect(await screen.findByText('Credenciais inválidas')).toBeVisible();
  expect(screen.getByLabelText(/e.?mail/i)).toHaveValue('leitor@example.test');
});
```

- [ ] Migrar apresentação das quatro páginas de conta com labels, erro por campo quando já disponível, estados de envio e navegação existentes. Preservar confirmação/reenvio, tokens de reset e retorno esperado após autenticação.
- [ ] Migrar pedidos, confirmação e comprovante, preservando cancelamento/extensão, retomada de checkout, entrega e simulação identificada. Manter impressão legível do comprovante com estilos de impressão específicos documentados.
- [ ] Migrar avaliações e atendimento. Preservar moderação/visibilidade e consultas/envios atuais; manter rascunho ao falhar um envio. Usar alertas e estados acessíveis sem animar cada atualização de mensagem.
- [ ] E2E com API isolada cobre cliente confirmado, recuperação por e-mail local, pedido/checkout demonstrativo, cancelamento permitido, avaliação aguardando moderação, chat e saída da conta. Verificar também resposta 403, pedido inexistente e rede lenta.
- [ ] Executar testes desta tarefa, e2e, lint/build e commit.

## Task 7: Administração e gráficos

**Files:** Modify `frontend/src/pages/{AdminDashboard,AdminBooks,AddBooks,EditBook,AdminUsers,AdminDelays,AdminOrders,AdminFinance,AdminReviews,AdminChat,AdminDeliveries}.jsx`, `frontend/src/components/{IsbnLookup,BookCard,Loading}.jsx` se usados nessas páginas. Create `frontend/src/components/ui/ResponsiveTable.jsx`, `frontend/src/features/admin/admin-flows.test.jsx`, `frontend/e2e/admin.spec.js`.

**Interfaces:** `ResponsiveTable({caption,children})` envolve uma tabela sem reordenar colunas ou substituir ações. Páginas mantêm handlers, payloads, parâmetros e opções existentes; Recharts continua consumindo os mesmos dados. Componentes antigos só são removidos quando nenhum consumidor permanecer.

- [ ] Escrever regressões para opções/status administrativos preservados, confirmar ação com um único envio, cliente sem acesso e erro mantendo formulário de livro. Os testes usam os handlers/API atuais como contrato; copiar seus valores concretos do CodeGraph, sem inventar nomes de status.

```js
test('editar estoque no painel atualiza o catálogo real isolado', async ({page,request}) => {
  const resposta = await request.post(process.env.QA_API_URL+'/login',
    {data:{email:'admin@biblioconnect.com',senha:'admin123'}});
  const {token:adminToken} = await resposta.json();
  const livro = await createBook({request,adminToken});
  await loginUi(page,{email:'admin@biblioconnect.com',senha:'admin123'});
  await page.goto('/editar-livro/'+livro.id);
  await page.getByLabel(/estoque/i).fill('7');
  await page.getByRole('button',{name:/salvar/i}).click();
  await expect.poll(async () => (await (await request.get(
    process.env.QA_API_URL+'/livros/'+livro.id)).json()).estoque).toBe(7);
});
```

- [ ] Migrar cadastro/edição/listagem de livros: manter ISBN, imagem, disponibilidade, doação, preços, estoque e validações. A consulta de ISBN usa resposta controlada nos testes e não exige uma chave real.
- [ ] Migrar dashboard e financeiro, preservando gráficos e indicadores reais; adaptar dimensões dos gráficos ao contêiner, mantendo rótulos legíveis e estados sem dados.
- [ ] Migrar usuários, pedidos, atrasos, entregas, moderação e chat. Usar tabelas com cabeçalhos semânticos e rolagem interna quando necessária. Preservar cada operação de gestão existente; sem dados ou imagens de exemplo em produção.
- [ ] E2E isolado cobre criar/editar livro, alteração de estoque refletida no catálogo, concluir pedido conforme regras, gestão de usuário, moderação e resposta ao cliente. Em 360 px, testar nome/título longos e tabelas; nenhuma ação fica inacessível nem provoca rolagem da página.
- [ ] Executar testes administrativos, integração isolada da tarefa 1, e2e, lint/build, revisão visual e commit.

## Task 8: Retirada do CSS legado e verificação de entrega

**Files:** Modify `frontend/src/styles/global.css`, `frontend/vite.config.js`, `README.md`; remove `frontend/src/styles/legacy.css` quando não houver consumidores. Create `docs/verification/2026-10-13-editorial-redesign.md`, `frontend/e2e/resilience.spec.js`.

**Interfaces:** A interface pública do frontend continua sendo a matriz de rotas e contratos da especificação. O relatório registra comandos, resultados, screenshots, medidas e limites efetivamente verificados.

- [ ] Conferir cobertura da matriz e buscar classes legadas restantes; migrar seus consumidores antes de remover estilos. Importar Tailwind completo com Preflight, manter somente tokens, base necessária, impressão e efeitos específicos documentados em CSS residual.
- [ ] Adicionar casos de navegador para lista vazia, HTTP 500 com tentativa novamente, imagens quebradas, movimento reduzido, falha de WebGL e rascunhos preservados após erro. Usar interceptação apenas nesses casos de falha; operações de negócio da suíte principal continuam na API isolada.

```js
test('catálogo permite tentar novamente após erro HTTP', async ({page}) => {
  await page.route('**/livros', route => route.fulfill({status:500,
    contentType:'application/json',body:JSON.stringify({erro:'Falha de teste'})}));
  await page.goto('/livros');
  const tentar = page.getByRole('button',{name:/tentar novamente/i});
  await expect(tentar).toBeVisible();
  await page.unroute('**/livros');
  await tentar.click();
  await expect(tentar).not.toBeVisible();
  await expect(page.getByRole('heading',{name:/catálogo/i})).toBeVisible();
});
```

- [ ] Rodar testes unitários do frontend, integração isolada, e2e, lint e build. Comandos: `rtk proxy npm --prefix frontend test`; `rtk proxy node scripts/qa-environment.js --integration`; `rtk proxy node scripts/qa-environment.js --e2e`; `rtk proxy npm --prefix frontend run lint`; `rtk proxy npm --prefix frontend run build`. Resultado: zero falhas, nenhuma operação de teste no banco persistente.
- [ ] Inspecionar visualmente 360/768/1440 px, teclado, zoom 200%, comprovante impresso e tempos de interação. Aplicar break-ui aos casos extremos e mobile-native ao toque. Registrar teste em dispositivo físico quando disponível; emulação não conta como evidência física.
- [ ] Comparar tamanhos gerados com CSS 75,58 kB/12,92 kB gzip e entrada JS 277,14 kB/90,40 kB gzip da baseline. Registrar carregamento e responsividade medidos em condições reproduzíveis. Conferir pelo grafo de build/rede que 3D é exclusivo do carregamento sob demanda da home; documentar regressões e corrigi-las quando afetarem uso.
- [ ] Conferir atribuições de todas as fontes copiadas, instruções de instalação/execução e limites das integrações reais. Solicitar revisão independente do conjunto, resolver achados acionáveis e commit final. Declarar explicitamente integrações externas e dispositivos não homologados.

## Execução e revisão do plano

Recomendação: execução direta nesta conversa para a maior parte do trabalho, com Astra em uma tarefa delimitada de cena 3D e revisão final independente. As oito tarefas compartilham componentes e dados; manter a implementação principal no mesmo contexto reduz o número de handoffs. É uma escolha de organização, não uma medição de custo.

Alternativa: execução por subagentes, um implementador e um revisor por tarefa, com responsabilidade explícita por arquivos. Dá mais revisão entre etapas e usa mais contextos separados.

Antes de implementar, o usuário revisa este plano e escolhe o método. Após essa revisão, usar a skill de execução correspondente e manter o método escolhido. A tarefa 5 só deve ser delegada depois de os contratos das tarefas 2–4 estarem disponíveis; preparar contexto mínimo com este plano, seção 4 da especificação e interfaces relevantes.

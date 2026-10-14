# BiblioConnect Account, Community and Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for native execution, or superpowers:subagent-driven-development if the user selects delegation. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar acesso, perfil, favoritos, avaliações, checkout Stripe, frete Maps e aplicação persistente publicada na Vercel, preservando o sistema existente.

**Architecture:** Evolução incremental de React/Vite + Express + Prisma/PostgreSQL. Serviços separados por domínio, sessões revogáveis em cookie, dados/eventos persistidos e integrações reais configuradas antes da validação externa. Vercel Services (beta) com frontend e backend na mesma origem, PostgreSQL hospedado e armazenamento durável; desenvolvimento atual permanece disponível até a troca verificada.

**Tech Stack:** React 19, Tailwind 4, Express 5, Prisma 5, PostgreSQL/PGlite para QA isolado, Google Identity Services/Routes, Stripe Elements/PaymentIntents, MediaPipe, Vercel.

**Spec:** `docs/superpowers/specs/2026-10-14-account-community-checkout-design.md` — aprovada pelo usuário em “pode seguir” após apresentação do arquivo.

## Global Constraints

- Manter React 19, Tailwind 4, Express, Prisma 5 e PostgreSQL, paleta, tipografia editorial, marca Elo e capas WebP já aprovadas.
- Migrações são aditivas e exigem backup e conferência; não resetar o acervo nem repetir seeds sobre o banco do usuário.
- Com lembrar de mim: expiração por inatividade de 90 dias e limite absoluto de 180 dias. Sem lembrar: cookie de sessão do navegador, com limite no servidor de 12 horas.
- Botão **Importar foto**; entrada JPEG/PNG/WebP até 5 MB; resultado WebP transparente, máximo 1024 × 1024 e 2 MB.
- Hold Button: preenchimento durante 1,2 s de pressão contínua. Verde significa ação de prosseguir confirmada, não dinheiro recebido.
- Origem provisória: `Rua José de Alencar, 511, Farol, Maceió - AL, Brasil`. Tarifas existentes: base R$ 5,00 e R$ 2,50/km.
- Nenhuma cobrança, estorno ou salvamento de cartão real será executado como teste automático nesta tarefa.
- Segredos devem ser inseridos nos ambientes locais/deploy, nunca no chat, commits ou frontend.
- Todos os comandos shell começam por `rtk`; consultas de código usam CodeGraph primeiro. Reusar o worktree atual. Não reiniciar o runtime persistente para executar testes: usar o harness isolado.
- Recursos externos: autenticação/configuração ausente bloqueia somente provisionamento e validação que dependam dela; não apresentar fixtures locais como serviço real. Não substituir o gateway escolhido por Shopify nem migrar framework.

## Review Focus

1. Duas abas renovando a mesma sessão não devem invalidar arbitrariamente uma à outra; logout/bloqueio deve impedir uso posterior (task 2).
2. Endereço/conta Google coincidente não pode vincular uma conta sem prova de posse nem trocar o papel do usuário (task 3).
3. Falha, cancelamento ou avatar malformado não deve perder foto anterior nem tornar retrato público (task 5).
4. Dois usuários salvando simultaneamente e um cliente reconectando devem convergir ao total correto sem duplicação (task 6).
5. Retry da compra, eventos de gateway fora de ordem e frete alterado não podem duplicar pedido/pagamento nem corromper estoque/extensão (tasks 8–10).

## Mapa de responsabilidades e ordem

`server.js` continua como integração das rotas atuais; extrair somente os limites necessários em `src/services/` e `src/middleware/`, sem reescrever regras não afetadas. Novos domínios recebem seus próprios testes. Componentes novos ficam em `frontend/src/features/account`, `community`, `checkout` e `components/motion`. `scripts/qa-environment.js` continua sendo a única entrada dos testes de navegador.

Cada task abaixo tem ciclo vermelho → implementação → verde → commit local. No commit usar identidade por comando, sem alterar configuração global. Ler apenas os símbolos necessários antes de cada edição. Review final independente somente se autorizado pelo método escolhido; execução nativa não exige criar subagentes automaticamente.

### Task 1: Ambiente, schema aditivo e infraestrutura de testes

**Files:** modify `prisma/schema.prisma`, `scripts/qa-environment.js`, `.env.example`, `frontend/.env.example`; create `prisma/migrations/20261014000100_account_community_checkout/migration.sql`, `tests/schema-upgrade.test.js`, `tests/helpers/qaClient.js`, `scripts/check-integrations.mjs`, `docs/setup/2026-10-14-services.md`.

**Interfaces:** `checkIntegrations(env)` retorna apenas presença/validação de chaves, nunca valores; `createQaClient(baseUrl)` mantém cookies e CSRF por cliente com `request(path,{method,body,status})`. Testes de banco usam PGlite isolado e comandos sem prepared statements nomeados, não outro PrismaClient sobre o socket vivo do usuário.

- [ ] Escrever teste de migração com dados existentes: preservar IDs, senha, livros, pedidos e pagamentos; `senha` admite null; dois favoritos iguais e identidades `(provider,subject)` duplicadas são rejeitados; pagamentos antigos conservam `gateway='mercadopago'`.
- [ ] Rodar `rtk proxy node --test tests/schema-upgrade.test.js` e confirmar falha pelo schema/índices ausentes.
- [ ] Acrescentar `IdentidadeExterna`, `Sessao`, `DesafioGoogle`, `Favorito`, `EventoFavorito`, `EventoGateway`, `OperacaoIdempotente` e `LimiteOperacao`; `Usuario.avatarKey/stripeCustomerId` opcionais e hashes opcionais para novos tokens de confirmação/reset. Sessão inclui hash atual/anterior, janela anterior, expirações, revogação e atividade. EventoFavorito usa cursor BigInt serializado como string na API. Operação é única por usuário/escopo/chave e contém fingerprint/ID do resultado; EventoGateway é único por gateway/eventId. LimiteOperacao é único por escopo/chave derivada/janela e contém contador/expiração, sem e-mail/IP em claro. Relacionamentos incluem índices e exclusões coerentes.
- [ ] Campos de identidade/perfil não expõem hashes, segredos ou chaves Blob no `/me`. Conservar os campos antigos de Pagamento, que já possui `gateway`; adicionar unicidade apenas após verificar duplicatas históricas, sem descartá-las silenciosamente.
- [ ] Isolar em QA todas as novas variáveis Stripe/Google/Resend/Blob e cookies/origens, herdando nenhuma integração real. Registrar envs exigidas e configurações provisórias do frete. Segredos vazios não significam integração habilitada. Adaptar helper QA sem quebrar a restrição a localhost.
- [ ] Fixar contratos de regressão nos testes: `assert.equal(before.livros.length, after.livros.length)`; `assert.deepEqual(before.pedidos, after.pedidos)`; `await assert.rejects(insertDuplicateFavorite)` ao testar unicidade diretamente no banco. Helpers normalizam datas sem descartar campos de negócio. O endpoint idempotente de salvar continua respondendo sucesso quando a relação já existe.
- [ ] Rodar schema test, `rtk proxy node --test tests/qa-environment.test.js` e validação Prisma com URL exclusivamente de teste; gerar client após schema válido. Commit local desta fundação, sem aplicar no banco pessoal.

### Task 2: Sessões por cookie, CSRF e migração do login

**Files:** create `src/services/authSessionService.js`, `src/services/rateLimitService.js`, `src/middleware/auth.js`, `tests/auth-session.test.js`; modify `server.js`, `frontend/src/api/api.js`, `frontend/src/context/AuthContext.jsx`, `tests/integration.test.js`, `frontend/src/features/account/account-flows.test.jsx` e helpers E2E que autenticam por token.

**Interfaces:** `createSession(prisma,{usuarioId,lembrar,now})`, `resolveSession(prisma,{secret,now})`, `revokeSession(prisma,{secret,now})`; retornam usuário/expirações e segredo somente à camada de cookie. Middleware usa usuário atual, protege origem/CSRF e não libera Bearer legado em produção. `GET /auth/session` → `{usuario,csrfToken}` ou `{usuario:null,csrfToken:null}`; `POST /login` recebe `{email,senha,lembrar}` e emite cookie `bc_session`; `POST /auth/logout` revoga e expira cookie. `/me` mantém o contrato público do usuário.

`consumeRateLimit(prisma,{scope,key,limit,windowMs,now})` retorna `{allowed,retryAfterSeconds}` com contador atômico no banco. Login: 20/15 min por IP e 5/15 min por conta; reenvio/reset: 3/15 min por conta e 20/15 min por IP; challenge Google: 20/15 min por IP; cotação: 30/min por usuário. Derivar chaves por HMAC e não usar IP como identidade. Testar limite e reset da janela; erro 429 inclui Retry-After sem revelar existência da conta.

- [ ] Criar testes de fronteiras temporais (12 h, 90/180 dias), cookie Secure/HttpOnly, CSRF ausente/incorreto, origem estranha, logout, senha redefinida, bloqueio e duas renovações concorrentes. Assertions: sessão revogada retorna null; requisição mutante sem CSRF recebe 403; concorrência não produz duas sessões independentes imprevistas.
- [ ] Assertions mínimas: `assert.equal(await resolveSession(db,{secret,now:afterLogout}),null)`; `assert.equal(withoutCsrf.status,403)`; `assert.equal(shortSession.absoluteExpiresAt-now,12*60*60*1000)`; conferir 90/180 dias também no limite exato, com relógio injetado.
- [ ] Rodar `rtk proxy node --test tests/auth-session.test.js` e confirmar falha antes do serviço.
- [ ] Implementar segredo de 32 bytes, hash SHA256 no banco, expiração e rotação com janela anterior de 30 s; usar transação/compare-and-set na rotação. CSRF derivado de HMAC com segredo do servidor e sessão, comparado com tempo constante. Renovação no máximo diária; atividade no máximo a cada 5 min. Cache de sessão `no-store`. Login JSON exige origem permitida; erros não revelam existência da conta.
- [ ] Adaptar Axios com `withCredentials` e header CSRF nas mutações; AuthContext passa a carregar sessão no bootstrap e nunca grava token de acesso em localStorage. Remover dados de login legados na transição. Logout só anuncia revogação depois da resposta; manter feedback de falha. Atualizar testes para cookies reais, sem bypass de produção.
- [ ] Rodar teste focado, testes de account React e `rtk proxy node scripts/qa-environment.js --integration`. Commit.

### Task 3: Identidade Google e vínculo seguro

**Files:** create `src/services/googleIdentityService.js`, `src/routes/googleAuthRoutes.js`, `tests/google-identity.test.js`, `frontend/src/features/account/GoogleSignIn.jsx`; modify `server.js`, AuthContext e env templates.

**Interfaces:** `verifyGoogleCredential(credential,{clientId,nonce})` valida via biblioteca oficial; `resolveGoogleIdentity(prisma,{claims,authenticatedUserId})` → `{usuario,needsEmailConfirmation,needsAccountLink}`. `GET /auth/config` expõe só `googleClientId`/habilitação pública; `POST /auth/google/challenge` cria desafio de 10 min ligado a cookie temporário; `POST /auth/google` consome uma vez o desafio e emite sessão da task 2.

- [ ] Testes: assinatura/issuer/audience/nonce inválidos, replay, conta nova CLIENTE, bloqueio, `@gmail.com`, Workspace verificado, endereço de terceiro e e-mail já cadastrado sem sessão. Assertions: tentativa de vínculo sem prova não altera identidade/usuário; `role:ADMIN` do cliente nunca é aceito; login seguinte não sobrescreve nome editado.
- [ ] Assertions mínimas: `assert.equal(created.usuario.role,'CLIENTE')`; `assert.equal(collision.needsAccountLink,true)`; `assert.equal(replay.status,401)`; `assert.deepEqual(await existingIdentity(),identityBeforeAttempt)` após tentativa inválida.
- [ ] Rodar `rtk proxy node --test tests/google-identity.test.js`, confirmar falha, implementar serviço/rotas com verificação oficial e testes por dependência injetada. Instalar SDK do provedor somente após fluxo real de configuração disponível; não criar credencial falsa para habilitar botão.
- [ ] GoogleSignIn usa GIS e nonce do backend, trata cancelamento/erro e aparece em login/cadastro. Conta com perfil incompleto entra e completa endereço antes da entrega. Desabilitar com mensagem clara quando Google não está configurado.
- [ ] Validar testes focados e, com cliente OAuth do usuário configurado, login real em origem permitida. Registrar resultado real separadamente; commit não declara OAuth real validado sem essa evidência.

### Task 4: E-mail transacional, confirmação e aparência A + B

**Files:** modify `src/services/emailService.js`, `server.js`, `scripts/email-check.js`, `frontend/src/pages/Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`; create `src/services/accountTokenService.js`, `tests/account-token.test.js`, `tests/email-provider.test.js`, `frontend/src/features/account/AuthShell.jsx`, `auth-shell.css`.

**Interfaces:** `issueAccountToken(prisma,{usuarioId,purpose,now})`, `consumeAccountToken(prisma,{token,purpose,now})`; confirmação 24 h, reset 30 minutos como no código atual conferido. `enviarEmailHtml({to,subject,html})` preserva assinatura; provider `resend` usa API HTTP, `smtp/gmail` mantém suporte e `file` é proibido em produção. Configuração de remetente fica no backend. Usa rateLimitService da task 2.

- [ ] Testes para uso único concorrente, expirado, hash no banco, limite de reenvio e erros genéricos; provedor real não configurado/falha não retorna sucesso falso. E-mails antigos não expirados continuam consumíveis pelo fluxo de transição por prazo limitado, sem confirmar todo usuário.
- [ ] Assertions mínimas: `assert.equal(consumed.filter(Boolean).length,1)` para dois consumos simultâneos; `assert.notEqual(storedHash,rawToken)`; `assert.equal(expired.status,400)`; `assert.equal(fileProviderInProduction.ok,false)`.
- [ ] Rodar `rtk proxy node --test tests/account-token.test.js tests/email-provider.test.js`, confirmar falhas e implementar. Separar rate limit persistente por operação/conta e proteção de origem; não registrar tokens nem dados privados nos logs. Conservar templates/regras de notificação de pedidos e aluguel.
- [ ] AuthShell combina layout A e controles B, logo Elo, capas reais e temas atuais; não usa estatísticas de recrutamento. “Lembrar de mim” liga à task 2, Google à task 3. Preservar campos, erros, recuperação e reenvio. Verificação acessível desktop/mobile e colagem/autofill.
- [ ] Rodar backend focado, `rtk npm --prefix frontend test -- src/features/account/account-flows.test.jsx` e integração isolada. Com provedor configurado e destinatário próprio autorizado, testar recebimento/consumo real. Não confundir aceitação SMTP/API com recebimento. Commit.

### Task 5: Perfil, cartão e imagem com fundo removido

**Files:** create `src/services/profileService.js`, `src/services/profileImageService.js`, `src/services/mediaStorage.js`, `src/routes/profileRoutes.js`, `tests/profile.test.js`, `frontend/src/pages/Profile.jsx`, `frontend/src/features/account/ProfileCard.jsx`, `ProfilePhotoEditor.jsx`, `photo-processing.worker.js`, `profile-card.css`, `profile.test.jsx`; modify `routes.js`, `Navbar.jsx`, `layouts/nav-items.js`, AuthContext.

**Interfaces:** `GET /me` inclui nome/endereço editáveis e `avatarUrl` autenticada; `PATCH /me` aceita somente nome/telefone/campos de endereço existentes; `POST /me/foto` recebe resultado processado, `DELETE /me/foto` remove vínculo próprio e `GET /me/foto` lê avatar privado. `saveAvatar({usuarioId,bytes})` e `readAvatar({key})` escolhem disco local/Blob privado por configuração. `processPortrait(file,{crop})` retorna Blob WebP e prévia; falhas nunca alteram foto salva.

- [ ] Testes: perfil alheio/campo role, imagem falsa, pixel bomb, formato inválido, resultado >2 MB, cancelamento, falha no upload, substituição e leitura de foto sem autorização. Assertions: arquivo anterior permanece após falha; visitante não lê retrato; sem metadados EXIF no resultado salvo.
- [ ] Assertions mínimas: `assert.equal(forbiddenPatch.status,400)`; `assert.equal(anonymousPhoto.status,401)`; `assert.equal(afterFailedUpload.avatarKey,before.avatarKey)`; `expect(screen.getByRole('button',{name:'Importar foto'})).toBeVisible()`.
- [ ] Rodar `rtk proxy node --test tests/profile.test.js` e teste React focado, confirmar falhas. Implementar allowlist de campos e reencodificação de imagem no servidor; dependência necessária de imagem verificada na instalação. Entradas finais <=2 MB ficam abaixo do limite HTTP Vercel; foto original de 5 MB é processada no navegador.
- [ ] Conferir licença, fixar modelo/pacote MediaPipe e carregar somente na edição; worker faz segmentação, sugere enquadramento e recorte, preserva transparência. Preview permite zoom/posição e retry; manter foto anterior até persistência confirmada. Nenhum envio a removedor externo.
- [ ] ProfileCard adapta referência React Bits com brilho/tilt contidos, nome e ID; formulário ao lado, e-mail somente leitura nesta entrega. Botão U1 próprio com texto **Importar foto**, ícone, progresso e erro. Perfil inclui área de salvos consumida na task 6.
- [ ] Testar fotos de diferentes iluminação/enquadramento, sem rosto e celular lento; movimento reduzido, teclado e temas. Rodar testes focados e integração de perfil real isolada. Commit e evidência visual sem retratos pessoais em arquivos públicos.

### Task 6: Favoritos persistentes e SSE entre sessões

**Files:** create `src/services/favoritesService.js`, `src/routes/favoritesRoutes.js`, `tests/favorites.test.js`, `frontend/src/features/community/PulseHeart.jsx`, `useFavorites.js`, `favorites.test.jsx`; modify `CatalogBookCard.jsx`, `Home.jsx`/vitrines com ações, Profile e server.

**Interfaces:** `PUT /livros/:id/salvo` recebe `{salvo:boolean}`; `GET /livros/salvos/resumo?ids=...` → `{itens:[{livroId,total,salvo}],cursor}`; `GET /me/salvos?page=...` privado; `GET /livros/salvos/eventos?cursor=...&ids=...` SSE público apenas agregado. `setSaved(prisma,{usuarioId,livroId,salvo})` → `{livroId,total,salvo,cursor}`.

- [ ] Testes: repetir salvar/remover, dois usuários simultâneos, visitante, livro indisponível/removido, cursor antigo e reconexão. Assertions: uma relação por par, total igual a COUNT real, evento durável só quando muda estado, nenhuma identidade vazada.
- [ ] Assertions mínimas: `assert.equal(await countFavorites(userId,bookId),1)` após duas gravações de true; `assert.equal(summary.total,2)` após dois usuários; `assert.equal(eventPayload.usuarioId,undefined)`; testar convergência após cursor perdido em duas conexões reais do harness.
- [ ] Rodar `rtk proxy node --test tests/favorites.test.js`, confirmar falha. Implementar transação com serialização por livro e evento BigInt. SSE lê eventos persistidos a cada 1 s, heartbeat 15 s, fecha em 45 s para reconectar; cursor como string, lista limitada a 50 IDs. Fila/eventos retidos 24 h; cursor fora da janela força snapshot atual. Nunca depender só de memória de instância.
- [ ] Hook compartilha uma conexão por aplicação/lista visível, atualiza snapshots na reconexão, desfaz otimização em erro e exige login para salvar. Pulse Heart mantém contador e `aria-pressed`, botão separado do link da capa. Perfil lista os salvos reais.
- [ ] Verificar duas sessões abertas com mudança em até 2 s em condição normal, reload, desconexão, retry e concorrência em QA isolado. Rodar testes React/favoritos e integração; commit.

### Task 7: Peek Rating, Hold Button e motion global

**Files:** create `frontend/src/features/community/PeekRating.jsx`, `frontend/src/components/ui/HoldButton.jsx`, `frontend/src/components/motion/GlobalClickSpark.jsx`, `motion.css`, testes correspondentes; modify `BookReviews.jsx`, `PurchaseDialog.jsx`, `App.jsx`, `DiscoveryMotion.jsx`, `ImageStreamHero.jsx`, `Field.jsx`, `FadeInput.jsx` e formulários nativos afetados.

**Interfaces:** `PeekRating({value,onChange,disabled,label})`, `HoldButton({onConfirm,disabled,busy,children,holdDurationMs=1200})`, `GlobalClickSpark()` via portal decorativo; Field adapta efeito de digitação sem duplicar FadeInput já existente.

- [ ] Testes: nota 1–5 por teclado e moderação preservada; hold completa uma vez em 1200 ms, soltar/pointercancel/blur/desmontar cancela, disabled não dispara; alternativa acessível aciona confirmação explícita. Partículas não bloqueiam click/foco, não duplicam na hero e respeitam reduced-motion. Valor do input recebe imediatamente digitação, paste, autofill e IME.
- [ ] Assertions mínimas com timers falsos: `expect(onConfirm).not.toHaveBeenCalled()` em 1199 ms; `expect(onConfirm).toHaveBeenCalledTimes(1)` após 1200 ms; após cancelamento, avançar timers mantém zero chamadas. Para digitação: `expect(input).toHaveValue('texto colado')` antes de qualquer avanço de animação.
- [ ] Rodar testes focados antes das implementações e conferir falhas; criar componentes adaptados às referências exatas e registrar licenças/atribuições. Só animar efeitos visuais, sem atraso real na edição ou na lógica.
- [ ] Aplicar Hold Button na confirmação de compra após modalidade/frete válidos; confirmação verde só significa prosseguir. Avaliação continua enviando ao endpoint/moderação existente. Overlay global captura cliques da aplicação/portais com 8 partículas por explosão, máximo 32 nós simultâneos e limpeza das animações; nunca tenta ler iframe externo.
- [ ] Rodar testes React afetados, lint, build e E2E de home/catálogo/avaliação. Registrar desktop/mobile e reduced-motion. Commit.

### Task 8: Google Routes e integridade do frete

**Files:** modify `src/services/deliveryService.js`, rotas de cotação/compra em `server.js`, `Books.jsx`, `PurchaseDialog.jsx`, `.env.example`; create `tests/delivery.test.js`, adicionar cenários em catalog-flows/E2E.

**Interfaces:** manter `calcularCotacaoEntrega(destino)` e resposta `{origem,destino,distanciaKm,duracao,valorEntrega}`. Requisição usa chave exclusivamente no servidor e field mask de distância/duração. Origem/tarifas são as Global Constraints.

- [ ] Testes: 2500 m gera R$ 11,25; retirada gera zero; tarifa negativa/NaN, endereço vazio, timeout, 403/cota, rota ausente e resposta inválida falham claramente. Modificar o endereço invalida prévia; preço/frete injetado no payload não prevalece sobre recálculo do servidor.
- [ ] Assertions mínimas: `assert.equal(quote.valorEntrega,11.25)` para resposta de 2500 m com tarifas padrão; `assert.equal(pickup.valorEntrega,0)`; `expect(screen.queryByText('Distância: 2.5 km')).not.toBeInTheDocument()` após mudar destino.
- [ ] Rodar `rtk proxy node --test tests/delivery.test.js`, confirmar falhas e implementar validação/sanitização de erros, rate limit autenticado e invalidação da prévia. Não inventar resultado se Google falhar.
- [ ] Após o usuário configurar Google Cloud/Routes/faturamento e chave restrita, guardar em ambiente backend e testar rota entre origem pública e destino público em Maceió. Não usar endereço pessoal em evidências. Registrar Google real separado de fixtures unitárias.
- [ ] Rodar testes focados e E2E entrega/retirada. Commit.

### Task 9: Checkout Stripe, idempotência e webhook

**Files:** create `src/services/stripeService.js`, `src/services/stripeWebhook.js`, `src/services/idempotencyService.js`, `src/routes/stripeRoutes.js`, `tests/stripe-payment.test.js`, `tests/idempotency.test.js`; modify server, `orderService.js`, `paymentWebhook.js` somente para extrair efeitos compartilhados necessários, schema caso ajuste justificado.

**Interfaces:** `createStripePayment(prisma,{pedidoId,usuarioId,metodo,salvarCartao,requestKey})` → `{pagamentoId,clientSecret,metodo}`; `POST /pedidos/:id/pagamento` inicia/reusa pagamento Stripe; `POST /webhooks/stripe` corpo bruto assinado; `applyStripeEvent(prisma,event)` → `{changed,pedidoId,status}`. Operações de criar pedido recebem header `Idempotency-Key` com fingerprint de livro/tipo/modalidade/endereço; mesma chave/corpo retorna mesmo pedido, corpo diferente dá 409.

- [ ] Testes: valor/moeda/dono divergente, pedido pago, retry após falha de rede, duas solicitações paralelas, assinatura falsa, evento duplicado/fora de ordem, extensão aplicada uma vez e aprovação tardia de pedido cancelado. Assertions: um pedido por chave, uma baixa de estoque, um efeito por evento e nenhuma aprovação por redirect.
- [ ] Assertions mínimas: `assert.equal(firstOrder.id,retryOrder.id)`; `assert.equal(stockBefore-stockAfter,1)`; `assert.equal(secondWebhook.changed,false)`; `assert.equal(await paymentStatusAfterRedirect(),'pendente')`; e 409 para mesma chave com fingerprint diferente.
- [ ] Rodar `rtk proxy node --test tests/stripe-payment.test.js tests/idempotency.test.js`, confirmar falhas. Providenciar integração Stripe real/sandbox antes de instalar SDK e construir contrato do provedor; se a conta está ausente, continuar apenas tasks independentes. Usuário escolheu Stripe, portanto não substituir por provedor de catálogo.
- [ ] Implementar PaymentIntents de card/Pix, valor em centavos e chave idempotente estável do pagamento local. Atualização do banco em transações curtas; não manter row lock durante chamada externa. Registrar intenção antes da chamada e recuperar resultado pela mesma chave após retry. Preservar gateway histórico e conciliação Mercado Pago existente.
- [ ] Webhook usa raw body antes de JSON, SDK oficial/segredo, unicidade de evento e efeitos compartilhados de pedido/extensão. Pagamento/cancelamento concorrentes são serializados. Salvar cartão exige checkbox afirmativo e referências Stripe pertencentes ao usuário; nunca registrar CVV/PAN.
- [ ] Rodar testes focados, regras existentes de negócio e integração QA. Com Stripe sandbox configurado, verificar webhook verdadeiro/replay sem cobrar cartão real. Commit com evidências do ambiente.

### Task 10: Formulário de pagamento e cartão com flip

**Files:** create `frontend/src/features/checkout/CheckoutPanel.jsx`, `CardPreview.jsx`, `PixPayment.jsx`, `checkout.css`, `checkout.test.jsx`; modify `OrderSuccess.jsx`, `MyOrders.jsx`, rotas/fluxos que iniciam pagamento e confirmação de compra.

**Interfaces:** CheckoutPanel consome resultado task 9; Stripe Elements separados capturam número/validade/CVC. Preview recebe só nome, bandeira, estado de foco/completude e máscara; Pix recebe QR/código/expiração retornados pelo provedor. Não ler valores secretos dos iframes. Compra gera/reusa chave por tentativa deliberada e só troca após resultado/abertura de nova compra.

- [ ] Testes: foco no CVC vira cartão, blur retorna, reduced-motion troca discretamente; salvar cartão começa desmarcado; Pix copia código real/mostra expiração; falha/retry não cria cobrança duplicada; sair e voltar retoma cobrança pendente; autenticação adicional, recusa e estado pago vindos do backend são distintos.
- [ ] Assertions mínimas: `expect(saveCard).not.toBeChecked()`; `expect(card).toHaveAttribute('data-side','back')` no foco do CVC; `expect(await clipboard.readText()).toBe(providerPixCode)`; `expect(paymentRequest).toHaveBeenCalledTimes(1)` durante estado ocupado.
- [ ] Rodar teste React focado e confirmar falhas; implementar com SDK frontend após task 9/conta configurada. O giro usa eventos oficiais dos Elements, não inputs HTML locais que capturem PAN/CVV. Manter alternativas de teclado e estados acessíveis.
- [ ] Proteger client secret contra logs/URL/cache e mostrar resumo consistente de preço/frete. Esperar confirmação do backend após sucesso do provedor; não inferir pago pelo Hold Button.
- [ ] Rodar E2E de checkout em sandbox, compra/aluguel/reserva/extensão e administração financeira. Não realizar compra/estorno live. Commit.

### Task 11: Vercel, armazenamento durável e adaptação do servidor

**Files:** modify `server.js`, `package.json`, env templates, upload em AddBooks/EditBook; create `src/app.js` ou export equivalente mínimo, `src/services/runtimeJobs.js`, `src/routes/mediaRoutes.js`, `vercel.ts`, `.vercelignore`, `tests/deployment-config.test.js`, `scripts/migrate-hosted-data.mjs`, `docs/setup/vercel.md`.

**Interfaces:** aplicação Express exportável sem `listen`/intervalo em import; start local mantém servidor atual. Vercel Services usa `frontend.root='frontend'` e `backend.root='.'`, entrypoint Express exportado em `src/app.js`. Rewrite público específico `/api` e `/api/(.*)` vai ao backend; rewrite interno do backend remove `/api`, preservando as rotas existentes. Catch-all público vai ao frontend, com SPA rewrite interno para index.html e VITE_API_URL `/api`. Conferir suporte do tipo/config da CLI instalada e teste dos caminhos antes de deploy, sem presumir que o prefixo é removido automaticamente. MediaStorage da task 5 usa Blob privado para retratos e público para capas. `POST /media/book-upload-token` somente admin emite upload temporário restrito; finalize valida propriedade/conteúdo e converte antes de publicar capa. Mantém o limite atual de imagem de livro de 5 MB sem passar arquivo grande pelo limite HTTP de Functions.

- [ ] Testes: importar app não abre porta/job, URLs frontend/API corretas, SPA deep link, segredo não aparece em bundle, job exige segredo próprio, dados/pedidos preservados na migração, variante de capa servida após URL hospedada e upload de livro >4,5 MB segue por upload direto validado.
- [ ] Assertions mínimas: `assert.equal(listenSpy.mock.callCount(),0)` ao importar a aplicação; `/api/livros` retorna JSON e `/perfil` retorna a SPA; `assert.equal(unauthedCron.status,401)`; `assert.deepEqual(sourceCounts,targetCounts)` e checksums de mídia iguais após migração.
- [ ] Rodar `rtk proxy node --test tests/deployment-config.test.js`, confirmar falhas e implementar adaptadores mínimos. Cron protegido executa lembretes/limpeza idempotentes; não depender de setInterval para deploy.
- [ ] Autenticar Vercel pelo usuário; conferir `project inspect --non-interactive`, owner/projeto e listar projetos antes de escolher/criar. Seguir discovery/provisionamento atual de Neon/Blob/e-mail/Stripe e termos humanos quando necessários; não aceitar contratos ou plano pago automaticamente. Não usar credencial sugerida como já conectada.
- [ ] Após ligação e envs reais verificados por nomes, preparar ambiente hospedado; só então migrar nele. Banco/local atual continuam separados. Transferir cópia validada dos dados e uploads com backup, dry-run, allowlist de destino, contagens, relacionamentos, sequências e checksums. Backups privados fora do Git. Não sobrescrever banco remoto não vazio sem conferir sua origem.
- [ ] Configurar URLs OAuth, confirmação e webhook, CORS/CSP, cookies e regiões; retirar simulações. Resolver acesso administrativo público sem manter senha conhecida de demo e sem redefinir senha pessoal silenciosamente. Build/deploy preview primeiro; commit.

### Task 12: Aplicação local persistente, revisão e publicação final

**Files:** modify `THIRD_PARTY_NOTICES.md`, handoff; create `docs/verification/2026-10-14-account-community-checkout.md` e evidências em `docs/design-references/2026-10-14/` sem dados pessoais.

**Interfaces:** nenhuma nova; usa resultados das tasks anteriores. Entrega URL integrada acessível e registro do que foi validado localmente, sandbox e produção.

- [ ] Rodar `rtk npm test` no backend, `rtk npm --prefix frontend test`, `rtk npm --prefix frontend run lint`, `rtk npm --prefix frontend run build`, `rtk proxy node scripts/qa-environment.js --integration` e regressão E2E completa pelo harness. Corrigir falhas antes da troca persistente.
- [ ] Backup do banco real e uploads; parada controlada dos processos próprios, aplicação aditiva em acesso exclusivo e client atualizado; reabrir frontend/API/banco existentes com mesma base. Não abrir diretório PGlite vivo nem rodar segundo PrismaClient com statements nomeados no socket compartilhado. Comparar IDs/estoque/histórico após mudança; testar login do usuário sem redefinir sua senha.
- [ ] Conferir desktop/mobile, temas, motion, Google/e-mail reais configurados, favoritos em duas sessões, perfil/importação, frete real e cartão/Pix sandbox com webhooks. Registrar bloqueios por configuração de forma explícita; não chamar integração completa se faltam credenciais/recebimento.
- [ ] Revisar diff, permissões, segredos e licenças; review independente somente conforme método autorizado. `git diff --check` limpo. Commit local dos resultados; publicar somente a versão aprovada/testada, sem compras live como teste.
- [ ] Deploy final Vercel solicitado pelo usuário, conferir health/API/banco/capas/sessões/links diretos/retomada de pagamento e execução dos jobs. Mostrar URL e manter navegador aberto na versão integrada final; preservar rollback. Relatório final lista resultados e limites concretos, sem promessa de segurança absoluta.

## Preparação concluída / dependências externas

- [x] Especificação escrita aprovada; A + B e U1 escolhidos, endereço provisório conferido e Maps incluído.
- [x] Repositório e fluxos atuais inspecionados via CodeGraph; worktree atual limpo na entrada desta etapa.
- [x] CLI oficial consultada no npm: Vercel 64.1.0, executável via `rtk proxy npx --yes vercel@64.1.0` sem instalação global/dependência do app.
- [x] Comandos de categories/discover tentados; CLI iniciou login por ausência de credenciais inclusive no modo não interativo. Fluxos interrompidos; nenhum projeto/recurso foi criado. Ajuda da CLI confirma os comandos e flags. Não repetir descoberta até autenticação deliberada do usuário.
- [ ] Usuário autentica Vercel e configura Google Cloud; confirmar estado atual de Stripe/provedor de e-mail/recursos antes de provisionar. Google Cloud exige projeto, Routes API, faturamento e cliente web de login distintos da API key Maps.
- [ ] Revisão deste plano e escolha do método de execução. Recomendação: **nativa, nesta conversa**, por economia de contexto e dependência sequencial entre sessão, perfil, pagamento e deploy. Não disparar subagentes sem a escolha correspondente.

## Auto-revisão do plano

Cobertura da especificação conferida: identidade/sessão/e-mail (2–4), perfil/imagens (5), favoritos/avaliações/motion (6–7), frete (8), pagamentos (9–10), dados/deploy (11–12). Contratos e nomes compartilhados estão definidos nas Interfaces; os cinco pontos de Review Focus têm testes nas tasks indicadas. A configuração externa não foi tratada como pronta nem substituída por simulação. Revisão do usuário ainda pendente; nenhuma task de produto foi iniciada.

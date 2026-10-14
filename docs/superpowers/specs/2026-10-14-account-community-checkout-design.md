# BiblioConnect — conta, comunidade, frete e checkout

Data: 14/10/2026. Estado: especificação escrita para revisão; implementação ainda não iniciada. Base local: branch `codex/biblioconnect-editorial`, commit de pesquisa `ec3de1b`.

## 1. Resultado esperado e escolhas confirmadas

O usuário quer evoluir o projeto real para a apresentação, preservando os fluxos e dados existentes, com acesso Google, perfil editável, favoritos compartilhados em tempo real, avaliação animada, checkout Stripe, entrega calculada pelo Google e deploy integrado na Vercel. Não basta uma demonstração visual ou marcar serviços simulados como funcionando.

Na mensagem mais recente, aprovou combinar as duas referências de autenticação com o formulário atual: composição dividida de Mudit Goel/21st e campos/controles compactos de Micael Tavares/Uiverse. Escolheu U1, botão minimalista com ícone e texto exato **Importar foto**. Também incluiu Google Maps para frete. As referências e suas capturas estão em `docs/design-references/2026-10-14/account-checkout-shortlist.md`.

Usar provisoriamente a unidade **UNINASSAU Farol, Rua José de Alencar, 511, Farol, Maceió–AL, Brasil** como origem. É uma escolha operacional provisória a partir de “UNINASSAU Maceió”; deve ser fácil trocar sem alterar código. Endereço conferido em [página oficial](https://clinicaescola.uninassau.edu.br/campus/maceio/). O usuário informou que ainda precisa configurar o Google Cloud. Não foi fornecida uma API key.

Manter React 19, Tailwind 4, Express, Prisma 5 e PostgreSQL, paleta, tipografia editorial, marca Elo e capas WebP já aprovadas. Manter permissões administrativas, compras, reservas, aluguel/extensão, estoque, entrega, moderação, chat, relatórios e histórico financeiro. Migrações são aditivas e exigem backup e conferência; não resetar o acervo nem repetir seeds sobre o banco do usuário.

## 2. Situação conferida e estratégia

O backend atual usa `server.js`, JWT Bearer e `AuthContext.jsx` com token em localStorage. `Usuario` já tem nome, telefone, endereço estruturado e confirmação de e-mail, mas não identidade Google, sessão revogável, foto ou favoritos. Avaliações já têm nota, comentário, moderação e unicidade usuário/livro. Reutilizar essas regras.

`deliveryService.js` já chama `routes.googleapis.com/directions/v2:computeRoutes`, com distância/duração e frete base + km; `/comprar` recalcula o frete no backend. Pagamentos atuais usam Mercado Pago, com assinatura de webhook, transação e regras de estoque que devem ser preservadas. O runtime persistente consulta mostrou `googleMaps:false`, `mercadoPago:false` e simulação ativa; e-mail configurado corresponde à caixa local de arquivos, não entrega externa comprovada. Não foram encontradas configurações `.env` operacionais nos destinos verificados; não foram exibidos segredos.

Alternativas consideradas: reescrever o backend/framework; publicar somente frontend e manter API local; evoluir a aplicação existente e hospedar frontend/API com persistência externa. A última é a escolhida: atende o pedido de manter tecnologias e evita uma demonstração que depende do computador local. Preferir frontend e API sob a mesma origem no deploy para simplificar cookies, OAuth e proteção contra CSRF.

Organizar a execução em quatro entregas com testes próprios: (1) identidade, sessão e e-mail; (2) perfil e comunidade; (3) checkout e frete; (4) persistência hospedada e deploy. Consolidar cada entrega antes da próxima. Não alterar código de produto antes da revisão desta especificação e do plano de implementação exigidos pelo workflow ativo.

## 3. Login, cadastro e sessão

### Aparência

Login/cadastro compartilham uma composição editorial responsiva. No desktop, capas reais e texto curto ao lado do formulário; no mobile, o formulário tem prioridade. Manter todos os campos/validações úteis do cadastro existente. Campo de senha com controle de visibilidade, recuperação, reenvio de confirmação, erros e estados de envio claros. A marca atual substitui qualquer “BC” provisório ou marca do template. Não importar as estatísticas fictícias ou fotos corporativas das referências.

Google aparece em login e cadastro; o mesmo fluxo serve para entrar ou criar uma conta. Usar Google Identity Services e apresentação compatível com as diretrizes da marca, não um botão que apenas simula autenticação. O botão fica indisponível com mensagem honesta quando falta configuração.

### Identidade Google

O servidor valida assinatura, `aud`, `iss`, expiração e nonce/estado de uso único. Armazenar identidade por `(provider, subject)` único; `subject` é o `sub` Google. Uma identidade nova cria cliente com nome/e-mail do token validado, nunca com papel ADMIN vindo do navegador. `senha` passa a opcional para contas exclusivamente sociais; login por senha trata esse caso com orientação para Google, sem senha fictícia.

Gmail e Workspace cuja autoridade foi comprovada dispensam um segundo e-mail de confirmação. Endereço de terceiro associado a uma Google Account não é prova suficiente de posse atual só porque `email_verified=true`; conservar desafio adicional nesses casos. Não vincular silenciosamente uma identidade a conta local existente pela coincidência de e-mail: solicitar prova pela sessão/senha ou link de confirmação da conta existente. Contas bloqueadas continuam bloqueadas. Google fornece o nome inicial; edições posteriores no perfil não são sobrescritas a cada login.

### Lembrar de mim

Sessão opaca aleatória, com apenas hash do segredo no banco, revogável e entregue por cookie HttpOnly, Secure em produção e SameSite adequado à implantação na mesma origem. Com lembrar de mim: expiração por inatividade de 90 dias e limite absoluto de 180 dias. Sem lembrar: cookie de sessão do navegador, com limite no servidor de 12 horas. Não usar IP como identidade ou reautenticação.

Renovar segredos com controle de concorrência e revogação; atualizar atividade de forma limitada, sem uma escrita por asset. Logout revoga no servidor. Redefinição de senha e bloqueio revogam sessões aplicáveis. Pedidos, perfil e operações administrativas consultam o usuário atual no banco. Proteger mutações autenticadas por cookie contra CSRF e validar origem. Produção não aceita bypasses de teste nem uma rota alternativa de Bearer que contorne revogação. A transição do contrato atual deve ser coberta pelos testes e documentada; o usuário poderá precisar fazer login uma vez após a migração.

### E-mail real

Preservar cadastro tradicional com confirmação, expiração, reenvio e recuperação de senha. Tokens novos são de uso único e armazenados por hash; migração não deve confirmar indiscriminadamente usuários antigos. Limites de tentativas/reenvio e respostas públicas evitam enumeração e abuso.

Conservar o contrato central `enviarEmailHtml`, com provedor HTTP transacional para produção (Resend como opção preferencial na Vercel) e compatibilidade com SMTP existente. O modo de arquivos continua somente em desenvolvimento e nunca conta como validação de envio real. Sucesso de API/SMTP é evidência de aceitação; comprovação de entrega exige recebimento real ou evento do provedor. Testar envio ao próprio usuário autorizado, confirmação, token expirado/reutilizado e recuperação. Não enviar campanhas ou mensagens a terceiros como parte desta tarefa.

## 4. Perfil e importação da foto

Criar `/perfil` autenticado e link claro na área pessoal. O cartão inspirado em [Profile Card](https://reactbits.dev/components/profile-card) mostra retrato, nome e identificação básica da biblioteca. Formulário privado edita nome, telefone e endereço; jamais aceita `role`, flags de confirmação ou IDs de outros usuários como atributos editáveis. Mudança de e-mail, caso oferecida, tem fluxo separado com reconfirmação e preservação do e-mail atual até completar; não misturar com o PATCH genérico de perfil. A primeira entrega pode manter e-mail somente leitura.

Botão **Importar foto** abre seletor nativo, aceita JPEG/PNG/WebP, até 5 MB antes do processamento. Validar conteúdo real também no servidor, limitar dimensões/pixels e reencodar; não confiar apenas no MIME enviado. Remover metadados e não aceitar SVG/HTML como avatar. Resultado final em WebP com transparência, máximo 1024 × 1024 e 2 MB.

Remover fundo no navegador com segmentação de retrato carregada sob demanda; propor enquadramento do rosto/cabelo, mostrar transparência e permitir reposicionar/zoom antes de salvar. Não inventar aparência nem alterar identidade. Processamento preferencialmente em worker; não carregar modelo em todas as páginas. Modelo e licença precisam ser conferidos e fixados na implementação. Se o processamento falhar, oferecer nova tentativa e ajuste, sem anunciar remoção concluída. Não enviar fotos para removedores de fundo externos por padrão. Conservar apenas o resultado necessário após salvar; cancelamento não altera a foto atual.

Armazenamento local mantém uploads no desenvolvimento. Em produção, armazenamento durável com acesso privado para retratos e autorização do próprio usuário/admin para leitura; capas públicas têm armazenamento público separado. Não tornar fotos, endereço ou e-mail públicos por causa do efeito do cartão. Validar importação, substituição, cancelamento, imagem inválida, falta de rosto e falha de rede. Licença de U1 não informada: usar referência visual com código próprio se não houver licença confirmada; atribuir código de terceiros efetivamente utilizado.

## 5. Avaliação, favoritos e efeitos

**Peek Rating:** substituir o controle visual de nota por [Peek Rating](https://reactbits.dev/micro/peek-rating), escala 1–5, teclado e rótulos acessíveis. Manter comentário, autorização, unicidade e moderação existentes. Médias e totais são dos registros elegíveis do backend; não promover avaliação pendente a publicada por causa do componente.

**Pulse Heart:** abaixo dos livros no catálogo e vitrines onde há ações de livro, usar [Pulse Heart](https://reactbits.dev/micro/pulse-heart) como salvar/remover, não um like desconectado de favoritos. Persistir relação única usuário/livro. Mutação recebe o estado desejado, não incremento livre: repetir “salvar” é idempotente; remover decrementa somente se existia. Visitantes veem total e são direcionados ao login ao tentar salvar; não criar votos anônimos. Perfil contém lista de livros salvos, inclusive disponibilidade atual.

Total agregado é público; identidades de quem salvou são privadas. Transação grava mudança e evento com cursor durável no PostgreSQL. SSE entrega contagens às sessões conectadas; reconexão busca cursor/estado atual, e consultas reconstroem a verdade do banco. Não usar um contador ou barramento exclusivamente na memória de uma instância. Meta verificável: outra sessão aberta recebe mudança em até 2 segundos em condição normal de teste; reconexão converge sem duplicação. Falha deve desfazer otimização visual e oferecer nova tentativa. Mudanças concorrentes, reconexão e remoção de livro precisam de testes.

**Hold Button:** [referência](https://reactbits.dev/micro/hold-button) para confirmar avanço da compra, preenchimento durante 1,2 s de pressão contínua. Soltar, perder foco, cancelar pointer ou desmontar cancela. Completar vira verde e aciona uma única operação; estado ocupado bloqueia repetição. Funciona com toque e teclado, com alternativa explícita para quem não consegue segurar. Verde significa ação de prosseguir confirmada, não dinheiro recebido. Pedido/checkout usam idempotência além da proteção visual; não criar dois pedidos em retry.

**Click Spark global:** ampliar o wrapper atual da hero para uma camada decorativa global da aplicação, com `pointer-events:none`, limpeza e quantidade limitada, sem duplicar explosões nos wrappers antigos. Cobrir também diálogos montados em portal. Respeitar movimento reduzido; manter navegação e preenchimento nativos. Não prometer captura dentro de iframes isolados do Google/Stripe nem seletores nativos do sistema.

**Digitação:** padronizar o efeito visual em formulários públicos e autenticados da aplicação, sem retardar o valor real, submeter texto incompleto ou prejudicar cursor, seleção, colagem, autofill, leitores de tela e IME. Senhas ficam mascaradas. Não espelhar nem aplicar overlays que capturem valores secretos de campos Stripe. Inputs do provedor mantêm isolamento e animações suportadas por ele.

## 6. Stripe e cartão animado

Substituir o gateway de novos checkouts por Stripe em BRL e manter os registros/eventos históricos Mercado Pago reconhecidos por provedor. Não reescrever cobranças antigas como Stripe. Mapear pagamentos de compra, aluguel, reserva e extensão, sem perder as transações e transições atuais. Valores são obtidos do pedido, em centavos calculados no servidor; o navegador nunca determina preço, desconto, frete ou dono do pedido.

O cartão de [Praashoo7/Uiverse](https://uiverse.io/Praashoo7/black-lizard-62) inspira a frente/verso. Para cumprir o giro específico no foco do CVV, usar Stripe Elements com campos de cartão separados e PaymentIntents: é uma customização deliberada do fluxo para esse requisito, em vez do Payment Element agregado recomendado para integrações genéricas. Conferir APIs/versão no momento da implementação. Stripe captura PAN/CVV diretamente; a aplicação reage a foco/completude/bandeira, mostra nome e máscara, e nunca lê ou grava PAN/CVV. Não representar cada número real no cartão decorativo. Giro por foco do CVC e retorno ao sair são testados; movimento reduzido usa troca discreta. Salvar cartão é opcional e desmarcado por padrão: guardar somente referências de Customer/PaymentMethod e metadados permitidos, mediante escolha do usuário, para próximas compras iniciadas por ele.

Pix é uma cobrança Stripe real habilitada para a conta, com QR, código copia e cola, expiração e estado aguardando. Pagamento expirado oferece nova tentativa sem fabricar QR nem marcar pago. Cartão contempla validação, recusa e autenticação adicional. Não declarar disponibilidade de Pix antes de verificar habilitação/país/conta. Testar primeiro em sandbox.

Webhook Stripe deve receber corpo bruto antes do parser JSON daquela rota, validar assinatura com SDK e processar evento + efeitos em transação idempotente. Verificar provedor, referência de pedido/pagamento, moeda, valor e relação entre eles. Eventos duplicados/fora de ordem não apagam aprovação nem estendem aluguel duas vezes. Redirecionamento ou botão verde não prova pagamento. `payment_intent.succeeded` ou consulta autoritativa convergente determina aprovação; falha de webhook permite retry. Reembolsos e cancelamento respeitam as regras de conciliação atuais; pagamentos tardios de pedidos cancelados ficam sinalizados para conciliação, sem reabrir estoque/pedido silenciosamente.

Endpoint de iniciar checkout verifica dono/admin autorizado e idempotência; reusa cobrança pendente compatível e não cobra pedido já pago. Dados sensíveis e client secrets não entram em logs, cache público ou URLs compartilháveis. Nenhuma cobrança, estorno ou salvamento de cartão real será executado como teste automático nesta tarefa.

## 7. Frete Google Maps

Reutilizar `deliveryService.js` e a Routes API já presente. Chave exclusivamente no backend; não usar prefixo VITE nem embutir em bundle. `GOOGLE_MAPS_API_KEY` deve pertencer ao projeto autorizado, com Routes API habilitada, faturamento necessário e restrições apropriadas ao servidor/API. Não remover restrições de uma chave existente para contornar falhas.

`STORE_ADDRESS` inicial: `Rua José de Alencar, 511, Farol, Maceió - AL, Brasil`. Manter tarifas existentes: base R$ 5,00 e R$ 2,50/km, ambas configuráveis e nunca apresentadas como tarifa oficial de transportadora. O valor é uma cotação própria baseada na distância retornada pelo Google, não contratação automática de entrega.

Conferir valores de configuração não negativos, endereço vazio, nenhuma rota, timeout, erro de permissão/cota e retorno malformado. Invalidar prévia quando endereço/modalidade mudar. Calcular novamente no servidor ao criar pedido e fixar o frete daquele pedido; retirada tem frete zero. Manter a entrega indisponível com erro explicativo se o serviço falhar, sem substituição silenciosa por distância/valor inventados. Limitar abuso da cotação autenticada e evitar enviar endereço a logs. Critério real: cotar pelo Google entre a origem pública e outro destino público de teste em Maceió, conferir distância/duração/valor e integridade na compra; ainda depende da configuração do Google Cloud.

## 8. Banco, deploy e segredos

Migrações aditivas previstas: identidade externa, sessão, avatar, favoritos, evento durável de favorito, identificação do provedor/cobrança/evento Stripe e chaves de idempotência. Relações, índices e unicidade devem estar no banco, não só na interface. Manter IDs, senhas existentes, campos de confirmação, preços, estoque e histórico. Aplicar e testar primeiro em cópia isolada. Backup e comparação antes de migrar o banco persistente real.

Vercel hospeda frontend Vite e API Express, com adaptação do bootstrap para não depender de um `listen` permanente ou jobs em memória. API sob `/api`; a navegação SPA continua funcionando em links diretos. PostgreSQL hospedado compatível com Prisma (Neon via integração Vercel como preferência) substitui o socket local no deploy. Vercel Blob é a preferência para mídia durável, com separação de capas públicas/retratos privados. São escolhas de arquitetura; nenhuma conta, plano pago ou recurso foi provisionado nesta etapa.

Transferir banco por procedimento com backup/validação e transferir uploads antes de atualizar suas URLs, incluindo variantes WebP. Não publicar URLs localhost. Conferir contagens/relações, sequências e checksums. Exportação e backups não entram no Git. Lembretes em background usam execução agendada protegida e idempotente, respeitando recursos da conta, não `setInterval` de instância efêmera. SSE deve reconectar dentro dos limites de duração da função; não degradar silently para um contador apenas local.

Produção exige HTTPS, origens permitidas, cookies e CSP compatíveis com Stripe/Google, ambientes separados e ausência de simulação de pagamento/login. Não publicar uma credencial administrativa conhecida de demonstração com acesso ao banco de produção. Não apagar contas ou resetar senhas silenciosamente: resolver configuração administrativa com o proprietário antes de liberar acesso público. Logs omitem segredos, tokens, endereços e imagens pessoais.

| Serviço | Configuração necessária para validar de verdade |
| --- | --- |
| Google Cloud | Projeto do usuário, Routes API/faturamento, chave restrita do backend e cliente web OAuth/GIS com origens locais e de produção. Maps e login usam configurações diferentes. |
| Stripe | Conta/sandbox, chave pública, segredo do backend e segredo do webhook, métodos habilitados; sandbox e live separados. |
| E-mail | Provedor transacional/SMTP autorizado, remetente/domínio verificado quando aplicável e destinatário próprio para recebimento de teste. |
| Vercel | Projeto/conta autorizados; URL de aplicação, banco hospedado e armazenamento conectados. |

Conferência inicial: não havia variáveis operacionais desses serviços no ambiente do processo de auditoria nem arquivos `.env` nos caminhos conferidos; plugins Stripe/Vercel foram sugeridos, mas conexão não confirmada. Isso não impede desenvolver e testar as partes independentes após as revisões de desenho/plano. Impede afirmar OAuth real, recebimento externo, rota Maps, cobrança live ou deploy concluídos sem configuração/evidência. Segredos devem ser inseridos nos ambientes locais/deploy, nunca no chat, commits ou frontend.

## 9. Verificação e critérios de entrega

- Testes de domínio: autenticação social inválida, vínculo seguro, bloqueio, sessão expirada/revogada, CSRF e tentativas; perfil só do dono e rejeição de campos privilegiados; favorito concorrente/idempotente; webhook duplicado/valor divergente/evento fora de ordem; frete inválido e manipulado.
- Testes React: composição de login/cadastro, lembrar de mim, Peek Rating com teclado, Pulse Heart com erro/retry, Hold Button com interrupções/repetição, edição/importação do perfil e digitação sem atraso do valor nativo.
- Banco isolado real: migração, índices, relação usuário/livro, transação de contagem/evento e duas sessões SSE, pedidos com disputa de estoque e aplicação única de pagamentos/extensão.
- Navegador: desktop/mobile claro/escuro, movimento reduzido, login local e Google configurado, confirmação/reenvio/recuperação de e-mail, perfil com foto, favoritos entre sessões, compra/retirada/entrega, aluguel/reserva/extensão, Stripe cartão/Pix em sandbox e painéis administrativos preservados.
- Provedores reais: recebimento da confirmação no destinatário autorizado, Google Cloud Routes com chave do projeto, login Google em origem autorizada, webhook Stripe sandbox e persistência após reinício/deploy. Cada resultado distingue teste simulado, sandbox e produção.
- Rodar lint, build, testes de backend/frontend e regressões E2E afetadas. Revisar licença/atribuição, diff e segurança de segredos. Abrir versão integrada final e registrar evidências com limites honestos. Só considerar deploy completo com URL acessível e fluxos persistentes validados.

## Referências técnicas consultadas

- [Google: validação do ID token](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token), [botão/marca](https://developers.google.com/identity/branding-guidelines), [configuração Routes](https://developers.google.com/maps/documentation/routes/get-api-key) e [Compute Routes](https://developers.google.com/maps/documentation/routes/compute_route_directions).
- [Stripe: Elements](https://docs.stripe.com/payments/elements), [foco](https://docs.stripe.com/js/element/events/on_focus), [Pix](https://docs.stripe.com/payments/pix) e [segurança](https://docs.stripe.com/security/guide).
- [MediaPipe Image Segmenter](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter/web_js).
- [Vercel Express](https://vercel.com/docs/frameworks/backend/express), [Postgres](https://vercel.com/docs/postgres), [Blob](https://vercel.com/docs/vercel-blob) e [limites de funções](https://vercel.com/docs/functions/limitations).

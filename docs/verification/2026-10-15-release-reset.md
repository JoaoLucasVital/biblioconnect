# Limpeza, reset e publicação — 15/10/2026

## Autorização e resultado

O proprietário solicitou a remoção das instruções de protótipo e das credenciais visíveis, o reset de usuários, mais de 100 livros e o deploy. Confirmou reset local e online com preservação do administrador e escolheu sua identidade Google já validada como acesso administrativo.

- Removidos o bloco de credenciais de teste no login, os textos decorativos junto à carteirinha/foto, o reset de apresentação no painel e o botão de pagamento simulado.
- Bootstrap local não cria outro administrador previsível quando já existe um administrador.
- Backups lógicos completos dos dois bancos, com hashes conferidos, antes da manutenção. Backup físico fechado do PGlite e cópia conferida de capas e fotos antes do reset local. Arquivos privados em diretórios ignorados pelo Git e pelo deploy.
- Preservada a identidade Google verificada do proprietário, promovida a ADMIN, com senha nula e conta desbloqueada. Nenhuma promoção automática por e-mail foi adicionada ao cadastro público. As outras contas e os históricos operacionais foram apagados nos dois bancos; sessões antigas foram invalidadas.
- Catálogo original preservado, exceto o registro fictício “Livro de integração”/“Autor”. Importados 110 títulos novos, totalizando 131 livros em cada banco. Pedidos, pagamentos, avaliações, favoritos e atendimentos zerados na conclusão do reset.
- Capas dos 110 novos títulos convertidas para WebP, publicadas no Blob e verificadas por HTTP e SHA-256. Metadados e proveniência por edição em `docs/catalog/2026-10-15-expansion.json`, consultados na Open Library. Excluída uma tradução regional duplicada de A empregada e uma entrada com título malformado; separados autores principais de colaboradores agregados pelo índice.

Os novos títulos recebem preço de compra de R$ 39,90, aluguel de R$ 7,90 por sete dias, diária extra de R$ 1,50 e estoque inicial configurado em cinco. São valores iniciais do catálogo do projeto; não representam pesquisa de preços comerciais nem conferência de exemplares físicos. Devem ser revisados antes de aceitar vendas reais.

## Verificação

- Teste de reset com banco descartável: preservação do catálogo e da identidade verificada, limpeza de dependências, repetição e provisionamento do proprietário em destino sem sua conta. Passou.
- Oito testes focados de reset/configuração/deploy passaram; o teste de reset foi reexecutado após adicionar o caso de destino sem proprietário.
- Frontend: execução completa encontrou 145 testes aprovados e dois que ainda exigiam controles de demonstração removidos por este pedido. Expectativas atualizadas; os sete testes dos dois arquivos afetados passaram. Não foi declarada uma nova execução completa após essa atualização.
- Playwright isolado: pagamento/financeiro e moderação/resposta passaram (2/2), sem inserir dados de teste nos bancos reais.
- ESLint passou nos cinco componentes alterados; build local e build remoto de produção passaram. Mantido aviso anterior do chunk Three.js.
- Conferido o pacote de deploy: nenhum arquivo de `.local`, `.superpowers`, `.env` ou `.impeccable` foi incluído.
- HTTP público: home, `/livros`, `/login`, `/perfil` e `/admin/chat` retornaram 200; os dois últimos são documentos SPA, não prova de acesso autenticado. APIs `/api/me` e `/api/admin/usuarios` retornaram 401 sem sessão. Catálogo público e local: 131 registros, sem livro fictício.
- Navegador interno abriu a home pública com as capas e o contador de 131 leituras. Captura privada `.impeccable/review/release-public-home.png`.

## Publicação e pendências externas

Projeto verificado `joaolucasdev/biblioconnect`, ID `prj_rcrGQvHa9oIDy7ejLSFzZujrSf0W`. Deploy de produção `dpl_7TvLr4wy9jxPsA3m256MqYfQpPxQ`, frontend Vite e backend Express com Prisma/Neon, promovido ao domínio https://biblioconnect-olive.vercel.app. O 404 visto durante a preparação era do domínio ainda sem o deploy associado; após promoção, domínio, aplicação e API responderam HTTP 200.

Segredos novos de sessão e cron configurados como Secret, login Google configurado com o cliente existente, URLs de frontend/backend no domínio público, armazenamento Blob e simulação de pagamento desativada. Não foram enfraquecidas as proteções de previews da Vercel.

A liberação da origem `https://biblioconnect-olive.vercel.app` ficou inicialmente bloqueada por “Falha ao carregar” no Google Cloud, tanto para o agente quanto para o proprietário. Essa pendência foi resolvida após renovar a sessão Google, conforme a verificação de produção abaixo.

Stripe e envio externo de e-mail continuam sem credenciais de produção. Não foram realizados cobrança, cadastro público de teste ou envio de e-mail no ambiente publicado. O cadastro por e-mail não deve ser considerado validado em produção. Frete mantém a chave ORS anteriormente configurada; não foi feita nova cotação real nesta etapa.

## Acesso alternativo autorizado após falha do console Google

O proprietário relatou a mesma falha em janela anônima e em dados móveis. Nova inspeção confirmou que o projeto e seu número correspondem ao cliente usado pela aplicação; a página IAM também falhou ao carregar. O painel público de status não anunciava incidente geral, o que não excluía falha específica. Naquele momento, nenhuma configuração OAuth tinha sido alterada e `origin_mismatch` ainda estava pendente.

O proprietário autorizou habilitar senha na conta administrativa existente como alternativa. Gerada senha aleatória forte, armazenada em arquivo privado ignorado e no banco somente como hash bcrypt; preservados os identificadores Google, o e-mail confirmado e o papel ADMIN. Backup privado dos hashes anteriores; sessões anteriores revogadas. Não criada outra conta nem exceção de autorização.

Verificação real, online e local: POST de login HTTP 200, painel administrativo HTTP 200 e 131 livros; logout HTTP 200 e reutilização da sessão encerrada HTTP 401. As credenciais e cookies não foram impressos nos resultados nem colocados no Git. Acesso com senha validado; isso não comprova correção do login Google nem do cadastro por e-mail de novos usuários.

## Login Google de produção validado

Após encerrar a sessão Google e o proprietário concluir o CAPTCHA e a autenticação novamente, as telas de criação, listagem e edição de clientes voltaram a carregar. O aviso de feedback “Ask your parent” não foi tratado como prova de supervisão; o proprietário informou que sua conta é pessoal e não supervisionada.

Com confirmação explícita no momento de salvar, adicionada somente a origem JavaScript `https://biblioconnect-olive.vercel.app` ao cliente Web existente, preservando `http://localhost:5173` e `http://localhost`. O Google exibiu “Cliente OAuth salvo”; a reabertura do editor confirmou as três origens persistidas. Nenhum cliente ou segredo novo foi criado, e nenhuma alteração de código ou deploy foi necessária.

Verificação no navegador interno: aberta a rota pública `/login`, acionado “Continuar com o Google” e observada a navegação para a home com a sessão de Jão Dev, os links Perfil/Painel e o botão Sair. Em seguida, o painel administrativo `/admin` carregou os dados reais: 131 livros, um usuário cadastrado e zero movimentações após o reset. Não houve novo cadastro nem uso da senha alternativa neste teste. Evidência visual privada em `.superpowers/google-login-production-verified.png`.

O login Google da conta administrativa foi validado na origem de produção. Não foi realizado cadastro com uma segunda conta Google nesta verificação. As pendências de Stripe e envio de e-mail continuam independentes desta correção.

Inspeção adicional: público Externo, status Testando e somente o proprietário listado como teste; nenhuma permissão adicional cadastrada na página Acesso a dados. O fluxo usa Sign in with Google para identidade básica. Segundo https://support.google.com/cloud/answer/15549945, esse fluxo é uma exceção à exigência de usuários de teste, desde que não solicite outros escopos. O status Testando não foi tratado como um novo bloqueio comprovado, e nenhuma configuração de publicação/branding foi alterada nesta correção.

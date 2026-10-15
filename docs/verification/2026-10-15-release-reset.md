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

A liberação da origem `https://biblioconnect-olive.vercel.app` no cliente OAuth permanece pendente: o Google Cloud mostrou “Falha ao carregar” ao editar esse cliente tanto para o agente quanto para o proprietário. O backend anuncia Google habilitado, mas isso não comprova login Google funcionando nessa origem. O login local Google já tinha sido validado antes desta etapa; o acesso online do administrador só poderá ser validado após corrigir a origem no Google Cloud.

Stripe e envio externo de e-mail continuam sem credenciais de produção. Não foram realizados cobrança, cadastro público de teste ou envio de e-mail no ambiente publicado. O cadastro por e-mail não deve ser considerado validado em produção. Frete mantém a chave ORS anteriormente configurada; não foi feita nova cotação real nesta etapa.

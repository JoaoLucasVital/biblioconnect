# Acesso, pedidos e capas — 14/10/2026

## Escopo entregue

- Navbar desktop e menu compacto: administrador vê “Pedidos” apontando para `/admin/pedidos`; cliente mantém “Meus pedidos” em `/meus-pedidos`. Demais links preservados.
- Login administrativo local conferido. A conta recém-criada do usuário foi confirmada mediante autorização explícita, usando o link e o endpoint normais de confirmação. Senha e exigência de confirmação preservadas. O provedor local grava mensagens em arquivos; entrega externa de e-mail não foi validada.
- Acervo existente com 22 capas WebP e 30 variantes responsivas. Nove imagens ausentes preenchidas, incluindo uma capa identificada de exemplar fictício de teste. Fontes maiores e enquadramento das frentes melhoram a hero; nenhuma capa foi vetorizada ou ampliada artificialmente. SVGs permanecem vetoriais.
- Somente URLs das capas atualizadas no banco persistente existente. Estoque, preços e todos os demais campos dos livros foram comparados e preservados; originais e backup mantidos.
- Perfil/cartão de biblioteca permanece em espera por solicitação do usuário.

## Evidências

- Testes unitários: `rtk npm test` — 95 testes, 19 arquivos, todos passaram. Incluem regressão de navegação administrativa desktop/compacta e variantes responsivas de `BookCover`; os novos casos falharam antes das respectivas correções.
- `rtk npm run lint` — passou.
- Build de produção e E2E isolado: `rtk proxy node scripts/qa-environment.js --e2e-production e2e/navigation.spec.js e2e/discovery.spec.js e2e/home.spec.js e2e/catalog.spec.js e2e/admin.spec.js` — 23 testes passaram. Abrangem navegação por papel, fluxos do catálogo, painéis e movimento contínuo da hero.
- Aplicador: 22 URLs alteradas; comparação dos demais campos aprovada; 52 respostas HTTP de imagens aprovadas como WebP com tamanho esperado. Pillow verificou o formato dos arquivos gerados.
- Navegador integrado: link administrativo aponta para `/admin/pedidos`; as 20 imagens da hero estavam carregadas em WebP. Captura: `docs/design-references/2026-10-14/home-webp-covers-dark-desktop.png`.
- Revisão independente somente por leitura: sem findings concretos em navegação, variantes e scripts de conversão/aplicação.
- `git diff --check` sem erros.

## Limites e operação

Frontend `http://localhost:5173`, API `http://localhost:3000`, banco persistente local na porta 55440. Backend, schema e dependências da aplicação não foram alterados. Um primeiro ensaio com cliente Prisma adicional encontrou colisão de prepared statements no socket PGlite antes de qualquer escrita; o utilitário final usa `pg` isolado e comandos sem statements nomeados. A aplicação normal continua com Prisma.

As fontes de algumas capas têm resolução nativa modesta, registrada no manifesto de proveniência. O build mantém o aviso conhecido do ecossistema Three; os testes de hero, fallback e movimento reduzido passaram. Estes resultados validam os fluxos locais exercitados, não constituem auditoria completa de segurança nem validação de deploy, pagamentos reais ou SMTP externo.

Procedimento, direitos e recuperação: `docs/catalog/2026-10-14-cover-upgrades.md`, `docs/catalog/cover-optimization.json`, `docs/catalog/cover-application.json` e `THIRD_PARTY_NOTICES.md`.

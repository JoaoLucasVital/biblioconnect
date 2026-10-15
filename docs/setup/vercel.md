# Hospedagem integrada do BiblioConnect

Atualização em 15/10/2026: projeto `biblioconnect` criado na equipe `joaolucasdev` (Hobby), Neon gratuito e dois Blob stores conectados em São Paulo (`gru1`). A cópia dos dados e imagens foi migrada e conferida. Ainda não há deploy da aplicação. Google, e-mail, Stripe e preparação do preview permanecem no [guia das contas](2026-10-14-services.md).

## O que está preparado

`vercel.ts` define frontend Vite e backend Express em um projeto. A configuração do projeto na Vercel deverá usar **Services**. O backend exporta `src/app.js`, sem abrir porta, conectar antecipadamente o banco ou iniciar timers durante importação. O processo local continua em `node server.js`.

As regras públicas `/api` e `/api/(.*)` precedem o frontend. A Vercel preserva o caminho recebido; o mount Express em `/api` remove esse prefixo antes das rotas existentes. Essa remoção explícita evita depender de um rewrite que apenas escolhe uma rota. O build `npm --prefix frontend run build:hosted` fixa a URL pública da API em `/api`; navegação direta como `/perfil` vai para o frontend.

O cron diário chama `/api/internal/cron`, com `Authorization: Bearer <CRON_SECRET>`. A chave deve conter pelo menos 32 bytes e ser diferente de AUTH_SECRET. A execução reivindica cada lembrete atomicamente e libera a tentativa quando o envio falha. Limpa eventos de favoritos anteriores a 24 horas, desafios Google e limites vencidos; operações concluídas são preservadas por 90 dias para proteger retries tardios. Também remove até 1.000 capas temporárias abandonadas há mais de uma hora, exclusivamente no prefixo `book-staging/`; nunca remove retratos nessa rotina. O cron precisa ser validado no deploy real.

## Armazenamento e migração concluídos

- `biblioconnect-db`: Neon Free, PostgreSQL com Prisma; 22 livros, 3 contas, 5 pedidos, favoritos, avaliação e chat preservados.
- `biblioconnect-covers`: Blob público; 65 arquivos, incluindo as variantes de capa. Os nomes foram preservados para manter os `srcSet` existentes.
- `biblioconnect-portraits`: Blob privado; uma foto migrada. O teste de acesso anônimo retornou 403. O acesso é feito pelo backend autenticado, usando OIDC com `BLOB_PRIVATE_STORE_ID` e `BLOB_PRIVATE_WEBHOOK_PUBLIC_KEY`.
- `MEDIA_STORAGE=blob` configurado em Production e Preview. Capas usam `BLOB_READ_WRITE_TOKEN` do store público; esse segredo nunca vai ao frontend. O ambiente local continua com `MEDIA_STORAGE=local` e dados originais.
- Development foi autorizado temporariamente pelo proprietário para migração/testes e removido ao final. Não há token permanente privado configurado.

O cadastro/edição pede um ticket exclusivo por administrador, válido por dez minutos. O SDK envia até 5 MB diretamente ao store privado, com escopo de caminho, MIME e tamanho. A finalização verifica dono/ticket e conteúdo real, limita pixels, remove metadados e publica WebP. A foto de perfil continua inteira, com fundo e proporção originais.

`scripts/migrate-hosted-data.mjs` aceita `--snapshot`, `--destination` e `--env-file`; sem `--execute` faz somente dry-run. O snapshot deve ser um backup fechado, com `hosted-snapshot.json` e checksums de banco, uploads e avatares. O destino contém host/database exatos, projeto e store privado aprovados. O script recusa banco/storage não vazios; uma tentativa parcial exige inspeção, sem reset automático. Nunca apontar para o diretório PGlite vivo. A inserção dos registros é transacional, mantém IDs/FKs e ajusta sequências, comparando contagens e hashes completos.

Backups, credenciais e relatórios detalhados ficam em diretórios privados ignorados pelo Git. Sessões/desafios/limites/operações temporárias locais não são copiados; tokens locais de confirmação/reset são invalidados somente na cópia hospedada. A conta administrativa com a senha conhecida de demonstração fica bloqueada e sem senha hospedada. As senhas pessoais e o banco local são preservados. Antes do deploy, preparar acesso administrativo seguro e reconciliar qualquer alteração local posterior ao snapshot.

## Antes do primeiro preview

1. Conectar Google, Stripe e e-mail; configurar segredos somente no backend e completar checkout/webhook.
2. Preparar acesso administrativo seguro, URLs HTTPS de Google/e-mail/webhook, origens permitidas e cookies.
3. Conferir o preset Services do projeto e validar o build/roteamento na plataforma autenticada. O projeto remoto ainda usa o preset Other; a configuração local não comprova suporte do deploy.
4. Fazer preview protegido e conferir login, sessões, acervo/capas, favoritos em duas sessões, perfil, frete real, cartão/Pix de teste e cron. Publicar somente após esses testes e a revisão final.

Auditoria de produção em 15/10: permanece um alerta alto em Nodemailer. A atualização e os testes de compatibilidade fazem parte da próxima etapa de envio real de e-mail e precisam ser concluídos antes da publicação. Não foi aplicada atualização major automática/forçada.

## Evidência local disponível

Os testes `deployment-config.test.js` verificam importação sem listener/timers e autorização de cron, além da seleção das rotas na configuração. `runtime-jobs.test.js` usa banco descartável para provar concorrência dos lembretes, nova tentativa após falha e retenção dos eventos. Esses testes não substituem build e validação dos serviços na Vercel.

Referências oficiais: [Services](https://vercel.com/docs/services), [roteamento e caminho preservado](https://vercel.com/kb/guide/vercel-services), [configuração TypeScript](https://vercel.com/docs/project-configuration/vercel-ts).

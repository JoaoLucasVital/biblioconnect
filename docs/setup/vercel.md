# Hospedagem do BiblioConnect

Atualizado em **15/10/2026**. Este guia substitui o estado inicial de preparação da migração. A aplicação já está publicada em **https://biblioconnect-olive.vercel.app**.

## Arquitetura publicada

- Projeto Vercel `biblioconnect`, com **Services** definidos em `vercel.ts`.
- Frontend: raiz `frontend`, Vite, comando `npm run build:hosted`, saída `dist` e fallback para `index.html`.
- Backend: raiz do repositório, Express, entrada `src/app.js`, build `npm run prisma:generate`.
- `/api` e `/api/*` são resolvidos antes da SPA. Express remove o prefixo pelo mount em `src/app.js`.
- Neon mantém PostgreSQL; o build não aplica migrações automaticamente.
- Blob público armazena capas; Blob privado guarda retratos e staging de upload.
- Headers da configuração: `nosniff`, `strict-origin-when-cross-origin` e `X-Frame-Options: DENY`.

O `server.js` exporta a aplicação. Importá-lo em serverless não inicia listener, bootstrap de administrador ou timers locais. `node server.js` continua sendo o processo de desenvolvimento.

## Estado conferido

O catálogo foi verificado com 131 livros. Login Google real e painel autenticado funcionaram na origem pública. O Gmail dedicado teve SMTP validado e mensagem de teste recebida na caixa de entrada. Acesso anônimo à foto de perfil foi recusado com 401. Esses resultados não homologam pagamentos ou todas as integrações.

O código financeiro ainda utiliza **Mercado Pago**; Stripe permanece pendente de migração. A declaração de variáveis Stripe no ambiente não habilita um fluxo Stripe inexistente. ORS teve cotação real local e configuração hospedada; não foi realizada uma nova compra/cotação de produção nesta revisão.

## Ambiente protegido

Configure os segredos apenas nas variáveis protegidas da Vercel. Grupos principais: `DATABASE_URL`, `AUTH_SECRET`, `CRON_SECRET`, `GOOGLE_CLIENT_ID`, `EMAIL_*`, `ORS_API_KEY`, variáveis Blob e URLs públicas. Não copie valores reais para documentação, código ou chat.

- `FRONTEND_URL`: `https://biblioconnect-olive.vercel.app`.
- `BACKEND_URL`: `https://biblioconnect-olive.vercel.app/api`.
- `NODE_ENV=production`, `MEDIA_STORAGE=blob`, `ALLOW_PAYMENT_SIMULATION=false`.
- Google deve autorizar a origem pública exata no cliente existente.
- Gmail utiliza senha de app, diferente da senha de login normal; o titular a salva como Secret.
- Previews continuam protegidos. Não desativar proteção para corrigir problema de alias.

Retratos privados podem usar OIDC do projeto com `BLOB_PRIVATE_STORE_ID` e `BLOB_PRIVATE_WEBHOOK_PUBLIC_KEY`; capas usam autorização do store público. Credenciais do servidor não são expostas por `VITE_*`.

## Rotina de deploy

1. Conferir branch, diff e segredos fora do Git. Executar os checks adequados à alteração.
2. Fazer backup e aplicar migrações necessárias em etapa separada e revisada; o build apenas gera o client.
3. Conferir projeto vinculado, URLs, providers e credenciais. Não usar seed/reset.
4. Criar deployment, conferir o resultado e promovê-lo ao domínio público aprovado.
5. Validar home, navegação direta, API, sessão administrativa, catálogo e acesso privado a fotos.
6. Conferir logs e integrações específicas alteradas, sem criar cobranças ou dados reais de teste sem planejamento.

Na sessão de publicação, foram utilizados os comandos abaixo com a CLI autenticada no projeto correto:

```powershell
npx vercel@64.1.0 deploy --prod --skip-domain --yes --archive=tgz
# Usar a URL retornada, sem inventar ou reutilizar uma URL antiga:
npx vercel@64.1.0 promote <URL_DO_DEPLOYMENT_VERIFICADO> --yes
```

A promoção foi necessária para atualizar o domínio público. O endereço padrão do projeto e previews podem exigir autenticação Vercel. A versão com Gmail foi publicada pelo deploy `dpl_CefDC1hX5RUhrNDMpKYDcyFHWX3f`; conferir o painel para versões posteriores.

Rollback de deployment reverte código, não banco, e-mails ou uploads. Tratar restauração de dados e compatibilidade de schema separadamente.

## Cron

O cron chama `/api/internal/cron` às **06:00 UTC** diariamente, equivalente a **03:00 em Brasília** nesta data. Requer `Authorization: Bearer <CRON_SECRET>`, segredo independente de ao menos 32 bytes.

A rotina reivindica notificações de atraso atomicamente, libera retry quando envio falha e limpa eventos/controles expirados. Também pode limpar até 1.000 capas abandonadas há mais de uma hora no prefixo de staging, sem excluir retratos nessa limpeza. A execução agendada real precisa ser conferida nos logs; configuração e testes locais não comprovam disparo automático.

## Migração e dados

O catálogo e o proprietário foram preservados no reset anteriormente autorizado; depois, novos usuários podem ter se cadastrado. Não repetir a limpeza. Dados reais não devem ser inferidos pelas contagens antigas dos documentos históricos.

`scripts/migrate-hosted-data.mjs` aceita snapshot, destino e env-file. Sem `--execute`, faz dry-run. Exige backup consistente e destino validado, recusa cenários de destino não vazio e compara contagens/checksums. Não apontar para PGlite vivo. A demonstração local não sincroniza com Neon automaticamente.

`.vercelignore` exclui Git, `.local`, `.superpowers`, `.env*`, dados locais, relatórios, testes e documentos do bundle. Backups, senhas e e-mails com links de autenticação permanecem privados.

## Fontes

Configuração atual: `vercel.ts`, `src/app.js`, serviços de storage/cron e `docs/verification/2026-10-15-release-reset.md`, `2026-10-15-confirmation-email.md` e `2026-10-15-profile-photo-safari.md`. Referências externas registradas no projeto: [Vercel Services](https://vercel.com/docs/services) e [configuração TypeScript](https://vercel.com/docs/project-configuration/vercel-ts). A documentação técnica principal descreve os limites de homologação.

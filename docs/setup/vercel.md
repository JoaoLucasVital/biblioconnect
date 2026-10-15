# Hospedagem integrada do BiblioConnect

Preparação parcial em 14/10/2026. Nenhum deploy ou banco remoto foi criado. O proprietário informou que ainda precisa criar/configurar as contas. Siga primeiro o [guia das contas](2026-10-14-services.md).

## O que está preparado

`vercel.ts` define frontend Vite e backend Express em um projeto. A configuração do projeto na Vercel deverá usar **Services**. O backend exporta `src/app.js`, sem abrir porta, conectar antecipadamente o banco ou iniciar timers durante importação. O processo local continua em `node server.js`.

As regras públicas `/api` e `/api/(.*)` precedem o frontend. A Vercel preserva o caminho recebido; o mount Express em `/api` remove esse prefixo antes das rotas existentes. Essa remoção explícita evita depender de um rewrite que apenas escolhe uma rota. O build `npm --prefix frontend run build:hosted` fixa a URL pública da API em `/api`; navegação direta como `/perfil` vai para o frontend.

O cron diário chama `/api/internal/cron`, com `Authorization: Bearer <CRON_SECRET>`. A chave deve conter pelo menos 32 bytes e ser diferente de AUTH_SECRET. A execução reivindica cada lembrete atomicamente e libera a tentativa quando o envio falha. Limpa eventos de favoritos anteriores a 24 horas, desafios Google e limites vencidos; operações concluídas são preservadas por 90 dias para proteger retries tardios. O cron precisa ser validado no deploy real.

## Antes do primeiro preview

1. O proprietário cria a conta e faz login na CLI Vercel. Conferir usuário/equipe e listar projetos antes de vincular a pasta; não criar duplicatas ou aceitar plano pago automaticamente.
2. Provisionar PostgreSQL hospedado e armazenamento durável separado para capas públicas e retratos privados. A pasta local `uploads` não é armazenamento de Functions. Upload local de capas falha claramente em produção até o adaptador hospedado estar conectado.
3. Conectar os ambientes de teste Google, Stripe e e-mail; configurar segredos somente no backend. Instalar e validar os SDKs oficiais quando os provedores estiverem preparados, conforme o plano aprovado.
4. Completar o fluxo de upload direto de capas, checkout/webhook Stripe e migração verificada. Essas partes permanecem pendentes; esta configuração não torna a aplicação pronta para publicar.
5. Migrar uma cópia validada dos dados para destino vazio e explicitamente conferido. Exigir backup privado, dry-run, contagens, relações, sequências e checksums das imagens. Não resetar ou sobrescrever o banco atual.
6. Resolver a conta administrativa de demonstração antes de qualquer URL pública: não publicar senha conhecida e não alterar a senha pessoal sem autorização. Configurar as URLs HTTPS de Google/e-mail/webhook, origens permitidas e cookies.
7. Fazer preview protegido e conferir login, sessões, acervo/capas, favoritos em duas sessões, perfil, frete real, cartão/Pix de teste e cron. Publicar somente após esses testes e a revisão final.

## Evidência local disponível

Os testes `deployment-config.test.js` verificam importação sem listener/timers e autorização de cron, além da seleção das rotas na configuração. `runtime-jobs.test.js` usa banco descartável para provar concorrência dos lembretes, nova tentativa após falha e retenção dos eventos. Esses testes não substituem build e validação dos serviços na Vercel.

Referências oficiais: [Services](https://vercel.com/docs/services), [roteamento e caminho preservado](https://vercel.com/kb/guide/vercel-services), [configuração TypeScript](https://vercel.com/docs/project-configuration/vercel-ts).

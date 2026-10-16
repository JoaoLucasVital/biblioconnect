# BiblioConnect

Biblioteca online com catálogo, reservas, aluguéis, compras, avaliações, atendimento e administração. Projeto acadêmico com **React + Express + Prisma + PostgreSQL**.

**Aplicação:** [biblioconnect-olive.vercel.app](https://biblioconnect-olive.vercel.app) · **Atualização:** 15/10/2026.

![Arquitetura do BiblioConnect](docs/diagrams/arquitetura.svg)

## Documentação

- [Documentação técnica completa](docs/documentacao-tecnica.md): arquitetura, funcionalidades, segurança, integrações e operação.
- [PDF para leitura e apresentação](output/pdf/biblioconnect-documentacao-tecnica.pdf): inclui diagramas, dicionário de dados e mapa de rotas.
- [Dicionário das 15 entidades](docs/dicionario-de-dados.md): todos os campos, chaves, índices e relacionamentos do schema.
- [Mapa das rotas](docs/api-rotas.md): endpoints e telas encontrados no código.
- [Hospedagem e deploy](docs/setup/vercel.md) e [atribuições de terceiros](THIRD_PARTY_NOTICES.md).

## Funcionalidades

| Área | Recursos |
| --- | --- |
| Descoberta | Home com capas reais, destaques, rankings, busca, filtros e Atlas do acervo |
| Conta | Cadastro, confirmação por e-mail, recuperação de senha, login Google e lembrar de mim |
| Perfil | Informações pessoais/endereço, foto completa otimizada, carteirinha animada e livros salvos |
| Circulação | Reserva, compra, aluguel, extensão e acompanhamento em Meus Pedidos |
| Checkout | Endereço por CEP, retirada/entrega, cotação e confirmação por pressionamento |
| Comunidade | Favoritos sincronizados, estrelas de 1 a 5 e comentários moderados |
| Atendimento | Conversas persistidas, respostas da equipe e encerramento |
| Administração | Acervo, estoque, pedidos, entregas, atrasos, financeiro, usuários e avaliações |

O catálogo foi verificado com **131 livros** na publicação. Esse total pode mudar pela administração. Preços e estoque de catálogo precisam ser conferidos antes de uso comercial.

## Tecnologias

- **Frontend:** React 19, Vite 8, React Router 7, Tailwind CSS 4 e CSS de componentes; Axios para a API.
- **Visual:** GSAP, Three.js/React Three Fiber, Recharts, Lucide e fontes locais Source Serif 4 e IBM Plex Sans.
- **Backend:** Node.js, Express 5, Prisma 5.22, bcryptjs, Google Auth Library, Nodemailer 10.1.1, Multer e Sharp.
- **Infraestrutura:** Vercel Services, Neon/PostgreSQL e Vercel Blob público/privado.
- **Integrações:** Google Identity Services, Gmail SMTP, openrouteservice/HeiGIT, ViaCEP e consulta bibliográfica por ISBN.
- **Qualidade:** Node Test Runner, Vitest, Testing Library, Playwright e ESLint.

As versões instaladas ficam nos dois `package-lock.json`. Nem toda dependência instalada é usada pelo fluxo atual: os recursos antigos de remoção de fundo, por exemplo, não são executados pelo editor de foto.

## Estado das integrações

| Recurso | Situação documentada |
| --- | --- |
| Frontend, API e PostgreSQL | Publicados; catálogo consultado e painel autenticado verificado |
| Login Google | Login real validado na origem de produção |
| Gmail | SMTP verificado; teste real recebido na caixa de entrada do remetente |
| Fotos | Armazenamento privado; imagem inteira e fundo preservados |
| Frete ORS | Configurado; cotação externa real verificada localmente, sem nova compra/cotação de produção nesta documentação |
| Favoritos | Persistência + SSE; não utiliza WebSocket |
| Pagamentos | Código executável ainda integra Mercado Pago; cobrança real não homologada |
| Stripe | Migração pendente; variáveis preparatórias não constituem implementação |
| Cron | Configurado diariamente; disparo automático na plataforma ainda requer conferência de logs |

O sistema não coleta nem armazena número de cartão ou CVV. Segurar o botão cria o pedido, sem comprovar pagamento. A simulação de pagamento é recusada em produção.

## Executar com PostgreSQL próprio

Pré-requisitos: Node.js **22.12 ou superior compatível com Vite** (Node 24 no deploy recente), npm e PostgreSQL. Use uma base de desenvolvimento separada.

```powershell
npm run setup
Copy-Item .env.example .env
```

Edite `.env` antes de iniciar: `DATABASE_URL`, `AUTH_SECRET`, `CRON_SECRET`, URLs locais e, para o primeiro provisionamento local, `ADMIN_EMAIL` e `ADMIN_PASSWORD` fortes. Use segredos independentes de ao menos 32 bytes. A autenticação atual usa sessões no banco; `JWT_SECRET` é compatibilidade legada.

```powershell
npm run prisma:deploy
npm start
```

Em outro terminal:

```powershell
npm --prefix frontend run dev
```

Frontend: `http://localhost:5173`. API local: `http://localhost:3000`, sem `/api`. O frontend usa `VITE_API_URL` se definido; o build hospedado fixa `/api`.

O bootstrap administrativo roda no servidor local somente se não houver ADMIN. A importação serverless não executa esse bootstrap; definir variáveis na Vercel não cria automaticamente a conta no banco. Credenciais administrativas são privadas e não estão neste README.

### Demonstração isolada

```powershell
npm run demo
```

Usa PGlite e dados em `.local/database`, com e-mails em arquivo. Não equivale ao banco Neon publicado nem sincroniza seu catálogo automaticamente. Pode usar configurações próprias de demonstração; não o publique como produção.

## Testar sem alterar dados reais

```powershell
npm test
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build:hosted
node scripts/qa-environment.js --integration
node scripts/qa-environment.js --e2e-production
```

QA cria seu próprio banco, contas e portas. O primeiro E2E pode precisar de `npm --prefix frontend exec playwright install chromium`. Não aponte `API_TEST_URL` para produção. Os [relatórios de verificação](docs/verification) distinguem execuções e limites; não são certificação de segurança.

## Hospedagem

`vercel.ts` separa frontend Vite e backend Express no mesmo domínio; `/api/*` vai para `src/app.js`. O Prisma usa PostgreSQL Neon. Capas são públicas no Blob; retratos são privados e entregues pela API autenticada. O cron protegido `/api/internal/cron` está agendado para 06:00 UTC, equivalente a 03:00 em Brasília na data desta edição.

Segredos ficam nas variáveis protegidas da Vercel e em arquivos locais ignorados. Banco, mídia privada e credenciais não fazem parte do bundle. Ver [procedimento de deploy](docs/setup/vercel.md).

## Regenerar a documentação

Com Python e ReportLab disponíveis, execute `python scripts/docs/build_documentation.py`. O gerador atualiza dicionário, mapa de rotas, diagramas e PDF a partir do schema/código e do Markdown técnico. Não lê arquivos de credenciais nem acessa o banco. Para preparar uma instalação Python separada, a dependência é `python -m pip install reportlab`.

## Estrutura

```text
frontend/src/       Telas, layouts, componentes e recursos React
server.js          Rotas principais da API e inicialização local
src/app.js         Entrada Express para Vercel
src/routes/        Perfil, Google, favoritos, mídia e cron
src/services/      Sessões, pedidos, frete, mídia, e-mail e demais serviços
src/middleware/    Autenticação, CSRF e idempotência
prisma/            Schema PostgreSQL e migrações
scripts/           QA, demonstração, catálogo e migração de hospedagem
tests/             Testes de backend
frontend/e2e/      Testes de navegador
docs/              Documentação, proveniência e verificações
output/pdf/        Documento técnico exportado
```

## Créditos e direitos

Projeto acadêmico BiblioConnect. Equipe informada no material original: **Lucas Soares Silva, Adriano Mikhael e João Lucas**. O manifesto do backend declara ISC; componentes, fontes e dependências mantêm suas próprias licenças. Capas pertencem aos respectivos titulares. Consulte [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) e a proveniência em `docs/catalog`.

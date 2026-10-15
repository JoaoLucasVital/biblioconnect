# Conta, comunidade e checkout — entrega local parcial

**15/10/2026 — login Google local real:** projeto Google Cloud e branding OAuth criados; termos/política de dados aceitos pelo proprietário. Cliente Web local autorizado, com origens exatas `http://localhost:5173` e `http://localhost`. SDK oficial Google Auth 11.3.0 instalado e carregado. `GET /auth/config` confirmou cliente real habilitado; botão GIS carregou pelo domínio oficial. O proprietário confirmou a entrada e a home foi conferida autenticada como “Jão Dev”, com acesso a Meus pedidos. Nenhuma senha pessoal foi solicitada. A origem HTTPS da hospedagem e o frete por Routes API permanecem pendentes.

Correção descoberta nesta configuração: o cookie de desafio usava `/auth/google` fixo e não voltaria no caminho hospedado `/api/auth/google`. Teste reproduziu a falha; cookie e limpeza agora seguem `req.baseUrl`, mantendo escopo estreito em ambas as rotas. Testes focados 4/4 e regressão completa do backend 55/55, com 52 respostas HTTP, aprovados. Incluem verificação RSA real pelo SDK com certificado de teste em memória, rejeição de token alterado, nonce, expiração, replay, bloqueio e vínculo seguro. O teste criptográfico não equivale a uma credencial Google falsa na aplicação; o login real foi validado separadamente. A Routes API solicitou cadastro de faturamento/verificação de cartão, entregue ao proprietário no navegador; nenhum dado de cartão foi solicitado no chat ou preenchido pelo agente.

**15/10/2026 — banco e imagens hospedados:** autenticação CLI e navegador Vercel concluídas pelo proprietário, que também aceitou os termos Neon. Projeto BiblioConnect em Hobby; Neon Free e Blob público/privado em `gru1`, ligados a Preview/Production. Backup fechado `before-hosted-2026-10-15T03-22-30.225Z`, dry-run e migração executados. Conferidas contagens/hashes das 11 tabelas de negócio: 3 contas, 22 livros, 5 pedidos, 1 favorito, 5 eventos de favorito, 1 avaliação, 1 conversa e 2 mensagens; demais tabelas de negócio vazias. As 65 capas/variantes e um retrato tiveram SHA-256 conferido após transferência. IDs, relacionamentos, estoque/histórico e sequências preservados. Apenas na cópia hospedada: tokens locais invalidados, sessões temporárias excluídas e administrador com senha de demo bloqueado/sem senha. Credenciais pessoais e fonte local intactas. Não há aplicação publicada ainda; [estado atual da hospedagem](../setup/vercel.md).

O teste real enviou 4.824.545 bytes diretamente ao Blob privado, comprovou 403 anônimo, finalização em WebP/HTTP 200 e remoção do temporário. Artefatos desse teste foram removidos. Development foi autorizado temporariamente pelo proprietário e retirado depois. SDK Vercel Blob 2.8.2 instalado no backend/frontend; diagnóstico e template de configuração usam os nomes reais dos dois stores. Testes de migração cobrem destino errado/não vazio, rollback, FKs, hashes e avanço de sequência. Upload cobre propriedade/escopo/expiração, tamanho, pixels, formato, CSRF e papel administrativo. Build com API `/api` e lint aprovados. Regressão final: 54/54 testes backend + 52 respostas HTTP aprovados. React: 124/125 no primeiro run, um timeout no teste existente de busca; repetição isolada do arquivo sem mudar código/timeout passou 9/9. Novos testes de upload: 3/3. E2E de produção do cadastro por ISBN/edição de estoque: 1/1 aprovado. O aviso existente do chunk 3D continua. Não houve validação de Google/e-mail/Stripe/deploy nesta etapa.

**Ajuste de proporção solicitado em seguida:** prévia e área de imagem do cartão acompanham a proporção natural da foto, eliminando as faixas do quadro fixo 4:5 sem cortar o conteúdo. Teste geométrico reproduziu o problema e passou após a correção; inclui imagem horizontal 2:1 e prévia vertical 3:4. Lint aprovado.

**Correção posterior em 14/10/2026, solicitada pelo usuário:** o perfil agora mantém a foto inteira e o fundo original, sem recorte automático ou reconhecimento de rosto. O worker apenas redimensiona/reencodifica para WebP; o cartão usa `object-fit: contain`. Novos testes: 4/4 React, 2/2 E2E de produção e lint aprovados. O E2E comprova proporção e cores das bordas preservadas, ausência de chamadas a modelos/serviços externos, persistência e cancelamento sem perder a foto anterior. Fotos antigas que já tiveram o fundo removido precisam ser reimportadas a partir do original, pois esse original não era armazenado. As descrições de remoção de fundo abaixo documentam a entrega anterior e ficam substituídas por esta decisão.

Verificação em 14/10/2026. A execução continua no worktree `biblioconnect-editorial`. O plano completo ainda não está concluído: o proprietário confirmou que precisa criar/configurar as contas externas.

## Versão local integrada

- Frontend: `http://localhost:5173`; API: `http://localhost:3000`.
- Migração aditiva aplicada ao banco existente após confirmar as portas locais livres e ausência do processo persistente anterior. Nenhum reset ou seed repetido.
- Backup privado: `.local/backups/before-account-2026-10-15T01-09-46.383Z` na pasta original `biblioconnect`, contendo banco fechado, uploads e manifests.
- Comparação de hashes de todas as colunas originais das 8 tabelas antes/depois: idênticos. Preservados 22 livros, 3 contas e 5 pedidos, incluindo estoque, histórico e hashes de senha. As 65 mídias do backup tiveram checksums conferidos.
- Conferência HTTP na versão persistente: 22 livros, nenhuma capa com erro, frontend 200, login administrativo e perfil autenticado válidos, cron sem segredo rejeitado com 401. A sessão usada nessa conferência foi encerrada. A senha pessoal do usuário não foi solicitada nem redefinida; seu login pessoal não foi executado.
- As chaves locais de sessão e controle são persistidas em arquivo privado ignorado pelo Git. O runtime atual usa a API deste worktree, o banco/capas originais e retratos privados na pasta de dados original. Os serviços escutam somente em loopback.

## Verificação automatizada

| Verificação | Resultado |
| --- | --- |
| React/Vitest, suíte completa | 121/121 aprovados |
| Backend e integração com banco descartável | 46/46 aprovados; 52 respostas HTTP conferidas |
| `npm test` backend sem harness | 45 aprovados; integração HTTP ignorada deliberadamente nesse comando e executada com sucesso pelo harness |
| Playwright, build de produção | 58 testes aprovados em 22 grupos isolados; nenhuma falha |
| Lint frontend | Aprovado |
| Build frontend normal e build com API `/api` | Aprovados |
| `git diff --check` | Sem erros de whitespace |

A regressão de navegador cobriu administração/financeiro, compras/aluguéis/reservas, Atlas, home, navegação, dois leitores salvando livros, perfil/remoção de fundo, formulários, acessibilidade, falhas de rede, temas e resoluções pequenas. Foram usados dados de teste, não contas pessoais. Os grupos administrativos tiveram bancos separados para respeitar o limite real de tentativas de login.

O build informa chunk grande da cena 3D, que já é carregada sob demanda. Há avisos de depreciação das dependências Three em testes; nenhum desses avisos causou falha. As métricas editoriais são medições locais sem throttling e incluem automação; não representam desempenho de produção.

## O que está integrado

Sessões em cookie HttpOnly/CSRF e lembrar de mim; estrutura de identidade Google com vinculação protegida; tokens de confirmação/reset com hash; provedores de e-mail; perfil editável com retrato privado WebP e remoção de fundo local; favoritos persistentes com atualização por SSE; avaliação por estrelas; compra por pressão de 1,2 segundo; partículas globais; digitação visual sem atrasar o valor real dos campos; frete validado no servidor; proteção contra pedidos repetidos; servidor exportável e cron autenticado.

As operações atuais sem o header de idempotência continuam compatíveis. A interface nova sempre envia uma chave, preservada após falha de rede/reload; registros no servidor são retidos por 90 dias.

## Etapas ainda pendentes

1. **Google:** login local configurado e validado com Google real em 15/10; faltam origem/cliente HTTPS da hospedagem, ativação/faturamento da Routes API, credencial restrita e teste real de frete. Testes com respostas controladas não são prova de frete ativo.
2. **E-mail:** configurar remetente/provedor e comprovar recebimento externo de confirmação/reset. O runtime local atual grava mensagens em arquivo e não envia e-mail real.
3. **Stripe (tasks 9–10):** idempotência de pedidos concluída; SDK/PaymentIntents, webhook, cartão/Pix e formulário com giro ainda não implementados, conforme a dependência de conta/sandbox prevista no plano. Nenhuma cobrança real executada. A função legada de simulação local permanece explicitamente de demonstração.
4. **Hospedagem (task 11):** login, PostgreSQL/Blob, upload direto e migração conferidos em 15/10; ainda faltam URLs/segredos das demais integrações, acesso administrativo seguro e preview real. A configuração Services ainda precisa ser validada na plataforma autenticada.
5. **Fechamento (task 12):** revisão independente final do conjunto, testes reais/sandbox dependentes das contas e deploy. O plano permanece aberto; não houve merge, push ou publicação nesta continuação.

O acesso automatizado à aba local existente foi bloqueado pela política de URL do navegador ao tentar reabrir a aba de erro. Nenhuma rota alternativa de controle do navegador foi usada. A aplicação foi conferida por HTTP e pode ser aberta manualmente pelo endereço acima.

Próximo passo do proprietário: seguir o [guia de configuração das contas](../setup/2026-10-14-services.md). Nunca enviar chaves pelo chat. Preparação de hospedagem: [Vercel](../setup/vercel.md).

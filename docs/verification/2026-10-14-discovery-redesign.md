# Rodada de descoberta — BiblioConnect

Implementação autorizada pelo usuário em 14/10/2026 após revisão da composição. Branch `codex/biblioconnect-editorial`, baseada na rodada anterior `7e30ec9`. React/Tailwind, Express, contratos da API, Prisma e regras de negócio preservados.

## Resultado

- Home abre com Image Stream Hero: duas fileiras em perspectiva derivadas da fonte oficial Ruixen UI, usando somente livros disponíveis da API e as flags de destaque existentes. Movimento CSS de 26s, até 12 livros, sem loop JavaScript por quadro. Pausa manual, por foco/hover, aba oculta, saída da área visível e preferência por movimento reduzido.
- A vitrine exibe até oito livros com capas maiores e gêneros intercalados. Dark romance, suspense, romance e fantasia aparecem entre os primeiros destaques. Links das capas abrem o catálogo com busca preenchida e âncora da listagem. Clássicos continuam acessíveis.
- Scroll Expand na vitrine desktop, Animated Content nas entradas de seção, Click Spark no CTA de descoberta e Star Border no convite ao Atlas foram adaptados à infraestrutura existente. Efeitos preservam conteúdo e ações com movimento reduzido. A cena 3D anterior permanece secundária com seus fallbacks.
- Atlas movido para o topo de /livros, acima do catálogo convencional, preservando seleção, busca, categorias, teclado, lista mobile e mapa limitado a 48 pontos. Consultar um livro filtra a listagem abaixo, sem recarregar a página. Falha de API mostra mensagem e tentativa, sem falso estado vazio.
- Menu compacto Card Nav abaixo de xl, com três painéis por papel e os mesmos destinos. Diálogo nativo protege foco, Escape e retorno ao acionador; rolagem própria, safe areas, transições por ponteiro e abertura imediata por teclado/reduced motion.
- Dashboard com quatro KPIs principais, gráfico operacional, coluna de pendências e leitores, rankings horizontais com títulos completos e atalhos. Todos os indicadores e a ação de reset restrito foram preservados. Nenhum reset foi executado.

## Acervo persistente

Dez novos livros, ids100–109: Corrupt, Hideaway, A empregada, A hipótese do amor, Verity, O príncipe cruel, Corte de espinhos e rosas, Os sete maridos de Evelyn Hugo, Jantar secreto e A Biblioteca da Meia-Noite. Acervo12→22; flags de destaque34–36 desativadas com autorização. Demais dados originais e demais tabelas preservados por comparação com snapshot lógico. Todas as dez capas retornaram HTTP200. Seed idempotente22→22, sem novas alterações.

Fontes editoriais, ISBNs, preços/estoque de apresentação, classificação de conteúdo, snapshot, hashes e limites dos recursos visuais estão em `docs/catalog/2026-10-14-contemporary-acervo.md`. Capas mantêm os direitos de seus titulares; não há texto integral de livros incorporado.

## Verificação

- Frontend: **79 testes em 15 arquivos aprovados** (`rtk npm test`).
- Navegador Chromium com build de produção e banco descartável separado: **50/50 aprovados em 2,1 min**, incluindo compra, aluguel, reserva, pagamentos demonstrativos, comprovantes, recuperação, atendimento, administração, permissões, tema, responsividade, movimento reduzido, falha de rede, digitação e 48 cliques reais no mapa com 200 livros.
- Depois do último ajuste de links e da regressão por Tab, os seis cenários de descoberta e navegação passaram novamente com build de produção fresco.
- ESLint completo aprovado. Build de produção aprovado; os avisos preexistentes do módulo Three/BookScene permanecem. Nenhuma dependência adicionada.
- Testes de intenção foram observados falhar antes da implementação: nova posição da hero/Atlas, diversidade de gêneros na vitrine e estado de falha do catálogo. CardNav teve ciclo próprio de testes antes/depois.
- Uma revisão independente em GPT-6 Astra encontrou links invisíveis na lista sr-only da hero. Corrigido mantendo títulos/autores como texto não interativo. Regressão por Tab adicionada ao cenário de descoberta. Nenhum outro problema concreto foi identificado na revisão de código.
- O teste de mapa denso mantém os 48 cliques e a checagem de hit-test. A serialização de toda a árvore dos 200 livros por ação tornava o trace dominante; somente o arquivo de testes do Atlas desativa trace, preservando screenshots em falhas. O mesmo cenário passou em 2,9 s sem essa instrumentação. Outros testes mantêm trace em falhas.
- Inspeção da versão persistente em desktop e 360px, temas claro/escuro, com dados reais. Capturas em `docs/design-references/2026-10-14/`: home-discovery-light.jpg, card-nav-mobile.jpg, dashboard-refresh-light.jpg e dashboard-refresh-mobile.jpg.

## Identidade e continuidade

Nova prancha `docs/design-references/2026-10-14/logo-new-directions.png`: Entrelinhas, Elo e Margem. Gerada com Imagegen integrado e orientação Brandkit; prompt salvo no arquivo Markdown correspondente. É uma exploração visual, ainda sem escolha nem reconstrução SVG. A marca antiga permanece provisoriamente no produto; não foi reaprovada.

`THIRD_PARTY_NOTICES.md` registra Ruixen UI MIT e React Bits MIT+Commons Clause. shadcn/ui e Tremor serviram como referências de composição do dashboard, implementado com Recharts já existente.

Versão integrada: http://localhost:5173 , API http://localhost:3000 , banco persistente original via socket127.0.0.1:55440. Início pela pasta deste worktree: `rtk proxy node .superpowers/start-persistent.mjs`. Os testes não usaram esse banco. Não houve deploy, push ou PR nesta rodada; a publicação no fork continua pendente do acesso GitHub normal, sem sondagem de credenciais.

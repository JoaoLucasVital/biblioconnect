# Segunda rodada visual — referências para avaliação

Data: 14/10/2026. Estado: proposta e plano escrito aprovados; segunda rodada integrada e em verificação final.

## Decisões do usuário nesta rodada

- Substituir o controle claro/escuro por [jolly-chicken-91, RiccardoRapelli](https://uiverse.io/RiccardoRapelli/jolly-chicken-91), mantendo a preferência persistida, foco visível e nome acessível.
- Usar o segundo botão, Interactive Hover Button da Magic UI; rejeitar o botão STORM992002. [Fonte oficial](https://magicui.design/docs/components/interactive-hover-button).
- Loading Nawsome e referências de texto aprovados. Digitação com valor imediato e fade visual aprovada.
- Criar a nova marca. [Três propostas produzidas](logo-concepts.png); proposta 03 aplicada provisoriamente à prévia após ausência de preferência, suposição comunicada. A escolha do usuário continua aberta, sem registrar aprovação fictícia.
- Reutilizar expressamente o banco existente e cadastrar livros. Operação concluída: 11 livros novos, registro anterior preservado, **12 livros** após reinício e nova carga sem duplicatas.
- Seguir com a composição recomendada: Atlas protagonista, linguagem editorial contemporânea, cores mantidas e funções existentes preservadas.

O plano de execução está em `../../superpowers/plans/2026-10-14-biblioconnect-atlas-plan.md`. Abaixo fica preservado o raciocínio da proposta e das referências, com as decisões acima prevalecendo sobre os candidatos inicialmente apresentados.

## Pedido atualizado

O usuário rejeitou a simplicidade da primeira implementação e pediu uma expressão mais marcante, mantendo React, Tailwind, funcionalidades e integração Prisma. Autorizou pesquisar a tarefa `BiblioConnect Redesign.` e trazer suas quatro imagens, com interesse explícito no Atlas do Acervo. Pediu nova logo, componentes Uiverse/21st, loading, animação por caractere e livros gravados em banco persistente. Quer avaliar os links antes da implementação visual. Deploy online é uma etapa posterior, com a apresentação de dezembro como objetivo.

O pedido atual substitui a obrigação anterior de preservar o logotipo. Paleta creme, marinho e laranja continua sendo a referência. A outra tarefa também contém funcionalidades novas; seus códigos e alterações de banco não serão incorporados por associação com as imagens.

## As quatro imagens recuperadas

Origem: tarefa `BiblioConnect Redesign.`, id `01a0d028-5d2f-73e0-a36f-5d315f4d40e5`, projeto JãoDev; arquivos originais em `biblioconnect-redesign/.impeccable/mocks/decision`. Cópias sem transformação, utilizadas somente como referências de composição. Dados, usuários e indicadores nas imagens são ilustrativos.

| Imagem | O que aproveitar | Limite |
| --- | --- | --- |
| [Atlas do Acervo](challenger-star-atlas.png) | Marinho profundo, mapa de pontos e conexões, categorias, capas em faixa e destaque laranja | Pontos precisam representar livros/categorias reais; estatísticas e estados não podem ser inventados |
| [Espinha de Classificação](assigned.png) | Navegação por categorias, busca forte, organização de indicadores e destaques | Não existe classificação Dewey no contrato atual; usar categorias existentes |
| [Balcão de Circulação](model-pick.png) | Ações claras, busca, tabelas e painel operacional bem organizado | Não adicionar fila de atendimento, atalhos ou fluxo de empréstimo presencial sem decisão própria |
| [Visão geral](canon.png) | Sidebar, capas pequenas nas listas, resumos e coluna de acompanhamento | Mostrar somente dados disponíveis e ações que já existem |

## Proposta de composição

Recomendação: Atlas como assinatura principal da experiência pública de descoberta, com acesso à busca/lista convencional e aos fluxos já existentes. Categorias formam constelações; livros são pontos selecionáveis. Seleção revela capa, título, autor e disponibilidade, com caminho para a operação existente. Linhas representam relações verificáveis (mesma categoria/autor); não prometer recomendações semânticas de IA.

Alternativa: abertura com livro 3D e Atlas em uma seção/página Explorar. Preserva a home editorial com uma experiência espacial separada, porém reduz a presença imediata do Atlas.

Administração: incorporar a densidade e a organização das outras três imagens, mantendo pedidos, usuários, acervo, atendimento e financeiro existentes. Dados administrativos privados nunca entram no mapa público. A lista convencional continua disponível para teclado, leitores de tela, telas pequenas e preferência por movimento reduzido.

## Componentes candidatos — precisam de avaliação

| Uso | Link | Proposta |
| --- | --- | --- |
| Hero com imagens em movimento | [Image Stream Hero, Ruixen](https://21st.dev/@ruixen.ui/components/image-stream-hero) | Referência de composição e movimento de capas; adaptar ao marinho/laranja, sem importar outra identidade |
| Constelações | [Constellation Grid, Daiwiik Harihar](https://21st.dev/@daiwiikharihar/components/constellation-grid) | Referência visual; é uma malha física de canvas, não um mapa funcional de livros. O Atlas exige seus próprios dados e interações |
| Botão com preenchimento em hover | [STORM992002, Uiverse](https://uiverse.io/STORM992002/neat-dog-73) | Rejeitado pelo usuário; não incorporado |
| Botão com troca de texto/seta | [Interactive Hover Button, Magic UI](https://21st.dev/@dillionverma/components/interactive-hover-button) | Ação principal de explorar, com resposta equivalente por foco e toque |
| Loading de livro | [Nawsome, Uiverse](https://uiverse.io/Nawsome/curly-goose-54) | Livro com páginas animadas; adaptar para marca e usar só durante carregamento real, sem espera artificial |
| Animação por caractere | [Split Text](https://reactbits.dev/text-animations/split-text) e [Blur Text](https://reactbits.dev/text-animations/blur-text) | Referências de revelação de texto; não são componentes de input prontos |

Páginas consultadas em 14/10/2026. Uiverse e os dois componentes 21st consultados indicam MIT; confirmar e registrar a atribuição da versão efetivamente copiada antes de incorporá-la. A instalação pelo registro 21st consultado requer chave própria; a pesquisa atual não exige instalar nem contratar nada.

## Nova logo — direções para discutir

1. **BC constelação (recomendada):** monograma legível que usa poucos pontos e ligações para formar partes do B/C; funciona em uma cor, favicon e avatar.
2. **Livro e órbita:** páginas abertas e um percurso orbital único; ligação direta entre biblioteca e Atlas.
3. **Marca tipográfica:** BiblioConnect com desenho próprio de B/C e um símbolo compacto derivado dessas letras.

Uma prancha com três propostas já foi produzida em claro/escuro e com aplicação pequena. A escolha ainda não foi respondida. Evitar estrela genérica de IA, símbolos excessivamente finos e detalhes que desapareçam em 24 px. A proposta selecionada será traduzida para SVG e favicon legíveis.

## Digitação com fade

Entendimento: revelação suave de caracteres novos, semelhante à descrição visual do usuário; não foi fornecida uma referência exata de comportamento Apple. Não apresentar esse efeito como componente oficial da Apple.

Proposta para avaliação: o valor do input atualiza imediatamente; apenas a aparição do caractere recebe fade curto (aproximadamente 160–220 ms), sem fila crescente. Começar com busca/nome em demonstração focada. Colar, apagar, selecionar, posicionar cursor, autofill e composição de acentos devem funcionar sem atraso. Senhas permanecem com o comportamento nativo; movimento reduzido desliga o efeito. Animar títulos/resultados com Split Text ou Blur Text não resolve sozinho a animação dentro de um input.

## Execução com dados persistentes

Constatado: existe `biblioconnect/.local/database`; o worktree editorial não tem banco persistente próprio. Nenhum `.env` de backend/frontend foi encontrado nas duas versões verificadas. O script existente `scripts/demo.js` inicia PGlite persistente + servidor + frontend, mas resolve tudo a partir da pasta em que está salvo. Abrir esse script no repositório original exibiria o frontend original, não automaticamente o worktree editorial.

O usuário escolheu reutilizar esse banco. Frontend editorial em `http://localhost:5173`, API original em `http://localhost:3000` e PGlite persistente PostgreSQL compatível em `127.0.0.1:55440`, usando os dados originais. Foram cadastrados Dom Casmurro, Memórias Póstumas de Brás Cubas e O Cortiço por chamadas autenticadas da API, incluindo upload de capas. O livro anterior permaneceu intacto. Após reiniciar, a API retornou quatro livros; repetir a carga criou zero duplicatas. Não foram alterados schema, usuários, pedidos ou pagamentos. Evidência em `../../verification/2026-10-14-persistent-acervo.md`.

Conjunto inicial proposto: clássicos como Dom Casmurro, Memórias Póstumas de Brás Cubas e O Cortiço, com títulos/autores/capas existentes verificados, mais obras de outras categorias para exercitar o Atlas. Preços e quantidades serão dados configurados para a apresentação, sem alegação de estoque comercial real. A escolha definitiva do conjunto acompanha a preparação do acervo.

Execução no computador continua sendo local; o que muda é ter frontend, backend e dados persistentes integrados. Isso é diferente de um deploy público e não deve ser chamado de homologação de produção.

## Caminho para o deploy posterior

[Vercel suporta Express](https://vercel.com/docs/frameworks/backend/express), mas o aplicativo utiliza `express.static`/uploads em disco e uma rotina contínua de atraso. A documentação consultada informa que `express.static` é ignorado nesse ambiente. Portanto, publicar somente o frontend não basta para o sistema completo.

Proposta a decidir depois: frontend Vercel, API em execução Node adequada aos jobs e uploads, PostgreSQL gerenciado mantendo Prisma; ou adaptar API/armazenamento/jobs ao ambiente serverless. A [integração Prisma/PostgreSQL do Neon](https://neon.com/blog/better-postgres-with-prisma-experience) é uma opção a avaliar. Não criar contas, serviços pagos ou deploy nesta etapa de seleção visual.

## Próxima decisão

O plano concreto foi revisado e aprovado pelo usuário e executado inline. A prévia usa o banco existente e recebeu a aplicação provisória da marca 03. A avaliação visual da nova composição e a preferência definitiva da logo permanecem abertas; deploy e integração por PR são etapas posteriores.

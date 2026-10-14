# BiblioConnect — repaginação editorial contemporânea

Data: 13/10/2026. Estado: especificação escrita aprovada pelo usuário; Uiverse incluído por solicitação explícita na mesma revisão.

## 1. Objetivo e limites

Repaginar a **biblioconnect original** para a apresentação acadêmica de dezembro de 2026. Entregar uma interface profissional, responsiva e coerente com uma biblioteca, mantendo as funcionalidades existentes e a integração com o banco.

O usuário aprovou a direção editorial contemporânea e a composição proposta para home, catálogo, navegação, diálogos e movimento. Esta especificação consolida esse desenho e explicita a preservação do restante do sistema.

- Manter React, Express, Prisma, PostgreSQL, contratos HTTP e URLs existentes.
- Migrar o frontend de CSS convencional para Tailwind, por áreas verificáveis.
- Manter a paleta e a identidade do BiblioConnect, inclusive o logotipo existente.
- Incluir GSAP, textos animados e uma cena 3D de livro vinculada ao acervo real.
- Preservar os dados existentes; a repaginação não requer migrations, resets ou seeds.
- Novas funcionalidades de negócio, uma biblioteca pessoal de leitura e um leitor digital não fazem parte desta etapa.
- A pasta `biblioconnect-redesign` não é a base e não terá suas alterações incorporadas automaticamente.

## 2. Tecnologia e arquitetura

A base atual usa React 19, JavaScript/JSX, Vite, React Router, Axios e Recharts. Permanecer em JavaScript/JSX nesta etapa: TypeScript não é necessário para o objetivo aprovado.

Adicionar Tailwind com sua integração ao Vite, GSAP com `@gsap/react` e Three.js com React Three Fiber. As versões serão selecionadas pela compatibilidade com as dependências atuais e fixadas no lockfile. Usar apenas as dependências necessárias para os componentes escolhidos.

Separar responsabilidades sem substituir as regras existentes:

- **Layouts público, cliente e administrador:** navegação, estrutura da página e adaptação ao tamanho da tela. Continuam subordinados ao contexto e às proteções de rota existentes.
- **Componentes compartilhados:** botão, campo, mensagem de estado, diálogo, capa, etiqueta de status e tabela responsiva.
- **Catálogo:** filtros, cards e diálogos de compra, aluguel e reserva. Consultas e submissões continuam usando a instância existente de Axios.
- **Home:** composição editorial, destaques, rankings e módulo 3D carregado sob demanda.
- **Demais páginas:** reutilizam os componentes e tokens, mantendo suas consultas, cálculos, validações e ações.

Fluxo de dados: API existente → estado React → componente visual. Ações do usuário → validação de interface existente → mesma API → resultado confirmado → atualização de estado ou navegação existente. GSAP e Three.js controlam a apresentação; não confirmam pedidos, pagamentos ou mudanças de estoque.

Preservar `VITE_API_URL`, envio de Bearer token, carregamento de `/me`, confirmação e recuperação de conta, logout e verificações de papel. Não alterar a estratégia de autenticação como parte da repaginação. Ocultar um item de navegação não substitui autorização no servidor.

## 3. Sistema visual

### Paleta

| Uso | Cor preservada |
| --- | --- |
| Fundo | `#fff7ed` |
| Superfície | `#ffffff` |
| Texto | `#1e293b` |
| Texto secundário | `#64748b` |
| Azul-marinho principal | `#1e3a5f` |
| Laranja de destaque | `#e67e00` |
| Laranja de interação | `#c96a00` |
| Borda e superfície suave | `#fed7aa`, `#ffedd5` |

Representar a paleta por tokens Tailwind. Escolher combinações de texto e fundo que preservem contraste legível; botões laranja podem usar texto escuro. Manter as cores semânticas necessárias para erro, sucesso e aviso.

### Tipografia e composição

- **Source Serif 4:** títulos e chamadas editoriais.
- **IBM Plex Sans:** navegação, campos, ações, números e texto funcional.
- Servir os arquivos de fonte localmente, com fallback e `font-display: swap`.
- Usar grade editorial, margens generosas, linhas divisórias finas e legendas curtas. Capas, títulos e autores orientam a composição.
- Manter hierarquia consistente; evitar que cada bloco concorra com o conteúdo principal.
- Cards com proporção de capa consistente, título legível, espaçamento adequado e indicação de disponibilidade. Preservar acesso aos metadados e à sinopse existentes, inclusive em títulos longos.
- A interface permanece clara nesta etapa; alternância de tema não será adicionada.

## 4. Home

O cabeçalho público apresenta marca, início, catálogo e acesso à conta. Após autenticação, expõe pedidos e atendimento ou acesso ao painel, conforme o papel.

A abertura combina chamada editorial, acesso direto ao catálogo e um livro 3D do acervo. Manter as ações condicionais já existentes: cadastro para visitantes, pedidos para clientes e painel para administradores.

Usar títulos e capas reais de `/livros`, respeitando `disponivel` e a seleção existente de destaques. A seleção do livro mantém controles visíveis com nomes acessíveis. Preservar a alternância automática de destaques, com pausa durante foco, interação, movimento reduzido e página oculta.

Abaixo da abertura, apresentar os destaques e os rankings reais de `/public/home-insights` em composições complementares. Ausência de rankings não vira estatística inventada; apresentar um estado adequado aos dados recebidos. Catálogo vazio, imagem ausente, carregamento e falha de consulta têm apresentação explícita.

O livro 3D usa volume, lombada, páginas e iluminação discreta. A capa vem do livro selecionado quando puder ser usada como textura. Falha de textura, ausência de capa ou incompatibilidade WebGL apresenta uma alternativa editorial estática com os mesmos dados e ações. A informação principal e os links permanecem em HTML acessível.

Carregar o módulo 3D depois do conteúdo principal, sem exigir download de Three.js nas demais rotas. Parar a renderização contínua quando a cena não estiver visível ou a aba estiver oculta. Movimento reduzido e telas pequenas usam a alternativa estática como padrão.

## 5. Catálogo e operações

Dar prioridade à busca, aos filtros existentes e às capas. Preservar a lógica de busca e filtros por categoria e tipo, incluindo limpar filtros. Nenhuma nova API de busca ou regra de ordenação é necessária nesta etapa.

Cada card mantém autor, categoria, preços, estoque, período incluso e valor de dias extras, conforme os dados atuais. Compra recebe maior destaque; aluguel e reserva têm ações secundárias claras, e avaliações permanecem acessíveis. Estados indisponíveis mantêm as condições atuais, inclusive o bloqueio de reserva para livros doados.

Os diálogos passam a compartilhar estrutura, foco, fechamento e feedback:

- **Compra:** retirada ou entrega, endereço, cotação, frete e total; mantém a exigência de cotação antes de confirmar entrega.
- **Aluguel:** dias escolhidos, dias extras, preço e previsão de devolução; preserva os cálculos e a submissão atuais.
- **Reserva:** data de retirada e informações de prazo/multa existentes.

Manter `/comprar`, `/alugar`, `/reservar`, `/entrega/cotacao` e os payloads existentes. A confirmação continua levando a `/pedido-confirmado/:id`. Erros preservam o preenchimento relevante, mostram a resposta do servidor e permitem tentar novamente. Submissões em andamento apresentam feedback e não são disparadas repetidamente.

## 6. Cliente, autenticação e administração

Aplicar o mesmo sistema visual aos fluxos abaixo, preservando seus comportamentos e URLs:

| Área | Rotas existentes | Preservação obrigatória |
| --- | --- | --- |
| Público | `/`, `/livros`, `/livros/:id/avaliacoes` | Acervo, filtros, destaques, rankings e avaliações |
| Conta | `/login`, `/cadastro`, `/esqueci-senha`, `/redefinir-senha/:token` | Entrar, cadastrar, confirmação/reenvio e recuperação de conta |
| Cliente | `/meus-pedidos`, `/pedido-confirmado/:id`, `/comprovante/:id`, `/chat` | Detalhes, pagamento, comprovante, cancelamento/extensão conforme regras existentes e atendimento |
| Painel | `/admin`, `/admin/financeiro` | Indicadores, gráficos e informações financeiras provenientes da API |
| Acervo | `/admin/livros`, `/adicionar-livro`, `/editar-livro/:id` | Cadastro, edição, imagem, ISBN, preços, disponibilidade e estoque |
| Operações | `/admin/pedidos`, `/admin/atrasos`, `/admin/entregas` | Gestão de pedidos, atraso, entrega e ações existentes |
| Gestão | `/admin/usuarios`, `/admin/avaliacoes`, `/admin/chat` | Gestão de contas, moderação e atendimento administrativo |
| Rota desconhecida | `*` | Página de erro com caminho de retorno útil |

O painel usa navegação lateral agrupada por atividade, sem remover itens. Em telas pequenas, essa navegação vira um menu acionável por botão. Tabelas mantêm todas as informações e ações; quando necessário, usam rolagem interna ou apresentação adaptada ao celular.

Mercado Pago, e-mail, Google Maps e consulta de ISBN permanecem integrados como hoje. Modo demonstrativo continua claramente identificado; aprovação visual não simula confirmação real de pagamento.

## 7. Movimento, acessibilidade e acabamento

Aplicar `emil-design-eng` ao acabamento, `animate` às decisões de movimento e `animation-performance` à execução.

- Pressão por ponteiro: feedback sutil, cerca de 120–160 ms.
- Diálogos e menus: entrada de 180–240 ms, saída mais curta, com curvas que respondem imediatamente à interação.
- Abertura editorial: apresentação coordenada de aproximadamente 400–600 ms; os links e o conteúdo não esperam a animação terminar para funcionar.
- Busca, digitação, filtros frequentes e navegação por teclado não ganham atrasos decorativos.
- Usar GSAP para sequências coordenadas; transições CSS/Tailwind para feedback simples. Evitar bibliotecas de animação redundantes.
- Limpar timelines, ScrollTriggers e listeners ao desmontar componentes; permitir interrupção de transições.
- Respeitar `prefers-reduced-motion`; manter texto e informação completos sem efeitos.
- Aplicar hover apenas em dispositivos com ponteiro adequado. A operação por toque permanece independente do hover.
- Garantir foco visível, rótulos de campos, mensagens de estado, navegação por teclado, Escape e retorno de foco nos diálogos.
- Verificar textos longos, nomes extensos, erro de imagem, listas vazias, falta de estoque e falhas de rede.

## 8. Migração e referências

Migrar estilos por área, mantendo uma camada temporária de compatibilidade para telas ainda não convertidas. Remover cada regra legada após migrar e verificar seus consumidores. Ao final, Tailwind será a base de layout e estilo; CSS residual fica limitado a tokens, estilos globais necessários e efeitos específicos documentados.

Usar Uiverse e 21st.dev para estudar e selecionar componentes, React Bits para efeitos pontuais e as documentações oficiais de GSAP/Three.js para integração. Selecionar peças que se encaixem na identidade aprovada, adaptando estilo e comportamento. Conferir licença e compatibilidade antes de incorporar código ou assets. A seleção não é determinada pela popularidade de um vídeo.

O Uiverse será fonte de componentes Tailwind, especialmente botões, campos, controles de seleção e carregamento. Incorporar somente as peças escolhidas como componentes React locais, adaptadas à paleta, à semântica e aos estados de teclado, erro, desabilitado e carregamento. Para código efetivamente copiado, registrar URL da peça, autor e texto da licença MIT em um arquivo de atribuições. O site não acrescenta uma dependência de execução obrigatória ao sistema.

Referências:

- [Uiverse](https://uiverse.io/)
- [Uiverse — campos](https://uiverse.io/ui/input-fields)
- [Uiverse — botões animados](https://uiverse.io/ui/animated-buttons)
- [Uiverse — carregamento em Tailwind](https://uiverse.io/ui/tailwind-loaders)
- [21st.dev — componentes GSAP](https://21st.dev/community/components/explore/gsap-components)
- [React Bits](https://reactbits.dev/)
- [GSAP em React](https://gsap.com/resources/React/)
- [React Three Fiber](https://r3f.docs.pmnd.rs/getting-started/introduction)
- [Source Serif 4](https://fonts.google.com/specimen/Source+Serif+4)
- [IBM Plex Sans](https://fonts.google.com/specimen/IBM+Plex+Sans)

## 9. Validação e critérios de entrega

### Baseline verificada em 13/10/2026

- `node --test tests/business.test.js tests/cors.test.js tests/services.test.js`: **11 testes passaram**. A primeira execução teve bloqueio de conexão local pelo sandbox; a repetição sem essa restrição passou sem alteração de código.
- `npm --prefix frontend run lint`: passou, sem diagnósticos.
- `npm --prefix frontend run build`: passou. CSS gerado: 75,58 kB (12,92 kB gzip); entrada JS: 277,14 kB (90,40 kB gzip). São referências de tamanho, não medições de velocidade ou consumo de tokens.
- Integração com banco, inspeção visual no navegador, pagamentos reais e desempenho em dispositivos físicos **não foram executados nesta etapa**.

### Entrega

1. Todas as rotas e ações da matriz continuam acessíveis aos mesmos papéis; nenhum fluxo depende de dados fictícios.
2. Compra, aluguel, reserva, entrega, pagamento, moderação e chat mantêm contratos e resultados esperados. As regras de estoque e preços continuam verificadas pelo servidor.
3. Lint, build e testes existentes passam. Acrescentar verificações de regressão significativas para navegação, filtros, diálogos e autorização; evitar testes que apenas repetem a implementação.
4. Executar testes com banco somente contra uma instância temporária isolada, com contas e acervo próprios. Não usar o PostgreSQL real nem o banco persistente `.local/database` para testes que inserem ou alteram registros. Não executar reset ou seed sobre dados existentes.
5. Verificar visualmente larguras de 360, 768 e 1440 px; navegação por teclado; dados extensos; movimento reduzido; falha de WebGL e imagens; estados vazios e erros.
6. Three.js não integra o carregamento inicial das rotas operacionais. O conteúdo e as ações da home funcionam antes da cena estar pronta.
7. Comparar carregamento e responsividade com a baseline durante a implementação e registrar resultados medidos. Validar toque/desempenho em aparelho físico quando disponível, distinguindo essa evidência de emulação.
8. Documentar configuração, execução e limites da demonstração para a apresentação. Integrações externas sem credenciais ou sandbox homologado serão identificadas como não verificadas; build e testes unitários não equivalem a uma auditoria de segurança completa.

## 10. Contexto, modelos e próximo estágio

Usar token-efficiency, RTK e CodeGraph para consultas delimitadas, sem leituras redundantes ou alegações de economia não medida. Registrar decisões e evidências em documentos curtos.

A divisão recomendada é GPT-6.1 Sol em esforço medium para implementação cotidiana e GPT-6 Astra em esforço high para direção detalhada e implementação isolada da cena 3D. GPT-6 Luna pode executar tarefas pequenas e bem especificadas. Delegação será restrita a tarefas independentes, com contexto mínimo e responsabilidade clara por arquivos.

A especificação escrita foi aprovada. O próximo estágio é revisar o plano de implementação com arquivos, tarefas e verificações concretas e escolher o método de execução antes de implementar.

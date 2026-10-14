# BiblioConnect: editorial contemporâneo

Autoridade: especificação e plano aprovados pelo usuário. A identidade está definida; esta execução concretiza o desenho em código e não abre uma nova seleção de conceitos.

## Linguagem

Uma composição de catálogo editorial: títulos, autores e capas reais, grade assimétrica na home e hierarquia clara nas páginas operacionais. A abertura destaca um livro com cena física simples; navegação e operações permanecem em HTML acessível. Evitar blocos repetitivos que competem com os livros, contadores decorativos, efeitos permanentes e claims comerciais inventados.

## Tokens

Paleta clara: fundo `#fff7ed`, superfície `#ffffff`, texto `#1e293b`, secundário `#64748b`, marca `#1e3a5f`, acento `#e67e00`, interação `#c96a00`, borda `#fed7aa`, suave `#ffedd5`. Preservar também a alternância de tema já existente e seus tokens escuros; claro é o padrão.

Source Serif 4 em títulos; IBM Plex Sans em interface e texto funcional. Fontes locais, display swap, títulos com altura adequada a acentos/descendentes. Largura de conteúdo até 1280 px; margens 20 px em telas pequenas, 32–48 px nas maiores. Controles com pelo menos 44 px de altura. Bordas discretas; raios pequenos de 6–10 px em controles, evitando transformar toda superfície em cartão.

## Composição e superfícies

- Home: descoberta, com acesso direto ao catálogo, livro protagonista, destaques e rankings reais. Dials de referência: DESIGN_VARIANCE 6, MOTION_INTENSITY 4, VISUAL_DENSITY 3.
- Catálogo e conta: operar; capas e filtros legíveis, ações e estados inequívocos. Densidade moderada; nenhuma entrada decorativa a cada consulta.
- Administração: operar; sidebar e tabelas orientadas a tarefas, com gráficos da API. Expressão da marca no tipo, cor e espaçamento.

## Interação

Botões respondem à pressão por ponteiro em 140 ms; foco por teclado é imediato e visível. Diálogos nativos de compra/aluguel/reserva mantêm foco protegido, Escape, retorno ao acionador e bloqueio de confirmação duplicada. Campos associam label, hint e erro ao controle. Erros mantêm o rascunho relevante.

GSAP coordena uma abertura de 400–600 ms. Conteúdo é visível e utilizável sem animação; reduzir movimento conserva a informação. Cena 3D carregada apenas na home, alternativa estática em telas pequenas, movimento reduzido, erro de textura ou WebGL.

## Proveniência e verificação

Componentes Uiverse são adaptados à mesma paleta e semântica. Código copiado é registrado em `THIRD_PARTY_NOTICES.md`. Verificação visual em rodadas limitadas com desktop e celular juntos; detector mecânico no conjunto final, seguido da revisão independente. Atualizar este documento com a verdade final das superfícies antes da entrega.

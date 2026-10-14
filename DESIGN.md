---
name: BiblioConnect
description: Atlas editorial contemporâneo com livros conectados, descoberta espacial e operações claras.
colors:
  brand: "#1e3a5f"
  accent: "#e67e00"
  accent-hover: "#c96a00"
  primary-foreground: "#0f172a"
  paper: "#fff7ed"
  surface: "#ffffff"
  ink: "#1e293b"
  muted: "#5b6b80"
  stroke: "#fed7aa"
  soft: "#ffedd5"
  dark-paper: "#0f172a"
  dark-surface: "#1e293b"
  dark-ink: "#f8fafc"
  dark-muted: "#cbd5e1"
  dark-stroke: "#334155"
  dark-soft: "#172033"
  danger: "#b91c1c"
  danger-hover: "#991b1b"
typography:
  display:
    fontFamily: '"Source Serif 4", Georgia, serif'
    fontSize: "clamp(3.2rem, 7vw, 6.1rem)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.045em"
  headline:
    fontFamily: '"Source Serif 4", Georgia, serif'
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1.2
  title:
    fontFamily: '"Source Serif 4", Georgia, serif'
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.25
  body:
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif'
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.25rem"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  7: "28px"
  8: "32px"
  10: "40px"
  12: "48px"
  14: "56px"
  20: "80px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  status-badge:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
  navigation:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
  catalog-book:
    textColor: "{colors.ink}"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    width: "min(640px, calc(100% - 32px))"
---

# Design System: BiblioConnect

## Overview

**Creative North Star: "Atlas editorial contemporâneo"**

Uma biblioteca editorial contemporânea em que capas, títulos e autores conduzem a leitura. O Atlas do Acervo torna visíveis relações reais de categoria e autor. Creme, marinho e laranja preservam a identidade BiblioConnect; o pedido de uma nova marca substitui a preservação do logotipo anterior. A escolha entre as três propostas está em avaliação.

A mesma linguagem acompanha descoberta, catálogo, compra, aluguel, reserva e acompanhamento de pedidos. A home oferece a expressão mais cênica; conta e administração adotam densidade operacional, navegação clara e estados explícitos. Tema escuro, foco visível e alternativas sem movimento fazem parte do sistema.

**Key Characteristics:**

- Livros e informação real antes de ornamento.
- Títulos serifados; operações em sans local.
- Superfícies quentes, divisores finos e controles compactos.
- Movimento pontual com alternativa estática.

## Colors

A paleta combina papel quente, marinho institucional e laranja de ação; os valores normativos estão no frontmatter.

### Primary

- **Marinho da marca** (`brand`): identidade institucional, navegação administrativa e Atlas. O Atlas usa superfície #102b45, painel #173852, tinta #fff7ed, secundário #c0d0dc, linhas #496176 e acento claro #f7a742 para leitura sobre marinho.
- **Laranja de ação** (`accent`, `accent-hover`): ações principais, indicadores ativos e destaques pontuais. No texto de destaque da home, o tom mais escuro aparece no tema claro e o acento original no escuro.
- **Tinta do botão** (`primary-foreground`): texto escuro sobre o laranja nos dois temas, inclusive no hover.

### Secondary

- **Cinza azulado funcional** (`muted`): autores, informações auxiliares e contornos de campos. A correção final de contraste substitui o secundário anterior.

### Neutral

- **Papel e superfície** (`paper`, `surface`): fundo geral e áreas operacionais.
- **Tinta** (`ink`): leitura principal e foco.
- **Linha quente e fundo suave** (`stroke`, `soft`): divisores editoriais e campos de exposição das capas.
- **Equivalentes escuros** (`dark-*`): papel, superfície, tinta, secundário, linha e fundo suave mudam juntos quando `body.dark` está ativo. O marinho do logotipo e o acento continuam reconhecíveis.
- **Erro funcional** (`danger`, `danger-hover`): ações destrutivas e bordas de erro; estados de sucesso, aviso e perigo usam os tons semânticos verdes, laranjas e vermelhos já presentes em StatusBadge, com variantes escuras.

**The Theme Roles Rule.** Superfícies, texto, texto secundário e divisores seguem os papéis do tema; marca e acento preservam a identidade.

## Typography

**Display Font:** Source Serif 4, com Georgia e serif como alternativas.
**Body Font:** IBM Plex Sans, com Segoe UI e sans-serif como alternativas.

**Character:** Serifas editoriais dão presença aos títulos; a sans mantém formulários, navegação e valores fáceis de consultar. Os arquivos são locais, com variantes latin/latin-ext, preservando acentos.

### Hierarchy

- **Display:** título de abertura fluido; escala, entrelinha e tracking no frontmatter.
- **Headline:** seções começam na escala de 30 px e chegam a 36 px em telas maiores.
- **Title:** livros e títulos de diálogo usam a escala de 24 px; títulos menores de conteúdo usam 20 px. A entrelinha varia entre tight e snug conforme o componente.
- **Body:** leitura base de 16 px, entrelinha geral de 1.55; descrições podem usar entrelinha relaxada. Texto operacional auxiliar usa 14 px.
- **Label:** rótulos de campos e navegação usam 14 px, peso médio; botões usam peso 600. Pequenos rótulos de seção e categorias podem usar 12 px, caixa alta e tracking moderado. Eles não substituem os títulos.

**The Books Lead Rule.** Capas, títulos e autores definem a hierarquia; controles e metadados apoiam a escolha.

## Layout

O conteúdo público usa contêiner central de até 1280 px, com margens internas de 20 px e 32 px a partir do breakpoint pequeno. A home combina colunas assimétricas (1.15fr / 1fr) a partir de 768 px; em telas menores, o conteúdo se empilha. Espaços de seção de 56 px crescem para 80 px, e grupos de controle usam intervalos de 8–24 px.

Destaques usam uma, duas e quatro colunas conforme a largura. Filtros ficam empilhados até a composição horizontal comportar busca, categoria, tipo e limpeza. Títulos e autores longos podem quebrar; as colunas usam largura mínima zero.

A administração usa contêiner de até 1600 px e sidebar de 216 px em telas grandes, com menu em diálogo nas menores. A navegação pública completa aparece em telas extragrandes; abaixo disso, abre em diálogo. Áreas seguras do dispositivo e altura dinâmica dos diálogos são consideradas.

## Elevation & Depth

A estrutura é predominantemente plana: fundos suaves, espaço e linhas finas separam conteúdos. Capas recebem sombras para sugerir o objeto físico; diálogos usam elevação sobre backdrop escuro. Não há motivo para elevar cada seção.

### Shadow Vocabulary

- **Capa de catálogo:** sombra utilitária grande (`0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`).
- **Capa de abertura estática:** sombra extragrande (`0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`).
- **Diálogo:** sombra modal (`0 25px 50px -12px rgb(0 0 0 / 0.25)`), com backdrop `rgb(15 23 42 / 65%)`.

**The Selective Depth Rule.** Capas e diálogos podem receber sombra; a estrutura editorial se organiza por espaço, tom e divisores.

## Shapes

Controles usam cantos discretos: botões e campos seguem o raio médio; badges e alguns links usam o menor; diálogos usam o maior. Áreas de capa e artigos editoriais mantêm geometria reta. Divisores finos e bordas inferiores fazem parte da linguagem aprovada; não há proibição de linhas nem de pequenos rótulos.

## Components

### Buttons

Controles claros e contidos, com altura mínima de 44 px.

- **Shape:** raio médio, borda fina, padding do frontmatter e peso 600.
- **Primary:** laranja com tinta escura; hover usa o laranja mais profundo.
- **Secondary / Ghost:** superfície com borda secundária ou fundo transparente; hover usa fundo suave.
- **Danger:** vermelho funcional com texto branco.
- **Hover / Focus:** transição de cor e transformação em 140 ms. Pressão com ponteiro fino reduz a escala a 0.98; foco por teclado é imediato, com contorno de 2 px e afastamento de 4 px. Desabilitado reduz opacidade a 60%; carregamento bloqueia repetição.
- **Reduced motion:** sem transição nem transformação de pressão.

### Chips

Badges informam estado, com cantos pequenos, padding compacto e texto de 12 px. O neutro usa fundo suave e tinta; sucesso, aviso e perigo têm cor semântica adaptada ao tema. Não são controles de filtro inventados.

### Cards / Containers

Artigos do catálogo têm base reta, divisor inferior e espaço de 32 px ao final. A capa real fica sobre fundo suave, com padding de 24 px e sombra própria; título, autor, sinopse, preços e ações seguem abaixo. Informações operacionais não ficam ocultas por efeitos de hover.

### Inputs / Fields

Campos têm label visível, superfície, contorno secundário e raio médio. O controle usa pelo menos 44 px de altura, texto de 16 px e padding do frontmatter. Foco no grupo troca a borda para tinta e adiciona anel de 2 px a 20% de opacidade. Hint e erro são associados ao controle; erro usa borda vermelha e mensagem explícita. O rascunho relevante permanece disponível após falhas.

### Navigation

Cabeçalho com marca BiblioConnect, wordmark serifada e links sans de peso médio. O seletor sol/lua escolhido pelo usuário mantém localStorage.theme e body.dark, possui nome acessível e alvo 60×44 px. Link ativo recebe sublinhado laranja; há link para pular ao conteúdo. Menus compactos usam o diálogo nativo; administração acrescenta sidebar marinho com os mesmos destinos, ícones Lucide e acesso ao Atlas.

### Dialogs

Diálogos nativos com título serifado, superfícies temáticas, divisores entre cabeçalho/conteúdo/rodapé e rolagem interna. Largura máxima de 640 px, margem lateral total de 32 px e altura máxima de 85dvh. Foco protegido, Escape, clique no backdrop e retorno ao acionador acompanham o estado ocupado; operações em andamento bloqueiam fechamento e confirmação duplicada.

### Atlas do Acervo

O Atlas é o primeiro bloco da home: título serifado expressivo, CTA Interactive Hover Link, busca, categorias reais, mapa e painel da leitura selecionada. SVG desenha relações; botões nativos representam os livros. Linhas contínuas indicam autor em comum, tracejadas indicam categoria. Posições são determinísticas e projetadas na área real por ResizeObserver; alvos de 44px ficam separados em células de pelo menos52px. O mapa exibe até 48 livros, reduzindo pontos se faltar área, com aviso do número efetivo e lista completa equivalente. Não há pontos fictícios, Dewey inventado nem operações privadas nesse espaço público.

O celular abre em lista; no desktop é possível alternar mapa/lista. Movimento reduzido abre em lista e conserva a opção de mapa estático. Seleção por teclado/foco ou clique mostra capa, título, autor, estoque, sinopse e valores retornados pela API, com acesso ao catálogo existente. Carregamento usa o livro Nawsome apenas durante a requisição; erro não mostra contagem zero como dado válido. O título revela caracteres por opacity/transform em 200ms, com stagger total limitado a 400ms e estado estático em reduced-motion.

### Digitação com fade

FadeInput usa o input nativo como fonte de valor, caret, seleção e eventos. Nas buscas e no nome do cadastro, apenas a última inserção no fim recebe fade de 180ms por camada aria-hidden temporária. Digitação rápida substitui o efeito anterior sem fila. Composição, colagem, exclusão, seleção, edição no meio, texto com rolagem horizontal, reduced-motion e forced-colors usam apresentação nativa. Senhas, e-mails e números não recebem o efeito.

### Editorial book feature

A seção secundária da home reúne título, acesso ao catálogo e livro real. A cena 3D é carregada sob demanda apenas na home a partir de 768 px e sem movimento reduzido; capa estática atende telas pequenas, redução de movimento, carregamento e falha de textura/WebGL. O conteúdo permanece utilizável sem a animação.

A entrada dos títulos usa 480 ms e deslocamento de 18 px; detalhes usam 400 ms e 10 px, com easing power3.out. A troca automática de destaques ocorre em 6 segundos e pausa por foco, hover de mouse, aba oculta ou controle manual. Essa composição pertence à home, não é um molde obrigatório para páginas operacionais.

## Do's and Don'ts

### Do:

- **Do** preservar nome, paleta e alternância de tema, adotando a nova marca escolhida pelo usuário.
- **Do** dar prioridade a capa, título e autor e permitir quebra de títulos longos.
- **Do** usar pequenos rótulos de seção e divisores quando organizarem a leitura.
- **Do** manter rótulos, foco visível e estados de carregamento, erro, vazio e indisponibilidade.
- **Do** apresentar valores e confirmações de pedido/pagamento conforme a resposta do servidor.
- **Do** oferecer imagem estática na home em telas pequenas, movimento reduzido ou falha da cena.

### Don't:

- **Don't** inventar depoimentos, parceiros, estoque ou números comerciais.
- **Don't** transformar toda seção editorial em cartão elevado.
- **Don't** usar efeitos permanentes ou animação que bloqueie uma tarefa.
- **Don't** reutilizar o antigo texto secundário claro de baixo contraste nem texto branco sobre o botão laranja.

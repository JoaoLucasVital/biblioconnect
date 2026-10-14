# Componentes e recursos incorporados

## Campo de busca Tailwind

Fonte: https://uiverse.io/emmanuelh-dev/plastic-rattlesnake-49

Autor: emmanuelh-dev (Emmanuel Hernandez). A estrutura do grupo de entrada foi adaptada em `frontend/src/components/ui/Field.jsx`; cores, foco, rotulagem, estados e componentes React são específicos do BiblioConnect. O SVG original foi substituído pelo sistema de ícones Lucide já usado pelo projeto.

Copyright - 2026 emmanuelh-dev (Emmanuel Hernandez)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Fontes e ícones

Source Serif 4 e IBM Plex Sans são distribuídas pelos pacotes locais `@fontsource`, com suas licenças OFL incluídas nos pacotes. Lucide já integrava o projeto; sua licença ISC permanece na dependência. As capas dos três clássicos cadastrados na prévia têm proveniência registrada em `docs/verification/2026-10-14-persistent-acervo.md`.

## Seletor sol/lua e loading de livro

- RiccardoRapelli (Riccardo Rapelli), https://uiverse.io/RiccardoRapelli/jolly-chicken-91. Adaptado em `ThemeToggle.jsx`/`theme-toggle.css` com estado React, nomes acessíveis, escopo de classes, movimento reduzido e pausa em aba oculta.
- Nawsome, https://uiverse.io/Nawsome/curly-goose-54. Adaptado em `BookLoader.jsx`/`book-loader.css` com paleta do projeto, dimensões reduzidas e status semântico.

Copyright - 2026 RiccardoRapelli (Riccardo Rapelli)

Copyright - 2026 Nawsome

## Interactive Hover Button — Magic UI

Fonte: https://magicui.design/docs/components/interactive-hover-button

Código consultado em 14/10/2026: https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/interactive-hover-button.tsx

Crédito de criação indicado pela documentação: Aayush Bharti. Adaptado em `InteractiveHoverLink.jsx`/`interactive-hover.css` para React Router, paleta do BiblioConnect, nome acessível único e propriedades de transição explícitas.

Copyright (c) Magic UI

## Licença MIT dos componentes acima

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Split Text e Blur Text do React Bits foram consultados como referências visuais. Nenhum código desses componentes foi incorporado; RevealText é implementação própria com CSS.

## Image Stream Hero — Ruixen UI

Copyright (c) 2025 Ruixen UI. Licença MIT reproduzida acima.

Fonte oficial consultada em 14/10/2026: https://ruixen.com/r/image-stream-hero ; documentação: https://ruixen.com/docs/components/image-stream-hero ; referência escolhida: https://21st.dev/@ruixen.ui/components/image-stream-hero . Geometria das duas fileiras em perspectiva adaptada em `streamGeometry.js`/`ImageStreamHero.jsx`, com livros da API, movimento contínuo durante hover/foco, proteção de visibilidade, tema e alternativa sem movimento. Licença: https://github.com/ruixenui/ruixen.com/blob/main/LICENSE.md .

## React Bits — Card Nav e referências de movimento

Card Nav adaptado visualmente em `CardNav.jsx`/`CardNav.css`. Fonte: https://github.com/DavidHDev/react-bits/tree/main/src/content/Components/CardNav . Animated Content, Scroll Expand, Click Spark e Star Border também foram consultados; `DiscoveryMotion.jsx` usa implementações locais simplificadas com a infraestrutura existente, movimento reduzido e controles nativos. Nenhuma dependência adicional foi instalada.

Licença consultada em 14/10/2026: https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md .

MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software **as part of an application, website, or product**, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

### Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as you do not sell, sublicense, or redistribute the components themselves-whether alone, in a bundle, or as a ported version.**

### No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Painel e capas contemporâneas

Rodada de widgets financeiros: Stats Widget e Donut Chart de Ravi Katiyar no 21st.dev; Financial Score Cards de Ali Imam no 21st.dev; Sales Card de Yaya12085 no Uiverse; Bar Charts de shadcn/ui e Analytics de React Bits Pro. São referências visuais para implementação local com React, Recharts e Lucide já presentes. Não houve importação do código desses registros nem incorporação de código pago do React Bits Pro. Links, correspondência e limites em `docs/design-references/2026-10-14/finance-components-selected.md`.

shadcn/ui dashboard-01 (https://ui.shadcn.com/blocks) e Tremor (https://www.tremor.so/) são referências de composição; o painel usa implementação própria, Recharts e Lucide já presentes. Proveniência das capas e metadados adicionados: `docs/catalog/2026-10-14-contemporary-acervo.md` e `docs/catalog/youth-cover-provenance.json`. Capas editoriais mantêm os direitos dos respectivos titulares; não são cobertas pela licença do código.

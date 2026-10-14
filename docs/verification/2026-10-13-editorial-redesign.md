# Verificação do redesign editorial

Data: 13/10/2026. Base: `d17fdb0`. Branch: `codex/biblioconnect-editorial`.

## Resultado verificado

- Frontend: **54/54** testes Vitest.
- Integração isolada: **15/15**, incluindo 39 respostas HTTP e concorrência de estoque.
- Navegador: **41/41** Playwright/Chromium, contra o frontend compilado em produção e API/banco temporários.
- ESLint e build: aprovados.
- Auditoria npm do frontend após atualizações compatíveis: **zero vulnerabilidades**.
- Detector Impeccable: uma execução sobre `frontend/src` e `frontend/index.html`, resultado `[]`, exit 0.

Cada execução cria um diretório próprio em `.local/qa`, portas dinâmicas, segredo JWT temporário, PGlite compatível com o protocolo PostgreSQL e e-mails em arquivo. Migrations existentes são aplicadas somente ao banco novo. O encerramento valida o caminho antes de remover seus próprios arquivos. Nenhum reset/seed foi executado nos dados existentes.

## Cobertura funcional

| Área | Evidência |
| --- | --- |
| Rotas e papéis | Matriz de 22 URLs + wildcard, parâmetros id/token, guards, acesso direto negado ao cliente, logout e preferência de tema |
| Acervo | Busca, filtros/limpar, compra, aluguel de 9 dias, reserva, estoque zero, livro doado, avaliações e payloads originais |
| Diálogos | Nome acessível, Tab/Shift+Tab, Escape, retorno ao acionador, busy, falha preservando endereço/dias/data |
| Conta | Cadastro pela interface, confirmação/reenvio, erro preservando e-mail, recuperação por e-mail local e reset com token |
| Cliente | Pagamento pendente até servidor, simulação explicitamente identificada, comprovante, cancelamento permitido, pedido inexistente/de outro leitor |
| Atendimento e avaliação | Rascunho preservado após erro, envio pendente sem duplicação, moderação e resposta administrativa |
| Administração | Cadastro por ISBN controlado, edição de estoque refletida na API, congelar/descongelar usuário, concluir pedido pago e regra de pagamento pendente |
| Layout | 320/360/768/1440 px, textos extensos, caracteres não latinos, preços/estoque altos, estados vazios, texto a 200%, tabela com rolagem interna |
| Home | Dados reais da API, CTA por papel, timer de 6000 ms com pausas, falha de capa/WebGL, Canvas real, perda de contexto, desmontagem e teclado |
| Impressão | Navegação/controles ocultos, dados preservados e PDF A4 gerado pelo Chromium |

Os dados e capas das capturas são registros exclusivos de QA. O seletor de casos extremos é injetado pelo teste; não existe no código entregue ao navegador em produção.

## Estilo, movimento e carregamento

Tailwind substitui o CSS legado. Source Serif 4 e IBM Plex Sans são servidas localmente. A paleta, o logotipo e a preferência clara/escura existentes foram preservados. Campos, botões, diálogos, mensagens e tabela são componentes locais compartilhados.

GSAP atua somente na abertura da home, com limpeza de escopo e respeito ao movimento reduzido. Gráficos operacionais não animam cada entrada. A cena 3D usa renderização sob demanda, DPR até 1,5 e capa verdadeira do registro; celular e movimento reduzido não montam Canvas. A rede do build de produção confirma ausência do módulo BookScene ao abrir diretamente o catálogo.

Tamanhos em kB decimais, obtidos dos arquivos compilados:

| Artefato | Baseline | Redesign |
| --- | ---: | ---: |
| CSS principal | 75,58 | 37,39 |
| Entrada JavaScript | 277,14 | 292,40 |
| Home, carregada por rota | — | 84,77 |
| BookScene, carregada sob demanda | — | 915,65 |

O CSS ficou cerca de 50,5% menor em bytes sem compressão. A entrada JavaScript cresceu cerca de 5,5%, incluindo navegação/componentes e atualizações de segurança compatíveis. O aviso de chunk acima de 500 kB refere-se ao módulo 3D lazy; ele permanece fora das rotas operacionais. Não houve afirmação de economia de tokens medida.

Amostra reproduzível em Chromium, 1440×1000, build de produção, sem throttling: DOMContentLoaded/load aproximadamente **74,5 ms**, **21** recursos e **317.585 bytes** transferidos; preencher filtro e confirmar o resultado via Playwright: **49,71 ms**. Consulte `editorial-metrics.json`. Essa amostra inclui o ambiente local/automação, não mede INP de campo e não permite afirmar ganho de velocidade sobre a baseline, cujo tempo não foi medido.

## Evidências e decisões

Capturas locais ficam em `.impeccable/review`; saídas dos testes e PDF em `frontend/test-results`. Os testes recriam essas evidências. As atribuições de código adaptado do Uiverse estão em `THIRD_PARTY_NOTICES.md`; 21st.dev, React Bits e documentações oficiais foram referências de seleção e integração, sem dependência de execução dos sites.

Decisões de execução relevantes:

1. Worktree criado por Git após a integração nativa não resolver o repositório aninhado; implica gerenciamento manual desse checkout.
2. Testes Node limitados a `tests/**/*.test.js` para não executar setup do Vitest fora do runner; testes backend fora dessa pasta precisam de inclusão explícita.
3. Login usou placeholders na baseline porque labels eram desconectados; após a correção, a automação usa labels.
4. O tema escuro existente foi preservado apesar da ambiguidade inicial da especificação; implica validação dos dois temas.
5. A direção e o plano já aprovados orientaram a implementação em código, sem reabrir a seleção de conceitos; menos alternativas novas, compensadas pela validação visual.
6. Os ajustes de casos extremos foram feitos dentro do hardening já aprovado; evita uma microaprovação por correção e mantém revisão independente ao final.
7. Integrações externas reais não homologadas: preservar os contratos e declarar o limite da integração isolada; credenciais ou provedores reais ainda podem revelar falhas específicas do ambiente.
8. Aparelhos físicos/Safari/Firefox não homologados: a evidência disponível é Chromium com emulação responsiva; diferenças próprias dessas plataformas permanecem possíveis.
9. Escala de catálogos grandes: manter a lista inteira porque paginação não faz parte deste redesign; o custo original para grandes acervos permanece.
10. Reset administrativo: preservar senha, texto exato e confirmação e revisar o código sem executar a ação destrutiva; não há nova evidência de execução desse fluxo.

## Limites

Não houve homologação em aparelho físico, Safari/Firefox, serviços reais de SMTP, Google Maps, Google Books ou cobrança real do Mercado Pago. ISBN/CEP e falhas externas usam respostas controladas nos testes apropriados; as operações principais usam a API isolada. Build, testes e auditoria de dependências não constituem uma auditoria de segurança completa.

O comportamento de catálogos muito grandes continua sendo o da aplicação original: carregamento da lista inteira, sem paginação nova nesta etapa. Não foram alterados servidor, schema, regras de preço/estoque ou estratégia de autenticação.

## Revisão independente

O Astra revisou por amostragem o intervalo completo `d17fdb0..9b432f5`, os requisitos aprovados e as sete capturas obrigatórias. O parecer inicial foi `fix`: contraste do hover primário, contraste de texto secundário e separação dos resumos administrativos. Não encontrou achados críticos na amostra. A separação, inicialmente classificada como menor no relatório técnico, foi tratada como importante por prejudicar a leitura de título/gênero e quantidade e constar nos ajustes visuais materiais.

Os três casos foram reproduzidos em testes de navegador antes de alterar o código: contraste de hover **3,8628:1**, texto secundário **4,4822:1** e elementos de resumo encostados. Após a correção (`1f1d1cf`), hover alcança **4,714:1**; texto secundário alcança **5,125:1** sobre creme e **4,748:1** sobre a superfície suave; título/gênero e quantidade ocupam linhas separadas. Foram preservadas as cores da marca, com ajuste dos tons funcionais de texto.

As capturas suplementares do painel foram corrigidas para aguardar o título real da página, evitando registrar o fallback de carregamento. As mesmas capturas foram regeneradas pela suíte completa, agora **41/41**, e enviadas ao mesmo revisor para pontuar exclusivamente as três correções. O parecer dessa conferência foi **`ship`**, com os três pontos resolvidos e nenhuma regressão decorrente das correções observada. Esse parecer tem o escopo dos ajustes avaliados; não equivale a uma auditoria exaustiva do sistema. Nenhum achado menor foi adiado.

A documentação visual em `DESIGN.md` descreve o código final. Os limites de integrações externas, navegadores e ação destrutiva permanecem os registrados acima.

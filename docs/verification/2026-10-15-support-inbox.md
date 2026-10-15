# Atendimento administrativo — 15/10/2026

## Escopo aprovado

Cabeçalho acima das colunas; caixa de entrada com busca, filtros Todas/Abertas/Encerradas, nome, prévia e horário; conversa com balões separados para leitor e equipe, resposta na base e encerramento discreto. No celular, a conversa substitui a lista e oferece Voltar à lista. Paleta e funções existentes preservadas, com movimento curto e alternativa de movimento reduzido.

## Referências e componentes

- [21st.dev MessageList](https://agent-elements.21st.dev/docs/message-list) e [shadcn-chat](https://github.com/jakobhoeg/shadcn-chat): referências de organização do histórico e balões. Implementação local, sem instalar ou copiar pacotes de chat.
- [React Bits Shiny Text](https://reactbits.dev/text-animations/shiny-text): reutilização dos componentes locais ShinyText e AnimatedHeading.
- [Uiverse — emmanuelh-dev](https://uiverse.io/emmanuelh-dev/plastic-rattlesnake-49): o Field já adaptado no projeto foi reutilizado na busca e na resposta, mantendo FadeInput e o aviso MIT existente em THIRD_PARTY_NOTICES.md.
- [Uiverse — jjiubs](https://uiverse.io/jjiubs/afraid-yak-33): referência visual de busca. Nenhum código copiado.
- Envio com ícone Lucide existente e deslocamento discreto no hover, sem dependências adicionais.

## Implementação

AdminChat mantém a rota existente e carrega SupportInbox. CSS restrito à tela, duas colunas quando há espaço e navegação entre lista/conversa em telas estreitas. Nome, e-mail e prévia longos são contidos; o e-mail completo permanece no atributo title. Histórico tem rolagem própria e preserva o fim da conversa ao redimensionar quando o usuário está acompanhando as mensagens mais recentes.

As rotas GET de lista/histórico, POST de resposta e PATCH de status continuam iguais. Atualização automática a cada oito segundos; não é WebSocket. Conversas encerradas exibem histórico sem formulário. Rascunhos separados por conversa durante a permanência na tela; falha de envio preserva o texto. Requisições antigas não substituem outra seleção nem reabrem visualmente uma conversa após o encerramento. Ao abrir no celular, foco passa para Voltar à lista; ao retornar, volta ao leitor selecionado.

Sem mudança de schema, migração, credencial ou regra do backend. Contas e mensagens de verificação criadas somente no banco isolado do harness QA; o banco local original não recebeu dados deste teste.

## Verificação executada

- Vitest: 18/18 — oito testes de atendimento e dez de navegação. O teste de GET atrasado após PATCH primeiro falhou com a implementação anterior e passou após invalidar a requisição pendente.
- Playwright isolado: 2/2 — fluxo anterior de moderação/resposta e novo fluxo de busca, filtros, histórico encerrado, resposta visível pela API do cliente, atualização automática, encerramento persistido, foco móvel e ausência de overflow horizontal em 1100, 1024, 768 e 360px.
- O teste antigo procurava o nome acessível desatualizado “Aprovar”; atualizado para “Aprovar avaliação”, como já aparece na tela de moderação.
- ESLint passou nos componentes e testes alterados.
- Build de produção passou. Mantém o aviso preexistente de tamanho do chunk Three.js, carregado separadamente.
- Detector Impeccable executado uma vez: nenhum achado nos arquivos da nova tela.
- Duas rodadas de inspeção visual de desktop/celular. Na segunda, cabeçalho móvel contido e ancoragem da última mensagem confirmados. Revisão de design pelo Astra; corrida de atualização e foco móvel encontrados e corrigidos.

Capturas locais com dados de teste em `.impeccable/review/`: `atendimento-caixa-entrada.png`, `atendimento-conversa-desktop.png` e `atendimento-conversa-mobile.png`.

Frontend e backend originais responderam HTTP 200 nas portas 5173 e 3000 ao concluir. Nenhuma publicação ou implantação feita nesta etapa.

# Ferramentas de contexto e engenharia reversa

Configuração local verificada em 20/10/2026. São ferramentas de desenvolvimento;
não fazem parte do build, do banco nem do deploy do BiblioConnect.

| Ferramenta | Instalação e uso |
| --- | --- |
| RTK | Versão existente 0.45.0; filtra saídas de comandos. Mantida sem reinstalação. |
| token-efficiency | Skill existente, usada por padrão conforme as instruções do usuário. |
| CodeGraph | Índice local existente; consultas estruturais com limite de arquivos. |
| Vibe Coding Toolkit | Guias em `C:/Users/jluca/.codex/toolkits/vibe-coding-toolkit`, revisão `790a895304e0c08b70a5b215c9d334f1c86b816c`. |
| vibe-coding-context | Adaptação local dos guias para uma skill em `C:/Users/jluca/.codex/skills/vibe-coding-context`. O repositório original não oferece uma skill única. Guias copiados mantêm a licença MIT. |
| REA | Pacote oficial `rea-agents@6.7.0`, executado por npx; MCP configurado somente no Codex e skill correspondente instalada em `C:/Users/jluca/.agents/skills/reverse-engineer-anything`. |

## Verificação

- O setup do REA retornou `ready`, configuração alinhada e skill alinhada.
- Teste independente de inicialização MCP: servidor `rea` 6.7.0, 207 ferramentas
  anunciadas, incluindo `analyze_javascript_application`.
- A skill adaptada passou no `quick_validate.py` oficial do Codex.
- Comparação estrutural do TOML com o backup confirmou que a única alteração
  da configuração foi o registro MCP `rea`. Modelo, autenticação, permissões e
  demais integrações foram preservados.
- Backup gerado pelo setup: `C:/Users/jluca/.codex/config.toml.rea.backup`.

As skills podem ser descobertas no próximo turno. O cliente deve reconectar ou
reiniciar a sessão do Codex para expor o novo MCP ao agente. O teste independente
do servidor não significa que ele já esteja conectado a esta conversa.

## Aplicação ao projeto

Pesquisar antes de ler arquivos inteiros; limitar resultados; usar o índice para
dependências e símbolos; manter decisões e pendências em registros compactos.
RTK mede filtragem de saída, não a economia total da assinatura ou do trabalho.

Usar REA quando forem necessários artefatos distribuídos ou evidências de runtime.
Para o código-fonte disponível do BiblioConnect, continuar com CodeGraph e buscas
diretas. Não foram instalados decompiladores nativos ou alteradas as dependências
da aplicação. Um vídeo não permite recuperar o código original de uma animação.

## Referência de movimento recebida

Arquivo local: `C:/Users/jluca/Downloads/snapinsta-1792541151700.mp4`.
Metadados: 720 × 1280, 30 fps, duração de 6,08 segundos. Foram extraídos 16 quadros
distribuídos pela duração para observar os estados e transições.

- Primeiro segundo: estrutura, cabeçalho e cards aparecem em sequência.
- Trecho intermediário: conteúdo muda enquanto a navegação permanece no lugar.
- Aproximadamente 3,5–5,2 s: contador do card de destaque cresce até o valor final.
- Aproximadamente 5,2–5,9 s: uma revelação circular troca o tema claro pelo escuro.
- Um trecho de código visível menciona elevação de card no hover; isso é uma
  referência exibida no vídeo, sem comprovação de que seja todo o código utilizado.

Adaptação proposta: usar os mesmos tipos de movimento no painel administrativo
e financeiro, com as cores atuais e números reais. Reutilizar GSAP e Recharts já
presentes; respeitar movimento reduzido e manter navegação, formulários e dados.
A composição foi aprovada e aplicada ao painel e financeiro: cabeçalhos compactos,
acervo e indicadores ao lado do gráfico, receita aprovada em destaque laranja e
valores secundários em cards menores. A sidebar e os contratos da API foram mantidos.
Contadores usam GSAP; entradas usam CSS; a troca circular de tema usa View
Transitions com alternativa imediata sem suporte, com movimento reduzido ou por
teclado. Callbacks antigos são invalidados quando há uma nova escolha de tema.

Verificação desta rodada: 31 testes passaram, incluindo administrativo, financeiro,
menu e troca de tema; lint dos arquivos alterados passou. A conferência visual em
desktop e mobile ficou pendente porque o navegador interno bloqueou o acesso à aba
local. Esse bloqueio não foi contornado por outro meio de automação.

Fontes: [Vibe Coding Toolkit](https://github.com/soumatheusgomes/vibe-coding-toolkit),
[REA](https://github.com/morluto/rea).

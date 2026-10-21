# Entrega das capas do catálogo

As 131 capas já cadastradas possuem cópias WebP públicas em `frontend/public/covers`. São os mesmos arquivos publicados anteriormente no Vercel Blob; os originais foram conferidos pelos SHA-256 do catálogo de importação ou pelo hash no nome do arquivo. As versões responsivas menores também foram preservadas. Total inicial: 160 arquivos, 7.616.500 bytes.

Em 21/10/2026, o armazenamento Blob aparecia ativo, mas o domínio público das capas falhava na validação HTTPS nesta conexão (`UNABLE_TO_VERIFY_LEAF_SIGNATURE` no Node e `SEC_E_UNTRUSTED_ROOT` no Windows). Nenhuma validação TLS foi desativada. Para que a exibição do catálogo não dependa desse domínio, `cover-assets.json` associa URLs exatas já conhecidas às cópias entregues pelo próprio domínio do frontend.

`resolveBookCoverUrl` é usado no catálogo, nas superfícies que compartilham `BookCover`, na textura da hero 3D e na edição do livro. Ele não altera registros no banco. URLs de novas capas e provedores externos que não estão no manifesto conservam o fluxo de mídia existente; o snapshot estático não substitui o armazenamento de uploads. Não copiar fotos de perfil ou dados privados para este diretório público.

Ao acrescentar uma capa ao snapshot, conferir o arquivo WebP e sua origem, adicionar a associação exata ao manifesto e manter eventuais variantes de `cover-variants.json`. Não reutilizar uma capa de título/edição diferente. O cadastro sem `imagemUrl` continua usando o fallback de texto; isso não é uma falha de transporte da imagem.

Verificação: testes do resolvedor e suíte do frontend; build hospedado; após o deploy, GET de todas as 160 imagens, comparação de SHA-256 e verificação do chunk do resolvedor servido pelo alias público.

# Foto de perfil em navegadores sem codificação WebP

O relato no iPhone mostrava “Não foi possível gerar uma foto WebP otimizada” após escolher um JPEG. O worker exigia que o resultado de `OffscreenCanvas.convertToBlob` fosse WebP. Navegadores podem devolver PNG quando o formato pedido não é suportado, conforme https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas/convertToBlob.

O processamento agora aceita PNG/JPEG válidos além de WebP e tenta PNG se a codificação WebP lançar erro. Quando o arquivo ainda passa de 2 MB, reduz as dimensões em até duas novas tentativas, sem cortar a imagem nem remover seu fundo. O formulário usa extensão correspondente ao MIME produzido. O servidor mantém suas validações de conteúdo, tamanho, resolução, privacidade e autenticação, remove metadados e grava o resultado final em WebP.

Verificação:

- Nove testes de frontend passaram, incluindo regressões que falharam antes da correção: PNG devolvido em lugar de WebP, PNG acima do limite, erro no codificador WebP e nome/MIME do multipart. O caminho WebP e os fluxos existentes de edição/cancelamento também passaram.
- Três testes de servidor passaram com banco descartável: upload privado, conversão em WebP sem EXIF, rejeição de conteúdo/resolução/tamanho inválidos e preservação da foto anterior em falhas.
- Dois testes existentes de navegador passaram com frontend compilado e banco descartável: perfil no celular e foto inteira com proporção/fundo/bordas preservados. O teste novo de fallback PNG também concluiu upload HTTP 200; sua primeira execução falhou apenas ao tentar ler o multipart, que o Playwright retornou como null. Essa observação foi substituída pela conferência do MIME da prévia. O teste novo passou na reexecução, confirmando PNG na prévia e WebP retornado pelo servidor.
- ESLint dos quatro arquivos de frontend alterados e build hospedado passaram. Mantido o aviso anterior de chunk Three.js acima de 500 kB.
- A validação de fallback usa Chromium com codificação PNG forçada no worker. Não equivale a execução em um iPhone físico; o proprietário deve repetir a seleção da foto no aparelho após atualizar o site.

A correção não exige migração, alteração de credenciais nem limpeza de dados.

## Publicação

Commit da correção: `51df862`. Deploy Vercel `dpl_tJGEc4SkdJ8G8QimQNnrpRtjaJM1`, promovido para https://biblioconnect-olive.vercel.app. Build remoto concluído. A conferência HTTP no domínio público confirmou o novo entrypoint e SHA-256 idêntico ao build local para o worker `photo-processing.worker-ChR133RI.js` e o editor `ProfilePhotoEditor-IRE_G3na.js`; catálogo com 131 livros, login Google habilitado com o mesmo cliente e foto privada retornando 401 sem sessão.

No navegador interno, o perfil autenticado e o editor atualizado carregaram no domínio público. Nenhuma foto real foi substituída durante a validação de produção. Evidência privada em `.superpowers/profile-photo-release.png` e relatório HTTP em `.superpowers/photo-release-http-result.json`.

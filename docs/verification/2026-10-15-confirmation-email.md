# Cadastro e falha no envio de confirmação

O relato de produção mostrava nomes de variáveis e `.env` após a conta ter sido criada. Naquele deploy, o serviço de envio real ainda não tinha remetente/credencial configurados. A interface concatenava o diagnóstico do servidor e continuava permitindo submeter o cadastro novamente.

Correção: resposta pública e interface usam mensagem de indisponibilidade sem diagnóstico interno; cadastro já concluído fica bloqueado para nova submissão e mantém a opção de reenviar confirmação. O reenvio não mostra o campo técnico `detalhe`. A confirmação de e-mail continua obrigatória para contas criadas com senha. Nenhuma conta real foi confirmada manualmente nem apagada.

Nodemailer atualizado de 8.0.9 para 10.1.1, que exige Node >=20, compatível com o runtime do projeto. A auditoria das dependências de produção passou sem vulnerabilidades conhecidas (`npm audit --omit=dev`). Isso não declara a auditoria de dependências de desenvolvimento limpa.

Verificação:

- Duas regressões de frontend falharam antes da correção e passaram depois: mensagem técnica no cadastro e diagnóstico no reenvio. Verificadas a desativação dos campos/botão após criar a conta e a prevenção de nova submissão.
- A regressão HTTP reproduziu vazamento de caminho/erro do provedor e passou após a correção. Banco e caixa de saída são descartáveis: simula falha no envio, mantém login bloqueado, restaura envio local, reenvia confirmação, consome o link e valida login da mesma conta.
- Quatro testes de servidor passaram após atualizar Nodemailer: compatibilidade Gmail/normalização da senha e geração real de mensagem sem rede, proibição de envio simulado em produção, integração Resend com resposta controlada e o fluxo HTTP acima.
- ESLint dos arquivos de frontend alterados e build hospedado passaram. O aviso anterior do chunk Three.js permanece.

## Situação antes da configuração do remetente

Não houve envio de e-mail real nesta correção. Foi solicitado ao proprietário escolher o remetente; a opção proposta é Gmail com senha de app criada pelo próprio titular e transferida somente por arquivo privado. Sem credencial válida e confirmação do recebimento, não declarar envio externo funcionando. Não usar a senha comum da conta, não imprimir segredos e não cadastrar credenciais no frontend.

## Publicação da correção de mensagens e cadastro

Commit `563cd46`, deploy Vercel `dpl_A6Z2DHKRgyH22QfTYCZoD55ks9kc`, promovido para https://biblioconnect-olive.vercel.app. Builds remoto de frontend/backend concluídos. Conferência HTTP do domínio público confirmou o novo entrypoint e SHA-256 do formulário `Register-DoFNnb7N.js` idêntico ao build local; a correção anterior de foto também continua publicada. Catálogo com 131 livros, Google habilitado com o mesmo cliente e acesso anônimo à foto recusado com 401.

Na publicação acima, o envio externo ainda estava pendente da escolha e configuração do remetente.

## Gmail ativado e recebimento confirmado

O titular criou `biblioconnect.biblioteca@gmail.com`, ativou a verificação em duas etapas e salvou pessoalmente uma senha de app no segredo `EMAIL_PASS`, somente em Production na Vercel. A senha não foi lida nem impressa pela automação. Configurados `EMAIL_PROVIDER=gmail`, `EMAIL_USER` e `EMAIL_FROM` com esse endereço; o nome exibido é BiblioConnect.

Novo deploy `dpl_CefDC1hX5RUhrNDMpKYDcyFHWX3f`, promovido para https://biblioconnect-olive.vercel.app em 15/10/2026. Builds remoto de frontend/backend concluídos. A conferência do domínio público confirmou os mesmos arquivos de cadastro e foto, catálogo com 131 livros, Google habilitado e foto privada recusando acesso anônimo com 401.

Verificação real em produção às 23:29 UTC: `/admin/email/status` retornou 200 com SMTP Gmail verificado; `/admin/email/teste` retornou 200 ao enviar uma única mensagem para o próprio remetente. A sessão administrativa criada exclusivamente para a verificação foi encerrada. A mensagem “Teste de email - BiblioConnect” foi localizada na caixa de entrada do Gmail às 20:29 de Brasília, aberta e conferida com remetente BiblioConnect e endereço correto. Comprovante privado: `.superpowers/gmail-production-received.png`.

O recebimento desse teste confirma o transporte real configurado; não constitui teste de entrega em todos os provedores dos clientes. O fluxo de confirmação e reenvio já possui a regressão HTTP descrita acima; nenhuma conta de cliente foi criada, apagada ou confirmada manualmente nesta ativação. Quem já cadastrou uma conta e não recebeu o primeiro e-mail pode usar “Reenviar email de confirmação”.

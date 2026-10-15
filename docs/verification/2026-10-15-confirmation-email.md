# Cadastro e falha no envio de confirmação

O relato de produção mostrava nomes de variáveis e `.env` após a conta ter sido criada. O serviço de envio real ainda não tem remetente/credencial configurados no deploy. A interface concatenava o diagnóstico do servidor e continuava permitindo submeter o cadastro novamente.

Correção: resposta pública e interface usam mensagem de indisponibilidade sem diagnóstico interno; cadastro já concluído fica bloqueado para nova submissão e mantém a opção de reenviar confirmação. O reenvio não mostra o campo técnico `detalhe`. A confirmação de e-mail continua obrigatória para contas criadas com senha. Nenhuma conta real foi confirmada manualmente nem apagada.

Nodemailer atualizado de 8.0.9 para 10.1.1, que exige Node >=20, compatível com o runtime do projeto. A auditoria das dependências de produção passou sem vulnerabilidades conhecidas (`npm audit --omit=dev`). Isso não declara a auditoria de dependências de desenvolvimento limpa.

Verificação:

- Duas regressões de frontend falharam antes da correção e passaram depois: mensagem técnica no cadastro e diagnóstico no reenvio. Verificadas a desativação dos campos/botão após criar a conta e a prevenção de nova submissão.
- A regressão HTTP reproduziu vazamento de caminho/erro do provedor e passou após a correção. Banco e caixa de saída são descartáveis: simula falha no envio, mantém login bloqueado, restaura envio local, reenvia confirmação, consome o link e valida login da mesma conta.
- Quatro testes de servidor passaram após atualizar Nodemailer: compatibilidade Gmail/normalização da senha e geração real de mensagem sem rede, proibição de envio simulado em produção, integração Resend com resposta controlada e o fluxo HTTP acima.
- ESLint dos arquivos de frontend alterados e build hospedado passaram. O aviso anterior do chunk Three.js permanece.

## Entrega externa pendente

Não houve envio de e-mail real nesta correção. Foi solicitado ao proprietário escolher o remetente; a opção proposta é Gmail com senha de app criada pelo próprio titular e transferida somente por arquivo privado. Sem credencial válida e confirmação do recebimento, não declarar envio externo funcionando. Não usar a senha comum da conta, não imprimir segredos e não cadastrar credenciais no frontend.

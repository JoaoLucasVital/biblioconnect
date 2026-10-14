import dotenv from "dotenv";
import {
  descreverErroEmail,
  enviarEmailHtml,
  verificarConfiguracaoEmail,
} from "../src/services/emailService.js";

dotenv.config();

const destinatario =
  process.argv[2] || process.env.EMAIL_TEST_TO || process.env.EMAIL_USER;

if (!destinatario) {
  console.error("Informe um destinatário: npm run email:test -- email@exemplo.com");
  process.exit(1);
}

const diagnostico = await verificarConfiguracaoEmail();

if (!diagnostico.ok) {
  console.error(`Falha no provedor: ${diagnostico.mensagem}`);
  process.exit(1);
}

try {
  const info = await enviarEmailHtml({
    to: destinatario,
    subject: "Teste de email - BiblioConnect",
    html: `
      <div style="font-family:Arial,sans-serif;padding:24px">
        <h2>BiblioConnect - teste de email</h2>
        <p>Se você recebeu esta mensagem, o recebimento desta mensagem de teste foi confirmado por você.</p>
      </div>`,
  });

  console.log("Mensagem aceita pelo provedor; confirme o recebimento na caixa de entrada.");
  console.log(`Message ID: ${info.messageId}`);
} catch (error) {
  console.error(`Falha ao enviar: ${descreverErroEmail(error)}`);
  process.exit(1);
}

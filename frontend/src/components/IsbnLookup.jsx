import { useState } from "react";
import api from "../api/api.js";
import Field from "./ui/Field.jsx";
import Button from "./ui/Button.jsx";

/**
 * Campo reutilizável de ISBN para cadastro/edição.
 * A consulta é feita pelo backend para manter chaves de API fora do navegador.
 */
function IsbnLookup({ value, onChange, onFound }) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function buscar() {
    if (loading) return;
    const isbn = String(value || "").trim();
    if (!isbn) {
      setFeedback("Informe o ISBN antes de buscar.");
      return;
    }

    try {
      setLoading(true);
      setFeedback("");
      const response = await api.get(`/isbn/${encodeURIComponent(isbn)}`);
      onFound(response.data);
      setFeedback("Dados encontrados. Confira os campos antes de salvar.");
    } catch (error) {
      setFeedback(error.response?.data?.erro || "Não foi possível consultar o ISBN.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-3">
      <Field label="ISBN" hint={feedback}>
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Ex: 9788535914849"
          />
      </Field>
      <Button variant="secondary" onClick={buscar} busy={loading} className="justify-self-start">Preencher por ISBN</Button>
    </div>
  );
}

export default IsbnLookup;

import { useState } from "react";

export type CepData = {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

export function useCep() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchCep(raw: string): Promise<CepData | null> {
    const cep = raw.replace(/\D/g, "");
    if (cep.length !== 8) {
      setError("CEP deve ter 8 dígitos");
      return null;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setError("CEP não encontrado");
        return null;
      }
      return {
        street: data.logradouro ?? "",
        neighborhood: data.bairro ?? "",
        city: data.localidade ?? "",
        state: data.uf ?? "",
      };
    } catch {
      setError("Erro ao buscar CEP");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { fetchCep, loading, error, setError };
}

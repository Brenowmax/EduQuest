
"use client";

import { useState } from "react";
import { createClient } from "@/src/lib/supabase/client";

export default function BotaoSair() {
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function sair() {
    setCarregando(true);
    setMensagem("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signOut({
        scope: "local",
      });

      if (error) {
        setMensagem("Não foi possível encerrar a sessão.");
        return;
      }

      window.location.replace("/login");
    } catch {
      setMensagem("Erro ao encerrar a sessão.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={sair}
        disabled={carregando}
        className="rounded-lg border border-red-500 bg-red-950 px-5 py-2 font-bold text-red-300 hover:bg-red-900 disabled:opacity-50"
      >
        {carregando ? "Saindo..." : "Sair"}
      </button>

      {mensagem && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {mensagem}
        </p>
      )}
    </div>
  );
}

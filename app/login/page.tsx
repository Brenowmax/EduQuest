
"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/src/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCarregando(true);
    setMensagem("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        setMensagem("Não foi possível entrar. Verifique suas credenciais.");
        return;
      }

window.location.replace("/painel");    } catch {
      setMensagem("Erro de comunicação com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <section className="w-full max-w-md rounded-xl border border-amber-600 bg-slate-900 p-8 text-white">

        <h1 className="text-center text-4xl font-bold text-amber-400">
          EduQuest
        </h1>

        <p className="mt-2 mb-8 text-center text-slate-400">
          Aventureiro Pedagógico 2.0
        </p>

        <form onSubmit={entrar} className="space-y-5">

          <div>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full rounded border border-slate-600 bg-slate-800 p-3"
            />
          </div>

          <div>
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="mt-2 w-full rounded border border-slate-600 bg-slate-800 p-3"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded bg-amber-500 p-3 font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>

          {mensagem && (
            <p role="status" className="text-center text-amber-200">
              {mensagem}
            </p>
          )}

        </form>
      </section>
    </main>
  );
}

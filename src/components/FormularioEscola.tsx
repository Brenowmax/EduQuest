
"use client";

import { useActionState, useState } from "react";
import { cadastrarEscola } from "@/app/painel/desenvolvedor/actions";

export default function FormularioEscola() {
  const [aberto, setAberto] = useState(false);

  const [estado, acao, carregando] = useActionState(
    cadastrarEscola,
    {
      sucesso: false,
      mensagem: "",
    }
  );

  return (
    <section className="mb-8 rounded-xl border border-slate-700 bg-slate-900 p-6">

      <div className="flex flex-wrap items-center justify-between gap-4">

        <h2 className="text-2xl font-bold text-amber-400">
          Cadastro de instituições
        </h2>

        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          className="rounded-lg bg-amber-500 px-5 py-3 font-bold text-slate-950 hover:bg-amber-400"
        >
          {aberto ? "Fechar formulário" : "+ Nova escola"}
        </button>

      </div>

      {aberto && (
        <form action={acao} className="mt-6 space-y-5">

          <div>
            <label htmlFor="nome" className="text-slate-300">
              Nome da instituição
            </label>

            <input
              id="nome"
              name="nome"
              type="text"
              minLength={3}
              maxLength={150}
              required
              placeholder="Nome completo da escola"
              className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-800 p-3 text-white"
            />
          </div>

          <div>
            <label htmlFor="codigo" className="text-slate-300">
              Código institucional
            </label>

            <input
              id="codigo"
              name="codigo"
              type="text"
              minLength={3}
              maxLength={50}
              required
              placeholder="Exemplo: PEI-ESCOLA-002"
              className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-800 p-3 text-white"
            />
          </div>

          <p className="text-sm text-slate-400">
            A instituição será cadastrada como inativa
            até sua habilitação pelo desenvolvedor.
          </p>

          <button
            type="submit"
            disabled={carregando}
            className="rounded-lg bg-green-700 px-6 py-3 font-bold text-white hover:bg-green-600 disabled:opacity-50"
          >
            {carregando ? "Cadastrando..." : "Cadastrar escola"}
          </button>

          {estado.mensagem && (
            <p
              role="status"
              className={
                estado.sucesso
                  ? "text-green-400"
                  : "text-red-400"
              }
            >
              {estado.mensagem}
            </p>
          )}

        </form>
      )}

    </section>
  );
}
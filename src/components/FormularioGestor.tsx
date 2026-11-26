
"use client";

import { useActionState, useState } from "react";
import { cadastrarGestor } from "@/app/painel/desenvolvedor/actions";

type Escola = {
  id: string;
  nome: string;
  codigo: string;
  ativa: boolean;
};

export default function FormularioGestor({
  escolas,
}: {
  escolas: Escola[];
}) {
  const [aberto, setAberto] = useState(false);

  const [estado, acao, carregando] = useActionState(
    cadastrarGestor,
    {
      sucesso: false,
      mensagem: "",
    }
  );

  const campo =
    "mt-2 w-full rounded-lg border border-slate-600 bg-slate-800 p-3 text-white";

  return (
    <section className="mt-8 rounded-xl border border-slate-700 bg-slate-900 p-6">

      <div className="flex flex-wrap items-center justify-between gap-4">

        <h2 className="text-2xl font-bold text-amber-400">
          Gerenciamento de gestores
        </h2>

        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          className="rounded-lg bg-amber-500 px-5 py-3 font-bold text-slate-950"
        >
          {aberto ? "Fechar formulário" : "+ Novo gestor"}
        </button>

      </div>

      {aberto && (
        <form action={acao} className="mt-6 space-y-5">

          <label className="block">
            Nome completo
            <input
              name="nome"
              type="text"
              minLength={3}
              maxLength={150}
              required
              className={campo}
            />
          </label>

          <label className="block">
            E-mail de acesso
            <input
              name="email"
              type="email"
              autoComplete="off"
              required
              className={campo}
            />
          </label>

          <label className="block">
            Senha inicial
            <input
              name="senha"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
              required
              className={campo}
            />
            <span className="text-sm text-slate-400">
              Utilize pelo menos 12 caracteres.
            </span>
          </label>

          <label className="block">
            Instituição vinculada

            <select
              name="escola_id"
              required
              defaultValue=""
              className={campo}
            >
              <option value="" disabled>
                Selecione uma instituição
              </option>

              {escolas.map((escola) => (
                <option
                  key={escola.id}
                  value={escola.id}
                >
                  {escola.nome} —{" "}
                  {escola.ativa ? "Ativa" : "Inativa"}
                </option>
              ))}
            </select>

          </label>

          <p className="text-sm text-slate-400">
            O acesso institucional dependerá da
            situação da escola.
          </p>

          <button
            type="submit"
            disabled={carregando}
            className="rounded-lg bg-green-700 px-6 py-3 font-bold text-white disabled:opacity-50"
          >
            {carregando
              ? "Cadastrando..."
              : "Cadastrar gestor"}
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

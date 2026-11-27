
"use client";

import { useState } from "react";

import {
  cadastrarProfessor,
} from "@/app/painel/gestor/professores-actions";

type Props = {
  escolaId: string;
  escolaNome: string;
};

const campo =
  "mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 p-3 text-white";

export default function FormularioProfessor({
  escolaId,
  escolaNome,
}: Props) {

  const [aberto, setAberto] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] =
    useState("");

  const [mostrarSenha, setMostrarSenha] =
    useState(false);

  const [carregando, setCarregando] =
    useState(false);

  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);

  function limparFormulario() {
    setNome("");
    setEmail("");
    setSenha("");
    setConfirmacao("");
    setMostrarSenha(false);
  }

  async function salvar(
    evento: React.FormEvent<HTMLFormElement>
  ) {

    evento.preventDefault();

    setMensagem("");

    if (senha !== confirmacao) {
      setSucesso(false);
      setMensagem("As senhas não coincidem.");
      return;
    }

    if (senha.length < 12) {
      setSucesso(false);
      setMensagem(
        "A senha deve possuir pelo menos 12 caracteres."
      );
      return;
    }

    setCarregando(true);

    try {

      const resultado =
        await cadastrarProfessor(
          escolaId,
          nome,
          email,
          senha
        );

      setSucesso(resultado.sucesso);
      setMensagem(resultado.mensagem);

      if (resultado.sucesso) {
        limparFormulario();
        setAberto(false);
      }

    } catch {

      setSucesso(false);

      setMensagem(
        "Não foi possível confirmar o cadastro."
      );

    } finally {

      setCarregando(false);

    }
  }

  return (

    <section className="mb-6 rounded-xl border border-slate-700 bg-slate-900 p-6">

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>

          <h2 className="text-xl font-bold text-amber-400">
            Cadastro de professores
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            {escolaNome}
          </p>

        </div>

        <button
          type="button"
          disabled={carregando}
          onClick={() => {
            setAberto(!aberto);
            setMensagem("");

            if (aberto) {
              limparFormulario();
            }
          }}
          className="rounded-lg bg-amber-500 px-5 py-3 font-bold text-slate-950 disabled:opacity-50"
        >
          {aberto
            ? "Cancelar"
            : "+ Novo professor"}
        </button>

      </div>

      {aberto && (

        <form
          onSubmit={salvar}
          className="mt-6 space-y-5 rounded-xl border border-amber-700 bg-slate-800 p-6"
        >

          <label className="block">

            Nome completo

            <input
              type="text"
              required
              minLength={3}
              maxLength={150}
              autoComplete="off"
              value={nome}
              disabled={carregando}
              onChange={(e) =>
                setNome(e.target.value)
              }
              className={campo}
            />

          </label>

          <label className="block">

            E-mail de acesso

            <input
              type="email"
              required
              maxLength={254}
              autoComplete="off"
              value={email}
              disabled={carregando}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className={campo}
            />

          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            <label>

              Senha inicial

              <input
                type={mostrarSenha
                  ? "text"
                  : "password"}
                required
                minLength={12}
                autoComplete="new-password"
                value={senha}
                disabled={carregando}
                onChange={(e) =>
                  setSenha(e.target.value)
                }
                className={campo}
              />

            </label>

            <label>

              Confirmar senha

              <input
                type={mostrarSenha
                  ? "text"
                  : "password"}
                required
                minLength={12}
                autoComplete="new-password"
                value={confirmacao}
                disabled={carregando}
                onChange={(e) =>
                  setConfirmacao(e.target.value)
                }
                className={campo}
              />

            </label>

          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">

            <input
              type="checkbox"
              checked={mostrarSenha}
              disabled={carregando}
              onChange={(e) =>
                setMostrarSenha(e.target.checked)
              }
            />

            Mostrar senha

          </label>

          <div className="rounded-lg border border-slate-600 bg-slate-950 p-4">

            <p className="font-bold text-amber-400">
              Informações do vínculo
            </p>

            <p className="mt-2 text-sm text-slate-300">
              Instituição: {escolaNome}
            </p>

            <p className="mt-1 text-sm text-slate-300">
              Função: Professor
            </p>

            <p className="mt-1 text-sm text-green-400">
              Vínculo inicial: Ativo
            </p>

            <p className="mt-3 text-sm text-slate-400">
              A habilitação como tutor será realizada
              separadamente.
            </p>

          </div>

          <button
            type="submit"
            disabled={carregando}
            className="rounded-lg bg-green-700 px-6 py-3 font-bold text-white disabled:opacity-50"
          >

            {carregando
              ? "Cadastrando..."
              : "Cadastrar professor"}

          </button>

        </form>

      )}

      {mensagem && (

        <p
          role="status"
          className={
            sucesso
              ? "mt-5 text-green-400"
              : "mt-5 text-red-400"
          }
        >
          {mensagem}
        </p>

      )}

    </section>

  );
}

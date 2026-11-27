
"use client";

import { useState } from "react";

import {
  editarProfessor,
  alterarVinculoProfessor,
} from "@/app/painel/gestor/vinculos-professores-actions";

type Props = {
  vinculoId: string;
  professorNome: string;
  vinculoAtivo: boolean;
  perfilAtivo: boolean;
};

export default function AcoesProfessor({
  vinculoId,
  professorNome,
  vinculoAtivo,
  perfilAtivo,
}: Props) {

  const [carregando, setCarregando] =
    useState(false);

  const [mensagem, setMensagem] =
    useState("");

  const [sucesso, setSucesso] =
    useState(false);

  const [editando, setEditando] =
    useState(false);

  const [nome, setNome] =
    useState(professorNome);

  // ========================================
  // INICIAR EDICAO
  // ========================================

  function iniciarEdicao() {

    setNome(professorNome);
    setMensagem("");
    setEditando(true);

  }

  // ========================================
  // CANCELAR EDICAO
  // ========================================

  function cancelarEdicao() {

    setNome(professorNome);
    setMensagem("");
    setEditando(false);

  }

  // ========================================
  // SALVAR EDICAO
  // ========================================

  async function salvarEdicao() {

    const nomeValidado = nome.trim();

    if (
      nomeValidado.length < 3 ||
      nomeValidado.length > 150
    ) {

      setSucesso(false);

      setMensagem(
        "Informe um nome entre 3 e 150 caracteres."
      );

      return;
    }

    setCarregando(true);
    setMensagem("");

    try {

      const resultado = await editarProfessor(
        vinculoId,
        nomeValidado
      );

      setSucesso(resultado.sucesso);
      setMensagem(resultado.mensagem);

      if (resultado.sucesso) {
        setEditando(false);
      }

    } catch {

      setSucesso(false);

      setMensagem(
        "Não foi possível confirmar a edição."
      );

    } finally {

      setCarregando(false);

    }
  }

  // ========================================
  // ALTERAR VINCULO INSTITUCIONAL
  // ========================================

  async function alterarSituacao() {

    const novoEstado = !vinculoAtivo;

    const confirmacao = novoEstado
      ? `Deseja reativar o vínculo institucional de ${professorNome}?`
      : `Deseja desativar o vínculo institucional de ${professorNome}? O acesso a esta instituição será bloqueado. Os registros anteriores serão preservados.`;

    if (!window.confirm(confirmacao)) {
      return;
    }

    setCarregando(true);
    setMensagem("");

    try {

      const resultado =
        await alterarVinculoProfessor(
          vinculoId,
          novoEstado
        );

      setSucesso(resultado.sucesso);
      setMensagem(resultado.mensagem);

    } catch {

      setSucesso(false);

      setMensagem(
        "Não foi possível confirmar a alteração."
      );

    } finally {

      setCarregando(false);

    }
  }

  // ========================================
  // INTERFACE
  // ========================================

  return (

    <div className="mt-5 space-y-3 border-t border-slate-700 pt-4">

      <p className="text-sm font-bold text-slate-300">
        Gerenciamento institucional
      </p>

      {/* FORMULARIO DE EDICAO */}

      {editando ? (

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void salvarEdicao();
          }}
          className="space-y-4 rounded-lg border border-blue-700 bg-slate-900 p-4"
        >

          <h4 className="font-bold text-blue-400">
            Editar cadastro
          </h4>

          <div>

            <label
              htmlFor={`nome-${vinculoId}`}
              className="mb-2 block text-sm text-slate-300"
            >
              Nome completo
            </label>

            <input
              id={`nome-${vinculoId}`}
              type="text"
              value={nome}
              onChange={(event) =>
                setNome(event.target.value)
              }
              minLength={3}
              maxLength={150}
              required
              disabled={
                carregando ||
                !vinculoAtivo ||
                !perfilAtivo
              }
              className="w-full rounded-lg border border-slate-600 bg-slate-950 p-3 text-white outline-none focus:border-blue-400"
            />

          </div>

          <p className="text-xs text-slate-400">
            Apenas o nome poderá ser alterado.
            O e-mail e a senha permanecerão
            preservados.
          </p>

          <div className="grid grid-cols-2 gap-2">

            <button
              type="button"
              disabled={carregando}
              onClick={cancelarEdicao}
              className="rounded-lg border border-slate-600 px-3 py-2 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                carregando ||
                !vinculoAtivo ||
                !perfilAtivo ||
                nome.trim().length < 3 ||
                nome.trim().length > 150 ||
                nome.trim() === professorNome
              }
              className="rounded-lg bg-blue-700 px-3 py-2 font-bold text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {carregando
                ? "Salvando..."
                : "Salvar"}
            </button>

          </div>

        </form>

      ) : (

        <button
          type="button"
          disabled={
            carregando ||
            !vinculoAtivo ||
            !perfilAtivo
          }
          onClick={iniciarEdicao}
          className="w-full rounded-lg border border-blue-500 px-4 py-3 font-bold text-blue-400 hover:bg-blue-950 disabled:opacity-50"
        >
          Editar cadastro
        </button>

      )}

      {/* ATIVAR OU DESATIVAR VINCULO */}

      <button
        type="button"
        disabled={
          carregando ||
          editando ||
          (!vinculoAtivo && !perfilAtivo)
        }
        onClick={alterarSituacao}
        className={
          vinculoAtivo
            ? "w-full rounded-lg border border-red-500 px-4 py-3 font-bold text-red-400 hover:bg-red-950 disabled:opacity-50"
            : "w-full rounded-lg border border-green-500 px-4 py-3 font-bold text-green-400 hover:bg-green-950 disabled:opacity-50"
        }
      >

        {carregando && !editando
          ? "Processando..."
          : vinculoAtivo
            ? "Desativar vínculo"
            : "Reativar vínculo"}

      </button>

      {!perfilAtivo && !vinculoAtivo && (

        <p className="text-sm text-amber-400">
          O perfil global do professor está inativo.
        </p>

      )}

      {!vinculoAtivo && (

        <p className="text-xs text-slate-400">
          Reative o vínculo para editar o cadastro.
        </p>

      )}

      {/* MENSAGENS */}

      {mensagem && (

        <p
          role="status"
          className={
            sucesso
              ? "text-sm text-green-400"
              : "text-sm text-red-400"
          }
        >
          {mensagem}
        </p>

      )}

      <p className="text-xs text-slate-500">
        A ativação ou desativação afeta somente
        o vínculo com esta instituição.
        A edição do nome afeta o perfil global.
      </p>

    </div>

  );
}
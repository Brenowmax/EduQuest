
"use client";

import { useState } from "react";

import {
  habilitarTutor,
  alterarCapacidadeTutor,
  desativarTutor,
} from "@/app/painel/gestor/tutores-actions";

// ==========================================
// TIPOS
// ==========================================

type Props = {
  vinculoEscolarId: string;
  anoLetivoId: string;
  nome: string;
  funcao: "professor" | "gestor";
  tutorId: string | null;
  tutorAtivo: boolean;
  capacidadeAtual: number | null;
  totalTutorados: number;
  elegivel: boolean;
  anoAtivo: boolean;
};

// ==========================================
// COMPONENTE
// ==========================================

export default function AcoesTutor({
  vinculoEscolarId,
  anoLetivoId,
  nome,
  funcao,
  tutorId,
  tutorAtivo,
  capacidadeAtual,
  totalTutorados,
  elegivel,
  anoAtivo,
}: Props) {

  const [capacidade, setCapacidade] =
    useState<number>(
      capacidadeAtual ?? 25
    );

  const [carregando, setCarregando] =
    useState(false);

  const [mensagem, setMensagem] =
    useState("");

  const [sucesso, setSucesso] =
    useState(false);

  const capacidadeValida =
    Number.isInteger(capacidade) &&
    capacidade >= 1 &&
    capacidade <= 25 &&
    capacidade >= totalTutorados;

  const podeConfigurar =
    elegivel && anoAtivo;

  // ========================================
  // HABILITAR OU REATIVAR TUTOR
  // ========================================

  async function habilitar() {

    if (
      carregando ||
      tutorAtivo ||
      !podeConfigurar ||
      !capacidadeValida
    ) {
      return;
    }

    const confirmar = window.confirm(
      `Deseja habilitar ${nome} como tutor com capacidade de ${capacidade} alunos?`
    );

    if (!confirmar) return;

    setCarregando(true);
    setMensagem("");

    try {

      const resultado = await habilitarTutor(
        vinculoEscolarId,
        anoLetivoId,
        capacidade
      );

      setSucesso(resultado.sucesso);
      setMensagem(resultado.mensagem);

    } catch {

      setSucesso(false);
      setMensagem(
        "Não foi possível confirmar a habilitação."
      );

    } finally {

      setCarregando(false);

    }
  }

  // ========================================
  // ALTERAR CAPACIDADE
  // ========================================

  async function salvarCapacidade() {

    if (
      carregando ||
      !tutorId ||
      !tutorAtivo ||
      !podeConfigurar ||
      !capacidadeValida
    ) {
      return;
    }

    const confirmar = window.confirm(
      `Deseja alterar a capacidade de ${nome} para ${capacidade} tutorados?`
    );

    if (!confirmar) return;

    setCarregando(true);
    setMensagem("");

    try {

      const resultado =
        await alterarCapacidadeTutor(
          tutorId,
          capacidade
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
  // DESATIVAR TUTORIA
  // ========================================

  async function desativar() {

    if (
      carregando ||
      !tutorId ||
      !tutorAtivo
    ) {
      return;
    }

    if (totalTutorados > 0) {

      setSucesso(false);
      setMensagem(
        "Redistribua os tutorados antes de desativar a tutoria."
      );

      return;
    }

    const confirmar = window.confirm(
      `Deseja desativar a tutoria de ${nome}? O vínculo institucional e o histórico serão preservados.`
    );

    if (!confirmar) return;

    setCarregando(true);
    setMensagem("");

    try {

      const resultado =
        await desativarTutor(tutorId);

      setSucesso(resultado.sucesso);
      setMensagem(resultado.mensagem);

    } catch {

      setSucesso(false);
      setMensagem(
        "Não foi possível confirmar a desativação."
      );

    } finally {

      setCarregando(false);

    }
  }

  // ========================================
  // INTERFACE
  // ========================================

  return (

    <div className="mt-5 space-y-4 border-t border-slate-700 pt-4">

      <h4 className="font-bold text-amber-400">
        Configuração de tutoria
      </h4>

      {funcao === "gestor" && (

        <p className="text-sm text-purple-400">
          Gestor elegível para atuar como tutor.
        </p>

      )}

      {/* CAPACIDADE */}

      <div>

        <label
          htmlFor={`capacidade-${vinculoEscolarId}-${anoLetivoId}`}
          className="block text-sm text-slate-300"
        >
          Capacidade máxima
        </label>

        <input
          id={`capacidade-${vinculoEscolarId}-${anoLetivoId}`}
          type="number"
          min={1}
          max={25}
          step={1}
          value={
            Number.isNaN(capacidade)
              ? ""
              : capacidade
          }
          disabled={
            carregando ||
            !podeConfigurar
          }
          onChange={(event) => {
            setCapacidade(
              event.target.valueAsNumber
            );
            setMensagem("");
          }}
          className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-900 p-3 text-white disabled:opacity-50"
        />

        <p className="mt-2 text-xs text-slate-400">
          Limite permitido: de 1 a 25 tutorados.
        </p>

      </div>

      {/* AVISOS */}

      {!capacidadeValida && (

        <p className="text-sm text-red-400">
          A capacidade deve estar entre 1 e 25
          e não pode ser inferior à ocupação atual.
        </p>

      )}

      {!anoAtivo && (

        <p className="text-sm text-amber-400">
          O ano letivo está inativo.
        </p>

      )}

      {!elegivel && (

        <p className="text-sm text-amber-400">
          O profissional não possui vínculo
          institucional ativo e válido.
        </p>

      )}

      {/* TUTOR ATIVO */}

      {tutorAtivo ? (

        <>

          <button
            type="button"
            disabled={
              carregando ||
              !podeConfigurar ||
              !capacidadeValida ||
              capacidade === capacidadeAtual
            }
            onClick={salvarCapacidade}
            className="w-full rounded-lg border border-blue-500 px-4 py-3 font-bold text-blue-400 hover:bg-blue-950 disabled:opacity-50"
          >

            {carregando
              ? "Processando..."
              : "Salvar capacidade"}

          </button>

          <button
            type="button"
            disabled={
              carregando ||
              totalTutorados > 0
            }
            onClick={desativar}
            className="w-full rounded-lg border border-red-500 px-4 py-3 font-bold text-red-400 hover:bg-red-950 disabled:opacity-50"
          >

            Desativar tutoria

          </button>

          {totalTutorados > 0 && (

            <p className="text-xs text-amber-400">
              Redistribua os tutorados ativos
              antes de desativar a tutoria.
            </p>

          )}

        </>

      ) : (

        <button
          type="button"
          disabled={
            carregando ||
            !podeConfigurar ||
            !capacidadeValida
          }
          onClick={habilitar}
          className="w-full rounded-lg border border-green-500 px-4 py-3 font-bold text-green-400 hover:bg-green-950 disabled:opacity-50"
        >

          {carregando
            ? "Processando..."
            : tutorId
              ? "Reativar tutoria"
              : "Habilitar como tutor"}

        </button>

      )}

      {/* MENSAGEM DE RESULTADO */}

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

    </div>

  );
}

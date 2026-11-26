
"use client";

import { useState } from "react";
import {
  alterarSituacaoEscola,
  editarEscola,
} from "@/app/painel/desenvolvedor/actions";

type Escola = {
  id: string;
  nome: string;
  codigo: string;
  ativa: boolean;
};

export default function AcoesEscola({
  escola,
}: {
  escola: Escola;
}) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(escola.nome);
  const [codigo, setCodigo] = useState(escola.codigo);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function alterarSituacao() {
    const acao = escola.ativa
      ? "desativar"
      : "ativar";

    if (!window.confirm(
      `Deseja realmente ${acao} a instituição ${escola.nome}?`
    )) {
      return;
    }

    setCarregando(true);
    setMensagem("");

    try {
      const resultado = await alterarSituacaoEscola(
        escola.id,
        !escola.ativa
      );

      setSucesso(resultado.sucesso);
      setMensagem(resultado.mensagem);
    } catch {
      setSucesso(false);
      setMensagem("Erro ao alterar a situação.");
    } finally {
      setCarregando(false);
    }
  }

  async function salvarEdicao() {
    setCarregando(true);
    setMensagem("");

    try {
      const resultado = await editarEscola(
        escola.id,
        nome,
        codigo
      );

      setSucesso(resultado.sucesso);
      setMensagem(resultado.mensagem);

      if (resultado.sucesso) {
        setEditando(false);
      }
    } catch {
      setSucesso(false);
      setMensagem("Erro ao editar a instituição.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="space-y-3">

      <div className="flex flex-wrap gap-2">

        <button
          type="button"
          disabled={carregando}
          onClick={() => {
            setNome(escola.nome);
            setCodigo(escola.codigo);
            setEditando(!editando);
            setMensagem("");
          }}
          className="rounded border border-blue-500 px-3 py-2 text-blue-400 disabled:opacity-50"
        >
          Editar
        </button>

        <button
          type="button"
          disabled={carregando || editando}
          onClick={alterarSituacao}
          className={
            escola.ativa
              ? "rounded border border-red-500 px-3 py-2 text-red-400 disabled:opacity-50"
              : "rounded border border-green-500 px-3 py-2 text-green-400 disabled:opacity-50"
          }
        >
          {carregando
            ? "Aguarde..."
            : escola.ativa
              ? "Desativar"
              : "Ativar"}
        </button>

      </div>

      {editando && (
        <div className="space-y-3 rounded-lg border border-slate-600 bg-slate-800 p-4">

          <label className="block text-sm">
            Nome da instituição
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={150}
              className="mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2"
            />
          </label>

          <label className="block text-sm">
            Código institucional
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              maxLength={50}
              className="mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2"
            />
          </label>

          <div className="flex gap-2">

            <button
              type="button"
              disabled={carregando}
              onClick={salvarEdicao}
              className="rounded bg-green-700 px-4 py-2 text-white disabled:opacity-50"
            >
              Salvar
            </button>

            <button
              type="button"
              disabled={carregando}
              onClick={() => setEditando(false)}
              className="rounded bg-slate-600 px-4 py-2 text-white"
            >
              Cancelar
            </button>

          </div>

        </div>
      )}

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


"use client";

import { useState } from "react";

import {
  editarGestor,
  alterarSituacaoGestor,
  redefinirSenhaGestor,
} from "@/app/painel/desenvolvedor/gestores-actions";

type Gestor = {
  id: string;
  nome: string;
  email: string | null;
  ativo: boolean;
};

export default function AcoesGestor({
  gestor,
}: {
  gestor: Gestor;
}) {
  const [editando, setEditando] = useState(false);

  const [redefinindo, setRedefinindo] =
    useState(false);

  const [nome, setNome] = useState(gestor.nome);

  const [senha, setSenha] = useState("");

  const [confirmarSenha, setConfirmarSenha] =
    useState("");

  const [carregando, setCarregando] =
    useState(false);

  const [mensagem, setMensagem] = useState("");

  const [sucesso, setSucesso] = useState(false);

  // ========================================
  // LIMPAR CAMPOS DE SENHA
  // ========================================

  function limparSenhas() {
    setSenha("");
    setConfirmarSenha("");
  }

  // ========================================
  // EDITAR GESTOR
  // ========================================

  async function salvarEdicao() {
    setCarregando(true);
    setMensagem("");

    try {
      const resultado = await editarGestor(
        gestor.id,
        nome
      );

      setSucesso(resultado.sucesso);
      setMensagem(resultado.mensagem);

      if (resultado.sucesso) {
        setEditando(false);
      }
    } catch {
      setSucesso(false);
      setMensagem("Erro ao editar o gestor.");
    } finally {
      setCarregando(false);
    }
  }

  // ========================================
  // ATIVAR OU DESATIVAR
  // ========================================

  async function alterarSituacao() {
    const acao = gestor.ativo
      ? "desativar"
      : "ativar";

    const confirmar = window.confirm(
      `Deseja realmente ${acao} o gestor ${gestor.nome}?`
    );

    if (!confirmar) return;

    setCarregando(true);
    setMensagem("");

    try {
      const resultado = await alterarSituacaoGestor(
        gestor.id,
        !gestor.ativo
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

  // ========================================
  // REDEFINIR SENHA
  // ========================================

  async function salvarNovaSenha() {
    setMensagem("");

    if (senha.length < 12) {
      setSucesso(false);
      setMensagem(
        "A senha deve possuir pelo menos 12 caracteres."
      );
      return;
    }

    if (
      new TextEncoder().encode(senha).length > 72
    ) {
      setSucesso(false);
      setMensagem("A senha excede o tamanho permitido.");
      return;
    }

    if (senha !== confirmarSenha) {
      setSucesso(false);
      setMensagem("As senhas não coincidem.");
      return;
    }

    const confirmar = window.confirm(
      `Deseja redefinir a senha do gestor ${gestor.nome}?`
    );

    if (!confirmar) return;

    setCarregando(true);

    try {
      const resultado = await redefinirSenhaGestor(
        gestor.id,
        senha,
        confirmarSenha
      );

      setSucesso(resultado.sucesso);
      setMensagem(resultado.mensagem);

      if (resultado.sucesso) {
        setRedefinindo(false);
      }
    } catch {
      setSucesso(false);
      setMensagem(
        "Não foi possível confirmar a alteração da senha."
      );
    } finally {
      limparSenhas();
      setCarregando(false);
    }
  }

  // ========================================
  // INTERFACE
  // ========================================

  return (
    <div className="space-y-3">

      {/* BOTOES DE GERENCIAMENTO */}

      <div className="flex flex-wrap gap-2">

        <button
          type="button"
          disabled={carregando}
          onClick={() => {
            setNome(gestor.nome);
            setEditando(!editando);
            setRedefinindo(false);
            limparSenhas();
            setMensagem("");
          }}
          className="rounded border border-blue-500 px-3 py-2 text-blue-400 disabled:opacity-50"
        >
          Editar
        </button>

        <button
          type="button"
          disabled={carregando}
          onClick={() => {
            setRedefinindo(!redefinindo);
            setEditando(false);
            limparSenhas();
            setMensagem("");
          }}
          className="rounded border border-amber-500 px-3 py-2 text-amber-400 disabled:opacity-50"
        >
          Redefinir senha
        </button>

        <button
          type="button"
          disabled={
            carregando ||
            editando ||
            redefinindo
          }
          onClick={alterarSituacao}
          className={
            gestor.ativo
              ? "rounded border border-red-500 px-3 py-2 text-red-400 disabled:opacity-50"
              : "rounded border border-green-500 px-3 py-2 text-green-400 disabled:opacity-50"
          }
        >
          {gestor.ativo ? "Desativar" : "Ativar"}
        </button>

      </div>

      {/* FORMULARIO DE EDICAO */}

      {editando && (
        <div className="space-y-3 rounded-lg border border-slate-600 bg-slate-800 p-4">

          <label className="block text-sm">
            Nome completo

            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              minLength={3}
              maxLength={150}
              disabled={carregando}
              className="mt-2 w-full rounded border border-slate-600 bg-slate-950 p-2 text-white"
            />
          </label>

          <p className="text-xs text-slate-400">
            E-mail: {gestor.email ?? "Não informado"}
          </p>

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              disabled={
                carregando ||
                nome.trim().length < 3
              }
              onClick={salvarEdicao}
              className="rounded bg-green-700 px-4 py-2 text-white disabled:opacity-50"
            >
              {carregando ? "Salvando..." : "Salvar"}
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

      {/* FORMULARIO DE NOVA SENHA */}

      {redefinindo && (
        <div className="space-y-4 rounded-lg border border-amber-700 bg-slate-800 p-4">

          <h3 className="font-bold text-amber-400">
            Redefinir senha do gestor
          </h3>

          <p className="text-sm text-slate-300">
            {gestor.nome}
          </p>

          <p className="text-xs text-slate-400">
            {gestor.email ?? "Não informado"}
          </p>

          <label className="block text-sm">
            Nova senha

            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
              disabled={carregando}
              className="mt-2 w-full rounded border border-slate-600 bg-slate-950 p-2 text-white"
            />
          </label>

          <label className="block text-sm">
            Confirmar nova senha

            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) =>
                setConfirmarSenha(e.target.value)
              }
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
              disabled={carregando}
              className="mt-2 w-full rounded border border-slate-600 bg-slate-950 p-2 text-white"
            />
          </label>

          <p className="text-xs text-slate-400">
            Utilize pelo menos 12 caracteres.
          </p>

          {confirmarSenha &&
            senha !== confirmarSenha && (
              <p className="text-xs text-red-400">
                As senhas não coincidem.
              </p>
            )}

          <p className="text-xs text-amber-400">
            A senha anterior será substituída.
          </p>

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              disabled={
                carregando ||
                senha.length < 12 ||
                senha !== confirmarSenha
              }
              onClick={salvarNovaSenha}
              className="rounded bg-amber-600 px-4 py-2 font-bold text-white disabled:opacity-50"
            >
              {carregando
                ? "Processando..."
                : "Confirmar nova senha"}
            </button>

            <button
              type="button"
              disabled={carregando}
              onClick={() => {
                setRedefinindo(false);
                limparSenhas();
                setMensagem("");
              }}
              className="rounded bg-slate-600 px-4 py-2 text-white"
            >
              Cancelar
            </button>

          </div>

        </div>
      )}

      {/* MENSAGENS DO SISTEMA */}

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
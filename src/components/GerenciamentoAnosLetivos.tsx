
"use client";

import { useState } from "react";

import {
  cadastrarAnoLetivo,
  alterarSituacaoAnoLetivo,
} from "@/app/painel/gestor/anos-letivos-actions";

type AnoLetivo = {
  id: string;
  ano: number;
  ativo: boolean;
};

type Props = {
  escolaId: string;
  escolaNome: string;
  anos: AnoLetivo[];
};

export default function GerenciamentoAnosLetivos({
  escolaId,
  escolaNome,
  anos,
}: Props) {
  const [aberto, setAberto] = useState(false);

  const [novoAno, setNovoAno] = useState("");

  const [carregando, setCarregando] =
    useState(false);

  const [mensagem, setMensagem] = useState("");

  const [sucesso, setSucesso] = useState(false);

  const anoAtivo = anos.find((ano) => ano.ativo);

  // ========================================
  // CADASTRAR ANO
  // ========================================

  async function salvarAno() {
    setMensagem("");

    const ano = Number(novoAno);

    if (
      !/^\d{4}$/.test(novoAno) ||
      !Number.isInteger(ano) ||
      ano < 2000 ||
      ano > 2100
    ) {
      setSucesso(false);
      setMensagem("Informe um ano válido.");
      return;
    }

    if (anos.some((item) => item.ano === ano)) {
      setSucesso(false);
      setMensagem("Este ano já está cadastrado.");
      return;
    }

    setCarregando(true);

    try {
      const resultado = await cadastrarAnoLetivo(
        escolaId,
        ano
      );

      setSucesso(resultado.sucesso);
      setMensagem(resultado.mensagem);

      if (resultado.sucesso) {
        setNovoAno("");
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

  // ========================================
  // ATIVAR OU ENCERRAR ANO
  // ========================================

  async function alterarSituacao(
    ano: AnoLetivo
  ) {
    const texto = ano.ativo
      ? `Deseja encerrar o ano letivo ${ano.ano}? Os registros serão preservados.`
      : `Deseja ativar o ano letivo ${ano.ano}? O ano atualmente ativo, se houver, será encerrado.`;

    if (!window.confirm(texto)) return;

    setCarregando(true);
    setMensagem("");

    try {
      const resultado =
        await alterarSituacaoAnoLetivo(
          ano.id,
          !ano.ativo
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
    <section className="mb-8 rounded-xl border border-slate-700 bg-slate-900 p-6">

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

        <div>
          <h2 className="text-2xl font-bold text-amber-400">
            Anos letivos
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {escolaNome}
          </p>
        </div>

        <button
          type="button"
          disabled={carregando}
          onClick={() => {
            setAberto(!aberto);
            setMensagem("");
          }}
          className="rounded-lg bg-amber-500 px-5 py-3 font-bold text-slate-950 disabled:opacity-50"
        >
          {aberto ? "Cancelar" : "+ Novo ano letivo"}
        </button>

      </div>

      {/* INDICADORES */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

        <article className="rounded-xl border border-slate-700 bg-slate-950 p-5">
          <p className="text-sm text-slate-400">
            Ano letivo ativo
          </p>

          <p className="mt-2 text-3xl font-bold text-green-400">
            {anoAtivo?.ano ?? "Não definido"}
          </p>
        </article>

        <article className="rounded-xl border border-slate-700 bg-slate-950 p-5">
          <p className="text-sm text-slate-400">
            Anos cadastrados
          </p>

          <p className="mt-2 text-3xl font-bold text-amber-400">
            {anos.length}
          </p>
        </article>

      </div>

      {/* FORMULARIO DE CADASTRO */}

      {aberto && (
        <div className="mb-6 space-y-4 rounded-xl border border-amber-700 bg-slate-800 p-5">

          <label className="block">
            Ano letivo

            <input
              type="number"
              min={2000}
              max={2100}
              value={novoAno}
              disabled={carregando}
              onChange={(e) =>
                setNovoAno(e.target.value)
              }
              placeholder="Exemplo: 2027"
              className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 p-3 text-white"
            />
          </label>

          <p className="text-sm text-slate-400">
            O novo ano será cadastrado como inativo.
          </p>

          <button
            type="button"
            disabled={carregando || !novoAno}
            onClick={salvarAno}
            className="rounded-lg bg-green-700 px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            {carregando
              ? "Processando..."
              : "Cadastrar ano letivo"}
          </button>

        </div>
      )}

      {/* LISTAGEM */}

      {anos.length === 0 ? (

        <p className="text-slate-400">
          Nenhum ano letivo cadastrado.
        </p>

      ) : (

        <div className="space-y-4">

          {[...anos]
            .sort((a, b) => b.ano - a.ano)
            .map((ano) => (

              <article
                key={ano.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-700 bg-slate-950 p-5"
              >

                <div>
                  <h3 className="text-2xl font-bold text-amber-400">
                    {ano.ano}
                  </h3>

                  <p
                    className={
                      ano.ativo
                        ? "mt-2 text-sm text-green-400"
                        : "mt-2 text-sm text-slate-400"
                    }
                  >
                    {ano.ativo ? "Ativo" : "Inativo"}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={carregando}
                  onClick={() =>
                    alterarSituacao(ano)
                  }
                  className={
                    ano.ativo
                      ? "rounded-lg border border-red-500 px-4 py-2 text-red-400 disabled:opacity-50"
                      : "rounded-lg border border-green-500 px-4 py-2 text-green-400 disabled:opacity-50"
                  }
                >
                  {ano.ativo
                    ? "Encerrar ano"
                    : "Ativar ano"}
                </button>

              </article>

            ))}

        </div>

      )}

      {mensagem && (
        <p
          role="status"
          className={
            sucesso
              ? "mt-4 text-green-400"
              : "mt-4 text-red-400"
          }
        >
          {mensagem}
        </p>
      )}

    </section>
  );
}

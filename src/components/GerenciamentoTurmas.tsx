
"use client";

import { useState } from "react";

import {
  cadastrarTurma,
  editarTurma,
  alterarSituacaoTurma,
} from "@/app/painel/gestor/turmas-actions";

type AnoLetivo = {
  id: string;
  ano: number;
  ativo: boolean;
};

type Turma = {
  id: string;
  ano_letivo_id: string;
  nome: string;
  serie: number;
  ativa: boolean;
};

type Props = {
  escolaId: string;
  escolaNome: string;
  anos: AnoLetivo[];
  turmas: Turma[];
};

const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const campo =
  "mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 p-3 text-white";

export default function GerenciamentoTurmas({
  escolaId,
  escolaNome,
  anos,
  turmas,
}: Props) {
  const [anoId, setAnoId] = useState(
    anos.find((ano) => ano.ativo)?.id ??
      anos[0]?.id ??
      ""
  );

  const [aberto, setAberto] = useState(false);
  const [serie, setSerie] = useState("6");
  const [letra, setLetra] = useState("A");

  const [editando, setEditando] =
    useState<string | null>(null);

  const [letraEdicao, setLetraEdicao] =
    useState("A");

  const [carregando, setCarregando] =
    useState(false);

  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);

  const anoSelecionado = anos.find(
    (ano) => ano.id === anoId
  );

  const turmasAno = turmas
    .filter((turma) => turma.ano_letivo_id === anoId)
    .sort(
      (a, b) =>
        a.serie - b.serie ||
        a.nome.localeCompare(b.nome)
    );

  const totalAtivas = turmasAno.filter(
    (turma) => turma.ativa
  ).length;

  const nomeNovaTurma = `${serie}º${letra}`;

  const duplicada = turmasAno.some(
    (turma) => turma.nome === nomeNovaTurma
  );

  // ========================================
  // CADASTRAR TURMA
  // ========================================

  async function salvarTurma() {
    if (!anoSelecionado || duplicada) return;

    setCarregando(true);
    setMensagem("");

    try {
      const resultado = await cadastrarTurma(
        escolaId,
        anoId,
        Number(serie),
        letra
      );

      setSucesso(resultado.sucesso);
      setMensagem(resultado.mensagem);

      if (resultado.sucesso) {
        setAberto(false);
      }
    } catch {
      setSucesso(false);
      setMensagem("Não foi possível confirmar o cadastro.");
    } finally {
      setCarregando(false);
    }
  }

  // ========================================
  // EDITAR TURMA
  // ========================================

  async function salvarEdicao(turma: Turma) {
    setCarregando(true);
    setMensagem("");

    try {
      const resultado = await editarTurma(
        turma.id,
        letraEdicao
      );

      setSucesso(resultado.sucesso);
      setMensagem(resultado.mensagem);

      if (resultado.sucesso) {
        setEditando(null);
      }
    } catch {
      setSucesso(false);
      setMensagem("Não foi possível confirmar a edição.");
    } finally {
      setCarregando(false);
    }
  }

  // ========================================
  // ALTERAR SITUACAO
  // ========================================

  async function alterarSituacao(turma: Turma) {
    const acao = turma.ativa
      ? "desativar"
      : "ativar";

    if (
      !window.confirm(
        `Deseja ${acao} a turma ${turma.nome}?`
      )
    ) {
      return;
    }

    setCarregando(true);
    setMensagem("");

    try {
      const resultado = await alterarSituacaoTurma(
        turma.id,
        !turma.ativa
      );

      setSucesso(resultado.sucesso);
      setMensagem(resultado.mensagem);
    } catch {
      setSucesso(false);
      setMensagem("Não foi possível alterar a situação.");
    } finally {
      setCarregando(false);
    }
  }

  // ========================================
  // INTERFACE
  // ========================================

  return (
    <section className="mb-8 rounded-xl border border-slate-700 bg-slate-900 p-6">

      <h2 className="text-2xl font-bold text-amber-400">
        {escolaNome}
      </h2>

      <p className="mb-6 mt-2 text-slate-400">
        Gerenciamento de turmas por ano letivo.
      </p>

      {anos.length === 0 ? (
        <p className="text-amber-400">
          Cadastre um ano letivo antes de criar turmas.
        </p>
      ) : (
        <>

          {/* SELECAO DO ANO LETIVO */}

          <label className="block">
            Ano letivo

            <select
              value={anoId}
              disabled={carregando}
              onChange={(e) => {
                setAnoId(e.target.value);
                setEditando(null);
                setAberto(false);
                setMensagem("");
              }}
              className={campo}
            >
              {anos.map((ano) => (
                <option key={ano.id} value={ano.id}>
                  {ano.ano} — {ano.ativo ? "Ativo" : "Inativo"}
                </option>
              ))}
            </select>
          </label>

          {/* INDICADORES */}

          <div className="my-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

            {[
              {
                titulo: "Turmas cadastradas",
                valor: turmasAno.length,
                cor: "text-amber-400",
              },
              {
                titulo: "Turmas ativas",
                valor: totalAtivas,
                cor: "text-green-400",
              },
              {
                titulo: "Turmas inativas",
                valor: turmasAno.length - totalAtivas,
                cor: "text-red-400",
              },
            ].map((item) => (
              <article
                key={item.titulo}
                className="rounded-xl border border-slate-700 bg-slate-950 p-5"
              >
                <p className="text-sm text-slate-400">
                  {item.titulo}
                </p>

                <p className={`mt-2 text-3xl font-bold ${item.cor}`}>
                  {item.valor}
                </p>
              </article>
            ))}

          </div>

          {/* CABECALHO */}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

            <h3 className="text-xl font-bold text-amber-400">
              Turmas de {anoSelecionado?.ano}
            </h3>

            <button
              type="button"
              disabled={carregando}
              onClick={() => {
                setAberto(!aberto);
                setEditando(null);
                setMensagem("");
              }}
              className="rounded-lg bg-amber-500 px-5 py-3 font-bold text-slate-950 disabled:opacity-50"
            >
              {aberto ? "Cancelar" : "+ Nova turma"}
            </button>

          </div>

          {/* FORMULARIO DE CADASTRO */}

          {aberto && (
            <div className="mb-6 space-y-4 rounded-xl border border-amber-700 bg-slate-800 p-5">

              <div className="grid grid-cols-2 gap-4">

                <label>
                  Série

                  <select
                    value={serie}
                    disabled={carregando}
                    onChange={(e) => setSerie(e.target.value)}
                    className={campo}
                  >
                    {[6, 7, 8, 9].map((numero) => (
                      <option key={numero} value={numero}>
                        {numero}º ano
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Identificação

                  <select
                    value={letra}
                    disabled={carregando}
                    onChange={(e) => setLetra(e.target.value)}
                    className={campo}
                  >
                    {letras.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

              </div>

              <p className="text-lg font-bold text-amber-400">
                Nova turma: {nomeNovaTurma}
              </p>

              {duplicada && (
                <p className="text-red-400">
                  Esta turma já está cadastrada neste ano letivo.
                </p>
              )}

              <button
                type="button"
                disabled={carregando || duplicada}
                onClick={salvarTurma}
                className="rounded-lg bg-green-700 px-5 py-3 font-bold text-white disabled:opacity-50"
              >
                {carregando
                  ? "Processando..."
                  : "Cadastrar turma"}
              </button>

            </div>
          )}

          {/* LISTAGEM DE TURMAS */}

          {turmasAno.length === 0 ? (
            <p className="text-slate-400">
              Nenhuma turma cadastrada neste ano letivo.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

              {turmasAno.map((turma) => (
                <article
                  key={turma.id}
                  className="rounded-xl border border-slate-700 bg-slate-950 p-5"
                >

                  <h4 className="text-3xl font-bold text-amber-400">
                    {turma.nome}
                  </h4>

                  <p className="mt-2 text-sm text-slate-400">
                    {turma.serie}º ano
                  </p>

                  <p className={
                    turma.ativa
                      ? "my-3 text-green-400"
                      : "my-3 text-red-400"
                  }>
                    {turma.ativa ? "Ativa" : "Inativa"}
                  </p>

                  <div className="flex flex-wrap gap-2 border-t border-slate-700 pt-4">

                    <button
                      type="button"
                      disabled={carregando}
                      onClick={() => {
                        setEditando(
                          editando === turma.id
                            ? null
                            : turma.id
                        );
                        setLetraEdicao(
                          turma.nome.slice(-1)
                        );
                        setAberto(false);
                        setMensagem("");
                      }}
                      className="rounded border border-blue-500 px-3 py-2 text-blue-400 disabled:opacity-50"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      disabled={
                        carregando ||
                        editando === turma.id
                      }
                      onClick={() => alterarSituacao(turma)}
                      className={
                        turma.ativa
                          ? "rounded border border-red-500 px-3 py-2 text-red-400 disabled:opacity-50"
                          : "rounded border border-green-500 px-3 py-2 text-green-400 disabled:opacity-50"
                      }
                    >
                      {turma.ativa
                        ? "Desativar"
                        : "Ativar"}
                    </button>

                  </div>

                  {editando === turma.id && (
                    <div className="mt-4 space-y-3 rounded-lg border border-slate-600 bg-slate-800 p-3">

                      <p className="text-sm text-slate-400">
                        A série será preservada.
                      </p>

                      <label className="block">
                        Identificação

                        <select
                          value={letraEdicao}
                          disabled={carregando}
                          onChange={(e) =>
                            setLetraEdicao(e.target.value)
                          }
                          className={campo}
                        >
                          {letras.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </label>

                      <p className="text-amber-400">
                        {turma.serie}º{letraEdicao}
                      </p>

                      <div className="flex flex-wrap gap-2">

                        <button
                          type="button"
                          disabled={carregando}
                          onClick={() => salvarEdicao(turma)}
                          className="rounded bg-green-700 px-3 py-2 disabled:opacity-50"
                        >
                          Salvar
                        </button>

                        <button
                          type="button"
                          disabled={carregando}
                          onClick={() => setEditando(null)}
                          className="rounded bg-slate-600 px-3 py-2"
                        >
                          Cancelar
                        </button>

                      </div>

                    </div>
                  )}

                </article>
              ))}

            </div>
          )}

        </>
      )}

      {mensagem && (
        <p
          role="status"
          className={
            sucesso
              ? "mt-6 text-green-400"
              : "mt-6 text-red-400"
          }
        >
          {mensagem}
        </p>
      )}

    </section>
  );
}

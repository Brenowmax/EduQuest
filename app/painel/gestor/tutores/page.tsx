
import { Suspense } from "react";
import Link from "next/link";

import { exigirPerfil } from "@/src/lib/auth";
import { createClient } from "@/src/lib/supabase/server";
import GerenciamentoTutores from "@/src/components/GerenciamentoTutores";

// ==========================================
// CONFIGURACAO DA PAGINACAO
// ==========================================

const TAMANHO_PAGINA = 200;
const TAMANHO_LOTE = 50;

type Registro = {
  id: string;
};

type ResultadoConsulta<T> = {
  data: T[] | null;
  error: unknown;
};

async function consultarPaginado<T extends Registro>(
  consultar: (
    cursor: string | null
  ) => PromiseLike<ResultadoConsulta<T>>
): Promise<T[]> {
  const registros: T[] = [];

  let cursor: string | null = null;

  while (true) {
    const { data, error } = await consultar(cursor);

    if (error) {
      throw new Error("Falha na consulta paginada.");
    }

    const pagina = data ?? [];

    if (pagina.length === 0) {
      break;
    }

    registros.push(...pagina);

    const ultimoId = pagina[pagina.length - 1].id;

    if (ultimoId === cursor) {
      throw new Error("Cursor de paginacao invalido.");
    }

    cursor = ultimoId;
  }

  return registros;
}

function dividirLotes<T>(itens: T[]): T[][] {
  const lotes: T[][] = [];

  for (
    let inicio = 0;
    inicio < itens.length;
    inicio += TAMANHO_LOTE
  ) {
    lotes.push(
      itens.slice(inicio, inicio + TAMANHO_LOTE)
    );
  }

  return lotes;
}

// ==========================================
// TIPOS
// ==========================================

type VinculoGestor = {
  id: string;
  escola_id: string;
};

type Escola = {
  id: string;
  nome: string;
};

type AnoLetivo = {
  id: string;
  escola_id: string;
  ano: number;
  ativo: boolean;
};

type VinculoEscolar = {
  id: string;
  perfil_id: string;
  escola_id: string;
  funcao: string;
  ativo: boolean;
};

type Perfil = {
  id: string;
  nome: string;
  tipo: string;
  ativo: boolean;
};

type Tutor = {
  id: string;
  vinculo_escolar_id: string;
  escola_id: string;
  ano_letivo_id: string;
  capacidade_maxima: number;
  ativo: boolean;
};

type Tutorado = {
  id: string;
  tutor_id: string;
};

// ==========================================
// PAGINA PRINCIPAL
// ==========================================

export default function PaginaTutores() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 p-8 text-white">
          Carregando gerenciamento de tutoria...
        </main>
      }
    >
      <ConteudoTutores />
    </Suspense>
  );
}

// ==========================================
// AUTENTICACAO
// ==========================================

async function ConteudoTutores() {
  const perfil = await exigirPerfil("gestor");

  try {
    return await carregarTutores(perfil.id);
  } catch (erro) {
    console.error("ERRO CONSULTA TUTORIA:", erro);

    return (
      <EstadoVazio
        mensagem="Não foi possível consultar os dados de tutoria. Tente novamente."
      />
    );
  }
}

// ==========================================
// CONSULTAS AO SUPABASE
// ==========================================

async function carregarTutores(gestorId: string) {
  const supabase = await createClient();

  // VINCULOS DO GESTOR

  const vinculosGestor =
    await consultarPaginado<VinculoGestor>(
      (cursor) => {
        let consulta = supabase
          .from("vinculos_escolares")
          .select("id, escola_id")
          .eq("perfil_id", gestorId)
          .eq("funcao", "gestor")
          .eq("ativo", true)
          .order("id")
          .limit(TAMANHO_PAGINA);

        if (cursor !== null) {
          consulta = consulta.gt("id", cursor);
        }

        return consulta;
      }
    );

  const escolaIds = [
    ...new Set(
      vinculosGestor.map(
        (vinculo) => vinculo.escola_id
      )
    ),
  ];

  if (escolaIds.length === 0) {
    return (
      <EstadoVazio
        mensagem="Nenhuma instituição disponível."
      />
    );
  }

  // ESCOLAS ATIVAS

  const escolas: Escola[] = [];

  for (const lote of dividirLotes(escolaIds)) {
    const resultado =
      await consultarPaginado<Escola>(
        (cursor) => {
          let consulta = supabase
            .from("escolas")
            .select("id, nome")
            .in("id", lote)
            .eq("ativa", true)
            .order("id")
            .limit(TAMANHO_PAGINA);

          if (cursor !== null) {
            consulta = consulta.gt("id", cursor);
          }

          return consulta;
        }
      );

    escolas.push(...resultado);
  }

  escolas.sort(
    (a, b) => a.nome.localeCompare(b.nome, "pt-BR")
  );

  if (escolas.length === 0) {
    return (
      <EstadoVazio
        mensagem="Nenhuma instituição ativa disponível."
      />
    );
  }

  const escolasAtivasIds = escolas.map(
    (escola) => escola.id
  );

  // ANOS LETIVOS E VINCULOS PROFISSIONAIS

  const anos: AnoLetivo[] = [];
  const vinculos: VinculoEscolar[] = [];

  for (
    const lote of dividirLotes(escolasAtivasIds)
  ) {
    const anosLote =
      await consultarPaginado<AnoLetivo>(
        (cursor) => {
          let consulta = supabase
            .from("anos_letivos")
            .select("id, escola_id, ano, ativo")
            .in("escola_id", lote)
            .eq("ativo", true)
            .order("id")
            .limit(TAMANHO_PAGINA);

          if (cursor !== null) {
            consulta = consulta.gt("id", cursor);
          }

          return consulta;
        }
      );

    anos.push(...anosLote);

    const vinculosLote =
      await consultarPaginado<VinculoEscolar>(
        (cursor) => {
          let consulta = supabase
            .from("vinculos_escolares")
            .select(
              "id, perfil_id, escola_id, funcao, ativo"
            )
            .in("escola_id", lote)
            .in("funcao", ["professor", "gestor"])
            .order("id")
            .limit(TAMANHO_PAGINA);

          if (cursor !== null) {
            consulta = consulta.gt("id", cursor);
          }

          return consulta;
        }
      );

    vinculos.push(...vinculosLote);
  }

  if (anos.length === 0) {
    return (
      <EstadoVazio
        mensagem="Nenhum ano letivo ativo. Configure o ano letivo antes de habilitar tutores."
      />
    );
  }

  // PERFIS PROFISSIONAIS

  const perfilIds = [
    ...new Set(
      vinculos.map(
        (vinculo) => vinculo.perfil_id
      )
    ),
  ];

  const perfis: Perfil[] = [];

  for (const lote of dividirLotes(perfilIds)) {
    const resultado =
      await consultarPaginado<Perfil>(
        (cursor) => {
          let consulta = supabase
            .from("perfis")
            .select("id, nome, tipo, ativo")
            .in("id", lote)
            .in("tipo", ["professor", "gestor"])
            .order("id")
            .limit(TAMANHO_PAGINA);

          if (cursor !== null) {
            consulta = consulta.gt("id", cursor);
          }

          return consulta;
        }
      );

    perfis.push(...resultado);
  }

  // TUTORES CADASTRADOS

  const tutores: Tutor[] = [];

  const anosIds = anos.map(
    (ano) => ano.id
  );

  for (const lote of dividirLotes(anosIds)) {
    const resultado =
      await consultarPaginado<Tutor>(
        (cursor) => {
          let consulta = supabase
            .from("tutores")
            .select(
              "id, vinculo_escolar_id, escola_id, ano_letivo_id, capacidade_maxima, ativo"
            )
            .in("ano_letivo_id", lote)
            .order("id")
            .limit(TAMANHO_PAGINA);

          if (cursor !== null) {
            consulta = consulta.gt("id", cursor);
          }

          return consulta;
        }
      );

    tutores.push(...resultado);
  }

  // VINCULOS DE TUTORIA ATIVOS

  const tutorados: Tutorado[] = [];

  for (const lote of dividirLotes(anosIds)) {
    const resultado =
      await consultarPaginado<Tutorado>(
        (cursor) => {
          let consulta = supabase
            .from("vinculos_tutoria")
            .select("id, tutor_id")
            .in("ano_letivo_id", lote)
            .eq("ativo", true)
            .order("id")
            .limit(TAMANHO_PAGINA);

          if (cursor !== null) {
            consulta = consulta.gt("id", cursor);
          }

          return consulta;
        }
      );

    tutorados.push(...resultado);
  }

  // ========================================
  // ORGANIZACAO DOS DADOS
  // ========================================

  const mapaPerfis = new Map(
    perfis.map((perfil) => [perfil.id, perfil])
  );

  const mapaTutores = new Map(
    tutores.map((tutor) => [
      `${tutor.vinculo_escolar_id}-${tutor.ano_letivo_id}`,
      tutor,
    ])
  );

  const ocupacaoPorTutor = new Map<string, number>();

  for (const tutoria of tutorados) {
    ocupacaoPorTutor.set(
      tutoria.tutor_id,
      (ocupacaoPorTutor.get(tutoria.tutor_id) ?? 0) + 1
    );
  }

  // ========================================
  // INTERFACE
  // ========================================

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">

        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-700 pb-6">

          <div>
            <h1 className="text-3xl font-bold text-amber-400">
              EduQuest
            </h1>

            <p className="mt-2 text-xl text-slate-300">
              Gerenciamento de tutores
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Habilite profissionais e configure
              a capacidade de tutoria da instituição.
            </p>
          </div>

          <Link
            href="/painel/gestor"
            className="rounded-lg border border-slate-600 px-4 py-3 text-slate-300 hover:bg-slate-800"
          >
            Voltar ao painel
          </Link>

        </header>

        {escolas.map((escola) => {
          const anosEscola = anos
            .filter(
              (ano) => ano.escola_id === escola.id
            )
            .sort((a, b) => b.ano - a.ano);

          if (anosEscola.length === 0) {
            return (
              <section
                key={escola.id}
                className="rounded-xl border border-slate-700 bg-slate-900 p-6"
              >
                <h2 className="text-xl font-bold text-amber-400">
                  {escola.nome}
                </h2>

                <p className="mt-3 text-slate-400">
                  Nenhum ano letivo ativo.
                </p>
              </section>
            );
          }

          return anosEscola.map((ano) => {
            const profissionais = vinculos
              .filter(
                (vinculo) =>
                  vinculo.escola_id === escola.id
              )
              .flatMap((vinculo) => {
                if (
                  vinculo.funcao !== "professor" &&
                  vinculo.funcao !== "gestor"
                ) {
                  return [];
                }

                const profissional = mapaPerfis.get(
                  vinculo.perfil_id
                );

                const tutor = mapaTutores.get(
                  `${vinculo.id}-${ano.id}`
                );

                const elegivel =
                  vinculo.ativo &&
                  profissional?.ativo === true &&
                  profissional.tipo === vinculo.funcao;

                if (!elegivel && !tutor) {
                  return [];
                }

                return [{
                  vinculoEscolarId: vinculo.id,

                  nome:
                    profissional?.nome ??
                    "Profissional indisponível",

                  funcao:
                    vinculo.funcao as
                      "professor" | "gestor",

                  elegivel,

                  tutorId:
                    tutor?.id ?? null,

                  tutorAtivo:
                    tutor?.ativo ?? false,

                  capacidadeAtual:
                    tutor?.capacidade_maxima ?? null,

                  totalTutorados:
                    tutor
                      ? ocupacaoPorTutor.get(tutor.id) ?? 0
                      : 0,
                }];
              })
              .sort(
                (a, b) =>
                  a.nome.localeCompare(b.nome, "pt-BR")
              );

            return (
              <GerenciamentoTutores
                key={`${escola.id}-${ano.id}`}
                escolaNome={escola.nome}
                anoLetivoId={ano.id}
                ano={ano.ano}
                anoAtivo={ano.ativo}
                profissionais={profissionais}
              />
            );
          });
        })}

      </div>
    </main>
  );
}

// ==========================================
// ESTADO VAZIO
// ==========================================

function EstadoVazio({
  mensagem,
}: {
  mensagem: string;
}) {
  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-4xl space-y-6">

        <h1 className="text-3xl font-bold text-amber-400">
          Gerenciamento de tutores
        </h1>

        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
          <p className="text-slate-300">
            {mensagem}
          </p>
        </div>

        <Link
          href="/painel/gestor"
          className="inline-block rounded-lg border border-slate-600 px-4 py-3 hover:bg-slate-800"
        >
          Voltar ao painel
        </Link>

      </div>
    </main>
  );
}

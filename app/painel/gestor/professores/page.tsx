
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { exigirPerfil } from "@/src/lib/auth";
import { createClient } from "@/src/lib/supabase/server";

import BotaoSair from "@/src/components/BotaoSair";
import FormularioProfessor from "@/src/components/FormularioProfessor";
import ListaProfessores from "@/src/components/ListaProfessores";

async function PaginaProtegida() {

  const gestor = await exigirPerfil("gestor");

  const supabase = await createClient();

  // ========================================
  // IDENTIFICAR VINCULOS DO GESTOR
  // ========================================

  const {
    data: vinculosGestor,
    error: vinculosGestorError,
  } = await supabase
    .from("vinculos_escolares")
    .select("escola_id")
    .eq("perfil_id", gestor.id)
    .eq("funcao", "gestor")
    .eq("ativo", true);

  if (
    vinculosGestorError ||
    !vinculosGestor?.length
  ) {
    redirect("/acesso-negado");
  }

  const escolasIds = [
    ...new Set(
      vinculosGestor.map(
        (vinculo) => vinculo.escola_id
      )
    ),
  ];

  // ========================================
  // CONSULTAR ESCOLAS AUTORIZADAS
  // ========================================

  const {
    data: escolas,
    error: escolasError,
  } = await supabase
    .from("escolas")
    .select("id, nome, codigo")
    .in("id", escolasIds)
    .eq("ativa", true)
    .order("nome");

  if (escolasError || !escolas?.length) {
    redirect("/acesso-negado");
  }

  const escolasAutorizadas = escolas.map(
    (escola) => escola.id
  );

  // ========================================
  // CONSULTAR VINCULOS DOS PROFESSORES
  // ========================================

  const {
    data: vinculos,
    error: vinculosError,
  } = await supabase
    .from("vinculos_escolares")
    .select(
      "id, perfil_id, escola_id, ativo"
    )
    .in("escola_id", escolasAutorizadas)
    .eq("funcao", "professor");

  const vinculosProfessores = vinculos ?? [];

  const professoresIds = [
    ...new Set(
      vinculosProfessores.map(
        (vinculo) => vinculo.perfil_id
      )
    ),
  ];

  // ========================================
  // CONSULTAR PERFIS AUTORIZADOS
  // ========================================

  const consultaProfessores =
    professoresIds.length > 0

      ? await supabase
          .from("perfis")
          .select(
            "id, nome, email, ativo"
          )
          .in("id", professoresIds)
          .eq("tipo", "professor")
          .order("nome")

      : {
          data: [],
          error: null,
        };

  const professores =
    consultaProfessores.data ?? [];

  const erro =
    vinculosError ||
    consultaProfessores.error;

  // ========================================
  // INTERFACE
  // ========================================

  return (

    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-amber-600 pb-6">

        <div>

          <h1 className="text-4xl font-bold text-amber-400">
            EduQuest
          </h1>

          <p className="mt-1 text-slate-400">
            Gerenciamento de professores
          </p>

        </div>

        <BotaoSair />

      </header>

      <nav className="mb-8 flex flex-wrap gap-3">

        <Link
          href="/painel/gestor"
          className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-800"
        >
          Voltar ao painel
        </Link>

        <Link
          href="/painel/gestor/anos-letivos"
          className="rounded-lg border border-amber-600 px-4 py-2 text-amber-400 hover:bg-slate-800"
        >
          Anos letivos
        </Link>

        <Link
          href="/painel/gestor/turmas"
          className="rounded-lg border border-amber-600 px-4 py-2 text-amber-400 hover:bg-slate-800"
        >
          Turmas
        </Link>

      </nav>

      {erro ? (

        <section className="rounded-xl border border-red-700 bg-red-950 p-6">

          <h2 className="text-xl font-bold text-red-400">
            Erro ao consultar professores
          </h2>

          <p className="mt-3 text-slate-300">
            Não foi possível consultar os dados
            do corpo docente.
          </p>

        </section>

      ) : (

        escolas.map((escola) => {

          const vinculosEscola =
            vinculosProfessores.filter(
              (vinculo) =>
                vinculo.escola_id === escola.id
            );

          const idsEscola = new Set(
            vinculosEscola.map(
              (vinculo) => vinculo.perfil_id
            )
          );

          const professoresEscola =
            professores.filter(
              (professor) =>
                idsEscola.has(professor.id)
            );

          return (

            <div
              key={escola.id}
              className="mb-10"
            >

              <section className="mb-6 rounded-xl border border-amber-700 bg-slate-900 p-6">

                <div className="flex flex-wrap items-center justify-between gap-4">

                  <div>

                    <h2 className="text-2xl font-bold text-amber-400">
                      {escola.nome}
                    </h2>

                    <p className="mt-2 text-slate-400">
                      Código institucional:{" "}
                      {escola.codigo}
                    </p>

                  </div>

                  <span className="rounded-full bg-green-950 px-4 py-2 text-green-400">
                    Instituição ativa
                  </span>

                </div>

              </section>

              <FormularioProfessor
                escolaId={escola.id}
                escolaNome={escola.nome}
              />

              <ListaProfessores
                professores={professoresEscola}
                vinculos={vinculosEscola}
              />

            </div>

          );

        })

      )}

    </main>

  );
}

export default function ProfessoresPage() {

  return (

    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 p-8 text-white">
          Carregando professores...
        </main>
      }
    >

      <PaginaProtegida />

    </Suspense>

  );
}
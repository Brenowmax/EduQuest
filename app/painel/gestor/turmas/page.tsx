
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { exigirPerfil } from "@/src/lib/auth";
import { createClient } from "@/src/lib/supabase/server";

import BotaoSair from "@/src/components/BotaoSair";
import GerenciamentoTurmas from "@/src/components/GerenciamentoTurmas";

async function PaginaProtegida() {
  const perfil = await exigirPerfil("gestor");
  const supabase = await createClient();

  // IDENTIFICAR VINCULOS

  const {
    data: vinculos,
    error: vinculosError,
  } = await supabase
    .from("vinculos_escolares")
    .select("escola_id")
    .eq("perfil_id", perfil.id)
    .eq("funcao", "gestor")
    .eq("ativo", true);

  if (vinculosError || !vinculos?.length) {
    redirect("/acesso-negado");
  }

  const escolasIds = [
    ...new Set(
      vinculos.map((vinculo) => vinculo.escola_id)
    ),
  ];

  // IDENTIFICAR ESCOLAS AUTORIZADAS

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

  // CONSULTAR ANOS LETIVOS E TURMAS

  const [consultaAnos, consultaTurmas] =
    await Promise.all([
      supabase
        .from("anos_letivos")
        .select("id, escola_id, ano, ativo")
        .in("escola_id", escolasAutorizadas)
        .order("ano", { ascending: false }),

      supabase
        .from("turmas")
        .select(
          "id, escola_id, ano_letivo_id, nome, serie, ativa"
        )
        .in("escola_id", escolasAutorizadas)
        .order("serie")
        .order("nome"),
    ]);

  const erro =
    consultaAnos.error ||
    consultaTurmas.error;

  const anos = consultaAnos.data ?? [];
  const turmas = consultaTurmas.data ?? [];

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-amber-600 pb-6">

        <div>
          <h1 className="text-4xl font-bold text-amber-400">
            EduQuest
          </h1>

          <p className="text-slate-400">
            Gerenciamento de turmas
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

      </nav>

      {erro ? (
        <p className="text-red-400">
          Não foi possível consultar os dados escolares.
        </p>
      ) : (
        escolas.map((escola) => (
          <GerenciamentoTurmas
            key={escola.id}
            escolaId={escola.id}
            escolaNome={escola.nome}
            anos={anos.filter(
              (ano) => ano.escola_id === escola.id
            )}
            turmas={turmas.filter(
              (turma) => turma.escola_id === escola.id
            )}
          />
        ))
      )}

    </main>
  );
}

export default function TurmasPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 p-8 text-white">
          Carregando turmas...
        </main>
      }
    >
      <PaginaProtegida />
    </Suspense>
  );
}

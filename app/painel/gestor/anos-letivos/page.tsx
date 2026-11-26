
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { exigirPerfil } from "@/src/lib/auth";
import { createClient } from "@/src/lib/supabase/server";

import BotaoSair from "@/src/components/BotaoSair";
import GerenciamentoAnosLetivos from "@/src/components/GerenciamentoAnosLetivos";

async function PaginaProtegida() {
  const perfil = await exigirPerfil("gestor");

  const supabase = await createClient();

  const {
    data: vinculos,
    error: vinculosError,
  } = await supabase
    .from("vinculos_escolares")
    .select("escola_id")
    .eq("perfil_id", perfil.id)
    .eq("funcao", "gestor")
    .eq("ativo", true);

  if (
    vinculosError ||
    !vinculos ||
    vinculos.length === 0
  ) {
    redirect("/acesso-negado");
  }

  const escolasIds = [
    ...new Set(
      vinculos.map((vinculo) => vinculo.escola_id)
    ),
  ];

  const {
    data: escolas,
    error: escolasError,
  } = await supabase
    .from("escolas")
    .select("id, nome, codigo")
    .in("id", escolasIds)
    .eq("ativa", true)
    .order("nome");

  if (
    escolasError ||
    !escolas ||
    escolas.length === 0
  ) {
    redirect("/acesso-negado");
  }

  const {
    data: anos,
    error: anosError,
  } = await supabase
    .from("anos_letivos")
    .select("id, escola_id, ano, ativo")
    .in(
      "escola_id",
      escolas.map((escola) => escola.id)
    )
    .order("ano", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-amber-600 pb-6">

        <div>
          <h1 className="text-4xl font-bold text-amber-400">
            EduQuest
          </h1>

          <p className="text-slate-400">
            Gerenciamento de anos letivos
          </p>
        </div>

        <BotaoSair />

      </header>

      <Link
        href="/painel/gestor"
        className="mb-8 inline-block rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-800"
      >
        Voltar ao painel
      </Link>

      {anosError ? (

        <p className="text-red-400">
          Não foi possível consultar os anos letivos.
        </p>

      ) : (

        escolas.map((escola) => (

          <GerenciamentoAnosLetivos
            key={escola.id}
            escolaId={escola.id}
            escolaNome={escola.nome}
            anos={(anos ?? [])
              .filter(
                (ano) => ano.escola_id === escola.id
              )
              .map((ano) => ({
                id: ano.id,
                ano: ano.ano,
                ativo: ano.ativo,
              }))}
          />

        ))

      )}

    </main>
  );
}

export default function AnosLetivosPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 p-8 text-white">
          Carregando anos letivos...
        </main>
      }
    >
      <PaginaProtegida />
    </Suspense>
  );
}


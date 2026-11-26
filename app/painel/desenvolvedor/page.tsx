
import { Suspense } from "react";
import { exigirPerfil } from "@/src/lib/auth";
import { createClient } from "@/src/lib/supabase/server";

import BotaoSair from "@/src/components/BotaoSair";
import FormularioEscola from "@/src/components/FormularioEscola";
import AcoesEscola from "@/src/components/AcoesEscola";
import FormularioGestor from "@/src/components/FormularioGestor";
import ListaGestores from "@/src/components/ListaGestores";

// ==========================================
// PAINEL PROTEGIDO
// ==========================================

async function PainelProtegido() {
  const perfil = await exigirPerfil("desenvolvedor");

  const supabase = await createClient();

  // ========================================
  // CONSULTAS AO SUPABASE
  // ========================================

  const [
    consultaEscolas,
    consultaAtivas,
    consultaComponentes,
  ] = await Promise.all([
    supabase
      .from("escolas")
      .select("id, nome, codigo, ativa, criado_em", {
        count: "exact",
      })
      .order("nome"),

    supabase
      .from("escolas")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("ativa", true),

    supabase
      .from("componentes_curriculares")
      .select("id", {
        count: "exact",
        head: true,
      }),
  ]);

  // ========================================
  // TRATAMENTO DE ERROS
  // ========================================

  if (
    consultaEscolas.error ||
    consultaAtivas.error ||
    consultaComponentes.error
  ) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">

        <h1 className="text-2xl font-bold text-red-400">
          Erro ao carregar o painel
        </h1>

        <p className="my-4">
          Não foi possível consultar os dados do EduQuest.
        </p>

        <BotaoSair />

      </main>
    );
  }

  // ========================================
  // ORGANIZAÇÃO DOS DADOS
  // ========================================

  const escolas = consultaEscolas.data ?? [];

  const totalEscolas = consultaEscolas.count ?? 0;

  const escolasAtivas = consultaAtivas.count ?? 0;

  const escolasInativas =
    totalEscolas - escolasAtivas;

  const totalComponentes =
    consultaComponentes.count ?? 0;

  const indicadores = [
    {
      titulo: "Escolas cadastradas",
      valor: totalEscolas,
      cor: "text-amber-400",
    },
    {
      titulo: "Escolas ativas",
      valor: escolasAtivas,
      cor: "text-green-400",
    },
    {
      titulo: "Escolas inativas",
      valor: escolasInativas,
      cor: "text-red-400",
    },
    {
      titulo: "Componentes curriculares",
      valor: totalComponentes,
      cor: "text-blue-400",
    },
  ];

  // ========================================
  // INTERFACE DO PAINEL
  // ========================================

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">

      {/* CABEÇALHO */}

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-amber-600 pb-6">

        <div>
          <h1 className="text-4xl font-bold text-amber-400">
            EduQuest
          </h1>

          <p className="text-slate-400">
            Central do Desenvolvedor
          </p>
        </div>

        <BotaoSair />

      </header>

      {/* APRESENTAÇÃO */}

      <section className="mb-8">

        <h2 className="text-2xl font-bold">
          Bem-vindo, {perfil.nome}!
        </h2>

        <p className="mt-2 text-slate-400">
          Gerencie as instituições e os gestores
          cadastrados na plataforma.
        </p>

      </section>

      {/* INDICADORES */}

      <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {indicadores.map((item) => (

          <article
            key={item.titulo}
            className="rounded-xl border border-slate-700 bg-slate-900 p-6"
          >

            <p className="text-sm text-slate-400">
              {item.titulo}
            </p>

            <p className={`mt-3 text-4xl font-bold ${item.cor}`}>
              {item.valor}
            </p>

          </article>

        ))}

      </section>

      {/* CADASTRO DE ESCOLAS */}

      <FormularioEscola />

      {/* LISTAGEM DE ESCOLAS */}

      <section className="rounded-xl border border-slate-700 bg-slate-900 p-6">

        <h2 className="mb-6 text-2xl font-bold text-amber-400">
          Instituições cadastradas
        </h2>

        {escolas.length === 0 ? (

          <p className="text-slate-400">
            Nenhuma escola cadastrada.
          </p>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead>

                <tr className="border-b border-slate-700 text-slate-400">

                  <th className="p-4">Instituição</th>
                  <th className="p-4">Código</th>
                  <th className="p-4">Situação</th>
                  <th className="p-4">Ações</th>

                </tr>

              </thead>

              <tbody>

                {escolas.map((escola) => (

                  <tr
                    key={escola.id}
                    className="border-b border-slate-800 hover:bg-slate-800"
                  >

                    <td className="p-4 font-medium">
                      {escola.nome}
                    </td>

                    <td className="p-4 text-slate-400">
                      {escola.codigo}
                    </td>

                    <td className="p-4">

                      <span
                        className={
                          escola.ativa
                            ? "rounded-full bg-green-950 px-3 py-1 text-green-400"
                            : "rounded-full bg-red-950 px-3 py-1 text-red-400"
                        }
                      >
                        {escola.ativa
                          ? "Ativa"
                          : "Inativa"}
                      </span>

                    </td>

                    <td className="p-4">

                      <AcoesEscola escola={escola} />

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

        <p className="mt-4 text-sm text-slate-500">
          Exibindo {escolas.length} de {totalEscolas} instituições.
        </p>

      </section>

      {/* CADASTRO DE GESTORES */}

      <FormularioGestor escolas={escolas} />

      {/* LISTAGEM DE GESTORES */}

      <Suspense
        fallback={
          <p className="mt-8 text-slate-400">
            Carregando gestores...
          </p>
        }
      >
        <ListaGestores />
      </Suspense>

    </main>
  );
}

// ==========================================
// EXPORTAÇÃO DA PÁGINA
// ==========================================

export default function PainelDesenvolvedor() {
  return (
    <Suspense fallback={<p>Carregando painel...</p>}>
      <PainelProtegido />
    </Suspense>
  );
}

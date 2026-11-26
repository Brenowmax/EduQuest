
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { exigirPerfil } from "@/src/lib/auth";
import { createClient } from "@/src/lib/supabase/server";
import BotaoSair from "@/src/components/BotaoSair";

async function PainelProtegido() {
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

  // CONSULTAR ESCOLAS

  const {
    data: escolas,
    error: escolasError,
  } = await supabase
    .from("escolas")
    .select("id, nome, codigo, ativa")
    .in("id", escolasIds)
    .eq("ativa", true)
    .order("nome");

  if (escolasError || !escolas?.length) {
    redirect("/acesso-negado");
  }

  const escolasAutorizadas = escolas.map(
    (escola) => escola.id
  );

  // CONSULTAR DADOS ESCOLARES

  const [
    consultaAnos,
    consultaTurmas,
    consultaComponentes,
  ] = await Promise.all([
    supabase
      .from("anos_letivos")
      .select("id, escola_id, ano, ativo")
      .in("escola_id", escolasAutorizadas)
      .eq("ativo", true)
      .order("ano", { ascending: false }),

    supabase
      .from("turmas")
      .select(
        "id, escola_id, ano_letivo_id, nome, serie, ativa"
      )
      .in("escola_id", escolasAutorizadas)
      .order("serie")
      .order("nome"),

    supabase
      .from("componentes_curriculares")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("ativo", true),
  ]);

  if (
    consultaAnos.error ||
    consultaTurmas.error ||
    consultaComponentes.error
  ) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <h1 className="text-2xl font-bold text-red-400">
          Erro ao carregar o painel
        </h1>

        <p className="my-4">
          Não foi possível consultar os dados escolares.
        </p>

        <BotaoSair />
      </main>
    );
  }

  const anos = consultaAnos.data ?? [];
  const turmas = consultaTurmas.data ?? [];

  const totalComponentes =
    consultaComponentes.count ?? 0;

  // MODULOS DO GESTOR

  const modulos = [
    {
      nome: "Ano letivo",
      descricao: "Cadastro e organização dos anos escolares.",
      href: "/painel/gestor/anos-letivos",
    },
    {
      nome: "Turmas",
      descricao: "Cadastro e gerenciamento de turmas.",
      href: "/painel/gestor/turmas",
    },
    {
      nome: "Professores",
      descricao: "Cadastro e gerenciamento dos docentes.",
      href: null,
    },
    {
      nome: "Alunos",
      descricao: "Cadastro e importação via Excel.",
      href: null,
    },
    {
      nome: "Tutoria",
      descricao: "Organização dos tutores e tutorados.",
      href: null,
    },
    {
      nome: "Progressão escolar",
      descricao: "Aprovação, retenção e rematrícula automática.",
      href: null,
    },
    {
      nome: "Desempenho",
      descricao: "Notas e indicadores escolares.",
      href: null,
    },
    {
      nome: "Calendário",
      descricao: "Eventos e atividades escolares.",
      href: null,
    },
    {
      nome: "Missões",
      descricao: "Eventos e missões institucionais.",
      href: null,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">

      {/* CABECALHO */}

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-amber-600 pb-6">

        <div>
          <h1 className="text-4xl font-bold text-amber-400">
            EduQuest
          </h1>

          <p className="text-slate-400">
            Central do Gestor
          </p>
        </div>

        <BotaoSair />

      </header>

      <section className="mb-8">

        <h2 className="text-2xl font-bold">
          Bem-vindo, {perfil.nome}!
        </h2>

        <p className="mt-2 text-slate-400">
          Acompanhe e gerencie sua instituição.
        </p>

      </section>

      {/* NAVEGACAO RAPIDA */}

      <nav className="mb-8 flex flex-wrap gap-3">

        <Link
          href="/painel/gestor/anos-letivos"
          className="rounded-lg bg-amber-500 px-5 py-3 font-bold text-slate-950 hover:bg-amber-400"
        >
          Gerenciar anos letivos
        </Link>

        <Link
          href="/painel/gestor/turmas"
          className="rounded-lg border border-amber-500 px-5 py-3 font-bold text-amber-400 hover:bg-slate-800"
        >
          Gerenciar turmas
        </Link>

      </nav>

      {/* INSTITUICOES AUTORIZADAS */}

      {escolas.map((escola) => {
        const anosEscola = anos.filter(
          (ano) => ano.escola_id === escola.id
        );

        const anosAtivosIds = anosEscola.map(
          (ano) => ano.id
        );

        const turmasEscola = turmas.filter(
          (turma) =>
            turma.escola_id === escola.id &&
            anosAtivosIds.includes(turma.ano_letivo_id)
        );

        const turmasAtivas = turmasEscola.filter(
          (turma) => turma.ativa
        ).length;

        const indicadores = [
          {
            titulo: "Ano letivo ativo",
            valor:
              anosEscola.map((ano) => ano.ano).join(", ") ||
              "Não definido",
            cor: "text-amber-400",
          },
          {
            titulo: "Turmas ativas",
            valor: turmasAtivas,
            cor: "text-green-400",
          },
          {
            titulo: "Turmas cadastradas no ano ativo",
            valor: turmasEscola.length,
            cor: "text-blue-400",
          },
          {
            titulo: "Componentes curriculares",
            valor: totalComponentes,
            cor: "text-purple-400",
          },
        ];

        return (
          <div key={escola.id} className="mb-10">

            {/* IDENTIFICACAO */}

            <section className="mb-6 rounded-xl border border-amber-700 bg-slate-900 p-6">

              <div className="flex flex-wrap items-center justify-between gap-4">

                <div>
                  <h2 className="text-2xl font-bold text-amber-400">
                    {escola.nome}
                  </h2>

                  <p className="mt-2 text-slate-400">
                    Código institucional: {escola.codigo}
                  </p>
                </div>

                <span className="rounded-full bg-green-950 px-4 py-2 text-green-400">
                  Instituição ativa
                </span>

              </div>

            </section>

            {/* INDICADORES */}

            <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

              {indicadores.map((item) => (
                <article
                  key={item.titulo}
                  className="rounded-xl border border-slate-700 bg-slate-900 p-6"
                >
                  <p className="text-sm text-slate-400">
                    {item.titulo}
                  </p>

                  <p className={`mt-3 text-3xl font-bold ${item.cor}`}>
                    {item.valor}
                  </p>
                </article>
              ))}

            </section>

            {/* TURMAS DO ANO ATIVO */}

            <section className="rounded-xl border border-slate-700 bg-slate-900 p-6">

              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

                <h2 className="text-2xl font-bold text-amber-400">
                  Turmas da instituição
                </h2>

                <Link
                  href="/painel/gestor/turmas"
                  className="rounded-lg border border-amber-600 px-4 py-2 text-amber-400"
                >
                  Gerenciar
                </Link>

              </div>

              {anosEscola.length === 0 ? (
                <p className="text-slate-400">
                  Nenhum ano letivo ativo cadastrado.
                </p>
              ) : (
                anosEscola.map((ano) => {
                  const turmasAno = turmasEscola.filter(
                    (turma) => turma.ano_letivo_id === ano.id
                  );

                  return (
                    <div key={ano.id} className="mb-6">

                      <h3 className="mb-4 text-lg font-bold text-slate-300">
                        Ano letivo {ano.ano}
                      </h3>

                      {turmasAno.length === 0 ? (
                        <p className="text-slate-400">
                          Nenhuma turma cadastrada.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

                          {turmasAno.map((turma) => (
                            <article
                              key={turma.id}
                              className="rounded-xl border border-slate-700 bg-slate-950 p-5 text-center"
                            >
                              <h4 className="text-2xl font-bold text-amber-400">
                                {turma.nome}
                              </h4>

                              <p className="mt-2 text-sm text-slate-400">
                                {turma.serie}º ano
                              </p>

                              <p className={
                                turma.ativa
                                  ? "mt-3 text-green-400"
                                  : "mt-3 text-red-400"
                              }>
                                {turma.ativa
                                  ? "Ativa"
                                  : "Inativa"}
                              </p>
                            </article>
                          ))}

                        </div>
                      )}

                    </div>
                  );
                })
              )}

            </section>

          </div>
        );
      })}

      {/* GERENCIAMENTO ESCOLAR */}

      <section className="rounded-xl border border-slate-700 bg-slate-900 p-6">

        <h2 className="mb-6 text-2xl font-bold text-amber-400">
          Gerenciamento escolar
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

          {modulos.map((modulo) => {
            const conteudo = (
              <>
                <h3 className="text-xl font-bold text-amber-400">
                  {modulo.nome}
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  {modulo.descricao}
                </p>

                <p className={
                  modulo.href
                    ? "mt-4 text-sm text-green-400"
                    : "mt-4 text-sm text-slate-500"
                }>
                  {modulo.href
                    ? "Acessar módulo →"
                    : "Em desenvolvimento"}
                </p>
              </>
            );

            return modulo.href ? (
              <Link
                key={modulo.nome}
                href={modulo.href}
                className="rounded-xl border border-amber-700 bg-slate-950 p-5 hover:bg-slate-800"
              >
                {conteudo}
              </Link>
            ) : (
              <article
                key={modulo.nome}
                className="rounded-xl border border-slate-700 bg-slate-950 p-5"
              >
                {conteudo}
              </article>
            );
          })}

        </div>

      </section>

    </main>
  );
}

export default function PainelGestor() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 p-8 text-white">
          Carregando painel do gestor...
        </main>
      }
    >
      <PainelProtegido />
    </Suspense>
  );
}

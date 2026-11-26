
import "server-only";

import { exigirPerfil } from "@/src/lib/auth";
import { createClient } from "@/src/lib/supabase/server";
import AcoesGestor from "@/src/components/AcoesGestor";

export default async function ListaGestores() {
  await exigirPerfil("desenvolvedor");

  const supabase = await createClient();

  // ==========================================
  // CONSULTAS AO SUPABASE
  // ==========================================

  const [
    consultaGestores,
    consultaVinculos,
    consultaEscolas,
  ] = await Promise.all([
    supabase
      .from("perfis")
      .select("id, nome, email, ativo", {
        count: "exact",
      })
      .eq("tipo", "gestor")
      .order("nome"),

    supabase
      .from("vinculos_escolares")
      .select("id, perfil_id, escola_id, ativo")
      .eq("funcao", "gestor")
      .eq("ativo", true),

    supabase
      .from("escolas")
      .select("id, nome, codigo, ativa"),
  ]);

  // ==========================================
  // TRATAMENTO DE ERROS
  // ==========================================

  if (
    consultaGestores.error ||
    consultaVinculos.error ||
    consultaEscolas.error
  ) {
    return (
      <section className="mt-8 rounded-xl border border-red-800 bg-slate-900 p-6">

        <h2 className="text-xl font-bold text-red-400">
          Erro ao consultar gestores
        </h2>

        <p className="mt-2 text-slate-400">
          Não foi possível carregar os registros.
        </p>

      </section>
    );
  }

  // ==========================================
  // ORGANIZAÇÃO DOS DADOS
  // ==========================================

  const gestores = consultaGestores.data ?? [];
  const vinculos = consultaVinculos.data ?? [];
  const escolas = consultaEscolas.data ?? [];

  const gestoresAtivos = gestores.filter(
    (gestor) => gestor.ativo
  ).length;

  const gestoresInativos =
    gestores.length - gestoresAtivos;

  const indicadores = [
    {
      titulo: "Gestores cadastrados",
      valor: gestores.length,
      cor: "text-amber-400",
    },
    {
      titulo: "Perfis ativos",
      valor: gestoresAtivos,
      cor: "text-green-400",
    },
    {
      titulo: "Perfis inativos",
      valor: gestoresInativos,
      cor: "text-red-400",
    },
  ];

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <section className="mt-8 rounded-xl border border-slate-700 bg-slate-900 p-6">

      <h2 className="mb-6 text-2xl font-bold text-amber-400">
        Gestores cadastrados
      </h2>

      {/* INDICADORES */}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">

        {indicadores.map((item) => (
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

      {/* LISTAGEM */}

      {gestores.length === 0 ? (

        <p className="text-slate-400">
          Nenhum gestor cadastrado.
        </p>

      ) : (

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead>

              <tr className="border-b border-slate-700 text-slate-400">

                <th className="p-4">Gestor</th>

                <th className="p-4">E-mail</th>

                <th className="p-4">Instituição</th>

                <th className="p-4">Perfil</th>

                <th className="p-4">
                  Acesso institucional
                </th>

                <th className="p-4 min-w-[280px]">
                  Ações
                </th>

              </tr>

            </thead>

            <tbody>

              {gestores.map((gestor) => {

                const vinculosGestor = vinculos.filter(
                  (vinculo) =>
                    vinculo.perfil_id === gestor.id
                );

                const escolasGestor = vinculosGestor
                  .map((vinculo) =>
                    escolas.find(
                      (escola) =>
                        escola.id === vinculo.escola_id
                    )
                  )
                  .filter(
                    (escola) => escola !== undefined
                  );

                const acessoInstitucional =
                  gestor.ativo &&
                  escolasGestor.some(
                    (escola) => escola.ativa
                  );

                return (

                  <tr
                    key={gestor.id}
                    className="border-b border-slate-800 hover:bg-slate-800"
                  >

                    {/* NOME */}

                    <td className="p-4 font-medium">
                      {gestor.nome}
                    </td>

                    {/* EMAIL */}

                    <td className="p-4 text-slate-400">
                      {gestor.email ?? "Não informado"}
                    </td>

                    {/* INSTITUICAO */}

                    <td className="p-4">

                      {escolasGestor.length === 0 ? (

                        <span className="text-slate-500">
                          Sem vínculo ativo
                        </span>

                      ) : (

                        escolasGestor.map((escola) => (

                          <div
                            key={escola.id}
                            className="mb-2"
                          >

                            <p>{escola.nome}</p>

                            <p className="text-xs text-slate-400">
                              {escola.codigo}
                            </p>

                            <p
                              className={
                                escola.ativa
                                  ? "text-xs text-green-400"
                                  : "text-xs text-red-400"
                              }
                            >
                              {escola.ativa
                                ? "Escola ativa"
                                : "Escola inativa"}
                            </p>

                          </div>

                        ))

                      )}

                    </td>

                    {/* SITUACAO DO PERFIL */}

                    <td className="p-4">

                      <span
                        className={
                          gestor.ativo
                            ? "rounded-full bg-green-950 px-3 py-1 text-green-400"
                            : "rounded-full bg-red-950 px-3 py-1 text-red-400"
                        }
                      >
                        {gestor.ativo
                          ? "Ativo"
                          : "Inativo"}
                      </span>

                    </td>

                    {/* ACESSO INSTITUCIONAL */}

                    <td className="p-4">

                      <span
                        className={
                          acessoInstitucional
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {acessoInstitucional
                          ? "Habilitado"
                          : "Não habilitado"}
                      </span>

                    </td>

                    {/* ACOES DO GESTOR */}

                    <td className="p-4 align-top">

                      <AcoesGestor gestor={gestor} />

                    </td>

                  </tr>

                );
              })}

            </tbody>

          </table>

        </div>

      )}

      <p className="mt-4 text-sm text-slate-500">
        Exibindo {gestores.length} de{" "}
        {consultaGestores.count ?? gestores.length} gestores.
      </p>

    </section>
  );
}

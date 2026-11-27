
import AcoesProfessor from "@/src/components/AcoesProfessor";

type Professor = {
  id: string;
  nome: string;
  email: string | null;
  ativo: boolean;
};

type Vinculo = {
  id: string;
  perfil_id: string;
  ativo: boolean;
};

type Props = {
  professores: Professor[];
  vinculos: Vinculo[];
};

export default function ListaProfessores({
  professores,
  vinculos,
}: Props) {

  const totalAtivos = professores.filter(
    (professor) =>
      professor.ativo &&
      vinculos.some(
        (vinculo) =>
          vinculo.perfil_id === professor.id &&
          vinculo.ativo
      )
  ).length;

  const indicadores = [
    {
      titulo: "Professores cadastrados",
      valor: professores.length,
      cor: "text-amber-400",
    },
    {
      titulo: "Professores ativos",
      valor: totalAtivos,
      cor: "text-green-400",
    },
    {
      titulo: "Professores inativos",
      valor: professores.length - totalAtivos,
      cor: "text-red-400",
    },
  ];

  return (

    <section className="rounded-xl border border-slate-700 bg-slate-900 p-6">

      <h2 className="mb-6 text-2xl font-bold text-amber-400">
        Corpo docente
      </h2>

      {/* INDICADORES */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

        {indicadores.map((item) => (

          <article
            key={item.titulo}
            className="rounded-xl border border-slate-700 bg-slate-950 p-5"
          >

            <p className="text-sm text-slate-400">
              {item.titulo}
            </p>

            <p className={`mt-3 text-3xl font-bold ${item.cor}`}>
              {item.valor}
            </p>

          </article>

        ))}

      </div>

      {/* LISTAGEM */}

      {professores.length === 0 ? (

        <div className="rounded-xl border border-dashed border-slate-600 p-10 text-center">

          <h3 className="text-xl font-bold text-slate-300">
            Nenhum professor cadastrado
          </h3>

          <p className="mt-3 text-slate-400">
            Utilize o formulário acima para cadastrar
            o primeiro professor da instituição.
          </p>

        </div>

      ) : (

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {professores.map((professor) => {

            const vinculosProfessor =
              vinculos.filter(
                (vinculo) =>
                  vinculo.perfil_id === professor.id
              );

            const vinculoAtual =
              vinculosProfessor.find(
                (vinculo) => vinculo.ativo
              ) ??
              (
                vinculosProfessor.length === 1
                  ? vinculosProfessor[0]
                  : undefined
              );

            const vinculoAtivo =
              vinculosProfessor.some(
                (vinculo) => vinculo.ativo
              );

            const acessoAtivo =
              professor.ativo && vinculoAtivo;

            const iniciais = professor.nome
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((parte) =>
                parte.charAt(0).toUpperCase()
              )
              .join("");

            return (

              <article
                key={professor.id}
                className="rounded-xl border border-slate-700 bg-slate-950 p-5"
              >

                {/* IDENTIFICACAO */}

                <div className="flex flex-wrap items-center gap-4">

                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-700 bg-slate-800 text-xl font-bold text-amber-400">

                    {iniciais}

                  </div>

                  <div className="min-w-0 flex-1">

                    <h3 className="break-words text-xl font-bold text-amber-400">
                      {professor.nome}
                    </h3>

                    <p className="mt-1 break-all text-sm text-slate-400">

                      {professor.email ??
                        "E-mail não informado"}

                    </p>

                  </div>

                  <span className={
                    acessoAtivo
                      ? "rounded-full bg-green-950 px-3 py-1 text-sm text-green-400"
                      : "rounded-full bg-red-950 px-3 py-1 text-sm text-red-400"
                  }>

                    {acessoAtivo
                      ? "Ativo"
                      : "Inativo"}

                  </span>

                </div>

                {/* SITUACAO INSTITUCIONAL */}

                <div className="mt-5 space-y-2 border-t border-slate-700 pt-4">

                  <p className="text-sm text-slate-300">
                    Função: Professor
                  </p>

                  <p className="text-sm text-slate-300">

                    Vínculo institucional:{" "}

                    <span className={
                      vinculoAtivo
                        ? "text-green-400"
                        : "text-red-400"
                    }>

                      {vinculoAtivo
                        ? "Ativo"
                        : "Inativo"}

                    </span>

                  </p>

                  <p className="text-sm text-slate-300">

                    Perfil global:{" "}

                    <span className={
                      professor.ativo
                        ? "text-green-400"
                        : "text-red-400"
                    }>

                      {professor.ativo
                        ? "Ativo"
                        : "Inativo"}

                    </span>

                  </p>

                </div>

                {/* TUTORIA */}

                <div className="mt-5 rounded-lg border border-slate-700 bg-slate-900 p-4">

                  <p className="font-bold text-amber-400">
                    Tutoria
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    Configuração disponível em uma
                    próxima etapa.
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    Limite máximo permitido: 25 tutorados
                  </p>

                </div>

                {/* ACOES ADMINISTRATIVAS */}

                {vinculoAtual ? (

                  <AcoesProfessor
                    key={vinculoAtual.id}
                    vinculoId={vinculoAtual.id}
                    professorNome={professor.nome}
                    vinculoAtivo={vinculoAtual.ativo}
                    perfilAtivo={professor.ativo}
                  />

                ) : (

                  <p className="mt-5 text-sm text-amber-400">
                    É necessária uma revisão administrativa
                    dos vínculos anteriores.
                  </p>

                )}

              </article>

            );

          })}

        </div>

      )}

    </section>

  );
}
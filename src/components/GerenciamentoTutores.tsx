
import AcoesTutor from "@/src/components/AcoesTutor";

// ==========================================
// TIPOS
// ==========================================

type Profissional = {
  vinculoEscolarId: string;
  nome: string;
  funcao: "professor" | "gestor";
  elegivel: boolean;
  tutorId: string | null;
  tutorAtivo: boolean;
  capacidadeAtual: number | null;
  totalTutorados: number;
};

type Props = {
  escolaNome: string;
  anoLetivoId: string;
  ano: number;
  anoAtivo: boolean;
  profissionais: Profissional[];
};

// ==========================================
// COMPONENTE
// ==========================================

export default function GerenciamentoTutores({
  escolaNome,
  anoLetivoId,
  ano,
  anoAtivo,
  profissionais,
}: Props) {

  // ========================================
  // INDICADORES
  // ========================================

  const elegiveis = profissionais.filter(
    (profissional) => profissional.elegivel
  );

  const tutoresAtivos = profissionais.filter(
    (profissional) =>
      profissional.tutorAtivo &&
      profissional.elegivel &&
      anoAtivo
  );

  const capacidadeTotal = tutoresAtivos.reduce(
    (total, tutor) =>
      total + (tutor.capacidadeAtual ?? 0),
    0
  );

  const totalTutorados = profissionais.reduce(
    (total, profissional) =>
      total + profissional.totalTutorados,
    0
  );

  const vagasDisponiveis = tutoresAtivos.reduce(
    (total, tutor) =>
      total + Math.max(
        0,
        (tutor.capacidadeAtual ?? 0) -
          tutor.totalTutorados
      ),
    0
  );

  const indicadores = [
    {
      titulo: "Profissionais elegíveis",
      valor: elegiveis.length,
      cor: "text-amber-400",
    },
    {
      titulo: "Tutores ativos",
      valor: tutoresAtivos.length,
      cor: "text-green-400",
    },
    {
      titulo: "Capacidade total",
      valor: capacidadeTotal,
      cor: "text-blue-400",
    },
    {
      titulo: "Tutorados vinculados",
      valor: totalTutorados,
      cor: "text-purple-400",
    },
    {
      titulo: "Vagas disponíveis",
      valor: vagasDisponiveis,
      cor: "text-green-400",
    },
  ];

  // ========================================
  // INTERFACE
  // ========================================

  return (

    <section className="space-y-6 rounded-xl border border-slate-700 bg-slate-900 p-6">

      {/* IDENTIFICACAO INSTITUCIONAL */}

      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700 pb-5">

        <div>

          <h2 className="text-2xl font-bold text-amber-400">
            {escolaNome}
          </h2>

          <p className="mt-2 text-slate-400">
            Gerenciamento de tutoria — {ano}
          </p>

        </div>

        <span className={
          anoAtivo
            ? "rounded-full bg-green-950 px-4 py-2 text-sm text-green-400"
            : "rounded-full bg-red-950 px-4 py-2 text-sm text-red-400"
        }>

          {anoAtivo
            ? "Ano letivo ativo"
            : "Ano letivo inativo"}

        </span>

      </header>

      {/* INDICADORES */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

        {indicadores.map((item) => (

          <article
            key={item.titulo}
            className="rounded-xl border border-slate-700 bg-slate-950 p-4"
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

      {/* LISTAGEM DE PROFISSIONAIS */}

      {profissionais.length === 0 ? (

        <div className="rounded-xl border border-dashed border-slate-600 p-8 text-center">

          <h3 className="text-xl font-bold text-slate-300">
            Nenhum profissional disponível
          </h3>

          <p className="mt-3 text-slate-400">
            Não existem profissionais disponíveis
            para gerenciamento de tutoria.
          </p>

        </div>

      ) : (

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">

          {profissionais.map((profissional) => {

            const iniciais = profissional.nome
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((parte) =>
                parte.charAt(0).toUpperCase()
              )
              .join("");

            const tutorOperacional =
              profissional.tutorAtivo &&
              profissional.elegivel &&
              anoAtivo;

            const capacidade =
              profissional.capacidadeAtual ?? 0;

            const vagas = tutorOperacional
              ? Math.max(
                  0,
                  capacidade -
                    profissional.totalTutorados
                )
              : 0;

            const ocupacao = capacidade > 0
              ? Math.min(
                  100,
                  profissional.totalTutorados /
                    capacidade * 100
                )
              : 0;

            const corFuncao =
              profissional.funcao === "gestor"
                ? "text-purple-400"
                : "text-amber-400";

            return (

              <article
                key={profissional.vinculoEscolarId}
                className="rounded-xl border border-slate-700 bg-slate-950 p-5"
              >

                {/* IDENTIFICACAO */}

                <div className="flex items-center gap-4">

                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-xl font-bold ${corFuncao}`}>

                    {iniciais}

                  </div>

                  <div className="min-w-0 flex-1">

                    <h3 className="break-words text-lg font-bold text-white">
                      {profissional.nome}
                    </h3>

                    <p className={`mt-1 text-sm ${corFuncao}`}>

                      {profissional.funcao === "gestor"
                        ? "Gestor"
                        : "Professor"}

                    </p>

                  </div>

                </div>

                {/* SITUACAO DA TUTORIA */}

                <div className="mt-5 space-y-3 border-t border-slate-700 pt-4">

                  <p className="text-sm text-slate-400">
                    Situação da tutoria
                  </p>

                  <p className={
                    tutorOperacional
                      ? "font-bold text-green-400"
                      : "font-bold text-slate-400"
                  }>

                    {tutorOperacional
                      ? "Tutor ativo"
                      : profissional.tutorAtivo
                        ? "Tutoria indisponível"
                        : profissional.tutorId
                          ? "Tutoria desativada"
                          : "Não habilitado"}

                  </p>

                  {/* OCUPACAO */}

                  {profissional.tutorId && (

                    <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900 p-4">

                      <div className="flex justify-between gap-2">

                        <span className="text-sm text-slate-400">
                          Tutorados vinculados
                        </span>

                        <span className="font-bold text-amber-400">

                          {profissional.totalTutorados}
                          /{capacidade}

                        </span>

                      </div>

                      <div
                        role="progressbar"
                        aria-label="Ocupação da tutoria"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(ocupacao)}
                        className="h-3 overflow-hidden rounded-full bg-slate-700"
                      >

                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{
                            width: `${ocupacao}%`,
                          }}
                        />

                      </div>

                      <p className="text-sm text-green-400">
                        {vagas} vagas disponíveis
                      </p>

                    </div>

                  )}

                </div>

                {/* ACOES ADMINISTRATIVAS */}

                <AcoesTutor
                  key={`${profissional.vinculoEscolarId}-${anoLetivoId}-${profissional.capacidadeAtual}-${profissional.tutorAtivo}`}
                  vinculoEscolarId={
                    profissional.vinculoEscolarId
                  }
                  anoLetivoId={anoLetivoId}
                  nome={profissional.nome}
                  funcao={profissional.funcao}
                  tutorId={profissional.tutorId}
                  tutorAtivo={profissional.tutorAtivo}
                  capacidadeAtual={
                    profissional.capacidadeAtual
                  }
                  totalTutorados={
                    profissional.totalTutorados
                  }
                  elegivel={profissional.elegivel}
                  anoAtivo={anoAtivo}
                />

              </article>

            );

          })}

        </div>

      )}

    </section>

  );
}

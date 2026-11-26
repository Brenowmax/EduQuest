
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { exigirPerfil } from "@/src/lib/auth";
import BotaoSair from "@/src/components/BotaoSair";

type Props = {
  params: Promise<{ tipo: string }>;
};

async function PainelProtegido({ params }: Props) {
  const { tipo } = await params;

  if (
    tipo !== "gestor" &&
    tipo !== "professor" &&
    tipo !== "aluno"
  ) {
    notFound();
  }

  const perfil = await exigirPerfil(tipo);

  const titulos = {
    gestor: "Painel do Gestor",
    professor: "Painel do Professor-Tutor",
    aluno: "Painel do Aventureiro",
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-amber-600 pb-6">

        <div>
          <h1 className="text-4xl font-bold text-amber-400">
            EduQuest
          </h1>

          <p className="text-slate-400">
            {titulos[tipo]}
          </p>
        </div>

        <BotaoSair />

      </header>

      <section className="rounded-xl border border-slate-700 bg-slate-900 p-6">

        <h2 className="text-2xl font-bold">
          Bem-vindo, {perfil.nome}!
        </h2>

        <p className="mt-2 text-green-400">
          Perfil autenticado e autorizado.
        </p>

        <p className="mt-4 text-slate-400">
          Seu painel está em desenvolvimento.
        </p>

      </section>

    </main>
  );
}

export default function PainelPage({ params }: Props) {
  return (
    <Suspense fallback={<p>Validando permissões...</p>}>
      <PainelProtegido params={params} />
    </Suspense>
  );
}

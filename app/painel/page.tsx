
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { obterPerfilAtual } from "@/src/lib/auth";

async function RedirecionarPerfil(): Promise<never> {
  const perfil = await obterPerfilAtual();

  switch (perfil.tipo) {
    case "desenvolvedor":
      return redirect("/painel/desenvolvedor");

    case "gestor":
      return redirect("/painel/gestor");

    case "professor":
      return redirect("/painel/professor");

    case "aluno":
      return redirect("/painel/aluno");

    default:
      return redirect("/acesso-negado");
  }
}

export default function PainelPage() {
  return (
    <Suspense fallback={<p>Identificando perfil...</p>}>
      <RedirecionarPerfil />
    </Suspense>
  );
}

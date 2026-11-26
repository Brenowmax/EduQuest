
import "server-only";

import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";

// ==========================================
// TIPOS DE PERFIL
// ==========================================

export type TipoPerfil =
  | "desenvolvedor"
  | "gestor"
  | "professor"
  | "aluno";

// ==========================================
// OBTER PERFIL AUTENTICADO
// ==========================================

export async function obterPerfilAtual() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: perfil, error } = await supabase
    .from("perfis")
    .select("id, nome, tipo, ativo")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(
      "Não foi possível consultar o perfil."
    );
  }

  if (!perfil || !perfil.ativo) {
    redirect("/acesso-negado");
  }

  return perfil;
}

// ==========================================
// VALIDAR VINCULO INSTITUCIONAL DO GESTOR
// ==========================================

async function validarAcessoGestor(
  perfilId: string
): Promise<void> {
  const supabase = await createClient();

  const { data: vinculos, error: vinculoError } =
    await supabase
      .from("vinculos_escolares")
      .select("escola_id")
      .eq("perfil_id", perfilId)
      .eq("funcao", "gestor")
      .eq("ativo", true);

  if (
    vinculoError ||
    !vinculos ||
    vinculos.length === 0
  ) {
    redirect("/acesso-negado");
  }

  const escolasIds = vinculos.map(
    (vinculo) => vinculo.escola_id
  );

  const { data: escolas, error: escolaError } =
    await supabase
      .from("escolas")
      .select("id")
      .in("id", escolasIds)
      .eq("ativa", true)
      .limit(1);

  if (
    escolaError ||
    !escolas ||
    escolas.length === 0
  ) {
    redirect("/acesso-negado");
  }
}

// ==========================================
// EXIGIR PERFIL E PERMISSOES
// ==========================================

export async function exigirPerfil(
  tipo: TipoPerfil
) {
  const perfil = await obterPerfilAtual();

  if (perfil.tipo !== tipo) {
    redirect("/acesso-negado");
  }

  if (tipo === "gestor") {
    await validarAcessoGestor(perfil.id);
  }

  return perfil;
}

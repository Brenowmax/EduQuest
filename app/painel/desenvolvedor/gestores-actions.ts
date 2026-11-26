
"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/src/lib/auth";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";

type Resultado = {
  sucesso: boolean;
  mensagem: string;
};

function idValido(id: string): boolean {
  return (
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

// ==========================================
// EDITAR NOME DO GESTOR
// ==========================================

export async function editarGestor(
  id: string,
  nome: string
): Promise<Resultado> {
  await exigirPerfil("desenvolvedor");

  if (
    !idValido(id) ||
    typeof nome !== "string"
  ) {
    return {
      sucesso: false,
      mensagem: "Dados inválidos.",
    };
  }

  nome = nome.trim();

  if (nome.length < 3 || nome.length > 150) {
    return {
      sucesso: false,
      mensagem: "Informe um nome válido.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("perfis")
    .update({ nome })
    .eq("id", id)
    .eq("tipo", "gestor")
    .select("id")
    .single();

  if (error || !data) {
    return {
      sucesso: false,
      mensagem: "Não foi possível editar o gestor.",
    };
  }

  revalidatePath("/painel/desenvolvedor");

  return {
    sucesso: true,
    mensagem: "Gestor atualizado com sucesso!",
  };
}

// ==========================================
// ATIVAR OU DESATIVAR GESTOR
// ==========================================

export async function alterarSituacaoGestor(
  id: string,
  ativo: boolean
): Promise<Resultado> {
  await exigirPerfil("desenvolvedor");

  if (
    !idValido(id) ||
    typeof ativo !== "boolean"
  ) {
    return {
      sucesso: false,
      mensagem: "Dados inválidos.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("perfis")
    .update({ ativo })
    .eq("id", id)
    .eq("tipo", "gestor")
    .select("id")
    .single();

  if (error || !data) {
    return {
      sucesso: false,
      mensagem: "Não foi possível alterar a situação.",
    };
  }

  revalidatePath("/painel/desenvolvedor");

  return {
    sucesso: true,
    mensagem: ativo
      ? "Gestor ativado com sucesso!"
      : "Gestor desativado com sucesso!",
  };
}

// ==========================================
// REDEFINIR SENHA DO GESTOR
// ==========================================

export async function redefinirSenhaGestor(
  id: string,
  senha: string,
  confirmarSenha: string
): Promise<Resultado> {
  await exigirPerfil("desenvolvedor");

  if (
    !idValido(id) ||
    typeof senha !== "string" ||
    typeof confirmarSenha !== "string"
  ) {
    return {
      sucesso: false,
      mensagem: "Dados inválidos.",
    };
  }

  if (
    senha.length < 12 ||
    new TextEncoder().encode(senha).length > 72
  ) {
    return {
      sucesso: false,
      mensagem:
        "A senha deve possuir pelo menos 12 caracteres e no máximo 72 bytes.",
    };
  }

  if (senha !== confirmarSenha) {
    return {
      sucesso: false,
      mensagem: "As senhas não coincidem.",
    };
  }

  // Verificar se o usuário é realmente um gestor.

  const supabase = await createClient();

  const { data: gestor, error: gestorError } =
    await supabase
      .from("perfis")
      .select("id, tipo")
      .eq("id", id)
      .eq("tipo", "gestor")
      .maybeSingle();

  if (gestorError || !gestor) {
    return {
      sucesso: false,
      mensagem: "Gestor não encontrado.",
    };
  }

  // Utilizar o cliente administrativo
  // somente após validar as permissões.

  const admin = createAdminClient();

  const { data, error } =
    await admin.auth.admin.updateUserById(
      gestor.id,
      {
        password: senha,
      }
    );

  if (error || !data.user) {
    return {
      sucesso: false,
      mensagem:
        "Não foi possível confirmar a redefinição da senha.",
    };
  }

  return {
    sucesso: true,
    mensagem: "Senha redefinida com sucesso!",
  };
}

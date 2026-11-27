
"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/src/lib/auth";
import { createClient } from "@/src/lib/supabase/server";

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
// EDITAR NOME DO PROFESSOR
// ==========================================

export async function editarProfessor(
  vinculoId: string,
  nome: string
): Promise<Resultado> {

  await exigirPerfil("gestor");

  if (
    !idValido(vinculoId) ||
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
      mensagem: "O nome deve possuir entre 3 e 150 caracteres.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "editar_nome_professor",
    {
      p_vinculo_id: vinculoId,
      p_nome: nome,
    }
  );

  if (error) {

    console.error("ERRO EDICAO PROFESSOR:", {
      codigo: error.code,
    });

    if (
      error.message.includes(
        "Professor vinculado a outra instituicao"
      )
    ) {
      return {
        sucesso: false,
        mensagem:
          "Este professor possui vínculo com outra instituição. Solicite uma revisão administrativa.",
      };
    }

    return {
      sucesso: false,
      mensagem:
        "Não foi possível atualizar o cadastro do professor.",
    };
  }

  revalidatePath("/painel/gestor");
  revalidatePath("/painel/gestor/professores");

  return {
    sucesso: true,
    mensagem: "Cadastro atualizado com sucesso!",
  };
}

// ==========================================
// ATIVAR OU DESATIVAR VINCULO
// ==========================================

export async function alterarVinculoProfessor(
  vinculoId: string,
  ativo: boolean
): Promise<Resultado> {

  await exigirPerfil("gestor");

  if (
    !idValido(vinculoId) ||
    typeof ativo !== "boolean"
  ) {
    return {
      sucesso: false,
      mensagem: "Dados inválidos.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "alterar_vinculo_professor",
    {
      p_vinculo_id: vinculoId,
      p_ativo: ativo,
    }
  );

  if (error) {

    console.error("ERRO VINCULO PROFESSOR:", {
      codigo: error.code,
    });

    if (
      error.message.includes("tutorados ativos")
    ) {
      return {
        sucesso: false,
        mensagem:
          "Redistribua os tutorados antes de desativar o vínculo.",
      };
    }

    if (
      error.message.includes(
        "perfil do professor esta inativo"
      )
    ) {
      return {
        sucesso: false,
        mensagem:
          "O perfil global do professor está inativo.",
      };
    }

    if (error.code === "23505") {
      return {
        sucesso: false,
        mensagem:
          "O professor já possui um vínculo ativo nesta instituição.",
      };
    }

    return {
      sucesso: false,
      mensagem:
        "Não foi possível alterar o vínculo institucional.",
    };
  }

  revalidatePath("/painel/gestor");
  revalidatePath("/painel/gestor/professores");

  return {
    sucesso: true,
    mensagem: ativo
      ? "Vínculo reativado com sucesso!"
      : "Vínculo desativado com sucesso!",
  };
}

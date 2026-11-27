
"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/src/lib/auth";
import { createClient } from "@/src/lib/supabase/server";

type Resultado = {
  sucesso: boolean;
  mensagem: string;
};

// ==========================================
// VALIDACOES
// ==========================================

function idValido(id: string): boolean {
  return (
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

function capacidadeValida(
  capacidade: number
): boolean {
  return (
    Number.isInteger(capacidade) &&
    capacidade >= 1 &&
    capacidade <= 25
  );
}

// ==========================================
// ATUALIZAR PAGINAS
// ==========================================

function atualizarPaginas() {
  revalidatePath("/painel/gestor");
  revalidatePath("/painel/gestor/tutores");
  revalidatePath("/painel/gestor/professores");
}

// ==========================================
// HABILITAR TUTOR
// ==========================================

export async function habilitarTutor(
  vinculoEscolarId: string,
  anoLetivoId: string,
  capacidade: number
): Promise<Resultado> {

  await exigirPerfil("gestor");

  if (
    !idValido(vinculoEscolarId) ||
    !idValido(anoLetivoId) ||
    !capacidadeValida(capacidade)
  ) {
    return {
      sucesso: false,
      mensagem:
        "Dados inválidos. A capacidade deve estar entre 1 e 25.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "habilitar_tutor",
    {
      p_vinculo_escolar_id: vinculoEscolarId,
      p_ano_letivo_id: anoLetivoId,
      p_capacidade: capacidade,
    }
  );

  if (error) {

    console.error("ERRO HABILITAR TUTOR:", {
      codigo: error.code,
    });

    if (
      error.message.includes(
        "ja esta habilitado"
      )
      || error.code === "23505"
    ) {
      return {
        sucesso: false,
        mensagem:
          "Este profissional já está habilitado como tutor neste ano letivo.",
      };
    }

    if (
      error.message.includes("Ano letivo")
    ) {
      return {
        sucesso: false,
        mensagem:
          "O ano letivo está inativo ou indisponível.",
      };
    }

    if (
      error.message.includes(
        "Profissional sem vinculo"
      )
    ) {
      return {
        sucesso: false,
        mensagem:
          "O profissional não possui vínculo institucional ativo e válido.",
      };
    }

    return {
      sucesso: false,
      mensagem:
        "Não foi possível habilitar o tutor.",
    };
  }

  if (!data) {
    return {
      sucesso: false,
      mensagem:
        "Não foi possível confirmar a habilitação.",
    };
  }

  atualizarPaginas();

  return {
    sucesso: true,
    mensagem:
      "Tutor habilitado com sucesso!",
  };
}

// ==========================================
// ALTERAR CAPACIDADE DO TUTOR
// ==========================================

export async function alterarCapacidadeTutor(
  tutorId: string,
  capacidade: number
): Promise<Resultado> {

  await exigirPerfil("gestor");

  if (
    !idValido(tutorId) ||
    !capacidadeValida(capacidade)
  ) {
    return {
      sucesso: false,
      mensagem:
        "A capacidade deve estar entre 1 e 25.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "alterar_capacidade_tutor",
    {
      p_tutor_id: tutorId,
      p_capacidade: capacidade,
    }
  );

  if (error) {

    console.error("ERRO CAPACIDADE TUTOR:", {
      codigo: error.code,
    });

    if (
      error.message.includes(
        "capacidade nao pode ser inferior"
      )
    ) {
      return {
        sucesso: false,
        mensagem:
          "A capacidade não pode ser inferior à quantidade de tutorados ativos.",
      };
    }

    if (
      error.message.includes("Ano letivo")
    ) {
      return {
        sucesso: false,
        mensagem:
          "O ano letivo está inativo ou indisponível.",
      };
    }

    return {
      sucesso: false,
      mensagem:
        "Não foi possível alterar a capacidade do tutor.",
    };
  }

  atualizarPaginas();

  return {
    sucesso: true,
    mensagem:
      "Capacidade atualizada com sucesso!",
  };
}

// ==========================================
// DESATIVAR TUTOR
// ==========================================

export async function desativarTutor(
  tutorId: string
): Promise<Resultado> {

  await exigirPerfil("gestor");

  if (!idValido(tutorId)) {
    return {
      sucesso: false,
      mensagem: "Tutor inválido.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "desativar_tutor",
    {
      p_tutor_id: tutorId,
    }
  );

  if (error) {

    console.error("ERRO DESATIVAR TUTOR:", {
      codigo: error.code,
    });

    if (
      error.message.includes("tutorados ativos") ||
      error.message.includes("Redistribua os tutorados")
    ) {
      return {
        sucesso: false,
        mensagem:
          "Redistribua os tutorados ativos antes de desativar a tutoria.",
      };
    }

    return {
      sucesso: false,
      mensagem:
        "Não foi possível desativar a tutoria.",
    };
  }

  atualizarPaginas();

  return {
    sucesso: true,
    mensagem:
      "Tutoria desativada com sucesso!",
  };
}

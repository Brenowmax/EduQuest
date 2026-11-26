
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

function atualizarPainel() {
  revalidatePath("/painel/gestor");
  revalidatePath("/painel/gestor/turmas");
}

// ==========================================
// CADASTRAR TURMA
// ==========================================

export async function cadastrarTurma(
  escolaId: string,
  anoLetivoId: string,
  serie: number,
  letra: string
): Promise<Resultado> {
  await exigirPerfil("gestor");

  if (
    !idValido(escolaId) ||
    !idValido(anoLetivoId) ||
    !Number.isInteger(serie) ||
    serie < 6 ||
    serie > 9 ||
    typeof letra !== "string"
  ) {
    return {
      sucesso: false,
      mensagem: "Dados inválidos.",
    };
  }

  letra = letra.trim().toUpperCase();

  if (!/^[A-Z]$/.test(letra)) {
    return {
      sucesso: false,
      mensagem: "Identificação de turma inválida.",
    };
  }

  const nome = `${serie}º${letra}`;

  const supabase = await createClient();

  const { error } = await supabase
    .from("turmas")
    .insert({
      escola_id: escolaId,
      ano_letivo_id: anoLetivoId,
      nome,
      serie,
    });

  if (error) {
    return {
      sucesso: false,
      mensagem:
        error.code === "23505"
          ? "Esta turma já está cadastrada neste ano letivo."
          : "Não foi possível cadastrar a turma.",
    };
  }

  atualizarPainel();

  return {
    sucesso: true,
    mensagem: `Turma ${nome} cadastrada com sucesso!`,
  };
}

// ==========================================
// EDITAR TURMA
// ==========================================

export async function editarTurma(
  turmaId: string,
  letra: string
): Promise<Resultado> {
  await exigirPerfil("gestor");

  if (
    !idValido(turmaId) ||
    typeof letra !== "string"
  ) {
    return {
      sucesso: false,
      mensagem: "Dados inválidos.",
    };
  }

  letra = letra.trim().toUpperCase();

  if (!/^[A-Z]$/.test(letra)) {
    return {
      sucesso: false,
      mensagem: "Identificação inválida.",
    };
  }

  const supabase = await createClient();

  const { data: turma, error: consultaError } =
    await supabase
      .from("turmas")
      .select("id, serie")
      .eq("id", turmaId)
      .maybeSingle();

  if (consultaError || !turma) {
    return {
      sucesso: false,
      mensagem: "Turma indisponível.",
    };
  }

  const nome = `${turma.serie}º${letra}`;

  const { data, error } = await supabase
    .from("turmas")
    .update({ nome })
    .eq("id", turmaId)
    .select("id")
    .single();

  if (error || !data) {
    return {
      sucesso: false,
      mensagem:
        error?.code === "23505"
          ? "Já existe uma turma com essa identificação."
          : "Não foi possível editar a turma.",
    };
  }

  atualizarPainel();

  return {
    sucesso: true,
    mensagem: "Turma atualizada com sucesso!",
  };
}

// ==========================================
// ATIVAR OU DESATIVAR TURMA
// ==========================================

export async function alterarSituacaoTurma(
  turmaId: string,
  ativa: boolean
): Promise<Resultado> {
  await exigirPerfil("gestor");

  if (
    !idValido(turmaId) ||
    typeof ativa !== "boolean"
  ) {
    return {
      sucesso: false,
      mensagem: "Dados inválidos.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("turmas")
    .update({ ativa })
    .eq("id", turmaId)
    .select("id")
    .single();

  if (error || !data) {
    return {
      sucesso: false,
      mensagem:
        "Não foi possível alterar a situação da turma.",
    };
  }

  atualizarPainel();

  return {
    sucesso: true,
    mensagem: ativa
      ? "Turma ativada com sucesso!"
      : "Turma desativada com sucesso!",
  };
}

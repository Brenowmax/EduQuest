
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
// CADASTRAR ANO LETIVO
// ==========================================

export async function cadastrarAnoLetivo(
  escolaId: string,
  ano: number
): Promise<Resultado> {
  await exigirPerfil("gestor");

  if (
    !idValido(escolaId) ||
    !Number.isInteger(ano) ||
    ano < 2000 ||
    ano > 2100
  ) {
    return {
      sucesso: false,
      mensagem: "Informe um ano letivo válido.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("anos_letivos")
    .insert({
      escola_id: escolaId,
      ano,
    });

  if (error) {
    if (error.code === "23505") {
      return {
        sucesso: false,
        mensagem: "Este ano letivo já está cadastrado.",
      };
    }

    return {
      sucesso: false,
      mensagem: "Não foi possível cadastrar o ano letivo.",
    };
  }

  revalidatePath("/painel/gestor");
  revalidatePath("/painel/gestor/anos-letivos");

  return {
    sucesso: true,
    mensagem: "Ano letivo cadastrado com sucesso!",
  };
}

// ==========================================
// ATIVAR OU ENCERRAR ANO LETIVO
// ==========================================

export async function alterarSituacaoAnoLetivo(
  anoLetivoId: string,
  ativo: boolean
): Promise<Resultado> {
  await exigirPerfil("gestor");

  if (
    !idValido(anoLetivoId) ||
    typeof ativo !== "boolean"
  ) {
    return {
      sucesso: false,
      mensagem: "Dados inválidos.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "alterar_situacao_ano_letivo",
    {
      p_ano_letivo_id: anoLetivoId,
      p_ativo: ativo,
    }
  );

  if (error) {
    return {
      sucesso: false,
      mensagem:
        "Não foi possível alterar a situação do ano letivo.",
    };
  }

  revalidatePath("/painel/gestor");
  revalidatePath("/painel/gestor/anos-letivos");

  return {
    sucesso: true,
    mensagem: ativo
      ? "Ano letivo ativado com sucesso!"
      : "Ano letivo encerrado com sucesso!",
  };
}

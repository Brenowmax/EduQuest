
"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/src/lib/auth";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";

type EstadoCadastro = {
  sucesso: boolean;
  mensagem: string;
};

// ==========================================
// CADASTRAR ESCOLA
// ==========================================

export async function cadastrarEscola(
  estadoAnterior: EstadoCadastro,
  formData: FormData
): Promise<EstadoCadastro> {
  await exigirPerfil("desenvolvedor");

  const nome = String(
    formData.get("nome") ?? ""
  ).trim();

  const codigo = String(
    formData.get("codigo") ?? ""
  ).trim().toUpperCase();

  if (
    nome.length < 3 ||
    nome.length > 150 ||
    codigo.length < 3 ||
    codigo.length > 50
  ) {
    return {
      sucesso: false,
      mensagem: "Preencha corretamente o nome e o código.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("escolas")
    .insert({
      nome,
      codigo,
      ativa: false,
    });

  if (error) {
    if (error.code === "23505") {
      return {
        sucesso: false,
        mensagem: "Já existe uma escola com esse código.",
      };
    }

    return {
      sucesso: false,
      mensagem: "Não foi possível cadastrar a escola.",
    };
  }

  revalidatePath("/painel/desenvolvedor");

  return {
    sucesso: true,
    mensagem: "Escola cadastrada com sucesso!",
  };
}

// ==========================================
// ATIVAR OU DESATIVAR ESCOLA
// ==========================================

export async function alterarSituacaoEscola(
  id: string,
  ativa: boolean
): Promise<EstadoCadastro> {
  await exigirPerfil("desenvolvedor");

  if (
    typeof id !== "string" ||
    typeof ativa !== "boolean"
  ) {
    return {
      sucesso: false,
      mensagem: "Dados inválidos.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("escolas")
    .update({ ativa })
    .eq("id", id)
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
    mensagem: ativa
      ? "Escola ativada com sucesso!"
      : "Escola desativada com sucesso!",
  };
}

// ==========================================
// EDITAR ESCOLA
// ==========================================

export async function editarEscola(
  id: string,
  nome: string,
  codigo: string
): Promise<EstadoCadastro> {
  await exigirPerfil("desenvolvedor");

  if (
    typeof id !== "string" ||
    typeof nome !== "string" ||
    typeof codigo !== "string"
  ) {
    return {
      sucesso: false,
      mensagem: "Dados inválidos.",
    };
  }

  nome = nome.trim();
  codigo = codigo.trim().toUpperCase();

  if (
    nome.length < 3 ||
    nome.length > 150 ||
    codigo.length < 3 ||
    codigo.length > 50
  ) {
    return {
      sucesso: false,
      mensagem: "Nome ou código inválido.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("escolas")
    .update({ nome, codigo })
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data) {
    return {
      sucesso: false,
      mensagem:
        error?.code === "23505"
          ? "Este código já está cadastrado."
          : "Não foi possível editar a instituição.",
    };
  }

  revalidatePath("/painel/desenvolvedor");

  return {
    sucesso: true,
    mensagem: "Instituição atualizada com sucesso!",
  };
}

// ==========================================
// CADASTRAR GESTOR
// ==========================================

export async function cadastrarGestor(
  estadoAnterior: EstadoCadastro,
  formData: FormData
): Promise<EstadoCadastro> {
  await exigirPerfil("desenvolvedor");

  const nome = String(
    formData.get("nome") ?? ""
  ).trim();

  const email = String(
    formData.get("email") ?? ""
  ).trim().toLowerCase();

  const senha = String(
    formData.get("senha") ?? ""
  );

  const escolaId = String(
    formData.get("escola_id") ?? ""
  ).trim();

  if (
    nome.length < 3 ||
    nome.length > 150 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    senha.length < 12 ||
    new TextEncoder().encode(senha).length > 72 ||
    !escolaId
  ) {
    return {
      sucesso: false,
      mensagem: "Verifique os dados informados.",
    };
  }

  const admin = createAdminClient();

  // Verificar se a instituição existe.

  const { data: escola, error: escolaError } =
    await admin
      .from("escolas")
      .select("id")
      .eq("id", escolaId)
      .maybeSingle();

  if (escolaError || !escola) {
    return {
      sucesso: false,
      mensagem: "Instituição inválida.",
    };
  }

  // Criar a conta de autenticação.

  const { data: conta, error: contaError } =
    await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    });

  if (contaError || !conta.user) {
    return {
      sucesso: false,
      mensagem:
        "Não foi possível confirmar a criação da conta. Verifique se o e-mail já está cadastrado.",
    };
  }

  // Registrar perfil e vínculo escolar.

  const { error: cadastroError } =
    await admin.rpc("registrar_novo_gestor", {
      p_usuario_id: conta.user.id,
      p_nome: nome,
      p_email: email,
      p_escola_id: escolaId,
    });

  // Verificar eventuais falhas no cadastro.

  if (cadastroError) {
    const { data: perfil, error: verificacaoError } =
      await admin
        .from("perfis")
        .select("id")
        .eq("id", conta.user.id)
        .maybeSingle();

    if (
      !verificacaoError &&
      !perfil &&
      /^[0-9A-Z]{5}$/.test(cadastroError.code ?? "") &&
      !cadastroError.code.startsWith("08") &&
      !cadastroError.code.startsWith("57")
    ) {
      const { error: exclusaoError } =
        await admin.auth.admin.deleteUser(
          conta.user.id
        );

      if (!exclusaoError) {
        return {
          sucesso: false,
          mensagem:
            "Cadastro não concluído. A nova conta foi removida.",
        };
      }
    }

    return {
      sucesso: false,
      mensagem:
        "Cadastro requer revisão administrativa. Não tente cadastrar novamente antes da verificação.",
    };
  }

  revalidatePath("/painel/desenvolvedor");

  return {
    sucesso: true,
    mensagem:
      "Gestor cadastrado e vinculado com sucesso!",
  };
}
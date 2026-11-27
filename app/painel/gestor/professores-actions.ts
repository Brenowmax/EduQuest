
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
// CADASTRAR PROFESSOR
// ==========================================

export async function cadastrarProfessor(
  escolaId: string,
  nome: string,
  email: string,
  senha: string
): Promise<Resultado> {

  // VALIDAR GESTOR AUTENTICADO

  const gestor = await exigirPerfil("gestor");

  // VALIDAR DADOS RECEBIDOS

  if (
    !idValido(escolaId) ||
    typeof nome !== "string" ||
    typeof email !== "string" ||
    typeof senha !== "string"
  ) {
    return {
      sucesso: false,
      mensagem: "Dados inválidos.",
    };
  }

  nome = nome.trim();
  email = email.trim().toLowerCase();

  if (nome.length < 3 || nome.length > 150) {
    return {
      sucesso: false,
      mensagem: "Informe um nome válido.",
    };
  }

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return {
      sucesso: false,
      mensagem: "Informe um e-mail válido.",
    };
  }

  if (
    senha.length < 12 ||
    Buffer.byteLength(senha, "utf8") > 72
  ) {
    return {
      sucesso: false,
      mensagem:
        "A senha deve possuir pelo menos 12 caracteres e no máximo 72 bytes.",
    };
  }

  // ========================================
  // VALIDAR AUTORIZACAO INSTITUCIONAL
  // ========================================

  const supabase = await createClient();

  const {
    data: autorizado,
    error: autorizacaoError,
  } = await supabase.rpc(
    "sou_gestor_da_escola",
    {
      p_escola_id: escolaId,
    }
  );

  if (autorizacaoError || autorizado !== true) {

    console.error("ERRO AUTORIZACAO PROFESSOR:", {
      codigo: autorizacaoError?.code,
      autorizado: autorizado === true,
    });

    return {
      sucesso: false,
      mensagem:
        "Você não possui autorização para cadastrar professores nesta instituição.",
    };
  }

  // ========================================
  // CLIENTE ADMINISTRATIVO
  // ========================================

  const admin = createAdminClient();

  // ========================================
  // CRIAR CONTA NO SUPABASE AUTH
  // ========================================

  const {
    data: conta,
    error: contaError,
  } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (contaError || !conta?.user) {

    console.error("ERRO AUTH PROFESSOR:", {
      codigo: contaError?.code,
      mensagem: contaError?.message,
      status: contaError?.status,
    });

    return {
      sucesso: false,
      mensagem:
        "Não foi possível criar a conta do professor. Consulte o terminal para diagnóstico.",
    };
  }

  const usuarioId = conta.user.id;

  console.info(
    "PROFESSOR: Conta de autenticacao criada."
  );

  // ========================================
  // REGISTRAR PERFIL E VINCULO ESCOLAR
  // ========================================

  const { error: registroError } =
    await admin.rpc(
      "registrar_novo_professor",
      {
        p_gestor_id: gestor.id,
        p_usuario_id: usuarioId,
        p_nome: nome,
        p_email: email,
        p_escola_id: escolaId,
      }
    );

  // ========================================
  // TRATAR FALHAS NO REGISTRO
  // ========================================

  if (registroError) {

    console.error("ERRO SQL PROFESSOR:", {
      codigo: registroError.code,
    });

    const {
      data: perfilCriado,
      error: verificacaoError,
    } = await admin
      .from("perfis")
      .select("id")
      .eq("id", usuarioId)
      .maybeSingle();

    const codigo = registroError.code ?? "";

    const falhaSqlConfirmada =
      /^[0-9A-Z]{5}$/.test(codigo) &&
      !codigo.startsWith("08") &&
      !codigo.startsWith("57") &&
      !codigo.startsWith("PGRST");

    if (
      falhaSqlConfirmada &&
      !verificacaoError &&
      !perfilCriado
    ) {

      const { error: exclusaoError } =
        await admin.auth.admin.deleteUser(
          usuarioId
        );

      if (!exclusaoError) {

        console.info(
          "PROFESSOR: Conta temporaria removida."
        );

        return {
          sucesso: false,
          mensagem:
            "Não foi possível registrar o professor. A conta temporária foi removida.",
        };
      }

      console.error(
        "ERRO AO REMOVER CONTA TEMPORARIA:",
        {
          codigo: exclusaoError.code,
          status: exclusaoError.status,
        }
      );
    }

    return {
      sucesso: false,
      mensagem:
        "Não foi possível confirmar o cadastro. Solicite uma verificação administrativa antes de tentar novamente.",
    };
  }

  // ========================================
  // CADASTRO CONCLUIDO
  // ========================================

  console.info(
    "PROFESSOR: Perfil e vinculo registrados."
  );

  revalidatePath("/painel/gestor");
  revalidatePath("/painel/gestor/professores");

  return {
    sucesso: true,
    mensagem:
      `Professor ${nome} cadastrado com sucesso!`,
  };
}

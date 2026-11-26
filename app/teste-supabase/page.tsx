
import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

async function ResultadoSupabase() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <section>
        <h2>Sessão não reconhecida</h2>
        <p>
          {authError?.message ??
            "Nenhum usuário autenticado."}
        </p>
        <a href="/login">Voltar ao login</a>
      </section>
    );
  }

  const { data: perfil, error: perfilError } =
    await supabase
      .from("perfis")
      .select("id, tipo")
      .eq("id", user.id)
      .maybeSingle();

  const { data: componentes, error: componentesError } =
    await supabase
      .from("componentes_curriculares")
      .select("id, nome")
      .limit(5);

  return (
    <section>
      <h2>Sessão autenticada com sucesso!</h2>

      <p>Usuário: {user.email}</p>

      <hr />

      <h2>Identificação do perfil</h2>

      {perfilError ? (
        <p>Erro: {perfilError.message}</p>
      ) : perfil ? (
        <p>Tipo de perfil: {perfil.tipo}</p>
      ) : (
        <p>Perfil não encontrado ou sem permissão de leitura.</p>
      )}

      <hr />

      <h2>Componentes curriculares</h2>

      {componentesError ? (
        <p>Erro: {componentesError.message}</p>
      ) : (
        <>
          <p>
            Registros retornados: {componentes?.length ?? 0}
          </p>

          <ul>
            {componentes?.map((item) => (
              <li key={item.id}>{item.nome}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export default function TesteSupabase() {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>EduQuest — Diagnóstico Supabase</h1>

      <Suspense fallback={<p>Consultando Supabase...</p>}>
        <ResultadoSupabase />
      </Suspense>
    </main>
  );
}

import { Suspense } from "react";
import { exigirPerfil } from "@/src/lib/auth";
import { createAdminClient } from "@/src/lib/supabase/admin";

async function TesteAdmin() {
  await exigirPerfil("desenvolvedor");

  const admin = createAdminClient();

  const { error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="mb-6 text-3xl font-bold text-amber-400">
        EduQuest — Diagnóstico Administrativo
      </h1>

      {error ? (
        <p className="text-red-400">
          Falha na conexão administrativa.
        </p>
      ) : (
        <p className="text-green-400">
          Cliente administrativo conectado com sucesso!
        </p>
      )}
    </main>
  );
}

export default function TesteAdminPage() {
  return (
    <Suspense fallback={<p>Validando conexão...</p>}>
      <TesteAdmin />
    </Suspense>
  );
}
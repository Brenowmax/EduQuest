
export default function AcessoNegado() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <section className="max-w-md rounded-xl border border-red-500 bg-slate-900 p-8 text-center text-white">

        <h1 className="text-3xl font-bold text-red-400">
          Acesso negado
        </h1>

        <p className="my-6 text-slate-300">
          Seu perfil não possui autorização para
          acessar esta área do EduQuest.
        </p>

        <a
          href="/login"
          className="inline-block rounded bg-amber-500 px-6 py-3 font-bold text-slate-950"
        >
          Voltar ao login
        </a>

      </section>
    </main>
  );
}

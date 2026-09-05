import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useAjustes } from "@/lib/useAjustes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Guía de Estudio | Asistente escolar que enseña, no resuelve" },
      {
        name: "description",
        content:
          "Asistente de estudio para primaria y secundaria: entrega pistas, pasos y preguntas guía en lugar de dar la respuesta hecha.",
      },
      { property: "og:title", content: "Guía de Estudio | Asistente escolar que enseña, no resuelve" },
      {
        property: "og:description",
        content: "Pistas y acompañamiento por nivel, con panel de monitoreo para el colegio.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { ajustes } = useAjustes();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="banner-hero border-b border-border">
          <div className="mx-auto max-w-5xl px-4 py-20 text-center">
            <span className="inline-block rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-primary">
              {ajustes.nombre_colegio}
            </span>
            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">
              Un asistente que te da pistas,<br />no la respuesta hecha
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              La Guía acompaña a cada estudiante con preguntas, pasos y ejemplos análogos, adaptando su
              lenguaje según el nivel. Todo queda registrado para que el colegio acompañe el aprendizaje.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/primaria" className="btn-primary">Entrar a Primaria</Link>
              <Link to="/secundaria" className="btn-ghost">Entrar a Secundaria</Link>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-4 px-4 py-14 md:grid-cols-3">
          {[
            {
              t: "Primaria",
              d: "Lenguaje sencillo, ejemplos cotidianos y pasos muy cortos, con refuerzo positivo.",
            },
            {
              t: "Secundaria",
              d: "Tono adulto, vocabulario académico, exigencia de argumentos y rutas de investigación.",
            },
            {
              t: "Panel del colegio",
              d: "Historial de consultas por alumno, área y nivel, gestión de estudiantes y colores institucionales.",
            },
          ].map((c) => (
            <article key={c.t} className="surface p-6">
              <h2 className="text-lg font-semibold text-primary">{c.t}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
            </article>
          ))}
        </section>

        <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
          {ajustes.nombre_colegio} · Guía de Estudio
        </footer>
      </main>
    </div>
  );
}

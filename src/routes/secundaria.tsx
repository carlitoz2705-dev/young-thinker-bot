import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { TutorChat } from "@/components/TutorChat";

export const Route = createFileRoute("/secundaria")({
  head: () => ({
    meta: [
      { title: "Guía de Secundaria | Asistente de estudio escolar" },
      {
        name: "description",
        content:
          "Asistente de estudio para secundaria: razonamiento guiado, fuentes y preguntas críticas en lugar de respuestas directas.",
      },
      { property: "og:title", content: "Guía de Secundaria | Asistente de estudio escolar" },
      {
        property: "og:description",
        content: "Razonamiento guiado y pensamiento crítico para estudiantes de secundaria.",
      },
    ],
  }),
  component: SecundariaPage,
});

function SecundariaPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Nivel Secundaria</p>
        <h1 className="mt-1 text-3xl font-bold">Piensa, argumenta, comprueba</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Plantea tu duda o tu hipótesis. Recibirás contraejemplos, criterios y rutas de investigación
          para construir tu propia respuesta.
        </p>
        <div className="mt-6">
          <TutorChat nivel="secundaria" />
        </div>
      </main>
    </div>
  );
}

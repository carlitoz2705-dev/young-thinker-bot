import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { TutorChat } from "@/components/TutorChat";

export const Route = createFileRoute("/primaria")({
  head: () => ({
    meta: [
      { title: "Guía de Primaria | Asistente de estudio escolar" },
      {
        name: "description",
        content:
          "Asistente de estudio para estudiantes de primaria: pistas, pasos y preguntas guía en lugar de respuestas hechas.",
      },
      { property: "og:title", content: "Guía de Primaria | Asistente de estudio escolar" },
      { property: "og:description", content: "Pistas y pasos guiados para estudiantes de primaria." },
    ],
  }),
  component: PrimariaPage,
});

function PrimariaPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Nivel Primaria</p>
        <h1 className="mt-1 text-3xl font-bold">Aprende paso a paso</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Cuéntale tu duda a la Guía. Te dará una pista y un paso para intentar, o una pregunta para
          comprobar si vas bien.
        </p>
        <div className="mt-6">
          <TutorChat nivel="primaria" />
        </div>
      </main>
    </div>
  );
}

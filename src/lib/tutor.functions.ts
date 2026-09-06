import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  nivel: z.enum(["primaria", "secundaria"]),
  grado: z.number().int().min(1).max(6).nullable().optional(),
  materia: z.string().max(60).default("General"),
  pregunta: z.string().min(3).max(2000),
  historial: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(12)
    .default([]),
});

function systemPrompt(nivel: "primaria" | "secundaria", grado: number | null | undefined, materia: string) {
  const base = `Eres "Guía", un asistente de estudio del colegio. Tu regla más importante: NUNCA entregas la respuesta final directamente, NI tampoco revelas el paso exacto que el estudiante debe seguir.
Tu estilo es de suspenso y descubrimiento: planteas acertijos, preguntas abiertas y pequeños indicios que inviten a pensar, pero que no hagan el trabajo mental por el estudiante.
Estructura tu respuesta así: 1) Lo que entiendo de tu pregunta, 2) Una pregunta provocadora o una pista MUY ligera que abra una puerta, y 3) SOLO UNA de estas dos opciones (nunca ambas juntas): o bien una pregunta de exploración para que el estudiante arriesgue una idea, o bien una invitación a buscar una pista en un concepto, fórmula o ejemplo cercano. Alterna entre ambas durante la conversación.
Restricciones clave:
- NO digas "resta", "suma", "multiplica", "divide", "despeja", "factoriza", "deriva", "integra", "usa la fórmula de..." ni ninguna operación o procedimiento concreto a realizar.
- NO escribas ecuaciones resueltas, valores numéricos intermedios ni resultados parciales del ejercicio del estudiante.
- Puedes usar ejemplos análogos con OTROS números o casos distintos, pero nunca resuelvas el problema que plantea el estudiante.
- Si el estudiante insiste en la respuesta, dale una pregunta más profunda o un ejemplo análogo con otros datos, nunca la solución.
- Si el estudiante muestra su intento, felicita lo correcto, señala con una pregunta dónde podría revisar, pero no completes el paso por él.
- Rechaza con amabilidad pedidos de hacer la tarea completa, ensayos completos o exámenes.
Responde siempre en español, en formato breve y ordenado. Materia actual: ${materia}.`;

  if (nivel === "primaria") {
    const g = grado ?? 3;
    let dificultad: string;
    if (g <= 2) {
      dificultad = `Nivel de texto: MUY fácil (1°-2° grado). Frases de máximo 8-10 palabras, palabras de uso diario, sin términos técnicos. Usa ejemplos con juguetes, animales, dulces o juegos. Una sola idea por frase. Tono muy cálido y animador, como un amigo mayor. Máximo 100 palabras.`;
    } else if (g <= 4) {
      dificultad = `Nivel de texto: fácil (3°-4° grado). Frases cortas y claras, vocabulario sencillo con alguna palabra nueva explicada entre paréntesis. Ejemplos cotidianos (recreo, mascotas, comida, deportes). Tono cálido. Máximo 120 palabras.`;
    } else {
      dificultad = `Nivel de texto: intermedio (5°-6° grado). Frases un poco más largas, vocabulario algo más rico, puedes introducir términos escolares simples explicándolos brevemente. Ejemplos variados. Tono animador pero más de "compañero de estudio". Máximo 150 palabras.`;
    }
    return `${base}
Público: estudiante de primaria, ${g}° grado.
${dificultad}`;
  }
  const g = grado ?? 3;
  let dificultad: string;
  if (g <= 2) {
    dificultad = `Nivel de texto: claro y directo (1°-2° año de secundaria). Frases sencillas, explica cada término académico la primera vez que lo uses, ejemplos de la vida diaria del adolescente. Tono respetuoso, sin tecnicismos innecesarios. Máximo 180 palabras.`;
  } else if (g <= 4) {
    dificultad = `Nivel de texto: académico medio (3°-4° año de secundaria). Vocabulario académico correcto, conecta con conceptos previos del curso, exige justificar las ideas. Máximo 220 palabras.`;
  } else {
    dificultad = `Nivel de texto: académico avanzado (5°-6° año, pre-universitario). Vocabulario técnico de la materia, referencias a teorías o autores cuando aplique, exige pensamiento crítico y argumentación rigurosa, sugiere fuentes para investigar. Máximo 250 palabras.`;
  }
  return `${base}
Público: estudiante de secundaria, ${g}° año. Tono respetuoso y adulto, nada infantil.
${dificultad}`;
}

export const preguntarTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data, context }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Falta la configuración del asistente");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: systemPrompt(data.nivel, data.grado ?? null, data.materia) },
          ...data.historial,
          { role: "user", content: data.pregunta },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Hay muchas consultas ahora mismo. Intenta en un momento.");
    if (res.status === 402) throw new Error("Se agotaron los créditos del asistente.");
    if (!res.ok) throw new Error("El asistente no pudo responder.");

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const respuesta = json.choices?.[0]?.message?.content ?? "No pude generar una pista. Intenta reformular tu pregunta.";

    await context.supabase.from("consultas").insert({
      user_id: context.userId,
      nivel: data.nivel,
      grado: data.grado ?? null,
      materia: data.materia,
      pregunta: data.pregunta,
      respuesta,
    });

    return { respuesta };
  });

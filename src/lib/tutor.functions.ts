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
  const base = `Eres "Guía", un asistente de estudio del colegio. Tu regla más importante: NUNCA entregas la respuesta final directamente.
Usas el método socrático: haces preguntas, das pistas graduales, propones un procedimiento paso a paso y pides al estudiante que intente cada paso.
Estructura tu respuesta con: 1) Lo que entiendo de tu pregunta, 2) Pista o idea clave, 3) Un paso para intentar ahora, 4) Una pregunta de verificación.
Si el estudiante insiste en la respuesta, ofrece una pista más fuerte o un ejemplo análogo resuelto con OTROS números o OTRO caso, nunca el ejercicio exacto.
Si el estudiante ya intentó y muestra su procedimiento, corrige su razonamiento y confirma si va bien, sin escribir el resultado final por él.
Rechaza con amabilidad pedidos de hacer la tarea completa, ensayos completos o exámenes.
Responde siempre en español, en formato breve y ordenado. Materia actual: ${materia}.`;

  if (nivel === "primaria") {
    return `${base}
Público: estudiante de primaria${grado ? `, ${grado}° grado` : ""}. Usa frases cortas, vocabulario sencillo y ejemplos cotidianos (juguetes, deportes, comida). Tono cálido y animador, pero sin infantilizar en exceso. Máximo 150 palabras.`;
  }
  return `${base}
Público: estudiante de secundaria${grado ? `, ${grado}° año` : ""}. Tono respetuoso y adulto, nada infantil. Usa vocabulario académico correcto, exige justificación y pensamiento crítico, sugiere fuentes o conceptos para investigar. Máximo 220 palabras.`;
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

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { preguntarTutor } from "@/lib/tutor.functions";
import { useAuth } from "@/lib/useAuth";

type Msg = { role: "user" | "assistant"; content: string };

const MATERIAS = ["Matemática", "Comunicación", "Ciencia y Tecnología", "Personal Social", "Inglés", "Arte"];

export function TutorChat({ nivel }: { nivel: "primaria" | "secundaria" }) {
  const { session, perfil, loading } = useAuth();
  const preguntar = useServerFn(preguntarTutor);
  const grados = nivel === "primaria" ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];

  const [grado, setGrado] = useState<number>(nivel === "primaria" ? 3 : 3);
  const [materia, setMateria] = useState(MATERIAS[0]);
  const [texto, setTexto] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [pensando, setPensando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  if (!session) {
    return (
      <div className="surface p-6 text-center">
        <h3 className="text-lg font-semibold">Inicia sesión para usar la guía</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada consulta se registra para que tus docentes puedan acompañarte.
        </p>
        <Link to="/auth" className="btn-primary mt-4">
          Ingresar o crear cuenta
        </Link>
      </div>
    );
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const pregunta = texto.trim();
    if (pregunta.length < 3 || pensando) return;
    setError(null);
    setPensando(true);
    const historial = msgs.slice(-8);
    setMsgs((m) => [...m, { role: "user", content: pregunta }]);
    setTexto("");
    try {
      const { respuesta } = await preguntar({
        data: { nivel, grado, materia, pregunta, historial },
      });
      setMsgs((m) => [...m, { role: "assistant", content: respuesta }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo consultar ahora.");
    } finally {
      setPensando(false);
    }
  }

  return (
    <div className="surface flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <label className="text-sm text-muted-foreground">
          {nivel === "primaria" ? "Grado" : "Año"}
          <select className="field mt-1" value={grado} onChange={(e) => setGrado(Number(e.target.value))}>
            {grados.map((g) => (
              <option key={g} value={g}>
                {g}° {nivel === "primaria" ? "grado" : "año"}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-muted-foreground">
          Área
          <select className="field mt-1" value={materia} onChange={(e) => setMateria(e.target.value)}>
            {MATERIAS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <span className="ml-auto text-xs text-muted-foreground">
          {perfil?.full_name ? `Hola, ${perfil.full_name.split(" ")[0]}` : ""}
        </span>
      </div>

      <div className="flex min-h-[320px] flex-col gap-3 overflow-y-auto p-4">
        {msgs.length === 0 && (
          <p className="m-auto max-w-md text-center text-sm text-muted-foreground">
            Escribe tu duda. No recibirás la respuesta hecha: recibirás pistas y pasos para llegar tú
            mismo al resultado.
          </p>
        )}
        {msgs.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground"
                : "mr-auto max-w-[90%] whitespace-pre-wrap rounded-2xl bg-muted px-4 py-3 text-sm"
            }
          >
            {m.content}
          </div>
        ))}
        {pensando && <p className="text-sm text-muted-foreground">Pensando una buena pista…</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <form onSubmit={enviar} className="flex gap-2 border-t border-border p-3">
        <input
          className="field"
          placeholder={nivel === "primaria" ? "¿Qué estás resolviendo?" : "Plantea tu duda o tu hipótesis"}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button className="btn-primary" disabled={pensando}>
          Pedir pista
        </button>
      </form>
    </div>
  );
}

import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Ingresar | Guía de Estudio del colegio" },
      { name: "description", content: "Accede con tu cuenta escolar para usar el asistente de estudio guiado." },
      { property: "og:title", content: "Ingresar | Guía de Estudio del colegio" },
      { property: "og:description", content: "Acceso para estudiantes y administración del colegio." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState<"primaria" | "secundaria">("primaria");
  const [grado, setGrado] = useState(1);
  const [seccion, setSeccion] = useState("A");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    setCargando(true);
    try {
      if (modo === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/", replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: nombre, nivel, grado: String(grado), seccion },
          },
        });
        if (error) throw error;
        setMsg("Cuenta creada. Ya puedes ingresar con tu correo y contraseña.");
        setModo("login");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la operación.");
    } finally {
      setCargando(false);
    }
  }

  const grados = nivel === "primaria" ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-4 py-12">
        <h1 className="text-2xl font-bold">{modo === "login" ? "Ingresar" : "Crear cuenta de estudiante"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Los docentes y la administración usan su cuenta institucional.
        </p>

        <form onSubmit={enviar} className="surface mt-6 flex flex-col gap-3 p-5">
          {modo === "registro" && (
            <>
              <label className="text-sm">
                Nombre completo
                <input className="field mt-1" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className="col-span-1 text-sm">
                  Nivel
                  <select
                    className="field mt-1"
                    value={nivel}
                    onChange={(e) => setNivel(e.target.value as "primaria" | "secundaria")}
                  >
                    <option value="primaria">Primaria</option>
                    <option value="secundaria">Secundaria</option>
                  </select>
                </label>
                <label className="text-sm">
                  Grado
                  <select className="field mt-1" value={grado} onChange={(e) => setGrado(Number(e.target.value))}>
                    {grados.map((g) => (
                      <option key={g} value={g}>
                        {g}°
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  Sección
                  <input className="field mt-1" value={seccion} onChange={(e) => setSeccion(e.target.value)} />
                </label>
              </div>
            </>
          )}
          <label className="text-sm">
            Correo
            <input
              className="field mt-1"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="text-sm">
            Contraseña
            <input
              className="field mt-1"
              type="password"
              autoComplete={modo === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {msg && <p className="text-sm text-primary">{msg}</p>}
          <button className="btn-primary mt-1" disabled={cargando}>
            {modo === "login" ? "Ingresar" : "Crear cuenta"}
          </button>
          <button
            type="button"
            className="text-sm text-muted-foreground underline"
            onClick={() => setModo(modo === "login" ? "registro" : "login")}
          >
            {modo === "login" ? "No tengo cuenta, quiero registrarme" : "Ya tengo cuenta"}
          </button>
        </form>
      </main>
    </div>
  );
}

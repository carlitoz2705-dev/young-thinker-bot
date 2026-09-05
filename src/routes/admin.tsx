import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth, type Perfil } from "@/lib/useAuth";
import { useAjustes, aplicarColores, type Ajustes } from "@/lib/useAjustes";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel de administración | Guía de Estudio" },
      { name: "description", content: "Monitorea las consultas de los estudiantes y gestiona alumnos y colores del colegio." },
      { property: "og:title", content: "Panel de administración | Guía de Estudio" },
      { property: "og:description", content: "Monitoreo de consultas y gestión de alumnos." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Consulta = {
  id: string;
  user_id: string;
  nivel: string;
  grado: number | null;
  materia: string | null;
  pregunta: string;
  respuesta: string | null;
  created_at: string;
};

function AdminPage() {
  const { session, isAdmin, loading } = useAuth();
  const { ajustes, setAjustes } = useAjustes();
  const [tab, setTab] = useState<"consultas" | "alumnos" | "ajustes">("consultas");
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [alumnos, setAlumnos] = useState<Perfil[]>([]);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from("consultas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => setConsultas((data as Consulta[]) ?? []));
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setAlumnos((data as Perfil[]) ?? []));
  }, [isAdmin]);

  if (loading) return <Shell><p className="text-muted-foreground">Cargando…</p></Shell>;

  if (!session)
    return (
      <Shell>
        <p className="text-muted-foreground">Debes ingresar con la cuenta de administración.</p>
        <Link to="/auth" className="btn-primary mt-4">Ingresar</Link>
      </Shell>
    );

  if (!isAdmin)
    return (
      <Shell>
        <h1 className="text-2xl font-bold">Acceso restringido</h1>
        <p className="mt-2 text-muted-foreground">Esta sección es solo para la administración del colegio.</p>
      </Shell>
    );

  const consultasFiltradas = consultas.filter((c) =>
    (c.pregunta + " " + (c.materia ?? "") + " " + c.nivel).toLowerCase().includes(filtro.toLowerCase()),
  );
  const nombrePorId = new Map(alumnos.map((a) => [a.id, a.full_name || a.email || "—"]));

  async function toggleActivo(a: Perfil) {
    const { error } = await supabase.from("profiles").update({ activo: !a.activo }).eq("id", a.id);
    if (!error) setAlumnos((prev) => prev.map((x) => (x.id === a.id ? { ...x, activo: !a.activo } : x)));
  }

  return (
    <Shell>
      <h1 className="text-3xl font-bold">Administración</h1>
      <p className="mt-1 text-muted-foreground">
        {consultas.length} consultas registradas · {alumnos.length} alumnos
      </p>

      <div className="mt-6 flex gap-2">
        {(["consultas", "alumnos", "ajustes"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={t === tab ? "btn-primary text-sm capitalize" : "btn-ghost text-sm capitalize"}
          >
            {t === "ajustes" ? "Colores" : t}
          </button>
        ))}
      </div>

      {tab === "consultas" && (
        <section className="surface mt-5 overflow-hidden">
          <div className="border-b border-border p-3">
            <input
              className="field"
              placeholder="Buscar por pregunta, área o nivel"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
          <div className="max-h-[520px] divide-y divide-border overflow-y-auto">
            {consultasFiltradas.map((c) => (
              <details key={c.id} className="p-4">
                <summary className="cursor-pointer text-sm">
                  <span className="font-medium">{nombrePorId.get(c.user_id) ?? "Alumno"}</span>{" "}
                  <span className="text-muted-foreground">
                    · {c.nivel} {c.grado ? `${c.grado}°` : ""} · {c.materia ?? "General"} ·{" "}
                    {new Date(c.created_at).toLocaleString("es-PE")}
                  </span>
                  <p className="mt-1">{c.pregunta}</p>
                </summary>
                <p className="mt-3 whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">{c.respuesta}</p>
              </details>
            ))}
            {consultasFiltradas.length === 0 && (
              <p className="p-6 text-sm text-muted-foreground">Aún no hay consultas registradas.</p>
            )}
          </div>
        </section>
      )}

      {tab === "alumnos" && (
        <section className="surface mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3">Alumno</th>
                <th className="p-3">Correo</th>
                <th className="p-3">Nivel</th>
                <th className="p-3">Grado</th>
                <th className="p-3">Estado</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {alumnos.map((a) => (
                <tr key={a.id}>
                  <td className="p-3">{a.full_name || "—"}</td>
                  <td className="p-3 text-muted-foreground">{a.email}</td>
                  <td className="p-3 capitalize">{a.nivel ?? "—"}</td>
                  <td className="p-3">{a.grado ? `${a.grado}° ${a.seccion ?? ""}` : "—"}</td>
                  <td className="p-3">{a.activo ? "Activo" : "Inactivo"}</td>
                  <td className="p-3 text-right">
                    <button className="btn-ghost text-xs" onClick={() => toggleActivo(a)}>
                      {a.activo ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === "ajustes" && <AjustesPanel ajustes={ajustes} setAjustes={setAjustes} />}
    </Shell>
  );
}

function AjustesPanel({ ajustes, setAjustes }: { ajustes: Ajustes; setAjustes: (a: Ajustes) => void }) {
  const [local, setLocal] = useState(ajustes);
  const [msg, setMsg] = useState<string | null>(null);
  const [pass, setPass] = useState({ actual: "", nueva: "" });
  const [passMsg, setPassMsg] = useState<string | null>(null);

  useEffect(() => setLocal(ajustes), [ajustes]);

  async function guardar() {
    setMsg(null);
    const { error } = await supabase.from("ajustes").update({ ...local, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) return setMsg("No se pudo guardar: " + error.message);
    setAjustes(local);
    aplicarColores(local);
    setMsg("Colores actualizados.");
  }

  async function cambiarPassword(e: React.FormEvent) {
    e.preventDefault();
    setPassMsg(null);
    const { error } = await supabase.auth.updateUser({
      password: pass.nueva,
      // @ts-expect-error current_password es requerido por Lovable Cloud
      current_password: pass.actual,
    });
    setPassMsg(error ? "No se pudo cambiar: " + error.message : "Contraseña actualizada.");
    if (!error) setPass({ actual: "", nueva: "" });
  }

  return (
    <div className="mt-5 grid gap-5 md:grid-cols-2">
      <section className="surface p-5">
        <h2 className="text-lg font-semibold">Colores del colegio</h2>
        <div className="mt-4 grid gap-3">
          <label className="text-sm">
            Nombre del colegio
            <input className="field mt-1" value={local.nombre_colegio} onChange={(e) => setLocal({ ...local, nombre_colegio: e.target.value })} />
          </label>
          {([
            ["color_primario", "Color principal"],
            ["color_acento", "Color de acento"],
            ["color_secundario", "Color de fondo de tarjetas"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-3 text-sm">
              {label}
              <input
                type="color"
                className="h-9 w-16 rounded border border-border"
                value={local[key]}
                onChange={(e) => setLocal({ ...local, [key]: e.target.value })}
              />
            </label>
          ))}
          <button className="btn-primary mt-2" onClick={guardar}>Guardar colores</button>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        </div>
      </section>

      <section className="surface p-5">
        <h2 className="text-lg font-semibold">Cambiar contraseña de administración</h2>
        <form onSubmit={cambiarPassword} className="mt-4 grid gap-3">
          <label className="text-sm">
            Contraseña actual
            <input
              className="field mt-1"
              type="password"
              autoComplete="current-password"
              value={pass.actual}
              onChange={(e) => setPass({ ...pass, actual: e.target.value })}
              required
            />
          </label>
          <label className="text-sm">
            Nueva contraseña
            <input
              className="field mt-1"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={pass.nueva}
              onChange={(e) => setPass({ ...pass, nueva: e.target.value })}
              required
            />
          </label>
          <button className="btn-primary">Actualizar contraseña</button>
          {passMsg && <p className="text-sm text-muted-foreground">{passMsg}</p>}
        </form>
      </section>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
    </div>
  );
}

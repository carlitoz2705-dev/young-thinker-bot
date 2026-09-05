import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { useAjustes } from "@/lib/useAjustes";

export function SiteHeader() {
  const { session, isAdmin } = useAuth();
  const { ajustes } = useAjustes();
  const navigate = useNavigate();

  async function salir() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary font-bold text-primary-foreground">
            G
          </span>
          <span className="text-sm leading-tight">
            <span className="block font-semibold">Guía de Estudio</span>
            <span className="block text-xs text-muted-foreground">{ajustes.nombre_colegio}</span>
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link to="/primaria" className="rounded-md px-3 py-2 hover:bg-muted" activeProps={{ className: "font-semibold text-primary" }}>
            Primaria
          </Link>
          <Link to="/secundaria" className="rounded-md px-3 py-2 hover:bg-muted" activeProps={{ className: "font-semibold text-primary" }}>
            Secundaria
          </Link>
          {isAdmin && (
            <Link to="/admin" className="rounded-md px-3 py-2 hover:bg-muted" activeProps={{ className: "font-semibold text-primary" }}>
              Administración
            </Link>
          )}
          {session ? (
            <button onClick={salir} className="btn-ghost ml-2 text-sm">
              Cerrar sesión
            </button>
          ) : (
            <Link to="/auth" className="btn-primary ml-2 text-sm">
              Ingresar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

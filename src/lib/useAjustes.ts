import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Ajustes = {
  color_primario: string;
  color_secundario: string;
  color_acento: string;
  nombre_colegio: string;
};

export const AJUSTES_DEFAULT: Ajustes = {
  color_primario: "#c1121f",
  color_secundario: "#ffffff",
  color_acento: "#7a0c16",
  nombre_colegio: "I.E. Suizo",
};

export function aplicarColores(a: Ajustes) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--primary", a.color_primario);
  root.style.setProperty("--accent", a.color_acento);
  root.style.setProperty("--card", a.color_secundario);
}

export function useAjustes() {
  const [ajustes, setAjustes] = useState<Ajustes>(AJUSTES_DEFAULT);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("ajustes")
      .select("color_primario,color_secundario,color_acento,nombre_colegio")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        setAjustes(data as Ajustes);
        aplicarColores(data as Ajustes);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { ajustes, setAjustes };
}

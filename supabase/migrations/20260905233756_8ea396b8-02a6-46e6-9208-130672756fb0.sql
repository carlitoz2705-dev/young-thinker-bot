CREATE TYPE public.app_role AS ENUM ('admin','student');
CREATE TYPE public.nivel_edu AS ENUM ('primaria','secundaria');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text NOT NULL DEFAULT '',
  nivel public.nivel_edu,
  grado int,
  seccion text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete profile" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "roles select" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.consultas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nivel public.nivel_edu NOT NULL,
  grado int,
  materia text,
  pregunta text NOT NULL,
  respuesta text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.consultas TO authenticated;
GRANT ALL ON public.consultas TO service_role;
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consultas select" ON public.consultas FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "consultas insert" ON public.consultas FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE INDEX consultas_created_idx ON public.consultas (created_at DESC);

CREATE TABLE public.ajustes (
  id int PRIMARY KEY DEFAULT 1,
  color_primario text NOT NULL DEFAULT '#c1121f',
  color_secundario text NOT NULL DEFAULT '#ffffff',
  color_acento text NOT NULL DEFAULT '#7a0c16',
  nombre_colegio text NOT NULL DEFAULT 'I.E. Suizo',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ajustes_single_row CHECK (id = 1)
);
GRANT SELECT ON public.ajustes TO anon, authenticated;
GRANT INSERT, UPDATE ON public.ajustes TO authenticated;
GRANT ALL ON public.ajustes TO service_role;
ALTER TABLE public.ajustes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ajustes public read" ON public.ajustes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ajustes admin update" ON public.ajustes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.ajustes (id) VALUES (1);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, nivel, grado, seccion)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    NULLIF(NEW.raw_user_meta_data->>'nivel','')::public.nivel_edu,
    NULLIF(NEW.raw_user_meta_data->>'grado','')::int,
    NEW.raw_user_meta_data->>'seccion'
  )
  ON CONFLICT (id) DO NOTHING;

  IF lower(NEW.email) = 'admin@ie.suizo.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
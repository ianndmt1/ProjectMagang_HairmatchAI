-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'barber', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. BARBERSHOPS TABLE
CREATE TABLE IF NOT EXISTS public.barbershops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on barbershops
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;

-- 3. BARBERS TABLE
CREATE TABLE IF NOT EXISTS public.barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  specialty TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on barbers
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

-- 4. HAIRSTYLES TABLE (hairstyles library)
CREATE TABLE IF NOT EXISTS public.hairstyles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on hairstyles
ALTER TABLE public.hairstyles ENABLE ROW LEVEL SECURITY;

-- 5. FACE_ANALYSIS TABLE
CREATE TABLE IF NOT EXISTS public.face_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  photo_url TEXT,
  face_length NUMERIC(6, 2) NOT NULL,
  forehead_width NUMERIC(6, 2) NOT NULL,
  cheekbone_width NUMERIC(6, 2) NOT NULL,
  jaw_width NUMERIC(6, 2) NOT NULL,
  face_shape TEXT NOT NULL CHECK (face_shape IN ('oval', 'round', 'square', 'rectangle', 'heart', 'diamond', 'triangle')),
  confidence_score NUMERIC(5, 2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on face_analysis
ALTER TABLE public.face_analysis ENABLE ROW LEVEL SECURITY;

-- 6. RECOMMENDATIONS TABLE
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  face_shape TEXT NOT NULL CHECK (face_shape IN ('oval', 'round', 'square', 'rectangle', 'heart', 'diamond', 'triangle')),
  hairstyle_id UUID NOT NULL REFERENCES public.hairstyles(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (face_shape, hairstyle_id)
);

-- Enable RLS on recommendations
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- 7. SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (barber_id, day_of_week),
  CHECK (start_time < end_time)
);

-- Enable RLS on schedules
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- 8. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

----------------------------------------------------
-- DATABASE INDEXES (for query performance)
----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_barbers_barbershop_id ON public.barbers(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_barbers_profile_id ON public.barbers(profile_id);
CREATE INDEX IF NOT EXISTS idx_face_analysis_user_id ON public.face_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_face_shape ON public.recommendations(face_shape);
CREATE INDEX IF NOT EXISTS idx_schedules_barber_id ON public.schedules(barber_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_barber_id ON public.bookings(barber_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON public.bookings(booking_date, booking_time);

----------------------------------------------------
-- TRIGGER FOR PROFILE CREATION ON SIGN UP
----------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

----------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
----------------------------------------------------

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by authenticated users" 
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profiles" 
  ON public.profiles FOR UPDATE TO authenticated 
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Barbershops Policies
CREATE POLICY "Barbershops are viewable by anyone" 
  ON public.barbershops FOR SELECT USING (true);

CREATE POLICY "Only admin can manage barbershops" 
  ON public.barbershops FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Barbers Policies
CREATE POLICY "Barbers are viewable by anyone" 
  ON public.barbers FOR SELECT USING (true);

CREATE POLICY "Only admin can manage barbers" 
  ON public.barbers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Hairstyles Policies
CREATE POLICY "Hairstyles library is viewable by anyone" 
  ON public.hairstyles FOR SELECT USING (true);

CREATE POLICY "Only admin can manage hairstyles" 
  ON public.hairstyles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Face Analysis Policies
CREATE POLICY "Users can view their own face analysis" 
  ON public.face_analysis FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own face analysis" 
  ON public.face_analysis FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all face analyses" 
  ON public.face_analysis FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Recommendations Policies
CREATE POLICY "Recommendations are viewable by anyone" 
  ON public.recommendations FOR SELECT USING (true);

CREATE POLICY "Only admin can manage recommendations" 
  ON public.recommendations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Schedules Policies
CREATE POLICY "Schedules are viewable by anyone" 
  ON public.schedules FOR SELECT USING (true);

CREATE POLICY "Barber can manage their own schedule" 
  ON public.schedules FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.barbers b
      WHERE b.id = barber_id AND b.profile_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.barbers b
      WHERE b.id = barber_id AND b.profile_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Bookings Policies
CREATE POLICY "Customers can manage their own bookings" 
  ON public.bookings FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Barbers can view bookings assigned to them" 
  ON public.bookings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.barbers b
      WHERE b.id = barber_id AND b.profile_id = auth.uid()
    )
  );

CREATE POLICY "Barbers can update status of bookings assigned to them" 
  ON public.bookings FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.barbers b
      WHERE b.id = barber_id AND b.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.barbers b
      WHERE b.id = barber_id AND b.profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all bookings" 
  ON public.bookings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

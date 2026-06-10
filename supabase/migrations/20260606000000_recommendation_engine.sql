ALTER TABLE public.hairstyles
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS length TEXT CHECK (length IS NULL OR length IN ('short', 'medium', 'long')),
  ADD COLUMN IF NOT EXISTS maintenance_level TEXT CHECK (maintenance_level IS NULL OR maintenance_level IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS styling_time_minutes INTEGER CHECK (styling_time_minutes IS NULL OR styling_time_minutes >= 0),
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS face_shape_scores JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_hairstyles_slug ON public.hairstyles(slug);
CREATE INDEX IF NOT EXISTS idx_hairstyles_face_shape_scores ON public.hairstyles USING GIN (face_shape_scores);

ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'rule-based',
  ADD COLUMN IF NOT EXISTS score_formula_version TEXT NOT NULL DEFAULT 'mvp-rule-v1',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.recommendation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  face_analysis_id UUID REFERENCES public.face_analysis(id) ON DELETE SET NULL,
  face_shape TEXT NOT NULL CHECK (face_shape IN ('oval', 'round', 'square', 'rectangle', 'heart', 'diamond', 'triangle')),
  analysis_confidence NUMERIC(5, 2) CHECK (analysis_confidence IS NULL OR (analysis_confidence >= 0 AND analysis_confidence <= 100)),
  source TEXT NOT NULL DEFAULT 'rule-based',
  score_formula_version TEXT NOT NULL DEFAULT 'mvp-rule-v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.recommendation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_run_id UUID NOT NULL REFERENCES public.recommendation_runs(id) ON DELETE CASCADE,
  hairstyle_id UUID NOT NULL REFERENCES public.hairstyles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  reasoning TEXT NOT NULL,
  rank INTEGER NOT NULL CHECK (rank > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (recommendation_run_id, hairstyle_id),
  UNIQUE (recommendation_run_id, rank)
);

ALTER TABLE public.recommendation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_recommendation_runs_user_id ON public.recommendation_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_items_run_id ON public.recommendation_items(recommendation_run_id);

CREATE POLICY "Users can view their own recommendation runs"
  ON public.recommendation_runs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own recommendation runs"
  ON public.recommendation_runs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own recommendation items"
  ON public.recommendation_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.recommendation_runs rr
      WHERE rr.id = recommendation_run_id AND rr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items for their own recommendation runs"
  ON public.recommendation_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recommendation_runs rr
      WHERE rr.id = recommendation_run_id AND rr.user_id = auth.uid()
    )
  );

WITH seed(slug, name, description, length, maintenance_level, styling_time_minutes, tags, scores) AS (
  VALUES
    ('classic-side-part','Classic Side Part','Belahan samping rapi dengan volume ringan.','short','medium',8,ARRAY['classic','business','neat'],'{"oval":96,"round":86,"square":88,"rectangle":78,"heart":84,"diamond":58,"triangle":58}'::jsonb),
    ('textured-crop','Textured Crop','Crop pendek bertekstur yang modern.','short','low',5,ARRAY['textured','modern','low-maintenance'],'{"oval":92,"round":88,"square":90,"rectangle":74,"heart":58,"diamond":84,"triangle":58}'::jsonb),
    ('french-crop','French Crop','Fringe pendek dan sisi bersih.','short','low',4,ARRAY['crop','fringe','clean'],'{"oval":90,"round":58,"square":58,"rectangle":86,"heart":86,"diamond":84,"triangle":78}'::jsonb),
    ('crew-cut','Crew Cut','Potongan pendek praktis dengan atas sedikit panjang.','short','low',3,ARRAY['short','practical','clean'],'{"oval":92,"round":72,"square":90,"rectangle":58,"heart":58,"diamond":84,"triangle":82}'::jsonb),
    ('ivy-league','Ivy League','Crew cut panjang dengan styling samping.','short','medium',7,ARRAY['classic','smart','versatile'],'{"oval":96,"round":58,"square":88,"rectangle":82,"heart":86,"diamond":58,"triangle":82}'::jsonb),
    ('buzz-cut','Buzz Cut','Potongan sangat pendek yang menonjolkan garis wajah.','short','low',1,ARRAY['minimal','sharp','short'],'{"oval":88,"round":62,"square":92,"rectangle":58,"heart":58,"diamond":80,"triangle":78}'::jsonb),
    ('high-and-tight','High and Tight','Sisi sangat pendek dengan atas ringkas.','short','low',3,ARRAY['sharp','fade','masculine'],'{"oval":88,"round":76,"square":94,"rectangle":58,"heart":58,"diamond":82,"triangle":78}'::jsonb),
    ('low-fade-crop','Low Fade Crop','Crop pendek dengan fade rendah.','short','medium',5,ARRAY['fade','crop','balanced'],'{"oval":92,"round":88,"square":58,"rectangle":82,"heart":84,"diamond":84,"triangle":58}'::jsonb),
    ('mid-fade-quiff','Mid Fade Quiff','Quiff bervolume dengan fade sedang.','medium','medium',10,ARRAY['volume','fade','modern'],'{"oval":94,"round":92,"square":86,"rectangle":58,"heart":80,"diamond":58,"triangle":86}'::jsonb),
    ('high-fade-pompadour','High Fade Pompadour','Pompadour tinggi dengan sisi fade.','medium','high',15,ARRAY['volume','pompadour','statement'],'{"oval":94,"round":90,"square":88,"rectangle":70,"heart":58,"diamond":58,"triangle":86}'::jsonb),
    ('modern-pompadour','Modern Pompadour','Pompadour natural dengan tekstur lembut.','medium','high',14,ARRAY['pompadour','modern','volume'],'{"oval":95,"round":88,"square":86,"rectangle":58,"heart":82,"diamond":58,"triangle":86}'::jsonb),
    ('short-quiff','Short Quiff','Quiff pendek yang mudah distyling.','short','medium',7,ARRAY['quiff','volume','easy'],'{"oval":94,"round":90,"square":88,"rectangle":58,"heart":58,"diamond":84,"triangle":84}'::jsonb),
    ('messy-quiff','Messy Quiff','Quiff tekstur acak yang santai.','medium','medium',10,ARRAY['textured','casual','volume'],'{"oval":94,"round":88,"square":58,"rectangle":82,"heart":86,"diamond":88,"triangle":58}'::jsonb),
    ('side-swept-fringe','Side Swept Fringe','Fringe menyamping untuk melembutkan dahi.','medium','medium',9,ARRAY['fringe','soft','balanced'],'{"oval":90,"round":58,"square":80,"rectangle":88,"heart":92,"diamond":86,"triangle":58}'::jsonb),
    ('curtain-fringe','Curtain Fringe','Belahan tengah lembut untuk frame wajah.','medium','medium',10,ARRAY['fringe','korean','soft'],'{"oval":92,"round":58,"square":58,"rectangle":88,"heart":90,"diamond":90,"triangle":76}'::jsonb),
    ('two-block-cut','Two Block Cut','Sisi pendek dengan layer atas panjang.','medium','medium',9,ARRAY['korean','layered','modern'],'{"oval":94,"round":88,"square":58,"rectangle":86,"heart":90,"diamond":86,"triangle":58}'::jsonb),
    ('comma-hair','Comma Hair','Fringe melengkung halus dan clean.','medium','medium',10,ARRAY['korean','fringe','polished'],'{"oval":92,"round":82,"square":58,"rectangle":88,"heart":92,"diamond":88,"triangle":58}'::jsonb),
    ('slick-back','Slick Back','Rambut disisir ke belakang.','medium','high',12,ARRAY['classic','formal','sleek'],'{"oval":92,"round":58,"square":88,"rectangle":74,"heart":58,"diamond":84,"triangle":84}'::jsonb),
    ('textured-slick-back','Textured Slick Back','Slick back natural dengan tekstur.','medium','medium',11,ARRAY['textured','formal','natural'],'{"oval":94,"round":58,"square":88,"rectangle":58,"heart":82,"diamond":86,"triangle":84}'::jsonb),
    ('undercut','Undercut','Kontras sisi pendek dan atas panjang.','medium','medium',8,ARRAY['contrast','modern','bold'],'{"oval":90,"round":86,"square":88,"rectangle":70,"heart":58,"diamond":58,"triangle":86}'::jsonb),
    ('disconnected-undercut','Disconnected Undercut','Undercut dengan batas tegas.','medium','high',12,ARRAY['bold','contrast','statement'],'{"oval":88,"round":82,"square":88,"rectangle":68,"heart":58,"diamond":58,"triangle":86}'::jsonb),
    ('taper-fade','Taper Fade','Fade gradual yang rapi dan fleksibel.','short','medium',5,ARRAY['fade','clean','versatile'],'{"oval":96,"round":88,"square":90,"rectangle":84,"heart":86,"diamond":86,"triangle":86}'::jsonb),
    ('low-taper','Low Taper','Taper rendah yang subtle.','short','low',4,ARRAY['taper','subtle','clean'],'{"oval":94,"round":86,"square":88,"rectangle":86,"heart":86,"diamond":86,"triangle":58}'::jsonb),
    ('mid-taper','Mid Taper','Taper sedang yang seimbang.','short','medium',5,ARRAY['taper','balanced','modern'],'{"oval":94,"round":88,"square":90,"rectangle":58,"heart":86,"diamond":58,"triangle":86}'::jsonb),
    ('skin-fade','Skin Fade','Fade sampai kulit untuk hasil kontras.','short','high',6,ARRAY['fade','sharp','fresh'],'{"oval":88,"round":86,"square":92,"rectangle":58,"heart":58,"diamond":84,"triangle":84}'::jsonb),
    ('drop-fade','Drop Fade','Fade melengkung mengikuti belakang kepala.','short','medium',6,ARRAY['fade','dynamic','modern'],'{"oval":92,"round":88,"square":88,"rectangle":58,"heart":58,"diamond":88,"triangle":84}'::jsonb),
    ('burst-fade','Burst Fade','Fade melingkar di area telinga.','medium','medium',8,ARRAY['fade','curly','bold'],'{"oval":90,"round":86,"square":88,"rectangle":58,"heart":58,"diamond":90,"triangle":86}'::jsonb),
    ('faux-hawk','Faux Hawk','Volume tengah tanpa ekstrem mohawk penuh.','medium','medium',10,ARRAY['edgy','volume','modern'],'{"oval":88,"round":90,"square":86,"rectangle":68,"heart":58,"diamond":58,"triangle":86}'::jsonb),
    ('modern-mullet','Modern Mullet','Mullet modern dengan tekstur halus.','medium','medium',11,ARRAY['trendy','textured','statement'],'{"oval":86,"round":58,"square":84,"rectangle":58,"heart":84,"diamond":90,"triangle":88}'::jsonb),
    ('wolf-cut','Wolf Cut','Layer shaggy dengan volume atas.','long','medium',12,ARRAY['layered','shaggy','trendy'],'{"oval":88,"round":58,"square":78,"rectangle":86,"heart":90,"diamond":92,"triangle":58}'::jsonb),
    ('shaggy-layers','Shaggy Layers','Layer acak yang melembutkan garis wajah.','long','medium',12,ARRAY['layered','soft','texture'],'{"oval":90,"round":58,"square":82,"rectangle":88,"heart":88,"diamond":92,"triangle":58}'::jsonb),
    ('medium-layered','Medium Layered','Layer medium yang fleksibel.','medium','medium',10,ARRAY['layered','natural','versatile'],'{"oval":96,"round":58,"square":58,"rectangle":88,"heart":88,"diamond":90,"triangle":84}'::jsonb),
    ('bro-flow','Bro Flow','Rambut medium natural ke belakang.','medium','medium',9,ARRAY['natural','flow','medium'],'{"oval":94,"round":58,"square":82,"rectangle":86,"heart":86,"diamond":90,"triangle":58}'::jsonb),
    ('surfer-hair','Surfer Hair','Layer medium panjang dengan tekstur santai.','long','medium',10,ARRAY['casual','wavy','natural'],'{"oval":90,"round":58,"square":78,"rectangle":86,"heart":88,"diamond":90,"triangle":58}'::jsonb),
    ('man-bun','Man Bun','Rambut panjang diikat praktis.','long','medium',8,ARRAY['long','tied','practical'],'{"oval":88,"round":68,"square":86,"rectangle":58,"heart":58,"diamond":84,"triangle":82}'::jsonb),
    ('top-knot','Top Knot','Ikat atas dengan sisi lebih ringkas.','long','high',9,ARRAY['long','undercut','bold'],'{"oval":86,"round":70,"square":86,"rectangle":58,"heart":58,"diamond":82,"triangle":86}'::jsonb),
    ('curly-top-fade','Curly Top Fade','Ikal atas dengan sisi fade bersih.','medium','medium',9,ARRAY['curly','fade','volume'],'{"oval":92,"round":90,"square":88,"rectangle":58,"heart":86,"diamond":58,"triangle":88}'::jsonb),
    ('curly-fringe','Curly Fringe','Fringe ikal yang melembutkan dahi.','medium','medium',10,ARRAY['curly','fringe','soft'],'{"oval":90,"round":82,"square":58,"rectangle":90,"heart":92,"diamond":90,"triangle":58}'::jsonb),
    ('wavy-side-part','Wavy Side Part','Belahan samping dengan gelombang natural.','medium','medium',9,ARRAY['wavy','classic','natural'],'{"oval":96,"round":58,"square":86,"rectangle":86,"heart":86,"diamond":88,"triangle":58}'::jsonb),
    ('afro-taper','Afro Taper','Volume natural dengan taper bersih.','medium','medium',8,ARRAY['curly','natural','taper'],'{"oval":92,"round":86,"square":90,"rectangle":58,"heart":58,"diamond":88,"triangle":86}'::jsonb),
    ('caesar-cut','Caesar Cut','Fringe pendek rata yang ringkas.','short','low',4,ARRAY['short','fringe','classic'],'{"oval":88,"round":78,"square":84,"rectangle":90,"heart":86,"diamond":58,"triangle":58}'::jsonb),
    ('edgar-cut','Edgar Cut','Fringe garis tegas dengan sisi fade.','short','medium',6,ARRAY['sharp','fringe','modern'],'{"oval":84,"round":76,"square":88,"rectangle":82,"heart":58,"diamond":86,"triangle":58}'::jsonb),
    ('hard-part-fade','Hard Part Fade','Belahan razor tegas dengan fade.','short','high',8,ARRAY['sharp','fade','classic'],'{"oval":92,"round":88,"square":90,"rectangle":78,"heart":58,"diamond":58,"triangle":84}'::jsonb),
    ('comb-over-fade','Comb Over Fade','Comb over modern dengan fade.','short','medium',8,ARRAY['classic','fade','neat'],'{"oval":96,"round":88,"square":88,"rectangle":82,"heart":84,"diamond":58,"triangle":58}'::jsonb),
    ('brush-up','Brush Up','Rambut atas disisir naik.','medium','medium',9,ARRAY['volume','modern','casual'],'{"oval":92,"round":92,"square":86,"rectangle":72,"heart":58,"diamond":58,"triangle":86}'::jsonb),
    ('spiky-texture','Spiky Texture','Tekstur spike pendek yang memberi tinggi.','short','medium',7,ARRAY['texture','volume','youthful'],'{"oval":88,"round":90,"square":88,"rectangle":70,"heart":58,"diamond":58,"triangle":84}'::jsonb),
    ('short-afro','Short Afro','Afro pendek natural dan terkontrol.','short','medium',7,ARRAY['curly','natural','short'],'{"oval":90,"round":84,"square":88,"rectangle":58,"heart":58,"diamond":86,"triangle":86}'::jsonb),
    ('temple-fade','Temple Fade','Fade di area pelipis yang subtle.','short','medium',5,ARRAY['fade','clean','subtle'],'{"oval":92,"round":86,"square":88,"rectangle":58,"heart":86,"diamond":88,"triangle":58}'::jsonb),
    ('bowl-cut-modern','Modern Bowl Cut','Bowl cut modern dengan tekstur.','medium','medium',8,ARRAY['fringe','modern','soft'],'{"oval":84,"round":76,"square":58,"rectangle":88,"heart":88,"diamond":86,"triangle":58}'::jsonb),
    ('long-layered','Long Layered','Rambut panjang berlayer untuk frame wajah.','long','medium',12,ARRAY['long','layered','soft'],'{"oval":92,"round":58,"square":80,"rectangle":88,"heart":88,"diamond":90,"triangle":58}'::jsonb),
    ('side-part-taper','Side Part Taper','Side part klasik dengan taper halus.','short','low',6,ARRAY['classic','taper','daily'],'{"oval":96,"round":88,"square":90,"rectangle":84,"heart":86,"diamond":58,"triangle":84}'::jsonb),
    ('clean-scissor-cut','Clean Scissor Cut','Potongan gunting natural tanpa fade ekstrem.','medium','low',6,ARRAY['natural','classic','versatile'],'{"oval":98,"round":86,"square":88,"rectangle":88,"heart":88,"diamond":88,"triangle":86}'::jsonb)
)
INSERT INTO public.hairstyles (slug, name, description, image_url, length, maintenance_level, styling_time_minutes, tags, face_shape_scores)
SELECT slug, name, description, '/hairstyles/' || slug || '.jpg', length, maintenance_level, styling_time_minutes, tags, scores
FROM seed
ON CONFLICT (name) DO UPDATE SET
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  length = EXCLUDED.length,
  maintenance_level = EXCLUDED.maintenance_level,
  styling_time_minutes = EXCLUDED.styling_time_minutes,
  tags = EXCLUDED.tags,
  face_shape_scores = EXCLUDED.face_shape_scores;

INSERT INTO public.recommendations (face_shape, hairstyle_id, match_score, reasoning, source, score_formula_version, is_active)
SELECT
  shape.key,
  h.id,
  (shape.value)::int,
  h.name || ' cocok untuk wajah ' || shape.key || ' berdasarkan rule catalog MVP.',
  'rule-based',
  'mvp-rule-v1',
  true
FROM public.hairstyles h
CROSS JOIN LATERAL jsonb_each_text(h.face_shape_scores) AS shape(key, value)
WHERE (shape.value)::int >= 80
ON CONFLICT (face_shape, hairstyle_id) DO UPDATE SET
  match_score = EXCLUDED.match_score,
  reasoning = EXCLUDED.reasoning,
  source = EXCLUDED.source,
  score_formula_version = EXCLUDED.score_formula_version,
  is_active = EXCLUDED.is_active;

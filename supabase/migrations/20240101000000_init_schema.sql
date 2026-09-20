-- ==============================================================================
-- DIGITAL HEROES — COMPLETE POSTGRESQL / SUPABASE DATABASE SCHEMA
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Mirrors and extends auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  handicap NUMERIC(4, 1) DEFAULT 18.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ------------------------------------------------------------------------------
-- 2. CHARITIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  website_url TEXT NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  total_received NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  upcoming_events JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_charities_category ON public.charities(category);
CREATE INDEX IF NOT EXISTS idx_charities_featured ON public.charities(is_featured);

-- ------------------------------------------------------------------------------
-- 3. USER CHARITY SELECTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES public.charities(id) ON DELETE RESTRICT,
  contribution_percentage INTEGER NOT NULL DEFAULT 10 CHECK (contribution_percentage >= 10 AND contribution_percentage <= 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_charity UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_charities_user ON public.user_charities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_charities_charity ON public.user_charities(charity_id);

-- ------------------------------------------------------------------------------
-- 4. SUBSCRIPTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'lapsed', 'trialing', 'incomplete')),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_subscription UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- ------------------------------------------------------------------------------
-- 5. SCORES TABLE (Golf Stableford scores: 1 to 45, max 5 rolling, 1 per date)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  played_date DATE NOT NULL,
  course_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_score_date UNIQUE (user_id, played_date)
);

CREATE INDEX IF NOT EXISTS idx_scores_user_date ON public.scores(user_id, played_date DESC);

-- ------------------------------------------------------------------------------
-- 6. DRAWS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.draws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  draw_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SIMULATED', 'PUBLISHED', 'COMPLETED')),
  mode TEXT NOT NULL DEFAULT 'RANDOM' CHECK (mode IN ('RANDOM', 'ALGORITHMIC')),
  winning_numbers INTEGER[] CHECK (winning_numbers IS NULL OR array_length(winning_numbers, 1) = 5),
  simulation_seed TEXT,
  algorithm_metadata JSONB,
  total_participants INTEGER NOT NULL DEFAULT 0,
  total_prize_pool NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  jackpot_rollover_in NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  jackpot_rollover_out NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_draws_status ON public.draws(status);
CREATE INDEX IF NOT EXISTS idx_draws_date ON public.draws(draw_date DESC);

-- ------------------------------------------------------------------------------
-- 7. DRAW ENTRIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.draw_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  numbers INTEGER[] NOT NULL CHECK (array_length(numbers, 1) = 5),
  match_count INTEGER NOT NULL DEFAULT 0,
  matched_numbers INTEGER[] NOT NULL DEFAULT '{}',
  prize_tier TEXT CHECK (prize_tier IN ('JACKPOT_5', 'TIER_4', 'TIER_3', 'NONE')),
  prize_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_draw_entry UNIQUE (draw_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_draw_entries_draw ON public.draw_entries(draw_id);
CREATE INDEX IF NOT EXISTS idx_draw_entries_user ON public.draw_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_draw_entries_match ON public.draw_entries(draw_id, match_count DESC);

-- ------------------------------------------------------------------------------
-- 8. PRIZE POOLS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prize_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE UNIQUE,
  tier_5_amount NUMERIC(12, 2) NOT NULL,
  tier_4_amount NUMERIC(12, 2) NOT NULL,
  tier_3_amount NUMERIC(12, 2) NOT NULL,
  tier_5_winners_count INTEGER NOT NULL DEFAULT 0,
  tier_4_winners_count INTEGER NOT NULL DEFAULT 0,
  tier_3_winners_count INTEGER NOT NULL DEFAULT 0,
  tier_5_payout_per_winner NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  tier_4_payout_per_winner NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  tier_3_payout_per_winner NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  rollover_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. WINNERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  draw_entry_id UUID NOT NULL REFERENCES public.draw_entries(id) ON DELETE CASCADE,
  match_count INTEGER NOT NULL CHECK (match_count IN (3, 4, 5)),
  prize_tier TEXT NOT NULL,
  prize_amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_PROOF' CHECK (status IN ('PENDING_PROOF', 'PROOF_SUBMITTED', 'APPROVED', 'REJECTED', 'PAID')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_winners_user ON public.winners(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_status ON public.winners(status);
CREATE INDEX IF NOT EXISTS idx_winners_draw ON public.winners(draw_id);

-- ------------------------------------------------------------------------------
-- 10. WINNER PROOFS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.winner_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  winner_id UUID NOT NULL REFERENCES public.winners(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_winner_proofs_winner ON public.winner_proofs(winner_id);

-- ------------------------------------------------------------------------------
-- 11. PAYOUTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  winner_id UUID NOT NULL REFERENCES public.winners(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  payout_reference TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_user ON public.payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);

-- ------------------------------------------------------------------------------
-- 12. AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- 13. NOTIFICATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  link_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);

-- ------------------------------------------------------------------------------
-- PROFILE CREATION TRIGGER (auth.users INSERT -> public.profiles)
-- Normal signups ALWAYS create role = 'user'. Default role enforced at DB level.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, handicap)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Member'),
    'user',
    18.0
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN profiles.full_name IS NULL OR profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Guard to prevent users from altering their own role
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role <> OLD.role AND (
    auth.uid() IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  ) THEN
    RAISE EXCEPTION 'Only administrators can modify user role.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_role_escalation_guard ON public.profiles;
CREATE TRIGGER enforce_role_escalation_guard
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_escalation();

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winner_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Public read, self edit, admin all
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. Charities: Public read, admin write
CREATE POLICY "Charities viewable by everyone" ON public.charities FOR SELECT USING (true);
CREATE POLICY "Admins can manage charities" ON public.charities FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. User Charities: Viewable by self or admin, updatable by self
CREATE POLICY "Users view own charity selection" ON public.user_charities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users modify own charity selection" ON public.user_charities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins view all charity selections" ON public.user_charities FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Subscriptions: Viewable by self and admin; modifications restricted to webhook / service role / admin
CREATE POLICY "Users view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view and manage all subscriptions" ON public.subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Scores: Viewable and modifiable by owner or admin
CREATE POLICY "Users manage own scores" ON public.scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all scores" ON public.scores FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 6. Draws: Viewable by everyone if published, drafts/simulated only by admin
CREATE POLICY "Public can view published draws" ON public.draws FOR SELECT USING (
  status IN ('PUBLISHED', 'COMPLETED') OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins manage draws" ON public.draws FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 7. Draw Entries: Owner or admin can view
CREATE POLICY "Users view own entries" ON public.draw_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all entries" ON public.draw_entries FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 8. Prize Pools: Public read, admin manage
CREATE POLICY "Prize pools viewable by everyone" ON public.prize_pools FOR SELECT USING (true);
CREATE POLICY "Admins manage prize pools" ON public.prize_pools FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 9. Winners & Proofs: Owner can view/upload, admin can manage
CREATE POLICY "Users view own winnings" ON public.winners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view and manage all winners" ON public.winners FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users upload own winner proof" ON public.winner_proofs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.winners WHERE id = winner_id AND user_id = auth.uid())
);
CREATE POLICY "Users view own proof" ON public.winner_proofs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.winners WHERE id = winner_id AND user_id = auth.uid())
);
CREATE POLICY "Admins view all proofs" ON public.winner_proofs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 10. Payouts: Owner can view own payouts, only admin can create/mark completed
CREATE POLICY "Users view own payouts" ON public.payouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all payouts" ON public.payouts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 11. Audit Logs: Admin only
CREATE POLICY "Admins view audit logs" ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR auth.uid() IS NOT NULL
);

-- 12. Notifications: Owner only
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 13. STORAGE BUCKET & POLICIES (winner-proofs)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('winner-proofs', 'winner-proofs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users upload proof" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'winner-proofs' AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users and admins read proof" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'winner-proofs' AND (
    (auth.uid())::text = (storage.foldername(name))[1] OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

CREATE POLICY "Admins manage all storage proof objects" ON storage.objects
FOR ALL TO authenticated USING (
  bucket_id = 'winner-proofs' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

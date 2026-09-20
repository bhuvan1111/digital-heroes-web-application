-- ==============================================================================
-- DIGITAL HEROES — SEED DATA SCRIPT (POSTGRESQL / SUPABASE)
-- ==============================================================================

-- 1. CHARITIES SEED
INSERT INTO public.charities (id, name, slug, tagline, description, category, location, website_url, banner_url, is_featured, total_received)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Veterans on Course', 'veterans-on-course',
   'Empowering wounded and transitioning veterans through adaptive golf & camaraderie.',
   'Veterans on Course provides physical rehabilitation, mental wellness workshops, and social connection for military service personnel recovering from physical trauma and PTSD.',
   'Veterans & Mental Health', 'San Diego, California', 'https://veteransoncourse.org',
   'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200', true, 48500.00),

  ('c0000000-0000-0000-0000-000000000002', 'Fore The Planet', 'fore-the-planet',
   'Rewilding golf corridors into biodiversity sanctuaries and carbon sinks.',
   'Dedicated to transforming course perimeters into native pollinator corridors, planting indigenous trees, and restoring wetlands across partner courses.',
   'Environment & Climate', 'Edinburgh, Scotland', 'https://foretheplanet.eco',
   'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200', true, 39200.00),

  ('c0000000-0000-0000-0000-000000000003', 'Youth Fairways Foundation', 'youth-fairways-foundation',
   'Unlocking scholarships, character leadership, and athletics for underserved youth.',
   'Opening doors for first-generation student-athletes from underrepresented backgrounds with full academic mentoring and collegiate pathway coaching.',
   'Youth & Education', 'Chicago, Illinois', 'https://youthfairways.org',
   'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=1200', true, 62000.00)
ON CONFLICT (id) DO NOTHING;

-- 2. DRAWS SEED
INSERT INTO public.draws (id, draw_number, title, draw_date, status, mode, winning_numbers, total_participants, total_prize_pool, jackpot_rollover_in, jackpot_rollover_out, published_at)
VALUES
  ('d0000000-0000-0000-0000-000000000101', 101, 'April 2024 Founders Draw',
   '2024-04-30 18:00:00+00', 'PUBLISHED', 'RANDOM', ARRAY[14, 22, 33, 36, 41], 184, 12500.00, 0.00, 5000.00, '2024-04-30 18:05:00+00'),

  ('d0000000-0000-0000-0000-000000000102', 102, 'May 2024 Championship Draw',
   '2024-05-31 18:00:00+00', 'PUBLISHED', 'ALGORITHMIC', ARRAY[33, 35, 36, 38, 41], 236, 16800.00, 5000.00, 0.00, '2024-05-31 18:05:00+00'),

  ('d0000000-0000-0000-0000-000000000103', 103, 'Summer Solstice Draw 2024',
   '2025-06-30 18:00:00+00', 'DRAFT', 'ALGORITHMIC', NULL, 289, 21500.00, 0.00, 0.00, NULL)
ON CONFLICT (id) DO NOTHING;

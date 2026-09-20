export type Role = 'user' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: Role;
  handicap?: number;
  created_at: string;
  updated_at: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  description?: string;
  target_amount?: number;
}

export interface Charity {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  location: string;
  website_url: string;
  logo_url?: string | null;
  banner_url?: string | null;
  is_featured: boolean;
  total_received: number;
  upcoming_events: UpcomingEvent[];
  created_at: string;
  updated_at: string;
}

export interface UserCharity {
  id: string;
  user_id: string;
  charity_id: string;
  contribution_percentage: number; // >= 10
  updated_at: string;
  charity?: Charity;
}

export type PlanType = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'lapsed' | 'trialing' | 'incomplete';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id?: string | null;
  plan: PlanType;
  status: SubscriptionStatus;
  amount_cents: number;
  currency: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface GolfScore {
  id: string;
  user_id: string;
  score: number; // 1 to 45
  played_date: string; // YYYY-MM-DD
  course_name?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type DrawStatus = 'DRAFT' | 'SIMULATED' | 'PUBLISHED' | 'COMPLETED';
export type DrawMode = 'RANDOM' | 'ALGORITHMIC';

export interface AlgorithmMetadata {
  description: string;
  total_participant_scores: number;
  unique_score_values: number;
  seed?: string;
  weights_summary?: Record<number, number>;
  generated_at: string;
}

export interface Draw {
  id: string;
  draw_number: number;
  title: string;
  draw_date: string;
  status: DrawStatus;
  mode: DrawMode;
  winning_numbers?: number[] | null; // 5 numbers
  simulation_seed?: string | null;
  algorithm_metadata?: AlgorithmMetadata | null;
  total_participants: number;
  total_prize_pool: number;
  jackpot_rollover_in: number;
  jackpot_rollover_out: number;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type PrizeTier = 'JACKPOT_5' | 'TIER_4' | 'TIER_3' | 'NONE';

export interface DrawEntry {
  id: string;
  draw_id: string;
  user_id: string;
  numbers: number[]; // 5 numbers
  match_count: number;
  matched_numbers: number[];
  prize_tier: PrizeTier;
  prize_amount: number;
  created_at: string;
  user?: UserProfile;
}

export interface PrizePool {
  id: string;
  draw_id: string;
  tier_5_amount: number;
  tier_4_amount: number;
  tier_3_amount: number;
  tier_5_winners_count: number;
  tier_4_winners_count: number;
  tier_3_winners_count: number;
  tier_5_payout_per_winner: number;
  tier_4_payout_per_winner: number;
  tier_3_payout_per_winner: number;
  rollover_amount: number;
  created_at: string;
}

export type WinnerStatus = 'PENDING_PROOF' | 'PROOF_SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID';

export interface WinnerProof {
  id: string;
  winner_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  notes?: string | null;
  uploaded_at: string;
}

export interface Winner {
  id: string;
  draw_id: string;
  user_id: string;
  draw_entry_id: string;
  match_count: number;
  prize_tier: PrizeTier;
  prize_amount: number;
  status: WinnerStatus;
  admin_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
  draw?: Draw;
  user?: UserProfile;
  proofs?: WinnerProof[];
}

export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Payout {
  id: string;
  winner_id: string;
  user_id: string;
  amount: number;
  status: PayoutStatus;
  payment_method: string;
  payout_reference?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id?: string | null;
  admin_email?: string | null;
  action: string;
  entity: string;
  entity_id?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  link_url?: string | null;
  created_at: string;
}

export interface DrawSimulationResult {
  drawId: string;
  mode: DrawMode;
  winningNumbers: number[];
  seed?: string;
  totalParticipants: number;
  totalPrizePool: number;
  jackpotRolloverIn: number;
  jackpotRolloverOut: number;
  tier5Winners: DrawEntry[];
  tier4Winners: DrawEntry[];
  tier3Winners: DrawEntry[];
  tier5PayoutPerWinner: number;
  tier4PayoutPerWinner: number;
  tier3PayoutPerWinner: number;
  allEntries: DrawEntry[];
  algorithmMetadata?: AlgorithmMetadata;
}

export interface FinancialBreakdown {
  planAmountCents: number;
  charityPercentage: number;
  charityAmountCents: number;
  prizePoolAmountCents: number;
  platformAmountCents: number;
  formatted: {
    planAmount: string;
    charityAmount: string;
    prizePoolAmount: string;
    platformAmount: string;
  };
}

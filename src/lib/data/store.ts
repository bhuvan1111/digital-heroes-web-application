import {
  Charity,
  Draw,
  DrawMode,
  DrawSimulationResult,
  GolfScore,
  Subscription,
  UserCharity,
  UserProfile,
  Winner,
  WinnerProof,
  AuditLog,
  DrawEntry,
} from "@/types";
import { ScoreService } from "../services/score-service";
import { DrawEngine } from "../services/draw-engine";
import { WinnerService } from "../services/winner-service";
import { FinancialService } from "../services/financial-service";

import { createClient } from "../supabase/client";

/**
 * Universal client resolver.
 * Backed by Supabase client for reliable isomorphic database operations.
 */
async function getSupabase() {
  return createClient();
}

/**
 * Production DataStore repository backed directly by Supabase PostgreSQL.
 * All mutations and queries run directly against Supabase tables with error propagation.
 */
export class DataStore {
  // --------------------------------------------------------------------------
  // AUTH & USER PROFILES
  // --------------------------------------------------------------------------

  /**
   * Retrieves the currently authenticated user's profile from Supabase Auth + profiles table.
   * Returns null if unauthenticated.
   */
  public static async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const supabase = await getSupabase();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return null;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profile) {
        return null;
      }

      return profile as UserProfile;
    } catch {
      return null;
    }
  }

  public static async getUserById(id: string): Promise<UserProfile | null> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as UserProfile | null;
  }

  public static async getAllUsers(): Promise<UserProfile[]> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as UserProfile[];
  }

  public static async updateUser(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as UserProfile;
  }

  // --------------------------------------------------------------------------
  // CHARITIES
  // --------------------------------------------------------------------------

  public static async getCharities(): Promise<Charity[]> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("charities")
      .select("*")
      .order("name");

    if (error) throw new Error(error.message);
    return (data || []) as Charity[];
  }

  public static async getFeaturedCharities(): Promise<Charity[]> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("charities")
      .select("*")
      .eq("is_featured", true)
      .order("name");

    if (error) throw new Error(error.message);
    return (data || []) as Charity[];
  }

  public static async getCharityById(id: string): Promise<Charity | null> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("charities")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as Charity | null;
  }

  public static async getCharityBySlug(slug: string): Promise<Charity | null> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("charities")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as Charity | null;
  }

  public static async createCharity(
    data: Omit<Charity, "id" | "created_at" | "updated_at">,
    adminId?: string
  ): Promise<Charity> {
    const supabase = await getSupabase();
    const newCharity = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: created, error } = await supabase
      .from("charities")
      .insert(newCharity)
      .select()
      .single();

    if (error) throw new Error(error.message);

    await this.logAudit({
      adminId,
      action: "CHARITY_CREATED",
      entity: "charities",
      entityId: created.id,
      metadata: { name: created.name, category: created.category },
    });

    return created as Charity;
  }

  public static async updateCharity(
    id: string,
    updates: Partial<Charity>,
    adminId?: string
  ): Promise<Charity> {
    const supabase = await getSupabase();
    const { data: updated, error } = await supabase
      .from("charities")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    await this.logAudit({
      adminId,
      action: "CHARITY_UPDATED",
      entity: "charities",
      entityId: id,
      metadata: { changes: Object.keys(updates) },
    });

    return updated as Charity;
  }

  public static async deleteCharity(id: string, adminId?: string): Promise<boolean> {
    const supabase = await getSupabase();
    const { error } = await supabase.from("charities").delete().eq("id", id);

    if (error) throw new Error(error.message);

    await this.logAudit({
      adminId,
      action: "CHARITY_DELETED",
      entity: "charities",
      entityId: id,
      metadata: { id },
    });

    return true;
  }

  // --------------------------------------------------------------------------
  // USER CHARITY SELECTION
  // --------------------------------------------------------------------------

  public static async getUserCharity(
    userId: string
  ): Promise<{ userCharity?: UserCharity; charity?: Charity }> {
    const supabase = await getSupabase();
    const { data: uc, error } = await supabase
      .from("user_charities")
      .select("*, charity:charities(*)")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!uc) return {};

    const charity = uc.charity as Charity | undefined;
    return { userCharity: uc as UserCharity, charity };
  }

  public static async setUserCharity(
    userId: string,
    charityId: string,
    contributionPercentage: number
  ): Promise<UserCharity> {
    const validPct = Math.max(10, Math.min(100, contributionPercentage));
    const supabase = await getSupabase();

    const payload = {
      user_id: userId,
      charity_id: charityId,
      contribution_percentage: validPct,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("user_charities")
      .upsert(payload, { onConflict: "user_id" })
      .select("*, charity:charities(*)")
      .single();

    if (error) throw new Error(error.message);
    return data as UserCharity;
  }

  // --------------------------------------------------------------------------
  // SUBSCRIPTIONS
  // --------------------------------------------------------------------------

  public static async getUserSubscription(userId: string): Promise<Subscription | null> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as Subscription | null;
  }

  public static async getAllSubscriptions(): Promise<Subscription[]> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as Subscription[];
  }

  public static async isActiveSubscriber(userId: string): Promise<boolean> {
    const sub = await this.getUserSubscription(userId);
    return !!sub && sub.status === "active";
  }

  /**
   * Secure server-side synchronization for Stripe webhook processing.
   * Upserts the actual Stripe subscription event data into PostgreSQL.
   */
  public static async syncSubscriptionFromStripe(payload: {
    userId?: string;
    stripeCustomerId: string;
    stripeSubscriptionId?: string | null;
    plan: "monthly" | "yearly";
    status: "active" | "canceled" | "past_due" | "lapsed" | "trialing" | "incomplete";
    amountCents: number;
    currency?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  }): Promise<Subscription> {
    const supabase = await getSupabase();

    let targetUserId = payload.userId;
    if (!targetUserId) {
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", payload.stripeCustomerId)
        .maybeSingle();
      targetUserId = existing?.user_id;
    }

    if (!targetUserId) {
      throw new Error(`Cannot sync Stripe subscription: no user mapped to customer ${payload.stripeCustomerId}`);
    }

    const record = {
      user_id: targetUserId,
      stripe_customer_id: payload.stripeCustomerId,
      stripe_subscription_id: payload.stripeSubscriptionId || null,
      plan: payload.plan,
      status: payload.status,
      amount_cents: payload.amountCents,
      currency: payload.currency || "usd",
      current_period_start: payload.currentPeriodStart || new Date().toISOString(),
      current_period_end: payload.currentPeriodEnd || new Date(Date.now() + (payload.plan === "yearly" ? 365 : 30) * 86400000).toISOString(),
      cancel_at_period_end: payload.cancelAtPeriodEnd || false,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("subscriptions")
      .upsert(record, { onConflict: "user_id" })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Subscription;
  }

  // --------------------------------------------------------------------------
  // SCORES (Rolling 5 Stableford Scores)
  // --------------------------------------------------------------------------

  public static async getUserScores(userId: string): Promise<GolfScore[]> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", userId)
      .order("played_date", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as GolfScore[];
  }

  public static async getAllScores(): Promise<GolfScore[]> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("scores")
      .select("*")
      .order("played_date", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as GolfScore[];
  }

  public static async addScore(
    userId: string,
    score: number,
    playedDate: string,
    courseName?: string | null,
    notes?: string | null
  ): Promise<{ success: boolean; scores: GolfScore[]; error?: string }> {
    const currentScores = await this.getUserScores(userId);

    const result = ScoreService.processRollingScore(currentScores, {
      userId,
      score,
      playedDate,
      courseName,
      notes,
    });

    if (!result.success) {
      return { success: false, scores: currentScores, error: result.error };
    }

    const supabase = await getSupabase();

    // If rolling over 5th score, delete the oldest
    if (result.removedScoreId) {
      const { error: delError } = await supabase
        .from("scores")
        .delete()
        .eq("id", result.removedScoreId);

      if (delError) throw new Error(delError.message);
    }

    const newScore = {
      id: crypto.randomUUID(),
      user_id: userId,
      score: Number(score),
      played_date: playedDate,
      course_name: courseName || null,
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: insError } = await supabase.from("scores").insert(newScore);
    if (insError) throw new Error(insError.message);

    const refreshed = await this.getUserScores(userId);
    return { success: true, scores: refreshed };
  }

  public static async updateScore(
    userId: string,
    scoreId: string,
    score: number,
    playedDate: string,
    courseName?: string | null,
    notes?: string | null
  ): Promise<{ success: boolean; scores: GolfScore[]; error?: string }> {
    const currentScores = await this.getUserScores(userId);

    const result = ScoreService.updateScore(currentScores, scoreId, {
      score,
      playedDate,
      courseName,
      notes,
    });

    if (!result.success) {
      return { success: false, scores: currentScores, error: result.error };
    }

    const supabase = await getSupabase();
    const { error } = await supabase
      .from("scores")
      .update({
        score: Number(score),
        played_date: playedDate,
        course_name: courseName || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", scoreId);

    if (error) throw new Error(error.message);

    const refreshed = await this.getUserScores(userId);
    return { success: true, scores: refreshed };
  }

  public static async deleteScore(
    userId: string,
    scoreId: string
  ): Promise<{ success: boolean; scores: GolfScore[]; error?: string }> {
    const supabase = await getSupabase();
    const { error } = await supabase.from("scores").delete().eq("id", scoreId);

    if (error) throw new Error(error.message);

    const refreshed = await this.getUserScores(userId);
    return { success: true, scores: refreshed };
  }

  // --------------------------------------------------------------------------
  // DRAWS & SIMULATION
  // --------------------------------------------------------------------------

  public static async getDraws(): Promise<Draw[]> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("draws")
      .select("*")
      .order("draw_date", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as Draw[];
  }

  public static async getDrawById(id: string): Promise<Draw | null> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("draws")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as Draw | null;
  }

  public static async getLatestPublishedDraw(): Promise<Draw | null> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("draws")
      .select("*")
      .in("status", ["PUBLISHED", "COMPLETED"])
      .order("draw_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as Draw | null;
  }

  public static async getUpcomingDraw(): Promise<Draw | null> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("draws")
      .select("*")
      .in("status", ["DRAFT", "SIMULATED"])
      .order("draw_date", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as Draw | null;
  }

  public static async createDraw(
    data: {
      title: string;
      drawDate: string;
      mode: DrawMode;
      totalPrizePool: number;
      jackpotRolloverIn?: number;
    },
    adminId?: string
  ): Promise<Draw> {
    const supabase = await getSupabase();
    const existingDraws = await this.getDraws();
    const nextNumber = Math.max(...existingDraws.map((d) => d.draw_number), 100) + 1;
    const activeSubs = (await this.getAllSubscriptions()).filter((s) => s.status === "active");

    const newDraw: Draw = {
      id: crypto.randomUUID(),
      draw_number: nextNumber,
      title: data.title,
      draw_date: data.drawDate,
      status: "DRAFT",
      mode: data.mode,
      winning_numbers: null,
      total_participants: activeSubs.length,
      total_prize_pool: data.totalPrizePool,
      jackpot_rollover_in: data.jackpotRolloverIn || 0,
      jackpot_rollover_out: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: created, error } = await supabase
      .from("draws")
      .insert(newDraw)
      .select()
      .single();

    if (error) throw new Error(error.message);

    await this.logAudit({
      adminId,
      action: "DRAW_CREATED",
      entity: "draws",
      entityId: created.id,
      metadata: { draw_number: nextNumber, mode: data.mode },
    });

    return created as Draw;
  }

  /**
   * Pure in-memory simulation using live participant data from Supabase.
   * Does not mutate database state until published.
   */
  public static async simulateDraw(
    drawId: string,
    mode?: DrawMode,
    seed?: string
  ): Promise<DrawSimulationResult> {
    const draw = await this.getDrawById(drawId);
    if (!draw) throw new Error("Draw not found");

    const activeSubs = (await this.getAllSubscriptions()).filter((s) => s.status === "active");
    const allScores = await this.getAllScores();

    const participants = activeSubs.map((sub) => {
      const uScores = allScores.filter((s) => s.user_id === sub.user_id);
      let numbers = uScores.map((s) => s.score);
      if (numbers.length < 5) {
        const fill = [10, 20, 30, 40, 45].slice(numbers.length);
        numbers = [...numbers, ...fill];
      }
      return {
        userId: sub.user_id,
        numbers: numbers.slice(0, 5),
        scores: uScores,
      };
    });

    return DrawEngine.simulateDraw({
      draw,
      participants,
      mode: mode || draw.mode,
      seed: seed || `sim-${draw.id}-${Date.now()}`,
      allParticipantScores: allScores,
    });
  }

  /**
   * Commits and publishes official draw results to Supabase.
   */
  public static async publishDraw(
    drawId: string,
    simResult: DrawSimulationResult,
    adminId?: string
  ): Promise<Draw> {
    const supabase = await getSupabase();
    const publishedAt = new Date().toISOString();

    const { error: drawError } = await supabase
      .from("draws")
      .update({
        status: "PUBLISHED",
        winning_numbers: simResult.winningNumbers,
        published_at: publishedAt,
        mode: simResult.mode,
        simulation_seed: simResult.seed,
        total_participants: simResult.totalParticipants,
        jackpot_rollover_out: simResult.jackpotRolloverOut,
        updated_at: publishedAt,
      })
      .eq("id", drawId);

    if (drawError) throw new Error(drawError.message);

    // 1. Persist draw participant entries
    if (simResult.allEntries && simResult.allEntries.length > 0) {
      const entryRecords = simResult.allEntries.map((e) => ({
        id: e.id,
        draw_id: drawId,
        user_id: e.user_id,
        numbers: e.numbers,
        match_count: e.match_count,
        matched_numbers: e.matched_numbers,
        prize_tier: e.prize_tier,
        prize_amount: e.prize_amount,
        created_at: publishedAt,
      }));

      const { error: entriesError } = await supabase
        .from("draw_entries")
        .upsert(entryRecords, { onConflict: "draw_id,user_id" });
      if (entriesError) throw new Error(entriesError.message);
    }

    // 2. Persist prize pool allocation
    const poolCalcs = DrawEngine.calculatePrizePool(
      simResult.totalPrizePool,
      simResult.jackpotRolloverIn,
      simResult.tier5Winners.length,
      simResult.tier4Winners.length,
      simResult.tier3Winners.length
    );

    const { error: poolError } = await supabase
      .from("prize_pools")
      .upsert(
        {
          draw_id: drawId,
          tier_5_amount: poolCalcs.tier5Pool,
          tier_4_amount: poolCalcs.tier4Pool,
          tier_3_amount: poolCalcs.tier3Pool,
          tier_5_winners_count: simResult.tier5Winners.length,
          tier_4_winners_count: simResult.tier4Winners.length,
          tier_3_winners_count: simResult.tier3Winners.length,
          tier_5_payout_per_winner: poolCalcs.tier5PayoutPerWinner,
          tier_4_payout_per_winner: poolCalcs.tier4PayoutPerWinner,
          tier_3_payout_per_winner: poolCalcs.tier3PayoutPerWinner,
          rollover_amount: poolCalcs.jackpotRolloverOut,
          created_at: publishedAt,
        },
        { onConflict: "draw_id" }
      );
    if (poolError) throw new Error(poolError.message);

    // 3. Persist official winners
    const allWinners = [
      ...simResult.tier5Winners,
      ...simResult.tier4Winners,
      ...simResult.tier3Winners,
    ];

    if (allWinners.length > 0) {
      const records = allWinners.map((entry) => ({
        id: crypto.randomUUID(),
        draw_id: drawId,
        user_id: entry.user_id,
        draw_entry_id: entry.id,
        match_count: entry.match_count,
        prize_tier: entry.prize_tier,
        prize_amount: entry.prize_amount,
        status: "PENDING_PROOF",
        created_at: publishedAt,
        updated_at: publishedAt,
      }));

      const { error: winError } = await supabase.from("winners").insert(records);
      if (winError) throw new Error(winError.message);
    }

    await this.logAudit({
      adminId,
      action: "DRAW_PUBLISHED",
      entity: "draws",
      entityId: drawId,
      metadata: {
        winning_numbers: simResult.winningNumbers,
        winner_count: allWinners.length,
        rollover: simResult.jackpotRolloverOut,
      },
    });

    const refreshed = await this.getDrawById(drawId);
    return refreshed!;
  }

  // --------------------------------------------------------------------------
  // WINNERS & PROOFS
  // --------------------------------------------------------------------------

  public static async getWinners(status?: string): Promise<Winner[]> {
    const supabase = await getSupabase();
    let query = supabase
      .from("winners")
      .select("*, user:profiles(*), draw:draws(*)")
      .order("created_at", { ascending: false });

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as Winner[];
  }

  public static async getUserWinners(userId: string): Promise<Winner[]> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("winners")
      .select("*, draw:draws(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as Winner[];
  }

  public static async getWinnerById(winnerId: string): Promise<Winner | null> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("winners")
      .select("*, user:profiles(*), draw:draws(*)")
      .eq("id", winnerId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as Winner | null;
  }

  public static async submitWinnerProof(
    winnerId: string,
    proofData: {
      fileUrl: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      notes?: string;
    }
  ): Promise<Winner> {
    const winner = await this.getWinnerById(winnerId);
    if (!winner) throw new Error("Winner record not found");

    const res = WinnerService.submitProof(winner, proofData);
    if (!res.success) {
      throw new Error(res.error || "Failed to validate proof");
    }

    const supabase = await getSupabase();

    const { error: proofError } = await supabase.from("winner_proofs").insert({
      id: crypto.randomUUID(),
      winner_id: winnerId,
      file_url: proofData.fileUrl,
      file_name: proofData.fileName,
      file_size: proofData.fileSize,
      mime_type: proofData.mimeType,
      notes: proofData.notes || null,
      uploaded_at: new Date().toISOString(),
    });

    if (proofError) throw new Error(proofError.message);

    const { data: updated, error: winError } = await supabase
      .from("winners")
      .update({
        status: "PROOF_SUBMITTED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", winnerId)
      .select("*, user:profiles(*), draw:draws(*)")
      .single();

    if (winError) throw new Error(winError.message);
    return updated as Winner;
  }

  public static async approveWinner(
    winnerId: string,
    adminId: string,
    notes?: string
  ): Promise<Winner> {
    const winner = await this.getWinnerById(winnerId);
    if (!winner) throw new Error("Winner record not found");

    const res = WinnerService.approveWinner(winner, adminId, notes);
    if (!res.success) {
      throw new Error(res.error || "Failed to approve winner");
    }

    const supabase = await getSupabase();

    const { data: updated, error } = await supabase
      .from("winners")
      .update({
        status: "APPROVED",
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        admin_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", winnerId)
      .select("*, user:profiles(*), draw:draws(*)")
      .single();

    if (error) throw new Error(error.message);

    await this.logAudit({
      adminId,
      action: "WINNER_APPROVED",
      entity: "winners",
      entityId: winnerId,
      metadata: { prize_amount: winner.prize_amount, notes },
    });

    return updated as Winner;
  }

  public static async rejectWinner(
    winnerId: string,
    adminId: string,
    reason: string
  ): Promise<Winner> {
    const winner = await this.getWinnerById(winnerId);
    if (!winner) throw new Error("Winner record not found");

    const res = WinnerService.rejectWinner(winner, adminId, reason);
    if (!res.success) {
      throw new Error(res.error || "Failed to reject winner");
    }

    const supabase = await getSupabase();

    const { data: updated, error } = await supabase
      .from("winners")
      .update({
        status: "REJECTED",
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        admin_notes: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", winnerId)
      .select("*, user:profiles(*), draw:draws(*)")
      .single();

    if (error) throw new Error(error.message);

    await this.logAudit({
      adminId,
      action: "WINNER_REJECTED",
      entity: "winners",
      entityId: winnerId,
      metadata: { reason },
    });

    return updated as Winner;
  }

  public static async markWinnerPaid(
    winnerId: string,
    adminId: string,
    paymentRef: string
  ): Promise<Winner> {
    const winner = await this.getWinnerById(winnerId);
    if (!winner) throw new Error("Winner record not found");

    const res = WinnerService.markPaid(winner, adminId, paymentRef);
    if (!res.success) {
      throw new Error(res.error || "Failed to mark payout as paid");
    }

    const supabase = await getSupabase();
    const paidAt = new Date().toISOString();

    const { data: updated, error: winError } = await supabase
      .from("winners")
      .update({
        status: "PAID",
        paid_at: paidAt,
        updated_at: paidAt,
      })
      .eq("id", winnerId)
      .select("*, user:profiles(*), draw:draws(*)")
      .single();

    if (winError) throw new Error(winError.message);

    const { error: payError } = await supabase.from("payouts").insert({
      id: crypto.randomUUID(),
      winner_id: winnerId,
      user_id: winner.user_id,
      amount: winner.prize_amount,
      status: "COMPLETED",
      payment_method: "bank_transfer",
      payout_reference: paymentRef,
      completed_at: paidAt,
      created_at: paidAt,
    });

    if (payError) throw new Error(payError.message);

    await this.logAudit({
      adminId,
      action: "PAYOUT_COMPLETED",
      entity: "winners",
      entityId: winnerId,
      metadata: { payment_ref: paymentRef, amount: winner.prize_amount },
    });

    return updated as Winner;
  }

  // --------------------------------------------------------------------------
  // AUDIT LOGS
  // --------------------------------------------------------------------------

  public static async getAuditLogs(): Promise<AuditLog[]> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as AuditLog[];
  }

  public static async logAudit(entry: {
    adminId?: string;
    adminEmail?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    try {
      const supabase = await getSupabase();
      const log = {
        id: crypto.randomUUID(),
        admin_id: entry.adminId || null,
        action: entry.action,
        entity: entry.entity,
        entity_id: entry.entityId || null,
        metadata: entry.metadata,
        created_at: new Date().toISOString(),
      };
      await supabase.from("audit_logs").insert(log);
    } catch {
      // Audit log failures should not break primary operations
    }
  }

  // --------------------------------------------------------------------------
  // EXECUTIVE & USER ANALYTICS
  // --------------------------------------------------------------------------

  public static async getAdminAnalytics() {
    const [usersList, subs, charitiesList, drawsList, winnersList] = await Promise.all([
      this.getAllUsers(),
      this.getAllSubscriptions(),
      this.getCharities(),
      this.getDraws(),
      this.getWinners(),
    ]);

    const activeSubs = subs.filter((s) => s.status === "active");
    const totalCharityContributions = charitiesList.reduce((acc, c) => acc + Number(c.total_received || 0), 0);
    const totalPrizePool = drawsList.reduce((acc, d) => acc + Number(d.total_prize_pool || 0), 0);
    const completedPayoutsTotal = winnersList
      .filter((w) => w.status === "PAID")
      .reduce((acc, w) => acc + Number(w.prize_amount || 0), 0);
    const pendingWinners = winnersList.filter(
      (w) => w.status === "PENDING_PROOF" || w.status === "PROOF_SUBMITTED"
    ).length;

    const mrr = activeSubs.reduce((acc, s) => {
      return acc + (s.plan === "monthly" ? s.amount_cents / 100 : (s.amount_cents / 100) / 12);
    }, 0);

    const charityDistribution = charitiesList.map((c) => ({
      name: c.name,
      amount: c.total_received || 0,
    }));

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dates: Date[] = [];
    drawsList.forEach((dr) => dr.draw_date && dates.push(new Date(dr.draw_date)));
    subs.forEach((s) => s.created_at && dates.push(new Date(s.created_at)));
    const referenceDate = dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : new Date();

    const monthlyGrowth = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - (5 - i), 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthLabel = monthNames[d.getMonth()];

      const subscribers = subs.filter((s) => {
        if (!s.created_at) return false;
        const createdAt = new Date(s.created_at);
        return createdAt <= end && (s.status === "active" || s.status === "past_due");
      }).length;

      const monthlyDraws = drawsList.filter((dr) => {
        const drawDate = new Date(dr.draw_date);
        return drawDate >= start && drawDate <= end;
      });

      const prizePool = monthlyDraws.reduce((acc, dr) => acc + Number(dr.total_prize_pool || 0), 0);
      const charityDonated = monthlyDraws.reduce(
        (acc, dr) => acc + Math.round(Number(dr.total_prize_pool || 0) * 0.25),
        0
      );

      return {
        month: monthLabel,
        subscribers: Math.max(subscribers, activeSubs.length > 0 ? Math.min(i + 1, activeSubs.length) : 0),
        charityDonated,
        prizePool: Math.round(prizePool),
      };
    });

    return {
      totalUsers: usersList.length,
      activeSubscribers: activeSubs.length,
      activeSubscribersCount: activeSubs.length,
      mrr,
      monthlyRecurringRevenue: mrr,
      totalCharityContributions,
      totalDonatedToCharities: totalCharityContributions,
      totalPrizePool,
      totalPrizesAwarded: completedPayoutsTotal,
      totalDrawsConducted: drawsList.length,
      pendingWinners,
      pendingProofsCount: pendingWinners,
      completedPayoutsTotal,
      charityDistribution,
      monthlyGrowth,
    };
  }

  public static async getUserAnalytics(userId: string) {
    const [userScores, userWinners, sub, uCharity] = await Promise.all([
      this.getUserScores(userId),
      this.getUserWinners(userId),
      this.getUserSubscription(userId),
      this.getUserCharity(userId),
    ]);

    const totalWon = userWinners.reduce((acc, w) => acc + Number(w.prize_amount || 0), 0);
    const charityPct = uCharity.userCharity?.contribution_percentage || 10;
    const subAmount = (sub?.amount_cents || 3900) / 100;
    const monthlyCharityContribution = (subAmount * charityPct) / 100;

    return {
      scoresCount: userScores.length,
      bestScore: userScores.length > 0 ? Math.max(...userScores.map((s) => s.score)) : 0,
      averageScore:
        userScores.length > 0
          ? Math.round((userScores.reduce((acc, s) => acc + s.score, 0) / userScores.length) * 10) / 10
          : 0,
      totalWon,
      monthlyCharityContribution,
      charityName: uCharity.charity?.name || "None Selected",
      subscriptionStatus: sub?.status || "inactive",
    };
  }
}

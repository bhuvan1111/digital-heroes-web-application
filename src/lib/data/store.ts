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
import {
  DEMO_AUDIT_LOGS,
  DEMO_CHARITIES,
  DEMO_DRAWS,
  DEMO_SCORES,
  DEMO_SUBSCRIPTIONS,
  DEMO_USERS,
  DEMO_USER_CHARITIES,
  DEMO_WINNERS,
} from "./mock-data";
import { ScoreService } from "../services/score-service";
import { DrawEngine } from "../services/draw-engine";
import { WinnerService } from "../services/winner-service";
import { FinancialService } from "../services/financial-service";
import { createClient } from "../supabase/client";

// In-memory data repository initialized from seed data
let users: UserProfile[] = [...DEMO_USERS];
let charities: Charity[] = [...DEMO_CHARITIES];
let userCharities: UserCharity[] = [...DEMO_USER_CHARITIES];
let subscriptions: Subscription[] = [...DEMO_SUBSCRIPTIONS];
let scores: GolfScore[] = [...DEMO_SCORES];
let draws: Draw[] = [...DEMO_DRAWS];
let winners: Winner[] = [...DEMO_WINNERS];
let auditLogs: AuditLog[] = [...DEMO_AUDIT_LOGS];

// Current authenticated session in memory (defaults to subscriber Marcus Vance)
let activeUser: UserProfile = users[1]; // user@digitalheroes.golf

export class DataStore {
  // --------------------------------------------------------------------------
  // AUTH & USERS
  // --------------------------------------------------------------------------
  public static getCurrentUser(): UserProfile {
    return activeUser;
  }

  public static setCurrentUser(user: UserProfile) {
    activeUser = user;
  }

  public static switchDemoRole(role: "user" | "admin"): UserProfile {
    const found = users.find((u) => u.role === role);
    if (found) {
      activeUser = found;
    }
    return activeUser;
  }

  public static loginWithEmail(email: string, role?: "user" | "admin"): UserProfile {
    let found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      const isA = role === "admin" || email.includes("admin");
      found = {
        id: crypto.randomUUID(),
        email,
        full_name: email.split("@")[0].replace(/[._]/g, " ").toUpperCase(),
        role: isA ? "admin" : "user",
        handicap: 18.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      users.push(found);
    }
    activeUser = found;

    // Asynchronously synchronize session with Supabase Auth & PostgreSQL
    try {
      if (typeof window !== "undefined") {
        const supabase = createClient();
        Promise.resolve(
          supabase.auth.signInWithPassword({
            email: found.email,
            password: "UserPassword123!",
          })
        )
          .then(({ error }) => {
            if (error) {
              return Promise.resolve(
                supabase.auth.signUp({
                  email: found!.email,
                  password: "UserPassword123!",
                  options: { data: { full_name: found!.full_name, role: found!.role } },
                })
              );
            }
          })
          .catch(() => {});
        Promise.resolve(supabase.from("profiles").upsert(found)).catch(() => {});
      }
    } catch {}


    return activeUser;
  }

  public static signupUser(data: {
    fullName: string;
    email: string;
    charityId: string;
    contributionPercentage: number;
  }): { user: UserProfile; userCharity: UserCharity } {
    const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error("An account with this email address already exists.");
    }

    const newUser: UserProfile = {
      id: crypto.randomUUID(),
      email: data.email,
      full_name: data.fullName,
      role: "user", // Normal signup can NEVER be admin
      handicap: 18.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    users.push(newUser);

    const validPct = Math.max(10, Math.min(100, data.contributionPercentage));
    const newUc: UserCharity = {
      id: crypto.randomUUID(),
      user_id: newUser.id,
      charity_id: data.charityId,
      contribution_percentage: validPct,
      updated_at: new Date().toISOString(),
    };
    userCharities.push(newUc);

    // Create default active trial subscription
    const newSub: Subscription = {
      id: crypto.randomUUID(),
      user_id: newUser.id,
      stripe_customer_id: `cus_${newUser.id.slice(0, 8)}`,
      plan: "monthly",
      status: "active",
      amount_cents: 3900,
      currency: "usd",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      cancel_at_period_end: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    subscriptions.push(newSub);

    activeUser = newUser;

    // Persist to Supabase PostgreSQL & Auth
    try {
      if (typeof window !== "undefined") {
        const supabase = createClient();
        Promise.resolve(
          supabase.auth.signUp({
            email: newUser.email,
            password: "UserPassword123!",
            options: { data: { full_name: newUser.full_name, role: "user" } },
          })
        ).catch(() => {});

        Promise.resolve(supabase.from("profiles").upsert(newUser)).catch(() => {});
        Promise.resolve(supabase.from("user_charities").upsert(newUc)).catch(() => {});
        Promise.resolve(supabase.from("subscriptions").upsert(newSub)).catch(() => {});
      }
    } catch {}


    return { user: newUser, userCharity: newUc };
  }


  public static getUserById(id: string): UserProfile | undefined {
    return users.find((u) => u.id === id);
  }

  public static getAllUsers(params?: {
    query?: string;
    role?: string;
    page?: number;
    limit?: number;
  }): { users: UserProfile[]; total: number } {
    let list = [...users];

    if (params?.role && params.role !== "all") {
      list = list.filter((u) => u.role === params.role);
    }
    if (params?.query) {
      const q = params.query.toLowerCase();
      list = list.filter(
        (u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }

    const total = list.length;
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return { users: paginated, total };
  }

  public static updateUser(
    id: string,
    data: Partial<Pick<UserProfile, "full_name" | "handicap" | "avatar_url">>
  ): UserProfile {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error("User not found");

    users[idx] = {
      ...users[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };
    if (activeUser.id === id) {
      activeUser = users[idx];
    }
    return users[idx];
  }

  // --------------------------------------------------------------------------
  // CHARITIES
  // --------------------------------------------------------------------------
  public static getCharities(query?: string, category?: string): Charity[] {
    let list = [...charities];
    if (category && category !== "All") {
      list = list.filter((c) => c.category.toLowerCase() === category.toLowerCase());
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.tagline.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q)
      );
    }
    return list;
  }

  public static getFeaturedCharities(): Charity[] {
    return charities.filter((c) => c.is_featured);
  }

  public static getCharityById(idOrSlug: string): Charity | undefined {
    return charities.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
  }

  public static createCharity(
    data: Omit<Charity, "id" | "total_received" | "created_at" | "updated_at">,
    adminId?: string
  ): Charity {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const newCharity: Charity = {
      id: crypto.randomUUID(),
      ...data,
      slug,
      total_received: 0,
      upcoming_events: data.upcoming_events || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    charities.unshift(newCharity);

    this.logAudit({
      adminId,
      action: "CHARITY_CREATED",
      entity: "charities",
      entityId: newCharity.id,
      metadata: { name: newCharity.name, category: newCharity.category },
    });

    return newCharity;
  }

  public static updateCharity(
    id: string,
    data: Partial<Charity>,
    adminId?: string
  ): Charity {
    const idx = charities.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Charity not found");

    charities[idx] = {
      ...charities[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };

    this.logAudit({
      adminId,
      action: "CHARITY_UPDATED",
      entity: "charities",
      entityId: id,
      metadata: { changes: Object.keys(data) },
    });

    return charities[idx];
  }

  public static deleteCharity(id: string, adminId?: string): boolean {
    const idx = charities.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    const deleted = charities[idx];
    charities = charities.filter((c) => c.id !== id);

    this.logAudit({
      adminId,
      action: "CHARITY_DELETED",
      entity: "charities",
      entityId: id,
      metadata: { name: deleted.name },
    });

    return true;
  }

  // --------------------------------------------------------------------------
  // USER CHARITY SELECTION
  // --------------------------------------------------------------------------
  public static getUserCharity(userId: string): { userCharity?: UserCharity; charity?: Charity } {
    const uc = userCharities.find((u) => u.user_id === userId);
    if (!uc) return {};
    const ch = charities.find((c) => c.id === uc.charity_id);
    return { userCharity: uc, charity: ch };
  }

  public static setUserCharity(
    userId: string,
    charityId: string,
    contributionPercentage: number
  ): UserCharity {
    const validPct = Math.max(10, Math.min(100, contributionPercentage));
    const ch = charities.find((c) => c.id === charityId);
    if (!ch) throw new Error("Selected charity does not exist");

    const idx = userCharities.findIndex((u) => u.user_id === userId);
    if (idx !== -1) {
      userCharities[idx] = {
        ...userCharities[idx],
        charity_id: charityId,
        contribution_percentage: validPct,
        updated_at: new Date().toISOString(),
      };
      if (typeof window !== "undefined") {
        try {
          const supabase = createClient();
          Promise.resolve(supabase.from("user_charities").upsert(userCharities[idx])).catch(() => {});
        } catch {}
      }
      return userCharities[idx];
    } else {
      const created: UserCharity = {
        id: crypto.randomUUID(),
        user_id: userId,
        charity_id: charityId,
        contribution_percentage: validPct,
        updated_at: new Date().toISOString(),
      };
      userCharities.push(created);
      if (typeof window !== "undefined") {
        try {
          const supabase = createClient();
          Promise.resolve(supabase.from("user_charities").upsert(created)).catch(() => {});
        } catch {}
      }
      return created;
    }
  }

  // --------------------------------------------------------------------------
  // SUBSCRIPTIONS
  // --------------------------------------------------------------------------
  public static getUserSubscription(userId: string): Subscription | undefined {
    return subscriptions.find((s) => s.user_id === userId);
  }

  public static getAllSubscriptions(): Subscription[] {
    return [...subscriptions];
  }

  public static isActiveSubscriber(userId: string): boolean {
    const sub = this.getUserSubscription(userId);
    return !!sub && sub.status === "active";
  }

  public static updateSubscriptionPlan(userId: string, plan: "monthly" | "yearly"): Subscription {
    const idx = subscriptions.findIndex((s) => s.user_id === userId);
    const amount = plan === "monthly" ? 3900 : 39000;
    if (idx !== -1) {
      subscriptions[idx] = {
        ...subscriptions[idx],
        plan,
        amount_cents: amount,
        updated_at: new Date().toISOString(),
      };
      if (typeof window !== "undefined") {
        try {
          const supabase = createClient();
          Promise.resolve(supabase.from("subscriptions").upsert(subscriptions[idx])).catch(() => {});
        } catch {}
      }
      return subscriptions[idx];
    } else {
      const created: Subscription = {
        id: crypto.randomUUID(),
        user_id: userId,
        stripe_customer_id: `cus_${userId.slice(0, 8)}`,
        plan,
        status: "active",
        amount_cents: amount,
        currency: "usd",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        cancel_at_period_end: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      subscriptions.push(created);
      if (typeof window !== "undefined") {
        try {
          const supabase = createClient();
          Promise.resolve(supabase.from("subscriptions").upsert(created)).catch(() => {});
        } catch {}
      }
      return created;
    }
  }



  // --------------------------------------------------------------------------
  // SCORES (Rolling 5 scores)
  // --------------------------------------------------------------------------
  public static getUserScores(userId: string): GolfScore[] {
    return scores
      .filter((s) => s.user_id === userId)
      .sort((a, b) => new Date(b.played_date).getTime() - new Date(a.played_date).getTime());
  }

  public static getAllScores(): GolfScore[] {
    return [...scores].sort(
      (a, b) => new Date(b.played_date).getTime() - new Date(a.played_date).getTime()
    );
  }

  public static addScore(
    userId: string,
    score: number,
    playedDate: string,
    courseName?: string | null,
    notes?: string | null
  ): { success: boolean; scores: GolfScore[]; error?: string } {
    const userScores = this.getUserScores(userId);
    const result = ScoreService.processRollingScore(userScores, {
      userId,
      score,
      playedDate,
      courseName,
      notes,
    });

    if (!result.success) {
      return { success: false, scores: userScores, error: result.error };
    }

    // Update global scores table: remove old score if rolled over, add new
    if (result.removedScoreId) {
      scores = scores.filter((s) => s.id !== result.removedScoreId);
      if (typeof window !== "undefined") {
        try {
          const supabase = createClient();
          Promise.resolve(supabase.from("scores").delete().eq("id", result.removedScoreId)).catch(() => {});
        } catch {}
      }
    }
    // Find newly added item in result.scores
    const addedItem = result.scores.find((s) => !userScores.some((old) => old.id === s.id));
    if (addedItem) {
      scores.push(addedItem);
      if (typeof window !== "undefined") {
        try {
          const supabase = createClient();
          Promise.resolve(supabase.from("scores").insert(addedItem)).catch(() => {});
        } catch {}
      }
    }

    return { success: true, scores: result.scores };
  }

  public static updateScore(
    userId: string,
    scoreId: string,
    score: number,
    playedDate: string,
    courseName?: string | null,
    notes?: string | null
  ): { success: boolean; scores: GolfScore[]; error?: string } {
    const userScores = this.getUserScores(userId);
    const result = ScoreService.updateScore(userScores, scoreId, {
      score,
      playedDate,
      courseName,
      notes,
    });

    if (!result.success) {
      return { success: false, scores: userScores, error: result.error };
    }

    // Update global scores table
    scores = scores.map((s) => {
      const updated = result.scores.find((u) => u.id === s.id);
      return updated || s;
    });

    if (typeof window !== "undefined") {
      try {
        const supabase = createClient();
        Promise.resolve(supabase.from("scores").update({
          score: Number(score),
          played_date: playedDate,
          course_name: courseName || null,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        }).eq("id", scoreId)).catch(() => {});
      } catch {}
    }

    return { success: true, scores: result.scores };
  }

  public static deleteScore(userId: string, scoreId: string): { success: boolean; scores: GolfScore[]; error?: string } {
    const userScores = this.getUserScores(userId);
    const result = ScoreService.deleteScore(userScores, scoreId);

    if (!result.success) {
      return { success: false, scores: userScores, error: result.error };
    }

    scores = scores.filter((s) => s.id !== scoreId);

    if (typeof window !== "undefined") {
      try {
        const supabase = createClient();
        Promise.resolve(supabase.from("scores").delete().eq("id", scoreId)).catch(() => {});
      } catch {}
    }

    return { success: true, scores: result.scores };
  }


  // --------------------------------------------------------------------------
  // DRAWS & SIMULATION
  // --------------------------------------------------------------------------
  public static getDraws(): Draw[] {
    return [...draws].sort(
      (a, b) => new Date(b.draw_date).getTime() - new Date(a.draw_date).getTime()
    );
  }

  public static getDrawById(id: string): Draw | undefined {
    return draws.find((d) => d.id === id);
  }

  public static getLatestPublishedDraw(): Draw | undefined {
    return draws
      .filter((d) => d.status === "PUBLISHED" || d.status === "COMPLETED")
      .sort((a, b) => new Date(b.draw_date).getTime() - new Date(a.draw_date).getTime())[0];
  }

  public static getUpcomingDraw(): Draw | undefined {
    return (
      draws.find((d) => d.status === "DRAFT" || d.status === "SIMULATED") ||
      draws.find((d) => new Date(d.draw_date) > new Date())
    );
  }

  public static createDraw(data: {
    title: string;
    drawDate: string;
    mode: DrawMode;
    totalPrizePool: number;
    jackpotRolloverIn?: number;
  }, adminId?: string): Draw {
    const nextNumber = Math.max(...draws.map((d) => d.draw_number), 100) + 1;
    const newDraw: Draw = {
      id: crypto.randomUUID(),
      draw_number: nextNumber,
      title: data.title,
      draw_date: data.drawDate,
      status: "DRAFT",
      mode: data.mode,
      winning_numbers: null,
      total_participants: subscriptions.filter((s) => s.status === "active").length,
      total_prize_pool: data.totalPrizePool,
      jackpot_rollover_in: data.jackpotRolloverIn || 0,
      jackpot_rollover_out: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    draws.unshift(newDraw);

    this.logAudit({
      adminId,
      action: "DRAW_CREATED",
      entity: "draws",
      entityId: newDraw.id,
      metadata: { draw_number: nextNumber, mode: data.mode },
    });

    return newDraw;
  }

  /**
   * Runs an in-memory simulation for a draw using current active participants.
   * DOES NOT modify published draw state or create permanent winners.
   */
  public static simulateDraw(drawId: string, mode?: DrawMode, seed?: string): DrawSimulationResult {
    const draw = this.getDrawById(drawId);
    if (!draw) throw new Error("Draw not found");

    // Gather active subscriber participants
    const activeSubscribers = subscriptions.filter((s) => s.status === "active");
    const participants = activeSubscribers.map((sub) => {
      const uScores = this.getUserScores(sub.user_id);
      // Use 5 scores, or pad if fewer
      let numbers = uScores.map((s) => s.score);
      if (numbers.length < 5) {
        // Deterministic default filler for testing
        const fill = [10, 20, 30, 40, 45].slice(numbers.length);
        numbers = [...numbers, ...fill];
      }
      return {
        userId: sub.user_id,
        numbers: numbers.slice(0, 5),
        scores: uScores,
      };
    });

    const result = DrawEngine.simulateDraw({
      draw,
      participants,
      mode: mode || draw.mode,
      seed: seed || `sim-${draw.id}-${Date.now()}`,
      allParticipantScores: scores,
    });

    // Update draw status to SIMULATED if it was DRAFT
    if (draw.status === "DRAFT") {
      draw.status = "SIMULATED";
      draw.simulation_seed = result.seed;
      draw.updated_at = new Date().toISOString();
    }

    return result;
  }

  /**
   * Commits and publishes an official draw result.
   */
  public static publishDraw(
    drawId: string,
    simResult: DrawSimulationResult,
    adminId?: string
  ): Draw {
    const idx = draws.findIndex((d) => d.id === drawId);
    if (idx === -1) throw new Error("Draw not found");

    const targetDraw = draws[idx];
    targetDraw.status = "PUBLISHED";
    targetDraw.winning_numbers = simResult.winningNumbers;
    targetDraw.published_at = new Date().toISOString();
    targetDraw.mode = simResult.mode;
    targetDraw.simulation_seed = simResult.seed;
    targetDraw.algorithm_metadata = simResult.algorithmMetadata || null;
    targetDraw.total_participants = simResult.totalParticipants;
    targetDraw.jackpot_rollover_out = simResult.jackpotRolloverOut;
    targetDraw.updated_at = new Date().toISOString();

    // Create winner records
    const allWinners = [
      ...simResult.tier5Winners,
      ...simResult.tier4Winners,
      ...simResult.tier3Winners,
    ];

    allWinners.forEach((entry) => {
      const newWinner: Winner = {
        id: crypto.randomUUID(),
        draw_id: drawId,
        user_id: entry.user_id,
        draw_entry_id: entry.id,
        match_count: entry.match_count,
        prize_tier: entry.prize_tier,
        prize_amount: entry.prize_amount,
        status: "PENDING_PROOF",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      winners.unshift(newWinner);
      if (typeof window !== "undefined") {
        try {
          const supabase = createClient();
          Promise.resolve(supabase.from("winners").insert(newWinner)).catch(() => {});
        } catch {}
      }
    });

    if (typeof window !== "undefined") {
      try {
        const supabase = createClient();
        Promise.resolve(supabase.from("draws").update({
          status: "PUBLISHED",
          winning_numbers: targetDraw.winning_numbers,
          published_at: targetDraw.published_at,
          mode: targetDraw.mode,
          simulation_seed: targetDraw.simulation_seed,
          total_participants: targetDraw.total_participants,
          jackpot_rollover_out: targetDraw.jackpot_rollover_out,
          updated_at: new Date().toISOString(),
        }).eq("id", drawId)).catch(() => {});
      } catch {}
    }

    this.logAudit({
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

    return targetDraw;
  }

  // --------------------------------------------------------------------------
  // WINNERS & PROOFS
  // --------------------------------------------------------------------------
  public static getWinners(status?: string): Winner[] {
    let list = [...winners];
    if (status && status !== "ALL") {
      list = list.filter((w) => w.status === status);
    }
    // Enrich with user and draw details
    return list.map((w) => ({
      ...w,
      user: users.find((u) => u.id === w.user_id),
      draw: draws.find((d) => d.id === w.draw_id),
    }));
  }

  public static getUserWinners(userId: string): Winner[] {
    return winners
      .filter((w) => w.user_id === userId)
      .map((w) => ({
        ...w,
        draw: draws.find((d) => d.id === w.draw_id),
      }));
  }

  public static getWinnerById(winnerId: string): Winner | undefined {
    const w = winners.find((win) => win.id === winnerId);
    if (!w) return undefined;
    return {
      ...w,
      user: users.find((u) => u.id === w.user_id),
      draw: draws.find((d) => d.id === w.draw_id),
    };
  }

  public static submitWinnerProof(
    winnerId: string,
    proofData: {
      fileUrl: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      notes?: string;
    }
  ): Winner {
    const w = winners.find((win) => win.id === winnerId);
    if (!w) throw new Error("Winner record not found");

    const res = WinnerService.submitProof(w, proofData);
    if (!res.success || !res.winner) {
      throw new Error(res.error || "Failed to submit proof");
    }

    const idx = winners.findIndex((win) => win.id === winnerId);
    winners[idx] = res.winner;

    if (typeof window !== "undefined") {
      try {
        const supabase = createClient();
        Promise.resolve(supabase.from("winner_proofs").insert({
          id: crypto.randomUUID(),
          winner_id: winnerId,
          file_url: proofData.fileUrl,
          file_name: proofData.fileName,
          file_size: proofData.fileSize,
          mime_type: proofData.mimeType,
          notes: proofData.notes || null,
          uploaded_at: new Date().toISOString(),
        })).catch(() => {});
        Promise.resolve(supabase.from("winners").update({
          status: "PROOF_SUBMITTED",
          updated_at: new Date().toISOString(),
        }).eq("id", winnerId)).catch(() => {});
      } catch {}
    }

    return res.winner;
  }

  public static approveWinner(winnerId: string, adminId: string, notes?: string): Winner {
    const w = winners.find((win) => win.id === winnerId);
    if (!w) throw new Error("Winner record not found");

    const res = WinnerService.approveWinner(w, adminId, notes);
    if (!res.success || !res.winner) {
      throw new Error(res.error || "Failed to approve winner");
    }

    const idx = winners.findIndex((win) => win.id === winnerId);
    winners[idx] = res.winner;

    if (typeof window !== "undefined") {
      try {
        const supabase = createClient();
        Promise.resolve(supabase.from("winners").update({
          status: "APPROVED",
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes || null,
          updated_at: new Date().toISOString(),
        }).eq("id", winnerId)).catch(() => {});
      } catch {}
    }

    this.logAudit({
      adminId,
      action: "WINNER_APPROVED",
      entity: "winners",
      entityId: winnerId,
      metadata: { prize_amount: w.prize_amount, notes },
    });

    return res.winner;
  }

  public static rejectWinner(winnerId: string, adminId: string, reason: string): Winner {
    const w = winners.find((win) => win.id === winnerId);
    if (!w) throw new Error("Winner record not found");

    const res = WinnerService.rejectWinner(w, adminId, reason);
    if (!res.success || !res.winner) {
      throw new Error(res.error || "Failed to reject winner");
    }

    const idx = winners.findIndex((win) => win.id === winnerId);
    winners[idx] = res.winner;

    if (typeof window !== "undefined") {
      try {
        const supabase = createClient();
        Promise.resolve(supabase.from("winners").update({
          status: "REJECTED",
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          admin_notes: reason,
          updated_at: new Date().toISOString(),
        }).eq("id", winnerId)).catch(() => {});
      } catch {}
    }

    this.logAudit({
      adminId,
      action: "WINNER_REJECTED",
      entity: "winners",
      entityId: winnerId,
      metadata: { reason },
    });

    return res.winner;
  }

  public static markWinnerPaid(winnerId: string, adminId: string, paymentRef: string): Winner {
    const w = winners.find((win) => win.id === winnerId);
    if (!w) throw new Error("Winner record not found");

    const res = WinnerService.markPaid(w, adminId, paymentRef);
    if (!res.success || !res.winner) {
      throw new Error(res.error || "Failed to mark payout as paid");
    }

    const idx = winners.findIndex((win) => win.id === winnerId);
    winners[idx] = res.winner;

    if (typeof window !== "undefined") {
      try {
        const supabase = createClient();
        Promise.resolve(supabase.from("winners").update({
          status: "PAID",
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", winnerId)).catch(() => {});

        Promise.resolve(supabase.from("payouts").insert({
          id: crypto.randomUUID(),
          winner_id: winnerId,
          user_id: w.user_id,
          amount: w.prize_amount,
          status: "COMPLETED",
          payment_method: "bank_transfer",
          payout_reference: paymentRef,
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })).catch(() => {});
      } catch {}
    }

    this.logAudit({
      adminId,
      action: "PAYOUT_COMPLETED",
      entity: "winners",
      entityId: winnerId,
      metadata: { payment_ref: paymentRef, amount: w.prize_amount },
    });

    return res.winner;
  }


  // --------------------------------------------------------------------------
  // AUDIT LOGS
  // --------------------------------------------------------------------------
  public static getAuditLogs(): AuditLog[] {
    return [...auditLogs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public static logAudit(entry: {
    adminId?: string;
    adminEmail?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata: Record<string, unknown>;
  }) {
    const log: AuditLog = {
      id: crypto.randomUUID(),
      admin_id: entry.adminId || activeUser?.id,
      admin_email: entry.adminEmail || activeUser?.email,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId,
      metadata: entry.metadata,
      created_at: new Date().toISOString(),
    };
    auditLogs.unshift(log);
  }

  // --------------------------------------------------------------------------
  // ADMIN ANALYTICS & REPORTS
  // --------------------------------------------------------------------------
  public static getAdminAnalytics() {
    const totalUsers = users.length;
    const activeSubscribers = subscriptions.filter((s) => s.status === "active").length;

    // Calculate MRR from active subscriptions: monthly amount + yearly amount/12
    const mrr = subscriptions
      .filter((s) => s.status === "active")
      .reduce((acc, sub) => {
        const monthlyValue = sub.plan === "monthly" ? sub.amount_cents / 100 : (sub.amount_cents / 100) / 12;
        return acc + monthlyValue;
      }, 0);

    const totalPrizePool = draws.reduce((acc, d) => acc + Number(d.total_prize_pool), 0);
    const totalCharityContributions = charities.reduce((acc, c) => acc + Number(c.total_received), 0);
    const pendingWinners = winners.filter(
      (w) => w.status === "PENDING_PROOF" || w.status === "PROOF_SUBMITTED"
    ).length;
    const completedPayoutsTotal = winners
      .filter((w) => w.status === "PAID")
      .reduce((acc, w) => acc + Number(w.prize_amount), 0);

    // Dynamic monthly chart data
    const monthlyGrowth = [
      { month: "Jan", subscribers: 85, charityDonated: 14200, prizePool: 8500 },
      { month: "Feb", subscribers: 142, charityDonated: 24800, prizePool: 12000 },
      { month: "Mar", subscribers: 198, charityDonated: 34100, prizePool: 14500 },
      { month: "Apr", subscribers: 245, charityDonated: 42300, prizePool: 16800 },
      { month: "May", subscribers: 289, charityDonated: 51200, prizePool: 21500 },
      { month: "Jun", subscribers: activeSubscribers, charityDonated: totalCharityContributions, prizePool: totalPrizePool },
    ];

    const charityDistribution = charities.map((c) => ({
      name: c.name,
      value: c.total_received,
    }));

    return {
      totalUsers,
      activeSubscribers,
      mrr: Math.round(mrr),
      totalPrizePool,
      totalCharityContributions,
      pendingWinners,
      completedPayoutsTotal,
      monthlyGrowth,
      charityDistribution,
    };
  }
}

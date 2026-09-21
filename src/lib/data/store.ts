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
import { createClient, isSupabaseConfigured } from "../supabase/client";
import {
  DEMO_USERS,
  DEMO_CHARITIES,
  DEMO_USER_CHARITIES,
  DEMO_SUBSCRIPTIONS,
  DEMO_SCORES,
  DEMO_DRAWS,
  DEMO_WINNERS,
  DEMO_AUDIT_LOGS,
} from "./mock-data";

/**
 * Universal client resolver.
 */
async function getSupabase() {
  return createClient();
}

// ----------------------------------------------------------------------------
// Local In-Memory & LocalStorage Backing Store
// Ensures full functionality out of the box even without active Supabase credentials.
// ----------------------------------------------------------------------------

function getStorageItem<T>(key: string, defaultVal: T): T {
  if (typeof window === "undefined") return defaultVal;
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultVal;
    return JSON.parse(item) as T;
  } catch {
    return defaultVal;
  }
}

function setStorageItem<T>(key: string, val: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // Ignore storage quota errors
  }
}

// In-memory singletons initialized with demo datasets
let memoryUsers: UserProfile[] = [...DEMO_USERS];
let memoryCharities: Charity[] = [...DEMO_CHARITIES];
let memoryUserCharities: UserCharity[] = [...DEMO_USER_CHARITIES];
let memorySubscriptions: Subscription[] = [...DEMO_SUBSCRIPTIONS];
let memoryScores: GolfScore[] = [...DEMO_SCORES];
let memoryDraws: Draw[] = [...DEMO_DRAWS];
let memoryWinners: Winner[] = [...DEMO_WINNERS];
let memoryWinnerProofs: WinnerProof[] = [];
let memoryAuditLogs: AuditLog[] = [...DEMO_AUDIT_LOGS];

function getLocalCharities(): Charity[] {
  const stored = getStorageItem<Charity[]>("dh_charities", memoryCharities);
  if (stored && stored.length > 0) {
    memoryCharities = stored;
    return stored;
  }
  return memoryCharities;
}

function saveLocalCharities(list: Charity[]): void {
  memoryCharities = list;
  setStorageItem("dh_charities", list);
}

function getLocalUsers(): UserProfile[] {
  const stored = getStorageItem<UserProfile[]>("dh_users", memoryUsers);
  if (stored && stored.length > 0) {
    memoryUsers = stored;
    return stored;
  }
  return memoryUsers;
}

function saveLocalUsers(list: UserProfile[]): void {
  memoryUsers = list;
  setStorageItem("dh_users", list);
}

function getLocalUserCharities(): UserCharity[] {
  const stored = getStorageItem<UserCharity[]>("dh_user_charities", memoryUserCharities);
  if (stored && stored.length > 0) {
    memoryUserCharities = stored;
    return stored;
  }
  return memoryUserCharities;
}

function saveLocalUserCharities(list: UserCharity[]): void {
  memoryUserCharities = list;
  setStorageItem("dh_user_charities", list);
}

function getLocalSubscriptions(): Subscription[] {
  const stored = getStorageItem<Subscription[]>("dh_subscriptions", memorySubscriptions);
  if (stored && stored.length > 0) {
    memorySubscriptions = stored;
    return stored;
  }
  return memorySubscriptions;
}

function saveLocalSubscriptions(list: Subscription[]): void {
  memorySubscriptions = list;
  setStorageItem("dh_subscriptions", list);
}

function getLocalScores(): GolfScore[] {
  const stored = getStorageItem<GolfScore[]>("dh_scores", memoryScores);
  if (stored && stored.length > 0) {
    memoryScores = stored;
    return stored;
  }
  return memoryScores;
}

function saveLocalScores(list: GolfScore[]): void {
  memoryScores = list;
  setStorageItem("dh_scores", list);
}

function getLocalDraws(): Draw[] {
  const stored = getStorageItem<Draw[]>("dh_draws", memoryDraws);
  if (stored && stored.length > 0) {
    memoryDraws = stored;
    return stored;
  }
  return memoryDraws;
}

function saveLocalDraws(list: Draw[]): void {
  memoryDraws = list;
  setStorageItem("dh_draws", list);
}

function getLocalWinners(): Winner[] {
  const stored = getStorageItem<Winner[]>("dh_winners", memoryWinners);
  if (stored && stored.length > 0) {
    memoryWinners = stored;
    return stored;
  }
  return memoryWinners;
}

function saveLocalWinners(list: Winner[]): void {
  memoryWinners = list;
  setStorageItem("dh_winners", list);
}

function getLocalAuditLogs(): AuditLog[] {
  const stored = getStorageItem<AuditLog[]>("dh_audit_logs", memoryAuditLogs);
  if (stored && stored.length > 0) {
    memoryAuditLogs = stored;
    return stored;
  }
  return memoryAuditLogs;
}

function saveLocalAuditLogs(list: AuditLog[]): void {
  memoryAuditLogs = list;
  setStorageItem("dh_audit_logs", list);
}

/**
 * Universal DataStore repository backed by Supabase PostgreSQL with seamless demo/offline fallback.
 */
export class DataStore {
  // --------------------------------------------------------------------------
  // AUTH & USER PROFILES
  // --------------------------------------------------------------------------

  public static async setDemoUser(user: UserProfile | null): Promise<void> {
    if (typeof window === "undefined") return;
    if (user) {
      localStorage.removeItem("dh_demo_user_logged_out");
      localStorage.setItem("dh_demo_user", JSON.stringify(user));
      document.cookie = `dh_role=${user.role}; path=/; max-age=2592000; SameSite=Lax`;
      document.cookie = `dh_user_id=${user.id}; path=/; max-age=2592000; SameSite=Lax`;
      document.cookie = `dh_demo_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=2592000; SameSite=Lax`;
    } else {
      localStorage.setItem("dh_demo_user_logged_out", "true");
      localStorage.removeItem("dh_demo_user");
      document.cookie = "dh_role=; path=/; max-age=0; SameSite=Lax";
      document.cookie = "dh_user_id=; path=/; max-age=0; SameSite=Lax";
      document.cookie = "dh_demo_user=; path=/; max-age=0; SameSite=Lax";
    }
  }

  public static async getCurrentUser(): Promise<UserProfile | null> {
    try {
      if (typeof window !== "undefined") {
        if (localStorage.getItem("dh_demo_user_logged_out") === "true") {
          return null;
        }
        const storedUser = localStorage.getItem("dh_demo_user");
        if (storedUser) {
          try {
            return JSON.parse(storedUser);
          } catch {}
        }
      }

      if (isSupabaseConfigured()) {
        const supabase = await getSupabase();
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!error && user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          if (profile) return profile as UserProfile;

          return {
            id: user.id,
            email: user.email || "",
            full_name: user.user_metadata?.full_name || "Subscriber",
            role: "user",
            handicap: 14.2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      }

      // Default demo subscriber
      const defaultUser = getLocalUsers()[1] || DEMO_USERS[1];
      if (typeof window !== "undefined" && defaultUser) {
        // Automatically sync default user to cookies for seamless middleware routing
        document.cookie = `dh_role=${defaultUser.role}; path=/; max-age=2592000; SameSite=Lax`;
        document.cookie = `dh_user_id=${defaultUser.id}; path=/; max-age=2592000; SameSite=Lax`;
        document.cookie = `dh_demo_user=${encodeURIComponent(JSON.stringify(defaultUser))}; path=/; max-age=2592000; SameSite=Lax`;
      }
      return defaultUser;
    } catch {
      return getLocalUsers()[1] || DEMO_USERS[1];
    }
  }

  public static async getUserById(id: string): Promise<UserProfile | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) return data as UserProfile;
      } catch {}
    }

    const local = getLocalUsers().find((u) => u.id === id);
    return local || null;
  }

  public static async getAllUsers(): Promise<UserProfile[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) return data as UserProfile[];
      } catch {}
    }

    return getLocalUsers();
  }

  public static async updateUser(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const currentList = getLocalUsers();
    const existing = currentList.find((u) => u.id === id);
    const updated: UserProfile = existing
      ? { ...existing, ...updates, updated_at: new Date().toISOString() }
      : {
          id,
          email: updates.email || "",
          full_name: updates.full_name || "",
          role: updates.role || "user",
          handicap: updates.handicap,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

    const nextList = currentList.map((u) => (u.id === id ? updated : u));
    if (!currentList.some((u) => u.id === id)) nextList.push(updated);
    saveLocalUsers(nextList);

    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        await supabase
          .from("profiles")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", id);
      } catch {}
    }

    return updated;
  }

  // --------------------------------------------------------------------------
  // CHARITIES
  // --------------------------------------------------------------------------

  public static async getCharities(): Promise<Charity[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from("charities")
          .select("*")
          .order("name");

        if (!error && data && data.length > 0) {
          saveLocalCharities(data as Charity[]);
          return data as Charity[];
        }
      } catch {}
    }

    return getLocalCharities();
  }

  public static async getFeaturedCharities(): Promise<Charity[]> {
    const all = await this.getCharities();
    const featured = all.filter((c) => c.is_featured);
    return featured.length > 0 ? featured : all.slice(0, 3);
  }

  public static async getCharityById(id: string): Promise<Charity | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from("charities")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) return data as Charity;
      } catch {}
    }

    const localList = getLocalCharities();
    return localList.find((c) => c.id === id || c.slug === id) || null;
  }

  public static async getCharityBySlug(slug: string): Promise<Charity | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from("charities")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (!error && data) return data as Charity;
      } catch {}
    }

    const localList = getLocalCharities();
    return localList.find((c) => c.slug === slug || c.id === slug) || null;
  }

  public static async createCharity(
    data: Omit<Charity, "id" | "created_at" | "updated_at">,
    adminId?: string
  ): Promise<Charity> {
    const newCharity: Charity = {
      ...data,
      id: `c-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const currentList = getLocalCharities();
    const nextList = [...currentList, newCharity];
    saveLocalCharities(nextList);

    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        await supabase.from("charities").insert(newCharity);
      } catch {}
    }

    await this.logAudit({
      adminId,
      action: "CHARITY_CREATED",
      entity: "charities",
      entityId: newCharity.id,
      metadata: { name: newCharity.name, category: newCharity.category },
    });

    return newCharity;
  }

  public static async updateCharity(
    id: string,
    updates: Partial<Charity>,
    adminId?: string
  ): Promise<Charity> {
    const currentList = getLocalCharities();
    const existing = currentList.find((c) => c.id === id);
    if (!existing) {
      throw new Error("Charity not found");
    }

    const updated: Charity = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const nextList = currentList.map((c) => (c.id === id ? updated : c));
    saveLocalCharities(nextList);

    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        await supabase
          .from("charities")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", id);
      } catch {}
    }

    await this.logAudit({
      adminId,
      action: "CHARITY_UPDATED",
      entity: "charities",
      entityId: id,
      metadata: { changes: Object.keys(updates) },
    });

    return updated;
  }

  public static async deleteCharity(id: string, adminId?: string): Promise<boolean> {
    const currentList = getLocalCharities();
    const nextList = currentList.filter((c) => c.id !== id);
    saveLocalCharities(nextList);

    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        await supabase.from("charities").delete().eq("id", id);
      } catch {}
    }

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
    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        const { data: uc, error } = await supabase
          .from("user_charities")
          .select("*, charity:charities(*)")
          .eq("user_id", userId)
          .maybeSingle();

        if (!error && uc) {
          const charity = uc.charity as Charity | undefined;
          return { userCharity: uc as UserCharity, charity };
        }
      } catch {}
    }

    const localUC = getLocalUserCharities().find((item) => item.user_id === userId);
    if (!localUC) {
      const defaultCharity = (await this.getCharities())[0];
      return {
        userCharity: {
          id: `uc-${userId}`,
          user_id: userId,
          charity_id: defaultCharity ? defaultCharity.id : "c-001",
          contribution_percentage: 20,
          updated_at: new Date().toISOString(),
        },
        charity: defaultCharity,
      };
    }

    const charity = await this.getCharityById(localUC.charity_id);
    return { userCharity: localUC, charity: charity || undefined };
  }

  public static async setUserCharity(
    userId: string,
    charityId: string,
    contributionPercentage: number
  ): Promise<UserCharity> {
    const validPct = Math.max(10, Math.min(100, contributionPercentage));
    const currentList = getLocalUserCharities();
    const existing = currentList.find((uc) => uc.user_id === userId);

    const record: UserCharity = {
      id: existing ? existing.id : `uc-${userId}`,
      user_id: userId,
      charity_id: charityId,
      contribution_percentage: validPct,
      updated_at: new Date().toISOString(),
    };

    const nextList = existing
      ? currentList.map((uc) => (uc.user_id === userId ? record : uc))
      : [...currentList, record];
    saveLocalUserCharities(nextList);

    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        await supabase
          .from("user_charities")
          .upsert(record, { onConflict: "user_id" });
      } catch {}
    }

    return record;
  }

  // --------------------------------------------------------------------------
  // SUBSCRIPTIONS
  // --------------------------------------------------------------------------

  public static async getUserSubscription(userId: string): Promise<Subscription | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (!error && data) return data as Subscription;
      } catch {}
    }

    const local = getLocalSubscriptions().find((s) => s.user_id === userId);
    if (local) return local;

    // Return a default active subscription for demo users
    const defaultSub: Subscription = {
      id: `sub-${userId}`,
      user_id: userId,
      stripe_customer_id: `cus_demo_${userId}`,
      stripe_subscription_id: `sub_demo_${userId}`,
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
    return defaultSub;
  }

  public static async getAllSubscriptions(): Promise<Subscription[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) return data as Subscription[];
      } catch {}
    }

    return getLocalSubscriptions();
  }

  public static async isActiveSubscriber(userId: string): Promise<boolean> {
    const sub = await this.getUserSubscription(userId);
    return !!sub && sub.status === "active";
  }

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
    const currentList = getLocalSubscriptions();
    let targetUserId = payload.userId;
    if (!targetUserId) {
      const existing = currentList.find((s) => s.stripe_customer_id === payload.stripeCustomerId);
      targetUserId = existing?.user_id || "u-sub-001";
    }

    const record: Subscription = {
      id: `sub-${targetUserId}`,
      user_id: targetUserId,
      stripe_customer_id: payload.stripeCustomerId,
      stripe_subscription_id: payload.stripeSubscriptionId || null,
      plan: payload.plan,
      status: payload.status,
      amount_cents: payload.amountCents,
      currency: payload.currency || "usd",
      current_period_start: payload.currentPeriodStart || new Date().toISOString(),
      current_period_end:
        payload.currentPeriodEnd ||
        new Date(Date.now() + (payload.plan === "yearly" ? 365 : 30) * 86400000).toISOString(),
      cancel_at_period_end: payload.cancelAtPeriodEnd || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const nextList = currentList.filter((s) => s.user_id !== targetUserId);
    nextList.push(record);
    saveLocalSubscriptions(nextList);

    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        await supabase.from("subscriptions").upsert(record, { onConflict: "user_id" });
      } catch {}
    }

    return record;
  }

  // --------------------------------------------------------------------------
  // SCORES (Rolling 5 Stableford Scores)
  // --------------------------------------------------------------------------

  public static async getUserScores(userId: string): Promise<GolfScore[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from("scores")
          .select("*")
          .eq("user_id", userId)
          .order("played_date", { ascending: false });

        if (!error && data && data.length > 0) return data as GolfScore[];
      } catch {}
    }

    return getLocalScores().filter((s) => s.user_id === userId);
  }

  public static async getAllScores(): Promise<GolfScore[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from("scores")
          .select("*")
          .order("played_date", { ascending: false });

        if (!error && data && data.length > 0) return data as GolfScore[];
      } catch {}
    }

    return getLocalScores();
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

    let allScores = getLocalScores();
    if (result.removedScoreId) {
      allScores = allScores.filter((s) => s.id !== result.removedScoreId);
    }

    const newScore: GolfScore = {
      id: `sc-${Date.now()}`,
      user_id: userId,
      score: Number(score),
      played_date: playedDate,
      course_name: courseName || null,
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    allScores = [newScore, ...allScores];
    saveLocalScores(allScores);

    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        if (result.removedScoreId) {
          await supabase.from("scores").delete().eq("id", result.removedScoreId);
        }
        await supabase.from("scores").insert(newScore);
      } catch {}
    }

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

    const allScores = getLocalScores().map((s) => {
      if (s.id === scoreId) {
        return {
          ...s,
          score: Number(score),
          played_date: playedDate,
          course_name: courseName || null,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        };
      }
      return s;
    });
    saveLocalScores(allScores);

    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        await supabase
          .from("scores")
          .update({
            score: Number(score),
            played_date: playedDate,
            course_name: courseName || null,
            notes: notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", scoreId);
      } catch {}
    }

    const refreshed = await this.getUserScores(userId);
    return { success: true, scores: refreshed };
  }

  public static async deleteScore(
    userId: string,
    scoreId: string
  ): Promise<{ success: boolean; scores: GolfScore[]; error?: string }> {
    const allScores = getLocalScores().filter((s) => s.id !== scoreId);
    saveLocalScores(allScores);

    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        await supabase.from("scores").delete().eq("id", scoreId);
      } catch {}
    }

    const refreshed = await this.getUserScores(userId);
    return { success: true, scores: refreshed };
  }

  // --------------------------------------------------------------------------
  // DRAWS & SIMULATION
  // --------------------------------------------------------------------------

  public static async getDraws(): Promise<Draw[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from("draws")
          .select("*")
          .order("draw_date", { ascending: false });

        if (!error && data && data.length > 0) return data as Draw[];
      } catch {}
    }

    return getLocalDraws();
  }

  public static async getDrawById(id: string): Promise<Draw | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from("draws")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) return data as Draw;
      } catch {}
    }

    return getLocalDraws().find((d) => d.id === id) || null;
  }

  public static async getLatestPublishedDraw(): Promise<Draw | null> {
    const all = await this.getDraws();
    return all.find((d) => d.status === "PUBLISHED" || d.status === "COMPLETED") || null;
  }

  public static async getUpcomingDraw(): Promise<Draw | null> {
    const all = await this.getDraws();
    return all.find((d) => d.status === "DRAFT" || d.status === "SIMULATED") || null;
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
    const existingDraws = await this.getDraws();
    const nextNumber = Math.max(...existingDraws.map((d) => d.draw_number), 100) + 1;
    const activeSubs = (await this.getAllSubscriptions()).filter((s) => s.status === "active");

    const newDraw: Draw = {
      id: `draw-${Date.now()}`,
      draw_number: nextNumber,
      title: data.title,
      draw_date: data.drawDate,
      status: "DRAFT",
      mode: data.mode,
      winning_numbers: null,
      total_participants: activeSubs.length || 150,
      total_prize_pool: data.totalPrizePool,
      jackpot_rollover_in: data.jackpotRolloverIn || 0,
      jackpot_rollover_out: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const nextList = [newDraw, ...existingDraws];
    saveLocalDraws(nextList);

    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        await supabase.from("draws").insert(newDraw);
      } catch {}
    }

    await this.logAudit({
      adminId,
      action: "DRAW_CREATED",
      entity: "draws",
      entityId: newDraw.id,
      metadata: { draw_number: nextNumber, mode: data.mode },
    });

    return newDraw;
  }

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

  public static async publishDraw(
    drawId: string,
    simResult: DrawSimulationResult,
    adminId?: string
  ): Promise<Draw> {
    const publishedAt = new Date().toISOString();
    const existingDraws = getLocalDraws();

    const updatedDraws = existingDraws.map((d) => {
      if (d.id === drawId) {
        return {
          ...d,
          status: "PUBLISHED" as const,
          winning_numbers: simResult.winningNumbers,
          published_at: publishedAt,
          mode: simResult.mode,
          simulation_seed: simResult.seed,
          total_participants: simResult.totalParticipants,
          jackpot_rollover_out: simResult.jackpotRolloverOut,
          updated_at: publishedAt,
        };
      }
      return d;
    });
    saveLocalDraws(updatedDraws);

    const allWinners = [
      ...simResult.tier5Winners,
      ...simResult.tier4Winners,
      ...simResult.tier3Winners,
    ];

    if (allWinners.length > 0) {
      const newWinRecords: Winner[] = allWinners.map((entry) => ({
        id: `win-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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

      const currentWinners = getLocalWinners();
      saveLocalWinners([...newWinRecords, ...currentWinners]);
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        await supabase
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
      } catch {}
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
    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        let query = supabase
          .from("winners")
          .select("*, user:profiles(*), draw:draws(*)")
          .order("created_at", { ascending: false });

        if (status && status !== "ALL") {
          query = query.eq("status", status);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) return data as Winner[];
      } catch {}
    }

    const all = getLocalWinners();
    const users = getLocalUsers();
    const draws = getLocalDraws();

    const populated = all.map((w) => ({
      ...w,
      user: users.find((u) => u.id === w.user_id),
      draw: draws.find((d) => d.id === w.draw_id),
    }));

    if (status && status !== "ALL") {
      return populated.filter((w) => w.status === status);
    }
    return populated;
  }

  public static async getUserWinners(userId: string): Promise<Winner[]> {
    const all = await this.getWinners();
    return all.filter((w) => w.user_id === userId);
  }

  public static async getWinnerById(winnerId: string): Promise<Winner | null> {
    const all = await this.getWinners();
    return all.find((w) => w.id === winnerId) || null;
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

    const currentWinners = getLocalWinners();
    const updated = currentWinners.map((w) => {
      if (w.id === winnerId) {
        return {
          ...w,
          status: "PROOF_SUBMITTED" as const,
          updated_at: new Date().toISOString(),
        };
      }
      return w;
    });
    saveLocalWinners(updated);

    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        await supabase.from("winner_proofs").insert({
          id: crypto.randomUUID(),
          winner_id: winnerId,
          file_url: proofData.fileUrl,
          file_name: proofData.fileName,
          file_size: proofData.fileSize,
          mime_type: proofData.mimeType,
          notes: proofData.notes || null,
          uploaded_at: new Date().toISOString(),
        });
        await supabase
          .from("winners")
          .update({
            status: "PROOF_SUBMITTED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", winnerId);
      } catch {}
    }

    return (await this.getWinnerById(winnerId))!;
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

    const currentWinners = getLocalWinners();
    const updated = currentWinners.map((w) => {
      if (w.id === winnerId) {
        return {
          ...w,
          status: "APPROVED" as const,
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes || null,
          updated_at: new Date().toISOString(),
        };
      }
      return w;
    });
    saveLocalWinners(updated);

    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        await supabase
          .from("winners")
          .update({
            status: "APPROVED",
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
            admin_notes: notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", winnerId);
      } catch {}
    }

    await this.logAudit({
      adminId,
      action: "WINNER_APPROVED",
      entity: "winners",
      entityId: winnerId,
      metadata: { prize_amount: winner.prize_amount, notes },
    });

    return (await this.getWinnerById(winnerId))!;
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

    const currentWinners = getLocalWinners();
    const updated = currentWinners.map((w) => {
      if (w.id === winnerId) {
        return {
          ...w,
          status: "REJECTED" as const,
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          admin_notes: reason,
          updated_at: new Date().toISOString(),
        };
      }
      return w;
    });
    saveLocalWinners(updated);

    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        await supabase
          .from("winners")
          .update({
            status: "REJECTED",
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
            admin_notes: reason,
            updated_at: new Date().toISOString(),
          })
          .eq("id", winnerId);
      } catch {}
    }

    await this.logAudit({
      adminId,
      action: "WINNER_REJECTED",
      entity: "winners",
      entityId: winnerId,
      metadata: { reason },
    });

    return (await this.getWinnerById(winnerId))!;
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

    const paidAt = new Date().toISOString();
    const currentWinners = getLocalWinners();
    const updated = currentWinners.map((w) => {
      if (w.id === winnerId) {
        return {
          ...w,
          status: "PAID" as const,
          paid_at: paidAt,
          updated_at: paidAt,
        };
      }
      return w;
    });
    saveLocalWinners(updated);

    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        await supabase
          .from("winners")
          .update({
            status: "PAID",
            paid_at: paidAt,
            updated_at: paidAt,
          })
          .eq("id", winnerId);

        await supabase.from("payouts").insert({
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
      } catch {}
    }

    await this.logAudit({
      adminId,
      action: "PAYOUT_COMPLETED",
      entity: "winners",
      entityId: winnerId,
      metadata: { payment_ref: paymentRef, amount: winner.prize_amount },
    });

    return (await this.getWinnerById(winnerId))!;
  }

  // --------------------------------------------------------------------------
  // AUDIT LOGS
  // --------------------------------------------------------------------------

  public static async getAuditLogs(): Promise<AuditLog[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) return data as AuditLog[];
      } catch {}
    }

    return getLocalAuditLogs();
  }

  public static async logAudit(entry: {
    adminId?: string;
    adminEmail?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      admin_id: entry.adminId || null,
      admin_email: entry.adminEmail || "admin@digitalheroes.golf",
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId || null,
      metadata: entry.metadata,
      created_at: new Date().toISOString(),
    };

    const current = getLocalAuditLogs();
    saveLocalAuditLogs([newLog, ...current]);

    if (isSupabaseConfigured()) {
      try {
        const supabase = await getSupabase();
        await supabase.from("audit_logs").insert(newLog);
      } catch {}
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
    const totalCharityContributions = charitiesList.reduce(
      (acc, c) => acc + Number(c.total_received || 0),
      0
    );
    const totalPrizePool = drawsList.reduce((acc, d) => acc + Number(d.total_prize_pool || 0), 0);
    const completedPayoutsTotal = winnersList
      .filter((w) => w.status === "PAID")
      .reduce((acc, w) => acc + Number(w.prize_amount || 0), 0);
    const pendingWinners = winnersList.filter(
      (w) => w.status === "PENDING_PROOF" || w.status === "PROOF_SUBMITTED"
    ).length;

    const mrr = activeSubs.reduce((acc, s) => {
      return acc + (s.plan === "monthly" ? s.amount_cents / 100 : s.amount_cents / 100 / 12);
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
      charityName: uCharity.charity?.name || "Veterans on Course",
      subscriptionStatus: sub?.status || "active",
    };
  }
}

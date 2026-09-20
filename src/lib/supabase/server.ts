import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-service-key";

/**
 * Creates an authenticated Supabase server client bound to the current incoming cookies.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Can be safely ignored if called from Server Components
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Can be safely ignored if called from Server Components
        }
      },
    },
  });
}

/**
 * Creates a privileged Supabase admin client for backend webhooks and administrative actions.
 * NEVER exposed to the browser or client components.
 */
export function createAdminClient() {
  return createServerClient(supabaseUrl, supabaseServiceKey, {
    cookies: {
      get() {
        return undefined;
      },
      set() {},
      remove() {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}


import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class SupabaseAdminConfigurationError extends Error {
  readonly code = "SUPABASE_ADMIN_CONFIGURATION_MISSING";

  constructor() {
    super("Supabase server write configuration is missing.");
    this.name = "SupabaseAdminConfigurationError";
  }
}

export function createAdminSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new SupabaseAdminConfigurationError();
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

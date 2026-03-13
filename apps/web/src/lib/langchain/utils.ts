import type { RunnableConfig } from "@langchain/core/runnables";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@swe-mentor/shared";

/**
 * Extract the pre-authenticated Supabase client from LangChain config.
 * The API route creates this client from the Bearer JWT token and passes it
 * via config.configurable.supabaseClient — tools must NEVER construct their own.
 */
export function getSupabaseClient(
  config: RunnableConfig
): SupabaseClient<Database> {
  const client = (config as Record<string, unknown>)?.configurable as
    | Record<string, unknown>
    | undefined;
  const supabase = client?.supabaseClient as
    | SupabaseClient<Database>
    | undefined;

  if (!supabase) {
    throw new Error(
      "supabaseClient not found in config.configurable. " +
        "The API route must pass a JWT-initialized Supabase client."
    );
  }

  return supabase;
}

/**
 * Extract the userId from LangChain config.configurable.
 */
export function getUserId(config: RunnableConfig): string {
  const configurable = (config as Record<string, unknown>)?.configurable as
    | Record<string, unknown>
    | undefined;
  const userId = configurable?.userId as string | undefined;

  if (!userId) {
    throw new Error(
      "userId not found in config.configurable. " +
        "The API route must pass userId via configurable."
    );
  }

  return userId;
}

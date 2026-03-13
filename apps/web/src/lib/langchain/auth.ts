import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@swe-mentor/shared";

/**
 * Validate the Bearer token from the Authorization header.
 * Returns the authenticated user AND a JWT-initialized Supabase client
 * (not the cookie-based server client).
 */
export async function validateAuth(request: Request): Promise<{
  user: User;
  supabaseClient: SupabaseClient<Database>;
}> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Missing or invalid Authorization header");
  }

  const token = authHeader.slice(7);

  // Create a Supabase client initialized with the user's JWT
  const supabaseClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );

  // Verify the token
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser(token);

  if (error || !user) {
    throw new AuthError(error?.message ?? "Invalid token");
  }

  return { user, supabaseClient };
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

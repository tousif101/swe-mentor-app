import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getSupabaseClient, getUserId } from "./utils";

const getCareerGoals = tool(
  async (_input, config) => {
    const supabase = getSupabaseClient(config);
    const userId = getUserId(config);

    const { data, error } = await supabase
      .from("profiles")
      .select("role, target_role, focus_areas, company_name")
      .eq("id", userId)
      .single();

    if (error) {
      return JSON.stringify({ error: error.message });
    }

    return JSON.stringify(data);
  },
  {
    name: "get_career_goals",
    description:
      "Get the user's career profile including current role, target role, focus areas, and company. Use this to understand their career context before giving advice.",
    schema: z.object({}),
  }
);

const getProgressSummary = tool(
  async (_input, config) => {
    const supabase = getSupabaseClient(config);
    const userId = getUserId(config);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [streakResult, metricsResult] = await Promise.all([
      supabase
        .from("user_streaks")
        .select("current_streak, longest_streak, last_check_in_date")
        .eq("user_id", userId)
        .single(),
      supabase
        .from("daily_metrics")
        .select("date, entries_count, mentor_messages, tags_used")
        .eq("user_id", userId)
        .gte("date", sevenDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: false }),
    ]);

    return JSON.stringify({
      streaks: streakResult.data,
      streaksError: streakResult.error?.message,
      dailyMetrics: metricsResult.data,
      dailyMetricsError: metricsResult.error?.message,
    });
  },
  {
    name: "get_progress_summary",
    description:
      "Get the user's streak data and daily metrics for the last 7 days. Use this to understand their consistency and recent activity.",
    schema: z.object({}),
  }
);

const getRecentCheckins = tool(
  async ({ count }, config) => {
    const supabase = getSupabaseClient(config);
    const userId = getUserId(config);

    const { data, error } = await supabase
      .from("check_ins")
      .select(
        "id, check_in_type, energy_level, focus_area, daily_goal, quick_win, blocker, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(count);

    if (error) {
      return JSON.stringify({ error: error.message });
    }

    return JSON.stringify(data);
  },
  {
    name: "get_recent_checkins",
    description:
      "Get the user's most recent check-ins with energy levels, wins, and blockers. Use this to understand their day-to-day experience and patterns.",
    schema: z.object({
      count: z
        .number()
        .optional()
        .default(7)
        .describe("Number of recent check-ins to retrieve (default 7)"),
    }),
  }
);

const searchUserContext = tool(
  async () => {
    return JSON.stringify({
      message: "RAG not yet configured — will be wired in a future update",
    });
  },
  {
    name: "search_user_context",
    description:
      "Search the user's historical data using semantic similarity. Use this for open-ended questions about patterns, history, or specific topics.",
    schema: z.object({
      query: z
        .string()
        .describe("The search query to find relevant user context"),
    }),
  }
);

const getCareerLadder = tool(
  async (_input, config) => {
    const supabase = getSupabaseClient(config);
    const userId = getUserId(config);

    // Get user's company name from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_name, company_size")
      .eq("id", userId)
      .single();

    if (profileError || !profile?.company_name) {
      return JSON.stringify({
        error: profileError?.message || "No company name set in profile",
      });
    }

    // Try fuzzy match on company name
    const { data: matrix } = await supabase
      .from("career_matrices")
      .select("id, company_name, source, is_verified")
      .ilike("company_name", `%${profile.company_name}%`)
      .limit(1)
      .single();

    if (matrix) {
      const { data: levels } = await supabase
        .from("level_definitions")
        .select(
          "level_code, level_name, level_order, technical_expectations, leadership_expectations, collaboration_expectations, visibility_expectations, scope"
        )
        .eq("matrix_id", matrix.id)
        .order("level_order", { ascending: true });

      return JSON.stringify({ matrix, levels });
    }

    // Fallback to generic template based on company size
    const templateName =
      profile.company_size === "5000+" ? "Generic FAANG" : "Generic Startup";

    const { data: templateMatrix } = await supabase
      .from("career_matrices")
      .select("id, company_name, source, is_verified")
      .eq("company_name", templateName)
      .single();

    if (templateMatrix) {
      const { data: levels } = await supabase
        .from("level_definitions")
        .select(
          "level_code, level_name, level_order, technical_expectations, leadership_expectations, collaboration_expectations, visibility_expectations, scope"
        )
        .eq("matrix_id", templateMatrix.id)
        .order("level_order", { ascending: true });

      return JSON.stringify({
        matrix: templateMatrix,
        levels,
        note: "No exact company match found — using generic template",
      });
    }

    return JSON.stringify({
      error: "No career ladder data available for this company or as template",
    });
  },
  {
    name: "get_career_ladder",
    description:
      "Get career progression framework for the user's company. Returns level expectations, promotion criteria, and scope definitions. Falls back to a generic template if no company match is found.",
    schema: z.object({}),
  }
);

export const mentorTools = [
  getCareerGoals,
  getProgressSummary,
  getRecentCheckins,
  searchUserContext,
  getCareerLadder,
];

export { createMentorAgent, model } from "./config";
export { mentorTools } from "./tools";
export { getSupabaseClient, getUserId } from "./utils";
export {
  buildSystemPrompt,
  detectCoachingMode,
  replacePlaceholders,
  BASE_COACHING_PROMPT,
  LEVEL_PLAYBOOKS,
  TACTICAL_GUIDES,
  COACHING_MODES,
} from "./prompts";
export type { CoachingMode } from "./prompts";
export { RateLimitError } from "./errors";
export { validateAuth, AuthError } from "./auth";
export {
  mentorMiddleware,
  summarizationHook,
  createDynamicPrompt,
  checkRateLimit,
  wrapToolExecution,
  MODEL_CALL_LIMIT,
  TOOL_CALL_LIMIT,
} from "./middleware";

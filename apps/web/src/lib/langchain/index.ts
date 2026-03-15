export { createMentorAgent, model } from "./config";
export { mentorTools } from "./tools";
export { getSupabaseClient, getUserId } from "./utils";
export {
  buildSystemPrompt,
  detectCoachingMode,
  replacePlaceholders,
  augmentForSuspiciousInput,
  BASE_COACHING_PROMPT,
  LEVEL_PLAYBOOKS,
  TACTICAL_GUIDES,
  COACHING_MODES,
} from "./prompts";
export type { CoachingMode } from "./prompts";
export { RateLimitError, ThrottleError } from "./errors";
export { validateAuth, AuthError } from "./auth";
export {
  detectInjectionPatterns,
  classifyTopic,
  validateOutput,
  checkThrottle,
  DAILY_RATE_LIMIT,
  THROTTLE_COOLDOWN_MS,
  OFF_TOPIC_RESPONSE,
} from "./safety";
export {
  mentorMiddleware,
  summarizationHook,
  createDynamicPrompt,
  checkRateLimit,
  wrapToolExecution,
  MODEL_CALL_LIMIT,
  TOOL_CALL_LIMIT,
} from "./middleware";

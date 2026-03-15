// ---------------------------------------------------------------------------
// Chat Safety — Prompt injection detection, topic classification,
// output validation, and throttle
// ---------------------------------------------------------------------------

/** Single source of truth for daily message limit (matches RPC enforcement). */
export const DAILY_RATE_LIMIT = 20;

/** Minimum milliseconds between messages per user. */
export const THROTTLE_COOLDOWN_MS = 3000;

/** Canned response for off-topic messages. */
export const OFF_TOPIC_RESPONSE =
  "I appreciate your question, but I'm specifically designed to help with software engineering careers — things like leveling up, PR reviews, interview prep, team dynamics, and professional growth. Could you rephrase your question in the context of your engineering career? I'm here to help with that!";

// ---------------------------------------------------------------------------
// 1. Prompt injection detection
// ---------------------------------------------------------------------------

const INJECTION_PATTERNS: { regex: RegExp; label: string }[] = [
  { regex: /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i, label: "ignore-instructions" },
  { regex: /you are now\s+(?:a\s+)?(?:different|new|unrestricted|free|jailbreak)/i, label: "role-override" },
  { regex: /\bact as\s+(?:a\s+)?(?:different|another|new|unrestricted|jailbroken)/i, label: "role-override" },
  { regex: /pretend\s+(to be|you'?re)/i, label: "role-override" },
  { regex: /\bsystem\s*:/i, label: "role-injection" },
  { regex: /\bassistant\s*:/i, label: "role-injection" },
  { regex: /forget\s+(your|all|everything)/i, label: "forget-instructions" },
  { regex: /disregard\s+(your|all|the|those|any)\s+(instruct|prompt|rule|guideline|training)/i, label: "disregard" },
  { regex: /<\/?system>/i, label: "template-marker" },
  { regex: /<\/?prompt>/i, label: "template-marker" },
  { regex: /\[INST\]/i, label: "template-marker" },
  { regex: /<<SYS>>/i, label: "template-marker" },
  { regex: /reveal\s+(your|the)\s+(system|prompt|instructions)/i, label: "reveal-prompt" },
];

export function detectInjectionPatterns(message: string): {
  suspicious: boolean;
  patterns: string[];
} {
  const matched: string[] = [];
  for (const { regex, label } of INJECTION_PATTERNS) {
    if (regex.test(message)) {
      matched.push(label);
    }
  }
  return { suspicious: matched.length > 0, patterns: matched };
}

// ---------------------------------------------------------------------------
// 2. Topic classification
// ---------------------------------------------------------------------------

const ON_TOPIC_PATTERNS = [
  /\bcode\b/i,
  /\bengineer/i,
  /\bcareer\b/i,
  /\binterview/i,
  /\bPR\b/,
  /\bpull request/i,
  /\bdebug/i,
  /\bdeploy/i,
  /\bpromotion/i,
  /\bmentor/i,
  /\bfeedback\b/i,
  /\bperformance review/i,
  /\bteam\b/i,
  /\bburnout/i,
  /\bsalary/i,
  /\bgoal/i,
  /\bcheck-?in/i,
  /\bfocus area/i,
  /\b1:1\b/i,
  /\bone[- ]on[- ]one/i,
  /\bmanager\b/i,
  /\btech lead/i,
  /\bstaff\b/i,
  /\bsenior\b/i,
  /\bjunior\b/i,
  /\bintern\b/i,
  /\bdesign doc/i,
  /\bsystem design/i,
  /\bstandup\b/i,
  /\bretro\b/i,
  /\bsprint/i,
  /\bagile\b/i,
  /\bscrum\b/i,
  /\bjira\b/i,
  /\bticket/i,
  /\btask\s+(breakdown|estimation|tracking)/i,
  /\bproject\s+(lead|manag|plan|deliver|execut|kickoff)/i,
  /\bship\s+(it|code|features?|product)/i,
  /\blaunch/i,
  /\brelease/i,
  /\brefactor/i,
  /\barchitect/i,
  /\bimpact\b/i,
  /\bvisibility\b/i,
  /\bbrag doc/i,
  /\bresume\b/i,
  /\bjob/i,
  /\bhiring/i,
  /\bonboarding/i,
  /\bramp/i,
  /\bskill/i,
  /\blearn(ing)?\s+(path|plan|goal|roadmap|resource)/i,
  /\bgrowth\b/i,
  /\blevel(ing)?\s*(up|framework|ladder|expectation)/i,
  /\bcompensation/i,
  /\bnegotiat/i,
  /\boffer/i,
  /\bwork[- ]life/i,
  /\bremote\b/i,
  /\bhybrid\b/i,
  /\bleetcode/i,
  /\balgorithm/i,
  /\bdata structure/i,
  /\btest\s*(ing|s|able|ability|driven|case|suite|coverage|pyramid)/i,
  /\bunit test/i,
  /\bCI\/CD\b/i,
  /\bpipeline/i,
  /\bgit\b/i,
  /\bbranch/i,
  /\bcommit/i,
  /\breview/i,
  /\bmentorship/i,
  /\bsponsorship/i,
  /\bnetwork(ing)?\b/i,
  /\bconference/i,
  /\btech talk/i,
  /\bgive a talk/i,
  /\bblog/i,
  /\bopen source/i,
  /\bside project/i,
  /\bportfolio/i,
  /\blinkedin/i,
  /\bgithub\b/i,
];

const OFF_TOPIC_PATTERNS: { regex: RegExp; reason: string }[] = [
  { regex: /\bdiagnos/i, reason: "medical-topic" },
  { regex: /\bmedication/i, reason: "medical-topic" },
  { regex: /\bprescri/i, reason: "medical-topic" },
  { regex: /\bsymptom/i, reason: "medical-topic" },
  { regex: /\blawsuit/i, reason: "legal-topic" },
  { regex: /\battorney/i, reason: "legal-topic" },
  { regex: /\blegal advice/i, reason: "legal-topic" },
  { regex: /\bstock\s+(market|trad|pick|tip|portfolio)/i, reason: "financial-topic" },
  { regex: /\binvest(?:ment|ing)\b/i, reason: "financial-topic" },
  { regex: /\bcrypto(?:currency)?\b/i, reason: "financial-topic" },
  { regex: /\bbitcoin/i, reason: "financial-topic" },
  { regex: /\btrading\b/i, reason: "financial-topic" },
  { regex: /\brecipe/i, reason: "cooking-topic" },
  { regex: /write me a (poem|story|song|essay)/i, reason: "creative-writing" },
  { regex: /\bhoroscope/i, reason: "astrology-topic" },
  { regex: /\btarot/i, reason: "astrology-topic" },
];

export function classifyTopic(message: string): {
  onTopic: boolean;
  reason?: string;
} {
  // Check on-topic signals first — any match means on-topic
  for (const pattern of ON_TOPIC_PATTERNS) {
    if (pattern.test(message)) {
      return { onTopic: true };
    }
  }

  // Check off-topic signals only if no on-topic signal matched
  for (const { regex, reason } of OFF_TOPIC_PATTERNS) {
    if (regex.test(message)) {
      return { onTopic: false, reason };
    }
  }

  // Benefit of the doubt — system prompt handles edge cases
  return { onTopic: true };
}

// ---------------------------------------------------------------------------
// 3. Output validation
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT_LEAKAGE_PATTERNS = [
  /COACHING MODE:/i,
  /Level Playbook/i,
  /Tactical Guides/i,
  /BASE_COACHING_PROMPT/i,
  /IMPORTANT BOUNDARIES:/i,
  /replacePlaceholders/i,
];

const PII_PATTERNS: { regex: RegExp; replacement: string }[] = [
  { regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[SSN REDACTED]" },
  { regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: "[CARD REDACTED]" },
];

export function validateOutput(response: string): {
  safe: boolean;
  sanitized: string;
} {
  let safe = true;
  let sanitized = response;

  // Check for system prompt leakage
  for (const pattern of SYSTEM_PROMPT_LEAKAGE_PATTERNS) {
    if (pattern.test(sanitized)) {
      safe = false;
      sanitized = sanitized.replace(
        new RegExp(pattern.source, pattern.flags + (pattern.flags.includes("g") ? "" : "g")),
        "[REDACTED]"
      );
    }
  }

  // Check for PII patterns
  for (const { regex, replacement } of PII_PATTERNS) {
    regex.lastIndex = 0; // Always reset before use — global regexes retain lastIndex
    if (regex.test(sanitized)) {
      regex.lastIndex = 0;
      sanitized = sanitized.replace(regex, replacement);
      safe = false;
    }
  }

  return { safe, sanitized };
}

// ---------------------------------------------------------------------------
// 4. Throttle
// ---------------------------------------------------------------------------

// WARNING: This in-process Map is not shared across serverless invocations or
// multiple Node instances. For production horizontal scaling, replace with
// Redis SET ... NX EX or a Supabase-backed atomic check. The RPC daily limit
// is the real enforcement; this is a best-effort rapid-fire deterrent.
const lastMessageTimestamps = new Map<string, number>();

export function checkThrottle(userId: string):
  | { allowed: true }
  | { allowed: false; retryAfterMs: number } {
  const now = Date.now();
  const lastTimestamp = lastMessageTimestamps.get(userId);

  // Prune if map is too large
  if (lastMessageTimestamps.size > 10_000) {
    const cutoff = now - 60_000;
    for (const [key, ts] of lastMessageTimestamps) {
      if (ts < cutoff) {
        lastMessageTimestamps.delete(key);
      }
    }
  }

  if (lastTimestamp && now - lastTimestamp < THROTTLE_COOLDOWN_MS) {
    const retryAfterMs = THROTTLE_COOLDOWN_MS - (now - lastTimestamp);
    return { allowed: false, retryAfterMs };
  }

  lastMessageTimestamps.set(userId, now);
  return { allowed: true };
}

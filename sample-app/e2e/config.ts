/**
 * Every environment variable the E2E suite reads, in one place, so a missing
 * value is reported once at start-up instead of surfacing as a silent skip or a
 * confusing timeout deep in a spec. Every variable is documented in
 * `.env.e2e.example`.
 */
interface E2EVar {
  name: string;
  /** Required vars stop the run; optional ones only skip the tests listed. */
  required: boolean;
  /** What is affected when it is missing. */
  affects: string;
}

export const E2E_VARS: E2EVar[] = [
  { name: 'COMETCHAT_APP_ID', required: true, affects: 'everything' },
  { name: 'COMETCHAT_REGION', required: true, affects: 'everything' },
  { name: 'COMETCHAT_AUTH_KEY', required: true, affects: 'everything (login)' },
  { name: 'COMETCHAT_API_KEY', required: true, affects: 'everything (seed, cleanup, REST helpers)' },
  { name: 'AI_AGENT_UID', required: false, affects: "ai-assistant-chat (defaults to 'ai-agent-e2e')" },
  { name: 'GROUP_AGENT_1_UID', required: false, affects: 'agentic-group — all tests skip' },
  { name: 'GROUP_AGENT_2_UID', required: false, affects: 'agentic-group — all tests skip' },
  { name: 'AGENTIC_GROUP_1_ID', required: false, affects: "agentic-group (falls back to 'e2e-agentic-group-1')" },
  { name: 'AGENTIC_GROUP_2_ID', required: false, affects: "agentic-group (falls back to 'e2e-agentic-group-2')" },
  { name: 'E2E_BLOCKED_MIME_TYPE', required: false, affects: 'multi-attachment — "file type not supported" test skips' },
  { name: 'E2E_PIN_MESSAGES_LIMIT', required: false, affects: 'pin-messages — pin-limit test skips (runs only at 5)' },
];

/** Logs what is missing and what it skips; throws if a required var is unset. */
export function reportE2EConfig(env: NodeJS.ProcessEnv = process.env): void {
  const missing = E2E_VARS.filter(v => !env[v.name]);
  const missingRequired = missing.filter(v => v.required);
  if (missingRequired.length > 0) {
    throw new Error(
      `[e2e-config] Missing required variables: ${missingRequired.map(v => v.name).join(', ')}. ` +
        'Set them in sample-app/.env.e2e or in the environment.'
    );
  }
  const optional = missing.filter(v => !v.required);
  if (optional.length === 0) {
    console.log('[e2e-config] All E2E variables set.');
    return;
  }
  console.log(`[e2e-config] ${optional.length} optional variable(s) not set — these tests will skip or use a fallback:`);
  for (const v of optional) console.log(`  - ${v.name}: ${v.affects}`);
}

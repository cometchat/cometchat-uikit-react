/**
 * Names the public prop cases a test verifies, e.g. `covers('CometChatUsers.hideSearch', 'true')`.
 * Call it inside the test (not a hook). It does nothing at run time: a coverage check reads the
 * calls from the spec files, so the arguments must be string literals.
 *
 * Cases: `true`, `false`, `default`, a variant's value, `called` (handlers), `custom` (views),
 * `used` (request builders), `set` (other values) and `overrides-context`.
 */
export function covers(prop: string, ...cases: [string, ...string[]]): void {
  // Read from the source, not run.
  void prop;
  void cases;
}

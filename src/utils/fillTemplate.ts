/**
 * Fill a translated template's `{name}` placeholders, in one pass.
 *
 * WHY THIS EXISTS: chaining `template.replace('{actor}', name).replace('{member}', other)` goes
 * wrong with text people type. A string replacement reads `$&`, `$'`, `` $` `` and `$$` in the
 * value as patterns, so a member named `Al$&ice` shows as `Al{member}ice`; and each later
 * `replace` scans the earlier values, so an actor named `{member}` takes the member's name. Names,
 * captions and message text are all user-controlled. This replaces every placeholder at once, with
 * each value inserted as it is.
 *
 * A placeholder with no value in `values` is left as written.
 */
export function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{([A-Za-z_]+)\}/g, (placeholder: string, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : placeholder
  );
}

/**
 * A copy of an integrator-supplied SDK request builder, so the kit can set its
 * own fields (a pagination anchor, the saved flag) without changing the
 * object the integrator passed in and may still hold or share.
 *
 * The SDK builders have no `clone()` and no getters, so this is a
 * prototype-preserving shallow copy: the builder methods keep working and the
 * kit's setters land on the copy only. Nested values (type and category
 * arrays) are shared but never mutated by the setters the kit calls.
 *
 * @internal
 */
export function copyRequestBuilder<T extends object>(builder: T): T {
  return Object.assign(Object.create(Object.getPrototypeOf(builder) as object) as T, builder);
}

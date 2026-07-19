/**
 * Keys which, if used to create a property on a plain object, can tamper with
 * the prototype chain (prototype pollution). Client-supplied strings that end
 * up as object keys must be rejected if they match one of these.
 *
 * Note: for *looking up* an existing entry, prefer `Object.hasOwn`, which
 * rejects every inherited key (including `toString`, `valueOf`, ...), not just
 * the ones listed here. `isUnsafeKey` is for the create path, where the key is
 * expected to be absent and `Object.hasOwn` would therefore let it through.
 */
const UNSAFE_KEYS: ReadonlySet<string> = new Set([
    "__proto__",
    "constructor",
    "prototype",
]);

export function isUnsafeKey(key: string): boolean {
    return UNSAFE_KEYS.has(key);
}

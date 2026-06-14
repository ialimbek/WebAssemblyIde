/**
 * Assert a condition is true, throw if not
 */
export function invariant(condition, message) {
    if (!condition) {
        throw new Error(`Invariant violation: ${message}`);
    }
}
/**
 * Utility for exhaustive switch checks
 * Usage: default: assertNever(value);
 */
export function assertNever(value) {
    throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
//# sourceMappingURL=assert.js.map
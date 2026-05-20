/** Create a success result */
export function ok(value) {
    return { ok: true, value };
}
/** Create a failure result */
export function err(error) {
    return { ok: false, error };
}
//# sourceMappingURL=result.js.map
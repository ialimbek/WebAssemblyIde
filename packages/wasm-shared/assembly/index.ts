// AssemblyScript port of pure-compute utilities from @webassembly-ide/shared.
// Sources (line-for-line behavioral parity):
//   - packages/shared/src/utils/id.ts
//   - packages/shared/src/utils/assert.ts
//
// AssemblyScript constraints honored:
//   - No DOM, no Promise, no fetch, no console
//   - No generics over Record<string, unknown>
//   - Date.now() and Math.random() are imported from the host
//   - Strings are AS native (UTF-16); no JSON.stringify (use plain message)

let counter: i32 = 0;

// Port of: generateId(prefix = "id"): string
export function generateId(prefix: string = "id"): string {
  counter += 1;
  const timestamp = i64(Date.now()).toString(36);
  const r: u32 = u32(Math.random() * 4294967295.0);
  const random = r.toString(36);
  const padded = random.length >= 6 ? random.substring(0, 6) : random;
  return prefix + "_" + timestamp + "_" + padded + "_" + counter.toString();
}

// Port of: shortId(): string
export function shortId(): string {
  const r: u32 = u32(Math.random() * 4294967295.0);
  const s = r.toString(36);
  if (s.length >= 8) return s.substring(0, 8);
  let out = s;
  while (out.length < 8) out = "0" + out;
  return out;
}

// Port of: invariant(condition, message): asserts condition
// AssemblyScript has no "asserts" return type; semantic is identical at runtime.
export function invariant(condition: bool, message: string): void {
  if (!condition) {
    throw new Error("Invariant violation: " + message);
  }
}

// Port of: assertNever(value): never
// AS has no `never` type; we accept i32 (or any value the caller chose to pass) and always throw.
export function assertNever(valueDescriptor: string): void {
  throw new Error("Unexpected value: " + valueDescriptor);
}

// ─── Internal (test-only) ───────────────────────────────────────────────────
// These are NOT part of the public package API. They exist to make benchmark
// runs deterministic by resetting the module-scoped counter, mirroring exactly
// what TS module-scope state looks like. They are intentionally prefixed with
// `__` and exported only via the `/internal` subpath in src/internal.ts.

export function __resetCounter(value: i32 = 0): void {
  counter = value;
}

export function __getCounter(): i32 {
  return counter;
}

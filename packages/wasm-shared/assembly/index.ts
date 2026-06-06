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

const FIELD_SEPARATOR = "\x1f";
const RECORD_SEPARATOR = "\x1e";

function normalizeCandidate(value: string, caseSensitive: bool): string {
  return caseSensitive ? value : value.toLowerCase();
}

function isWordChar(code: i32): bool {
  return (
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    code == 95
  );
}

function hasWordBoundary(value: string, start: i32, length: i32): bool {
  const before = start <= 0 ? 0 : value.charCodeAt(start - 1);
  const afterIndex = start + length;
  const after = afterIndex >= value.length ? 0 : value.charCodeAt(afterIndex);
  return !isWordChar(before) && !isWordChar(after);
}

// Component-runtime helper: fuzzy-ish score for command/file palette candidates.
// Higher scores are better. 0 means no match.
export function scoreMatch(candidate: string, query: string, caseSensitive: bool = false): i32 {
  const q = normalizeCandidate(query.trim(), caseSensitive);
  if (q.length == 0) return 1;

  const c = normalizeCandidate(candidate, caseSensitive);
  const exact = c.indexOf(q);
  if (exact >= 0) {
    const prefixBonus = exact == 0 ? 1000 : 0;
    return 2000 + prefixBonus + max(0, 512 - exact) + max(0, 512 - c.length);
  }

  let qi = 0;
  let score = 0;
  let streak = 0;
  let lastIndex = -1;
  for (let i = 0; i < c.length && qi < q.length; i++) {
    if (c.charCodeAt(i) == q.charCodeAt(qi)) {
      streak = lastIndex + 1 == i ? streak + 1 : 1;
      score += 20 + streak * 8 + max(0, 64 - i);
      lastIndex = i;
      qi += 1;
    }
  }

  if (qi != q.length) return 0;
  return score;
}

// Input: newline-delimited candidates. Output: record-delimited `index<US>score`.
// Ranking is intentionally left to JS so callers can preserve original payloads.
export function scoreDelimitedItems(items: string, query: string, limit: i32 = 500, caseSensitive: bool = false): string {
  const candidates = items.length == 0 ? new Array<string>() : items.split("\n");
  let out = "";
  let count = 0;
  for (let i = 0; i < candidates.length; i++) {
    const score = scoreMatch(candidates[i], query, caseSensitive);
    if (score <= 0) continue;
    if (out.length > 0) out += RECORD_SEPARATOR;
    out += i.toString() + FIELD_SEPARATOR + score.toString();
    count += 1;
    if (limit > 0 && count >= limit) break;
  }
  return out;
}

export function detectLanguageForPath(path: string): string {
  const lower = path.toLowerCase();
  const dot = lower.lastIndexOf(".");
  const ext = dot >= 0 ? lower.substring(dot + 1) : "";
  if (ext == "ts" || ext == "tsx") return "typescript";
  if (ext == "js" || ext == "jsx") return "javascript";
  if (ext == "rs") return "rust";
  if (ext == "py") return "python";
  if (ext == "go") return "go";
  if (ext == "json") return "json";
  if (ext == "css") return "css";
  if (ext == "html") return "html";
  if (ext == "yml" || ext == "yaml") return "yaml";
  if (ext == "toml") return "toml";
  if (ext == "sh") return "shell";
  if (ext == "md" || ext == "markdown") return "markdown";
  return "plaintext";
}

export function joinPath(parent: string, child: string): string {
  let p = parent.replace("\\", "/");
  let c = child.replace("\\", "/");
  while (p.endsWith("/")) p = p.substring(0, p.length - 1);
  while (c.startsWith("/")) c = c.substring(1);
  if (p.length == 0) return c;
  if (c.length == 0) return p;
  return p + "/" + c;
}

export function relativePath(path: string, root: string): string {
  if (root.length == 0) return path;
  const normalizedPath = path.replace("\\", "/");
  let normalizedRoot = root.replace("\\", "/");
  while (normalizedRoot.endsWith("/")) {
    normalizedRoot = normalizedRoot.substring(0, normalizedRoot.length - 1);
  }
  if (normalizedPath == normalizedRoot) return "";
  const prefix = normalizedRoot + "/";
  return normalizedPath.startsWith(prefix) ? normalizedPath.substring(prefix.length) : path;
}

export function lastDelimitedLines(lines: string, maxLines: i32): string {
  if (maxLines <= 0 || lines.length == 0) return "";
  const parts = lines.split("\n");
  const start = max(0, parts.length - maxLines);
  let out = "";
  for (let i = start; i < parts.length; i++) {
    if (out.length > 0) out += "\n";
    out += parts[i];
  }
  return out;
}

// Plain-text search accelerator for SearchPanel. Regex remains a JS fallback.
// Output: records of `line<US>column<US>match<US>before<US>after`, 1-based line/column.
export function findPlainTextMatches(
  content: string,
  query: string,
  caseSensitive: bool = false,
  wholeWord: bool = false,
  limit: i32 = 500,
): string {
  const q = normalizeCandidate(query, caseSensitive);
  if (q.length == 0 || limit <= 0) return "";

  const lines = content.split("\n");
  let out = "";
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    const originalLine = lines[i];
    const line = normalizeCandidate(originalLine, caseSensitive);
    const matchIndex = line.indexOf(q);
    if (matchIndex < 0) continue;
    if (wholeWord && !hasWordBoundary(line, matchIndex, q.length)) continue;

    if (out.length > 0) out += RECORD_SEPARATOR;
    out +=
      (i + 1).toString() + FIELD_SEPARATOR +
      (matchIndex + 1).toString() + FIELD_SEPARATOR +
      originalLine.substring(matchIndex, matchIndex + query.length) + FIELD_SEPARATOR +
      (i > 0 ? lines[i - 1] : "") + FIELD_SEPARATOR +
      (i + 1 < lines.length ? lines[i + 1] : "");

    count += 1;
    if (count >= limit) break;
  }
  return out;
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

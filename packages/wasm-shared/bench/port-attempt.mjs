// Brute-force AssemblyScript port attempt for every TypeScript file in the repo.
// For each .ts / .tsx file:
//   1. Copy to a temp scratch folder
//   2. Try to compile with `asc` (AssemblyScript compiler)
//   3. Record success / failure + first error line
// Produces .agent-journals/researches/<date>-ts-to-wasm-attempt-report.md

import { spawnSync } from "node:child_process";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  existsSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..", "..");
const scratchDir = join(
  repoRoot,
  ".agent-journals",
  "researches",
  "wasm-port-scratch",
);
const reportDir = join(repoRoot, ".agent-journals", "researches");

mkdirSync(scratchDir, { recursive: true });
mkdirSync(reportDir, { recursive: true });

function listTsFiles() {
  const out = spawnSync("git", ["ls-files", "*.ts", "*.tsx"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (out.status !== 0) {
    throw new Error(`git ls-files failed: ${out.stderr}`);
  }
  return out.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .filter(
      (f) =>
        !f.startsWith("node_modules/") &&
        !f.startsWith("dist/") &&
        !f.startsWith("target/") &&
        !f.includes("/dist/") &&
        !f.includes("/build/") &&
        !f.endsWith(".d.ts"),
    );
}

function categorize(file) {
  if (file.endsWith(".tsx")) return "React component (.tsx)";
  if (file.includes("vite.config")) return "Vite config";
  if (file.includes("/components/")) return "UI component";
  if (file.includes("/subagents/")) return "Agent subagent";
  if (file.endsWith(".test.ts") || file.endsWith(".spec.ts"))
    return "Test (vitest)";
  if (file.includes("/types/") || file.endsWith("/types.ts"))
    return "Type-only declarations";
  if (file.includes("/constants/")) return "Constants";
  if (file.includes("/utils/")) return "Utility";
  if (file.includes("apps/")) return "App module";
  if (file.includes("packages/")) return "Library module";
  return "Other";
}

function asc(inputPath) {
  const ascBin = join(
    repoRoot,
    "node_modules",
    "assemblyscript",
    "bin",
    "asc.js",
  );
  const outFile = join(scratchDir, "out.wasm");
  const r = spawnSync(
    "node",
    [
      ascBin,
      inputPath,
      "--target",
      "release",
      "--outFile",
      outFile,
      "--noEmit",
      "--noColors",
    ],
    { encoding: "utf8", timeout: 30_000 },
  );
  if (r.status === 0) return { ok: true };

  const out = `${r.stderr ?? ""}\n${r.stdout ?? ""}`;
  const errLine =
    out
      .split(/\r?\n/)
      .find((l) => /\bERROR\b|^.*\.ts\(\d+,\d+\):/i.test(l)) ??
    out.split(/\r?\n/).find((l) => l.trim().length > 0) ??
    "compilation failed";
  return { ok: false, firstError: errLine.trim().slice(0, 200) };
}

function shortReason(err) {
  if (/Cannot find name 'React'|JSX/i.test(err))
    return "JSX/React not supported in AS";
  if (/Cannot find name 'document'|window|HTMLElement/i.test(err))
    return "DOM API not available in AS";
  if (/Cannot find name 'Promise'|async|await/i.test(err))
    return "async/Promise not first-class in AS";
  if (/Cannot find name 'fetch'|XMLHttpRequest/i.test(err))
    return "fetch/HTTP not in AS";
  if (/Cannot find name 'console'/i.test(err)) return "console.* not in AS";
  if (/Cannot find name 'setTimeout|clearTimeout|setInterval'/i.test(err))
    return "Timer APIs not in AS";
  if (/Cannot find name 'structuredClone'/i.test(err))
    return "structuredClone not in AS";
  if (/Cannot find module/i.test(err))
    return "import resolves to JS-only module";
  if (/generic type parameters|type arguments/i.test(err))
    return "Generic over object shape not supported";
  if (/Cannot find name 'Record'|'Partial'|'Pick'/i.test(err))
    return "TS utility types not in AS stdlib";
  if (/JSON\./.test(err)) return "JSON.* not in AS (use plain strings)";
  if (/interface|union type|enum/i.test(err))
    return "TS-only type construct";
  return err.slice(0, 120);
}

const files = listTsFiles();
console.log(`Found ${files.length} TS/TSX files to attempt port for.\n`);

const results = [];
let idx = 0;
for (const rel of files) {
  idx++;
  const abs = join(repoRoot, rel);
  if (!existsSync(abs)) continue;

  const scratchFile = join(scratchDir, "input.ts");
  try {
    const content = readFileSync(abs, "utf8");
    writeFileSync(scratchFile, content);
  } catch (e) {
    results.push({
      file: rel,
      status: "REJECTED",
      reason: `read failed: ${e.message}`,
      category: categorize(rel),
    });
    continue;
  }

  const { ok, firstError } = asc(scratchFile);
  if (ok) {
    results.push({ file: rel, status: "PORTED", category: categorize(rel) });
    process.stdout.write(`[${idx}/${files.length}] OK   ${rel}\n`);
  } else {
    const reason = shortReason(firstError ?? "");
    results.push({
      file: rel,
      status: "REJECTED",
      reason,
      category: categorize(rel),
    });
    process.stdout.write(`[${idx}/${files.length}] FAIL ${rel}  -- ${reason}\n`);
  }
}

const ported = results.filter((r) => r.status === "PORTED");
const rejected = results.filter((r) => r.status === "REJECTED");

const byCategory = {};
for (const r of results) {
  byCategory[r.category] = byCategory[r.category] ?? {
    ported: 0,
    rejected: 0,
  };
  if (r.status === "PORTED") byCategory[r.category].ported++;
  else byCategory[r.category].rejected++;
}

const reportLines = [];
reportLines.push("# TS to AssemblyScript Port Attempt Report");
reportLines.push("");
reportLines.push(`Generated: ${new Date().toISOString()}`);
reportLines.push(
  `AssemblyScript compiler: node_modules/assemblyscript/bin/asc.js (--target release --noEmit)`,
);
reportLines.push("");
reportLines.push("## Summary");
reportLines.push("");
reportLines.push(`- Total TS/TSX files attempted: **${results.length}**`);
reportLines.push(
  `- PORTED (AS compiler accepted as-is): **${ported.length}**`,
);
reportLines.push(`- REJECTED (AS compiler refused): **${rejected.length}**`);
reportLines.push(
  `- Port rate: **${((ported.length / results.length) * 100).toFixed(2)}%**`,
);
reportLines.push("");
reportLines.push("## By Category");
reportLines.push("");
reportLines.push("| Category | Ported | Rejected |");
reportLines.push("|----------|--------|----------|");
for (const [cat, c] of Object.entries(byCategory).sort()) {
  reportLines.push(`| ${cat} | ${c.ported} | ${c.rejected} |`);
}
reportLines.push("");
reportLines.push("## PORTED files (AssemblyScript compiler accepted)");
reportLines.push("");
if (ported.length === 0) {
  reportLines.push("_(none)_");
} else {
  for (const r of ported) {
    reportLines.push(`- \`${r.file}\` _(${r.category})_`);
  }
}
reportLines.push("");
reportLines.push("## REJECTED files (with first compiler error)");
reportLines.push("");
reportLines.push("| File | Category | Reason |");
reportLines.push("|------|----------|--------|");
for (const r of rejected) {
  reportLines.push(`| \`${r.file}\` | ${r.category} | ${r.reason ?? ""} |`);
}

const reportPath = join(
  reportDir,
  `${new Date().toISOString().slice(0, 10)}-ts-to-wasm-attempt-report.md`,
);
writeFileSync(reportPath, reportLines.join("\n") + "\n");
console.log(`\nReport written to: ${reportPath}`);

rmSync(scratchDir, { recursive: true, force: true });
process.exit(0);

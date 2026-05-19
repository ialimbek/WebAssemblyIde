---
name: monorepo-bootstrap
description: WebAssemblyIde monorepo klasörleri, app/package/crate/service sınırları ve yerel bağımlılık standardı için bootstrap rehberi.
---

# Monorepo Bootstrap

## Usage

İlk proje iskeleti, app/package/crate/service klasörleri veya TypeScript/Rust standartları kurulurken kullan.

## Target Structure

- `apps/desktop`
- `apps/web`
- `apps/docs`
- `packages/ui`
- `packages/editor`
- `packages/ide-core`
- `packages/command-bus`
- `packages/performance-core`
- `packages/terminal-runtime`
- `packages/browser-runtime`
- `packages/scratchpad-runtime`
- `packages/agent-runtime`
- `packages/agent-tools`
- `packages/context-engine`
- `packages/ai-gateway`
- `packages/lsp-client`
- `packages/extension-api`
- `packages/devtools`
- `crates/desktop-host`
- `crates/wasm-parser`
- `crates/wasm-indexer`
- `crates/wasm-diff`
- `services/api`
- `services/auth`
- `services/token-vault`
- `services/runner`

## Guardrails

1. Lokal proje bağımlılıklarını kullan; global tool varsayma.
2. Paketleri bağımsız test edilebilir tasarla.
3. Bootstrap sırası için `TODO.md` → `İlk Başlanacak Minimum İş Sırası` bölümünü izle.
4. TODO maddelerini yalnızca uygulanıp doğrulandığında tamamlandı işaretle.

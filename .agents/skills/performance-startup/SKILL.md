---
name: performance-startup
description: Shell-first startup, lazy loading, worker-first execution ve local performance profiler kararlarında kullanılır.
---

# Performance and Startup

## Usage

`performance-core`, panel lazy loading, cache stratejisi veya startup ölçüm noktaları tasarlanırken kullan.

## Steps

1. Modülün critical startup path içinde mi lazy path içinde mi olduğunu belirle.
2. Ağır servisleri ilk render dışında tut.
3. First paint, interactive startup, workspace tree visible, first file open, Monaco ready, terminal ready, browser preview ready, agent ready ve indexing completion metriklerini düşün.
4. Secret içermeyen metadata/context için IndexedDB/OPFS veya SQLite/libSQL cache stratejisi öner.
5. CPU-heavy işleri worker/sidecar tarafına taşı.

## Validation

- Lazy import sınırları açık mı?
- Ağır Wasm/LSP/AI/terminal/browser yükleri startup yolundan çıkarılmış mı?
- UI thread bloklanıyor mu?

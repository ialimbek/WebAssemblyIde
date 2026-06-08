# Codembly Aşırı IDE Performansı ve Yaklaşık Sıfır Boşta RAM Planı

**Tarih:** 2026-06-08
**Temel:** `plans/build-performance-optimization.md` dosyasının mevcut depo durumuyla denetimi.
**Mod:** Sadece planlama/rapor. Uygulama kodu değişikliği yapılmadı.

---

## Amaç

Codembly'yi gerçek dünya projelerinde anında hissettirirken belleği düz veya daha düşük tutmak:

- IDE kabuğu neredeyse hemen açılır.
- İlk dosya açma/okuma/kaydetme yerel hızında hissettirir.
- Git değişiklikleri paneli UI'ı engellemeden açılır.
- Boşta duran uygulama ağır hizmetleri boşaltır veya kaçınır, böylece bellek minimal bir WebView kabuğuna yakındır.
- WASM sadece CPU-ağır saf hesaplama için daha agresif kullanılır, ancak kesin olarak gerekmedikçe kritik başlangıç yolunda asla yüklenmez.

---

## Teslimatlar

- Mevcut build/runtime performans planı için uygulama durumu raporu.
- Dosya açma/okuma/kaydetme, IDE başlangıcı, Git değişiklikleri başlangıcı, workspace hidrasyonu, WASM hızlandırması, cache stratejisi ve boşta bellek disiplinine odaklanan yeni faz bazlı optimizasyon planı.
- Açık başarı kriterleri, kısıtlamalar, etkilenen dosyalar/modüller ve doğrulama yaklaşımı.

---

## Başarı Kriterleri

Hedef sayılar masaüstü ve web'de aynı fixture workspaces ile yerel olarak ölçülmelidir.

| Alan | Hedef |
| --- | --- |
| Soğuk uygulama kabuğu görünür | <= 500 ms masaüstü, <= 800 ms web |
| Etkileşimli kabuk | <= 800 ms masaüstü, <= 1200 ms web |
| Son workspace ağaç anlık görüntüsünü aç | Cache'ten <= 150 ms |
| İlk küçük metin dosyasını aç | Tıklamadan sonra <= 50 ms, Monaco ilk yük soğuk maliyeti hariç |
| Monaco soğukla ilk dosyayı aç | Editör görünür için <= 700 ms, dil yüklemeleri ertelenmiş |
| Dosya okuma yerel köprü ek yükü | Workspace açıldıktan sonra küçük dosyalar için <= 10 ms |
| Küçük dosyayı kaydet | <= 30 ms p95 masaüstü, yazma kabul edildikten hemen sonra async UI onayı |
| Git durum paneli görünür | Cache edilmiş durumla <= 150 ms, yenileme arka planda stream edilir |
| Workspace yok sonrası boşta RAM | Sadece minimal kabuk; Monaco, WASM, Git, Agent, Terminal yüklenmez |
| Workspace kapandıktan sonra boşta RAM | GC/unload döngüsünden sonra sadece kabuk bellek bandına dönüş |

---

## Kısıtlamalar

- `ARCHITECTURE.md`'ı koru: shell-first başlangıç, worker-first yürütme, ertelenmiş WASM/LSP/AI/terminal/browser/git, IndexedDB/OPFS veya SQLite/libSQL üzerinden kalıcı cache.
- Modül sınırlarını koru: UI panelleri çekirdek iş mantığına sahip olmamalı; Agent Runtime Tool Registry/Command Bus sınırlarını kullanmalı.
- Hızı artırmak için boşta RAM'i artırma. Hız iyileştirmeleri lazy loading, caching, native/Rust sidecar iş, worker yürütme ve artımlı hidrasyondan gelmeli.
- Tam terminal/build sistemlerini WASM'e koyma.
- WASM'i parsing, indexing, search, fuzzy ranking, diff/patch yardımcıları, AST özetleri ve metin dönüşümleri için JS'yi yendiğinde ve worker'da çalışabildiğinde kullan.
- Modül import zamanında WASM yüklemekten kaçın.

---

## Mevcut Plan Uygulama Durumu

### Özet

Mevcut plan **kısmen uygulanmış**. Build seviyesi optimizasyonları runtime optimizasyonlarından daha güçlü. Birkaç dosya/sınıf var, ancak birçok uygulama yoluna bağlı değil, bu yüzden beklenen hız/RAM faydasını henüz sunmuyorlar.

| Faz | Durum | Kanıt | Kalan Boşluk |
| --- | --- | --- | --- |
| Faz 1: Vite build optimizasyonu | Kısmen uygulanmış | `apps/web/vite.config.ts` manuel chunk'lar, Terser fallback, CSS bölme, görselleştirici, PWA opsiyonel eklenti, web external seçeneği var. 21 paket manifestinde `sideEffects` var. | `file-system-adapter.ts` ve `GitService.ts` hala statik olarak Tauri API'lerini import ediyor. `vendor-icons` chunk ilgili değil/lucide bağımlılığı bulunamadı. Masaüstü Vite config hala kalıntı. Saf web externalizasyonu tamamlanmamış. |
| Faz 2: Rust/Tauri build optimizasyonu | Çoğunlukla uygulanmış | Kök `Cargo.toml` `profile.dev`, `profile.release` ve `workspace.dependencies` var. `.cargo/config.toml` var. Workspace üyeleri sadece `apps/desktop/src-tauri` içeriyor, bu yüzden iskelet crate'ler normal workspace buildlerinden hariç. | `.cargo/config.toml` sadece Windows MSVC linker bayrağı var; plandaki Linux mold config yok. İskelet crate'ler doğrudan build edilirse hala bağımlılıklar içeriyor. `desktop-host` hala yinelenen/stub crate olarak var ama workspace'te değil. |
| Faz 3: Monorepo build orkestrasyonu | Kısmen uygulanmış | `turbo.json` var; kök scriptler `build:turbo`, `typecheck` içeriyor; paket build/typecheck scriptleri var. | Kök `npm run build` hala `tsc --build` kullanıyor, varsayılan olarak Turbo değil. Kök `tsconfig.json` sadece 12 paketi referans alıyor, tüm paket çıktılarını değil. Turbo benimsenmesi mevcut ama birincil yol değil. |
| Faz 4: Başlangıç/runtime performansı | Zayıf uygulanmış | `StartupProfiler` ve `LazyModuleRegistry` var; `main.tsx` ilk paint'i ölçüyor; Monaco dil yüklemesi dil başına; markdown ve diff cache'leri için LRU cap'ler var. | `IDEProvider` hala başlangıçta `GitService`, `TerminalSessionManager`, `AgentOrchestrator`, yöneticiler, i18n/accessibility ve theme yapılandırıyor. Worker dosyaları var ama örneklenmiyor. Search ve fuzzy scoring hala main thread'de çalışıyor. List virtualizasyonu veya `React.memo` kullanımı bulunamadı. WASM hala shared utilities üzerinden erken import ediliyor. |
| Faz 5: Caching/persistence | İskelet uygulanmış | `IndexedDbCache`, `SqliteCache`, `apps/web/src/sw.ts` ve PWA config var. | Cache sınıfları export edilmiş ama workspace tree, git status, dosya metadata, session restore, son workspaces veya editör durumu tarafından kullanılmıyor. SQLite köprüsünün masaüstü implementasyonu yok. Service worker minimal. |
| Faz 6: Context/state optimizasyonu | Çoğunlukla uygulanmamış | `useDeferredValue` sadece `CommandPalette`'da var. Diff ve markdown cache'leri sınırlı. | `IDEContext` monolitik kalıyor; herhangi bir context güncellemesi geniş re-render'ları tetikleyebilir. Dosya ağacı, Git status, search, bildirimler için sistemsel geçişler/ertelenmiş güncellemeler yok. Virtualizasyon yok. |
| Faz 7: AssemblyScript WASM optimizasyonu | Kısmen uygulanmış | `asconfig.json` `optimizeLevel: 3`, `shrinkLevel: 2`, `converge`, `noAssert` var; `wasm-opt` scripti var. | `exportRuntime` `true` kalıyor, muhtemelen mevcut string marshaling tarafından gerekli. Optimize edilmiş script varsayılan build değil. WASM hala `void waitForWasm()` üzerinden import zamanında istekli yükleniyor. |

---

## Temel Denetim Bulguları

1. **WASM dolaylı olarak başlangıç yolunda.** `packages/shared/src/utils/id.ts` ve `assert.ts` `@webassembly-ide/wasm-shared`'dan re-export yapıyor; `StartupProfiler` `generateId` kullanıyor, bu yüzden başlangıç `wasm-shared`'ı import ediyor. `wasm.ts` sonra import zamanında `void waitForWasm()` başlatıyor.
2. **LazyModuleRegistry lazy runtime davranışını zorlamıyor.** Modülleri kaydediyor, ancak `IDEProvider` Git, Terminal, Agent, Workspace, AutoSave, UndoRedo, Accessibility, i18n ve Theme yöneticilerini istekli oluşturuyor.
3. **Worker'lar iskelet, aktif hızlandırma değil.** `search-worker.ts`, `fuzzy-worker.ts`, `parse-worker.ts` ve `git-worker.ts` var, ancak hiçbir `new Worker(...)` kullanımı bulunamadı.
4. **Search hala main-thread ağır.** `SearchPanel` dosyaları sırayla okuyor ve eşleşmeleri UI bileşen döngüsünde çalıştırıyor.
5. **Git status masaüstünde işlem başına eylem.** Tauri `git` komutlarını `std::process::Command` üzerinden çalıştırıyor; kalıcı Git status servisi, cache, watch-tetiklenen birleştirme veya arka plan yenileme kuyruğu yok.
6. **Workspace tree cache sadece bellek içi.** `WorkspaceManager` basit bir `treeCache`'e sahip, ancak IndexedDB/SQLite'a kalıcı değil ve yazma/silme/yeniden adlandırmada geniş geçersiz kılınıyor.
7. **Dosya okuma/yazma basit ve doğru, ancak büyük dosyalar için optimize edilmemiş.** Masaüstü tüm dosyayı belleğe okuyor ve `String`'e dönüştürüyor; tüm içeriği `fs::write` ile yazıyor. Chunked read, mmap stratejisi, binary koruma, büyük dosya koruma, read-through cache veya save journal yok.
8. **List virtualizasyonu yok.** Büyük explorer/search/git/bildirim listeleri çok sayıda DOM düğümü ve ekstra React işi oluşturabilir.
9. **Masaüstü Vite config bir bakım tuzağı olarak kalıyor.** `apps/desktop/vite.config.ts` hala minimal kalıntı bir config iken masaüstü aslında web build'ini sunuyor.
10. **Build optimizasyonları runtime optimizasyonlarının önünde.** Repo chunking, sideEffects, Terser, profiller, Turbo ve paket scriptlerine sahip, ancak runtime hala UI yolunda çok fazla yükleniyor ve hesaplıyor.

---

## Yeni Aşırı Performans Stratejisi

Yeni strateji "her şeyi daha hızlı yükle" değil; "neredeyse hiçbir şey yükle, sonra kullanıcının dokunduğu şeyi tam olarak hidrate et, önce cache'ten, worker/sidecar üzerinde, boşta olduğunda agresif tahliye ile."

### Mimari Prensip

```txt
Başlangıç Kabuğu
  -> sadece cache edilmiş UI durumu
  -> workspace anlık görüntüsü sadece son workspace restore ediliyorsa
  -> Monaco ilk editör yüzeyine ihtiyaç duyana kadar yok
  -> WASM CPU-ağır hesaplama ihtiyaç duyana kadar yok
  -> Git süreci Source Control açılana veya workspace watcher Git-relevant değişiklikler raporlayana kadar yok
  -> Agent/Terminal/LSP/Browser/Scratchpad panel aktivasyonuna kadar yok
```

---

## Faz X0: Ölçüm Temel Çizgisi ve Performans Kapıları

**Amaç:** Tahmin etmeyi bırak. Her hız/RAM iddiasını implementasyondan önce ölçülebilir yap.

**Teslimatlar:**

- Yerel performans fixture workspaces: tiny, medium, 10k dosya, 100k dosya metadata-only, büyük Git repo, büyük tek dosya.
- Perf senaryoları: soğuk başlatma, sıcak başlatma, workspace açma, ilk dosya açma, dosya kaydetme, Source Control açma, search sorgusu, 60s boşta, workspace kapatma.
- Dosya okuma/yazma, Tauri invoke gecikmesi, ağaç taraması, Git status, Monaco init, WASM init, worker iş süresi, cache hit/miss, bellek tahmini için yerel profiler olayları.
- Sadece performans doğrulaması için açıkça çalıştırıldığında başarısız olan CI/yerel kapı scripti.

**Etkilenen dosyalar/modüller:**

- `packages/performance-core/src/*`
- `apps/web/src/main.tsx`
- `apps/web/src/ide-context.tsx`
- `apps/web/src/platform/file-system-adapter.ts`
- `apps/desktop/src-tauri/src/lib.rs`
- `packages/devtools/src/*`

**Doğrulama:**

- Her fazdan önce ve sonra senaryo paketini çalıştır.
- p50/p95 gecikme ve bellek anlık görüntülerini kaydet.

---

## Faz X1: Gerçek Sadece-Shell Başlangıç

**Amaç:** Boşta/workspace yok başlangıcı Git, Agent, Terminal, Monaco, WASM, isomorphic-git, marked, LSP, Browser, Scratchpad veya minik arayüzlerin ötesinde tam workspace yöneticilerini yüklememeli.

**Teslimatlar:**

- `IDEProvider`'ı ince bir Shell Provider ve lazy domain provider'lara böl.
- İstekli sınıf yapımını Git, Terminal, Agent, Monaco, cache, worker'lar ve WASM için factory/proxy'lerle değiştir.
- `@webassembly-ide/wasm-shared`'ı `@webassembly-ide/shared` başlangıç yolundan çıkar. `generateId` ve assertion'lar başlangıç-kritik shared utilities'da saf JS olmalı; WASM utilities compute runtime üzerinden opt-in olmalı.
- Import yolundan `void waitForWasm()`'ı kaldır; WASM'ı sadece açık bir async compute runtime veya worker preload üzerinden boşta sonrası başlat.
- `file-system-adapter.ts` ve `GitService.ts`'daki statik Tauri import'larını runtime-checked dynamic import'lara dönüştür.

**Etkilenen dosyalar/modüller:**

- `apps/web/src/ide-context.tsx`
- `apps/web/src/main.tsx`
- `packages/shared/src/utils/id.ts`
- `packages/shared/src/utils/assert.ts`
- `packages/wasm-shared/src/wasm.ts`
- `apps/web/src/hooks/useWasmComponentRuntime.ts`
- `apps/web/src/platform/file-system-adapter.ts`
- `apps/web/src/services/GitService.ts`

**Doğrulama:**

- Bundle trace saf web başlangıç chunk'ında `wasm-shared`, `isomorphic-git`, `monaco-editor`, `marked`, terminal, agent veya Tauri chunk'ı olmadığını doğrular.
- Workspace yok başlatma sonrası başlangıç belleği sadece-shell.

---

## Faz X2: Anlık Workspace Açma Anlık Görüntü Hidrasyonu

**Amaç:** Workspace ağacı önce kalıcı cache'ten görünür, sonra arka planda artımlı olarak yenilenir.

**Teslimatlar:**

- Workspace ağacı anlık görüntülerini kök yolu, mtime/version hash, ignore config ve app şema versiyonu ile anahtarlanarak kalıcı yap.
- `SqliteCacheBridge` arkasında masaüstü SQLite cache implementasyonu.
- Web IndexedDB cache wiring için browser/demo/OPFS modu.
- Artımlı ağaç hidrasyonu: önce kök girdiler, talep üzerine genişletilmiş klasörler, iptal ile arka plan yenileme kuyruğu.
- Platform gerektirdiğinde kaba watcher ve talep üzerine stat partileri kullanarak devasa repo'lar için recursive watcher bellek baskısından kaçın.

**Etkilenen dosyalar/modüller:**

- `packages/ide-core/src/workspace-manager.ts`
- `packages/ide-core/src/cache/indexeddb-cache.ts`
- `packages/ide-core/src/cache/sqlite-cache.ts`
- `apps/web/src/components/ExplorerPanel.tsx`
- `apps/web/src/platform/file-system-adapter.ts`
- `apps/desktop/src-tauri/src/lib.rs`

**Doğrulama:**

- Sıcak workspace ağacı görünür <= 150 ms.
- Büyük ignore edilmiş klasörler açık gecikmeyi doğrusal olarak artırmaz.
- 100k dosyalı bir workspace açarken bellek sınırlı kalır.

---

## Faz X3: Yerel-Hızlı Dosya Okuma, Açma ve Kaydetme

**Amaç:** Dosya işlemleri RAM'de gereksiz yinelenen içerik tutmadan anında hissettirmeli.

**Teslimatlar:**

- Masaüstü dosya metadata cache'i: yol, boyut, mtime, hash-lite, encoding, son açıldı offset/window.
- Küçük dosya hızlı yolu: tek yerel okuma, anında editör modeli hidrasyon.
- Büyük dosya koruması: önizleme modu, chunked/lazy okuma, satır index sidecar, binary tespiti, kullanıcı onaylı tam yükleme.
- Kaydetme hattı: temp dosyaya yaz, atomik yeniden adlandırma, metadata cache'i güncelle, birleştirilmiş bir olay emit; UI "kabul edildi"yi hemen işaretler ve yerel yazma tamamlandığında kalıcı olduğunu onaylar.
- Hızlı editlerde backpressure ve iptal ile debounced auto-save kuyruğu.
- Mümkün olduğunda yinelenen string'lerden kaçın: Monaco zaten modeli sahipse workspace cache'te tam dosya içeriğini tutma; metadata ve kirli durumu ayrı sakla.

**Etkilenen dosyalar/modüller:**

- `apps/desktop/src-tauri/src/lib.rs`
- `apps/web/src/platform/file-system-adapter.ts`
- `packages/ide-core/src/workspace-manager.ts`
- `packages/editor/src/editor-manager.ts`
- `packages/editor/src/editor-model.ts`
- `packages/ide-core/src/auto-save.ts`

**Doğrulama:**

- Küçük dosya okuma/açma p95 <= 50 ms workspace sıcak sonrası.
- Kaydetme p95 <= 30 ms masaüstü küçük dosyalar için.
- Büyük dosya UI donması veya büyük RAM sıçraması olmadan korumalı önizlemede açılır.

---

## Faz X4: 150 ms Altında Git Değişiklikleri Paneli

**Amaç:** Source Control cache'ten anında açılır ve UI'ı engellemeden arka planda yenilenir.

**Teslimatlar:**

- Git status cache'i workspace başına kalıcı: branch, HEAD, status girdileri, son yenileme zaman damgası.
- Bir UI isteği başına komut yerine birleştirilmiş yenileme kuyruğu ile masaüstü arka plan Git servisi.
- Daha hızlı, parse-stable çıktı için `git status --porcelain=v2 -z --branch --untracked-files=normal` kullan.
- Sadece Git cache'ini geçersiz kılmak için `.git/index`, `.git/HEAD` ve working tree olaylarını izle.
- Devasa repo'lar için UI'ya partiler halinde status girdileri stream et.
- JS parsing ölçülebilir bir darboğaz olursa WASM/Rust parser porcelain çıktısı için.
- `HEAD:path` ve dosya mtime ile diff içerik cache'i; diff'ı sadece bir dosya satırı açıldığında yükle, Source Control açıldığında değil.

**Etkilenen dosyalar/modüller:**

- `apps/web/src/services/GitService.ts`
- `apps/web/src/components/CorePanels.tsx`
- `apps/desktop/src-tauri/src/lib.rs`
- `packages/shared/src/workers/git-worker.ts`
- Gelecekte `crates/wasm-diff` veya masaüstü Rust git yardımcısı

**Doğrulama:**

- Source Control paneli ilk paint cache'ten <= 150 ms.
- Arka plan yenileme yazma veya panel etkileşimini engellemez.
- 5k değişmiş dosya fixture'ı duyarlı ve virtualized kalır.

---

## Faz X5: Worker-First Compute Runtime

**Amaç:** Search, fuzzy ranking, markdown parsing, Git özetleme, diff hazırlama ve index güncellemeleri main thread'den ayrılır.

**Teslimatlar:**

- İş ID'leri, iptal, timeout, transfer-friendly payload'lar ve sonuç partileme ile worker yöneticisi paketi.
- Mevcut `search-worker.ts`, `fuzzy-worker.ts`, `parse-worker.ts`, `git-worker.ts`'ı UI yollarına bağla.
- Search dosyaları partili bir üretici üzerinden okur ve chunk'ları worker'a gönderir; sonuçlar kademeli olarak geri stream eder.
- Command Palette fuzzy scoring aday sayısı eşiği aştığında worker'a taşır; küçük listeler worker ek yükünden kaçınmak için sync kalır.
- Markdown önizleme parsing worker'a taşır ve çıktıyı cache'ler.
- Worker'lar boşta timeout sonrası sonlanır ve belleği serbest bırakır.

**Etkilenen dosyalar/modüller:**

- `packages/shared/src/workers/*`
- `apps/web/src/components/SearchPanel.tsx`
- `apps/web/src/components/CommandPalette.tsx`
- `apps/web/src/components/MarkdownPreview.tsx`
- `apps/web/src/services/GitService.ts`
- Yeni worker runtime paketi veya `packages/performance-core/src/worker-runtime.ts`

**Doğrulama:**

- Search/fuzzy/markdown işlemleri sırasında main thread uzun görevleri düşer.
- Boşta worker sonlandırması belleği geri döndürür.

---

## Faz X6: WASM Hızlandırma Genişlemesi, Ancak Ertelenmiş

**Amaç:** Ağır saf hesaplama için WASM kullanırken başlangıç ve boşta RAM'i düşük tut.

**Teslimatlar:**

- Başlangıç genişliği WASM re-export'larını açık `ComputeRuntime` API ile değiştir.
- WASM modülleri sadece worker'lar içinde veya ilk compute-ağır özellik aktivasyonundan sonra yüklenir.
- AssemblyScript `wasm-shared` sadece küçük utilities için benchmark kazanırsa kalır; aksi takdirde küçük başlangıç utilities'ini JS'e geri taşı.
- Rust/WASM `wasm-diff` POC Myers/patience diff, patch doğrulama ve büyük diff özeti için.
- Rust/WASM `wasm-indexer` POC artımlı metin index ve symbol-lite kayıtları için.
- Rust/WASM `wasm-parser` POC tree-sitter ile açılan dosya sembol çıkarma önce, tüm-repo indexing değil.
- Desteklendiğinde streaming instantiate; normal instantiate'a fallback.
- WASM bellek yaşam döngüsü politikası: worker başına instantiate, worker boşta sonrası sonlandır, boşta shell için asla serbest bırakılmayan global WASM örneği yok.

**Etkilenen dosyalar/modüller:**

- `packages/wasm-shared/src/*`
- `packages/wasm-shared/assembly/index.ts`
- `crates/wasm-diff/*`
- `crates/wasm-indexer/*`
- `crates/wasm-parser/*`
- `packages/shared/src/workers/*`
- `packages/context-engine/src/*`

**Doğrulama:**

- Her fonksiyon için JS vs WASM benchmark payload eşiği ile.
- WASM workspace yok başlangıç chunk'ında veya ilk bellek profilinde yok.

---

## Faz X7: Virtualized UI ve Render Kapsama

**Amaç:** Büyük listeler büyük DOM/React bellek baskısı oluşturmaz.

**Teslimatlar:**

- Explorer ağacı, Search sonuçları, Source Control değişiklikleri, büyük aday setleri için Command Palette, Bildirimler geçmişi, Problems listesi virtualize et.
- Monolitik context'i böl veya selector-based stores tanıt, böylece ilişkisiz güncellemeler tüm panelleri re-render etmez.
- Sadece profiling row re-render baskısı gösterdiği yerlerde row bileşenlerini memoize et.
- Git/search/tree yenilemeleri için `useDeferredValue`, transitions ve partili güncellemeler kullan.
- Panel seviyesi görünürlük kapıları ekle: gizli paneller ağır güncellemelere abone olmaz.

**Etkilenen dosyalar/modüller:**

- `apps/web/src/ide-context.tsx`
- `apps/web/src/components/ExplorerPanel.tsx`
- `apps/web/src/components/SearchPanel.tsx`
- `apps/web/src/components/CorePanels.tsx`
- `apps/web/src/components/CommandPalette.tsx`
- Bildirim ve problems UI modülleri

**Doğrulama:**

- DOM düğüm sayısı büyük veri setleri altında sınırlı kalır.
- React profiler tek seçim/güncelleme değişiklikleri için küçük render yüzeyleri gösterir.

---

## Faz X8: Boşta Bellek Geri Alma

**Amaç:** Boşta olduğunda, uygulama kullanıcı verisine zarar vermeden agresif ağır kaynakları serbest bırakır.

**Teslimatlar:**

- `performance-core`'da aktivite sinyalleri, panel görünürlüğü, workspace durumu, kirli durum ve mümkün olduğunda bellek baskısı ipuçlarını kullanan boşta koordinatör.
- Boşta sonrası worker'ları unload/sonlandır.
- Kapatılmış sekmeler için Monaco modellerini dispose et ve açık model sayısını cap et.
- Panel kapandıktan sonra RAM'de Git cache detaylarını serbest bırak; diskte kalıcı cache'i tut.
- İnaktif Agent/Terminal/Browser/Scratchpad panellerini dehidrate et.
- Workspace kapatma sadece-shell durumuna döner.
- Opsiyonel "Eco Boşta Modu": N dakika sonra, sadece kabuk, son workspace metadata, kirli yedek durumu ve bildirimler özetini tut.

**Etkilenen dosyalar/modüller:**

- `packages/performance-core/src/*`
- `apps/web/src/ide-context.tsx`
- `packages/editor/src/editor-manager.ts`
- `packages/editor/src/editor-model.ts`
- `apps/web/src/services/GitService.ts`
- Worker runtime modülleri

**Doğrulama:**

- Paneller/workspace kapandıktan sonra boşta bellek kabuk temel çizgisine yakın döner.
- Dehidrasyon/rehidrasyon sırasında kirli veri kaybı yok.

---

## Önerilen Uygulama Sırası

1. X0 ölçüm temel çizgisi.
2. X1 gerçek sadece-shell başlangıç ve kritik yoldan WASM import kaldırma.
3. X2 workspace anlık görüntü hidrasyonu.
4. X3 dosya okuma/açma/kaydetme hızlı yolu.
5. X4 Git cache/arka plan servisi.
6. X5 worker-first compute runtime.
7. X7 virtualization/render kapsama.
8. X6 daha derin WASM parser/indexer/diff genişlemesi.
9. X8 boşta bellek geri alma ve Eco Boşta Modu.

Gerekçe: önce başlangıç/RAM regresyonlarını kaldır, sonra en yaygın kullanıcı eylemlerini anında yap, sonra compute hızlandırmasını güvenli genişlet.

---

## Öncelikle Düzeltilecek Yüksek Riskli Mevcut Öğeler

| Risk | Neden Önemli | İlk Düzeltme |
| --- | --- | --- |
| WASM shared başlangıç utilities'ından yükleniyor | Kullanıcı compute ihtiyaç duymadan önce başlangıç ve boşta bellek maliyeti ekler | Başlangıç `generateId`/assert'i JS'e geri taşı veya lazy compute API |
| İstekli `IDEProvider` yöneticileri | Shell-first mimariyi yener | Shell provider ve lazy domain provider'ları böl |
| Main thread'de search | Büyük repo'lar UI'ı dondurur | Worker streaming search |
| İstek başına Git status süreci | Yavaş panel ve tekrarlanan işlem başlangıcı | Cache edilmiş arka plan Git status servisi |
| Kalıcı ağaç anlık görüntüsü yok | Workspace açma disk taraması ile ölçeklenir | IndexedDB/SQLite anlık görüntü hidrasyonu |
| Virtualizasyon yok | Büyük listeler DOM/RAM tüketir | Önce Explorer/Search/SCM virtualize et |

---

## Doğrulama Yaklaşımı

- **Yapısal:** bundle analyzer, bağımlılık trace, yasaklanmış başlangıç import'ları için grep.
- **Runtime:** yerel başlangıç profiler, Performance API işaretleri, React profiler, Chrome/Tauri WebView bellek anlık görüntüleri.
- **Native:** read/write/list/git işlemleri için Tauri komut gecikme logları.
- **Worker:** search/fuzzy/markdown/git işlemleri öncesi/sonrası uzun görev izleme.
- **WASM:** her aday fonksiyonu için eşiği ile benchmark; worker/WASM ek yükü daha yüksekse küçük girdiler için JS tut.
- **Regresyon:** `npm run build`, `npm run test`, `cargo check --workspace`, web build kontrolü ve masaüstü smoke senaryoları.

---

## Mevcut Sonuç

Önceki plan tamamen uygulanmadı. Repo birçok doğru temele sahip, ancak en büyük hız/RAM kazanımları henüz gerçekleştirilmedi çünkü runtime wiring hala istekli ve main-thread-ağır. Bir sonraki belirleyici iyileştirme başka bir build tweak değil; başlangıç yolundan WASM/Git/Agent/Terminal/Monaco kaldırmak, workspace/Git/dosya verilerini kalıcı cache'ten hidrate etmek, compute'u worker'lara taşımak ve boşta sonrası belleği geri almaktır.

# Phase B Reliability Fixes

Faz B (Desktop-first IDE Shell) hedefleri doğrultusunda yapılan incelemeler sonucunda, gerçek kullanım senaryolarında güvenilirliği düşüren bazı entegrasyon eksiklikleri tespit edilmiştir. 

## Sorun Tespiti (Bulgular)

1. **Editor ve Workspace Senkronizasyon Kopukluğu (Rename/Delete):**
   - Workspace (ExplorerPanel veya harici bir süreç) üzerinden bir dosya yeniden adlandırıldığında (`renameFile`), `EditorManager` ve altındaki `EditorModelManager` bu durumdan haberdar olmuyor. Eski dosya yoluyla açık kalan tablar kaydedilmeye çalışıldığında ya yeni dosya oluşturuyor ya da hata veriyor.
   - Harici dosya silinmesi (`App.tsx` içindeki `handleExternalFileChange`) kısmen ele alınmış ancak `rename` senaryosu tam entegre değil.

2. **Auto-Save Mekanizmasının Pasif Olması:**
   - `AutoSaveManager` sınıfı doğru tasarlanmış olmasına rağmen, `apps/web/src/ide-context.tsx` içinde provider oluşturulurken **kapalı** (`enabled: false`) olarak başlatılıyor. Bu nedenle "Focus Loss", "Tab Close" ve debounced otomatik kaydetme özellikleri gerçekte çalışmıyor.

3. **Harici Değişikliklerde Editor Model Güncelleme:**
   - Dışarıdan dosya içeriği değiştiğinde tetiklenen `reloadOpenFileFromDisk` fonksiyonu, Monaco editörüne güncel içeriği aktarırken, editör state'inde (dirty flag vb.) anlık tutarsızlıklara sebep olabilecek basit bir mantığa sahip.

## Proposed Changes

### @webassembly-ide/editor

Dosya yeniden adlandırma (rename) işlemlerinde model ve tab bilgilerinin güncellenebilmesi için gerekli metodların eklenmesi.

#### [MODIFY] packages/editor/src/editor-model.ts
- `renameModel(oldUri: FileUri, newUri: FileUri)` metodunun eklenmesi. Bu metod:
  - Eski URI'deki modeli yeni URI'ye taşıyacak.
  - Model bilgisindeki (`info.uri`, `info.fileName`) alanları güncelleyecek.
  - Listeners (dinleyiciler) ve markers için gereken aktarımı sağlayacak.

#### [MODIFY] packages/editor/src/editor-manager.ts
- `renameFile(oldUri: FileUri, newUri: FileUri)` metodunun eklenmesi.
  - `this.models.renameModel` çağrılacak.
  - Eğer dosya tablarda açıksa, tabın `uri` ve `title` bilgisi güncellenecek.
  - Aktif URI güncellenen dosyaysa, `this.activeUri` yeni URI ile değiştirilecek.
  - `cursorPositions` map'i güncellenecek.
  - Tab değişimi event'leri fırlatılacak.

---

### @webassembly-ide/web (Web App)

Editör yeniliklerinin UI katmanına bağlanması ve AutoSave mekanizmasının aktifleştirilmesi.

#### [MODIFY] apps/web/src/ide-context.tsx
- `AutoSaveManager` başlatılırken `enabled: false` ayarının `enabled: true` olarak değiştirilmesi. Böylece Faz B hedefleri arasındaki auto-save özelliği aktif olarak çalışacak.

#### [MODIFY] apps/web/src/components/ExplorerPanel.tsx
- `handleRename` fonksiyonunun güncellenmesi.
- `workspace.renameFile(path, newPath)` çağrısından hemen sonra `editor.renameFile(path, newPath)` metodunun çağrılarak UI ile Editor core'un senkronize edilmesi.

#### [MODIFY] apps/web/src/App.tsx
- `handleExternalFileChange` fonksiyonunda `event.type === "renamed"` koşulu için de `editor.renameFile(event.path, event.newPath)` çağrısının eklenmesi, böylece dışarıdan yapılan isimlendirme değişikliklerinde editörün çökmesinin/hata vermesinin önlenmesi.

## Verification Plan

### Manual Verification
1. Workspace içerisinden bir dosya açılır ve sekmede görünür.
2. Explorer panel üzerinden bu dosyanın adı değiştirilir.
3. Editör sekmesinin anında yeni adı aldığı ve içeriği kaybetmediği doğrulanır.
4. Dosyaya yazım yapılır ve 1 saniye sonra `AutoSaveManager` tarafından otomatik kaydedildiği terminal logları / dirty indicator (●) üzerinden doğrulanır.
5. Harici bir klasörde Tauri file watcher aktifken (veya in-memory testlerde) bir dosya rename edildiğinde uygulamanın düzgün tepki verdiği görülür.

## User Review Required

> [!IMPORTANT]
> - Faz B için tespit edilen "gerçek kullanım senaryosu" hataları büyük oranda editor senkronizasyonu ve konfigürasyon (auto-save kapalı kalması) eksikliğinden kaynaklanıyor.
> - Onayınızla birlikte yukarıdaki değişiklikleri hızlıca koda döküp entegrasyonu tamamlayacağım.

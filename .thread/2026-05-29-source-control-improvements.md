# WebAssemblyIde - Changes Thread

**Tarih:** 29 Mayıs 2026 - Çarşamba

---

## 1. Source Control Badge (Activity Bar)

**Dosyalar:** `apps/web/src/App.tsx`

- Activity Bar'daki Source Control butonuna mavi daire içinde değişiklik sayısı eklendi
- `ActivityBar` bileşenine `scmChangesCount` prop'u eklendi
- `scmChangesCount` state'i `AppContent`'te `git.onChanged()` ile güncelleniyor
- Sayı 99'u geçerse "99+" gösteriliyor
- Badge: `position: absolute`, `border-radius: 50%`, `background: #007acc`, sağ üst köşede

## 2. Source Control Dosya Tıklama → Editör Tab + Monaco Diff

**Dosyalar:** 
- `apps/web/src/components/CorePanels.tsx` — `onShowDiff` handler'ları değiştirildi, diff cache eklendi
- `apps/web/src/services/GitService.ts` — `getHeadBlob()` metodu eklendi (HEAD blob okuma)
- `apps/web/src/components/EditorPanel.tsx` — `DiffPanel` bileşeni, `isDiffUri()` kontrolü, `getDiffData()` import

**Nasıl çalışıyor:**
- SCM panelinde dosyaya tıklandığında:
  1. HEAD blob içeriği (`getHeadBlob`) ve workspace dosya içeriği okunuyor
  2. Dosya `{filename} (Working Tree)` başlığıyla editör tab olarak açılıyor
  3. Diff verisi `diffCache`'e kaydediliyor (`{original: head, modified: workspace}`)
  4. `diff:{filepath}` URI ile ikinci bir tab açılıyor, başlığı `{filename} (Diff)`
- Diff tab'i aktif olduğunda `DiffEditor` (Monaco side-by-side diff) render ediliyor
- Kullanıcı her iki tab'i de bağımsız kapatabiliyor

## 3. Markdown Preview - Açık Tema

**Dosya:** `apps/web/src/components/MarkdownPreview.tsx`

- Arka plan beyaz (`#ffffff`) yapıldı
- Yazı rengi `#1f2328` (GitHub light)
- Kod blokları `#f6f8fa` arka plan
- Linkler `#0969da` mavi
- Kenar çizgileri `#d0d7de` açık gri
- `marked` kütüphanesi ile GitHub-flavored markdown render ediliyor

## 4. Dirty Tab Kapatma Dialog'u

**Dosya:** `apps/web/src/components/EditorPanel.tsx`

- Tab kapatma `handleTabClose` ile intercept ediliyor
- Eğer tab `isDirty` ise "Save / Don't Save / Cancel" dialog'u gösteriliyor
- Save: dosya içeriği diske yazılıyor, `markSaved` çağrılıyor, tab kapatılıyor
- Don't Save: direkt tab kapatılıyor
- Cancel: dialog kapatılıyor, tab kalıyor
- Dialog stili `App.tsx`'teki "Unsaved Changes" dialog'u ile aynı

## 5. Windows Explorer Öne Getirme

**Dosya:** `apps/desktop/src-tauri/src/lib.rs`

- `desktop_reveal_in_explorer` fonksiyonunda `explorer.exe` spawn edilmeden önce
- `AllowSetForegroundWindow(0xFFFFFFFF)` FFI çağrısı eklendi (ASFW_ANY)
- Bu sayede Explorer penceresi IDE'nin önünde açılıyor

## 6. EditorManager - Custom Title Desteği

**Dosya:** `packages/editor/src/editor-manager.ts`

- `openFile()` metoduna `options.title` parametresi eklendi
- Tab başlığı `options?.title || info.fileName` olarak ayarlanıyor

---

**Toplam değişen dosya:** 8
**Yeni eklenen dosya:** `apps/web/src/components/MarkdownPreview.tsx`

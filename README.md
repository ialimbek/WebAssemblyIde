# OpenCode ve Codex Troubleshooting Notları

Bu doküman, başka bir bilgisayarda **OpenCode** ve **Codex CLI** entegrasyonunu kurarken karşılaşılan hataları nasıl çözdüğümü özetler.

## Amaç

- OpenCode'yi Windsurf içinde sorunsuz çalıştırmak
- Codex CLI'nin yerel SQLite state hatalarını gidermek
- Aynı hatalar başka bilgisayarda çıkarsa hızlıca uygulamak

---

## 1) OpenCode tarafında yaşanan sorunlar

### Belirtiler

- `ACP connection closed`
- `spawn opencode.exe ENOENT`
- `Internal error: OpenCode service failure`

### Temel nedenler

- OpenCode binary'si PATH içinde görünmüyordu
- Windsurf, kurulu uygulamayı değil çalıştırılabilir dosyayı bulmakta zorlanıyordu
- OpenCode'nin kendi SQLite veritabanında şema uyumsuzluğu vardı

### Kontrol listesi

- OpenCode bilgisayarda kurulu mu?
- Çalıştırılabilir dosya PATH içinde mi?
- Windsurf doğru binary yolunu görüyor mu?
- API anahtarı ortam değişkenleri doğru mu?
- OpenCode local DB bozulmuş mu?

### Yapılan çözüm

#### A. Binary yolunu doğrulama

OpenCode'nin kurulu olduğu klasörü bul:

```powershell
where opencode
where OpenCode.exe
```

Kurulu uygulama genelde buna benzer bir yerde olur:

```text
C:\Users\<kullanıcı>\AppData\Local\Programs\@opencode-aidesktop\OpenCode.exe
```

#### B. PATH'e ekleme

Eğer Windows OpenCode'yi bulamıyorsa PATH'e ekle:

```powershell
setx PATH "$env:PATH;C:\Users\<kullanıcı>\AppData\Local\Programs\@opencode-aidesktop"
```

PowerShell'i kapatıp yeniden aç.

#### C. API key ortam değişkenleri

OpenCode tarafında ilgili sağlayıcı için doğru env değişkenleri tanımlı olmalı:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `OPENROUTER_API_KEY`

Not:

- Anahtarı koda yazma
- UI içine düz metin olarak koyma
- Paylaşıldıysa mümkünse yenile

#### D. OpenCode local DB şema sorunu

OpenCode DB yolu genelde şuna benzer:

```text
C:\Users\<kullanıcı>\.local\share\opencode\opencode.db
```

Sorun, `session_message.seq` alanı veya şema uyumsuzluğu nedeniyle çıkıyordu.

Çözüm yaklaşımı:

- DB yedeği al
- `session_message` tablosunu şemasız kalmış alanlardan arındır
- Gerekirse tabloyu yeniden oluştur
- Uygulamayı yeniden başlat

Kullanılan yaklaşımın özeti:

```sql
PRAGMA foreign_keys=off;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS session_message_new (
  id text PRIMARY KEY,
  session_id text NOT NULL,
  type text NOT NULL,
  time_created integer NOT NULL,
  time_updated integer NOT NULL,
  data text NOT NULL,
  CONSTRAINT fk_session_message_session_id_session_id_fk
    FOREIGN KEY (session_id) REFERENCES session(id) ON DELETE CASCADE
);
INSERT INTO session_message_new (id, session_id, type, time_created, time_updated, data)
  SELECT id, session_id, type, time_created, time_updated, data FROM session_message;
DROP TABLE session_message;
ALTER TABLE session_message_new RENAME TO session_message;
COMMIT;
PRAGMA foreign_keys=on;
PRAGMA wal_checkpoint(TRUNCATE);
```

---

## 2) Codex CLI tarafında yaşanan sorunlar

### Belirtiler

- `Codex cannot access its local database`
- `failed to initialize sqlite state runtime`
- `migration 1 was previously applied but has been modified`

### Temel neden

Codex'in `~\.codex` altındaki state veritabanı migration uyumsuzluğuna girmişti.

### Codex DB yolu

```text
C:\Users\<kullanıcı>\.codex
```

İçeride birden fazla SQLite dosyası olabilir:

- `state_5.sqlite`
- `goals_1.sqlite`
- `logs_2.sqlite`
- `sqlite\codex-dev.db`

### Çözüm yaklaşımı

#### A. Tüm Codex süreçlerini kapat

Önce açık Codex örneklerini kapat:

```powershell
Stop-Process -Name Codex -Force -ErrorAction SilentlyContinue
Stop-Process -Name codex-acp -Force -ErrorAction SilentlyContinue
```

#### B. `.codex` klasörünü yedekle

Eski state'i kaybetmeden önce klasörü taşı:

```powershell
$backupRoot = "C:\Users\<kullanıcı>\.codex_backup_$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Move-Item "C:\Users\<kullanıcı>\.codex" $backupRoot
```

#### C. Temiz `.codex` klasörü oluştur

```powershell
New-Item -ItemType Directory -Path "C:\Users\<kullanıcı>\.codex"
```

#### D. Uygulamayı yeniden başlat

Codex tekrar açıldığında state veritabanını sıfırdan oluşturmalı.

### Eğer sorun devam ederse

Aşağıdakileri kontrol et:

- Aynı anda açık başka Codex instance var mı?
- Eski `.codex` klasörü gerçekten taşındı mı?
- Codex farklı bir kullanıcı profili altında mı çalışıyor?
- Windows'ta farklı bir `CODEX_HOME` ortam değişkeni var mı?

Kontrol için:

```powershell
echo $env:CODEX_HOME
Get-ChildItem Env: | Where-Object { $_.Name -match 'CODEX|OPENAI|ANTHROPIC|OPENROUTER' }
```

---

## 3) Yeni bilgisayarda uygulama sırası

### OpenCode için

1. OpenCode'nin gerçekten kurulu olduğunu doğrula
2. Binary yolunu PATH'e ekle
3. Windsurf içinde executable yolunu doğrula
4. API key ortam değişkenlerini ayarla
5. OpenCode DB hatası varsa local DB'yi yedekleyip düzelt

### Codex için

1. Codex'in kurulu olduğunu doğrula
2. Tüm Codex süreçlerini kapat
3. `.codex` klasörünü yedekle
4. Temiz `.codex` klasörü oluştur
5. Codex'i yeniden aç
6. Login gerekiyorsa giriş yap

---

## 4) Hızlı sorun giderme özeti

### `spawn opencode.exe ENOENT`

- Binary PATH'te değil
- OpenCode kurulu klasörü PATH'e eklenmeli

### `ACP connection closed`

- Windsurf OpenCode'ye ulaşamıyor
- Binary yolu ve env ayarları kontrol edilmeli

### `failed to initialize sqlite state runtime`

- Codex local state bozulmuş
- `.codex` klasörü sıfırlanmalı

### `migration 1 was previously applied but has been modified`

- Migration geçmişi değişmiş
- Eski state klasörü tamamen yedeklenip temiz başlangıç yapılmalı

---

## 5) Güvenlik notu

- API anahtarlarını dosyaya düz metin olarak yazma
- Paylaşıldıysa anahtarı iptal etmeyi düşün
- Local state dosyalarını silmeden önce yedek al

---

## 6) Önerilen klasör yapısı

Yeni bilgisayarda bu notu saklamak için:

```text
C:\Users\<kullanıcı>\CascadeProjects\codex-opencode-troubleshooting\README.md
```

---

## 7) Kısa sonuç

Bu sorunlar için ana çözüm yolu:

- **OpenCode:** PATH + DB şema düzeltmesi
- **Codex:** `.codex` state klasörünü yedekleyip temiz başlatma


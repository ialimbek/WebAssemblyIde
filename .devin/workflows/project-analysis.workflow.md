---
description: Proje analizi ve durum raporu oluşturma
auto_execution_mode: 3
---

# Proje Analizi Workflow

Bu workflow, WebAssemblyIde projesinin genel durumunu analiz eder ve rapor oluşturur.

## Adımlar

1. **Proje bilgilerini topla**
   - `README.md` dosyasını oku
   - `ARCHITECTURE.md` dosyasını oku
   - `TODO.md` dosyasını oku
   - `project-root-archive/package.json` dosyasını oku
   - `project-root-archive/tsconfig.json` dosyasını oku
   - `project-root-archive/Cargo.toml` dosyasını oku

2. **Proje yapısını analiz et**
   - `apps/` klasörünü listele
   - `packages/` klasörünü listele
   - `crates/` klasörünü listele
   - Ana teknoloji stack'ini belirle

3. **Faz durumunu değerlendir**
   - TODO.md'den tamamlanan fazları tespit et
   - Aktif fazları belirle
   - Bekleyen fazları listele

4. **Teknik riskleri belirle**
   - Cloud build kısıtlamalarını kontrol et
   - Eksik özellikleri tespit et
   - Güncel odak noktasını belirle

5. **Rapor oluştur**
   - Proje özeti
   - Mimari yapı
   - Proje durumu
   - Ana özellikler
   - Teknik riskler ve sınırlamalar
   - Güncel odak
   - Öneriler

## Çıktı

Analiz sonucu Türkçe olarak markdown formatında rapor oluşturulur.

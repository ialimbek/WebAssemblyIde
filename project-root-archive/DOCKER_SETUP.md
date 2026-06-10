# Docker Setup for Codembly

Bu doküman, Codembly projesini Docker'da çalıştırmak için gerekli adımları içerir.

## Ön Koşullar

- Docker Desktop (Windows/Mac/Linux) yüklü olmalı
- Docker Compose yüklü olmalı (Docker Desktop ile birlikte gelir)
- En az 4GB RAM ve 10GB disk alanı önerilir

## Kurulum Adımları

### 1. Docker Dosyalarını Kontrol Edin

Proje kök dizininde şu dosyaların oluşturulduğunu doğrulayın:
- `Dockerfile` - Docker imajı build konfigürasyonu
- `docker-compose.yml` - Multi-service setup konfigürasyonu
- `.dockerignore` - Docker build'de hariç tutulacak dosyalar

### 2. Docker İmajını Build Edin

```bash
# Sadece web servisi için build
docker build -t codembly-web .

# Veya docker-compose ile build
docker-compose build
```

### 3. Uygulamayı Çalıştırın

**Seçenek A: Docker Compose ile (Önerilen)**
```bash
docker-compose up
```

**Seçenek B: Docker Compose ile arka planda çalıştırma**
```bash
docker-compose up -d
```

**Seçenek C: Sadece Docker ile**
```bash
docker run -p 3000:3000 codembly-web
```

### 4. Uygulamaya Erişin

Tarayıcınızda şu adrese gidin:
```
http://localhost:3000
```

## Geliştirme Modu

Kod değişikliklerinin otomatik olarak yansıması için volume mount kullanılır:

```bash
docker-compose up
```

Değişiklikler `./apps/web` ve `./packages` dizinlerinde yapıldığında, container içindeki dosyalar otomatik olarak güncellenir.

## Yararlı Komutlar

### Container'ları Listele
```bash
docker ps
```

### Logları Görüntüle
```bash
docker-compose logs -f
```

### Container'ı Durdur
```bash
docker-compose down
```

### Container'ı Durdur ve Volumes'i Temizle
```bash
docker-compose down -v
```

### Container İçine Gir
```bash
docker exec -it codembly-web sh
```

### İmajı Sil
```bash
docker rmi codembly-web
```

### Build Cache'i Temizle
```bash
docker-compose build --no-cache
```

## Sorun Giderme

### Port Çakışması
Eğer 3000 portu kullanımda ise, `docker-compose.yml` dosyasında portu değiştirin:
```yaml
ports:
  - "3001:3000"  # 3001 portunu kullan
```

### Permission Hataları (Linux/Mac)
```bash
sudo docker-compose up
```

### Build Hataları
Cache'i temizleyip tekrar deneyin:
```bash
docker-compose build --no-cache
docker-compose up
```

### Container İçinde Node Modülleri Hatası
Node modüllerini container içinde yeniden yükleyin:
```bash
docker exec -it codembly-web sh
npm install
```

## Production Build

Production için optimize edilmiş build:
```bash
docker build -t codembly-web:prod .
docker run -p 3000:3000 codembly-web:prod
```

## Güvenlik Notları

Docker imajında güvenlik açıkları tespit edildi (node:18-alpine base image). Production için:
- Daha güncel bir base image kullanın (örn: node:20-alpine)
- Distroless image kullanmayı düşünün
- SCA (Software Composition Analysis) araçları ile düzenli tarama yapın

## Ek Servisler

`docker-compose.yml` dosyasında API servisi için hazır konfigürasyon mevcut. Kullanmak için yorum satırlarını kaldırın:
```yaml
api:
  build:
    context: ./services/api
    dockerfile: Dockerfile
  # ... diğer ayarlar
```

## Kaynaklar

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/README.md)

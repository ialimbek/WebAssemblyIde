param([string]$WorkspaceRoot = (Get-Location).Path)
$ErrorActionPreference = 'Stop'

# =============================================================================
# DETAILED PROJECT ANALYSIS HOOK
# =============================================================================
# This script performs a comprehensive analysis of the Codembly project
# and outputs a markdown report to stdout and agent-journals/summaries/.
# =============================================================================

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
function Write-Section {
    param([string]$Title)
    Write-Host ''
    Write-Host "=== $Title ===" -ForegroundColor Cyan
    Write-Host ''
}

function Write-Metric {
    param([string]$Label, [string]$Value)
    Write-Host "  $Label".PadRight(35) -NoNewline
    Write-Host $Value -ForegroundColor Yellow
}

function Initialize-AgentJournalsStructure {
    param([string]$Root)
    $journalsDir = Join-Path $Root '.agent-journals'
    $subdirs = @('plans\pending','plans\in-progress','plans\completed','plans\cancelled','logs','researches','prompts','knowledges','summaries')
    foreach ($s in $subdirs) { New-Item -ItemType Directory -Path (Join-Path $journalsDir $s) -Force | Out-Null }
    return $journalsDir
}

# ---------------------------------------------------------------------------
# 1. Git Analysis
# ---------------------------------------------------------------------------
function Get-GitAnalysis {
    param([string]$Root)
    $result = @{ branch = 'unknown'; lastCommit = 'unknown'; commitCount = 0; dirtyFiles = 0; authors = @() }
    try {
        $git = Get-Command git -ErrorAction SilentlyContinue
        if ($null -eq $git) { return $result }

        Push-Location $Root
        $result.branch = (& $git.Source rev-parse --abbrev-ref HEAD 2>$null) | Out-String
        $result.branch = $result.branch.Trim()
        $result.lastCommit = (& $git.Source log -1 --format="%h %s (%ad)" --date=short 2>$null) | Out-String
        $result.lastCommit = $result.lastCommit.Trim()
        $result.commitCount = [int]((& $git.Source rev-list --count HEAD 2>$null) | Out-String).Trim()
        $result.dirtyFiles = [int](((& $git.Source status --short 2>$null) | Out-String).Split([Environment]::NewLine).Count) - 1
        $authorsRaw = & $git.Source log --format="%an" 2>$null | Group-Object | Sort-Object Count -Descending | Select-Object -First 5
        $result.authors = $authorsRaw | ForEach-Object { "$($_.Name): $($_.Count)" }
        Pop-Location
    } catch {
        Write-Host "[WARN] Git analysis failed: $($_.Exception.Message)"
    }
    return $result
}

# ---------------------------------------------------------------------------
# 2. TODO.md Parse
# ---------------------------------------------------------------------------
function Get-TodoAnalysis {
    param([string]$Root)
    $todoPath = Join-Path $Root 'TODO.md'
    $result = @{ total = 0; done = 0; partial = 0; pending = 0; phases = @{} }
    if (-not (Test-Path $todoPath)) { return $result }

    $lines = Get-Content $todoPath
    $currentPhase = 'General'
    foreach ($line in $lines) {
        if ($line -match '^#{2,3}\s+(Faz\s+\S+|\d+\.\d+.*)') {
            $currentPhase = ($line -replace '^#{2,3}\s+', '').Trim()
            if (-not $result.phases.ContainsKey($currentPhase)) {
                $result.phases[$currentPhase] = @{ done = 0; partial = 0; pending = 0; total = 0 }
            }
        }
        if ($line -match '^\s*-\s+\[(.)\]') {
            $status = $matches[1]
            $result.total++
            $result.phases[$currentPhase].total++
            if ($status -eq 'x') {
                $result.done++; $result.phases[$currentPhase].done++
            } elseif ($status -eq '-') {
                $result.partial++; $result.phases[$currentPhase].partial++
            } else {
                $result.pending++; $result.phases[$currentPhase].pending++
            }
        }
    }
    return $result
}

# ---------------------------------------------------------------------------
# 3. Code Metrics
# ---------------------------------------------------------------------------
function Get-CodeMetrics {
    param([string]$Root)
    $result = @{
        tsFiles = 0; tsLines = 0; tsTestFiles = 0; tsTestLines = 0
        rsFiles = 0; rsLines = 0
        cssFiles = 0; cssLines = 0
        jsonFiles = 0; totalPackages = 0; totalApps = 0
    }
    try {
        $excludePattern = '(\\|^)(node_modules|target|dist|\.git|\.agent-journals)(\\|$)'
        $sourceDirs = @('apps','packages','crates','services') | ForEach-Object { Join-Path $Root $_ } | Where-Object { Test-Path $_ }

        $ts = $sourceDirs | ForEach-Object { Get-ChildItem -Path $_ -Recurse -Include '*.ts','*.tsx' -ErrorAction SilentlyContinue } | Where-Object { $_.FullName -notmatch $excludePattern }
        foreach ($f in $ts) {
            $lines = (Get-Content $f.FullName | Measure-Object).Count
            if ($f.Name -match '\.(test|spec)\.(ts|tsx)$') {
                $result.tsTestFiles++
                $result.tsTestLines += $lines
            } else {
                $result.tsFiles++
                $result.tsLines += $lines
            }
        }
        $rs = $sourceDirs | ForEach-Object { Get-ChildItem -Path $_ -Recurse -Include '*.rs' -ErrorAction SilentlyContinue } | Where-Object { $_.FullName -notmatch $excludePattern }
        foreach ($f in $rs) {
            $result.rsFiles++
            $result.rsLines += (Get-Content $f.FullName | Measure-Object).Count
        }
        $css = $sourceDirs | ForEach-Object { Get-ChildItem -Path $_ -Recurse -Include '*.css','*.scss' -ErrorAction SilentlyContinue } | Where-Object { $_.FullName -notmatch $excludePattern }
        foreach ($f in $css) {
            $result.cssFiles++
            $result.cssLines += (Get-Content $f.FullName | Measure-Object).Count
        }
        $json = $sourceDirs | ForEach-Object { Get-ChildItem -Path $_ -Recurse -Include 'package.json','tsconfig.json' -ErrorAction SilentlyContinue } | Where-Object { $_.FullName -notmatch $excludePattern }
        $result.jsonFiles = $json.Count
        $result.totalPackages = (Get-ChildItem -Path (Join-Path $Root 'packages') -Directory -ErrorAction SilentlyContinue).Count
        $result.totalApps = (Get-ChildItem -Path (Join-Path $Root 'apps') -Directory -ErrorAction SilentlyContinue).Count
    } catch {
        Write-Host "[WARN] Code metrics failed: $($_.Exception.Message)"
    }
    return $result
}

# ---------------------------------------------------------------------------
# 4. Package Health
# ---------------------------------------------------------------------------
function Get-PackageHealth {
    param([string]$Root)
    $result = @{ healthy = @(); partial = @(); skeleton = @(); missing = @() }
    $expected = @{
        packages = @('ui','editor','ide-core','agent-runtime','agent-tools','ai-gateway','lsp-client','extension-api','shared','command-bus','performance-core','terminal-runtime','browser-runtime','scratchpad-runtime','context-engine','i18n','accessibility','settings','notifications','devtools')
        crates   = @('desktop-host','wasm-parser','wasm-indexer','wasm-diff')
        apps     = @('web','desktop','docs')
        services = @('api','auth','token-vault','runner')
    }
    foreach ($category in $expected.Keys) {
        $dir = Join-Path $Root $category
        foreach ($name in $expected[$category]) {
            $pkgDir = Join-Path $dir $name
            if (-not (Test-Path $pkgDir)) {
                $result.missing += "$category/$name"
                continue
            }
            $srcDir = Join-Path $pkgDir 'src'
            $hasSrc = Test-Path $srcDir
            $srcFileCount = if ($hasSrc) { (Get-ChildItem -Path $srcDir -Recurse -File -ErrorAction SilentlyContinue).Count } else { 0 }
            $hasTests = if ($hasSrc) { (Get-ChildItem -Path $srcDir -Recurse -Include '*.test.ts','*.test.tsx' -ErrorAction SilentlyContinue).Count -gt 0 } else { $false }

            if ($hasSrc -and $srcFileCount -gt 2 -and $hasTests) {
                $result.healthy += "$category/$name ($srcFileCount files, tests)"
            } elseif ($hasSrc -and $srcFileCount -gt 0) {
                $result.partial += "$category/$name ($srcFileCount files, no tests)"
            } else {
                $result.skeleton += "$category/$name (empty)"
            }
        }
    }
    return $result
}

# ---------------------------------------------------------------------------
# 5. Version Consistency
# ---------------------------------------------------------------------------
function Get-VersionConsistency {
    param([string]$Root)
    $result = @{ consistent = $true; versions = @{} }
    $files = @{
        'root package.json'       = Join-Path $Root 'package.json'
        'apps/web/package.json'   = Join-Path $Root 'apps\web\package.json'
        'apps/desktop/package.json'= Join-Path $Root 'apps\desktop\package.json'
        'tauri.conf.json'         = Join-Path $Root 'apps\desktop\src-tauri\tauri.conf.json'
        'desktop Cargo.toml'      = Join-Path $Root 'apps\desktop\src-tauri\Cargo.toml'
    }
    foreach ($entry in $files.GetEnumerator()) {
        $path = $entry.Value
        if (-not (Test-Path $path)) { continue }
        try {
            if ($path -like '*Cargo.toml') {
                $content = Get-Content $path -Raw
                $m = [regex]::Match($content, '^version\s*=\s*"([^"]+)"', [System.Text.RegularExpressions.RegexOptions]::Multiline)
                if ($m.Success) { $result.versions[$entry.Key] = $m.Groups[1].Value }
            } elseif ($path -like '*tauri.conf.json') {
                $json = Get-Content $path -Raw | ConvertFrom-Json
                $result.versions[$entry.Key] = $json.version
            } else {
                $json = Get-Content $path -Raw | ConvertFrom-Json
                $result.versions[$entry.Key] = $json.version
            }
        } catch {
            Write-Host "[WARN] Could not read version from $($entry.Key)"
        }
    }
    $unique = $result.versions.Values | Select-Object -Unique
    if ($unique.Count -gt 1) { $result.consistent = $false }
    return $result
}

# ---------------------------------------------------------------------------
# 6. Report Generation
# ---------------------------------------------------------------------------
function Write-AnalysisReport {
    param(
        [string]$Root,
        [hashtable]$Git,
        [hashtable]$Todo,
        [hashtable]$Metrics,
        [hashtable]$Health,
        [hashtable]$Versions
    )

    $now = Get-Date
    $report = @"
# Codembly Detaylı Proje Analiz Raporu

**Tarih:** $($now.ToString('yyyy-MM-dd HH:mm:ss'))
**Proje:** Codembly (WebAssembly Ide)
**Versiyon:** $($Versions.versions['root package.json'])

---

## 1. Git Durumu

| Metrik | Değer |
|--------|-------|
| Aktif Branch | $($Git.branch) |
| Son Commit | $($Git.lastCommit) |
| Toplam Commit | $($Git.commitCount) |
| Bekleyen Değişiklik | $($Git.dirtyFiles) dosya |

**En Aktif Katkıda Bulunanlar:**
$($Git.authors | ForEach-Object { "- $_" } | Out-String)

---

## 2. Faz İlerlemesi

| Faz | Tamamlanan | Kısmen | Bekleyen | Toplam | Yüzde |
|-----|-----------|--------|----------|--------|-------|
"@

    foreach ($phase in $Todo.phases.Keys | Sort-Object) {
        $p = $Todo.phases[$phase]
        $pct = if ($p.total -gt 0) { [math]::Round(($p.done / $p.total) * 100, 1) } else { 0 }
        $report += "| $phase | $($p.done) | $($p.partial) | $($p.pending) | $($p.total) | %$pct |`n"
    }

    $totalPct = if ($Todo.total -gt 0) { [math]::Round(($Todo.done / $Todo.total) * 100, 1) } else { 0 }
    $report += @"

**Genel Tamamlanma:** $($Todo.done) / $($Todo.total) (%$totalPct)
**Kısmen Tamamlanan:** $($Todo.partial)
**Bekleyen:** $($Todo.pending)

---

## 3. Kod Metrikleri

| Dil / Kategori | Dosya Sayısı | Satır Sayısı |
|----------------|-------------|-------------|
| TypeScript/TSX (üretim) | $($Metrics.tsFiles) | $($Metrics.tsLines) |
| TypeScript/TSX (test) | $($Metrics.tsTestFiles) | $($Metrics.tsTestLines) |
| Rust | $($Metrics.rsFiles) | $($Metrics.rsLines) |
| CSS/SCSS | $($Metrics.cssFiles) | $($Metrics.cssLines) |
| JSON/Config | $($Metrics.jsonFiles) | - |

**Toplam Paket:** $($Metrics.totalPackages)
**Toplam Uygulama:** $($Metrics.totalApps)
**Test Kapsamı (dosya bazlı):** $(if ($Metrics.tsFiles -gt 0) { [math]::Round(($Metrics.tsTestFiles / $Metrics.tsFiles) * 100, 1) } else { 0 })%

---

## 4. Paket Sağlığı

### Sağlıklı Paketler (kaynak + test)
$($Health.healthy | ForEach-Object { "- $_" } | Out-String)

### Kısmi Paketler (kaynak var, test yok)
$($Health.partial | ForEach-Object { "- $_" } | Out-String)

### İskelet Paketler (boş)
$($Health.skeleton | ForEach-Object { "- $_" } | Out-String)

### Eksik Paketler
$($Health.missing | ForEach-Object { "- $_" } | Out-String)

---

## 5. Versiyon Tutarlılığı

| Dosya | Versiyon |
|-------|----------|
"@
    foreach ($entry in $Versions.versions.GetEnumerator() | Sort-Object Key) {
        $report += "| $($entry.Key) | $($entry.Value) |`n"
    }
    $report += @"

**Durum:** $(if ($Versions.consistent) { 'TUTARLI ✅' } else { 'TUTARSIZ ❌' })

---

## 6. Teknik Riskler ve Öneriler

### 🔴 Yüksek Risk
- **Cloud Build Yasaklı:** Desktop Tauri bundle alınamıyor; native PTY, keychain, file watcher doğrulanamıyor.
- **AI Gateway Yok:** `packages/ai-gateway` sadece package.json; BYOK provider bağlantısı yok.

### 🟡 Orta Risk
- **Wasm Crates Boş:** `wasm-parser`, `wasm-indexer`, `wasm-diff` iskelet; Faz E'nin temeli yok.
- **LSP Yok:** Editor'de Monaco markers entegrasyonu sınırlı.
- **README Eski:** Proje tanıtımı yerine OpenCode/Codex troubleshooting notu var.

### 🟢 Düşük Risk
- **Agent-Journals Plans Boş:** Hiçbir plan kaydedilmemiş.
- **Crash Recovery Yok:** Autosave var ama crash recovery state'i yok.

### Öneriler
1. AI Gateway temelini kur (OpenAI/Anthropic connector)
2. Wasm parser POC başlat (tree-sitter integration)
3. README.md'yi proje tanıtımı ile güncelle
4. Desktop build ortamını yerel olarak kur ve Tauri PTY'yi doğrula
5. `/agent-journal plan` ile Faz D planını kaydet

---

*Bu rapor `.devin/hooks/project-analysis.ps1` tarafından otomatik olarak oluşturulmuştur.*
"@

    # Write to agent-journals/summaries/
    $journalsDir = Initialize-AgentJournalsStructure -Root $Root
    $summariesDir = Join-Path $journalsDir 'summaries'
    $filename = "$($now.ToString('yyyy-MM'))-detailed-project-analysis.md"
    $outPath = Join-Path $summariesDir $filename
    [System.IO.File]::WriteAllText($outPath, $report, [System.Text.UTF8Encoding]::new($true))

    return @{ report = $report; path = $outPath }
}

# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------
Write-Section "Codembly Detayli Proje Analizi"

$git     = Get-GitAnalysis     -Root $WorkspaceRoot
$todo    = Get-TodoAnalysis   -Root $WorkspaceRoot
$metrics = Get-CodeMetrics    -Root $WorkspaceRoot
$health  = Get-PackageHealth  -Root $WorkspaceRoot
$versions= Get-VersionConsistency -Root $WorkspaceRoot

Write-Host '[INFO] Git, TODO, metrics, health, and version analysis complete.'

$report = Write-AnalysisReport -Root $WorkspaceRoot -Git $git -Todo $todo -Metrics $metrics -Health $health -Versions $versions

Write-Host ''
Write-Host "[OK] Report saved to: $($report.path)" -ForegroundColor Green
Write-Host ''
Write-Host '--- RAPOR BASLANGICI ---'
Write-Host $report.report
Write-Host '--- RAPOR SONU ---'
exit 0

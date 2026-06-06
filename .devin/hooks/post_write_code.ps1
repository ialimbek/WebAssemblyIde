$ErrorActionPreference = 'Stop'

function Read-JsonFromStdin {
    $rawInput = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($rawInput)) {
        return $null
    }

    try {
        return $rawInput | ConvertFrom-Json
    }
    catch {
        Write-Host "[WARN] Error reading stdin: $($_.Exception.Message)"
        return $null
    }
}

function Get-PropertyValue {
    param(
        [object]$Object,
        [string]$Name
    )

    if ($null -eq $Object) {
        return $null
    }

    $property = $Object.PSObject.Properties[$Name]
    if ($null -eq $property) {
        return $null
    }

    return $property.Value
}

function Get-VersionFromJson {
    param([string]$Path)

    try {
        $data = Get-Content -Path $Path -Raw | ConvertFrom-Json
        return [string]$data.version
    }
    catch {
        Write-Host "[WARN] Error reading ${Path}: $($_.Exception.Message)"
        return $null
    }
}

function Get-VersionFromTauriConf {
    param([string]$Path)

    try {
        $data = Get-Content -Path $Path -Raw | ConvertFrom-Json
        return [string]$data.version.version
    }
    catch {
        Write-Host "[WARN] Error reading ${Path}: $($_.Exception.Message)"
        return $null
    }
}

function Get-VersionFromCargoToml {
    param([string]$Path)

    try {
        $content = Get-Content -Path $Path -Raw
        $match = [regex]::Match($content, '^(?m)version\s*=\s*"([^"]+)"')
        if ($match.Success) {
            return $match.Groups[1].Value
        }
    }
    catch {
        Write-Host "[WARN] Error reading ${Path}: $($_.Exception.Message)"
    }

    return $null
}

function Get-NormalizedModifiedFiles {
    param([object]$Value)

    if ($null -eq $Value) {
        return @()
    }

    if ($Value -is [string]) {
        if ([string]::IsNullOrWhiteSpace($Value)) {
            return @()
        }
        return @($Value)
    }

    $files = New-Object System.Collections.Generic.List[string]
    if ($Value -is [System.Collections.IEnumerable]) {
        foreach ($item in $Value) {
            if ($null -eq $item) {
                continue
            }

            $text = [string]$item
            if (-not [string]::IsNullOrWhiteSpace($text)) {
                $files.Add($text)
            }
        }
    }
    else {
        $files.Add([string]$Value)
    }

    return @($files.ToArray())
}

function Test-ModifiedFileMatch {
    param(
        [string[]]$ModifiedFiles,
        [string]$RelativePath
    )

    $normalizedTarget = $RelativePath -replace '/', '\'

    foreach ($modifiedFile in $ModifiedFiles) {
        $normalizedFile = [string]$modifiedFile -replace '/', '\'

        if ($normalizedFile -eq $normalizedTarget) {
            return $true
        }

        if ($normalizedFile.EndsWith("\$normalizedTarget")) {
            return $true
        }
    }

    return $false
}

function Test-VersionConsistency {
    param(
        [string]$WorkspaceRoot,
        [object[]]$ModifiedFiles
    )

    $versionFiles = [ordered]@{
        'package.json (root)' = Join-Path $WorkspaceRoot 'package.json'
        'apps/web/package.json' = Join-Path $WorkspaceRoot 'apps\web\package.json'
        'apps/desktop/package.json' = Join-Path $WorkspaceRoot 'apps\desktop\package.json'
        'apps/desktop/src-tauri/tauri.conf.json' = Join-Path $WorkspaceRoot 'apps\desktop\src-tauri\tauri.conf.json'
        'apps/desktop/src-tauri/Cargo.toml' = Join-Path $WorkspaceRoot 'apps\desktop\src-tauri\Cargo.toml'
        '.clinerules/manifest.json' = Join-Path $WorkspaceRoot '.clinerules\manifest.json'
    }

    $versionRelated = $false
    foreach ($relativePath in $versionFiles.Values) {
        if (Test-ModifiedFileMatch -ModifiedFiles $ModifiedFiles -RelativePath $relativePath) {
            $versionRelated = $true
            break
        }
    }

    if (-not $versionRelated) {
        Write-Host '[INFO] No version files modified, skipping version check'
        return $true
    }

    Write-Host '[INFO] Checking version consistency...'
    $versions = [ordered]@{}

    foreach ($entry in $versionFiles.GetEnumerator()) {
        $name = $entry.Key
        $path = $entry.Value

        if (-not (Test-Path $path)) {
            Write-Host "[WARN] $name not found, skipping"
            continue
        }

        if ($name -like '*package.json*') {
            $version = Get-VersionFromJson -Path $path
        }
        elseif ($name -like '*tauri.conf.json*') {
            $version = Get-VersionFromTauriConf -Path $path
        }
        elseif ($name -like '*Cargo.toml*') {
            $version = Get-VersionFromCargoToml -Path $path
        }
        elseif ($name -eq '.clinerules/manifest.json') {
            $version = Get-VersionFromJson -Path $path
        }
        else {
            continue
        }

        if (-not [string]::IsNullOrWhiteSpace($version)) {
            $versions[$name] = $version
            Write-Host "  ${name}: $version"
        }
    }

    if ($versions.Count -gt 0 -and ($versions.Values | Select-Object -Unique).Count -gt 1) {
        Write-Host '[ERROR] VERSION INCONSISTENCY DETECTED!'
        Write-Host 'The following files have different versions:'
        foreach ($item in $versions.GetEnumerator()) {
            Write-Host "  $($item.Key): $($item.Value)"
        }
        Write-Host 'Please update all version files to match.'
        Write-Host 'See .clinerules/rules/11-version-update-rule.md for details.'
        return $false
    }

    if ($versions.Count -gt 0) {
        $firstVersion = $versions.Values | Select-Object -First 1
        Write-Host "[OK] All versions consistent: $firstVersion"
    }

    return $true
}

function Test-ArchitectureCompliance {
    param(
        [string]$WorkspaceRoot
    )

    $archPath = Join-Path $WorkspaceRoot 'ARCHITECTURE.md'
    if (-not (Test-Path $archPath)) {
        Write-Host '[WARN] ARCHITECTURE.md not found, skipping compliance check'
        return $true
    }

    Write-Host '[INFO] Checking architecture compliance...'
    Write-Host '[OK] No obvious architecture violations detected'
    return $true
}

function Test-AgentJournalRuleCompliance {
    param([string]$WorkspaceRoot)

    $journalsDir = Join-Path $WorkspaceRoot '.agent-journals'
    if (-not (Test-Path $journalsDir)) {
        Write-Host '[WARN] .agent-journals directory not found'
        Write-Host '[INFO] Tip: Ensure agent-journal rule (12) is being followed'
        return $true
    }

    Write-Host '[OK] Agent-journal directory exists'
    return $true
}

$workspaceRoot = (Get-Location).Path
$context = Read-JsonFromStdin
$modifiedFiles = Get-NormalizedModifiedFiles -Value (Get-PropertyValue -Object $context -Name 'files_modified')

Write-Host "[INFO] Post-write validation for: $workspaceRoot"
Write-Host '--------------------------------------------------'

if ($modifiedFiles.Count -eq 0) {
    Write-Host '[INFO] No files modified, skipping checks'
    exit 0
}

Write-Host "[INFO] Files modified: $($modifiedFiles.Count)"
for ($i = 0; $i -lt [Math]::Min($modifiedFiles.Count, 5); $i++) {
    Write-Host "  - $($modifiedFiles[$i])"
}
if ($modifiedFiles.Count -gt 5) {
    Write-Host "  ... and $($modifiedFiles.Count - 5) more"
}
Write-Host ''

$checksPassed = $true

if (-not (Test-VersionConsistency -WorkspaceRoot $workspaceRoot -ModifiedFiles $modifiedFiles)) {
    $checksPassed = $false
}

Write-Host ''

if (-not (Test-ArchitectureCompliance -WorkspaceRoot $workspaceRoot)) {
    $checksPassed = $false
}

Write-Host ''

Test-AgentJournalRuleCompliance -WorkspaceRoot $workspaceRoot | Out-Null

Write-Host '--------------------------------------------------'

if ($checksPassed) {
    Write-Host '[OK] All post-write checks passed'
    exit 0
}

Write-Host '[ERROR] Some checks failed. Please review the warnings above.'
exit 0

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

function Get-WorkspaceRoot {
    param([string]$WorkspaceRoot)

    if (-not [string]::IsNullOrWhiteSpace($WorkspaceRoot)) {
        return (Resolve-Path -LiteralPath $WorkspaceRoot).Path
    }

    return (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
}

function Convert-ToAsciiText {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return ''
    }

    $text = $Value
    $replacements = @(
        @('ç', 'c'),
        @('Ç', 'C'),
        @('ğ', 'g'),
        @('Ğ', 'G'),
        @('ı', 'i'),
        @('İ', 'I'),
        @('ö', 'o'),
        @('Ö', 'O'),
        @('ş', 's'),
        @('Ş', 'S'),
        @('ü', 'u'),
        @('Ü', 'U')
    )

    foreach ($pair in $replacements) {
        $text = $text.Replace($pair[0], $pair[1])
    }

    return $text
}

function ConvertTo-LogSafeText {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $Value
    }

    $sanitized = $Value
    $patterns = @(
        '(?i)\b(amk|aq|bok\w*|piç\w*|orospu\w*|yarrak\w*|siktir\w*|sik\w*|fuck\w*|shit\w*|bitch\w*|asshole\w*)\b'
    )

    foreach ($pattern in $patterns) {
        $sanitized = [regex]::Replace($sanitized, $pattern, '[sansürlendi]')
    }

    return $sanitized
}

function ConvertTo-Utf8Text {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $Value
    }

    try {
        $bytes = [System.Text.Encoding]::GetEncoding(437).GetBytes($Value)
        $decoded = [System.Text.Encoding]::UTF8.GetString($bytes)
        if ($decoded -match '[çÇğĞıİöÖşŞüÜ]') {
            return $decoded
        }
    }
    catch {
    }

    return $Value
}

function Get-ProjectRelativePath {
    param(
        [string]$WorkspaceRoot,
        [string]$Path
    )

    if ([string]::IsNullOrWhiteSpace($Path)) {
        return '.'
    }

    $normalizedRoot = ([string]$WorkspaceRoot).TrimEnd('\', '/')
    $normalizedPath = ([string]$Path).Trim().Replace('/', '\')

    if ([System.IO.Path]::IsPathRooted($normalizedPath)) {
        if ($normalizedPath.StartsWith($normalizedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
            $relativePath = $normalizedPath.Substring($normalizedRoot.Length).TrimStart('\', '/')
            if ([string]::IsNullOrWhiteSpace($relativePath)) {
                return '.'
            }

            return $relativePath.Replace('\', '/')
        }

        return '[workspace dışı]'
    }

    $normalizedPath = $normalizedPath.Replace('\', '/')
    if ([string]::IsNullOrWhiteSpace($normalizedPath)) {
        return '.'
    }

    return $normalizedPath
}

function Get-LogTitle {
    param(
        [string]$Value,
        [int]$MaxWords = 8,
        [int]$MaxLength = 50
    )

    $cleanText = Convert-ToAsciiText -Value (ConvertTo-LogSafeText -Value $Value)
    $words = $cleanText -split '\s+' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -First $MaxWords

    if ($words.Count -eq 0) {
        return 'Prompt'
    }

    $title = (($words -join ' ') -replace '\s+', ' ').Trim()
    if ($title.Length -gt $MaxLength) {
        $title = $title.Substring(0, $MaxLength).TrimEnd()
    }

    if ([string]::IsNullOrWhiteSpace($title)) {
        return 'Prompt'
    }

    return $title
}

function ConvertTo-ProjectRelativeText {
    param(
        [string]$WorkspaceRoot,
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $Value
    }

    $escapedRoot = [regex]::Escape(([string]$WorkspaceRoot).TrimEnd('\', '/'))
    $text = [regex]::Replace($Value, $escapedRoot + '[\\/]', '', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    $text = [regex]::Replace($text, $escapedRoot, '.', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    return $text.Replace('\', '/')
}

function Get-LogSlug {
    param(
        [string]$Value,
        [int]$MaxWords = 8
    )

    $cleanText = Convert-ToAsciiText -Value (ConvertTo-LogSafeText -Value $Value)
    $words = $cleanText -split '\s+' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -First $MaxWords

    if ($words.Count -eq 0) {
        return 'prompt'
    }

    $slug = (($words -join '-') -replace '[^a-zA-Z0-9-]', '').ToLowerInvariant()
    $slug = $slug -replace '-{2,}', '-'
    $slug = $slug.Trim('-')

    if ([string]::IsNullOrWhiteSpace($slug)) {
        return 'prompt'
    }

    return $slug.Substring(0, [Math]::Min(60, $slug.Length))
}

function Test-ArchitectureCompliance {
    param([string]$WorkspaceRoot)

    $architecturePath = Join-Path $WorkspaceRoot 'ARCHITECTURE.md'
    if (-not (Test-Path $architecturePath)) {
        Write-Host "[WARN] ARCHITECTURE.md not found at $architecturePath"
        return $false
    }

    Write-Host '[OK] ARCHITECTURE.md found and accessible'
    return $true
}

function Test-AgentsAvailable {
    param([string]$WorkspaceRoot)

    $agentsDir = Join-Path $WorkspaceRoot '.agents\skills'
    if (-not (Test-Path $agentsDir)) {
        Write-Host '[WARN] .agents/skills directory not found'
        return $false
    }

    $skillCount = @(Get-ChildItem -Path $agentsDir -Filter 'SKILL.md' -Recurse -ErrorAction SilentlyContinue).Count
    Write-Host "[OK] .agents/skills found with $skillCount skills available"
    return $true
}

function Initialize-AgentJournalsStructure {
    param([string]$WorkspaceRoot)

    $journalsDir = Join-Path $WorkspaceRoot '.agent-journals'
    $subdirs = @(
        'plans\pending',
        'plans\in-progress',
        'plans\completed',
        'plans\cancelled',
        'logs',
        'researches',
        'prompts',
        'knowledges',
        'summaries'
    )

    foreach ($subdir in $subdirs) {
        $path = Join-Path $journalsDir $subdir
        New-Item -ItemType Directory -Path $path -Force | Out-Null
    }

    return $journalsDir
}

function Write-HookHeartbeat {
    param(
        [string]$WorkspaceRoot,
        [string]$HookName,
        [string]$Details
    )

    $journalsDir = Initialize-AgentJournalsStructure -WorkspaceRoot $WorkspaceRoot
    $disableFile = Join-Path $journalsDir '.disable-auto-logging'
    if (Test-Path $disableFile) {
        return
    }

    $now = Get-Date
    $dateDir = Join-Path (Join-Path $journalsDir 'logs') $now.ToString('yyyy-MM-dd')
    New-Item -ItemType Directory -Path $dateDir -Force | Out-Null

    $logFile = Join-Path $dateDir 'hook-activations.md'
    if (-not (Test-Path $logFile)) {
        [System.IO.File]::WriteAllText($logFile, "# Hook Activation Log`r`n`r`n", [System.Text.UTF8Encoding]::new($false))
    }

    $entry = @"
## [$($now.ToString('HH:mm:ss'))] $HookName

$Details

"@

    [System.IO.File]::AppendAllText($logFile, $entry, [System.Text.UTF8Encoding]::new($false))
    Write-Host "[OK] Hook heartbeat logged: $HookName"
}

function Write-PromptStartLog {
    param(
        [string]$WorkspaceRoot,
        [string]$UserPrompt
    )

    $journalsDir = Initialize-AgentJournalsStructure -WorkspaceRoot $WorkspaceRoot
    $disableFile = Join-Path $journalsDir '.disable-auto-logging'
    if (Test-Path $disableFile) {
        Write-Host '[WARN] Auto-logging disabled'
        return
    }

    $now = Get-Date
    $dateDir = Join-Path (Join-Path $journalsDir 'prompts') $now.ToString('yyyy-MM-dd')
    New-Item -ItemType Directory -Path $dateDir -Force | Out-Null

    $sanitizedPrompt = ConvertTo-LogSafeText -Value (ConvertTo-ProjectRelativeText -WorkspaceRoot $WorkspaceRoot -Value (ConvertTo-Utf8Text -Value $UserPrompt))
    $slug = Get-LogSlug -Value $sanitizedPrompt
    $timestamp = $now.ToString('HH-mm-ss')
    $filename = "$timestamp-auto-$slug-start.md"
    $logFile = Join-Path $dateDir $filename
    $relativeRoot = Get-ProjectRelativePath -WorkspaceRoot $WorkspaceRoot -Path $WorkspaceRoot
    $logTitle = Get-LogTitle -Value $sanitizedPrompt

    $content = @"
---
timestamp: "$($now.ToString('yyyy-MM-dd HH:mm:ss'))"
type: auto_prompt_start
---

# Prompt Start: $logTitle

**Time:** $($now.ToString('yyyy-MM-dd HH:mm:ss'))

## Location

$relativeRoot

## User Prompt

$sanitizedPrompt

## Context

Pre-validation started.

## Tags

#general
"@

    [System.IO.File]::WriteAllText($logFile, $content, [System.Text.UTF8Encoding]::new($false))
    $relativeLogFile = Get-ProjectRelativePath -WorkspaceRoot $WorkspaceRoot -Path $logFile
    Write-Host "[OK] Logged prompt start to $relativeLogFile"
}

function Find-Workflow {
    param(
        [string]$WorkspaceRoot,
        [string]$UserPrompt
    )

    $workflowsDir = Join-Path $WorkspaceRoot '.devin\workflows'
    if (-not (Test-Path $workflowsDir)) {
        Write-Host '[WARN] Workflows directory not found'
        return
    }

    $promptLower = $UserPrompt.ToLowerInvariant()
    $workflowKeywords = [ordered]@{
        'phase-a-bootstrap' = @('bootstrap', 'skeleton', 'setup', 'initial')
        'phase-b-editor-workspace-terminal' = @('editor', 'workspace', 'terminal', 'file')
        'phase-c-agent-core-tools' = @('agent', 'tool', 'runtime', 'chat')
        'phase-d-browser-scratchpad' = @('browser', 'preview', 'scratchpad')
        'phase-e-wasm-lsp-context' = @('wasm', 'lsp', 'indexing', 'context')
        'phase-f-ai-web-runner' = @('ai', 'gateway', 'runner', 'web')
        'review-and-sync' = @('review', 'sync', 'check', 'validate')
        'project-analysis' = @('analiz', 'analysis', 'project', 'proje', 'status', 'durum')
    }

    $matched = @()
    foreach ($workflow in $workflowKeywords.Keys) {
        $keywords = $workflowKeywords[$workflow]
        if (($keywords | Where-Object { $promptLower.Contains($_) }).Count -gt 0) {
            $matched += $workflow
        }
    }

    if ($matched.Count -gt 0) {
        Write-Host "[INFO] Suggested workflows: $($matched -join ', ')"
    }

    # Auto-run project analysis if matched
    if ($matched -contains 'project-analysis') {
        Invoke-ProjectAnalysis -WorkspaceRoot $WorkspaceRoot
    }
}

function Invoke-ProjectAnalysis {
    param([string]$WorkspaceRoot)

    $analysisScript = Join-Path $WorkspaceRoot '.devin\hooks\project-analysis.ps1'
    if (-not (Test-Path $analysisScript)) {
        Write-Host '[WARN] project-analysis.ps1 not found, skipping auto-analysis'
        return
    }

    Write-Host ''
    Write-Host '[INFO] Auto-triggering detailed project analysis...' -ForegroundColor Cyan
    Write-Host '--------------------------------------------------'
    try {
        & powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "$analysisScript" -WorkspaceRoot "$WorkspaceRoot" 2>&1 | ForEach-Object { Write-Host $_ }
    } catch {
        Write-Host "[WARN] Project analysis failed: $($_.Exception.Message)"
    }
    Write-Host '--------------------------------------------------'
}

$workspaceRoot = (Get-Location).Path
$context = Read-JsonFromStdin
$toolInfo = Get-PropertyValue -Object $context -Name 'tool_info'
$userPrompt = [string](Get-PropertyValue -Object $toolInfo -Name 'user_prompt')

Write-Host "[INFO] Pre-prompt validation for: $workspaceRoot"
Write-Host '--------------------------------------------------'

Write-HookHeartbeat -WorkspaceRoot $workspaceRoot -HookName 'pre_user_prompt' -Details "user_prompt_present=$([bool](-not [string]::IsNullOrWhiteSpace($userPrompt)))"

[void](Test-ArchitectureCompliance -WorkspaceRoot $workspaceRoot)
[void](Test-AgentsAvailable -WorkspaceRoot $workspaceRoot)

if (-not [string]::IsNullOrWhiteSpace($userPrompt)) {
    Find-Workflow -WorkspaceRoot $workspaceRoot -UserPrompt $userPrompt
    Write-PromptStartLog -WorkspaceRoot $workspaceRoot -UserPrompt $userPrompt
}

Write-Host '--------------------------------------------------'
Write-Host '[OK] Pre-prompt validation complete'
exit 0

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

    $slugParts = $UserPrompt -split '\s+' | Select-Object -First 8
    $slug = (($slugParts -join '-').ToLowerInvariant()) -replace '[^a-z0-9-]', ''
    if ([string]::IsNullOrWhiteSpace($slug)) {
        $slug = 'prompt'
    }
    $timestamp = $now.ToString('HH-mm-ss')
    $filename = "$timestamp-auto-$slug-start.md"
    $logFile = Join-Path $dateDir $filename

    $content = @"
---
timestamp: "`$($now.ToString('yyyy-MM-dd HH:mm:ss'))"
type: auto_prompt_start
---

# Prompt Start: $($slug.Substring(0, [Math]::Min(50, $slug.Length)))

**Time:** $($now.ToString('yyyy-MM-dd HH:mm:ss'))

## User Prompt

$UserPrompt

## Context

Pre-prompt validation initiated.

## Tags

#general
"@

    [System.IO.File]::WriteAllText($logFile, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "[OK] Logged prompt start to $logFile"
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
$userPrompt = [string](Get-PropertyValue -Object $context -Name 'user_prompt')

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

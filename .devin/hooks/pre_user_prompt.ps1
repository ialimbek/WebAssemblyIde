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

function Match-Workflow {
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

    $matched = foreach ($workflow in $workflowKeywords.Keys) {
        $keywords = $workflowKeywords[$workflow]
        if (($keywords | Where-Object { $promptLower.Contains($_) }).Count -gt 0) {
            $workflow
        }
    }

    if ($matched -and $matched.Count -gt 0) {
        Write-Host "[INFO] Suggested workflows: $($matched -join ', ')"
    }
}

$workspaceRoot = (Get-Location).Path
$context = Read-JsonFromStdin
$userPrompt = [string](Get-PropertyValue -Object $context -Name 'user_prompt')

Write-Host "[INFO] Pre-prompt validation for: $workspaceRoot"
Write-Host '--------------------------------------------------'

[void](Test-ArchitectureCompliance -WorkspaceRoot $workspaceRoot)
[void](Test-AgentsAvailable -WorkspaceRoot $workspaceRoot)

if (-not [string]::IsNullOrWhiteSpace($userPrompt)) {
    Match-Workflow -WorkspaceRoot $workspaceRoot -UserPrompt $userPrompt
}

Write-Host '--------------------------------------------------'
Write-Host '[OK] Pre-prompt validation complete'
exit 0

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

function Get-ModifiedFiles {
    param([object]$FilesModified)

    if ($null -eq $FilesModified) {
        return @()
    }

    if ($FilesModified -is [string]) {
        if ([string]::IsNullOrWhiteSpace($FilesModified)) {
            return @()
        }
        return @($FilesModified)
    }

    return @($FilesModified)
}

function Get-TagList {
    param([string]$UserPrompt)

    $tags = New-Object System.Collections.Generic.List[string]
    $promptLower = $UserPrompt.ToLowerInvariant()

    if ($promptLower.Contains('bug') -or $promptLower.Contains('fix')) {
        $tags.Add('#bugfix')
    }
    if ($promptLower.Contains('feature') -or $promptLower.Contains('add')) {
        $tags.Add('#feature')
    }
    if ($promptLower.Contains('refactor')) {
        $tags.Add('#refactor')
    }
    if ($promptLower.Contains('test')) {
        $tags.Add('#testing')
    }

    if ($tags.Count -eq 0) {
        $tags.Add('#general')
    }

    return $tags
}

function Write-PromptExchangeLog {
    param(
        [string]$WorkspaceRoot,
        [string]$UserPrompt,
        [string]$AiResponse,
        [string]$ContextInfo
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
    $filename = "$timestamp-auto-$slug.md"
    $logFile = Join-Path $dateDir $filename

    $tags = Get-TagList -UserPrompt $UserPrompt
    $responseText = $AiResponse
    if ($responseText.Length -gt 2000) {
        $responseText = $responseText.Substring(0, 2000) + '...'
    }

    $content = @"
---
timestamp: `"$($now.ToString('yyyy-MM-dd HH:mm:ss'))`"
type: auto_prompt
---

# Prompt: $($slug.Substring(0, [Math]::Min(50, $slug.Length)))

**Time:** $($now.ToString('yyyy-MM-dd HH:mm:ss'))

## User Prompt

$UserPrompt

## AI Response

$responseText

## Context

$ContextInfo

## Tags

$($tags -join ', ')
"@

    [System.IO.File]::WriteAllText($logFile, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "[OK] Logged prompt exchange to $logFile"
}

function Write-FileChangeLog {
    param(
        [string]$WorkspaceRoot,
        [object]$FilesModified,
        [string]$Reason
    )

    $files = Get-ModifiedFiles -FilesModified $FilesModified
    if ($files.Count -eq 0) {
        return
    }

    $journalsDir = Initialize-AgentJournalsStructure -WorkspaceRoot $WorkspaceRoot
    $disableFile = Join-Path $journalsDir '.disable-auto-logging'
    if (Test-Path $disableFile) {
        return
    }

    $now = Get-Date
    $dateDir = Join-Path (Join-Path $journalsDir 'logs') $now.ToString('yyyy-MM-dd')
    New-Item -ItemType Directory -Path $dateDir -Force | Out-Null

    $timestamp = $now.ToString('HH-mm-ss')
    $filename = "$timestamp-auto-file-changes.md"
    $logFile = Join-Path $dateDir $filename
    $filesList = ($files | ForEach-Object { "- $_" }) -join [Environment]::NewLine

    $content = @"
---
timestamp: `"$($now.ToString('yyyy-MM-dd HH:mm:ss'))`"
type: auto_change_log
---

# Change: File Modifications

**Time:** $($now.ToString('yyyy-MM-dd HH:mm:ss'))

## Files Modified

$filesList

## Reason

$Reason

## Impact

Updated workspace files based on AI response.

## Notes

Logged automatically by post_cascade_response hook.
"@

    [System.IO.File]::WriteAllText($logFile, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "[OK] Logged file changes to $logFile"
}

function Write-TodoUpdateSuggestions {
    param(
        [string]$WorkspaceRoot,
        [string]$ResponseContent
    )

    $todoPath = Join-Path $WorkspaceRoot 'TODO.md'
    if (-not (Test-Path $todoPath)) {
        Write-Host '[WARN] TODO.md not found'
        return
    }

    $responseLower = $ResponseContent.ToLowerInvariant()
    $suggestions = New-Object System.Collections.Generic.List[string]

    if ($responseLower.Contains('completed') -or $responseLower.Contains('done')) {
        $suggestions.Add('Consider marking related TODO items as completed')
    }
    if ($responseLower.Contains('created') -or $responseLower.Contains('added')) {
        $suggestions.Add('Consider adding new TODO items for created features')
    }
    if ($responseLower.Contains('fixed') -or $responseLower.Contains('resolved')) {
        $suggestions.Add('Consider updating TODO status for fixed issues')
    }

    if ($suggestions.Count -gt 0) {
        Write-Host '[INFO] TODO.md update suggestions:'
        foreach ($suggestion in $suggestions) {
            Write-Host "  - $suggestion"
        }
    }
}

$workspaceRoot = (Get-Location).Path
$context = Read-JsonFromStdin
$userPrompt = [string](Get-PropertyValue -Object $context -Name 'user_prompt')
$aiResponse = [string](Get-PropertyValue -Object $context -Name 'response')
$filesModified = Get-ModifiedFiles -FilesModified (Get-PropertyValue -Object $context -Name 'files_modified')

Write-Host "[INFO] Post-response processing for: $workspaceRoot"
Write-Host '--------------------------------------------------'

Write-HookHeartbeat -WorkspaceRoot $workspaceRoot -HookName 'post_cascade_response' -Details "response_present=$([bool](-not [string]::IsNullOrWhiteSpace($aiResponse))); files_modified=$($filesModified.Count)"

Initialize-AgentJournalsStructure -WorkspaceRoot $workspaceRoot | Out-Null

if (-not [string]::IsNullOrWhiteSpace($userPrompt) -and -not [string]::IsNullOrWhiteSpace($aiResponse)) {
    $contextInfo = "Files modified: $($filesModified.Count)"
    Write-PromptExchangeLog -WorkspaceRoot $workspaceRoot -UserPrompt $userPrompt -AiResponse $aiResponse -ContextInfo $contextInfo
}

if ($filesModified.Count -gt 0) {
    Write-FileChangeLog -WorkspaceRoot $workspaceRoot -FilesModified $filesModified -Reason 'AI response applied'
}

if (-not [string]::IsNullOrWhiteSpace($aiResponse)) {
    Write-TodoUpdateSuggestions -WorkspaceRoot $workspaceRoot -ResponseContent $aiResponse
}

Write-Host '--------------------------------------------------'
Write-Host '[OK] Post-response processing complete'
exit 0


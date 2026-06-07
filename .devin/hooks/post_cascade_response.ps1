$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

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

function Convert-ToAsciiText {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return ''
    }

    $result = New-Object System.Text.StringBuilder
    foreach ($char in $Value.ToCharArray()) {
        $code = [int][char]$char
        switch ($code) {
            231 { [void]$result.Append('c') }  # ç
            199 { [void]$result.Append('C') }  # Ç
            287 { [void]$result.Append('g') }  # ğ
            286 { [void]$result.Append('G') }  # Ğ
            305 { [void]$result.Append('i') }  # ı
            304 { [void]$result.Append('I') }  # İ
            246 { [void]$result.Append('o') }  # ö
            214 { [void]$result.Append('O') }  # Ö
            351 { [void]$result.Append('s') }  # ş
            350 { [void]$result.Append('S') }  # Ş
            252 { [void]$result.Append('u') }  # ü
            220 { [void]$result.Append('U') }  # Ü
            default { [void]$result.Append($char) }
        }
    }

    return $result.ToString()
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

        return '[proje dışı]'
    }

    $normalizedPath = $normalizedPath.Replace('\', '/')
    if ([string]::IsNullOrWhiteSpace($normalizedPath)) {
        return '.'
    }

    return $normalizedPath
}

function ConvertTo-ProjectRelativePaths {
    param(
        [string]$WorkspaceRoot,
        [object[]]$Paths
    )

    return @($Paths | ForEach-Object { Get-ProjectRelativePath -WorkspaceRoot $WorkspaceRoot -Path ([string]$_) })
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

function ConvertTo-ProjectRelativeReferences {
    param(
        [string]$WorkspaceRoot,
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $Value
    }

    $result = $Value
    $pattern = '@\[([^\]]+)\]'
    $result = [regex]::Replace($result, $pattern, {
        param($match)
        $content = $match.Groups[1].Value
        if ($content -match '^[a-zA-Z]:\\') {
            $relative = Get-ProjectRelativePath -WorkspaceRoot $WorkspaceRoot -Path $content
            return "@[$relative]"
        }
        return $match.Value
    })

    return $result
}

function Get-LogSlug {
    param(
        [string]$Value,
        [int]$MaxWords = 8
    )

    # Remove @[...] references before processing
    $cleanValue = [regex]::Replace($Value, '@\[[^\]]+\]', '')
    $cleanText = ConvertTo-LogSafeText -Value (Convert-ToAsciiText -Value $cleanValue)
    $words = $cleanText -split '\s+' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -First $MaxWords

    if ($words.Count -eq 0) {
        return 'prompt'
    }

    $slug = (($words -join '-') -replace '[^a-zA-Z0-9-]', '').ToLowerInvariant()
    # Fix Turkish İ -> i conversion
    $slug = $slug -replace 'İ', 'i'
    $slug = $slug -replace '-{2,}', '-'
    $slug = $slug.Trim('-')

    if ([string]::IsNullOrWhiteSpace($slug)) {
        return 'prompt'
    }

    return $slug.Substring(0, [Math]::Min(60, $slug.Length))
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
        [System.IO.File]::WriteAllText($logFile, "# Hook Activation Log`r`n`r`n", [System.Text.UTF8Encoding]::new($true))
    }

    $entry = @"
## [$($now.ToString('HH:mm:ss'))] $HookName

$Details

"@

    [System.IO.File]::AppendAllText($logFile, $entry, [System.Text.UTF8Encoding]::new($true))
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

    $sanitizedPrompt = ConvertTo-LogSafeText -Value (ConvertTo-ProjectRelativeReferences -WorkspaceRoot $WorkspaceRoot -Value (ConvertTo-ProjectRelativeText -WorkspaceRoot $WorkspaceRoot -Value $UserPrompt))
    $slug = Get-LogSlug -Value $sanitizedPrompt
    $timestamp = $now.ToString('HH-mm-ss')
    $filename = "$timestamp-auto-$slug.md"
    $logFile = Join-Path $dateDir $filename

    $tags = Get-TagList -UserPrompt $UserPrompt
    $responseText = ConvertTo-LogSafeText -Value (ConvertTo-ProjectRelativeReferences -WorkspaceRoot $WorkspaceRoot -Value (ConvertTo-ProjectRelativeText -WorkspaceRoot $WorkspaceRoot -Value $AiResponse))
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

$sanitizedPrompt

## AI Response

$responseText

## Context

$ContextInfo

## Tags

$($tags -join ', ')
"@

    [System.IO.File]::WriteAllText($logFile, $content, [System.Text.UTF8Encoding]::new($true))
    $relativeLogFile = Get-ProjectRelativePath -WorkspaceRoot $WorkspaceRoot -Path $logFile
    Write-Host "[OK] Logged prompt exchange to $relativeLogFile"
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
    $relativeFiles = ConvertTo-ProjectRelativePaths -WorkspaceRoot $WorkspaceRoot -Paths $files
    $filesList = ($relativeFiles | ForEach-Object { "- $_" }) -join [Environment]::NewLine
    $safeReason = ConvertTo-LogSafeText -Value $Reason

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

$safeReason

## Impact

Updated workspace files based on AI response.

## Notes

Logged automatically by post_cascade_response hook.
"@

    [System.IO.File]::WriteAllText($logFile, $content, [System.Text.UTF8Encoding]::new($true))
    $relativeLogFile = Get-ProjectRelativePath -WorkspaceRoot $WorkspaceRoot -Path $logFile
    Write-Host "[OK] Logged file changes to $relativeLogFile"
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
$toolInfo = Get-PropertyValue -Object $context -Name 'tool_info'
$userPrompt = [string](Get-PropertyValue -Object $toolInfo -Name 'user_prompt')
$aiResponse = [string](Get-PropertyValue -Object $toolInfo -Name 'response')
$filesModified = Get-ModifiedFiles -FilesModified (Get-PropertyValue -Object $toolInfo -Name 'files_modified')

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

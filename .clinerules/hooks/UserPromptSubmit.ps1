# UserPromptSubmit Hook
# Adds lightweight project reminders to each user prompt.

try {
    $rawInput = [Console]::In.ReadToEnd()
    if ($rawInput) {
        $null = $rawInput | ConvertFrom-Json
    }
} catch {
    Write-Error "[UserPromptSubmit] Invalid JSON input: $($_.Exception.Message)"
}

@{
    cancel = $false
    contextModification = "Project reminder: source of truth is ARCHITECTURE.md and TODO.md. Rules/workflows/hooks live under .clinerules/. Skills live under .agents/skills/<name>/SKILL.md. Do not use .cline/."
    errorMessage = ""
} | ConvertTo-Json -Compress

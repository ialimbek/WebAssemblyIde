# PostToolUse Hook
# Template post-tool audit reminder.

try {
    $rawInput = [Console]::In.ReadToEnd()
    if ($rawInput) {
        $null = $rawInput | ConvertFrom-Json
    }
} catch {
    Write-Error "[PostToolUse] Invalid JSON input: $($_.Exception.Message)"
}

@{
    cancel = $false
    contextModification = "After tool use, update task_progress and validate changed files when possible. Do not mark TODO items complete unless implemented and verified."
    errorMessage = ""
} | ConvertTo-Json -Compress

# Stop Hook
# Final reminder for summaries and validation.

try {
    $rawInput = [Console]::In.ReadToEnd()
    if ($rawInput) {
        $null = $rawInput | ConvertFrom-Json
    }
} catch {
    Write-Error "[Stop] Invalid JSON input: $($_.Exception.Message)"
}

@{
    cancel = $false
    contextModification = "Final response should summarize changed files, validation results, and any remaining steps."
    errorMessage = ""
} | ConvertTo-Json -Compress

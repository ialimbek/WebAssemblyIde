# PreToolUse Hook
# Template policy gate before tool execution.

try {
    $rawInput = [Console]::In.ReadToEnd()
    if ($rawInput) {
        $payload = $rawInput | ConvertFrom-Json
    }
} catch {
    Write-Error "[PreToolUse] Invalid JSON input: $($_.Exception.Message)"
}

$cancel = $false
$message = ""

@{
    cancel = $cancel
    contextModification = ""
    errorMessage = $message
} | ConvertTo-Json -Compress

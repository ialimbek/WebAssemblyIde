# TaskResume Hook
# Restores safe project context when a task resumes.

try {
    $rawInput = [Console]::In.ReadToEnd()
    if ($rawInput) {
        $null = $rawInput | ConvertFrom-Json
    }
} catch {
    Write-Error "[TaskResume] Invalid JSON input: $($_.Exception.Message)"
}

@{
    cancel = $false
    contextModification = "Before continuing, use ARCHITECTURE.md, TODO.md, .clinerules/manifest.json and .agents/skills as project context. Preserve Command Bus, Event Bus, Tool Registry, security, startup and TODO discipline."
    errorMessage = ""
} | ConvertTo-Json -Compress

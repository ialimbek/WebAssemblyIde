$files = Get-ChildItem -Recurse -Filter 'package.json' -Exclude 'node_modules' | Where-Object { $_.FullName -notlike '*node_modules*' }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match 'workspace:') {
        $newContent = $content -replace 'workspace:\*', '*'
        Set-Content $file.FullName -Value $newContent -NoNewline
        Write-Host ("Fixed: " + $file.FullName)
    }
}
Write-Host "Done."

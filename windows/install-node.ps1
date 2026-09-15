# Node.js LTS ni jimgina o'rnatadi
$ErrorActionPreference = 'Stop'

try {
    $url  = 'https://nodejs.org/dist/v22.11.0/node-v22.11.0-x64.msi'
    $file = Join-Path $env:TEMP 'node-lts.msi'

    Write-Host '   Node.js yuklab olinmoqda (~30 MB)...'
    Invoke-WebRequest -Uri $url -OutFile $file -UseBasicParsing

    Write-Host '   O''rnatilmoqda...'
    $process = Start-Process msiexec -ArgumentList '/i', "`"$file`"", '/qn', '/norestart' -Wait -PassThru

    Remove-Item $file -ErrorAction SilentlyContinue

    if ($process.ExitCode -ne 0) {
        Write-Host "   O'rnatish kodi: $($process.ExitCode)"
        exit 1
    }

    exit 0
}
catch {
    Write-Host "   Xatolik: $($_.Exception.Message)"
    exit 1
}

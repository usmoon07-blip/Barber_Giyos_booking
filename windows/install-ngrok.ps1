# Ngrok'ni yuklab, loyiha papkasiga chiqaradi
param([string]$Target = '.')

$ErrorActionPreference = 'Stop'

try {
    $url = 'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip'
    $zip = Join-Path $env:TEMP 'ngrok.zip'

    Write-Host '   Ngrok yuklab olinmoqda...'
    Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing

    Write-Host '   Ochilmoqda...'
    Expand-Archive -Path $zip -DestinationPath $Target -Force
    Remove-Item $zip -ErrorAction SilentlyContinue

    if (-not (Test-Path (Join-Path $Target 'ngrok.exe'))) { exit 1 }
    exit 0
}
catch {
    Write-Host "   Xatolik: $($_.Exception.Message)"
    exit 1
}

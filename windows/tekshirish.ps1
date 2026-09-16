# Tekshiruv - nima ishlayapti, nima yoq
# TEKSHIRISH.bat shu skriptni chaqiradi.

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Root = Split-Path -Parent $PSScriptRoot

$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
            [System.Environment]::GetEnvironmentVariable('Path', 'User') +
            ";$env:ProgramFiles\nodejs;$env:LOCALAPPDATA\Programs\nodejs"

if (-not (Test-Path (Join-Path $Root 'backend\package.json'))) {
    Write-Host ''
    Write-Host '   Loyiha fayllari topilmadi.' -ForegroundColor Red
    Write-Host ''
    Write-Host '   ZIP faylni avval CHIQARING:' -ForegroundColor Yellow
    Write-Host '     1. ZIP ustiga ong tugma'
    Write-Host '     2. "Extract All..."'
    Write-Host '     3. "Extract"'
    Write-Host '     4. Ochilgan papkadagi TEKSHIRISH.bat ni bosing'
    Write-Host ''
    Read-Host '   Yopish uchun Enter bosing'
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host ''
    Write-Host '   Node.js ornatilmagan.' -ForegroundColor Red
    Write-Host ''
    Write-Host '   -> Avval BOSHLASH.bat faylini oching - u ozi ornatadi.' -ForegroundColor Yellow
    Write-Host ''
    Read-Host '   Yopish uchun Enter bosing'
    exit 1
}

node (Join-Path $PSScriptRoot 'doctor.js')

Write-Host ''
Write-Host '   Yuqorida [X] belgisi bolsa, yonidagi -> ni bajaring.'
Write-Host '   Tushunarsiz bolsa - shu oynaning rasmini yuboring.'
Write-Host ''
Read-Host '   Yopish uchun Enter bosing'

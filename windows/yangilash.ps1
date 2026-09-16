# Dasturning yangi versiyasini yuklaydi
# YANGILASH.bat shu skriptni chaqiradi.

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Root = Split-Path -Parent $PSScriptRoot

function Line([string]$Char = '-') { Write-Host ('  ' + ($Char * 56)) }
function Ok($Text)   { Write-Host "  [OK] $Text" -ForegroundColor Green }
function Info($Text) { Write-Host "  $Text" }
function Have($Name) { return [bool](Get-Command $Name -ErrorAction SilentlyContinue) }

function Run($Folder, $File, $Arguments) {
    Push-Location (Join-Path $Root $Folder)
    try { & $File @Arguments }
    finally { Pop-Location }
}

Clear-Host
Write-Host ''
Line '='
Write-Host '    YANGILASH'
Line '='
Write-Host ''
Write-Host '   Dasturning yangi versiyasini yuklab oladi.'
Write-Host '   Bronlaringiz va mijozlaringiz saqlanib qoladi.'
Write-Host ''
Write-Host '   Server ishlab turgan bolsa, avval uni toxtating (Ctrl+C).'
Write-Host ''
Read-Host '   Davom etish uchun Enter bosing'

$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
            [System.Environment]::GetEnvironmentVariable('Path', 'User') + ";$env:ProgramFiles\nodejs"

if (-not (Have 'git')) {
    Write-Host ''
    Write-Host '   Git topilmadi. Yangi versiyani qolda yuklang:' -ForegroundColor Yellow
    Write-Host '   github.com/usmoon07-blip/Barber_Giyos_booking'
    Write-Host '   Code -> Download ZIP'
    Write-Host ''
    Write-Host '   Eski papkadagi backend\.env faylini yangisiga kochiring!'
    Write-Host ''
    Read-Host '   Yopish uchun Enter bosing'
    exit 1
}

Write-Host ''
Info 'Yangi versiya yuklanmoqda...'
Write-Host ''

Push-Location $Root
git pull
Pop-Location

$npm = 'npm.cmd'; if (-not (Have $npm)) { $npm = 'npm' }
$npx = 'npx.cmd'; if (-not (Have $npx)) { $npx = 'npx' }

Write-Host ''
Info 'Dasturlar yangilanmoqda...'
Write-Host ''

Run 'backend' $npm @('install', '--no-audit', '--no-fund', '--loglevel=error')
Run 'backend' $npx @('prisma', 'migrate', 'deploy')
Run 'backend' $npx @('prisma', 'generate', '--no-hints')

Run 'miniapp' $npm @('install', '--no-audit', '--no-fund', '--loglevel=error')
Run 'miniapp' $npm @('run', 'build')

Run 'admin' $npm @('install', '--no-audit', '--no-fund', '--loglevel=error')
Run 'admin' $npm @('run', 'build')

Clear-Host
node (Join-Path $PSScriptRoot 'doctor.js')

Write-Host ''
Line '='
Ok 'Yangilandi. Endi BOSHLASH.bat ni oching.'
Line '='
Write-Host ''
Read-Host '   Yopish uchun Enter bosing'

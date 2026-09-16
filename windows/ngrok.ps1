# Mini App uchun HTTPS havola (ngrok)
# NGROK.bat shu skriptni chaqiradi.

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Root = Split-Path -Parent $PSScriptRoot

function Line([string]$Char = '-') { Write-Host ('  ' + ($Char * 56)) }
function Ok($Text)   { Write-Host "  [OK] $Text" -ForegroundColor Green }
function Info($Text) { Write-Host "  $Text" }
function Warn($Text) { Write-Host "  $Text" -ForegroundColor Yellow }

function Fail($Title, $Fix) {
    Write-Host ''
    Line '='
    Write-Host "   XATOLIK: $Title" -ForegroundColor Red
    Line '='
    Write-Host ''
    foreach ($item in $Fix) { Write-Host "   -> $item" -ForegroundColor Yellow }
    Write-Host ''
    Read-Host '   Yopish uchun Enter bosing'
    exit 1
}

function Have($Name) { return [bool](Get-Command $Name -ErrorAction SilentlyContinue) }

# Izohsiz birinchi qatorni oladi
function ReadSetting($Path) {
    if (-not (Test-Path $Path)) { return $null }

    foreach ($line in Get-Content $Path) {
        $value = $line.Trim()
        if ($value -and -not $value.StartsWith('#')) { return $value }
    }
    return $null
}

Clear-Host
Write-Host ''
Line '='
Write-Host '    MINI APP HAVOLASI (ngrok)'
Line '='
Write-Host ''
Write-Host '   Telegram Mini App faqat https havolada ishlaydi.'
Write-Host '   Bu dastur shuni tayyorlab beradi.'
Write-Host ''
Warn '   BOSHLASH.bat ishlab turgan bolishi kerak!'
Write-Host ''
Line '='
Write-Host ''
Read-Host '   Davom etish uchun Enter bosing'

# ─────────────────────────────────────────────────────────
#  1. Ngrok bormi?
# ─────────────────────────────────────────────────────────
$ngrokExe = Join-Path $Root 'ngrok.exe'

if (Have 'ngrok') {
    $ngrok = 'ngrok'
}
elseif (Test-Path $ngrokExe) {
    $ngrok = $ngrokExe
}
else {
    Write-Host ''
    Info 'Ngrok topilmadi. Yuklab olinmoqda...'
    Write-Host ''

    try {
        $url = 'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip'
        $zip = Join-Path $env:TEMP 'ngrok.zip'

        Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
        Expand-Archive -Path $zip -DestinationPath $Root -Force
        Remove-Item $zip -ErrorAction SilentlyContinue
    }
    catch {
        Fail 'Ngrok yuklab olinmadi' @(
            'ngrok.com/download saytiga kiring',
            'Windows versiyasini yuklang',
            'ZIP ichidagi ngrok.exe ni loyiha papkasiga qoying'
        )
    }

    if (-not (Test-Path $ngrokExe)) {
        Fail 'Ngrok fayli topilmadi' @('ngrok.com/download dan qolda yuklang')
    }

    $ngrok = $ngrokExe
    Ok 'Ngrok yuklandi'
}

# ─────────────────────────────────────────────────────────
#  2. Hisob tokeni
# ─────────────────────────────────────────────────────────
$configPath = Join-Path $env:LOCALAPPDATA 'ngrok\ngrok.yml'

if (-not (Test-Path $configPath)) {
    $token = ReadSetting (Join-Path $PSScriptRoot 'ngrok-token.txt')

    if (-not $token) {
        Clear-Host
        Write-Host ''
        Line '='
        Write-Host '    NGROK HISOBI'
        Line '='
        Write-Host ''
        Write-Host '   1. Brauzerda oching:'
        Write-Host '      dashboard.ngrok.com/get-started/your-authtoken'
        Write-Host ''
        Write-Host '   2. Uzun kalitni nusxalang'
        Write-Host ''
        Write-Host '   3. Shu yerga ONG TUGMA bilan qoying va Enter bosing'
        Write-Host ''
        $token = (Read-Host '   Token').Trim()
    }
    else {
        Info 'Token fayldan oqildi.'
    }

    if (-not $token) {
        Fail 'Token kiritilmadi' @('NGROK.bat ni qaytadan oching')
    }

    & $ngrok config add-authtoken $token | Out-Null

    if (-not (Test-Path $configPath)) {
        Fail 'Token qabul qilinmadi' @(
            'Token togri nusxalanganini tekshiring',
            'dashboard.ngrok.com/get-started/your-authtoken'
        )
    }

    Ok 'Hisob sozlandi'
    Start-Sleep -Seconds 1
}

# ─────────────────────────────────────────────────────────
#  3. Ishga tushirish
# ─────────────────────────────────────────────────────────
$domain = ReadSetting (Join-Path $PSScriptRoot 'ngrok-domen.txt')

Clear-Host
Write-Host ''
Line '='
Write-Host '    NGROK ISHGA TUSHMOQDA'
Line '='
Write-Host ''

if ($domain) {
    Write-Host "   Doimiy domen: $domain"
    Write-Host '   Bu havola har doim bir xil.'
    Start-Process -FilePath $ngrok -ArgumentList 'http', '3000', "--domain=$domain"
}
else {
    Write-Host '   Doimiy domen sozlanmagan - havola har safar ozgaradi.'
    Write-Host ''
    Write-Host '   Buni bir marta hal qilish uchun:'
    Write-Host '     1. dashboard.ngrok.com -> Domains -> New Domain'
    Write-Host '     2. Bepul domenni windows\ngrok-domen.txt fayliga yozing'
    Start-Process -FilePath $ngrok -ArgumentList 'http', '3000'
}

Write-Host ''
Line '='
Write-Host ''

node (Join-Path $PSScriptRoot 'ngrok-url.js')

Write-Host ''
Warn '   Ngrok alohida oynada ishlab turibdi - uni yopmang.'
Write-Host ''
Read-Host '   Yopish uchun Enter bosing'

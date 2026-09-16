# G'iyos Barbershop - to'liq o'rnatish va ishga tushirish
# BOSHLASH.bat shu skriptni chaqiradi.

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Root = Split-Path -Parent $PSScriptRoot

function Line([string]$Char = '-') {
    Write-Host ('  ' + ($Char * 56))
}

function Title($Text) {
    Clear-Host
    Write-Host ''
    Line '='
    Write-Host "    $Text"
    Line '='
    Write-Host ''
}

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
    Write-Host '   Tushunarsiz bolsa - shu oynaning rasmini yuboring.'
    Write-Host ''
    Read-Host '   Davom etish uchun Enter bosing'
    exit 1
}

# PATH ni yangilaydi (Node.js o'rnatilgandan keyin kerak)
function Refresh-Path {
    $machine = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user    = [System.Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "$machine;$user;$env:ProgramFiles\nodejs;$env:LOCALAPPDATA\Programs\nodejs"
}

function Have($Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

# Buyruqni papkada bajaradi, xato bo'lsa to'xtatadi
function Run($Folder, $File, $Arguments, $What) {
    Push-Location (Join-Path $Root $Folder)
    try {
        & $File @Arguments
        if ($LASTEXITCODE -ne 0) { throw "$What (kod $LASTEXITCODE)" }
    }
    finally { Pop-Location }
}

# ─────────────────────────────────────────────────────────
#  0. To'g'ri joydan ishga tushirilganmi?
# ─────────────────────────────────────────────────────────
if (-not (Test-Path (Join-Path $Root 'backend\package.json'))) {
    Fail 'Loyiha fayllari topilmadi' @(
        'Siz dasturni ZIP arxivning ICHIDAN ishga tushirgan bolishingiz mumkin.',
        'ZIP faylni avval CHIQARISH kerak:',
        '   1. ZIP fayl ustiga ong tugma bilan bosing',
        '   2. "Extract All..." ni tanlang',
        '   3. "Extract" tugmasini bosing',
        '   4. Ochilgan papkadagi BOSHLASH.bat ni ikki marta bosing'
    )
}

Title "G'IYOS BARBERSHOP"
Write-Host '   Bu dastur hamma ishni ozi bajaradi.'
Write-Host ''
Write-Host '     - Node.js ni tekshiradi (yoq bolsa ornatadi)'
Write-Host '     - sozlamalarni soraydi'
Write-Host '     - bazani tayyorlaydi'
Write-Host '     - serverni va botni ishga tushiradi'
Write-Host ''
Write-Host '   Birinchi safar 5-10 daqiqa vaqt oladi.'
Write-Host ''
Line '='
Write-Host ''
Read-Host '   Boshlash uchun Enter bosing'

# ─────────────────────────────────────────────────────────
#  1. Node.js
# ─────────────────────────────────────────────────────────
Title '1/5   NODE.JS'

Refresh-Path

if (-not (Have 'node')) {
    Warn 'Node.js topilmadi. Ornatilmoqda...'
    Write-Host '  (Windows ruxsat sorasa - "Ha" deng)'
    Write-Host ''

    $installed = $false

    if (Have 'winget') {
        try {
            winget install -e --id OpenJS.NodeJS.LTS --silent `
                --accept-source-agreements --accept-package-agreements | Out-Null
            $installed = $true
        }
        catch { $installed = $false }
    }

    if (-not $installed) {
        try {
            $url  = 'https://nodejs.org/dist/v22.11.0/node-v22.11.0-x64.msi'
            $file = Join-Path $env:TEMP 'node-lts.msi'

            Info 'Yuklab olinmoqda (~30 MB)...'
            Invoke-WebRequest -Uri $url -OutFile $file -UseBasicParsing

            Info 'Ornatilmoqda...'
            Start-Process msiexec -ArgumentList '/i', "`"$file`"", '/qn', '/norestart' -Wait
            Remove-Item $file -ErrorAction SilentlyContinue
        }
        catch {
            Fail 'Node.js ornatilmadi' @(
                'nodejs.org saytiga kiring',
                'Katta yashil LTS tugmasini bosing',
                'Faylni ornating va KOMPYUTERNI QAYTA YOQING',
                'Song BOSHLASH.bat ni qaytadan oching'
            )
        }
    }

    Refresh-Path

    if (-not (Have 'node')) {
        Fail 'Node.js ornatildi, lekin hali korinmayapti' @(
            'KOMPYUTERNI QAYTA YOQING',
            'Song BOSHLASH.bat ni qaytadan oching'
        )
    }
}

Ok ('Node.js ' + (node -v))
Start-Sleep -Seconds 1

# ─────────────────────────────────────────────────────────
#  2. Sozlamalar
# ─────────────────────────────────────────────────────────
Title '2/5   SOZLAMALAR'

$envFile = Join-Path $Root 'backend\.env'

if (Test-Path $envFile) {
    Ok 'Sozlamalar allaqachon mavjud'
    Info 'Qaytadan sozlash uchun backend\.env faylini ochiring.'
    Start-Sleep -Seconds 2
}
else {
    node (Join-Path $PSScriptRoot 'setup.js')

    if (-not (Test-Path $envFile)) {
        Fail 'Sozlamalar saqlanmadi' @('BOSHLASH.bat ni qaytadan oching')
    }
}

# ─────────────────────────────────────────────────────────
#  3. Paketlar
# ─────────────────────────────────────────────────────────
Title '3/5   DASTURLAR ORNATILMOQDA'
Write-Host '   Biroz kutasiz - internetdan yuklanadi.'
Write-Host ''

$npm = 'npm.cmd'
if (-not (Have $npm)) { $npm = 'npm' }

try {
    Info '- server'
    Run 'backend' $npm @('install', '--no-audit', '--no-fund', '--loglevel=error') 'server paketlari'

    Info '- mijozlar ilovasi'
    Run 'miniapp' $npm @('install', '--no-audit', '--no-fund', '--loglevel=error') 'miniapp paketlari'

    Info '- boshqaruv paneli'
    Run 'admin' $npm @('install', '--no-audit', '--no-fund', '--loglevel=error') 'admin paketlari'
}
catch {
    Fail 'Dasturlarni ornatib bolmadi' @(
        'Kopincha internet uzilganda shunday boladi.',
        'Internetni tekshiring va BOSHLASH.bat ni qaytadan oching.'
    )
}

Write-Host ''
Ok 'Dasturlar ornatildi'

# ─────────────────────────────────────────────────────────
#  4. Baza va yig'ish
# ─────────────────────────────────────────────────────────
Title '4/5   BAZA TAYYORLANMOQDA'

$npx = 'npx.cmd'
if (-not (Have $npx)) { $npx = 'npx' }

try {
    Run 'backend' $npx @('prisma', 'migrate', 'deploy') 'migratsiya'
    Run 'backend' $npx @('prisma', 'generate', '--no-hints') 'prisma generate'
    Run 'backend' $npm @('run', 'seed') 'namunaviy malumotlar'
}
catch {
    Fail 'Bazaga ulanib bolmadi' @(
        'console.neon.tech saytiga kiring - baza uxlab qolgan bolsa,',
        '   kirganingizda ozi uygonadi. Song qaytadan urinib koring.',
        'Internetni tekshiring.',
        'Baza manzili notogri bolsa: backend\.env faylini ochirib,',
        '   BOSHLASH.bat ni qaytadan oching.'
    )
}

Write-Host ''
Ok 'Baza tayyor'
Write-Host ''
Info 'Ilovalar yigilmoqda...'
Write-Host ''

try {
    Run 'miniapp' $npm @('run', 'build') 'miniapp build'
    Run 'admin'   $npm @('run', 'build') 'admin build'
}
catch {
    Fail 'Ilovalarni yigib bolmadi' @('Yuqoridagi qizil matnning rasmini yuboring')
}

Write-Host ''
Ok 'Ilovalar yigildi'
Start-Sleep -Seconds 1

# ─────────────────────────────────────────────────────────
#  5. Tekshiruv va ishga tushirish
# ─────────────────────────────────────────────────────────
Clear-Host
node (Join-Path $PSScriptRoot 'doctor.js')

Write-Host ''
Line '='
Write-Host '    SERVER ISHGA TUSHMOQDA'
Line '='
Write-Host ''
Write-Host '   Admin panel:  http://localhost:3000/admin'
Write-Host '   Telegramda:   botingizga /start yozing'
Write-Host ''
Warn '   Bu oynani YOPMANG - server shu yerda ishlaydi.'
Write-Host '   Toxtatish uchun: Ctrl + C'
Write-Host ''
Line '='
Write-Host ''

Start-Process 'http://localhost:3000/admin'

Push-Location (Join-Path $Root 'backend')
& $npm start
Pop-Location

Write-Host ''
Write-Host '   Server toxtadi.'
Read-Host '   Yopish uchun Enter bosing'

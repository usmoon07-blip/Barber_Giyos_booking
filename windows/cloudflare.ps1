# Mini App uchun HTTPS havola — Cloudflare Tunnel orqali.
# Hisob va ro'yxatdan o'tish SHART EMAS — ngrok bloklangan hollarda ishlatiladi.
# CLOUDFLARE.bat shu skriptni chaqiradi.

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

Clear-Host
Write-Host ''
Line '='
Write-Host '    MINI APP HAVOLASI (Cloudflare Tunnel)'
Line '='
Write-Host ''
Write-Host '   Ngrok bloklangan bolsa, shu usul ishlatiladi.'
Write-Host '   Hisob va royxatdan otish SHART EMAS.'
Write-Host ''
Warn '   BOSHLASH.bat ishlab turgan bolishi kerak!'
Write-Host ''
Line '='
Write-Host ''
Read-Host '   Davom etish uchun Enter bosing'

# ─────────────────────────────────────────────────────────
#  1. cloudflared bormi?
# ─────────────────────────────────────────────────────────
$cfExe = Join-Path $Root 'cloudflared.exe'

if (Have 'cloudflared') {
    $cloudflared = 'cloudflared'
}
elseif (Test-Path $cfExe) {
    $cloudflared = $cfExe
}
else {
    Write-Host ''
    Info 'Cloudflared topilmadi. Yuklab olinmoqda (~30 MB)...'
    Write-Host ''

    try {
        $url = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'
        Invoke-WebRequest -Uri $url -OutFile $cfExe -UseBasicParsing
    }
    catch {
        Fail 'Cloudflared yuklab olinmadi' @(
            'Internetni tekshiring',
            'Yoki qolda yuklang: github.com/cloudflare/cloudflared/releases',
            '   "cloudflared-windows-amd64.exe" faylini yuklab,',
            '   nomini "cloudflared.exe" ga ozgartirib, loyiha',
            '   papkasiga qoying'
        )
    }

    if (-not (Test-Path $cfExe)) {
        Fail 'Cloudflared fayli topilmadi' @('Yuqoridagi yolni qolda bajaring')
    }

    $cloudflared = $cfExe
    Ok 'Cloudflared yuklandi'
    Start-Sleep -Seconds 1
}

# ─────────────────────────────────────────────────────────
#  2. Tunnel'ni ishga tushiramiz — alohida oynada
# ─────────────────────────────────────────────────────────
Clear-Host
Write-Host ''
Line '='
Write-Host '    TUNNEL OCHILMOQDA'
Line '='
Write-Host ''
Write-Host '   Hozir YANGI oyna ochiladi. U yerda quti ichida'
Write-Host '   shunga oxshash havola korinadi:'
Write-Host ''
Write-Host '     https://random-sozlar-1234.trycloudflare.com' -ForegroundColor Green
Write-Host ''
Write-Host '   10-15 soniya kuting, keyin O SHA HAVOLANI nusxalang'
Write-Host '   (nusxalash: sichqoncha bilan belgilab, ong tugma).'
Write-Host ''
Line '='
Write-Host ''
Read-Host '   Tayyor bolsangiz Enter bosing — oyna ochiladi'

Start-Process -FilePath $cloudflared -ArgumentList 'tunnel', '--url', 'http://localhost:3000'

Write-Host ''
Warn '   Ochilgan oynani YOPMANG — u ishlab turishi kerak.'
Write-Host ''

# ─────────────────────────────────────────────────────────
#  3. Havolani so'raymiz va .env ga o'zimiz yozamiz
# ─────────────────────────────────────────────────────────
Write-Host '   Ochilgan oynadan https://....trycloudflare.com'
Write-Host '   havolasini nusxalab, shu yerga ONG TUGMA bilan qoying:'
Write-Host ''

$mini = ''
while ($mini -notmatch '^https://[\w.-]+\.trycloudflare\.com/?$') {
    $mini = (Read-Host '   Havola').Trim()

    if ($mini -notmatch '^https://[\w.-]+\.trycloudflare\.com/?$') {
        Write-Host ''
        Warn '   Bu https://...trycloudflare.com korinishida emas.'
        Write-Host '   Ochilgan oynadagi yozuvni diqqat bilan qayta nusxalang.'
        Write-Host ''
    }
}

$mini = $mini.TrimEnd('/')

$envFile = Join-Path $Root 'backend\.env'

if (-not (Test-Path $envFile)) {
    Fail 'backend\.env topilmadi' @('Avval BOSHLASH.bat ni ishga tushiring')
}

$content = Get-Content $envFile -Raw
# $mini foydalanuvchi kiritgan matn — regex almashtirish qismida maxsus
# belgi (masalan "$") sifatida talqin qilinmasligi uchun oddiy funksiya
# ichida ishlatamiz ({0} argument, na regex naqsh).
$line = "MINIAPP_URL=`"$mini`""

if ($content -match '(?m)^MINIAPP_URL=.*$') {
    $content = [regex]::Replace($content, '(?m)^MINIAPP_URL=.*$', { param($m) $line })
}
else {
    $content = $content.TrimEnd() + "`r`n$line`r`n"
}

Set-Content -Path $envFile -Value $content -NoNewline -Encoding UTF8

Write-Host ''
Line '='
Ok 'Havola sozlamalarga yozildi'
Line '='
Write-Host ''
Write-Host "   $mini"
Write-Host ''
Warn '   Endi server oynasida Ctrl+C bosing va BOSHLASH.bat ni'
Warn '   qaytadan oching — yangi havola shunda kuchga kiradi.'
Write-Host ''
Line '='
Write-Host ''
Write-Host '   BOTFATHER SOZLAMASI (bir marta):'
Write-Host '     1. Telegram -> @BotFather -> /mybots -> botingiz'
Write-Host '     2. Bot Settings -> Menu Button -> Configure menu button'
Write-Host "     3. Havolani yuboring: $mini"
Write-Host '     4. Tugma nomi: Bron qilish'
Write-Host ''
Line '='
Write-Host ''
Read-Host '   Yopish uchun Enter bosing'

@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title G'iyos Barbershop - Ngrok
cd /d "%~dp0"

cls
echo.
echo  ════════════════════════════════════════════════════════
echo      🌐  MINI APP HAVOLASI (ngrok)
echo  ════════════════════════════════════════════════════════
echo.
echo   Telegram Mini App faqat https havolada ishlaydi.
echo   Bu fayl shuni tayyorlab beradi.
echo.
echo   ⚠️  BOSHLASH.bat ishlab turgan bo'lishi kerak!
echo.
echo  ════════════════════════════════════════════════════════
echo.
pause

REM ── ngrok bormi? ─────────────────────────────────────────
set "NGROK=ngrok"
where ngrok >nul 2>nul
if errorlevel 1 (
  if exist "ngrok.exe" (
    set "NGROK=%~dp0ngrok.exe"
  ) else (
    cls
    echo.
    echo   Ngrok topilmadi. Yuklab olinmoqda...
    echo.
    powershell -NoProfile -ExecutionPolicy Bypass -File "windows\install-ngrok.ps1" -Target "%~dp0"
    if not exist "ngrok.exe" (
      echo.
      echo   ❌ Yuklab bo'lmadi.
      echo.
      echo   👉 https://ngrok.com/download saytiga kiring,
      echo      Windows versiyasini yuklang va ZIP ichidagi
      echo      ngrok.exe faylini shu papkaga qo'ying.
      echo.
      pause
      exit /b 1
    )
    set "NGROK=%~dp0ngrok.exe"
    echo   ✅ Ngrok yuklandi
  )
)

REM ── authtoken sozlanganmi? ───────────────────────────────
if not exist "%USERPROFILE%\AppData\Local\ngrok\ngrok.yml" (
  cls
  echo.
  echo  ════════════════════════════════════════════════════════
  echo      NGROK HISOBI
  echo  ════════════════════════════════════════════════════════
  echo.
  echo   1. https://ngrok.com/signup - Google bilan kiring
  echo   2. Chapdagi "Your Authtoken" bo'limini oching
  echo   3. Tokenni nusxalab, shu yerga joylashtiring
  echo      ^(sichqonchaning o'ng tugmasi = joylashtirish^)
  echo.
  set /p NGROK_TOKEN="   Authtoken: "
  if "!NGROK_TOKEN!"=="" (
    echo.
    echo   ❌ Token kiritilmadi.
    pause
    exit /b 1
  )
  "%NGROK%" config add-authtoken !NGROK_TOKEN!
  if errorlevel 1 (
    echo.
    echo   ❌ Token qabul qilinmadi. Qaytadan urinib ko'ring.
    pause
    exit /b 1
  )
  echo   ✅ Hisob sozlandi
  timeout /t 2 >nul
)

REM ── doimiy domen (ixtiyoriy) ─────────────────────────────
set "DOMAIN="
if exist "windows\ngrok-domen.txt" (
  for /f "usebackq delims=" %%d in ("windows\ngrok-domen.txt") do (
    set "LINE=%%d"
    if not "!LINE!"=="" if not "!LINE:~0,1!"=="#" set "DOMAIN=!LINE!"
  )
)

cls
echo.
echo  ════════════════════════════════════════════════════════
echo      NGROK ISHGA TUSHMOQDA
echo  ════════════════════════════════════════════════════════
echo.
if defined DOMAIN (
  echo   Doimiy domen: !DOMAIN!
  echo   Bu havola har doim bir xil.
  start "ngrok" "%NGROK%" http 3000 --domain=!DOMAIN!
) else (
  echo   Doimiy domen sozlanmagan - havola har safar o'zgaradi.
  echo.
  echo   Buni bir marta hal qilish uchun:
  echo     1. dashboard.ngrok.com → Domains → New Domain
  echo     2. Bepul domenni windows\ngrok-domen.txt fayliga yozing
  start "ngrok" "%NGROK%" http 3000
)
echo.
echo  ════════════════════════════════════════════════════════
echo.

node "windows\ngrok-url.js"

echo.
echo   Ngrok alohida oynada ishlab turibdi - uni yopmang.
echo.
pause

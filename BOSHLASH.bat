@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title G'iyos Barbershop
cd /d "%~dp0"

cls
echo.
echo  ════════════════════════════════════════════════════════
echo      💈  G'IYOS BARBERSHOP
echo  ════════════════════════════════════════════════════════
echo.
echo   Bu fayl hamma ishni o'zi bajaradi:
echo     - Node.js ni tekshiradi (yo'q bo'lsa o'rnatadi)
echo     - sozlamalarni so'raydi
echo     - dasturlarni o'rnatadi va bazani tayyorlaydi
echo     - serverni va botni ishga tushiradi
echo.
echo   Birinchi safar 5-10 daqiqa vaqt oladi.
echo   Keyingi safarlar bir necha soniya.
echo.
echo  ════════════════════════════════════════════════════════
echo.
pause

REM ─────────────────────────────────────────────────────────
REM  1-QADAM: Node.js
REM ─────────────────────────────────────────────────────────
cls
echo.
echo  [1/5]  Node.js tekshirilmoqda...
echo.

call :ENSURE_NODE
if errorlevel 1 goto FAIL

for /f "tokens=*" %%v in ('node -v 2^>nul') do set NODE_VER=%%v
echo   ✅ Node.js !NODE_VER!
timeout /t 1 >nul

REM ─────────────────────────────────────────────────────────
REM  2-QADAM: Sozlamalar
REM ─────────────────────────────────────────────────────────
cls
echo.
echo  [2/5]  Sozlamalar
echo.

if not exist "backend\.env" (
  node "windows\setup.js"
  if errorlevel 1 goto FAIL
  if not exist "backend\.env" (
    echo.
    echo   ❌ Sozlamalar saqlanmadi. Qaytadan urinib ko'ring.
    goto FAIL
  )
) else (
  echo   ✅ Sozlamalar allaqachon mavjud
  echo.
  echo   Qaytadan sozlash uchun backend\.env faylini o'chiring.
  timeout /t 2 >nul
)

REM ─────────────────────────────────────────────────────────
REM  3-QADAM: Paketlar
REM ─────────────────────────────────────────────────────────
cls
echo.
echo  [3/5]  Dasturlar o'rnatilmoqda... (biroz kutasiz)
echo.

echo   - server
cd backend
call npm install --no-audit --no-fund --loglevel=error
if errorlevel 1 goto FAIL_NPM

echo   - mijozlar ilovasi
cd ..\miniapp
call npm install --no-audit --no-fund --loglevel=error
if errorlevel 1 goto FAIL_NPM

echo   - boshqaruv paneli
cd ..\admin
call npm install --no-audit --no-fund --loglevel=error
if errorlevel 1 goto FAIL_NPM

cd ..
echo.
echo   ✅ Dasturlar o'rnatildi

REM ─────────────────────────────────────────────────────────
REM  4-QADAM: Baza va yig'ish
REM ─────────────────────────────────────────────────────────
cls
echo.
echo  [4/5]  Ma'lumotlar bazasi tayyorlanmoqda...
echo.

cd backend
call npx prisma migrate deploy
if errorlevel 1 goto FAIL_DB
call npx prisma generate --no-hints
if errorlevel 1 goto FAIL_DB
call npm run seed
if errorlevel 1 goto FAIL_DB
cd ..

echo.
echo   ✅ Baza tayyor
echo.
echo   Ilovalar yig'ilmoqda...
echo.

cd miniapp
call npm run build
if errorlevel 1 goto FAIL_BUILD
cd ..\admin
call npm run build
if errorlevel 1 goto FAIL_BUILD
cd ..

echo.
echo   ✅ Ilovalar yig'ildi

REM ─────────────────────────────────────────────────────────
REM  5-QADAM: Tekshiruv va ishga tushirish
REM ─────────────────────────────────────────────────────────
cls
node "windows\doctor.js"

echo.
echo  ════════════════════════════════════════════════════════
echo      SERVER ISHGA TUSHMOQDA
echo  ════════════════════════════════════════════════════════
echo.
echo   Admin panel:  http://localhost:3000/admin
echo   Telegramda:   botingizga /start yozing
echo.
echo   Bu oynani YOPMANG - server shu yerda ishlaydi.
echo   To'xtatish uchun: Ctrl + C
echo.
echo  ════════════════════════════════════════════════════════
echo.

start "" http://localhost:3000/admin

cd backend
call npm start

echo.
echo   Server to'xtadi.
pause
exit /b 0

REM ═════════════════════════════════════════════════════════
REM  Node.js o'rnatish
REM ═════════════════════════════════════════════════════════
:ENSURE_NODE
where node >nul 2>nul
if not errorlevel 1 exit /b 0

echo   Node.js topilmadi. O'rnatilmoqda...
echo   ^(Windows ruxsat so'rasa "Ha" deng^)
echo.

where winget >nul 2>nul
if not errorlevel 1 (
  winget install -e --id OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements
) else (
  echo   Yuklab olinmoqda...
  powershell -NoProfile -ExecutionPolicy Bypass -File "windows\install-node.ps1"
)

set "PATH=%PATH%;%ProgramFiles%\nodejs\;%LOCALAPPDATA%\Programs\nodejs\"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   ❌ Node.js o'rnatilmadi.
  echo.
  echo   👉 https://nodejs.org saytiga kiring, katta yashil LTS
  echo      tugmasini bosing, faylni o'rnating va KOMPYUTERNI
  echo      QAYTA YOQING. So'ng shu faylni qaytadan oching.
  echo.
  exit /b 1
)
exit /b 0

REM ═════════════════════════════════════════════════════════
:FAIL_NPM
cd /d "%~dp0"
echo.
echo  ════════════════════════════════════════════════════════
echo   ❌ Dasturlarni o'rnatishda xatolik
echo  ════════════════════════════════════════════════════════
echo.
echo   Ko'pincha internet uzilganda shunday bo'ladi.
echo.
echo   👉 Internetni tekshiring va shu faylni qaytadan oching.
echo.
pause
exit /b 1

:FAIL_DB
cd /d "%~dp0"
echo.
echo  ════════════════════════════════════════════════════════
echo   ❌ Ma'lumotlar bazasiga ulanib bo'lmadi
echo  ════════════════════════════════════════════════════════
echo.
echo   👉 1. console.neon.tech saytiga kiring - baza uxlab
echo         qolgan bo'lsa, kirganingizda o'zi uyg'onadi.
echo      2. Internetni tekshiring.
echo      3. Baza manzili noto'g'ri bo'lsa: backend\.env
echo         faylini o'chirib, shu faylni qaytadan oching.
echo.
pause
exit /b 1

:FAIL_BUILD
cd /d "%~dp0"
echo.
echo   ❌ Ilovalarni yig'ishda xatolik.
echo.
echo   👉 Yuqoridagi qizil matnni nusxalab yuboring.
echo.
pause
exit /b 1

:FAIL
cd /d "%~dp0"
echo.
echo   Jarayon to'xtadi.
echo.
pause
exit /b 1

@echo off
chcp 65001 >nul
title G'iyos Barbershop - Yangilash
cd /d "%~dp0"

cls
echo.
echo  ════════════════════════════════════════════════════════
echo      ⬆  YANGILASH
echo  ════════════════════════════════════════════════════════
echo.
echo   Dasturning yangi versiyasini yuklab oladi.
echo   Bronlaringiz va mijozlaringiz saqlanib qoladi.
echo.
echo   ⚠️  Server ishlab turgan bo'lsa, avval uni to'xtating
echo      ^(server oynasida Ctrl+C^).
echo.
pause

where node >nul 2>nul
if errorlevel 1 set "PATH=%PATH%;%ProgramFiles%\nodejs\;%LOCALAPPDATA%\Programs\nodejs\"

where git >nul 2>nul
if errorlevel 1 (
  echo.
  echo   ❌ Git topilmadi.
  echo.
  echo   👉 Yangi versiyani qo'lda yuklang:
  echo      github.com/usmoon07-blip/Barber_Giyos_booking
  echo      Code → Download ZIP
  echo.
  echo      Eski papkadagi backend\.env faylini
  echo      yangisiga ko'chirishni unutmang!
  echo.
  pause
  exit /b 1
)

echo.
echo   Yangi versiya yuklanmoqda...
echo.
git pull
if errorlevel 1 (
  echo.
  echo   ❌ Yuklab bo'lmadi. Internetni tekshiring.
  echo.
  pause
  exit /b 1
)

echo.
echo   Dasturlar yangilanmoqda...
echo.

cd backend
call npm install --no-audit --no-fund --loglevel=error
call npx prisma migrate deploy
call npx prisma generate --no-hints

cd ..\miniapp
call npm install --no-audit --no-fund --loglevel=error
call npm run build

cd ..\admin
call npm install --no-audit --no-fund --loglevel=error
call npm run build

cd ..

cls
node "windows\doctor.js"

echo.
echo  ════════════════════════════════════════════════════════
echo   ✅ Yangilandi. Endi BOSHLASH.bat ni oching.
echo  ════════════════════════════════════════════════════════
echo.
pause

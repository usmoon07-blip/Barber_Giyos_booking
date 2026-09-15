@echo off
chcp 65001 >nul
title G'iyos Barbershop - O'rnatish
cd /d "%~dp0.."

echo.
echo ═══════════════════════════════════════════════
echo   G'IYOS BARBERSHOP - BIRINCHI O'RNATISH
echo ═══════════════════════════════════════════════
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [XATO] Node.js o'rnatilmagan!
  echo.
  echo  https://nodejs.org saytidan LTS versiyasini yuklab oling,
  echo  o'rnating va shu faylni qaytadan ishga tushiring.
  echo.
  pause
  exit /b 1
)

if not exist "backend\.env" (
  echo [XATO] backend\.env fayli topilmadi!
  echo.
  echo  backend papkasidagi .env.example faylidan nusxa olib,
  echo  nomini .env ga o'zgartiring va o'z ma'lumotlaringizni kiriting.
  echo.
  pause
  exit /b 1
)

echo [1/5] Backend paketlari o'rnatilmoqda...
cd backend
call npm install
if errorlevel 1 goto error

echo.
echo [2/5] Ma'lumotlar bazasi jadvallari yaratilmoqda...
call npx prisma migrate deploy
if errorlevel 1 goto error
call npx prisma generate
if errorlevel 1 goto error

echo.
echo [3/5] Namunaviy ma'lumotlar yozilmoqda...
call npm run seed
if errorlevel 1 goto error

echo.
echo [4/5] Mini App paketlari o'rnatilmoqda...
cd ..\miniapp
call npm install
if errorlevel 1 goto error
call npm run build
if errorlevel 1 goto error

echo.
echo [5/5] Admin Panel paketlari o'rnatilmoqda...
cd ..\admin
call npm install
if errorlevel 1 goto error
call npm run build
if errorlevel 1 goto error

cd ..
echo.
echo ═══════════════════════════════════════════════
echo   ✅ TAYYOR! Hammasi o'rnatildi.
echo.
echo   Endi 2-ISHGA-TUSHIRISH.bat faylini oching.
echo ═══════════════════════════════════════════════
echo.
pause
exit /b 0

:error
echo.
echo ═══════════════════════════════════════════════
echo   ❌ XATOLIK YUZ BERDI
echo   Yuqoridagi qizil matnni o'qing yoki nusxa oling.
echo ═══════════════════════════════════════════════
echo.
pause
exit /b 1

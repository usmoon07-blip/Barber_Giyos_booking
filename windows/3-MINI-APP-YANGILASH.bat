@echo off
chcp 65001 >nul
title G'iyos Barbershop - Mini App yangilash
cd /d "%~dp0..\miniapp"

echo.
echo  Mini App qaytadan yig'ilmoqda...
echo.

call npm run build
if errorlevel 1 (
  echo.
  echo  ❌ Xatolik yuz berdi.
  pause
  exit /b 1
)

cd ..\admin
echo.
echo  Admin Panel qaytadan yig'ilmoqda...
call npm run build

echo.
echo  ✅ Tayyor. Serverni qaytadan ishga tushiring.
echo.
pause

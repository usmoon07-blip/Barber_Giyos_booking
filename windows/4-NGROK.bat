@echo off
chcp 65001 >nul
title G'iyos Barbershop - Ngrok
cd /d "%~dp0.."

echo.
echo ═══════════════════════════════════════════════
echo   NGROK - Telegram uchun HTTPS havola
echo ═══════════════════════════════════════════════
echo.
echo   Avval 2-ISHGA-TUSHIRISH.bat ishlab turgan
echo   bo'lishi kerak!
echo.
echo   Ochilgan oynadagi "Forwarding" qatoridan
echo   https://xxxx.ngrok-free.app havolasini
echo   nusxa oling.
echo ═══════════════════════════════════════════════
echo.

where ngrok >nul 2>nul
if errorlevel 1 (
  echo  [XATO] ngrok topilmadi!
  echo.
  echo  https://ngrok.com/download saytidan yuklab oling
  echo  va ngrok.exe faylini shu papkaga qo'ying.
  echo.
  if exist "ngrok.exe" (
    echo  ngrok.exe shu papkada topildi, ishga tushirilmoqda...
    ngrok.exe http 3000
    pause
    exit /b 0
  )
  pause
  exit /b 1
)

ngrok http 3000
pause

@echo off
chcp 65001 >nul
title G'iyos Barbershop - Ngrok
cd /d "%~dp0.."

REM ─────────────────────────────────────────────────────────────
REM  DOIMIY DOMEN (tavsiya etiladi)
REM
REM  Ngrok bepul rejasida bitta doimiy domen beradi.
REM  Uni olish uchun: https://dashboard.ngrok.com → Domains → New Domain
REM
REM  Domenni olgach, quyidagi qatordan REM so'zini o'chiring va
REM  o'z domeningizni yozing. Shundan keyin havola hech qachon
REM  o'zgarmaydi — har kuni BotFather'ni qayta sozlash shart emas.
REM ─────────────────────────────────────────────────────────────
REM set NGROK_DOMAIN=sizning-domen.ngrok-free.app

echo.
echo ═══════════════════════════════════════════════
echo   NGROK - Telegram uchun HTTPS havola
echo ═══════════════════════════════════════════════
echo.
echo   Avval 2-ISHGA-TUSHIRISH.bat ishlab turgan
echo   bo'lishi kerak!
echo.

set NGROK_CMD=ngrok
where ngrok >nul 2>nul
if errorlevel 1 (
  if exist "ngrok.exe" (
    set NGROK_CMD=ngrok.exe
  ) else (
    echo  [XATO] ngrok topilmadi!
    echo.
    echo  https://ngrok.com/download saytidan yuklab oling
    echo  va ngrok.exe faylini shu papkaga qo'ying.
    echo.
    pause
    exit /b 1
  )
)

if defined NGROK_DOMAIN (
  echo   Doimiy domen: https://%NGROK_DOMAIN%
  echo   Bu havola har doim bir xil - qayta sozlash shart emas.
  echo ═══════════════════════════════════════════════
  echo.
  %NGROK_CMD% http 3000 --domain=%NGROK_DOMAIN%
) else (
  echo   Doimiy domen sozlanmagan - havola har safar
  echo   o'zgaradi. Uni sozlash uchun shu faylni
  echo   Notepad'da oching va yuqoridagi izohni o'qing.
  echo.
  echo   Ochilgan oynadagi "Forwarding" qatoridan
  echo   https://xxxx.ngrok-free.app havolasini oling.
  echo ═══════════════════════════════════════════════
  echo.
  %NGROK_CMD% http 3000
)

pause

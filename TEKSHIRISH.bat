@echo off
chcp 65001 >nul
title G'iyos Barbershop - Tekshiruv

if not exist "%~dp0windows\tekshirish.ps1" goto NOFILES

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0windows\tekshirish.ps1"
if errorlevel 1 pause
exit /b

:NOFILES
echo.
echo   Loyiha fayllari topilmadi.
echo.
echo   ZIP faylni avval CHIQARING:
echo.
echo     1. ZIP fayl ustiga ong tugma bilan bosing
echo     2. "Extract All..." ni tanlang
echo     3. "Extract" tugmasini bosing
echo     4. Ochilgan papkadagi TEKSHIRISH.bat ni ikki marta bosing
echo.
pause

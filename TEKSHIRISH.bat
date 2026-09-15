@echo off
chcp 65001 >nul
title G'iyos Barbershop - Tekshiruv
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  set "PATH=%PATH%;%ProgramFiles%\nodejs\;%LOCALAPPDATA%\Programs\nodejs\"
)

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   ❌ Node.js o'rnatilmagan.
  echo.
  echo   👉 Avval BOSHLASH.bat faylini oching.
  echo.
  pause
  exit /b 1
)

node "windows\doctor.js"

echo.
echo   Yuqorida ❌ belgisi bo'lsa, yonidagi 👉 ni bajaring.
echo   Tushunarsiz bo'lsa - shu oynaning rasmini yuboring.
echo.
pause

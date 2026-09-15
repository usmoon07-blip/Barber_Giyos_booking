@echo off
chcp 65001 >nul
title Bazani ko'rish
cd /d "%~dp0..\backend"

where node >nul 2>nul
if errorlevel 1 set "PATH=%PATH%;%ProgramFiles%\nodejs\;%LOCALAPPDATA%\Programs\nodejs\"

echo.
echo   Baza brauzerda ochilmoqda: http://localhost:5555
echo   To'xtatish uchun: Ctrl + C
echo.
echo   ⚠️  Bu yerda ma'lumotlarni to'g'ridan-to'g'ri
echo      o'zgartirish mumkin - ehtiyot bo'ling.
echo.

call npx prisma studio
pause

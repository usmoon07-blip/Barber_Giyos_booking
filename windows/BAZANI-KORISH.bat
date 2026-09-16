@echo off
chcp 65001 >nul
title Bazani korish
cd /d "%~dp0..\backend"

echo.
echo   Baza brauzerda ochilmoqda: http://localhost:5555
echo   Toxtatish uchun: Ctrl + C
echo.

call npx prisma studio
pause

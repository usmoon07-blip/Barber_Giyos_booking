@echo off
chcp 65001 >nul
title G'iyos Barbershop - Server
cd /d "%~dp0..\backend"

echo.
echo ═══════════════════════════════════════════════
echo   SERVER VA BOT ISHGA TUSHMOQDA
echo ═══════════════════════════════════════════════
echo.
echo   Mini App:     http://localhost:3000
echo   Admin Panel:  http://localhost:3000/admin
echo.
echo   To'xtatish uchun: Ctrl + C
echo ═══════════════════════════════════════════════
echo.

call npm start
pause

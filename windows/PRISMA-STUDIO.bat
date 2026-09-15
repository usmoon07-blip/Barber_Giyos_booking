@echo off
chcp 65001 >nul
title Prisma Studio - Baza ko'rish
cd /d "%~dp0..\backend"

echo.
echo  Prisma Studio ochilmoqda: http://localhost:5555
echo  To'xtatish uchun: Ctrl + C
echo.

call npx prisma studio
pause

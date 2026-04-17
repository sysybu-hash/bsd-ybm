@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo מריץ npm run db:push (חיבור ל-Neon מהמחשב שלך)...
call npm run db:push
if errorlevel 1 (
  echo.
  echo נכשל P1001: הרשת אצלך חוסמת יציאה לפורט 5432 ל-Neon.
  echo פתרון ללא שינוי רשת: דחוף את הקוד ל-GitHub והרץ Workflow "Neon Prisma DB Push"
  echo (הגדר סודות DATABASE_URL ו-DIRECT_URL ב-Repo ^> Settings ^> Secrets).
  pause
  exit /b 1
)
echo.
echo הצלחה.
pause

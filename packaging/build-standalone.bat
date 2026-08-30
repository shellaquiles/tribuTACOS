@echo off
setlocal
set "ROOT=%~dp0.."
cd /d "%ROOT%\frontend"
set BUILD_MODE=standalone
call npm run build
if errorlevel 1 exit /b 1
if exist "%ROOT%\backend\static" rmdir /s /q "%ROOT%\backend\static"
xcopy /e /i /y "%ROOT%\frontend\out" "%ROOT%\backend\static"
echo Standalone listo: backend\static
echo Arranque: python packaging\launcher.py

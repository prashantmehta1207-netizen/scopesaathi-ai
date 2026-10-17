@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Please double-click INSTALL_ONCE.bat first.
  pause
  exit /b 1
)
echo Starting ScopeSaathi AI. Your browser should open automatically.
.venv\Scripts\python.exe app.py
pause

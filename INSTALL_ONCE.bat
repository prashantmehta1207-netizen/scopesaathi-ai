@echo off
setlocal
cd /d "%~dp0"
echo ==============================================
echo      ScopeSaathi AI - First-time setup
echo ==============================================
where py >nul 2>nul
if errorlevel 1 (
  echo Python launcher not found. Install Python 3.11 or newer from python.org and select Add Python to PATH.
  pause
  exit /b 1
)
if not exist ".venv\Scripts\python.exe" (
  py -3 -m venv .venv
  if errorlevel 1 (
    echo Could not create the Python environment.
    pause
    exit /b 1
  )
)
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 (
  echo Package installation failed. Check your internet connection and run this file again.
  pause
  exit /b 1
)
echo.
echo Setup complete. Next, add your GGUF model and llama-server, then double-click START_SCOPE-SAATHI.bat.
pause

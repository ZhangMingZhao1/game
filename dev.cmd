@echo off
setlocal
cd /d "%~dp0"
if not exist "node_modules\.bin\vite.cmd" (
  echo Dependencies are missing. Install them before starting the game.
  exit /b 1
)
call "node_modules\.bin\vite.cmd" --host

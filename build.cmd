@echo off
setlocal
cd /d "%~dp0"
if not exist "node_modules\.bin\tsc.cmd" (
  echo Dependencies are missing. Install them before building the game.
  exit /b 1
)
call "node_modules\.bin\tsc.cmd"
if errorlevel 1 exit /b %errorlevel%
call "node_modules\.bin\vite.cmd" build

@echo off
set PORT=4173
set ROOT=C:\Dev_Projects\money_flows_v0.4
set DIST=%ROOT%\dist

echo [1/4] Checking build...
if not exist "%DIST%" (
  echo Building MoneyFlows...
  call "C:\Program Files\nodejs\npm.cmd" run build
) else (
  echo dist folder found.
)

echo [2/4] Starting server...
start "MoneyFlows-Server" cmd /c "C:\Users\EftynurPc\AppData\Roaming\npm\serve.cmd %DIST% -l %PORT% --no-clipboard"

echo [3/4] Waiting for server...
ping -n 5 127.0.0.1 >nul

echo [4/4] Opening Chrome...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:%PORT%

echo Done.
pause

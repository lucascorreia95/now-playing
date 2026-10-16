@echo off
cd /d "%~dp0"
echo Iniciando servidor YouTube Music Now Playing...
echo.
echo Verificando se o npm esta instalado...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: npm nao encontrado no PATH.
    echo Por favor, instale o Node.js em https://nodejs.org/
    pause
    exit /b 1
)
echo npm encontrado.
echo.
echo Iniciando servidor minimizado...
start /min cmd /c "npm start & pause"
echo Servidor iniciado em uma janela minimizada.
pause
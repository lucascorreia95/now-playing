@echo off
set SCRIPT_DIR=%~dp0
set DESKTOP=%USERPROFILE%\Desktop
set SHORTCUT=%DESKTOP%\YouTube Music Now Playing.lnk

echo Criando atalho na area de trabalho...
echo.

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = '%SCRIPT_DIR%iniciar-servidor-minimizado.bat'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Save()"

if exist "%SHORTCUT%" (
    echo.
    echo SUCESSO: Atalho criado na area de trabalho: YouTube Music Now Playing.lnk
    echo.
    echo Clique duas vezes no atalho para iniciar o servidor minimizado.
) else (
    echo.
    echo ERRO: Nao foi possivel criar o atalho.
    echo Tente criar manualmente:
    echo 1. Clique com botao direito em iniciar-servidor-minimizado.bat
    echo 2. Enviar para - Area de trabalho (criar atalho)
)

echo.
pause

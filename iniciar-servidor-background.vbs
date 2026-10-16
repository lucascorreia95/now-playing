Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
WshShell.CurrentDirectory = FSO.GetParentFolderName(WScript.ScriptFullName)

' Executar em background com redirecionamento de saída para log
WshShell.Run "cmd /c npm start > servidor.log 2>&1", 0, False

$ErrorActionPreference = "SilentlyContinue"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$node = Join-Path $root "runtime\node.exe"
$server = Join-Path $root "manager\server.mjs"

Get-CimInstance Win32_Process |
  Where-Object { $_.ExecutablePath -eq $node -and $_.CommandLine -like "*$server*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

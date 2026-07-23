$ErrorActionPreference = "SilentlyContinue"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$node = Join-Path $root "runtime\node.exe"
$server = Join-Path $root "manager\server.mjs"
$serverArgument = '"' + $server + '"'
$managerUrl = "http://localhost:17363"

try {
  Invoke-WebRequest -UseBasicParsing -Uri "$managerUrl/api/status" -TimeoutSec 1 | Out-Null
} catch {
  Start-Process -WindowStyle Hidden -WorkingDirectory (Join-Path $root "manager") -FilePath $node -ArgumentList @($serverArgument)
}

for ($index = 0; $index -lt 80; $index++) {
  try {
    Invoke-WebRequest -UseBasicParsing -Uri "$managerUrl/api/status" -TimeoutSec 1 | Out-Null
    break
  } catch {
    Start-Sleep -Milliseconds 100
  }
}

Start-Process $managerUrl

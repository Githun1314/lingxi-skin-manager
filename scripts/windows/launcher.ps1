$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$node = Join-Path $root "runtime\node.exe"
$server = Join-Path $root "manager\server.mjs"
$serverArgument = '"' + $server + '"'
$managerUrl = "http://localhost:17363"

if (-not (Test-Path $node)) {
  $nodeVersion = "v24.15.0"
  $archiveName = "node-$nodeVersion-win-x64.zip"
  $downloadUrl = "https://nodejs.org/dist/$nodeVersion/$archiveName"
  $expectedSha256 = "cc5149eabd53779ce1e7bdc5401643622d0c7e6800ade18928a767e940bb0e62"
  $archivePath = Join-Path $env:TEMP $archiveName
  $extractPath = Join-Path $env:TEMP "lingxi-skin-manager-node-$nodeVersion"
  Write-Host "First launch: downloading the official Node.js Windows runtime..."
  try {
    Invoke-WebRequest -UseBasicParsing -Uri $downloadUrl -OutFile $archivePath
    $actualSha256 = (Get-FileHash -Algorithm SHA256 $archivePath).Hash.ToLowerInvariant()
    if ($actualSha256 -ne $expectedSha256) { throw "Node.js runtime checksum mismatch" }
    if (Test-Path $extractPath) { Remove-Item -Recurse -Force $extractPath }
    Expand-Archive -Path $archivePath -DestinationPath $extractPath -Force
    New-Item -ItemType Directory -Path (Split-Path -Parent $node) -Force | Out-Null
    $nodeRoot = Join-Path $extractPath "node-$nodeVersion-win-x64"
    Copy-Item (Join-Path $nodeRoot "node.exe") $node -Force
    Copy-Item (Join-Path $nodeRoot "LICENSE") (Join-Path (Split-Path -Parent $node) "NODE-LICENSE.txt") -Force
    Remove-Item -Force $archivePath
    Remove-Item -Recurse -Force $extractPath
  } catch {
    Write-Host "Runtime setup failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check the network and run this file again."
    Read-Host "Press Enter to close"
    exit 1
  }
}

$ErrorActionPreference = "SilentlyContinue"

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

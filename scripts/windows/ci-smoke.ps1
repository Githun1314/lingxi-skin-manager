$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$parseTargets = @(
  (Join-Path $PSScriptRoot "launcher.ps1"),
  (Join-Path $PSScriptRoot "stop-manager.ps1")
)

foreach ($target in $parseTargets) {
  $tokens = $null
  $errors = $null
  [System.Management.Automation.Language.Parser]::ParseFile($target, [ref]$tokens, [ref]$errors) | Out-Null
  if ($errors.Count -gt 0) {
    throw "PowerShell syntax error in $target`n$($errors | Out-String)"
  }
}

$fakeLingxi = Join-Path $env:RUNNER_TEMP "fake-lingxi\WPS 灵犀.exe"
New-Item -ItemType Directory -Path (Split-Path -Parent $fakeLingxi) -Force | Out-Null
Copy-Item (Get-Command node.exe).Source $fakeLingxi -Force
$env:LINGXI_APP_PATH = $fakeLingxi
$env:APPDATA = Join-Path $env:RUNNER_TEMP "AppData\Roaming"

$server = Join-Path $repoRoot "server.mjs"
$serverProcess = Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList @("`"$server`"") -WorkingDirectory $repoRoot -PassThru -WindowStyle Hidden
try {
  $status = $null
  for ($index = 0; $index -lt 80; $index++) {
    try {
      $status = Invoke-RestMethod -Uri "http://127.0.0.1:17363/api/status" -TimeoutSec 1
      break
    } catch {
      Start-Sleep -Milliseconds 100
    }
  }

  if ($null -eq $status) { throw "The manager did not start on Windows." }
  if ($status.platform -ne "win32") { throw "Expected win32, got $($status.platform)." }
  if ($status.connected) { throw "A clean cloud runner must not report a Lingxi debugging connection." }
  if ($status.enabled) { throw "A clean cloud runner must start with its theme disabled." }
  Write-Host "Manager status endpoint passed on Windows."
} finally {
  if ($serverProcess -and -not $serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id -Force
  }
}

Write-Host "Windows smoke tests passed."

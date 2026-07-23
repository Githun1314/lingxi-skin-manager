$ErrorActionPreference = "Stop"

$installerUrl = "https://qn.cache.wpscdn.cn/lingxi-ai/win/1.2.23/lingxi-desktop-1.2.23-setup.exe"
$installer = Join-Path $env:RUNNER_TEMP "lingxi-desktop-1.2.23-setup.exe"

Write-Host "Downloading the official Lingxi Windows 1.2.23 installer..."
Invoke-WebRequest -UseBasicParsing -Uri $installerUrl -OutFile $installer

$file = Get-Item $installer
if ($file.Length -lt 450MB) { throw "Installer download is unexpectedly small: $($file.Length) bytes" }

$signature = Get-AuthenticodeSignature $installer
Write-Host "Signature status: $($signature.Status)"
Write-Host "Signer: $($signature.SignerCertificate.Subject)"
if ($signature.Status -ne "Valid") { throw "Official installer signature is not valid." }
if ($signature.SignerCertificate.Subject -notmatch "Kingsoft|金山") {
  throw "Installer signer does not look like Kingsoft: $($signature.SignerCertificate.Subject)"
}

$sha256 = (Get-FileHash -Algorithm SHA256 $installer).Hash.ToLowerInvariant()
Write-Host "Installer SHA256: $sha256"

Write-Host "Trying the installer's standard silent-install switch..."
$install = Start-Process -FilePath $installer -ArgumentList @("/S") -Wait -PassThru
if ($install.ExitCode -ne 0) { throw "Installer exited with code $($install.ExitCode)." }

$searchRoots = @(
  $env:LOCALAPPDATA,
  $env:ProgramFiles,
  ${env:ProgramFiles(x86)}
) | Where-Object { $_ -and (Test-Path $_) }

$names = @("wpslingxi.exe", "WPS Lingxi.exe", "lingxi.exe", "lingxi-desktop.exe")
$matches = foreach ($root in $searchRoots) {
  Get-ChildItem -Path $root -File -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $names -contains $_.Name }
}

$matches = @($matches | Sort-Object LastWriteTime -Descending)
if ($matches.Count -eq 0) { throw "Silent installation completed, but no Lingxi executable was found." }

$matches | Select-Object FullName, Length, LastWriteTime | Format-Table -AutoSize
$detected = $matches[0].FullName
$env:LINGXI_APP_PATH = $detected

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
node (Join-Path $repoRoot "scripts\test-windows-platform.mjs") --verify-current

Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
  Where-Object { $_.ExecutablePath -eq $detected } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

Write-Host "Launching the official client with the same local debugging arguments used by the manager..."
$client = Start-Process -FilePath $detected -ArgumentList @(
  "--remote-debugging-port=9229",
  "--remote-debugging-address=127.0.0.1"
) -PassThru

try {
  $debugVersion = $null
  for ($index = 0; $index -lt 120; $index++) {
    if ($client.HasExited) { throw "The official client exited during its launch probe with code $($client.ExitCode)." }
    try {
      $debugVersion = Invoke-RestMethod -Uri "http://127.0.0.1:9229/json/version" -TimeoutSec 1
      break
    } catch {
      Start-Sleep -Milliseconds 250
    }
  }
  if ($null -eq $debugVersion) { throw "The official client started, but its local debugging endpoint did not become ready." }
  Write-Host "Debug endpoint browser: $($debugVersion.Browser)"
} finally {
  Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { $_.ExecutablePath -eq $detected } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}

Write-Host "Official Lingxi install and launch probe passed. Detected: $detected"

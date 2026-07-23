$ErrorActionPreference = "Stop"

$installerUrl = "https://qn.cache.wpscdn.cn/lingxi-ai/win/1.2.23/lingxi-desktop-1.2.23-setup.exe"
$installer = Join-Path $env:RUNNER_TEMP "lingxi-desktop-1.2.23-setup.exe"

Write-Host "Downloading the official Lingxi Windows 1.2.23 installer..."
& curl.exe --fail --location --retry 3 --silent --show-error --output $installer $installerUrl
if ($LASTEXITCODE -ne 0) { throw "Official installer download failed with curl exit code $LASTEXITCODE." }

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
$installRoot = Join-Path $env:RUNNER_TEMP "LingxiInstall"
New-Item -ItemType Directory -Path $installRoot -Force | Out-Null
$installStartedAt = Get-Date
$install = $null
for ($attempt = 1; $attempt -le 2; $attempt++) {
  Write-Host "Silent-install attempt $attempt of 2..."
  $install = Start-Process -FilePath $installer -ArgumentList @("/S", "/D=$installRoot") -PassThru
  if ($install.WaitForExit(480000)) { break }
  Stop-Process -Id $install.Id -Force -ErrorAction SilentlyContinue
  if ($attempt -eq 2) { throw "The official installer did not finish after two attempts." }
  Write-Host "The first installer process stalled; retrying once in the same clean install directory."
  Start-Sleep -Seconds 3
}
if ($install.ExitCode -ne 0) { throw "Installer exited with code $($install.ExitCode)." }
Start-Sleep -Seconds 8

$searchRoots = @(
  $installRoot,
  $env:LOCALAPPDATA,
  $env:APPDATA,
  $env:ProgramFiles,
  ${env:ProgramFiles(x86)},
  $env:ProgramData
) | Where-Object { $_ -and (Test-Path $_) }

$names = @("WPS Lingxi.exe", "WPS 灵犀.exe", "WPS灵犀.exe", "lingxi.exe", "lingxi-desktop.exe")
$candidates = foreach ($root in $searchRoots) {
  Get-ChildItem -Path $root -File -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.Extension -eq ".exe" }
}

$matches = @($candidates | Where-Object {
  $_.Name -ne "wpslingxi.exe" -and
  $_.FullName -notmatch "[\\/]WPS Office[\\/]" -and
  $_.FullName -notmatch "[\\/]office6[\\/]" -and
  $_.Name -notmatch "uninstall|installer|updater" -and (
    $_.FullName.StartsWith($installRoot) -or
    $names -contains $_.Name -or
    $_.Name -match "Lingxi|灵犀" -or
    $_.VersionInfo.ProductName -match "Lingxi|灵犀" -or
    $_.VersionInfo.FileDescription -match "Lingxi|灵犀" -or
    ($_.LastWriteTime -ge $installStartedAt -and $_.VersionInfo.CompanyName -match "Kingsoft|金山")
  )
} | Sort-Object @{ Expression = { $_.FullName.StartsWith($installRoot) }; Descending = $true }, Length -Descending)

if ($matches.Count -eq 0) {
  Write-Host "Executables in the requested installation directory:"
  $candidates |
    Where-Object { $_.FullName.StartsWith($installRoot) } |
    Select-Object FullName, Length, LastWriteTime,
      @{ Name = "Product"; Expression = { $_.VersionInfo.ProductName } },
      @{ Name = "Company"; Expression = { $_.VersionInfo.CompanyName } } |
    Format-Table -AutoSize
  Write-Host "Recently created executables in all search roots:"
  $candidates |
    Where-Object { $_.LastWriteTime -ge $installStartedAt } |
    Select-Object -First 80 FullName, Length, LastWriteTime,
      @{ Name = "Product"; Expression = { $_.VersionInfo.ProductName } },
      @{ Name = "Company"; Expression = { $_.VersionInfo.CompanyName } } |
    Format-Table -AutoSize
  throw "Silent installation completed, but no Lingxi executable was found."
}

$matches | Select-Object FullName, Length, LastWriteTime,
  @{ Name = "Product"; Expression = { $_.VersionInfo.ProductName } },
  @{ Name = "Company"; Expression = { $_.VersionInfo.CompanyName } } |
  Format-Table -AutoSize
$detected = $matches[0].FullName
$env:LINGXI_APP_PATH = $detected

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
node (Join-Path $repoRoot "scripts\test-windows-platform.mjs") --verify-current

Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
  Where-Object { $_.ExecutablePath -eq $detected } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

Write-Host "Launching the official client with the same local debugging arguments used by the manager..."
$keepAliveForLogin = $env:WAIT_FOR_LOGIN -eq "true"
$manager = $null
$runnerTrackingId = $env:RUNNER_TRACKING_ID
if ($keepAliveForLogin) { $env:RUNNER_TRACKING_ID = "" }
$client = Start-Process -FilePath $detected -ArgumentList @(
  "--remote-debugging-port=9229",
  "--remote-debugging-address=127.0.0.1"
) -PassThru

try {
  $debugVersion = $null
  for ($index = 0; $index -lt 120; $index++) {
    try {
      $debugVersion = Invoke-RestMethod -Uri "http://127.0.0.1:9229/json/version" -TimeoutSec 1
      break
    } catch {
      Start-Sleep -Milliseconds 250
    }
  }
  if ($null -eq $debugVersion) { throw "The official client started, but its local debugging endpoint did not become ready." }
  Write-Host "Debug endpoint browser: $($debugVersion.Browser)"

  $server = Join-Path $repoRoot "server.mjs"
  $manager = Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList @("`"$server`"") -WorkingDirectory $repoRoot -PassThru -WindowStyle Hidden
  try {
    for ($index = 0; $index -lt 80; $index++) {
      try {
        Invoke-RestMethod -Uri "http://127.0.0.1:17363/api/status" -TimeoutSec 1 | Out-Null
        break
      } catch {
        Start-Sleep -Milliseconds 100
      }
    }

    $theme = @{
      name = "Windows 云端验证"
      styleId = "claude"
      primary = "#c15f3c"
      background = "#f4f0e8"
      sidebar = "#ebe4d8"
      card = "#fffdf9"
      text = "#2f2a25"
      darkPrimary = "#e28c70"
      darkBackground = "#1d1c19"
      darkSidebar = "#171614"
      darkCard = "#292824"
      darkText = "#f2eee7"
      radius = 18
      brandName = "灵犀"
      enabled = $true
    } | ConvertTo-Json
    $applyResult = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:17363/api/theme" -ContentType "application/json" -Body $theme
    Write-Host "Theme applied to a matching page: $($applyResult.applied)"
    Start-Sleep -Seconds 4

    $clientRaw = Join-Path $env:RUNNER_TEMP "lingxi-windows-login-client.raw"
    node (Join-Path $repoRoot "scripts\capture-cdp-screenshot.mjs") $clientRaw --wait-for-content --open-login
    if ($LASTEXITCODE -ne 0) { throw "Capturing the rendered Lingxi login page failed." }

    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    $bounds = [System.Windows.Forms.SystemInformation]::VirtualScreen
    $bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
      $desktopRaw = Join-Path $env:RUNNER_TEMP "lingxi-windows-login-desktop.raw"
      $bitmap.Save($desktopRaw, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $graphics.Dispose()
      $bitmap.Dispose()
    }
    if ($env:WINDOWS_SCREENSHOT_KEY) {
      & (Join-Path $PSScriptRoot "protect-screenshot.ps1") -InputPath $clientRaw -OutputPath (Join-Path $env:RUNNER_TEMP "lingxi-windows-login-client.png.enc")
      & (Join-Path $PSScriptRoot "protect-screenshot.ps1") -InputPath $desktopRaw -OutputPath (Join-Path $env:RUNNER_TEMP "lingxi-windows-login-desktop.png.enc")
    } else { throw "WINDOWS_SCREENSHOT_KEY is required for QR-login captures." }
  } finally {
    if (-not $keepAliveForLogin -and $manager -and -not $manager.HasExited) { Stop-Process -Id $manager.Id -Force }
  }
} finally {
  $env:RUNNER_TRACKING_ID = $runnerTrackingId
  if (-not $keepAliveForLogin) {
    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
      Where-Object { $_.ExecutablePath -eq $detected } |
      ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  }
}

Write-Host "Official Lingxi install and launch probe passed. Detected: $detected"

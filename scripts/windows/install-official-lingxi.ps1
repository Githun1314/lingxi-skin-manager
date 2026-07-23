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
$install = Start-Process -FilePath $installer -ArgumentList @("/S", "/D=$installRoot") -PassThru
if (-not $install.WaitForExit(600000)) {
  Stop-Process -Id $install.Id -Force -ErrorAction SilentlyContinue
  throw "The official installer did not finish within 10 minutes."
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

$names = @("wpslingxi.exe", "WPS Lingxi.exe", "lingxi.exe", "lingxi-desktop.exe")
$candidates = foreach ($root in $searchRoots) {
  Get-ChildItem -Path $root -File -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.Extension -eq ".exe" }
}

$matches = @($candidates | Where-Object {
  $names -contains $_.Name -or
  $_.VersionInfo.ProductName -match "Lingxi|灵犀" -or
  $_.VersionInfo.FileDescription -match "Lingxi|灵犀" -or
  ($_.LastWriteTime -ge $installStartedAt -and $_.VersionInfo.CompanyName -match "Kingsoft|金山")
} | Sort-Object @{ Expression = { $_.FullName.StartsWith($installRoot) }; Descending = $true }, Length -Descending)

if ($matches.Count -eq 0) {
  Write-Host "Recently created executables for installation diagnostics:"
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

    node (Join-Path $repoRoot "scripts\capture-cdp-screenshot.mjs") (Join-Path $env:RUNNER_TEMP "lingxi-windows-client.png")

    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    $bounds = [System.Windows.Forms.SystemInformation]::VirtualScreen
    $bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
      $bitmap.Save((Join-Path $env:RUNNER_TEMP "lingxi-windows-desktop.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $graphics.Dispose()
      $bitmap.Dispose()
    }
  } finally {
    if ($manager -and -not $manager.HasExited) { Stop-Process -Id $manager.Id -Force }
  }
} finally {
  Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { $_.ExecutablePath -eq $detected } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}

Write-Host "Official Lingxi install and launch probe passed. Detected: $detected"

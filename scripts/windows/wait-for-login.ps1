$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
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

Write-Host "Waiting up to 10 minutes for the QR login..."
$applied = $false
for ($index = 0; $index -lt 120; $index++) {
  try {
    $pageJson = node (Join-Path $repoRoot "scripts\inspect-cdp-page.mjs")
    $page = $pageJson | ConvertFrom-Json
    $looksLoggedIn = $page.text -match "新会话|技能|定时任务|历史会话|今天可以帮你"
    $looksLikeLogin = $page.text -match "扫码登录|登录 WPS|账号登录|手机号登录|微信登录"
    if ($looksLoggedIn -and -not $looksLikeLogin) {
      $result = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:17363/api/theme" -ContentType "application/json" -Body $theme
      if ($result.applied) {
        $applied = $true
        break
      }
    }
  } catch {}
  Start-Sleep -Seconds 5
}

if (-not $applied) { throw "No logged-in Lingxi conversation page appeared before the QR-login timeout." }
Start-Sleep -Seconds 5

$clientRaw = Join-Path $env:RUNNER_TEMP "lingxi-windows-themed-client.raw"
node (Join-Path $repoRoot "scripts\capture-cdp-screenshot.mjs") $clientRaw --wait-for-content
if ($LASTEXITCODE -ne 0) { throw "Capturing the rendered themed Lingxi page failed." }

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$desktopRaw = Join-Path $env:RUNNER_TEMP "lingxi-windows-themed-desktop.raw"
$bounds = [System.Windows.Forms.SystemInformation]::VirtualScreen
$bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
try {
  $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
  $bitmap.Save($desktopRaw, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  $graphics.Dispose()
  $bitmap.Dispose()
}

if ($env:WINDOWS_SCREENSHOT_KEY) {
  & (Join-Path $PSScriptRoot "protect-screenshot.ps1") -InputPath $clientRaw -OutputPath (Join-Path $env:RUNNER_TEMP "lingxi-windows-themed-client.png.enc")
  & (Join-Path $PSScriptRoot "protect-screenshot.ps1") -InputPath $desktopRaw -OutputPath (Join-Path $env:RUNNER_TEMP "lingxi-windows-themed-desktop.png.enc")
} else { throw "WINDOWS_SCREENSHOT_KEY is required for themed captures." }

Write-Host "Logged-in themed screenshots captured."

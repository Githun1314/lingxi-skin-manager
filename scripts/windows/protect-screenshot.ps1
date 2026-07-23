param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputPath
)

$ErrorActionPreference = "Stop"
if (-not $env:WINDOWS_SCREENSHOT_KEY) { throw "WINDOWS_SCREENSHOT_KEY is not configured." }
if ($env:WINDOWS_SCREENSHOT_KEY -notmatch "^[0-9a-fA-F]{128}$") { throw "Screenshot key must be 64 bytes in hexadecimal." }

$keyBytes = New-Object byte[] 64
for ($index = 0; $index -lt 64; $index++) {
  $keyBytes[$index] = [Convert]::ToByte($env:WINDOWS_SCREENSHOT_KEY.Substring($index * 2, 2), 16)
}
$aesKey = $keyBytes[0..31]
$hmacKey = $keyBytes[32..63]
$plain = [System.IO.File]::ReadAllBytes($InputPath)

$aes = [System.Security.Cryptography.Aes]::Create()
$aes.Key = $aesKey
$aes.Mode = [System.Security.Cryptography.CipherMode]::CBC
$aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7
$aes.GenerateIV()
try {
  $encryptor = $aes.CreateEncryptor()
  $cipher = $encryptor.TransformFinalBlock($plain, 0, $plain.Length)
  $payload = New-Object byte[] ($aes.IV.Length + $cipher.Length)
  [Array]::Copy($aes.IV, 0, $payload, 0, $aes.IV.Length)
  [Array]::Copy($cipher, 0, $payload, $aes.IV.Length, $cipher.Length)

  $hmac = New-Object System.Security.Cryptography.HMACSHA256 (,$hmacKey)
  try { $tag = $hmac.ComputeHash($payload) } finally { $hmac.Dispose() }
  $sealed = New-Object byte[] ($tag.Length + $payload.Length)
  [Array]::Copy($tag, 0, $sealed, 0, $tag.Length)
  [Array]::Copy($payload, 0, $sealed, $tag.Length, $payload.Length)
  [System.IO.File]::WriteAllBytes($OutputPath, $sealed)
} finally {
  $aes.Dispose()
  Remove-Item -Force $InputPath -ErrorAction SilentlyContinue
}

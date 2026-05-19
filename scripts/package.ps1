$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dist = Join-Path $root "dist"
$staging = Join-Path $dist "extension"
$zipPath = Join-Path $dist "pasteframe.zip"

if (Test-Path $dist) {
  Remove-Item -LiteralPath $dist -Recurse -Force
}

New-Item -ItemType Directory -Path $staging | Out-Null

foreach ($path in @("manifest.json", "README.md", "src", "icons")) {
  Copy-Item -LiteralPath (Join-Path $root $path) -Destination (Join-Path $staging $path) -Recurse
}

if (Test-Path $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($staging, $zipPath)

if (-not (Test-Path $zipPath)) {
  throw "Package ZIP was not created at $zipPath"
}

Write-Host "Wrote $zipPath"

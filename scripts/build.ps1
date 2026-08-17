# Build script for Investment Tracker Server
# Run this on the development machine to produce a deployable package

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "=== Building frontend ===" -ForegroundColor Cyan
Push-Location "$root\web-frontend"
npm ci
npm run build
Pop-Location

Write-Host "=== Building backend (release) ===" -ForegroundColor Cyan
Push-Location $root
cargo build --release
Pop-Location

Write-Host "=== Copying frontend dist to root ===" -ForegroundColor Cyan
if (Test-Path "$root\dist") { Remove-Item -Recurse -Force "$root\dist" }
Copy-Item -Recurse -Force "$root\web-frontend\dist" "$root\dist"

Write-Host "=== Package ready ===" -ForegroundColor Green
Write-Host "Deploy these files to your PVE server:"
Write-Host "  - target\release\investment-tracker-server.exe"
Write-Host "  - dist\ (frontend files)"
Write-Host "  - data\ (data directory, will be created if missing)"

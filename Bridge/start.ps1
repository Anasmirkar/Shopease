#!/usr/bin/env pwsh

Write-Host "🏪 ShopEase Bridge - Starting Application"
Write-Host "========================================="

$bridgeDir = "d:\ShopEase\Bridge"
Set-Location $bridgeDir

Write-Host "📁 Current directory: $(Get-Location)"
Write-Host "📦 Checking node_modules..."

if (-not (Test-Path "node_modules")) {
    Write-Host "⏳ Installing dependencies..."
    npm install
}

Write-Host "✅ Dependencies ready"
Write-Host "🚀 Starting Bridge app..."
Write-Host ""

npm start

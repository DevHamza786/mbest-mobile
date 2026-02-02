# Clear React Native Cache Script
Write-Host "Clearing React Native caches..." -ForegroundColor Yellow

# Clear Metro bundler cache
Write-Host "1. Clearing Metro bundler cache..." -ForegroundColor Cyan
if (Test-Path "$env:TEMP/metro-*") {
    Remove-Item "$env:TEMP/metro-*" -Recurse -Force
}

# Clear watchman cache
Write-Host "2. Clearing Watchman cache..." -ForegroundColor Cyan
if (Get-Command watchman -ErrorAction SilentlyContinue) {
    watchman watch-del-all
}

# Clear node_modules cache
Write-Host "3. Clearing node_modules cache..." -ForegroundColor Cyan
if (Test-Path "node_modules/.cache") {
    Remove-Item "node_modules/.cache" -Recurse -Force
}

# Clear Android build cache
Write-Host "4. Clearing Android build cache..." -ForegroundColor Cyan
if (Test-Path "android/build") {
    Remove-Item "android/build" -Recurse -Force
}
if (Test-Path "android/app/build") {
    Remove-Item "android/app/build" -Recurse -Force
}

Write-Host "`nCache cleared! Now run:" -ForegroundColor Green
Write-Host "  npx react-native start --reset-cache" -ForegroundColor White


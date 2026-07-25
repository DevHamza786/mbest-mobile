# Run MBest mobile app on Android (physical device or emulator)
$ErrorActionPreference = "Stop"

$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:GRADLE_USER_HOME = "D:\gradle"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:JAVA_HOME\bin;$env:PATH"

Set-Location $PSScriptRoot

$devices = & "$env:ANDROID_HOME\platform-tools\adb.exe" devices | Select-String "device$"
if (-not $devices) {
    Write-Host "No Android device/emulator found. Connect a phone with USB debugging or start emulator:" -ForegroundColor Yellow
    Write-Host "  emulator -avd mbest_emulator"
    exit 1
}

npm run android

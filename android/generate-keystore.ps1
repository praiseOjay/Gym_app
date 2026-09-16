# Overload AI - Release Keystore Generator Script
# This script generates a secure 2048-bit RSA upload keystore for Google Play Store publishing.

param (
    [string]$KeystoreName = "overload-release-key.jks",
    [string]$Alias = "overload",
    [int]$ValidityDays = 10000
)

$targetPath = Join-Path $PSScriptRoot $KeystoreName

if (Test-Path $targetPath) {
    Write-Warning "Keystore already exists at: $targetPath"
    Write-Warning "DO NOT overwrite an existing keystore if your app is already published to Google Play!"
    $confirm = Read-Host "Do you want to overwrite it? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Aborted."
        exit 0
    }
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Generating Overload AI Release Keystore " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Locate keytool
$keytool = Get-Command keytool -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if (-not $keytool) {
    # Check common Android Studio / JDK paths
    $commonPaths = @(
        "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe",
        "C:\Program Files\Java\jdk*\bin\keytool.exe",
        "C:\Program Files (x86)\Java\jdk*\bin\keytool.exe"
    )
    foreach ($p in $commonPaths) {
        $found = Resolve-Path $p -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $keytool = $found.Path
            break
        }
    }
}

if (-not $keytool) {
    Write-Error "Could not locate 'keytool.exe'. Please ensure Java JDK 17+ or Android Studio is installed and added to PATH."
    Write-Host "`nYou can manually run this command once JDK is installed:" -ForegroundColor Yellow
    Write-Host "keytool -genkey -v -keystore $targetPath -keyalg RSA -keysize 2048 -validity $ValidityDays -alias $Alias`n" -ForegroundColor Green
    exit 1
}

Write-Host "Using keytool at: $keytool" -ForegroundColor Green
& $keytool -genkey -v -keystore $targetPath -keyalg RSA -keysize 2048 -validity $ValidityDays -alias $Alias

if (Test-Path $targetPath) {
    Write-Host "`n[SUCCESS] Release keystore created at: $targetPath" -ForegroundColor Green
    Write-Host "IMPORTANT: Store a backup of this file in a secure password manager or cloud drive!" -ForegroundColor Yellow
} else {
    Write-Error "Failed to generate keystore."
}

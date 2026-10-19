# Local Linux Build Script for BC-Desktop
# Packages the Linux Standalone and Standalone-Hidden builds directly to publish/

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = Resolve-Path (Join-Path $scriptDir "../..")
$publishDir = Join-Path $projectRoot "publish"

if (-not (Test-Path $publishDir)) {
    New-Item -ItemType Directory -Path $publishDir -Force | Out-Null
}

Write-Host "Checking Node.js & npm environment..."

# Check if WSL is available for 100% native AppImage generation
$hasWsl = $false
try {
    $wslCheck = wsl uname -s 2>$null
    if ($wslCheck -match "Linux") {
        $hasWsl = $true
    }
} catch {}

if ($hasWsl) {
    Write-Host "WSL Linux environment detected! Building natively via WSL Ubuntu for 100% compatibility..."
    # Convert windows path to wsl path
    $wslPath = wsl wslpath -a ($scriptDir.Replace("\", "/"))
    wsl bash -c "cd '$wslPath' && (npm list electron || npm install) && node build.js"
} else {
    Write-Host "Running build via host Node.js / npm..."
    Push-Location $scriptDir
    try {
        if (-not (Test-Path "node_modules")) {
            Write-Host "Installing dependencies..."
            npm install
        }
        Write-Host "Packaging Linux binaries..."
        node build.js
    } finally {
        Pop-Location
    }
}

Write-Host "`nLinux build finished. Available packages in publish/:"
Get-ChildItem -Path "$publishDir/BC-Desktop-Linux-*" | Select-Object Name, @{Name="Size (MB)"; Expression={[math]::Round($_.Length / 1MB, 2)}} | Format-Table -AutoSize

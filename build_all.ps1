Write-Host "Running automated tests before build..."
dotnet test --verbosity minimal
if ($LASTEXITCODE -ne 0) {
    Write-Error "Automated tests failed! Build process aborted."
    exit 1
}

Write-Host "Cleaning previous publish folders..."
Remove-Item "publish/standalone" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "publish/standalone-hidden" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "publish/BC-Desktop-*.exe" -Force -ErrorAction SilentlyContinue
Remove-Item "publish/*.zip" -Force -ErrorAction SilentlyContinue

Write-Host "Building Windows Standalone..."
dotnet publish BC-Desktop.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:DebugType=none -p:DebugSymbols=false -o publish/standalone

# Crash recovery check if a previous build was terminated prematurely
if (Test-Path "BC-Desktop.csproj.bak") {
    Copy-Item "BC-Desktop.csproj.bak" "BC-Desktop.csproj" -Force
    Remove-Item "BC-Desktop.csproj.bak" -Force
}
if (Test-Path "MainWindow.xaml.bak") {
    Copy-Item "MainWindow.xaml.bak" "MainWindow.xaml" -Force
    Remove-Item "MainWindow.xaml.bak" -Force
}

$origCsproj = Get-Content "BC-Desktop.csproj" -Raw -Encoding UTF8
$origXaml = Get-Content "MainWindow.xaml" -Raw -Encoding UTF8

try {
    # Create persistent backup files on disk to survive hard process termination
    Copy-Item "BC-Desktop.csproj" "BC-Desktop.csproj.bak" -Force
    Copy-Item "MainWindow.xaml" "MainWindow.xaml.bak" -Force

    Write-Host "Applying Hidden Changes..."
    $hiddenName = [string][char]0x3164
    $csproj = $origCsproj -replace "<ApplicationIcon>Assets\\app.ico</ApplicationIcon>", "<ApplicationIcon>Assets\transparent.ico</ApplicationIcon>"
    $csproj = $csproj -replace "<AssemblyName>Bondage Club</AssemblyName>", "<AssemblyName>$hiddenName</AssemblyName>"
    $csproj = $csproj -replace "<Product>BC Desktop</Product>", "<Product>$hiddenName</Product>"
    $csproj = $csproj -replace "<AssemblyTitle>BC Desktop</AssemblyTitle>", "<AssemblyTitle>$hiddenName</AssemblyTitle>"
    Set-Content "BC-Desktop.csproj" $csproj -Encoding UTF8

    $xaml = $origXaml -replace 'Icon="Assets/app.ico"', 'Icon="Assets/transparent.ico"'
    $xaml = $xaml -replace 'Source="Assets/app_logo.png"', 'Source="Assets/transparent.png"'
    $xaml = $xaml -replace 'Text="Bondage Club"', 'Text=""'
    Set-Content "MainWindow.xaml" $xaml -Encoding UTF8

    Write-Host "Cleaning obj folder to force icon rebuild..."
    Remove-Item -Path "obj" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "bin" -Recurse -Force -ErrorAction SilentlyContinue

    Write-Host "Building Windows Standalone-Hidden..."
    dotnet publish BC-Desktop.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:DebugType=none -p:DebugSymbols=false -o publish/standalone-hidden
}
finally {
    Write-Host "Reverting Hidden Changes to original state..."
    if (Test-Path "BC-Desktop.csproj.bak") {
        Move-Item "BC-Desktop.csproj.bak" "BC-Desktop.csproj" -Force
    } else {
        Set-Content "BC-Desktop.csproj" $origCsproj -Encoding UTF8
    }
    if (Test-Path "MainWindow.xaml.bak") {
        Move-Item "MainWindow.xaml.bak" "MainWindow.xaml" -Force
    } else {
        Set-Content "MainWindow.xaml" $origXaml -Encoding UTF8
    }

    Write-Host "Cleaning obj folder again..."
    Remove-Item -Path "obj" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "bin" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Organizing executables for direct single-file distribution..."
Move-Item "publish/standalone/Bondage Club.exe" "publish/BC-Desktop-Windows-Standalone.exe" -Force

$hiddenStandaloneExe = Get-ChildItem "publish/standalone-hidden/*.exe" | Select-Object -First 1
if ($hiddenStandaloneExe) {
    Move-Item $hiddenStandaloneExe.FullName "publish/BC-Desktop-Windows-Standalone-Hidden.exe" -Force
}

Write-Host "Cleaning temporary build directories..."
Remove-Item "publish/standalone" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "publish/standalone-hidden" -Recurse -Force -ErrorAction SilentlyContinue

# Also build Linux if Linux build script exists
$linuxBuildScript = "platform/linux/build-linux.ps1"
if (Test-Path $linuxBuildScript) {
    Write-Host "`nFound Linux build script. Running $linuxBuildScript..."
    powershell -ExecutionPolicy Bypass -File $linuxBuildScript
}

Write-Host "`nBuild complete! Ready in publish/:"
Get-ChildItem "publish/BC-Desktop-*" | Select-Object Name, @{Name="Size (MB)"; Expression={[math]::Round($_.Length / 1MB, 2)}} | Format-Table -AutoSize


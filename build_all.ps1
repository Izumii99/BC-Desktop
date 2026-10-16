Write-Host "Running automated tests before build..."
dotnet test --verbosity minimal
if ($LASTEXITCODE -ne 0) {
    Write-Error "Automated tests failed! Build process aborted."
    exit 1
}

Write-Host "Cleaning previous publish folders..."
Remove-Item "publish/lightweight" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "publish/standalone" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "publish/lightweight-hidden" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "publish/standalone-hidden" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "publish/BC-Desktop-*.exe" -Force -ErrorAction SilentlyContinue
Remove-Item "publish/*.zip" -Force -ErrorAction SilentlyContinue

Write-Host "Building Lightweight..."
dotnet publish BC-Desktop.csproj -c Release -r win-x64 --self-contained false -o publish/lightweight

Write-Host "Building Standalone..."
dotnet publish BC-Desktop.csproj -c Release -r win-x64 --self-contained true -o publish/standalone

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

    Write-Host "Building Lightweight-Hidden..."
    dotnet publish BC-Desktop.csproj -c Release -r win-x64 --self-contained false -o publish/lightweight-hidden

    Write-Host "Building Standalone-Hidden..."
    dotnet publish BC-Desktop.csproj -c Release -r win-x64 --self-contained true -o publish/standalone-hidden
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
Move-Item "publish/lightweight/Bondage Club.exe" "publish/BC-Desktop-Lightweight.exe" -Force
Move-Item "publish/standalone/Bondage Club.exe" "publish/BC-Desktop-Standalone.exe" -Force

$hiddenLightweightExe = Get-ChildItem "publish/lightweight-hidden/*.exe" | Select-Object -First 1
if ($hiddenLightweightExe) {
    Move-Item $hiddenLightweightExe.FullName "publish/BC-Desktop-Lightweight-Hidden.exe" -Force
}

$hiddenStandaloneExe = Get-ChildItem "publish/standalone-hidden/*.exe" | Select-Object -First 1
if ($hiddenStandaloneExe) {
    Move-Item $hiddenStandaloneExe.FullName "publish/BC-Desktop-Standalone-Hidden.exe" -Force
}

Write-Host "Cleaning temporary build directories..."
Remove-Item "publish/lightweight" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "publish/standalone" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "publish/lightweight-hidden" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "publish/standalone-hidden" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "`nBuild complete! Direct single-file executables ready in publish/:"
Get-ChildItem "publish/BC-Desktop-*.exe" | Select-Object Name, @{Name="Size (MB)"; Expression={[math]::Round($_.Length / 1MB, 2)}} | Format-Table -AutoSize


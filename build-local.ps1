$targetDir = "publish/bc"

Write-Host "Cleaning target folder ($targetDir)..."
Remove-Item $targetDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Applying Hidden Changes..."
$hiddenName = [string][char]0x3164

$csproj = Get-Content "BC-Desktop.csproj" -Encoding UTF8
$csproj = $csproj -replace "<ApplicationIcon>Assets\\app.ico</ApplicationIcon>", "<ApplicationIcon>Assets\transparent.ico</ApplicationIcon>"
$csproj = $csproj -replace "<AssemblyName>Bondage Club</AssemblyName>", "<AssemblyName>$hiddenName</AssemblyName>"
$csproj = $csproj -replace "<Product>BC Desktop</Product>", "<Product>$hiddenName</Product>"
$csproj = $csproj -replace "<AssemblyTitle>BC Desktop</AssemblyTitle>", "<AssemblyTitle>$hiddenName</AssemblyTitle>"
Set-Content "BC-Desktop.csproj" $csproj -Encoding UTF8

$xaml = Get-Content "MainWindow.xaml" -Encoding UTF8
$xaml = $xaml -replace 'Icon="Assets/app.ico"', 'Icon="Assets/transparent.ico"'
$xaml = $xaml -replace 'Source="Assets/app_logo.png"', 'Source="Assets/transparent.png"'
$xaml = $xaml -replace 'Text="Bondage Club"', 'Text=""'
Set-Content "MainWindow.xaml" $xaml -Encoding UTF8

Write-Host "Cleaning obj and bin folders..."
Remove-Item -Path "obj" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "bin" -Recurse -Force -ErrorAction SilentlyContinue

try {
    Write-Host "Building to $targetDir..."
    dotnet publish -c Release -r win-x64 --self-contained false -o $targetDir
}
finally {
    Write-Host "Reverting Hidden Changes..."
    $csproj = Get-Content "BC-Desktop.csproj" -Encoding UTF8
    $csproj = $csproj -replace "<ApplicationIcon>Assets\\transparent.ico</ApplicationIcon>", "<ApplicationIcon>Assets\app.ico</ApplicationIcon>"
    $csproj = $csproj -replace "<AssemblyName>$hiddenName</AssemblyName>", "<AssemblyName>Bondage Club</AssemblyName>"
    $csproj = $csproj -replace "<Product>$hiddenName</Product>", "<Product>BC Desktop</Product>"
    $csproj = $csproj -replace "<AssemblyTitle>$hiddenName</AssemblyTitle>", "<AssemblyTitle>BC Desktop</AssemblyTitle>"
    Set-Content "BC-Desktop.csproj" $csproj -Encoding UTF8

    $xaml = Get-Content "MainWindow.xaml" -Encoding UTF8
    $xaml = $xaml -replace 'Icon="Assets/transparent.ico"', 'Icon="Assets/app.ico"'
    $xaml = $xaml -replace 'Source="Assets/transparent.png"', 'Source="Assets/app_logo.png"'
    $xaml = $xaml -replace 'Text=""', 'Text="Bondage Club"'
    Set-Content "MainWindow.xaml" $xaml -Encoding UTF8

    Remove-Item -Path "obj" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "bin" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Build complete! Output saved to $targetDir"

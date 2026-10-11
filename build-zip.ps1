Write-Host "Zipping..."
Remove-Item "publish/*.zip" -ErrorAction SilentlyContinue

Compress-Archive -Path "publish/lightweight/*" -DestinationPath "publish/BC-Desktop-Lightweight.zip" -Force
Compress-Archive -Path "publish/lightweight-hidden/*" -DestinationPath "publish/BC-Desktop-Lightweight-Hidden.zip" -Force
Compress-Archive -Path "publish/standalone/*" -DestinationPath "publish/BC-Desktop-Standalone.zip" -Force
Compress-Archive -Path "publish/standalone-hidden/*" -DestinationPath "publish/BC-Desktop-Standalone-Hidden.zip" -Force

Write-Host "Zipping Done!"

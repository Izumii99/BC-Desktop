# Bondage Club Desktop Client

Lightweight WPF + WebView2 wrapper for [Bondage Club](https://www.bondage-asia.com/club/).

## Features
- **Auto-detects latest version** — fetches the current R-number from the server on every launch, no need to update the URL manually
- **FUSAM addon loader** injected automatically (no Tampermonkey needed)
- **Memory-optimized** Chromium flags: V8 heap cap 512 MB, low-end device mode, single renderer process, 50 MB disk cache
- **Borderless window** with custom title bar (drag, minimize, maximize, close)
- Persistent session cookies (login saved between runs)

## Requirements
- Windows 10/11
- [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)
- WebView2 Runtime (already installed on most modern Windows 10/11)

## Build from source

```powershell
dotnet restore
dotnet build -c Release
```

## Publish as single .exe

```powershell
dotnet publish -c Release -r win-x64 --self-contained false -p:PublishSingleFile=true -o .\publish
```

## Project structure

```
BondageClub.csproj   — project file
App.xaml / .cs       — entry point
MainWindow.xaml      — borderless window layout
MainWindow.xaml.cs   — WebView2 init, version detection, FUSAM injection
app.ico              — exe/taskbar icon
app_logo.png         — window icon (BC official logo)
```

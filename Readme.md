# BC Desktop Client

Lightweight WPF + WebView2 wrapper for BC.

## Features
- **Auto-detects latest version** — fetches the current version from the server on every launch
- **Addon loader** injected automatically
- **Memory-optimized** Chromium flags (Sleeping Tabs, low RAM footprint)
- **Borderless window** with custom title bar (drag, minimize, maximize, close)
- Persistent session cookies (login saved between runs)

## Requirements
- Windows 10/11
- [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/en-us/download/dotnet/8.0) *(Only required if using the Lightweight version)*
- WebView2 Runtime (already installed on most modern Windows 10/11)

## Build from source

```powershell
dotnet restore
dotnet build -c Release
```

## Publish (Lightweight vs Standalone)

**Option 1: Lightweight (~3MB, requires .NET 8 Runtime installed)**
```powershell
dotnet publish -c Release -r win-x64 --self-contained false -p:PublishSingleFile=true -o .\publish\Lightweight
```

**Option 2: Standalone (~162MB, no installation required)**
```powershell
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o .\publish\Standalone
```

## Project structure

```
BC-Desktop.csproj   — project file
App.xaml / .cs       — entry point
MainWindow.xaml      — borderless window layout
MainWindow.xaml.cs   — WebView2 init, version detection, addon injection
app.ico              — exe/taskbar icon
app_logo.png         — window icon
```

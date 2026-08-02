<div align="center">
  <img src="app_logo.png" width="80" alt="BC Desktop" />
  <h1>BC Desktop</h1>
  <p>Lightweight, native desktop client for BC</p>

  <p>
    <img src="https://img.shields.io/badge/.NET-8.0-blue?logo=dotnet" />
    <img src="https://img.shields.io/badge/C%23-WPF-purple?logo=csharp" />
    <img src="https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-lightgrey" />
    <img src="https://img.shields.io/badge/license-MIT-green" />
  </p>
</div>

---

A minimal native desktop wrapper for BC, built with **WPF** and **.NET 8**. Uses the OS native webview (Edge WebView2) — no bundled Chromium — keeping the RAM footprint and CPU usage as small as possible.

## Features

- **Auto-detects the latest game version** on every launch
- **Addon loader** injected automatically on page load
- **Borderless custom title bar** with seamless drag, minimize, maximize, and close
- **Sleeping Tabs (Suspend on minimize)** to drastically reduce RAM while in background
- **Multi-monitor support** with proper DPI scaling bounds
- **Discreet / Stealth** design for Task Manager and Taskbar

## Why not Electron?

|                           | Electron Apps      | BC Desktop (WPF)                         |
| ------------------------- | ------------------ | ---------------------------------------- |
| **Bundled Browser**       | Chromium (~150 MB) | OS native (WebView2)                     |
| **RAM (Active Playing)**  | ~700 MB – 1.2 GB   | ~500 MB – 650 MB                         |
| **RAM (Idle/Background)** | ~200–400 MB        | ~5–30 MB (Sleeping Tabs)                 |
| **App Size (Lightweight)**| ~100–200 MB        | ~3 MB                                    |
| **App Size (Standalone)** | ~100–200 MB        | ~160 MB (Contains .NET, no Browser)      |

## Requirements

- **Windows 10/11**
- **WebView2 Runtime** (already pre-installed on most modern Windows systems)
- **[.NET 8 Desktop Runtime](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)** _(Only required if using the Lightweight build)_

## Building from Source

Prerequisites: [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)

```powershell
git clone https://github.com/Izumii99/BC-Desktop.git
cd BC-Desktop
dotnet restore
dotnet build -c Release
```

## Publishing (Lightweight vs Standalone)

**Option 1: Lightweight (~3MB, requires .NET 8 Runtime installed)**

```powershell
dotnet publish -c Release -r win-x64 --self-contained false -p:PublishSingleFile=true -o .\publish\Lightweight
```

**Option 2: Standalone (~162MB, fully self-contained)**

```powershell
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o .\publish\Standalone
```

## Project Structure

```text
BC-Desktop.csproj   — Build configuration
App.xaml / .cs      — Entry point & global settings
MainWindow.xaml     — Borderless window layout
MainWindow.xaml.cs  — WebView2 init, version detection, memory management
app.ico             — Taskbar / Exe icon
app_logo.png        — Window titlebar icon
```

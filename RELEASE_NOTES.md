### Fixes & Improvements:

- **Performance (Fix V8 MajorGC Worker Thread Thrashing):** Calibrated JavaScript Old Space heap limits to 1536MB (`--max-old-space-size=1536`), completely resolving the emergency garbage collection thrashing loop where Chromium's parallel GC worker threads consumed 35%–43% CPU in active multiplayer rooms with heavy mod stacks (`BCX`, `WCE`, `BC-LCE`, `BC-HSC`, `Echo`, `Neko`, `NotifyPlus`).
- **Performance (Fix R133 ImageCache Per-Frame Error Allocations):** Integrated a fast-path cache guard for Bondage Club R133's image cache engine (`ImageCache.prototype.get`), eliminating over 1,500 redundant `new Error()` stack-trace captures and Promise allocations per second on already-cached assets during 2D canvas drawing.
- **Performance (Fix R133 Top Menu DOM Attribute Thrashing):** Bypassed redundant `img.src` attribute writes in `ElementButton.SetImage` during per-frame chatroom top-menu visual sync (`ChatRoomTopMenuSync`), preventing Chromium Blink from re-parsing identical icon URLs and allocating Oilpan/CppGC objects 480 times per second.

### Downloads:

- **BC-Windows.exe (~160MB):** Self-contained single executable for Windows 10/11. No .NET runtime required. Just download and run.
- **BC-Windows-Hidden.exe (~160MB):** Same as Windows Standalone, but with no icon and a blank app name (Discreet mode).
- **BC-Linux.AppImage (~108MB) [Recommended]:** Portable single-file executable for Linux (Ubuntu, Debian, Fedora, Arch, Steam Deck).
- **BC-Linux-Hidden.AppImage (~108MB):** Same as Linux AppImage, with no icon and a blank app name (Discreet mode).
- **BC-Linux.tar.gz (~102MB) [Fallback]:** Portable archive for systems without FUSE or minimal distributions.
- **BC-Linux-Hidden.tar.gz (~102MB):** Same as Linux tarball, with no icon and a blank app name (Discreet mode).

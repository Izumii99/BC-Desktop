### Fixes & Improvements:

- **Feature (Server Redirection Chain Auto-Detection):** Overhauled game version auto-detection to follow the official server redirection chain. The client now verifies whether a release is actively served by the official game server before switching, preventing premature updates to pre-uploaded versions before backend servers are ready.
- **Feature (Manual Version Lock):** Added flexible version locking via `%LOCALAPPDATA%\BCClient\version.txt` (e.g. `132:lock`), enabling players to temporarily hold their client on a preferred version while waiting for third-party extensions to update.
- **Feature (GitHub Pages CDN & 3-Tier Loader):** Migrated remote addon and script distribution to dedicated GitHub Pages with an automated 3-tier fallback architecture (GitHub Pages -> Raw GitHub -> jsDelivr CDN), bypassing edge cache delays and guaranteeing high-speed script delivery worldwide.
- **Improvement (Fast Single-Hop Startup):** Validating the live game release now resolves in a single lightweight HTTP request under ~50ms, drastically cutting network overhead on every app launch.
- **Fix (R133 Addon Compatibility):** Added defensive exception guards for mod SDK properties in Neko Dark theme, preventing console crashes and ensuring seamless dark mode initialization on R133+.
- **Improvement (Universal Loader & Web Bookmarklet):** Unified all remote script loading into a streamlined root `loader.user.js` supporting direct browser bookmarklets, Tampermonkey userscripts, and native desktop client injection.

### Downloads:

- **BC-Desktop-Standalone.exe (~160MB):** Fully self-contained single executable. No .NET runtime required. Just download and run.
- **BC-Desktop-Lightweight.exe (~6MB):** Extremely small footprint single executable. Requires the [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/en-us/download/dotnet/8.0).
- **BC-Desktop-Standalone-Hidden.exe (~160MB):** Same as Standalone, but with no icon and a blank app name (Discreet mode).
- **BC-Desktop-Lightweight-Hidden.exe (~6MB):** Same as Lightweight, but with no icon and a blank app name (Discreet mode).

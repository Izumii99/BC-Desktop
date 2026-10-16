### Fixes & Improvements:

- **Feature (Seamless Single-File Executable):** The remote addon loader (`inject-all.js`) is now embedded directly into the application binary as an embedded resource. No external `Scripts/` folder is required on disk, and users no longer need to extract `.zip` archives.
- **Improvement (Direct App Distribution):** Releases are now distributed directly as runnable single `.exe` files (`BC-Desktop-Standalone.exe`, `BC-Desktop-Lightweight.exe`, `BC-Desktop-Standalone-Hidden.exe`, `BC-Desktop-Lightweight-Hidden.exe`), enabling instant one-click download and launch.
- **Fix (Room & Profile Descriptions):** Pressing Enter or Shift+Enter inside text areas (such as online room descriptions and character profiles) now inserts new lines as expected, without losing focus or mistakenly activating chat shortcuts.
- **Fix (Preferences & Dropdown Menus):** Clicking dropdown menus or scrolling inside preference grids no longer causes the window to jump to the bottom or dismiss dropdown selections prematurely.
- **Feature (Release Update Notification):** The title bar now displays an unobtrusive indicator when a newer desktop version is available, with a direct link to the release page (completely hidden in stealth mode).
- **Feature (Developer Tools):** Press `F12` at any time to open Chromium Developer Tools for instant troubleshooting, addon debugging, and inspection.
- **Improvement (Dark Theme Polish):** Styled Neko mini toast notifications, composer warnings, and wheel states to seamlessly blend with dark mode themes.
- **Improvement (Stability & Test Coverage):** Automated test suite expanded to verify built-in loader integrity, assembly manifest resources, and 6.1 semantic version comparisons.

### Downloads:

- **BC-Desktop-Standalone.exe (~160MB):** Fully self-contained single executable. No .NET runtime required. Just download and run.
- **BC-Desktop-Lightweight.exe (~6MB):** Extremely small footprint single executable. Requires the [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/en-us/download/dotnet/8.0).
- **BC-Desktop-Standalone-Hidden.exe (~160MB):** Same as Standalone, but with no icon and a blank app name (Discreet mode).
- **BC-Desktop-Lightweight-Hidden.exe (~6MB):** Same as Lightweight, but with no icon and a blank app name (Discreet mode).

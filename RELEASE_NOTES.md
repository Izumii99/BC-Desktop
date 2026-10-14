### Fixes & Improvements:

- **Immersive Fullscreen & Window Sizing:** Press `F11` at any time to toggle borderless fullscreen mode. Maximizing the game now cleanly fills your display without border gaps, and dragging maximized windows down restores smoothly across all monitor resolutions and DPI scaling factors (125%, 150%, 200%).
- **Smooth Chat & Typing Experience:** Multiline chat via `Shift + Enter` works naturally without losing your cursor. Seamless focus handling allows clicking between the game chat, dialog boxes, and addon chat windows without focus fighting. Copying with `Ctrl + C` now works reliably across all international keyboard layouts.
- **Background Battery & RAM Optimization:** When Alt-Tabbed, redraws automatically throttle to a gentle 15 FPS to cut CPU heat and battery usage while preserving your session, timers, and WebSocket connections (any custom graphics limit is always respected). Idle RAM is actively trimmed, and crowded chat rooms run significantly lighter.
- **In-App Desktop Release Checker:** The client now silently checks GitHub for newer desktop updates on startup and displays an unobtrusive indicator on the title bar with a direct link to release notes (strictly suppressed in stealth mode).
- **Crash Auto-Recovery & Developer Tools:** Built-in safeguards automatically recover and reload frozen game pages with crash-loop protection. Press `F12` to open the Chromium Developer Tools directly for quick troubleshooting and addon development.
- **Visual Polish & Quality Assurance:** Added a subtle 1-pixel border for windowed contrast, crisp ClearType text rendering, red hover highlights for the Close button, and an expanded 20-test automated validation suite.

### Downloads:

- **Standalone (~160MB):** Self-contained executable. No .NET runtime required. Just download and run.
- **Lightweight (~3MB):** Extremely small footprint. Requires the [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/en-us/download/dotnet/8.0).
- **Standalone-hidden (~160MB):** Same as Standalone, but with no icon and a blank app name (Discreet mode).
- **Lightweight-hidden (~3MB):** Same as Lightweight, but with no icon and a blank app name (Discreet mode).

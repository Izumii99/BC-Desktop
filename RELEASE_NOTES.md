### Fixes & Improvements:

- **Critical Fix (Chat Input & Selection Pull-Down):** Resolved an issue where pressing Shift+Enter while highlighting text in the chat log remained trapped in the selection block; both Enter and Shift+Enter now cleanly clear text ranges and transition active focus down into `InputChat`.
- **Critical Fix (Addon Layer vs. Game Chat Focus):** Eliminated focus cancellation and fighting between addon chat box overlays and the native game chat box (`InputChat`). Clicks on `InputChat` and surrounding chat room containers are immediately honored without mouse-down cancellation, and background game loops are prevented from resetting active focus to undefined states.
- **Critical Fix (Window Scaling & Viewport Clipping):** Eliminated canvas clipping when resizing windows down to compact viewports, and resolved an issue where window resize handles became unreachable due to unaligned Win32 `WM_GETMINMAXINFO` minimum tracking sizes.
- **Improvement (Hit-Testing & Corner Resizing):** Overhauled `WM_NCHITTEST` with expanded corner tolerances and synchronized margins to ensure smooth, responsive native window resizing down to `360x212`.
- **Improvement (Focus Crawler & Dynamic Layers):** Refined the DOM mutation observer with attribute tracking (`style`, `class`, `hidden`) and removed score bias, ensuring reopened addon layers are reliably detected without locking focus permanently to any single element.
- **Internal Cleanliness & Maintenance:** Standardized key event interception and streamlined local build automation pipelines (`build-local.ps1`).

### Downloads:

- **Standalone (~160MB):** Self-contained executable. No .NET runtime required. Just download and run.
- **Lightweight (~3MB):** Extremely small footprint. Requires the [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/en-us/download/dotnet/8.0).
- **Standalone-hidden (~160MB):** Same as Standalone, but with no icon and a blank app name (Discreet mode).
- **Lightweight-hidden (~3MB):** Same as Lightweight, but with no icon and a blank app name (Discreet mode).

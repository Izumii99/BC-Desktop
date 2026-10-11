### Fixes & Improvements:

- **Critical Fix (Chat Input / Focus Lifecycle):** Resolved an issue where pressing Shift+Enter inside the chat box inadvertently cleared selection ranges and triggered programmatic focus transitions to background elements, causing the text cursor to exit the chat box.
- **Critical Fix (Window Scaling & Viewport Clipping):** Eliminated canvas clipping when resizing windows down to compact viewports, and resolved an issue where window resize handles became unreachable due to unaligned Win32 `WM_GETMINMAXINFO` minimum tracking sizes.
- **Improvement (Hit-Testing & Corner Resizing):** Overhauled `WM_NCHITTEST` with expanded corner tolerances and synchronized margins to ensure smooth, responsive native window resizing down to `360x212`.
- **Improvement (Selection Change Guard):** Refined the document `selectionchange` listener to strictly respect active typing across all text and input fields (`InputChat`, textareas, and contenteditables), preventing background crawlers from stealing user focus during caret repositioning.
- **Improvement (Chat Log Selection):** Maintained seamless deselection of chat log text blocks upon standard `Enter` keypress while preserving modifier keys for multiline entry.
- **Internal Cleanliness & Maintenance:** Standardized key event interception and streamlined local build automation pipelines (`build-local.ps1`).

### Downloads:

- **Standalone (~160MB):** Self-contained executable. No .NET runtime required. Just download and run.
- **Lightweight (~3MB):** Extremely small footprint. Requires the [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/en-us/download/dotnet/8.0).
- **Standalone-hidden (~160MB):** Same as Standalone, but with no icon and a blank app name (Discreet mode).
- **Lightweight-hidden (~3MB):** Same as Lightweight, but with no icon and a blank app name (Discreet mode).

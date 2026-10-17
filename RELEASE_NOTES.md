### Fixes & Improvements:

- **Improvement (GPU & VRAM Consumption):** Massively reduced dedicated video memory (VRAM) footprint from ~700MB down to ~30–60MB across all game screens and wardrobe sessions, keeping your graphics card cool and responsive.
- **Improvement (Background Idle Mode):** Switching away (Alt-Tab) or minimizing the game now drops system memory (RAM) to ~100–200MB and background CPU usage to ~0% without disconnecting your chat room or dropping timers.
- **Improvement (Active Gameplay Performance):** Streamlined chat log processing and input detection, reducing active processor usage to 4–6% even in crowded rooms with active chat and multiple extensions running.
- **Fix (Input & Focus Restoration):** Returning focus to the game window now immediately restores the chat input cursor and interactive dialogue controls without input lag or missed clicks.
- **Fix (Long-Session Stability):** Eliminated resource accumulation in taskbar notification badges and page event listeners, ensuring zero memory leaks during extended all-day play sessions.
- **Fix (Taskbar Minimize & Restore):** Restoring the game window from the taskbar is now instantaneous with no frame freezing or duplicate background tasks.

### Downloads:

- **BC-Desktop-Standalone.exe (~160MB):** Fully self-contained single executable. No .NET runtime required. Just download and run.
- **BC-Desktop-Lightweight.exe (~6MB):** Extremely small footprint single executable. Requires the [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/en-us/download/dotnet/8.0).
- **BC-Desktop-Standalone-Hidden.exe (~160MB):** Same as Standalone, but with no icon and a blank app name (Discreet mode).
- **BC-Desktop-Lightweight-Hidden.exe (~6MB):** Same as Lightweight, but with no icon and a blank app name (Discreet mode).

### Fixes & Improvements:

- **Improvement (Hardware-Accelerated 60 FPS & Low CPU):** Full GPU hardware acceleration delivers buttery-smooth 60 FPS across all wardrobe sessions and chat rooms, keeping active CPU consumption at an ultra-low ~4–5%.
- **Improvement (Ultra-Low Background Idle Mode):** Switching away (Alt-Tab) or minimizing the game instantly drops GPU utilization and CPU usage to ~0% and trims system RAM to ~100–200MB, leaving your system completely free for other games and tasks.
- **Improvement (VRAM Capping & Leak Prevention):** Implemented strict Chromium GPU memory buffer budgets and discardable limits, preventing dedicated VRAM from ballooning during extended play sessions or heavy room transitions.
- **Improvement (Active Gameplay Performance):** Streamlined chat log processing and input detection, preventing frame drops in crowded rooms with active chat and multiple extensions running.
- **Fix (Input & Focus Restoration):** Returning focus to the game window now immediately restores the chat input cursor and interactive dialogue controls without input lag or missed clicks.
- **Fix (Long-Session Stability):** Eliminated resource accumulation in taskbar notification badges and page event listeners, ensuring zero memory leaks during extended all-day play sessions.
- **Fix (Taskbar Minimize & Restore):** Restoring the game window from the taskbar is now instantaneous with no frame freezing or duplicate background tasks.

### Downloads:

- **BC-Desktop-Standalone.exe (~160MB):** Fully self-contained single executable. No .NET runtime required. Just download and run.
- **BC-Desktop-Lightweight.exe (~6MB):** Extremely small footprint single executable. Requires the [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/en-us/download/dotnet/8.0).
- **BC-Desktop-Standalone-Hidden.exe (~160MB):** Same as Standalone, but with no icon and a blank app name (Discreet mode).
- **BC-Desktop-Lightweight-Hidden.exe (~6MB):** Same as Lightweight, but with no icon and a blank app name (Discreet mode).

### Fixes & Improvements:

- **Performance (Virtual Desktop Cloaking & Background Draw Pause):** Fully resolved background CPU spikes when running multiple accounts across Windows Virtual Desktops (`Win + Tab`). The application now actively checks DWM shell cloaking states (`DWMWA_CLOAKED`) and completely pauses visual canvas drawing (0 FPS) while an instance is on an inactive virtual desktop, dropping idle CPU usage from ~35% down to <1% without dropping multiplayer connections.
- **Performance (Defer Procedural Canvas Rebuilds):** Deferred heavy 50-layer character canvas recomposition (`CharacterAppearanceBuildCanvas` and `CharacterLoadCanvas`) while minimized, cloaked, or running in the background. Automated mod animations (such as tail wagging, chastity trembling, or emote loops) no longer trigger CPU spikes when you are not looking at the window, and all characters seamlessly refresh in a single instant pass upon returning to the foreground.
- **Performance (Smart Room Texture Protection & VRAM Pruning):** Textures for characters currently in your room are now actively shielded in memory using direct layer tracking (`DrawnAssets`), completely eliminating texture flickering, blank spots, and reload pauses. Memory from departed characters and old rooms is now cleaned up every 3 minutes, and GPU memory bounds have been calibrated to 512MB to keep median VRAM lean across multiple instances.
- **Performance (Addon Animation & Background DOM Optimization):** Guarded background receivers for remote animal animations and petsuit cycles in Chat QoL, eliminating unnecessary timer loops, temporary canvas allocations, and DOM scans while unfocused.
- **Performance (Chat Log Virtualization):** Integrated CSS content-visibility virtualization for chat messages, delivering buttery-smooth scrolling in long chat logs and busy rooms without having to clear message history.
- **Fix (Virtual Desktop Focus Ping-Pong):** Resolved an issue where running multiple game windows across Windows Virtual Desktops could cause an infinite rapid desktop-switching loop, by enforcing foreground window verification and canceling pending focus requests.
- **Fix (Multiplayer Ghost Character Cleanup):** Automatically identifies and evicts orphaned ghost entries from the global character array when players leave high-turnover rooms, reclaiming their offscreen canvas memory and eliminating gradual CPU drag over long multiplayer sessions.
- **Fix (Updater Payload Integrity Check):** The in-app updater now strictly verifies downloaded executable file size against GitHub Release metadata and HTTP headers before triggering restarts, preventing corrupted or truncated updates from running.
- **Fix (Clipboard & Native Memory Safety):** Hardened clipboard transactions with atomic global memory allocation and retry loops, ensuring copied chat logs and appearance strings never fail or corrupt.
- **Improvement (Addon & Chat Input Focus Flow):** Calibrated keyboard focus crawler thresholds so pressing Enter or clicking between the main chat, preferences, and external addon widgets works naturally without focus fighting or stolen keystrokes.
- **Improvement (Window & Fullscreen Lifecycle):** Streamlined fullscreen maximizing behavior and unified window state transitions for instant, smooth F11 toggling without layout latency.

### Downloads:

- **BC-Windows.exe (~160MB):** Self-contained single executable for Windows 10/11. No .NET runtime required. Just download and run.
- **BC-Windows-Hidden.exe (~160MB):** Same as Windows Standalone, but with no icon and a blank app name (Discreet mode).
- **BC-Linux.AppImage (~108MB) [Recommended]:** Portable single-file executable for Linux (Ubuntu, Debian, Fedora, Arch, Steam Deck).
- **BC-Linux-Hidden.AppImage (~108MB):** Same as Linux AppImage, with no icon and a blank app name (Discreet mode).
- **BC-Linux.tar.gz (~102MB) [Fallback]:** Portable archive for systems without FUSE or minimal distributions.
- **BC-Linux-Hidden.tar.gz (~102MB):** Same as Linux tarball, with no icon and a blank app name (Discreet mode).

### Fixes & Improvements:

- **Improvement (V8 Engine & GPU Memory Scalability):** Enabled full TurboFan JIT compilation and expanded the GPU memory budget to 384MB (with 128MB discardable limit), eliminating CPU bottlenecks, accelerating wardrobe asset loading, and preserving full CSS clipping compatibility for portrait addons (BC-LCE).
- **Improvement (Room Texture Protection & Canvas VRAM):** Protected active room character textures from flickering during texture maintenance, and immediately reclaim GPU canvas buffers when characters leave the room to prevent VRAM growth.
- **Improvement (Chat Log Virtualization & Performance):** Modern CSS content-visibility virtualization renders only visible chat messages, eliminating scroll lag and GPU overhead during long conversations without clearing history.
- **Improvement (Input & High-Polling Mouse):** Passive pointer event listeners deliver smooth responsiveness with high-polling-rate gaming mice (1000Hz+), while preventing chat input from triggering redundant focus checks.
- **Improvement (Post-Update Changelog Window):** The client now automatically displays an in-app "What's New" changelog popup window after an update or when right-clicking the update badge, providing immediate visibility into all new features and fixes.
- **Fix (Addon Memory & Rendering Optimization):** Reclaimed temporary canvas allocations in petsuit animations to prevent VRAM accumulation, and eliminated heavy text-shadow blur layers in HUD overlays.

### Downloads:

- **BC-Windows.exe (~160MB):** Self-contained single executable for Windows 10/11. No .NET runtime required. Just download and run.
- **BC-Windows-Hidden.exe (~160MB):** Same as Windows Standalone, but with no icon and a blank app name (Discreet mode).
- **BC-Linux.AppImage (~108MB) [Recommended]:** Portable single-file executable for Linux (Ubuntu, Debian, Fedora, Arch, Steam Deck).
- **BC-Linux-Hidden.AppImage (~108MB):** Same as Linux AppImage, with no icon and a blank app name (Discreet mode).
- **BC-Linux.tar.gz (~102MB) [Fallback]:** Portable archive for systems without FUSE or minimal distributions.
- **BC-Linux-Hidden.tar.gz (~102MB):** Same as Linux tarball, with no icon and a blank app name (Discreet mode).

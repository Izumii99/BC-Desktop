### Fixes & Improvements:

- **Improvement (Performance & Wardrobe Memory):** Overhauled internal memory allocation and GPU texture limits. Fixed high CPU usage and memory accumulation during extended play sessions and heavy Wardrobe customization, with intelligent texture cleanup when returning to the room.
- **Improvement (Room Texture Protection & Canvas VRAM):** Protected active room character textures from flickering during texture purges, while immediately reclaiming GPU backing buffers when characters depart the room.
- **Improvement (Chat Log Virtualization & Performance):** Implemented modern CSS content-visibility virtualization for chat messages, eliminating layout lag and GPU spikes on large chat histories without deleting scrollback history.
- **Improvement (Input & High-Polling Mouse):** Added passive pointer listeners for smooth handling on high-polling-rate gaming mice (1000Hz+), and prevented chat input from triggering focus crawlers.
- **Improvement (Lifecycle & Alt-Tab Responsiveness):** Smoother Alt-Tab switching without disk paging lag, while automatically pausing background addon polling and animations when the app is unfocused.
- **Fix (Addon Memory Leaks):** Automatically cleaned up temporary canvas allocations in petsuit animations to prevent VRAM accumulation.

### Downloads:

- **BC-Windows.exe (~160MB):** Self-contained single executable for Windows 10/11. No .NET runtime required. Just download and run.
- **BC-Windows-Hidden.exe (~160MB):** Same as Windows Standalone, but with no icon and a blank app name (Discreet mode).
- **BC-Linux.AppImage (~108MB) [Recommended]:** Portable single-file executable for Linux (Ubuntu, Debian, Fedora, Arch, Steam Deck).
- **BC-Linux-Hidden.AppImage (~108MB):** Same as Linux AppImage, with no icon and a blank app name (Discreet mode).
- **BC-Linux.tar.gz (~102MB) [Fallback]:** Portable archive for systems without FUSE or minimal distributions.
- **BC-Linux-Hidden.tar.gz (~102MB):** Same as Linux tarball, with no icon and a blank app name (Discreet mode).

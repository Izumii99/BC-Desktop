### Fixes & Improvements:

- **Improvement (Background & Multi-Monitor Smoothness):** When playing alongside heavy 3D games or keeping the window visible on a secondary monitor, character animations, struggles, and eye blinks now stay smooth at 30 FPS instead of stuttering or dropping down to 1 FPS.
- **Fix (Typing in Chat & Frame Rate Drops):** Typing messages in the chat box or addon input fields is now correctly recognized as active gameplay, preventing the frame rate from unexpectedly dropping while chatting without moving the mouse.
- **Improvement (Room Outfit & Texture Caching):** Textures for characters present in your current chat room are now kept in high-speed memory while inside the room, completely eliminating freeze-ups and stutter caused by textures constantly unloading and reloading from disk.
- **Improvement (Memory Management & SSD Health):** Aggressive background memory purging is now deferred exclusively to when the window is minimized to the taskbar, avoiding stutter from Windows swapping game assets into the SSD pagefile during regular Alt-Tab or multi-tasking.

### Downloads:

- **BC-Windows.exe (~160MB):** Self-contained single executable for Windows 10/11. No .NET runtime required. Just download and run.
- **BC-Windows-Hidden.exe (~160MB):** Same as Windows Standalone, but with no icon and a blank app name (Discreet mode).
- **BC-Linux.AppImage (~108MB) [Recommended]:** Portable single-file executable for Linux (Ubuntu, Debian, Fedora, Arch, Steam Deck).
- **BC-Linux-Hidden.AppImage (~108MB):** Same as Linux AppImage, with no icon and a blank app name (Discreet mode).
- **BC-Linux.tar.gz (~102MB) [Fallback]:** Portable archive for systems without FUSE or minimal distributions.
- **BC-Linux-Hidden.tar.gz (~102MB):** Same as Linux tarball, with no icon and a blank app name (Discreet mode).

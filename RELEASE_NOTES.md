### Fixes & Improvements:

- **Fix (GPU Process Memory Usage):** Fixed an issue where graphics memory in the background GPU process could climb to 800MB-1GB+ during long sessions or while running other games, by automatically cleaning up unused character layer textures and temporary render buffers as soon as they are no longer needed.
- **Fix (Crowded Room & Startup Frame Drops):** Eliminated heavy stutters and frame drops when opening the game or entering crowded rooms with up to 10 characters by loading background character outfits smoothly one by one while keeping your own character and the character you are interacting with instant.
- **Improvement (Instant Character Click & Dialog Menu Response):** Clicking on characters in a busy room and navigating through item and restraint menus now responds immediately without UI freezes or layout delays.
- **Feature (Configurable Auto-Focus in Chat QoL):** Added a new "Auto-Focus Text Input" setting under Keyboard Shortcuts & Navigation in Chat QoL Settings so players can choose whether chat and search boxes are focused automatically.

### Downloads:

- **BC-Windows.exe (~160MB):** Self-contained single executable for Windows 10/11. No .NET runtime required. Just download and run.
- **BC-Windows-Hidden.exe (~160MB):** Same as Windows Standalone, but with no icon and a blank app name (Discreet mode).
- **BC-Linux.AppImage (~108MB) [Recommended]:** Portable single-file executable for Linux (Ubuntu, Debian, Fedora, Arch, Steam Deck).
- **BC-Linux-Hidden.AppImage (~108MB):** Same as Linux AppImage, with no icon and a blank app name (Discreet mode).
- **BC-Linux.tar.gz (~102MB) [Fallback]:** Portable archive for systems without FUSE or minimal distributions.
- **BC-Linux-Hidden.tar.gz (~102MB):** Same as Linux tarball, with no icon and a blank app name (Discreet mode).

### Fixes & Improvements:

- **Improvement (Memory & Performance):** Implemented safe, automated VRAM and texture memory maintenance. Texture retention is tuned to safely prune unneeded assets (such as clothes browsed in Wardrobe) without freezing the canvas or affecting characters currently in the room.
- **Improvement (Wardrobe Transition):** Added gentle post-wardrobe cleanup that waits for room characters to finish loading before reclaiming GPU memory, preventing VRAM inflation over extended play sessions.
- **Fix (Stability & Rendering):** Fully protected the WebGL rendering pipeline so active character models, chat text, and room backgrounds remain fluid and responsive without visual lockups or desynchronization.
- **Feature (Multi-Platform Parity):** Unified safe texture optimization across Windows and Linux standalone builds.

### Downloads:

- **BC-Windows.exe (~160MB):** Self-contained single executable for Windows 10/11. No .NET runtime required. Just download and run.
- **BC-Windows-Hidden.exe (~160MB):** Same as Windows Standalone, but with no icon and a blank app name (Discreet mode).
- **BC-Linux.AppImage (~108MB) [Recommended]:** Portable single-file executable for Linux (Ubuntu, Debian, Fedora, Arch, Steam Deck).
- **BC-Linux-Hidden.AppImage (~108MB):** Same as Linux AppImage, with no icon and a blank app name (Discreet mode).
- **BC-Linux.tar.gz (~102MB) [Fallback]:** Portable archive for systems without FUSE or minimal distributions.
- **BC-Linux-Hidden.tar.gz (~102MB):** Same as Linux tarball, with no icon and a blank app name (Discreet mode).

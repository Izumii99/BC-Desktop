### Fixes & Improvements:

- **Feature (Smart Background Character Pre-Loading):** Players joining or changing outfits in a room now load and build their character appearance in the background while you are Alt-Tabbed, ensuring characters are already visible without pop-in delays when you look at or return to the window.
- **Improvement (Activity-Aware Background Animation Burst):** Automatic and manual JSON-driven animations from `BCAR`, `BC-LCE`, and `BC-HSC` now wake the background renderer into a temporary ~15 FPS burst only while active and automatically return to 1 FPS deep-idle mode afterward, preserving low RAM, CPU, and GPU usage with full anti-leak protection.
- **Improvement (Smoother Foreground Animations & Overlay Responsiveness):** Raised foreground character canvas animation responsiveness to 30+ FPS and eliminated layout stutters when hypnosis or visual overlay effects (`BC-HSC`, `BC-LCE`) add or remove screen elements.

### Downloads:

- **BC-Windows.exe (~160MB):** Self-contained single executable for Windows 10/11. No .NET runtime required. Just download and run.
- **BC-Windows-Hidden.exe (~160MB):** Same as Windows Standalone, but with no icon and a blank app name (Discreet mode).
- **BC-Linux.AppImage (~108MB) [Recommended]:** Portable single-file executable for Linux (Ubuntu, Debian, Fedora, Arch, Steam Deck).
- **BC-Linux-Hidden.AppImage (~108MB):** Same as Linux AppImage, with no icon and a blank app name (Discreet mode).
- **BC-Linux.tar.gz (~102MB) [Fallback]:** Portable archive for systems without FUSE or minimal distributions.
- **BC-Linux-Hidden.tar.gz (~102MB):** Same as Linux tarball, with no icon and a blank app name (Discreet mode).

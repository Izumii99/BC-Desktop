### Fixes & Improvements:

- **Performance (Multi-Instance & Background Efficiency):** Significantly optimized CPU and GPU usage when running multiple accounts or leaving the game in the background. Visual drawing now pauses seamlessly when minimized or placed on an inactive Virtual Desktop, eliminating background CPU spikes and battery drain while keeping chat and multiplayer connections fully alive.
- **Performance (Smart Texture & Memory Management):** Improved VRAM and texture lifecycle handling. Textures for characters currently in your room remain smoothly loaded without flickering or reload pauses, while assets from departed characters are cleanly freed from memory.
- **Fix (Virtual Desktop Switching):** Resolved an issue where running multiple game windows across Windows Virtual Desktops (`Win + Tab`) could cause focus fighting or unexpected desktop swapping.
- **Improvement (Chat & Addon Focus Flow):** Calibrated keyboard focus handling so typing between the main game chat, preferences, and addon widgets feels completely smooth and natural without misdirected keystrokes.
- **QoL (Chat Log & Addon Enhancements):** Smooth scrolling in long chat logs with instant responsiveness, optimized temporary asset buffers in Chat QoL animations, and consolidated favorite actions directly into settings.

### Downloads:

- **BC-Windows.exe (~160MB):** Self-contained single executable for Windows 10/11. No .NET runtime required. Just download and run.
- **BC-Windows-Hidden.exe (~160MB):** Same as Windows Standalone, but with no icon and a blank app name (Discreet mode).
- **BC-Linux.AppImage (~108MB) [Recommended]:** Portable single-file executable for Linux (Ubuntu, Debian, Fedora, Arch, Steam Deck).
- **BC-Linux-Hidden.AppImage (~108MB):** Same as Linux AppImage, with no icon and a blank app name (Discreet mode).
- **BC-Linux.tar.gz (~102MB) [Fallback]:** Portable archive for systems without FUSE or minimal distributions.
- **BC-Linux-Hidden.tar.gz (~102MB):** Same as Linux tarball, with no icon and a blank app name (Discreet mode).

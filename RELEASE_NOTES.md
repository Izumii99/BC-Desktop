### Fixes & Improvements:

- **Feature (Multi-Platform Standalone Release):** Full standalone packages are now available across both Windows (10/11) and Linux distributions (Ubuntu, Debian, Fedora, Arch, Steam Deck). No external runtime installation is required.
- **Fix (Neko Dark - Native Checkbox Appearance):** Fixed an issue where game preference checkboxes (such as *Invert Room*) were rendered as solid black boxes. Native appearance and checkmark visibility are now properly preserved.
- **Improvement (Neko Dark - Context-Aware Notification Anchoring):** Re-anchored the floating *New Message* notification button to the character canvas area (`left: 25%`) in landscape mode and to the right (`left: 70%`) in portrait mode, ensuring text input and chat typing are never obstructed.
- **Improvement (Addon Manager Default State):** Updated default state for `neko-dark.js`, `translate.js`, and `cheat-menu.js` to disabled (OFF) on clean installations, giving players full control over when they want to enable external add-ons.
- **Architecture (Streamlined Distribution):** Dropped lightweight runtime-dependent builds in favor of 100% self-contained standalone executables for maximum reliability out of the box.

### Downloads:

- **BC-Desktop-Windows-Standalone.exe (~160MB):** Fully self-contained single executable for Windows 10/11. No .NET runtime required. Just download and run.
- **BC-Desktop-Windows-Standalone-Hidden.exe (~160MB):** Same as Windows Standalone, but with no icon and a blank app name (Discreet mode).
- **BC-Desktop-Linux-Standalone.AppImage (~108MB):** Portable standalone for Linux (Ubuntu, Debian, Fedora, Arch, Steam Deck). Just download, allow executing, and double-click.
- **BC-Desktop-Linux-Standalone-Hidden.AppImage (~108MB):** Same as Linux Standalone, but with no icon and a blank app name (Discreet mode).
- **BC-Desktop-Linux-Standalone.tar.gz (~102MB):** Portable tarball archive for systems without FUSE or minimal distributions.
- **BC-Desktop-Linux-Standalone-Hidden.tar.gz (~102MB):** Same as Linux Standalone tarball, with no icon and a blank app name (Discreet mode).

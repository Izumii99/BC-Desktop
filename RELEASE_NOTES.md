### Fixes & Improvements:

- **Feature (Seamless In-App Auto-Updater):** You can now update the application directly from the title bar with a single click. The app downloads the new version in the background, displays real-time download progress, and automatically restarts into the updated version without cluttering your Downloads folder.
- **Improvement (Linux Multi-Format Support):** Auto-updates now seamlessly support both portable `.AppImage` single files and unpacked `.tar.gz` directories, replacing or updating existing game installations in-place cleanly.
- **Improvement (Update Controls & Options):** Right-clicking the update badge opens the GitHub release notes in your browser if you wish to read the changelog before updating.
- **Feature (Tester & Dev Isolation):** Local test versions now run in complete isolation with updates disabled, ensuring developer builds never overwrite or interfere with live production versions.

### Downloads:

- **BC-Windows.exe (~160MB):** Self-contained single executable for Windows 10/11. No .NET runtime required. Just download and run.
- **BC-Windows-Hidden.exe (~160MB):** Same as Windows Standalone, but with no icon and a blank app name (Discreet mode).
- **BC-Linux.AppImage (~108MB) [Recommended]:** Portable single-file executable for Linux (Ubuntu, Debian, Fedora, Arch, Steam Deck).
- **BC-Linux-Hidden.AppImage (~108MB):** Same as Linux AppImage, with no icon and a blank app name (Discreet mode).
- **BC-Linux.tar.gz (~102MB) [Fallback]:** Portable archive for systems without FUSE or minimal distributions.
- **BC-Linux-Hidden.tar.gz (~102MB):** Same as Linux tarball, with no icon and a blank app name (Discreet mode).

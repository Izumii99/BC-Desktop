### Fixes & Improvements:

- **Security (Addon Isolation Whitelist):** Replaced legacy opt-out blacklist behavior with an explicit opt-in whitelist (`chat-qol.js`), preventing newly discovered external or experimental scripts on CDN from automatically executing without user authorization.
- **Addon QoL (Pull to One Side with Mouth):** Consolidated "Pull to One Side with Mouth" natively into Chat QoL with default-enabled state and user-configurable toggle in Settings, eliminating duplicate legacy hooks from Cheat Menu and ensuring conflict-free ModSDK execution.
- **Client Updater Integrity & Size Check:** The desktop binary updater now strictly validates downloaded payload size against GitHub API metadata and HTTP headers before triggering restarts, preventing incomplete or truncated downloads from executing.
- **UI & Performance (Dark Theme CSS Containment):** Optimized CSS containment on chat bubbles to prevent clipping on action popups and character detail cards, with smart caching for dynamic stylesheet sanitization.
- **UI (Version Pill Badge & Changelog Modal):** Added an interactive version badge to the title bar with click-to-view changelog functionality and rich typography rendering.

### Downloads:

- **BC-Windows.exe (~160MB):** Self-contained single executable for Windows 10/11. No .NET runtime required. Just download and run.
- **BC-Windows-Hidden.exe (~160MB):** Same as Windows Standalone, but with no icon and a blank app name (Discreet mode).
- **BC-Linux.AppImage (~108MB) [Recommended]:** Portable single-file executable for Linux (Ubuntu, Debian, Fedora, Arch, Steam Deck).
- **BC-Linux-Hidden.AppImage (~108MB):** Same as Linux AppImage, with no icon and a blank app name (Discreet mode).
- **BC-Linux.tar.gz (~102MB) [Fallback]:** Portable archive for systems without FUSE or minimal distributions.
- **BC-Linux-Hidden.tar.gz (~102MB):** Same as Linux tarball, with no icon and a blank app name (Discreet mode).

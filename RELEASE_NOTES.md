### Fixes & Improvements:

- **Fix (Clipboard & Native Memory):** Streamlined memory handle initialization during clipboard transactions to guarantee atomic allocations and eliminate redundant P/Invoke assignments.
- **Improvement (Window & Fullscreen Lifecycle):** Simplified fullscreen maximizing behavior and unified window state transitions to deliver seamless F11 toggling without layout latency.
- **Performance (P/Invoke Equality & Static Analysis):** Implemented strongly-typed equality semantics across all Win32 interop structures (`MINMAXINFO`, `MONITORINFO`, `FLASHWINFO`, `POINT`, `WINDOWPOS`, `RECT`) and tuned static analysis profiles to eliminate client-side false positives.
- **QoL (Chat Input & Addon Focus Flow):** Calibrated focus crawler thresholds to prevent input fighting during keyboard navigation and preserve natural typing focus between the game chat and external addon widgets.
- **Security (Addon Isolation Whitelist):** Replaced legacy opt-out blacklist behavior with an explicit opt-in whitelist (`chat-qol.js`), preventing newly discovered external or experimental scripts on CDN from automatically executing without user authorization.
- **Addon QoL (Pull to One Side with Mouth):** Consolidated "Pull to One Side with Mouth" natively into Chat QoL with default-enabled state and user-configurable toggle in Settings, eliminating duplicate legacy hooks from Cheat Menu and ensuring conflict-free ModSDK execution.
- **Client Updater Integrity & Size Check:** The desktop binary updater now strictly validates downloaded payload size against GitHub API metadata and HTTP headers before triggering restarts, preventing incomplete or truncated downloads from executing.
- **UI (Version Pill Badge & Rich Changelog Viewer):** Added an interactive version pill badge to the title bar with click-to-view changelog functionality and overhauled the release notes modal with rich Markdown styling, clean bullet points, and high contrast typography.
- **Improvement (V8 Engine & GPU Memory Scalability):** Enabled full TurboFan JIT compilation and expanded the GPU memory budget to 384MB (with 128MB discardable limit), eliminating CPU bottlenecks, accelerating wardrobe asset loading, and preserving full CSS clipping compatibility for portrait addons (BC-LCE).
- **Improvement (Room Texture Protection & Canvas VRAM):** Protected active room character textures from flickering during texture maintenance, and immediately reclaim GPU canvas buffers when characters leave the room to prevent VRAM growth.
- **Improvement (Chat Log Virtualization & Performance):** Modern CSS content-visibility virtualization renders only visible chat messages, eliminating scroll lag and GPU overhead during long conversations without clearing history.
- **Improvement (Input & High-Polling Mouse):** Passive pointer event listeners deliver smooth responsiveness with high-polling-rate gaming mice (1000Hz+), while preventing chat input from triggering redundant focus checks.
- **Fix (Virtual Desktop Focus Ping-Pong):** Resolved an issue where switching between Windows Virtual Desktops (`Win + Tab`) with multiple instances running caused an infinite rapid desktop-switching loop, by validating foreground window ownership, canceling in-flight activations, and checking DWM cloaked state before focusing.
- **Fix (Addon Memory & Rendering Optimization):** Reclaimed temporary canvas allocations in petsuit animations to prevent VRAM accumulation, and eliminated heavy text-shadow blur layers in HUD overlays.

### Downloads:

- **BC-Windows.exe (~160MB):** Self-contained single executable for Windows 10/11. No .NET runtime required. Just download and run.
- **BC-Windows-Hidden.exe (~160MB):** Same as Windows Standalone, but with no icon and a blank app name (Discreet mode).
- **BC-Linux.AppImage (~108MB) [Recommended]:** Portable single-file executable for Linux (Ubuntu, Debian, Fedora, Arch, Steam Deck).
- **BC-Linux-Hidden.AppImage (~108MB):** Same as Linux AppImage, with no icon and a blank app name (Discreet mode).
- **BC-Linux.tar.gz (~102MB) [Fallback]:** Portable archive for systems without FUSE or minimal distributions.
- **BC-Linux-Hidden.tar.gz (~102MB):** Same as Linux tarball, with no icon and a blank app name (Discreet mode).

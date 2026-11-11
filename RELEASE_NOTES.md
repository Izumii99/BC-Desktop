### Fixes & Improvements:

- **Fix (Photo Mode & "Take a Picture" Window):** Taking photos in-game now opens a dedicated photo preview window instead of silently failing to appear on both Windows and Linux.
- **Fix (Screenshot Cleaner & Custom Backgrounds):** Custom room backgrounds and interaction menus no longer disappear when character dialogs or item menus are open while Screenshot Cleaner is active.
- **Improvement (Smart Search Focus on Touch):** Tapping the search icon in item and wardrobe menus now automatically opens the keyboard so you can search immediately, while general menu navigation and applying restraints keep the keyboard closed.
- **Improvement (Background & Multi-Monitor Smoothness):** When playing alongside heavy 3D games or keeping the window visible on a secondary monitor, character animations, struggles, and eye blinks stay smooth while queuing heavy character outfit rebuilds so they never cause lag spikes.
- **Fix (Typing in Chat & Frame Rate Drops):** Typing messages in the chat box or addon input fields is now correctly recognized as active gameplay, preventing the frame rate from unexpectedly dropping while chatting without moving the mouse.
- **Fix (GPU & RAM Spikes When Returning to Game):** Fixed an issue where returning to the game window after idling or Alt-Tabbing caused all character clothing layers in the room to reload at once and spike GPU memory above 600 MB.
- **Improvement (Smart Outfit Layer Pruning):** Temporary clothing layer textures and masks are now automatically released as soon as a character finishes rendering onto the room canvas, cutting background and active GPU process memory in half without any visual stutter.
- **Fix (Map Movement & Canvas Focus Release):** Clicking on the game canvas or pressing Escape inside the chat box now cleanly releases keyboard focus from the chat input, allowing WASD and arrow keys to move your character smoothly in Map Rooms without typing into chat.
- **Fix (Offline Profile Preview Crash):** Viewing profiles of offline friends or players outside your current room no longer triggers a canvas drawing error.
- **Fix (Exit Confirmation Dialog & Fast Double-Close):** Clicking the close ("X") button a second time while the exit prompt is open now exits the app cleanly instead of crashing, while clicking anywhere else on the window plays an alert sound and brings the confirmation dialog to the front.

### Downloads:

- **BC-Windows.exe (~160MB):** Self-contained single executable for Windows 10/11. No .NET runtime required. Just download and run.
- **BC-Windows-Hidden.exe (~160MB):** Same as Windows Standalone, but with no icon and a blank app name (Discreet mode).
- **BC-Linux.AppImage (~108MB) [Recommended]:** Portable single-file executable for Linux (Ubuntu, Debian, Fedora, Arch, Steam Deck).
- **BC-Linux-Hidden.AppImage (~108MB):** Same as Linux AppImage, with no icon and a blank app name (Discreet mode).
- **BC-Linux.tar.gz (~102MB) [Fallback]:** Portable archive for systems without FUSE or minimal distributions.
- **BC-Linux-Hidden.tar.gz (~102MB):** Same as Linux tarball, with no icon and a blank app name (Discreet mode).

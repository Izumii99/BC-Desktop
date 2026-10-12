### Fixes & Improvements:

- **Improvement (Background CPU Usage):** When the game window is in the background (alt-tabbed), the game now redraws at a gentle 15 FPS instead of full speed. CPU and power usage drop sharply while idling, and full graphics come back instantly as soon as the window is focused again. If a custom "Max FPS when unfocused" value has already been chosen in the game's Graphics settings, that choice is always respected and never changed.
- **Improvement (Background Memory & Alt-Tab):** When switching away from or minimizing the game, system memory is cleaned up after a short idle period. This keeps the background RAM footprint small while chat connections and timers stay alive, and no longer causes CPU spikes while the game sits in the background.
- **Improvement (Busy Chat Rooms):** Fast-moving chat rooms no longer trigger unnecessary background work in the input focus helper, so long sessions in crowded rooms stay smoother and lighter.
- **Improvement (Lower Idle Footprint):** The built-in web engine no longer keeps an extra idle background process running, which saves memory without affecting the game.
- **Improvement (Crash Auto-Recovery):** If the game page or internal web engine ever encounters an unexpected failure or freezes, the application now automatically detects it and reloads the game smoothly instead of hanging on a frozen screen.
- **Fix (Addon Manager Translator Icon):** Fixed a display issue where the In-Game Translator icon in the Addon Manager menu showed broken text fragments instead of the translation logo.
- **Feature (Automated Quality & Integrity Checks):** Added an automated test suite and pre-build safety checks that verify window layouts, 2:1 canvas aspect ratio, and core performance rules across all future builds and contributions.

### Downloads:

- **Standalone (~160MB):** Self-contained executable. No .NET runtime required. Just download and run.
- **Lightweight (~3MB):** Extremely small footprint. Requires the [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/en-us/download/dotnet/8.0).
- **Standalone-hidden (~160MB):** Same as Standalone, but with no icon and a blank app name (Discreet mode).
- **Lightweight-hidden (~3MB):** Same as Lightweight, but with no icon and a blank app name (Discreet mode).

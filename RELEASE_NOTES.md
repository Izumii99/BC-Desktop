### Fixes & Improvements:

- **Fix (Window Maximize & Fullscreen):** Maximizing the game now fills your entire screen cleanly without leaving thin black gaps along the borders. Clicking the very top-right corner of your screen also reliably closes the game every time.
- **Fix (Moving & Dragging Windows):** Dragging a maximized window down to restore it now stays smoothly aligned with your mouse cursor, even on high-resolution screens, display scaling (125%, 150%, 200%), and custom window sizes, without jumping across the screen.
- **Fix (Maximize & Restore Button):** Using Windows shortcuts (`Win + Up` / `Win + Down`) or snapping the window to the top of your screen now properly updates the title bar button icon right away.
- **Fix (Window Resizing & Shrinking):** Making the game window very small no longer cuts off the game screen or makes the resize borders disappear, allowing you to grab and resize window edges and corners easily at any size.
- **Fix (Close Button Hover):** Hovering your mouse over the Close button now lights up in bright red, giving clear visual feedback before exiting.
- **Fix (In-Game Menus & Search Boxes):** Opening in-game menus with search bars or text boxes (such as the restraint search menu, wardrobe search, and dialog boxes) now receives and maintains typing focus smoothly without being pulled back to the main chat box.
- **Fix (Chat Multiline & Shift+Enter):** Pressing Shift+Enter while typing in the chat box now creates a new line normally without kicking you out or losing your typing cursor.
- **Fix (Chat Log Selection):** Highlighting text in the chat history and pressing Enter or Shift+Enter now cleanly unselects the text and moves your typing cursor straight back into the chat box.
- **Fix (Addon & Main Chat Switching):** Clicking between the game's main chat box and addon chat windows now switches smoothly without losing focus or cancelling your clicks.
- **Fix (Copy Across All Keyboard Layouts):** Copying text with `Ctrl + C` now works consistently across all international keyboard layouts and language inputs.
- **Improvement (Addon Chat Windows):** Opening an addon chat window or selecting a friend to message now places your typing cursor into the text box automatically.
- **Improvement (Background CPU & Battery Savings):** When you Alt-Tab away from the game, it now automatically slows down redraws to a gentle 15 FPS. This noticeably cuts CPU, heat, and battery usage while keeping timers and chat connections alive. Full graphics come back instantly the moment you click back. (Any custom FPS limit already set in game settings is always respected).
- **Improvement (Lower Background Memory):** System memory is automatically cleaned up in the background when minimized or unfocused, keeping RAM usage low without disconnecting your session.
- **Improvement (Busy Chat Rooms):** Fast-moving chat rooms with lots of incoming messages now run significantly smoother and lighter on your computer.
- **Improvement (Crash Auto-Recovery):** If the internal game page ever freezes or encounters an unexpected error, the application now automatically detects it and recovers smoothly with built-in crash-loop protection to prevent endless reload cycles.
- **Fix (Addon Manager Icons):** Fixed an issue where the In-Game Translator button in the Addon Manager menu showed broken text fragments instead of the translation logo.
- **Feature (Immersive Fullscreen with F11):** Pressing `F11` now toggles immersive borderless fullscreen mode instantly, hiding the title bar and expanding the game to fill your entire display for distraction-free gameplay. Press `F11` again at any time to return to windowed mode.
- **Improvement (Window Border & Contrast in Windowed Mode):** Added a subtle 1-pixel dark border around the window when running in windowed mode, making the game cleanly stand out against dark desktops or background applications without blending in. The border seamlessly disappears when maximized or in fullscreen.
- **Improvement (Crisp Text & Title Bar Rendering):** Enabled ClearType display text formatting and device pixel snapping across the application window, ensuring title labels and window icons remain sharp, clean, and crystal-clear on all monitors and display scaling settings.
- **Feature (Built-in Quality & Safety Checks):** Added automated tests that verify window dimensions, native 2:1 game canvas ratio, and performance rules before any new updates are built.

### Downloads:

- **Standalone (~160MB):** Self-contained executable. No .NET runtime required. Just download and run.
- **Lightweight (~3MB):** Extremely small footprint. Requires the [.NET 8 Desktop Runtime](https://dotnet.microsoft.com/en-us/download/dotnet/8.0).
- **Standalone-hidden (~160MB):** Same as Standalone, but with no icon and a blank app name (Discreet mode).
- **Lightweight-hidden (~3MB):** Same as Lightweight, but with no icon and a blank app name (Discreet mode).

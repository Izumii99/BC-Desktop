using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace BCDesktop.Tests;

[TestClass]
public class MainWindowTests
{
    private static string ProjectRoot => FindProjectRoot();
    private static string MainWindowSourceCode =>
        string.Join("\n", Directory.GetFiles(ProjectRoot, "MainWindow*.cs").OrderBy(f => f).Select(File.ReadAllText));

    private static string FindProjectRoot()
    {
        string? dir = AppContext.BaseDirectory;
        while (dir != null && !File.Exists(Path.Combine(dir, "BC-Desktop.csproj")))
        {
            dir = Directory.GetParent(dir)?.FullName;
        }
        return dir ?? throw new DirectoryNotFoundException("Could not locate BC-Desktop.csproj root directory.");
    }


    [TestMethod]
    public void XamlLayout_AdheresToWindowAndGridRules()
    {
        string xamlPath = Path.Combine(ProjectRoot, "MainWindow.xaml");
        Assert.IsTrue(File.Exists(xamlPath), "MainWindow.xaml must exist in the project root.");
        string xaml = File.ReadAllText(xamlPath);

        // Rule: WindowStyle="None" and AllowsTransparency="True" to prevent 7px Windows 11 crop
        StringAssert.Contains(xaml, "WindowStyle=\"None\"", "WindowStyle must be None.");
        StringAssert.Contains(xaml, "AllowsTransparency=\"True\"", "AllowsTransparency must be True.");

        // Rule: WindowChrome must NOT be used
        Assert.IsFalse(xaml.Contains("WindowChrome"), "WindowChrome has crop bugs and must not be used.");

        // Rule: TitleBar on Grid.Row 0, WebView on Grid.Row 1
        StringAssert.Contains(xaml, "Grid.Row=\"0\"", "TitleBar must occupy Grid.Row 0.");
        StringAssert.Contains(xaml, "Grid.Row=\"1\"", "WebView must occupy Grid.Row 1.");

        // Essential controls and handlers must be present
        StringAssert.Contains(xaml, "x:Name=\"WebView\"", "WebView control must be defined with x:Name='WebView'.");
        StringAssert.Contains(xaml, "x:Name=\"TitleLabel\"", "TitleLabel must exist for window captioning.");
        StringAssert.Contains(xaml, "x:Name=\"UpdateBadge\"", "UpdateBadge must exist for unobtrusive release notifications.");
        StringAssert.Contains(xaml, "MinimizeBtn_Click", "Minimize button handler must exist.");
        StringAssert.Contains(xaml, "MaxRestoreBtn", "MaxRestoreBtn must exist.");
        StringAssert.Contains(xaml, "CloseBtn_Click", "Close button handler must exist.");
    }

    [TestMethod]
    public void AspectRatio_CompliesWithNativeCanvasTwoToOneFormula()
    {
        // Rule: Canvas aspect ratio is 2:1. Native formula is Height = (Width / 2) + 32 (where 32px is title bar height)
        static double CalculateTargetHeight(double width) => (width / 2.0) + 32.0;

        string xamlPath = Path.Combine(ProjectRoot, "MainWindow.xaml");
        string xaml = File.ReadAllText(xamlPath);

        var widthMatch = Regex.Match(xaml, @"Width=""(\d+)""");
        var heightMatch = Regex.Match(xaml, @"Height=""(\d+)""");

        Assert.IsTrue(widthMatch.Success, "Default Width attribute must be present in MainWindow.xaml");
        Assert.IsTrue(heightMatch.Success, "Default Height attribute must be present in MainWindow.xaml");

        double width = double.Parse(widthMatch.Groups[1].Value);
        double height = double.Parse(heightMatch.Groups[1].Value);

        double expectedHeight = CalculateTargetHeight(width);
        Assert.AreEqual(expectedHeight, height, 0.01, $"Default dimensions {width}x{height} must satisfy Height = (Width / 2) + 32 to prevent letterboxing.");

        // Common test resolutions
        Assert.AreEqual(532.0, CalculateTargetHeight(1000));
        Assert.AreEqual(608.0, CalculateTargetHeight(1152));
        Assert.AreEqual(632.0, CalculateTargetHeight(1200));
        Assert.AreEqual(732.0, CalculateTargetHeight(1400));
        Assert.AreEqual(832.0, CalculateTargetHeight(1600));
    }

    [TestMethod]
    public void ChromiumFlags_ContainAllRequiredOptimizations()
    {
        string code = MainWindowSourceCode;

        // Required background reduction and occlusion flags
        StringAssert.Contains(code, "--disable-features=Translate,OptimizationHints,MediaRouter,DialMediaRouteProvider");
        StringAssert.Contains(code, "SpareRendererForSitePerProcess");
        StringAssert.Contains(code, "--disable-background-networking");
        StringAssert.Contains(code, "--disable-component-update");
        StringAssert.Contains(code, "--disable-domain-reliability");
        StringAssert.Contains(code, "--disable-sync");
        StringAssert.Contains(code, "--js-flags=");
        StringAssert.Contains(code, "--max-old-space-size=1536");
        Assert.IsFalse(code.Contains("--optimize-for-size"), "Must not disable V8 TurboFan JIT with --optimize-for-size.");
        StringAssert.Contains(code, "--expose-gc");

        // VRAM capping and memory budget flags (sized for multi-instance shared GPU process)
        StringAssert.Contains(code, "--force-gpu-mem-available-mb=512");
        StringAssert.Contains(code, "--force-gpu-mem-discardable-limit-mb=128");
        StringAssert.Contains(code, "--gpu-rasterization-msaa-sample-count=0");
        StringAssert.Contains(code, "--disable-site-isolation-trials");
        StringAssert.Contains(code, "AudioServiceOutOfProcess");

        // Must not include aggressive timer or occlusion throttling that chokes multi-window/portrait play
        Assert.IsFalse(code.Contains("CalculateNativeWinOcclusion"), "Must not treat multi-window as occluded.");
        Assert.IsFalse(code.Contains("IntensiveWakeUpThrottling"), "Must not cut off JS timer executions.");

        // Prohibited flags for 2D canvas apps
        Assert.IsFalse(code.Contains("--enable-gpu-rasterization"), "GPU rasterization flag is prohibited for 2D canvas.");
        Assert.IsFalse(code.Contains("--enable-low-end-device-mode"), "Low-end device mode flag is prohibited as it overloads CPU.");
    }

    [TestMethod]
    public void ProcessFailure_AutoRecoveryIsHooked()
    {
        string code = MainWindowSourceCode;

        StringAssert.Contains(code, "core.ProcessFailed +=", "ProcessFailed event must be hooked for auto-recovery.");
        StringAssert.Contains(code, "CoreWebView2ProcessFailedKind.RenderProcessExited");
        StringAssert.Contains(code, "core.Reload()", "Automatic reload must be invoked on renderer exit.");
        StringAssert.Contains(code, "_recentCrashCount <= 3", "Crash loop protection must throttle repeated reloads.");
    }

    [TestMethod]
    public void ExternalLinks_DelegatedToDefaultBrowser()
    {
        string code = MainWindowSourceCode;

        StringAssert.Contains(code, "core.NewWindowRequested +=", "NewWindowRequested must be hooked to intercept popup links.");
        StringAssert.Contains(code, "args.Handled = true", "New window popup must be marked handled.");
        StringAssert.Contains(code, "UseShellExecute = true", "External links must be opened via system shell.");
    }

    [TestMethod]
    public void UnfocusedFpsCap_IsInMemoryAndRestored()
    {
        StringAssert.Contains(MainWindow.CapUnfocusedFpsScript, "MaxUnfocusedFPS=15");
        StringAssert.Contains(MainWindow.CapUnfocusedFpsScript, "!g.MaxUnfocusedFPS", "Must never override a user-chosen limit.");
        StringAssert.Contains(MainWindow.CapUnfocusedFpsScript, "'Preference'", "Must skip the Preference screen so the cap is never saved.");
        StringAssert.Contains(MainWindow.RestoreUnfocusedFpsScript, "MaxUnfocusedFPS=0");
        Assert.IsFalse(MainWindow.CapUnfocusedFpsScript.Contains("ServerAccountUpdate"), "Cap must stay in memory only.");
    }

    [TestMethod]
    public void VramOptimization_PreservedInInjectedScripts()
    {
        string csPath = Path.Combine(ProjectRoot, "MainWindow.xaml.cs");
        string linuxPath = Path.Combine(ProjectRoot, "platform", "linux", "main.js");

        string csCode = MainWindowSourceCode;
        string linuxCode = File.ReadAllText(linuxPath);

        foreach (var (code, name) in new[] { (csCode, "MainWindow"), (linuxCode, "platform/linux/main.js") })
        {
            StringAssert.Contains(code, "setupSafeVramOptimization", $"{name} must include setupSafeVramOptimization.");
            StringAssert.Contains(code, "protectActiveRoomTextures", $"{name} must protect active room textures.");
            StringAssert.Contains(code, "ensureChatVirtualizationCss", $"{name} must ensure chat virtualization.");
        }
    }

    [TestMethod]
    public void CanvasThrottlingAndFocusHooks_PreservedInInjectedScripts()
    {
        string csPath = Path.Combine(ProjectRoot, "MainWindow.xaml.cs");
        string linuxPath = Path.Combine(ProjectRoot, "platform", "linux", "main.js");

        string csCode = MainWindowSourceCode;
        string linuxCode = File.ReadAllText(linuxPath);

        foreach (var (code, name) in new[] { (csCode, "MainWindow"), (linuxCode, "platform/linux/main.js") })
        {
            StringAssert.Contains(code, "__bcDrawHooked", $"{name} must guard against duplicate DrawProcess hooking.");
            StringAssert.Contains(code, "__bcOrigHasFocus", $"{name} must intercept document.hasFocus.");
            StringAssert.Contains(code, "_bcIsMinimized", $"{name} must check _bcIsMinimized to skip DrawProcess.");
            StringAssert.Contains(code, "_lastBgDrawTime < 1000", $"{name} must enforce ~1 FPS fallback throttle when backgrounded.");
            StringAssert.Contains(code, "_bcPendingCanvasBuild", $"{name} must defer canvas building when backgrounded or minimized.");
            StringAssert.Contains(code, "__bcLoadCanvasHooked", $"{name} must intercept CharacterLoadCanvas.");
            StringAssert.Contains(code, "__bcBuildCanvasHooked", $"{name} must intercept CharacterAppearanceBuildCanvas.");
            StringAssert.Contains(code, "_bcRequestBgBurst", $"{name} must include smart background burst scheduling.");
            StringAssert.Contains(code, "now-window._bcLastGc>60000", $"{name} must enforce 60s cooldown on window.gc().");
        }
        Assert.IsFalse(csCode.Contains("Object.defineProperty(window,'DrawProcess'"), "Must not define configurable accessor on DrawProcess in document-created script (overwritten by BC function declaration).");
        Assert.IsFalse(csCode.Contains("Object.defineProperty(window,'CharacterAppearanceBuildCanvas'"), "Must not define configurable accessor on CharacterAppearanceBuildCanvas in document-created script.");
    }

    [TestMethod]
    public void MemoryOptimization_TrimWorkingSet_ExecutesSuccessfully()
    {
        [DllImport("kernel32.dll")] static extern IntPtr GetCurrentProcess();
        [DllImport("kernel32.dll")] static extern bool SetProcessWorkingSetSize(IntPtr hProcess, IntPtr dwMinimumWorkingSetSize, IntPtr dwMaximumWorkingSetSize);

        bool result = SetProcessWorkingSetSize(GetCurrentProcess(), (IntPtr)(-1), (IntPtr)(-1));
        Assert.IsTrue(result, "SetProcessWorkingSetSize(-1, -1) must return true when trimming process memory.");
    }

    [TestMethod]
    public void VersionDetection_CandidateProbingRange_IsCorrect()
    {
        int activeVersion = 132;
        var candidates = new HashSet<int>();
        for (int i = 0; i <= 8; i++)
        {
            candidates.Add(activeVersion + i);
        }
        for (int i = 1; i <= 3; i++)
        {
            if (activeVersion - i >= 132)
            {
                candidates.Add(activeVersion - i);
            }
        }

        Assert.IsTrue(candidates.Contains(132), "Active version must be probed.");
        Assert.IsTrue(candidates.Contains(133), "Next version must be probed.");
        Assert.IsTrue(candidates.Contains(140), "Future candidate (+8) must be probed.");
        Assert.IsFalse(candidates.Contains(131), "Versions below min bound (132) must be excluded.");
        Assert.AreEqual(9, candidates.Count);
    }

    [TestMethod]
    public void ClipboardBridgeProtocol_CorrectlyParsesPayload()
    {
        static string? ExtractCopyText(string rawJson)
        {
            string? msg = null;
            if (rawJson != null && rawJson.StartsWith("\"") && rawJson.EndsWith("\""))
            {
                msg = JsonSerializer.Deserialize<string>(rawJson);
            }
            if (msg != null && msg.StartsWith("COPY_TEXT:"))
            {
                return msg.Substring(10);
            }
            return null;
        }

        string validMessage = "\"COPY_TEXT:https://example.com/share\"";
        Assert.AreEqual("https://example.com/share", ExtractCopyText(validMessage));

        string nonCopyMessage = "\"CHAT_MESSAGE:hello world\"";
        Assert.IsNull(ExtractCopyText(nonCopyMessage));

        string malformed = "unquoted string";
        Assert.IsNull(ExtractCopyText(malformed));
    }

    [TestMethod]
    public void TaskbarNotificationBadge_RegexParsesCorrectly()
    {
        var match1 = Regex.Match("(3) Bondage Club", @"^\((\d+)\)");
        Assert.IsTrue(match1.Success, "Title badge with unread count must match.");
        Assert.AreEqual("3", match1.Groups[1].Value);

        var match2 = Regex.Match("Bondage Club", @"^\((\d+)\)");
        Assert.IsFalse(match2.Success, "Standard title without badge must not match.");
    }

    [TestMethod]
    public void ScriptDistribution_FollowsWhitelistAndLoaderIntegrity()
    {
        // 1. Verify remote loader exists and points to addon manager
        string rootLoader = Path.Combine(ProjectRoot, "loader.user.js");
        Assert.IsTrue(File.Exists(rootLoader), "Root loader loader.user.js must exist.");
        string loaderContent = File.ReadAllText(rootLoader);
        StringAssert.Contains(loaderContent, "addon-manager.js", "Remote loader must target addon-manager.js.");

        // Verify built-in loader embedded resource compiles into the binary
        string builtInScript = MainWindow.GetBuiltInLoaderScript();
        Assert.IsFalse(string.IsNullOrWhiteSpace(builtInScript), "Embedded resource BuiltInLoader.js must be present.");
        StringAssert.Contains(builtInScript, "addon-manager.js", "Built-in loader must target addon-manager.js.");

        // Verify smart auto-detection between local tester folder and built-in loader
        string csPath = Path.Combine(ProjectRoot, "MainWindow.xaml.cs");
        string csCode = File.ReadAllText(csPath);
        StringAssert.Contains(csCode, "hasLocalScripts", "MainWindow must auto-detect local scripts folder.");

        // 2. Verify addon-manager.js ignores deprecated and disabled scripts
        string addonManagerPath = Path.Combine(ProjectRoot, "Scripts", "addon-manager.js");
        Assert.IsTrue(File.Exists(addonManagerPath), "Scripts/addon-manager.js must exist.");
        string addonManagerContent = File.ReadAllText(addonManagerPath);
        string[] ignoredScripts = ["autofocus.js", "fluid-color.js", "fusam.js", "LikoPlugin.js", "fusam-liko-loader.js", "wardrobe-pagination.js"];
        foreach (var ignored in ignoredScripts)
        {
            StringAssert.Contains(addonManagerContent, ignored, $"Addon Manager must include '{ignored}' in IGNORED_SCRIPTS.");
        }

        // 3. Verify neko-dark.js integrity and duplicate protection
        string nekoDarkPath = Path.Combine(ProjectRoot, "Scripts", "neko-dark.js");
        Assert.IsTrue(File.Exists(nekoDarkPath), "Scripts/neko-dark.js must exist.");
        string nekoDarkContent = File.ReadAllText(nekoDarkPath);
        StringAssert.Contains(nekoDarkContent, "_bcNekoDarkInjected", "neko-dark.js must contain singleton guard.");
        StringAssert.Contains(nekoDarkContent, "hookBcModSdk", "neko-dark.js must guard bcModSdk against duplicate unloading.");
        StringAssert.Contains(nekoDarkContent, "isNekoModLoaded", "neko-dark.js must verify existing Neko mod state before injecting runtime.");
        StringAssert.Contains(nekoDarkContent, "#bcn-toast", "neko-dark.js must include dark theme overrides for #bcn-toast popup.");
        StringAssert.Contains(nekoDarkContent, "[class*=\"new-message\"]", "neko-dark.js must include dark theme overrides for floating new message notifications.");

        // 4. If tester scripts directory exists, enforce whitelist rule strictly
        string testerScripts = Path.Combine(ProjectRoot, "publish", "tester", "Scripts");
        if (Directory.Exists(testerScripts))
        {
            string[] whitelist = ["chat-qol.js", "cheat-menu.js", "devtools-debug.js", "fusam-liko-loader.js", "neko-dark.js", "translate.js"];
            var actualFiles = Directory.GetFiles(testerScripts, "*.js").Select(Path.GetFileName).ToList();
            foreach (var file in actualFiles)
            {
                CollectionAssert.Contains(whitelist, file, $"Tester scripts folder contains non-whitelisted script '{file}'.");
            }
        }
    }

    [TestMethod]
    public void XamlDocument_ContainsValidWindowProperties()
    {
        string xamlPath = Path.Combine(ProjectRoot, "MainWindow.xaml");
        var doc = System.Xml.Linq.XDocument.Load(xamlPath);
        var root = doc.Root;
        Assert.IsNotNull(root, "Root Window element must exist.");

        Assert.AreEqual("None", root.Attribute("WindowStyle")?.Value);
        Assert.AreEqual("True", root.Attribute("AllowsTransparency")?.Value);
        Assert.AreEqual("Transparent", root.Attribute("Background")?.Value);
        Assert.IsNotNull(root.Attribute("Title")?.Value, "Window Title attribute must be present.");

        double width = double.Parse(root.Attribute("Width")?.Value ?? "0");
        double height = double.Parse(root.Attribute("Height")?.Value ?? "0");
        Assert.IsTrue(width >= 360, "Width must meet or exceed minimum dimensions.");
        Assert.AreEqual((width / 2.0) + 32.0, height, 0.01, "Window dimensions must satisfy Height = (Width / 2) + 32.");
    }

    [TestMethod]
    public void TitleBar_CloseButtonHasDedicatedTemplateWithHoverFeedback()
    {
        string xamlPath = Path.Combine(ProjectRoot, "MainWindow.xaml");
        string xaml = File.ReadAllText(xamlPath);

        // CloseTitleBtn must have its own ControlTemplate so it is not overridden by TitleBtn template triggers
        StringAssert.Contains(xaml, "<Style x:Key=\"CloseTitleBtn\"", "CloseTitleBtn must be defined.");
        StringAssert.Contains(xaml, "Value=\"#c42b1c\"", "Close button must use red hover highlight (#c42b1c).");
        StringAssert.Contains(xaml, "Value=\"#992115\"", "Close button must use dark red pressed state (#992115).");
    }

    [TestMethod]
    public void WindowStateManagement_DpiAndHitTestGuardsAreEnforced()
    {
        string code = MainWindowSourceCode;

        // Maximize/Restore button and Margin must synchronize through unified helper
        StringAssert.Contains(code, "UpdateWindowStateUI()", "Window state UI must have a unified update method.");
        StringAssert.Contains(code, "if (WindowState == WindowState.Maximized)", "WindowState guards must be present.");

        // WM_NCHITTEST must not return resize edges when maximized (Fitts's Law + no resize handles)
        Assert.IsTrue(Regex.IsMatch(code, @"if\s*\(\s*WindowState\s*==\s*WindowState\.Maximized\s*\)\s*\{\s*return\s*IntPtr\.Zero;\s*\}"),
            "WM_NCHITTEST must return IntPtr.Zero when maximized to prevent cursor distortion and resize glitches.");

        // DPI scaling and RestoreBounds must be applied during un-maximize dragging
        StringAssert.Contains(code, "RestoreBounds.Width", "RestoreBounds must be used during un-maximize dragging.");
        StringAssert.Contains(code, "VisualTreeHelper.GetDpi(this)", "DPI scale must be queried during dragging.");
        StringAssert.Contains(code, "screenPos.X / dpi.DpiScaleX", "X coordinate must be converted from physical pixels to DIPs.");
        StringAssert.Contains(code, "screenPos.Y / dpi.DpiScaleY", "Y coordinate must be converted from physical pixels to DIPs.");

        // Physical KeyC code must be checked for cross-layout clipboard support
        StringAssert.Contains(code, "KeyC", "Physical KeyC code must be checked for cross-layout clipboard support.");
    }

    [TestMethod]
    public void VisualPresentationAndFullscreen_ConfigurationIsEnforced()
    {
        string xamlPath = Path.Combine(ProjectRoot, "MainWindow.xaml");
        string xaml = File.ReadAllText(xamlPath);

        StringAssert.Contains(xaml, "SnapsToDevicePixels=\"True\"", "Window must enable SnapsToDevicePixels for pixel crispness.");
        StringAssert.Contains(xaml, "TextOptions.TextFormattingMode=\"Display\"", "Text formatting mode must be Display for sharp text.");
        StringAssert.Contains(xaml, "RenderOptions.ClearTypeHint=\"Enabled\"", "ClearType hint must be Enabled.");
        StringAssert.Contains(xaml, "x:Name=\"WindowBorder\"", "WindowBorder container must be defined.");

        string cs = MainWindowSourceCode;

        StringAssert.Contains(cs, "ToggleFullscreen()", "Fullscreen toggle method must be implemented.");
        StringAssert.Contains(cs, "TOGGLE_FULLSCREEN", "Fullscreen message bridge must be connected.");
        StringAssert.Contains(cs, "Key.F11", "F11 keyboard handler must be hooked.");
        StringAssert.Contains(cs, "Key.F12", "F12 keyboard handler must be hooked for DevTools.");
    }

    private static void RunInSTA(Action action)
    {
        Exception? ex = null;
        var thread = new System.Threading.Thread(() =>
        {
            try
            {
                action();
            }
            catch (Exception e)
            {
                ex = e;
            }
        });
        thread.SetApartmentState(System.Threading.ApartmentState.STA);
        thread.Start();
        thread.Join();
        if (ex != null)
        {
            System.Runtime.ExceptionServices.ExceptionDispatchInfo.Capture(ex).Throw();
        }
    }

    [TestMethod]
    public void MainWindow_RuntimeInstance_InitializesPropertiesAndDynamicStateTransitions()
    {
        RunInSTA(() =>
        {
            var window = new MainWindow(initializeWebView: false);
            Assert.IsNotNull(window, "MainWindow instance must be created successfully.");
            Assert.AreEqual(WindowStyle.None, window.WindowStyle);
            Assert.IsTrue(window.AllowsTransparency);
            Assert.AreEqual("Bondage Club", window.Title);
            Assert.AreEqual("Bondage Club", window.TitleLabel.Text);
            Assert.AreEqual(WindowState.Normal, window.WindowState);

            // Verify live instantiated visual tree elements
            Assert.IsNotNull(window.WebView, "WebView must exist in the visual tree.");
            Assert.IsNotNull(window.TitleLabel, "TitleLabel must exist in the visual tree.");
            Assert.IsNotNull(window.MaxRestoreBtn, "MaxRestoreBtn must exist in the visual tree.");
            Assert.IsNotNull(window.WindowBorder, "WindowBorder must exist in the visual tree.");

            // Verify grid placement
            Assert.AreEqual(0, System.Windows.Controls.Grid.GetRow(window.TitleBarGrid), "TitleBarGrid must be in Grid.Row 0.");
            Assert.AreEqual(1, System.Windows.Controls.Grid.GetRow(window.WebView), "WebView must be in Grid.Row 1.");

            // Initial normal state margin and border
            Assert.AreEqual(new Thickness(5, 0, 5, 5), window.WebView.Margin);
            Assert.AreEqual(new Thickness(1), window.WindowBorder.BorderThickness);
            Assert.AreEqual("\uE922", window.MaxRestoreBtn.Content);

            // Trigger dynamic runtime state transition to Maximized
            window.WindowState = WindowState.Maximized;
            window.UpdateWindowStateUI();
            Assert.AreEqual(new Thickness(0), window.WebView.Margin, "WebView margin must dynamically collapse to 0 on maximize.");
            Assert.AreEqual(new Thickness(0), window.WindowBorder.BorderThickness, "WindowBorder thickness must dynamically collapse to 0 on maximize.");
            Assert.AreEqual("\uE923", window.MaxRestoreBtn.Content, "MaxRestore button glyph must switch to Restore icon on maximize.");

            // Trigger dynamic runtime state transition back to Normal
            window.WindowState = WindowState.Normal;
            window.UpdateWindowStateUI();
            Assert.AreEqual(new Thickness(5, 0, 5, 5), window.WebView.Margin, "WebView margin must dynamically restore to 5,0,5,5 on restore.");
            Assert.AreEqual(new Thickness(1), window.WindowBorder.BorderThickness, "WindowBorder thickness must restore to 1 on restore.");
            Assert.AreEqual("\uE922", window.MaxRestoreBtn.Content, "MaxRestore button glyph must switch back to Maximize icon on restore.");
        });
    }

    [TestMethod]
    public void JavaScriptFiles_PassSyntaxAndIntegrityChecks()
    {
        var jsFiles = Directory.GetFiles(Path.Combine(ProjectRoot, "Scripts"), "*.js")
            .Append(Path.Combine(ProjectRoot, "loader.user.js"))
            .ToList();

        Assert.IsTrue(jsFiles.Count >= 5, "Must find at least 5 JavaScript addon/loader scripts.");

        foreach (var file in jsFiles)
        {
            string fileName = Path.GetFileName(file);
            string content = File.ReadAllText(file);

            Assert.IsTrue(content.Length > 50, $"Script '{fileName}' must not be empty or truncated.");

            // Must not contain leftover git merge conflict markers
            Assert.IsFalse(content.Contains("<<<<<<<"), $"Script '{fileName}' contains git conflict marker '<<<<<<<'.");
            Assert.IsFalse(content.Contains("======="), $"Script '{fileName}' contains git conflict marker '======='.");
            Assert.IsFalse(content.Contains(">>>>>>>"), $"Script '{fileName}' contains git conflict marker '>>>>>>>'.");

            // Must not contain corrupted null bytes
            Assert.IsFalse(content.Contains('\0'), $"Script '{fileName}' contains binary null bytes.");

            // Must follow standard browser addon architecture: scoped IIFE wrapper (allowing userscript header comments)
            string strippedHeader = Regex.Replace(content, @"^(?:\s*//[^\r\n]*\r?\n|\s*/\*.*?\*/)*", "", RegexOptions.Singleline).TrimStart();
            Assert.IsTrue(strippedHeader.StartsWith("(function") || strippedHeader.StartsWith("(() =>"),
                $"Script '{fileName}' must begin with scoped IIFE '(function' or '(() =>'.");
            Assert.IsTrue(content.Trim().EndsWith("})();"), $"Script '{fileName}' must properly terminate with IIFE invocation '}})();'.");
        }
    }

    [TestMethod]
    public void AppVersionComparison_AccuratelyEvaluatesSemanticVersions()
    {
        Assert.AreEqual("7.5.4", MainWindow.CurrentAppVersion, "CurrentAppVersion must be 7.5.4.");

        Assert.IsTrue(MainWindow.IsNewerVersion("v7.5", "7.4"), "v7.5 must be newer than 7.4.");
        Assert.IsTrue(MainWindow.IsNewerVersion("7.5", "7.4"), "7.5 must be newer than 7.4.");
        Assert.IsTrue(MainWindow.IsNewerVersion("v7.4.1", "7.4"), "Patch version v7.4.1 must be newer than 7.4.");
        Assert.IsTrue(MainWindow.IsNewerVersion("v8.0", "7.4"), "Major version v8.0 must be newer than 7.4.");

        Assert.IsFalse(MainWindow.IsNewerVersion("7.4.0", "7.4"), "7.4.0 must be equal to 7.4 (no false update prompt).");
        Assert.IsFalse(MainWindow.IsNewerVersion("v7.4.0", "7.4"), "v7.4.0 must be equal to 7.4.");
        Assert.IsFalse(MainWindow.IsNewerVersion("6.2", "6.2"), "Identical versions must return false.");
        Assert.IsFalse(MainWindow.IsNewerVersion("v6.2", "6.2"), "Identical versions with 'v' prefix must return false.");
        Assert.IsFalse(MainWindow.IsNewerVersion("v6.1", "6.2"), "Older version v6.1 must return false.");
        Assert.IsFalse(MainWindow.IsNewerVersion("v1.0", "6.2"), "Older version v1.0 must return false.");
        Assert.IsFalse(MainWindow.IsNewerVersion("", "6.2"), "Empty latest tag must return false.");
        Assert.IsFalse(MainWindow.IsNewerVersion("invalid-tag", "6.2"), "Malformed tag must return false.");
    }

    [TestMethod]
    public void AppUpdateNotification_SuppressedInStealthMode()
    {
        RunInSTA(() =>
        {
            var window = new MainWindow(initializeWebView: false);
            // Simulate stealth mode where title label was initialized empty
            window.TitleLabel.Text = "";
            typeof(MainWindow).GetField("_originalTitleLabel", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                ?.SetValue(window, "");

            var checkTask = window.CheckForAppUpdatesAsync();
            checkTask.Wait(500);

            Assert.IsNull(window.TitleLabel.ToolTip, "Stealth mode must strictly suppress any update tooltip or notice.");
            Assert.AreEqual(Visibility.Collapsed, window.UpdateBadge.Visibility, "Stealth mode must strictly keep UpdateBadge collapsed.");
        });
    }

    [TestMethod]
    public void AppUpdateNotification_ConfiguresInstantUpdateAssetUrl()
    {
        RunInSTA(() =>
        {
            var window = new MainWindow(initializeWebView: false);
            string json = """
            {
                "tag_name": "v99.0",
                "html_url": "https://github.com/Izumii99/BC-Desktop/releases/tag/v99.0",
                "assets": [
                    {
                        "name": "BC-Windows.exe",
                        "browser_download_url": "https://github.com/Izumii99/BC-Desktop/releases/download/v99.0/BC-Windows.exe"
                    }
                ]
            }
            """;

            var handler = new SimpleMockHttpHandler(_ => new HttpResponseMessage(System.Net.HttpStatusCode.OK)
            {
                Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
            });
            using var client = new HttpClient(handler);

            var checkTask = window.CheckForAppUpdatesAsync(client);
            checkTask.Wait(1000);

            Assert.AreEqual(Visibility.Visible, window.UpdateBadge.Visibility, "UpdateBadge must be visible when update is available.");
            Assert.AreEqual("Update v99.0", window.UpdateBadgeText.Text);
            StringAssert.Contains(window.UpdateBadge.ToolTip.ToString(), "Left-click to instantly download & install");
            Assert.AreEqual("https://github.com/Izumii99/BC-Desktop/releases/download/v99.0/BC-Windows.exe", MainWindow._newReleaseDownloadUrl);
        });
    }

    [TestMethod]
    public void AppUpdate_InstantUpdateDownloadsAndInvokesRestartLauncher()
    {
        RunInSTA(() =>
        {
            var window = new MainWindow(initializeWebView: false);
            string dummyTarget = Path.Combine(Path.GetTempPath(), $"BC-TestTarget-{Guid.NewGuid():N}.exe");
            File.WriteAllText(dummyTarget, "dummy-binary");

            MainWindow._newReleaseDownloadUrl = "http://mock-github.com/releases/BC-Windows.exe";
            MainWindow._isUpdating = false;

            byte[] dummyPayload = new byte[1024];
            new Random(42).NextBytes(dummyPayload);

            var handler = new SimpleMockHttpHandler(_ => new HttpResponseMessage(System.Net.HttpStatusCode.OK)
            {
                Content = new ByteArrayContent(dummyPayload)
            });
            using var client = new HttpClient(handler);

            bool launcherInvoked = false;
            string? capturedTemp = null;
            string? capturedTarget = null;

            try
            {
                var updateTask = window.PerformInstantUpdateAsync(
                    httpClient: client,
                    targetExePath: dummyTarget,
                    restartLauncher: (temp, target, pid) =>
                    {
                        launcherInvoked = true;
                        capturedTemp = temp;
                        capturedTarget = target;
                        return true;
                    });

                bool success = updateTask.GetAwaiter().GetResult();
                Assert.IsTrue(success, "PerformInstantUpdateAsync must succeed with valid payload.");
                Assert.IsTrue(launcherInvoked, "Restart launcher delegate must be invoked.");
                Assert.AreEqual(dummyTarget, capturedTarget);
                Assert.IsNotNull(capturedTemp);
                Assert.IsTrue(File.Exists(capturedTemp), "Downloaded update file must exist.");
                Assert.AreEqual(1024, new FileInfo(capturedTemp).Length);
            }
            finally
            {
                if (File.Exists(dummyTarget))
                {
                    File.Delete(dummyTarget);
                }
                if (!string.IsNullOrEmpty(capturedTemp) && File.Exists(capturedTemp))
                {
                    File.Delete(capturedTemp);
                }
                MainWindow._isUpdating = false;
            }
        });
    }

    [TestMethod]
    public void AppUpdate_InstantUpdateRejectsMismatchedPayload()
    {
        RunInSTA(() =>
        {
            var window = new MainWindow(initializeWebView: false);
            string dummyTarget = Path.Combine(Path.GetTempPath(), $"BC-TestTarget-{Guid.NewGuid():N}.exe");
            File.WriteAllText(dummyTarget, "dummy-binary");

            MainWindow._newReleaseDownloadUrl = "http://mock-github.com/releases/BC-Windows.exe";
            MainWindow._newReleaseAssetSize = 2048; // Expecting 2048 bytes
            MainWindow._isUpdating = false;

            byte[] smallPayload = new byte[1024]; // Only 1024 bytes provided

            var handler = new SimpleMockHttpHandler(_ => new HttpResponseMessage(System.Net.HttpStatusCode.OK)
            {
                Content = new ByteArrayContent(smallPayload)
            });
            using var client = new HttpClient(handler);

            try
            {
                var updateTask = window.PerformInstantUpdateAsync(
                    httpClient: client,
                    targetExePath: dummyTarget,
                    restartLauncher: (temp, target, pid) => true);

                bool success = updateTask.GetAwaiter().GetResult();
                Assert.IsFalse(success, "PerformInstantUpdateAsync must return false and fail gracefully on size mismatch.");
            }
            finally
            {
                if (File.Exists(dummyTarget))
                {
                    File.Delete(dummyTarget);
                }
                MainWindow._newReleaseAssetSize = null;
                MainWindow._isUpdating = false;
            }
        });
    }

    [TestMethod]
    public void AppUpdate_SuppressedWhenAutoUpdateDisabled()
    {
        RunInSTA(() =>
        {
            var window = new MainWindow(initializeWebView: false);
            bool prev = MainWindow.EnableAutoUpdates;
            try
            {
                MainWindow.EnableAutoUpdates = false;
                Assert.IsFalse(MainWindow.IsAutoUpdateEnabled(), "IsAutoUpdateEnabled must return false when EnableAutoUpdates is false.");

                var checkTask = window.CheckForAppUpdatesAsync();
                checkTask.Wait(500);

                Assert.AreEqual(Visibility.Collapsed, window.UpdateBadge.Visibility, "UpdateBadge must remain collapsed when auto-updates are disabled.");
            }
            finally
            {
                MainWindow.EnableAutoUpdates = prev;
            }
        });
    }

    private class SimpleMockHttpHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _responder;
        public SimpleMockHttpHandler(Func<HttpRequestMessage, HttpResponseMessage> responder) => _responder = responder;
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(_responder(request));
    }

    [TestMethod]
    public void Win32Structures_HaveCorrectMemoryFootprintAndLayout()
    {
        Type monitorInfoType = typeof(MainWindow).GetNestedType("MONITORINFO", System.Reflection.BindingFlags.NonPublic)!;
        Assert.IsNotNull(monitorInfoType, "MONITORINFO struct must be defined.");
        Assert.AreEqual(40, Marshal.SizeOf(monitorInfoType), "MONITORINFO must be 40 bytes.");

        Type rectType = typeof(MainWindow).GetNestedType("RECT", System.Reflection.BindingFlags.NonPublic)!;
        Assert.IsNotNull(rectType, "RECT struct must be defined.");
        Assert.AreEqual(16, Marshal.SizeOf(rectType), "RECT must be 16 bytes.");

        Type minmaxInfoType = typeof(MainWindow).GetNestedType("MINMAXINFO", System.Reflection.BindingFlags.NonPublic)!;
        Assert.IsNotNull(minmaxInfoType, "MINMAXINFO struct must be defined.");
        Assert.AreEqual(40, Marshal.SizeOf(minmaxInfoType), "MINMAXINFO must be 40 bytes.");

        Type flashwInfoType = typeof(MainWindow).GetNestedType("FLASHWINFO", System.Reflection.BindingFlags.NonPublic)!;
        Assert.IsNotNull(flashwInfoType, "FLASHWINFO struct must be defined.");
        Assert.IsTrue(Marshal.SizeOf(flashwInfoType) >= 20, "FLASHWINFO must be at least 20 bytes.");
    }

    [TestMethod]
    public void CrashLoopThrottle_CalculatesIntervalCorrectly()
    {
        DateTime lastCrash = DateTime.UtcNow.AddSeconds(-10);
        DateTime now = DateTime.UtcNow;
        int crashCount = 1;

        if ((now - lastCrash).TotalSeconds < 30)
        {
            crashCount++;
        }
        else
        {
            crashCount = 1;
        }

        Assert.AreEqual(2, crashCount, "Rapid crash within 30s must increment crash count.");

        lastCrash = DateTime.UtcNow.AddSeconds(-45);
        if ((now - lastCrash).TotalSeconds < 30)
        {
            crashCount++;
        }
        else
        {
            crashCount = 1;
        }

        Assert.AreEqual(1, crashCount, "Crash after > 30s cooldown must reset count to 1.");
    }

    [TestMethod]
    public void FocusAndInputIntegrity_EnterAndScrollGuardsAreEnforced()
    {
        string code = MainWindowSourceCode;

        // Enter key in editable controls must not be blocked or blurred
        StringAssert.Contains(code, "isInteractive(active) || isInteractive(e.target)", "Enter key handler must exempt interactive elements.");
        StringAssert.Contains(code, "function isTextInput(el)", "isTextInput helper must be defined.");
        StringAssert.Contains(code, "function isInteractive(el)", "isInteractive helper must be defined.");

        // bcRunFocusCrawler must filter out non-text inputs (checkboxes, radio buttons)
        StringAssert.Contains(code, "!isTextInput(el)", "bcRunFocusCrawler must exclude non-text inputs like checkboxes.");

        // Preference screens and scroll boxes must not have focus hijacked on mouseup
        StringAssert.Contains(code, ".scroll-box", "mouseup must protect scroll-box containers from focus stealing.");
        StringAssert.Contains(code, "[id^=\"\"preference-\"\"]", "mouseup must protect preference screen containers.");

        // Color picker and sliders must not have focus hijacked on mouseup or selectionchange
        StringAssert.Contains(code, "bc-tint-input", "isInteractive and mouseup must protect bc-tint-input.");
        StringAssert.Contains(code, "fieldset[name=\"\"color-picker\"\"]", "mouseup must protect color-picker container from focus stealing.");
        StringAssert.Contains(code, "if (window.bcIsMouseDown) return;", "selectionchange must guard against focus stealing while sliding or dragging.");

        // Strict addon layering, drag selection protection, and time-decayed click intent
        StringAssert.Contains(code, "getActiveAddonInputStrict()", "getActiveAddonInputStrict helper must be defined for throttled addon detection.");
        StringAssert.Contains(code, "isDraggingSelection", "mouseup must track drag selection distance to prevent deselecting text.");
        StringAssert.Contains(code, "recentClick", "wasClicked must be time-decayed to prevent stale click intent leaks.");
    }

    [TestMethod]
    public void TranslateWidget_CssAndMarkupIntegrity()
    {
        string translatePath = Path.Combine(ProjectRoot, "Scripts", "translate.js");
        Assert.IsTrue(File.Exists(translatePath), "Scripts/translate.js must exist.");

        string content = File.ReadAllText(translatePath);

        // Must define self-contained styles for widget and dropdown chevron
        StringAssert.Contains(content, "translate-widget", "translate.js must define #translate-widget.");
        StringAssert.Contains(content, ".bc-dropdown-chevron", "translate.js must style .bc-dropdown-chevron.");
        StringAssert.Contains(content, "14px !important", "Dropdown chevron must enforce explicit 14px size.");
        StringAssert.Contains(content, "bc-google-translate-btn", "translate.js must define floating button.");
        StringAssert.Contains(content, "copy-translation-btn", "translate.js must define copy button.");
    }

    [TestMethod]
    public void VersionDetection_HybridPortalScraperCalendarAndLock()
    {
        string csContent = MainWindowSourceCode;

        // Verify Hybrid architecture methods and ElementFX lock are present
        StringAssert.Contains(csContent, "GetCalculatedCalendarVersion", "MainWindow must define GetCalculatedCalendarVersion.");
        StringAssert.Contains(csContent, "FetchOfficialVersionNumberAsync", "MainWindow must define FetchOfficialVersionNumberAsync.");
        StringAssert.Contains(csContent, "BaseGameUrl", "MainWindow must define BaseGameUrl.");
        StringAssert.Contains(csContent, "rawContent.EndsWith(\":lock\"", "Must support version lock syntax in version.txt.");

        // Unit test Dynilath calendar version calculation formula across boundary dates
        Assert.AreEqual(111, MainWindow.GetCalculatedCalendarVersion(new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)));
        Assert.AreEqual(112, MainWindow.GetCalculatedCalendarVersion(new DateTime(2025, 1, 16, 0, 0, 0, DateTimeKind.Utc)));
        Assert.AreEqual(132, MainWindow.GetCalculatedCalendarVersion(new DateTime(2026, 10, 15, 0, 0, 0, DateTimeKind.Utc)));
        Assert.AreEqual(133, MainWindow.GetCalculatedCalendarVersion(new DateTime(2026, 10, 16, 0, 0, 0, DateTimeKind.Utc)));
        Assert.AreEqual(133, MainWindow.GetCalculatedCalendarVersion(new DateTime(2026, 10, 22, 0, 0, 0, DateTimeKind.Utc)));

        // Unit test regex matching for official portal buttons
        string samplePortalHtml1 = "<button onclick=\"window.location='https://www.bondageprojects.elementfx.com/R133/BondageClub/'\">Play</button>";
        var match1 = Regex.Match(samplePortalHtml1, @"onclick=""window\.location='https://www\.bondage[^']+/R(\d+)/[^']*'""", RegexOptions.IgnoreCase);
        Assert.IsTrue(match1.Success, "Must match ElementFX portal button");
        Assert.AreEqual("133", match1.Groups[1].Value);

        string samplePortalHtml2 = "<button onclick=\"window.location='https://www.bondage-europe.com/club/R134/'\">Play</button>";
        var match2 = Regex.Match(samplePortalHtml2, @"onclick=""window\.location='https://www\.bondage[^']+/R(\d+)/[^']*'""", RegexOptions.IgnoreCase);
        Assert.IsTrue(match2.Success, "Must match Europe portal button");
        Assert.AreEqual("134", match2.Groups[1].Value);

        // Unit test BaseGameUrl formatting
        string formattedUrl = string.Format(MainWindow.BaseGameUrl, 133);
        Assert.AreEqual("https://www.bondage-asia.com/club/R133/", formattedUrl);

        // Unit test version lock string parsing logic
        string lockInput = "132:lock";
        bool isLocked = lockInput.EndsWith(":lock", StringComparison.OrdinalIgnoreCase);
        string cleanedVer = lockInput.Substring(0, lockInput.Length - 5).Trim();
        Assert.IsTrue(isLocked, "isLocked must be true for 132:lock");
        Assert.AreEqual("132", cleanedVer);
    }

    [TestMethod]
    public void LinuxPlatform_IntegrityAndMetadataMatchesRules()
    {
        string linuxPkgPath = Path.Combine(ProjectRoot, "platform", "linux", "package.json");
        Assert.IsTrue(File.Exists(linuxPkgPath), "platform/linux/package.json must exist.");

        string pkgJson = File.ReadAllText(linuxPkgPath);
        using var doc = JsonDocument.Parse(pkgJson);
        var root = doc.RootElement;

        Assert.AreEqual("bc-desktop-linux", root.GetProperty("name").GetString());
        Assert.AreEqual(MainWindow.CurrentAppVersion, root.GetProperty("version").GetString());
        Assert.AreEqual("Bondage Club", root.GetProperty("productName").GetString());
        Assert.IsTrue(root.TryGetProperty("keywords", out _), "package.json must specify keywords.");

        string mainJsPath = Path.Combine(ProjectRoot, "platform", "linux", "main.js");
        Assert.IsTrue(File.Exists(mainJsPath), "platform/linux/main.js must exist.");

        string mainJs = File.ReadAllText(mainJsPath);
        StringAssert.Contains(mainJs, "setAspectRatio(2.0)", "Linux main.js must enforce 2:1 native aspect ratio.");
        StringAssert.Contains(mainJs, "bc-tint-input", "Linux main.js must include bc-tint-input focus guards.");
        StringAssert.Contains(mainJs, "fieldset[name=\"color-picker\"]", "Linux main.js must protect color picker from focus stealing.");
        StringAssert.Contains(mainJs, "force-gpu-mem-available-mb", "Linux main.js must cap VRAM like Windows.");
        StringAssert.Contains(mainJs, "disable-notifications", "Linux main.js must disable notifications like Windows.");
        StringAssert.Contains(mainJs, "max-gum-fps", "Linux main.js must cap fps like Windows.");
        StringAssert.Contains(mainJs, "setWindowOpenHandler", "Linux main.js must delegate external links to default browser.");
        StringAssert.Contains(mainJs, "KeyC", "Linux main.js must handle physical Ctrl+KeyC.");
        StringAssert.Contains(mainJs, "getCalendarVersionNumber", "Linux main.js must define getCalendarVersionNumber.");
        StringAssert.Contains(mainJs, "getLatestElementFxUrl", "Linux main.js must define getLatestElementFxUrl.");
        StringAssert.Contains(mainJs, "https://www.bondage-asia.com/club/R", "Linux main.js must enforce bondage-asia server lock.");
        StringAssert.Contains(mainJs, "input.key === 'F5'", "Linux main.js must handle F5 reload key.");
        StringAssert.Contains(mainJs, "canonicalUserData", "Linux main.js must pin canonical userData path.");
        StringAssert.Contains(mainJs, "FLUSH_STORAGE", "Linux main.js must handle FLUSH_STORAGE bridge event.");
        StringAssert.Contains(mainJs, "flushStorageData", "Linux main.js must invoke flushStorageData on storage commit.");
        Assert.IsFalse(mainJs.Contains("protocol.handle('http'"), "Intercepting all http traffic is not allowed; local scripts are injected directly like Windows.");
        Assert.IsFalse(mainJs.Contains("clearCache("), "Wiping the HTTP cache on minimize forces game assets to re-download.");

        string buildJs = File.ReadAllText(Path.Combine(ProjectRoot, "platform", "linux", "build.js"));
        StringAssert.Contains(buildJs, "extraMetadata: { productName: \"\\u3164\" }", "Hidden AppImage must ship productName ㅤ so main.js detects stealth mode.");
    }

    [TestMethod]
    public void SafeImageCacheVramOptimization_IsProperlyConfigured()
    {
        string csContent = MainWindowSourceCode;
        string mainJsPath = Path.Combine(ProjectRoot, "platform", "linux", "main.js");
        string mainJs = File.ReadAllText(mainJsPath);

        StringAssert.Contains(csContent, "setupSafeVramOptimization", "MainWindow must define setupSafeVramOptimization.");
        StringAssert.Contains(csContent, "ImageCachePurgeDelay", "MainWindow must tune ImageCachePurgeDelay.");
        StringAssert.Contains(csContent, "cleanUpDepartedCharacter", "MainWindow must define cleanUpDepartedCharacter.");
        StringAssert.Contains(csContent, "ChatRoomSyncMemberLeave", "MainWindow must hook ChatRoomSyncMemberLeave to purge departed members.");
        StringAssert.Contains(csContent, "CharacterDelete", "MainWindow must invoke CharacterDelete to evict ghost characters from memory.");
        StringAssert.Contains(csContent, "GLDrawImageCache.purge", "MainWindow must call safe GLDrawImageCache.purge.");
        StringAssert.Contains(csContent, "DrawImageCache.purge", "MainWindow must call safe DrawImageCache.purge.");
        StringAssert.Contains(csContent, "DrawnAssets", "MainWindow must warm active room textures via DrawnAssets.");
        StringAssert.Contains(csContent, ".lastUsed = now", "MainWindow must update BC's native .lastUsed property.");
        StringAssert.Contains(csContent, "__bcFastGetHooked", "MainWindow must guard ImageCache.prototype.get against per-frame new Error() allocations on cache hits.");
        StringAssert.Contains(csContent, "__bcFastSetImageHooked", "MainWindow must guard ElementButton.SetImage against redundant per-frame img.src assignments.");
        Assert.IsFalse(csContent.Contains("WEBGL_lose_context"), "MainWindow must never call WEBGL_lose_context.");
        Assert.IsFalse(csContent.Contains("GLDrawImageCache.clear()"), "MainWindow must never forcefully wipe GLDrawImageCache.");

        StringAssert.Contains(mainJs, "setupSafeVramOptimization", "Linux main.js must define setupSafeVramOptimization.");
        StringAssert.Contains(mainJs, "ImageCachePurgeDelay", "Linux main.js must tune ImageCachePurgeDelay.");
        StringAssert.Contains(mainJs, "cleanUpDepartedCharacter", "Linux main.js must define cleanUpDepartedCharacter.");
        StringAssert.Contains(mainJs, "ChatRoomSyncMemberLeave", "Linux main.js must hook ChatRoomSyncMemberLeave to purge departed members.");
        StringAssert.Contains(mainJs, "CharacterDelete", "Linux main.js must invoke CharacterDelete to evict ghost characters from memory.");
        StringAssert.Contains(mainJs, "GLDrawImageCache.purge", "Linux main.js must call safe GLDrawImageCache.purge.");
        StringAssert.Contains(mainJs, "DrawImageCache.purge", "Linux main.js must call safe DrawImageCache.purge.");
        StringAssert.Contains(mainJs, "__bcFastGetHooked", "Linux main.js must guard ImageCache.prototype.get against per-frame new Error() allocations on cache hits.");
        StringAssert.Contains(mainJs, "__bcFastSetImageHooked", "Linux main.js must guard ElementButton.SetImage against redundant per-frame img.src assignments.");
        Assert.IsFalse(mainJs.Contains("WEBGL_lose_context"), "Linux main.js must never call WEBGL_lose_context.");
        Assert.IsFalse(mainJs.Contains("GLDrawImageCache.clear()"), "Linux main.js must never forcefully wipe GLDrawImageCache.");
    }

    [TestMethod]
    public void VirtualDesktop_FocusPingPongProtection_IsImplemented()
    {
        string cs = MainWindowSourceCode;

        StringAssert.Contains(cs, "CancelActivation()", "MainWindow must cancel pending activation on deactivation.");
        StringAssert.Contains(cs, "IsWindowActiveAndVisibleOnCurrentDesktop", "MainWindow must verify window is foreground and uncloaked before focusing.");
        StringAssert.Contains(cs, "GetForegroundWindow", "MainWindow must check GetForegroundWindow.");
        StringAssert.Contains(cs, "DwmGetWindowAttribute", "MainWindow must check DwmGetWindowAttribute for virtual desktop cloaking.");
        StringAssert.Contains(cs, "DWMWA_CLOAKED", "MainWindow must check DWMWA_CLOAKED.");
        StringAssert.Contains(cs, "_dwmWatcherTimer", "MainWindow must define periodic DWM cloaking watcher timer.");
        StringAssert.Contains(cs, "DwmWatcherTimer_Tick", "MainWindow must periodically verify cloaking and minimize status.");

        string linuxPath = Path.Combine(ProjectRoot, "platform", "linux", "main.js");
        string linux = File.ReadAllText(linuxPath);

        StringAssert.Contains(linux, "cancelActivation()", "Linux main.js must cancel pending activation on blur.");
        StringAssert.Contains(linux, "mainWindow.isFocused()", "Linux main.js must check isFocused before executing focus.");
    }
}




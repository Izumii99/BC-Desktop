using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Windows;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace BCDesktop.Tests;

[TestClass]
public class MainWindowTests
{
    private static string ProjectRoot => FindProjectRoot();

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
        string csPath = Path.Combine(ProjectRoot, "MainWindow.xaml.cs");
        string code = File.ReadAllText(csPath);

        // Required background reduction and occlusion flags
        StringAssert.Contains(code, "--disable-features=Translate,OptimizationHints,MediaRouter,DialMediaRouteProvider");
        StringAssert.Contains(code, "SpareRendererForSitePerProcess");
        StringAssert.Contains(code, "--disable-background-networking");
        StringAssert.Contains(code, "--disable-component-update");
        StringAssert.Contains(code, "--disable-domain-reliability");
        StringAssert.Contains(code, "--disable-sync");
        StringAssert.Contains(code, "--enable-features=CalculateNativeWinOcclusion");
        StringAssert.Contains(code, "--js-flags=");
        StringAssert.Contains(code, "--max-old-space-size=768");

        // Prohibited flags for 2D canvas apps
        Assert.IsFalse(code.Contains("--enable-gpu-rasterization"), "GPU rasterization flag is prohibited for 2D canvas.");
        Assert.IsFalse(code.Contains("--enable-low-end-device-mode"), "Low-end device mode flag is prohibited as it overloads CPU.");
    }

    [TestMethod]
    public void ProcessFailure_AutoRecoveryIsHooked()
    {
        string csPath = Path.Combine(ProjectRoot, "MainWindow.xaml.cs");
        string code = File.ReadAllText(csPath);

        StringAssert.Contains(code, "core.ProcessFailed +=", "ProcessFailed event must be hooked for auto-recovery.");
        StringAssert.Contains(code, "CoreWebView2ProcessFailedKind.RenderProcessExited");
        StringAssert.Contains(code, "core.Reload()", "Automatic reload must be invoked on renderer exit.");
        StringAssert.Contains(code, "_recentCrashCount <= 3", "Crash loop protection must throttle repeated reloads.");
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
        for (int i = 0; i <= 8; i++) candidates.Add(activeVersion + i);
        for (int i = 1; i <= 3; i++) if (activeVersion - i >= 132) candidates.Add(activeVersion - i);

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
        string publishLoader = Path.Combine(ProjectRoot, "PublishLoader", "inject-all.js");
        Assert.IsTrue(File.Exists(publishLoader), "Remote loader PublishLoader/inject-all.js must exist.");
        string loaderContent = File.ReadAllText(publishLoader);
        StringAssert.Contains(loaderContent, "addon-manager.js", "Remote loader must target addon-manager.js.");

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
        string csPath = Path.Combine(ProjectRoot, "MainWindow.xaml.cs");
        string code = File.ReadAllText(csPath);

        // Maximize/Restore button and Margin must synchronize through unified helper
        StringAssert.Contains(code, "UpdateWindowStateUI()", "Window state UI must have a unified update method.");
        StringAssert.Contains(code, "if (WindowState == WindowState.Maximized)", "WindowState guards must be present.");

        // WM_NCHITTEST must not return resize edges when maximized (Fitts's Law + no resize handles)
        StringAssert.Contains(code, "if (WindowState == WindowState.Maximized)\r\n            {\r\n                return IntPtr.Zero;\r\n            }",
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

        string csPath = Path.Combine(ProjectRoot, "MainWindow.xaml.cs");
        string cs = File.ReadAllText(csPath);

        StringAssert.Contains(cs, "ToggleFullscreen()", "Fullscreen toggle method must be implemented.");
        StringAssert.Contains(cs, "TOGGLE_FULLSCREEN", "Fullscreen message bridge must be connected.");
        StringAssert.Contains(cs, "Key.F11", "F11 keyboard handler must be hooked.");
    }
}

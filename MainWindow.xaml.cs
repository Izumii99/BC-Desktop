#pragma warning disable S108, S2486, S3168, S2333
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Threading;
using Microsoft.Web.WebView2.Core;

namespace BCDesktop;

public partial class MainWindow : Window // NOSONAR
{
    private readonly string _originalTitleLabel;
    private CancellationTokenSource? _deactivationCts;
    private CancellationTokenSource? _activationCts;
    private bool _isSuspending;
    private bool _wantsResume;
    private bool _wasMinimized;
    private int _recentCrashCount;
    private DateTime _lastCrashTime = DateTime.MinValue;

    private DispatcherTimer? _dwmWatcherTimer;
    private int _lastThrottleState; // 1: Active, 2: Background, 3: Cloaked/Minimized
    private DateTime _unfocusedStartTime = DateTime.MinValue;
    private string _resolvedUrl = FallbackUrl;

    public MainWindow() : this(initializeWebView: true)
    {
    }

    internal MainWindow(bool initializeWebView)
    {
        InitializeComponent();
        _originalTitleLabel = TitleLabel.Text;
        if (string.IsNullOrEmpty(_originalTitleLabel))
        {
            if (VersionBadge != null)
            {
                VersionBadge.Visibility = Visibility.Collapsed;
            }
        }
        else
        {
            if (VersionBadgeText != null)
            {
                VersionBadgeText.Text = $"v{CurrentAppVersion}";
            }
        }
        StateChanged += OnWindowStateChanged;
        Activated += MainWindow_Activated;
        Deactivated += MainWindow_Deactivated;
        StartDwmWatcherTimer();
        if (initializeWebView)
        {
            _ = InitWebViewAsync();
        }
    }

    private void StartDwmWatcherTimer()
    {
        _dwmWatcherTimer = new DispatcherTimer(DispatcherPriority.Background)
        {
            Interval = TimeSpan.FromMilliseconds(1500)
        };
        _dwmWatcherTimer.Tick += DwmWatcherTimer_Tick;
        _dwmWatcherTimer.Start();
    }

    private void DwmWatcherTimer_Tick(object? sender, EventArgs e)
    {
        if (WebView.CoreWebView2 is not { } core)
        {
            return;
        }

        bool isCloaked = false;
        var hwnd = new WindowInteropHelper(this).Handle;
        if (hwnd != IntPtr.Zero)
        {
            try
            {
                if (NativeMethods.DwmGetWindowAttribute(hwnd, NativeMethods.DWMWA_CLOAKED, out int cloaked, sizeof(int)) == 0 && cloaked != 0)
                {
                    isCloaked = true;
                }
            }
            catch (Exception)
            {
                // Ignored intentionally: DwmGetWindowAttribute query failed.
            }
        }

        // 1. Minimized murni (taskbar minimize) -> State 3 (Suspend & Low memory)
        if (WindowState == WindowState.Minimized)
        {
            _unfocusedStartTime = DateTime.MinValue;
            if (_lastThrottleState != 3)
            {
                _lastThrottleState = 3;
                core.MemoryUsageTargetLevel = CoreWebView2MemoryUsageTargetLevel.Low;
                _ = core.ExecuteScriptAsync(ScriptHelpers.CapUnfocusedFpsScript);
                _ = core.ExecuteScriptAsync("(()=>{window._bcIsMinimized=true;window._bcIsBackground=true;})()");
                NativeMethods.TrimWorkingSet();
            }
            return;
        }

        // 2. Cloaked (Virtual Desktop 2) atau Tab-Out -> State 2 (15 FPS Background, game loop & timer TETAP jalan)
        bool isForeground = IsWindowActiveAndVisibleOnCurrentDesktop() && !isCloaked;

        if (isForeground)
        {
            _unfocusedStartTime = DateTime.MinValue;
            if (_lastThrottleState != 1)
            {
                _lastThrottleState = 1;
                core.MemoryUsageTargetLevel = CoreWebView2MemoryUsageTargetLevel.Normal;
                _ = core.ExecuteScriptAsync(ScriptHelpers.RestoreUnfocusedFpsScript);
            }
        }
        else
        {
            if (isCloaked || (_unfocusedStartTime != DateTime.MinValue && (DateTime.UtcNow - _unfocusedStartTime).TotalSeconds >= 3))
            {
                if (_lastThrottleState != 2)
                {
                    _lastThrottleState = 2;
                    core.MemoryUsageTargetLevel = CoreWebView2MemoryUsageTargetLevel.Low;
                    _ = core.ExecuteScriptAsync("(()=>{window._bcIsMinimized=false;window._bcIsBackground=true;})()");
                    _ = core.ExecuteScriptAsync(ScriptHelpers.CapUnfocusedFpsScript);
                    NativeMethods.TrimWorkingSet();
                }
            }
            else if (_unfocusedStartTime == DateTime.MinValue)
            {
                _unfocusedStartTime = DateTime.UtcNow;
            }
        }
    }

    private void CancelActivation()
    {
        if (_activationCts is { } cts)
        {
            _activationCts = null;
            cts.Cancel();
            cts.Dispose();
        }
    }

    private void CancelDeactivation()
    {
        if (_deactivationCts is { } cts)
        {
            _deactivationCts = null;
            cts.Cancel();
            cts.Dispose();
        }
    }

    protected override void OnSourceInitialized(EventArgs e)
    {
        base.OnSourceInitialized(e);
        HwndSource.FromHwnd(new WindowInteropHelper(this).Handle)
                  .AddHook(WndProc);

        WindowState = WindowState.Maximized;
        UpdateWindowStateUI();
    }

    protected override void OnClosing(System.ComponentModel.CancelEventArgs e)
    {
        var result = MessageBox.Show(
            "Leave Bondage Club?\nChanges you made may not be saved.",
            "Leave site?",
            MessageBoxButton.OKCancel,
            MessageBoxImage.Question,
            MessageBoxResult.Cancel);

        if (result != MessageBoxResult.OK)
        {
            e.Cancel = true;
            return;
        }

        CancelDeactivation();
        try
        {
            WebView?.Dispose();
        }
        catch (Exception)
        {
            // Ignored intentionally: WebView2 disposal during window teardown.
        }
        base.OnClosing(e);
    }

    private async Task InitWebViewAsync()
    {
        var urlTask = DetectLatestUrlAsync();
        _ = CheckForAppUpdatesAsync();
        CheckPostUpdateChangelog();

        string userDataFolder = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "BCClient", "WebView2Data");

        try
        {
            string crashReportsDir = Path.Combine(userDataFolder, "EBWebView", "Crashpad", "reports");
            if (Directory.Exists(crashReportsDir))
            {
                foreach (var file in Directory.GetFiles(crashReportsDir, "*.dmp"))
                {
                    File.Delete(file);
                }
            }
        }
        catch (Exception)
        {
            // Ignored intentionally: crash reports directory cleanup.
        }

        try
        {
            var options = new CoreWebView2EnvironmentOptions
            {
                AdditionalBrowserArguments =
                    "--disable-features=Translate,OptimizationHints,MediaRouter,DialMediaRouteProvider,SpareRendererForSitePerProcess,AudioServiceOutOfProcess,AutofillServerCommunication " +
                    "--disable-component-update " +
                    "--disable-domain-reliability " +
                    "--disable-sync " +
                    "--disable-notifications " +
                    "--disable-site-isolation-trials " +
                    "--disable-background-networking " +
                    "--no-pings " +
                    "--disable-background-timer-throttling " +
                    "--disable-backgrounding-occluded-windows " +
                    "--force-gpu-mem-available-mb=512 " +
                    "--force-gpu-mem-discardable-limit-mb=128 " +
                    "--gpu-rasterization-msaa-sample-count=0 " +
                    "--max-gum-fps=60 " +
                    "--js-flags=\"--max-old-space-size=1536 --expose-gc\""
            };

            var env = await CoreWebView2Environment.CreateAsync(
                browserExecutableFolder: null,
                userDataFolder: userDataFolder,
                options: options);

            _resolvedUrl = await urlTask;
            await WebView.EnsureCoreWebView2Async(env);
        }
        catch (Exception ex)
        {
            var res = MessageBox.Show(
                $"Microsoft Edge WebView2 Runtime is required but could not be initialized:\n\n{ex.Message}\n\nWould you like to open the official download page?",
                "WebView2 Runtime Required",
                MessageBoxButton.YesNo,
                MessageBoxImage.Warning);

            if (res == MessageBoxResult.Yes)
            {
                try
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = "https://go.microsoft.com/fwlink/p/?LinkId=2124703",
                        UseShellExecute = true
                    });
                }
                catch (Exception)
                {
                    // Ignored intentionally: opening external browser download link failed.
                }
            }
        }
    }

    private async void WebView_Initialized(object sender, CoreWebView2InitializationCompletedEventArgs e)
    {
        if (!e.IsSuccess)
        {
            MessageBox.Show($"WebView2 failed to initialise:\n{e.InitializationException?.Message}",
                "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            return;
        }

        var core = WebView.CoreWebView2;

        core.Settings.AreDefaultContextMenusEnabled = false;
        core.Settings.IsStatusBarEnabled            = false;
        core.Settings.IsZoomControlEnabled          = false;
        core.Settings.IsPinchZoomEnabled            = false;
        core.Settings.IsSwipeNavigationEnabled      = false;
        core.Settings.IsGeneralAutofillEnabled      = false;
        core.Settings.IsPasswordAutosaveEnabled     = false;

        core.DocumentTitleChanged += Core_DocumentTitleChanged;
        core.ProcessFailed += (_, args) =>
        {
            if (args.ProcessFailedKind == CoreWebView2ProcessFailedKind.RenderProcessExited ||
                args.ProcessFailedKind == CoreWebView2ProcessFailedKind.RenderProcessUnresponsive)
            {
                var now = DateTime.UtcNow;
                if ((now - _lastCrashTime).TotalSeconds < 30)
                {
                    _recentCrashCount++;
                }
                else
                {
                    _recentCrashCount = 1;
                }
                _lastCrashTime = now;

                if (_recentCrashCount <= 3)
                {
                    core.Reload();
                }
            }
        };
        core.PermissionRequested += (_, args) =>
        {
            if (args.PermissionKind == CoreWebView2PermissionKind.ClipboardRead)
            {
                args.State = CoreWebView2PermissionState.Allow;
            }
        };
        core.NewWindowRequested += (_, args) =>
        {
            args.Handled = true;
            if (!string.IsNullOrEmpty(args.Uri) && (args.Uri.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || args.Uri.StartsWith("https://", StringComparison.OrdinalIgnoreCase)))
            {
                try
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = args.Uri,
                        UseShellExecute = true
                    });
                }
                catch (Exception)
                {
                    // Ignored intentionally: opening external popup link in default browser failed.
                }
            }
        };

        core.WebMessageReceived += (_, args) =>
        {
            HandleWebMessage(args.WebMessageAsJson);
        };

        core.NavigationCompleted += async (_, args) =>
        {
            if (args.HttpStatusCode == 404 && core.Source != FallbackUrl)
            {
                core.Navigate(FallbackUrl);
                return;
            }

            if (args.IsSuccess)
            {
                await core.ExecuteScriptAsync(ScriptHelpers.GetCopyAndOptimizationScript());
#pragma warning disable CS4014
                Task.Run(async () =>
                {
                    await Task.Delay(5000);
                    NativeMethods.TrimWorkingSet();
                });
#pragma warning restore CS4014
            }
        };

        // ponytail: Native WebView2 early guard against undefined pidx ReferenceError and background focus state.
        // Do NOT define accessor properties on DrawProcess or CharacterAppearanceBuildCanvas here, because BC's
        // classic <script> function declarations overwrite configurable global accessors during page load.
        await core.AddScriptToExecuteOnDocumentCreatedAsync(@"
            if(typeof window.pidx==='undefined'){try{Object.defineProperty(window,'pidx',{get:()=>0,set:()=>{},configurable:true});}catch(e){}}
            if(!document.__bcOrigHasFocus&&typeof document.hasFocus==='function'){
                document.__bcOrigHasFocus=document.hasFocus;
                document.hasFocus=function(){if(window._bcIsBackground)return false;return document.__bcOrigHasFocus.apply(this,arguments);};
            }
        ");

        string scriptsDir = Path.Combine(AppContext.BaseDirectory, "Scripts");
        bool hasLocalScripts = Directory.Exists(scriptsDir) && Directory.EnumerateFiles(scriptsDir, "*.js").Any();

        if (hasLocalScripts)
        {
            // 🧪 Tester / Local Dev Mode: Prioritize local scripts from Scripts/ folder and bypass remote loader
            foreach (var file in Directory.GetFiles(scriptsDir, "*.js"))
            {
                string script = await File.ReadAllTextAsync(file);
                await core.AddScriptToExecuteOnDocumentCreatedAsync(script);
            }
        }
        else
        {
            // 🚀 Single-File Standalone Release Mode: Inject embedded remote loader
            string builtInLoader = ScriptHelpers.GetBuiltInLoaderScript();
            if (!string.IsNullOrWhiteSpace(builtInLoader))
            {
                await core.AddScriptToExecuteOnDocumentCreatedAsync(builtInLoader);
            }
        }

        WebView.DefaultBackgroundColor = System.Drawing.Color.FromArgb(255, 13, 13, 13);

        core.Navigate(_resolvedUrl);
    }

    private void HandleWebMessage(string? rawJson)
    {
        try
        {
            string? msg = null;
            if (rawJson != null && rawJson.StartsWith("\"") && rawJson.EndsWith("\""))
            {
                msg = System.Text.Json.JsonSerializer.Deserialize<string>(rawJson);
            }

            if (msg != null && msg.StartsWith("COPY_TEXT:"))
            {
                string textToCopy = msg.Substring(10);
                _ = Application.Current.Dispatcher.InvokeAsync(async () =>
                {
                    await CopyTextToClipboardAsync(textToCopy);
                });
            }
            else if (msg == "TOGGLE_FULLSCREEN")
            {
                _ = Application.Current.Dispatcher.InvokeAsync(ToggleFullscreen);
            }
        }
        catch (Exception)
        {
            // Ignored intentionally: handling incoming web message payload.
        }
    }

    private async Task CopyTextToClipboardAsync(string textToCopy)
    {
        IntPtr hwnd = new WindowInteropHelper(this).Handle;
        for (int i = 0; i < 10; i++)
        {
            try
            {
                if (NativeMethods.OpenClipboard(hwnd))
                {
                    NativeMethods.EmptyClipboard();
                    int bytes = (textToCopy.Length + 1) * 2;
                    IntPtr hGlobal = NativeMethods.GlobalAlloc(0x0042, (UIntPtr)bytes); // GMEM_MOVEABLE | GMEM_ZEROINIT
                    try
                    {
                        if (hGlobal != IntPtr.Zero)
                        {
                            IntPtr target = NativeMethods.GlobalLock(hGlobal);
                            if (target != IntPtr.Zero)
                            {
                                Marshal.Copy(textToCopy.ToCharArray(), 0, target, textToCopy.Length);
                                NativeMethods.GlobalUnlock(hGlobal);
                                NativeMethods.SetClipboardData(13, hGlobal); // CF_UNICODETEXT
                                hGlobal = IntPtr.Zero; // Clipboard owns it now
                            }
                        }
                    }
                    finally
                    {
                        if (hGlobal != IntPtr.Zero)
                        {
                            NativeMethods.GlobalFree(hGlobal);
                        }
                        NativeMethods.CloseClipboard();
                    }
                    break;
                }
            }
            catch (Exception)
            {
                // Ignored intentionally: Win32 clipboard access retry.
            }

            await Task.Delay(50);
        }
    }

    internal const string CapUnfocusedFpsScript = ScriptHelpers.CapUnfocusedFpsScript;
    internal const string RestoreUnfocusedFpsScript = ScriptHelpers.RestoreUnfocusedFpsScript;
    internal static string GetBuiltInLoaderScript() => ScriptHelpers.GetBuiltInLoaderScript();
    internal static string GetCopyAndOptimizationScript() => ScriptHelpers.GetCopyAndOptimizationScript();
    internal static void TrimWorkingSet() => NativeMethods.TrimWorkingSet();
}

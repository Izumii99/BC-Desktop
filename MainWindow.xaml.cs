using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shell;
using Microsoft.Web.WebView2.Core;

namespace BCDesktop;

public partial class MainWindow : Window
{
    private static string _lastKnownGoodUrl = "https://www.bondage-asia.com/club/R132/";
    private static string FallbackUrl => _lastKnownGoodUrl;
    private const string VersionApiBase = "https://www.bondage-asia.com/";


    private string _originalTitleLabel;
    private CancellationTokenSource? _deactivationCts;
    private int _recentCrashCount;
    private DateTime _lastCrashTime = DateTime.MinValue;

    // In-memory only: the game persists GraphicsSettings solely when leaving the Preference screen, which is skipped here.
    internal const string CapUnfocusedFpsScript =
        "(()=>{const g=window.Player&&Player.GraphicsSettings;if(g&&!g.MaxUnfocusedFPS&&window.CurrentScreen!=='Preference'){g.MaxUnfocusedFPS=15;window.bcFpsCap=g;}})()";
    internal const string RestoreUnfocusedFpsScript =
        "(()=>{const g=window.bcFpsCap;if(g){if(g.MaxUnfocusedFPS===15)g.MaxUnfocusedFPS=0;window.bcFpsCap=null;}})()";

    private void CancelDeactivation()
    {
        if (_deactivationCts is { } cts)
        {
            _deactivationCts = null;
            cts.Cancel();
            cts.Dispose();
        }
    }

    private static void TrimWorkingSet()
    {
        try
        {
            SetProcessWorkingSetSize(GetCurrentProcess(), (IntPtr)(-1), (IntPtr)(-1));
        }
        catch
        {
        }
    }

    public MainWindow() : this(initializeWebView: true)
    {
    }

    internal MainWindow(bool initializeWebView)
    {
        InitializeComponent();
        _originalTitleLabel = TitleLabel.Text;
        StateChanged += OnWindowStateChanged;
        Activated += MainWindow_Activated;
        Deactivated += MainWindow_Deactivated;
        if (initializeWebView)
        {
            InitWebViewAsync();
        }
    }

    private async void MainWindow_Deactivated(object? sender, EventArgs e)
    {
        CancelDeactivation();
        var cts = new CancellationTokenSource();
        _deactivationCts = cts;
        var token = cts.Token;

        try
        {
            await Task.Delay(3000, token);
            if (!token.IsCancellationRequested && WindowState != WindowState.Minimized && WebView.CoreWebView2 is { } core)
            {
                core.MemoryUsageTargetLevel = CoreWebView2MemoryUsageTargetLevel.Low;
                _ = core.ExecuteScriptAsync(CapUnfocusedFpsScript);
                TrimWorkingSet();
            }
        }
        catch (OperationCanceledException)
        {
        }
    }

    private async void MainWindow_Activated(object? sender, EventArgs e)
    {
        CancelDeactivation();

        if (WebView.CoreWebView2 is { } core)
        {
            core.MemoryUsageTargetLevel = CoreWebView2MemoryUsageTargetLevel.Normal;
            _ = core.ExecuteScriptAsync(RestoreUnfocusedFpsScript);
        }

        await Task.Delay(100);
        WebView.Focus();
        if (WebView.CoreWebView2 != null)
        {
                string smartFocusScript = @"
                    (function() {
                        if (window.bcLogDebug) window.bcLogDebug('ACTIVATED');
                        if (window.bcRunFocusCrawler) {
                            let bestInput = window.bcRunFocusCrawler();
                            if (bestInput) {
                                if (window.bcLogDebug) window.bcLogDebug('=> Hybrid focus: ' + bestInput.tagName + '#' + bestInput.id);
                                bestInput.focus();
                            }
                        }
                    })();
                ";
            _ = WebView.CoreWebView2.ExecuteScriptAsync(smartFocusScript);
        }
    }

    private bool _isFullscreen;
    private WindowState _previousWindowState = WindowState.Normal;

    private void ToggleFullscreen()
    {
        _isFullscreen = !_isFullscreen;
        if (_isFullscreen)
        {
            _previousWindowState = WindowState;
            TitleBarRow.Height = new GridLength(0);
            TitleBarGrid.Visibility = Visibility.Collapsed;
            if (WindowState != WindowState.Maximized)
            {
                WindowState = WindowState.Maximized;
            }
            WebView.Margin = new Thickness(0);
            if (WindowBorder != null) WindowBorder.BorderThickness = new Thickness(0);
        }
        else
        {
            TitleBarRow.Height = new GridLength(32);
            TitleBarGrid.Visibility = Visibility.Visible;
            WindowState = _previousWindowState;
            UpdateWindowStateUI();
        }
    }

    internal void UpdateWindowStateUI()
    {
        if (_isFullscreen) return;

        if (WindowState == WindowState.Maximized)
        {
            MaxRestoreBtn.Content = "\uE923";
            MaxRestoreBtn.ToolTip = "Restore";
            WebView.Margin = new Thickness(0);
            if (WindowBorder != null) WindowBorder.BorderThickness = new Thickness(0);
        }
        else if (WindowState == WindowState.Normal)
        {
            MaxRestoreBtn.Content = "\uE922";
            MaxRestoreBtn.ToolTip = "Maximize";
            WebView.Margin = new Thickness(5, 0, 5, 5);
            if (WindowBorder != null) WindowBorder.BorderThickness = new Thickness(1);
        }
    }

    private async void OnWindowStateChanged(object? sender, EventArgs e)
    {
        UpdateWindowStateUI();

        if (WebView.CoreWebView2 is not { } core) return;

        try
        {
            if (WindowState == WindowState.Minimized)
            {
                CancelDeactivation();
                core.MemoryUsageTargetLevel = CoreWebView2MemoryUsageTargetLevel.Low;
                await core.TrySuspendAsync();
                TrimWorkingSet();
            }
            else
            {
                core.Resume();
                core.MemoryUsageTargetLevel = CoreWebView2MemoryUsageTargetLevel.Normal;
                await Task.Delay(100);
                WebView.Focus();
                string smartFocusScript = @"
                    (function() {
                        if (window.bcLogDebug) window.bcLogDebug('ACTIVATED');
                        if (window.bcRunFocusCrawler) {
                            let bestInput = window.bcRunFocusCrawler();
                            if (bestInput) {
                                if (window.bcLogDebug) window.bcLogDebug('=> Hybrid focus: ' + bestInput.tagName + '#' + bestInput.id);
                                bestInput.focus();
                            }
                        }
                    })();
                ";
                _ = core.ExecuteScriptAsync(smartFocusScript);
            }
        }
        catch
        {
        }
    }

    private static async Task<bool> IsVersionLiveAsync(HttpClient http, int version)
    {
        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Head, $"https://www.bondage-asia.com/club/R{version}/");
            using var res = await http.SendAsync(req);
            return res.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private static async Task<string> DetectLatestUrlAsync()
    {
        int activeVersion = 132;
        
        string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        string versionFile = Path.Combine(localAppData, "BCClient", "version.txt");
        
        if (File.Exists(versionFile) && int.TryParse(File.ReadAllText(versionFile), out int savedVersion))
        {
            if (savedVersion >= 132 && savedVersion < 500)
            {
                activeVersion = savedVersion;
            }
        }

        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(4) };
            http.DefaultRequestHeaders.UserAgent.ParseAdd(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

            // 1. Always probe upcoming and nearby versions directly against the server.
            // This guarantees the game auto-updates even if GitGud CHANGELOG is never updated, delayed, or unreachable.
            var candidates = new HashSet<int>();
            for (int i = 0; i <= 8; i++)
            {
                candidates.Add(activeVersion + i);
            }
            for (int i = 1; i <= 3; i++)
            {
                if (activeVersion - i >= 132) candidates.Add(activeVersion - i);
            }

            // Optional bonus: read GitGud CHANGELOG to fast-forward any large multi-version jumps
            try
            {
                var response = await http.GetAsync(
                    "https://gitgud.io/BondageProjects/Bondage-College/-/raw/master/BondageClub/CHANGELOG.md",
                    HttpCompletionOption.ResponseHeadersRead);

                if (response.IsSuccessStatusCode)
                {
                    using var stream = await response.Content.ReadAsStreamAsync();
                    using var reader = new StreamReader(stream);
                    string? line;
                    int lineCount = 0;
                    while ((line = await reader.ReadLineAsync()) != null && lineCount < 100)
                    {
                        lineCount++;
                        var match = Regex.Match(line, @"^## \[R(\d+)\]");
                        if (match.Success && int.TryParse(match.Groups[1].Value, out int ver))
                        {
                            if (ver >= 132 && ver < 500)
                            {
                                candidates.Add(ver);
                            }
                        }
                    }
                }
            }
            catch { }

            // 2. Probe all candidates concurrently in parallel (~100ms total)
            var probeTasks = candidates.Select(async v => (Version: v, IsLive: await IsVersionLiveAsync(http, v)));
            var probeResults = await Task.WhenAll(probeTasks);

            // 3. Select the HIGHEST confirmed live release
            int bestLiveVersion = probeResults
                .Where(r => r.IsLive)
                .OrderByDescending(r => r.Version)
                .Select(r => r.Version)
                .FirstOrDefault();

            if (bestLiveVersion > 0)
            {
                activeVersion = bestLiveVersion;
                _lastKnownGoodUrl = $"https://www.bondage-asia.com/club/R{activeVersion}/";
                try 
                { 
                    Directory.CreateDirectory(Path.GetDirectoryName(versionFile)!); 
                    File.WriteAllText(versionFile, activeVersion.ToString()); 
                } 
                catch { }
            }
        }
        catch { }

        _lastKnownGoodUrl = $"https://www.bondage-asia.com/club/R{activeVersion}/";
        return _lastKnownGoodUrl;
    }

    internal const string CurrentAppVersion = "6.1";
    internal const string GitHubRepo = "Izumii99/BC-Desktop";
    private static string? _newReleaseUrl;

    private static readonly string _builtInLoaderScript = LoadBuiltInLoaderScript();

    internal static string GetBuiltInLoaderScript() => _builtInLoaderScript;

    private static string LoadBuiltInLoaderScript()
    {
        try
        {
            using var stream = typeof(MainWindow).Assembly.GetManifestResourceStream("BuiltInLoader.js");
            if (stream == null) return string.Empty;
            using var reader = new StreamReader(stream);
            return reader.ReadToEnd();
        }
        catch
        {
            return string.Empty;
        }
    }

    internal static bool IsNewerVersion(string latestTag, string currentVersion)
    {
        if (string.IsNullOrWhiteSpace(latestTag) || string.IsNullOrWhiteSpace(currentVersion))
            return false;

        string cleanLatest = latestTag.Trim().TrimStart('v', 'V');
        string cleanCurrent = currentVersion.Trim().TrimStart('v', 'V');

        if (Version.TryParse(cleanLatest, out var vLatest) && Version.TryParse(cleanCurrent, out var vCurrent))
        {
            return vLatest > vCurrent;
        }

        var latestParts = cleanLatest.Split('.').Select(p => int.TryParse(p, out int n) ? n : 0).ToList();
        var currentParts = cleanCurrent.Split('.').Select(p => int.TryParse(p, out int n) ? n : 0).ToList();
        int maxLen = Math.Max(latestParts.Count, currentParts.Count);
        for (int i = 0; i < maxLen; i++)
        {
            int l = i < latestParts.Count ? latestParts[i] : 0;
            int c = i < currentParts.Count ? currentParts[i] : 0;
            if (l > c) return true;
            if (l < c) return false;
        }
        return false;
    }

    internal async Task CheckForAppUpdatesAsync(HttpClient? httpClient = null)
    {
        if (string.IsNullOrEmpty(_originalTitleLabel)) return;

        try
        {
            using var http = httpClient != null ? null : new HttpClient { Timeout = TimeSpan.FromSeconds(3) };
            var client = httpClient ?? http!;
            if (client.DefaultRequestHeaders.UserAgent.Count == 0)
            {
                client.DefaultRequestHeaders.UserAgent.ParseAdd("BC-Desktop-Client");
            }

            using var res = await client.GetAsync($"https://api.github.com/repos/{GitHubRepo}/releases/latest");
            if (!res.IsSuccessStatusCode) return;

            using var stream = await res.Content.ReadAsStreamAsync();
            using var doc = await System.Text.Json.JsonDocument.ParseAsync(stream);

            if (doc.RootElement.TryGetProperty("tag_name", out var tagElem))
            {
                string? tag = tagElem.GetString();
                if (!string.IsNullOrEmpty(tag) && IsNewerVersion(tag, CurrentAppVersion))
                {
                    string htmlUrl = doc.RootElement.TryGetProperty("html_url", out var urlElem)
                        ? (urlElem.GetString() ?? $"https://github.com/{GitHubRepo}/releases/latest")
                        : $"https://github.com/{GitHubRepo}/releases/latest";

                    Action applyUi = () =>
                    {
                        if (string.IsNullOrEmpty(_originalTitleLabel)) return;
                        _newReleaseUrl = htmlUrl;
                        TitleLabel.ToolTip = $"New desktop release available: {tag}\nClick to view release notes";
                        TitleLabel.Cursor = Cursors.Hand;
                        if (UpdateBadge != null && UpdateBadgeText != null)
                        {
                            UpdateBadgeText.Text = $"Update {tag}";
                            UpdateBadge.ToolTip = $"New desktop release available: {tag}\nClick to view release notes";
                            UpdateBadge.Visibility = Visibility.Visible;
                        }
                    };

                    if (Dispatcher.CheckAccess())
                    {
                        applyUi();
                    }
                    else
                    {
                        await Dispatcher.InvokeAsync(applyUi);
                    }
                }
            }
        }
        catch
        {
            // Non-blocking fire-and-forget: network errors must never disturb app startup
        }
    }

    private void TitleLabel_MouseLeftButtonUp(object sender, MouseButtonEventArgs e)
    {
        if (!string.IsNullOrEmpty(_newReleaseUrl))
        {
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = _newReleaseUrl,
                    UseShellExecute = true
                });
            }
            catch { }
        }
    }

    private async void InitWebViewAsync()
    {
        var urlTask = DetectLatestUrlAsync();
        _ = CheckForAppUpdatesAsync();

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
        catch { }

        try
        {
            var options = new CoreWebView2EnvironmentOptions
            {
                AdditionalBrowserArguments =
                    "--disable-features=Translate,OptimizationHints,MediaRouter,DialMediaRouteProvider,SpareRendererForSitePerProcess " +
                    "--disable-background-networking " +
                    "--disable-component-update " +
                    "--disable-domain-reliability " +
                    "--disable-sync " +
                    "--enable-features=CalculateNativeWinOcclusion " +
                    "--js-flags=\"--max-old-space-size=768\""
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
                catch { }
            }
        }
    }

    private string _resolvedUrl = FallbackUrl;

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
        core.ProcessFailed += (s, args) =>
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
        core.PermissionRequested += (s, args) =>
        {
            if (args.PermissionKind == CoreWebView2PermissionKind.ClipboardRead)
            {
                args.State = CoreWebView2PermissionState.Allow;
            }
        };

        core.WebMessageReceived += (s, args) =>
        {
            try
            {
                string? rawJson = args.WebMessageAsJson;

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
                        IntPtr hwnd = new WindowInteropHelper(this).Handle;
                        for (int i = 0; i < 10; i++)
                        {
                            try
                            {
                                if (OpenClipboard(hwnd))
                                {
                                    EmptyClipboard();
                                    IntPtr hGlobal = IntPtr.Zero;
                                    try
                                    {
                                        int bytes = (textToCopy.Length + 1) * 2;
                                        hGlobal = GlobalAlloc(0x0042, (UIntPtr)bytes); // GMEM_MOVEABLE | GMEM_ZEROINIT
                                        if (hGlobal != IntPtr.Zero)
                                        {
                                            IntPtr target = GlobalLock(hGlobal);
                                            if (target != IntPtr.Zero)
                                            {
                                                Marshal.Copy(textToCopy.ToCharArray(), 0, target, textToCopy.Length);
                                                GlobalUnlock(hGlobal);
                                                SetClipboardData(13, hGlobal); // CF_UNICODETEXT
                                                hGlobal = IntPtr.Zero; // Clipboard owns it now
                                            }
                                        }
                                    }
                                    finally
                                    {
                                        if (hGlobal != IntPtr.Zero) GlobalFree(hGlobal);
                                        CloseClipboard();
                                    }
                                    break;
                                }
                            }
                            catch { }
                            
                            await Task.Delay(50);
                        }
                    });
                }
                else if (msg == "TOGGLE_FULLSCREEN")
                {
                    _ = Application.Current.Dispatcher.InvokeAsync(ToggleFullscreen);
                }
            }
            catch { }
        };

        string copyScript = @"
            let origFocus = HTMLElement.prototype.focus;

            function isTextInput(el) {
                if (!el) return false;
                if (el.tagName === 'TEXTAREA' || el.isContentEditable) return true;
                if (el.tagName === 'INPUT') {
                    let type = (el.type || 'text').toLowerCase();
                    return type === 'text' || type === 'search' || type === 'password' || 
                           type === 'email' || type === 'number' || type === 'url' || type === 'tel';
                }
                return false;
            }

            function isInteractive(el) {
                if (!el) return false;
                if (isTextInput(el)) return true;
                let tag = el.tagName;
                return tag === 'INPUT' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'OPTION';
            }

            document.addEventListener('keydown', (e) => {
                if (e.key === 'F11' || e.keyCode === 122) {
                    window.chrome.webview.postMessage('TOGGLE_FULLSCREEN');
                    e.preventDefault();
                    return;
                }

                let isEnter = (e.key === 'Enter' || e.keyCode === 13);
                if (isEnter) {
                    let ic = document.getElementById('InputChat');
                    let active = document.activeElement;
                    let isInsideInputChat = ic && (active === ic || e.target === ic);

                    if (isInsideInputChat) {
                        if (e.shiftKey) {
                            window.bcFocusMemory = ic;
                        }
                    } else if (isInteractive(active) || isInteractive(e.target)) {
                        // User is inside an interactive element (e.g. textarea#DescriptionInput, search input, dropdown, button)
                        // Never intercept or preventDefault: native Enter/Shift+Enter must work untouched!
                        return;
                    } else {
                        // User is OUTSIDE any input, textarea, button, or select (e.g. clicking on canvas or chat log)
                        // Both Enter and Shift+Enter clear selection and pull focus to InputChat if visible!
                        if (ic && (ic.offsetParent !== null || ic.offsetWidth > 0)) {
                            e.preventDefault();

                            try {
                                let sel = window.getSelection ? window.getSelection() : null;
                                if (sel) {
                                    if (sel.removeAllRanges) sel.removeAllRanges();
                                    if (sel.empty) sel.empty();
                                }
                            } catch (err) {}

                            window.bcFocusMemory = ic;
                            origFocus.call(ic);
                            try {
                                let len = ic.value ? ic.value.length : 0;
                                ic.setSelectionRange(len, len);
                            } catch(err) {}
                        }
                    }
                }
                
                if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.code === 'KeyC')) {
                    let text = '';
                    let activeEl = document.activeElement;
                    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
                        try {
                            if (activeEl.selectionStart !== null && activeEl.selectionStart !== undefined) {
                                text = activeEl.value.substring(activeEl.selectionStart, activeEl.selectionEnd);
                            } else {
                                text = activeEl.value;
                            }
                        } catch (err) {
                            text = activeEl.value;
                        }
                    } else {
                        text = window.getSelection().toString();
                    }
                    if (text) {
                        window.chrome.webview.postMessage('COPY_TEXT:' + text);
                        e.preventDefault();
                    }
                }
            }, true);

            function isChatArea(el) {
                if (!el) return false;
                if (el.id === 'InputChat') return true;
                if (el.closest && el.closest('#chat-room-bot, #chat-room-div, #chat-room-main')) return true;
                return false;
            }

            function getAddonContainer(el) {
                if (!el || el === document.body || el === document.documentElement) return null;
                let curr = el;
                while (curr && curr !== document.body && curr !== document.documentElement) {
                    if (curr.id === 'chat-room-bot' || curr.id === 'chat-room-div' || curr.id === 'chat-room-main') return null;
                    if (curr.id === 'InputChat' || curr.id === 'TextAreaChatLog') return null;
                    if (curr.id === 'MainCanvas') return null;
                    
                    let id = (curr.id || '').toLowerCase();
                    let cls = (typeof curr.className === 'string' ? curr.className : '').toLowerCase();
                    
                    // Native BC preference screens, scroll boxes, and inputs are NOT addon containers
                    if (id.startsWith('preference') || cls.includes('preference') || cls.includes('scroll-box')) return null;
                    if (id === 'descriptioninput') return null;

                    if (id.startsWith('lce-') || cls.includes('lce-') ||
                        id.includes('bcx') || cls.includes('bcx') ||
                        id.includes('fusam') || cls.includes('fusam') ||
                        id.includes('bcom') || cls.includes('bcom') ||
                        id.includes('modal') || cls.includes('modal') ||
                        id.includes('dialog') || cls.includes('dialog') ||
                        id.includes('im') || cls.includes('im')) {
                        return curr;
                    }
                    
                    let z = parseInt(window.getComputedStyle(curr).zIndex, 10);
                    let pos = window.getComputedStyle(curr).position;
                    if (!isNaN(z) && z >= 1 && (pos === 'fixed' || pos === 'absolute')) {
                        if (!id.startsWith('preference') && !cls.includes('preference') && !cls.includes('scroll-box')) {
                            return curr;
                        }
                    }
                    curr = curr.parentElement;
                }
                return null;
            }

            document.addEventListener('focusin', (e) => {
                if (isInteractive(e.target)) {
                    window.bcFocusMemory = e.target;
                    if (isChatArea(e.target)) {
                        window.bcUserPrefersGameChat = true;
                    } else {
                        window.bcUserPrefersGameChat = false;
                        window.bcForceUnfocusSearch = false;
                    }
                }
            }, true);
            
            document.addEventListener('mousedown', (e) => {
                window.bcIsMouseDown = true;
                window.bcLastMousedown = e.target;
                window.bcLastMousedownTime = Date.now();
                
                let ic = document.getElementById('InputChat');
                let addonBox = getAddonContainer(e.target);
                
                if (ic && isChatArea(e.target)) {
                    // User explicitly clicked the game chat area: prioritize game chat!
                    window.bcUserPrefersGameChat = true;
                    window.bcFocusMemory = ic;
                    window.bcForceUnfocusSearch = false;
                } else if (addonBox) {
                    // User clicked inside an addon dialog/container: switch preference to addon!
                    window.bcUserPrefersGameChat = false;
                    window.bcForceUnfocusSearch = false;
                    if (isInteractive(e.target)) {
                        window.bcFocusMemory = e.target;
                    } else {
                        // Softly resolve the best text input inside this clicked addon container (e.g. selecting friend in LianChat)
                        setTimeout(() => {
                            if (!window.bcUserPrefersGameChat) {
                                let targetInput = addonBox.querySelector('textarea:not([disabled]):not([readonly]), input[type=text]:not([disabled]):not([readonly]), input[type=search]:not([disabled]):not([readonly]), input:not([type]):not([disabled]):not([readonly])');
                                if (targetInput) {
                                    window.bcFocusMemory = targetInput;
                                    origFocus.call(targetInput);
                                }
                            }
                        }, 40);
                    }
                } else if (isInteractive(e.target)) {
                    window.bcFocusMemory = e.target;
                    window.bcForceUnfocusSearch = false;
                    window.bcUserPrefersGameChat = false;
                } else {
                    window.bcFocusMemory = null;
                    window.bcForceUnfocusSearch = false;
                }
                
                if (ic) window.bcInputChatLastValue = ic.value;
            }, true);

            document.addEventListener('mouseup', (e) => {
                window.bcIsMouseDown = false;
                setTimeout(() => {
                    if (window.bcIsMouseDown) return;
                    let active = document.activeElement;
                    if (active && isInteractive(active)) {
                        window.bcFocusMemory = active;
                        return;
                    }
                    if (window.getSelection().toString().length > 0) return;
                    
                    if (window.bcForceUnfocusSearch) return;

                    // If user clicked inside a DOM scroll box or preference grid or non-chat container, do NOT steal focus!
                    if (e.target && e.target.closest && e.target.closest('.scroll-box, [id^=""preference-""], .preference-settings-grid, select, option')) {
                        return;
                    }
                    
                    let target = (window.bcFocusMemory && isInteractive(window.bcFocusMemory)) 
                        ? window.bcFocusMemory 
                        : (window.bcRunFocusCrawler ? window.bcRunFocusCrawler() : null);
                    if (target && document.activeElement !== target) {
                        origFocus.call(target);
                    }
                }, 50);
            });

            document.addEventListener('selectionchange', () => {
                if (window.bcSelectionTimeout) clearTimeout(window.bcSelectionTimeout);
                window.bcSelectionTimeout = setTimeout(() => {
                    let active = document.activeElement;
                    if (active && isInteractive(active)) return;
                    if (window.getSelection().toString().length > 0) return;
                    if (window.bcForceUnfocusSearch) return;
                    
                    let target = (window.bcFocusMemory && isInteractive(window.bcFocusMemory)) 
                        ? window.bcFocusMemory 
                        : (window.bcRunFocusCrawler ? window.bcRunFocusCrawler() : null);
                    if (target && document.activeElement !== target) {
                        origFocus.call(target);
                    }
                }, 200);
            });
            
            window.bcFocusAndTeleport = function(best) {
                let ic = document.getElementById('InputChat');
                let timeSinceMousedown = Date.now() - (window.bcLastMousedownTime || 0);
                if (ic && timeSinceMousedown < 1500) {
                    let lastVal = window.bcInputChatLastValue || '';
                    if (ic.value.startsWith(lastVal) && ic.value.length > lastVal.length) {
                        let leaked = ic.value.substring(lastVal.length);
                        // Avoid corrupting numeric inputs with non-numeric leaked text
                        if ((best.tagName === 'INPUT' && best.type !== 'number') || best.tagName === 'TEXTAREA') {
                            best.value = (best.value || '') + leaked;
                            try { best.selectionStart = best.value.length; best.selectionEnd = best.value.length; } catch(e) {}
                        } else if (best.isContentEditable) {
                            best.innerText = (best.innerText || '') + leaked;
                        }
                        ic.value = lastVal;
                    }
                }
                origFocus.call(best);
            };

            window.bcRunFocusCrawler = function() {
                function getHighestZ(el) {
                    let max = 0;
                    while (el && el !== document.documentElement) {
                        let z = parseInt(window.getComputedStyle(el).zIndex, 10);
                        if (!isNaN(z) && z > max) max = z;
                        el = el.parentElement;
                    }
                    return max;
                }

                let inputs = document.querySelectorAll('input, textarea, [contenteditable=""true""]');
                let bestInput = null;
                let maxScore = -999999999;
                
                for (let i = 0; i < inputs.length; i++) {
                    let el = inputs[i];
                    if (el.disabled || el.readOnly) continue;
                    if (!isTextInput(el)) continue; // STRICTLY text-typing inputs: exclude checkboxes, radios, buttons, etc.
                    
                    let rect = el.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) continue;
                    
                    let style = window.getComputedStyle(el);
                    if (style.visibility === 'hidden' || style.opacity === '0' || style.display === 'none') continue;
                    
                    let z = getHighestZ(el);
                    let score = z * 1000;
                    
                    if (el.id === 'InputChat' || el.id === 'TextAreaChatLog') score -= 500000;
                    
                    // Prioritize textareas and search/dialog inputs
                    if (el.tagName === 'TEXTAREA') score += 5000;
                    if (el.id && el.id.toLowerCase().indexOf('search') !== -1) score += 2000;
                    
                    if (score > maxScore) { maxScore = score; bestInput = el; }
                }

                // If an active search, menu, or dialog input is open, return it!
                if (bestInput && bestInput.id !== 'InputChat') {
                    return bestInput;
                }

                let ic = document.getElementById('InputChat');
                if (ic && (ic.offsetParent !== null || ic.offsetWidth > 0)) {
                    return ic;
                }

                return null;
            };

            let patchInterval = setInterval(() => {
                if (typeof window.ElementFocus === 'function' && !window.ElementFocus._isHooked) {
                    let origElementFocus = window.ElementFocus;
                    window.ElementFocus = function(ID) {
                        let isLayeringInput = typeof ID === 'string' && ID.startsWith('layering-input-');
                        let targetEl = typeof ID === 'string' ? document.getElementById(ID) : ID;
                        let wasClicked = targetEl && (
                            window.bcLastMousedown === targetEl || 
                            window.bcFocusMemory === targetEl ||
                            (ID === 'InputChat' && window.bcLastMousedown && isChatArea(window.bcLastMousedown))
                        );
                        if (wasClicked) {
                            origElementFocus(ID);
                            return;
                        }

                        if (window.bcIsMouseDown && !isLayeringInput) return;
                        
                        let active = document.activeElement;
                        let isUserInAnotherInput = active && isInteractive(active) && active !== targetEl;

                        // Only prevent background InputChat refocusing from hijacking user away from active inputs/search boxes
                        if (ID === 'InputChat' && isUserInAnotherInput) {
                            return;
                        }

                        if (!isLayeringInput && window.getSelection().toString().length > 0) return;

                        if (targetEl && targetEl !== document.getElementById('InputChat')) {
                            window.bcFocusMemory = targetEl;
                            window.bcUserPrefersGameChat = false;
                        }

                        origElementFocus(ID);
                    };
                    window.ElementFocus._isHooked = true;
                    clearInterval(patchInterval);
                }
            }, 200);

            HTMLElement.prototype.focus = function() {
                try {
                    let isLayeringInput = this.id && this.id.startsWith('layering-input-');

                    // If user explicitly clicked this element or clicked in the chat area, allow focus immediately!
                    let wasClicked = (window.bcFocusMemory === this || 
                                      window.bcLastMousedown === this ||
                                      (this.id === 'InputChat' && window.bcLastMousedown && isChatArea(window.bcLastMousedown)));
                    if (wasClicked) {
                        origFocus.call(this);
                        return;
                    }

                    if (window.bcIsMouseDown && !isLayeringInput) return;

                    // Anti-steal: when layering input is active, block all programmatic focus shifts to other elements
                    let currentActive = document.activeElement;
                    let currentIsLayering = currentActive && currentActive.id && currentActive.id.startsWith('layering-input-');
                    if (currentIsLayering && !isLayeringInput) return;

                    let active = document.activeElement;
                    let isUserInAnotherInput = active && isInteractive(active) && active !== this;

                    // Only prevent InputChat from stealing focus away from an active search box, dialog, or addon
                    if (this.id === 'InputChat' && isUserInAnotherInput) {
                        return;
                    }

                    if (window.getSelection().toString().length > 0) return;
                } catch(e) {}
                origFocus.call(this);
            };

            let focusObserver = new MutationObserver((mutations) => {
                let chatLog = document.getElementById('TextAreaChatLog');
                let shouldCheck = false;
                let addedInputs = false;
                for (let m of mutations) {
                    if (chatLog && chatLog.contains(m.target)) continue;
                    if (m.type === 'childList') {
                        if (m.addedNodes.length > 0) {
                            for (let i = 0; i < m.addedNodes.length; i++) {
                                let n = m.addedNodes[i];
                                if (isTextInput(n) || (n.querySelector && n.querySelector('textarea, input[type=text], input[type=search], input:not([type])'))) {
                                    addedInputs = true;
                                    shouldCheck = true;
                                }
                            }
                        }
                        if (m.removedNodes.length > 0) {
                            shouldCheck = true;
                        }
                    } else if (m.type === 'attributes') {
                        if (m.target && isTextInput(m.target)) {
                            shouldCheck = true;
                        }
                    }
                }
                
                if (addedInputs) {
                    window.bcForceUnfocusSearch = false;
                    window.bcUserPrefersGameChat = false;
                }

                if (shouldCheck && document.hasFocus()) {
                    if (window.bcFocusTimeout) clearTimeout(window.bcFocusTimeout);
                    window.bcFocusTimeout = setTimeout(() => {
                        if (window.bcIsMouseDown) return;
                        if (window.getSelection().toString().length > 0) return;

                        let best = window.bcRunFocusCrawler ? window.bcRunFocusCrawler() : null;
                        if (best && best.id !== 'InputChat') {
                            if (window.bcLastFocusedLayer !== best) {
                                window.bcLastFocusedLayer = best;
                                window.bcFocusMemory = best;
                                window.bcUserPrefersGameChat = false;
                                if (window.bcFocusAndTeleport) {
                                    window.bcFocusAndTeleport(best);
                                } else {
                                    origFocus.call(best);
                                }
                            }
                        } else {
                            window.bcLastFocusedLayer = null;
                        }
                    }, 50);
                }
            });
            focusObserver.observe(document.body, { 
                childList: true, 
                subtree: true, 
                attributes: true, 
                attributeFilter: ['style', 'class', 'hidden', 'disabled'] 
            });

            let origClipboard = navigator.clipboard;
            let mockClipboard = {
                writeText: function(text) {
                    window.chrome.webview.postMessage('COPY_TEXT:' + text);
                    return Promise.resolve();
                },
                readText: function() {
                    if (origClipboard && origClipboard.readText) {
                        return origClipboard.readText();
                    }
                    return Promise.resolve('');
                }
            };
            try {
                Object.defineProperty(navigator, 'clipboard', {
                    value: mockClipboard,
                    configurable: true
                });
            } catch(e) {}

            const originalExecCommand = document.execCommand;
            document.execCommand = function(commandId, showUI, value) {
                if (commandId && commandId.toLowerCase() === 'copy') {
                    let text = '';
                    let activeEl = document.activeElement;
                    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
                        try {
                            if (activeEl.selectionStart !== null && activeEl.selectionStart !== undefined) {
                                text = activeEl.value.substring(activeEl.selectionStart, activeEl.selectionEnd);
                            } else {
                                text = activeEl.value;
                            }
                        } catch (err) {
                            text = activeEl.value;
                        }
                    } else {
                        text = window.getSelection().toString();
                    }
                    if (text) {
                        window.chrome.webview.postMessage('COPY_TEXT:' + text);
                    }
                }
                return originalExecCommand.apply(this, arguments);
            };
        ";
        
        core.NavigationCompleted += async (sender, args) =>
        {
            if (args.HttpStatusCode == 404 && core.Source != FallbackUrl)
            {
                core.Navigate(FallbackUrl);
                return;
            }

            if (args.IsSuccess)
            {
                await core.ExecuteScriptAsync(copyScript);
            }
        };

        string builtInLoader = GetBuiltInLoaderScript();
        if (!string.IsNullOrWhiteSpace(builtInLoader))
        {
            await core.AddScriptToExecuteOnDocumentCreatedAsync(builtInLoader);
        }

        string scriptsDir = Path.Combine(AppContext.BaseDirectory, "Scripts");
        if (Directory.Exists(scriptsDir))
        {
            foreach (var file in Directory.GetFiles(scriptsDir, "*.js"))
            {
                if (string.Equals(Path.GetFileName(file), "inject-all.js", StringComparison.OrdinalIgnoreCase))
                    continue;

                string script = await File.ReadAllTextAsync(file);
                await core.AddScriptToExecuteOnDocumentCreatedAsync(script);
            }
        }

        WebView.DefaultBackgroundColor = System.Drawing.Color.FromArgb(255, 13, 13, 13);

        core.Navigate(_resolvedUrl);
    }

    private Point? _dragStart;

    private void TitleBar_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ClickCount == 2)
        {
            ToggleMaximize();
            return;
        }

        if (WindowState == WindowState.Maximized)
        {
            _dragStart = e.GetPosition(this);
        }
        else
        {
            try { DragMove(); } catch { }
        }
    }

    private void TitleBar_MouseMove(object sender, MouseEventArgs e)
    {
        if (e.LeftButton == MouseButtonState.Pressed && _dragStart.HasValue)
        {
            Point currentPos = e.GetPosition(this);
            Vector diff = currentPos - _dragStart.Value;

            if (Math.Abs(diff.X) > SystemParameters.MinimumHorizontalDragDistance ||
                Math.Abs(diff.Y) > SystemParameters.MinimumVerticalDragDistance)
            {
                var screenPos = PointToScreen(currentPos);
                var dpi = VisualTreeHelper.GetDpi(this);
                double dipScreenX = screenPos.X / dpi.DpiScaleX;
                double dipScreenY = screenPos.Y / dpi.DpiScaleY;
                double percentHorizontal = currentPos.X / ActualWidth;
                
                double restoreWidth = (!RestoreBounds.IsEmpty && RestoreBounds.Width > 0) ? RestoreBounds.Width : Width;
                _dragStart = null;
                WindowState = WindowState.Normal;
                
                Left = dipScreenX - (restoreWidth * percentHorizontal);
                Top = dipScreenY - currentPos.Y;
                
                try { DragMove(); } catch { }
            }
        }
    }

    private void TitleBar_MouseLeftButtonUp(object sender, MouseButtonEventArgs e)
    {
        _dragStart = null;
    }


    private void MinimizeBtn_Click(object sender, RoutedEventArgs e) =>
        WindowState = WindowState.Minimized;

    private void MaxRestoreBtn_Click(object sender, RoutedEventArgs e) =>
        ToggleMaximize();

    private void CloseBtn_Click(object sender, RoutedEventArgs e) =>
        Close();

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
        base.OnClosing(e);
    }


    private void TitleBar_MouseRightButtonUp(object sender, MouseButtonEventArgs e)
    {
        Point screenPoint = PointToScreen(e.GetPosition(this));
        SystemCommands.ShowSystemMenu(this, screenPoint);
    }

    private void ToggleMaximize()
    {
        WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;
    }

    protected override void OnPreviewKeyDown(KeyEventArgs e)
    {
        base.OnPreviewKeyDown(e);
        if (e.Key == Key.F11)
        {
            ToggleFullscreen();
            e.Handled = true;
        }
        else if (e.Key == Key.F12)
        {
            WebView.CoreWebView2?.OpenDevToolsWindow();
            e.Handled = true;
        }
        else if (e.Key == Key.System && e.SystemKey == Key.Space)
        {
            Point screenPoint = PointToScreen(new Point(0, TitleBarRow.ActualHeight));
            SystemCommands.ShowSystemMenu(this, screenPoint);
            e.Handled = true;
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

    private IntPtr WndProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
    {
        if (msg == WM_GETMINMAXINFO)
        {
            var monitor = MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST);
            var mi = new MONITORINFO { cbSize = Marshal.SizeOf<MONITORINFO>() };
            if (GetMonitorInfo(monitor, ref mi))
            {
                var mmi = Marshal.PtrToStructure<MINMAXINFO>(lParam);
                
                mmi.ptMaxPosition.X = (mi.rcWork.Left - mi.rcMonitor.Left);
                mmi.ptMaxPosition.Y = (mi.rcWork.Top - mi.rcMonitor.Top);
                mmi.ptMaxSize.X = (mi.rcWork.Right - mi.rcWork.Left);
                mmi.ptMaxSize.Y = (mi.rcWork.Bottom - mi.rcWork.Top);

                double dpi = VisualTreeHelper.GetDpi(this).DpiScaleY;
                mmi.ptMinTrackSize.X = (int)(MinWidth * dpi);
                mmi.ptMinTrackSize.Y = (int)(MinHeight * dpi);

                Marshal.StructureToPtr(mmi, lParam, true);
                handled = true;
            }
        }
        else if (msg == 0x0214) // WM_SIZING
        {
            var rect = Marshal.PtrToStructure<RECT>(lParam);
            double dpi = VisualTreeHelper.GetDpi(this).DpiScaleY;
            int titleBarHeight = (int)(32 * dpi);
            int minPhysicalWidth = (int)(MinWidth * dpi);
            int minPhysicalHeight = (int)(MinHeight * dpi);

            int width = rect.Right - rect.Left;
            int height = rect.Bottom - rect.Top;
            int edge = wParam.ToInt32();
            
            // Enforce a strict 2:1 aspect ratio during manual resizing.
            // WMSZ_TOP (3) or WMSZ_BOTTOM (6) -> Aspect ratio is driven by height
            if (edge == 3 || edge == 6)
            {
                if (height < minPhysicalHeight) height = minPhysicalHeight;
                int expectedWidth = (height - titleBarHeight) * 2;
                if (expectedWidth < minPhysicalWidth) expectedWidth = minPhysicalWidth;

                if (edge == 3)
                {
                    rect.Top = rect.Bottom - height;
                }
                else
                {
                    rect.Bottom = rect.Top + height;
                }
                rect.Right = rect.Left + expectedWidth;
            }
            // All other edges (Left, Right, Corners) -> Aspect ratio is driven by width
            else
            {
                if (width < minPhysicalWidth) width = minPhysicalWidth;
                int expectedHeight = (width / 2) + titleBarHeight;
                if (expectedHeight < minPhysicalHeight) expectedHeight = minPhysicalHeight;

                if (edge == 1 || edge == 4 || edge == 7) // WMSZ_LEFT, WMSZ_TOPLEFT, WMSZ_BOTTOMLEFT
                {
                    rect.Left = rect.Right - width;
                }
                else
                {
                    rect.Right = rect.Left + width;
                }

                if (edge == 4 || edge == 5) // WMSZ_TOPLEFT or WMSZ_TOPRIGHT
                {
                    rect.Top = rect.Bottom - expectedHeight;
                }
                else
                {
                    rect.Bottom = rect.Top + expectedHeight;
                }
            }

            Marshal.StructureToPtr(rect, lParam, true);
            handled = true;
        }
        else if (msg == 0x0084) // WM_NCHITTEST
        {
            if (WindowState == WindowState.Maximized)
            {
                return IntPtr.Zero;
            }

            int x = (short)(lParam.ToInt64() & 0xFFFF);
            int y = (short)((lParam.ToInt64() >> 16) & 0xFFFF);
            var p = PointFromScreen(new Point(x, y));

            int border = 5;
            int corner = 16;

            bool onLeft = p.X <= border;
            bool onRight = p.X >= ActualWidth - border;
            bool onTop = p.Y <= border;
            bool onBottom = p.Y >= ActualHeight - border;

            bool inLeftCorner = p.X <= corner;
            bool inRightCorner = p.X >= ActualWidth - corner;
            bool inTopCorner = p.Y <= corner;
            bool inBottomCorner = p.Y >= ActualHeight - corner;

            if ((onTop && inLeftCorner) || (onLeft && inTopCorner)) { handled = true; return (IntPtr)13; }    // HTTOPLEFT
            if ((onTop && inRightCorner) || (onRight && inTopCorner)) { handled = true; return (IntPtr)14; }   // HTTOPRIGHT
            if ((onBottom && inLeftCorner) || (onLeft && inBottomCorner)) { handled = true; return (IntPtr)16; } // HTBOTTOMLEFT
            if ((onBottom && inRightCorner) || (onRight && inBottomCorner)) { handled = true; return (IntPtr)17; }// HTBOTTOMRIGHT
            if (onTop) { handled = true; return (IntPtr)12; }              // HTTOP
            if (onBottom) { handled = true; return (IntPtr)15; }           // HTBOTTOM
            if (onLeft) { handled = true; return (IntPtr)10; }             // HTLEFT
            if (onRight) { handled = true; return (IntPtr)11; }            // HTRIGHT
        }
        return IntPtr.Zero;
    }

    private const int WM_GETMINMAXINFO       = 0x0024;
    private const uint MONITOR_DEFAULTTONEAREST = 0x00000002;

    [DllImport("user32.dll")] private static extern IntPtr MonitorFromWindow(IntPtr hwnd, uint flags);
    [DllImport("user32.dll")] private static extern bool   GetMonitorInfo(IntPtr hMon, ref MONITORINFO mi);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool OpenClipboard(IntPtr hWndNewOwner);
    [DllImport("user32.dll")]
    private static extern bool EmptyClipboard();
    [DllImport("user32.dll")]
    private static extern IntPtr SetClipboardData(uint uFormat, IntPtr hMem);
    [DllImport("user32.dll")]
    private static extern bool CloseClipboard();
    [DllImport("kernel32.dll")]
    private static extern IntPtr GlobalAlloc(uint uFlags, UIntPtr dwBytes);
    [DllImport("kernel32.dll")]
    private static extern IntPtr GlobalLock(IntPtr hMem);
    [DllImport("kernel32.dll")]
    private static extern bool GlobalUnlock(IntPtr hMem);
    [DllImport("kernel32.dll")]
    private static extern IntPtr GlobalFree(IntPtr hMem);
    [DllImport("kernel32.dll")]
    private static extern IntPtr GetCurrentProcess();
    [DllImport("kernel32.dll")]
    private static extern bool SetProcessWorkingSetSize(IntPtr hProcess, IntPtr dwMinimumWorkingSetSize, IntPtr dwMaximumWorkingSetSize);


    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
    private struct MONITORINFO
    {
        public int  cbSize;
        public RECT rcMonitor;
        public RECT rcWork;
        public uint dwFlags;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct RECT { public int Left, Top, Right, Bottom; }

    [StructLayout(LayoutKind.Sequential)]
    private struct MINMAXINFO
    {
        public POINT ptReserved, ptMaxSize, ptMaxPosition, ptMinTrackSize, ptMaxTrackSize;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct POINT { public int X, Y; }
    
    [StructLayout(LayoutKind.Sequential)]
    private struct WINDOWPOS
    {
        public IntPtr hwnd;
        public IntPtr hwndInsertAfter;
        public int x, y, cx, cy;
        public uint flags;
    }

    private void Core_DocumentTitleChanged(object? sender, object e)
    {
        if (WebView.CoreWebView2 is not { } core) return;
        
        string title = core.DocumentTitle;
        
        // Only update UI title if it's not hidden mode (where _originalTitleLabel is empty)
        if (!string.IsNullOrEmpty(_originalTitleLabel))
        {
            TitleLabel.Text = title;
            Title = title;
        }

        // Check if there is a notification badge like "(1)"
        var match = Regex.Match(title, @"^\((\d+)\)");
        
        if (TaskbarItemInfo == null)
            TaskbarItemInfo = new TaskbarItemInfo();

        if (match.Success)
        {
            string badgeText = match.Groups[1].Value;
            if (_lastBadgeText != badgeText || _lastBadgeImage == null)
            {
                _lastBadgeText = badgeText;
                _lastBadgeImage = CreateBadge(badgeText);
            }
            TaskbarItemInfo.Overlay = _lastBadgeImage;

            if (!IsActive)
            {
                var info = new FLASHWINFO
                {
                    cbSize = (uint)Marshal.SizeOf<FLASHWINFO>(),
                    hwnd = new WindowInteropHelper(this).Handle,
                    dwFlags = FLASHW_TRAY | FLASHW_TIMERNOFG,
                    uCount = 3,
                    dwTimeout = 0
                };
                FlashWindowEx(ref info);
            }
        }
        else
        {
            if (TaskbarItemInfo.Overlay != null)
                TaskbarItemInfo.Overlay = null;

            var info = new FLASHWINFO
            {
                cbSize = (uint)Marshal.SizeOf<FLASHWINFO>(),
                hwnd = new WindowInteropHelper(this).Handle,
                dwFlags = FLASHW_STOP,
                uCount = 0,
                dwTimeout = 0
            };
            FlashWindowEx(ref info);
        }
    }

    private string? _lastBadgeText;
    private ImageSource? _lastBadgeImage;

    private ImageSource CreateBadge(string text)
    {
        var visual = new DrawingVisual();
        using (var context = visual.RenderOpen())
        {
            var brush = new SolidColorBrush(Color.FromRgb(230, 39, 39)); // Red
            var pen = new Pen(Brushes.White, 1.5); // White border
            
            context.DrawEllipse(brush, pen, new Point(16, 16), 14, 14);
            
            var typeface = new Typeface(new FontFamily("Segoe UI"), FontStyles.Normal, FontWeights.Bold, FontStretches.Normal);
            double pixelsPerDip = VisualTreeHelper.GetDpi(this).PixelsPerDip;
            var formattedText = new FormattedText(
                text,
                System.Globalization.CultureInfo.InvariantCulture,
                FlowDirection.LeftToRight,
                typeface,
                14,
                Brushes.White,
                pixelsPerDip);

            context.DrawText(formattedText, new Point(16 - formattedText.Width / 2, 16 - formattedText.Height / 2));
        }



        var bitmap = new RenderTargetBitmap(32, 32, 96, 96, PixelFormats.Pbgra32);
        bitmap.Render(visual);
        return bitmap;
    }

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool FlashWindowEx(ref FLASHWINFO pwfi);

    [StructLayout(LayoutKind.Sequential)]
    private struct FLASHWINFO
    {
        public uint cbSize;
        public IntPtr hwnd;
        public uint dwFlags;
        public uint uCount;
        public uint dwTimeout;
    }

    private const uint FLASHW_STOP = 0;
    private const uint FLASHW_TRAY = 2;
    private const uint FLASHW_TIMERNOFG = 12;
}

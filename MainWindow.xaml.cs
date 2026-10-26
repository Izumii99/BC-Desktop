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
    internal const string BaseGameUrl = "https://www.bondage-asia.com/club/R{0}/";
    private static string _lastKnownGoodUrl = string.Format(BaseGameUrl, 132);
    private static string FallbackUrl => _lastKnownGoodUrl;


    private string _originalTitleLabel;
    private CancellationTokenSource? _deactivationCts;
    private bool _isSuspending;
    private bool _wantsResume;
    private bool _wasMinimized;
    private int _recentCrashCount;
    private DateTime _lastCrashTime = DateTime.MinValue;

    // In-memory only: the game persists GraphicsSettings solely when leaving the Preference screen, which is skipped here.
    internal const string CapUnfocusedFpsScript =
        "(()=>{" +
        "const g=window.Player&&Player.GraphicsSettings;" +
        "if(g&&!g.MaxUnfocusedFPS&&window.CurrentScreen!=='Preference'){g.MaxUnfocusedFPS=15;window.bcFpsCap=g;}" +
        "if(window.bcFocusMemory&&!window.bcFocusMemory.isConnected)window.bcFocusMemory=null;" +
        "if(window.bcLastMousedown&&!window.bcLastMousedown.isConnected)window.bcLastMousedown=null;" +
        "if(window.bcLastFocusedLayer&&!window.bcLastFocusedLayer.isConnected)window.bcLastFocusedLayer=null;" +
        "if(typeof window.gc==='function'){try{window.gc();}catch(e){}}" +
        "})()";
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

    private void TrimAllWebViewProcesses()
    {
        _ = Task.Run(() =>
        {
            TrimWorkingSet();
            try
            {
                foreach (var proc in Process.GetProcessesByName("msedgewebview2"))
                {
                    try
                    {
                        SetProcessWorkingSetSize(proc.Handle, (IntPtr)(-1), (IntPtr)(-1));
                    }
                    catch { }
                    finally
                    {
                        proc.Dispose();
                    }
                }
            }
            catch { }
        });
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
                await core.ExecuteScriptAsync(CapUnfocusedFpsScript);
                await Task.Delay(150, token);
                TrimAllWebViewProcesses();
            }
        }
        catch (OperationCanceledException)
        {
        }
        catch
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
                    if (window.getSelection && window.getSelection().toString().length > 0) return;

                    let target = null;
                    if (!window.bcUserPrefersGameChat && window.bcFocusMemory && window.bcFocusMemory.isConnected && window.bcFocusMemory.offsetParent !== null) {
                        target = window.bcFocusMemory;
                    } else if (window.bcRunFocusCrawler) {
                        target = window.bcRunFocusCrawler();
                    }
                    if (target) {
                        window.bcFocusMemory = target;
                        if (target.id !== 'InputChat') window.bcUserPrefersGameChat = false;
                        target.focus();
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
                _wasMinimized = true;
                CancelDeactivation();
                _wantsResume = false;
                core.MemoryUsageTargetLevel = CoreWebView2MemoryUsageTargetLevel.Low;
                await core.ExecuteScriptAsync(CapUnfocusedFpsScript);

                if (!_isSuspending)
                {
                    _isSuspending = true;
                    try
                    {
                        await core.TrySuspendAsync();
                    }
                    finally
                    {
                        _isSuspending = false;
                    }

                    if (_wantsResume || WindowState != WindowState.Minimized)
                    {
                        _wasMinimized = false;
                        core.Resume();
                        core.MemoryUsageTargetLevel = CoreWebView2MemoryUsageTargetLevel.Normal;
                        _ = core.ExecuteScriptAsync(RestoreUnfocusedFpsScript);
                        return;
                    }
                }
                TrimAllWebViewProcesses();
            }
            else if (_wasMinimized)
            {
                _wasMinimized = false;
                _wantsResume = true;
                core.Resume();
                core.MemoryUsageTargetLevel = CoreWebView2MemoryUsageTargetLevel.Normal;
                _ = core.ExecuteScriptAsync(RestoreUnfocusedFpsScript);
            }
        }
        catch
        {
        }
    }

    // Dynilath UTC calendar version formula (auto-increments every 16th of the month at UTC)
    internal static int GetCalculatedCalendarVersion(DateTime? utcNow = null)
    {
        var dt = utcNow ?? DateTime.UtcNow;
        return ((dt.Year - 2025) * 12 + dt.Month) + 110 + (dt.Day >= 16 ? 1 : 0);
    }

    // Scrape active official release version number from portal, enforced to bondage-asia
    internal static async Task<int?> FetchOfficialVersionNumberAsync(HttpClient client)
    {
        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(4));
            using var req = new HttpRequestMessage(HttpMethod.Get, "https://bondageprojects.com/club_game/");
            req.Headers.CacheControl = new System.Net.Http.Headers.CacheControlHeaderValue { NoCache = true, NoStore = true };

            using var res = await client.SendAsync(req, cts.Token);
            if (!res.IsSuccessStatusCode) return null;

            string html = await res.Content.ReadAsStringAsync(cts.Token);

            // Extract the active Rxxx version number from official portal button
            var match = Regex.Match(html, @"onclick=""window\.location='https://www\.bondage[^']+/R(\d+)/[^']*'""", RegexOptions.IgnoreCase);
            if (match.Success && int.TryParse(match.Groups[1].Value, out int vNum))
            {
                return vNum;
            }
        }
        catch
        {
            // Return null on failure/timeout to proceed with calendar formula fallback
        }
        return null;
    }

    private static async Task<string> DetectLatestUrlAsync()
    {
        int activeVersion = 132;
        bool isLocked = false;

        string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        string versionFile = Path.Combine(localAppData, "BCClient", "version.txt");

        // 1. Read version.txt & check if :lock flag is present
        if (File.Exists(versionFile))
        {
            string rawContent = File.ReadAllText(versionFile).Trim();
            if (rawContent.EndsWith(":lock", StringComparison.OrdinalIgnoreCase))
            {
                isLocked = true;
                rawContent = rawContent.Substring(0, rawContent.Length - 5).Trim();
            }

            if (int.TryParse(rawContent, out int savedVersion) && savedVersion >= 132 && savedVersion < 500)
            {
                activeVersion = savedVersion;
            }
        }

        // If user locked the version (e.g. "132:lock"), bypass auto-detect directly
        if (isLocked)
        {
            _lastKnownGoodUrl = string.Format(BaseGameUrl, activeVersion);
            return _lastKnownGoodUrl;
        }

        try
        {
            using var http = new HttpClient();
            http.DefaultRequestHeaders.UserAgent.ParseAdd(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

            int? officialVer = await FetchOfficialVersionNumberAsync(http);
            if (officialVer.HasValue && officialVer.Value >= 132 && officialVer.Value < 500)
            {
                activeVersion = officialVer.Value;
            }
            else
            {
                int calVer = GetCalculatedCalendarVersion();
                if (calVer >= 132 && calVer < 500)
                {
                    activeVersion = calVer;
                }
            }

            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(versionFile)!);
                File.WriteAllText(versionFile, activeVersion.ToString());
            }
            catch { }
        }
        catch
        {
            if (activeVersion < 132)
            {
                activeVersion = GetCalculatedCalendarVersion();
            }
        }

        _lastKnownGoodUrl = string.Format(BaseGameUrl, activeVersion);
        return _lastKnownGoodUrl;
    }


    internal const string CurrentAppVersion = "7.4";
    internal const string GitHubRepo = "Izumii99/BC-Desktop";
    internal static bool EnableAutoUpdates = true;
    private static string? _newReleaseUrl;
    internal static string? _newReleaseDownloadUrl;
    internal static string? _newReleaseTag;
    internal static bool _isUpdating = false;

    internal static bool IsAutoUpdateEnabled()
    {
        if (!EnableAutoUpdates) return false;
        string scriptsDir = Path.Combine(AppContext.BaseDirectory, "Scripts");
        if (Directory.Exists(scriptsDir) && Directory.EnumerateFiles(scriptsDir, "*.js").Any())
        {
            return false;
        }
        return true;
    }

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
        if (!IsAutoUpdateEnabled() || string.IsNullOrEmpty(_originalTitleLabel)) return;

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

                    string? directDownloadUrl = null;
                    string targetAssetName = string.IsNullOrEmpty(_originalTitleLabel) ? "BC-Windows-Hidden.exe" : "BC-Windows.exe";
                    if (doc.RootElement.TryGetProperty("assets", out var assetsElem) && assetsElem.ValueKind == System.Text.Json.JsonValueKind.Array)
                    {
                        foreach (var asset in assetsElem.EnumerateArray())
                        {
                            if (asset.TryGetProperty("name", out var nameProp) &&
                                string.Equals(nameProp.GetString(), targetAssetName, StringComparison.OrdinalIgnoreCase))
                            {
                                if (asset.TryGetProperty("browser_download_url", out var dlProp))
                                {
                                    directDownloadUrl = dlProp.GetString();
                                    break;
                                }
                            }
                        }
                    }

                    if (string.IsNullOrEmpty(directDownloadUrl))
                    {
                        directDownloadUrl = $"https://github.com/{GitHubRepo}/releases/download/{tag}/{targetAssetName}";
                    }

                    Action applyUi = () =>
                    {
                        if (string.IsNullOrEmpty(_originalTitleLabel)) return;
                        _newReleaseUrl = htmlUrl;
                        _newReleaseDownloadUrl = directDownloadUrl;
                        _newReleaseTag = tag;

                        TitleLabel.ToolTip = $"New desktop release available: {tag}\nClick to view release notes";
                        TitleLabel.Cursor = Cursors.Hand;
                        if (UpdateBadge != null && UpdateBadgeText != null)
                        {
                            UpdateBadgeText.Text = $"Update {tag}";
                            UpdateBadge.ToolTip = $"New desktop release available: {tag}\n• Left-click to instantly download & install\n• Right-click to view release notes";
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

    private void OpenReleaseNotesUrl()
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

    private void TitleLabel_MouseLeftButtonUp(object sender, MouseButtonEventArgs e)
    {
        OpenReleaseNotesUrl();
    }

    private void UpdateBadge_MouseRightButtonUp(object sender, MouseButtonEventArgs e)
    {
        e.Handled = true;
        OpenReleaseNotesUrl();
    }

    private async void UpdateBadge_MouseLeftButtonUp(object sender, MouseButtonEventArgs e)
    {
        e.Handled = true;
        if (_isUpdating) return;
        if (UpdateBadgeText?.Text == "Update Failed")
        {
            OpenReleaseNotesUrl();
            return;
        }

        await PerformInstantUpdateAsync();
    }

    internal async Task<bool> PerformInstantUpdateAsync(
        HttpClient? httpClient = null,
        string? targetExePath = null,
        Func<string, string, int, bool>? restartLauncher = null)
    {
        if (!IsAutoUpdateEnabled() || _isUpdating) return false;
        if (string.IsNullOrEmpty(_newReleaseDownloadUrl))
        {
            OpenReleaseNotesUrl();
            return false;
        }

        string currentExe = targetExePath ?? Environment.ProcessPath ?? Process.GetCurrentProcess().MainModule?.FileName ?? "";
        if (string.IsNullOrEmpty(currentExe) || !File.Exists(currentExe))
        {
            OpenReleaseNotesUrl();
            return false;
        }

        _isUpdating = true;
        string tempExe = Path.Combine(Path.GetTempPath(), $"BC-Update-{Guid.NewGuid():N}.exe");

        try
        {
            if (UpdateBadgeText != null)
            {
                UpdateBadgeText.Text = "Downloading 0%...";
                UpdateBadge.ToolTip = "Downloading update from GitHub Releases...";
            }

            using var http = httpClient != null ? null : new HttpClient { Timeout = TimeSpan.FromMinutes(10) };
            var client = httpClient ?? http!;
            if (client.DefaultRequestHeaders.UserAgent.Count == 0)
            {
                client.DefaultRequestHeaders.UserAgent.ParseAdd("BC-Desktop-Client");
            }

            using var response = await client.GetAsync(_newReleaseDownloadUrl, HttpCompletionOption.ResponseHeadersRead);
            response.EnsureSuccessStatusCode();

            long? totalBytes = response.Content.Headers.ContentLength;
            using (var contentStream = await response.Content.ReadAsStreamAsync())
            using (var fileStream = new FileStream(tempExe, FileMode.Create, FileAccess.Write, FileShare.None, 81920, true))
            {
                byte[] buffer = new byte[81920];
                long totalRead = 0;
                int bytesRead;
                int lastReportedPercent = -1;

                while ((bytesRead = await contentStream.ReadAsync(buffer, 0, buffer.Length)) > 0)
                {
                    await fileStream.WriteAsync(buffer, 0, bytesRead);
                    totalRead += bytesRead;

                    if (totalBytes.HasValue && totalBytes.Value > 0)
                    {
                        int percent = (int)((double)totalRead / totalBytes.Value * 100);
                        if (percent != lastReportedPercent)
                        {
                            lastReportedPercent = percent;
                            Action updateText = () =>
                            {
                                if (UpdateBadgeText != null)
                                {
                                    UpdateBadgeText.Text = $"Downloading {percent}%...";
                                }
                            };
                            if (Dispatcher.CheckAccess()) updateText();
                            else await Dispatcher.InvokeAsync(updateText);
                        }
                    }
                }
            }

            var fileInfo = new FileInfo(tempExe);
            if (!fileInfo.Exists || fileInfo.Length == 0)
            {
                throw new InvalidOperationException("Downloaded update file is empty.");
            }

            Action notifyRestart = () =>
            {
                if (UpdateBadgeText != null)
                {
                    UpdateBadgeText.Text = "Restarting...";
                    UpdateBadge.ToolTip = "Update ready. Relaunching application...";
                }
            };
            if (Dispatcher.CheckAccess()) notifyRestart();
            else await Dispatcher.InvokeAsync(notifyRestart);

            int pid = Environment.ProcessId;
            bool launched = false;
            if (restartLauncher != null)
            {
                launched = restartLauncher(tempExe, currentExe, pid);
            }
            else
            {
                string escapedTemp = tempExe.Replace("'", "''");
                string escapedTarget = currentExe.Replace("'", "''");
                string psScript = $"Wait-Process -Id {pid}; Move-Item -Force -Path '{escapedTemp}' -Destination '{escapedTarget}'; Start-Process '{escapedTarget}'";

                Process.Start(new ProcessStartInfo
                {
                    FileName = "powershell.exe",
                    Arguments = $"-NoProfile -WindowStyle Hidden -Command \"{psScript}\"",
                    CreateNoWindow = true,
                    UseShellExecute = false
                });
                launched = true;
            }

            if (launched && restartLauncher == null)
            {
                Application.Current.Shutdown();
            }
            return true;
        }
        catch (Exception ex)
        {
            _isUpdating = false;
            try
            {
                if (File.Exists(tempExe)) File.Delete(tempExe);
            }
            catch { }

            Action showError = () =>
            {
                if (UpdateBadgeText != null)
                {
                    UpdateBadgeText.Text = "Update Failed";
                    UpdateBadge.ToolTip = $"Failed to install update: {ex.Message}\nClick to view releases on GitHub.";
                }
            };
            if (Dispatcher.CheckAccess()) showError();
            else await Dispatcher.InvokeAsync(showError);
            return false;
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
                    "--disable-features=Translate,OptimizationHints,MediaRouter,DialMediaRouteProvider,SpareRendererForSitePerProcess,CanvasOopRasterization,AudioServiceOutOfProcess,AutofillServerCommunication " +
                    "--disable-background-networking " +
                    "--disable-component-update " +
                    "--disable-domain-reliability " +
                    "--disable-sync " +
                    "--disable-notifications " +
                    "--no-pings " +
                    "--force-gpu-mem-available-mb=192 " +
                    "--force-gpu-mem-discardable-limit-mb=32 " +
                    "--gpu-rasterization-msaa-sample-count=0 " +
                    "--max-gum-fps=60 " +
                    "--enable-features=CalculateNativeWinOcclusion,PurgeRendererMemoryWhenBackgrounded,IntensiveWakeUpThrottling " +
                    "--js-flags=\"--max-old-space-size=512 --optimize-for-size --expose-gc\""
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
        core.NewWindowRequested += (s, args) =>
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
                catch { }
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
            (() => {
                if (window.__bcCopyScriptInitialized) return;
                window.__bcCopyScriptInitialized = true;

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
                return tag === 'INPUT' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'OPTION' || tag === 'BC-TINT-INPUT';
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
                    let rawId = curr.id || '';
                    if (rawId === 'chat-room-bot' || rawId === 'chat-room-div' || rawId === 'chat-room-main' ||
                        rawId === 'InputChat' || rawId === 'TextAreaChatLog' || rawId === 'MainCanvas') return null;
                    
                    let id = rawId.toLowerCase();
                    let cls = (typeof curr.className === 'string' ? curr.className : '').toLowerCase();
                    
                    if (id === 'descriptioninput' || id.startsWith('preference') || cls.includes('preference') || cls.includes('scroll-box')) return null;

                    // Mencakup LianChat (lc-, lian, bcmod), LCE, BCX, FUSAM, BCOM, dan modal/floating UI
                    if (id.startsWith('lce-') || cls.includes('lce-') ||
                        id.startsWith('lc-') || cls.includes('lc-') ||
                        id.includes('lian') || cls.includes('lian') ||
                        id.includes('bcmod') || cls.includes('bcmod') ||
                        id.includes('bcx') || cls.includes('bcx') ||
                        id.includes('fusam') || cls.includes('fusam') ||
                        id.includes('bcom') || cls.includes('bcom') ||
                        id.includes('modal') || cls.includes('modal') ||
                        id.includes('dialog') || cls.includes('dialog') ||
                        id.includes('floating') || cls.includes('floating') ||
                        id.includes('im') || cls.includes('im')) {
                        return curr;
                    }
                    
                    let style = window.getComputedStyle(curr);
                    let pos = style.position;
                    if (pos === 'fixed' || pos === 'absolute') {
                        let z = parseInt(style.zIndex, 10);
                        if (!isNaN(z) && z >= 1) {
                            return curr;
                        }
                    }
                    curr = curr.parentElement;
                }
                return null;
            }

            function isElementVisibleAndActive(el) {
                if (!el || !el.isConnected || el.disabled || el.readOnly) return false;
                if (el.offsetWidth === 0 && el.offsetHeight === 0) {
                    let rect = el.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) return false;
                }
                let style = window.getComputedStyle(el);
                return style.visibility !== 'hidden' && style.opacity !== '0' && style.display !== 'none';
            }

            let lastCrawlerCache = null;
            let lastCrawlerTime = 0;
            function getActiveAddonInputStrict() {
                if (window.bcFocusMemory && window.bcFocusMemory.id !== 'InputChat' && isElementVisibleAndActive(window.bcFocusMemory)) {
                    return window.bcFocusMemory;
                }
                let now = Date.now();
                if (now - lastCrawlerTime > 150) {
                    lastCrawlerTime = now;
                    lastCrawlerCache = window.bcRunFocusCrawler ? window.bcRunFocusCrawler() : null;
                } else if (lastCrawlerCache && !isElementVisibleAndActive(lastCrawlerCache)) {
                    lastCrawlerCache = window.bcRunFocusCrawler ? window.bcRunFocusCrawler() : null;
                }
                if (lastCrawlerCache && lastCrawlerCache.id !== 'InputChat') {
                    return lastCrawlerCache;
                }
                return null;
            }

            document.addEventListener('focusin', (e) => {
                if (isInteractive(e.target)) {
                    if (isChatArea(e.target)) {
                        let clickedChatRecently = window.bcLastMousedown && isChatArea(window.bcLastMousedown) && (Date.now() - (window.bcLastMousedownTime || 0) < 500);
                        if (clickedChatRecently || !getActiveAddonInputStrict()) {
                            window.bcUserPrefersGameChat = true;
                            window.bcFocusMemory = e.target;
                        }
                    } else {
                        window.bcFocusMemory = e.target;
                        window.bcUserPrefersGameChat = false;
                        window.bcForceUnfocusSearch = false;
                    }
                }
            }, true);
            
            document.addEventListener('pointerdown', () => { window.bcIsMouseDown = true; }, true);
            document.addEventListener('pointerup', () => { window.bcIsMouseDown = false; }, true);
            document.addEventListener('mousemove', (e) => {
                if (e.buttons !== undefined) window.bcIsMouseDown = (e.buttons > 0);
            }, true);
            window.addEventListener('blur', () => { window.bcIsMouseDown = false; });

            document.addEventListener('mousedown', (e) => {
                window.bcIsMouseDown = true;
                window.bcLastMousedown = e.target;
                window.bcLastMousedownTime = Date.now();
                window.bcMouseDownX = e.clientX;
                window.bcMouseDownY = e.clientY;
                
                let ic = document.getElementById('InputChat');
                let addonBox = getAddonContainer(e.target);
                
                if (ic && isChatArea(e.target)) {
                    window.bcUserPrefersGameChat = true;
                    window.bcFocusMemory = ic;
                    window.bcForceUnfocusSearch = false;
                } else if (addonBox) {
                    window.bcUserPrefersGameChat = false;
                    window.bcForceUnfocusSearch = false;
                    if (isInteractive(e.target)) {
                        window.bcFocusMemory = e.target;
                    } else {
                        let targetInput = addonBox.querySelector('textarea:not([disabled]):not([readonly]), input[type=text]:not([disabled]):not([readonly]), input[type=search]:not([disabled]):not([readonly]), input:not([type]):not([disabled]):not([readonly])');
                        if (targetInput) {
                            window.bcFocusMemory = targetInput;
                        }
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
                let moveDist = Math.hypot((e.clientX || 0) - (window.bcMouseDownX || 0), (e.clientY || 0) - (window.bcMouseDownY || 0));
                let isDraggingSelection = moveDist > 5;

                setTimeout(() => {
                    if (window.bcIsMouseDown) return;
                    let sel = window.getSelection ? window.getSelection() : null;
                    if (isDraggingSelection || (sel && (!sel.isCollapsed || sel.toString().length > 0))) return;

                    let active = document.activeElement;
                    if (active && isInteractive(active)) {
                        window.bcFocusMemory = active;
                        return;
                    }
                    if (window.bcForceUnfocusSearch) return;

                    if (e.target && e.target.closest && e.target.closest('.scroll-box, [id^=""preference-""], .preference-settings-grid, select, option, fieldset[name=""color-picker""], #color-picker, .color-picker, bc-tint-input, input[type=""range""]')) {
                        return;
                    }
                    
                    let target = (window.bcFocusMemory && isElementVisibleAndActive(window.bcFocusMemory)) 
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
                    if (window.bcIsMouseDown) return;
                    if ((Date.now() - (window.bcLastMousedownTime || 0)) < 400) return;
                    let active = document.activeElement;
                    if (active && isInteractive(active)) return;
                    if (window.getSelection().toString().length > 0) return;
                    if (window.bcForceUnfocusSearch) return;
                    
                    let target = (window.bcFocusMemory && isElementVisibleAndActive(window.bcFocusMemory)) 
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
                let zCache = new Map();
                function getHighestZ(el) {
                    let max = 0;
                    while (el && el !== document.documentElement) {
                        let z = zCache.get(el);
                        if (z === undefined) {
                            let parsed = parseInt(window.getComputedStyle(el).zIndex, 10);
                            z = isNaN(parsed) ? 0 : parsed;
                            zCache.set(el, z);
                        }
                        if (z > max) max = z;
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
                    if (!isTextInput(el)) continue;
                    
                    if (el.offsetWidth === 0 && el.offsetHeight === 0) {
                        let rect = el.getBoundingClientRect();
                        if (rect.width === 0 || rect.height === 0) continue;
                    }
                    
                    let style = window.getComputedStyle(el);
                    if (style.visibility === 'hidden' || style.opacity === '0' || style.display === 'none') continue;
                    
                    let z = getHighestZ(el);
                    let score = z * 1000;
                    
                    if (el.id === 'InputChat' || el.id === 'TextAreaChatLog') score -= 500000;
                    if (el.closest && el.closest('fieldset[name=""color-picker""], #color-picker, .color-picker')) score -= 500000;
                    if (el.tagName === 'TEXTAREA') score += 5000;
                    if (el.id && el.id.toLowerCase().indexOf('search') !== -1) score += 2000;
                    
                    if (score > maxScore) { maxScore = score; bestInput = el; }
                }

                if (bestInput && bestInput.id !== 'InputChat' && (!bestInput.closest || !bestInput.closest('fieldset[name=""color-picker""], #color-picker, .color-picker'))) {
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
                        let recentClick = (Date.now() - (window.bcLastMousedownTime || 0)) < 350;

                        let wasClicked = recentClick && targetEl && (
                            window.bcLastMousedown === targetEl || 
                            (ID === 'InputChat' && window.bcUserPrefersGameChat && window.bcLastMousedown && isChatArea(window.bcLastMousedown))
                        );
                        if (wasClicked) {
                            origElementFocus(ID);
                            return;
                        }

                        if (window.bcIsMouseDown && !isLayeringInput) return;
                        if (!isLayeringInput && window.getSelection().toString().length > 0) return;

                        // STRICT GUARD: Tolak fokus ke InputChat jika user tidak memilih game chat DAN ada addon aktif di atasnya!
                        if (ID === 'InputChat') {
                            let active = document.activeElement;
                            let isUserInAnotherInput = active && isInteractive(active) && active !== targetEl;
                            if (isUserInAnotherInput) return;

                            if (!window.bcUserPrefersGameChat) {
                                let addonInput = getActiveAddonInputStrict();
                                if (addonInput) {
                                    if (document.activeElement !== addonInput && document.hasFocus()) {
                                        origFocus.call(addonInput);
                                    }
                                    return;
                                }
                            }
                        }

                        if (targetEl && targetEl.id !== 'InputChat') {
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
                    let recentClick = (Date.now() - (window.bcLastMousedownTime || 0)) < 350;

                    let wasClicked = recentClick && (
                        window.bcLastMousedown === this ||
                        (this.id === 'InputChat' && window.bcUserPrefersGameChat && window.bcLastMousedown && isChatArea(window.bcLastMousedown))
                    );
                    if (wasClicked) {
                        origFocus.call(this);
                        return;
                    }

                    if (window.bcIsMouseDown && !isLayeringInput) return;

                    let currentActive = document.activeElement;
                    let currentIsLayering = currentActive && currentActive.id && currentActive.id.startsWith('layering-input-');
                    if (currentIsLayering && !isLayeringInput) return;

                    if (window.getSelection().toString().length > 0) return;

                    if (this.id === 'InputChat') {
                        let active = document.activeElement;
                        let isUserInAnotherInput = active && isInteractive(active) && active !== this;
                        if (isUserInAnotherInput) return;

                        if (!window.bcUserPrefersGameChat) {
                            let addonInput = getActiveAddonInputStrict();
                            if (addonInput) {
                                if (document.activeElement !== addonInput && document.hasFocus()) {
                                    origFocus.call(addonInput);
                                }
                                return;
                            }
                        }
                    }
                } catch(e) {}
                origFocus.call(this);
            };

            let focusObserver = new MutationObserver((mutations) => {
                let chatLog = document.getElementById('TextAreaChatLog');
                let shouldCheck = false;
                let addedInputs = false;
                for (let m of mutations) {
                    if (m.target && (m.target.id === 'TextAreaChatLog' || (chatLog && chatLog.contains(m.target)))) continue;
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

            // ponytail: Safe VRAM & texture optimization via BC's native ImageCache
            (function setupSafeVramOptimization() {
                const PURGE_DELAY = 3 * 60 * 1000;

                function applyPurgeDelay() {
                    if (typeof window.ImageCachePurgeDelay !== 'undefined') {
                        window.ImageCachePurgeDelay = PURGE_DELAY;
                    }
                }

                // 1. Periodically prune expired textures (safely handles GLDrawImageCache & DrawImageCache)
                setInterval(() => {
                    try {
                        applyPurgeDelay();
                        if (typeof window.CurrentScreen !== 'undefined' && window.CurrentScreen === 'Appearance') return;

                        if (typeof window.GLDrawImageCache !== 'undefined' && window.GLDrawImageCache && typeof window.GLDrawImageCache.purge === 'function') {
                            window.GLDrawImageCache.purge(false);
                        }
                        if (typeof window.DrawImageCache !== 'undefined' && window.DrawImageCache && typeof window.DrawImageCache.purge === 'function') {
                            window.DrawImageCache.purge(false);
                        }
                    } catch (e) {}
                }, 45 * 1000);

                // 2. Safe gentle prune after leaving Wardrobe (Appearance) once new room assets have safely loaded
                let lastScreen = null;
                let screenTimer = null;
                setInterval(() => {
                    try {
                        applyPurgeDelay();
                        if (typeof window.CurrentScreen !== 'undefined') {
                            if (lastScreen === 'Appearance' && window.CurrentScreen !== 'Appearance') {
                                if (screenTimer) clearTimeout(screenTimer);
                                screenTimer = setTimeout(() => {
                                    if (typeof window.CurrentScreen !== 'undefined' && window.CurrentScreen === 'Appearance') return;
                                    if (typeof window.GLDrawImageCache !== 'undefined' && window.GLDrawImageCache && typeof window.GLDrawImageCache.purge === 'function') {
                                        window.GLDrawImageCache.purge(true);
                                    }
                                    if (typeof window.DrawImageCache !== 'undefined' && window.DrawImageCache && typeof window.DrawImageCache.purge === 'function') {
                                        window.DrawImageCache.purge(true);
                                    }
                                }, 12000);
                            }
                            lastScreen = window.CurrentScreen;
                        }
                    } catch (e) {}
                }, 1000);
            })();
        })();
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

        // ponytail: Native WebView2 fallback guard against undefined pidx ReferenceError
        await core.AddScriptToExecuteOnDocumentCreatedAsync("if(typeof window.pidx==='undefined'){try{Object.defineProperty(window,'pidx',{get:()=>0,set:()=>{},configurable:true});}catch(e){}}");

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
            string builtInLoader = GetBuiltInLoaderScript();
            if (!string.IsNullOrWhiteSpace(builtInLoader))
            {
                await core.AddScriptToExecuteOnDocumentCreatedAsync(builtInLoader);
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

        CancelDeactivation();
        try { WebView?.Dispose(); } catch { }
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

    private static readonly Typeface BadgeTypeface = new(new FontFamily("Segoe UI"), FontStyles.Normal, FontWeights.Bold, FontStretches.Normal);
    private static readonly SolidColorBrush BadgeFillBrush = CreateFrozenBrush(Color.FromRgb(230, 39, 39));
    private static readonly Pen BadgeBorderPen = CreateFrozenPen();

    private static SolidColorBrush CreateFrozenBrush(Color color)
    {
        var b = new SolidColorBrush(color);
        b.Freeze();
        return b;
    }

    private static Pen CreateFrozenPen()
    {
        var p = new Pen(Brushes.White, 1.5);
        p.Freeze();
        return p;
    }

    private ImageSource CreateBadge(string text)
    {
        var visual = new DrawingVisual();
        using (var context = visual.RenderOpen())
        {
            context.DrawEllipse(BadgeFillBrush, BadgeBorderPen, new Point(16, 16), 14, 14);
            
            double pixelsPerDip = VisualTreeHelper.GetDpi(this).PixelsPerDip;
            var formattedText = new FormattedText(
                text,
                System.Globalization.CultureInfo.InvariantCulture,
                FlowDirection.LeftToRight,
                BadgeTypeface,
                14,
                Brushes.White,
                pixelsPerDip);

            context.DrawText(formattedText, new Point(16 - formattedText.Width / 2, 16 - formattedText.Height / 2));
        }

        var bitmap = new RenderTargetBitmap(32, 32, 96, 96, PixelFormats.Pbgra32);
        bitmap.Render(visual);
        bitmap.Freeze();
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

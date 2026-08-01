using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Input;
using System.Windows.Interop;
using Microsoft.Web.WebView2.Core;

namespace BondageClub;

public partial class MainWindow : Window
{
    private const string FallbackUrl    = "https://www.bondage-asia.com/club/R130/";
    private const string VersionApiBase = "https://www.bondage-asia.com/";

    private const string FusamScript = """
        (function () {
            'use strict';
            if (window !== window.top) return;
            function inject() {
                if (window.FUSAM === undefined) {
                    let n = document.createElement("script");
                    n.type = "module";
                    n.setAttribute("src", "https://sidiousious.gitlab.io/bc-addon-loader/fusam.js?_=" + Date.now());
                    document.head.appendChild(n);
                }
            }
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", inject);
            } else {
                inject();
            }
        })();
        """;

    public MainWindow()
    {
        InitializeComponent();
        StateChanged += OnWindowStateChanged;
        InitWebViewAsync();
    }

    private async void OnWindowStateChanged(object? sender, EventArgs e)
    {
        if (WebView.CoreWebView2 is not { } core) return;

        if (WindowState == WindowState.Minimized)
        {
            core.MemoryUsageTargetLevel = CoreWebView2MemoryUsageTargetLevel.Low;
            await core.TrySuspendAsync();
        }
        else
        {
            core.Resume();
            core.MemoryUsageTargetLevel = CoreWebView2MemoryUsageTargetLevel.Normal;
        }
    }

    private static async Task<string> DetectLatestUrlAsync()
    {
        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(6) };
            http.DefaultRequestHeaders.UserAgent.ParseAdd(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

            var html    = await http.GetStringAsync(VersionApiBase);
            var matches = Regex.Matches(html, @"/club/(R(\d+))/",
                RegexOptions.IgnoreCase | RegexOptions.Compiled);

            if (matches.Count > 0)
            {
                var best = matches.MaxBy(m => int.Parse(m.Groups[2].Value))!;
                return $"https://www.bondage-asia.com{best.Groups[0].Value}";
            }
        }
        catch
        {
            // Network unavailable or server error — fall through to fallback.
        }
        return FallbackUrl;
    }

    private async void InitWebViewAsync()
    {
        var urlTask = DetectLatestUrlAsync();

        string userDataFolder = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "BCClient", "WebView2Data");

        var options = new CoreWebView2EnvironmentOptions(
            additionalBrowserArguments:
                "--js-flags=\"--max-old-space-size=512\" " +
                "--renderer-process-limit=1 " +
                "--disable-background-networking " +
                "--disk-cache-size=52428800 " +
                "--disable-gpu-shader-disk-cache " +
                "--disable-speech-api " +
                "--disable-pdf-extension");

        var env = await CoreWebView2Environment.CreateAsync(
            browserExecutableFolder: null,
            userDataFolder: userDataFolder,
            options: options);

        await WebView.EnsureCoreWebView2Async(env);
        _resolvedUrl = await urlTask;
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

        core.DocumentTitleChanged += (_, _) =>
            TitleLabel.Text = string.IsNullOrWhiteSpace(core.DocumentTitle)
                ? "Bondage Club"
                : core.DocumentTitle;

        await core.AddScriptToExecuteOnDocumentCreatedAsync(FusamScript);

        WebView.DefaultBackgroundColor = System.Drawing.Color.FromArgb(255, 13, 13, 13);

        core.Navigate(_resolvedUrl);
    }

    private void TitleBar_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ClickCount == 2)
        {
            ToggleMaximize();
            return;
        }

        if (WindowState == WindowState.Maximized)
        {
            var screenPos = PointToScreen(e.GetPosition(this));
            WindowState = WindowState.Normal;
            Left = screenPos.X - Width / 2;
            Top  = screenPos.Y - 16;
            if (Left < 0) Left = 0;
            if (Top  < 0) Top  = 0;
        }

        DragMove();
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


    private void ToggleMaximize()
    {
        if (WindowState == WindowState.Maximized)
        {
            WindowState = WindowState.Normal;
            MaxRestoreBtn.Content = "\uE922";
            MaxRestoreBtn.ToolTip = "Maximize";
        }
        else
        {
            WindowState = WindowState.Maximized;
            MaxRestoreBtn.Content = "\uE923";
            MaxRestoreBtn.ToolTip = "Restore";
        }
    }

    protected override void OnSourceInitialized(EventArgs e)
    {
        base.OnSourceInitialized(e);
        HwndSource.FromHwnd(new WindowInteropHelper(this).Handle)
                  .AddHook(WndProc);
    }

    private const int WM_GETMINMAXINFO    = 0x0024;
    private const uint MONITOR_DEFAULTTONEAREST = 0x00000002;

    [DllImport("user32.dll")] private static extern IntPtr MonitorFromWindow(IntPtr hwnd, uint flags);
    [DllImport("user32.dll")] private static extern bool   GetMonitorInfo(IntPtr hMon, ref MONITORINFO mi);

    private static IntPtr WndProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
    {
        if (msg == WM_GETMINMAXINFO)
        {
            var monitor = MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST);
            var mi      = new MONITORINFO { cbSize = Marshal.SizeOf<MONITORINFO>() };
            if (GetMonitorInfo(monitor, ref mi))
            {
                int fx = GetSystemMetrics(SM_CXFRAME) + GetSystemMetrics(SM_CXPADDEDBORDER);
                int fy = GetSystemMetrics(SM_CYFRAME) + GetSystemMetrics(SM_CXPADDEDBORDER);

                var mmi = Marshal.PtrToStructure<MINMAXINFO>(lParam);
                mmi.ptMaxPosition.X = mi.rcWork.Left   - fx;
                mmi.ptMaxPosition.Y = mi.rcWork.Top    - fy;
                mmi.ptMaxSize.X     = mi.rcWork.Right  - mi.rcWork.Left + fx * 2;
                mmi.ptMaxSize.Y     = mi.rcWork.Bottom - mi.rcWork.Top  + fy * 2;
                Marshal.StructureToPtr(mmi, lParam, true);
                handled = true;
            }
        }
        return IntPtr.Zero;
    }

    private const int SM_CXFRAME       = 32;
    private const int SM_CYFRAME       = 33;
    private const int SM_CXPADDEDBORDER = 92;
    [DllImport("user32.dll")] private static extern int GetSystemMetrics(int nIndex);


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
}

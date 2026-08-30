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
    private const string FallbackUrl    = "https://www.bondage-asia.com/club/R130/";
    private const string VersionApiBase = "https://www.bondage-asia.com/";


    private string _originalTitleLabel;

    public MainWindow()
    {
        InitializeComponent();
        _originalTitleLabel = TitleLabel.Text;
        StateChanged += OnWindowStateChanged;
        Activated += MainWindow_Activated;
        InitWebViewAsync();
    }

    private async void MainWindow_Activated(object? sender, EventArgs e)
    {
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
            WebView.CoreWebView2.ExecuteScriptAsync(smartFocusScript);
        }
    }

    private async void OnWindowStateChanged(object? sender, EventArgs e)
    {
        if (WebView.CoreWebView2 is not { } core) return;

        try
        {
            if (WindowState == WindowState.Minimized)
            {
                core.MemoryUsageTargetLevel = CoreWebView2MemoryUsageTargetLevel.Low;
                await core.TrySuspendAsync();
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
                core.ExecuteScriptAsync(smartFocusScript);
            }
        }
        catch
        {
        }
    }

    private static async Task<string> DetectLatestUrlAsync()
    {
        int version = 130;
        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
            http.DefaultRequestHeaders.UserAgent.ParseAdd(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

            while (true)
            {
                string nextUrl = $"https://www.bondage-asia.com/club/R{version + 1}/";
                HttpResponseMessage? response = null;
                
                try
                {
                    response = await http.SendAsync(new HttpRequestMessage(HttpMethod.Head, nextUrl));
                }
                catch
                {
                    if (version == 130) // Retry once on cold start
                    {
                        await Task.Delay(500);
                        response = await http.SendAsync(new HttpRequestMessage(HttpMethod.Head, nextUrl));
                    }
                }
                
                if (response != null && response.IsSuccessStatusCode)
                    version++;
                else
                    break;
            }
        }
        catch { }

        return $"https://www.bondage-asia.com/club/R{version}/";
    }

    private async void InitWebViewAsync()
    {
        var urlTask = DetectLatestUrlAsync();

        string userDataFolder = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "BCClient", "WebView2Data");

        var env = await CoreWebView2Environment.CreateAsync(
            browserExecutableFolder: null,
            userDataFolder: userDataFolder);

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

        core.DocumentTitleChanged += Core_DocumentTitleChanged;
        core.PermissionRequested += (s, args) =>
        {
            if (args.PermissionKind == CoreWebView2PermissionKind.ClipboardRead)
            {
                args.State = CoreWebView2PermissionState.Allow;
            }
        };

        core.WebMessageReceived += async (s, args) =>
        {
            try
            {
                string rawJson = args.WebMessageAsJson;

                string msg = null;
                if (rawJson != null && rawJson.StartsWith("\"") && rawJson.EndsWith("\""))
                {
                    msg = System.Text.Json.JsonSerializer.Deserialize<string>(rawJson);
                }

                if (msg != null && msg.StartsWith("COPY_TEXT:"))
                {
                    string textToCopy = msg.Substring(10);
                    Application.Current.Dispatcher.InvokeAsync(async () =>
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
            }
            catch { }
        };

        string copyScript = @"
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
                    let text = '';
                    let activeEl = document.activeElement;
                    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
                        text = activeEl.value.substring(activeEl.selectionStart, activeEl.selectionEnd);
                    } else {
                        text = window.getSelection().toString();
                    }
                    if (text) {
                        window.chrome.webview.postMessage('COPY_TEXT:' + text);
                        e.preventDefault();
                    }
                }
            }, true);

            function isEditable(el) {
                if (!el) return false;
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return true;
                if (el.isContentEditable) return true;
                return false;
            }

            document.addEventListener('focusin', (e) => {
                if (isEditable(e.target)) {
                    window.bcFocusMemory = e.target;
                }
            }, true);
            
            document.addEventListener('mousedown', (e) => {
                window.bcIsMouseDown = true;
                window.bcLastMousedown = e.target;
                window.bcLastMousedownTime = Date.now();
                if (!isEditable(e.target)) {
                    window.bcFocusMemory = null;
                }
                
                let ic = document.getElementById('InputChat');
                if (ic) window.bcInputChatLastValue = ic.value;
            }, true);

            document.addEventListener('mouseup', (e) => {
                window.bcIsMouseDown = false;
                setTimeout(() => {
                    if (window.bcIsMouseDown) return;
                    let active = document.activeElement;
                    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable) && active.id !== 'InputChat') return;
                    if (window.getSelection().toString().length > 0) return;
                    
                    let best = window.bcRunFocusCrawler ? window.bcRunFocusCrawler() : null;
                    if (best && document.activeElement !== best) {
                        if (window.bcFocusAndTeleport) window.bcFocusAndTeleport(best);
                    }
                }, 50);
            });

            document.addEventListener('selectionchange', () => {
                if (window.bcSelectionTimeout) clearTimeout(window.bcSelectionTimeout);
                window.bcSelectionTimeout = setTimeout(() => {
                    let active = document.activeElement;
                    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable) && active.id !== 'InputChat') return;
                    if (window.getSelection().toString().length > 0) return;
                    
                    let best = window.bcRunFocusCrawler ? window.bcRunFocusCrawler() : null;
                    if (best && document.activeElement !== best) {
                        if (window.bcFocusAndTeleport) window.bcFocusAndTeleport(best);
                    }
                }, 200);
            });

            let origFocus = HTMLElement.prototype.focus;
            
            window.bcFocusAndTeleport = function(best) {
                let ic = document.getElementById('InputChat');
                let timeSinceMousedown = Date.now() - (window.bcLastMousedownTime || 0);
                if (ic && timeSinceMousedown < 1500) {
                    let lastVal = window.bcInputChatLastValue || '';
                    if (ic.value.startsWith(lastVal) && ic.value.length > lastVal.length) {
                        let leaked = ic.value.substring(lastVal.length);
                        if (best.tagName === 'INPUT' || best.tagName === 'TEXTAREA') {
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
                    if (el.disabled) continue;
                    if (el.offsetParent === null) continue;
                    let rect = el.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) continue;
                    
                    let style = window.getComputedStyle(el);
                    if (style.visibility === 'hidden' || style.opacity === '0' || style.display === 'none') continue;
                    
                    let z = getHighestZ(el);
                    let score = z * 1000;
                    
                    if (el.id === 'InputChat' || el.id === 'TextAreaChatLog') score -= 500000;
                    
                    if (el.tagName === 'TEXTAREA') score += 1000;
                    if (el.id && el.id.toLowerCase().indexOf('search') !== -1) score -= 2000;
                    if (el.className && el.className.toLowerCase().indexOf('search') !== -1) score -= 2000;
                    
                    if (window.bcFocusMemory === el) score += 1000000000;
                    
                    if (score > maxScore) { maxScore = score; bestInput = el; }
                }
                return bestInput;
            };

            let patchInterval = setInterval(() => {
                if (typeof window.ElementFocus === 'function' && !window.ElementFocus._isHooked) {
                    let origElementFocus = window.ElementFocus;
                    window.ElementFocus = function(ID) {
                        if (window.bcIsMouseDown) return;
                        let active = document.activeElement;
                        let isUserTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
                        if (isUserTyping && active.id !== ID) return;
                        if (window.getSelection().toString().length > 0) return;
                        origElementFocus(ID);
                    };
                    window.ElementFocus._isHooked = true;
                    clearInterval(patchInterval);
                }
            }, 200);

            HTMLElement.prototype.focus = function() {
                try {
                    if (this.id === 'InputChat') {
                        if (window.bcIsMouseDown) return;
                        
                        let active = document.activeElement;
                        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable) && active.id !== 'InputChat') {
                            return;
                        }
                        if (window.getSelection().toString().length > 0) {
                            return;
                        }

                        let best = window.bcRunFocusCrawler ? window.bcRunFocusCrawler() : null;
                        if (best && best !== this) {
                            if (window.bcFocusAndTeleport) {
                                window.bcFocusAndTeleport(best);
                                return;
                            }
                        }
                    }
                } catch(e) {}
                origFocus.call(this);
            };

            let focusObserver = new MutationObserver((mutations) => {
                let shouldCheck = false;
                for (let m of mutations) {
                    if (m.type === 'childList' && m.addedNodes.length > 0) shouldCheck = true;
                    if (m.type === 'attributes') shouldCheck = true;
                    if (shouldCheck) break;
                }
                
                if (shouldCheck) {
                    if (window.bcFocusTimeout) clearTimeout(window.bcFocusTimeout);
                    window.bcFocusTimeout = setTimeout(() => {
                        if (window.bcIsMouseDown) return;
                        
                        let active = document.activeElement;
                        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable) && active.id !== 'InputChat') {
                            return;
                        }
                        if (window.getSelection().toString().length > 0) {
                            return;
                        }

                        let best = window.bcRunFocusCrawler ? window.bcRunFocusCrawler() : null;
                        if (best && best.id !== 'InputChat' && document.activeElement !== best) {
                            if (window.bcFocusAndTeleport) window.bcFocusAndTeleport(best);
                        }
                    }, 50);
                }
            });
            focusObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });

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
                        text = activeEl.value.substring(activeEl.selectionStart, activeEl.selectionEnd);
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
            if (args.IsSuccess)
            {
                await core.ExecuteScriptAsync(copyScript);
            }
        };

        string scriptsDir = Path.Combine(AppContext.BaseDirectory, "Scripts");
        if (Directory.Exists(scriptsDir))
        {
            foreach (var file in Directory.GetFiles(scriptsDir, "*.js"))
            {
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
            DragMove();
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
                double percentHorizontal = currentPos.X / ActualWidth;
                
                _dragStart = null;
                WindowState = WindowState.Normal;
                
                Left = screenPos.X - (Width * percentHorizontal);
                Top = screenPos.Y - currentPos.Y;
                
                DragMove();
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

        WindowState = WindowState.Maximized;
        MaxRestoreBtn.Content = "\uE923";
        MaxRestoreBtn.ToolTip = "Restore";
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
                
                // AllowsTransparency="True" removes DWM borders. No need to subtract SM_CXFRAME.
                mmi.ptMaxPosition.X = (mi.rcWork.Left - mi.rcMonitor.Left);
                mmi.ptMaxPosition.Y = (mi.rcWork.Top - mi.rcMonitor.Top);
                mmi.ptMaxSize.X = (mi.rcWork.Right - mi.rcWork.Left);
                mmi.ptMaxSize.Y = (mi.rcWork.Bottom - mi.rcWork.Top);
                
                Marshal.StructureToPtr(mmi, lParam, true);
                handled = true;
            }
        }
        else if (msg == WM_WINDOWPOSCHANGING)
        {
            var wp = Marshal.PtrToStructure<WINDOWPOS>(lParam);
            if ((wp.flags & 0x0001) == 0) // SWP_NOSIZE = 0x0001
            {
                var monitor = MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST);
                var mi = new MONITORINFO { cbSize = Marshal.SizeOf<MONITORINFO>() };
                GetMonitorInfo(monitor, ref mi);

                bool isMaximized = (wp.cx >= (mi.rcWork.Right - mi.rcWork.Left)) && (wp.cy >= (mi.rcWork.Bottom - mi.rcWork.Top));

                if (!isMaximized)
                {
                    double dpi = VisualTreeHelper.GetDpi(this).DpiScaleY;
                    int titleBarHeight = (int)(32 * dpi);
                    
                    wp.cy = (wp.cx / 2) + titleBarHeight;
                    Marshal.StructureToPtr(wp, lParam, true);
                }
            }
        }
        return IntPtr.Zero;
    }

    private const int WM_GETMINMAXINFO       = 0x0024;
    private const int WM_WINDOWPOSCHANGING   = 0x0046;
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

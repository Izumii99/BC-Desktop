#pragma warning disable S2333, S1172
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

public partial class MainWindow // NOSONAR
{
    private bool _isFullscreen;
    private WindowState _previousWindowState = WindowState.Normal;
    private Point? _dragStart;

    private string? _lastBadgeText;
    private ImageSource? _lastBadgeImage;

    private static readonly Typeface BadgeTypeface = new(new FontFamily("Segoe UI"), FontStyles.Normal, FontWeights.Bold, FontStretches.Normal);
    private static readonly SolidColorBrush BadgeFillBrush = CreateFrozenBrush(Color.FromRgb(230, 39, 39));
    private static readonly Pen BadgeBorderPen = CreateFrozenPen();

    private async void MainWindow_Deactivated(object? sender, EventArgs e)
    {
        CancelActivation();
        CancelDeactivation();
        var cts = new CancellationTokenSource();
        _deactivationCts = cts;
        var token = cts.Token;

        try
        {
            await Task.Delay(3000, token);
            if (!token.IsCancellationRequested && WindowState != WindowState.Minimized && WebView.CoreWebView2 is { } core)
            {
                _lastThrottleState = 2;
                core.MemoryUsageTargetLevel = CoreWebView2MemoryUsageTargetLevel.Low;
                await core.ExecuteScriptAsync(ScriptHelpers.CapUnfocusedFpsScript);
                TrimWorkingSet();
            }
        }
        catch (OperationCanceledException)
        {
            // Ignored intentionally: deactivation delay canceled.
        }
        catch (Exception)
        {
            // Ignored intentionally: deactivation background throttle failed.
        }
    }

    private async void MainWindow_Activated(object? sender, EventArgs e)
    {
        CancelActivation();

        var cts = new CancellationTokenSource();
        _activationCts = cts;
        var token = cts.Token;

        try
        {
            await Task.Delay(100, token);
            if (token.IsCancellationRequested || !IsWindowActiveAndVisibleOnCurrentDesktop())
            {
                return;
            }

            CancelDeactivation();

            if (WebView.CoreWebView2 is { } core)
            {
                _lastThrottleState = 1;
                core.MemoryUsageTargetLevel = CoreWebView2MemoryUsageTargetLevel.Normal;
                _ = core.ExecuteScriptAsync(ScriptHelpers.RestoreUnfocusedFpsScript);
            }

            WebView.Focus();
            if (WebView.CoreWebView2 != null && IsWindowActiveAndVisibleOnCurrentDesktop())
            {
                const string smartFocusScript = @"
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
        catch (OperationCanceledException)
        {
            // Ignored intentionally: deactivation delay canceled.
        }
        catch (Exception)
        {
            // Ignored intentionally: deactivation background throttle failed.
        }
    }

    private void ToggleFullscreen()
    {
        _isFullscreen = !_isFullscreen;
        if (_isFullscreen)
        {
            _previousWindowState = WindowState;
            TitleBarRow.Height = new GridLength(0);
            TitleBarGrid.Visibility = Visibility.Collapsed;
            WindowState = WindowState.Maximized;
            WebView.Margin = new Thickness(0);
            if (WindowBorder != null)
            {
                WindowBorder.BorderThickness = new Thickness(0);
            }
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
        if (_isFullscreen)
        {
            return;
        }

        if (WindowState == WindowState.Maximized)
        {
            MaxRestoreBtn.Content = "\uE923";
            MaxRestoreBtn.ToolTip = "Restore";
            WebView.Margin = new Thickness(0);
            if (WindowBorder != null)
            {
                WindowBorder.BorderThickness = new Thickness(0);
            }
        }
        else if (WindowState == WindowState.Normal)
        {
            MaxRestoreBtn.Content = "\uE922";
            MaxRestoreBtn.ToolTip = "Maximize";
            WebView.Margin = new Thickness(5, 0, 5, 5);
            if (WindowBorder != null)
            {
                WindowBorder.BorderThickness = new Thickness(1);
            }
        }
    }

    private async void OnWindowStateChanged(object? sender, EventArgs e)
    {
        UpdateWindowStateUI();

        _ = sender;
        _ = e;
        if (WebView.CoreWebView2 is not { } core)
        {
            return;
        }

        try
        {
            if (WindowState == WindowState.Minimized)
            {
                _wasMinimized = true;
                CancelDeactivation();
                _wantsResume = false;
                core.MemoryUsageTargetLevel = CoreWebView2MemoryUsageTargetLevel.Low;
                await core.ExecuteScriptAsync("(()=>{window._bcIsMinimized=true;})()");
                await core.ExecuteScriptAsync(ScriptHelpers.CapUnfocusedFpsScript);

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
                        _ = core.ExecuteScriptAsync(ScriptHelpers.RestoreUnfocusedFpsScript);
                        return;
                    }
                }
                TrimWorkingSet();
            }
            else if (_wasMinimized)
            {
                _wasMinimized = false;
                _wantsResume = true;
                core.Resume();
                core.MemoryUsageTargetLevel = CoreWebView2MemoryUsageTargetLevel.Normal;
                _ = core.ExecuteScriptAsync(ScriptHelpers.RestoreUnfocusedFpsScript);
            }
        }
        catch (Exception)
        {
            // Ignored intentionally: window state change handling failed.
        }
    }

    private void ToggleMaximize()
    {
        WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;
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
            _dragStart = e.GetPosition(this);
        }
        else
        {
            try
            {
                DragMove();
            }
            catch (Exception)
            {
                // Ignored intentionally: title bar drag move failed.
            }
        }
    }

    private void TitleBar_MouseMove(object sender, MouseEventArgs e)
    {
        if (e.LeftButton == MouseButtonState.Pressed && _dragStart.HasValue)
        {
            HandleUnmaximizeDrag(e.GetPosition(this));
        }
    }

    private void HandleUnmaximizeDrag(Point currentPos)
    {
        if (!_dragStart.HasValue)
        {
            return;
        }

        Vector diff = currentPos - _dragStart.Value;
        if (Math.Abs(diff.X) <= SystemParameters.MinimumHorizontalDragDistance &&
            Math.Abs(diff.Y) <= SystemParameters.MinimumVerticalDragDistance)
        {
            return;
        }

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

        try
        {
            DragMove();
        }
        catch (Exception)
        {
            // Ignored intentionally: window state change handling failed.
        }
    }

    private void TitleBar_MouseLeftButtonUp(object sender, MouseButtonEventArgs e)
    {
        _dragStart = null;
    }

    private void TitleBar_MouseRightButtonUp(object sender, MouseButtonEventArgs e)
    {
        Point screenPoint = PointToScreen(e.GetPosition(this));
        SystemCommands.ShowSystemMenu(this, screenPoint);
    }

    private void MinimizeBtn_Click(object sender, RoutedEventArgs e) =>
        WindowState = WindowState.Minimized;

    private void MaxRestoreBtn_Click(object sender, RoutedEventArgs e) =>
        ToggleMaximize();

    private void CloseBtn_Click(object sender, RoutedEventArgs e) =>
        Close();

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

    [System.Diagnostics.CodeAnalysis.SuppressMessage("Major Code Smell", "S1172:Unused method parameters should be removed")]
    private void Core_DocumentTitleChanged(object? sender, object e) // NOSONAR
    {
        _ = sender;
        _ = e;
        if (WebView.CoreWebView2 is not { } core)
        {
            return;
        }

        string title = core.DocumentTitle;

        // Only update UI title if it's not hidden mode (where _originalTitleLabel is empty)
        if (!string.IsNullOrEmpty(_originalTitleLabel))
        {
            TitleLabel.Text = title;
            Title = title;
        }

        UpdateTaskbarBadgeAndNotification(title);
    }

    private void UpdateTaskbarBadgeAndNotification(string title)
    {
        var match = Regex.Match(title, @"^\((\d+)\)", RegexOptions.None, TimeSpan.FromSeconds(1));

        if (TaskbarItemInfo == null)
        {
            TaskbarItemInfo = new TaskbarItemInfo();
        }

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
                var info = new NativeMethods.FLASHWINFO
                {
                    cbSize = (uint)Marshal.SizeOf<NativeMethods.FLASHWINFO>(),
                    hwnd = new WindowInteropHelper(this).Handle,
                    dwFlags = NativeMethods.FLASHW_TRAY | NativeMethods.FLASHW_TIMERNOFG,
                    uCount = 3,
                    dwTimeout = 0
                };
                NativeMethods.FlashWindowEx(ref info);
            }
        }
        else
        {
            TaskbarItemInfo.Overlay = null;

            var info = new NativeMethods.FLASHWINFO
            {
                cbSize = (uint)Marshal.SizeOf<NativeMethods.FLASHWINFO>(),
                hwnd = new WindowInteropHelper(this).Handle,
                dwFlags = NativeMethods.FLASHW_STOP,
                uCount = 0,
                dwTimeout = 0
            };
            NativeMethods.FlashWindowEx(ref info);
        }
    }

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

    private IntPtr WndProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
    {
        if (msg == NativeMethods.WM_GETMINMAXINFO)
        {
            HandleGetMinMaxInfo(hwnd, lParam, ref handled);
            return IntPtr.Zero;
        }

        if (msg == 0x0214) // WM_SIZING
        {
            HandleSizing(wParam, lParam, ref handled);
            return IntPtr.Zero;
        }

        if (msg == 0x0084) // WM_NCHITTEST
        {
            return HandleNcHitTest(lParam, ref handled);
        }

        return IntPtr.Zero;
    }

    private void HandleGetMinMaxInfo(IntPtr hwnd, IntPtr lParam, ref bool handled)
    {
        var monitor = NativeMethods.MonitorFromWindow(hwnd, NativeMethods.MONITOR_DEFAULTTONEAREST);
        var mi = new NativeMethods.MONITORINFO { cbSize = Marshal.SizeOf<NativeMethods.MONITORINFO>() };
        if (!NativeMethods.GetMonitorInfo(monitor, ref mi))
        {
            return;
        }

        var mmi = Marshal.PtrToStructure<NativeMethods.MINMAXINFO>(lParam);

        mmi.ptMaxPosition.X = mi.rcWork.Left - mi.rcMonitor.Left;
        mmi.ptMaxPosition.Y = mi.rcWork.Top - mi.rcMonitor.Top;
        mmi.ptMaxSize.X = mi.rcWork.Right - mi.rcWork.Left;
        mmi.ptMaxSize.Y = mi.rcWork.Bottom - mi.rcWork.Top;

        double dpi = VisualTreeHelper.GetDpi(this).DpiScaleY;
        mmi.ptMinTrackSize.X = (int)(MinWidth * dpi);
        mmi.ptMinTrackSize.Y = (int)(MinHeight * dpi);

        Marshal.StructureToPtr(mmi, lParam, true);
        handled = true;
    }

    private void HandleSizing(IntPtr wParam, IntPtr lParam, ref bool handled)
    {
        var rect = Marshal.PtrToStructure<NativeMethods.RECT>(lParam);
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
            if (height < minPhysicalHeight)
            {
                height = minPhysicalHeight;
            }

            int expectedWidth = (height - titleBarHeight) * 2;
            if (expectedWidth < minPhysicalWidth)
            {
                expectedWidth = minPhysicalWidth;
            }

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
            if (width < minPhysicalWidth)
            {
                width = minPhysicalWidth;
            }

            int expectedHeight = (width / 2) + titleBarHeight;
            if (expectedHeight < minPhysicalHeight)
            {
                expectedHeight = minPhysicalHeight;
            }

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

    private IntPtr HandleNcHitTest(IntPtr lParam, ref bool handled)
    {
        if (WindowState == WindowState.Maximized)
        {
            return IntPtr.Zero;
        }

        int x = (short)(lParam.ToInt64() & 0xFFFF);
        int y = (short)((lParam.ToInt64() >> 16) & 0xFFFF);
        var p = PointFromScreen(new Point(x, y));

        const int border = 5;
        const int corner = 16;

        bool onLeft = p.X <= border;
        bool onRight = p.X >= ActualWidth - border;
        bool onTop = p.Y <= border;
        bool onBottom = p.Y >= ActualHeight - border;

        bool inLeftCorner = p.X <= corner;
        bool inRightCorner = p.X >= ActualWidth - corner;
        bool inTopCorner = p.Y <= corner;
        bool inBottomCorner = p.Y >= ActualHeight - corner;

        if ((onTop && inLeftCorner) || (onLeft && inTopCorner))
        {
            handled = true;
            return (IntPtr)13; // HTTOPLEFT
        }
        if ((onTop && inRightCorner) || (onRight && inTopCorner))
        {
            handled = true;
            return (IntPtr)14; // HTTOPRIGHT
        }
        if ((onBottom && inLeftCorner) || (onLeft && inBottomCorner))
        {
            handled = true;
            return (IntPtr)16; // HTBOTTOMLEFT
        }
        if ((onBottom && inRightCorner) || (onRight && inBottomCorner))
        {
            handled = true;
            return (IntPtr)17; // HTBOTTOMRIGHT
        }
        if (onTop)
        {
            handled = true;
            return (IntPtr)12; // HTTOP
        }
        if (onBottom)
        {
            handled = true;
            return (IntPtr)15; // HTBOTTOM
        }
        if (onLeft)
        {
            handled = true;
            return (IntPtr)10; // HTLEFT
        }
        if (onRight)
        {
            handled = true;
            return (IntPtr)11; // HTRIGHT
        }

        return IntPtr.Zero;
    }

    private bool IsWindowActiveAndVisibleOnCurrentDesktop()
    {
        if (!IsActive || WindowState == WindowState.Minimized)
        {
            return false;
        }

        var hwnd = new WindowInteropHelper(this).Handle;
        if (hwnd == IntPtr.Zero)
        {
            return false;
        }

        if (NativeMethods.GetForegroundWindow() != hwnd)
        {
            return false;
        }

        try
        {
            if (NativeMethods.DwmGetWindowAttribute(hwnd, NativeMethods.DWMWA_CLOAKED, out int cloaked, sizeof(int)) == 0 && cloaked != 0)
            {
                return false;
            }
        }
        catch (Exception)
        {
            // Ignored intentionally: DwmGetWindowAttribute query failed.
        }

        return true;
    }
}

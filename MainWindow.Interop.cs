using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Media;

namespace BCDesktop;

public partial class MainWindow
{
    private const int WM_GETMINMAXINFO = 0x0024;
    private const uint MONITOR_DEFAULTTONEAREST = 0x00000002;
    private const int DWMWA_CLOAKED = 14;

    private const uint FLASHW_STOP = 0;
    private const uint FLASHW_TRAY = 2;
    private const uint FLASHW_TIMERNOFG = 12;

    [DllImport("user32.dll")]
    private static extern IntPtr MonitorFromWindow(IntPtr hwnd, uint flags);

    [DllImport("user32.dll")]
    private static extern bool GetMonitorInfo(IntPtr hMon, ref MONITORINFO mi);

    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();

    [DllImport("dwmapi.dll")]
    private static extern int DwmGetWindowAttribute(IntPtr hwnd, int dwAttribute, out int pvAttribute, int cbAttribute);

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

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool FlashWindowEx(ref FLASHWINFO pwfi);

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
    private struct MONITORINFO : IEquatable<MONITORINFO>
    {
        public int cbSize;
        public RECT rcMonitor;
        public RECT rcWork;
        public uint dwFlags;

        public bool Equals(MONITORINFO other) =>
            cbSize == other.cbSize &&
            rcMonitor.Equals(other.rcMonitor) &&
            rcWork.Equals(other.rcWork) &&
            dwFlags == other.dwFlags;

        public override bool Equals(object? obj) => obj is MONITORINFO other && Equals(other);
        public override int GetHashCode() => HashCode.Combine(cbSize, rcMonitor, rcWork, dwFlags);
        public static bool operator ==(MONITORINFO left, MONITORINFO right) => left.Equals(right);
        public static bool operator !=(MONITORINFO left, MONITORINFO right) => !left.Equals(right);
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct RECT : IEquatable<RECT>
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;

        public bool Equals(RECT other) =>
            Left == other.Left &&
            Top == other.Top &&
            Right == other.Right &&
            Bottom == other.Bottom;

        public override bool Equals(object? obj) => obj is RECT other && Equals(other);
        public override int GetHashCode() => HashCode.Combine(Left, Top, Right, Bottom);
        public static bool operator ==(RECT left, RECT right) => left.Equals(right);
        public static bool operator !=(RECT left, RECT right) => !left.Equals(right);
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct MINMAXINFO : IEquatable<MINMAXINFO>
    {
        public POINT ptReserved;
        public POINT ptMaxSize;
        public POINT ptMaxPosition;
        public POINT ptMinTrackSize;
        public POINT ptMaxTrackSize;

        public bool Equals(MINMAXINFO other) =>
            ptReserved.Equals(other.ptReserved) &&
            ptMaxSize.Equals(other.ptMaxSize) &&
            ptMaxPosition.Equals(other.ptMaxPosition) &&
            ptMinTrackSize.Equals(other.ptMinTrackSize) &&
            ptMaxTrackSize.Equals(other.ptMaxTrackSize);

        public override bool Equals(object? obj) => obj is MINMAXINFO other && Equals(other);
        public override int GetHashCode() => HashCode.Combine(ptReserved, ptMaxSize, ptMaxPosition, ptMinTrackSize, ptMaxTrackSize);
        public static bool operator ==(MINMAXINFO left, MINMAXINFO right) => left.Equals(right);
        public static bool operator !=(MINMAXINFO left, MINMAXINFO right) => !left.Equals(right);
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct POINT : IEquatable<POINT>
    {
        public int X;
        public int Y;

        public bool Equals(POINT other) => X == other.X && Y == other.Y;
        public override bool Equals(object? obj) => obj is POINT other && Equals(other);
        public override int GetHashCode() => HashCode.Combine(X, Y);
        public static bool operator ==(POINT left, POINT right) => left.Equals(right);
        public static bool operator !=(POINT left, POINT right) => !left.Equals(right);
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct WINDOWPOS : IEquatable<WINDOWPOS>
    {
        public IntPtr hwnd;
        public IntPtr hwndInsertAfter;
        public int x;
        public int y;
        public int cx;
        public int cy;
        public uint flags;

        public bool Equals(WINDOWPOS other) =>
            hwnd == other.hwnd &&
            hwndInsertAfter == other.hwndInsertAfter &&
            x == other.x &&
            y == other.y &&
            cx == other.cx &&
            cy == other.cy &&
            flags == other.flags;

        public override bool Equals(object? obj) => obj is WINDOWPOS other && Equals(other);
        public override int GetHashCode() => HashCode.Combine(hwnd, hwndInsertAfter, HashCode.Combine(x, y, cx, cy, flags));
        public static bool operator ==(WINDOWPOS left, WINDOWPOS right) => left.Equals(right);
        public static bool operator !=(WINDOWPOS left, WINDOWPOS right) => !left.Equals(right);
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct FLASHWINFO : IEquatable<FLASHWINFO>
    {
        public uint cbSize;
        public IntPtr hwnd;
        public uint dwFlags;
        public uint uCount;
        public uint dwTimeout;

        public bool Equals(FLASHWINFO other) =>
            cbSize == other.cbSize &&
            hwnd == other.hwnd &&
            dwFlags == other.dwFlags &&
            uCount == other.uCount &&
            dwTimeout == other.dwTimeout;

        public override bool Equals(object? obj) => obj is FLASHWINFO other && Equals(other);
        public override int GetHashCode() => HashCode.Combine(cbSize, hwnd, dwFlags, uCount, dwTimeout);
        public static bool operator ==(FLASHWINFO left, FLASHWINFO right) => left.Equals(right);
        public static bool operator !=(FLASHWINFO left, FLASHWINFO right) => !left.Equals(right);
    }

    private IntPtr WndProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
    {
        if (msg == WM_GETMINMAXINFO)
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
        var monitor = MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST);
        var mi = new MONITORINFO { cbSize = Marshal.SizeOf<MONITORINFO>() };
        if (!GetMonitorInfo(monitor, ref mi))
        {
            return;
        }

        var mmi = Marshal.PtrToStructure<MINMAXINFO>(lParam);

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

        if (GetForegroundWindow() != hwnd)
        {
            return false;
        }

        try
        {
            if (DwmGetWindowAttribute(hwnd, DWMWA_CLOAKED, out int cloaked, sizeof(int)) == 0 && cloaked != 0)
            {
                return false;
            }
        }
        catch
        {
        }

        return true;
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
}


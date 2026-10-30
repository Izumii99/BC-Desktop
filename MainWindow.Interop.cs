using System.Runtime.InteropServices;

namespace BCDesktop;

internal static class NativeMethods
{
    internal const int WM_GETMINMAXINFO = 0x0024;
    internal const uint MONITOR_DEFAULTTONEAREST = 0x00000002;
    internal const int DWMWA_CLOAKED = 14;

    internal const uint FLASHW_STOP = 0;
    internal const uint FLASHW_TRAY = 2;
    internal const uint FLASHW_TIMERNOFG = 12;

    [DllImport("user32.dll")]
    internal static extern IntPtr MonitorFromWindow(IntPtr hwnd, uint flags);

    [DllImport("user32.dll")]
    internal static extern bool GetMonitorInfo(IntPtr hMon, ref MONITORINFO mi);

    [DllImport("user32.dll")]
    internal static extern IntPtr GetForegroundWindow();

    [DllImport("dwmapi.dll")]
    internal static extern int DwmGetWindowAttribute(IntPtr hwnd, int dwAttribute, out int pvAttribute, int cbAttribute);

    [DllImport("user32.dll", SetLastError = true)]
    internal static extern bool OpenClipboard(IntPtr hWndNewOwner);

    [DllImport("user32.dll")]
    internal static extern bool EmptyClipboard();

    [DllImport("user32.dll")]
    internal static extern IntPtr SetClipboardData(uint uFormat, IntPtr hMem);

    [DllImport("user32.dll")]
    internal static extern bool CloseClipboard();

    [DllImport("kernel32.dll")]
    internal static extern IntPtr GlobalAlloc(uint uFlags, UIntPtr dwBytes);

    [DllImport("kernel32.dll")]
    internal static extern IntPtr GlobalLock(IntPtr hMem);

    [DllImport("kernel32.dll")]
    internal static extern bool GlobalUnlock(IntPtr hMem);

    [DllImport("kernel32.dll")]
    internal static extern IntPtr GlobalFree(IntPtr hMem);

    [DllImport("kernel32.dll")]
    internal static extern IntPtr GetCurrentProcess();

    [DllImport("kernel32.dll")]
    internal static extern bool SetProcessWorkingSetSize(IntPtr hProcess, IntPtr dwMinimumWorkingSetSize, IntPtr dwMaximumWorkingSetSize);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    internal static extern bool FlashWindowEx(ref FLASHWINFO pwfi);

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
    internal struct MONITORINFO : IEquatable<MONITORINFO>
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
    internal struct RECT : IEquatable<RECT>
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
    internal struct MINMAXINFO : IEquatable<MINMAXINFO>
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
    internal struct POINT : IEquatable<POINT>
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
    internal struct WINDOWPOS : IEquatable<WINDOWPOS>
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
    internal struct FLASHWINFO : IEquatable<FLASHWINFO>
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

    internal static void TrimWorkingSet()
    {
        try
        {
            SetProcessWorkingSetSize(GetCurrentProcess(), (IntPtr)(-1), (IntPtr)(-1));
        }
        catch (Exception)
        {
            // Ignored intentionally: working set size trim failed.
        }
    }
}

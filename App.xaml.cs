using System.Runtime.InteropServices;
using System.Windows;

namespace BCDesktop;

public partial class App : Application
{
    [DllImport("shell32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern void SetCurrentProcessExplicitAppUserModelID(string appId);

    protected override void OnStartup(StartupEventArgs e)
    {
        // ponytail: kill old instances so a new launch guarantees the latest version check
        var current = System.Diagnostics.Process.GetCurrentProcess();
        foreach (var process in System.Diagnostics.Process.GetProcessesByName(current.ProcessName))
        {
            if (process.Id != current.Id)
            {
                try { process.Kill(); } catch { }
            }
        }

        SetCurrentProcessExplicitAppUserModelID("BCDesktop.Client");
        base.OnStartup(e);
    }
}

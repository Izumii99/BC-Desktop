#pragma warning disable S2333
using System.Runtime.InteropServices;
using System.Windows;

namespace BCDesktop;

public partial class App : Application // NOSONAR
{
    [DllImport("shell32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern void SetCurrentProcessExplicitAppUserModelID(string appId);

    protected override void OnStartup(StartupEventArgs e)
    {
        SetCurrentProcessExplicitAppUserModelID("BCDesktop.Client");
        base.OnStartup(e);
    }
}

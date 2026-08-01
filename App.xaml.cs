using System.Runtime.InteropServices;
using System.Windows;

namespace BondageClub;

public partial class App : Application
{
    [DllImport("shell32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern void SetCurrentProcessExplicitAppUserModelID(string appId);

    protected override void OnStartup(StartupEventArgs e)
    {
        SetCurrentProcessExplicitAppUserModelID("BondageClub.Client");
        base.OnStartup(e);
    }
}

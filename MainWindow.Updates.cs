using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;

namespace BCDesktop;

public partial class MainWindow
{
    internal const string BaseGameUrl = "https://www.bondage-asia.com/club/R{0}/";
    private static string _lastKnownGoodUrl = string.Format(BaseGameUrl, 132);
    private static string FallbackUrl => _lastKnownGoodUrl;

    internal const string CurrentAppVersion = "7.5.4";
    internal const string GitHubRepo = "Izumii99/BC-Desktop";
    internal static bool EnableAutoUpdates { get; set; } = true;
    private static string? _newReleaseUrl { get; set; }
    internal static string? _newReleaseDownloadUrl { get; set; }
    internal static string? _newReleaseTag { get; set; }
    internal static long? _newReleaseAssetSize { get; set; }
    internal static bool _isUpdating { get; set; }

    internal const string CurrentReleaseNotes =
        "• GPU Canvas Acceleration & 60 FPS Pacing: Hardware-accelerated 2D canvas rasterization and active 60 FPS pacing slash in-focus CPU usage on high-refresh displays (144Hz+).\n\n" +
        "• Room Texture Protection: Protected active character textures from flickering during maintenance, and immediately reclaim GPU canvas buffers on departure.\n\n" +
        "• Chat Log Virtualization: Modern CSS content-visibility virtualization renders only visible messages, eliminating scroll lag and GPU overhead.\n\n" +
        "• High-Polling Mouse Optimization: Passive pointer listeners deliver smooth responsiveness with 1000Hz+ gaming mice.\n\n" +
        "• Addon Memory & Rendering: Reclaimed temporary canvas allocations in petsuit animations and eliminated heavy text blur layers.\n\n" +
        "• Post-Update Changelog Window: Interactive changelog window now automatically introduces newly released features after each update.";

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
            if (!res.IsSuccessStatusCode)
            {
                return null;
            }

            string html = await res.Content.ReadAsStringAsync(cts.Token);

            // Extract the active Rxxx version number from official portal button
            var match = Regex.Match(html, @"onclick=""window\.location='https://www\.bondage[^']+/R(\d+)/[^']*'""", RegexOptions.IgnoreCase, TimeSpan.FromSeconds(1));
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
            catch
            {
            }
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

    internal static bool IsAutoUpdateEnabled()
    {
        if (!EnableAutoUpdates)
        {
            return false;
        }
        string scriptsDir = Path.Combine(AppContext.BaseDirectory, "Scripts");
        if (Directory.Exists(scriptsDir) && Directory.EnumerateFiles(scriptsDir, "*.js").Any())
        {
            return false;
        }
        return true;
    }

    internal static bool IsNewerVersion(string latestTag, string currentVersion)
    {
        if (string.IsNullOrWhiteSpace(latestTag) || string.IsNullOrWhiteSpace(currentVersion))
        {
            return false;
        }

        string cleanLatest = latestTag.Trim().TrimStart('v', 'V');
        string cleanCurrent = currentVersion.Trim().TrimStart('v', 'V');

        static string Normalize(string v)
        {
            var parts = v.Split('.');
            if (parts.Length == 1)
            {
                return $"{v}.0.0";
            }
            if (parts.Length == 2)
            {
                return $"{v}.0";
            }
            return v;
        }

        string normLatest = Normalize(cleanLatest);
        string normCurrent = Normalize(cleanCurrent);

        if (Version.TryParse(normLatest, out var vLatest) && Version.TryParse(normCurrent, out var vCurrent))
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
            if (l > c)
            {
                return true;
            }
            if (l < c)
            {
                return false;
            }
        }
        return false;
    }

    internal static string FormatReleaseNotesForDisplay(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return CurrentReleaseNotes;
        }
        string text = raw;

        int fixesIdx = text.IndexOf("### Fixes & Improvements:", StringComparison.OrdinalIgnoreCase);
        if (fixesIdx >= 0)
        {
            text = text.Substring(fixesIdx + "### Fixes & Improvements:".Length);
        }

        int downloadsIdx = text.IndexOf("### Downloads:", StringComparison.OrdinalIgnoreCase);
        if (downloadsIdx >= 0)
        {
            text = text.Substring(0, downloadsIdx);
        }

        text = Regex.Replace(text, @"^\s*-\s*\*\*([^*:]+?)(?:\*\*:|:\*\*|\*?:)\s*", "• $1: ", RegexOptions.Multiline, TimeSpan.FromSeconds(1));
        text = Regex.Replace(text, @"^\s*-\s*", "• ", RegexOptions.Multiline, TimeSpan.FromSeconds(1));
        text = text.Replace("`", "");

        return text.Trim();
    }

    internal static async Task<string> FetchLatestReleaseNotesAsync(HttpClient? httpClient = null)
    {
        try
        {
            using var http = httpClient != null ? null : new HttpClient { Timeout = TimeSpan.FromSeconds(3) };
            var client = httpClient ?? http!;
            if (client.DefaultRequestHeaders.UserAgent.Count == 0)
            {
                client.DefaultRequestHeaders.UserAgent.ParseAdd("BC-Desktop-Client");
            }

            string cdnUrl = $"https://cdn.jsdelivr.net/gh/{GitHubRepo}@main/RELEASE_NOTES.md";
            var res = await client.GetAsync(cdnUrl);
            if (res.IsSuccessStatusCode)
            {
                string raw = await res.Content.ReadAsStringAsync();
                if (!string.IsNullOrWhiteSpace(raw))
                {
                    return FormatReleaseNotesForDisplay(raw);
                }
            }
        }
        catch
        {
        }
        return CurrentReleaseNotes;
    }

    internal void ShowChangelogWindow(string version, string notes)
    {
        if (string.IsNullOrEmpty(_originalTitleLabel))
        {
            return;
        }

        var win = new Window
        {
            Title = $"What's New in v{version}",
            Width = 540,
            Height = 440,
            WindowStyle = WindowStyle.None,
            AllowsTransparency = true,
            Background = Brushes.Transparent,
            WindowStartupLocation = WindowStartupLocation.CenterOwner,
            Owner = this,
            ShowInTaskbar = false
        };

        var border = new System.Windows.Controls.Border
        {
            Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#141416")),
            BorderBrush = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#a855f7")),
            BorderThickness = new Thickness(1.5),
            CornerRadius = new CornerRadius(8),
            Padding = new Thickness(24)
        };

        var grid = new System.Windows.Controls.Grid();
        grid.RowDefinitions.Add(new System.Windows.Controls.RowDefinition { Height = GridLength.Auto });
        grid.RowDefinitions.Add(new System.Windows.Controls.RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
        grid.RowDefinitions.Add(new System.Windows.Controls.RowDefinition { Height = GridLength.Auto });

        var header = new System.Windows.Controls.TextBlock
        {
            Text = $"What's New in v{version}",
            FontSize = 18,
            FontWeight = FontWeights.Bold,
            Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#f3e8ff")),
            Margin = new Thickness(0, 0, 0, 16)
        };
        System.Windows.Controls.Grid.SetRow(header, 0);
        grid.Children.Add(header);

        var scroll = new System.Windows.Controls.ScrollViewer
        {
            VerticalScrollBarVisibility = System.Windows.Controls.ScrollBarVisibility.Auto,
            Margin = new Thickness(0, 0, 0, 16),
            Content = BuildChangelogContent(notes)
        };
        System.Windows.Controls.Grid.SetRow(scroll, 1);
        grid.Children.Add(scroll);

        var closeBtn = new System.Windows.Controls.Button
        {
            Content = "Got It!",
            Width = 100,
            Height = 32,
            HorizontalAlignment = HorizontalAlignment.Right,
            Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#7e22ce")),
            Foreground = Brushes.White,
            BorderThickness = new Thickness(0),
            Cursor = Cursors.Hand,
            FontWeight = FontWeights.SemiBold
        };
        closeBtn.Click += (_, _) => win.Close();
        System.Windows.Controls.Grid.SetRow(closeBtn, 2);
        grid.Children.Add(closeBtn);

        border.Child = grid;
        win.Content = border;
        win.ShowDialog();
    }

    private static System.Windows.Controls.StackPanel BuildChangelogContent(string notes)
    {
        var contentPanel = new System.Windows.Controls.StackPanel();
        var rawItems = notes.Split(new[] { "\r\n\r\n", "\n\n", "\r\r" }, StringSplitOptions.RemoveEmptyEntries);
        if (rawItems.Length <= 1)
        {
            rawItems = notes.Split(new[] { "\r\n", "\n", "\r" }, StringSplitOptions.RemoveEmptyEntries);
        }

        foreach (var rawItem in rawItems)
        {
            string line = rawItem.Trim();
            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            line = Regex.Replace(line, @"^[-•*]\s*", "", RegexOptions.None, TimeSpan.FromSeconds(1));

            var block = new System.Windows.Controls.TextBlock
            {
                FontSize = 13,
                LineHeight = 20,
                TextWrapping = TextWrapping.Wrap,
                Margin = new Thickness(0, 0, 0, 12)
            };

            var titleMatch = Regex.Match(line, @"^\s*\*\*?([^*:]+?)(?:\*\*:|:\*\*|\*?:)\s*(.*)$", RegexOptions.Singleline, TimeSpan.FromSeconds(1));

            if (titleMatch.Success)
            {
                string title = titleMatch.Groups[1].Value.Trim().Replace("**", "");
                string desc = titleMatch.Groups[2].Value.Trim().Replace("**", "").Replace("`", "");

                block.Inlines.Add(new System.Windows.Documents.Run("• ")
                {
                    Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#c084fc")),
                    FontWeight = FontWeights.Bold
                });
                block.Inlines.Add(new System.Windows.Documents.Run($"{title}: ")
                {
                    Foreground = Brushes.White,
                    FontWeight = FontWeights.SemiBold
                });
                block.Inlines.Add(new System.Windows.Documents.Run(desc)
                {
                    Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#d4d4d8"))
                });
            }
            else
            {
                string clean = line.Replace("**", "").Replace("`", "");
                block.Inlines.Add(new System.Windows.Documents.Run("• ")
                {
                    Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#c084fc")),
                    FontWeight = FontWeights.Bold
                });
                block.Inlines.Add(new System.Windows.Documents.Run(clean)
                {
                    Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#d4d4d8"))
                });
            }

            contentPanel.Children.Add(block);
        }
        return contentPanel;
    }

    internal void CheckPostUpdateChangelog()
    {
        if (string.IsNullOrEmpty(_originalTitleLabel))
        {
            return;
        }

        try
        {
            string dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "BCClient");
            Directory.CreateDirectory(dir);
            string versionFile = Path.Combine(dir, "last_seen_version.txt");

            if (File.Exists(versionFile))
            {
                string lastSeen = File.ReadAllText(versionFile).Trim();
                if (!string.IsNullOrEmpty(lastSeen) && IsNewerVersion(CurrentAppVersion, lastSeen))
                {
                    _ = Task.Run(async () =>
                    {
                        string notes = await FetchLatestReleaseNotesAsync();
                        await Dispatcher.InvokeAsync(() => ShowChangelogWindow(CurrentAppVersion, notes));
                    });
                }
            }
            File.WriteAllText(versionFile, CurrentAppVersion);
        }
        catch
        {
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
            catch
            {
            }
        }
        else
        {
            _ = Task.Run(async () =>
            {
                string notes = await FetchLatestReleaseNotesAsync();
                await Dispatcher.InvokeAsync(() => ShowChangelogWindow(CurrentAppVersion, notes));
            });
        }
    }

    private void TitleLabel_MouseLeftButtonUp(object sender, MouseButtonEventArgs e)
    {
        OpenReleaseNotesUrl();
    }

    private void VersionBadge_MouseLeftButtonUp(object sender, MouseButtonEventArgs e)
    {
        e.Handled = true;
        _ = Task.Run(async () =>
        {
            string notes = await FetchLatestReleaseNotesAsync();
            await Dispatcher.InvokeAsync(() => ShowChangelogWindow(CurrentAppVersion, notes));
        });
    }

    private void UpdateBadge_MouseRightButtonUp(object sender, MouseButtonEventArgs e)
    {
        e.Handled = true;
        _ = Task.Run(async () =>
        {
            string notes = await FetchLatestReleaseNotesAsync();
            await Dispatcher.InvokeAsync(() => ShowChangelogWindow(CurrentAppVersion, notes));
        });
    }

    private async void UpdateBadge_MouseLeftButtonUp(object sender, MouseButtonEventArgs e)
    {
        e.Handled = true;
        if (_isUpdating)
        {
            return;
        }
        if (UpdateBadgeText?.Text == "Update Failed")
        {
            OpenReleaseNotesUrl();
            return;
        }

        await PerformInstantUpdateAsync();
    }

    internal async Task CheckForAppUpdatesAsync(HttpClient? httpClient = null)
    {
        if (!IsAutoUpdateEnabled() || string.IsNullOrEmpty(_originalTitleLabel))
        {
            return;
        }

        try
        {
            using var http = httpClient != null ? null : new HttpClient { Timeout = TimeSpan.FromSeconds(3) };
            var client = httpClient ?? http!;
            if (client.DefaultRequestHeaders.UserAgent.Count == 0)
            {
                client.DefaultRequestHeaders.UserAgent.ParseAdd("BC-Desktop-Client");
            }

            using var res = await client.GetAsync($"https://api.github.com/repos/{GitHubRepo}/releases/latest");
            if (!res.IsSuccessStatusCode)
            {
                return;
            }

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
                    long? assetSize = null;
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
                                }
                                if (asset.TryGetProperty("size", out var sizeProp) && sizeProp.TryGetInt64(out var sVal))
                                {
                                    assetSize = sVal;
                                }
                                break;
                            }
                        }
                    }

                    if (string.IsNullOrEmpty(directDownloadUrl))
                    {
                        directDownloadUrl = $"https://github.com/{GitHubRepo}/releases/download/{tag}/{targetAssetName}";
                    }

                    Action applyUi = () =>
                    {
                        if (string.IsNullOrEmpty(_originalTitleLabel))
                        {
                            return;
                        }
                        _newReleaseUrl = htmlUrl;
                        _newReleaseDownloadUrl = directDownloadUrl;
                        _newReleaseTag = tag;
                        _newReleaseAssetSize = assetSize;

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

    internal async Task<bool> PerformInstantUpdateAsync(
        HttpClient? httpClient = null,
        string? targetExePath = null,
        Func<string, string, int, bool>? restartLauncher = null,
        long? minExpectedBytes = null)
    {
        if (!IsAutoUpdateEnabled() || _isUpdating)
        {
            return false;
        }
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
            await DownloadUpdateFileAsync(response, tempExe, totalBytes);

            long requiredMinBytes = minExpectedBytes ?? (httpClient != null ? 512 : 1024 * 1024);
            var fileInfo = new FileInfo(tempExe);
            ValidateDownloadedFile(fileInfo, requiredMinBytes, totalBytes);

            Action notifyRestart = () =>
            {
                if (UpdateBadgeText != null)
                {
                    UpdateBadgeText.Text = "Restarting...";
                    UpdateBadge.ToolTip = "Update ready. Relaunching application...";
                }
            };
            if (Dispatcher.CheckAccess())
            {
                notifyRestart();
            }
            else
            {
                await Dispatcher.InvokeAsync(notifyRestart);
            }

            int pid = Environment.ProcessId;
            bool launched = ExecuteRestartLauncher(restartLauncher, tempExe, currentExe, pid);

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
                if (File.Exists(tempExe))
                {
                    File.Delete(tempExe);
                }
            }
            catch
            {
            }

            Action showError = () =>
            {
                if (UpdateBadgeText != null)
                {
                    UpdateBadgeText.Text = "Update Failed";
                    UpdateBadge.ToolTip = $"Failed to install update: {ex.Message}\nClick to view releases on GitHub.";
                }
            };
            if (Dispatcher.CheckAccess())
            {
                showError();
            }
            else
            {
                await Dispatcher.InvokeAsync(showError);
            }
            return false;
        }
    }

    private async Task DownloadUpdateFileAsync(HttpResponseMessage response, string tempExe, long? totalBytes)
    {
        using var contentStream = await response.Content.ReadAsStreamAsync();
        using var fileStream = new FileStream(tempExe, FileMode.Create, FileAccess.Write, FileShare.None, 81920, true);
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
                    if (Dispatcher.CheckAccess())
                    {
                        updateText();
                    }
                    else
                    {
                        await Dispatcher.InvokeAsync(updateText);
                    }
                }
            }
        }
    }

    private static void ValidateDownloadedFile(FileInfo fileInfo, long requiredMinBytes, long? totalBytes)
    {
        if (!fileInfo.Exists || fileInfo.Length < requiredMinBytes)
        {
            throw new InvalidOperationException($"Downloaded update file is invalid or incomplete ({fileInfo.Length} bytes < required {requiredMinBytes} bytes).");
        }

        if (totalBytes.HasValue && totalBytes.Value > 0 && fileInfo.Length != totalBytes.Value)
        {
            throw new InvalidOperationException($"Downloaded update file size mismatch. Expected {totalBytes.Value} bytes from HTTP headers, but received {fileInfo.Length} bytes.");
        }

        if (_newReleaseAssetSize.HasValue && _newReleaseAssetSize.Value > 0 && fileInfo.Length != _newReleaseAssetSize.Value)
        {
            throw new InvalidOperationException($"Downloaded update file size mismatch. Expected {_newReleaseAssetSize.Value} bytes from release metadata, but received {fileInfo.Length} bytes.");
        }
    }

    private static bool ExecuteRestartLauncher(Func<string, string, int, bool>? restartLauncher, string tempExe, string currentExe, int pid)
    {
        if (restartLauncher != null)
        {
            return restartLauncher(tempExe, currentExe, pid);
        }

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
        return true;
    }
}


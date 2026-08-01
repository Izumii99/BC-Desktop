<RULE>
# Lightweight Cross-Platform Desktop Architecture

When the user asks about or plans to port a Windows-only desktop app (like WPF) to other operating systems (macOS, Linux), strictly adhere to the following principles:

1. **Avoid Electron by Default**: Do not recommend Electron unless explicitly requested, due to its heavy RAM usage, large app size, and Chromium duplication.
2. **Prioritize Native Webview Wrappers**: Recommend frameworks that utilize the OS's native webview (Edge WebView2, Safari WKWebView, WebKitGTK) to maintain a lightweight footprint.
3. **C# / .NET Migration**: If the user wants to maintain their existing C# backend but go cross-platform, recommend **Photino** as the primary lightweight alternative (or .NET MAUI Blazor Hybrid if official Microsoft support is prioritized).
4. **Other Languages**: If the user is open to other backend languages, recommend **Tauri** (Rust) or **Wails** (Go) as the gold standards for lightweight, cross-platform web-UI desktop applications.
</RULE>

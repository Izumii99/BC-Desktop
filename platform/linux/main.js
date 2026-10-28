const { app, BrowserWindow, Menu, session, dialog, clipboard, shell, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const child_process = require('child_process');

// Hidden mode: --hidden flag, BC_DISCREET=1, or the Hangul Filler productName injected by build.js
const isHidden = process.argv.includes('--hidden') ||
                 process.env.BC_DISCREET === '1' ||
                 app.getName() === '\u3164';

const CURRENT_APP_VERSION = app.getVersion();
const ENABLE_AUTO_UPDATES = !process.argv.includes('--no-update') && process.env.BC_NO_UPDATE !== '1';

function isAutoUpdateEnabled() {
    if (!ENABLE_AUTO_UPDATES) return false;
    const localScriptsDirs = [
        path.join(path.dirname(process.execPath), "Scripts"),
        path.join(__dirname, "Scripts"),
        path.resolve(__dirname, "../../Scripts")
    ];
    for (const dir of localScriptsDirs) {
        if (fs.existsSync(dir)) {
            const jsFiles = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'addon-manager.js');
            if (jsFiles.length > 0) return false;
        }
    }
    return true;
}

function isNewerVersion(latestTag, currentVersion) {
    if (!latestTag || !currentVersion) return false;
    const cleanLatest = latestTag.trim().replace(/^v/i, '');
    const cleanCurrent = currentVersion.trim().replace(/^v/i, '');
    const lParts = cleanLatest.split('.').map(p => parseInt(p, 10) || 0);
    const cParts = cleanCurrent.split('.').map(p => parseInt(p, 10) || 0);
    const maxLen = Math.max(lParts.length, cParts.length);
    for (let i = 0; i < maxLen; i++) {
        const l = lParts[i] || 0;
        const c = cParts[i] || 0;
        if (l > c) return true;
        if (l < c) return false;
    }
    return false;
}

let updateAvailableTag = null;
let updateDownloadUrl = null;
let isUpdating = false;

async function checkForAppUpdates() {
    if (!isAutoUpdateEnabled() || isHidden) return;
    try {
        const res = await fetch("https://api.github.com/repos/Izumii99/BC-Desktop/releases/latest", {
            headers: { "User-Agent": "BC-Desktop-Linux" }
        });
        if (!res.ok) return;
        const data = await res.json();
        const latestTag = (data.tag_name || "").trim();
        if (isNewerVersion(latestTag, CURRENT_APP_VERSION)) {
            updateAvailableTag = latestTag.replace(/^v/i, '');

            const isAppImage = Boolean(process.env.APPIMAGE);
            const targetAssetName = isAppImage ? "BC-Linux.AppImage" : "BC-Linux.tar.gz";

            if (Array.isArray(data.assets)) {
                const asset = data.assets.find(a => a && a.name && a.name.toLowerCase() === targetAssetName.toLowerCase());
                if (asset && asset.browser_download_url) {
                    updateDownloadUrl = asset.browser_download_url;
                }
            }
            if (!updateDownloadUrl) {
                updateDownloadUrl = `https://github.com/Izumii99/BC-Desktop/releases/download/v${updateAvailableTag}/${targetAssetName}`;
            }

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.setTitle(`Bondage Club — Update Available (v${updateAvailableTag})`);
            }

            promptUpdateDialog(updateAvailableTag, updateDownloadUrl, isAppImage);
        }
    } catch (_) {}
}

const FALLBACK_LINUX_RELEASE_NOTES =
    "• GPU Canvas Acceleration & 60 FPS Pacing: Hardware-accelerated 2D canvas rasterization and active 60 FPS pacing slash in-focus CPU usage on high-refresh displays (144Hz+).\n\n" +
    "• Room Texture Protection: Protected active character textures from flickering during maintenance, and immediately reclaim GPU canvas buffers on departure.\n\n" +
    "• Chat Log Virtualization: Modern CSS content-visibility virtualization renders only visible messages, eliminating scroll lag and GPU overhead.\n\n" +
    "• High-Polling Mouse Optimization: Passive pointer listeners deliver smooth responsiveness with 1000Hz+ gaming mice.\n\n" +
    "• Addon Memory & Rendering: Reclaimed temporary canvas allocations in petsuit animations and eliminated heavy text blur layers.\n\n" +
    "• Post-Update Changelog Window: Interactive changelog window now automatically introduces newly released features after each update.";

async function fetchLatestReleaseNotesLinux() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch("https://cdn.jsdelivr.net/gh/Izumii99/BC-Desktop@main/RELEASE_NOTES.md", {
            signal: controller.signal,
            headers: { "User-Agent": "BC-Desktop-Linux" }
        });
        clearTimeout(timeout);
        if (res.ok) {
            let text = await res.text();
            if (text && text.trim()) {
                let fixesIdx = text.indexOf("### Fixes & Improvements:");
                if (fixesIdx >= 0) text = text.substring(fixesIdx + "### Fixes & Improvements:".length);
                let dlIdx = text.indexOf("### Downloads:");
                if (dlIdx >= 0) text = text.substring(0, dlIdx);
                text = text.replace(/^\s*-\s*\*\*([^*:]+?)(?:\*\*:|:\*\*|\*?:)\s*/gm, "• $1: ")
                           .replace(/^\s*-\s*/gm, "• ")
                           .replace(/`/g, "");
                return text.trim();
            }
        }
    } catch (_) {}
    return FALLBACK_LINUX_RELEASE_NOTES;
}

function checkPostUpdateChangelog() {
    if (isHidden) return;
    try {
        const versionFile = path.join(app.getPath('userData'), 'last_seen_version.txt');
        let lastSeen = null;
        if (fs.existsSync(versionFile)) {
            lastSeen = fs.readFileSync(versionFile, 'utf8').trim();
        }
        fs.writeFileSync(versionFile, CURRENT_APP_VERSION, 'utf8');

        if (lastSeen && isNewerVersion(CURRENT_APP_VERSION, lastSeen)) {
            setTimeout(async () => {
                if (!mainWindow || mainWindow.isDestroyed()) return;
                const notes = await fetchLatestReleaseNotesLinux();
                dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: `What's New in v${CURRENT_APP_VERSION}`,
                    message: `Bondage Club updated to v${CURRENT_APP_VERSION}!`,
                    detail: notes,
                    buttons: ['Got It!'],
                    defaultId: 0
                });
            }, 1200);
        }
    } catch (_) {}
}

function promptUpdateDialog(tag, downloadUrl, isAppImage) {
    if (!isAutoUpdateEnabled() || isUpdating || isHidden) return;

    const iconName = isHidden ? "transparent.png" : "app_logo.png";
    const iconCandidates = [
        path.resolve(__dirname, "../../Assets", iconName),
        path.join(__dirname, "assets", iconName),
        path.join(process.resourcesPath || "", "assets", iconName)
    ];
    const iconPath = iconCandidates.find(p => fs.existsSync(p));

    if (Notification && Notification.isSupported()) {
        const notif = new Notification({
            title: `Bondage Club Update Available (v${tag})`,
            body: 'Click here to automatically update and restart the application.',
            icon: iconPath
        });
        notif.on('click', () => {
            performInstantUpdateLinux(tag, downloadUrl, isAppImage);
        });
        notif.show();
    }

    setTimeout(async () => {
        if (!mainWindow || mainWindow.isDestroyed() || !isAutoUpdateEnabled() || isUpdating) return;
        const result = await dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: `A new version of Bondage Club (v${tag}) is available.`,
            detail: `Would you like to instantly download and install the update now? (${isAppImage ? 'AppImage' : 'tar.gz'})`,
            buttons: ['Update Now', 'View Release Notes', 'Later'],
            defaultId: 0,
            cancelId: 2,
            noLink: true
        });

        if (result.response === 0) {
            await performInstantUpdateLinux(tag, downloadUrl, isAppImage);
        } else if (result.response === 1) {
            shell.openExternal(`https://github.com/Izumii99/BC-Desktop/releases/latest`);
        }
    }, 2500);
}

async function performInstantUpdateLinux(tag, downloadUrl, isAppImage) {
    if (!isAutoUpdateEnabled() || isUpdating) return;
    isUpdating = true;

    const tempFileName = `bc-update-${Date.now()}-${isAppImage ? 'appimage' : 'tar.gz'}`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);

    try {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.setTitle(`Bondage Club — Downloading update (0%)...`);
            mainWindow.setProgressBar(0);
        }

        const response = await fetch(downloadUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        const contentLength = Number(response.headers.get('content-length')) || 0;
        const fileStream = fs.createWriteStream(tempFilePath);

        let receivedBytes = 0;
        let lastReportedPercent = -1;

        const reader = response.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fileStream.write(Buffer.from(value));
            receivedBytes += value.length;

            if (contentLength > 0) {
                const percent = Math.floor((receivedBytes / contentLength) * 100);
                if (percent !== lastReportedPercent) {
                    lastReportedPercent = percent;
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.setTitle(`Bondage Club — Downloading update (${percent}%)...`);
                        mainWindow.setProgressBar(percent / 100);
                    }
                }
            }
        }

        await new Promise((resolve, reject) => {
            fileStream.end(resolve);
            fileStream.on('error', reject);
        });

        const stats = fs.statSync(tempFilePath);
        if (stats.size < 1024 * 1024) {
            throw new Error("Downloaded update file is invalid or incomplete.");
        }

        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.setTitle("Bondage Club — Installing update and restarting...");
            mainWindow.setProgressBar(1.0);
        }

        if (isAppImage) {
            const targetAppImage = process.env.APPIMAGE;
            if (!targetAppImage || !fs.existsSync(targetAppImage)) {
                throw new Error("Cannot locate running AppImage path (process.env.APPIMAGE is not set).");
            }

            fs.chmodSync(tempFilePath, 0o755);

            try {
                fs.renameSync(tempFilePath, targetAppImage);
            } catch (err) {
                if (err.code === 'EXDEV') {
                    fs.copyFileSync(tempFilePath, targetAppImage);
                    fs.unlinkSync(tempFilePath);
                } else {
                    throw err;
                }
            }

            const child = child_process.spawn(targetAppImage, process.argv.slice(1), {
                detached: true,
                stdio: 'ignore'
            });
            child.unref();
            app.quit();
        } else {
            const appDir = path.dirname(process.execPath);
            const tempExtractDir = path.join(os.tmpdir(), `bc-extract-${Date.now()}`);
            fs.mkdirSync(tempExtractDir, { recursive: true });

            const extractRes = child_process.spawnSync('tar', ['-xzf', tempFilePath, '-C', tempExtractDir]);
            if (extractRes.error) {
                throw extractRes.error;
            }

            let sourceDir = tempExtractDir;
            if (!fs.existsSync(path.join(tempExtractDir, 'resources'))) {
                const subdirs = fs.readdirSync(tempExtractDir).map(n => path.join(tempExtractDir, n)).filter(p => fs.statSync(p).isDirectory());
                const matching = subdirs.find(p => fs.existsSync(path.join(p, 'resources')));
                if (matching) sourceDir = matching;
            }

            if (typeof fs.cpSync === 'function') {
                fs.cpSync(sourceDir, appDir, { recursive: true, force: true });
            } else {
                child_process.spawnSync('cp', ['-rf', path.join(sourceDir, '.'), appDir]);
            }

            try { fs.rmSync(tempExtractDir, { recursive: true, force: true }); } catch (_) {}
            try { fs.unlinkSync(tempFilePath); } catch (_) {}

            const child = child_process.spawn(process.execPath, process.argv.slice(1), {
                detached: true,
                stdio: 'ignore'
            });
            child.unref();
            app.quit();
        }
    } catch (err) {
        isUpdating = false;
        try { if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); } catch (_) {}
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.setProgressBar(-1);
            mainWindow.setTitle(`Bondage Club — Update Available (v${tag})`);
            dialog.showMessageBox(mainWindow, {
                type: 'error',
                title: 'Update Failed',
                message: 'Failed to automatically install the update.',
                detail: `${err.message}\n\nYou can manually download the update from GitHub Releases.`,
                buttons: ['Open GitHub Releases', 'Dismiss'],
                defaultId: 0
            }).then(r => {
                if (r.response === 0) {
                    shell.openExternal(`https://github.com/Izumii99/BC-Desktop/releases/latest`);
                }
            });
        }
    }
}

let lastKnownGoodUrl = "https://www.bondage-asia.com/club/R132/";

// 1. Match Chromium & Memory Optimization Flags with WebView2 on Windows
app.commandLine.appendSwitch('disable-features', 'Translate,OptimizationHints,MediaRouter,DialMediaRouteProvider,SpareRendererForSitePerProcess,AudioServiceOutOfProcess,AutofillServerCommunication');
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-component-update');
app.commandLine.appendSwitch('disable-domain-reliability');
app.commandLine.appendSwitch('disable-sync');
app.commandLine.appendSwitch('disable-notifications');
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('no-pings');
app.commandLine.appendSwitch('max-gum-fps', '60');
app.commandLine.appendSwitch('gpu-rasterization-msaa-sample-count', '0');
app.commandLine.appendSwitch('force-gpu-mem-available-mb', '384');
app.commandLine.appendSwitch('force-gpu-mem-discardable-limit-mb', '128');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=512 --expose-gc');

function handleWebMessage(msg) {
    if (typeof msg !== 'string') return;
    if (msg.startsWith('COPY_TEXT:')) {
        const textToCopy = msg.substring(10);
        clipboard.writeText(textToCopy);
    } else if (msg === 'TOGGLE_FULLSCREEN') {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }
    }
}

// Throttling script: caps FPS to 15 and triggers GC when window is unfocused (matches Windows behavior)
const CapUnfocusedFpsScript =
    "(()=>{" +
    "window._bcIsBackground=true;" +
    "const g=window.Player&&Player.GraphicsSettings;" +
    "if(g&&!g.MaxUnfocusedFPS&&window.CurrentScreen!=='Preference'){g.MaxUnfocusedFPS=15;window.bcFpsCap=g;}" +
    "if(!window.__bcDrawHooked&&typeof window.DrawProcess==='function'){" +
    "window.__bcDrawHooked=true;" +
    "if(!document.__bcOrigHasFocus&&typeof document.hasFocus==='function'){" +
    "document.__bcOrigHasFocus=document.hasFocus;" +
    "document.hasFocus=function(){if(window._bcIsBackground)return false;return document.__bcOrigHasFocus.apply(this,arguments);};" +
    "}" +
    "const _origDraw=window.DrawProcess;" +
    "let _lastBgDrawTime=0;" +
    "window.DrawProcess=function(ts){" +
    "if(window._bcIsMinimized)return;" +
    "if(window._bcIsBackground){" +
    "const now=typeof ts==='number'?ts:performance.now();" +
    "if(now-_lastBgDrawTime<66)return;" +
    "_lastBgDrawTime=now;" +
    "}" +
    "return _origDraw.apply(this,arguments);" +
    "};" +
    "}" +
    "if(window.bcFocusMemory&&!window.bcFocusMemory.isConnected)window.bcFocusMemory=null;" +
    "if(window.bcLastMousedown&&!window.bcLastMousedown.isConnected)window.bcLastMousedown=null;" +
    "if(window.bcLastFocusedLayer&&!window.bcLastFocusedLayer.isConnected)window.bcLastFocusedLayer=null;" +
    "const now=Date.now();" +
    "if(typeof window.gc==='function'&&(!window._bcLastGc||now-window._bcLastGc>60000)){window._bcLastGc=now;try{window.gc();}catch(e){}}" +
    "})()";

const RestoreUnfocusedFpsScript =
    "(()=>{window._bcIsBackground=false;window._bcIsMinimized=false;const g=window.bcFpsCap;if(g){if(g.MaxUnfocusedFPS===15)g.MaxUnfocusedFPS=0;window.bcFpsCap=null;}})()";

const SmartFocusRestoreScript = `
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
`;

// Smart Focus, Enter-to-Chat, and clipboard management scripts (matches Windows behavior)
const CopyAndFocusScript = `
(() => {
    if (window.__bcCopyScriptInitialized) return;
    window.__bcCopyScriptInitialized = true;

    if (!window.chrome) window.chrome = {};
    if (!window.chrome.webview) {
        window.chrome.webview = {
            postMessage: function(msg) {
                console.log('__BC_BRIDGE__:' + (typeof msg === 'string' ? msg : JSON.stringify(msg)));
            }
        };
    }

    let origFocus = HTMLElement.prototype.focus;

    const _attachDrawHookLinux = () => {
        if (window.__bcDrawHooked) return true;
        if (typeof window.DrawProcess !== 'function') return false;
        window.__bcDrawHooked = true;
        if (!document.__bcOrigHasFocus && typeof document.hasFocus === 'function') {
            document.__bcOrigHasFocus = document.hasFocus;
            document.hasFocus = function() {
                if (window._bcIsBackground) return false;
                return document.__bcOrigHasFocus.apply(this, arguments);
            };
        }

        const _origDrawLinux = window.DrawProcess;
        let _lastBgDrawTime = 0;
        window.DrawProcess = function(ts) {
            if (window._bcIsMinimized) return;
            if (window._bcIsBackground) {
                const now = typeof ts === 'number' ? ts : performance.now();
                if (now - _lastBgDrawTime < 66) return;
                _lastBgDrawTime = now;
            }
            if (typeof _origDrawLinux === 'function') return _origDrawLinux.apply(this, arguments);
        };
        return true;
    };

    if (!_attachDrawHookLinux() && !window._bcDrawHookTimer) {
        window._bcDrawHookTimer = setInterval(() => {
            if (_attachDrawHookLinux()) {
                clearInterval(window._bcDrawHookTimer);
                window._bcDrawHookTimer = null;
            }
        }, 200);
    }

    function isTextInput(el) {
        if (!el) return false;
        if (el.tagName === 'TEXTAREA' || el.isContentEditable) return true;
        if (el.tagName === 'INPUT') {
            let type = (el.type || 'text').toLowerCase();
            return type === 'text' || type === 'search' || type === 'password' || 
                   type === 'email' || type === 'number' || type === 'url' || type === 'tel';
        }
        return false;
    }

    function isInteractive(el) {
        if (!el) return false;
        if (isTextInput(el)) return true;
        let tag = el.tagName;
        return tag === 'INPUT' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'OPTION' || tag === 'BC-TINT-INPUT';
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'F11' || e.keyCode === 122) {
            window.chrome.webview.postMessage('TOGGLE_FULLSCREEN');
            e.preventDefault();
            return;
        }

        let isEnter = (e.key === 'Enter' || e.keyCode === 13);
        if (isEnter) {
            let ic = document.getElementById('InputChat');
            let active = document.activeElement;
            let isInsideInputChat = ic && (active === ic || e.target === ic);

            if (isInsideInputChat) {
                if (e.shiftKey) {
                    window.bcFocusMemory = ic;
                }
            } else if (isInteractive(active) || isInteractive(e.target)) {
                return;
            } else {
                if (ic && (ic.offsetParent !== null || ic.offsetWidth > 0)) {
                    e.preventDefault();
                    try {
                        let sel = window.getSelection ? window.getSelection() : null;
                        if (sel) {
                            if (sel.removeAllRanges) sel.removeAllRanges();
                            if (sel.empty) sel.empty();
                        }
                    } catch (err) {}

                    window.bcFocusMemory = ic;
                    origFocus.call(ic);
                    try {
                        let len = ic.value ? ic.value.length : 0;
                        ic.setSelectionRange(len, len);
                    } catch(err) {}
                }
            }
        }

        if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.code === 'KeyC')) {
            let text = '';
            let activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
                try {
                    if (activeEl.selectionStart !== null && activeEl.selectionStart !== undefined) {
                        text = activeEl.value.substring(activeEl.selectionStart, activeEl.selectionEnd);
                    } else {
                        text = activeEl.value;
                    }
                } catch (_) {
                    text = activeEl.value;
                }
            } else {
                text = window.getSelection().toString();
            }
            if (text) {
                window.chrome.webview.postMessage('COPY_TEXT:' + text);
                e.preventDefault();
            }
        }
    }, true);

    function isChatArea(el) {
        if (!el) return false;
        if (el.id === 'InputChat') return true;
        if (el.closest && el.closest('#chat-room-bot, #chat-room-div, #chat-room-main')) return true;
        return false;
    }

    function getAddonContainer(el) {
        if (!el || el === document.body || el === document.documentElement) return null;
        let curr = el;
        while (curr && curr !== document.body && curr !== document.documentElement) {
            let rawId = curr.id || '';
            if (rawId === 'chat-room-bot' || rawId === 'chat-room-div' || rawId === 'chat-room-main' ||
                rawId === 'InputChat' || rawId === 'TextAreaChatLog' || rawId === 'MainCanvas') return null;
            
            let id = rawId.toLowerCase();
            let cls = (typeof curr.className === 'string' ? curr.className : '').toLowerCase();
            
            if (id === 'descriptioninput' || id.startsWith('preference') || cls.includes('preference') || cls.includes('scroll-box')) return null;

            // Mencakup LianChat (lc-, lian, bcmod), LCE, BCX, FUSAM, BCOM, dan modal/floating UI
            if (id.startsWith('lce-') || cls.includes('lce-') ||
                id.startsWith('lc-') || cls.includes('lc-') ||
                id.includes('lian') || cls.includes('lian') ||
                id.includes('bcmod') || cls.includes('bcmod') ||
                id.includes('bcx') || cls.includes('bcx') ||
                id.includes('fusam') || cls.includes('fusam') ||
                id.includes('bcom') || cls.includes('bcom') ||
                id.includes('modal') || cls.includes('modal') ||
                id.includes('dialog') || cls.includes('dialog') ||
                id.includes('floating') || cls.includes('floating') ||
                id.includes('im') || cls.includes('im')) {
                return curr;
            }
            
            let style = window.getComputedStyle(curr);
            let pos = style.position;
            if (pos === 'fixed' || pos === 'absolute') {
                let z = parseInt(style.zIndex, 10);
                if (!isNaN(z) && z >= 1) {
                    return curr;
                }
            }
            curr = curr.parentElement;
        }
        return null;
    }

    function isElementVisibleAndActive(el) {
        if (!el || !el.isConnected || el.disabled || el.readOnly) return false;
        if (el.offsetWidth === 0 && el.offsetHeight === 0) {
            let rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return false;
        }
        let style = window.getComputedStyle(el);
        return style.visibility !== 'hidden' && style.opacity !== '0' && style.display !== 'none';
    }

    let lastCrawlerCache = null;
    let lastCrawlerTime = 0;
    function getActiveAddonInputStrict() {
        if (window.bcFocusMemory && window.bcFocusMemory.id !== 'InputChat' && isElementVisibleAndActive(window.bcFocusMemory)) {
            return window.bcFocusMemory;
        }
        let now = Date.now();
        if (now - lastCrawlerTime > 150) {
            lastCrawlerTime = now;
            lastCrawlerCache = window.bcRunFocusCrawler ? window.bcRunFocusCrawler() : null;
        } else if (lastCrawlerCache && !isElementVisibleAndActive(lastCrawlerCache)) {
            lastCrawlerCache = window.bcRunFocusCrawler ? window.bcRunFocusCrawler() : null;
        }
        if (lastCrawlerCache && lastCrawlerCache.id !== 'InputChat') {
            return lastCrawlerCache;
        }
        return null;
    }

    document.addEventListener('focusin', (e) => {
        if (isInteractive(e.target)) {
            if (isChatArea(e.target)) {
                let clickedChatRecently = window.bcLastMousedown && isChatArea(window.bcLastMousedown) && (Date.now() - (window.bcLastMousedownTime || 0) < 500);
                if (clickedChatRecently || !getActiveAddonInputStrict()) {
                    window.bcUserPrefersGameChat = true;
                    window.bcFocusMemory = e.target;
                }
            } else {
                window.bcFocusMemory = e.target;
                window.bcUserPrefersGameChat = false;
                window.bcForceUnfocusSearch = false;
            }
        }
    }, true);
    
    document.addEventListener('pointerdown', () => { window.bcIsMouseDown = true; }, { capture: true, passive: true });
    document.addEventListener('pointerup', () => { window.bcIsMouseDown = false; }, { capture: true, passive: true });
    document.addEventListener('mousemove', (e) => {
        if (e.buttons !== undefined) window.bcIsMouseDown = (e.buttons > 0);
    }, { capture: true, passive: true });
    window.addEventListener('blur', () => { window.bcIsMouseDown = false; });

    document.addEventListener('mousedown', (e) => {
        window.bcIsMouseDown = true;
        window.bcLastMousedown = e.target;
        window.bcLastMousedownTime = Date.now();
        window.bcMouseDownX = e.clientX;
        window.bcMouseDownY = e.clientY;
        
        let ic = document.getElementById('InputChat');
        let addonBox = getAddonContainer(e.target);
        
        if (ic && isChatArea(e.target)) {
            window.bcUserPrefersGameChat = true;
            window.bcFocusMemory = ic;
            window.bcForceUnfocusSearch = false;
        } else if (addonBox) {
            window.bcUserPrefersGameChat = false;
            window.bcForceUnfocusSearch = false;
            if (isInteractive(e.target)) {
                window.bcFocusMemory = e.target;
            } else {
                let targetInput = addonBox.querySelector('textarea:not([disabled]):not([readonly]), input[type=text]:not([disabled]):not([readonly]), input[type=search]:not([disabled]):not([readonly]), input:not([type]):not([disabled]):not([readonly])');
                if (targetInput) {
                    window.bcFocusMemory = targetInput;
                }
            }
        } else if (isInteractive(e.target)) {
            window.bcFocusMemory = e.target;
            window.bcForceUnfocusSearch = false;
            window.bcUserPrefersGameChat = false;
        } else {
            window.bcFocusMemory = null;
            window.bcForceUnfocusSearch = false;
        }
        
        if (ic) window.bcInputChatLastValue = ic.value;
    }, true);

    document.addEventListener('mouseup', (e) => {
        window.bcIsMouseDown = false;
        let moveDist = Math.hypot((e.clientX || 0) - (window.bcMouseDownX || 0), (e.clientY || 0) - (window.bcMouseDownY || 0));
        let isDraggingSelection = moveDist > 5;

        setTimeout(() => {
            if (window.bcIsMouseDown) return;
            let sel = window.getSelection ? window.getSelection() : null;
            if (isDraggingSelection || (sel && (!sel.isCollapsed || sel.toString().length > 0))) return;

            let active = document.activeElement;
            if (active && isInteractive(active)) {
                window.bcFocusMemory = active;
                return;
            }
            if (window.bcForceUnfocusSearch) return;

            if (e.target && e.target.closest && e.target.closest('.scroll-box, [id^="preference-"], .preference-settings-grid, select, option, fieldset[name="color-picker"], #color-picker, .color-picker, bc-tint-input, input[type="range"]')) {
                return;
            }
            
            let target = (window.bcFocusMemory && isElementVisibleAndActive(window.bcFocusMemory)) 
                ? window.bcFocusMemory 
                : (window.bcRunFocusCrawler ? window.bcRunFocusCrawler() : null);
            if (target && document.activeElement !== target) {
                origFocus.call(target);
            }
        }, 50);
    });

    document.addEventListener('selectionchange', () => {
        if (window.bcSelectionTimeout) clearTimeout(window.bcSelectionTimeout);
        window.bcSelectionTimeout = setTimeout(() => {
            if (window.bcIsMouseDown) return;
            if ((Date.now() - (window.bcLastMousedownTime || 0)) < 400) return;
            let active = document.activeElement;
            if (active && isInteractive(active)) return;
            if (window.getSelection().toString().length > 0) return;
            if (window.bcForceUnfocusSearch) return;
            
            let target = (window.bcFocusMemory && isElementVisibleAndActive(window.bcFocusMemory)) 
                ? window.bcFocusMemory 
                : (window.bcRunFocusCrawler ? window.bcRunFocusCrawler() : null);
            if (target && document.activeElement !== target) {
                origFocus.call(target);
            }
        }, 200);
    });
    
    window.bcFocusAndTeleport = function(best) {
        let ic = document.getElementById('InputChat');
        let timeSinceMousedown = Date.now() - (window.bcLastMousedownTime || 0);
        if (ic && timeSinceMousedown < 1500) {
            let lastVal = window.bcInputChatLastValue || '';
            if (ic.value.startsWith(lastVal) && ic.value.length > lastVal.length) {
                let leaked = ic.value.substring(lastVal.length);
                if ((best.tagName === 'INPUT' && best.type !== 'number') || best.tagName === 'TEXTAREA') {
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
        let zCache = new Map();
        function getHighestZ(el) {
            let max = 0;
            while (el && el !== document.documentElement) {
                let z = zCache.get(el);
                if (z === undefined) {
                    let parsed = parseInt(window.getComputedStyle(el).zIndex, 10);
                    z = isNaN(parsed) ? 0 : parsed;
                    zCache.set(el, z);
                }
                if (z > max) max = z;
                el = el.parentElement;
            }
            return max;
        }

        let inputs = document.querySelectorAll('input, textarea, [contenteditable="true"]');
        let bestInput = null;
        let maxScore = -999999999;
        
        for (let i = 0; i < inputs.length; i++) {
            let el = inputs[i];
            if (el.disabled || el.readOnly) continue;
            if (!isTextInput(el)) continue;
            
            if (el.offsetWidth === 0 && el.offsetHeight === 0) {
                let rect = el.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) continue;
            }
            
            let style = window.getComputedStyle(el);
            if (style.visibility === 'hidden' || style.opacity === '0' || style.display === 'none') continue;
            
            let z = getHighestZ(el);
            let score = z * 1000;
            
            if (el.id === 'InputChat' || el.id === 'TextAreaChatLog') score -= 500000;
            if (el.closest && el.closest('fieldset[name="color-picker"], #color-picker, .color-picker')) score -= 500000;
            if (el.tagName === 'TEXTAREA') score += 5000;
            if (el.id && el.id.toLowerCase().indexOf('search') !== -1) score += 2000;
            
            if (score > maxScore) { maxScore = score; bestInput = el; }
        }

        if (bestInput && bestInput.id !== 'InputChat' && (!bestInput.closest || !bestInput.closest('fieldset[name="color-picker"], #color-picker, .color-picker'))) {
            return bestInput;
        }

        let ic = document.getElementById('InputChat');
        if (ic && (ic.offsetParent !== null || ic.offsetWidth > 0)) {
            return ic;
        }

        return null;
    };

    let patchInterval = setInterval(() => {
        if (typeof window.ElementFocus === 'function' && !window.ElementFocus._isHooked) {
            let origElementFocus = window.ElementFocus;
            window.ElementFocus = function(ID) {
                let isLayeringInput = typeof ID === 'string' && ID.startsWith('layering-input-');
                let targetEl = typeof ID === 'string' ? document.getElementById(ID) : ID;
                let recentClick = (Date.now() - (window.bcLastMousedownTime || 0)) < 350;

                let wasClicked = recentClick && targetEl && (
                    window.bcLastMousedown === targetEl || 
                    (ID === 'InputChat' && window.bcUserPrefersGameChat && window.bcLastMousedown && isChatArea(window.bcLastMousedown))
                );
                if (wasClicked) {
                    origElementFocus(ID);
                    return;
                }

                if (window.bcIsMouseDown && !isLayeringInput) return;
                if (!isLayeringInput && window.getSelection().toString().length > 0) return;

                // STRICT GUARD: Tolak fokus ke InputChat jika user tidak memilih game chat DAN ada addon aktif di atasnya!
                if (ID === 'InputChat') {
                    let active = document.activeElement;
                    let isUserInAnotherInput = active && isInteractive(active) && active !== targetEl;
                    if (isUserInAnotherInput) return;

                    if (!window.bcUserPrefersGameChat) {
                        let addonInput = getActiveAddonInputStrict();
                        if (addonInput) {
                            if (document.activeElement !== addonInput && document.hasFocus()) {
                                origFocus.call(addonInput);
                            }
                            return;
                        }
                    }
                }

                if (targetEl && targetEl.id !== 'InputChat') {
                    window.bcFocusMemory = targetEl;
                    window.bcUserPrefersGameChat = false;
                }

                origElementFocus(ID);
            };
            window.ElementFocus._isHooked = true;
            clearInterval(patchInterval);
        }
    }, 200);

    HTMLElement.prototype.focus = function() {
        try {
            let isLayeringInput = this.id && this.id.startsWith('layering-input-');
            let recentClick = (Date.now() - (window.bcLastMousedownTime || 0)) < 350;

            let wasClicked = recentClick && (
                window.bcLastMousedown === this ||
                (this.id === 'InputChat' && window.bcUserPrefersGameChat && window.bcLastMousedown && isChatArea(window.bcLastMousedown))
            );
            if (wasClicked) {
                origFocus.call(this);
                return;
            }

            if (window.bcIsMouseDown && !isLayeringInput) return;

            let currentActive = document.activeElement;
            let currentIsLayering = currentActive && currentActive.id && currentActive.id.startsWith('layering-input-');
            if (currentIsLayering && !isLayeringInput) return;

            if (window.getSelection().toString().length > 0) return;

            if (this.id === 'InputChat') {
                let active = document.activeElement;
                let isUserInAnotherInput = active && isInteractive(active) && active !== this;
                if (isUserInAnotherInput) return;

                if (!window.bcUserPrefersGameChat) {
                    let addonInput = getActiveAddonInputStrict();
                    if (addonInput) {
                        if (document.activeElement !== addonInput && document.hasFocus()) {
                            origFocus.call(addonInput);
                        }
                        return;
                    }
                }
            }
        } catch(e) {}
        origFocus.call(this);
    };

    let focusObserver = new MutationObserver((mutations) => {
        let chatLog = document.getElementById('TextAreaChatLog');
        let shouldCheck = false;
        let addedInputs = false;
        for (let m of mutations) {
            if (m.target && (m.target.id === 'TextAreaChatLog' || (chatLog && chatLog.contains(m.target)))) continue;
            if (m.type === 'childList') {
                if (m.addedNodes.length > 0) {
                    for (let i = 0; i < m.addedNodes.length; i++) {
                        let n = m.addedNodes[i];
                        if (isTextInput(n) || (n.querySelector && n.querySelector('textarea, input[type=text], input[type=search], input:not([type])'))) {
                            addedInputs = true;
                            shouldCheck = true;
                        }
                    }
                }
                if (m.removedNodes.length > 0) {
                    if (!document.activeElement || document.activeElement === document.body || (window.bcFocusMemory && !window.bcFocusMemory.isConnected)) {
                        shouldCheck = true;
                    }
                }
            } else if (m.type === 'attributes') {
                if (m.target && m.target.id !== 'InputChat' && m.target.id !== 'TextAreaChatLog' && isTextInput(m.target)) {
                    shouldCheck = true;
                }
            }
        }
        
        if (addedInputs) {
            window.bcForceUnfocusSearch = false;
            window.bcUserPrefersGameChat = false;
        }

        if (shouldCheck && document.hasFocus()) {
            if (window.bcFocusTimeout) clearTimeout(window.bcFocusTimeout);
            window.bcFocusTimeout = setTimeout(() => {
                if (window.bcIsMouseDown) return;
                if (window.getSelection().toString().length > 0) return;

                let best = window.bcRunFocusCrawler ? window.bcRunFocusCrawler() : null;
                if (best && best.id !== 'InputChat') {
                    if (window.bcLastFocusedLayer !== best) {
                        window.bcLastFocusedLayer = best;
                        window.bcFocusMemory = best;
                        window.bcUserPrefersGameChat = false;
                        if (window.bcFocusAndTeleport) {
                            window.bcFocusAndTeleport(best);
                        } else {
                            origFocus.call(best);
                        }
                    }
                } else {
                    window.bcLastFocusedLayer = null;
                }
            }, 50);
        }
    });
    focusObserver.observe(document.body, { 
        childList: true, 
        subtree: true, 
        attributes: true, 
        attributeFilter: ['style', 'class', 'hidden', 'disabled'] 
    });

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
                try {
                    if (activeEl.selectionStart !== null && activeEl.selectionStart !== undefined) {
                        text = activeEl.value.substring(activeEl.selectionStart, activeEl.selectionEnd);
                    } else {
                        text = activeEl.value;
                    }
                } catch (err) {
                    text = activeEl.value;
                }
            } else {
                text = window.getSelection().toString();
            }
            if (text) {
                window.chrome.webview.postMessage('COPY_TEXT:' + text);
            }
        }
        return originalExecCommand.apply(this, arguments);
    };

    // ponytail: Safe VRAM, Active-Room Texture Protection & Chat Virtualization
    (function setupSafeVramOptimization() {
        window.__bcLifecycleGuardActive = true;
        const NORMAL_PURGE_DELAY = 5 * 60 * 1000;
        const WARDROBE_PURGE_DELAY = 90 * 1000;
        const trackedRoomCanvases = new Map();

        // Ensure all users (including those without neko-dark.js) receive chat virtualization without losing chat history
        function ensureChatVirtualizationCss() {
            if (!document.head || document.getElementById('bc-desktop-chat-virt')) return;
            const st = document.createElement('style');
            st.id = 'bc-desktop-chat-virt';
            st.textContent = '#TextAreaChatLog > .ChatMessage, #TextAreaChatLog > div { content-visibility: auto; contain-intrinsic-size: auto 42px; contain: layout style paint; }';
            document.head.appendChild(st);
        }
        ensureChatVirtualizationCss();

        function applyPurgeDelay() {
            if (typeof window.ImageCachePurgeDelay !== 'undefined') {
                window.ImageCachePurgeDelay = (typeof window.CurrentScreen !== 'undefined' && window.CurrentScreen === 'Appearance')
                    ? WARDROBE_PURGE_DELAY
                    : NORMAL_PURGE_DELAY;
            }
        }

                function cleanUpDepartedCharacter(targetChar) {
                    if (!targetChar || targetChar === window.Player || (targetChar.IsPlayer && targetChar.IsPlayer())) return;
                    try {
                        const memberNum = targetChar.MemberNumber;
                        if (window.CurrentCharacter === targetChar) {
                            if (typeof window.DialogLeave === 'function') {
                                try { window.DialogLeave(); } catch (e) {}
                            }
                            window.CurrentCharacter = null;
                        }
                        if (memberNum && window._chatQol_PetsuitRemoteAnims) {
                            if (typeof window._chatQol_PetsuitRemoteAnims.delete === 'function' && window._chatQol_PetsuitRemoteAnims.has(memberNum)) {
                                const entry = window._chatQol_PetsuitRemoteAnims.get(memberNum);
                                if (entry && entry.timer) clearTimeout(entry.timer);
                                window._chatQol_PetsuitRemoteAnims.delete(memberNum);
                            } else if (window._chatQol_PetsuitRemoteAnims[memberNum]) {
                                clearInterval(window._chatQol_PetsuitRemoteAnims[memberNum]);
                                delete window._chatQol_PetsuitRemoteAnims[memberNum];
                            }
                        }
                        targetChar.MustDraw = false;
                        if (targetChar.Canvas) {
                            targetChar.Canvas.width = 0;
                            targetChar.Canvas.height = 0;
                            targetChar.Canvas = null;
                        }
                        if (targetChar.CanvasBlink) {
                            targetChar.CanvasBlink.width = 0;
                            targetChar.CanvasBlink.height = 0;
                            targetChar.CanvasBlink = null;
                        }
                        if (typeof window.AnimationPurge === 'function') {
                            try { window.AnimationPurge(targetChar, true); } catch (e) {}
                        }
                        if (typeof window.CharacterDelete === 'function') {
                            try { window.CharacterDelete(targetChar); } catch (e) {}
                        } else if (Array.isArray(window.Character)) {
                            const idx = window.Character.indexOf(targetChar);
                            if (idx >= 0) window.Character.splice(idx, 1);
                        }
                    } catch (e) {}
                }

                function attachRoomHooks() {
                    if (typeof window.ChatRoomSyncMemberLeave === 'function' && !window.__bcMemberLeaveHooked) {
                        window.__bcMemberLeaveHooked = true;
                        const _origLeave = window.ChatRoomSyncMemberLeave;
                        window.ChatRoomSyncMemberLeave = function(data) {
                            const targetId = data && typeof data.SourceMemberNumber === 'number' ? data.SourceMemberNumber : null;
                            const char = targetId != null
                                ? ((window.ChatRoomCharacter || []).find(c => c && c.MemberNumber === targetId) ||
                                   (window.Character || []).find(c => c && c.MemberNumber === targetId))
                                : null;
                            try {
                                return _origLeave.apply(this, arguments);
                            } finally {
                                if (char) cleanUpDepartedCharacter(char);
                            }
                        };
                    }
                    if (typeof window.ChatRoomLeave === 'function' && !window.__bcRoomLeaveHooked) {
                        window.__bcRoomLeaveHooked = true;
                        const _origRoomLeave = window.ChatRoomLeave;
                        window.ChatRoomLeave = function(clearCharacters) {
                            return _origRoomLeave.call(this, true);
                        };
                    }
                }
                attachRoomHooks();

        // Protect active room character textures and safely free VRAM of departed characters
        function protectActiveRoomTextures() {
            try {
                attachRoomHooks();
                ensureChatVirtualizationCss();
                const now = typeof window.CommonTime === 'function' ? window.CommonTime() : Date.now();
                const chars = [];
                if (window.Player) chars.push(window.Player);
                if (window.CurrentCharacter && window.CurrentCharacter !== window.Player) chars.push(window.CurrentCharacter);
                if (Array.isArray(window.ChatRoomCharacter)) {
                    for (let i = 0; i < window.ChatRoomCharacter.length; i++) {
                        if (window.ChatRoomCharacter[i]) chars.push(window.ChatRoomCharacter[i]);
                    }
                }

                // Collect active character asset names to only touch textures actually used in the room
                const activeAssetNames = new Set();
                for (let i = 0; i < chars.length; i++) {
                    const c = chars[i];
                    if (c && Array.isArray(c.Appearance)) {
                        for (let j = 0; j < c.Appearance.length; j++) {
                            const a = c.Appearance[j];
                            if (a && a.Asset) {
                                if (a.Asset.Name) activeAssetNames.add(a.Asset.Name);
                                if (a.Asset.Group && a.Asset.Group.Name) activeAssetNames.add(a.Asset.Group.Name);
                            }
                        }
                    }
                }

                // Touch timestamps of active room assets to prevent visual flickering during purge
                for (const cacheObj of [window.DrawImageCache, window.GLDrawImageCache]) {
                    if (!cacheObj || !cacheObj.cache || typeof cacheObj.cache.forEach !== 'function') continue;
                    cacheObj.cache.forEach((val, key) => {
                        if (val && typeof val === 'object' && window.CurrentScreen === 'ChatRoom' && val.loaded !== false) {
                            let isActive = false;
                            if (typeof key === 'string') {
                                for (const name of activeAssetNames) {
                                    if (key.includes(name)) {
                                        isActive = true;
                                        break;
                                    }
                                }
                            }
                            if (isActive) {
                                if ('lastAccessed' in val) val.lastAccessed = now;
                                if ('timestamp' in val) val.timestamp = now;
                            }
                        }
                    });
                }

                // Safely purge departed room characters and release their GPU canvas buffers
                if (window.CurrentScreen === 'ChatRoom') {
                    const currentIds = new Set();
                    for (let i = 0; i < chars.length; i++) {
                        const c = chars[i];
                        const id = c.MemberNumber || c.ID;
                        if (id != null) {
                            currentIds.add(id);
                            if (c.Canvas || c.CanvasBlink) {
                                trackedRoomCanvases.set(id, { char: c, canvas: c.Canvas, blink: c.CanvasBlink });
                            }
                        }
                    }

                    for (const [id, entry] of trackedRoomCanvases.entries()) {
                        if (!currentIds.has(id) && entry.char !== window.Player) {
                            cleanUpDepartedCharacter(entry.char);
                            trackedRoomCanvases.delete(id);
                        }
                    }
                }

                // Scavenger: remove any orphaned ghost characters in window.Character who are not in the room
                if (Array.isArray(window.Character)) {
                    const inChatRoom = (typeof window.ServerPlayerIsInChatRoom === 'function' && window.ServerPlayerIsInChatRoom()) ||
                                       window.CurrentScreen === 'ChatRoom' ||
                                       (window.ChatRoomData != null && Array.isArray(window.ChatRoomCharacter) && window.ChatRoomCharacter.length > 0);

                    const activeMemberNums = new Set();
                    if (window.Player && window.Player.MemberNumber) activeMemberNums.add(window.Player.MemberNumber);
                    if (Array.isArray(window.ChatRoomCharacter)) {
                        for (let i = 0; i < window.ChatRoomCharacter.length; i++) {
                            const m = window.ChatRoomCharacter[i]?.MemberNumber;
                            if (m) activeMemberNums.add(m);
                        }
                    }

                    const ghosts = window.Character.filter(c => {
                        if (!c || c === window.Player || (c.IsPlayer && c.IsPlayer())) return false;
                        if (c === window.CurrentCharacter) return false;
                        const isOnline = (c.AccountName && c.AccountName.startsWith('Online-')) || (typeof c.MemberNumber === 'number' && c.MemberNumber > 0);
                        if (!isOnline) return false;
                        if (inChatRoom) {
                            return !activeMemberNums.has(c.MemberNumber);
                        }
                        if (window.CurrentScreen === 'ChatSearch' || window.CurrentScreen === 'MainHall') {
                            return true;
                        }
                        return false;
                    });

                    for (let i = 0; i < ghosts.length; i++) {
                        cleanUpDepartedCharacter(ghosts[i]);
                    }
                }
            } catch (e) {}
        }

        // 1. Periodically prune expired textures & clean up departed character VRAM
        setInterval(() => {
            try {
                if (window._bcIsBackground) return;
                applyPurgeDelay();
                protectActiveRoomTextures();

                if (typeof window.GLDrawImageCache !== 'undefined' && window.GLDrawImageCache && typeof window.GLDrawImageCache.purge === 'function') {
                    window.GLDrawImageCache.purge(false);
                }
                if (typeof window.DrawImageCache !== 'undefined' && window.DrawImageCache && typeof window.DrawImageCache.purge === 'function') {
                    window.DrawImageCache.purge(false);
                }
                if (typeof window.CurrentScreen !== 'undefined' && window.CurrentScreen === 'Appearance' && typeof window.gc === 'function') {
                    try { window.gc(); } catch (e) {}
                }
            } catch (e) {}
        }, 45 * 1000);

        // 2. Safe gentle prune 12s after leaving Wardrobe (Appearance)
        let lastScreen = null;
        let screenTimer = null;
        setInterval(() => {
            try {
                if (window._bcIsBackground) return;
                applyPurgeDelay();
                if (typeof window.CurrentScreen !== 'undefined') {
                    if (lastScreen === 'Appearance' && window.CurrentScreen !== 'Appearance') {
                        if (screenTimer) clearTimeout(screenTimer);
                        screenTimer = setTimeout(() => {
                            if (typeof window.CurrentScreen !== 'undefined' && window.CurrentScreen === 'Appearance') return;
                            protectActiveRoomTextures();
                            if (typeof window.GLDrawImageCache !== 'undefined' && window.GLDrawImageCache && typeof window.GLDrawImageCache.purge === 'function') {
                                window.GLDrawImageCache.purge(false);
                            }
                            if (typeof window.DrawImageCache !== 'undefined' && window.DrawImageCache && typeof window.DrawImageCache.purge === 'function') {
                                window.DrawImageCache.purge(false);
                            }
                            if (typeof window.gc === 'function') {
                                try { window.gc(); } catch (e) {}
                            }
                        }, 12000);
                    }
                    lastScreen = window.CurrentScreen;
                }
            } catch (e) {}
        }, 1000);
    })();
})();
`;

function getCalendarVersionNumber() {
    const now = new Date();
    return Math.floor((now.getUTCFullYear() - 2025) * 12 + now.getUTCMonth()) + 111 + (now.getUTCDate() >= 16 ? 1 : 0);
}

async function getLatestAsiaUrl() {
    let versionNum = null;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const res = await fetch("https://bondageprojects.com/club_game/", {
            cache: "no-store",
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (res.ok) {
            const html = await res.text();
            const match = html.match(/onclick="window\.location='https:\/\/www\.bondage[^']+\/R(\d+)\/[^']*'"/i);
            if (match && match[1]) {
                versionNum = parseInt(match[1], 10);
            }
        }
    } catch (_) {
        // Ignore network errors and fall back to calendar formula
    }

    if (!versionNum) {
        versionNum = getCalendarVersionNumber();
    }

    // Enforce bondage-asia.com base URL for stable LocalStorage and addon persistence
    return `https://www.bondage-asia.com/club/R${versionNum}/`;
}

// Backward compatibility alias
const getLatestElementFxUrl = getLatestAsiaUrl;

async function resolveGameUrl() {
    if (process.env.BC_URL) return process.env.BC_URL;

    let activeVersion = 132;
    const homeDir = process.env.HOME || process.env.USERPROFILE || "";
    const versionFile = path.join(homeDir, ".config", "BCClient", "version.txt");

    let isLocked = false;
    try {
        if (fs.existsSync(versionFile)) {
            let raw = fs.readFileSync(versionFile, "utf8").trim();
            if (raw.toLowerCase().endsWith(":lock")) {
                isLocked = true;
                raw = raw.slice(0, -5).trim();
            }
            const saved = parseInt(raw, 10);
            if (!isNaN(saved) && saved >= 132 && saved < 500) {
                activeVersion = saved;
            }
        }
    } catch (_) {}

    if (isLocked) {
        lastKnownGoodUrl = `https://www.bondage-asia.com/club/R${activeVersion}/`;
        return lastKnownGoodUrl;
    }

    try {
        const url = await getLatestAsiaUrl();
        const match = url.match(/\/R(\d+)\//);
        if (match && match[1]) {
            activeVersion = parseInt(match[1], 10);
        }
        try {
            const dir = path.dirname(versionFile);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(versionFile, activeVersion.toString(), "utf8");
        } catch (_) {}
        lastKnownGoodUrl = url;
        return lastKnownGoodUrl;
    } catch (_) {
        lastKnownGoodUrl = `https://www.bondage-asia.com/club/R${activeVersion}/`;
        return lastKnownGoodUrl;
    }
}

let mainWindow = null;
let deactivationTimeout = null;
let recentCrashCount = 0;
let lastCrashTime = 0;
let forceQuit = false;
let scriptsInjectedForCurrentPage = false;

let activationTimeout = null;
function cancelActivation() {
    if (activationTimeout) {
        clearTimeout(activationTimeout);
        activationTimeout = null;
    }
}

function cancelDeactivation() {
    if (deactivationTimeout) {
        clearTimeout(deactivationTimeout);
        deactivationTimeout = null;
    }
}

function injectScripts() {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (scriptsInjectedForCurrentPage) return;
    scriptsInjectedForCurrentPage = true;

    // 1. Guard against undefined pidx ReferenceError
    mainWindow.webContents.executeJavaScript(
        "if(typeof window.pidx==='undefined'){try{Object.defineProperty(window,'pidx',{get:()=>0,set:()=>{},configurable:true});}catch(e){}}"
    ).catch(() => {});

    // 2. Inject Smart Focus & Keyboard/Copy Handler
    mainWindow.webContents.executeJavaScript(CopyAndFocusScript).catch(() => {});

    // 3. Check local Scripts/ directory (Dev/Tester mode) matching Windows behavior
    const localScriptsDirs = [
        path.join(path.dirname(process.execPath), "Scripts"),
        path.join(__dirname, "Scripts"),
        path.resolve(__dirname, "../../Scripts")
    ];

    // ponytail: same as Windows hasLocalScripts — inject every local script directly, no per-addon toggles.
    // addon-manager.js is skipped so it doesn't pull duplicate copies from the CDN.
    let injectedLocal = false;
    for (const dir of localScriptsDirs) {
        if (!fs.existsSync(dir)) continue;
        const jsFiles = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'addon-manager.js');
        if (jsFiles.length === 0) continue;
        for (const file of jsFiles) {
            const content = fs.readFileSync(path.join(dir, file), 'utf8');
            mainWindow.webContents.executeJavaScript(content).catch(() => {});
        }
        injectedLocal = true;
        break;
    }

    // 4. Fallback to loader.user.js or remote loader CDN if no local scripts exist
    if (!injectedLocal) {
        const loaderCandidates = [
            path.resolve(__dirname, "../../loader.user.js"),
            path.join(__dirname, "loader.user.js"),
            path.join(process.resourcesPath || "", "loader.user.js")
        ];
        let scriptContent = "";
        for (const cand of loaderCandidates) {
            if (fs.existsSync(cand)) {
                scriptContent = fs.readFileSync(cand, 'utf8');
                break;
            }
        }
        if (!scriptContent) {
            scriptContent = `(function() {
                if (window._bcRemoteLoaderInjected) return;
                window._bcRemoteLoaderInjected = true;
                const cdnURL = "https://cdn.jsdelivr.net/gh/Izumii99/BC-Desktop@main/Scripts/addon-manager.js";
                const script = document.createElement("script");
                script.src = cdnURL + "?v=" + Date.now();
                (document.head || document.documentElement).appendChild(script);
            })();`;
        }
        mainWindow.webContents.executeJavaScript(scriptContent).catch(err => {
            console.warn("Failed to inject remote loader:", err.message);
        });
    }
}

function createWindow() {
    const appTitle = isHidden ? "" : "Bondage Club";
    const iconName = isHidden ? "transparent.png" : "app_logo.png";
    const iconCandidates = [
        path.resolve(__dirname, "../../Assets", iconName),
        path.join(__dirname, "assets", iconName),
        path.join(process.resourcesPath || "", "assets", iconName)
    ];
    const iconPath = iconCandidates.find(p => fs.existsSync(p));

    mainWindow = new BrowserWindow({
        width: 1152,
        height: 576,
        minWidth: 360,
        minHeight: 180,
        useContentSize: true,
        title: appTitle,
        icon: iconPath,
        backgroundColor: '#0d0d0d', // Matches RGB(13, 13, 13) on Windows
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            backgroundThrottling: false,
            spellcheck: false
        }
    });

    checkForAppUpdates();

    mainWindow.webContents.on('console-message', (event, level, message) => {
        const raw = (typeof message === 'string') 
            ? message 
            : (event && typeof event.message === 'string' ? event.message : (typeof level === 'string' ? level : ''));
        if (raw && raw.startsWith('__BC_BRIDGE__:')) {
            handleWebMessage(raw.slice(14));
        }
    });

    // Enforce 2:1 native BC game aspect ratio matching WndProc (WM_SIZING) on Windows
    mainWindow.setAspectRatio(2.0);

    // Disable default menu bar & context menu
    Menu.setApplicationMenu(null);
    mainWindow.webContents.on('context-menu', (e) => e.preventDefault());

    // Delegate external links to the default web browser instead of opening blank child windows
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http:') || url.startsWith('https:')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    // Lock zoom levels and inject scripts promptly on DOM ready and finish load
    const setupPage = () => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        mainWindow.webContents.setZoomFactor(1.0);
        mainWindow.webContents.setVisualZoomLevelLimits(1, 1);
        injectScripts();
    };
    mainWindow.webContents.on('did-start-navigation', (event, url, isInPlace, isMainFrame) => {
        if (isMainFrame && !isInPlace) {
            scriptsInjectedForCurrentPage = false;
        }
    });
    mainWindow.webContents.on('dom-ready', setupPage);
    mainWindow.webContents.on('did-finish-load', setupPage);

    // Automatically grant clipboard permissions matching WebView2
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'clipboard-sanitized-write' || permission === 'clipboard-read') {
            callback(true);
        } else {
            callback(false);
        }
    });

    // Start maximized matching Windows OnSourceInitialized
    mainWindow.once('ready-to-show', () => {
        mainWindow.maximize();
        mainWindow.show();
        checkForAppUpdates();
        checkPostUpdateChangelog();
    });

    // Update title, notification badge "(1)", and flash taskbar frame
    mainWindow.on('page-title-updated', (event, title) => {
        if (isUpdating) {
            event.preventDefault();
            return;
        }

        if (isHidden) {
            event.preventDefault();
            mainWindow.setTitle("");
            return;
        }

        if (updateAvailableTag) {
            event.preventDefault();
            mainWindow.setTitle(`Bondage Club — Update Available (v${updateAvailableTag})`);
        }

        const match = title.match(/^\((\d+)\)/);
        if (match && match[1]) {
            const count = parseInt(match[1], 10);
            if (typeof app.setBadgeCount === 'function') {
                app.setBadgeCount(count);
            }
            if (!mainWindow.isFocused()) {
                mainWindow.flashFrame(true);
            }
        } else {
            if (typeof app.setBadgeCount === 'function') {
                app.setBadgeCount(0);
            }
            mainWindow.flashFrame(false);
        }
    });

    // Smart focus and unfocused FPS throttling (Blur / Focus / Minimize / Restore)
    mainWindow.on('blur', () => {
        cancelActivation();
        cancelDeactivation();
        deactivationTimeout = setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isMinimized()) {
                mainWindow.webContents.executeJavaScript(CapUnfocusedFpsScript).catch(() => {});
            }
        }, 3000);
    });

    mainWindow.on('focus', () => {
        cancelActivation();
        cancelDeactivation();
        mainWindow.flashFrame(false);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.executeJavaScript(RestoreUnfocusedFpsScript).catch(() => {});
            activationTimeout = setTimeout(() => {
                if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isFocused() && !mainWindow.isMinimized()) {
                    mainWindow.webContents.focus();
                    mainWindow.webContents.executeJavaScript(SmartFocusRestoreScript).catch(() => {});
                }
            }, 100);
        }
    });

    mainWindow.on('minimize', () => {
        cancelDeactivation();
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.setBackgroundThrottling(true);
            mainWindow.webContents.executeJavaScript("(() => { window._bcIsMinimized = true; })()").catch(() => {});
            mainWindow.webContents.executeJavaScript(CapUnfocusedFpsScript).catch(() => {});
        }
    });

    mainWindow.on('restore', () => {
        cancelDeactivation();
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.setBackgroundThrottling(false);
            mainWindow.webContents.executeJavaScript(RestoreUnfocusedFpsScript).catch(() => {});
        }
    });

    // Keyboard Shortcuts (F11 Fullscreen & F12 DevTools). Physical Ctrl+KeyC is handled in CopyAndFocusScript, same as Windows.
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.type === 'keyDown') {
            if (input.key === 'F11') {
                mainWindow.setFullScreen(!mainWindow.isFullScreen());
                event.preventDefault();
            } else if (input.key === 'F12') {
                mainWindow.webContents.toggleDevTools();
                event.preventDefault();
            }
        }
    });

    // Auto-recovery on render process crash (max 3 times within 30 seconds)
    mainWindow.webContents.on('render-process-gone', (event, details) => {
        if (details.reason === 'clean-exit') return;
        const now = Date.now();
        if (now - lastCrashTime < 30000) {
            recentCrashCount++;
        } else {
            recentCrashCount = 1;
        }
        lastCrashTime = now;

        if (recentCrashCount <= 3 && mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.reload();
        }
    });

    // Auto-recovery if navigating into a 404 dead page
    mainWindow.webContents.on('did-navigate', (event, url, httpResponseCode) => {
        if (httpResponseCode === 404 && url !== lastKnownGoodUrl) {
            mainWindow.loadURL(lastKnownGoodUrl).catch(() => {});
        }
    });

    // Exit confirmation dialog matching Windows OnClosing
    mainWindow.on('close', (e) => {
        if (forceQuit) return;

        const choice = dialog.showMessageBoxSync(mainWindow, {
            type: 'question',
            buttons: ['OK', 'Cancel'],
            defaultId: 1,
            cancelId: 1,
            title: 'Leave site?',
            message: 'Leave Bondage Club?\nChanges you made may not be saved.'
        });

        if (choice !== 0) {
            e.preventDefault();
        } else {
            forceQuit = true;
            cancelDeactivation();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    resolveGameUrl().then(url => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.loadURL(url).catch(() => {});
        }
    }).catch(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.loadURL(lastKnownGoodUrl).catch(() => {});
        }
    });
}

app.whenReady().then(() => {
    app.setName(isHidden ? "\u3164" : "Bondage Club");
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

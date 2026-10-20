const { app, BrowserWindow, Menu, session, dialog, clipboard, ipcMain, net } = require('electron');
const path = require('path');
const fs = require('fs');

// Detect hidden mode via CLI flag (--hidden), environment variable (BC_DISCREET=1), or Hangul Filler product name
const isHidden = process.argv.includes('--hidden') || 
                 process.env.BC_DISCREET === '1' || 
                 (typeof app.getName === 'function' ? app.getName() === '\u3164' : app.name === '\u3164');

const CURRENT_APP_VERSION = "7.1";

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

async function checkForAppUpdates() {
    if (isHidden) return;
    try {
        const res = await fetch("https://api.github.com/repos/Izumii99/BC-Desktop/releases/latest", {
            headers: { "User-Agent": "BC-Desktop-Linux" }
        });
        if (!res.ok) return;
        const data = await res.json();
        const latestTag = (data.tag_name || "").trim();
        if (isNewerVersion(latestTag, CURRENT_APP_VERSION)) {
            updateAvailableTag = latestTag.replace(/^v/i, '');
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.setTitle(`Bondage Club — Update Available (v${updateAvailableTag})`);
            }
        }
    } catch (_) {}
}

let lastKnownGoodUrl = "https://www.bondage-asia.com/club/R132/";

// 1. Match Chromium & Memory Optimization Flags with WebView2 on Windows
app.commandLine.appendSwitch('disable-features', 'Translate,OptimizationHints,MediaRouter,DialMediaRouteProvider,SpareRendererForSitePerProcess,CanvasOopRasterization,AudioServiceOutOfProcess,AutofillServerCommunication');
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-component-update');
app.commandLine.appendSwitch('disable-domain-reliability');
app.commandLine.appendSwitch('disable-sync');
app.commandLine.appendSwitch('no-pings');
app.commandLine.appendSwitch('gpu-rasterization-msaa-sample-count', '0');
app.commandLine.appendSwitch('enable-features', 'PurgeRendererMemoryWhenBackgrounded,IntensiveWakeUpThrottling');
app.commandLine.appendSwitch('force-gpu-mem-available-mb', '192');
app.commandLine.appendSwitch('force-gpu-mem-discardable-limit-mb', '32');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=512 --optimize-for-size --expose-gc');

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

ipcMain.on('web-message', (event, msg) => {
    handleWebMessage(msg);
});

// Throttling script: caps FPS to 15 and triggers GC when window is unfocused (matches Windows behavior)
const CapUnfocusedFpsScript =
    "(()=>{" +
    "const g=window.Player&&Player.GraphicsSettings;" +
    "if(g&&!g.MaxUnfocusedFPS&&window.CurrentScreen!=='Preference'){g.MaxUnfocusedFPS=15;window.bcFpsCap=g;}" +
    "if(window.bcFocusMemory&&!window.bcFocusMemory.isConnected)window.bcFocusMemory=null;" +
    "if(window.bcLastMousedown&&!window.bcLastMousedown.isConnected)window.bcLastMousedown=null;" +
    "if(window.bcLastFocusedLayer&&!window.bcLastFocusedLayer.isConnected)window.bcLastFocusedLayer=null;" +
    "if(typeof window.gc==='function'){try{window.gc();}catch(e){}}" +
    "})()";

const RestoreUnfocusedFpsScript =
    "(()=>{const g=window.bcFpsCap;if(g){if(g.MaxUnfocusedFPS===15)g.MaxUnfocusedFPS=0;window.bcFpsCap=null;}})()";

const SmartFocusRestoreScript = `
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

            if (id.startsWith('lce-') || cls.includes('lce-') ||
                id.includes('bcx') || cls.includes('bcx') ||
                id.includes('fusam') || cls.includes('fusam') ||
                id.includes('bcom') || cls.includes('bcom') ||
                id.includes('modal') || cls.includes('modal') ||
                id.includes('dialog') || cls.includes('dialog') ||
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

    document.addEventListener('focusin', (e) => {
        if (isInteractive(e.target)) {
            window.bcFocusMemory = e.target;
            if (isChatArea(e.target)) {
                window.bcUserPrefersGameChat = true;
            } else {
                window.bcUserPrefersGameChat = false;
                window.bcForceUnfocusSearch = false;
            }
        }
    }, true);
    
    document.addEventListener('pointerdown', () => { window.bcIsMouseDown = true; }, true);
    document.addEventListener('pointerup', () => { window.bcIsMouseDown = false; }, true);
    document.addEventListener('mousemove', (e) => {
        if (e.buttons !== undefined) window.bcIsMouseDown = (e.buttons > 0);
    }, true);
    window.addEventListener('blur', () => { window.bcIsMouseDown = false; });

    document.addEventListener('mousedown', (e) => {
        window.bcIsMouseDown = true;
        window.bcLastMousedown = e.target;
        window.bcLastMousedownTime = Date.now();
        
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
                setTimeout(() => {
                    if (!window.bcUserPrefersGameChat) {
                        let targetInput = addonBox.querySelector('textarea:not([disabled]):not([readonly]), input[type=text]:not([disabled]):not([readonly]), input[type=search]:not([disabled]):not([readonly]), input:not([type]):not([disabled]):not([readonly])');
                        if (targetInput) {
                            window.bcFocusMemory = targetInput;
                            origFocus.call(targetInput);
                        }
                    }
                }, 40);
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
        setTimeout(() => {
            if (window.bcIsMouseDown) return;
            let active = document.activeElement;
            if (active && isInteractive(active)) {
                window.bcFocusMemory = active;
                return;
            }
            if (window.getSelection().toString().length > 0) return;
            if (window.bcForceUnfocusSearch) return;

            if (e.target && e.target.closest && e.target.closest('.scroll-box, [id^="preference-"], .preference-settings-grid, select, option, fieldset[name="color-picker"], #color-picker, .color-picker, bc-tint-input, input[type="range"]')) {
                return;
            }
            
            let target = (window.bcFocusMemory && isInteractive(window.bcFocusMemory)) 
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
            let active = document.activeElement;
            if (active && isInteractive(active)) return;
            if (window.getSelection().toString().length > 0) return;
            if (window.bcForceUnfocusSearch) return;
            
            let target = (window.bcFocusMemory && isInteractive(window.bcFocusMemory)) 
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
                let wasClicked = targetEl && (
                    window.bcLastMousedown === targetEl || 
                    window.bcFocusMemory === targetEl ||
                    (ID === 'InputChat' && window.bcLastMousedown && isChatArea(window.bcLastMousedown))
                );
                if (wasClicked) {
                    origElementFocus(ID);
                    return;
                }

                if (window.bcIsMouseDown && !isLayeringInput) return;
                
                let active = document.activeElement;
                let isUserInAnotherInput = active && isInteractive(active) && active !== targetEl;

                if (ID === 'InputChat' && isUserInAnotherInput) {
                    return;
                }

                if (!isLayeringInput && window.getSelection().toString().length > 0) return;

                if (targetEl && targetEl !== document.getElementById('InputChat')) {
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
            let wasClicked = (window.bcFocusMemory === this || 
                              window.bcLastMousedown === this ||
                              (this.id === 'InputChat' && window.bcLastMousedown && isChatArea(window.bcLastMousedown)));
            if (wasClicked) {
                origFocus.call(this);
                return;
            }

            if (window.bcIsMouseDown && !isLayeringInput) return;

            let currentActive = document.activeElement;
            let currentIsLayering = currentActive && currentActive.id && currentActive.id.startsWith('layering-input-');
            if (currentIsLayering && !isLayeringInput) return;

            let active = document.activeElement;
            let isUserInAnotherInput = active && isInteractive(active) && active !== this;

            if (this.id === 'InputChat' && isUserInAnotherInput) {
                return;
            }

            if (window.getSelection().toString().length > 0) return;
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
                    shouldCheck = true;
                }
            } else if (m.type === 'attributes') {
                if (m.target && isTextInput(m.target)) {
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
})();
`;

async function checkVersionStatus(version) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`https://www.bondage-asia.com/club/R${version}/`, {
            signal: controller.signal,
            headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36" }
        });
        clearTimeout(timeoutId);

        if (!res.ok) return { status: 'NotFound', nextVer: null };
        const html = await res.text();

        const refreshMatch = html.match(/URL=(?:\.\.\/)?R(\d+)\//i);
        if (refreshMatch && refreshMatch[1]) {
            return { status: 'Outdated', nextVer: parseInt(refreshMatch[1], 10) };
        }

        if (html.toLowerCase().includes("outdated version")) {
            return { status: 'Outdated', nextVer: version + 1 };
        }

        return { status: 'Active', nextVer: null };
    } catch (_) {
        return { status: 'NotFound', nextVer: null };
    }
}

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
        let currentProbe = activeVersion;
        const maxHops = 10;

        for (let hop = 0; hop < maxHops; hop++) {
            const { status, nextVer } = await checkVersionStatus(currentProbe);

            if (status === 'Active') {
                activeVersion = currentProbe;
                break;
            } else if (status === 'Outdated' && nextVer !== null) {
                const { status: nextStatus } = await checkVersionStatus(nextVer);
                if (nextStatus !== 'NotFound') {
                    activeVersion = nextVer;
                    currentProbe = nextVer;
                    if (nextStatus === 'Active') break;
                } else {
                    break;
                }
            } else {
                if (currentProbe > 132 && currentProbe >= activeVersion - 3) {
                    currentProbe--;
                    continue;
                }
                break;
            }
        }

        try {
            const dir = path.dirname(versionFile);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(versionFile, activeVersion.toString(), "utf8");
        } catch (_) {}
    } catch (_) {}

    lastKnownGoodUrl = `https://www.bondage-asia.com/club/R${activeVersion}/`;
    return lastKnownGoodUrl;
}

let mainWindow = null;
let deactivationTimeout = null;
let recentCrashCount = 0;
let lastCrashTime = 0;
let forceQuit = false;

function cancelDeactivation() {
    if (deactivationTimeout) {
        clearTimeout(deactivationTimeout);
        deactivationTimeout = null;
    }
}

function injectScripts() {
    if (!mainWindow || mainWindow.isDestroyed()) return;

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

    let injectedLocal = false;
    for (const dir of localScriptsDirs) {
        if (fs.existsSync(dir)) {
            const jsFiles = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
            if (jsFiles.length > 0) {
                // Set list of local files so addon-manager.js recognizes them
                mainWindow.webContents.executeJavaScript(
                    `window.bcLocalScripts = ${JSON.stringify(jsFiles)};`
                ).catch(() => {});

                // Inject addon-manager.js, allowing the manager to toggle addons ON/OFF
                const managerPath = path.join(dir, 'addon-manager.js');
                if (fs.existsSync(managerPath)) {
                    const content = fs.readFileSync(managerPath, 'utf8');
                    mainWindow.webContents.executeJavaScript(content).catch(() => {});
                    injectedLocal = true;
                    break;
                }
            }
        }
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

    // Lock zoom levels to prevent accidental Ctrl+Scroll or pinch-zoom changes
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.setZoomFactor(1.0);
        mainWindow.webContents.setVisualZoomLevelLimits(1, 1);
        injectScripts();
    });

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
    });

    // Update title, notification badge "(1)", and flash taskbar frame
    mainWindow.on('page-title-updated', (event, title) => {
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
        cancelDeactivation();
        deactivationTimeout = setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isMinimized()) {
                mainWindow.webContents.executeJavaScript(CapUnfocusedFpsScript).catch(() => {});
            }
        }, 3000);
    });

    mainWindow.on('focus', () => {
        cancelDeactivation();
        mainWindow.flashFrame(false);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.executeJavaScript(RestoreUnfocusedFpsScript).catch(() => {});
            setTimeout(() => {
                if (mainWindow && !mainWindow.isDestroyed()) {
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
            mainWindow.webContents.executeJavaScript(CapUnfocusedFpsScript).catch(() => {});
            mainWindow.webContents.session.clearCache().catch(() => {});
        }
    });

    mainWindow.on('restore', () => {
        cancelDeactivation();
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.setBackgroundThrottling(false);
            mainWindow.webContents.executeJavaScript(RestoreUnfocusedFpsScript).catch(() => {});
        }
    });

    // Keyboard Shortcuts (F11 Fullscreen, F12 DevTools, Physical Ctrl+KeyC across layouts)
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.type === 'keyDown') {
            if (input.key === 'F11') {
                mainWindow.setFullScreen(!mainWindow.isFullScreen());
                event.preventDefault();
            } else if (input.key === 'F12') {
                mainWindow.webContents.toggleDevTools();
                event.preventDefault();
            } else if (input.control && input.code === 'KeyC') {
                mainWindow.webContents.executeJavaScript(`(() => {
                    let activeEl = document.activeElement;
                    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
                        try {
                            if (activeEl.selectionStart !== null && activeEl.selectionStart !== undefined) {
                                return activeEl.value.substring(activeEl.selectionStart, activeEl.selectionEnd);
                            }
                            return activeEl.value;
                        } catch (_) { return activeEl.value; }
                    }
                    return window.getSelection().toString();
                })()`).then(text => {
                    if (text) clipboard.writeText(text);
                }).catch(() => {});
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
            mainWindow.loadURL(lastKnownGoodUrl);
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
            mainWindow.loadURL(url);
        }
    }).catch(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.loadURL(lastKnownGoodUrl);
        }
    });
}

app.whenReady().then(() => {
    app.setName(isHidden ? "\u3164" : "Bondage Club");
    if (typeof app.setDesktopName === 'function') {
        app.setDesktopName(isHidden ? "\u3164" : "bondage-club.desktop");
    }

    if (session.defaultSession && session.defaultSession.protocol && session.defaultSession.protocol.handle) {
        session.defaultSession.protocol.handle('http', (request) => {
            try {
                const url = new URL(request.url);
                if (url.hostname === 'bc-desktop.local') {
                    const scriptName = path.basename(url.pathname);
                    const localScriptsDirs = [
                        path.join(path.dirname(process.execPath), "Scripts"),
                        path.join(__dirname, "Scripts"),
                        path.resolve(__dirname, "../../Scripts")
                    ];
                    for (const dir of localScriptsDirs) {
                        if (fs.existsSync(dir)) {
                            const targetFile = path.join(dir, scriptName);
                            if (fs.existsSync(targetFile)) {
                                const content = fs.readFileSync(targetFile);
                                return new Response(content, {
                                    status: 200,
                                    headers: {
                                        'Content-Type': 'application/javascript; charset=utf-8',
                                        'Access-Control-Allow-Origin': '*'
                                    }
                                });
                            }
                        }
                    }
                    return new Response('Not Found', { status: 404 });
                }
            } catch (_) {}
            return net.fetch(request, { bypassCustomProtocolHandlers: true });
        });
    }

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

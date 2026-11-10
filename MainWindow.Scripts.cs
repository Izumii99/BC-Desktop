using System.IO;

namespace BCDesktop;

internal static class ScriptHelpers
{
    // In-memory only: the game persists GraphicsSettings solely when leaving the Preference screen, which is skipped here.
    internal const string CapUnfocusedFpsScript =
        "(()=>{" +
        "window._bcIsBackground=true;" +
        "const g=window.Player&&Player.GraphicsSettings;" +
        "if(g&&!g.MaxUnfocusedFPS&&window.CurrentScreen!=='Preference'){if(window._bcIsCloaked||window._bcIsMinimized){g.MaxUnfocusedFPS=15;}else{g.MaxUnfocusedFPS=30;}window.bcFpsCap=g;}" +
        "if(!document.__bcOrigHasFocus&&typeof document.hasFocus==='function'){" +
        "document.__bcOrigHasFocus=document.hasFocus;" +
        "document.hasFocus=function(){if(window._bcIsBackground)return false;return document.__bcOrigHasFocus.apply(this,arguments);};" +
        "}" +
        "if(!window._bcRequestBgBurst){" +
        "window._bcRequestBgBurst=function(ms){const t=performance.now()+(ms||2500);if(t>(window._bcBgBurstUntil||0))window._bcBgBurstUntil=t;};" +
        "}" +
        "if(!window.__bcDrawHooked&&typeof window.DrawProcess==='function'){" +
        "window.__bcDrawHooked=true;" +
        "const _origDraw=window.DrawProcess;" +
        "let _lastBgDrawTime=0;" +
        "window.DrawProcess=function(ts){" +
        "if(window._bcIsMinimized)return;" +
        "if(window._bcIsBackground){" +
        "const now=typeof ts==='number'?ts:performance.now();" +
        "if(window._bcIsCloaked){" +
        "const isBurst=now<(window._bcBgBurstUntil||0)||window.CurrentScreen==='Relog'||window.CurrentScreen==='ChatSearch'||window.CurrentScreen==='Login';" +
        "if(isBurst?(now-_lastBgDrawTime<200):(now-_lastBgDrawTime<1000))return;" +
        "}else{" +
        "if(now-_lastBgDrawTime<31.5)return;" +
        "}" +
        "_lastBgDrawTime=now;" +
        "}" +
        "return _origDraw.apply(this,arguments);" +
        "};" +
        "}" +
        "if(!window.__bcLoadCanvasHooked&&!window.__bcBgLoadCanvasHooked&&typeof window.CharacterLoadCanvas==='function'){" +
        "window.__bcBgLoadCanvasHooked=true;" +
        "const _origLoad=window.CharacterLoadCanvas;" +
        "window.CharacterLoadCanvas=function(C){" +
        "if(window._bcIsMinimized){if(C)C._bcPendingCanvasBuild=true;return;}" +
        "if(window._bcIsBackground&&window._bcRequestBgBurst)window._bcRequestBgBurst(2500);" +
        "return _origLoad.apply(this,arguments);" +
        "};" +
        "}" +
        "if(!window.__bcBuildCanvasHooked&&typeof window.CharacterAppearanceBuildCanvas==='function'){" +
        "window.__bcBuildCanvasHooked=true;" +
        "const _origBuild=window.CharacterAppearanceBuildCanvas;" +
        "window.CharacterAppearanceBuildCanvas=function(C){" +
        "if(window._bcIsMinimized){if(C)C._bcPendingCanvasBuild=true;return;}" +
        "if(window._bcIsBackground&&window._bcRequestBgBurst)window._bcRequestBgBurst(2500);" +
        "return _origBuild.apply(this,arguments);" +
        "};" +
        "}" +
        "if(window.bcFocusMemory&&!window.bcFocusMemory.isConnected)window.bcFocusMemory=null;" +
        "if(window.bcLastMousedown&&!window.bcLastMousedown.isConnected)window.bcLastMousedown=null;" +
        "if(window.bcLastFocusedLayer&&!window.bcLastFocusedLayer.isConnected)window.bcLastFocusedLayer=null;" +
        "const now=Date.now();" +
        "const _paws=document.getElementById('bcn-soft-paws');if(_paws)_paws.style.setProperty('display','none','important');if(window._bcIsMinimized&&typeof window.gc==='function'&&(!window._bcLastGc||now-window._bcLastGc>60000)){window._bcLastGc=now;try{window.gc();}catch(e){}}" +
        "})()";

    internal const string RestoreUnfocusedFpsScript =
        "(()=>{" +
        "window._bcIsBackground=false;window._bcIsMinimized=false;window._bcIsCloaked=false;window._bcLastCanvasInputTime=performance.now();const g=window.bcFpsCap;if(g){if(g.MaxUnfocusedFPS===15||g.MaxUnfocusedFPS===30)g.MaxUnfocusedFPS=0;window.bcFpsCap=null;}" +
        "const now=typeof window.CurrentTime==='number'?window.CurrentTime:0;if(window.DrawImageCache)window.DrawImageCache.lastPurge=now;if(window.GLDrawImageCache)window.GLDrawImageCache.lastPurge=now;" +
        "const chars=(Array.isArray(window.ChatRoomCharacter)?window.ChatRoomCharacter.slice():[]);" +
        "if(window.Player&&!chars.includes(window.Player))chars.push(window.Player);if(window.CurrentCharacter&&!chars.includes(window.CurrentCharacter))chars.push(window.CurrentCharacter);if(Array.isArray(window.DrawLastCharacters)){for(let j=0;j<window.DrawLastCharacters.length;j++){if(window.DrawLastCharacters[j]&&!chars.includes(window.DrawLastCharacters[j]))chars.push(window.DrawLastCharacters[j]);}}" +
        "for(let i=0;i<chars.length;i++){" +
        "const c=chars[i];" +
        "if(c&&c._bcPendingCanvasBuild){" +
        "delete c._bcPendingCanvasBuild;" +
        "if(typeof window.CharacterLoadCanvas==='function'){" +
        "try{window.CharacterLoadCanvas(c);}catch(e){}" +
        "}else if(typeof window.CharacterAppearanceBuildCanvas==='function'){" +
        "try{window.CharacterAppearanceBuildCanvas(c);}catch(e){}" +
        "}" +
        "}" +
        "}" +
        "})()";

    private static readonly string _builtInLoaderScript = LoadBuiltInLoaderScript();

    internal static string GetBuiltInLoaderScript() => _builtInLoaderScript;

    private static string LoadBuiltInLoaderScript()
    {
        try
        {
            using var stream = typeof(ScriptHelpers).Assembly.GetManifestResourceStream("BuiltInLoader.js");
            if (stream == null)
            {
                return string.Empty;
            }
            using var reader = new StreamReader(stream);
            return reader.ReadToEnd();
        }
        catch (Exception)
        {
            // Ignored intentionally: BuiltInLoader.js stream reading failed.
            return string.Empty;
        }
    }

    internal static string GetCopyAndOptimizationScript() => @"
            (() => {
                if (window.__bcCopyScriptInitialized) return;
                window.__bcCopyScriptInitialized = true;

                const _attachDrawHook = () => {
                    if (!document.__bcOrigHasFocus && typeof document.hasFocus === 'function') {
                        document.__bcOrigHasFocus = document.hasFocus;
                        document.hasFocus = function() {
                            if (window._bcIsBackground) return false;
                            return document.__bcOrigHasFocus.apply(this, arguments);
                        };
                    }
                    if (!window.__bcInputActivityBound) {
                        window.__bcInputActivityBound = true;
                        window._bcLastCanvasInputTime = performance.now();
                        let _lastMoveTrack = 0;
                        const _markActive = () => { window._bcLastCanvasInputTime = performance.now(); };
                        window.addEventListener('pointerdown', _markActive, { passive: true, capture: true });
                        window.addEventListener('wheel', _markActive, { passive: true, capture: true });
                        window.addEventListener('pointermove', () => {
                            const n = performance.now();
                            if (n - _lastMoveTrack > 100) { _lastMoveTrack = n; window._bcLastCanvasInputTime = n; }
                        }, { passive: true, capture: true });
                        window.addEventListener('keydown', _markActive, { passive: true, capture: true });
                        window.addEventListener('input', _markActive, { passive: true, capture: true });
                    }
                    if (!window._bcGetTargetFrameDelta) {
                        window._bcGetTargetFrameDelta = function(now) {
                            if (window._bcIsBackground) {
                                if (window._bcIsCloaked) {
                                    return now < (window._bcBgBurstUntil || 0) ? 200 : 1000;
                                }
                                return 33;
                            }
                            if (window.CurrentScreen === 'Login' || window.CurrentScreen === 'Relog' || window.ScreenIsLoading || window.CurrentModule === 'MiniGame' || window.CurrentScreen === 'KinkyDungeon' || (typeof window.StruggleProgress === 'number' && window.StruggleProgress >= 0)) {
                                return 16;
                            }
                            const idleMs = now - (window._bcLastCanvasInputTime || 0);
                            if (idleMs < 15000 || window.CurrentCharacter != null) return 16;
                            return 33;
                        };
                    }
                    if (!window._bcRequestBgBurst) {
                        window._bcRequestBgBurst = function(ms) {
                            const t = performance.now() + (ms || 2500);
                            if (t > (window._bcBgBurstUntil || 0)) window._bcBgBurstUntil = t;
                        };
                    }
                    if (!window.__bcDrawHooked && typeof window.DrawProcess === 'function') {
                        window.__bcDrawHooked = true;
                        const _origDraw = window.DrawProcess;
                        let _lastBgDrawTime = 0;
                        let _lastFgDrawTime = 0;
                        window.DrawProcess = function(ts) {
                            if (window._bcIsMinimized) return;
                            const now = typeof ts === 'number' ? ts : performance.now();
                            if (window._bcIsBackground) {
                                if (window._bcIsCloaked) {
                                    const isBurst = now < (window._bcBgBurstUntil || 0) || window.CurrentScreen === 'Relog' || window.CurrentScreen === 'ChatSearch' || window.CurrentScreen === 'Login';
                                    if (isBurst ? (now - _lastBgDrawTime < 200) : (now - _lastBgDrawTime < 1000)) return;
                                } else {
                                    if (now - _lastBgDrawTime < 31.5) return;
                                }
                                _lastBgDrawTime = now;
                            } else {
                                const minDelta = window._bcGetTargetFrameDelta ? window._bcGetTargetFrameDelta(now) : 16;
                                if (now - (_lastFgDrawTime || 0) < minDelta - 1.5) return;
                                _lastFgDrawTime = now;
                            }
                            return _origDraw.apply(this, arguments);
                        };
                    }
                    if (typeof window.GLDrawLoadImage === 'function' && !window.__bcGlLoadImgHooked) {
                        window.__bcGlLoadImgHooked = true;
                        const _origGlLoad = window.GLDrawLoadImage;
                        window.GLDrawLoadImage = function(gl, url) {
                            const c = window._bcActiveBuildChar;
                            if (c && typeof url === 'string') {
                                if (!c.DrawnAssets || typeof c.DrawnAssets.add !== 'function') c.DrawnAssets = new Set();
                                c.DrawnAssets.add(url);
                            }
                            return _origGlLoad.apply(this, arguments);
                        };
                    }
                    if (typeof window.DrawGetImage === 'function' && !window.__bcDrawGetImgHooked) {
                        window.__bcDrawGetImgHooked = true;
                        const _origDrawGet = window.DrawGetImage;
                        window.DrawGetImage = function(url) {
                            const c = window._bcActiveBuildChar;
                            if (c && typeof url === 'string') {
                                if (!c.DrawnAssets || typeof c.DrawnAssets.add !== 'function') c.DrawnAssets = new Set();
                                c.DrawnAssets.add(url);
                            }
                            return _origDrawGet.apply(this, arguments);
                        };
                    }
                    if (!window.__bcLoadCanvasHooked && typeof window.CharacterLoadCanvas === 'function') {
                        window.__bcLoadCanvasHooked = true;
                        const _origLoad = window.CharacterLoadCanvas;
                        const _runOrigLoadTracked = function(targetChar, args) {
                            const prevChar = window._bcActiveBuildChar;
                            window._bcActiveBuildChar = targetChar;
                            if (targetChar) {
                                if (!targetChar.DrawnAssets || typeof targetChar.DrawnAssets.add !== 'function') targetChar.DrawnAssets = new Set();
                                else targetChar.DrawnAssets.clear();
                            }
                            try {
                                return args ? _origLoad.apply(window, args) : _origLoad.call(window, targetChar);
                            } finally {
                                window._bcActiveBuildChar = prevChar;
                            }
                        };
                        if (!Array.isArray(window._bcCanvasQueue)) window._bcCanvasQueue = [];
                        const _drainCanvasQueue = function() {
                            window._bcCanvasQueueTimer = null;
                            if (window._bcIsMinimized) return;
                            const q = window._bcCanvasQueue;
                            if (!Array.isArray(q) || q.length === 0) return;
                            const nextChar = q.shift();
                            if (nextChar) {
                                nextChar._bcQueuedForBuild = false;
                                const now = performance.now();
                                window._bcLastGlobalCanvasBuild = now;
                                nextChar._bcLastCanvasBuild = now;
                                try { _runOrigLoadTracked(nextChar, null); } catch (e) {}
                            }
                            if (q.length > 0) {
                                const drainDelay = window._bcIsBackground ? 90 : 24;
                                window._bcCanvasQueueTimer = setTimeout(_drainCanvasQueue, drainDelay);
                            }
                        };
                        if (!window.__bcSetCurrentHooked && typeof window.CharacterSetCurrent === 'function') {
                            window.__bcSetCurrentHooked = true;
                            const _origSetCurrent = window.CharacterSetCurrent;
                            window.CharacterSetCurrent = function(C) {
                                if (C && C._bcQueuedForBuild && typeof window.CharacterLoadCanvas === 'function') {
                                    if (Array.isArray(window._bcCanvasQueue)) {
                                        const idx = window._bcCanvasQueue.indexOf(C);
                                        if (idx >= 0) window._bcCanvasQueue.splice(idx, 1);
                                    }
                                    C._bcQueuedForBuild = false;
                                    try { window.CharacterLoadCanvas(C); } catch (e) {}
                                }
                                return _origSetCurrent.apply(this, arguments);
                            };
                        }
                        window.CharacterLoadCanvas = function(C) {
                            if (window._bcIsMinimized) {
                                if (C) C._bcPendingCanvasBuild = true;
                                return;
                            }
                            if (window._bcIsBackground && window._bcRequestBgBurst) window._bcRequestBgBurst(2500);
                            if (C && window.CurrentScreen === 'ChatRoom') {
                                const isBg = Boolean(window._bcIsBackground);
                                const isPriority = !isBg && (C === window.Player || (typeof C.IsPlayer === 'function' && C.IsPlayer()) || C === window.CurrentCharacter);
                                if (isPriority) {
                                    if (C._bcQueuedForBuild && Array.isArray(window._bcCanvasQueue)) {
                                        const idx = window._bcCanvasQueue.indexOf(C);
                                        if (idx >= 0) window._bcCanvasQueue.splice(idx, 1);
                                        C._bcQueuedForBuild = false;
                                    }
                                    const now = performance.now();
                                    window._bcLastGlobalCanvasBuild = now;
                                    C._bcLastCanvasBuild = now;
                                    return _runOrigLoadTracked(C, arguments);
                                }
                                if ((!C.Canvas || !C.CanvasBlink) && typeof window.CommonDrawCanvasPrepare === 'function') {
                                    try { window.CommonDrawCanvasPrepare(C); } catch (e) {}
                                }
                                const now = performance.now();
                                const minGlobalGap = isBg ? 90 : 24;
                                const minCharGap = isBg ? 250 : 120;
                                const sinceGlobal = now - (window._bcLastGlobalCanvasBuild || 0);
                                const sinceChar = now - (C._bcLastCanvasBuild || 0);
                                if (sinceGlobal >= minGlobalGap && sinceChar >= minCharGap && (!Array.isArray(window._bcCanvasQueue) || window._bcCanvasQueue.length === 0)) {
                                    window._bcLastGlobalCanvasBuild = now;
                                    C._bcLastCanvasBuild = now;
                                    return _runOrigLoadTracked(C, arguments);
                                }
                                if (!C._bcQueuedForBuild) {
                                    C._bcQueuedForBuild = true;
                                    window._bcCanvasQueue.push(C);
                                }
                                if (!window._bcCanvasQueueTimer) {
                                    const delay = Math.max(16, minGlobalGap - Math.max(0, sinceGlobal));
                                    window._bcCanvasQueueTimer = setTimeout(_drainCanvasQueue, delay);
                                }
                                return;
                            }
                            return _runOrigLoadTracked(C, arguments);
                        };
                    }
                    if (!window.__bcBuildCanvasHooked && typeof window.CharacterAppearanceBuildCanvas === 'function') {
                        window.__bcBuildCanvasHooked = true;
                        const _origBuild = window.CharacterAppearanceBuildCanvas;
                        window.CharacterAppearanceBuildCanvas = function(C) {
                            if (window._bcIsMinimized) {
                                if (C) C._bcPendingCanvasBuild = true;
                                return;
                            }
                            if (window._bcIsBackground && window._bcRequestBgBurst) window._bcRequestBgBurst(2500);
                            const prevChar = window._bcActiveBuildChar;
                            window._bcActiveBuildChar = C;
                            if (C) {
                                if (!C.DrawnAssets || typeof C.DrawnAssets.add !== 'function') C.DrawnAssets = new Set();
                                else C.DrawnAssets.clear();
                            }
                            try {
                                return _origBuild.apply(this, arguments);
                            } finally {
                                window._bcActiveBuildChar = prevChar;
                            }
                        };
                    }
                    return Boolean(window.__bcDrawHooked && window.__bcLoadCanvasHooked && window.__bcBuildCanvasHooked);
                };

                if (!_attachDrawHook() && !window._bcDrawHookTimer) {
                    window._bcDrawHookTimer = setInterval(() => {
                        if (_attachDrawHook()) {
                            clearInterval(window._bcDrawHookTimer);
                            window._bcDrawHookTimer = null;
                        }
                    }, 200);
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
                if (tag === 'INPUT' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'OPTION' || tag === 'BC-TINT-INPUT') return true;
                if (typeof getAddonContainer === 'function' && getAddonContainer(el)) return true;
                return false;
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
                        // User is inside an interactive element (e.g. textarea#DescriptionInput, search input, dropdown, button)
                        // Never intercept or preventDefault: native Enter/Shift+Enter must work untouched!
                        return;
                    } else {
                        // User is OUTSIDE any input, textarea, button, or select (e.g. clicking on canvas or chat log)
                        // Both Enter and Shift+Enter clear selection and pull focus to InputChat if visible!
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
                        } catch (err) {
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
                        rawId === 'InputChat' || rawId === 'TextAreaChatLog' || rawId === 'MainCanvas' || rawId.startsWith('dialog-')) return null;
                    
                    let id = rawId.toLowerCase();
                    let cls = (typeof curr.className === 'string' ? curr.className : '').toLowerCase();
                    
                    if (id === 'descriptioninput' || id.startsWith('preference') || cls.includes('preference') || cls.includes('scroll-box') || cls.includes('dialog-') || cls.includes('button-')) return null;

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
                    
                    let inlinePos = curr.style && curr.style.position;
                    let style = inlinePos ? null : window.getComputedStyle(curr);
                    let pos = inlinePos || (style ? style.position : '');
                    // Inline position already resolved above
                    if (pos === 'fixed' || pos === 'absolute') {
                        let inlineZ = curr.style && curr.style.zIndex;
                        let z = parseInt(inlineZ || (style || window.getComputedStyle(curr)).zIndex, 10);
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
                    if (window.bcForceUnfocusSearch || window._bcAutoFocusEnabled === false) return;

                    if (e.target && e.target.closest && e.target.closest('.scroll-box, [id^=""preference-""], .preference-settings-grid, select, option, fieldset[name=""color-picker""], #color-picker, .color-picker, bc-tint-input, input[type=""range""]')) {
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
                if (window._bcIsMinimized || window._bcIsBackground || !document.hasFocus()) return;
                if (window.bcSelectionTimeout) clearTimeout(window.bcSelectionTimeout);
                window.bcSelectionTimeout = setTimeout(() => {
                    if (window.bcIsMouseDown) return;
                    if ((Date.now() - (window.bcLastMousedownTime || 0)) < 400) return;
                    let active = document.activeElement;
                    if (active && isInteractive(active)) return;
                    if (window.getSelection().toString().length > 0) return;
                    if (window.bcForceUnfocusSearch || window._bcAutoFocusEnabled === false) return;
                    
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
                        // Avoid corrupting numeric inputs with non-numeric leaked text
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

                let inputs = document.querySelectorAll('input, textarea, [contenteditable=""true""]');
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
                    if (el.closest && el.closest('fieldset[name=""color-picker""], #color-picker, .color-picker')) score -= 500000;
                    if (el.tagName === 'TEXTAREA') score += 5000;
                    if (el.id && el.id.toLowerCase().indexOf('search') !== -1) score += 2000;
                    
                    if (score > maxScore) { maxScore = score; bestInput = el; }
                }

                if (bestInput && bestInput.id !== 'InputChat' && (!bestInput.closest || !bestInput.closest('fieldset[name=""color-picker""], #color-picker, .color-picker'))) {
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
                if (window._bcIsMinimized || window._bcIsBackground || !document.hasFocus()) return;
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
                            if (window.bcFocusMemory && !window.bcFocusMemory.isConnected) {
                                shouldCheck = true;
                            } else {
                                for (let i = 0; i < m.removedNodes.length; i++) {
                                    let n = m.removedNodes[i];
                                    if (isTextInput(n) || (n.querySelector && n.querySelector('textarea, input[type=text], input[type=search], input:not([type])'))) {
                                        shouldCheck = true;
                                        break;
                                    }
                                }
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

                if (shouldCheck && document.hasFocus() && window._bcAutoFocusEnabled !== false) {
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

            // Safe VRAM, Active-Room Texture Protection & Chat Virtualization
            (function setupSafeVramOptimization() {
                window.__bcLifecycleGuardActive = true;
                const NORMAL_PURGE_DELAY = 180 * 1000;
                const WARDROBE_PURGE_DELAY = 90 * 1000;
                const trackedRoomCanvases = new Map();
                let lastActiveAssetUrls = new Set();

                try {
                    if (localStorage.getItem('GLDraw-antialiasOff') === null) {
                        localStorage.setItem('GLDraw-antialiasOff', 'true');
                    }
                } catch (e) {}

                function hookGlCacheDelete(gl) {
                    if (!gl || gl.__bcCacheDeleteHooked) return;
                    gl.__bcCacheDeleteHooked = true;
                    if (gl.textureCache && typeof gl.textureCache.delete === 'function') {
                        const origDelete = gl.textureCache.delete.bind(gl.textureCache);
                        gl.textureCache.delete = function(key) {
                            const entry = gl.textureCache.get(key);
                            if (entry && entry.texture && typeof gl.deleteTexture === 'function') {
                                try { gl.deleteTexture(entry.texture); } catch (e) {}
                            }
                            return origDelete(key);
                        };
                        const origClear = gl.textureCache.clear.bind(gl.textureCache);
                        gl.textureCache.clear = function() {
                            if (typeof gl.deleteTexture === 'function') {
                                gl.textureCache.forEach(entry => {
                                    if (entry && entry.texture) {
                                        try { gl.deleteTexture(entry.texture); } catch (e) {}
                                    }
                                });
                            }
                            return origClear();
                        };
                    }
                    if (gl.maskCache && typeof gl.maskCache.delete === 'function') {
                        const origMaskDelete = gl.maskCache.delete.bind(gl.maskCache);
                        gl.maskCache.delete = function(key) {
                            const tex = gl.maskCache.get(key);
                            if (tex && typeof gl.deleteTexture === 'function') {
                                try { gl.deleteTexture(tex); } catch (e) {}
                            }
                            return origMaskDelete(key);
                        };
                        const origMaskClear = gl.maskCache.clear.bind(gl.maskCache);
                        gl.maskCache.clear = function() {
                            if (typeof gl.deleteTexture === 'function') {
                                gl.maskCache.forEach(tex => {
                                    if (tex) {
                                        try { gl.deleteTexture(tex); } catch (e) {}
                                    }
                                });
                            }
                            return origMaskClear();
                        };
                    }
                }

                function pruneWebGlGpuTextures(activeAssetUrls) {
                    try {
                        const inChatRoom = window.CurrentScreen === 'ChatRoom';
                        const gl = window.GLDrawCanvas && window.GLDrawCanvas.GL;
                        if (gl) {
                            hookGlCacheDelete(gl);
                            const glImgMap = window.GLDrawImageCache && window.GLDrawImageCache.cache;
                            if (!inChatRoom && glImgMap && typeof glImgMap.forEach === 'function' && typeof window.GLDrawImageCache.delete === 'function') {
                                const isBg = Boolean(window._bcIsBackground);
                                const nowTime = typeof window.CommonTime === 'function' ? window.CommonTime() : Date.now();
                                const glToDelete = [];
                                glImgMap.forEach((img, key) => {
                                    if (typeof key !== 'string' || !key.startsWith('Assets/') || key.indexOf('/Preview/') >= 0) return;
                                    if (!img || (typeof img.isLoading === 'function' && img.isLoading())) return;
                                    if (typeof img.isDoneLoading === 'function' && !img.isDoneLoading()) return;
                                    if (activeAssetUrls && activeAssetUrls.has(key)) return;
                                    const age = nowTime - (img.lastUsed || 0);
                                    if (age > (isBg ? 45000 : 90000)) {
                                        glToDelete.push(key);
                                    }
                                });
                                for (let i = 0; i < glToDelete.length; i++) {
                                    window.GLDrawImageCache.delete(glToDelete[i]);
                                }
                            }
                            if (!inChatRoom && window.DrawImageCache && window.DrawImageCache.cache && typeof window.DrawImageCache.delete === 'function') {
                                const dMap = window.DrawImageCache.cache;
                                const isBg = Boolean(window._bcIsBackground);
                                const nowTime = typeof window.CommonTime === 'function' ? window.CommonTime() : Date.now();
                                const dToDelete = [];
                                dMap.forEach((img, key) => {
                                    if (typeof key !== 'string' || !key.startsWith('Assets/') || key.indexOf('/Preview/') >= 0) return;
                                    if (!img || (typeof img.isLoading === 'function' && img.isLoading())) return;
                                    if (typeof img.isDoneLoading === 'function' && !img.isDoneLoading()) return;
                                    if (activeAssetUrls && activeAssetUrls.has(key)) return;
                                    const age = nowTime - (img.lastUsed || 0);
                                    if (age > (isBg ? 45000 : 90000)) {
                                        dToDelete.push(key);
                                    }
                                });
                                for (let i = 0; i < dToDelete.length; i++) {
                                    window.DrawImageCache.delete(dToDelete[i]);
                                }
                            }
                            const texCache = gl.textureCache;
                            if (texCache && typeof texCache.forEach === 'function') {
                                const toDelete = [];
                                texCache.forEach((entry, key) => {
                                    if (typeof key !== 'string') return;
                                    if (activeAssetUrls && activeAssetUrls.has(key)) return;
                                    if (key.startsWith('Online-') || (!inChatRoom && glImgMap && typeof glImgMap.has === 'function' && !glImgMap.has(key))) {
                                        toDelete.push(key);
                                    }
                                });
                                for (let i = 0; i < toDelete.length; i++) {
                                    texCache.delete(toDelete[i]);
                                }
                                const maxTexCount = inChatRoom ? 450 : 200;
                                const targetTexCount = inChatRoom ? 380 : 160;
                                if (texCache.size > maxTexCount) {
                                    const excessKeys = [];
                                    texCache.forEach((entry, key) => {
                                        if (texCache.size - excessKeys.length <= targetTexCount) return;
                                        if (!activeAssetUrls || !activeAssetUrls.has(key)) {
                                            excessKeys.push(key);
                                        }
                                    });
                                    for (let i = 0; i < excessKeys.length; i++) {
                                        texCache.delete(excessKeys[i]);
                                    }
                                }
                            }
                            const maskCache = gl.maskCache;
                            if (!inChatRoom && maskCache && window._bcIsMinimized && typeof maskCache.clear === 'function') {
                                maskCache.clear();
                            }
                            if (typeof gl.flush === 'function' && !inChatRoom) {
                                try { gl.flush(); } catch (e) {}
                            }
                            const maxMaskCount = inChatRoom ? 120 : 50;
                            const targetMaskCount = inChatRoom ? 90 : 30;
                            if (maskCache && maskCache.size > maxMaskCount && typeof maskCache.keys === 'function') {
                                const mKeys = Array.from(maskCache.keys());
                                const removeCount = maskCache.size - targetMaskCount;
                                for (let i = 0; i < removeCount && i < mKeys.length; i++) {
                                    maskCache.delete(mKeys[i]);
                                }
                            }
                        }
                        if (!inChatRoom && window.DrawCacheTextureAlphaMasks && typeof window.DrawCacheTextureAlphaMasks.size === 'number' && window.DrawCacheTextureAlphaMasks.size > 60) {
                            const aKeys = Array.from(window.DrawCacheTextureAlphaMasks.keys());
                            const removeCount = window.DrawCacheTextureAlphaMasks.size - 30;
                            for (let i = 0; i < removeCount && i < aKeys.length; i++) {
                                const c = window.DrawCacheTextureAlphaMasks.get(aKeys[i]);
                                if (c) { c.width = 0; c.height = 0; }
                                window.DrawCacheTextureAlphaMasks.delete(aKeys[i]);
                            }
                        }
                    } catch (e) {}
                }

                // Ensure all users (including those without neko-dark.js) receive chat virtualization without losing chat history
                window._bcPruneGpuNow = function() {
                    protectActiveRoomTextures();
                    pruneWebGlGpuTextures(lastActiveAssetUrls);
                };
                function ensureChatVirtualizationCss() {
                    if (!document.head || document.getElementById('bc-desktop-chat-virt')) return;
                    const st = document.createElement('style');
                    st.id = 'bc-desktop-chat-virt';
                    st.textContent = '#TextAreaChatLog > .ChatMessage, #TextAreaChatLog > div { content-visibility: auto; contain-intrinsic-size: auto 42px; contain: layout style paint; } .dialog-grid, .dialog-root { contain: layout style; }';
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
                        if (targetChar._bcBuildTimer) {
                            clearTimeout(targetChar._bcBuildTimer);
                            targetChar._bcBuildTimer = null;
                        }
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
                        if (targetChar._bcQueuedForBuild && Array.isArray(window._bcCanvasQueue)) {
                            const qIdx = window._bcCanvasQueue.indexOf(targetChar);
                            if (qIdx >= 0) window._bcCanvasQueue.splice(qIdx, 1);
                            targetChar._bcQueuedForBuild = false;
                        }
                        const gl = window.GLDrawCanvas && window.GLDrawCanvas.GL;
                        if (gl && gl.textureCache) {
                            hookGlCacheDelete(gl);
                            if (targetChar.AccountName) gl.textureCache.delete(targetChar.AccountName);
                            if (targetChar.MemberNumber) gl.textureCache.delete('Online-' + targetChar.MemberNumber);
                            if (targetChar.DrawnAssets && typeof targetChar.DrawnAssets.forEach === 'function') {
                                targetChar.DrawnAssets.forEach(url => {
                                    if (!lastActiveAssetUrls.has(url)) {
                                        gl.textureCache.delete(url);
                                    }
                                });
                                targetChar.DrawnAssets.clear();
                            }
                        }
                        targetChar.MustDraw = false;
                        if (targetChar.Canvas) {
                            targetChar.Canvas.width = 0;
                            targetChar.Canvas.height = 0;
                        }
                        if (targetChar.CanvasBlink) {
                            targetChar.CanvasBlink.width = 0;
                            targetChar.CanvasBlink.height = 0;
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
                    if (false && typeof window.CommonDrawWarmDrawnAssets === 'function' && !window.__bcWarmAssetsHooked) {
                        window.__bcWarmAssetsHooked = true;
                        const _origWarm = window.CommonDrawWarmDrawnAssets;
                        window.CommonDrawWarmDrawnAssets = function() {
                            if (window._bcIsBackground || window._bcIsMinimized) return;
                            const now = Date.now();
                            if (now - (window._bcLastWarmAssets || 0) < 3000) return;
                            window._bcLastWarmAssets = now;
                            return _origWarm.apply(this, arguments);
                        };
                    }
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
                            try {
                                return _origRoomLeave.apply(this, arguments);
                            } finally {
                                trackedRoomCanvases.clear();
                            }
                        };
                    }
                    if (typeof window.ImageCache === 'function' && window.ImageCache.prototype && !window.ImageCache.prototype.__bcFastGetHooked) {
                        window.ImageCache.prototype.__bcFastGetHooked = true;
                        const _origGet = window.ImageCache.prototype.get;
                        window.ImageCache.prototype.get = function(url) {
                            const image = this.cache && typeof this.cache.get === 'function' ? this.cache.get(url) : null;
                            if (image && ((typeof image.isDoneLoading === 'function' && image.isDoneLoading()) || (typeof image.isLoading === 'function' && image.isLoading()))) {
                                if (typeof window.CommonTime === 'function') image.lastUsed = window.CommonTime();
                                return image;
                            }
                            return _origGet.apply(this, arguments);
                        };
                    }
                    if (typeof window.ElementButton === 'object' && window.ElementButton && typeof window.ElementButton.SetImage === 'function' && !window.ElementButton.__bcFastSetImageHooked) {
                        window.ElementButton.__bcFastSetImageHooked = true;
                        const _origSetImage = window.ElementButton.SetImage;
                        window.ElementButton.SetImage = function(button, src) {
                            if (typeof src === 'string' && typeof window.ElementWrap === 'function') {
                                const el = window.ElementWrap(button);
                                const img = el && (el.matches && el.matches('.button-image') ? el : (el.querySelector ? el.querySelector('.button-image') : null));
                                if (img && img.tagName === 'IMG' && img.getAttribute('src') === src) {
                                    return img;
                                }
                            }
                            return _origSetImage.apply(this, arguments);
                        };
                    }
                    if (typeof window.ChatRoomMessage === 'function' && !window.__bcMsgBurstHooked) {
                        window.__bcMsgBurstHooked = true;
                        const _origMsg = window.ChatRoomMessage;
                        window.ChatRoomMessage = function(data) {
                            if (false && window._bcIsBackground && !window._bcIsMinimized && window._bcRequestBgBurst) {
                                window._bcRequestBgBurst(2500);
                            }
                            return _origMsg.apply(this, arguments);
                        };
                    }
                    if (typeof window.ServerSend === 'function' && !window.__bcSendBurstHooked) {
                        window.__bcSendBurstHooked = true;
                        const _origSend = window.ServerSend;
                        window.ServerSend = function(msg, data) {
                            if (false && window._bcIsBackground && !window._bcIsMinimized && window._bcRequestBgBurst) {
                                window._bcRequestBgBurst(2500);
                            }
                            return _origSend.apply(this, arguments);
                        };
                    }
                }
                attachRoomHooks();

                // Safely free VRAM of departed characters (BC's CommonDrawWarmDrawnAssets handles active texture warming natively)
                function protectActiveRoomTextures() {
                    try {
                        attachRoomHooks();
                        ensureChatVirtualizationCss();
                        const chars = [];
                        if (window.Player) chars.push(window.Player);
                        if (window.CurrentCharacter && window.CurrentCharacter !== window.Player) chars.push(window.CurrentCharacter);
                        if (Array.isArray(window.ChatRoomCharacter)) {
                            for (let i = 0; i < window.ChatRoomCharacter.length; i++) {
                                if (window.ChatRoomCharacter[i]) chars.push(window.ChatRoomCharacter[i]);
                            }
                        }

                        // Safely purge departed room characters and release their GPU canvas buffers
                        const now = typeof window.CommonTime === 'function' ? window.CommonTime() : Date.now();
                        const drawMap = window.DrawImageCache && window.DrawImageCache.cache;
                        const glMap = window.GLDrawImageCache && window.GLDrawImageCache.cache;
                        if (drawMap && typeof drawMap.forEach === 'function') { drawMap.forEach((dImg, url) => { if (dImg && typeof url === 'string' && !url.startsWith('Assets/')) dImg.lastUsed = now; }); }
                        if (Array.isArray(window.DrawLastCharacters)) { for (let i = 0; i < window.DrawLastCharacters.length; i++) { const dc = window.DrawLastCharacters[i]; if (dc && !chars.includes(dc)) chars.push(dc); } }
                        const activeUrls = new Set();
                        for (let i = 0; i < chars.length; i++) {
                            const cObj = chars[i];
                            if (!cObj) continue;
                            if (cObj.AccountName) activeUrls.add(cObj.AccountName);
                            if (cObj.MemberNumber) activeUrls.add('Online-' + cObj.MemberNumber);
                            const drawn = cObj.DrawnAssets;
                            if (drawn && typeof drawn.forEach === 'function') {
                                drawn.forEach(url => {
                                    activeUrls.add(url);
                                });
                            }
                        }
                        lastActiveAssetUrls = activeUrls;
                        for (let i = 0; i < chars.length; i++) {
                            const cObj = chars[i];
                            const keepWarm = Boolean(cObj);
                            const drawn = keepWarm ? cObj.DrawnAssets : null;
                            if (drawn && typeof drawn.forEach === 'function') {
                                drawn.forEach(url => {
                                    const dImg = drawMap && typeof drawMap.get === 'function' ? drawMap.get(url) : null;
                                    if (dImg) dImg.lastUsed = now;
                                    const gImg = glMap && typeof glMap.get === 'function' ? glMap.get(url) : null;
                                    if (gImg) gImg.lastUsed = now;
                                });
                            }
                        }
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
                        } else if (trackedRoomCanvases.size > 0) {
                            trackedRoomCanvases.clear();
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

                // 1. Periodically prune expired textures & clean up departed character VRAM (lock active ChatRoom textures to prevent GPU re-uploads)
                setInterval(() => {
                    try {
                        if (window._bcIsMinimized) return;
                        applyPurgeDelay();
                        protectActiveRoomTextures();

                        if (window.CurrentScreen !== 'ChatRoom') {
                            if (typeof window.GLDrawImageCache !== 'undefined' && window.GLDrawImageCache && typeof window.GLDrawImageCache.purge === 'function') {
                                window.GLDrawImageCache.purge(false);
                            }
                            if (typeof window.DrawImageCache !== 'undefined' && window.DrawImageCache && typeof window.DrawImageCache.purge === 'function') {
                                window.DrawImageCache.purge(false);
                            }
                        }
                        pruneWebGlGpuTextures(lastActiveAssetUrls);
                    } catch (e) {}
                }, 15 * 1000);

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
                                        pruneWebGlGpuTextures(lastActiveAssetUrls);
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
        ";
}

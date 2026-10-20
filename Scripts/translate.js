(function () {
    "use strict";
    if (window !== window.top) return;

    function initGoogleTranslate() {
        // Clean up any legacy non-shadow DOM instances if updating live
        const legacyBtn = document.getElementById("bc-google-translate-btn");
        if (legacyBtn) legacyBtn.remove();
        const legacyPopup = document.getElementById("translate-widget-container");
        if (legacyPopup) legacyPopup.remove();
        const legacyRoot = document.getElementById("translate-root");
        if (legacyRoot) legacyRoot.remove();

        if (document.getElementById("translate-shadow-host")) return;

        // Shadow DOM Host: ensures 100% style isolation against external CSS and theme injections
        const host = document.createElement("div");
        host.id = "translate-shadow-host";
        host.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;overflow:visible;z-index:2147483640;";
        document.body.appendChild(host);

        const shadow = host.attachShadow({ mode: "open" });

        const style = document.createElement("style");
        style.textContent = `
            * { box-sizing: border-box; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            
            #bc-google-translate-btn {
                position: fixed;
                top: 10px;
                left: 10px;
                z-index: 999999;
                width: 48px;
                height: 48px;
                border-radius: 16px;
                background: linear-gradient(135deg, #9333ea, #4f46e5, #6b21a8);
                color: #ffffff;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 20px -2px rgba(147, 51, 234, 0.55);
                border: 1px solid rgba(192, 132, 252, 0.4);
                cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                user-select: none;
            }
            #bc-google-translate-btn:hover { transform: scale(1.05); }
            #bc-google-translate-btn:active { transform: scale(0.95); }
            #bc-google-translate-btn svg { width: 24px; height: 24px; pointer-events: none; }

            #translate-widget-container {
                position: fixed;
                top: 70px;
                left: 20px;
                z-index: 1000000;
                display: none;
            }

            #translate-widget {
                width: 365px;
                background: rgba(22, 23, 36, 0.96);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 26px;
                padding: 16px;
                box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.07);
                color: #f1f5f9;
                display: flex;
                flex-direction: column;
                gap: 14px;
            }

            #widget-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 2px 4px;
                cursor: move;
                user-select: none;
            }
            .header-left {
                display: flex;
                align-items: center;
                gap: 10px;
                pointer-events: none;
            }
            .header-icon {
                width: 38px;
                height: 38px;
                border-radius: 50%;
                background: linear-gradient(to top right, #7e22ce, #9333ea, #a78bfa);
                box-shadow: 0 0 15px rgba(168, 85, 247, 0.5);
                border: 1px solid rgba(216, 180, 254, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
            }
            .header-icon svg { width: 20px; height: 20px; }
            .header-title-wrap { display: flex; align-items: center; gap: 8px; }
            .header-title { font-size: 15px; font-weight: 600; color: #fff; margin: 0; }
            .uwu-badge {
                font-size: 10px;
                font-weight: 700;
                padding: 2px 8px;
                border-radius: 999px;
                background: rgba(88, 28, 135, 0.6);
                color: #d8b4fe;
                border: 1px solid rgba(168, 85, 247, 0.4);
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .header-controls { display: flex; align-items: center; gap: 6px; }
            .icon-btn {
                background: transparent;
                border: none;
                color: #94a3b8;
                cursor: pointer;
                padding: 5px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.15s;
            }
            .icon-btn:hover { color: #ffffff; background: rgba(255, 255, 255, 0.08); }

            #widget-body { display: flex; flex-direction: column; gap: 12px; }

            /* Language Row */
            .lang-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
            .bc-dropdown { position: relative; flex: 1; min-width: 0; }
            .bc-dropdown-trigger {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: rgba(32, 34, 53, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.07);
                padding: 8px 11px;
                border-radius: 12px;
                font-size: 11.5px;
                color: #e2e8f0;
                cursor: pointer;
                transition: background 0.15s, border-color 0.15s;
                user-select: none;
            }
            .bc-dropdown-trigger:hover, .bc-dropdown-trigger.active {
                background: #272940;
                border-color: rgba(139, 92, 246, 0.5);
            }
            .trigger-label-wrap { display: flex; align-items: center; gap: 7px; overflow: hidden; }
            .dot-purple {
                width: 7px; height: 7px; border-radius: 50%;
                background: #a855f7; box-shadow: 0 0 8px #a855f7; flex-shrink: 0;
            }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
            .bc-dropdown-chevron { width: 14px !important; height: 14px !important; color: #94a3b8; flex-shrink: 0; transition: transform 0.2s; }
            .bc-dropdown-trigger.active .bc-dropdown-chevron { transform: rotate(180deg); }

            .bc-dropdown-menu {
                position: absolute;
                top: calc(100% + 6px);
                left: 0;
                right: 0;
                z-index: 9999;
                background: #1a1b2e;
                border: 1px solid rgba(139, 92, 246, 0.35);
                border-radius: 14px;
                box-shadow: 0 16px 40px -8px rgba(0,0,0,0.8);
                max-height: 210px;
                overflow-y: auto;
                display: none;
            }
            .bc-dropdown-menu.open { display: block; }
            .bc-dropdown-menu::-webkit-scrollbar { width: 4px; }
            .bc-dropdown-menu::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.4); border-radius: 4px; }
            .bc-dropdown-item {
                padding: 8px 12px;
                font-size: 11.5px;
                color: #94a3b8;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: background 0.12s, color 0.12s;
            }
            .bc-dropdown-item:hover { background: rgba(139,92,246,0.18); color: #e2e8f0; }
            .bc-dropdown-item.selected { background: rgba(139,92,246,0.25); color: #c4b5fd; font-weight: 600; }
            .bc-check { width: 12px; height: 12px; opacity: 0; flex-shrink: 0; color: #a78bfa; }
            .bc-dropdown-item.selected .bc-check { opacity: 1; }
            .bc-dropdown-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 3px 0; }

            #swap-languages {
                width: 32px; height: 32px; border-radius: 10px;
                background: #202235; border: 1px solid rgba(255,255,255,0.06);
                color: #cbd5e1; display: flex; align-items: center; justify-content: center;
                cursor: pointer; flex-shrink: 0; transition: all 0.2s;
            }
            #swap-languages:hover { background: rgba(139, 92, 246, 0.25); color: #d8b4fe; }
            #swap-languages svg { width: 15px; height: 15px; }

            /* Quick Row */
            .quick-row { display: flex; align-items: center; gap: 6px; padding: 0 2px; }
            .quick-label { font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; margin-right: 2px; }
            .bc-quick-lang {
                padding: 3px 10px; border-radius: 7px;
                background: #212335; color: #cbd5e1;
                font-size: 11px; font-weight: 600;
                border: 1px solid rgba(255, 255, 255, 0.06);
                cursor: pointer; transition: all 0.15s;
            }
            .bc-quick-lang:hover, .bc-quick-lang.active-quick {
                background: rgba(139, 92, 246, 0.35);
                color: #e9d5ff;
                border-color: rgba(168, 85, 247, 0.4);
            }

            /* Box Cards */
            .box-source {
                background: #0f1019;
                border-radius: 16px;
                padding: 12px 14px;
                border: 1px solid rgba(255, 255, 255, 0.05);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                min-height: 130px;
            }
            .box-output {
                background: #1b1c2b;
                border-radius: 16px;
                padding: 12px 14px;
                border: 1px solid rgba(168, 85, 247, 0.15);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                min-height: 140px;
            }

            .bc-widget-textarea {
                width: 100%;
                background: transparent !important;
                border: none !important;
                outline: none !important;
                box-shadow: none !important;
                resize: none !important;
                color: #f1f5f9 !important;
                font-size: 13.5px !important;
                line-height: 1.5 !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            .bc-widget-textarea::placeholder { color: #64748b !important; opacity: 1; }
            .bc-widget-textarea.bc-output-muted { color: #71717a !important; }
            .bc-widget-textarea::-webkit-scrollbar { width: 4px; }
            .bc-widget-textarea::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }

            /* Correction / Fix the Word Banner */
            #bc-translate-correction-container {
                margin-top: 8px;
                padding: 6px 10px;
                border-radius: 8px;
                background: rgba(244, 63, 94, 0.12);
                border: 1px solid rgba(244, 63, 94, 0.3);
                font-size: 11.5px;
                color: #fda4af;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 6px;
            }
            .bc-spell-error {
                font-weight: 700;
                color: #fb7185;
                text-decoration: underline wavy #f43f5e;
                text-underline-offset: 3px;
                cursor: pointer;
            }
            .bc-spell-error:hover { color: #fff; }
            .fix-badge {
                font-size: 10px;
                background: rgba(244, 63, 94, 0.25);
                color: #ffe4e6;
                padding: 2px 6px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: 600;
                white-space: nowrap;
            }
            .fix-badge:hover { background: #e11d48; color: #fff; }

            .box-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding-top: 8px;
                margin-top: 6px;
                border-top: 1px solid rgba(255, 255, 255, 0.05);
            }
            .detected-badge {
                font-size: 10.5px;
                color: #a78bfa;
                font-weight: 500;
            }

            .output-header {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 10px;
                font-weight: 700;
                color: #c084fc;
                letter-spacing: 0.06em;
                margin-bottom: 6px;
                text-transform: uppercase;
            }
            #bc-translate-meta {
                display: flex;
                flex-direction: column;
                gap: 3px;
                font-size: 11px;
                color: #94a3b8;
                margin-top: 6px;
            }
            .romaji-val { color: #d8b4fe; }

            #copy-translation-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                background: linear-gradient(to right, #9333ea, #6366f1);
                color: #ffffff;
                font-weight: 600;
                font-size: 11.5px;
                padding: 6px 14px;
                border-radius: 10px;
                border: none;
                box-shadow: 0 0 15px rgba(147, 51, 234, 0.4);
                cursor: pointer;
                transition: all 0.15s ease;
                margin-left: auto;
            }
            #copy-translation-btn:hover { background: linear-gradient(to right, #a855f7, #4f46e5); }
            #copy-translation-btn:active { transform: scale(0.95); }
            #copy-translation-btn svg { width: 14px; height: 14px; }

            .hidden { display: none !important; }
        `;
        shadow.appendChild(style);

        const LANGUAGES = [
            { value: "auto",  label: "Auto Detect",     group: "common" },
            { value: "en",    label: "English (EN)",    group: "common" },
            { value: "id",    label: "Indonesian (ID)", group: "common" },
            { value: "ja",    label: "Japanese (JP)",   group: "common" },
            { value: "zh-CN", label: "Chinese (CN)",    group: "common" },
            { value: "ru",    label: "Russian (RU)",    group: "common" },
            { value: "ar",    label: "Arabic",          group: "all" },
            { value: "nl",    label: "Dutch",           group: "all" },
            { value: "tl",    label: "Filipino",        group: "all" },
            { value: "fr",    label: "French",          group: "all" },
            { value: "de",    label: "German",          group: "all" },
            { value: "hi",    label: "Hindi",           group: "all" },
            { value: "it",    label: "Italian",         group: "all" },
            { value: "ko",    label: "Korean",          group: "all" },
            { value: "ms",    label: "Malay",           group: "all" },
            { value: "pl",    label: "Polish",          group: "all" },
            { value: "pt",    label: "Portuguese",      group: "all" },
            { value: "es",    label: "Spanish",         group: "all" },
            { value: "th",    label: "Thai",            group: "all" },
            { value: "tr",    label: "Turkish",         group: "all" },
            { value: "uk",    label: "Ukrainian",       group: "all" },
            { value: "vi",    label: "Vietnamese",      group: "all" },
        ];

        const TARGET_LANGS = LANGUAGES.filter(l => l.value !== "auto");

        const wrapper = document.createElement("div");
        wrapper.innerHTML = `
            <button id="bc-google-translate-btn" aria-label="Google Translate Floating Widget">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                </svg>
            </button>

            <div id="translate-widget-container">
                <main id="translate-widget">
                    <header id="widget-header">
                        <div class="header-left">
                            <div class="header-icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"></path>
                                </svg>
                            </div>
                            <div class="header-title-wrap">
                                <h1 class="header-title">Google Translate</h1>
                                <span class="uwu-badge">UwU</span>
                            </div>
                        </div>
                        <div class="header-controls">
                            <button class="icon-btn" id="btn-minimize" title="Minimize">
                                <span style="display:block;width:12px;height:2px;background:currentColor;border-radius:2px;"></span>
                            </button>
                            <button class="icon-btn" id="btn-close" title="Close">
                                <svg style="width:14px;height:14px" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" viewBox="0 0 24 24">
                                    <line x1="18" x2="6" y1="6" y2="18"></line>
                                    <line x1="6" x2="18" y1="6" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </header>

                    <div id="widget-body">
                        <section class="lang-row">
                            <div class="bc-dropdown" id="source-dropdown">
                                <button class="bc-dropdown-trigger" id="source-trigger" type="button">
                                    <div class="trigger-label-wrap">
                                        <span class="dot-purple"></span>
                                        <span id="source-lang-label" class="truncate">Auto Detect</span>
                                    </div>
                                    <svg class="bc-dropdown-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
                                    </svg>
                                </button>
                                <div class="bc-dropdown-menu" id="source-menu"></div>
                            </div>

                            <button id="swap-languages" type="button" title="Swap Languages">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                                </svg>
                            </button>

                            <div class="bc-dropdown" id="target-dropdown">
                                <button class="bc-dropdown-trigger" id="target-trigger" type="button">
                                    <div class="trigger-label-wrap">
                                        <span class="dot-purple"></span>
                                        <span id="target-lang-label" class="truncate">English</span>
                                    </div>
                                    <svg class="bc-dropdown-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
                                    </svg>
                                </button>
                                <div class="bc-dropdown-menu" id="target-menu"></div>
                            </div>
                        </section>

                        <nav class="quick-row">
                            <span class="quick-label">QUICK:</span>
                            <button class="bc-quick-lang" data-lang="en" type="button">EN</button>
                            <button class="bc-quick-lang" data-lang="id" type="button">IND</button>
                            <button class="bc-quick-lang" data-lang="zh-CN" type="button">CN</button>
                            <button class="bc-quick-lang" data-lang="ja" type="button">JP</button>
                        </nav>

                        <section class="box-source">
                            <textarea class="bc-widget-textarea" id="source-textarea" placeholder="Type text here..." rows="3" spellcheck="true"></textarea>
                            
                            <div id="bc-translate-correction-container" class="hidden">
                                <div>Did you mean: <span id="bc-translate-correction" class="bc-spell-error"></span></div>
                                <span id="bc-fix-btn" class="fix-badge">Fix word</span>
                            </div>

                            <div class="box-footer">
                                <span id="detected-lang-badge" class="detected-badge"></span>
                                <button class="icon-btn" id="clear-input" type="button" title="Clear text">
                                    <svg style="width:14px;height:14px" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" viewBox="0 0 24 24">
                                        <line x1="18" x2="6" y1="6" y2="18"></line>
                                        <line x1="6" x2="18" y1="6" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        </section>

                        <section class="box-output">
                            <div>
                                <div class="output-header">
                                    <span class="dot-purple" style="width:6px;height:6px;"></span>
                                    <span>TRANSLATION</span>
                                </div>
                                <textarea id="translation-text" class="bc-widget-textarea bc-output-muted" rows="3" readonly placeholder="Translation will appear here..."></textarea>
                                <div id="bc-translate-meta" class="hidden">
                                    <div id="bc-translate-src-romaji" class="hidden"></div>
                                    <div id="bc-translate-tgt-romaji" class="hidden"></div>
                                </div>
                            </div>
                            
                            <div class="box-footer">
                                <button id="copy-translation-btn" type="button">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                                    </svg>
                                    <span>Copy</span>
                                </button>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        `;
        shadow.appendChild(wrapper);

        // --- State ---
        let sourceLangValue = "auto";
        let targetLangValue = "en";
        let lastDetectedLang = "";

        // --- Element refs inside Shadow DOM ---
        const $ = (id) => shadow.getElementById(id);
        const btn                 = $("bc-google-translate-btn");
        const popup               = $("translate-widget-container");
        const header              = $("widget-header");
        const bodySection         = $("widget-body");
        const minimizeBtn         = $("btn-minimize");
        const closeBtn            = $("btn-close");
        const sourceLabel         = $("source-lang-label");
        const targetLabel         = $("target-lang-label");
        const sourceTrigger       = $("source-trigger");
        const targetTrigger       = $("target-trigger");
        const sourceMenu          = $("source-menu");
        const targetMenu          = $("target-menu");
        const swapBtn             = $("swap-languages");
        const inputArea           = $("source-textarea");
        const outputArea          = $("translation-text");
        const clearBtn            = $("clear-input");
        const copyBtn             = $("copy-translation-btn");
        const correctionContainer = $("bc-translate-correction-container");
        const correctionBtn       = $("bc-translate-correction");
        const fixWordBtn          = $("bc-fix-btn");
        const detectedBadge       = $("detected-lang-badge");
        const metaDiv             = $("bc-translate-meta");
        const srcRomaji           = $("bc-translate-src-romaji");
        const tgtRomaji           = $("bc-translate-tgt-romaji");

        // Isolasi event ketikan, klik, dan fokus agar tidak dibajak oleh listener game Bondage Club atau runtime lain
        ["keydown", "keyup", "keypress", "input", "paste", "mousedown", "mouseup", "click", "pointerdown", "pointerup"].forEach(evt => {
            inputArea.addEventListener(evt, (e) => e.stopPropagation());
            outputArea.addEventListener(evt, (e) => e.stopPropagation());
        });

        // Sinkronisasi status fokus dengan memory fokus desktop/mobile
        const registerTranslateFocus = () => {
            window.bcUserPrefersGameChat = false;
            window.bcFocusMemory = inputArea;
        };
        inputArea.addEventListener("focus", registerTranslateFocus);
        inputArea.addEventListener("focusin", (e) => {
            e.stopPropagation();
            registerTranslateFocus();
        });

        function getLangLabel(langs, value) {
            const lang = langs.find(l => l.value.toLowerCase() === String(value).toLowerCase());
            return lang ? lang.label.split(" (")[0] : value;
        }

        function buildDropdownItems(langs, currentValue) {
            let html = "";
            let inAll = false;
            for (const lang of langs) {
                if (lang.group === "all" && !inAll) {
                    inAll = true;
                    html += `<div class="bc-dropdown-divider"></div>`;
                }
                const selected = lang.value === currentValue ? "selected" : "";
                html += `
                <div class="bc-dropdown-item ${selected}" data-value="${lang.value}">
                    <svg class="bc-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 13l4 4L19 7"/>
                    </svg>
                    ${lang.label}
                </div>`;
            }
            return html;
        }

        function closeAllDropdowns() {
            shadow.querySelectorAll(".bc-dropdown-trigger.active").forEach(t => t.classList.remove("active"));
            shadow.querySelectorAll(".bc-dropdown-menu.open").forEach(m => m.classList.remove("open"));
        }

        function renderMenu(menuEl, langs, currentValue, onSelect) {
            menuEl.innerHTML = buildDropdownItems(langs, currentValue);
            menuEl.querySelectorAll(".bc-dropdown-item").forEach(item => {
                item.addEventListener("click", (e) => {
                    e.stopPropagation();
                    onSelect(item.dataset.value);
                    closeAllDropdowns();
                });
            });
        }

        function updateSourceLang(value) {
            sourceLangValue = value;
            sourceLabel.innerText = getLangLabel(LANGUAGES, value);
            if (value !== "auto") detectedBadge.innerText = "";
            renderMenu(sourceMenu, LANGUAGES, value, (v) => {
                updateSourceLang(v);
                if (inputArea.value.trim()) doTranslate();
            });
        }

        function updateTargetLang(value) {
            targetLangValue = value;
            targetLabel.innerText = getLangLabel(TARGET_LANGS, value);
            shadow.querySelectorAll(".bc-quick-lang").forEach(b => {
                b.classList.toggle("active-quick", b.getAttribute("data-lang") === value);
            });
            renderMenu(targetMenu, TARGET_LANGS, value, updateTargetLang);
            if (inputArea.value.trim()) doTranslate();
        }

        renderMenu(sourceMenu, LANGUAGES, sourceLangValue, (v) => {
            updateSourceLang(v);
            if (inputArea.value.trim()) doTranslate();
        });
        updateTargetLang(targetLangValue);

        sourceTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = sourceMenu.classList.contains("open");
            closeAllDropdowns();
            if (!isOpen) {
                sourceTrigger.classList.add("active");
                sourceMenu.classList.add("open");
            }
        });

        targetTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = targetMenu.classList.contains("open");
            closeAllDropdowns();
            if (!isOpen) {
                targetTrigger.classList.add("active");
                targetMenu.classList.add("open");
            }
        });

        // Cegah kebocoran event mousedown & click dari dalam panel translate ke canvas game
        popup.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            registerTranslateFocus();
        });
        popup.addEventListener("click", (e) => {
            e.stopPropagation();
            closeAllDropdowns();
        });
        document.addEventListener("click", closeAllDropdowns);

        // --- Swap (Mendukung swap dari bahasa yang terdeteksi otomatis) ---
        swapBtn.onclick = (e) => {
            e.stopPropagation();
            const effectiveSource = sourceLangValue === "auto" ? (lastDetectedLang || "en") : sourceLangValue;
            const prevTarget = targetLangValue;
            updateSourceLang(prevTarget);
            updateTargetLang(effectiveSource);
            if (outputArea.value && outputArea.value !== "Translating...") {
                inputArea.value = outputArea.value;
                doTranslate();
            }
        };

        // --- Clear ---
        clearBtn.onclick = (e) => {
            e.stopPropagation();
            inputArea.value = "";
            outputArea.value = "";
            outputArea.classList.add("bc-output-muted");
            correctionContainer.classList.add("hidden");
            metaDiv.classList.add("hidden");
            detectedBadge.innerText = "";
            registerTranslateFocus();
            inputArea.focus();
        };

        // --- Copy ---
        copyBtn.onclick = async (e) => {
            e.stopPropagation();
            if (!outputArea.value || outputArea.value === "Translating...") return;
            const textToCopy = outputArea.value;
            const showSuccess = () => {
                const originalHtml = copyBtn.innerHTML;
                copyBtn.innerHTML = `<span style="color:#6ee7b7">✓ Copied!</span>`;
                setTimeout(() => { copyBtn.innerHTML = originalHtml; }, 1400);
            };

            try {
                await navigator.clipboard.writeText(textToCopy);
                showSuccess();
            } catch (err) {
                try {
                    const fallbackInput = document.createElement("textarea");
                    fallbackInput.value = textToCopy;
                    fallbackInput.style.position = "fixed";
                    fallbackInput.style.left = "-9999px";
                    document.body.appendChild(fallbackInput);
                    fallbackInput.select();
                    document.execCommand("copy");
                    fallbackInput.remove();
                    showSuccess();
                } catch (fallbackErr) {
                    console.error("Failed to copy translation text", fallbackErr);
                }
            }
        };

        // --- Quick lang presets ---
        shadow.querySelectorAll(".bc-quick-lang").forEach(langBtn => {
            langBtn.onclick = (e) => {
                e.stopPropagation();
                updateTargetLang(langBtn.getAttribute("data-lang"));
            };
        });

        // --- Fungsi Terapkan Koreksi Kata (Fix the Word) ---
        let currentCorrectionText = "";
        const applyCorrection = (e) => {
            e.stopPropagation();
            if (!currentCorrectionText) return;
            inputArea.value = currentCorrectionText;
            correctionContainer.classList.add("hidden");
            doTranslate();
        };
        correctionBtn.onclick = applyCorrection;
        fixWordBtn.onclick = applyCorrection;

        // --- Ekstraktor Spell Check & Deteksi Bahasa ---
        function extractGoogleData(data) {
            let translated = "";
            let srcRm = "";
            let tgtRm = "";
            let spellResult = null;
            let detectedLang = data[2] || "";

            if (Array.isArray(data[0])) {
                data[0].forEach(item => {
                    if (item && item[0]) translated += item[0];
                });
                const lastItem = data[0][data[0].length - 1];
                if (lastItem && lastItem[0] === null) {
                    tgtRm = lastItem[2] || "";
                    srcRm = lastItem[3] || "";
                }
            }

            // Cek semua kemungkinan indeks koreksi ejaan (data[7] atau data[8])
            for (const idx of [7, 8]) {
                if (Array.isArray(data[idx])) {
                    // Biasanya di [idx][1] (berformat teks bersih) atau [idx][0] (dengan tag <b><i>)
                    const candidate = data[idx][1] || data[idx][0];
                    if (typeof candidate === "string" && candidate.trim()) {
                        spellResult = candidate.replace(/<\/?[^>]+(>|$)/g, "").trim();
                        break;
                    }
                }
            }

            return { translated, srcRm, tgtRm, spellResult, detectedLang };
        }

        // --- Translation Core ---
        let debounceTimer;
        let translateReqId = 0;

        const doTranslate = async () => {
            const text = inputArea.value.trim();
            if (!text) {
                outputArea.value = "";
                outputArea.classList.add("bc-output-muted");
                correctionContainer.classList.add("hidden");
                metaDiv.classList.add("hidden");
                detectedBadge.innerText = "";
                return;
            }

            const reqId = ++translateReqId;
            outputArea.classList.remove("bc-output-muted");
            outputArea.value = "Translating...";

            const sl = sourceLangValue;
            const tl = targetLangValue;
            const q  = encodeURIComponent(text);

            // Tambahkan dt=qc dan fallback agar spellcheck & language detection selalu terpancing
            const tryGoogle = async (base, sourceLang) => {
                const url = `${base}/translate_a/single?client=gtx&sl=${sourceLang}&tl=${tl}&hl=en&dt=t&dt=bd&dt=rm&dt=qca&dt=qc&dt=sp&dt=ss&q=${q}`;
                const r = await fetch(url);
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            };

            const tryGoogleDict = async () => {
                const r = await fetch(`https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sl}&tl=${tl}&dt=t&dt=rm&dt=sp&dt=qc&q=${q}`);
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const d = await r.json();
                if (d.sentences) {
                    let t = "", sRm = "", tRm = "";
                    d.sentences.forEach(s => {
                        if (s.trans) t += s.trans;
                        if (s.src_translit) sRm = s.src_translit;
                        if (s.translit) tRm = s.translit;
                    });
                    let spell = d.spell && (d.spell.spell_res || d.spell.spell_html_res)
                        ? (d.spell.spell_res || d.spell.spell_html_res).replace(/<\/?[^>]+(>|$)/g, "").trim()
                        : null;
                    return { translated: t, srcRm: sRm, tgtRm: tRm, spellResult: spell, detectedLang: d.src || "" };
                }
                throw new Error("dict: unexpected format");
            };

            try {
                let res = null;
                let rawData = null;

                try { rawData = await tryGoogle("https://translate.googleapis.com", sl); } catch (_) {}
                if (!rawData) {
                    try { rawData = await tryGoogle("https://translate.google.com", sl); } catch (_) {}
                }

                if (rawData) {
                    res = extractGoogleData(rawData);
                    // Jika hasil terjemahan sama persis dengan input (gejala typo yang gagal diterjemahkan saat sl !== 'auto'),
                    // pancing ulang dengan sl=auto untuk memaksa spell-checker Google keluar
                    if (!res.spellResult && sl !== "auto" && res.translated.toLowerCase() === text.toLowerCase()) {
                        try {
                            const retryAuto = await tryGoogle("https://translate.googleapis.com", "auto");
                            const autoExtracted = extractGoogleData(retryAuto);
                            if (autoExtracted.spellResult) res.spellResult = autoExtracted.spellResult;
                            if (autoExtracted.detectedLang) res.detectedLang = autoExtracted.detectedLang;
                        } catch (_) {}
                    }
                } else {
                    res = await tryGoogleDict();
                }

                if (reqId !== translateReqId) return; // Abaikan response lama jika user masih mengetik

                // Tampilkan Detected Language jika berhasil dideteksi
                if (res.detectedLang) {
                    lastDetectedLang = res.detectedLang;
                    const langName = getLangLabel(LANGUAGES, res.detectedLang);
                    if (sourceLangValue === "auto") {
                        detectedBadge.innerText = `Detected: ${langName}`;
                        sourceLabel.innerText = `Auto (${langName})`;
                    } else if (res.detectedLang.toLowerCase() !== sourceLangValue.toLowerCase() && text.split(/\s+/).length >= 2) {
                        detectedBadge.innerText = `Detected: ${langName}`;
                    } else {
                        detectedBadge.innerText = "";
                    }
                }

                // Tampilkan "Did you mean" (Fix the Word) jika ada saran ejaan
                if (res.spellResult && res.spellResult.toLowerCase() !== text.toLowerCase()) {
                    currentCorrectionText = res.spellResult;
                    correctionBtn.innerText = res.spellResult;
                    correctionContainer.classList.remove("hidden");
                } else {
                    currentCorrectionText = "";
                    correctionContainer.classList.add("hidden");
                }

                // Romaji / Transliteration
                if (res.srcRm || res.tgtRm) {
                    metaDiv.classList.remove("hidden");
                    if (res.srcRm) {
                        srcRomaji.classList.remove("hidden");
                        srcRomaji.innerHTML = `Read (Source): <span class="romaji-val">${res.srcRm}</span>`;
                    } else {
                        srcRomaji.classList.add("hidden");
                    }
                    if (res.tgtRm) {
                        tgtRomaji.classList.remove("hidden");
                        tgtRomaji.innerHTML = `Read (Target): <span class="romaji-val">${res.tgtRm}</span>`;
                    } else {
                        tgtRomaji.classList.add("hidden");
                    }
                } else {
                    metaDiv.classList.add("hidden");
                }

                outputArea.value = res.translated || "(empty)";
            } catch (err) {
                if (reqId !== translateReqId) return;
                outputArea.value = "Error: " + (err.message || "Failed to translate.");
            }
        };

        inputArea.addEventListener("input", () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(doTranslate, 400);
        });

        // --- Window controls ---
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            popup.style.display = "none";
            if (window.bcFocusMemory === inputArea) {
                window.bcFocusMemory = null;
            }
        };

        let isMinimized = false;
        minimizeBtn.onclick = (e) => {
            e.stopPropagation();
            isMinimized = !isMinimized;
            bodySection.style.display = isMinimized ? "none" : "flex";
        };

        // --- Dragging ---
        let btnDragging = false, btnMoved = false, popupDragging = false;
        let startX, startY, btnInitX, btnInitY, popupInitX, popupInitY;

        const onMouseMove = (e) => {
            const pos = (e.touches && e.touches[0]) ? e.touches[0] : e;
            const dx = pos.clientX - startX;
            const dy = pos.clientY - startY;
            if (btnDragging) {
                if (!btnMoved && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
                    btnMoved = true;
                }
                if (btnMoved) {
                    const newX = Math.max(0, Math.min(btnInitX + dx, window.innerWidth - btn.offsetWidth));
                    const newY = Math.max(0, Math.min(btnInitY + dy, window.innerHeight - btn.offsetHeight));
                    btn.style.left = `${newX}px`;
                    btn.style.top  = `${newY}px`;
                }
            } else if (popupDragging) {
                const newX = Math.max(0, Math.min(popupInitX + dx, window.innerWidth - popup.offsetWidth));
                const newY = Math.max(0, Math.min(popupInitY + dy, window.innerHeight - popup.offsetHeight));
                popup.style.left = `${newX}px`;
                popup.style.top  = `${newY}px`;
            }
        };

        const onMouseUp = () => {
            btnDragging = false;
            popupDragging = false;
            window.removeEventListener("mousemove", onMouseMove, true);
            window.removeEventListener("mouseup", onMouseUp, true);
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            document.removeEventListener("touchmove", onMouseMove);
            document.removeEventListener("touchend", onMouseUp);
            setTimeout(() => { btnMoved = false; }, 60);
        };

        const onStartDragBtn = (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            btnDragging = true;
            btnMoved = false;
            const pos = (e.touches && e.touches[0]) ? e.touches[0] : e;
            startX = pos.clientX;
            startY = pos.clientY;
            btnInitX = btn.offsetLeft;
            btnInitY = btn.offsetTop;
            window.addEventListener("mousemove", onMouseMove, { capture: true, passive: true });
            window.addEventListener("mouseup", onMouseUp, { capture: true });
            document.addEventListener("touchmove", onMouseMove, { passive: false });
            document.addEventListener("touchend", onMouseUp);
        };

        btn.onmousedown = onStartDragBtn;
        btn.ontouchstart = onStartDragBtn;

        const onStartDragHeader = (e) => {
            if (e.target.closest("button")) return;
            if (e.button !== undefined && e.button !== 0) return;
            popupDragging = true;
            const pos = (e.touches && e.touches[0]) ? e.touches[0] : e;
            startX = pos.clientX;
            startY = pos.clientY;
            popupInitX = popup.offsetLeft;
            popupInitY = popup.offsetTop;
            window.addEventListener("mousemove", onMouseMove, { capture: true, passive: true });
            window.addEventListener("mouseup", onMouseUp, { capture: true });
            document.addEventListener("touchmove", onMouseMove, { passive: false });
            document.addEventListener("touchend", onMouseUp);
        };

        header.onmousedown = onStartDragHeader;
        header.ontouchstart = onStartDragHeader;

        window.addEventListener("resize", () => {
            if (btn.style.left) {
                const curX = parseFloat(btn.style.left) || btn.offsetLeft;
                const curY = parseFloat(btn.style.top) || btn.offsetTop;
                btn.style.left = `${Math.max(0, Math.min(curX, window.innerWidth - btn.offsetWidth))}px`;
                btn.style.top  = `${Math.max(0, Math.min(curY, window.innerHeight - btn.offsetHeight))}px`;
            }
            if (popup.style.left) {
                const curX = parseFloat(popup.style.left) || popup.offsetLeft;
                const curY = parseFloat(popup.style.top) || popup.offsetTop;
                popup.style.left = `${Math.max(0, Math.min(curX, window.innerWidth - popup.offsetWidth))}px`;
                popup.style.top  = `${Math.max(0, Math.min(curY, window.innerHeight - popup.offsetHeight))}px`;
            }
        });

        btn.onclick = (e) => {
            e.stopPropagation();
            if (btnMoved) { e.preventDefault(); return; }
            if (popup.style.display === "none" || !popup.style.display) {
                popup.style.display = "block";
                registerTranslateFocus();
                setTimeout(() => inputArea.focus(), 60);
            } else {
                popup.style.display = "none";
                if (window.bcFocusMemory === inputArea) {
                    window.bcFocusMemory = null;
                }
            }
        };

        window.addEventListener("keydown", (e) => {
            if ((e.key === "Escape" || e.keyCode === 27) && popup.style.display === "block") {
                popup.style.display = "none";
                if (window.bcFocusMemory === inputArea) {
                    window.bcFocusMemory = null;
                }
                e.stopPropagation();
            }
        }, true);

        // Integrasi dengan Focus Crawler platform runtime (WPF / Linux / WebView2)
        // Memastikan kursor tidak ditarik paksa ke chat game saat widget Translate aktif
        function wrapCrawler(fn) {
            if (typeof fn !== "function") return fn;
            const wrapped = function () {
                if (popup && popup.style.display === "block" && !window.bcUserPrefersGameChat) {
                    if (inputArea && !inputArea.disabled && !inputArea.readOnly) {
                        return inputArea;
                    }
                }
                return fn.apply(this, arguments);
            };
            wrapped._translateHooked = true;
            return wrapped;
        }

        try {
            let _crawler = wrapCrawler(window.bcRunFocusCrawler);
            Object.defineProperty(window, "bcRunFocusCrawler", {
                configurable: true,
                enumerable: true,
                get: () => _crawler,
                set: (newFn) => {
                    _crawler = wrapCrawler(newFn);
                }
            });
        } catch (err) {
            const crawlerInterval = setInterval(() => {
                if (typeof window.bcRunFocusCrawler === "function" && !window.bcRunFocusCrawler._translateHooked) {
                    window.bcRunFocusCrawler = wrapCrawler(window.bcRunFocusCrawler);
                }
            }, 400);
            setTimeout(() => clearInterval(crawlerInterval), 20000);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initGoogleTranslate);
    } else {
        initGoogleTranslate();
    }
})();

(function () {
    "use strict";
    if (window !== window.top) return;

    function initGoogleTranslate() {
        if (document.getElementById("bc-google-translate-btn")) return;

        if (!document.getElementById("translate-glassmorphic-styles")) {
            const style = document.createElement("style");
            style.id = "translate-glassmorphic-styles";
            style.innerHTML = `
                /* Translate Floating Widget Static CSS (Zero Runtime Dependency) */
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
                }
                #bc-google-translate-btn:hover { transform: scale(1.05); }
                #bc-google-translate-btn:active { transform: scale(0.95); }
                #bc-google-translate-btn svg { width: 24px; height: 24px; color: #ffffff; }

                #translate-root {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 0;
                    height: 0;
                    overflow: visible;
                    z-index: 999990;
                    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    color: #e2e8f0;
                }
                #translate-root * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                #translate-root .hidden { display: none !important; }

                #translate-widget-container {
                    position: fixed;
                    top: 70px;
                    left: 20px;
                    z-index: 1000000;
                }

                #translate-widget {
                    width: 380px;
                    max-width: calc(100vw - 32px);
                    border-radius: 24px;
                    background: rgba(22, 23, 36, 0.96);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.07);
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    position: relative;
                    box-sizing: border-box;
                    color: #e2e8f0;
                    user-select: none;
                }

                #translate-widget #widget-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 2px 4px;
                    cursor: move;
                }
                #translate-widget .header-title-group {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    pointer-events: none;
                }
                #translate-widget .header-icon {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 38px;
                    height: 38px;
                    border-radius: 9999px;
                    background: linear-gradient(135deg, #7e22ce, #9333ea, #a855f7);
                    box-shadow: 0 0 15px rgba(168, 85, 247, 0.5);
                    border: 1px solid rgba(216, 180, 254, 0.35);
                    flex-shrink: 0;
                }
                #translate-widget .header-icon svg {
                    width: 20px;
                    height: 20px;
                    color: #ffffff;
                }
                #translate-widget .header-text-container {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                #translate-widget h1 {
                    font-size: 15px !important;
                    font-weight: 600 !important;
                    letter-spacing: -0.01em !important;
                    color: #ffffff !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    line-height: 1.2 !important;
                }
                #translate-widget .uwu-badge {
                    font-size: 10px;
                    font-weight: 700;
                    padding: 2px 8px;
                    border-radius: 9999px;
                    background: rgba(88, 28, 135, 0.6);
                    color: #d8b4fe;
                    border: 1px solid rgba(168, 85, 247, 0.4);
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                }
                #translate-widget .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #a1a1aa;
                }
                #translate-widget #btn-minimize,
                #translate-widget #btn-close {
                    background: transparent;
                    border: none;
                    color: #a1a1aa;
                    cursor: pointer;
                    padding: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    transition: color 0.15s ease, background 0.15s ease;
                }
                #translate-widget #btn-minimize:hover,
                #translate-widget #btn-close:hover {
                    color: #ffffff;
                    background: rgba(255, 255, 255, 0.08);
                }
                #translate-widget #btn-minimize span {
                    display: block;
                    width: 12px;
                    height: 2px;
                    background: currentColor;
                    border-radius: 2px;
                }
                #translate-widget #btn-close svg {
                    width: 14px;
                    height: 14px;
                }

                #translate-widget #widget-body {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                /* Dropdown */
                .bc-dropdown { position: relative; flex: 1; min-width: 0; }
                .bc-dropdown-trigger {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(32, 34, 53, 0.95);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    padding: 8px 12px;
                    border-radius: 12px;
                    font-size: 11px;
                    color: #e2e8f0;
                    cursor: pointer;
                    transition: background 0.15s, border-color 0.15s;
                    font-family: inherit;
                    user-select: none;
                    box-sizing: border-box;
                    gap: 8px;
                }
                .bc-dropdown-trigger:hover {
                    background: rgba(42, 44, 68, 1);
                    border-color: rgba(168, 85, 247, 0.35);
                }
                .bc-dropdown-trigger.active {
                    border-color: rgba(139, 92, 246, 0.6);
                    background: rgba(42, 44, 68, 1);
                }
                .bc-dropdown-label-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    flex: 1;
                }
                .bc-dropdown-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 9999px;
                    background: #a855f7;
                    box-shadow: 0 0 8px #a855f7;
                    display: inline-block;
                    flex-shrink: 0;
                }
                .bc-dropdown-text {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-weight: 500;
                }
                .bc-dropdown-chevron {
                    width: 14px !important;
                    height: 14px !important;
                    min-width: 14px !important;
                    min-height: 14px !important;
                    max-width: 14px !important;
                    max-height: 14px !important;
                    color: #a1a1aa;
                    transition: transform 0.2s cubic-bezier(0.34,1.2,0.64,1);
                    flex-shrink: 0;
                }
                .bc-dropdown-trigger.active .bc-dropdown-chevron {
                    transform: rotate(180deg);
                }

                .bc-dropdown-menu {
                    position: absolute;
                    top: calc(100% + 6px);
                    left: 0;
                    right: 0;
                    z-index: 9999;
                    background: #1a1b2e;
                    border: 1px solid rgba(139, 92, 246, 0.3);
                    border-radius: 14px;
                    overflow: hidden;
                    box-shadow: 0 16px 40px -8px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05);
                    transform-origin: top center;
                    transform: scaleY(0.85) translateY(-6px);
                    opacity: 0;
                    pointer-events: none;
                    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), opacity 0.15s ease;
                    max-height: 220px;
                    overflow-y: auto;
                }
                .bc-dropdown-menu::-webkit-scrollbar { width: 3px; }
                .bc-dropdown-menu::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.4); border-radius: 3px; }
                .bc-dropdown-menu.open {
                    transform: scaleY(1) translateY(0);
                    opacity: 1;
                    pointer-events: auto;
                }
                .bc-dropdown-item {
                    padding: 8px 12px;
                    font-size: 11px;
                    color: #94a3b8;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: background 0.12s, color 0.12s;
                    font-family: inherit;
                }
                .bc-dropdown-item:hover { background: rgba(139,92,246,0.15); color: #c4b5fd; }
                .bc-dropdown-item.selected { background: rgba(139,92,246,0.2); color: #a78bfa; font-weight: 600; }
                .bc-dropdown-item .bc-check {
                    width: 12px; height: 12px;
                    opacity: 0;
                    transition: opacity 0.12s;
                    flex-shrink: 0;
                    color: #a78bfa;
                }
                .bc-dropdown-item.selected .bc-check { opacity: 1; }
                .bc-dropdown-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 2px 0; }

                /* Swap Button */
                #translate-widget #swap-languages {
                    width: 32px;
                    height: 32px;
                    min-width: 32px;
                    min-height: 32px;
                    border-radius: 12px;
                    background: #202235;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #cbd5e1;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                    padding: 0;
                }
                #translate-widget #swap-languages:hover {
                    background: #2b2d45;
                    color: #d8b4fe;
                    border-color: rgba(168, 85, 247, 0.35);
                }
                #translate-widget #swap-languages:active {
                    transform: rotate(180deg);
                }
                #translate-widget #swap-languages svg {
                    width: 16px;
                    height: 16px;
                }

                /* Quick Presets */
                #translate-widget .quick-presets-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 0 2px;
                }
                #translate-widget .quick-presets-title {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    color: #64748b;
                    margin-right: 2px;
                }
                #translate-widget .bc-quick-lang {
                    padding: 3px 10px;
                    border-radius: 6px;
                    background: #212335;
                    color: #cbd5e1;
                    font-size: 11px;
                    font-weight: 500;
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                #translate-widget .bc-quick-lang:hover {
                    background: rgba(147, 51, 234, 0.35);
                    color: #d8b4fe;
                    border-color: rgba(168, 85, 247, 0.4);
                }

                /* Input Section */
                #translate-widget .translate-input-section {
                    background: #0f1019;
                    border-radius: 16px;
                    padding: 14px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    min-height: 140px;
                    position: relative;
                    box-sizing: border-box;
                }
                #translate-widget #source-textarea {
                    width: 100%;
                    font-size: 13px;
                    color: #e2e8f0;
                    background: transparent;
                    border: none;
                    outline: none;
                    resize: none;
                    padding: 0;
                    font-family: inherit;
                    line-height: 1.5;
                    box-sizing: border-box;
                }
                #translate-widget #source-textarea::placeholder {
                    color: #52525b;
                }
                #translate-widget #clear-input {
                    background: transparent;
                    border: none;
                    color: #71717a;
                    cursor: pointer;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: color 0.15s ease;
                    margin-left: auto;
                }
                #translate-widget #clear-input:hover {
                    color: #ffffff;
                }
                #translate-widget #clear-input svg {
                    width: 14px;
                    height: 14px;
                }

                /* Output Section */
                #translate-widget .translate-output-section {
                    background: #1b1c2b;
                    border-radius: 16px;
                    padding: 14px;
                    border: 1px solid rgba(168, 85, 247, 0.15);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    min-height: 148px;
                    box-sizing: border-box;
                }
                #translate-widget #translation-text {
                    width: 100%;
                    font-size: 14px;
                    font-weight: 500;
                    line-height: 1.4;
                    color: #e2e8f0;
                    background: transparent;
                    border: none;
                    outline: none;
                    resize: none;
                    padding: 0;
                    font-family: inherit;
                    box-sizing: border-box;
                }
                #translate-widget #translation-text.bc-output-muted {
                    color: #71717a;
                }
                #translate-widget #copy-translation-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: linear-gradient(135deg, #9333ea, #7e22ce, #4f46e5);
                    color: #ffffff;
                    font-weight: 600;
                    font-size: 12px;
                    padding: 6px 14px;
                    border-radius: 12px;
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 0 15px rgba(147, 51, 234, 0.4);
                    transition: transform 0.15s ease, filter 0.15s ease;
                    margin-left: auto;
                    margin-top: 8px;
                }
                #translate-widget #copy-translation-btn:hover {
                    filter: brightness(1.1);
                }
                #translate-widget #copy-translation-btn:active {
                    transform: scale(0.95);
                }
                #translate-widget #copy-translation-btn svg {
                    width: 14px;
                    height: 14px;
                    color: #ffffff;
                }

                .bc-spell-error {
                    text-decoration: underline;
                    text-decoration-style: wavy;
                    text-decoration-color: #f43f5e;
                    text-underline-offset: 5px;
                    cursor: pointer;
                }
                .bc-translator-scroll::-webkit-scrollbar { width: 4px; }
                .bc-translator-scroll::-webkit-scrollbar-track { background: transparent; }
                .bc-translator-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

                /* Dedicated class for widget textareas — does not touch BC game styles */
                html body #translate-widget-container .bc-widget-textarea {
                    background: transparent !important;
                    background-color: transparent !important;
                    border: none !important;
                    outline: none !important;
                    box-shadow: none !important;
                    resize: none !important;
                    font-family: ui-sans-serif, system-ui, sans-serif !important;
                    color: #e2e8f0 !important;
                }
                html body #translate-widget-container .bc-widget-textarea::placeholder {
                    opacity: 1 !important;
                }
                html body #translate-widget-container .bc-widget-textarea.bc-output-muted { color: #71717a !important; }
                html body #translate-widget-container .bc-widget-textarea.bc-output-active { color: #e2e8f0 !important; }
            `;
            document.head.appendChild(style);
        }

        const btn = document.createElement("button");
        btn.id = "bc-google-translate-btn";
        btn.setAttribute("aria-label", "Google Translate Floating Widget");
        btn.innerHTML = `
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
        </svg>`;
        const popup = document.createElement("div");
        popup.id = "translate-widget-container";
        popup.style.display = "none";

        const LANGUAGES = [
            { value: "auto",  label: "Auto",           group: "common" },
            { value: "en",    label: "English (EN)",    group: "common" },
            { value: "id",    label: "Indonesian (ID)", group: "common" },
            { value: "ja",    label: "Japanese (JP)",   group: "common" },
            { value: "zh-CN", label: "Chinese (CN)",    group: "common" },
            { value: "ru",    label: "Russian (RU)",    group: "common" },
            // all
            { value: "ar",    label: "Arabic",     group: "all" },
            { value: "nl",    label: "Dutch",      group: "all" },
            { value: "tl",    label: "Filipino",   group: "all" },
            { value: "fr",    label: "French",     group: "all" },
            { value: "de",    label: "German",     group: "all" },
            { value: "hi",    label: "Hindi",      group: "all" },
            { value: "it",    label: "Italian",    group: "all" },
            { value: "ko",    label: "Korean",     group: "all" },
            { value: "ms",    label: "Malay",      group: "all" },
            { value: "pl",    label: "Polish",     group: "all" },
            { value: "pt",    label: "Portuguese", group: "all" },
            { value: "es",    label: "Spanish",    group: "all" },
            { value: "th",    label: "Thai",       group: "all" },
            { value: "tr",    label: "Turkish",    group: "all" },
            { value: "uk",    label: "Ukrainian",  group: "all" },
            { value: "vi",    label: "Vietnamese", group: "all" },
        ];

        const TARGET_LANGS = LANGUAGES.filter(l => l.value !== "auto");

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

        popup.innerHTML = `
<main id="translate-widget">
    <header id="widget-header">
        <div class="header-title-group">
            <div class="header-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"></path>
                </svg>
            </div>
            <div class="header-text-container">
                <h1>Google Translate</h1>
                <span class="uwu-badge">UwU</span>
            </div>
        </div>
        <div class="header-actions">
            <button aria-label="Minimize Widget" id="btn-minimize" type="button">
                <span></span>
            </button>
            <button aria-label="Close Widget" id="btn-close" type="button">
                <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" viewBox="0 0 24 24">
                    <line x1="18" x2="6" y1="6" y2="18"></line>
                    <line x1="6" x2="18" y1="6" y2="18"></line>
                </svg>
            </button>
        </div>
    </header>

    <div id="widget-body">
        <!-- Language Selectors -->
        <section class="lang-select-row" style="display:flex;align-items:center;justify-content:space-between;gap:6px;padding-top:2px;">
            <!-- Source dropdown -->
            <div class="bc-dropdown" id="source-dropdown">
                <button class="bc-dropdown-trigger" id="source-trigger" type="button" style="display:flex;align-items:center;justify-content:space-between;width:100%;height:38px;padding:6px 10px;box-sizing:border-box;">
                    <div class="bc-dropdown-label-group" style="display:flex;align-items:center;gap:6px;overflow:hidden;flex:1;min-width:0;">
                        <span class="bc-dropdown-dot" style="width:7px;height:7px;border-radius:9999px;background:#a855f7;flex-shrink:0;"></span>
                        <span id="source-lang-label" class="bc-dropdown-text" style="font-size:11px;font-weight:600;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Auto</span>
                    </div>
                    <svg class="bc-dropdown-chevron" width="14" height="14" style="width:14px;height:14px;min-width:14px;min-height:14px;max-width:14px;max-height:14px;flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
                    </svg>
                </button>
                <div class="bc-dropdown-menu" id="source-menu"></div>
            </div>

            <!-- Swap button -->
            <button aria-label="Swap Languages" id="swap-languages" type="button" style="width:36px;height:36px;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
                <svg width="16" height="16" style="width:16px;height:16px;min-width:16px;min-height:16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                </svg>
            </button>

            <!-- Target dropdown -->
            <div class="bc-dropdown" id="target-dropdown">
                <button class="bc-dropdown-trigger" id="target-trigger" type="button" style="display:flex;align-items:center;justify-content:space-between;width:100%;height:38px;padding:6px 10px;box-sizing:border-box;">
                    <div class="bc-dropdown-label-group" style="display:flex;align-items:center;gap:6px;overflow:hidden;flex:1;min-width:0;">
                        <span class="bc-dropdown-dot" style="width:7px;height:7px;border-radius:9999px;background:#a855f7;flex-shrink:0;"></span>
                        <span id="target-lang-label" class="bc-dropdown-text" style="font-size:11px;font-weight:600;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">English</span>
                    </div>
                    <svg class="bc-dropdown-chevron" width="14" height="14" style="width:14px;height:14px;min-width:14px;min-height:14px;max-width:14px;max-height:14px;flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
                    </svg>
                </button>
                <div class="bc-dropdown-menu" id="target-menu"></div>
            </div>
        </section>

        <!-- Quick presets -->
        <nav aria-label="Quick languages" class="quick-presets-row">
            <span class="quick-presets-title">QUICK:</span>
            <button class="bc-quick-lang" data-lang="en" type="button">EN</button>
            <button class="bc-quick-lang" data-lang="id" type="button">IND</button>
            <button class="bc-quick-lang" data-lang="zh-CN" type="button">CN</button>
        </nav>

        <!-- Source input -->
        <section class="translate-input-section" style="background:#0f1019;border-radius:16px;padding:12px;border:1px solid rgba(255,255,255,0.06);">
            <textarea class="bc-widget-textarea bc-translator-scroll" id="source-textarea" placeholder="Type text here..." rows="3" style="background:transparent!important;color:#e2e8f0!important;border:none!important;box-shadow:none!important;outline:none!important;width:100%;"></textarea>
            
            <div id="bc-translate-correction-container" class="hidden" style="display:none;font-size:12px;color:#fb7185;margin-top:4px;padding-bottom:4px;">
                Did you mean: <span id="bc-translate-correction" class="bc-spell-error"></span>
            </div>

            <div style="display:flex;align-items:center;justify-content:flex-end;padding-top:8px;border-top:1px solid rgba(255,255,255,0.04);margin-top:auto;">
                <button aria-label="Clear text" id="clear-input" type="button">
                    <svg width="14" height="14" style="width:14px;height:14px;" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" viewBox="0 0 24 24"><line x1="18" x2="6" y1="6" y2="18"></line><line x1="6" x2="18" y1="6" y2="18"></line></svg>
                </button>
            </div>
        </section>

        <!-- Output -->
        <section class="translate-output-section" style="background:#1b1c2b;border-radius:16px;padding:12px;border:1px solid rgba(168,85,247,0.18);">
            <div>
                <div style="display:flex;align-items:center;gap:6px;font-size:10px;font-weight:700;color:#c084fc;letter-spacing:0.05em;margin-bottom:8px;text-transform:uppercase;">
                    <span style="width:6px;height:6px;border-radius:9999px;background:#a855f7;"></span>
                    <span>TRANSLATION</span>
                </div>
                <textarea id="translation-text" class="bc-widget-textarea bc-output-muted bc-translator-scroll" rows="3" readonly placeholder="Translation will appear here..." style="background:transparent!important;color:#e2e8f0!important;border:none!important;box-shadow:none!important;outline:none!important;width:100%;"></textarea>
                <div id="bc-translate-meta" class="hidden" style="display:none;flex-direction:column;gap:4px;font-size:11px;color:#71768e;font-weight:500;margin-top:4px;">
                    <div id="bc-translate-src-romaji" class="hidden"></div>
                    <div id="bc-translate-tgt-romaji" class="hidden"></div>
                </div>
            </div>
            
            <div style="display:flex;align-items:center;justify-content:flex-end;padding-top:12px;border-top:1px solid rgba(255,255,255,0.04);margin-top:8px;">
                <button id="copy-translation-btn" type="button">
                    <svg width="14" height="14" style="width:14px;height:14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
                    <span id="copy-text-span">Copy</span>
                </button>
            </div>
        </section>
    </div>
</main>`;

        const root = document.createElement("div");
        root.id = "translate-root";
        root.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;overflow:visible;z-index:999990";
        root.appendChild(btn);
        root.appendChild(popup);
        document.body.appendChild(root);

        // --- State ---
        let sourceLangValue = "auto";
        let targetLangValue = "en";

        // --- Element refs ---
        const header          = document.getElementById("widget-header");
        const bodySection     = document.getElementById("widget-body");
        const minimizeBtn     = document.getElementById("btn-minimize");
        const closeBtn        = document.getElementById("btn-close");
        const sourceLabel     = document.getElementById("source-lang-label");
        const targetLabel     = document.getElementById("target-lang-label");
        const sourceTrigger   = document.getElementById("source-trigger");
        const targetTrigger   = document.getElementById("target-trigger");
        const sourceMenu      = document.getElementById("source-menu");
        const targetMenu      = document.getElementById("target-menu");
        const swapBtn         = document.getElementById("swap-languages");
        const inputArea       = document.getElementById("source-textarea");
        const outputArea      = document.getElementById("translation-text");
        const clearBtn        = document.getElementById("clear-input");
        const copyBtn         = document.getElementById("copy-translation-btn");
        const correctionContainer = document.getElementById("bc-translate-correction-container");
        const correctionBtn   = document.getElementById("bc-translate-correction");
        const metaDiv         = document.getElementById("bc-translate-meta");
        const srcRomaji       = document.getElementById("bc-translate-src-romaji");
        const tgtRomaji       = document.getElementById("bc-translate-tgt-romaji");

        // --- Custom dropdown logic ---
        function getLangLabel(langs, value) {
            const lang = langs.find(l => l.value === value);
            return lang ? lang.label.split(" (")[0] : value;
        }

        function renderMenu(menuEl, langs, currentValue, onSelect) {
            menuEl.innerHTML = buildDropdownItems(langs, currentValue);
            menuEl.querySelectorAll(".bc-dropdown-item").forEach(item => {
                item.addEventListener("click", () => {
                    onSelect(item.dataset.value);
                    closeAllDropdowns();
                });
            });
        }

        function openDropdown(triggerEl, menuEl) {
            closeAllDropdowns();
            triggerEl.classList.add("active");
            menuEl.classList.add("open");
        }

        function closeAllDropdowns() {
            document.querySelectorAll(".bc-dropdown-trigger.active").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".bc-dropdown-menu.open").forEach(m => m.classList.remove("open"));
        }

        function updateSourceLang(value) {
            sourceLangValue = value;
            sourceLabel.innerText = getLangLabel(LANGUAGES, value);
            renderMenu(sourceMenu, LANGUAGES, value, updateSourceLang);
        }

        function updateTargetLang(value) {
            targetLangValue = value;
            targetLabel.innerText = getLangLabel(TARGET_LANGS, value);
            renderMenu(targetMenu, TARGET_LANGS, value, updateTargetLang);
            if (inputArea.value.trim()) doTranslate();
        }

        // Initial render
        renderMenu(sourceMenu, LANGUAGES, sourceLangValue, (v) => { updateSourceLang(v); if (inputArea.value.trim()) doTranslate(); });
        renderMenu(targetMenu, TARGET_LANGS, targetLangValue, updateTargetLang);

        sourceTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = sourceMenu.classList.contains("open");
            if (isOpen) closeAllDropdowns(); else openDropdown(sourceTrigger, sourceMenu);
        });

        targetTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = targetMenu.classList.contains("open");
            if (isOpen) closeAllDropdowns(); else openDropdown(targetTrigger, targetMenu);
        });

        // Close dropdowns when clicking outside
        document.addEventListener("click", closeAllDropdowns);
        popup.addEventListener("click", (e) => e.stopPropagation());

        // --- Swap ---
        swapBtn.onclick = () => {
            if (sourceLangValue === "auto") return;
            const temp = sourceLangValue;
            updateSourceLang(targetLangValue);
            updateTargetLang(temp);
        };

        // --- Clear ---
        clearBtn.onclick = () => {
            inputArea.value = "";
            outputArea.value = "";
            outputArea.classList.add("bc-output-muted");
            outputArea.classList.remove("bc-output-active");
            correctionContainer.classList.add("hidden");
            metaDiv.classList.add("hidden");
        };

        // --- Copy ---
        copyBtn.onclick = async () => {
            try {
                await navigator.clipboard.writeText(outputArea.value);
                const originalHtml = copyBtn.innerHTML;
                copyBtn.innerHTML = `
                  <svg class="w-3.5 h-3.5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-emerald-200">Copied!</span>
                `;
                setTimeout(() => { copyBtn.innerHTML = originalHtml; }, 1500);
            } catch (err) {
                console.error("Failed to copy text", err);
            }
        };


        // --- Quick lang presets ---
        const quickLangBtns = document.querySelectorAll(".bc-quick-lang");
        quickLangBtns.forEach(langBtn => {
            langBtn.onclick = () => {
                updateTargetLang(langBtn.getAttribute("data-lang"));
            };
        });

        // --- Translation ---
        let debounceTimer;
        const doTranslate = async () => {
            const text = inputArea.value.trim();
            if (!text) {
                outputArea.value = "";
                outputArea.classList.add("bc-output-muted");
                outputArea.classList.remove("bc-output-active");
                correctionContainer.classList.add("hidden");
                metaDiv.classList.add("hidden");
                return;
            }
            outputArea.classList.add("bc-output-active");
            outputArea.classList.remove("bc-output-muted");
            outputArea.value = "Translating...";
            metaDiv.classList.add("hidden");
            srcRomaji.classList.add("hidden");
            tgtRomaji.classList.add("hidden");

            const sl = sourceLangValue;
            const tl = targetLangValue;
            const q  = encodeURIComponent(text);

            const tryGoogle = async (base) => {
                const r = await fetch(`${base}/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&dt=sp&dt=rm&dt=qca&dt=ss&q=${q}`);
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            };

            const tryGoogleDict = async () => {
                // Chrome dict endpoint
                const r = await fetch(`https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sl}&tl=${tl}&dt=t&dt=rm&dt=sp&q=${q}`);
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const d = await r.json();
                if (d.sentences) {
                    let t = "", sRm = "", tRm = "";
                    d.sentences.forEach(s => {
                        if (s.trans) t += s.trans;
                        if (s.src_translit) sRm = s.src_translit;
                        if (s.translit) tRm = s.translit;
                    });
                    let spell = d.spell && d.spell.spell_res ? d.spell.spell_res : null;
                    return { translated: t, srcRomaji: sRm, tgtRomaji: tRm, spell: spell };
                }
                throw new Error("dict: unexpected format");
            };

            const tryMyMemory = async () => {
                const r = await fetch(`https://api.mymemory.translated.net/get?q=${q}&langpair=${sl}|${tl}`);
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const mm = await r.json();
                if (mm.responseStatus !== 200) throw new Error("MyMemory: " + mm.responseStatus);
                return { translated: mm.responseData.translatedText, srcRomaji: "", tgtRomaji: "", spell: null };
            };

            try {
                let translated = "";
                let srcRm = "";
                let tgtRm = "";
                let spellResult = null;

                // Try Google first
                let googleData = null;
                try { googleData = await tryGoogle("https://translate.googleapis.com"); } catch (_) {}
                if (!googleData) {
                    try { googleData = await tryGoogle("https://translate.google.com"); } catch (_) {}
                }

                if (googleData && googleData[0]) {
                    googleData[0].forEach(item => { if (item[0]) translated += item[0]; });
                    const lastItem = googleData[0][googleData[0].length - 1];
                    if (lastItem && lastItem[0] === null) {
                        tgtRm = lastItem[2] || "";
                        srcRm = lastItem[3] || "";
                    }
                    if (googleData[7] && googleData[7][1]) spellResult = googleData[7][1];
                    else if (googleData[8] && googleData[8][1]) spellResult = googleData[8][1];
                } else {
                    // Try Chrome dict endpoint
                    try { 
                        const res = await tryGoogleDict(); 
                        translated = res.translated;
                        srcRm = res.srcRomaji;
                        tgtRm = res.tgtRomaji;
                        spellResult = res.spell;
                    } catch (_) {}
                    
                    if (!translated) {
                        const res = await tryMyMemory();
                        translated = res.translated;
                    }
                }

                if (spellResult) {
                    spellResult = spellResult.replace(/<\/?b>/gi, ""); // Clean up bold tags
                    correctionContainer.classList.remove("hidden");
                    correctionBtn.innerText = spellResult;
                } else {
                    correctionContainer.classList.add("hidden");
                }

                if (srcRm || tgtRm) {
                    metaDiv.classList.remove("hidden");
                    metaDiv.style.display = "flex";
                    if (srcRm) {
                        srcRomaji.classList.remove("hidden");
                        srcRomaji.innerHTML = `Read (Source): <span class="text-purple-300">${srcRm}</span>`;
                    } else {
                        srcRomaji.classList.add("hidden");
                    }
                    
                    if (tgtRm) {
                        tgtRomaji.classList.remove("hidden");
                        tgtRomaji.innerHTML = `Read (Target): <span class="text-purple-300">${tgtRm}</span>`;
                    } else {
                        tgtRomaji.classList.add("hidden");
                    }
                } else {
                    metaDiv.classList.add("hidden");
                    srcRomaji.classList.add("hidden");
                    tgtRomaji.classList.add("hidden");
                }

                outputArea.value = translated || "(empty)";
            } catch (err) {
                outputArea.value = "Error: " + (err.message || "Failed to translate.");
                console.error("[translate]", err);
            }
        };

        inputArea.addEventListener("input", () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(doTranslate, 500);
        });

        correctionBtn.onclick = () => {
            inputArea.value = correctionBtn.innerText;
            correctionContainer.classList.add("hidden");
            doTranslate();
        };

        // --- Window controls ---
        closeBtn.onclick = () => { popup.style.display = "none"; };

        let isMinimized = false;
        minimizeBtn.onclick = () => {
            isMinimized = !isMinimized;
            bodySection.style.display = isMinimized ? "none" : "flex";
        };

        // --- Dragging ---
        let btnDragging = false, btnMoved = false, popupDragging = false;
        let startX, startY, btnInitX, btnInitY, popupInitX, popupInitY;

        const onMouseMove = (e) => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (btnDragging) {
                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) btnMoved = true;
                btn.style.left = `${btnInitX + dx}px`;
                btn.style.top  = `${btnInitY + dy}px`;
                btn.style.bottom = "auto"; btn.style.right = "auto";
            } else if (popupDragging) {
                popup.style.left = `${popupInitX + dx}px`;
                popup.style.top  = `${popupInitY + dy}px`;
                popup.style.bottom = "auto"; popup.style.right = "auto";
            }
        };

        const onMouseUp = () => {
            btnDragging = false; popupDragging = false;
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        btn.onmousedown = (e) => {
            btnDragging = true; btnMoved = false;
            startX = e.clientX; startY = e.clientY;
            btnInitX = parseInt(btn.style.left, 10) || 0;
            btnInitY = parseInt(btn.style.top, 10)  || 0;
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        };

        header.onmousedown = (e) => {
            if (e.target.closest("button")) return;
            popupDragging = true;
            startX = e.clientX; startY = e.clientY;
            popupInitX = parseInt(popup.style.left, 10) || 0;
            popupInitY = parseInt(popup.style.top, 10)  || 0;
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        };

        btn.onclick = (e) => {
            if (btnMoved) { e.preventDefault(); return; }
            if (popup.style.display === "none") {
                popup.style.display = "flex";
                inputArea.focus();
            } else {
                popup.style.display = "none";
            }
        };

        window.addEventListener("keydown", (e) => {
            if ((e.key === "Escape" || e.keyCode === 27) && popup.style.display !== "none") {
                popup.style.display = "none";
                e.stopPropagation();
            }
        }, true);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initGoogleTranslate);
    } else {
        initGoogleTranslate();
    }
})();

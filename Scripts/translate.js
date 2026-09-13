(function () {
    "use strict";
    if (window !== window.top) return;

    function initGoogleTranslate() {
        if (document.getElementById("bc-google-translate-btn")) return;

        if (!document.getElementById("tailwind-script")) {
            const configScript = document.createElement("script");
            configScript.innerHTML = `
                window.tailwind = window.tailwind || {};
                window.tailwind.config = {
                  corePlugins: { preflight: false },
                  important: '#translate-root',
                  theme: {
                    extend: {
                      colors: {
                        widget: {
                          bg: '#161724',
                          surface: '#0f1019',
                          card: '#1b1b2a',
                          border: '#292b3f',
                          accent: '#8b5cf6',
                          accentGlow: 'rgba(139, 92, 246, 0.45)',
                          textMuted: '#71768e',
                          textLight: '#9499af'
                        }
                      },
                      boxShadow: {
                        'glow-purple': '0 0 20px -2px rgba(147, 51, 234, 0.55)',
                        'widget-depth': '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.07)'
                      }
                    }
                  }
                };
            `;
            document.head.appendChild(configScript);

            const script = document.createElement("script");
            script.id = "tailwind-script";
            script.src = "https://cdn.tailwindcss.com";
            document.head.appendChild(script);
        }

        if (!document.getElementById("translate-glassmorphic-styles")) {
            const style = document.createElement("style");
            style.id = "translate-glassmorphic-styles";
            style.innerHTML = `
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

                /* Prevent Tailwind CDN preflight from leaking to game inputs */
                input:not(#translate-root *), 
                textarea:not(#translate-root *), 
                select:not(#translate-root *), 
                button:not(#translate-root *) {
                    line-height: normal !important;
                    font-family: Arial, sans-serif !important;
                }

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

                /* Custom dropdown */
                .bc-dropdown { position: relative; flex: 1; }
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
                    font-family: ui-sans-serif, system-ui, sans-serif;
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
                .bc-dropdown-trigger {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(32,34,53,0.9);
                    border: 1px solid rgba(255,255,255,0.05);
                    padding: 8px 12px;
                    border-radius: 12px;
                    font-size: 11px;
                    color: #e2e8f0;
                    cursor: pointer;
                    transition: background 0.15s, border-color 0.15s;
                    font-family: ui-sans-serif, system-ui, sans-serif;
                    user-select: none;
                }
                .bc-dropdown-trigger:hover { background: rgba(39,41,64,1); }
                .bc-dropdown-trigger.active { border-color: rgba(139,92,246,0.5); background: rgba(39,41,64,1); }
                .bc-dropdown-chevron {
                    transition: transform 0.2s cubic-bezier(0.34,1.2,0.64,1);
                    flex-shrink: 0;
                }
                .bc-dropdown-trigger.active .bc-dropdown-chevron { transform: rotate(180deg); }
            `;
            document.head.appendChild(style);
        }

        const btn = document.createElement("button");
        btn.id = "bc-google-translate-btn";
        btn.setAttribute("aria-label", "Google Translate Floating Widget");
        btn.className = "w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 text-white flex items-center justify-center shadow-glow-purple border border-purple-400/40 hover:scale-105 active:scale-95 transition-all duration-200";
        btn.style.cssText = "position:fixed;top:10px;left:10px;z-index:999999";
        btn.innerHTML = `
        <svg class="w-6 h-6 drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
        </svg>`;
        const popup = document.createElement("div");
        popup.id = "translate-widget-container";
        popup.style.position = "fixed";
        popup.style.top = "70px";
        popup.style.left = "20px";
        popup.style.zIndex = "1000000";
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
<main class="w-full min-w-[360px] max-w-[390px] rounded-[28px] bg-[#161724]/95 backdrop-blur-xl border border-white/10 shadow-widget-depth p-4 flex flex-col gap-3.5 relative" id="translate-widget" style="font-family: ui-sans-serif, system-ui, sans-serif;">
    <header class="flex items-center justify-between pt-1 pb-0.5 px-1 cursor-move" id="widget-header">
        <div class="flex items-center space-x-3 pointer-events-none">
            <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-purple-700 via-purple-600 to-violet-400 shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-purple-300/30">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"></path>
                </svg>
            </div>
            <div>
                <div class="flex items-center space-x-2">
                    <h1 class="text-[15px] font-semibold tracking-tight text-white m-0">Google Translate</h1>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-500/40 tracking-wider uppercase">UwU</span>
                </div>
            </div>
        </div>
        <div class="flex items-center space-x-2.5 text-zinc-400 pr-1 cursor-default">
            <button aria-label="Minimize Widget" class="hover:text-white transition-colors p-1 text-base leading-none" id="btn-minimize">
                <span class="block w-3 h-[2px] bg-zinc-400 rounded-sm"></span>
            </button>
            <button aria-label="Close Widget" class="hover:text-white transition-colors p-1" id="btn-close">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" viewBox="0 0 24 24">
                    <line x1="18" x2="6" y1="6" y2="18"></line>
                    <line x1="6" x2="18" y1="6" y2="18"></line>
                </svg>
            </button>
        </div>
    </header>

    <div id="widget-body" class="flex flex-col gap-3.5">
        <!-- Language Selectors -->
        <section class="flex items-center justify-between gap-1.5 pt-0.5">
            <!-- Source dropdown -->
            <div class="bc-dropdown" id="source-dropdown">
                <button class="bc-dropdown-trigger" id="source-trigger">
                    <div class="flex items-center gap-2 truncate">
                        <span class="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7] shrink-0" style="display:inline-block"></span>
                        <span id="source-lang-label" class="truncate font-medium">Auto</span>
                    </div>
                    <svg class="bc-dropdown-chevron w-3.5 h-3.5 text-zinc-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
                    </svg>
                </button>
                <div class="bc-dropdown-menu" id="source-menu"></div>
            </div>

            <!-- Swap button -->
            <button aria-label="Swap Languages" class="w-8 h-8 rounded-xl bg-[#202235] hover:bg-[#2b2d45] border border-white/5 flex items-center justify-center text-slate-300 hover:text-purple-300 active:rotate-180 transition-all duration-200 shrink-0" id="swap-languages" type="button">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                </svg>
            </button>

            <!-- Target dropdown -->
            <div class="bc-dropdown" id="target-dropdown">
                <button class="bc-dropdown-trigger" id="target-trigger">
                    <div class="flex items-center gap-2 truncate">
                        <span class="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7] shrink-0" style="display:inline-block"></span>
                        <span id="target-lang-label" class="truncate font-medium">English</span>
                    </div>
                    <svg class="bc-dropdown-chevron w-3.5 h-3.5 text-zinc-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
                    </svg>
                </button>
                <div class="bc-dropdown-menu" id="target-menu"></div>
            </div>
        </section>

        <!-- Quick presets -->
        <nav aria-label="Quick languages" class="flex items-center space-x-1.5 px-0.5 text-xs">
            <span class="text-[10px] font-bold tracking-wider text-[#5f637b] mr-1">QUICK:</span>
            <button class="bc-quick-lang px-2.5 py-0.5 rounded-md bg-[#212335] text-slate-300 text-[11px] font-medium hover:bg-purple-900/40 hover:text-purple-300 border border-white/5 transition-all" data-lang="en" type="button">EN</button>
            <button class="bc-quick-lang px-2.5 py-0.5 rounded-md bg-[#212335] text-slate-300 text-[11px] font-medium hover:bg-purple-900/40 hover:text-purple-300 border border-white/5 transition-all" data-lang="id" type="button">IND</button>
            <button class="bc-quick-lang px-2.5 py-0.5 rounded-md bg-[#212335] text-slate-300 text-[11px] font-medium hover:bg-purple-900/40 hover:text-purple-300 border border-white/5 transition-all" data-lang="zh-CN" type="button">CN</button>
        </nav>

        <!-- Source input -->
        <section class="bg-[#0f1019] rounded-2xl p-3.5 border border-white/[0.04] flex flex-col justify-between min-h-[140px] relative">
            <textarea class="bc-widget-textarea w-full text-[13px] text-slate-200 placeholder-zinc-600 focus:ring-0 p-0 font-normal leading-relaxed bc-translator-scroll" id="source-textarea" placeholder="Type text here..." rows="3"></textarea>
            
            <div id="bc-translate-correction-container" class="hidden text-xs text-rose-400 mt-1 pb-1">
                Did you mean: <span id="bc-translate-correction" class="bc-spell-error"></span>
            </div>

            <div class="flex items-center justify-end pt-2 border-t border-white/[0.04] text-zinc-400 mt-auto">
                <button aria-label="Clear text" class="hover:text-white transition-colors" id="clear-input" type="button">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" viewBox="0 0 24 24"><line x1="18" x2="6" y1="6" y2="18"></line><line x1="6" x2="18" y1="6" y2="18"></line></svg>
                </button>
            </div>
        </section>

        <!-- Output -->
        <section class="bg-[#1b1c2b] rounded-2xl p-3.5 border border-purple-500/10 flex flex-col justify-between min-h-[148px]">
            <div>
                <div class="flex items-center space-x-1.5 text-[10px] font-bold text-purple-400 tracking-wider mb-2 uppercase">
                    <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    <span>TRANSLATION</span>
                </div>
                <textarea id="translation-text" class="bc-widget-textarea bc-output-muted w-full font-medium text-[15px] leading-snug bc-translator-scroll p-0" rows="3" readonly placeholder="Translation will appear here..."></textarea>
                <div id="bc-translate-meta" class="hidden flex-col gap-1 text-[11px] text-[#71768e] font-medium mt-1">
                    <div id="bc-translate-src-romaji" class="hidden"></div>
                    <div id="bc-translate-tgt-romaji" class="hidden"></div>
                </div>
            </div>
            
            <div class="flex items-center justify-end pt-3 border-t border-white/[0.04] mt-2">
                <button class="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 via-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs py-1.5 px-3.5 rounded-xl shadow-[0_0_15px_rgba(147,51,234,0.4)] active:scale-95 transition-all" id="copy-translation-btn" type="button">
                    <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
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
                const randomEmail = `translate_bypass_${Math.floor(Math.random() * 99999)}@gmail.com`;
                const r = await fetch(`https://api.mymemory.translated.net/get?q=${q}&langpair=${sl}|${tl}&de=${randomEmail}`);
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

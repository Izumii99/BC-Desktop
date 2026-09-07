(function () {
    "use strict";
    if (window !== window.top) return;

    function initGoogleTranslate() {
        if (document.getElementById("bc-google-translate-btn")) return;

        if (!document.getElementById("tailwind-script")) {
            const script = document.createElement("script");
            script.id = "tailwind-script";
            script.src = "https://cdn.tailwindcss.com?plugins=forms,container-queries";
            document.head.appendChild(script);

            const configScript = document.createElement("script");
            configScript.innerHTML = `
                window.tailwind = window.tailwind || {};
                window.tailwind.config = {
                  darkMode: 'class',
                  theme: {
                    extend: {
                      colors: {
                        brand: {
                          400: '#c084fc',
                          500: '#a855f7',
                          600: '#7c3aed',
                        },
                        surface: {
                          900: '#0B0F19',
                          850: '#111726',
                          800: '#161F36',
                          700: '#1e293b',
                        }
                      },
                      boxShadow: {
                        'glow-purple': '0 0 30px -5px rgba(168, 85, 247, 0.25)',
                        'glow-card': '0 12px 40px -10px rgba(2, 6, 23, 0.7)',
                      }
                    }
                  }
                }
            `;
            document.head.appendChild(configScript);
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
                .bc-translator-scroll::-webkit-scrollbar {
                  width: 5px;
                }
                .bc-translator-scroll::-webkit-scrollbar-track {
                  background: transparent;
                }
                .bc-translator-scroll::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.15);
                  border-radius: 9999px;
                }
                .bc-translator-scroll::-webkit-scrollbar-thumb:hover {
                  background: rgba(255, 255, 255, 0.3);
                }
                html body #bc-google-translate-popup .bc-select-overlay {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    cursor: pointer;
                    appearance: none;
                    background-color: transparent !important;
                }
                html body #bc-google-translate-popup .bc-select-overlay option {
                    background-color: #1e293b !important;
                    color: white !important;
                }
                html body #bc-google-translate-popup textarea#bc-translate-input, 
                html body #bc-google-translate-popup textarea#bc-translate-output {
                    background-color: transparent !important;
                    color: white !important;
                    box-shadow: none !important;
                }
            `;
            document.head.appendChild(style);
        }

        const btn = document.createElement("button");
        btn.id = "bc-google-translate-btn";
        btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 6"></path><path d="M4 14l6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="M22 22l-5-10-5 10"></path><path d="M14 18h6"></path></svg>`;
        btn.style.position = "fixed";
        btn.style.top = "10px";
        btn.style.left = "10px";
        btn.style.zIndex = "999999";
        btn.style.padding = "10px";
        btn.style.backgroundColor = "#7c3aed";
        btn.style.color = "#ffffff";
        btn.style.border = "none";
        btn.style.borderRadius = "50%";
        btn.style.cursor = "move";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.style.boxShadow = "0 0 15px -3px rgba(168, 85, 247, 0.4)";
        btn.style.userSelect = "none";
        btn.onmouseover = () => (btn.style.backgroundColor = "#a855f7");
        btn.onmouseout = () => (btn.style.backgroundColor = "#7c3aed");

        const popup = document.createElement("div");
        popup.id = "bc-google-translate-popup";
        popup.style.position = "fixed";
        popup.style.top = "60px";
        popup.style.left = "50px";
        popup.style.zIndex = "1000000";
        popup.style.display = "none";

        const commonOptions = `
            <option value="en">English (EN)</option>
            <option value="id">Indonesian (ID)</option>
            <option value="ja">Japanese (JP)</option>
            <option value="zh-CN">Chinese (CN)</option>
            <option value="ru">Russian (RU)</option>
            <option disabled>──────────</option>
        `;
        
        const allOptions = `
            <option value="ar">Arabic</option>
            <option value="nl">Dutch</option>
            <option value="zh-CN">Chinese</option>
            <option value="tl">Filipino</option>
            <option value="hi">Hindi</option>
            <option value="id">Indonesian</option>
            <option value="en">English</option>
            <option value="it">Italian</option>
            <option value="ja">Japanese</option>
            <option value="de">German</option>
            <option value="ko">Korean</option>
            <option value="ms">Malay</option>
            <option value="fr">French</option>
            <option value="pl">Polish</option>
            <option value="pt">Portuguese</option>
            <option value="ru">Russian</option>
            <option value="es">Spanish</option>
            <option value="th">Thai</option>
            <option value="tr">Turkish</option>
            <option value="uk">Ukrainian</option>
            <option value="vi">Vietnamese</option>
        `;

        popup.innerHTML = `
<main class="w-full max-w-[460px] min-w-[320px] rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-purple-950/40 p-5 ring-1 ring-white/5 transition-all duration-300 hover:border-white/15" data-purpose="translator-widget" style="color: #f1f5f9; font-family: ui-sans-serif, system-ui, sans-serif;">
  <header class="flex items-center justify-between pb-4 border-b border-white/5 cursor-move" id="bc-translate-header">
    <div class="flex items-center space-x-2.5 pointer-events-none">
      <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-purple-500/25 ring-1 ring-white/20">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">
          <path d="m5 8 6 6"></path>
          <path d="m4 14 6-6 2-3"></path>
          <path d="M2 5h12"></path>
          <path d="M7 2h1"></path>
          <path d="m22 22-5-10-5 10"></path>
          <path d="M14 18h6"></path>
        </svg>
      </div>
      <div>
        <div class="flex items-center gap-1.5">
          <h1 class="text-sm font-semibold tracking-wide text-white m-0 leading-none">Google Translate</h1>
          <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">Pro AI</span>
        </div>
        <p class="text-[11px] text-slate-400 mt-0.5 mb-0">Deep Neural Engine v4.2</p>
      </div>
    </div>
    <div class="flex items-center space-x-1.5 text-slate-400 cursor-default">
      <button id="bc-translate-minimize" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 hover:text-slate-200 transition-colors" title="Minimize">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="5" x2="19" y1="12" y2="12"></line></svg>
      </button>
      <button id="bc-translate-close" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-500/20 hover:text-rose-300 transition-colors" title="Close">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"></path></svg>
      </button>
    </div>
  </header>
  
  <div id="bc-translate-body">
      <nav class="mt-3.5 mb-3 flex items-center justify-between gap-2" data-purpose="language-selector-bar">
        <div class="relative flex-1 group">
          <button class="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] group-hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-slate-200 group-hover:text-white transition focus:outline-none focus:ring-1 focus:ring-purple-500">
            <div class="flex items-center gap-2 truncate">
              <span class="w-2 h-2 rounded-full bg-purple-400 ring-2 ring-purple-400/25"></span>
              <span class="truncate" id="bc-translate-source-label">Auto</span>
            </div>
            <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
          </button>
          <select id="bc-translate-source" class="bc-select-overlay">
            <option value="auto" selected>Auto</option>
            ${commonOptions}
            ${allOptions}
          </select>
        </div>
        
        <button id="bc-translate-swap" class="p-2 rounded-xl bg-white/[0.06] hover:bg-purple-600 hover:text-white border border-white/10 text-slate-300 transition-all duration-300 hover:rotate-180 hover:shadow-lg hover:shadow-purple-500/30 active:scale-95 focus:outline-none" title="Tukar Bahasa (Swap)">
          <svg class="w-3.5 h-3.5 group-hover:stroke-current" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" viewBox="0 0 24 24"><path d="m16 3 4 4-4 4"></path><path d="M20 7H4"></path><path d="m8 21-4-4 4-4"></path><path d="M4 17h16"></path></svg>
        </button>
        
        <div class="relative flex-1 group">
          <button class="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] group-hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-slate-200 group-hover:text-white transition focus:outline-none focus:ring-1 focus:ring-purple-500">
            <div class="flex items-center gap-2 truncate">
              <span class="w-2 h-2 rounded-full bg-violet-400 ring-2 ring-violet-400/25"></span>
              <span class="truncate" id="bc-translate-target-label">English (EN)</span>
            </div>
            <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
          </button>
          <select id="bc-translate-target" class="bc-select-overlay">
            ${commonOptions}
            ${allOptions}
          </select>
        </div>
      </nav>

      <div class="flex items-center space-x-1.5 mb-3.5 px-0.5 text-[11px]" data-purpose="quick-presets">
        <span class="text-slate-500 mr-1 text-[10px] font-semibold tracking-wider uppercase">Cepat:</span>
        <button class="bc-quick-lang px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/10 text-slate-300 transition" data-lang="en">EN</button>
        <button class="bc-quick-lang px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/10 text-slate-300 transition" data-lang="ja">JP</button>
        <button class="bc-quick-lang px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/10 text-slate-300 transition" data-lang="es">ES</button>
        <button class="bc-quick-lang px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/10 text-slate-300 transition" data-lang="fr">FR</button>
        <button class="bc-quick-lang px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/10 text-slate-300 transition" data-lang="de">DE</button>
      </div>

      <section class="rounded-2xl bg-black/30 border border-white/[0.08] hover:border-white/15 focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all p-3.5 mb-3 relative group" data-purpose="source-box">
        <textarea id="bc-translate-input" class="w-full min-h-[72px] !bg-transparent border-none outline-none resize-none text-sm !text-slate-100 placeholder-slate-500 bc-translator-scroll leading-relaxed p-0 focus:ring-0" placeholder="Type text here..."></textarea>
        
        <div id="bc-translate-correction-container" class="hidden mt-1 text-xs text-rose-400">
            Did you mean: <span id="bc-translate-correction" class="bc-spell-error"></span>
        </div>

        <div class="flex items-center justify-between pt-2 mt-1 border-t border-white/5 text-slate-400 text-xs">
          <div class="flex items-center space-x-1">
            <button class="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition" title="Dengarkan (Listen)" type="button">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            </button>
            <button class="p-1.5 rounded-lg hover:text-purple-400 hover:bg-white/10 transition" title="Input Suara (Mic)" type="button">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
            </button>
          </div>
          <div class="flex items-center space-x-2">
            <button id="bc-translate-clear" class="p-1 rounded-md hover:bg-white/10 hover:text-rose-400 text-slate-400 transition" title="Hapus teks (Clear)">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" x2="6" y1="6" y2="18"></line><line x1="6" x2="18" y1="6" y2="18"></line></svg>
            </button>
          </div>
        </div>
      </section>

      <section class="rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-purple-500/25 shadow-lg shadow-black/20 p-4 transition-all flex flex-col" data-purpose="translation-result">
        <div class="flex items-center justify-between mb-1.5 text-xs">
          <span class="text-[11px] uppercase tracking-wider font-semibold text-purple-400 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Hasil Terjemahan
          </span>
        </div>
        
        <textarea id="bc-translate-output" class="w-full min-h-[60px] !bg-transparent border-none outline-none resize-none text-2xl font-semibold !text-white tracking-tight leading-none placeholder-slate-600 bc-translator-scroll p-0 focus:ring-0 py-1" placeholder="Translation will appear here..." readonly></textarea>
        
        <div id="bc-translate-meta" class="mt-2.5 pt-2.5 border-t border-white/5 hidden flex-col gap-1 text-[11px] text-slate-400 font-medium">
            <div id="bc-translate-src-romaji" class="hidden"></div>
            <div id="bc-translate-tgt-romaji" class="hidden"></div>
        </div>

        <div class="flex items-center justify-between mt-3.5 pt-2.5 border-t border-white/5 text-slate-400">
          <div class="flex items-center space-x-1">
            <button class="p-1.5 rounded-lg hover:text-purple-300 hover:bg-white/10 transition" title="Dengarkan pengucapan (Pronounce)" type="button">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
            </button>
            <button class="p-1.5 rounded-lg hover:text-amber-400 hover:bg-white/10 transition" title="Simpan ke Favorit (Bookmark)" type="button">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </button>
          </div>
          <div class="flex items-center space-x-1">
            <button id="bc-translate-copy" class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/40 text-xs font-medium transition active:scale-95 shadow-md shadow-purple-600/30">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><rect height="14" rx="2" ry="2" width="14" x="8" y="8"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
              <span id="bc-translate-copy-text">Salin</span>
            </button>
            <button class="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition" title="Bagikan (Share)" type="button">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line></svg>
            </button>
          </div>
        </div>
      </section>

      <footer class="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400" data-purpose="widget-status-footer">
        <div class="flex items-center gap-1.5 text-slate-400">
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400/50 animate-pulse"></span>
          <span class="text-[11px]">Siap Menerjemahkan</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="flex items-center gap-0.5">
            <kbd class="px-1.5 py-0.5 text-[9px] font-semibold bg-white/10 rounded border border-white/10 text-slate-300">⌘</kbd>
            <kbd class="px-1.5 py-0.5 text-[9px] font-semibold bg-white/10 rounded border border-white/10 text-slate-300">↵</kbd>
          </span>
          <span class="text-slate-500">•</span>
          <span class="flex items-center gap-0.5">
            <kbd class="px-1.5 py-0.5 text-[9px] font-semibold bg-white/10 rounded border border-white/10 text-slate-300">Esc</kbd>
          </span>
        </div>
      </footer>
  </div>
</main>`;

        document.body.appendChild(btn);
        document.body.appendChild(popup);

        // UI Element References
        const header = document.getElementById("bc-translate-header");
        const bodySection = document.getElementById("bc-translate-body");
        const minimizeBtn = document.getElementById("bc-translate-minimize");
        const closeBtn = document.getElementById("bc-translate-close");
        const sourceLang = document.getElementById("bc-translate-source");
        const targetLang = document.getElementById("bc-translate-target");
        const sourceLabel = document.getElementById("bc-translate-source-label");
        const targetLabel = document.getElementById("bc-translate-target-label");
        const swapBtn = document.getElementById("bc-translate-swap");
        const inputArea = document.getElementById("bc-translate-input");
        const outputArea = document.getElementById("bc-translate-output");
        const clearBtn = document.getElementById("bc-translate-clear");
        const copyBtn = document.getElementById("bc-translate-copy");
        const copyText = document.getElementById("bc-translate-copy-text");
        const correctionContainer = document.getElementById("bc-translate-correction-container");
        const correctionBtn = document.getElementById("bc-translate-correction");
        const metaDiv = document.getElementById("bc-translate-meta");
        const srcRomaji = document.getElementById("bc-translate-src-romaji");
        const tgtRomaji = document.getElementById("bc-translate-tgt-romaji");

        targetLang.value = "en";

        const updateLabels = () => {
            if (sourceLang.options[sourceLang.selectedIndex]) {
                sourceLabel.innerText = sourceLang.options[sourceLang.selectedIndex].text.split(" (")[0];
            }
            if (targetLang.options[targetLang.selectedIndex]) {
                targetLabel.innerText = targetLang.options[targetLang.selectedIndex].text.split(" (")[0];
            }
        };

        sourceLang.addEventListener("change", () => {
            updateLabels();
            doTranslate();
        });
        targetLang.addEventListener("change", () => {
            updateLabels();
            doTranslate();
        });

        swapBtn.onclick = () => {
            if (sourceLang.value !== "auto") {
                const temp = sourceLang.value;
                sourceLang.value = targetLang.value;
                targetLang.value = temp;
                updateLabels();
                if (inputArea.value.trim()) doTranslate();
            }
        };

        clearBtn.onclick = () => {
            inputArea.value = "";
            outputArea.value = "";
            correctionContainer.classList.add("hidden");
            metaDiv.classList.add("hidden");
        };

        copyBtn.onclick = async () => {
            try {
                await navigator.clipboard.writeText(outputArea.value);
                const originalText = copyText.innerText;
                copyText.innerText = "Copied!";
                setTimeout(() => {
                    copyText.innerText = originalText;
                }, 1800);
            } catch (err) {
                console.error("Failed to copy text", err);
            }
        };

        const quickLangBtns = document.querySelectorAll(".bc-quick-lang");
        quickLangBtns.forEach(btn => {
            btn.onclick = () => {
                targetLang.value = btn.getAttribute("data-lang");
                updateLabels();
                if (inputArea.value.trim()) doTranslate();
            };
        });

        let debounceTimer;
        const doTranslate = async () => {
            const text = inputArea.value.trim();
            if (!text) {
                outputArea.value = "";
                correctionContainer.classList.add("hidden");
                metaDiv.classList.add("hidden");
                return;
            }
            outputArea.value = "Translating...";
            metaDiv.classList.add("hidden");
            srcRomaji.classList.add("hidden");
            tgtRomaji.classList.add("hidden");

            try {
                const sl = sourceLang.value;
                const tl = targetLang.value;
                const res = await fetch(
                    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&dt=sp&dt=qc&dt=rm&q=${encodeURIComponent(text)}`
                );
                const data = await res.json();
                let translated = "";
                let sourceR = "";
                let targetR = "";
                if (data && data[0]) {
                    data[0].forEach((item) => {
                        if (item[0]) translated += item[0];
                        if (item[0] === null) {
                            if (item[2]) targetR = item[2];
                            if (item[3]) sourceR = item[3];
                        }
                    });
                }

                if (sourceR || targetR) {
                    metaDiv.classList.remove("hidden");
                    metaDiv.style.display = "flex";
                    if (sourceR) {
                        srcRomaji.innerText = "Source: " + sourceR;
                        srcRomaji.classList.remove("hidden");
                    }
                    if (targetR) {
                        tgtRomaji.innerText = "Result: " + targetR;
                        tgtRomaji.classList.remove("hidden");
                    }
                }

                let spellCorrection = null;
                if (data && data[7] && data[7][1]) {
                    spellCorrection = data[7][1];
                }

                if (spellCorrection) {
                    correctionContainer.classList.remove("hidden");
                    correctionBtn.innerText = spellCorrection;
                } else {
                    correctionContainer.classList.add("hidden");
                }

                outputArea.value = translated;
            } catch (err) {
                outputArea.value = "Error: Failed to translate.";
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

        // Window Controls
        closeBtn.onclick = () => (popup.style.display = "none");
        
        let isMinimized = false;
        minimizeBtn.onclick = () => {
            isMinimized = !isMinimized;
            if (isMinimized) {
                bodySection.style.display = "none";
            } else {
                bodySection.style.display = "block";
            }
        };

        // Dragging Logic
        let btnDragging = false;
        let btnMoved = false;
        let popupDragging = false;
        let startX, startY;
        let btnInitX, btnInitY, popupInitX, popupInitY;

        const onMouseMove = (e) => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (btnDragging) {
                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) btnMoved = true;
                btn.style.left = `${btnInitX + dx}px`;
                btn.style.top = `${btnInitY + dy}px`;
                btn.style.bottom = "auto";
                btn.style.right = "auto";
            } else if (popupDragging) {
                popup.style.left = `${popupInitX + dx}px`;
                popup.style.top = `${popupInitY + dy}px`;
                popup.style.bottom = "auto";
                popup.style.right = "auto";
            }
        };

        const onMouseUp = () => {
            btnDragging = false;
            popupDragging = false;
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        btn.onmousedown = (e) => {
            btnDragging = true;
            btnMoved = false;
            startX = e.clientX;
            startY = e.clientY;
            
            btnInitX = parseInt(btn.style.left, 10) || 0;
            btnInitY = parseInt(btn.style.top, 10) || 0;
            popupInitX = parseInt(popup.style.left, 10) || 0;
            popupInitY = parseInt(popup.style.top, 10) || 0;

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        };

        header.onmousedown = (e) => {
            // Prevent dragging if clicking on buttons
            if (e.target.closest("button")) return;
            popupDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            btnInitX = parseInt(btn.style.left, 10) || 0;
            btnInitY = parseInt(btn.style.top, 10) || 0;
            popupInitX = parseInt(popup.style.left, 10) || 0;
            popupInitY = parseInt(popup.style.top, 10) || 0;

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        };

        btn.onclick = (e) => {
            if (btnMoved) {
                e.preventDefault();
                return;
            }
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

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
                .bc-select-overlay {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    cursor: pointer;
                    appearance: none;
                }
                .bc-select-overlay option {
                    background-color: #1e293b;
                    color: white;
                }
            `;
            document.head.appendChild(style);
        }

        const btn = document.createElement("button");
        btn.id = "bc-google-translate-btn";
        btn.innerHTML = \`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 6"></path><path d="M4 14l6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="M22 22l-5-10-5 10"></path><path d="M14 18h6"></path></svg>\`;
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

        const commonOptions = \`
            <option value="en">Inggris (EN)</option>
            <option value="id">Indonesia (ID)</option>
            <option value="ja">Jepang (JP)</option>
            <option value="zh-CN">China (CN)</option>
            <option value="ru">Rusia (RU)</option>
            <option disabled>──────────</option>
        \`;
        
        const allOptions = \`
            <option value="ar">Arab</option>
            <option value="nl">Belanda</option>
            <option value="zh-CN">China</option>
            <option value="tl">Filipina</option>
            <option value="hi">Hindi</option>
            <option value="id">Indonesia</option>
            <option value="en">Inggris</option>
            <option value="it">Italia</option>
            <option value="ja">Jepang</option>
            <option value="de">Jerman</option>
            <option value="ko">Korea</option>
            <option value="ms">Melayu</option>
            <option value="fr">Perancis</option>
            <option value="pl">Polandia</option>
            <option value="pt">Portugis</option>
            <option value="ru">Rusia</option>
            <option value="es">Spanyol</option>
            <option value="th">Thailand</option>
            <option value="tr">Turki</option>
            <option value="uk">Ukraina</option>
            <option value="vi">Vietnam</option>
        \`;

        popup.innerHTML = \`
<main class="w-full max-w-[460px] min-w-[320px] rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-glow-card p-5 ring-1 ring-white/5 transition-all duration-300" data-purpose="translator-widget" style="color: #f1f5f9; font-family: ui-sans-serif, system-ui, sans-serif;">
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
      <nav class="mt-3.5 mb-3 flex items-center justify-between gap-2">
        <div class="relative flex-1 group">
          <button class="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] group-hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-slate-200 group-hover:text-white transition focus:outline-none">
            <div class="flex items-center gap-2 truncate">
              <span class="w-2 h-2 rounded-full bg-purple-400 ring-2 ring-purple-400/25"></span>
              <span class="truncate" id="bc-translate-source-label">Otomatis</span>
            </div>
            <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
          </button>
          <select id="bc-translate-source" class="bc-select-overlay">
            <option value="auto" selected>Otomatis</option>
            \${commonOptions}
            \${allOptions}
          </select>
        </div>
        
        <button id="bc-translate-swap" class="p-2 rounded-xl bg-white/[0.06] hover:bg-purple-600 hover:text-white border border-white/10 text-slate-300 transition-all duration-300 hover:rotate-180 hover:shadow-lg hover:shadow-purple-500/30 active:scale-95" title="Tukar Bahasa">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" viewBox="0 0 24 24"><path d="m16 3 4 4-4 4"></path><path d="M20 7H4"></path><path d="m8 21-4-4 4-4"></path><path d="M4 17h16"></path></svg>
        </button>
        
        <div class="relative flex-1 group">
          <button class="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] group-hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-slate-200 group-hover:text-white transition focus:outline-none">
            <div class="flex items-center gap-2 truncate">
              <span class="w-2 h-2 rounded-full bg-violet-400 ring-2 ring-violet-400/25"></span>
              <span class="truncate" id="bc-translate-target-label">Inggris (EN)</span>
            </div>
            <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
          </button>
          <select id="bc-translate-target" class="bc-select-overlay">
            \${commonOptions}
            \${allOptions}
          </select>
        </div>
      </nav>

      <div class="flex items-center space-x-1.5 mb-3.5 px-0.5 text-[11px]">
        <span class="text-slate-500 mr-1 text-[10px] font-semibold tracking-wider uppercase">Cepat:</span>
        <button class="bc-quick-lang px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/10 text-slate-300 transition" data-lang="en">EN</button>
        <button class="bc-quick-lang px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/10 text-slate-300 transition" data-lang="ja">JP</button>
        <button class="bc-quick-lang px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/10 text-slate-300 transition" data-lang="es">ES</button>
        <button class="bc-quick-lang px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/10 text-slate-300 transition" data-lang="id">ID</button>
        <button class="bc-quick-lang px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/10 text-slate-300 transition" data-lang="zh-CN">CN</button>
      </div>

      <section class="rounded-2xl bg-black/30 border border-white/[0.08] focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all p-3.5 mb-3">
        <textarea id="bc-translate-input" class="w-full min-h-[72px] bg-transparent border-none outline-none resize-none text-sm text-slate-100 placeholder-slate-500 bc-translator-scroll leading-relaxed p-0 focus:ring-0" placeholder="Ketik teks di sini..."></textarea>
        
        <div id="bc-translate-correction-container" class="hidden mt-1 text-xs text-rose-400">
            Maksud Anda: <span id="bc-translate-correction" class="bc-spell-error"></span>
        </div>

        <div class="flex items-center justify-between pt-2 mt-1 border-t border-white/5 text-slate-400 text-xs">
          <div class="flex items-center space-x-1"></div>
          <div class="flex items-center space-x-2">
            <button id="bc-translate-clear" class="p-1 rounded-md hover:bg-white/10 hover:text-rose-400 text-slate-400 transition" title="Hapus teks (Clear)">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" x2="6" y1="6" y2="18"></line><line x1="6" x2="18" y1="6" y2="18"></line></svg>
            </button>
          </div>
        </div>
      </section>

      <section class="rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-purple-500/25 shadow-lg shadow-black/20 p-4 transition-all flex flex-col">
        <div class="flex items-center justify-between mb-1.5 text-xs">
          <span class="text-[11px] uppercase tracking-wider font-semibold text-purple-400 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Hasil Terjemahan
          </span>
        </div>
        
        <textarea id="bc-translate-output" class="w-full min-h-[60px] bg-transparent border-none outline-none resize-none text-xl font-semibold text-white tracking-tight leading-none placeholder-slate-600 bc-translator-scroll p-0 focus:ring-0" placeholder="Hasil terjemahan akan muncul di sini..." readonly></textarea>
        
        <div id="bc-translate-meta" class="mt-2.5 pt-2.5 border-t border-white/5 hidden flex-col gap-1 text-[11px] text-slate-400 font-medium">
            <div id="bc-translate-src-romaji" class="hidden"></div>
            <div id="bc-translate-tgt-romaji" class="hidden"></div>
        </div>

        <div class="flex items-center justify-end mt-3.5 pt-2.5 border-t border-white/5 text-slate-400">
          <button id="bc-translate-copy" class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/40 text-xs font-medium transition active:scale-95 shadow-md shadow-purple-600/30">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><rect height="14" rx="2" ry="2" width="14" x="8" y="8"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
            <span id="bc-translate-copy-text">Salin</span>
          </button>
        </div>
      </section>
  </div>
</main>\`;

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
                copyText.innerText = "Tersalin!";
                setTimeout(() => {
                    copyText.innerText = originalText;
                }, 1800);
            } catch (err) {
                console.error("Gagal menyalin teks", err);
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
            outputArea.value = "Menerjemahkan...";
            metaDiv.classList.add("hidden");
            srcRomaji.classList.add("hidden");
            tgtRomaji.classList.add("hidden");

            try {
                const sl = sourceLang.value;
                const tl = targetLang.value;
                const res = await fetch(
                    \`https://translate.googleapis.com/translate_a/single?client=gtx&sl=\${sl}&tl=\${tl}&dt=t&dt=sp&dt=qc&dt=rm&q=\${encodeURIComponent(text)}\`
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
                        srcRomaji.innerText = "Asli: " + sourceR;
                        srcRomaji.classList.remove("hidden");
                    }
                    if (targetR) {
                        tgtRomaji.innerText = "Hasil: " + targetR;
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
                outputArea.value = "Error: Gagal menerjemahkan.";
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
                btn.style.left = \`\${btnInitX + dx}px\`;
                btn.style.top = \`\${btnInitY + dy}px\`;
                btn.style.bottom = "auto";
                btn.style.right = "auto";
            } else if (popupDragging) {
                popup.style.left = \`\${popupInitX + dx}px\`;
                popup.style.top = \`\${popupInitY + dy}px\`;
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

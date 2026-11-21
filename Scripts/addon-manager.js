// ==UserScript==
// @name         BC Desktop Addon Manager
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Manages BC Desktop addons with a built-in UI and debugger
// @author       Izumii99
// @match        https://*.bondageprojects.elementfx.com/*
// @match        https://*.bondage-europe.com/*
// @match        https://*.bondageprojects.com/*
// @match        https://*.bondage-asia.com/*
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    if (window._bcAddonManagerLoaded) return;
    window._bcAddonManagerLoaded = true;

    console.log("BC Desktop: Addon Manager initializing...");

    let activeFeaturePopup = null;

    function showFeaturePopup(title, contentHTML) {
        const popupOverlay = document.createElement("div");
        Object.assign(popupOverlay.style, {
            position: "fixed", top: "0", left: "0", width: "100%", height: "100%",
            backgroundColor: "rgba(10, 8, 16, 0.8)", zIndex: "1000005",
            display: "flex", justifyContent: "center", alignItems: "center",
            opacity: "0", transition: "opacity 0.2s ease"
        });

        const popupBox = document.createElement("div");
        Object.assign(popupBox.style, {
            backgroundColor: "#1a1625", border: "1px solid #3d3554", borderRadius: "12px",
            padding: "20px", width: "80%", maxWidth: "420px", color: "#f5f5f5",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)", transform: "scale(0.9)", transition: "transform 0.2s ease"
        });

        const popupTitle = document.createElement("div");
        popupTitle.innerText = title;
        Object.assign(popupTitle.style, {
            fontSize: "16px", fontWeight: "bold", marginBottom: "12px", borderBottom: "1px solid #2e2640", paddingBottom: "8px"
        });

        const popupContent = document.createElement("div");
        popupContent.innerHTML = contentHTML;
        Object.assign(popupContent.style, {
            fontSize: "13px", color: "#d1cddd", lineHeight: "1.6"
        });

        const closeBtn = document.createElement("button");
        closeBtn.innerText = "Close";
        Object.assign(closeBtn.style, {
            marginTop: "20px", width: "100%", padding: "10px", borderRadius: "8px", border: "none",
            backgroundColor: "#352d4d", color: "#f5f5f5", cursor: "pointer", fontWeight: "bold", transition: "background-color 0.2s"
        });
        closeBtn.onmouseenter = () => closeBtn.style.backgroundColor = "#463d66";
        closeBtn.onmouseleave = () => closeBtn.style.backgroundColor = "#352d4d";
        
        closeBtn.onclick = () => {
            popupOverlay.style.opacity = "0";
            popupBox.style.transform = "scale(0.9)";
            setTimeout(() => popupOverlay.remove(), 200);
            if (activeFeaturePopup === popupOverlay) activeFeaturePopup = null;
        };
        activeFeaturePopup = popupOverlay;
        popupOverlay.onclick = (e) => {
            if (e.target === popupOverlay) closeBtn.onclick();
        };

        popupBox.appendChild(popupTitle);
        popupBox.appendChild(popupContent);
        popupBox.appendChild(closeBtn);
        popupOverlay.appendChild(popupBox);
        document.body.appendChild(popupOverlay);

        requestAnimationFrame(() => {
            popupOverlay.style.opacity = "1";
            popupBox.style.transform = "scale(1)";
        });
    }

    let REPO_API_URL =
        "https://data.jsdelivr.com/v1/package/gh/Izumii99/BC-Desktop@main";
    let SCRIPT_BASE_URL =
        "https://izumii99.github.io/BC-Desktop/Scripts/";
    const STORAGE_KEY = "BCDesktop_Addons_Config";
    const BOOKMARKLET_STORAGE_KEY = "BCDesktop_Addons_Bookmarklets";
    const MAX_BOOKMARKLET_HISTORY = 25;

    if (window.bcLocalScripts) {
        SCRIPT_BASE_URL = "http://bc-desktop.local/";
        console.log("BC Desktop: Local tester mode detected, pulling scripts from " + SCRIPT_BASE_URL);
    }

    const SCRIPT_INFO = {
        "FUSAM": { title: "FUSAM Loader", desc: "Fantastic Ultimate Solution to Addon Management (External Loader).", icon: "🛠️", url: "https://gitlab.com/zahk3277/bc-addon-loader", externalUrl: "https://sidiousious.gitlab.io/bc-addon-loader/fusam.js", isModule: true },
        "LikoPlugin": { title: "Liko Plugin", desc: "Liko's Plugin Collection Manager (External Loader).", icon: "https://cdn.jsdelivr.net/gh/awdrrawd/liko-Plugin-Repository@main/Images/PCM_ICON.png", url: "https://github.com/awdrrawd/liko-Plugin-Repository", externalUrl: "https://awdrrawd.github.io/liko-Plugin-Repository/PCM_Loader.user.js" },
        "chat-qol.js": { title: "Chat QoL", desc: "Quality of Life features for chat window, textmojis & fluid color enforcer.", icon: "https://cdn.jsdelivr.net/gh/Izumii99/BC-Desktop@main/Assets/gear_small.png", url: "https://github.com/Izumii99/BC-Desktop/blob/main/Scripts/chat-qol.js" },
        "translate.js": { title: "In-Game Translator", desc: "In-game translation tool for chat messages.", icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" style="width: 100%; height: 100%; display: block;"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4f46e5"/><stop offset="50%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#9333ea"/></linearGradient></defs><rect width="48" height="48" rx="11" fill="url(#g)"/><g fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" transform="translate(10, 10) scale(1.16)"><path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/></g></svg>`, url: "https://github.com/Izumii99/BC-Desktop/blob/main/Scripts/translate.js" },
        "cheat-menu.js": { title: "Cheat Menu", desc: "Quick access cheats for restraints, wardrobe, and NPCs.", icon: "https://cdn.jsdelivr.net/gh/Izumii99/BC-Desktop@main/Assets/cheat_ui.png", url: "https://github.com/Izumii99/BC-Desktop/blob/main/Scripts/cheat-menu.js" },
        "neko-dark.js": { title: "Neko Dark Theme", desc: "A sleek dark theme for Bondage Club by Neko.", url: "https://github.com/Izumii99/BC-Desktop/blob/main/Scripts/neko-dark.js" }
    };

    const SCRIPT_ORDER = [
        "FUSAM",
        "LikoPlugin",
        "chat-qol.js",
        "translate.js",
        "cheat-menu.js",
        "neko-dark.js"
    ];

    function sortScripts(list) {
        return list.slice().sort((a, b) => {
            const idxA = SCRIPT_ORDER.indexOf(a);
            const idxB = SCRIPT_ORDER.indexOf(b);
            const rankA = idxA !== -1 ? idxA : 999;
            const rankB = idxB !== -1 ? idxB : 999;
            return rankA - rankB;
        });
    }

    const IGNORED_SCRIPTS = [
        "addon-manager.js",
        "echo-activity.js",
        "autofocus.js",
        "fluid-color.js",
        "fusam.js",
        "LikoPlugin.js",
        "fusam-liko-loader.js",
        "wardrobe-pagination.js"
    ];



    let isModalOpen = false;
    let scriptsList = [];
    let scriptStatuses = {};

    let userConfig = {};
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            userConfig = JSON.parse(saved);
            if ("wardrobe-pagination.js" in userConfig) {
                delete userConfig["wardrobe-pagination.js"];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(userConfig));
            }
        }
    } catch (e) {
        console.error("BC Desktop: Failed to read Addon Config", e);
    }

    function saveConfig() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userConfig));
        } catch (e) {}
    }

    let bookmarkletHistory = [];
    const bookmarkletRuntimeStatus = {};

    try {
        const savedBm = localStorage.getItem(BOOKMARKLET_STORAGE_KEY);
        if (savedBm) {
            const parsedBm = JSON.parse(savedBm);
            if (Array.isArray(parsedBm)) {
                bookmarkletHistory = parsedBm
                    .filter((item) => item && typeof item.code === "string" && item.code.trim().length > 0)
                    .slice(0, MAX_BOOKMARKLET_HISTORY);
            }
        }
    } catch (e) {
        console.error("BC Desktop: Failed to read Bookmarklet History", e);
    }

    function saveBookmarkletHistory() {
        try {
            localStorage.setItem(
                BOOKMARKLET_STORAGE_KEY,
                JSON.stringify(bookmarkletHistory.slice(0, MAX_BOOKMARKLET_HISTORY)),
            );
        } catch (e) {}
    }

    function escapeHtml(str) {
        return String(str || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function normalizeBookmarkletInput(rawInput) {
        let code = String(rawInput || "").trim();
        if (!code) return "";
        if (/^javascript:/i.test(code)) {
            code = code.replace(/^javascript:\s*/i, "").trim();
        }
        if (/%[0-9A-Fa-f]{2}/.test(code) && !/\s/.test(code)) {
            try {
                code = decodeURIComponent(code).trim();
            } catch (e) {}
        } else if (code.includes("%20") || code.includes("%28") || code.includes("%7B")) {
            try {
                code = decodeURIComponent(code).trim();
            } catch (e) {}
        }
        return code;
    }

    function deriveBookmarkletName(rawCode) {
        const clean = normalizeBookmarkletInput(rawCode);
        const urlMatch = clean.match(/https?:\/\/[^\s"'`<>)]+/i);
        if (urlMatch) {
            try {
                const u = new URL(urlMatch[0]);
                const parts = u.pathname.split("/").filter(Boolean);
                const last = parts[parts.length - 1] || u.hostname;
                const cleanFile = last.replace(/\.(user|main|min)\.js$/i, "").replace(/\.js$/i, "");
                if (cleanFile && cleanFile.length >= 2) {
                    return cleanFile + " (" + u.hostname.replace(/^www\./, "") + ")";
                }
                return u.hostname;
            } catch (e) {}
        }
        const compact = clean.replace(/\s+/g, " ");
        return compact.length > 32 ? compact.slice(0, 32) + "..." : (compact || "Custom Script");
    }

    function showBookmarkletStatusPopup(name, isSuccess, detailMsg) {
        const badgeColor = isSuccess ? "#4caf50" : "#f44336";
        const badgeBg = isSuccess ? "rgba(76, 175, 80, 0.14)" : "rgba(244, 67, 54, 0.14)";
        const badgeBorder = isSuccess ? "rgba(76, 175, 80, 0.4)" : "rgba(244, 67, 54, 0.4)";
        const statusHeading = isSuccess ? "Script Executed Successfully" : "Script Execution Failed";
        const statusIcon = isSuccess ? "✔" : "✖";

        showFeaturePopup(
            "Bookmarklet Status",
            `<div style="display:flex; flex-direction:column; gap:10px;">
                <div style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:8px; background:${badgeBg}; border:1px solid ${badgeBorder};">
                    <span style="font-size:16px; font-weight:bold; color:${badgeColor};">${statusIcon}</span>
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:bold; color:${badgeColor}; font-size:13px;">${statusHeading}</span>
                        <span style="font-size:11px; color:#d1cddd;">${escapeHtml(name)}</span>
                    </div>
                </div>
                <div style="font-size:12px; color:#bfbad0; background:#14111d; padding:10px 12px; border-radius:8px; border:1px solid #2e2640; word-break:break-word;">
                    ${escapeHtml(detailMsg)}
                </div>
            </div>`
        );
    }

    function upsertBookmarkletHistory(rawInput) {
        const rawTrimmed = String(rawInput || "").trim();
        const normalized = normalizeBookmarkletInput(rawTrimmed);
        if (!normalized) return null;

        const existingIdx = bookmarkletHistory.findIndex(
            (item) => normalizeBookmarkletInput(item.code) === normalized,
        );
        const now = Date.now();
        let entry;
        if (existingIdx !== -1) {
            entry = bookmarkletHistory.splice(existingIdx, 1)[0];
            entry.code = rawTrimmed;
            entry.updatedAt = now;
            if (!entry.name) {
                entry.name = deriveBookmarkletName(rawTrimmed);
            }
        } else {
            entry = {
                id: "bm_" + now + "_" + Math.random().toString(36).slice(2, 7),
                name: deriveBookmarkletName(rawTrimmed),
                code: rawTrimmed,
                autoRun: false,
                updatedAt: now,
            };
        }
        bookmarkletHistory.unshift(entry);
        if (bookmarkletHistory.length > MAX_BOOKMARKLET_HISTORY) {
            bookmarkletHistory = bookmarkletHistory.slice(0, MAX_BOOKMARKLET_HISTORY);
        }
        saveBookmarkletHistory();
        return entry;
    }

    function runBookmarkletEntry(entry, showPopup) {
        if (!entry || !entry.code) return;
        const cleanCode = normalizeBookmarkletInput(entry.code);
        if (!cleanCode) {
            if (showPopup) {
                showBookmarkletStatusPopup("Invalid Bookmarklet", false, "Bookmarklet code is empty.");
            }
            return;
        }

        const label = entry.name || deriveBookmarkletName(entry.code);
        bookmarkletRuntimeStatus[entry.id] = "loading";
        if (isModalOpen) renderList();

        const target = document.head || document.documentElement || document.body;

        // Direct script URL (https://.../script.js)
        if (/^https?:\/\/[^\s"'`<>]+$/i.test(cleanCode)) {
            const script = document.createElement("script");
            script.src = cleanCode + (cleanCode.includes("?") ? "&" : "?") + "_bc=" + Date.now();
            script.async = false;
            script.onload = () => {
                bookmarkletRuntimeStatus[entry.id] = "loaded";
                if (isModalOpen) renderList();
                if (showPopup) {
                    showBookmarkletStatusPopup(label, true, "External script loaded and executed successfully.");
                }
            };
            script.onerror = () => {
                bookmarkletRuntimeStatus[entry.id] = "failed";
                if (isModalOpen) renderList();
                if (showPopup) {
                    showBookmarkletStatusPopup(label, false, "Failed to load script from URL: " + cleanCode);
                }
            };
            if (target) {
                target.appendChild(script);
            }
            return;
        }

        // JavaScript bookmarklet code: track any dynamically injected <script src="..."> tags
        const injectedScripts = [];
        const origAppendChild = Node.prototype.appendChild;
        Node.prototype.appendChild = function (child) {
            if (child && child.tagName === "SCRIPT" && child.src) {
                injectedScripts.push(child);
            }
            return origAppendChild.apply(this, arguments);
        };

        let execResult;
        try {
            const runner = new window.Function(cleanCode);
            execResult = runner();
        } catch (err) {
            Node.prototype.appendChild = origAppendChild;
            bookmarkletRuntimeStatus[entry.id] = "failed";
            if (isModalOpen) renderList();
            if (showPopup) {
                showBookmarkletStatusPopup(
                    label,
                    false,
                    err && err.message ? err.message : String(err),
                );
            }
            return;
        }
        Node.prototype.appendChild = origAppendChild;

        if (injectedScripts.length > 0) {
            const tracked = injectedScripts[injectedScripts.length - 1];
            let settled = false;
            const finish = (ok, msg) => {
                if (settled) return;
                settled = true;
                bookmarkletRuntimeStatus[entry.id] = ok ? "loaded" : "failed";
                if (isModalOpen) renderList();
                if (showPopup) {
                    showBookmarkletStatusPopup(label, ok, msg);
                }
            };
            tracked.addEventListener("load", () => {
                finish(true, "Bookmarklet injected and loaded remote script: " + tracked.src);
            });
            tracked.addEventListener("error", () => {
                finish(false, "Bookmarklet ran, but remote script failed to load: " + tracked.src);
            });
            setTimeout(() => {
                finish(true, "Bookmarklet executed and dispatched remote script: " + tracked.src);
            }, 8000);
            return;
        }

        if (execResult && typeof execResult.then === "function") {
            execResult.then(
                () => {
                    bookmarkletRuntimeStatus[entry.id] = "loaded";
                    if (isModalOpen) renderList();
                    if (showPopup) {
                        showBookmarkletStatusPopup(label, true, "Async bookmarklet finished executing successfully.");
                    }
                },
                (err) => {
                    bookmarkletRuntimeStatus[entry.id] = "failed";
                    if (isModalOpen) renderList();
                    if (showPopup) {
                        showBookmarkletStatusPopup(
                            label,
                            false,
                            err && err.message ? err.message : String(err),
                        );
                    }
                },
            );
            return;
        }

        bookmarkletRuntimeStatus[entry.id] = "loaded";
        if (isModalOpen) renderList();
        if (showPopup) {
            showBookmarkletStatusPopup(label, true, "Bookmarklet executed successfully in game context.");
        }
    }

    function runAutoBookmarklets() {
        bookmarkletHistory.forEach((entry) => {
            if (entry && entry.autoRun) {
                runBookmarkletEntry(entry, false);
            }
        });
    }

    const DEFAULT_ENABLED_SCRIPTS = [
        "chat-qol.js"
    ];

    function isScriptEnabled(scriptName) {
        if (scriptName in userConfig) {
            return userConfig[scriptName] === true;
        }
        // Whitelist by default on clean/first install
        return DEFAULT_ENABLED_SCRIPTS.includes(scriptName);
    }

    const floatingBtn = document.createElement("div");
    floatingBtn.innerHTML = `<img src="https://cdn.jsdelivr.net/gh/Izumii99/BC-Desktop@main/Assets/Icon.png" style="width: 28px; height: 28px;" />`;
    Object.assign(floatingBtn.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "50px",
        height: "50px",
        backgroundColor: "#2e2742",
        color: "white",
        borderRadius: "50%",
        display: "none",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "24px",
        cursor: "pointer",
        boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
        zIndex: "999999",
        transition: "transform 0.2s, background-color 0.2s",
        userSelect: "none",
        border: "2px solid #3d3554"
    });

    floatingBtn.onmouseenter = () => {
        floatingBtn.style.backgroundColor = "#3d3554";
        floatingBtn.style.transform = "scale(1.1)";
    };
    floatingBtn.onmouseleave = () => {
        floatingBtn.style.backgroundColor = "#2e2742";
        floatingBtn.style.transform = "scale(1)";
    };
    floatingBtn.onclick = toggleModal;
    document.body.appendChild(floatingBtn);

    const modalOverlay = document.createElement("div");
    Object.assign(modalOverlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: "1000000",
        display: "none",
        justifyContent: "center",
        alignItems: "center",
    });

    const modalContent = document.createElement("div");
    Object.assign(modalContent.style, {
        backgroundColor: "#1a1625",
        width: "450px",
        maxWidth: "90%",
        maxHeight: "85%",
        borderRadius: "16px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.8)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid #2e2640",
        color: "#f5f5f5",
        fontFamily: "'Inter', Arial, sans-serif",
    });

    const modalHeader = document.createElement("div");
    Object.assign(modalHeader.style, {
        backgroundColor: "#211c2e",
        padding: "18px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #2e2640",
        fontWeight: "bold",
        fontSize: "16px",
    });
    modalHeader.innerHTML = `<div style="display:flex; align-items:center; gap:8px;"><img src="https://cdn.jsdelivr.net/gh/Izumii99/BC-Desktop@main/Assets/Icon.png" style="width: 20px; height: 20px;" /><span>Addons Manager</span></div>`;

    const closeBtn = document.createElement("span");
    closeBtn.innerHTML = "✖";
    Object.assign(closeBtn.style, {
        cursor: "pointer",
        color: "#a59fb5",
        fontSize: "14px",
    });
    closeBtn.onmouseenter = () => (closeBtn.style.color = "white");
    closeBtn.onmouseleave = () => (closeBtn.style.color = "#a59fb5");
    closeBtn.onclick = toggleModal;
    modalHeader.appendChild(closeBtn);

    const modalBody = document.createElement("div");
    Object.assign(modalBody.style, {
        padding: "20px 24px",
        overflowY: "auto",
        flexGrow: "1",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    });
    modalBody.innerHTML = `<div style="text-align: center; color: #a59fb5;">Fetching scripts...</div>`;

    const modalFooter = document.createElement("div");
    Object.assign(modalFooter.style, {
        backgroundColor: "#211c2e",
        padding: "14px 24px",
        borderTop: "1px solid #2e2640",
        textAlign: "center",
        fontSize: "11px",
        color: "#8a8d9b",
    });
    modalFooter.innerText = "Changes will take effect on the next game refresh (F5).";

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) toggleModal();
    };

    function toggleModal() {
        isModalOpen = !isModalOpen;
        modalOverlay.style.display = isModalOpen ? "flex" : "none";
        if (isModalOpen) renderList();
    }

    document.addEventListener(
        "keydown",
        (e) => {
            if (e.key !== "Escape") return;
            if (activeFeaturePopup) {
                e.preventDefault();
                e.stopPropagation();
                const overlay = activeFeaturePopup;
                const closeBtnEl = overlay.querySelector("button");
                if (closeBtnEl) closeBtnEl.click();
                else overlay.remove();
                activeFeaturePopup = null;
                return;
            }
            if (!isModalOpen) return;
            e.preventDefault();
            e.stopPropagation();
            toggleModal();
        },
        true,
    );

    function renderList() {
        modalBody.innerHTML = "";

        // --- Render Bookmarklet Input Bar & Cached History ---
        const bmBox = document.createElement("div");
        Object.assign(bmBox.style, {
            backgroundColor: "#211c2e",
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #352d4d",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            flexShrink: "0",
        });

        const bmHeader = document.createElement("div");
        Object.assign(bmHeader.style, {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
        });
        bmHeader.innerHTML = `<span style="font-weight:bold; font-size:13px; color:#e2dcf0;">⚡ Bookmarklet &amp; Custom Script</span><span style="font-size:10px; color:#8a81a8;">Cached in memory</span>`;
        bmBox.appendChild(bmHeader);

        const bmInputRow = document.createElement("div");
        Object.assign(bmInputRow.style, {
            display: "flex",
            gap: "8px",
            alignItems: "center",
        });

        const bmInput = document.createElement("input");
        bmInput.id = "bc-addon-bookmarklet-input";
        bmInput.type = "text";
        bmInput.autocomplete = "off";
        bmInput.placeholder = "Paste javascript:(...) bookmarklet or script URL...";
        Object.assign(bmInput.style, {
            flexGrow: "1",
            minWidth: "0",
            padding: "8px 11px",
            borderRadius: "8px",
            border: "1px solid #3d3554",
            backgroundColor: "#14111d",
            color: "#f5f5f5",
            fontSize: "12px",
            outline: "none",
        });

        const bmRunBtn = document.createElement("button");
        bmRunBtn.innerText = "▶ Run";
        Object.assign(bmRunBtn.style, {
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#7c3aed",
            color: "#ffffff",
            fontWeight: "bold",
            fontSize: "12px",
            cursor: "pointer",
            flexShrink: "0",
            transition: "background-color 0.2s",
        });
        bmRunBtn.onmouseenter = () => (bmRunBtn.style.backgroundColor = "#6d28d9");
        bmRunBtn.onmouseleave = () => (bmRunBtn.style.backgroundColor = "#7c3aed");

        const triggerInputBookmarklet = () => {
            const val = bmInput.value.trim();
            if (!val) {
                showBookmarkletStatusPopup(
                    "Empty Input",
                    false,
                    "Please paste a bookmarklet (javascript:...) or script URL first.",
                );
                return;
            }
            const entry = upsertBookmarkletHistory(val);
            bmInput.value = "";
            if (entry) {
                runBookmarkletEntry(entry, true);
            }
        };

        bmRunBtn.onclick = triggerInputBookmarklet;
        bmInput.addEventListener("keydown", (e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
                e.preventDefault();
                triggerInputBookmarklet();
            }
        });

        bmInputRow.appendChild(bmInput);
        bmInputRow.appendChild(bmRunBtn);
        bmBox.appendChild(bmInputRow);

        if (bookmarkletHistory.length > 0) {
            const histTitleRow = document.createElement("div");
            Object.assign(histTitleRow.style, {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "2px",
            });
            const histLabel = document.createElement("span");
            histLabel.innerText = "Saved Bookmarklet History (Tap to run):";
            Object.assign(histLabel.style, {
                fontSize: "11px",
                color: "#a59fb5",
                fontWeight: "bold",
            });
            histTitleRow.appendChild(histLabel);

            const clearAllBtn = document.createElement("span");
            clearAllBtn.innerText = "Clear All";
            Object.assign(clearAllBtn.style, {
                fontSize: "10px",
                color: "#8a81a8",
                cursor: "pointer",
                textDecoration: "underline",
            });
            clearAllBtn.onclick = () => {
                bookmarkletHistory = [];
                saveBookmarkletHistory();
                renderList();
            };
            histTitleRow.appendChild(clearAllBtn);
            bmBox.appendChild(histTitleRow);

            const histList = document.createElement("div");
            Object.assign(histList.style, {
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                maxHeight: "145px",
                overflowY: "auto",
                paddingRight: "2px",
            });

            bookmarkletHistory.forEach((entry) => {
                const hRow = document.createElement("div");
                Object.assign(hRow.style, {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    padding: "7px 10px",
                    borderRadius: "8px",
                    backgroundColor: "#161220",
                    border: "1px solid #2e2640",
                    cursor: "pointer",
                    transition: "border-color 0.2s, background-color 0.2s",
                });
                hRow.onmouseenter = () => {
                    hRow.style.borderColor = "#5e4b8b";
                    hRow.style.backgroundColor = "#1d182b";
                };
                hRow.onmouseleave = () => {
                    hRow.style.borderColor = "#2e2640";
                    hRow.style.backgroundColor = "#161220";
                };

                const hLeft = document.createElement("div");
                Object.assign(hLeft.style, {
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    minWidth: "0",
                    flexGrow: "1",
                });

                const hDot = document.createElement("span");
                const st = bookmarkletRuntimeStatus[entry.id] || "idle";
                Object.assign(hDot.style, {
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    flexShrink: "0",
                    backgroundColor:
                        st === "loaded"
                            ? "#4caf50"
                            : st === "failed"
                              ? "#f44336"
                              : st === "loading"
                                ? "#ffeb3b"
                                : "#7b7194",
                });

                const hTextWrap = document.createElement("div");
                Object.assign(hTextWrap.style, {
                    display: "flex",
                    flexDirection: "column",
                    minWidth: "0",
                    flexGrow: "1",
                });

                const hTitle = document.createElement("div");
                hTitle.innerText = entry.name || deriveBookmarkletName(entry.code);
                Object.assign(hTitle.style, {
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#f5f5f5",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                });

                const hCodePreview = document.createElement("div");
                hCodePreview.innerText = entry.code;
                Object.assign(hCodePreview.style, {
                    fontSize: "10px",
                    color: "#8a81a8",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                });

                hTextWrap.appendChild(hTitle);
                hTextWrap.appendChild(hCodePreview);
                hLeft.appendChild(hDot);
                hLeft.appendChild(hTextWrap);
                hLeft.onclick = () => runBookmarkletEntry(entry, true);

                const hActions = document.createElement("div");
                Object.assign(hActions.style, {
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flexShrink: "0",
                });

                const autoBtn = document.createElement("span");
                autoBtn.innerText = entry.autoRun ? "Auto: ON" : "Auto: OFF";
                autoBtn.title = "Automatically run this bookmarklet on game startup";
                Object.assign(autoBtn.style, {
                    fontSize: "10px",
                    fontWeight: "bold",
                    padding: "3px 7px",
                    borderRadius: "10px",
                    backgroundColor: entry.autoRun ? "#7c3aed" : "#282238",
                    color: entry.autoRun ? "#ffffff" : "#a59fb5",
                    border: "1px solid #3d3554",
                    cursor: "pointer",
                    userSelect: "none",
                });
                autoBtn.onclick = (e) => {
                    e.stopPropagation();
                    entry.autoRun = !entry.autoRun;
                    saveBookmarkletHistory();
                    renderList();
                };

                const delBtn = document.createElement("span");
                delBtn.innerText = "✕";
                delBtn.title = "Remove from saved history";
                Object.assign(delBtn.style, {
                    fontSize: "11px",
                    color: "#a59fb5",
                    padding: "2px 6px",
                    borderRadius: "6px",
                    cursor: "pointer",
                });
                delBtn.onmouseenter = () => (delBtn.style.color = "#f44336");
                delBtn.onmouseleave = () => (delBtn.style.color = "#a59fb5");
                delBtn.onclick = (e) => {
                    e.stopPropagation();
                    bookmarkletHistory = bookmarkletHistory.filter((item) => item.id !== entry.id);
                    saveBookmarkletHistory();
                    renderList();
                };

                hActions.appendChild(autoBtn);
                hActions.appendChild(delBtn);

                hRow.appendChild(hLeft);
                hRow.appendChild(hActions);
                histList.appendChild(hRow);
            });

            bmBox.appendChild(histList);
        }

        modalBody.appendChild(bmBox);

        if (scriptsList.length === 0) {
            const emptyMsg = document.createElement("div");
            emptyMsg.style.cssText = "text-align: center; color: #a59fb5;";
            emptyMsg.innerText = "No scripts found or still loading...";
            modalBody.appendChild(emptyMsg);
            return;
        }



        // --- Render scripts ---
        scriptsList.forEach((scriptName) => {
            const isEnabled = isScriptEnabled(scriptName);
            const status = scriptStatuses[scriptName] || (isEnabled ? "loading" : "disabled");

            const itemDiv = document.createElement("div");
            Object.assign(itemDiv.style, {
                display: "flex",
                alignItems: "center",
                backgroundColor: "#211c2e",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid #2e2640",
                position: "relative",
                flexShrink: "0"
            });

            const sIcon = document.createElement("div");
            Object.assign(sIcon.style, {
                backgroundColor: "#352d4d",
                borderRadius: "10px",
                width: "48px",
                height: "48px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "24px",
                marginRight: "15px",
                flexShrink: "0",
                overflow: "hidden"
            });

            const infoDiv = document.createElement("div");
            Object.assign(infoDiv.style, { flexGrow: "1", display: "flex", flexDirection: "column", minWidth: "0" });

            const info = SCRIPT_INFO[scriptName] || { title: scriptName.replace(".js", ""), desc: "Local Addon Script" };

            if (info.icon) {
                if (info.icon.startsWith("<svg") || info.icon.startsWith("<div")) {
                    sIcon.innerHTML = info.icon;
                } else if (info.icon.startsWith("http") || info.icon.startsWith("data:")) {
                    const isSmall = info.icon.includes("gear_small");
                    sIcon.innerHTML = `<img src="${info.icon}" style="${isSmall ? 'width: 26px; height: 26px;' : 'width: 100%; height: 100%;'} object-fit: contain;" />`;
                } else {
                    sIcon.innerText = info.icon;
                }
            } else {
                sIcon.innerText = "📜";
            }

            const titleSpan = document.createElement("div");
            titleSpan.innerText = info.title;
            Object.assign(titleSpan.style, {
                fontWeight: "bold",
                fontSize: "14px",
                color: "#f5f5f5",
                marginBottom: "4px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
            });

            const descSpan = document.createElement("div");
            descSpan.innerText = info.desc;
            Object.assign(descSpan.style, { 
                fontSize: "12px", color: "#a59fb5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" 
            });

            const statusDotContainer = document.createElement("div");
            Object.assign(statusDotContainer.style, { marginTop: "8px" });
            const statusDot = document.createElement("div");
            Object.assign(statusDot.style, { width: "8px", height: "8px", borderRadius: "50%", display: "inline-block", marginRight: "6px" });
            
            if (status === "loaded") statusDot.style.backgroundColor = "#4caf50";
            else if (status === "failed") statusDot.style.backgroundColor = "#f44336";
            else if (status === "disabled") statusDot.style.backgroundColor = "#8a8d9b";
            else statusDot.style.backgroundColor = "#ffeb3b";
            
            const statusText = document.createElement("span");
            statusText.innerText = status === "loaded" ? "Loaded" : status === "disabled" ? "Disabled" : status === "failed" ? "Failed" : "Loading...";
            Object.assign(statusText.style, { fontSize: "10px", color: "#8a8d9b", verticalAlign: "top" });

            statusDotContainer.appendChild(statusDot);
            statusDotContainer.appendChild(statusText);

            infoDiv.appendChild(titleSpan);
            infoDiv.appendChild(descSpan);
            
            if (scriptName === "chat-qol.js") {
                const keysBtn = document.createElement("div");
                keysBtn.innerText = "🔍 View Features";
                Object.assign(keysBtn.style, {
                    fontSize: "11px", color: "#b39ddb", cursor: "pointer", marginTop: "8px", display: "inline-block", width: "fit-content",
                    padding: "4px 10px", backgroundColor: "rgba(179, 157, 219, 0.1)", borderRadius: "6px", border: "1px solid rgba(179, 157, 219, 0.3)",
                    transition: "all 0.2s ease", fontWeight: "bold"
                });
                
                keysBtn.onmouseenter = () => keysBtn.style.backgroundColor = "rgba(179, 157, 219, 0.25)";
                keysBtn.onmouseleave = () => keysBtn.style.backgroundColor = "rgba(179, 157, 219, 0.1)";
                
                keysBtn.onclick = () => {
                    showFeaturePopup("Chat QoL - Features & Hotkeys", `
                        <div style="margin-bottom:12px; max-height: 400px; overflow-y: auto; padding-right: 8px;">
                            <div style="margin-bottom:8px; font-weight:bold; color:#b39ddb;">Auto-Emoticons (Text-to-Expression)</div>
                            <div style="margin-bottom:12px; font-size:12px;">Typing text emoticons automatically changes your character's facial expressions. No need to click the menu.
                                <ul style="margin:4px 0 0 0; padding-left:24px; color:#e0e0e0; font-size:11px;">
                                    <li><b>Eyes:</b> <code>^^</code>, <code>0.0</code>, <code>o_o</code>, <code>@_@</code>, <code>&gt;&lt;</code>, <code>= =</code>, <code>;p</code>, <code>:)</code></li>
                                    <li><b>Mouth:</b> <code>:D</code>, <code>:3</code>, <code>:p</code>, <code>^~^</code>, <code>:(</code>, <code>=3=</code>, <code>=w=</code>, <code>=////=</code></li>
                                    <li><b>Eyebrows:</b> <code>&gt;:(</code>, <code>TT</code>, <code>&gt;_&gt;</code></li>
                                </ul>
                            </div>
                            
                            <div style="margin-bottom:8px; font-weight:bold; color:#b39ddb;">Floating Emoticons & Effects</div>
                            <div style="margin-bottom:12px; font-size:12px;">
                                <ul style="margin:0; padding-left:24px; color:#e0e0e0; font-size:11px;">
                                    <li style="margin-bottom:4px;"><b>Action Icons:</b> Add <code>!</code>, <code>?</code>, or <code>#</code> to an emoticon to trigger floating icons.</li>
                                    <li style="margin-bottom:4px;"><b>Sweat Drop:</b> End your message with <code>;</code> or attach it to a face (e.g. <code>=v=;</code>) to show a tear.</li>
                                    <li style="margin-bottom:4px;"><b>AFK / BRB:</b> Type <code>brb</code> or <code>afk</code> to permanently show the status icon.</li>
                                    <li style="margin-bottom:4px;"><b>Blush:</b> Use <code>//</code> to <code>/////</code> to add blush (Low to Custom Very High). Works inside faces like <code>=//=</code> too.</li>
                                </ul>
                            </div>

                            <div style="margin-bottom:8px; font-weight:bold; color:#b39ddb;">Hotkeys & Chat Fixes</div>
                            <ul style="margin:0; padding-left:24px; color:#e0e0e0; font-size:11px;">
                                <li style="margin-bottom:4px;"><b>Tab Key</b>: Instantly auto-completes the targeted character's name when typing a whisper.</li>
                                <li style="margin-bottom:4px;"><b>Alt + 1~0</b>: Quickly whisper a character based on their actual left-to-right position in the room.</li>
                                <li style="margin-bottom:4px;"><b>Alt + C/V/B</b>: Pet the Ear/Tail/Wings of your target <i>(Requires BCAR+)</i>.</li>
                                <li style="margin-bottom:4px;"><b>Ctrl + Space</b>: Force scroll the chatbox to the very bottom.</li>
                                <li style="margin-bottom:4px;"><b>Ungarbled Chat</b>: Automatically reveals garbled text for immersion settings.</li>
                            </ul>
                        </div>
                    `);
                };
                
                infoDiv.appendChild(keysBtn);
            }

            infoDiv.appendChild(statusDotContainer);

            // Custom Liko Toggle Switch
            const toggleContainer = document.createElement("div");
            Object.assign(toggleContainer.style, {
                display: "flex",
                backgroundColor: "#2e2742",
                borderRadius: "20px",
                padding: "4px",
                alignItems: "center",
                fontSize: "10px",
                fontWeight: "bold",
                color: "#a59fb5",
                border: "1px solid #3d3554",
                cursor: "pointer",
                userSelect: "none",
                flexShrink: "0",
                marginLeft: "10px"
            });

            const offBtn = document.createElement("div");
            offBtn.innerText = "OFF";
            Object.assign(offBtn.style, {
                padding: "4px 12px",
                borderRadius: "16px",
                backgroundColor: !isEnabled ? "#7b7194" : "transparent",
                color: !isEnabled ? "white" : "#a59fb5",
                transition: "all 0.2s"
            });

            const onBtn = document.createElement("div");
            onBtn.innerText = "ON";
            Object.assign(onBtn.style, {
                padding: "4px 12px",
                borderRadius: "16px",
                backgroundColor: isEnabled ? "#7b7194" : "transparent",
                color: isEnabled ? "white" : "#a59fb5",
                transition: "all 0.2s"
            });

            toggleContainer.appendChild(offBtn);
            toggleContainer.appendChild(onBtn);

            toggleContainer.onclick = () => {
                const newState = !isEnabled;
                userConfig[scriptName] = newState;
                saveConfig();
                renderList();
            };

            const chainBadge = document.createElement("div");
            Object.assign(chainBadge.style, {
                position: "absolute", bottom: "0", right: "0", width: "24px", height: "24px",
                backgroundColor: "#2e2742", borderTopLeftRadius: "8px", borderBottomRightRadius: "10px",
                display: "flex", justifyContent: "center", alignItems: "center",
                fontSize: "10px", color: "#a59fb5", cursor: "pointer", transition: "background-color 0.2s ease, color 0.2s"
            });
            chainBadge.innerText = "🔗";
            if (info.url) {
                chainBadge.title = "View Source / Repository";
                chainBadge.onmouseenter = () => { chainBadge.style.backgroundColor = "#3d3554"; chainBadge.style.color = "#fff"; };
                chainBadge.onmouseleave = () => { chainBadge.style.backgroundColor = "#2e2742"; chainBadge.style.color = "#a59fb5"; };
                chainBadge.onclick = () => window.open(info.url, "_blank");
            } else {
                chainBadge.style.opacity = "0.5";
                chainBadge.style.cursor = "default";
            }

            itemDiv.appendChild(sIcon);
            itemDiv.appendChild(infoDiv);
            itemDiv.appendChild(toggleContainer);
            itemDiv.appendChild(chainBadge);
            modalBody.appendChild(itemDiv);
        });


    }

    setInterval(() => {
        try {
            if (window._bcIsBackground) return;
            if (
                window.CurrentScreen === "Login" ||
                window.CurrentScreen === "Information" ||
                window.CurrentScreen === "Profile" ||
                window.CurrentScreen === "Preference" ||
                window.CurrentScreen === "InformationSheet"
            ) {
                if (floatingBtn.style.display === "none") {
                    floatingBtn.style.display = "flex";
                }
            } else {
                if (floatingBtn.style.display !== "none") {
                    floatingBtn.style.display = "none";
                }
            }
        } catch (e) {}
    }, 1000);

    function injectTargetScripts() {
        let target = document.head || document.documentElement;
        if (!target) {
            setTimeout(injectTargetScripts, 10);
            return;
        }

        scriptsList.forEach((scriptName) => {
            const isEnabled = isScriptEnabled(scriptName);

            if (!isEnabled) {
                scriptStatuses[scriptName] = "disabled";
                return;
            }

            scriptStatuses[scriptName] = "loading";

            const info = SCRIPT_INFO[scriptName] || {};
            let script = document.createElement("script");
            if (info.isModule) script.type = "module";
            script.src = info.externalUrl ? (info.externalUrl + "?v=" + Date.now()) : (SCRIPT_BASE_URL + scriptName + "?v=" + Date.now());
            script.async = false;

            script.onload = () => {
                scriptStatuses[scriptName] = "loaded";
                console.log(
                    `BC Desktop: Successfully loaded ${scriptName}`,
                );
                if (isModalOpen) renderList();
            };

            script.onerror = () => {
                scriptStatuses[scriptName] = "failed";
                console.error(
                    `BC Desktop: Failed to load ${scriptName}`,
                );
                if (isModalOpen) renderList();
            };

            target.appendChild(script);
        });

        runAutoBookmarklets();
    }

    if (window.bcLocalScripts) {
        scriptsList = window.bcLocalScripts.filter(
            (f) => !f.toLowerCase().includes("debug") && !IGNORED_SCRIPTS.includes(f) && f.endsWith(".js")
        );
        let knownExternal = Object.keys(SCRIPT_INFO).filter(name => SCRIPT_INFO[name].externalUrl);
        scriptsList = sortScripts([...new Set([...scriptsList, ...knownExternal])]);
        injectTargetScripts();
        return;
    }

    // Immediate injection: always load known scripts right away without waiting for remote API network latency
    let knownScripts = Object.keys(SCRIPT_INFO).filter(name => !IGNORED_SCRIPTS.includes(name));
    scriptsList = sortScripts(knownScripts);
    injectTargetScripts();

    // Background discovery for additional community scripts from repository API (non-blocking)
    if (!window.bcLocalScripts) {
        fetch(REPO_API_URL)
            .then((response) => response.json())
            .then((data) => {
                let scriptsDir = null;
                if (data && data.files) {
                    scriptsDir = data.files.find(
                        (f) => f.type === "directory" && f.name === "Scripts",
                    );
                }

                if (scriptsDir && scriptsDir.files) {
                    const apiScripts = scriptsDir.files
                        .filter(
                            (f) =>
                                f.type === "file" &&
                                f.name.endsWith(".js") &&
                                !f.name.toLowerCase().includes("debug") &&
                                !IGNORED_SCRIPTS.includes(f.name)
                        )
                        .map((f) => f.name);

                    const newScripts = apiScripts.filter((s) => !scriptsList.includes(s));
                    if (newScripts.length > 0) {
                        scriptsList = sortScripts([...new Set([...scriptsList, ...newScripts])]);
                        newScripts.forEach((scriptName) => {
                            const isEnabled = isScriptEnabled(scriptName);
                            if (!isEnabled) {
                                scriptStatuses[scriptName] = "disabled";
                                return;
                            }
                            scriptStatuses[scriptName] = "loading";
                            let script = document.createElement("script");
                            script.src = SCRIPT_BASE_URL + scriptName + "?v=" + Date.now();
                            script.async = false;
                            script.onload = () => {
                                scriptStatuses[scriptName] = "loaded";
                                if (isModalOpen) renderList();
                            };
                            script.onerror = () => {
                                scriptStatuses[scriptName] = "failed";
                                if (isModalOpen) renderList();
                            };
                            let target = document.head || document.documentElement;
                            if (target) target.appendChild(script);
                        });
                        if (isModalOpen) renderList();
                    }
                }
            })
            .catch(() => {
                // Silently ignore background discovery errors as known scripts are already running
            });
    }
})();

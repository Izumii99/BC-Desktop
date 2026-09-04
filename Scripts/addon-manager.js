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
        };
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
        "https://cdn.jsdelivr.net/gh/Izumii99/BC-Desktop@main/Scripts/";
    const STORAGE_KEY = "BCDesktop_Addons_Config";

    if (window.bcLocalScripts) {
        SCRIPT_BASE_URL = "http://bc-desktop.local/";
        console.log("BC Desktop: Local tester mode detected, pulling scripts from " + SCRIPT_BASE_URL);
    }

    const SCRIPT_INFO = {
        "autofocus.js": { title: "Autofocus", desc: "Automatically focuses the chat input box.", url: "https://github.com/Izumii99/BC-Desktop/blob/main/tester/Scripts/autofocus.js" },
        "chat-qol.js": { title: "Chat QoL", desc: "Quality of Life features for the chat window.", url: "https://github.com/Izumii99/BC-Desktop/blob/main/tester/Scripts/chat-qol.js" },
        "fusam.js": { title: "FUSAM Loader", desc: "Fantastic Ultimate Solution to Addon Management.", icon: "🛠️", url: "https://gitlab.com/zahk3277/bc-addon-loader" },
        "LikoPlugin.js": { title: "Liko Plugin", desc: "Player customization and utility plugin.", icon: "https://cdn.jsdelivr.net/gh/awdrrawd/liko-Plugin-Repository@main/Images/PCM_ICON.png", url: "https://github.com/awdrrawd/liko-Plugin-Repository" },
        "neko-dark.js": { title: "Neko Dark Theme", desc: "A sleek dark theme for Bondage Club by Neko.", url: "https://github.com/Izumii99/BC-Desktop/blob/main/tester/Scripts/neko-dark.js" },
        "translate.js": { title: "In-Game Translator", desc: "In-game translation tool for chat messages.", url: "https://github.com/Izumii99/BC-Desktop/blob/main/tester/Scripts/translate.js" },
        "wardrobe-pagination.js": { title: "Wardrobe Pagination", desc: "Adds pagination to wardrobe items.", url: "https://github.com/Izumii99/BC-Desktop/blob/main/tester/Scripts/wardrobe-pagination.js" },
        "echo-activity.js": { title: "Echo Activity Ext", desc: "Custom group cuddle & activity extension (fork).", icon: "🤗", url: "https://github.com/Izumii99/echo-activity-ext" }
    };

    const ULTRABC_OPTIONS = [
        { label: "❌ Off", url: "" },
        { label: "🇬🇧 English", url: "https://tetris245.github.io/ultrabc.github.io/ULTRAbcloader.user.js" },
        { label: "🇨🇳 Chinese", url: "https://tetris245.github.io/ultrabc.github.io/ULTRAbcloader-ch.user.js" },
        { label: "🇪🇸 Spanish", url: "https://tetris245.github.io/ultrabc.github.io/ULTRAbcloader-es.user.js" }
    ];

    let isModalOpen = false;
    let scriptsList = [];
    let scriptStatuses = {};

    let userConfig = {};
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) userConfig = JSON.parse(saved);
    } catch (e) {
        console.error("BC Desktop: Failed to read Addon Config", e);
    }

    function saveConfig() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userConfig));
        } catch (e) {}
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

    function renderList() {
        modalBody.innerHTML = "";

        if (scriptsList.length === 0) {
            modalBody.innerHTML = `<div style="text-align: center; color: #a59fb5;">No scripts found or still loading...</div>`;
            return;
        }

        // --- Render ULTRABc ---
        const ultrabcDiv = document.createElement("div");
        Object.assign(ultrabcDiv.style, {
            display: "flex",
            alignItems: "center",
            backgroundColor: "#211c2e",
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #2e2640",
            position: "relative",
            flexShrink: "0"
        });
        
        const uIcon = document.createElement("div");
        Object.assign(uIcon.style, {
            backgroundColor: "#352d4d",
            borderRadius: "10px",
            width: "48px",
            height: "48px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "24px",
            marginRight: "15px",
            flexShrink: "0"
        });
        uIcon.innerText = "⚡";

        const uInfo = document.createElement("div");
        Object.assign(uInfo.style, { flexGrow: "1", display: "flex", flexDirection: "column", minWidth: "0" });
        
        const uTitle = document.createElement("div");
        uTitle.innerText = "ULTRABc";
        Object.assign(uTitle.style, { fontWeight: "bold", fontSize: "14px", color: "#f5f5f5", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" });
        
        const uDesc = document.createElement("div");
        uDesc.innerText = "Massive Bondage Club Mod Toolkit";
        Object.assign(uDesc.style, { fontSize: "12px", color: "#a59fb5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" });
        
        const uStatusDotContainer = document.createElement("div");
        Object.assign(uStatusDotContainer.style, { marginTop: "8px" });
        const uStatusDot = document.createElement("div");
        
        let uConfig = userConfig["ULTRABc"];
        Object.assign(uStatusDot.style, {
            width: "8px", height: "8px", borderRadius: "50%",
            backgroundColor: uConfig ? "#4caf50" : "#8a8d9b"
        });
        uStatusDotContainer.appendChild(uStatusDot);

        uInfo.appendChild(uTitle);
        uInfo.appendChild(uDesc);
        uInfo.appendChild(uStatusDotContainer);
        
        const uSelectContainer = document.createElement("div");
        Object.assign(uSelectContainer.style, { position: "relative", flexShrink: "0", zIndex: "100" });

        const uSelectBtn = document.createElement("div");
        Object.assign(uSelectBtn.style, {
            backgroundColor: "#2e2742", color: "#f5f5f5", border: "1px solid #3d3554",
            borderRadius: "6px", padding: "6px 10px", fontSize: "11px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px"
        });
        
        const uSelectDropdown = document.createElement("div");
        Object.assign(uSelectDropdown.style, {
            position: "absolute", top: "100%", right: "0", marginTop: "4px",
            backgroundColor: "#1a1625", border: "1px solid #3d3554", borderRadius: "6px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)", display: "none",
            flexDirection: "column", overflow: "hidden", minWidth: "100px"
        });
        
        const updateULTRABcLabel = () => {
            let activeOpt = ULTRABC_OPTIONS.find(o => o.url === uConfig) || ULTRABC_OPTIONS[0];
            let rawText = activeOpt.label;
            uSelectBtn.innerHTML = `<span>${rawText}</span> <span style="font-size:9px; color:#a59fb5;">▼</span>`;
        };
        updateULTRABcLabel();
        
        uSelectBtn.onclick = (e) => {
            e.stopPropagation();
            uSelectDropdown.style.display = uSelectDropdown.style.display === "none" ? "flex" : "none";
        };
        
        ULTRABC_OPTIONS.forEach(opt => {
            let item = document.createElement("div");
            item.innerHTML = opt.label;
            Object.assign(item.style, {
                padding: "8px 12px", fontSize: "11px", color: "#f5f5f5", cursor: "pointer",
                backgroundColor: uConfig === opt.url ? "#352d4d" : "transparent",
                fontWeight: uConfig === opt.url ? "bold" : "normal",
                whiteSpace: "nowrap"
            });
            item.onmouseenter = () => item.style.backgroundColor = "#2e2742";
            item.onmouseleave = () => item.style.backgroundColor = uConfig === opt.url ? "#352d4d" : "transparent";
            item.onclick = (e) => {
                e.stopPropagation();
                userConfig["ULTRABc"] = opt.url;
                saveConfig();
                renderList();
            };
            uSelectDropdown.appendChild(item);
        });
        
        uSelectContainer.appendChild(uSelectBtn);
        uSelectContainer.appendChild(uSelectDropdown);
        
        document.addEventListener("click", (e) => {
            if (!uSelectContainer.contains(e.target) && uSelectDropdown.style.display !== "none") {
                uSelectDropdown.style.display = "none";
            }
        });

        const uChainBadge = document.createElement("div");
        Object.assign(uChainBadge.style, {
            position: "absolute", bottom: "0", right: "0", width: "24px", height: "24px",
            backgroundColor: "#2e2742", borderTopLeftRadius: "8px", borderBottomRightRadius: "10px",
            display: "flex", justifyContent: "center", alignItems: "center",
            fontSize: "10px", color: "#a59fb5", cursor: "pointer", transition: "background-color 0.2s ease, color 0.2s"
        });
        uChainBadge.innerText = "🔗";
        uChainBadge.title = "Open Repository";
        uChainBadge.onmouseenter = () => { uChainBadge.style.backgroundColor = "#3d3554"; uChainBadge.style.color = "#fff"; };
        uChainBadge.onmouseleave = () => { uChainBadge.style.backgroundColor = "#2e2742"; uChainBadge.style.color = "#a59fb5"; };
        uChainBadge.onclick = () => window.open("https://github.com/tetris245/ultrabc.github.io", "_blank");
        
        ultrabcDiv.appendChild(uIcon);
        ultrabcDiv.appendChild(uInfo);
        ultrabcDiv.appendChild(uSelectContainer);
        ultrabcDiv.appendChild(uChainBadge);
        modalBody.appendChild(ultrabcDiv);

        // --- Render scripts ---
        scriptsList.forEach((scriptName) => {
            const isEnabled = userConfig[scriptName] !== false;
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
                if (info.icon.startsWith("http")) {
                    sIcon.innerHTML = `<img src="${info.icon}" style="width: 100%; height: 100%; object-fit: contain;" />`;
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
                        <div style="margin-bottom:12px;"><b>Quality of Life (QoL)</b> features specifically designed to make chatting and interacting faster and easier:</div>
                        <ul style="margin:0; padding-left:24px; color:#e0e0e0;">
                            <li style="margin-bottom:8px;"><b>Tab Key</b>: Instantly auto-completes the targeted character's name when typing a whisper.</li>
                            <li style="margin-bottom:8px;"><b>Alt + 1~0</b>: Quickly whisper a character based on their position in the room (e.g. Alt+1 for the first person).</li>
                            <li style="margin-bottom:8px;"><b>Alt + C / Alt + V / Alt + B</b>: Pet the Ear / Tail / Wings of your currently targeted character <i>(Requires BCAR+ to be active)</i>.</li>
                            <li style="margin-bottom:4px;"><b>Ctrl + Space</b>: Force scroll the chatbox to the very bottom.</li>
                        </ul>
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

    if (window.bcLocalScripts) {
        scriptsList = window.bcLocalScripts.filter(
            (f) => !f.toLowerCase().includes("debug") && f !== "addon-manager.js" && f.endsWith(".js")
        );
        injectTargetScripts();
        return;
    }

    fetch(REPO_API_URL)
        .then((response) => response.json())
        .then((data) => {
            let scriptsDir = null;
            if (data && data.files) {
                scriptsDir = data.files.find(
                    (f) => f.type === "directory" && f.name === "Scripts",
                );
            }

            if (!scriptsDir || !scriptsDir.files) {
                console.error("BC Desktop: Could not find Scripts directory.");
                return;
            }

            scriptsList = scriptsDir.files
                .filter(
                    (f) =>
                        f.type === "file" &&
                        f.name.endsWith(".js") &&
                        !f.name.toLowerCase().includes("debug") &&
                        f.name !== "addon-manager.js",
                )
                .map((f) => f.name);

            // Pastikan echo-activity.js selalu ada di urutan pertama, walau jsDelivr belum index
            if (!scriptsList.includes("echo-activity.js")) {
                scriptsList.unshift("echo-activity.js");
            }

            function injectTargetScripts() {
                let target = document.head || document.documentElement;
                if (!target) {
                    setTimeout(injectTargetScripts, 10);
                    return;
                }

                if (userConfig["ULTRABc"]) {
                    let uScript = document.createElement("script");
                    uScript.src = userConfig["ULTRABc"] + "?v=" + Date.now();
                    uScript.async = false;
                    target.appendChild(uScript);
                    console.log("BC Desktop: Injected ULTRABc");
                }

                scriptsList.forEach((scriptName) => {
                    const isEnabled = userConfig[scriptName] !== false;

                    if (!isEnabled) {
                        scriptStatuses[scriptName] = "disabled";
                        return;
                    }

                    scriptStatuses[scriptName] = "loading";

                    let script = document.createElement("script");
                    script.src =
                        SCRIPT_BASE_URL + scriptName + "?v=" + Date.now();
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
            }

            injectTargetScripts();
        })
        .catch((err) => {
            console.error(
                "BC Desktop: Failed to fetch remote script list.",
                err,
            );
            modalBody.innerHTML = `<div style="text-align: center; color: #f44336;">Failed to fetch script list from jsDelivr.</div>`;
        });
})();

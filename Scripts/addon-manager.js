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

    let REPO_API_URL =
        "https://data.jsdelivr.com/v1/package/gh/Izumii99/BC-Desktop@main";
    let SCRIPT_BASE_URL =
        "https://cdn.jsdelivr.net/gh/Izumii99/BC-Desktop@main/Scripts/";
    const STORAGE_KEY = "BCDesktop_Addons_Config";

    if (window.bcLocalScripts) {
        SCRIPT_BASE_URL = "http://bc-desktop.local/";
        console.log("BC Desktop: Local tester mode detected, pulling scripts from " + SCRIPT_BASE_URL);
    }

    const ULTRABC_OPTIONS = [
        { label: "❌ Off", url: "" },
        { label: "🇬🇧 English", url: "https://tetris245.github.io/ultrabc.github.io/ULTRABcloader.user.js" },
        { label: "🇨🇳 Chinese", url: "https://tetris245.github.io/ultrabc.github.io/ULTRABcloader-ch.user.js" },
        { label: "🇪🇸 Spanish", url: "https://tetris245.github.io/ultrabc.github.io/ULTRABcloader-es.user.js" }
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
    floatingBtn.innerHTML = "🧩";
    Object.assign(floatingBtn.style, {
        position: "fixed",
        top: "10px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "50px",
        height: "50px",
        backgroundColor: "#4c3a70",
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
    });

    floatingBtn.onmouseenter = () => {
        floatingBtn.style.backgroundColor = "#6a5299";
        floatingBtn.style.transform = "translateX(-50%) scale(1.1)";
    };
    floatingBtn.onmouseleave = () => {
        floatingBtn.style.backgroundColor = "#4c3a70";
        floatingBtn.style.transform = "translateX(-50%) scale(1)";
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
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        zIndex: "1000000",
        display: "none",
        justifyContent: "center",
        alignItems: "center",
    });

    const modalContent = document.createElement("div");
    Object.assign(modalContent.style, {
        backgroundColor: "#1e1e24",
        width: "400px",
        maxWidth: "90%",
        maxHeight: "80%",
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid #3d3159",
        color: "#e0e0e0",
        fontFamily: "Arial, sans-serif",
    });

    const modalHeader = document.createElement("div");
    Object.assign(modalHeader.style, {
        backgroundColor: "#2a223c",
        padding: "15px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #3d3159",
        fontWeight: "bold",
        fontSize: "18px",
    });
    modalHeader.innerHTML = `<span>🧩 BC Desktop Addons</span>`;

    const closeBtn = document.createElement("span");
    closeBtn.innerHTML = "✖";
    Object.assign(closeBtn.style, {
        cursor: "pointer",
        color: "#a0a0a0",
        fontSize: "16px",
    });
    closeBtn.onmouseenter = () => (closeBtn.style.color = "white");
    closeBtn.onmouseleave = () => (closeBtn.style.color = "#a0a0a0");
    closeBtn.onclick = toggleModal;
    modalHeader.appendChild(closeBtn);

    const modalBody = document.createElement("div");
    Object.assign(modalBody.style, {
        padding: "15px 20px",
        overflowY: "auto",
        flexGrow: "1",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    });
    modalBody.innerHTML = `<div style="text-align: center; color: #888;">Fetching scripts...</div>`;

    const modalFooter = document.createElement("div");
    Object.assign(modalFooter.style, {
        backgroundColor: "#2a223c",
        padding: "12px 20px",
        borderTop: "1px solid #3d3159",
        textAlign: "center",
        fontSize: "12px",
        color: "#aaa",
    });
    modalFooter.innerText =
        "Changes will take effect on the next game refresh (F5).";

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
        if (isModalOpen) renderList(); // Re-render to update statuses
    }

    function renderList() {
        modalBody.innerHTML = "";

        if (scriptsList.length === 0) {
            modalBody.innerHTML = `<div style="text-align: center; color: #888;">No scripts found or still loading...</div>`;
            return;
        }

        // Render ULTRABc Select Dropdown
        const ultrabcDiv = document.createElement("div");
        Object.assign(ultrabcDiv.style, {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#262035",
            padding: "12px 15px",
            borderRadius: "8px",
            border: "1px solid #3d3159",
            marginBottom: "10px"
        });
        
        const uInfoDiv = document.createElement("div");
        const uTitle = document.createElement("div");
        uTitle.innerText = "ULTRABc";
        Object.assign(uTitle.style, { fontWeight: "bold", fontSize: "14px", marginBottom: "4px" });
        
        const uStatus = document.createElement("div");
        uStatus.style.fontSize = "11px";
        let uConfig = userConfig["ULTRABc"];
        if (uConfig) {
            uStatus.innerText = "🟢 Enabled";
            uStatus.style.color = "#4caf50";
        } else {
            uStatus.innerText = "⚪ Disabled";
            uStatus.style.color = "#9e9e9e";
        }
        uInfoDiv.appendChild(uTitle);
        uInfoDiv.appendChild(uStatus);
        
        const uSelect = document.createElement("select");
        Object.assign(uSelect.style, {
            backgroundColor: "#4c3a70", color: "white", border: "1px solid #3d3159", borderRadius: "4px", padding: "4px"
        });
        
        ULTRABC_OPTIONS.forEach(opt => {
            let option = document.createElement("option");
            option.value = opt.url;
            option.innerText = opt.label;
            if (uConfig === opt.url) option.selected = true;
            uSelect.appendChild(option);
        });
        
        uSelect.onchange = (e) => {
            userConfig["ULTRABc"] = e.target.value;
            saveConfig();
            renderList();
        };
        
        ultrabcDiv.appendChild(uInfoDiv);
        ultrabcDiv.appendChild(uSelect);
        modalBody.appendChild(ultrabcDiv);

        scriptsList.forEach((scriptName) => {
            const isEnabled = userConfig[scriptName] !== false;
            const status =
                scriptStatuses[scriptName] ||
                (isEnabled ? "loading" : "disabled");

            const itemDiv = document.createElement("div");
            Object.assign(itemDiv.style, {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#262035",
                padding: "12px 15px",
                borderRadius: "8px",
                border: "1px solid #3d3159",
            });

            const infoDiv = document.createElement("div");

            const titleSpan = document.createElement("div");
            titleSpan.innerText = scriptName.replace(".js", "");
            Object.assign(titleSpan.style, {
                fontWeight: "bold",
                fontSize: "14px",
                marginBottom: "4px",
            });

            const statusSpan = document.createElement("div");
            statusSpan.style.fontSize = "11px";
            if (status === "loaded") {
                statusSpan.innerText = "🟢 Loaded successfully";
                statusSpan.style.color = "#4caf50";
            } else if (status === "failed") {
                statusSpan.innerText = "🔴 Failed to load";
                statusSpan.style.color = "#f44336";
            } else if (status === "disabled") {
                statusSpan.innerText = "⚪ Disabled";
                statusSpan.style.color = "#9e9e9e";
            } else {
                statusSpan.innerText = "🟡 Loading...";
                statusSpan.style.color = "#ffeb3b";
            }

            infoDiv.appendChild(titleSpan);
            infoDiv.appendChild(statusSpan);

            const toggleWrapper = document.createElement("div");
            Object.assign(toggleWrapper.style, {
                width: "44px",
                height: "24px",
                backgroundColor: isEnabled ? "#4caf50" : "#555",
                borderRadius: "12px",
                position: "relative",
                cursor: "pointer",
                transition: "background-color 0.2s",
            });

            const toggleCircle = document.createElement("div");
            Object.assign(toggleCircle.style, {
                width: "18px",
                height: "18px",
                backgroundColor: "white",
                borderRadius: "50%",
                position: "absolute",
                top: "3px",
                left: isEnabled ? "23px" : "3px",
                transition: "left 0.2s",
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
            });

            toggleWrapper.onclick = () => {
                const newState = !isEnabled;
                userConfig[scriptName] = newState;
                saveConfig();
                renderList(); // Re-render to update toggle visual immediately
            };

            toggleWrapper.appendChild(toggleCircle);

            itemDiv.appendChild(infoDiv);
            itemDiv.appendChild(toggleWrapper);
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

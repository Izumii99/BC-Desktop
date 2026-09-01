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

    const REPO_API_URL = "https://data.jsdelivr.com/v1/package/gh/Izumii99/BC-Desktop@main";
    const SCRIPT_BASE_URL = "https://cdn.jsdelivr.net/gh/Izumii99/BC-Desktop@main/Scripts/";
    const STORAGE_KEY = "BCDesktop_Addons_Config";

    // Mod Manager UI State
    let isModalOpen = false;
    let scriptsList = []; // Array of string filenames
    let scriptStatuses = {}; // { "filename.js": "loading" | "loaded" | "failed" | "disabled" }
    
    // Load config from localStorage (defaults to empty object, meaning everything is ON by default)
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

    // --- UI Creation ---

    // 1. Floating Button
    const floatingBtn = document.createElement("div");
    floatingBtn.innerHTML = "🧩";
    Object.assign(floatingBtn.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "50px",
        height: "50px",
        backgroundColor: "#4c3a70", // Neko dark purple
        color: "white",
        borderRadius: "50%",
        display: "none", // Hidden initially
        justifyContent: "center",
        alignItems: "center",
        fontSize: "24px",
        cursor: "pointer",
        boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
        zIndex: "999999",
        transition: "transform 0.2s, background-color 0.2s",
        userSelect: "none"
    });
    
    floatingBtn.onmouseenter = () => { floatingBtn.style.backgroundColor = "#6a5299"; floatingBtn.style.transform = "scale(1.1)"; };
    floatingBtn.onmouseleave = () => { floatingBtn.style.backgroundColor = "#4c3a70"; floatingBtn.style.transform = "scale(1)"; };
    floatingBtn.onclick = toggleModal;
    document.body.appendChild(floatingBtn);

    // 2. Modal Overlay
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
        alignItems: "center"
    });

    const modalContent = document.createElement("div");
    Object.assign(modalContent.style, {
        backgroundColor: "#1e1e24", // Dark background
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
        fontFamily: "Arial, sans-serif"
    });

    // Modal Header
    const modalHeader = document.createElement("div");
    Object.assign(modalHeader.style, {
        backgroundColor: "#2a223c",
        padding: "15px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #3d3159",
        fontWeight: "bold",
        fontSize: "18px"
    });
    modalHeader.innerHTML = `<span>🧩 BC Desktop Addons</span>`;
    
    const closeBtn = document.createElement("span");
    closeBtn.innerHTML = "✖";
    Object.assign(closeBtn.style, { cursor: "pointer", color: "#a0a0a0", fontSize: "16px" });
    closeBtn.onmouseenter = () => closeBtn.style.color = "white";
    closeBtn.onmouseleave = () => closeBtn.style.color = "#a0a0a0";
    closeBtn.onclick = toggleModal;
    modalHeader.appendChild(closeBtn);
    
    // Modal Body (List of addons)
    const modalBody = document.createElement("div");
    Object.assign(modalBody.style, {
        padding: "15px 20px",
        overflowY: "auto",
        flexGrow: "1",
        display: "flex",
        flexDirection: "column",
        gap: "10px"
    });
    modalBody.innerHTML = `<div style="text-align: center; color: #888;">Fetching scripts...</div>`;

    // Modal Footer
    const modalFooter = document.createElement("div");
    Object.assign(modalFooter.style, {
        backgroundColor: "#2a223c",
        padding: "12px 20px",
        borderTop: "1px solid #3d3159",
        textAlign: "center",
        fontSize: "12px",
        color: "#aaa"
    });
    modalFooter.innerText = "Changes will take effect on the next game refresh (F5).";

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Clicking outside modal closes it
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

        scriptsList.forEach(scriptName => {
            const isEnabled = userConfig[scriptName] !== false; // Default to true
            const status = scriptStatuses[scriptName] || (isEnabled ? "loading" : "disabled");

            const itemDiv = document.createElement("div");
            Object.assign(itemDiv.style, {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#262035",
                padding: "12px 15px",
                borderRadius: "8px",
                border: "1px solid #3d3159"
            });

            // Name and Status
            const infoDiv = document.createElement("div");
            
            const titleSpan = document.createElement("div");
            titleSpan.innerText = scriptName.replace('.js', '');
            Object.assign(titleSpan.style, { fontWeight: "bold", fontSize: "14px", marginBottom: "4px" });
            
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

            // Toggle Button
            const toggleWrapper = document.createElement("div");
            Object.assign(toggleWrapper.style, {
                width: "44px",
                height: "24px",
                backgroundColor: isEnabled ? "#4caf50" : "#555",
                borderRadius: "12px",
                position: "relative",
                cursor: "pointer",
                transition: "background-color 0.2s"
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
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
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


    // --- Visibility Checker ---
    setInterval(() => {
        try {
            // Only show floating button if in Login or Profile screen
            if (window.CurrentScreen === "Login" || window.CurrentScreen === "Information") {
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


    // --- Core Logic: Fetch & Inject ---

    fetch(REPO_API_URL)
        .then((response) => response.json())
        .then((data) => {
            let scriptsDir = null;
            if (data && data.files) {
                scriptsDir = data.files.find((f) => f.type === "directory" && f.name === "Scripts");
            }

            if (!scriptsDir || !scriptsDir.files) {
                console.error("BC Desktop: Could not find Scripts directory.");
                return;
            }

            scriptsList = scriptsDir.files
                .filter((f) => f.type === "file" && f.name.endsWith(".js") && !f.name.toLowerCase().includes("debug") && f.name !== "addon-manager.js")
                .map((f) => f.name);

            // Update UI list since we fetched the files
            if (isModalOpen) renderList();

            // Inject the enabled scripts
            function injectTargetScripts() {
                let target = document.head || document.documentElement;
                if (!target) {
                    setTimeout(injectTargetScripts, 10);
                    return;
                }

                scriptsList.forEach((scriptName) => {
                    const isEnabled = userConfig[scriptName] !== false; // Default true
                    
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
                        console.log(`BC Desktop: Successfully loaded ${scriptName}`);
                        if (isModalOpen) renderList();
                    };
                    
                    script.onerror = () => {
                        scriptStatuses[scriptName] = "failed";
                        console.error(`BC Desktop: Failed to load ${scriptName}`);
                        if (isModalOpen) renderList();
                    };

                    target.appendChild(script);
                });
            }

            injectTargetScripts();
        })
        .catch((err) => {
            console.error("BC Desktop: Failed to fetch remote script list.", err);
            modalBody.innerHTML = `<div style="text-align: center; color: #f44336;">Failed to fetch script list from jsDelivr.</div>`;
        });
})();

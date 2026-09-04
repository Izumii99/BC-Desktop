// ==UserScript==
// @name         BC Desktop Remote Loader (DEBUG)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Fetches the latest scripts from GitHub and injects them automatically BYPASSING JSDELIVR CACHE
// @author       Izumii99
// @match        https://*.bondageprojects.elementfx.com/*
// @match        https://*.bondage-europe.com/*
// @match        https://*.bondageprojects.com/*
// @match        https://*.bondage-asia.com/*
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    if (window._bcRemoteLoaderInjected) return;
    window._bcRemoteLoaderInjected = true;

    // Use raw.githubusercontent.com to always fetch the freshest debug manager
    const managerURL = "https://raw.githubusercontent.com/Izumii99/BC-Desktop/main/Scripts/addon-manager.js";

    function injectManager() {
        let target = document.head || document.documentElement;
        if (!target) {
            setTimeout(injectManager, 10);
            return;
        }

        fetch(managerURL + "?v=" + Date.now())
            .then(r => r.text())
            .then(code => {
                let script = document.createElement("script");
                script.textContent = code;
                target.appendChild(script);
                console.log("BC Desktop: Loaded Addon Manager (DEBUG) remotely");
            })
            .catch(e => console.error("BC Desktop DEBUG: Failed to load manager", e));
    }

    injectManager();
})();

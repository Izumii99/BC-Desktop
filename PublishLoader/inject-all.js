// ==UserScript==
// @name         BC Desktop Remote Loader
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Fetches the latest scripts from GitHub and injects them automatically
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

    const rawURL = "https://raw.githubusercontent.com/Izumii99/BC-Desktop/main/Scripts/addon-manager.js";
    const cdnURL = "https://cdn.jsdelivr.net/gh/Izumii99/BC-Desktop@main/Scripts/addon-manager.js";

    function injectManager() {
        let target = document.head || document.documentElement;
        if (!target) {
            setTimeout(injectManager, 10);
            return;
        }

        fetch(rawURL + "?v=" + Date.now(), { cache: "no-store" })
            .then(res => {
                if (!res.ok) throw new Error("HTTP " + res.status);
                return res.text();
            })
            .then(code => {
                let script = document.createElement("script");
                script.textContent = code;
                target.appendChild(script);
                console.log("BC Desktop: Loaded Addon Manager directly from GitHub");
            })
            .catch(() => {
                let script = document.createElement("script");
                script.src = cdnURL + "?v=" + Date.now();
                script.async = false;
                script.onerror = () => {
                    console.warn("BC Desktop: Remote Addon Manager could not be reached. Continuing in standalone mode.");
                };
                target.appendChild(script);
                console.log("BC Desktop: Loaded Addon Manager remotely from CDN");
            });
    }

    injectManager();
})();

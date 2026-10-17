// ==UserScript==
// @name         BC Desktop Remote Loader
// @namespace    https://github.com/Izumii99/BC-Desktop
// @version      1.0
// @description  Fetches and loads BC Desktop Addon Manager
// @author       Izumii99
// @match        https://*.bondageprojects.elementfx.com/*
// @match        https://*.bondage-europe.com/*
// @match        https://*.bondageprojects.com/*
// @match        https://*.bondage-asia.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    "use strict";

    if (window._bcRemoteLoaderInjected) return;
    window._bcRemoteLoaderInjected = true;

    const pagesURL = "https://izumii99.github.io/BC-Desktop/Scripts/addon-manager.js";
    const rawURL = "https://raw.githubusercontent.com/Izumii99/BC-Desktop/main/Scripts/addon-manager.js";
    const cdnURL = "https://cdn.jsdelivr.net/gh/Izumii99/BC-Desktop@main/Scripts/addon-manager.js";

    function injectScriptText(code) {
        let target = document.head || document.documentElement;
        let script = document.createElement("script");
        script.textContent = code;
        target.appendChild(script);
        console.log("BC Desktop: Loaded Addon Manager from GitHub Pages / Raw");
    }

    function injectScriptSrc(src) {
        let target = document.head || document.documentElement;
        let script = document.createElement("script");
        script.src = src + "?v=" + Date.now();
        script.async = false;
        script.onerror = () => {
            console.warn("BC Desktop: Remote Addon Manager could not be reached. Continuing in standalone mode.");
        };
        target.appendChild(script);
        console.log("BC Desktop: Loaded Addon Manager remotely from CDN fallback");
    }

    function injectManager() {
        let target = document.head || document.documentElement;
        if (!target) {
            setTimeout(injectManager, 10);
            return;
        }

        // 1. Try GitHub Pages first (fast, proper MIME, live updates)
        fetch(pagesURL + "?v=" + Date.now(), { cache: "no-store" })
            .then(res => {
                if (!res.ok) throw new Error("Pages HTTP " + res.status);
                return res.text();
            })
            .then(code => injectScriptText(code))
            .catch(() => {
                // 2. Try GitHub Raw fallback (direct from repository)
                fetch(rawURL + "?v=" + Date.now(), { cache: "no-store" })
                    .then(res => {
                        if (!res.ok) throw new Error("Raw HTTP " + res.status);
                        return res.text();
                    })
                    .then(code => injectScriptText(code))
                    .catch(() => {
                        // 3. Fallback to jsDelivr CDN
                        injectScriptSrc(cdnURL);
                    });
            });
    }

    injectManager();
})();

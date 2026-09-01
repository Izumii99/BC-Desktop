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

    const managerURL = "https://cdn.jsdelivr.net/gh/Izumii99/BC-Desktop@main/Scripts/addon-manager.js";

    function injectManager() {
        let target = document.head || document.documentElement;
        if (!target) {
            setTimeout(injectManager, 10);
            return;
        }

        let script = document.createElement("script");
        script.src = managerURL + "?v=" + Date.now();
        script.async = false;
        target.appendChild(script);
        console.log("BC Desktop: Loaded Addon Manager remotely");
    }

    injectManager();
})();

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

    console.log("BC Desktop: Injecting remote scripts...");

    const repoInfoURL = "https://data.jsdelivr.com/v1/package/gh/Izumii99/BC-Desktop@main";
    const baseURL = "https://cdn.jsdelivr.net/gh/Izumii99/BC-Desktop@main/Scripts/";

    fetch(repoInfoURL)
        .then((response) => response.json())
        .then((data) => {
            let scriptsDir = null;
            if (data && data.files) {
                scriptsDir = data.files.find((f) => f.type === "directory" && f.name === "Scripts");
            }

            if (!scriptsDir || !scriptsDir.files) {
                console.error("BC Desktop: Could not find Scripts directory in jsDelivr response.");
                return;
            }

            const scripts = scriptsDir.files
                .filter((f) => f.type === "file" && f.name.endsWith(".js") && !f.name.toLowerCase().includes("debug"))
                .map((f) => f.name);

            function injectScripts() {
                let target = document.head || document.documentElement;
                if (!target) {
                    setTimeout(injectScripts, 10);
                    return;
                }

                scripts.forEach((scriptName) => {
                    let script = document.createElement("script");
                    script.src = baseURL + scriptName + "?v=" + Date.now();
                    script.async = false;
                    target.appendChild(script);
                    console.log(`BC Desktop: Loaded ${scriptName} remotely (Wildcard)`);
                });
            }

            injectScripts();
        })
        .catch((err) => {
            console.error("BC Desktop: Failed to fetch remote script list.", err);
        });
})();

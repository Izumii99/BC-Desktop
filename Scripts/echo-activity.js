(function () {
    "use strict";
    if (window !== window.top) return;
    if (window._echoActivityLoaded) return;
    window._echoActivityLoaded = true;

    const LOADER_URL = "https://izumii99.github.io/echo-activity-ext/bc-activity.user.js";

    function inject() {
        const s = document.createElement("script");
        s.setAttribute("type", "text/javascript");
        s.setAttribute("src", LOADER_URL + "?v=" + Date.now());
        s.onload = () => { s.remove(); console.log("[EchoActivity] Loaded successfully."); };
        s.onerror = () => { s.remove(); console.error("[EchoActivity] Failed to load from:", LOADER_URL); };
        (document.head || document.documentElement).appendChild(s);
    }

    function mount() {
        if (!document.body) { setTimeout(mount, 200); return; }
        inject();
    }
    mount();
})();

(function () {
    'use strict';
    if (window !== window.top) return;
    function inject() {
        if (window.FUSAM === undefined) {
            let n = document.createElement("script");
            n.type = "module";
            n.setAttribute("src", "https://sidiousious.gitlab.io/bc-addon-loader/fusam.js?_=" + Date.now());
            document.head.appendChild(n);
        }
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inject);
    } else {
        inject();
    }
})();

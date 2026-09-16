

(function () {
    "use strict";

    if (window !== window.top) return;
    if (window._bcScreenshotCleanerLoaded) return;
    window._bcScreenshotCleanerLoaded = true;

    const PASSTHROUGH = ["DrawCharacter", "ChatRoomDrawBackground"];

    const UI_DRAWS = [
        "DrawButton",
        "DrawButtonHover",
        "DrawCheckbox",
        "DrawBackNextButton",
        "DrawText",
        "DrawTextFit",
        "DrawTextWrap",
        "DrawEmptyRect",
        "DrawCircle",
        "DrawProgressBar",
    ];

    const IMAGE_DRAWS = [
        "DrawImage",
        "DrawImageEx",
        "DrawImageResize",
        "DrawImageZoomCanvas",
    ];

    let passthroughDepth = 0;

    function suppressed() {
        return window.CommonPhotoMode === true && passthroughDepth === 0;
    }

    function isBackground(source) {
        return typeof source === "string" && source.indexOf("Backgrounds/") === 0;
    }

    function install() {
        const sdk =
            typeof window.bcModSdk !== "undefined"
                ? window.bcModSdk.registerMod(
                      {
                          name: "Screenshot Cleaner",
                          fullName: "BC Desktop Screenshot Cleaner",
                          version: "2.0.0",
                          repository:
                              "https://github.com/Izumii99/BC-Desktop/blob/main/Scripts/screenshot-cleaner.js",
                      },
                      { allowReplace: false },
                  )
                : null;

        function hook(name, handler) {
            if (typeof window[name] !== "function") return;
            if (sdk) {
                sdk.hookFunction(name, 11, handler);
                return;
            }
            const orig = window[name];
            window[name] = function () {
                const args = Array.prototype.slice.call(arguments);
                return handler(args, (a) => orig.apply(this, a));
            };
        }

        PASSTHROUGH.forEach((name) =>
            hook(name, (args, next) => {
                passthroughDepth++;
                try {
                    return next(args);
                } finally {
                    passthroughDepth--;
                }
            }),
        );

        UI_DRAWS.forEach((name) =>
            hook(name, (args, next) => {
                if (suppressed()) return;
                return next(args);
            }),
        );

        IMAGE_DRAWS.forEach((name) =>
            hook(name, (args, next) => {

                if (suppressed() && !isBackground(args[0])) return true;
                return next(args);
            }),
        );

        hook("DrawRect", (args, next) => {
            const isFullCanvas =
                args[0] <= 0 && args[1] <= 0 && args[2] >= 2000 && args[3] >= 1000;
            if (suppressed() && !isFullCanvas) return;
            return next(args);
        });

        console.log("BC Desktop: Screenshot Cleaner armed" + (sdk ? " via bcModSdk." : "."));
    }

    const waitForGame = setInterval(() => {
        if (
            typeof window.DrawButton === "function" &&
            typeof window.DrawCharacter === "function" &&
            typeof window.CommonTakePhoto === "function"
        ) {
            clearInterval(waitForGame);
            install();
        }
    }, 500);
})();

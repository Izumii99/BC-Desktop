// ==UserScript==
// @name         Screenshot Cleaner
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Keeps in-game photos limited to the characters, their arousal meters and the room, dropping every button and addon overlay from the captured frame.
// @author       Izumii99
// @match        https://*.bondageprojects.elementfx.com/*
// @match        https://*.bondage-europe.com/*
// @match        https://*.bondageprojects.com/*
// @match        https://*.bondage-asia.com/*
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    if (window !== window.top) return;
    if (window._bcScreenshotCleanerLoaded) return;
    window._bcScreenshotCleanerLoaded = true;

    // CommonTakePhoto captures MainCanvas pixels right after a single
    // DrawProcess(0), so anything painted during that redraw ends up in the
    // photo. Addons draw their buttons from DrawProcess hooks, which is why
    // they show up. Native code guards some of its own UI with
    // !CommonPhotoMode; third-party addons do not.

    // Native functions whose output belongs in the photo. DrawCharacter also
    // paints the arousal meter and the name, so both come along for free.
    const PASSTHROUGH = ["DrawCharacter", "ChatRoomDrawBackground"];

    // Text and shape primitives used for UI chrome.
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

    // Image primitives, kept apart because they report whether the bitmap was
    // ready and callers branch on that.
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

    // DrawProcess paints the screen background across the whole canvas before
    // anything else, and that is the layer the photo sits on.
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

        // Highest priority keeps the gate outside other addons' hooks, so their
        // draws are dropped too instead of slipping past underneath.
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
                // Report success so callers do not fall back to a black fill
                if (suppressed() && !isBackground(args[0])) return true;
                return next(args);
            }),
        );

        // ChatRoomRun and DrawProcess clear the frame with a canvas-sized rect.
        // Dropping that would leave the previous frame's UI showing through.
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

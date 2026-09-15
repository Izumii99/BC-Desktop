(function () {
    "use strict";
    if (window !== window.top) return;
    if (window._bcdWceImAlign) return;
    window._bcdWceImAlign = true;

    // Canvas rect WCE uses for its instant messenger button
    const WCE_IM = { Left: 70, Top: 905, Width: 60, Height: 60 };
    const WCE_IM_ICON = "Icons/Small/Chat.png";

    // Shared bottom-left stack, both entries kept at WCE's native button size.
    // Canvas space is deliberate: it keeps the two scaling together instead of
    // drifting apart, since one is painted on the canvas and one is a DOM node.
    const IM_SLOT = { Left: 20, Top: 920, Width: 60, Height: 60 };
    const ANIM_SLOT = { Left: 20, Top: 848, Width: 60, Height: 60 };

    const ANIM_BTN_ID = "bcd-qol-anim-btn";

    let lastImDraw = 0;
    let animBtnDefaults = null;

    // WCE runs on bondage-club-mod-sdk, so hooking through the same SDK keeps it out
    // of WCE's "modified before WCE" integrity report and composes with its own hooks.
    let initInterval = setInterval(() => {
        if (
            typeof window.bcModSdk === "undefined" ||
            typeof window.DrawButton !== "function" ||
            typeof window.MouseIn !== "function"
        )
            return;

        clearInterval(initInterval);
        installHooks();
        setInterval(syncAnimButton, 200);
        window.addEventListener("resize", syncAnimButton);
    }, 500);

    function isImRect(Left, Top, Width, Height) {
        return (
            Left === WCE_IM.Left &&
            Top === WCE_IM.Top &&
            Width === WCE_IM.Width &&
            Height === WCE_IM.Height
        );
    }

    function installHooks() {
        const sdk = window.bcModSdk.registerMod(
            {
                name: "WCE IM Alignment",
                fullName: "WCE Instant Messenger Alignment",
                version: "1.0.0",
                repository:
                    "https://github.com/Izumii99/BC-Desktop/blob/main/Scripts/wce-im-align.js",
            },
            { allowReplace: false },
        );

        // Low priority keeps this innermost, so the rewritten rect is what the game
        // actually draws and hit-tests even when other addons hook the same functions.
        sdk.hookFunction("DrawButton", 1, (args, next) => {
            if (isImRect(args[0], args[1], args[2], args[3]) && args[6] === WCE_IM_ICON) {
                lastImDraw = Date.now();
                args[0] = IM_SLOT.Left;
                args[1] = IM_SLOT.Top;
                args[2] = IM_SLOT.Width;
                args[3] = IM_SLOT.Height;
            }
            return next(args);
        });

        // WCE tests the original rect on click, so the hit area has to follow the visual move
        sdk.hookFunction("MouseIn", 1, (args, next) => {
            if (isImRect(args[0], args[1], args[2], args[3])) {
                args[0] = IM_SLOT.Left;
                args[1] = IM_SLOT.Top;
                args[2] = IM_SLOT.Width;
                args[3] = IM_SLOT.Height;
            }
            return next(args);
        });
    }

    function syncAnimButton() {
        const btn = document.getElementById(ANIM_BTN_ID);
        if (!btn) return;

        if (animBtnDefaults === null) {
            animBtnDefaults = {
                left: btn.style.left,
                top: btn.style.top,
                bottom: btn.style.bottom,
                width: btn.style.width,
                height: btn.style.height,
            };
        }

        const canvas = document.getElementById("MainCanvas");
        // Leave the Chat QoL layout untouched while WCE is not painting the button
        if (!canvas || Date.now() - lastImDraw > 1000) {
            Object.assign(btn.style, animBtnDefaults);
            return;
        }

        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const scaleX = rect.width / 2000;
        const scaleY = rect.height / 1000;

        btn.style.left = rect.left + ANIM_SLOT.Left * scaleX + "px";
        btn.style.top = rect.top + ANIM_SLOT.Top * scaleY + "px";
        btn.style.bottom = "auto";
        btn.style.width = ANIM_SLOT.Width * scaleX + "px";
        btn.style.height = ANIM_SLOT.Height * scaleY + "px";
    }
})();

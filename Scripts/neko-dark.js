(function () {
    "use strict";
    if (window !== window.top) return;

    // -- Kawaii Midnight Purple Palette --------------------------------------
    const P = {
        base: "#1a1520",
        panel: "#1e1829",
        soft: "#271f38",
        ownMsg: "#241a36",
        border: "#3e3252",
        borderAcc: "#6b5090",
        text: "#d4c8e8",
        muted: "#7a6d94",
        icon: "#a898c0",
        emoteTxt: "#c0a8e8",
        whisperBg: "#271638",
        whisperBdr: "#9858cc",
        whisperTxt: "#e8c8ff",
        beepBg: "#131b2e",
        beepBdr: "#2e4a7a",
        beepTxt: "#7eb8f0",
    };

    function injectDarkTheme() {
        if (!document.head) return;

        const existing = document.getElementById("neko-enhancer-dark-theme");
        if (existing) existing.remove();

        const style = document.createElement("style");
        style.id = "neko-enhancer-dark-theme";
        style.textContent = `
            /* -- CSS Variables ----------------------------------------------- */
            body {
                --bcn-panel:  ${P.panel}  !important;
                --bcn-soft:   ${P.soft}   !important;
                --bcn-border: ${P.border} !important;
                --bcn-text:   ${P.text}   !important;
                --bcn-muted:  ${P.muted}  !important;
                --bcn-icon:   ${P.icon}   !important;
            }

            /* -- Chat Log Container ---------------------------------------- */
            html body #TextAreaChatLog {
                background: ${P.panel} !important;
                border: 1px solid ${P.border} !important;
                box-shadow: none !important;
            }

            /* -- All Chat Bubbles (default) ------------------------------- */
            html body #TextAreaChatLog .ChatMessage {
                background: ${P.soft} !important;
                border: 1px solid ${P.border} !important;
                color: ${P.text} !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.45) !important;
            }

            /* -- Own Chat Bubble -------------------------------------- */
            html body #TextAreaChatLog .bcn-own-message {
                background: ${P.ownMsg} !important;
                border-color: ${P.borderAcc} !important;
            }

            /* -- Whisper (current room) ----------------------------------- */
            html body #TextAreaChatLog .ChatMessageWhisper {
                background: ${P.whisperBg}  !important;
                border: 1px solid ${P.whisperBdr} !important;
                color: ${P.whisperTxt} !important;
            }

            /* -- Beep (from another room) -------------------------------- */
            html body #TextAreaChatLog .ChatMessageBeep {
                background: ${P.beepBg} !important;
                border: 1px solid ${P.beepBdr} !important;
                color: ${P.beepTxt} !important;
            }

            /* -- Chat Name ---------------------------------------------- */
            html body #TextAreaChatLog .ChatMessageName {
                text-shadow: none !important;
                -webkit-text-stroke: 0 !important;
            }

            /* -- Force text color in bubble (DO NOT override font-style) */
            html body #TextAreaChatLog .ChatMessage *:not(.ChatMessageName) {
                color: ${P.text} !important;
                text-shadow: 0 1px 3px rgba(0,0,0,0.6) !important;
            }
            html body #TextAreaChatLog .ChatMessageWhisper *:not(.ChatMessageName) { color: ${P.whisperTxt} !important; }
            html body #TextAreaChatLog .ChatMessageBeep *:not(.ChatMessageName) { color: ${P.beepTxt} !important; }

            /* -- Room header / sep header (class from debug inspector) ----- */
            html body .chat-room-sep-header,
            html body button.chat-room-sep-header {
                background: ${P.panel} !important;
                color: ${P.muted} !important;
                border: none !important;
                box-shadow: none !important;
            }

            /* -- Send button: .lk-crb-managed (class from debug inspector) -- */
            html body .lk-crb-managed {
                --lk-crb-current-bg: ${P.soft} !important;
                background: ${P.soft} !important;
                border: 1px solid ${P.border} !important;
                box-shadow: none !important;
            }
            html body .lk-crb-managed:hover {
                --lk-crb-current-bg: ${P.borderAcc} !important;
                background: ${P.borderAcc} !important;
            }

            /* -- Collapse button (down arrow) .chat-room-sep-collapse ------- */
            html body .chat-room-sep-collapse {
                background: ${P.panel} !important;
                color: ${P.muted} !important;
                border: none !important;
                box-shadow: none !important;
            }

            /* -- Reply button (message hover) ------------------------------- */
            html body .chat-room-sep-reply,
            html body button[class*="reply"],
            html body .bcx-msg-hover,
            html body .bcx-chat-reply {
                background: ${P.soft} !important;
                color: ${P.text} !important;
                border: 1px solid ${P.border} !important;
            }

            /* -- Reply / Message Popup Menu Box ------------------------------ */
            html body .chat-room-message-popup {
                background: ${P.panel} !important;
                border: 1px solid ${P.border} !important;
                color: ${P.text} !important;
                box-shadow: 0 4px 6px rgba(0,0,0,0.5) !important;
            }

            /* -- Reply Indicator (Above Chat Input) ------------------------ */
            html body button#chat-room-reply-indicator-text,
            html body button#chat-room-reply-indicator-close,
            html body div#chat-room-reply-indicator {
                background: ${P.panel} !important;
                color: ${P.text} !important;
                border: 2px solid ${P.borderAcc} !important;
            }

            /* -- Chat Input Bottom Container ------------------------------- */
            html body div#chat-room-bottom,
            html body div[id^="chat-room-bot"] {
                background: ${P.base} !important;
                border-color: ${P.borderAcc} !important;
            }

            /* -- Chat Input Buttons (Send, Collapse, Menubar) -------------- */
            html body #chat-room-buttons,
            html body #chat-room-buttons button,
            html body button#chat-room-buttons-collapse {
                background: ${P.panel} !important;
                color: ${P.text} !important;
                border: 2px solid ${P.borderAcc} !important;
            }

            /* -- Floating New Message Indicator & Toasts ------------------- */
            html body [id*="scroll-to-bottom"],
            html body [id*="chat-room-scroll"],
            html body [class*="new-message"] {
                background: ${P.panel} !important;
                color: ${P.text} !important;
                border: 1px solid ${P.borderAcc} !important;
                box-shadow: 0 4px 6px rgba(0,0,0,0.5) !important;
            }

            /* -- Activity/Emote: transparent like original addon ----------- */
            /* Background/border removed via JS inline style, CSS is just a dummy marker */

            /* -- Italic for emote/action messages ------------------------- */
            html body #TextAreaChatLog .nk-emote,
            html body #TextAreaChatLog .nk-emote .chat-room-message-content,
            html body #TextAreaChatLog .ChatMessageEmote .chat-room-message-content,
            html body #TextAreaChatLog .ChatMessageAction .chat-room-message-content {
                font-style: italic !important;
                color: ${P.emoteTxt} !important;
            }
            html body #TextAreaChatLog .nk-emote * {
                color: ${P.emoteTxt} !important;
                text-shadow: none !important;
            }

            /* -- Heart/paw badge: only show inside chatlog --------------- */
            html body .bcn-relation-badge {
                display: none !important;
            }
            html body #TextAreaChatLog .bcn-relation-badge {
                display: inline !important;
            }

            /* -- PawRain: clip overlay to chat area (right half of screen) ------------ */
            html body #bcn-soft-paws {
                left: 50% !important;
                width: 50% !important;
                overflow: hidden !important;
                pointer-events: none !important;
            }

            /* -- BCX Top Menu Buttons -------------------------------------- */
            html body .chat-room-top-menu-btn {
                background-color: ${P.panel} !important;
                border: 1px solid ${P.border} !important;
                color: ${P.text} !important;
            }
            html body .chat-room-top-menu-btn img,
            html body .chat-room-top-menu-btn svg {
                filter: invert(0.75) sepia(0.2) hue-rotate(240deg) !important;
            }

            /* -- Reset ALL floating inputs to readable text (white bg) ----- */
            /* This catches all base game and mod inputs without needing 1-by-1 IDs */
            html body textarea:not(#InputChat),
            html body input:not(#InputChat):not([type="radio"]):not([type="checkbox"]):not([type="color"]):not([type="range"]),
            html body select:not(#chat-garble):not(.wce-chat-room-select) {
                color: #333333 !important;
                background: rgba(255, 255, 255, 0.95) !important;
            }





            /* ----------------------------------------------------------------
               -- Special bubble types (tagged by MutationObserver) --------
               ---------------------------------------------------------------- */

            /* Now online (Soft Vibrant Blue) */
            html body #TextAreaChatLog .nk-online {
                background: #132032 !important;
                border: 1px solid #3b82f6 !important;
                color: #93c5fd !important;
                opacity: 0.95 !important;
                box-shadow: 0 0 5px rgba(59, 130, 246, 0.25) !important;
            }
            html body #TextAreaChatLog .nk-online * { color: #93c5fd !important; text-shadow: none !important; }

            /* Now offline (Soft Vibrant Rose) */
            html body #TextAreaChatLog .nk-offline {
                background: #2e101a !important;
                border: 1px solid #e11d48 !important;
                color: #fda4af !important;
                opacity: 0.95 !important;
                box-shadow: 0 0 5px rgba(225, 29, 72, 0.25) !important;
            }
            html body #TextAreaChatLog .nk-offline * { color: #fda4af !important; text-shadow: none !important; }

            /* Whisper (Soft Vibrant Fuchsia/Magenta) */
            html body #TextAreaChatLog .ChatMessageWhisper {
                background: #2d142c !important;
                border: 1px solid #d946ef !important;
                color: #f0abfc !important;
                opacity: 0.95 !important;
                box-shadow: 0 0 5px rgba(217, 70, 239, 0.25) !important;
            }
            html body #TextAreaChatLog .ChatMessageWhisper * { color: #f0abfc !important; text-shadow: none !important; }

            /* Voice (dark amber/gold) */
            html body #TextAreaChatLog .nk-voice {
                background: #221b0e !important;
                border: 1px solid #7a5c1a !important;
                color: #d4a84a !important;
                opacity: 0.88 !important;
            }
            html body #TextAreaChatLog .nk-voice * { color: #d4a84a !important; text-shadow: none !important; }

            /* Entered (dim periwinkle, italic, centered) */
            html body #TextAreaChatLog .nk-enter {
                background: #141828 !important;
                border: 1px solid #303870 !important;
                color: #8898d0 !important;
                font-style: italic !important;
                opacity: 0.82 !important;
                box-shadow: none !important;
                text-align: center !important;
            }
            html body #TextAreaChatLog .nk-enter * {
                color: #8898d0 !important;
                text-shadow: none !important;
            }

            /* Disconnected / left (dark rose) */
            html body #TextAreaChatLog .nk-disconnect {
                background: #1e1018 !important;
                border: 1px solid #502030 !important;
                color: #c07080 !important;
                font-style: italic !important;
                opacity: 0.8 !important;
                box-shadow: none !important;
                text-align: center !important;
            }
            html body #TextAreaChatLog .nk-disconnect * {
                color: #c07080 !important;
                text-shadow: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    injectDarkTheme();
    setInterval(() => {
        if (
            document.head &&
            !document.getElementById("neko-enhancer-dark-theme")
        )
            injectDarkTheme();
    }, 1000);

    // -- MutationObserver: tag bubbles based on text content -------------------

    const PATTERNS = [
        { cls: "nk-voice", re: /\[voice\]/i },
        { cls: "nk-online", re: /now online:/i },
        { cls: "nk-offline", re: /now offline:/i },
        {
            cls: "nk-disconnect",
            re: /(disconnected|has left|left the room|left)/i,
        },
        { cls: "nk-enter", re: /(entered|has entered|joined the room)/i },
    ];

    // Emote: text starting with * (fallback if class is missing)
    const EMOTE_RE = /^\s*\*[^*]+\*/;

    // Fix "*undefined" in whispers (addon fails to resolve Player.Name)
    function fixUndefinedName(el) {
        const name = (window.Player && window.Player.Name) || "";
        if (!name) return;
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
            if (node.nodeValue && node.nodeValue.includes("*undefined")) {
                node.nodeValue = node.nodeValue.replace(
                    /\*undefined/g,
                    `*${name}`,
                );
            }
        }
    }

    function tagMessage(el) {
        if (el._nkTagged) return;
        const text = el.textContent || "";
        if (!text.trim()) return;

        el._nkTagged = true;

        if (
            el.classList.contains("ChatMessageWhisper") &&
            text.includes("*undefined")
        ) {
            fixUndefinedName(el);
        }

        // Transparent: all BC action/emote types
        const isActivity =
            el.classList.contains("ChatMessageActivity") ||
            el.classList.contains("ChatMessageEmote") ||
            el.classList.contains("ChatMessageAction");
        const isEmote = !isActivity && EMOTE_RE.test(text);
        if (isActivity || isEmote) {
            el.classList.add("nk-emote");
            el.style.setProperty("background", "transparent", "important");
            el.style.setProperty("border", "none", "important");
            el.style.setProperty("box-shadow", "none", "important");
            return;
        }

        for (const { cls, re } of PATTERNS) {
            if (re.test(text)) {
                el.classList.add(cls);
                return;
            }
        }
    }

    function watchChat() {
        const log = document.getElementById("TextAreaChatLog");
        if (!log) return;
        log.querySelectorAll(".ChatMessage").forEach(tagMessage);
        const obs = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (
                        node.nodeType === 1 &&
                        node.classList.contains("ChatMessage")
                    )
                        tagMessage(node);
                }
            }
        });
        obs.observe(log, { childList: true });
    }

    const chatPoller = setInterval(() => {
        if (document.getElementById("TextAreaChatLog")) {
            clearInterval(chatPoller);
            watchChat();
        }
    }, 800);

    // -- Load Neko Enhancer Runtime -------------------------------------------
    const RUNTIME_URL =
        "https://cdn.jsdelivr.net/gh/QAQMOON/meow-@main/dist/bondage-club-neko.runtime.full.js?v=2.13.1";

    function requestText(url) {
        const nextUrl = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
        return fetch(nextUrl, { cache: "no-store" }).then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.text();
        });
    }

    function runRuntime(code) {
        if (!code || !code.trim()) return;

        // Replace hardcoded white rgba canvas with dark purple base
        code = code.replace(
            /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,/g,
            "rgba(30, 24, 41,",
        );

        // Replace hardcoded dark text with soothing lavender-white
        code = code.replace(/"#2f2f2f"/g, `"${P.text}"`);
        code = code.replace(/"#1a1a1a"/g, `"${P.text}"`);

        // Replace bright white/gray borders with muted purple
        code = code.replace(/"#e8e8e8"/g, `"${P.border}"`);
        code = code.replace(/"#dddddd"/g, `"${P.border}"`);
        code = code.replace(/"#cccccc"/g, `"${P.borderAcc}"`);

        // Dynamically replace addon's built-in theme definitions
        code = code.replace(/text:\s*"#[0-9a-fA-F]{6}"/gi, `text:"${P.text}"`);
        code = code.replace(/soft:\s*"#[0-9a-fA-F]{6}"/gi, `soft:"${P.soft}"`);
        code = code.replace(
            /panel:\s*"#[0-9a-fA-F]{6}"/gi,
            `panel:"${P.panel}"`,
        );

        // Patch send button blue color to purple palette
        code = code.replace(/"#00a8ff"/gi, `"${P.borderAcc}"`);
        code = code.replace(/"#007aff"/gi, `"${P.borderAcc}"`);
        code = code.replace(/"#0099ff"/gi, `"${P.borderAcc}"`);
        code = code.replace(/"#1e90ff"/gi, `"${P.borderAcc}"`);
        code = code.replace(/"#3b82f6"/gi, `"${P.borderAcc}"`);
        code = code.replace(/"#2563eb"/gi, `"${P.borderAcc}"`);

        // Hardcoded teal/cyan from runtime
        code = code.replace(/"#00bcd4"/gi, `"${P.borderAcc}"`);
        code = code.replace(/"#00acc1"/gi, `"${P.borderAcc}"`);

        // Fix: do not color all base game inputs, only chat input
        code = code.replace(
            /body\.bcn-enabled input,\s*body\.bcn-enabled textarea,\s*body\.bcn-enabled select/g,
            "body.bcn-enabled #InputChat",
        );

        new Function(code)();
    }

    requestText(RUNTIME_URL)
        .then(runRuntime)
        .catch(() => {});
})();

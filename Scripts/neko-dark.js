(function () {
    "use strict";
    if (window !== window.top) return;

    // Palette: Kawaii Midnight Purple
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
            /* Variables */
            body {
                --bcn-panel:  ${P.panel}  !important;
                --bcn-soft:   ${P.soft}   !important;
                --bcn-border: ${P.border} !important;
                --bcn-text:   ${P.text}   !important;
                --bcn-muted:  ${P.muted}  !important;
                --bcn-icon:   ${P.icon}   !important;
            }

            /* Container */
            html body #TextAreaChatLog {
                background: ${P.panel} !important;
                border: 1px solid ${P.border} !important;
                box-shadow: none !important;
            }

            /* Base Bubbles */
            html body #TextAreaChatLog .ChatMessage {
                background: ${P.soft} !important;
                border: 1px solid ${P.border} !important;
                color: ${P.text} !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.45) !important;
            }

            /* Own Message */
            html body #TextAreaChatLog .bcn-own-message {
                background: ${P.ownMsg} !important;
                border-color: ${P.borderAcc} !important;
            }

            /* BCE Notifications */
            html body #TextAreaChatLog .ChatMessage.bce-notification {
                background: ${P.panel} !important;
                border: 1px solid ${P.border} !important;
                color: ${P.text} !important;
                box-shadow: ${P.borderAcc} 3px 0px 0px 0px inset, 0 2px 8px rgba(0,0,0,0.45) !important;
            }
            html body #TextAreaChatLog .ChatMessage.bce-notification *:not(.ChatMessageName) {
                color: ${P.text} !important;
                text-shadow: none !important;
            }

            /* Whisper */
            html body #TextAreaChatLog .ChatMessageWhisper {
                background: ${P.whisperBg}  !important;
                border: 1px solid ${P.whisperBdr} !important;
                color: ${P.whisperTxt} !important;
            }

            /* Beep */
            html body #TextAreaChatLog .ChatMessageBeep {
                background: ${P.beepBg} !important;
                border: 1px solid ${P.beepBdr} !important;
                color: ${P.beepTxt} !important;
            }

            /* Name overrides */
            html body #TextAreaChatLog .ChatMessageName {
                text-shadow: none !important;
                -webkit-text-stroke: 0 !important;
            }

            /* Content text */
            html body #TextAreaChatLog .ChatMessage *:not(.ChatMessageName) {
                color: ${P.text} !important;
                text-shadow: 0 1px 3px rgba(0,0,0,0.6) !important;
            }
            html body #TextAreaChatLog .ChatMessageWhisper *:not(.ChatMessageName) { color: ${P.whisperTxt} !important; }
            html body #TextAreaChatLog .ChatMessageBeep *:not(.ChatMessageName) { color: ${P.beepTxt} !important; }
            
            /* Links */
            html body #TextAreaChatLog a {
                color: #60a5fa !important;
            }

            /* Headers */
            html body .chat-room-sep-header,
            html body button.chat-room-sep-header {
                background: ${P.panel} !important;
                color: ${P.muted} !important;
                border: none !important;
                box-shadow: none !important;
            }

            /* Action Buttons */
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

            /* Expanders */
            html body .chat-room-sep-collapse {
                background: ${P.panel} !important;
                color: ${P.muted} !important;
                border: none !important;
                box-shadow: none !important;
            }

            /* Reply UI */
            html body .chat-room-sep-reply,
            html body button[class*="reply"],
            html body .bcx-msg-hover,
            html body .bcx-chat-reply {
                background: ${P.soft} !important;
                color: ${P.text} !important;
                border: 1px solid ${P.border} !important;
            }

            /* Popups */
            html body .chat-room-message-popup {
                background: ${P.panel} !important;
                border: 1px solid ${P.border} !important;
                color: ${P.text} !important;
                box-shadow: 0 4px 6px rgba(0,0,0,0.5) !important;
            }

            /* Reply Indicators */
            html body button#chat-room-reply-indicator-text,
            html body button#chat-room-reply-indicator-close,
            html body div#chat-room-reply-indicator {
                background: ${P.panel} !important;
                color: ${P.text} !important;
                border: 2px solid ${P.borderAcc} !important;
            }

            /* Chat Input Area */
            html body div#chat-room-bottom,
            html body div[id^="chat-room-bot"] {
                background: ${P.base} !important;
                border-color: ${P.borderAcc} !important;
            }

            /* Send Buttons */
            html body #chat-room-buttons,
            html body #chat-room-buttons button,
            html body button#chat-room-buttons-collapse {
                background: ${P.panel} !important;
                color: ${P.text} !important;
                border: 2px solid ${P.borderAcc} !important;
            }

            /* Toasts */
            html body [id*="scroll-to-bottom"],
            html body [id*="chat-room-scroll"],
            html body [class*="new-message"] {
                background: ${P.panel} !important;
                color: ${P.text} !important;
                border: 1px solid ${P.borderAcc} !important;
                box-shadow: 0 4px 6px rgba(0,0,0,0.5) !important;
            }

            /* Emotes/Activities */
            html body #TextAreaChatLog .nk-emote,
            html body #TextAreaChatLog .nk-emote .chat-room-message-content,
            html body #TextAreaChatLog .ChatMessageEmote .chat-room-message-content,
            html body #TextAreaChatLog .ChatMessageAction .chat-room-message-content {
                font-style: italic !important;
                color: ${P.emoteTxt} !important;
            }
            html body #TextAreaChatLog .nk-emote *:not(.ChatMessageName) {
                color: ${P.emoteTxt} !important;
                text-shadow: none !important;
            }

            /* Badges */
            html body .bcn-relation-badge {
                display: none !important;
            }
            html body #TextAreaChatLog .bcn-relation-badge {
                display: inline !important;
            }

            /* Mod Effects */
            html body #bcn-soft-paws {
                left: 50% !important;
                width: 50% !important;
                overflow: hidden !important;
                pointer-events: none !important;
            }

            /* Top Menu */
            html body .chat-room-top-menu-btn {
                background-color: ${P.panel} !important;
                border: 1px solid ${P.border} !important;
                color: ${P.text} !important;
            }
            html body .chat-room-top-menu-btn[data-color="Blocked"] {
                background-color: #870c0c !important;
            }
            html body .chat-room-top-menu-btn[data-color="Limited"] {
                background-color: #9c6c0b !important;
            }
            html body .chat-room-top-menu-btn img,
            html body .chat-room-top-menu-btn svg {
                filter: invert(0.75) sepia(0.2) hue-rotate(240deg) !important;
            }

            /* Base inputs reset */
            html body textarea:not(#InputChat),
            html body input:not(#InputChat):not([type="radio"]):not([type="checkbox"]):not([type="color"]):not([type="range"]),
            html body select:not(#chat-garble):not(.wce-chat-room-select) {
                color: #333333 !important;
                background: rgba(255, 255, 255, 0.95) !important;
            }

            /* Dynamic special messages */
            html body #TextAreaChatLog div.ChatMessage.nk-online {
                background: #0d1624 !important;
                border: 1px solid #2563eb !important;
                color: #60a5fa !important;
                opacity: 0.65 !important;
            }
            html body #TextAreaChatLog div.ChatMessage.nk-online *:not(.ChatMessageName) { color: #60a5fa !important; text-shadow: none !important; }

            html body #TextAreaChatLog div.ChatMessage.nk-offline {
                background: #1f0810 !important;
                border: 1px solid #be123c !important;
                color: #fb7185 !important;
                opacity: 0.65 !important;
            }
            html body #TextAreaChatLog div.ChatMessage.nk-offline *:not(.ChatMessageName) { color: #fb7185 !important; text-shadow: none !important; }

            html body #TextAreaChatLog div.ChatMessage.ChatMessageWhisper {
                background: #2d142c !important;
                border: 1px solid #d946ef !important;
                color: #f0abfc !important;
                opacity: 0.95 !important;
                box-shadow: 0 0 5px rgba(217, 70, 239, 0.25) !important;
            }
            html body #TextAreaChatLog div.ChatMessage.ChatMessageWhisper *:not(.ChatMessageName) { color: #f0abfc !important; text-shadow: none !important; }

            html body #TextAreaChatLog div.ChatMessage.nk-voice {
                background: #1c150a !important;
                border: 1px solid #7a5c1a !important;
                color: #cda240 !important;
                opacity: 0.75 !important;
            }
            html body #TextAreaChatLog div.ChatMessage.nk-voice *:not(.ChatMessageName) { color: #cda240 !important; text-shadow: none !important; }

            html body #TextAreaChatLog div.ChatMessage.nk-enter {
                background: #141828 !important;
                border: 1px solid #303870 !important;
                color: #8898d0 !important;
                font-style: italic !important;
                opacity: 0.82 !important;
                box-shadow: none !important;
                text-align: center !important;
            }
            html body #TextAreaChatLog div.ChatMessage.nk-enter *:not(.ChatMessageName) {
                color: #8898d0 !important;
                text-shadow: none !important;
            }

            html body #TextAreaChatLog div.ChatMessage.nk-disconnect {
                background: #1e1018 !important;
                border: 1px solid #502030 !important;
                color: #c07080 !important;
                font-style: italic !important;
                opacity: 0.8 !important;
                box-shadow: none !important;
                text-align: center !important;
            }
            html body #TextAreaChatLog div.ChatMessage.nk-disconnect *:not(.ChatMessageName) {
                color: #c07080 !important;
                text-shadow: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    injectDarkTheme();
    setInterval(() => {
        if (document.head && !document.getElementById("neko-enhancer-dark-theme")) injectDarkTheme();
    }, 1000);

    // Chat Observer
    const PATTERNS = [
        { cls: "nk-voice", re: /\[voice\]/i },
        { cls: "nk-online", re: /now online:/i },
        { cls: "nk-offline", re: /now offline:/i },
        { cls: "nk-disconnect", re: /(disconnected|has left|left the room|left)/i },
        { cls: "nk-enter", re: /(entered|has entered|joined the room)/i },
    ];
    const EMOTE_RE = /^\s*\*[^*]+\*/;

    function fixUndefinedName(el) {
        const name = window.Player?.Name || "";
        if (!name) return;
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
            if (node.nodeValue?.includes("*undefined")) {
                node.nodeValue = node.nodeValue.replace(/\*undefined/g, `*${name}`);
            }
        }
    }

    function tagMessage(el) {
        if (el._nkTagged) return;
        const text = el.textContent || "";
        if (!text.trim()) return;

        el._nkTagged = true;

        if (el.classList.contains("ChatMessageWhisper") && text.includes("*undefined")) {
            fixUndefinedName(el);
        }

        const isActivity = el.classList.contains("ChatMessageActivity") ||
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
                const isPlayer = el.classList.contains("ChatMessageChat") ||
                                 el.classList.contains("ChatMessageWhisper") ||
                                 el.classList.contains("ChatMessageBeep");
                if (cls !== "nk-voice" && isPlayer) continue;

                el.classList.add(cls);
                return;
            }
        }
    }

    function watchChat() {
        const log = document.getElementById("TextAreaChatLog");
        if (!log) return;
        log.querySelectorAll(".ChatMessage").forEach(tagMessage);
        
        new MutationObserver(mutations => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType === 1 && node.classList.contains("ChatMessage")) tagMessage(node);
                }
            }
        }).observe(log, { childList: true });
    }

    const chatPoller = setInterval(() => {
        if (document.getElementById("TextAreaChatLog")) {
            clearInterval(chatPoller);
            watchChat();
        }
    }, 800);

    // Runtime Injector
    const RUNTIME_URL = "https://cdn.jsdelivr.net/gh/QAQMOON/meow-@main/dist/bondage-club-neko.runtime.full.js?v=2.13.1";

    function requestText(url) {
        return fetch(`${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`, { cache: "no-store" })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.text();
            });
    }

    function runRuntime(code) {
        if (!code?.trim()) return;

        // Theme patches
        code = code.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,/g, "rgba(30, 24, 41,");
        code = code.replace(/"#2f2f2f"|"#1a1a1a"/g, `"${P.text}"`);
        code = code.replace(/"#e8e8e8"|"#dddddd"/g, `"${P.border}"`);
        code = code.replace(/"#cccccc"/g, `"${P.borderAcc}"`);
        
        code = code.replace(/text:\s*"#[0-9a-fA-F]{6}"/gi, `text:"${P.text}"`);
        code = code.replace(/soft:\s*"#[0-9a-fA-F]{6}"/gi, `soft:"${P.soft}"`);
        code = code.replace(/panel:\s*"#[0-9a-fA-F]{6}"/gi, `panel:"${P.panel}"`);

        code = code.replace(/"#00a8ff"|"#007aff"|"#0099ff"|"#1e90ff"|"#3b82f6"|"#2563eb"|"#00bcd4"|"#00acc1"/gi, `"${P.borderAcc}"`);
        
        code = code.replace(
            /body\.bcn-enabled input,\s*body\.bcn-enabled textarea,\s*body\.bcn-enabled select/g,
            "body.bcn-enabled #InputChat"
        );

        new Function(code)();
    }

    requestText(RUNTIME_URL).then(runRuntime).catch(() => {});
})();

(function () {
    "use strict";
    if (window !== window.top) return;
    if (window._bcNekoDarkInjected) return;
    window._bcNekoDarkInjected = true;

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

        let style = document.getElementById("neko-enhancer-dark-theme");
        if (!style) {
            style = document.createElement("style");
            style.id = "neko-enhancer-dark-theme";
            document.head.appendChild(style);
        }

        style.textContent = `
            /* Variables */
            :root, body, body.bcn-enabled {
                --bcn-panel:  ${P.panel}  !important;
                --bcn-soft:   ${P.soft}   !important;
                --bcn-border: ${P.border} !important;
                --bcn-text:   ${P.text}   !important;
                --bcn-muted:  ${P.muted}  !important;
                --bcn-icon:   ${P.icon}   !important;
                --bcn-accent: ${P.borderAcc} !important;
                --bcn-glow:   rgba(107, 80, 144, 0.35) !important;
            }

            /* Chatroom Flex Layout: Prevents chat input from clipping/overflowing off-screen */
            html body #chat-room-div {
                display: flex !important;
                flex-direction: column !important;
                box-sizing: border-box !important;
            }

            html body #chat-room-top-menu,
            html body #chat-room-struggle-bar {
                flex: 0 0 auto !important;
                box-sizing: border-box !important;
            }

            /* Container */
            html body #TextAreaChatLog {
                flex: 1 1 0 !important;
                height: auto !important;
                min-height: 0 !important;
                box-sizing: border-box !important;
                overflow-y: auto !important;
                font-size: clamp(15px, 1.1em, 18px) !important;
                line-height: 1.45 !important;
                background: ${P.panel} !important;
                border: 1px solid ${P.border} !important;
                box-shadow: none !important;
            }

            /* Base Bubbles */
            html body #TextAreaChatLog .ChatMessage {
                font-size: inherit !important;
                line-height: inherit !important;
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
            html body #TextAreaChatLog .ChatMessage:not(.ChatMessageBeep) a:not(.ChatMessageName) {
                color: #60a5fa !important;
                text-decoration: underline !important;
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

            /* Chat Input Area & Bot Container */
            html body #chat-room-reply-indicator {
                flex: 0 0 auto !important;
                box-sizing: border-box !important;
            }

            html body #chat-room-bot,
            html body.bcn-enabled #chat-room-bot,
            html body [id*="chat-room-bot"],
            html body #chat-room-bottom,
            html body div#chat-room-bottom,
            html body #chat-room-reply-indicator > * {
                flex: 0 0 auto !important;
                box-sizing: border-box !important;
                background: ${P.panel} !important;
                background-color: ${P.panel} !important;
                border: 2px solid ${P.borderAcc} !important;
                border-radius: 14px !important;
                color: ${P.text} !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45) !important;
                min-height: 48px !important;
            }

            /* Chat Input Element */
            html body #InputChat,
            html body textarea#InputChat,
            html body input#InputChat,
            html body.bcn-enabled #InputChat,
            html body.bcn-enabled textarea#InputChat,
            html body.bcn-enabled input#InputChat,
            html body #chat-room-bot #InputChat,
            html body #chat-room-bot textarea,
            html body #chat-room-bot input {
                background: transparent !important;
                background-color: transparent !important;
                color: ${P.text} !important;
                border: none !important;
                box-shadow: none !important;
                padding: 12px 16px !important;
                font-size: clamp(16px, 1.15em, 18px) !important;
                line-height: 1.45 !important;
                min-height: 44px !important;
                box-sizing: border-box !important;
            }

            html body #chat-room-bot:has(#InputChat:focus) {
                outline: 2px solid ${P.borderAcc} !important;
                box-shadow: 0 0 0 4px rgba(107, 80, 144, 0.35) !important;
            }

            html body #InputChat::placeholder,
            html body.bcn-enabled #InputChat::placeholder {
                color: ${P.muted} !important;
            }

            /* Send Buttons */
            html body #chat-room-buttons,
            html body #chat-room-buttons button,
            html body button#chat-room-buttons-collapse,
            html body #chat-room-send,
            html body button#chat-room-send {
                background: ${P.panel} !important;
                color: ${P.text} !important;
                border: 2px solid ${P.borderAcc} !important;
                border-radius: 12px !important;
            }

            html body #chat-room-send::before {
                color: ${P.icon} !important;
                font-size: 1.4em !important;
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

            /* Mod Effects: Soft Paws & Hearts (50% Ke Kanan vs 50% Kebawah) */
            html body #bcn-soft-paws {
                overflow: hidden !important;
                pointer-events: none !important;
            }
            html body #bcn-soft-paws span {
                color: ${P.icon} !important;
                text-shadow: 0 4px 12px rgba(107, 80, 144, 0.35) !important;
                opacity: 0.14 !important;
            }

            /* Option 1: 50% Ke Kanan (Right Half - Default for standard display & landscape) */
            html body #bcn-soft-paws,
            html body.bcn-paws-right #bcn-soft-paws,
            html body #bcn-soft-paws.paws-right {
                top: 0 !important;
                bottom: 0 !important;
                left: 50% !important;
                right: 0 !important;
                width: 50% !important;
                height: 100% !important;
            }

            /* Option 2: 50% Kebawah (Bottom Half - Active in Portrait Orientation or BC-LCE / MPL) */
            @media (orientation: portrait) {
                html body:not(.bcn-paws-right) #bcn-soft-paws:not(.paws-right) {
                    top: 50% !important;
                    bottom: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    width: 100% !important;
                    height: 50% !important;
                }
            }

            html body.bcn-paws-bottom #bcn-soft-paws,
            html body #bcn-soft-paws.paws-bottom,
            html body.bcn-lce-portrait:not(.bcn-paws-right) #bcn-soft-paws:not(.paws-right),
            html body:has(#lce-v-cr):not(.bcn-paws-right) #bcn-soft-paws:not(.paws-right),
            html body:has(#lce-stage[data-orient="portrait"]):not(.bcn-paws-right) #bcn-soft-paws:not(.paws-right) {
                top: 50% !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                width: 100% !important;
                height: 50% !important;
            }

            /* Allow submenu to cleanly fit the layout toggle button when expanded, and properly collapse to 0 when closed */
            html body #bcn-panel #bcn-submenu {
                max-width: 220px !important;
            }
            html body.bcn-menu-collapsed #bcn-panel #bcn-submenu {
                max-width: 0 !important;
                opacity: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
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
            html body textarea:not(#InputChat):not(#chat-room-bot textarea),
            html body input:not(#InputChat):not(#chat-room-bot input):not([type="radio"]):not([type="checkbox"]):not([type="color"]):not([type="range"]),
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

            /* Neko Toast / Mini Notification Popup (#bcn-toast) */
            html body #bcn-toast {
                background: ${P.panel} !important;
                background-color: ${P.panel} !important;
                border: 2px solid ${P.whisperBdr} !important;
                color: ${P.whisperTxt} !important;
                box-shadow: 0 12px 28px rgba(0, 0, 0, 0.65), 0 0 16px rgba(152, 88, 204, 0.35) !important;
                backdrop-filter: blur(12px) !important;
                -webkit-backdrop-filter: blur(12px) !important;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8) !important;
            }

            /* Action composer warnings & blank wheel states */
            html body .bcn-composer-warning {
                background: #2a1518 !important;
                border: 1px solid #7a3030 !important;
                color: #f0a0a0 !important;
            }
            html body .bcn-wheel-blank {
                box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 3px 0 var(--bcn-glow) !important;
            }
        `;
        if (document.head.lastElementChild !== style) {
            document.head.appendChild(style);
        }
    }

    injectDarkTheme();
    if (document.head) {
        new MutationObserver(() => {
            const style = document.getElementById("neko-enhancer-dark-theme");
            if (!style || document.head.lastElementChild !== style) {
                injectDarkTheme();
            }
        }).observe(document.head, { childList: true });
    }

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

    // Soft Paws / Hearts Layout Manager (50% Ke Kanan / 50% Kebawah)
    const PAWS_STORAGE_KEY = "bcn_soft_paws_layout";
    const PAWS_MODES = ["auto", "right", "bottom"];
    let currentPawsMode = "auto";
    try {
        currentPawsMode = localStorage.getItem(PAWS_STORAGE_KEY) || "auto";
    } catch (e) {}

    /**
     * Detects if portrait mode (window aspect ratio, BC-LCE, or Liko-MPL) is active.
     */
    function isBcLcePortraitActive() {
        // 1. Native viewport orientation: if height >= width, it is definitively portrait
        if (window.innerHeight >= window.innerWidth) {
            return true;
        }

        // 2. BC-LCE / MPL Portrait Chatroom, Dialog, or Room Search elements
        if (document.getElementById("lce-v-cr") || document.getElementById("lce-v-cs") || document.getElementById("lce-v-csh") ||
            document.getElementById("liko-cs-bg") || document.getElementById("liko-csh-shell") || document.getElementById("liko-cr-fake-input-overlay")) {
            return true;
        }
        if (document.documentElement?.style && document.documentElement.style.getPropertyValue("--lce-cr-top")) {
            return true;
        }
        if (window.Vertical?.getState && window.Vertical.getState().active) {
            return true;
        }

        // 3. BC-LCE Portrait Login Page
        const stageEl = document.getElementById("lce-stage");
        if (stageEl && stageEl.dataset.orient === "portrait") {
            return true;
        }

        // 4. Document or class markers
        if (document.body?.classList?.contains("bclce-portrait") || document.body?.classList?.contains("mpl-portrait")) {
            return true;
        }

        return false;
    }

    function applyPawsLayout(mode) {
        if (!PAWS_MODES.includes(mode)) mode = "auto";
        currentPawsMode = mode;
        try {
            localStorage.setItem(PAWS_STORAGE_KEY, mode);
        } catch (e) {}

        const body = document.body;
        if (!body) return;

        body.classList.remove("bcn-paws-right", "bcn-paws-bottom");

        if (mode === "right") {
            body.classList.add("bcn-paws-right");
            body.classList.remove("bcn-lce-portrait");
        } else if (mode === "bottom") {
            body.classList.add("bcn-paws-bottom");
        } else {
            // Mode "auto": strictly requires BC-LCE portrait chatroom or login to be active
            const lceActive = isBcLcePortraitActive();
            body.classList.toggle("bcn-lce-portrait", lceActive);
        }

        updatePawsButtonLabel();
    }

    function togglePawsLayout() {
        const nextIdx = (PAWS_MODES.indexOf(currentPawsMode) + 1) % PAWS_MODES.length;
        const nextMode = PAWS_MODES[nextIdx];
        applyPawsLayout(nextMode);

        const labels = {
            right: "50% Ke Kanan (Right Half)",
            bottom: "50% Kebawah (Bottom Half)",
            auto: "Auto (50% Bawah saat Portrait / 50% Kanan saat Landscape)"
        };
        showNekoToast(`🐾 Paws Layout: ${labels[nextMode] || nextMode}`);
    }

    function showNekoToast(text) {
        let toast = document.getElementById("bcn-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "bcn-toast";
            document.body?.appendChild(toast);
        }
        toast.textContent = `♪ ${text}`;
        toast.classList.add("show");
        clearTimeout(window._bcnToastTimer);
        window._bcnToastTimer = setTimeout(() => toast?.classList.remove("show"), 2600);
    }

    function updatePawsButtonLabel() {
        const btn = document.getElementById("bcn-paws-layout-toggle");
        if (!btn) return;
        const icons = {
            right: "🐾➡",
            bottom: "🐾⬇",
            auto: "🐾⚡"
        };
        btn.textContent = icons[currentPawsMode] || "🐾";
        btn.title = `Paws Layout: ${currentPawsMode.toUpperCase()} (Klik untuk ganti: 50% Kanan / 50% Bawah / Auto-Portrait)`;
    }

    function hookPawsLayoutUI() {
        applyPawsLayout(currentPawsMode);

        const submenu = document.getElementById("bcn-submenu");
        if (submenu && !document.getElementById("bcn-paws-layout-toggle")) {
            const btn = document.createElement("button");
            btn.className = "bcn-btn";
            btn.id = "bcn-paws-layout-toggle";
            btn.type = "button";
            btn.style.fontSize = "13px";
            btn.style.lineHeight = "1";
            btn.onclick = (e) => {
                e.stopPropagation();
                togglePawsLayout();
            };
            submenu.appendChild(btn);
            updatePawsButtonLabel();
        }
    }

    window.bcNekoDarkSetPawsLayout = applyPawsLayout;
    window.bcNekoDarkTogglePaws = togglePawsLayout;

    if (document.body) {
        applyPawsLayout(currentPawsMode);
    }

    // Continuously maintain layout in auto mode when entering/leaving BC-LCE portrait scenes
    const pawsUiPoller = setInterval(() => {
        hookPawsLayoutUI();
        if (currentPawsMode === "auto" && document.body) {
            document.body.classList.toggle("bcn-lce-portrait", isBcLcePortraitActive());
        }
    }, 800);

    window.addEventListener("resize", () => {
        if (currentPawsMode === "auto" && document.body) {
            document.body.classList.toggle("bcn-lce-portrait", isBcLcePortraitActive());
        }
    });

    // Runtime Injector & Duplicate Guard
    const RUNTIME_URL = "https://cdn.jsdelivr.net/gh/QAQMOON/meow-@main/dist/bondage-club-neko.runtime.full.js?v=2.13.1";

    function hookBcModSdk(sdk) {
        if (!sdk || sdk._nekoGuardHooked) return;
        const origRegister = sdk.registerMod;
        if (typeof origRegister !== "function") return;

        // ponytail: wrap registerMod to return existing modApi on duplicate registration instead of unloading
        sdk.registerMod = function (info) {
            if (info && (info.name === "Bondage Club Neko Chat Enhancer (BCNekoEnhancer)" || info.name?.includes("BCNekoEnhancer"))) {
                try {
                    const existing = sdk.getMod ? sdk.getMod(info.name) : null;
                    if (existing) {
                        return existing;
                    }
                } catch (e) {}
            }
            return origRegister.apply(this, arguments);
        };
        sdk._nekoGuardHooked = true;
    }

    if (window.bcModSdk) {
        hookBcModSdk(window.bcModSdk);
    } else {
        let sdkVal = window.bcModSdk;
        try {
            Object.defineProperty(window, "bcModSdk", {
                configurable: true,
                enumerable: true,
                get: () => sdkVal,
                set: (val) => {
                    sdkVal = val;
                    hookBcModSdk(val);
                }
            });
        } catch (e) {}
    }

    function isNekoModLoaded() {
        if (window._nekoRuntimeLoaded) return true;
        if (document.querySelector("script[src*='bondage-club-neko']")) return true;
        if (document.body?.classList?.contains("bcn-enabled")) return true;
        if (window.bcModSdk) {
            try {
                if (typeof window.bcModSdk.getMod === "function" && window.bcModSdk.getMod("Bondage Club Neko Chat Enhancer (BCNekoEnhancer)")) return true;
                if (typeof window.bcModSdk.getModsInfo === "function" && window.bcModSdk.getModsInfo().some(m => m.name && m.name.includes("BCNekoEnhancer"))) return true;
            } catch (e) {}
        }
        return false;
    }

    function requestText(url) {
        return fetch(`${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`, { cache: "no-store" })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.text();
            });
    }

    function runRuntime(code) {
        if (!code?.trim() || isNekoModLoaded()) return;
        window._nekoRuntimeLoaded = true;

        const origCode = code;
        try {
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
        } catch (patchErr) {
            console.warn("[BC-Neko-Dark] Monkey-patching failed, executing unpatched runtime fallback:", patchErr);
            try {
                new Function(origCode)();
            } catch (fatalErr) {
                console.error("[BC-Neko-Dark] Fatal error executing Neko runtime:", fatalErr);
            }
        }
    }

    if (!isNekoModLoaded()) {
        requestText(RUNTIME_URL).then(runRuntime).catch(() => {});
    }
})();

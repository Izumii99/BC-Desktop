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
            :root, html, body, body.bcn-enabled {
                --bcn-panel:  ${P.panel}  !important;
                --bcn-soft:   ${P.soft}   !important;
                --bcn-border: ${P.border} !important;
                --bcn-text:   ${P.text}   !important;
                --bcn-muted:  ${P.muted}  !important;
                --bcn-icon:   ${P.icon}   !important;
                --bcn-accent: ${P.borderAcc} !important;
                --bcn-glow:   rgba(107, 80, 144, 0.35) !important;
            }

            /* Container & Dynamic Font Sizing (Inherits QAQMOON proportions & BC Settings) */
            html body #TextAreaChatLog {
                font-size: inherit !important;
                background: ${P.panel} !important;
                background-color: ${P.panel} !important;
                background-image: none !important;
                border: 1px solid ${P.border} !important;
                box-shadow: none !important;
            }

            /* Base Bubbles, Addon Messages & Strict White Eradication */
            html body #TextAreaChatLog .ChatMessage,
            html body #TextAreaChatLog div.ChatMessage,
            html body #TextAreaChatLog [class*="ChatMessage"]:not(.ChatMessageName):not(button),
            html body #TextAreaChatLog .bcn-card-message {
                font-size: inherit !important;
                margin: 7px 6px !important;
                padding: 9px 54px 9px 14px !important;
                border-radius: 12px !important;
                background: ${P.soft} !important;
                background-color: ${P.soft} !important;
                background-image: none !important;
                border: 1px solid ${P.border} !important;
                color: ${P.text} !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.45) !important;
            }

            /* Own Message */
            html body #TextAreaChatLog .bcn-own-message {
                background: ${P.ownMsg} !important;
                background-color: ${P.ownMsg} !important;
                background-image: none !important;
                border-color: ${P.borderAcc} !important;
            }

            /* BCE Notifications */
            html body #TextAreaChatLog .ChatMessage.bce-notification {
                background: ${P.panel} !important;
                border: 1px solid ${P.border} !important;
                color: ${P.text} !important;
                box-shadow: ${P.borderAcc} 3px 0px 0px 0px inset, 0 2px 8px rgba(0,0,0,0.45) !important;
            }
            html body #TextAreaChatLog .ChatMessage.bce-notification *:not(.ChatMessageName):not(.ChatMessageName *) {
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

            /* Name Styling: Completely remove button/box wrapper & enforce natural LabelColor (ID Color) */
            html body #TextAreaChatLog .ChatMessageName,
            html body #TextAreaChatLog button.ChatMessageName,
            html body #TextAreaChatLog .ChatMessageName.button,
            html body #TextAreaChatLog .ChatMessageName.blank-button {
                background: transparent !important;
                background-color: transparent !important;
                background-image: none !important;
                border: none !important;
                box-shadow: none !important;
                outline: none !important;
                padding: 0 !important;
                margin: 0 !important;
                border-radius: 0 !important;
                color: var(--label-color, ${P.text}) !important;
                font-weight: 800 !important;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.75) !important;
                -webkit-text-stroke: 0 !important;
                cursor: pointer !important;
                display: inline !important;
                vertical-align: baseline !important;
            }

            html body #TextAreaChatLog .ChatMessageName *:not(.bcn-relation-badge) {
                color: var(--label-color, ${P.text}) !important;
                background: transparent !important;
                background-color: transparent !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
            }

            html body #TextAreaChatLog .ChatMessageName:hover,
            html body #TextAreaChatLog .ChatMessageName:hover * {
                color: var(--label-color, ${P.text}) !important;
                text-decoration: underline !important;
                background: transparent !important;
                box-shadow: none !important;
            }

            /* Content text (strict exclusion so character names & badges preserve their ID color) */
            html body #TextAreaChatLog .ChatMessage *:not(.ChatMessageName):not(.ChatMessageName *) {
                color: ${P.text} !important;
                text-shadow: 0 1px 3px rgba(0,0,0,0.6) !important;
            }
            html body #TextAreaChatLog .ChatMessageWhisper *:not(.ChatMessageName):not(.ChatMessageName *) { color: ${P.whisperTxt} !important; }
            html body #TextAreaChatLog .ChatMessageBeep *:not(.ChatMessageName):not(.ChatMessageName *) { color: ${P.beepTxt} !important; }
            
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
            html body #chat-room-bot,
            html body.bcn-enabled #chat-room-bot,
            html body [id*="chat-room-bot"],
            html body #chat-room-bottom,
            html body div#chat-room-bottom,
            html body #chat-room-reply-indicator > * {
                background: ${P.panel} !important;
                background-color: ${P.panel} !important;
                border: 2px solid ${P.borderAcc} !important;
                color: ${P.text} !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45) !important;
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
                font-size: inherit !important;
                background: transparent !important;
                background-color: transparent !important;
                color: ${P.text} !important;
                border: none !important;
                box-shadow: none !important;
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
            }

            html body #chat-room-send::before {
                color: ${P.icon} !important;
            }

            /* Floating New Message Indicator & Scroll Buttons - Centered by default (Condition 1) */
            html body [id*="scroll-to-bottom"],
            html body [id*="chat-room-scroll"],
            html body [class*="new-message"],
            html body #TextAreaChatLog [class*="new-message"],
            html body .chat-room-new-messages-container,
            html body .chat-room-new-messages {
                left: 50% !important;
                transform: translateX(-50%) !important;
                background: ${P.panel} !important;
                background-color: ${P.panel} !important;
                color: ${P.text} !important;
                border: 1px solid ${P.borderAcc} !important;
                box-shadow: 0 4px 6px rgba(0,0,0,0.5) !important;
            }
            html body [id*="scroll-to-bottom"] *,
            html body [id*="chat-room-scroll"] *,
            html body [class*="new-message"] *,
            html body #TextAreaChatLog [class*="new-message"] *,
            html body .chat-room-new-messages-container *,
            html body .chat-room-new-messages * {
                color: ${P.text} !important;
            }

            /* Emotes / Actions / Activities: Subtle, compact, italic, smaller font with native Neko paw badge kept */
            html body #TextAreaChatLog .ChatMessageEmote,
            html body #TextAreaChatLog .ChatMessageAction,
            html body #TextAreaChatLog .ChatMessageActivity,
            html body #TextAreaChatLog .nk-emote,
            html body #TextAreaChatLog div.ChatMessageEmote,
            html body #TextAreaChatLog div.ChatMessageAction,
            html body #TextAreaChatLog div.ChatMessageActivity,
            html body #TextAreaChatLog div.nk-emote {
                margin: 2px 8px !important;
                padding: 2px 14px !important;
                border: none !important;
                border-radius: 0 !important;
                background: transparent !important;
                background-color: transparent !important;
                background-image: none !important;
                box-shadow: none !important;
                color: ${P.emoteTxt} !important;
                font-style: italic !important;
                font-weight: normal !important;
                font-size: 0.88em !important;
                min-height: 0 !important;
                line-height: 1.35 !important;
            }

            html body #TextAreaChatLog .bcn-own-message.ChatMessageEmote,
            html body #TextAreaChatLog .bcn-own-message.ChatMessageAction,
            html body #TextAreaChatLog .bcn-own-message.ChatMessageActivity,
            html body #TextAreaChatLog .bcn-own-message.nk-emote {
                background: transparent !important;
                background-color: transparent !important;
                background-image: none !important;
                border: none !important;
                box-shadow: none !important;
            }

            /* Own message paw badge theme styling */
            html body #TextAreaChatLog .bcn-own-message::before {
                background: ${P.panel} !important;
                border-color: ${P.borderAcc} !important;
                box-shadow: 0 2px 6px rgba(0,0,0,0.5) !important;
            }

            /* Remove trailing ::after badge decorations from emotes/actions, keeping native ::before */
            html body #TextAreaChatLog .ChatMessageEmote::after,
            html body #TextAreaChatLog .ChatMessageAction::after,
            html body #TextAreaChatLog .ChatMessageActivity::after,
            html body #TextAreaChatLog .nk-emote::after {
                content: none !important;
                display: none !important;
            }

            html body #TextAreaChatLog .ChatMessageEmote *,
            html body #TextAreaChatLog .ChatMessageAction *,
            html body #TextAreaChatLog .ChatMessageActivity *,
            html body #TextAreaChatLog .nk-emote *:not(.ChatMessageName):not(.ChatMessageName *) {
                color: ${P.emoteTxt} !important;
                text-shadow: none !important;
                font-style: italic !important;
                font-weight: normal !important;
            }

            /* Badges */
            html body .bcn-relation-badge {
                display: none !important;
            }
            html body #TextAreaChatLog .bcn-relation-badge {
                display: inline !important;
            }

            /* Mod Effects - Responsive Floating Paws & Hearts (#bcn-soft-paws) */
            html body #bcn-soft-paws {
                position: fixed !important;
                left: 50% !important;
                top: 0 !important;
                width: 50% !important;
                height: 100% !important;
                overflow: hidden !important;
                pointer-events: none !important;
                z-index: 8 !important;
            }
            html body #bcn-soft-paws span {
                color: ${P.icon} !important;
                text-shadow: 0 4px 12px rgba(107, 80, 144, 0.35) !important;
                opacity: 0.12 !important;
            }

            /* Portrait Mode (Mobile / Narrow View) - move 50% to bottom & shift new-message/toast to right (Condition 2) */
            @media (orientation: portrait), (max-aspect-ratio: 1/1) {
                html body #bcn-soft-paws {
                    left: 0 !important;
                    top: 50% !important;
                    width: 100% !important;
                    height: 50% !important;
                }
                html body #bcn-toast {
                    left: 75% !important;
                    transform: translateX(-50%) translateY(16px) !important;
                }
                html body #bcn-toast.show {
                    transform: translateX(-50%) translateY(0) !important;
                }
                html body [id*="scroll-to-bottom"],
                html body [id*="chat-room-scroll"],
                html body [class*="new-message"],
                html body #TextAreaChatLog [class*="new-message"],
                html body .chat-room-new-messages-container,
                html body .chat-room-new-messages {
                    left: 75% !important;
                    transform: translateX(-50%) !important;
                }
                html body #TextAreaChatLog {
                    font-size: clamp(12px, 3.2vw, 16px) !important;
                }
                html body #TextAreaChatLog .ChatMessage {
                    padding: 5px 36px 5px 10px !important;
                    margin: 4px 2px !important;
                }
                html body #InputChat {
                    font-size: clamp(12px, 3.2vw, 16px) !important;
                }
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
            html body #TextAreaChatLog div.ChatMessage.nk-online *:not(.ChatMessageName):not(.ChatMessageName *) { color: #60a5fa !important; text-shadow: none !important; }

            html body #TextAreaChatLog div.ChatMessage.nk-offline {
                background: #1f0810 !important;
                border: 1px solid #be123c !important;
                color: #fb7185 !important;
                opacity: 0.65 !important;
            }
            html body #TextAreaChatLog div.ChatMessage.nk-offline *:not(.ChatMessageName):not(.ChatMessageName *) { color: #fb7185 !important; text-shadow: none !important; }

            html body #TextAreaChatLog div.ChatMessage.ChatMessageWhisper {
                background: #2d142c !important;
                border: 1px solid #d946ef !important;
                color: #f0abfc !important;
                opacity: 0.95 !important;
                box-shadow: 0 0 5px rgba(217, 70, 239, 0.25) !important;
            }
            html body #TextAreaChatLog div.ChatMessage.ChatMessageWhisper *:not(.ChatMessageName):not(.ChatMessageName *) { color: #f0abfc !important; text-shadow: none !important; }

            html body #TextAreaChatLog div.ChatMessage.nk-voice {
                background: #1c150a !important;
                border: 1px solid #7a5c1a !important;
                color: #cda240 !important;
                opacity: 0.75 !important;
            }
            html body #TextAreaChatLog div.ChatMessage.nk-voice *:not(.ChatMessageName):not(.ChatMessageName *) { color: #cda240 !important; text-shadow: none !important; }

            /* Disconnect / Enter / Room Transitions: Centered, small, italic, unbolded, transparent */
            html body #TextAreaChatLog .ChatMessageEnterLeave,
            html body #TextAreaChatLog .nk-disconnect,
            html body #TextAreaChatLog .nk-enter,
            html body #TextAreaChatLog div.ChatMessageEnterLeave,
            html body #TextAreaChatLog div.nk-disconnect,
            html body #TextAreaChatLog div.nk-enter {
                display: block !important;
                text-align: center !important;
                margin: 4px auto !important;
                padding: 2px 16px !important;
                font-style: italic !important;
                font-weight: normal !important;
                font-size: 0.85em !important;
                background: transparent !important;
                background-color: transparent !important;
                background-image: none !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                width: fit-content !important;
                max-width: 85% !important;
            }

            html body #TextAreaChatLog div.ChatMessage.nk-enter,
            html body #TextAreaChatLog div.ChatMessage.nk-enter *:not(.ChatMessageName):not(.ChatMessageName *) {
                color: #8898d0 !important;
                text-shadow: none !important;
                font-style: italic !important;
                font-weight: normal !important;
            }

            html body #TextAreaChatLog div.ChatMessage.nk-disconnect,
            html body #TextAreaChatLog div.ChatMessage.nk-disconnect *:not(.ChatMessageName):not(.ChatMessageName *) {
                color: #c07080 !important;
                text-shadow: none !important;
                font-style: italic !important;
                font-weight: normal !important;
            }

            /* Suppress badges from room transitions */
            html body #TextAreaChatLog .ChatMessageEnterLeave::before,
            html body #TextAreaChatLog .ChatMessageEnterLeave::after,
            html body #TextAreaChatLog .nk-disconnect::before,
            html body #TextAreaChatLog .nk-disconnect::after,
            html body #TextAreaChatLog .nk-enter::before,
            html body #TextAreaChatLog .nk-enter::after {
                content: none !important;
                display: none !important;
            }

            /* Neko Toast / Mini Notification Popup (#bcn-toast) - Centered by default (Condition 1) */
            html body #bcn-toast {
                left: 50% !important;
                transform: translateX(-50%) translateY(16px) !important;
                background: ${P.panel} !important;
                background-color: ${P.panel} !important;
                background-image: none !important;
                border: 2px solid ${P.whisperBdr} !important;
                color: ${P.whisperTxt} !important;
                box-shadow: 0 12px 28px rgba(0, 0, 0, 0.65), 0 0 16px rgba(152, 88, 204, 0.35) !important;
                backdrop-filter: blur(12px) !important;
                -webkit-backdrop-filter: blur(12px) !important;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8) !important;
            }
            html body #bcn-toast.show {
                transform: translateX(-50%) translateY(0) !important;
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

    function sanitizeStylesheets() {
        try {
            document.querySelectorAll("style:not(#neko-enhancer-dark-theme)").forEach(s => {
                const text = s.textContent || "";
                if (text.includes("bcn-") || text.includes("#TextAreaChatLog") || text.includes("--bcn-soft")) {
                    if (text.includes("rgba(255, 255, 255") || text.includes("#fff1f6") || text.includes("#ffffff")) {
                        s.textContent = text
                            .replace(/--bcn-soft:\s*#fff1f6/g, `--bcn-soft: ${P.soft}`)
                            .replace(/--bcn-panel:\s*#ffffff/g, `--bcn-panel: ${P.panel}`)
                            .replace(/--bcn-text:\s*#8a3f5b/g, `--bcn-text: ${P.text}`)
                            .replace(/--bcn-muted:\s*#9d7a86/g, `--bcn-muted: ${P.muted}`)
                            .replace(/--bcn-border:\s*#ffd4e2/g, `--bcn-border: ${P.border}`)
                            .replace(/--bcn-accent:\s*#f65086/g, `--bcn-accent: ${P.borderAcc}`)
                            .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,/g, "rgba(30, 24, 41,");
                    }
                }
            });
        } catch (e) {}
    }

    injectDarkTheme();
    sanitizeStylesheets();
    if (document.head) {
        new MutationObserver(() => {
            const style = document.getElementById("neko-enhancer-dark-theme");
            if (!style || document.head.lastElementChild !== style) {
                injectDarkTheme();
            }
            sanitizeStylesheets();
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
    const ACTION_RE = /^\s*\(.+\)\s*$/;

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

        const isRoomTransition = el.classList.contains("ChatMessageEnterLeave") ||
                                 /(disconnected|has left|left the room|entered|has entered|joined the room)/i.test(text);
        if (isRoomTransition) {
            el.classList.add("ChatMessageEnterLeave");
            el.style.setProperty("background", "transparent", "important");
            el.style.setProperty("border", "none", "important");
            el.style.setProperty("box-shadow", "none", "important");
            if (/(disconnected|left)/i.test(text)) {
                el.classList.add("nk-disconnect");
            } else if (/(entered|joined)/i.test(text)) {
                el.classList.add("nk-enter");
            }
            return;
        }

        const isActivity = el.classList.contains("ChatMessageActivity") ||
                           el.classList.contains("ChatMessageEmote") ||
                           el.classList.contains("ChatMessageAction");
        const isEmote = !isActivity && (EMOTE_RE.test(text) || ACTION_RE.test(text));
        
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

    function syncPawsPosition() {
        const paws = document.getElementById("bcn-soft-paws");
        const log = document.getElementById("TextAreaChatLog");
        if (!paws || !log) return;
        const rect = log.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            paws.style.setProperty("left", `${rect.left}px`, "important");
            paws.style.setProperty("top", `${rect.top}px`, "important");
            paws.style.setProperty("width", `${rect.width}px`, "important");
            paws.style.setProperty("height", `${rect.height}px`, "important");
        }
    }
    window.addEventListener("resize", syncPawsPosition, { passive: true });
    setInterval(syncPawsPosition, 1000);

    const chatPoller = setInterval(() => {
        if (document.getElementById("TextAreaChatLog")) {
            clearInterval(chatPoller);
            watchChat();
            syncPawsPosition();
        }
    }, 800);

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

    if (!isNekoModLoaded()) {
        requestText(RUNTIME_URL).then(runRuntime).catch(() => {});
    }
})();

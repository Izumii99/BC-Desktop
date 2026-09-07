(function () {
    "use strict";
    if (window !== window.top) return;

    let defaultIconStateApplied = false;

    setInterval(() => {
        try {
            if (
                typeof Player !== "undefined" &&
                Player &&
                Player.ImmersionSettings
            ) {
                // Force ungarbled messages
                if (!Player.ImmersionSettings.ShowUngarbledMessages) {
                    Player.ImmersionSettings.ShowUngarbledMessages = true;
                    let cb = document.getElementById(
                        "preference-immersion-ShowUngarbledMessages",
                    );
                    if (cb && !cb.checked) {
                        cb.checked = true;
                    }
                }

                // Persist Chat Room Icons State (Hide Icon) across reconnects
                if (typeof window.qolSavedIconState === "undefined") {
                    window.qolSavedIconState = 1; // Default to squinted 1x
                    if (
                        typeof window.ChatRoomHideIconState !== "undefined" &&
                        window.ChatRoomHideIconState === 0
                    ) {
                        window.ChatRoomHideIconState = 1;
                    }
                }

                if (
                    typeof window.ChatRoomLoad === "function" &&
                    !window.ChatRoomLoad.hasQolHook
                ) {
                    const origChatRoomLoad = window.ChatRoomLoad;
                    window.ChatRoomLoad = function () {
                        origChatRoomLoad.apply(this, arguments);
                        if (
                            typeof window.ChatRoomHideIconState !== "undefined"
                        ) {
                            window.ChatRoomHideIconState =
                                window.qolSavedIconState;
                        }
                    };
                    window.ChatRoomLoad.hasQolHook = true;
                }

                if (
                    typeof window.ChatRoomSendChat === "function" &&
                    !window._qolHasEmoticonHook
                ) {
                    window._qolHasEmoticonHook = true;

                    const doQolLogic = function () {
                        try {
                            // Only apply emoticons if whispering is not active (public chat)
                            let isWhisper =
                                typeof window.ChatRoomTargetMemberNumber !==
                                    "undefined" &&
                                window.ChatRoomTargetMemberNumber !== null &&
                                window.ChatRoomTargetMemberNumber !== -1;
                            if (isWhisper) return;

                            let chatInput =
                                document.getElementById("InputChat");
                            let msg = chatInput ? chatInput.value : "";
                            if (
                                msg &&
                                typeof CharacterSetFacialExpression ===
                                    "function" &&
                                typeof Player !== "undefined" &&
                                Player
                            ) {
                                let hasEmoticon = false;

                                const SetSafeExpression = (
                                    group,
                                    expr,
                                    timer = 5,
                                ) => {
                                    hasEmoticon = true;

                                    // Bypass for WCE Animation Engine: Delay expression until after talking animation finishes
                                    let isWCEAnim =
                                        typeof window.bceAnimationEngineEnabled ===
                                            "function" &&
                                        window.bceAnimationEngineEnabled();
                                    let delay = isWCEAnim
                                        ? Math.min(msg.length * 65, 5000)
                                        : 0;

                                    setTimeout(() => {
                                        if (timer === null) {
                                            CharacterSetFacialExpression(
                                                Player,
                                                group,
                                                expr,
                                            );
                                        } else {
                                            CharacterSetFacialExpression(
                                                Player,
                                                group,
                                                expr,
                                                timer,
                                            );
                                        }
                                        if (
                                            group.startsWith("Eyes") ||
                                            group === "Mouth"
                                        ) {
                                            // Force re-render to prevent facial twitching
                                            setTimeout(() => {
                                                if (
                                                    Player &&
                                                    typeof CharacterRefresh ===
                                                        "function"
                                                )
                                                    CharacterRefresh(Player);
                                            }, 150);
                                            setTimeout(() => {
                                                if (
                                                    Player &&
                                                    typeof CharacterRefresh ===
                                                        "function"
                                                )
                                                    CharacterRefresh(Player);
                                            }, 500);
                                        }
                                    }, delay);
                                };

                                // 1. EYES PARSING
                                if (msg.match(/\^.*\^|\^\^/)) {
                                    SetSafeExpression("Eyes", "ShylyHappy");
                                } else if (msg.match(/0\.0|0_0|0x0/)) {
                                    SetSafeExpression("Eyes", "Surprised");
                                } else if (msg.match(/o\.o|o_o|oxo/i)) {
                                    SetSafeExpression("Eyes", "Surprised");
                                } else if (msg.match(/@.*@/)) {
                                    SetSafeExpression("Eyes", "Crazy");
                                } else if (
                                    msg.match(/>[wWv_.,~x3]?<|>\/{2,5}</) ||
                                    msg.match(/[xX][dDpP3>\]\)]/i) ||
                                    msg.includes("><")
                                ) {
                                    SetSafeExpression("Eyes", "Daydream");
                                } else if (
                                    msg.match(
                                        /(^|\s)==(\s|$)|=[wvxdp3]=|=\/{2,5}=/i,
                                    )
                                ) {
                                    SetSafeExpression("Eyes", "Horny");
                                } else if (
                                    msg.match(/;[p3>d\])(|]/i) ||
                                    msg.match(/qwq/i)
                                ) {
                                    SetSafeExpression("Eyes", null);
                                    SetSafeExpression("Eyes1", "Closed");
                                } else if (msg.match(/:[p3>d\])(|]/i)) {
                                    SetSafeExpression("Eyes", null);
                                } else if (msg.match(/>[.,~_3]?>|<[.,~_3]?</)) {
                                    SetSafeExpression("Eyes", "Dazed");
                                } else if (msg.match(/T[xw_v-]T|TT/)) {
                                    SetSafeExpression("Eyes", "Shy");
                                } else if (msg.match(/qwq/i)) {
                                    SetSafeExpression("Eyes", "Shy");
                                } else if (
                                    msg.match(/=[_~^.-]=/i)
                                ) {
                                    SetSafeExpression("Eyes", "Closed");
                                }

                                // 2. MOUTH PARSING
                                if (
                                    msg.match(
                                        /(^|\s|[.,~])[x:;]D(?=$|\s|[.,?!~;*)"\]])/i,
                                    )
                                ) {
                                    SetSafeExpression("Mouth", "Laughing");
                                } else if (msg.match(/D:/)) {
                                    SetSafeExpression("Mouth", "Sad");
                                } else if (
                                    msg.match(/[x:;]3|[x:;]>|=w=|>w<|qwq/i)
                                ) {
                                    SetSafeExpression("Mouth", "Happy");
                                } else if (msg.match(/[x:;]p/i)) {
                                    SetSafeExpression("Mouth", "Ahegao");
                                } else if (
                                    msg.match(/\^~?\^|=v=|TwT|>v</i) ||
                                    msg.match(/[x:;=]\)/i)
                                ) {
                                    SetSafeExpression("Mouth", "Smile");
                                } else if (
                                    msg.match(/=~=|@~?@|TxT/i) ||
                                    msg.match(/[x:;=]\(/i) ||
                                    msg.match(/>[.,~_3]>|<[.,~_3]</)
                                ) {
                                    SetSafeExpression("Mouth", "Frown");
                                } else if (
                                    msg.match(/=\/{2,5}=|>\/{2,5}</) ||
                                    msg.match(/=3=|>3<|>3>|<3</)
                                ) {
                                    SetSafeExpression("Mouth", "Pout");
                                }

                                // 3. EYEBROWS & TEARS
                                if (msg.match(/>[:;xX=]|[:;xX=]</)) {
                                    SetSafeExpression("Eyebrows", "Angry");
                                } else if (
                                    msg.match(/TT|T[xw]T/) ||
                                    msg.match(/><|T_T/)
                                ) {
                                    SetSafeExpression("Eyebrows", "Sad");
                                } else if (msg.match(/>[.,~_3]>|<[.,~_3]</)) {
                                    SetSafeExpression("Eyebrows", "Harsh");
                                }
                                if (
                                    msg.match(/T[xw_v-]T|TT/) ||
                                    msg.match(/qwq/i)
                                ) {
                                    SetSafeExpression("Fluids", "TearsMedium");
                                }

                                // 3.5 SWEAT DROP (Tear Emoticon)
                                if (
                                    msg.match(/;\s*$/) ||
                                    msg.match(/[=><\^~-];/) ||
                                    msg.match(/(TwT|T_T|T-T|TvT|x_x|x-x);/i)
                                ) {
                                    SetSafeExpression("Emoticon", "Tear");
                                }

                                // 4. FLOATING EMOTICONS
                                if (hasEmoticon) {
                                    if (msg.includes("?")) {
                                        SetSafeExpression(
                                            "Emoticon",
                                            "Confusion",
                                        );
                                    } else if (msg.includes("!")) {
                                        SetSafeExpression(
                                            "Emoticon",
                                            "Exclamation",
                                        );
                                    }
                                    if (msg.includes("#")) {
                                        SetSafeExpression(
                                            "Emoticon",
                                            "Annoyed",
                                        );
                                    }
                                }

                                // 5. BLUSH (Independent slashes or inside faces)
                                let slashMatch = msg.match(/\/{2,5}/);
                                if (slashMatch && !msg.match(/https?:\/\//i)) {
                                    const slashCount = slashMatch[0].length;
                                    let blushType = "Low";
                                    if (slashCount === 3) blushType = "Medium";
                                    else if (slashCount === 4)
                                        blushType = "High";
                                    else if (slashCount >= 5)
                                        blushType = "VeryHigh";

                                    SetSafeExpression("Blush", blushType);
                                }

                                // 6. AFK & BRB (Permanent)
                                let afkMatch = msg.match(
                                    /(^|\s)(afk|brb)~?(\s|$)/i,
                                );
                                if (afkMatch) {
                                    let type = afkMatch[2].toLowerCase();
                                    type =
                                        type.charAt(0).toUpperCase() +
                                        type.slice(1); // Afk or Brb
                                    SetSafeExpression("Emoticon", type, null);
                                }
                            }
                        } catch (e) {
                            console.error("Chat QoL Addon Error:", e);
                        }
                    };

                    if (typeof window.bcModSdk !== "undefined") {
                        try {
                            const modApi = window.bcModSdk.registerMod({
                                name: "BCDesktop_ChatQoL",
                                fullName: "Chat QoL & Emoticons",
                                version: "1.0.0",
                                repository:
                                    "https://github.com/Izumii99/BC-Desktop",
                            });
                            modApi.hookFunction(
                                "ChatRoomSendChat",
                                0,
                                (args, next) => {
                                    doQolLogic();
                                    return next(args);
                                },
                            );
                        } catch (e) {
                            console.error("Failed to register with ModSDK", e);
                        }
                    } else {
                        const origChatRoomSendChat = window.ChatRoomSendChat;
                        window.ChatRoomSendChat = function () {
                            doQolLogic();
                            return origChatRoomSendChat.apply(this, arguments);
                        };
                    }
                }

                // Update saved state when user manually clicks the eye icon
                if (
                    typeof CurrentScreen !== "undefined" &&
                    CurrentScreen === "ChatRoom" &&
                    typeof window.ChatRoomHideIconState !== "undefined"
                ) {
                    window.qolSavedIconState = window.ChatRoomHideIconState;
                }
            }
        } catch (e) {}
    }, 2000);

    // Shift+Tab / Tab shortcut for LianChat navigation
    document.addEventListener(
        "keydown",
        (e) => {
            let senderList = document.getElementById("LC-Message-SenderList");
            let isLianChatOpen = senderList && senderList.offsetParent !== null;

            if (e.key === "Tab") {
                e.preventDefault();

                if (isLianChatOpen) {
                    // Filter only online friends (marked by strong class)
                    let items = Array.from(
                        senderList.querySelectorAll(".lc-conv-item"),
                    ).filter((item) => {
                        return (
                            item.offsetParent !== null &&
                            item.querySelector(".lc-conv-name--strong") !== null
                        );
                    });

                    if (items.length > 0) {
                        let activeIndex = items.findIndex(
                            (item) =>
                                item.classList.contains("is-active") ||
                                (item.style.backgroundColor &&
                                    item.style.backgroundColor !==
                                        "transparent" &&
                                    item.style.backgroundColor !== ""),
                        );

                        if (e.shiftKey) {
                            activeIndex =
                                activeIndex <= 0
                                    ? items.length - 1
                                    : activeIndex - 1;
                        } else {
                            activeIndex =
                                activeIndex === -1 ||
                                activeIndex === items.length - 1
                                    ? 0
                                    : activeIndex + 1;
                        }

                        let targetItem = items[activeIndex];
                        if (targetItem) {
                            targetItem.scrollIntoView({
                                block: "nearest",
                                behavior: "smooth",
                            });
                            targetItem.dispatchEvent(
                                new MouseEvent("mousedown", { bubbles: true }),
                            );
                            targetItem.dispatchEvent(
                                new MouseEvent("click", { bubbles: true }),
                            );
                        }
                    }
                } else if (e.shiftKey) {
                    // Open LianChat when closed
                    let lianFab = document.getElementById(
                        "floatingMessageButton",
                    );
                    if (lianFab) {
                        let targetBtn =
                            lianFab.querySelector(".lc-theme-dial") ||
                            lianFab.querySelector("button") ||
                            lianFab;
                        let events = [
                            "pointerdown",
                            "mousedown",
                            "pointerup",
                            "mouseup",
                            "click",
                        ];
                        events.forEach((type) => {
                            targetBtn.dispatchEvent(
                                new MouseEvent(type, {
                                    bubbles: true,
                                    cancelable: true,
                                }),
                            );
                        });
                    }
                }
            }
        },
        true,
    );

    // Alt + Number (1-0) to whisper characters in room based on position
    document.addEventListener(
        "keydown",
        (e) => {
            if (e.altKey && e.key >= "0" && e.key <= "9") {
                if (
                    typeof window.ChatRoomCharacter !== "undefined" &&
                    Array.isArray(window.ChatRoomCharacter)
                ) {
                    let myNumber =
                        typeof Player !== "undefined" && Player.MemberNumber
                            ? Player.MemberNumber
                            : -1;
                    let otherChars = window.ChatRoomCharacter.filter(
                        (c) => c.MemberNumber !== myNumber,
                    );

                    // Sort left-to-right based on actual drawing X coordinates
                    otherChars.sort((a, b) => {
                        let getX = (c) => {
                            if (typeof c.X === "number") return c.X;
                            if (
                                typeof window.ChatRoomCharacterDrawlist !==
                                "undefined"
                            ) {
                                let draw =
                                    window.ChatRoomCharacterDrawlist.find(
                                        (d) => d.Character === c || d.C === c,
                                    );
                                if (draw && typeof draw.X === "number")
                                    return draw.X;
                            }
                            return window.ChatRoomCharacter.indexOf(c) * 500;
                        };
                        return getX(a) - getX(b);
                    });

                    let index = parseInt(e.key) - 1;
                    if (e.key === "0") index = 9;

                    if (index >= 0 && index < otherChars.length) {
                        let target = otherChars[index];
                        if (target && target.MemberNumber) {
                            e.preventDefault();

                            // Toggle whisper target
                            let isToggleOff =
                                window.ChatRoomTargetMemberNumber ==
                                target.MemberNumber;

                            if (isToggleOff) {
                                if (
                                    typeof window.BCX_Loaded !== "undefined" ||
                                    window.ChatRoomTargetMemberNumber === -1
                                ) {
                                    window.ChatRoomTargetMemberNumber = -1;
                                } else {
                                    window.ChatRoomTargetMemberNumber = null;
                                }
                            } else {
                                window.ChatRoomTargetMemberNumber =
                                    target.MemberNumber;
                            }

                            // Update the input placeholder visually (Fixing the issue where it still said "Talk to everyone")
                            let chatInput =
                                document.getElementById("InputChat");
                            if (chatInput) {
                                if (isToggleOff) {
                                    let pubText =
                                        typeof TextGet === "function"
                                            ? TextGet("PublicChat") ||
                                              "Talk to everyone"
                                            : "Talk to everyone";
                                    chatInput.setAttribute(
                                        "placeholder",
                                        pubText,
                                    );
                                } else {
                                    let name =
                                        target.Name ||
                                        String(target.MemberNumber);
                                    let whispText =
                                        typeof TextGet === "function"
                                            ? TextGet("WhisperTo") ||
                                              "Whisper to"
                                            : "Whisper to";
                                    chatInput.setAttribute(
                                        "placeholder",
                                        whispText + " " + name,
                                    );
                                }
                                chatInput.focus();
                            }
                        }
                    }
                }
            }
        },
        true,
    );

    // Alt + C (Ear), Alt + V (Tail), and Alt + B (Wings) shortcuts for BCAR+
    document.addEventListener(
        "keydown",
        (e) => {
            if (e.altKey && !e.shiftKey && !e.ctrlKey) {
                if (
                    e.code === "KeyC" ||
                    e.code === "KeyV" ||
                    e.code === "KeyB"
                ) {
                    if (
                        typeof CurrentScreen !== "undefined" &&
                        CurrentScreen === "ChatRoom" &&
                        typeof ChatRoomClick === "function"
                    ) {
                        if (typeof Player !== "undefined" && Player) {
                            e.preventDefault();

                            let type = "ear";
                            if (e.code === "KeyV") type = "tail";
                            if (e.code === "KeyB") type = "wings";

                            // Default to lower-left if bcarSettings fails to load
                            let btnPos = "lowerleft";
                            if (
                                Player.BCAR &&
                                Player.BCAR.bcarSettings &&
                                Player.BCAR.bcarSettings
                                    .animationButtonsPosition
                            ) {
                                btnPos =
                                    Player.BCAR.bcarSettings
                                        .animationButtonsPosition;
                            }

                            let originalX =
                                typeof MouseX !== "undefined" ? MouseX : 0;
                            let originalY =
                                typeof MouseY !== "undefined" ? MouseY : 0;

                            if (
                                btnPos === "lowerleft" ||
                                btnPos === "lowerright"
                            ) {
                                MouseX = btnPos === "lowerright" ? 980 : 22;
                                MouseY =
                                    type === "ear"
                                        ? 882
                                        : type === "tail"
                                          ? 937
                                          : 992;
                            } else if (
                                btnPos === "upperleft" ||
                                btnPos === "upperright"
                            ) {
                                MouseX = btnPos === "upperright" ? 980 : 22;
                                MouseY =
                                    type === "ear"
                                        ? 157
                                        : type === "tail"
                                          ? 202
                                          : 247;
                            } else {
                                // Fallback to standard bottom-left click for unsupported positions
                                MouseX = 22;
                                MouseY =
                                    type === "ear"
                                        ? 882
                                        : type === "tail"
                                          ? 937
                                          : 992;
                            }

                            ChatRoomClick();

                            MouseX = originalX;
                            MouseY = originalY;
                        }
                    }
                }
            }
        },
        true,
    );

    // Ctrl + Space to scroll chat to bottom (Changed from Alt+Space to prevent opening Windows menu)
    document.addEventListener(
        "keydown",
        (e) => {
            if (e.ctrlKey && !e.shiftKey && !e.altKey && e.code === "Space") {
                if (
                    typeof CurrentScreen !== "undefined" &&
                    CurrentScreen === "ChatRoom"
                ) {
                    let chatLog = document.getElementById("TextAreaChatLog");
                    if (chatLog) {
                        e.preventDefault();
                        chatLog.scrollTop = chatLog.scrollHeight;
                    }
                }
            }
        },
        true,
    );
})();

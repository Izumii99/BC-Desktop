(function () {
    "use strict";
    if (window !== window.top) return;

    let defaultIconStateApplied = false;

    let qolConfig = {
        enableEmoticons: true,
        emoticons: {
            emoHappy: true,
            emoSurprised: true,
            emoCrazy: true,
            emoDaydream: true,
            emoHorny: true,
            emoWink: true,
            emoDazed: true,
            emoSad: true,
            emoPout: true,
            emoAngry: true,
            emoBlush: true,
            emoSweat: true,
            emoFloating: true,
            emoAfk: true,
        },
        enableLianChatShortcut: true,
        enableWhisperShortcut: true,
        enableBcarShortcut: true,
        enableScrollShortcut: true,
        forceUngarbled: true,
        persistIconState: true,
    };
    try {
        const saved = localStorage.getItem("BCDesktop_ChatQoL_Config");
        if (saved) {
            let parsed = JSON.parse(saved);
            qolConfig = Object.assign(qolConfig, parsed);
            if (parsed.emoticons) {
                qolConfig.emoticons = Object.assign(
                    qolConfig.emoticons,
                    parsed.emoticons,
                );
            }
        }
    } catch (e) {}

    function saveQolConfig() {
        try {
            localStorage.setItem(
                "BCDesktop_ChatQoL_Config",
                JSON.stringify(qolConfig),
            );
        } catch (e) {}
    }

    const qolBtn = document.createElement("div");
    qolBtn.innerHTML = `<img src="data:image/png;base64,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" style="width: 100%; height: 100%; object-fit: contain;">`;
    Object.assign(qolBtn.style, {
        position: "fixed",
        top: "20px",
        left: "20px",
        width: "44px",
        height: "44px",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: "10px",
        padding: "6px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        border: "1px solid rgba(0,0,0,0.1)",
        display: "none",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        zIndex: "2147483646",
        transition: "transform 0.2s",
        userSelect: "none",
        boxSizing: "border-box"
    });
    qolBtn.onmouseenter = () => {
        qolBtn.style.transform = "scale(1.1)";
    };
    qolBtn.onmouseleave = () => {
        qolBtn.style.transform = "scale(1)";
    };

    const qolModal = document.createElement("div");
    Object.assign(qolModal.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: "2147483647",
        display: "none",
        justifyContent: "center",
        alignItems: "center",
    });

    const qolContent = document.createElement("div");
    Object.assign(qolContent.style, {
        backgroundColor: "#1a1625",
        width: "400px",
        maxWidth: "90%",
        maxHeight: "85%",
        borderRadius: "16px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.8)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid #2e2640",
        color: "#f5f5f5",
        fontFamily: "'Inter', Arial, sans-serif",
    });

    const qolHeader = document.createElement("div");
    Object.assign(qolHeader.style, {
        backgroundColor: "#211c2e",
        padding: "18px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #2e2640",
        fontWeight: "bold",
        fontSize: "16px",
    });
    qolHeader.innerHTML = `<span>Chat QoL Settings</span>`;

    const qolClose = document.createElement("div");
    qolClose.innerHTML = "✖";
    Object.assign(qolClose.style, {
        cursor: "pointer",
        fontSize: "18px",
        color: "#8a81a8",
        transition: "color 0.2s",
    });
    qolClose.onmouseenter = () => (qolClose.style.color = "#f5f5f5");
    qolClose.onmouseleave = () => (qolClose.style.color = "#8a81a8");
    qolClose.onclick = () => (qolModal.style.display = "none");
    qolHeader.appendChild(qolClose);

    const qolBody = document.createElement("div");
    Object.assign(qolBody.style, {
        padding: "20px 24px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    });

    function createToggle(
        key,
        labelTitle,
        labelDesc = "",
        isSub = false,
        subKey = null,
    ) {
        const row = document.createElement("div");
        Object.assign(row.style, {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: isSub ? "12px 0 12px 24px" : "14px 0",
            borderBottom: "1px solid #2e2640",
        });

        const textContainer = document.createElement("div");
        textContainer.style.display = "flex";
        textContainer.style.flexDirection = "column";
        textContainer.style.gap = "4px";

        const lbl = document.createElement("div");
        lbl.innerText = labelTitle;
        Object.assign(lbl.style, {
            fontSize: isSub ? "14px" : "15px",
            color: "#f5f5f5",
            fontWeight: isSub ? "normal" : "500",
        });

        textContainer.appendChild(lbl);

        if (labelDesc) {
            const desc = document.createElement("div");
            desc.innerText = labelDesc;
            Object.assign(desc.style, {
                fontSize: "12px",
                color: "#a7a2b6",
                lineHeight: "1.3",
                paddingRight: "12px",
            });
            textContainer.appendChild(desc);
        }

        const switchLabel = document.createElement("label");
        Object.assign(switchLabel.style, {
            position: "relative",
            display: "inline-block",
            width: "38px",
            height: "22px",
            flexShrink: "0",
            cursor: "pointer",
        });

        const chk = document.createElement("input");
        chk.type = "checkbox";
        chk.checked = isSub ? qolConfig.emoticons[subKey] : qolConfig[key];
        Object.assign(chk.style, { opacity: "0", width: "0", height: "0" });

        const slider = document.createElement("span");
        Object.assign(slider.style, {
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            backgroundColor: chk.checked ? "#a29bfe" : "#3d3554",
            transition: "0.3s",
            borderRadius: "22px",
            boxShadow: chk.checked
                ? "0 0 8px rgba(162, 155, 254, 0.5)"
                : "inset 0 2px 4px rgba(0,0,0,0.3)",
        });

        const knob = document.createElement("span");
        Object.assign(knob.style, {
            position: "absolute",
            height: "16px",
            width: "16px",
            left: chk.checked ? "19px" : "3px",
            bottom: "3px",
            backgroundColor: "#ffffff",
            transition: "0.3s",
            borderRadius: "50%",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        });

        chk.onchange = (e) => {
            if (isSub) qolConfig.emoticons[subKey] = e.target.checked;
            else qolConfig[key] = e.target.checked;

            slider.style.backgroundColor = e.target.checked
                ? "#a29bfe"
                : "#3d3554";
            slider.style.boxShadow = e.target.checked
                ? "0 0 8px rgba(162, 155, 254, 0.5)"
                : "inset 0 2px 4px rgba(0,0,0,0.3)";
            knob.style.left = e.target.checked ? "19px" : "3px";

            saveQolConfig();
        };

        slider.appendChild(knob);
        switchLabel.appendChild(chk);
        switchLabel.appendChild(slider);

        row.appendChild(textContainer);
        row.appendChild(switchLabel);
        return row;
    }

    const emoContainer = document.createElement("div");
    const emoMain = document.createElement("div");
    Object.assign(emoMain.style, {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 0",
        borderBottom: "1px solid #2e2640",
    });

    const emoLeft = document.createElement("div");
    emoLeft.style.display = "flex";
    emoLeft.style.alignItems = "center";
    emoLeft.style.gap = "8px";
    const emoExpand = document.createElement("div");
    emoExpand.innerText = "▼";
    Object.assign(emoExpand.style, {
        cursor: "pointer",
        fontSize: "10px",
        color: "#8a81a8",
        width: "16px",
        textAlign: "center",
        transition: "transform 0.2s",
    });
    const emoLbl = document.createElement("div");
    emoLbl.innerText = "Enable Chat Emoticons";
    Object.assign(emoLbl.style, {
        fontSize: "15px",
        color: "#f5f5f5",
        fontWeight: "500",
    });
    emoLeft.appendChild(emoExpand);
    emoLeft.appendChild(emoLbl);

    const emoChk = document.createElement("input");
    emoChk.type = "checkbox";
    emoChk.checked = qolConfig.enableEmoticons;
    Object.assign(emoChk.style, { opacity: "0", width: "0", height: "0" });

    const emoSwitchLabel = document.createElement("label");
    Object.assign(emoSwitchLabel.style, {
        position: "relative",
        display: "inline-block",
        width: "38px",
        height: "22px",
        flexShrink: "0",
        cursor: "pointer",
    });

    const emoSlider = document.createElement("span");
    Object.assign(emoSlider.style, {
        position: "absolute",
        top: "0",
        left: "0",
        right: "0",
        bottom: "0",
        backgroundColor: emoChk.checked ? "#a29bfe" : "#3d3554",
        transition: "0.3s",
        borderRadius: "22px",
        boxShadow: emoChk.checked
            ? "0 0 8px rgba(162, 155, 254, 0.5)"
            : "inset 0 2px 4px rgba(0,0,0,0.3)",
    });

    const emoKnob = document.createElement("span");
    Object.assign(emoKnob.style, {
        position: "absolute",
        height: "16px",
        width: "16px",
        left: emoChk.checked ? "19px" : "3px",
        bottom: "3px",
        backgroundColor: "#ffffff",
        transition: "0.3s",
        borderRadius: "50%",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    });

    emoChk.onchange = (e) => {
        qolConfig.enableEmoticons = e.target.checked;
        emoSlider.style.backgroundColor = e.target.checked
            ? "#a29bfe"
            : "#3d3554";
        emoSlider.style.boxShadow = e.target.checked
            ? "0 0 8px rgba(162, 155, 254, 0.5)"
            : "inset 0 2px 4px rgba(0,0,0,0.3)";
        emoKnob.style.left = e.target.checked ? "19px" : "3px";
        saveQolConfig();
    };

    emoSlider.appendChild(emoKnob);
    emoSwitchLabel.appendChild(emoChk);
    emoSwitchLabel.appendChild(emoSlider);
    emoMain.appendChild(emoLeft);
    emoMain.appendChild(emoSwitchLabel);

    const emoSubList = document.createElement("div");
    Object.assign(emoSubList.style, {
        display: "none",
        flexDirection: "column",
        paddingLeft: "8px",
        borderBottom: "1px solid #2e2640",
        backgroundColor: "#161320",
    });

    emoExpand.onclick = () => {
        const isHidden = emoSubList.style.display === "none";
        emoSubList.style.display = isHidden ? "flex" : "none";
        emoExpand.style.transform = isHidden
            ? "rotate(0deg)"
            : "rotate(-90deg)";
    };

    emoSubList.appendChild(
        createToggle(null, "Cat Face", ":3, ;3, =w=, >w<", true, "emoCat"),
    );
    emoSubList.appendChild(
        createToggle(null, "V-Smile", "=v=, >v<", true, "emoVSmile"),
    );
    emoSubList.appendChild(
        createToggle(null, "Happy / Smile", "^_^, ^^, ^~^", true, "emoHappy"),
    );
    emoSubList.appendChild(
        createToggle(null, "Laughing", "xD, XD", true, "emoLaugh"),
    );
    emoSubList.appendChild(
        createToggle(null, "Classic Smile", ":), :]", true, "emoSmile"),
    );
    emoSubList.appendChild(
        createToggle(
            null,
            "Surprised (Zero)",
            "0.0, 0_0, 0x0",
            true,
            "emoSurprisedZero",
        ),
    );
    emoSubList.appendChild(
        createToggle(
            null,
            "Surprised (O)",
            "o.o, o_o, oxo",
            true,
            "emoSurprisedO",
        ),
    );
    emoSubList.appendChild(
        createToggle(null, "Crazy", "@_@", true, "emoCrazy"),
    );
    emoSubList.appendChild(
        createToggle(
            null,
            "Daydream / Wince",
            ">.<, ><, >_<",
            true,
            "emoDaydream",
        ),
    );
    emoSubList.appendChild(
        createToggle(null, "Horny", "==, =[_]=", true, "emoHorny"),
    );
    emoSubList.appendChild(
        createToggle(null, "Wink / Ahegao", ";p, :p, ;), ;d", true, "emoWink"),
    );
    emoSubList.appendChild(
        createToggle(
            null,
            "Dazed / Side-glance",
            ">.>, <.<, >~>",
            true,
            "emoDazed",
        ),
    );
    emoSubList.appendChild(
        createToggle(
            null,
            "Sad / Crying",
            "T_T, TwT, TxT, TvT, T-T, TT",
            true,
            "emoSad",
        ),
    );
    emoSubList.appendChild(
        createToggle(null, "QWQ Crying", "qwq", true, "emoQwq"),
    );
    emoSubList.appendChild(
        createToggle(null, "Frown", ":(, =~=", true, "emoFrown"),
    );
    emoSubList.appendChild(
        createToggle(null, "Pout", "=3=, >3<", true, "emoPout"),
    );
    emoSubList.appendChild(
        createToggle(null, "Angry", ">:<, >;<, >x<", true, "emoAngry"),
    );
    emoSubList.appendChild(
        createToggle(
            null,
            "Blushing Slashes",
            "//, ///, ////",
            true,
            "emoBlush",
        ),
    );
    emoSubList.appendChild(
        createToggle(
            null,
            "Sweat Drop / Tear",
            "TwT;, x_x;, ^^;",
            true,
            "emoSweat",
        ),
    );
    emoSubList.appendChild(
        createToggle(null, "Floating Marks", "?, !, #", true, "emoFloating"),
    );
    emoSubList.appendChild(
        createToggle(null, "AFK / BRB", "afk, brb", true, "emoAfk"),
    );

    emoContainer.appendChild(emoMain);
    emoContainer.appendChild(emoSubList);

    qolBody.appendChild(emoContainer);
    qolBody.appendChild(
        createToggle(
            "enableLianChatShortcut",
            "Enable LianChat Nav",
            "Use Shift+Tab or Tab to navigate LC menus.",
        ),
    );
    qolBody.appendChild(
        createToggle(
            "enableWhisperShortcut",
            "Enable Whisper Shortcut",
            "Use Alt + 1-9 to whisper people in the room.",
        ),
    );
    qolBody.appendChild(
        createToggle(
            "enableBcarShortcut",
            "Enable BCAR+ Shortcuts",
            "Use Alt + C/V/B to toggle ears, tail, and wings.",
        ),
    );
    qolBody.appendChild(
        createToggle(
            "enableScrollShortcut",
            "Enable Scroll to Bottom",
            "Use Ctrl + Space to quick scroll chat.",
        ),
    );
    qolBody.appendChild(
        createToggle(
            "forceUngarbled",
            "Force Ungarbled Messages",
            "Forces the game to always show ungarbled text.",
        ),
    );
    qolBody.appendChild(
        createToggle(
            "persistIconState",
            "Persist Chat Icon State",
            "Remembers your hidden/squint icon preference.",
        ),
    );

    qolContent.appendChild(qolHeader);
    qolContent.appendChild(qolBody);
    qolModal.appendChild(qolContent);
    let uiAppended = false;

    qolBtn.onclick = () => {
        qolModal.style.display = "flex";
    };
    qolModal.onclick = (e) => {
        if (e.target === qolModal) qolModal.style.display = "none";
    };

    setInterval(() => {
        try {
            if (
                typeof Player !== "undefined" &&
                Player &&
                Player.ImmersionSettings
            ) {
                // Force ungarbled messages
                if (
                    qolConfig.forceUngarbled &&
                    !Player.ImmersionSettings.ShowUngarbledMessages
                ) {
                    Player.ImmersionSettings.ShowUngarbledMessages = true;
                    let cb = document.getElementById(
                        "preference-immersion-ShowUngarbledMessages",
                    );
                    if (cb && !cb.checked) {
                        cb.checked = true;
                    }
                }

                // Persist Chat Room Icons State (Hide Icon) across reconnects
                if (
                    qolConfig.persistIconState &&
                    typeof window.qolSavedIconState === "undefined"
                ) {
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
                            qolConfig.persistIconState &&
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
                        if (!qolConfig.enableEmoticons) return;
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
                                if (
                                    qolConfig.emoticons.emoHappy &&
                                    msg.match(/\^.*\^|\^\^|\^~\^/)
                                ) {
                                    SetSafeExpression("Eyes", "ShylyHappy");
                                } else if (
                                    qolConfig.emoticons.emoSurprisedZero &&
                                    msg.match(/0\.0|0_0|0x0/)
                                ) {
                                    SetSafeExpression("Eyes", "Surprised");
                                } else if (
                                    qolConfig.emoticons.emoSurprisedO &&
                                    msg.match(/o\.o|o_o|oxo/i)
                                ) {
                                    SetSafeExpression("Eyes", "Surprised");
                                } else if (
                                    qolConfig.emoticons.emoCrazy &&
                                    msg.match(/@.*@/)
                                ) {
                                    SetSafeExpression("Eyes", "Crazy");
                                } else if (
                                    qolConfig.emoticons.emoDaydream &&
                                    (msg.match(/>[wWv_.,~x3]?<|>\/{2,5}</) ||
                                        msg.match(/[xX][dDpP3>\]\)]/i) ||
                                        msg.includes("><"))
                                ) {
                                    SetSafeExpression("Eyes", "Daydream");
                                } else if (
                                    qolConfig.emoticons.emoHorny &&
                                    msg.match(
                                        /(^|\s)==(\s|$)|=[wvxdp3]=|=\/{2,5}=/i,
                                    )
                                ) {
                                    SetSafeExpression("Eyes", "Horny");
                                } else if (
                                    qolConfig.emoticons.emoWink &&
                                    (msg.match(/;[p3>d\])(|]/i) ||
                                        msg.match(/qwq/i))
                                ) {
                                    SetSafeExpression("Eyes", null);
                                    SetSafeExpression("Eyes1", "Closed");
                                } else if (
                                    qolConfig.emoticons.emoWink &&
                                    msg.match(/:[p3>d\])(|]/i)
                                ) {
                                    SetSafeExpression("Eyes", null);
                                } else if (
                                    qolConfig.emoticons.emoDazed &&
                                    msg.match(/>[.,~_3]?>|<[.,~_3]?</)
                                ) {
                                    SetSafeExpression("Eyes", "Dazed");
                                } else if (
                                    qolConfig.emoticons.emoSad &&
                                    msg.match(/T[xw_v-]T|TT/)
                                ) {
                                    SetSafeExpression("Eyes", "Shy");
                                } else if (
                                    qolConfig.emoticons.emoQwq &&
                                    msg.match(/qwq/i)
                                ) {
                                    SetSafeExpression("Eyes", "Shy");
                                } else if (
                                    qolConfig.emoticons.emoFrown &&
                                    msg.match(/=[_~^.-]=/i)
                                ) {
                                    SetSafeExpression("Eyes", "Closed");
                                }

                                // 2. MOUTH PARSING
                                if (
                                    qolConfig.emoticons.emoHappy &&
                                    msg.match(
                                        /(^|\s|[.,~])[x:;]D(?=$|\s|[.,?!~;*)"\]])/i,
                                    )
                                ) {
                                    SetSafeExpression("Mouth", "Laughing");
                                } else if (
                                    qolConfig.emoticons.emoFrown &&
                                    msg.match(/D:/)
                                ) {
                                    SetSafeExpression("Mouth", "Sad");
                                } else if (
                                    (qolConfig.emoticons.emoCat &&
                                        msg.match(/[x:;]3|[x:;]>|=w=|>w</i)) ||
                                    (qolConfig.emoticons.emoQwq &&
                                        msg.match(/qwq/i))
                                ) {
                                    SetSafeExpression("Mouth", "Happy");
                                } else if (
                                    qolConfig.emoticons.emoWink &&
                                    msg.match(/[x:;]p/i)
                                ) {
                                    SetSafeExpression("Mouth", "Ahegao");
                                } else if (
                                    qolConfig.emoticons.emoHappy &&
                                    (msg.match(/\^~?\^|=v=|TwT|>v</i) ||
                                        msg.match(/[x:;=]\)/i))
                                ) {
                                    SetSafeExpression("Mouth", "Smile");
                                } else if (
                                    qolConfig.emoticons.emoSad &&
                                    (msg.match(/=~=|@~?@|TxT/i) ||
                                        msg.match(/[x:;=]\(/i) ||
                                        msg.match(/>[.,~_3]>|<[.,~_3]</))
                                ) {
                                    SetSafeExpression("Mouth", "Frown");
                                } else if (
                                    qolConfig.emoticons.emoPout &&
                                    (msg.match(/=\/{2,5}=|>\/{2,5}</) ||
                                        msg.match(/=3=|>3<|>3>|<3</))
                                ) {
                                    SetSafeExpression("Mouth", "Pout");
                                } else if (
                                    (qolConfig.emoticons.emoSurprisedZero &&
                                        msg.match(/0\.0|0_0|0x0/)) ||
                                    (qolConfig.emoticons.emoSurprisedO &&
                                        msg.match(/o\.o|o_o|oxo/i))
                                ) {
                                    SetSafeExpression("Mouth", "HalfOpen");
                                }

                                // 3. EYEBROWS & TEARS
                                if (
                                    qolConfig.emoticons.emoAngry &&
                                    msg.match(/>[:;xX=]|[:;xX=]</)
                                ) {
                                    SetSafeExpression("Eyebrows", "Angry");
                                } else if (
                                    qolConfig.emoticons.emoSad &&
                                    (msg.match(/TT|T[xw]T/) ||
                                        msg.match(/><|T_T/))
                                ) {
                                    SetSafeExpression("Eyebrows", "Sad");
                                } else if (
                                    qolConfig.emoticons.emoDazed &&
                                    msg.match(/>[.,~_3]>|<[.,~_3]</)
                                ) {
                                    SetSafeExpression("Eyebrows", "Harsh");
                                } else if (
                                    (qolConfig.emoticons.emoSurprisedZero &&
                                        msg.match(/0\.0|0_0|0x0/)) ||
                                    (qolConfig.emoticons.emoSurprisedO &&
                                        msg.match(/o\.o|o_o|oxo/i))
                                ) {
                                    SetSafeExpression("Eyebrows", "Raised");
                                }
                                if (
                                    qolConfig.emoticons.emoSad &&
                                    (msg.match(/T[xw_v-]T|TT/) ||
                                        msg.match(/qwq/i))
                                ) {
                                    SetSafeExpression("Fluids", "TearsMedium");
                                }

                                // 3.5 SWEAT DROP (Tear Emoticon)
                                if (
                                    qolConfig.emoticons.emoSweat &&
                                    (msg.match(/;\s*$/) ||
                                        msg.match(/[=><\^~-];/) ||
                                        msg.match(
                                            /(TwT|T_T|T-T|TvT|x_x|x-x);/i,
                                        ))
                                ) {
                                    SetSafeExpression("Emoticon", "Tear");
                                }

                                // 4. FLOATING EMOTICONS
                                if (hasEmoticon) {
                                    if (
                                        qolConfig.emoticons.emoFloating &&
                                        msg.includes("?")
                                    ) {
                                        SetSafeExpression(
                                            "Emoticon",
                                            "Confusion",
                                        );
                                    } else if (
                                        qolConfig.emoticons.emoFloating &&
                                        msg.includes("!")
                                    ) {
                                        SetSafeExpression(
                                            "Emoticon",
                                            "Exclamation",
                                        );
                                    }
                                    if (
                                        qolConfig.emoticons.emoFloating &&
                                        msg.includes("#")
                                    ) {
                                        SetSafeExpression(
                                            "Emoticon",
                                            "Annoyed",
                                        );
                                    }
                                }

                                // 5. BLUSH (Independent slashes or inside faces)
                                let slashMatch = msg.match(/\/{2,5}/);
                                if (
                                    qolConfig.emoticons.emoBlush &&
                                    slashMatch &&
                                    !msg.match(/https?:\/\//i)
                                ) {
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
                                if (qolConfig.emoticons.emoAfk && afkMatch) {
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
                    if (qolConfig.persistIconState) {
                        window.qolSavedIconState = window.ChatRoomHideIconState;
                    }
                }
            }

            if (!uiAppended && document.body) {
                document.body.appendChild(qolBtn);
                document.body.appendChild(qolModal);
                uiAppended = true;
            }

            // Toggle Settings UI Button Visibility
            if (
                typeof CurrentScreen !== "undefined" &&
                (CurrentScreen === "Login" ||
                    CurrentScreen === "InformationSheet")
            ) {
                qolBtn.style.display = "flex";
            } else {
                qolBtn.style.display = "none";
                qolModal.style.display = "none";
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
                if (!qolConfig.enableLianChatShortcut) return;
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
            if (!qolConfig.enableWhisperShortcut) return;
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
            if (!qolConfig.enableBcarShortcut) return;
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
            if (!qolConfig.enableScrollShortcut) return;
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

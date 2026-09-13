(function () {
    "use strict";
    if (window !== window.top) return;

    let defaultIconStateApplied = false;

    let qolConfig = {
        enableEmoticons: true,
        emoticons: {
            emoCat: true,
            emoCatW: true,
            emoCatWClosed: true,
            emoVSmile: true,
            emoVSmileClosed: true,
            emoHappy: true,
            emoLaugh: true,
            emoSmile: true,
            emoSurprisedZero: true,
            emoSurprisedO: true,
            emoCrazy: true,
            emoDaydream: true,
            emoHorny: true,
            emoWink: true,
            emoDazed: true,
            emoSad: true,
            emoQwq: true,
            emoFrown: true,
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
        smartClosedEyes: true,
        enablePetsuitAnim: true,
        animCount: 9,
        animDelay: 350,
    };
    try {
        const saved = localStorage.getItem("BCDesktop_ChatQoL_Config");
        if (saved) {
            let parsed = JSON.parse(saved);
            const defaultEmo = qolConfig.emoticons;
            qolConfig = Object.assign(qolConfig, parsed);
            qolConfig.emoticons = Object.assign(
                defaultEmo,
                parsed.emoticons || {}
            );
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
    qolBtn.innerHTML = `<img src="https://raw.githubusercontent.com/Izumii99/BC-Desktop/main/Assets/gear_small.png" style="width: 100%; height: 100%; object-fit: contain;">`;
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

    function createNumberInput(
        key,
        labelTitle,
        labelDesc = "",
        min = 1,
        max = 1000,
        isSub = false
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

        const inputContainer = document.createElement("div");
        Object.assign(inputContainer.style, {
            display: "flex",
            alignItems: "center",
        });

        const numInput = document.createElement("input");
        numInput.type = "number";
        numInput.min = min;
        numInput.max = max;
        numInput.value = typeof qolConfig[key] !== "undefined" ? qolConfig[key] : min;
        Object.assign(numInput.style, {
            width: "60px",
            backgroundColor: "#1a1625",
            border: "1px solid #3d3554",
            color: "#f5f5f5",
            borderRadius: "4px",
            padding: "4px 8px",
            fontFamily: "inherit",
            fontSize: "14px",
            outline: "none"
        });

        numInput.onchange = (e) => {
            let val = parseInt(e.target.value);
            if (isNaN(val)) val = min;
            if (val < min) val = min;
            if (val > max) val = max;
            e.target.value = val;
            
            qolConfig[key] = val;
            saveQolConfig();
        };

        inputContainer.appendChild(numInput);
        row.appendChild(textContainer);
        row.appendChild(inputContainer);
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
        createToggle(null, "Cat Face (Open)", ":3, ;3, :>", true, "emoCat"),
    );
    emoSubList.appendChild(
        createToggle(null, "Cat Face (Horny)", "=w=, >w>, <w<, =////=", true, "emoCatW"),
    );
    emoSubList.appendChild(
        createToggle(null, "Cat Face (Shy)", ">w<", true, "emoCatWClosed")
    );
    emoSubList.appendChild(
        createToggle(null, "V-Smile", "=v=, >v>, <v<", true, "emoVSmile"),
    );
    emoSubList.appendChild(
        createToggle(null, "V-Smile (Shy)", ">v<", true, "emoVSmileClosed")
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
            "Blush / Shy Face",
            "//, ///, >///>, <///<",
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
            "smartClosedEyes",
            "Smart Closed Eyes",
            "See everyone while your eyes are closed (bypasses expression blindness).",
        ),
    );
    qolBody.appendChild(
        createToggle(
            "enableScrollShortcut",
            "Enable Quick Scroll to Bottom",
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
    
    const petContainer = document.createElement("div");
    const petMain = document.createElement("div");
    Object.assign(petMain.style, {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 0",
        borderBottom: "1px solid #2e2640",
    });

    const petLeft = document.createElement("div");
    Object.assign(petLeft.style, {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        cursor: "pointer",
        flex: "1",
    });

    const petExpand = document.createElement("span");
    petExpand.innerHTML = "▼";
    Object.assign(petExpand.style, {
        color: "#a7a2b6",
        fontSize: "12px",
        width: "16px",
        textAlign: "center",
        transition: "transform 0.2s ease",
        transform: "rotate(-90deg)"
    });

    const petLbl = document.createElement("div");
    petLbl.innerText = "Petsuit Animation";
    Object.assign(petLbl.style, {
        fontSize: "15px",
        color: "#f5f5f5",
        fontWeight: "500",
    });
    
    petLeft.appendChild(petExpand);
    petLeft.appendChild(petLbl);

    const petChk = document.createElement("input");
    petChk.type = "checkbox";
    petChk.checked = qolConfig.enablePetsuitAnim;
    Object.assign(petChk.style, { opacity: "0", width: "0", height: "0" });

    const petSwitchLabel = document.createElement("label");
    Object.assign(petSwitchLabel.style, {
        position: "relative",
        display: "inline-block",
        width: "38px",
        height: "22px",
        flexShrink: "0",
        cursor: "pointer",
    });

    const petSlider = document.createElement("span");
    Object.assign(petSlider.style, {
        position: "absolute",
        top: "0",
        left: "0",
        right: "0",
        bottom: "0",
        backgroundColor: petChk.checked ? "#a29bfe" : "#3d3554",
        transition: "0.3s",
        borderRadius: "22px",
        boxShadow: petChk.checked
            ? "0 0 8px rgba(162, 155, 254, 0.5)"
            : "inset 0 2px 4px rgba(0,0,0,0.3)",
    });

    const petKnob = document.createElement("span");
    Object.assign(petKnob.style, {
        position: "absolute",
        height: "16px",
        width: "16px",
        left: petChk.checked ? "19px" : "3px",
        bottom: "3px",
        backgroundColor: "#ffffff",
        transition: "0.3s",
        borderRadius: "50%",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    });

    petChk.onchange = (e) => {
        qolConfig.enablePetsuitAnim = e.target.checked;
        petSlider.style.backgroundColor = e.target.checked ? "#a29bfe" : "#3d3554";
        petSlider.style.boxShadow = e.target.checked
            ? "0 0 8px rgba(162, 155, 254, 0.5)"
            : "inset 0 2px 4px rgba(0,0,0,0.3)";
        petKnob.style.left = e.target.checked ? "19px" : "3px";
        saveQolConfig();
    };

    petSlider.appendChild(petKnob);
    petSwitchLabel.appendChild(petChk);
    petSwitchLabel.appendChild(petSlider);

    petMain.appendChild(petLeft);
    petMain.appendChild(petSwitchLabel);

    const petSubList = document.createElement("div");
    Object.assign(petSubList.style, {
        display: "none",
        flexDirection: "column",
        paddingLeft: "8px",
        borderBottom: "1px solid #2e2640",
        backgroundColor: "#161320",
    });

    petExpand.onclick = () => {
        const isHidden = petSubList.style.display === "none";
        petSubList.style.display = isHidden ? "flex" : "none";
        petExpand.style.transform = isHidden ? "rotate(0deg)" : "rotate(-90deg)";
    };

    petSubList.appendChild(
        createNumberInput(
            "animCount",
            "Petsuit Animation Count",
            "Number of animation cycles to play.",
            1,
            100,
            true
        )
    );
    petSubList.appendChild(
        createNumberInput(
            "animDelay",
            "Petsuit Animation Delay (ms)",
            "Delay in milliseconds between pose changes (speed).",
            20,
            1000,
            true
        )
    );

    petContainer.appendChild(petMain);
    petContainer.appendChild(petSubList);
    qolBody.appendChild(petContainer);

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
                                typeof window.qolSavedIconState !== "undefined" ? window.qolSavedIconState : 1;
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
                                    msg.match(/(^|\s)\^([_^~.-]+)?\^/)
                                ) {
                                    SetSafeExpression("Eyes", "ShylyHappy");
                                } else if (
                                    qolConfig.emoticons.emoSurprisedZero &&
                                    msg.match(/0\.0|0_0|0x0/)
                                ) {
                                    SetSafeExpression("Eyes", "Surprised");
                                } else if (
                                    qolConfig.emoticons.emoSurprisedO &&
                                    msg.match(/(^|[\s,])(o\.o|o_o|oxo)(?=$|[\s,?!.])/i)
                                ) {
                                    SetSafeExpression("Eyes", "Surprised");
                                } else if (
                                    qolConfig.emoticons.emoCrazy &&
                                    msg.match(/@[_.,~-]*@/)
                                ) {
                                    SetSafeExpression("Eyes", "Crazy");
                                } else if (
                                    qolConfig.emoticons.emoDaydream &&
                                    (msg.match(/>[wWv_.,~x3]?<|>\/{2,5}</) ||
                                        msg.match(/(^|[\s~*])([xX][dDpP3>\]\)])(?=$|[\s.,?!~*])/i) ||
                                        msg.includes("><"))
                                ) {
                                    SetSafeExpression("Eyes", "Daydream");
                                } else if (
                                    qolConfig.emoticons.emoBlush &&
                                    msg.match(/(>|<)\/{2,5}(>|<)/)
                                ) {
                                    SetSafeExpression("Eyes", "Shy");
                                } else if (
                                    qolConfig.emoticons.emoHorny &&
                                    msg.match(
                                        /(^|[\s*~])([xX][qQ]|[xX]_[xX]|[oO]_[oO]|@_@|={2,}|=\[_\]=)(?=$|[\s.,?!~*])/i,
                                    )
                                ) {
                                    SetSafeExpression("Eyes", "Horny");
                                } else if (
                                    (qolConfig.emoticons.emoCatW && msg.match(/(^|[\s*~])(=w=|>w>|<w<|=\/{2,5}=)(?=$|[\s.,?!~*])/i)) ||
                                    (qolConfig.emoticons.emoVSmile && msg.match(/(^|[\s*~])(=v=|>v>|<v<)(?=$|[\s.,?!~*])/i))
                                ) {
                                    SetSafeExpression("Eyes", "Horny");
                                } else if (
                                    qolConfig.emoticons.emoCatWClosed &&
                                    msg.match(/(^|[\s*~])(>w<)(?=$|[\s.,?!~*])/i)
                                ) {
                                    SetSafeExpression("Eyes", "ShylyHappy");
                                } else if (
                                    qolConfig.emoticons.emoVSmileClosed &&
                                    msg.match(/(^|[\s*~])(>v<)(?=$|[\s.,?!~*])/i)
                                ) {
                                    SetSafeExpression("Eyes", "ShylyHappy");
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
                                    msg.match(/(^|[\s*~])(T[xw_v-]T|TT)(?=$|[\s.,?!~*])/)
                                ) {
                                    SetSafeExpression("Eyes", "Shy");
                                } else if (
                                    qolConfig.emoticons.emoFrown &&
                                    msg.match(/=~=/i)
                                ) {
                                    SetSafeExpression("Eyes", "Horny");
                                    SetSafeExpression("Blush", null);
                                } else if (
                                    qolConfig.emoticons.emoFrown &&
                                    msg.match(/D:/)
                                ) {
                                    SetSafeExpression("Eyes", "Dazed");
                                } else if (
                                    qolConfig.emoticons.emoFrown &&
                                    msg.match(/=[_^.-]=/i)
                                ) {
                                    SetSafeExpression("Eyes", "Closed");
                                } else if (
                                    qolConfig.emoticons.emoQwq &&
                                    msg.match(/(^|[\s*~])(qwq)(?=$|[\s.,?!~*])/i)
                                ) {
                                    SetSafeExpression("Eyes", "Shy");
                                }

                                // 2. MOUTH PARSING
                                if (
                                    qolConfig.emoticons.emoBlush &&
                                    msg.match(/(>|<)\/{2,5}(>|<)/)
                                ) {
                                    SetSafeExpression("Mouth", null);
                                } else if (
                                    qolConfig.emoticons.emoLaugh &&
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
                                    qolConfig.emoticons.emoFrown &&
                                    (msg.match(/=[_~^.-]=/i) || msg.match(/=~=/i) || msg.match(/(^|[\s*~])([x:;=]\()(?=$|[\s.,?!~*])/i))
                                ) {
                                    SetSafeExpression("Mouth", "Frown");
                                } else if (
                                    (qolConfig.emoticons.emoCat && msg.match(/(^|[\s*~])([x:;]3|[x:;]>)(?=$|[\s.,?!~*])/i)) ||
                                    (qolConfig.emoticons.emoCatW && msg.match(/(^|[\s*~])(=w=|>w>|<w<)(?=$|[\s.,?!~*])/i)) ||
                                    (qolConfig.emoticons.emoCatWClosed && msg.match(/(^|[\s*~])(>w<)(?=$|[\s.,?!~*])/i)) ||
                                    (qolConfig.emoticons.emoQwq &&
                                        msg.match(/(^|[\s*~])(qwq)(?=$|[\s.,?!~*])/i))
                                ) {
                                    SetSafeExpression("Mouth", "Happy");
                                } else if (
                                    qolConfig.emoticons.emoWink &&
                                    msg.match(/(^|[\s*~])([x:;][pP])(?=$|[\s.,?!~*])/i)
                                ) {
                                    SetSafeExpression("Mouth", "Ahegao");
                                } else if (
                                    (qolConfig.emoticons.emoHappy && msg.match(/\^~?\^|TwT/i)) ||
                                    (qolConfig.emoticons.emoVSmileClosed && msg.match(/(^|[\s*~])(>v<)(?=$|[\s.,?!~*])/i)) ||
                                    (qolConfig.emoticons.emoSmile && msg.match(/(^|[\s*~])([x:;=]\))(?=$|[\s.,?!~*])/i))
                                ) {
                                    SetSafeExpression("Mouth", "Smile");
                                } else if (
                                    qolConfig.emoticons.emoVSmile &&
                                    msg.match(/(^|[\s*~])(=v=|>v>|<v<)(?=$|[\s.,?!~*])/i)
                                ) {
                                    SetSafeExpression("Mouth", "Smirk");
                                } else if (
                                    qolConfig.emoticons.emoSad &&
                                    (msg.match(/@~?@|TxT/i) ||
                                        msg.match(/>[.,~_3]>|<[.,~_3]</))
                                ) {
                                    SetSafeExpression("Mouth", "Sad");
                                } else if (
                                    qolConfig.emoticons.emoPout &&
                                    (msg.match(/=\/{2,5}=|>\/{2,5}</) ||
                                        msg.match(/=3=|>3<|>3>|<3</))
                                ) {
                                    SetSafeExpression("Mouth", "Pout");
                                } else if (
                                    (qolConfig.emoticons.emoSurprisedZero &&
                                        msg.match(/(^|[\s*~])(0\.0|0_0|0x0)(?=$|[\s.,?!~*])/)) ||
                                    (qolConfig.emoticons.emoSurprisedO &&
                                        msg.match(/(^|[\s*~])(o\.o|o_o|oxo)(?=$|[\s.,?!~*])/i))
                                ) {
                                    SetSafeExpression("Mouth", "HalfOpen");
                                }

                                // 3. EYEBROWS & TEARS
                                if (
                                    qolConfig.emoticons.emoBlush &&
                                    msg.match(/(>|<)\/{2,5}(>|<)/)
                                ) {
                                    SetSafeExpression("Eyebrows", "Lowered");
                                } else if (
                                    qolConfig.emoticons.emoAngry &&
                                    msg.match(/(^|[\s*~])(>[:;xX=]|[:;xX=]<)(?=$|[\s.,?!~*])/)
                                ) {
                                    SetSafeExpression("Eyebrows", "Angry");
                                } else if (
                                    qolConfig.emoticons.emoSad &&
                                    (msg.match(/(^|[\s*~])(TT|T[xw]T)(?=$|[\s.,?!~*])/) ||
                                        msg.match(/(^|[\s*~])(><|T_T)(?=$|[\s.,?!~*])/))
                                ) {
                                    SetSafeExpression("Eyebrows", "Sad");
                                } else if (
                                    qolConfig.emoticons.emoDazed &&
                                    msg.match(/>[.,~_3]>|<[.,~_3]</)
                                ) {
                                    SetSafeExpression("Eyebrows", "Harsh");
                                } else if (
                                    (qolConfig.emoticons.emoSurprisedZero &&
                                        msg.match(/(^|[\s*~])(0\.0|0_0|0x0)(?=$|[\s.,?!~*])/)) ||
                                    (qolConfig.emoticons.emoSurprisedO &&
                                        msg.match(/(^|[\s*~])(o\.o|o_o|oxo)(?=$|[\s.,?!~*])/i))
                                ) {
                                    SetSafeExpression("Eyebrows", "Raised");
                                }
                                if (
                                    qolConfig.emoticons.emoSad &&
                                    (msg.match(/(^|[\s*~])(T[xw_v-]T|TT)(?=$|[\s.,?!~*])/) ||
                                        msg.match(/(^|[\s*~])(qwq)(?=$|[\s.,?!~*])/i))
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

                    let modApi = null;
                    if (typeof window.bcModSdk !== "undefined") {
                        try {
                            modApi = window.bcModSdk.registerMod({
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

                    // Smart Closed Eyes Logic
                    if (!window.smartClosedEyesHooked) {
                        window.smartClosedEyesHooked = true;
                        
                        const sceWrapper = (args, next) => {
                            let shouldBypass = false;
                            if (qolConfig.smartClosedEyes && typeof Player !== "undefined" && typeof Player.GetBlindLevel === "function") {
                                const hasBlindItem = Player.Effect && (Player.Effect.includes("BlindHeavy") || Player.Effect.includes("BlindNormal") || Player.Effect.includes("BlindLight"));
                                if (!hasBlindItem && Player.GetBlindLevel() > 0) {
                                    shouldBypass = true;
                                }
                            }
                            
                            let origGetBlindLevel = null;
                            if (shouldBypass) {
                                origGetBlindLevel = Player.GetBlindLevel;
                                Player.GetBlindLevel = function() { return 0; };
                            }
                            
                            try {
                                return next ? next(args) : args.origFn.apply(args.ctx, args.args);
                            } finally {
                                if (shouldBypass && origGetBlindLevel) {
                                    Player.GetBlindLevel = origGetBlindLevel;
                                }
                            }
                        };

                        if (modApi) {
                            modApi.hookFunction("ChatRoomUpdateDisplay", 0, sceWrapper);
                            modApi.hookFunction("ChatRoomClick", 0, sceWrapper);
                            if (typeof window.ChatRoomSync === "function") modApi.hookFunction("ChatRoomSync", 0, sceWrapper);
                        } else {
                            const hookManual = (fnName) => {
                                if (typeof window[fnName] === "function") {
                                    const orig = window[fnName];
                                    window[fnName] = function() {
                                        return sceWrapper({ origFn: orig, ctx: this, args: arguments });
                                    };
                                }
                            };
                            hookManual("ChatRoomUpdateDisplay");
                            hookManual("ChatRoomClick");
                            hookManual("ChatRoomSync");
                        }
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

    // -- Pose Animation Shortcut Button --
    const animBtn = document.createElement("div");
    animBtn.title = "Fast Pose Animation";
    Object.assign(animBtn.style, {
        position: "fixed",
        bottom: "60px", // Diturunkan lagi agar lebih merapat
        left: "12px",   
        width: "50px",
        height: "50px",
        backgroundImage: "url('https://raw.githubusercontent.com/Izumii99/BC-Desktop/main/Assets/arm_logo_chat-qol.png')", // Gunakan path relatif
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#ffffff",
        borderRadius: "4px",
        display: "none",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        border: "2px solid #000",
        userSelect: "none",
        zIndex: "2147483647"
    });

    let animInterval = null;
    let animFrame = 0;
    const animPoses = [
        "dialog-pose-button-grid-BodyUpper-OverTheHead",
        "dialog-pose-button-grid-BodyUpper-BackElbowTouch"
    ];

    const triggerPose = (btnId) => {
        let domBtn = document.getElementById(btnId);
        if (domBtn) {
            domBtn.click();
        } else {
            // Fallback jika menu pose tidak terbuka dan button DOM tidak ada
            if (typeof CharacterSetActivePose === "function" && typeof Player !== "undefined") {
                let poseName = btnId.split("-").pop();
                try {
                    CharacterSetActivePose(Player, poseName);
                    if (typeof ServerSend === "function") ServerSend("ChatRoomCharacterPoseUpdate", { Pose: Player.Pose });
                    if (typeof ChatRoomCharacterUpdate === "function") ChatRoomCharacterUpdate(Player);
                    if (typeof CharacterRefresh === "function") CharacterRefresh(Player);
                } catch(e) {}
            }
        }
    };

    animBtn.onclick = () => {
        if (animInterval) return; // Abaikan klik jika animasi sedang berjalan

        animBtn.style.backgroundColor = "rgba(100,200,100,0.8)";
        animFrame = 0;
        let count = 0;
        const maxCycles = parseInt(qolConfig.animCount) || 9;
        const speed = parseInt(qolConfig.animDelay) || 350;
        
        animInterval = setInterval(() => {
            try {
                let btnId = animPoses[animFrame % animPoses.length];
                triggerPose(btnId);
            } catch (e) {
                console.error("Anim error", e);
            }
            
            animFrame++;
            count++;
            if (count >= maxCycles) {
                clearInterval(animInterval);
                animInterval = null;
                animBtn.style.backgroundColor = "#ffffff";
                // Pastikan selalu berakhir di frame ke-2 (index 1 / BackElbowTouch)
                try {
                    triggerPose(animPoses[1]);
                } catch (e) {}
            }
        }, speed);
    };
    
    // Toggle animBtn visibility based on CurrentScreen & Petsuit/Restraint condition
    setInterval(() => {
        try {
            let isRestricted = false;
            if (typeof Player !== "undefined" && Player.Appearance) {
                isRestricted = Player.Appearance.some(a => {
                    if (!a.Asset) return false;
                    let name = a.Asset.Name.toLowerCase();
                    let group = a.Asset.Group.Name;
                    // Cek jika ada item petsuit, armbinder, atau straitjacket di tubuh
                    return name.includes("petsuit") || 
                           name.includes("pet suit") ||
                           name.includes("straitjacket") ||
                           name.includes("armbinder") ||
                           (group === "ItemArms" && a.Asset.IsRestraint);
                });
            }

            if (typeof CurrentScreen !== "undefined" && CurrentScreen === "ChatRoom" && isRestricted && qolConfig.enablePetsuitAnim) {
                if (!animBtn.parentNode) {
                    document.body.appendChild(animBtn);
                }
                animBtn.style.display = "flex";
            } else {
                animBtn.style.display = "none";
                if (animInterval) {
                    clearInterval(animInterval);
                    animInterval = null;
                    animBtn.style.backgroundColor = "#ffffff";
                }
            }
        } catch(e) {}
    }, 2000);

})();

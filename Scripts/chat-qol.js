(function () {
    "use strict";
    if (window !== window.top) return;

    let defaultIconStateApplied = false;

    let qolConfig = {
        enableEmoticons: false,
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
        enablePetsuitAnim: false,
        enableEchoMouthPull: false,
        animCount: 4,
        animDelay: 350,
        petsuitAlternate: false,
        enableScreenshotCleaner: true,
        enableWceEchoBridge: false,
        enableEchoSoundBridge: false,
        enableLceModLoader: true,
        enableFluidColor: false,
        fluidColor: "#547A82",
    };
    try {
        const saved = localStorage.getItem("BCDesktop_ChatQoL_Config");
        if (saved) {
            let parsed = JSON.parse(saved);
            const defaultEmo = qolConfig.emoticons;
            qolConfig = Object.assign(qolConfig, parsed);
            qolConfig.emoticons = Object.assign(
                defaultEmo,
                parsed.emoticons || {},
            );
        }
    } catch (e) {}
    
    if (qolConfig.enableLceModLoader) {
        const s = document.createElement("script");
        s.src = "https://likosoftware.github.io/BC-LCE/app.js";
        s.type = "module";
        document.head.appendChild(s);
        console.log("BC Desktop: Injected official BC-LCE mod loader.");
    }

    function saveQolConfig() {
        try {
            localStorage.setItem(
                "BCDesktop_ChatQoL_Config",
                JSON.stringify(qolConfig),
            );
        } catch (e) {}
    }
    
    // 

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
        boxSizing: "border-box",
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
        isSub = false,
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
        numInput.value =
            typeof qolConfig[key] !== "undefined" ? qolConfig[key] : min;
        Object.assign(numInput.style, {
            width: "60px",
            backgroundColor: "#1a1625",
            border: "1px solid #3d3554",
            color: "#f5f5f5",
            borderRadius: "4px",
            padding: "4px 8px",
            fontFamily: "inherit",
            fontSize: "14px",
            outline: "none",
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
        createToggle(
            null,
            "Cat Face (Horny)",
            "=w=, >w>, <w<, =////=",
            true,
            "emoCatW",
        ),
    );
    emoSubList.appendChild(
        createToggle(null, "Cat Face (Shy)", ">w<", true, "emoCatWClosed"),
    );
    emoSubList.appendChild(
        createToggle(null, "V-Smile", "=v=, >v>, <v<", true, "emoVSmile"),
    );
    emoSubList.appendChild(
        createToggle(null, "V-Smile (Shy)", ">v<", true, "emoVSmileClosed"),
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

    function createCategory(title, defaultOpen = false) {
        const container = document.createElement("div");
        Object.assign(container.style, {
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#1a1625",
        });

        const header = document.createElement("div");
        Object.assign(header.style, {
            display: "flex",
            alignItems: "center",
            padding: "14px 12px",
            cursor: "pointer",
            gap: "10px",
            backgroundColor: "#211c2e",
            transition: "background-color 0.2s",
            borderTop: "1px solid #2e2640",
            borderBottom: "1px solid #2e2640",
            borderRadius: "4px",
        });
        header.onmouseenter = () => (header.style.backgroundColor = "#2a233b");
        header.onmouseleave = () => (header.style.backgroundColor = "#211c2e");

        const expand = document.createElement("span");
        expand.innerHTML = "▼";
        Object.assign(expand.style, {
            color: "#a7a2b6",
            fontSize: "12px",
            width: "16px",
            textAlign: "center",
            transition: "transform 0.2s ease",
            transform: defaultOpen ? "rotate(0deg)" : "rotate(-90deg)",
        });

        const lbl = document.createElement("div");
        lbl.innerText = title;
        Object.assign(lbl.style, {
            fontSize: "15px",
            color: "#f5f5f5",
            fontWeight: "600",
        });

        header.appendChild(expand);
        header.appendChild(lbl);

        const body = document.createElement("div");
        Object.assign(body.style, {
            display: defaultOpen ? "flex" : "none",
            flexDirection: "column",
            padding: "0 12px",
        });

        header.onclick = () => {
            const isHidden = body.style.display === "none";
            body.style.display = isHidden ? "flex" : "none";
            expand.style.transform = isHidden
                ? "rotate(0deg)"
                : "rotate(-90deg)";
        };

        container.appendChild(header);
        container.appendChild(body);

        return { container, body };
    }

    const cat1 = createCategory("Legacy (Merged to LCE)", false);
    cat1.body.appendChild(
        createToggle(
            "enableLceModLoader",
            "Enable LCE Mod Loader",
            "Automatically injects the official BC-LCE mod into the game.",
        ),
    );
    cat1.body.appendChild(emoContainer);
    cat1.body.appendChild(
        createToggle(
            "enableEchoMouthPull",
            "Enable Pull to Side (Mouth)",
            "Allows pulling to side with mouth if hands are tied (Echo Addon).",
        ),
    );
    cat1.body.appendChild(
        createToggle(
            "enableWceEchoBridge",
            "WCE Echo Animation Bridge",
            "Triggers WCE animations for Echo Activity buttons (lick, kiss, cuddle, etc.).",
        ),
    );
    cat1.body.appendChild(
        createToggle(
            "enableEchoSoundBridge",
            "Echo Sound Bridge",
            "Triggers game audio for Echo Activity and LSCG actions (spank, whip, etc.).",
        ),
    );

    const cat2 = createCategory("Keyboard Shortcuts & Navigation", false);
    cat2.body.appendChild(
        createToggle(
            "enableWhisperShortcut",
            "Enable Whisper Shortcut",
            "Use Alt + 1-9, 0, -, = to whisper people in the room.",
        ),
    );
    cat2.body.appendChild(
        createToggle(
            "enableScrollShortcut",
            "Enable Quick Scroll to Bottom",
            "Use Ctrl + Space to quick scroll chat.",
        ),
    );
    cat2.body.appendChild(
        createToggle(
            "enableLianChatShortcut",
            "Enable LianChat Nav",
            "Use Shift+Tab or Tab to navigate LC menus.",
        ),
    );
    cat2.body.appendChild(
        createToggle(
            "enableBcarShortcut",
            "Shortcut Immersion",
            "Alt + C/V/B: ears, tail, wings (BCAR+). Alt + D: petsuit animation (Chat QoL or LCE).",
        ),
    );

    const cat3 = createCategory("Utilities & Animations", false);

    cat3.body.appendChild(
        createToggle(
            "smartClosedEyes",
            "Smart Closed Eyes",
            "See everyone while your eyes are closed (bypasses expression blindness).",
        ),
    );
    cat3.body.appendChild(
        createToggle(
            "forceUngarbled",
            "Force Ungarbled Messages",
            "Forces the game to always show ungarbled text.",
        ),
    );
    cat3.body.appendChild(
        createToggle(
            "enableFluidColor",
            "Fluid Color Enforcer",
            "Forces fluids & tears to stay colored (#547A82). Turned off by default.",
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
        transform: "rotate(-90deg)",
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
        petSlider.style.backgroundColor = e.target.checked
            ? "#a29bfe"
            : "#3d3554";
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
        petExpand.style.transform = isHidden
            ? "rotate(0deg)"
            : "rotate(-90deg)";
    };

    petSubList.appendChild(
        createNumberInput(
            "animCount",
            "Petsuit Animation Count",
            "Number of animation cycles to play.",
            1,
            100,
            true,
        ),
    );
    petSubList.appendChild(
        createNumberInput(
            "animDelay",
            "Petsuit Animation Delay (ms)",
            "Delay in milliseconds between pose changes (speed).",
            20,
            1000,
            true,
        ),
    );
    petSubList.appendChild(
        createToggle(
            "petsuitAlternate",
            "Alternating arm swing",
            "Alternates left and right arm swinging for a crawling look. (Visible to other BC-Desktop users!)",
        ),
    );

    petContainer.appendChild(petMain);
    petContainer.appendChild(petSubList);
    cat1.body.appendChild(petContainer);
    cat3.body.appendChild(
        createToggle(
            "enableScreenshotCleaner",
            "Screenshot Cleaner",
            "Hides UI elements when taking a screenshot (Photo Mode).",
        ),
    );
    cat3.body.appendChild(
        createToggle(
            "persistIconState",
            "Persist Chat Icon State",
            "Remembers your hidden/squint icon preference.",
        ),
    );

    qolBody.appendChild(cat1.container);
    qolBody.appendChild(cat2.container);
    qolBody.appendChild(cat3.container);

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
    document.addEventListener(
        "keydown",
        (e) => {
            if (e.key !== "Escape") return;
            if (qolModal.style.display !== "flex") return;
            e.preventDefault();
            e.stopPropagation();
            qolModal.style.display = "none";
        },
        true,
    );
    const animBtn = document.createElement("div");
    animBtn.id = "bcd-qol-anim-btn";
    animBtn.title = "Fast Pose Animation";
    
    Object.assign(animBtn.style, {
        position: "fixed",
        bottom: "60px",
        left: "12px",
        width: "50px",
        height: "50px",
        backgroundImage:
            "url('https://raw.githubusercontent.com/Izumii99/BC-Desktop/main/Assets/arm_logo_chat-qol.png')",
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
        zIndex: "100",
    });

    let animInterval = null;
    let animFrame = 0;

    function drawAlternatingPetsuit(character, raisedLeft, draw) {
        const original = {
            DrawPoseMapping: character.DrawPoseMapping,
            AppearanceLayers: character.AppearanceLayers,
            AppearanceMasks: character.AppearanceMasks,
            Pose: character.Pose,
            ActivePose: character.ActivePose
        };
        const copies = [];
        try {
            for (const pose of ['OverTheHead', 'BackElbowTouch']) {
                character.Pose = [pose];
                character.ActivePose = [pose];
                character.DrawPoseMapping = { ...original.DrawPoseMapping, BodyUpper: pose };
                
                const origOverrides = window.CharacterAppearanceUpdateOverrides;
                if (typeof origOverrides === 'function') {
                    window.CharacterAppearanceUpdateOverrides = function(C) {
                        origOverrides(C);
                        C.Pose = [pose];
                        C.ActivePose = [pose];
                        if (C.DrawPoseMapping) C.DrawPoseMapping.BodyUpper = pose;
                    };
                }
                
                const backups = [];
                for (let i = 0; i < character.Appearance.length; i++) {
                    const a = character.Appearance[i];
                    if (!a.Asset) continue;
                    const bp = { a, assetSetPose: a.Asset.SetPose, propSetPose: a.Property?.SetPose };
                    if (a.Asset.SetPose) a.Asset.SetPose = null;
                    if (a.Property && a.Property.SetPose) a.Property.SetPose = null;
                    backups.push(bp);
                }
                
                const origDrawGetImage = window.DrawGetImage;
                if (typeof origDrawGetImage === 'function') {
                    window.DrawGetImage = function(src) {
                        const img = origDrawGetImage(src);
                        if (!img) {
                            if (!window._chatQol_DummyImg) {
                                window._chatQol_DummyImg = new Image();
                                window._chatQol_DummyImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                            }
                            return window._chatQol_DummyImg;
                        }
                        return img;
                    };
                }
                
                try {
                    draw();
                } finally {
                    if (typeof origDrawGetImage === 'function') window.DrawGetImage = origDrawGetImage;
                    window.CharacterAppearanceUpdateOverrides = origOverrides;
                    for (const bp of backups) {
                        if (bp.assetSetPose !== undefined) bp.a.Asset.SetPose = bp.assetSetPose;
                        if (bp.propSetPose !== undefined && bp.a.Property) bp.a.Property.SetPose = bp.propSetPose;
                    }
                }
                copies.push(['Canvas', 'CanvasBlink'].map(key => {
                    const source = character[key];
                    if (!source) return null;
                    const copy = document.createElement('canvas');
                    copy.width = source.width;
                    copy.height = source.height;
                    copy.getContext('2d').drawImage(source, 0, 0);
                    return copy;
                }));
            }
            for (const [index, key] of ['Canvas', 'CanvasBlink'].entries()) {
                const canvas = character[key];
                if (!canvas) continue;
                const ctx = canvas.getContext('2d');
                const width = canvas.width, height = canvas.height, half = width / 2;
                ctx.clearRect(0, 0, width, height);
                for (const side of [0, 1]) {
                    const srcArr = copies[(side === 0) === raisedLeft ? 0 : 1];
                    const source = srcArr ? srcArr[index] : null;
                    if (source) ctx.drawImage(source, side * half, 0, half, height, side * half, 0, half, height);
                }
            }
        } finally {
            Object.assign(character, original);
            character.Pose = original.Pose || [];
            character.ActivePose = original.ActivePose || null;
        }
    }

    const animPoses = [
        "dialog-pose-button-grid-BodyUpper-OverTheHead",
        "dialog-pose-button-grid-BodyUpper-BackElbowTouch",
    ];

    const triggerPose = (btnId) => {
        let domBtn = document.getElementById(btnId);
        if (domBtn) {
            domBtn.click();
        } else if (
            typeof CharacterSetActivePose === "function" &&
            typeof Player !== "undefined"
        ) {
            let poseName = btnId.split("-").pop();
            try {
                CharacterSetActivePose(Player, poseName);
                if (typeof ServerSend === "function")
                    ServerSend("ChatRoomCharacterPoseUpdate", {
                        Pose: Player.Pose,
                    });
                if (typeof ChatRoomCharacterUpdate === "function")
                    ChatRoomCharacterUpdate(Player);
                if (typeof CharacterRefresh === "function")
                    CharacterRefresh(Player);
            } catch (e) {}
        }
    };

    // Set eye expression with an optional timer (seconds), same as SetSafeExpression internals
    const setEyeExpr = (expr, timer) => {
        try {
            if (
                typeof CharacterSetFacialExpression !== "function" ||
                typeof Player === "undefined"
            )
                return;
            if (timer != null) {
                CharacterSetFacialExpression(Player, "Eyes", expr, timer);
                CharacterSetFacialExpression(Player, "Eyes2", expr, timer);
            } else {
                CharacterSetFacialExpression(Player, "Eyes", expr);
                CharacterSetFacialExpression(Player, "Eyes2", expr);
            }
        } catch (e) {}
    };

    animBtn.onclick = () => {
        if (animInterval) return; // Ignore if animation is already running

        animBtn.style.backgroundColor = "rgba(100,200,100,0.8)";
        animFrame = 0;
        let count = 0;
        const maxCycles = parseInt(qolConfig.animCount) || 4;
        const speed = parseInt(qolConfig.animDelay) || 350;

        // Save current eye expression before changing it
        let savedEyeExpr = null;
        try {
            if (typeof Player !== "undefined" && Player.Appearance) {
                const eyeItem = Player.Appearance.find(
                    (a) =>
                        a.Asset &&
                        a.Asset.Group &&
                        a.Asset.Group.Name === "Eyes",
                );
                savedEyeExpr =
                    eyeItem && eyeItem.Property
                        ? eyeItem.Property.Expression
                        : null;
            }
        } catch (e) {}

        // Set Daydream eyes - refresh timer every frame so it never expires mid-anim
        const eyeRefreshSec =
            Math.ceil((parseInt(qolConfig.animDelay) || 350) / 1000) + 3;
        setEyeExpr("Daydream", eyeRefreshSec);

        if (typeof ServerSend === "function" && qolConfig.petsuitAlternate) {
            ServerSend("ChatRoomChat", {
                Type: "Hidden",
                Content: "ChatQol_PetsuitAnim",
                Dictionary: [{ delay: speed, cycles: maxCycles }]
            });
        }

        animInterval = setInterval(() => {
            try {
                // Purely local rendering, bypass CharacterSetActivePose
                if (typeof CharacterRefresh === "function") CharacterRefresh(Player, false);
                setEyeExpr("Daydream", eyeRefreshSec); // Refresh eye timer each tick
            } catch (e) {
                console.error("Anim error", e);
            }

            animFrame++;
            count++;
            let petsuitRaisedLeft = (animFrame % 2 === 0);
            
            if (count >= maxCycles) {
                clearInterval(animInterval);
                animInterval = null;
                animBtn.style.backgroundColor = "#ffffff";
                try {
                    if (typeof CharacterRefresh === "function") CharacterRefresh(Player, false);
                    // Only restore if there was a prior expression; null = let timer expire naturally
                    if (savedEyeExpr) setEyeExpr(savedEyeExpr, null);
                } catch (e) {}
            }
        }, speed);
    };

    setInterval(() => {
        try {
            if (
                typeof Player !== "undefined" &&
                Player &&
                Player.ImmersionSettings
            ) {
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
                                typeof window.qolSavedIconState !== "undefined"
                                    ? window.qolSavedIconState
                                    : 1;
                        }
                    };
                    window.ChatRoomLoad.hasQolHook = true;
                }

                if (!window._chatQol_AnimalReceiverHooked && typeof window.ChatRoomMessage === "function") {
                    window._chatQol_AnimalReceiverHooked = true;
                    
                    const HIDDEN_MSG_PREFIX = 'LCEAnimalAnim_';
                    const SLOTS = { Ears: 'HairAccessory2', Tails: 'TailStraps', Wings: 'Wings' };
                    const renderers = new Map();
                    
                    const origChatRoomMessage = window.ChatRoomMessage;
                    window.ChatRoomMessage = function (data) {
                        origChatRoomMessage(data);
                        
                        if (data && data.Type === 'Hidden' && data.Content === 'ChatQol_PetsuitAnim') {
                    const id = data.Sender;
                    if (typeof id !== 'number' || id === window.Player?.MemberNumber) return;
                    
                    const dict = Array.isArray(data.Dictionary) ? data.Dictionary[0] : data.Dictionary;
                    if (!dict || typeof dict.delay !== 'number' || typeof dict.cycles !== 'number') return;
                    
                    const char = (window.ChatRoomCharacter || []).find(c => c.MemberNumber === id);
                    if (!char) return;
                    
                    const delay = Math.max(20, Math.min(2000, dict.delay));
                    const cycles = Math.max(1, Math.min(100, dict.cycles));
                    
                    if (!window._chatQol_PetsuitRemoteAnims) window._chatQol_PetsuitRemoteAnims = new Map();
                    const remoteAnims = window._chatQol_PetsuitRemoteAnims;
                    
                    if (remoteAnims.has(id)) clearTimeout(remoteAnims.get(id).timer);
                    
                    let frame = 0;
                    function step() {
                        if (window.CurrentScreen !== 'ChatRoom' || frame >= cycles * 2) {
                            remoteAnims.delete(id);
                            if (typeof window.CharacterRefresh === 'function') window.CharacterRefresh(char, false);
                            return;
                        }
                        
                        frame++;
                        remoteAnims.set(id, { frame, timer: setTimeout(step, delay) });
                        if (typeof window.CharacterRefresh === 'function') window.CharacterRefresh(char, false);
                    }
                    step();
                }

                if (data && data.Type === 'Hidden' && data.Content && data.Content.startsWith(HIDDEN_MSG_PREFIX)) {
                            const id = data.Sender;
                            if (typeof id !== 'number' || id === window.Player?.MemberNumber) return;
                            
                            const dict = Array.isArray(data.Dictionary) ? data.Dictionary[0] : data.Dictionary;
                            if (!dict || !dict.type || !dict.state1 || !dict.state2) return;
                            if (!SLOTS[dict.type]) return;
                            
                            const char = (window.ChatRoomCharacter || []).find(c => c.MemberNumber === id);
                            if (!char) return;
                            
                            const delay = typeof dict.delay === 'number' ? Math.max(10, Math.min(2000, dict.delay)) : 250;
                            const cycles = typeof dict.cycles === 'number' ? Math.max(1, Math.min(40, dict.cycles)) : 2;
                            
                            const buildState = s => {
                                if (!s || typeof s !== 'object' || typeof s.Name !== 'string') return null;
                                let color = s.Color;
                                if (typeof color !== 'string' && typeof color !== 'undefined' && !Array.isArray(color)) color = 'Default';
                                if (Array.isArray(color)) color = color.filter(c => typeof c === 'string');
                                const state = {
                                    Name: s.Name,
                                    Color: color
                                };
                                for (const key of Object.keys(s)) {
                                    if (['Name', 'Color', 'Asset', 'Model', 'ModelLoad'].includes(key) || typeof s[key] === 'function') continue;
                                    state[key] = structuredClone(s[key]);
                                }
                                return state;
                            };
                            
                            const applyState = (char, slot, state) => {
                                let item = char.Appearance.find(i => i.Asset && i.Asset.Group.Name === slot);
                                if (!item || item.Asset.Name !== state.Name) {
                                    item = window.InventoryWear(char, state.Name, slot, state.Color, undefined, undefined, undefined, false);
                                    if (!item) return;
                                } else {
                                    item.Color = Array.isArray(state.Color) ? structuredClone(state.Color) : state.Color;
                                }
                                for (const key of Object.keys(state)) {
                                    if (['Name', 'Color'].includes(key)) continue;
                                    if (key === 'Property' && item.Property) {
                                        item.Property = Object.assign({}, item.Property, structuredClone(state[key]));
                                    } else {
                                        item[key] = structuredClone(state[key]);
                                    }
                                }
                            };
                            
                            const state1 = buildState(dict.state1);
                            const state2 = buildState(dict.state2);
                            if (!state1 || !state2) return;
                            
                            const slot = SLOTS[dict.type];
                            let originalState;
                            if (renderers.has(id + dict.type)) {
                                const r = renderers.get(id + dict.type);
                                clearTimeout(r.timer);
                                originalState = r.originalState;
                            } else {
                                const currentItem = char.Appearance.find(item => item.Asset && item.Asset.Group.Name === slot);
                                if (!currentItem) return;
                                originalState = { Name: currentItem.Asset.Name, Color: Array.isArray(currentItem.Color) ? structuredClone(currentItem.Color) : currentItem.Color };
                                for (const key of Object.keys(currentItem)) {
                                    if (['Asset', 'Model', 'ModelLoad', 'Name', 'Color'].includes(key) || typeof currentItem[key] === 'function') continue;
                                    originalState[key] = structuredClone(currentItem[key]);
                                }
                            }
                            
                            const states = [state2, state1];
                            let i = 0;
                            
                            function step() {
                                if (window.CurrentScreen !== 'ChatRoom') {
                                    renderers.delete(id + dict.type);
                                    return;
                                }
                                const currentItemNow = char.Appearance.find(item => item.Asset && item.Asset.Group.Name === slot);
                                if (!currentItemNow || (currentItemNow.Asset.Name !== state1.Name && currentItemNow.Asset.Name !== state2.Name && currentItemNow.Asset.Name !== originalState.Name)) {
                                    renderers.delete(id + dict.type);
                                    return;
                                }
                                
                                if (i >= cycles * 2) {
                                    applyState(char, slot, originalState);
                                    if (typeof window.CharacterRefresh === 'function') window.CharacterRefresh(char, false, false);
                                    renderers.delete(id + dict.type);
                                    return;
                                }
                                
                                const state = states[i % 2];
                                applyState(char, slot, state);
                                if (typeof window.CharacterRefresh === 'function') window.CharacterRefresh(char, false, false);
                                
                                i++;
                                renderers.set(id + dict.type, { timer: setTimeout(step, delay), originalState });
                            }
                            
                            step();
                        }
                    };
                }

                if (
                    !window._chatQol_BuildCanvasHooked &&
                    typeof window.CharacterAppearanceBuildCanvas === "function"
                ) {
                    window._chatQol_BuildCanvasHooked = true;
                    const origBuildCanvas = window.CharacterAppearanceBuildCanvas;
                    window.CharacterAppearanceBuildCanvas = function (C) {
                        const isLocal = (C === Player && animInterval);
                        const remoteAnim = window._chatQol_PetsuitRemoteAnims ? window._chatQol_PetsuitRemoteAnims.get(C.MemberNumber) : null;
                        
                        if (isLocal || remoteAnim) {
                            const frameToUse = isLocal ? animFrame : remoteAnim.frame;
                            const isAlternate = isLocal ? qolConfig.petsuitAlternate : true; // remote anim is always alternate
                            const raisedLeft = (frameToUse % 2 === 0);
                            
                            if (isAlternate) {
                                drawAlternatingPetsuit(C, raisedLeft, () => {
                                    origBuildCanvas(C);
                                });
                            } else {
                                const pose = animPoses[frameToUse % animPoses.length].split("-").pop();
                                const original = {
                                    DrawPoseMapping: C.DrawPoseMapping,
                                    AppearanceLayers: C.AppearanceLayers,
                                    AppearanceMasks: C.AppearanceMasks,
                                    Pose: C.Pose,
                                    ActivePose: C.ActivePose
                                };
                                try {
                                    C.Pose = [pose];
                                    if (C.ActivePose) C.ActivePose = [pose];
                                    C.DrawPoseMapping = { ...original.DrawPoseMapping, BodyUpper: pose };
                                    const origOverrides = window.CharacterAppearanceUpdateOverrides;
                                    if (typeof origOverrides === 'function') {
                                        window.CharacterAppearanceUpdateOverrides = function(char) {
                                            origOverrides(char);
                                            char.Pose = [pose];
                                            char.ActivePose = [pose];
                                            if (char.DrawPoseMapping) char.DrawPoseMapping.BodyUpper = pose;
                                        };
                                    }
                                    
                                    const backups = [];
                                    for (let i = 0; i < C.Appearance.length; i++) {
                                        const a = C.Appearance[i];
                                        if (!a.Asset) continue;
                                        const bp = { a, assetSetPose: a.Asset.SetPose, propSetPose: a.Property?.SetPose };
                                        if (a.Asset.SetPose) a.Asset.SetPose = null;
                                        if (a.Property && a.Property.SetPose) a.Property.SetPose = null;
                                        backups.push(bp);
                                    }
                                    
                                    const origDrawGetImage = window.DrawGetImage;
                                    if (typeof origDrawGetImage === 'function') {
                                        window.DrawGetImage = function(src) {
                                            const img = origDrawGetImage(src);
                                            if (!img) {
                                                if (!window._chatQol_DummyImg) {
                                                    window._chatQol_DummyImg = new Image();
                                                    window._chatQol_DummyImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                                                }
                                                return window._chatQol_DummyImg;
                                            }
                                            return img;
                                        };
                                    }
                                    
                                    try {
                                        origBuildCanvas(C);
                                    } finally {
                                        if (typeof origDrawGetImage === 'function') window.DrawGetImage = origDrawGetImage;
                                        window.CharacterAppearanceUpdateOverrides = origOverrides;
                                        for (const bp of backups) {
                                            if (bp.assetSetPose !== undefined) bp.a.Asset.SetPose = bp.assetSetPose;
                                            if (bp.propSetPose !== undefined && bp.a.Property) bp.a.Property.SetPose = bp.propSetPose;
                                        }
                                    }
                                } finally {
                                    Object.assign(C, original);
                                    C.Pose = original.Pose || [];
                                    C.ActivePose = original.ActivePose || null;
                                }
                            }
                            return;
                        }
                        origBuildCanvas(C);
                    };
                }

                if (
                    typeof window.ChatRoomSendChat === "function" &&
                    !window._qolHasEmoticonHook
                ) {
                    window._qolHasEmoticonHook = true;

                    const doQolLogic = function () {
                        if (!qolConfig.enableEmoticons) return;
                        try {
                            let chatInput = document.getElementById("InputChat");
                            let msg = chatInput ? chatInput.value : "";
                            
                            // Matikan textmoji khusus untuk Whisper sesuai request
                            if (msg.startsWith("/w ") || msg.startsWith("/whisper ")) return;
                            
                            if (msg && typeof CharacterSetFacialExpression === "function" && typeof Player !== "undefined" && Player) {
                                
                                const QOL_FACES = [
                                    [/^>[\\/]{2,}<$/, { Eyes: 'Daydream', Mouth: 'Pout', Eyebrows: 'Lowered' }, 'emoBlush'],
                                    [/^(?:>\/{2,5}>|<\/{2,5}<)$/i, { Eyes: 'Shy', Mouth: null, Eyebrows: 'Lowered' }, 'emoBlush'],
                                    [/^=[\\/]{2,}=$/, { Eyes: 'Horny', Mouth: 'Pout' }, 'emoBlush'],
                                    [/^(?:o|0)[\\/]{2,}(?:o|0)$/i, { Eyes: 'Surprised', Mouth: 'HalfOpen', Eyebrows: 'Raised' }, 'emoBlush'],
                                    // Floating faces
                                    [/^<3+$/i, { Emoticon: 'Hearts' }, 'emoFloating'],
                                    // Classic faces
                                    [/^(?:0[uuv]0|o[uuv]o)$/i, { Eyes: 'Happy', Mouth: 'Open' }, 'emoSmile'],
                                    [/^(?:[x:=]3|[x:=]>)$/i, { Mouth: 'Happy' }, 'emoCat'],
                                    [/^(?:;3|;>)$/i, { Eyes: null, Eyes1: 'Closed', Mouth: 'Happy' }, 'emoCat'],
                                    [/^(?:=w=|>w>|<w<|=\/{2,5}=)$/i, { Eyes: 'Horny', Mouth: 'Happy' }, 'emoCatW'],
                                    [/^>w<$/i, { Eyes: 'ShylyHappy', Mouth: 'Happy' }, 'emoCatWClosed'],
                                    [/^(?:=v=|>v>|<v<)$/i, { Eyes: 'Horny', Mouth: 'Smirk' }, 'emoVSmile'],
                                    [/^>v<$/i, { Eyes: 'ShylyHappy', Mouth: 'Smile' }, 'emoVSmileClosed'],
                                    [/^(?:\^~?\^)$/i, { Eyes: 'ShylyHappy', Mouth: 'Smile' }, 'emoHappy'],
                                    [/^(?:[x:;=]\))$/i, { Mouth: 'Smile' }, 'emoSmile'],
                                    [/^(?:[x:;]d)$/i, { Mouth: 'Laughing' }, 'emoLaugh'],
                                    [/^(?:0[._x]0)$/i, { Eyes: 'Surprised', Mouth: 'HalfOpen', Eyebrows: 'Raised' }, 'emoSurprisedZero'],
                                    [/^(?:o[._x]o)$/i, { Eyes: 'Surprised', Mouth: 'HalfOpen', Eyebrows: 'Raised' }, 'emoSurprisedO'],
                                    [/^x[_.]?x$/i, { Eyes: 'Dazed', Mouth: 'Sad' }, 'emoDazed'],
                                    [/^@[_.,~-]*@$/, { Eyes: 'Crazy', Mouth: 'Sad' }, 'emoCrazy'],
                                    [/^(?:>[.,~_]>|<[.,~_]<)$/, { Eyes: 'Dazed', Eyebrows: 'Harsh', Mouth: 'Sad' }, 'emoDazed'],
                                    [/^(?:==|=[_]=|[xq]_[xq]|o_o)$/i, { Eyes: 'Horny' }, 'emoHorny'],
                                    [/^;[pd3>\]]$/i, { Eyes: null, Eyes1: 'Closed', Mouth: 'Ahegao' }, 'emoWink'],
                                    [/^:[pd3>\]]$/i, { Eyes: null, Mouth: 'Ahegao' }, 'emoWink'],
                                    [/^(?:t[_wv.-]?t|tt)$/i, { Eyes: 'Shy', Mouth: 'Sad', Fluids: 'TearsHigh', Eyebrows: 'Sad' }, 'emoSad'],
                                    [/^qwq$/i, { Eyes: 'Shy', Mouth: 'Happy', Fluids: 'TearsHigh' }, 'emoQwq'],
                                    [/^(?:=~=|=.=|=,=)$/i, { Eyes: 'Horny', Mouth: 'Frown', Blush: null }, 'emoFrown'],
                                    [/^d:$/i, { Eyes: 'Dazed', Mouth: 'Sad' }, 'emoFrown'],
                                    [/^=[_~^-]=$/i, { Eyes: 'Closed', Mouth: 'Frown' }, 'emoFrown'],
                                    [/^-_-$/i, { Eyes: 'Dazed', Eyebrows: 'Harsh', Mouth: 'Frown' }, 'emoFrown'],
                                    [/^(?:[x:;=]\()$/i, { Mouth: 'Frown' }, 'emoFrown'],
                                    [/^(?:=\/{2,5}=|>\/{2,5}<|=3=|>3<|>3>|<3<)$/i, { Mouth: 'Pout' }, 'emoPout'],
                                    [/^(?:>[:;x=]|[:;x=]<)$/i, { Eyebrows: 'Angry' }, 'emoAngry'],
                                    [/^>~<$/i, { Eyes: 'Daydream', Mouth: 'Smirk' }, 'emoDaydream'],
                                    [/^(?:>[wv._x3]?<|><)$/i, { Eyes: 'Daydream' }, 'emoDaydream']
                                ];
                                const getPunctuationEffect = (str) => {
                                    if (str.includes('?')) {
                                        return {
                                            Emoticon: 'Confusion',
                                            Eyebrows: str.match(/(?:\?!|!\?)/) ? 'Angry' : 'OneRaised'
                                        };
                                    } else if (str.includes('!')) {
                                        let brows = null;
                                        if (str.match(/!{3,}/)) brows = 'Angry';
                                        else if (str.match(/!{2}/)) brows = 'Harsh';
                                        return { Emoticon: 'Exclamation', Eyebrows: brows };
                                    } else if (str.includes('#')) {
                                        return { Emoticon: 'Annoyed' };
                                    }
                                    return null;
                                };

                                let finalFace = {};
                                let lastPunctuation = null;
                                let hasTextmojiEyebrows = false;

                                for (const token of String(msg).split(/\s+/)) {
                                    if (/https?:\/\//i.test(token)) continue;
                                    
                                    let match = null;
                                    let baseToken = token;
                                    let strippedMarks = '';
                                    
                                    const evaluate = (t) => {
                                        for (const [pattern, face, configKey] of QOL_FACES) {
                                            if (qolConfig.emoticons[configKey] && pattern.test(t)) return face;
                                        }
                                        return null;
                                    };
                                    
                                    match = evaluate(baseToken);
                                    if (!match) {
                                        const markMatch = baseToken.match(/([?!#~;'",.]+)$/);
                                        if (markMatch) {
                                            strippedMarks = markMatch[1];
                                            baseToken = baseToken.slice(0, -strippedMarks.length);
                                            match = evaluate(baseToken);
                                        }
                                    }
                                    if (!match) {
                                        const slashMatch = baseToken.match(/([/\\]{2,})$/);
                                        if (slashMatch) {
                                            baseToken = baseToken.slice(0, -slashMatch[1].length);
                                            match = evaluate(baseToken);
                                        }
                                    }
                                    if (!match) {
                                        const preMatch = baseToken.match(/^([?!#]+)/);
                                        if (preMatch) {
                                            baseToken = baseToken.slice(preMatch[1].length);
                                            match = evaluate(baseToken);
                                        }
                                    }

                                    if (match) {
                                        Object.assign(finalFace, match);
                                        if (match.Eyebrows !== undefined) hasTextmojiEyebrows = true;

                                        const slashMatch = token.match(/[/\\]{2,}/);
                                        if (slashMatch) {
                                            const count = slashMatch[0].length;
                                            if (qolConfig.emoticons.emoBlush) {
                                                const levels = { 2: 'Low', 3: 'Medium', 4: 'High', 5: 'VeryHigh', 6: 'Extreme' };
                                                finalFace.Blush = levels[count] || 'Extreme';
                                                if (count >= 5) {
                                                    finalFace.Emoticon = 'Hearts';
                                                }
                                            }
                                        }
                                        if (qolConfig.emoticons.emoSweat && /['";]/.test(strippedMarks)) {
                                            finalFace.Fluids = finalFace.Fluids || 'TearsLow';
                                            finalFace.Emoticon = 'Tear';
                                        }
                                        if (qolConfig.emoticons.emoFloating) {
                                            const allMarks = token.replace(baseToken, '');
                                            const effect = getPunctuationEffect(allMarks);
                                            if (effect) lastPunctuation = effect;
                                        }
                                    } else if (qolConfig.emoticons.emoFloating) {
                                        const marksOnly = token.replace(/[^?!#]/g, '');
                                        if (marksOnly === token && marksOnly.length > 0) {
                                            const effect = getPunctuationEffect(token);
                                            if (effect) lastPunctuation = effect;
                                        }
                                    }
                                }

                                if (lastPunctuation) {
                                    finalFace.Emoticon = lastPunctuation.Emoticon;
                                    if (lastPunctuation.Eyebrows && !hasTextmojiEyebrows) {
                                        finalFace.Eyebrows = lastPunctuation.Eyebrows;
                                    }
                                }

                                // AFK / BRB / Back / Zzz logic
                                let isOOC = msg.trim().startsWith("(");
                                if (qolConfig.emoticons.emoAfk && isOOC) {
                                    let afkMatch = msg.match(/\b(afk|brb|back)\b/i);
                                    if (afkMatch) {
                                        let type = afkMatch[1].toLowerCase();
                                        if (type === "back") {
                                            finalFace._afkType = null;
                                            if (typeof CharacterSetFacialExpression === 'function') CharacterSetFacialExpression(Player, 'Eyes', null, null);
                                        } else {
                                            finalFace._afkType = type.charAt(0).toUpperCase() + type.slice(1);
                                        }
                                        delete finalFace.Emoticon;
                                    }
                                }



                                // Sleep (zzz) logic (permanent)
                                if (qolConfig.emoticons.emoFloating && /\bzzz+\b/i.test(msg)) {
                                    finalFace._afkType = "Sleep";
                                    if (typeof CharacterSetFacialExpression === 'function') CharacterSetFacialExpression(Player, 'Eyes', 'Closed', null);
                                    delete finalFace.Emoticon;
                                }

                                if (Object.keys(finalFace).length > 0) {
                                    let isChat = !msg.startsWith("/") && !msg.startsWith("*");
                                    let isWCEAnim = typeof window.bceAnimationEngineEnabled === "function" && window.bceAnimationEngineEnabled();
                                    
                                    let delay = 0;
                                    if (isChat) {
                                        // Calculate slash duration
                                        let slashDuration = 0;
                                        for (const token of String(msg).split(/\s+/)) {
                                            if (/https?:\/\//i.test(token)) continue;
                                            const count = token.match(/[/\\]{2,}/)?.[0].length ?? 0;
                                            if (count) slashDuration = Math.max(slashDuration, count * 1000);
                                        }
                                        
                                        if (slashDuration > 0) {
                                            delay = Math.min(Math.max(slashDuration, 5000), 30000);
                                        } else if (isWCEAnim) {
                                            delay = Math.min(msg.length * 65, 5000);
                                        } else {
                                            let time = 0;
                                            for (const char of msg) {
                                                if (/[\u4e00-\u9fa5]/.test(char)) time += 300;
                                                else if (/\w/i.test(char)) time += 150;
                                            }
                                            delay = Math.min(time, 30000);
                                        }
                                    }

                                    setTimeout(() => {
                                        for (const [group, expr] of Object.entries(finalFace)) {
                                            if (group === '_afkType') {
                                                CharacterSetFacialExpression(Player, "Emoticon", expr, null);
                                                continue;
                                            }
                                            CharacterSetFacialExpression(Player, group, expr, 5);
                                        }
                                        if (Object.keys(finalFace).some(g => g.startsWith("Eyes") || g === "Mouth")) {
                                            setTimeout(() => { if (Player && typeof CharacterRefresh === "function") CharacterRefresh(Player); }, 150);
                                            setTimeout(() => { if (Player && typeof CharacterRefresh === "function") CharacterRefresh(Player); }, 500);
                                        }
                                    }, delay);
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

                    if (
                        typeof CurrentScreen !== "undefined" &&
                        CurrentScreen === "ChatRoom" &&
                        typeof window.ChatRoomHideIconState !== "undefined"
                    ) {
                        if (qolConfig.persistIconState) {
                            window.qolSavedIconState =
                                window.ChatRoomHideIconState;
                        }
                    }

                    if (!window.smartClosedEyesHooked) {
                        window.smartClosedEyesHooked = true;

                        const TARGET = "拉到身边";
                        const doActivityCheckPrerequisite = (args, next) => {
                            const prereq = args[0],
                                acting = args[1],
                                acted = args[2],
                                group = args[3];
                            if (
                                qolConfig.enableEchoMouthPull &&
                                window._pullToSideActive
                            ) {
                                if (prereq === "UseHands")
                                    return (
                                        !acting.IsMouthBlocked() || next(args)
                                    );
                                if (
                                    typeof prereq === "string" &&
                                    prereq.startsWith("Luzi_")
                                )
                                    return true;
                            }
                            return next(args);
                        };

                        const doActivityCheckPrerequisites = (args, next) => {
                            const activity = args[0],
                                acting = args[1],
                                acted = args[2],
                                group = args[3];

                            // FORCE ALLOW ONLY "PULL TO ONE SIDE" FOR ANY NECK RESTRAINT
                            if (
                                activity.Name === TARGET ||
                                activity.Name === "拉到身边" ||
                                activity.Name === "PullToSide" ||
                                (activity.Name &&
                                    activity.Name.includes("拉到"))
                            ) {
                                if (
                                    acting.CanInteract() &&
                                    !acting.Effect.includes("MergedFingers")
                                ) {
                                    if (qolConfig.enableEchoMouthPull) {
                                        window._pullToSideActive = true;
                                        // Wait a tiny bit and disable it so it only affects this check
                                        setTimeout(() => {
                                            window._pullToSideActive = false;
                                        }, 0);
                                    }
                                    return true; // Bypass all checks and allow ONLY Pull To Side!
                                }
                            }

                            if (
                                qolConfig.enableEchoMouthPull &&
                                activity.Name === TARGET
                            ) {
                                window._pullToSideActive = true;
                                try {
                                    if (!activity.Prerequisite) return true;
                                    return activity.Prerequisite.every(
                                        (pre) => {
                                            if (typeof pre === "function")
                                                return true;
                                            return window.ActivityCheckPrerequisite(
                                                pre,
                                                acting,
                                                acted,
                                                group,
                                            );
                                        },
                                    );
                                } finally {
                                    window._pullToSideActive = false;
                                }
                            }
                            return next(args);
                        };

                        const doServerSend = (args, next) => {
                            const Message = args[0],
                                Data = args[1];
                            if (
                                qolConfig.enableEchoMouthPull &&
                                Message === "ChatRoomChat" &&
                                Data &&
                                Data.Type === "Activity" &&
                                Data.Dictionary
                            ) {
                                const isPullToSide = Data.Dictionary.some(
                                    (d) =>
                                        d.ActivityName === TARGET ||
                                        (d.Tag === "ActivityName" &&
                                            typeof d.Text === "string" &&
                                            (d.Text === "Activity" + TARGET ||
                                                d.Text === TARGET ||
                                                d.Text.includes(TARGET))),
                                );

                                if (
                                    isPullToSide &&
                                    typeof Player !== "undefined" &&
                                    !Player.CanInteract() &&
                                    !Player.IsMouthBlocked()
                                ) {
                                    let targetName = "them";
                                    if (
                                        typeof CurrentCharacter !==
                                            "undefined" &&
                                        CurrentCharacter
                                    ) {
                                        targetName = CurrentCharacter.Name;
                                    } else {
                                        const otherEntry = Data.Dictionary.find(
                                            (d) =>
                                                (d.TargetCharacter &&
                                                    d.TargetCharacter !==
                                                        Player.MemberNumber) ||
                                                (d.SourceCharacter &&
                                                    d.SourceCharacter !==
                                                        Player.MemberNumber),
                                        );
                                        const otherId = otherEntry
                                            ? otherEntry.TargetCharacter ||
                                              otherEntry.SourceCharacter
                                            : null;
                                        if (
                                            otherId &&
                                            typeof ChatRoomCharacter !==
                                                "undefined"
                                        ) {
                                            const target =
                                                ChatRoomCharacter.find(
                                                    (c) =>
                                                        c.MemberNumber ===
                                                        otherId,
                                                );
                                            if (target)
                                                targetName = target.Name;
                                        }
                                    }

                                    let pronoun = "her";
                                    if (Player.Pronoun) {
                                        const p = String(
                                            Player.Pronoun,
                                        ).toLowerCase();
                                        if (
                                            p.includes("he") ||
                                            p.includes("him")
                                        )
                                            pronoun = "his";
                                        else if (
                                            p.includes("they") ||
                                            p.includes("them")
                                        )
                                            pronoun = "their";
                                    }

                                    setTimeout(() => {
                                        if (typeof ServerSend === "function") {
                                            const sender =
                                                window._origServerSend_QoL ||
                                                window.ServerSend;
                                            sender.call(
                                                window,
                                                "ChatRoomChat",
                                                {
                                                    Content: `bites onto the leash and pulls ${targetName} with ${pronoun} mouth`,
                                                    Type: "Emote",
                                                    Dictionary: [],
                                                },
                                            );
                                        }
                                    }, 150);

                                    if (
                                        typeof CharacterSetFacialExpression ===
                                        "function"
                                    ) {
                                        CharacterSetFacialExpression(
                                            Player,
                                            "Mouth",
                                            "LipBite",
                                        );
                                        if (
                                            typeof CharacterRefresh ===
                                            "function"
                                        )
                                            CharacterRefresh(Player);
                                        if (
                                            typeof ChatRoomCharacterUpdate ===
                                            "function"
                                        )
                                            ChatRoomCharacterUpdate(Player);
                                    }
                                }
                            }
                            return next(args);
                        };

                        const doChatRoomCanBeLeashed = (args, next) => {
                            if (
                                qolConfig.enableEchoMouthPull &&
                                window._pullToSideActive
                            )
                                return true;
                            return next(args);
                        };

                        if (modApi) {
                            modApi.hookFunction(
                                "ActivityCheckPrerequisite",
                                0,
                                doActivityCheckPrerequisite,
                            );
                            modApi.hookFunction(
                                "ActivityCheckPrerequisites",
                                0,
                                doActivityCheckPrerequisites,
                            );
                            modApi.hookFunction("ServerSend", 0, doServerSend);
                            if (typeof ChatRoomCanBeLeashed === "function") {
                                modApi.hookFunction(
                                    "ChatRoomCanBeLeashed",
                                    0,
                                    doChatRoomCanBeLeashed,
                                );
                            }
                        } else {
                            const origCheck = window.ActivityCheckPrerequisite;
                            window.ActivityCheckPrerequisite = function () {
                                return doActivityCheckPrerequisite(
                                    arguments,
                                    origCheck.bind(this),
                                );
                            };

                            const origChecks =
                                window.ActivityCheckPrerequisites;
                            window.ActivityCheckPrerequisites = function () {
                                return doActivityCheckPrerequisites(
                                    arguments,
                                    origChecks.bind(this),
                                );
                            };

                            if (!window._origServerSend_QoL)
                                window._origServerSend_QoL = window.ServerSend;
                            window.ServerSend = function () {
                                return doServerSend(
                                    arguments,
                                    window._origServerSend_QoL.bind(this),
                                );
                            };

                            if (typeof ChatRoomCanBeLeashed === "function") {
                                const origLeash = window.ChatRoomCanBeLeashed;
                                window.ChatRoomCanBeLeashed = function () {
                                    return doChatRoomCanBeLeashed(
                                        arguments,
                                        origLeash.bind(this),
                                    );
                                };
                            }
                        }

                        const sceWrapper = (args, next) => {
                            let shouldBypass = false;
                            if (
                                qolConfig.smartClosedEyes &&
                                typeof Player !== "undefined" &&
                                typeof Player.GetBlindLevel === "function"
                            ) {
                                const hasBlindItem =
                                    Player.Effect &&
                                    (Player.Effect.includes("BlindHeavy") ||
                                        Player.Effect.includes("BlindNormal") ||
                                        Player.Effect.includes("BlindLight"));
                                if (
                                    !hasBlindItem &&
                                    Player.GetBlindLevel() > 0
                                ) {
                                    shouldBypass = true;
                                }
                            }

                            let origGetBlindLevel = null;
                            if (shouldBypass) {
                                origGetBlindLevel = Player.GetBlindLevel;
                                Player.GetBlindLevel = function () {
                                    return 0;
                                };
                            }

                            try {
                                return next
                                    ? next(args)
                                    : args.origFn.apply(args.ctx, args.args);
                            } finally {
                                if (shouldBypass && origGetBlindLevel) {
                                    Player.GetBlindLevel = origGetBlindLevel;
                                }
                            }
                        };

                        if (modApi) {
                            modApi.hookFunction(
                                "ChatRoomUpdateDisplay",
                                0,
                                sceWrapper,
                            );
                            modApi.hookFunction("ChatRoomClick", 0, sceWrapper);
                            if (typeof window.ChatRoomSync === "function")
                                modApi.hookFunction(
                                    "ChatRoomSync",
                                    0,
                                    sceWrapper,
                                );
                        } else {
                            const hookManual = (fnName) => {
                                if (typeof window[fnName] === "function") {
                                    const orig = window[fnName];
                                    window[fnName] = function () {
                                        return sceWrapper({
                                            origFn: orig,
                                            ctx: this,
                                            args: arguments,
                                        });
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

            hookLcePetIcon();

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

            let isRestricted = false;
            if (typeof Player !== "undefined" && Player.Appearance) {
                isRestricted = Player.Appearance.some((a) => {
                    if (!a.Asset) return false;
                    let name = a.Asset.Name.toLowerCase();
                    let group = a.Asset.Group.Name;

                    return (
                        name.includes("petsuit") ||
                        name.includes("pet suit") ||
                        name.includes("straitjacket") ||
                        name.includes("armbinder") ||
                        (group === "ItemArms" && a.Asset.IsRestraint)
                    );
                });
            }

            if (
                typeof CurrentScreen !== "undefined" &&
                CurrentScreen === "ChatRoom" &&
                isRestricted &&
                qolConfig.enablePetsuitAnim
            ) {
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
        } catch (e) {}
    }, 2000);

    // ponytail: LCE keeps its petsuit toggle and position private, so the button is located
    // by the 37x37 OverTheHead icon it draws each frame (button rect = icon - 4px).
    // Breaks if LCE changes that icon/size; upgrade path is an exposed LCE API.
    let lcePetBtn = null;
    function hookLcePetIcon() {
        if (hookLcePetIcon.done || typeof window.DrawImageResize !== "function") return;
        hookLcePetIcon.done = true;
        const spy = (a) => {
            if (a[0] === "Icons/Poses/OverTheHead.png" && a[3] === 37 && a[4] === 37)
                lcePetBtn = { x: a[1] - 4, y: a[2] - 4, t: Date.now() };
        };
        try {
            window.bcModSdk
                .registerMod({
                    name: "BCDesktop_ShortcutImmersion",
                    fullName: "Shortcut Immersion",
                    version: "1.0.0",
                    repository: "https://github.com/Izumii99/BC-Desktop",
                })
                .hookFunction("DrawImageResize", 0, (args, next) => {
                    spy(args);
                    return next(args);
                });
        } catch {
            const orig = window.DrawImageResize;
            window.DrawImageResize = function () {
                spy(arguments);
                return orig.apply(this, arguments);
            };
        }
    }

    document.addEventListener(
        "keydown",
        (e) => {
            if (!qolConfig.enableBcarShortcut) return;
            if (!e.altKey || e.ctrlKey || e.shiftKey || e.code !== "KeyD") return;
            if (qolConfig.enablePetsuitAnim) {
                if (animBtn && animBtn.style.display === "flex") {
                    e.preventDefault();
                    animBtn.onclick();
                }
                return;
            }
            if (
                !lcePetBtn ||
                Date.now() - lcePetBtn.t > 500 ||
                typeof ChatRoomClick !== "function" ||
                CurrentScreen !== "ChatRoom"
            )
                return;
            e.preventDefault();
            const ox = MouseX, oy = MouseY;
            MouseX = lcePetBtn.x + 22;
            MouseY = lcePetBtn.y + 22;
            try {
                ChatRoomClick();
            } finally {
                MouseX = ox;
                MouseY = oy;
            }
        },
        true,
    );

    document.addEventListener(
        "keydown",
        (e) => {
            let senderList = document.getElementById("LC-Message-SenderList");
            let isLianChatOpen = senderList && senderList.offsetParent !== null;

            if (e.key === "Tab") {
                if (!qolConfig.enableLianChatShortcut) return;
                e.preventDefault();

                if (isLianChatOpen) {
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

    document.addEventListener(
        "keydown",
        (e) => {
            if (!qolConfig.enableWhisperShortcut) return;

            if (!e.altKey || e.ctrlKey || e.shiftKey) return;
            if (
                typeof CurrentScreen === "undefined" ||
                CurrentScreen !== "ChatRoom"
            )
                return;

            let index = -1;
            let code = e.code || "";
            let digitMatch = /^(?:Digit|Numpad)([0-9])$/.exec(code);
            if (digitMatch) {
                let val = parseInt(digitMatch[1], 10);
                index = val === 0 ? 9 : val - 1;
            } else if (code === "Minus" || code === "NumpadSubtract") {
                index = 10;
            } else if (code === "Equal" || code === "NumpadAdd") {
                index = 11;
            }
            if (index === -1) return;

            let myNumber =
                typeof Player !== "undefined" && Player
                    ? Player.MemberNumber
                    : null;
            // ponytail: prioritize drawlist (respects Echo reorder/current page), then append the rest of the room so blind players can still target everyone
            let drawlist = Array.isArray(window.ChatRoomCharacterDrawlist)
                ? window.ChatRoomCharacterDrawlist
                : [];
            let fullRoom = Array.isArray(window.ChatRoomCharacter)
                ? window.ChatRoomCharacter
                : [];

            let otherChars = [];

            drawlist.forEach((c) => {
                if (
                    c &&
                    c.MemberNumber != null &&
                    c.MemberNumber !== myNumber
                ) {
                    otherChars.push(c);
                }
            });

            fullRoom.forEach((c) => {
                if (
                    c &&
                    c.MemberNumber != null &&
                    c.MemberNumber !== myNumber
                ) {
                    if (
                        !otherChars.some(
                            (added) => added.MemberNumber === c.MemberNumber,
                        )
                    ) {
                        otherChars.push(c);
                    }
                }
            });
            if (index >= otherChars.length) return;

            let target = otherChars[index];
            if (!target || target.MemberNumber == null) return;

            e.preventDefault();
            e.stopPropagation();

            let isToggleOff =
                window.ChatRoomTargetMemberNumber != null &&
                window.ChatRoomTargetMemberNumber == target.MemberNumber;
            let newTarget = isToggleOff ? null : target.MemberNumber;

            if (typeof window.ChatRoomSetTarget === "function") {
                window.ChatRoomSetTarget(newTarget);
            } else {
                window.ChatRoomTargetMemberNumber = newTarget;
            }

            let chatInput = document.getElementById("InputChat");
            if (chatInput) chatInput.focus();
        },
        true,
    );

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

    // --- Screenshot Cleaner + Hide Addon Buttons at Icon State 2+ ---
    // Ported from screenshot-cleaner.js; polls until game draw functions exist.
    (function () {
        if (window._bcdScreenCleanerLoaded) return;
        window._bcdScreenCleanerLoaded = true;

        const SC_PASSTHROUGH = ["DrawCharacter", "ChatRoomDrawBackground"];
        const SC_UI = [
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
        const SC_IMG = [
            "DrawImage",
            "DrawImageEx",
            "DrawImageResize",
            "DrawImageZoomCanvas",
        ];
        let ptDepth = 0;

        function scSuppressed() {
            if (ptDepth > 0) return false;
            if (
                qolConfig.enableScreenshotCleaner &&
                window.CommonPhotoMode === true
            )
                return true;
            if (
                typeof CurrentScreen !== "undefined" &&
                CurrentScreen === "ChatRoom" &&
                typeof window.ChatRoomHideIconState !== "undefined" &&
                window.ChatRoomHideIconState >= 2
            )
                return true;
            return false;
        }

        function isBg(s) {
            return typeof s === "string" && s.indexOf("Backgrounds/") === 0;
        }

        function scInstall() {
            const sdk =
                typeof window.bcModSdk !== "undefined"
                    ? window.bcModSdk.registerMod(
                          {
                              name: "BCD Screenshot Cleaner",
                              fullName: "BC Desktop Screenshot Cleaner",
                              version: "2.1.0",
                              repository:
                                  "https://github.com/Izumii99/BC-Desktop",
                          },
                          { allowReplace: false },
                      )
                    : null;

            function scHook(name, handler) {
                if (typeof window[name] !== "function") return;
                if (sdk) {
                    sdk.hookFunction(name, 11, handler);
                    return;
                }
                const orig = window[name];
                window[name] = function () {
                    const a = Array.prototype.slice.call(arguments);
                    return handler(a, (x) => orig.apply(this, x));
                };
            }

            SC_PASSTHROUGH.forEach((n) =>
                scHook(n, (a, next) => {
                    ptDepth++;
                    try {
                        return next(a);
                    } finally {
                        ptDepth--;
                    }
                }),
            );

            SC_UI.forEach((n) =>
                scHook(n, (a, next) => {
                    if (scSuppressed()) return;
                    return next(a);
                }),
            );

            SC_IMG.forEach((n) =>
                scHook(n, (a, next) => {
                    if (scSuppressed() && !isBg(a[0])) return true;
                    return next(a);
                }),
            );

            scHook("DrawRect", (a, next) => {
                const isFullCanvas =
                    a[0] <= 0 && a[1] <= 0 && a[2] >= 2000 && a[3] >= 1000;
                if (scSuppressed() && !isFullCanvas) return;
                return next(a);
            });

            console.log(
                "BC Desktop: Screenshot Cleaner + Icon Hide armed" +
                    (sdk ? " via bcModSdk." : "."),
            );
        }

        const waitForGame = setInterval(() => {
            if (
                typeof window.DrawButton === "function" &&
                typeof window.DrawCharacter === "function" &&
                typeof window.CommonTakePhoto === "function"
            ) {
                clearInterval(waitForGame);
                scInstall();
            }
        }, 500);
    })();

    // --- WCE <-> Echo Activity Bridge ---
    (function () {
        const initBridge = () => {
            if (!qolConfig.enableWceEchoBridge) return;
            if (
                !globalThis.bce_ActivityTriggers ||
                !Array.isArray(globalThis.bce_ActivityTriggers)
            ) {
                setTimeout(initBridge, 1500);
                return;
            }
            if (globalThis._bcdWceEchoBridgeLoaded) return;
            globalThis._bcdWceEchoBridgeLoaded = true;

            const mappings = [
                {
                    Event: "Lick",
                    Keywords: "舔|Lick|吸吮|Suck|含住|舔弄|舔舐|舔舔|用嘴脱掉",
                },
                { Event: "LongKiss", Keywords: "深吻|Deep Kiss|DeepKiss" },
                { Event: "KissOnLips", Keywords: "接吻|Kiss" },
                { Event: "LipBite", Keywords: "咬|Bite" },
                { Event: "DroolSides", Keywords: "流口水|Drool" },
                { Event: "OpenMouth", Keywords: "张开嘴|Open Mouth|OpenMouth" },
                {
                    Event: "CloseMouth",
                    Keywords: "闭上嘴|Close Mouth|CloseMouth|吞咽口水|Swallow",
                },
                { Event: "Spank", Keywords: "拍打|打屁股|Spank|Flick|Bap" },
                { Event: "Cuddle", Keywords: "拥抱|贴贴|抱|Cuddle|Hug" },
                { Event: "Pinch", Keywords: "掐|拧|掐住|拧住|Pinch" },
                { Event: "Hit", Keywords: "Hit" },
                { Event: "ShockLight", Keywords: "吓|Shock|Startle" },
                { Event: "Smile", Keywords: "微笑|Smile" },
                { Event: "Giggle", Keywords: "轻笑|Giggle" },
                { Event: "Laugh", Keywords: "大笑|Laugh|笑" },
                { Event: "Blush", Keywords: "脸红|害羞|Blush|Shy" },
                { Event: "Sad", Keywords: "委屈|伤心|Sad|Cry" },
                { Event: "Angry", Keywords: "生气|愤怒|Angry|Mad" },
            ];

            const aggressiveEvents = ["Spank", "Hit", "Pinch", "ShockLight", "DroolSides", "LipBite"];
            for (const m of mappings) {
                const processedKeywords = m.Keywords.split('|').map(k => {
                    if (/^[a-z\s]+$/i.test(k)) {
                        return `(?<=^|[^a-z])(?:${k})(?:s|es|ed|ing)?(?=$|[^a-z])`;
                    }
                    return k;
                }).join('|');

                const tagRegex = new RegExp(
                    `^Chat(Other|Self)-.*-.*(${processedKeywords}).*$`,
                    "i",
                );
                const textRegex = new RegExp(`(${processedKeywords})`, "i");
                
                const matchers = [
                    {
                        Tester: {
                            test(c) {
                                let matched = false;
                                let t = "";
                                if (tagRegex.test(c)) {
                                    matched = true;
                                } else if (c && c.includes("Luzi_") && typeof ActivityDictionaryText === "function") {
                                    t = ActivityDictionaryText(c);
                                    if (t && textRegex.test(t)) matched = true;
                                }

                                if (!matched) return false;

                                if (m.Event === "KissOnLips" || m.Event === "LongKiss") {
                                    if (c && /^Chat(Other|Self)-Item[A-Za-z]+-/i.test(c)) {
                                        if (!c.includes("ItemMouth")) return false;
                                    }
                                    if (!t && typeof ActivityDictionaryText === "function") {
                                        t = ActivityDictionaryText(c) || "";
                                    }
                                    if (t) {
                                        const nonMouthParts = /(nose|cheek|forehead|neck|ear|hand|foot|arm|leg|chest|breast|belly|stomach|toe|finger|shoulder|back|butt|ass|pussy|dick|cock|vulva|boob|nipple|鼻子|脸颊|脸|额头|脖子|耳朵|手|脚|胳膊|腿|胸|肚子|脚趾|手指|肩膀|背|屁股|阴部|肉棒|阴茎|乳房|乳头)/i;
                                        if (nonMouthParts.test(t) && !/(lip|mouth|嘴|唇)/i.test(t)) {
                                            return false;
                                        }
                                    }
                                }

                                return true;
                            },
                        },
                        Criteria: { TargetIsPlayer: true },
                    }
                ];

                if (!aggressiveEvents.includes(m.Event)) {
                    matchers.unshift({
                        Tester: {
                            test(c) {
                                if (tagRegex.test(c)) return true;
                                if (
                                    c &&
                                    c.includes("Luzi_") &&
                                    typeof ActivityDictionaryText ===
                                        "function"
                                ) {
                                    const t = ActivityDictionaryText(c);
                                    return t && textRegex.test(t);
                                }
                                return false;
                            },
                        },
                        Criteria: { SenderIsPlayer: true },
                    });
                }

                globalThis.bce_ActivityTriggers.push({
                    Event: m.Event,
                    Type: "Activity",
                    Matchers: matchers,
                });
            }
        };
        setTimeout(initBridge, 1000);
    })();

    // --- Echo & LSCG Sound Bridge ---
    (function () {
        const initSoundBridge = () => {
            if (!qolConfig.enableEchoSoundBridge) return;
            if (typeof AudioActions === "undefined" || !Array.isArray(AudioActions)) {
                setTimeout(initSoundBridge, 1500);
                return;
            }

            if (globalThis._bcdEchoSoundBridgeLoaded) return;
            globalThis._bcdEchoSoundBridgeLoaded = true;

            const soundMappings = [
                {
                    Keywords: "拍打|打屁股|Spank|Flick|Bap|Slap|扇耳光",
                    Sound: "SpankSkin"
                },
                {
                    Keywords: "Whip|鞭打",
                    Sound: "WhipCrack"
                },
                {
                    Keywords: "Pinch|掐|拧",
                    Sound: "LeatherStretchingShort"
                },
                {
                    Keywords: "Hit|打",
                    Sound: "SmackCrop"
                }
            ];

            for (const m of soundMappings) {
                const processedKeywords = m.Keywords.split('|').map(k => {
                    if (/^[a-z\s]+$/i.test(k)) {
                        return `(?<=^|[^a-z])(?:${k})(?:s|es|ed|ing)?(?=$|[^a-z])`;
                    }
                    return k;
                }).join('|');

                const tagRegex = new RegExp(`^Chat(Other|Self)-.*-.*(${processedKeywords}).*$`, "i");
                const textRegex = new RegExp(`(${processedKeywords})`, "i");

                AudioActions.unshift({
                    IsAction: (data) => {
                        if (data.Type !== "Activity") return false;
                        
                        // Safety Check: Only intercept if it's an Echo Activity or LSCG action.
                        // This ensures we NEVER override native item sounds (like crops, floggers, etc).
                        let isEcho = false;
                        if (Array.isArray(data.Dictionary)) {
                            isEcho = data.Dictionary.some(d => typeof d.Tag === "string" && d.Tag.includes("Luzi_"));
                        }
                        let isLSCG = typeof data.Content === "string" && data.Content.includes("Luzi");
                        
                        if (!isEcho && !isLSCG) return false;

                        let c = data.Content;
                        if (tagRegex.test(c)) return true;
                        if (c && c.includes("Luzi_") && typeof ActivityDictionaryText === "function") {
                            const t = ActivityDictionaryText(c);
                            return t && textRegex.test(t);
                        }
                        return false;
                    },
                    GetSoundEffect: () => m.Sound
                });
            }
            console.log("BC Desktop: Echo Sound Bridge Loaded (Added " + soundMappings.length + " sound triggers)");
        };
        setTimeout(initSoundBridge, 1000);
    })();

    // Fluid Color Enforcer
    (function () {
        function applyFluidsColor() {
            if (!qolConfig.enableFluidColor) return;
            if (typeof Player !== 'undefined' && Player && Player.Appearance && Player.MemberNumber) {
                let target = qolConfig.fluidColor || "#547A82";
                let fluidsItem = Player.Appearance.find(a => a.Asset && a.Asset.Group && a.Asset.Group.Name === "Fluids");
                if (fluidsItem) {
                    if (fluidsItem.Color !== target && fluidsItem.Color !== target.toLowerCase()) {
                        fluidsItem.Color = target;
                        if (typeof CharacterRefresh === "function") CharacterRefresh(Player);
                        if (typeof ServerPlayerAppearanceSync === "function") ServerPlayerAppearanceSync();
                        console.log(`[ChatQoL] Fluids color enforced to ${target}`);
                    }
                }
            }
        }

        let origLoginResponse = window.LoginResponse;
        if (typeof origLoginResponse === "function") {
            window.LoginResponse = function (...args) {
                origLoginResponse(...args);
                setTimeout(applyFluidsColor, 2000);
            };
        } else {
            let fluidInitInterval = setInterval(() => {
                if (typeof Player !== 'undefined' && Player && Player.MemberNumber) {
                    applyFluidsColor();
                    clearInterval(fluidInitInterval);
                }
            }, 1000);
        }

        let origReturnScreen = window.CharacterAppearanceReturnToPreviousScreen;
        if (typeof origReturnScreen === "function") {
            window.CharacterAppearanceReturnToPreviousScreen = function (...args) {
                applyFluidsColor();
                origReturnScreen(...args);
            };
        }
    })();
})();
